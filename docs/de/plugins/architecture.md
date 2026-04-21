---
read_when:
    - Erstellen oder Debuggen nativer OpenClaw-Plugins
    - Verstehen des Plugin-Fähigkeitsmodells oder der Ownership-Grenzen
    - Arbeiten an der Plugin-Ladepipeline oder der Registry
    - Implementieren von Provider-Laufzeit-Hooks oder Channel-Plugins
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Ownership, Verträge, Ladepipeline und Laufzeit-Helfer'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-21T06:27:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05b612f75189ba32f8c92e5a261241abdf9ad8d4a685c1d8da0cf9605d7158b7
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **ausführliche Architekturreferenz**. Für praktische Anleitungen siehe:
  - [Install and use plugins](/de/tools/plugin) — Benutzeranleitung
  - [Getting Started](/de/plugins/building-plugins) — erstes Plugin-Tutorial
  - [Channel Plugins](/de/plugins/sdk-channel-plugins) — einen Messaging-Kanal erstellen
  - [Provider Plugins](/de/plugins/sdk-provider-plugins) — einen Modell-Provider erstellen
  - [SDK Overview](/de/plugins/sdk-overview) — Import-Map und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des Plugin-Systems von OpenClaw.

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit              | Registrierungsmethode                           | Beispiel-Plugins                     |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Textinferenz           | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Sprache                | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)`| `openai`                             |
| Echtzeit-Sprache       | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Web-Abruf              | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Websuche               | `api.registerWebSearchProvider(...)`            | `google`                             |
| Kanal / Messaging      | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools oder
Dienste bereitstellt, ist ein **Legacy-Hook-only**-Plugin. Dieses Muster wird weiterhin vollständig unterstützt.

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Core eingeführt und wird heute von gebündelten/nativen Plugins
verwendet, aber externe Plugin-Kompatibilität braucht weiterhin strengere Maßstäbe als „es ist
exportiert, also ist es eingefroren“.

Aktuelle Leitlinien:

- **bestehende externe Plugins:** hookbasierte Integrationen funktionsfähig halten; behandle
  dies als Kompatibilitäts-Basislinie
- **neue gebündelte/native Plugins:** explizite Fähigkeitsregistrierung gegenüber
  anbieterspezifischen Reach-ins oder neuen Hook-only-Designs bevorzugen
- **externe Plugins, die Fähigkeitsregistrierung übernehmen:** erlaubt, aber behandle die
  fähigkeitsspezifischen Hilfsoberflächen als in Entwicklung, sofern die Dokumentation einen
  Vertrag nicht ausdrücklich als stabil markiert

Praktische Regel:

- APIs zur Fähigkeitsregistrierung sind die beabsichtigte Richtung
- Legacy-Hooks bleiben während des Übergangs der sicherste Weg ohne Brüche für externe Plugins
- exportierte Helper-Subpaths sind nicht alle gleich; bevorzuge den schmalen dokumentierten
  Vertrag, nicht beiläufige Helper-Exporte

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability** -- registriert genau einen Fähigkeitstyp (zum Beispiel ein
  reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Fähigkeitstypen (zum Beispiel
  besitzt `openai` Textinferenz, Sprache, Medienverständnis und Bild-
  generierung)
- **hook-only** -- registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten,
  Tools, Befehle oder Dienste
- **non-capability** -- registriert Tools, Befehle, Dienste oder Routen, aber keine
  Fähigkeiten

Verwende `openclaw plugins inspect <id>`, um die Form und die Fähigkeitsaufschlüsselung eines Plugins zu sehen. Siehe [CLI reference](/cli/plugins#inspect) für Details.

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für
Hook-only-Plugins unterstützt. Legacy-Plugins aus der Praxis hängen weiterhin davon ab.

Richtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeiten an Modell-/Provider-Overrides bevorzugen
- `before_prompt_build` für Arbeiten an Prompt-Mutationen bevorzugen
- erst entfernen, wenn die tatsächliche Nutzung sinkt und Fixture-Abdeckung sichere Migration belegt

### Kompatibilitätssignale

Wenn du `openclaw doctor` oder `openclaw plugins inspect <id>` ausführst, siehst du möglicherweise
eine dieser Kennzeichnungen:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, was veraltet ist     |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` werden dein Plugin heute kaputt machen --
`hook-only` ist ein Hinweis, und `before_agent_start` erzeugt nur eine Warnung. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Schichten:

1. **Manifest + Discovery**
   OpenClaw findet Kandidaten-Plugins aus konfigurierten Pfaden, Workspace-Roots,
   globalen Extension-Roots und gebündelten Extensions. Discovery liest zuerst native
   `openclaw.plugin.json`-Manifeste plus unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein entdecktes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Speicher ausgewählt ist.
3. **Laufzeitladen**
   Native OpenClaw-Plugins werden In-Process über jiti geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden zu
   Registry-Einträgen normalisiert, ohne Laufzeitcode zu importieren.
4. **Oberflächennutzung**
   Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-
   Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.

Speziell für die Plugin-CLI ist die Root-Command-Discovery in zwei Phasen aufgeteilt:

- Parse-Time-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das echte Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

Dadurch bleibt plugin-eigener CLI-Code im Plugin, während OpenClaw trotzdem
Root-Befehlsnamen vor dem Parsing reservieren kann.

Die wichtige Designgrenze:

- Discovery + Konfigurationsvalidierung sollen aus **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- natives Laufzeitverhalten kommt aus dem `register(api)`-Pfad des Plugin-Moduls

Diese Aufteilung ermöglicht es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu erklären und
UI-/Schema-Hinweise zu erzeugen, bevor die vollständige Laufzeit aktiv ist.

### Channel-Plugins und das gemeinsame Message-Tool

Channel-Plugins müssen für normale Chat-Aktionen kein separates Send/Edit/React-Tool registrieren.
OpenClaw hält ein gemeinsames `message`-Tool im Core, und Channel-Plugins besitzen die
kanalspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den gemeinsamen `message`-Tool-Host, Prompt-Verkabelung, Session-/Thread-
  Bookkeeping und Ausführungs-Dispatch
- Channel-Plugins besitzen scoped Action-Discovery, Fähigkeits-Discovery und alle
  kanalspezifischen Schema-Fragmente
- Channel-Plugins besitzen die provider-spezifische Session-Konversationsgrammatik, zum Beispiel
  wie Konversations-IDs Thread-IDs kodieren oder von übergeordneten Konversationen erben
- Channel-Plugins führen die endgültige Aktion über ihren Action-Adapter aus

Für Channel-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser vereinheitlichte Discovery-Aufruf
ermöglicht einem Plugin, sichtbare Aktionen, Fähigkeiten und Schema-Beiträge
gemeinsam zurückzugeben, damit diese Teile nicht auseinanderdriften.

