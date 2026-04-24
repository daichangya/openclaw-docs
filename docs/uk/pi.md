---
read_when:
    - Розуміння дизайну інтеграції Pi SDK в OpenClaw
    - Зміна життєвого циклу сесії агента, інструментів або підключення provider для Pi
summary: Архітектура інтеграції вбудованого агента Pi в OpenClaw і життєвого циклу сесії
title: Архітектура інтеграції Pi
x-i18n:
    generated_at: "2026-04-24T04:15:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

Цей документ описує, як OpenClaw інтегрується з [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) та спорідненими пакетами (`pi-ai`, `pi-agent-core`, `pi-tui`), щоб забезпечувати можливості свого ШІ-агента.

## Огляд

OpenClaw використовує SDK pi для вбудовування агента ШІ для програмування у свою архітектуру шлюзу повідомлень. Замість запуску pi як дочірнього процесу або використання режиму RPC OpenClaw безпосередньо імпортує та створює `AgentSession` pi через `createAgentSession()`. Цей вбудований підхід забезпечує:

- повний контроль над життєвим циклом сесії та обробкою подій
- ін’єкцію власних інструментів (повідомлення, sandbox, дії, специфічні для каналу)
- налаштування системного запиту для кожного каналу/контексту
- збереження сесії з підтримкою branching/Compaction
- ротацію багатoакаунтних профілів автентифікації з failover
- перемикання моделей, не прив’язане до конкретного provider

## Залежності пакетів

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Пакет            | Призначення                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `pi-ai`          | Базові абстракції LLM: `Model`, `streamSimple`, типи повідомлень, API provider                          |
| `pi-agent-core`  | Цикл агента, виконання інструментів, типи `AgentMessage`                                                |
| `pi-coding-agent` | Високорівневий SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, вбудовані інструменти |
| `pi-tui`         | Компоненти UI термінала (використовуються в локальному режимі TUI OpenClaw)                             |

## Структура файлів

