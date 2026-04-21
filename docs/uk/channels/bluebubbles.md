---
read_when:
    - Налаштування каналу BlueBubbles
    - Усунення проблем зі сполученням у пару через Webhook
    - Налаштування iMessage на macOS
summary: iMessage через сервер BlueBubbles macOS (REST-надсилання/отримання, введення, реакції, сполучення в пару, розширені дії).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T20:11:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Статус: вбудований Plugin, який взаємодіє із сервером BlueBubbles macOS через HTTP. **Рекомендовано для інтеграції з iMessage** завдяки багатшому API та простішому налаштуванню порівняно із застарілим каналом imsg.

## Вбудований Plugin

Поточні випуски OpenClaw містять BlueBubbles у комплекті, тому звичайним пакетним збіркам не
потрібен окремий крок `openclaw plugins install`.

## Огляд

- Працює на macOS через допоміжний застосунок BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Рекомендовано/протестовано: macOS Sequoia (15). macOS Tahoe (26) працює; редагування зараз не працює на Tahoe, а оновлення іконок груп можуть повідомляти про успіх, але не синхронізуватися.
- OpenClaw взаємодіє з ним через REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Вхідні повідомлення надходять через Webhook; вихідні відповіді, індикатори введення, підтвердження прочитання та tapback — це REST-виклики.
- Вкладення та стікери обробляються як вхідні медіафайли (і передаються агенту, коли це можливо).
- Сполучення в пару/список дозволених працює так само, як і в інших каналах (`/channels/pairing` тощо) з `channels.bluebubbles.allowFrom` + кодами сполучення.
- Реакції відображаються як системні події так само, як у Slack/Telegram, тож агенти можуть "згадувати" їх перед відповіддю.
- Розширені можливості: редагування, скасування надсилання, гілки відповідей, ефекти повідомлень, керування групами.

## Швидкий старт