Wenn ein kanalspezifischer Message-Tool-Parameter eine Medienquelle wie einen
lokalen Pfad oder eine Remote-Medien-URL trägt, sollte das Plugin außerdem
`mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Core verwendet diese explizite
Liste, um Sandbox-Pfadnormalisierung und Hinweise für ausgehenden Medienzugriff anzuwenden,
ohne plugin-eigene Parameternamen hart zu kodieren.
Bevorzuge dort action-scoped Maps, nicht eine kanalweite flache Liste, damit ein
profilbezogener Medienparameter nicht bei nicht zusammenhängenden Aktionen wie
`send` normalisiert wird.

Der Core übergibt Laufzeit-Scope in diesen Discovery-Schritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist wichtig für kontextsensitive Plugins. Ein Kanal kann Message-Aktionen
abhängig vom aktiven Konto, aktuellem Raum/Thread/Nachricht oder vertrauenswürdiger
Requester-Identität ausblenden oder einblenden, ohne kanalspezifische Verzweigungen im
gemeinsamen Core-`message`-Tool hart zu kodieren.

Deshalb bleiben Änderungen am Embedded-Runner-Routing weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Session-Identität in die Plugin-
Discovery-Grenze weiterzuleiten, damit das gemeinsame `message`-Tool die richtige kanal-
eigene Oberfläche für den aktuellen Zug freilegt.

Für kanal-eigene Ausführungs-Helper sollten gebündelte Plugins die Ausführungs-
Laufzeit in ihren eigenen Extension-Modulen behalten. Der Core besitzt nicht länger die
Message-Action-Laufzeiten für Discord, Slack, Telegram oder WhatsApp unter `src/agents/tools`.
Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Subpaths, und gebündelte
Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren extension-eigenen
Modulen importieren.

Dieselbe Grenze gilt generell für provider-benannte SDK-Seams: Der Core sollte
keine kanalspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Extensions importieren. Wenn der Core ein Verhalten braucht,
entweder das eigene `api.ts`- / `runtime-api.ts`-Barrel des gebündelten Plugins verwenden oder
den Bedarf in eine schmale generische Fähigkeit im gemeinsamen SDK überführen.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Kanäle, die zum allgemeinen
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische
  Umfrage-Semantik oder zusätzliche Umfrageparameter

Der Core verzögert jetzt das gemeinsame Poll-Parsing, bis der Plugin-Poll-Dispatch
die Aktion ablehnt, damit plugin-eigene Poll-Handler kanalspezifische Poll-
Felder akzeptieren können, ohne zuerst vom generischen Poll-Parser blockiert zu werden.

Siehe [Load pipeline](#load-pipeline) für die vollständige Startsequenz.

## Ownership-Modell für Fähigkeiten

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium unzusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte in der Regel alle diesem Unternehmen zugewandten
  OpenClaw-Oberflächen besitzen
- ein Feature-Plugin sollte in der Regel die vollständige von ihm eingeführte
  Feature-Oberfläche besitzen
- Kanäle sollten gemeinsame Core-Fähigkeiten nutzen, statt Provider-Verhalten ad hoc
  neu zu implementieren

Beispiele:

- das gebündelte `openai`-Plugin besitzt das OpenAI-Modell-Provider-Verhalten sowie OpenAI-
  Sprache + Echtzeit-Sprache + Medienverständnis + Bildgenerierungsverhalten
- das gebündelte `elevenlabs`-Plugin besitzt das ElevenLabs-Sprachverhalten
- das gebündelte `microsoft`-Plugin besitzt das Microsoft-Sprachverhalten
- das gebündelte `google`-Plugin besitzt das Google-Modell-Provider-Verhalten plus Google-
  Medienverständnis + Bildgenerierung + Websuchverhalten
- das gebündelte `firecrawl`-Plugin besitzt das Firecrawl-Web-Abruf-Verhalten
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre
  Medienverständnis-Backends
- das gebündelte `qwen`-Plugin besitzt das Qwen-Text-Provider-Verhalten plus
  Medienverständnis- und Videogenerierungsverhalten
- das Plugin `voice-call` ist ein Feature-Plugin: Es besitzt Call-Transport, Tools,
  CLI, Routen und Twilio-Media-Stream-Bridge, nutzt aber gemeinsame Sprache-
  sowie Echtzeit-Transkriptions- und Echtzeit-Sprache-Fähigkeiten, statt
  Anbieter-Plugins direkt zu importieren

Der beabsichtigte Endzustand ist:

- OpenAI lebt in einem Plugin, auch wenn es Textmodelle, Sprache, Bilder und
  zukünftiges Video umfasst
- ein anderer Anbieter kann dasselbe für seine eigene Oberflächenbreite tun
- Kanäle kümmern sich nicht darum, welches Anbieter-Plugin den Provider besitzt; sie nutzen den
  gemeinsamen Fähigkeitsvertrag, den der Core bereitstellt

Das ist der zentrale Unterschied:

- **Plugin** = Ownership-Grenze
- **Fähigkeit** = Core-Vertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also eine neue Domäne wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider sollte Video-Handling hart kodieren?“ Die erste Frage lautet „was ist
der Core-Fähigkeitsvertrag für Video?“ Sobald dieser Vertrag existiert, können
Anbieter-Plugins ihn registrieren und Kanal-/Feature-Plugins ihn nutzen.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt normalerweise:

1. die fehlende Fähigkeit im Core definieren
2. sie typisiert über die Plugin-API/Laufzeit verfügbar machen
3. Kanäle/Features gegen diese Fähigkeit verdrahten
4. Anbieter-Plugins Implementierungen registrieren lassen

Das hält Ownership explizit und vermeidet gleichzeitig Core-Verhalten, das von einem
einzigen Anbieter oder einem einmaligen plugin-spezifischen Codepfad abhängt.

### Fähigkeits-Schichtenmodell

Verwende dieses mentale Modell, um zu entscheiden, wo Code hingehört:

- **Core-Fähigkeitsschicht**: gemeinsame Orchestrierung, Richtlinie, Fallback, Konfigurations-
  Merge-Regeln, Zustellungssemantik und typisierte Verträge
- **Anbieter-Plugin-Schicht**: anbieterspezifische APIs, Authentifizierung, Modellkataloge, Sprache-
  Synthese, Bildgenerierung, zukünftige Video-Backends, Usage-Endpunkte
- **Kanal-/Feature-Plugin-Schicht**: Integration von Slack/Discord/voice-call/usw.,
  die Core-Fähigkeiten nutzt und auf einer Oberfläche präsentiert

Zum Beispiel folgt TTS dieser Form:

- der Core besitzt die TTS-Richtlinie zur Antwortzeit, Fallback-Reihenfolge, Präferenzen und Kanalzustellung
- `openai`, `elevenlabs` und `microsoft` besitzen Synthese-Implementierungen
- `voice-call` nutzt den Laufzeit-Helper für Telephony-TTS

Dasselbe Muster sollte für zukünftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Multi-Fähigkeits-Unternehmens-Plugin

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medien-
verständnis, Bildgenerierung, Videogenerierung, Web-Abruf und Websuche hat,
kann ein Anbieter all seine Oberflächen an einem Ort besitzen:

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

Wichtig sind nicht die exakten Helper-Namen. Entscheidend ist die Form:

- ein Plugin besitzt die Anbieteroberfläche
- der Core besitzt weiterhin die Fähigkeitsverträge
- Kanal- und Feature-Plugins nutzen `api.runtime.*`-Helper, nicht Anbietercode
- Vertragstests können prüfen, dass das Plugin die Fähigkeiten registriert hat, die
  es zu besitzen beansprucht

### Fähigkeitsbeispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Fähigkeit. Dasselbe Ownership-Modell gilt auch dort:

1. der Core definiert den Vertrag für Medienverständnis
2. Anbieter-Plugins registrieren je nach Anwendbarkeit `describeImage`, `transcribeAudio` und
   `describeVideo`
3. Kanal- und Feature-Plugins nutzen das gemeinsame Core-Verhalten, statt
   direkt an Anbietercode zu verdrahten

So werden die Video-Annahmen eines einzelnen Providers nicht in den Core eingebaut. Das Plugin besitzt
die Anbieteroberfläche; der Core besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Videogenerierung verwendet bereits dieselbe Reihenfolge: Der Core besitzt den typisierten
Fähigkeitsvertrag und den Laufzeit-Helper, und Anbieter-Plugins registrieren
Implementierungen von `api.registerVideoGenerationProvider(...)` dagegen.

Du brauchst eine konkrete Rollout-Checkliste? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Oberfläche der Plugin-API ist bewusst typisiert und zentralisiert in
`OpenClawPluginApi`. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Laufzeit-Helper, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Ownership ablehnen, etwa wenn zwei Plugins dieselbe
  Provider-ID registrieren
- beim Start können umsetzbare Diagnosen für fehlerhafte Registrierung angezeigt werden
- Vertragstests können die Ownership gebündelter Plugins durchsetzen und stilles Drift verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung bei Laufzeitregistrierung**
   Die Plugin-Registry validiert Registrierungen beim Laden von Plugins. Beispiele:
   doppelte Provider-IDs, doppelte Sprach-Provider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden bei Testläufen in Vertrags-Registries erfasst, damit
   OpenClaw Ownership explizit prüfen kann. Heute wird das für Modell-
   Provider, Sprach-Provider, Websuch-Provider und Ownership gebündelter Registrierungen verwendet.

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche
Oberfläche besitzt. Dadurch können Core und Kanäle nahtlos zusammenspielen, weil Ownership
deklariert, typisiert und testbar ist, statt implizit zu sein.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- im Besitz des Core
- von mehreren Plugins wiederverwendbar
- von Kanälen/Features ohne Anbieterwissen nutzbar

Schlechte Plugin-Verträge sind:

- anbieterspezifische Richtlinie, die im Core versteckt ist
- einmalige Escape Hatches für Plugins, die die Registry umgehen
- Kanalcode, der direkt in eine Anbieterimplementierung greift
- ad hoc Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Im Zweifel hebe die Abstraktionsebene an: Definiere zuerst die Fähigkeit, dann
lass Plugins daran andocken.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **in-process** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe Trust-Grenze auf Prozessebene wie
Core-Code.

Implikationen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Bug in einem nativen Plugin kann das Gateway abstürzen lassen oder destabilisieren
- ein bösartiges natives Plugin entspricht willkürlicher Codeausführung innerhalb des
  OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit
als Metadaten-/Content-Pakete behandelt. In aktuellen Releases bedeutet das meist
gebündelte Skills.

Verwende Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandle
Workspace-Plugins als Code zur Entwicklungszeit, nicht als Produktionsstandard.

Bei gebündelten Workspace-Paketnamen sollte die Plugin-ID im npm-
Namen verankert bleiben: standardmäßig `@openclaw/<id>` oder ein genehmigtes typisiertes Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

Wichtiger Vertrauenshinweis:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/allowlisted ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.

## Export-Grenze

OpenClaw exportiert Fähigkeiten, nicht Implementierungs-Convience.

Halte Fähigkeitsregistrierung öffentlich. Beschneide nicht-vertragliche Helper-Exporte:

- Helper-Subpaths spezifisch für gebündelte Plugins
- Laufzeit-Plumbing-Subpaths, die nicht als öffentliche API gedacht sind
- anbieterspezifische Convenience-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Einige Helper-Subpaths gebündelter Plugins verbleiben aus Kompatibilitätsgründen und für die
Wartung gebündelter Plugins weiterhin in der generierten SDK-Export-Map. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandle diese als
reservierte Exporte für Implementierungsdetails, nicht als das empfohlene SDK-Muster für
neue Plugins von Drittanbietern.

## Ladepipeline

Beim Start macht OpenClaw grob Folgendes:

1. Plugin-Roots für Kandidaten entdecken
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module über jiti laden
7. native `register(api)`-Hooks (oder `activate(api)` — ein Legacy-Alias) aufrufen und Registrierungen in die Plugin-Registry einsammeln
8. die Registry für Befehle/Laufzeitoberflächen bereitstellen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`) und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzuge `register` für neue Plugins.
</Note>

