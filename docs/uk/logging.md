---
read_when:
    - Вам потрібен дружній до початківців огляд журналювання
    - Ви хочете налаштувати рівні журналювання або формати
    - Ви усуваєте несправності й хочете швидко знайти журнали
summary: 'Огляд журналювання: журнали у файлах, вивід у консолі, відстеження в CLI та інтерфейс керування'
title: Огляд журналювання
x-i18n:
    generated_at: "2026-04-24T23:44:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e179c883d98caa7fd8d3ece8962d0b628562d35568ebf452c34bededba22e2c
    source_path: logging.md
    workflow: 15
---

# Журналювання

OpenClaw має дві основні поверхні журналювання:

- **Журнали у файлах** (рядки JSON), які записує Gateway.
- **Вивід у консолі**, що показується в терміналах і в інтерфейсі налагодження Gateway.

Вкладка **Logs** в інтерфейсі керування відстежує журнал файлу gateway. На цій сторінці пояснюється, де зберігаються журнали, як їх читати та як налаштовувати рівні й формати журналювання.

## Де зберігаються журнали

За замовчуванням Gateway записує ротаційний файл журналу за шляхом:

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

### CLI: відстеження в реальному часі (рекомендовано)

Використовуйте CLI, щоб відстежувати файл журналу gateway через RPC:

```bash
openclaw logs --follow
```

Корисні поточні параметри:

- `--local-time`: відображати часові мітки у вашому локальному часовому поясі
- `--url <url>` / `--token <token>` / `--timeout <ms>`: стандартні прапорці Gateway RPC
- `--expect-final`: прапорець очікування фінальної відповіді для RPC на основі агентів (тут приймається через спільний клієнтський шар)

Режими виводу:

- **Сеанси TTY**: гарні, кольорові, структуровані рядки журналу.
- **Сеанси без TTY**: звичайний текст.
- `--json`: JSON з розділенням по рядках (одна подія журналу на рядок).
- `--plain`: примусово використовувати звичайний текст у сеансах TTY.
- `--no-color`: вимкнути кольори ANSI.

Коли ви передаєте явний `--url`, CLI не застосовує автоматично облікові дані з конфігурації або середовища; вкажіть `--token` самостійно, якщо цільовий Gateway вимагає автентифікації.

У режимі JSON CLI виводить об’єкти з тегом `type`:

- `meta`: метадані потоку (файл, курсор, розмір)
- `log`: розібраний запис журналу
- `notice`: підказки щодо обрізання / ротації
- `raw`: нерозібраний рядок журналу

Якщо Gateway на local loopback просить виконати pairing, `openclaw logs` автоматично переходить до налаштованого локального файла журналу. Явні цілі `--url` не використовують цей резервний варіант.

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

### Журнали у файлах (JSONL)

Кожен рядок у файлі журналу є об’єктом JSON. CLI та інтерфейс керування розбирають ці записи, щоб відображати структурований вивід (час, рівень, підсистема, повідомлення).

### Вивід у консолі

Журнали консолі **враховують TTY** і форматуються для зручності читання:

- Префікси підсистем (наприклад, `gateway/channels/whatsapp`)
- Кольори рівнів (info/warn/error)
- Необов’язковий компактний або JSON-режим

Форматування консолі керується через `logging.consoleStyle`.

### Журнали Gateway WebSocket

`openclaw gateway` також має журналювання протоколу WebSocket для RPC-трафіку:

- звичайний режим: лише цікаві результати (помилки, помилки розбору, повільні виклики)
- `--verbose`: увесь трафік запитів/відповідей
- `--ws-log auto|compact|full`: вибір стилю детального відображення
- `--compact`: псевдонім для `--ws-log compact`

Приклади:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Налаштування журналювання

Усі параметри журналювання містяться в `logging` у `~/.openclaw/openclaw.json`.

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

- `logging.level`: рівень **журналів у файлах** (JSONL).
- `logging.consoleLevel`: рівень деталізації **консолі**.

Ви можете перевизначити обидва через змінну середовища **`OPENCLAW_LOG_LEVEL`** (наприклад, `OPENCLAW_LOG_LEVEL=debug`). Змінна середовища має вищий пріоритет за файл конфігурації, тому ви можете підвищити деталізацію для одного запуску без редагування `openclaw.json`. Ви також можете передати глобальний параметр CLI **`--log-level <level>`** (наприклад, `openclaw --log-level debug gateway run`), який перевизначає змінну середовища для цієї команди.

`--verbose` впливає лише на вивід у консоль і деталізацію журналів WS; він не змінює рівні журналів у файлах.

### Стилі консолі

`logging.consoleStyle`:

- `pretty`: зручний для людини, кольоровий, із часовими мітками.
- `compact`: щільніший вивід (найкраще для довгих сеансів).
- `json`: JSON у кожному рядку (для обробників журналів).

### Редагування чутливих даних

Підсумки інструментів можуть приховувати чутливі токени до того, як вони потраплять у консоль:

- `logging.redactSensitive`: `off` | `tools` (типово: `tools`)
- `logging.redactPatterns`: список рядків regex для перевизначення типового набору

Редагування впливає **лише на вивід у консоль** і не змінює журнали у файлах.

## Діагностика + OpenTelemetry

