---
read_when:
    - Ви хочете підключити OpenClaw до QQ
    - Вам потрібно налаштувати облікові дані QQ Bot
    - Ви хочете підтримку групових чатів або приватних чатів QQ Bot
summary: Налаштування, конфігурація та використання QQ Bot
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T17:58:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot підключається до OpenClaw через офіційний API QQ Bot (WebSocket gateway). Плагін підтримує приватні чати C2C, групові @повідомлення та повідомлення в каналах guild із розширеними медіа (зображення, голос, відео, файли).

Статус: вбудований плагін. Підтримуються прямі повідомлення, групові чати, канали guild і медіа. Реакції та потоки не підтримуються.

## Вбудований плагін

Поточні випуски OpenClaw містять QQ Bot у комплекті, тому звичайні зібрані збірки не потребують окремого кроку `openclaw plugins install`.

## Налаштування

1. Перейдіть на [QQ Open Platform](https://q.qq.com/) і відскануйте QR-код за допомогою QQ на телефоні, щоб зареєструватися / увійти.
2. Натисніть **Create Bot**, щоб створити нового QQ-бота.
3. Знайдіть **AppID** і **AppSecret** на сторінці налаштувань бота та скопіюйте їх.

> AppSecret не зберігається у відкритому вигляді — якщо ви залишите сторінку, не зберігши його, вам доведеться згенерувати новий.

4. Додайте канал:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Перезапустіть Gateway.

Інтерактивні шляхи налаштування:

```bash
openclaw channels add
openclaw configure --section channels
```

## Конфігурація

Мінімальна конфігурація:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Змінні середовища для облікового запису за замовчуванням:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret із файла:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Примітки:

- Резервний варіант через змінні середовища застосовується лише до облікового запису QQ Bot за замовчуванням.
- `openclaw channels add --channel qqbot --token-file ...` надає лише AppSecret; AppID уже має бути задано в конфігурації або в `QQBOT_APP_ID`.
- `clientSecret` також приймає вхід SecretRef, а не лише відкритий рядок.

### Налаштування кількох облікових записів

Запускайте кілька QQ-ботів в одному екземплярі OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Кожен обліковий запис запускає власне WebSocket-з’єднання та підтримує незалежний кеш токенів (ізольований за `appId`).

Додайте другого бота через CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Голос (STT / TTS)

Підтримка STT і TTS має дворівневу конфігурацію з пріоритетним резервним вибором:

| Налаштування | Специфічне для плагіна | Резервний варіант фреймворку |
| ------------ | ---------------------- | ---------------------------- |
| STT          | `channels.qqbot.stt`   | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts`   | `messages.tts`               |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Установіть `enabled: false` для будь-якого з них, щоб вимкнути.

Поведінку завантаження/транскодування вихідного аудіо також можна налаштувати через `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Цільові формати

| Формат                     | Опис                |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Приватний чат (C2C) |
| `qqbot:group:GROUP_OPENID` | Груповий чат        |
| `qqbot:channel:CHANNEL_ID` | Канал guild         |

> Кожен бот має власний набір користувацьких OpenID. OpenID, отриманий ботом A, **не можна** використовувати для надсилання повідомлень через бота B.

## Slash-команди

Вбудовані команди, що перехоплюються до черги AI:

| Команда        | Опис                                   |
| -------------- | -------------------------------------- |
| `/bot-ping`    | Перевірка затримки                     |
| `/bot-version` | Показати версію фреймворку OpenClaw    |
| `/bot-help`    | Показати всі команди                   |
| `/bot-upgrade` | Показати посилання на посібник оновлення QQBot |
| `/bot-logs`    | Експортувати останні журнали gateway у файл |

Додавайте `?` до будь-якої команди, щоб отримати довідку з використання (наприклад, `/bot-upgrade ?`).

## Усунення несправностей

- **Бот відповідає "gone to Mars":** облікові дані не налаштовані або Gateway не запущено.
- **Немає вхідних повідомлень:** перевірте, що `appId` і `clientSecret` правильні, а бот увімкнений на QQ Open Platform.
- **Після налаштування з `--token-file` усе ще показується як не налаштовано:** `--token-file` задає лише AppSecret. Вам усе ще потрібен `appId` у конфігурації або `QQBOT_APP_ID`.
- **Проактивні повідомлення не надходять:** QQ може перехоплювати повідомлення, ініційовані ботом, якщо користувач не взаємодіяв нещодавно.
- **Голос не транскрибується:** переконайтеся, що STT налаштовано, а провайдер доступний.
