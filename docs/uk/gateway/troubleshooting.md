---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника на основі симптомів із точними командами
summary: Детальний посібник із усунення несправностей для Gateway, каналів, автоматизації, Node і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-26T05:15:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb9bc18353b156cbc0bf26e8c55529993c493874aa67bb06f09fb058892f4e65
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Gateway

Ця сторінка — детальний посібник.
Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете пройти швидкий потік первинної діагностики.

## Сходинка команд

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
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації чи сервісу.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису та, де це підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Роздвоєні інсталяції та захист від новішої конфігурації

Використовуйте це, коли сервіс Gateway неочікувано зупиняється після оновлення або коли журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записувала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть перевіряти конфігурацію, записану новішою версією OpenClaw, але зміни процесів і сервісів не продовжуються зі старішого бінарного файлу. До заблокованих дій належать запуск, зупинка, перезапуск і видалення сервісу Gateway, примусове перевстановлення сервісу, запуск Gateway у режимі сервісу та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

Варіанти виправлення:

1. Виправте `PATH`, щоб `openclaw` вказував на новішу інсталяцію, а потім повторіть дію.
2. Перевстановіть потрібний сервіс Gateway з новішої інсталяції:

   ```bash
   openclaw gateway install --force
   openclaw gateway restart
   ```

3. Видаліть застарілий системний пакет або старі записи обгортки, які все ще вказують на старий бінарний файл `openclaw`.

