---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-05T17:59:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: efb37e1f04e1ac8ac3786c36ffc20013dacdc654bfa61e7f6e8df89c4902d2ab
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Статус: готово до використання у виробничому середовищі для DM і каналів через інтеграції застосунку Slack. Типовий режим — Socket Mode; також підтримується режим HTTP Events API.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Для DM у Slack типовим є режим pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
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
        - установіть застосунок і скопіюйте **Bot Token** (`xoxb-...`)
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

      <Step title="Підпишіть застосунок на події">
        Підпишіть події бота для:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Також увімкніть вкладку App Home **Messages Tab** для DM.
      </Step>

      <Step title="Запустіть шлюз">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Режим HTTP Events API">
    <Steps>
      <Step title="Налаштуйте застосунок Slack для HTTP">

        - установіть режим HTTP (`channels.slack.mode="http"`)
        - скопіюйте **Signing Secret** Slack
        - установіть Request URL для Event Subscriptions + Interactivity + Slash command на той самий шлях webhook (типово `/slack/events`)

      </Step>

      <Step title="Налаштуйте режим HTTP в OpenClaw">

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

      <Step title="Використовуйте унікальні шляхи webhook для HTTP з кількома обліковими записами">
        Підтримується режим HTTP для окремих облікових записів.

        Призначте кожному обліковому запису окремий `webhookPath`, щоб реєстрації не конфліктували.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Контрольний список маніфесту і scopes

<AccordionGroup>
  <Accordion title="Приклад маніфесту застосунку Slack" defaultOpen>

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

  </Accordion>

  <Accordion title="Необов’язкові scopes токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scopes читання є:

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

- Для Socket Mode потрібні `botToken` + `appToken`.
- Для режиму HTTP потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають текстові
  рядки або об’єкти SecretRef.
- Токени з конфігурації мають пріоритет над резервним варіантом із середовища.
- Резервний варіант через змінні середовища `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до типового облікового запису.
- `userToken` (`xoxp-...`) задається лише в конфігурації (без резервного варіанта через середовище) і типово працює в режимі лише для читання (`userTokenReadOnly: true`).
- Необов’язково: додайте `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (власні `username` та іконку). `icon_emoji` використовує синтаксис `:emoji_name:`.

Поведінка знімка статусу:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожного облікового запису (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секретів, але поточний шлях команди/виконання
  не зміг визначити фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  потрібною парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу за наявності налаштування може надаватися перевага токену користувача. Для запису пріоритетним залишається токен бота; запис через токен користувача дозволено лише коли `userTokenReadOnly: false` і токен бота недоступний.
</Tip>

## Дії та обмеження

Дії Slack керуються через `channels.slack.actions.*`.

Доступні групи дій у поточному наборі інструментів Slack:

| Група      | Типово   |
| ---------- | -------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії для повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`.

## Контроль доступу і маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом через DM (застаріле: `channels.slack.dm.policy`):

    - `pairing` (типово)
    - `allowlist`
    - `open` (вимагає, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Параметри DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необов’язковий список дозволу MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо в них не задано власний `allowFrom`.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Pairing у DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Список дозволу каналів розміщується в `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка під час виконання: якщо `channels.slack` повністю відсутній (налаштування лише через середовище), під час виконання використовується резервне значення `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Визначення імен/ID:

    - записи списку дозволу каналів і списку дозволу DM визначаються під час запуску, якщо доступ токена це дозволяє
    - нерозпізнані записи з іменами каналів зберігаються як налаштовані, але типово ігноруються під час маршрутизації
    - авторизація вхідних повідомлень і маршрутизація каналів типово виконуються за ID; пряме зіставлення за username/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадування і користувачі каналів">
    Повідомлення в каналах типово вимагають згадування.

    Джерела згадувань:

    - явне згадування застосунку (`<@botId>`)
    - regex-шаблони згадувань (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді на повідомлення бота

    Керування для окремого каналу (`channels.slack.channels.<id>`; імена лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (список дозволу)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключів `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса все ще зіставляються лише як `id:`)

  </Tab>
