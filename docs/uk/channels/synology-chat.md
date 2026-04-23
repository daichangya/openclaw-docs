---
read_when:
    - Налаштування Synology Chat з OpenClaw
    - Налагодження маршрутизації Webhook Synology Chat
summary: Налаштування Webhook Synology Chat і конфігурація OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T07:10:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: dda0d5d11e2526f4813b69ca914a63231003eb60d8bc2e1f030bcb3d77c8eda0
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Статус: bundled plugin каналу прямих повідомлень, що використовує Webhook Synology Chat.
Plugin приймає вхідні повідомлення з вихідних Webhook Synology Chat і надсилає відповіді
через вхідний Webhook Synology Chat.

## Bundled plugin

Synology Chat постачається як bundled plugin у поточних релізах OpenClaw, тому звичайні
пакетні збірки не потребують окремого встановлення.

Якщо у вас старіша збірка або користувацьке встановлення без Synology Chat,
встановіть його вручну:

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що Plugin Synology Chat доступний.
   - Поточні пакетні релізи OpenClaw уже містять його.
   - Старіші/користувацькі встановлення можуть додати його вручну з checkout вихідного коду командою вище.
   - `openclaw onboard` тепер показує Synology Chat у тому самому списку налаштування каналів, що й `openclaw channels add`.
   - Неінтерактивне налаштування: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. В інтеграціях Synology Chat:
   - Створіть вхідний Webhook і скопіюйте його URL.
   - Створіть вихідний Webhook зі своїм секретним токеном.
3. Спрямуйте URL вихідного Webhook на ваш Gateway OpenClaw:
   - `https://gateway-host/webhook/synology` за замовчуванням.
   - Або ваш власний `channels.synology-chat.webhookPath`.
4. Завершіть налаштування в OpenClaw.
   - Покроково: `openclaw onboard`
   - Напряму: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустіть Gateway і надішліть DM боту Synology Chat.

Деталі автентифікації Webhook:

- OpenClaw приймає токен вихідного Webhook з `body.token`, потім
  `?token=...`, а потім із заголовків.
- Підтримувані форми заголовків:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Порожні або відсутні токени відхиляються за принципом fail-closed.

Мінімальна конфігурація:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Змінні середовища

Для облікового запису за замовчуванням можна використовувати змінні середовища:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (розділені комами)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Значення конфігурації мають пріоритет над змінними середовища.

<Note>
`SYNOLOGY_CHAT_INCOMING_URL` входить до списку заблокованих endpoint-ів і не може бути встановлений
з файлу `.env` робочого простору. Він має надходити з shell-середовища або
середовища процесу Gateway, щоб ненадійні робочі простори не могли перенаправити
трафік Synology Chat на інший Webhook. Повний список див. у
[Workspace `.env` files](/uk/gateway/security).
</Note>

## Політика DM і контроль доступу

- `dmPolicy: "allowlist"` — рекомендоване значення за замовчуванням.
- `allowedUserIds` приймає список (або рядок, розділений комами) ID користувачів Synology.
- У режимі `allowlist` порожній список `allowedUserIds` вважається неправильною конфігурацією, і маршрут Webhook не буде запущено (для дозволу всім використовуйте `dmPolicy: "open"`).
- `dmPolicy: "open"` дозволяє будь-якого відправника.
- `dmPolicy: "disabled"` блокує DM.
- Прив’язка одержувача відповіді за замовчуванням ґрунтується на стабільному числовому `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає пошук за змінним username/nickname для доставки відповідей.
- Підтвердження pairing працює з:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Вихідна доставка

Використовуйте числові ID користувачів Synology Chat як цілі.

Приклади:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Надсилання медіа підтримується через доставку файлів за URL.
URL вихідних файлів мають використовувати `http` або `https`, а приватні чи іншим чином заблоковані мережеві цілі відхиляються до того, як OpenClaw передасть URL до Webhook NAS.

## Кілька облікових записів

Підтримується кілька облікових записів Synology Chat у `channels.synology-chat.accounts`.
Кожен обліковий запис може перевизначати token, incoming URL, webhook path, політику DM та ліміти.
Сесії прямих повідомлень ізольовані для кожного облікового запису та користувача, тож однаковий числовий `user_id`
у двох різних облікових записах Synology не ділить стан транскрипту.
Надайте кожному ввімкненому обліковому запису окремий `webhookPath`. OpenClaw тепер відхиляє дублікати точних шляхів
і відмовляється запускати іменовані облікові записи, які лише успадковують спільний webhook path у багатoоблікових конфігураціях.
Якщо вам навмисно потрібне застаріле успадкування для іменованого облікового запису, установіть
`dangerouslyAllowInheritedWebhookPath: true` для цього облікового запису або в `channels.synology-chat`,
але дублікати точних шляхів усе одно відхиляються за принципом fail-closed. Надавайте перевагу явним шляхам для кожного облікового запису.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Примітки щодо безпеки

- Тримайте `token` у секреті та змініть його, якщо він був розкритий.
- Залишайте `allowInsecureSsl: false`, якщо тільки ви явно не довіряєте локальному сертифікату NAS із самопідписом.
- Вхідні запити Webhook перевіряються за токеном і мають rate limit для кожного відправника.
- Перевірки недійсного токена використовують порівняння секретів у сталий час і працюють за принципом fail-closed.
- Для production надавайте перевагу `dmPolicy: "allowlist"`.
- Не вмикайте `dangerouslyAllowNameMatching`, якщо тільки вам явно не потрібна застаріла доставка відповідей на основі username.
- Не вмикайте `dangerouslyAllowInheritedWebhookPath`, якщо тільки ви явно не приймаєте ризик маршрутизації через спільний path у багатoобліковій конфігурації.

## Усунення несправностей

- `Missing required fields (token, user_id, text)`:
  - у payload вихідного Webhook відсутнє одне з обов’язкових полів
  - якщо Synology надсилає токен у заголовках, переконайтеся, що Gateway/proxy зберігає ці заголовки
- `Invalid token`:
  - секрет вихідного Webhook не збігається з `channels.synology-chat.token`
  - запит потрапляє не до того облікового запису/шляху webhook
  - reverse proxy видалив заголовок токена до того, як запит досяг OpenClaw
- `Rate limit exceeded`:
  - забагато спроб із недійсним токеном з одного джерела можуть тимчасово заблокувати це джерело
  - для автентифікованих відправників також діє окремий rate limit повідомлень на користувача
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - увімкнено `dmPolicy="allowlist"`, але користувачів не налаштовано
- `User not authorized`:
  - числовий `user_id` відправника відсутній у `allowedUserIds`

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Groups](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та зміцнення безпеки
