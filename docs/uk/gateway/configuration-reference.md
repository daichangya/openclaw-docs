---
read_when:
    - Вам потрібні точні семантики полів конфігурації або типові значення
    - Ви перевіряєте блоки конфігурації channel, model, Gateway або tool
summary: Довідка з конфігурації Gateway для основних ключів OpenClaw, типових значень і посилань на окремі довідки підсистем
title: Довідка з конфігурації
x-i18n:
    generated_at: "2026-04-23T06:44:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75c7e0d88ea6eacb8a2dd41f83033da853130dc2a689950c1a188d7c4ca8f977
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Довідка з конфігурації

Основна довідка з конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Configuration](/uk/gateway/configuration).

Ця сторінка охоплює основні поверхні конфігурації OpenClaw і надає посилання назовні, коли підсистема має власну детальнішу довідку. Вона **не** намагається вбудувати на одну сторінку кожен каталог команд, що належить channel/plugin, або кожен глибокий параметр memory/QMD.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, із вбудованими метаданими plugin/channel, об’єднаними там, де вони доступні
- `config.schema.lookup` повертає один вузол схеми з обмеженням за шляхом для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий hash документації конфігурації відносно поточної поверхні схеми

Окремі детальні довідки:

- [Довідка з конфігурації Memory](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/uk/tools/slash-commands) для поточного каталогу вбудованих + комплектних команд
- сторінки channel/plugin-власників для поверхонь команд, специфічних для каналів

Формат конфігурації — **JSON5** (дозволено коментарі та кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні типові значення, якщо їх пропущено.

---

## Channels

Кожен channel запускається автоматично, коли існує його секція конфігурації (якщо не задано `enabled: false`).

### Доступ до DM і груп

Усі channels підтримують політики DM і політики груп:

| Політика DM         | Поведінка                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код pairing; власник має підтвердити |
| `allowlist`         | Лише відправники з `allowFrom` (або зі сховища дозволів pairing) |
| `open`              | Дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)           |
| `disabled`          | Ігнорувати всі вхідні DM                                        |

| Політика групи        | Поведінка                                              |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (типово)  | Лише групи, що відповідають налаштованому allowlist    |
| `open`                | Обійти allowlist груп (обмеження згадками все одно діє) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                 |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Коди pairing спливають через 1 годину. Кількість очікувальних запитів на pairing DM обмежена **3 на channel**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп у runtime повертається до `allowlist` (fail-closed) із попередженням під час запуску.
</Note>

### Перевизначення моделей для каналів

Використовуйте `channels.modelByChannel`, щоб закріпити конкретні ID каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Це зіставлення channel застосовується, коли сесія ще не має перевизначення моделі (наприклад, заданого через `/model`).

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

### Типові значення channel і Heartbeat

Використовуйте `channels.defaults` для спільної поведінки group-policy і Heartbeat між провайдерами:

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
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх channels. Значення: `all` (типово, включати весь контекст цитат/потоків/історії), `allowlist` (включати контекст лише від відправників із allowlist), `allowlist_quote` (так само, як allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для окремого каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати здорові стани channel у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати деградовані/помилкові стани у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через web channel Gateway (Baileys Web). Він запускається автоматично, коли існує прив’язана сесія.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // сині галочки (false у режимі self-chat)
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

- Вихідні команди типово використовують обліковий запис `default`, якщо він існує; інакше — перший налаштований id облікового запису (відсортований).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового облікового запису, якщо він відповідає id налаштованого облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису мігрується командою `openclaw doctor` у `whatsapp/default`.
- Перевизначення для окремого облікового запису: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (типово: off; вмикайте явно, щоб уникнути rate limit редагування попереднього перегляду)
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються), із резервним `TELEGRAM_BOT_TOKEN` для типового облікового запису.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає id налаштованого облікового запису.
- У багатооблікових конфігураціях (2+ id облікових записів) задайте явний типoвий обліковий запис (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, якщо його немає або він некоректний.
- `configWrites: false` блокує ініційовані з Telegram записи конфігурації (міграції ID supergroup, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Попередній перегляд потокової передачі в Telegram використовує `sendMessage` + `editMessageText` (працює в особистих і групових чатах).
- Політика повторних спроб: див. [Retry policy](/uk/concepts/retry).

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
              systemPrompt: "Short answers only.",
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
        spawnSubagentSessions: false, // opt-in для sessions_spawn({ thread: true })
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

- Токен: `channels.discord.token`, із резервним `DISCORD_BOT_TOKEN` для типового облікового запису.
- Прямі вихідні виклики, які передають явний Discord `token`, використовують цей токен для виклику; параметри повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає id налаштованого облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) як цілі доставки; прості числові ID відхиляються.
- Slug-и guild мають нижній регістр, а пробіли замінюються на `-`; ключі каналів використовують slug-ім’я (без `#`). Надавайте перевагу ID guild.
- Повідомлення, створені ботом, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно відфільтровуються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналу) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `maxLinesPerMessage` (типово 17) розбиває довгі за висотою повідомлення, навіть якщо вони коротші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією, прив’язаною до потоків Discord:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до потоків (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: перемикач opt-in для автоматичного створення/прив’язки потоку через `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив’язки для каналів і потоків (використовуйте id каналу/потоку в `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів Discord components v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення auto-join + TTS.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` напряму передаються в параметри DAVE `@discordjs/voice` (типово `true` і `24`).
- OpenClaw додатково намагається відновити прийом голосу, виходячи й повторно приєднуючись до голосової сесії після повторних збоїв дешифрування.
- `channels.discord.streaming` — це канонічний ключ режиму потоку. Застарілі значення `streamMode` і булеві `streaming` автоматично мігруються.
- `channels.discord.autoPresence` зіставляє доступність runtime із присутністю бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінними іменами/tag (режим сумісності break-glass).
- `channels.discord.execApprovals`: нативна для Discord доставка погоджень exec і авторизація погоджувачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto погодження exec активуються, коли погоджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено погоджувати запити exec. Якщо не вказано, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Якщо пропустити, погодження пересилатимуться для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на погодження. `"dm"` (типово) надсилає в DM погоджувачів, `"channel"` надсилає в початковий канал, `"both"` надсилає в обидва місця. Якщо target включає `"channel"`, кнопки можуть використовувати лише визначені погоджувачі.
  - `cleanupAfterResolve`: якщо `true`, видаляє DM погодження після погодження, відхилення або тайм-ауту.

**Режими сповіщень про реакції:** `off` (немає), `own` (повідомлення бота, типово), `all` (усі повідомлення), `allowlist` (із `guilds.<id>.users` для всіх повідомлень).

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

- JSON облікового запису служби: вбудований (`serviceAccount`) або на основі файла (`serviceAccountFile`).
- Також підтримується SecretRef облікового запису служби (`serviceAccountRef`).
- Резервні змінні середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` як цілі доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінним email principal (режим сумісності break-glass).

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
          systemPrompt: "Short answers only.",
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // використовувати нативний API потокової передачі Slack, коли mode=partial
      },
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

