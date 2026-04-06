---
read_when:
    - Налаштування Slack або налагодження режиму Slack socket/HTTP
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-06T08:00:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 897001c13d400cc8387a27000b82dd4c0512b2b88e2fe47785634aed8b7ab7af
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Статус: готовий до production для DM + каналів через інтеграції застосунків Slack. Типовий режим — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Пейринг" icon="link" href="/uk/channels/pairing">
    Slack DM за замовчуванням працюють у режимі пейрингу.
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
      <Step title="Створіть застосунок Slack і токени">
        У налаштуваннях застосунку Slack:

        - увімкніть **Socket Mode**
        - створіть **App Token** (`xapp-...`) з `connections:write`
        - встановіть застосунок і скопіюйте **Bot Token** (`xoxb-...`)
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

        Резервне значення з env (лише для облікового запису за замовчуванням):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Підпишіть події застосунку">
        Підпишіть бот-події для:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Також увімкніть вкладку App Home **Messages Tab** для DM.
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
      <Step title="Налаштуйте застосунок Slack для HTTP">

        - встановіть режим HTTP (`channels.slack.mode="http"`)
        - скопіюйте **Signing Secret** Slack
        - встановіть Request URL для Event Subscriptions + Interactivity + Slash command на той самий шлях webhook (типово `/slack/events`)

      </Step>

      <Step title="Налаштуйте HTTP-режим OpenClaw">

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

      </Step>

      <Step title="Використовуйте унікальні шляхи webhook для багатьох HTTP-облікових записів">
        Режим HTTP для кількох облікових записів підтримується.

        Призначте кожному обліковому запису окремий `webhookPath`, щоб реєстрації не конфліктували.
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
  <Accordion title="Необов’язкові scope авторства (операції запису)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (власне ім’я користувача й іконку) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте emoji-іконку, Slack очікує синтаксис `:emoji_name:`.
  </Accordion>
  <Accordion title="Необов’язкові scope токена користувача (операції читання)">
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

- `botToken` + `appToken` потрібні для Socket Mode.
- Для режиму HTTP потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті рядки
  або об’єкти SecretRef.
- Токени з конфігурації мають пріоритет над резервними значеннями з env.
- Резервні значення з env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовуються лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного значення з env) і типово працює в режимі лише читання (`userTokenReadOnly: true`).

