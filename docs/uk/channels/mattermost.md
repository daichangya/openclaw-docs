---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T01:34:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Статус: вбудований Plugin (токен бота + події WebSocket). Підтримуються канали, групи та приватні повідомлення.
Mattermost — це команда платформа обміну повідомленнями, яку можна самостійно розгорнути; докладніше про продукт і завантаження дивіться на офіційному сайті
[mattermost.com](https://mattermost.com).

## Вбудований Plugin

Mattermost постачається як вбудований Plugin у поточних релізах OpenClaw, тому звичайним
пакетним збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або спеціальне встановлення без Mattermost,
встановіть його вручну:

Встановлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що Plugin Mattermost доступний.
   - У поточних пакетних релізах OpenClaw він уже вбудований.
   - У старіших/спеціальних встановленнях його можна додати вручну командами вище.
2. Створіть обліковий запис бота Mattermost і скопіюйте **токен бота**.
3. Скопіюйте **базову URL-адресу** Mattermost (наприклад, `https://chat.example.com`).
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

## Власні slash-команди

Власні slash-команди є необов’язковими. Коли їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через
API Mattermost і отримує callback POST-запити на HTTP-сервері Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Використовуйте, коли Mattermost не може напряму дістатися до Gateway (reverse proxy/публічна URL-адреса).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Примітки:

- `native: "auto"` типово вимкнено для Mattermost. Установіть `native: true`, щоб увімкнути.
- Якщо `callbackUrl` не вказано, OpenClaw формує його на основі host/port Gateway + `callbackPath`.
- Для багатoоблікових конфігурацій `commands` можна задати на верхньому рівні або в
  `channels.mattermost.accounts.<id>.commands` (значення облікового запису мають пріоритет над полями верхнього рівня).
- Command callback-и перевіряються за допомогою токенів для кожної команди, які
  Mattermost повертає, коли OpenClaw реєструє команди `oc_*`.
- Callback-и slash-команд закриваються з відмовою, якщо реєстрація не вдалася, запуск був частковим або
  callback token не збігається з одним із зареєстрованих команд.
- Вимога доступності: endpoint callback-ів має бути доступним із сервера Mattermost.
  - Не вказуйте `callbackUrl` як `localhost`, якщо Mattermost не працює на тому ж host/namespace мережі, що й OpenClaw.
  - Не вказуйте `callbackUrl` як базову URL-адресу Mattermost, якщо ця URL-адреса не reverse-proxy-ює `/api/channels/mattermost/command` до OpenClaw.
  - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET має повертати `405 Method Not Allowed` від OpenClaw, а не `404`.
- Вимога allowlist вихідних підключень Mattermost:
  - Якщо ваш callback спрямовано на private/tailnet/internal-адреси, налаштуйте в Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити host/domain callback-а.
  - Використовуйте записи host/domain, а не повні URL-адреси.
    - Правильно: `gateway.tailnet-name.ts.net`
    - Неправильно: `https://gateway.tailnet-name.ts.net`

## Змінні середовища (обліковий запис за замовчуванням)

Установіть їх на host Gateway, якщо віддаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Змінні середовища застосовуються лише до **облікового запису за замовчуванням** (`default`). Для інших облікових записів потрібно використовувати значення з конфігурації.

## Режими чату

Mattermost автоматично відповідає на приватні повідомлення. Поведінка в каналах керується параметром `chatmode`:

- `oncall` (типово): відповідати в каналах лише за @згадки.
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
- `channels.mattermost.requireMention` враховується для застарілих конфігурацій, але рекомендовано `chatmode`.

## Гілки та сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в
основному каналі, чи запускають гілку під повідомленням, яке їх спричинило.

- `off` (типово): відповідати в гілці лише тоді, коли вхідне повідомлення вже в ній.
- `first`: для повідомлень верхнього рівня в каналі/групі запускати гілку під цим повідомленням і спрямовувати
  розмову до сесії, прив’язаної до гілки.
- `all`: наразі для Mattermost поводиться так само, як `first`.
- Для прямих повідомлень цей параметр ігнорується, і вони залишаються поза гілками.

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

- Сесії, прив’язані до гілки, використовують id повідомлення-тригера як корінь гілки.
- `first` і `all` зараз еквівалентні, тому що щойно в Mattermost з’являється корінь гілки,
  подальші фрагменти та медіа продовжуються в тій самій гілці.

## Керування доступом (приватні повідомлення)

- Типово: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код pairing).
- Схвалення через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні приватні повідомлення: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- Типово: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадки).
- Додавайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендовано ID користувачів).
- Перевизначення згадок для окремих каналів розміщуються в `channels.mattermost.groups.<channelId>.requireMention`
  або в `channels.mattermost.groups["*"].requireMention` як типове значення.
