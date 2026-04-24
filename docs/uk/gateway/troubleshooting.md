---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи runbook за симптомами з точними командами
summary: Поглиблений runbook з усунення несправностей для gateway, channel, автоматизації, Node і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-24T03:17:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: f588268d56c331bbf236b9e5cb0df478cdffc9f9c38b2dfdd1ad7046b506e217
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Gateway

Ця сторінка — поглиблений runbook.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку вам потрібен швидкий triage-потік.

## Послідовність команд

Спочатку виконайте ці команди в такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані сигнали справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/сервісу.
- `openclaw channels status --probe` показує живий per-account стан транспорту і,
  де підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли логи/помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не придатні для використання довгого контексту.
- Запити збоять лише на довгих сесіях/запусках моделей, яким потрібен beta-шлях 1M.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використовуйте облікові дані Anthropic, придатні для запитів із довгим контекстом, або перейдіть на API-ключ Anthropic.
3. Налаштуйте fallback-моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.

Пов’язане:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний backend проходить прямі probe, але запуски агентів збоять

Використовуйте це, коли:

- `curl ... /v1/models` працює
- маленькі прямі виклики `/v1/chat/completions` працюють
- Запуски моделей OpenClaw збоять лише на звичайних turn агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте:

- малі прямі виклики проходять, але запуски OpenClaw збоять лише на більших prompt
- помилки backend про те, що `messages[].content` очікує рядок
- збої backend, які з’являються лише за більших лічильників prompt-токенів або в повних
  prompt runtime агента

Поширені сигнатури:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  відхиляє структуровані частини content у Chat Completions. Виправлення: встановіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі маленькі запити проходять, але запуски агентів OpenClaw збоять через збої backend/моделі
  (наприклад Gemma на деяких збірках `inferrs`) → транспорт OpenClaw
  найімовірніше вже правильний; збій backend відбувається на більшій формі
  prompt runtime агента.
- збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів
  були частиною навантаження, але решта проблеми все ще полягає в обмеженнях
  upstream-сервера/моделі або в помилці backend.

Варіанти виправлення:

1. Встановіть `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядки.
2. Встановіть `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти
   поверхню схем інструментів OpenClaw.
3. Де можливо, зменште навантаження prompt: менший bootstrap workspace, коротша
   історія сесії, легша локальна модель або backend із сильнішою підтримкою
   довгого контексту.
4. Якщо маленькі прямі запити й далі проходять, а turn агента OpenClaw все одно збоять
   всередині backend, розглядайте це як обмеження upstream-сервера/моделі й створіть
   там repro з прийнятою формою payload.

Пов’язане:

- [/gateway/local-models](/uk/gateway/local-models)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо channel працюють, але нічого не відповідає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте:

- Pairing у стані очікування для відправників у DM.
- Обмеження згадок у групах (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist для channel/груп.

Поширені сигнатури:

- `drop guild message (mention required` → повідомлення групи ігнорується, доки немає згадки.
- `pairing request` → відправника потрібно схвалити.
- `blocked` / `allowlist` → відправника/channel було відфільтровано політикою.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення dashboard/control UI

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте:

- Правильний URL probe і URL dashboard.
- Невідповідність режиму auth/token між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Поширені сигнатури:

- `device identity required` → не-безпечний контекст або відсутня автентифікація пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з browser origin не-loopback без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  flow автентифікації пристрою на основі challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або зі старим timestamp) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scopes, збережений із paired
  токеном пристрою. Виклики з явними `deviceToken` / явними `scopes` зберігають
  свій запитаний набір scopes.
- Поза цим шляхом повторної спроби пріоритет автентифікації connect такий:
  спочатку явні спільні token/password, потім явний `deviceToken`, потім збережений токен пристрою,
  потім bootstrap token.
- В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як limiter фіксує збій. Тому дві помилкові
  паралельні повторні спроби від того самого клієнта можуть показати `retry later`
  на другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта
  з browser-origin → повторні збої з того самого нормалізованого `Origin`
  тимчасово блокуються; інший localhost origin використовує окремий bucket.