</Tabs>

## Треди, сесії і теги відповіді

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- За типового `session.dmScope=main` DM у Slack згортаються в основну сесію агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в тредах можуть створювати суфікси сесій тредів (`:thread:<threadTs>`) там, де це доречно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` визначає, скільки наявних повідомлень треду буде отримано під час початку нової сесії треду (типово `20`; установіть `0`, щоб вимкнути).

Керування відповідями в тредах:

- `channels.slack.replyToMode`: `off|first|all` (типово `off`)
- `channels.slack.replyToModeByChatType`: для `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **всі** відповіді в тредах у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"`. Відмінність відображає моделі тредів платформ: у Slack треди приховують повідомлення від каналу, тоді як у Telegram відповіді залишаються видимими в основному потоці чату.

## Реакції підтвердження

`ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний emoji з ідентичності агента (`agents.list[].identity.emoji`, інакше `"👀"`)

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокова передача тексту

`channels.slack.streaming` керує поведінкою live preview:

- `off`: вимкнути потокове попереднє відображення.
- `partial` (типово): замінювати текст попереднього перегляду останнім частковим виводом.
- `block`: додавати оновлення попереднього перегляду блоками.
- `progress`: показувати текст статусу поступу під час генерації, а потім надсилати фінальний текст.

`channels.slack.nativeStreaming` керує нативною потоковою передачею тексту Slack, коли `streaming` має значення `partial` (типово: `true`).

- Щоб відображалась нативна потокова передача тексту, має бути доступний тред відповіді. Вибір треду, як і раніше, визначається `replyToMode`. Без нього використовується звичайний чернетковий попередній перегляд.
- Медіа й нетекстові пейлоади переходять на звичайну доставку.
- Якщо потокова передача перерветься посеред відповіді, OpenClaw перейде на звичайну доставку для решти пейлоадів.

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

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично мігрує в `channels.slack.streaming`.
- булеве `channels.slack.streaming` автоматично мігрує в `channels.slack.nativeStreaming`.

## Резервна реакція набору

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в тредах, де типово використовується індикатор статусу "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція застосовується за принципом best-effort, а очищення автоматично намагається виконатися після відповіді або завершення шляху помилки.

## Медіа, розбиття на частини і доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладення файлів Slack завантажуються з приватних URL, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо отримання успішне й обмеження розміру це дозволяють.

    Типове обмеження розміру вхідних даних під час виконання — `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові частини використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття спочатку за абзацами
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа визначається `channels.slack.mediaMaxMb`, якщо задано; інакше надсилання в каналі використовує типові значення MIME-kind з медіаконвеєра
  </Accordion>

  <Accordion title="Цілі доставки">
    Рекомендовані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    DM у Slack відкриваються через API розмов Slack під час надсилання до цілей користувачів.

  </Accordion>
</AccordionGroup>

## Команди і поведінка slash

- Нативний автоматичний режим команд у Slack **вимкнено** (`commands.native: "auto"` не вмикає нативні команди Slack).
- Увімкніть нативні обробники команд Slack через `channels.slack.commands.native: true` (або глобально `commands.native: true`).
- Коли нативні команди ввімкнено, зареєструйте відповідні slash-команди в Slack (імена `/<command>`), з одним винятком:
  - зареєструйте `/agentstatus` для команди status (Slack резервує `/status`)
- Якщо нативні команди не ввімкнено, ви можете запускати одну налаштовану slash-команду через `channels.slack.slashCommand`.
- Меню нативних аргументів тепер адаптують свою стратегію відображення:
  - до 5 варіантів: кнопкові блоки
  - 6-100 варіантів: статичне меню вибору
  - понад 100 варіантів: зовнішній вибір з асинхронною фільтрацією варіантів, якщо доступні обробники параметрів interactivity
  - якщо закодовані значення варіантів перевищують обмеження Slack, потік переходить на кнопки
- Для довгих пейлоадів варіантів меню аргументів slash-команд використовують діалог підтвердження перед надсиланням вибраного значення.

Типові параметри slash-команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Для slash-сесій використовуються ізольовані ключі:

- `agent:<agentId>:slack:slash:<userId>`

і виконання команд усе одно маршрутизується щодо сесії цільової розмови (`CommandTargetSessionKey`).

## Інтерактивні відповіді

Slack може відображати інтерактивні елементи керування відповідями, створеними агентом, але цю можливість типово вимкнено.

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

Або ввімкніть лише для одного облікового запису Slack:

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

Коли можливість увімкнено, агенти можуть виводити директиви відповіді лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і маршрутизують натискання чи вибір назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це непрозорі токени, згенеровані OpenClaw, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищать обмеження Slack Block Kit, OpenClaw повернеться до початкової текстової відповіді замість надсилання недійсного пейлоада blocks.

## Підтвердження exec у Slack

Slack може виступати як нативний клієнт підтвердження з інтерактивними кнопками і взаємодіями замість резервного переходу до Web UI або термінала.

- Підтвердження exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналу.
- Підтвердження плагінів усе ще можуть визначатися через ту саму нативну поверхню кнопок Slack, коли запит уже надходить у Slack, а тип ідентифікатора підтвердження — `plugin:`.
- Авторизація тих, хто підтверджує, як і раніше, примусово застосовується: лише користувачі, визначені як approvers, можуть схвалювати або відхиляти запити через Slack.

Для цього використовується та сама спільна поверхня кнопок підтвердження, що й для інших каналів. Якщо у ваших налаштуваннях застосунку Slack увімкнено `interactivity`, запити на підтвердження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
повинен включати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що підтвердження в чаті недоступні або ручне підтвердження — єдиний шлях.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовується резервний варіант `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"`, і визначається принаймні один
approver. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт підтвердження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні підтвердження, коли визначаються approvers.

Типова поведінка без явної конфігурації підтверджень exec у Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити approvers, додати фільтри або
вибрати доставку в чат походження:

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

Спільне переспрямування `approvals.exec` налаштовується окремо. Використовуйте його лише тоді, коли запити на підтвердження exec також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
налаштовується окремо; нативні кнопки Slack все одно можуть визначати підтвердження плагінів, коли ці запити вже надходять
у Slack.

Команда `/approve` у тому самому чаті також працює в каналах і DM Slack, які вже підтримують команди. Повну модель переспрямування підтверджень див. в [Підтвердження exec](/tools/exec-approvals).

## Події та робоча поведінка

- Редагування/видалення повідомлень/розсилання тредів зіставляються із системними подіями.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події приєднання/виходу учасників, створення/перейменування каналу та додавання/видалення pin зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть додаватися до контексту маршрутизації.
- Початкове повідомлення треду та початкове заповнення контексту історії треду фільтруються за налаштованими списками дозволу відправників там, де це застосовно.
- Дії блоків і взаємодії з modal створюють структуровані системні події `Slack interaction: ...` з розширеними полями пейлоада:
  - дії блоків: вибрані значення, мітки, значення вибору та метадані `workflow_*`
  - події modal `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеними даними форми

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - Slack](/gateway/configuration-reference#slack)

  Основні поля Slack:
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
    - список дозволу каналів (`channels.slack.channels`)
    - `requireMention`
    - список дозволу `users` для окремого каналу

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
    - схвалення pairing / записи списку дозволу

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Режим Socket не підключається">
    Перевірте токени бота й застосунку та ввімкнення Socket Mode в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне виконання не змогло визначити значення,
    що підтримується SecretRef.

  </Accordion>

  <Accordion title="Режим HTTP не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - Request URL Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється в знімках
    облікового запису, обліковий запис HTTP налаштовано, але поточне виконання не змогло
    визначити signing secret, що підтримується SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, чи ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) із відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і списки дозволу каналу/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Pairing](/channels/pairing)
- [Групи](/channels/groups)
- [Безпека](/gateway/security)
- [Маршрутизація каналів](/channels/channel-routing)
- [Усунення несправностей](/channels/troubleshooting)
- [Конфігурація](/gateway/configuration)
- [Slash commands](/tools/slash-commands)