Діагностика — це структуровані, машинозчитувані події для запусків моделей **і**
телеметрії потоку повідомлень (webhooks, постановка в чергу, стан сеансу). Вони **не**
замінюють журнали; вони існують для передавання метрик, трасувань та інших експортерів.

Події діагностики генеруються в процесі, але експортери підключаються лише тоді, коли
увімкнено діагностику + Plugin експортера.

### OpenTelemetry проти OTLP

- **OpenTelemetry (OTel)**: модель даних + SDK для трасувань, метрик і журналів.
- **OTLP**: мережевий протокол, який використовується для експорту даних OTel до колектора/бекенда.
- Сьогодні OpenClaw експортує через **OTLP/HTTP (protobuf)**.

### Експортовані сигнали

- **Метрики**: лічильники + гістограми (використання токенів, потік повідомлень, постановка в чергу).
- **Трасування**: span-и для використання моделей + обробки webhook/повідомлень.
- **Журнали**: експортуються через OTLP, коли ввімкнено `diagnostics.otel.logs`. Обсяг журналів
  може бути високим; враховуйте `logging.level` і фільтри експортера.

### Каталог подій діагностики

Використання моделей:

- `model.usage`: токени, вартість, тривалість, контекст, провайдер/модель/канал, ідентифікатори сеансів.

Потік повідомлень:

- `webhook.received`: вхід webhook для кожного каналу.
- `webhook.processed`: webhook оброблено + тривалість.
- `webhook.error`: помилки обробника webhook.
- `message.queued`: повідомлення поставлено в чергу на обробку.
- `message.processed`: результат + тривалість + необов’язкова помилка.

Черга + сеанс:

- `queue.lane.enqueue`: постановка в lane черги команд + глибина.
- `queue.lane.dequeue`: зняття з lane черги команд + час очікування.
- `session.state`: перехід стану сеансу + причина.
- `session.stuck`: попередження про завислий сеанс + вік.
- `run.attempt`: метадані повторної спроби/спроби запуску.
- `diagnostic.heartbeat`: агреговані лічильники (webhooks/черга/сеанс).

### Увімкнення діагностики (без експортера)

Використовуйте це, якщо хочете, щоб події діагностики були доступні для плагінів або власних приймачів:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Прапорці діагностики (цільові журнали)

Використовуйте прапорці, щоб увімкнути додаткові, цільові журнали налагодження без підвищення `logging.level`.
Прапорці нечутливі до регістру та підтримують шаблони з wildcard (наприклад, `telegram.*` або `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Перевизначення через змінну середовища (для разового запуску):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Примітки:

- Журнали за прапорцями записуються у стандартний файл журналу (той самий, що й `logging.file`).
- Вивід усе одно редагується відповідно до `logging.redactSensitive`.
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
  лічильники/гістограми потоку повідомлень (webhooks, постановка в чергу, стан сеансу, глибина/очікування черги).
- Трасування/метрики можна перемикати через `traces` / `metrics` (типово: увімкнено). Трасування
  включають span-и використання моделей, а також span-и обробки webhook/повідомлень, коли це ввімкнено.
- Вміст сирих моделей/інструментів типово не експортується. Використовуйте
  `diagnostics.otel.captureContent` лише тоді, коли ваш колектор і політика зберігання
  схвалені для тексту підказок, відповідей, інструментів або системних підказок.
- Установіть `headers`, якщо ваш колектор вимагає автентифікації.
- Підтримувані змінні середовища: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Експортовані метрики (назви + типи)

Використання моделей:

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

Коли захоплення вмісту явно ввімкнено, span-и моделі/інструментів також можуть містити
обмежені, відредаговані атрибути `openclaw.content.*` для конкретних класів вмісту,
які ви дозволили.

### Вибірка + скидання

- Вибірка трасувань: `diagnostics.otel.sampleRate` (0.0–1.0, лише кореневі span-и).
- Інтервал експорту метрик: `diagnostics.otel.flushIntervalMs` (мінімум 1000 мс).

### Примітки щодо протоколу

- Кінцеві точки OTLP/HTTP можна задати через `diagnostics.otel.endpoint` або
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Якщо кінцева точка вже містить `/v1/traces` або `/v1/metrics`, вона використовується як є.
- Якщо кінцева точка вже містить `/v1/logs`, вона використовується як є для журналів.
- `diagnostics.otel.logs` вмикає експорт журналів OTLP для основного виводу журналювача.

### Поведінка експорту журналів

- Журнали OTLP використовують ті самі структуровані записи, що записуються до `logging.file`.
- Враховується `logging.level` (рівень журналів у файлах). Редагування консолі **не** застосовується
  до журналів OTLP.
- Для інсталяцій із великим обсягом даних варто віддавати перевагу вибірці/фільтрації в колекторі OTLP.

## Поради з усунення несправностей

- **Gateway недоступний?** Спочатку виконайте `openclaw doctor`.
- **Журнали порожні?** Перевірте, що Gateway запущений і записує у шлях файлу,
  вказаний у `logging.file`.
- **Потрібно більше деталей?** Установіть `logging.level` на `debug` або `trace` і повторіть спробу.

## Пов’язане

- [Внутрішня будова журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностика](/uk/gateway/configuration-reference#diagnostics) — експорт OpenTelemetry і конфігурація трасування кешу
