---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи посібника, побудовані за симптомами, з точними командами
sidebarTitle: Troubleshooting
summary: Поглиблений посібник із пошуку та усунення несправностей для gateway, каналів, автоматизації, Node і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-26T07:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Ця сторінка — поглиблений посібник. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу хочете швидкий сценарій первинної діагностики.

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
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/сервісів.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису та, де підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Роздвоєні інсталяції та захист від новішої конфігурації

Використовуйте це, коли сервіс gateway несподівано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записувала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть перевіряти конфігурацію, записану новішим OpenClaw, але зміни процесів і сервісів відмовляються продовжувати роботу зі старішого бінарного файлу. До заблокованих дій належать запуск, зупинка, перезапуск і видалення сервісу gateway, примусове перевстановлення сервісу, запуск gateway у режимі сервісу та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Виправте PATH">
    Виправте `PATH`, щоб `openclaw` посилався на новішу інсталяцію, а потім повторіть дію.
  </Step>
  <Step title="Перевстановіть сервіс gateway">
    Перевстановіть потрібний сервіс gateway з новішої інсталяції:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Видаліть застарілі обгортки">
    Видаліть застарілі записи системного пакета або старої обгортки, які все ще вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного пониження версії або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи залишайте його невстановленим.
</Warning>

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити не проходять лише для довгих сесій/запусків моделі, які потребують шляху 1M beta.

Варіанти виправлення:

<Steps>
  <Step title="Вимкніть context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
  </Step>
  <Step title="Використайте облікові дані з відповідними правами">
    Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на ключ Anthropic API.
  </Step>
  <Step title="Налаштуйте резервні моделі">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.
  </Step>
</Steps>

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний бекенд проходить прямі probe, але запуски агента не працюють

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw не проходять лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Зверніть увагу на таке:

- прямі малі виклики успішні, але запуски OpenClaw не проходять лише на більших prompt
- помилки бекенда про те, що `messages[].content` очікує рядок
- збої бекенда, які виникають лише за більшої кількості токенів prompt або з повними prompt середовища виконання агента

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `messages[...].content: invalid type: sequence, expected a string` → бекенд не приймає структуровані частини вмісту Chat Completions. Виправлення: встановіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - прямі малі запити проходять, але запуски агента OpenClaw падають через збої бекенда/моделі (наприклад, Gemma у деяких збірках `inferrs`) → імовірно, транспорт OpenClaw уже налаштований правильно; проблема в тому, що бекенд не справляється з більшою формою prompt середовища виконання агента.
    - збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів були частиною навантаження, але решта проблеми все ще пов’язана з можливостями моделі/сервера або помилкою бекенда вище за рівнем.
  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Встановіть `compat.requiresStringContent: true` для бекендів Chat Completions, які підтримують лише рядковий вміст.
    2. Встановіть `compat.supportsTools: false` для моделей/бекендів, які не можуть надійно обробляти поверхню схем інструментів OpenClaw.
    3. За можливості зменште навантаження prompt: менший bootstrap робочого простору, коротша історія сесії, легша локальна модель або бекенд із кращою підтримкою довгого контексту.
    4. Якщо малі прямі запити продовжують працювати, а ходи агента OpenClaw усе одно падають усередині бекенда, вважайте це обмеженням моделі/сервера вище за рівнем і створіть там відтворюваний звіт із прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні endpoint](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але відповідей немає, перевірте маршрутизацію та політики, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Очікується pairing для відправників у прямих повідомленнях.
- У групі ввімкнено обов’язкову згадку (`requireMention`, `mentionPatterns`).
- Невідповідність allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення в групі ігнорується, доки немає згадки.
- `pairing request` → відправник потребує схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Pairing](/uk/channels/pairing)

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

- Правильний probe URL і URL dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

<AccordionGroup>
  <Accordion title="Ознаки підключення / автентифікації">
    - `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
    - `origin not allowed` → браузерний `Origin` відсутній у `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з браузерного origin не з local loopback без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або застарілу часову позначку) для поточного handshake.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір областей доступу, збережений разом із paired токеном пристрою. Виклики з явними `deviceToken` / явними `scopes` натомість зберігають власний запитаний набір областей.
    - Поза цим шляхом повторної спроби пріоритет автентифікації під час підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як обмежувач зафіксує невдачу. Тому дві одночасні хибні повторні спроби від одного клієнта можуть призвести до `retry later` у другій спробі замість двох звичайних невідповідностей.
    - `too many failed authentication attempts (retry later)` від loopback-клієнта з браузерним origin → повторні невдалі спроби з того самого нормалізованого `Origin` тимчасово блокуються; інший localhost-origin використовує окремий bucket.
    - повторні `unauthorized` після цієї повторної спроби → розсинхронізація спільного токена/токена пристрою; оновіть конфігурацію токена та за потреби повторно схваліть/ротуйте токен пристрою.
    - `gateway connect failed:` → неправильний хост/порт/цільовий url.
  </Accordion>
</AccordionGroup>

