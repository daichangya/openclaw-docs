---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Маршрутизація кількох агентів: ізольовані агенти, облікові записи каналів і bindings'
title: Маршрутизація кількох агентів
x-i18n:
    generated_at: "2026-04-05T18:02:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# Маршрутизація кількох агентів

Мета: кілька _ізольованих_ агентів (окремий workspace + `agentDir` + sessions), а також кілька облікових записів каналів (наприклад, два WhatsApp) в одному запущеному Gateway. Вхідні повідомлення маршрутизуються до агента через bindings.

## Що таке "один агент"?

**Агент** — це повністю ізольований інтелект зі своїми власними:

- **Workspace** (файли, AGENTS.md/SOUL.md/USER.md, локальні нотатки, правила персони).
- **Каталогом стану** (`agentDir`) для профілів автентифікації, реєстру моделей і конфігурації для конкретного агента.
- **Сховищем сесій** (історія чатів + стан маршрутизації) у `~/.openclaw/agents/<agentId>/sessions`.

Профілі автентифікації є **окремими для кожного агента**. Кожен агент читає зі свого власного:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` і тут є безпечнішим шляхом для міжсесійного згадування: він повертає
обмежений, очищений вигляд, а не дамп сирого transcript. Згадування асистента прибирає
теги thinking, каркас `<relevant-memories>`, XML-payload викликів інструментів у звичайному тексті
(включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів),
понижений каркас викликів інструментів, витоки ASCII/full-width токенів керування моделлю
та некоректний MiniMax XML викликів інструментів до редагування/обрізання.

Облікові дані основного агента **не** надаються спільно автоматично. Ніколи не використовуйте повторно `agentDir`
між агентами (це спричиняє конфлікти auth/session). Якщо ви хочете спільно використовувати облікові дані,
скопіюйте `auth-profiles.json` до `agentDir` іншого агента.

Skills завантажуються з workspace кожного агента, а також зі спільних кореневих каталогів, таких як
`~/.openclaw/skills`, а потім фільтруються за ефективним allowlist skills агента, якщо він налаштований.
Використовуйте `agents.defaults.skills` для спільної базової конфігурації та
`agents.list[].skills` для заміни для конкретного агента. Див.
[Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills) і
[Skills: agent skill allowlists](/tools/skills#agent-skill-allowlists).

Gateway може розміщувати **одного агента** (типово) або **багатьох агентів** паралельно.

**Примітка щодо workspace:** workspace кожного агента є **типовим cwd**, а не жорсткою
пісочницею. Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть
досягати інших місць хоста, якщо не ввімкнено sandboxing. Див.
[Sandboxing](/gateway/sandboxing).

## Шляхи (швидка схема)

- Config: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог стану: `~/.openclaw` (або `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (або `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (або `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### Режим одного агента (типовий)

Якщо нічого не налаштовувати, OpenClaw запускає одного агента:

- `agentId` типово дорівнює **`main`**.
- Sessions мають ключі у форматі `agent:main:<mainKey>`.
- Workspace типово `~/.openclaw/workspace` (або `~/.openclaw/workspace-<profile>`, коли задано `OPENCLAW_PROFILE`).
- State типово `~/.openclaw/agents/main/agent`.

## Помічник агента

Використовуйте майстер агентів, щоб додати нового ізольованого агента:

```bash
openclaw agents add work
```

Потім додайте `bindings` (або дозвольте майстру зробити це), щоб маршрутизувати вхідні повідомлення.

Перевірка:

```bash
openclaw agents list --bindings
```

## Швидкий старт

<Steps>
  <Step title="Створіть workspace для кожного агента">

Використайте майстер або створіть workspaces вручну:

```bash
openclaw agents add coding
openclaw agents add social
```

Кожен агент отримує власний workspace з `SOUL.md`, `AGENTS.md` і необов’язковим `USER.md`, а також окремі `agentDir` і сховище sessions у `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Створіть облікові записи каналів">

Створіть по одному обліковому запису на агента у ваших бажаних каналах:

- Discord: по одному боту на агента, увімкніть Message Content Intent, скопіюйте кожен токен.
- Telegram: по одному боту на агента через BotFather, скопіюйте кожен токен.
- WhatsApp: прив’яжіть кожен номер телефону до окремого облікового запису.

```bash
openclaw channels login --channel whatsapp --account work
```

Див. посібники каналів: [Discord](/channels/discord), [Telegram](/channels/telegram), [WhatsApp](/channels/whatsapp).

  </Step>

  <Step title="Додайте агентів, облікові записи та bindings">

Додайте агентів у `agents.list`, облікові записи каналів у `channels.<channel>.accounts`, а потім з’єднайте їх через `bindings` (приклади нижче).

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

За наявності **кількох агентів** кожен `agentId` стає **повністю ізольованою персоною**:

- **Різні phone numbers/accounts** (через `accountId` для кожного каналу).
- **Різні особистості** (через файли workspace для конкретного агента, такі як `AGENTS.md` і `SOUL.md`).
- **Окремі auth + sessions** (без перетину, якщо це явно не ввімкнено).

Це дозволяє **кільком людям** ділити один сервер Gateway, зберігаючи ізольованими їхні AI-«мозки» та дані.

## Пошук у пам’яті QMD між агентами

Якщо один агент має шукати в session transcripts QMD іншого агента, додайте
додаткові collections у `agents.list[].memorySearch.qmd.extraCollections`.
Використовуйте `agents.defaults.memorySearch.qmd.extraCollections` лише тоді, коли кожен агент
має успадковувати однакові спільні collections transcript.

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
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
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

Шлях до додаткової collection може бути спільним для кількох агентів, але назва collection
залишається явною, коли шлях лежить поза workspace агента. Шляхи всередині
workspace залишаються прив’язаними до агента, щоб кожен агент мав власний набір пошуку transcript.

## Один номер WhatsApp, кілька людей (поділ DM)

Ви можете маршрутизувати **різні DM WhatsApp** до різних агентів, залишаючись в межах **одного облікового запису WhatsApp**. Зіставлення виконується за E.164 відправника (наприклад, `+15551234567`) через `peer.kind: "direct"`. Відповіді все одно надходитимуть з того самого номера WhatsApp (без sender identity для кожного агента).

Важлива деталь: прямі чати зводяться до **основного ключа сесії** агента, тому для справжньої ізоляції потрібен **один агент на людину**.

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

- Контроль доступу до DM є **глобальним для кожного облікового запису WhatsApp** (pairing/allowlist), а не для кожного агента.
- Для спільних груп прив’яжіть групу до одного агента або використайте [Broadcast groups](/channels/broadcast-groups).

## Правила маршрутизації (як повідомлення вибирають агента)

Bindings є **детермінованими**, і **найбільш специфічний збіг має пріоритет**:

1. збіг `peer` (точний id DM/group/channel)
2. збіг `parentPeer` (успадкування thread)
3. `guildId + roles` (маршрутизація ролей Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. збіг `accountId` для каналу
7. збіг на рівні каналу (`accountId: "*"`)
8. резервний перехід до типового агента (`agents.list[].default`, інакше перший елемент списку, типово: `main`)

Якщо в межах одного рівня збігаються кілька bindings, виграє перший за порядком у config.
Якщо binding задає кілька полів збігу (наприклад, `peer` + `guildId`), усі вказані поля є обов’язковими (семантика `AND`).

Важлива деталь щодо області дії облікового запису:

- Binding без `accountId` збігається лише з типовим обліковим записом.
- Використовуйте `accountId: "*"` для резервного правила на рівні каналу для всіх облікових записів.
- Якщо пізніше ви додасте такий самий binding для того самого агента з явним id облікового запису, OpenClaw оновить наявний binding лише для каналу до області дії облікового запису замість дублювання.

## Кілька облікових записів / phone numbers

Канали, що підтримують **кілька облікових записів** (наприклад, WhatsApp), використовують `accountId` для позначення
кожного входу. Кожен `accountId` може маршрутизуватися до іншого агента, тож один сервер може обслуговувати
кілька phone numbers без змішування sessions.

Якщо вам потрібен типовий обліковий запис для всього каналу, коли `accountId` не вказано, задайте
`channels.<channel>.defaultAccount` (необов’язково). Якщо його не задано, OpenClaw резервно використовує
`default`, якщо він існує, інакше перший налаштований id облікового запису (у відсортованому порядку).

Типові канали, що підтримують цей шаблон:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Поняття

- `agentId`: один «мозок» (workspace, auth для конкретного агента, сховище sessions для конкретного агента).
- `accountId`: один екземпляр облікового запису каналу (наприклад, обліковий запис WhatsApp `"personal"` проти `"biz"`).
- `binding`: маршрутизує вхідні повідомлення до `agentId` за `(channel, accountId, peer)` і за потреби guild/team ids.
- Прямі чати зводяться до `agent:<agentId>:<mainKey>` (основний ключ конкретного агента; `session.mainKey`).

## Приклади платформ

### Discord-боти для кожного агента

Кожен обліковий запис бота Discord зіставляється з унікальним `accountId`. Прив’яжіть кожен обліковий запис до агента та зберігайте allowlists окремо для кожного бота.

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
- Токени зберігаються в `channels.discord.accounts.<id>.token` (типовий обліковий запис може використовувати `DISCORD_BOT_TOKEN`).

### Telegram-боти для кожного агента

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
- Токени зберігаються в `channels.telegram.accounts.<id>.botToken` (типовий обліковий запис може використовувати `TELEGRAM_BOT_TOKEN`).

### Номери WhatsApp для кожного агента

Прив’яжіть кожен обліковий запис перед запуском gateway:

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

  // Deterministic routing: first match wins (most-specific first).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Optional per-peer override (example: send a specific group to work agent).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
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

- Якщо для каналу у вас є кілька облікових записів, додайте `accountId` до binding (наприклад, `{ channel: "whatsapp", accountId: "personal" }`).
- Щоб маршрутизувати один DM/group до Opus, залишивши решту на chat, додайте binding `match.peer` для цього peer; збіги peer завжди мають пріоритет над правилами для всього каналу.

## Приклад: той самий канал, один peer до Opus

Залиште WhatsApp на швидкому агенті, але один DM маршрутизуйте до Opus:

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

Bindings peer завжди мають пріоритет, тому розміщуйте їх вище правила для всього каналу.

## Сімейний агент, прив’язаний до групи WhatsApp

Прив’яжіть окремого сімейного агента до однієї групи WhatsApp, з активацією за згадкою
та суворішою політикою інструментів:

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

- Allow/deny lists для інструментів — це саме **tools**, а не skills. Якщо skill має запускати
  бінарний файл, переконайтеся, що `exec` дозволено й бінарний файл існує в sandbox.
- Для суворішого контролю задайте `agents.list[].groupChat.mentionPatterns` і залишайте
  allowlists груп увімкненими для каналу.

## Sandbox і конфігурація інструментів для кожного агента

Кожен агент може мати власні обмеження sandbox і tools:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

Примітка: `setupCommand` розташовано в `sandbox.docker` і він виконується один раз під час створення контейнера.
Перевизначення `sandbox.docker.*` для конкретного агента ігноруються, коли ефективна область дії дорівнює `"shared"`.

**Переваги:**

- **Ізоляція безпеки**: обмежуйте інструменти для недовірених агентів
- **Контроль ресурсів**: ізолюйте в sandbox конкретних агентів, залишаючи інших на хості
- **Гнучкі політики**: різні дозволи для різних агентів

Примітка: `tools.elevated` є **глобальним** і залежить від відправника; його не можна налаштовувати для кожного агента.
Якщо вам потрібні межі для кожного агента, використовуйте `agents.list[].tools`, щоб заборонити `exec`.
Для націлення на групи використовуйте `agents.list[].groupChat.mentionPatterns`, щоб @mentions чітко зіставлялися з потрібним агентом.

Див. [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools), щоб ознайомитися з докладними прикладами.

## Пов’язане

- [Channel Routing](/channels/channel-routing) — як повідомлення маршрутизуються до агентів
- [Sub-Agents](/tools/subagents) — запуск фонових виконань агентів
- [ACP Agents](/tools/acp-agents) — запуск зовнішніх середовищ для кодування
- [Presence](/concepts/presence) — присутність і доступність агента
- [Session](/concepts/session) — ізоляція та маршрутизація сесій
