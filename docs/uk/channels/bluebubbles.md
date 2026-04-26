---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення несправностей сполучення Webhook
    - Налаштування iMessage на macOS
summary: iMessage через сервер BlueBubbles для macOS (REST надсилання/отримання, введення тексту, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T04:50:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15ca98edc92fa6525167bd8ef814ae17d18bab72f445b75e5df7b361883392b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

Статус: вбудований Plugin, який взаємодіє із сервером BlueBubbles для macOS через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно зі застарілим каналом imsg.

## Вбудований Plugin

Поточні релізи OpenClaw постачаються з BlueBubbles, тому для звичайних пакетованих збірок не
потрібен окремий крок `openclaw plugins install`.

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі не працює на Tahoe, а оновлення іконок груп може повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через Webhook-и; вихідні відповіді, індикатори введення, сповіщення про прочитання та tapback-и виконуються через REST-виклики.
- Вкладення та стікери обробляються як вхідні медіа (і передаються агенту, коли це можливо).
- Автоматичні TTS-відповіді, які синтезують аудіо MP3 або CAF, доставляються як бульбашки голосових нотаток iMessage, а не як звичайні файлові вкладення.
- Сполучення/список дозволених працює так само, як і в інших каналах (`/channels/pairing` тощо), через `channels.bluebubbles.allowFrom` + коди сполучення.
- Реакції відображаються як системні події, так само як у Slack/Telegram, тож агенти можуть "згадувати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, гілки відповідей, ефекти повідомлень, керування групами.

## Швидкий старт

1. Установіть сервер BlueBubbles на ваш Mac (дотримуйтеся інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
2. У конфігурації BlueBubbles увімкніть web API і задайте пароль.
3. Запустіть `openclaw onboard` і виберіть BlueBubbles або налаштуйте вручну:

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

4. Спрямуйте Webhook-и BlueBubbles на ваш Gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Запустіть Gateway; він зареєструє обробник Webhook-ів і почне сполучення.

Примітка щодо безпеки:

- Завжди задавайте пароль для Webhook.
- Автентифікація Webhook завжди обов’язкова. OpenClaw відхиляє запити Webhook BlueBubbles, якщо вони не містять пароль/guid, що відповідає `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/proxy.
- Автентифікація за паролем перевіряється до читання/розбору повних тіл Webhook-ів.

## Підтримання активності Messages.app (VM / headless-середовища)

У деяких середовищах macOS VM / always-on Messages.app може переходити в “idle” (вхідні події припиняються, доки застосунок не буде відкрито/виведено на передній план). Простий обхідний шлях — **торкатися Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

### 1) Збережіть AppleScript

Збережіть його як:

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

## Onboarding

BlueBubbles доступний в інтерактивному onboarding:

```
openclaw onboard
```

Майстер запитує:

- **Server URL** (обов’язково): адреса сервера BlueBubbles (наприклад, `http://192.168.1.100:1234`)
- **Password** (обов’язково): пароль API з налаштувань BlueBubbles Server
- **Webhook path** (необов’язково): типово `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open або disabled
- **Allow list**: номери телефонів, email-адреси або цілі чатів

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Керування доступом (DM + групи)

DM:

- Типово: `channels.bluebubbles.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються до схвалення (коди спливають через 1 годину).
- Схвалення через:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Сполучення — це типовий обмін токенами. Докладніше: [Pairing](/uk/channels/pairing)

Групи:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` визначає, хто може ініціювати в групах, коли встановлено `allowlist`.

### Збагачення імен контактів (macOS, необов’язково)

Групові Webhook-и BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, можна ввімкнути локальне збагачення з Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. Типово: `false`.
- Пошук виконується лише після того, як доступ до групи, авторизація команди та згадування дозволили проходження повідомлення.
- Збагачуються лише неіменовані телефонні учасники.
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

### Фільтрація за згадуванням (групи)

BlueBubbles підтримує фільтрацію за згадуванням для групових чатів, що відповідає поведінці iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадувань.
- Коли для групи увімкнено `requireMention`, агент відповідає лише тоді, коли його згадали.
- Керувальні команди від авторизованих відправників обходять фільтрацію за згадуванням.

Конфігурація для кожної групи:

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

### Фільтрація команд

- Керувальні команди (наприклад, `/config`, `/model`) потребують авторизації.
- Для визначення авторизації команд використовує `allowFrom` і `groupAllowFrom`.
- Авторизовані відправники можуть виконувати керувальні команди навіть без згадування в групах.

### Системний промпт для кожної групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Це значення вбудовується в системний промпт агента на кожному кроці, який обробляє повідомлення в цій групі, тож ви можете задавати персоналізацію або правила поведінки для кожної групи без редагування промптів агента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Тримай відповіді в межах 3 речень. Відтворюй невимушений тон групи.",
        },
      },
    },
  },
}
```

Ключ відповідає тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а запис із шаблоном `"*"` задає типове значення для кожної групи без точного збігу (той самий шаблон використовується для `requireMention` і політик інструментів для кожної групи). Точні збіги завжди мають пріоритет над шаблоном. DM ігнорують це поле; натомість використовуйте налаштування промптів на рівні агента або облікового запису.

#### Приклад у роботі: гілки відповідей і реакції tapback (Private API)

Якщо ввімкнено BlueBubbles Private API, вхідні повідомлення надходять із короткими ID повідомлень (наприклад, `[[reply_to:5]]`), і агент може викликати `action=reply`, щоб відповісти в конкретну гілку повідомлення, або `action=react`, щоб поставити tapback. `systemPrompt` для кожної групи — надійний спосіб змусити агента обирати правильний інструмент:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Коли відповідаєш у цій групі, завжди викликай action=reply з",
            "messageId [[reply_to:N]] із контексту, щоб твоя відповідь ішла",
            "під повідомленням-тригером. Ніколи не надсилай нове непов’язане повідомлення.",
            "",
            "Для коротких підтверджень ('ok', 'got it', 'on it') використовуй",
            "action=react з відповідним tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "замість надсилання текстової відповіді.",
          ].join(" "),
        },
      },
    },
  },
}
```

Реакції tapback і відповіді в гілках обидві потребують BlueBubbles Private API; див. [Advanced actions](#advanced-actions) і [Message IDs](#message-ids-short-vs-full) щодо базової механіки.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на довготривалі робочі простори ACP без зміни транспортного рівня.

Швидкий операторський сценарій:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в цій самій розмові BlueBubbles буде спрямовано до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Налаштовані постійні прив’язки також підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований дескриптор DM, такий як `+15555550123` або `user@example.com`
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

Див. [ACP Agents](/uk/tools/acp-agents) щодо спільної поведінки прив’язок ACP.

## Введення тексту + сповіщення про прочитання

- **Індикатори введення**: надсилаються автоматично до та під час генерації відповіді.
- **Сповіщення про прочитання**: керуються через `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори введення**: OpenClaw надсилає події початку введення; BlueBubbles автоматично очищає стан введення під час надсилання або за тайм-аутом (ручна зупинка через DELETE ненадійна).

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
        reactions: true, // tapback-и (типово: true)
        edit: true, // редагувати надіслані повідомлення (macOS 13+, не працює на macOS 26 Tahoe)
        unsend: true, // скасувати надсилання повідомлень (macOS 13+)
        reply: true, // гілки відповідей за GUID повідомлення
        sendWithEffect: true, // ефекти повідомлень (slam, loud тощо)
        renameGroup: true, // перейменувати групові чати
        setGroupIcon: true, // встановити іконку/фото групового чату (нестабільно на macOS 26 Tahoe)
        addParticipant: true, // додати учасників до груп
        removeParticipant: true, // видалити учасників із груп
        leaveGroup: true, // покинути групові чати
        sendAttachment: true, // надсилати вкладення/медіа
      },
    },
  },
}
```

Доступні дії:

- **react**: Додати/видалити tapback-реакції (`messageId`, `emoji`, `remove`). Власний набір tapback в iMessage — це `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає emoji поза цим набором (наприклад, `👀`), інструмент реакцій повертається до `love`, щоб tapback усе одно відобразився замість повного збою запиту. Налаштовані ack-реакції все одно перевіряються строго й повертають помилку для невідомих значень.
- **edit**: Редагувати надіслане повідомлення (`messageId`, `text`)
- **unsend**: Скасувати надсилання повідомлення (`messageId`)
- **reply**: Відповісти на конкретне повідомлення (`messageId`, `text`, `to`)
- **sendWithEffect**: Надіслати з ефектом iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Перейменувати груповий чат (`chatGuid`, `displayName`)
- **setGroupIcon**: Установити іконку/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повертати успіх, але іконка не синхронізується).
- **addParticipant**: Додати когось до групи (`chatGuid`, `address`)
- **removeParticipant**: Видалити когось із групи (`chatGuid`, `address`)
- **leaveGroup**: Покинути груповий чат (`chatGuid`)
- **upload-file**: Надіслати медіа/файли (`to`, `buffer`, `filename`, `asVoice`)
  - Голосові нотатки: установіть `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати його як голосове повідомлення iMessage. BlueBubbles конвертує MP3 → CAF під час надсилання голосових нотаток.
- Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` — це канонічна назва дії.