Лише для навмисного пониження версії або аварійного відновлення встановіть
`OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди.
Для звичайної роботи залишайте цю змінну невстановленою.

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали або помилки містять:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити завершуються помилкою лише під час довгих сесій або запусків моделі, яким потрібен бета-шлях 1M.

Варіанти виправлення:

1. Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
2. Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на ключ Anthropic API.
3. Налаштуйте резервні моделі, щоб запуски продовжувалися, коли Anthropic відхиляє запити з довгим контекстом.

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і вартість](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний бекенд проходить прямі probe, але запуски агента завершуються помилкою

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw завершуються помилкою лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Зверніть увагу на таке:

- прямі малі виклики успішні, але запуски OpenClaw завершуються помилкою лише на більших prompt
- помилки бекенда про те, що `messages[].content` очікує рядок
- збої бекенда, які виникають лише за більшої кількості токенів prompt або з повними prompt середовища виконання агента

Поширені ознаки:

- `messages[...].content: invalid type: sequence, expected a string` → бекенд відхиляє структуровані частини вмісту Chat Completions. Виправлення: установіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- прямі малі запити успішні, але запуски агента OpenClaw завершуються збоями бекенда/моделі (наприклад, Gemma на деяких збірках `inferrs`) → імовірно, транспорт OpenClaw уже налаштований правильно; збій відбувається на боці бекенда через більшу форму prompt середовища виконання агента.
- збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів були частиною навантаження, але решта проблеми все ще пов’язана з можливостями моделі/сервера вищого рівня або з помилкою бекенда.

Варіанти виправлення:

1. Установіть `compat.requiresStringContent: true` для бекендів Chat Completions, які підтримують лише рядковий вміст.
2. Установіть `compat.supportsTools: false` для моделей/бекендів, які не можуть надійно обробляти поверхню схем інструментів OpenClaw.
3. Де можливо, зменште навантаження prompt: менший початковий bootstrap робочого простору, коротша історія сесії, легша локальна модель або бекенд із кращою підтримкою довгого контексту.
4. Якщо малі прямі запити й далі проходять, а ходи агента OpenClaw все ще спричиняють збої всередині бекенда, розглядайте це як обмеження сервера/моделі вищого рівня та створіть там відтворюваний приклад із прийнятною формою payload.

Пов’язане:

- [Локальні моделі](/uk/gateway/local-models)
- [Конфігурація](/uk/gateway/configuration)
- [OpenAI-сумісні endpoint](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але відповіді не надходять, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Для відправників у приватних повідомленнях очікується pairing.
- Обмеження згадування у групі (`requireMention`, `mentionPatterns`).
- Невідповідність allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення в групі ігнорується, доки не буде згадки.
- `pairing request` → відправника потрібно схвалити.
- `blocked` / `allowlist` → відправника/канал відфільтровано політикою.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Pairing](/uk/channels/pairing)
- [Групи](/uk/channels/groups)

## Підключення Dashboard control ui

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильні URL для probe і dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Поширені ознаки:

- `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
- `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins` (або ви підключаєтесь із не-loopback походження браузера без явного allowlist).
- `device nonce required` / `device nonce mismatch` → клієнт не завершує автентифікаційний потік пристрою на основі challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або використав застарілу позначку часу) для поточного handshake.
- `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
- Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом із парним токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають свій запитаний набір scope.
- Поза цим шляхом повторної спроби пріоритет автентифікації під час підключення такий: спочатку явний спільний токен/пароль, далі явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
- На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як обмежувач зафіксує збій. Тому дві одночасні невдалі повторні спроби від того самого клієнта можуть показати `retry later` на другій спробі замість двох звичайних невідповідностей.
- `too many failed authentication attempts (retry later)` від loopback-клієнта з походженням браузера → повторні збої від того самого нормалізованого `Origin` тимчасово блокуються; інше localhost-origin використовує окремий сегмент.
- повторювані `unauthorized` після цієї повторної спроби → розходження спільного токена/токена пристрою; оновіть конфігурацію токена та за потреби повторно схваліть/оберніть токен пристрою.
- `gateway connect failed:` → неправильна ціль host/port/url.

### Коротка карта кодів деталей автентифікації

Використовуйте `error.details.code` із невдалого відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                               | Вставте/установіть токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, а потім вставте його в налаштування Control UI.                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігається з токеном автентифікації Gateway.                                                                                                                               | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явним `deviceToken` / `scopes` зберігають запитаний набір scope. Якщо збій не зникає, виконайте [контрольний список відновлення після розходження токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для окремого пристрою застарів або був відкликаний.                                                                                                                           | Оберніть/повторно схваліть токен пристрою за допомогою [CLI devices](/uk/cli/devices), а потім перепідключіться.                                                                                                                                                                         |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використовуйте `requestId` / `remediationHint`, якщо вони присутні. | Схваліть відкладений запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/ролі використовують той самий потік після перевірки запитаного доступу.                                                                                         |

Прямі loopback backend RPC, автентифіковані спільним
токеном/паролем Gateway, не повинні залежати від базового рівня scope парного пристрою CLI. Якщо субагенти або інші внутрішні виклики все ще завершуються помилкою `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примушує явний `deviceIdentity` або токен пристрою.

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, який підключається, і перевірте його:

1. очікує на `connect.challenge`
2. підписує payload, прив’язаний до challenge
3. надсилає `connect.params.device.nonce` з тим самим nonce challenge

Якщо в `openclaw devices rotate` / `revoke` / `remove` неочікувано відмовлено:

- сесії токена парного пристрою можуть керувати лише **власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті scope оператора, які сесія виклику вже має

Пов’язане:

- [Control UI](/uk/web/control-ui)
- [Конфігурація](/uk/gateway/configuration) (режими автентифікації gateway)
- [Автентифікація trusted proxy](/uk/gateway/trusted-proxy-auth)
- [Віддалений доступ](/uk/gateway/remote)
- [Пристрої](/uk/cli/devices)

## Сервіс Gateway не запущений

Використовуйте це, коли сервіс установлено, але процес не залишається активним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також перевіряє системні сервіси
```

Зверніть увагу на таке:

- `Runtime: stopped` із підказками щодо виходу.
- Невідповідність конфігурації сервісу (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові інсталяції launchd/systemd/schtasks при використанні `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

Поширені ознаки:

- `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було пошкоджено й він втратив `gateway.mode`. Виправлення: установіть `gateway.mode="local"` у конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → прив’язка до не-loopback адреси без дійсного шляху автентифікації gateway (токен/пароль або trusted-proxy, де це налаштовано).
- `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
- `Other gateway-like services detected (best effort)` → існують застарілі або паралельні модулі launchd/systemd/schtasks. У більшості конфігурацій на машині має бути один gateway; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

Пов’язане:

- [Фонове виконання та інструмент process](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відновив останню справну конфігурацію

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
- Файл `openclaw.json.clobbered.*` із часовою позначкою поруч з активною конфігурацією
- Системна подія головного агента, що починається з `Config recovery warning`

Що сталося:

- Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
- OpenClaw зберіг відхилений payload як `.clobbered.*`.
- Активну конфігурацію було відновлено з останньої валідної копії last-known-good.
- Наступний хід головного агента отримує попередження не переписувати відхилену конфігурацію бездумно.
- Якщо всі проблеми валідації були в межах `plugins.entries.<id>...`, OpenClaw не відновлював би весь файл. Локальні збої Plugin залишаються явними, тоді як не пов’язані налаштування користувача залишаються в активній конфігурації.

Перевірка й виправлення:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Поширені ознаки:

- існує `.clobbered.*` → було відновлено після зовнішнього прямого редагування або читання під час запуску.
- існує `.rejected.*` → запис конфігурації, виконаний самим OpenClaw, не пройшов перевірки схеми або clobber-перевірки до коміту.
- `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було визнано пошкодженим, оскільки він втратив поля або розмір порівняно з резервною копією last-known-good.
- `Config last-known-good promotion skipped` → кандидат містив замасковані заповнювачі секретів, наприклад `***`.

Варіанти виправлення:

1. Залиште відновлену активну конфігурацію, якщо вона правильна.
2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
3. Перед перезапуском виконайте `openclaw config validate`.
4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.

Пов’язане:

- [Конфігурація: строга валідація](/uk/gateway/configuration#strict-validation)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Config](/uk/cli/config)
- [Doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось доходить, але все одно виводить блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження SSH fallback, кількох gateway, відсутніх scope або нерозв’язаних auth ref.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH завершилося помилкою, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіло більше однієї цілі. Зазвичай це означає навмисну конфігурацію з кількома gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але detail RPC обмежено scope; виконайте pairing ідентичності пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібне pairing/схвалення перед звичайним доступом оператора.
- нерозв’язане попередження SecretRef для `gateway.auth.*` / `gateway.remote.*` → у цьому шляху виконання команди був недоступний автентифікаційний матеріал для цілі, що завершилась помилкою.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, але повідомлення не проходять

Якщо стан каналу показує підключення, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Зверніть увагу на таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи та вимоги до згадувань.
- Відсутні дозволи/scope API каналу.

Поширені ознаки:

- `mention required` → повідомлення ігнорується через політику згадувань у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема автентифікації/дозволів каналу.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [WhatsApp](/uk/channels/whatsapp)
- [Telegram](/uk/channels/telegram)
- [Discord](/uk/channels/discord)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не доставив дані, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнено й наявний наступний wake.
- Статус історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Поширені ознаки:

- `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
- `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/журналів/середовища виконання.
- `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
- `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але на цьому тіку жодне із завдань не підлягає виконанню.
- `heartbeat: unknown accountId` → некоректний account id для цілі доставки Heartbeat.
- `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat було визначено як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для окремого агента) встановлено в `block`.

Пов’язане:

- [Заплановані завдання: усунення несправностей](/uk/automation/cron-jobs#troubleshooting)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Heartbeat](/uk/gateway/heartbeat)

## Збій інструмента парного Node

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
- Надані ОС дозволи для камери/мікрофона/геолокації/екрана.
- Стан схвалень exec і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язане:

- [Усунення несправностей Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)
- [Схвалення exec](/uk/tools/exec-approvals)

## Збій інструмента браузера

Використовуйте це, коли дії інструмента браузера завершуються помилкою, хоча сам gateway працює справно.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Коректний шлях до виконуваного файлу браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

Поширені ознаки:

- `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
- browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажувався.
- `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
- `browser.executablePath not found` → налаштований шлях недійсний.
- `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
- `browser.cdpUrl has invalid port` → налаштований URL CDP має неправильний або неприпустимий порт.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session поки не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку inspect браузера, увімкніть remote debugging, залиште браузер відкритим, схваліть перший запит на під’єднання, а потім повторіть спробу. Якщо стан входу в обліковий запис не потрібен, використовуйте керований профіль `openclaw`.
- `No Chrome tabs found for profile="user"` → у профілі під’єднання Chrome MCP немає відкритих локальних вкладок Chrome.
- `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний із хоста gateway.
- `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для під’єднання не має досяжної цілі, або HTTP endpoint відповів, але CDP WebSocket усе одно не вдалося відкрити.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточній інсталяції gateway відсутня залежність часу виконання `playwright-core` вбудованого browser Plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть gateway. ARIA-знімки та базові знімки сторінки все ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селекторами та експорт PDF залишаться недоступними.
- `fullPage is not supported for element screenshots` → запит на знімок екрана поєднав `--full-page` з `--ref` або `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки завантаження файлів Chrome MCP потребують snapshot ref, а не CSS-селекторів.
- `existing-session file uploads currently support one file at a time.` → для профілів Chrome MCP надсилайте одне завантаження за виклик.
- `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
- `existing-session type does not support timeoutMs overrides.` → не використовуйте `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, якщо потрібен власний timeout.
- `existing-session evaluate does not support timeoutMs overrides.` → не використовуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, якщо потрібен власний timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або профілю raw CDP.
- застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керовану сесію та звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

Пов’язане:

- [Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting)
- [Browser (керований OpenClaw)](/uk/tools/browser)

## Якщо ви оновилися й щось раптово зламалося

Більшість збоїв після оновлення пов’язані з дрейфом конфігурації або з тим, що тепер застосовуються суворіші типові налаштування.

### 1) Змінилася поведінка перевизначення auth і URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Що перевірити:

- Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалену ціль, тоді як локальний сервіс працює нормально.
- Явні виклики `--url` не повертаються до збережених облікових даних.

Поширені ознаки:

- `gateway connect failed:` → неправильна ціль URL.
- `unauthorized` → endpoint досяжний, але auth неправильна.

### 2) Захисні обмеження bind і auth стали суворішими

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Що перевірити:

- Прив’язки не-loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху auth gateway: спільна автентифікація токеном/паролем або правильно налаштоване розгортання `trusted-proxy` не-loopback.
- Старі ключі, як-от `gateway.token`, не замінюють `gateway.auth.token`.

Поширені ознаки:

- `refusing to bind gateway ... without auth` → прив’язка не-loopback без дійсного шляху auth gateway.
- `Connectivity probe: failed` за умови, що runtime працює → gateway живий, але недоступний із поточними auth/url.

### 3) Змінився стан pairing та ідентичності пристрою

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Що перевірити:

- Очікують на схвалення пристрої для dashboard/nodes.
- Очікують на схвалення pairing у DM після зміни політики або ідентичності.

Поширені ознаки:

- `device identity required` → не виконано автентифікацію пристрою.
- `pairing required` → відправника/пристрій потрібно схвалити.

Якщо після перевірок конфігурація сервісу й runtime усе ще не збігаються, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [Pairing під керуванням Gateway](/uk/gateway/pairing)
- [Автентифікація](/uk/gateway/authentication)
- [Фонове виконання та інструмент process](/uk/gateway/background-process)

## Пов’язане

- [Посібник Gateway](/uk/gateway)
- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