Die Sicherheitsschranken greifen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Einstiegspunkt aus dem Plugin-Root ausbricht, der Pfad world-writable ist oder die Pfad-
Ownership bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-First-Verhalten

Das Manifest ist die Control-Plane-Quelle der Wahrheit. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Konfigurationsschema oder Bundle-Fähigkeiten zu entdecken
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter in der Control UI zu ergänzen
- Installations-/Katalogmetadaten anzuzeigen
- kostengünstige Aktivierungs- und Setup-Deskriptoren zu bewahren, ohne die Plugin-Laufzeit zu laden

Bei nativen Plugins ist das Laufzeitmodul der Data-Plane-Teil. Es registriert das
tatsächliche Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben auf der Control Plane.
Sie sind rein metadatenbasierte Deskriptoren für Aktivierungsplanung und Setup-Discovery;
sie ersetzen weder Laufzeitregistrierung, `register(...)` noch `setupEntry`.
Die ersten Live-Aktivierungs-Consumer verwenden jetzt Manifest-Hinweise zu Befehlen, Kanälen und Providern,
um das Laden von Plugins vor einer breiteren Materialisierung der Registry einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, die den angeforderten primären Befehl besitzen
- Kanal-Setup-/Plugin-Auflösung wird auf Plugins eingegrenzt, die die angeforderte
  Kanal-ID besitzen
- explizite Provider-Setup-/Laufzeit-Auflösung wird auf Plugins eingegrenzt, die die
  angeforderte Provider-ID besitzen

Die Setup-Discovery bevorzugt jetzt descriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf
`setup-api` für Plugins zurückfällt, die weiterhin Laufzeit-Hooks zur Setup-Zeit benötigen. Wenn mehr als
ein entdecktes Plugin dieselbe normalisierte Setup-Provider- oder CLI-Backend-
ID beansprucht, lehnt die Setup-Suche den mehrdeutigen Besitzer ab, statt sich auf die Discovery-
Reihenfolge zu verlassen.

### Was der Loader zwischenspeichert

OpenClaw hält kurze In-Process-Caches für:

- Discovery-Ergebnisse
- Daten der Manifest-Registry
- geladene Plugin-Registries

Diese Caches reduzieren burstartige Startvorgänge und den Overhead wiederholter Befehle. Man kann sie
sicher als kurzlebige Performance-Caches verstehen, nicht als Persistenz.

Hinweis zur Performance:

- Setze `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passe Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins mutieren nicht direkt zufällige globale Core-Zustände. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Einträge (Identität, Quelle, Herkunft, Status, Diagnostik)
- Tools
- Legacy-Hooks und typisierte Hooks
- Kanäle
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrare
- Hintergrunddienste
- plugin-eigene Befehle

Core-Features lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen
zu sprechen. Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Core-Laufzeit -> Registry-Nutzung

Diese Trennung ist wichtig für Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt brauchen: „Registry lesen“, nicht „jedes Plugin-
Modul speziell behandeln“.

## Callbacks für Konversations-Bindings

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwende `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bind-
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

Felder der Callback-Nutzlast:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: das aufgelöste Binding für genehmigte Anfragen
- `request`: die ursprüngliche Anfragezusammenfassung, Detach-Hinweis, Sender-ID und
  Konversationsmetadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine
Konversation binden darf, und läuft, nachdem die Core-Behandlung der Genehmigung abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben jetzt zwei Schichten:

- Manifest-Metadaten: `providerAuthEnvVars` für günstige Provider-Env-Auth-Suche
  vor dem Laufzeitladen, `providerAuthAliases` für Provider-Varianten mit gemeinsamer
  Authentifizierung, `channelEnvVars` für günstige Kanal-Env-/Setup-Suche vor dem Laufzeit-
  Laden sowie `providerAuthChoices` für günstige Onboarding-/Auth-Choice-Labels und
  CLI-Flag-Metadaten vor dem Laufzeitladen