### Коротка мапа кодів подробиць автентифікації

Використовуйте `error.details.code` із невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код подробиць               | Значення                                                                                                                                                                                     | Рекомендована дія                                                                                                                                                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`        | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                              | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, а потім вставте його в налаштуваннях Control UI.                                                                                                                  |
| `AUTH_TOKEN_MISMATCH`       | Спільний токен не збігається з токеном автентифікації gateway.                                                                                                                              | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені області доступу; виклики з явними `deviceToken` / `scopes` зберігають запитаний набір областей. Якщо все одно не працює, виконайте [контрольний список відновлення після розсинхронізації токенів](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для конкретного пристрою застарів або був відкликаний.                                                                                                                      | Ротуйте/повторно схваліть токен пристрою за допомогою [CLI devices](/uk/cli/devices), а потім підключіться знову.                                                                                                                                                                           |
| `PAIRING_REQUIRED`          | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, якщо вони є. | Схваліть запит, що очікує: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Підвищення областей доступу/ролей використовують той самий процес після перегляду запитаного доступу.                                                                                |

<Note>
Прямі loopback RPC бекенда, автентифіковані спільним токеном/паролем gateway, не повинні залежати від базового набору областей paired-device у CLI. Якщо субагенти або інші внутрішні виклики все одно завершуються з `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примушує явний `deviceIdentity` або токен пристрою.
</Note>

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте таке:

<Steps>
  <Step title="Дочекайтеся connect.challenge">
    Клієнт чекає на виданий gateway `connect.challenge`.
  </Step>
  <Step title="Підпишіть payload">
    Клієнт підписує payload, прив’язаний до challenge.
  </Step>
  <Step title="Надішліть device nonce">
    Клієнт надсилає `connect.params.device.nonce` з тим самим nonce challenge.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` несподівано відхиляється:

- сесії токенів paired-device можуть керувати лише **власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті області оператора, які сесія виклику вже має

Пов’язане:

- [Configuration](/uk/gateway/configuration) (режими автентифікації gateway)
- [Control UI](/uk/web/control-ui)
- [Devices](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Автентифікація trusted proxy](/uk/gateway/trusted-proxy-auth)

## Сервіс gateway не працює

Використовуйте це, коли сервіс інстальований, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також перевіряє системні сервіси
```

Зверніть увагу на таке:

- `Runtime: stopped` із підказками щодо завершення.
- Невідповідність конфігурації сервісу (`Config (cli)` проти `Config (service)`).
- Конфлікти портів/слухачів.
- Додаткові інсталяції launchd/systemd/schtasks при використанні `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було пошкоджено, і він втратив `gateway.mode`. Виправлення: встановіть `gateway.mode="local"` у своїй конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації gateway (токен/пароль або trusted-proxy, якщо налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні модулі launchd/systemd/schtasks. У більшості конфігурацій має бути один gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Фонове виконання та інструмент process](/uk/gateway/background-process)
- [Configuration](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відновив останню справну конфігурацію

Використовуйте це, коли Gateway запускається, але журнали кажуть, що він відновив `openclaw.json`.

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
- файл `openclaw.json.clobbered.*` із часовою позначкою поруч з активною конфігурацією
- системна подія основного агента, що починається з `Config recovery warning`

<AccordionGroup>
  <Accordion title="Що сталося">
    - Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
    - OpenClaw зберіг відхилений payload як `.clobbered.*`.
    - Активну конфігурацію було відновлено з останньої перевіреної справної копії.
    - Наступний хід основного агента отримує попередження не перезаписувати відхилену конфігурацію бездумно.
    - Якщо всі проблеми валідації були лише в `plugins.entries.<id>...`, OpenClaw не відновлював би весь файл. Локальні збої Plugin лишаються помітними, тоді як не пов’язані користувацькі налаштування зберігаються в активній конфігурації.
  </Accordion>
  <Accordion title="Перевірка і виправлення">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Поширені ознаки">
    - існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або читання під час запуску.
    - існує `.rejected.*` → запис конфігурації, яким керував OpenClaw, не пройшов перевірки схеми або clobber перед commit.
    - `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл вважався clobbered, бо втратив поля або розмір порівняно з останньою справною резервною копією.
    - `Config last-known-good promotion skipped` → кандидат містив приховані заповнювачі секретів, наприклад `***`.
  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Залиште відновлену активну конфігурацію, якщо вона правильна.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
    3. Запустіть `openclaw config validate` перед перезапуском.
    4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Config](/uk/cli/config)