### ID повідомлень (короткі чи повні)

OpenClaw може показувати _короткі_ ID повідомлень (наприклад, `1`, `2`), щоб заощаджувати токени.

- `MessageSid` / `ReplyToId` можуть бути короткими ID.
- `MessageSidFull` / `ReplyToIdFull` містять повні ID провайдера.
- Короткі ID зберігаються в пам’яті; вони можуть зникнути після перезапуску або очищення кешу.
- Дії приймають короткий або повний `messageId`, але короткі ID повернуть помилку, якщо вони більше недоступні.

Використовуйте повні ID для довготривалих автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Configuration](/uk/gateway/configuration) щодо змінних шаблонів.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання розділених DM-надсилань (команда + URL в одному повідомленні)

Коли користувач вводить команду та URL разом в iMessage — наприклад, `Dump https://example.com/article` — Apple розділяє надсилання на **дві окремі доставки Webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка попереднього перегляду URL (`"https://..."`) із зображеннями OG-preview як вкладеннями.

Ці два Webhook-и надходять до OpenClaw з інтервалом приблизно 0.8-2.0 с у більшості середовищ. Без об’єднання агент отримує лише команду на ході 1, відповідає (часто "надішліть мені URL"), а URL бачить лише на ході 2 — коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` дозволяє об’єднувати послідовні Webhook-и одного відправника в DM в один хід агента. Групові чати й далі прив’язуються до кожного повідомлення окремо, щоб зберігалася структура ходів із кількома користувачами.

### Коли вмикати

Увімкніть, якщо:

- Ви постачаєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
- Ваші користувачі вставляють URL, зображення або довгий вміст разом із командами.
- Ви можете прийняти додаткову затримку ходу в DM (див. нижче).

Залишайте вимкненим, якщо:

- Вам потрібна мінімальна затримка команди для однословних тригерів у DM.
- Усі ваші сценарії — це одноразові команди без подальшого payload.

### Увімкнення

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // увімкнути (типово: false)
    },
  },
}
```

