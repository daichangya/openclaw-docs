---
read_when:
    - Центр усунення проблем направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи runbook на основі симптомів із точними командами
summary: Докладний runbook з усунення проблем для gateway, каналів, автоматизації, Node і браузера
title: Усунення проблем
x-i18n:
    generated_at: "2026-04-24T03:44:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c4cbbbe8b1cd5eaca34503f4a363d3fa2650e491f83455958eb5725f9d50c5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення проблем Gateway

Ця сторінка — докладний runbook.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу хочете швидкий потік triage.

## Послідовність команд

Запустіть спочатку їх, у такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки здорового стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми config/сервісу.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису і,
  де це підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Anthropic 429: extra usage required for long context

Використовуйте це, коли журнали/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Звертайте увагу на таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на long-context usage.
- Запити завершуються помилкою лише в довгих сесіях/запусках моделей, яким потрібен шлях 1M beta.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб перейти до звичайного вікна контексту.
2. Використайте облікові дані Anthropic, які мають право на long-context requests, або перейдіть на API key Anthropic.
3. Налаштуйте fallback models, щоб запуски тривали, коли Anthropic відхиляє long-context requests.

Пов’язане:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-compatible backend проходить прямі probes, але запуски агента завершуються помилкою

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw завершуються помилкою лише на звичайних ходах агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Звертайте увагу на таке:

- прямі малі виклики успішні, але запуски OpenClaw завершуються помилкою лише на більших prompt
- помилки backend про те, що `messages[].content` очікує рядок
- збої backend, які з’являються лише з більшими значеннями prompt-token або з повними
  prompt runtime агента

Поширені ознаки:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  відхиляє структуровані частини content у Chat Completions. Виправлення: задайте
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі малі запити успішні, але запуски агента OpenClaw завершуються збоями backend/model
  (наприклад, Gemma у деяких збірках `inferrs`) → транспорт OpenClaw,
  імовірно, уже налаштовано правильно; збій відбувається через більшу форму
  prompt runtime агента.
- збої зменшуються після вимкнення tools, але не зникають → схеми tools були
  частиною навантаження, але решта проблеми все ще є upstream-обмеженням моделі/сервера
  або помилкою backend.

Варіанти виправлення:

1. Задайте `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядки.
2. Задайте `compat.supportsTools: false` для моделей/backend, які не можуть надійно
   обробляти поверхню схеми tools OpenClaw.
3. Де можливо, зменште навантаження prompt: менший bootstrap workspace, коротша
   історія сесії, легша локальна модель або backend із кращою підтримкою long-context.
4. Якщо малі прямі запити й далі проходять, а ходи агента OpenClaw все ще спричиняють збій
   усередині backend, вважайте це upstream-обмеженням сервера/моделі й подайте туди repro з прийнятою формою payload.

Пов’язане:

- [/gateway/local-models](/uk/gateway/local-models)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але нічого не відповідає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Звертайте увагу на таке:

- Для відправників DM очікується pairing.
- Обмеження згадками в групах (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → групове повідомлення ігнорується, доки немає згадки.
- `pairing request` → відправник потребує підтвердження.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення dashboard/control UI

Коли dashboard/control UI не підключається, перевірте URL, режим auth і припущення щодо secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Звертайте увагу на таке:

- Правильний probe URL і dashboard URL.
- Невідповідність режиму auth/token між клієнтом і gateway.
- Використання HTTP там, де потрібна device identity.

Поширені ознаки:

- `device identity required` → non-secure context або відсутня device auth.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтесь із non-loopback browser origin без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  challenge-based потік device auth (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або з застарілим timestamp) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим device token.
- Ця повторна спроба з кешованим token повторно використовує кешований набір scope, збережений разом із paired
  device token. Виклики з явним `deviceToken` / явними `scopes` зберігають свій
  запитаний набір scope.
- Поза цим шляхом повторної спроби пріоритет connect auth такий: спочатку явний shared
  token/password, потім явний `deviceToken`, потім збережений device token,
  потім bootstrap token.
- На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як лімітер зафіксує невдачу. Тому дві некоректні
  одночасні повторні спроби від того самого клієнта можуть дати `retry later`
  на другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з browser-origin
  → повторні невдачі від того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
- повторюване `unauthorized` після такої повторної спроби → розсинхронізація shared token/device token; оновіть config token і повторно підтвердьте/перевипустіть device token за потреби.
- `gateway connect failed:` → неправильний host/port/url цілі.

### Швидка мапа кодів деталей auth

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                                                                                                                                                       | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий shared token.                                                                                                                                                  | Вставте/задайте token у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштуваннях Control UI.                                                                                                                    |
| `AUTH_TOKEN_MISMATCH`        | Shared token не збігся з token auth gateway.                                                                                                                                                   | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим token повторно використовують збережені підтверджені scopes; виклики з явним `deviceToken` / `scopes` зберігають запитаний набір scopes. Якщо збій лишається, виконайте [контрольний список відновлення після розсинхронізації token](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований token на пристрої застарів або відкликаний.                                                                                                                                          | Перевипустіть/повторно підтвердьте device token через [CLI devices](/uk/cli/devices), потім підключіться знову.                                                                                                                                                                           |
| `PAIRING_REQUIRED`           | Device identity потребує підтвердження. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використовуйте `requestId` / `remediationHint`, якщо вони присутні. | Підтвердьте очікуваний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/role використовують той самий потік після того, як ви переглянете запитаний доступ.                                                                            |

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим challenge nonce

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхиляється:

- сесії paired-device token можуть керувати лише **власним** пристроєм, якщо
  виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scopes,
  які сесія виклику вже має

Пов’язане:

- [/web/control-ui](/uk/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими auth gateway)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/uk/cli/devices)

## Сервіс Gateway не працює

Використовуйте це, коли сервіс установлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також сканувати системні сервіси
```

