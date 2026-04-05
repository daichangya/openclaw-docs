---
read_when:
    - Налаштування інтеграції чату Twitch для OpenClaw
summary: Конфігурація та налаштування чат-бота Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-05T17:59:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47af9fb6edb1f462c5919850ee9d05e500a1914ddd0d64a41608fbe960e77cd6
    source_path: channels/twitch.md
    workflow: 15
---

# Twitch

Підтримка чату Twitch через IRC-з’єднання. OpenClaw підключається як користувач Twitch (обліковий запис бота), щоб отримувати й надсилати повідомлення в каналах.

## Вбудований плагін

Twitch постачається як вбудований плагін у поточних релізах OpenClaw, тому звичайні
пакетні збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власну інсталяцію без Twitch, установіть
його вручну:

Установлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/twitch
```

Локальна копія репозиторію (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Докладніше: [Плагіни](/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що плагін Twitch доступний.
   - Поточні пакетні релізи OpenClaw уже містять його в комплекті.
   - У старіших/власних інсталяціях його можна додати вручну командами вище.
2. Створіть окремий обліковий запис Twitch для бота (або використовуйте наявний обліковий запис).
3. Згенеруйте облікові дані: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Виберіть **Bot Token**
   - Переконайтеся, що вибрано області доступу `chat:read` і `chat:write`
   - Скопіюйте **Client ID** і **Access Token**
4. Знайдіть свій ID користувача Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Налаштуйте токен:
   - Змінна середовища: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (лише для облікового запису за замовчуванням)
   - Або конфігурація: `channels.twitch.accessToken`
   - Якщо задано обидва варіанти, пріоритет має конфігурація (змінна середовища використовується лише як резерв для облікового запису за замовчуванням).
6. Запустіть gateway.

**⚠️ Важливо:** додайте контроль доступу (`allowFrom` або `allowedRoles`), щоб неавторизовані користувачі не могли запускати бота. За замовчуванням `requireMention` має значення `true`.

Мінімальна конфігурація:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Обліковий запис Twitch бота
      accessToken: "oauth:abc123...", // OAuth Access Token (або використовуйте змінну середовища OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID з Token Generator
      channel: "vevisk", // До чату якого каналу приєднатися (обов’язково)
      allowFrom: ["123456789"], // (рекомендовано) Лише ваш ID користувача Twitch — отримайте його на https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Що це таке

- Канал Twitch, яким керує Gateway.
- Детермінована маршрутизація: відповіді завжди повертаються в Twitch.
- Кожен обліковий запис зіставляється з ізольованим ключем сесії `agent:<agentId>:twitch:<accountName>`.
- `username` — це обліковий запис бота (хто автентифікується), `channel` — це чат, до якого потрібно приєднатися.

## Налаштування (детально)

### Генерація облікових даних

Використайте [Twitch Token Generator](https://twitchtokengenerator.com/):

- Виберіть **Bot Token**
- Переконайтеся, що вибрано області доступу `chat:read` і `chat:write`
- Скопіюйте **Client ID** і **Access Token**

Ручна реєстрація застосунку не потрібна. Термін дії токенів закінчується через кілька годин.

### Налаштування бота

**Змінна середовища (лише для облікового запису за замовчуванням):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Або конфігурація:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Якщо задано і змінну середовища, і конфігурацію, пріоритет має конфігурація.

### Контроль доступу (рекомендовано)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (рекомендовано) Лише ваш ID користувача Twitch
    },
  },
}
```

Надавайте перевагу `allowFrom` для жорсткого allowlist. Натомість використовуйте `allowedRoles`, якщо вам потрібен доступ на основі ролей.

**Доступні ролі:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Чому саме ID користувачів?** Імена користувачів можуть змінюватися, що дозволяє видавати себе за інших. ID користувачів є постійними.

Знайдіть свій ID користувача Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (перетворення імені користувача Twitch на ID)

## Оновлення токена (необов’язково)