- повторювані `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена й за потреби повторно схваліть/перевипустіть токен пристрою.
- `gateway connect failed:` → неправильна ціль host/port/url.

### Коротка таблиця кодів деталей auth

Використовуйте `error.details.code` з невдалого відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                                                                                                                                                     | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                              | Вставте/задайте токен у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштуваннях Control UI.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації gateway.                                                                                                                                   | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scopes; виклики з явними `deviceToken` / `scopes` зберігають запитані scopes. Якщо це не допомогло, виконайте [контрольний список відновлення після дрейфу токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований per-device токен застарів або був відкликаний.                                                                                                                                      | Перевипустіть/повторно схваліть токен пристрою через [CLI devices](/uk/cli/devices), потім підключіться знову.                                                                                                                                                                           |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, якщо вони є. | Схваліть запит, що очікує: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/role використовують той самий flow після перевірки запитаного доступу.                                                                                           |

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо логи показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте, що він:

1. чекає на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим nonce challenge

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано заборонено:

- сесії paired-device token можуть керувати лише **власним** пристроєм, якщо
  викликальник також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише operator scopes,
  які сесія викликальника вже має

Пов’язане:

- [/web/control-ui](/uk/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими auth gateway)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/uk/cli/devices)

## Сервіс Gateway не запущений

Використовуйте це, коли сервіс встановлено, але процес не залишається активним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також сканує сервіси на рівні системи
```

Шукайте:

- `Runtime: stopped` із підказками щодо виходу.
- Невідповідність конфігурації сервісу (`Config (cli)` vs `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові встановлення launchd/systemd/schtasks при використанні `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Поширені сигнатури:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було перезаписано/пошкоджено і він втратив `gateway.mode`. Виправлення: установіть `gateway.mode="local"` у вашій конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind не на loopback без чинного шляху автентифікації gateway (token/password або, якщо налаштовано, trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні launchd/systemd/schtasks units. У більшості конфігурацій має бути один gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язане:

- [/gateway/background-process](/uk/gateway/background-process)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/doctor](/uk/gateway/doctor)

## Gateway відновив останню відому коректну конфігурацію

Використовуйте це, коли Gateway запускається, але в логах сказано, що він відновив `openclaw.json`.

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
- файл `openclaw.json.clobbered.*` із часовою міткою поруч з активною конфігурацією
- системну подію main-agent, яка починається з `Config recovery warning`

Що сталося:

- Відхилена конфігурація не пройшла перевірку під час запуску або hot reload.
- OpenClaw зберіг відхилений payload як `.clobbered.*`.
- Активну конфігурацію було відновлено з останньої перевіреної last-known-good копії.
- Наступний turn main-agent отримає попередження, щоб не перезаписувати відхилену конфігурацію бездумно.

Перевірка й виправлення:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Поширені сигнатури:

- існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або читання під час запуску.
- існує `.rejected.*` → запис конфігурації, ініційований OpenClaw, не пройшов перевірку схеми або clobber-checks перед commit.
- `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було визнано clobbered, бо він втратив поля або розмір порівняно з резервною last-known-good копією.
- `Config last-known-good promotion skipped` → кандидат містив замасковані placeholders секретів, наприклад `***`.

Варіанти виправлення:

1. Залиште відновлену активну конфігурацію, якщо вона правильна.
2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
3. Перед перезапуском виконайте `openclaw config validate`.
4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.

Пов’язане:

- [/gateway/configuration#strict-validation](/uk/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/uk/gateway/configuration#config-hot-reload)
- [/cli/config](/uk/cli/config)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження Gateway probe

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно виводить блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи пов’язане попередження з fallback на SSH, кількома gateway, відсутніми scopes або невизначеними auth refs.

Поширені сигнатури:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не спрацювало, але команда все одно спробувала прямі налаштовані/loopback targets.
- `multiple reachable gateways detected` → відповіла більш ніж одна ціль. Зазвичай це означає навмисне налаштування з кількома gateway або застарілі/дубльовані listeners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але детальний RPC обмежено scopes; виконайте pair device identity або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібні pairing/approval перед звичайним доступом оператора.
- текст попередження про невизначений SecretRef `gateway.auth.*` / `gateway.remote.*` → auth-матеріал був недоступний у цьому шляху команди для target, що не пройшов.

Пов’язане:

- [/cli/gateway](/uk/cli/gateway)
- [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host)
- [/gateway/remote](/uk/gateway/remote)

## Channel підключено, але повідомлення не проходять

Якщо стан channel показує підключення, але потік повідомлень мертвий, зосередьтеся на політиці, дозволах і правилах доставки, специфічних для channel.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте:

- Політику DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist груп і вимоги до згадок.
- Відсутні дозволи/scopes API каналу.

Поширені сигнатури:

- `mention required` → повідомлення проігноровано політикою згадок у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з auth/дозволами channel.

Пов’язане:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустилися чи не доставилися, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте:

- Cron увімкнено, і присутній час наступного пробудження.
- Статус історії запусків job (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені сигнатури:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/логів/runtime.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися на цьому тіці.
- `heartbeat: unknown accountId` → недійсний id облікового запису для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat визначилася як пункт призначення в стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для агента) має значення `block`.

Пов’язане:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Збій інструмента paired Node

Якщо Node спарений, але інструменти не працюють, ізолюйте стан foreground, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Шукайте:

- Node онлайн з очікуваними можливостями.
- Надані дозволи ОС для камери/мікрофона/геолокації/екрана.
- Стан exec approvals і allowlist.

Поширені сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язане:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Збій інструмента браузера

Використовуйте це, коли дії browser tool не працюють, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте:

- Чи задано `plugins.allow` і чи включає він `browser`.
- Коректний шлях до виконуваного файла браузера.
- Досяжність CDP profile.
- Доступність локального Chrome для profile `existing-session` / `user`.

Поширені сигнатури:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
- `Failed to start Chrome CDP on port` → процес браузера не зміг запуститися.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або неприпустимий порт.
- `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP ще не зміг підключитися до вибраного каталогу даних браузера. Відкрийте сторінку inspect браузера, увімкніть remote debugging, залиште браузер відкритим, схваліть перший запит на підключення, а потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому profile `openclaw`.
- `No Chrome tabs found for profile="user"` → profile підключення Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний із gateway-хоста.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profile attach-only не має досяжної цілі, або HTTP endpoint відповів, але CDP WebSocket все одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточному встановленні gateway бракує залежності runtime `playwright-core` вбудованого browser Plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть gateway. Знімки ARIA і базові знімки сторінок усе ще можуть працювати, але навігація, AI snapshots, знімки елементів за CSS-селекторами й експорт PDF залишатимуться недоступними.
- `fullPage is not supported for element screenshots` → запит на знімок екрана змішав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або snapshot `--ref`, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks завантаження файлів Chrome MCP потребують snapshot refs, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → для profile Chrome MCP надсилайте одне завантаження за виклик.
- `existing-session dialog handling does not support timeoutMs.` → hooks діалогів у profile Chrome MCP не підтримують перевизначення timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або raw CDP profile.
- застарілі перевизначення viewport / dark-mode / locale / offline у profile attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керувальну сесію й звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язане:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися і щось раптово зламалося

Більшість збоїв після оновлення — це дрейф конфігурації або суворіші типові значення, які тепер примусово застосовуються.

### 1) Змінилася поведінка auth і перевизначення URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути націлені на віддалений gateway, навіть якщо ваш локальний сервіс працює нормально.
- Явні виклики з `--url` не використовують fallback до збережених облікових даних.

Поширені сигнатури:

- `gateway connect failed:` → неправильний URL target.
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

- Bind не на loopback (`lan`, `tailnet`, `custom`) потребують чинного шляху автентифікації gateway: auth зі спільним token/password або правильно налаштованого розгортання `trusted-proxy` не на loopback.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Поширені сигнатури:

- `refusing to bind gateway ... without auth` → bind не на loopback без чинного шляху автентифікації gateway.
- `Connectivity probe: failed` коли runtime працює → gateway живий, але недоступний із поточними auth/url.

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

Поширені сигнатури:

- `device identity required` → auth пристрою не виконана.
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

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
