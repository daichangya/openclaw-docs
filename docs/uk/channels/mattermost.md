---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T06:42:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a87465c47c432ad5c6693ca3d2f992f211380a3fc5b602054b2a50d803b72c8
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Статус: вбудований plugin (токен бота + події WebSocket). Підтримуються канали, групи та приватні повідомлення.
Mattermost — це платформа командного обміну повідомленнями, яку можна розгорнути самостійно; відомості про продукт і завантаження див. на офіційному сайті
[mattermost.com](https://mattermost.com).

## Вбудований plugin

Mattermost постачається як вбудований plugin у поточних релізах OpenClaw, тому звичайним
пакетним збіркам не потрібне окреме встановлення.

Якщо у вас старіша збірка або власне встановлення без Mattermost,
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

1. Переконайтеся, що plugin Mattermost доступний.
   - Поточні пакетні релізи OpenClaw уже містять його в комплекті.
   - У старіших/кастомних встановленнях його можна додати вручну командами вище.
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

Власні slash-команди вмикаються за бажанням. Якщо їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через
Mattermost API і отримує callback POST-запити на HTTP-сервер Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Використовуйте, якщо Mattermost не може напряму дістатися до Gateway (зворотний проксі/публічна URL-адреса).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Примітки:

- `native: "auto"` типово вимкнено для Mattermost. Установіть `native: true`, щоб увімкнути.
- Якщо `callbackUrl` пропущено, OpenClaw формує її з хоста/порту Gateway + `callbackPath`.
- Для багатокористувацьких конфігурацій `commands` можна задавати на верхньому рівні або в
  `channels.mattermost.accounts.<id>.commands` (значення облікового запису мають пріоритет над полями верхнього рівня).
- Callback-и команд перевіряються за допомогою токенів для кожної команди, які повертає
  Mattermost, коли OpenClaw реєструє команди `oc_*`.
- Callback-и slash-команд працюють у режимі fail closed, якщо реєстрація не вдалася, запуск був частковим або
  токен callback-а не збігається з жодною із зареєстрованих команд.
- Вимога до доступності: endpoint callback-а має бути доступним із сервера Mattermost.
  - Не задавайте `callbackUrl` як `localhost`, якщо Mattermost не працює на тому самому хості/в тій самій мережевій області, що й OpenClaw.
  - Не задавайте `callbackUrl` як базову URL-адресу Mattermost, якщо ця URL-адреса не проксуює `/api/channels/mattermost/command` до OpenClaw у режимі reverse proxy.
  - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET-запит має повернути від OpenClaw `405 Method Not Allowed`, а не `404`.
- Вимога до allowlist вихідних з’єднань Mattermost:
  - Якщо ваш callback спрямовано на приватні/tailnet/internal адреси, задайте в Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити хост/домен callback-а.
  - Використовуйте записи хоста/домену, а не повні URL-адреси.
    - Добре: `gateway.tailnet-name.ts.net`
    - Погано: `https://gateway.tailnet-name.ts.net`

## Змінні середовища (обліковий запис за замовчуванням)

Задайте їх на хості Gateway, якщо віддаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Змінні середовища застосовуються лише до **облікового запису за замовчуванням** (`default`). Для інших облікових записів слід використовувати значення конфігурації.

## Режими чату

Mattermost автоматично відповідає на приватні повідомлення. Поведінка в каналах керується через `chatmode`:

- `oncall` (типово): відповідати в каналах лише за @згадки.
- `onmessage`: відповідати на кожне повідомлення в каналі.
- `onchar`: відповідати, коли повідомлення починається з префікса тригера.

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
- `channels.mattermost.requireMention` враховується для застарілих конфігурацій, але перевага надається `chatmode`.

## Потоки та сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати, чи відповіді в каналах і групах залишаються в
основному каналі, чи запускають потік під дописом, що ініціював взаємодію.

- `off` (типово): відповідати в потоці лише тоді, коли вхідний допис уже перебуває в ньому.
- `first`: для дописів верхнього рівня в каналі/групі запускати потік під цим дописом і маршрутизувати
  розмову до сесії в межах потоку.
- `all`: на сьогодні для Mattermost має ту саму поведінку, що й `first`.
- Приватні повідомлення ігнорують це налаштування та лишаються без потоків.

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

- Сесії в межах потоку використовують id допису, що ініціював взаємодію, як корінь потоку.
- `first` і `all` зараз еквівалентні, оскільки щойно Mattermost має корінь потоку,
  подальші фрагменти та медіа продовжують іти в тому самому потоці.

## Керування доступом (приватні повідомлення)

- Типово: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код pairing).
- Підтвердження через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні приватні повідомлення: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- Типово: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадки).
- Додавайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендуються ID користувачів).
- Перевизначення згадок для окремих каналів розміщуються в `channels.mattermost.groups.<channelId>.requireMention`
  або в `channels.mattermost.groups["*"].requireMention` як типове значення.
