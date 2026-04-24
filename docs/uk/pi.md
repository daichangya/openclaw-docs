---
read_when:
    - Розуміння дизайну інтеграції SDK Pi в OpenClaw
    - Зміна життєвого циклу сесії агента, інструментів або підключення провайдера для Pi
summary: Архітектура вбудованої інтеграції агента Pi в OpenClaw і життєвий цикл сесії
title: Архітектура інтеграції Pi
x-i18n:
    generated_at: "2026-04-24T15:13:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

Цей документ описує, як OpenClaw інтегрується з [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) і пов’язаними з ним пакетами (`pi-ai`, `pi-agent-core`, `pi-tui`) для забезпечення можливостей свого AI-агента.

## Огляд

OpenClaw використовує pi SDK для вбудовування AI-агента для кодування у свою архітектуру шлюзу повідомлень. Замість запуску pi як підпроцесу або використання режиму RPC, OpenClaw безпосередньо імпортує та створює `AgentSession` через `createAgentSession()`. Цей вбудований підхід забезпечує:

- Повний контроль над життєвим циклом сесії та обробкою подій
- Користувацьке впровадження інструментів (повідомлення, sandbox, дії для конкретного каналу)
- Налаштування системного промпту для кожного каналу/контексту
- Збереження сесії з підтримкою розгалуження/Compaction
- Ротацію профілів автентифікації для кількох облікових записів із failover
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

| Пакет            | Призначення                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`          | Базові абстракції LLM: `Model`, `streamSimple`, типи повідомлень, API провайдерів                    |
| `pi-agent-core`  | Цикл агента, виконання інструментів, типи `AgentMessage`                                              |
| `pi-coding-agent` | Високорівневий SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, вбудовані інструменти |
| `pi-tui`         | Компоненти термінального UI (використовуються в локальному режимі TUI OpenClaw)                      |

## Структура файлів

```
src/agents/
├── pi-embedded-runner.ts          # Реекспорти з pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Головна точка входу: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Логіка однієї спроби з налаштуванням сесії
│   │   ├── params.ts              # Тип RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Побудова payload відповіді з результатів запуску
│   │   ├── images.ts              # Впровадження зображень для vision-моделі
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Виявлення помилок переривання
│   ├── cache-ttl.ts               # Відстеження TTL кешу для обрізання контексту
│   ├── compact.ts                 # Логіка ручного/автоматичного Compaction
│   ├── extensions.ts              # Завантаження розширень pi для вбудованих запусків
│   ├── extra-params.ts            # Специфічні для провайдера параметри потоку
│   ├── google.ts                  # Виправлення порядку ходів для Google/Gemini
│   ├── history.ts                 # Обмеження історії (DM проти групи)
│   ├── lanes.ts                   # Лінії команд сесії/глобальні
│   ├── logger.ts                  # Логер підсистеми
│   ├── model.ts                   # Розв’язання моделі через ModelRegistry
│   ├── runs.ts                    # Відстеження активних запусків, переривання, черга
│   ├── sandbox-info.ts            # Інформація про sandbox для системного промпту
│   ├── session-manager-cache.ts   # Кешування екземплярів SessionManager
│   ├── session-manager-init.ts    # Ініціалізація файлу сесії
│   ├── system-prompt.ts           # Побудовник системного промпту
│   ├── tool-split.ts              # Поділ інструментів на builtIn і custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Відображення ThinkLevel, опис помилки
├── pi-embedded-subscribe.ts       # Підписка на події сесії/диспетчеризація
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Фабрика обробників подій
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Розбиття потокових блокових відповідей на частини
├── pi-embedded-messaging.ts       # Відстеження надісланих інструментом повідомлень
├── pi-embedded-helpers.ts         # Класифікація помилок, валідація ходів
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
├── pi-hooks/                      # Користувацькі хуки pi
│   ├── compaction-safeguard.ts    # Розширення-запобіжник
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Розширення обрізання контексту cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Розв’язання профілю автентифікації
├── auth-profiles.ts               # Сховище профілів, cooldown, failover
├── model-selection.ts             # Розв’язання моделі за замовчуванням
├── models-config.ts               # Генерація models.json
├── model-catalog.ts               # Кеш каталогу моделей
├── context-window-guard.ts        # Валідація вікна контексту
├── failover-error.ts              # Клас FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Розв’язання параметрів системного промпту
├── system-prompt-report.ts        # Генерація діагностичного звіту
├── tool-summaries.ts              # Підсумки описів інструментів
├── tool-policy.ts                 # Розв’язання політики інструментів
├── transcript-policy.ts           # Політика валідації транскрипту
├── skills.ts                      # Знімок Skills/побудова промпту
├── skills/                        # Підсистема Skills
├── sandbox.ts                     # Розв’язання контексту sandbox
├── sandbox/                       # Підсистема sandbox
├── channel-tools.ts               # Впровадження інструментів для конкретного каналу
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

