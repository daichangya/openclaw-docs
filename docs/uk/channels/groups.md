---
read_when:
    - Зміна поведінки групового чату або керування згадуваннями
sidebarTitle: Groups
summary: Поведінка групового чату на різних поверхнях (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Групи
x-i18n:
    generated_at: "2026-04-26T07:47:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw однаково обробляє групові чати на різних поверхнях: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Вступ для початківців (2 хвилини)

OpenClaw "живе" у ваших власних облікових записах месенджерів. Окремого користувача-бота WhatsApp немає. Якщо **ви** є в групі, OpenClaw може бачити цю групу та відповідати там.

Поведінка за замовчуванням:

- Групи обмежені (`groupPolicy: "allowlist"`).
- Відповіді потребують згадки, якщо ви явно не вимкнете керування згадуваннями.

Простими словами: відправники з allowlist можуть активувати OpenClaw, згадавши його.

<Note>
**Коротко**

- **Доступ до DM** контролюється через `*.allowFrom`.
- **Доступ до груп** контролюється через `*.groupPolicy` + allowlist-и (`*.groups`, `*.groupAllowFrom`).
- **Запуск відповіді** контролюється керуванням згадуваннями (`requireMention`, `/activation`).
  </Note>

Швидка схема (що відбувається з повідомленням у групі):

```
groupPolicy? disabled -> відхилити
groupPolicy? allowlist -> група дозволена? ні -> відхилити
requireMention? yes -> згадано? ні -> зберегти лише для контексту
інакше -> відповісти
```

## Видимість контексту та allowlist-и

У безпеці груп беруть участь два різні механізми:

- **Авторизація запуску**: хто може активувати агента (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist-и для конкретного каналу).
- **Видимість контексту**: який додатковий контекст передається в модель (текст відповіді, цитати, історія треду, метадані пересилання).

За замовчуванням OpenClaw надає пріоритет звичайній поведінці чату та здебільшого зберігає контекст таким, як його отримано. Це означає, що allowlist-и переважно визначають, хто може запускати дії, а не є універсальною межею редагування для кожного процитованого чи історичного фрагмента.

<AccordionGroup>
  <Accordion title="Поточна поведінка залежить від каналу">
    - Деякі канали вже застосовують фільтрацію за відправником для додаткового контексту в окремих шляхах (наприклад, ініціалізація тредів у Slack, пошук відповідей/тредів у Matrix).
    - Інші канали все ще передають контекст цитати/відповіді/пересилання таким, як його отримано.
  </Accordion>
  <Accordion title="Напрям посилення захисту (заплановано)">
    - `contextVisibility: "all"` (типово) зберігає поточну поведінку «як отримано».
    - `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників з allowlist.
    - `contextVisibility: "allowlist_quote"` — це `allowlist` плюс один явний виняток для цитати/відповіді.

    Поки ця модель посилення захисту не буде послідовно впроваджена в усіх каналах, очікуйте відмінностей залежно від поверхні.

  </Accordion>
</AccordionGroup>

![Схема повідомлення в групі](/images/groups-flow.svg)

Якщо ви хочете...

| Ціль                                         | Що налаштувати                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Дозволити всі групи, але відповідати лише на @згадки | `groups: { "*": { requireMention: true } }`                |
| Вимкнути всі відповіді в групах              | `groupPolicy: "disabled"`                                  |
| Лише конкретні групи                         | `groups: { "<group-id>": { ... } }` (без ключа `"*"`)      |
| Лише ви можете активувати в групах           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Ключі сесій

- Групові сесії використовують ключі сесій `agent:<agentId>:<channel>:group:<id>` (кімнати/канали використовують `agent:<agentId>:<channel>:channel:<id>`).
- Теми форумів Telegram додають `:topic:<threadId>` до ідентифікатора групи, тому кожна тема має власну сесію.
- Прямі чати використовують основну сесію (або окрему для кожного відправника, якщо це налаштовано).
- Heartbeat пропускаються для групових сесій.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Шаблон: особисті DM + публічні групи (один агент)

Так — це добре працює, якщо ваш "особистий" трафік — це **DM**, а ваш "публічний" трафік — це **групи**.

Чому: у режимі одного агента DM зазвичай потрапляють до **основного** ключа сесії (`agent:main:main`), тоді як групи завжди використовують **неосновні** ключі сесій (`agent:main:<channel>:group:<id>`). Якщо ви ввімкнете ізоляцію з `mode: "non-main"`, ці групові сесії працюватимуть у налаштованому sandbox backend, а ваша основна DM-сесія залишиться на хості. Docker є типовим backend, якщо ви не виберете інший.

Це дає вам один "розум" агента (спільний робочий простір + пам’ять), але дві моделі виконання:

- **DM**: повні інструменти (хост)
- **Групи**: sandbox + обмежені інструменти

<Note>
Якщо вам потрібні справді окремі робочі простори/персони ("особисте" і "публічне" ніколи не повинні змішуватися), використовуйте другого агента + bindings. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM на хості, групи в sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // групи/канали є неосновними -> у sandbox
            scope: "session", // найсильніша ізоляція (один контейнер на групу/канал)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Якщо allow не порожній, усе інше блокується (deny усе одно має пріоритет).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Групи бачать лише папку з allowlist">
    Хочете "групи можуть бачити лише папку X" замість "немає доступу до хоста"? Залиште `workspaceAccess: "none"` і змонтуйте в sandbox лише шляхи з allowlist:

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

  </Tab>
</Tabs>

Пов’язане:

- Ключі конфігурації та значення за замовчуванням: [Конфігурація Gateway](/uk/gateway/config-agents#agentsdefaultssandbox)
- Налагодження, чому інструмент заблоковано: [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)
- Подробиці bind mount: [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts)

## Мітки відображення

- Мітки в UI використовують `displayName`, якщо він доступний, у форматі `<channel>:<token>`.
- `#room` зарезервовано для кімнат/каналів; групові чати використовують `g-<slug>` (нижній регістр, пробіли -> `-`, зберігати `#@+._-`).

## Політика груп

Керує тим, як обробляються повідомлення груп/кімнат для кожного каналу:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // числовий Telegram user id (майстер може визначити @username)
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
| `"open"`      | Групи обходять allowlist-и; керування згадуваннями все одно застосовується. |
| `"disabled"`  | Повністю блокувати всі групові повідомлення.                 |
| `"allowlist"` | Дозволяти лише групи/кімнати, що збігаються з налаштованим allowlist. |

<AccordionGroup>
  <Accordion title="Примітки для окремих каналів">
    - `groupPolicy` відокремлено від керування згадуваннями (яке вимагає @згадок).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: використовуйте `groupAllowFrom` (резервний варіант: явний `allowFrom`).
    - Підтвердження прив’язки DM (записи сховища `*-allowFrom`) застосовуються лише до доступу в DM; авторизація відправника в групі лишається явно прив’язаною до групових allowlist-ів.
    - Discord: allowlist використовує `channels.discord.guilds.<id>.channels`.
    - Slack: allowlist використовує `channels.slack.channels`.
    - Matrix: allowlist використовує `channels.matrix.groups`. Надавайте перевагу ідентифікаторам кімнат або псевдонімам; пошук назв приєднаних кімнат виконується в режимі best-effort, а нерозв’язані назви ігноруються під час виконання. Використовуйте `channels.matrix.groupAllowFrom`, щоб обмежити відправників; також підтримуються allowlist-и `users` для окремих кімнат.
    - Group DM контролюються окремо (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram allowlist може збігатися з ID користувачів (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) або іменами користувачів (`"@alice"` або `"alice"`); префікси нечутливі до регістру.
    - За замовчуванням використовується `groupPolicy: "allowlist"`; якщо ваш груповий allowlist порожній, групові повідомлення блокуються.
    - Безпека під час виконання: коли блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп переходить у fail-closed режим (зазвичай `allowlist`) замість успадкування `channels.defaults.groupPolicy`.
  </Accordion>
</AccordionGroup>

Швидка ментальна модель (порядок перевірки для групових повідомлень):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Групові allowlist-и">
    Групові allowlist-и (`*.groups`, `*.groupAllowFrom`, allowlist для конкретного каналу).
  </Step>
  <Step title="Керування згадуваннями">
    Керування згадуваннями (`requireMention`, `/activation`).
  </Step>
</Steps>

## Керування згадуваннями (типово)

Групові повідомлення вимагають згадки, якщо це не перевизначено для конкретної групи. Значення за замовчуванням зберігаються для кожної підсистеми в `*.groups."*"`.

Відповідь на повідомлення бота вважається неявною згадкою, якщо канал підтримує метадані відповіді. Цитування повідомлення бота також може вважатися неявною згадкою на каналах, які надають метадані цитати. Поточні вбудовані випадки включають Telegram, WhatsApp, Slack, Discord, Microsoft Teams і ZaloUser.

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

<AccordionGroup>
  <Accordion title="Примітки щодо керування згадуваннями">
    - `mentionPatterns` — це безпечні regex-шаблони, нечутливі до регістру; недійсні шаблони та небезпечні форми з вкладеним повторенням ігноруються.
    - Поверхні, які надають явні згадки, усе одно проходять; шаблони є резервним варіантом.
    - Перевизначення для окремого агента: `agents.list[].groupChat.mentionPatterns` (корисно, коли кілька агентів спільно використовують групу).
    - Керування згадуваннями застосовується лише тоді, коли виявлення згадок можливе (вбудовані згадки або налаштовано `mentionPatterns`).
    - Групи, де дозволені тихі відповіді, трактують чисто порожні або лише з міркуваннями відповіді моделі як тихі, еквівалентні `NO_REPLY`. Прямі чати все ще трактують порожні відповіді як невдалий хід агента.
    - Значення за замовчуванням для Discord зберігаються в `channels.discord.guilds."*"` (можна перевизначити для окремого сервера/каналу).
    - Контекст історії групи уніфіковано загортається між каналами і є **лише для pending** (повідомлення, пропущені через керування згадуваннями); використовуйте `messages.groupChat.historyLimit` для глобального значення за замовчуванням і `channels.<channel>.historyLimit` (або `channels.<channel>.accounts.*.historyLimit`) для перевизначень. Установіть `0`, щоб вимкнути.
  </Accordion>
</AccordionGroup>

## Обмеження інструментів для груп/каналів (необов’язково)

Деякі конфігурації каналів підтримують обмеження того, які інструменти доступні **всередині конкретної групи/кімнати/каналу**.

- `tools`: дозволити/заборонити інструменти для всієї групи.
- `toolsBySender`: перевизначення для окремих відправників у межах групи. Використовуйте явні префікси ключів: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` і шаблон `"*"`. Старі ключі без префікса все ще підтримуються та зіставляються лише як `id:`.

Порядок визначення (перемагає найспецифічніший):

<Steps>
  <Step title="Інструменти групи toolsBySender">
    Збіг `toolsBySender` для групи/каналу.
  </Step>
  <Step title="Інструменти групи">
    `tools` для групи/каналу.
  </Step>
  <Step title="Типові toolsBySender">
    Збіг типового (`"*"` ) `toolsBySender`.
  </Step>
  <Step title="Типові інструменти">
    Типові (`"*"` ) `tools`.
  </Step>
</Steps>

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

<Note>
Обмеження інструментів для груп/каналів застосовуються додатково до глобальної/агентної політики інструментів (deny усе одно має пріоритет). Деякі канали використовують іншу вкладеність для кімнат/каналів (наприклад, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Групові allowlist-и

Коли налаштовано `channels.whatsapp.groups`, `channels.telegram.groups` або `channels.imessage.groups`, ключі працюють як груповий allowlist. Використовуйте `"*"` , щоб дозволити всі групи, водночас задавши типову поведінку для згадок.

<Warning>
Поширена плутанина: підтвердження прив’язки DM — це не те саме, що авторизація групи. Для каналів, які підтримують прив’язку DM, сховище прив’язок відкриває лише DM. Групові команди все одно потребують явної авторизації відправника групи з конфігураційних allowlist-ів, таких як `groupAllowFrom`, або документованого резервного варіанту конфігурації для цього каналу.
</Warning>

Поширені сценарії (копіюйте/вставляйте):

<Tabs>
  <Tab title="Вимкнути всі відповіді в групах">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Дозволити лише конкретні групи (WhatsApp)">
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
  </Tab>
  <Tab title="Дозволити всі групи, але вимагати згадку">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Запуск лише власником (WhatsApp)">
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
  </Tab>
</Tabs>

## Activation (лише власник)

Власники груп можуть перемикати активацію для окремої групи:

- `/activation mention`
- `/activation always`

Власник визначається через `channels.whatsapp.allowFrom` (або власний E.164 бота, якщо не задано). Надсилайте команду як окреме повідомлення. Інші поверхні наразі ігнорують `/activation`.

## Поля контексту

Вхідні payload-и групи встановлюють:

- `ChatType=group`
- `GroupSubject` (якщо відомо)
- `GroupMembers` (якщо відомо)
- `WasMentioned` (результат керування згадуваннями)
- Теми форумів Telegram також включають `MessageThreadId` і `IsForum`.

Примітки для окремих каналів:

- BlueBubbles може за бажанням збагачувати учасників без імен у групах macOS з локальної бази даних Contacts перед заповненням `GroupMembers`. Це вимкнено за замовчуванням і запускається лише після того, як звичайні перевірки груп пройдено.

Системний prompt агента включає вступ для групи на першому ході нової групової сесії. Він нагадує моделі відповідати як людині, уникати Markdown-таблиць, мінімізувати порожні рядки, дотримуватися звичайних інтервалів у чаті та уникати введення буквальних послідовностей `\n`. Назви груп і мітки учасників, отримані з каналу, відображаються як fenced ненадійні метадані, а не як вбудовані системні інструкції.

## Особливості iMessage

- Для маршрутизації або allowlist надавайте перевагу `chat_id:<id>`.
- Список чатів: `imsg chats --limit 20`.
- Відповіді в групі завжди повертаються до того самого `chat_id`.

## Системні prompt-и WhatsApp

Див. [WhatsApp](/uk/channels/whatsapp#system-prompts) для канонічних правил системних prompt-ів WhatsApp, зокрема розв’язання prompt-ів для груп і приватних чатів, поведінки шаблонів і семантики перевизначення облікового запису.

## Особливості WhatsApp

Див. [Групові повідомлення](/uk/channels/group-messages) для поведінки лише WhatsApp (впровадження історії, деталі обробки згадок).

## Пов’язане

- [Broadcast-групи](/uk/channels/broadcast-groups)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Групові повідомлення](/uk/channels/group-messages)
- [Прив’язка](/uk/channels/pairing)
