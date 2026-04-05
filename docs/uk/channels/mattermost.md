---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-05T17:59:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f21dc7543176fda0b38b00fab60f0daae38dffcf68fa1cf7930a9f14ec57cb5a
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Статус: вбудований плагін (токен бота + події WebSocket). Підтримуються канали, групи та DM.
Mattermost — це self-hosted платформа командного обміну повідомленнями; відомості про продукт і завантаження див. на офіційному сайті
[mattermost.com](https://mattermost.com).

## Вбудований плагін

Mattermost постачається як вбудований плагін у поточних релізах OpenClaw, тому звичайні
зібрані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або спеціальне встановлення без Mattermost,
встановіть його вручну:

Встановлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Локальна копія репозиторію (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Докладніше: [Плагіни](/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що плагін Mattermost доступний.
   - Поточні зібрані релізи OpenClaw уже містять його в комплекті.
   - У старіших/спеціальних інсталяціях його можна додати вручну наведеними вище командами.
2. Створіть обліковий запис бота Mattermost і скопіюйте **токен бота**.
3. Скопіюйте **базову URL-адресу** Mattermost (наприклад, `https://chat.example.com`).
4. Налаштуйте OpenClaw і запустіть gateway.

Мінімальна конфігурація:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Власні slash-команди

Власні slash-команди вмикаються лише за бажанням. Коли їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через
Mattermost API і отримує callback POST-запити на HTTP-сервер gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Примітки:

- `native: "auto"` типово вимкнено для Mattermost. Задайте `native: true`, щоб увімкнути.
- Якщо `callbackUrl` не вказано, OpenClaw виводить його з host/port gateway + `callbackPath`.
- Для конфігурацій із кількома обліковими записами `commands` можна задати на верхньому рівні або в
  `channels.mattermost.accounts.<id>.commands` (значення облікового запису перевизначають поля верхнього рівня).
- Callback-и команд перевіряються за допомогою токенів для кожної команди, які
  Mattermost повертає, коли OpenClaw реєструє команди `oc_*`.
- Callback-и slash-команд працюють у режимі fail closed, якщо реєстрація не вдалася, запуск був частковим або
  токен callback-а не збігається з жодною із зареєстрованих команд.
- Вимога до доступності: кінцева точка callback має бути доступною із сервера Mattermost.
  - Не задавайте `callbackUrl` як `localhost`, якщо Mattermost не працює на тому самому хості/у тому самому просторі мережевих імен, що й OpenClaw.
  - Не задавайте `callbackUrl` як базову URL-адресу Mattermost, якщо ця адреса не проксіює `/api/channels/mattermost/command` до OpenClaw у зворотному напрямку.
  - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET має повертати `405 Method Not Allowed` від OpenClaw, а не `404`.
- Вимога до allowlist вихідних з’єднань Mattermost:
  - Якщо ваш callback спрямовано на приватні/tailnet/внутрішні адреси, налаштуйте
    `ServiceSettings.AllowedUntrustedInternalConnections` у Mattermost так, щоб він містив host/domain callback-а.
  - Використовуйте записи host/domain, а не повні URL.
    - Правильно: `gateway.tailnet-name.ts.net`
    - Неправильно: `https://gateway.tailnet-name.ts.net`

## Змінні середовища (типовий обліковий запис)

Задайте їх на хості gateway, якщо ви надаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Змінні середовища застосовуються лише до **типового** облікового запису (`default`). Інші облікові записи мають використовувати значення з конфігурації.

## Режими чату

Mattermost автоматично відповідає на DM. Поведінка в каналах керується `chatmode`:

- `oncall` (типово): відповідати в каналах лише за @-згадки.
- `onmessage`: відповідати на кожне повідомлення в каналі.
- `onchar`: відповідати, коли повідомлення починається з префікса-тригера.

Приклад конфігурації:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Примітки:

- `onchar` усе ще відповідає на явні @-згадки.
- `channels.mattermost.requireMention` враховується для застарілих конфігурацій, але перевага надається `chatmode`.

## Треди та сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах лишатимуться в
основному каналі, чи запускатимуть тред під повідомленням-тригером.

- `off` (типово): відповідати в треді лише тоді, коли вхідний допис уже в ньому.
- `first`: для повідомлень верхнього рівня в каналі/групі запускати тред під цим дописом і маршрутизувати
  розмову до сесії, прив’язаної до треду.
- `all`: наразі в Mattermost поводиться так само, як `first`.
- Особисті повідомлення ігнорують це налаштування й залишаються поза тредами.

Приклад конфігурації:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Примітки:

- Сесії, прив’язані до треду, використовують id повідомлення-тригера як корінь треду.
- `first` і `all` наразі еквівалентні, оскільки щойно Mattermost має корінь треду,
  подальші фрагменти й медіа продовжують іти в тому самому треді.

## Керування доступом (DM)

- Типово: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код pairing).
- Підтвердження через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні DM: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- Типово: `channels.mattermost.groupPolicy = "allowlist"` (із gating за згадкою).
- Додавайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендовано ідентифікатори користувачів).
- Перевизначення згадок для окремих каналів містяться в `channels.mattermost.groups.<channelId>.requireMention`
  або в `channels.mattermost.groups["*"].requireMention` як типове значення.
- Зіставлення `@username` є змінним і вмикається лише тоді, коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (із gating за згадкою).
- Примітка щодо runtime: якщо `channels.mattermost` повністю відсутній, runtime резервно використовує `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

Приклад:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Цілі для вихідної доставки

Використовуйте ці формати цілей з `openclaw message send` або cron/webhooks:

- `channel:<id>` для каналу
- `user:<id>` для DM
- `@username` для DM (визначається через Mattermost API)

Прості непрозорі ідентифікатори (наприклад `64ifufp...`) у Mattermost **неоднозначні** (ID користувача чи ID каналу).

OpenClaw визначає їх за правилом **спочатку користувач**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` виконується успішно), OpenClaw надсилає **DM**, визначаючи direct-канал через `/api/v4/channels/direct`.
- Інакше ID вважається **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).

