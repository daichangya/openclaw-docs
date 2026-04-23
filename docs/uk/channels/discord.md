---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та налаштування
title: Discord
x-i18n:
    generated_at: "2026-04-23T06:42:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0bee2c419651701f7ab57e46a4c0c473c83596eb9bd2156bac3c6117513236ab
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Статус: готово для приватних повідомлень і каналів серверів через офіційний шлюз Discord.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Discord DMs за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і сполучити його з OpenClaw. Ми рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ту назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані наміри">
    Усе ще на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для списків дозволених ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібне лише для оновлень статусу присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він скоро знадобиться.

  </Step>

  <Step title="Згенеруйте URL-запрошення та додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL-запрошення з правильними дозволами, щоб додати бота на свій сервер.

    Прокрутіть униз до **OAuth2 URL Generator** і ввімкніть:

    - `bot`
    - `applications.commands`

    Унизу з’явиться розділ **Bot Permissions**. Увімкніть принаймні:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (необов’язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в гілках Discord, зокрема у процесах форумних або медіаканалів, які створюють або продовжують гілку, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue** для підключення. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно ввімкнути Developer Mode, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші по **значку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші по **власному аватару** → **Copy User ID**

    Збережіть свій **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три значення в OpenClaw.

  </Step>

  <Step title="Дозвольте DMs від учасників сервера">
    Щоб сполучення працювало, Discord має дозволяти вашому боту надсилати вам DMs. Клацніть правою кнопкою миші по **значку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (зокрема ботам) надсилати вам DMs. Залишайте це ввімкненим, якщо хочете використовувати Discord DMs з OpenClaw. Якщо ви плануєте використовувати лише канали сервера, після сполучення DMs можна вимкнути.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чаті)">
    Токен вашого Discord-бота є секретом (як пароль). Задайте його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте сполучення">

    <Tabs>
      <Tab title="Попросіть свого агента">
        Напишіть своєму агенту OpenClaw у будь-якому вже наявному каналі (наприклад, Telegram) і скажіть це. Якщо Discord — ваш перший канал, натомість скористайтеся вкладкою CLI / config.

        > "Я вже задав токен свого Discord-бота в config. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви надаєте перевагу файловій конфігурації, задайте:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Резервне значення env для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Підтримуються значення `token` у відкритому тексті. Значення SecretRef також підтримуються для `channels.discord.token` у провайдерах env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше сполучення через DM">
    Дочекайтеся, поки шлюз буде запущено, а потім надішліть DM своєму боту в Discord. Він відповість кодом сполучення.

    <Tabs>
      <Tab title="Попросіть свого агента">
        Надішліть код сполучення своєму агенту в наявному каналі:

        > "Підтвердь цей код сполучення Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Термін дії кодів сполучення спливає через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через DM.

  </Step>
</Steps>

