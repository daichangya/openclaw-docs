---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Вам потрібно налаштувати Webhook LINE і облікові дані
    - Вам потрібні параметри повідомлень, специфічні для LINE
summary: Налаштування, конфігурація та використання Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-22T00:50:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює як отримувач webhook
на Gateway і використовує ваш токен доступу каналу та секрет каналу для
автентифікації.

Статус: вбудований plugin. Підтримуються особисті повідомлення, групові чати, медіа, локації, Flex
повідомлення, шаблонні повідомлення та швидкі відповіді. Реакції та треди
не підтримуються.

## Вбудований plugin

LINE постачається як вбудований plugin у поточних релізах OpenClaw, тому звичайні
пакетовані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або спеціальне встановлення, яке не включає LINE, встановіть його
вручну:

```bash
openclaw plugins install @openclaw/line
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Налаштування

1. Створіть обліковий запис LINE Developers і відкрийте Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Створіть (або виберіть) Provider і додайте канал **Messaging API**.
3. Скопіюйте **Channel access token** і **Channel secret** з налаштувань каналу.
4. Увімкніть **Use webhook** у налаштуваннях Messaging API.
5. Встановіть URL webhook на endpoint вашого Gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку webhook LINE (GET) і вхідні події (POST).
Якщо вам потрібен власний шлях, установіть `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC для сирого тіла), тому OpenClaw застосовує суворі обмеження розміру тіла до автентифікації та тайм-аут перед перевіркою.
- OpenClaw обробляє події webhook із перевірених сирих байтів запиту. Значення `req.body`, змінені upstream middleware, ігноруються задля безпеки цілісності підпису.

## Конфігурація

Мінімальна конфігурація:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Змінні середовища (лише обліковий запис за замовчуванням):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Файли токена/секрету:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` і `secretFile` мають вказувати на звичайні файли. Символічні посилання не допускаються.

Кілька облікових записів:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Керування доступом

Для особистих повідомлень за замовчуванням використовується pairing. Невідомі відправники отримують код pairing, а їхні
повідомлення ігноруються, доки їх не буде схвалено.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволу та політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user ID у списку дозволених для особистих повідомлень
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user ID у списку дозволених для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom`
- Примітка щодо runtime: якщо `channels.line` повністю відсутній, runtime використовує `groupPolicy="allowlist"` для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

LINE ID чутливі до регістру. Коректні ID мають такий вигляд:

- Користувач: `U` + 32 hex-символи
- Група: `C` + 32 hex-символи
- Кімната: `R` + 32 hex-символи

## Поведінка повідомлень

- Текст розбивається на частини по 5000 символів.
- Форматування Markdown прибирається; блоки коду та таблиці за можливості перетворюються на Flex
  картки.
- Потокові відповіді буферизуються; LINE отримує повні фрагменти з анімацією
  завантаження, поки агент працює.
- Завантаження медіа обмежуються параметром `channels.line.mediaMaxMb` (типове значення — 10).

## Дані каналу (насичені повідомлення)

Використовуйте `channelData.line`, щоб надсилати швидкі відповіді, локації, Flex-картки або шаблонні
повідомлення.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE також постачається з командою `/card` для preset-ів Flex повідомлень:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язки розмов ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сесії ACP без створення дочірнього треду.
- Налаштовані прив’язки ACP і активні ACP-сесії, прив’язані до розмов, працюють у LINE так само, як і в інших каналах розмов.

Докладніше див. у [ACP agents](/uk/tools/acp-agents).

## Вихідні медіа

Plugin LINE підтримує надсилання зображень, відео та аудіофайлів через інструмент повідомлень агента. Медіа надсилаються через специфічний для LINE шлях доставки з належною обробкою preview і відстеження:

- **Зображення**: надсилаються як повідомлення-зображення LINE з автоматичним створенням preview.
- **Відео**: надсилаються з явною обробкою preview і content-type.
- **Аудіо**: надсилаються як аудіоповідомлення LINE.

URL вихідних медіа мають бути публічними HTTPS URL. OpenClaw перевіряє цільове ім’я хоста перед передачею URL до LINE і відхиляє цілі local loopback, link-local та приватної мережі.

Загальне надсилання медіа повертається до наявного маршруту лише для зображень, якщо специфічний для LINE шлях недоступний.

## Усунення проблем

- **Не вдається пройти перевірку webhook:** переконайтеся, що URL webhook використовує HTTPS і
  `channelSecret` збігається з налаштуванням у LINE console.
- **Немає вхідних подій:** переконайтеся, що шлях webhook збігається з `channels.line.webhookPath`
  і що Gateway доступний з LINE.
- **Помилки завантаження медіа:** збільште `channels.line.mediaMaxMb`, якщо медіа перевищує
  типове обмеження.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація особистих повідомлень і процес pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
