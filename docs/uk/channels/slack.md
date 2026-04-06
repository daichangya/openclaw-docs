---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-04-06T07:21:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f324c1b203146b8b885179e9f76cd6883cedf96a87df1d9642626d8e7fb392a7
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Стан: готовий до production для DM і каналів через інтеграції застосунку Slack. Типовий режим — Socket Mode; URL-адреси HTTP-запитів також підтримуються.

<CardGroup cols={3}>
  <Card title="Пейринг" icon="link" href="/uk/channels/pairing">
    За замовчуванням Slack DM працюють у режимі пейрингу.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
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

        Резервне значення з env (лише для типового акаунта):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Підпишіть події застосунку">
        Підпишіть події бота для:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Також увімкніть **Messages Tab** у App Home для DM.
      </Step>

      <Step title="Запустіть шлюз">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL-адреси HTTP-запитів">
    <Steps>
      <Step title="Налаштуйте застосунок Slack для HTTP">

        - установіть режим HTTP (`channels.slack.mode="http"`)
        - скопіюйте **Signing Secret** Slack
        - установіть однаковий URL запиту для Event Subscriptions + Interactivity + Slash command на той самий шлях webhook (типово `/slack/events`)

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

      <Step title="Використовуйте унікальні шляхи webhook для кількох HTTP-акаунтів">
        Підтримується HTTP-режим для кожного акаунта окремо.

        Надайте кожному акаунту окремий `webhookPath`, щоб реєстрації не конфліктували.
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

<AccordionGroup>
  <Accordion title="Необов'язкові scope токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви покладаєтеся на читання пошуку Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- `botToken` + `appToken` потрібні для Socket Mode.
