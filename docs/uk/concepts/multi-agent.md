---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Маршрутизація мультиагентності: ізольовані агенти, облікові записи каналів і прив’язки'
title: маршрутизація мультиагентності
x-i18n:
    generated_at: "2026-04-23T22:58:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

Запускайте кілька _ізольованих_ агентів — кожен із власним робочим простором, каталогом стану (`agentDir`) та історією сесій — а також кілька облікових записів каналів (наприклад, два WhatsApp) в одному запущеному Gateway. Вхідні повідомлення маршрутизуються до правильного агента через прив’язки.

**Агент** тут — це повна область для окремої персони: файли робочого простору, профілі автентифікації, реєстр моделей і сховище сесій. `agentDir` — це каталог стану на диску, який містить цю конфігурацію для окремого агента за шляхом `~/.openclaw/agents/<agentId>/`. **Прив’язка** зіставляє обліковий запис каналу (наприклад, робочий простір Slack або номер WhatsApp) з одним із таких агентів.

## Що таке «один агент»?

**Агент** — це повністю ізольований інтелект із власними:

- **Робочим простором** (файли, AGENTS.md/SOUL.md/USER.md, локальні нотатки, правила персони).
- **Каталогом стану** (`agentDir`) для профілів автентифікації, реєстру моделей і конфігурації окремого агента.
- **Сховищем сесій** (історія чатів + стан маршрутизації) у `~/.openclaw/agents/<agentId>/sessions`.

Профілі автентифікації є **окремими для кожного агента**. Кожен агент читає зі свого:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` тут теж є безпечнішим шляхом для відновлення між сесіями: він повертає обмежене, очищене подання, а не сирий дамп транскрипту. Відновлення для помічника прибирає thinking-теги, шаблон `<relevant-memories>`, XML-пейлоади викликів інструментів у відкритому тексті (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів), понижений шаблон викликів інструментів, витеклі ASCII/повноширинні керівні токени моделі та некоректний XML викликів інструментів MiniMax перед редагуванням/обрізанням.

Облікові дані основного агента **не** спільні автоматично. Ніколи не використовуйте `agentDir` повторно для кількох агентів (це спричиняє конфлікти автентифікації/сесій). Якщо ви хочете поділитися обліковими даними, скопіюйте `auth-profiles.json` до `agentDir` іншого агента.

Skills завантажуються з робочого простору кожного агента, а також зі спільних коренів, таких як `~/.openclaw/skills`, а потім фільтруються за ефективним allowlist Skills агента, якщо його налаштовано. Використовуйте `agents.defaults.skills` для спільної базової конфігурації та `agents.list[].skills` для заміни на рівні агента. Див. [Skills: per-agent vs shared](/uk/tools/skills#per-agent-vs-shared-skills) і [Skills: agent skill allowlists](/uk/tools/skills#agent-skill-allowlists).

Gateway може розміщувати **одного агента** (за замовчуванням) або **багатьох агентів** паралельно.

**Примітка щодо робочого простору:** робочий простір кожного агента є **cwd за замовчуванням**, а не жорсткою пісочницею. Відносні шляхи розв’язуються в межах робочого простору, але абсолютні шляхи можуть досягати інших розташувань на хості, якщо пісочницю не ввімкнено. Див. [Sandboxing](/uk/gateway/sandboxing).

## Шляхи (швидка схема)

- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог стану: `~/.openclaw` (або `OPENCLAW_STATE_DIR`)
- Робочий простір: `~/.openclaw/workspace` (або `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (або `agents.list[].agentDir`)
- Сесії: `~/.openclaw/agents/<agentId>/sessions`

### Режим одного агента (за замовчуванням)

Якщо ви нічого не робите, OpenClaw запускає одного агента:

- `agentId` за замовчуванням має значення **`main`**.
- Сесії мають ключі у форматі `agent:main:<mainKey>`.
- Робочий простір за замовчуванням — `~/.openclaw/workspace` (або `~/.openclaw/workspace-<profile>`, якщо встановлено `OPENCLAW_PROFILE`).
- Стан за замовчуванням — `~/.openclaw/agents/main/agent`.

## Помічник агента

Скористайтеся майстром агентів, щоб додати нового ізольованого агента:

```bash
openclaw agents add work
```

Потім додайте `bindings` (або дозвольте майстру зробити це), щоб маршрутизувати вхідні повідомлення.

Перевірте за допомогою:

```bash
openclaw agents list --bindings
```

## Швидкий старт

<Steps>
  <Step title="Створіть робочий простір для кожного агента">

Скористайтеся майстром або створіть робочі простори вручну:

```bash
openclaw agents add coding
openclaw agents add social
```

