---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника на основі симптомів із точними командами
summary: Детальний посібник з усунення несправностей для Gateway, каналів, автоматизації, Node і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-22T20:50:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6df9cfcce30542401fc3d815781e226d45bb5462580722fa5353e404eef28ee6
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Gateway

Ця сторінка — детальний посібник.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете швидкий сценарій діагностики.

## Послідовність команд

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
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/сервісу.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису та,
  де це підтримується, результати probe/audit, такі як `works` або `audit ok`.

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- Для вибраної моделі Anthropic Opus/Sonnet встановлено `params.context1m: true`.
- Поточні облікові дані Anthropic не дають права на використання довгого контексту.
- Запити не вдаються лише для довгих сесій/запусків моделі, яким потрібен beta-шлях 1M.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на Anthropic API key.
3. Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.

Пов’язане:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-compatible backend проходить прямі probe, але запуски агента не вдаються

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw не вдаються лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Зверніть увагу на таке:

- прямі малі виклики успішні, але запуски OpenClaw не вдаються лише на більших prompt
- backend повертає помилки про те, що `messages[].content` очікує рядок
- backend аварійно завершується лише за більшої кількості токенів у prompt або з повними prompt середовища виконання агента

Поширені ознаки:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  відхиляє структуровані частини вмісту Chat Completions. Виправлення: установіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі малі запити успішні, але запуски агентів OpenClaw не вдаються через аварії backend/моделі
  (наприклад, Gemma у деяких збірках `inferrs`) → транспорт OpenClaw,
  імовірно, уже налаштований правильно; проблема в тому, що backend не справляється з більшою формою prompt середовища агента.
- збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів
  були частиною навантаження, але решта проблеми все ще пов’язана з upstream-обмеженнями моделі/сервера або помилкою backend.

Варіанти виправлення:

1. Установіть `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядковий вміст.
2. Установіть `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти
   поверхню схем інструментів OpenClaw.
3. Де можливо, зменште навантаження від prompt: менший bootstrap робочого простору, коротша
   історія сесії, легша локальна модель або backend із кращою підтримкою довгого контексту.
4. Якщо прямі малі запити й далі успішні, а ходи агента OpenClaw все одно аварійно завершуються
   всередині backend, вважайте це обмеженням upstream-сервера/моделі й подайте туди
   відтворюваний приклад із прийнятною формою payload.

Пов’язане:

- [/gateway/local-models](/uk/gateway/local-models)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але відповідей немає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Для відправників у DM pairing очікує підтвердження.
- Обмеження згадування для груп (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення групи ігнорується, доки немає згадування.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення UI dashboard/control

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильний probe URL і URL dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Поширені ознаки:

- `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
- `origin not allowed` → `Origin` браузера не входить до `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з browser origin не на loopback без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  автентифікацію пристрою на основі challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або використав застарілу часову позначку) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений із прив’язаним
  токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` зберігають
  запитаний ними набір scope.
- Поза цим шляхом повторної спроби пріоритет автентифікації connect такий: явний спільний
  token/password спочатку, потім явний `deviceToken`, потім збережений токен пристрою,
  потім bootstrap token.
- У шляху async Tailscale Serve Control UI невдалі спроби для одного й того самого
  `{scope, ip}` серіалізуються до того, як limiter зафіксує збій. Тому дві хибні
  одночасні повторні спроби від того самого клієнта можуть показати `retry later`
  у другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з browser origin
  → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
- повторюване `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена та повторно схваліть/перевипустіть токен пристрою за потреби.
- `gateway connect failed:` → неправильна ціль host/port/url.

### Коротка карта кодів деталей автентифікації

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                                                                                                                                                     | Рекомендована дія                                                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний token.                                                                                                                                              | Вставте/установіть token у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштуваннях Control UI.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Спільний token не збігся з токеном автентифікації gateway.                                                                                                                                   | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явними `deviceToken` / `scopes` зберігають запитані scope. Якщо збій повторюється, виконайте [контрольний список відновлення розсинхронізації токенів](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для конкретного пристрою застарів або відкликаний.                                                                                                                           | Перевипустіть/повторно схваліть токен пристрою за допомогою [CLI пристроїв](/cli/devices), а потім підключіться знову.                                                                                                                                                                   |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason`: `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, якщо вони є. | Схваліть очікуваний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Підвищення scope/ролей використовує той самий процес після перевірки запитаного доступу.                                                                                               |

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, який підключається, і переконайтеся, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим nonce challenge

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано заборонено:

- сесії з токеном прив’язаного пристрою можуть керувати лише **власним** пристроєм, якщо
  виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scope,
  які сесія виклику вже має

Пов’язане:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими автентифікації gateway)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/cli/devices)

## Сервіс Gateway не запущений

Використовуйте це, коли сервіс установлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Зверніть увагу на таке:

- `Runtime: stopped` із підказками щодо завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Поширені ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було пошкоджено і він втратив `gateway.mode`. Виправлення: установіть `gateway.mode="local"` у своїй конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації: `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації gateway (token/password або trusted-proxy, якщо налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні launchd/systemd/schtasks unit. У більшості конфігурацій на одну машину має бути один gateway; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язане:

- [/gateway/background-process](/uk/gateway/background-process)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/doctor](/uk/gateway/doctor)

## Gateway відновив останню відому справну конфігурацію

Використовуйте це, коли Gateway запускається, але в журналах сказано, що він відновив `openclaw.json`.

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
- Файл `openclaw.json.clobbered.*` з часовою позначкою поруч з активною конфігурацією
- Системну подію головного агента, що починається з `Config recovery warning`

Що сталося:

- Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
- OpenClaw зберіг відхилений payload як `.clobbered.*`.
- Активну конфігурацію було відновлено з останньої валідованої останньої відомої справної копії.
- Наступний хід головного агента отримує попередження не переписувати сліпо відхилену конфігурацію.

Перевірка й виправлення:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Поширені ознаки:

- Існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або зчитування під час запуску.
- Існує `.rejected.*` → запис конфігурації, виконаний OpenClaw, не пройшов перевірки схеми або цілісності перед commit.
- `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
- `Config last-known-good promotion skipped` → кандидат містив замасковані placeholder секретів, наприклад `***`.

Варіанти виправлення:

1. Залиште відновлену активну конфігурацію, якщо вона правильна.
2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
3. Перед перезапуском виконайте `openclaw config validate`.
4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.

Пов’язане:

- [/gateway/configuration#strict-validation](/uk/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/uk/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось доходить, але все одно виводить блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи стосується попередження SSH fallback, кількох gateway, відсутніх scope або нерозв’язаних auth ref.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback-цілі.
- `multiple reachable gateways detected` → відповіло більше однієї цілі. Зазвичай це означає навмисну конфігурацію з кількома gateway або застарілі/дубльовані listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але деталізований RPC обмежено scope; прив’яжіть ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібне pairing/схвалення перед звичайним доступом оператора.
- нерозв’язане попередження SecretRef для `gateway.auth.*` / `gateway.remote.*` → auth-матеріал був недоступний у цьому шляху команди для цілі, що завершилась невдачею.

Пов’язане:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host)
- [/gateway/remote](/uk/gateway/remote)

## Канал підключений, але повідомлення не проходять

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Зверніть увагу на таке:

- Політику DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи та вимоги до згадувань.
- Відсутні дозволи/scopes API каналу.

Поширені ознаки:

- `mention required` → повідомлення ігнорується політикою згадування в групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з автентифікацією/дозволами каналу.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустилися чи не доставили результат, спочатку перевірте стан scheduler, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнено, і присутнє наступне пробудження.
- Статус історії виконання завдань (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій тіку scheduler; перевірте помилки файлів/журналів/середовища виконання.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися під час цього тіку.
- `heartbeat: unknown accountId` → недійсний account id для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat була визначена як пункт призначення стилю DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) встановлено в `block`.

Пов’язане:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Збій інструмента прив’язаного Node

Якщо Node прив’язано, але інструменти не працюють, ізолюйте стан foreground, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Node онлайн з очікуваними можливостями.
- Надані дозволи ОС для камери/мікрофона/геолокації/екрана.
- Стан схвалення exec і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язане:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Збій browser tool

Використовуйте це, коли дії browser tool не вдаються, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Валідний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Наявність локального Chrome для профілів `existing-session` / `user`.

Поширені ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
- `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований CDP URL використовує непідтримувану схему, таку як `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований CDP URL має помилковий або неприпустимий порт.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку inspect браузера, увімкніть remote debugging, тримайте браузер відкритим, схваліть перший запит на підключення, а потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому профілю `openclaw`.
- `No Chrome tabs found for profile="user"` → профіль підключення Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний із хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише з attach не має досяжної цілі, або HTTP endpoint відповів, але CDP WebSocket все одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточній інсталяції gateway бракує вбудованої залежності середовища виконання `playwright-core` для browser Plugin; виконайте `openclaw doctor --fix`, потім перезапустіть gateway. Знімки ARIA та базові знімки сторінок усе ще можуть працювати, але навігація, AI snapshots, знімки елементів за CSS-селекторами та експорт PDF залишаться недоступними.
- `fullPage is not supported for element screenshots` → запит на знімок екрана поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` повинні використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів у Chrome MCP потребують snapshot ref, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → для профілів Chrome MCP надсилайте по одному файлу за виклик.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або сирого профілю CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керовану сесію й звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язане:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість збоїв після оновлення — це дрейф конфігурації або жорсткіші типові значення, які тепер примусово застосовуються.

### 1) Змінилася поведінка автентифікації та перевизначення URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалений Gateway, тоді як ваш локальний сервіс справний.
- Явні виклики `--url` не повертаються до збережених облікових даних.

Поширені ознаки:

- `gateway connect failed:` → неправильна ціль URL.
- `unauthorized` → endpoint досяжний, але автентифікація неправильна.

### 2) Обмеження прив’язки та автентифікації стали жорсткішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації Gateway: спільна автентифікація token/password або правильно налаштоване розгортання `trusted-proxy` не на loopback.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Поширені ознаки:

- `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації gateway.
- `Connectivity probe: failed`, тоді як runtime запущено → gateway живий, але недоступний із поточною auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Очікувані схвалення пристроїв для dashboard/nodes.
- Очікувані схвалення pairing у DM після змін політики або ідентичності.

Поширені ознаки:

- `device identity required` → автентифікацію пристрою не виконано.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація сервісу та runtime все ще не збігаються, перевстановіть метадані сервісу з того самого каталогу profile/state:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [/gateway/pairing](/uk/gateway/pairing)
- [/gateway/authentication](/uk/gateway/authentication)
- [/gateway/background-process](/uk/gateway/background-process)
