---
read_when:
    - Sie müssen Kernhilfen aus einem Plugin aufrufen (TTS, STT, Bilderzeugung, Websuche, Subagent)
    - Sie möchten verstehen, was `api.runtime` bereitstellt
    - Sie greifen aus Plugin-Code auf Konfigurations-, Agent- oder Medienhilfen zu
sidebarTitle: Runtime Helpers
summary: api.runtime -- die injizierten Runtime-Hilfen, die Plugins zur Verfügung stehen
title: Plugin-Runtime-Hilfen
x-i18n:
    generated_at: "2026-04-05T12:51:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667edff734fd30f9b05d55eae6360830a45ae8f3012159f88a37b5e05404e666
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Plugin-Runtime-Hilfen

Referenz für das `api.runtime`-Objekt, das während der Registrierung in jedes Plugin
injiziert wird. Verwenden Sie diese Hilfen, statt Host-Interna direkt zu importieren.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Unter [Channel Plugins](/plugins/sdk-channel-plugins)
  oder [Provider Plugins](/plugins/sdk-provider-plugins) finden Sie Anleitungen mit einzelnen Schritten,
  die diese Hilfen im Kontext zeigen.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Runtime-Namespaces

### `api.runtime.agent`

Agent-Identität, Verzeichnisse und Sitzungsverwaltung.

```typescript
// Arbeitsverzeichnis des Agenten auflösen
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Agent-Workspace auflösen
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Agent-Identität abrufen
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Standard-Denkstufe abrufen
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Agent-Timeout abrufen
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Sicherstellen, dass der Workspace existiert
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Einen eingebetteten Pi-Agenten ausführen
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

**Hilfen für den Sitzungsspeicher** finden Sie unter `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Standardkonstanten für Modell und Provider:

```typescript
const model = api.runtime.agent.defaults.model; // z. B. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // z. B. "anthropic"
```

### `api.runtime.subagent`

Ausführen und Verwalten von Subagent-Läufen im Hintergrund.

```typescript
// Einen Subagent-Lauf starten
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // optionale Überschreibung
  model: "gpt-4.1-mini", // optionale Überschreibung
  deliver: false,
});

// Auf Abschluss warten
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Sitzungsnachrichten lesen
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Eine Sitzung löschen
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Modellüberschreibungen (`provider`/`model`) erfordern eine ausdrückliche Freigabe
  durch den Operator über `plugins.entries.<id>.subagent.allowModelOverride: true` in der
  Konfiguration. Nicht vertrauenswürdige Plugins können weiterhin Subagents ausführen, aber
  Überschreibungsanfragen werden abgelehnt.
</Warning>

### `api.runtime.taskFlow`

Binden Sie eine Task Flow-Runtime an einen vorhandenen OpenClaw-Sitzungsschlüssel oder einen vertrauenswürdigen Tool-
Kontext und erstellen und verwalten Sie dann Task Flows, ohne bei jedem Aufruf einen Eigentümer anzugeben.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Review new pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Review PR #123",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

Verwenden Sie `bindSession({ sessionKey, requesterOrigin })`, wenn Sie bereits einen
vertrauenswürdigen OpenClaw-Sitzungsschlüssel aus Ihrer eigenen Bindungsschicht haben. Binden Sie nicht anhand roher
Benutzereingaben.

### `api.runtime.tts`

Text-zu-Sprache-Synthese.

```typescript
// Standard-TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Für Telefonie optimiertes TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Verfügbare Stimmen auflisten
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Verwendet die Kernkonfiguration `messages.tts` und die Provider-Auswahl. Gibt einen PCM-Audio-
Puffer plus Sample-Rate zurück.

### `api.runtime.mediaUnderstanding`

Bild-, Audio- und Videoanalyse.

```typescript
// Ein Bild beschreiben
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Audio transkribieren
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // optional, wenn MIME nicht abgeleitet werden kann
});

// Ein Video beschreiben
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Generische Dateianalyse
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Gibt `{ text: undefined }` zurück, wenn keine Ausgabe erzeugt wird (z. B. bei übersprungener Eingabe).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias
  für `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` erhalten.
</Info>

### `api.runtime.imageGeneration`

Bilderzeugung.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Websuche.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Low-Level-Medienhilfen.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

Konfiguration laden und schreiben.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Hilfsfunktionen auf Systemebene.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Ereignisabonnements.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Logging.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Auflösung von Modell- und Provider-Authentifizierung.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Auflösung des Statusverzeichnisses.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Memory-Tool-Factories und CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Kanalspezifische Runtime-Hilfen (verfügbar, wenn ein Channel-Plugin geladen ist).

## Runtime-Referenzen speichern

Verwenden Sie `createPluginRuntimeStore`, um die Runtime-Referenz für die Verwendung außerhalb
des `register`-Callbacks zu speichern:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// In Ihrem Einstiegspunkt
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In anderen Dateien
export function getRuntime() {
  return store.getRuntime(); // löst eine Ausnahme aus, wenn nicht initialisiert
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // gibt null zurück, wenn nicht initialisiert
}
```

## Weitere `api`-Felder auf oberster Ebene

Zusätzlich zu `api.runtime` bietet das API-Objekt auch Folgendes:

| Feld                     | Typ                       | Beschreibung                                                                              |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                 |
| `api.name`               | `string`                  | Anzeigename des Plugins                                                                   |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar)   |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspezifische Konfiguration aus `plugins.entries.<id>.config`                         |
| `api.logger`             | `PluginLogger`            | Bereichsspezifischer Logger (`debug`, `info`, `warn`, `error`)                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Start-/Setup-Fenster vor dem vollständigen Einstiegspunkt |
| `api.resolvePath(input)` | `(string) => string`      | Einen Pfad relativ zur Plugin-Wurzel auflösen                                             |

## Verwandt

- [SDK-Überblick](/plugins/sdk-overview) -- Subpfad-Referenz
- [SDK-Einstiegspunkte](/plugins/sdk-entrypoints) -- Optionen für `definePluginEntry`
- [Plugin-Interna](/plugins/architecture) -- Funktionsmodell und Registry