Якщо прапорець увімкнено й явний `messages.inbound.byChannel.bluebubbles` не задано, вікно debounce розширюється до **2500 ms** (типове значення без об’єднання — 500 ms). Ширше вікно потрібне обов’язково — ритм розділеного надсилання Apple у 0.8-2.0 с не вкладається в жорсткіше типове значення.

Щоб налаштувати вікно вручну:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms працює для більшості середовищ; збільшіть до 4000 ms, якщо ваш Mac повільний
        // або перебуває під тиском пам’яті (спостережуваний інтервал тоді може перевищувати 2 с).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Компроміси

- **Додаткова затримка для керувальних команд у DM.** Якщо прапорець увімкнено, повідомлення з керувальними командами в DM (наприклад, `Dump`, `Save` тощо) тепер чекають до завершення debounce-вікна перед відправленням, на випадок якщо надійде Webhook із payload. Команди в групових чатах і далі відправляються миттєво.
- **Об’єднаний результат має обмеження** — об’єднаний текст обмежується 4000 символами з явною позначкою `…[truncated]`; вкладення — 20; записи джерела — 10 (понад це зберігаються перший і найновіший). Кожен вихідний `messageId` усе одно доходить до вхідного дедуплікування, тож пізніше повторне відтворення будь-якої окремої події через MessagePoller буде розпізнано як дублікат.
- **Опціонально, для кожного каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються.

### Сценарії й те, що бачить агент