- Для HTTP-режиму потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Токени в конфігурації мають пріоритет над резервними значеннями з env.
- Резервне значення з env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до типового акаунта.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного значення з env) і за замовчуванням працює лише для читання (`userTokenReadOnly: true`).
- Необов’язково: додайте `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (власні `username` та іконку). `icon_emoji` використовує синтаксис `:emoji_name:`.

Поведінка знімка стану:

- Перевірка акаунта Slack відстежує поля `*Source` і `*Status`
  для кожного облікового даного (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що акаунт налаштований через SecretRef
  або інше не-inline джерело секрету, але поточна команда/шлях виконання
  не змогли отримати фактичне значення.
- У HTTP-режимі включається `signingSecretStatus`; у Socket Mode
  обов’язковою парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для читання дій/каталогів токен користувача може бути пріоритетним, якщо його налаштовано. Для запису пріоритетним залишається токен бота; запис через токен користувача дозволено лише коли `userTokenReadOnly: false` і токен бота недоступний.
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

Поточні дії з повідомленнями Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`.

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
    - `dm.groupEnabled` (для групових DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для кількох акаунтів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до акаунта `default`.
    - Іменовані акаунти успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані акаунти не успадковують `channels.slack.accounts.default.allowFrom`.

    Пейринг у DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналу">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів знаходиться в `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується резервне значення `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Розв’язання імен/ID:

    - записи allowlist каналів і DM allowlist розв’язуються під час запуску, якщо доступ токена це дозволяє
    - нерозв’язані записи імен каналів зберігаються як налаштовані, але типово ігноруються під час маршрутизації
    - вхідна авторизація та маршрутизація каналів типово працюють за ID; пряме зіставлення за username/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналів">
    Повідомлення каналів типово обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді на бота

    Керування для кожного каналу (`channels.slack.channels.<id>`; імена лише через розв’язання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або шаблон `"*"`
      (застарілі ключі без префікса все ще зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Треди, сесії та теги відповіді

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- З типовим `session.dmScope=main` Slack DM згортаються в основну сесію агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в треді можуть створювати суфікси сесії треду (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень треду отримується під час запуску нової сесії треду (типово `20`; установіть `0`, щоб вимкнути).

Елементи керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застаріле резервне значення для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"`. Різниця відображає моделі тредів платформ: треди Slack приховують повідомлення від каналу, тоді як відповіді Telegram залишаються видимими в основному потоці чату.

## Реакції підтвердження

`ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервне значення emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для акаунта Slack або глобально.

## Потокова передача тексту

`channels.slack.streaming` керує поведінкою live preview:

- `off`: вимкнути потокове live preview.
- `partial` (типово): замінювати текст попереднього перегляду останнім частковим виводом.
- `block`: додавати порційні оновлення попереднього перегляду.
- `progress`: показувати текст стану прогресу під час генерації, а потім надсилати фінальний текст.

`channels.slack.nativeStreaming` керує нативною потоковою передачею тексту Slack, коли `streaming` має значення `partial` (типово: `true`).

- Щоб з’явилася нативна потокова передача тексту, має бути доступний тред відповіді. Вибір треду все одно підпорядковується `replyToMode`. Без нього використовується звичайний чорновий попередній перегляд.
- Для медіа та нетекстових корисних навантажень використовується звичайна доставка.
- Якщо потокова передача зламається посеред відповіді, OpenClaw повернеться до звичайної доставки для решти корисних навантажень.

Використовуйте чорновий попередній перегляд замість нативної потокової передачі тексту Slack:

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

## Резервний варіант реакції друку

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її, коли виконання завершується. Це найкорисніше поза відповідями в треді, де використовується типовий індикатор стану "is typing...".

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція є best-effort, а очищення автоматично намагається виконатися після завершення відповіді або сценарію помилки.

## Медіа, розбиття на частини та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладення файлів Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо отримання успішне та дозволяють обмеження розміру.

    Типове обмеження розміру вхідних даних під час виконання — `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові частини використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття спочатку за абзацами
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в треді (`thread_ts`)
    - обмеження вихідних медіа підпорядковується `channels.slack.mediaMaxMb`, якщо налаштовано; інакше надсилання каналу використовує типові значення MIME-kind із конвеєра медіа
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    Slack DM відкриваються через API розмов Slack під час надсилання в цілі користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка слеш-команд

- Автоматичний нативний режим команд для Slack **вимкнений** (`commands.native: "auto"` не вмикає нативні команди Slack).
- Увімкніть нативні обробники команд Slack через `channels.slack.commands.native: true` (або глобально `commands.native: true`).
- Коли нативні команди ввімкнені, зареєструйте відповідні слеш-команди в Slack (імена `/<command>`), з одним винятком:
  - зареєструйте `/agentstatus` для команди стану (Slack резервує `/status`)
- Якщо нативні команди не ввімкнені, ви можете запускати одну налаштовану слеш-команду через `channels.slack.slashCommand`.
- Нативні меню аргументів тепер адаптують свою стратегію рендерингу:
  - до 5 варіантів: блоки кнопок
  - 6-100 варіантів: статичне меню вибору
  - понад 100 варіантів: зовнішній вибір з асинхронною фільтрацією варіантів, якщо доступні обробники параметрів interactivity
  - якщо закодовані значення варіантів перевищують ліміти Slack, процес повертається до кнопок
- Для довгих корисних навантажень варіантів меню аргументів слеш-команд використовують діалог підтвердження перед відправленням вибраного значення.

Типові налаштування слеш-команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Сесії слеш-команд використовують ізольовані ключі:

- `agent:<agentId>:slack:slash:<userId>`

і все ще маршрутизують виконання команди до сесії цільової розмови (`CommandTargetSessionKey`).

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

Або увімкніть лише для одного акаунта Slack:

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

Коли цю функцію ввімкнено, агенти можуть виводити директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і спрямовують кліки або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивного зворотного виклику — це непрозорі токени, згенеровані OpenClaw, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищують ліміти Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного корисного навантаження blocks.

## Підтвердження exec у Slack

Slack може виступати як нативний клієнт підтвердження з інтерактивними кнопками та взаємодіями замість резервного переходу до Web UI або термінала.

- Підтвердження exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації в DM/канал.
- Підтвердження плагінів також можуть розв’язуватися через ту саму нативну поверхню кнопок Slack, коли запит уже надходить у Slack, а тип id підтвердження — `plugin:`.
- Авторизація затверджувачів усе ще застосовується: лише користувачі, визначені як затверджувачі, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок підтвердження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на підтвердження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що
підтвердження в чаті недоступні або ручне підтвердження — єдиний шлях.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовує резервне значення `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і розв’язується принаймні один
затверджувач. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт підтвердження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні підтвердження, коли затверджувачі розв’язуються.

Типова поведінка без явної конфігурації підтверджень exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити затверджувачів, додати фільтри або
увімкнути доставку до чату-джерела:

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
маршрутизуватися в інші чати або до явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також є
окремим; нативні кнопки Slack все одно можуть розв’язувати підтвердження плагінів, коли ці запити вже надходять
у Slack.

`/approve` у тому самому чаті також працює в каналах і DM Slack, які вже підтримують команди. Див. [Підтвердження exec](/uk/tools/exec-approvals) для повної моделі переспрямування підтверджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень і broadсast тредів зіставляються із системними подіями.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події входу/виходу учасників, створення/перейменування каналу та додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані topic/purpose каналу розглядаються як недовірений контекст і можуть бути впроваджені в контекст маршрутизації.
- Ініціатор треду та початкове наповнення контексту історії треду фільтруються за налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і взаємодії з modal створюють структуровані системні події `Slack interaction: ...` з розширеними полями корисного навантаження:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події modal `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введенням форми

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - Slack](/uk/gateway/configuration-reference#slack)

  Високосигнальні поля Slack:
  - режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; не вмикайте без потреби)
  - доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - операції/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

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
    - підтвердження пейрингу / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте токени бота й застосунку та ввімкнення Socket Mode в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, акаунт Slack
    налаштований, але поточне середовище виконання не змогло розв’язати значення,
    що підтримується SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - URL-адреси запитів Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-акаунта

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    акаунта, HTTP-акаунт налаштований, але поточне середовище виконання не змогло
    розв’язати signing secret, що підтримується SecretRef.

  </Accordion>

  <Accordion title="Нативні/слеш-команди не спрацьовують">
    Перевірте, що саме ви планували:

    - нативний режим команд (`channels.slack.commands.native: true`) з відповідними слеш-командами, зареєстрованими в Slack
    - або режим однієї слеш-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

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