Поведінка знімка статусу:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожного облікового запису (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус має значення `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштований через SecretRef
  або інше не-inline джерело секретів, але поточний шлях команди/виконання
  не зміг визначити фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  потрібною парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання директорій за наявності налаштування може використовуватися токен користувача. Для запису пріоритетним лишається токен бота; запис через токен користувача дозволяється лише коли `userTokenReadOnly: false` і токен бота недоступний.
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

Поточні дії для повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`.

## Контроль доступу та маршрутизація

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
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Пейринг у DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів зберігається в `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка про виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується резервне значення `groupPolicy="allowlist"` і записується попередження в лог (навіть якщо встановлено `channels.defaults.groupPolicy`).

    Визначення імен/ID:

    - записи allowlist каналів і записи allowlist DM визначаються під час запуску, якщо доступ токена це дозволяє
    - невизначені записи імен каналів зберігаються як налаштовано, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів типово працюють за принципом ID-first; пряме зіставлення імен користувачів/slugs потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналів">
    Повідомлення каналів типово обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявна поведінка reply-to-bot у треді

    Керування для окремого каналу (`channels.slack.channels.<id>`; імена лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

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

## Треди, сесії та теги відповідей

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- За типового `session.dmScope=main` DM у Slack зводяться до основної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в тредах можуть створювати суфікси сесій тредів (`:thread:<threadTs>`) за потреби.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень треду отримується при старті нової сесії треду (типово `20`; установіть `0`, щоб вимкнути).

Керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застаріле резервне значення для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все одно враховуються в режимі `"off"`. Різниця відображає моделі тредів платформ: у Slack треди приховують повідомлення з каналу, тоді як у Telegram відповіді лишаються видимими в основному потоці чату.

## Реакції підтвердження

`ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервне значення emoji ідентичності агента (`agents.list[].identity.emoji`, інакше `"👀"`)

Примітки:

- Slack очікує shortcodes (наприклад `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокова передача тексту

`channels.slack.streaming` керує поведінкою живого попереднього перегляду:

- `off`: вимкнути потоковий живий попередній перегляд.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати шматки оновлень попереднього перегляду.
- `progress`: показувати текст статусу прогресу під час генерації, а потім надсилати фінальний текст.

`channels.slack.nativeStreaming` керує нативною потоковою передачею тексту Slack, коли `streaming` має значення `partial` (типово: `true`).

- Щоб з’явилася нативна потокова передача тексту, має бути доступний тред відповіді. Вибір треду й надалі визначається `replyToMode`. Без нього використовується звичайний чернетковий попередній перегляд.
- Медіа та нетекстові payload повертаються до звичайної доставки.
- Якщо потокова передача зламається посеред відповіді, OpenClaw повернеться до звичайної доставки для решти payload.

Використовуйте чернетковий попередній перегляд замість нативної потокової передачі тексту Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично мігрує до `channels.slack.streaming`.
- булеве `channels.slack.streaming` автоматично мігрує до `channels.slack.nativeStreaming`.

## Резервна реакція введення

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення виконання. Це найкорисніше поза відповідями в треді, де використовується типовий індикатор статусу "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, і після завершення відповіді або сценарію помилки автоматично робиться спроба очищення.

## Медіа, чанкування та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладені файли Slack завантажуються з приватних URL, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо отримання успішне й дозволяють обмеження розміру.

    Типове обмеження розміру вхідних даних під час виконання — `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові чанки використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття з пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа дотримується `channels.slack.mediaMaxMb`, якщо налаштовано; інакше для надсилання в канали використовуються типові MIME-kind значення з медіапайплайна
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    DM у Slack відкриваються через API розмов Slack при надсиланні до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка слеш-команд

- Нативний автоматичний режим команд для Slack **вимкнено** (`commands.native: "auto"` не вмикає нативні команди Slack).
- Увімкніть нативні обробники команд Slack через `channels.slack.commands.native: true` (або глобально `commands.native: true`).
- Коли нативні команди увімкнені, зареєструйте відповідні слеш-команди у Slack (імена `/<command>`), з одним винятком:
  - зареєструйте `/agentstatus` для команди status (Slack резервує `/status`)
- Якщо нативні команди не увімкнені, можна виконувати одну налаштовану слеш-команду через `channels.slack.slashCommand`.
- Нативні меню аргументів тепер адаптують стратегію рендерингу:
  - до 5 варіантів: блоки кнопок
  - 6-100 варіантів: статичне меню вибору
  - понад 100 варіантів: зовнішній вибір з асинхронною фільтрацією варіантів, якщо доступні обробники параметрів interactivity
  - якщо закодовані значення варіантів перевищують обмеження Slack, потік повертається до кнопок
- Для довгих payload варіантів меню аргументів слеш-команд використовують діалог підтвердження перед передаванням вибраного значення.

Типові налаштування слеш-команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Сесії слеш-команд використовують ізольовані ключі:

- `agent:<agentId>:slack:slash:<userId>`

і, як і раніше, маршрутизують виконання команди до цільової сесії розмови (`CommandTargetSessionKey`).

## Інтерактивні відповіді

Slack може відображати інтерактивні елементи відповіді, створені агентом, але цю функцію типово вимкнено.

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

Або ввімкнути лише для одного облікового запису Slack:

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

Коли функцію ввімкнено, агенти можуть виводити директиви відповіді лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і маршрутизують кліки або вибір назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перетворюють директиви Slack Block Kit на власні системи кнопок.
- Значення інтерактивних callback — це непрозорі токени, згенеровані OpenClaw, а не сирі значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищують ліміти Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання невалідного payload блоків.

## Погодження exec у Slack

Slack може виступати нативним клієнтом погодження з інтерактивними кнопками та взаємодіями, замість повернення до Web UI або термінала.

- Погодження exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналів.
- Погодження plugin також можуть визначатися через ту саму нативну поверхню кнопок Slack, коли запит уже надходить у Slack і тип id погодження — `plugin:`.
- Авторизація того, хто погоджує, як і раніше, примусово перевіряється: лише користувачі, визначені як ті, хто погоджує, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок погодження, що й інші канали. Коли в налаштуваннях вашого застосунку Slack увімкнено `interactivity`, запити на погодження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що погодження в чаті
недоступні або ручне погодження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовується резервне значення `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні погодження exec, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один
користувач, що погоджує. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт погодження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні погодження, коли користувачі, що погоджують, визначені.

Типова поведінка без явної конфігурації погодження exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити список користувачів, що погоджують, додати фільтри або
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

Спільне переспрямування `approvals.exec` налаштовується окремо. Використовуйте його лише тоді, коли запити на погодження exec також мають
маршрутизуватися до інших чатів або явно заданих позасмугових цілей. Спільне переспрямування `approvals.plugin` також
налаштовується окремо; нативні кнопки Slack все одно можуть обробляти погодження plugin, коли такі запити вже надходять
у Slack.

Команда `/approve` у тому самому чаті також працює в каналах і DM Slack, які вже підтримують команди. Повну модель переспрямування погоджень див. у [Погодження exec](/uk/tools/exec-approvals).

## Події та операційна поведінка

- Редагування/видалення повідомлень/розсилання тредів зіставляються із системними подіями.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події входу/виходу учасників, створення/перейменування каналів і додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналів, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути інжектовані в контекст маршрутизації.
- Ініціатор треду та початкове заповнення контексту історії треду фільтруються за налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і взаємодії modal генерують структуровані системні події `Slack interaction: ...` із багатими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події modal `view_submission` і `view_closed` із маршрутними метаданими каналу та введеннями форми

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - Slack](/uk/gateway/configuration-reference#slack)

  Високосигнальні поля Slack:
  - режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; залишайте вимкненим, якщо немає потреби)
  - доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте в такому порядку:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` для окремого каналу

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
    - погодження пейрингу / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте bot + app tokens і увімкнення Socket Mode в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    яке використовує SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється в знімках
    облікового запису, HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, який використовує SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними слеш-командами, зареєстрованими у Slack
    - або режим однієї слеш-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` та allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Пейринг](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Усунення несправностей](/uk/channels/troubleshooting)
- [Конфігурація](/uk/gateway/configuration)
- [Слеш-команди](/uk/tools/slash-commands)
