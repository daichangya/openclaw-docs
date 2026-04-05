---
read_when:
    - Прив’язка вузлів iOS/Android до gateway
    - Використання canvas/camera вузла для контексту агента
    - Додавання нових команд вузла або CLI-допоміжних команд
summary: 'Вузли: pairing, можливості, дозволи та CLI-допоміжні команди для canvas/camera/screen/device/notifications/system'
title: Вузли
x-i18n:
    generated_at: "2026-04-05T18:09:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 201be0e13cb6d39608f0bbd40fd02333f68bd44f588538d1016fe864db7e038e
    source_path: nodes/index.md
    workflow: 15
---

# Вузли

**Вузол** — це допоміжний пристрій (macOS/iOS/Android/headless), який підключається до **WebSocket** Gateway (той самий порт, що й для операторів) з `role: "node"` і надає поверхню команд (наприклад, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) через `node.invoke`. Подробиці протоколу: [Протокол Gateway](/gateway/protocol).

Застарілий транспорт: [Протокол bridge](/gateway/bridge-protocol) (TCP JSONL;
лише історично для поточних вузлів).

macOS також може працювати в **режимі вузла**: застосунок menubar підключається до WS-сервера Gateway і надає свої локальні команди canvas/camera як вузол (тому `openclaw nodes …` працює з цим Mac).

Примітки:

- Вузли — це **периферійні пристрої**, а не gateway. Вони не запускають сервіс gateway.
- Повідомлення Telegram/WhatsApp тощо надходять на **gateway**, а не на вузли.
- Runbook для усунення несправностей: [/nodes/troubleshooting](/nodes/troubleshooting)

## Pairing + статус

**WS-вузли використовують pairing пристрою.** Під час `connect` вузли пред’являють ідентичність пристрою; Gateway
створює запит pairing пристрою для `role: node`. Підтверджуйте через CLI devices (або UI).

Швидкий CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Якщо вузол повторює спробу зі зміненими даними автентифікації (role/scopes/public key), попередній
очікувальний запит замінюється, і створюється новий `requestId`. Перед підтвердженням знову виконайте
`openclaw devices list`.

Примітки:

- `nodes status` позначає вузол як **paired**, коли його роль pairing пристрою містить `node`.
- Запис pairing пристрою — це сталий контракт підтверджених ролей. Ротація
  токена залишається в межах цього контракту; вона не може підвищити paired-вузол до
  іншої ролі, якої не надавав pairing.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) — це окреме сховище pairing вузлів, яким володіє gateway; воно **не** керує WS-handshake `connect`.
- Область підтвердження залежить від оголошених команд очікувального запиту:
  - запит без команд: `operator.pairing`
  - команди вузла без exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Віддалений host вузла (`system.run`)

Використовуйте **node host**, коли ваш Gateway працює на одній машині, а ви хочете, щоб команди
виконувалися на іншій. Модель усе одно взаємодіє з **gateway**; gateway
пересилає виклики `exec` до **node host**, коли вибрано `host=node`.

### Що де виконується

- **Host Gateway**: отримує повідомлення, запускає модель, маршрутизує виклики інструментів.
- **Node host**: виконує `system.run`/`system.which` на машині вузла.
- **Підтвердження**: застосовуються на node host через `~/.openclaw/exec-approvals.json`.

Примітка щодо підтвердження:

- Запуски вузла з підтвердженням прив’язуються до точного контексту запиту.
- Для прямих виконань shell/runtime-файлів OpenClaw також у режимі best-effort прив’язує один конкретний локальний
  файловий операнд і забороняє запуск, якщо цей файл зміниться до виконання.
- Якщо OpenClaw не може точно визначити рівно один конкретний локальний файл для команди interpreter/runtime,
  виконання з підтвердженням забороняється замість удавання повного покриття runtime. Для ширшої семантики interpreter використовуйте sandboxing,
  окремі хости або явний trusted allowlist/full workflow.

### Запустіть node host (у foreground)

На машині вузла:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Віддалений gateway через SSH-тунель (bind до loopback)

Якщо Gateway прив’язано до loopback (`gateway.bind=loopback`, типово в локальному режимі),
віддалені node host не можуть підключитися напряму. Створіть SSH-тунель і вкажіть
node host на локальний кінець цього тунелю.

Приклад (node host -> gateway host):

