---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення проблем зі сполученням Webhook
    - Налаштування iMessage на macOS
summary: iMessage через сервер BlueBubbles для macOS (REST надсилання/отримання, набір тексту, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T03:02:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3d8d617fc86ca1b191ff4dd2ae26b464e4d3f456a79c67b484a3a76d75de0d2
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Статус: вбудований Plugin, який взаємодіє із сервером BlueBubbles для macOS через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно зі застарілим каналом imsg.

## Вбудований Plugin

Поточні випуски OpenClaw постачаються з BlueBubbles, тому звичайним пакетним збіркам не
потрібен окремий крок `openclaw plugins install`.

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі не працює на Tahoe, а оновлення значка групи можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через Webhook; вихідні відповіді, індикатори набору тексту, сповіщення про прочитання та tapback — це REST-виклики.
- Вкладення та стікери обробляються як вхідні медіа (і передаються агенту, коли це можливо).
- Сполучення/allowlist працює так само, як і в інших каналах (`/channels/pairing` тощо) з `channels.bluebubbles.allowFrom` + кодами сполучення.
- Реакції відображаються як системні події, так само як у Slack/Telegram, тож агенти можуть «згадувати» їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, відповіді у тредах, ефекти повідомлень, керування групами.

## Швидкий початок

1. Встановіть сервер BlueBubbles на ваш Mac (дотримуйтеся інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
2. У конфігурації BlueBubbles увімкніть web API і встановіть пароль.
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

- Обов’язково встановіть пароль Webhook.
- Автентифікація Webhook завжди обов’язкова. OpenClaw відхиляє запити Webhook BlueBubbles, якщо вони не містять пароль/guid, що збігається з `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/проксі.
- Автентифікація за паролем перевіряється до читання/розбору повних тіл Webhook.

## Підтримання Messages.app активним (VM / безголові середовища)

У деяких середовищах macOS VM / always-on може статися так, що Messages.app переходить у «неактивний» стан (вхідні події припиняються, доки застосунок не буде відкрито/виведено на передній план). Простий обхідний шлях — **пінгувати Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

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
- Під час першого запуску можуть з’явитися запити macOS **Automation** (`osascript` → Messages). Підтвердьте їх у тому самому користувацькому сеансі, у якому працює LaunchAgent.

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

- **Server URL** (обов’язково): адреса сервера BlueBubbles (наприклад, `http://192.168.1.100:1234`)
- **Password** (обов’язково): пароль API з налаштувань BlueBubbles Server
- **Webhook path** (необов’язково): типово `/bluebubbles-webhook`
- **Політика DM**: pairing, allowlist, open або disabled
- **Список дозволених**: номери телефонів, електронні адреси або цілі чатів

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Контроль доступу (DM + групи)

DM:

- Типове значення: `channels.bluebubbles.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються до схвалення (строк дії кодів спливає через 1 годину).
- Схвалення через:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Сполучення — типовий механізм обміну токенами. Докладніше: [Сполучення](/uk/channels/pairing)

Групи:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` визначає, хто може ініціювати взаємодію в групах, коли встановлено `allowlist`.

### Збагачення імен контактів (macOS, необов’язково)

Webhook груп BlueBubbles часто містять лише необроблені адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, у macOS можна ввімкнути локальне збагачення через Contacts:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. Типове значення: `false`.
- Пошук виконується лише після того, як доступ до групи, авторизація команди та обмеження згадування дозволили пропустити повідомлення.
- Збагачуються лише неіменовані телефонні учасники.
- Необроблені номери телефонів залишаються резервним варіантом, якщо локальний збіг не знайдено.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Обмеження за згадуванням (групи)

BlueBubbles підтримує обмеження за згадуванням для групових чатів, як в iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадувань.
- Коли для групи ввімкнено `requireMention`, агент відповідає лише тоді, коли його згадано.
- Керівні команди від авторизованих відправників обходять це обмеження.

Налаштування для окремих груп:

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

- Керівні команди (наприклад, `/config`, `/model`) потребують авторизації.
- Для визначення авторизації команд використовуються `allowFrom` і `groupAllowFrom`.
- Авторизовані відправники можуть виконувати керівні команди навіть без згадування в групах.

### Системний промпт для окремої групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Значення вбудовується в системний промпт агента на кожному ході, який обробляє повідомлення в цій групі, тож ви можете задавати образ або правила поведінки для окремих груп без редагування промптів агента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Відповідай не більш ніж 3 реченнями. Відтворюй невимушений тон групи.",
        },
      },
    },
  },
}
```

Ключ збігається з тим, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а запис-шаблон `"*"` задає типове значення для кожної групи без точного збігу (той самий шаблон використовується `requireMention` і політиками інструментів для окремих груп). Точні збіги завжди мають пріоритет над шаблоном. DM ігнорують це поле; замість цього використовуйте налаштування промптів на рівні агента або облікового запису.

#### Практичний приклад: відповіді у тредах і реакції tapback (Private API)

Коли ввімкнено BlueBubbles Private API, вхідні повідомлення надходять із короткими ідентифікаторами повідомлень (наприклад, `[[reply_to:5]]`), і агент може викликати `action=reply`, щоб відповісти на конкретне повідомлення в треді, або `action=react`, щоб поставити tapback. `systemPrompt` для окремої групи — надійний спосіб змусити агента вибирати правильний інструмент:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Під час відповіді в цій групі завжди викликай action=reply з",
            "messageId `[[reply_to:N]]` із контексту, щоб твоя відповідь ішла",
            "під повідомленням, яке її спричинило. Ніколи не надсилай нове непов’язане повідомлення.",
            "",
            "Для коротких підтверджень ('ок', 'отримав', 'зроблю') використовуй",
            "action=react з відповідним tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "замість надсилання текстової відповіді.",
          ].join(" "),
        },
      },
    },
  },
}
```

