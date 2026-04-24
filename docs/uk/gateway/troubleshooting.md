---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника з усунення несправностей, побудовані за симптомами, з точними командами
summary: Поглиблений посібник з усунення несправностей для Gateway, каналів, автоматизації, Node і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-24T07:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20066bdab03f05304b3a620fbadc38e4dc74b740da151c58673dcf5196e5f1e1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Gateway

Ця сторінка — поглиблений посібник з усунення несправностей.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете пройти швидкий потік тріажу.

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
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/сервісу.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису і,
  де це підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Додаткове використання Anthropic 429 потрібне для довгого контексту

Використовуйте це, коли журнали/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити падають лише під час довгих сесій/запусків моделі, яким потрібен бета-шлях 1M.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на Anthropic API key.
3. Налаштуйте резервні моделі, щоб запуски тривали, коли Anthropic відхиляє запити з довгим контекстом.

Пов’язане:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний backend проходить прямі probe, але запуски агентів падають

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw падають лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте:

- прямі малі виклики успішні, але запуски OpenClaw падають лише на більших запитах
- помилки backend про те, що `messages[].content` очікує рядок
- збої backend, які з’являються лише з більшою кількістю токенів у запиті або з повними
  запитами середовища виконання агента

Поширені ознаки:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі малі запити успішні, але запуски агентів OpenClaw падають через збої backend/моделі
  (наприклад, Gemma у деяких збірках `inferrs`) → транспорт OpenClaw,
  імовірно, уже налаштований правильно; backend падає через форму більшого
  запиту середовища виконання агента.
- після вимкнення інструментів збоїв меншає, але вони не зникають → схеми інструментів
  були частиною навантаження, але решта проблеми все ще лежить у вищестоячій
  місткості моделі/сервера або в помилці backend.

Варіанти виправлення:

1. Встановіть `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядки.
2. Встановіть `compat.supportsTools: false` для моделей/backend, які не можуть
   надійно обробляти поверхню схем інструментів OpenClaw.
3. За можливості зменште навантаження запиту: менший bootstrap робочого простору, коротша
   історія сесії, легша локальна модель або backend із кращою підтримкою довгого контексту.
4. Якщо малі прямі запити й далі проходять, а ходи агентів OpenClaw все ще падають
   усередині backend, розглядайте це як обмеження вищестоячого сервера/моделі й
   подайте туди відтворюваний приклад із прийнятою формою payload.

Пов’язане:

- [/gateway/local-models](/uk/gateway/local-models)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали підняті, але ніхто не відповідає, перевірте маршрутизацію та політики, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте:

- Pairing у стані очікування для відправників у DM.
- Вимогу згадки в групі (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення групи ігнорується, доки немає згадки.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення dashboard/control UI

Коли dashboard/control UI не може підключитися, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте:

- Правильний URL probe і URL dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Поширені ознаки:

- `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з не-loopback browser origin без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або використав застарілу часову мітку) для поточного рукостискання.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом
  із paired device token. Виклики з явними `deviceToken` / явними `scopes` зберігають свій
  запитаний набір scope.
- Поза цим шляхом повторної спроби пріоритет автентифікації під час підключення такий: спочатку явний shared
  token/password, потім явний `deviceToken`, потім збережений токен пристрою,
  потім bootstrap token.
- На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як обмежувач зафіксує невдачу. Тому дві некоректні
  одночасні повторні спроби від того самого клієнта можуть дати `retry later`
  на другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з browser-origin
  → повторні невдалі спроби з того самого нормалізованого `Origin` тимчасово
  блокуються; інший localhost origin використовує окремий bucket.
