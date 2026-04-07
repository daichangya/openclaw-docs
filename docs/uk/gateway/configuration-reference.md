---
read_when:
    - Вам потрібна точна семантика полів конфігурації або значення за замовчуванням на рівні окремих полів
    - Ви перевіряєте блоки конфігурації каналу, моделі, шлюзу або інструмента
summary: Повний довідник для кожного ключа конфігурації OpenClaw, значень за замовчуванням і параметрів каналів
title: Довідник з конфігурації
x-i18n:
    generated_at: "2026-04-07T15:03:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1eb296bd35db5d26be5a72ce2cbf94c5173d4e8ebeb6eb2d891dddd102511d05
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Довідник з конфігурації

Кожне поле, доступне в `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Конфігурація](/uk/gateway/configuration).

Формат конфігурації — **JSON5** (дозволено коментарі та кінцеві коми). Усі поля необов’язкові — якщо їх пропущено, OpenClaw використовує безпечні значення за замовчуванням.

---

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не вказано `enabled: false`).

### Доступ до особистих повідомлень і груп

Усі канали підтримують політики для особистих повідомлень і груп:

| Політика особистих повідомлень | Поведінка                                                      |
| ------------------------------ | -------------------------------------------------------------- |
| `pairing` (за замовчуванням)   | Невідомі відправники отримують одноразовий код сполучення; власник має підтвердити |
| `allowlist`                    | Лише відправники з `allowFrom` (або зі сховища дозволених після сполучення) |
| `open`                         | Дозволити всі вхідні особисті повідомлення (потрібно `allowFrom: ["*"]`) |
| `disabled`                     | Ігнорувати всі вхідні особисті повідомлення                    |

| Політика груп          | Поведінка                                              |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (за замовчуванням) | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                 | Обійти списки дозволених для груп (обмеження за згадками все одно застосовується) |
| `disabled`             | Блокувати всі повідомлення груп/кімнат                 |

<Note>
`channels.defaults.groupPolicy` задає значення за замовчуванням, коли `groupPolicy` у провайдера не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити на сполучення для особистих повідомлень обмежені **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп під час виконання повертається до `allowlist` (відмова за замовчуванням) із попередженням під час запуску.
</Note>

### Перевизначення моделей для каналів

Використовуйте `channels.modelByChannel`, щоб закріпити певні ідентифікатори каналів за моделлю. Значення можуть бути у форматі `provider/model` або як налаштовані псевдоніми моделей. Відображення каналу застосовується, якщо для сесії ще не встановлено перевизначення моделі (наприклад, через `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Значення каналів за замовчуванням і heartbeat

