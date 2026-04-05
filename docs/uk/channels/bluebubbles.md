---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення проблем із паруванням вебхука
    - Налаштування iMessage на macOS
summary: iMessage через сервер BlueBubbles macOS (REST-надсилання/отримання, введення, реакції, парування, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-05T17:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed8e59a165bdfb8fd794ee2ad6e4dacd44aa02d512312c5f2fd7d15f863380bb
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Статус: вбудований плагін, який взаємодіє із сервером BlueBubbles macOS через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно із застарілим каналом imsg.

## Вбудований плагін

Поточні випуски OpenClaw постачаються з BlueBubbles, тому звичайним пакетним збіркам не потрібен окремий крок `openclaw plugins install`.

## Огляд

- Працює на macOS через допоміжну програму BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі не працює на Tahoe, а оновлення значка групи можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через вебхуки; вихідні відповіді, індикатори введення, підтвердження прочитання та tapback-реакції надсилаються через REST-виклики.
- Вкладення та стікери обробляються як вхідні медіа (і, за можливості, передаються агенту).
- Парування/список дозволених працює так само, як і в інших каналах (`/channels/pairing` тощо), за допомогою `channels.bluebubbles.allowFrom` + кодів парування.
- Реакції відображаються як системні події так само, як у Slack/Telegram, тому агенти можуть "згадати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, ланцюжки відповідей, ефекти повідомлень, керування групами.

## Швидкий старт

1. Установіть сервер BlueBubbles на свій Mac (дотримуйтесь інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
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

4. Спрямуйте вебхуки BlueBubbles на свій gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Запустіть gateway; він зареєструє обробник вебхука і почне парування.

Примітка щодо безпеки:

- Завжди встановлюйте пароль вебхука.
- Автентифікація вебхука є обов’язковою завжди. OpenClaw відхиляє запити вебхука BlueBubbles, якщо вони не містять password/guid, що збігається з `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології local loopback/проксі.
- Автентифікація за паролем перевіряється до читання/розбору повних тіл вебхуків.

## Підтримання активності Messages.app (VM / headless-налаштування)

У деяких налаштуваннях macOS VM / always-on може статися так, що Messages.app переходить у стан “idle” (вхідні події припиняються, доки програму не буде відкрито/виведено на передній план). Простий обхідний шлях — **торкатися Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

### 1) Збережіть AppleScript

Збережіть це як:

- `~/Scripts/poke-messages.scpt`

Приклад скрипту (без взаємодії; не перехоплює фокус):

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

### 2) Установіть LaunchAgent

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
- Перший запуск може викликати запити macOS **Automation** (`osascript` → Messages). Підтвердьте їх у тій самій сесії користувача, у якій працює LaunchAgent.

Завантажте його:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Онбординг

BlueBubbles доступний в інтерактивному онбордингу:

```
openclaw onboard
```

Майстер запитує:

- **URL сервера** (обов’язково): адреса сервера BlueBubbles (наприклад, `http://192.168.1.100:1234`)
- **Пароль** (обов’язково): пароль API з налаштувань BlueBubbles Server
- **Шлях вебхука** (необов’язково): типово `/bluebubbles-webhook`
- **Політика DM**: pairing, allowlist, open або disabled
- **Список дозволених**: телефонні номери, електронні адреси або цілі чатів

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Керування доступом (DM + групи)

DM:

- Типово: `channels.bluebubbles.dmPolicy = "pairing"`.
- Невідомі відправники отримують код парування; повідомлення ігноруються до схвалення (коди спливають через 1 годину).
- Схвалення через:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Парування є типовим обміном токенами. Докладніше: [Парування](/channels/pairing)

Групи:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` визначає, хто може запускати в групах, коли встановлено `allowlist`.

### Збагачення імен контактів (macOS, необов’язково)

Групові вебхуки BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` замість цього показував локальні імена контактів, на macOS можна увімкнути локальне збагачення з Contacts:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. Типово: `false`.
- Пошук виконується лише після того, як доступ до групи, авторизація команди й перевірка згадки вже пропустили повідомлення.
- Збагачуються лише безіменні телефонні учасники.
- Сирі телефонні номери залишаються запасним варіантом, якщо локального збігу не знайдено.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Перевірка згадки (групи)

BlueBubbles підтримує перевірку згадки для групових чатів, як і iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадок.
- Коли для групи ввімкнено `requireMention`, агент відповідає лише тоді, коли його згадано.
- Команди керування від авторизованих відправників обходять перевірку згадки.

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

### Перевірка команд

- Команди керування (наприклад, `/config`, `/model`) потребують авторизації.
- Для визначення авторизації команд використовуються `allowFrom` і `groupAllowFrom`.
- Авторизовані відправники можуть виконувати команди керування навіть без згадки в групах.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на довготривалі робочі простори ACP без зміни транспортного рівня.

Швидкий операторський сценарій:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в цій самій розмові BlueBubbles маршрутизуватимуться до створеної сесії ACP.
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

Див. [ACP Agents](/tools/acp-agents) щодо спільної поведінки прив’язок ACP.

## Індикатори введення + підтвердження прочитання

- **Індикатори введення**: надсилаються автоматично перед і під час генерації відповіді.
- **Підтвердження прочитання**: керуються `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори введення**: OpenClaw надсилає події початку введення; BlueBubbles очищує стан введення автоматично після надсилання або тайм-ауту (ручна зупинка через DELETE ненадійна).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // вимкнути підтвердження прочитання
    },
  },
}
```

## Розширені дії

BlueBubbles підтримує розширені дії з повідомленнями, якщо їх увімкнено в конфігурації:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback-реакції (типово: true)
        edit: true, // редагувати надіслані повідомлення (macOS 13+, не працює на macOS 26 Tahoe)
        unsend: true, // скасувати надсилання повідомлень (macOS 13+)
        reply: true, // ланцюжки відповідей за GUID повідомлення
        sendWithEffect: true, // ефекти повідомлень (slam, loud тощо)
        renameGroup: true, // перейменовувати групові чати
        setGroupIcon: true, // встановлювати значок/фото групового чату (нестабільно на macOS 26 Tahoe)
        addParticipant: true, // додавати учасників до груп
        removeParticipant: true, // видаляти учасників із груп
        leaveGroup: true, // залишати групові чати
        sendAttachment: true, // надсилати вкладення/медіа
      },
    },
  },
}
```

Доступні дії:

- **react**: додати/видалити tapback-реакції (`messageId`, `emoji`, `remove`)
- **edit**: відредагувати надіслане повідомлення (`messageId`, `text`)
- **unsend**: скасувати надсилання повідомлення (`messageId`)
- **reply**: відповісти на конкретне повідомлення (`messageId`, `text`, `to`)
- **sendWithEffect**: надіслати з ефектом iMessage (`text`, `to`, `effectId`)
- **renameGroup**: перейменувати груповий чат (`chatGuid`, `displayName`)
- **setGroupIcon**: установити значок/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повертати успіх, але значок не синхронізується).
- **addParticipant**: додати когось до групи (`chatGuid`, `address`)
- **removeParticipant**: видалити когось із групи (`chatGuid`, `address`)
- **leaveGroup**: залишити груповий чат (`chatGuid`)
- **upload-file**: надіслати медіа/файли (`to`, `buffer`, `filename`, `asVoice`)
  - Голосові повідомлення: установіть `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових повідомлень.
- Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` є канонічною назвою дії.

### ID повідомлень (короткі проти повних)

OpenClaw може відображати _короткі_ ID повідомлень (наприклад, `1`, `2`) для економії токенів.

- `MessageSid` / `ReplyToId` можуть бути короткими ID.
- `MessageSidFull` / `ReplyToIdFull` містять повні ID провайдера.
- Короткі ID зберігаються в пам’яті; вони можуть зникнути після перезапуску або витіснення з кешу.
- Дії приймають короткий або повний `messageId`, але короткі ID спричинятимуть помилку, якщо вони вже недоступні.

Для довготривалих автоматизацій і зберігання використовуйте повні ID:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Configuration](/gateway/configuration) щодо змінних шаблонів.

## Потокове надсилання блоками

Керуйте тим, чи відповіді надсилатимуться як одне повідомлення, чи потоково блоками:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // увімкнути потокове надсилання блоками (типово вимкнено)
    },
  },
}
```

## Медіа + обмеження

- Вхідні вкладення завантажуються й зберігаються в кеші медіа.
- Обмеження медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 MB).
- Вихідний текст розбивається на частини за `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник конфігурації

Повна конфігурація: [Configuration](/gateway/configuration)

Параметри провайдера:

- `channels.bluebubbles.enabled`: увімкнути/вимкнути канал.
- `channels.bluebubbles.serverUrl`: базовий URL REST API BlueBubbles.
- `channels.bluebubbles.password`: пароль API.
- `channels.bluebubbles.webhookPath`: шлях кінцевої точки вебхука (типово: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
- `channels.bluebubbles.allowFrom`: список дозволених DM (дескриптори, електронні адреси, номери E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: список дозволених відправників у групах.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: на macOS необов’язково збагачує безіменних учасників груп із локальних Contacts після проходження перевірок. Типово: `false`.
- `channels.bluebubbles.groups`: конфігурація окремих груп (`requireMention` тощо).
- `channels.bluebubbles.sendReadReceipts`: надсилати підтвердження прочитання (типово: `true`).
- `channels.bluebubbles.blockStreaming`: увімкнути потокове надсилання блоками (типово: `false`; потрібне для потокових відповідей).
- `channels.bluebubbles.textChunkLimit`: розмір вихідного блока в символах (типово: 4000).
- `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише при перевищенні `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.bluebubbles.mediaMaxMb`: обмеження вхідних/вихідних медіа в MB (типово: 8).
- `channels.bluebubbles.mediaLocalRoots`: явний список дозволених абсолютних локальних каталогів для вихідних шляхів локальних медіа. Надсилання локальних шляхів типово заборонене, якщо це не налаштовано. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: максимальна кількість групових повідомлень для контексту (0 вимикає).
- `channels.bluebubbles.dmHistoryLimit`: обмеження історії DM.
- `channels.bluebubbles.actions`: увімкнути/вимкнути окремі дії.
- `channels.bluebubbles.accounts`: конфігурація кількох облікових записів.

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Для стабільної маршрутизації віддавайте перевагу `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (рекомендовано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі дескриптори: `+15555550123`, `user@example.com`
  - Якщо для прямого дескриптора немає наявного чату DM, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно, щоб було ввімкнено BlueBubbles Private API.

## Безпека

- Запити вебхука автентифікуються шляхом порівняння параметрів запиту `guid`/`password` або заголовків із `channels.bluebubbles.password`.
- Тримайте пароль API і кінцеву точку вебхука в секреті (ставтеся до них як до облікових даних).
- Для автентифікації вебхуків BlueBubbles немає обходу через localhost. Якщо ви проксіюєте трафік вебхуків, зберігайте пароль BlueBubbles в запиті від початку до кінця. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека gateway](/gateway/security#reverse-proxy-configuration).
- Якщо ви відкриваєте сервер BlueBubbles за межі своєї LAN, увімкніть HTTPS + правила брандмауера.

## Усунення проблем

- Якщо індикатори введення/прочитання перестали працювати, перевірте журнали вебхуків BlueBubbles і переконайтеся, що шлях gateway збігається з `channels.bluebubbles.webhookPath`.
- Коди парування спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Для реакцій потрібен BlueBubbles private API (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Для редагування/скасування надсилання потрібні macOS 13+ і сумісна версія сервера BlueBubbles. У macOS 26 (Tahoe) редагування наразі не працює через зміни private API.
- Оновлення значка групи можуть бути нестабільними на macOS 26 (Tahoe): API може повертати успіх, але новий значок не синхронізується.
- OpenClaw автоматично приховує відомі зламані дії залежно від версії macOS сервера BlueBubbles. Якщо редагування все ще відображається на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- Для інформації про стан/здоров’я: `openclaw status --all` або `openclaw status --deep`.

Загальний довідник щодо робочого процесу каналів див. у [Channels](/channels) та посібнику [Plugins](/tools/plugin).

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Парування](/channels/pairing) — автентифікація DM і потік парування
- [Групи](/channels/groups) — поведінка групового чату й перевірка згадки
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та зміцнення безпеки
