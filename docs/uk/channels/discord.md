---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-04-24T03:41:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce73e0e6995702f3b2453b2e5ab4e55b02190e64fdf5805f53b4002be63140a2
    source_path: channels/discord.md
    workflow: 15
---

Готово для приватних повідомлень і каналів гільдій через офіційний Gateway Discord.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Приватні повідомлення Discord за замовчуванням працюють у режимі підключення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналом" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно буде створити новий застосунок із ботом, додати бота на свій сервер і підключити його до OpenClaw. Ми рекомендуємо додати бота до вашого власного приватного сервера. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ту назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані інтенти">
    Усе ще на сторінці **Bot**, прокрутіть до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імені з ID)
    - **Presence Intent** (необов’язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен вашого бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він вам незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL-запрошення й додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL-запрошення з потрібними дозволами, щоб додати бота на свій сервер.

    Прокрутіть до **OAuth2 URL Generator** і увімкніть:

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в Discord threads, зокрема у сценаріях форумів або медіаканалів, де створюється або продовжується thread, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно увімкнути Developer Mode, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші на **значку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші на **своєму аватарі** → **Copy User ID**

    Збережіть свій **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три значення до OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб підключення працювало, Discord має дозволяти вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою миші на **значку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (зокрема ботам) надсилати вам приватні повідомлення. Залишайте це ввімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, після підключення можна вимкнути приватні повідомлення.

  </Step>

  <Step title="Безпечно задайте токен вашого бота (не надсилайте його в чат)">
    Токен вашого бота Discord — це секрет (як пароль). Задайте його на машині, де запущено OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте підключення">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Напишіть своєму агенту OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому про це. Якщо Discord — ваш перший канал, скористайтеся вкладкою CLI / config.

        > "Я вже задав токен мого бота Discord у config. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
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

        Підтримуються текстові значення `token`. Для `channels.discord.token` також підтримуються значення SecretRef через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше підключення через приватні повідомлення">
    Дочекайтеся, поки Gateway запуститься, а потім надішліть своєму боту приватне повідомлення в Discord. Він відповість кодом підключення.

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

    Тепер ви маєте мати змогу спілкуватися зі своїм агентом у Discord через приватні повідомлення.

  </Step>
</Steps>

<Note>
Визначення токена залежить від облікового запису. Значення токена в config мають пріоритет над резервним env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` використовується для цього конкретного виклику. Це стосується дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Налаштування політики облікового запису/повторних спроб усе одно беруться з вибраного облікового запису в активному runtime snapshot.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Після того як приватні повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал матиме власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist гільдій">
    Це дає змогу вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в приватних повідомленнях.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Server ID Discord `<server_id>` до allowlist гільдій"
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
    За замовчуванням ваш агент відповідає в каналах гільдії лише коли його згадують через @mention. Для приватного сервера ви, ймовірно, захочете, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без потреби в @mention"
      </Tab>
      <Tab title="Config">
        Установіть `requireMention: false` у конфігурації вашої гільдії:

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

  <Step title="Сплануйте використання пам’яті в каналах гільдії">
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в сесіях приватних повідомлень. У каналах гільдії `MEMORY.md` не завантажується автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони впроваджуються в кожну сесію). Довготривалі нотатки зберігайте в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкування. Ваш агент бачить назву каналу, а кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому робочому процесу.

## Модель runtime

- Gateway керує підключенням до Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення з Discord повертаються в Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують спільну основну сесію агента (`agent:main:main`).
- Канали гільдій мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Group DMs за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих сесіях команд (`agent:<agentId>:discord:slash:<userId>`), водночас несучи `CommandTargetSessionKey` до сесії розмови, куди виконується маршрутизація.

## Канали форумів

Форуми Discord і медіаканали приймають лише дописи в threads. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити thread. Заголовок thread використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити thread безпосередньо. Не передавайте `--message-id` для каналів форумів.

Приклад: надсилання до батьківського форуму для створення thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явне створення forum thread

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте в сам thread (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, виборів і форм, доки не сплине їхній термін дії.

Щоб обмежити, хто може натиснути кнопку, задайте `allowedUsers` для цієї кнопки (Discord user ID, теги або `*`). Якщо це налаштовано, користувачі, які не збігаються, отримають ефемерну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадними списками провайдера та моделі, а також кроком Submit. Якщо не задано `commands.modelsWrite=false`, `/models add` також підтримує додавання нового запису провайдера/моделі з чату, а щойно додані моделі з’являються без перезапуску Gateway. Відповідь засобу вибору є ефемерною, і лише користувач, який його викликав, може ним користуватися.

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
            label: "Підтвердити",
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
        { type: "text", label: "Ініціатор" },
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

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика приватних повідомлень">
    `channels.discord.dmPolicy` керує доступом до приватних повідомлень (застаріле: `channels.discord.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика приватних повідомлень не є open, невідомі користувачі блокуються (або отримують запит на підключення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат DM target для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Числові ID без префікса неоднозначні та відхиляються, якщо явно не вказано тип цілі user/channel.

  </Tab>

  <Tab title="Політика гільдій">
    Обробка гільдій контролюється через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечне базове значення, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має відповідати `channels.discord.guilds` (бажано `id`, slug також приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони відповідають `users` АБО `roles`
    - пряме зіставлення за іменем/тегом за замовчуванням вимкнено; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для гільдії налаштовано `channels`, канали поза списком забороняються
    - якщо гільдія не має блоку `channels`, дозволяються всі канали в цій allowlist-гілдії

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

    Якщо ви лише задали `DISCORD_BOT_TOKEN` і не створили блок `channels.discord`, резервне значення runtime буде `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Згадки та Group DMs">
    Повідомлення гільдій за замовчуванням вимагають згадки.

    Визначення згадки включає:

    - явну згадку бота
    - налаштовані шаблони згадки (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    `requireMention` налаштовується окремо для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (крім @everyone/@here).

    Group DMs:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів за ролями

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer та перед прив’язками лише на рівні гільдії. Якщо прив’язка також задає інші поля match (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

## Нативні команди та авторизація команд

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнено для Discord.
- Перевизначення для каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не авторизовані; виконання все одно застосовує авторизацію OpenClaw і повертає "не авторизовано".

Див. [Слеш-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Типові налаштування слеш-команд:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Теги відповідей і нативні відповіді">
    Discord підтримує теги відповідей у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Це контролюється через `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне гілкування відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди прикріплює неявне посилання нативної відповіді до першого вихідного повідомлення Discord у межах ходу.
    `batched` прикріплює неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був дебаунс-пакетом із кількох повідомлень. Це корисно,
    коли вам потрібні нативні відповіді переважно для неоднозначних швидких чатів, а не для кожного
    окремого повідомлення.

    ID повідомлень додаються до контексту/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд живого потоку">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` у Discord відображається як `partial`; `streamMode` — застарілий псевдонім, який мігрується автоматично.

    Типове значення залишається `off`, оскільки редагування попереднього перегляду в Discord швидко впираються в обмеження частоти, коли кілька ботів або Gateway спільно використовують один обліковий запис.

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

    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk` для налаштування розміру та точок розриву, обмежених `textChunkLimit`).
    - Остаточні повідомлення з медіа, помилками та явними відповідями скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли явно ввімкнено потоковий режим `block`, OpenClaw пропускає попередній потік, щоб уникнути подвійного потокового виводу.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка thread">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією приватних повідомлень:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка thread:

    - Discord threads маршрутизуються як сесії каналів і успадковують конфігурацію батьківського каналу, якщо не перевизначено інше.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) дає новим auto-threads змогу починати з батьківського транскрипту. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть визначати DM target `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервного активування на етапі відповіді.

    Теми каналів впроваджуються як **ненадійний** контекст. Allowlist контролюють, хто може запускати агента, але не є повноцінною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сесії, прив’язані до thread, для субагентів">
    Discord може прив’язати thread до цілі сесії, щоб наступні повідомлення в цьому thread і далі маршрутизувалися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` прив’язати поточний/новий thread до цілі субагента/сесії
    - `/unfocus` прибрати поточну прив’язку thread
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне зняття фокусу через неактивність для прив’язок із фокусом
    - `/session max-age <duration|off>` переглянути/оновити жорсткий максимальний вік для прив’язок із фокусом

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
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати threads для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати threads для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки thread вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки thread недоступні.

    Див. [Субагенти](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Довідник з конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних ACP-робочих просторів "always-on" налаштуйте типізовані прив’язки ACP верхнього рівня, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або thread на місці й зберігає майбутні повідомлення в тій самій ACP-сесії. Повідомлення thread успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або thread команди `/new` і `/reset` скидають ту саму ACP-сесію на місці. Тимчасові прив’язки thread можуть перевизначати визначення цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній thread через `--thread auto|here`.

    Див. [ACP Agents](/uk/tools/acp-agents) для деталей поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожної гільдії:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та додаються до маршрутизованої сесії Discord.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервне значення emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode emoji або назви власних emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи в config">
    Ініційовані з каналу записи в config увімкнені за замовчуванням.

    Це впливає на сценарії `/config set|unset` (коли функції команд увімкнені).

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

  <Accordion title="Gateway proxy">
    Маршрутизуйте WebSocket-трафік Gateway Discord і стартові REST-запити (ID застосунку + визначення allowlist) через HTTP(S) proxy за допомогою `channels.discord.proxy`.

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
        token: "pk_live_...", // необов’язково; потрібен для приватних систем
      },
    },
  },
}
```

    Примітки:

    - allowlist можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошук використовує ID початкового повідомлення й обмежується часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо тільки не `allowBots=true`

  </Accordion>

  <Accordion title="Налаштування присутності">
    Оновлення присутності застосовуються, коли ви задаєте статус або поле активності, або коли вмикаєте auto presence.

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

    Приклад активності (custom status — тип активності за замовчуванням):

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

    Відповідність типів активності:

    - 0: Playing
    - 1: Streaming (потрібен `activityUrl`)
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
        exhaustedText: "токен вичерпано",
      },
    },
  },
}
```

    Auto presence відображає доступність runtime у статус Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Підтвердження в Discord">
    Discord підтримує обробку підтверджень за допомогою кнопок у DM і може за потреби публікувати запити на підтвердження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовує резервне значення `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні exec approvals, коли `enabled` не задано або має значення `"auto"` і можна визначити щонайменше одного approving-користувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не визначає exec approvers з `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт підтверджень.

    Коли `target` має значення `channel` або `both`, запит на підтвердження видно в каналі. Лише визначені approvers можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на підтвердження містять текст команди, тому доставку в канал слід вмикати лише в довірених каналах. Якщо ID каналу неможливо визначити з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки підтвердження, які використовуються іншими чат-каналами. Нативний адаптер Discord головним чином додає DM-маршрутизацію approver-користувачів і fanout у канали.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що чат-підтвердження недоступні або ручне підтвердження — єдиний шлях.

    Авторизація Gateway і визначення підтвердження дотримуються спільного контракту клієнта Gateway (`plugin:` ID визначаються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Термін дії підтверджень за замовчуванням спливає через 30 хвилин.

    Див. [Exec approvals](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та обмеження дій

Дії повідомлень Discord включають надсилання повідомлень, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- повідомлення: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файла), щоб задати обкладинку запланованої події.

Обмеження дій розміщуються в `channels.discord.actions.*`.

Типова поведінка обмежень:

| Група дій                                                                                                                                                                 | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                     | вимкнено         |
| moderation                                                                                                                                                                | вимкнено         |
| presence                                                                                                                                                                  | вимкнено         |

## UI компонентів v2

OpenClaw використовує компоненти Discord v2 для exec approvals і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для власного UI (розширено; вимагає побудови payload компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендуються.

- `channels.discord.ui.components.accentColor` задає accent color, що використовується контейнерами компонентів Discord (hex).
- Задавайте для окремого облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` ігноруються, коли присутні компоненти v2.

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