Використовуйте `channels.defaults` для спільної поведінки політики груп і heartbeat у різних провайдерів:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: резервна політика груп, коли `groupPolicy` на рівні провайдера не встановлено.
- `channels.defaults.contextVisibility`: режим видимості додаткового контексту за замовчуванням для всіх каналів. Значення: `all` (за замовчуванням, включати весь контекст цитат/гілок/історії), `allowlist` (включати контекст лише від дозволених відправників), `allowlist_quote` (так само, як allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення на рівні каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати стани справних каналів у вивід heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати стани деградації/помилок у вивід heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати heartbeat у компактному форматі індикатора.

### WhatsApp

WhatsApp працює через вебканал шлюзу (Baileys Web). Він запускається автоматично, коли існує пов’язана сесія.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // сині галочки (false у режимі чату із самим собою)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="Багатообліковий WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Команди вихідної доставки за замовчуванням використовують обліковий запис `default`, якщо він є; інакше — перший налаштований ідентифікатор облікового запису (після сортування).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір облікового запису за замовчуванням, якщо він відповідає налаштованому ідентифікатору облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису мігрується `openclaw doctor` до `whatsapp/default`.
- Перевизначення для окремих облікових записів: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Тримай відповіді короткими.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Не відхиляйся від теми.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Резервна копія Git" },
        { command: "generate", description: "Створити зображення" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (за замовчуванням: off; вмикайте явно, щоб уникнути обмежень швидкості попереднього перегляду під час редагування)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; символьні посилання відхиляються), із `TELEGRAM_BOT_TOKEN` як резервним варіантом для облікового запису за замовчуванням.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає налаштованому ідентифікатору облікового запису.
- У конфігураціях із кількома обліковими записами (2+ ідентифікатори облікових записів) встановіть явний обліковий запис за замовчуванням (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, якщо його немає або він недійсний.
- `configWrites: false` блокує записи конфігурації, ініційовані з Telegram (міграції ідентифікаторів супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Попередній перегляд потоків Telegram використовує `sendMessage` + `editMessageText` (працює в особистих і групових чатах).
- Політика повторних спроб: див. [Політика повторних спроб](/uk/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Лише короткі відповіді.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress відображається як partial у Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // увімкнення за згодою для sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Токен: `channels.discord.token`, із `DISCORD_BOT_TOKEN` як резервним варіантом для облікового запису за замовчуванням.
- Прямі вихідні виклики, у яких явно вказано Discord `token`, використовують цей токен для виклику; параметри повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає налаштованому ідентифікатору облікового запису.
- Для цілей доставки використовуйте `user:<id>` (особисті повідомлення) або `channel:<id>` (канал гільдії); голі числові ідентифікатори відхиляються.
- Slug-и гільдій — у нижньому регістрі з пробілами, заміненими на `-`; ключі каналів використовують slug-ім’я (без `#`). Надавайте перевагу ідентифікаторам гільдій.
- Повідомлення, написані ботом, ігноруються за замовчуванням. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення на рівні каналів) відкидає повідомлення, які згадують іншого користувача чи роль, але не бота (окрім @everyone/@here).
- `maxLinesPerMessage` (за замовчуванням 17) розбиває довгі повідомлення навіть тоді, коли вони коротші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією, прив’язаною до гілок Discord:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до гілок (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а також прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокусу через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: перемикач увімкнення за згодою для автоматичного створення/прив’язки гілок `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив’язки для каналів і гілок (використовуйте ідентифікатор каналу/гілки в `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови у голосових каналах Discord та необов’язкове автоматичне приєднання + перевизначення TTS.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються до параметрів DAVE у `@discordjs/voice` (`true` і `24` за замовчуванням).
- OpenClaw також намагається відновити прийом голосу, виходячи й повторно приєднуючись до голосової сесії після повторних збоїв дешифрування.
- `channels.discord.streaming` — канонічний ключ режиму потоку. Застарілі `streamMode` і булеві значення `streaming` мігруються автоматично.
- `channels.discord.autoPresence` відображає доступність runtime у статус бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінним ім’ям/тегом (режим сумісності break-glass).
- `channels.discord.execApprovals`: власна доставка підтверджень exec у Discord і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі підтвердження exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Discord, яким дозволено схвалювати запити exec. Якщо не вказано, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий список дозволених ідентифікаторів агентів. Не вказуйте, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на підтвердження. `"dm"` (за замовчуванням) надсилає в особисті повідомлення схвалювачам, `"channel"` — у вихідний канал, `"both"` — в обидва місця. Коли ціль включає `"channel"`, кнопками можуть користуватися лише визначені схвалювачі.
  - `cleanupAfterResolve`: коли `true`, видаляє особисті повідомлення з підтвердженням після схвалення, відхилення або тайм-ауту.

**Режими сповіщень про реакції:** `off` (немає), `own` (повідомлення бота, за замовчуванням), `all` (усі повідомлення), `allowlist` (від `guilds.<id>.users` для всіх повідомлень).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON облікового запису сервісу: вбудований (`serviceAccount`) або на основі файлу (`serviceAccountFile`).
- Також підтримується SecretRef для облікового запису сервісу (`serviceAccountRef`).
- Резервні змінні середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Для цілей доставки використовуйте `spaces/<spaceId>` або `users/<userId>`.
- `channels.googlechat.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінним email principal (режим сумісності break-glass).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Лише короткі відповіді.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (режим попереднього перегляду)
      nativeStreaming: true, // використовувати рідний API потокової передачі Slack, коли streaming=partial
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Режим сокетів** вимагає одночасно `botToken` і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` як резервні змінні середовища для облікового запису за замовчуванням).
- **HTTP-режим** вимагає `botToken` плюс `signingSecret` (у корені або для окремого облікового запису).
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають прості текстові
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack містять поля джерела/статусу облікових даних, такі як
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у HTTP-режимі,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштований через SecretRef, але поточний шлях команди/runtime не зміг
  розв’язати значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані зі Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає налаштованому ідентифікатору облікового запису.
- `channels.slack.streaming` — канонічний ключ режиму потоку. Застарілі `streamMode` і булеві значення `streaming` мігруються автоматично.
- Для цілей доставки використовуйте `user:<id>` (особисті повідомлення) або `channel:<id>`.

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (із `reactionAllowlist`).

**Ізоляція сесій гілок:** `thread.historyScope` — для кожної гілки окремо (за замовчуванням) або спільно в межах каналу. `thread.inheritParent` копіює стенограму батьківського каналу в нові гілки.

- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а після завершення видаляє її. Використовуйте короткий код emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: власна доставка підтверджень exec у Slack і авторизація схвалювачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ідентифікатори користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій    | За замовчуванням | Примітки                 |
| ------------ | ---------------- | ------------------------ |
| reactions    | увімкнено        | Реагувати + перелік реакцій |
| messages     | увімкнено        | Читання/надсилання/редагування/видалення |
| pins         | увімкнено        | Закріпити/відкріпити/перелік |
| memberInfo   | увімкнено        | Відомості про учасника   |
| emojiList    | увімкнено        | Список користувацьких emoji |

### Mattermost

Mattermost постачається як plugin: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // увімкнення за згодою
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Необов’язкова явна URL-адреса для розгортань із reverse proxy/public
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Режими чату: `oncall` (відповідати на @-згадку, за замовчуванням), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса тригера).

Коли рідні команди Mattermost увімкнено:

- `commands.callbackPath` має бути шляхом (наприклад, `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має вказувати на endpoint шлюзу OpenClaw і бути доступною з сервера Mattermost.
- Рідні зворотні виклики slash-команд автентифікуються за допомогою токенів для кожної команди, які
  Mattermost повертає під час реєстрації slash-команди. Якщо реєстрація не вдалася або не
  активовано жодної команди, OpenClaw відхиляє зворотні виклики з
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/internal хостів зворотних викликів Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен зворотного виклику.
  Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані з Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення обмеження за згадками для окремого каналу (`"*"` для значення за замовчуванням).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає налаштованому ідентифікатору облікового запису.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // необов’язкова прив’язка облікового запису
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (із `reactionAllowlist`).

- `channels.signal.account`: закріпити запуск каналу за конкретною ідентичністю облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити записи конфігурації, ініційовані із Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає налаштованому ідентифікатору облікового запису.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (на базі plugin, налаштовується в `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls та розширені дії:
      // див. /channels/bluebubbles
    },
  },
}
```

- Ключові шляхи ядра, описані тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає налаштованому ідентифікатору облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних сесій ACP. Використовуйте handle або цільовий рядок BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Повна конфігурація каналу BlueBubbles описана в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Не потрібні ні демон, ні порт.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає налаштованому ідентифікатору облікового запису.

- Потрібен Full Disk Access до бази даних Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на SSH-обгортку; встановіть `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (за замовчуванням: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тому переконайтеся, що ключ ретранслятора вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи конфігурації, ініційовані з iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сесій ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH-обгортки для iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix має підтримку через extension і налаштовується в `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Автентифікація токеном використовує `accessToken`; автентифікація паролем використовує `userId` + `password`.
- `channels.matrix.proxy` спрямовує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначати його через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/internal homeserver-и. `proxy` і цей opt-in для мережі — незалежні елементи керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у конфігураціях із кількома обліковими записами.
- `channels.matrix.autoJoin` за замовчуванням дорівнює `off`, тому запрошені кімнати та нові запрошення у стилі особистих повідомлень ігноруються, доки ви не встановите `autoJoin: "allowlist"` із `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: власна доставка підтверджень exec у Matrix і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі підтвердження exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Matrix (наприклад, `@owner:example.org`), яким дозволено схвалювати запити exec.
  - `agentFilter`: необов’язковий список дозволених ідентифікаторів агентів. Не вказуйте, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на підтвердження. `"dm"` (за замовчуванням), `"channel"` (вихідна кімната) або `"both"`.
  - Перевизначення для окремих облікових записів: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як особисті повідомлення Matrix групуються в сесії: `per-user` (за замовчуванням) ділить за маршрутизованим співрозмовником, тоді як `per-room` ізолює кожну кімнату особистих повідомлень.
- Перевірки стану Matrix і пошук у live-directory використовують ту саму політику проксі, що й трафік runtime.
- Повна конфігурація Matrix, правила адресації та приклади налаштування описані в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams має підтримку через extension і налаштовується в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, політики команд/каналів:
      // див. /channels/msteams
    },
  },
}
```

- Ключові шляхи ядра, описані тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повна конфігурація Teams (облікові дані, webhook, політика особистих/групових повідомлень, перевизначення для окремих команд/каналів) описана в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC має підтримку через extension і налаштовується в `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Ключові шляхи ядра, описані тут: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає налаштованому ідентифікатору облікового запису.
- Повна конфігурація каналу IRC (host/port/TLS/channels/allowlists/обмеження за згадками) описана в [IRC](/uk/channels/irc).

