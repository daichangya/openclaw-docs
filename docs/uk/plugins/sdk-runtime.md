---
read_when:
    - Вам потрібно викликати допоміжні засоби ядра з Plugin (`TTS`, `STT`, генерація зображень, вебпошук, субагент)
    - Ви хочете зрозуміти, що надає `api.runtime`
    - Ви отримуєте доступ до допоміжних засобів конфігурації, агента або медіа з коду Plugin
sidebarTitle: Runtime Helpers
summary: api.runtime — вбудовані допоміжні засоби середовища виконання, доступні для plugins
title: допоміжні засоби середовища виконання Plugin
x-i18n:
    generated_at: "2026-04-23T22:45:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63069008df16baebbe1ad0189af9002761d3829c4a71bdbf9d753fc51d40741f
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Довідник для об’єкта `api.runtime`, який вбудовується в кожен Plugin під час
реєстрації. Використовуйте ці допоміжні засоби замість прямого імпорту внутрішніх
компонентів хоста.

<Tip>
  **Шукаєте покрокове пояснення?** Перегляньте [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  або [Provider Plugins](/uk/plugins/sdk-provider-plugins) для покрокових посібників,
  які показують ці допоміжні засоби в контексті.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Простори імен середовища виконання

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

// Run an embedded agent turn
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` — це нейтральний допоміжний засіб для запуску звичайного
ходу агента OpenClaw з коду Plugin. Він використовує той самий механізм
визначення provider/model і той самий вибір agent harness, що й відповіді,
запущені каналом.

`runEmbeddedPiAgent(...)` залишається псевдонімом сумісності.

**Допоміжні засоби сховища сесій** містяться в `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Константи типових model і provider:

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
  Перевизначення model (`provider`/`model`) потребує явної згоди оператора через
  `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації.
  Недовірені plugins все одно можуть запускати субагентів, але запити на
  перевизначення відхиляються.
</Warning>

### `api.runtime.taskFlow`

Прив’язує середовище виконання TaskFlow до наявного ключа сесії OpenClaw або
довіреного контексту інструмента, а потім дає змогу створювати TaskFlow і
керувати ними без передавання власника в кожному виклику.

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

Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли у вас уже є
довірений ключ сесії OpenClaw із власного рівня прив’язки. Не виконуйте
прив’язку на основі необробленого введення користувача.

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

Використовує конфігурацію ядра `messages.tts` і вибір provider. Повертає
PCM-буфер аудіо та частоту дискретизації.

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

Повертає `{ text: undefined }`, якщо результат не створено (наприклад, якщо
вхідний файл пропущено).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом сумісності
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

Низькорівневі медіаутиліти.

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

Завантаження та запис конфігурації.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Утиліти системного рівня.

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

Логування.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Визначення автентифікації для model і provider.

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

Допоміжні засоби середовища виконання, специфічні для каналу (доступні, коли
завантажено channel plugin).

`api.runtime.channel.mentions` — це спільна поверхня політики згадок для
вхідних повідомлень у вбудованих channel plugins, які використовують вбудоване
середовище виконання:

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

Доступні допоміжні засоби для згадок:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` навмисно не надає старіші допоміжні засоби
сумісності `resolveMentionGating*`. Надавайте перевагу нормалізованому шляху
`{ facts, policy }`.

## Зберігання посилань на runtime

Використовуйте `createPluginRuntimeStore`, щоб зберегти посилання на runtime
для використання за межами callback-функції `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

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

Надавайте перевагу `pluginId` як ідентифікатору runtime-store. Низькорівнева
форма `key` призначена для нечастих випадків, коли одному plugin навмисно
потрібно більше ніж один слот runtime.

## Інші поля верхнього рівня `api`

Окрім `api.runtime`, об’єкт API також надає:

| Поле                     | Тип                       | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор Plugin                                                                        |
| `api.name`               | `string`                  | Відображувана назва Plugin                                                                  |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок середовища виконання в пам’яті, якщо доступний) |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для Plugin, з `plugins.entries.<id>.config`                        |
| `api.logger`             | `PluginLogger`            | Логер з відповідною областю видимості (`debug`, `info`, `warn`, `error`)                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного запуску entry point |
| `api.resolvePath(input)` | `(string) => string`      | Визначити шлях відносно кореня Plugin                                                       |

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- довідка щодо підшляху
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) -- параметри `definePluginEntry`
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) -- модель можливостей і реєстр
