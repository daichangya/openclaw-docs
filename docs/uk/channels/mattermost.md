---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
summary: Налаштування бота Mattermost та конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T07:10:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04913fe38ddce73eba2a7f3953ec3241b6871ce4a06e0393d09331e37a39cc2f
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Статус: вбудований plugin (токен бота + події WebSocket). Підтримуються канали, групи та приватні повідомлення.
Mattermost — це платформа командного обміну повідомленнями з можливістю самостійного розгортання; докладніше про продукт і завантаження дивіться на офіційному сайті
[mattermost.com](https://mattermost.com).

## Вбудований plugin

Mattermost постачається як вбудований plugin у поточних випусках OpenClaw, тому звичайним
пакетним збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення без Mattermost,
встановіть його вручну:

Встановлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Локальна checkout-копія (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що plugin Mattermost доступний.
   - У поточних пакетних випусках OpenClaw він уже вбудований.
   - У старіших/власних встановленнях його можна додати вручну командами вище.
2. Створіть обліковий запис бота Mattermost і скопіюйте **токен бота**.
3. Скопіюйте **базовий URL** Mattermost (наприклад, `https://chat.example.com`).
4. Налаштуйте OpenClaw і запустіть Gateway.

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

## Вбудовані slash-команди

Вбудовані slash-команди є необов’язковими. Якщо їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через
API Mattermost і отримує callback POST-запити на HTTP-сервері Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Використовуйте, якщо Mattermost не може напряму звернутися до Gateway (reverse proxy/публічний URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Примітки:

- `native: "auto"` за замовчуванням вимкнено для Mattermost. Щоб увімкнути, установіть `native: true`.
- Якщо `callbackUrl` пропущено, OpenClaw формує його з хоста/порту Gateway + `callbackPath`.
- Для конфігурацій із кількома обліковими записами `commands` можна задавати на верхньому рівні або в
  `channels.mattermost.accounts.<id>.commands` (значення облікового запису мають пріоритет над полями верхнього рівня).
- Callback-и команд перевіряються за допомогою токенів для кожної команди, які повертає
  Mattermost, коли OpenClaw реєструє команди `oc_*`.
- Callback-и slash-команд блокуються в разі помилки реєстрації, часткового запуску або
  якщо токен callback-у не збігається з жодною із зареєстрованих команд.
- Вимога доступності: endpoint callback-у має бути доступний із сервера Mattermost.
  - Не задавайте `callbackUrl` як `localhost`, якщо Mattermost не працює на тому самому хості/в тому самому мережевому просторі імен, що й OpenClaw.
  - Не задавайте `callbackUrl` як ваш базовий URL Mattermost, якщо цей URL не проксіює `/api/channels/mattermost/command` до OpenClaw через reverse proxy.
  - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET-запит має повертати `405 Method Not Allowed` від OpenClaw, а не `404`.
- Вимога до allowlist вихідних з’єднань Mattermost:
  - Якщо ваш callback спрямовано на приватні/tailnet/internal адреси, додайте хост/домен callback-у до
    `ServiceSettings.AllowedUntrustedInternalConnections` у Mattermost.
  - Використовуйте записи хоста/домену, а не повні URL.
    - Правильно: `gateway.tailnet-name.ts.net`
    - Неправильно: `https://gateway.tailnet-name.ts.net`

## Змінні середовища (обліковий запис за замовчуванням)

Задайте їх на хості Gateway, якщо вам зручніше використовувати змінні середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Змінні середовища застосовуються лише до **облікового запису за замовчуванням** (`default`). Для інших облікових записів потрібно використовувати значення з конфігурації.

<Note>
`MATTERMOST_URL` входить до списку заблокованих endpoint-блоком змінних і не може задаватися з
файлу `.env` робочого простору. Його потрібно передавати через shell environment або
середовище процесу Gateway, щоб ненадійні робочі простори не могли перенаправити трафік Mattermost
на інший сервер. Повний список див. у
[Workspace `.env` files](/uk/gateway/security).
</Note>

## Режими чату

Mattermost автоматично відповідає на приватні повідомлення. Поведінка в каналах керується через `chatmode`:

- `oncall` (за замовчуванням): відповідати в каналах лише при @згадці.
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

- `onchar` усе одно відповідає на явні @згадки.
- `channels.mattermost.requireMention` враховується для застарілих конфігурацій, але рекомендовано використовувати `chatmode`.

## Гілки та сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в
основному каналі, чи починають гілку під постом, який їх спричинив.

- `off` (за замовчуванням): відповідати в гілці лише тоді, коли вхідний пост уже в ній.
- `first`: для повідомлень верхнього рівня в каналі/групі почати гілку під цим постом і спрямувати
  розмову в сесію, прив’язану до гілки.
- `all`: наразі для Mattermost поводиться так само, як `first`.
- Приватні повідомлення ігнорують цей параметр і залишаються без гілок.

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

- Сесії, прив’язані до гілки, використовують id поста-тригера як корінь гілки.
- `first` і `all` зараз еквівалентні, оскільки щойно в Mattermost з’являється корінь гілки,
  подальші частини відповіді та медіа продовжуються в тій самій гілці.

## Керування доступом (приватні повідомлення)

- За замовчуванням: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код pairing).
- Схвалення через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні приватні повідомлення: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- За замовчуванням: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадки).
- Додавайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендовано використовувати ID користувачів).
- Перевизначення згадки для окремих каналів задаються в `channels.mattermost.groups.<channelId>.requireMention`
  або в `channels.mattermost.groups["*"].requireMention` як типове значення.
