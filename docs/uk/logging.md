---
read_when:
    - Вам потрібен дружній до початківців огляд журналювання
    - Ви хочете налаштувати рівні журналювання або формати
    - Ви усуваєте несправності й хочете швидко знайти журнали
summary: 'Огляд журналювання: журнали файлів, вивід у консоль, відстеження в CLI та інтерфейс керування'
title: Огляд журналювання
x-i18n:
    generated_at: "2026-04-25T07:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f9593b117ef2ba76dbe91d5b38e3f463b358631961c9d44beed3aee6152f9a2
    source_path: logging.md
    workflow: 15
---

# Журналювання

OpenClaw має дві основні поверхні журналювання:

- **Журнали файлів** (рядки JSON), які записує Gateway.
- **Вивід у консоль**, що показується в терміналах і в інтерфейсі Gateway Debug UI.

Вкладка **Logs** в інтерфейсі керування відстежує файл журналу gateway. На цій сторінці пояснюється, де зберігаються журнали, як їх читати та як налаштовувати рівні й формати журналювання.

## Де зберігаються журнали

За замовчуванням Gateway записує ротаційний файл журналу в:

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

### CLI: відстеження в реальному часі (рекомендовано)

Використовуйте CLI, щоб відстежувати файл журналу gateway через RPC:

```bash
openclaw logs --follow
```

Корисні поточні параметри:

- `--local-time`: відображати часові мітки у вашому локальному часовому поясі
- `--url <url>` / `--token <token>` / `--timeout <ms>`: стандартні прапорці Gateway RPC
- `--expect-final`: прапорець очікування фінальної відповіді для RPC на основі агентів (приймається тут через спільний клієнтський шар)

Режими виводу:

- **TTY-сеанси**: гарні, кольорові, структуровані рядки журналу.
- **Не-TTY-сеанси**: звичайний текст.
- `--json`: JSON із розділенням по рядках (одна подія журналу на рядок).
- `--plain`: примусово використовувати звичайний текст у TTY-сеансах.
- `--no-color`: вимкнути ANSI-кольори.

Коли ви передаєте явний `--url`, CLI не застосовує автоматично облікові дані з конфігурації або середовища; самостійно додайте `--token`, якщо цільовий Gateway вимагає автентифікацію.

У режимі JSON CLI виводить об’єкти з тегом `type`:

- `meta`: метадані потоку (файл, курсор, розмір)
- `log`: розібраний запис журналу
- `notice`: підказки про обрізання / ротацію
- `raw`: нерозібраний рядок журналу

Якщо локальний loopback Gateway запитує pair-налаштування, `openclaw logs` автоматично перемикається на налаштований локальний файл журналу. Явні цілі `--url` не використовують цей резервний режим.

Якщо Gateway недоступний, CLI виводить коротку підказку виконати:

```bash
openclaw doctor
```

### Інтерфейс керування (веб)

Вкладка **Logs** в інтерфейсі керування відстежує той самий файл за допомогою `logs.tail`.
Див. [/web/control-ui](/uk/web/control-ui), щоб дізнатися, як його відкрити.

### Журнали лише каналів

Щоб відфільтрувати активність каналів (WhatsApp/Telegram/etc), використовуйте:

```bash
openclaw channels logs --channel whatsapp
```

## Формати журналів

### Журнали файлів (JSONL)

Кожен рядок у файлі журналу є об’єктом JSON. CLI та інтерфейс керування розбирають ці записи, щоб відображати структурований вивід (час, рівень, підсистема, повідомлення).

### Вивід у консоль

Журнали консолі **враховують TTY** і форматуються для зручності читання:

- Префікси підсистем (наприклад, `gateway/channels/whatsapp`)
- Кольорове позначення рівнів (info/warn/error)
- Необов’язковий компактний режим або режим JSON

Форматування консолі керується через `logging.consoleStyle`.

### Журнали WebSocket Gateway

`openclaw gateway` також має журналювання протоколу WebSocket для RPC-трафіку:

- звичайний режим: лише важливі результати (помилки, помилки розбору, повільні виклики)
- `--verbose`: увесь трафік запитів/відповідей
- `--ws-log auto|compact|full`: вибір стилю розширеного відображення
- `--compact`: псевдонім для `--ws-log compact`

Приклади:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Налаштування журналювання

