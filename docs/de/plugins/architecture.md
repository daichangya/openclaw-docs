---
read_when:
    - Native OpenClaw-Plugins erstellen oder debuggen
    - Das Plugin-Capability-Modell oder Ownership-Grenzen verstehen
    - An der Plugin-Ladepipeline oder Registry arbeiten
    - Provider-Laufzeit-Hooks oder Channel-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Capability-Modell, Ownership, Contracts, Ladepipeline und Laufzeit-Helper'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-07T06:20:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c4b0602df12965a29881eab33b0885f991aeefa2a3fdf3cefc1a7770d6dabe0
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **umfassende Architekturreferenz**. Praktische Anleitungen findest du hier:
  - [Plugins installieren und verwenden](/de/tools/plugin) — Benutzerleitfaden
  - [Erste Schritte](/de/plugins/building-plugins) — erstes Plugin-Tutorial
  - [Channel-Plugins](/de/plugins/sdk-channel-plugins) — einen Messaging-Kanal erstellen
  - [Provider-Plugins](/de/plugins/sdk-provider-plugins) — einen Modell-Provider erstellen
  - [SDK-Übersicht](/de/plugins/sdk-overview) — Import-Map und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des OpenClaw-Plugin-Systems.

## Öffentliches Capability-Modell

Capabilities sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Capability-Typen:

| Capability             | Registrierungsmethode                           | Beispiel-Plugins                     |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Textinferenz           | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Sprache                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Echtzeit-Stimme        | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web-Suche              | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / Messaging      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Ein Plugin, das null Capabilities registriert, aber Hooks, Tools oder
Services bereitstellt, ist ein **veraltetes reines Hook-Plugin**. Dieses Muster wird weiterhin vollständig unterstützt.

### Externe Kompatibilitätshaltung

Das Capability-Modell ist im Core eingeführt und wird heute von gebündelten/nativen Plugins
verwendet, aber externe Plugin-Kompatibilität braucht weiterhin einen strengeren Maßstab als „es ist
exportiert, also ist es eingefroren“.

Aktuelle Leitlinien:

- **bestehende externe Plugins:** hookbasierte Integrationen funktionsfähig halten; dies
  als Kompatibilitätsbasis behandeln
- **neue gebündelte/native Plugins:** explizite Capability-Registrierung gegenüber
  vendorspezifischen Direktzugriffen oder neuen reinen Hook-Designs bevorzugen
- **externe Plugins, die Capability-Registrierung übernehmen:** erlaubt, aber die
  Capability-spezifischen Helper-Oberflächen als in Entwicklung behandeln, sofern die Dokumentation einen
  Vertrag nicht ausdrücklich als stabil markiert

Praktische Regel:

- Capability-Registrierungs-APIs sind die beabsichtigte Richtung
- veraltete Hooks bleiben während des Übergangs der sicherste Weg ohne Bruch für externe Plugins
- exportierte Helper-Subpaths sind nicht alle gleich; bevorzuge den schmalen dokumentierten
  Vertrag, nicht zufällige Helper-Exporte

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability** -- registriert genau einen Capability-Typ (zum Beispiel ein
  reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Capability-Typen (zum Beispiel
  besitzt `openai` Textinferenz, Sprache, Medienverständnis und Bild-
  generierung)
- **hook-only** -- registriert nur Hooks (typisiert oder benutzerdefiniert), keine Capabilities,
  Tools, Befehle oder Services
- **non-capability** -- registriert Tools, Befehle, Services oder Routen, aber keine
  Capabilities

Verwende `openclaw plugins inspect <id>`, um die Form und Capability-
Aufschlüsselung eines Plugins zu sehen. Details siehe [CLI-Referenz](/cli/plugins#inspect).

### Veraltete Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für reine Hook-Plugins
unterstützt. Veraltete reale Plugins sind weiterhin darauf angewiesen.

Ausrichtung:

- funktionsfähig halten
- als veraltet dokumentieren
- für Arbeiten mit Modell-/Provider-Overrides `before_model_resolve` bevorzugen
- für Prompt-Mutationen `before_prompt_build` bevorzugen
- erst entfernen, wenn die reale Nutzung sinkt und Fixture-Abdeckung die Sicherheit der Migration belegt

### Kompatibilitätssignale

Wenn du `openclaw doctor` oder `openclaw plugins inspect <id>` ausführst, kannst du
eines dieser Labels sehen:

| Signal                     | Bedeutung                                                    |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, was veraltet ist      |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` führen heute dazu, dass dein Plugin kaputtgeht --
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Ebenen:

1. **Manifest + Erkennung**
   OpenClaw findet Kandidaten-Plugins aus konfigurierten Pfaden, Workspace-Wurzeln,
   globalen Extension-Wurzeln und gebündelten Extensions. Die Erkennung liest zuerst native
   Manifeste `openclaw.plugin.json` sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Speicher ausgewählt ist.
3. **Laufzeitladen**
   Native OpenClaw-Plugins werden im Prozess über jiti geladen und registrieren
   Capabilities in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
4. **Nutzung der Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-
   Setup, Hooks, HTTP-Routen, CLI-Befehle und Services bereitzustellen.

Speziell für die Plugin-CLI ist die Erkennung von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Zeit-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich bei der ersten Aufruf registrieren

Dadurch bleibt plugin-eigener CLI-Code im Plugin, während OpenClaw Root-
Befehlsnamen bereits vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Erkennung + Konfigurationsvalidierung sollten aus **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- natives Laufzeitverhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Trennung ermöglicht es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu erklären und
UI-/Schema-Hinweise zu erstellen, bevor die vollständige Laufzeit aktiv ist.

### Channel-Plugins und das gemeinsame Message-Tool

Channel-Plugins müssen für normale Chat-Aktionen kein separates Senden-/Bearbeiten-/Reagieren-Tool registrieren.
OpenClaw behält ein gemeinsames `message`-Tool im Core, und
Channel-Plugins besitzen die kanalspezifische Erkennung und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den Host für das gemeinsame `message`-Tool, Prompt-Verdrahtung, Sitzungs-/Thread-
  Buchführung und den Dispatch der Ausführung
- Channel-Plugins besitzen die bereichsbezogene Aktionserkennung, Capability-Erkennung und
  alle kanalspezifischen Schemafragmente
- Channel-Plugins besitzen die providerspezifische Konversationsgrammatik für Sitzungen, also
  wie Konversations-IDs Thread-IDs kodieren oder von übergeordneten Konversationen erben
- Channel-Plugins führen die endgültige Aktion über ihren Aktionsadapter aus

Für Channel-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser vereinheitlichte Discovery-
Aufruf ermöglicht es einem Plugin, seine sichtbaren Aktionen, Capabilities und Schema-
Beiträge gemeinsam zurückzugeben, damit diese Teile nicht auseinanderdriften.

Der Core übergibt den Laufzeitbereich in diesen Discovery-Schritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Kanal kann
Message-Aktionen je nach aktivem Konto, aktuellem Raum/Thread/Nachricht oder
vertrauenswürdiger Anforderer-Identität ausblenden oder anzeigen, ohne kanalspezifische Zweige im
Core-`message`-Tool fest zu verdrahten.

Deshalb bleiben Routing-Änderungen für eingebettete Runner weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität in die Plugin-
Discovery-Grenze weiterzuleiten, damit das gemeinsame `message`-Tool die richtige kanalbezogene
Oberfläche für den aktuellen Zug bereitstellt.

Für kanalbezogene Ausführungs-Helper sollten gebündelte Plugins die Ausführungs-
Laufzeit in ihren eigenen Extension-Modulen behalten. Der Core besitzt nicht länger die Discord-,
Slack-, Telegram- oder WhatsApp-Message-Action-Laufzeiten unter `src/agents/tools`.
Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Subpaths, und gebündelte
Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren
extension-eigenen Modulen importieren.

Dieselbe Grenze gilt generell für providerbenannte SDK-Seams: Der Core sollte
keine kanalspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Extensions importieren. Wenn der Core ein Verhalten braucht, soll er
entweder das eigene `api.ts`-/`runtime-api.ts`-Barrel des gebündelten Plugins verwenden oder den Bedarf
in eine schmale generische Capability im gemeinsamen SDK anheben.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Kanäle, die in das gemeinsame
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische
  Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verschiebt das gemeinsame Umfrage-Parsing jetzt auf die Zeit nach dem Ablehnen
durch den Plugin-Umfrage-Dispatch, sodass plugin-eigene Umfrage-Handler
kanalspezifische Umfragefelder akzeptieren können, ohne zuerst vom generischen Umfrage-Parser blockiert zu werden.

Siehe [Ladepipeline](#load-pipeline) für die vollständige Startsequenz.

## Capability-Ownership-Modell

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelbecken für unzusammenhängende Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise alle OpenClaw-bezogenen Oberflächen
  dieses Unternehmens besitzen
- ein Feature-Plugin sollte normalerweise die vollständige von ihm eingeführte
  Feature-Oberfläche besitzen
- Kanäle sollten gemeinsame Core-Capabilities nutzen, statt Provider-Verhalten ad hoc neu zu implementieren

Beispiele:

- das gebündelte Plugin `openai` besitzt OpenAI-Modell-Provider-Verhalten und OpenAI-
  Sprach-, Echtzeit-Stimmen-, Medienverständnis- und Bildgenerierungsverhalten
- das gebündelte Plugin `elevenlabs` besitzt ElevenLabs-Sprachverhalten
- das gebündelte Plugin `microsoft` besitzt Microsoft-Sprachverhalten
- das gebündelte Plugin `google` besitzt Google-Modell-Provider-Verhalten sowie Google-
  Medienverständnis-, Bildgenerierungs- und Web-Suchverhalten
- das gebündelte Plugin `firecrawl` besitzt Firecrawl-Web-Abrufverhalten
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre
  Backends für Medienverständnis
- das Plugin `qwen` besitzt Qwen-Text-Provider-Verhalten sowie
  Medienverständnis- und Videogenerierungsverhalten
- das Plugin `voice-call` ist ein Feature-Plugin: Es besitzt Anruftransport, Tools,
  CLI, Routen und Twilio-Media-Stream-Bridging, nutzt aber gemeinsame Sprach-,
  Echtzeit-Transkriptions- und Echtzeit-Stimmen-Capabilities, statt
  Vendor-Plugins direkt zu importieren

Der angestrebte Endzustand ist:

- OpenAI lebt in einem Plugin, selbst wenn es Textmodelle, Sprache, Bilder und
  zukünftiges Video umfasst
- ein anderer Vendor kann dasselbe für seine eigene Oberfläche tun
- Kanäle ist es egal, welches Vendor-Plugin den Provider besitzt; sie verwenden den
  gemeinsamen Capability-Vertrag, den der Core bereitstellt

Das ist die zentrale Unterscheidung:

- **plugin** = Ownership-Grenze
- **capability** = Core-Vertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, ist die erste Frage nicht
„welcher Provider sollte die Videoverarbeitung fest verdrahten?“ Die erste Frage ist: „welches
ist der Core-Capability-Vertrag für Video?“ Sobald dieser Vertrag existiert, können Vendor-Plugins
sich dafür registrieren und Channel-/Feature-Plugins können ihn nutzen.

Wenn die Capability noch nicht existiert, ist der richtige Schritt normalerweise:

1. die fehlende Capability im Core definieren
2. sie typisiert über Plugin-API/Laufzeit verfügbar machen
3. Kanäle/Features an diese Capability anschließen
4. Vendor-Plugins ihre Implementierungen registrieren lassen

Dadurch bleibt Ownership explizit und es wird vermieden, dass Core-Verhalten von
einem einzelnen Vendor oder einem einmaligen pluginspezifischen Codepfad abhängt.

### Capability-Schichtung

Verwende dieses mentale Modell, wenn du entscheidest, wo Code hingehört:

- **Core-Capability-Schicht**: gemeinsame Orchestrierung, Richtlinien, Fallback,
  Regeln für Konfigurationszusammenführung, Zustellsemantik und typisierte Verträge
- **Vendor-Plugin-Schicht**: vendorspezifische APIs, Authentifizierung, Modellkataloge, Sprach-
  synthese, Bildgenerierung, zukünftige Video-Backends, Nutzungsendpunkte
- **Channel-/Feature-Plugin-Schicht**: Slack-/Discord-/voice-call-/etc.-Integration,
  die Core-Capabilities verwendet und auf einer Oberfläche präsentiert

Beispielsweise folgt TTS dieser Form:

- der Core besitzt Richtlinien für TTS zur Antwortzeit, Fallback-Reihenfolge, Präferenzen und Kanalzustellung
- `openai`, `elevenlabs` und `microsoft` besitzen die Syntheseimplementierungen
- `voice-call` nutzt den TTS-Laufzeit-Helper für Telefonie

Dasselbe Muster sollte für zukünftige Capabilities bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Capabilities

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medien-
verständnis, Bildgenerierung, Videogenerierung, Web-Abruf und Web-Suche hat,
kann ein Vendor alle seine Oberflächen an einer Stelle besitzen:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Wichtig sind nicht die exakten Namen der Helper. Die Form ist entscheidend:

- ein Plugin besitzt die Vendor-Oberfläche
- der Core besitzt weiterhin die Capability-Verträge
- Kanäle und Feature-Plugins verwenden `api.runtime.*`-Helper, nicht Vendor-Code
- Vertragstests können prüfen, dass das Plugin die Capabilities registriert, die es
  angeblich besitzt

### Capability-Beispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Capability. Dasselbe Ownership-Modell gilt auch hier:

1. der Core definiert den Vertrag für Medienverständnis
2. Vendor-Plugins registrieren `describeImage`, `transcribeAudio` und
   `describeVideo`, sofern zutreffend
3. Channel- und Feature-Plugins verwenden das gemeinsame Core-Verhalten, statt
   direkt an Vendor-Code anzuschließen

Dadurch werden die Videoannahmen eines einzelnen Providers nicht in den Core eingebrannt. Das Plugin besitzt
die Vendor-Oberfläche; der Core besitzt den Capability-Vertrag und das Fallback-Verhalten.

Videogenerierung folgt bereits derselben Reihenfolge: Der Core besitzt den typisierten
Capability-Vertrag und Laufzeit-Helper, und Vendor-Plugins registrieren
`api.registerVideoGenerationProvider(...)`-Implementierungen dafür.

Brauchst du eine konkrete Checkliste für die Einführung? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist absichtlich typisiert und in
`OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Laufzeit-Helper, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Ownership ablehnen, zum Beispiel wenn zwei Plugins dieselbe
  Provider-ID registrieren
- beim Start können verwertbare Diagnosen für fehlerhafte Registrierungen ausgegeben werden
- Vertragstests können Ownership gebündelter Plugins durchsetzen und stilles Driften verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung bei der Laufzeitregistrierung**
   Die Plugin-Registry validiert Registrierungen beim Laden der Plugins. Beispiele:
   doppelte Provider-IDs, doppelte Speech-Provider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, sodass
   OpenClaw Ownership explizit prüfen kann. Heute wird dies für Modell-
   Provider, Speech-Provider, Web-Such-Provider und Ownership gebündelter Registrierungen verwendet.

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche
Oberfläche besitzt. Dadurch können Core und Kanäle nahtlos zusammenspielen, weil Ownership
deklariert, typisiert und testbar ist statt implizit.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- Capability-spezifisch
- im Besitz des Core
- von mehreren Plugins wiederverwendbar
- von Kanälen/Features ohne Vendor-Wissen nutzbar

Schlechte Plugin-Verträge sind:

- vendorspezifische Richtlinien, die im Core versteckt sind
- einmalige Plugin-Schlupflöcher, die die Registry umgehen
- Kanalcode, der direkt in eine Vendor-Implementierung greift
- ad hoc Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Im Zweifel die Abstraktionsebene erhöhen: zuerst die Capability definieren, dann
Plugins sie einstecken lassen.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im Prozess** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie
Core-Code.

Auswirkungen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Services registrieren
- ein Fehler in einem nativen Plugin kann das Gateway abstürzen lassen oder destabilisieren
- ein bösartiges natives Plugin entspricht der Ausführung beliebigen Codes innerhalb des
  OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit
als Metadaten-/Inhaltspakete behandelt. In aktuellen Releases bedeutet das meistens
gebündelte Skills.

Verwende Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandle
Workspace-Plugins als Entwicklungszeit-Code, nicht als Produktionsstandard.

Für gebündelte Workspace-Paketnamen sollte die Plugin-ID im npm-
Namen verankert bleiben: standardmäßig `@openclaw/<id>`, oder ein genehmigtes typisiertes Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine schmalere Plugin-Rolle bereitstellt.

Wichtiger Vertrauenshinweis:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/auf der Allowlist ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.

## Exportgrenze

OpenClaw exportiert Capabilities, keine Implementierungs-Convenience.

Halte Capability-Registrierung öffentlich. Reduziere nichtvertragliche Helper-Exporte:

- Helper-Subpaths, die spezifisch für gebündelte Plugins sind
- Laufzeitverdrahtungs-Subpaths, die nicht als öffentliche API gedacht sind
- vendorspezifische Convenience-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Einige Helper-Subpaths gebündelter Plugins bleiben aus Kompatibilitätsgründen und
zur Wartung gebündelter Plugins in der generierten SDK-Export-Map erhalten. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandle diese als
reservierte Exporte für Implementierungsdetails, nicht als empfohlenes SDK-Muster für
neue Drittanbieter-Plugins.

## Ladepipeline

Beim Start tut OpenClaw grob Folgendes:

1. Kandidatenwurzeln für Plugins erkennen
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module über jiti laden
7. native Hooks `register(api)` (oder `activate(api)` — ein veralteter Alias) aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehls-/Laufzeitoberflächen bereitstellen

<Note>
`activate` ist ein veralteter Alias für `register` — der Loader löst auf, welcher vorhanden ist (`def.register ?? def.activate`), und ruft ihn am selben Punkt auf. Alle gebündelten Plugins verwenden `register`; für neue Plugins `register` bevorzugen.
</Note>

Die Sicherheits-Gates passieren **vor** der Ausführung der Laufzeit. Kandidaten werden blockiert,
wenn der Entry aus der Plugin-Wurzel ausbricht, der Pfad weltweit schreibbar ist oder die Besitzverhältnisse des Pfads
für nicht gebündelte Plugins verdächtig aussehen.

### Manifest-first-Verhalten

Das Manifest ist die Quelle der Wahrheit für die Steuerungsebene. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschema oder Bundle-Capabilities zu erkennen
- `plugins.entries.<id>.config` zu validieren
- Control-UI-Labels/-Platzhalter zu ergänzen
- Installations-/Katalogmetadaten anzuzeigen

Für native Plugins ist das Laufzeitmodul der Teil der Datenebene. Es registriert das
tatsächliche Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

### Was der Loader zwischenspeichert

OpenClaw hält kurze In-Process-Caches für:

- Erkennungsergebnisse
- Manifest-Registry-Daten
- geladene Plugin-Registries

Diese Caches reduzieren burstiges Startverhalten und den Overhead bei wiederholten Befehlen. Sie sind
als kurzlebige Performance-Caches zu verstehen, nicht als Persistenz.

Hinweis zur Performance:

- Setze `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passe Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins mutieren nicht direkt beliebige globale Core-Zustände. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Einträge (Identität, Quelle, Herkunft, Status, Diagnosen)
- Tools
- veraltete Hooks und typisierte Hooks
- Kanäle
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrare
- Hintergrundservices
- plugin-eigene Befehle

Core-Features lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen zu sprechen.
Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Core-Laufzeit -> Registry-Nutzung

Diese Trennung ist für die Wartbarkeit wichtig. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt brauchen: „die Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Konversationsbindung

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwende `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bindungs-
Anfrage genehmigt oder abgelehnt wurde:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Felder der Callback-Payload:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragezusammenfassung, Ablösehinweis, Sender-ID und
  Konversationsmetadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine
Konversation binden darf, und er läuft, nachdem die Core-Genehmigungsbehandlung abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben jetzt zwei Ebenen:

- Manifest-Metadaten: `providerAuthEnvVars` für schnelle Provider-Umgebungs-Auth-Abfrage
  vor dem Laden der Laufzeit, `channelEnvVars` für schnelle Channel-Umgebungs-/Setup-Abfrage
  vor dem Laden der Laufzeit sowie `providerAuthChoices` für schnelle Labels von Onboarding-/Auth-Auswahl
  und CLI-Flag-Metadaten vor dem Laden der Laufzeit
- Hooks zur Konfigurationszeit: `catalog` / veraltetes `discovery` sowie `applyConfigDefaults`
- Laufzeit-Hooks: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, Transkriptverarbeitung und
Tool-Richtlinie. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches Verhalten, ohne
dass ein vollständig eigener Inferenztransport nötig ist.

Verwende Manifest-`providerAuthEnvVars`, wenn der Provider umgebungsbasierte Zugangsdaten
hat, die generische Auth-/Status-/Model-Picker-Pfade sehen sollen, ohne die Plugin-Laufzeit zu laden.
Verwende Manifest-`providerAuthChoices`, wenn Onboarding-/Auth-Choice-CLI-
Oberflächen die Choice-ID des Providers, Gruppenlabels und einfache
Auth-Verdrahtung mit einem einzelnen Flag kennen sollen, ohne die Provider-Laufzeit zu laden. Behalte Laufzeit-
`envVars` des Providers für operatororientierte Hinweise wie Onboarding-Labels oder OAuth-
Client-ID-/Client-Secret-Setup-Variablen.

Verwende Manifest-`channelEnvVars`, wenn ein Kanal umgebungsgetriebene Authentifizierung oder Setup hat, das
generischer Shell-Env-Fallback, Konfigurations-/Statusprüfungen oder Setup-Aufforderungen sehen sollen,
ohne die Channel-Laufzeit zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Verwendung“ ist die schnelle Entscheidungshilfe.

| #   | Hook                              | Was er tut                                                                                                     | Verwendung                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der Erzeugung von `models.json` in `models.providers` veröffentlichen          | Der Provider besitzt einen Katalog oder Standardwerte für Base-URLs                                                                         |
| 2   | `applyConfigDefaults`             | globale vom Provider besessene Standard-Konfigurationen während der Materialisierung der Konfiguration anwenden | Standardwerte hängen von Auth-Modus, Umgebung oder der Semantik der Provider-Modellfamilie ab                                              |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                    | _(kein Plugin-Hook)_                                                                                                                        |
| 3   | `normalizeModelId`                | veraltete oder Vorschau-Aliasse für Modell-IDs vor der Suche normalisieren                                     | Der Provider besitzt die Bereinigung von Aliasen vor der kanonischen Modellauflösung                                                       |
| 4   | `normalizeTransport`              | `api` / `baseUrl` von Provider-Familien vor dem generischen Modellaufbau normalisieren                        | Der Provider besitzt die Transportbereinigung für benutzerdefinierte Provider-IDs derselben Transportfamilie                               |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor Laufzeit-/Provider-Auflösung normalisieren                                         | Der Provider braucht Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Google-Familien-Helper stützen auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | native Streaming-Usage-Kompatibilitätsumschreibungen auf Konfigurations-Provider anwenden                     | Der Provider braucht endpointgesteuerte Korrekturen für Metadaten zur nativen Streaming-Nutzung                                            |
| 7   | `resolveConfigApiKey`             | Env-Marker-Authentifizierung für Konfigurations-Provider vor dem Laden der Laufzeit-Auth auflösen            | Der Provider besitzt eigene Env-Marker-API-Key-Auflösung; `amazon-bedrock` hat hier auch einen integrierten AWS-Env-Marker-Resolver       |
| 8   | `resolveSyntheticAuth`            | lokale/self-hosted oder konfigurationsgestützte Authentifizierung anzeigen, ohne Klartext zu persistieren     | Der Provider kann mit einem synthetischen/lokalen Credential-Marker arbeiten                                                               |
| 9   | `resolveExternalAuthProfiles`     | providerspezifische externe Auth-Profile überlagern; Standard-`persistence` ist `runtime-only` für CLI-/app-eigene Zugangsdaten | Der Provider verwendet externe Auth-Zugangsdaten wieder, ohne kopierte Refresh-Tokens zu persistieren                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | gespeicherte Platzhalter synthetischer Profile hinter env-/konfigurationsgestützter Authentifizierung zurückstufen | Der Provider speichert synthetische Platzhalterprofile, die keinen Vorrang gewinnen sollen                                                 |
| 11  | `resolveDynamicModel`             | synchrones Fallback für providerbezogene Modell-IDs, die noch nicht in der lokalen Registry sind             | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                       |
| 12  | `prepareDynamicModel`             | asynchrones Aufwärmen, dann wird `resolveDynamicModel` erneut ausgeführt                                       | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                      |
| 13  | `normalizeResolvedModel`          | letzte Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                             | Der Provider braucht Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                               |
| 14  | `contributeResolvedModelCompat`   | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport beitragen                 | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                          |
| 15  | `capabilities`                    | providerbezogene Transkript-/Tooling-Metadaten, die von gemeinsamer Core-Logik verwendet werden              | Der Provider benötigt Eigenheiten zu Transkripten/Provider-Familien                                                                         |
| 16  | `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der eingebettete Runner sie sieht                                            | Der Provider braucht schemabezogene Bereinigung für seine Transportfamilie                                                                  |
| 17  | `inspectToolSchemas`              | providerbezogene Schema-Diagnosen nach der Normalisierung anzeigen                                             | Der Provider möchte Keyword-Warnungen ausgeben, ohne dem Core providerspezifische Regeln beizubringen                                      |
| 18  | `resolveReasoningOutputMode`      | nativen vs. getaggten Vertrag für Reasoning-Ausgaben auswählen                                                 | Der Provider benötigt getaggte Reasoning-/Final-Output-Ausgabe statt nativer Felder                                                        |
| 19  | `prepareExtraParams`              | Normalisierung von Anfrageparametern vor generischen Stream-Option-Wrappern                                   | Der Provider braucht Standard-Anfrageparameter oder providerspezifische Parameterbereinigung                                                |
| 20  | `createStreamFn`                  | den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                       | Der Provider braucht ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                       |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                    | Der Provider braucht Wrapper für Anfrageheader/Body/Modell-Kompatibilität ohne eigenen Transport                                           |
| 22  | `resolveTransportTurnState`       | native Header oder Metadaten pro Zug für den Transport anhängen                                               | Der Provider möchte, dass generische Transporte providerspezifische Turn-Identität senden                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | native WebSocket-Header oder Richtlinie für Sitzungs-Cooldown anhängen                                        | Der Provider möchte, dass generische WS-Transporte Sitzungsheader oder Fallback-Richtlinien abstimmen                                      |
| 24  | `formatApiKey`                    | Formatter für Auth-Profile: gespeichertes Profil wird zur Laufzeit-`apiKey`-Zeichenfolge                     | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Runtime-Token-Form                                 |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Refresh-Fehler-Richtlinien              | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refresh-Mechanismen                                                                    |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der bei fehlgeschlagenem OAuth-Refresh angehängt wird                                       | Der Provider braucht providerbezogene Hinweise zur Auth-Reparatur nach fehlgeschlagenem Refresh                                            |
| 27  | `matchesContextOverflowError`     | providerbezogener Matcher für Überläufe des Kontextfensters                                                   | Der Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                         |
| 28  | `classifyFailoverReason`          | providerbezogene Klassifizierung von Failover-Gründen                                                          | Der Provider kann rohe API-/Transportfehler auf Rate-Limit/Überlastung/usw. abbilden                                                      |
| 29  | `isCacheTtlEligible`              | Richtlinie für Prompt-Cache bei Proxy-/Backhaul-Providern                                                    | Der Provider braucht proxyspezifisches TTL-Gating für den Cache                                                                            |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Authentifizierung                         | Der Provider braucht einen providerspezifischen Hinweis zur Wiederherstellung bei fehlender Authentifizierung                              |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis                     | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Vendor-Hinweis ersetzen                                            |
| 32  | `augmentModelCatalog`             | synthetische/finale Katalogzeilen, die nach der Erkennung angehängt werden                                    | Der Provider braucht synthetische Forward-Compat-Zeilen in `models list` und Pickern                                                       |
| 33  | `isBinaryThinking`                | On/Off-Reasoning-Umschalter für Provider mit binärem Thinking                                                 | Der Provider stellt nur binäres Thinking ein/aus bereit                                                                                     |
| 34  | `supportsXHighThinking`           | `xhigh`-Reasoning-Unterstützung für ausgewählte Modelle                                                       | Der Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                             |
| 35  | `resolveDefaultThinkingLevel`     | Standard-`/think`-Stufe für eine bestimmte Modellfamilie                                                      | Der Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                               |
| 36  | `isModernModelRef`                | Matcher für moderne Modelle bei Filtern für Live-Profile und Smoke-Auswahl                                    | Der Provider besitzt das bevorzugte Matching für Live-/Smoke-Modelle                                                                        |
| 37  | `prepareRuntimeAuth`              | konfigurierte Zugangsdaten unmittelbar vor der Inferenz in das tatsächliche Laufzeit-Token/den Schlüssel umtauschen | Der Provider benötigt einen Tokenaustausch oder kurzlebige Anfrage-Zugangsdaten                                                            |
| 38  | `resolveUsageAuth`                | Zugangsdaten für Nutzung/Billing für `/usage` und verwandte Statusoberflächen auflösen                        | Der Provider benötigt benutzerdefiniertes Parsing von Nutzungs-/Quota-Tokens oder andere Zugangsdaten für Nutzung                          |
| 39  | `fetchUsageSnapshot`              | providerspezifische Nutzungs-/Quota-Snapshots abrufen und normalisieren, nachdem die Authentifizierung aufgelöst ist | Der Provider benötigt einen providerspezifischen Nutzungsendpunkt oder Payload-Parser                                                      |
| 40  | `createEmbeddingProvider`         | einen providerbezogenen Embedding-Adapter für Speicher/Suche erstellen                                         | Embedding-Verhalten für Speicher gehört in das Provider-Plugin                                                                              |
| 41  | `buildReplayPolicy`               | eine Replay-Richtlinie zurückgeben, die die Transkriptverarbeitung für den Provider steuert                    | Der Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (zum Beispiel Entfernen von Thinking-Blöcken)                          |
| 42  | `sanitizeReplayHistory`           | Replay-Verlauf nach generischer Transkriptbereinigung umschreiben                                              | Der Provider benötigt providerspezifische Replay-Umschreibungen über gemeinsame Compaction-Helper hinaus                                   |
| 43  | `validateReplayTurns`             | abschließende Validierung oder Umformung von Replay-Zügen vor dem eingebetteten Runner                        | Der Provider-Transport benötigt strengere Turn-Validierung nach generischer Bereinigung                                                    |
| 44  | `onModelSelected`                 | providerspezifische Seiteneffekte nach der Modellauswahl ausführen                                            | Der Provider benötigt Telemetrie oder providerspezifischen Zustand, wenn ein Modell aktiv wird                                             |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
passende Provider-Plugin und fallen dann auf andere Hook-fähige Provider-Plugins zurück,
bis eines tatsächlich die Modell-ID oder den Transport/die Konfiguration ändert. Dadurch bleiben
Alias-/Kompat-Provider-Shims funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Google-Familien-Konfigurationseintrag umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer
weiterhin diese Kompatibilitätsbereinigung an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten Request-Executor benötigt,
ist das eine andere Klasse von Erweiterung. Diese Hooks sind für Provider-Verhalten gedacht,
das weiterhin in der normalen Inferenzschleife von OpenClaw läuft.

### Provider-Beispiel

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Integrierte Beispiele

- Anthropic verwendet `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  und `wrapStreamFn`, weil es Claude-4.6-Forward-Compat,
  Hinweise zur Provider-Familie, Anleitungen zur Auth-Reparatur, Integration des Nutzungsendpunkts,
  Eignung für Prompt-Cache, auth-bewusste Standardkonfigurationen, die
  Claude-Standard-/adaptive Thinking-Richtlinie und Anthropic-spezifische Stream-Formung für
  Beta-Header, `/fast` / `serviceTier` und `context1m` besitzt.
- Die Claude-spezifischen Stream-Helper von Anthropic bleiben vorerst im eigenen
  öffentlichen `api.ts`-/`contract-api.ts`-Seam des gebündelten Plugins. Diese Paketoberfläche
  exportiert `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die tieferliegenden
  Anthropic-Wrapper-Builder, anstatt das generische SDK um die Beta-Header-Regeln
  eines einzelnen Providers zu erweitern.
- OpenAI verwendet `resolveDynamicModel`, `normalizeResolvedModel` und
  `capabilities` sowie `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` und `isModernModelRef`,
  weil es GPT-5.4-Forward-Compat, die direkte OpenAI-
  `openai-completions` -> `openai-responses`-Normalisierung, Codex-bewusste Auth-
  Hinweise, Spark-Unterdrückung, synthetische OpenAI-Listenzeilen und die GPT-5-
  Thinking-/Live-Modell-Richtlinie besitzt; die Stream-Familie `openai-responses-defaults` besitzt die
  gemeinsamen nativen OpenAI-Responses-Wrapper für Attributions-Header,
  `/fast`/`serviceTier`, Text-Verbosity, native Codex-Web-Suche,
  Reasoning-Kompat-Payload-Formung und Responses-Kontextverwaltung.
- OpenRouter verwendet `catalog` sowie `resolveDynamicModel` und
  `prepareDynamicModel`, weil der Provider pass-through ist und neue
  Modell-IDs verfügbar machen kann, bevor der statische Katalog von OpenClaw aktualisiert wird; außerdem verwendet es
  `capabilities`, `wrapStreamFn` und `isCacheTtlEligible`, um
  providerspezifische Anfrage-Header, Routing-Metadaten, Reasoning-Patches und
  Prompt-Cache-Richtlinien aus dem Core herauszuhalten. Seine Replay-Richtlinie stammt aus der
  Familie `passthrough-gemini`, während die Stream-Familie `openrouter-thinking`
  die Proxy-Reasoning-Injektion und das Überspringen nicht unterstützter Modelle / `auto` besitzt.
- GitHub Copilot verwendet `catalog`, `auth`, `resolveDynamicModel` und
  `capabilities` sowie `prepareRuntimeAuth` und `fetchUsageSnapshot`, weil es
  providerbezogenen Geräte-Login, Modell-Fallback-Verhalten, Claude-Transkript-Eigenheiten,
  einen Austausch von GitHub-Token zu Copilot-Token und einen providerbezogenen Nutzungsendpunkt braucht.
- OpenAI Codex verwendet `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` und `augmentModelCatalog` sowie
  `prepareExtraParams`, `resolveUsageAuth` und `fetchUsageSnapshot`, weil es
  weiterhin auf den OpenAI-Core-Transporten läuft, aber seine Normalisierung von Transport/Base-URL,
  OAuth-Refresh-Fallback-Richtlinien, Standard-Transportwahl,
  synthetische Codex-Katalogzeilen und Integration des ChatGPT-Nutzungsendpunkts besitzt; es
  teilt dieselbe Stream-Familie `openai-responses-defaults` wie direktes OpenAI.
- Google AI Studio und Gemini CLI OAuth verwenden `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` und `isModernModelRef`, weil die
  Replay-Familie `google-gemini` Gemini-3.1-Forward-Compat-Fallback,
  native Gemini-Replay-Validierung, Bereinigung von Bootstrap-Replays, den getaggten
  Reasoning-Output-Modus und Matching moderner Modelle besitzt, während die
  Stream-Familie `google-thinking` die Normalisierung von Gemini-Thinking-Payloads besitzt;
  Gemini CLI OAuth verwendet außerdem `formatApiKey`, `resolveUsageAuth` und
  `fetchUsageSnapshot` für Token-Formatierung, Token-Parsing und Verdrahtung des Quota-Endpunkts.
- Anthropic Vertex verwendet `buildReplayPolicy` über die
  Replay-Familie `anthropic-by-model`, sodass Claude-spezifische Replay-Bereinigung auf
  Claude-IDs begrenzt bleibt statt auf jeden Transport `anthropic-messages`.
- Amazon Bedrock verwendet `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` und `resolveDefaultThinkingLevel`, weil es
  Bedrock-spezifische Klassifizierung von Throttle-/Not-Ready-/Context-Overflow-Fehlern
  für Anthropic-on-Bedrock-Verkehr besitzt; seine Replay-Richtlinie teilt sich weiterhin denselben
  nur-Claude-Guard `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode und Opencode Go verwenden `buildReplayPolicy`
  über die Replay-Familie `passthrough-gemini`, weil sie Gemini-
  Modelle über OpenAI-kompatible Transporte proxien und eine Bereinigung der Gemini-
  Thought-Signaturen ohne native Gemini-Replay-Validierung oder Bootstrap-Umschreibungen benötigen.
- MiniMax verwendet `buildReplayPolicy` über die
  Replay-Familie `hybrid-anthropic-openai`, weil ein Provider sowohl
  Anthropic-Message- als auch OpenAI-kompatible Semantik besitzt; es behält nur-Claude-
  Dropping von Thinking-Blöcken auf der Anthropic-Seite bei, überschreibt aber den Reasoning-
  Output-Modus wieder zurück auf nativ, und die Stream-Familie `minimax-fast-mode` besitzt
  Fast-Mode-Modell-Umschreibungen auf dem gemeinsamen Stream-Pfad.
- Moonshot verwendet `catalog` sowie `wrapStreamFn`, weil es weiterhin den gemeinsamen
  OpenAI-Transport verwendet, aber eine providerbezogene Normalisierung von Thinking-Payloads benötigt; die
  Stream-Familie `moonshot-thinking` bildet Konfiguration sowie `/think`-Status auf seine
  native binäre Thinking-Payload ab.
- Kilocode verwendet `catalog`, `capabilities`, `wrapStreamFn` und
  `isCacheTtlEligible`, weil es providerbezogene Anfrage-Header,
  Normalisierung von Reasoning-Payloads, Hinweise zu Gemini-Transkripten und Anthropic-
  Cache-TTL-Gating benötigt; die Stream-Familie `kilocode-thinking` hält die Injektion von Kilo-
  Thinking auf dem gemeinsamen Proxy-Stream-Pfad, während `kilo/auto` und
  andere Proxy-Modell-IDs übersprungen werden, die keine expliziten Reasoning-Payloads unterstützen.
- Z.AI verwendet `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` und `fetchUsageSnapshot`, weil es GLM-5-Fallback,
  Standardwerte für `tool_stream`, binäre Thinking-UX, Matching moderner Modelle
  sowie sowohl Usage-Auth als auch Quota-Abruf besitzt; die Stream-Familie
  `tool-stream-default-on` hält den standardmäßig aktivierten `tool_stream`-Wrapper aus
  handgeschriebenem providerbezogenem Glue-Code heraus.
- xAI verwendet `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` und `isModernModelRef`,
  weil es native xAI-Responses-Transportnormalisierung, Umschreibungen von Grok-Fast-Mode-
  Aliasen, Standardwerte für `tool_stream`, Bereinigung von strict-tool / Reasoning-Payload,
  Wiederverwendung von Fallback-Auth für plugin-eigene Tools, Forward-Compat-
  Auflösung von Grok-Modellen und providerbezogene Kompat-Patches wie xAI-Tool-Schema-
  Profil, nicht unterstützte Schema-Keywords, natives `web_search` und das Dekodieren von HTML-Entities
  in Tool-Call-Argumenten besitzt.
- Mistral, OpenCode Zen und OpenCode Go verwenden nur `capabilities`, um
  Transkript-/Tooling-Eigenheiten aus dem Core herauszuhalten.
- Rein katalogbasierte gebündelte Provider wie `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` und `volcengine` verwenden
  nur `catalog`.
- Qwen verwendet `catalog` für seinen Text-Provider sowie gemeinsame Registrierungen für Medienverständnis und
  Videogenerierung für seine multimodalen Oberflächen.
- MiniMax und Xiaomi verwenden `catalog` plus Usage-Hooks, weil ihr `/usage`-
  Verhalten im Plugin liegt, obwohl die Inferenz weiterhin über die gemeinsamen Transporte läuft.

## Laufzeit-Helper

Plugins können ausgewählte Core-Helper über `api.runtime` verwenden. Für TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Hinweise:

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Payload für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und die Provider-Auswahl.
- Gibt PCM-Audiopuffer + Sample-Rate zurück. Plugins müssen für Provider neu sampeln/kodieren.
- `listVoices` ist pro Provider optional. Verwende es für vendorbezogene Voice-Picker oder Setup-Flows.
- Stimmenlisten können umfangreichere Metadaten wie Gebietsschema, Geschlecht und Persönlichkeits-Tags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telefonie. Microsoft nicht.

Plugins können außerdem Speech-Provider über `api.registerSpeechProvider(...)` registrieren.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Hinweise:

- TTS-Richtlinie, Fallback und Antwortzustellung im Core belassen.
- Speech-Provider für vendorbezogenes Syntheseverhalten verwenden.
- Veraltete Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Ownership-Modell ist unternehmensorientiert: Ein Vendor-Plugin kann
  Text-, Sprach-, Bild- und zukünftige Medien-Provider besitzen, wenn OpenClaw diese
  Capability-Verträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Provider für Medienverständnis statt eines generischen Schlüssel/Wert-Beutels:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Hinweise:

- Orchestrierung, Fallback, Konfiguration und Kanalverdrahtung im Core belassen.
- Vendor-Verhalten im Provider-Plugin belassen.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Capabilities.
- Videogenerierung folgt bereits demselben Muster:
  - der Core besitzt den Capability-Vertrag und Laufzeit-Helper
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins verwenden `api.runtime.videoGeneration.*`

Für Laufzeit-Helper des Medienverständnisses können Plugins Folgendes aufrufen:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Für Audio-Transkription können Plugins entweder die Laufzeit des Medienverständnisses
oder den älteren STT-Alias verwenden:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Hinweise:

- `api.runtime.mediaUnderstanding.*` ist die bevorzugte gemeinsame Oberfläche für
  Bild-/Audio-/Videoverständnis.
- Verwendet die Core-Konfiguration für Audio des Medienverständnisses (`tools.media.audio`) und die Fallback-Reihenfolge des Providers.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können über `api.runtime.subagent` auch Hintergrund-Subagent-Läufe starten:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Hinweise:

- `provider` und `model` sind optionale Overrides pro Lauf, keine persistenten Sitzungsänderungen.
- OpenClaw berücksichtigt diese Override-Felder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` explizit zustimmen.
- Verwende `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel explizit zu erlauben.
- Läufe von Subagenten nicht vertrauenswürdiger Plugins funktionieren weiterhin, aber Override-Anfragen werden abgelehnt, statt stillschweigend auf Fallback umzuschalten.

Für Web-Suche können Plugins den gemeinsamen Laufzeit-Helper nutzen, statt
in die Verdrahtung des Agent-Tools zu greifen:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugins können außerdem Web-Such-Provider über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Provider-Auswahl, Auflösung von Zugangsdaten und gemeinsame Anfrage-Semantik im Core belassen.
- Web-Such-Provider für vendorspezifische Suchtransporte verwenden.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne von dem Agent-Tool-Wrapper abzuhängen.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: ein Bild mit der konfigurierten Provider-Kette für Bildgenerierung erzeugen.
- `listProviders(...)`: verfügbare Provider für Bildgenerierung und ihre Capabilities auflisten.

## Gateway-HTTP-Routen

Plugins können mit `api.registerHttpRoute(...)` HTTP-Endpunkte bereitstellen.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Felder der Route:

- `path`: Routenpfad unter dem Gateway-HTTP-Server.
- `auth`: erforderlich. Verwende `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für pluginverwaltete Authentifizierung/Webhook-Verifikation.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Fehler beim Laden des Plugins. Verwende stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Behalte `exact`-/`prefix`-Fallthrough-Ketten nur auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten nicht automatisch Runtime-Scopes des Operators. Sie sind für pluginverwaltete Webhooks/Signaturprüfung gedacht, nicht für privilegierte Gateway-Helper-Aufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Anfrage-Runtime-Scopes, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Authentifizierung (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes für Plugin-Routen auf `operator.write` fest, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` an einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen identitätsbasierten Plugin-Routen-Anfragen fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehe nicht davon aus, dass eine pluginroute mit Gateway-Auth implizit eine Admin-Oberfläche ist. Wenn deine Route Verhalten nur für Admins braucht, verlange einen identitätsbasierten Auth-Modus und dokumentiere den expliziten Header-Vertrag `x-openclaw-scopes`.

## Importpfade des Plugin-SDK

Verwende SDK-Subpaths statt des monolithischen Imports `openclaw/plugin-sdk`, wenn
du Plugins erstellst:

- `openclaw/plugin-sdk/plugin-entry` für Plugin-Registrierungsprimitiven.
- `openclaw/plugin-sdk/core` für den generischen gemeinsamen pluginseitigen Vertrag.
- `openclaw/plugin-sdk/config-schema` für den Export des Zod-Schemas für `openclaw.json`
  an der Wurzel (`OpenClawSchema`).
- Stabile Channel-Primitiven wie `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` und
  `openclaw/plugin-sdk/webhook-ingress` für gemeinsame Verdrahtung von Setup/Auth/Antwort/Webhook.
  `channel-inbound` ist das gemeinsame Zuhause für Debounce, Mention-Matching,
  Envelope-Formatierung und Kontext-Helper für eingehende Envelopes.
  `channel-setup` ist das schmale Setup-Seam für optionale Installation.
  `setup-runtime` ist die laufzeitsichere Setup-Oberfläche, die von `setupEntry` /
  verzögertem Start verwendet wird, einschließlich der importsicheren Setup-Patch-Adapter.
  `setup-adapter-runtime` ist das env-bewusste Seam für Account-Setup-Adapter.
  `setup-tools` ist das kleine Seam für CLI-/Archiv-/Dokumentations-Helper (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domain-Subpaths wie `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` und
  `openclaw/plugin-sdk/directory-runtime` für gemeinsame Laufzeit-/Konfigurations-Helper.
  `telegram-command-config` ist das schmale öffentliche Seam für die Normalisierung/Validierung benutzerdefinierter
  Telegram-Befehle und bleibt verfügbar, auch wenn die gebündelte Telegram-Vertragsoberfläche vorübergehend nicht verfügbar ist.
  `text-runtime` ist das gemeinsame Seam für Text/Markdown/Logging, einschließlich
  des Entfernens von für Assistenten sichtbarem Text, Rendering-/Chunking-Helpern für Markdown, Redaktions-
  Helpern, Directive-Tag-Helpern und Safe-Text-Utilities.
- Für approval-spezifische Channel-Seams sollte ein Plugin bevorzugt einen einzigen Vertrag `approvalCapability`
  verwenden. Der Core liest dann Authentifizierung, Zustellung, Rendering und
  natives Routing für Approval über diese eine Capability, statt
  Approval-Verhalten mit nicht zugehörigen Plugin-Feldern zu vermischen.
- `openclaw/plugin-sdk/channel-runtime` ist veraltet und bleibt nur als
  Kompatibilitäts-Shim für ältere Plugins erhalten. Neuer Code sollte stattdessen die schmaleren
  generischen Primitiven importieren, und Repo-Code sollte keine neuen Importe des
  Shims hinzufügen.
- Die Interna gebündelter Extensions bleiben privat. Externe Plugins sollten nur
  `openclaw/plugin-sdk/*`-Subpaths verwenden. OpenClaw-Core-/Test-Code darf die öffentlichen
  Repo-Entry-Points an der Paketwurzel eines Plugins verwenden, etwa `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` und schmale Dateien wie
  `login-qr-api.js`. Importiere niemals `src/*` eines Plugin-Pakets aus dem Core oder aus
  einer anderen Extension.
- Aufteilung der Repo-Entry-Points:
  `<plugin-package-root>/api.js` ist das Helper-/Typen-Barrel,
  `<plugin-package-root>/runtime-api.js` ist das reine Laufzeit-Barrel,
  `<plugin-package-root>/index.js` ist der Entry des gebündelten Plugins
  und `<plugin-package-root>/setup-entry.js` ist der Entry des Setup-Plugins.
- Aktuelle Beispiele für gebündelte Provider:
  - Anthropic verwendet `api.js` / `contract-api.js` für Claude-Stream-Helper wie
    `wrapAnthropicProviderStream`, Beta-Header-Helper und das Parsing von `service_tier`.
  - OpenAI verwendet `api.js` für Provider-Builder, Helper für Standardmodelle und Builder für Realtime-Provider.
  - OpenRouter verwendet `api.js` für seinen Provider-Builder sowie Onboarding-/Konfigurations-
    Helper, während `register.runtime.js` für repolokale Verwendung weiterhin generische
    `plugin-sdk/provider-stream`-Helper re-exportieren kann.
- Öffentlich verfügbare Entry-Points, die über Facades geladen werden, bevorzugen den aktiven Snapshot der Laufzeitkonfiguration,
  wenn einer vorhanden ist, und fallen andernfalls auf die auf Datenträger aufgelöste Konfigurationsdatei zurück, wenn
  OpenClaw noch keinen Laufzeit-Snapshot bereitstellt.
- Generische gemeinsame Primitiven bleiben der bevorzugte öffentliche SDK-Vertrag. Eine kleine
  reservierte Kompatibilitätsmenge an kanalgebrandeten Helper-Seams gebündelter Plugins existiert weiterhin.
  Behandle diese als Seams für Wartung/Kompatibilität gebündelter Plugins, nicht als neue Importziele für Drittanbieter; neue kanalübergreifende Verträge sollten weiterhin auf generischen `plugin-sdk/*`-Subpaths oder den pluginlokalen Barrels `api.js` /
  `runtime-api.js` landen.

Kompatibilitätshinweis:

- Vermeide das Root-Barrel `openclaw/plugin-sdk` für neuen Code.
- Bevorzuge zuerst die schmalen stabilen Primitiven. Die neueren Setup-/Pairing-/Reply-/
  Feedback-/Contract-/Inbound-/Threading-/Command-/Secret-Input-/Webhook-/Infra-/
  Allowlist-/Status-/Message-Tool-Subpaths sind der beabsichtigte Vertrag für neue
  gebündelte und externe Plugin-Arbeit.
  Parsing/Matching von Zielen gehört auf `openclaw/plugin-sdk/channel-targets`.
  Gates für Message-Aktionen und Message-ID-Helper für Reaktionen gehören auf
  `openclaw/plugin-sdk/channel-actions`.
- Extensionspezifische Helper-Barrels gebündelter Plugins sind standardmäßig nicht stabil. Wenn ein
  Helper nur von einer gebündelten Extension benötigt wird, belasse ihn hinter dem
  lokalen Seam `api.js` oder `runtime-api.js` der Extension, statt ihn in
  `openclaw/plugin-sdk/<extension>` hochzustufen.
- Neue gemeinsame Helper-Seams sollten generisch sein, nicht kanalgebrandet. Gemeinsames Parsing
  von Zielen gehört auf `openclaw/plugin-sdk/channel-targets`; kanalspezifische
  Interna bleiben hinter dem lokalen Seam `api.js` oder `runtime-api.js` des besitzenden Plugins.
- Capability-spezifische Subpaths wie `image-generation`,
  `media-understanding` und `speech` existieren, weil gebündelte/native Plugins sie heute verwenden. Ihre Existenz bedeutet nicht automatisch, dass jeder exportierte Helper ein
  langfristig eingefrorener externer Vertrag ist.

## Schemas des Message-Tools

Plugins sollten kanalspezifische Schema-Beiträge für `describeMessageTool(...)`
besitzen. Halte providerspezifische Felder im Plugin, nicht im gemeinsamen Core.

Für gemeinsam portable Schemafragmente verwende die generischen Helper, die über
`openclaw/plugin-sdk/channel-actions` exportiert werden:

- `createMessageToolButtonsSchema()` für Payloads im Stil von Button-Rastern
- `createMessageToolCardSchema()` für strukturierte Card-Payloads

Wenn eine Schemaform nur für einen Provider sinnvoll ist, definiere sie im
eigenen Quellcode dieses Plugins, statt sie in das gemeinsame SDK zu verschieben.

## Auflösung von Channel-Zielen

Channel-Plugins sollten kanalspezifische Zielsemantik besitzen. Halte den gemeinsamen
Outbound-Host generisch und verwende die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor der Verzeichnissuche als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt in eine id-artige Auflösung gehen soll, statt in die Verzeichnissuche.
- `messaging.targetResolver.resolveTarget(...)` ist das Plugin-Fallback, wenn der
  Core nach der Normalisierung oder nach einem Verzeichnis-Fehlschlag eine finale providerbezogene Auflösung braucht.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die providerspezifische Erstellung
  von Sitzungsrouten, sobald ein Ziel aufgelöst wurde.

Empfohlene Aufteilung:

- Verwende `inferTargetChatType` für Kategorieentscheidungen, die vor der Suche in Peers/Gruppen passieren sollten.
- Verwende `looksLikeId` für Prüfungen vom Typ „als explizite/native Ziel-ID behandeln“.
- Verwende `resolveTarget` für providerspezifisches Normalisierungs-Fallback, nicht für breite Verzeichnissuche.
- Behalte providernative IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-IDs
  in `target`-Werten oder providerspezifischen Parametern, nicht in generischen SDK-Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin behalten und die gemeinsamen Helper aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwende dies, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt, wie zum Beispiel:

- von der Allowlist gesteuerte DM-Peers
- konfigurierte Channel-/Gruppen-Maps
- kontobezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Helper in `directory-runtime` verarbeiten nur generische Operationen:

- Query-Filterung
- Anwendung von Limits
- Helper für Deduplizierung/Normalisierung
- Aufbau von `ChannelDirectoryEntry[]`

Kanalspezifische Account-Inspektion und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwende `catalog`, wenn das Plugin providerspezifische Modell-IDs, Standardwerte für Base-URLs
oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache Provider, die API-Key- oder env-gesteuert sind
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins absichtlich einen integrierten
Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als veralteter Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Channel-Inspektion

Wenn dein Plugin einen Kanal registriert, solltest du bevorzugt
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)` implementieren.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf davon ausgehen, dass Zugangsdaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Geheimnisse fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` und Doctor-/Konfigurations-
  Reparaturabläufe sollten keine Laufzeit-Zugangsdaten materialisieren müssen, nur um
  die Konfiguration zu beschreiben.

Empfohlenes Verhalten für `inspectAccount(...)`:

- Nur den beschreibenden Account-Zustand zurückgeben.
- `enabled` und `configured` beibehalten.
- Quellen-/Statusfelder von Zugangsdaten einbeziehen, wenn relevant, zum Beispiel:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Du musst keine Rohwerte von Tokens zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. `tokenStatus: "available"` zurückzugeben (und das passende Quellenfeld)
  reicht für statusartige Befehle.
- Verwende `configured_unavailable`, wenn eine Zugangsinformation per SecretRef konfiguriert ist, aber
  im aktuellen Befehlspfad nicht verfügbar ist.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder den Account fälschlich als nicht konfiguriert auszugeben.

## Paket-Packs

Ein Plugin-Verzeichnis kann ein `package.json` mit `openclaw.extensions` enthalten:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Extensions auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn dein Plugin npm-Abhängigkeiten importiert, installiere sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis ausbrechen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halte Plugin-Abhängigkeitsbäume „reines JS/TS“ und vermeide Pakete, die `postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges, nur für Setup verwendetes Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Entries. Dadurch bleiben Start und Setup leichter,
wenn dein Haupt-Plugin-Entry auch Tools, Hooks oder anderen reinen Laufzeit-
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin in denselben `setupEntry`-Pfad während der
Startphase des Gateways vor dem Listen opt-in lassen, selbst wenn der Kanal bereits konfiguriert ist.

Verwende dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die
vor dem Beginn des Listen des Gateways vorhanden sein muss. In der Praxis bedeutet das, dass
der Setup-Entry jede kanalbezogene Capability registrieren muss, von der der Start abhängt, etwa:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway beginnt zu lauschen
- alle Gateway-Methoden, Tools oder Services, die in diesem selben Zeitfenster existieren müssen

Wenn dein vollständiger Entry weiterhin eine erforderliche Start-Capability besitzt, aktiviere
dieses Flag nicht. Belasse das Plugin im Standardverhalten und lasse OpenClaw beim
Start den vollständigen Entry laden.

Gebündelte Kanäle können außerdem reine Setup-Helper für Vertragsoberflächen veröffentlichen, die der Core
abfragen kann, bevor die vollständige Kanal-Laufzeit geladen ist. Die aktuelle Oberfläche für Setup-Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine veraltete Single-Account-Channel-Konfiguration
in `channels.<id>.accounts.*` hochstufen muss, ohne den vollständigen Plugin-Entry zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes hochgestuftes Konto, wenn benannte Konten bereits existieren, und es kann einen
konfigurierten nicht-kanonischen Default-Account-Schlüssel beibehalten, statt immer
`accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Discovery gebündelter Vertragsoberflächen lazy. Die Importzeit
bleibt leichtgewichtig; die Promotionsoberfläche wird erst bei erster Verwendung geladen, statt beim Modulimport den Start des gebündelten Kanals erneut zu betreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, belasse sie auf einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen schmaleren Scope anfordert.

Beispiel:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Katalogmetadaten für Kanäle

Channel-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bewerben. Dadurch bleibt der Core katalogdatenfrei.

Beispiel:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Nützliche `openclaw.channel`-Felder zusätzlich zum Minimalbeispiel:

- `detailLabel`: sekundäres Label für umfangreichere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Doku-Link überschreiben
- `preferOver`: Plugin-/Channel-IDs mit niedrigerer Priorität, die dieser Katalogeintrag überranken soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerungen für Kopie auf Auswahloberflächen
- `markdownCapable`: markiert den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: den Kanal aus Oberflächen für konfigurierte Kanäle ausblenden, wenn auf `false` gesetzt
- `exposure.setup`: den Kanal aus interaktiven Setup-/Configure-Pickern ausblenden, wenn auf `false` gesetzt
- `exposure.docs`: den Kanal für Navigationsoberflächen der Dokumentation als intern/privat markieren
- `showConfigured` / `showInSetup`: veraltete Aliasse werden aus Kompatibilitätsgründen weiterhin akzeptiert; `exposure` bevorzugen
- `quickstartAllowFrom`: den Kanal in den standardmäßigen Quickstart-Flow für `allowFrom` einbeziehen
- `forceAccountBinding`: explizite Account-Bindung verlangen, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: Sitzungs-Lookup bevorzugen, wenn Ankündigungsziele aufgelöst werden

OpenClaw kann außerdem **externe Channel-Kataloge** zusammenführen (zum Beispiel einen Export
einer MPM-Registry). Lege eine JSON-Datei an einer der folgenden Stellen ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder verweise `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als veraltete Aliasse für den Schlüssel `"entries"`.

## Context-Engine-Plugins

Plugins für die Context Engine besitzen die Orchestrierung des Sitzungskontexts für Ingest,
Zusammenstellung und Verdichtung. Registriere sie in deinem Plugin mit
`api.registerContextEngine(id, factory)` und wähle dann die aktive Engine mit
`plugins.slots.contextEngine`.

Verwende dies, wenn dein Plugin die Standard-Context-Pipeline ersetzen oder erweitern muss,
statt nur Speicher-Suche oder Hooks hinzuzufügen.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Wenn deine Engine den Verdichtungsalgorithmus **nicht** besitzt, implementiere `compact()`
trotzdem und delegiere explizit:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Eine neue Capability hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehe
das Plugin-System nicht mit einem privaten Direktzugriff. Füge die fehlende Capability hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheide, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Konfigurationszusammenführung,
   Lebenszyklus, kanalorientierte Semantik und Form des Laufzeit-Helfers.
2. typisierte Oberflächen für Plugin-Registrierung/Laufzeit hinzufügen
   Erweitere `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Capability-Oberfläche.
3. Core- sowie Channel-/Feature-Consumer verdrahten
   Kanäle und Feature-Plugins sollten die neue Capability über den Core nutzen,
   nicht durch direkten Import einer Vendor-Implementierung.
4. Vendor-Implementierungen registrieren
   Vendor-Plugins registrieren dann ihre Backends für die Capability.
5. Vertragsabdeckung hinzufügen
   Füge Tests hinzu, damit Ownership und Registrierungsform über die Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne auf das Weltbild eines einzigen
Providers festverdrahtet zu werden. Siehe das [Capability Cookbook](/de/plugins/architecture)
für eine konkrete Datei-Checkliste und ein ausgearbeitetes Beispiel.

### Capability-Checkliste

Wenn du eine neue Capability hinzufügst, sollte die Implementierung diese
Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeit-Helper in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Freigabe der Plugin-Laufzeit in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie verwenden müssen
- Capture-/Test-Helper in `src/test-utils/plugin-registration.ts`
- Ownership-/Vertrags-Assertions in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das normalerweise ein Zeichen dafür, dass die Capability
noch nicht vollständig integriert ist.

### Capability-Vorlage

Minimales Muster:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Muster für Vertragstests:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Dadurch bleibt die Regel einfach:

- der Core besitzt den Capability-Vertrag + die Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Channel-Plugins verwenden Laufzeit-Helper
- Vertragstests halten Ownership explizit
