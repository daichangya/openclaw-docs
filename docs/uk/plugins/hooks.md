---
read_when:
    - Ви створюєте Plugin, якому потрібні `before_tool_call`, `before_agent_reply`, хуки повідомлень або хуки життєвого циклу
    - Вам потрібно блокувати, переписувати або вимагати схвалення для викликів інструментів із Plugin
    - 'Ви вирішуєте, що обрати: внутрішні хуки чи хуки Plugin'
summary: 'Хуки Plugin: перехоплюють події життєвого циклу агента, інструмента, повідомлення, сесії та Gateway'
title: Хуки Plugin
x-i18n:
    generated_at: "2026-04-24T18:41:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122060cc36dd0ef0be4dbc6bab629742142543ba718fccd7f5a75885e73d43e1
    source_path: plugins/hooks.md
    workflow: 15
---

Хуки Plugin — це внутрішньопроцесні точки розширення для Plugin OpenClaw. Використовуйте їх,
коли Plugin має перевіряти або змінювати запуски агента, виклики інструментів, потік повідомлень,
життєвий цикл сесії, маршрутизацію субагентів, встановлення або запуск Gateway.

Натомість використовуйте [внутрішні хуки](/uk/automation/hooks), коли вам потрібен невеликий
скрипт `HOOK.md`, встановлений оператором, для команд і подій Gateway, таких як
`/new`, `/reset`, `/stop`, `agent:bootstrap` або `gateway:startup`.

## Швидкий старт

Зареєструйте типізовані хуки Plugin за допомогою `api.on(...)` у точці входу вашого Plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Обробники хуків виконуються послідовно у порядку спадання `priority`. Хуки
з однаковим пріоритетом зберігають порядок реєстрації.

## Каталог хуків

Хуки згруповано за поверхнею, яку вони розширюють. Назви, виділені **жирним**, приймають
результат рішення (block, cancel, override або require approval); усі інші є
лише спостережними.

**Хід агента**

- `before_model_resolve` — перевизначає провайдера або модель до завантаження повідомлень сесії
- `before_prompt_build` — додає динамічний контекст або текст системного промпту перед викликом моделі
- `before_agent_start` — лише сумісний об’єднаний етап; натомість віддавайте перевагу двом хукам вище
- **`before_agent_reply`** — достроково завершує хід моделі синтетичною відповіддю або беззвучним режимом
- `agent_end` — спостерігає фінальні повідомлення, стан успіху та тривалість запуску

**Спостереження за розмовою**

- `llm_input` — спостерігає вхідні дані провайдера (системний промпт, промпт, історія)
- `llm_output` — спостерігає вихідні дані провайдера

**Інструменти**

- **`before_tool_call`** — переписує параметри інструмента, блокує виконання або вимагає схвалення
- `after_tool_call` — спостерігає результати інструмента, помилки та тривалість
- **`tool_result_persist`** — переписує повідомлення асистента, створене з результату інструмента
- **`before_message_write`** — перевіряє або блокує запис повідомлення в процесі виконання (рідко)

**Повідомлення та доставка**

- **`inbound_claim`** — перехоплює вхідне повідомлення до маршрутизації агента (синтетичні відповіді)
- `message_received` — спостерігає вхідний вміст, відправника, потік та метадані
- **`message_sending`** — переписує вихідний вміст або скасовує доставку
- `message_sent` — спостерігає успіх або збій вихідної доставки
- **`before_dispatch`** — перевіряє або переписує вихідну диспетчеризацію до передавання каналу
- **`reply_dispatch`** — бере участь у фінальному конвеєрі диспетчеризації відповіді

**Сесії та Compaction**

- `session_start` / `session_end` — відстежують межі життєвого циклу сесії
- `before_compaction` / `after_compaction` — спостерігають або анотують цикли Compaction
- `before_reset` — спостерігає події скидання сесії (`/reset`, програмні скидання)

**Субагенти**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — координують маршрутизацію субагентів і доставку завершення