Уся конфігурація журналювання знаходиться в розділі `logging` у `~/.openclaw/openclaw.json`.

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

- `logging.level`: рівень **журналів файлів** (JSONL).
- `logging.consoleLevel`: рівень деталізації **консолі**.

Ви можете перевизначити обидва через змінну середовища **`OPENCLAW_LOG_LEVEL`** (наприклад, `OPENCLAW_LOG_LEVEL=debug`). Змінна середовища має вищий пріоритет, ніж файл конфігурації, тому ви можете підвищити деталізацію для одного запуску без редагування `openclaw.json`. Ви також можете передати глобальний параметр CLI **`--log-level <level>`** (наприклад, `openclaw --log-level debug gateway run`), який перевизначає змінну середовища для цієї команди.

`--verbose` впливає лише на вивід у консоль і деталізацію журналів WS; він не змінює рівні журналів файлів.

### Стилі консолі

`logging.consoleStyle`:

- `pretty`: зручний для людей, кольоровий, із часовими мітками.
- `compact`: щільніший вивід (найкраще для довгих сеансів).
- `json`: JSON у кожному рядку (для обробників журналів).

### Редагування чутливих даних

Підсумки інструментів можуть приховувати чутливі токени до того, як вони потраплять у консоль:

- `logging.redactSensitive`: `off` | `tools` (типово: `tools`)
- `logging.redactPatterns`: список рядків regex для перевизначення типового набору

Редагування впливає **лише на вивід у консоль** і не змінює журнали файлів.

## Діагностика + OpenTelemetry

Діагностика — це структуровані, машиночитні події для запусків моделей **і**
телеметрії потоку повідомлень (webhook, постановка в чергу, стан сеансу). Вони **не**
замінюють журнали; вони існують для подачі метрик, трасувань та інших експортерів.

Події діагностики створюються в процесі, але експортери підключаються лише тоді, коли
увімкнено діагностику + Plugin експортера.

### OpenTelemetry і OTLP

- **OpenTelemetry (OTel)**: модель даних + SDK для трасувань, метрик і журналів.
- **OTLP**: дротовий протокол, який використовується для експорту даних OTel до збирача/бекенда.
- Сьогодні OpenClaw експортує через **OTLP/HTTP (protobuf)**.

### Експортовані сигнали

- **Metrics**: лічильники + гістограми (використання токенів, потік повідомлень, черги).
- **Traces**: span-и для використання моделей + обробки webhook/повідомлень.
- **Logs**: експортуються через OTLP, коли ввімкнено `diagnostics.otel.logs`. Обсяг журналів
  може бути великим; пам’ятайте про `logging.level` і фільтри експортера.

### Каталог подій діагностики

Використання моделі:

- `model.usage`: токени, вартість, тривалість, контекст, provider/model/channel, ідентифікатори сеансів.

Потік повідомлень:

- `webhook.received`: вхідний webhook для кожного каналу.
- `webhook.processed`: оброблений webhook + тривалість.
- `webhook.error`: помилки обробника webhook.
- `message.queued`: повідомлення поставлено в чергу на обробку.
- `message.processed`: результат + тривалість + необов’язкова помилка.

Черга + сеанс:

- `queue.lane.enqueue`: додавання в lane черги команд + глибина.
- `queue.lane.dequeue`: виймання з lane черги команд + час очікування.
- `session.state`: перехід стану сеансу + причина.
- `session.stuck`: попередження про завислий сеанс + вік.
- `run.attempt`: метадані повтору/спроби запуску.
- `diagnostic.heartbeat`: агреговані лічильники (webhook/черга/сеанс).

### Увімкнення діагностики (без експортера)

Використовуйте це, якщо хочете, щоб події діагностики були доступні для Plugin-ів або користувацьких приймачів:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Прапорці діагностики (цільові журнали)

Використовуйте прапорці, щоб увімкнути додаткові, цільові журнали налагодження без підвищення `logging.level`.
Прапорці нечутливі до регістру та підтримують шаблони (наприклад, `telegram.*` або `*`).

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

- Журнали за прапорцями записуються до стандартного файлу журналу (того самого, що й `logging.file`).
- Вивід усе одно редагується відповідно до `logging.redactSensitive`.
- Повний посібник: [/diagnostics/flags](/uk/diagnostics/flags).

### Експорт до OpenTelemetry

