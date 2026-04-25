---
read_when:
    - Вам потрібен огляд журналювання, зрозумілий для початківців
    - Ви хочете налаштувати рівні журналювання або формати
    - Ви усуваєте несправності й хочете швидко знайти журнали
summary: 'Огляд журналювання: файлові журнали, виведення в консоль, перегляд журналів у CLI та Control UI'
title: Огляд журналювання
x-i18n:
    generated_at: "2026-04-25T07:28:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1a8ec7992c0c1b59036ccfd2b6d1d844c68f78cec14ff8eebddeac67f3fc607
    source_path: logging.md
    workflow: 15
---

# Журналювання

OpenClaw має дві основні поверхні журналювання:

- **Файлові журнали** (рядки JSON), які записує Gateway.
- **Виведення в консоль**, яке показується в терміналах і в Gateway Debug UI.

Вкладка **Logs** у Control UI виконує `tail` журналу файлу gateway. На цій сторінці пояснюється, де зберігаються журнали, як їх читати та як налаштовувати рівні й формати журналювання.

## Де зберігаються журнали

За замовчуванням Gateway записує циклічний файл журналу в:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Дата використовує локальний часовий пояс хоста gateway.

Ви можете змінити це в `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Як читати журнали

### CLI: live tail (рекомендовано)

Використовуйте CLI, щоб виконувати `tail` файла журналу gateway через RPC:

```bash
openclaw logs --follow
```

Корисні поточні параметри:

- `--local-time`: відображати часові мітки у вашому локальному часовому поясі
- `--url <url>` / `--token <token>` / `--timeout <ms>`: стандартні прапорці Gateway RPC
- `--expect-final`: прапорець очікування фінальної відповіді для RPC на основі агента (приймається тут через спільний клієнтський шар)

Режими виведення:

- **TTY-сеанси**: гарні, кольорові, структуровані рядки журналу.
- **Не-TTY сеанси**: звичайний текст.
- `--json`: JSON із розділенням по рядках (одна подія журналу на рядок).
- `--plain`: примусово вмикає звичайний текст у TTY-сеансах.
- `--no-color`: вимикає ANSI-кольори.

Коли ви передаєте явний `--url`, CLI не застосовує автоматично облікові дані з конфігурації або середовища; самостійно додайте `--token`, якщо цільовий Gateway вимагає автентифікації.

У режимі JSON CLI виводить об’єкти з тегом `type`:

- `meta`: метадані потоку (файл, курсор, розмір)
- `log`: розібраний запис журналу
- `notice`: підказки про обрізання / ротацію
- `raw`: нерозібраний рядок журналу

Якщо local loopback Gateway запитує сполучення, `openclaw logs` автоматично переходить до налаштованого локального файла журналу. Для явних цілей `--url` цей резервний варіант не використовується.

Якщо Gateway недоступний, CLI виводить коротку підказку запустити:

```bash
openclaw doctor
```

### Control UI (веб)

Вкладка **Logs** у Control UI виконує `tail` того самого файла через `logs.tail`.
Див. [/web/control-ui](/uk/web/control-ui), щоб дізнатися, як її відкрити.

### Журнали лише каналів

Щоб відфільтрувати активність каналу (WhatsApp/Telegram тощо), використовуйте:

```bash
openclaw channels logs --channel whatsapp
```

## Формати журналів

### Файлові журнали (JSONL)

Кожен рядок у файлі журналу — це об’єкт JSON. CLI і Control UI розбирають ці записи, щоб відображати структуроване виведення (час, рівень, підсистема, повідомлення).

### Виведення в консоль

Журнали консолі **враховують TTY** і форматуються для зручності читання:

- Префікси підсистем (наприклад, `gateway/channels/whatsapp`)
- Кольорове виділення рівнів (info/warn/error)
- Необов’язковий компактний або JSON-режим

Форматування консолі керується через `logging.consoleStyle`.

### Журнали WebSocket Gateway

`openclaw gateway` також має журналювання протоколу WebSocket для трафіку RPC:

- звичайний режим: лише цікаві результати (помилки, помилки розбору, повільні виклики)
- `--verbose`: увесь трафік запитів/відповідей
- `--ws-log auto|compact|full`: вибір стилю відображення в докладному режимі
- `--compact`: псевдонім для `--ws-log compact`

Приклади:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Налаштування журналювання

Усі налаштування журналювання розміщені в `logging` у `~/.openclaw/openclaw.json`.

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
- `logging.consoleLevel`: рівень деталізації **консолі**.

Ви можете перевизначити обидва через змінну середовища **`OPENCLAW_LOG_LEVEL`** (наприклад, `OPENCLAW_LOG_LEVEL=debug`). Змінна середовища має пріоритет над файлом конфігурації, тож ви можете підвищити деталізацію для одного запуску без редагування `openclaw.json`. Ви також можете передати глобальний параметр CLI **`--log-level <level>`** (наприклад, `openclaw --log-level debug gateway run`), який перевизначить змінну середовища для цієї команди.

`--verbose` впливає лише на виведення в консоль і деталізацію журналів WS; він не змінює рівні файлових журналів.

### Стилі консолі

`logging.consoleStyle`:

- `pretty`: зручний для читання людиною, кольоровий, із часовими мітками.
- `compact`: щільніше виведення (найкраще для довгих сеансів).
- `json`: JSON у кожному рядку (для обробників журналів).

### Редагування чутливих даних

Підсумки інструментів можуть редагувати чутливі токени до того, як вони потраплять у консоль:

- `logging.redactSensitive`: `off` | `tools` (типово: `tools`)
- `logging.redactPatterns`: список рядків regex для перевизначення типового набору

Редагування впливає **лише на виведення в консоль** і не змінює файлові журнали.

## Діагностика + OpenTelemetry

Діагностика — це структуровані, машиночитані події для запусків моделей **і**
телеметрії потоку повідомлень (webhooks, постановка в чергу, стан сеансу). Вони **не**
замінюють журнали; вони існують для передачі даних у метрики, трасування та інші експортери.

Події діагностики генеруються в процесі, але експортери підключаються лише тоді, коли
увімкнено діагностику + Plugin експортера.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: модель даних + SDK для трасувань, метрик і журналів.
- **OTLP**: wire-протокол, який використовується для експорту даних OTel до колектора/бекенда.
- OpenClaw сьогодні експортує через **OTLP/HTTP (protobuf)**.

### Експортовані сигнали

- **Метрики**: лічильники + гістограми (використання токенів, потік повідомлень, черги).
- **Трасування**: spans для використання моделі + обробки webhook/повідомлень.
- **Журнали**: експортуються через OTLP, коли ввімкнено `diagnostics.otel.logs`. Обсяг журналів
  може бути великим; зважайте на `logging.level` і фільтри експортера.

### Каталог подій діагностики

Використання моделі:

- `model.usage`: токени, вартість, тривалість, контекст, провайдер/модель/канал, id сеансу.

Потік повідомлень:

- `webhook.received`: вхід webhook для кожного каналу.
- `webhook.processed`: webhook оброблено + тривалість.
- `webhook.error`: помилки обробника webhook.
- `message.queued`: повідомлення додано в чергу на обробку.
- `message.processed`: результат + тривалість + необов’язкова помилка.

Черга + сеанс:

- `queue.lane.enqueue`: додавання в lane черги команд + глибина.
- `queue.lane.dequeue`: видалення з lane черги команд + час очікування.
- `session.state`: перехід стану сеансу + причина.
- `session.stuck`: попередження про зависання сеансу + вік.
- `run.attempt`: метадані повторної спроби/спроби запуску.
- `diagnostic.heartbeat`: агреговані лічильники (webhooks/черга/сеанс).

Exec:

- `exec.process.completed`: результат процесу terminal exec, тривалість, ціль, режим,
  код виходу та тип помилки. Текст команди й робочі каталоги не
  включаються.

### Увімкнення діагностики (без експортера)

Використовуйте це, якщо хочете, щоб події діагностики були доступні Plugin-ам або користувацьким приймачам:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Прапорці діагностики (цільові журнали)

Використовуйте прапорці, щоб увімкнути додаткові, цільові журнали налагодження без підвищення `logging.level`.
Прапорці нечутливі до регістру та підтримують wildcards (наприклад, `telegram.*` або `*`).

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

- Журнали прапорців записуються до стандартного файла журналу (того самого, що й `logging.file`).
- Виведення все одно редагується згідно з `logging.redactSensitive`.
- Повний посібник: [/diagnostics/flags](/uk/diagnostics/flags).

### Експорт до OpenTelemetry

Діагностику можна експортувати через Plugin `diagnostics-otel` (OTLP/HTTP). Це
працює з будь-яким колектором/бекендом OpenTelemetry, який приймає OTLP/HTTP.

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

- Ви також можете ввімкнути Plugin за допомогою `openclaw plugins enable diagnostics-otel`.
- `protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
- Метрики включають використання токенів, вартість, розмір контексту, тривалість запуску та
  лічильники/гістограми потоку повідомлень (webhooks, черги, стан сеансу, глибина/очікування черги).