## Повторні спроби для DM-каналу

Коли OpenClaw надсилає до цілі DM у Mattermost і спершу має визначити direct-канал,
він типово повторює спроби в разі тимчасових збоїв створення direct-каналу.

Використовуйте `channels.mattermost.dmChannelRetry`, щоб налаштувати цю поведінку глобально для плагіна Mattermost,
або `channels.mattermost.accounts.<id>.dmChannelRetry` для одного облікового запису.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Примітки:

- Це застосовується лише до створення DM-каналу (`/api/v4/channels/direct`), а не до кожного виклику Mattermost API.
- Повторні спроби застосовуються до тимчасових збоїв, як-от ліміти частоти, відповіді 5xx, а також помилки мережі чи тайм-аута.
- Помилки клієнта 4xx, окрім `429`, вважаються постійними й повторно не виконуються.

## Реакції (інструмент message)

- Використовуйте `message action=react` із `channel=mattermost`.
- `messageId` — це id допису Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Задайте `remove=true` (булеве значення), щоб прибрати реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до сесії агента, визначеної маршрутизацією.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнення/вимкнення дій із реакціями (типово true).
- Перевизначення для окремого облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

## Інтерактивні кнопки (інструмент message)

Надсилайте повідомлення з кнопками, які можна натискати. Коли користувач натискає кнопку, агент отримує
вибір і може відповісти.

Увімкніть кнопки, додавши `inlineButtons` до можливостей каналу:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Використовуйте `message action=send` із параметром `buttons`. Кнопки — це двовимірний масив (ряди кнопок):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Поля кнопки:

- `text` (обов’язково): мітка для відображення.
- `callback_data` (обов’язково): значення, яке надсилається назад при натисканні (використовується як id дії).
- `style` (необов’язково): `"default"`, `"primary"` або `"danger"`.

Коли користувач натискає кнопку:

1. Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
2. Агент отримує вибір як вхідне повідомлення й відповідає.

Примітки:

- Callback-и кнопок використовують перевірку HMAC-SHA256 (автоматично, без додаткової конфігурації).
- Mattermost прибирає callback data зі своїх API-відповідей (функція безпеки), тому після натискання
  видаляються всі кнопки — часткове видалення неможливе.
- ID дій, що містять дефіси або символи підкреслення, автоматично санітизуються
  (обмеження маршрутизації Mattermost).

Конфігурація:

- `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб
  увімкнути опис інструмента кнопок у системному промпті агента.
- `channels.mattermost.interactions.callbackBaseUrl`: необов’язкова зовнішня базова URL-адреса для
  callback-ів кнопок (наприклад `https://gateway.example.com`). Використовуйте це, коли Mattermost не може
  напряму дістатися до gateway за його bind host.
- У конфігураціях із кількома обліковими записами це саме поле також можна задавати в
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Якщо `interactions.callbackBaseUrl` не вказано, OpenClaw виводить URL callback-а з
  `gateway.customBindHost` + `gateway.port`, а потім резервно використовує `http://localhost:<port>`.
- Правило доступності: URL callback-а кнопки має бути доступним із сервера Mattermost.
  `localhost` працює лише тоді, коли Mattermost і OpenClaw працюють на тому самому хості/у тому самому просторі мережевих імен.
- Якщо ціль callback-а є приватною/tailnet/внутрішньою, додайте її host/domain до
  `ServiceSettings.AllowedUntrustedInternalConnections` у Mattermost.

### Пряма інтеграція з API (зовнішні скрипти)

