---
read_when:
    - Запуск Gateway з CLI (розробка або сервери)
    - Налагодження автентифікації Gateway, режимів прив’язки та підключення
    - Виявлення Gateway через Bonjour (локально + широкозонний DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — запуск, запити та виявлення Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-27T02:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f26cf45f31d4b5987c7158af7d7935d443875e88413e691e4ad39fbb35cdc60
    source_path: cli/gateway.md
    workflow: 15
---

Gateway — це WebSocket-сервер OpenClaw (канали, вузли, сесії, хуки). Підкоманди на цій сторінці доступні через `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Виявлення Bonjour" href="/uk/gateway/bonjour">
    Локальне налаштування mDNS + широкозонного DNS-SD.
  </Card>
  <Card title="Огляд виявлення" href="/uk/gateway/discovery">
    Як OpenClaw рекламує та знаходить Gateway.
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
  <Accordion title="Поведінка під час запуску">
    - За замовчуванням Gateway відмовляється запускатися, якщо в `~/.openclaw/openclaw.json` не встановлено `gateway.mode=local`. Для одноразових/розробницьких запусків використовуйте `--allow-unconfigured`.
    - Очікується, що `openclaw onboard --mode local` і `openclaw setup` запишуть `gateway.mode=local`. Якщо файл існує, але `gateway.mode` відсутній, вважайте це пошкодженою або перезаписаною конфігурацією та виправте її, а не припускайте неявно локальний режим.
    - Якщо файл існує, а `gateway.mode` відсутній, Gateway вважає це підозрілим пошкодженням конфігурації та відмовляється «вгадувати local» за вас.
    - Прив’язка за межами loopback без автентифікації заблокована (захисний запобіжник).
    - `SIGUSR1` запускає перезапуск у межах процесу за наявності дозволу (`commands.restart` увімкнено за замовчуванням; установіть `commands.restart: false`, щоб заблокувати ручний перезапуск, водночас `gateway tool/config apply/update` залишаться дозволеними).
    - Обробники `SIGINT`/`SIGTERM` зупиняють процес gateway, але не відновлюють жоден спеціальний стан термінала. Якщо ви обгортаєте CLI у TUI або ввід у raw mode, відновіть термінал перед виходом.
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
  Прочитати пароль gateway з файлу.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Відкрити Gateway через Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Скинути конфігурацію Tailscale serve/funnel під час завершення роботи.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Дозволити запуск gateway без `gateway.mode=local` у конфігурації. Обходить захист запуску лише для одноразового/розробницького bootstrap; не записує і не виправляє файл конфігурації.
</ParamField>
<ParamField path="--dev" type="boolean">
  Створити конфігурацію розробки + робочий простір, якщо їх немає (пропускає BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Скинути конфігурацію розробки + облікові дані + сесії + робочий простір (потрібен `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Завершити будь-який наявний listener на вибраному порту перед запуском.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Докладні журнали.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Показувати в консолі лише журнали бекенда CLI (і ввімкнути stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Стиль журналу WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Псевдонім для `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Записувати сирі події потоку моделі в jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Шлях до jsonl для сирого потоку.
</ParamField>

<Warning>
Вбудований `--password` може бути видимим у локальних списках процесів. Надавайте перевагу `--password-file`, env або `gateway.auth.password` на основі SecretRef.
</Warning>

### Профілювання запуску

- Установіть `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, щоб журналювати тривалість фаз під час запуску Gateway.
- Запустіть `pnpm test:startup:gateway -- --runs 5 --warmup 1`, щоб виміряти швидкодію запуску Gateway. Бенчмарк фіксує перший вивід процесу, `/healthz`, `/readyz` і тривалості з трасування запуску.

## Запит до запущеного Gateway

Усі команди запитів використовують WebSocket RPC.

<Tabs>
  <Tab title="Режими виводу">
    - За замовчуванням: зручний для читання людиною формат (кольоровий у TTY).
    - `--json`: JSON для машинного читання (без стилізації/spinner).
    - `--no-color` (або `NO_COLOR=1`): вимкнути ANSI, зберігши макет для людини.
  </Tab>
  <Tab title="Спільні параметри">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: токен Gateway.
    - `--password <password>`: пароль Gateway.
    - `--timeout <ms>`: тайм-аут/бюджет часу (залежить від команди).
    - `--expect-final`: чекати на «final» відповідь (виклики агента).
  </Tab>
</Tabs>

<Note>
Коли ви встановлюєте `--url`, CLI не використовує резервно облікові дані з конфігурації чи середовища. Передайте `--token` або `--password` явно. Відсутність явно заданих облікових даних є помилкою.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP-ендпоінт `/healthz` є перевіркою живучості: він повертає відповідь, щойно сервер може відповідати по HTTP. HTTP-ендпоінт `/readyz` суворіший і залишається червоним, поки сайдкари запуску, канали або налаштовані хуки ще завершують ініціалізацію.

### `gateway usage-cost`

Отримати зведення usage-cost із журналів сесій.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Кількість днів для включення.
</ParamField>

### `gateway stability`

Отримати нещодавній засіб запису діагностичної стабільності із запущеного Gateway.

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
  Включати лише події після номера послідовності діагностики.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Прочитати збережений пакет stability замість виклику запущеного Gateway. Використовуйте `--bundle latest` (або просто `--bundle`) для найновішого пакета в каталозі стану, або передайте шлях до JSON пакета безпосередньо.
</ParamField>
<ParamField path="--export" type="boolean">
  Записати ZIP-файл діагностики підтримки для поширення замість виведення відомостей про stability.
</ParamField>
<ParamField path="--output <path>" type="string">
  Шлях виводу для `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Конфіденційність і поведінка пакетів">
    - Записи зберігають операційні метадані: назви подій, кількість, розміри в байтах, показники пам’яті, стан черги/сесії, назви каналів/плагінів і відредаговані зведення сесій. Вони не зберігають текст чату, тіла webhook, виводи інструментів, сирі тіла запитів або відповідей, токени, cookie, секретні значення, імена хостів або сирі ідентифікатори сесій. Установіть `diagnostics.enabled: false`, щоб повністю вимкнути засіб запису.
    - У разі фатального завершення Gateway, тайм-аутів завершення роботи та збоїв запуску під час перезапуску OpenClaw записує той самий діагностичний знімок у `~/.openclaw/logs/stability/openclaw-stability-*.json`, якщо засіб запису має події. Перегляньте найновіший пакет за допомогою `openclaw gateway stability --bundle latest`; `--limit`, `--type` і `--since-seq` також застосовуються до виводу пакета.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Записати локальний ZIP-файл діагностики, призначений для додавання до звітів про помилки. Модель конфіденційності та вміст пакета див. у [Експорт діагностики](/uk/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Шлях виводу ZIP. За замовчуванням — експорт для підтримки в каталозі стану.
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
  Пропустити пошук збереженого пакета stability.
</ParamField>
<ParamField path="--json" type="boolean">
  Вивести записаний шлях, розмір і маніфест у форматі JSON.
</ParamField>

Експорт містить маніфест, зведення у Markdown, форму конфігурації, очищені відомості конфігурації, очищені зведення журналів, очищені знімки status/health Gateway і найновіший пакет stability, якщо він існує.

Він призначений для спільного використання. Він зберігає операційні відомості, що допомагають у налагодженні, як-от безпечні поля журналу OpenClaw, назви підсистем, коди статусу, тривалості, налаштовані режими, порти, ідентифікатори плагінів, ідентифікатори провайдерів, несекретні параметри функцій і відредаговані операційні повідомлення журналу. Він опускає або редагує текст чату, тіла webhook, виводи інструментів, облікові дані, cookie, ідентифікатори акаунтів/повідомлень, текст prompt/instruction, імена хостів і секретні значення. Коли повідомлення у стилі LogTape схоже на текст корисного навантаження користувача/чату/інструмента, експорт зберігає лише факт того, що повідомлення було пропущене, і кількість його байтів.

### `gateway status`

`gateway status` показує службу Gateway (launchd/systemd/schtasks) плюс необов’язкову перевірку можливостей підключення/автентифікації.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Додати явну ціль для перевірки. Налаштовані віддалені адреси + localhost також перевіряються.
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
  Також сканувати служби на рівні системи.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Підвищити стандартну перевірку підключення до перевірки читання та завершити з ненульовим кодом, якщо ця перевірка читання не вдасться. Не можна поєднувати з `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Семантика status">
    - `gateway status` залишається доступним для діагностики, навіть коли локальна конфігурація CLI відсутня або недійсна.
    - Типовий `gateway status` підтверджує стан служби, підключення WebSocket і можливість автентифікації, видиму під час handshake. Він не підтверджує операції читання/запису/адміністрування.
    - Діагностичні probe є немутуючими для автентифікації пристрою під час першого підключення: вони повторно використовують наявний кешований токен пристрою, якщо він існує, але не створюють нову ідентичність пристрою CLI або запис pairing пристрою лише для читання лише для перевірки статусу.
    - `gateway status` за можливості розв’язує налаштовані auth SecretRef для автентифікації probe.
    - Якщо обов’язковий auth SecretRef не розв’язується в цьому шляху команди, `gateway status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації probe не вдається; передайте `--token`/`--password` явно або спочатку виправте джерело secret.
    - Якщо probe успішний, попередження про нерозв’язані auth-ref пригнічуються, щоб уникнути хибнопозитивних спрацьовувань.
    - Використовуйте `--require-rpc` у скриптах та автоматизації, коли недостатньо лише служби, що слухає, і потрібно, щоб виклики RPC з областю читання також були працездатними.
    - `--deep` додає best-effort-сканування додаткових установок launchd/systemd/schtasks. Коли виявлено кілька служб, схожих на gateway, у виводі для людини друкуються підказки з очищення та попередження, що в більшості налаштувань має працювати один gateway на машину.
    - Вивід для людини містить розв’язаний шлях до файлового журналу, а також знімок шляхів/дійсності конфігурації CLI порівняно зі службою, щоб допомогти діагностувати дрейф профілю або каталогу стану.
  </Accordion>
  <Accordion title="Перевірки дрейфу автентифікації Linux systemd">
    - В установках Linux systemd перевірки дрейфу автентифікації служби читають значення і `Environment=`, і `EnvironmentFile=` з unit-файлу (включно з `%h`, шляхами в лапках, кількома файлами й необов’язковими файлами з `-`).
    - Перевірки дрейфу розв’язують SecretRef для `gateway.auth.token`, використовуючи об’єднане runtime env (спочатку env команди служби, потім резервно env процесу).
    - Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не задано, де може переважити пароль і жоден кандидат токена не може переважити), перевірки дрейфу токена пропускають розв’язання токена конфігурації.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` — це команда «налагодити все». Вона завжди перевіряє:

- ваш налаштований віддалений gateway (якщо задано), і
- localhost (local loopback) **навіть якщо налаштовано віддалений gateway**.

Якщо ви передасте `--url`, ця явна ціль буде додана перед обома. У виводі для людини цілі позначаються так:

- `URL (explicit)`
- `Remote (configured)` або `Remote (configured, inactive)`
- `Local loopback`

<Note>
Якщо доступні кілька gateway, команда виводить їх усі. Кілька gateway підтримуються, коли ви використовуєте ізольовані профілі/порти (наприклад, rescue bot), але більшість установок усе ще запускають один gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Інтерпретація">
    - `Reachable: yes` означає, що принаймні одна ціль прийняла підключення WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` повідомляє, що probe зміг підтвердити про автентифікацію. Це окремо від досяжності.
    - `Read probe: ok` означає, що також успішно виконалися детальні виклики RPC з областю читання (`health`/`status`/`system-presence`/`config.get`).
    - `Read probe: limited - missing scope: operator.read` означає, що підключення виконалося успішно, але RPC з областю читання обмежений. Це повідомляється як **degraded**-досяжність, а не як повна помилка.
    - Як і `gateway status`, probe повторно використовує наявну кешовану автентифікацію пристрою, але не створює ідентичність пристрою або стан pairing під час першого підключення.
    - Код виходу є ненульовим лише тоді, коли жодна з перевірених цілей не досяжна.
  </Accordion>
  <Accordion title="Вивід JSON">
    Верхній рівень:

    - `ok`: принаймні одна ціль досяжна.
    - `degraded`: принаймні одна ціль мала RPC з деталями, обмежений областю.
    - `capability`: найкраща можливість, помічена серед досяжних цілей (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` або `unknown`).
    - `primaryTargetId`: найкраща ціль, яку слід вважати активним переможцем, у такому порядку: явний URL, SSH tunnel, налаштований віддалений gateway, потім local loopback.
    - `warnings[]`: записи попереджень у режимі best-effort з полями `code`, `message` і необов’язковими `targetIds`.
    - `network`: підказки URL local loopback/tailnet, виведені з поточної конфігурації та мережі хоста.
    - `discovery.timeoutMs` і `discovery.count`: фактичний бюджет/кількість результатів виявлення, використані для цього проходу probe.

    Для кожної цілі (`targets[].connect`):

    - `ok`: досяжність після підключення + класифікація degraded.
    - `rpcOk`: повний успіх детального RPC.
    - `scopeLimited`: детальний RPC не вдався через відсутню область оператора.

    Для кожної цілі (`targets[].auth`):

    - `role`: роль автентифікації, повідомлена в `hello-ok`, коли доступно.
    - `scopes`: надані області, повідомлені в `hello-ok`, коли доступно.
    - `capability`: класифікація можливості автентифікації, показана для цієї цілі.

  </Accordion>
  <Accordion title="Поширені коди попереджень">
    - `ssh_tunnel_failed`: не вдалося налаштувати SSH tunnel; команда повернулася до прямих probe.
    - `multiple_gateways`: досяжною була більш ніж одна ціль; це нетипово, якщо лише ви навмисно не запускаєте ізольовані профілі, наприклад rescue bot.
    - `auth_secretref_unresolved`: налаштований auth SecretRef не вдалося розв’язати для цілі, що завершилася помилкою.
    - `probe_scope_limited`: підключення WebSocket виконалося успішно, але probe читання був обмежений через відсутність `operator.read`.
  </Accordion>
</AccordionGroup>

#### Віддалено через SSH (паритет із Mac app)

Режим macOS app «Remote over SSH» використовує локальне перенаправлення порту, щоб віддалений gateway (який може бути прив’язаний лише до loopback) став доступним за адресою `ws://127.0.0.1:<port>`.

Еквівалент у CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` або `user@host:port` (типовий порт — `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Файл ідентичності.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Вибрати перший виявлений хост gateway як ціль SSH із розв’язаного ендпоінта виявлення (`local.` плюс налаштований wide-area domain, якщо є). Підказки лише TXT ігноруються.
</ParamField>

Конфігурація (необов’язково, використовується як типове значення):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Низькорівневий допоміжний засіб RPC.

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
  Переважно для RPC у стилі агента, які транслюють проміжні події перед фінальним корисним навантаженням.
</ParamField>
<ParamField path="--json" type="boolean">
  JSON-вивід для машинного читання.
</ParamField>

<Note>
`--params` має бути дійсним JSON.
</Note>

## Керування службою Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Установлення з wrapper

Використовуйте `--wrapper`, коли керована служба має запускатися через інший виконуваний файл, наприклад shim менеджера секретів або helper для запуску від іншого користувача. Wrapper отримує звичайні аргументи Gateway і
відповідає за те, щоб зрештою виконати `openclaw` або Node з цими аргументами.

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

Ви також можете задати wrapper через середовище. `gateway install` перевіряє, що шлях є
виконуваним файлом, записує wrapper у `ProgramArguments` служби та зберігає
`OPENCLAW_WRAPPER` у середовищі служби для подальших примусових перевстановлень, оновлень і виправлень через doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Щоб видалити збережений wrapper, очистьте `OPENCLAW_WRAPPER` під час перевстановлення:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Параметри команд">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="Нотатки щодо встановлення служби та життєвого циклу">
    - `gateway install` підтримує `--port`, `--runtime`, `--token`, `--wrapper`, `--force`, `--json`.
    - `--wrapper <path>` змушує керовану службу запускатися через виконуваний wrapper, записуючи `ProgramArguments` як `<wrapper> gateway --port ...` і зберігаючи `OPENCLAW_WRAPPER` у середовищі служби, щоб примусові перевстановлення, оновлення та виправлення doctor продовжували використовувати той самий wrapper. `openclaw doctor` також повідомляє активний wrapper. Якщо `--wrapper` пропущено, install враховує наявний `OPENCLAW_WRAPPER` із shell або поточного середовища служби.
    - Щоб видалити збережений wrapper, перевстановіть із порожнім середовищем wrapper, наприклад `OPENCLAW_WRAPPER= openclaw gateway install --force`.
    - Використовуйте `gateway restart`, щоб перезапустити керовану службу. Не поєднуйте `gateway stop` і `gateway start` як заміну перезапуску; у macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.
    - Коли автентифікація токеном вимагає токен і `gateway.auth.token` керується через SecretRef, `gateway install` перевіряє, що SecretRef можна розв’язати, але не зберігає розв’язаний токен у метаданих середовища служби.
    - Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не розв’язується, установлення завершується за принципом fail closed замість збереження резервного відкритого тексту.
    - Для автентифікації паролем у `gateway run` надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` або `gateway.auth.password` на основі SecretRef замість вбудованого `--password`.
    - У режимі автентифікації, що виводиться автоматично, лише shell-змінна `OPENCLAW_GATEWAY_PASSWORD` не послаблює вимоги до токена під час встановлення; використовуйте стійку конфігурацію (`gateway.auth.password` або config `env`) під час встановлення керованої служби.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення блокується, доки режим не буде встановлено явно.
    - Команди життєвого циклу приймають `--json` для сценаріїв автоматизації.
  </Accordion>
</AccordionGroup>

## Виявлення gateway (Bonjour)

`gateway discover` сканує маяки Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): виберіть домен (наприклад: `openclaw.internal.`) і налаштуйте split DNS + DNS-сервер; див. [Bonjour](/uk/gateway/bonjour).

Лише gateway з увімкненим виявленням Bonjour (типово увімкнено) рекламують маяк.

Записи Wide-Area discovery містять (TXT):

- `role` (підказка ролі gateway)
- `transport` (підказка транспорту, наприклад `gateway`)
- `gatewayPort` (порт WebSocket, зазвичай `18789`)
- `sshPort` (необов’язково; клієнти типово використовують для SSH ціль `22`, якщо він відсутній)
- `tailnetDns` (ім’я хоста MagicDNS, коли доступно)
- `gatewayTls` / `gatewayTlsSha256` (TLS увімкнено + відбиток сертифіката)
- `cliPath` (підказка віддаленого встановлення, записана до wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Тайм-аут для кожної команди (browse/resolve).
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
- CLI сканує `local.` плюс налаштований wide-area domain, якщо його ввімкнено.
- `wsUrl` у JSON-виводі виводиться з розв’язаного ендпоінта служби, а не з підказок лише TXT, таких як `lanHost` або `tailnetDns`.
- Для `local.` mDNS `sshPort` і `cliPath` транслюються лише тоді, коли `discovery.mdns.mode` має значення `full`. Wide-area DNS-SD усе одно записує `cliPath`; `sshPort` і там теж залишається необов’язковим.
</Note>

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Інструкція з експлуатації Gateway](/uk/gateway)
