---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення проблем зі сполученням Webhook
    - Налаштування iMessage на macOS
summary: iMessage через сервер BlueBubbles для macOS (REST-надсилання/отримання, друк, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-20T17:06:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d7186ba92aa63bc811f874e5a910af884c17ad7d6394b5624eec63e17adc2f6
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Статус: вбудований Plugin, який взаємодіє із сервером BlueBubbles для macOS через HTTP. **Рекомендовано для інтеграції iMessage** завдяки багатшому API та простішому налаштуванню порівняно зі застарілим каналом imsg.

## Вбудований Plugin

Поточні випуски OpenClaw постачаються з BlueBubbles, тому звичайним пакетованим збіркам не
потрібен окремий крок `openclaw plugins install`.

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі не працює на Tahoe, а оновлення значка групи можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через Webhook; вихідні відповіді, індикатори набору, сповіщення про прочитання та tapback-реакції виконуються через REST-виклики.
- Вкладення та стікери обробляються як вхідні медіа (і за можливості передаються агенту).
- Сполучення/список дозволених працює так само, як і в інших каналах (`/channels/pairing` тощо) за допомогою `channels.bluebubbles.allowFrom` + кодів сполучення.
- Реакції відображаються як системні події так само, як у Slack/Telegram, щоб агенти могли "згадати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, гілки відповідей, ефекти повідомлень, керування групами.

## Швидкий початок

1. Встановіть сервер BlueBubbles на ваш Mac (дотримуйтеся інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
2. У конфігурації BlueBubbles увімкніть web API і задайте пароль.
3. Запустіть `openclaw onboard` і виберіть BlueBubbles, або налаштуйте вручну:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Спрямуйте Webhook BlueBubbles на ваш Gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Запустіть Gateway; він зареєструє обробник Webhook і почне сполучення.

Примітка щодо безпеки:

- Завжди задавайте пароль для Webhook.
- Автентифікація Webhook є завжди обов’язковою. OpenClaw відхиляє запити Webhook BlueBubbles, якщо вони не містять пароль/guid, що збігається з `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/проксі.
- Автентифікація за паролем перевіряється до читання/розбору повних тіл Webhook.

## Підтримання активності Messages.app (VM / headless-середовища)

У деяких середовищах macOS VM / always-on Messages.app може переходити в “idle” (вхідні події припиняються, доки застосунок не буде відкрито/виведено на передній план). Простий обхідний шлях — **торкатися Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

### 1) Збережіть AppleScript

Збережіть це як:

- `~/Scripts/poke-messages.scpt`

Приклад скрипта (неінтерактивний; не перехоплює фокус):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Встановіть LaunchAgent

Збережіть це як:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Примітки:

- Це запускається **кожні 300 секунд** і **під час входу в систему**.
- Перший запуск може викликати запити macOS на **Automation** (`osascript` → Messages). Підтвердіть їх у тій самій користувацькій сесії, де працює LaunchAgent.

Завантажте його:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles доступний в інтерактивному Onboarding:

```
openclaw onboard
```

Майстер запитує:

- **Server URL** (обов’язково): адреса сервера BlueBubbles (наприклад, `http://192.168.1.100:1234`)
- **Password** (обов’язково): пароль API з налаштувань BlueBubbles Server
- **Webhook path** (необов’язково): типово `/bluebubbles-webhook`
- **Політика DM**: pairing, allowlist, open або disabled
- **Список дозволених**: номери телефонів, email-адреси або цілі чатів

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Керування доступом (DM + групи)

DM:

- Типово: `channels.bluebubbles.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються, доки їх не буде схвалено (коди спливають через 1 годину).
- Схвалення через:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Сполучення є типовим обміном токенами. Деталі: [Сполучення](/uk/channels/pairing)

Групи:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` визначає, хто може запускати дії в групах, коли встановлено `allowlist`.

### Збагачення імен контактів (macOS, необов’язково)

Webhook груп BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, на macOS можна ввімкнути локальне збагачення з Contacts:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. Типово: `false`.
- Пошук виконується лише після того, як груповий доступ, авторизація команд і mention gating дозволили повідомлення.
- Збагачуються лише безіменні телефонні учасники.
- Сирі номери телефонів залишаються резервним варіантом, якщо локальний збіг не знайдено.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention gating (групи)

BlueBubbles підтримує mention gating для групових чатів, як і iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадок.
- Коли для групи увімкнено `requireMention`, агент відповідає лише тоді, коли його згадано.
- Керувальні команди від авторизованих відправників обходять mention gating.

Конфігурація для окремих груп:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // типово для всіх груп
        "iMessage;-;chat123": { requireMention: false }, // перевизначення для конкретної групи
      },
    },
  },
}
```

### Обмеження команд

- Керувальні команди (наприклад, `/config`, `/model`) вимагають авторизації.
- Для визначення авторизації команд використовуються `allowFrom` і `groupAllowFrom`.
- Авторизовані відправники можуть виконувати керувальні команди навіть без згадки в групах.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на довготривалі робочі області ACP без зміни транспортного рівня.

Швидкий операторський сценарій:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в цій самій розмові BlueBubbles спрямовуватимуться до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Також підтримуються налаштовані постійні прив’язки через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований дескриптор DM, наприклад `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних прив’язок груп віддавайте перевагу `chat_id:*` або `chat_identifier:*`.