- Hooks zur Konfigurationszeit: `catalog` / Legacy-`discovery` plus `applyConfigDefaults`
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
  `isBinaryThinking`, `supportsXHighThinking`, `supportsAdaptiveThinking`,
  `supportsMaxThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw besitzt weiterhin die generische Agent-Schleife, das Failover, die Transcript-Verarbeitung und
Tool-Richtlinien. Diese Hooks sind die Erweiterungsoberfläche für anbieterspezifisches Verhalten, ohne
einen vollständig benutzerdefinierten Inferenz-Transport zu benötigen.

Verwende Manifest-`providerAuthEnvVars`, wenn der Provider envbasierte Anmeldedaten
hat, die generische Auth-/Status-/Model-Picker-Pfade ohne Laden der Plugin-Laufzeit sehen
sollen. Verwende Manifest-`providerAuthAliases`, wenn eine Provider-ID die Env-Variablen,
Auth-Profile, config-gestützte Authentifizierung und API-Key-Onboarding-Auswahl einer
anderen Provider-ID wiederverwenden soll. Verwende Manifest-`providerAuthChoices`, wenn
Onboarding-/Auth-Choice-CLI-Oberflächen die Choice-ID des Providers, Gruppenlabels und einfache
Auth-Verdrahtung mit einem Flag kennen sollen, ohne die Provider-Laufzeit zu laden. Behalte in der Provider-
Laufzeit `envVars` für operatorbezogene Hinweise wie Onboarding-Labels oder OAuth-
Client-ID-/Client-Secret-Setup-Variablen.

Verwende Manifest-`channelEnvVars`, wenn ein Kanal envgesteuerte Authentifizierung oder Setup hat,
die generischer Shell-Env-Fallback, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen
sollen, ohne die Kanal-Laufzeit zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks grob in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.

| #   | Hook                              | Was er macht                                                                                                   | Wann verwenden                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Veröffentlicht die Provider-Konfiguration in `models.providers` während der Generierung von `models.json`      | Der Provider besitzt einen Katalog oder Standardwerte für `baseUrl`                                                                         |
| 2   | `applyConfigDefaults`             | Wendet provider-eigene globale Konfigurations-Standardwerte während der Materialisierung der Konfiguration an  | Standardwerte hängen von Auth-Modus, Env oder Semantik der Provider-Modellfamilie ab                                                       |
| --  | _(eingebaute Modellsuche)_        | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                    | _(kein Plugin-Hook)_                                                                                                                        |
| 3   | `normalizeModelId`                | Normalisiert Legacy- oder Preview-Aliase für Modell-IDs vor der Suche                                          | Der Provider besitzt Alias-Bereinigung vor der kanonischen Modellauflösung                                                                  |
| 4   | `normalizeTransport`              | Normalisiert `api` / `baseUrl` einer Provider-Familie vor der generischen Modellassemblierung                  | Der Provider besitzt Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                               |
| 5   | `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung                                      | Der Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Helper der Google-Familie stützen auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Wendet native Streaming-Usage-Kompatibilitäts-Umschreibungen auf Konfigurations-Provider an                    | Der Provider benötigt endpunktgesteuerte Korrekturen für native Streaming-Usage-Metadaten                                                  |
| 7   | `resolveConfigApiKey`             | Löst Authentifizierung über Env-Marker für Konfigurations-Provider vor dem Laden der Laufzeit-Authentifizierung auf | Der Provider hat provider-eigene Auflösung von API-Keys über Env-Marker; `amazon-bedrock` hat hier außerdem einen eingebauten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | Macht lokale/selbstgehostete oder konfigurationsgestützte Authentifizierung sichtbar, ohne Klartext zu persistieren | Der Provider kann mit einem synthetischen/lokalen Marker für Anmeldedaten arbeiten                                                         |
| 9   | `resolveExternalAuthProfiles`     | Legt provider-eigene externe Auth-Profile darüber; Standard `persistence` ist `runtime-only` für CLI-/app-eigene Anmeldedaten | Der Provider verwendet externe Auth-Anmeldedaten wieder, ohne kopierte Refresh-Tokens zu persistieren                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | Stuft gespeicherte synthetische Profil-Platzhalter hinter env-/config-gestützte Authentifizierung herab       | Der Provider speichert synthetische Platzhalterprofile, die keine höhere Priorität haben sollten                                           |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind                | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                       |
| 12  | `prepareDynamicModel`             | Asynchrones Warm-up, danach läuft `resolveDynamicModel` erneut                                                 | Der Provider benötigt Netzwerk-Metadaten, bevor unbekannte IDs aufgelöst werden können                                                     |
| 13  | `normalizeResolvedModel`          | Letzte Umschreibung, bevor der Embedded Runner das aufgelöste Modell verwendet                                 | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                              |
| 14  | `contributeResolvedModelCompat`   | Liefert Kompatibilitäts-Flags für Anbieter-Modelle hinter einem anderen kompatiblen Transport                  | Der Provider erkennt eigene Modelle auf Proxy-Transporten, ohne die Provider-Rolle zu übernehmen                                           |
| 15  | `capabilities`                    | Provider-eigene Transcript-/Tooling-Metadaten, die von gemeinsamer Core-Logik verwendet werden                | Der Provider benötigt Besonderheiten für Transcript/Provider-Familie                                                                        |
| 16  | `normalizeToolSchemas`            | Normalisiert Tool-Schemas, bevor der Embedded Runner sie sieht                                                 | Der Provider benötigt Bereinigung von Schemas der Transportfamilie                                                                          |
| 17  | `inspectToolSchemas`              | Macht provider-eigene Schema-Diagnostik nach der Normalisierung sichtbar                                       | Der Provider möchte Keyword-Warnungen, ohne dem Core provider-spezifische Regeln beizubringen                                              |
| 18  | `resolveReasoningOutputMode`      | Wählt nativen oder getaggten Vertrag für Reasoning-Output                                                      | Der Provider benötigt getaggten Reasoning-/Final-Output statt nativer Felder                                                               |
| 19  | `prepareExtraParams`              | Normalisierung von Request-Parametern vor generischen Wrappern für Stream-Optionen                             | Der Provider benötigt Standard-Request-Parameter oder providerbezogene Bereinigung von Parametern                                          |
| 20  | `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                         | Der Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                      |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                   | Der Provider benötigt Wrapper für Request-Header/Body/Modell-Kompatibilität ohne benutzerdefinierten Transport                             |
| 22  | `resolveTransportTurnState`       | Hängt native Header oder Metadaten pro Turn für den Transport an                                               | Der Provider möchte, dass generische Transporte provider-native Turn-Identität senden                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Hängt native WebSocket-Header oder eine Session-Abkühlrichtlinie an                                            | Der Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien anpassen                                       |
| 24  | `formatApiKey`                    | Auth-Profile-Formatter: gespeichertes Profil wird zur Laufzeitzeichenfolge `apiKey`                            | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Laufzeit-Token-Form                                |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Richtlinie bei Refresh-Fehlern            | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                              |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                           | Der Provider benötigt provider-eigene Auth-Reparaturhinweise nach einem Refresh-Fehler                                                     |
| 27  | `matchesContextOverflowError`     | Provider-eigener Matcher für Überläufe des Kontextfensters                                                     | Der Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                        |
| 28  | `classifyFailoverReason`          | Provider-eigene Klassifizierung von Failover-Gründen                                                           | Der Provider kann rohe API-/Transport-Fehler auf Rate-Limit/Überlastung/usw. abbilden                                                     |
| 29  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                           | Der Provider benötigt proxyspezifisches TTL-Gating für den Cache                                                                            |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Authentifizierung                          | Der Provider benötigt einen provider-spezifischen Wiederherstellungshinweis bei fehlender Authentifizierung                                |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerorientierter Fehlerhinweis                  | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Anbieterhinweis ersetzen                                           |
| 32  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen, die nach der Discovery angehängt werden                                     | Der Provider benötigt synthetische Vorwärtskompatibilitäts-Zeilen in `models list` und Pickern                                             |
| 33  | `isBinaryThinking`                | On/Off-Reasoning-Toggle für Provider mit binärem Thinking                                                      | Der Provider stellt nur binäres Thinking an/aus bereit                                                                                      |
| 34  | `supportsXHighThinking`           | Unterstützung für `xhigh`-Reasoning bei ausgewählten Modellen                                                  | Der Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                             |
| 35  | `supportsAdaptiveThinking`        | Unterstützung für `adaptive` Thinking bei ausgewählten Modellen                                                | Der Provider möchte `adaptive` nur für Modelle anzeigen, bei denen der Provider adaptives Thinking verwaltet                               |
| 36  | `supportsMaxThinking`             | Unterstützung für `max`-Reasoning bei ausgewählten Modellen                                                    | Der Provider möchte `max` nur für Modelle anzeigen, die Provider-Max-Thinking unterstützen                                                 |
| 37  | `resolveDefaultThinkingLevel`     | Standard-`/think`-Level für eine bestimmte Modellfamilie                                                       | Der Provider besitzt die Standard-`/think`-Richtlinie für eine Modellfamilie                                                               |
| 38  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                            | Der Provider besitzt das Matching für bevorzugte Live-/Smoke-Modelle                                                                        |
| 39  | `prepareRuntimeAuth`              | Tauscht konfigurierte Anmeldedaten unmittelbar vor der Inferenz gegen das tatsächliche Laufzeit-Token/den Schlüssel aus | Der Provider benötigt einen Token-Austausch oder kurzlebige Request-Anmeldedaten                                                           |
| 40  | `resolveUsageAuth`                | Löst Usage-/Billing-Anmeldedaten für `/usage` und verwandte Statusoberflächen auf                             | Der Provider benötigt benutzerdefiniertes Parsing von Usage-/Quota-Tokens oder andere Usage-Anmeldedaten                                   |
| 41  | `fetchUsageSnapshot`              | Holt und normalisiert providerspezifische Usage-/Quota-Snapshots, nachdem die Authentifizierung aufgelöst wurde | Der Provider benötigt einen providerspezifischen Usage-Endpunkt oder Payload-Parser                                                        |
| 42  | `createEmbeddingProvider`         | Baut einen provider-eigenen Embedding-Adapter für Speicher/Suche                                               | Verhalten von Memory-Embeddings gehört zum Provider-Plugin                                                                                  |
| 43  | `buildReplayPolicy`               | Gibt eine Replay-Richtlinie zurück, die die Transcript-Verarbeitung für den Provider steuert                  | Der Provider benötigt benutzerdefinierte Transcript-Richtlinien (zum Beispiel das Entfernen von Thinking-Blöcken)                          |
| 44  | `sanitizeReplayHistory`           | Schreibt den Replay-Verlauf nach generischer Transcript-Bereinigung um                                         | Der Provider benötigt providerspezifische Replay-Umschreibungen über gemeinsame Compaction-Helper hinaus                                   |
| 45  | `validateReplayTurns`             | Endgültige Validierung oder Umformung von Replay-Turns vor dem Embedded Runner                                | Der Provider-Transport benötigt strengere Turn-Validierung nach generischer Bereinigung                                                    |
| 46  | `onModelSelected`                 | Führt provider-eigene Seiteneffekte nach der Modellauswahl aus                                                 | Der Provider benötigt Telemetrie oder provider-eigenen Status, wenn ein Modell aktiv wird                                                  |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
zugeordnete Provider-Plugin und fallen dann auf andere Hook-fähige Provider-Plugins
zurück, bis eines die Modell-ID oder Transport/Konfiguration tatsächlich ändert. So bleiben
Alias-/Kompatibilitäts-Shims für Provider funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten Eintrag
der Google-Familie in der Konfiguration umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer diese
Kompatibilitätsbereinigung weiterhin an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten Request-Executor benötigt,
ist das eine andere Klasse von Erweiterung. Diese Hooks sind für Provider-Verhalten gedacht,
das weiterhin auf der normalen Inferenzschleife von OpenClaw läuft.

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

### Eingebaute Beispiele

- Anthropic verwendet `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `supportsAdaptiveThinking`, `supportsMaxThinking`, `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  und `wrapStreamFn`, weil es Vorwärtskompatibilität für Claude 4.6,
  Hinweise zur Provider-Familie, Hinweise zur Auth-Reparatur, Integration des Usage-Endpunkts,
  Eignung für Prompt-Cache, authbewusste Konfigurations-Standardwerte, die
  Standard-/adaptive Thinking-Richtlinie von Claude und anthropic-spezifische Stream-Formung für
  Beta-Header, `/fast` / `serviceTier` und `context1m` besitzt.
- Die Claude-spezifischen Stream-Helper von Anthropic bleiben vorerst in der eigenen
  öffentlichen `api.ts`- / `contract-api.ts`-Seam des gebündelten Plugins. Diese Paketoberfläche
  exportiert `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Low-Level-
  Wrapper-Builder für Anthropic, statt das generische SDK um die
  Beta-Header-Regeln eines einzelnen Providers zu erweitern.