### Кілька облікових записів (усі канали)

Запускайте кілька облікових записів на канал (кожен зі своїм `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Основний бот",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Бот сповіщень",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` використовується, коли `accountId` пропущено (CLI + маршрутизація).
- Токени середовища застосовуються лише до облікового запису **default**.
- Базові параметри каналу застосовуються до всіх облікових записів, якщо не перевизначено їх окремо.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте не-default обліковий запис через `openclaw channels add` (або onboarding каналу), залишаючись при цьому на верхньорівневій конфігурації каналу для одного облікового запису, OpenClaw спочатку піднімає верхньорівневі значення для одного облікового запису, прив’язані до облікового запису, у мапу облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Більшість каналів переміщують їх до `channels.<channel>.accounts.default`; Matrix може зберегти наявну відповідну іменовану/default-ціль.
- Наявні прив’язки лише до каналу (без `accountId`) і надалі відповідатимуть обліковому запису за замовчуванням; прив’язки, прив’язані до облікового запису, залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи верхньорівневі значення для одного облікового запису, прив’язані до облікового запису, до підвищеного облікового запису, вибраного для цього каналу. Більшість каналів використовують `accounts.default`; Matrix може зберегти наявну відповідну іменовану/default-ціль.

### Інші канали extension

Багато каналів extension налаштовуються як `channels.<id>` і описані на окремих сторінках каналів (наприклад, Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Див. повний індекс каналів: [Канали](/uk/channels).

### Обмеження за згадками в групових чатах

Для групових повідомлень за замовчуванням **потрібна згадка** (згадка в метаданих або безпечні regex-шаблони). Це застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

**Типи згадок:**

- **Згадки в метаданих**: рідні @-згадки платформи. Ігноруються в режимі чату із самим собою у WhatsApp.
- **Текстові шаблони**: безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони та небезпечні вкладені повторення ігноруються.
- Обмеження за згадками застосовується лише тоді, коли виявлення можливе (рідні згадки або принаймні один шаблон).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Встановіть `0`, щоб вимкнути.

#### Ліміти історії особистих повідомлень

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Розв’язання: перевизначення для окремого DM → значення провайдера за замовчуванням → без обмеження (зберігається все).

Підтримуються: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим чату із самим собою

Додайте свій власний номер до `allowFrom`, щоб увімкнути режим чату із самим собою (ігнорує рідні @-згадки, реагує лише на текстові шаблони):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Команди (обробка команд у чаті)

```json5
{
  commands: {
    native: "auto", // реєструвати рідні команди, якщо підтримуються
    text: true, // розбирати /commands у повідомленнях чату
    bash: false, // дозволити ! (псевдонім: /bash)
    bashForegroundMs: 2000,
    config: false, // дозволити /config
    debug: false, // дозволити /debug
    restart: false, // дозволити /restart + інструмент перезапуску шлюзу
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Деталі команд">

- Текстові команди мають бути **окремими** повідомленнями, що починаються з `/`.
- `native: "auto"` вмикає рідні команди для Discord/Telegram, але залишає їх вимкненими для Slack.
- Перевизначення для каналу: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- `channels.telegram.customCommands` додає додаткові записи меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потрібні `tools.elevated.enabled` і відправник у `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів шлюзу `chat.send` постійні записи `/config set|unset` також вимагають `operator.admin`; доступний лише для читання `/config show` залишається доступним звичайним клієнтам оператора з правом запису.
- `channels.<provider>.configWrites` керує мутаціями конфігурації для кожного каналу (за замовчуванням: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також керує записами, націленими на цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` задається для кожного провайдера. Якщо встановлено, це **єдине** джерело авторизації (списки дозволених/сполучення каналу та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не встановлено.

</Accordion>

---

## Значення агентів за замовчуванням

### `agents.defaults.workspace`

За замовчуванням: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, що показується в рядку Runtime системного prompt-а. Якщо не встановлено, OpenClaw автоматично виявляє його, рухаючись вгору від workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий список дозволених Skills за замовчуванням для агентів, які не встановлюють
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює значення за замовчуванням
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

- Пропустіть `agents.defaults.skills`, щоб за замовчуванням не обмежувати Skills.
- Пропустіть `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
- Встановіть `agents.list[].skills: []`, щоб не було жодних Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента;
  він не об’єднується зі значеннями за замовчуванням.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли workspace вставляються в системний prompt. За замовчуванням: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді помічника) пропускають повторну вставку bootstrap workspace, зменшуючи розмір prompt-а. Запуски heartbeat і повторні спроби після компакції все одно перебудовують контекст.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на один bootstrap-файл workspace перед обрізанням. За замовчуванням: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що вставляються з усіх bootstrap-файлів workspace. За замовчуванням: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента попереджувальним текстом, коли bootstrap-контекст обрізається.
За замовчуванням: `"once"`.

- `"off"`: ніколи не вставляти попередження в системний prompt.
- `"once"`: вставляти попередження один раз для кожного унікального підпису обрізання (рекомендовано).
- `"always"`: вставляти попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Максимальний розмір у пікселях для довшої сторони зображення в блоках зображень transcript/tool перед викликами провайдера.
За замовчуванням: `1200`.

Менші значення зазвичай зменшують використання vision-токенів і розмір payload запиту для сценаріїв із великою кількістю скриншотів.
Більші значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного prompt-а (не для міток часу повідомлень). Якщо не встановлено, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному prompt-і. За замовчуванням: `auto` (налаштування ОС).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // глобальні параметри провайдера за замовчуванням
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Рядкова форма встановлює лише основну модель.
  - Форма об’єкта встановлює основну модель плюс впорядковані резервні моделі.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як конфігурація vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею tool/plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для рідної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-1` для OpenAI Images.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію/API key провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` для `openai/*`, `FAL_KEY` для `fal/*`).
  - Якщо не вказано, `image_generate` все одно може вивести значення за замовчуванням на основі автентифікації провайдера. Спочатку він пробує поточного провайдера за замовчуванням, а потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.5+`.
  - Якщо не вказано, `music_generate` все одно може вивести значення за замовчуванням на основі автентифікації провайдера. Спочатку він пробує поточного провайдера за замовчуванням, а потім решту зареєстрованих провайдерів генерації музики в порядку provider-id.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію/API key провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо не вказано, `video_generate` все одно може вивести значення за замовчуванням на основі автентифікації провайдера. Спочатку він пробує поточного провайдера за замовчуванням, а потім решту зареєстрованих провайдерів генерації відео в порядку provider-id.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію/API key провайдера.
  - Вбудований провайдер генерації відео Qwen наразі підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд і параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо не вказано, інструмент PDF повертається до `imageModel`, а потім до визначеної моделі сесії/типової моделі.
- `pdfMaxBytesMb`: ліміт розміру PDF за замовчуванням для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: максимальна кількість сторінок за замовчуванням, яку враховує резервний режим витягування в інструменті `pdf`.
- `verboseDefault`: рівень verbose для агентів за замовчуванням. Значення: `"off"`, `"on"`, `"full"`. За замовчуванням: `"off"`.
- `elevatedDefault`: рівень elevated-output для агентів за замовчуванням. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. За замовчуванням: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.4`). Якщо ви пропустите провайдера, OpenClaw спочатку спробує псевдонім, потім — унікальний збіг серед налаштованих провайдерів для цього точного model id, і лише після цього повернеться до налаштованого провайдера за замовчуванням (застаріла сумісність, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану модель за замовчуванням, OpenClaw повернеться до першого налаштованого provider/model замість того, щоб показувати застаріле значення за замовчуванням від видаленого провайдера.
- `models`: налаштований каталог моделей і список дозволених для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: глобальні параметри провайдера за замовчуванням, що застосовуються до всіх моделей. Встановлюються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), а потім `agents.list[].params` (для відповідного agent id) перевизначає по ключах. Докладніше див. [Кешування prompt-ів](/uk/reference/prompt-caching).
- Засоби запису конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення резервних варіантів), зберігають канонічну форму об’єкта і за можливості зберігають наявні списки резервних моделей.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів у різних сесіях (кожна сесія все одно серіалізується). За замовчуванням: 4.