І tapback-реакції, і відповіді у тредах потребують BlueBubbles Private API; див. [Розширені дії](#advanced-actions) і [Ідентифікатори повідомлень](#message-ids-short-vs-full) щодо базової механіки.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на довготривалі робочі простори ACP без зміни транспортного рівня.

Швидкий робочий сценарій для операторів:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Подальші повідомлення в цій самій розмові BlueBubbles маршрутизуються до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і прибирає прив’язку.

Також підтримуються налаштовані постійні прив’язки через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований дескриптор DM, наприклад `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних прив’язок груп надавайте перевагу `chat_id:*` або `chat_identifier:*`.

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

- **Індикатори набору тексту**: надсилаються автоматично до та під час генерації відповіді.
- **Сповіщення про прочитання**: керуються через `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори набору тексту**: OpenClaw надсилає події початку набору; BlueBubbles автоматично очищає стан набору після надсилання або тайм-ауту (ручна зупинка через DELETE ненадійна).

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

BlueBubbles підтримує розширені дії з повідомленнями, якщо їх увімкнено в конфігурації:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback-реакції (типово: true)
        edit: true, // редагування надісланих повідомлень (macOS 13+, не працює на macOS 26 Tahoe)
        unsend: true, // скасування надсилання повідомлень (macOS 13+)
        reply: true, // відповіді у тредах за GUID повідомлення
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

- **react**: Додати/видалити tapback-реакції (`messageId`, `emoji`, `remove`)
- **edit**: Відредагувати надіслане повідомлення (`messageId`, `text`)
- **unsend**: Скасувати надсилання повідомлення (`messageId`)
- **reply**: Відповісти на конкретне повідомлення (`messageId`, `text`, `to`)
- **sendWithEffect**: Надіслати з ефектом iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Перейменувати груповий чат (`chatGuid`, `displayName`)
- **setGroupIcon**: Встановити значок/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повертати успіх, але значок не синхронізується).
- **addParticipant**: Додати когось до групи (`chatGuid`, `address`)
- **removeParticipant**: Видалити когось із групи (`chatGuid`, `address`)
- **leaveGroup**: Вийти з групового чату (`chatGuid`)
- **upload-file**: Надіслати медіа/файли (`to`, `buffer`, `filename`, `asVoice`)
  - Голосові повідомлення: установіть `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати його як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових повідомлень.
- Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` — канонічна назва дії.

### Ідентифікатори повідомлень (короткі й повні)

OpenClaw може показувати _короткі_ ідентифікатори повідомлень (наприклад, `1`, `2`) для економії токенів.

- `MessageSid` / `ReplyToId` можуть бути короткими ідентифікаторами.
- `MessageSidFull` / `ReplyToIdFull` містять повні ідентифікатори провайдера.
- Короткі ідентифікатори зберігаються в пам’яті; вони можуть зникнути після перезапуску або очищення кешу.
- Дії приймають короткий або повний `messageId`, але короткі ідентифікатори спричинять помилку, якщо вони більше недоступні.