- OpenAI verwendet `resolveDynamicModel`, `normalizeResolvedModel` und
  `capabilities` plus `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` und `isModernModelRef`,
  weil es Vorwärtskompatibilität für GPT-5.4, die direkte OpenAI-
  Normalisierung `openai-completions` -> `openai-responses`, Codex-bewusste Auth-
  Hinweise, Spark-Unterdrückung, synthetische OpenAI-List-Zeilen und die GPT-5-Thinking- /
  Live-Model-Richtlinie besitzt; die Stream-Familie `openai-responses-defaults` besitzt die
  gemeinsamen nativen OpenAI-Responses-Wrapper für Attribution-Header,
  `/fast`/`serviceTier`, Textausführlichkeit, native Codex-Websuche,
  Shaping der Reasoning-Kompatibilitäts-Payload und Context-Management für Responses.
- OpenRouter verwendet `catalog` plus `resolveDynamicModel` und
  `prepareDynamicModel`, weil der Provider als Pass-through arbeitet und neue
  Modell-IDs anbieten kann, bevor sich der statische Katalog von OpenClaw aktualisiert; außerdem verwendet er
  `capabilities`, `wrapStreamFn` und `isCacheTtlEligible`, um
  providerspezifische Request-Header, Routing-Metadaten, Reasoning-Patches und
  Prompt-Cache-Richtlinien aus dem Core herauszuhalten. Seine Replay-Richtlinie kommt aus der
  Familie `passthrough-gemini`, während die Stream-Familie `openrouter-thinking`
  die Proxy-Injektion von Reasoning und das Überspringen nicht unterstützter Modelle bzw. von `auto` besitzt.
- GitHub Copilot verwendet `catalog`, `auth`, `resolveDynamicModel` und
  `capabilities` plus `prepareRuntimeAuth` und `fetchUsageSnapshot`, weil es
  provider-eigenes Device-Login, Modell-Fallback-Verhalten, Claude-Transcript-
  Besonderheiten, einen GitHub-Token-zu-Copilot-Token-Austausch und einen provider-eigenen
  Usage-Endpunkt benötigt.
- OpenAI Codex verwendet `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` und `augmentModelCatalog` plus
  `prepareExtraParams`, `resolveUsageAuth` und `fetchUsageSnapshot`, weil es
  weiterhin auf Core-OpenAI-Transporten läuft, aber seine Transport-/Base-URL-
  Normalisierung, OAuth-Refresh-Fallback-Richtlinie, Standard-Transportauswahl,
  synthetische Codex-Katalogzeilen und die Integration des ChatGPT-Usage-Endpunkts besitzt; es
  teilt dieselbe Stream-Familie `openai-responses-defaults` wie direktes OpenAI.
- Google AI Studio und Gemini CLI OAuth verwenden `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` und `isModernModelRef`, weil die
  Replay-Familie `google-gemini` den Fallback für Vorwärtskompatibilität von Gemini 3.1,
  native Gemini-Replay-Validierung, Bootstrap-Replay-Bereinigung, den getaggten
  Reasoning-Output-Modus und modernes Modell-Matching besitzt, während die
  Stream-Familie `google-thinking` die Normalisierung der Gemini-Thinking-Payload besitzt;
  Gemini CLI OAuth verwendet außerdem `formatApiKey`, `resolveUsageAuth` und
  `fetchUsageSnapshot` für Token-Formatierung, Token-Parsing und die Verdrahtung des Quota-Endpunkts.
- Anthropic Vertex verwendet `buildReplayPolicy` über die
  Replay-Familie `anthropic-by-model`, damit Claude-spezifische Replay-Bereinigung
  auf Claude-IDs begrenzt bleibt statt auf jeden `anthropic-messages`-Transport.