**Вбудовані скорочені псевдоніми** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Псевдонім          | Модель                                 |
| ------------------ | -------------------------------------- |
| `opus`             | `anthropic/claude-opus-4-6`            |
| `sonnet`           | `anthropic/claude-sonnet-4-6`          |
| `gpt`              | `openai/gpt-5.4`                       |
| `gpt-mini`         | `openai/gpt-5.4-mini`                  |
| `gpt-nano`         | `openai/gpt-5.4-nano`                  |
| `gemini`           | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`     | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite`| `google/gemini-3.1-flash-lite-preview` |

Ваші налаштовані псевдоніми завжди мають пріоритет над типовими.

Моделі Z.AI GLM-4.x автоматично вмикають режим thinking, якщо ви не встановите `--thinking off` або самостійно не задасте `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI за замовчуванням вмикають `tool_stream` для потокової передачі викликів інструментів. Встановіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Моделі Anthropic Claude 4.6 за замовчуванням використовують `adaptive` thinking, коли явний рівень thinking не встановлено.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери не працюють.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-бекенди орієнтовані насамперед на текст; інструменти завжди вимкнені.
- Сесії підтримуються, якщо встановлено `sessionArg`.
- Передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.heartbeat`

Періодичні запуски heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m вимикає
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // за замовчуванням: false; true залишає лише HEARTBEAT.md із bootstrap-файлів workspace
        isolatedSession: false, // за замовчуванням: false; true запускає кожен heartbeat у новій сесії (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (за замовчуванням) | block
        target: "none", // за замовчуванням: none | варіанти: last | whatsapp | telegram | discord | ...
        prompt: "Прочитай HEARTBEAT.md, якщо він існує...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). За замовчуванням: `30m` (автентифікація через API key) або `1h` (OAuth). Встановіть `0m`, щоб вимкнути.
- `suppressToolErrorWarnings`: якщо true, пригнічує payload-и попереджень про помилки інструментів під час запусків heartbeat.
- `directPolicy`: політика доставки напряму/в особисті повідомлення. `allow` (за замовчуванням) дозволяє доставку напряму. `block` пригнічує доставку напряму й видає `reason=dm-blocked`.
- `lightContext`: якщо true, запуски heartbeat використовують полегшений bootstrap-контекст і залишають лише `HEARTBEAT.md` із bootstrap-файлів workspace.
- `isolatedSession`: якщо true, кожен запуск heartbeat відбувається в новій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у cron `sessionTarget: "isolated"`. Зменшує вартість токенів на heartbeat приблизно зі ~100K до ~2-5K токенів.
- Для окремого агента: встановіть `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, heartbeat запускаються **лише для цих агентів**.
- Heartbeat виконують повні ходи агента — коротші інтервали спалюють більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Точно зберігай deployment ID, ticket ID і пари host:port.", // використовується, коли identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторну вставку
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для compaction
        notifyUser: true, // надіслати коротке повідомлення користувачу, коли починається compaction (за замовчуванням: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Сесія наближається до compaction. Збережи сталі спогади зараз.",
          prompt: "Запиши будь-які довготривалі нотатки в memory/YYYY-MM-DD.md; відповідай точним мовчазним токеном NO_REPLY, якщо немає чого зберігати.",
        },
      },
    },
  },
}
```

