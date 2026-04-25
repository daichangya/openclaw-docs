---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника на основі симптомів із точними командами
summary: Детальний посібник з усунення несправностей для Gateway, каналів, автоматизації, Node і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-25T22:27:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 801ad437164d4bd5b834e5018e4d73d452a61d6e6f084093bb736b4531c428c1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Gateway

Ця сторінка є детальним посібником.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете швидкий сценарій первинної діагностики.

## Послідовність команд

Спочатку запустіть це в такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації або сервісів.
- `openclaw channels status --probe` показує живий стан транспорту для кожного акаунта та,
  де підтримується, результати probe/audit, наприклад `works` або `audit ok`.

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали або помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Перевірте таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити завершуються помилкою лише в довгих сесіях або запусках моделі, яким потрібен beta-шлях 1M.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використовуйте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на Anthropic API key.
3. Налаштуйте резервні моделі, щоб запуски тривали, коли запити Anthropic із довгим контекстом відхиляються.

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-compatible backend проходить прямі probe, але запуски агента завершуються помилкою

Використовуйте це, коли:

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

Перевірте таке:

- прямі малі виклики успішні, але запуски OpenClaw завершуються помилкою лише на більших prompt
- помилки backend про те, що `messages[].content` очікує рядок
- збої backend, які з’являються лише за більших значень prompt-token або з повними prompt середовища агента

Поширені ознаки:

