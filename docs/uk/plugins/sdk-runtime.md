---
read_when:
    - Вам потрібно викликати допоміжні засоби ядра з плагіна (TTS, STT, генерація зображень, вебпошук, субагент)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви звертаєтеся до допоміжних засобів конфігурації, агента або медіа з коду плагіна
sidebarTitle: Runtime Helpers
summary: api.runtime — вбудовані допоміжні засоби runtime, доступні плагінам
title: Plugin Runtime Helpers
x-i18n:
    generated_at: "2026-04-05T18:12:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667edff734fd30f9b05d55eae6360830a45ae8f3012159f88a37b5e05404e666
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Plugin Runtime Helpers

Довідник для об’єкта `api.runtime`, який вбудовується в кожен плагін під час
реєстрації. Використовуйте ці допоміжні засоби замість прямого імпорту внутрішніх компонентів хоста.

<Tip>
  **Шукаєте покроковий приклад?** Див. [Channel Plugins](/plugins/sdk-channel-plugins)
  або [Provider Plugins](/plugins/sdk-provider-plugins), де наведено покрокові посібники,
  які показують ці допоміжні засоби в контексті.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Простори імен runtime

### `api.runtime.agent`

Ідентичність агента, каталоги та керування сесіями.

```typescript
// Resolve the agent's working directory
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolve agent workspace
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Get agent identity
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Get default thinking level
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Get agent timeout
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Ensure workspace exists
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Run an embedded Pi agent
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

**Допоміжні засоби сховища сесій** розміщено в `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Константи моделі та провайдера за замовчуванням:

```typescript
const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
```

### `api.runtime.subagent`

Запуск і керування фоновими запусками субагента.

```typescript
// Start a subagent run
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // optional override
  model: "gpt-4.1-mini", // optional override
  deliver: false,
});

// Wait for completion
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Read session messages
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Delete a session
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Перевизначення моделі (`provider`/`model`) потребують явного дозволу оператора через
  `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації.
  Ненадійні плагіни все одно можуть запускати субагентів, але запити на перевизначення відхиляються.
</Warning>

### `api.runtime.taskFlow`

Прив’яжіть runtime Task Flow до наявного ключа сесії OpenClaw або довіреного
контексту інструмента, а потім створюйте й керуйте Task Flow без передавання власника в кожному виклику.

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

Використовуйте `bindSession({ sessionKey, requesterOrigin })`, якщо у вас уже є
довірений ключ сесії OpenClaw із вашого власного шару прив’язки. Не виконуйте прив’язку на основі сирого
вводу користувача.

### `api.runtime.tts`

Синтез мовлення з тексту.

```typescript
// Standard TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Telephony-optimized TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// List available voices
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Використовує конфігурацію ядра `messages.tts` і вибір провайдера. Повертає PCM-аудіобуфер
+ частоту дискретизації.

### `api.runtime.mediaUnderstanding`

Аналіз зображень, аудіо та відео.

```typescript
// Describe an image
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transcribe audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // optional, for when MIME cannot be inferred
});

// Describe a video
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Generic file analysis
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Повертає `{ text: undefined }`, якщо вивід не створено (наприклад, вхідні дані пропущено).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` залишається сумісним псевдонімом
  для `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Генерація зображень.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Вебпошук.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Низькорівневі утиліти для медіа.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

Завантаження та запис конфігурації.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Системні утиліти.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Підписки на події.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Журналювання.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Визначення автентифікації для моделі та провайдера.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Визначення каталогу стану.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Фабрики інструментів пам’яті та CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Допоміжні засоби runtime, специфічні для каналу (доступні, коли завантажено плагін каналу).

## Зберігання посилань на runtime

Використовуйте `createPluginRuntimeStore`, щоб зберігати посилання на runtime для використання поза
зворотним викликом `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// In your entry point
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In other files
export function getRuntime() {
  return store.getRuntime(); // throws if not initialized
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // returns null if not initialized
}
```

## Інші поля верхнього рівня `api`

Крім `api.runtime`, об’єкт API також надає:

| Поле                    | Тип                       | Опис                                                                                        |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Ідентифікатор плагіна                                                                       |
| `api.name`              | `string`                  | Відображувана назва плагіна                                                                 |
| `api.config`            | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, коли доступний)           |
| `api.pluginConfig`      | `Record<string, unknown>` | Конфігурація плагіна з `plugins.entries.<id>.config`                                        |
| `api.logger`            | `PluginLogger`            | Логер з обмеженою областю (`debug`, `info`, `warn`, `error`)                                |
| `api.registrationMode`  | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного входу |
| `api.resolvePath(input)`| `(string) => string`      | Визначити шлях відносно кореня плагіна                                                      |

## Пов’язане

- [SDK Overview](/plugins/sdk-overview) -- довідник підшляхів
- [SDK Entry Points](/plugins/sdk-entrypoints) -- параметри `definePluginEntry`
- [Plugin Internals](/plugins/architecture) -- модель можливостей і реєстр
