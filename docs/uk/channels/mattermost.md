---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-21T20:11:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76a182ad26199f435de64edc27c888672964b711a7346f3ca539fba666695222
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Статус: вбудований Plugin (токен бота + події WebSocket). Підтримуються канали, групи та приватні повідомлення.
Mattermost — це платформа командного обміну повідомленнями, яку можна самостійно розгорнути; деталі про продукт і завантаження дивіться на офіційному сайті
[mattermost.com](https://mattermost.com).

## Вбудований Plugin

Mattermost постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайним
пакетованим збіркам не потрібне окреме встановлення.

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

Деталі: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що Plugin Mattermost доступний.
   - У поточних пакетованих випусках OpenClaw він уже вбудований.
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

## Вбудовані slash-команди

Вбудовані slash-команди є опційними. Якщо їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через
Mattermost API і отримує callback POST-запити на HTTP-сервері Gateway.

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
- Якщо `callbackUrl` пропущено, OpenClaw виводить його з хоста/порту Gateway + `callbackPath`.
- Для конфігурацій із кількома обліковими записами `commands` можна задати на верхньому рівні або в
  `channels.mattermost.accounts.<id>.commands` (значення облікового запису мають пріоритет над полями верхнього рівня).
- Callback-и команд перевіряються за токенами окремих команд, які повертає
  Mattermost, коли OpenClaw реєструє команди `oc_*`.
- Callback-и slash-команд відхиляються за принципом fail closed, якщо реєстрація не вдалася, запуск був частковим або
  токен callback-а не збігається з жодною із зареєстрованих команд.
- Вимога доступності: endpoint callback-а має бути доступний із сервера Mattermost.
  - Не встановлюйте `callbackUrl` на `localhost`, якщо Mattermost не працює на тому самому хості/в тому самому мережевому просторі імен, що й OpenClaw.
  - Не встановлюйте `callbackUrl` на базову URL-адресу Mattermost, якщо ця URL-адреса не reverse-proxy-ює `/api/channels/mattermost/command` до OpenClaw.
  - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET-запит має повертати `405 Method Not Allowed` від OpenClaw, а не `404`.
- Вимога allowlist вихідних з’єднань Mattermost:
  - Якщо ваш callback націлено на приватні/tailnet/внутрішні адреси, установіть у Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections`, щоб він містив хост/домен callback-а.
  - Використовуйте записи хоста/домену, а не повні URL-адреси.
    - Добре: `gateway.tailnet-name.ts.net`
    - Погано: `https://gateway.tailnet-name.ts.net`

## Змінні середовища (обліковий запис за замовчуванням)

Установіть їх на хості Gateway, якщо надаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Змінні середовища застосовуються лише до **облікового запису за замовчуванням** (`default`). Для інших облікових записів треба використовувати значення конфігурації.

## Режими чату

Mattermost автоматично відповідає на приватні повідомлення. Поведінка в каналах керується через `chatmode`:

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
- `channels.mattermost.requireMention` підтримується для застарілих конфігурацій, але рекомендовано `chatmode`.

## Потоки й сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в
основному каналі, чи запускають потік під дописом, який їх спричинив.

- `off` (типово): відповідати в потоці лише тоді, коли вхідний допис уже в потоці.
- `first`: для дописів верхнього рівня в каналі/групі запускати потік під цим дописом і спрямовувати
  розмову в сесію, прив’язану до потоку.
- `all`: наразі для Mattermost поводиться так само, як `first`.
- Приватні повідомлення ігнорують цей параметр і залишаються без потоків.

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

- Сесії з областю дії потоку використовують id допису, який його ініціював, як корінь потоку.
- `first` і `all` наразі еквівалентні, тому що щойно Mattermost має корінь потоку,
  наступні частини й медіа продовжують надсилатися в той самий потік.

## Керування доступом (приватні повідомлення)

- Типово: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код pairing).
- Схвалення через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні приватні повідомлення: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- Типово: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадки).
- Додавайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендовано ID користувачів).
- Перевизначення згадок для окремих каналів знаходяться в `channels.mattermost.groups.<channelId>.requireMention`
  або в `channels.mattermost.groups["*"].requireMention` як значення за замовчуванням.
