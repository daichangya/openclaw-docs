---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення несправностей сполучення Webhook
    - Налаштування iMessage на macOS
summary: iMessage через сервер BlueBubbles для macOS (REST надсилання/отримання, індикатор набору, реакції, сполучення, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T06:42:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Статус: вбудований Plugin, який взаємодіє із сервером BlueBubbles для macOS через HTTP. **Рекомендовано для інтеграції iMessage** завдяки багатшому API та простішому налаштуванню порівняно зі застарілим каналом imsg.

## Вбудований Plugin

Поточні релізи OpenClaw містять BlueBubbles у комплекті, тому звичайним пакетованим збіркам не
потрібен окремий крок `openclaw plugins install`.

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування наразі не працює на Tahoe, а оновлення значка групи можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через його REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через Webhook; вихідні відповіді, індикатори набору, сповіщення про прочитання та tapback — це REST-виклики.
- Вкладення та стікери обробляються як вхідні медіа (і, коли можливо, передаються агенту).
- Сполучення/allowlist працює так само, як і в інших каналах (`/channels/pairing` тощо) з `channels.bluebubbles.allowFrom` + кодами сполучення.
- Реакції відображаються як системні події так само, як у Slack/Telegram, щоб агенти могли "згадати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, відповіді в тредах, ефекти повідомлень, керування групами.

## Швидкий старт

1. Встановіть сервер BlueBubbles на вашому Mac (дотримуйтесь інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
2. У конфігурації BlueBubbles увімкніть Web API і задайте пароль.
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
- Автентифікація Webhook завжди обов’язкова. OpenClaw відхиляє запити Webhook BlueBubbles, якщо вони не містять пароль/guid, що відповідає `channels.bluebubbles.password` (наприклад `?password=<password>` або `x-password`), незалежно від топології loopback/проксі.
- Автентифікація за паролем перевіряється до читання/розбору повних тіл Webhook.

## Підтримка Messages.app в активному стані (VM / headless-середовища)

У деяких середовищах macOS VM / always-on Messages.app може перейти в стан “idle” (вхідні події припиняються, доки застосунок не буде відкрито/виведено на передній план). Простий обхідний шлях — **торкатися Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

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
- Під час першого запуску можуть з’явитися запити macOS **Automation** (`osascript` → Messages). Підтвердьте їх у тій самій користувацькій сесії, у якій запускається LaunchAgent.

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
- **Password** (обов’язково): пароль API з налаштувань сервера BlueBubbles
- **Webhook path** (необов’язково): типове значення `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open або disabled
- **Allow list**: номери телефонів, електронні адреси або цілі чату

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Керування доступом (DM + групи)

DM:

- Типове значення: `channels.bluebubbles.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються до схвалення (термін дії кодів спливає через 1 годину).
- Схвалення через:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Сполучення — це типовий обмін токенами. Деталі: [Pairing](/uk/channels/pairing)

Групи:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (типове значення: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` визначає, хто може запускати дії в групах, коли встановлено `allowlist`.

### Розширення імен контактів (macOS, необов’язково)

Webhook груп BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` замість цього показував локальні імена контактів, ви можете ввімкнути локальне збагачення з Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. Типове значення: `false`.
- Пошук виконується лише після того, як повідомлення пройшло перевірки доступу до групи, авторизації команд і вимоги згадування.
- Збагачуються лише безіменні телефонні учасники.
- Сирі номери телефонів залишаються резервним варіантом, якщо локального збігу не знайдено.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Вимога згадування (групи)

BlueBubbles підтримує вимогу згадування для групових чатів, що відповідає поведінці iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадувань.
- Коли для групи ввімкнено `requireMention`, агент відповідає лише тоді, коли його згадано.
- Керівні команди від авторизованих відправників обходять вимогу згадування.

Налаштування для окремих груп:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // типове значення для всіх груп
        "iMessage;-;chat123": { requireMention: false }, // перевизначення для конкретної групи
      },
    },
  },
}
```

### Обмеження команд

- Керівні команди (наприклад, `/config`, `/model`) потребують авторизації.
- Для визначення авторизації команд використовуються `allowFrom` і `groupAllowFrom`.
- Авторизовані відправники можуть запускати керівні команди навіть без згадування в групах.

### Системний промпт для окремої групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Це значення додається до системного промпту агента на кожному ході, який обробляє повідомлення в цій групі, тож ви можете задавати поведінку або persona для окремої групи без редагування промптів агента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Зберігай відповіді в межах 3 речень. Віддзеркалюй невимушений тон групи.",
        },
      },
    },
  },
}
```

