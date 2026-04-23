---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-04-23T19:23:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 530514e9da8ff611eada0bbdd6d274c2c21c5d14cac55346641389fec065c0b4
    source_path: channels/slack.md
    workflow: 15
---

Готово до продакшну для особистих повідомлень і каналів через інтеграції застосунку Slack. Типовий режим — Socket Mode; URL-адреси HTTP-запитів також підтримуються.

<CardGroup cols={3}>
  <Card title="Прив’язка" icon="link" href="/uk/channels/pairing">
    Для особистих повідомлень Slack типовим є режим прив’язки.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Вбудована поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (типово)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для вашого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче й продовжте створення
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

        Резервне значення через env (лише для облікового запису за замовчуванням):

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
        Використовуйте унікальні webhook-шляхи для багатьох HTTP-облікових записів

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

Базовий маніфест застосунку Slack однаковий для Socket Mode і URL-адрес HTTP-запитів. Відрізняється лише блок `settings` (і `url` слеш-команди).

Базовий маніфест (типовий Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
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

Для **режиму URL-адрес HTTP-запитів** замініть `settings` на HTTP-варіант і додайте `url` до кожної слеш-команди. Потрібна публічна URL-адреса:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
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

### Додаткові налаштування маніфесту

Відображайте різні можливості, які розширюють наведені вище типові налаштування.

<AccordionGroup>
  <Accordion title="Необов’язкові вбудовані слеш-команди">

    Замість однієї налаштованої команди можна використовувати кілька [вбудованих слеш-команд](#commands-and-slash-behavior) з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно не можна зробити доступними більше ніж 25 слеш-команд.

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
        Використовуйте той самий список `slash_commands`, що й вище для Socket Mode, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Необов’язкові scope авторства (операції запису)">
    Додайте bot-scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача та іконку), а не типову ідентичність застосунку Slack.

    Якщо ви використовуєте emoji-іконку, Slack очікує синтаксис `:emoji_name:`.
  </Accordion>
  <Accordion title="Необов’язкові scope user token (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви залежите від читання пошуку Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- Для Socket Mode потрібні `botToken` + `appToken`.
- Для HTTP-режиму потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають звичайні
  рядки або об’єкти SecretRef.
- Токени в конфігурації мають пріоритет над резервними значеннями env.
- Резервні значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовуються лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного значення env) і типово працює в режимі лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Інспекція облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожного облікового запису (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше не вбудоване джерело секретів, але поточний шлях команди/виконання
  не зміг визначити фактичне значення.
- У HTTP-режимі включається `signingSecretStatus`; у Socket Mode
  потрібною парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу за наявності налаштування може надаватися перевага user token. Для запису перевага все одно надається bot token; запис через user token дозволено лише коли `userTokenReadOnly: false` і bot token недоступний.
</Tip>

## Дії та обмеження

Дії Slack керуються через `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Група      | Типово |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії для повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` та `emoji-list`.

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM (застаріле: `channels.slack.dm.policy`):

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для багатьох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Прив’язка в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розміщується в `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується резервне значення `groupPolicy="allowlist"` і записується попередження в лог (навіть якщо задано `channels.defaults.groupPolicy`).

    Визначення імені/ID:

    - записи allowlist каналів і записи allowlist DM визначаються під час запуску, якщо доступ токена це дозволяє
    - нерозв’язані записи імен каналів зберігаються як налаштовані, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів типово працюють за принципом ID-first; пряме зіставлення імені користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналів">
    Повідомлення каналів типово обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді боту (вимикається, якщо `thread.requireExplicitMention` має значення `true`)

    Керування для кожного каналу (`channels.slack.channels.<id>`; імена лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса все ще зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Треди, сесії та теги відповідей

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- З типовим `session.dmScope=main` Slack DM зводяться до основної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в тредах можуть створювати суфікси сесій тредів (`:thread:<threadTs>`) за потреби.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень треду буде отримано під час запуску нової сесії треду (типово `20`; установіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли має значення `true`, пригнічує неявні згадки в треді, тож бот відповідає лише на явні згадки `@bot` усередині тредів, навіть якщо бот уже брав участь у треді. Без цього відповіді в треді, де вже брав участь бот, оминають обмеження `requireMention`.

Керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для `direct|group|channel`
- застаріле резервне значення для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все одно враховуються в режимі `"off"` — у Slack треди приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими вбудовано.

## Реакції підтвердження

`ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервне значення emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду в реальному часі:

- `off`: вимкнути потоковий попередній перегляд у реальному часі.
- `partial` (типово): замінювати текст попереднього перегляду останнім частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст стану прогресу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли активний чернетковий попередній перегляд, спрямовувати оновлення інструментів/прогресу в те саме відредаговане повідомлення попереднього перегляду (типово: `true`). Установіть `false`, щоб зберегти окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує рідним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (типово: `true`).

- Для рідного потокового передавання тексту та відображення стану треду Slack assistant має бути доступний тред відповіді. Вибір треду й надалі підпорядковується `replyToMode`.
- Кореневі повідомлення каналів і групових чатів усе ще можуть використовувати звичайний чернетковий попередній перегляд, якщо рідне потокове передавання недоступне.
- DM верхнього рівня в Slack типово залишаються поза тредами, тому не показують попередній перегляд у стилі треду; використовуйте відповіді в треді або `typingReaction`, якщо хочете бачити прогрес там.
- Для медіа й нетекстових payload використовується звичайна доставка.
- Фінальні повідомлення з медіа/помилками скасовують відкладені редагування попереднього перегляду; придатні фінальні текстові/block-повідомлення скидаються лише тоді, коли можуть відредагувати попередній перегляд на місці.
- Якщо потокове передавання зламається посеред відповіді, OpenClaw повернеться до звичайної доставки для решти payload.

Використовуйте чернетковий попередній перегляд замість рідного потокового передавання тексту Slack:

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
- булеве `channels.slack.streaming` автоматично мігрує до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застаріле `channels.slack.nativeStreaming` автоматично мігрує до `channels.slack.streaming.nativeTransport`.

## Резервна реакція друку

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення виконання. Це найкорисніше поза відповідями в треді, де використовується типовий індикатор стану "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція має режим best-effort, а очищення автоматично намагається виконатися після відповіді або завершення сценарію помилки.

## Медіа, поділ на частини та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо отримання успішне та дозволяють обмеження розміру.

    Типове обмеження розміру для вхідних даних під час виконання — `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ спочатку за абзацами
    - надсилання файлів використовує Slack upload API і може включати відповіді в треді (`thread_ts`)
    - обмеження вихідних медіа визначається `channels.slack.mediaMaxMb`, якщо його налаштовано; інакше для надсилання каналом використовуються типові MIME-kind значення з медіапайплайна
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    DM Slack відкриваються через Slack conversation API під час надсилання до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка слеш-команд

Слеш-команди відображаються в Slack або як одна налаштована команда, або як кілька вбудованих команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Вбудовані команди потребують [додаткових налаштувань маніфесту](#additional-manifest-settings) у вашому застосунку Slack і натомість вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим вбудованих команд для Slack — **вимкнений**, тому `commands.native: "auto"` не вмикає вбудовані команди Slack.

```txt
/help
```

Вбудовані меню аргументів використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед передаванням вибраного значення параметра:

- до 5 параметрів: блоки кнопок
- 6-100 параметрів: статичне меню вибору
- більше 100 параметрів: зовнішній вибір з асинхронною фільтрацією параметрів, якщо доступні обробники параметрів interactivity
- перевищено обмеження Slack: закодовані значення параметрів повертаються до кнопок

```txt
/think
```

Сесії слеш-команд використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно маршрутизують виконання команд до сесії цільової розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відтворювати інтерактивні елементи керування відповідями, створеними агентом, але ця можливість типово вимкнена.

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

Коли функцію ввімкнено, агенти можуть надсилати директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і маршрутизують натискання або вибір назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це специфічний для Slack UI. Інші канали не перетворюють директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це непрозорі токени, згенеровані OpenClaw, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищують обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання некоректного payload blocks.

## Підтвердження exec у Slack

Slack може виступати як рідний клієнт підтверджень з інтерактивними кнопками та взаємодіями замість переходу до Web UI або термінала.

- Підтвердження exec використовують `channels.slack.execApprovals.*` для рідної маршрутизації DM/каналу.
- Підтвердження Plugin також можуть визначатися через ту саму рідну поверхню кнопок Slack, коли запит уже надходить у Slack, а тип id підтвердження — `plugin:`.
- Авторизація тих, хто підтверджує, усе одно застосовується: лише користувачі, визначені як такі, що можуть підтверджувати, можуть схвалювати або відхиляти запити через Slack.

Для цього використовується та сама спільна поверхня кнопок підтвердження, що й в інших каналах. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на підтвердження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX для підтвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що підтвердження в чаті недоступні або ручне підтвердження — єдиний шлях.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовується резервне значення `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає рідні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один
користувач, що підтверджує. Установіть `enabled: false`, щоб явно вимкнути Slack як рідний клієнт підтверджень.
Установіть `enabled: true`, щоб примусово ввімкнути рідні підтвердження, коли визначаються користувачі, що підтверджують.

Типова поведінка без явної конфігурації підтверджень exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна рідна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити користувачів, що підтверджують, додати фільтри або
вибрати доставку до чату-джерела:

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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на підтвердження exec також мають
маршрутизуватися до інших чатів або явних зовнішніх цілей. Спільне переспрямування `approvals.plugin` також є
окремим; рідні кнопки Slack усе одно можуть визначати підтвердження Plugin, коли ці запити вже надходять
у Slack.

`/approve` у тому самому чаті також працює в каналах і DM Slack, які вже підтримують команди. Див. [Підтвердження exec](/uk/tools/exec-approvals), щоб ознайомитися з повною моделлю переспрямування підтверджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень і трансляції тредів зіставляються із системними подіями.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події входу/виходу учасників, створення/перейменування каналу та додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути впроваджені в контекст маршрутизації.
- Ініціатор треду та початкове заповнення контексту історії треду фільтруються за налаштованими allowlist відправників, якщо це застосовно.
- Дії блоків і взаємодії з модальними вікнами надсилають структуровані системні події `Slack interaction: ...` із розширеними полями payload:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події модальних вікон `view_submission` і `view_closed` з маршрутизованими метаданими каналів і даними форм

## Довідник з конфігурації

Основний довідник: [Довідник з конфігурації - Slack](/uk/gateway/configuration-reference#slack).

<Accordion title="Важливі поля Slack">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; залишайте вимкненим, якщо не потрібен)
- доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

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
    - підтвердження прив’язки / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте bot token + app token і ввімкнення Socket Mode в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    отримане через SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - webhook path
    - URL-адреси запитів Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо в знімках облікового запису з’являється `signingSecretStatus: "configured_unavailable"`,
    HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, отриманий через SecretRef.

  </Accordion>

  <Accordion title="Рідні/slash-команди не спрацьовують">
    Перевірте, чи ви мали на увазі:

    - режим рідних команд (`channels.slack.commands.native: true`) з відповідними слеш-командами, зареєстрованими в Slack
    - або режим однієї слеш-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Прив’язка" icon="link" href="/uk/channels/pairing">
    Прив’яжіть користувача Slack до Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових DM.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритетність.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
