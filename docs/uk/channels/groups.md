---
read_when:
    - Зміна поведінки групових чатів або керування згадками
summary: Поведінка групових чатів на різних поверхнях (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Групи
x-i18n:
    generated_at: "2026-04-23T22:57:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9307dce2e61868081e3ef92b4c3315fc079fc1b54e379ca32c6ec184aa9e6909
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw однаково обробляє групові чати на різних поверхнях: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Вступ для початківців (2 хвилини)

OpenClaw «живе» у ваших власних облікових записах месенджерів. Окремого користувача-бота WhatsApp немає.
Якщо **ви** перебуваєте в групі, OpenClaw може бачити цю групу й відповідати там.

Поведінка за замовчуванням:

- Групи обмежені (`groupPolicy: "allowlist"`).
- Для відповідей потрібна згадка, якщо ви явно не вимкнете керування згадками.

Простіше кажучи: відправники з allowlist можуть запускати OpenClaw, згадавши його.

> Коротко
>
> - **Доступ до DM** контролюється через `*.allowFrom`.
> - **Доступ до груп** контролюється через `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
> - **Запуск відповіді** контролюється через керування згадками (`requireMention`, `/activation`).

Швидка схема (що відбувається з повідомленням у групі):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Видимість контексту та allowlist

У безпеці груп використовуються два різні механізми керування:

- **Авторизація запуску**: хто може запускати агента (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist для конкретного каналу).
- **Видимість контексту**: який додатковий контекст передається в модель (текст відповіді, цитати, історія треду, метадані пересилання).

За замовчуванням OpenClaw надає пріоритет звичайній поведінці чату та зберігає контекст переважно таким, яким його було отримано. Це означає, що allowlist насамперед визначають, хто може запускати дії, а не є універсальною межею редагування для кожного процитованого чи історичного фрагмента.

Поточна поведінка залежить від каналу:

- У деяких каналах уже застосовується фільтрація за відправником для додаткового контексту в окремих шляхах (наприклад, початкове заповнення тредів у Slack, пошук відповідей/тредів у Matrix).
- Інші канали все ще передають контекст цитат/відповідей/пересилань у тому вигляді, у якому його було отримано.

Напрям посилення безпеки (заплановано):

- `contextVisibility: "all"` (за замовчуванням) зберігає поточну поведінку «як отримано».
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників з allowlist.
- `contextVisibility: "allowlist_quote"` — це `allowlist` плюс один явний виняток для цитати/відповіді.

Поки цю модель посилення безпеки не буде реалізовано однаково в усіх каналах, очікуйте відмінностей залежно від поверхні.

![Потік повідомлень у групі](/images/groups-flow.svg)

Якщо ви хочете...

| Ціль                                         | Що встановити                                             |
| -------------------------------------------- | --------------------------------------------------------- |
| Дозволити всі групи, але відповідати лише на @mentions | `groups: { "*": { requireMention: true } }`               |
| Вимкнути всі відповіді в групах              | `groupPolicy: "disabled"`                                 |
| Лише певні групи                             | `groups: { "<group-id>": { ... } }` (без ключа `"*"`)     |
| Лише ви можете запускати в групах            | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Ключі сесій

- Групові сесії використовують ключі сесій `agent:<agentId>:<channel>:group:<id>` (кімнати/канали використовують `agent:<agentId>:<channel>:channel:<id>`).
- Теми форуму Telegram додають `:topic:<threadId>` до id групи, тому кожна тема має власну сесію.
- Прямі чати використовують основну сесію (або окрему для кожного відправника, якщо це налаштовано).
- Heartbeat пропускаються для групових сесій.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Шаблон: особисті DM + публічні групи (один агент)

Так — це добре працює, якщо ваш «особистий» трафік — це **DM**, а «публічний» трафік — це **групи**.

Чому: у режимі одного агента DM зазвичай потрапляють в **основний** ключ сесії (`agent:main:main`), тоді як групи завжди використовують **неосновні** ключі сесій (`agent:main:<channel>:group:<id>`). Якщо ви ввімкнете ізоляцію через `mode: "non-main"`, ці групові сесії виконуватимуться в налаштованому ізольованому бекенді, тоді як ваша основна DM-сесія залишатиметься на хості. Docker є бекендом за замовчуванням, якщо ви не виберете інший.

Це дає вам один «мозок» агента (спільний робочий простір + пам’ять), але дві різні моделі виконання:

- **DM**: повні інструменти (хост)
- **Групи**: sandbox + обмежені інструменти

> Якщо вам потрібні справді окремі робочі простори/персони («особисте» й «публічне» ніколи не повинні змішуватися), використовуйте другого агента + прив’язки. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent).

Приклад (DM на хості, групи в sandbox + лише інструменти для обміну повідомленнями):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Хочете, щоб «групи могли бачити лише папку X» замість «жодного доступу до хоста»? Залиште `workspaceAccess: "none"` і змонтуйте в sandbox лише шляхи з allowlist:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Пов’язане:

- Ключі конфігурації та значення за замовчуванням: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- Налагодження причин, чому інструмент заблоковано: [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)
- Докладно про bind mounts: [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts)

## Мітки відображення

- Мітки в UI використовують `displayName`, якщо воно доступне, у форматі `<channel>:<token>`.
- `#room` зарезервовано для кімнат/каналів; групові чати використовують `g-<slug>` (нижній регістр, пробіли -> `-`, зберігати `#@+._-`).

## Політика груп

Керуйте тим, як обробляються повідомлення груп/кімнат для кожного каналу:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Політика      | Поведінка                                                     |
| ------------- | ------------------------------------------------------------- |
| `"open"`      | Групи обходять allowlist; керування згадками все одно діє.    |
| `"disabled"`  | Повністю блокує всі повідомлення груп.                        |
| `"allowlist"` | Дозволяє лише групи/кімнати, що відповідають налаштованому allowlist. |

Примітки:

- `groupPolicy` відокремлено від керування згадками (яке вимагає @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: використовуйте `groupAllowFrom` (резервний варіант: явний `allowFrom`).
- Підтвердження спаровування DM (записи сховища `*-allowFrom`) застосовуються лише до доступу DM; авторизація відправників у групах залишається явно прив’язаною до group allowlist.
- Discord: allowlist використовує `channels.discord.guilds.<id>.channels`.
- Slack: allowlist використовує `channels.slack.channels`.
- Matrix: allowlist використовує `channels.matrix.groups`. Віддавайте перевагу id кімнат або псевдонімам; пошук імен приєднаних кімнат виконується в режимі best-effort, а нерозпізнані імена ігноруються під час виконання. Використовуйте `channels.matrix.groupAllowFrom` для обмеження відправників; також підтримуються allowlist `users` для окремих кімнат.
- Групові DM керуються окремо (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Allowlist Telegram може збігатися з id користувачів (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) або іменами користувачів (`"@alice"` або `"alice"`); префікси нечутливі до регістру.
- Значення за замовчуванням — `groupPolicy: "allowlist"`; якщо ваш group allowlist порожній, повідомлення груп блокуються.
- Безпека під час виконання: коли блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп переходить до fail-closed режиму (зазвичай `allowlist`) замість успадкування `channels.defaults.groupPolicy`.

Швидка ментальна модель (порядок обчислення для групових повідомлень):

1. `groupPolicy` (open/disabled/allowlist)
2. group allowlist (`*.groups`, `*.groupAllowFrom`, allowlist для конкретного каналу)
3. керування згадками (`requireMention`, `/activation`)

## Керування згадками (за замовчуванням)

Для повідомлень у групах потрібна згадка, якщо це не перевизначено для конкретної групи. Значення за замовчуванням для кожної підсистеми розміщено в `*.groups."*"`.

Відповідь на повідомлення бота вважається неявною згадкою, якщо канал
підтримує метадані відповіді. Цитування повідомлення бота також може вважатися неявною
згадкою в каналах, які надають метадані цитування. Поточні вбудовані випадки включають
Telegram, WhatsApp, Slack, Discord, Microsoft Teams і ZaloUser.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Примітки:

- `mentionPatterns` — це безпечні regex-шаблони, нечутливі до регістру; некоректні шаблони та небезпечні вкладені повторення ігноруються.
- Поверхні, що надають явні згадки, як і раніше проходять перевірку; шаблони є резервним варіантом.
- Перевизначення для конкретного агента: `agents.list[].groupChat.mentionPatterns` (корисно, коли кілька агентів спільно використовують одну групу).
- Керування згадками застосовується лише тоді, коли виявлення згадок можливе (власні згадки або налаштовано `mentionPatterns`).
- Значення за замовчуванням для Discord розміщено в `channels.discord.guilds."*"` (можна перевизначити для конкретного сервера/каналу).
- Контекст історії груп однаково обгортається в усіх каналах і є **лише pending** (повідомлення, пропущені через керування згадками); використовуйте `messages.groupChat.historyLimit` для глобального значення за замовчуванням і `channels.<channel>.historyLimit` (або `channels.<channel>.accounts.*.historyLimit`) для перевизначень. Встановіть `0`, щоб вимкнути.

## Обмеження інструментів для груп/каналів (необов’язково)

Деякі конфігурації каналів підтримують обмеження того, які інструменти доступні **в межах конкретної групи/кімнати/каналу**.

- `tools`: дозволити/заборонити інструменти для всієї групи.
- `toolsBySender`: перевизначення для конкретних відправників у межах групи.
  Використовуйте явні префікси ключів:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` і символ підстановки `"*"`.
  Старі ключі без префікса все ще приймаються та зіставляються лише як `id:`.

Порядок визначення (найбільш конкретний має пріоритет):

1. збіг `toolsBySender` для групи/каналу
2. `tools` для групи/каналу
3. збіг `toolsBySender` за замовчуванням (`"*"`)
4. `tools` за замовчуванням (`"*"`)

Приклад (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Примітки:

- Обмеження інструментів для груп/каналів застосовуються додатково до глобальної/агентської політики інструментів (заборона все одно має пріоритет).
- Деякі канали використовують іншу вкладеність для кімнат/каналів (наприклад, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Group allowlist

Коли налаштовано `channels.whatsapp.groups`, `channels.telegram.groups` або `channels.imessage.groups`, ключі діють як group allowlist. Використовуйте `"*"` для дозволу всіх груп, зберігаючи можливість задати поведінку згадок за замовчуванням.

Поширена плутанина: підтвердження спаровування DM — це не те саме, що авторизація груп.
Для каналів, які підтримують спаровування DM, сховище спаровування відкриває лише DM. Команди в групах, як і раніше, потребують явної авторизації відправника групи через allowlist у конфігурації, такі як `groupAllowFrom`, або задокументований резервний варіант конфігурації для цього каналу.

Поширені наміри (скопіюйте/вставте):

1. Вимкнути всі відповіді в групах

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Дозволити лише певні групи (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Дозволити всі групи, але вимагати згадку (явно)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Лише власник може запускати в групах (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Активація (лише для власника)

Власники груп можуть перемикати активацію для кожної групи:

- `/activation mention`
- `/activation always`

Власник визначається через `channels.whatsapp.allowFrom` (або через власний E.164 бота, якщо значення не задано). Надсилайте команду як окреме повідомлення. Інші поверхні наразі ігнорують `/activation`.

## Поля контексту

Вхідні дані груп встановлюють:

- `ChatType=group`
- `GroupSubject` (якщо відомо)
- `GroupMembers` (якщо відомо)
- `WasMentioned` (результат керування згадками)
- Теми форуму Telegram також включають `MessageThreadId` і `IsForum`.

Примітки для конкретних каналів:

- BlueBubbles може за бажанням збагачувати учасників без імен у групах macOS із локальної бази даних Contacts перед заповненням `GroupMembers`. За замовчуванням це вимкнено й виконується лише після проходження звичайної перевірки груп.

Системний промпт агента включає вступ для групи на першому ході нової групової сесії. Він нагадує моделі відповідати як людині, уникати таблиць Markdown, мінімізувати порожні рядки, дотримуватися звичайних інтервалів у чаті й уникати введення буквальних послідовностей `\n`. Назви груп і позначки учасників, отримані з каналу, відображаються як огороджені ненадійні метадані, а не як вбудовані системні інструкції.

## Особливості iMessage

- Для маршрутизації або allowlist віддавайте перевагу `chat_id:<id>`.
- Перегляд списку чатів: `imsg chats --limit 20`.
- Відповіді в групах завжди повертаються до того самого `chat_id`.

## Системні промпти WhatsApp

Див. [WhatsApp](/uk/channels/whatsapp#system-prompts) для канонічних правил системних промптів WhatsApp, включно з визначенням групових і прямих промптів, поведінкою wildcard і семантикою перевизначення облікового запису.

## Особливості WhatsApp

Див. [Групові повідомлення](/uk/channels/group-messages) для поведінки лише WhatsApp (вставлення історії, подробиці обробки згадок).

## Пов’язане

- [Групові повідомлення](/uk/channels/group-messages)
- [Групи трансляції](/uk/channels/broadcast-groups)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Спаровування](/uk/channels/pairing)
