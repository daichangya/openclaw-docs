---
read_when:
    - Native OpenClaw-Plugins erstellen oder debuggen
    - Das Fähigkeitsmodell oder die Eigentumsgrenzen von Plugins verstehen
    - An der Plugin-Lade-Pipeline oder der Registry arbeiten
    - Provider-Runtime-Hooks oder Channel-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Eigentümerschaft, Verträge, Lade-Pipeline und Runtime-Hilfsfunktionen'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-12T23:28:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37361c1e9d2da57c77358396f19dfc7f749708b66ff68f1bf737d051b5d7675d
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **umfassende Architekturreferenz**. Praktische Leitfäden finden Sie unter:
  - [Plugins installieren und verwenden](/de/tools/plugin) — Benutzerleitfaden
  - [Erste Schritte](/de/plugins/building-plugins) — erstes Plugin-Tutorial
  - [Channel-Plugins](/de/plugins/sdk-channel-plugins) — einen Messaging-Kanal erstellen
  - [Provider-Plugins](/de/plugins/sdk-provider-plugins) — einen Modellanbieter erstellen
  - [SDK-Überblick](/de/plugins/sdk-overview) — Importzuordnung und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des OpenClaw-Plugin-Systems.

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit              | Registrierungsmethode                            | Beispiel-Plugins                     |
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
| Channel / Messaging    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools oder
Dienste bereitstellt, ist ein **altes Hook-only-Plugin**. Dieses Muster wird weiterhin vollständig unterstützt.

### Externe Kompatibilitätsposition

Das Fähigkeitsmodell ist im Core eingeführt und wird heute von gebündelten/nativen Plugins
verwendet, aber die Kompatibilität externer Plugins benötigt weiterhin strengere Kriterien als „es ist
exportiert, also ist es eingefroren“.

Aktuelle Leitlinien:

- **bestehende externe Plugins:** Hook-basierte Integrationen funktionsfähig halten; dies
  als Kompatibilitäts-Basislinie behandeln
- **neue gebündelte/native Plugins:** explizite Fähigkeitsregistrierung statt
  anbieterspezifischer direkter Eingriffe oder neuer Hook-only-Designs bevorzugen
- **externe Plugins mit Fähigkeitsregistrierung:** erlaubt, aber die
  fähigkeitsspezifischen Hilfsoberflächen als weiterentwickelnd behandeln, sofern die Dokumentation einen
  Vertrag nicht ausdrücklich als stabil kennzeichnet

Praktische Regel:

- APIs zur Fähigkeitsregistrierung sind die beabsichtigte Richtung
- alte Hooks bleiben während des Übergangs der sicherste Weg ohne
  Brüche für externe Plugins
