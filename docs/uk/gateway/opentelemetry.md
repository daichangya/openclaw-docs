---
read_when:
    - Ви хочете надсилати використання моделей OpenClaw, потік повідомлень або метрики сеансів до збирача OpenTelemetry
    - Ви налаштовуєте трасування, метрики або журнали для Grafana, Datadog, Honeycomb, New Relic, Tempo або іншого бекенда OTLP
    - Вам потрібні точні назви метрик, назви спанів або форми атрибутів, щоб створювати інформаційні панелі чи сповіщення
summary: Експортуйте діагностику OpenClaw до будь-якого збирача OpenTelemetry через plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-04-25T23:50:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d478625ec525e76993d0a587b3aa8bc1c98a4d66d1ae8990316be241d3dc96a4
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw експортує діагностику через вбудований plugin `diagnostics-otel`
за допомогою **OTLP/HTTP (protobuf)**. Будь-який збирач або бекенд, що приймає OTLP/HTTP,
працює без змін у коді. Про локальні файлові журнали та те, як їх читати, див.
у [Журналюванні](/uk/logging).

## Як це працює разом

- **Події діагностики** — це структуровані внутрішньопроцесні записи, які створюються
  Gateway і вбудованими plugin для запусків моделей, потоку повідомлень, сеансів, черг
  та exec.
- **plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трасування** і **журнали** через OTLP/HTTP.
- Експортери підключаються лише тоді, коли увімкнено і поверхню діагностики, і plugin,
  тому внутрішньопроцесні витрати за замовчуванням залишаються майже нульовими.

## Швидкий початок

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

Ви також можете увімкнути plugin з CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, смуг черги, стану сеансу, exec і тиску на пам’ять. |
| **Трасування**  | Спани для використання моделей, викликів моделей, виконання інструментів, exec, обробки Webhook/повідомлень, збирання контексту та циклів інструментів.           |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP, коли увімкнено `diagnostics.otel.logs`.                                     |

Перемикайте `traces`, `metrics` і `logs` незалежно. Усі три параметри за замовчуванням
увімкнені, коли `diagnostics.otel.enabled` має значення true.

## Довідник з конфігурації

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf", // grpc ігнорується
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // семплер кореневого спану, 0.0..1.0
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

| Variable                        | Призначення                                                                                                                                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`   | Перевизначає `diagnostics.otel.endpoint`. Якщо значення вже містить `/v1/traces`, `/v1/metrics` або `/v1/logs`, воно використовується як є.                                                                                                          |
| `OTEL_SERVICE_NAME`             | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`   | Перевизначає дротовий протокол (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | Установіть значення `gen_ai_latest_experimental`, щоб надсилати найновіший експериментальний атрибут GenAI для спанів (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`       | Установіть значення `1`, якщо інший preload або хост-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає слухачі діагностики та враховує `traces`/`metrics`/`logs`.                |

## Конфіденційність і захоплення вмісту

Необроблений вміст моделі/інструментів **не** експортується за замовчуванням. Спани містять обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, ідентифікатори запитів лише у вигляді хешів)
і ніколи не включають текст підказки, текст відповіді, входи інструментів, виходи інструментів або ключі сеансу.

Установлюйте `diagnostics.otel.captureContent.*` у значення `true` лише тоді, коли ваш збирач і
політика зберігання схвалені для тексту підказок, відповідей, інструментів або системних підказок.
Кожен вкладений ключ підключається незалежно:

- `inputMessages` — вміст користувацької підказки.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — корисні навантаження аргументів інструментів.
- `toolOutputs` — корисні навантаження результатів інструментів.
- `systemPrompt` — зібрана системна/розробницька підказка.

Коли увімкнено будь-який вкладений ключ, спани моделей та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Трасування:** `diagnostics.otel.sampleRate` (лише для кореневого спану, `0.0` відкидає все,
  `1.0` зберігає все).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** журнали OTLP враховують `logging.level` (рівень файлового журналу). До
  журналів OTLP **не** застосовується редагування для консолі. Інсталяціям із великим
  обсягом даних варто віддавати перевагу семплюванню/фільтруванню на рівні OTLP-збирача,
  а не локальному семплюванню.

## Експортовані метрики

### Використання моделей

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних угод GenAI, атрибути: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних угод GenAI, атрибути: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)

### Потік повідомлень

- `openclaw.webhook.received` (лічильник, атрибути: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (лічильник, атрибути: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (лічильник, атрибути: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (лічильник, атрибути: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (лічильник, атрибути: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Черги та сеанси

- `openclaw.queue.lane.enqueue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, атрибути: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, атрибути: `openclaw.lane`)
- `openclaw.session.state` (лічильник, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

### Exec

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішні метрики діагностики (пам’ять і цикл інструментів)

- `openclaw.memory.heap_used_bytes` (гістограма, атрибути: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, атрибути: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, атрибути: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані спани

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` за замовчуванням, або `gen_ai.provider.name`, якщо ввімкнено найновіші семантичні угоди GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` за замовчуванням, або `gen_ai.provider.name`, якщо ввімкнено найновіші семантичні угоди GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (обмежений хеш на основі SHA для ідентифікатора запиту до зовнішнього провайдера; сирі ідентифікатори не експортуються)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту підказки, історії, відповіді або ключа сеансу)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, спани моделей та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви ввімкнули.

## Каталог подій діагностики

Події нижче є основою для метрик і спанів вище. Plugin також можуть підписуватися
на них напряму без експорту через OTLP.

**Використання моделей**

- `model.usage` — токени, вартість, тривалість, контекст, провайдер/модель/канал,
  ідентифікатори сеансів. `usage` — це облік провайдера/ходу для вартості й телеметрії;
  `context.used` — це знімок поточного prompt/контексту, і він може бути меншим за
  `usage.total` провайдера, коли задіяно кешований вхід або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сеанс**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (агреговані лічильники: Webhook/черга/сеанс)

**Exec**

- `exec.process.completed` — фінальний результат, тривалість, ціль, режим, код
  виходу та тип збою. Текст команди й робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити події діагностики доступними для plugin або користувацьких приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового виводу налагодження без підвищення `logging.level` використовуйте
прапори діагностики. Прапори нечутливі до регістру та підтримують шаблони (наприклад, `telegram.*` або
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

Вивід прапорів записується до стандартного файлу журналу (`logging.file`) і все ще
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

- [Журналювання](/uk/logging) — файлові журнали, консольний вивід, tailing у CLI та вкладка Logs у Control UI
- [Внутрішня структура журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Прапори діагностики](/uk/diagnostics/flags) — прапори цільового журналювання налагодження
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент пакета підтримки для операторів (окремо від експорту OTEL)
- [Довідник з конфігурації](/uk/gateway/configuration-reference#diagnostics) — повний довідник з полів `diagnostics.*`