- `messages[...].content: invalid type: sequence, expected a string` → backend відхиляє структуровані частини content у Chat Completions. Виправлення: установіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі малі запити успішні, але запуски агента OpenClaw завершуються збоями backend/моделі (наприклад, Gemma у деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, уже налаштований правильно; збій відбувається в backend через більшу форму prompt середовища агента.
- збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів були частиною навантаження, але решта проблеми все ще пов’язана з upstream-моделлю/серверною ємністю або помилкою backend.

Варіанти виправлення:

1. Установіть `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядковий content.
2. Установіть `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти поверхню схем інструментів OpenClaw.
3. Зменште навантаження prompt, де це можливо: менший bootstrap робочого простору, коротша історія сесії, легша локальна модель або backend із кращою підтримкою довгого контексту.
4. Якщо малі прямі запити й далі успішні, а ходи агента OpenClaw все ще призводять до збою всередині backend, розглядайте це як обмеження upstream-сервера/моделі та створіть там repro з прийнятою формою payload.

Пов’язане:

- [Локальні моделі](/uk/gateway/local-models)
- [Конфігурація](/uk/gateway/configuration)
- [OpenAI-compatible endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але відповідей немає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Перевірте таке:

- Для відправників у DM очікується pairing.
- Обмеження згадування в групах (`requireMention`, `mentionPatterns`).
- Невідповідність allowlist для каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення в групі ігнорується, доки не буде згадки.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправника або канал було відфільтровано політикою.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Pairing](/uk/channels/pairing)
- [Групи](/uk/channels/groups)

## Підключення dashboard/control UI

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Перевірте таке:

- Правильний URL probe і URL dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Поширені ознаки:

- `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з browser origin не на loopback без явного allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або використав застарілий timestamp) для поточного рукостискання.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може зробити одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом із paired токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` зберігають свій запитаний набір scope.
- Поза цим шляхом повторної спроби пріоритет автентифікації під час підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
- На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як обмежувач зафіксує невдачу. Тому дві одночасні невдалі повторні спроби від того самого клієнта можуть призвести до `retry later` у другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з browser-origin → повторні невдалі спроби від того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
- повторюване `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена та за потреби повторно схваліть/змініть токен пристрою.
- `gateway connect failed:` → неправильний вузол host/port/url.

### Швидка карта кодів деталей автентифікації

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                                                                                                                                                     | Рекомендована дія                                                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                              | Вставте/установіть токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, а потім вставте його в налаштуваннях Control UI.                                                                                                               |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації Gateway.                                                                                                                                   | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явним `deviceToken` / `scopes` зберігають запитані scope. Якщо проблема лишається, виконайте [контрольний список відновлення після розсинхронізації токенів](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для конкретного пристрою застарів або був відкликаний.                                                                                                                       | Змініть або повторно схваліть токен пристрою за допомогою [CLI пристроїв](/uk/cli/devices), а потім підключіться знову.                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на значення `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, якщо вони є. | Схваліть очікуваний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/ролей використовують той самий процес після перевірки запитаного доступу.                                                                                            |

Прямі loopback backend RPC, автентифіковані спільним токеном/паролем Gateway, не повинні залежати від базового набору scope paired-пристрою в CLI. Якщо subagent або інші внутрішні виклики все ще завершуються з `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примушує явний `deviceIdentity` або токен пристрою.

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо в журналах видно помилки nonce/signature, оновіть клієнт, що підключається, і перевірте, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим nonce challenge

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхиляється:

- сесії з токеном paired-пристрою можуть керувати лише **своїм власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scope, які сесія виклику вже має

Пов’язане:

- [Control UI](/uk/web/control-ui)
- [Конфігурація](/uk/gateway/configuration) (режими автентифікації Gateway)
- [Trusted proxy auth](/uk/gateway/trusted-proxy-auth)
- [Віддалений доступ](/uk/gateway/remote)
- [Пристрої](/uk/cli/devices)

## Сервіс Gateway не запущено

Використовуйте це, коли сервіс встановлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також сканує системні сервіси
```

Перевірте таке:

- `Runtime: stopped` із підказками щодо завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` vs `Config (service)`).
- Конфлікти портів/слухачів.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Поширені ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим Gateway не ввімкнено, або файл конфігурації було пошкоджено і він втратив `gateway.mode`. Виправлення: установіть `gateway.mode="local"` у своїй конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації Gateway (токен/пароль або trusted-proxy, якщо налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні модулі launchd/systemd/schtasks. У більшості конфігурацій слід використовувати один Gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язане:

- [Фонове виконання і process tool](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відновив останню відому справну конфігурацію

Використовуйте це, коли Gateway запускається, але в журналах сказано, що він відновив `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Перевірте таке:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Файл `openclaw.json.clobbered.*` із часовою міткою поруч з активною конфігурацією
- Системна подія основного агента, що починається з `Config recovery warning`

Що сталося:

- Відхилена конфігурація не пройшла перевірку під час запуску або гарячого перезавантаження.
- OpenClaw зберіг відхилений payload як `.clobbered.*`.
- Активну конфігурацію було відновлено з останньої перевіреної останньої відомої справної копії.
- Наступний хід основного агента отримує попередження не перезаписувати відхилену конфігурацію бездумно.
- Якщо всі проблеми перевірки були в межах `plugins.entries.<id>...`, OpenClaw
  не відновлював би весь файл. Помилки на рівні Plugin залишаються видимими, тоді як не пов’язані користувацькі налаштування залишаються в активній конфігурації.

Перевірка та виправлення:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Поширені ознаки:

- існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або читання під час запуску.
- існує `.rejected.*` → запис конфігурації, яким керував OpenClaw, не пройшов перевірку схеми або clobber перед фіксацією.
- `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти недійсну конфігурацію.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було розцінено як пошкоджений, оскільки він втратив поля або розмір порівняно з резервною копією останньої відомої справної конфігурації.
- `Config last-known-good promotion skipped` → кандидат містив замасковані заповнювачі секретів, такі як `***`.

Варіанти виправлення:

1. Залиште відновлену активну конфігурацію, якщо вона правильна.
2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
3. Запустіть `openclaw config validate` перед перезапуском.
4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.

Пов’язане:

- [Конфігурація: сувора перевірка](/uk/gateway/configuration#strict-validation)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Config](/uk/cli/config)
- [Doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно виводить блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Перевірте таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження резервного шляху через SSH, кількох Gateway, відсутніх scope або нерозв’язаних посилань auth.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback-цілі.
- `multiple reachable gateways detected` → відповіло більше однієї цілі. Зазвичай це означає навмисну конфігурацію з кількома Gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але RPC деталей обмежений scope; виконайте pairing ідентичності пристрою або використовуйте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібне pairing/схвалення перед звичайним доступом оператора.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → матеріал автентифікації був недоступний у цьому шляху команди для цілі, що не вдалася.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька Gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, але повідомлення не передаються

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Перевірте таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи та вимоги до згадування.
- Відсутні дозволи/scopes API каналу.

Поширені ознаки:

- `mention required` → повідомлення ігнорується через політику згадування в групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з автентифікацією/дозволами каналу.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [WhatsApp](/uk/channels/whatsapp)
- [Telegram](/uk/channels/telegram)
- [Discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не доставився, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Перевірте таке:

- Cron увімкнено і є наступне пробудження.
- Статус історії виконання завдань (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте файли/журнали/помилки середовища виконання.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне завдання не має виконуватися під час цього тіку.
- `heartbeat: unknown accountId` → недійсний ідентифікатор акаунта для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat визначилася як призначення стилю DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) встановлено в `block`.

Пов’язане:

- [Заплановані завдання: усунення несправностей](/uk/automation/cron-jobs#troubleshooting)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Heartbeat](/uk/gateway/heartbeat)

## Помилка paired tool Node

Якщо Node paired, але інструменти не працюють, ізолюйте стан foreground, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Перевірте таке:

- Node онлайн з очікуваними можливостями.
- Надані дозволи ОС для камери/мікрофона/геолокації/екрана.
- Стан схвалень exec і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язане:

- [Усунення несправностей Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)
- [Схвалення exec](/uk/tools/exec-approvals)

## Помилка browser tool

Використовуйте це, коли дії browser tool завершуються помилкою, хоча сам Gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Перевірте таке:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Чи правильний шлях до виконуваного файла браузера.
- Чи доступний профіль CDP.
- Чи доступний локальний Chrome для профілів `existing-session` / `user`.

Поширені ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
- `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, таку як `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP містить неправильний або неприпустимий порт.
- `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP ще не зміг приєднатися до вибраного каталогу даних браузера. Відкрийте сторінку inspect браузера, увімкніть remote debugging, залиште браузер відкритим, схваліть перший запит на приєднання, а потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому профілю `openclaw`.
- `No Chrome tabs found for profile="user"` → профіль приєднання Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недоступний із хоста Gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для приєднання не має доступної цілі, або HTTP endpoint відповів, але WebSocket CDP все одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточному встановленні Gateway відсутня залежність середовища виконання `playwright-core` для вбудованого browser Plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть Gateway. Знімки ARIA і базові знімки сторінок усе ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селекторами та експорт PDF залишаються недоступними.
- `fullPage is not supported for element screenshots` → запит на знімок екрана поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` повинні використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів Chrome MCP потребують посилань snapshot, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик у профілях Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `existing-session type does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session, або використовуйте керований/CDP-профіль браузера, якщо потрібен власний timeout.
- `existing-session evaluate does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session, або використовуйте керований/CDP-профіль браузера, якщо потрібен власний timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або сирого профілю CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керуючу сесію та звільнити стан емуляції Playwright/CDP без перезапуску всього Gateway.

Пов’язане:

- [Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting)
- [Браузер (керований OpenClaw)](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість проблем після оновлення — це дрейф конфігурації або суворіші типові налаштування, які тепер застосовуються.

### 1) Змінилася поведінка перевизначення auth і URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалену ціль, навіть якщо ваш локальний сервіс працює нормально.
- Явні виклики `--url` не повертаються до збережених облікових даних.

Поширені ознаки:

- `gateway connect failed:` → неправильна ціль URL.
- `unauthorized` → endpoint доступний, але auth неправильна.

### 2) Обмеження bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації Gateway: автентифікації спільним токеном/паролем або правильно налаштованого розгортання `trusted-proxy` не на loopback.
- Старі ключі, такі як `gateway.token`, не замінюють `gateway.auth.token`.

Поширені ознаки:

- `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації Gateway.
- `Connectivity probe: failed` while runtime is running → Gateway активний, але недоступний із поточними auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Очікувані схвалення пристроїв для dashboard/nodes.
- Очікувані схвалення pairing DM після змін політики або ідентичності.

Поширені ознаки:

- `device identity required` → вимоги автентифікації пристрою не виконано.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація сервісу й середовище виконання все ще не збігаються, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [Pairing під керуванням Gateway](/uk/gateway/pairing)
- [Автентифікація](/uk/gateway/authentication)
- [Фонове виконання і process tool](/uk/gateway/background-process)

## Пов’язане

- [Посібник для Gateway](/uk/gateway)
- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
