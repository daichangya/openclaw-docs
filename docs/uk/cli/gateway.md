---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та з’єднання
    - Виявлення шлюзів через Bonjour (локально + wide-area DNS-SD)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запит і виявлення шлюзів
title: Gateway
x-i18n:
    generated_at: "2026-04-26T04:24:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e5dcac41c065b321cfbb674e4341f593853b777d48a28a3fb20f85ac0ef9666
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Gateway — це сервер WebSocket OpenClaw (канали, вузли, сесії, хуки).

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

- За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Використовуйте `--allow-unconfigured` для ad-hoc/dev запусків.
- Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією й виправте її, а не припускайте неявно локальний режим.
- Якщо файл існує, а `gateway.mode` відсутній, Gateway розцінює це як підозріле пошкодження конфігурації й відмовляється «припускати локальний режим» за вас.
- Прив’язка поза loopback без автентифікації блокується (захисне обмеження).
- `SIGUSR1` запускає перезапуск у межах процесу за наявності дозволу (`commands.restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб заблокувати ручний перезапуск, водночас інструменти gateway tool/config apply/update залишаться дозволеними).
- Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден нестандартний стан термінала. Якщо ви обгортаєте CLI у TUI або raw-mode ввід, відновіть термінал перед виходом.

### Параметри

- `--port <port>`: порт WebSocket (значення за замовчуванням береться з config/env; зазвичай `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: режим прив’язки слухача.
- `--auth <token|password>`: перевизначення режиму автентифікації.
- `--token <token>`: перевизначення токена (також встановлює `OPENCLAW_GATEWAY_TOKEN` для процесу).
- `--password <password>`: перевизначення пароля. Попередження: паролі, передані напряму, можуть бути видимі в локальних списках процесів.
- `--password-file <path>`: прочитати пароль gateway з файлу.
- `--tailscale <off|serve|funnel>`: відкрити Gateway через Tailscale.
- `--tailscale-reset-on-exit`: скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
- `--allow-unconfigured`: дозволити запуск gateway без `gateway.mode=local` у конфігурації. Це обходить захисну перевірку запуску лише для ad-hoc/dev bootstrap; цей параметр не записує і не виправляє файл конфігурації.
- `--dev`: створити dev-конфігурацію + workspace, якщо їх немає (пропускає BOOTSTRAP.md).
- `--reset`: скинути dev-конфігурацію + облікові дані + сесії + workspace (потрібен `--dev`).
- `--force`: завершити будь-який наявний listener на вибраному порту перед запуском.
- `--verbose`: докладні логи.
- `--cli-backend-logs`: показувати в консолі лише backend-логи CLI (і ввімкнути stdout/stderr).
- `--ws-log <auto|full|compact>`: стиль логів websocket (за замовчуванням `auto`).
- `--compact`: псевдонім для `--ws-log compact`.
- `--raw-stream`: логувати сирі події model stream у jsonl.
- `--raw-stream-path <path>`: шлях до jsonl для raw stream.

Профілювання запуску:

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб логувати час виконання фаз під час запуску Gateway.
- Виконайте `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти швидкість запуску Gateway. Бенчмарк записує перший вивід процесу, `/healthz`, `/readyz` і значення часу із startup trace.

## Запит до запущеного Gateway

Усі команди запиту використовують WebSocket RPC.

Режими виводу:

- За замовчуванням: зручний для читання людиною формат (кольоровий у TTY).
- `--json`: JSON для машинної обробки (без стилізації/spinner).
- `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши формат для людини.

Спільні параметри (де підтримуються):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: токен Gateway.
- `--password <password>`: пароль Gateway.
- `--timeout <ms>`: timeout/бюджет часу (залежить від команди).
- `--expect-final`: чекати на «final» відповідь (виклики агента).

Примітка: коли ви встановлюєте `--url`, CLI не використовує як запасний варіант облікові дані з конфігурації чи середовища.
Передайте `--token` або `--password` явно. Відсутність явно заданих облікових даних є помилкою.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпойнт `/healthz` — це перевірка живучості: він повертає відповідь, щойно сервер може відповідати по HTTP. HTTP-ендпойнт `/readyz` суворіший і залишається неготовим, доки sidecar-процеси запуску, канали або налаштовані хуки ще не завершили стабілізацію.

### `gateway usage-cost`

Отримати зведення usage-cost із логів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Параметри:

- `--days <days>`: кількість днів, які слід включити (за замовчуванням `30`).

### `gateway stability`

Отримати нещодавній записувач діагностичної стабільності із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Параметри:

- `--limit <limit>`: максимальна кількість нещодавніх подій, які слід включити (за замовчуванням `25`, максимум `1000`).
- `--type <type>`: фільтр за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
- `--since-seq <seq>`: включати лише події після номера діагностичної послідовності.
- `--bundle [path]`: читати збережений stability bundle замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого bundle у каталозі стану або передайте шлях до JSON-файлу bundle напряму.
- `--export`: записати shareable support diagnostics zip замість виведення подробиць stability.
- `--output <path>`: шлях виводу для `--export`.

Примітки:

- Записи зберігають операційні метадані: назви подій, лічильники, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і відредаговані зведення сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookies, секретні значення, імена хостів або сирі id сесій. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути записувач.
- Під час фатального завершення Gateway, timeout під час вимкнення та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо записувач має події. Перегляньте найновіший bundle за допомогою `openclaw gateway stability --bundle latest`; параметри `--limit`, `--type` і `--since-seq` також застосовуються до виводу bundle.

### `gateway diagnostics export`

Записати локальний diagnostics zip, призначений для додавання до звітів про помилки.
Про модель приватності та вміст bundle дивіться [Diagnostics Export](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Параметри:

- `--output <path>`: шлях до вихідного zip. За замовчуванням — support export у каталозі стану.
- `--log-lines <count>`: максимальна кількість санітизованих рядків логів для включення (за замовчуванням `5000`).
- `--log-bytes <bytes>`: максимальна кількість байтів логів для аналізу (за замовчуванням `1000000`).
- `--url <url>`: URL WebSocket Gateway для знімка health.
- `--token <token>`: токен Gateway для знімка health.
- `--password <password>`: пароль Gateway для знімка health.
- `--timeout <ms>`: timeout знімка status/health (за замовчуванням `3000`).
- `--no-stability-bundle`: пропустити пошук збереженого stability bundle.
- `--json`: вивести записаний шлях, розмір і маніфест у форматі JSON.

Експорт містить маніфест, зведення у Markdown, форму конфігурації, санітизовані деталі конфігурації, санітизовані зведення логів, санітизовані знімки status/health Gateway і найновіший stability bundle, якщо він існує.

Він призначений для поширення. Він зберігає операційні деталі, які допомагають у налагодженні, як-от безпечні поля логів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, id Plugin, id провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення логів. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookies, ідентифікатори облікових записів/повідомлень, текст prompt/instruction, імена хостів і секретні значення. Коли повідомлення у стилі LogTape виглядає як текст корисного навантаження користувача/чату/інструмента, експорт зберігає лише позначку, що повідомлення було пропущено, плюс кількість його байтів.

### `gateway status`

`gateway status` показує сервіс Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливостей з’єднання/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Параметри:

- `--url <url>`: додати явну ціль перевірки. Налаштовані remote + localhost також перевіряються.
- `--token <token>`: автентифікація токеном для перевірки.
- `--password <password>`: автентифікація паролем для перевірки.
- `--timeout <ms>`: timeout перевірки (за замовчуванням `10000`).
- `--no-probe`: пропустити перевірку з’єднання (лише перегляд сервісу).
- `--deep`: також сканувати системні сервіси.
- `--require-rpc`: підвищити типову перевірку з’єднання до перевірки читання й завершуватися з ненульовим кодом, якщо перевірка читання не пройшла. Не можна поєднувати з `--no-probe`.

Примітки:

- `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або невалідна.
- Типова `gateway status` підтверджує стан сервісу, WebSocket-з’єднання та можливість автентифікації, видиму під час handshake. Вона не підтверджує операції читання/запису/адміністрування.
- Діагностичні перевірки не змінюють стан для первинної автентифікації пристрою: вони повторно використовують
  наявний кешований токен пристрою, якщо він є, але не створюють нову
  ідентичність пристрою CLI або запис pairing read-only пристрою лише для перевірки статусу.
- `gateway status` за можливості розв’язує налаштовані auth SecretRef для автентифікації перевірки.
- Якщо в цьому шляху команди потрібний auth SecretRef не вдається розв’язати, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка з’єднання/автентифікації не проходить; передайте `--token`/`--password` явно або спочатку розв’яжіть джерело секрету.
- Якщо перевірка проходить успішно, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибнопозитивних спрацьовувань.
- Використовуйте `--require-rpc` у скриптах і автоматизації, коли сервісу, що слухає порт, недостатньо і потрібно, щоб виклики RPC з правом читання також були працездатні.
- `--deep` додає best-effort сканування додаткових установок launchd/systemd/schtasks. Якщо виявлено кілька сервісів, схожих на gateway, у виводі для людини друкуються підказки щодо очищення й попередження, що в більшості налаштувань має працювати один gateway на машину.
- Вивід для людини містить розв’язаний шлях до файлового логу плюс знімок шляхів/валідності конфігурації CLI-vs-service, щоб допомогти діагностувати розходження профілю або каталогу стану.
- Для інсталяцій systemd у Linux перевірки розходжень автентифікації сервісу читають і значення `Environment=`, і `EnvironmentFile=` з unit-файлу (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
- Перевірки розходжень розв’язують `gateway.auth.token` SecretRef, використовуючи об’єднане runtime env (спочатку env команди сервісу, потім process env як запасний варіант).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не задано, коли може перемогти пароль і жоден кандидат на токен не може перемогти), перевірки розходжень токена пропускають розв’язання токена конфігурації.

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо remote налаштовано**.

Якщо ви передасте `--url`, ця явна ціль буде додана перед обома. У виводі для людини
цілі позначаються так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

Якщо доступні кілька gateway, буде виведено всі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але в більшості інсталяцій усе ще працює один gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Тлумачення:

- `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-з’єднання.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що саме перевірка змогла підтвердити щодо автентифікації. Це окремо від досяжності.
- `Read probe: ok` означає, що також успішно виконалися RPC-виклики деталізації з областю читання (`health`/`status`/`system-presence`/`config.get`).
- `Read probe: limited - missing scope: operator.read` означає, що з’єднання встановлено успішно, але RPC із областю читання обмежені. Це повідомляється як **погіршена** досяжність, а не повна невдача.
- Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не
  створює первинну ідентичність пристрою або стан pairing.
- Код виходу є ненульовим лише тоді, коли жодна перевірена ціль недосяжна.

Примітки щодо JSON (`--json`):

- Верхній рівень:
  - `ok`: принаймні одна ціль досяжна.
  - `degraded`: принаймні для однієї цілі RPC деталізації було обмежене областю видимості.
  - `capability`: найкраща можливість, виявлена серед досяжних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
  - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем, у такому порядку: явний URL, SSH-тунель, налаштований remote, потім локальний loopback.
  - `warnings[]`: best-effort записи попереджень із `code`, `message` та необов’язковим `targetIds`.
  - `network`: підказки URL для локального loopback/tailnet, виведені з поточної конфігурації та мережі хоста.
  - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет часу/кількість результатів виявлення, використані для цього проходу probe.
- Для кожної цілі (`targets[].connect`):
  - `ok`: досяжність після з’єднання + класифікація degraded.
  - `rpcOk`: повний успіх RPC деталізації.
  - `scopeLimited`: RPC деталізації не вдалося виконати через відсутню область `operator.read`.
- Для кожної цілі (`targets[].auth`):
  - `role`: роль автентифікації, повідомлена в `hello-ok`, якщо доступна.
  - `scopes`: надані області видимості, повідомлені в `hello-ok`, якщо доступні.
  - `capability`: класифікація можливостей автентифікації, відображена для цієї цілі.

Поширені коди попереджень:

- `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда повернулася до прямих перевірок.
- `multiple_gateways`: було досягнуто більше ніж одну ціль; це нетипово, якщо тільки ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
- `auth_secretref_unresolved`: не вдалося розв’язати налаштований auth SecretRef для цілі, що завершилася невдачею.
- `probe_scope_limited`: WebSocket-з’єднання встановлено успішно, але перевірка читання була обмежена через відсутність `operator.read`.

#### Remote через SSH (паритет із застосунком Mac)

Режим “Remote over SSH” у застосунку macOS використовує локальне перенаправлення порту, тому віддалений gateway (який може бути прив’язаний лише до loopback) стає доступним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Параметри:

- `--ssh <target>`: `user@host` або `user@host:port` (порт за замовчуванням `22`).
- `--ssh-identity <path>`: файл ідентичності.
- `--ssh-auto`: вибрати перший виявлений хост gateway як SSH-ціль із розв’язаного
  ендпойнта виявлення (`local.` плюс налаштований wide-area домен, якщо є). Підказки
  лише з TXT ігноруються.

Конфігурація (необов’язкова, використовується як значення за замовчуванням):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий помічник RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Параметри:

- `--params <json>`: рядок JSON-об’єкта для параметрів (за замовчуванням `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Примітки:

- `--params` має бути валідним JSON.
- `--expect-final` призначений переважно для RPC у стилі агента, які перед остаточним payload передають проміжні події.

## Керування сервісом Gateway

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
- Використовуйте `gateway restart`, щоб перезапустити керований сервіс. Не поєднуйте `gateway stop` і `gateway start` як заміну перезапуску; у macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
- Коли автентифікація токеном вимагає токен, а `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метадані середовища сервісу.
- Якщо автентифікація токеном вимагає токен, а налаштований token SecretRef не розв’язується, установлення завершується із закритою помилкою замість збереження резервного plaintext.
- Для автентифікації паролем у `gateway run` віддавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password`, підкріпленому SecretRef, замість inline `--password`.
- У режимі inferred auth лише `OPENCLAW_GATEWAY_PASSWORD` в оболонці не послаблює вимоги до токена для install; використовуйте стійку конфігурацію (`gateway.auth.password` або config `env`) під час установлення керованого сервісу.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде встановлено явно.
- Команди життєвого циклу приймають `--json` для сценаріїв.

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (наприклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [/gateway/bonjour](/uk/gateway/bonjour)

Маяк рекламують лише gateway з увімкненим виявленням Bonjour (за замовчуванням увімкнено).

Записи Wide-Area discovery містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; за його відсутності клієнти використовують для SSH-цілей значення `22`)
- `tailnetDns` (ім’я хоста MagicDNS, якщо доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка remote-install, записана до wide-area зони)

### `gateway discover`

```bash
openclaw gateway discover
```

Параметри:

- `--timeout <ms>`: timeout для кожної команди (browse/resolve); за замовчуванням `2000`.
- `--json`: машинозчитуваний вивід (також вимикає стилізацію/spinner).

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Примітки:

- CLI сканує `local.` плюс налаштований wide-area домен, якщо його ввімкнено.
- `wsUrl` у JSON-виводі виводиться з розв’язаного ендпойнта сервісу, а не з підказок
  лише з TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише тоді, коли
  `discovery.mdns.mode` має значення `full`. Wide-area DNS-SD усе одно записує `cliPath`; `sshPort`
  там теж залишається необов’язковим.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Інструкція з експлуатації Gateway](/uk/gateway)