- [Configuration: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Configuration: сувора валідація](/uk/gateway/configuration#strict-validation)
- [Doctor](/uk/gateway/doctor)

## Попередження probe gateway

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно виводить блок попереджень.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи стосується попередження SSH fallback, кількох gateway, відсутніх областей доступу або нерозв’язаних посилань автентифікації.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback-цілі.
- `multiple reachable gateways detected` → відповіла більш ніж одна ціль. Зазвичай це означає навмисну конфігурацію з кількома gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення вдалося, але RPC подробиць обмежене областями; спаріть ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібне pairing/схвалення перед звичайним доступом оператора.
- нерозв’язане попередження SecretRef у `gateway.auth.*` / `gateway.remote.*` → матеріал автентифікації був недоступний у цьому шляху команди для цілі, що завершилася невдачею.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, але повідомлення не проходять

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиках, дозволах і правилах доставки конкретного каналу.

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
- Відсутні дозволи/області API каналу.

Поширені ознаки:

- `mention required` → повідомлення ігнорується політикою згадок у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема автентифікації/дозволів каналу.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустилися чи не доставили результат, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнено і є наступне пробудження.
- Статус історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
    - `cron: timer tick failed` → помилка тіку планувальника; перевірте помилки файлів/журналів/середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза межами вікна активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися на цьому тіку.
    - `heartbeat: unknown accountId` → недійсний ID облікового запису для цілі доставки heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль heartbeat була визначена як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) встановлено в `block`.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Заплановані завдання: усунення несправностей](/uk/automation/cron-jobs#troubleshooting)

## Node спарено, але інструмент не працює

Якщо Node спарено, але інструменти не працюють, ізолюйте стан foreground, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Node у мережі з очікуваними можливостями.
- Надані дозволи ОС для камери/мікрофона/геолокації/екрана.
- Стан схвалень exec і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язане:

- [Схвалення exec](/uk/tools/exec-approvals)
- [Усунення несправностей Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)

## Інструмент браузера не працює

Використовуйте це, коли дії інструмента браузера не виконуються, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Чинний шлях до виконуваного файлу браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Ознаки Plugin / виконуваного файлу">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
    - інструмент browser відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажувався.
    - `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або неприпустимий порт.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточній інсталяції gateway бракує залежності середовища виконання `playwright-core` для вбудованого browser Plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть gateway. Знімки ARIA і базові знімки сторінок усе ще можуть працювати, але навігація, AI snapshots, знімки елементів за CSS-селекторами та експорт PDF залишаться недоступними.
  </Accordion>
  <Accordion title="Ознаки Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку inspect браузера, увімкніть remote debugging, залиште браузер відкритим, схваліть перший запит на підключення, а потім повторіть спробу. Якщо вхід у систему не потрібен, надайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль підключення Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний із хоста gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для підключення не має досяжної цілі, або HTTP endpoint відповів, але WebSocket CDP усе одно не вдалося відкрити.
  </Accordion>
  <Accordion title="Ознаки елементів / знімків / вивантаження">
    - `fullPage is not supported for element screenshots` → запит на знімок поєднав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків для Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки вивантаження файлів Chrome MCP потребують посилань snapshot, а не CSS-селекторів.
    - `existing-session file uploads currently support one file at a time.` → надсилайте одне вивантаження за виклик для профілів Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
    - `existing-session type does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP профіль браузера, коли потрібен власний timeout.
    - `existing-session evaluate does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP профіль браузера, коли потрібен власний timeout.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або сирого профілю CDP.
    - застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну сесію керування і звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Browser (керований OpenClaw)](/uk/tools/browser)
- [Усунення несправностей browser](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися і щось раптово зламалося

Більшість збоїв після оновлення — це дрейф конфігурації або суворіші типові значення, які тепер примусово застосовуються.

<AccordionGroup>
  <Accordion title="1. Змінилася поведінка автентифікації та перевизначення URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалений gateway, тоді як локальний сервіс працює справно.
    - Явні виклики з `--url` не повертаються до збережених облікових даних.

    Поширені ознаки:

    - `gateway connect failed:` → неправильний цільовий URL.
    - `unauthorized` → endpoint досяжний, але автентифікація неправильна.

  </Accordion>
  <Accordion title="2. Захисти прив’язки та автентифікації стали суворішими">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Що перевірити:

    - Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують чинного шляху автентифікації gateway: автентифікації спільним токеном/паролем або правильно налаштованого розгортання `trusted-proxy` не для loopback.
    - Старі ключі, як-от `gateway.token`, не замінюють `gateway.auth.token`.

    Поширені ознаки:

    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації gateway.
    - `Connectivity probe: failed` тоді як середовище виконання працює → gateway живий, але недоступний із поточною автентифікацією/url.

  </Accordion>
  <Accordion title="3. Змінився стан pairing та ідентичності пристрою">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Запити на схвалення пристроїв, що очікують, для dashboard/nodes.
    - Запити на схвалення DM pairing, що очікують, після змін політик або ідентичності.

    Поширені ознаки:

    - `device identity required` → вимоги автентифікації пристрою не виконано.
    - `pairing required` → відправник/пристрій має бути схвалений.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу та середовище виконання все ще не збігаються після перевірок, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [Authentication](/uk/gateway/authentication)
- [Фонове виконання та інструмент process](/uk/gateway/background-process)
- [Pairing під керуванням gateway](/uk/gateway/pairing)

## Пов’язане

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Посібник для gateway](/uk/gateway)