Зовнішні скрипти та вебхуки можуть публікувати кнопки безпосередньо через Mattermost REST API,
а не через інструмент `message` агента. Використовуйте `buildButtonAttachments()` із
розширення, коли це можливо; якщо надсилаєте сирий JSON, дотримуйтеся таких правил:

**Структура payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Критично важливі правила:**

1. Attachments розміщуються в `props.attachments`, а не в top-level `attachments` (інакше вони тихо ігноруються).
2. Кожна дія повинна мати `type: "button"` — без цього натискання тихо поглинаються.
3. Кожна дія повинна мати поле `id` — Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише буквено-цифровим** (`[a-zA-Z0-9]`). Дефіси та символи підкреслення ламають
   серверну маршрутизацію дій у Mattermost (повертається 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб у повідомленні підтвердження показувалася
   назва кнопки (наприклад, "Approve"), а не сирий ID.
6. `context.action_id` є обов’язковим — без нього обробник взаємодій повертає 400.

**Генерація токена HMAC:**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени,
які відповідають логіці перевірки gateway:

1. Виведіть секрет із токена бота:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Побудуйте об’єкт контексту з усіма полями **крім** `_token`.
3. Серіалізуйте з **відсортованими ключами** і **без пробілів** (gateway використовує `JSON.stringify`
   із відсортованими ключами, що дає компактний вивід).
4. Підпишіть: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Додайте отриманий hex-digest як `_token` у контекст.

Приклад на Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Поширені проблеми з HMAC:

- `json.dumps` у Python типово додає пробіли (`{"key": "val"}`). Використовуйте
  `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
- Завжди підписуйте **всі** поля контексту (крім `_token`). Gateway прибирає `_token`, а потім
  підписує все, що залишилося. Підпис лише підмножини полів спричиняє тихий збій перевірки.
- Використовуйте `sort_keys=True` — gateway сортує ключі перед підписуванням, а Mattermost може
  змінювати порядок полів контексту під час збереження payload.
- Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет
  має бути однаковим і для процесу, що створює кнопки, і для gateway, який їх перевіряє.

## Адаптер каталогу

Плагін Mattermost містить адаптер каталогу, який визначає назви каналів і користувачів
через Mattermost API. Це дає змогу використовувати цілі `#channel-name` та `@username` у
`openclaw message send` і в доставці cron/webhook.

Конфігурація не потрібна — адаптер використовує токен бота з конфігурації облікового запису.

## Кілька облікових записів

Mattermost підтримує кілька облікових записів у `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Усунення проблем

- Немає відповідей у каналах: переконайтеся, що бот є в каналі та що ви його згадуєте (`oncall`), використовуйте префікс-тригер (`onchar`) або задайте `chatmode: "onmessage"`.
- Помилки автентифікації: перевірте токен бота, базову URL-адресу та чи ввімкнено обліковий запис.
- Проблеми з кількома обліковими записами: змінні середовища застосовуються лише до облікового запису `default`.
- Власні slash-команди повертають `Unauthorized: invalid command token.`: OpenClaw
  не прийняв токен callback-а. Типові причини:
  - реєстрація slash-команди не вдалася або була виконана лише частково під час запуску
  - callback потрапляє не до того gateway/облікового запису
  - у Mattermost досі є старі команди, що вказують на попередню ціль callback-а
  - gateway перезапустився без повторної активації slash-команд
- Якщо власні slash-команди перестали працювати, перевірте журнали на наявність
  `mattermost: failed to register slash commands` або
  `mattermost: native slash commands enabled but no commands could be registered`.
- Якщо `callbackUrl` не вказано і журнали попереджають, що callback визначився як
  `http://127.0.0.1:18789/...`, ця адреса, імовірно, доступна лише тоді,
  коли Mattermost працює на тому самому хості/у тому самому просторі мережевих імен, що й OpenClaw. Натомість задайте
  явний зовнішньо доступний `commands.callbackUrl`.
- Кнопки відображаються як білі прямокутники: агент може надсилати некоректні дані кнопок. Переконайтеся, що кожна кнопка має поля `text` і `callback_data`.
- Кнопки відображаються, але натискання нічого не робить: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, а `EnablePostActionIntegration` має значення `true` у ServiceSettings.
- Під час натискання кнопки повертається 404: імовірно, `id` кнопки містить дефіси або символи підкреслення. Маршрутизатор дій Mattermost ламається на небуквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
- У журналах gateway є `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля контексту (а не лише підмножину), використовуєте відсортовані ключі й компактний JSON (без пробілів). Див. розділ HMAC вище.
- У журналах gateway є `missing _token in context`: поле `_token` відсутнє в контексті кнопки. Переконайтеся, що воно включене під час побудови payload інтеграції.
- У підтвердженні показується сирий ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Задайте однакове санітизоване значення для обох.
- Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/channels/groups) — поведінка групових чатів і gating за згадкою
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