Токени з [Twitch Token Generator](https://twitchtokengenerator.com/) не можна автоматично оновлювати — після завершення строку дії згенеруйте нові.

Для автоматичного оновлення токена створіть власний застосунок Twitch у [Twitch Developer Console](https://dev.twitch.tv/console) і додайте до конфігурації:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Бот автоматично оновлює токени до завершення строку дії та записує події оновлення в журнали.

## Підтримка кількох облікових записів

Використовуйте `channels.twitch.accounts` із токенами для окремих облікових записів. Див. [`gateway/configuration`](/gateway/configuration) для спільного шаблону.

Приклад (один обліковий запис бота у двох каналах):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Примітка:** кожному обліковому запису потрібен власний токен (один токен на канал).

## Контроль доступу

### Обмеження на основі ролей

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Allowlist за ID користувача (найбезпечніше)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Доступ на основі ролей (альтернатива)

`allowFrom` — це жорсткий allowlist. Якщо його встановлено, дозволено лише цим ID користувачів.
Якщо вам потрібен доступ на основі ролей, не встановлюйте `allowFrom`, а натомість налаштуйте `allowedRoles`:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Вимкнення вимоги @mention

За замовчуванням `requireMention` має значення `true`. Щоб вимкнути цю вимогу й відповідати на всі повідомлення:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Усунення несправностей

Спочатку виконайте команди діагностики:

```bash
openclaw doctor
openclaw channels status --probe
```

### Бот не відповідає на повідомлення

**Перевірте контроль доступу:** переконайтеся, що ваш ID користувача є в `allowFrom`, або тимчасово
приберіть `allowFrom` і встановіть `allowedRoles: ["all"]` для тестування.

**Перевірте, що бот перебуває в каналі:** бот має приєднатися до каналу, указаного в `channel`.

### Проблеми з токеном

**«Failed to connect» або помилки автентифікації:**

- Переконайтеся, що `accessToken` — це значення OAuth access token (зазвичай починається з префікса `oauth:`)
- Перевірте, що токен має області доступу `chat:read` і `chat:write`
- Якщо ви використовуєте оновлення токена, переконайтеся, що задано `clientSecret` і `refreshToken`

### Оновлення токена не працює

**Перевірте журнали на наявність подій оновлення:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Якщо ви бачите «token refresh disabled (no refresh token)»:

- Переконайтеся, що надано `clientSecret`
- Переконайтеся, що надано `refreshToken`

## Конфігурація

**Конфігурація облікового запису:**

- `username` - ім’я користувача бота
- `accessToken` - OAuth access token з `chat:read` і `chat:write`
- `clientId` - Twitch Client ID (з Token Generator або вашого застосунку)
- `channel` - канал для приєднання (обов’язково)
- `enabled` - увімкнути цей обліковий запис (за замовчуванням: `true`)
- `clientSecret` - необов’язково: для автоматичного оновлення токена
- `refreshToken` - необов’язково: для автоматичного оновлення токена
- `expiresIn` - строк дії токена в секундах
- `obtainmentTimestamp` - timestamp отримання токена
- `allowFrom` - allowlist ID користувачів
- `allowedRoles` - контроль доступу на основі ролей (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - вимагати @mention (за замовчуванням: `true`)

**Параметри провайдера:**

- `channels.twitch.enabled` - увімкнути/вимкнути запуск каналу
- `channels.twitch.username` - ім’я користувача бота (спрощена конфігурація для одного облікового запису)
- `channels.twitch.accessToken` - OAuth access token (спрощена конфігурація для одного облікового запису)
- `channels.twitch.clientId` - Twitch Client ID (спрощена конфігурація для одного облікового запису)
- `channels.twitch.channel` - канал для приєднання (спрощена конфігурація для одного облікового запису)
- `channels.twitch.accounts.<accountName>` - конфігурація для кількох облікових записів (усі поля облікового запису вище)

Повний приклад:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Дії інструмента

Агент може викликати `twitch` з такою дією:

- `send` - надіслати повідомлення в канал

Приклад:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Безпека та операції

- **Ставтеся до токенів як до паролів** - ніколи не комітьте токени в git
- **Використовуйте автоматичне оновлення токена** для довготривалих ботів
- **Використовуйте allowlist за ID користувачів** замість імен користувачів для контролю доступу
- **Стежте за журналами** подій оновлення токенів і стану з’єднання
- **Запитуйте мінімально необхідні області доступу** - лише `chat:read` і `chat:write`
- **Якщо застрягли**: перезапустіть gateway після підтвердження, що жоден інший процес не володіє сесією

## Обмеження

- **500 символів** на повідомлення (автоматичне розбиття на межах слів)
- Markdown вилучається перед розбиттям
- Обмеження швидкості немає (використовуються вбудовані обмеження Twitch)

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — автентифікація особистих повідомлень і процес pairing
- [Групи](/channels/groups) — поведінка групових чатів і вимога згадки
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
