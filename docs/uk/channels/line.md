---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Вам потрібно налаштувати вебхук і облікові дані LINE
    - Вам потрібні специфічні для LINE параметри повідомлень
summary: Налаштування, конфігурація та використання плагіна LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-05T17:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4782b2aa3e8654505d7f1fd6fc112adf125b5010fc84d655d033688ded37414
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE підключається до OpenClaw через LINE Messaging API. Плагін працює як приймач вебхуків на gateway і використовує ваш channel access token та channel secret для автентифікації.

Статус: вбудований плагін. Підтримуються прямі повідомлення, групові чати, медіа, локації, Flex messages, template messages і quick replies. Реакції та ланцюжки не підтримуються.

## Вбудований плагін

LINE постачається як вбудований плагін у поточних випусках OpenClaw, тому звичайним пакетним збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або власне встановлення без LINE, установіть його вручну:

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
5. Установіть URL вебхука на кінцеву точку вашого gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на перевірку вебхука LINE (GET) і вхідні події (POST).
Якщо вам потрібен власний шлях, установіть `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- Перевірка підпису LINE залежить від тіла запиту (HMAC від сирого тіла), тому OpenClaw застосовує суворі ліміти тіла до автентифікації та тайм-аут перед перевіркою.
- OpenClaw обробляє події вебхука з перевірених сирих байтів запиту. Значення `req.body`, змінені проміжним middleware, ігноруються задля безпеки цілісності підпису.

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

Змінні середовища (лише для типового облікового запису):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Файли token/secret:

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

`tokenFile` і `secretFile` мають указувати на звичайні файли. Символічні посилання відхиляються.

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

Для прямих повідомлень типовим є парування. Невідомі відправники отримують код парування, а їхні повідомлення ігноруються до схвалення.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки дозволених і політики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: дозволені LINE user ID для DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: дозволені LINE user ID для груп
- Перевизначення для окремих груп: `channels.line.groups.<groupId>.allowFrom`
- Примітка щодо runtime: якщо `channels.line` повністю відсутній, runtime для перевірок груп повертається до `groupPolicy="allowlist"` (навіть якщо задано `channels.defaults.groupPolicy`).

ID LINE чутливі до регістру. Приклади коректних ID:

- Користувач: `U` + 32 hex chars
- Група: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Поведінка повідомлень

- Текст розбивається на частини по 5000 символів.
- Форматування Markdown видаляється; блоки коду й таблиці за можливості перетворюються на Flex cards.
- Потокові відповіді буферизуються; LINE отримує повні частини з анімацією завантаження, поки агент працює.
- Завантаження медіа обмежуються `channels.line.mediaMaxMb` (типово 10).

## Дані каналу (розширені повідомлення)

Використовуйте `channelData.line`, щоб надсилати quick replies, локації, Flex cards або template messages.

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

Плагін LINE також постачається з командою `/card` для попередньо налаштованих Flex messages:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує прив’язки розмов ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний чат LINE до сесії ACP без створення дочірнього ланцюжка.
- Налаштовані прив’язки ACP і активні ACP-сесії, прив’язані до розмов, працюють у LINE так само, як і в інших каналах розмов.

Докладніше див. у [ACP agents](/tools/acp-agents).

## Вихідні медіа

Плагін LINE підтримує надсилання зображень, відео та аудіофайлів через інструмент повідомлень агента. Медіа надсилаються через специфічний для LINE шлях доставки з належною обробкою попереднього перегляду та відстеження:

- **Зображення**: надсилаються як повідомлення-зображення LINE з автоматичним створенням попереднього перегляду.
- **Відео**: надсилаються з явною обробкою попереднього перегляду й content-type.
- **Аудіо**: надсилаються як аудіоповідомлення LINE.

Загальні надсилання медіа повертаються до наявного маршруту лише для зображень, якщо специфічний для LINE шлях недоступний.

## Усунення проблем

- **Перевірка вебхука не проходить:** переконайтеся, що URL вебхука використовує HTTPS і що `channelSecret` збігається з налаштуваннями в консолі LINE.
- **Немає вхідних подій:** переконайтеся, що шлях вебхука збігається з `channels.line.webhookPath` і що gateway доступний для LINE.
- **Помилки завантаження медіа:** збільште `channels.line.mediaMaxMb`, якщо медіа перевищує типове обмеження.

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Парування](/channels/pairing) — автентифікація DM і потік парування
- [Групи](/channels/groups) — поведінка групового чату й перевірка згадки
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та зміцнення безпеки