- повторюваний `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена та за потреби знову схваліть/перевипустіть токен пристрою.
- `gateway connect failed:` → неправильний хост/порт/url призначення.

### Швидка мапа кодів деталей автентифікації

Використовуйте `error.details.code` із невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                                                                                                                                                     | Рекомендована дія                                                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий shared token.                                                                                                                                                | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, а потім вставте його в налаштуваннях Control UI.                                                                                                                  |
| `AUTH_TOKEN_MISMATCH`        | Shared token не збігся з токеном автентифікації Gateway.                                                                                                                                     | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явними `deviceToken` / `scopes` зберігають запитаний scope. Якщо все одно не працює, виконайте [контрольний список відновлення після розсинхронізації токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для конкретного пристрою застарів або був відкликаний.                                                                                                                       | Перевипустіть/повторно схваліть токен пристрою за допомогою [CLI пристроїв](/uk/cli/devices), а потім перепідключіться.                                                                                                                                                                    |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` для `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, якщо вони є. | Схваліть запит, що очікує: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/ролей використовують той самий потік після того, як ви перевірите запитаний доступ.                                                                                   |

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим nonce challenge

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано заборонено:

- сесії paired-device token можуть керувати лише **власним** пристроєм, якщо
  викликальник також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scope,
  які сесія викликальника вже має

Пов’язане:

- [/web/control-ui](/uk/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими автентифікації gateway)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/uk/cli/devices)

## Сервіс Gateway не запущено

Використовуйте це, коли сервіс установлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Шукайте:

- `Runtime: stopped` із підказками щодо завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` vs `Config (service)`).
- Конфлікти портів/слухачів.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Поширені ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим Gateway не ввімкнено, або файл конфігурації було пошкоджено і він утратив `gateway.mode`. Виправлення: установіть `gateway.mode="local"` у своїй конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб повторно проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка не-loopback адреси без дійсного шляху автентифікації gateway (token/password або trusted-proxy, якщо налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні launchd/systemd/schtasks units. У більшості конфігурацій слід мати один Gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

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

Шукайте:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Файл `openclaw.json.clobbered.*` із часовою міткою поруч з активною конфігурацією
- Системну подію головного агента, що починається з `Config recovery warning`

Що сталося:

- Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
- OpenClaw зберіг відхилений payload як `.clobbered.*`.
- Активну конфігурацію було відновлено з останньої перевіреної справної копії.
- На наступному ході головного агента з’явиться попередження не переписувати відхилену конфігурацію навмання.

Перевірка та виправлення:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Поширені ознаки:

- існує `.clobbered.*` → зовнішнє пряме редагування або читання під час запуску було відновлено.
- існує `.rejected.*` → запис конфігурації, що належав OpenClaw, не пройшов перевірку схеми або clobber-перевірки перед фіксацією.
- `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти недійсну конфігурацію.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було визнано пошкодженим, оскільки він утратив поля або розмір порівняно з останньою відомою справною резервною копією.
- `Config last-known-good promotion skipped` → кандидат містив замасковані плейсхолдери секретів, як-от `***`.

Варіанти виправлення:

1. Залиште відновлену активну конфігурацію, якщо вона правильна.
2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
3. Запустіть `openclaw config validate` перед перезапуском.
4. Якщо редагуєте вручну, зберігайте повний JSON5 config, а не лише частковий об’єкт, який хотіли змінити.

Пов’язане:

- [/gateway/configuration#strict-validation](/uk/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/uk/gateway/configuration#config-hot-reload)
- [/cli/config](/uk/cli/config)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось достукується, але все одно виводить блок попереджень.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження резервного переходу на SSH, кількох Gateway, відсутніх scope або нерозв’язаних auth refs.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіла більше ніж одна ціль. Зазвичай це означає навмисну конфігурацію з кількома Gateway або застарілі/дубльовані listeners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але detail RPC обмежений scope; виконайте pair device identity або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібне pairing/схвалення перед звичайним operator access.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → auth material був недоступний у цьому шляху команди для цілі, що не вдалася.

Пов’язане:

- [/cli/gateway](/uk/cli/gateway)
- [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host)
- [/gateway/remote](/uk/gateway/remote)

## Канал підключений, але повідомлення не проходять

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і специфічних для каналу правилах доставки.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте:

- Політику DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи та вимоги щодо згадки.
- Відсутні дозволи/scopes API каналу.

Поширені ознаки:

- `mention required` → повідомлення проігноровано політикою згадок у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема автентифікації/дозволів каналу.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не доставився, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте:

- Чи ввімкнено Cron і чи є наступне пробудження.
- Стан історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/журналів/runtime.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має бути виконане на цьому тіку.
- `heartbeat: unknown accountId` → недійсний id облікового запису для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat була визначена як пункт призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) встановлено в `block`.

Пов’язане:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Збій інструмента спареного Node

Якщо Node спарено, але інструменти не працюють, ізолюйте стан foreground, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Шукайте:

- Node онлайн з очікуваними capability.
- Надані на рівні ОС дозволи для camera/mic/location/screen.
- Стан схвалень exec і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути у foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано через allowlist.

Пов’язане:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Збій інструмента браузера

Використовуйте це, коли дії browser tool не працюють, хоча сам Gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Чинний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

Поширені ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажувався.
- `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або позадіапазонний порт.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг приєднатися до вибраного каталогу даних браузера. Відкрийте сторінку inspect браузера, увімкніть remote debugging, залиште браузер відкритим, схваліть перший запит на приєднання, а потім повторіть спробу. Якщо стан входу в обліковий запис не потрібен, віддайте перевагу керованому профілю `openclaw`.
- `No Chrome tabs found for profile="user"` → профіль приєднання Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недоступний з хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для приєднання не має досяжної цілі, або HTTP endpoint відповів, але CDP WebSocket усе одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточному встановленні gateway бракує залежності середовища виконання `playwright-core` для вбудованого browser Plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть gateway. Знімки ARIA та базові знімки сторінок усе ще можуть працювати, але навігація, AI snapshots, знімки елементів за CSS-селекторами та експорт PDF залишаться недоступними.
- `fullPage is not supported for element screenshots` → запит на знімок екрана поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів Chrome MCP потребують snapshot refs, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → для профілів Chrome MCP надсилайте одне завантаження за виклик.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `existing-session type does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session, або використайте керований/CDP профіль браузера, коли потрібен власний timeout.
- `existing-session evaluate does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session, або використайте керований/CDP профіль браузера, коли потрібен власний timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або сирого профілю CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керувальну сесію та звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язане:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість збоїв після оновлення — це розсинхронізація конфігурації або суворіші типові значення, які тепер примусово застосовуються.

### 1) Змінилася поведінка перевизначення auth і URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалену ціль, тоді як локальний сервіс працює нормально.
- Явні виклики `--url` не використовують збережені облікові дані як резервний варіант.

Поширені ознаки:

- `gateway connect failed:` → неправильний URL цілі.
- `unauthorized` → endpoint досяжний, але auth неправильний.

### 2) Захисні обмеження для bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Прив’язки не-loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації gateway: auth за shared token/password або правильно налаштоване розгортання `trusted-proxy` не-loopback.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Поширені ознаки:

- `refusing to bind gateway ... without auth` → прив’язка не-loopback без дійсного шляху автентифікації gateway.
- `Connectivity probe: failed` коли runtime запущено → gateway працює, але недоступний із поточними auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Очікують схвалення пристрої для dashboard/nodes.
- Очікують схвалення pairings у DM після змін політики або ідентичності.

Поширені ознаки:

- `device identity required` → вимоги device auth не виконано.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація сервісу та runtime все ще не збігаються, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [/gateway/pairing](/uk/gateway/pairing)
- [/gateway/authentication](/uk/gateway/authentication)
- [/gateway/background-process](/uk/gateway/background-process)

## Пов’язане

- [Посібник для Gateway](/uk/gateway)
- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
