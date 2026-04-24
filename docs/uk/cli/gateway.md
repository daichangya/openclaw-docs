---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення gateway через Bonjour (локально + wide-area DNS-SD)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — запуск, запити й виявлення gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-24T04:12:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, hooks).

Підкоманди на цій сторінці доступні через `openclaw gateway …`.

Пов’язана документація:

- [/gateway/bonjour](/uk/gateway/bonjour)
- [/gateway/discovery](/uk/gateway/discovery)
- [/gateway/configuration](/uk/gateway/configuration)

## Запуск Gateway

Запустіть локальний процес Gateway:

```bash
openclaw gateway
```

Псевдонім для запуску у foreground:

```bash
openclaw gateway run
```

Примітки:

- Типово Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Для ad-hoc/dev запусків використовуйте `--allow-unconfigured`.
- Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та виправте її, а не припускайте локальний режим неявно.
- Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації й відмовляється «вгадувати local» за вас.
- Прив’язування поза loopback без автентифікації блокується (запобіжний захист).
- `SIGUSR1` запускає перезапуск у межах процесу, якщо це дозволено (`commands.restart` типово ввімкнено; установіть `commands.restart: false`, щоб заблокувати ручний перезапуск, при цьому інструменти/конфігурація gateway apply/update залишаються дозволеними).
- Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден нестандартний стан термінала. Якщо ви обгортаєте CLI у TUI або raw-mode ввід, відновіть термінал перед виходом.

### Параметри

