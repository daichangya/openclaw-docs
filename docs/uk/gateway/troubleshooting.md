---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника на основі симптомів із точними командами
summary: Поглиблений посібник з усунення несправностей для Gateway, каналів, автоматизації, Node і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-25T03:24:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14565a260226cbd3c78e1449621da5ff0bb8f580d3f10345a7d8650db9f706a8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Gateway

Ця сторінка — поглиблений посібник.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете пройти швидкий сценарій первинної діагностики.

## Сходинки команд

Спочатку виконайте ці команди в такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації або сервісу.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису і,
  де це підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте цей розділ, коли в логах/помилках є:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити завершуються помилкою лише в довгих сесіях/запусках моделі, яким потрібен шлях 1M beta.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на Anthropic API key.
3. Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic з довгим контекстом відхиляються.

Пов’язано:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний бекенд проходить прямі probe, але запуски агента завершуються помилкою

Використовуйте цей розділ, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделі OpenClaw завершуються помилкою лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Зверніть увагу на таке:

- малі прямі виклики успішні, але запуски OpenClaw завершуються помилкою лише на більших prompt
- помилки бекенда про те, що `messages[].content` очікує рядок
- збої бекенда, які виникають лише за більших значень prompt-token або повних
  prompt середовища виконання агента

Поширені ознаки:

- `messages[...].content: invalid type: sequence, expected a string` → бекенд
  відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- малі прямі запити успішні, але запуски агента OpenClaw завершуються помилкою через збої бекенда/моделі
  (наприклад, Gemma на деяких збірках `inferrs`) → транспорт OpenClaw
  імовірно вже налаштований правильно; збій виникає в бекенді на більшій формі prompt
  середовища виконання агента.
- після вимкнення інструментів збоїв меншає, але вони не зникають → схеми інструментів
  були частиною навантаження, але залишкова проблема все ще полягає в обмеженнях
  upstream моделі/сервера або в помилці бекенда.

Варіанти виправлення:

1. Установіть `compat.requiresStringContent: true` для бекендів Chat Completions, що підтримують лише рядки.
2. Установіть `compat.supportsTools: false` для моделей/бекендів, які не можуть
   надійно обробляти поверхню схем інструментів OpenClaw.
3. Де можливо, зменште навантаження від prompt: менший bootstrap робочого простору, коротша
   історія сесії, легша локальна модель або бекенд із кращою підтримкою
   довгого контексту.
4. Якщо малі прямі запити й далі успішні, а ходи агента OpenClaw усе ще викликають збій
   усередині бекенда, вважайте це обмеженням upstream сервера/моделі та
   створіть там відтворюваний приклад із прийнятою формою payload.

Пов’язано:

- [/gateway/local-models](/uk/gateway/local-models)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але відповідей немає, перш ніж щось перепідключати, перевірте маршрутизацію та політику.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Очікування pair для відправників у DM.
- Обмеження згадками в групах (`requireMention`, `mentionPatterns`).
- Невідповідності списків дозволу для каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення групи ігнорується, доки не буде згадки.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язано:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення dashboard/control UI

Якщо dashboard/control UI не підключається, перевірте URL, режим auth і припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильний probe URL і dashboard URL.
- Невідповідність режиму auth/token між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Поширені ознаки:

- `device identity required` → небезпечний контекст або відсутня auth пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з не-loopback походження браузера без явного
  списку дозволу).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  challenge-based потік auth пристрою (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або використав застарілу часову мітку) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом
  із pair токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість
  зберігають запитаний ними набір scope.
- Поза цим шляхом повторної спроби пріоритет auth під час підключення такий: явний спільний
  токен/пароль спочатку, потім явний `deviceToken`, потім збережений токен пристрою,
  потім bootstrap token.
- На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як обмежувач зафіксує невдачу. Тому дві
  одночасні хибні повторні спроби від того самого клієнта можуть показати `retry later`
  на другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з походженням браузера
  → повторні невдалі спроби з того самого нормалізованого `Origin` тимчасово блокуються;
  інше localhost-походження використовує окремий bucket.