- Amazon Bedrock verwendet `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` und `resolveDefaultThinkingLevel`, weil es
  Bedrock-spezifische Klassifizierung von Throttle-/Not-ready-/Kontext-Overflow-Fehlern
  für Anthropic-auf-Bedrock-Datenverkehr besitzt; seine Replay-Richtlinie teilt sich weiterhin denselben
  rein Claude-bezogenen Guard `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode und Opencode Go verwenden `buildReplayPolicy`
  über die Replay-Familie `passthrough-gemini`, weil sie Gemini-
  Modelle über OpenAI-kompatible Transporte proxien und eine Bereinigung der Gemini-
  Thought-Signature ohne native Gemini-Replay-Validierung oder Bootstrap-Umschreibungen benötigen.
- MiniMax verwendet `buildReplayPolicy` über die
  Replay-Familie `hybrid-anthropic-openai`, weil ein Provider sowohl
  Anthropic-Messages- als auch OpenAI-kompatible Semantik besitzt; es behält das
  Entfernen von Claude-Thinking-Blöcken nur auf der Anthropic-Seite bei, während der Reasoning-
  Output-Modus zurück auf nativ überschrieben wird, und die Stream-Familie `minimax-fast-mode`
  besitzt Umschreibungen für Fast-Mode-Modelle auf dem gemeinsamen Stream-Pfad.
- Moonshot verwendet `catalog` plus `wrapStreamFn`, weil es weiterhin den gemeinsamen
  OpenAI-Transport nutzt, aber provider-eigene Normalisierung der Thinking-Payload benötigt; die
  Stream-Familie `moonshot-thinking` bildet Konfiguration plus `/think`-Status auf ihre
  native binäre Thinking-Payload ab.
- Kilocode verwendet `catalog`, `capabilities`, `wrapStreamFn` und
  `isCacheTtlEligible`, weil es provider-eigene Request-Header,
  Normalisierung der Reasoning-Payload, Hinweise für Gemini-Transcripts und Anthropic-
  Cache-TTL-Gating benötigt; die Stream-Familie `kilocode-thinking` hält die Injektion von
  Kilo-Thinking auf dem gemeinsamen Proxy-Stream-Pfad, während `kilo/auto` und
  andere Proxy-Modell-IDs übersprungen werden, die keine expliziten Reasoning-Payloads unterstützen.
- Z.AI verwendet `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` und `fetchUsageSnapshot`, weil es den GLM-5-Fallback,
  Standardwerte für `tool_stream`, die UX für binäres Thinking, modernes Modell-Matching und sowohl
  Usage-Auth als auch das Abrufen von Quoten besitzt; die Stream-Familie `tool-stream-default-on`
  hält den standardmäßig aktivierten Wrapper für `tool_stream` aus handgeschriebenem Glue pro Provider heraus.
- xAI verwendet `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` und `isModernModelRef`,
  weil es die native xAI-Responses-Transportnormalisierung, Umschreibungen für Grok-
  Fast-Mode-Aliase, Standard-`tool_stream`, Bereinigung strikter Tool-/Reasoning-Payloads,
  Wiederverwendung von Fallback-Authentifizierung für plugin-eigene Tools, Auflösung von Grok-
  Modellen mit Vorwärtskompatibilität und provider-eigene Kompatibilitäts-Patches wie das xAI-Tool-Schema-
  Profil, nicht unterstützte Schema-Keywords, natives `web_search` und das Dekodieren von HTML-Entities in
  Tool-Call-Argumenten besitzt.
- Mistral, OpenCode Zen und OpenCode Go verwenden nur `capabilities`, um
  Besonderheiten bei Transcript/Tooling aus dem Core herauszuhalten.
- Gebündelte Provider, die nur den Katalog besitzen, wie `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` und `volcengine`, verwenden
  nur `catalog`.
- Qwen verwendet `catalog` für seinen Text-Provider plus gemeinsame Registrierungen für Medienverständnis und
  Videogenerierung für seine multimodalen Oberflächen.
- MiniMax und Xiaomi verwenden `catalog` plus Usage-Hooks, weil ihr Verhalten für `/usage`
  plugin-eigen ist, obwohl die Inferenz weiterhin über die gemeinsamen Transporte läuft.

## Laufzeit-Helper

Plugins können über `api.runtime` auf ausgewählte Core-Helper zugreifen. Für TTS:

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
- Verwendet die Core-Konfiguration `messages.tts` und Provider-Auswahl.
- Gibt PCM-Audiopuffer + Sample-Rate zurück. Plugins müssen für Provider neu sampeln/kodieren.
- `listVoices` ist je Provider optional. Verwende es für provider-eigene Voice-Picker oder Setup-Flows.
- Voice-Listen können umfangreichere Metadaten wie Locale, Geschlecht und Personality-Tags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telephony. Microsoft nicht.

Plugins können außerdem Sprach-Provider über `api.registerSpeechProvider(...)` registrieren.

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

- Halte TTS-Richtlinie, Fallback und Antwortzustellung im Core.
- Verwende Sprach-Provider für anbietereigenes Syntheseverhalten.
- Die Legacy-Eingabe `edge` von Microsoft wird zur Provider-ID `microsoft` normalisiert.
- Das bevorzugte Ownership-Modell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text-, Sprach-, Bild- und zukünftige Medien-Provider besitzen, sobald OpenClaw diese
  Fähigkeitsverträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Provider für Medienverständnis statt eines generischen Key/Value-Bags:

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

- Behalte Orchestrierung, Fallback, Konfiguration und Kanal-Verdrahtung im Core.
- Behalte Anbieterverhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Videogenerierung folgt bereits demselben Muster:
  - der Core besitzt den Fähigkeitsvertrag und den Laufzeit-Helper
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins nutzen `api.runtime.videoGeneration.*`

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
- Verwendet die Core-Audiokonfiguration für Medienverständnis (`tools.media.audio`) und die Fallback-Reihenfolge für Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitäts-Alias erhalten.

Plugins können auch Hintergrundläufe von Subagents über `api.runtime.subagent` starten:

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
- Für plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwende `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel ausdrücklich zu erlauben.
- Nicht vertrauenswürdige Subagent-Läufe von Plugins funktionieren weiterhin, aber Override-Anfragen werden abgelehnt, statt stillschweigend auf Fallback zurückzufallen.

Für Websuche können Plugins den gemeinsamen Laufzeit-Helper verwenden, statt
in die Tool-Verdrahtung des Agents einzugreifen:

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

Plugins können Websuch-Provider auch über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalte Providerauswahl, Auflösung von Anmeldedaten und gemeinsame Request-Semantik im Core.
- Verwende Websuch-Provider für anbieterspezifische Suchtransporte.
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
- `listProviders(...)`: verfügbare Provider für Bildgenerierung und ihre Fähigkeiten auflisten.

## Gateway-HTTP-Routen

Plugins können HTTP-Endpunkte mit `api.registerHttpRoute(...)` bereitstellen.

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

Routenfelder:

- `path`: Routenpfad unter dem Gateway-HTTP-Server.
- `auth`: erforderlich. Verwende `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für pluginverwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: `true` zurückgeben, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Fehler beim Laden des Plugins. Verwende stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` ausdrücklich deklarieren.
- Konflikte bei exakt gleichem `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halte Fallthrough-Ketten mit `exact`/`prefix` nur auf derselben `auth`-Stufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Runtime-Scopes für Operatoren. Sie sind für pluginverwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Gateway-Helper-Aufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Request-Runtime-Scopes, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Authentifizierung (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes für Plugin-Routen auf `operator.write` fest, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit identitätsbezogenen Daten (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur dann, wenn der Header ausdrücklich vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen identitätsbezogenen Plugin-Routen-Anfragen fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehe nicht davon aus, dass eine gateway-auth-Plugin-Route implizit eine Admin-Oberfläche ist. Wenn deine Route Verhalten nur für Administratoren benötigt, verlange einen identitätsbezogenen Auth-Modus und dokumentiere den ausdrücklichen Header-Vertrag für `x-openclaw-scopes`.

## Importpfade des Plugin SDK

Verwende SDK-Subpaths statt des monolithischen Imports `openclaw/plugin-sdk`,
wenn du Plugins entwickelst:

- `openclaw/plugin-sdk/plugin-entry` für Primitiven zur Plugin-Registrierung.
- `openclaw/plugin-sdk/core` für den generischen gemeinsamen pluginseitigen Vertrag.
- `openclaw/plugin-sdk/config-schema` für den Export des Zod-Schemas der Root-`openclaw.json`
  (`OpenClawSchema`).
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
  `channel-inbound` ist die gemeinsame Heimat für Debounce, Mention-Matching,
  Helper für eingehende Mention-Richtlinien, Envelope-Formatierung und
  Kontext-Helper für eingehende Envelopes.
  `channel-setup` ist die schmale optionale Setup-Seam für Installationen.
  `setup-runtime` ist die laufzeitsichere Setup-Oberfläche, die von `setupEntry` /
  verzögertem Start verwendet wird, einschließlich der importsicheren Setup-Patch-Adapter.
  `setup-adapter-runtime` ist die envbewusste Adapter-Seam für Account-Setup.
  `setup-tools` ist die kleine Helper-Seam für CLI/Archive/Dokumentation (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domänen-Subpaths wie `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
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
  `telegram-command-config` ist die schmale öffentliche Seam für die Normalisierung/Validierung benutzerdefinierter
  Telegram-Befehle und bleibt verfügbar, auch wenn die gebündelte
  Telegram-Vertragsoberfläche vorübergehend nicht verfügbar ist.
  `text-runtime` ist die gemeinsame Text-/Markdown-/Logging-Seam, einschließlich
  des Entfernens für den Assistant sichtbaren Texts, Render-/Chunking-Helpern für Markdown, Redaction-
  Helpern, Helpern für Directive-Tags und Safe-Text-Dienstprogrammen.