- `mode`: `default` або `safeguard` (підсумовування великих історій частинами). Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції compaction, перш ніж OpenClaw її перерве. За замовчуванням: `900`.
- `identifierPolicy`: `strict` (за замовчуванням), `off` або `custom`. `strict` додає вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування в compaction.
- `identifierInstructions`: необов’язковий користувацький текст про збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторної вставки після compaction. За замовчуванням `["Session Startup", "Red Lines"]`; встановіть `[]`, щоб вимкнути повторну вставку. Якщо не встановлено або явно встановлено цю пару за замовчуванням, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування compaction. Використовуйте це, коли основна сесія має залишатися на одній моделі, а підсумки compaction мають створюватися на іншій; якщо не встановлено, compaction використовує основну модель сесії.
- `notifyUser`: коли `true`, надсилає користувачу коротке повідомлення, коли починається compaction (наприклад, "Compacting context..."). За замовчуванням вимкнено, щоб compaction відбувався безшумно.
- `memoryFlush`: тихий агентний хід перед автоматичним compaction для збереження довготривалих спогадів. Пропускається, коли workspace лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // тривалість (ms/s/m/h), одиниця за замовчуванням: хвилини
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Вміст старого результату інструмента очищено]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Поведінка режиму cache-ttl">

- `mode: "cache-ttl"` вмикає проходи обрізання.
- `ttl` контролює, як часто обрізання може запускатися знову (після останнього торкання кешу).
- Спочатку обрізання м’яко скорочує завеликі результати інструментів, а потім, якщо потрібно, жорстко очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок і кінець та вставляє `...` посередині.

**Жорстке очищення** замінює весь результат інструмента на заповнювач.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точних підрахунках токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень помічника, обрізання пропускається.

</Accordion>

Докладніше про поведінку див. [Обрізання сесій](/uk/concepts/session-pruning).

### Блокова потокова передача

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (використовуйте minMs/maxMs)
    },
  },
}
```

- Для каналів, окрім Telegram, потрібне явне `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення для каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Signal/Slack/Discord/Google Chat за замовчуванням використовують `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Докладніше про поведінку та розбиття на фрагменти див. [Streaming](/uk/concepts/streaming).

### Індикатори набору

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- За замовчуванням: `instant` для особистих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори набору](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкове sandbox-ізолювання для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Також підтримуються SecretRef / вбудований вміст:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Деталі sandbox">

**Backend:**

- `docker`: локальний Docker runtime (за замовчуванням)
- `ssh`: загальний віддалений runtime через SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для runtime, переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація backend-а SSH:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (за замовчуванням: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для workspace за областями
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, які OpenClaw матеріалізує у тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data`, підкріплені SecretRef, розв’язуються з активного знімка runtime секретів до початку sandbox-сесії

**Поведінка backend-а SSH:**

- один раз ініціалізує віддалений workspace після створення або повторного створення
- потім підтримує віддалений SSH-workspace як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи до медіа через SSH
- не синхронізує автоматично віддалені зміни назад на хост
- не підтримує browser-контейнери в sandbox

**Доступ до workspace:**

- `none`: workspace sandbox за областями під `~/.openclaw/sandboxes`
- `ro`: workspace sandbox у `/workspace`, workspace агента монтується лише для читання в `/agent`
- `rw`: workspace агента монтується для читання/запису в `/workspace`

**Scope:**

- `session`: окремий контейнер + workspace для кожної сесії
- `agent`: один контейнер + workspace на агента (за замовчуванням)
- `shared`: спільний контейнер і workspace (без ізоляції між сесіями)

**Конфігурація plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // необов’язково
          gatewayEndpoint: "https://lab.example", // необов’язково
          policy: "strict", // необов’язковий policy id OpenShell
          providers: ["openai"], // необов’язково
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: ініціалізувати віддалене середовище з локального перед exec, синхронізувати назад після exec; локальний workspace залишається канонічним
- `remote`: один раз ініціалізувати віддалене середовище під час створення sandbox, а потім підтримувати віддалений workspace як канонічний

У режимі `remote` локальні редагування на хості, зроблені поза OpenClaw, не синхронізуються автоматично в sandbox після етапу ініціалізації.
Транспортом є SSH до sandbox OpenShell, але plugin керує життєвим циклом sandbox і необов’язковою mirror-синхронізацією.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потрібні вихід у мережу, записуваний root і користувач root.

**Контейнери за замовчуванням використовують `network: "none"`** — встановіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихід у мережу.
`"host"` заблоковано. `"container:<id>"` заблоковано за замовчуванням, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному workspace.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні та прив’язані до агента bind-и об’єднуються.

