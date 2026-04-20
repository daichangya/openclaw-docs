---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника на основі симптомів із точними командами
summary: Поглиблений посібник з усунення несправностей для Gateway, каналів, автоматизації, Node і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-20T07:04:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: d93a82407dbb1314b91a809ff9433114e1e9a3b56d46547ef53a8196bac06260
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Gateway

Ця сторінка — поглиблений посібник.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете швидкий сценарій первинної діагностики.

## Послідовність команд

Спочатку виконайте це, у такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/служби.
- `openclaw channels status --probe` показує актуальний стан транспорту для кожного облікового запису та,
  де це підтримується, результати probe/audit, наприклад `works` або `audit ok`.

## Anthropic 429: для довгого контексту потрібне додаткове використання

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
- Запити падають лише на довгих сесіях/запусках моделі, яким потрібен шлях 1M beta.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використовуйте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на ключ Anthropic API.
3. Налаштуйте резервні моделі, щоб запуски продовжувалися, коли Anthropic відхиляє запити з довгим контекстом.

Пов’язано:

- [/providers/anthropic](/uk/providers/anthropic)
- [/reference/token-use](/uk/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/uk/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний бекенд проходить прямі probe, але запуски агента падають

Використовуйте це, коли:

- `curl ... /v1/models` працює
- маленькі прямі виклики `/v1/chat/completions` працюють
- запуски моделі OpenClaw падають лише на звичайних ходах агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Зверніть увагу на таке:

- прямі маленькі виклики успішні, але запуски OpenClaw падають лише на більших запитах
- помилки бекенда про те, що `messages[].content` очікує рядок
- збої бекенда, які з’являються лише за більшої кількості токенів у prompt або в повних prompt середовища агента

Типові сигнатури:

- `messages[...].content: invalid type: sequence, expected a string` → бекенд
  відхиляє структуровані частини контенту Chat Completions. Виправлення: задайте
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі маленькі запити успішні, але ходи агента OpenClaw падають через збої
  бекенда/моделі (наприклад Gemma у деяких збірках `inferrs`) → транспорт OpenClaw
  імовірно вже налаштований правильно; бекенд падає на більшій формі prompt
  середовища агента.
- збої зменшуються після вимкнення інструментів, але не зникають → схеми
  інструментів були частиною навантаження, але решта проблеми все ще пов’язана
  з обмеженнями моделі/сервера вище за потоком або з багом бекенда.

Варіанти виправлення:

1. Задайте `compat.requiresStringContent: true` для бекендів Chat Completions, що підтримують лише рядки.
2. Задайте `compat.supportsTools: false` для моделей/бекендів, які не можуть
   надійно обробляти поверхню схем інструментів OpenClaw.
3. За можливості зменште навантаження prompt: менший bootstrap робочого простору, коротша
   історія сесії, легша локальна модель або бекенд із кращою підтримкою довгого контексту.
4. Якщо маленькі прямі запити продовжують проходити, а ходи агента OpenClaw усе ще
   падають усередині бекенда, вважайте це обмеженням сервера/моделі вище за потоком і
   створіть там відтворюваний приклад із прийнятою формою payload.

Пов’язано:

- [/gateway/local-models](/uk/gateway/local-models)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але відповідей немає, перед повторним підключенням будь-чого перевірте маршрутизацію й політики.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Очікує підтвердження pairing для відправників у DM.
- Обмеження згадок у групах (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Типові сигнатури:

- `drop guild message (mention required` → повідомлення групи ігнорується, доки немає згадки.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язано:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/pairing](/uk/channels/pairing)
- [/channels/groups](/uk/channels/groups)

## Підключення dashboard/control UI

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильні probe URL і dashboard URL.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Типові сигнатури:

- `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins`
  (або ви підключаєтеся з джерела браузера не через loopback без явного
  allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує
  challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний
  payload (або використав застарілу часову мітку) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Така повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом із paired
  токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають
  запитаний ними набір scope.
- Поза цим шляхом повторної спроби пріоритет автентифікації підключення такий: спочатку явний спільний
  токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою,
  потім bootstrap token.
- В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як limiter зафіксує невдачу. Тому дві помилкові
  одночасні повторні спроби від того самого клієнта можуть показати `retry later`
  у другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з browser-origin
  → повторні невдачі з того самого нормалізованого `Origin` тимчасово блокуються;
  інше localhost origin використовує окремий bucket.
- повторюваний `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію токена та за потреби повторно схваліть/ротуйте токен пристрою.
- `gateway connect failed:` → неправильна ціль host/port/url.

### Швидка таблиця кодів деталей автентифікації

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Detail code                  | Значення                                                                                                                                                                                     | Рекомендована дія                                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                              | Вставте/задайте токен у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштуваннях Control UI.                                                                                                                     |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації Gateway.                                                                                                                                   | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явним `deviceToken` / `scopes` зберігають запитаний набір scope. Якщо помилка не зникла, виконайте [контрольний список відновлення після розсинхронізації токена](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для конкретного пристрою застарів або відкликаний.                                                                                                                           | Ротуйте/повторно схваліть токен пристрою через [CLI пристроїв](/cli/devices), потім підключіться знову.                                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на значення `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використовуйте `requestId` / `remediationHint`, якщо вони присутні. | Схваліть очікуваний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Підвищення scope/ролей використовують той самий процес після перевірки запитаного доступу.                                                                                           |

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

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано заборонено:

- сесії токена paired-device можуть керувати лише **власним** пристроєм, якщо
  виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scope,
  які сесія виклику вже має

Пов’язано:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/uk/gateway/configuration) (режими автентифікації gateway)
- [/gateway/trusted-proxy-auth](/uk/gateway/trusted-proxy-auth)
- [/gateway/remote](/uk/gateway/remote)
- [/cli/devices](/cli/devices)

## Служба Gateway не запущена

Використовуйте це, коли службу встановлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також перевіряє служби на рівні системи
```

Зверніть увагу на таке:

- `Runtime: stopped` із підказками щодо виходу.
- Невідповідність конфігурації служби (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Типові сигнатури:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не увімкнено, або файл конфігурації було пошкоджено й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у своїй конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації gateway (токен/пароль або trusted-proxy, де це налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні модулі launchd/systemd/schtasks. У більшості конфігурацій слід тримати один gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язано:

- [/gateway/background-process](/uk/gateway/background-process)
- [/gateway/configuration](/uk/gateway/configuration)
- [/gateway/doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно виводить блок попереджень.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження резервного SSH-шляху, кількох gateway, відсутніх scope чи нерозв’язаних auth ref.

Типові сигнатури:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не спрацювало, але команда все одно спробувала прямі налаштовані/loopback-цілі.
- `multiple reachable gateways detected` → відповіло більше однієї цілі. Зазвичай це означає навмисну багатошлюзову конфігурацію або застарілі/дубльовані listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але деталізований RPC обмежений scope; виконайте pairing ідентичності пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібне pairing/схвалення перед звичайним доступом оператора.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → матеріал автентифікації був недоступний у цьому шляху команди для цілі, що завершилася невдачею.

Пов’язано:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host)
- [/gateway/remote](/uk/gateway/remote)

## Канал підключено, але повідомлення не проходять

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиках, дозволах і правилах доставки, специфічних для каналу.

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

Типові сигнатури:

- `mention required` → повідомлення ігнорується політикою згадок у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з автентифікацією/дозволами каналу.

Пов’язано:

- [/channels/troubleshooting](/uk/channels/troubleshooting)
- [/channels/whatsapp](/uk/channels/whatsapp)
- [/channels/telegram](/uk/channels/telegram)
- [/channels/discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустилися чи не були доставлені, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнено й присутнє наступне пробудження.
- Статус історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Типові сигнатури:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/журналів/середовища виконання.
- `heartbeat skipped` з `reason=quiet-hours` → поза межами вікна активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має бути виконане на цьому тіку.
- `heartbeat: unknown accountId` → недійсний account id для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat була визначена як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) встановлено в `block`.

Пов’язано:

- [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/uk/automation/cron-jobs)
- [/gateway/heartbeat](/uk/gateway/heartbeat)

## Збій інструмента paired Node

Якщо Node paired, але інструменти не працюють, ізолюйте стан foreground, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Node онлайн з очікуваними capability.
- Надані дозволи ОС для камери/мікрофона/геолокації/екрана.
- Стан схвалень exec і allowlist.

Типові сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язано:

- [/nodes/troubleshooting](/uk/nodes/troubleshooting)
- [/nodes/index](/uk/nodes/index)
- [/tools/exec-approvals](/uk/tools/exec-approvals)

## Збій інструмента браузера

Використовуйте це, коли дії інструмента браузера не працюють, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи задано `plugins.allow` і чи містить він `browser`.
- Чинний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

Типові сигнатури:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
- інструмент браузера відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
- `Failed to start Chrome CDP on port` → процес браузера не зміг запуститися.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або неприпустимий порт.
- `No Chrome tabs found for profile="user"` → профіль приєднання Chrome MCP не має відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недоступна з хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль attach-only не має досяжної цілі, або HTTP-ендпойнт відповів, але CDP WebSocket усе одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточному встановленні gateway відсутній повний пакет Playwright; знімки ARIA і базові скриншоти сторінок усе ще можуть працювати, але навігація, AI-знімки, скриншоти елементів за CSS-селекторами й експорт PDF залишаються недоступними.
- `fullPage is not supported for element screenshots` → запит на скриншот змішав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики скриншотів Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів Chrome MCP потребують snapshot ref, а не CSS-селектори.
- `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик для профілів Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або сирого профілю CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну сесію керування й звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язано:

- [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [/tools/browser](/uk/tools/browser)

## Якщо ви оновилися й раптом щось зламалося

Більшість збоїв після оновлення — це дрейф конфігурації або суворіші типові значення, які тепер застосовуються.

### 1) Змінилася поведінка автентифікації та перевизначення URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалений gateway, хоча ваша локальна служба справна.
- Явні виклики `--url` не повертаються до збережених облікових даних.

Типові сигнатури:

- `gateway connect failed:` → неправильна URL-ціль.
- `unauthorized` → ендпойнт досяжний, але автентифікація неправильна.

### 2) Запобіжники bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації gateway: автентифікація спільним токеном/паролем або правильно налаштоване розгортання `trusted-proxy` не в loopback.
- Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

Типові сигнатури:

- `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації gateway.
- `Connectivity probe: failed` коли середовище виконання запущене → gateway працює, але недоступний із поточними auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Очікувані схвалення пристроїв для dashboard/nodes.
- Очікувані схвалення DM pairing після змін політики або ідентичності.

Типові сигнатури:

- `device identity required` → вимоги device auth не виконано.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація служби й середовище виконання все ще не збігаються, перевстановіть метадані служби з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язано:

- [/gateway/pairing](/uk/gateway/pairing)
- [/gateway/authentication](/uk/gateway/authentication)
- [/gateway/background-process](/uk/gateway/background-process)
