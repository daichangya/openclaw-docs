---
read_when:
    - Працюєте над функціями каналу Discord
summary: Статус підтримки Discord-бота, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-04-05T17:59:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e757d321d80d05642cd9e24b51fb47897bacaf8db19df83bd61a49a8ce51ed3a
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Статус: готовий для DM і каналів guild через офіційний шлюз Discord.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/channels/pairing">
    Для Discord DM типовим є режим підключення.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    Вбудована поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/channels/troubleshooting">
    Кросканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно буде створити новий застосунок із ботом, додати бота на свій сервер і підключити його до OpenClaw. Ми рекомендуємо додати бота на свій приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    На бічній панелі натисніть **Bot**. Встановіть **Username** на будь-яку назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Все ще на сторінці **Bot**, прокрутіть до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібен лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і незабаром він вам знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення та додайте бота на свій сервер">
    На бічній панелі натисніть **OAuth2**. Ви згенеруєте URL запрошення з правильними дозволами для додавання бота на свій сервер.

    Прокрутіть до **OAuth2 URL Generator** і увімкніть:

    - `bot`
    - `applications.commands`

    Нижче з’явиться розділ **Bot Permissions**. Увімкніть:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (необов’язково)

    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно увімкнути Developer Mode, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч з аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші на **значку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші на **власному аватарі** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три до OpenClaw.

  </Step>

  <Step title="Дозвольте DM від учасників сервера">
    Щоб підключення працювало, Discord має дозволяти вашому боту надсилати вам DM. Клацніть правою кнопкою миші на **значку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам DM. Залиште це ввімкненим, якщо хочете використовувати Discord DM з OpenClaw. Якщо ви плануєте використовувати лише канали guild, після підключення DM можна вимкнути.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чат)">
    Токен вашого Discord-бота — це секрет (як пароль). Задайте його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже працює як фонова служба, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте підключення">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Напишіть своєму агенту OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому це. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / config.

        > "Я вже задав токен свого Discord-бота в конфігурації. Будь ласка, заверши налаштування Discord із User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви віддаєте перевагу конфігурації на основі файлу, задайте:

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

        Резервне env-значення для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Підтримуються прості текстові значення `token`. Значення SecretRef також підтримуються для `channels.discord.token` у провайдерах env/file/exec. Див. [Secrets Management](/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше підключення через DM">
    Дочекайтеся, поки шлюз запуститься, а потім напишіть своєму боту в Discord у DM. Він відповість кодом підключення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код підключення своєму агенту в наявному каналі:

        > "Підтвердь цей код підключення Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Термін дії кодів підключення спливає через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через DM.

  </Step>
</Steps>

<Note>
Розв’язання токенів враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним env-значенням. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` використовується для цього конкретного виклику. Це стосується дій надсилання і читання/перевірки на кшталт read/search/fetch/thread/pins/permissions. Політика облікового запису та налаштування повторних спроб, як і раніше, беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір guild

Щойно DM запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви і ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist guild">
    Це дає агенту змогу відповідати в будь-якому каналі на вашому сервері, а не лише в DM.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Discord Server ID `<server_id>` до allowlist guild"
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
    Типово ваш агент відповідає в каналах guild лише тоді, коли його згадують через @mention. Для приватного сервера вам, імовірно, потрібно, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без @mentioned"
      </Tab>
      <Tab title="Config">
        У конфігурації guild задайте `requireMention: false`:

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

  <Step title="Сплануйте роботу з пам’яттю в каналах guild">
    Типово довготривала пам’ять (`MEMORY.md`) завантажується лише в DM-сесіях. Канали guild не завантажують `MEMORY.md` автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони додаються до кожної сесії). Довгострокові нотатки зберігайте в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкуватися. Ваш агент бачить назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що інше, що підходить вашому процесу.

## Модель runtime

- Gateway керує підключенням до Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення з Discord отримують відповіді назад у Discord.
- Типово (`session.dmScope=main`) прямі чати спільно використовують основну сесію агента (`agent:main:main`).
- Канали guild мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM типово ігноруються (`channels.discord.dm.groupEnabled=false`).
- Вбудовані slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас несучи `CommandTargetSessionKey` до маршрутизованої сесії розмови.

## Канали forum

Канали forum і media у Discord приймають лише публікації у threads. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського forum (`channel:<forumId>`), щоб автоматично створити thread. Заголовок thread використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити thread напряму. Не передавайте `--message-id` для каналів forum.

Приклад: надсилання до батьківського forum для створення thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явне створення thread форуму

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські forum не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самого thread (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери Discord components v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодії маршрутизуються назад агенту як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

Типово компоненти одноразові. Задайте `components.reusable=true`, щоб дозволити багаторазове використання кнопок, списків вибору та форм до завершення строку їх дії.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо це налаштовано, користувачі, які не збігаються, отримають ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний засіб вибору моделі з випадними списками провайдера та моделі, а також кроком Submit. Відповідь засобу вибору є ефемерною, і використовувати її може лише користувач, який викликав команду.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має збігатися з посиланням вкладення

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

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.discord.dmPolicy` керує доступом до DM (застаріле: `channels.discord.dm.policy`):

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика DM не є open, невідомі користувачі блокуються (або отримують запит на підключення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Числові ID без типу є неоднозначними й відхиляються, якщо явно не задано тип цілі користувача/каналу.

  </Tab>

  <Tab title="Політика guild">
    Обробка guild керується через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова поведінка, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - guild має відповідати `channels.discord.guilds` (бажано `id`, slug також приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовані стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони відповідають `users` АБО `roles`
    - пряме зіставлення імен/тегів типово вимкнене; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для guild налаштовано `channels`, канали, яких немає в списку, забороняються
    - якщо в guild немає блоку `channels`, дозволяються всі канали в цій guild з allowlist

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

    Якщо ви лише задали `DISCORD_BOT_TOKEN` і не створили блок `channels.discord`, резервна поведінка runtime буде `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Згадки та group DM">
    Повідомлення guild типово вимагають згадки.

    Виявлення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    `requireMention` налаштовується для кожної guild/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (крім @everyone/@here).

    Group DM:

    - типово: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів за ролями

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників Discord guild до різних агентів за ID ролі. Прив’язки за ролями приймають лише ID ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише для guild. Якщо прив’язка також задає інші поля зіставлення (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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
  <Accordion title="Створіть застосунок і бота">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Скопіюйте токен бота

  </Accordion>

  <Accordion title="Привілейовані intents">
    У **Bot -> Privileged Gateway Intents** увімкніть:

    - Message Content Intent
    - Server Members Intent (рекомендовано)

    Presence intent необов’язковий і потрібен лише тоді, коли ви хочете отримувати оновлення присутності. Для встановлення присутності бота (`setPresence`) не потрібно вмикати оновлення присутності для учасників.

  </Accordion>

  <Accordion title="OAuth scopes і базові дозволи">
    Генератор OAuth URL:

    - scopes: `bot`, `applications.commands`

    Типові базові дозволи:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (необов’язково)

    Уникайте `Administrator`, якщо він не потрібен явно.

  </Accordion>

  <Accordion title="Скопіюйте ID">
    Увімкніть Discord Developer Mode, а потім скопіюйте:

    - ID сервера
    - ID каналу
    - ID користувача

    Для надійного аудиту й перевірок у конфігурації OpenClaw віддавайте перевагу числовим ID.

  </Accordion>
</AccordionGroup>

## Вбудовані команди та авторизація команд

- `commands.native` типово дорівнює `"auto"` і ввімкнено для Discord.
- Перевизначення для каналу: `channels.discord.commands.native`.
- `commands.native=false` явним чином очищає раніше зареєстровані вбудовані команди Discord.
- Авторизація вбудованих команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди можуть бути видимими в UI Discord навіть для користувачів, які не мають авторизації; виконання все одно застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Slash commands](/tools/slash-commands), щоб переглянути каталог команд і їхню поведінку.

Типові налаштування slash-команд:

- `ephemeral: true`

## Деталі можливостей

<AccordionGroup>
  <Accordion title="Теги відповіді та вбудовані replies">
    Discord підтримує теги reply у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується через `channels.discord.replyToMode`:

    - `off` (типово)
    - `first`
    - `all`

    Примітка: `off` вимикає неявну прив’язку відповідей до threads. Явні теги `[[reply_to_*]]` усе одно враховуються.

    ID повідомлень відображаються в контексті/історії, тому агенти можуть націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд live stream">
    OpenClaw може потоково надсилати чернетки відповідей, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту.

    - `channels.discord.streaming` керує потоковим попереднім переглядом (`off` | `partial` | `block` | `progress`, типово: `off`).
    - Значення `off` залишається типовим, тому що редагування попереднього перегляду в Discord може швидко впертися в ліміти частоти, особливо коли кілька ботів або шлюзів використовують один і той самий обліковий запис або трафік guild.
    - `progress` приймається для узгодженості між каналами та в Discord відображається як `partial`.
    - `channels.discord.streamMode` — застарілий псевдонім, який мігрується автоматично.
    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` надсилає чернетки порціями (для налаштування розміру та точок розбиття використовуйте `draftChunk`).

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

    Типові значення розбиття для режиму `block` (обмежуються `channels.discord.textChunkLimit`):

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

    Примітка: потоковий попередній перегляд — це окрема функція від block streaming. Коли для Discord явно
    ввімкнено block streaming, OpenClaw пропускає preview stream, щоб уникнути подвійного потокового надсилання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка threads">
    Контекст історії guild:

    - `channels.discord.historyLimit` типово `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка threads:

    - Discord threads маршрутизуються як сесії каналів
    - метадані батьківського thread можуть використовуватися для зв’язку з батьківською сесією
    - конфігурація thread успадковує конфігурацію батьківського каналу, якщо немає окремого запису для thread

    Теми каналів додаються як **ненадійний** контекст (а не як системний prompt).
    Контекст reply і цитованих повідомлень наразі зберігається як отриманий.
    Allowlist у Discord переважно визначають, хто може активувати агента, а не є повноцінною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сесії субагентів, прив’язані до thread">
    Discord може прив’язати thread до цілі сесії, щоб подальші повідомлення в цьому thread продовжували маршрутизуватися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` прив’язує поточний/новий thread до цілі субагента/сесії
    - `/unfocus` видаляє поточну прив’язку thread
    - `/agents` показує активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглядає/оновлює автоматичне зняття фокуса через неактивність для фокусованих прив’язок
    - `/session max-age <duration|off>` переглядає/оновлює жорсткий максимальний вік для фокусованих прив’язок

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

    - `session.threadBindings.*` задає глобальні типові значення.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати threads для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати threads для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки thread вимкнені для облікового запису, `/focus` та пов’язані операції прив’язки thread недоступні.

    Див. [Sub-agents](/tools/subagents), [ACP Agents](/tools/acp-agents) і [Configuration Reference](/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні ACP-прив’язки каналів">
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

    - `/acp spawn codex --bind here` прив’язує поточний канал або thread Discord на місці й зберігає маршрутизацію майбутніх повідомлень до тієї самої ACP-сесії.
    - Це все ще може означати «запустити нову ACP-сесію Codex», але саме по собі не створює новий thread Discord. Наявний канал залишається поверхнею чату.
    - Codex усе ще може працювати у власному `cwd` або робочому просторі backend на диску. Цей робочий простір є станом runtime, а не thread Discord.
    - Повідомлення в threads можуть успадковувати ACP-прив’язку батьківського каналу.
    - У прив’язаному каналі або thread команди `/new` і `/reset` скидають ту саму ACP-сесію на місці.
    - Тимчасові прив’язки thread усе ще працюють і можуть перевизначати розв’язання цілі, поки активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній thread через `--thread auto|here`. Він не потрібен для `/acp spawn ... --bind here` у поточному каналі.

    Див. [ACP Agents](/tools/acp-agents), щоб дізнатися подробиці поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожної guild:

    - `off`
    - `own` (типово)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та прикріплюються до маршрутизованої Discord-сесії.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode emoji або власні назви emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані з каналу, типово ввімкнені.

    Це впливає на потоки `/config set|unset` (коли можливості команд увімкнені).

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

  <Accordion title="Проксі шлюзу">
    Маршрутизуйте трафік WebSocket шлюзу Discord і REST-запити під час запуску (ID застосунку + розв’язання allowlist) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
    Увімкніть розв’язання PluralKit, щоб зіставляти проксійовані повідомлення з ідентичністю члена системи:

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

    - allowlist можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ID оригінального повідомлення та обмежуються часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота і відкидаються, якщо не задано `allowBots=true`

  </Accordion>

  <Accordion title="Конфігурація присутності">
    Оновлення присутності застосовуються, коли ви задаєте поле статусу або активності, або коли вмикаєте auto presence.

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

    Приклад активності (custom status — типовий тип активності):

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

    Відповідність типів активності:

    - 0: Playing
    - 1: Streaming (потребує `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (використовує текст активності як стан статусу; emoji необов’язковий)
    - 5: Competing

    Приклад auto presence (сигнал стану runtime):

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

    Auto presence відображає доступність runtime у статус Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує placeholder `{reason}`)

  </Accordion>

  <Accordion title="Погодження в Discord">
    Discord підтримує обробку погоджень за допомогою кнопок у DM і за потреби може публікувати запити на погодження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості резервно використовує `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає вбудовані погодження виконання, коли `enabled` не задано або має значення `"auto"` і вдається розв’язати принаймні одного погоджувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить погоджувачів виконання з `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як вбудований клієнт погодження.

    Коли `target` має значення `channel` або `both`, запит на погодження видно в каналі. Лише розв’язані погоджувачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на погодження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки погодження, які використовуються іншими чат-каналами. Вбудований адаптер Discord головним чином додає маршрутизацію DM погоджувачів і розсилання в канали.
    Коли ці кнопки присутні, вони є основним UX для погоджень; OpenClaw
    повинен включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що погодження через чат недоступні або ручне погодження є єдиним шляхом.

    Автентифікація Gateway для цього обробника використовує той самий спільний контракт розв’язання облікових даних, що й інші клієнти Gateway:

    - локальна автентифікація з пріоритетом env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, потім `gateway.auth.*`)
    - у локальному режимі `gateway.remote.*` може використовуватися як резервний варіант лише тоді, коли `gateway.auth.*` не задано; налаштовані, але не розв’язані локальні SecretRef завершуються із закритою відмовою
    - підтримка remote-mode через `gateway.remote.*`, де це застосовно
    - перевизначення URL безпечні щодо перевизначень: перевизначення CLI не використовують неявні облікові дані повторно, а перевизначення env використовують лише облікові дані env

    Поведінка розв’язання погоджень:

    - ID з префіксом `plugin:` розв’язуються через `plugin.approval.resolve`.
    - Інші ID розв’язуються через `exec.approval.resolve`.
    - Discord не виконує тут додатковий резервний перехід від exec до plugin; префікс
      ID визначає, який метод gateway він викликає.

    Типово строк дії погоджень виконання спливає через 30 хвилин. Якщо погодження завершуються помилкою з
    невідомими ID погоджень, перевірте розв’язання погоджувачів, увімкнення функції та
    те, що доставлений вид ID погодження збігається з очікуваним запитом.

    Пов’язана документація: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Інструменти та обмеження дій

Дії з повідомленнями Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Обмеження дій розташовані в `channels.discord.actions.*`.

Типова поведінка обмежень:

| Група дій                                                                                                                                                                | Типово   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено |
| roles                                                                                                                                                                    | вимкнено |
| moderation                                                                                                                                                               | вимкнено |
| presence                                                                                                                                                                 | вимкнено |

## Components v2 UI

OpenClaw використовує Discord components v2 для погоджень виконання та маркерів між контекстами. Дії з повідомленнями Discord також можуть приймати `components` для власного UI (розширений варіант; потребує побудови payload компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає колір акценту, який використовується контейнерами компонентів Discord (hex).
- Для окремого облікового запису задавайте через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

OpenClaw може приєднуватися до голосових каналів Discord для розмов у реальному часі безперервного характеру. Це окрема можливість від вкладень голосових повідомлень.

Вимоги:

- Увімкніть вбудовані команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Боту потрібні дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте вбудовану команду Discord `/vc join|leave|status` для керування сесіями. Команда використовує агента облікового запису за замовчуванням і підпорядковується тим самим правилам allowlist і group policy, що й інші команди Discord.

Приклад auto-join:

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
- Ходи транскрипції голосу визначають статус власника з `allowFrom` Discord (або `dm.allowFrom`); мовці, які не є власниками, не можуть використовувати інструменти лише для власника (наприклад, `gateway` і `cron`).
- Голос типово ввімкнено; задайте `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` напряму передаються в параметри приєднання `@discordjs/voice`.
- Якщо не задано, типовими для `@discordjs/voice` є `daveEncryption=true` і `decryptionFailureTolerance=24`.
- OpenClaw також відстежує помилки розшифрування під час отримання та автоматично відновлюється, виходячи з голосового каналу й приєднуючись знову після повторних збоїв за короткий проміжок часу.
- Якщо журнали отримання постійно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, можливо, це upstream-баг отримання `@discordjs/voice`, відстежуваний у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд waveform і потребують аудіо OGG/Opus плюс метадані. OpenClaw генерує waveform автоматично, але для перевірки й перетворення аудіофайлів на хості gateway мають бути доступні `ffmpeg` і `ffprobe`.

Вимоги й обмеження:

- Надайте **локальний шлях до файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord не дозволяє текст + голосове повідомлення в одному payload).
- Підтримується будь-який аудіоформат; за потреби OpenClaw перетворює його в OGG/Opus.

Приклад:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлення guild">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви залежите від розв’язання користувачів/учасників
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення guild неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist guild у `channels.discord.guilds`
    - якщо існує мапа `channels` для guild, дозволені лише канали зі списку
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention = false, але все одно блокується">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного allowlist guild/каналу
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або записі каналу)
    - відправника заблоковано allowlist `users` для guild/каналу

  </Accordion>

  <Accordion title="Довготривалі обробники завершуються за тайм-аутом або дають дубльовані відповіді">

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
    - типове значення: `1800000` (30 хвилин); задайте `0`, щоб вимкнути

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

    Використовуйте `eventQueue.listenerTimeout` для повільного налаштування listener, а `inboundWorker.runTimeoutMs`
    лише якщо вам потрібен окремий запобіжник для чергових ходів агента.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення під час runtime усе ще може працювати, але перевірка не може повністю підтвердити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і підключенням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення підключення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    Типово повідомлення, автором яких є бот, ігноруються.

    Якщо ви задали `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникати циклів.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Voice STT переривається з DecryptionFailed(...)">

    - підтримуйте актуальність OpenClaw (`openclaw update`), щоб була присутня логіка відновлення отримання голосу Discord
    - переконайтеся, що `channels.discord.voice.daveEncryption=true` (типово)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (типове upstream-значення) і змінюйте лише за потреби
    - відстежуйте в логах:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть логи й звіртеся з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

Основний довідник:

- [Configuration reference - Discord](/gateway/configuration-reference#discord)

Важливі поля Discord:

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- вхідний worker: `inboundWorker.runTimeoutMs`
- reply/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (застарілий псевдонім: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb`, `retry`
  - `mediaMaxMb` обмежує вихідні завантаження до Discord (типово: `8MB`)
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- можливості: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Безпека й експлуатація

- Розглядайте токени бота як секрети (`DISCORD_BOT_TOKEN` бажано використовувати в керованих середовищах).
- Надавайте мінімально необхідні дозволи Discord.
- Якщо розгортання/стан команд застаріли, перезапустіть gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов’язане

- [Підключення](/channels/pairing)
- [Групи](/channels/groups)
- [Маршрутизація каналів](/channels/channel-routing)
- [Безпека](/gateway/security)
- [Маршрутизація кількох агентів](/concepts/multi-agent)
- [Усунення проблем](/channels/troubleshooting)
- [Slash commands](/tools/slash-commands)