Кожен агент отримує власний робочий простір із `SOUL.md`, `AGENTS.md` і необов’язковим `USER.md`, а також окремий `agentDir` і сховище сесій у `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Створіть облікові записи каналів">

Створіть по одному обліковому запису на агента в бажаних каналах:

- Discord: по одному боту на агента, увімкніть Message Content Intent, скопіюйте кожен токен.
- Telegram: по одному боту на агента через BotFather, скопіюйте кожен токен.
- WhatsApp: прив’яжіть кожен номер телефону до окремого облікового запису.

```bash
openclaw channels login --channel whatsapp --account work
```

Див. посібники з каналів: [Discord](/uk/channels/discord), [Telegram](/uk/channels/telegram), [WhatsApp](/uk/channels/whatsapp).

  </Step>

  <Step title="Додайте агентів, облікові записи та прив’язки">

Додайте агентів до `agents.list`, облікові записи каналів до `channels.<channel>.accounts` і з’єднайте їх через `bindings` (приклади нижче).

  </Step>

  <Step title="Перезапустіть і перевірте">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Кілька агентів = кілька людей, кілька особистостей

У разі **кількох агентів** кожен `agentId` стає **повністю ізольованою персоною**:

- **Різні номери телефонів/облікові записи** (для кожного каналу `accountId`).
- **Різні особистості** (через файли робочого простору окремого агента, такі як `AGENTS.md` і `SOUL.md`).
- **Окремі автентифікація й сесії** (без перетину, якщо це не ввімкнено явно).

Це дозволяє **кільком людям** спільно використовувати один сервер Gateway, зберігаючи ізоляцію їхніх AI-«мозків» і даних.

## Пошук у пам’яті QMD між агентами

Якщо один агент має виконувати пошук у транскриптах сесій QMD іншого агента, додайте додаткові колекції в `agents.list[].memorySearch.qmd.extraCollections`. Використовуйте `agents.defaults.memorySearch.qmd.extraCollections` лише тоді, коли всі агенти мають успадковувати однакові спільні колекції транскриптів.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // розв’язується в межах робочого простору -> колекція з назвою "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Шлях до додаткової колекції може бути спільним для агентів, але назва колекції залишається явною, якщо шлях лежить поза робочим простором агента. Шляхи в межах робочого простору залишаються прив’язаними до агента, тож кожен агент зберігає власний набір пошуку за транскриптами.

## Один номер WhatsApp, кілька людей (розподіл DM)

Ви можете маршрутизувати **різні WhatsApp DM** до різних агентів, залишаючись в межах **одного облікового запису WhatsApp**. Відповідність виконується за E.164 відправника (наприклад, `+15551234567`) із `peer.kind: "direct"`. Відповіді все одно надходитимуть з того самого номера WhatsApp (без окремої ідентичності відправника для агента).

Важлива деталь: прямі чати згортаються до **основного ключа сесії** агента, тому справжня ізоляція вимагає **одного агента на людину**.

Приклад:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Примітки:

- Керування доступом до DM є **глобальним для кожного облікового запису WhatsApp** (pairing/allowlist), а не окремим для кожного агента.
- Для спільних груп прив’яжіть групу до одного агента або використовуйте [Broadcast groups](/uk/channels/broadcast-groups).

## Правила маршрутизації (як повідомлення вибирають агента)

Прив’язки є **детермінованими**, і **найбільш специфічна має пріоритет**:

1. відповідність `peer` (точний id DM/групи/каналу)
2. відповідність `parentPeer` (успадкування треду)
3. `guildId + roles` (маршрутизація за ролями Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. відповідність `accountId` для каналу
7. відповідність на рівні каналу (`accountId: "*"`)
8. повернення до агента за замовчуванням (`agents.list[].default`, інакше перший запис у списку, за замовчуванням: `main`)

Якщо кілька прив’язок збігаються в межах одного рівня, перемагає перша за порядком у конфігурації.
Якщо прив’язка задає кілька полів відповідності (наприклад, `peer` + `guildId`), усі вказані поля є обов’язковими (семантика `AND`).

Важлива деталь щодо області облікового запису:

- Прив’язка без `accountId` відповідає лише обліковому запису за замовчуванням.
- Використовуйте `accountId: "*"` для резервного варіанта на рівні каналу для всіх облікових записів.
- Якщо ви пізніше додасте таку саму прив’язку для того самого агента з явним id облікового запису, OpenClaw оновить наявну прив’язку лише на рівні каналу до області облікового запису замість створення дубліката.

## Кілька облікових записів / номерів телефонів

Канали, які підтримують **кілька облікових записів** (наприклад, WhatsApp), використовують `accountId` для ідентифікації кожного входу. Кожен `accountId` можна маршрутизувати до іншого агента, тому один сервер може розміщувати кілька номерів телефонів без змішування сесій.

Якщо вам потрібен обліковий запис каналу за замовчуванням, коли `accountId` не вказано, установіть `channels.<channel>.defaultAccount` (необов’язково). Якщо його не задано, OpenClaw використовує `default`, якщо він є, інакше — перший налаштований id облікового запису (у відсортованому порядку).

Поширені канали, які підтримують цей шаблон:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Поняття

- `agentId`: один «мозок» (робочий простір, окрема автентифікація агента, окреме сховище сесій агента).
- `accountId`: один екземпляр облікового запису каналу (наприклад, обліковий запис WhatsApp `"personal"` проти `"biz"`).
- `binding`: маршрутизує вхідні повідомлення до `agentId` за `(channel, accountId, peer)` і, за потреби, за id guild/team.
- Прямі чати згортаються до `agent:<agentId>:<mainKey>` (основний ключ на агента; `session.mainKey`).

## Приклади для платформ

### Боти Discord для кожного агента

Кожен обліковий запис бота Discord зіставляється з унікальним `accountId`. Прив’яжіть кожен обліковий запис до агента та зберігайте allowlist окремо для кожного бота.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Примітки:

- Запросіть кожного бота до guild і ввімкніть Message Content Intent.
- Токени зберігаються в `channels.discord.accounts.<id>.token` (обліковий запис за замовчуванням може використовувати `DISCORD_BOT_TOKEN`).

### Боти Telegram для кожного агента

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Примітки:

- Створіть по одному боту на агента через BotFather і скопіюйте кожен токен.
- Токени зберігаються в `channels.telegram.accounts.<id>.botToken` (обліковий запис за замовчуванням може використовувати `TELEGRAM_BOT_TOKEN`).

### Номери WhatsApp для кожного агента

Прив’яжіть кожен обліковий запис перед запуском Gateway:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Детермінована маршрутизація: перший збіг перемагає (спочатку найспецифічніші).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Необов’язкове перевизначення для конкретного peer (приклад: надсилати певну групу агенту work).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Вимкнено за замовчуванням: обмін повідомленнями між агентами має бути явно ввімкнений + доданий до allowlist.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Необов’язкове перевизначення. За замовчуванням: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Необов’язкове перевизначення. За замовчуванням: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Приклад: щоденний чат у WhatsApp + глибока робота в Telegram

Розділення за каналом: маршрутизуйте WhatsApp до швидкого повсякденного агента, а Telegram — до агента Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Примітки:

- Якщо у вас є кілька облікових записів для каналу, додайте `accountId` до прив’язки (наприклад, `{ channel: "whatsapp", accountId: "personal" }`).
- Щоб маршрутизувати один DM/групу до Opus, залишивши решту на chat, додайте прив’язку `match.peer` для цього peer; відповідності peer завжди мають пріоритет над правилами для всього каналу.

## Приклад: той самий канал, один peer до Opus

Залиште WhatsApp на швидкому агенті, але маршрутизуйте один DM до Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Прив’язки peer завжди мають пріоритет, тому розміщуйте їх вище за правило для всього каналу.

## Сімейний агент, прив’язаний до групи WhatsApp

Прив’яжіть окремого сімейного агента до однієї групи WhatsApp із gating за згадками та суворішою політикою інструментів:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Примітки:

- Списки allow/deny інструментів — це **інструменти**, а не Skills. Якщо Skill має запускати бінарний файл, переконайтеся, що `exec` дозволено і що бінарний файл існує в пісочниці.
- Для суворішого gating задайте `agents.list[].groupChat.mentionPatterns` і залиште allowlist груп увімкненими для каналу.

## Налаштування пісочниці та інструментів для кожного агента

Кожен агент може мати власну пісочницю та обмеження інструментів:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Без пісочниці для особистого агента
        },
        // Без обмежень інструментів — доступні всі інструменти
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Завжди в пісочниці
          scope: "agent",  // Один контейнер на агента
          docker: {
            // Необов’язкове одноразове налаштування після створення контейнера
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Лише інструмент read
          deny: ["exec", "write", "edit", "apply_patch"],    // Заборонити інші
        },
      },
    ],
  },
}
```

