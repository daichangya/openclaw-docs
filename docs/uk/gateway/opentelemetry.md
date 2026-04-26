---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сесій до колектора OpenTelemetry
    - Ви налаштовуєте трасування, метрики або логи для Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого OTLP-бекенда
    - Вам потрібні точні назви метрик, назви спанів або форми атрибутів, щоб створювати панелі моніторингу чи сповіщення
summary: Експортуйте діагностику OpenClaw до будь-якого колектора OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: експорт OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T04:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f2389c4efc2984d27e571152ce3cfea2ffeddc99084695f1c6ab6c97e6b7f7b
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw експортує діагностику через вбудований Plugin `diagnostics-otel`
з використанням **OTLP/HTTP (protobuf)**. Будь-який колектор або бекенд, що приймає OTLP/HTTP,
працює без змін у коді. Для локальних файлових логів і способів їх читання див.
[Логування](/uk/logging).

## Як це працює разом

- **Події діагностики** — це структуровані внутрішньопроцесні записи, які створюються
  Gateway і вбудованими Plugin для запусків моделей, потоку повідомлень, сесій, черг
  та exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трасування** і **логи** через OTLP/HTTP.
- Експортери підключаються лише тоді, коли ввімкнено і поверхню діагностики, і Plugin,
  тож внутрішньопроцесні витрати за замовчуванням залишаються майже нульовими.

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

Ви також можете ввімкнути Plugin з CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що він містить                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запусків, потоку повідомлень, смуг черги, стану сесій, exec і тиску пам’яті. |
| **Трасування**  | Спани для використання моделей, викликів моделей, виконання інструментів, exec, обробки webhook/повідомлень, збирання контексту та циклів інструментів. |
| **Логи**    | Структуровані записи `logging.file`, експортовані через OTLP, коли ввімкнено `diagnostics.otel.logs`.                                     |

Перемикайте `traces`, `metrics` і `logs` незалежно. Усі три за замовчуванням увімкнені,
коли `diagnostics.otel.enabled` має значення true.

## Довідник з конфігурації

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

| Змінна                                                                                                          | Призначення                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Перевизначає `diagnostics.otel.endpoint`. Якщо значення вже містить `/v1/traces`, `/v1/metrics` або `/v1/logs`, воно використовується як є.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення endpoint для конкретного сигналу, що використовується, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація конкретного сигналу має пріоритет над env конкретного сигналу, а той — над спільним endpoint.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає протокол передачі даних (сьогодні враховується лише `http/protobuf`).                                                                                                                                                              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Встановіть `gen_ai_latest_experimental`, щоб виводити останній експериментальний атрибут GenAI span (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Встановіть значення `1`, якщо інший preload або хост-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає слухачі діагностики та враховує `traces`/`metrics`/`logs`.                |

## Конфіденційність і захоплення вмісту

Необроблений вміст моделі/інструментів **не** експортується за замовчуванням. Спани містять
обмежені ідентифікатори (канал, провайдер, модель, категорія помилки, лише хешовані id запитів)
і ніколи не включають текст запиту, текст відповіді, вхідні дані інструментів, вихідні дані інструментів
або ключі сесії.

Встановлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш колектор і
політика зберігання схвалені для тексту запитів, відповідей, інструментів або
системних запитів. Кожен підключ окремо вимагає явного ввімкнення:

- `inputMessages` — вміст запиту користувача.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — payload аргументів інструменту.
- `toolOutputs` — payload результатів інструменту.
- `systemPrompt` — зібраний системний/розробницький запит.

Коли ввімкнено будь-який підключ, спани моделі та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Трасування:** `diagnostics.otel.sampleRate` (лише для root-span, `0.0` відкидає все,
  `1.0` зберігає все).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Логи:** OTLP-логи враховують `logging.level` (рівень файлового логу). Редагування
  для консолі **не** застосовується до OTLP-логів. Для інсталяцій із великим обсягом даних слід
  надавати перевагу семплюванню/фільтрації колектора OTLP замість локального семплювання.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)

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
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (обмежений хеш на основі SHA для id запиту до висхідного провайдера; сирі id не експортуються)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту запиту, історії, відповіді чи ключа сесії)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструменту)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, спани моделі та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви ввімкнули.

## Каталог подій діагностики

Наведені нижче події лежать в основі наведених вище метрик і спанів. Plugin також можуть підписуватися
на них безпосередньо без експорту OTLP.

**Використання моделі**

- `model.usage` — токени, вартість, тривалість, контекст, провайдер/модель/канал,
  id сесій. `usage` — це облік провайдера/ходу для вартості й телеметрії;
  `context.used` — це поточний знімок запиту/контексту, і він може бути меншим за
  `usage.total` провайдера, коли залучено кешований ввід або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сесія**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (агреговані лічильники: webhook/черга/сесія)

**Exec**

- `exec.process.completed` — підсумковий результат, тривалість, ціль, режим, код
  завершення та тип помилки. Текст команди й робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити події діагностики доступними для Plugin або власних приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового виводу налагодження без підвищення `logging.level` використовуйте
прапори діагностики. Прапори нечутливі до регістру й підтримують шаблони (наприклад, `telegram.*` або
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

Вивід прапорів надходить до стандартного файлу журналу (`logging.file`) і все ще
редагується через `logging.redactSensitive`. Повний посібник:
[Прапори діагностики](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ви також можете не додавати `diagnostics-otel` до `plugins.allow` або виконати
`openclaw plugins disable diagnostics-otel`.

## Пов’язане

- [Логування](/uk/logging) — файлові логи, консольний вивід, tailing у CLI та вкладка Logs у Control UI
- [Внутрішня структура логування Gateway](/uk/gateway/logging) — стилі WS-логів, префікси підсистем і захоплення консолі
- [Прапори діагностики](/uk/diagnostics/flags) — прапори цільових налагоджувальних логів
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент для створення пакетів підтримки операторів (окремо від експорту OTEL)
- [Довідник з конфігурації](/uk/gateway/configuration-reference#diagnostics) — повний довідник полів `diagnostics.*`