- Відповідність `@username` є змінною і вмикається лише за `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (із вимогою згадки).
- Примітка щодо runtime: якщо `channels.mattermost` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

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
- `user:<id>` для приватного повідомлення
- `@username` для приватного повідомлення (визначається через API Mattermost)

Прості непрозорі ID (наприклад, `64ifufp...`) у Mattermost **неоднозначні** (ID користувача чи ID каналу).

OpenClaw визначає їх **спочатку як користувача**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` виконується успішно), OpenClaw надсилає **приватне повідомлення**, визначаючи прямий канал через `/api/v4/channels/direct`.
- Інакше ID трактується як **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).

## Повторні спроби для DM-каналу

Коли OpenClaw надсилає в ціль приватного повідомлення Mattermost і спочатку має визначити прямий канал,
за замовчуванням він повторює спроби у випадку тимчасових збоїв створення прямого каналу.

Використовуйте `channels.mattermost.dmChannelRetry`, щоб налаштувати цю поведінку глобально для plugin Mattermost,
або `channels.mattermost.accounts.<id>.dmChannelRetry` для окремого облікового запису.

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

- Це стосується лише створення DM-каналу (`/api/v4/channels/direct`), а не кожного виклику API Mattermost.
- Повторні спроби застосовуються до тимчасових збоїв, таких як обмеження швидкості, відповіді 5xx та помилки мережі або тайм-ауту.
- Помилки клієнта 4xx, окрім `429`, вважаються постійними й не повторюються.

## Попередній перегляд streaming

Mattermost передає thinking, активність інструментів і частковий текст відповіді в один **чернетковий пост попереднього перегляду**, який фіналізується на місці, коли фінальну відповідь безпечно надсилати. Попередній перегляд оновлюється в тому самому id поста замість того, щоб засмічувати канал повідомленнями на кожен фрагмент. Фінальні медіа/помилки скасовують незавершені редагування попереднього перегляду й використовують звичайну доставку замість публікації тимчасового поста попереднього перегляду.