Приклад:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Див. [ACP Agents](/uk/tools/acp-agents) для спільної поведінки прив’язок ACP.

## Набір тексту + сповіщення про прочитання

- **Індикатори набору**: надсилаються автоматично перед і під час генерації відповіді.
- **Сповіщення про прочитання**: керуються через `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори набору**: OpenClaw надсилає події початку набору; BlueBubbles автоматично очищає стан набору після надсилання або тайм-ауту (ручна зупинка через DELETE ненадійна).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // вимкнути сповіщення про прочитання
    },
  },
}
```

## Розширені дії

BlueBubbles підтримує розширені дії з повідомленнями, коли їх увімкнено в конфігурації:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback-реакції (типово: true)
        edit: true, // редагування надісланих повідомлень (macOS 13+, не працює на macOS 26 Tahoe)
        unsend: true, // скасування надсилання повідомлень (macOS 13+)
        reply: true, // гілки відповідей за GUID повідомлення
        sendWithEffect: true, // ефекти повідомлень (slam, loud тощо)
        renameGroup: true, // перейменування групових чатів
        setGroupIcon: true, // встановлення значка/фото групового чату (нестабільно на macOS 26 Tahoe)
        addParticipant: true, // додавання учасників до груп
        removeParticipant: true, // видалення учасників із груп
        leaveGroup: true, // вихід із групових чатів
        sendAttachment: true, // надсилання вкладень/медіа
      },
    },
  },
}
```

Доступні дії:

- **react**: додавання/видалення tapback-реакцій (`messageId`, `emoji`, `remove`)
- **edit**: редагування надісланого повідомлення (`messageId`, `text`)
- **unsend**: скасування надсилання повідомлення (`messageId`)
- **reply**: відповідь на конкретне повідомлення (`messageId`, `text`, `to`)
- **sendWithEffect**: надсилання з ефектом iMessage (`text`, `to`, `effectId`)
- **renameGroup**: перейменування групового чату (`chatGuid`, `displayName`)
- **setGroupIcon**: встановлення значка/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повертати успіх, але значок не синхронізується).
- **addParticipant**: додавання когось до групи (`chatGuid`, `address`)
- **removeParticipant**: видалення когось із групи (`chatGuid`, `address`)
- **leaveGroup**: вихід із групового чату (`chatGuid`)
- **upload-file**: надсилання медіа/файлів (`to`, `buffer`, `filename`, `asVoice`)
  - Голосові повідомлення: встановіть `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати його як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових повідомлень.
- Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` є канонічною назвою дії.

### ID повідомлень (короткі vs повні)

OpenClaw може показувати _короткі_ ID повідомлень (наприклад, `1`, `2`) для економії токенів.

- `MessageSid` / `ReplyToId` можуть бути короткими ID.
- `MessageSidFull` / `ReplyToIdFull` містять повні ID провайдера.
- Короткі ID зберігаються в пам’яті; вони можуть зникати після перезапуску або витіснення кешу.
- Дії приймають короткий або повний `messageId`, але короткі ID повернуть помилку, якщо вони більше недоступні.

Використовуйте повні ID для довготривалих автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідному payload

Див. [Конфігурація](/uk/gateway/configuration) щодо змінних шаблонів.

## Блокове потокове передавання

Керуйте тим, чи відповіді надсилатимуться як одне повідомлення, чи потоково блоками:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // увімкнути блокове потокове передавання (типово вимкнено)
    },
  },
}
```