- повторюваний `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена та за потреби повторно схваліть/перевипустіть токен пристрою.
- `gateway connect failed:` → неправильний host/port/url призначення.

### Швидка карта кодів деталей auth

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Detail code                  | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий shared token.                                                                                                                                                 | Вставте/встановіть токен у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштування Control UI.                                                                                                                 |
| `AUTH_TOKEN_MISMATCH`        | Shared token не збігається з auth token Gateway.                                                                                                                                              | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явними `deviceToken` / `scopes` зберігають запитаний набір scope. Якщо помилка лишається, виконайте [контрольний список відновлення після розсинхронізації токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для окремого пристрою застарів або був відкликаний.                                                                                                                           | Перевипустіть/повторно схваліть токен пристрою за допомогою [CLI для пристроїв](/uk/cli/devices), а потім підключіться знову.                                                                                                                                                           |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на значення `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використовуйте `requestId` / `remediationHint`, якщо вони є. | Схваліть очікувальний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/role використовують той самий потік після перевірки запитаного доступу.                                                                                           |

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо логи показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте, що він:

1. очікує `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` із тим самим nonce challenge

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано заборонено:

- сесії з pair токеном пристрою можуть керувати лише **власним** пристроєм, якщо
  виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті scope оператора,
  які сесія виклику вже має

Пов’язано:

- [/web/control-ui](/uk/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими auth Gateway)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/uk/cli/devices)

## Сервіс Gateway не запущено

Використовуйте цей розділ, коли сервіс установлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Зверніть увагу на таке:

- `Runtime: stopped` із підказками щодо завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` vs `Config (service)`).
- Конфлікти портів/слухачів.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Поширені ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим Gateway не ввімкнено, або файл конфігурації було пошкоджено й він втратив `gateway.mode`. Виправлення: установіть `gateway.mode="local"` у конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію для локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → не-loopback прив’язування без чинного шляху auth Gateway (token/password або trusted-proxy, якщо налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні юніти launchd/systemd/schtasks. У більшості конфігурацій слід тримати один Gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язано:

- [/gateway/background-process](/uk/gateway/background-process)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/doctor](/uk/gateway/doctor)

## Gateway відновив останню відому справну конфігурацію

Використовуйте цей розділ, коли Gateway запускається, але в логах сказано, що він відновив `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Зверніть увагу на таке:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Файл `openclaw.json.clobbered.*` з часовою міткою поруч з активною конфігурацією
- Подію системи main-agent, що починається з `Config recovery warning`

Що сталося:

- Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
- OpenClaw зберіг відхилений payload як `.clobbered.*`.
- Активну конфігурацію було відновлено з останньої перевіреної останньої відомої справної копії.
- Наступний хід main-agent отримує попередження не переписувати бездумно відхилену конфігурацію.
- Якщо всі проблеми валідації були в межах `plugins.entries.<id>...`, OpenClaw
  не відновлював би весь файл. Локальні збої Plugin залишаються явними, тоді як не пов’язані
  користувацькі налаштування залишаються в активній конфігурації.

Перевірка й виправлення:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Поширені ознаки:

- існує `.clobbered.*` → зовнішнє пряме редагування або читання під час запуску було відновлено.
- існує `.rejected.*` → запис конфігурації, що належить OpenClaw, не пройшов перевірки схеми або clobber перед фіксацією.
- `Config write rejected:` → під час запису було зроблено спробу прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було розпізнано як пошкоджений, оскільки він втратив поля або розмір порівняно з останньою відомою справною резервною копією.
- `Config last-known-good promotion skipped` → кандидат містив замасковані заповнювачі секретів, наприклад `***`.

Варіанти виправлення:

1. Залиште відновлену активну конфігурацію, якщо вона правильна.
2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
3. Перед перезапуском виконайте `openclaw config validate`.
4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.

Пов’язано:

- [/gateway/configuration#strict-validation](/uk/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/uk/gateway/configuration#config-hot-reload)
- [/cli/config](/uk/cli/config)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте цей розділ, коли `openclaw gateway probe` до чогось дістається, але все одно виводить блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи стосується попередження резервного шляху через SSH, кількох Gateway, відсутніх scope або нерозв’язаних посилань auth.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіла більш ніж одна ціль. Зазвичай це означає навмисне налаштування з кількома Gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але деталізований RPC обмежено через scope; pair ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібен pair/схвалення перед звичайним доступом оператора.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → матеріал auth був недоступний у цьому шляху команди для цілі, що завершилася помилкою.

Пов’язано:

- [/cli/gateway](/uk/cli/gateway)
- [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host)
- [/gateway/remote](/uk/gateway/remote)

## Канал підключений, але повідомлення не проходять

Якщо стан каналу — підключено, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Зверніть увагу на таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Список дозволу для групи та вимоги до згадок.
- Відсутні дозволи/scope API каналу.

Поширені ознаки:

- `mention required` → повідомлення проігноровано політикою згадок у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема auth/дозволів каналу.

Пов’язано:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запускалися чи не доставлялися, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнено, і є час наступного пробудження.
- Стан історії запусків job (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/логів/середовища виконання.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але на цей тік жодне із завдань не заплановано.
- `heartbeat: unknown accountId` → невалідний account id для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat було зіставлено з призначенням у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) має значення `block`.

Пов’язано:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Помилка pair інструмента Node

Якщо Node pair виконано, але інструменти не працюють, ізолюйте стан переднього плану, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Node онлайн з очікуваними можливостями.
- Дозволи ОС для камери/мікрофона/геолокації/екрана.
- Стан схвалень exec і списку дозволу.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано списком дозволу.

Пов’язано:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Помилка інструмента браузера

Використовуйте цей розділ, коли дії інструмента браузера завершуються помилкою, хоча сам Gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи задано `plugins.allow` і чи містить він `browser`.
- Чинний шлях до виконуваного файлу браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

Поширені ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований Plugin браузера виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажувався.
- `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
- `browser.executablePath not found` → налаштований шлях є невалідним.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, як-от `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або неприпустимий порт.
- `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку inspect у браузері, увімкніть віддалене налагодження, залиште браузер відкритим, схваліть перший запит на підключення, а потім повторіть спробу. Якщо стан входу в обліковий запис не потрібен, віддайте перевагу керованому профілю `openclaw`.
- `No Chrome tabs found for profile="user"` → у профілі підключення Chrome MCP немає відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недосяжна з хоста Gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для підключення не має досяжної цілі, або HTTP endpoint відповів, але WebSocket CDP усе одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточній інсталяції Gateway відсутня залежність середовища виконання `playwright-core` для вбудованого Plugin браузера; виконайте `openclaw doctor --fix`, а потім перезапустіть Gateway. Знімки ARIA і базові знімки сторінок усе ще можуть працювати, але навігація, AI snapshots, знімки елементів за CSS-селекторами та експорт PDF залишаться недоступними.
- `fullPage is not supported for element screenshots` → запит знімка екрана поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів Chrome MCP потребують snapshot ref, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → для профілів Chrome MCP надсилайте одне завантаження за виклик.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `existing-session type does not support timeoutMs overrides.` → не використовуйте `timeoutMs` для `act:type` у профілях `profile="user"` / existing-session Chrome MCP, або використайте керований/CDP профіль браузера, якщо потрібен власний timeout.
- `existing-session evaluate does not support timeoutMs overrides.` → не використовуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / existing-session Chrome MCP, або використайте керований/CDP профіль браузера, якщо потрібен власний timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` все ще потребує керованого браузера або сирого профілю CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях лише для підключення або віддаленого CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну сесію керування та звільнити стан емуляції Playwright/CDP без перезапуску всього Gateway.

Пов’язано:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість збоїв після оновлення спричинені дрейфом конфігурації або суворішими типовими параметрами, які тепер застосовуються.

### 1) Змінилася поведінка auth і перевизначення URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалений Gateway, тоді як локальний сервіс працює нормально.
- Явні виклики `--url` не використовують резервний перехід до збережених облікових даних.

Поширені ознаки:

- `gateway connect failed:` → неправильний URL призначення.
- `unauthorized` → endpoint досяжний, але auth неправильний.

### 2) Обмеження bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Не-loopback bind (`lan`, `tailnet`, `custom`) потребують чинного шляху auth Gateway: auth через shared token/password або правильно налаштоване розгортання `trusted-proxy` не на loopback.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Поширені ознаки:

- `refusing to bind gateway ... without auth` → не-loopback bind без чинного шляху auth Gateway.
- `Connectivity probe: failed` при запущеному runtime → Gateway працює, але недоступний із поточними auth/url.

### 3) Змінився стан pair і ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Очікувальні схвалення пристроїв для dashboard/nodes.
- Очікувальні схвалення DM pair після змін політики або ідентичності.

Поширені ознаки:

- `device identity required` → не виконано auth пристрою.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація сервісу та runtime все ще не збігаються, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язано:

- [/gateway/pairing](/uk/gateway/pairing)
- [/gateway/authentication](/uk/gateway/authentication)
- [/gateway/background-process](/uk/gateway/background-process)

## Пов’язано

- [Посібник для Gateway](/uk/gateway)
- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
