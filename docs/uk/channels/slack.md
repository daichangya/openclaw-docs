---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-23T06:42:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3daf52cd28998bf7d692190468b9d8330f1867f56e49fc69666e7e107d4ba47c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Статус: готовий до продакшену для DM + каналів через інтеграції застосунку Slack. Режим за замовчуванням — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Для Slack DM за замовчуванням використовується режим підключення.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Вбудована поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для вашого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче й продовжуйте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Налаштуйте OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Резервний варіант через env (лише для облікового запису за замовчуванням):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для вашого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Налаштуйте OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Використовуйте унікальні webhook-шляхи для багатьох облікових записів у HTTP

        Призначте кожному обліковому запису окремий `webhookPath` (типово `/slack/events`), щоб реєстрації не конфліктували.
        </Note>

      </Step>

      <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Контрольний список маніфесту та scope

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Tab>

  <Tab title="HTTP Request URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Додаткові налаштування маніфесту

Покажіть різні можливості, які розширюють наведені вище значення за замовчуванням.

<AccordionGroup>
  <Accordion title="Необов’язкові вбудовані slash-команди">

    Можна використовувати кілька [вбудованих slash-команд](#commands-and-slash-behavior) замість однієї налаштованої команди, з деякими нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 slash-команд.

    Замініть ваш наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (за замовчуванням)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Reset the current session",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Stop the current run",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "List providers or models for a provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Необов’язкові scope для авторства (операції запису)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (власне ім’я користувача та іконку) замість стандартної ідентичності застосунку Slack.

    Якщо ви використовуєте емодзі-іконку, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові scope user token (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope для читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви покладаєтеся на читання через пошук Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- Для Socket Mode потрібні `botToken` + `appToken`.
- Для режиму HTTP потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Токени в конфігурації мають пріоритет над резервним варіантом через env.
- Резервний варіант через env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного варіанта через env) і за замовчуванням працює лише для читання (`userTokenReadOnly: true`).

Поведінка знімка статусу:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше невбудоване джерело секретів, але поточний шлях команди/виконання
  не зміг отримати фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  потрібна пара `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу за наявності налаштування може надаватися перевага user token. Для запису перевага зберігається за bot token; запис через user token дозволений лише коли `userTokenReadOnly: false`, а bot token недоступний.
</Tip>

## Дії та обмеження

Дії Slack керуються через `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Поточні дії з повідомленнями Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM (застаріле: `channels.slack.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `channels.slack.allowFrom` включав `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (для групових DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для багатьох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Підключення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів зберігається в `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується резервне значення `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Визначення імен/ID:

    - записи allowlist каналів і записи allowlist DM визначаються під час запуску, якщо доступ токена це дозволяє
    - нерозпізнані записи імен каналів зберігаються як налаштовано, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням орієнтовані на ID; пряме зіставлення з іменем користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналів">
    Повідомлення в каналах за замовчуванням обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді на бота (вимикається, коли `thread.requireExplicitMention` дорівнює `true`)

    Керування на рівні каналу (`channels.slack.channels.<id>`; імена — лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключів `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса, як і раніше, зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Треди, сесії та теги відповіді

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- Із типовим `session.dmScope=main` Slack DM згортаються до основної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в тредах можуть створювати суфікси сесій тредів (`:thread:<threadTs>`) там, де це застосовно.
- Значення за замовчуванням для `channels.slack.thread.historyScope` — `thread`; для `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень треду отримується під час запуску нової сесії треду (типово `20`; установіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): якщо `true`, пригнічує неявні згадки в треді, тому бот відповідає лише на явні згадки `@bot` усередині тредів, навіть якщо бот уже брав участь у треді. Без цього відповіді в треді за участю бота обходять обмеження `requireMention`.

Керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все одно враховуються в режимі `"off"`. Різниця відображає моделі тредів платформ: у Slack треди приховують повідомлення від каналу, тоді як у Telegram відповіді залишаються видимими в основному потоці чату.

Сфокусовані відповіді в тредах Slack маршрутизуються через прив’язану до них сесію ACP, якщо така існує, замість підготовки відповіді через типову оболонку агента. Це зберігає прив’язки `/focus` і `/acp spawn ... --bind here` для подальших повідомлень у треді.

## Реакції підтвердження

`ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcode-и (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокова передача тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду в реальному часі:

- `off`: вимкнути потоковий попередній перегляд.
- `partial` (за замовчуванням): замінювати текст попереднього перегляду останнім частковим виводом.
- `block`: додавати оновлення попереднього перегляду частинами.
- `progress`: показувати текст статусу прогресу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли активний чернетковий попередній перегляд, спрямовувати оновлення інструментів/прогресу в те саме відредаговане повідомлення попереднього перегляду (за замовчуванням: `true`). Установіть `false`, щоб зберегти окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативною потоковою передачею тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (за замовчуванням: `true`).

- Для нативної потокової передачі тексту та появи статусу треду асистента Slack має бути доступний тред відповіді. Вибір треду, як і раніше, підпорядковується `replyToMode`.
- Кореневі повідомлення в каналах і групових чатах все одно можуть використовувати звичайний чернетковий попередній перегляд, коли нативна потокова передача недоступна.
- Верхньорівневі DM у Slack за замовчуванням лишаються поза тредами, тому не показують попередній перегляд у стилі треду; використовуйте відповіді в треді або `typingReaction`, якщо хочете бачити прогрес там.
- Медіа та нетекстові payload-и повертаються до звичайної доставки.
- Фінальні медіа/помилкові повідомлення скасовують відкладені редагування попереднього перегляду без скидання тимчасової чернетки; фінальні текстові/block-повідомлення, що підпадають під умови, скидаються лише тоді, коли можуть відредагувати попередній перегляд на місці.
- Якщо потокова передача зламається посеред відповіді, OpenClaw повернеться до звичайної доставки для решти payload-ів.
- Канали Slack Connect, які відхиляють потік до того, як SDK скине свій локальний буфер, повертаються до звичайних відповідей Slack, тож короткі відповіді не губляться безшумно і не позначаються як доставлені до того, як Slack їх підтвердить.

Використовуйте чернетковий попередній перегляд замість нативної потокової передачі тексту Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Застарілі ключі:

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично мігрує до `channels.slack.streaming.mode`.
- логічне значення `channels.slack.streaming` автоматично мігрує до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застарілий `channels.slack.nativeStreaming` автоматично мігрує до `channels.slack.streaming.nativeTransport`.

## Резервний варіант із реакцією набору

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її, коли виконання завершується. Це найкорисніше поза відповідями в треді, які використовують типовий індикатор статусу "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcode-и (наприклад, `"hourglass_flowing_sand"`).
- Реакція додається за принципом best-effort, а очищення автоматично намагається виконатися після завершення відповіді або сценарію помилки.

## Медіа, поділ на частини та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються в сховище медіа, якщо отримання успішне та дозволяють обмеження розміру.

    Обмеження на розмір вхідних даних під час виконання за замовчуванням становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові частини використовують `channels.slack.textChunkLimit` (за замовчуванням 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ спочатку за абзацами
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в треді (`thread_ts`)
    - обмеження на вихідні медіа підпорядковується `channels.slack.mediaMaxMb`, якщо його налаштовано; інакше надсилання в канал використовує типові значення MIME-kind з конвеєра медіа
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    Slack DM відкриваються через API розмов Slack під час надсилання до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash-команд

Slash-команди з’являються в Slack або як одна налаштована команда, або як кілька вбудованих команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові значення команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Вбудовані команди потребують [додаткових налаштувань маніфесту](#additional-manifest-settings) у вашому застосунку Slack і вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим вбудованих команд **вимкнений** для Slack, тому `commands.native: "auto"` не вмикає вбудовані команди Slack.

```txt
/help
```

Вбудовані меню аргументів використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед відправленням вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній вибір з асинхронною фільтрацією опцій, коли доступні обробники опцій інтерактивності
- у разі перевищення лімітів Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Сесії slash-команд використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно маршрутизують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати інтерактивні елементи відповіді, створені агентом, але ця можливість за замовчуванням вимкнена.

Увімкнути глобально:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Або увімкнути лише для одного облікового запису Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Коли функцію увімкнено, агенти можуть надсилати директиви відповіді лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і спрямовують кліки або вибір назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це специфічний для Slack UI. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback-ів — це непрозорі токени, згенеровані OpenClaw, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищуватимуть обмеження Slack Block Kit, OpenClaw повернеться до вихідної текстової відповіді замість надсилання невалідного payload-а blocks.

## Підтвердження exec у Slack

Slack може виступати як нативний клієнт підтвердження з інтерактивними кнопками та взаємодіями, замість повернення до Web UI або термінала.

- Підтвердження exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналів.
- Підтвердження plugin також можуть визначатися через ту саму нативну поверхню кнопок Slack, коли запит уже потрапляє в Slack, а тип id підтвердження — `plugin:`.
- Авторизація затверджувача, як і раніше, застосовується: лише користувачі, ідентифіковані як затверджувачі, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок підтвердження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на підтвердження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
повинен включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що
підтвердження в чаті недоступні або ручне підтвердження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один
затверджувач. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт підтвердження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні підтвердження, коли затверджувачі визначаються.

Типова поведінка без явної конфігурації підтвердження exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити затверджувачів, додати фільтри або
увімкнути доставку в чат-джерело:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Спільне пересилання `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на підтвердження exec також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне пересилання `approvals.plugin` також
є окремим; нативні кнопки Slack все одно можуть обробляти підтвердження plugin, коли ці запити вже потрапляють
у Slack.

`/approve` у тому самому чаті також працює в каналах і DM Slack, які вже підтримують команди. Див. [Підтвердження exec](/uk/tools/exec-approvals) для повної моделі пересилання підтверджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень і трансляції тредів зіставляються із системними подіями.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події входу/виходу учасника, створення/перейменування каналу та додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані topic/purpose каналу розглядаються як ненадійний контекст і можуть бути вставлені в контекст маршрутизації.
- Ініціатор треду та початкове наповнення контексту історії треду фільтруються за налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і взаємодії модальних вікон створюють структуровані системні події `Slack interaction: ...` з насиченими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker та метадані `workflow_*`
  - події модальних вікон `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеними даними форми

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - Slack](/uk/gateway/configuration-reference#slack)

  Важливі поля Slack:
  - режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; тримайте вимкненим, якщо він не потрібен)
  - доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Усунення проблем

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по порядку:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` для конкретного каналу

    Корисні команди:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Повідомлення DM ігноруються">
    Перевірте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - підтвердження підключення / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Режим Socket не підключається">
    Перевірте bot token + app token і ввімкнення Socket Mode в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, це означає, що обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    яке зберігається через SecretRef.

  </Accordion>

  <Accordion title="Режим HTTP не отримує події">
    Перевірте:

    - signing secret
    - webhook path
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікових записів, це означає, що HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, що зберігається через SecretRef.

    Зареєстровані webhook-и Request URL диспетчеризуються через той самий спільний реєстр обробників, що використовується для налаштування моніторингу Slack, тому події Slack у режимі HTTP продовжують маршрутизуватися через зареєстрований шлях замість 404 після успішної реєстрації маршруту.

  </Accordion>

  <Accordion title="Завантаження файлів із користувацькими bot token">
    Допоміжна функція `downloadFile` визначає свій bot token із конфігурації середовища виконання, коли викликач передає `cfg` без явного `token` або попередньо зібраного клієнта, зберігаючи завантаження файлів лише з cfg поза шляхом середовища виконання дій.
  </Accordion>

  <Accordion title="Вбудовані/slash-команди не спрацьовують">
    Перевірте, чи ви мали на увазі:

    - режим вбудованих команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Підключення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Усунення проблем](/uk/channels/troubleshooting)
- [Конфігурація](/uk/gateway/configuration)
- [Slash-команди](/uk/tools/slash-commands)
