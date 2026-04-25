---
read_when:
    - Вам потрібен огляд журналювання, зрозумілий для початківців
    - Ви хочете налаштувати рівні журналювання або формати
    - Ви усуваєте несправності й хочете швидко знайти журнали
summary: 'Огляд журналювання: журнали файлів, виведення в консоль, перегляд журналів у CLI та інтерфейс Control UI'
title: Огляд журналювання
x-i18n:
    generated_at: "2026-04-25T18:41:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 745c14ef9ca008d43a0f4f2d5c051ec6bafbe5249e1a1753448182fff72afd6e
    source_path: logging.md
    workflow: 15
---

# Журналювання

OpenClaw має дві основні поверхні журналювання:

- **Файлові журнали** (рядки JSON), які записує Gateway.
- **Виведення в консоль**, яке показується в терміналах і в інтерфейсі Gateway Debug UI.

Вкладка **Logs** в Control UI відстежує файловий журнал gateway. На цій сторінці пояснюється, де зберігаються журнали, як їх читати та як налаштовувати рівні й формати журналювання.

## Де зберігаються журнали

За замовчуванням Gateway записує циклічний файл журналу в:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Дата використовує локальний часовий пояс хоста gateway.

Ви можете перевизначити це в `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Як читати журнали

### CLI: перегляд у реальному часі (рекомендовано)

Використовуйте CLI, щоб відстежувати файл журналу gateway через RPC:

```bash
openclaw logs --follow
```

Корисні поточні параметри:

- `--local-time`: відображати часові мітки у вашому локальному часовому поясі
- `--url <url>` / `--token <token>` / `--timeout <ms>`: стандартні прапорці Gateway RPC
- `--expect-final`: прапорець очікування фінальної відповіді для RPC на базі агента (приймається тут через спільний клієнтський шар)

Режими виведення:

- **Сеанси TTY**: зручні для читання, кольорові, структуровані рядки журналу.
- **Сеанси без TTY**: звичайний текст.
- `--json`: JSON із розділенням по рядках (одна подія журналу на рядок).
- `--plain`: примусово використовувати звичайний текст у сеансах TTY.
- `--no-color`: вимкнути кольори ANSI.

Коли ви передаєте явний `--url`, CLI не застосовує автоматично облікові дані з конфігурації або середовища; якщо цільовий Gateway вимагає автентифікації, додайте `--token` самостійно.

У режимі JSON CLI виводить об’єкти з тегом `type`:

- `meta`: метадані потоку (файл, курсор, розмір)
- `log`: розібраний запис журналу
- `notice`: підказки про обрізання / ротацію
- `raw`: нерозібраний рядок журналу

Якщо локальний loopback Gateway запитує сполучення, `openclaw logs` автоматично переходить до налаштованого локального файлу журналу. Явні цілі `--url` не використовують цей резервний механізм.

Якщо Gateway недоступний, CLI виводить коротку підказку виконати:

```bash
openclaw doctor
```

### Control UI (веб)

Вкладка **Logs** у Control UI відстежує той самий файл за допомогою `logs.tail`.
Див. [/web/control-ui](/uk/web/control-ui), щоб дізнатися, як її відкрити.

### Журнали лише каналів

Щоб фільтрувати активність каналів (WhatsApp/Telegram/etc), використовуйте:

```bash
openclaw channels logs --channel whatsapp
```

## Формати журналів

### Файлові журнали (JSONL)

Кожен рядок у файлі журналу — це об’єкт JSON. CLI і Control UI розбирають ці записи, щоб відображати структуроване виведення (час, рівень, підсистема, повідомлення).

### Виведення в консоль

Журнали консолі **враховують TTY** і форматуються для зручності читання:

- Префікси підсистем (наприклад, `gateway/channels/whatsapp`)
- Кольори рівнів (info/warn/error)
- Необов’язковий компактний або JSON-режим

Форматування консолі керується `logging.consoleStyle`.

### Журнали WebSocket Gateway

`openclaw gateway` також має журналювання протоколу WebSocket для трафіку RPC:

- звичайний режим: лише важливі результати (помилки, помилки розбору, повільні виклики)
- `--verbose`: увесь трафік запитів/відповідей
- `--ws-log auto|compact|full`: вибір стилю докладного відображення
- `--compact`: псевдонім для `--ws-log compact`

Приклади:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Налаштування журналювання

Усі налаштування журналювання розміщені в розділі `logging` у `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Рівні журналювання