- Відповідність `@username` є змінною і вмикається лише тоді, коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (із вимогою згадки).
- Примітка щодо runtime: якщо `channels.mattermost` повністю відсутній, runtime використовує `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

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

Використовуйте ці формати цілей з `openclaw message send` або Cron/Webhook:

- `channel:<id>` для каналу
- `user:<id>` для приватного повідомлення
- `@username` для приватного повідомлення (визначається через Mattermost API)

Прості непрозорі ID (наприклад, `64ifufp...`) у Mattermost **неоднозначні** (ID користувача чи ID каналу).

OpenClaw визначає їх у порядку **спочатку користувач**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` виконується успішно), OpenClaw надсилає **приватне повідомлення**, визначаючи прямий канал через `/api/v4/channels/direct`.
- Інакше ID обробляється як **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).

## Повторні спроби DM-каналу

Коли OpenClaw надсилає повідомлення до цілі DM у Mattermost і спочатку має визначити прямий канал,
типово він повторює спроби при тимчасових збоях створення прямого каналу.

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

- Це застосовується лише до створення DM-каналу (`/api/v4/channels/direct`), а не до кожного виклику Mattermost API.
- Повторні спроби застосовуються до тимчасових збоїв, таких як обмеження швидкості, відповіді 5xx, а також мережеві помилки чи помилки тайм-ауту.
- Клієнтські помилки 4xx, крім `429`, вважаються постійними та не повторюються.

## Потокове попереднє відображення

Mattermost транслює хід міркувань, активність інструментів і частковий текст відповіді в один **чернетковий допис попереднього перегляду**, який завершується на місці, коли фінальну відповідь безпечно надсилати. Попередній перегляд оновлюється в межах того самого id допису, а не засмічує канал повідомленнями для кожного фрагмента. Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду й використовують звичайну доставку замість публікації тимчасового допису попереднього перегляду.

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

- `partial` — звичайний вибір: один допис попереднього перегляду, який редагується в міру зростання відповіді, а потім завершується повною відповіддю.
- `block` використовує фрагменти чернетки у стилі додавання всередині допису попереднього перегляду.
- `progress` показує попередній перегляд статусу під час генерації й публікує фінальну відповідь лише після завершення.
- `off` вимикає потокове попереднє відображення.
- Якщо потік неможливо завершити на місці (наприклад, якщо допис було видалено посеред потоку), OpenClaw повертається до надсилання нового фінального допису, щоб відповідь ніколи не була втрачена.
- Дані, що містять лише міркування, не потрапляють у дописи каналу, зокрема текст, який надходить як blockquote `> Reasoning:`. Установіть `/reasoning on`, щоб бачити міркування на інших поверхнях; у фінальному дописі Mattermost лишається тільки відповідь.
- Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці відображення каналів.

## Реакції (інструмент message)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це id допису Mattermost.
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

Використовуйте `message action=send` з параметром `buttons`. Кнопки — це двовимірний масив (рядки кнопок):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Поля кнопки:

- `text` (обов’язково): мітка для відображення.
- `callback_data` (обов’язково): значення, яке повертається при натисканні (використовується як ID дії).
- `style` (необов’язково): `"default"`, `"primary"` або `"danger"`.

Коли користувач натискає кнопку:

1. Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
2. Агент отримує вибір як вхідне повідомлення й відповідає.

Примітки:

- Callback-и кнопок використовують перевірку HMAC-SHA256 (автоматично, без додаткової конфігурації).
- Mattermost прибирає callback data зі своїх API-відповідей (функція безпеки), тому після натискання
  прибираються всі кнопки — часткове видалення неможливе.
- ID дій, що містять дефіси або підкреслення, автоматично санітизуються
  (обмеження маршрутизації Mattermost).

Конфігурація:

- `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб
  увімкнути опис інструмента кнопок у системному prompt агента.
- `channels.mattermost.interactions.callbackBaseUrl`: необов’язкова зовнішня базова URL-адреса для
  callback-ів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, якщо Mattermost не може
  напряму дістатися до Gateway за його bind host.
- У багатокористувацьких конфігураціях це саме поле також можна задати в
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw формує URL-адресу callback-а з
  `gateway.customBindHost` + `gateway.port`, а потім використовує резервний варіант `http://localhost:<port>`.