- **Режим socket** вимагає і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` як резервні змінні середовища для типового облікового запису).
- **Режим HTTP** вимагає `botToken` плюс `signingSecret` (у корені або для окремого облікового запису).
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack показують поля джерела/статусу для кожного облікового даного, наприклад
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у режимі HTTP,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях команди/runtime не зміг
  визначити значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані зі Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає id налаштованого облікового запису.
- `channels.slack.streaming.mode` — канонічний ключ режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним транспортом потокової передачі Slack. Застарілі значення `streamMode`, булеві `streaming` і `nativeStreaming` автоматично мігруються.
- Використовуйте `user:<id>` (DM) або `channel:<id>` як цілі доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (із `reactionAllowlist`).

**Ізоляція сесій потоків:** `thread.historyScope` — для окремого потоку (типово) або спільно для каналу. `thread.inheritParent` копіює стенограму батьківського каналу в нові потоки.

- Нативна потокова передача Slack разом із статусом потоку Slack у стилі помічника "is typing..." вимагають цілі відповіді в потоці. DM верхнього рівня типово залишаються поза потоком, тому вони використовують `typingReaction` або звичайну доставку замість попереднього перегляду в стилі потоку.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім видаляє її після завершення. Використовуйте shortcode emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка погоджень exec і авторизація погоджувачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій    | Типово    | Примітки                 |
| ------------ | --------- | ------------------------ |
| reactions    | увімкнено | Реакції + список реакцій |
| messages     | увімкнено | Читання/надсилання/редагування/видалення |
| pins         | увімкнено | Закріпити/відкріпити/список |
| memberInfo   | увімкнено | Інформація про учасника  |
| emojiList    | увімкнено | Список власних emoji     |

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
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Необов’язкова явна URL-адреса для розгортань через reverse-proxy/публічний доступ
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Режими чату: `oncall` (відповідати на @згадку, типово), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса тригера).

Коли власні команди Mattermost увімкнені:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має визначатися до endpoint Gateway OpenClaw і бути доступною із сервера Mattermost.
- Callback-и власних slash-команд автентифікуються токенами для кожної команди, які повертає
  Mattermost під час реєстрації slash-команд. Якщо реєстрація не вдається або жодна
  команда не активується, OpenClaw відхиляє callback-и з помилкою
  `Unauthorized: invalid command token.`
- Для private/tailnet/internal хостів callback-ів Mattermost може вимагати, щоб
  `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен callback-а.
  Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані з Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення обмеження згадками для окремого каналу (`"*"` як типове значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає id налаштованого облікового запису.

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

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (із `reactionAllowlist`).

- `channels.signal.account`: закріпити запуск channel за конкретною ідентичністю облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити записи конфігурації, ініційовані із Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає id налаштованого облікового запису.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (на основі plugin, налаштовується в `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls і розширені дії:
      // див. /channels/bluebubbles
    },
  },
}
```

- Основні шляхи ключів, охоплені тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає id налаштованого облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних ACP-сесій. Використовуйте handle BlueBubbles або рядок цілі (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Повну конфігурацію каналу BlueBubbles задокументовано в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Демон або порт не потрібні.

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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає id налаштованого облікового запису.

- Потрібен Full Disk Access до Messages DB.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тому переконайтеся, що ключ relay-хоста вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи конфігурації, ініційовані з iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних ACP-сесій. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH-обгортки iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix працює через plugin і налаштовується в `channels.matrix`.

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
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначити його через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє private/internal homeserver. `proxy` і цей opt-in мережі є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у багатооблікових конфігураціях.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені кімнати та нові запрошення у стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативна для Matrix доставка погоджень exec і авторизація погоджувачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto погодження exec активуються, коли погоджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Matrix (наприклад `@owner:example.org`), яким дозволено погоджувати запити exec.
  - `agentFilter`: необов’язковий allowlist ID агентів. Якщо пропустити, погодження пересилатимуться для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на погодження. `"dm"` (типово), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сесії: `per-user` (типово) спільно використовує маршрутизованого peer, тоді як `per-room` ізолює кожну кімнату DM.
- Перевірки статусу Matrix і live directory lookups використовують ту саму політику проксі, що й runtime-трафік.
- Повну конфігурацію Matrix, правила націлювання й приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams працює через plugin і налаштовується в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, політики команди/каналу:
      // див. /channels/msteams
    },
  },
}
```

- Основні шляхи ключів, охоплені тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (облікові дані, webhook, політики DM/груп, перевизначення для окремої команди/каналу) задокументовано в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC працює через plugin і налаштовується в `channels.irc`.

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

- Основні шляхи ключів, охоплені тут: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає id налаштованого облікового запису.
- Повну конфігурацію каналу IRC (host/port/TLS/channels/allowlists/обмеження згадками) задокументовано в [IRC](/uk/channels/irc).

### Багато облікових записів (усі channels)

Запускайте кілька облікових записів для одного channel (кожен із власним `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` використовується, коли `accountId` пропущено (CLI + маршрутизація).
- Токени зі змінних середовища застосовуються лише до **типового** облікового запису.
- Базові налаштування channel застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте нетиповий обліковий запис через `openclaw channels add` (або onboarding каналу), поки все ще використовуєте верхньорівневу конфігурацію каналу для одного облікового запису, OpenClaw спочатку переносить верхньорівневі значення для одного облікового запису, прив’язані до облікового запису, у карту облікових записів каналу, щоб початковий обліковий запис і далі працював. Більшість channels переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише до channel (без `accountId`) і далі відповідатимуть типовому обліковому запису; прив’язки з областю облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи верхньорівневі значення одного облікового запису з областю облікового запису до підвищеного облікового запису, вибраного для цього channel. Більшість channels використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.

### Інші plugin channels

Багато plugin channels налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Див. повний індекс каналів: [Channels](/uk/channels).

### Обмеження згадками в групових чатах

Групові повідомлення типово **вимагають згадки** (метадані згадки або безпечні regex-шаблони). Це застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

**Типи згадок:**

- **Згадки метаданих**: рідні @згадки платформи. Ігноруються в режимі self-chat WhatsApp.
- **Текстові шаблони**: безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Некоректні шаблони та небезпечне вкладене повторення ігноруються.
- Обмеження згадками застосовується лише тоді, коли виявлення можливе (рідні згадки або принаймні один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне типове значення. Channels можуть перевизначити його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Установіть `0`, щоб вимкнути.

#### Обмеження історії DM

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

Порядок визначення: перевизначення для окремого DM → типове значення провайдера → без обмеження (зберігається все).

Підтримується: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Додайте свій номер до `allowFrom`, щоб увімкнути режим self-chat (ігнорує рідні @згадки, відповідає лише на текстові шаблони):

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

### Команди (обробка команд чату)

```json5
{
  commands: {
    native: "auto", // реєструвати рідні команди, коли підтримується
    nativeSkills: "auto", // реєструвати рідні команди Skills, коли підтримується
    text: true, // аналізувати /commands у повідомленнях чату
    bash: false, // дозволити ! (псевдонім: /bash)
    bashForegroundMs: 2000,
    config: false, // дозволити /config
    mcp: false, // дозволити /mcp
    plugins: false, // дозволити /plugins
    debug: false, // дозволити /debug
    restart: true, // дозволити /restart + інструмент перезапуску gateway
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Деталі команд">

- Цей блок налаштовує поверхні команд. Поточний каталог вбудованих + комплектних команд див. у [Slash Commands](/uk/tools/slash-commands).
- Ця сторінка — **довідка з ключів конфігурації**, а не повний каталог команд. Команди, що належать channel/plugin, такі як QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовані на сторінках відповідних channel/plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями, що починаються з `/`.
- `native: "auto"` вмикає рідні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає рідні команди Skills для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для окремого channel: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначуйте реєстрацію рідних команд Skills для окремого channel через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню Telegram-бота.
- `bash: true` вмикає `! <cmd>` для shell хоста. Потрібні `tools.elevated.enabled` і відправник у `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів gateway `chat.send` постійні записи `/config set|unset` також вимагають `operator.admin`; доступний лише для читання `/config show` залишається доступним для звичайних операторських клієнтів з областю запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, яким керує OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення plugin, встановлення та елементів керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` керує мутаціями конфігурації для окремого channel (типово: true).
- Для багатооблікових channels `channels.<provider>.accounts.<id>.configWrites` також керує записами, що націлені на цей обліковий запис (наприклад `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. Типово: `true`.
- `ownerAllowFrom` — це явний owner allowlist для команд/інструментів лише для власника. Він відокремлений від `allowFrom`.
- `ownerDisplay: "hash"` хешує owner id у системному prompt. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Якщо його встановлено, це **єдине** джерело авторизації (channel allowlist/pairing і `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики access-group, коли `allowFrom` не встановлено.
- Карта документації команд:
  - вбудований + комплектний каталог: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд, специфічні для channels: [Channels](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди pairing: [Pairing](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Типові значення агента

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, який показується в рядку Runtime системного prompt. Якщо не задано, OpenClaw автоматично визначає його, підіймаючись вгору від workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий типовий allowlist Skills для агентів, які не задають
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює типові значення
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

- Пропустіть `agents.defaults.skills`, щоб типово не обмежувати Skills.
- Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Установіть `agents.list[].skills: []`, щоб не використовувати Skills.
- Непорожній список `agents.list[].skills` є фінальним набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли workspace вбудовуються в системний prompt. Типове значення: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне вбудовування bootstrap workspace, зменшуючи розмір prompt. Запуски Heartbeat і повторні спроби після Compaction усе одно перебудовують контекст.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів для одного bootstrap-файлу workspace до обрізання. Типове значення: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна сумарна кількість символів, що вбудовуються з усіх bootstrap-файлів workspace. Типове значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізається.
Типове значення: `"once"`.

- `"off"`: ніколи не вбудовувати текст попередження в системний prompt.
- `"once"`: вбудовувати попередження один раз для кожної унікальної сигнатури обрізання (рекомендовано).
- `"always"`: вбудовувати попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта володіння бюджетом контексту

OpenClaw має кілька високонавантажених бюджетів prompt/контексту, і вони
навмисно розділені за підсистемами, а не проходять через один загальний
параметр.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вбудовування bootstrap workspace.
- `agents.defaults.startupContext.*`:
  одноразовий стартовий пролог для `/new` і `/reset`, включно з нещодавніми щоденними
  файлами `memory/*.md`.
- `skills.limits.*`:
  компактний список Skills, вбудований у системний prompt.
- `agents.defaults.contextLimits.*`:
  обмежені runtime-уривки й вбудовані блоки, що належать runtime.
- `memory.qmd.limits.*`:
  розмір уривків і вбудовування для індексованого пошуку в memory.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовим прологом першого ходу, який вбудовується під час запусків із порожнім `/new` і `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Спільні типові значення для обмежених поверхонь runtime-контексту.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: типове обмеження уривка `memory_get` до того, як буде додано
  метадані обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: обмеження активного результату інструмента, яке використовується для збережених результатів і
  відновлення переповнення.
- `postCompactionMaxChars`: обмеження уривка `AGENTS.md`, яке використовується під час вбудовування оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних параметрів `contextLimits`. Пропущені поля успадковуються
з `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Глобальне обмеження для компактного списку Skills, вбудованого в системний prompt. Це
не впливає на читання файлів `SKILL.md` на вимогу.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Перевизначення для окремого агента для бюджету prompt Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Максимальний розмір у пікселях для довшої сторони зображення в блоках зображень transcript/tool перед викликами провайдера.
Типове значення: `1200`.

Нижчі значення зазвичай зменшують використання vision-token і розмір payload запиту для сценаріїв із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного prompt (не для часових міток повідомлень). Якщо не вдається визначити, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному prompt. Типове значення: `auto` (налаштування ОС).

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
        primary: "openai/gpt-image-2",
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
      params: { cacheRetention: "long" }, // глобальні типові параметри провайдера
      embeddedHarness: {
        runtime: "auto", // auto | pi | id зареєстрованого harness, наприклад codex
        fallback: "pi", // pi | none
      },
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
  - Форма рядка задає лише основну модель.
  - Форма об’єкта задає основну модель плюс упорядковані моделі аварійного перемикання.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як конфігурація його vision-моделі.
  - Також використовується для резервної маршрутизації, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею tool/plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-2` для OpenAI Images.
  - Якщо ви вибираєте `provider/model` напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ (наприклад `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` для `openai/*`, `FAL_KEY` для `fal/*`).
  - Якщо параметр пропущено, `image_generate` усе одно може визначити типове значення провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.5+`.
  - Якщо параметр пропущено, `music_generate` усе одно може визначити типове значення провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації музики в порядку provider-id.
  - Якщо ви вибираєте `provider/model` напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо параметр пропущено, `video_generate` усе одно може визначити типове значення провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації відео в порядку provider-id.
  - Якщо ви вибираєте `provider/model` напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість до 10 секунд і параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` та `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо параметр пропущено, інструмент PDF використовує резервно `imageModel`, а потім визначену модель сесії/типову модель.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, яку враховує резервний режим витягування в інструменті `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Типове значення: `"off"`.
- `elevatedDefault`: типовий рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типове значення: `"on"`.
- `model.primary`: формат `provider/model` (наприклад `openai/gpt-5.4`). Якщо ви пропустите провайдера, OpenClaw спочатку спробує alias, потім унікальний збіг exact model id серед налаштованих провайдерів і лише після цього використає типового налаштованого провайдера (застаріла сумісна поведінка, тому краще вказувати явний `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw використовує резервно перший налаштований `provider/model` замість того, щоб показувати застаріле типове значення видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
  - Безпечне редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи. `config set` відхиляє заміни, які прибрали б наявні записи allowlist, якщо ви не передасте `--replace`.
  - Потоки configure/onboarding на рівні провайдера об’єднують вибрані моделі провайдера в цю карту та зберігають уже налаштованих не пов’язаних провайдерів.
- `params`: глобальні типові параметри провайдера, які застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається через `agents.defaults.models["provider/model"].params` (для окремої моделі), а потім `agents.list[].params` (відповідний id агента) перевизначає за ключем. Докладніше див. у [Prompt Caching](/uk/reference/prompt-caching).
- `embeddedHarness`: типова політика низькорівневого runtime вбудованого агента. Використовуйте `runtime: "auto"`, щоб зареєстровані plugin harness заявляли підтримувані моделі, `runtime: "pi"`, щоб примусово використовувати вбудований harness PI, або id зареєстрованого harness, наприклад `runtime: "codex"`. Задайте `fallback: "none"`, щоб вимкнути автоматичний резервний PI.
- Засоби запису конфігурації, які змінюють ці поля (наприклад `/models set`, `/models set-image` і команди додавання/видалення резервних варіантів), зберігають канонічну форму об’єкта і, за можливості, зберігають наявні списки резервних варіантів.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна сесія все одно серіалізована). Типове значення: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` керує тим, який низькорівневий виконавець запускає ходи вбудованого агента.
У більшості розгортань слід залишати типове значення `{ runtime: "auto", fallback: "pi" }`.
Використовуйте це, коли довірений plugin надає нативний harness, наприклад комплектний
harness app-server Codex.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` або id зареєстрованого plugin harness. Комплектний plugin Codex реєструє `codex`.
- `fallback`: `"pi"` або `"none"`. `"pi"` зберігає вбудований harness PI як сумісний резервний варіант, коли жоден plugin harness не вибрано. `"none"` змушує помилково завершуватися у випадку відсутності або непідтримуваного вибору plugin harness замість тихого використання PI. Помилки вибраного plugin harness завжди відображаються безпосередньо.
- Перевизначення через змінні середовища: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` вимикає резервний PI для цього процесу.
- Для розгортань лише з Codex задайте `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` і `embeddedHarness.fallback: "none"`.
- Це керує лише вбудованим chat harness. Генерація медіа, vision, PDF, музика, відео та TTS і далі використовують свої параметри provider/model.

**Скорочені вбудовані alias** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Alias               | Модель                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ваші налаштовані alias завжди мають пріоритет над типовими.

Моделі Z.AI GLM-4.x автоматично вмикають режим thinking, якщо ви не задасте `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокової передачі викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 типово використовується `adaptive` thinking, якщо не задано явний рівень thinking.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як резервний варіант, коли API-провайдери недоступні.

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
- Сесії підтримуються, якщо задано `sessionArg`.
- Передача зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний prompt, зібраний OpenClaw, фіксованим рядком. Задається на типовому рівні (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Незалежні від провайдера overlays prompt, які застосовуються за сімейством моделей. ID моделей сімейства GPT-5 отримують спільний поведінковий контракт між провайдерами; `personality` керує лише шаром дружнього стилю взаємодії.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (типово) і `"on"` вмикають шар дружнього стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений поведінковий контракт GPT-5 залишається ввімкненим.
- Застарілий `plugins.entries.openai.config.personality` і далі зчитується, якщо цей спільний параметр не задано.

### `agents.defaults.heartbeat`

Періодичні запуски Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m вимикає
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // типово: true; false прибирає розділ Heartbeat із системного prompt
        lightContext: false, // типово: false; true залишає лише HEARTBEAT.md із bootstrap-файлів workspace
        isolatedSession: false, // типово: false; true запускає кожен Heartbeat у свіжій сесії (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (типово) | block
        target: "none", // типово: none | варіанти: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). Типове значення: `30m` (автентифікація API-ключем) або `1h` (автентифікація OAuth). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: якщо false, прибирає розділ Heartbeat із системного prompt і пропускає вбудовування `HEARTBEAT.md` у bootstrap-контекст. Типове значення: `true`.
- `suppressToolErrorWarnings`: якщо true, приховує payload попереджень про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента Heartbeat до його переривання. Якщо не задано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/DM. `allow` (типово) дозволяє доставку на прямі цілі. `block` пригнічує доставку на прямі цілі та виводить `reason=dm-blocked`.
- `lightContext`: якщо true, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів workspace.
- `isolatedSession`: якщо true, кожен Heartbeat запускається в новій сесії без попередньої історії розмови. Та сама схема ізоляції, що й для Cron `sessionTarget: "isolated"`. Зменшує вартість токенів для одного Heartbeat приблизно зі ~100K до ~2-5K токенів.
- Для окремого агента: задайте `agents.list[].heartbeat`. Якщо будь-який агент визначає `heartbeat`, Heartbeat запускаються **лише для цих агентів**.
- Heartbeat виконують повні ходи агента — коротші інтервали спалюють більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id зареєстрованого plugin провайдера Compaction (необов’язково)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // використовується, коли identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторне вбудовування
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для Compaction
        notifyUser: true, // надсилати короткі сповіщення, коли Compaction починається та завершується (типово: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` або `safeguard` (підсумовування великих історій частинами). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого plugin провайдера Compaction. Якщо задано, замість вбудованого підсумовування LLM викликається `summarize()` цього провайдера. У разі помилки повертається до вбудованого механізму. Задання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, після чого OpenClaw її перериває. Типове значення: `900`.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає вбудовані вказівки зі збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст для збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `postCompactionSections`: необов’язкові назви секцій H2/H3 з `AGENTS.md`, які повторно вбудовуються після Compaction. Типово `["Session Startup", "Red Lines"]`; задайте `[]`, щоб вимкнути повторне вбудовування. Якщо не задано або явно встановлено цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, якщо основна сесія має залишатися на одній моделі, а підсумки Compaction повинні виконуватися на іншій; якщо не задано, Compaction використовує основну модель сесії.
- `notifyUser`: якщо `true`, надсилає користувачеві короткі сповіщення, коли Compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction працював безшумно.
- `memoryFlush`: тихий хід агента перед автоматичним Compaction для збереження довготривалих записів у memory. Пропускається, якщо workspace доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** з контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

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
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Поведінка режиму cache-ttl">

- `mode: "cache-ttl"` вмикає проходи обрізання.
- `ttl` керує тим, як часто обрізання може виконуватися знову (після останнього торкання кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім жорстко очищає старіші результати інструментів, якщо це потрібно.

**М’яке обрізання** зберігає початок і кінець та вставляє `...` посередині.

**Жорстке очищення** замінює весь результат інструмента на заповнювач.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Подробиці поведінки див. у [Session Pruning](/uk/concepts/session-pruning).

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

- Для каналів, відмінних від Telegram, потрібне явне `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення для channel: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремого облікового запису). Для Signal/Slack/Discord/Google Chat типово `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоками відповідей. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Подробиці поведінки та chunking див. у [Streaming](/uk/concepts/streaming).

### Індикатори введення

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

- Типові значення: `instant` для прямих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для окремої сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язковий sandbox для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

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

<Accordion title="Подробиці sandbox">

**Бекенд:**

- `docker`: локальний runtime Docker (типово)
- `ssh`: загальний віддалений runtime через SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, параметри, специфічні для runtime, переносяться до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: ціль SSH у формі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, який використовується для workspace для кожної області
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, який OpenClaw матеріалізує у тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет SSH-автентифікації:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef визначаються з активного знімка runtime секретів до запуску sandbox-сесії

**Поведінка SSH-бекенда:**

- один раз ініціалізує віддалений workspace після create або recreate
- потім зберігає віддалений SSH-workspace як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи медіа через SSH
- не синхронізує автоматично віддалені зміни назад на хост
- не підтримує контейнери браузера sandbox

**Доступ до workspace:**

- `none`: workspace sandbox для кожної області в `~/.openclaw/sandboxes`
- `ro`: workspace sandbox у `/workspace`, workspace агента монтується лише для читання в `/agent`
- `rw`: workspace агента монтується для читання/запису в `/workspace`

**Область:**

- `session`: окремий контейнер + workspace для кожної сесії
- `agent`: один контейнер + workspace для кожного агента (типово)
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
          policy: "strict", // необов’язковий id політики OpenShell
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

- `mirror`: ініціалізувати віддалений workspace з локального перед exec, синхронізувати назад після exec; локальний workspace залишається канонічним
- `remote`: один раз ініціалізувати віддалений workspace під час створення sandbox, після чого канонічним залишається віддалений workspace

У режимі `remote` локальні зміни хоста, зроблені поза OpenClaw, не синхронізуються в sandbox автоматично після кроку ініціалізації.
Транспортом є SSH до sandbox OpenShell, але plugin керує життєвим циклом sandbox і необов’язковою синхронізацією mirror.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує вихідного доступу до мережі, записуваного root і root-користувача.

**Контейнери типово використовують `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному workspace.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки й прив’язки для окремого агента об’єднуються.

**Браузер у sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вбудовується в системний prompt. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача через noVNC типово використовує VNC-автентифікацію, і OpenClaw видає короткоживучий URL із токеном (замість того, щоб розкривати пароль у спільному URL).

- `allowHostControl: false` (типово) блокує націлювання sandbox-сесій на браузер хоста.
- `network` типово дорівнює `openclaw-sandbox-browser` (окрема bridge-мережа). Установлюйте `bridge` лише тоді, коли вам явно потрібна глобальна зв’язність bridge.
- `cdpSourceRange` необов’язково обмежує вхідний CDP-трафік на межі контейнера до діапазону CIDR (наприклад `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера sandbox. Якщо задано (включно з `[]`), воно замінює `docker.binds` для контейнера браузера.
- Типові параметри запуску визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для контейнерних хостів:
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
  - `--disable-extensions` (типово ввімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    типово ввімкнені та можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо для WebGL/3D це потрібно.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш workflow
    залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - а також `--no-sandbox` і `--disable-setuid-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовими для образу контейнера; використовуйте власний образ браузера з власним
    entrypoint, щоб змінити типові параметри контейнера.

</Accordion>

Браузерний sandbox і `sandbox.docker.binds` доступні лише для Docker.

Збірка образів:

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
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // або { primary, fallbacks }
        thinkingDefault: "high", // перевизначення рівня thinking для окремого агента
        reasoningDefault: "on", // перевизначення видимості reasoning для окремого агента
        fastModeDefault: false, // перевизначення fast mode для окремого агента
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // перевизначає matching defaults.models params за ключем
        skills: ["docs-search"], // замінює agents.defaults.skills, коли задано
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

- `id`: стабільний id агента (обов’язково).
- `default`: якщо встановлено для кількох, перший перемагає (з попередженням у логах). Якщо не встановлено ні для кого, типовим є перший запис у списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні резервні моделі). Завдання Cron, які перевизначають лише `primary`, усе одно успадковують типові резервні моделі, якщо ви не задасте `fallbacks: []`.
- `params`: параметри потоку для окремого агента, об’єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень, таких як `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `skills`: необов’язковий allowlist Skills для окремого агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, якщо його задано; явний список замінює типові значення замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень thinking для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для окремого повідомлення або сесії.
- `reasoningDefault`: необов’язкова типова видимість reasoning для окремого агента (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning для окремого повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення fast mode для окремого агента (`true | false`). Застосовується, коли не задано перевизначення fast mode для окремого повідомлення або сесії.
- `embeddedHarness`: необов’язкове перевизначення політики низькорівневого harness для окремого агента. Використовуйте `{ runtime: "codex", fallback: "none" }`, щоб зробити один агент лише Codex, тоді як інші агенти зберігатимуть типовий резервний PI.
- `runtime`: необов’язковий дескриптор runtime для окремого агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати ACP harness-сесії.
- `identity.avatar`: шлях відносно workspace, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist id агентів для `sessions_spawn` (`["*"]` = будь-який; типово: лише той самий агент).
- Захист успадкування sandbox: якщо сесія запитувача працює в sandbox, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: якщо true, блокує виклики `sessions_spawn`, які пропускають `agentId` (примушує явно вибирати профіль; типово: false).

---

## Маршрутизація кількох агентів

Запускайте кількох ізольованих агентів у межах одного Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

### Поля збігу прив’язки

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній type типово означає route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для channel)
- `acp` (необов’язково; лише для записів `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок збігу:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (на рівні всього channel)
6. Типовий агент

У межах кожного рівня перемагає перший запис `bindings`, що збігся.

Для записів `type: "acp"` OpenClaw виконує визначення за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує порядок рівнів прив’язки route, наведений вище.

### Профілі доступу для окремого агента

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

<Accordion title="Без доступу до файлової системи (лише повідомлення)">

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

Подробиці пріоритетів див. у [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

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
    parentForkMaxTokens: 100000, // пропускати fork батьківського потоку вище цього числа токенів (0 вимикає)
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
      idleHours: 24, // типове автоматичне зняття фокуса через неактивність у годинах (`0` вимикає)
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

<Accordion title="Подробиці полів сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольовану сесію в межах контексту channel.
  - `global`: усі учасники в контексті channel спільно використовують одну сесію (використовуйте лише тоді, коли спільний контекст є очікуваним).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM спільно використовують основну сесію.
  - `per-peer`: ізоляція за id відправника між channels.
  - `per-channel-peer`: ізоляція для кожного channel + відправника (рекомендовано для багато користувацьких inbox).
  - `per-account-channel-peer`: ізоляція для кожного облікового запису + channel + відправника (рекомендовано для багатооблікових конфігурацій).
- **`identityLinks`**: карта канонічних id до peer із префіксом провайдера для спільного використання сесій між channels.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Коли налаштовано обидва, спрацьовує той, у якого термін спливає раніше.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як псевдонім для `direct`.
- **`parentForkMaxTokens`**: максимальне дозволене значення `totalTokens` батьківської сесії під час створення fork сесії потоку (типово `100000`).
  - Якщо батьківське `totalTokens` вище за це значення, OpenClaw запускає нову сесію потоку замість успадкування історії transcript батьківської сесії.
  - Установіть `0`, щоб вимкнути цей запобіжник і завжди дозволяти fork від батьківської сесії.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для основного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів відповіді назад між агентами під час обмінів агент-агент (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона має пріоритет.
- **`maintenance`**: елементи керування очищенням і retention сховища сесій.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`).
  - `rotateBytes`: ротує `sessions.json`, коли він перевищує цей розмір (типово `10mb`).
  - `resetArchiveRetention`: retention для архівів transcript `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий бюджет диска для каталогу сесій. У режимі `warn` він записує попередження в логи; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив’язаних до потоків.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса через неактивність у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)

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

Перевизначення для окремого channel/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Порядок визначення (найспецифічніше перемагає): обліковий запис → channel → глобальний. `""` вимикає та зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна           | Опис                    | Приклад                     |
| ---------------- | ----------------------- | --------------------------- |
| `{model}`        | Коротка назва моделі    | `claude-opus-4-6`           |
| `{modelFull}`    | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`     | Назва провайдера        | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking | `high`, `low`, `off`        |
| `{identity.name}` | Назва identity агента   | (те саме, що й `"auto"`)    |

Змінні нечутливі до регістру. `{think}` — це псевдонім для `{thinkingLevel}`.

### Реакція ack

- Типово використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для окремого channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → channel → `messages.ackReaction` → резервне значення identity.
- Область: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: прибирає ack після відповіді в Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо не задано, реакції статусу лишаються ввімкненими, коли активні ack-реакції.
  У Telegram задайте це явно в `true`, щоб увімкнути реакції статусу життєвого циклу.

### Debounce вхідних повідомлень

Об’єднує швидкі текстові повідомлення від того самого відправника в один хід агента. Медіа/вкладення скидаються негайно. Команди керування обходять debounce.

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

- `auto` керує типовим режимом auto-TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для auto-summary.
- `modelOverrides` типово ввімкнено; `modelOverrides.allowProvider` типово має значення `false` (opt-in).
- Для API-ключів використовуються резервні значення `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- `openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `openai.baseUrl` вказує на endpoint, відмінний від OpenAI, OpenClaw обробляє його як сумісний із OpenAI TTS-сервер і послаблює валідацію model/voice.

---

## Talk

Типові значення для режиму Talk (macOS/iOS/Android).

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

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності й автоматично мігруються до `talk.providers.<provider>`.
- Для voice ID використовуються резервні значення `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає відкриті рядки або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли не налаштовано API-ключ Talk.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні назви.
- `silenceTimeoutMs` керує тим, як довго режим Talk чекає після тиші користувача перед надсиланням transcript. Якщо не задано, використовується типове для платформи вікно паузи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Tools

### Профілі інструментів

`tools.profile` задає базовий allowlist перед `tools.allow`/`tools.deny`:

Локальний onboarding типово встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо значення не задано (наявні явні профілі зберігаються).

| Профіль     | Включає                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Без обмежень (те саме, що й без значення)                                                                                        |

### Групи інструментів

| Група              | Інструменти                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як псевдонім для `exec`)                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Усі вбудовані інструменти (без plugin провайдерів)                                                                      |

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона має пріоритет). Нечутлива до регістру, підтримує wildcard `*`. Застосовується навіть тоді, коли Docker sandbox вимкнено.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Додатково обмежує інструменти для конкретних провайдерів або моделей. Порядок: базовий профіль → профіль провайдера → allow/deny.

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

Керує доступом elevated exec поза sandbox:

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
- `/elevated on|off|ask|full` зберігає стан для кожної сесії; inline-директиви застосовуються до одного повідомлення.
- Elevated `exec` обходить sandbox і використовує налаштований шлях виходу (`gateway` типово або `node`, коли ціллю exec є `node`).

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

Перевірки безпеки циклів інструментів типово **вимкнені**. Установіть `enabled: true`, щоб увімкнути виявлення.
Параметри можна визначати глобально в `tools.loopDetection` і перевизначати для окремого агента в `agents.list[].tools.loopDetection`.

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
- `globalCircuitBreakerThreshold`: поріг жорсткої зупинки для будь-якого виконання без прогресу.
- `detectors.genericRepeat`: попереджати про повторні виклики того самого інструмента з тими самими аргументами.
- `detectors.knownPollNoProgress`: попереджати/блокувати відомі polling-інструменти (`process.poll`, `command_status` тощо).
- `detectors.pingPong`: попереджати/блокувати шаблони поперемінних пар без прогресу.
- Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, валідація не проходить.

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
        provider: "firecrawl", // необов’язково; пропустіть для auto-detect
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
        directSend: false, // opt-in: надсилати завершені асинхронні результати music/video прямо в channel
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

<Accordion title="Поля запису моделі медіа">

**Запис провайдера** (`type: "provider"` або пропущено):

- `provider`: id API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
- `model`: перевизначення id моделі
- `profile` / `preferredProfile`: вибір профілю з `auth-profiles.json`

**CLI-запис** (`type: "cli"`):

- `command`: виконуваний файл для запуску
- `args`: аргументи з шаблонами (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

**Спільні поля:**

- `capabilities`: необов’язковий список (`image`, `audio`, `video`). Типові значення: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
- У разі збою використовується наступний запис.

Автентифікація провайдера виконується в стандартному порядку: `auth-profiles.json` → змінні середовища → `models.providers.*.apiKey`.

**Поля асинхронного завершення:**

- `asyncCompletion.directSend`: коли `true`, завершені асинхронні завдання `music_generate`
  і `video_generate` спочатку намагаються доставлятися безпосередньо в channel. Типове значення: `false`
  (застарілий шлях пробудження сесії запитувача/доставки моделлю).

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

Керує тим, на які сесії можна націлювати інструменти сесій (`sessions_list`, `sessions_history`, `sessions_send`).

Типове значення: `tree` (поточна сесія + сесії, запущені нею, наприклад subagents).

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
- `tree`: поточна сесія + сесії, запущені поточною сесією (subagents).
- `agent`: будь-яка сесія, що належить поточному id агента (може включати інших користувачів, якщо ви запускаєте сесії per-sender під тим самим id агента).
- `all`: будь-яка сесія. Націлювання між агентами все одно потребує `tools.agentToAgent`.
- Обмеження sandbox: коли поточна сесія працює в sandbox і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово встановлюється в `tree`, навіть якщо `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Керує підтримкою inline-вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: установіть true, щоб дозволити inline-вкладення файлів
        maxTotalBytes: 5242880, // загалом 5 MB для всіх файлів
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB на файл
        retainOnSessionKeep: false, // зберігати вкладення, коли cleanup="keep"
      },
    },
  },
}
```

Примітки:

- Вкладення підтримуються лише для `runtime: "subagent"`. Runtime ACP їх відхиляє.
- Файли матеріалізуються в дочірньому workspace в `.openclaw/attachments/<uuid>/` з `.manifest.json`.
- Вміст вкладень автоматично редагується в збереженні transcript.
- Входи base64 перевіряються за строгими правилами алфавіту/падингу та попереднім захистом розміру до декодування.
- Дозволи на файли: `0700` для каталогів і `0600` для файлів.
- Очищення виконується відповідно до політики `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише коли `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

Експериментальні прапорці вбудованих інструментів. Типово вимкнено, якщо не спрацьовує правило автоматичного ввімкнення strict-agentic GPT-5.

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
- Типове значення: `false`, якщо тільки `agents.defaults.embeddedPi.executionContract` (або перевизначення для окремого агента) не задано як `"strict-agentic"` для запуску OpenAI або OpenAI Codex сімейства GPT-5. Установіть `true`, щоб примусово ввімкнути інструмент поза цією областю, або `false`, щоб залишити його вимкненим навіть для запусків strict-agentic GPT-5.
- Коли інструмент увімкнено, системний prompt також додає вказівки щодо використання, щоб модель застосовувала його лише для суттєвої роботи й тримала не більш як один крок у стані `in_progress`.

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

- `model`: типова модель для запущених субагентів. Якщо не задано, субагенти успадковують модель викликувача.
- `allowAgents`: типовий allowlist цільових id агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; типово: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли виклик інструмента пропускає `runTimeoutSeconds`. `0` означає без тайм-ауту.
- Політика інструментів для окремого субагента: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Власні провайдери й base URL

OpenClaw використовує вбудований каталог моделей. Додавайте власних провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (типово) | replace
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
- Перевизначайте корінь конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий псевдонім змінної середовища).
- Пріоритет об’єднання для однакових id провайдерів:
  - Непорожні значення `baseUrl` з `models.json` агента мають пріоритет.
  - Непорожні значення `apiKey` агента мають пріоритет лише тоді, коли цей провайдер не керується через SecretRef у поточному контексті config/auth-profile.
  - Значення `apiKey` провайдера, якими керує SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань) замість збереження визначених секретів.
  - Значення заголовків провайдера, якими керує SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань).
  - Порожні або відсутні `apiKey`/`baseUrl` агента використовують резервно `models.providers` із конфігурації.
  - Для однакових моделей `contextWindow`/`maxTokens` використовують вище значення між явною конфігурацією та неявними значеннями каталогу.
  - Для однакових моделей `contextTokens` зберігає явне обмеження runtime, якщо воно задане; використовуйте це, щоб обмежити фактичний контекст без зміни рідних метаданих моделі.
  - Використовуйте `models.mode: "replace"`, якщо хочете, щоб конфігурація повністю переписала `models.json`.
  - Збереження маркерів є авторитетним від джерела: маркери записуються з активного знімка конфігурації джерела (до визначення), а не з визначених значень секретів runtime.

### Подробиці полів провайдера

- `models.mode`: поведінка каталогу провайдера (`merge` або `replace`).
- `models.providers`: карта власних провайдерів із ключами за id провайдера.
  - Безпечне редагування: використовуйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` або `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для додаткових оновлень. `config set` відхиляє руйнівні заміни, якщо ви не передасте `--replace`.
- `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
- `models.providers.*.apiKey`: облікові дані провайдера (краще використовувати SecretRef/env substitution).
- `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` вбудовує `options.num_ctx` у запити (типово: `true`).
- `models.providers.*.authHeader`: примусово передає облікові дані в заголовку `Authorization`, якщо це потрібно.
- `models.providers.*.baseUrl`: base URL API верхнього рівня.
- `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації через проксі/орендаря.
- `models.providers.*.request`: перевизначення транспорту для HTTP-запитів model-provider.
  - `request.headers`: додаткові заголовки (об’єднуються з типовими значеннями провайдера). Значення приймають SecretRef.
  - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію провайдера), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов’язковим `prefix`).
  - `request.proxy`: перевизначення HTTP-проксі. Режими: `"env-proxy"` (використовувати змінні середовища `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими приймають необов’язковий підоб’єкт `tls`.
  - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: коли `true`, дозволяє HTTPS до `baseUrl`, якщо DNS визначається в private, CGNAT або подібні діапазони, через захист HTTP fetch провайдера (операторський opt-in для довірених self-hosted OpenAI-сумісних endpoint). WebSocket використовує той самий `request` для заголовків/TLS, але не цей SSRF-захист fetch. Типове значення `false`.
- `models.providers.*.models`: явні записи каталогу моделей провайдера.
- `models.providers.*.models.*.contextWindow`: метадані рідного контекстного вікна моделі.
- `models.providers.*.models.*.contextTokens`: необов’язкове обмеження runtime-контексту. Використовуйте це, коли вам потрібен менший фактичний бюджет контексту, ніж рідний `contextWindow` моделі.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` з непорожнім нерідним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це в `false` під час runtime. Порожній/пропущений `baseUrl` зберігає типову поведінку OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для OpenAI-сумісних chat-endpoint, що підтримують лише рядки. Коли `true`, OpenClaw сплощує масиви `messages[].content`, що містять лише текст, у звичайні рядки перед надсиланням запиту.
- `plugins.entries.amazon-bedrock.config.discovery`: корінь параметрів auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр provider-id для цільового виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне контекстне вікно для виявлених моделей.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість вихідних токенів для виявлених моделей.

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

Використовуйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` для прямого Z.AI.

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

Задайте `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або `opencode-go/...` для каталогу Go. Скорочення: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

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

Задайте `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` приймаються як псевдоніми. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

- Загальний endpoint: `https://api.z.ai/api/paas/v4`
- Endpoint для кодування (типовий): `https://api.z.ai/api/coding/paas/v4`
- Для загального endpoint визначте власного провайдера з перевизначенням base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
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
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Для китайського endpoint: `baseUrl: "https://api.moonshot.cn/v1"` або `openclaw onboard --auth-choice moonshot-api-key-cn`.

Нативні endpoint Moonshot повідомляють про сумісність потокового використання на спільному
транспорті `openai-completions`, і OpenClaw визначає це за можливостями endpoint,
а не лише за id вбудованого провайдера.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic-сумісний, вбудований провайдер. Скорочення: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-сумісний)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL має пропускати `/v1` (клієнт Anthropic додає його сам). Скорочення: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (напряму)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Задайте `MINIMAX_API_KEY`. Скорочення:
`openclaw onboard --auth-choice minimax-global-api` або
`openclaw onboard --auth-choice minimax-cn-api`.
Каталог моделей типово містить лише M2.7.
На Anthropic-сумісному шляху потокової передачі OpenClaw типово вимикає thinking MiniMax,
якщо ви явно не задасте `thinking` самостійно. `/fast on` або
`params.fastMode: true` переписує `MiniMax-M2.7` на
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Локальні моделі (LM Studio)">

Див. [Local Models](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному обладнанні; зберігайте хостовані моделі об’єднаними для резервного використання.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або відкритий рядок
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: необов’язковий allowlist лише для комплектних Skills (керовані/workspace Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: коли true, віддавати перевагу встановлювачам Homebrew, якщо `brew`
  доступний, перед переходом до інших типів встановлювачів.
- `install.nodeManager`: пріоритет node-встановлювача для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він комплектний/встановлений.
- `entries.<skillKey>.apiKey`: зручне поле для Skills, що оголошують основну env-змінну (відкритий рядок або об’єкт SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Завантажуються з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, а також `plugins.load.paths`.
- Виявлення приймає нативні Plugins OpenClaw, а також сумісні набори Codex і Claude, зокрема набори Claude стандартного макета без manifest.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні plugin (коли plugin це підтримує).
- `plugins.entries.<id>.env`: карта env-змінних у межах plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` і ігнорує поля, що змінюють prompt, зі застарілого `before_agent_start`, зберігаючи при цьому застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hooks plugin і підтримуваних каталогів hooks, наданих наборами.
- `plugins.entries.<id>.subagent.allowModelOverride`: явна довіра цьому plugin запитувати перевизначення `provider` і `model` для кожного запуску фонових субагентів.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень субагентів. Використовуйте `"*"` лише тоді, коли навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений plugin (валідується нативною схемою plugin OpenClaw, якщо вона доступна).
- `plugins.entries.firecrawl.config.webFetch`: параметри провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Використовує резервно `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілий `tools.web.fetch.firecrawl.apiKey` або env-змінну `FIRECRAWL_API_KEY`.
  - `baseUrl`: base URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scrape у секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: параметри xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok для пошуку (наприклад `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: параметри memory Dreaming. Фази й пороги див. у [Dreaming](/uk/concepts/dreaming).
  - `enabled`: головний перемикач Dreaming (типово `false`).
  - `frequency`: Cron-інтервал для кожного повного проходу Dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація memory розміщена в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені plugins наборів Claude також можуть додавати вбудовані типові значення Pi з `settings.json`; OpenClaw застосовує їх як санітизовані параметри агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати id активного plugin memory або `"none"`, щоб вимкнути plugins memory.
- `plugins.slots.contextEngine`: вибрати id активного plugin context engine; типово `"legacy"`, якщо ви не встановите й не виберете інший engine.
- `plugins.installs`: метадані встановлення, якими керує CLI і які використовує `openclaw plugins update`.
  - Містить `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Розглядайте `plugins.installs.*` як керований стан; надавайте перевагу командам CLI замість ручних змін.

Див. [Plugins](/uk/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in лише для довіреного доступу до private network
      // allowPrivateNetwork: true, // застарілий псевдонім
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` вимикає `act:evaluate` і `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація Browser типово лишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте навігації Browser у private network.
- У суворому режимі віддалені endpoint профілів CDP (`profiles.*.cdpUrl`) підлягають тому самому блокуванню private network під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі attach-only (start/stop/reset вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий DevTools WebSocket URL.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть приєднуватися
  на вибраному хості або через під’єднаний browser Node.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-selector, hooks завантаження одного файла,
  без перевизначення тайм-аутів діалогів, без `wait --load networkidle`, а також без
  `responsebody`, експорту PDF, перехоплення завантажень чи пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Порядок auto-detect: типовий браузер, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Сервіс керування: лише loopback (порт визначається з `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад
  `--disable-gpu`, розмір вікна або налагоджувальні прапорці).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, короткий текст, URL зображення або data URI
    },
  },
}
```

- `seamColor`: акцентний колір для chrome нативного UI застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення identity для Control UI. Використовує резервно identity активного агента.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // або OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // для mode=trusted-proxy; див. /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // небезпечно: дозволити абсолютні зовнішні embed URL http(s)
      // allowedOrigins: ["https://control.example.com"], // потрібно для Control UI поза loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // небезпечний режим резервного походження через заголовок Host
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Необов’язково. Типово false.
    allowRealIpFallback: false,
    tools: {
      // Додаткові HTTP-заборони для /tools/invoke
      deny: ["browser"],
      // Прибрати інструменти зі стандартного списку HTTP-заборон
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Подробиці полів Gateway">

- `mode`: `local` (запускати Gateway) або `remote` (підключатися до віддаленого Gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режимів bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає `127.0.0.1` усередині контейнера. За bridge-мережі Docker (`-p 18789:18789`) трафік приходить на `eth0`, тож Gateway недосяжний. Використовуйте `--network host`, або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: типово обов’язкова. Binds, відмінні від loopback, вимагають auth Gateway. На практиці це означає спільний token/password або reverse proxy з підтримкою identity з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Під час запуску та в потоках встановлення/відновлення сервісу виникає помилка, якщо налаштовано обидва, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних конфігурацій loopback; цей варіант навмисно не пропонується в prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегувати auth reverse proxy з підтримкою identity і довіряти заголовкам identity від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує джерело proxy **не loopback**; reverse proxy loopback на тому самому хості не задовольняють trusted-proxy auth.
- `gateway.auth.allowTailscale`: коли `true`, заголовки identity від Tailscale Serve можуть задовольняти auth для Control UI/WebSocket (перевіряється через `tailscale whois`). HTTP API endpoint не використовують цю auth за заголовками Tailscale; вони дотримуються звичайного режиму HTTP auth Gateway. Цей безтокеновий потік передбачає, що хост Gateway є довіреним. Типове значення `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб auth. Застосовується для кожного IP клієнта та для кожної області auth (спільний секрет і device-token відстежуються окремо). Заблоковані спроби повертають `429` + `Retry-After`.
  - В асинхронному шляху Control UI через Tailscale Serve невдалі спроби для однакового `{scope, clientIp}` серіалізуються до запису невдалої спроби. Тому паралельні неправильні спроби від того самого клієнта можуть спровокувати обмежувач уже на другому запиті замість того, щоб обидві одночасно пройти як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово дорівнює `true`; установіть `false`, коли навмисно хочете, щоб і localhost-трафік підлягав rate limit (для тестових конфігурацій або суворих розгортань через proxy).
- Спроби auth WS з browser-origin завжди обмежуються без винятку для loopback (додатковий захист від brute force localhost через браузер).
- На loopback такі блокування для browser-origin ізолюються за нормалізованим
  значенням `Origin`, тож повторні збої з одного localhost origin не
  блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічний, вимагає auth).
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень WebSocket до Gateway. Потрібний, коли очікуються browser-клієнти з origin, відмінних від loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, що вмикає резервне визначення origin через заголовок Host для розгортань, які навмисно покладаються на політику origin за заголовком Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: клієнтське перевизначення break-glass, що дозволяє plaintext `ws://` до довірених IP приватної мережі; типово plaintext, як і раніше, дозволено лише для loopback.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Самі по собі вони не налаштовують auth Gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS URL зовнішнього APNs relay, який використовують офіційні/TestFlight-збірки iOS після того, як вони публікують реєстрації relay-backed до Gateway. Ця URL має збігатися з URL relay, скомпільованою в iOS-збірці.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від Gateway до relay у мілісекундах. Типове значення `10000`.
- Реєстрації relay-backed делегуються конкретній identity Gateway. Парний застосунок iOS отримує `gateway.identity.get`, включає цю identity до реєстрації relay і пересилає Gateway право надсилання в межах цієї реєстрації. Інший Gateway не може повторно використати таку збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення через env для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: лише для розробки — аварійний режим для loopback HTTP URL relay. Продакшн URL relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу стану channel у хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типове значення: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого socket у хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типове значення: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor для channel/облікового запису за ковзну годину. Типове значення: `10`.
- `channels.<provider>.healthMonitor.enabled`: відмова для окремого channel від перезапусків health-monitor при збереженні глобального монітора увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в багатооблікових channels. Якщо задано, має пріоритет над перевизначенням на рівні channel.
- Локальні шляхи виклику Gateway можуть використовувати `gateway.remote.*` як резервне значення лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно задано через SecretRef і не визначено, визначення завершується fail-closed (без маскування через резервний remote).
- `trustedProxies`: IP reverse proxy, які завершують TLS або додають заголовки forwarded-client. Вказуйте лише proxy, якими ви керуєте. Записи loopback і далі є допустимими для виявлення на тому самому хості/локальних proxy-сценаріїв (наприклад Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, Gateway приймає `X-Real-IP`, якщо відсутній `X-Forwarded-For`. Типове значення `false` для fail-closed-поведінки.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список заборон).
- `gateway.tools.allow`: прибрати назви інструментів зі стандартного списку HTTP-заборон.

</Accordion>

### OpenAI-сумісні endpoint

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-входу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist трактуються як відсутні; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (задавайте лише для HTTPS origin, якими ви керуєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох інстансів

Запускайте кілька Gateway на одному хості з унікальними портами та каталогами стану:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні прапорці: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

Див. [Multiple Gateways](/uk/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: вмикає завершення TLS на слухачі Gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, коли явні файли не налаштовано; лише для локального/dev-використання.
- `certPath`: шлях файлової системи до файла TLS-сертифіката.
- `keyPath`: шлях файлової системи до файла закритого TLS-ключа; обмежуйте до нього дозволи.
- `caPath`: необов’язковий шлях до пакета CA для перевірки клієнтів або власних ланцюжків довіри.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: керує тим, як зміни конфігурації застосовуються під час runtime.
  - `"off"`: ігнорувати live-редагування; зміни вимагають явного перезапуску.
  - `"restart"`: завжди перезапускати процес Gateway після зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку пробувати hot reload; за потреби повертатися до перезапуску.
- `debounceMs`: вікно debounce у мс до застосування змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: максимальний час у мс очікування завершення операцій у польоті перед примусовим перезапуском (типово: `300000` = 5 хвилин).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` або `x-openclaw-token: <token>`.
Hook-токени в query string відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` вимагає непорожній `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте виділений підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонний `sessionKey`, задайте `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping не потребують цього opt-in.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із payload запиту приймається лише тоді, коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → визначається через `hooks.mappings`
  - Значення `sessionKey` mapping, згенеровані шаблоном, вважаються зовнішньо заданими та також вимагають `hooks.allowRequestSessionKey=true`.

<Accordion title="Подробиці mapping">

- `match.path` зіставляє підшлях після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читаються з payload.
- `transform` може вказувати на модуль JS/TS, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID використовують резервно типового агента.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або відсутність = дозволити все, `[]` = заборонити все).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликувачам `/hooks/agent` і ключам сесій mapping, що задаються шаблоном, установлювати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий allowlist префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-який mapping або preset використовує шаблонний `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у channel; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволений, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію для кожного повідомлення, задайте `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` так, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібно `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість типового шаблонного значення.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, якщо його налаштовано. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути це.
- Не запускайте окремий `gog gmail watch serve` паралельно з Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // або OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Обслуговує HTML/CSS/JS, які редагує агент, і A2UI через HTTP під портом Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: зберігайте `gateway.bind: "loopback"` (типово).
- Binds, відмінні від loopback: маршрути canvas вимагають auth Gateway (token/password/trusted-proxy), як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після того як Node спарено та підключено, Gateway оголошує URL можливостей, прив’язані до Node, для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії Node і швидко спливають. Резервний варіант на основі IP не використовується.
- Вбудовує клієнт live-reload у HTML, що обслуговується.
- Автоматично створює початковий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни вимагають перезапуску Gateway.
- Вимкніть live reload для великих каталогів або при помилках `EMFILE`.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (типово): не включати `cliPath` + `sshPort` до TXT-записів.
- `full`: включати `cliPath` + `sshPort`.
- Ім’я хоста типово `openclaw`. Перевизначайте через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте з DNS-сервером (рекомендовано CoreDNS) + split DNS Tailscale.

Налаштування: `openclaw dns setup --apply`.

---

## Середовище

### `env` (вбудовані env-змінні)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Вбудовані env-змінні застосовуються лише тоді, коли в середовищі процесу немає цього ключа.
- Файли `.env`: `.env` поточного робочого каталогу + `~/.openclaw/.env` (жоден із них не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашого shell входу.
- Повний пріоритет див. у [Environment](/uk/help/environment).

### Підстановка env-змінних

Посилайтеся на env-змінні в будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише великі літери: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Secrets

Посилання на секрети є додатковими: відкриті значення й далі працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id не повинні містити slash-delimited сегменти шляху `.` або `..` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання з `auth-profiles.json` включено до визначення runtime та охоплення аудиту.

### Конфігурація провайдерів секретів

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // необов’язковий явний env-провайдер
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Примітки:

- Провайдер `file` підтримує `mode: "json"` і `mode: "singleValue"` (`id` має бути `"value"` у режимі singleValue).
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує payload протоколу через stdin/stdout.
- Типово шляхи команд-символічних посилань відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-символічні посилання з перевіркою шляху визначеної цілі.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до шляху визначеної цілі.
- Середовище дочірнього процесу `exec` типово мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети визначаються під час активації в знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Під час активації застосовується фільтрація активної поверхні: невизначені посилання на ввімкнених поверхнях спричиняють помилку запуску/перезавантаження, а неактивні поверхні пропускаються з діагностикою.

---

## Сховище auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Профілі для окремого агента зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні runtime-облікові дані надходять із визначених знімків у пам’яті; застарілі статичні записи `auth.json` очищаються, коли їх виявлено.
- Застарілі імпорти OAuth із `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка runtime для Secrets і інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: базовий backoff у годинах, коли профіль зазнає збою через справжні
  помилки billing/недостатнього кредиту (типово: `5`). Явний текст billing
  все одно може потрапити сюди навіть у відповідях `401`/`403`, але
  провайдер-специфічні текстові matcher-и лишаються обмеженими провайдером,
  якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` usage-window або
  повідомлення про ліміт витрат organization/workspace натомість лишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення часу billing backoff у годинах для окремих провайдерів.
- `billingMaxHours`: межа в годинах для експоненційного зростання billing backoff (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для збоїв `auth_permanent` з високою впевненістю (типово: `10`).
- `authPermanentMaxMinutes`: межа в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile в межах одного провайдера для помилок перевантаження перед переходом до резервної моделі (типово: `1`). Сюди потрапляють форми зайнятості провайдера на кшталт `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile в межах одного провайдера для помилок обмеження швидкості перед переходом до резервної моделі (типово: `1`). До цього кошика rate-limit входять тексти у стилі провайдера на кшталт `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Типовий файл логів: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Задайте `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug`, коли використовується `--verbose`.
- `maxFileBytes`: максимальний розмір файла логів у байтах, після якого запис пригнічується (додатне ціле число; типово: `524288000` = 500 MB). Для продакшн-розгортань використовуйте зовнішню ротацію логів.

---

## Діагностика

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: головний перемикач виводу інструментування (типово: `true`).
- `flags`: масив рядків прапорців, що вмикають цільовий вивід логів (підтримує wildcard на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для виведення попереджень про завислі сесії, поки сесія лишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: ім’я сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт trace, metrics або logs.
- `otel.sampleRate`: частота вибірки trace `0`–`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання telemetry у мс.
- `cacheTrace.enabled`: журналювати знімки trace кешу для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL trace кешу (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається до виводу trace кешу (усі типово: `true`).

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: канал релізів для встановлень npm/git — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти наявність оновлень npm під час запуску Gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове auto-update для встановлень пакетів (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням на stable-каналі (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-каналу в годинах (типово: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу в годинах (типово: `1`; максимум: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: глобальний feature gate ACP (типово: `false`).
- `dispatch.enabled`: незалежний gate для dispatch ходів сесії ACP (типово: `true`). Установіть `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: id типового backend runtime ACP (має збігатися із зареєстрованим plugin runtime ACP).
- `defaultAgent`: резервний id цільового агента ACP, коли під час spawn не задано явну ціль.
- `allowedAgents`: allowlist id агентів, дозволених для сесій runtime ACP; порожнє значення означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір фрагмента перед розбиттям проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки status/tool для кожного ходу (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктується за один хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлень ACP.
- `stream.tagVisibility`: запис назв тегів до булевих перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для воркерів сесій ACP до того, як вони стануть придатними для очищення.
- `runtime.installCommand`: необов’язкова команда встановлення, яку слід виконати під час bootstrap середовища runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` керує стилем tagline банера:
  - `"random"` (типово): ротаційні кумедні/сезонні tagline.
  - `"default"`: фіксована нейтральна tagline (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту tagline (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише tagline), задайте env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Метадані, записані керованими потоками налаштування CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

Поля identity див. у `agents.list` в розділі [Типові значення агента](#agent-defaults).

---

## Bridge (застарілий, видалений)

Поточні збірки більше не містять TCP Bridge. Node підключаються через WebSocket Gateway. Ключі `bridge.*` більше не входять до схеми конфігурації (валідація завершується помилкою, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Застаріла конфігурація Bridge (історична довідка)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // застарілий резервний варіант для збережених завдань notify:true
    webhookToken: "replace-with-dedicated-token", // необов’язковий bearer token для вихідної webhook auth
    sessionRetention: "24h", // рядок тривалості або false
    runLog: {
      maxBytes: "2mb", // типово 2_000_000 байтів
      keepLines: 2000, // типово 2000
    },
  },
}
```

- `sessionRetention`: як довго зберігати завершені сесії ізольованих запусків Cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених transcript Cron. Типове значення: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір одного файла журналу запуску (`cron/runs/<jobId>.jsonl`) до очищення. Типове значення: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, що зберігаються при запуску очищення журналу запуску. Типове значення: `2000`.
- `webhookToken`: bearer token, який використовується для доставки webhook POST із Cron (`delivery.mode = "webhook"`); якщо пропущено, заголовок auth не надсилається.
- `webhook`: застарілий резервний webhook URL (http/https), який використовується лише для збережених завдань, що все ще мають `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань при тимчасових помилках (типово: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, що запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових завдань Cron. Повторювані завдання використовують окрему обробку збоїв.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: увімкнути сповіщення про збої для завдань Cron (типово: `false`).
- `after`: кількість послідовних збоїв до спрацювання сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` виконує POST на налаштований webhook.
- `accountId`: необов’язковий id облікового запису або каналу для обмеження доставки сповіщень.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Типова ціль для сповіщень про збої Cron для всіх завдань.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли існує достатньо даних цілі.
- `channel`: перевизначення channel для доставки announce. `"last"` повторно використовує останній відомий channel доставки.
- `to`: явна ціль announce або URL webhook. Обов’язково для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли ні глобальну, ні окрему ціль збоїв не задано, завдання, які вже доставляються через `announce`, у разі збою використовують резервно цю основну announce-ціль.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблонів моделі медіа

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Змінна             | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повний текст вхідного повідомлення                |
| `{{RawBody}}`      | Сирий текст (без обгорток історії/відправника)    |
| `{{BodyStripped}}` | Текст без згадок групи                            |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор цілі                                |
| `{{MessageSid}}`   | ID повідомлення channel                           |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`   | Audio transcript                                  |
| `{{Prompt}}`       | Визначений media prompt для CLI-записів           |
| `{{MaxChars}}`     | Визначена максимальна кількість символів виводу для CLI-записів |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (best effort)                          |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`   | Відображуване ім’я відправника (best effort)      |
| `{{SenderE164}}`   | Номер телефону відправника (best effort)          |
| `{{Provider}}`     | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Include конфігурації (`$include`)

Розділяйте конфігурацію на кілька файлів:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Поведінка об’єднання:**

- Один файл: замінює об’єкт-контейнер.
- Масив файлів: глибоко об’єднуються за порядком (пізніші перевизначають раніші).
- Сусідні ключі: об’єднуються після include (перевизначають включені значення).
- Вкладені include: до 10 рівнів глибини.
- Шляхи: визначаються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли вони все одно визначаються в межах цієї межі.
- Записи, якими керує OpenClaw і які змінюють лише один розділ верхнього рівня, підкріплений include одного файла, записуються безпосередньо до цього включеного файла. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі include, масиви include та include із сусідніми перевизначеннями є лише для читання для записів, якими керує OpenClaw; такі записи виконують fail closed замість сплощення конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних include.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_
