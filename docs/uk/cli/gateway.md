---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення шлюзів через Bonjour (локально + DNS-SD широкої зони)
sidebarTitle: Gateway
summary: CLI шлюзу OpenClaw (`openclaw gateway`) — запуск, запити та виявлення шлюзів
title: Gateway
x-i18n:
    generated_at: "2026-04-27T04:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 795d30511ad7a98093edfcfb862869349e1454d3e01f18dec7912cc2128934de
    source_path: cli/gateway.md
    workflow: 15
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки). Підкоманди на цій сторінці доступні через `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення через Bonjour" href="/uk/gateway/bonjour">
    Налаштування локального mDNS + DNS-SD широкої зони.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw оголошує шлюзи та знаходить їх.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration">
    Ключі конфігурації Gateway верхнього рівня.
  </Card>
</CardGroup>

## Запуск Gateway

Запустіть локальний процес Gateway:

```bash
openclaw gateway
```

Псевдонім для запуску у передньому плані:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Поведінка запуску">
    - За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Використовуйте `--allow-unconfigured` для ad-hoc/dev запусків.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` записують `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та виправте її, а не припускайте неявно локальний режим.
    - Якщо файл існує і `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється «вгадувати local» за вас.
    - Прив’язка поза межами loopback без автентифікації блокується (захисне обмеження).
    - `SIGUSR1` запускає перезапуск у межах процесу, якщо це дозволено (`commands.restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб заборонити ручний перезапуск, водночас `gateway tool/config apply/update` залишаться дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жодний нестандартний стан термінала. Якщо ви обгортаєте CLI через TUI або raw-mode ввід, відновіть термінал перед виходом.
  </Accordion>
</AccordionGroup>

### Параметри

<ParamField path="--port <port>" type="number">
  Порт WebSocket (типове значення надходить із config/env; зазвичай `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Режим прив’язки слухача.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Перевизначення режиму автентифікації.
</ParamField>
<ParamField path="--token <token>" type="string">
  Перевизначення токена (також встановлює `OPENCLAW_GATEWAY_TOKEN` для процесу).
</ParamField>
<ParamField path="--password <password>" type="string">
  Перевизначення пароля.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Зчитати пароль gateway з файлу.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Відкрити Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час завершення.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для ad-hoc/dev початкового запуску; не записує та не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити dev-конфігурацію + робочий простір, якщо вони відсутні (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути dev-конфігурацію + облікові дані + сесії + робочий простір (потрібен `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Перед запуском завершити будь-який наявний listener на вибраному порту.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні журнали.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише журнали бекенду CLI (і ввімкнути stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль журналу WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдонім для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записувати необроблені події потоку моделі в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до jsonl необробленого потоку.
</ParamField>

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати тривалість етапів під час запуску Gateway.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти запуск Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz` і часові показники трасування запуску.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: читабельний для людини (кольоровий у TTY).
    - `--json`: JSON для машинного читання (без стилізації/спінера).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши людський макет.
  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: тайм-аут/бюджет (залежить від команди).
    - `--expect-final`: чекати на «final» відповідь (виклики агента).
  </Tab>
</Tabs>

<Note>
Коли ви встановлюєте `--url`, CLI не використовує облікові дані з конфігурації або середовища як резервні. Явно передайте `--token` або `--password`. Відсутність явно вказаних облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпоінт `/healthz` є перевіркою життєздатності: він повертає відповідь, щойно сервер може відповідати по HTTP. HTTP-ендпоінт `/readyz` є суворішим і залишається червоним, поки стартові sidecar-компоненти, канали або налаштовані хуки ще завершують ініціалізацію.

### `gateway usage-cost`

Отримати зведення вартості використання з журналів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>

### `gateway stability`

Отримати нещодавній діагностичний журнал стабільності із запущеного Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Максимальна кількість нещодавніх подій для включення (максимум `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Фільтрувати за типом діагностичної події, наприклад `payload.large` або `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Включати лише події після діагностичного номера послідовності.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Зчитати збережений пакет стабільності замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану або передайте шлях до JSON пакета безпосередньо.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати zip-файл діагностики підтримки, яким можна поділитися, замість виведення подробиць стабільності.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка пакета">
    - Записи зберігають операційні метадані: назви подій, кількості, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/плагінів і відредаговані зведення сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, необроблені тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або необроблені ідентифікатори сесій. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути реєстратор.
    - Під час аварійного завершення Gateway, тайм-аутів завершення роботи та збоїв запуску після перезапуску OpenClaw записує той самий діагностичний знімок до `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо реєстратор має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний zip-файл діагностики, призначений для прикріплення до звітів про помилки. Модель конфіденційності та вміст пакета дивіться в [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях до вихідного zip-файлу. За замовчуванням — експорт підтримки в каталозі стану.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Максимальна кількість очищених рядків журналу для включення.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Максимальна кількість байтів журналу для аналізу.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway для знімка health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway для знімка health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway для знімка health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Тайм-аут знімка status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Пропустити пошук збереженого пакета стабільності.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести записаний шлях, розмір і маніфест у форматі JSON.
</ParamField>

Експорт містить маніфест, зведення у Markdown, форму конфігурації, очищені деталі конфігурації, очищені зведення журналів, очищені знімки status/health Gateway та найновіший пакет стабільності, якщо він існує.

Його призначено для спільного використання. Він зберігає операційні деталі, які допомагають під час налагодження, наприклад безпечні поля журналів OpenClaw, назви підсистем, коди стану, тривалості, налаштовані режими, порти, ідентифікатори плагінів, ідентифікатори провайдерів, несекретні налаштування функцій і відредаговані операційні повідомлення журналів. Він пропускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookie, ідентифікатори облікових записів/повідомлень, текст prompt/інструкцій, імена хостів і секретні значення. Якщо повідомлення у стилі LogTape схоже на текст корисного навантаження користувача/чату/інструмента, експорт зберігає лише факт пропуску повідомлення та кількість його байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливостей підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль перевірки. Налаштовані remote + localhost також перевіряються.
</ParamField>
<ParamField path="--token <token>" type="string">
  Автентифікація токеном для перевірки.
</ParamField>
<ParamField path="--password <password>" type="string">
  Автентифікація паролем для перевірки.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Тайм-аут перевірки.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Пропустити перевірку підключення (лише перегляд служби).
</ParamField>
<ParamField path="--deep" type="boolean">
  Також сканувати служби системного рівня.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання та завершуватися з ненульовим кодом, якщо ця перевірка читання не вдається. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика status">
    - `gateway status` залишається доступною для діагностики, навіть якщо локальна конфігурація CLI відсутня або невалідна.
    - Стандартна `gateway status` підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час handshake. Вона не підтверджує операції читання/запису/адміністрування.
    - Діагностичні перевірки не змінюють стан для первинної автентифікації пристрою: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність CLI-пристрою або запис pairing для пристрою лише з правом читання лише для перевірки status.
    - `gateway status` за можливості розв’язує налаштовані SecretRef автентифікації для автентифікації перевірки.
    - Якщо потрібний SecretRef автентифікації не розв’язується в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації RPC не вдається; явно передайте `--token`/`--password` або спочатку виправте джерело секрету.
    - Якщо перевірка успішна, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибнопозитивних спрацювань.
    - Використовуйте `--require-rpc` у скриптах та автоматизації, коли недостатньо лише служби, що слухає, і потрібно, щоб RPC-виклики з областю читання також були справними.
    - `--deep` додає best-effort сканування додаткових установок launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на gateway, вивід для людини показує підказки з очищення й попереджає, що в більшості конфігурацій на одній машині має працювати один gateway.
    - Вивід для людини містить розв’язаний шлях до файлового журналу, а також знімок шляхів/валідності конфігурації CLI та служби, щоб допомогти діагностувати розходження профілю або каталогу стану.
  </Accordion>
  <Accordion title="Перевірки розходження автентифікації Linux systemd">
    - В установках Linux systemd перевірки розходження автентифікації служби читають значення `Environment=` і `EnvironmentFile=` з unit-файлу (включно з `%h`, шляхами в лапках, кількома файлами та необов’язковими файлами з `-`).
    - Перевірки розходження розв’язують SecretRef `gateway.auth.token`, використовуючи об’єднане середовище виконання (спочатку середовище команди служби, потім резервне середовище процесу).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не задано, де може перемогти пароль і жоден кандидат токена не може перемогти), перевірки розходження токена пропускають розв’язання токена конфігурації.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (loopback) **навіть якщо налаштовано remote**.

Якщо ви передаєте `--url`, ця явна ціль додається перед обома. Вивід для людини позначає цілі так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька gateway, команда виведе всі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але в більшості установок усе одно працює один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла WebSocket-підключення.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що перевірка змогла підтвердити щодо автентифікації. Це окремо від доступності.
    - `Read probe: ok` означає, що RPC-виклики деталей з областю читання (`health`/`status`/`system-presence`/`config.get`) також успішні.
    - `Read probe: limited - missing scope: operator.read` означає, що підключення успішне, але RPC із областю читання обмежено. Це повідомляється як **degraded** доступність, а не як повна помилка.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює первинну ідентичність пристрою або стан pairing.
    - Код виходу є ненульовим лише тоді, коли жодна перевірена ціль не є доступною.
  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль доступна.
    - `degraded`: принаймні одна ціль мала RPC деталей, обмежений областю.
    - `capability`: найкраща можливість, виявлена серед доступних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем, у такому порядку: явний URL, SSH-тунель, налаштований remote, потім local loopback.
    - `warnings[]`: записи попереджень best-effort з `code`, `message` та необов’язковими `targetIds`.
    - `network`: підказки URL local loopback/tailnet, виведені з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів виявлення, використані для цього проходу probe.

    Для кожної цілі (`targets[].connect`):

    - `ok`: доступність після підключення + класифікація degraded.
    - `rpcOk`: повний успіх RPC деталей.
    - `scopeLimited`: RPC деталей не вдалося через відсутню область operator.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступно.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступно.
    - `capability`: класифікація видимої можливості автентифікації для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: не вдалося налаштувати SSH-тунель; команда повернулася до прямих перевірок.
    - `multiple_gateways`: була доступна більше ніж одна ціль; це нетипово, якщо ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
    - `auth_secretref_unresolved`: налаштований SecretRef автентифікації не вдалося розв’язати для цілі, що завершилася помилкою.
    - `probe_scope_limited`: WebSocket-підключення успішне, але перевірка читання була обмежена через відсутність `operator.read`.
  </Accordion>
</AccordionGroup>

#### Віддалений доступ через SSH (паритет із застосунком Mac)

Режим застосунку macOS «Remote over SSH» використовує локальне переадресування порту, щоб віддалений gateway (який може бути прив’язаний лише до loopback) став доступним за адресою `ws://127.0.0.1:<port>`.

Еквівалент CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` або `user@host:port` (порт за замовчуванням — `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл ідентичності.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Вибрати перший виявлений хост gateway як ціль SSH із розв’язаного ендпоінта виявлення (`local.` плюс налаштований домен широкої зони, якщо він є). Підказки лише з TXT ігноруються.
</ParamField>

Конфігурація (необов’язкова, використовується як типове значення):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий помічник RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Рядок JSON-об’єкта для параметрів.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Токен Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Пароль Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Бюджет тайм-ауту.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Переважно для RPC у стилі агента, які передають проміжні події потоком перед фінальним корисним навантаженням.
</ParamField>
<ParamField path="--json" type="boolean">
  JSON-вивід для машинного читання.
</ParamField>

<Note>
`--params` має бути валідним JSON.
</Note>

## Керування службою Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Установлення з обгорткою

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад shim менеджера секретів або допоміжну програму run-as. Обгортка отримує звичайні аргументи Gateway і відповідає за те, щоб зрештою виконати `openclaw` або Node з цими аргументами.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Ви також можете задати обгортку через середовище. `gateway install` перевіряє, що шлях указує на виконуваний файл, записує обгортку в `ProgramArguments` служби та зберігає `OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і виправлень doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Щоб видалити збережену обгортку, очистьте `OPENCLAW_WRAPPER` під час перевстановлення:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Параметри команди">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="Поведінка життєвого циклу">
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не об’єднуйте `gateway stop` і `gateway start` як заміну перезапуску; у macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупиненням.
    - Команди життєвого циклу приймають `--json` для скриптів.
  </Accordion>
  <Accordion title="Автентифікація та SecretRefs під час установлення">
    - Коли автентифікація токеном вимагає токен, а `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
    - Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не розв’язується, установлення завершується в закритому режимі замість збереження резервного відкритого тексту.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У режимі автентифікації, що визначається автоматично, лише shell-змінна `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час установлення; використовуйте стійку конфігурацію (`gateway.auth.password` або config `env`) під час установлення керованої служби.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде задано явно.
  </Accordion>
</AccordionGroup>

## Виявлення шлюзів (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (приклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише шлюзи з увімкненим виявленням Bonjour (типово ввімкнено) оголошують маяк.

Записи виявлення Wide-Area містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти за замовчуванням використовують для SSH-цілей `22`, якщо він відсутній)
- `tailnetDns` (ім’я хоста MagicDNS, якщо доступне)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана до зони wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут на команду (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Вивід для машинного читання (також вимикає стилізацію/spinner).
</ParamField>

Приклади:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI сканує `local.` плюс налаштований домен широкої зони, коли його увімкнено.
- `wsUrl` у JSON-виводі виводиться з розв’язаного ендпоінта служби, а не з підказок лише TXT, таких як `lanHost` або `tailnetDns`.
- У `local.` mDNS `sshPort` і `cliPath` транслюються лише коли `discovery.mdns.mode` має значення `full`. Wide-Area DNS-SD усе одно записує `cliPath`; `sshPort` там також залишається необов’язковим.
</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Операційний посібник Gateway](/uk/gateway)