- `--port <port>`: порт WebSocket (типове значення береться з config/env; зазвичай `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: режим прив’язки слухача.
- `--auth <token|password>`: перевизначення режиму автентифікації.
- `--token <token>`: перевизначення токена (також встановлює `OPENCLAW_GATEWAY_TOKEN` для процесу).
- `--password <password>`: перевизначення пароля. Попередження: паролі, передані inline, можуть бути видимі в локальних списках процесів.
- `--password-file <path>`: прочитати пароль gateway з файлу.
- `--tailscale <off|serve|funnel>`: зробити Gateway доступним через Tailscale.
- `--tailscale-reset-on-exit`: скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
- `--allow-unconfigured`: дозволити запуск gateway без `gateway.mode=local` у конфігурації. Це обходить стартовий захист лише для ad-hoc/dev bootstrap; параметр не записує й не виправляє файл конфігурації.
- `--dev`: створити dev config + workspace, якщо їх немає (пропускає BOOTSTRAP.md).
- `--reset`: скинути dev config + credentials + sessions + workspace (потребує `--dev`).
- `--force`: завершити будь-який наявний listener на вибраному порту перед запуском.
- `--verbose`: докладні логи.
- `--cli-backend-logs`: показувати в консолі лише backend-логи CLI (і ввімкнути stdout/stderr).
- `--ws-log <auto|full|compact>`: стиль логів websocket (типово `auto`).
- `--compact`: псевдонім для `--ws-log compact`.
- `--raw-stream`: логувати сирі події потоку моделі в jsonl.
- `--raw-stream-path <path>`: шлях до raw stream jsonl.

Профілювання запуску:

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб логувати таймінги фаз під час запуску Gateway.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти запуск Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz` і таймінги трасування запуску.

## Запит до запущеного Gateway

Усі команди запиту використовують WebSocket RPC.

Режими виводу:

- Типово: зручний для читання людиною вивід (із кольорами в TTY).
- `--json`: JSON для машинного читання (без стилізації/spinner).
- `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши людський макет.

Спільні параметри (де підтримуються):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: токен Gateway.
- `--password <password>`: пароль Gateway.
- `--timeout <ms>`: тайм-аут/бюджет (залежить від команди).
- `--expect-final`: чекати на відповідь “final” (виклики агента).

Примітка: коли ви задаєте `--url`, CLI не використовує резервний перехід до credentials із конфігурації або середовища.
Явно передайте `--token` або `--password`. Відсутність явно вказаних credentials — це помилка.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP endpoint `/healthz` — це liveness probe: він повертає відповідь, щойно сервер може відповідати на HTTP. HTTP endpoint `/readyz` суворіший і залишається червоним, поки startup sidecars, канали або налаштовані hooks ще завершують ініціалізацію.

### `gateway usage-cost`

Отримати зведення usage-cost із логів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Параметри:

- `--days <days>`: кількість днів, які слід включити (типово `30`).

### `gateway stability`

Отримати нещодавній diagnostic stability recorder із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Параметри:

- `--limit <limit>`: максимальна кількість нещодавніх подій для включення (типово `25`, максимум `1000`).
- `--type <type>`: фільтр за типом diagnostic event, наприклад `payload.large` або `diagnostic.memory.pressure`.
- `--since-seq <seq>`: включати лише події після номера послідовності diagnostics.
- `--bundle [path]`: читати збережений stability bundle замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle у каталозі стану, або передайте шлях до JSON bundle безпосередньо.
- `--export`: записати zip із diagnostics для підтримки, яким можна поділитися, замість виведення подробиць stability.
- `--output <path>`: шлях виводу для `--export`.

Примітки:

- Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin, а також відредаговані зведення сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies, секретні значення, імена хостів або сирі id сесій. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути recorder.
- Під час фатальних завершень Gateway, тайм-аутів вимкнення та збоїв запуску після перезапуску OpenClaw записує той самий diagnostic snapshot у `~/.openclaw/logs/stability/openclaw-stability-*.json`, коли recorder має події. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; параметри `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

### `gateway diagnostics export`

Записати локальний zip із diagnostics, призначений для додавання до звітів про помилки.
Модель конфіденційності та вміст bundle див. у [Експорт diagnostics](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Параметри:

- `--output <path>`: шлях вихідного zip. Типово — support export у каталозі стану.
- `--log-lines <count>`: максимальна кількість санітизованих рядків логів для включення (типово `5000`).
- `--log-bytes <bytes>`: максимальна кількість байтів логів для перевірки (типово `1000000`).
- `--url <url>`: URL WebSocket Gateway для health snapshot.
- `--token <token>`: токен Gateway для health snapshot.
- `--password <password>`: пароль Gateway для health snapshot.
- `--timeout <ms>`: тайм-аут snapshot status/health (типово `3000`).
- `--no-stability-bundle`: пропустити пошук збереженого stability bundle.
- `--json`: вивести записаний шлях, розмір і маніфест у форматі JSON.

Експорт містить маніфест, зведення у Markdown, форму конфігурації, санітизовані деталі конфігурації, санітизовані зведення логів, санітизовані snapshot status/health Gateway, а також найновіший stability bundle, якщо він існує.

Він призначений для спільного використання. Він зберігає операційні деталі, що допомагають у налагодженні, як-от безпечні поля логів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори Plugin, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення логів. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, credentials, cookies, ідентифікатори облікових записів/повідомлень, текст prompt/instruction, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст payload користувача/чату/інструмента, експорт зберігає лише факт пропуску повідомлення та його розмір у байтах.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) разом з необов’язковою перевіркою можливостей підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Параметри:

- `--url <url>`: додати явну ціль probe. Налаштований remote + localhost усе одно перевіряються.
- `--token <token>`: автентифікація токеном для probe.
- `--password <password>`: автентифікація паролем для probe.
- `--timeout <ms>`: тайм-аут probe (типово `10000`).
- `--no-probe`: пропустити перевірку підключення (лише перегляд служби).
- `--deep`: також сканувати служби на системному рівні.
- `--require-rpc`: підвищити типову перевірку підключення до read probe і завершуватися з ненульовим кодом, якщо цей read probe не вдається. Не можна поєднувати з `--no-probe`.

Примітки:

- `gateway status` залишається доступним для diagnostics, навіть коли локальна конфігурація CLI відсутня або некоректна.
- Типовий `gateway status` підтверджує стан служби, WebSocket-підключення та можливість автентифікації, видиму під час handshake. Він не підтверджує операції читання/запису/адміністрування.
- `gateway status` за можливості визначає налаштовані auth SecretRefs для автентифікації probe.
- Якщо обов’язковий auth SecretRef не визначається в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації probe завершується невдачею; явно передайте `--token`/`--password` або спочатку визначте джерело секрету.
- Якщо перевірка probe успішна, попередження про невизначені auth-ref приглушуються, щоб уникнути хибнопозитивних результатів.
- Використовуйте `--require-rpc` у скриптах і автоматизації, коли наявності служби, що слухає, недостатньо й потрібно, щоб RPC-виклики з правами читання теж були справними.
- `--deep` додає найкращу з можливих перевірку додаткових встановлень launchd/systemd/schtasks. Коли виявляються кілька служб, схожих на gateway, у виводі для людини друкуються підказки щодо очищення й попередження про те, що більшість інсталяцій мають запускати одну gateway на машину.
- Вивід для людини містить визначений шлях до файлового логу, а також snapshot шляхів/коректності конфігурації CLI і служби, щоб допомогти діагностувати розбіжності профілю або каталогу стану.
- У встановленнях Linux systemd перевірки розбіжності автентифікації служби читають обидва значення `Environment=` і `EnvironmentFile=` із unit-файла (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
- Перевірки розбіжностей визначають SecretRef `gateway.auth.token` за допомогою об’єднаного середовища виконання (спочатку середовище команди служби, потім резервне середовище процесу).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не заданий, коли може перемогти пароль і жоден кандидат токена не може мати пріоритет), перевірки розбіжностей токенів пропускають визначення токена з конфігурації.

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований remote gateway (якщо заданий), і
- localhost (loopback) **навіть якщо remote налаштований**.

Якщо ви передасте `--url`, ця явна ціль буде додана перед обома. Вивід для людини позначає
цілі так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

Якщо доступні кілька gateway, буде виведено всі з них. Підтримуються кілька gateway, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість інсталяцій усе ще запускають одну gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Інтерпретація:

- `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що probe зміг підтвердити щодо автентифікації. Це окремо від доступності.
- `Read probe: ok` означає, що detail RPC-виклики з правами читання (`health`/`status`/`system-presence`/`config.get`) також були успішні.
- `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC з правами читання обмежений. Це повідомляється як **погіршена** доступність, а не як повна невдача.
- Код виходу є ненульовим лише тоді, коли жодна перевірена ціль не є доступною.

Примітки щодо JSON (`--json`):

- Верхній рівень:
  - `ok`: доступна принаймні одна ціль.
  - `degraded`: принаймні одна ціль мала RPC деталей з обмеженою областю доступу.
  - `capability`: найкраща можливість, виявлена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
  - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем, у такому порядку: явний URL, SSH-тунель, налаштований remote, потім local loopback.
  - `warnings[]`: записи попереджень із найкращими доступними даними з `code`, `message` і необов’язковими `targetIds`.
  - `network`: підказки URL для local loopback/tailnet, виведені з поточної конфігурації та мережі хоста.
  - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів discovery, використані для цього проходу probe.
- Для кожної цілі (`targets[].connect`):
  - `ok`: доступність після підключення + класифікація degraded.
  - `rpcOk`: повний успіх RPC деталей.
  - `scopeLimited`: RPC деталей завершився невдачею через відсутню область доступу operator.
- Для кожної цілі (`targets[].auth`):
  - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступно.
  - `scopes`: надані області доступу, повідомлені в `hello-ok`, коли доступно.
  - `capability`: показана класифікація можливостей автентифікації для цієї цілі.

Поширені коди попереджень:

- `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда повернулася до прямих probe.
- `multiple_gateways`: доступною була більш ніж одна ціль; це нетипово, якщо тільки ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
- `auth_secretref_unresolved`: не вдалося визначити налаштований auth SecretRef для цілі, що завершилася невдачею.
- `probe_scope_limited`: WebSocket-підключення успішне, але read probe був обмежений через відсутність `operator.read`.

#### Remote через SSH (паритет із Mac app)

Режим macOS app “Remote over SSH” використовує локальне перенаправлення порту, тож remote gateway (який може бути прив’язаний лише до loopback) стає доступним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Параметри:

- `--ssh <target>`: `user@host` або `user@host:port` (типовий порт — `22`).
- `--ssh-identity <path>`: файл ідентифікації.
- `--ssh-auto`: вибрати перший виявлений хост gateway як SSH-ціль із визначеної
  кінцевої точки discovery (`local.` плюс налаштований wide-area domain, якщо він є). Підказки лише з TXT
  ігноруються.

Конфігурація (необов’язкова, використовується як типове значення):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий допоміжний інструмент RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Параметри:

- `--params <json>`: рядок JSON-об’єкта для params (типово `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Примітки:

- `--params` має бути коректним JSON.
- `--expect-final` головним чином призначений для RPC у стилі агентів, які передають проміжні події потоком перед фінальним payload.

## Керування службою Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Параметри команд:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Примітки:

- `gateway install` підтримує `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Коли автентифікація токеном вимагає токен і `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна визначити, але не зберігає визначений токен у метаданих середовища служби.
- Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не визначається, встановлення завершується з безпечним блокуванням замість збереження резервного відкритого тексту.
- Для автентифікації паролем у `gateway run` віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість inline `--password`.
- У режимі виведеної автентифікації лише оболонковий `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена для встановлення; під час встановлення керованої служби використовуйте сталу конфігурацію (`gateway.auth.password` або `env` конфігурації).
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки режим не буде явно встановлено.
- Команди життєвого циклу приймають `--json` для використання у скриптах.

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [/gateway/bonjour](/uk/gateway/bonjour)

Маяк рекламують лише gateway з увімкненим discovery Bonjour (типово ввімкнено).

Записи wide-area discovery містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти типово використовують `22` для SSH-цілей, якщо його немає)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступно)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка remote-install, записана в wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

Параметри:

- `--timeout <ms>`: тайм-аут для команди (browse/resolve); типово `2000`.
- `--json`: машинозчитуваний вивід (також вимикає стилізацію/spinner).

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Примітки:

- CLI сканує `local.` плюс налаштований wide-area domain, коли його ввімкнено.
- `wsUrl` у JSON-виводі виводиться з визначеної кінцевої точки служби, а не з підказок
  лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише тоді, коли
  `discovery.mdns.mode` має значення `full`. Wide-area DNS-SD усе одно записує `cliPath`; `sshPort`
  там теж залишається необов’язковим.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
