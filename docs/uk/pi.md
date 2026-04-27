---
read_when:
    - Розуміння дизайну інтеграції SDK Pi в OpenClaw
    - Зміна життєвого циклу сесії агента, інструментів або підключення провайдера для Pi
summary: Архітектура інтеграції вбудованого агента Pi в OpenClaw і життєвий цикл сесії
title: Архітектура інтеграції Pi
x-i18n:
    generated_at: "2026-04-27T06:55:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 15
---

OpenClaw інтегрується з [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) і його суміжними пакетами (`pi-ai`, `pi-agent-core`, `pi-tui`), щоб забезпечувати можливості свого ШІ-агента.

## Огляд

OpenClaw використовує SDK pi, щоб вбудувати ШІ-агента для програмування у свою архітектуру шлюзу повідомлень. Замість запуску pi як підпроцесу або використання режиму RPC, OpenClaw напряму імпортує та створює `AgentSession` через `createAgentSession()`. Цей вбудований підхід надає:

- Повний контроль над життєвим циклом сесії та обробкою подій
- Ін'єкцію користувацьких інструментів (обмін повідомленнями, пісочниця, дії для конкретного каналу)
- Налаштування системного prompt для кожного каналу/контексту
- Збереження сесій із підтримкою розгалуження/Compaction
- Ротацію профілів автентифікації для кількох облікових записів із перемиканням при збої
- Незалежне від провайдера перемикання моделей

## Залежності пакетів

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Пакет            | Призначення                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `pi-ai`          | Базові абстракції LLM: `Model`, `streamSimple`, типи повідомлень, API провайдерів                   |
| `pi-agent-core`  | Цикл агента, виконання інструментів, типи `AgentMessage`                                             |
| `pi-coding-agent` | Високорівневий SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, вбудовані інструменти |
| `pi-tui`         | Компоненти термінального інтерфейсу (використовуються в локальному режимі TUI OpenClaw)             |

## Структура файлів

```
src/agents/
├── pi-embedded-runner.ts          # Повторно експортує з pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Основна точка входу: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Логіка однієї спроби з налаштуванням сесії
│   │   ├── params.ts              # Тип RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Побудова payload відповідей із результатів запуску
│   │   ├── images.ts              # Ін'єкція зображень для vision-моделі
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Виявлення помилок переривання
│   ├── cache-ttl.ts               # Відстеження TTL кешу для обрізання контексту
│   ├── compact.ts                 # Логіка ручного/автоматичного Compaction
│   ├── extensions.ts              # Завантаження розширень pi для вбудованих запусків
│   ├── extra-params.ts            # Додаткові параметри потоку для конкретних провайдерів
│   ├── google.ts                  # Виправлення порядку ходів для Google/Gemini
│   ├── history.ts                 # Обмеження історії (DM проти груп)
│   ├── lanes.ts                   # Смуги команд сесії/глобальних команд
│   ├── logger.ts                  # Логер підсистеми
│   ├── model.ts                   # Визначення моделі через ModelRegistry
│   ├── runs.ts                    # Відстеження активних запусків, переривання, черга
│   ├── sandbox-info.ts            # Інформація про пісочницю для системного prompt
│   ├── session-manager-cache.ts   # Кешування екземплярів SessionManager
│   ├── session-manager-init.ts    # Ініціалізація файлу сесії
│   ├── system-prompt.ts           # Конструктор системного prompt
│   ├── tool-split.ts              # Поділ інструментів на builtIn і custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Відображення ThinkLevel, опис помилок
├── pi-embedded-subscribe.ts       # Підписка/диспетчеризація подій сесії
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Фабрика обробників подій
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Розбиття потокових блокових відповідей на частини
├── pi-embedded-messaging.ts       # Відстеження надісланих повідомлень інструментом обміну повідомленнями
├── pi-embedded-helpers.ts         # Класифікація помилок, валідація ходу
├── pi-embedded-helpers/           # Допоміжні модулі
├── pi-embedded-utils.ts           # Утиліти форматування
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Обгортання AbortSignal для інструментів
├── pi-tools.policy.ts             # Політика allowlist/denylist для інструментів
├── pi-tools.read.ts               # Кастомізації інструмента читання
├── pi-tools.schema.ts             # Нормалізація схем інструментів
├── pi-tools.types.ts              # Псевдонім типу AnyAgentTool
├── pi-tool-definition-adapter.ts  # Адаптер AgentTool -> ToolDefinition
├── pi-settings.ts                 # Перевизначення налаштувань
├── pi-hooks/                      # Користувацькі hooks pi
│   ├── compaction-safeguard.ts    # Захисне розширення
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Розширення обрізання контексту за Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Визначення профілю автентифікації
├── auth-profiles.ts               # Сховище профілів, cooldown, failover
├── model-selection.ts             # Визначення моделі за замовчуванням
├── models-config.ts               # Генерація models.json
├── model-catalog.ts               # Кеш каталогу моделей
├── context-window-guard.ts        # Валідація вікна контексту
├── failover-error.ts              # Клас FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Визначення параметрів системного prompt
├── system-prompt-report.ts        # Генерація звіту для налагодження
├── tool-summaries.ts              # Підсумки описів інструментів
├── tool-policy.ts                 # Визначення політики інструментів
├── transcript-policy.ts           # Політика валідації транскрипту
├── skills.ts                      # Знімок Skills/побудова prompt
├── skills/                        # Підсистема Skills
├── sandbox.ts                     # Визначення контексту пісочниці
├── sandbox/                       # Підсистема пісочниці
├── channel-tools.ts               # Ін'єкція інструментів для конкретного каналу
├── openclaw-tools.ts              # Специфічні для OpenClaw інструменти
├── bash-tools.ts                  # Інструменти exec/process
├── apply-patch.ts                 # Інструмент apply_patch (OpenAI)
├── tools/                         # Окремі реалізації інструментів
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Середовища виконання дій із повідомленнями для конкретних каналів тепер розміщені у директоріях розширень, якими володіють відповідні Plugin, а не в `src/agents/tools`, наприклад:

- файли середовища виконання дій Plugin Discord
- файл середовища виконання дій Plugin Slack
- файл середовища виконання дій Plugin Telegram
- файл середовища виконання дій Plugin WhatsApp

## Основний потік інтеграції

### 1. Запуск вбудованого агента

Основна точка входу — `runEmbeddedPiAgent()` у `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Створення сесії