## Голос

Discord має дві окремі голосові поверхні: **голосові канали** реального часу (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду waveform). Gateway підтримує обидві.

### Голосові канали

Вимоги:

- Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Боту потрібні дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте `/vc join|leave|status` для керування сесіями. Команда використовує агента облікового запису за замовчуванням і дотримується тих самих правил allowlist та group policy, що й інші команди Discord.

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
- Голос увімкнено за замовчуванням; задайте `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` напряму передаються до параметрів приєднання `@discordjs/voice`.
- Значення за замовчуванням `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо вони не задані.
- OpenClaw також відстежує збої дешифрування під час отримання і автоматично відновлюється, виходячи та повторно приєднуючись до голосового каналу після повторних збоїв у короткому часовому вікні.
- Якщо журнали отримання постійно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути upstream-помилка отримання `@discordjs/voice`, описана в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд waveform і вимагають аудіо у форматі OGG/Opus. OpenClaw генерує waveform автоматично, але потребує `ffmpeg` і `ffprobe` на хості Gateway для аналізу й конвертації.

- Надайте **шлях до локального файла** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує його в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень гільдії">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви залежите від визначення користувача/учасника
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення гільдії блокуються неочікувано">

    - перевірте `groupPolicy`
    - перевірте allowlist гільдії в `channels.discord.guilds`
    - якщо існує мапа `channels` гільдії, дозволені лише канали зі списку
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, але все одно заблоковано">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного allowlist гільдії/каналу
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано allowlist `users` гільдії/каналу

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
    лише якщо вам потрібен окремий запобіжник для поставлених у чергу ходів агента.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів у `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення runtime все одно може працювати, але probe не зможе повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і підключенням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - у режимі `pairing` очікується підтвердження підключення

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Voice STT переривається з DecryptionFailed(...)">

    - підтримуйте актуальність OpenClaw (`openclaw update`), щоб була присутня логіка відновлення отримання голосу Discord
    - переконайтеся, що `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (upstream-значення за замовчуванням) і налаштовуйте лише за потреби
    - відстежуйте журнали на наявність:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали та порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Довідник з конфігурації

Основний довідник: [Довідник з конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Ключові поля Discord">

- запуск/авторизація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- відповіді/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb` (обмежує вихідні завантаження Discord, за замовчуванням `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневі `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та експлуатація

- Розглядайте токени ботів як секрети (`DISCORD_BOT_TOKEN` бажано використовувати в керованих середовищах).
- Надавайте Discord лише мінімально необхідні дозволи.
- Якщо стан розгортання/стан команд застарілий, перезапустіть gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Підключіть користувача Discord до gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групових чатів і allowlist.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Маршрутизація між агентами" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте гільдії та канали з агентами.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
