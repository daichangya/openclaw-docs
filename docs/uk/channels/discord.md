---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-04-22T17:02:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2aa0a6d60984cf5cc41f86fdf16d1c409b94605ff36d59c265acadebb4240b45
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Статус: готово для прямих повідомлень і каналів гільдій через офіційний шлюз Discord.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Для Discord DM за замовчуванням використовується режим сполучення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і сполучити його з OpenClaw. Ми рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть Discord application і бота">
    Перейдіть у [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    На бічній панелі натисніть **Bot**. У полі **Username** вкажіть ім’я, яким ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані наміри">
    На сторінці **Bot** прокрутіть вниз до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імені з ID)
    - **Presence Intent** (необов’язково; потрібне лише для оновлень статусу)

  </Step>

  <Step title="Скопіюйте токен бота">
    Поверніться вгору сторінки **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення й додайте бота на свій сервер">
    На бічній панелі натисніть **OAuth2**. Ви згенеруєте URL запрошення з правильними дозволами для додавання бота на сервер.

    Прокрутіть вниз до **OAuth2 URL Generator** і увімкніть:

    - `bot`
    - `applications.commands`

    Нижче з’явиться розділ **Bot Permissions**. Увімкніть щонайменше:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (необов’язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в гілках Discord, зокрема у сценаріях форумів або медіаканалів, де створюється чи продовжується гілка, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL внизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно ввімкнути Developer Mode, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші свій **значок сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші свій **аватар** → **Copy User ID**

    Збережіть **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три значення в OpenClaw.

  </Step>

  <Step title="Дозвольте DM від учасників сервера">
    Щоб сполучення працювало, Discord має дозволяти вашому боту надсилати вам DM. Клацніть правою кнопкою миші **значок сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам DM. Залишайте це ввімкненим, якщо хочете використовувати Discord DM з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, після сполучення DM можна вимкнути.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чаті)">
    Токен вашого Discord-бота — це секретні дані (як пароль). Задайте його на машині, де запущено OpenClaw, перш ніж писати своєму агенту.

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
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw на будь-якому наявному каналі (наприклад, у Telegram) і повідомте це. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / config.

        > "Я вже задав токен свого Discord-бота в конфігурації. Будь ласка, заверши налаштування Discord із User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви віддаєте перевагу файловій конфігурації, задайте:

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

        Підтримуються відкриті значення `token`. Також для `channels.discord.token` підтримуються значення SecretRef через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Схваліть перше сполучення через DM">
    Дочекайтеся, доки шлюз запуститься, а потім надішліть DM своєму боту в Discord. Він відповість кодом сполучення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код сполучення своєму агенту на наявному каналі:

        > "Схвали цей код сполучення Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Термін дії кодів сполучення спливає через 1 годину.

    Тепер ви маєте мати змогу спілкуватися зі своїм агентом у Discord через DM.

  </Step>
</Steps>

<Note>
Розв’язання токенів враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним значенням env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` використовується лише для цього виклику. Це стосується дій надсилання та дій читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Налаштування політик облікового запису/повторних спроб і далі беруться з вибраного облікового запису в активному знімку середовища виконання.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли DM уже працюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує окрему сесію агента зі своїм контекстом. Це рекомендовано для приватних серверів, де єте лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist гільдій">
    Це дозволяє агенту відповідати в будь-якому каналі на вашому сервері, а не лише в DM.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Discord Server ID `<server_id>` до allowlist гільдій"
      </Tab>
      <Tab title="Конфігурація">

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
    За замовчуванням ваш агент відповідає в каналах гільдії лише за @mention. Для приватного сервера ви, ймовірно, захочете, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без @mention"
      </Tab>
      <Tab title="Конфігурація">
        Укажіть `requireMention: false` у конфігурації гільдії:

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

  <Step title="Плануйте використання пам’яті в каналах гільдії">
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в DM-сесіях. У каналах гільдії `MEMORY.md` автоматично не завантажується.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, розмістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони додаються до кожної сесії). Довготривалі нотатки зберігайте в `MEMORY.md` і звертайтеся до них за потреби через інструменти пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкування. Ваш агент бачить назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що інше, що відповідає вашому процесу роботи.

## Модель середовища виконання

- Шлюз керує з’єднанням Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді з Discord повертаються в Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують основну сесію агента (`agent:main:main`).
- Канали гільдії мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизації до цільової сесії розмови.

## Канали форумів

Форуми та медіаканали Discord приймають лише дописи в гілках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити гілку. Заголовок гілки використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити гілку безпосередньо. Не передавайте `--message-id` для каналів форумів.

Приклад: надіслати до батьківського форуму, щоб створити гілку

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити гілку форуму

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте в саму гілку (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із корисним навантаженням `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій допускають до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, меню вибору та форм, доки не сплине їхній строк дії.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (Discord user IDs, теги або `*`). Якщо це налаштовано, користувачі, які не збігаються, отримають ефемерну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадними списками провайдера й моделі та кроком Submit. `/models add` також підтримує додавання нового запису провайдера/моделі з чату, а новододані моделі з’являються без перезапуску шлюзу. Відповідь засобу вибору є ефемерною, і використовувати її може лише користувач, який викликав команду.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); для кількох файлів використовуйте `media-gallery`
- Використовуйте `filename`, щоб перевизначити ім’я завантаження, коли воно має збігатися з посиланням вкладення