- Зіставлення `@username` є змінним і ввімкнене лише коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
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

Використовуйте ці формати цілей із `openclaw message send` або Cron/Webhook:

- `channel:<id>` для каналу
- `user:<id>` для приватного повідомлення
- `@username` для приватного повідомлення (визначається через Mattermost API)

Прості непрозорі ID (наприклад, `64ifufp...`) у Mattermost **неоднозначні** (ID користувача чи ID каналу).

OpenClaw визначає їх у порядку **спочатку користувач**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` виконується успішно), OpenClaw надсилає **приватне повідомлення**, визначаючи прямий канал через `/api/v4/channels/direct`.
- Інакше ID вважається **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).

## Повторні спроби для каналу приватних повідомлень

Коли OpenClaw надсилає повідомлення до цілі приватних повідомлень Mattermost і спочатку має визначити прямий канал,
типово він повторює спроби в разі тимчасових збоїв створення прямого каналу.

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

- Це застосовується лише до створення каналу приватних повідомлень (`/api/v4/channels/direct`), а не до кожного виклику Mattermost API.
- Повторні спроби застосовуються до тимчасових збоїв, таких як обмеження швидкості, відповіді 5xx і мережеві помилки або помилки тайм-ауту.
- Помилки клієнта 4xx, окрім `429`, вважаються постійними й не повторюються.

## Попередній перегляд streaming

Mattermost передає thinking, активність інструментів і частковий текст відповіді в один **чорновий допис попереднього перегляду**, який фіналізується на місці, коли остаточну відповідь безпечно надсилати. Попередній перегляд оновлюється в тому самому id допису, а не засмічує канал повідомленнями для кожного фрагмента.

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

- `partial` — звичайний вибір: один допис попереднього перегляду, який редагується в міру зростання відповіді, а потім фіналізується повною відповіддю.
- `block` використовує чорнові фрагменти у стилі додавання всередині допису попереднього перегляду.
- `progress` показує попередній перегляд статусу під час генерації і публікує остаточну відповідь лише після завершення.
- `off` вимикає preview streaming.
- Якщо потік неможливо фіналізувати на місці (наприклад, якщо допис було видалено посеред потоку), OpenClaw повертається до надсилання нового остаточного допису, щоб відповідь ніколи не була втрачена.
- Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці зіставлення каналів.

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це id допису Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Установіть `remove=true` (boolean), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до сесії агента, до якої виконується маршрутизація.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнути/вимкнути дії реакцій (типово true).
- Перевизначення для облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

## Інтерактивні кнопки (інструмент повідомлень)

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

- `text` (обов’язково): мітка для відображення.
- `callback_data` (обов’язково): значення, яке повертається після натискання (використовується як ID дії).
- `style` (необов’язково): `"default"`, `"primary"` або `"danger"`.

Коли користувач натискає кнопку:

1. Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
2. Агент отримує вибір як вхідне повідомлення і відповідає.

Примітки:

- Callback-и кнопок використовують перевірку HMAC-SHA256 (автоматично, без додаткової конфігурації).
- Mattermost видаляє callback data зі своїх API-відповідей (функція безпеки), тому після натискання
  видаляються всі кнопки — часткове видалення неможливе.
- ID дій, які містять дефіси або підкреслення, автоматично санітизуються
  (обмеження маршрутизації Mattermost).

Конфігурація:

- `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб
  увімкнути опис інструмента кнопок у системному prompt агента.
- `channels.mattermost.interactions.callbackBaseUrl`: необов’язкова зовнішня базова URL-адреса для
  callback-ів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може
  напряму дістатися до Gateway за його bind host.