Звертайте увагу на таке:

- `Runtime: stopped` з підказками щодо виходу.
- Невідповідність config сервісу (`Config (cli)` vs `Config (service)`).
- Конфлікти port/listener.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Поширені ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл config було пошкоджено й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у вашому config або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікуваний config локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до config — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка до non-loopback без коректного шляху auth gateway (token/password або trusted-proxy, де налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні units launchd/systemd/schtasks. У більшості налаштувань має бути один gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язане:

- [/gateway/background-process](/uk/gateway/background-process)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/doctor](/uk/gateway/doctor)

## Gateway відновив last-known-good config

Використовуйте це, коли Gateway запускається, але журнали повідомляють, що він відновив `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Звертайте увагу на таке:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- файл `openclaw.json.clobbered.*` з часовою позначкою поруч з активним config
- системна подія головного агента, що починається з `Config recovery warning`

Що сталося:

- Відхилений config не пройшов validate під час запуску або hot reload.
- OpenClaw зберіг відхилений payload як `.clobbered.*`.
- Активний config було відновлено з останньої перевіреної last-known-good копії.
- Наступний хід головного агента отримає попередження не перезаписувати відхилений config бездумно.

Перевірка й виправлення:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Поширені ознаки:

- існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або читання під час запуску.
- існує `.rejected.*` → запис config, ініційований OpenClaw, не пройшов перевірки schema або clobber перед commit.
- `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідний config.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було розцінено як clobbered, бо він втратив поля або розмір порівняно з резервною last-known-good копією.
- `Config last-known-good promotion skipped` → кандидат містив замасковані placeholders секретів, як-от `***`.

Варіанти виправлення:

1. Залиште відновлений активний config, якщо він правильний.
2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
3. Запустіть `openclaw config validate` перед перезапуском.
4. Якщо ви редагуєте вручну, зберігайте повний JSON5 config, а не лише частковий об’єкт, який хотіли змінити.

Пов’язане:

- [/gateway/configuration#strict-validation](/uk/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/uk/gateway/configuration#config-hot-reload)
- [/cli/config](/uk/cli/config)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно друкує блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Звертайте увагу на таке:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи стосується попередження SSH fallback, кількох gateways, відсутніх scopes або невизначених auth refs.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback targets.
- `multiple reachable gateways detected` → відповіло більше однієї цілі. Зазвичай це означає навмисне налаштування з кількома gateways або застарілі/дубльовані listeners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але detail RPC обмежено scopes; підключіть device identity або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібні pairing/підтвердження перед звичайним доступом оператора.
- текст попередження про невизначені `gateway.auth.*` / `gateway.remote.*` SecretRef → auth material був недоступний у цьому шляху команди для цілі, що не вдалася.

Пов’язане:

- [/cli/gateway](/uk/cli/gateway)
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

Звертайте увагу на таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist груп і вимоги до згадок.
- Відсутні дозволи/scopes API каналу.

Поширені ознаки:

- `mention required` → повідомлення ігнорується через політику згадок у групі.
- `pairing` / сліди очікуваного підтвердження → відправника не підтверджено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема auth/дозволів каналу.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не доставився, спершу перевірте стан scheduler, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Звертайте увагу на таке:

- Cron увімкнено і присутній наступний wake.
- Статус історії запусків job (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій tick scheduler; перевірте помилки file/log/runtime.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися під час цього tick.
- `heartbeat: unknown accountId` → невалідний account id для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat визначилася як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для окремого агента) має значення `block`.

Пов’язане:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Інструмент paired Node завершується помилкою

Якщо Node підключений, але tools не працюють, ізолюйте стан foreground, дозволів і підтверджень.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Звертайте увагу на таке:

- Node online з очікуваними capabilities.
- Надані дозволи ОС для camera/mic/location/screen.
- Стан exec approvals і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується exec approval.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано через allowlist.

Пов’язане:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Помилка browser tool

Використовуйте це, коли дії browser tool завершуються помилкою, хоча сам gateway працює нормально.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Звертайте увагу на таке:

- Чи задано `plugins.allow` і чи містить він `browser`.
- Коректний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

Поширені ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований Plugin browser виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
- `Failed to start Chrome CDP on port` → процес браузера не вдалося запустити.
- `browser.executablePath not found` → заданий шлях невалідний.
- `browser.cdpUrl must be http(s) or ws(s)` → заданий URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → заданий URL CDP має некоректний або вихідний за межі діапазону порт.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг приєднатися до вибраного каталогу даних браузера. Відкрийте сторінку inspect браузера, увімкніть remote debugging, залиште браузер відкритим, підтвердьте перший запит на приєднання, а потім повторіть спробу. Якщо стан входу не потрібен, віддавайте перевагу керованому профілю `openclaw`.
- `No Chrome tabs found for profile="user"` → профіль приєднання Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний із хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → для профілю attach-only немає досяжної цілі, або HTTP endpoint відповів, але Webhook CDP усе одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточне встановлення gateway не має залежності runtime `playwright-core` вбудованого browser Plugin; запустіть `openclaw doctor --fix`, а потім перезапустіть gateway. Знімки ARIA і базові screenshot сторінки все ще можуть працювати, але навігація, AI snapshots, screenshot елементів за CSS-селекторами й експорт PDF залишаться недоступними.
- `fullPage is not supported for element screenshots` → запит screenshot поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики screenshot Chrome MCP / `existing-session` мають використовувати захоплення сторінки або snapshot `--ref`, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks завантаження файлів Chrome MCP потребують snapshot refs, а не CSS selectors.
- `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик у профілях Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hooks діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` усе ще потребує керованого браузера або профілю raw CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → запустіть `openclaw browser stop --browser-profile <name>`, щоб закрити активну сесію керування й звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язане:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість проблем після оновлення — це дрейф config або застосування суворіших значень за замовчуванням.

### 1) Змінилася поведінка auth і перевизначення URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть звертатися до remote, тоді як ваш локальний сервіс працює нормально.
- Явні виклики `--url` не використовують резервні збережені облікові дані.

Поширені ознаки:

- `gateway connect failed:` → неправильна URL-ціль.
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

- Прив’язки non-loopback (`lan`, `tailnet`, `custom`) потребують коректного шляху auth gateway: auth зі спільним token/password або правильно налаштованого non-loopback розгортання `trusted-proxy`.
- Старі ключі, як-от `gateway.token`, не замінюють `gateway.auth.token`.

Поширені ознаки:

- `refusing to bind gateway ... without auth` → прив’язка non-loopback без коректного шляху auth gateway.
- `Connectivity probe: failed` while runtime is running → gateway активний, але недоступний з поточними auth/url.

### 3) Змінився стан pairing і device identity

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Очікувані підтвердження пристроїв для dashboard/nodes.
- Очікувані підтвердження pairing у DM після змін політики або identity.

Поширені ознаки:

- `device identity required` → вимоги device auth не виконано.
- `pairing required` → відправника/пристрій потрібно підтвердити.

Якщо config сервісу і runtime після перевірок усе ще не збігаються, перевстановіть метадані сервісу з того самого каталогу profile/state:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [/gateway/pairing](/uk/gateway/pairing)
- [/gateway/authentication](/uk/gateway/authentication)
- [/gateway/background-process](/uk/gateway/background-process)

## Пов’язане

- [Gateway runbook](/uk/gateway)
- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