Увімкнення через `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Примітки:

- `partial` — звичайний вибір: один пост попереднього перегляду, який редагується в міру зростання відповіді, а потім фіналізується повною відповіддю.
- `block` використовує фрагменти чернетки у стилі додавання всередині поста попереднього перегляду.
- `progress` показує статусний попередній перегляд під час генерації та публікує фінальну відповідь лише після завершення.
- `off` вимикає preview streaming.
- Якщо потік не можна фіналізувати на місці (наприклад, якщо пост було видалено під час потоку), OpenClaw повертається до надсилання нового фінального поста, щоб відповідь ніколи не загубилася.
- Дані лише з reasoning приховуються з постів каналу, зокрема текст, що надходить як blockquote `> Reasoning:`. Установіть `/reasoning on`, щоб бачити thinking в інших поверхнях; фінальний пост Mattermost міститиме лише відповідь.
- Матрицю відповідності каналів див. у [Streaming](/uk/concepts/streaming#preview-streaming-modes).

## Реакції (інструмент message)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це id поста Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Установіть `remove=true` (boolean), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події в сесію агента, до якої виконується маршрутизація.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнення/вимкнення дій із реакціями (за замовчуванням true).
- Перевизначення для облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

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

Використовуйте `message action=send` з параметром `buttons`. Кнопки — це двовимірний масив (ряди кнопок):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Поля кнопок:

- `text` (обов’язково): підпис, що відображається.
- `callback_data` (обов’язково): значення, що надсилається назад при натисканні (використовується як ID дії).
- `style` (необов’язково): `"default"`, `"primary"` або `"danger"`.

Коли користувач натискає кнопку:

1. Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
2. Агент отримує вибір як вхідне повідомлення й відповідає.

Примітки:

- Callback-и кнопок використовують перевірку HMAC-SHA256 (автоматично, без додаткової конфігурації).
- Mattermost видаляє callback data зі своїх відповідей API (функція безпеки), тому після натискання
  видаляються всі кнопки — часткове видалення неможливе.
- ID дій, що містять дефіси або підкреслення, автоматично санітизуються
  (обмеження маршрутизації Mattermost).

Конфігурація:

- `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб
  увімкнути опис інструмента кнопок у системному prompt агента.
- `channels.mattermost.interactions.callbackBaseUrl`: необов’язковий зовнішній базовий URL для
  callback-ів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, якщо Mattermost не може
  напряму звернутися до Gateway за його bind host.
- У конфігураціях із кількома обліковими записами це саме поле також можна задати в
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw формує URL callback-у з
  `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
- Правило доступності: URL callback-у кнопки має бути доступний із сервера Mattermost.
  `localhost` працює лише тоді, коли Mattermost і OpenClaw запущені на тому самому хості/в тому самому мережевому просторі імен.
- Якщо ваша ціль callback-у є приватною/tailnet/internal, додайте її хост/домен до
  `ServiceSettings.AllowedUntrustedInternalConnections` у Mattermost.

### Пряма інтеграція API (зовнішні скрипти)

Зовнішні скрипти та Webhook можуть публікувати кнопки напряму через REST API Mattermost
замість використання інструмента `message` агента. За можливості використовуйте `buildButtonAttachments()` із
plugin; якщо надсилаєте необроблений JSON, дотримуйтеся цих правил:

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
            id: "mybutton01", // лише буквено-цифрові символи — див. нижче
            type: "button", // обов’язково, інакше натискання тихо ігноруються
            name: "Approve", // підпис, що відображається
            style: "primary", // необов’язково: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // має збігатися з id кнопки (для пошуку назви)
                action: "approve",
                // ... будь-які власні поля ...
                _token: "<hmac>", // див. розділ HMAC нижче
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

1. Attachments мають бути в `props.attachments`, а не у верхньорівневому `attachments` (інакше тихо ігноруються).
2. Кожна дія потребує `type: "button"` — без цього натискання тихо поглинаються.
3. Кожна дія потребує поле `id` — Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише буквено-цифровим** (`[a-zA-Z0-9]`). Дефіси та підкреслення ламають
   серверну маршрутизацію дій Mattermost (повертається 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб у повідомленні підтвердження показувалася
   назва кнопки (наприклад, "Approve"), а не сирий ID.
6. `context.action_id` є обов’язковим — без нього обробник взаємодій повертає 400.

**Генерація HMAC-токена:**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти повинні генерувати токени,
які відповідають логіці перевірки Gateway:

1. Виведіть секрет із токена бота:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Побудуйте об’єкт context з усіма полями **крім** `_token`.
3. Серіалізуйте з **відсортованими ключами** і **без пробілів** (Gateway використовує `JSON.stringify`
   з відсортованими ключами, що дає компактний вивід).
4. Підпишіть: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Додайте отриманий hex digest як `_token` у context.

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

Поширені помилки з HMAC:

- `json.dumps` у Python за замовчуванням додає пробіли (`{"key": "val"}`). Використовуйте
  `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