- Правило доступності: URL-адреса callback-а кнопок має бути доступною із сервера Mattermost.
  `localhost` працює лише тоді, коли Mattermost і OpenClaw працюють на тому самому хості/в тій самій мережевій області.
- Якщо ваша ціль callback-а є private/tailnet/internal, додайте її хост/домен до Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Пряма інтеграція API (зовнішні скрипти)

Зовнішні скрипти та Webhook можуть напряму публікувати кнопки через Mattermost REST API
замість використання інструмента `message` агента. За можливості використовуйте `buildButtonAttachments()` із
plugin; якщо публікуєте сирий JSON, дотримуйтеся цих правил:

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
            type: "button", // обов’язково, інакше натискання буде тихо проігноровано
            name: "Approve", // мітка для відображення
            style: "primary", // необов’язково: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // має збігатися з id кнопки (для визначення назви)
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

1. Attachments мають розміщуватися в `props.attachments`, а не у верхньорівневому `attachments` (інакше будуть тихо проігноровані).
2. Кожна дія потребує `type: "button"` — без цього натискання будуть тихо поглинуті.
3. Кожна дія потребує поля `id` — Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише буквено-цифровим** (`[a-zA-Z0-9]`). Дефіси та підкреслення ламають
   серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб у повідомленні підтвердження відображалася
   назва кнопки (наприклад, "Approve"), а не сирий ID.
6. `context.action_id` є обов’язковим — без нього обробник інтеракції повертає 400.

**Генерація HMAC-токена:**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени,
які збігаються з логікою перевірки Gateway:

1. Виведіть секрет із токена бота:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Зберіть об’єкт context з усіма полями **крім** `_token`.
3. Серіалізуйте з **відсортованими ключами** і **без пробілів** (Gateway використовує `JSON.stringify`
   з відсортованими ключами, що дає компактний вивід).
4. Підпишіть: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Додайте отриманий hex-digest як `_token` до context.

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

- `json.dumps` у Python типово додає пробіли (`{"key": "val"}`). Використовуйте
  `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
- Завжди підписуйте **всі** поля context (крім `_token`). Gateway видаляє `_token`, а потім
  підписує все, що залишилося. Підписування лише частини полів призводить до тихої помилки перевірки.
- Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може
  змінювати порядок полів context під час збереження payload.
- Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет
  має бути однаковим у процесі, який створює кнопки, і в Gateway, який їх перевіряє.

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який визначає назви каналів і користувачів
через Mattermost API. Це дає змогу використовувати цілі `#channel-name` і `@username` у
`openclaw message send` та доставках Cron/Webhook.

Додаткова конфігурація не потрібна — адаптер використовує токен бота з конфігурації облікового запису.

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

- Немає відповідей у каналах: переконайтеся, що бот є в каналі й його згадують (oncall), використовуйте префікс тригера (onchar) або задайте `chatmode: "onmessage"`.
- Помилки автентифікації: перевірте токен бота, базову URL-адресу та чи обліковий запис увімкнено.
- Проблеми з кількома обліковими записами: змінні середовища застосовуються лише до облікового запису `default`.
- Власні slash-команди повертають `Unauthorized: invalid command token.`: OpenClaw
  не прийняв токен callback-а. Типові причини:
  - реєстрація slash-команд не вдалася або була виконана лише частково під час запуску
  - callback надходить не до того Gateway/облікового запису
  - у Mattermost усе ще є старі команди, що вказують на попередню ціль callback-а
  - Gateway перезапустився без повторної активації slash-команд
- Якщо власні slash-команди перестали працювати, перевірте логи на наявність
  `mattermost: failed to register slash commands` або
  `mattermost: native slash commands enabled but no commands could be registered`.
- Якщо `callbackUrl` пропущено і логи попереджають, що callback визначився як
  `http://127.0.0.1:18789/...`, ця URL-адреса, ймовірно, доступна лише тоді,
  коли Mattermost працює на тому самому хості/в тій самій мережевій області, що й OpenClaw. Задайте
  натомість явний зовнішньо доступний `commands.callbackUrl`.
- Кнопки відображаються як білі прямокутники: агент може надсилати некоректні дані кнопок. Перевірте, що кожна кнопка має поля `text` і `callback_data`.
- Кнопки відображаються, але натискання нічого не робить: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, і що `EnablePostActionIntegration` має значення `true` у ServiceSettings.
- Кнопки повертають 404 при натисканні: `id` кнопки, імовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на небуквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
- У логах Gateway `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля context (а не лише частину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
- У логах Gateway `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що його включено під час побудови payload інтеграції.
- У підтвердженні відображається сирий ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Задайте для обох те саме санітизоване значення.
- Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація приватних повідомлень і процес pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
