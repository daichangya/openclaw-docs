---
read_when:
    - Зміна поведінки групового чату або керування згадуваннями
summary: Поведінка групового чату на різних поверхнях (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Групи
x-i18n:
    generated_at: "2026-04-20T18:29:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbcdebd340a2ebb5898fe1eaf52258f65ba434bcf3be010d81b0e74af728aad4
    source_path: channels/groups.md
    workflow: 15
---

# Групи

OpenClaw однаково обробляє групові чати на різних поверхнях: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Вступ для початківців (2 хвилини)

OpenClaw «живе» у ваших власних облікових записах месенджерів. Окремого користувача-бота WhatsApp немає.
Якщо **ви** перебуваєте в групі, OpenClaw може бачити цю групу й відповідати там.

Поведінка за замовчуванням:

- Групи обмежені (`groupPolicy: "allowlist"`).
- Для відповідей потрібне згадування, якщо ви явно не вимкнете керування згадуваннями.

Переклад: відправники з allowlist можуть активувати OpenClaw, згадавши його.

> Коротко
>
> - **Доступ до DM** контролюється через `*.allowFrom`.
> - **Доступ до груп** контролюється через `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
> - **Запуск відповіді** контролюється керуванням згадуваннями (`requireMention`, `/activation`).

Швидкий сценарій (що відбувається з повідомленням у групі):

```
groupPolicy? disabled -> відхилити
groupPolicy? allowlist -> групу дозволено? ні -> відхилити
requireMention? yes -> згадано? ні -> зберегти лише для контексту
інакше -> відповісти
```

## Видимість контексту та allowlist

У безпеці груп беруть участь два різні механізми керування:

- **Авторизація запуску**: хто може активувати агента (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist, специфічні для каналу).
- **Видимість контексту**: який додатковий контекст передається в модель (текст відповіді, цитати, історія гілки, метадані пересилання).

За замовчуванням OpenClaw надає пріоритет звичайній поведінці чату й здебільшого зберігає контекст у тому вигляді, у якому його отримано. Це означає, що allowlist переважно визначають, хто може запускати дії, а не є універсальною межею редагування для кожного процитованого або історичного фрагмента.

Поточна поведінка залежить від каналу:

- Деякі канали вже застосовують фільтрацію відправників для додаткового контексту в окремих шляхах (наприклад, ініціалізація гілок Slack, пошук відповідей/гілок у Matrix).
- Інші канали все ще передають контекст цитат/відповідей/пересилань у тому вигляді, у якому він отриманий.

Напрям посилення захисту (заплановано):

- `contextVisibility: "all"` (за замовчуванням) зберігає поточну поведінку «як отримано».
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників з allowlist.
- `contextVisibility: "allowlist_quote"` — це `allowlist` плюс один явний виняток для цитати/відповіді.

Поки цю модель посилення захисту не буде однаково реалізовано в усіх каналах, очікуйте відмінностей залежно від поверхні.

![Потік групових повідомлень](/images/groups-flow.svg)

Якщо ви хочете...

| Мета                                         | Що налаштувати                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Дозволити всі групи, але відповідати лише на @згадки | `groups: { "*": { requireMention: true } }`                |
| Вимкнути всі відповіді в групах              | `groupPolicy: "disabled"`                                  |
| Лише певні групи                             | `groups: { "<group-id>": { ... } }` (без ключа `"*"`)      |
| Лише ви можете запускати відповіді в групах  | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Ключі сесій

- Групові сесії використовують ключі сесій `agent:<agentId>:<channel>:group:<id>` (кімнати/канали використовують `agent:<agentId>:<channel>:channel:<id>`).
- Теми форуму Telegram додають `:topic:<threadId>` до ідентифікатора групи, тому кожна тема має власну сесію.
- Прямі чати використовують основну сесію (або окрему для кожного відправника, якщо це налаштовано).
- Heartbeat пропускаються для групових сесій.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Шаблон: особисті DM + публічні групи (один агент)

Так — це добре працює, якщо ваш «особистий» трафік — це **DM**, а «публічний» трафік — це **групи**.

Чому: у режимі одного агента DM зазвичай потрапляють до ключа **основної** сесії (`agent:main:main`), тоді як групи завжди використовують ключі **неосновних** сесій (`agent:main:<channel>:group:<id>`). Якщо ви ввімкнете ізоляцію через `mode: "non-main"`, ці групові сесії виконуватимуться у налаштованому бекенді sandbox, тоді як ваша основна DM-сесія залишиться на хості. Docker є бекендом за замовчуванням, якщо ви не виберете інший.

Це дає вам один «мозок» агента (спільний робочий простір + пам’ять), але дві різні моделі виконання:

- **DM**: повні інструменти (хост)
- **Групи**: sandbox + обмежені інструменти

> Якщо вам потрібні справді окремі робочі простори/персони («особисте» й «публічне» ніколи не мають змішуватися), використайте другого агента + bindings. Див. [Багатоагентна маршрутизація](/uk/concepts/multi-agent).

Приклад (DM на хості, групи в sandbox + лише інструменти для повідомлень):

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

- Ключі конфігурації та значення за замовчуванням: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- Налагодження причин блокування інструмента: [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)
- Докладніше про bind mounts: [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts)

## Мітки відображення

- Мітки в UI використовують `displayName`, коли він доступний, у форматі `<channel>:<token>`.
- `#room` зарезервовано для кімнат/каналів; групові чати використовують `g-<slug>` (нижній регістр, пробіли -> `-`, зберігати `#@+._-`).

## Політика груп

Керуйте тим, як обробляються повідомлення в групах/кімнатах для кожного каналу:

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

| Політика      | Поведінка                                                    |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Групи оминають allowlist; керування згадуваннями все ще діє. |
| `"disabled"`  | Повністю блокувати всі групові повідомлення.                 |
| `"allowlist"` | Дозволяти лише групи/кімнати, що відповідають налаштованому allowlist. |

Примітки:

- `groupPolicy` відокремлена від керування згадуваннями (яке вимагає @згадок).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: використовуйте `groupAllowFrom` (резервний варіант: явний `allowFrom`).
- Підтвердження прив’язки DM (записи сховища `*-allowFrom`) застосовуються лише до доступу в DM; авторизація відправників у групах залишається явно прив’язаною до group allowlist.
- Discord: allowlist використовує `channels.discord.guilds.<id>.channels`.
- Slack: allowlist використовує `channels.slack.channels`.
- Matrix: allowlist використовує `channels.matrix.groups`. Віддавайте перевагу ID кімнат або aliases; пошук назв приєднаних кімнат виконується за принципом best-effort, а нерозв’язані назви ігноруються під час виконання. Використовуйте `channels.matrix.groupAllowFrom`, щоб обмежити відправників; також підтримуються allowlist `users` для окремих кімнат.
- Групові DM керуються окремо (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram allowlist може відповідати ID користувачів (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) або іменам користувачів (`"@alice"` або `"alice"`); префікси нечутливі до регістру.
- За замовчуванням використовується `groupPolicy: "allowlist"`; якщо ваш group allowlist порожній, групові повідомлення блокуються.
- Безпека під час виконання: коли блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп переходить у fail-closed режим (зазвичай `allowlist`) замість успадкування `channels.defaults.groupPolicy`.

Швидка ментальна модель (порядок перевірки для групових повідомлень):

1. `groupPolicy` (open/disabled/allowlist)
2. group allowlist (`*.groups`, `*.groupAllowFrom`, allowlist, специфічний для каналу)
3. керування згадуваннями (`requireMention`, `/activation`)

## Керування згадуваннями (за замовчуванням)

Групові повідомлення вимагають згадування, якщо це не перевизначено для конкретної групи. Значення за замовчуванням зберігаються для кожної підсистеми в `*.groups."*"`.

Відповідь на повідомлення бота вважається неявним згадуванням, якщо канал
підтримує метадані відповіді. Цитування повідомлення бота також може вважатися неявним
згадуванням у каналах, які надають метадані цитати. Поточні вбудовані випадки включають
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

- `mentionPatterns` — це безпечні regex-патерни, нечутливі до регістру; недійсні патерни та небезпечні вкладені форми повторення ігноруються.
- Поверхні, які надають явні згадування, усе одно проходять; патерни є резервним варіантом.
- Перевизначення для агента: `agents.list[].groupChat.mentionPatterns` (корисно, коли кілька агентів використовують одну групу).
- Керування згадуваннями застосовується лише тоді, коли можливе виявлення згадування (вбудовані згадки або налаштовано `mentionPatterns`).
- Значення за замовчуванням для Discord зберігаються в `channels.discord.guilds."*"` (можна перевизначити для кожної guild/channel).
- Контекст історії групи однаково обгортається для всіх каналів і є **лише pending** (повідомлення, пропущені через керування згадуваннями); використовуйте `messages.groupChat.historyLimit` для глобального значення за замовчуванням і `channels.<channel>.historyLimit` (або `channels.<channel>.accounts.*.historyLimit`) для перевизначень. Встановіть `0`, щоб вимкнути.

## Обмеження інструментів для груп/каналів (необов’язково)

Деякі конфігурації каналів підтримують обмеження того, які інструменти доступні **всередині конкретної групи/кімнати/каналу**.

- `tools`: дозволити/заборонити інструменти для всієї групи.
- `toolsBySender`: перевизначення для окремих відправників у межах групи.
  Використовуйте явні префікси ключів:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` і wildcard `"*"`.
  Застарілі ключі без префікса все ще приймаються й зіставляються лише як `id:`.

Порядок розв’язання (найспецифічніший має пріоритет):

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

Коли налаштовано `channels.whatsapp.groups`, `channels.telegram.groups` або `channels.imessage.groups`, ключі діють як group allowlist. Використовуйте `"*"` , щоб дозволити всі групи, водночас задавши стандартну поведінку згадувань.

Поширена плутанина: підтвердження прив’язки DM — це не те саме, що авторизація групи.
Для каналів, які підтримують прив’язку DM, сховище прив’язок відкриває лише DM. Команди в групах однаково вимагають явної авторизації відправника групи через allowlist у конфігурації, як-от `groupAllowFrom`, або задокументований резервний варіант конфігурації для цього каналу.

Поширені наміри (копіюйте/вставляйте):

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

3. Дозволити всі групи, але вимагати згадування (явно)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Лише власник може запускати відповіді в групах (WhatsApp)

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

Власник визначається через `channels.whatsapp.allowFrom` (або через власний E.164 бота, якщо не задано). Надсилайте команду як окреме повідомлення. Інші поверхні наразі ігнорують `/activation`.

## Поля контексту

Вхідні payload для груп встановлюють:

- `ChatType=group`
- `GroupSubject` (якщо відомо)
- `GroupMembers` (якщо відомо)
- `WasMentioned` (результат керування згадуваннями)
- Теми форуму Telegram також містять `MessageThreadId` і `IsForum`.

Примітки для конкретних каналів:

- BlueBubbles може за бажанням збагачувати учасників без імен у групах macOS із локальної бази Contacts перед заповненням `GroupMembers`. Це вимкнено за замовчуванням і виконується лише після проходження звичайної перевірки групових обмежень.

Системний prompt агента містить вступ для групи на першому ході нової групової сесії. Він нагадує моделі відповідати як людині, уникати Markdown-таблиць, мінімізувати порожні рядки, дотримуватися звичайних інтервалів у чаті та не вводити буквально послідовності `\n`.

## Особливості iMessage

- Для маршрутизації або allowlist віддавайте перевагу `chat_id:<id>`.
- Список чатів: `imsg chats --limit 20`.
- Відповіді в групах завжди повертаються до того самого `chat_id`.

## Особливості WhatsApp

Див. [Групові повідомлення](/uk/channels/group-messages) щодо поведінки лише для WhatsApp (вставлення історії, деталі обробки згадувань).
