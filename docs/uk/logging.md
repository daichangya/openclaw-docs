---
read_when:
    - Вам потрібен дружній до початківців огляд логування
    - Ви хочете налаштувати рівні або формати логів
    - Ви усуваєте несправності й хочете швидко знайти логи
summary: 'Огляд логування: файлові логи, консольний вивід, перегляд через CLI та Control UI'
title: Огляд логування
x-i18n:
    generated_at: "2026-04-05T18:09:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5e3800b7c5128602d05d5a35df4f88c373cfbe9397cca7e7154fff56a7f7ef
    source_path: logging.md
    workflow: 15
---

# Логування

OpenClaw має дві основні поверхні логування:

- **Файлові логи** (рядки JSON), які записує Gateway.
- **Консольний вивід**, що показується в терміналах і Gateway Debug UI.

Вкладка **Logs** у Control UI показує tail файлового логу gateway. На цій сторінці пояснюється, де
знаходяться логи, як їх читати та як налаштовувати рівні й формати логування.

## Де зберігаються логи

Типово Gateway записує ротаційний лог-файл у:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Дата використовує локальний часовий пояс хоста gateway.

Це можна перевизначити в `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Як читати логи

### CLI: live tail (рекомендовано)

Використовуйте CLI, щоб переглядати tail лог-файлу gateway через RPC:

```bash
openclaw logs --follow
```

Корисні поточні параметри:

- `--local-time`: показувати часові позначки у вашому локальному часовому поясі
- `--url <url>` / `--token <token>` / `--timeout <ms>`: стандартні прапорці Gateway RPC
- `--expect-final`: прапорець очікування фінальної відповіді для RPC, підкріпленого агентом (тут підтримується через спільний клієнтський шар)

Режими виводу:

- **TTY-сесії**: гарні, кольорові, структуровані рядки логів.
- **Не-TTY-сесії**: звичайний текст.
- `--json`: JSON із розділенням по рядках (одна подія логу на рядок).
- `--plain`: примусово використовувати звичайний текст у TTY-сесіях.
- `--no-color`: вимкнути ANSI-кольори.

Коли ви передаєте явний `--url`, CLI не застосовує автоматично облікові дані з config або
середовища; додайте `--token` самостійно, якщо цільовий Gateway
потребує auth.

У JSON-режимі CLI виводить об’єкти з тегом `type`:

- `meta`: метадані потоку (файл, cursor, size)
- `log`: розібраний запис логу
- `notice`: підказки про truncation / rotation
- `raw`: нерозібраний рядок логу

Якщо локальний loopback Gateway запитує pairing, `openclaw logs` автоматично переходить до
локального налаштованого лог-файлу. Явні цілі `--url` не
використовують цей резервний варіант.

Якщо Gateway недоступний, CLI показує коротку підказку виконати:

```bash
openclaw doctor
```

### Control UI (web)

Вкладка **Logs** у Control UI показує tail того самого файлу через `logs.tail`.
Як її відкрити, див. на сторінці [/web/control-ui](/web/control-ui).

### Логи лише каналу

Щоб відфільтрувати активність каналу (WhatsApp/Telegram тощо), використовуйте:

```bash
openclaw channels logs --channel whatsapp
```

## Формати логів

### Файлові логи (JSONL)

Кожен рядок у лог-файлі — це об’єкт JSON. CLI і Control UI розбирають ці
записи, щоб показувати структурований вивід (час, рівень, підсистема, повідомлення).

### Консольний вивід

Консольні логи **враховують TTY** і форматуються для зручності читання:

- Префікси підсистем (наприклад `gateway/channels/whatsapp`)
- Кольори рівнів (info/warn/error)
- Необов’язковий компактний або JSON-режим

Форматування консолі керується `logging.consoleStyle`.

### Логи Gateway WebSocket

`openclaw gateway` також має логування протоколу WebSocket для RPC-трафіку:

- звичайний режим: лише цікаві результати (помилки, помилки розбору, повільні виклики)
- `--verbose`: увесь request/response-трафік
- `--ws-log auto|compact|full`: вибір стилю докладного відображення
- `--compact`: псевдонім для `--ws-log compact`

Приклади:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Налаштування логування

Уся конфігурація логування міститься в розділі `logging` у `~/.openclaw/openclaw.json`.

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

### Рівні логування

- `logging.level`: рівень **файлових логів** (JSONL).
- `logging.consoleLevel`: рівень деталізації **консолі**.

Ви можете перевизначити обидва через змінну середовища **`OPENCLAW_LOG_LEVEL`** (наприклад `OPENCLAW_LOG_LEVEL=debug`). Ця змінна має пріоритет над файлом конфігурації, тож ви можете підвищити деталізацію для одного запуску без редагування `openclaw.json`. Також можна передати глобальний параметр CLI **`--log-level <level>`** (наприклад, `openclaw --log-level debug gateway run`), який має пріоритет над змінною середовища для цієї команди.

`--verbose` впливає лише на консольний вивід і деталізацію WS-логів; він не змінює
рівні файлових логів.

### Стилі консолі

`logging.consoleStyle`:

- `pretty`: зручний для людей, кольоровий, із часовими позначками.
- `compact`: щільніший вивід (найкраще для довгих сесій).
- `json`: JSON на рядок (для обробників логів).

### Редагування чутливих даних

Підсумки інструментів можуть редагувати чутливі токени до того, як вони потраплять у консоль:

- `logging.redactSensitive`: `off` | `tools` (типово: `tools`)
- `logging.redactPatterns`: список regex-рядків для перевизначення типового набору

Редагування впливає **лише на консольний вивід** і не змінює файлові логи.

## Діагностика + OpenTelemetry

Діагностика — це структуровані, машинозчитувані події для запусків моделей **і**
телеметрії потоку повідомлень (webhooks, черги, стан сесій). Вони **не** замінюють логи; вони потрібні для метрик, traces та інших exporter.

Діагностичні події видаються в межах процесу, але exporter приєднуються лише коли
ввімкнено diagnostics + plugin exporter.

### OpenTelemetry проти OTLP

- **OpenTelemetry (OTel)**: модель даних + SDK для traces, metrics і logs.
- **OTLP**: wire protocol, який використовується для експорту даних OTel у collector/backend.
- OpenClaw сьогодні експортує через **OTLP/HTTP (protobuf)**.

### Які сигнали експортуються

- **Metrics**: лічильники + гістограми (використання токенів, потік повідомлень, черги).
- **Traces**: spans для використання моделей + обробки webhook/повідомлень.
- **Logs**: експортуються через OTLP, коли ввімкнено `diagnostics.otel.logs`. Обсяг логів
  може бути великим; враховуйте `logging.level` і фільтри exporter.

### Каталог діагностичних подій

Використання моделі:

- `model.usage`: токени, вартість, тривалість, контекст, provider/model/channel, ідентифікатори сесії.

Потік повідомлень:

- `webhook.received`: вхід webhook для кожного каналу.
- `webhook.processed`: оброблений webhook + тривалість.
- `webhook.error`: помилки обробника webhook.
- `message.queued`: повідомлення поставлено в чергу на обробку.
- `message.processed`: результат + тривалість + необов’язкова помилка.

Черга + сесія:

- `queue.lane.enqueue`: додавання в lane черги команд + глибина.
- `queue.lane.dequeue`: виймання з lane черги команд + час очікування.
- `session.state`: перехід стану сесії + причина.
- `session.stuck`: попередження про завислу сесію + вік.
- `run.attempt`: метадані повторної спроби/спроби запуску.
- `diagnostic.heartbeat`: агреговані лічильники (webhooks/черга/сесія).

### Увімкнення diagnostics (без exporter)

Використовуйте це, якщо хочете, щоб діагностичні події були доступні plugins або кастомним sinks:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Прапорці diagnostics (цільові логи)

Використовуйте прапорці, щоб увімкнути додаткові, цільові debug-логи без підвищення `logging.level`.
Прапорці нечутливі до регістру та підтримують wildcard (наприклад `telegram.*` або `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Перевизначення через env (разово):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Примітки:

- Логи прапорців записуються у стандартний лог-файл (той самий, що й `logging.file`).
- Вивід усе ще редагується відповідно до `logging.redactSensitive`.
- Повний посібник: [/diagnostics/flags](/diagnostics/flags).

### Експорт до OpenTelemetry

Діагностику можна експортувати через plugin `diagnostics-otel` (OTLP/HTTP). Це
працює з будь-яким OpenTelemetry collector/backend, який приймає OTLP/HTTP.

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
      "flushIntervalMs": 60000
    }
  }
}
```

Примітки:

- Також можна ввімкнути plugin через `openclaw plugins enable diagnostics-otel`.
- `protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
- Metrics включають використання токенів, вартість, розмір контексту, тривалість запуску та
  лічильники/гістограми потоку повідомлень (webhooks, черги, стан сесій, глибина/очікування черги).
- Traces/metrics можна вмикати чи вимикати через `traces` / `metrics` (типово: увімкнено). Traces
  включають spans використання моделі, а також spans обробки webhook/повідомлень, коли це ввімкнено.
- Задайте `headers`, якщо вашому collector потрібна auth.
- Підтримувані змінні середовища: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Експортовані metrics (назви + типи)

Використання моделі:

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Потік повідомлень:

- `openclaw.webhook.received` (лічильник, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (лічильник, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гістограма, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (лічильник, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (лічильник, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (гістограма, attrs: `openclaw.channel`,
  `openclaw.outcome`)

Черги + сесії:

- `openclaw.queue.lane.enqueue` (лічильник, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, attrs: `openclaw.lane` або
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, attrs: `openclaw.lane`)
- `openclaw.session.state` (лічильник, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (гістограма, attrs: `openclaw.state`)
- `openclaw.run.attempt` (лічильник, attrs: `openclaw.attempt`)

### Експортовані spans (назви + ключові атрибути)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Вибірка та скидання

- Вибірка trace: `diagnostics.otel.sampleRate` (0.0–1.0, лише для root spans).
- Інтервал експорту metrics: `diagnostics.otel.flushIntervalMs` (мінімум 1000ms).

### Примітки щодо протоколу

- Ендпоїнти OTLP/HTTP можна задати через `diagnostics.otel.endpoint` або
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Якщо ендпоїнт уже містить `/v1/traces` або `/v1/metrics`, він використовується як є.
- Якщо ендпоїнт уже містить `/v1/logs`, він використовується як є для logs.
- `diagnostics.otel.logs` вмикає експорт OTLP logs для виводу основного logger.

### Поведінка експорту логів

- OTLP logs використовують ті самі структуровані записи, що записуються в `logging.file`.
- Враховують `logging.level` (рівень файлового логу). Редагування консолі **не** застосовується
  до OTLP logs.
- Для інсталяцій із великим обсягом логів краще використовувати вибірку/фільтрацію на боці OTLP collector.

## Поради з усунення несправностей

- **Gateway недоступний?** Спочатку виконайте `openclaw doctor`.
- **Логи порожні?** Перевірте, що Gateway запущений і записує у шлях файлу,
  заданий у `logging.file`.
- **Потрібно більше деталей?** Задайте `logging.level` на `debug` або `trace` і повторіть спробу.

## Пов’язане

- [Внутрішня будова логування Gateway](/gateway/logging) — стилі WS-логів, префікси підсистем і захоплення консолі
- [Diagnostics](/gateway/configuration-reference#diagnostics) — експорт OpenTelemetry і конфігурація cache trace