**Браузер у sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний prompt. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача noVNC за замовчуванням використовує VNC-автентифікацію, а OpenClaw видає URL із короткоживучим токеном (замість того, щоб показувати пароль у спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує націлювання sandbox-сесій на браузер хоста.
- `network` за замовчуванням дорівнює `openclaw-sandbox-browser` (виділена bridge-мережа). Встановлюйте `bridge` лише тоді, коли вам явно потрібна глобальна bridge-зв’язність.
- `cdpSourceRange` за бажанням обмежує вхід CDP на межі контейнера CIDR-діапазоном (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише до контейнера браузера sandbox. Якщо встановлено (включно з `[]`), це замінює `docker.binds` для контейнера браузера.
- Параметри запуску за замовчуванням визначені в `scripts/sandbox-browser-entrypoint.sh` і налаштовані для хостів контейнерів:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (за замовчуванням увімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    увімкнені за замовчуванням і можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо для WebGL/3D це потрібно.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає extensions, якщо ваш робочий процес
    від них залежить.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; встановіть `0`, щоб використати
    стандартне обмеження процесів Chromium.
  - плюс `--no-sandbox` і `--disable-setuid-sandbox`, коли увімкнено `noSandbox`.
  - Значення за замовчуванням — це базова конфігурація образу контейнера; використовуйте власний образ браузера з власною
    entrypoint, щоб змінити поведінку контейнера за замовчуванням.

</Accordion>

Browser sandboxing і `sandbox.docker.binds` наразі доступні лише для Docker.

Зібрати образи:

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов’язковий образ браузера
```

### `agents.list` (перевизначення для окремого агента)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Головний агент",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // або { primary, fallbacks }
        thinkingDefault: "high", // перевизначення рівня thinking для окремого агента
        reasoningDefault: "on", // перевизначення видимості reasoning для окремого агента
        fastModeDefault: false, // перевизначення fast mode для окремого агента
        params: { cacheRetention: "none" }, // перевизначає params відповідного defaults.models за ключами
        skills: ["docs-search"], // замінює agents.defaults.skills, якщо встановлено
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: стабільний ідентифікатор агента (обов’язково).
- `default`: якщо встановлено кілька, перший має пріоритет (реєструється попередження). Якщо не встановлено жодного, значенням за замовчуванням є перший запис у списку.
- `model`: рядкова форма перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні резервні моделі). Cron-задачі, що перевизначають лише `primary`, усе ще успадковують резервні значення за замовчуванням, якщо не встановити `fallbacks: []`.
- `params`: параметри потоку для окремого агента, які об’єднуються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для перевизначень на рівні агента, наприклад `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, коли його встановлено; явний список замінює значення за замовчуванням замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий рівень thinking за замовчуванням для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, якщо не встановлено перевизначення для окремого повідомлення чи сесії.
- `reasoningDefault`: необов’язкове значення видимості reasoning за замовчуванням для окремого агента (`on | off | stream`). Застосовується, коли не встановлено перевизначення reasoning для окремого повідомлення чи сесії.
- `fastModeDefault`: необов’язкове значення fast mode за замовчуванням для окремого агента (`true | false`). Застосовується, коли не встановлено перевизначення fast mode для окремого повідомлення чи сесії.
- `runtime`: необов’язковий дескриптор runtime для окремого агента. Використовуйте `type: "acp"` із типовыми параметрами `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має за замовчуванням використовувати сесії ACP harness.
- `identity.avatar`: шлях відносно workspace, URL `http(s)` або `data:` URI.
- `identity` виводить значення за замовчуванням: `ackReaction` із `emoji`, `mentionPatterns` із `name`/`emoji`.
- `subagents.allowAgents`: список дозволених agent id для `sessions_spawn` (`["*"]` = будь-який; за замовчуванням: лише той самий агент).
- Захист успадкування sandbox: якщо сесія запитувача працює в sandbox, `sessions_spawn` відхиляє цілі, які працювали б без sandbox.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, у яких не вказано `agentId` (примушує до явного вибору профілю; за замовчуванням: false).

---

## Маршрутизація між кількома агентами

Запускайте кілька ізольованих агентів в одному Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Поля збігу прив’язок

- `type` (необов’язково): `route` для звичайної маршрутизації (якщо тип відсутній, використовується route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; якщо пропущено = обліковий запис за замовчуванням)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок збігів:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Агент за замовчуванням

У межах кожного рівня перший запис `bindings`, що збігається, має пріоритет.

Для записів `type: "acp"` OpenClaw визначає збіг за точною ідентичністю розмови (`match.channel` + account + `match.peer.id`) і не використовує наведений вище порядок рівнів route-binding.

### Профілі доступу для окремих агентів

<Accordion title="Повний доступ (без sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Інструменти лише для читання + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Без доступу до файлової системи (лише обмін повідомленнями)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Докладніше про пріоритети див. [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

---

## Сесія

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // пропустити розгалуження від батьківської гілки вище цього ліміту токенів (0 вимикає)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // тривалість або false
      maxDiskBytes: "500mb", // необов’язковий жорсткий бюджет
      highWaterBytes: "400mb", // необов’язкова ціль очищення
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // типове автоматичне зняття фокусу через неактивність у годинах (`0` вимикає)
      maxAgeHours: 0, // типовий жорсткий максимальний вік у годинах (`0` вимикає)
    },
    mainKey: "main", // застаріле (runtime завжди використовує "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Деталі полів сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групових чатів.
  - `per-sender` (за замовчуванням): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники контексту каналу спільно використовують одну сесію (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються особисті повідомлення.
  - `main`: усі особисті повідомлення використовують основну сесію.
  - `per-peer`: ізолювати за sender id між каналами.
  - `per-channel-peer`: ізолювати за каналом + відправником (рекомендовано для inbox-ів із багатьма користувачами).
  - `per-account-channel-peer`: ізолювати за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: мапа канонічних id до peer-ів із префіксом провайдера для спільного використання сесій між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, спрацьовує той, у кого строк закінчується раніше.
- **`resetByType`**: перевизначення за типами (`direct`, `group`, `thread`). Застарілий `dm` приймається як псевдонім для `direct`.
- **`parentForkMaxTokens`**: максимальний `totalTokens` батьківської сесії, дозволений під час створення розгалуженої thread-сесії (за замовчуванням `100000`).
  - Якщо `totalTokens` батьківської сесії перевищує це значення, OpenClaw запускає нову thread-сесію замість успадкування історії transcript-а батьківської сесії.
  - Встановіть `0`, щоб вимкнути цей захист і завжди дозволяти розгалуження від батьківської сесії.
- **`mainKey`**: застаріле поле. Runtime тепер завжди використовує `"main"` для основного bucket-а особистого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість відповідей туди-назад між агентами під час обміну агент-агент (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжки ping-pong.
- **`sendPolicy`**: збіг за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перший deny має пріоритет.
- **`maintenance`**: очищення сховища сесій + керування зберіганням.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: граничний вік для застарілих записів (за замовчуванням `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (за замовчуванням `500`).
  - `rotateBytes`: ротує `sessions.json`, коли його розмір перевищує це значення (за замовчуванням `10mb`).
  - `resetArchiveRetention`: строк зберігання архівів transcript-а `*.reset.<timestamp>`. За замовчуванням дорівнює `pruneAfter`; встановіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий бюджет диска для каталогу сесій. У режимі `warn` лише реєструє попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. За замовчуванням дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні значення за замовчуванням для функцій сесій, прив’язаних до гілок.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначити; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокусу через неактивність у годинах (`0` вимикає; провайдери можуть перевизначити)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначити)

</Accordion>

---

## Повідомлення

```json5
{
  messages: {
    responsePrefix: "🦞", // або "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 вимикає
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Префікс відповіді

Перевизначення для каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Розв’язання (найспецифічніше має пріоритет): account → channel → global. `""` вимикає й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                   | Приклад                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі   | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера       | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking | `high`, `low`, `off`      |
| `{identity.name}` | Ім’я ідентичності агента | (те саме, що й `"auto"`)  |

Змінні нечутливі до регістру. `{think}` — псевдонім для `{thinkingLevel}`.

### Реакція підтвердження

- За замовчуванням береться з `identity.emoji` активного агента, інакше `"👀"`. Встановіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок розв’язання: account → channel → `messages.ackReaction` → резервне значення з identity.
- Scope: `group-mentions` (за замовчуванням), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє ack після відповіді у Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу у Slack, Discord і Telegram.
  У Slack і Discord, якщо не встановлено, статусні реакції залишаються увімкненими, коли активні ack-реакції.
  У Telegram встановіть це явно в `true`, щоб увімкнути реакції статусу життєвого циклу.

### Вхідний debounce

Групує швидкі текстові повідомлення від одного відправника в один хід агента. Медіа/вкладення скидаються негайно. Керівні команди обходять debounce.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` керує автоматичним TTS. `/tts off|always|inbound|tagged` перевизначає це для сесії.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням дорівнює `false` (потрібне явне ввімкнення).
- API key резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- `openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок розв’язання: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `openai.baseUrl` вказує на endpoint, відмінний від OpenAI, OpenClaw розглядає його як OpenAI-сумісний TTS-сервер і послаблює перевірку model/voice.

---

## Talk

Значення за замовчуванням для режиму Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька Talk-провайдерів.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності й автоматично мігруються до `talk.providers.<provider>`.
- Voice ID резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає прості текстові рядки або об’єкти SecretRef.
- Резервний `ELEVENLABS_API_KEY` застосовується лише тоді, коли API key Talk не налаштовано.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні назви.
- `silenceTimeoutMs` керує тим, скільки режим Talk чекає після тиші користувача, перш ніж надіслати transcript. Якщо не встановлено, зберігається типове вікно паузи платформи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Інструменти

### Профілі інструментів

`tools.profile` задає базовий список дозволених перед `tools.allow`/`tools.deny`:

Під час локального onboarding нові локальні конфігурації за замовчуванням отримують `tools.profile: "coding"`, якщо це поле не встановлено (наявні явні профілі зберігаються).

| Профіль     | Містить                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Без обмежень (те саме, що не встановлено)                                                                                       |

### Групи інструментів

| Група              | Інструменти                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як псевдонім для `exec`)                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                   |
| `group:automation` | `cron`, `gateway`                                                                                                     |
| `group:messaging`  | `message`                                                                                                             |
| `group:nodes`      | `nodes`                                                                                                               |
| `group:agents`     | `agents_list`                                                                                                         |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                    |
| `group:openclaw`   | Усі вбудовані інструменти (без plugin-провайдерів)                                                                    |

### `tools.allow` / `tools.deny`

Глобальна політика allow/deny для інструментів (deny має пріоритет). Нечутлива до регістру, підтримує wildcard `*`. Застосовується навіть тоді, коли Docker sandbox вимкнено.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Додатково обмежує інструменти для певних провайдерів або моделей. Порядок: базовий профіль → профіль провайдера → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Керує підвищеним доступом exec поза sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Перевизначення для окремого агента (`agents.list[].tools.elevated`) може лише додатково обмежувати.
- `/elevated on|off|ask|full` зберігає стан для кожної сесії; вбудовані директиви застосовуються лише до одного повідомлення.
- Підвищений `exec` обходить sandboxing і використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціллю exec є `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Перевірки безпеки циклів інструментів **вимкнено за замовчуванням**. Установіть `enabled: true`, щоб увімкнути виявлення.
Параметри можна визначати глобально в `tools.loopDetection` і перевизначати для окремого агента через `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: максимальна історія викликів інструментів, що зберігається для аналізу циклів.
- `warningThreshold`: поріг повторюваного шаблону без прогресу для попереджень.
- `criticalThreshold`: вищий поріг повторення для блокування критичних циклів.
- `globalCircuitBreakerThreshold`: поріг жорсткої зупинки для будь-якого запуску без прогресу.
- `detectors.genericRepeat`: попереджати про повторні виклики того самого інструмента з тими самими аргументами.
- `detectors.knownPollNoProgress`: попереджати/блокувати для відомих poll-інструментів (`process.poll`, `command_status` тощо).
- `detectors.pingPong`: попереджати/блокувати для чергувальних парних шаблонів без прогресу.
- Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, перевірка валідації не проходить.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // або змінна середовища BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // необов’язково; пропустіть для автоматичного виявлення
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Налаштовує розуміння вхідних медіа (зображення/аудіо/відео):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // увімкнення за згодою: надсилати завершені асинхронні music/video безпосередньо в канал
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Поля запису media model">

**Запис провайдера** (`type: "provider"` або пропущено):

- `provider`: id API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
- `model`: перевизначення model id
- `profile` / `preferredProfile`: вибір профілю `auth-profiles.json`

**Запис CLI** (`type: "cli"`):

- `command`: виконуваний файл
- `args`: шаблонізовані аргументи (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

**Спільні поля:**

- `capabilities`: необов’язковий список (`image`, `audio`, `video`). За замовчуванням: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
- У разі збою використовується наступний запис.

Автентифікація провайдера дотримується стандартного порядку: `auth-profiles.json` → змінні середовища → `models.providers.*.apiKey`.

**Поля асинхронного завершення:**

- `asyncCompletion.directSend`: коли `true`, завершені асинхронні завдання `music_generate`
  і `video_generate` спочатку намагаються доставити результат безпосередньо в канал. За замовчуванням: `false`
  (застарілий шлях пробудження сесії запитувача/доставки моделі).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Керує тим, на які сесії можуть бути націлені інструменти сесій (`sessions_list`, `sessions_history`, `sessions_send`).

За замовчуванням: `tree` (поточна сесія + сесії, породжені нею, наприклад субагенти).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Примітки:

- `self`: лише поточний ключ сесії.
- `tree`: поточна сесія + сесії, породжені поточною сесією (субагенти).
- `agent`: будь-яка сесія, що належить поточному agent id (може включати інших користувачів, якщо ви запускаєте сесії per-sender під тим самим agent id).
- `all`: будь-яка сесія. Націлювання між агентами все одно потребує `tools.agentToAgent`.
- Обмеження sandbox: коли поточна сесія працює в sandbox і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово встановлюється в `tree`, навіть якщо `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Керує підтримкою вбудованих вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // увімкнення за згодою: встановіть true, щоб дозволити вбудовані файлові вкладення
        maxTotalBytes: 5242880, // 5 MB загалом для всіх файлів
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB на файл
        retainOnSessionKeep: false, // зберігати вкладення, коли cleanup="keep"
      },
    },
  },
}
```

Примітки:

- Вкладення підтримуються лише для `runtime: "subagent"`. Runtime ACP відхиляє їх.
- Файли матеріалізуються в дочірньому workspace за шляхом `.openclaw/attachments/<uuid>/` із `.manifest.json`.
- Вміст вкладень автоматично редагується під час збереження transcript-а.
- Входи base64 перевіряються суворою перевіркою алфавіту/паддінгу і захистом від завеликого розміру до декодування.
- Права доступу до файлів: `0700` для каталогів і `0600` для файлів.
- Очищення слідує політиці `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише тоді, коли `retainOnSessionKeep: true`.