Ключ відповідає тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а запис із підстановкою `"*"` задає типове значення для кожної групи без точного збігу (той самий шаблон використовується для `requireMention` і політик інструментів для окремих груп). Точні збіги завжди мають пріоритет над підстановкою. Це поле ігнорується для DM; натомість використовуйте налаштування промптів на рівні агента або облікового запису.

#### Приклад: відповіді в тредах і реакції tapback (Private API)

Коли в BlueBubbles увімкнено Private API, вхідні повідомлення надходять із короткими ідентифікаторами повідомлень (наприклад, `[[reply_to:5]]`), і агент може викликати `action=reply`, щоб відповісти на конкретне повідомлення в треді, або `action=react`, щоб поставити tapback. `systemPrompt` для окремої групи — надійний спосіб спрямувати агента на вибір правильного інструмента:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Коли відповідаєш у цій групі, завжди викликай action=reply з",
            "messageId у форматі [[reply_to:N]] з контексту, щоб твоя відповідь ішла",
            "під повідомленням, яке її викликало. Ніколи не надсилай нове непов’язане повідомлення.",
            "",
            "Для коротких підтверджень ('ok', 'got it', 'on it') використовуй",
            "action=react з відповідним emoji tapback (❤️, 👍, 😂, ‼️, ❓)",
            "замість надсилання текстової відповіді.",
          ].join(" "),
        },
      },
    },
  },
}
```

І tapback-реакції, і відповіді в тредах потребують BlueBubbles Private API; див. [Advanced actions](#advanced-actions) і [Message IDs](#message-ids-short-vs-full), щоб зрозуміти базову механіку.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на довговічні робочі простори ACP без зміни транспортного шару.

Швидкий операторський сценарій:

- Виконайте `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в цій самій розмові BlueBubbles спрямовуватимуться до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Також підтримуються налаштовані постійні прив’язки через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований DM-ідентифікатор, наприклад `+15555550123` або `user@example.com`
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

Див. [ACP Agents](/uk/tools/acp-agents), щоб ознайомитися зі спільною поведінкою прив’язок ACP.

## Індикатор набору + сповіщення про прочитання

- **Індикатори набору**: надсилаються автоматично до і під час генерації відповіді.
- **Сповіщення про прочитання**: керуються через `channels.bluebubbles.sendReadReceipts` (типове значення: `true`).
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

BlueBubbles підтримує розширені дії з повідомленнями, якщо їх увімкнено в конфігурації:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback-реакції (типово: true)
        edit: true, // редагування надісланих повідомлень (macOS 13+, не працює на macOS 26 Tahoe)
        unsend: true, // скасування надсилання повідомлень (macOS 13+)
        reply: true, // відповіді в тредах за GUID повідомлення
        sendWithEffect: true, // ефекти повідомлень (slam, loud тощо)
        renameGroup: true, // перейменування групових чатів
        setGroupIcon: true, // установлення значка/фото групового чату (нестабільно на macOS 26 Tahoe)
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

- **react**: додавання/видалення tapback-реакцій (`messageId`, `emoji`, `remove`). Рідний набір tapback в iMessage — `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає emoji поза цим набором (наприклад, `👀`), інструмент реакцій повертається до `love`, щоб tapback усе одно відобразився замість збою всього запиту. Налаштовані ack-реакції, як і раніше, проходять сувору валідацію та повертають помилку для невідомих значень.
- **edit**: редагування надісланого повідомлення (`messageId`, `text`)
- **unsend**: скасування надсилання повідомлення (`messageId`)
- **reply**: відповідь на конкретне повідомлення (`messageId`, `text`, `to`)
- **sendWithEffect**: надсилання з ефектом iMessage (`text`, `to`, `effectId`)
- **renameGroup**: перейменування групового чату (`chatGuid`, `displayName`)
- **setGroupIcon**: установлення значка/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повертати успіх, але значок не синхронізується).
- **addParticipant**: додавання когось до групи (`chatGuid`, `address`)
- **removeParticipant**: видалення когось із групи (`chatGuid`, `address`)
- **leaveGroup**: вихід із групового чату (`chatGuid`)
- **upload-file**: надсилання медіа/файлів (`to`, `buffer`, `filename`, `asVoice`)
  - Голосові повідомлення: задайте `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати його як голосове повідомлення iMessage. BlueBubbles перетворює MP3 → CAF під час надсилання голосових повідомлень.
- Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` — це канонічна назва дії.

### Ідентифікатори повідомлень (короткі й повні)

OpenClaw може показувати _короткі_ ідентифікатори повідомлень (наприклад, `1`, `2`) для економії токенів.

- `MessageSid` / `ReplyToId` можуть бути короткими ідентифікаторами.
- `MessageSidFull` / `ReplyToIdFull` містять повні ідентифікатори провайдера.
- Короткі ідентифікатори зберігаються в пам’яті; вони можуть зникнути після перезапуску або очищення кешу.
- Дії приймають короткий або повний `messageId`, але короткі ідентифікатори спричинять помилку, якщо більше недоступні.

Використовуйте повні ідентифікатори для довговічних автоматизацій і зберігання:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Configuration](/uk/gateway/configuration), щоб ознайомитися зі змінними шаблонів.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання розділених DM-надсилань (команда + URL в одному повідомленні)

Коли користувач вводить команду й URL разом в iMessage — наприклад, `Dump https://example.com/article` — Apple розділяє надсилання на **дві окремі доставки Webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Картка попереднього перегляду URL (`"https://..."`) із зображеннями OG preview як вкладеннями.

Ці два Webhook надходять до OpenClaw з інтервалом приблизно ~0.8-2.0 с у більшості середовищ. Без об’єднання агент отримує лише команду на ході 1, відповідає (часто "надішли мені URL"), а URL бачить лише на ході 2 — коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` дає змогу об’єднувати послідовні Webhook від того самого відправника в DM в один хід агента. Для групових чатів ключування, як і раніше, відбувається на рівні окремого повідомлення, щоб зберегти структуру ходів кількох користувачів.

### Коли вмикати

Увімкніть, якщо:

- Ви постачаєте Skills, які очікують `команда + payload` в одному повідомленні (dump, paste, save, queue тощо).
- Ваші користувачі вставляють URL, зображення або довгий вміст разом із командами.
- Ви можете прийняти додаткову затримку ходу в DM (див. нижче).

Залиште вимкненим, якщо:

- Вам потрібна мінімальна затримка команд для однословних DM-тригерів.
- Усі ваші сценарії — це одноразові команди без подальших payload.

### Увімкнення

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // увімкнення (типово: false)
    },
  },
}
```

Коли прапорець увімкнено й явного `messages.inbound.byChannel.bluebubbles` немає, вікно debounce розширюється до **2500 ms** (типове значення без об’єднання — 500 ms). Ширше вікно потрібне обов’язково — ритм розділеного надсилання Apple у 0.8-2.0 с не вкладається в щільніше типове вікно.

Щоб налаштувати вікно вручну:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms працює в більшості середовищ; збільште до 4000 ms, якщо ваш Mac повільний
        // або відчуває тиск на пам’ять (у такому разі спостережуваний інтервал може перевищувати 2 с).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Компроміси

- **Додаткова затримка для керівних команд у DM.** Коли прапорець увімкнено, повідомлення DM із керівними командами (наприклад, `Dump`, `Save` тощо) тепер чекають до завершення вікна debounce перед відправленням, якщо очікується надходження Webhook із payload. Команди в групових чатах, як і раніше, відправляються миттєво.
- **Об’єднаний результат має обмеження** — об’єднаний текст обмежено 4000 символами з явною позначкою `…[truncated]`; вкладення — до 20; вихідні записи — до 10 (понад це зберігаються перший і найновіший). Кожен вихідний `messageId` усе одно потрапляє в inbound-dedupe, тож пізніше повторне відтворення будь-якої окремої події через MessagePoller буде розпізнано як дублікат.
- **Явне ввімкнення, для окремого каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не змінюються.

### Сценарії та що бачить агент