## Медіа + ліміти

- Вхідні вкладення завантажуються та зберігаються в кеші медіа.
- Ліміт медіа задається через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 MB).
- Вихідний текст розбивається на фрагменти відповідно до `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник з конфігурації

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.bluebubbles.enabled`: Увімкнути/вимкнути канал.
- `channels.bluebubbles.serverUrl`: Базовий URL REST API BlueBubbles.
- `channels.bluebubbles.password`: Пароль API.
- `channels.bluebubbles.webhookPath`: Шлях endpoint Webhook (типово: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
- `channels.bluebubbles.allowFrom`: Список дозволених для DM (ідентифікатори, email-адреси, номери E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Список дозволених відправників для груп.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: На macOS необов’язково збагачує безіменних учасників групи з локальних Contacts після проходження перевірок. Типово: `false`.
- `channels.bluebubbles.groups`: Конфігурація для окремих груп (`requireMention` тощо).
- `channels.bluebubbles.sendReadReceipts`: Надсилати сповіщення про прочитання (типово: `true`).
- `channels.bluebubbles.blockStreaming`: Увімкнути блокове потокове передавання (типово: `false`; потрібне для потокових відповідей).
- `channels.bluebubbles.textChunkLimit`: Розмір вихідного фрагмента в символах (типово: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Тайм-аут на запит у мс для надсилання вихідного тексту через `/api/v1/message/text` (типово: 30000). Збільшуйте на системах macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворка iMessage; наприклад, `45000` або `60000`. Перевірки, пошук чатів, реакції, редагування та перевірки стану наразі зберігають коротший типовий тайм-аут 10 с; розширення цього покриття на реакції та редагування заплановано як наступний крок. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише при перевищенні `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.bluebubbles.mediaMaxMb`: Ліміт вхідних/вихідних медіа в MB (типово: 8).
- `channels.bluebubbles.mediaLocalRoots`: Явний список дозволених абсолютних локальних директорій для вихідних шляхів до локальних медіа. Надсилання локальних шляхів типово заборонене, якщо це не налаштовано. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: Максимальна кількість групових повідомлень для контексту (0 вимикає).
- `channels.bluebubbles.dmHistoryLimit`: Ліміт історії DM.
- `channels.bluebubbles.actions`: Увімкнути/вимкнути окремі дії.
- `channels.bluebubbles.accounts`: Конфігурація кількох облікових записів.

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Для стабільної маршрутизації надавайте перевагу `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (переважно для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі ідентифікатори: `+15555550123`, `user@example.com`
  - Якщо для прямого ідентифікатора немає наявного DM-чату, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно, щоб у BlueBubbles було ввімкнено Private API.

## Безпека

- Запити Webhook автентифікуються шляхом порівняння параметрів запиту `guid`/`password` або заголовків із `channels.bluebubbles.password`.
- Зберігайте пароль API і endpoint Webhook у таємниці (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу через localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles у запиті наскрізно. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Увімкніть HTTPS і правила фаєрвола на сервері BlueBubbles, якщо відкриваєте його поза межами вашої LAN.

## Усунення проблем

- Якщо події набору/прочитання перестали працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway збігається з `channels.bluebubbles.webhookPath`.
- Коди сполучення спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Для реакцій потрібен BlueBubbles private API (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Для редагування/скасування надсилання потрібні macOS 13+ і сумісна версія сервера BlueBubbles. На macOS 26 (Tahoe) редагування наразі не працює через зміни в private API.
- Оновлення значка групи можуть бути нестабільними на macOS 26 (Tahoe): API може повертати успіх, але новий значок не синхронізується.
- OpenClaw автоматично приховує відомі непрацюючі дії на основі версії macOS сервера BlueBubbles. Якщо редагування все ще відображається на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- Для перегляду інформації про статус/стан: `openclaw status --all` або `openclaw status --deep`.

Загальний довідник щодо роботи каналів див. у [Channels](/uk/channels) і в посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Огляд Channels](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і mention gating
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