Діагностику можна експортувати через Plugin `diagnostics-otel` (OTLP/HTTP). Це
працює з будь-яким збирачем/бекендом OpenTelemetry, який приймає OTLP/HTTP.

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

- Ви також можете ввімкнути Plugin командою `openclaw plugins enable diagnostics-otel`.
- `protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
- Metrics включають використання токенів, вартість, розмір контексту, тривалість запуску та
  лічильники/гістограми потоку повідомлень (webhook, черги, стан сеансу, глибина/очікування черги).
- Traces/metrics можна вмикати або вимикати через `traces` / `metrics` (типово: увімкнено). Traces
  включають span-и використання моделей, а також span-и обробки webhook/повідомлень, якщо це ввімкнено.
- Сирий вміст моделі/інструментів типово не експортується. Використовуйте
  `diagnostics.otel.captureContent` лише тоді, коли ваш збирач і політика зберігання
  схвалені для тексту prompt, відповіді, інструментів або системного prompt.
- Установіть `headers`, якщо ваш збирач вимагає автентифікацію.
- Підтримувані змінні середовища: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Установіть `OPENCLAW_OTEL_PRELOADED=1`, якщо інший preload або хост-процес уже
  зареєстрував глобальний OpenTelemetry SDK. У цьому режимі Plugin не запускає
  і не завершує власний SDK, але все одно підключає слухачі діагностики OpenClaw і
  враховує `diagnostics.otel.traces`, `metrics` і `logs`.

### Експортовані metrics (назви + типи)

Використання моделі:

- `openclaw.tokens` (counter, атрибути: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, атрибути: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, атрибути: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, атрибути: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Потік повідомлень:

- `openclaw.webhook.received` (counter, атрибути: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, атрибути: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, атрибути: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, атрибути: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, атрибути: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, атрибути: `openclaw.channel`,
  `openclaw.outcome`)

Черги + сеанси:

- `openclaw.queue.lane.enqueue` (counter, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, атрибути: `openclaw.lane` або
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, атрибути: `openclaw.lane`)
- `openclaw.session.state` (counter, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, атрибути: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, атрибути: `openclaw.state`)
- `openclaw.run.attempt` (counter, атрибути: `openclaw.attempt`)

### Експортовані span-и (назви + ключові атрибути)

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

Коли захоплення вмісту явно ввімкнено, span-и моделей/інструментів також можуть містити
обмежені, відредаговані атрибути `openclaw.content.*` для конкретних класів вмісту,
які ви явно дозволили.

### Вибірка + скидання буфера

- Вибірка traces: `diagnostics.otel.sampleRate` (0.0–1.0, лише кореневі span-и).
- Інтервал експорту metrics: `diagnostics.otel.flushIntervalMs` (мінімум 1000ms).

### Примітки щодо протоколу

- Кінцеві точки OTLP/HTTP можна задати через `diagnostics.otel.endpoint` або
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Якщо кінцева точка вже містить `/v1/traces` або `/v1/metrics`, вона використовується як є.
- Якщо кінцева точка вже містить `/v1/logs`, вона використовується як є для журналів.
- `OPENCLAW_OTEL_PRELOADED=1` повторно використовує зовнішньо зареєстрований OpenTelemetry SDK
  для traces/metrics замість запуску NodeSDK, яким володіє Plugin.
- `diagnostics.otel.logs` вмикає експорт журналів OTLP для основного виводу logger.

### Поведінка експорту журналів

- Журнали OTLP використовують ті самі структуровані записи, що записуються до `logging.file`.
- Дотримуються `logging.level` (рівень журналів файлів). Редагування консолі **не** застосовується
  до журналів OTLP.
- Для інсталяцій із великим обсягом даних краще використовувати вибірку/фільтрацію на рівні OTLP collector.

## Поради з усунення несправностей

- **Gateway недоступний?** Спочатку виконайте `openclaw doctor`.
- **Журнали порожні?** Перевірте, що Gateway запущено і він записує у шлях файлу,
  вказаний у `logging.file`.
- **Потрібно більше деталей?** Установіть `logging.level` у `debug` або `trace` і повторіть спробу.

## Пов’язане

- [Внутрішня реалізація журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностика](/uk/gateway/configuration-reference#diagnostics) — експорт OpenTelemetry і конфігурація трасування кешу
