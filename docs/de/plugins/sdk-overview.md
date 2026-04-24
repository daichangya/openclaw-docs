---
read_when:
    - Sie müssen wissen, von welchem SDK-Unterpfad importiert werden soll
    - Sie möchten eine Referenz für alle Registrierungsmethoden in OpenClawPluginApi
    - Sie suchen einen bestimmten SDK-Export
sidebarTitle: SDK overview
summary: Import-Map, Registrierungs-API-Referenz und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-04-24T06:50:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7090e13508382a68988f3d345bf12d6f3822c499e01a3affb1fa7a277b22f276
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und Core. Diese Seite ist die
Referenz dafür, **was Sie importieren** und **was Sie registrieren können**.

<Tip>
  Suchen Sie stattdessen einen How-to-Leitfaden?

- Erstes Plugin? Beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins).
- Channel-Plugin? Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).
- Provider-Plugin? Siehe [Provider-Plugins](/de/plugins/sdk-provider-plugins).
  </Tip>

## Import-Konvention

Importieren Sie immer von einem spezifischen Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, in sich geschlossenes Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für channel-spezifische Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Oberflächenebene und gemeinsame Helfer wie
`buildChannelConfigSchema`.

<Warning>
  Importieren Sie keine provider- oder channelgebrandeten Convenience-Seams (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins kombinieren generische SDK-Unterpfade innerhalb ihrer eigenen lokalen Barrels `api.ts` /
  `runtime-api.ts`; Core-Konsumenten sollten entweder diese plugin-lokalen
  Barrels verwenden oder einen schmalen generischen SDK-Vertrag hinzufügen, wenn ein Bedarf wirklich
  channelübergreifend ist.

Ein kleiner Satz von Helfer-Seams für gebündelte Plugins (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` und ähnliche) erscheint weiterhin in der
generierten Export-Map. Sie existieren nur für die Pflege gebündelter Plugins und sind
keine empfohlenen Importpfade für neue Plugins von Drittanbietern.
</Warning>

## Unterpfad-Referenz

Das Plugin SDK wird als Satz schmaler Unterpfade bereitgestellt, die nach Bereichen gruppiert sind (Plugin-
Entry, Channel, Provider, Auth, Runtime, Capability, Memory und reservierte
Helfer für gebündelte Plugins). Den vollständigen Katalog — gruppiert und verlinkt — finden Sie unter
[Plugin SDK-Unterpfade](/de/plugins/sdk-subpaths).

Die generierte Liste mit mehr als 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registrierungs-API

Der Callback `register(api)` erhält ein Objekt `OpenClawPluginApi` mit diesen
Methoden:

### Registrierung von Capabilities

| Methode                                          | Was sie registriert                    |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Text-Inferenz (LLM)                    |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend           |
| `api.registerChannel(...)`                       | Messaging-Channel                      |
| `api.registerSpeechProvider(...)`                | Text-to-Speech- / STT-Synthese         |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Realtime-Transkription       |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Realtime-Voice-Sitzungen        |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse              |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                        |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                       |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                       |
| `api.registerWebFetchProvider(...)`              | Web-Fetch-/Scrape-Anbieter             |
| `api.registerWebSearchProvider(...)`             | Websuche                               |

### Tools und Befehle

| Methode                         | Was sie registriert                              |
| ------------------------------ | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Agenten-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)      |

### Infrastruktur

| Methode                                         | Was sie registriert                      |
| ----------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Event-Hook                               |
| `api.registerHttpRoute(params)`                 | Gateway-HTTP-Endpunkt                    |
| `api.registerGatewayMethod(name, handler)`      | Gateway-RPC-Methode                      |
| `api.registerCli(registrar, opts?)`             | CLI-Unterbefehl                          |
| `api.registerService(service)`                  | Hintergrunddienst                        |
| `api.registerInteractiveHandler(registration)`  | Interaktiver Handler                     |
| `api.registerEmbeddedExtensionFactory(factory)` | Eingebettete Pi-Embedded-Runner-Extension-Factory |
| `api.registerMemoryPromptSupplement(builder)`   | Additiver promptnaher Abschnitt für Memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Additives Memory-Korpus für Suche/Abruf  |

<Note>
  Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einer
  Gateway-Methode einen engeren Scope zuzuweisen. Bevorzugen Sie plugin-spezifische Präfixe für
  plugin-eigene Methoden.
</Note>

<Accordion title="Wann registerEmbeddedExtensionFactory verwendet werden sollte">
  Verwenden Sie `api.registerEmbeddedExtensionFactory(...)`, wenn ein Plugin Pi-native
  Event-Timings während eingebetteter OpenClaw-Läufe benötigt — zum Beispiel asynchrone Umschreibungen von `tool_result`,
  die stattfinden müssen, bevor die endgültige Tool-Ergebnisnachricht ausgegeben wird.

Dies ist heute ein Seam für gebündelte Plugins: Nur gebündelte Plugins dürfen einen registrieren,
und sie müssen `contracts.embeddedExtensionFactories: ["pi"]` in
`openclaw.plugin.json` deklarieren. Behalten Sie normale OpenClaw-Plugin-Hooks für alles bei,
was diesen niedrigeren Seam nicht benötigt.
</Accordion>

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehls-Roots, die dem Registrar gehören
- `descriptors`: Parse-Time-Befehlsdeskriptoren, die für Root-CLI-Hilfe,
  Routing und Lazy-Registrierung von Plugin-CLI verwendet werden

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleiben soll,
geben Sie `descriptors` an, die jeden Befehls-Root auf oberster Ebene abdecken, der durch diesen
Registrar bereitgestellt wird.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur dann, wenn Sie keine Lazy-Root-CLI-Registrierung benötigen.
Dieser eager-Kompatibilitätspfad wird weiterhin unterstützt, installiert aber
keine durch Deskriptoren gestützten Platzhalter für parsezeitiges Lazy Loading.

### Registrierung von CLI-Backends

`api.registerCliBackend(...)` erlaubt es einem Plugin, die Standardkonfiguration für ein lokales
AI-CLI-Backend wie `codex-cli` zu verwalten.

- Die Backend-`id` wird zum Anbieterpräfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt `agents.defaults.cliBackends.<id>` über dem
  Plugin-Standard zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Merge Kompatibilitäts-Umschreibungen benötigt
  (zum Beispiel Normalisierung alter Flag-Formen).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils nur eine aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Memory-Capability                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitt                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Plan                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Adapter für Memory-Runtime                                                                                                                                    |

### Memory-Embedding-Adapter

| Methode                                        | Was sie registriert                              |
| --------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin    |

- `registerMemoryCapability` ist die bevorzugte exklusive Memory-Plugin-API.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)` bereitstellen,
  sodass Companion-Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` konsumieren können, statt in das private Layout
  eines bestimmten Memory-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind exklusive Memory-Plugin-APIs für Legacy-Kompatibilität.
- `registerMemoryEmbeddingProvider` erlaubt es dem aktiven Memory-Plugin, einen
  oder mehrere Adapter-IDs für Embeddings zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte
  plugin-definierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie tut                   |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook    |
| `api.onConversationBindingResolved(handler)` | Callback für Konversationsbindung |

### Semantik von Hook-Entscheidungen

- `before_tool_call`: Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Rückgabe von `{ handled: true, ... }` ist terminal. Sobald ein Handler die Zustellung beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für die Modellzustellung übersprungen.
- `message_sending`: Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Topic-Routing benötigen. Behalten Sie `metadata` für channel-spezifische Extras.
- `message_sending`: Verwenden Sie typisierte Routing-Felder `replyToId` / `threadId`, bevor Sie auf channel-spezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für gateway-eigenen Startzustand, statt sich auf interne Hooks `gateway:startup` zu verlassen.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Quellpfad des Plugins                                                                       |
| `api.rootDir`            | `string?`                 | Root-Verzeichnis des Plugins (optional)                                                     |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurationssnapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar)      |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helfer](/de/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger mit Scope (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Fenster für Start/Setup vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                       |

## Konvention für interne Module

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Konsumenten
  runtime-api.ts    # Nur intern verwendete Runtime-Exporte
  index.ts          # Entry-Point des Plugins
  setup-entry.ts    # Leichter Setup-only-Entry (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin im Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Öffentliche Oberflächen von gebündelten Plugins, die über Facades geladen werden (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien), bevorzugen den
aktiven Runtime-Konfigurationssnapshot, wenn OpenClaw bereits läuft. Falls noch kein Runtime-
Snapshot existiert, greifen sie auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können ein schmales plugin-lokales Contract-Barrel bereitstellen, wenn eine
Helferfunktion absichtlich anbieterspezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Beispiele für gebündelte Plugins:

- **Anthropic**: öffentliches Seam `api.ts` / `contract-api.ts` für Claude-
  Beta-Header und Stream-Helfer für `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Helfer für Standardmodelle und Realtime-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  plus Helfer für Onboarding/Konfiguration.

<Warning>
  Produktionscode von Erweiterungen sollte auch Importe über `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn eine Helferfunktion wirklich gemeinsam genutzt wird, heben Sie sie in einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  auf Capabilities ausgerichtete Oberfläche an, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz für den Namespace `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/de/plugins/sdk-setup">
    Packaging, Manifeste und Konfigurationsschemas.
  </Card>
  <Card title="Testing" icon="vial" href="/de/plugins/sdk-testing">
    Test-Utilities und Lint-Regeln.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/de/plugins/architecture">
    Tiefe Architektur und Capability-Modell.
  </Card>
</CardGroup>