| Що вводить користувач                                               | Що доставляє Apple        | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 ms                                     |
| ------------------------------------------------------------------- | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (одне надсилання)                        | 2 Webhook з інтервалом ~1 с | Два ходи агента: лише "Dump", потім URL | Один хід: об’єднаний текст `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (вкладення + текст)                 | 2 Webhook                 | Два ходи                                | Один хід: текст + зображення                                             |
| `/status` (окрема команда)                                          | 1 Webhook                 | Миттєве відправлення                    | **Очікування до завершення вікна, потім відправлення**                   |
| Вставлено лише URL                                                  | 1 Webhook                 | Миттєве відправлення                    | Миттєве відправлення (у бакеті лише один запис)                          |
| Текст + URL, надіслані як два навмисно окремі повідомлення з інтервалом у хвилини | 2 Webhook поза вікном     | Два ходи                                | Два ходи (між ними спливає вікно)                                        |
| Швидкий потік (>10 малих DM у межах вікна)                          | N Webhook                 | N ходів                                 | Один хід, обмежений результат (застосовано ліміти перший + найновіший, текст/вкладення) |

### Усунення несправностей об’єднання розділених надсилань

Якщо прапорець увімкнено, але розділені надсилання все одно надходять як два ходи, перевірте кожен рівень:

1. **Конфігурацію справді завантажено.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Потім `openclaw gateway restart` — прапорець зчитується під час створення реєстру debounce.

2. **Вікно debounce достатньо широке для вашого середовища.** Подивіться журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Виміряйте інтервал між доставкою тексту на кшталт `"Dump"` і наступною доставкою `"https://..."; Attachments:`. Збільшіть `messages.inbound.byChannel.bluebubbles`, щоб воно з запасом покривало цей інтервал.

3. **Часові позначки session JSONL ≠ надходження Webhook.** Часові позначки подій сесії (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають момент, коли Gateway передає повідомлення агенту, **а не** коли надійшов Webhook. Якщо друге повідомлення в черзі має позначку `[Queued messages while agent was busy]`, це означає, що перший хід ще виконувався, коли надійшов другий Webhook — бакет об’єднання вже встиг скинутися. Налаштовуйте вікно за журналом сервера BB, а не за журналом сесії.

4. **Тиск на пам’ять сповільнює відправлення відповіді.** На менших машинах (8 GB) ходи агента можуть тривати так довго, що бакет об’єднання скидається до завершення відповіді, і URL потрапляє в чергу як другий хід. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway споживає понад ~500 MB RSS і Compaction активний, закрийте інші важкі процеси або перейдіть на потужніший хост.

5. **Надсилання з відповіддю-цитатою — це інший шлях.** Якщо користувач натиснув `Dump` як **відповідь** на наявну картку URL (в iMessage на бульбашці Dump з’являється позначка "1 Reply"), URL міститься в `replyToBody`, а не в другому Webhook. Об’єднання тут не застосовується — це питання Skills/промпту, а не debounce.

## Блокове потокове передавання

Керуйте тим, чи відповіді надсилаються як одне повідомлення, чи передаються потоково блоками:

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

- Вхідні вкладення завантажуються й зберігаються в кеші медіа.
- Обмеження медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 MB).
- Вихідний текст розбивається на частини за `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник конфігурації

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Параметри провайдера:

- `channels.bluebubbles.enabled`: увімкнення/вимкнення каналу.
- `channels.bluebubbles.serverUrl`: базовий URL REST API BlueBubbles.
- `channels.bluebubbles.password`: пароль API.
- `channels.bluebubbles.webhookPath`: шлях endpoint Webhook (типово: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlist для DM (ідентифікатори, email, номери у форматі E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlist відправників для груп.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: на macOS необов’язково збагачує безіменних учасників групи з локальних Contacts після проходження перевірок доступу. Типове значення: `false`.
- `channels.bluebubbles.groups`: конфігурація для окремих груп (`requireMention` тощо).
- `channels.bluebubbles.sendReadReceipts`: надсилання сповіщень про прочитання (типово: `true`).
- `channels.bluebubbles.blockStreaming`: увімкнення блокового потокового передавання (типово: `false`; обов’язково для потокових відповідей).
- `channels.bluebubbles.textChunkLimit`: розмір вихідного фрагмента в символах (типово: 4000).
- `channels.bluebubbles.sendTimeoutMs`: тайм-аут на запит у мс для вихідного надсилання тексту через `/api/v1/message/text` (типово: 30000). Збільште на системах macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд усередині фреймворку iMessage; наприклад, до `45000` або `60000`. Наразі probes, пошук чатів, реакції, редагування та перевірки працездатності зберігають коротший типовий тайм-аут у 10 с; розширення цього покриття на реакції та редагування заплановано як наступне доопрацювання. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (типово) розбиває тільки при перевищенні `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) до розбиття за довжиною.
- `channels.bluebubbles.mediaMaxMb`: ліміт вхідних/вихідних медіа в MB (типово: 8).
- `channels.bluebubbles.mediaLocalRoots`: явний allowlist абсолютних локальних каталогів, дозволених для вихідних шляхів до локальних медіа. Надсилання локальних шляхів типово заборонено, якщо це не налаштовано. Перевизначення для окремого облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: об’єднує послідовні DM-Webhook від одного відправника в один хід агента, щоб розділене Apple надсилання текст+URL надходило як одне повідомлення (типово: `false`). Див. [Coalescing split-send DMs](#coalescing-split-send-dms-command--url-in-one-composition) для сценаріїв, налаштування вікна та компромісів. Розширює типове вхідне вікно debounce з 500 ms до 2500 ms, якщо ввімкнено без явного `messages.inbound.byChannel.bluebubbles`.
- `channels.bluebubbles.historyLimit`: максимальна кількість групових повідомлень для контексту (0 вимикає).
- `channels.bluebubbles.dmHistoryLimit`: ліміт історії DM.
- `channels.bluebubbles.actions`: увімкнення/вимкнення окремих дій.
- `channels.bluebubbles.accounts`: конфігурація кількох облікових записів.

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Для стабільної маршрутизації віддавайте перевагу `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (бажано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі ідентифікатори: `+15555550123`, `user@example.com`
  - Якщо для прямого ідентифікатора немає наявного DM-чату, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно, щоб у BlueBubbles був увімкнений Private API.

### Маршрутизація iMessage проти SMS

Коли для одного й того самого ідентифікатора на Mac існують і чат iMessage, і чат SMS (наприклад, номер телефону, зареєстрований в iMessage, але який також отримував fallback-повідомлення із зеленими бульбашками), OpenClaw віддає перевагу чату iMessage і ніколи не знижує рівень до SMS безшумно. Щоб примусово використати чат SMS, задайте явний префікс цілі `sms:` (наприклад `sms:+15555550123`). Ідентифікатори без відповідного чату iMessage однаково надсилаються через той чат, який повідомляє BlueBubbles.

## Безпека

- Запити Webhook автентифікуються шляхом порівняння параметрів запиту `guid`/`password` або заголовків із `channels.bluebubbles.password`.
- Тримайте пароль API і endpoint Webhook у секреті (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу через localhost. Якщо ви проксіюєте трафік Webhook, передавайте пароль BlueBubbles в запиті наскрізно. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Gateway security](/uk/gateway/security#reverse-proxy-configuration).
- Увімкніть HTTPS + правила брандмауера на сервері BlueBubbles, якщо відкриваєте його за межі вашої LAN.

## Усунення несправностей

- Якщо події набору/прочитання перестали працювати, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Термін дії кодів сполучення спливає через одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Реакції потребують BlueBubbles Private API (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- `edit`/`unsend` потребують macOS 13+ і сумісної версії сервера BlueBubbles. На macOS 26 (Tahoe) `edit` наразі не працює через зміни в private API.
- Оновлення значка групи можуть бути нестабільними на macOS 26 (Tahoe): API може повертати успіх, але новий значок не синхронізується.
- OpenClaw автоматично приховує дії, які точно не працюють, на основі версії macOS сервера BlueBubbles. Якщо `edit` усе ще відображається на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад `Dump` + URL) усе одно надходять як два ходи: див. перелік [усунення несправностей об’єднання розділених надсилань](#split-send-coalescing-troubleshooting) — поширені причини: надто вузьке вікно debounce, неправильне трактування часових позначок журналу сесії як часу надходження Webhook або надсилання з відповіддю-цитатою (яке використовує `replyToBody`, а не другий Webhook).
- Для інформації про статус/стан: `openclaw status --all` або `openclaw status --deep`.

Загальні відомості про робочий процес каналів див. у [Channels](/uk/channels) і в довіднику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Groups](/uk/channels/groups) — поведінка групових чатів і вимога згадування
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та зміцнення безпеки
