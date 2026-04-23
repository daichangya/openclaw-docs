---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення шлюзів через Bonjour (локальний + широкозонний DNS-SD)
summary: CLI шлюзу OpenClaw (`openclaw gateway`) — запуск, запити й виявлення шлюзів
title: Gateway
x-i18n:
    generated_at: "2026-04-23T07:10:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30d261a33e54bed10c17c14d09d0dd2b8e227bbf9f0ed415e332e7bda4803f1e
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки).

Підкоманди на цій сторінці доступні в межах `openclaw gateway …`.

Пов’язана документація:

- [/gateway/bonjour](/uk/gateway/bonjour)
- [/gateway/discovery](/uk/gateway/discovery)
- [/gateway/configuration](/uk/gateway/configuration)

## Запуск Gateway

Запустіть локальний процес Gateway:

```bash
openclaw gateway
```

Псевдонім для запуску у передньому плані:

```bash
openclaw gateway run
```

Примітки:

- За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Для разових запусків або запусків у режимі розробки використовуйте `--allow-unconfigured`.
- Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією й виправте її, а не припускайте локальний режим неявно.
- Якщо файл існує, а `gateway.mode` відсутній, Gateway трактує це як підозріле пошкодження конфігурації й відмовляється «вгадувати local» за вас.
- Прив’язка за межами loopback без автентифікації блокується (захисне обмеження).
- `SIGUSR1` запускає перезапуск у межах процесу, якщо це дозволено (`commands.restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб заблокувати ручний перезапуск, тоді як gateway tool/config apply/update залишаються дозволеними).
- Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жодний спеціальний стан термінала. Якщо ви обгортаєте CLI у TUI або ввід у raw-mode, відновіть термінал перед виходом.

### Параметри

- `--port <port>`: порт WebSocket (значення за замовчуванням береться з config/env; зазвичай `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: режим прив’язки слухача.
- `--auth <token|password>`: перевизначення режиму автентифікації.
- `--token <token>`: перевизначення токена (також установлює `OPENCLAW_GATEWAY_TOKEN` для процесу).
- `--password <password>`: перевизначення пароля. Попередження: паролі, передані безпосередньо в команді, можуть бути видимі в локальних списках процесів.
- `--password-file <path>`: читати пароль gateway з файлу.
- `--tailscale <off|serve|funnel>`: опублікувати Gateway через Tailscale.
- `--tailscale-reset-on-exit`: скинути конфігурацію Tailscale serve/funnel під час завершення.
- `--allow-unconfigured`: дозволити запуск gateway без `gateway.mode=local` у config. Це обходить захист запуску лише для разового запуску або bootstrap у режимі розробки; параметр не записує та не виправляє файл конфігурації.
- `--dev`: створити конфігурацію та workspace для розробки, якщо їх немає (пропускає BOOTSTRAP.md).
- `--reset`: скинути конфігурацію для розробки, облікові дані, сесії та workspace (потребує `--dev`).
- `--force`: завершити будь-який наявний listener на вибраному порту перед запуском.
- `--verbose`: докладні журнали.
- `--cli-backend-logs`: показувати в консолі лише журнали бекенда CLI (і ввімкнути stdout/stderr).
- `--ws-log <auto|full|compact>`: стиль журналів websocket (типово `auto`).
- `--compact`: псевдонім для `--ws-log compact`.
- `--raw-stream`: журналювати необроблені події потоку моделі у jsonl.
- `--raw-stream-path <path>`: шлях до jsonl необробленого потоку.

Профілювання запуску:

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати часові показники фаз під час запуску Gateway.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виконати бенчмарк запуску Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz` і часові показники трасування запуску.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

Режими виводу:

- Типово: зручний для читання людиною формат (кольоровий у TTY).
- `--json`: JSON для машинного читання (без стилізації/спінера).
- `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши формат для читання людиною.

Спільні параметри (де підтримуються):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: токен Gateway.
- `--password <password>`: пароль Gateway.
- `--timeout <ms>`: timeout/бюджет часу (залежить від команди).
- `--expect-final`: чекати на «final» відповідь (виклики агента).

Примітка: коли ви вказуєте `--url`, CLI не використовує як запасний варіант облікові дані з config або середовища.
Передайте `--token` або `--password` явно. Відсутність явно вказаних облікових даних є помилкою.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпойнт `/healthz` — це перевірка живості: він відповідає, щойно сервер може обслуговувати HTTP. HTTP-ендпойнт `/readyz` суворіший і залишається в стані red, поки побічні компоненти запуску, канали або налаштовані хуки ще стабілізуються.

### `gateway usage-cost`

Отримати зведення usage-cost із журналів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Параметри:

- `--days <days>`: кількість днів для включення (типово `30`).

### `gateway stability`

Отримати нещодавній засіб запису діагностичної стабільності з запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Параметри:

- `--limit <limit>`: максимальна кількість нещодавніх подій для включення (типово `25`, максимум `1000`).
- `--type <type>`: фільтр за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
- `--since-seq <seq>`: включати лише події після номера діагностичної послідовності.
- `--bundle [path]`: читати збережений пакет стабільності замість звернення до запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану або передайте шлях до JSON-файлу пакета безпосередньо.
- `--export`: записати zip-файл із діагностикою для підтримки, яким можна ділитися, замість виведення подробиць стабільності.
- `--output <path>`: шлях виводу для `--export`.

Примітки:

- Засіб запису активний за замовчуванням і не містить payload: він фіксує лише операційні метадані, а не текст чату, результати інструментів чи необроблені тіла запитів або відповідей. Установлюйте `diagnostics.enabled: false` лише коли потрібно повністю вимкнути збір діагностичного Heartbeat Gateway.
- Записи зберігають операційні метадані: назви подій, кількості, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/Plugin і зредаговані підсумки сесій. Вони не зберігають текст чату, тіла webhook, результати інструментів, необроблені тіла запитів або відповідей, токени, cookies, секретні значення, імена хостів або необроблені id сесій.
- У разі фатального завершення Gateway, timeout під час завершення роботи та збоїв запуску під час перезапуску OpenClaw записує той самий діагностичний знімок до `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо засіб запису має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; параметри `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.

### `gateway diagnostics export`

Записати локальний zip-файл діагностики, призначений для додавання до звітів про помилки.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Параметри:

- `--output <path>`: шлях до вихідного zip-файлу. За замовчуванням — support export у каталозі стану.
- `--log-lines <count>`: максимальна кількість санітизованих рядків журналу для включення (типово `5000`).
- `--log-bytes <bytes>`: максимальна кількість байтів журналу для аналізу (типово `1000000`).
- `--url <url>`: URL WebSocket Gateway для знімка health.
- `--token <token>`: токен Gateway для знімка health.
- `--password <password>`: пароль Gateway для знімка health.
- `--timeout <ms>`: timeout знімка status/health (типово `3000`).
- `--no-stability-bundle`: пропустити пошук збереженого пакета стабільності.
- `--json`: вивести записаний шлях, розмір і маніфест як JSON.

Експорт містить маніфест, підсумок у Markdown, форму конфігурації, санітизовані деталі конфігурації, санітизовані підсумки журналів, санітизовані знімки status/health Gateway і найновіший пакет стабільності, якщо він існує.

Він призначений для поширення. Він зберігає операційні деталі, що допомагають налагодженню, наприклад безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, id Plugin, id провайдерів, несекретні налаштування функцій і зредаговані повідомлення операційних журналів. Він пропускає або редагує текст чату, тіла webhook, результати інструментів, облікові дані, cookies, ідентифікатори акаунтів/повідомлень, текст prompt/інструкцій, імена хостів і секретні значення. Коли повідомлення у стилі LogTape виглядає як текст payload користувача/чату/інструмента, експорт зберігає лише факт пропуску повідомлення та кількість його байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливостей підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Параметри:

- `--url <url>`: додати явну ціль для probe. Налаштовані remote + localhost усе одно перевіряються.
- `--token <token>`: автентифікація токеном для probe.
- `--password <password>`: автентифікація паролем для probe.
- `--timeout <ms>`: timeout probe (типово `10000`).
- `--no-probe`: пропустити перевірку підключення (лише перегляд служби).
- `--deep`: також сканувати системні служби.
- `--require-rpc`: підвищити типову перевірку підключення до перевірки читання й завершуватися з ненульовим кодом, якщо ця перевірка читання не вдалася. Не можна поєднувати з `--no-probe`.

Примітки:

- `gateway status` залишається доступною для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
- Типова `gateway status` підтверджує стан служби, WebSocket-підключення та можливість автентифікації, видиму на етапі handshake. Вона не підтверджує операції читання/запису/адміністрування.
- `gateway status` за можливості розв’язує налаштовані auth SecretRef для автентифікації probe.
- Якщо необхідний auth SecretRef неможливо розв’язати в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації probe не вдається; передайте `--token`/`--password` явно або спочатку розв’яжіть джерело секрету.
- Якщо probe виконується успішно, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибнопозитивних результатів.
- Використовуйте `--require-rpc` у скриптах та автоматизації, коли недостатньо лише служби, що слухає, і потрібно, щоб виклики RPC з областю читання також були працездатні.
- `--deep` додає спробу виявити додаткові інсталяції launchd/systemd/schtasks. Коли виявлено кілька gateway-подібних служб, вивід для людини містить підказки з очищення й попереджає, що в більшості конфігурацій має працювати один gateway на машину.
- Вивід для людини містить розв’язаний шлях до файлового журналу, а також знімок шляхів/валідності конфігурації CLI-в-порівнянні-зі-службою, щоб допомогти діагностувати дрейф профілю або каталогу стану.
- У Linux-інсталяціях systemd перевірки дрейфу автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit-файлу (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
- Перевірки дрейфу розв’язують SecretRef у `gateway.auth.token`, використовуючи об’єднане runtime env (спочатку env команди служби, потім запасний варіант — env процесу).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не задано, де може перемогти пароль і жоден кандидат токена не може перемогти), перевірки дрейфу токена пропускають розв’язання токена конфігурації.

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо віддалений gateway налаштовано**.

Якщо ви передасте `--url`, цю явну ціль буде додано перед обома. У виводі для людини
цілі позначаються так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

Якщо доступно кілька gateway, буде показано їх усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість інсталяцій усе ще запускає один gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Тлумачення:

- `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що probe змогла підтвердити щодо автентифікації. Це окремо від досяжності.
- `Read probe: ok` означає, що також успішно виконалися детальні RPC-виклики з областю читання (`health`/`status`/`system-presence`/`config.get`).
- `Read probe: limited - missing scope: operator.read` означає, що підключення встановлено успішно, але RPC з областю читання обмежені. Це повідомляється як **погіршена** досяжність, а не повна помилка.
- Код виходу ненульовий лише тоді, коли жодна з перевірених цілей недоступна.

Примітки щодо JSON (`--json`):

- Верхній рівень:
  - `ok`: принаймні одна ціль доступна.
  - `degraded`: принаймні одна ціль мала RPC подробиць, обмежений областю доступу.
  - `capability`: найвища можливість, виявлена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
  - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем, у такому порядку: явний URL, SSH-тунель, налаштований remote, потім локальний loopback.
  - `warnings[]`: записи попереджень у режимі best-effort з полями `code`, `message` та необов’язковим `targetIds`.
  - `network`: підказки URL для локального loopback/tailnet, отримані з поточної конфігурації та мережі хоста.
  - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет виявлення/кількість результатів, використані в цьому проході probe.
- Для кожної цілі (`targets[].connect`):
  - `ok`: доступність після підключення + класифікація degraded.
  - `rpcOk`: повний успіх RPC подробиць.
  - `scopeLimited`: RPC подробиць не вдалося виконати через відсутню область доступу оператора.
- Для кожної цілі (`targets[].auth`):
  - `role`: роль автентифікації, повідомлена в `hello-ok`, якщо доступна.
  - `scopes`: надані області доступу, повідомлені в `hello-ok`, якщо доступні.
  - `capability`: класифікація можливості автентифікації, відображена для цієї цілі.

Поширені коди попереджень:

- `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда переключилася на прямі probe.
- `multiple_gateways`: було доступно більше ніж одну ціль; це нетипово, якщо ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
- `auth_secretref_unresolved`: не вдалося розв’язати налаштований auth SecretRef для цілі, що завершилася помилкою.
- `probe_scope_limited`: WebSocket-підключення було успішним, але probe читання була обмежена через відсутність `operator.read`.

#### Remote через SSH (паритет із застосунком Mac)

Режим «Remote over SSH» у застосунку macOS використовує локальне перенаправлення порту, тому віддалений gateway (який може бути прив’язаний лише до loopback) стає доступним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Параметри:

- `--ssh <target>`: `user@host` або `user@host:port` (порт за замовчуванням `22`).
- `--ssh-identity <path>`: файл ідентичності.
- `--ssh-auto`: вибрати перший виявлений хост gateway як SSH-ціль із розв’язаного
  ендпойнта виявлення (`local.` плюс налаштований wide-area домен, якщо він є). Підказки
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

- `--params <json>`: рядок JSON-об’єкта для params (типово `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Примітки:

- `--params` має бути коректним JSON.
- `--expect-final` призначено переважно для RPC у стилі агента, які передають проміжні події потоком перед фінальним payload.

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
- Коли автентифікація токеном потребує токена, а `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
- Якщо автентифікація токеном потребує токена, а налаштований SecretRef токена не розв’язується, інсталяція завершується в закритому режимі замість збереження резервного відкритого тексту.
- Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
- У режимі inferred auth значення `OPENCLAW_GATEWAY_PASSWORD`, задане лише в оболонці, не послаблює вимоги до токена під час інсталяції; під час інсталяції керованої служби використовуйте стійку конфігурацію (`gateway.auth.password` або `env` конфігурації).
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, інсталяція блокується, доки режим не буде явно встановлено.
- Команди життєвого циклу приймають `--json` для сценаріїв автоматизації.

## Виявлення gateway (Bonjour)

`gateway discover` сканує beacon Gateway (`_openclaw-gw._tcp`).

- Багатоадресний DNS-SD: `local.`
- Одноадресний DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [/gateway/bonjour](/uk/gateway/bonjour)

Лише gateway з увімкненим виявленням Bonjour (типово увімкнено) рекламують beacon.

Записи Wide-Area discovery містять (TXT):

- `role` (підказка про роль gateway)
- `transport` (підказка про транспорт, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти використовують `22` як SSH-ціль за замовчуванням, якщо значення відсутнє)
- `tailnetDns` (ім’я хоста MagicDNS, якщо доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленої інсталяції, записана до wide-area зони)

### `gateway discover`

```bash
openclaw gateway discover
```

Параметри:

- `--timeout <ms>`: timeout для кожної команди (browse/resolve); типово `2000`.
- `--json`: вивід для машинного читання (також вимикає стилізацію/спінер).

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Примітки:

- CLI сканує `local.` плюс налаштований wide-area домен, якщо такий увімкнено.
- `wsUrl` у JSON-виводі виводиться з розв’язаного ендпойнта служби, а не з підказок
  лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише коли
  `discovery.mdns.mode` має значення `full`. Wide-area DNS-SD усе одно записує `cliPath`; `sshPort`
  там теж залишається необов’язковим.