### `tools.experimental`

Експериментальні прапорці для вбудованих інструментів. За замовчуванням вимкнено, якщо не застосовується правило автоматичного ввімкнення, залежне від runtime.

```json5
{
  tools: {
    experimental: {
      planTool: true, // увімкнути експериментальний update_plan
    },
  },
}
```

Примітки:

- `planTool`: вмикає структурований інструмент `update_plan` для відстеження нетривіальної багатокрокової роботи.
- За замовчуванням: `false` для не-OpenAI провайдерів. Запуски OpenAI та OpenAI Codex вмикають його автоматично.
- Коли увімкнено, системний prompt також додає вказівки щодо використання, щоб модель застосовувала його лише для суттєвої роботи та тримала не більш як один крок у стані `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: модель за замовчуванням для породжених субагентів. Якщо не вказано, субагенти успадковують модель викликача.
- `allowAgents`: список дозволених цільових agent id за замовчуванням для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; за замовчуванням: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли виклик інструмента не містить `runTimeoutSeconds`. `0` означає відсутність тайм-ауту.
- Політика інструментів для субагентів: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Користувацькі провайдери та base URL

OpenClaw використовує вбудований каталог моделей. Додайте користувацьких провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (за замовчуванням) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Використовуйте `authHeader: true` + `headers` для нестандартних потреб автентифікації.
- Перевизначте корінь конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий псевдонім змінної середовища).
- Пріоритет об’єднання для однакових provider ID:
  - Непорожні значення `baseUrl` з agent `models.json` мають пріоритет.
  - Непорожні значення `apiKey` агента мають пріоритет лише тоді, коли цей провайдер не керується через SecretRef у поточному контексті config/auth-profile.
  - Значення `apiKey` провайдера, керовані через SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env refs, `secretref-managed` для file/exec refs) замість збереження розв’язаних секретів.
  - Значення заголовків провайдера, керовані через SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env refs, `secretref-managed` для file/exec refs).
  - Порожні або відсутні `apiKey`/`baseUrl` агента повертаються до `models.providers` у конфігурації.
  - Для однакових моделей `contextWindow`/`maxTokens` використовують вище значення між явною конфігурацією та неявними значеннями каталогу.
  - Для однакових моделей `contextTokens` зберігає явну межу runtime, якщо вона є; використовуйте це для обмеження ефективного контексту без зміни нативних метаданих моделі.
  - Використовуйте `models.mode: "replace"`, якщо хочете, щоб конфігурація повністю переписала `models.json`.
  - Збереження маркерів є авторитетним щодо джерела: маркери записуються з активного знімка конфігурації джерела (до розв’язання), а не з розв’язаних значень runtime-секретів.

### Деталі полів провайдера

- `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
- `models.providers`: мапа користувацьких провайдерів, ключована за provider id.
- `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
- `models.providers.*.apiKey`: облікові дані провайдера (бажано через SecretRef/env substitution).
- `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions`, вставляти `options.num_ctx` у запити (за замовчуванням: `true`).
- `models.providers.*.authHeader`: примусово передавати облікові дані в заголовку `Authorization`, якщо це потрібно.
- `models.providers.*.baseUrl`: базова URL-адреса upstream API.
- `models.providers.*.headers`: додаткові статичні заголовки для proxy/tenant routing.
- `models.providers.*.request`: перевизначення транспорту для HTTP-запитів model-provider.
  - `request.headers`: додаткові заголовки (об’єднуються зі значеннями провайдера за замовчуванням). Значення підтримують SecretRef.
  - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію провайдера), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов’язковим `prefix`).
  - `request.proxy`: перевизначення HTTP-проксі. Режими: `"env-proxy"` (використовувати змінні середовища `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими підтримують необов’язковий підоб’єкт `tls`.
  - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі підтримують SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: явні записи каталогу моделей провайдера.