Примітка: `setupCommand` розміщується в `sandbox.docker` і виконується один раз під час створення контейнера.
Перевизначення `sandbox.docker.*` для окремого агента ігноруються, коли визначена область має значення `"shared"`.

**Переваги:**

- **Ізоляція безпеки**: обмежуйте інструменти для недовірених агентів
- **Керування ресурсами**: ізолюйте в пісочниці окремих агентів, залишаючи інших на хості
- **Гнучкі політики**: різні дозволи для різних агентів

Примітка: `tools.elevated` є **глобальним** і базується на відправнику; його не можна налаштовувати окремо для кожного агента.
Якщо вам потрібні межі на рівні агента, використовуйте `agents.list[].tools`, щоб заборонити `exec`.
Для націлювання на групи використовуйте `agents.list[].groupChat.mentionPatterns`, щоб @згадки чітко зіставлялися з потрібним агентом.

Див. [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools) для докладних прикладів.

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — як повідомлення маршрутизуються до агентів
- [Субагенти](/uk/tools/subagents) — запуск фонових агентських процесів
- [ACP Agents](/uk/tools/acp-agents) — запуск зовнішніх harness для програмування
- [Присутність](/uk/concepts/presence) — присутність і доступність агентів
- [Сесія](/uk/concepts/session) — ізоляція та маршрутизація сесій
