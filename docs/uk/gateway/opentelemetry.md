---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сесій до колектора OpenTelemetry
    - Ви налаштовуєте передавання трасувань, метрик або журналів до Grafana, Datadog, Honeycomb, New Relic, Tempo або іншого бекенда OTLP
    - Вам потрібні точні назви метрик, назви span або форми атрибутів для побудови інформаційних панелей чи сповіщень
summary: Експортуйте діагностику OpenClaw до будь-якого колектора OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T07:01:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b0a8e2e9e808597c6a139306d4b1264e198edb95579a5f7ba36db049ec96afe
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw експортує діагностику через вбудований Plugin `diagnostics-otel`
з використанням **OTLP/HTTP (protobuf)**. Будь-який колектор або бекенд, що приймає OTLP/HTTP,
працюватиме без змін у коді. Про локальні файлові журнали та способи їх читання див.
[Журналювання](/uk/logging).

## Як це працює разом

- **Події діагностики** — це структуровані внутрішньопроцесні записи, які створюються
  Gateway і вбудованими Plugin-ами для запусків моделей, потоку повідомлень, сесій, черг
  і exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трасування** і **журнали** через OTLP/HTTP.
- Експортери підключаються лише тоді, коли увімкнено і поверхню діагностики, і Plugin,
  тому внутрішньопроцесні витрати типово залишаються майже нульовими.

## Швидкий старт

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Ви також можете ввімкнути Plugin через CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, смуг черг, стану сесій, exec і тиску на пам’ять. |
| **Трасування**  | Span-и для використання моделей, викликів моделей, життєвого циклу harness, виконання інструментів, exec, обробки webhook/повідомлень, збирання контексту та циклів інструментів. |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP, коли ввімкнено `diagnostics.otel.logs`.                                     |

Параметри `traces`, `metrics` і `logs` можна перемикати незалежно. Усі три типово ввімкнені,
коли `diagnostics.otel.enabled` дорівнює true.

## Довідка з конфігурації

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Змінні середовища

| Змінна                                                                                                           | Призначення                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                    | Перевизначає `diagnostics.otel.endpoint`. Якщо значення вже містить `/v1/traces`, `/v1/metrics` або `/v1/logs`, воно використовується як є.                                                                                               |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення кінцевих точок для конкретного сигналу, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація конкретного сигналу має пріоритет над env конкретного сигналу, який має пріоритет над спільною кінцевою точкою. |
| `OTEL_SERVICE_NAME`                                                                                              | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                    | Перевизначає wire protocol (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                  | Установіть `gen_ai_latest_experimental`, щоб надсилати новітній експериментальний атрибут span для GenAI (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                        | Установіть `1`, якщо інший preload або хост-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає слухачі діагностики та враховує `traces`/`metrics`/`logs`. |

## Конфіденційність і захоплення вмісту

Необроблений вміст моделей/інструментів **типово не експортується**. Span-и містять обмежені
ідентифікатори (канал, provider, модель, категорія помилки, лише хешовані request id)
і ніколи не включають текст prompt, текст відповіді, вхідні дані інструментів, вихідні дані інструментів
або ключі сесій.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш колектор і
політика зберігання схвалені для тексту prompt, відповіді, інструментів або системного prompt.
Кожен підключ окремо вмикається за принципом opt-in:

- `inputMessages` — вміст prompt користувача.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — payload аргументів інструментів.
- `toolOutputs` — payload результатів інструментів.
- `systemPrompt` — зібраний системний/developer prompt.

Коли будь-який підключ увімкнено, span-и моделі та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Трасування:** `diagnostics.otel.sampleRate` (лише для root-span, `0.0` відкидає все,
  `1.0` зберігає все).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** журнали OTLP враховують `logging.level` (рівень файлового журналу). До журналів OTLP
  не застосовується редагування для консолі. Для інсталяцій із великим обсягом даних краще
  використовувати семплювання/фільтрацію колектора OTLP замість локального семплювання.

## Експортовані метрики

### Використання моделей

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних угод GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних угод GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язково `error.type`)

### Потік повідомлень

- `openclaw.webhook.received` (лічильник, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (лічильник, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (лічильник, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (лічильник, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (лічильник, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Черги та сесії

- `openclaw.queue.lane.enqueue` (лічильник, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, attrs: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, attrs: `openclaw.lane`)
- `openclaw.session.state` (лічильник, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (гістограма, attrs: `openclaw.state`)
- `openclaw.run.attempt` (лічильник, attrs: `openclaw.attempt`)

### Життєвий цикл harness

- `openclaw.harness.duration_ms` (гістограма, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` у разі помилок)

### Exec

- `openclaw.exec.duration_ms` (гістограма, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішні метрики діагностики (пам’ять і цикл інструментів)

- `openclaw.memory.heap_used_bytes` (гістограма, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані span-и

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - типово `gen_ai.system`, або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні угоди GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - типово `gen_ai.system`, або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні угоди GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (обмежений SHA-базований хеш ідентифікатора запиту до upstream provider; сирі ідентифікатори не експортуються)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Під час завершення: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - У разі помилки: `openclaw.harness.phase`, `openclaw.errorCategory`, необов’язково `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту prompt, історії, відповіді чи ключа сесії)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів чи виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, span-и моделей та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви вибрали.

## Каталог подій діагностики

Наведені нижче події лежать в основі метрик і span-ів вище. Plugin-и також можуть підписуватися
на них напряму без експорту OTLP.

**Використання моделі**

- `model.usage` — токени, вартість, тривалість, контекст, provider/model/channel,
  ідентифікатори сесії. `usage` — це облік provider/циклу для вартості та телеметрії;
  `context.used` — це поточний snapshot prompt/контексту і він може бути меншим за
  `usage.total` provider, коли задіяно кешований вхід або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сесія**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (агреговані лічильники: webhook-и/черга/сесія)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  життєвий цикл окремого запуску для harness агента. Містить `harnessId`, необов’язковий
  `pluginId`, provider/model/channel та ідентифікатор запуску. Завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` — термінальний результат, тривалість, ціль, режим, код
  завершення та тип помилки. Текст команди і робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити події діагностики доступними для Plugin-ів або власних приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового виводу налагодження без підвищення `logging.level` використовуйте
прапорці діагностики. Прапорці нечутливі до регістру та підтримують wildcard-и (наприклад, `telegram.*` або
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Або як одноразове перевизначення через env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вивід прапорців потрапляє до стандартного файла журналу (`logging.file`) і все ще
редагується через `logging.redactSensitive`. Повний посібник:
[Прапорці діагностики](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ви також можете не включати `diagnostics-otel` до `plugins.allow` або виконати
`openclaw plugins disable diagnostics-otel`.

## Пов’язане

- [Журналювання](/uk/logging) — файлові журнали, консольний вивід, перегляд через CLI та вкладка Logs у Control UI
- [Внутрішня архітектура журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Прапорці діагностики](/uk/diagnostics/flags) — прапорці цільових журналів налагодження
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент support bundle для операторів (окремо від експорту OTEL)
- [Довідка з конфігурації](/uk/gateway/configuration-reference#diagnostics) — повна довідка по полях `diagnostics.*`