Середовища виконання дій із повідомленнями для конкретних каналів тепер розміщені в каталогах розширень, що належать Plugin, а не в `src/agents/tools`, наприклад:

- файли середовища виконання дій Plugin Discord
- файл середовища виконання дій Plugin Slack
- файл середовища виконання дій Plugin Telegram
- файл середовища виконання дій Plugin WhatsApp

## Основний потік інтеграції

### 1. Запуск вбудованого агента

Головна точка входу — `runEmbeddedPiAgent()` у `pi-embedded-runner/run.ts`:

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

Усередині `runEmbeddedAttempt()` (яка викликається з `runEmbeddedPiAgent()`) використовується pi SDK:

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

`subscribeEmbeddedPiSession()` підписується на події `AgentSession` з pi:

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

Серед оброблюваних подій:

- `message_start` / `message_end` / `message_update` (потоковий текст/мислення)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Надсилання промпту

Після налаштування сесія отримує промпт:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK обробляє весь цикл агента: надсилання до LLM, виконання викликів інструментів, потокову передачу відповідей.

Впровадження зображень є локальним для промпту: OpenClaw завантажує посилання на зображення з поточного промпту та передає їх через `images` лише для цього ходу. Він не сканує повторно старіші ходи історії, щоб повторно впроваджувати payload зображень.

## Архітектура інструментів

### Конвеєр інструментів

1. **Базові інструменти**: `codingTools` з pi (`read`, `bash`, `edit`, `write`)
2. **Користувацькі заміни**: OpenClaw замінює bash на `exec`/`process`, кастомізує read/edit/write для sandbox
3. **Інструменти OpenClaw**: повідомлення, browser, canvas, sessions, Cron, Gateway тощо
4. **Інструменти каналів**: інструменти дій для Discord/Telegram/Slack/WhatsApp
5. **Фільтрація політиками**: інструменти фільтруються за політиками профілю, провайдера, агента, групи, sandbox
6. **Нормалізація схем**: схеми очищуються для особливостей Gemini/OpenAI
7. **Обгортання AbortSignal**: інструменти обгортаються, щоб поважати сигнали переривання

### Адаптер визначень інструментів

`AgentTool` з pi-agent-core має інший сигнатурний `execute`, ніж `ToolDefinition` з pi-coding-agent. Адаптер у `pi-tool-definition-adapter.ts` з’єднує їх:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // Сигнатура pi-coding-agent відрізняється від pi-agent-core
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
    builtInTools: [], // Порожньо. Ми перевизначаємо все
    customTools: toToolDefinitions(options.tools),
  };
}
```

Це гарантує, що фільтрація політик OpenClaw, інтеграція sandbox і розширений набір інструментів залишаються узгодженими між провайдерами.

## Побудова системного промпту

Системний промпт будується в `buildAgentSystemPrompt()` (`system-prompt.ts`). Він формує повний промпт із розділами, зокрема Tooling, стиль виклику інструментів, захисні обмеження безпеки, довідка OpenClaw CLI, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, метадані середовища виконання, а також Memory і Reactions, коли вони увімкнені, і необов’язкові файли контексту та додатковий вміст системного промпту. Для мінімального режиму промпту, який використовується субагентами, розділи скорочуються.

Промпт застосовується після створення сесії через `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Керування сесіями

### Файли сесій

Сесії — це файли JSONL із деревоподібною структурою (зв’язування через id/parentId). Збереженням керує `SessionManager` із Pi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw обгортає це через `guardSessionManager()` для безпечної роботи з результатами інструментів.

### Кешування сесій

`session-manager-cache.ts` кешує екземпляри SessionManager, щоб уникнути повторного парсингу файлів:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Обмеження історії

`limitHistoryTurns()` обрізає історію розмови залежно від типу каналу (DM чи група).

