---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-06T09:17:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11571e7e10cfbf4de91dc1b1ed6582cd94afdcf6c3356fdd3ccc770096c6dd31
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Статус: готовий до продакшену для особистих повідомлень і каналів через інтеграції застосунку Slack. Типовий режим — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Зіставлення" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Slack типово працюють у режимі зіставлення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (типово)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочу область для свого застосунку
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

        Резервне значення через env (лише для типового облікового запису):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Запустіть gateway">

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

        - виберіть **from a manifest** і виберіть робочу область для свого застосунку
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
        Використовуйте унікальні шляхи webhook для багатьох HTTP-облікових записів

        Надайте кожному обліковому запису окремий `webhookPath` (типово `/slack/events`), щоб реєстрації не конфліктували.
        </Note>

      </Step>

      <Step title="Запустіть gateway">

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

<AccordionGroup>
  <Accordion title="Необов’язкові scopes авторства (операції запису)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача та піктограму) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте піктограму emoji, Slack очікує синтаксис `:emoji_name:`.
  </Accordion>
  <Accordion title="Необов’язкові scopes токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope для читання є:

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

- `botToken` + `appToken` обов’язкові для Socket Mode.
- Режим HTTP вимагає `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Токени в конфігурації мають пріоритет над резервними значеннями env.
- Резервні значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовуються лише до типового облікового запису.
- `userToken` (`xoxp-...`) задається лише в конфігурації (без резервного значення env) і типово працює в режимі лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше не-inline джерело секретів, але поточний шлях команди/виконання
  не зміг визначити фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  обов’язковою парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для читання дій/каталогів перевага може надаватися токену користувача, якщо його налаштовано. Для запису пріоритет зберігається за bot token; запис через токен користувача дозволено лише коли `userTokenReadOnly: false` і bot token недоступний.
</Tip>

## Дії та обмеження

Діями Slack керує `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Група      | Типово |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії для повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`.

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика особистих повідомлень">
    `channels.slack.dmPolicy` керує доступом до особистих повідомлень (застаріле: `channels.slack.dm.policy`):

    - `pairing` (типово)
    - `allowlist`
    - `open` (вимагає, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці особистих повідомлень:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові особисті повідомлення типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для багатьох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не заданий.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Зіставлення в особистих повідомленнях використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів міститься в `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується `groupPolicy="allowlist"` і записується попередження (навіть якщо задано `channels.defaults.groupPolicy`).

    Визначення імені/ID:

    - записи allowlist каналів і allowlist особистих повідомлень визначаються під час запуску, якщо доступ токена це дозволяє
    - нерозв’язані записи імен каналів зберігаються як налаштовані, але типово ігноруються для маршрутизації
    - авторизація вхідних подій і маршрутизація каналів типово орієнтовані на ID; пряме зіставлення за ім’ям користувача/slug вимагає `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналів">
    Повідомлення в каналах типово обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в ланцюжку боту

    Керування на рівні каналу (`channels.slack.channels.<id>`; імена лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або шаблон `"*"`
      (застарілі ключі без префікса, як і раніше, зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Ланцюжки, сесії та теги відповіді

- Особисті повідомлення маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- З типовим `session.dmScope=main` особисті повідомлення Slack згортаються в основну сесію агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в ланцюжках можуть створювати суфікси сесій ланцюжків (`:thread:<threadTs>`), де це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень ланцюжка отримується під час запуску нової сесії ланцюжка (типово `20`; задайте `0`, щоб вимкнути).

Параметри ланцюжків відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застаріле резервне значення для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** ланцюжки відповідей у Slack, зокрема явні теги `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все одно враховуються в режимі `"off"`. Різниця відображає моделі ланцюжків на платформах: ланцюжки Slack приховують повідомлення з каналу, тоді як відповіді Telegram лишаються видимими в основному потоці чату.

## Реакції підтвердження

`ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервне значення emoji ідентичності агента (`agents.list[].identity.emoji`, інакше `"👀"`)

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду в реальному часі:

- `off`: вимкнути потоковий попередній перегляд у реальному часі.
- `partial` (типово): замінювати текст попереднього перегляду останнім частковим виводом.
- `block`: додавати порційні оновлення попереднього перегляду.
- `progress`: показувати текст стану прогресу під час генерації, а потім надсилати остаточний текст.

`channels.slack.nativeStreaming` керує нативним потоковим передаванням тексту Slack, коли `streaming` має значення `partial` (типово: `true`).

- Щоб відображалося нативне потокове передавання тексту, має бути доступний ланцюжок відповіді. Вибір ланцюжка все одно підпорядковується `replyToMode`. Без нього використовується звичайний чорновий попередній перегляд.
- Для медіа та нетекстових payload використовується звичайна доставка.
- Якщо потокове передавання переривається посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload.

Використовуйте чорновий попередній перегляд замість нативного потокового передавання тексту Slack:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Застарілі ключі:

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично мігрується в `channels.slack.streaming`.
- булеве `channels.slack.streaming` автоматично мігрується в `channels.slack.nativeStreaming`.

## Резервна реакція друку

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а після завершення виконання прибирає її. Це найкорисніше поза відповідями в ланцюжках, де використовується типовий індикатор стану "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція надсилається за принципом best-effort, а очищення автоматично намагається виконатися після завершення відповіді або сценарію помилки.

## Медіа, розбиття на частини та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладення файлів Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються в сховище медіа, якщо отримання успішне та дозволяють обмеження розміру.

    Типове обмеження розміру вхідних даних під час виконання — `20MB`, якщо не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові частини використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття спочатку за абзацами
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в ланцюжках (`thread_ts`)
    - обмеження вихідних медіа задається `channels.slack.mediaMaxMb`, якщо налаштовано; інакше надсилання в канал використовує типові значення kind MIME з конвеєра медіа
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для особистих повідомлень
    - `channel:<id>` для каналів

    Особисті повідомлення Slack відкриваються через API розмов Slack під час надсилання до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка слеш-команд

- Автоматичний режим нативних команд **вимкнений** для Slack (`commands.native: "auto"` не вмикає нативні команди Slack).
- Увімкніть нативні обробники команд Slack через `channels.slack.commands.native: true` (або глобально `commands.native: true`).
- Коли нативні команди ввімкнені, зареєструйте відповідні слеш-команди в Slack (імена `/<command>`), з одним винятком:
  - зареєструйте `/agentstatus` для команди status (Slack резервує `/status`)
- Якщо нативні команди не ввімкнені, ви можете запускати одну налаштовану слеш-команду через `channels.slack.slashCommand`.
- Нативні меню аргументів тепер адаптують свою стратегію відображення:
  - до 5 варіантів: блоки кнопок
  - 6-100 варіантів: статичне меню вибору
  - понад 100 варіантів: зовнішній вибір з асинхронним фільтруванням варіантів, якщо доступні обробники опцій interactivity
  - якщо закодовані значення варіантів перевищують обмеження Slack, потік повертається до кнопок
- Для довгих payload варіантів меню аргументів слеш-команд використовують діалог підтвердження перед відправленням вибраного значення.

Типові параметри слеш-команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Сесії слеш-команд використовують ізольовані ключі:

- `agent:<agentId>:slack:slash:<userId>`

і все одно маршрутизують виконання команди до цільової сесії розмови (`CommandTargetSessionKey`).

## Інтерактивні відповіді

Slack може відображати інтерактивні елементи керування відповідями, створеними агентом, але ця функція типово вимкнена.

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

Коли це ввімкнено, агенти можуть виводити директиви відповіді лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і маршрутизують натискання або вибір назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це непрозорі токени, згенеровані OpenClaw, а не сирі значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищують обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного payload blocks.

## Exec approvals у Slack

Slack може працювати як нативний клієнт погодження з інтерактивними кнопками та взаємодіями замість повернення до Web UI або термінала.

- Для нативної маршрутизації в особисті повідомлення/канали використовуються `channels.slack.execApprovals.*`.
- Погодження plugin також можуть визначатися через ту саму Slack-native поверхню кнопок, коли запит уже потрапляє в Slack і тип id погодження — `plugin:`.
- Авторизація погоджувача все одно застосовується: лише користувачі, визначені як approvers, можуть погоджувати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок погодження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на погодження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що погодження в чаті недоступні або ручне погодження — єдиний шлях.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовується резервне значення з `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні exec approvals, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один
approver. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт погодження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні погодження, коли approvers визначаються.

Типова поведінка без явної конфігурації Slack exec approval:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна конфігурація Slack-native потрібна лише тоді, коли ви хочете перевизначити approvers, додати фільтри або
увімкнути доставку до початкового чату:

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

Спільне переспрямування `approvals.exec` — окреме. Використовуйте його лише тоді, коли запити на exec approval також мають
маршрутизуватися до інших чатів або явно позасмугових цілей. Спільне переспрямування `approvals.plugin` також
окреме; Slack-native кнопки все одно можуть визначати plugin approvals, коли ці запити вже потрапляють
до Slack.

`/approve` у тому самому чаті також працює в каналах і особистих повідомленнях Slack, які вже підтримують команди. Повну модель переспрямування погоджень див. у [Exec approvals](/uk/tools/exec-approvals).

## Події та операційна поведінка

- Редагування/видалення повідомлень і thread broadcast зіставляються в системні події.
- Події додавання/видалення реакцій зіставляються в системні події.
- Події входу/виходу учасників, створення/перейменування каналів і додавання/видалення pin зіставляються в системні події.
- `channel_id_changed` може мігрувати ключі конфігурації каналів, коли ввімкнено `configWrites`.
- Метадані topic/purpose каналу вважаються недовіреним контекстом і можуть бути впроваджені в контекст маршрутизації.
- Початкова історія ланцюжка та заповнення контексту історії на початку ланцюжка фільтруються за налаштованими allowlist відправників, де це застосовно.
- Дії блоків і взаємодії modal створюють структуровані системні події `Slack interaction: ...` з насиченими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події modal `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеними даними форми

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - Slack](/uk/gateway/configuration-reference#slack)

  Високосигнальні поля Slack:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - доступ до особистих повідомлень: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний режим; тримайте вимкненим, якщо немає потреби)
  - доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - ланцюжки/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Усунення несправностей

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

  <Accordion title="Повідомлення в особистих повідомленнях ігноруються">
    Перевірте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - погодження зіставлення / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте bot token + app token і ввімкнення Socket Mode в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    яке зберігається через SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікового запису, HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, який зберігається через SecretRef.

  </Accordion>

  <Accordion title="Нативні/слеш-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з реєстрацією відповідних слеш-команд у Slack
    - або режим однієї слеш-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Зіставлення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Усунення несправностей](/uk/channels/troubleshooting)
- [Конфігурація](/uk/gateway/configuration)
- [Слеш-команди](/uk/tools/slash-commands)