1. Установіть сервер BlueBubbles на своєму Mac (дотримуйтесь інструкцій на [bluebubbles.app/install](https://bluebubbles.app/install)).
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

4. Спрямуйте BlueBubbles Webhook на ваш Gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Запустіть Gateway; він зареєструє обробник Webhook і почне сполучення в пару.

Примітка щодо безпеки:

- Завжди задавайте пароль Webhook.
- Автентифікація Webhook завжди обов’язкова. OpenClaw відхиляє запити Webhook BlueBubbles, якщо вони не містять пароль/guid, що відповідає `channels.bluebubbles.password` (наприклад, `?password=<password>` або `x-password`), незалежно від топології loopback/проксі.
- Автентифікація за паролем перевіряється до читання/розбору повних тіл Webhook.

## Підтримання Messages.app активним (VM / headless-середовища)

У деяких середовищах macOS VM / always-on Messages.app може перейти в “idle” (вхідні події припиняються, доки застосунок не буде відкрито/виведено на передній план). Просте обхідне рішення — **торкатися Messages кожні 5 хвилин** за допомогою AppleScript + LaunchAgent.

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
- Перший запуск може викликати запити macOS **Automation** (`osascript` → Messages). Підтвердьте їх у тій самій користувацькій сесії, у якій працює LaunchAgent.

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
- **Шлях Webhook** (необов’язково): типове значення `/bluebubbles-webhook`
- **Політика DM**: pairing, allowlist, open або disabled
- **Список дозволених**: телефонні номери, електронні адреси або цілі чату

Ви також можете додати BlueBubbles через CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Керування доступом (DM + групи)

DM:

- Типово: `channels.bluebubbles.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення в пару; повідомлення ігноруються до схвалення (коди діють 1 годину).
- Схвалення через:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Сполучення в пару — типовий обмін токенами. Докладніше: [Сполучення в пару](/uk/channels/pairing)

Групи:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` визначає, хто може запускати обробку в групах, коли встановлено `allowlist`.

### Збагачення імен контактів (macOS, необов’язково)

Webhook груп BlueBubbles часто містять лише сирі адреси учасників. Якщо ви хочете, щоб контекст `GroupMembers` натомість показував локальні імена контактів, можна ввімкнути локальне збагачення з Contacts на macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` вмикає пошук. Типове значення: `false`.
- Пошук виконується лише після того, як доступ до групи, авторизація команди та згадка дозволили пропустити повідомлення.
- Збагачуються лише безіменні телефонні учасники.
- Сирі телефонні номери лишаються резервним варіантом, якщо локального збігу не знайдено.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Фільтрація за згадками (групи)

BlueBubbles підтримує фільтрацію за згадками для групових чатів, як і iMessage/WhatsApp:

- Використовує `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`) для виявлення згадок.
- Коли для групи ввімкнено `requireMention`, агент відповідає лише тоді, коли його згадано.
- Керівні команди від авторизованих відправників оминають фільтрацію за згадками.

Налаштування для кожної групи:

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

### Фільтрація команд

- Керівні команди (наприклад, `/config`, `/model`) потребують авторизації.
- Для визначення авторизації команд використовуються `allowFrom` і `groupAllowFrom`.
- Авторизовані відправники можуть виконувати керівні команди навіть без згадки в групах.

### Системний промпт для кожної групи

Кожен запис у `channels.bluebubbles.groups.*` приймає необов’язковий рядок `systemPrompt`. Значення впроваджується в системний промпт агента на кожному ході, який обробляє повідомлення в цій групі, тож ви можете задати для кожної групи образ або правила поведінки без редагування промптів агента:

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

Ключ має відповідати тому, що BlueBubbles повідомляє як `chatGuid` / `chatIdentifier` / числовий `chatId` для групи, а запис-шаблон `"*"` задає типове значення для кожної групи без точного збігу (той самий шаблон використовується для `requireMention` і політик інструментів для кожної групи). Точні збіги завжди мають пріоритет над шаблоном. DM ігнорують це поле; натомість використовуйте налаштування промптів на рівні агента або облікового запису.

#### Практичний приклад: гілки відповідей і tapback-реакції (Private API)

Якщо увімкнено BlueBubbles Private API, вхідні повідомлення надходять із короткими ідентифікаторами повідомлень (наприклад, `[[reply_to:5]]`), а агент може викликати `action=reply`, щоб відповісти в конкретну гілку повідомлення, або `action=react`, щоб залишити tapback. `systemPrompt` для кожної групи — надійний спосіб змусити агента вибирати правильний інструмент:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Коли відповідаєш у цій групі, завжди викликай action=reply з",
            "messageId у форматі [[reply_to:N]] з контексту, щоб твоя відповідь ішла",
            "під повідомленням-тригером. Ніколи не надсилай нове непов’язане повідомлення.",
            "",
            "Для коротких підтверджень ('ok', 'got it', 'on it') використовуй",
            "action=react з відповідним tapback-емодзі (❤️, 👍, 😂, ‼️, ❓)",
            "замість надсилання текстової відповіді.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback-реакції та відповіді в гілках обидва потребують BlueBubbles Private API; див. [Розширені дії](#advanced-actions) і [Ідентифікатори повідомлень](#message-ids-short-vs-full) для пояснення базової механіки.

## Прив’язки розмов ACP

Чати BlueBubbles можна перетворити на постійні робочі простори ACP без зміни транспортного рівня.

Швидкий операторський сценарій:

- Виконайте `/acp spawn codex --bind here` у цьому DM або дозволеному груповому чаті.
- Майбутні повідомлення в цій самій розмові BlueBubbles спрямовуватимуться до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Також підтримуються налаштовані постійні прив’язки через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "bluebubbles"`.

`match.peer.id` може використовувати будь-яку підтримувану форму цілі BlueBubbles:

- нормалізований DM-ідентифікатор, наприклад `+15555550123` або `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Для стабільних прив’язок груп краще використовувати `chat_id:*` або `chat_identifier:*`.

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

## Введення + підтвердження прочитання

- **Індикатори введення**: надсилаються автоматично до та під час генерації відповіді.
- **Підтвердження прочитання**: керуються через `channels.bluebubbles.sendReadReceipts` (типово: `true`).
- **Індикатори введення**: OpenClaw надсилає події початку введення; BlueBubbles автоматично очищує стан введення після надсилання або тайм-ауту (ручна зупинка через DELETE ненадійна).

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
        edit: true, // редагування надісланих повідомлень (macOS 13+, не працює на macOS 26 Tahoe)
        unsend: true, // скасування надсилання повідомлень (macOS 13+)
        reply: true, // гілки відповідей за GUID повідомлення
        sendWithEffect: true, // ефекти повідомлень (slam, loud тощо)
        renameGroup: true, // перейменування групових чатів
        setGroupIcon: true, // встановлення іконки/фото групового чату (нестабільно на macOS 26 Tahoe)
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

- **react**: додавання/видалення tapback-реакцій (`messageId`, `emoji`, `remove`). Вбудований набір tapback в iMessage — це `love`, `like`, `dislike`, `laugh`, `emphasize` і `question`. Коли агент вибирає emoji поза цим набором (наприклад, `👀`), інструмент реакції повертається до `love`, щоб tapback усе одно відобразився замість збою всього запиту. Налаштовані ack-реакції, як і раніше, проходять сувору перевірку та повертають помилку для невідомих значень.
- **edit**: редагування надісланого повідомлення (`messageId`, `text`)
- **unsend**: скасування надсилання повідомлення (`messageId`)
- **reply**: відповідь на конкретне повідомлення (`messageId`, `text`, `to`)
- **sendWithEffect**: надсилання з ефектом iMessage (`text`, `to`, `effectId`)
- **renameGroup**: перейменування групового чату (`chatGuid`, `displayName`)
- **setGroupIcon**: встановлення іконки/фото групового чату (`chatGuid`, `media`) — нестабільно на macOS 26 Tahoe (API може повертати успіх, але іконка не синхронізується).
- **addParticipant**: додавання когось до групи (`chatGuid`, `address`)
- **removeParticipant**: видалення когось із групи (`chatGuid`, `address`)
- **leaveGroup**: вихід із групового чату (`chatGuid`)
- **upload-file**: надсилання медіа/файлів (`to`, `buffer`, `filename`, `asVoice`)
  - Голосові повідомлення: встановіть `asVoice: true` з аудіо **MP3** або **CAF**, щоб надіслати його як голосове повідомлення iMessage. BlueBubbles конвертує MP3 → CAF під час надсилання голосових повідомлень.
- Застарілий псевдонім: `sendAttachment` усе ще працює, але `upload-file` — це канонічна назва дії.

### Ідентифікатори повідомлень (короткі чи повні)

OpenClaw може показувати _короткі_ ідентифікатори повідомлень (наприклад, `1`, `2`) для економії токенів.

- `MessageSid` / `ReplyToId` можуть бути короткими ідентифікаторами.
- `MessageSidFull` / `ReplyToIdFull` містять повні ідентифікатори провайдера.
- Короткі ідентифікатори зберігаються в пам’яті; вони можуть зникати після перезапуску або очищення кешу.
- Дії приймають короткий або повний `messageId`, але короткі ідентифікатори повернуть помилку, якщо більше недоступні.

Для довготривалих автоматизацій і зберігання використовуйте повні ідентифікатори:

- Шаблони: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Контекст: `MessageSidFull` / `ReplyToIdFull` у вхідних payload

Див. [Configuration](/uk/gateway/configuration) щодо змінних шаблонів.

## Злиття розділених DM-надсилань (команда + URL в одній композиції)

Коли користувач вводить команду й URL разом в iMessage — наприклад, `Dump https://example.com/article` — Apple розбиває надсилання на **дві окремі доставки Webhook**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашку попереднього перегляду URL (`"https://..."`) із зображеннями OG-перегляду як вкладеннями.

Ці два Webhook надходять в OpenClaw з інтервалом приблизно 0.8-2.0 с у більшості середовищ. Без злиття агент отримує лише команду на ході 1, відповідає (часто "надішли мені URL"), і лише на ході 2 бачить URL — коли контекст команди вже втрачено.

`channels.bluebubbles.coalesceSameSenderDms` дає змогу для DM об’єднувати послідовні Webhook від одного відправника в один хід агента. Групові чати й далі використовують прив’язку до кожного повідомлення, тому багатокористувацька структура ходів зберігається.

### Коли вмикати

Увімкніть, якщо:

- Ви використовуєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
- Ваші користувачі вставляють URL, зображення або довгий вміст разом із командами.
- Ви можете прийняти додаткову затримку ходу DM (див. нижче).

Залиште вимкненим, якщо:

- Вам потрібна мінімальна затримка команд для однословних тригерів у DM.
- Усі ваші сценарії — це одноразові команди без подальшого payload.

### Увімкнення

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // opt in (типово: false)
    },
  },
}
```

Коли прапорець увімкнено й явне `messages.inbound.byChannel.bluebubbles` не задано, вікно debounce розширюється до **2500 мс** (типове значення для режиму без злиття — 500 мс). Потрібне ширше вікно — ритм розділеного надсилання Apple в межах 0.8-2.0 с не вкладається в стандартне вужче значення.

Щоб налаштувати вікно вручну:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 мс працює для більшості середовищ; підніміть до 4000 мс, якщо ваш Mac повільний
        // або відчуває тиск пам’яті (спостережуваний інтервал тоді може перевищувати 2 с).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Компроміси

- **Додаткова затримка для керівних команд DM.** Коли прапорець увімкнено, повідомлення з керівними командами в DM (наприклад, `Dump`, `Save` тощо) тепер чекають до завершення вікна debounce перед надсиланням далі — на випадок, якщо наближається payload Webhook. Команди в групових чатах і далі надсилаються миттєво.
- **Об’єднаний результат має обмеження** — об’єднаний текст обмежується 4000 символами з явним маркером `…[truncated]`; вкладення — до 20; записи-джерела — до 10 (понад це зберігаються перший і найновіший). Кожен вихідний `messageId` усе одно потрапляє до дедуплікації вхідних даних, тому пізніше відтворення будь-якої окремої події через MessagePoller буде розпізнано як дублікат.
- **Opt-in, для кожного каналу окремо.** Інші канали (Telegram, WhatsApp, Slack, …) не змінюються.

### Сценарії та що бачить агент

| Користувач складає повідомлення                                     | Apple доставляє          | Прапорець вимкнено (типово)             | Прапорець увімкнено + вікно 2500 мс                                      |
| ------------------------------------------------------------------- | ------------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                        | 2 Webhook з інтервалом ~1 с | Два ходи агента: лише "Dump", потім URL | Один хід: об’єднаний текст `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (вкладення + текст)                 | 2 Webhook                | Два ходи                                | Один хід: текст + зображення                                              |
| `/status` (окрема команда)                                          | 1 Webhook                | Миттєве надсилання                      | **Очікування до межі вікна, потім надсилання**                            |
| Лише вставлений URL                                                 | 1 Webhook                | Миттєве надсилання                      | Миттєве надсилання (у кошику лише один запис)                             |
| Текст + URL надіслано як два навмисно окремі повідомлення з інтервалом у хвилини | 2 Webhook поза вікном    | Два ходи                                | Два ходи (між ними спливає вікно)                                         |
| Швидкий потік (>10 малих DM у межах вікна)                          | N Webhook                | N ходів                                 | Один хід, результат з обмеженнями (застосовано перший + найновіший, ліміти тексту/вкладень) |

