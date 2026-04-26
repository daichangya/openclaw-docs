---
read_when:
    - Сполучення вузлів iOS/Android із Gateway
    - Використання canvas/camera вузла для контексту агента
    - Додавання нових команд вузла або допоміжних засобів CLI
summary: 'Вузли: сполучення, можливості, дозволи та допоміжні засоби CLI для canvas/camera/screen/device/notifications/system'
title: Вузли
x-i18n:
    generated_at: "2026-04-26T04:29:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

**Вузол** — це супутній пристрій (macOS/iOS/Android/headless), який підключається до **WebSocket** Gateway (той самий порт, що й оператори) з `role: "node"` і надає поверхню команд (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Подробиці протоколу: [Протокол Gateway](/uk/gateway/protocol).

Застарілий транспорт: [Протокол Bridge](/uk/gateway/bridge-protocol) (TCP JSONL;
лише історично для поточних вузлів).

macOS також може працювати в **режимі вузла**: застосунок у рядку меню підключається до WS-сервера Gateway і надає свої локальні команди canvas/camera як вузол (тож
`openclaw nodes …` працює з цим Mac). У режимі віддаленого gateway автоматизацію браузера обробляє CLI-хост вузла (`openclaw node run` або
встановлена служба вузла), а не вузол нативного застосунку.

Примітки:

- Вузли — це **периферійні пристрої**, а не gateway. Вони не запускають службу gateway.
- Повідомлення Telegram/WhatsApp тощо надходять на **gateway**, а не на вузли.
- Інструкція з усунення несправностей: [/nodes/troubleshooting](/uk/nodes/troubleshooting)

## Сполучення + статус

**WS-вузли використовують сполучення пристроїв.** Вузли представляють ідентичність пристрою під час `connect`; Gateway
створює запит на сполучення пристрою для `role: node`. Підтвердіть через CLI пристроїв (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо вузол повторює спробу зі зміненими даними автентифікації (роль/області доступу/публічний ключ), попередній
очікувальний запит замінюється, і створюється новий `requestId`. Повторно виконайте
`openclaw devices list` перед підтвердженням.

Примітки:

- `nodes status` позначає вузол як **paired**, коли роль сполучення його пристрою містить `node`.
- Запис сполучення пристрою — це довготривалий контракт затвердженої ролі. Ротація
  токенів залишається в межах цього контракту; вона не може підвищити paired-вузол до
  іншої ролі, якої ніколи не надавало підтвердження сполучення.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) — це окреме сховище
  сполучення вузлів, яким володіє gateway; воно **не** керує рукопотисканням WS `connect`.
- Область підтвердження відповідає заявленим командам очікувального запиту:
  - запит без команд: `operator.pairing`
  - команди вузла без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Віддалений хост вузла (system.run)

Використовуйте **хост вузла**, коли ваш Gateway працює на одній машині, а ви хочете, щоб команди
виконувалися на іншій. Модель усе ще звертається до **gateway**; gateway
пересилає виклики `exec` до **хоста вузла**, коли вибрано `host=node`.

### Що і де виконується

- **Хост Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Хост вузла**: виконує `system.run`/`system.which` на машині вузла.
- **Підтвердження**: застосовуються на хості вузла через `~/.openclaw/exec-approvals.json`.

Примітка щодо підтверджень:

- Запуски вузла, що спираються на підтвердження, прив’язують точний контекст запиту.
- Для прямих виконань shell/runtime файлів OpenClaw також у межах best-effort прив’язує один конкретний локальний
  файловий операнд і відхиляє запуск, якщо цей файл змінюється до виконання.
- Якщо OpenClaw не може визначити рівно один конкретний локальний файл для команди інтерпретатора/runtime,
  виконання, що спирається на підтвердження, відхиляється замість удаваного повного покриття runtime. Використовуйте sandboxing,
  окремі хости або явний довірений allowlist/повний workflow для ширшої семантики інтерпретатора.

### Запуск хоста вузла (передній план)

На машині вузла:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений gateway через SSH-тунель (прив’язка loopback)

Якщо Gateway прив’язується до loopback (`gateway.bind=loopback`, типово в локальному режимі),
віддалені хости вузлів не можуть підключитися напряму. Створіть SSH-тунель і вкажіть
хосту вузла локальний кінець тунелю.

Приклад (хост вузла -> хост gateway):

```bash
# Terminal A (не закривайте): пересилання локального 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: експортуйте токен gateway і підключіться через тунель
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Примітки:

- `openclaw node run` підтримує автентифікацію за токеном або паролем.
- Рекомендовано змінні середовища: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Резервна конфігурація — `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі хост вузла навмисно ігнорує `gateway.remote.token` / `gateway.remote.password`.
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` можуть використовуватися згідно з правилами пріоритету для віддаленого режиму.
- Якщо активні локальні SecretRef для `gateway.auth.*` налаштовані, але не розв’язані, автентифікація хоста вузла завершується відмовою за замовчуванням.
- Розв’язання автентифікації хоста вузла враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

### Запуск хоста вузла (служба)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Сполучення + ім’я

На хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Якщо вузол повторює спробу зі зміненими даними автентифікації, повторно виконайте `openclaw devices list`
і підтвердьте поточний `requestId`.

Варіанти іменування:

- `--display-name` у `openclaw node run` / `openclaw node install` (зберігається в `~/.openclaw/node.json` на вузлі).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (перевизначення на gateway).

### Додайте команди до allowlist

Підтвердження exec є **окремими для кожного хоста вузла**. Додайте записи allowlist із gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Підтвердження зберігаються на хості вузла в `~/.openclaw/exec-approvals.json`.

### Спрямуйте exec на вузол

Налаштуйте значення за замовчуванням (конфігурація gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Або для окремої сесії:

```
/exec host=node security=allowlist node=<id-or-name>
```

Після налаштування будь-який виклик `exec` із `host=node` виконується на хості вузла (з урахуванням
allowlist/підтверджень вузла).

`host=auto` не вибере вузол неявно сам по собі, але явний запит `host=node` для окремого виклику дозволений із `auto`. Якщо ви хочете, щоб exec на вузлі був значенням за замовчуванням для сесії, явно задайте `tools.exec.host=node` або `/exec host=node ...`.

Пов’язане:

- [CLI хоста вузла](/uk/cli/node)
- [Інструмент Exec](/uk/tools/exec)
- [Підтвердження Exec](/uk/tools/exec-approvals)

## Виклик команд

Низькорівнево (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Існують і допоміжні засоби вищого рівня для поширених workflow у стилі «надати агенту вкладення MEDIA».

## Знімки екрана (знімки canvas)

Якщо вузол показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

Допоміжний засіб CLI (записує у тимчасовий файл і друкує `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Керування Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Примітки:

- `canvas present` приймає URL-адреси або локальні шляхи до файлів (`--target`), а також необов’язкові `--x/--y/--width/--height` для позиціювання.
- `canvas eval` приймає вбудований JS (`--js`) або позиційний аргумент.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Примітки:

- Підтримується лише A2UI v0.8 JSONL (v0.9/createSurface відхиляється).

## Фото + відео (камера вузла)

Фотографії (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # типово: обидві сторони (2 рядки MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Відеокліпи (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Примітки:

- Вузол має бути **на передньому плані** для `canvas.*` і `camera.*` (виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`).
- Тривалість кліпу обмежується (зараз `<= 60s`), щоб уникати надмірно великих payload base64.
- Android за можливості запитує дозволи `CAMERA`/`RECORD_AUDIO`; відхилені дозволи завершуються помилкою `*_PERMISSION_REQUIRED`.

## Записи екрана (вузли)

Підтримувані вузли надають `screen.record` (mp4). Приклад:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Примітки:

- Доступність `screen.record` залежить від платформи вузла.
- Записи екрана обмежуються до `<= 60s`.
- `--no-audio` вимикає захоплення мікрофона на підтримуваних платформах.
- Використовуйте `--screen <index>` для вибору дисплея, якщо доступно кілька екранів.

## Геолокація (вузли)

Вузли надають `location.get`, коли геолокацію ввімкнено в налаштуваннях.

Допоміжний засіб CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примітки:

- Геолокація **вимкнена за замовчуванням**.
- Режим “Always” потребує системного дозволу; фонове отримання є best-effort.
- Відповідь містить lat/lon, точність (у метрах) і часову позначку.

## SMS (вузли Android)

Вузли Android можуть надавати `sms.send`, коли користувач надає дозвіл **SMS** і пристрій підтримує телефонію.

Низькорівневий invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- Запит дозволу має бути підтверджений на пристрої Android до того, як можливість буде оголошено.
- Пристрої лише з Wi‑Fi без телефонії не оголошуватимуть `sms.send`.

## Команди пристрою Android + персональних даних

Вузли Android можуть оголошувати додаткові сімейства команд, коли ввімкнено відповідні можливості.

Доступні сімейства:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Приклади invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Примітки:

- Команди руху залежать від можливостей, які визначаються наявними датчиками.

## Системні команди (хост вузла / вузол mac)

Вузол macOS надає `system.run`, `system.notify` і `system.execApprovals.get/set`.
Headless-хост вузла надає `system.run`, `system.which` і `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/код виходу в payload.
- Виконання shell тепер відбувається через інструмент `exec` з `host=node`; `nodes` залишається поверхнею прямого RPC для явних команд вузла.
- `nodes invoke` не надає `system.run` або `system.run.prepare`; вони залишаються лише в шляху exec.
- Шлях exec готує канонічний `systemRunPlan` до підтвердження. Після того як
  підтвердження надано, gateway пересилає цей збережений план, а не будь-які пізніше
  змінені викликачем поля command/cwd/session.
- `system.notify` враховує стан дозволу на сповіщення в застосунку macOS.
- Нерозпізнані метадані вузла `platform` / `deviceFamily` використовують консервативний allowlist за замовчуванням, який виключає `system.run` і `system.which`. Якщо вам навмисно потрібні ці команди для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для shell-обгорток (`bash|sh|zsh ... -c/-lc`) значення `--env` в межах запиту зводяться до явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always у режимі allowlist відомі dispatch-обгортки (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають внутрішні шляхи виконуваних файлів замість шляхів обгорток. Якщо безпечне розгортання неможливе, запис allowlist автоматично не зберігається.
- На хостах вузлів Windows у режимі allowlist запуски shell-обгорток через `cmd.exe /c` вимагають підтвердження (сам лише запис allowlist не дозволяє форму обгортки автоматично).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Хости вузлів ігнорують перевизначення `PATH` і видаляють небезпечні ключі startup/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Якщо вам потрібні додаткові записи PATH, налаштуйте середовище служби хоста вузла (або встановіть інструменти у стандартні розташування) замість передавання `PATH` через `--env`.
- У режимі вузла macOS `system.run` обмежується підтвердженнями exec у застосунку macOS (Settings → Exec approvals).
  Ask/allowlist/full поводяться так само, як і в headless-хості вузла; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- У headless-хості вузла `system.run` обмежується підтвердженнями exec (`~/.openclaw/exec-approvals.json`).

## Прив’язка exec до вузла

Коли доступно кілька вузлів, ви можете прив’язати exec до конкретного вузла.
Це встановлює вузол за замовчуванням для `exec host=node` (і може бути перевизначене для окремого агента).

Глобальне значення за замовчуванням:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для окремого агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Скиньте значення, щоб дозволити будь-який вузол:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Карта дозволів

Вузли можуть містити карту `permissions` у `node.list` / `node.describe`, де ключами є назви дозволів (наприклад, `screenRecording`, `accessibility`), а значеннями — булеві значення (`true` = надано).

## Headless-хост вузла (кросплатформений)

OpenClaw може запускати **headless-хост вузла** (без UI), який підключається до Gateway
WebSocket і надає `system.run` / `system.which`. Це корисно на Linux/Windows
або для запуску мінімального вузла поруч із сервером.

Запуск:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Сполучення все ще потрібне (Gateway покаже запит на сполучення пристрою).
- Хост вузла зберігає свій ідентифікатор вузла, токен, відображуване ім’я та інформацію про підключення до gateway у `~/.openclaw/node.json`.
- Підтвердження exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Підтвердження Exec](/uk/tools/exec-approvals)).
- На macOS headless-хост вузла за замовчуванням виконує `system.run` локально. Установіть
  `OPENCLAW_NODE_EXEC_HOST=app`, щоб маршрутизувати `system.run` через exec-хост супутнього застосунку; додайте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати хост застосунку й завершувати відмовою за замовчуванням, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, коли Gateway WS використовує TLS.

## Режим вузла Mac

- Застосунок macOS у рядку меню підключається до сервера Gateway WS як вузол (тому `openclaw nodes …` працює з цим Mac).
- У віддаленому режимі застосунок відкриває SSH-тунель для порту Gateway і підключається до `localhost`.