- `logging.level`: рівень **файлових журналів** (JSONL).
- `logging.consoleLevel`: рівень докладності **консолі**.

Ви можете перевизначити обидва через змінну середовища **`OPENCLAW_LOG_LEVEL`** (наприклад, `OPENCLAW_LOG_LEVEL=debug`). Змінна середовища має вищий пріоритет за файл конфігурації, тож ви можете підвищити докладність для одного запуску без редагування `openclaw.json`. Ви також можете передати глобальний параметр CLI **`--log-level <level>`** (наприклад, `openclaw --log-level debug gateway run`), який перевизначає змінну середовища для цієї команди.

`--verbose` впливає лише на виведення в консоль і докладність журналу WS; він не змінює рівні файлового журналу.

### Стилі консолі

`logging.consoleStyle`:

- `pretty`: зручний для людей, кольоровий, із часовими мітками.
- `compact`: більш стислий вивід (найкраще для довгих сеансів).
- `json`: JSON у кожному рядку (для обробників журналів).

### Редагування чутливих даних

Підсумки інструментів можуть редагувати чутливі токени до того, як вони потраплять у консоль:

- `logging.redactSensitive`: `off` | `tools` (типово: `tools`)
- `logging.redactPatterns`: список рядків regex для перевизначення типового набору

Редагування впливає **лише на виведення в консоль** і не змінює файлові журнали.

## Діагностика + OpenTelemetry

Діагностика — це структуровані, машиночитні події для запусків моделей **і**
телеметрії потоку повідомлень (webhooks, постановка в чергу, стан сеансу). Вони **не** замінюють журнали; вони існують для подачі метрик, трасувань та інших експортерів.

Події діагностики створюються всередині процесу, але експортери підключаються лише тоді, коли ввімкнено діагностику та plugin експортера.

### OpenTelemetry проти OTLP

- **OpenTelemetry (OTel)**: модель даних і SDK для трасувань, метрик і журналів.
- **OTLP**: мережевий протокол, який використовується для експорту даних OTel у collector/backend.
- OpenClaw наразі експортує через **OTLP/HTTP (protobuf)**.

### Експортовані сигнали

- **Метрики**: лічильники та гістограми (використання токенів, потік повідомлень, постановка в чергу).
- **Трасування**: spans для використання моделей і обробки webhook/повідомлень.
- **Журнали**: експортуються через OTLP, коли ввімкнено `diagnostics.otel.logs`. Обсяг журналів може бути великим; зважайте на `logging.level` і фільтри експортера.

### Каталог подій діагностики

Використання моделей:

- `model.usage`: токени, вартість, тривалість, контекст, provider/model/channel, ідентифікатори сеансів.

Потік повідомлень:

- `webhook.received`: вхідний webhook для кожного каналу.
- `webhook.processed`: оброблений webhook + тривалість.
- `webhook.error`: помилки обробника webhook.
- `message.queued`: повідомлення поставлено в чергу для обробки.
- `message.processed`: результат + тривалість + необов’язкова помилка.
- `message.delivery.started`: розпочато спробу вихідної доставки.
- `message.delivery.completed`: завершено спробу вихідної доставки + тривалість/кількість результатів.
- `message.delivery.error`: помилка спроби вихідної доставки + тривалість/обмежена категорія помилки.

Черга + сеанс:

- `queue.lane.enqueue`: додавання в lane черги команд + глибина.
- `queue.lane.dequeue`: вилучення з lane черги команд + час очікування.
- `session.state`: перехід стану сеансу + причина.
- `session.stuck`: попередження про завислий сеанс + вік.
- `run.attempt`: метадані повторної спроби/спроби запуску.
- `diagnostic.heartbeat`: агреговані лічильники (webhooks/черга/сеанс).

Exec:

- `exec.process.completed`: результат процесу terminal exec, тривалість, ціль, режим,
  код завершення та тип збою. Текст команди й робочі каталоги не
  включаються.

### Увімкнення діагностики (без експортера)

Використовуйте це, якщо хочете, щоб події діагностики були доступні plugin-ам або користувацьким sinks:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Прапорці діагностики (цільові журнали)