Модальні форми:

- Додайте `components.modal` із максимум 5 полями
- Типи полів: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw автоматично додає кнопку запуску

Приклад:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Необов’язковий резервний текст",
  components: {
    reusable: true,
    text: "Виберіть шлях",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Схвалити",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Відхилити", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Виберіть варіант",
          options: [
            { label: "Варіант A", value: "a" },
            { label: "Варіант B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Деталі",
      triggerLabel: "Відкрити форму",
      fields: [
        { type: "text", label: "Запитувач" },
        {
          type: "select",
          label: "Пріоритет",
          options: [
            { label: "Низький", value: "low" },
            { label: "Високий", value: "high" },
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
    - `open` (вимагає, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика DM не є open, невідомі користувачі блокуються (або отримують запит на сполучення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Прості числові ID є неоднозначними й відхиляються, якщо явно не вказано тип цілі user/channel.

  </Tab>

  <Tab title="Політика гільдій">
    Обробка гільдій керується через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова поведінка, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (переважно `id`, slug також приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-яке з них, відправники дозволяються, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення імені/тега за замовчуванням вимкнене; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для гільдії налаштовано `channels`, канали, яких немає у списку, забороняються
    - якщо для гільдії немає блоку `channels`, дозволяються всі канали в цій allowlist-гілдії

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

    Якщо ви лише задасте `DISCORD_BOT_TOKEN` і не створите блок `channels.discord`, резервна поведінка під час виконання буде `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Згадки та групові DM">
    Повідомлення в гільдіях за замовчуванням обмежуються згадками.

    Визначення згадки включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за бажанням відкидає повідомлення, які згадують іншого користувача/роль, але не бота (крім @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і перевіряються після прив’язок peer або parent-peer, але перед прив’язками лише для гільдії. Якщо прив’язка також задає інші поля збігу (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

    Намір presence необов’язковий і потрібен лише якщо ви хочете отримувати оновлення статусу. Установлення статусу бота (`setPresence`) не вимагає ввімкнення оновлень статусу для учасників.

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в гілках Discord, зокрема у сценаріях форумів або медіаканалів, де створюється чи продовжується гілка, також увімкніть **Send Messages in Threads**.
    Уникайте `Administrator`, якщо це не потрібно явно.

  </Accordion>

  <Accordion title="Копіювання ID">
    Увімкніть Discord Developer Mode, а потім скопіюйте:

    - ID сервера
    - ID каналу
    - ID користувача

    Для надійних аудитів і перевірок віддавайте перевагу числовим ID у конфігурації OpenClaw.

  </Accordion>
</AccordionGroup>

## Нативні команди та авторизація команд

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнено для Discord.
- Перевизначення для каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все одно можуть бути видимими в інтерфейсі Discord для користувачів, які не мають авторизації; виконання все одно примусово застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Слеш-команди](/uk/tools/slash-commands), щоб ознайомитися з каталогом команд і поведінкою.

Налаштування слеш-команд за замовчуванням:

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

    Примітка: `off` вимикає неявне групування відповідей у треди. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord для цього ходу.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був дебаунсованим пакетом із кількох повідомлень. Це корисно,
    коли ви хочете використовувати нативні відповіді переважно для неоднозначних
    чатів із частими серіями повідомлень, а не для кожного окремого повідомлення.

    ID повідомлень доступні в контексті/історії, тож агенти можуть націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд потокової трансляції">
    OpenClaw може потоково передавати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту.

    - `channels.discord.streaming` керує потоковим попереднім переглядом (`off` | `partial` | `block` | `progress`, за замовчуванням: `off`).
    - За замовчуванням лишається `off`, тому що редагування попереднього перегляду в Discord може швидко впиратися в обмеження швидкості, особливо коли кілька ботів або шлюзів використовують той самий обліковий запис чи трафік гільдії.
    - `progress` приймається для міжканальної узгодженості й у Discord відображається як `partial`.
    - `channels.discord.streamMode` — це застарілий псевдонім, який мігрується автоматично.
    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` виводить фрагменти розміру чернетки (для налаштування розміру й точок розриву використовуйте `draftChunk`).
    - Остаточні відповіді з медіа, помилками та явними відповідями скасовують відкладені редагування попереднього перегляду без виведення тимчасової чернетки перед звичайною доставкою.
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме повідомлення попереднього перегляду чернетки (за замовчуванням: `true`). Установіть `false`, щоб зберегти окремі повідомлення інструментів/прогресу.

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

    Типові налаштування фрагментації для режиму `block` (обмежуються значенням `channels.discord.textChunkLimit`):

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

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки.

    Примітка: потоковий попередній перегляд відокремлений від block streaming. Якщо для Discord явно
    ввімкнено block streaming, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка гілок">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - гілки Discord маршрутизуються як сесії каналів
    - метадані батьківської гілки можуть використовуватися для зв’язування з батьківською сесією
    - конфігурація гілки успадковує конфігурацію батьківського каналу, якщо немає окремого запису для гілки

    Теми каналів додаються як **ненадійний** контекст (не як системний запит).
    Контекст відповіді та цитованого повідомлення наразі зберігається як отримано.
    Allowlist у Discord переважно обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сесії, прив’язані до гілок, для субагентів">
    У Discord можна прив’язати гілку до цільової сесії, щоб подальші повідомлення в цій гілці й далі маршрутизувалися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` — прив’язати поточну/нову гілку до цілі субагента/сесії
    - `/unfocus` — видалити поточну прив’язку гілки
    - `/agents` — показати активні запуски й стан прив’язок
    - `/session idle <duration|off>` — переглянути/оновити автоматичне зняття фокуса через неактивність для фокусованих прив’язок
    - `/session max-age <duration|off>` — переглянути/оновити жорсткий максимальний вік для фокусованих прив’язок

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
        spawnSubagentSessions: false, // за бажанням
      },
    },
  },
}
```

    Примітки:

    - `session.threadBindings.*` задає глобальні значення за замовчуванням.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути `true`, щоб автоматично створювати/прив’язувати гілки для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути `true`, щоб автоматично створювати/прив’язувати гілки для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки гілок вимкнені для облікового запису, `/focus` і пов’язані операції прив’язки гілок недоступні.

    Див. [Sub-agents](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Configuration Reference](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних ACP-робочих просторів «always-on» налаштуйте типізовані ACP-прив’язки верхнього рівня, націлені на розмови Discord.

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
    - Це все ще може означати «запустити нову ACP-сесію Codex», але саме по собі не створює нову гілку Discord. Наявний канал лишається поверхнею чату.
    - Codex усе ще може працювати у власному `cwd` або робочому просторі backend на диску. Цей робочий простір є станом середовища виконання, а не гілкою Discord.
    - Повідомлення в гілках можуть успадковувати ACP-прив’язку батьківського каналу.
    - У прив’язаному каналі або гілці `/new` і `/reset` скидають ту саму ACP-сесію на місці.
    - Тимчасові прив’язки гілок усе ще працюють і можуть перевизначати розв’язання цілі, доки вони активні.
    - `spawnAcpSessions` потрібне лише тоді, коли OpenClaw має створити/прив’язати дочірню гілку через `--thread auto|here`. Воно не потрібне для `/acp spawn ... --bind here` у поточному каналі.

    Див. [ACP Agents](/uk/tools/acp-agents), щоб ознайомитися з подробицями поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожної гільдії:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та додаються до маршрутизованої Discord-сесії.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний emoji з ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode emoji або назви користувацьких emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Запис у конфігурацію">
    Ініційований каналом запис у конфігурацію ввімкнено за замовчуванням.

    Це впливає на потоки `/config set|unset` (коли функції команд увімкнені).

    Вимкнути:

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

  <Accordion title="Проксі шлюзу">
    Маршрутизуйте WebSocket-трафік шлюзу Discord і REST-запити під час запуску (ID застосунку + розв’язання allowlist) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Перевизначення для облікового запису:

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
    Увімкніть розв’язання PluralKit, щоб зіставляти проксійовані повідомлення з ідентичністю учасника системи:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // необов’язково; потрібне для приватних систем
      },
    },
  },
}
```

    Примітки:

    - allowlist можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошук використовує ID початкового повідомлення та обмежується часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення обробляються як повідомлення бота й відкидаються, якщо тільки `allowBots=true`

  </Accordion>

  <Accordion title="Конфігурація статусу">
    Оновлення статусу застосовуються, коли ви задаєте поле status або activity, або коли вмикаєте автоматичний статус.

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

    Приклад activity (custom status — тип activity за замовчуванням):

```json5
{
  channels: {
    discord: {
      activity: "Час зосередженої роботи",
      activityType: 4,
    },
  },
}
```

    Приклад streaming:

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

    Відповідність типів activity:

    - 0: Playing
    - 1: Streaming (потрібен `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (використовує текст activity як стан статусу; emoji необов’язкове)
    - 5: Competing

    Приклад автоматичного статусу (сигнал працездатності середовища виконання):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "токен вичерпано",
      },
    },
  },
}
```

    Auto presence зіставляє доступність середовища виконання зі статусом Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Схвалення в Discord">
    Discord підтримує обробку схвалень за допомогою кнопок у DM і за бажанням може публікувати запити на схвалення в каналі походження.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовується резервне значення з `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні exec-схвалення, коли `enabled` не задано або має значення `"auto"` і можна розв’язати щонайменше одного approver, або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не визначає exec-approver із `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Явно задайте `enabled: false`, щоб вимкнути Discord як нативний клієнт схвалення.

    Коли `target` має значення `channel` або `both`, запит на схвалення видимий у каналі. Лише розв’язані approver можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на схвалення містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сесії, OpenClaw використовує резервну доставку через DM.

    Discord також відображає спільні кнопки схвалення, які використовуються іншими чат-каналами. Нативний адаптер Discord головним чином додає маршрутизацію DM для approver і fanout у канал.
    Коли ці кнопки присутні, вони є основним UX для схвалення; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що схвалення через чат недоступні або єдиним шляхом є ручне схвалення.

    Автентифікація Gateway для цього обробника використовує той самий спільний контракт розв’язання облікових даних, що й інші клієнти Gateway:

    - локальна автентифікація env-first (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, потім `gateway.auth.*`)
    - у локальному режимі `gateway.remote.*` можна використовувати як резервне значення лише коли `gateway.auth.*` не задано; налаштовані, але нерозв’язані локальні SecretRef завершуються із закриттям доступу
    - підтримка remote-mode через `gateway.remote.*`, де це застосовно
    - перевизначення URL безпечні щодо перевизначень: перевизначення CLI не використовують неявні облікові дані повторно, а перевизначення env використовують лише env-облікові дані

    Поведінка розв’язання схвалень:

    - ID з префіксом `plugin:` розв’язуються через `plugin.approval.resolve`.
    - Інші ID розв’язуються через `exec.approval.resolve`.
    - Discord тут не виконує додатковий резервний перехід exec-to-plugin; префікс
      id визначає, який метод шлюзу буде викликано.

    Exec-схвалення за замовчуванням спливають через 30 хвилин. Якщо схвалення не спрацьовують через
    невідомі ID схвалень, перевірте розв’язання approver, увімкнення функції та
    що доставлений тип approval id відповідає очікуваному запиту.

    Пов’язана документація: [Exec approvals](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Інструменти та обмеження дій

Дії повідомлень Discord включають повідомлення, адміністрування каналів, модерацію, статус і дії з метаданими.

Основні приклади:

- повідомлення: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- статус: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файлу), щоб задати обкладинку запланованої події.

Обмеження дій розміщені в `channels.discord.actions.*`.

Поведінка обмежень за замовчуванням:

| Група дій                                                                                                                                                                 | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                     | вимкнено         |
| moderation                                                                                                                                                                | вимкнено         |
| presence                                                                                                                                                                  | вимкнено         |

## Інтерфейс Components v2

OpenClaw використовує Discord components v2 для exec-схвалень і позначок між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького UI (розширено; вимагає побудови корисного навантаження компонента через інструмент discord), тоді як застарілі `embeds` усе ще доступні, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовується контейнерами компонентів Discord (hex).
- Задається для облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

OpenClaw може приєднуватися до голосових каналів Discord для безперервних розмов у реальному часі. Це окремо від вкладень голосових повідомлень.

Вимоги:

- Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Бот повинен мати дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте нативну команду лише для Discord `/vc join|leave|status` для керування сесіями. Команда використовує агента за замовчуванням для облікового запису та дотримується тих самих правил allowlist і group policy, що й інші команди Discord.

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

- `voice.tts` перевизначає `messages.tts` лише для відтворення голосу.
- Ходи розшифрування голосу визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримати доступ до інструментів лише для власника (наприклад, `gateway` і `cron`).
- Голос увімкнений за замовчуванням; задайте `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються в параметри приєднання `@discordjs/voice`.
- Якщо не задано, значення за замовчуванням `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`.
- OpenClaw також відстежує помилки дешифрування під час отримання та автоматично відновлюється, виходячи й повторно приєднуючись до голосового каналу після повторних збоїв за короткий проміжок часу.
- Якщо журнали отримання постійно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути помилка отримання в `@discordjs/voice`, яка відстежується в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми та вимагають аудіо OGG/Opus разом із метаданими. OpenClaw генерує хвильову форму автоматично, але для перевірки та конвертації аудіофайлів на хості шлюзу мають бути доступні `ffmpeg` і `ffprobe`.

Вимоги й обмеження:

- Надайте **локальний шлях до файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord не дозволяє текст + голосове повідомлення в одному payload).
- Підтримується будь-який аудіоформат; OpenClaw за потреби конвертує його в OGG/Opus.

Приклад:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень гільдії">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви покладаєтеся на розв’язання користувачів/учасників
    - після зміни intents перезапустіть шлюз

  </Accordion>

  <Accordion title="Повідомлення гільдії неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist гільдії в `channels.discord.guilds`
    - якщо існує мапа `channels` гільдії, дозволяються лише перелічені канали
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

    - `groupPolicy="allowlist"` без відповідного allowlist гільдії/каналу
    - `requireMention` налаштовано в неправильному місці (має бути в `channels.discord.guilds` або в записі каналу)
    - відправник заблокований allowlist `users` гільдії/каналу

  </Accordion>

  <Accordion title="Довготривалі обробники завершуються за тайм-аутом або дублюють відповіді">

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
    - за замовчуванням: `1800000` (30 хвилин); задайте `0`, щоб вимкнути

    Рекомендована базова конфігурація:

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
    лише якщо вам потрібен окремий запобіжник для поставлених у чергу ходів агента.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення під час виконання все одно може працювати, але probe не зможе повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політика DM вимкнена: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли bot-to-bot">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви задали `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Голосовий STT втрачається з DecryptionFailed(...)">

    - підтримуйте актуальність OpenClaw (`openclaw update`), щоб була присутня логіка відновлення отримання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (вихідне значення за замовчуванням) і налаштовуйте лише за потреби
    - стежте за журналами:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали й порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - Discord](/uk/gateway/configuration-reference#discord)

Важливі поля Discord:

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- вхідний worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокова передача: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb`, `retry`
  - `mediaMaxMb` обмежує вихідні завантаження Discord (за замовчуванням: `100MB`)
- дії: `actions.*`
- статус: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневі `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Безпека й операції

- Розглядайте токени ботів як секрети (у контрольованих середовищах перевага за `DISCORD_BOT_TOKEN`).
- Надавайте мінімально необхідні дозволи Discord.
- Якщо стан розгортання/команд застарів, перезапустіть шлюз і повторно перевірте через `openclaw channels status --probe`.

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Безпека](/uk/gateway/security)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
- [Слеш-команди](/uk/tools/slash-commands)
