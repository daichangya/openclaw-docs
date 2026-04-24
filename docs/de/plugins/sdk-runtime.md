---
read_when:
    - Sie müssen aus einem Plugin Core-Helper aufrufen (TTS, STT, Bildgenerierung, Web-Suche, Subagent, Nodes).
    - Sie möchten verstehen, was `api.runtime` bereitstellt.
    - Sie greifen aus Plugin-Code auf Konfigurations-, Agent- oder Medien-Helper zu.
sidebarTitle: Runtime Helpers
summary: '`api.runtime` -- die in Plugins verfügbaren injizierten Runtime-Helper'
title: Plugin-Runtime-Helper
x-i18n:
    generated_at: "2026-04-24T06:51:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Referenz für das Objekt `api.runtime`, das während der Registrierung in jedes Plugin injiziert wird. Verwenden Sie diese Helper, statt Host-Interna direkt zu importieren.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Siehe [Channel Plugins](/de/plugins/sdk-channel-plugins)
  oder [Provider Plugins](/de/plugins/sdk-provider-plugins) für Schritt-für-Schritt-Anleitungen,
  die diese Helper im Kontext zeigen.
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

// Standard-Thinking-Level abrufen
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Agent-Timeout abrufen
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Sicherstellen, dass der Workspace existiert
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Einen eingebetteten Agent-Turn ausführen
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Fasse die neuesten Änderungen zusammen",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` ist der neutrale Helper zum Starten eines normalen OpenClaw-
Agent-Turns aus Plugin-Code. Er verwendet dieselbe Auflösung von Provider/Modell und
dieselbe Auswahl des Agent-Harness wie channel-ausgelöste Antworten.

`runEmbeddedPiAgent(...)` bleibt als Kompatibilitätsalias erhalten.

**Session-Store-Helper** befinden sich unter `api.runtime.agent.session`:

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

Subagent-Läufe im Hintergrund starten und verwalten.

```typescript
// Einen Subagent-Lauf starten
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Erweitere diese Query in fokussierte Suchanfragen zur Weiterverfolgung.",
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
  Modell-Überschreibungen (`provider`/`model`) erfordern Opt-in des Operators über
  `plugins.entries.<id>.subagent.allowModelOverride: true` in der Konfiguration.
  Nicht vertrauenswürdige Plugins können weiterhin Subagenten ausführen, aber Override-Anfragen werden abgelehnt.
</Warning>

### `api.runtime.nodes`

Verbundene Nodes auflisten und aus gateway-geladenem Plugin-Code einen Node-Host-Befehl aufrufen.
Verwenden Sie dies, wenn ein Plugin lokale Arbeit auf einem gepaarten Gerät besitzt, zum Beispiel eine
Browser- oder Audio-Bridge auf einem anderen Mac.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Diese Runtime ist nur innerhalb des Gateway verfügbar. Node-Befehle laufen weiterhin
über normales Pairing von Gateway und Node, Command-Allowlist und node-lokale Command-
Behandlung.

### `api.runtime.taskFlow`

Eine TaskFlow-Runtime an einen bestehenden OpenClaw-Sitzungsschlüssel oder einen vertrauenswürdigen Tool-Kontext binden und dann TaskFlow erstellen und verwalten, ohne bei jedem Aufruf einen Owner zu übergeben.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Neue Pull Requests prüfen",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "PR #123 prüfen",
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

Text-to-Speech-Synthese.

```typescript
// Standard-TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hallo von OpenClaw",
  cfg: api.config,
});

// Für Telefonie optimiertes TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hallo von OpenClaw",
  cfg: api.config,
});

// Verfügbare Stimmen auflisten
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Verwendet Core-Konfiguration `messages.tts` und Provider-Auswahl. Gibt PCM-Audio-
Puffer + Sample-Rate zurück.

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

Gibt `{ text: undefined }` zurück, wenn keine Ausgabe erzeugt wird (z. B. übersprungene Eingabe).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias
  für `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` erhalten.
</Info>

### `api.runtime.imageGeneration`

Bildgenerierung.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Ein Roboter, der einen Sonnenuntergang malt",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Web-Suche.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Low-Level-Medien-Utilities.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
  scale: 6, // 1-12
  marginModules: 4, // 0-16
});
const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
const tmpRoot = resolvePreferredOpenClawTmpDir();
const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
  tmpRoot,
  dirPrefix: "my-plugin-qr-",
  fileName: "qr.png",
});
```

### `api.runtime.config`

Config laden und schreiben.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utilities auf Systemebene.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Event-Subscriptions.

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

Auflösung von Authentifizierung für Modell und Provider.

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

Factories und CLI für Memory-Tools.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Channel-spezifische Runtime-Helper (verfügbar, wenn ein Channel-Plugin geladen ist).

`api.runtime.channel.mentions` ist die gemeinsame Oberfläche für Richtlinien eingehender Erwähnungen für
gebündelte Channel-Plugins, die Runtime-Injection verwenden:

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

Verfügbare Mention-Helper:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` stellt absichtlich die älteren Kompatibilitäts-Helper
`resolveMentionGating*` nicht bereit. Bevorzugen Sie den normalisierten Pfad
`{ facts, policy }`.

## Runtime-Referenzen speichern

Verwenden Sie `createPluginRuntimeStore`, um die Runtime-Referenz zur Verwendung außerhalb
des `register`-Callbacks zu speichern:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// In Ihrem Einstiegspunkt
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Beispiel",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In anderen Dateien
export function getRuntime() {
  return store.getRuntime(); // wirft einen Fehler, wenn nicht initialisiert
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // gibt null zurück, wenn nicht initialisiert
}
```

Bevorzugen Sie `pluginId` für die Identität des Runtime-Store. Die Low-Level-Form `key` ist
für ungewöhnliche Fälle gedacht, in denen ein Plugin absichtlich mehr als einen Runtime-
Slot benötigt.

## Andere Top-Level-Felder in `api`

Zusätzlich zu `api.runtime` stellt das API-Objekt außerdem Folgendes bereit:

| Feld                     | Typ                       | Beschreibung                                                                                 |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                    |
| `api.name`               | `string`                  | Anzeigename des Plugins                                                                      |
| `api.config`             | `OpenClawConfig`          | Aktueller Config-Snapshot (aktiver In-Memory-Runtime-Snapshot, sofern verfügbar)            |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspezifische Konfiguration aus `plugins.entries.<id>.config`                            |
| `api.logger`             | `PluginLogger`            | Gescopter Logger (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Vor-vollständigem-Einstieg Start-/Setup-Fenster |
| `api.resolvePath(input)` | `(string) => string`      | Einen Pfad relativ zum Plugin-Root auflösen                                                  |

## Verwandt

- [SDK Overview](/de/plugins/sdk-overview) -- Referenz der Subpfade
- [SDK Entry Points](/de/plugins/sdk-entrypoints) -- Optionen für `definePluginEntry`
- [Plugin Internals](/de/plugins/architecture) -- Fähigkeitsmodell und Registry