- Трасування/метрики можна вмикати й вимикати через `traces` / `metrics` (типово: увімкнено). Трасування
  включають spans використання моделі, а також spans обробки webhook/повідомлень, коли це ввімкнено.
- Необроблений вміст моделі/інструмента типово не експортується. Використовуйте
  `diagnostics.otel.captureContent` лише тоді, коли ваш колектор і політика зберігання
  схвалені для тексту prompt, відповіді, інструмента або системного prompt.
- Установіть `headers`, якщо ваш колектор вимагає автентифікації.
- Підтримувані змінні середовища: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Установіть `OPENCLAW_OTEL_PRELOADED=1`, якщо інше попереднє завантаження або хост-процес уже
  зареєстрували глобальний SDK OpenTelemetry. У цьому режимі Plugin не запускає
  і не зупиняє власний SDK, але все одно підключає слухачі діагностики OpenClaw і
  дотримується `diagnostics.otel.traces`, `metrics` і `logs`.

### Експортовані метрики (назви + типи)

Використання моделі:

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Потік повідомлень:

- `openclaw.webhook.received` (лічильник, атрибути: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (лічильник, атрибути: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гістограма, атрибути: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (лічильник, атрибути: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (лічильник, атрибути: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (гістограма, атрибути: `openclaw.channel`,
  `openclaw.outcome`)

Черги + сеанси:

- `openclaw.queue.lane.enqueue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, атрибути: `openclaw.lane` або
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, атрибути: `openclaw.lane`)
- `openclaw.session.state` (лічильник, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

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
    `openclaw.transport`
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
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

Коли захоплення вмісту явно ввімкнене, spans моделі/інструмента також можуть містити
обмежені, відредаговані атрибути `openclaw.content.*` для конкретних класів вмісту,
які ви явно ввімкнули.

### Вибірка + скидання

- Вибірка трасувань: `diagnostics.otel.sampleRate` (0.0–1.0, лише кореневі spans).
- Інтервал експорту метрик: `diagnostics.otel.flushIntervalMs` (мінімум 1000 мс).

### Примітки щодо протоколу

- Кінцеві точки OTLP/HTTP можна задавати через `diagnostics.otel.endpoint` або
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Якщо кінцева точка вже містить `/v1/traces` або `/v1/metrics`, вона використовується як є.
- Якщо кінцева точка вже містить `/v1/logs`, вона використовується як є для журналів.
- `OPENCLAW_OTEL_PRELOADED=1` повторно використовує зовнішньо зареєстрований SDK OpenTelemetry
  для трасувань/метрик замість запуску NodeSDK, яким володіє Plugin.
- `diagnostics.otel.logs` вмикає експорт журналів OTLP для виведення основного журналу.

### Поведінка експорту журналів

- Журнали OTLP використовують ті самі структуровані записи, що записуються в `logging.file`.
- Дотримуються `logging.level` (рівень файлових журналів). Редагування консолі **не** застосовується
  до журналів OTLP.
- Для інсталяцій із великим обсягом даних варто віддавати перевагу вибірці/фільтрації на боці OTLP-колектора.

## Поради з усунення несправностей

- **Gateway недоступний?** Спочатку виконайте `openclaw doctor`.
- **Журнали порожні?** Перевірте, що Gateway запущено і він записує у шлях файла,
  вказаний у `logging.file`.
- **Потрібно більше деталей?** Установіть `logging.level` у `debug` або `trace` і повторіть спробу.

## Пов’язане

- [Внутрішня будова журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностика](/uk/gateway/configuration-reference#diagnostics) — експорт OpenTelemetry і конфігурація трасування кешу
