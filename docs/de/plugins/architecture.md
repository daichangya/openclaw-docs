---
read_when:
    - Erstellen oder Debuggen nativer OpenClaw-Plugins
    - Verstehen des Plugin-Fähigkeitsmodells oder der Zuständigkeitsgrenzen
    - Arbeiten an der Plugin-Lade-Pipeline oder Registry
    - Implementieren von Provider-Runtime-Hooks oder Kanal-Plugins
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Zuständigkeit, Verträge, Lade-Pipeline und Runtime-Helper'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-24T06:48:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 344c02f9f0bb19780d262929e665fcaf8093ac08cda30b61af56857368b0b07a
    source_path: plugins/architecture.md
    workflow: 15
---

Dies ist die **ausführliche Architekturreferenz** für das Plugin-System von OpenClaw. Für
praktische Anleitungen beginnen Sie mit einer der fokussierten Seiten unten.

<CardGroup cols={2}>
  <Card title="Plugins installieren und verwenden" icon="plug" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Hinzufügen, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins erstellen" icon="rocket" href="/de/plugins/building-plugins">
    Tutorial für das erste Plugin mit dem kleinsten funktionsfähigen Manifest.
  </Card>
  <Card title="Kanal-Plugins" icon="comments" href="/de/plugins/sdk-channel-plugins">
    Ein Messaging-Kanal-Plugin erstellen.
  </Card>
  <Card title="Provider-Plugins" icon="microchip" href="/de/plugins/sdk-provider-plugins">
    Ein Modell-Provider-Plugin erstellen.
  </Card>
  <Card title="SDK-Überblick" icon="book" href="/de/plugins/sdk-overview">
    Import-Map und Referenz zur Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche **native Plugin**-Modell innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit             | Registrierungsmethode                            | Beispiel-Plugins                     |
| --------------------- | ------------------------------------------------ | ------------------------------------ |
| Textinferenz          | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI-Inferenz-Backend  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Sprache               | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Realtime-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Realtime-Sprache      | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medienverständnis     | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Bilderzeugung         | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Musikerzeugung        | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Videoerzeugung        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web-Fetch             | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web-Suche             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / Messaging     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools oder
Dienste bereitstellt, ist ein **veraltetes hook-only**-Plugin. Dieses Muster wird weiterhin vollständig unterstützt.

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Core gelandet und wird heute von gebündelten/nativen Plugins
verwendet, aber die Kompatibilität externer Plugins braucht weiterhin eine engere Latte als „es ist
exportiert, also ist es eingefroren“.

| Pluginsituation                                   | Leitlinie                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Bestehende externe Plugins                        | Hook-basierte Integrationen funktionsfähig halten; das ist die Kompatibilitätsbasis.            |
| Neue gebündelte/native Plugins                    | Explizite Fähigkeitsregistrierung gegenüber anbieterspezifischen Reach-ins oder neuen hook-only-Designs bevorzugen. |
| Externe Plugins mit Fähigkeitsregistrierung       | Erlaubt, aber fähigkeitsspezifische Helper-Oberflächen als entwickelnd behandeln, sofern die Doku sie nicht als stabil markiert. |

Die Fähigkeitsregistrierung ist die beabsichtigte Richtung. Veraltete Hooks bleiben
während des Übergangs der sicherste No-Breakage-Pfad für externe Plugins. Exportierte
Helper-Subpaths sind nicht alle gleich — bevorzugen Sie schmale dokumentierte Verträge gegenüber
zufälligen Helper-Exporten.

### Plugin-Shapes

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens (nicht nur anhand statischer Metadaten) in eine Shape:

- **plain-capability**: registriert genau einen Fähigkeitstyp (zum Beispiel ein
  reines Provider-Plugin wie `mistral`).
- **hybrid-capability**: registriert mehrere Fähigkeitstypen (zum Beispiel
  verwaltet `openai` Textinferenz, Sprache, Medienverständnis und Bilderzeugung).
- **hook-only**: registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten,
  Tools, Befehle oder Dienste.
- **non-capability**: registriert Tools, Befehle, Dienste oder Routen, aber keine
  Fähigkeiten.