Усередині `runEmbeddedAttempt()` (яку викликає `runEmbeddedPiAgent()`) використовується SDK pi:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Підписка на події

`subscribeEmbeddedPiSession()` підписується на події `AgentSession` у pi:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Обробляються такі події:

- `message_start` / `message_end` / `message_update` (потоковий текст/мислення)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Надсилання prompt

Після налаштування сесію отримує prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK обробляє весь цикл агента: надсилання в LLM, виконання викликів інструментів, потокову передачу відповідей.

Ін'єкція зображень є локальною для prompt: OpenClaw завантажує посилання на зображення з поточного prompt і передає їх через `images` лише для цього ходу. Він не сканує повторно старі ходи історії, щоб повторно ін'єктувати payload зображень.

## Архітектура інструментів

### Конвеєр інструментів

1. **Базові інструменти**: `codingTools` із pi (`read`, `bash`, `edit`, `write`)
2. **Користувацькі заміни**: OpenClaw замінює bash на `exec`/`process`, кастомізує read/edit/write для пісочниці
3. **Інструменти OpenClaw**: обмін повідомленнями, браузер, canvas, сесії, Cron, Gateway тощо
4. **Інструменти каналу**: інструменти дій для Discord/Telegram/Slack/WhatsApp
5. **Фільтрація політик**: інструменти фільтруються за політиками профілю, провайдера, агента, групи та пісочниці
6. **Нормалізація схем**: схеми очищуються від особливостей Gemini/OpenAI
7. **Обгортання AbortSignal**: інструменти обгортаються для врахування сигналів переривання

### Адаптер визначення інструмента

`AgentTool` із pi-agent-core має іншу сигнатуру `execute`, ніж `ToolDefinition` із pi-coding-agent. Адаптер у `pi-tool-definition-adapter.ts` забезпечує міст між ними:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Стратегія поділу інструментів

`splitSdkTools()` передає всі інструменти через `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Це гарантує, що фільтрація політик OpenClaw, інтеграція пісочниці та розширений набір інструментів залишаються узгодженими між провайдерами.

## Побудова системного prompt

Системний prompt будується в `buildAgentSystemPrompt()` (`system-prompt.ts`). Він формує повний prompt із секціями, зокрема Tooling, Tool Call Style, захисні обмеження безпеки, довідка CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, метадані середовища виконання, а також Memory і Reactions, якщо вони ввімкнені, і додатково — необов'язкові файли контексту та додатковий вміст системного prompt. Секції обрізаються для мінімального режиму prompt, який використовується субагентами.

Prompt застосовується після створення сесії через `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Керування сесіями

### Файли сесій

