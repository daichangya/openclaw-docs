---
read_when:
    - Розуміння дизайну інтеграції SDK Pi в OpenClaw
    - Зміна життєвого циклу сесії агента, інструментарію або підключення провайдера для Pi
summary: Архітектура інтеграції вбудованого агента Pi в OpenClaw і життєвий цикл сесії
title: Архітектура інтеграції Pi
x-i18n:
    generated_at: "2026-04-24T16:35:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

Цей документ описує, як OpenClaw інтегрується з [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) і його суміжними пакетами (`pi-ai`, `pi-agent-core`, `pi-tui`) для забезпечення можливостей свого AI-агента.

## Огляд

OpenClaw використовує SDK pi, щоб вбудувати AI-агента для програмування у свою архітектуру шлюзу повідомлень. Замість запуску pi як підпроцесу або використання режиму RPC, OpenClaw безпосередньо імпортує та створює `AgentSession` через `createAgentSession()`. Цей вбудований підхід забезпечує:

- Повний контроль над життєвим циклом сесії та обробкою подій
- Впровадження користувацьких інструментів (повідомлення, sandbox, дії, специфічні для каналу)
- Налаштування системного промпта для кожного каналу/контексту
- Збереження сесій із підтримкою розгалуження/Compaction
- Ротацію профілів автентифікації для кількох акаунтів із перемиканням у разі збою
- Перемикання моделей без прив’язки до провайдера

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
| `pi-coding-agent`| SDK високого рівня: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, вбудовані інструменти |
| `pi-tui`         | Компоненти термінального UI (використовуються в локальному режимі TUI OpenClaw)                      |

## Структура файлів

```
src/agents/
├── pi-embedded-runner.ts          # Реекспорти з pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Основна точка входу: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Логіка однієї спроби з налаштуванням сесії
│   │   ├── params.ts              # Тип RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Побудова payload відповіді з результатів запуску
│   │   ├── images.ts              # Впровадження зображень для vision-моделі
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Визначення помилки скасування
│   ├── cache-ttl.ts               # Відстеження TTL кешу для обрізання контексту
│   ├── compact.ts                 # Логіка ручного/автоматичного Compaction
│   ├── extensions.ts              # Завантаження розширень pi для вбудованих запусків
│   ├── extra-params.ts            # Параметри потоку, специфічні для провайдера
│   ├── google.ts                  # Виправлення порядку ходів для Google/Gemini
│   ├── history.ts                 # Обмеження історії (DM проти групи)
│   ├── lanes.ts                   # Смуги команд сесії/глобальні смуги
│   ├── logger.ts                  # Логер підсистеми
│   ├── model.ts                   # Визначення моделі через ModelRegistry
│   ├── runs.ts                    # Відстеження активних запусків, скасування, черга
│   ├── sandbox-info.ts            # Інформація sandbox для системного промпта
│   ├── session-manager-cache.ts   # Кешування екземплярів SessionManager
│   ├── session-manager-init.ts    # Ініціалізація файлу сесії
│   ├── system-prompt.ts           # Побудова системного промпта
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
├── pi-tools.read.ts               # Налаштування інструмента читання
├── pi-tools.schema.ts             # Нормалізація схем інструментів
├── pi-tools.types.ts              # Псевдонім типу AnyAgentTool
├── pi-tool-definition-adapter.ts  # Адаптер AgentTool -> ToolDefinition
├── pi-settings.ts                 # Перевизначення налаштувань
├── pi-hooks/                      # Користувацькі хуки pi
│   ├── compaction-safeguard.ts    # Захисне розширення
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Розширення обрізання контексту за Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Визначення профілю автентифікації
├── auth-profiles.ts               # Сховище профілів, cooldown, failover
├── model-selection.ts             # Визначення моделі за замовчуванням
├── models-config.ts               # Генерація models.json
├── model-catalog.ts               # Кеш каталогу моделей
├── context-window-guard.ts        # Перевірка вікна контексту
├── failover-error.ts              # Клас FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Визначення параметрів системного промпта
├── system-prompt-report.ts        # Генерація налагоджувального звіту
├── tool-summaries.ts              # Підсумки описів інструментів
├── tool-policy.ts                 # Визначення політики інструментів
├── transcript-policy.ts           # Політика валідації транскрипту
├── skills.ts                      # Знімок Skills/побудова промпта
├── skills/                        # Підсистема Skills
├── sandbox.ts                     # Визначення контексту sandbox
├── sandbox/                       # Підсистема sandbox
├── channel-tools.ts               # Впровадження інструментів, специфічних для каналу
├── openclaw-tools.ts              # Інструменти, специфічні для OpenClaw
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

Середовища виконання дій із повідомленнями, специфічних для каналів, тепер розміщені у директоріях розширень, що належать Plugin, а не під `src/agents/tools`, наприклад:

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

Події, що обробляються, включають:

- `message_start` / `message_end` / `message_update` (потоковий текст/міркування)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Надсилання промпта

Після налаштування в сесію надсилається промпт:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK обробляє повний цикл агента: надсилання до LLM, виконання викликів інструментів, потокову передачу відповідей.

Впровадження зображень є локальним для промпта: OpenClaw завантажує посилання на зображення з поточного промпта та передає їх через `images` лише для цього ходу. Він не сканує повторно старіші ходи історії, щоб повторно впровадити payload зображень.

## Архітектура інструментів

### Конвеєр інструментів

1. **Базові інструменти**: `codingTools` з pi (`read`, `bash`, `edit`, `write`)
2. **Користувацькі заміни**: OpenClaw замінює bash на `exec`/`process`, налаштовує `read`/`edit`/`write` для sandbox
3. **Інструменти OpenClaw**: повідомлення, браузер, canvas, сесії, Cron, Gateway тощо
4. **Інструменти каналу**: інструменти дій, специфічні для Discord/Telegram/Slack/WhatsApp
5. **Фільтрація за політикою**: інструменти фільтруються за профілем, провайдером, агентом, групою, політиками sandbox
6. **Нормалізація схем**: схеми очищаються з урахуванням особливостей Gemini/OpenAI
7. **Обгортання AbortSignal**: інструменти обгортаються для підтримки сигналів скасування

### Адаптер визначень інструментів

`AgentTool` із pi-agent-core має іншу сигнатуру `execute`, ніж `ToolDefinition` із pi-coding-agent. Адаптер у `pi-tool-definition-adapter.ts` поєднує їх:

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

Це гарантує, що фільтрація за політиками, інтеграція sandbox і розширений набір інструментів OpenClaw залишаються узгодженими для всіх провайдерів.

## Побудова системного промпта

Системний промпт будується в `buildAgentSystemPrompt()` (`system-prompt.ts`). Він збирає повний промпт із розділами, зокрема Tooling, Tool Call Style, Safety guardrails, довідкою OpenClaw CLI, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, метаданими середовища виконання, а також Memory і Reactions, коли вони ввімкнені, і додатково — необов’язковими файлами контексту та додатковим вмістом системного промпта. Для мінімального режиму промпта, що використовується субагентами, розділи скорочуються.

Промпт застосовується після створення сесії через `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Керування сесіями

