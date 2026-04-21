---
read_when:
    - Налаштування Slack або налагодження режиму сокета/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-04-21T08:24:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fe3c3c344e1c20c09b29773f4f68d2790751e76d8bbaa3c6157e3ff75978acf
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Статус: готовий до використання в production для особистих повідомлень і каналів через інтеграції застосунку Slack. Режим за замовчуванням — Socket Mode; URL-адреси HTTP-запитів також підтримуються.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Для Slack DMs за замовчуванням використовується режим сполучення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Власна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналом" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочу область для вашого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче та продовжте створення
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

        Резервний варіант через змінні середовища (лише для облікового запису за замовчуванням):

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

  <Tab title="URL-адреси HTTP-запитів">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочу область для вашого застосунку
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
        Використовуйте унікальні шляхи Webhook для багатьох HTTP-облікових записів

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

  <Tab title="URL-адреси HTTP-запитів">

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

Показують різні можливості, які розширюють наведені вище налаштування за замовчуванням.

<AccordionGroup>
  <Accordion title="Необов’язкові власні слеш-команди">

    Замість однієї налаштованої команди можна використовувати кілька [власних слеш-команд](#commands-and-slash-behavior) з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 слеш-команд.

    Замініть наявний розділ `features.slash_commands` на підмножину [доступних команд](/uk/tools/slash-commands#command-list):

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
        "description": "List providers or models for a provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
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
      <Tab title="URL-адреси HTTP-запитів">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Почати нову сесію",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Скинути поточну сесію",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Ущільнити контекст сесії",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Зупинити поточний запуск",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Керувати строком дії прив’язки до потоку",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Установити рівень мислення",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Перемкнути докладний вивід",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Показати або встановити швидкий режим",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Перемкнути видимість міркувань",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Перемкнути підвищений режим",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Показати або встановити типові параметри exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Показати або встановити модель",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Перелічити провайдерів або моделі для провайдера",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Показати короткий довідковий підсумок",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Показати згенерований каталог команд",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Показати, що поточний агент може використовувати зараз",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Показати статус виконання, зокрема використання/квоту провайдера, якщо доступно",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Перелічити активні/нещодавні фонові завдання для поточної сесії",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Пояснити, як формується контекст",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Показати вашу ідентичність відправника",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Запустити skill за назвою",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Поставити побічне запитання без зміни контексту сесії",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Керувати нижнім колонтитулом використання або показати підсумок вартості",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Необов’язкові scopes авторства (операції запису)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власні ім’я користувача та іконку) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте емодзі як іконку, Slack очікує синтаксис `:emoji_name:`.
  </Accordion>
  <Accordion title="Необов’язкові scopes токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scopes читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви залежите від читання через пошук Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- Для Socket Mode потрібні `botToken` + `appToken`.
- Для HTTP-режиму потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Токени в конфігурації мають пріоритет над резервним варіантом через env.
- Резервний варіант через змінні середовища `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) задається лише в конфігурації (без резервного варіанта через env) і за замовчуванням працює в режимі лише читання (`userTokenReadOnly: true`).

Поведінка знімка статусу:

- Інспекція облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше не-inline джерело секрету, але поточний шлях команди/виконання
  не зміг визначити фактичне значення.
- У HTTP-режимі додається `signingSecretStatus`; у Socket Mode
  потрібною парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання директорій за наявності налаштування можна надавати перевагу токену користувача. Для запису пріоритетним залишається токен бота; запис через токен користувача дозволено лише коли `userTokenReadOnly: false` і токен бота недоступний.
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

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM (застаріле: `channels.slack.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Pairing у DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів міститься в `channels.slack.channels` і має використовувати стабільні ідентифікатори каналів.

    Примітка про виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується резервне значення `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Визначення імені/ID:

    - записи allowlist каналів і записи allowlist DM визначаються під час запуску, якщо доступ токена це дозволяє
    - нерозпізнані записи з назвами каналів зберігаються як налаштовані, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів типово працюють за принципом ID-first; пряме зіставлення імені користувача/slug вимагає `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналу">
    Повідомлення в каналах типово обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в потоці бота (вимикається, коли `thread.requireExplicitMention` має значення `true`)

    Керування на рівні каналу (`channels.slack.channels.<id>`; імена лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса, як і раніше, зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Потоки, сесії та теги відповіді

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- За типового `session.dmScope=main` Slack DM згортаються в основну сесію агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в потоках можуть створювати суфікси сесій потоку (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` визначає, скільки наявних повідомлень потоку завантажується, коли запускається нова сесія потоку (типово `20`; установіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли має значення `true`, пригнічує неявні згадки в потоках, тому бот відповідає лише на явні згадки `@bot` усередині потоків, навіть якщо бот уже брав участь у потоці. Без цього відповіді в потоці, у якому брав участь бот, обходять обмеження `requireMention`.

Керування потоками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** потоки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все одно враховуються в режимі `"off"`. Відмінність відображає моделі потоків на платформах: у Slack потоки приховують повідомлення від каналу, тоді як у Telegram відповіді залишаються видимими в основному потоці чату.

## Реакції-підтвердження

`ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний варіант — емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше `"👀"`)

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою живого попереднього перегляду:

- `off`: вимкнути потокове передавання живого попереднього перегляду.
- `partial` (за замовчуванням): замінювати текст попереднього перегляду останнім частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст статусу прогресу під час генерації, а потім надсилати фінальний текст.

`channels.slack.streaming.nativeTransport` керує власним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (за замовчуванням: `true`).

- Для власного потокового передавання тексту та відображення статусу потоку помічника Slack має бути доступний потік відповіді. Вибір потоку, як і раніше, визначається `replyToMode`.
- Кореневі повідомлення в каналах і групових чатах усе ще можуть використовувати звичайний чернетковий попередній перегляд, якщо власне потокове передавання недоступне.
- DM верхнього рівня в Slack за замовчуванням залишаються поза потоками, тому вони не показують попередній перегляд у стилі потоку; використовуйте відповіді в потоках або `typingReaction`, якщо хочете бачити там прогрес.
- Медіа та нетекстові корисні навантаження використовують звичайну доставку як резервний варіант.
- Якщо потокове передавання зривається посеред відповіді, OpenClaw використовує звичайну доставку для решти корисних навантажень.

Використовуйте чернетковий попередній перегляд замість власного потокового передавання тексту Slack:

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
- булеве значення `channels.slack.streaming` автоматично мігрує до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застаріле `channels.slack.nativeStreaming` автоматично мігрує до `channels.slack.streaming.nativeTransport`.

## Резервний варіант з реакцією набору

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її, коли виконання завершується. Це найбільш корисно поза відповідями в потоках, де використовується типовий індикатор статусу «is typing...».

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично намагається виконатися після завершення відповіді або сценарію помилки.

## Медіа, розбиття на фрагменти та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо завантаження успішне та дозволяють обмеження розміру.

    Типове обмеження розміру вхідних даних під час виконання — `20MB`, якщо не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (за замовчуванням 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття спочатку за абзацами
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в потоках (`thread_ts`)
    - обмеження вихідних медіа визначається `channels.slack.mediaMaxMb`, якщо налаштовано; інакше надсилання через канал використовує типові значення MIME-kind із медіапайплайна
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    DM у Slack відкриваються через API розмов Slack під час надсилання до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка слеш-команд

Слеш-команди відображаються в Slack або як одна налаштована команда, або як кілька власних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типову поведінку команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Власні команди потребують [додаткових налаштувань маніфесту](#additional-manifest-settings) у вашому застосунку Slack і вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим власних команд **вимкнено** для Slack, тому `commands.native: "auto"` не вмикає власні команди Slack.

```txt
/help
```

Власні меню аргументів використовують адаптивну стратегію відтворення, яка показує модальне вікно підтвердження перед передаванням значення вибраного параметра:

- до 5 варіантів: блоки кнопок
- 6-100 варіантів: статичне меню вибору
- понад 100 варіантів: зовнішній вибір з асинхронною фільтрацією варіантів, коли доступні обробники параметрів інтерактивності
- у разі перевищення лімітів Slack: закодовані значення варіантів повертаються до кнопок

```txt
/think
```

Сесії слеш-команд використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і, як і раніше, маршрутизують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відтворювати інтерактивні елементи відповіді, створені агентом, але ця можливість за замовчуванням вимкнена.

Увімкніть її глобально:

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

Або увімкніть лише для одного облікового запису Slack:

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

Коли цю можливість увімкнено, агенти можуть надсилати директиви відповіді лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і спрямовують натискання або вибір назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивного зворотного виклику — це непрозорі токени, згенеровані OpenClaw, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищать обмеження Slack Block Kit, OpenClaw повернеться до початкової текстової відповіді замість надсилання недійсного корисного навантаження blocks.

## Погодження exec у Slack

Slack може працювати як власний клієнт погодження з інтерактивними кнопками та взаємодіями замість повернення до Web UI або термінала.

- Погодження exec використовують `channels.slack.execApprovals.*` для власної маршрутизації DM/каналів.
- Погодження Plugin також можуть визначатися через ту саму поверхню власних кнопок Slack, коли запит уже надходить у Slack і тип ідентифікатора погодження — `plugin:`.
- Авторизація того, хто погоджує, як і раніше, примусово застосовується: лише користувачі, визначені як ті, хто погоджує, можуть дозволяти або відхиляти запити через Slack.

Для цього використовується та сама спільна поверхня кнопок погодження, що й в інших каналах. Коли у налаштуваннях вашого застосунку Slack увімкнено `interactivity`, запити на погодження відтворюються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що погодження в чаті недоступні або ручне погодження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовується резервне значення з `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає власні погодження exec, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один
користувач, який погоджує. Установіть `enabled: false`, щоб явно вимкнути Slack як власний клієнт погодження.
Установіть `enabled: true`, щоб примусово ввімкнути власні погодження, коли визначаються користувачі, які погоджують.

Типова поведінка без явної конфігурації погодження exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна власна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити користувачів, які погоджують, додати фільтри або
увімкнути доставку до чату походження:

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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на погодження exec також мають
спрямовуватися до інших чатів або явних цілей поза основним потоком. Спільне переспрямування `approvals.plugin` також є
окремим; власні кнопки Slack все одно можуть визначати погодження plugin, коли ці запити вже надходять
у Slack.

Команда `/approve` у тому самому чаті також працює в каналах і DM Slack, які вже підтримують команди. Див. [Погодження exec](/uk/tools/exec-approvals), щоб ознайомитися з повною моделлю переспрямування погоджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень і трансляції потоку відображаються в системні події.
- Події додавання/видалення реакцій відображаються в системні події.
- Події входу/виходу учасників, створення/перейменування каналу та додавання/видалення закріплень відображаються в системні події.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути впроваджені в контекст маршрутизації.
- Ініціатор потоку та початкове заповнення контексту історією потоку фільтруються відповідно до налаштованих allowlist відправників, коли це застосовно.
- Дії блоків і модальні взаємодії створюють структуровані системні події `Slack interaction: ...` з розширеними полями корисного навантаження:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події модальних вікон `view_submission` і `view_closed` з маршрутними метаданими каналу та введенням форми

## Вказівники на довідник конфігурації

Основне посилання:

- [Довідник конфігурації - Slack](/uk/gateway/configuration-reference#slack)

  Високосигнальні поля Slack:
  - режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; не вмикайте без потреби)
  - доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - потоки/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`
  - операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Усунення проблем

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте в такому порядку:

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
    - погодження pairing / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте bot token + app token і те, що Socket Mode увімкнено в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    яке підтримується SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - URL-адреси запитів Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікового запису, HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, який підтримується SecretRef.

  </Accordion>

  <Accordion title="Власні/slash-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим власних команд (`channels.slack.commands.native: true`) з відповідними слеш-командами, зареєстрованими у Slack
    - або режим однієї слеш-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Усунення проблем](/uk/channels/troubleshooting)
- [Конфігурація](/uk/gateway/configuration)
- [Слеш-команди](/uk/tools/slash-commands)
