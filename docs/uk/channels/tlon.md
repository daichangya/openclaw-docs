---
read_when:
    - Робота над функціями каналу Tlon/Urbit
summary: Статус підтримки Tlon/Urbit, можливості та конфігурація
title: Tlon
x-i18n:
    generated_at: "2026-04-05T17:59:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon — це децентралізований месенджер, побудований на Urbit. OpenClaw підключається до вашого ship Urbit і може
відповідати в DM та на повідомлення в групових чатах. Відповіді в групах типово вимагають @-згадки й можуть
додатково обмежуватися через allowlist.

Статус: вбудований плагін. Підтримуються DM, групові згадки, відповіді в тредах, форматування rich text та
завантаження зображень. Реакції та опитування поки що не підтримуються.

## Вбудований плагін

Tlon постачається як вбудований плагін у поточних релізах OpenClaw, тому звичайні зібрані
збірки не потребують окремого встановлення.

Якщо ви використовуєте старішу збірку або спеціальне встановлення без Tlon, установіть його
вручну:

Установлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/tlon
```

Локальна копія репозиторію (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Докладніше: [Плагіни](/tools/plugin)

## Налаштування

1. Переконайтеся, що плагін Tlon доступний.
   - Поточні зібрані релізи OpenClaw уже містять його в комплекті.
   - У старіших/спеціальних інсталяціях його можна додати вручну наведеними вище командами.
2. Зберіть URL вашого ship і код входу.
3. Налаштуйте `channels.tlon`.
4. Перезапустіть gateway.
5. Надішліть боту DM або згадайте його в груповому каналі.

Мінімальна конфігурація (один обліковий запис):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Приватні/LAN ship-и

Типово OpenClaw блокує приватні/внутрішні host name і діапазони IP для захисту від SSRF.
Якщо ваш ship працює в приватній мережі (localhost, LAN IP або внутрішній host name),
ви маєте явно дозволити це:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Це застосовується до таких URL:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Вмикайте це лише якщо довіряєте своїй локальній мережі. Це налаштування вимикає захист від SSRF
для запитів до URL вашого ship.

## Групові канали

Автовиявлення увімкнене типово. Ви також можете закріпити канали вручну:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Вимкнення автовиявлення:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Керування доступом

Allowlist для DM (порожній = DM заборонені, використовуйте `ownerShip` для потоку підтвердження):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Авторизація груп (типово з обмеженнями):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Власник і система підтвердження

Задайте ship власника, щоб він отримував запити на підтвердження, коли неавторизовані користувачі намагаються взаємодіяти:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Ship власника **автоматично авторизований скрізь** — запрошення до DM автоматично приймаються, а
повідомлення в каналах завжди дозволені. Вам не потрібно додавати власника до `dmAllowlist` або
`defaultAuthorizedShips`.

Коли це налаштовано, власник отримує DM-сповіщення про:

- запити на DM від ship-ів, яких немає в allowlist
- згадки в каналах без авторизації
- запити на запрошення до груп

## Налаштування автоприйняття

Автоматично приймати запрошення до DM (для ship-ів у `dmAllowlist`):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Автоматично приймати запрошення до груп:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Цілі доставки (CLI/cron)

Використовуйте це з `openclaw message send` або доставкою cron:

- DM: `~sampel-palnet` або `dm/~sampel-palnet`
- Група: `chat/~host-ship/channel` або `group:~host-ship/channel`

## Вбудований Skills

Плагін Tlon містить вбудований Skills ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
який надає доступ через CLI до операцій Tlon:

- **Контакти**: отримання/оновлення профілів, список контактів
- **Канали**: список, створення, публікація повідомлень, отримання історії
- **Групи**: список, створення, керування учасниками
- **DM**: надсилання повідомлень, реакції на повідомлення
- **Реакції**: додавання/видалення emoji-реакцій до дописів і DM
- **Налаштування**: керування дозволами плагіна через slash-команди

Skills стає автоматично доступним після встановлення плагіна.

## Можливості

| Функція          | Статус                                  |
| ---------------- | --------------------------------------- |
| Особисті повідомлення | ✅ Підтримується                    |
| Групи/канали     | ✅ Підтримується (типово з gating за згадкою) |
| Треди            | ✅ Підтримується (автовідповіді в треді) |
| Rich text        | ✅ Markdown перетворюється у формат Tlon |
| Зображення       | ✅ Завантажуються до сховища Tlon       |
| Реакції          | ✅ Через [вбудований Skills](#bundled-skill) |
| Опитування       | ❌ Поки що не підтримується             |
| Власні команди   | ✅ Підтримується (типово лише для власника) |

## Усунення проблем

Спочатку виконайте цю послідовність:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Поширені збої:

- **DM ігноруються**: відправника немає в `dmAllowlist`, і не налаштовано `ownerShip` для потоку підтвердження.
- **Групові повідомлення ігноруються**: канал не виявлено або відправник не авторизований.
- **Помилки з’єднання**: перевірте, що URL ship доступний; для локальних ship-ів увімкніть `allowPrivateNetwork`.
- **Помилки автентифікації**: перевірте, що код входу актуальний (коди змінюються).

## Довідник конфігурації

Повна конфігурація: [Конфігурація](/gateway/configuration)

Параметри провайдера:

- `channels.tlon.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.tlon.ship`: назва ship бота в Urbit (наприклад, `~sampel-palnet`).
- `channels.tlon.url`: URL ship (наприклад, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: код входу ship.
- `channels.tlon.allowPrivateNetwork`: дозволити URL localhost/LAN (обхід SSRF).
- `channels.tlon.ownerShip`: ship власника для системи підтвердження (завжди авторизований).
- `channels.tlon.dmAllowlist`: ship-и, яким дозволено надсилати DM (порожній = ніхто).
- `channels.tlon.autoAcceptDmInvites`: автоматично приймати DM від ship-ів з allowlist.
- `channels.tlon.autoAcceptGroupInvites`: автоматично приймати всі групові запрошення.
- `channels.tlon.autoDiscoverChannels`: автоматично виявляти групові канали (типово: true).
- `channels.tlon.groupChannels`: вручну закріплені nests каналів.
- `channels.tlon.defaultAuthorizedShips`: ship-и, авторизовані для всіх каналів.
- `channels.tlon.authorization.channelRules`: правила авторизації для окремих каналів.
- `channels.tlon.showModelSignature`: додавати назву моделі до повідомлень.

## Примітки

- Для відповіді в групі потрібна згадка (наприклад, `~your-bot-ship`).
- Відповіді в тредах: якщо вхідне повідомлення надійшло в треді, OpenClaw відповідає в цьому самому треді.
- Rich text: форматування Markdown (жирний, курсив, код, заголовки, списки) перетворюється у власний формат Tlon.
- Зображення: URL завантажуються до сховища Tlon і вбудовуються як блоки зображень.

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/channels/groups) — поведінка групових чатів і gating за згадкою
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