- Відповідність `@username` є змінною та вмикається лише за `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (із вимогою згадки).
- Примітка щодо runtime: якщо `channels.mattermost` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

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

Використовуйте ці формати цілей із `openclaw message send` або cron/webhooks:

- `channel:<id>` для каналу
- `user:<id>` для приватного повідомлення
- `@username` для приватного повідомлення (визначається через API Mattermost)

Прості непрозорі ID (як-от `64ifufp...`) у Mattermost **неоднозначні** (ID користувача чи ID каналу).

OpenClaw визначає їх у порядку **спочатку користувач**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` виконується успішно), OpenClaw надсилає **приватне повідомлення**, визначаючи прямий канал через `/api/v4/channels/direct`.
- Інакше ID трактується як **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).

## Повторні спроби для DM-каналу

Коли OpenClaw надсилає повідомлення до цілі Mattermost DM і спочатку має визначити прямий канал,
типово він повторює спроби у разі тимчасових збоїв створення прямого каналу.

Використовуйте `channels.mattermost.dmChannelRetry`, щоб налаштувати цю поведінку глобально для Plugin Mattermost,
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
- Повторні спроби застосовуються до тимчасових збоїв, як-от обмеження частоти, відповіді 5xx та помилки мережі або тайм-аути.
- Клієнтські помилки 4xx, окрім `429`, вважаються постійними й не повторюються.

## Потокове попереднє відображення

Mattermost передає thinking, активність інструментів і частковий текст відповіді в одному **чернетковому повідомленні попереднього перегляду**, яке фіналізується на місці, коли остаточну відповідь безпечно надсилати. Попередній перегляд оновлюється в межах того самого id повідомлення, замість того щоб засмічувати канал повідомленнями на кожен фрагмент. Остаточні повідомлення з медіа/помилками скасовують відкладені редагування попереднього перегляду й використовують звичайну доставку замість публікації одноразового повідомлення попереднього перегляду.

Увімкніть через `channels.mattermost.streaming`:

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

- `partial` — звичний вибір: одне повідомлення попереднього перегляду, яке редагується в міру зростання відповіді, а потім фіналізується повною відповіддю.
- `block` використовує чернеткові фрагменти у стилі додавання в межах повідомлення попереднього перегляду.
- `progress` показує статусне попереднє повідомлення під час генерації й публікує остаточну відповідь лише після завершення.
- `off` вимикає потокове попереднє відображення.
- Якщо потік неможливо фіналізувати на місці (наприклад, якщо повідомлення було видалено посеред потоку), OpenClaw повертається до надсилання нового остаточного повідомлення, щоб відповідь ніколи не була втрачена.
- Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці відповідності каналів.

## Реакції (інструмент message)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це id повідомлення Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Установіть `remove=true` (boolean), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до сесії агента за маршрутом.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнення/вимкнення дій із реакціями (типово true).
- Перевизначення для окремого облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

## Інтерактивні кнопки (інструмент message)

Надсилайте повідомлення з кнопками, на які можна натискати. Коли користувач натискає кнопку, агент отримує
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
- `callback_data` (обов’язково): значення, яке надсилається назад при натисканні (використовується як ID дії).
- `style` (необов’язково): `"default"`, `"primary"` або `"danger"`.

Коли користувач натискає кнопку:

1. Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
2. Агент отримує вибір як вхідне повідомлення й відповідає.

Примітки:

- Callback-и кнопок використовують перевірку HMAC-SHA256 (автоматично, конфігурація не потрібна).
- Mattermost прибирає callback data зі своїх відповідей API (функція безпеки), тому всі кнопки
  видаляються після натискання — часткове видалення неможливе.
- ID дій, що містять дефіси або підкреслення, автоматично санітизуються
  (обмеження маршрутизації Mattermost).

Конфігурація:

- `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб
  увімкнути опис інструмента кнопок у системному prompt агента.
- `channels.mattermost.interactions.callbackBaseUrl`: необов’язкова зовнішня базова URL-адреса для
  callback-ів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може
  напряму дістатися до Gateway за його bind host.
- У багатoоблікових конфігураціях те саме поле також можна вказати в
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Якщо `interactions.callbackBaseUrl` не вказано, OpenClaw формує callback URL на основі
  `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
- Правило доступності: URL callback-ів кнопок має бути доступним із сервера Mattermost.
  `localhost` працює лише тоді, коли Mattermost і OpenClaw працюють на одному host/namespace мережі.