### Усунення проблем зі злиттям розділених надсилань

Якщо прапорець увімкнено, а розділені надсилання все одно приходять як два ходи, перевірте кожен рівень:

1. **Конфігурацію справді завантажено.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Потім виконайте `openclaw gateway restart` — прапорець зчитується під час створення реєстру debouncer.

2. **Вікно debounce достатньо широке для вашого середовища.** Подивіться журнал сервера BlueBubbles у `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Виміряйте інтервал між надсиланням тексту на кшталт `"Dump"` і наступним надсиланням `"https://..."; Attachments:`. Підніміть `messages.inbound.byChannel.bluebubbles`, щоб комфортно перекрити цей інтервал.

3. **Часові позначки JSONL сесії ≠ прибуття Webhook.** Часові позначки подій сесії (`~/.openclaw/agents/<id>/sessions/*.jsonl`) відображають момент, коли Gateway передає повідомлення агенту, **а не** коли прибув Webhook. Поставлене в чергу друге повідомлення з позначкою `[Queued messages while agent was busy]` означає, що перший хід ще виконувався, коли прибув другий Webhook — кошик злиття вже було скинуто. Налаштовуйте вікно за журналом сервера BB, а не за журналом сесії.

4. **Тиск пам’яті сповільнює надсилання відповіді.** На слабших машинах (8 ГБ) ходи агента можуть тривати достатньо довго, щоб кошик злиття скинувся ще до завершення відповіді, і URL потрапив як другий хід у черзі. Перевірте `memory_pressure` і `ps -o rss -p $(pgrep openclaw-gateway)`; якщо Gateway використовує понад ~500 МБ RSS і активний компресор, закрийте інші важкі процеси або перейдіть на потужніший хост.

5. **Надсилання з цитованою відповіддю — це інший шлях.** Якщо користувач торкнувся `Dump` як **відповіді** на наявну бульбашку URL (iMessage показує значок "1 Reply" на бульбашці Dump), URL міститься в `replyToBody`, а не в другому Webhook. Тут злиття не застосовується — це питання Skills/промпта, а не debouncer.

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

## Медіа + ліміти

- Вхідні вкладення завантажуються й зберігаються в кеші медіа.
- Ліміт медіа через `channels.bluebubbles.mediaMaxMb` для вхідних і вихідних медіа (типово: 8 МБ).
- Вихідний текст розбивається на частини за `channels.bluebubbles.textChunkLimit` (типово: 4000 символів).

## Довідник із конфігурації

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Параметри провайдера:

- `channels.bluebubbles.enabled`: увімкнути/вимкнути канал.
- `channels.bluebubbles.serverUrl`: базовий URL REST API BlueBubbles.
- `channels.bluebubbles.password`: пароль API.
- `channels.bluebubbles.webhookPath`: шлях endpoint Webhook (типово: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (типово: `pairing`).
- `channels.bluebubbles.allowFrom`: список дозволених для DM (ідентифікатори, електронні адреси, номери E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (типово: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: список дозволених відправників для груп.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: на macOS необов’язково збагачує безіменних учасників групи з локальних Contacts після проходження фільтрації. Типове значення: `false`.
- `channels.bluebubbles.groups`: конфігурація для кожної групи (`requireMention` тощо).
- `channels.bluebubbles.sendReadReceipts`: надсилати підтвердження прочитання (типово: `true`).
- `channels.bluebubbles.blockStreaming`: увімкнути блокове потокове передавання (типово: `false`; обов’язково для потокових відповідей).
- `channels.bluebubbles.textChunkLimit`: розмір вихідного фрагмента в символах (типово: 4000).
- `channels.bluebubbles.sendTimeoutMs`: тайм-аут одного запиту в мс для надсилання вихідного тексту через `/api/v1/message/text` (типово: 30000). Збільшіть на середовищах macOS 26, де надсилання iMessage через Private API може зависати на 60+ секунд у фреймворку iMessage; наприклад, `45000` або `60000`. Перевірки, пошук чатів, реакції, редагування та перевірки стану поки що використовують коротший типовий тайм-аут 10 с; розширення цього покриття на реакції та редагування заплановано окремо. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (типово) розбиває лише в разі перевищення `textChunkLimit`; `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.bluebubbles.mediaMaxMb`: ліміт вхідних/вихідних медіа в МБ (типово: 8).
- `channels.bluebubbles.mediaLocalRoots`: явний список дозволених абсолютних локальних каталогів для вихідних шляхів до локальних медіа. Надсилання локальних шляхів типово заборонено, доки це не налаштовано. Перевизначення для облікового запису: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: об’єднувати послідовні Webhook DM від одного відправника в один хід агента, щоб розділене Apple надсилання текст+URL надходило як одне повідомлення (типово: `false`). Див. [Злиття розділених DM-надсилань](#coalescing-split-send-dms-command--url-in-one-composition) щодо сценаріїв, налаштування вікна та компромісів. Розширює типове вхідне вікно debounce з 500 мс до 2500 мс, коли ввімкнено без явного `messages.inbound.byChannel.bluebubbles`.
- `channels.bluebubbles.historyLimit`: максимальна кількість групових повідомлень для контексту (0 вимикає).
- `channels.bluebubbles.dmHistoryLimit`: ліміт історії DM.
- `channels.bluebubbles.actions`: увімкнути/вимкнути окремі дії.
- `channels.bluebubbles.accounts`: конфігурація кількох облікових записів.

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (або `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Адресація / цілі доставки

Для стабільної маршрутизації надавайте перевагу `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (рекомендовано для груп)
- `chat_id:123`
- `chat_identifier:...`
- Прямі ідентифікатори: `+15555550123`, `user@example.com`
  - Якщо для прямого ідентифікатора немає наявного DM-чату, OpenClaw створить його через `POST /api/v1/chat/new`. Для цього потрібно, щоб був увімкнений BlueBubbles Private API.

### Маршрутизація iMessage vs SMS

Коли той самий ідентифікатор має і чат iMessage, і чат SMS на Mac (наприклад, номер телефону, зареєстрований в iMessage, але який також отримував fallback зелених бульбашок), OpenClaw віддає перевагу чату iMessage і ніколи не виконує тихе зниження до SMS. Щоб примусово використати чат SMS, задайте явний префікс цілі `sms:` (наприклад, `sms:+15555550123`). Ідентифікатори без відповідного чату iMessage однаково надсилатимуться через той чат, який повідомляє BlueBubbles.

## Безпека

- Запити Webhook автентифікуються шляхом порівняння query-параметрів або заголовків `guid`/`password` із `channels.bluebubbles.password`.
- Зберігайте пароль API та endpoint Webhook у таємниці (ставтеся до них як до облікових даних).
- Для автентифікації Webhook BlueBubbles немає обходу через localhost. Якщо ви проксіюєте трафік Webhook, зберігайте пароль BlueBubbles у запиті від початку до кінця. `gateway.trustedProxies` тут не замінює `channels.bluebubbles.password`. Див. [Безпека Gateway](/uk/gateway/security#reverse-proxy-configuration).
- Увімкніть HTTPS + правила firewall на сервері BlueBubbles, якщо відкриваєте його за межі своєї LAN.

## Усунення проблем

- Якщо перестали працювати події введення/прочитання, перевірте журнали Webhook BlueBubbles і переконайтеся, що шлях Gateway відповідає `channels.bluebubbles.webhookPath`.
- Коди сполучення в пару діють одну годину; використовуйте `openclaw pairing list bluebubbles` і `openclaw pairing approve bluebubbles <code>`.
- Реакції потребують BlueBubbles private API (`POST /api/v1/message/react`); переконайтеся, що версія сервера його надає.
- Редагування/скасування надсилання потребують macOS 13+ і сумісної версії сервера BlueBubbles. На macOS 26 (Tahoe) редагування зараз не працює через зміни private API.
- Оновлення іконок груп можуть бути нестабільними на macOS 26 (Tahoe): API може повертати успіх, але нова іконка не синхронізується.
- OpenClaw автоматично приховує відомі зламані дії на основі версії macOS сервера BlueBubbles. Якщо редагування все ще відображається на macOS 26 (Tahoe), вимкніть його вручну через `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` увімкнено, але розділені надсилання (наприклад, `Dump` + URL) усе одно надходять як два ходи: див. контрольний список [усунення проблем зі злиттям розділених надсилань](#split-send-coalescing-troubleshooting) — поширені причини: надто вузьке вікно debounce, часові позначки журналу сесії помилково сприймаються як прибуття Webhook, або надсилання є відповіддю з цитатою (яка використовує `replyToBody`, а не другий Webhook).
- Для інформації про статус/стан: `openclaw status --all` або `openclaw status --deep`.

Загальний довідник щодо робочих процесів каналів див. у [Channels](/uk/channels) і посібнику [Plugins](/uk/tools/plugin).

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення в пару](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і фільтрація за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
