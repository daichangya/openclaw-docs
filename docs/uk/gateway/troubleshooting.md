---
read_when:
    - Центр усунення несправностей скерував вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника за симптомами з точними командами
summary: Детальний посібник з усунення несправностей для gateway, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-07T14:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02c9537845248db0c9d315bf581338a93215fe6fe3688ed96c7105cbb19fe6ba
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей gateway

Ця сторінка — детальний посібник.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете пройти швидкий потік тріажу.

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

- `openclaw gateway status` показує `Runtime: running` і `RPC probe: ok`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/сервісу.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису та,
  де це підтримується, результати probe/audit, наприклад `works` або `audit ok`.

## Для Anthropic 429 для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити збоять лише в довгих сесіях/запусках моделі, яким потрібен шлях 1M beta.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на Anthropic API key.
3. Налаштуйте резервні моделі, щоб запуски продовжувалися, коли Anthropic відхиляє запити з довгим контекстом.

Пов’язане:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-compatible backend проходить прямі probe, але збоять agent runs

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw збоять лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Зверніть увагу на таке:

- прямі малі виклики успішні, але запуски OpenClaw збоять лише на більших prompt
- backend повертає помилки про те, що `messages[].content` очікує рядок
- backend падає лише при більшій кількості токенів prompt або на повних prompt середовища агента

Типові ознаки:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  відхиляє структуровані частини вмісту Chat Completions. Виправлення: задайте
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі малі запити успішні, але ходи агента OpenClaw збоять із падіннями backend/моделі
  (наприклад Gemma у деяких збірках `inferrs`) → транспорт OpenClaw,
  імовірно, уже налаштований правильно; backend збоїть на більшій формі prompt
  середовища агента.
- збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів
  були частиною навантаження, але решта проблеми все ще в обмеженнях моделі/сервера
  вищого рівня або в помилці backend.

Варіанти виправлення:

1. Задайте `compat.requiresStringContent: true` для backend Chat Completions, які приймають лише рядки.
2. Задайте `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти
   поверхню схем інструментів OpenClaw.
3. За можливості зменште навантаження prompt: менший bootstrap workspace, коротша
   історія сесії, легша локальна модель або backend із кращою підтримкою довгого контексту.
4. Якщо малі прямі запити й надалі проходять, а ходи OpenClaw усе ще падають
   всередині backend, розглядайте це як обмеження upstream server/model і створіть
   там repro з прийнятою формою payload.

Пов’язане:

- [/gateway/local-models](/uk/gateway/local-models)
- [/gateway/configuration#models](/uk/gateway/configuration#models)
- [/gateway/configuration-reference#openai-compatible-endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але ніхто не відповідає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Очікує pairing для відправників у DM.
- Фільтрація згадок у групах (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Типові ознаки:

- `drop guild message (mention required` → повідомлення в групі ігнорується, доки не буде згадки.
- `pairing request` → відправника потрібно схвалити.
- `blocked` / `allowlist` → відправника/канал відфільтровано політикою.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення dashboard control UI

Коли dashboard/control UI не підключається, перевірте URL, режим auth і припущення щодо secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильний URL probe і URL dashboard.
- Невідповідність режиму auth/token між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Типові ознаки:

- `device identity required` → небезпечний контекст або відсутня auth пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з не-loopback origin браузера без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  flow challenge-based device auth (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або використав застарілу часову мітку) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує набір scope, збережений разом
  зі спареним токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` зберігають свій
  запитаний набір scope.
- Поза цим шляхом повторної спроби пріоритет auth під час підключення такий:
  спочатку явний shared token/password, потім явний `deviceToken`, потім збережений токен пристрою,
  а потім bootstrap token.
- На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як обмежувач зафіксує невдачу. Тому дві некоректні
  одночасні повторні спроби від одного клієнта можуть показати `retry later`
  на другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта браузерного origin
  → повторні невдачі від того самого нормалізованого `Origin` тимчасово
  блокуються; інший localhost origin використовує окремий bucket.
- повторювані `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена й за потреби повторно схваліть/переверніть токен пристрою.
- `gateway connect failed:` → неправильний host/port/url призначення.

### Швидка карта кодів деталей auth

Використовуйте `error.details.code` із невдалого відповіді `connect`, щоб вибрати наступну дію:

| Detail code                  | Значення                                                  | Рекомендована дія                                                                                                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий shared token.             | Вставте/задайте токен у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, а потім вставте його в налаштуваннях Control UI.                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | Shared token не збігся з токеном auth gateway.           | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явним `deviceToken` / `scopes` зберігають запитані scope. Якщо все одно не працює, виконайте [контрольний список відновлення після дрейфу токена](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для пристрою застарів або відкликаний.    | Переверніть/повторно схваліть токен пристрою за допомогою [CLI devices](/cli/devices), а потім підключіться знову.                                                                                                                                                                   |
| `PAIRING_REQUIRED`           | Ідентичність пристрою відома, але не схвалена для цієї ролі. | Схваліть запит, що очікує: `openclaw devices list`, потім `openclaw devices approve <requestId>`.                                                                                                                                                                                    |

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і переконайтеся, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим nonce challenge

Якщо `openclaw devices rotate` / `revoke` / `remove` несподівано заборонено:

- сесії paired-device token можуть керувати лише **власним**
  пристроєм, якщо тільки виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scope,
  які сесія виклику вже має

Пов’язане:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими auth gateway)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/cli/devices)

## Сервіс gateway не працює

Використовуйте це, якщо сервіс встановлено, але процес не утримується в робочому стані.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також сканує системні сервіси
```

Зверніть увагу на таке:

- `Runtime: stopped` з підказками про завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` проти `Config (service)`).
- Конфлікти портів/слухачів.
- Додаткові встановлення launchd/systemd/schtasks при використанні `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Типові ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було пошкоджено й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у своїй конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб відновити очікувану конфігурацію local-mode. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху auth gateway (token/password або trusted-proxy, якщо налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні launchd/systemd/schtasks units. У більшості конфігурацій слід тримати один gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язане:

- [/gateway/background-process](/uk/gateway/background-process)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження probe gateway

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно виводить блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи пов’язане попередження з резервним SSH, кількома gateway, відсутніми scope або нерозв’язаними auth refs.

Типові ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback-призначення.
- `multiple reachable gateways detected` → відповіло більше однієї цілі. Зазвичай це означає навмисне багатошлюзове налаштування або застарілі/дубльовані слухачі.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але RPC деталей обмежений scope; спарте ідентичність пристрою або використайте облікові дані з `operator.read`.
- нерозв’язане попередження SecretRef для `gateway.auth.*` / `gateway.remote.*` → auth-матеріал був недоступний у цьому шляху команди для цілі, що не пройшла перевірку.

Пов’язане:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host)
- [/gateway/remote](/uk/gateway/remote)

## Канал підключений, але повідомлення не проходять

Якщо стан каналу показує, що він підключений, але потік повідомлень мертвий, зосередьтеся на політиці, дозволах і специфічних для каналу правилах доставки.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Зверніть увагу на таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи та вимоги до згадок.
- Відсутні дозволи/scopes API каналу.

Типові ознаки:

- `mention required` → повідомлення ігнорується через політику згадок у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з auth/дозволами каналу.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка cron і heartbeat

Якщо cron або heartbeat не запустилися чи не були доставлені, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнено і є наступне пробудження.
- Стан історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Типові ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/журналів/середовища виконання.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але на цьому тіку жодне із завдань не має бути виконане.
- `heartbeat: unknown accountId` → недійсний id облікового запису для цілі доставки heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль heartbeat визначилася як призначення стилю DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) має значення `block`.

