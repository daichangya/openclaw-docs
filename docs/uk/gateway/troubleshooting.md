---
read_when:
    - Хаб усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи runbook за симптомами з точними командами
summary: Поглиблений runbook з усунення несправностей для gateway, каналів, автоматизації, nodes і browser
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-05T18:06:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Gateway

Ця сторінка — поглиблений runbook.
Почніть із [/help/troubleshooting](/help/troubleshooting), якщо спершу хочете пройти швидкий потік тріажу.

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
- `openclaw channels status --probe` показує актуальний стан транспорту для кожного облікового запису і,
  де це підтримується, результати probe/audit на кшталт `works` або `audit ok`.

## Anthropic 429: extra usage required for long context

Використовуйте це, коли логи/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не придатні для long-context використання.
- Запити завершуються помилкою лише для довгих сесій/запусків моделей, яким потрібен шлях 1M beta.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного контекстного вікна.
2. Використовуйте API ключ Anthropic з білінгом або увімкніть Anthropic Extra Usage в обліковому записі Anthropic OAuth/передплати.
3. Налаштуйте fallback-моделі, щоб запуски продовжувалися, коли Anthropic відхиляє long-context запити.

Пов’язане:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Немає відповідей

Якщо канали працюють, але відповідей немає, перевірте маршрутизацію й політики, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Очікує схвалення pairing для відправників у DM.
- Керування згадуваннями в групі (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені сигнатури:

- `drop guild message (mention required` → повідомлення групи ігнорується, доки не буде згадування.
- `pairing request` → відправника потрібно схвалити.
- `blocked` / `allowlist` → відправника/канал відфільтровано політикою.

Пов’язане:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Підключення dashboard/control UI

Коли dashboard/control UI не підключається, перевірте URL, режим auth і припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильні URL probe і dashboard.
- Невідповідність режиму auth/token між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Поширені сигнатури:

- `device identity required` → небезпечний контекст або відсутня auth пристрою.
- `origin not allowed` → `Origin` браузера не входить до `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з origin браузера не через loopback без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  challenge-based потік auth пристрою (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або зі старою часовою позначкою) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scopes, збережений разом із paired
  токеном пристрою. Виклики з явними `deviceToken` / явними `scopes` зберігають свій
  запитаний набір scopes.
- Поза цим шляхом повторної спроби пріоритет auth під час connect такий:
  спочатку явний shared token/password, потім явний `deviceToken`, потім збережений токен пристрою,
  потім bootstrap token.
- В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як лімітатор зафіксує невдачу. Тому дві неправильні
  одночасні повторні спроби від того самого клієнта можуть призвести до `retry later`
  у другій спробі замість двох звичайних mismatch.
- `too many failed authentication attempts (retry later)` від клієнта loopback із browser-origin
  → повторні невдачі від того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
- повторювані `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена та повторно схваліть/оберніть токен пристрою за потреби.
- `gateway connect failed:` → неправильний хост/порт/url цілі.

### Швидка мапа кодів деталей auth

Використовуйте `error.details.code` із невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                 | Значення                                                 | Рекомендована дія                                                                                                                                                                                                                                                                          |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`        | Клієнт не надіслав потрібний shared token.               | Вставте/задайте токен у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштуваннях Control UI.                                                                                                                      |
| `AUTH_TOKEN_MISMATCH`       | Shared token не збігся з токеном auth gateway.           | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scopes; виклики з явними `deviceToken` / `scopes` зберігають запитаний набір scopes. Якщо помилка лишається, виконайте [контрольний список відновлення після дрейфу токена](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для пристрою застарів або відкликаний.  | Оберніть/повторно схваліть токен пристрою через [devices CLI](/cli/devices), потім перепідключіться.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`          | Ідентичність пристрою відома, але не схвалена для цієї ролі. | Схваліть pending-запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`.                                                                                                                                                                                           |

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо логи показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` із тим самим challenge nonce

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхиляється:

- сесії з paired-device token можуть керувати лише **власним** пристроєм, якщо
  виклик не має також `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті scopes оператора,
  які сесія виклику вже має

Пов’язане:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration) (режими auth gateway)
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Сервіс Gateway не працює

Використовуйте це, коли сервіс установлено, але процес не тримається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також сканує системні сервіси
```

Зверніть увагу на таке:

- `Runtime: stopped` із підказками щодо завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` vs `Config (service)`).
- Конфлікти портів/слухачів.
- Додаткові інсталяції launchd/systemd/schtasks при використанні `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Поширені сигнатури:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → режим local gateway не ввімкнено, або файл конфігурації було перезаписано й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у своїй конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб знову записати очікувану конфігурацію local-mode. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind не через loopback без валідного шляху auth gateway (token/password або trusted-proxy, якщо налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні units launchd/systemd/schtasks. У більшості конфігурацій має бути один gateway на машину; якщо вам усе ж потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

Пов’язане:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Попередження gateway probe

Використовуйте це, коли `openclaw gateway probe` до чогось достукується, але все одно виводить блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження fallback через SSH, кількох gateway, відсутніх scopes або нерозв’язаних auth refs.

Поширені сигнатури:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не спрацювало, але команда все одно спробувала direct-цілі з конфігурації/loopback.
- `multiple reachable gateways detected` → відповіло більше ніж одна ціль. Зазвичай це означає навмисну конфігурацію з кількома gateway або застарілі/дубльовані слухачі.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → connect спрацював, але detail RPC обмежено через scopes; зв’яжіть ідентичність пристрою або використайте облікові дані з `operator.read`.
- текст попередження про нерозв’язаний SecretRef `gateway.auth.*` / `gateway.remote.*` → матеріал auth був недоступний у цьому шляху команди для невдалої цілі.

Пов’язане:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

## Канал підключений, але повідомлення не проходять

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиках, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Зверніть увагу на таке:

- Політику DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи й вимоги до згадувань.
- Відсутні дозволи/scopes API каналу.

Поширені сигнатури:

- `mention required` → повідомлення ігнорується через політику згадувань у групі.
- `pairing` / сліди pending approval → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з auth/дозволами каналу.

Пов’язане:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Доставка cron і heartbeat

Якщо cron або heartbeat не запустилися чи не доставили результат, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнений і присутнє наступне пробудження.
- Статус історії запусків завдань (`ok`, `skipped`, `error`).
- Причини пропуску heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені сигнатури:

- `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/логів/runtime.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але в цьому тіку жодне завдання ще не належить до виконання.
- `heartbeat: unknown accountId` → недійсний account id для цілі доставки heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль heartbeat розв’язалася в destination типу DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) має значення `block`.

Пов’язане:

- [/automation/cron-jobs#troubleshooting](/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Збій paired tool вузла

Якщо node paired, але tools не працюють, ізолюйте стан foreground, дозволів і погоджень.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Node online з очікуваними можливостями.
- Дозволи ОС для камери/мікрофона/локації/екрана.
- Стан exec approvals і allowlist.

Поширені сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується погодження exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано через allowlist.

Пов’язане:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Збій browser tool

Використовуйте це, коли дії browser tool завершуються помилкою, хоча сам gateway працює справно.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи задано `plugins.allow` і чи включає воно `browser`.
- Валідний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

Поширені сигнатури:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому plugin ніколи не завантажувався.
- `Failed to start Chrome CDP on port` → процес браузера не зміг запуститися.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → у налаштованому URL CDP вказано неправильний або недопустимий порт.
- `No Chrome tabs found for profile="user"` → профіль підключення Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний із хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → для профілю attach-only немає досяжної цілі, або HTTP endpoint відповів, але CDP WebSocket все одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточній інсталяції gateway відсутній повний пакет Playwright; ARIA snapshots і базові screenshots сторінки все ще можуть працювати, але навігація, AI snapshots, screenshots елементів за CSS-селекторами й експорт PDF залишаються недоступними.
- `fullPage is not supported for element screenshots` → запит screenshot поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики screenshot для Chrome MCP / `existing-session` мають використовувати захоплення сторінки або snapshot `--ref`, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks завантаження файлів у Chrome MCP потребують snapshot refs, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → для профілів Chrome MCP надсилайте по одному завантаженню за раз.
- `existing-session dialog handling does not support timeoutMs.` → hooks діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` все ще потребує керованого браузера або профілю raw CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керовану сесію й звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язане:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Якщо після оновлення щось раптово зламалося

Більшість проблем після оновлення — це дрейф конфігурації або суворіші значення за замовчуванням, які тепер примусово застосовуються.

### 1) Поведінка auth і перевизначення URL змінилася

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на remote, навіть якщо локальний сервіс працює справно.
- Явні виклики `--url` не виконують fallback до збережених облікових даних.

Поширені сигнатури:

- `gateway connect failed:` → неправильна URL-ціль.
- `unauthorized` → endpoint досяжний, але auth неправильна.

### 2) Guardrails для bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Bind не через loopback (`lan`, `tailnet`, `custom`) потребують валідного шляху auth gateway: shared token/password auth або правильно налаштованого розгортання `trusted-proxy` не через loopback.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Поширені сигнатури:

- `refusing to bind gateway ... without auth` → bind не через loopback без валідного шляху auth gateway.
- `RPC probe: failed` коли runtime працює → gateway живий, але недоступний із поточними auth/url.

### 3) Стан pairing та ідентичності пристрою змінився

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Pending approvals пристроїв для dashboard/nodes.
- Pending approvals pairing для DM після змін політики чи ідентичності.

Поширені сигнатури:

- `device identity required` → auth пристрою не задоволено.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація сервісу й runtime все ще не збігаються, перевстановіть метадані сервісу з тим самим каталогом профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