```
src/agents/
├── pi-embedded-runner.ts          # Повторний експорт з pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Головна точка входу: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Логіка однієї спроби з налаштуванням сесії
│   │   ├── params.ts              # Тип RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Побудова payload відповіді з результатів запуску
│   │   ├── images.ts              # Ін’єкція зображень для vision-моделі
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Виявлення помилки скасування
│   ├── cache-ttl.ts               # Відстеження TTL кешу для обрізання контексту
│   ├── compact.ts                 # Логіка ручного/автоматичного Compaction
│   ├── extensions.ts              # Завантаження розширень pi для вбудованих запусків
│   ├── extra-params.ts            # Параметри потоку, специфічні для provider
│   ├── google.ts                  # Виправлення порядку ходів для Google/Gemini
│   ├── history.ts                 # Обмеження історії (DM vs група)
│   ├── lanes.ts                   # Lanes команд сесії/глобальних команд
│   ├── logger.ts                  # Логер підсистеми
│   ├── model.ts                   # Визначення моделі через ModelRegistry
│   ├── runs.ts                    # Відстеження активних запусків, скасування, черга
│   ├── sandbox-info.ts            # Інформація про sandbox для системного запиту
│   ├── session-manager-cache.ts   # Кешування екземпляра SessionManager
│   ├── session-manager-init.ts    # Ініціалізація файлу сесії
│   ├── system-prompt.ts           # Побудова системного запиту
│   ├── tool-split.ts              # Розділення інструментів на builtIn і custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Мапінг ThinkLevel, опис помилок
├── pi-embedded-subscribe.ts       # Підписка/диспетчеризація подій сесії
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Фабрика обробників подій
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Розбиття потокових блокових відповідей на частини
├── pi-embedded-messaging.ts       # Відстеження надсилань через інструмент повідомлень
├── pi-embedded-helpers.ts         # Класифікація помилок, валідація ходу
├── pi-embedded-helpers/           # Допоміжні модулі
├── pi-embedded-utils.ts           # Утиліти форматування
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Обгортання AbortSignal для інструментів
├── pi-tools.policy.ts             # Політика allowlist/denylist інструментів
├── pi-tools.read.ts               # Налаштування інструмента читання
├── pi-tools.schema.ts             # Нормалізація схем інструментів
├── pi-tools.types.ts              # Псевдонім типу AnyAgentTool
├── pi-tool-definition-adapter.ts  # Адаптер AgentTool -> ToolDefinition
├── pi-settings.ts                 # Перевизначення налаштувань
├── pi-hooks/                      # Власні hooks pi
│   ├── compaction-safeguard.ts    # Розширення safeguard
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Розширення обрізання контексту за TTL кешу
│   └── context-pruning/
├── model-auth.ts                  # Визначення профілю автентифікації
├── auth-profiles.ts               # Сховище профілів, cooldown, failover
├── model-selection.ts             # Визначення типової моделі
├── models-config.ts               # Генерація models.json
├── model-catalog.ts               # Кеш каталогу моделей
├── context-window-guard.ts        # Валідація вікна контексту
├── failover-error.ts              # Клас FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Визначення параметрів системного запиту
├── system-prompt-report.ts        # Генерація діагностичного звіту
├── tool-summaries.ts              # Зведення описів інструментів
├── tool-policy.ts                 # Визначення політики інструментів
├── transcript-policy.ts           # Політика валідації транскрипту
├── skills.ts                      # Знімок Skills/побудова запиту
├── skills/                        # Підсистема Skills
├── sandbox.ts                     # Визначення контексту sandbox
├── sandbox/                       # Підсистема sandbox
├── channel-tools.ts               # Ін’єкція інструментів, специфічних для каналу
├── openclaw-tools.ts              # Інструменти, специфічні для OpenClaw
├── bash-tools.ts                  # Інструменти exec/process
├── apply-patch.ts                 # Інструмент apply_patch (OpenAI)
├── tools/                         # Реалізації окремих інструментів
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

Runtime файлів дій повідомлень, специфічних для каналу, тепер розміщуються в каталогах
розширень, що належать plugin, а не в `src/agents/tools`, наприклад:

- файли runtime дій plugin Discord
- файл runtime дій plugin Slack
- файл runtime дій plugin Telegram
- файл runtime дій plugin WhatsApp

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

Усередині `runEmbeddedAttempt()` (який викликається з `runEmbeddedPiAgent()`) використовується SDK pi:

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

`subscribeEmbeddedPiSession()` підписується на події `AgentSession` pi:

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

### 4. Формування запиту

Після налаштування до сесії надсилається запит:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK обробляє повний цикл агента: надсилання до LLM, виконання викликів інструментів, потокове передавання відповідей.

Ін’єкція зображень є локальною для запиту: OpenClaw завантажує посилання на зображення з поточного запиту і
передає їх через `images` лише для цього ходу. Він не сканує повторно старі ходи історії,
щоб повторно ін’єктувати payload зображень.

## Архітектура інструментів

### Конвеєр інструментів

1. **Базові інструменти**: `codingTools` від pi (`read`, `bash`, `edit`, `write`)
2. **Власні заміни**: OpenClaw замінює `bash` на `exec`/`process`, налаштовує `read`/`edit`/`write` для sandbox
3. **Інструменти OpenClaw**: повідомлення, браузер, canvas, sessions, cron, gateway тощо
4. **Інструменти каналів**: інструменти дій, специфічні для Discord/Telegram/Slack/WhatsApp
5. **Фільтрація політик**: інструменти фільтруються за профілем, provider, агентом, групою, політиками sandbox
6. **Нормалізація схем**: схеми очищуються від особливостей Gemini/OpenAI
7. **Обгортання AbortSignal**: інструменти обгортаються для врахування сигналів скасування

### Адаптер визначення інструментів

`AgentTool` із pi-agent-core має іншу сигнатуру `execute`, ніж `ToolDefinition` із pi-coding-agent. Адаптер у `pi-tool-definition-adapter.ts` з’єднує це:

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

### Стратегія розділення інструментів

`splitSdkTools()` передає всі інструменти через `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Порожньо. Ми все перевизначаємо
    customTools: toToolDefinitions(options.tools),
  };
}
```

Це гарантує, що фільтрація політик OpenClaw, інтеграція sandbox і розширений набір інструментів залишаються узгодженими між provider.

## Побудова системного запиту

Системний запит будується в `buildAgentSystemPrompt()` (`system-prompt.ts`). Він складає повний запит із розділами, що включають Tooling, стиль виклику інструментів, запобіжники безпеки, довідку CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, теги відповіді, Voice, тихі відповіді, Heartbeat, метадані runtime, а також Memory і Reactions, коли вони ввімкнені, і необов’язкові контекстні файли та додатковий вміст системного запиту. Для мінімального режиму запиту, який використовують subagent, розділи обрізаються.

Запит застосовується після створення сесії через `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Керування сесіями

### Файли сесій

Сесії — це файли JSONL із деревоподібною структурою (зв’язки id/parentId). `SessionManager` з Pi відповідає за збереження:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw обгортає це через `guardSessionManager()` для безпеки результатів інструментів.