### Файли сесій

Сесії — це файли JSONL із деревоподібною структурою (зв’язування через id/parentId). За збереження стану відповідає `SessionManager` із Pi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw обгортає це через `guardSessionManager()` для безпеки результатів інструментів.

### Кешування сесій

`session-manager-cache.ts` кешує екземпляри SessionManager, щоб уникнути повторного розбору файлів:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Обмеження історії

`limitHistoryTurns()` обрізає історію розмови залежно від типу каналу (DM проти групи).

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

`FailoverError` запускає перехід на резервну модель, якщо це налаштовано:

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

`src/agents/pi-hooks/compaction-safeguard.ts` додає захисні механізми до Compaction, зокрема адаптивне бюджетування токенів, а також підсумки збоїв інструментів і файлових операцій:

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

### Розбиття блоків

`EmbeddedBlockChunker` керує потоковим текстом, перетворюючи його на окремі блоки відповіді:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Видалення тегів thinking/final

Потоковий вивід обробляється для видалення блоків `<think>`/`<thinking>` і вилучення вмісту `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Директиви відповіді

Директиви відповіді, такі як `[[media:url]]`, `[[voice]]`, `[[reply:id]]`, розбираються та вилучаються:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Обробка помилок

### Класифікація помилок

`pi-embedded-helpers.ts` класифікує помилки для належної обробки:

```typescript
isContextOverflowError(errorText)     // Завеликий контекст
isCompactionFailureError(errorText)   // Помилка Compaction
isAuthAssistantError(lastAssistant)   // Помилка автентифікації
isRateLimitAssistantError(...)        // Досягнуто обмеження швидкості
isFailoverAssistantError(...)         // Потрібен failover
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

## Інтеграція sandbox

Коли режим sandbox увімкнено, інструменти та шляхи обмежуються:

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

## Обробка, специфічна для провайдера

### Anthropic

- Очищення magic string відмови
- Валідація ходів для послідовних ролей
- Сувора валідація параметрів інструментів Pi на стороні upstream

### Google/Gemini

- Санітизація схем інструментів, що належать Plugin

### OpenAI

- Інструмент `apply_patch` для моделей Codex
- Обробка зниження рівня thinking

## Інтеграція TUI

OpenClaw також має локальний режим TUI, який безпосередньо використовує компоненти pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Це забезпечує інтерактивний досвід у терміналі, подібний до нативного режиму Pi.

## Ключові відмінності від Pi CLI

| Аспект          | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Виклик          | команда `pi` / RPC      | SDK через `createAgentSession()`                                                               |
| Інструменти     | Стандартні інструменти для програмування | Користувацький набір інструментів OpenClaw                                         |
| Системний промпт| AGENTS.md + промпти     | Динамічний для кожного каналу/контексту                                                        |
| Зберігання сесій| `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (або `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Автентифікація  | Один обліковий запис    | Кілька профілів із ротацією                                                                    |
| Розширення      | Завантажуються з диска  | Програмно + шляхи на диску                                                                     |
| Обробка подій   | Рендеринг TUI           | На основі callback (`onBlockReply` тощо)                                                       |

## Майбутні міркування

Області для потенційного перегляду:

1. **Узгодження сигнатур інструментів**: зараз виконується адаптація між сигнатурами pi-agent-core і pi-coding-agent
2. **Обгортання менеджера сесій**: `guardSessionManager` додає безпеку, але підвищує складність
3. **Завантаження розширень**: можна було б безпосередніше використовувати `ResourceLoader` з pi
4. **Складність обробника потоків**: `subscribeEmbeddedPiSession` став досить великим
5. **Особливості провайдерів**: багато кодових шляхів, специфічних для провайдерів, які pi потенційно міг би обробляти самостійно

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

Живі/опціональні:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (увімкнути `OPENCLAW_LIVE_TEST=1`)

Актуальні команди запуску див. у [Робочий процес розробки Pi](/uk/pi-dev).

## Пов’язані матеріали

- [Робочий процес розробки Pi](/uk/pi-dev)
- [Огляд встановлення](/uk/install)