<Note>
Визначення токенів залежить від облікового запису. Значення токенів у config мають пріоритет над резервним значенням env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` використовується для цього конкретного виклику. Це стосується дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису й параметри повторних спроб усе ще беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір сервера

Коли DMs уже працюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує окрему сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де єте лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до списку дозволених серверів">
    Це дозволяє вашому агенту відповідати в будь-якому каналі вашого сервера, а не лише в DMs.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "Додай мій Discord Server ID `<server_id>` до списку дозволених серверів"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Дозвольте відповіді без @mention">
    За замовчуванням ваш агент відповідає в каналах сервера лише тоді, коли його згадано через @mention. Для приватного сервера, імовірно, ви захочете, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без @mention"
      </Tab>
      <Tab title="Config">
        Установіть `requireMention: false` у конфігурації сервера:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Плануйте використання пам’яті в каналах сервера">
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в сесіях DM. У каналах сервера `MEMORY.md` автоматично не завантажується.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть сталі інструкції в `AGENTS.md` або `USER.md` (вони впроваджуються в кожну сесію). Довготривалі нотатки зберігайте в `MEMORY.md` і звертайтеся до них за потреби через інструменти пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкування. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому робочому процесу.

## Модель runtime

- Gateway керує підключенням Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення Discord повертаються назад у Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують спільну основну сесію агента (`agent:main:main`).
- Канали сервера мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DMs ігноруються за замовчуванням (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих сесіях команд (`agent:<agentId>:discord:slash:<userId>`), водночас передаючи `CommandTargetSessionKey` до маршрутизованої сесії розмови.

## Форумні канали

Форумні та медіаканали Discord приймають лише публікації в гілках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити гілку. Заголовок гілки бере перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити гілку безпосередньо. Не передавайте `--message-id` для форумних каналів.

Приклад: надсилання до батьківського форуму для створення гілки

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явне створення форумної гілки

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте в саму гілку (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із корисним навантаженням `components`. Результати взаємодії повертаються агенту як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, виборів і форм до завершення строку їх дії.

Щоб обмежити, хто може натискати кнопку, установіть `allowedUsers` для цієї кнопки (Discord user IDs, теги або `*`). Якщо це налаштовано, користувачі без збігу отримають епізодичну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадними списками провайдера й моделі та кроком Submit. Якщо не встановлено `commands.modelsWrite=false`, `/models add` також підтримує додавання нового запису провайдера/моделі з чату, а нові моделі з’являються без перезапуску шлюзу. Відповідь вибору є епізодичною, і скористатися нею може лише користувач, який викликав команду.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); для кількох файлів використовуйте `media-gallery`
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має відповідати посиланню вкладення

Модальні форми:

- Додайте `components.modal` із до 5 полів
- Типи полів: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw автоматично додає кнопку запуску

Приклад:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.discord.dmPolicy` керує доступом до DM (застаріле: `channels.discord.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика DM не є open, невідомі користувачі блокуються (або отримують запит на сполучення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Числові ID без префікса є неоднозначними й відхиляються, якщо явно не вказано тип цілі user/channel.

  </Tab>

  <Tab title="Політика сервера">
    Обробка серверів керується через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечне базове значення, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - сервер має відповідати `channels.discord.guilds` (переважно `id`, також приймається slug)
    - необов’язкові списки дозволених відправників: `users` (рекомендовано сталі ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони відповідають `users` АБО `roles`
    - пряме зіставлення за ім’ям/тегом за замовчуванням вимкнене; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо для сервера налаштовано `channels`, канали поза списком відхиляються
    - якщо сервер не має блоку `channels`, дозволяються всі канали в цьому сервері зі списку дозволених

    Приклад:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Якщо ви лише задаєте `DISCORD_BOT_TOKEN` і не створюєте блок `channels.discord`, резервне значення runtime буде `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Згадки та групові DMs">
    Повідомлення сервера за замовчуванням обмежуються згадками.

    Визначення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    `requireMention` налаштовується для кожного сервера/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (крім @everyone/@here).

    Групові DMs:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий список дозволених через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників серверів Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer та перед прив’язками лише на рівні сервера. Якщо прив’язка також задає інші поля відповідності (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Налаштування Developer Portal

<AccordionGroup>
  <Accordion title="Створення застосунку та бота">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Скопіюйте токен бота

  </Accordion>

  <Accordion title="Привілейовані наміри">
    У **Bot -> Privileged Gateway Intents** увімкніть:

    - Message Content Intent
    - Server Members Intent (рекомендовано)

    Presence intent є необов’язковим і потрібне лише якщо ви хочете отримувати оновлення статусу присутності. Установлення статусу присутності бота (`setPresence`) не потребує ввімкнення оновлень присутності для учасників.

  </Accordion>

  <Accordion title="OAuth scopes і базові дозволи">
    Генератор OAuth URL:

    - scopes: `bot`, `applications.commands`

    Типові базові дозволи:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (необов’язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в гілках Discord, зокрема у процесах форумних або медіаканалів, які створюють або продовжують гілку, також увімкніть **Send Messages in Threads**.
    Уникайте `Administrator`, якщо він не потрібен явно.

  </Accordion>

  <Accordion title="Копіювання ID">
    Увімкніть Discord Developer Mode, а потім скопіюйте:

    - ID сервера
    - ID каналу
    - ID користувача

    Для надійних аудитів і перевірок віддавайте перевагу числовим ID у конфігурації OpenClaw.

  </Accordion>
</AccordionGroup>

## Нативні команди й авторизація команд

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнене для Discord.
- Перевизначення для каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі списки дозволених і політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не мають авторизації; виконання все одно застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Slash commands](/uk/tools/slash-commands) для каталогу команд і поведінки.

Стандартні налаштування слеш-команд:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Теги відповідей і нативні відповіді">
    Discord підтримує теги відповідей у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується через `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне гілкування відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди прикріплює неявне посилання нативної відповіді до першого вихідного повідомлення Discord у межах ходу.
    `batched` прикріплює неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був пакетною вибіркою кількох повідомлень із дебаунсом. Це корисно,
    коли нативні відповіді потрібні переважно для неоднозначних чатів зі сплесками, а не для кожного
    окремого ходу з одним повідомленням.

    ID повідомлень відображаються в контексті/історії, тому агенти можуть націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд живого потоку">
    OpenClaw може потоково передавати чернетки відповідей, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту.

    - `channels.discord.streaming` керує потоковим попереднім переглядом (`off` | `partial` | `block` | `progress`, за замовчуванням: `off`).
    - Стандартним значенням залишається `off`, тому що редагування попереднього перегляду в Discord може швидко досягати обмежень швидкості, особливо коли кілька ботів або шлюзів використовують один обліковий запис чи трафік сервера.
    - `progress` приймається для узгодженості між каналами й у Discord відображається як `partial`.
    - `channels.discord.streamMode` є застарілим псевдонімом і мігрує автоматично.
    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розбиття).
    - Остаточні повідомлення з медіа, помилками та явними відповідями скасовують відкладені редагування попереднього перегляду без виведення тимчасової чернетки перед звичайною доставкою.
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу використовують те саме чернеткове повідомлення попереднього перегляду (за замовчуванням: `true`). Установіть `false`, щоб зберігати окремі повідомлення інструментів/прогресу.

    Приклад:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Стандартні параметри фрагментації в режимі `block` (обмежуються до `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    Потоковий попередній перегляд працює лише для тексту; відповіді з медіа повертаються до звичайної доставки.

    Примітка: потоковий попередній перегляд відокремлений від блокового потоку. Коли для Discord явно
    ввімкнено блоковий потік, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка гілок">
    Контекст історії сервера:

    - `channels.discord.historyLimit` стандартно `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - Гілки Discord маршрутизуються як сесії каналів
    - метадані батьківської гілки можуть використовуватися для прив’язки до батьківської сесії
    - конфігурація гілки успадковує конфігурацію батьківського каналу, якщо немає окремого запису для гілки
    - успадкування транскрипту батьківського каналу в новостворені автоматичні гілки вмикається через `channels.discord.thread.inheritParent` (за замовчуванням `false`). Коли `false`, новостворені сесії гілок Discord починаються ізольовано від транскрипту батьківського каналу; коли `true`, історія батьківського каналу ініціалізує нову сесію гілки
    - перевизначення для кожного облікового запису розміщені в `channels.discord.accounts.<id>.thread.inheritParent`
    - реакції інструмента повідомлень можуть визначати цілі DM `user:<id>` на додачу до цілей каналів
    - `channels.discord.guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі reply, тож канали, налаштовані як always-on, залишаються always-on навіть коли виконується резервний механізм на етапі reply

    Теми каналів впроваджуються як **ненадійний** контекст (а не як system prompt).
    Контекст відповіді та цитованих повідомлень наразі залишається таким, як отримано.
    Списки дозволених Discord насамперед обмежують, хто може активувати агента, а не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сесії, прив’язані до гілок, для субагентів">
    Discord може прив’язати гілку до цілі сесії, щоб подальші повідомлення в цій гілці й надалі маршрутизувалися до тієї самої сесії (зокрема до сесій субагентів).

    Команди:

    - `/focus <target>` прив’язати поточну/нову гілку до цілі субагента/сесії
    - `/unfocus` видалити поточну прив’язку гілки
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автозняття фокуса через неактивність для сфокусованих прив’язок
    - `/session max-age <duration|off>` переглянути/оновити жорсткий максимальний вік для сфокусованих прив’язок

    Конфігурація:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Примітки:

    - `session.threadBindings.*` задає глобальні значення за замовчуванням.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати гілки для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати гілки для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки гілок вимкнені для облікового запису, `/focus` і пов’язані операції прив’язки гілок недоступні.

    Див. [Sub-agents](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Configuration Reference](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки ACP каналів">
    Для стабільних ACP робочих просторів у режимі "always-on" налаштуйте типізовані ACP-прив’язки верхнього рівня, націлені на розмови Discord.

    Шлях конфігурації:

    - `bindings[]` з `type: "acp"` і `match.channel: "discord"`

    Приклад:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Примітки:

    - `/acp spawn codex --bind here` прив’язує поточний канал або гілку Discord на місці та зберігає маршрутизацію майбутніх повідомлень до тієї самої ACP-сесії.
    - Це все ще може означати "запустити нову ACP-сесію Codex", але саме по собі не створює нову гілку Discord. Наявний канал залишається поверхнею чату.
    - Codex усе ще може працювати у власному `cwd` або робочому просторі бекенда на диску. Цей робочий простір є станом runtime, а не гілкою Discord.
    - Повідомлення гілок можуть успадковувати ACP-прив’язку батьківського каналу.
    - У прив’язаному каналі або гілці `/new` і `/reset` скидають ту саму ACP-сесію на місці.
    - Тимчасові прив’язки гілок також працюють і можуть перевизначати визначення цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірню гілку через `--thread auto|here`. Він не потрібен для `/acp spawn ... --bind here` у поточному каналі.

    Див. [ACP Agents](/uk/tools/acp-agents), щоб дізнатися подробиці поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожного сервера:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та прикріплюються до маршрутизованої сесії Discord.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервне значення емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає emoji Unicode або назви користувацьких emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані з каналу, ввімкнені за замовчуванням.

    Це впливає на потоки `/config set|unset` (коли функції команд увімкнені).

    Вимкнення:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Проксі Gateway">
    Маршрутизуйте трафік WebSocket шлюзу Discord і стартові REST-запити (ID застосунку + визначення списку дозволених) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Перевизначення для окремого облікового запису:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Підтримка PluralKit">
    Увімкніть визначення PluralKit, щоб зіставляти проксійовані повідомлення з ідентичністю учасника системи:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Примітки:

    - списки дозволених можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошук використовує ID початкового повідомлення й обмежується часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо не задано `allowBots=true`

  </Accordion>

  <Accordion title="Конфігурація статусу присутності">
    Оновлення статусу присутності застосовуються, коли ви задаєте поле status або activity, або коли вмикаєте автоматичний статус присутності.

    Приклад лише зі статусом:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Приклад активності (користувацький статус — це стандартний тип активності):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Приклад трансляції:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Відповідність типів активності:

    - 0: Playing
    - 1: Streaming (потребує `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (використовує текст активності як стан статусу; emoji необов’язковий)
    - 5: Competing

    Приклад автоматичного статусу присутності (сигнал здоров’я runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Автоматичний статус присутності зіставляє доступність runtime зі статусом Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Погодження в Discord">
    Discord підтримує обробку погоджень через кнопки в DMs і може за потреби публікувати запити на погодження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовує резервне значення `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні exec-погодження, коли `enabled` не задано або дорівнює `"auto"` і можна визначити принаймні одного погоджувача, або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не визначає exec-погоджувачів із channel `allowFrom`, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Установіть `enabled: false`, щоб явно вимкнути Discord як нативний клієнт погоджень.

    Коли `target` має значення `channel` або `both`, запит на погодження видно в каналі. Лише визначені погоджувачі можуть використовувати кнопки; інші користувачі отримують епізодичну відмову. Запити на погодження включають текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки погодження, які використовуються іншими чат-каналами. Нативний адаптер Discord головним чином додає маршрутизацію DM погоджувачів і fanout у каналі.
    Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що погодження в чаті недоступні або ручне погодження — єдиний шлях.

    Автентифікація Gateway для цього обробника використовує той самий спільний контракт визначення облікових даних, що й інші клієнти Gateway:

    - локальна автентифікація з пріоритетом env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, потім `gateway.auth.*`)
    - у локальному режимі `gateway.remote.*` може використовуватися як резервне значення лише коли `gateway.auth.*` не задано; налаштовані, але не визначені локальні SecretRef закриваються без резервного варіанта
    - підтримка віддаленого режиму через `gateway.remote.*`, коли це застосовно
    - перевизначення URL безпечні щодо перевизначень: перевизначення CLI не повторно використовують неявні облікові дані, а перевизначення env використовують лише облікові дані env

    Поведінка визначення погоджень:

    - ID з префіксом `plugin:` визначаються через `plugin.approval.resolve`.
    - Інші ID визначаються через `exec.approval.resolve`.
    - Discord тут не робить додаткового резервного переходу exec-to-plugin; префікс
      id визначає, який метод шлюзу він викликає.

    Термін дії exec-погоджень за замовчуванням спливає через 30 хвилин. Якщо погодження завершуються помилкою з
    невідомими ID погоджень, перевірте визначення погоджувачів, увімкнення функції та
    те, що тип доставленого ID погодження відповідає очікуваному запиту.

    Пов’язана документація: [Exec approvals](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Інструменти й обмеження дій

Дії з повідомленнями Discord включають обмін повідомленнями, адміністрування каналу, модерацію, статус присутності та дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- статус присутності: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або локальний шлях до файлу), щоб задати зображення обкладинки запланованої події.

Обмеження дій розміщені в `channels.discord.actions.*`.

Стандартна поведінка обмежень:

| Група дій                                                                                                                                                                | Стандартно |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено  |
| roles                                                                                                                                                                    | вимкнено   |
| moderation                                                                                                                                                               | вимкнено   |
| presence                                                                                                                                                                 | вимкнено   |

## Інтерфейс Components v2

OpenClaw використовує Discord components v2 для exec-погоджень і маркерів між контекстами. Дії з повідомленнями Discord також можуть приймати `components` для користувацького інтерфейсу (розширено; потребує побудови корисного навантаження компонентів через інструмент discord), тоді як застарілі `embeds` і далі доступні, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовується контейнерами компонентів Discord (hex).
- Задайте для окремого облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` ігноруються, коли присутні components v2.

Приклад:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Голосові канали

OpenClaw може приєднуватися до голосових каналів Discord для розмов у реальному часі та безперервного спілкування. Це окрема функція від вкладень голосових повідомлень.

Вимоги:

- Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Бот має мати дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте нативну команду лише для Discord `/vc join|leave|status`, щоб керувати сесіями. Команда використовує стандартного агента облікового запису та дотримується тих самих правил списку дозволених і групової політики, що й інші команди Discord.

Приклад автоматичного приєднання:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Примітки:

- `voice.tts` перевизначає `messages.tts` лише для голосового відтворення.
- Ходи голосової транскрипції визначають статус власника з `allowFrom` Discord (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримати доступ до інструментів лише для власника (наприклад, `gateway` і `cron`).
- Голос увімкнено за замовчуванням; установіть `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` напряму передаються до параметрів приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- OpenClaw також відстежує помилки дешифрування під час отримання й автоматично відновлюється, виходячи з голосового каналу та знову приєднуючись після повторних помилок за короткий проміжок часу.
- Якщо журнали отримання постійно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути помилка отримання в upstream `@discordjs/voice`, відстежувана в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд форми хвилі та вимагають аудіо OGG/Opus разом із метаданими. OpenClaw генерує форму хвилі автоматично, але для перевірки та конвертації аудіофайлів на хості Gateway мають бути доступні `ffmpeg` і `ffprobe`.

Вимоги та обмеження:

- Надайте **локальний шлях до файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord не дозволяє текст + голосове повідомлення в одному корисному навантаженні).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує його в OGG/Opus.

Приклад:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень сервера">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви залежите від визначення користувача/учасника
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення сервера неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте список дозволених серверів у `channels.discord.guilds`
    - якщо існує мапа `channels` сервера, дозволяються лише перелічені канали
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, але все одно блокується">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного списку дозволених серверів/каналів
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або записі каналу)
    - відправник заблокований списком дозволених `users` сервера/каналу

  </Accordion>

  <Accordion title="Обробники з довгим виконанням завершуються за тайм-аутом або відповіді дублюються">

    Типові журнали:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Параметр бюджету listener:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Параметр тайм-ауту виконання worker:

    - один обліковий запис: `channels.discord.inboundWorker.runTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - стандартно: `1800000` (30 хвилин); установіть `0`, щоб вимкнути

    Рекомендоване базове значення:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Використовуйте `eventQueue.listenerTimeout` для повільного налаштування listener і `inboundWorker.runTimeoutMs`
    лише якщо вам потрібен окремий запобіжний механізм для поставлених у чергу ходів агента.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення в runtime все одно може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується підтвердження сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    За замовчуванням повідомлення, створені ботом, ігноруються.

    Якщо ви задали `channels.discord.allowBots=true`, використовуйте суворі правила згадок і списку дозволених, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Голосовий STT переривається з DecryptionFailed(...)">

    - підтримуйте актуальність OpenClaw (`openclaw update`), щоб була присутня логіка відновлення отримання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (стандартно)
    - почніть із `channels.discord.voice.decryptionFailureTolerance=24` (стандартне значення upstream) і налаштовуйте лише за потреби
    - відстежуйте журнали на наявність:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали та порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

Основний довідник:

- [Configuration reference - Discord](/uk/gateway/configuration-reference#discord)

Ключові поля Discord:

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- вхідний worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потоковий режим: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb`, `retry`
  - `mediaMaxMb` обмежує вихідні завантаження в Discord (стандартно: `100MB`)
- дії: `actions.*`
- статус присутності: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Безпека та експлуатація

- Вважайте токени бота секретами (`DISCORD_BOT_TOKEN` є бажаним у контрольованих середовищах).
- Надавайте Discord дозволи за принципом найменших привілеїв.
- Якщо стан розгортання/стан команд застарів, перезапустіть gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов’язане

- [Pairing](/uk/channels/pairing)
- [Groups](/uk/channels/groups)
- [Channel routing](/uk/channels/channel-routing)
- [Security](/uk/gateway/security)
- [Multi-agent routing](/uk/concepts/multi-agent)
- [Troubleshooting](/uk/channels/troubleshooting)
- [Slash commands](/uk/tools/slash-commands)