- Kanalspezifische Seams für Genehmigungen sollten einen einzigen Vertrag `approvalCapability`
  auf dem Plugin bevorzugen. Der Core liest dann Authentifizierung, Zustellung, Rendering,
  natives Routing und Lazy-Verhalten nativer Handler für Genehmigungen über diese eine Fähigkeit,
  statt Genehmigungsverhalten in nicht zusammenhängende Plugin-Felder zu mischen.
- `openclaw/plugin-sdk/channel-runtime` ist veraltet und bleibt nur als
  Kompatibilitäts-Shim für ältere Plugins erhalten. Neuer Code sollte stattdessen die engeren
  generischen Primitiven importieren, und Repo-Code sollte keine neuen Importe des
  Shim hinzufügen.
- Gebündelte Extension-Interna bleiben privat. Externe Plugins sollten nur
  `openclaw/plugin-sdk/*`-Subpaths verwenden. OpenClaw-Core-/Test-Code darf die repo-
  öffentlichen Einstiegspunkte unter einem Plugin-Paket-Root verwenden, etwa `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` und eng begrenzte Dateien wie
  `login-qr-api.js`. Importiere niemals `src/*` eines Plugin-Pakets aus dem Core oder aus
  einer anderen Extension.
- Aufteilung der Repo-Einstiegspunkte:
  `<plugin-package-root>/api.js` ist das Barrel für Helper/Typen,
  `<plugin-package-root>/runtime-api.js` ist das reine Runtime-Barrel,
  `<plugin-package-root>/index.js` ist der Einstiegspunkt des gebündelten Plugins
  und `<plugin-package-root>/setup-entry.js` ist der Setup-Einstiegspunkt des Plugins.
- Aktuelle Beispiele für gebündelte Provider:
  - Anthropic verwendet `api.js` / `contract-api.js` für Claude-Stream-Helper wie
    `wrapAnthropicProviderStream`, Helper für Beta-Header und das Parsing von `service_tier`.
  - OpenAI verwendet `api.js` für Provider-Builder, Helper für Standardmodelle und
    Builder für Echtzeit-Provider.
  - OpenRouter verwendet `api.js` für seinen Provider-Builder plus Onboarding-/Konfigurations-
    Helper, während `register.runtime.js` weiterhin generische
    `plugin-sdk/provider-stream`-Helper zur repo-lokalen Verwendung re-exportieren kann.
- Öffentlich zugängliche Einstiegspunkte, die über Facades geladen werden, bevorzugen den aktiven Laufzeit-Snapshot der Konfiguration,
  wenn einer existiert, und fallen sonst auf die auf dem Datenträger aufgelöste Konfigurationsdatei zurück, wenn
  OpenClaw noch keinen Laufzeit-Snapshot bereitstellt.
- Generische gemeinsame Primitiven bleiben der bevorzugte öffentliche SDK-Vertrag. Eine kleine
  reservierte Kompatibilitätsmenge an Helper-Seams mit Branding gebündelter Kanäle existiert weiterhin. Behandle diese als
  Seams für Wartung/Kompatibilität gebündelter Plugins, nicht als neue Importziele für Drittanbieter; neue kanalübergreifende Verträge sollten weiterhin auf
  generischen `plugin-sdk/*`-Subpaths oder den pluginlokalen Barrels `api.js` /
  `runtime-api.js` landen.

Kompatibilitätshinweis:

- Vermeide für neuen Code das Root-Barrel `openclaw/plugin-sdk`.
- Bevorzuge zuerst die schmalen stabilen Primitiven. Die neueren Subpaths für setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sind der beabsichtigte Vertrag für neue
  gebündelte und externe Plugin-Arbeit.
  Parsing/Matching von Zielen gehört auf `openclaw/plugin-sdk/channel-targets`.
  Gates für Message-Aktionen und Reaction-Helper für Message-IDs gehören auf
  `openclaw/plugin-sdk/channel-actions`.
- Helper-Barrels, die spezifisch für gebündelte Extensions sind, sind standardmäßig nicht stabil. Wenn ein
  Helper nur von einer gebündelten Extension benötigt wird, behalte ihn hinter der
  lokalen Seam `api.js` oder `runtime-api.js` der Extension, statt ihn in
  `openclaw/plugin-sdk/<extension>` hochzustufen.
- Neue gemeinsame Helper-Seams sollten generisch sein, nicht kanalgebrandet. Gemeinsames Parsing von Zielen
  gehört auf `openclaw/plugin-sdk/channel-targets`; kanalspezifische
  Interna bleiben hinter der lokalen Seam `api.js` oder `runtime-api.js` des besitzenden Plugins.
- Fähigkeitsspezifische Subpaths wie `image-generation`,
  `media-understanding` und `speech` existieren, weil gebündelte/native Plugins sie
  heute verwenden. Ihre Existenz bedeutet für sich genommen nicht, dass jeder exportierte Helper ein
  langfristig eingefrorener externer Vertrag ist.

## Schemas für Message-Tools

Plugins sollten kanalspezifische Schema-Beiträge für `describeMessageTool(...)`
besitzen. Behalte providerspezifische Felder im Plugin, nicht im gemeinsamen Core.

Für gemeinsame portable Schema-Fragmente verwende die generischen Helper wieder, die über
`openclaw/plugin-sdk/channel-actions` exportiert werden:

- `createMessageToolButtonsSchema()` für Payloads im Stil eines Button-Rasters
- `createMessageToolCardSchema()` für strukturierte Card-Payloads

Wenn eine Schema-Form nur für einen Provider sinnvoll ist, definiere sie in den
eigenen Quelldateien dieses Plugins, statt sie in das gemeinsame SDK hochzustufen.

## Auflösung von Channel-Zielen

Channel-Plugins sollten kanalspezifische Zielsemantik besitzen. Halte den gemeinsamen
ausgehenden Host generisch und verwende die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  als `direct`, `group` oder `channel` behandelt werden soll, bevor eine Verzeichnissuche erfolgt.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt zur idartigen Auflösung springen soll statt zur Verzeichnissuche.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  der Core nach der Normalisierung oder nach einem Verzeichnis-Fehltreffer eine endgültige provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt den providerspezifischen Sitzungs-
  Routenaufbau, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwende `inferTargetChatType` für Kategorieentscheidungen, die vor der
  Suche nach Peers/Gruppen stattfinden sollten.
- Verwende `looksLikeId` für Prüfungen vom Typ „als explizite/native Ziel-ID behandeln“.
- Verwende `resolveTarget` für providerspezifische Normalisierungs-Fallbacks, nicht für
  breite Verzeichnissuche.
- Halte provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs innerhalb von `target`-Werten oder providerspezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Helper aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwende dies, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- DM-Peers auf Basis von Allowlists
- konfigurierte Kanal-/Gruppenzuordnungen
- kontobezogene statische Verzeichnis-Fallbacks

