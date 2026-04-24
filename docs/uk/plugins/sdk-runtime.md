---
read_when:
    - Вам потрібно викликати основні допоміжні засоби з plugin-а (`TTS`, `STT`, генерацію зображень, вебпошук, субагента, nodes)
    - Ви хочете зрозуміти, що надає `api.runtime`
    - Ви звертаєтеся до допоміжних засобів конфігурації, агента або медіа з коду plugin-а
sidebarTitle: Runtime Helpers
summary: api.runtime — вбудовані допоміжні засоби середовища виконання, доступні для plugin-ів
title: Допоміжні засоби середовища виконання Plugin
x-i18n:
    generated_at: "2026-04-24T04:35:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Довідник щодо об’єкта `api.runtime`, який вбудовується в кожен plugin під час
реєстрації. Використовуйте ці допоміжні засоби замість прямого імпорту внутрішніх
компонентів хоста.

<Tip>
  **Шукаєте покрокове пояснення?** Дивіться [Channel Plugins](/uk/plugins/sdk-channel-plugins)
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
// Визначити робочий каталог агента
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Визначити робочий простір агента
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Отримати ідентичність агента
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Отримати типовий рівень мислення
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Отримати тайм-аут агента
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Переконатися, що робочий простір існує
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Запустити вбудований хід агента
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

`runEmbeddedAgent(...)` — це нейтральний допоміжний засіб для запуску звичайного ходу
агента OpenClaw із коду plugin-а. Він використовує той самий механізм визначення
provider/model і той самий вибір agent-harness, що й відповіді, запущені каналом.

`runEmbeddedPiAgent(...)` залишається псевдонімом для сумісності.

**Допоміжні засоби сховища сесій** розташовані в `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Сталі типових model і provider:

```typescript
const model = api.runtime.agent.defaults.model; // наприклад, "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // наприклад, "anthropic"
```

### `api.runtime.subagent`

Запуск і керування фоновими запусками субагентів.

```typescript
// Запустити субагента
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // необов’язкове перевизначення
  model: "gpt-4.1-mini", // необов’язкове перевизначення
  deliver: false,
});

// Дочекатися завершення
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Прочитати повідомлення сесії
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Видалити сесію
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Перевизначення model (`provider`/`model`) потребують явного дозволу оператора через
  `plugins.entries.<id>.subagent.allowModelOverride: true` у config.
  Ненадійні plugin-и все ще можуть запускати субагентів, але запити на перевизначення відхиляються.
</Warning>

### `api.runtime.nodes`

Перелік підключених nodes і виклик команди хоста node з коду plugin-а,
завантаженого через Gateway. Використовуйте це, коли plugin відповідає за локальну роботу
на спареному пристрої, наприклад за браузер або аудіоміст на іншому Mac.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Це середовище виконання доступне лише всередині Gateway. Команди node, як і раніше,
проходять через звичайне спарювання Gateway node, списки дозволених команд і локальну
обробку команд на node.

### `api.runtime.taskFlow`

Прив’язати середовище виконання TaskFlow до наявного ключа сесії OpenClaw або
довіреного контексту інструмента, а потім створювати й керувати TaskFlow без
передавання власника в кожному виклику.

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
довірений ключ сесії OpenClaw із вашого власного шару прив’язки. Не виконуйте
прив’язку на основі сирого користувацького вводу.

### `api.runtime.tts`

Синтез мовлення з тексту.

```typescript
// Стандартний TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// TTS, оптимізований для телефонії
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Перелічити доступні голоси
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Використовує основну конфігурацію `messages.tts` і вибір provider. Повертає буфер
PCM-аудіо + частоту дискретизації.

### `api.runtime.mediaUnderstanding`

Аналіз зображень, аудіо та відео.

```typescript
// Описати зображення
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Транскрибувати аудіо
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // необов’язково, якщо MIME неможливо визначити
});

// Описати відео
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Загальний аналіз файлу
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Повертає `{ text: undefined }`, коли вихідні дані не створено (наприклад, якщо вхід пропущено).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом для сумісності
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

Низькорівневі допоміжні засоби для медіа.

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

Завантаження й запис config.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Системні допоміжні засоби.

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

Визначення автентифікації model і provider.

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

Допоміжні засоби середовища виконання, специфічні для каналу (доступні, коли завантажено channel plugin).

`api.runtime.channel.mentions` — це спільна поверхня політики вхідних згадок для
вбудованих channel plugin-ів, які використовують вбудоване середовище виконання:

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

`api.runtime.channel.mentions` навмисно не надає старіші допоміжні засоби сумісності
`resolveMentionGating*`. Надавайте перевагу нормалізованому шляху
`{ facts, policy }`.

## Зберігання посилань на середовище виконання

Використовуйте `createPluginRuntimeStore`, щоб зберегти посилання на середовище виконання
для використання поза зворотним викликом `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// У вашій точці входу
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// В інших файлах
export function getRuntime() {
  return store.getRuntime(); // викидає помилку, якщо не ініціалізовано
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // повертає null, якщо не ініціалізовано
}
```

Надавайте перевагу `pluginId` для ідентичності runtime-store. Низькорівнева форма `key`
призначена для нетипових випадків, коли одному plugin-у навмисно потрібно більше
одного слота середовища виконання.

## Інші поля верхнього рівня `api`

Окрім `api.runtime`, об’єкт API також надає:

| Поле                     | Тип                       | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор Plugin                                                                        |
| `api.name`               | `string`                  | Відображувана назва Plugin                                                                  |
| `api.config`             | `OpenClawConfig`          | Поточний знімок config (активний знімок середовища виконання в пам’яті, коли доступний)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для Plugin, із `plugins.entries.<id>.config`                       |
| `api.logger`             | `PluginLogger`            | Logger з відповідною областю видимості (`debug`, `info`, `warn`, `error`)                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легковагове вікно запуску/налаштування до повного входу |
| `api.resolvePath(input)` | `(string) => string`      | Визначити шлях відносно кореня plugin-а                                                     |

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview) -- довідка щодо підшляху
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) -- параметри `definePluginEntry`
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) -- модель можливостей і реєстр
