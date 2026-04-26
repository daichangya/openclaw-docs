---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сесій до колектора OpenTelemetry
    - Ви налаштовуєте трасування, метрики або журнали для Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого бекенда OTLP
    - Вам потрібні точні назви метрик, назви спанів або форми атрибутів, щоб створювати інформаційні панелі чи сповіщення
summary: Експортуйте діагностику OpenClaw до будь-якого колектора OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: експорт OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T21:17:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ad923fff12ff89766999370fe39a75c1aa5f386ce4641fde1c385b24439cc1b
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw експортує діагностику через вбудований Plugin `diagnostics-otel`
з використанням **OTLP/HTTP (protobuf)**. Будь-який колектор або бекенд, що приймає OTLP/HTTP,
працює без змін у коді. Для локальних файлових журналів і того, як їх читати, див.
[Журналювання](/uk/logging).

## Як це працює разом

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які створюються
  Gateway і вбудованими плагінами для запусків моделей, потоку повідомлень, сесій, черг
  та exec.
- **Plugin `diagnostics-otel`** підписується на ці події й експортує їх як
  OpenTelemetry **метрики**, **трасування** та **журнали** через OTLP/HTTP.
- **Виклики провайдера** отримують заголовок W3C `traceparent` із контексту
  довіреного span виклику моделі OpenClaw, якщо транспорт провайдера приймає власні
  заголовки. Контекст трасування, створений Plugin, не передається далі.
- Експортери підключаються лише тоді, коли увімкнено і поверхню діагностики, і Plugin,
  тому внутрішньопроцесна вартість за замовчуванням залишається майже нульовою.

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

Ви також можете увімкнути Plugin з CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, смуг черги, стану сесії, exec і тиску пам’яті. |
| **Трасування**  | Спани для використання моделей, викликів моделей, життєвого циклу harness, виконання інструментів, exec, обробки webhook/повідомлень, збирання контексту та циклів інструментів. |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP, коли ввімкнено `diagnostics.otel.logs`.                                  |

Перемикайте `traces`, `metrics` і `logs` незалежно. За замовчуванням усі три
увімкнені, коли `diagnostics.otel.enabled` має значення true.

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