```bash
# Термінал A (залиште запущеним): переслати локальний 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Термінал B: експортуйте токен gateway і підключіться через тунель
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Примітки:

- `openclaw node run` підтримує автентифікацію за token або password.
- Перевага надається env vars: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Резервний варіант із конфігурації: `gateway.auth.token` / `gateway.auth.password`.
- У локальному режимі node host навмисно ігнорує `gateway.remote.token` / `gateway.remote.password`.
- У віддаленому режимі `gateway.remote.token` / `gateway.remote.password` підпадають під правила пріоритету remote.
- Якщо активні локальні SecretRef у `gateway.auth.*` налаштовано, але не визначено, автентифікація node host блокується за принципом fail-closed.
- Визначення автентифікації node host враховує лише env vars `OPENCLAW_GATEWAY_*`.

### Запустіть node host (як сервіс)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Pair + назва

На хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Якщо вузол повторює спробу зі зміненими даними автентифікації, знову виконайте `openclaw devices list`
і підтвердьте поточний `requestId`.

Варіанти іменування:

- `--display-name` у `openclaw node run` / `openclaw node install` (зберігається в `~/.openclaw/node.json` на вузлі).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (перевизначення на gateway).

### Додайте команди в allowlist

Підтвердження exec діють **для кожного node host окремо**. Додавайте записи allowlist із gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Підтвердження зберігаються на node host у `~/.openclaw/exec-approvals.json`.

### Спрямуйте exec на вузол

Налаштуйте типові значення (конфігурація gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Або для окремої сесії:

```
/exec host=node security=allowlist node=<id-or-name>
```

Після цього будь-який виклик `exec` з `host=node` виконуватиметься на node host (відповідно до
allowlist/підтверджень вузла).

`host=auto` сам по собі не вибере вузол неявно, але явний запит `host=node` для конкретного виклику дозволений із `auto`. Якщо ви хочете, щоб exec на вузлі був типовим для сесії, явно задайте `tools.exec.host=node` або `/exec host=node ...`.

Пов’язане:

- [CLI node host](/cli/node)
- [Інструмент Exec](/tools/exec)
- [Підтвердження Exec](/tools/exec-approvals)

## Виклик команд

Низькорівневий спосіб (сирий RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Для поширених сценаріїв “дати агенту вкладення MEDIA” існують helper-команди вищого рівня.

## Знімки екрана (знімки canvas)

Якщо вузол показує Canvas (WebView), `canvas.snapshot` повертає `{ format, base64 }`.

CLI helper (записує у тимчасовий файл і друкує `MEDIA:<path>`):

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

- `canvas present` приймає URL або локальні шляхи до файлів (`--target`), а також необов’язкові `--x/--y/--width/--height` для позиціювання.
- `canvas eval` приймає inline JS (`--js`) або позиційний аргумент.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Примітки:

- Підтримується лише A2UI v0.8 JSONL (v0.9/createSurface відхиляється).

## Фото + відео (камера вузла)

Фото (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # типово: обидва напрямки (2 рядки MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Відеокліпи (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Примітки:

- Вузол має бути **на передньому плані** для `canvas.*` і `camera.*` (виклики у фоні повертають `NODE_BACKGROUND_UNAVAILABLE`).
- Тривалість кліпу обмежується (зараз `<= 60s`), щоб уникати надто великих payload base64.
- Android по можливості покаже запити на дозволи `CAMERA`/`RECORD_AUDIO`; відхилені дозволи завершуються помилкою `*_PERMISSION_REQUIRED`.

## Запис екрана (вузли)

Підтримувані вузли надають `screen.record` (`mp4`). Приклад:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Примітки:

- Доступність `screen.record` залежить від платформи вузла.
- Тривалість запису екрана обмежується до `<= 60s`.
- `--no-audio` вимикає захоплення мікрофона на підтримуваних платформах.
- Використовуйте `--screen <index>`, щоб вибрати дисплей, якщо екранів кілька.

## Геолокація (вузли)

Вузли надають `location.get`, якщо в налаштуваннях увімкнено Location.

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Примітки:

- Location **типово вимкнено**.
- “Always” потребує системного дозволу; отримання у фоні працює в режимі best-effort.
- Відповідь містить lat/lon, точність (у метрах) і часову позначку.

## SMS (вузли Android)

Вузли Android можуть надавати `sms.send`, коли користувач надає дозвіл **SMS** і пристрій підтримує телефонію.

Низькорівневий виклик:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Примітки:

- Перед тим як можливість буде оголошена, на пристрої Android треба підтвердити запит дозволу.
- Пристрої лише з Wi‑Fi без телефонії не оголошуватимуть `sms.send`.

## Команди Android для пристрою + персональних даних

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

Приклади викликів:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Примітки:

- Команди руху керуються доступними датчиками на рівні можливостей.

## Системні команди (node host / вузол mac)

Вузол macOS надає `system.run`, `system.notify` і `system.execApprovals.get/set`.
Headless node host надає `system.run`, `system.which` і `system.execApprovals.get/set`.

Приклади:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Примітки:

- `system.run` повертає stdout/stderr/exit code у payload.
- Виконання shell тепер проходить через інструмент `exec` з `host=node`; `nodes` лишається прямою RPC-поверхнею для явних команд вузла.
- `nodes invoke` не відкриває `system.run` або `system.run.prepare`; вони лишаються лише на шляху exec.
- Шлях exec готує канонічний `systemRunPlan` перед підтвердженням. Щойно
  підтвердження надано, gateway пересилає саме цей збережений план, а не будь-які пізніше
  змінені викликачем поля command/cwd/session.
- `system.notify` враховує стан дозволів сповіщень у застосунку macOS.
- Для нерозпізнаних метаданих вузла `platform` / `deviceFamily` використовується консервативний типовий allowlist, який виключає `system.run` і `system.which`. Якщо вам свідомо потрібні ці команди для невідомої платформи, додайте їх явно через `gateway.nodes.allowCommands`.
- `system.run` підтримує `--cwd`, `--env KEY=VAL`, `--command-timeout` і `--needs-screen-recording`.
- Для shell-обгорток (`bash|sh|zsh ... -c/-lc`) значення `--env`, прив’язані до запиту, скорочуються до явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always в режимі allowlist відомі dispatch-обгортки (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають внутрішні шляхи виконуваних файлів, а не шляхи до самих обгорток. Якщо безпечне розгортання неможливе, запис allowlist автоматично не зберігається.
- На node host Windows у режимі allowlist запуски shell-обгорток через `cmd.exe /c` потребують підтвердження (сам запис allowlist не дозволяє цю форму автоматично).
- `system.notify` підтримує `--priority <passive|active|timeSensitive>` і `--delivery <system|overlay|auto>`.
- Node host ігнорують перевизначення `PATH` і прибирають небезпечні ключі startup/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Якщо вам потрібні додаткові записи PATH, налаштуйте середовище сервісу node host (або встановлюйте інструменти у стандартних місцях) замість передавання `PATH` через `--env`.
- У режимі вузла macOS `system.run` керується підтвердженнями exec у застосунку macOS (Settings → Exec approvals).
  Ask/allowlist/full працюють так само, як у headless node host; відхилені запити повертають `SYSTEM_RUN_DENIED`.
- На headless node host `system.run` керується підтвердженнями exec (`~/.openclaw/exec-approvals.json`).

## Прив’язка exec до вузла

Коли доступно кілька вузлів, ви можете прив’язати exec до конкретного вузла.
Це задає типовий вузол для `exec host=node` (і може бути перевизначено для агента).

Глобальне типове значення:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Перевизначення для конкретного агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Скиньте, щоб дозволити будь-який вузол:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Мапа дозволів

Вузли можуть включати мапу `permissions` у `node.list` / `node.describe`, де ключами є назви дозволів (наприклад, `screenRecording`, `accessibility`), а значеннями — булеві значення (`true` = дозволено).

## Headless node host (кросплатформний)

OpenClaw може запускати **headless node host** (без UI), який підключається до WebSocket Gateway
і надає `system.run` / `system.which`. Це корисно на Linux/Windows
або для запуску мінімального вузла поруч із сервером.

Запуск:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Примітки:

- Pairing усе одно потрібен (Gateway покаже запит pairing пристрою).
- Node host зберігає свій id вузла, токен, display name і дані підключення до gateway у `~/.openclaw/node.json`.
- Підтвердження exec застосовуються локально через `~/.openclaw/exec-approvals.json`
  (див. [Підтвердження Exec](/tools/exec-approvals)).
- На macOS headless node host типово виконує `system.run` локально. Задайте
  `OPENCLAW_NODE_EXEC_HOST=app`, щоб маршрутизувати `system.run` через companion app exec host; додайте
  `OPENCLAW_NODE_EXEC_FALLBACK=0`, щоб вимагати host застосунку й блокуватися за принципом fail-closed, якщо він недоступний.
- Додайте `--tls` / `--tls-fingerprint`, якщо Gateway WS використовує TLS.

## Режим вузла на Mac

- Застосунок menubar macOS підключається до WS-сервера Gateway як вузол (тому `openclaw nodes …` працює з цим Mac).
- У remote mode застосунок відкриває SSH-тунель для порту Gateway і підключається до `localhost`.