Die gemeinsamen Helper in `directory-runtime` behandeln nur generische Operationen:

- Filtern von Abfragen
- Anwenden von Limits
- Helper für Deduplizierung/Normalisierung
- Erzeugen von `ChannelDirectoryEntry[]`

Kanalspezifische Kontoprüfung und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Providereintrag
- `{ providers }` für mehrere Providereinträge

Verwende `catalog`, wenn das Plugin providerspezifische Modell-IDs, Standardwerte für `baseUrl`
oder authgesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
eingebauten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache Provider mit API-Key oder envgesteuert
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammenhängende Providereinträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkonflikten, sodass Plugins absichtlich einen
eingebauten Providereintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Channel-Inspektion

Wenn dein Plugin einen Kanal registriert, bevorzuge die Implementierung von
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf annehmen, dass Anmeldedaten
  vollständig materialisiert sind, und schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie doctor-/config-
  Reparaturabläufe sollten Laufzeit-Anmeldedaten nicht materialisieren müssen, nur um
  die Konfiguration zu beschreiben.

Empfohlenes Verhalten für `inspectAccount(...)`:

- Nur beschreibenden Kontostatus zurückgeben.
- `enabled` und `configured` beibehalten.
- Felder für Herkunft/Status von Anmeldedaten einbeziehen, wenn relevant, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Du musst keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. `tokenStatus: "available"` zurückzugeben (und das passende Herkunftsfeld)
  reicht für Befehle im Stil von Status aus.
- Verwende `configured_unavailable`, wenn Anmeldedaten über SecretRef konfiguriert, aber
  im aktuellen Befehlspfad nicht verfügbar sind.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert auszuweisen.

## Package-Packs

Ein Plugin-Verzeichnis kann eine `package.json` mit `openclaw.extensions` enthalten:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Extensions aufführt, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn dein Plugin npm-Abhängigkeiten importiert, installiere sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis ausbrechen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halte die Abhängigkeits-
Bäume von Plugins „reines JS/TS“ und vermeide Pakete, die `postinstall`-Builds benötigen.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges, nur für Setup bestimmtes Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
statt des vollständigen Plugin-Einstiegspunkts. So bleiben Start und Setup leichter,
wenn dein Haupteinstiegspunkt auch Tools, Hooks oder anderen nur zur Laufzeit benötigten
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin auch dann in denselben `setupEntry`-Pfad einbinden, wenn der Kanal bereits
konfiguriert ist, und zwar während der Pre-Listen-Startphase des Gateways.

Verwende dies nur, wenn `setupEntry` die gesamte Startoberfläche vollständig abdeckt, die
vor dem Starten des Gateway-Listenings existieren muss. In der Praxis bedeutet das, dass der Setup-Einstiegspunkt
jede kanal-eigene Fähigkeit registrieren muss, von der der Start abhängt, etwa:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway auf Listening geht
- alle Gateway-Methoden, Tools oder Dienste, die in demselben Zeitraum existieren müssen

Wenn dein vollständiger Einstiegspunkt weiterhin eine erforderliche Startfähigkeit besitzt, aktiviere
dieses Flag nicht. Behalte das Standardverhalten des Plugins und lasse OpenClaw während des
Starts den vollständigen Einstiegspunkt laden.

Gebündelte Kanäle können außerdem Setup-only-Helper für Vertragsoberflächen veröffentlichen, die der Core
konsultieren kann, bevor die vollständige Kanal-Laufzeit geladen ist. Die aktuelle Setup-
Promotion-Oberfläche ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn eine Legacy-Einzelkonto-Kanal-
Konfiguration in `channels.<id>.accounts.*` hochgestuft werden muss, ohne den vollständigen Plugin-Einstiegspunkt zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes hochgestuftes Konto, wenn bereits benannte Konten existieren, und kann einen
konfigurierten nicht-kanonischen Standardkonto-Schlüssel beibehalten, statt immer
`accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Discovery der gebündelten Vertragsoberfläche lazy. Die Import-
Zeit bleibt leicht; die Promotion-Oberfläche wird erst bei der ersten Verwendung geladen, statt den Start gebündelter Kanäle beim Modulimport erneut auszuführen.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, halte sie auf einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

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

### Metadaten des Channel-Katalogs

Channel-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bekannt machen. Dadurch bleibt der Core-Katalog datenfrei.

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

Nützliche Felder in `openclaw.channel` über das Minimalbeispiel hinaus:

- `detailLabel`: sekundäres Label für umfangreichere Katalog-/Statusoberflächen
- `docsLabel`: überschreibt den Linktext für den Doku-Link
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerelemente für Copy auf Auswahloberflächen
- `markdownCapable`: markiert den Kanal als markdownfähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Kanal aus Oberflächen für konfigurierte Kanäle aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal aus interaktiven Setup-/Configure-Pickern aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Kanal für Doku-Navigationsoberflächen als intern/privat
- `showConfigured` / `showInSetup`: Legacy-Aliase werden aus Kompatibilitätsgründen weiterhin akzeptiert; bevorzuge `exposure`
- `quickstartAllowFrom`: optiert den Kanal in den standardmäßigen Quickstart-`allowFrom`-Ablauf ein
- `forceAccountBinding`: erzwingt explizites Account-Binding, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt Session-Lookup beim Auflösen von Ankündigungszielen

OpenClaw kann außerdem **externe Channel-Kataloge** zusammenführen (zum Beispiel einen Export
aus einer MPM-Registry). Lege eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder setze `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als Legacy-Aliase für den Schlüssel `"entries"`.

## Plugins für die Context Engine

Plugins für die Context Engine besitzen die Orchestrierung des Sitzungskontexts für Ingest, Assembly
und Compaction. Registriere sie aus deinem Plugin mit
`api.registerContextEngine(id, factory)` und wähle dann die aktive Engine mit
`plugins.slots.contextEngine` aus.

Verwende dies, wenn dein Plugin die Standard-Context-Pipeline ersetzen oder erweitern muss,
statt nur Memory-Suche oder Hooks hinzuzufügen.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Wenn deine Engine den Compaction-Algorithmus **nicht** besitzt, halte `compact()`
implementiert und delegiere ihn ausdrücklich:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Hinzufügen einer neuen Fähigkeit

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehe nicht
das Plugin-System mit einem privaten Reach-in. Füge die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheide, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Konfigurations-Merge,
   Lebenszyklus, kanalseitige Semantik und Form des Laufzeit-Helfers.
2. typisierte Plugin-Registrierungs-/Laufzeitoberflächen hinzufügen
   Erweitere `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Core + Verbraucher in Kanal/Feature verdrahten
   Kanäle und Feature-Plugins sollten die neue Fähigkeit über den Core nutzen,
   nicht durch direkten Import einer Anbieterimplementierung.
4. Anbieterimplementierungen registrieren
   Anbieter-Plugins registrieren dann ihre Backends gegen diese Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Füge Tests hinzu, damit Ownership und Registrierungsform im Laufe der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne auf das Weltbild eines einzigen
Providers hart kodiert zu werden. Siehe das [Capability Cookbook](/de/plugins/architecture)
für eine konkrete Dateicheckliste und ein ausgearbeitetes Beispiel.

### Checkliste für Fähigkeiten

Wenn du eine neue Fähigkeit hinzufügst, sollte die Implementierung diese
Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeit-Helfer in `src/<capability>/runtime.ts`
- Registrierungsoberfläche der Plugin-API in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Plugin-Laufzeitbereitstellung in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie nutzen müssen
- Capture-/Test-Helper in `src/test-utils/plugin-registration.ts`
- Ownership-/Vertrags-Assertions in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das normalerweise ein Zeichen dafür, dass die Fähigkeit
noch nicht vollständig integriert ist.

### Vorlage für Fähigkeiten

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

Damit bleibt die Regel einfach:

- der Core besitzt den Fähigkeitsvertrag + die Orchestrierung
- Anbieter-Plugins besitzen Anbieterimplementierungen
- Feature-/Channel-Plugins nutzen Laufzeit-Helper
- Vertragstests halten Ownership explizit