### Compaction

Автоматичний Compaction спрацьовує при переповненні контексту. Типові сигнатури переповнення включають
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

## Автентифікація та розв’язання моделі

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

### Розв’язання моделі

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Використовує ModelRegistry і AuthStorage з Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` запускає резервне перемикання моделі, коли це налаштовано:

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

### Запобіжник Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` додає захисні обмеження до Compaction, зокрема адаптивне бюджетування токенів, а також підсумки збоїв інструментів і файлових операцій:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Обрізання контексту

`src/agents/pi-hooks/context-pruning.ts` реалізує обрізання контексту на основі cache-TTL:

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

## Потокова передача й блокові відповіді

### Розбиття на блоки

`EmbeddedBlockChunker` керує перетворенням потокового тексту на окремі блоки відповіді:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Видалення тегів Thinking/Final

Потоковий вивід обробляється так, щоб видаляти блоки `<think>`/`<thinking>` і витягати вміст `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Видалити вміст <think>...</think>
  // Якщо enforceFinalTag, повертати лише вміст <final>...</final>
};
```

### Директиви відповіді

Директиви відповіді, як-от `[[media:url]]`, `[[voice]]`, `[[reply:id]]`, розбираються та витягуються:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Обробка помилок

### Класифікація помилок

`pi-embedded-helpers.ts` класифікує помилки для належної обробки:

```typescript
isContextOverflowError(errorText)     // Контекст занадто великий
isCompactionFailureError(errorText)   // Compaction не вдався
isAuthAssistantError(lastAssistant)   // Помилка автентифікації
isRateLimitAssistantError(...)        // Досягнуто обмеження швидкості
isFailoverAssistantError(...)         // Потрібен failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Резервне зниження рівня thinking

Якщо рівень thinking не підтримується, використовується запасний варіант:

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

## Інтеграція sandbox

Коли режим sandbox увімкнено, інструменти та шляхи обмежуються:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Використовувати ізольовані інструменти read/edit/write
  // Exec виконується в контейнері
  // Browser використовує bridge URL
}
```

## Специфічна для провайдерів обробка

### Anthropic

- Очищення магічного рядка відмови
- Валідація ходів для послідовних ролей
- Сувора валідація параметрів інструментів Pi на стороні upstream

### Google/Gemini

- Очищення схем інструментів, що належать Plugin

### OpenAI

- Інструмент `apply_patch` для моделей Codex
- Обробка зниження рівня thinking

## Інтеграція TUI

OpenClaw також має локальний режим TUI, який безпосередньо використовує компоненти pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Це забезпечує інтерактивну роботу в терміналі, подібну до нативного режиму pi.

## Ключові відмінності від Pi CLI

| Аспект          | Pi CLI                  | Вбудований OpenClaw                                                                                |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Виклик          | команда `pi` / RPC      | SDK через `createAgentSession()`                                                                   |
| Інструменти     | Типові інструменти кодування | Користувацький набір інструментів OpenClaw                                                     |
| Системний промпт | AGENTS.md + промпти    | Динамічний для кожного каналу/контексту                                                            |
| Зберігання сесій | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (або `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Автентифікація  | Один обліковий запис    | Кілька профілів із ротацією                                                                         |
| Розширення      | Завантажуються з диска  | Програмно + шляхи на диску                                                                          |
| Обробка подій   | Рендеринг TUI           | На основі callback (`onBlockReply` тощо)                                                           |

## Майбутні міркування

Напрями для можливого перегляду:

1. **Узгодження сигнатур інструментів**: наразі використовується адаптація між сигнатурами pi-agent-core і pi-coding-agent
2. **Обгортання SessionManager**: `guardSessionManager` додає безпеку, але підвищує складність
3. **Завантаження розширень**: можна було б безпосередніше використовувати `ResourceLoader` з Pi
4. **Складність обробника потоків**: `subscribeEmbeddedPiSession` став занадто великим
5. **Особливості провайдерів**: багато специфічних для провайдерів кодових шляхів, які потенційно міг би обробляти сам Pi

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

Живі/опційні:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (увімкніть `OPENCLAW_LIVE_TEST=1`)

Актуальні команди запуску див. у [робочому процесі розробки Pi](/uk/pi-dev).

## Пов’язане

- [робочий процес розробки Pi](/uk/pi-dev)
- [огляд встановлення](/uk/install)