Сесії — це файли JSONL із деревоподібною структурою (зв'язування через id/parentId). `SessionManager` із Pi відповідає за збереження:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw обгортає це в `guardSessionManager()` для безпеки результатів інструментів.

### Кешування сесій

`session-manager-cache.ts` кешує екземпляри SessionManager, щоб уникнути повторного розбору файлів:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Обмеження історії

`limitHistoryTurns()` обрізає історію розмови залежно від типу каналу (DM чи група).

### Compaction

Автоматичний Compaction запускається при переповненні контексту. Поширені сигнатури переповнення включають
`request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` і `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` обробляє ручний
Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Автентифікація та визначення моделі

### Профілі автентифікації

OpenClaw підтримує сховище профілів автентифікації з кількома API-ключами для кожного провайдера:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Профілі ротуються при збоях із відстеженням cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Визначення моделі

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` ініціює резервне перемикання моделі, якщо це налаштовано:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Розширення Pi

OpenClaw завантажує користувацькі розширення Pi для спеціалізованої поведінки:

### Захист Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` додає захисні обмеження до Compaction, зокрема адаптивне бюджетування токенів, а також підсумки збоїв інструментів і файлових операцій:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Обрізання контексту

`src/agents/pi-hooks/context-pruning.ts` реалізує обрізання контексту на основі Cache-TTL:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Потокова передача та блокові відповіді

### Розбиття на блоки

`EmbeddedBlockChunker` керує потоковим текстом, перетворюючи його на окремі блоки відповіді:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Видалення тегів Thinking/Final

Потоковий вивід обробляється так, щоб видаляти блоки `<think>`/`<thinking>` і витягувати вміст `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Директиви відповіді

Директиви відповіді, такі як `[[media:url]]`, `[[voice]]`, `[[reply:id]]`, аналізуються та витягуються:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Обробка помилок

### Класифікація помилок

`pi-embedded-helpers.ts` класифікує помилки для відповідної обробки:

```typescript
isContextOverflowError(errorText)     // Контекст занадто великий
isCompactionFailureError(errorText)   // Збій Compaction
isAuthAssistantError(lastAssistant)   // Збій автентифікації
isRateLimitAssistantError(...)        // Досягнуто ліміт швидкості
isFailoverAssistantError(...)         // Слід виконати failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Резервний рівень thinking

Якщо рівень thinking не підтримується, використовується резервний варіант:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Інтеграція пісочниці

Коли режим пісочниці увімкнено, інструменти й шляхи обмежуються:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## Обробка для конкретних провайдерів

### Anthropic

- Очищення магічного рядка відмови
- Валідація ходу для послідовних ролей
- Сувора валідація параметрів інструментів Pi на стороні upstream

### Google/Gemini

- Очищення схеми інструментів, якою володіє Plugin

### OpenAI

- Інструмент `apply_patch` для моделей Codex
- Обробка пониження рівня thinking

## Інтеграція TUI

OpenClaw також має локальний режим TUI, який напряму використовує компоненти pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Це забезпечує інтерактивний термінальний досвід, подібний до нативного режиму pi.

## Ключові відмінності від Pi CLI

| Аспект          | Pi CLI                  | Вбудований OpenClaw                                                                            |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Виклик          | команда `pi` / RPC      | SDK через `createAgentSession()`                                                               |
| Інструменти     | Стандартні інструменти для програмування | Користувацький набір інструментів OpenClaw                                         |
| Системний prompt | AGENTS.md + prompts     | Динамічний для кожного каналу/контексту                                                        |
| Зберігання сесій | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (або `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Автентифікація  | Єдині облікові дані     | Кілька профілів із ротацією                                                                    |
| Розширення      | Завантажуються з диска  | Програмно + шляхи на диску                                                                     |
| Обробка подій   | Рендеринг TUI           | На основі зворотних викликів (onBlockReply тощо)                                               |

## Майбутні міркування

Області для потенційного перегляду:

1. **Вирівнювання сигнатур інструментів**: наразі використовується адаптація між сигнатурами pi-agent-core і pi-coding-agent
2. **Обгортання менеджера сесій**: `guardSessionManager` додає безпеку, але підвищує складність
3. **Завантаження розширень**: можна було б використовувати `ResourceLoader` із pi більш безпосередньо
4. **Складність обробника потоків**: `subscribeEmbeddedPiSession` значно розрісся
5. **Особливості провайдерів**: багато кодових шляхів для конкретних провайдерів, які потенційно міг би обробляти сам pi

## Тести

Покриття інтеграції Pi охоплює такі набори тестів:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

Живі/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (увімкніть `OPENCLAW_LIVE_TEST=1`)

Актуальні команди запуску див. у [Pi Development Workflow](/uk/pi-dev).

## Пов'язане

- [Pi development workflow](/uk/pi-dev)
- [Огляд встановлення](/uk/install)
