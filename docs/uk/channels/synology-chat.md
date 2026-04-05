---
read_when:
    - Налаштування Synology Chat з OpenClaw
    - Налагодження маршрутизації webhook Synology Chat
summary: Налаштування webhook Synology Chat і конфігурація OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-05T17:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb25fc6b53f896f15f43b4936d69ea071a29a91838a5b662819377271e89d81
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Стан: вбудований плагін каналу прямих повідомлень, що використовує webhook Synology Chat.
Плагін приймає вхідні повідомлення з вихідних webhook Synology Chat і надсилає відповіді
через вхідний webhook Synology Chat.

## Вбудований плагін

Synology Chat постачається як вбудований плагін у поточних випусках OpenClaw, тому звичайні
зібрані збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або нестандартне встановлення без Synology Chat,
установіть його вручну:

Установлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Докладніше: [Плагіни](/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що плагін Synology Chat доступний.
   - Поточні зібрані випуски OpenClaw уже містять його в комплекті.
   - У старіших/нестандартних установленнях його можна додати вручну з checkout вихідного коду за допомогою наведеної вище команди.
   - `openclaw onboard` тепер показує Synology Chat у тому самому списку налаштування каналів, що й `openclaw channels add`.
   - Неінтерактивне налаштування: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. В інтеграціях Synology Chat:
   - Створіть вхідний webhook і скопіюйте його URL.
   - Створіть вихідний webhook із вашим секретним токеном.
3. Спрямуйте URL вихідного webhook на ваш gateway OpenClaw:
   - Типово: `https://gateway-host/webhook/synology`.
   - Або ваш власний `channels.synology-chat.webhookPath`.
4. Завершіть налаштування в OpenClaw.
   - Покроково: `openclaw onboard`
   - Напряму: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустіть gateway і надішліть приватне повідомлення боту Synology Chat.

Деталі автентифікації webhook:

- OpenClaw приймає токен вихідного webhook із `body.token`, потім
  `?token=...`, потім із заголовків.
- Підтримувані форми заголовків:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Порожні або відсутні токени блокуються за принципом fail-closed.

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
- `SYNOLOGY_ALLOWED_USER_IDS` (через кому)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Значення з конфігурації мають пріоритет над змінними середовища.

## Політика приватних повідомлень і керування доступом

- `dmPolicy: "allowlist"` — рекомендоване типове значення.
- `allowedUserIds` приймає список (або рядок, розділений комами) ідентифікаторів користувачів Synology.
- У режимі `allowlist` порожній список `allowedUserIds` вважається помилкою конфігурації, і маршрут webhook не запускатиметься (використовуйте `dmPolicy: "open"` для дозволу всім).
- `dmPolicy: "open"` дозволяє будь-якого відправника.
- `dmPolicy: "disabled"` блокує приватні повідомлення.
- Прив’язка одержувача відповіді типово залишається на стабільному числовому `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — це аварійний режим сумісності, який знову вмикає пошук за змінним іменем користувача/псевдонімом для доставки відповіді.
- Підтвердження прив’язки працюють із:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Вихідна доставка

Використовуйте числові ідентифікатори користувачів Synology Chat як цілі.

Приклади:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Підтримується надсилання медіа через доставку файлів за URL.

## Кілька облікових записів

Підтримуються кілька облікових записів Synology Chat у `channels.synology-chat.accounts`.
Кожен обліковий запис може перевизначати токен, вхідний URL, шлях webhook, політику приватних повідомлень і ліміти.
Сесії прямих повідомлень ізольовані для кожного облікового запису та користувача, тому той самий числовий `user_id`
у двох різних облікових записах Synology не ділить стан транскрипту.
Для кожного ввімкненого облікового запису задавайте окремий `webhookPath`. OpenClaw тепер відхиляє однакові точні шляхи
і відмовляється запускати іменовані облікові записи, які лише успадковують спільний шлях webhook у конфігураціях із кількома обліковими записами.
Якщо вам свідомо потрібне успадкування для іменованого облікового запису за старою схемою, установіть
`dangerouslyAllowInheritedWebhookPath: true` для цього облікового запису або в `channels.synology-chat`,
але однакові точні шляхи все одно відхиляються за принципом fail-closed. Надавайте перевагу явним шляхам для кожного облікового запису.

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

- Тримайте `token` у секреті й замінюйте його, якщо він витік.
- Залишайте `allowInsecureSsl: false`, якщо тільки ви явно не довіряєте локальному самопідписаному сертифікату NAS.
- Вхідні запити webhook перевіряються за токеном і обмежуються за частотою для кожного відправника.
- Перевірки недійсних токенів використовують порівняння секретів у сталий час і блокуються за принципом fail-closed.
- Для production надавайте перевагу `dmPolicy: "allowlist"`.
- Тримайте `dangerouslyAllowNameMatching` вимкненим, якщо вам не потрібна застаріла доставка відповідей на основі імен користувачів.
- Тримайте `dangerouslyAllowInheritedWebhookPath` вимкненим, якщо ви явно не приймаєте ризик маршрутизації через спільний шлях у конфігурації з кількома обліковими записами.

## Усунення несправностей

- `Missing required fields (token, user_id, text)`:
  - у payload вихідного webhook бракує одного з обов’язкових полів
  - якщо Synology надсилає токен у заголовках, переконайтеся, що gateway/proxy зберігає ці заголовки
- `Invalid token`:
  - секрет вихідного webhook не збігається з `channels.synology-chat.token`
  - запит потрапляє не до того облікового запису/шляху webhook
  - зворотний проксі видалив заголовок токена до того, як запит досяг OpenClaw
- `Rate limit exceeded`:
  - надто багато спроб із недійсним токеном з того самого джерела можуть тимчасово заблокувати це джерело
  - для автентифікованих відправників також діє окреме обмеження частоти повідомлень для кожного користувача
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - увімкнено `dmPolicy="allowlist"`, але не налаштовано жодного користувача
- `User not authorized`:
  - числовий `user_id` відправника відсутній у `allowedUserIds`

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Прив’язка](/channels/pairing) — автентифікація приватних повідомлень і сценарій прив’язки
- [Групи](/channels/groups) — поведінка групового чату та керування згадками
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