Verwenden Sie `openclaw plugins inspect <id>`, um die Shape und Aufschlüsselung der Fähigkeiten eines Plugins zu sehen. Siehe [CLI-Referenz](/de/cli/plugins#inspect) für Details.

### Veraltete Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für
hook-only-Plugins unterstützt. Veraltete reale Plugins hängen weiterhin davon ab.

Richtung:

- funktionsfähig halten
- als veraltet dokumentieren
- `before_model_resolve` für Arbeit an Modell-/Provider-Overrides bevorzugen
- `before_prompt_build` für Prompt-Mutation bevorzugen
- erst entfernen, wenn die reale Nutzung zurückgeht und Fixture-Abdeckung die Sicherheit der Migration belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eine dieser Bezeichnungen:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, was veraltet ist     |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` werden Ihr Plugin heute kaputt machen:
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Schichten:

1. **Manifest + Discovery**
   OpenClaw findet Kandidaten-Plugins aus konfigurierten Pfaden, Workspace-Roots,
   globalen Plugin-Roots und gebündelten Plugins. Discovery liest zuerst native
   `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein gefundenes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Memory ausgewählt ist.
3. **Laden zur Laufzeit**
   Native OpenClaw-Plugins werden im Prozess über jiti geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Einträge normalisiert, ohne Runtime-Code zu importieren.
4. **Nutzung der Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-
   Setup, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.

Speziell für Plugin-CLI ist die Discovery von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Time-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich erst beim ersten Aufruf registrieren

Dadurch bleibt pluginbezogener CLI-Code im Plugin, während OpenClaw
Root-Befehlsnamen bereits vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Discovery + Konfigurationsvalidierung sollten aus **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- natives Laufzeitverhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls

Diese Trennung ermöglicht es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu erklären und
UI-/Schema-Hinweise zu erstellen, bevor die vollständige Runtime aktiv ist.

### Aktivierungsplanung

Die Aktivierungsplanung ist Teil der Steuerungsebene. Aufrufer können fragen, welche Plugins
für einen konkreten Befehl, Provider, Kanal, eine Route, ein Agent-Harness oder eine
Fähigkeit relevant sind, bevor breitere Runtime-Registries geladen werden.

Der Planner hält das aktuelle Manifest-Verhalten kompatibel:

- `activation.*`-Felder sind explizite Planner-Hinweise
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` und Hooks bleiben als Fallback für Manifest-Zuständigkeit erhalten
- die reine IDs-API des Planners bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Reason-Labels, sodass Diagnosen explizite
  Hinweise von Zuständigkeits-Fallback unterscheiden können

Behandeln Sie `activation` nicht als Lifecycle-Hook oder als Ersatz für
`register(...)`. Es sind Metadaten, die zum Eingrenzen des Ladens verwendet werden. Bevorzugen Sie Zuständigkeitsfelder,
wenn sie die Beziehung bereits beschreiben; verwenden Sie `activation` nur für zusätzliche
Planner-Hinweise.

### Kanal-Plugins und das gemeinsame Message-Tool

Kanal-Plugins müssen für normale Chat-Aktionen kein separates Send/Edit/React-Tool registrieren.
OpenClaw behält ein gemeinsames `message`-Tool im Core, und
Kanal-Plugins verwalten die kanalspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core verwaltet den gemeinsamen Tool-Host `message`, Prompt-Wiring, Sitzungs-/Thread-
  Bookkeeping und Execution-Dispatch
- Kanal-Plugins verwalten scoped Action Discovery, Capability Discovery und alle
  kanalspezifischen Schemafragmente
- Kanal-Plugins verwalten provider-spezifische Konversationsgrammatik für Sitzungen, also
  wie Konversations-IDs Thread-IDs kodieren oder von Parent-Konversationen erben
- Kanal-Plugins führen die finale Aktion über ihren Action-Adapter aus

Für Kanal-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Discovery-
Aufruf erlaubt einem Plugin, sichtbare Aktionen, Fähigkeiten und Schema-
Beiträge zusammen zurückzugeben, sodass diese Teile nicht auseinanderdriften.

Wenn ein kanalspezifischer Parameter des Message-Tools eine Medienquelle wie einen
lokalen Pfad oder eine Remote-Medien-URL trägt, sollte das Plugin außerdem
`mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Core verwendet diese explizite
Liste, um Sandbox-Pfadnormalisierung und Hinweise für ausgehenden Medienzugriff anzuwenden,
ohne pluginbezogene Parameternamen hart zu codieren.
Bevorzugen Sie dort aktionsbezogene Maps, nicht eine kanalweite flache Liste, sodass ein
profilbezogener Medienparameter nicht bei nicht verwandten Aktionen wie `send` normalisiert wird.

Der Core übergibt Runtime-Scope in diesen Discovery-Schritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Kanal kann
Message-Aktionen anhand des aktiven Kontos, des aktuellen Raums/Threads/der aktuellen Nachricht oder der
vertrauenswürdigen Identität des Requesters ein- oder ausblenden, ohne kanalspezifische Zweige im
gemeinsamen Core-Tool `message` hart zu codieren.

Deshalb sind Änderungen am Routing des Embedded-Runners weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität in die Plugin-
Discovery-Grenze weiterzuleiten, sodass das gemeinsame Tool `message` die richtige pluginbezogene
Oberfläche für den aktuellen Turn freilegt.

Für kanalbezogene Execution-Helper sollten gebündelte Plugins die Execution-
Runtime in ihren eigenen Erweiterungsmodulen behalten. Der Core verwaltet die Discord-,
Slack-, Telegram- oder WhatsApp-Message-Action-Runtimes unter `src/agents/tools` nicht mehr.
Wir veröffentlichen keine separaten Subpaths `plugin-sdk/*-action-runtime`, und gebündelte
Plugins sollten ihren eigenen lokalen Runtime-Code direkt aus ihren
erweiterungseigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für providerbenannte SDK-Seams: Der Core sollte
keine kanalspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Core ein Verhalten benötigt, soll er entweder
das eigene Barrel `api.ts` / `runtime-api.ts` des gebündelten Plugins verwenden oder den Bedarf
in eine schmale generische Fähigkeit im gemeinsamen SDK überführen.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Kanäle, die zum allgemeinen
  Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische
  Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verzögert jetzt das gemeinsame Poll-Parsing, bis der pluginbezogene Poll-Dispatch die
Aktion ablehnt, sodass pluginbezogene Poll-Handler kanalspezifische Poll-Felder akzeptieren können,
ohne zuvor vom generischen Poll-Parser blockiert zu werden.

Siehe [Plugin-Architektur-Interna](/de/plugins/architecture-internals) für die vollständige Startsequenz.

## Zuständigkeitsmodell für Fähigkeiten

OpenClaw behandelt ein natives Plugin als Zuständigkeitsgrenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise alle OpenClaw-bezogenen
  Oberflächen dieses Unternehmens verwalten
- ein Feature-Plugin sollte normalerweise die vollständige Feature-Oberfläche verwalten, die es einführt
- Kanäle sollten gemeinsame Core-Fähigkeiten nutzen, statt Provider-Verhalten
  ad hoc neu zu implementieren

<Accordion title="Beispiele für Zuständigkeitsmuster in gebündelten Plugins">
  - **Multi-Capability eines Anbieters**: `openai` verwaltet Textinferenz, Sprache, Realtime-
    Sprache, Medienverständnis und Bilderzeugung. `google` verwaltet Text-
    Inferenz plus Medienverständnis, Bilderzeugung und Websuche.
    `qwen` verwaltet Textinferenz plus Medienverständnis und Videoerzeugung.
  - **Single-Capability eines Anbieters**: `elevenlabs` und `microsoft` verwalten Sprache;
    `firecrawl` verwaltet Web-Fetch; `minimax` / `mistral` / `moonshot` / `zai` verwalten
    Backends für Medienverständnis.
  - **Feature-Plugin**: `voice-call` verwaltet Anruftransport, Tools, CLI, Routen
    und Twilio-Medienstream-Bridging, nutzt aber gemeinsame Fähigkeiten für Sprache, Realtime-
    Transkription und Realtime-Sprache, statt Provider-Plugins direkt zu importieren.
</Accordion>

Der beabsichtigte Endzustand ist:

- OpenAI lebt in einem Plugin, auch wenn es Textmodelle, Sprache, Bilder und
  künftig Video umfasst
- ein anderer Anbieter kann dasselbe für seinen eigenen Oberflächenbereich tun
- Kanäle ist es egal, welches Anbieter-Plugin den Provider verwaltet; sie nutzen den
  gemeinsamen Fähigkeitsvertrag, den der Core bereitstellt

Das ist die zentrale Unterscheidung:

- **plugin** = Zuständigkeitsgrenze
- **capability** = Core-Vertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider sollte die Videoverarbeitung hart codieren?“ Die erste Frage lautet:
„wie sieht der zentrale Video-Fähigkeitsvertrag aus?“ Sobald dieser Vertrag existiert, können Anbieter-Plugins
sich dafür registrieren und Kanal-/Feature-Plugins ihn nutzen.

Wenn die Fähigkeit noch nicht existiert, ist normalerweise der richtige Schritt:

1. die fehlende Fähigkeit im Core definieren
2. sie typisiert über die Plugin-API/Runtime bereitstellen
3. Kanäle/Features gegen diese Fähigkeit verdrahten
4. Anbieter-Plugins Implementierungen registrieren lassen

Dadurch bleiben Zuständigkeiten explizit, während Core-Verhalten vermieden wird, das von einem
einzigen Anbieter oder einem einmaligen pluginspezifischen Codepfad abhängt.

### Schichtung von Fähigkeiten

Verwenden Sie dieses mentale Modell, wenn Sie entscheiden, wohin Code gehört:

- **Core-Capability-Layer**: gemeinsame Orchestrierung, Richtlinien, Fallback,
  Konfigurations-Merge-Regeln, Zustellungssemantik und typisierte Verträge
- **Vendor-Plugin-Layer**: anbieterspezifische APIs, Authentifizierung, Modellkataloge, Sprach-
  Synthese, Bilderzeugung, zukünftige Video-Backends, Nutzungsendpunkte
- **Kanal-/Feature-Plugin-Layer**: Slack-/Discord-/voice-call-/etc.-Integration,
  die Core-Fähigkeiten nutzt und sie an einer Oberfläche bereitstellt

Zum Beispiel folgt TTS diesem Muster:

- der Core verwaltet Antwortzeit-TTS-Richtlinien, Fallback-Reihenfolge, Präferenzen und Kanalzustellung
- `openai`, `elevenlabs` und `microsoft` verwalten die Implementierungen der Synthese
- `voice-call` nutzt den Runtime-Helper für Telephony-TTS

Dasselbe Muster sollte für zukünftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Realtime-Transkription, Realtime-Sprache, Medien-
Verständnis, Bilderzeugung, Videoerzeugung, Web-Fetch und Websuche hat,
kann ein Anbieter all seine Oberflächen an einer Stelle verwalten:

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

Wichtig ist nicht die genaue Benennung der Helper. Wichtig ist die Form:

- ein Plugin verwaltet die Anbieteroberfläche
- der Core verwaltet weiterhin die Fähigkeitsverträge
- Kanäle und Feature-Plugins nutzen `api.runtime.*`-Helper, nicht Anbietercode
- Vertragstests können sicherstellen, dass das Plugin die Fähigkeiten registriert, für die es Zuständigkeit beansprucht

### Beispiel einer Fähigkeit: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame
Fähigkeit. Dasselbe Zuständigkeitsmodell gilt dort:

1. der Core definiert den Vertrag für Medienverständnis
2. Anbieter-Plugins registrieren `describeImage`, `transcribeAudio` und
   `describeVideo`, soweit zutreffend
3. Kanal- und Feature-Plugins nutzen das gemeinsame Core-Verhalten, statt
   direkt Anbieter-Code zu verdrahten

Dadurch wird vermieden, dass Videoannahmen eines einzelnen Providers im Core fest eingebrannt werden. Das Plugin verwaltet
die Anbieteroberfläche; der Core verwaltet den Fähigkeitsvertrag und das Fallback-Verhalten.

Die Videoerzeugung verwendet bereits dieselbe Reihenfolge: Der Core verwaltet den typisierten
Fähigkeitsvertrag und den Runtime-Helper, und Anbieter-Plugins registrieren
Implementierungen von `api.registerVideoGenerationProvider(...)` dagegen.

Benötigen Sie eine konkrete Rollout-Checkliste? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Oberfläche der Plugin-API ist absichtlich typisiert und zentralisiert in
`OpenClawPluginApi`. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Runtime-Helper, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Zuständigkeit ablehnen, etwa wenn zwei Plugins dieselbe
  Provider-ID registrieren
- der Start kann umsetzbare Diagnosen für fehlerhafte Registrierung liefern
- Vertragstests können die Zuständigkeit gebündelter Plugins erzwingen und stilles Driften verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung der Runtime-Registrierung**
   Die Plugin-Registry validiert Registrierungen beim Laden der Plugins. Beispiele:
   doppelte Provider-IDs, doppelte Sprach-Provider-IDs und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden bei Testläufen in Vertrags-Registries erfasst, sodass
   OpenClaw Zuständigkeit explizit prüfen kann. Heute wird dies für Modell-
   Provider, Sprach-Provider, Web-Search-Provider und die Zuständigkeit gebündelter Registrierungen verwendet.

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche
Oberfläche verwaltet. Dadurch können Core und Kanäle nahtlos zusammenspielen, weil Zuständigkeit
deklariert, typisiert und testbar statt implizit ist.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- im Besitz des Cores
- von mehreren Plugins wiederverwendbar
- von Kanälen/Features ohne Anbieterwissen nutzbar

Schlechte Plugin-Verträge sind:

- anbieterspezifische Richtlinien, die im Core versteckt sind
- einmalige Escape-Hatches für Plugins, die die Registry umgehen
- Kanalcode, der direkt in eine Anbieterimplementierung greift
- ad hoc Runtime-Objekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Wenn Sie unsicher sind, erhöhen Sie die Abstraktionsebene: Definieren Sie zuerst die Fähigkeit und lassen Sie dann Plugins sich daran anschließen.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im Prozess** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie
Core-Code.

Implikationen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren
- ein Fehler in einem nativen Plugin kann das Gateway abstürzen lassen oder destabilisieren
- ein bösartiges natives Plugin entspricht willkürlicher Codeausführung innerhalb des
  OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit
als Metadaten-/Content-Pakete behandelt. In aktuellen Releases bedeutet das meist
gebündelte Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie
Workspace-Plugins als Entwicklungszeit-Code, nicht als Produktionsstandard.

Bei gebündelten Workspace-Paketnamen bleibt die Plugin-ID im npm-
Namen verankert: standardmäßig `@openclaw/<id>` oder ein genehmigter typisierter Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

Wichtiger Hinweis zum Vertrauen:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet
  absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/allowlistet ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.
- Vertrauen in gebündelte Plugins wird aus dem Source-Snapshot aufgelöst — dem Manifest und
  dem Code auf dem Datenträger zum Ladezeitpunkt — nicht aus Installationsmetadaten. Ein beschädigter
  oder ersetzter Installationsdatensatz kann die Vertrauensoberfläche eines gebündelten Plugins
  nicht stillschweigend über das hinaus erweitern, was der tatsächliche Quellcode beansprucht.

## Export-Grenze

OpenClaw exportiert Fähigkeiten, keine bequemen Implementierungs-Shortcuts.

Halten Sie die Fähigkeitsregistrierung öffentlich. Beschneiden Sie nicht vertragliche Helper-Exporte:

- gebündelte plugin-spezifische Helper-Subpaths
- Runtime-Plumbing-Subpaths, die nicht als öffentliche API gedacht sind
- anbieterspezifische Convenience-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Einige Helper-Subpaths gebündelter Plugins bleiben aus Kompatibilitäts- und Wartungsgründen für gebündelte Plugins weiterhin in der generierten SDK-Export-Map. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandeln Sie diese als
reservierte Exportdetails der Implementierung, nicht als empfohlenes SDK-Muster für
neue Plugins von Drittanbietern.

## Interna und Referenz

Für die Lade-Pipeline, das Registry-Modell, Provider-Runtime-Hooks, Gateway-HTTP-
Routen, Message-Tool-Schemas, Auflösung von Kanalzielen, Provider-Kataloge,
Context-Engine-Plugins und die Anleitung zum Hinzufügen einer neuen Fähigkeit siehe
[Plugin-Architektur-Interna](/de/plugins/architecture-internals).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugin-Manifest](/de/plugins/manifest)