- Якщо ваша ціль callback-а є private/tailnet/internal, додайте її host/domain до Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Пряма інтеграція з API (зовнішні скрипти)

Зовнішні скрипти та Webhook-и можуть публікувати кнопки безпосередньо через REST API Mattermost
замість використання інструмента `message` агента. За можливості використовуйте `buildButtonAttachments()` з
розширення; якщо публікуєте сирий JSON, дотримуйтеся таких правил:

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
            type: "button", // обов’язково, інакше натискання буде мовчки проігноровано
            name: "Approve", // мітка для відображення
            style: "primary", // необов’язково: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // має збігатися з id кнопки (для пошуку назви)
                action: "approve",
                // ... будь-які користувацькі поля ...
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

1. Attachments мають бути в `props.attachments`, а не у верхньорівневому `attachments` (інакше їх буде мовчки проігноровано).
2. Кожна дія потребує `type: "button"` — без цього натискання будуть мовчки проковтнуті.
3. Кожна дія потребує поля `id` — Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише буквено-цифровим** (`[a-zA-Z0-9]`). Дефіси та підкреслення ламають
   серверну маршрутизацію дій у Mattermost (повертається 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб у повідомленні підтвердження показувалася
   назва кнопки (наприклад, "Approve"), а не сирий ID.
6. `context.action_id` є обов’язковим — без нього обробник взаємодій повертає 400.

**Генерація HMAC-токена:**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени,
які відповідають логіці перевірки Gateway:

1. Виведіть секрет із токена бота:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Побудуйте об’єкт context з усіма полями **крім** `_token`.
3. Серіалізуйте його з **відсортованими ключами** і **без пробілів** (Gateway використовує `JSON.stringify`
   з відсортованими ключами, що дає компактний вивід).
4. Підпишіть: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Додайте отриманий hex-digest як `_token` у context.

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

Поширені пастки HMAC:

- `json.dumps` у Python типово додає пробіли (`{"key": "val"}`). Використовуйте
  `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
- Завжди підписуйте **всі** поля context (без `_token`). Gateway прибирає `_token`, а потім
  підписує все, що залишилося. Підписування підмножини спричиняє мовчазний збій перевірки.
- Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може
  змінювати порядок полів context під час збереження payload.
- Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет
  має бути однаковим у процесі, що створює кнопки, і в Gateway, який їх перевіряє.

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який визначає назви каналів і користувачів
через API Mattermost. Це дає змогу використовувати цілі `#channel-name` і `@username` у
`openclaw message send` та доставках cron/Webhook.

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

## Усунення несправностей

- Немає відповідей у каналах: переконайтеся, що бот є в каналі, і згадайте його (oncall), використайте префікс-тригер (onchar) або встановіть `chatmode: "onmessage"`.
- Помилки автентифікації: перевірте токен бота, базову URL-адресу та чи ввімкнено обліковий запис.
- Проблеми з кількома обліковими записами: змінні середовища застосовуються лише до облікового запису `default`.
- Власні slash-команди повертають `Unauthorized: invalid command token.`: OpenClaw
  не прийняв callback token. Типові причини:
  - реєстрація slash-команд не вдалася або була завершена лише частково під час запуску
  - callback надходить до неправильного Gateway/облікового запису
  - Mattermost досі має старі команди, що вказують на попередню ціль callback-а
  - Gateway перезапустився без повторної активації slash-команд
- Якщо власні slash-команди перестали працювати, перевірте логи на наявність
  `mattermost: failed to register slash commands` або
  `mattermost: native slash commands enabled but no commands could be registered`.
- Якщо `callbackUrl` не вказано і в логах є попередження, що callback визначився як
  `http://127.0.0.1:18789/...`, ця URL-адреса, ймовірно, доступна лише тоді,
  коли Mattermost працює на тому самому host/namespace мережі, що й OpenClaw. Установіть
  явний зовнішньо доступний `commands.callbackUrl`.
- Кнопки відображаються як білі прямокутники: агент може надсилати некоректні дані кнопок. Переконайтеся, що кожна кнопка має поля `text` і `callback_data`.
- Кнопки відображаються, але натискання нічого не робить: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, а `EnablePostActionIntegration` у ServiceSettings має значення `true`.
- Кнопки повертають 404 при натисканні: `id` кнопки, імовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на небуквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
- У логах Gateway є `invalid _token`: невідповідність HMAC. Переконайтеся, що ви підписуєте всі поля context (а не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
- У логах Gateway є `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що його включено під час побудови payload інтеграції.
- У підтвердженні показується сирий ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Установіть для обох однакове санітизоване значення.
- Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація приватних повідомлень і потік pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та вимога згадки
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення захисту
