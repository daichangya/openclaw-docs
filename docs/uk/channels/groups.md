---
read_when:
    - Зміна поведінки групового чату або керування згадками
summary: Поведінка групового чату на різних поверхнях (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Групи
x-i18n:
    generated_at: "2026-04-24T03:41:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw узгоджено обробляє групові чати на різних поверхнях: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Вступ для початківців (2 хвилини)

OpenClaw «живе» у ваших власних облікових записах месенджерів. Окремого користувача-бота WhatsApp не існує.
Якщо **ви** перебуваєте в групі, OpenClaw може бачити цю групу й відповідати там.

Поведінка за замовчуванням:

- Групи обмежені (`groupPolicy: "allowlist"`).
- Для відповідей потрібна згадка, якщо ви явно не вимкнули керування згадками.

Простіше кажучи: відправники з allowlist можуть активувати OpenClaw, згадавши його.

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

У безпеці груп задіяно два різні механізми:

- **Авторизація запуску**: хто може активувати агента (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist, специфічні для каналу).
- **Видимість контексту**: який додатковий контекст передається в модель (текст відповіді, цитати, історія треду, метадані пересилання).

За замовчуванням OpenClaw надає пріоритет звичайній поведінці чату й здебільшого зберігає контекст у тому вигляді, в якому його отримано. Це означає, що allowlist насамперед визначають, хто може запускати дії, а не є універсальною межею редагування для кожного процитованого або історичного фрагмента.

Поточна поведінка залежить від каналу:

- Деякі канали вже застосовують фільтрацію за відправником для додаткового контексту в окремих шляхах (наприклад, заповнення тредів у Slack, пошук відповідей/тредів у Matrix).
- Інші канали все ще передають контекст цитат/відповідей/пересилань у тому вигляді, в якому його отримано.

Напрям посилення безпеки (заплановано):

- `contextVisibility: "all"` (типове значення) зберігає поточну поведінку «як отримано».
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників з allowlist.
- `contextVisibility: "allowlist_quote"` — це `allowlist` плюс один явний виняток для цитати/відповіді.

Доки цю модель посилення безпеки не буде реалізовано узгоджено в усіх каналах, очікуйте відмінностей залежно від поверхні.

![Схема повідомлення в групі](/images/groups-flow.svg)

Якщо ви хочете...

| Ціль                                         | Що налаштувати                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Дозволити всі групи, але відповідати лише на @згадки | `groups: { "*": { requireMention: true } }`                |
| Вимкнути всі відповіді в групах              | `groupPolicy: "disabled"`                                  |
| Лише певні групи                             | `groups: { "<group-id>": { ... } }` (без ключа `"*"`)      |
| Лише ви можете запускати в групах            | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Ключі сесій

- Групові сесії використовують ключі сесій `agent:<agentId>:<channel>:group:<id>` (кімнати/канали використовують `agent:<agentId>:<channel>:channel:<id>`).
- Теми форуму Telegram додають `:topic:<threadId>` до ідентифікатора групи, тому кожна тема має власну сесію.
- Прямі чати використовують основну сесію (або окрему для кожного відправника, якщо це налаштовано).
- Heartbeat для групових сесій пропускаються.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Шаблон: особисті DM + публічні групи (один агент)

Так — це добре працює, якщо ваш «особистий» трафік — це **DM**, а ваш «публічний» трафік — це **групи**.

Чому: у режимі одного агента DM зазвичай потрапляють до ключа **основної** сесії (`agent:main:main`), тоді як групи завжди використовують ключі **неосновних** сесій (`agent:main:<channel>:group:<id>`). Якщо ви ввімкнете ізоляцію через `mode: "non-main"`, ці групові сесії працюватимуть у налаштованому sandbox backend, тоді як ваша основна DM-сесія залишиться на хості. Якщо ви не оберете інший backend, типово використовується Docker.

Це дає вам один «розум» агента (спільний робочий простір + пам’ять), але дві моделі виконання:

- **DM**: повний набір інструментів (хост)
- **Групи**: sandbox + обмежені інструменти

> Якщо вам потрібні справді окремі робочі простори/персони («особистий» і «публічний» ніколи не повинні змішуватися), використовуйте другого агента + bindings. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent).

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

