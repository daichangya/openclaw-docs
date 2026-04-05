---
read_when:
    - Робота над функціями каналу Nextcloud Talk
summary: Стан підтримки, можливості та конфігурація Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T17:58:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

Стан: вбудований плагін (бот webhook). Підтримуються особисті повідомлення, кімнати, реакції та повідомлення з Markdown.

## Вбудований плагін

Nextcloud Talk постачається як вбудований плагін у поточних релізах OpenClaw, тож
звичайні пакетні збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або власну інсталяцію без Nextcloud Talk,
установіть його вручну:

Установлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Локальна копія репозиторію (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Докладніше: [Плагіни](/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що плагін Nextcloud Talk доступний.
   - Поточні пакетні релізи OpenClaw уже містять його в комплекті.
   - У старіших/власних інсталяціях його можна додати вручну командами вище.
2. На вашому сервері Nextcloud створіть бота:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Увімкніть бота в налаштуваннях цільової кімнати.
4. Налаштуйте OpenClaw:
   - Конфігурація: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Або змінна середовища: `NEXTCLOUD_TALK_BOT_SECRET` (лише для облікового запису за замовчуванням)
5. Перезапустіть gateway (або завершіть налаштування).

Мінімальна конфігурація:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Примітки

- Боти не можуть ініціювати особисті повідомлення. Користувач має спочатку написати боту.
- URL webhook має бути доступним для Gateway; якщо ви за проксі, установіть `webhookPublicUrl`.
- Вивантаження медіа через API бота не підтримується; медіа надсилаються як URL.
- Навантаження webhook не розрізняє особисті повідомлення та кімнати; установіть `apiUser` + `apiPassword`, щоб увімкнути визначення типу кімнати (інакше особисті повідомлення трактуватимуться як кімнати).

## Контроль доступу (особисті повідомлення)

- За замовчуванням: `channels.nextcloud-talk.dmPolicy = "pairing"`. Невідомі відправники отримують код pairing.
- Схвалення через:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Публічні особисті повідомлення: `channels.nextcloud-talk.dmPolicy="open"` плюс `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` зіставляється лише з ID користувачів Nextcloud; відображувані імена ігноруються.

## Кімнати (групи)

- За замовчуванням: `channels.nextcloud-talk.groupPolicy = "allowlist"` (із вимогою згадки).
- Додавайте кімнати до allowlist через `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Щоб не дозволяти жодних кімнат, залиште allowlist порожнім або встановіть `channels.nextcloud-talk.groupPolicy="disabled"`.

## Можливості

| Функція             | Стан             |
| ------------------- | ---------------- |
| Особисті повідомлення | Підтримується    |
| Кімнати             | Підтримується    |
| Потоки              | Не підтримується |
| Медіа               | Лише URL         |
| Реакції             | Підтримується    |
| Власні команди      | Не підтримується |

## Довідник із конфігурації (Nextcloud Talk)

Повна конфігурація: [Конфігурація](/gateway/configuration)

Параметри провайдера:

- `channels.nextcloud-talk.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.nextcloud-talk.baseUrl`: URL екземпляра Nextcloud.
- `channels.nextcloud-talk.botSecret`: спільний секрет бота.
- `channels.nextcloud-talk.botSecretFile`: шлях до секрету у звичайному файлі. Символічні посилання відхиляються.
- `channels.nextcloud-talk.apiUser`: користувач API для пошуку кімнат (визначення особистих повідомлень).
- `channels.nextcloud-talk.apiPassword`: пароль API/застосунку для пошуку кімнат.
- `channels.nextcloud-talk.apiPasswordFile`: шлях до файла з паролем API.
- `channels.nextcloud-talk.webhookPort`: порт прослуховувача webhook (за замовчуванням: 8788).
- `channels.nextcloud-talk.webhookHost`: хост webhook (за замовчуванням: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: шлях webhook (за замовчуванням: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: зовнішньо доступний URL webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist для особистих повідомлень (ID користувачів). Для `open` потрібне `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist груп (ID користувачів).
- `channels.nextcloud-talk.rooms`: налаштування й allowlist для окремих кімнат.
- `channels.nextcloud-talk.historyLimit`: ліміт історії групи (0 вимикає).
- `channels.nextcloud-talk.dmHistoryLimit`: ліміт історії особистих повідомлень (0 вимикає).
- `channels.nextcloud-talk.dms`: перевизначення для окремих особистих повідомлень (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: розмір фрагмента вихідного тексту (символи).
- `channels.nextcloud-talk.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.nextcloud-talk.blockStreaming`: вимкнути потокову передачу блоків для цього каналу.
- `channels.nextcloud-talk.blockStreamingCoalesce`: налаштування об’єднання потокової передачі блоків.
- `channels.nextcloud-talk.mediaMaxMb`: обмеження вхідних медіа (МБ).

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — автентифікація особистих повідомлень і процес pairing
- [Групи](/channels/groups) — поведінка групових чатів і вимога згадки
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