Використовуйте повні ідентифікатори для довготривалих автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Configuration](/uk/gateway/configuration) щодо змінних шаблонів.

## Блокове потокове передавання

Керуйте тим, чи надсилаються відповіді як одне повідомлення, чи потоково блоками:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // увімкнути блокове потокове передавання (типово вимкнено)
    },
  },
}
```

## Медіа + обмеження

- Вхідні вкладення завантажуються та зберігаються в кеші медіа.
- Обмеження медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 MB).
- Вихідний текст ділиться на частини відповідно до `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник із конфігурації

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Параметри провайдера:

- `channels.bluebubbles.enabled`: Увімкнути/вимкнути канал.
- `channels.bluebubbles.serverUrl`: Базова URL-адреса REST API BlueBubbles.
- `channels.bluebubbles.password`: Пароль API.
- `channels.bluebubbles.webhookPath`: Шлях кінцевої точки Webhook (типово: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlist для DM (дескриптори, електронні адреси, номери E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlist відправників для груп.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: У macOS необов’язково збагачує неіменованих учасників групи з локальних Contacts після проходження обмежень. Типове значення: `false`.
- `channels.bluebubbles.groups`: Конфігурація для окремих груп (`requireMention` тощо).
- `channels.bluebubbles.sendReadReceipts`: Надсилати сповіщення про прочитання (типово: `true`).
- `channels.bluebubbles.blockStreaming`: Увімкнути блокове потокове передавання (типово: `false`; обов’язково для потокових відповідей).
- `channels.bluebubbles.textChunkLimit`: Розмір вихідного фрагмента в символах (типово: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Тайм-аут на запит у мс для надсилання вихідного тексту через `/api/v1/message/text` (типово: 30000). Збільшуйте для середовищ macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворку iMessage; наприклад, `45000` або `60000`. Перевірки, пошук чатів, реакції, редагування та перевірки працездатності наразі зберігають коротший типовий тайм-аут 10 с; розширення покриття на реакції та редагування заплановано як наступний крок. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (типово) ділить лише при перевищенні `textChunkLimit`; `newline` ділить за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.bluebubbles.mediaMaxMb`: Обмеження вхідних/вихідних медіа в MB (типово: 8).
- `channels.bluebubbles.mediaLocalRoots`: Явний allowlist абсолютних локальних каталогів, дозволених для вихідних локальних шляхів до медіа. Надсилання локальних шляхів типово заборонено, якщо це не налаштовано. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: Максимум групових повідомлень для контексту (0 вимикає).
- `channels.bluebubbles.dmHistoryLimit`: Обмеження історії DM.
- `channels.bluebubbles.actions`: Увімкнення/вимкнення окремих дій.
- `channels.bluebubbles.accounts`: Конфігурація кількох облікових записів.

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Для стабільної маршрутизації надавайте перевагу `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (рекомендовано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі дескриптори: `+15555550123`, `user@example.com`
  - Якщо для прямого дескриптора немає наявного чату DM, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно, щоб був увімкнений BlueBubbles Private API.

## Безпека

- Запити Webhook автентифікуються шляхом порівняння параметрів запиту `guid`/`password` або заголовків із `channels.bluebubbles.password`.
- Зберігайте пароль API та кінцеву точку Webhook у таємниці (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles у запиті наскрізно. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Якщо сервер BlueBubbles доступний за межами вашої LAN, увімкніть HTTPS + правила брандмауера.

## Усунення проблем

- Якщо події набору тексту/прочитання перестали працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Коди сполучення спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Реакції потребують BlueBubbles private API (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Редагування/скасування надсилання потребують macOS 13+ і сумісної версії сервера BlueBubbles. На macOS 26 (Tahoe) редагування наразі не працює через зміни private API.
- Оновлення значка групи можуть бути нестабільними на macOS 26 (Tahoe): API може повертати успіх, але новий значок не синхронізується.
- OpenClaw автоматично приховує відомі несправні дії на основі версії macOS сервера BlueBubbles. Якщо редагування все ще відображається на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- Для інформації про стан/працездатність: `openclaw status --all` або `openclaw status --deep`.

Загальний довідник щодо робочих процесів каналів див. у [Channels](/uk/channels) і в посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадуванням
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
