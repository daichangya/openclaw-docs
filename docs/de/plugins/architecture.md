---
read_when:
    - Native OpenClaw-Plugins entwickeln oder debuggen
    - Das Plugin-Fähigkeitsmodell oder Ownership-Grenzen verstehen
    - An der Plugin-Ladepipeline oder Registry arbeiten
    - Provider-Runtime-Hooks oder Kanal-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Ownership, Verträge, Ladepipeline und Runtime-Helper'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-23T14:03:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin-Interna

<Info>
  Dies ist die **umfassende Architektur-Referenz**. Praktische Anleitungen finden Sie unter:
  - [Plugins installieren und verwenden](/de/tools/plugin) — Benutzerhandbuch
  - [Erste Schritte](/de/plugins/building-plugins) — erstes Plugin-Tutorial
  - [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — einen Messaging-Kanal erstellen
  - [Provider-Plugins](/de/plugins/sdk-provider-plugins) — einen Modell-Provider erstellen
  - [SDK-Überblick](/de/plugins/sdk-overview) — Import-Map und Registrierungs-API
</Info>

Diese Seite behandelt die interne Architektur des OpenClaw-Plugin-Systems.

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit              | Registrierungsmethode                           | Beispiel-Plugins                    |
| ---------------------- | ------------------------------------------------ | ----------------------------------- |
| Textinferenz           | `api.registerProvider(...)`                      | `openai`, `anthropic`               |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`               |
| Sprache                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Echtzeit-Sprache       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                            |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                  |
| Bilderzeugung          | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Musikerzeugung         | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                 |
| Videoerzeugung         | `api.registerVideoGenerationProvider(...)`       | `qwen`                              |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Websuche               | `api.registerWebSearchProvider(...)`             | `google`                            |
| Kanal / Messaging      | `api.registerChannel(...)`                       | `msteams`, `matrix`                 |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools oder
Dienste bereitstellt, ist ein **Legacy-Hook-only**-Plugin. Dieses Muster wird weiterhin vollständig unterstützt.

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Kern gelandet und wird heute von gebündelten/nativen Plugins
verwendet, aber externe Plugin-Kompatibilität braucht weiterhin eine strengere Messlatte als „es ist
exportiert, also ist es eingefroren“.

Aktuelle Leitlinien:

- **bestehende externe Plugins:** Hook-basierte Integrationen weiter funktionsfähig halten; dies
  als Kompatibilitäts-Baseline behandeln
- **neue gebündelte/native Plugins:** explizite Fähigkeitsregistrierung gegenüber
  anbieterbezogenen Reach-ins oder neuen Hook-only-Designs bevorzugen
- **externe Plugins, die Fähigkeitsregistrierung übernehmen:** erlaubt, aber
  fähigkeitsspezifische Helper-Oberflächen als weiterentwickelnd behandeln, sofern die Doku einen
  Vertrag nicht ausdrücklich als stabil kennzeichnet

Praktische Regel:

- Fähigkeitsregistrierungs-APIs sind die beabsichtigte Richtung
- Legacy-Hooks bleiben während des Übergangs der sicherste Weg ohne Brüche für externe Plugins
- exportierte Helper-Subpaths sind nicht alle gleich; bevorzugen Sie den schmalen dokumentierten
  Vertrag, nicht zufällige Helper-Exporte

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability** -- registriert genau einen Fähigkeitstyp (zum Beispiel ein
  reines Provider-Plugin wie `mistral`)
- **hybrid-capability** -- registriert mehrere Fähigkeitstypen (zum Beispiel
  besitzt `openai` Textinferenz, Sprache, Medienverständnis und
  Bilderzeugung)
- **hook-only** -- registriert nur Hooks (typisiert oder benutzerdefiniert), keine
  Fähigkeiten, Tools, Befehle oder Dienste
- **non-capability** -- registriert Tools, Befehle, Dienste oder Routen, aber keine
  Fähigkeiten

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und die Aufschlüsselung der
Fähigkeiten eines Plugins anzuzeigen. Siehe [CLI-Referenz](/de/cli/plugins#inspect) für Details.

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für
Hook-only-Plugins unterstützt. Legacy-Plugins in der Praxis hängen weiterhin davon ab.

Richtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeiten an Modell-/Provider-Overrides bevorzugen
- `before_prompt_build` für Arbeiten an Prompt-Mutationen bevorzugen
- erst entfernen, wenn die reale Nutzung zurückgeht und die Fixture-Coverage die Migrationssicherheit beweist

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eines dieser Labels:

| Signal                     | Bedeutung                                                      |
| -------------------------- | -------------------------------------------------------------- |
| **config valid**           | Konfiguration wird sauber geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Das Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Das Plugin verwendet `before_agent_start`, das veraltet ist    |
| **hard error**             | Die Konfiguration ist ungültig oder das Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` werden Ihr Plugin heute kaputtmachen --
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Schichten:

1. **Manifest + Discovery**
   OpenClaw findet potenzielle Plugins in konfigurierten Pfaden, Workspace-Roots,
   globalen Plugin-Roots und gebündelten Plugins. Die Discovery liest zuerst native
   `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Kern entscheidet, ob ein entdecktes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Memory ausgewählt ist.
3. **Runtime-Laden**
   Native OpenClaw-Plugins werden In-Process über jiti geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Einträge normalisiert, ohne Runtime-Code zu importieren.
4. **Nutzung von Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-
   Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.

Speziell für die Plugin-CLI ist die Discovery von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Time-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich erst beim ersten Aufruf registrieren

Dadurch bleibt der Plugin-eigene CLI-Code im Plugin, während OpenClaw trotzdem
Root-Befehlsnamen vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Discovery + Konfigurationsvalidierung sollten aus **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- natives Runtime-Verhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Trennung erlaubt es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu
erklären und UI-/Schema-Hinweise zu bauen, bevor die vollständige Runtime aktiv ist.

### Kanal-Plugins und das gemeinsame Message-Tool

Kanal-Plugins müssen für normale Chat-Aktionen kein separates Send/Edit/React-Tool registrieren.
OpenClaw hält ein gemeinsames `message`-Tool im Kern, und Kanal-Plugins besitzen die
kanalspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Kern besitzt den gemeinsamen `message`-Tool-Host, Prompt-Wiring, Sitzungs-/Thread-
  Bookkeeping und Ausführungs-Dispatch
- Kanal-Plugins besitzen Discovery für abgegrenzte Aktionen, Discovery für Fähigkeiten und
  kanalspezifische Schemafragmente
- Kanal-Plugins besitzen provider-spezifische Grammatik für Sitzungs-Konversationen, etwa
  wie Konversations-IDs Thread-IDs kodieren oder von übergeordneten Konversationen erben
- Kanal-Plugins führen die endgültige Aktion über ihren Aktions-Adapter aus

Für Kanal-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser vereinheitlichte Discovery-
Aufruf erlaubt es einem Plugin, seine sichtbaren Aktionen, Fähigkeiten und
Schema-Beiträge zusammen zurückzugeben, damit diese Teile nicht auseinanderdriften.

Wenn ein kanalspezifischer Message-Tool-Parameter eine Medienquelle trägt, etwa einen
lokalen Pfad oder eine Remote-Medien-URL, sollte das Plugin außerdem
`mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Kern verwendet diese explizite
Liste, um Sandbox-Pfadnormalisierung und Hinweise zum Zugriff auf ausgehende Medien anzuwenden,
ohne Plugin-eigene Parameternamen hart zu kodieren.
Bevorzugen Sie dort aktionsbezogene Maps, nicht eine flache Liste für den ganzen Kanal, sodass ein
nur profilbezogener Medienparameter nicht bei nicht verwandten Aktionen wie
`send` normalisiert wird.

Der Kern übergibt Runtime-Scope in diesen Discovery-Schritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdiges eingehendes `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Kanal kann Message-Aktionen je nach
aktivem Konto, aktuellem Raum/Thread/Nachricht oder vertrauenswürdiger Identität des Anfragenden
ausblenden oder einblenden, ohne kanalspezifische Verzweigungen im gemeinsamen Kern-`message`-Tool hart zu kodieren.

Darum bleiben Änderungen am Embedded-Runner-Routing weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität in die Plugin-Discovery-Grenze
weiterzuleiten, damit das gemeinsame `message`-Tool für den aktuellen Turn die richtige Plugin-eigene
Oberfläche bereitstellt.

Für Plugin-eigene Ausführungs-Helper sollten gebündelte Plugins die Ausführungs-
Runtime in ihren eigenen Extension-Modulen halten. Der Kern besitzt nicht mehr die Discord-,
Slack-, Telegram- oder WhatsApp-Nachrichtenaktions-Runtimes unter `src/agents/tools`.
Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Subpaths, und gebündelte
Plugins sollten ihren eigenen lokalen Runtime-Code direkt aus ihren
Extension-eigenen Modulen importieren.

Dieselbe Grenze gilt generell für providerbenannte SDK-Seams: Der Kern sollte keine
kanalspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Extensions importieren. Wenn der Kern ein Verhalten benötigt, sollte er
entweder das eigene `api.ts`- / `runtime-api.ts`-Barrel des gebündelten Plugins konsumieren oder den Bedarf
in eine schmale generische Fähigkeit im gemeinsamen SDK überführen.

Speziell für Polls gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Baseline für Kanäle, die in das gemeinsame
  Poll-Modell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische
  Poll-Semantik oder zusätzliche Poll-Parameter

Der Kern verschiebt jetzt das gemeinsame Poll-Parsing, bis der Plugin-Poll-Dispatch die
Aktion ablehnt, sodass Plugin-eigene Poll-Handler kanalspezifische Poll-Felder akzeptieren
können, ohne zuerst vom generischen Poll-Parser blockiert zu werden.

Siehe [Ladepipeline](#load-pipeline) für die vollständige Startsequenz.

## Ownership-Modell für Fähigkeiten

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte in der Regel alle OpenClaw-bezogenen Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte in der Regel die vollständige Feature-Oberfläche besitzen, die es einführt
- Kanäle sollten gemeinsame Kernfähigkeiten konsumieren, statt Provider-Verhalten ad hoc neu zu implementieren

Beispiele:

- das gebündelte Plugin `openai` besitzt OpenAI-Modellprovider-Verhalten sowie OpenAI-
  Verhalten für Sprache + Echtzeit-Sprache + Medienverständnis + Bilderzeugung
- das gebündelte Plugin `elevenlabs` besitzt ElevenLabs-Sprachverhalten
- das gebündelte Plugin `microsoft` besitzt Microsoft-Sprachverhalten
- das gebündelte Plugin `google` besitzt Google-Modellprovider-Verhalten plus Google-
  Verhalten für Medienverständnis + Bilderzeugung + Websuche
- das gebündelte Plugin `firecrawl` besitzt Firecrawl-Web-Abruf-Verhalten
- die gebündelten Plugins `minimax`, `mistral`, `moonshot` und `zai` besitzen ihre
  Backends für Medienverständnis
- das gebündelte Plugin `qwen` besitzt Qwen-Textprovider-Verhalten plus
  Medienverständnis- und Videoerzeugungsverhalten
- das Plugin `voice-call` ist ein Feature-Plugin: Es besitzt Anruftransport, Tools,
  CLI, Routen und Twilio-Media-Stream-Bridge, konsumiert aber gemeinsame Fähigkeiten für Sprache
  sowie Echtzeit-Transkription und Echtzeit-Sprache, statt Anbieter-Plugins direkt zu
  importieren

Der angestrebte Endzustand ist:

- OpenAI lebt in einem Plugin, auch wenn es Textmodelle, Sprache, Bilder und
  künftiges Video umfasst
- ein anderer Anbieter kann dasselbe für seine eigene Oberfläche tun
- Kanäle kümmern sich nicht darum, welches Anbieter-Plugin den Provider besitzt; sie konsumieren den
  gemeinsamen Fähigkeitsvertrag, den der Kern bereitstellt

Das ist der entscheidende Unterschied:

- **Plugin** = Ownership-Grenze
- **Fähigkeit** = Kernvertrag, den mehrere Plugins implementieren oder konsumieren können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, ist die erste Frage nicht
„welcher Provider soll Videoverarbeitung hart kodieren?“ Die erste Frage ist „was ist
der Kernvertrag für die Video-Fähigkeit?“ Sobald dieser Vertrag existiert, können
Anbieter-Plugins sich dagegen registrieren und Kanal-/Feature-Plugins ihn konsumieren.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt in der Regel:

1. die fehlende Fähigkeit im Kern definieren
2. sie typisiert über die Plugin-API/Runtime bereitstellen
3. Kanäle/Features gegen diese Fähigkeit verdrahten
4. Anbieter-Plugins Implementierungen registrieren lassen

Dadurch bleibt Ownership explizit, während Kernverhalten vermieden wird, das von einem
einzigen Anbieter oder einem einmaligen Plugin-spezifischen Codepfad abhängt.

### Schichtung von Fähigkeiten

Verwenden Sie dieses mentale Modell, um zu entscheiden, wo Code hingehört:

- **Kern-Fähigkeitsschicht**: gemeinsame Orchestrierung, Richtlinie, Fallback, Regeln zum
  Zusammenführen von Konfigurationen, Zustellungssemantik und typisierte Verträge
- **Anbieter-Plugin-Schicht**: anbieterbezogene APIs, Auth, Modellkataloge, Sprach-
  Synthese, Bilderzeugung, künftige Video-Backends, Usage-Endpunkte
- **Kanal-/Feature-Plugin-Schicht**: Integration von Slack/Discord/voice-call/usw.,
  die Kernfähigkeiten konsumiert und auf einer Oberfläche bereitstellt

Zum Beispiel folgt TTS dieser Form:

- der Kern besitzt Richtlinie, Fallback-Reihenfolge, Präferenzen und Kanalauslieferung für TTS zur Antwortzeit
- `openai`, `elevenlabs` und `microsoft` besitzen die Synthese-Implementierungen
- `voice-call` konsumiert den Runtime-Helper für Telephony-TTS

Dasselbe Muster sollte für künftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medien-
verständnis, Bilderzeugung, Videoerzeugung, Web-Abruf und Websuche hat,
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

Wichtig sind nicht die exakten Helper-Namen. Wichtig ist die Form:

- ein Plugin besitzt die Anbieter-Oberfläche
- der Kern besitzt weiterhin die Fähigkeitsverträge
- Kanäle und Feature-Plugins konsumieren `api.runtime.*`-Helper, nicht Anbietercode
- Vertragstests können prüfen, dass das Plugin die Fähigkeiten registriert hat, die
  es nach eigener Aussage besitzt

### Beispiel für eine Fähigkeit: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Fähigkeit. Dasselbe Ownership-Modell gilt auch dort:

1. der Kern definiert den Vertrag für Medienverständnis
2. Anbieter-Plugins registrieren je nach Anwendbarkeit `describeImage`, `transcribeAudio` und
   `describeVideo`
3. Kanal- und Feature-Plugins konsumieren das gemeinsame Kernverhalten, statt
   direkt an Anbietercode zu verdrahten

Dadurch werden die Video-Annahmen eines einzelnen Providers nicht im Kern fest eingebaut. Das Plugin besitzt
die Anbieter-Oberfläche; der Kern besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Videoerzeugung verwendet bereits dieselbe Sequenz: Der Kern besitzt den typisierten
Fähigkeitsvertrag und den Runtime-Helper, und Anbieter-Plugins registrieren
Implementierungen von `api.registerVideoGenerationProvider(...)` dagegen.

Sie brauchen eine konkrete Rollout-Checkliste? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Oberfläche der Plugin-API ist absichtlich typisiert und zentralisiert in
`OpenClawPluginApi`. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Runtime-Helper, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Kern kann doppelte Ownership ablehnen, etwa wenn zwei Plugins dieselbe
  Provider-ID registrieren
- beim Start können verwertbare Diagnosen für fehlerhafte Registrierungen angezeigt werden
- Vertragstests können Ownership gebündelter Plugins durchsetzen und stilles Abdriften verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Runtime-Durchsetzung bei der Registrierung**
   Die Plugin-Registry validiert Registrierungen, wenn Plugins geladen werden. Beispiele:
   doppelte Provider-IDs, doppelte IDs von Speech-Providern und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, damit
   OpenClaw Ownership explizit prüfen kann. Heute wird dies für Modell-
   Provider, Speech-Provider, Web-Search-Provider und Ownership gebündelter Registrierungen verwendet.

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche
Oberfläche besitzt. Dadurch können Kern und Kanäle nahtlos zusammenarbeiten, weil Ownership
deklariert, typisiert und testbar ist statt implizit.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- im Besitz des Kerns
- von mehreren Plugins wiederverwendbar
- von Kanälen/Features ohne Anbieterwissen konsumierbar

Schlechte Plugin-Verträge sind:

- im Kern versteckte anbieterbezogene Richtlinie
- einmalige Escape-Hatches für Plugins, die die Registry umgehen
- Kanalcode, der direkt in eine Anbieterimplementierung greift
- ad hoc Runtime-Objekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Im Zweifel heben Sie die Abstraktionsebene an: Definieren Sie zuerst die Fähigkeit und
lassen Sie dann Plugins daran andocken.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **In-Process** mit dem Gateway. Sie sind nicht
in einer Sandbox. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie
Kerncode.

Auswirkungen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Fehler in einem nativen Plugin kann das Gateway abstürzen lassen oder destabilisieren
- ein bösartiges natives Plugin entspricht beliebiger Codeausführung innerhalb des
  OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als
Metadaten-/Content-Pakete behandelt. In aktuellen Releases bedeutet das größtenteils gebündelte
Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie
Workspace-Plugins als Code zur Entwicklungszeit, nicht als Produktionsstandard.

Halten Sie bei gebündelten Workspace-Paketnamen die Plugin-ID im npm-
Namen verankert: standardmäßig `@openclaw/<id>` oder ein genehmigter typisierter Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine schmalere Plugin-Rolle bereitstellt.

Wichtiger Hinweis zum Vertrauensmodell:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/allowlistet ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.
- Vertrauen in gebündelte Plugins wird aus dem Source-Snapshot aufgelöst — dem Manifest und
  dem Code auf der Festplatte zur Ladezeit — und nicht aus Installationsmetadaten. Ein korrupter
  oder ausgetauschter Installationsdatensatz kann die Vertrauensoberfläche eines gebündelten Plugins nicht stillschweigend
  über das hinaus erweitern, was der tatsächliche Quellcode angibt.

## Exportgrenze

OpenClaw exportiert Fähigkeiten, nicht Convenience für Implementierungen.

Halten Sie die Fähigkeitsregistrierung öffentlich. Reduzieren Sie Helper-Exporte außerhalb des Vertrags:

- Helper-Subpaths spezifisch für gebündelte Plugins
- Runtime-Plumbing-Subpaths, die nicht als öffentliche API gedacht sind
- anbieterbezogene Convenience-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Einige Helper-Subpaths gebündelter Plugins verbleiben aus Kompatibilitäts- und Wartungsgründen
weiterhin in der generierten SDK-Export-Map. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandeln Sie diese als
reservierte Exporte von Implementierungsdetails, nicht als empfohlenes SDK-Muster für
neue Third-Party-Plugins.

## Ladepipeline

Beim Start macht OpenClaw grob Folgendes:

1. Root-Pfade potenzieller Plugins entdecken
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   nicht gebaute native Plugins verwenden jiti
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Runtime-Oberflächen bereitstellen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst auf, welches von beiden vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheits-Gates passieren **vor** der Runtime-Ausführung. Kandidaten werden blockiert,
wenn der Entry den Plugin-Root verlässt, der Pfad weltweit beschreibbar ist oder die
Pfad-Ownership bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-first-Verhalten

Das Manifest ist die Source of Truth der Control Plane. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Config-Schema oder Bundle-Fähigkeiten zu entdecken
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter in der Control UI anzureichern
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren zu bewahren, ohne die Plugin-Runtime zu laden

Für native Plugins ist das Runtime-Modul der Data-Plane-Teil. Es registriert
tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben auf der Control Plane.
Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Discovery;
sie ersetzen weder Runtime-Registrierung, `register(...)` noch `setupEntry`.
Die ersten Live-Aktivierungs-Consumer verwenden jetzt Manifest-Hinweise zu Befehlen, Kanälen und Providern,
um das Laden von Plugins vor einer breiteren Materialisierung der Registry einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, die den angeforderten primären Befehl besitzen
- Kanal-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, die die angeforderte
  Kanal-ID besitzen
- explizite Provider-Setup-/Runtime-Auflösung wird auf Plugins eingegrenzt, die die
  angeforderte Provider-ID besitzen

Die Setup-Discovery bevorzugt jetzt deskriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf
`setup-api` für Plugins zurückfällt, die weiterhin Runtime-Hooks zur Setup-Zeit brauchen. Wenn mehr als
ein entdecktes Plugin dieselbe normalisierte Setup-Provider- oder CLI-Backend-
ID beansprucht, verweigert die Setup-Suche den mehrdeutigen Besitzer, statt sich auf
die Discovery-Reihenfolge zu verlassen.

### Was der Loader cacht

OpenClaw hält kurze In-Process-Caches für:

- Discovery-Ergebnisse
- Daten der Manifest-Registry
- geladene Plugin-Registries

Diese Caches reduzieren Spitzen beim Start und den Overhead bei wiederholten Befehlen. Man kann sie
sicher als kurzlebige Performance-Caches verstehen, nicht als Persistenz.

Hinweis zur Performance:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passen Sie die Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins mutieren nicht direkt beliebige globale Objekte im Kern. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Einträge (Identität, Quelle, Herkunft, Status, Diagnosen)
- Tools
- Legacy-Hooks und typisierte Hooks
- Kanäle
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrare
- Hintergrunddienste
- Plugin-eigene Befehle

Kernfunktionen lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen zu sprechen.
Dadurch bleibt das Laden einseitig:

- Plugin-Modul -> Registrierung in der Registry
- Kern-Runtime -> Konsum der Registry

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Kernoberflächen nur
einen Integrationspunkt brauchen: „die Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Konversations-Bindings

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bind-
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
- `binding`: das aufgelöste Binding für genehmigte Anfragen
- `request`: die ursprüngliche Zusammenfassung der Anfrage, Hinweis auf Detach, Sender-ID und
  Konversationsmetadaten

Dieser Callback dient nur zur Benachrichtigung. Er ändert nicht, wer eine
Konversation binden darf, und er läuft, nachdem die Kernbehandlung der Genehmigung abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins haben jetzt zwei Schichten:

- Manifest-Metadaten: `providerAuthEnvVars` für günstige Env-Auth-Suche des Providers
  vor dem Laden der Runtime, `providerAuthAliases` für Provider-Varianten, die sich
  Auth teilen, `channelEnvVars` für günstige Env-/Setup-Suche von Kanälen vor dem
  Laden der Runtime, sowie `providerAuthChoices` für günstige Labels zur
  Onboarding-/Auth-Auswahl und CLI-Flag-Metadaten vor dem Laden der Runtime
- Hooks zur Konfigurationszeit: `catalog` / alt `discovery` plus `applyConfigDefaults`
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw besitzt weiterhin die generische Agentenschleife, Failover, Transkriptbehandlung und
Tool-Richtlinie. Diese Hooks sind die Erweiterungsoberfläche für anbieterbezogenes Verhalten, ohne
dass ein vollständiger benutzerdefinierter Inferenztransport nötig ist.

Verwenden Sie Manifest-`providerAuthEnvVars`, wenn der Provider env-basierte Credentials hat,
die generische Auth-/Status-/Model-Picker-Pfade sehen sollen, ohne die Plugin-Runtime zu laden.
Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die Env-Variablen,
Auth-Profile, konfigurationsgestützte Auth und die API-Key-Onboarding-Auswahl einer anderen
Provider-ID wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn
CLI-Oberflächen für Onboarding/Auth-Auswahl die Choice-ID des Providers, Gruppenlabels und
einfache Auth-Verdrahtung mit einem Flag kennen sollen, ohne die Provider-Runtime zu laden. Behalten Sie in der Provider-Runtime
`envVars` für operatororientierte Hinweise wie Onboarding-Labels oder Setup-Variablen für OAuth-
Client-ID/Client-Secret.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal env-gesteuerte Auth oder Setup hat, die
generischer Shell-Env-Fallback, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen sollen,
ohne die Kanal-Runtime zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks grob in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.

| #   | Hook                              | Was er macht                                                                                                   | Wann verwenden                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Veröffentlicht Provider-Konfiguration in `models.providers` während der Generierung von `models.json`         | Der Provider besitzt einen Katalog oder Standardwerte für `baseUrl`                                                                           |
| 2   | `applyConfigDefaults`             | Wendet Provider-eigene globale Standardwerte während der Materialisierung der Konfiguration an                 | Standardwerte hängen von Auth-Modus, Env oder der Semantik der Provider-Modellfamilie ab                                                     |
| --  | _(built-in model lookup)_         | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                    | _(kein Plugin-Hook)_                                                                                                                          |
| 3   | `normalizeModelId`                | Normalisiert Legacy- oder Preview-Aliasse für Modell-IDs vor der Suche                                        | Der Provider besitzt Alias-Bereinigung vor der Auflösung der kanonischen Modell-ID                                                           |
| 4   | `normalizeTransport`              | Normalisiert `api` / `baseUrl` einer Provider-Familie vor der generischen Modellassemblierung                 | Der Provider besitzt Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                                 |
| 5   | `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor der Runtime-/Provider-Auflösung                                      | Der Provider benötigt Konfigurations-Bereinigung, die beim Plugin liegen sollte; gebündelte Google-Familien-Helper stützen auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Wendet Kompatibilitäts-Umschreibungen für native Streaming-Nutzung auf Konfigurations-Provider an             | Der Provider benötigt endpointgesteuerte Korrekturen für Metadaten zur nativen Streaming-Nutzung                                             |
| 7   | `resolveConfigApiKey`             | Löst Env-Marker-Authentifizierung für Konfigurations-Provider vor dem Laden der Runtime-Authentifizierung auf  | Der Provider hat eine Provider-eigene API-Key-Auflösung über Env-Marker; `amazon-bedrock` hat hier ebenfalls einen eingebauten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | Macht lokale/self-hosted oder konfigurationsgestützte Auth sichtbar, ohne Klartext zu persistieren            | Der Provider kann mit einem synthetischen/lokalen Credential-Marker arbeiten                                                                  |
| 9   | `resolveExternalAuthProfiles`     | Legt Provider-eigene externe Auth-Profile darüber; Standard für `persistence` ist `runtime-only` bei CLI-/App-eigenen Credentials | Der Provider verwendet externe Auth-Credentials wieder, ohne kopierte Refresh-Tokens zu persistieren; deklarieren Sie `contracts.externalAuthProviders` im Manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Stuft gespeicherte synthetische Profil-Platzhalter hinter env-/konfigurationsgestützter Auth zurück          | Der Provider speichert synthetische Platzhalterprofile, die beim Vorrang nicht gewinnen sollten                                              |
| 11  | `resolveDynamicModel`             | Synchrones Fallback für Provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind               | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                         |
| 12  | `prepareDynamicModel`             | Asynchrones Warm-up, danach läuft `resolveDynamicModel` erneut                                                | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden                                                               |
| 13  | `normalizeResolvedModel`          | Letzte Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                            | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Kern-Transport                                                |
| 14  | `contributeResolvedModelCompat`   | Liefert Kompatibilitäts-Flags für Anbieter-Modelle hinter einem anderen kompatiblen Transport                 | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                            |
| 15  | `capabilities`                    | Provider-eigene Metadaten für Transkript/Tooling, die von gemeinsamer Kernlogik verwendet werden              | Der Provider benötigt Besonderheiten für Transkripte/Provider-Familien                                                                        |
| 16  | `normalizeToolSchemas`            | Normalisiert Tool-Schemas, bevor der eingebettete Runner sie sieht                                            | Der Provider benötigt Schema-Bereinigung auf Ebene der Transportfamilie                                                                       |
| 17  | `inspectToolSchemas`              | Macht Provider-eigene Schema-Diagnosen nach der Normalisierung sichtbar                                       | Der Provider möchte Warnungen zu Schlüsselwörtern ausgeben, ohne dem Kern anbieterbezogene Regeln beizubringen                              |
| 18  | `resolveReasoningOutputMode`      | Wählt nativen gegenüber getaggtem Vertrag für Reasoning-Ausgaben                                               | Der Provider benötigt getaggte Reasoning-/Final-Ausgabe statt nativer Felder                                                                  |
| 19  | `prepareExtraParams`              | Normalisierung von Anfrageparametern vor generischen Wrappern für Stream-Optionen                              | Der Provider benötigt Standard-Anfrageparameter oder Provider-spezifische Bereinigung von Parametern                                         |
| 20  | `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                         | Der Provider benötigt ein benutzerdefiniertes Wire-Protocol, nicht nur einen Wrapper                                                         |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                   | Der Provider benötigt Wrapper für Anfrage-Header/Body/Modell-Kompatibilität ohne benutzerdefinierten Transport                              |
| 22  | `resolveTransportTurnState`       | Hängt native Header oder Metadaten pro Turn für den Transport an                                               | Der Provider möchte, dass generische Transporte provider-native Turn-Identität senden                                                        |
| 23  | `resolveWebSocketSessionPolicy`   | Hängt native WebSocket-Header oder eine Session-Cool-down-Richtlinie an                                        | Der Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinie abstimmen                                         |
| 24  | `formatApiKey`                    | Formatter für Auth-Profile: gespeichertes Profil wird zur Runtime-Zeichenfolge `apiKey`                       | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Runtime-Token-Form                                   |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder eine Richtlinie bei Refresh-Fehlern      | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                                |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                           | Der Provider benötigt Provider-eigene Hinweise zur Auth-Reparatur nach einem Refresh-Fehler                                                  |
| 27  | `matchesContextOverflowError`     | Provider-eigener Matcher für Überläufe des Kontextfensters                                                     | Der Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                           |
| 28  | `classifyFailoverReason`          | Provider-eigene Klassifizierung des Failover-Grunds                                                            | Der Provider kann rohe API-/Transport-Fehler auf Rate-Limit/Überlastung/usw. abbilden                                                        |
| 29  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                           | Der Provider benötigt Proxy-spezifisches TTL-Gating für den Cache                                                                             |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Auth                                       | Der Provider benötigt einen Provider-spezifischen Wiederherstellungshinweis für fehlende Auth                                                |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzergerichteter Fehlerhinweis                   | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Anbieterhinweis ersetzen                                             |
| 32  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen, die nach der Discovery angehängt werden                                     | Der Provider benötigt synthetische Zeilen für Vorwärtskompatibilität in `models list` und Pickern                                            |
| 33  | `resolveThinkingProfile`          | Setzt modellspezifische `/think`-Stufe, Anzeige-Labels und Standardwert                                        | Der Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Abstufung oder ein binäres Label bereit                        |
| 34  | `isBinaryThinking`                | Kompatibilitäts-Hook für den Reasoning-Schalter an/aus                                                         | Der Provider stellt Thinking nur binär als an/aus bereit                                                                                      |
| 35  | `supportsXHighThinking`           | Kompatibilitäts-Hook für Unterstützung von `xhigh`-Reasoning                                                   | Der Provider möchte `xhigh` nur für einen Teil der Modelle                                                                                    |
| 36  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für die Standardstufe von `/think`                                                        | Der Provider besitzt die Standardrichtlinie für `/think` für eine Modellfamilie                                                              |
| 37  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                           | Der Provider besitzt das Matching bevorzugter Modelle für Live/Smoke                                                                          |
| 38  | `prepareRuntimeAuth`              | Tauscht ein konfiguriertes Credential kurz vor der Inferenz in das tatsächliche Runtime-Token/den Schlüssel um | Der Provider benötigt einen Token-Austausch oder kurzlebige Request-Credentials                                                              |
| 39  | `resolveUsageAuth`                | Löst Credentials für Usage/Abrechnung für `/usage` und verwandte Statusoberflächen auf                        | Der Provider benötigt benutzerdefiniertes Parsing von Usage-/Quota-Tokens oder ein anderes Usage-Credential                                 |
| 40  | `fetchUsageSnapshot`              | Ruft anbieterbezogene Usage-/Quota-Snapshots ab und normalisiert sie, nachdem die Auth aufgelöst wurde        | Der Provider benötigt einen anbieterbezogenen Usage-Endpunkt oder Payload-Parser                                                             |
| 41  | `createEmbeddingProvider`         | Baut einen Provider-eigenen Embedding-Adapter für Memory/Suche                                                 | Verhalten für Memory-Embeddings gehört zum Provider-Plugin                                                                                    |
| 42  | `buildReplayPolicy`               | Gibt eine Replay-Richtlinie zurück, die die Transkriptbehandlung für den Provider steuert                     | Der Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (zum Beispiel Entfernen von Thinking-Blöcken)                           |
| 43  | `sanitizeReplayHistory`           | Schreibt den Replay-Verlauf nach generischer Bereinigung des Transkripts um                                    | Der Provider benötigt provider-spezifische Umschreibungen für Replays über gemeinsame Compaction-Helper hinaus                              |
| 44  | `validateReplayTurns`             | Finale Validierung oder Umformung von Replay-Turns vor dem eingebetteten Runner                               | Der Provider-Transport benötigt nach der generischen Bereinigung eine strengere Validierung von Turns                                       |
| 45  | `onModelSelected`                 | Führt Provider-eigene Seiteneffekte nach der Modellauswahl aus                                                 | Der Provider benötigt Telemetrie oder Provider-eigenen Status, wenn ein Modell aktiv wird                                                   |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
gematchte Provider-Plugin und gehen dann zu anderen hookfähigen Provider-Plugins über,
bis eines tatsächlich die Modell-ID oder den Transport/die Konfiguration ändert. Dadurch bleiben
Alias-/Kompatibilitäts-Shims für Provider funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Google-Familien-Konfigurationseintrag umschreibt, wendet der gebündelte Google-Konfigurationsnormalisierer weiterhin
diese Kompatibilitäts-Bereinigung an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protocol oder einen benutzerdefinierten Request-Executor benötigt,
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

Gebündelte Provider-Plugins verwenden die oben genannten Hooks in Kombinationen, die auf die Anforderungen des jeweiligen
Anbieters an Katalog, Auth, Thinking, Replay und Usage-Tracking zugeschnitten sind. Das genaue
Hook-Set pro Provider befindet sich zusammen mit dem Plugin-Quellcode unter `extensions/`; behandeln Sie
dies als maßgebliche Liste, statt sie hier zu spiegeln.

Veranschaulichende Muster:

- **Katalog-Provider mit Durchleitung** (OpenRouter, Kilocode, Z.AI, xAI) registrieren
  `catalog` plus `resolveDynamicModel`/`prepareDynamicModel`, damit sie
  Upstream-Modell-IDs vor dem statischen Katalog von OpenClaw sichtbar machen können.
- **Provider mit OAuth + Usage-Endpunkt** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai) kombinieren `prepareRuntimeAuth` oder `formatApiKey`
  mit `resolveUsageAuth` + `fetchUsageSnapshot`, um Token-Austausch und
  Integration von `/usage` zu besitzen.
- **Replay-/Transkript-Bereinigung** wird über benannte Familien geteilt:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. Provider entscheiden sich über `buildReplayPolicy`
  dafür, statt jeweils selbst Transkript-Bereinigung zu implementieren.
- **Nur-Katalog**-gebündelte Provider (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) registrieren nur `catalog` und nutzen
  die gemeinsame Inferenzschleife.
- **Anthropic-spezifische Stream-Helper** (Beta-Header, `/fast`/`serviceTier`,
  `context1m`) liegen innerhalb des öffentlichen Seams `api.ts` /
  `contract-api.ts` des gebündelten Anthropic-Plugins (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) und nicht im
  generischen SDK.

## Runtime-Helper

Plugins können über `api.runtime` auf ausgewählte Kern-Helper zugreifen. Für TTS:

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

- `textToSpeech` gibt die normale Kern-TTS-Ausgabe-Payload für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet Kernkonfiguration `messages.tts` und Providerauswahl.
- Gibt PCM-Audiobuffer + Sample-Rate zurück. Plugins müssen für Provider neu sampeln/kodieren.
- `listVoices` ist optional pro Provider. Verwenden Sie es für Anbieter-eigene Voice-Picker oder Setup-Flows.
- Voice-Listings können reichere Metadaten wie Locale, Geschlecht und Persönlichkeitstags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telephony. Microsoft nicht.

Plugins können auch Speech-Provider über `api.registerSpeechProvider(...)` registrieren.

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

- Halten Sie TTS-Richtlinie, Fallback und Antwortzustellung im Kern.
- Verwenden Sie Speech-Provider für Anbieter-eigenes Syntheseverhalten.
- Die alte Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Ownership-Modell ist unternehmensorientiert: Ein Anbieter-Plugin kann
  Text-, Speech-, Bild- und künftige Medien-Provider besitzen, während OpenClaw diese
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

- Halten Sie Orchestrierung, Fallback, Konfiguration und Kanalverdrahtung im Kern.
- Halten Sie Anbieterverhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Videoerzeugung folgt bereits demselben Muster:
  - der Kern besitzt den Fähigkeitsvertrag und den Runtime-Helper
  - Anbieter-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Kanal-Plugins konsumieren `api.runtime.videoGeneration.*`

Für Runtime-Helper des Medienverständnisses können Plugins Folgendes aufrufen:

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

Für Audiotranskription können Plugins entweder die Runtime für Medienverständnis
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
- Verwendet die Audiokonfiguration des Kerns für Medienverständnis (`tools.media.audio`) und die Fallback-Reihenfolge der Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungener/nicht unterstützter Eingabe).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können auch Hintergrundläufe von Subagenten über `api.runtime.subagent` starten:

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
- Für Plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel explizit zu erlauben.
- Unvertrauenswürdige Subagent-Läufe von Plugins funktionieren weiterhin, aber Override-Anfragen werden abgelehnt, statt stillschweigend auf Fallback zurückzufallen.

Für Websuche können Plugins den gemeinsamen Runtime-Helper konsumieren, statt
in das Wiring des Agent-Tools zu greifen:

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

Plugins können Web-Search-Provider auch über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Halten Sie Providerauswahl, Credential-Auflösung und gemeinsame Request-Semantik im Kern.
- Verwenden Sie Web-Search-Provider für anbieterbezogene Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Kanal-Plugins, die Suchverhalten benötigen, ohne von dem Wrapper des Agent-Tools abzuhängen.

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

- `generate(...)`: ein Bild mithilfe der konfigurierten Kette von Image-Generation-Providern erzeugen.
- `listProviders(...)`: verfügbare Image-Generation-Provider und ihre Fähigkeiten auflisten.

## Gateway-HTTP-Routen

Plugins können HTTP-Endpunkte über `api.registerHttpRoute(...)` bereitstellen.

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

Felder einer Route:

- `path`: Routenpfad unter dem HTTP-Server des Gateway.
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für Plugin-verwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: `true` zurückgeben, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und führt zu einem Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Konflikte bei exakt gleichem `path + match` werden abgelehnt, sofern nicht `replaceExisting: true`, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie Fallthrough-Ketten mit `exact`/`prefix` nur auf derselben `auth`-Stufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Runtime-Scopes des Operators. Sie sind für pluginverwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Gateway-Helper-Aufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Runtime-Scopes für Gateway-Anfragen, aber dieser Scope ist absichtlich konservativ:
  - Bearer-Authentifizierung mit Shared Secret (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes von Plugin-Routen auf `operator.write` fest, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` auf einem privaten Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen Plugin-Routen-Anfragen mit Identität fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine Plugin-Route mit Gateway-Auth implizit eine Admin-Oberfläche ist. Wenn Ihre Route Verhalten nur für Admins benötigt, verlangen Sie einen Auth-Modus mit Identität und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Importpfade für das Plugin-SDK

Verwenden Sie beim Erstellen neuer Plugins schmale SDK-Subpaths anstelle des monolithischen Root-
Barrels `openclaw/plugin-sdk`. Kern-Subpaths:

| Subpath                             | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive für die Plugin-Registrierung             |
| `openclaw/plugin-sdk/channel-core`  | Entry-/Build-Helper für Kanäle                     |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Helper und Dachvertrag       |
| `openclaw/plugin-sdk/config-schema` | Zod-Schema für Root-`openclaw.json` (`OpenClawSchema`) |

Kanal-Plugins wählen aus einer Familie schmaler Seams — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Genehmigungsverhalten sollte sich auf einen
einzigen Vertrag `approvalCapability` konsolidieren, statt über nicht zusammenhängende
Plugin-Felder vermischt zu werden. Siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins).

