---
read_when:
    - Ви хочете надсилати використання моделей OpenClaw, потік повідомлень або метрики сесій до збирача OpenTelemetry
    - Ви підключаєте трасування, метрики або журнали до Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого OTLP-бекенду
    - Вам потрібні точні назви метрик, назви спанів або форми атрибутів, щоб створювати інформаційні панелі чи сповіщення
summary: Експортуйте діагностичні дані OpenClaw до будь-якого збирача OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T07:48:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw експортує діагностичні дані через вбудований Plugin `diagnostics-otel`
з використанням **OTLP/HTTP (protobuf)**. Будь-який збирач або бекенд, який приймає OTLP/HTTP,
працює без змін у коді. Про локальні файлові журнали та спосіб їх читання див.
[Журналювання](/uk/logging).

## Як це працює разом

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які
  Gateway і вбудовані Plugin-и генерують для запусків моделей, потоку повідомлень, сесій, черг
  і exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трасування** і **журнали** через OTLP/HTTP.
- **Виклики провайдерів** отримують заголовок W3C `traceparent` із довіреного
  контексту спана виклику моделі OpenClaw, коли транспорт провайдера приймає власні
  заголовки. Контекст трасування, згенерований Plugin-ом, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнено і поверхню діагностики, і Plugin,
  тому внутрішньопроцесні витрати за замовчуванням залишаються майже нульовими.

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

| Signal      | Що до нього входить                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, смуг черг, стану сесій, exec і тиску на пам’ять. |
| **Traces**  | Спани для використання моделі, викликів моделі, життєвого циклу harness, виконання інструментів, exec, обробки webhook/повідомлень, збирання контексту та циклів інструментів. |
| **Logs**    | Структуровані записи `logging.file`, експортовані через OTLP, коли ввімкнено `diagnostics.otel.logs`.                                   |

Параметри `traces`, `metrics` і `logs` можна перемикати незалежно. Усі три за замовчуванням увімкнені,
коли `diagnostics.otel.enabled` має значення true.

## Довідник конфігурації

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
      protocol: "http/protobuf", // grpc ігнорується
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // семплер кореневих спанів, 0.0..1.0
      flushIntervalMs: 60000, // інтервал експорту метрик (мінімум 1000 мс)
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

| Variable                                                                                                          | Призначення                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Перевизначає `diagnostics.otel.endpoint`. Якщо значення вже містить `/v1/traces`, `/v1/metrics` або `/v1/logs`, воно використовується як є.                                                                                                |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення кінцевих точок для окремих сигналів, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація для окремого сигналу має пріоритет над змінною середовища для окремого сигналу, яка має пріоритет над спільною кінцевою точкою. |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає wire protocol (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть значення `gen_ai_latest_experimental`, щоб виводити найновіший експериментальний атрибут спана GenAI (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть значення `1`, якщо інший preload або хостовий процес уже зареєстрував глобальний SDK OpenTelemetry. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає слухачі діагностики та враховує `traces`/`metrics`/`logs`. |

## Конфіденційність і захоплення вмісту

Сирий вміст моделі/інструментів **не** експортується за замовчуванням. Спани містять обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, лише хешовані request id)
і ніколи не включають текст підказки, текст відповіді, входи інструментів, виходи інструментів або
ключі сесій.

Вихідні запити до моделі можуть містити заголовок W3C `traceparent`. Цей заголовок
генерується лише з контексту діагностичного трасування, що належить OpenClaw, для активного виклику
моделі. Наявні заголовки `traceparent`, надані викликачем, замінюються, тому Plugin-и або
власні параметри провайдера не можуть підробити походження трасування між сервісами.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш збирач і
політика зберігання схвалені для тексту підказок, відповідей, інструментів або системних підказок.
Кожен підключ окремо вимагає явного ввімкнення:

- `inputMessages` — вміст підказок користувача.
- `outputMessages` — вміст відповідей моделі.
- `toolInputs` — навантаження аргументів інструментів.
- `toolOutputs` — навантаження результатів інструментів.
- `systemPrompt` — зібрана системна/розробницька підказка.

Коли будь-який підключ увімкнено, спани моделі й інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Traces:** `diagnostics.otel.sampleRate` (лише для кореневих спанів, `0.0` відкидає всі,
  `1.0` зберігає всі).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Logs:** Журнали OTLP враховують `logging.level` (рівень файлового журналу). До
  журналів OTLP **не** застосовується редагування консолі. Для інсталяцій із великим обсягом
  даних краще використовувати семплювання/фільтрацію на рівні збирача OTLP замість локального семплювання.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язково `error.type`)

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

## Експортовані спани

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, якщо ввімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, якщо ввімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (обмежений SHA-хеш ідентифікатора запиту до зовнішнього провайдера; сирі ID не експортуються)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Після завершення: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту підказки, історії, відповіді або ключа сесії)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Якщо захоплення вмісту явно ввімкнено, спани моделей та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви дозволили.

## Каталог діагностичних подій

Події нижче лежать в основі наведених вище метрик і спанів. Plugin-и також можуть підписуватися
на них безпосередньо без експорту OTLP.

**Використання моделі**

- `model.usage` — токени, вартість, тривалість, контекст, провайдер/модель/канал,
  ID сесій. `usage` — це облік провайдера/ходу для вартості та телеметрії;
  `context.used` — поточний знімок підказки/контексту, який може бути меншим за
  `usage.total` провайдера, коли задіяно кешоване введення або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сесія**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (агреговані лічильники: webhook/черга/сесія)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  життєвий цикл одного запуску для harness агента. Містить `harnessId`, необов’язковий
  `pluginId`, провайдер/модель/канал і ID запуску. Подія завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`
  та лічильники `itemLifecycle`. Події помилок додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` — кінцевий результат, тривалість, ціль, режим, код
  завершення та тип збою. Текст команди та робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для Plugin-ів або власних приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового виводу налагодження без підвищення `logging.level` використовуйте
прапорці діагностики. Прапорці нечутливі до регістру та підтримують шаблони з wildcard (наприклад, `telegram.*` або
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Або як одноразове перевизначення через змінну середовища:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вивід прапорців спрямовується до стандартного файлу журналу (`logging.file`) і все ще
редагується через `logging.redactSensitive`. Повний посібник:
[Прапорці діагностики](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ви також можете не додавати `diagnostics-otel` до `plugins.allow` або виконати
`openclaw plugins disable diagnostics-otel`.

## Пов’язані матеріали

- [Журналювання](/uk/logging) — файлові журнали, консольний вивід, перегляд через CLI та вкладка Logs у Control UI
- [Внутрішні механізми журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Прапорці діагностики](/uk/diagnostics/flags) — прапорці для цільового налагоджувального журналювання
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент support bundle для операторів (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) — повний довідник полів `diagnostics.*`