### Кешування сесій

`session-manager-cache.ts` кешує екземпляри SessionManager, щоб уникати повторного розбору файлів:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Обмеження історії

`limitHistoryTurns()` обрізає історію розмови залежно від типу каналу (DM чи група).

### Compaction

Автоматичний Compaction спрацьовує під час переповнення контексту. Поширені сигнатури
переповнення включають `request_too_large`, `context length exceeded`, `input exceeds the
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

OpenClaw підтримує сховище профілів автентифікації з кількома API-ключами на provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Профілі ротуються після збоїв із відстеженням cooldown:

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

// Використовує ModelRegistry і AuthStorage з Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` запускає резервне перемикання моделі, якщо воно налаштоване:

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

OpenClaw завантажує власні розширення Pi для спеціалізованої поведінки:

### Захист Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` додає запобіжники до Compaction, включно з адаптивним бюджетуванням токенів, а також зведеннями про збої інструментів і файлові операції:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Обрізання контексту

`src/agents/pi-hooks/context-pruning.ts` реалізує обрізання контексту на основі TTL кешу:

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

## Потокове передавання та блокові відповіді

### Розбиття блоків

`EmbeddedBlockChunker` керує потоковим текстом, розбиваючи його на окремі блоки відповіді:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Вилучення тегів thinking/final

Потоковий вивід обробляється так, щоб прибрати блоки `<think>`/`<thinking>` і витягти вміст `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Прибрати вміст <think>...</think>
  // Якщо enforceFinalTag, повертати лише вміст <final>...</final>
};
```

### Директиви відповіді

Директиви відповіді, як-от `[[media:url]]`, `[[voice]]`, `[[reply:id]]`, аналізуються та витягуються:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Обробка помилок

### Класифікація помилок

`pi-embedded-helpers.ts` класифікує помилки для належної обробки:

```typescript
isContextOverflowError(errorText)     // Контекст завеликий
isCompactionFailureError(errorText)   // Не вдався Compaction
isAuthAssistantError(lastAssistant)   // Помилка автентифікації
isRateLimitAssistantError(...)        // Спрацювало rate limit
isFailoverAssistantError(...)         // Потрібен failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Резервне зниження рівня thinking

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
  // Використовувати інструменти read/edit/write у sandbox
  // Exec працює в контейнері
  // Browser використовує bridge URL
}
```

## Обробка, специфічна для provider

### Anthropic

- очищення магічного рядка відмови
- валідація ходів для послідовних ролей
- сувора перевірка параметрів інструментів Pi на боці upstream

### Google/Gemini

- санітизація схеми інструментів, що належить plugin

### OpenAI

- інструмент `apply_patch` для моделей Codex
- обробка зниження рівня thinking

## Інтеграція TUI

OpenClaw також має локальний режим TUI, який безпосередньо використовує компоненти pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Це забезпечує інтерактивну роботу в терміналі, подібну до нативного режиму Pi.

## Ключові відмінності від Pi CLI

| Аспект          | Pi CLI                  | Вбудований OpenClaw                                                                              |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Виклик          | команда `pi` / RPC      | SDK через `createAgentSession()`                                                                 |
| Інструменти     | Типові інструменти для коду | Власний набір інструментів OpenClaw                                                            |
| Системний запит | AGENTS.md + prompts     | Динамічний для кожного каналу/контексту                                                          |
| Зберігання сесій | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (або `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Автентифікація  | Один обліковий запис    | Кілька профілів із ротацією                                                                       |
| Розширення      | Завантажуються з диска  | Програмно + шляхи на диску                                                                       |
| Обробка подій   | Рендеринг TUI           | На основі callback (`onBlockReply` тощо)                                                         |

## Майбутні міркування

Області для потенційного перероблення:

1. **Узгодження сигнатур інструментів**: наразі є адаптація між сигнатурами pi-agent-core і pi-coding-agent
2. **Обгортання менеджера сесій**: `guardSessionManager` додає безпеку, але підвищує складність
3. **Завантаження розширень**: можна було б пряміше використовувати `ResourceLoader` з Pi
4. **Складність обробника потоків**: `subscribeEmbeddedPiSession` значно зріс
5. **Особливості provider**: багато кодових шляхів, специфічних для provider, які потенційно міг би обробляти Pi

## Тести

Покриття інтеграції Pi охоплює такі набори:

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

Актуальні команди запуску дивіться в [Робочий процес розробки Pi](/uk/pi-dev).

## Пов’язане

- [Робочий процес розробки Pi](/uk/pi-dev)
- [Огляд встановлення](/uk/install)