Використовуйте прапорці, щоб увімкнути додаткові, цільові журнали налагодження без підвищення `logging.level`.
Прапорці нечутливі до регістру та підтримують wildcard-шаблони (наприклад, `telegram.*` або `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Перевизначення через змінну середовища (разово):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Примітки:

- Журнали за прапорцями записуються у стандартний файл журналу (той самий, що й `logging.file`).
- Виведення все одно редагується відповідно до `logging.redactSensitive`.
- Повний посібник: [/diagnostics/flags](/uk/diagnostics/flags).

### Експорт до OpenTelemetry

Діагностику можна експортувати через plugin `diagnostics-otel` (OTLP/HTTP). Це
працює з будь-яким collector/backend OpenTelemetry, який приймає OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Примітки:

- Ви також можете ввімкнути plugin за допомогою `openclaw plugins enable diagnostics-otel`.
- `protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
- Метрики включають використання токенів, вартість, розмір контексту, тривалість запуску та лічильники/гістограми потоку повідомлень (webhooks, постановка в чергу, стан сеансу, глибина/очікування черги).
- Трасування/метрики можна перемикати через `traces` / `metrics` (типово: увімкнено). Трасування включають spans використання моделей, а також spans обробки webhook/повідомлень, коли це ввімкнено.
- Необроблений вміст моделей/інструментів типово не експортується. Використовуйте
  `diagnostics.otel.captureContent` лише тоді, коли ваші правила щодо collector і зберігання
  схвалюють текст підказок, відповідей, інструментів або системних підказок.
- Установіть `headers`, якщо ваш collector вимагає автентифікації.
- Підтримувані змінні середовища: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Установіть `OPENCLAW_OTEL_PRELOADED=1`, коли інше попереднє завантаження або хост-процес уже
  зареєстрували глобальний SDK OpenTelemetry. У цьому режимі plugin не запускає
  і не завершує власний SDK, але все одно підключає слухачі діагностики OpenClaw і
  дотримується `diagnostics.otel.traces`, `metrics` і `logs`.

### Експортовані метрики (назви + типи)

Використання моделей:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, метрика семантичних конвенцій GenAI,
  attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.system`,
  `gen_ai.operation.name`, `gen_ai.request.model`)

Потік повідомлень:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Черги + сеанси:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` або
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

Внутрішні компоненти діагностики (пам’ять + цикл інструментів):

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`,
  `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`,
  `openclaw.outcome`)

### Експортовані spans (назви + ключові атрибути)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`, `openclaw.provider.request_id_hash` (обмежений
    SHA-хеш ідентифікатора запиту до висхідного provider; необроблені id не
    експортуються)
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`,
    `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту prompt,
    history, response або ключа сеансу)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`,
    `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`,
    `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, spans моделей/інструментів також можуть містити
обмежені, відредаговані атрибути `openclaw.content.*` для конкретних класів вмісту,
які ви вирішили включити.

### Семплювання + скидання

- Семплювання трасувань: `diagnostics.otel.sampleRate` (0.0–1.0, лише root spans).
- Інтервал експорту метрик: `diagnostics.otel.flushIntervalMs` (мінімум 1000 мс).

### Примітки щодо протоколу

- Кінцеві точки OTLP/HTTP можна задавати через `diagnostics.otel.endpoint` або
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Якщо кінцева точка вже містить `/v1/traces` або `/v1/metrics`, вона використовується як є.
- Якщо кінцева точка вже містить `/v1/logs`, вона використовується як є для журналів.
- `OPENCLAW_OTEL_PRELOADED=1` повторно використовує зовнішньо зареєстрований SDK OpenTelemetry
  для трасувань/метрик замість запуску NodeSDK, що належить plugin-у.
- `diagnostics.otel.logs` вмикає експорт журналів OTLP для виведення основного логера.

### Поведінка експорту журналів

- Журнали OTLP використовують ті самі структуровані записи, що записуються в `logging.file`.
- Дотримуються `logging.level` (рівень файлового журналу). Редагування консолі **не** застосовується
  до журналів OTLP.
- Для інсталяцій із великим обсягом даних краще використовувати семплювання/фільтрацію на рівні OTLP collector.

## Поради з усунення несправностей

- **Gateway недоступний?** Спочатку виконайте `openclaw doctor`.
- **Журнали порожні?** Перевірте, що Gateway запущений і записує у шлях до файлу,
  вказаний у `logging.file`.
- **Потрібно більше деталей?** Установіть `logging.level` у `debug` або `trace` і повторіть спробу.

## Пов’язане

- [Внутрішня будова журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностика](/uk/gateway/configuration-reference#diagnostics) — експорт OpenTelemetry і конфігурація трасування кешу