- Завжди підписуйте **всі** поля context (крім `_token`). Gateway прибирає `_token`, а потім
  підписує все, що залишилося. Підписування лише частини полів призводить до тихої помилки перевірки.
- Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може
  змінювати порядок полів context під час збереження payload.
- Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет
  має бути однаковим у процесі, що створює кнопки, і в Gateway, який їх перевіряє.

## Адаптер directory

Plugin Mattermost містить адаптер directory, який визначає імена каналів і користувачів
через API Mattermost. Це дає змогу використовувати цілі `#channel-name` і `@username` в
`openclaw message send` і доставках cron/Webhook.

Жодної конфігурації не потрібно — адаптер використовує токен бота з конфігурації облікового запису.

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

## Усунення несправностей

- Немає відповідей у каналах: переконайтеся, що бот є в каналі та його згадують (oncall), використовуйте префікс-тригер (onchar) або задайте `chatmode: "onmessage"`.
- Помилки автентифікації: перевірте токен бота, базовий URL і чи ввімкнено обліковий запис.
- Проблеми з кількома обліковими записами: змінні середовища застосовуються лише до облікового запису `default`.
- Вбудовані slash-команди повертають `Unauthorized: invalid command token.`: OpenClaw
  не прийняв токен callback-у. Типові причини:
  - реєстрація slash-команд не вдалася або лише частково завершилася під час запуску
  - callback потрапляє не в той Gateway/обліковий запис
  - у Mattermost усе ще є старі команди, що вказують на попередню ціль callback-у
  - Gateway перезапустився без повторної активації slash-команд
- Якщо вбудовані slash-команди перестали працювати, перевірте журнали на наявність
  `mattermost: failed to register slash commands` або
  `mattermost: native slash commands enabled but no commands could be registered`.
- Якщо `callbackUrl` пропущено й журнали попереджають, що callback визначився як
  `http://127.0.0.1:18789/...`, цей URL, імовірно, доступний лише тоді,
  коли Mattermost працює на тому самому хості/в тому самому мережевому просторі імен, що й OpenClaw. Задайте
  явний зовнішньо доступний `commands.callbackUrl`.
- Кнопки відображаються як білі прямокутники: агент може надсилати некоректні дані кнопок. Переконайтеся, що кожна кнопка має поля `text` і `callback_data`.
- Кнопки відображаються, але натискання нічого не роблять: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, а `EnablePostActionIntegration` у ServiceSettings має значення `true`.
- Кнопки повертають 404 при натисканні: `id` кнопки, імовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на небуквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
- У журналах Gateway є `invalid _token`: невідповідність HMAC. Переконайтеся, що ви підписуєте всі поля context (а не лише частину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
- У журналах Gateway є `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що його включено під час побудови payload integration.
- Підтвердження показує сирий ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Задайте обом однакове санітизоване значення.
- Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

## Пов’язані матеріали

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація приватних повідомлень і процес pairing
- [Groups](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення безпеки