| Змінна                                                                                                           | Призначення                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                    | Перевизначає `diagnostics.otel.endpoint`. Якщо значення вже містить `/v1/traces`, `/v1/metrics` або `/v1/logs`, воно використовується як є.                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення кінцевих точок для конкретних сигналів, які використовуються, коли не задано відповідний ключ конфігурації `diagnostics.otel.*Endpoint`. Конфігурація для конкретного сигналу має пріоритет над змінною середовища для конкретного сигналу, яка має пріоритет над спільною кінцевою точкою. |
| `OTEL_SERVICE_NAME`                                                                                              | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                    | Перевизначає wire protocol (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                  | Установіть значення `gen_ai_latest_experimental`, щоб виводити останній експериментальний атрибут span GenAI (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                        | Установіть значення `1`, якщо інше preload-рішення або хост-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає слухачі діагностики та враховує `traces`/`metrics`/`logs`. |

## Конфіденційність і захоплення вмісту

Необроблений вміст моделей/інструментів **не** експортується за замовчуванням. Спани містять
обмежені ідентифікатори (канал, провайдер, модель, категорія помилки, лише хешовані request id)
і ніколи не включають текст промпту, текст відповіді, вхідні дані інструментів, вихідні дані
інструментів або ключі сесій.

Вихідні запити до моделі можуть містити заголовок W3C `traceparent`. Цей заголовок
генерується лише з діагностичного контексту трасування, що належить OpenClaw, для активного виклику
моделі. Наявні заголовки `traceparent`, передані викликачем, замінюються, тому Plugins або
власні параметри провайдера не можуть підробити походження трасування між сервісами.

Установлюйте `diagnostics.otel.captureContent.*` у значення `true` лише тоді, коли ваш колектор і
політика зберігання схвалені для тексту промптів, відповідей, інструментів або системних промптів.
Кожен підключ окремо вмикається явно:

- `inputMessages` — вміст користувацького промпту.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — корисні навантаження аргументів інструментів.
- `toolOutputs` — корисні навантаження результатів інструментів.
- `systemPrompt` — зібраний системний/розробницький промпт.

Коли ввімкнено будь-який підключ, спани моделі та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Трасування:** `diagnostics.otel.sampleRate` (лише root-span, `0.0` відкидає все,
  `1.0` зберігає все).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** журнали OTLP враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичних log record, а не форматування консолі. Для інсталяцій із великим
  обсягом даних краще використовувати семплювання/фільтрацію в колекторі OTLP, а не локальне семплювання.
- **Кореляція файлових журналів:** журнали JSONL включають верхньорівневі `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналювання містить коректний
  діагностичний контекст трасування, що дає змогу обробникам журналів поєднувати локальні рядки журналу
  з експортованими спанами.
- **Кореляція запитів:** HTTP-запити Gateway і кадри WebSocket створюють внутрішню
  область трасування запиту. Журнали та діагностичні події в цій області за замовчуванням
  успадковують трасування запиту, тоді як спани запуску агента та виклику моделі
  створюються як дочірні, щоб заголовки провайдера `traceparent` залишалися в межах того самого трасування.

## Експортовані метрики

### Використання моделей

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`)
- `openclaw.model_call.request_bytes` (гістограма, розмір у байтах UTF-8 фінального payload запиту до моделі; без необробленого вмісту payload)
- `openclaw.model_call.response_bytes` (гістограма, розмір у байтах UTF-8 потокових подій відповіді моделі; без необробленого вмісту відповіді)
- `openclaw.model_call.time_to_first_byte_ms` (гістограма, час до першої потокової події відповіді)

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

- `openclaw.harness.duration_ms` (гістограма, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` для помилок)

### Exec

- `openclaw.exec.duration_ms` (гістограма, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішня діагностика (пам’ять і цикл інструментів)

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
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (обмежений хеш на основі SHA для upstream request id провайдера; сирі id не експортуються)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Під час завершення: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - У разі помилки: `openclaw.harness.phase`, `openclaw.errorCategory`, необов’язковий `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту промпту, історії, відповіді або ключа сесії)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнене, спани моделі та інструментів також можуть
включати обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, на які ви дали згоду.

## Каталог діагностичних подій

Наведені нижче події лежать в основі метрик і спанів вище. Plugins також можуть
підписуватися на них безпосередньо без експорту OTLP.

**Використання моделей**

- `model.usage` — токени, вартість, тривалість, контекст, провайдер/модель/канал,
  id сесій. `usage` — це облік провайдера/ходу для вартості й телеметрії;
  `context.used` — це поточний знімок промпту/контексту і він може бути меншим за
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
  життєвий цикл кожного запуску для harness агента. Включає `harnessId`, необов’язковий
  `pluginId`, провайдер/модель/канал і id запуску. Завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` — кінцевий результат, тривалість, ціль, режим, код
  виходу та тип збою. Текст команди й робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для Plugins або власних приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового виводу налагодження без підвищення `logging.level` використовуйте
прапорці діагностики. Прапорці нечутливі до регістру й підтримують шаблони (наприклад, `telegram.*` або
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

Вивід прапорців потрапляє до стандартного файла журналу (`logging.file`) і все ще
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

## Пов’язане

- [Журналювання](/uk/logging) — файлові журнали, вивід у консоль, перегляд через CLI та вкладка Журнали в Control UI
- [Внутрішня будова журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Прапорці діагностики](/uk/diagnostics/flags) — прапорці цільового журналювання для налагодження
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент підтримки для збору пакета даних оператора (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) — повний довідник полів `diagnostics.*`