- exportierte Hilfs-Subpfade sind nicht alle gleich; bevorzugen Sie den schmalen dokumentierten
  Vertrag, nicht beiläufig exportierte Hilfsfunktionen

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability** -- registriert genau einen Fähigkeitstyp (zum Beispiel ein
  reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Fähigkeitstypen (zum Beispiel
  besitzt `openai` Textinferenz, Sprache, Medienverständnis und
  Bildgenerierung)
- **hook-only** -- registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten,
  Tools, Befehle oder Dienste
- **non-capability** -- registriert Tools, Befehle, Dienste oder Routen, aber keine
  Fähigkeiten

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und die
Aufschlüsselung der Fähigkeiten eines Plugins anzuzeigen. Details finden Sie in der [CLI-Referenz](/cli/plugins#inspect).

### Alte Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für
Hook-only-Plugins unterstützt. Alte reale Plugins sind weiterhin darauf angewiesen.

Ausrichtung:

- funktionsfähig halten
- als veraltet dokumentieren
- für Arbeiten an Modell-/Provider-Überschreibungen `before_model_resolve` bevorzugen
- für Prompt-Mutationen `before_prompt_build` bevorzugen
- erst entfernen, wenn die reale Nutzung sinkt und die Fixture-Abdeckung die Migrationssicherheit belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eine dieser Bezeichnungen:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, das veraltet ist     |
| **hard error**             | Konfiguration ist ungültig oder das Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` beschädigen Ihr Plugin heute --
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Schichten:

1. **Manifest + Erkennung**
   OpenClaw findet mögliche Plugins in konfigurierten Pfaden, Workspace-Roots,
   globalen Extension-Roots und gebündelten Extensions. Die Erkennung liest zuerst native
   `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie den Speicher ausgewählt wird.
3. **Runtime-Laden**
   Native OpenClaw-Plugins werden prozessintern über jiti geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden zu
   Registry-Einträgen normalisiert, ohne Runtime-Code zu importieren.
4. **Nutzung der Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Channels, Provider-
   Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.

Speziell für die Plugin-CLI ist die Erkennung von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Time-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich bei der ersten Ausführung registrieren

So bleibt plugin-eigener CLI-Code im Plugin, während OpenClaw dennoch
Root-Befehlsnamen vor dem Parsen reservieren kann.

Die wichtige Entwurfsgrenze:

- Erkennung + Konfigurationsvalidierung sollten anhand von **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- natives Runtime-Verhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Trennung ermöglicht es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu
erklären und UI-/Schema-Hinweise zu erstellen, bevor die vollständige Runtime aktiv ist.

### Channel-Plugins und das gemeinsame Message-Tool

Channel-Plugins müssen für normale Chat-Aktionen kein separates Tool zum Senden/Bearbeiten/Reagieren registrieren.
OpenClaw behält ein gemeinsames `message`-Tool im Core, und
Channel-Plugins besitzen die channelspezifische Erkennung und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den gemeinsamen Host des `message`-Tools, die Prompt-Verkabelung, die
  Sitzungs-/Thread-Buchführung und die Ausführungsweiterleitung
- Channel-Plugins besitzen die bereichsspezifische Aktionserkennung, Fähigkeitserkennung und alle
  channelspezifischen Schemafragmente
- Channel-Plugins besitzen die anbieterspezifische Grammatik für Sitzungsgespräche, also etwa
  wie Gesprächs-IDs Thread-IDs kodieren oder von übergeordneten Gesprächen erben
- Channel-Plugins führen die endgültige Aktion über ihren Aktionsadapter aus

Für Channel-Plugins lautet die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche
Erkennungsaufruf ermöglicht es einem Plugin, seine sichtbaren Aktionen, Fähigkeiten und
Schema-Beiträge gemeinsam zurückzugeben, sodass diese Teile nicht auseinanderdriften.

Der Core übergibt den Runtime-Bereich an diesen Erkennungsschritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Channel kann
Message-Aktionen abhängig vom aktiven Konto, dem aktuellen Raum/Thread/Nachricht oder der
vertrauenswürdigen Identität des Anfragenden ausblenden oder anzeigen, ohne channelspezifische Verzweigungen
im Core-Tool `message` hart zu kodieren.

Deshalb sind Änderungen am Embedded-Runner-Routing weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität an die
Plugin-Erkennungsgrenze weiterzuleiten, damit das gemeinsame `message`-Tool für den aktuellen Zug die
richtige plugin-eigene Oberfläche bereitstellt.

Für ausführungsbezogene Hilfsfunktionen im Besitz eines Channels sollten gebündelte Plugins die
Ausführungs-Runtime in ihren eigenen Extension-Modulen behalten. Der Core besitzt nicht mehr die
Discord-, Slack-, Telegram- oder WhatsApp-Message-Action-Runtimes unter `src/agents/tools`.
Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Subpfade, und gebündelte
Plugins sollten ihren eigenen lokalen Runtime-Code direkt aus ihren
Extension-eigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für providerbenannte SDK-Seams: Der Core sollte
keine channelspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Extensions importieren. Wenn der Core ein Verhalten benötigt, sollte er entweder
das eigene Barrel `api.ts` / `runtime-api.ts` des gebündelten Plugins verwenden oder den Bedarf
in eine schmale generische Fähigkeit innerhalb des gemeinsamen SDK überführen.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Channels, die zum gemeinsamen
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für channelspezifische
  Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verschiebt jetzt das gemeinsame Parsen von Umfragen, bis die Weiterleitung an das Plugin für Umfragen
die Aktion ablehnt, sodass plugin-eigene Umfrage-Handler channelspezifische Umfragefelder
akzeptieren können, ohne zuerst vom generischen Umfrage-Parser blockiert zu werden.

Die vollständige Startsequenz finden Sie unter [Lade-Pipeline](#load-pipeline).

## Modell der Fähigkeits-Eigentümerschaft

OpenClaw behandelt ein natives Plugin als Eigentumsgrenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte in der Regel alle OpenClaw-seitigen
  Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte in der Regel die vollständige Oberfläche des von ihm eingeführten
  Features besitzen
- Channels sollten gemeinsame Core-Fähigkeiten verwenden, anstatt
  Provider-Verhalten ad hoc neu zu implementieren

Beispiele:

- das gebündelte Plugin `openai` besitzt das Modell-Provider-Verhalten von OpenAI sowie das OpenAI-
  Verhalten für Sprache, Echtzeit-Stimme, Medienverständnis und Bildgenerierung
- das gebündelte Plugin `elevenlabs` besitzt das Sprachverhalten von ElevenLabs
- das gebündelte Plugin `microsoft` besitzt das Sprachverhalten von Microsoft
- das gebündelte Plugin `google` besitzt das Modell-Provider-Verhalten von Google sowie das Google-
  Verhalten für Medienverständnis, Bildgenerierung und Web-Suche
- das gebündelte Plugin `firecrawl` besitzt das Web-Abruf-Verhalten von Firecrawl
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre
  Backends für Medienverständnis
- das gebündelte Plugin `qwen` besitzt das Text-Provider-Verhalten von Qwen sowie
  das Verhalten für Medienverständnis und Videogenerierung
- das Plugin `voice-call` ist ein Feature-Plugin: Es besitzt Anruftransport, Tools,
  CLI, Routen und Twilio-Media-Stream-Bridging, verwendet aber gemeinsame Fähigkeiten für Sprache
  sowie Echtzeit-Transkription und Echtzeit-Stimme, statt Anbieter-Plugins direkt zu importieren

Der beabsichtigte Endzustand ist:

- OpenAI lebt in einem Plugin, auch wenn es Textmodelle, Sprache, Bilder und
  zukünftiges Video umfasst
- ein anderer Anbieter kann dasselbe für seine eigene Oberfläche tun
- Channels ist es egal, welches Anbieter-Plugin den Provider besitzt; sie verwenden den
  gemeinsamen Fähigkeitsvertrag, den der Core bereitstellt

Das ist der zentrale Unterschied:

- **Plugin** = Eigentumsgrenze
- **Fähigkeit** = Core-Vertrag, den mehrere Plugins implementieren oder verwenden können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider sollte die Videoverarbeitung fest verdrahten?“ Die erste Frage lautet:
„Was ist der Core-Vertrag für die Video-Fähigkeit?“ Sobald dieser Vertrag existiert,
können Anbieter-Plugins sich dagegen registrieren, und Channel-/Feature-Plugins können ihn verwenden.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt in der Regel:

1. die fehlende Fähigkeit im Core definieren
2. sie typisiert über die Plugin-API/Runtime verfügbar machen
3. Channels/Features an diese Fähigkeit anbinden
4. Anbieter-Plugins ihre Implementierungen registrieren lassen

So bleibt die Eigentümerschaft explizit, während Core-Verhalten vermieden wird, das von
einem einzelnen Anbieter oder einem einmaligen plugin-spezifischen Codepfad abhängt.

### Schichtung der Fähigkeiten

Verwenden Sie dieses mentale Modell, um zu entscheiden, wo Code hingehört:

- **Core-Fähigkeitsschicht**: gemeinsame Orchestrierung, Richtlinien, Fallback,
  Regeln zum Zusammenführen von Konfigurationen, Zustellungssemantik und typisierte Verträge
- **Anbieter-Plugin-Schicht**: anbieterspezifische APIs, Authentifizierung, Modellkataloge, Sprach-
  synthese, Bildgenerierung, zukünftige Video-Backends, Nutzungsendpunkte
- **Channel-/Feature-Plugin-Schicht**: Integration für Slack/Discord/voice-call/usw.,
  die Core-Fähigkeiten verwendet und sie auf einer Oberfläche bereitstellt

TTS folgt zum Beispiel dieser Form:

- der Core besitzt die TTS-Richtlinie zur Antwortzeit, die Fallback-Reihenfolge, Präferenzen und die Channel-Zustellung
- `openai`, `elevenlabs` und `microsoft` besitzen die Synthese-Implementierungen
- `voice-call` verwendet den Runtime-Helfer für Telephony-TTS

Dasselbe Muster sollte für zukünftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medienverständnis,
Bildgenerierung, Videogenerierung, Web-Abruf und Web-Suche hat,
kann ein Anbieter alle seine Oberflächen an einer Stelle besitzen:

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

Wichtig sind nicht die exakten Namen der Hilfsfunktionen. Wichtig ist die Form:

- ein Plugin besitzt die Anbieter-Oberfläche
- der Core besitzt weiterhin die Fähigkeitsverträge
- Channels und Feature-Plugins verwenden `api.runtime.*`-Hilfsfunktionen, nicht Anbieter-Code
- Vertragstests können prüfen, dass das Plugin die Fähigkeiten registriert hat,
  die es laut eigener Aussage besitzt

### Beispiel für eine Fähigkeit: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Fähigkeit. Dasselbe Eigentumsmodell gilt auch dort:

1. der Core definiert den Vertrag für Medienverständnis
2. Anbieter-Plugins registrieren je nach Anwendungsfall `describeImage`, `transcribeAudio` und
   `describeVideo`
3. Channels und Feature-Plugins verwenden das gemeinsame Core-Verhalten, statt
   direkt Anbieter-Code anzubinden

Dadurch werden nicht die Video-Annahmen eines einzelnen Providers in den Core eingebaut. Das Plugin besitzt
die Anbieter-Oberfläche; der Core besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Die Videogenerierung verwendet bereits dieselbe Abfolge: Der Core besitzt den typisierten
Fähigkeitsvertrag und den Runtime-Helfer, und Anbieter-Plugins registrieren
`api.registerVideoGenerationProvider(...)`-Implementierungen dagegen.

Benötigen Sie eine konkrete Checkliste für die Einführung? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist absichtlich typisiert und in
`OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Runtime-Hilfsfunktionen, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Eigentümerschaft ablehnen, etwa wenn zwei Plugins dieselbe
  Provider-ID registrieren
- beim Start können verwertbare Diagnosen für fehlerhafte Registrierungen angezeigt werden
- Vertragstests können die Eigentümerschaft gebündelter Plugins erzwingen und stilles Abdriften verhindern

Es gibt zwei Durchsetzungsebenen:

1. **Durchsetzung der Runtime-Registrierung**
   Die Plugin-Registry validiert Registrierungen, während Plugins geladen werden. Beispiele:
   doppelte Provider-IDs, doppelte Speech-Provider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefinierten Verhaltens.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, sodass
   OpenClaw die Eigentümerschaft explizit prüfen kann. Heute wird dies für Modell-
   Provider, Speech-Provider, Web-Such-Provider und die Eigentümerschaft gebündelter Registrierungen verwendet.

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche
Oberfläche besitzt. Dadurch können Core und Channels nahtlos zusammenspielen, weil die Eigentümerschaft
deklariert, typisiert und testbar ist, statt implizit zu bleiben.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- im Besitz des Core
- von mehreren Plugins wiederverwendbar
- von Channels/Features ohne Anbieterwissen nutzbar

Schlechte Plugin-Verträge sind:

- anbieterspezifische Richtlinien, die im Core versteckt sind
- einmalige Plugin-Notausgänge, die die Registry umgehen
- Channel-Code, der direkt in eine Anbieter-Implementierung greift
- ad hoc Runtime-Objekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Im Zweifel sollte die Abstraktionsebene erhöht werden: zuerst die Fähigkeit definieren, dann
Plugins daran andocken lassen.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im Prozess** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe prozessbezogene Vertrauensgrenze wie
Core-Code.

Auswirkungen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Fehler in einem nativen Plugin kann das Gateway zum Absturz bringen oder destabilisieren
- ein bösartiges natives Plugin entspricht beliebiger Codeausführung innerhalb des
  OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als
Metadaten-/Inhaltspakete behandelt. In aktuellen Releases bedeutet das meistens gebündelte
Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie
Workspace-Plugins als Entwicklungscode, nicht als Produktionsstandard.

Bei gebündelten Workspace-Paketnamen sollte die Plugin-ID im npm-Namen verankert bleiben:
standardmäßig `@openclaw/<id>` oder ein genehmigter typisierter Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

Wichtiger Hinweis zur Vertrauensstellung:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert ist oder auf der Allowlist steht.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.

## Exportgrenze

OpenClaw exportiert Fähigkeiten, keine Implementierungs-Bequemlichkeit.

Halten Sie die Fähigkeitsregistrierung öffentlich. Beschneiden Sie nicht-vertragliche Hilfsexporte:

- Hilfs-Subpfade für spezifische gebündelte Plugins
- Runtime-Plumbing-Subpfade, die nicht als öffentliche API gedacht sind
- anbieterspezifische Convenience-Hilfsfunktionen
- Setup-/Onboarding-Hilfsfunktionen, die Implementierungsdetails sind

Einige Hilfs-Subpfade gebündelter Plugins bleiben aus Kompatibilitätsgründen und für die Pflege gebündelter Plugins weiterhin in der generierten SDK-Exportzuordnung. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandeln Sie diese als
reservierte Exporte von Implementierungsdetails, nicht als das empfohlene SDK-Muster für
neue Drittanbieter-Plugins.

## Lade-Pipeline

Beim Start macht OpenClaw grob Folgendes:

1. mögliche Plugin-Roots erkennen
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module über jiti laden
7. native Hooks `register(api)` (oder `activate(api)` — ein alter Alias) aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Runtime-Oberflächen bereitstellen

<Note>
`activate` ist ein alter Alias für `register` — der Loader löst den jeweils vorhandenen Hook auf (`def.register ?? def.activate`) und ruft ihn an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; für neue Plugins sollte `register` bevorzugt werden.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Runtime-Ausführung. Kandidaten werden blockiert,
wenn der Einstiegspunkt den Plugin-Root verlässt, der Pfad weltweit beschreibbar ist oder die Pfad-
Eigentümerschaft bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-first-Verhalten

Das Manifest ist die Quelle der Wahrheit für die Control Plane. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Channels/Skills/Konfigurationsschema oder Bundle-Fähigkeiten zu erkennen
- `plugins.entries.<id>.config` zu validieren
- Bezeichnungen/Platzhalter in der Control UI zu ergänzen
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren beizubehalten, ohne die Plugin-Runtime zu laden

Bei nativen Plugins ist das Runtime-Modul der Data-Plane-Teil. Es registriert das
tatsächliche Verhalten, etwa Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben auf der Control Plane.
Sie sind reine Metadaten-Deskriptoren für die Aktivierungsplanung und die Setup-Erkennung;
sie ersetzen weder die Runtime-Registrierung, `register(...)` noch `setupEntry`.
Die ersten Live-Aktivierungsnutzer verwenden jetzt Manifest-Hinweise zu Befehlen, Channels und Providern,
um das Laden von Plugins einzuschränken, bevor eine breitere Materialisierung der Registry erfolgt:

- CLI-Laden wird auf Plugins eingeschränkt, die den angeforderten primären Befehl besitzen
- Channel-Setup/Plugin-Auflösung wird auf Plugins eingeschränkt, die die angeforderte
  Channel-ID besitzen
- explizite Provider-Setup-/Runtime-Auflösung wird auf Plugins eingeschränkt, die die
  angeforderte Provider-ID besitzen

Die Setup-Erkennung bevorzugt jetzt deskriptorbezogene IDs wie `setup.providers` und
`setup.cliBackends`, um mögliche Plugins einzuschränken, bevor sie für Plugins, die
weiterhin setupbezogene Runtime-Hooks benötigen, auf `setup-api` zurückfällt. Wenn mehr als
ein erkanntes Plugin dieselbe normalisierte Setup-Provider- oder CLI-Backend-
ID beansprucht, verweigert die Setup-Suche den mehrdeutigen Besitzer, statt sich auf die
Erkennungsreihenfolge zu verlassen.

### Was der Loader zwischenspeichert

OpenClaw hält kurze prozessinterne Caches für:

- Erkennungsergebnisse
- Daten der Manifest-Registry
- geladene Plugin-Registries

Diese Caches reduzieren Lastspitzen beim Start und den Overhead wiederholter Befehle. Sie können
als kurzlebige Performance-Caches verstanden werden, nicht als Persistenz.

Hinweis zur Performance:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passen Sie die Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins verändern nicht direkt beliebige globale Zustände des Core. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Einträge (Identität, Quelle, Ursprung, Status, Diagnosen)
- Tools
- alte Hooks und typisierte Hooks
- Channels
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrare
- Hintergrunddienste
- plugin-eigene Befehle

Core-Features lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen zu
sprechen. Dadurch bleibt das Laden gerichtet:

- Plugin-Modul -> Registrierung in der Registry
- Core-Runtime -> Nutzung der Registry

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt benötigen: „die Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für die Konversationsbindung

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung entschieden wurde.

Verwenden Sie `api.onConversationBindingResolved(...)`, um nach der Genehmigung oder Ablehnung einer Bindungsanfrage einen Callback zu erhalten:

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
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragezusammenfassung, Hinweis zum Lösen der Bindung, Sender-ID und
  Konversationsmetadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine Konversation binden darf,
und wird ausgeführt, nachdem die Core-Verarbeitung der Genehmigung abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins haben jetzt zwei Ebenen:

- Manifest-Metadaten: `providerAuthEnvVars` für eine kostengünstige Suche nach Provider-Umgebungsauthentifizierung
  vor dem Laden der Runtime, `providerAuthAliases` für Provider-Varianten, die sich
  Authentifizierung teilen, `channelEnvVars` für eine kostengünstige Suche nach Channel-Umgebungsvariablen/Setup vor dem Laden der Runtime,
  sowie `providerAuthChoices` für kostengünstige Onboarding-/Auth-Choice-Bezeichnungen und
  Metadaten zu CLI-Flags vor dem Laden der Runtime
- Hooks zur Konfigurationszeit: `catalog` / altes `discovery` sowie `applyConfigDefaults`
- Runtime-Hooks: `normalizeModelId`, `normalizeTransport`,
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

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, die Behandlung von Transkripten und die
Tool-Richtlinie. Diese Hooks sind die Erweiterungsoberfläche für anbieterspezifisches Verhalten, ohne
einen vollständig benutzerdefinierten Inferenz-Transport zu benötigen.

Verwenden Sie das Manifest `providerAuthEnvVars`, wenn der Provider umgebungsbasierte Anmeldedaten hat,
die generische Pfade für Authentifizierung/Status/Modellauswahl sehen sollten, ohne die Plugin-
Runtime zu laden. Verwenden Sie das Manifest `providerAuthAliases`, wenn eine Provider-ID
die Umgebungsvariablen, Auth-Profile, konfigurationsgestützte Authentifizierung und die API-Key-
Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll. Verwenden Sie das Manifest `providerAuthChoices`, wenn
CLI-Oberflächen für Onboarding/Auth-Choice die Choice-ID des Providers, Gruppenbezeichnungen und eine einfache
Authentifizierungsverdrahtung mit einem einzelnen Flag kennen sollen, ohne die Provider-Runtime zu laden. Behalten Sie in der Provider-
Runtime `envVars` für operatorbezogene Hinweise wie Onboarding-Bezeichnungen oder Variablen
für die Einrichtung von OAuth-Client-ID/-Secret bei.

Verwenden Sie das Manifest `channelEnvVars`, wenn ein Channel eine umgebungsgetriebene Authentifizierung oder Einrichtung hat,
die generischer Shell-Env-Fallback, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen
sollen, ohne die Channel-Runtime zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist der schnelle Entscheidungsleitfaden.

| #   | Hook                              | Funktion                                                                                                       | Wann verwenden                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der Generierung von `models.json` in `models.providers` veröffentlichen         | Der Provider besitzt einen Katalog oder Standardwerte für `baseUrl`                                                                         |
| 2   | `applyConfigDefaults`             | Plugin-eigene globale Konfigurationsstandardwerte während der Konfigurationsmaterialisierung anwenden          | Standardwerte hängen vom Auth-Modus, der Umgebung oder der Semantik der Modellfamilie des Providers ab                                     |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                    | _(kein Plugin-Hook)_                                                                                                                        |
| 3   | `normalizeModelId`                | Alte oder Preview-Aliasse für Modell-IDs vor der Suche normalisieren                                           | Der Provider besitzt die Alias-Bereinigung vor der kanonischen Modellauflösung                                                              |
| 4   | `normalizeTransport`              | `api` / `baseUrl` einer Provider-Familie vor der generischen Modellzusammenstellung normalisieren             | Der Provider besitzt die Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                           |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor der Runtime-/Provider-Auflösung normalisieren                                      | Der Provider benötigt eine Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Hilfsfunktionen der Google-Familie stützen auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Kompatibilitäts-Umschreibungen für native Streaming-Nutzung auf Konfigurations-Provider anwenden              | Der Provider benötigt endpunktgesteuerte Korrekturen der nativen Streaming-Nutzungsmetadaten                                               |
| 7   | `resolveConfigApiKey`             | Env-Marker-Authentifizierung für Konfigurations-Provider vor dem Laden der Runtime-Authentifizierung auflösen  | Der Provider besitzt eine eigene API-Key-Auflösung über Env-Marker; `amazon-bedrock` hat hier ebenfalls einen integrierten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | lokale/self-hosted oder konfigurationsgestützte Authentifizierung bereitstellen, ohne Klartext zu persistieren | Der Provider kann mit einem synthetischen/lokalen Anmeldedaten-Marker arbeiten                                                              |
| 9   | `resolveExternalAuthProfiles`     | plugin-eigene externe Auth-Profile überlagern; Standard für `persistence` ist `runtime-only` bei CLI-/app-eigenen Anmeldedaten | Der Provider verwendet externe Auth-Anmeldedaten wieder, ohne kopierte Refresh-Tokens zu persistieren                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | gespeicherte synthetische Profil-Platzhalter hinter umgebungs-/konfigurationsgestützter Authentifizierung zurückstufen | Der Provider speichert synthetische Platzhalterprofile, die keinen Vorrang haben sollten                                                    |
| 11  | `resolveDynamicModel`             | synchroner Fallback für plugin-eigene Modell-IDs, die noch nicht in der lokalen Registry stehen               | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                       |
| 12  | `prepareDynamicModel`             | asynchrones Warm-up, danach wird `resolveDynamicModel` erneut ausgeführt                                       | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                      |
| 13  | `normalizeResolvedModel`          | endgültige Umschreibung, bevor der Embedded Runner das aufgelöste Modell verwendet                             | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                               |
| 14  | `contributeResolvedModelCompat`   | Kompatibilitäts-Flags für Anbieter-Modelle hinter einem anderen kompatiblen Transport beisteuern              | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                           |
| 15  | `capabilities`                    | plugin-eigene Transkript-/Tooling-Metadaten, die von gemeinsamer Core-Logik verwendet werden                  | Der Provider benötigt Eigenheiten bei Transkripten oder der Provider-Familie                                                                |
| 16  | `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der Embedded Runner sie sieht                                                | Der Provider benötigt eine Schema-Bereinigung für eine Transportfamilie                                                                     |
| 17  | `inspectToolSchemas`              | plugin-eigene Schema-Diagnosen nach der Normalisierung bereitstellen                                           | Der Provider möchte Schlüsselwort-Warnungen bereitstellen, ohne dem Core anbieterspezifische Regeln beizubringen                           |
| 18  | `resolveReasoningOutputMode`      | nativen oder getaggten Vertrag für die Reasoning-Ausgabe auswählen                                             | Der Provider benötigt getaggte Reasoning-/Final-Output-Ausgabe statt nativer Felder                                                        |
| 19  | `prepareExtraParams`              | Normalisierung von Anfrageparametern vor generischen Stream-Options-Wrappern                                   | Der Provider benötigt Standard-Anfrageparameter oder eine Bereinigung der Parameter pro Provider                                            |
| 20  | `createStreamFn`                  | den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                        | Der Provider benötigt ein benutzerdefiniertes Wire-Protokoll und nicht nur einen Wrapper                                                    |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                   | Der Provider benötigt Wrapper für Anfrage-Header/Body/Modell-Kompatibilität ohne benutzerdefinierten Transport                             |
| 22  | `resolveTransportTurnState`       | native turn-spezifische Transport-Header oder Metadaten anhängen                                               | Der Provider möchte, dass generische Transporte eine provider-native Turn-Identität senden                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | native WebSocket-Header oder eine Session-Cool-down-Richtlinie anhängen                                        | Der Provider möchte, dass generische WS-Transporte Session-Header oder die Fallback-Richtlinie anpassen                                    |
| 24  | `formatApiKey`                    | Formatierer für Auth-Profile: gespeichertes Profil wird zur Runtime-Zeichenfolge `apiKey`                     | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Runtime-Tokenform                                   |
| 25  | `refreshOAuth`                    | Überschreibung für OAuth-Refresh bei benutzerdefinierten Refresh-Endpunkten oder einer Richtlinie bei Refresh-Fehlern | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refresh-Mechanismen                                                                    |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn das OAuth-Refresh fehlschlägt                                       | Der Provider benötigt eigene Hinweise zur Reparatur der Authentifizierung nach einem fehlgeschlagenen Refresh                              |
| 27  | `matchesContextOverflowError`     | plugin-eigener Matcher für Überläufe des Kontextfensters                                                       | Der Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                         |
| 28  | `classifyFailoverReason`          | plugin-eigene Klassifizierung des Failover-Grunds                                                              | Der Provider kann rohe API-/Transportfehler auf Ratenbegrenzung/Überlastung/usw. abbilden                                                  |
| 29  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                           | Der Provider benötigt Proxy-spezifische TTL-Steuerung für den Cache                                                                         |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsmeldung bei fehlender Authentifizierung                            | Der Provider benötigt einen providerspezifischen Hinweis zur Wiederherstellung bei fehlender Authentifizierung                              |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis                      | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Anbieter-Hinweis ersetzen                                           |
| 32  | `augmentModelCatalog`             | synthetische/finale Katalogzeilen nach der Erkennung anhängen                                                  | Der Provider benötigt synthetische Zeilen zur Vorwärtskompatibilität in `models list` und Auswahllisten                                    |
| 33  | `isBinaryThinking`                | Reasoning-Umschalter Ein/Aus für Provider mit binärem Thinking                                                 | Der Provider bietet nur binäres Thinking Ein/Aus an                                                                                         |
| 34  | `supportsXHighThinking`           | Unterstützung von `xhigh`-Reasoning für ausgewählte Modelle                                                    | Der Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                             |
| 35  | `resolveDefaultThinkingLevel`     | Standardwert für `/think` bei einer bestimmten Modellfamilie auflösen                                          | Der Provider besitzt die Standardrichtlinie für `/think` einer Modellfamilie                                                                |
| 36  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                            | Der Provider besitzt die Zuordnung für bevorzugte Modelle bei Live/Smoke                                                                    |
| 37  | `prepareRuntimeAuth`              | konfigurierte Anmeldedaten direkt vor der Inferenz in das tatsächliche Runtime-Token bzw. den Schlüssel umwandeln | Der Provider benötigt einen Token-Austausch oder kurzlebige Anmeldedaten für Anfragen                                                      |
| 38  | `resolveUsageAuth`                | Anmeldedaten für Nutzung/Abrechnung für `/usage` und verwandte Statusoberflächen auflösen                      | Der Provider benötigt benutzerdefiniertes Token-Parsing für Nutzung/Kontingente oder andere Anmeldedaten für die Nutzung                  |
| 39  | `fetchUsageSnapshot`              | providerspezifische Snapshots für Nutzung/Kontingente abrufen und normalisieren, nachdem die Authentifizierung aufgelöst wurde | Der Provider benötigt einen providerspezifischen Endpunkt oder Payload-Parser für Nutzung                                                  |
| 40  | `createEmbeddingProvider`         | einen plugin-eigenen Embedding-Adapter für Speicher/Suche erstellen                                            | Das Verhalten für Speicher-Embeddings gehört zum Provider-Plugin                                                                           |
| 41  | `buildReplayPolicy`               | eine Replay-Richtlinie zurückgeben, die die Behandlung von Transkripten für den Provider steuert              | Der Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (zum Beispiel das Entfernen von Thinking-Blöcken)                     |
| 42  | `sanitizeReplayHistory`           | den Replay-Verlauf nach der generischen Bereinigung von Transkripten umschreiben                               | Der Provider benötigt providerspezifische Umschreibungen des Replay-Verlaufs über gemeinsame Compaction-Hilfsfunktionen hinaus            |
| 43  | `validateReplayTurns`             | endgültige Validierung oder Umformung von Replay-Turns vor dem Embedded Runner                                 | Der Provider-Transport benötigt nach der generischen Bereinigung eine strengere Validierung der Turns                                      |
| 44  | `onModelSelected`                 | plugin-eigene Nebeneffekte nach der Modellauswahl ausführen                                                    | Der Provider benötigt Telemetrie oder plugin-eigenen Zustand, wenn ein Modell aktiv wird                                                   |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
zugeordnete Provider-Plugin und fallen dann auf andere hook-fähige Provider-Plugins
zurück, bis eines tatsächlich die Modell-ID oder den Transport/die Konfiguration ändert.
Dadurch funktionieren Alias-/Kompatibilitäts-Shims für Provider weiter, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Konfigurationseintrag der Google-Familie umschreibt, wendet der gebündelte Google-
Konfigurations-Normalisierer diese Kompatibilitätsbereinigung weiterhin an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten
Request-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese Hooks sind für
Provider-Verhalten gedacht, das weiterhin auf der normalen Inferenzschleife von OpenClaw läuft.

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
  und `wrapStreamFn`, weil es die Vorwärtskompatibilität für Claude 4.6,
  Hinweise zur Provider-Familie, Anleitungen zur Auth-Reparatur, die Integration des Nutzungsendpunkts,
  die Eignung für den Prompt-Cache, auth-bewusste Konfigurationsstandardwerte, die
  Standard-/adaptive Thinking-Richtlinie für Claude und die Anthropic-spezifische Stream-Formung für
  Beta-Header, `/fast` / `serviceTier` und `context1m` besitzt.
- Die Claude-spezifischen Stream-Hilfsfunktionen von Anthropic bleiben vorerst in der eigenen
  öffentlichen Seams `api.ts` / `contract-api.ts` des gebündelten Plugins. Diese Paketoberfläche
  exportiert `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die Low-Level-
  Wrapper-Builder für Anthropic, statt das generische SDK um die Beta-Header-Regeln
  eines einzelnen Providers zu erweitern.
- OpenAI verwendet `resolveDynamicModel`, `normalizeResolvedModel` und
  `capabilities` sowie `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` und `isModernModelRef`,
  weil es die Vorwärtskompatibilität für GPT-5.4, die direkte Normalisierung
  `openai-completions` -> `openai-responses`, Codex-bewusste Auth-Hinweise,
  die Unterdrückung von Spark, synthetische OpenAI-Listenzeilen und die
  Richtlinie für GPT-5-Thinking / Live-Modelle besitzt; die Stream-Familie
  `openai-responses-defaults` besitzt die gemeinsamen nativen OpenAI-Responses-Wrapper für
  Zuordnungs-Header, `/fast`/`serviceTier`, Textausführlichkeit, native Codex-Web-Suche,
  die Formung der Reasoning-Kompatibilitäts-Payload und das Kontextmanagement für Responses.
- OpenRouter verwendet `catalog` sowie `resolveDynamicModel` und
  `prepareDynamicModel`, weil der Provider pass-through ist und neue
  Modell-IDs verfügbar machen kann, bevor der statische Katalog von OpenClaw aktualisiert wird; außerdem verwendet es
  `capabilities`, `wrapStreamFn` und `isCacheTtlEligible`, damit
  providerspezifische Request-Header, Routing-Metadaten, Reasoning-Patches und
  die Prompt-Cache-Richtlinie nicht im Core landen. Seine Replay-Richtlinie stammt aus der
  Familie `passthrough-gemini`, während die Stream-Familie `openrouter-thinking`
  die proxybasierte Reasoning-Injektion sowie das Überspringen nicht unterstützter Modelle und von `auto` besitzt.
- GitHub Copilot verwendet `catalog`, `auth`, `resolveDynamicModel` und
  `capabilities` sowie `prepareRuntimeAuth` und `fetchUsageSnapshot`, weil es
  einen plugin-eigenen Device-Login, Modell-Fallback-Verhalten, Claude-Transkript-
  Eigenheiten, einen Austausch GitHub-Token -> Copilot-Token und einen plugin-eigenen Nutzungsendpunkt benötigt.
- OpenAI Codex verwendet `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` und `augmentModelCatalog` sowie
  `prepareExtraParams`, `resolveUsageAuth` und `fetchUsageSnapshot`, weil es
  weiterhin auf Core-OpenAI-Transporten läuft, aber seine Normalisierung von
  Transport/`baseUrl`, die Fallback-Richtlinie für OAuth-Refresh, die Standardwahl des Transports,
  synthetische Codex-Katalogzeilen und die Integration des ChatGPT-Nutzungsendpunkts besitzt; es
  teilt dieselbe Stream-Familie `openai-responses-defaults` wie direktes OpenAI.
- Google AI Studio und Gemini CLI OAuth verwenden `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` und `isModernModelRef`, weil die
  Replay-Familie `google-gemini` den Vorwärtskompatibilitäts-Fallback für Gemini 3.1,
  die native Gemini-Validierung von Replays, die Bereinigung von Bootstrap-Replays,
  den getaggten Modus für die Reasoning-Ausgabe und das Matching moderner Modelle besitzt, während die
  Stream-Familie `google-thinking` die Normalisierung der Thinking-Payload für Gemini besitzt;
  Gemini CLI OAuth verwendet außerdem `formatApiKey`, `resolveUsageAuth` und
  `fetchUsageSnapshot` für Token-Formatierung, Token-Parsing und die Anbindung des
  Kontingent-Endpunkts.
- Anthropic Vertex verwendet `buildReplayPolicy` über die
  Replay-Familie `anthropic-by-model`, damit die Claude-spezifische Replay-Bereinigung
  auf Claude-IDs begrenzt bleibt und nicht auf jeden Transport `anthropic-messages`.
- Amazon Bedrock verwendet `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` und `resolveDefaultThinkingLevel`, weil es die
  Bedrock-spezifische Klassifizierung von Drosselungs-, Not-ready- und Kontextüberlauf-Fehlern
  für Anthropic-on-Bedrock-Datenverkehr besitzt; seine Replay-Richtlinie teilt weiterhin dieselbe
  nur auf Claude bezogene Sicherung `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode und Opencode Go verwenden `buildReplayPolicy`
  über die Replay-Familie `passthrough-gemini`, weil sie Gemini-
  Modelle über OpenAI-kompatible Transporte proxyen und die Bereinigung von Gemini-
  Thought-Signaturen ohne native Gemini-Validierung von Replays oder Bootstrap-Umschreibungen benötigen.
- MiniMax verwendet `buildReplayPolicy` über die
  Replay-Familie `hybrid-anthropic-openai`, weil ein Provider sowohl
  Semantik für Anthropic-Nachrichten als auch für OpenAI-Kompatibilität besitzt; es hält
  das Entfernen von Thinking-Blöcken nur für Claude auf der Anthropic-Seite aufrecht, während es den
  Modus für die Reasoning-Ausgabe wieder auf nativ zurücksetzt, und die Stream-Familie `minimax-fast-mode`
  besitzt Umschreibungen von Fast-Mode-Modellen auf dem gemeinsamen Stream-Pfad.
- Moonshot verwendet `catalog` sowie `wrapStreamFn`, weil es weiterhin den gemeinsamen
  OpenAI-Transport verwendet, aber plugin-eigene Normalisierung der Thinking-Payload benötigt; die
  Stream-Familie `moonshot-thinking` bildet Konfiguration plus `/think`-Status auf ihre
  native binäre Thinking-Payload ab.
- Kilocode verwendet `catalog`, `capabilities`, `wrapStreamFn` und
  `isCacheTtlEligible`, weil es plugin-eigene Request-Header,
  Normalisierung der Reasoning-Payload, Hinweise zu Gemini-Transkripten und Anthropic-
  Cache-TTL-Steuerung benötigt; die Stream-Familie `kilocode-thinking` hält die Injektion von Kilo-
  Thinking auf dem gemeinsamen Proxy-Stream-Pfad, während `kilo/auto` und
  andere Proxy-Modell-IDs übersprungen werden, die keine expliziten Reasoning-Payloads unterstützen.
- Z.AI verwendet `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` und `fetchUsageSnapshot`, weil es den GLM-5-Fallback,
  Standardwerte für `tool_stream`, die UX für binäres Thinking, das Matching moderner Modelle
  sowie sowohl die Nutzungs-Authentifizierung als auch das Abrufen von Kontingenten besitzt; die Stream-Familie
  `tool-stream-default-on` hält den standardmäßig aktivierten Wrapper `tool_stream` aus
  handgeschriebenem Glue-Code pro Provider heraus.
- xAI verwendet `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` und `isModernModelRef`,
  weil es die native xAI-Responses-Transportnormalisierung, Alias-Umschreibungen für den Grok-
  Fast-Mode, den Standardwert `tool_stream`, die Bereinigung strikter Tools / Reasoning-Payloads,
  die Wiederverwendung von Fallback-Authentifizierung für plugin-eigene Tools, die Vorwärtskompatibilitäts-
  Auflösung von Grok-Modellen und plugin-eigene Kompatibilitäts-Patches wie das xAI-Tool-Schema-
  Profil, nicht unterstützte Schema-Schlüsselwörter, natives `web_search` und die Dekodierung von HTML-Entitäten
  in Tool-Call-Argumenten besitzt.
- Mistral, OpenCode Zen und OpenCode Go verwenden nur `capabilities`, um
  Eigenheiten bei Transkripten/Tooling aus dem Core herauszuhalten.
- Gebündelte Provider, die nur einen Katalog haben, wie `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` und `volcengine`, verwenden
  nur `catalog`.
- Qwen verwendet `catalog` für seinen Text-Provider sowie gemeinsame Registrierungen für Medienverständnis und
  Videogenerierung für seine multimodalen Oberflächen.
- MiniMax und Xiaomi verwenden `catalog` sowie Nutzungs-Hooks, weil ihr `/usage`-
  Verhalten plugin-eigen ist, obwohl die Inferenz weiterhin über die gemeinsamen Transporte läuft.

## Runtime-Hilfsfunktionen

Plugins können über `api.runtime` auf ausgewählte Core-Hilfsfunktionen zugreifen. Für TTS:

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
- Gibt PCM-Audiopuffer + Abtastrate zurück. Plugins müssen für Provider neu sampeln/kodieren.
- `listVoices` ist pro Provider optional. Verwenden Sie es für provider-eigene Voice-Picker oder Setup-Flows.
- Voice-Listen können umfangreichere Metadaten wie Gebietsschema, Geschlecht und Persönlichkeits-Tags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telephony. Microsoft nicht.

Plugins können auch Sprach-Provider über `api.registerSpeechProvider(...)` registrieren.

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

- Behalten Sie TTS-Richtlinie, Fallback und Antwortzustellung im Core.
- Verwenden Sie Sprach-Provider für plugin-eigenes Syntheseverhalten.
- Die alte Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Eigentumsmodell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text-, Sprach-, Bild- und zukünftige Medien-Provider besitzen, wenn OpenClaw diese
  Fähigkeitsverträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Provider für Medienverständnis statt einer generischen Schlüssel-/Werttasche:

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

- Behalten Sie Orchestrierung, Fallback, Konfiguration und die Verdrahtung der Channels im Core.
- Behalten Sie anbieterspezifisches Verhalten im Provider-Plugin.
- Additive Erweiterungen sollten typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Die Videogenerierung folgt bereits demselben Muster:
  - der Core besitzt den Fähigkeitsvertrag und den Runtime-Helfer
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins verwenden `api.runtime.videoGeneration.*`

Für Runtime-Hilfsfunktionen des Medienverständnisses können Plugins Folgendes aufrufen:

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

Für die Audio-Transkription können Plugins entweder die Runtime des Medienverständnisses
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
- Verwendet die Core-Konfiguration für Audio im Medienverständnis (`tools.media.audio`) und die Fallback-Reihenfolge der Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können auch Hintergrundausführungen von Sub-Agenten über `api.runtime.subagent` starten:

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

- `provider` und `model` sind optionale Überschreibungen pro Ausführung, keine dauerhaften Sitzungsänderungen.
- OpenClaw berücksichtigt diese Überschreibungsfelder nur bei vertrauenswürdigen Aufrufern.
- Für plugin-eigene Fallback-Ausführungen müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel explizit zuzulassen.
- Sub-Agent-Ausführungen nicht vertrauenswürdiger Plugins funktionieren weiterhin, aber Überschreibungsanfragen werden abgelehnt, statt stillschweigend auf Fallback zurückzufallen.

Für die Web-Suche können Plugins den gemeinsamen Runtime-Helfer verwenden, statt
in die Verdrahtung des Agent-Tools einzugreifen:

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

Plugins können Web-Such-Provider auch über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalten Sie Provider-Auswahl, Auflösung von Anmeldedaten und gemeinsame Anfragesemantik im Core.
- Verwenden Sie Web-Such-Provider für anbieterspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne von dem Wrapper des Agent-Tools abhängig zu sein.

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

- `generate(...)`: ein Bild mit der konfigurierten Provider-Kette für die Bildgenerierung erzeugen.
- `listProviders(...)`: verfügbare Provider für die Bildgenerierung und ihre Fähigkeiten auflisten.

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

Felder der Route:

- `path`: Routenpfad unter dem Gateway-HTTP-Server.
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für pluginverwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: `true` zurückgeben, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann keine Route eines anderen Plugins ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie `exact`-/`prefix`-Fallthrough-Ketten nur auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten nicht automatisch Runtime-Scopes des Operators. Sie sind für pluginverwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Gateway-Hilfsaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Runtime-Scopes für Gateway-Anfragen, aber dieser Scope ist absichtlich konservativ:
  - Bearer-Authentifizierung mit gemeinsamem Geheimnis (`gateway.auth.mode = "token"` / `"password"`) hält die Runtime-Scopes von Plugin-Routen auf `operator.write` fest, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` bei privatem Ingress) berücksichtigen `x-openclaw-scopes` nur dann, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen Plugin-Routen-Anfragen mit Identität fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine pluginbasierte Route mit Gateway-Authentifizierung implizit eine Admin-Oberfläche ist. Wenn Ihre Route rein administratives Verhalten benötigt, verlangen Sie einen Auth-Modus mit Identität und dokumentieren Sie den expliziten Vertrag für den Header `x-openclaw-scopes`.

## Importpfade des Plugin SDK

Verwenden Sie beim Schreiben von Plugins SDK-Subpfade statt des monolithischen Imports `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` für Primitive zur Plugin-Registrierung.
- `openclaw/plugin-sdk/core` für den generischen gemeinsamen Plugin-Vertrag.
- `openclaw/plugin-sdk/config-schema` für den Export des Zod-Schemas des Root-`openclaw.json`
  (`OpenClawSchema`).
- Stabile Channel-Primitive wie `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress` für gemeinsame Verdrahtung von Setup/Authentifizierung/Antwort/Webhook.
  `channel-inbound` ist die gemeinsame Heimat für Debounce, Mention-Matching,
  Hilfsfunktionen für Mention-Richtlinien bei eingehenden Nachrichten, Envelope-Formatierung und
  Kontext-Hilfsfunktionen für eingehende Envelopes.
  `channel-setup` ist die schmale Setup-Seam für optionale Installationen.
  `setup-runtime` ist die runtime-sichere Setup-Oberfläche, die von `setupEntry` /
  verzögertem Start verwendet wird, einschließlich import-sicherer Adapter für Setup-Patches.
  `setup-adapter-runtime` ist die umgebungsbewusste Seam für Account-Setup-Adapter.
  `setup-tools` ist die kleine Seam für CLI-/Archiv-/Dokumentationshilfen (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Domain-Subpfade wie `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` für gemeinsame Runtime-/Konfigurationshilfen.
  `telegram-command-config` ist die schmale öffentliche Seam für die Normalisierung/Validierung benutzerdefinierter
  Telegram-Befehle und bleibt verfügbar, auch wenn die gebündelte
  Telegram-Vertragsoberfläche vorübergehend nicht verfügbar ist.
  `text-runtime` ist die gemeinsame Seam für Text/Markdown/Logging, einschließlich
  des Entfernens für Assistenten sichtbaren Texts, Hilfsfunktionen zum Rendern/Chunking von Markdown, Hilfsfunktionen
  zur Schwärzung, Hilfsfunktionen für Directive-Tags und Safe-Text-Utilities.
- Approval-spezifische Channel-Seams sollten einen einzelnen Vertrag `approvalCapability`
  auf dem Plugin bevorzugen. Der Core liest dann Authentifizierung, Zustellung, Rendering,
  natives Routing und verzögertes natives Handler-Verhalten für Approval über diese eine Fähigkeit
  statt Approval-Verhalten in nicht zusammenhängende Plugin-Felder zu mischen.
- `openclaw/plugin-sdk/channel-runtime` ist veraltet und bleibt nur als
  Kompatibilitäts-Shim für ältere Plugins erhalten. Neuer Code sollte stattdessen die schmaleren
  generischen Primitive importieren, und Repo-Code sollte keine neuen Importe des
  Shims hinzufügen.
- Interne Bestandteile gebündelter Extensions bleiben privat. Externe Plugins sollten nur
  `openclaw/plugin-sdk/*`-Subpfade verwenden. OpenClaw-Core-/Test-Code darf die öffentlichen
  Repo-Einstiegspunkte unter einem Plugin-Paket-Root verwenden, etwa `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` und eng begrenzte Dateien wie
  `login-qr-api.js`. Importieren Sie niemals das `src/*` eines Plugin-Pakets aus dem Core oder aus
  einer anderen Extension.
- Aufteilung der Repo-Einstiegspunkte:
  `<plugin-package-root>/api.js` ist das Barrel für Hilfsfunktionen/Typen,
  `<plugin-package-root>/runtime-api.js` ist das rein runtimebezogene Barrel,
  `<plugin-package-root>/index.js` ist der Einstiegspunkt des gebündelten Plugins,
  und `<plugin-package-root>/setup-entry.js` ist der Einstiegspunkt des Setup-Plugins.
- Aktuelle Beispiele für gebündelte Provider:
  - Anthropic verwendet `api.js` / `contract-api.js` für Claude-Stream-Hilfsfunktionen wie
    `wrapAnthropicProviderStream`, Hilfsfunktionen für Beta-Header und das Parsen von `service_tier`.
  - OpenAI verwendet `api.js` für Provider-Builder, Hilfsfunktionen für Standardmodelle und
    Builder für Realtime-Provider.
  - OpenRouter verwendet `api.js` für seinen Provider-Builder sowie Hilfsfunktionen für Onboarding/Konfiguration,
    während `register.runtime.js` weiterhin generische
    `plugin-sdk/provider-stream`-Hilfsfunktionen für die repo-lokale Nutzung re-exportieren kann.
- Über Fassaden geladene öffentliche Einstiegspunkte bevorzugen den aktiven Runtime-Konfigurations-Snapshot,
  wenn einer vorhanden ist, und fallen sonst auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück, wenn
  OpenClaw noch keinen Runtime-Snapshot bereitstellt.
- Generische gemeinsame Primitive bleiben der bevorzugte öffentliche SDK-Vertrag. Ein kleiner
  reservierter Kompatibilitätssatz gebündelter, channelmarkierter Hilfs-Seams existiert weiterhin.
  Behandeln Sie diese als Seams für Pflege/Kompatibilität gebündelter Plugins, nicht als neue Importziele für Drittanbieter; neue kanalübergreifende Verträge sollten weiterhin auf
  generischen `plugin-sdk/*`-Subpfaden oder den plugin-lokalen Barrels `api.js` /
  `runtime-api.js` landen.

Kompatibilitätshinweis:

- Vermeiden Sie für neuen Code das Root-Barrel `openclaw/plugin-sdk`.
- Bevorzugen Sie zuerst die schmalen stabilen Primitive. Die neueren Subpfade für setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sind der beabsichtigte Vertrag für neue
  gebündelte und externe Plugin-Arbeit.
  Parsing/Matching von Zielen gehört auf `openclaw/plugin-sdk/channel-targets`.
  Gates für Message-Aktionen und Hilfsfunktionen für Message-IDs bei Reaktionen gehören auf
  `openclaw/plugin-sdk/channel-actions`.
- Hilfs-Barrels für spezifische gebündelte Extensions sind standardmäßig nicht stabil. Wenn eine
  Hilfsfunktion nur von einer gebündelten Extension benötigt wird, behalten Sie sie hinter der
  lokalen Seam `api.js` oder `runtime-api.js` der Extension, statt sie in
  `openclaw/plugin-sdk/<extension>` zu befördern.
- Neue gemeinsame Hilfs-Seams sollten generisch sein, nicht channelmarkiert. Gemeinsames
  Parsing von Zielen gehört auf `openclaw/plugin-sdk/channel-targets`; channelspezifische
  Interna bleiben hinter der lokalen Seam `api.js` oder `runtime-api.js` des besitzenden Plugins.
- Fähigkeitsspezifische Subpfade wie `image-generation`,
  `media-understanding` und `speech` existieren, weil gebündelte/native Plugins sie heute
  verwenden. Ihre Existenz bedeutet nicht automatisch, dass jede exportierte Hilfsfunktion ein langfristig eingefrorener externer Vertrag ist.

## Schemas für Message-Tools

Plugins sollten channelspezifische Schema-Beiträge für `describeMessageTool(...)`
besitzen. Behalten Sie providerspezifische Felder im Plugin, nicht im gemeinsamen Core.

Für gemeinsam portable Schema-Fragmente sollten Sie die generischen Hilfsfunktionen wiederverwenden, die über
`openclaw/plugin-sdk/channel-actions` exportiert werden:

- `createMessageToolButtonsSchema()` für Payloads im Stil eines Button-Rasters
- `createMessageToolCardSchema()` für strukturierte Card-Payloads

Wenn eine Schemaform nur für einen Provider sinnvoll ist, definieren Sie sie im
eigenen Quellcode dieses Plugins, statt sie in das gemeinsame SDK zu befördern.

## Auflösung von Channel-Zielen

Channel-Plugins sollten channelspezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor dem Directory-Lookup als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt zur id-artigen Auflösung springen soll statt zur Directory-Suche.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn der
  Core nach der Normalisierung oder nach einem Directory-Fehlschlag eine endgültige provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die Konstruktion der providerspezifischen Sitzungsroute,
  sobald ein Ziel aufgelöst wurde.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche nach Peers/Gruppen getroffen werden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen wie „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für providerspezifische Normalisierungs-Fallbacks, nicht für
  eine breite Directory-Suche.
- Behalten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Room-IDs
  in `target`-Werten oder providerspezifischen Parametern, nicht in generischen SDK-Feldern.

## Konfigurationsgestützte Directories

Plugins, die Directory-Einträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin behalten und die gemeinsamen Hilfsfunktionen aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- von Allowlists gesteuerte DM-Peers
- konfigurierte Channel-/Gruppen-Zuordnungen
- kontoabhängige statische Directory-Fallbacks

Die gemeinsamen Hilfsfunktionen in `directory-runtime` behandeln nur generische Operationen:

- Filterung von Suchanfragen
- Anwendung von Limits
- Hilfsfunktionen für Deduplizierung/Normalisierung
- Aufbau von `ChannelDirectoryEntry[]`

Channelspezifische Kontoinspektion und Normalisierung von IDs sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für die Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen einzelnen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin providerspezifische Modell-IDs, Standardwerte für `baseUrl`
oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache Provider, die auf API-Schlüssel oder Umgebungsvariablen basieren
- `profile`: Provider, die erscheinen, wenn Auth-Profile vorhanden sind
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins absichtlich einen
integrierten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als alter Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Channel-Inspektion

Wenn Ihr Plugin einen Channel registriert, bevorzugen Sie die Implementierung von
`plugin.config.inspectAccount(cfg, accountId)` zusammen mit `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Runtime-Pfad. Er darf davon ausgehen, dass Anmeldedaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` und Flows für Doctor-/Konfigurations-
  Reparaturen sollten keine Runtime-Anmeldedaten materialisieren müssen, nur um die Konfiguration zu beschreiben.

Empfohlenes Verhalten für `inspectAccount(...)`:

- Nur den beschreibenden Kontostatus zurückgeben.
- `enabled` und `configured` beibehalten.
- Wenn relevant, Felder für Quelle/Status von Anmeldedaten einschließen, zum Beispiel:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um die schreibgeschützte
  Verfügbarkeit zu melden. Es genügt, `tokenStatus: "available"` (und das passende Quellfeld) für statusartige Befehle zurückzugeben.
- Verwenden Sie `configured_unavailable`, wenn Anmeldedaten über SecretRef konfiguriert sind, aber
  im aktuellen Befehlspfad nicht verfügbar sind.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert zu melden.

## Paket-Packs

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

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Extensions auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach der Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die das Paketverzeichnis verlassen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Entwicklungsabhängigkeiten zur Laufzeit). Halten Sie Abhängigkeitsbäume von Plugins bei „reinem JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges Modul nur für das Setup zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
statt des vollständigen Plugin-Einstiegspunkts. Dadurch bleiben Start und Setup leichter,
wenn Ihr Haupteinstiegspunkt des Plugins auch Tools, Hooks oder anderen nur runtimebezogenen
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin für denselben `setupEntry`-Pfad während der
Pre-Listen-Startphase des Gateways aktivieren, selbst wenn der Channel bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die
vor dem Start des Gateways vorhanden sein muss. In der Praxis bedeutet das, dass der Setup-Einstiegspunkt
jede channel-eigene Fähigkeit registrieren muss, von der der Start abhängt, etwa:

- die Channel-Registrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway mit dem Lauschen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die in diesem selben Zeitfenster vorhanden sein müssen

Wenn Ihr vollständiger Einstiegspunkt weiterhin eine erforderliche Startfähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie das Standardverhalten des Plugins bei und lassen Sie OpenClaw den
vollständigen Einstiegspunkt beim Start laden.

Gebündelte Channels können auch Hilfsfunktionen für nur das Setup betreffende Vertragsoberflächen veröffentlichen, die der Core
abfragen kann, bevor die vollständige Channel-Runtime geladen wird. Die aktuelle Oberfläche
für Setup-Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine alte Single-Account-Channel-
Konfiguration in `channels.<id>.accounts.*` überführen muss, ohne den vollständigen Plugin-Einstiegspunkt zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes überführtes Konto, wenn bereits benannte Konten existieren, und es kann einen
konfigurierten nicht-kanonischen Standard-Kontoschlüssel beibehalten, statt immer
`accounts.default` zu erstellen.

Diese Adapter für Setup-Patches halten die Erkennung gebündelter Vertragsoberflächen lazy. Die Importzeit bleibt leicht; die Oberfläche für Promotion wird erst bei der ersten Verwendung geladen, statt beim Modulimport erneut in den Start eines gebündelten Channels einzutreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, behalten Sie sie auf einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, auch wenn ein Plugin einen engeren Scope anfordert.

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

### Kanal-Katalogmetadaten

Channel-Plugins können Setup-/Erkennungsmetadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bekanntgeben. So bleiben die Katalogdaten im Core datenfrei.

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

Nützliche Felder in `openclaw.channel` über das minimale Beispiel hinaus:

- `detailLabel`: sekundäre Bezeichnung für umfangreichere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Dokumentationslink überschreiben
- `preferOver`: Plugin-/Channel-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerung der Texte für Auswahloberflächen
- `markdownCapable`: markiert den Channel als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Channel aus Oberflächen zur Auflistung konfigurierter Channels aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Channel aus interaktiven Setup-/Konfigurationsauswahlen aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Channel als intern/privat für Oberflächen der Dokumentationsnavigation
- `showConfigured` / `showInSetup`: alte Aliasse werden aus Kompatibilitätsgründen weiterhin akzeptiert; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: bindet den Channel in den standardmäßigen Quickstart-Flow `allowFrom` ein
- `forceAccountBinding`: verlangt eine explizite Kontobindung, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt Session-Lookup beim Auflösen von Ankündigungszielen

OpenClaw kann auch **externe Kanal-Kataloge** zusammenführen (zum Beispiel einen Export einer MPM-
Registry). Legen Sie dazu eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder zeigen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als alte Aliasse für den Schlüssel `"entries"`.

## Plugins für die Context Engine

Plugins für die Context Engine besitzen die Orchestrierung des Sitzungskontexts für Ingest, Zusammenstellung
und Compaction. Registrieren Sie sie in Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine` aus.

Verwenden Sie dies, wenn Ihr Plugin die Standard-
Kontext-Pipeline ersetzen oder erweitern muss, statt nur Speichersuche oder Hooks hinzuzufügen.

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

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, behalten Sie `compact()`
implementiert und delegieren Sie ihn explizit:

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

## Eine neue Fähigkeit hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehen Sie das
Plugin-System nicht mit einem privaten direkten Zugriff. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Core besitzen sollte: Richtlinie, Fallback, Zusammenführung der Konfiguration,
   Lebenszyklus, channelseitige Semantik und die Form des Runtime-Helfers.
2. typisierte Oberflächen für Plugin-Registrierung/Runtime hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Core- + Channel-/Feature-Consumer anbinden
   Channels und Feature-Plugins sollten die neue Fähigkeit über den Core verwenden,
   nicht durch direkten Import einer Anbieter-Implementierung.
4. Anbieter-Implementierungen registrieren
   Anbieter-Plugins registrieren dann ihre Backends gegen die Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Eigentümerschaft und Form der Registrierung über die Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne auf das Weltbild eines einzelnen
Providers fest verdrahtet zu werden. Eine konkrete Checkliste für Dateien und ein ausgearbeitetes Beispiel finden Sie im [Capability Cookbook](/de/plugins/architecture).

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung diese
Oberflächen in der Regel gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Runtime-Helfer in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Plugin-Runtime-Exposition in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie verwenden müssen
- Capture-/Test-Hilfsfunktionen in `src/test-utils/plugin-registration.ts`
- Assertions für Eigentümerschaft/Verträge in `src/plugins/contracts/registry.ts`
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

So bleibt die Regel einfach:

- der Core besitzt den Fähigkeitsvertrag + die Orchestrierung
- Anbieter-Plugins besitzen Anbieter-Implementierungen
- Feature-/Channel-Plugins verwenden Runtime-Hilfsfunktionen
- Vertragstests halten die Eigentümerschaft explizit
