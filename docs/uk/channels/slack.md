---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-04-22T17:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1609ab5570daac455005cb00cee578c8954e05b25c25bf5759ae032d2a12c2c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Статус: готовий до продакшну для приватних повідомлень і каналів через інтеграції застосунку Slack. Типовий режим — Socket Mode; URL-адреси HTTP-запитів також підтримуються.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Для приватних повідомлень у Slack типово використовується режим сполучення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Вбудована поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (типово)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для вашого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче й продовжуйте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - встановіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)
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

        Резервний варіант через змінні середовища (лише для типового облікового запису):

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

        - виберіть **from a manifest** і виберіть робочий простір для вашого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - встановіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

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
        Використовуйте унікальні шляхи Webhook для багатьох облікових записів HTTP

        Надайте кожному обліковому запису окремий `webhookPath` (типово `/slack/events`), щоб реєстрації не конфліктували.
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
  <Tab title="Socket Mode (типово)">

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

### Додаткові параметри маніфесту

Відображають різні можливості, що розширюють наведені вище типові налаштування.

<AccordionGroup>
  <Accordion title="Необов’язкові вбудовані слеш-команди">

    Кілька [вбудованих слеш-команд](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 слеш-команд.

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (типово)">

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
        "description": "Керувати строком дії прив’язки до треду",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Встановити рівень мислення",
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
        "description": "Перемкнути розширений режим",
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
        "description": "Показати короткий підсумок довідки",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Показати згенерований каталог команд",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Показати, що поточний агент може використовувати прямо зараз",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Показати статус під час виконання, зокрема використання/квоту провайдера, якщо доступно",
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
        "description": "Керувати нижнім колонтитулом використання або показати зведення витрат",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Необов’язкові scope авторства (операції запису)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача та значок) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте значок emoji, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові scope user-token (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope читання є:

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
- Для режиму HTTP потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають звичайні
  рядки або об’єкти SecretRef.
- Токени в конфігурації мають пріоритет над резервним варіантом через env.
- Резервний варіант через env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до типового облікового запису.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного варіанту через env) і типово працює в режимі лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус має значення `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неinline-джерело секретів, але поточний шлях команди/виконання
  не зміг визначити фактичне значення.
- У режимі HTTP додається `signingSecretStatus`; у Socket Mode
  обов’язкова пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу перевага може надаватися user token, якщо його налаштовано. Для запису пріоритет зберігається за bot token; запис через user token дозволений лише коли `userTokenReadOnly: false` і bot token недоступний.
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

    - `pairing` (типово)
    - `allowlist`
    - `open` (потрібно, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (для групових DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо в них не задано власне `allowFrom`.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Pairing у DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розташований у `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується резервне значення `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Визначення імен/ID:

    - записи allowlist каналів і DM allowlist визначаються під час запуску, якщо доступ до токена це дозволяє
    - нерозпізнані записи назв каналів зберігаються як налаштовані, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням орієнтовані на ID; пряме зіставлення імені користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналу">
    Повідомлення в каналах типово обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді боту (вимикається, коли `thread.requireExplicitMention` має значення `true`)

    Керування для кожного каналу (`channels.slack.channels.<id>`; назви лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

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

## Треди, сесії та теги відповіді

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- Із типовим `session.dmScope=main` DM у Slack згортаються до головної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в тредах можуть створювати суфікси сесій тредів (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` визначає, скільки наявних повідомлень треду завантажується під час запуску нової сесії треду (типово `20`; встановіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли має значення `true`, пригнічує неявні згадки в треді, тож бот відповідає лише на явні згадки `@bot` усередині тредів, навіть якщо бот уже брав участь у треді. Без цього відповіді в треді, у якому брав участь бот, оминають обмеження `requireMention`.

Керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все одно враховуються в режимі `"off"`. Різниця відображає моделі тредів на платформах: у Slack треди приховують повідомлення з каналу, тоді як у Telegram відповіді залишаються видимими в основному потоці чату.

## Реакції підтвердження

`ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше `"👀"`)

Примітки:

- Slack очікує shortcode (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокова передача тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду в реальному часі:

- `off`: вимкнути потокову трансляцію попереднього перегляду.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст стану поступу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли активний чернетковий попередній перегляд, спрямовувати оновлення інструментів/поступу в те саме відредаговане повідомлення попереднього перегляду (типово: `true`). Установіть `false`, щоб зберегти окремі повідомлення інструментів/поступу.

`channels.slack.streaming.nativeTransport` керує нативною потоковою передачею тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (типово: `true`).

- Для нативної потокової передачі тексту та відображення статусу треду Slack assistant має бути доступний тред відповіді. Вибір треду, як і раніше, визначається `replyToMode`.
- Корені каналів і групових чатів усе ще можуть використовувати звичайний чернетковий попередній перегляд, коли нативна потокова передача недоступна.
- Верхньорівневі DM у Slack типово залишаються поза тредами, тому не показують попередній перегляд у стилі треду; використовуйте відповіді в тредах або `typingReaction`, якщо хочете бачити поступ там.
- Для медіа та нетекстових payload використовується звичайна доставка.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду без скидання тимчасової чернетки; придатні фінальні текстові/block payload скидаються лише тоді, коли можуть відредагувати попередній перегляд на місці.
- Якщо потокова передача зривається посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload.

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

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично мігрується до `channels.slack.streaming.mode`.
- булеве `channels.slack.streaming` автоматично мігрується до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застаріле `channels.slack.nativeStreaming` автоматично мігрується до `channels.slack.streaming.nativeTransport`.

## Резервна реакція друку

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в тредах, де використовується типовий індикатор стану «друкує...».

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcode (наприклад, `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично намагається виконатися після відповіді або завершення шляху помилки.

## Медіа, фрагментація та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладення файлів Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо отримання успішне й дозволяють обмеження розміру.

    Типове обмеження розміру вхідних даних під час виконання — `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття з пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в треді (`thread_ts`)
    - обмеження вихідних медіа підпорядковується `channels.slack.mediaMaxMb`, якщо його налаштовано; інакше надсилання через канал використовують типові значення MIME-kind з медіапайплайна
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    DM у Slack відкриваються через API розмов Slack під час надсилання до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка слеш-команд

Слеш-команди відображаються в Slack або як одна налаштована команда, або як кілька вбудованих команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команди:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Вбудовані команди потребують [додаткових параметрів маніфесту](#additional-manifest-settings) у вашому застосунку Slack і вмикаються через `channels.slack.commands.native: true` або натомість через `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим вбудованих команд **вимкнений** для Slack, тому `commands.native: "auto"` не вмикає вбудовані команди Slack.

```txt
/help
```

Меню аргументів вбудованих команд використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед надсиланням вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній вибір з асинхронною фільтрацією опцій, якщо доступні обробники параметрів interactivity
- у разі перевищення лімітів Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Сесії слеш-команд використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно маршрутизують виконання команд до цільової сесії розмови через `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати інтерактивні елементи відповіді, створені агентом, але ця можливість типово вимкнена.

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

Або увімкніть її лише для одного облікового запису Slack:

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

Коли її ввімкнено, агенти можуть виводити директиви відповіді лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і повертають кліки або вибори через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перетворюють директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це непрозорі токени, згенеровані OpenClaw, а не сирі значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищують обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного payload blocks.

## Погодження exec у Slack

Slack може діяти як нативний клієнт погодження з інтерактивними кнопками та взаємодіями замість повернення до Web UI або термінала.

- Для нативної маршрутизації в DM/каналах погодження exec використовують `channels.slack.execApprovals.*`.
- Погодження Plugin також можуть визначатися через ту саму нативну поверхню кнопок Slack, коли запит уже потрапляє в Slack, а тип id погодження — `plugin:`.
- Авторизація того, хто погоджує, як і раніше, примусово перевіряється: лише користувачі, визначені як ті, хто погоджує, можуть підтверджувати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок погодження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на погодження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що погодження в чаті недоступні або ручне погодження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовується резервний варіант `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні погодження exec, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один користувач, що погоджує.
Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт погодження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні погодження, коли визначено користувачів, що погоджують.

Типова поведінка без явної конфігурації погодження exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити користувачів, що погоджують, додати фільтри або
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
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
є окремим; нативні кнопки Slack усе ще можуть визначати погодження Plugin, коли ці запити вже потрапляють
до Slack.

Така сама команда `/approve` у тому самому чаті також працює в каналах і DM Slack, які вже підтримують команди. Див. [Погодження exec](/uk/tools/exec-approvals) для повної моделі переспрямування погоджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень і розсилки тредів зіставляються із системними подіями.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події приєднання/виходу учасників, створення/перейменування каналу та додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути впроваджені в контекст маршрутизації.
- Автор треду та початкове заповнення контексту історії треду фільтруються за налаштованими allowlist відправників, якщо це застосовно.
- Дії блоків і взаємодії з модальними вікнами створюють структуровані системні події `Slack interaction: ...` з насиченими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події модальних вікон `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеннями форми

## Вказівники на довідник конфігурації

Основний довідник:

- [Configuration reference - Slack](/uk/gateway/configuration-reference#slack)

  Високосигнальні поля Slack:
  - режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - доступ DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застарілі: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; тримайте вимкненим, якщо не потрібен)
  - доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте в такому порядку:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` для кожного каналу

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
    - підтвердження pairing / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Режим Socket не підключається">
    Перевірте bot token + app token і ввімкнення Socket Mode в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    яке підтримується SecretRef.

  </Accordion>

  <Accordion title="Режим HTTP не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - URL-адреси Slack Request URL (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного облікового запису HTTP

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікового запису, обліковий запис HTTP налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, яке підтримується SecretRef.

  </Accordion>

  <Accordion title="Вбудовані/slash-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим вбудованих команд (`channels.slack.commands.native: true`) з відповідними слеш-командами, зареєстрованими в Slack
    - або режим однієї слеш-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Усунення несправностей](/uk/channels/troubleshooting)
- [Конфігурація](/uk/gateway/configuration)
- [Слеш-команди](/uk/tools/slash-commands)