Runtime- und Konfigurations-Helper liegen unter passenden `*-runtime`-Subpaths
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` usw.).

<Info>
`openclaw/plugin-sdk/channel-runtime` ist veraltet — ein Kompatibilitäts-Shim für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Entry-Points (pro Root des Pakets eines gebündelten Plugins):

- `index.js` — Entry des gebündelten Plugins
- `api.js` — Barrel für Helper/Typen
- `runtime-api.js` — nur-Runtime-Barrel
- `setup-entry.js` — Setup-Plugin-Entry

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Subpaths importieren. Importieren Sie niemals
`src/*` eines anderen Plugin-Pakets aus dem Kern oder aus einem anderen Plugin.
Über Facades geladene Entry-Points bevorzugen den aktiven Runtime-Konfigurationssnapshot, wenn einer
existiert, und fallen dann auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück.

Fähigkeitsspezifische Subpaths wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind nicht
automatisch langfristig eingefrorene externe Verträge — prüfen Sie die relevante SDK-
Referenzseite, wenn Sie sich auf sie verlassen.

## Schemas für das Message-Tool

Plugins sollten kanalspezifische Schema-Beiträge für `describeMessageTool(...)`
für Nicht-Nachrichten-Primitive wie Reaktionen, Reads und Polls besitzen.
Gemeinsame Send-Präsentation sollte den generischen Vertrag `MessagePresentation`
anstelle von provider-nativen Feldern für Buttons, Komponenten, Blöcke oder Karten verwenden.
Siehe [Message Presentation](/de/plugins/message-presentation) für Vertrag,
Fallback-Regeln, Provider-Mapping und Checkliste für Plugin-Autoren.

Sendefähige Plugins deklarieren, was sie über Message-Fähigkeiten rendern können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anforderungen an angeheftete Zustellung

Der Kern entscheidet, ob die Präsentation nativ gerendert oder zu Text degradiert wird.
Stellen Sie keine provider-nativen UI-Escape-Hatches über das generische Message-Tool bereit.
Veraltete SDK-Helper für alte native Schemas bleiben für bestehende
Third-Party-Plugins exportiert, aber neue Plugins sollten sie nicht verwenden.

## Auflösung von Kanalzielen

Kanal-Plugins sollten kanalspezifische Semantik für Ziele besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor der Directory-Suche als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Kern mit, ob eine
  Eingabe direkt zur id-ähnlichen Auflösung springen soll, statt die Directory zu durchsuchen.
- `messaging.targetResolver.resolveTarget(...)` ist das Fallback des Plugins, wenn der
  Kern nach der Normalisierung oder nach einem Directory-Miss eine finale Provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die Konstruktion einer Provider-spezifischen
  Sitzungsroute, sobald ein Ziel aufgelöst ist.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche nach Peers/Gruppen stattfinden sollten.
- Verwenden Sie `looksLikeId` für Prüfungen vom Typ „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für Provider-spezifisches Normalisierungs-Fallback, nicht für
  breite Directory-Suche.
- Halten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Room-
  IDs innerhalb von `target`-Werten oder Provider-spezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Directories

Plugins, die Directory-Einträge aus Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Helper aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- Allowlist-gesteuerte DM-Peers
- konfigurierte Kanal-/Gruppen-Maps
- kontobezogene statische Directory-Fallbacks

Die gemeinsamen Helper in `directory-runtime` behandeln nur generische Operationen:

- Filterung von Queries
- Anwendung von Limits
- Helpers für Deduplizierung/Normalisierung
- Aufbau von `ChannelDirectoryEntry[]`

Kanalspezifische Kontoprüfung und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin Provider-spezifische Modell-IDs, Standardwerte für `baseUrl`
oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
eingebauten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache Provider mit API-Key oder env-gesteuert
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammenhängende Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkonflikten, sodass Plugins absichtlich einen
eingebauten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Kanalinspektion

Wenn Ihr Plugin einen Kanal registriert, sollten Sie bevorzugt
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)` implementieren.

Warum:

- `resolveAccount(...)` ist der Runtime-Pfad. Er darf davon ausgehen, dass Credentials
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Config-
  Reparatur-Flows sollten Runtime-Credentials nicht materialisieren müssen, nur um
  Konfiguration zu beschreiben.

Empfohlenes Verhalten für `inspectAccount(...)`:

- Nur beschreibenden Kontostatus zurückgeben.
- `enabled` und `configured` beibehalten.
- Bei Bedarf Felder für Credential-Quelle/-Status einschließen, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. Es genügt, `tokenStatus: "available"` (und das passende Quellenfeld)
  für statusartige Befehle zurückzugeben.
- Verwenden Sie `configured_unavailable`, wenn ein Credential per SecretRef konfiguriert ist, aber
  im aktuellen Befehlspfad nicht verfügbar.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert zu melden.

## Package-Packs

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

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Extensions auflistet, wird die Plugin-ID zu
`name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach der Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die das Paketverzeichnis verlassen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halten Sie die Abhängigkeits-
Bäume von Plugins „pure JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds benötigen.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges Modul nur für Setup zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Kanal-Plugin benötigt oder
wenn ein Kanal-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Entry. Dadurch bleiben Start und Setup leichter,
wenn Ihr Haupt-Plugin-Entry zusätzlich Tools, Hooks oder anderen Runtime-only-
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Kanal-Plugin für denselben Pfad `setupEntry` in der
Pre-Listen-Startphase des Gateway aktivieren, selbst wenn der Kanal bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die
vor dem Start des Gateway-Listening existieren muss. In der Praxis bedeutet das, dass der Setup-Entry
jede kanalbezogene Fähigkeit registrieren muss, von der der Start abhängt, zum Beispiel:

- die Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway auf Anfragen lauscht
- alle Gateway-Methoden, Tools oder Dienste, die in demselben Zeitfenster existieren müssen

Wenn Ihr vollständiger Entry weiterhin eine erforderliche Startfähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Bleiben Sie beim Standardverhalten und lassen Sie OpenClaw den
vollständigen Entry beim Start laden.

Gebündelte Kanäle können außerdem Setup-only-Helper für Vertragsoberflächen veröffentlichen, die der Kern
abfragen kann, bevor die vollständige Kanal-Runtime geladen wird. Die aktuelle Oberfläche für Setup-
Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Kern verwendet diese Oberfläche, wenn er eine alte Single-Account-Kanal-
Konfiguration in `channels.<id>.accounts.*` überführen muss, ohne den vollständigen Plugin-Entry zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes überführtes Konto, wenn benannte Konten bereits existieren, und es kann einen
konfigurierten nicht-kanonischen Default-Account-Schlüssel beibehalten, statt immer
`accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Discovery für Vertragsoberflächen gebündelter Plugins lazy. Die Import-
Zeit bleibt leicht; die Promotion-Oberfläche wird erst bei der ersten Verwendung geladen, statt den Start gebündelter Kanäle beim Modulimport erneut zu betreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden umfassen, halten Sie sie auf einem
plugin-spezifischen Präfix. Kern-Admin-Namespaces (`config.*`,
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

### Katalogmetadaten für Kanäle

Kanal-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bewerben. Dadurch bleiben die Katalogdaten im Kern frei von Daten.

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

Nützliche `openclaw.channel`-Felder über das Minimalbeispiel hinaus:

- `detailLabel`: sekundäres Label für reichhaltigere Katalog-/Statusoberflächen
- `docsLabel`: überschreibt den Linktext für den Doku-Link
- `preferOver`: Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerungen für Copy auf Auswahloberflächen
- `markdownCapable`: markiert den Kanal als markdownfähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Kanal aus Oberflächen zur Auflistung konfigurierter Kanäle aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Kanal aus interaktiven Setup-/Konfigurations-Pickern aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Kanal für Oberflächen der Doku-Navigation als intern/privat
- `showConfigured` / `showInSetup`: Legacy-Aliasse werden zur Kompatibilität weiterhin akzeptiert; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: aktiviert für den Kanal den Standard-Quickstart-Flow `allowFrom`
- `forceAccountBinding`: verlangt explizites Account-Binding, selbst wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt Session-Lookup beim Auflösen von Announce-Zielen

OpenClaw kann auch **externe Kanalkataloge** zusammenführen (zum Beispiel einen Export aus einer MPM-
Registry). Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder zeigen Sie mit `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als Legacy-Aliasse für den Schlüssel `"entries"`.

## Context-Engine-Plugins

Context-Engine-Plugins besitzen die Orchestrierung des Sitzungskontexts für Ingest, Assemblierung
und Compaction. Registrieren Sie sie aus Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine`.

Verwenden Sie dies, wenn Ihr Plugin die Standard-
Kontextpipeline ersetzen oder erweitern muss, statt nur Memory-Suche oder Hooks hinzuzufügen.

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

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, halten Sie `compact()`
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

Wenn ein Plugin Verhalten benötigt, das nicht in die aktuelle API passt, umgehen Sie
das Plugin-System nicht mit einem privaten Reach-in. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. den Kernvertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Kern besitzen sollte: Richtlinie, Fallback, Konfigurations-Merge,
   Lifecycle, kanalgerichtete Semantik und Form der Runtime-Helper.
2. typisierte Oberflächen für Plugin-Registrierung/Runtime hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Kern- + Kanal-/Feature-Consumer verdrahten
   Kanäle und Feature-Plugins sollten die neue Fähigkeit über den Kern konsumieren,
   nicht durch direktes Importieren einer Anbieterimplementierung.
4. Anbieterimplementierungen registrieren
   Anbieter-Plugins registrieren dann ihre Backends gegen die Fähigkeit.
5. Vertrags-Coverage hinzufügen
   Fügen Sie Tests hinzu, damit Ownership und Registrierungsform im Lauf der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne fest auf das Weltbild eines
einzelnen Providers verdrahtet zu werden. Siehe das [Capability Cookbook](/de/plugins/architecture)
für eine konkrete Dateicheckliste und ein ausgearbeitetes Beispiel.

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung in der Regel diese
Oberflächen gemeinsam berühren:

- Kernvertragstypen in `src/<capability>/types.ts`
- Kern-Runner/Runtime-Helper in `src/<capability>/runtime.ts`
- Oberfläche für Plugin-API-Registrierung in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Offenlegung in der Plugin-Runtime in `src/plugins/runtime/*`, wenn Feature-/Kanal-
  Plugins sie konsumieren müssen
- Capture-/Test-Helper in `src/test-utils/plugin-registration.ts`
- Ownership-/Vertrags-Assertions in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Doku in `docs/`

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

Dadurch bleibt die Regel einfach:

- der Kern besitzt Fähigkeitsvertrag + Orchestrierung
- Anbieter-Plugins besitzen Anbieterimplementierungen
- Feature-/Kanal-Plugins konsumieren Runtime-Helper
- Vertragstests halten Ownership explizit