Хочете, щоб «групи могли бачити лише папку X» замість «без доступу до хоста»? Залиште `workspaceAccess: "none"` і змонтуйте в sandbox лише шляхи з allowlist:

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

- Ключі конфігурації та типові значення: [Конфігурація Gateway](/uk/gateway/config-agents#agentsdefaultssandbox)
- Налагодження причин, чому інструмент заблоковано: [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)
- Подробиці bind mount: [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts)

## Мітки відображення

- Мітки в UI використовують `displayName`, коли він доступний, у форматі `<channel>:<token>`.
- `#room` зарезервовано для кімнат/каналів; групові чати використовують `g-<slug>` (нижній регістр, пробіли -> `-`, зберігаються `#@+._-`).

## Політика груп

Керуйте тим, як обробляються повідомлення груп/кімнат у кожному каналі:

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

| Політика     | Поведінка                                                    |
| ------------ | ------------------------------------------------------------ |
| `"open"`     | Групи оминають allowlist; керування згадками все ще діє.     |
| `"disabled"` | Повністю блокує всі повідомлення з груп.                     |
| `"allowlist"` | Дозволяє лише ті групи/кімнати, що відповідають налаштованому allowlist. |

Примітки:

- `groupPolicy` відокремлено від керування згадками (яке вимагає @згадок).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: використовуйте `groupAllowFrom` (резервно: явний `allowFrom`).
- Підтвердження сполучення DM (записи сховища `*-allowFrom`) застосовуються лише до доступу DM; авторизація відправника в групі залишається явно прив’язаною до allowlist груп.
- Discord: allowlist використовує `channels.discord.guilds.<id>.channels`.
- Slack: allowlist використовує `channels.slack.channels`.
- Matrix: allowlist використовує `channels.matrix.groups`. Віддавайте перевагу ID кімнат або псевдонімам; пошук за назвою приєднаної кімнати є best-effort, а нерозв’язані назви ігноруються під час виконання. Використовуйте `channels.matrix.groupAllowFrom` для обмеження відправників; також підтримуються allowlist `users` для окремих кімнат.
- Групові DM керуються окремо (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram allowlist може відповідати ID користувача (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) або іменам користувачів (`"@alice"` або `"alice"`); префікси нечутливі до регістру.
- Типове значення — `groupPolicy: "allowlist"`; якщо ваш group allowlist порожній, повідомлення з груп блокуються.
- Безпека під час виконання: коли блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп переходить у fail-closed режим (зазвичай `allowlist`) замість успадкування `channels.defaults.groupPolicy`.

Швидка ментальна модель (порядок перевірки для повідомлень у групі):

1. `groupPolicy` (open/disabled/allowlist)
2. group allowlist (`*.groups`, `*.groupAllowFrom`, allowlist, специфічний для каналу)
3. керування згадками (`requireMention`, `/activation`)

## Керування згадками (типово)

Повідомлення в групі вимагають згадки, якщо це не перевизначено для конкретної групи. Типові значення зберігаються для кожної підсистеми в `*.groups."*"`.

Відповідь на повідомлення бота вважається неявною згадкою, якщо канал
підтримує метадані відповіді. Цитування повідомлення бота також може вважатися неявною
згадкою на каналах, які надають метадані цитати. Поточні вбудовані випадки включають
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

- `mentionPatterns` — це нечутливі до регістру безпечні regex-шаблони; недійсні шаблони та небезпечні форми з вкладеним повторенням ігноруються.
- Поверхні, які надають явні згадки, усе одно проходять перевірку; шаблони — це запасний варіант.
- Перевизначення для агента: `agents.list[].groupChat.mentionPatterns` (корисно, коли кілька агентів спільно використовують одну групу).
- Керування згадками застосовується лише тоді, коли виявлення згадок можливе (власні згадки або налаштовані `mentionPatterns`).
- Типові значення Discord розміщені в `channels.discord.guilds."*"` (можна перевизначити для guild/channel).
- Контекст історії групи уніфіковано обгортається між каналами й є **лише для pending** (повідомлення, пропущені через керування згадками); використовуйте `messages.groupChat.historyLimit` для глобального типового значення та `channels.<channel>.historyLimit` (або `channels.<channel>.accounts.*.historyLimit`) для перевизначень. Встановіть `0`, щоб вимкнути.

## Обмеження інструментів для групи/каналу (необов’язково)

Деякі конфігурації каналів підтримують обмеження того, які інструменти доступні **в межах конкретної групи/кімнати/каналу**.

- `tools`: дозволити/заборонити інструменти для всієї групи.
- `toolsBySender`: перевизначення для конкретних відправників у межах групи.
  Використовуйте явні префікси ключів:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` і wildcard `"*"`.
  Старі ключі без префікса все ще приймаються та зіставляються лише як `id:`.

Порядок визначення (найспецифічніший варіант перемагає):

1. збіг `toolsBySender` для групи/каналу
2. `tools` для групи/каналу
3. збіг типового (`"*"`) `toolsBySender`
4. типове (`"*"`) `tools`

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

- Обмеження інструментів для групи/каналу застосовуються додатково до глобальної/агентської політики інструментів (заборона все одно має пріоритет).
- Деякі канали використовують іншу вкладеність для кімнат/каналів (наприклад, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Group allowlist

Коли налаштовано `channels.whatsapp.groups`, `channels.telegram.groups` або `channels.imessage.groups`, ключі діють як group allowlist. Використовуйте `"*"` для дозволу всіх груп, зберігаючи можливість задати типову поведінку згадок.

Поширена плутанина: підтвердження сполучення DM — це не те саме, що авторизація груп.
Для каналів, які підтримують сполучення DM, сховище сполучень відкриває доступ лише до DM. Команди в групах усе одно потребують явної авторизації відправника групи з allowlist у конфігурації, таких як `groupAllowFrom` або задокументований резервний варіант конфігурації для цього каналу.

Поширені сценарії (скопіювати/вставити):

1. Вимкнути всі відповіді в групах

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Дозволити лише конкретні групи (WhatsApp)

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

Власники груп можуть перемикати активацію для кожної групи окремо:

- `/activation mention`
- `/activation always`

Власник визначається через `channels.whatsapp.allowFrom` (або через власний E.164 бота, якщо не задано). Надсилайте команду як окреме повідомлення. Інші поверхні наразі ігнорують `/activation`.

## Поля контексту

Вхідні payload для груп задають:

- `ChatType=group`
- `GroupSubject` (якщо відомо)
- `GroupMembers` (якщо відомо)
- `WasMentioned` (результат керування згадками)
- Теми форуму Telegram також включають `MessageThreadId` і `IsForum`.

Примітки для конкретних каналів:

- BlueBubbles може за бажанням збагачувати учасників без імен у групах macOS з локальної бази даних Contacts перед заповненням `GroupMembers`. Це вимкнено за замовчуванням і виконується лише після проходження звичайної перевірки групи.

Системний prompt агента містить вступ для групи на першому ході нової групової сесії. Він нагадує моделі відповідати як людині, уникати Markdown-таблиць, мінімізувати порожні рядки, дотримуватися звичайних інтервалів чату та уникати введення буквальних послідовностей `\n`. Назви груп і мітки учасників, отримані з каналу, подаються як обмежені недовірені метадані, а не як вбудовані системні інструкції.

## Особливості iMessage

- Для маршрутизації або allowlist віддавайте перевагу `chat_id:<id>`.
- Перелік чатів: `imsg chats --limit 20`.
- Відповіді в групах завжди повертаються до того самого `chat_id`.

## Системні prompt для WhatsApp

Див. [WhatsApp](/uk/channels/whatsapp#system-prompts) для канонічних правил системних prompt WhatsApp, включно з визначенням prompt для груп і прямих чатів, поведінкою wildcard і семантикою перевизначення облікового запису.

## Особливості WhatsApp

Див. [Повідомлення в групах](/uk/channels/group-messages) щодо поведінки лише для WhatsApp (вставлення історії, деталі обробки згадок).

## Пов’язане

- [Повідомлення в групах](/uk/channels/group-messages)
- [Broadcast groups](/uk/channels/broadcast-groups)
- [Маршрутизація каналу](/uk/channels/channel-routing)
- [Сполучення](/uk/channels/pairing)