Пов’язане:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Не працює paired tool вузла

Якщо вузол спарено, але інструменти не працюють, окремо перевірте foreground, дозволи та стан схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Вузол онлайн з очікуваними можливостями.
- Надані дозволи ОС для camera/mic/location/screen.
- Стан exec approvals і allowlist.

Типові ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок вузла має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язане:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Не працює browser tool

Використовуйте це, коли дії browser tool збоять, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи задано `plugins.allow` і чи містить він `browser`.
- Коректний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

Типові ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → bundled plugin браузера виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому plugin ніколи не завантажився.
- `Failed to start Chrome CDP on port` → процес браузера не зміг запуститися.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або позадіапазонний порт.
- `No Chrome tabs found for profile="user"` → профіль підключення Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний з хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише з підключенням не має досяжної цілі, або HTTP endpoint відповів, але WebSocket CDP все одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточна інсталяція gateway не містить повного пакета Playwright; ARIA snapshots і базові знімки сторінки все ще можуть працювати, але навігація, AI snapshots, знімки елементів за CSS-селекторами та експорт PDF залишаються недоступними.
- `fullPage is not supported for element screenshots` → запит знімка екрана поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів Chrome MCP потребують snapshot refs, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик у профілях Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або профілю raw CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну сесію керування та звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язане:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість проблем після оновлення — це дрейф конфігурації або суворіші типові налаштування, які тепер примусово застосовуються.

### 1) Змінилася поведінка auth і перевизначення URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на remote, тоді як локальний сервіс працює нормально.
- Явні виклики `--url` не використовують збережені облікові дані як резервний варіант.

Типові ознаки:

- `gateway connect failed:` → неправильна ціль URL.
- `unauthorized` → endpoint досяжний, але auth неправильна.

### 2) Обмеження bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Для bind не до loopback (`lan`, `tailnet`, `custom`) потрібен дійсний шлях auth gateway: auth через shared token/password або коректно налаштоване розгортання non-loopback `trusted-proxy`.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Типові ознаки:

- `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху auth gateway.
- `RPC probe: failed` while runtime is running → gateway живий, але недоступний з поточною auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Очікують схвалення пристрої для dashboard/nodes.
- Очікують схвалення DM pairing після змін політики або ідентичності.

Типові ознаки:

- `device identity required` → вимоги device auth не виконано.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація сервісу й runtime усе ще не збігаються, перевстановіть метадані сервісу з того самого каталогу profile/state:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [/gateway/pairing](/uk/gateway/pairing)
- [/gateway/authentication](/uk/gateway/authentication)
- [/gateway/background-process](/uk/gateway/background-process)