**Життєвий цикл**

- `gateway_start` / `gateway_stop` — запускають або зупиняють служби Plugin, що належать Gateway
- **`before_install`** — перевіряє сканування встановлення skill або Plugin і за потреби блокує

## Політика викликів інструментів

`before_tool_call` отримує:

- `event.toolName`
- `event.params`
- необов’язковий `event.runId`
- необов’язковий `event.toolCallId`
- поля контексту, такі як `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, і
  діагностичний `ctx.trace`

Він може повертати:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Правила:

- `block: true` є термінальним і пропускає обробники з нижчим пріоритетом.
- `block: false` трактується як відсутність рішення.
- `params` переписує параметри інструмента для виконання.
- `requireApproval` призупиняє запуск агента й запитує користувача через схвалення Plugin.
  Команда `/approve` може схвалювати як exec, так і схвалення Plugin.
- `block: true` з нижчим пріоритетом усе ще може заблокувати виконання після того, як хук з вищим пріоритетом
  запросив схвалення.
- `onResolution` отримує остаточне рішення щодо схвалення — `allow-once`,
  `allow-always`, `deny`, `timeout` або `cancelled`.

## Хуки промптів і моделей

Для нових Plugin використовуйте хуки, специфічні для етапу:

- `before_model_resolve`: отримує лише поточний промпт і метадані вкладень.
  Повертає `providerOverride` або `modelOverride`.
- `before_prompt_build`: отримує поточний промпт і повідомлення сесії.
  Повертає `prependContext`, `systemPrompt`, `prependSystemContext` або
  `appendSystemContext`.

`before_agent_start` лишається для сумісності. Віддавайте перевагу явним хукам вище,
щоб ваш Plugin не залежав від застарілого об’єднаного етапу.

`before_agent_start` і `agent_end` містять `event.runId`, коли OpenClaw може
визначити активний запуск. Це саме значення також доступне в `ctx.runId`.

Сторонні Plugin, яким потрібні `llm_input`, `llm_output` або `agent_end`, мають установити:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Хуки, що змінюють промпт, можна вимкнути для окремого Plugin через
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Хуки повідомлень

Використовуйте хуки повідомлень для маршрутизації на рівні каналу та політики доставки:

- `message_received`: спостерігає вхідний вміст, відправника, `threadId`, `messageId`,
  `senderId`, необов’язкову кореляцію запуску/сесії та метадані.
- `message_sending`: переписує `content` або повертає `{ cancel: true }`.
- `message_sent`: спостерігає фінальний успіх або збій.

Контексти хуків повідомлень надають стабільні поля кореляції, коли вони доступні:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` і `ctx.callDepth`. Віддавайте перевагу
цим першокласним полям, перш ніж звертатися до застарілих метаданих.

Віддавайте перевагу типізованим полям `threadId` і `replyToId`, перш ніж використовувати
метадані, специфічні для каналу.

Правила рішень:

- `message_sending` із `cancel: true` є термінальним.
- `message_sending` із `cancel: false` трактується як відсутність рішення.
- Переписаний `content` передається хукам із нижчим пріоритетом, якщо пізніший хук
  не скасовує доставку.

## Хуки встановлення

`before_install` виконується після вбудованого сканування встановлень skill і Plugin.
Поверніть додаткові результати або `{ block: true, blockReason }`, щоб зупинити
встановлення.

`block: true` є термінальним. `block: false` трактується як відсутність рішення.

## Життєвий цикл Gateway

Використовуйте `gateway_start` для служб Plugin, яким потрібен стан, що належить Gateway.
Контекст надає `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для
перевірки та оновлення Cron. Використовуйте `gateway_stop` для очищення довготривалих
ресурсів.

Не покладайтеся на внутрішній хук `gateway:startup` для служб часу виконання, що належать Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Точки входу Plugin](/uk/plugins/sdk-entrypoints)
- [Внутрішні хуки](/uk/automation/hooks)
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals)