- У конфігураціях із кількома обліковими записами це саме поле також можна встановити в
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw виводить URL-адресу callback-а з
  `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
- Правило доступності: URL-адреса callback-а кнопок має бути доступна із сервера Mattermost.
  `localhost` працює лише тоді, коли Mattermost і OpenClaw працюють на тому самому хості/в тому самому мережевому просторі імен.
- Якщо ціль вашого callback-а є приватною/tailnet/внутрішньою, додайте її хост/домен до Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Пряма інтеграція з API (зовнішні скрипти)

Зовнішні скрипти та Webhook можуть публікувати кнопки безпосередньо через Mattermost REST API
замість використання інструмента `message` агента. За можливості використовуйте `buildButtonAttachments()` з
extension; якщо публікуєте сирий JSON, дотримуйтеся цих правил:

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
            name: "Approve", // мітка для відображення
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

**Критичні правила:**

1. Attachments розміщуються в `props.attachments`, а не у верхньорівневому `attachments` (інакше тихо ігноруються).
2. Для кожної дії потрібне `type: "button"` — без нього натискання тихо поглинаються.
3. Для кожної дії потрібне поле `id` — Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише буквено-цифровим** (`[a-zA-Z0-9]`). Дефіси й підкреслення ламають
   серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб у повідомленні підтвердження показувалася
   назва кнопки (наприклад, "Approve"), а не сирий ID.
6. `context.action_id` є обов’язковим — без нього обробник взаємодії повертає 400.

**Генерація HMAC-токена:**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени,
які збігаються з логікою перевірки Gateway:

1. Виведіть secret із токена бота:
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

- `json.dumps` у Python типово додає пробіли (`{"key": "val"}`). Використовуйте
  `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
- Завжди підписуйте **всі** поля context (без `_token`). Gateway видаляє `_token`, а потім
  підписує все, що залишилося. Підписування лише підмножини спричиняє тиху помилку перевірки.
- Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може
  змінювати порядок полів context під час збереження payload.
- Виводьте secret із токена бота (детерміновано), а не з випадкових байтів. Secret
  має бути однаковим у процесі, що створює кнопки, і в Gateway, який їх перевіряє.

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який визначає назви каналів і користувачів
через Mattermost API. Це дає змогу використовувати цілі `#channel-name` і `@username` у
`openclaw message send` та доставках Cron/Webhook.

Жодна конфігурація не потрібна — адаптер використовує токен бота з конфігурації облікового запису.

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
- Вбудовані slash-команди повертають `Unauthorized: invalid command token.`: OpenClaw
  не прийняв токен callback-а. Типові причини:
  - реєстрація slash-команд не вдалася або завершилася лише частково під час запуску
  - callback надходить до неправильного Gateway/облікового запису
  - Mattermost усе ще має старі команди, що вказують на попередню ціль callback-а
  - Gateway було перезапущено без повторної активації slash-команд
- Якщо вбудовані slash-команди перестали працювати, перевірте журнали на
  `mattermost: failed to register slash commands` або
  `mattermost: native slash commands enabled but no commands could be registered`.
- Якщо `callbackUrl` пропущено й журнали попереджають, що callback було визначено як
  `http://127.0.0.1:18789/...`, ця URL-адреса, імовірно, доступна лише коли
  Mattermost працює на тому самому хості/в тому самому мережевому просторі імен, що й OpenClaw. Натомість установіть
  явну зовні доступну `commands.callbackUrl`.
- Кнопки відображаються як білі прямокутники: агент може надсилати некоректні дані кнопок. Переконайтеся, що кожна кнопка має поля `text` і `callback_data`.
- Кнопки відображаються, але натискання нічого не роблять: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, а `EnablePostActionIntegration` у ServiceSettings має значення `true`.
- Після натискання кнопок повертається 404: `id` кнопки, імовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на небуквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
- У журналах Gateway є `invalid _token`: невідповідність HMAC. Переконайтеся, що ви підписуєте всі поля context (а не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
- У журналах Gateway є `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що воно включене під час побудови payload інтеграції.
- Підтвердження показує сирий ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Установіть однакове санітизоване значення для обох.
- Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

## Пов’язані матеріали

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація приватних повідомлень і потік pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та вимога згадки
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення безпеки