- `models.providers.*.models.*.contextWindow`: метадані нативного context window моделі.
- `models.providers.*.models.*.contextTokens`: необов’язкова runtime-межа контексту. Використовуйте це, якщо хочете менший ефективний бюджет контексту, ніж нативний `contextWindow` моделі.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` із непорожнім не-нативним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це в `false` під час runtime. Порожній/пропущений `baseUrl` зберігає типову поведінку OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для string-only OpenAI-сумісних chat-endpoint-ів. Коли `true`, OpenClaw сплющує чисто текстові масиви `messages[].content` у звичайні рядки перед надсиланням запиту.
- `plugins.entries.amazon-bedrock.config.discovery`: кореневий розділ налаштувань автоматичного виявлення Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр provider-id для цільового виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне context window для виявлених моделей.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервне максимальне число вихідних токенів для виявлених моделей.

### Приклади провайдерів

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Використовуйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` — для Z.AI напряму.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Установіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або `opencode-go/...` для каталогу Go. Скорочення: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Установіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` — прийнятні псевдоніми. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

- Загальний endpoint: `https://api.z.ai/api/paas/v4`
- Endpoint для кодування (за замовчуванням): `https://api.z.ai/api/coding/paas/v4`
- Для загального endpoint визначте користувацького провайдера з перевизначенням base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Для endpoint-а в Китаї: `baseUrl: "https://api.moonshot.cn/v1"` або `openclaw onboard --auth-choice moonshot-api-key-cn`.

Нативні endpoint-и Moonshot оголошують сумісність із потоковим використанням на спільному
транспорті `open