| Користувач складає повідомлення                                     | Apple доставляє          | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 ms                                      |
| ------------------------------------------------------------------- | ------------------------ | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (одне надсилання)                        | 2 Webhook-и ~1 с apart  | Два ходи агента: лише "Dump", потім URL | Один хід: об’єднаний текст `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (вкладення + текст)                 | 2 Webhook-и              | Два ходи                                | Один хід: текст + зображення                                             |
| `/status` (окрема команда)                                          | 1 Webhook                | Миттєве відправлення                    | **Чекає до завершення вікна, потім відправляється**                      |
| Лише вставлений URL                                                 | 1 Webhook                | Миттєве відправлення                    | Миттєве відправлення (у bucket лише один запис)                          |
| Текст + URL надіслані як два навмисно окремі повідомлення з хвилинами між ними | 2 Webhook-и поза вікном | Два ходи                                | Два ходи (між ними спливає вікно)                                        |
| Швидкий потік (>10 малих DM у межах вікна)                          | N Webhook-ів             | N ходів                                 | Один хід, обмежений результат (застосовуються перший + останній, ліміти тексту/вкладень) |

### Усунення несправностей об’єднання розділених надсилань

Якщо прапорець увімкнено, але розділені надсилання все одно надходять як два ходи, перевірте кожен рівень:

1. **Конфігурацію справді завантажено.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Потім `openclaw gateway restart` — прапорець зчитується під час створення реєстру debouncer.

2. **Debounce-вікно достатньо широке для вашого середовища.** Подивіться журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Виміряйте інтервал між відправленням тексту на кшталт `"Dump"` і наступним відправленням `"https://..."; Attachments:`. Збільшіть `messages.inbound.byChannel.bluebubbles`, щоб воно впевнено покривало цей інтервал.

3. **Мітки часу session JSONL ≠ надходження Webhook.** Мітки часу подій сесії (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають момент, коли Gateway передає повідомлення агенту, **а не** коли прибув Webhook. Поставлене в чергу друге повідомлення з позначкою `[Queued messages while agent was busy]` означає, що перший хід усе ще виконувався, коли надійшов другий Webhook — bucket об’єднання вже було скинуто. Налаштовуйте вікно за журналом сервера BB, а не за журналом сесії.

4. **Тиск пам’яті уповільнює відправлення відповіді.** На менших машинах (8 GB) ходи агента можуть тривати настільки довго, що bucket об’єднання скидається до завершення відповіді, і URL потрапляє в чергу як другий хід. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway споживає понад ~500 MB RSS і компресор активний, закрийте інші важкі процеси або перейдіть на потужніший хост.

5. **Надсилання як цитована відповідь — це інший шлях.** Якщо користувач натиснув `Dump` як **відповідь** на наявну бульбашку URL (iMessage показує бейдж "1 Reply" на бульбашці Dump), URL міститься в `replyToBody`, а не в другому Webhook. Об’єднання тут не застосовується — це питання Skill/промпта, а не debouncer.

## Блокове потокове передавання

Керуйте тим, чи відповіді надсилаються як одне повідомлення, чи потоково блоками:

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

- Вхідні вкладення завантажуються й зберігаються в медіакеші.
- Обмеження медіа задається через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 MB).
- Вихідний текст розбивається на частини за `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідка з конфігурації

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Параметри провайдера:

- `channels.bluebubbles.enabled`: Увімкнути/вимкнути канал.
- `channels.bluebubbles.serverUrl`: Базовий URL REST API BlueBubbles.
- `channels.bluebubbles.password`: Пароль API.
- `channels.bluebubbles.webhookPath`: Шлях endpoint Webhook (типово: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
- `channels.bluebubbles.allowFrom`: Список дозволених для DM (дескриптори, email-адреси, номери E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Список дозволених відправників для груп.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: На macOS необов’язково збагачує неіменованих учасників групи з локальних Contacts після проходження фільтрів. Типово: `false`.
- `channels.bluebubbles.groups`: Конфігурація для кожної групи (`requireMention` тощо).
- `channels.bluebubbles.sendReadReceipts`: Надсилати сповіщення про прочитання (типово: `true`).
- `channels.bluebubbles.blockStreaming`: Увімкнути блокове потокове передавання (типово: `false`; потрібне для потокових відповідей).
- `channels.bluebubbles.textChunkLimit`: Розмір вихідного фрагмента в символах (типово: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Тайм-аут на запит у мс для вихідного надсилання тексту через `/api/v1/message/text` (типово: 30000). Збільшуйте на середовищах macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворка iMessage; наприклад, `45000` або `60000`. Проби, пошук чатів, реакції, редагування та перевірки стану наразі зберігають коротший типовий тайм-аут 10 с; розширення цього покриття на реакції та редагування заплановане окремо. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише при перевищенні `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.bluebubbles.mediaMaxMb`: Обмеження вхідних/вихідних медіа в MB (типово: 8).
- `channels.bluebubbles.mediaLocalRoots`: Явний список дозволених абсолютних локальних каталогів для вихідних шляхів до локальних медіафайлів. Надсилання за локальними шляхами типово заборонене, якщо це не налаштовано. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Об’єднувати послідовні DM Webhook-и від одного відправника в один хід агента, щоб розділене Apple надсилання тексту+URL надходило як одне повідомлення (типово: `false`). Див. [Coalescing split-send DMs](#coalescing-split-send-dms-command--url-in-one-composition) щодо сценаріїв, налаштування вікна та компромісів. Коли ввімкнено без явного `messages.inbound.byChannel.bluebubbles`, розширює типове debounce-вікно для вхідних повідомлень з 500 ms до 2500 ms.
- `channels.bluebubbles.historyLimit`: Максимальна кількість групових повідомлень для контексту (0 вимикає).
- `channels.bluebubbles.dmHistoryLimit`: Ліміт історії DM.
- `channels.bluebubbles.actions`: Увімкнути/вимкнути окремі дії.
- `channels.bluebubbles.accounts`: Конфігурація для кількох облікових записів.

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Для стабільної маршрутизації віддавайте перевагу `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (рекомендовано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі дескриптори: `+15555550123`, `user@example.com`
  - Якщо для прямого дескриптора немає наявного DM-чату, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно, щоб було ввімкнено BlueBubbles Private API.

### Маршрутизація iMessage і SMS

Коли той самий дескриптор має на Mac і чат iMessage, і чат SMS (наприклад, номер телефону, зареєстрований в iMessage, але який також отримував fallback-повідомлення в зелених бульбашках), OpenClaw віддає перевагу чату iMessage і ніколи не знижує непомітно до SMS. Щоб примусово використати чат SMS, застосуйте явний префікс цілі `sms:` (наприклад, `sms:+15555550123`). Дескриптори без відповідного чату iMessage все одно надсилаються через той чат, який повертає BlueBubbles.

## Безпека

- Запити Webhook автентифікуються порівнянням параметрів запиту `guid`/`password` або заголовків із `channels.bluebubbles.password`.
- Зберігайте пароль API і endpoint Webhook у таємниці (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу через localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles у запиті від початку до кінця. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Gateway security](/uk/gateway/security#reverse-proxy-configuration).
- Увімкніть HTTPS + правила firewall на сервері BlueBubbles, якщо відкриваєте його за межі вашої LAN.

## Усунення несправностей

- Якщо перестали працювати події введення/прочитання, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway збігається з `channels.bluebubbles.webhookPath`.
- Коди сполучення спливають через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Реакції потребують BlueBubbles private API (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Edit/unsend потребують macOS 13+ і сумісної версії сервера BlueBubbles. На macOS 26 (Tahoe) редагування наразі не працює через зміни private API.
- Оновлення іконок груп можуть бути нестабільними на macOS 26 (Tahoe): API може повертати успіх, але нова іконка не синхронізується.
- OpenClaw автоматично приховує дії, які відомо як несправні, на основі версії macOS сервера BlueBubbles. Якщо edit усе ще відображається на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад, `Dump` + URL) усе одно надходять як два ходи: див. контрольний список [усунення несправностей об’єднання розділених надсилань](#split-send-coalescing-troubleshooting) — типовими причинами є надто вузьке debounce-вікно, хибне тлумачення міток часу журналу сесії як часу надходження Webhook або надсилання як цитованої відповіді (де використовується `replyToBody`, а не другий Webhook).
- Для інформації про статус/стан: `openclaw status --all` або `openclaw status --deep`.

Для загальної довідки щодо робочого процесу каналів див. [Channels](/uk/channels) і посібник [Plugins](/uk/tools/plugin).

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Groups](/uk/channels/groups) — поведінка групових чатів і фільтрація за згадуванням
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення захисту
