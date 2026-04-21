---
read_when:
    - Потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник з конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник з конфігурації
x-i18n:
    generated_at: "2026-04-21T01:06:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71cc79a7cf17f07b12f1ef0dec6cdc84f553fc3d72189069f4c74dca26efd8d5
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Довідник з конфігурації

Основний довідник з конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Configuration](/uk/gateway/configuration).

Ця сторінка охоплює основні поверхні конфігурації OpenClaw і дає посилання далі, коли підсистема має власний, глибший довідник. Вона **не** намагається вбудувати на одній сторінці кожен каталог команд, що належить каналу/Plugin, або кожен глибокий параметр пам’яті/QMD.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, яка використовується для валідації та UI керування, із злитими метаданими bundled/Plugin/каналу, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з обмеженням за шляхом для інструментів детального перегляду
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють baseline-хеш документації конфігурації щодо поточної поверхні схеми

Окремі поглиблені довідники:

- [Довідник з конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Слеш-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідного каналу/Plugin для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх не вказано.

---

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не вказано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і політики груп:

| Політика DM         | Поведінка                                                      |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код pairing; власник має схвалити |
| `allowlist`         | Лише відправники з `allowFrom` (або зі сховища paired allow)   |
| `open`              | Дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)          |
| `disabled`          | Ігнорувати всі вхідні DM                                       |

| Політика групи        | Поведінка                                             |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (типово)  | Лише групи, що відповідають налаштованому allowlist   |
| `open`                | Обійти allowlist груп (фільтрація за згадками все ще застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                |

<Note>
`channels.defaults.groupPolicy` задає значення за замовчуванням, коли `groupPolicy` провайдера не встановлено.
Коди pairing спливають через 1 годину. Незавершені запити на pairing DM обмежені **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп під час виконання повертається до `allowlist` (fail-closed) із попередженням під час запуску.
</Note>

### Перевизначення моделі каналу

Використовуйте `channels.modelByChannel`, щоб закріпити конкретні ID каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Відображення каналу застосовується, коли сесія ще не має перевизначення моделі (наприклад, заданого через `/model`).

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

### Значення каналів за замовчуванням і Heartbeat

Використовуйте `channels.defaults` для спільної поведінки політики груп і Heartbeat між провайдерами:

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
- `channels.defaults.contextVisibility`: режим видимості додаткового контексту за замовчуванням для всіх каналів. Значення: `all` (типово, включати весь цитований/потоковий/історичний контекст), `allowlist` (включати контекст лише від відправників з allowlist), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати статуси справних каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати деградовані/помилкові статуси у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал Gateway (Baileys Web). Він запускається автоматично, коли існує прив’язана сесія.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
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

- Вихідні команди типово використовують обліковий запис `default`, якщо він є; інакше — перший налаштований ID облікового запису (відсортовано).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису переноситься командою `openclaw doctor` у `whatsapp/default`.
- Перевизначення на рівні облікового запису: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються), з `TELEGRAM_BOT_TOKEN` як резервним варіантом для типового облікового запису.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.
- У конфігураціях із багатьма обліковими записами (2+ ID облікових записів) задайте явний типовий обліковий запис (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, якщо цього бракує або значення недійсне.
- `configWrites: false` блокує ініційовані з Telegram записи конфігурації (міграції ID supergroup, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Попередній перегляд потоків Telegram використовує `sendMessage` + `editMessageText` (працює в особистих і групових чатах).
- Політика повторів: див. [Політика повторів](/uk/concepts/retry).

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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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

- Токен: `channels.discord.token`, з `DISCORD_BOT_TOKEN` як резервним варіантом для типового облікового запису.
- Прямі вихідні виклики, які надають явний Discord `token`, використовують цей токен для виклику; налаштування повторів/політик облікового запису все одно беруться з вибраного облікового запису в активному runtime-знімку.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) для цілей доставки; прості числові ID відхиляються.
- Slug-и guild мають нижній регістр, а пробіли замінюються на `-`; ключі каналів використовують slug-ім’я (без `#`). Надавайте перевагу ID guild.
- Повідомлення, створені ботом, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення на рівні каналу) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `maxLinesPerMessage` (типово 17) розбиває високі повідомлення навіть тоді, коли вони коротші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією, прив’язаною до потоків Discord:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до потоків (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: перемикач opt-in для автоматичного створення/прив’язки потоку `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для каналів і потоків (використовуйте id каналу/потоку в `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає колір акценту для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення auto-join + TTS.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` напряму передаються в опції DAVE `@discordjs/voice` (типово `true` і `24`).
- OpenClaw також намагається відновити отримання голосу, виходячи й повторно входячи в голосову сесію після повторних збоїв дешифрування.
- `channels.discord.streaming` — це канонічний ключ режиму потокової передачі. Застарілі значення `streamMode` і булеві значення `streaming` мігруються автоматично.
- `channels.discord.autoPresence` відображає доступність runtime у присутність бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінюваними іменами/тегами (аварійний режим сумісності).
- `channels.discord.execApprovals`: власна доставка підтверджень exec для Discord і авторизація тих, хто може підтверджувати.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto підтвердження exec активуються, коли тих, хто може підтверджувати, можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено підтверджувати exec-запити. Якщо не вказано, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Не вказуйте, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на підтвердження. `"dm"` (типово) надсилає їх у DM тим, хто підтверджує, `"channel"` надсилає в початковий канал, `"both"` надсилає в обидва місця. Коли target включає `"channel"`, кнопки можуть використовувати лише визначені approvers.
  - `cleanupAfterResolve`: коли `true`, видаляє DM із підтвердженням після схвалення, відхилення або тайм-ауту.

**Режими сповіщень про реакції:** `off` (немає), `own` (повідомлення бота, типово), `all` (усі повідомлення), `allowlist` (з `guilds.<id>.users` для всіх повідомлень).

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

- JSON службового облікового запису: вбудований (`serviceAccount`) або на основі файла (`serviceAccountFile`).
- Також підтримується SecretRef службового облікового запису (`serviceAccountRef`).
- Резервні змінні середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінюваним email principal (аварійний режим сумісності).

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
        nativeTransport: true, // use Slack native streaming API when mode=partial
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

- **Режим socket** вимагає і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного варіанта змінних середовища типового облікового запису).
- **HTTP mode** вимагає `botToken` плюс `signingSecret` (у корені або для кожного облікового запису окремо).
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack показують поля джерела/статусу для кожного облікового запису, такі як
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у HTTP mode,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях команди/runtime не зміг
  визначити значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані зі Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.
- `channels.slack.streaming.mode` — це канонічний ключ режиму потокової передачі Slack. `channels.slack.streaming.nativeTransport` керує власним транспортом потокової передачі Slack. Застарілі значення `streamMode`, булеві значення `streaming` і `nativeStreaming` мігруються автоматично.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (із `reactionAllowlist`).

**Ізоляція сесій потоків:** `thread.historyScope` — для кожного потоку окремо (типово) або спільно на канал. `thread.inheritParent` копіює транскрипт батьківського каналу в нові потоки.

- Власна потокова передача Slack разом зі статусом потоку Slack у стилі помічника "is typing..." вимагають цільового потоку відповіді. DM верхнього рівня типово залишаються поза потоком, тому вони використовують `typingReaction` або звичайну доставку замість попереднього перегляду в стилі потоку.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім видаляє її після завершення. Використовуйте shortcode емодзі Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: власна доставка підтверджень exec для Slack і авторизація тих, хто може підтверджувати. Та сама схема, що й для Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій   | Типово  | Примітки                 |
| ----------- | ------- | ------------------------ |
| reactions   | увімкнено | Реагувати + перелік реакцій |
| messages    | увімкнено | Читання/надсилання/редагування/видалення |
| pins        | увімкнено | Закріпити/відкріпити/список |
| memberInfo  | увімкнено | Інформація про учасника |
| emojiList   | увімкнено | Список користувацьких емодзі |

### Mattermost

Mattermost постачається як Plugin: `openclaw plugins install @openclaw/mattermost`.

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
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Режими чату: `oncall` (відповідати на @-згадку, типово), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса тригера).

Коли власні команди Mattermost увімкнено:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повним URL.
- `commands.callbackUrl` має вказувати на endpoint Gateway OpenClaw і бути досяжним із сервера Mattermost.
- Власні callback-и slash-команд автентифікуються за токенами кожної команди, які
  Mattermost повертає під час реєстрації slash-команди. Якщо реєстрація не вдається або
  жодна команда не активована, OpenClaw відхиляє callback-и з помилкою
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів callback-ів Mattermost може вимагати, щоб
  `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен callback-а.
  Використовуйте значення хоста/домену, а не повні URL.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані з Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення фільтрації за згадками для окремого каналу (`"*"` для типового значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
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

- `channels.signal.account`: закріпити запуск каналу за конкретною ідентичністю облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити записи конфігурації, ініційовані з Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (підтримується Plugin, налаштовується в `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Основні шляхи ключів, охоплені тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних сесій ACP. Використовуйте BlueBubbles handle або цільовий рядок (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Повну конфігурацію каналу BlueBubbles задокументовано в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Не потрібні ані демон, ані порт.

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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.

- Потрібен Full Disk Access до бази даних Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на SSH-обгортку; встановіть `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тому переконайтеся, що ключ хоста relay уже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи конфігурації, ініційовані з iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сесій ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH-обгортки iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix підтримується extension і налаштовується в `channels.matrix`.

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
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначати його через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver. `proxy` і цей opt-in для мережі — незалежні механізми керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у конфігураціях із кількома обліковими записами.
- Типове значення `channels.matrix.autoJoin` — `off`, тому запрошені кімнати й нові запрошення в стилі DM ігноруються, доки ви не встановите `autoJoin: "allowlist"` разом із `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: власна доставка підтверджень exec для Matrix і авторизація тих, хто може підтверджувати.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto підтвердження exec активуються, коли тих, хто може підтверджувати, можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Matrix (наприклад `@owner:example.org`), яким дозволено підтверджувати exec-запити.
  - `agentFilter`: необов’язковий allowlist ID агентів. Не вказуйте, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на підтвердження. `"dm"` (типово), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сесії: `per-user` (типово) об’єднує за маршрутизованим peer, тоді як `per-room` ізолює кожну DM-кімнату.
- Перевірки статусу Matrix і живі пошуки в каталозі використовують ту саму політику проксі, що й runtime-трафік.
- Повну конфігурацію Matrix, правила націлювання та приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams підтримується extension і налаштовується в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Основні шляхи ключів, охоплені тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (облікові дані, Webhook, політика DM/груп, перевизначення для окремих команд/каналів) задокументовано в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC підтримується extension і налаштовується в `channels.irc`.

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
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.
- Повну конфігурацію каналу IRC (host/port/TLS/channels/allowlists/фільтрація за згадками) задокументовано в [IRC](/uk/channels/irc).

### Багатообліковий режим (усі канали)

Запускайте кілька облікових записів на канал (кожен зі своїм `accountId`):

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

- `default` використовується, коли `accountId` не вказано (CLI + маршрутизація).
- Токени середовища застосовуються лише до облікового запису **default**.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте не-типовий обліковий запис через `openclaw channels add` (або onboarding каналу), поки все ще використовуєте однокористувацьку конфігурацію каналу верхнього рівня, OpenClaw спочатку переносить значення верхнього рівня для одного облікового запису, що належать обліковому запису, у мапу облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default ціль.
- Наявні прив’язки лише каналу (без `accountId`) і далі відповідатимуть типовому обліковому запису; прив’язки з областю дії облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня для одного облікового запису, що належать обліковому запису, у підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default ціль.

### Інші extension-канали

Багато extension-каналів налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Дивіться повний індекс каналів: [Channels](/uk/channels).

### Фільтрація за згадками в групових чатах

Повідомлення груп типово **вимагають згадки** (метадані згадки або безпечні regex-шаблони). Це застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

**Типи згадок:**

- **Згадки в метаданих**: нативні @-згадки платформи. Ігноруються в режимі self-chat WhatsApp.
- **Текстові шаблони**: безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони та небезпечні вкладені повторення ігноруються.
- Фільтрація за згадками застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

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

Порядок визначення: перевизначення для окремого DM → значення провайдера за замовчуванням → без обмеження (зберігається все).

Підтримується: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Додайте власний номер до `allowFrom`, щоб увімкнути режим self-chat (ігнорує нативні @-згадки, відповідає лише на текстові шаблони):

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
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
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

- Цей блок налаштовує поверхні команд. Для поточного каталогу вбудованих + bundled команд див. [Slash Commands](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналам/Plugin, такі як QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовані на сторінках відповідних каналів/Plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, а для Slack залишає їх вимкненими.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, а для Slack залишає їх вимкненими.
- Перевизначення для каналу: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначуйте реєстрацію нативних команд Skills для каналу через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потрібні `tools.elevated.enabled` і відправник у `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; доступний лише для читання `/config show` лишається доступним для звичайних операторських клієнтів з областю запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, керованого OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin, встановлення та керування вмиканням/вимиканням.
- `channels.<provider>.configWrites` керує змінами конфігурації для кожного каналу (типово: true).
- Для багатооблікових каналів `channels.<provider>.accounts.<id>.configWrites` також керує записами, націленими на цей обліковий запис (наприклад `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. Типове значення: `true`.
- `ownerAllowFrom` — це явний owner allowlist для команд/інструментів лише для власника. Він відокремлений від `allowFrom`.
- `ownerDisplay: "hash"` хешує ID власника в системному prompt. Встановіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` є окремим для кожного провайдера. Якщо його встановлено, це **єдине** джерело авторизації (allowlist-и/ pairіng каналу та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не встановлено.
- Відображення документації команд:
  - каталог вбудованих + bundled команд: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд, специфічні для каналу: [Channels](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди pairing: [Pairing](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Типові значення агентів

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, що показується в рядку Runtime системного prompt. Якщо не встановлено, OpenClaw автоматично визначає його, підіймаючись вгору від workspace.

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
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Не вказуйте `agents.defaults.skills`, щоб типово не обмежувати Skills.
- Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
- Встановіть `agents.list[].skills: []`, щоб не використовувати жодних Skills.
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

Керує тим, коли bootstrap-файли workspace вставляються в системний prompt. Типове значення: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді помічника) пропускають повторну вставку bootstrap workspace, зменшуючи розмір prompt. Запуски Heartbeat і повторні спроби після Compaction усе одно перебудовують контекст.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на один bootstrap-файл workspace до обрізання. Типове значення: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що вставляються з усіх bootstrap-файлів workspace. Типове значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізається.
Типове значення: `"once"`.

- `"off"`: ніколи не вставляти текст попередження в системний prompt.
- `"once"`: вставляти попередження один раз для кожного унікального підпису обрізання (рекомендовано).
- `"always"`: вставляти попередження під час кожного запуску, якщо є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Мапа відповідальності за бюджет контексту

OpenClaw має кілька великих бюджетів prompt/контексту, і вони
навмисно розділені за підсистемами, а не проходять через один універсальний
параметр.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайна вставка bootstrap workspace.
- `agents.defaults.startupContext.*`:
  одноразова стартова преамбула для `/new` і `/reset`, включно з нещодавніми щоденними
  файлами `memory/*.md`.
- `skills.limits.*`:
  компактний список Skills, вставлений у системний prompt.
- `agents.defaults.contextLimits.*`:
  обмежені уривки runtime і вставлені блоки, що належать runtime.
- `memory.qmd.limits.*`:
  розмір уривків індексованого пошуку пам’яті та вставки.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою преамбулою першого ходу, що вставляється під час звичайних запусків `/new` і `/reset`.

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

Спільні типові значення для обмежених поверхонь контексту runtime.

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

- `memoryGetMaxChars`: типове обмеження уривка `memory_get` до додавання
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків для `memory_get`, коли `lines`
  не вказано.
- `toolResultMaxChars`: активне обмеження результату інструмента, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження уривка AGENTS.md, що використовується під час вставки
  оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних параметрів `contextLimits`. Не вказані поля успадковуються
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

Глобальне обмеження для компактного списку Skills, вставленого в системний prompt. Це
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

Перевизначення бюджету prompt Skills для окремого агента.

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

Нижчі значення зазвичай зменшують використання vision-токенів і розмір payload запиту для запусків із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного prompt (не для часових міток повідомлень). Якщо не задано, використовується часовий пояс хоста.

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
      params: { cacheRetention: "long" }, // global default provider params
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
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
  - Форма об’єкта задає основну модель плюс упорядковані моделі для failover.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як конфігурація його vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-1` для OpenAI Images.
  - Якщо ви безпосередньо вибираєте `provider/model`, також налаштуйте відповідну автентифікацію/API-ключ провайдера (наприклад `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` для `openai/*`, `FAL_KEY` для `fal/*`).
  - Якщо поле не вказано, `image_generate` усе одно може визначити типове значення провайдера з налаштованою автентифікацією. Спочатку він пробує поточного типового провайдера, потім — решту зареєстрованих провайдерів генерації зображень у порядку `provider-id`.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.5+`.
  - Якщо поле не вказано, `music_generate` усе одно може визначити типове значення провайдера з налаштованою автентифікацією. Спочатку він пробує поточного типового провайдера, потім — решту зареєстрованих провайдерів генерації музики в порядку `provider-id`.
  - Якщо ви безпосередньо вибираєте `provider/model`, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо поле не вказано, `video_generate` усе одно може визначити типове значення провайдера з налаштованою автентифікацією. Спочатку він пробує поточного типового провайдера, потім — решту зареєстрованих провайдерів генерації відео в порядку `provider-id`.
  - Якщо ви безпосередньо вибираєте `provider/model`, також налаштуйте відповідну автентифікацію/API-ключ провайдера.
  - Bundled провайдер генерації відео Qwen підтримує не більше 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд і параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` та `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо поле не вказано, інструмент PDF повертається до `imageModel`, а потім до визначеної моделі сесії/типової моделі.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, яку враховує режим резервного витягування в інструменті `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Типове значення: `"off"`.
- `elevatedDefault`: типовий рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типове значення: `"on"`.
- `model.primary`: формат `provider/model` (наприклад `openai/gpt-5.4`). Якщо ви пропускаєте провайдера, OpenClaw спочатку пробує alias, потім — унікальний збіг точно для цього ID моделі серед налаштованих провайдерів, і лише після цього повертається до налаштованого типового провайдера (застаріла сумісна поведінка, тому краще явно вказувати `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першої налаштованої пари провайдер/модель замість того, щоб показувати застаріле типове значення від видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), а потім `agents.list[].params` (для відповідного ID агента) перевизначає за ключами. Докладніше див. у [Prompt Caching](/uk/reference/prompt-caching).
- `embeddedHarness`: типова низькорівнева політика runtime для вбудованих агентів. Використовуйте `runtime: "auto"`, щоб зареєстровані harness Plugin могли брати на себе підтримувані моделі, `runtime: "pi"`, щоб примусово використовувати вбудований harness PI, або ID зареєстрованого harness, наприклад `runtime: "codex"`. Встановіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід до PI.
- Засоби запису конфігурації, які змінюють ці поля (наприклад `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну форму об’єкта та за можливості зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна сесія все одно серіалізується). Типове значення: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` керує тим, який низькорівневий виконавець запускає ходи вбудованого агента.
У більшості розгортань слід залишити типове значення `{ runtime: "auto", fallback: "pi" }`.
Використовуйте його, коли довірений Plugin надає нативний harness, наприклад bundled
harness сервера застосунку Codex.

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

- `runtime`: `"auto"`, `"pi"` або ID зареєстрованого harness Plugin. Bundled Plugin Codex реєструє `codex`.
- `fallback`: `"pi"` або `"none"`. `"pi"` зберігає вбудований harness PI як сумісний резервний варіант. `"none"` призводить до помилки, якщо вибраний harness Plugin відсутній або не підтримується, замість тихого використання PI.
- Перевизначення середовища: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` вимикає резервний перехід до PI для цього процесу.
- Для розгортань лише з Codex встановіть `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` і `embeddedHarness.fallback: "none"`.
- Це керує лише вбудованим chat harness. Генерація медіа, vision, PDF, музика, відео та TTS усе одно використовують свої налаштування провайдера/моделі.

**Вбудовані скорочення alias** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

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

Моделі Z.AI GLM-4.x автоматично вмикають режим thinking, якщо ви не встановите `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокової передачі викликів інструментів. Встановіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 типово використовується thinking `adaptive`, якщо явний рівень thinking не встановлено.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли провайдери API відмовляють.

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

- CLI-бекенди орієнтовані на текст; інструменти завжди вимкнені.
- Сесії підтримуються, коли встановлено `sessionArg`.
- Передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний prompt, зібраний OpenClaw, фіксованим рядком. Задається на типовому рівні (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє або таке, що містить лише пробіли, значення ігнорується. Корисно для контрольованих експериментів із prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

Періодичні запуски Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). Типове значення: `30m` (автентифікація через API-ключ) або `1h` (автентифікація через OAuth). Встановіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, прибирає розділ Heartbeat із системного prompt і пропускає вставку `HEARTBEAT.md` у bootstrap-контекст. Типове значення: `true`.
- `suppressToolErrorWarnings`: коли `true`, пригнічує payload-и попереджень про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента Heartbeat до його переривання. Якщо не вказано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/доставки в DM. `allow` (типово) дозволяє доставку на прямі цілі. `block` пригнічує доставку на прямі цілі та створює `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають із bootstrap-файлів workspace лише `HEARTBEAT.md`.
- `isolatedSession`: коли `true`, кожен запуск Heartbeat виконується в новій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у Cron `sessionTarget: "isolated"`. Зменшує вартість одного Heartbeat за токенами приблизно зі ~100K до ~2-5K токенів.
- Для окремого агента: встановіть `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, Heartbeat запускається **лише для цих агентів**.
- Heartbeat виконує повні ходи агента — коротші інтервали витрачають більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
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

- `mode`: `default` або `safeguard` (підсумовування чанками для довгої історії). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin провайдера Compaction. Якщо вказано, замість вбудованого LLM-підсумовування викликається `summarize()` провайдера. У разі помилки повертається до вбудованого варіанта. Встановлення провайдера примусово задає `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, перш ніж OpenClaw її перерве. Типове значення: `900`.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст щодо збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `postCompactionSections`: необов’язкові назви секцій H2/H3 з AGENTS.md для повторної вставки після Compaction. Типово `["Session Startup", "Red Lines"]`; встановіть `[]`, щоб вимкнути повторну вставку. Якщо не задано або явно задано цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основна сесія має залишатися на одній моделі, а підсумки Compaction — виконуватися на іншій; якщо не задано, Compaction використовує основну модель сесії.
- `notifyUser`: коли `true`, надсилає користувачеві короткі сповіщення, коли Compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction лишався безшумним.
- `memoryFlush`: тихий агентний хід перед автоматичним Compaction для збереження довготривалої пам’яті. Пропускається, коли workspace доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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
- `ttl` керує тим, як часто обрізання може запускатися знову (після останнього торкання кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім за потреби повністю очищає старіші результати інструментів.

**Soft-trim** зберігає початок і кінець та вставляє `...` посередині.

**Hard-clear** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не обрізаються і не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень помічника, обрізання пропускається.

</Accordion>

Деталі поведінки див. в [Session Pruning](/uk/concepts/session-pruning).

### Блокова потокова передача

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Канали, відмінні від Telegram, потребують явного `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення для каналу: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Для Signal/Slack/Discord/Google Chat типове значення `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Деталі поведінки й розбиття на чанки див. у [Streaming](/uk/concepts/streaming).

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

- Типові значення: `instant` для прямих чатів/згадок, `message` для групових чатів без згадок.
- Перевизначення для сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова sandbox-ізоляція для вбудованого агента. Повний довідник див. в [Sandboxing](/uk/gateway/sandboxing).

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
          // SecretRefs / inline contents also supported:
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

- `docker`: локальний runtime Docker (типово)
- `ssh`: універсальний віддалений runtime на основі SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для runtime, переносяться до
`plugins.entries.openshell.config`.

**Конфігурація backend SSH:**

- `target`: SSH-ціль у формі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, який використовується для workspace в кожній області
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, які OpenClaw матеріалізує у тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет SSH-автентифікації:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef визначаються з активного runtime-знімка секретів перед початком sandbox-сесії

**Поведінка backend SSH:**

- один раз ініціалізує віддалений workspace після створення або повторного створення
- потім зберігає віддалений SSH-workspace як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує sandbox-контейнери браузера

**Доступ до workspace:**

- `none`: workspace sandbox для кожної області в `~/.openclaw/sandboxes`
- `ro`: workspace sandbox у `/workspace`, workspace агента монтується лише для читання в `/agent`
- `rw`: workspace агента монтується для читання/запису в `/workspace`

**Область:**

- `session`: контейнер + workspace для кожної сесії
- `agent`: один контейнер + workspace на агента (типово)
- `shared`: спільний контейнер і workspace (без ізоляції між сесіями)

**Конфігурація Plugin OpenShell:**

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: ініціалізує віддалене середовище з локального перед `exec`, синхронізує назад після `exec`; локальний workspace залишається канонічним
- `remote`: один раз ініціалізує віддалене середовище, коли sandbox створюється, а потім зберігає віддалений workspace як канонічний

У режимі `remote` зміни на локальному хості, зроблені поза OpenClaw, після кроку ініціалізації не синхронізуються до sandbox автоматично.
Транспортом є SSH у sandbox OpenShell, але Plugin володіє життєвим циклом sandbox і необов’язковою синхронізацією mirror.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує виходу в мережу, записуваного root і користувача root.

**Контейнери типово використовують `network: "none"`** — встановіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихід назовні.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний варіант).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному workspace.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для окремого агента об’єднуються.

**Браузер у sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний prompt. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача noVNC типово використовує VNC-автентифікацію, а OpenClaw видає URL із короткоживучим токеном (замість відкриття пароля в спільному URL).

- `allowHostControl: false` (типово) блокує націлювання sandbox-сесій на браузер хоста.
- `network` типово дорівнює `openclaw-sandbox-browser` (виділена bridge-мережа). Встановлюйте `bridge` лише тоді, коли вам явно потрібна глобальна bridge-зв’язність.
- `cdpSourceRange` необов’язково обмежує вхідний CDP-трафік на межі контейнера діапазоном CIDR (наприклад `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера sandbox. Якщо задано (включно з `[]`), це замінює `docker.binds` для контейнера браузера.
- Типові параметри запуску визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для хостів із контейнерами:
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
  - `--disable-extensions` (типово увімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    типово увімкнені й можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо для використання WebGL/3D це потрібно.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш workflow
    залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; встановіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - а також `--no-sandbox` і `--disable-setuid-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовими для образу контейнера; використовуйте власний образ браузера з власним
    entrypoint, щоб змінити типові параметри контейнера.

</Accordion>

Sandboxing браузера і `sandbox.docker.binds` доступні лише для Docker.

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
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
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

- `id`: стабільний ID агента (обов’язково).
- `default`: якщо встановлено для кількох, перший перемагає (записується попередження). Якщо не встановлено ніде, типовим стає перший запис у списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні fallback). Завдання Cron, які перевизначають лише `primary`, усе одно успадковують типові fallback, якщо ви явно не встановите `fallbacks: []`.
- `params`: параметри потоку для окремого агента, що об’єднуються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень, як-от `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `skills`: необов’язковий allowlist Skills для окремого агента. Якщо не вказано, агент успадковує `agents.defaults.skills`, якщо воно задане; явний список замінює типові значення, а не об’єднується з ними, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язкове типове значення рівня thinking для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, якщо не встановлено перевизначення для повідомлення або сесії.
- `reasoningDefault`: необов’язкове типове значення видимості reasoning для окремого агента (`on | off | stream`). Застосовується, коли не встановлено перевизначення reasoning для повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення fast mode для окремого агента (`true | false`). Застосовується, коли не встановлено перевизначення fast-mode для повідомлення або сесії.
- `embeddedHarness`: необов’язкове перевизначення політики низькорівневого harness для окремого агента. Використовуйте `{ runtime: "codex", fallback: "none" }`, щоб зробити один агент лише Codex, тоді як інші агенти зберігатимуть типовий резервний PI.
- `runtime`: необов’язковий дескриптор runtime для окремого агента. Використовуйте `type: "acp"` із типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сесії harness ACP.
- `identity.avatar`: шлях відносно workspace, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist ID агентів для `sessions_spawn` (`["*"]` = будь-який; типово: лише той самий агент).
- Захист успадкування sandbox: якщо сесія-запитувач працює в sandbox, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: коли `true`, блокує виклики `sessions_spawn`, які не містять `agentId` (примушує до явного вибору профілю; типово: false).

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

### Поля збігу прив’язки

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній `type` типово означає route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; якщо пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічні для каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок збігу:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (для всього каналу)
6. Типовий агент

У межах кожного рівня перемагає перший відповідний запис `bindings`.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок рівнів прив’язки маршруту.

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

<Accordion title="Лише читання для інструментів + workspace">

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

Докладно про пріоритети див. в [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Деталі полів сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли спільний контекст справді потрібен).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM використовують головну сесію.
  - `per-peer`: ізоляція за ID відправника між каналами.
  - `per-channel-peer`: ізоляція для кожного каналу + відправника (рекомендовано для inbox з багатьма користувачами).
  - `per-account-channel-peer`: ізоляція для кожного облікового запису + каналу + відправника (рекомендовано для багатооблікового режиму).
- **`identityLinks`**: зіставлення канонічних ID із peer-ами з префіксом провайдера для спільного використання сесій між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Коли налаштовано обидва варіанти, спрацьовує той, що настає раніше.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` батьківської сесії, дозволене під час створення розгалуженої сесії потоку (типово `100000`).
  - Якщо значення `totalTokens` батьківської сесії перевищує це значення, OpenClaw запускає нову сесію потоку замість успадкування історії transcript батьківської сесії.
  - Встановіть `0`, щоб вимкнути цей захист і завжди дозволяти розгалуження від батьківської сесії.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для головного кошика direct-chat.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість зворотних ходів відповіді між агентами під час обміну agent-to-agent (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона має пріоритет.
- **`maintenance`**: керування очищенням сховища сесій + зберіганням.
  - `mode`: `warn` лише показує попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`).
  - `rotateBytes`: обертати `sessions.json`, коли він перевищує цей розмір (типово `10mb`).
  - `resetArchiveRetention`: строк зберігання архівів transcript `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; встановіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий жорсткий ліміт дискового бюджету для каталогу сесій. У режимі `warn` він журналює попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення за бюджетом. Типово дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив’язаних до потоків.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса через неактивність у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типове жорстке обмеження віку в годинах (`0` вимикає; провайдери можуть перевизначати)

</Accordion>

---

## Повідомлення

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
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
      debounceMs: 2000, // 0 disables
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

Визначення (перемагає найспецифічніше): обліковий запис → канал → глобальне. `""` вимикає і зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна           | Опис                    | Приклад                     |
| ---------------- | ----------------------- | --------------------------- |
| `{model}`        | Коротка назва моделі    | `claude-opus-4-6`           |
| `{modelFull}`    | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`     | Назва провайдера        | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking | `high`, `low`, `off`        |
| `{identity.name}` | Назва identity агента   | (те саме, що й `"auto"`)    |

Змінні нечутливі до регістру. `{think}` — це alias для `{thinkingLevel}`.

### Реакція підтвердження

- Типово дорівнює `identity.emoji` активного агента, інакше `"👀"`. Встановіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення identity.
- Область: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє реакцію підтвердження після відповіді в Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає реакції життєвого циклу статусу в Slack, Discord і Telegram.
  У Slack і Discord, якщо не встановлено, реакції статусу залишаються увімкненими, коли активні реакції підтвердження.
  У Telegram явно встановіть `true`, щоб увімкнути реакції життєвого циклу статусу.

### Debounce вхідних повідомлень

Об’єднує швидкі послідовні текстові повідомлення від одного й того самого відправника в один хід агента. Медіа/вкладення скидаються негайно. Керувальні команди оминають debounce.

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

- `auto` керує типовим режимом автоматичного TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує ефективний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумовування.
- `modelOverrides` типово увімкнено; `modelOverrides.allowProvider` типово дорівнює `false` (потрібне явне ввімкнення).
- API-ключі мають резервні варіанти `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- `openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `openai.baseUrl` вказує на endpoint, відмінний від OpenAI, OpenClaw трактує його як сумісний із OpenAI TTS-сервер і послаблює валідацію моделі/голосу.

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

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) підтримуються лише для сумісності й автоматично мігруються в `talk.providers.<provider>`.
- Для ID голосів використовуються резервні значення `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає відкриті рядки або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли API-ключ Talk не налаштовано.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні імена.
- `silenceTimeoutMs` керує тим, скільки режим Talk чекає після мовчання користувача перед надсиланням transcript. Якщо не встановлено, зберігається типове для платформи вікно паузи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Інструменти

### Профілі інструментів

`tools.profile` задає базовий allowlist перед `tools.allow`/`tools.deny`:

Локальний onboarding типово встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо значення не задано (наявні явні профілі зберігаються).

| Профіль     | Містить                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Без обмежень (те саме, що не задано)                                                                                            |

### Групи інструментів

| Група              | Інструменти                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як alias для `exec`)                                           |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Усі вбудовані інструменти (без Plugin провайдерів)                                                                     |

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона має пріоритет). Нечутлива до регістру, підтримує шаблони `*`. Застосовується навіть тоді, коли Docker sandbox вимкнено.

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

Керує elevated-доступом до `exec` поза sandbox:

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

- Перевизначення для окремого агента (`agents.list[].tools.elevated`) може лише додатково обмежувати доступ.
- `/elevated on|off|ask|full` зберігає стан для кожної сесії; вбудовані директиви застосовуються лише до одного повідомлення.
- Elevated `exec` оминає sandbox і використовує налаштований шлях виходу (`gateway` типово або `node`, коли ціль `exec` — `node`).

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

Перевірки безпеки циклів інструментів **типово вимкнені**. Встановіть `enabled: true`, щоб увімкнути виявлення.
Налаштування можна визначати глобально в `tools.loopDetection` і перевизначати для окремого агента в `agents.list[].tools.loopDetection`.

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

- `historySize`: максимальний обсяг історії викликів інструментів, що зберігається для аналізу циклів.
- `warningThreshold`: поріг повторюваних шаблонів без прогресу для попереджень.
- `criticalThreshold`: вищий поріг повторення для блокування критичних циклів.
- `globalCircuitBreakerThreshold`: поріг жорсткої зупинки для будь-якого запуску без прогресу.
- `detectors.genericRepeat`: попереджати про повторні виклики того самого інструмента з тими самими аргументами.
- `detectors.knownPollNoProgress`: попереджати/блокувати відомі інструменти опитування (`process.poll`, `command_status` тощо).
- `detectors.pingPong`: попереджати/блокувати чергування шаблонів пар без прогресу.
- Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, валідація не проходить.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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
        directSend: false, // opt-in: send finished async music/video directly to the channel
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

**Запис провайдера** (`type: "provider"` або не вказано):

- `provider`: id API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
- `model`: перевизначення ID моделі
- `profile` / `preferredProfile`: вибір профілю з `auth-profiles.json`

**Запис CLI** (`type: "cli"`):

- `command`: виконуваний файл для запуску
- `args`: шаблонізовані аргументи (підтримуються `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

**Спільні поля:**

- `capabilities`: необов’язковий список (`image`, `audio`, `video`). Типові значення: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
- У разі помилки використовується наступний запис.

Автентифікація провайдера дотримується стандартного порядку: `auth-profiles.json` → змінні середовища → `models.providers.*.apiKey`.

**Поля async completion:**

- `asyncCompletion.directSend`: коли `true`, завершені асинхронні завдання `music_generate`
  і `video_generate` спочатку намагаються доставити результат безпосередньо в канал. Типове значення: `false`
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

Керує тим, на які сесії можуть націлюватися інструменти сесій (`sessions_list`, `sessions_history`, `sessions_send`).

Типове значення: `tree` (поточна сесія + сесії, породжені нею, наприклад subagents).

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

- `self`: лише ключ поточної сесії.
- `tree`: поточна сесія + сесії, породжені поточною сесією (subagents).
- `agent`: будь-яка сесія, що належить поточному ID агента (може включати інших користувачів, якщо ви запускаєте сесії per-sender під тим самим ID агента).
- `all`: будь-яка сесія. Націлювання між агентами все одно потребує `tools.agentToAgent`.
- Обмеження sandbox: коли поточна сесія працює в sandbox і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibility примусово встановлюється в `tree`, навіть якщо `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Керує підтримкою вбудованих вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Примітки:

- Вкладення підтримуються лише для `runtime: "subagent"`. Runtime ACP їх відхиляє.
- Файли матеріалізуються в дочірньому workspace у `.openclaw/attachments/<uuid>/` разом із `.manifest.json`.
- Вміст вкладень автоматично редагується з persisted transcript.
- Входи Base64 перевіряються суворою перевіркою алфавіту/відступів і захистом розміру до декодування.
- Права доступу до файлів: `0700` для каталогів і `0600` для файлів.
- Очищення дотримується політики `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише тоді, коли `retainOnSessionKeep: true`.

### `tools.experimental`

Експериментальні прапори вбудованих інструментів. Типово вимкнені, якщо не спрацьовує правило автоматичного ввімкнення strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Примітки:

- `planTool`: вмикає структурований інструмент `update_plan` для відстеження нетривіальної багатокрокової роботи.
- Типове значення: `false`, якщо тільки `agents.defaults.embeddedPi.executionContract` (або перевизначення для окремого агента) не встановлено в `"strict-agentic"` для запуску OpenAI або OpenAI Codex сімейства GPT-5. Встановіть `true`, щоб примусово ввімкнути інструмент поза цією областю, або `false`, щоб тримати його вимкненим навіть для запусків strict-agentic GPT-5.
- Коли інструмент увімкнено, системний prompt також додає вказівки з використання, щоб модель застосовувала його лише для суттєвої роботи й тримала щонайбільше один крок у стані `in_progress`.

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

- `model`: типова модель для запущених subagents. Якщо не вказано, subagents успадковують модель викликача.
- `allowAgents`: типовий allowlist цільових ID агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; типово: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли виклик інструмента не містить `runTimeoutSeconds`. `0` означає відсутність тайм-ауту.
- Політика інструментів для subagents: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Користувацькі провайдери та base URL

OpenClaw використовує вбудований каталог моделей. Додавайте користувацьких провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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

- Використовуйте `authHeader: true` + `headers` для користувацьких потреб автентифікації.
- Перевизначайте корінь конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий alias змінної середовища).
- Пріоритет об’єднання для однакових ID провайдерів:
  - Непорожні значення `baseUrl` у `models.json` агента мають пріоритет.
  - Непорожні значення `apiKey` агента мають пріоритет лише тоді, коли цей провайдер не керується через SecretRef у поточному контексті config/auth-profile.
  - Значення `apiKey` провайдера, керовані через SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань) замість збереження визначених секретів.
  - Значення заголовків провайдера, керовані через SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань).
  - Порожні або відсутні `apiKey`/`baseUrl` агента повертаються до `models.providers` у конфігурації.
  - Для однакових моделей `contextWindow`/`maxTokens` використовують вище значення між явною конфігурацією та неявними значеннями каталогу.
  - Для однакових моделей `contextTokens` зберігають явне runtime-обмеження, якщо воно є; використовуйте це, щоб обмежити ефективний контекст без зміни нативних метаданих моделі.
  - Використовуйте `models.mode: "replace"`, якщо хочете, щоб конфігурація повністю переписала `models.json`.
  - Збереження маркерів є авторитетним щодо джерела: маркери записуються з активного знімка конфігурації джерела (до визначення), а не з визначених runtime-значень секретів.

### Деталі полів провайдера

- `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
- `models.providers`: мапа користувацьких провайдерів, ключована за id провайдера.
- `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
- `models.providers.*.apiKey`: облікові дані провайдера (краще використовувати SecretRef/підстановку env).
- `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` вставляє `options.num_ctx` у запити (типово: `true`).
- `models.providers.*.authHeader`: примусово передавати облікові дані в заголовку `Authorization`, коли це потрібно.
- `models.providers.*.baseUrl`: базовий URL upstream API.
- `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації проксі/tenant.
- `models.providers.*.request`: перевизначення транспорту для HTTP-запитів провайдера моделі.
  - `request.headers`: додаткові заголовки (об’єднуються з типовими значеннями провайдера). Значення приймають SecretRef.
  - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію провайдера), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов’язковим `prefix`).
  - `request.proxy`: перевизначення HTTP-проксі. Режими: `"env-proxy"` (використовувати змінні середовища `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими приймають необов’язковий підоб’єкт `tls`.
  - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: коли `true`, дозволяє HTTPS до `baseUrl`, якщо DNS визначається в приватні, CGNAT або подібні діапазони, через захист SSRF для HTTP fetch провайдера (opt-in оператора для довірених самохостованих endpoint OpenAI-compatible). WebSocket використовує той самий `request` для заголовків/TLS, але не цей захист SSRF fetch. Типове значення `false`.
- `models.providers.*.models`: явні записи каталогу моделей провайдера.
- `models.providers.*.models.*.contextWindow`: метадані нативного контекстного вікна моделі.
- `models.providers.*.models.*.contextTokens`: необов’язкове runtime-обмеження контексту. Використовуйте це, коли хочете менший ефективний бюджет контексту, ніж нативне `contextWindow` моделі.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` з непорожнім не-нативним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це значення в `false` під час runtime. Порожній/відсутній `baseUrl` зберігає типову поведінку OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для OpenAI-compatible chat endpoint, що підтримують лише рядки. Коли `true`, OpenClaw сплющує масиви чисто текстового `messages[].content` у звичайні рядки перед надсиланням запиту.
- `plugins.entries.amazon-bedrock.config.discovery`: кореневий блок налаштувань автоматичного виявлення Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр `provider-id` для цільового виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне контекстне вікно для виявлених моделей.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервний максимум вихідних токенів для виявлених моделей.

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

Встановіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або посилання `opencode-go/...` для каталогу Go. Скорочення: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

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

Встановіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` — прийнятні alias. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

- Загальний endpoint: `https://api.z.ai/api/paas/v4`
- Endpoint для кодування (типовий): `https://api.z.ai/api/coding/paas/v4`
- Для загального endpoint визначте користувацького провайдера з перевизначенням base URL.

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

Для endpoint у Китаї: `baseUrl: "https://api.moonshot.cn/v1"` або `openclaw onboard --auth-choice moonshot-api-key-cn`.

Нативні endpoint Moonshot декларують сумісність із використанням потокової передачі на спільному
транспорті `openai-completions`, і OpenClaw орієнтується на можливості endpoint
, а не лише на вбудований id провайдера.

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

Сумісний з Anthropic, вбудований провайдер. Скорочення: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

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

Base URL має не містити `/v1` (клієнт Anthropic додає його). Скорочення: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

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

Встановіть `MINIMAX_API_KEY`. Скорочення:
`openclaw onboard --auth-choice minimax-global-api` або
`openclaw onboard --auth-choice minimax-cn-api`.
Каталог моделей типово містить лише M2.7.
У сумісному з Anthropic шляху потокової передачі OpenClaw типово вимикає thinking MiniMax,
якщо ви явно самі не встановите `thinking`. `/fast on` або
`params.fastMode: true` переписує `MiniMax-M2.7` на
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Локальні моделі (LM Studio)">

Див. [Local Models](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному обладнанні; тримайте хостовані моделі об’єднаними для fallback.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: необов’язковий allowlist лише для bundled Skills (керовані Skills/workspace Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: коли `true`, віддає перевагу встановлювачам Homebrew, коли `brew`
  доступний, перш ніж переходити до інших типів встановлювачів.
- `install.nodeManager`: пріоритет node-встановлювача для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він bundled/встановлений.
- `entries.<skillKey>.apiKey`: зручне поле для Skills, які оголошують основну env-змінну (відкритий рядок або об’єкт SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
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
- Виявлення приймає нативні Plugins OpenClaw, а також сумісні bundled Codex і Claude, включно з bundled Claude без manifest у типовому макеті.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені Plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні Plugin (коли Plugin це підтримує).
- `plugins.entries.<id>.env`: мапа змінних середовища в області Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` та ігнорує поля зміни prompt із застарілого `before_agent_start`, зберігаючи застарілі `modelOverride` і `providerOverride`. Застосовується до нативних хуків Plugin і підтримуваних каталогів хуків, наданих bundled.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довірити цьому Plugin запитувати перевизначення `provider` і `model` для окремих запусків фонових subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли справді хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (перевіряється схемою нативного Plugin OpenClaw, коли вона доступна).
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Використовує резервне значення з `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або env-змінної `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту на scrape у секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok для пошуку (наприклад `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Фази й пороги див. у [Dreaming](/uk/concepts/dreaming).
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: розклад Cron для кожного повного проходу dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не є користувацькими ключами конфігурації).
- Повна конфігурація пам’яті описана в [Довіднику з конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені bundled Claude також можуть додавати вбудовані типові значення Pi із `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агентів, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати ID активного Plugin пам’яті або `"none"`, щоб вимкнути Plugins пам’яті.
- `plugins.slots.contextEngine`: вибрати ID активного Plugin рушія контексту; типове значення `"legacy"`, доки ви не встановите й не виберете інший рушій.
- `plugins.installs`: метадані встановлення, керовані CLI, які використовуються `openclaw plugins update`.
  - Містять `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Сприймайте `plugins.installs.*` як керований стан; надавайте перевагу командам CLI, а не ручному редагуванню.

Див. [Plugins](/uk/tools/plugin).

---

## Браузер

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація браузера типово залишається суворою.
- Встановлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації браузера в приватній мережі.
- У строгому режимі віддалені endpoint профілів CDP (`profiles.*.cdpUrl`) підлягають такому самому блокуванню приватної мережі під час перевірок досяжності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` усе ще підтримується як застарілий alias.
- У строгому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі attach-only (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися
  до вибраного хоста або через підключений browser Node.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлюватися на конкретний
  профіль браузера на базі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання CSS-селекторами, хуки завантаження одного файла,
  без перевизначення тайм-аутів діалогів, без `wait --load networkidle`,
  а також без `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Для локально керованих профілів `openclaw` автоматично призначаються `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Порядок автовиявлення: типовий браузер, якщо він на базі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Служба керування: лише loopback (порт виводиться з `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапори запуску до локального старту Chromium (наприклад
  `--disable-gpu`, розмір вікна або відлагоджувальні прапори).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: колір акценту для chrome нативного UI застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення identity для UI керування. Якщо не задано, використовується identity активного агента.

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
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
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
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
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

<Accordion title="Деталі полів Gateway">

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі alias bind**: використовуйте значення режимів bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не alias хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типове значення bind `loopback` слухає `127.0.0.1` всередині контейнера. За bridge-мережі Docker (`-p 18789:18789`) трафік надходить на `eth0`, тож gateway недоступний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: типово обов’язкова. Bind, відмінні від loopback, потребують auth для gateway. На практиці це означає спільний token/password або reverse proxy з урахуванням identity з `gateway.auth.mode: "trusted-proxy"`. Майстер onboarding типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRef), явно встановіть `gateway.auth.mode` у `token` або `password`. Потоки запуску та встановлення/відновлення сервісу завершуються помилкою, якщо налаштовано обидва, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних конфігурацій local loopback; цей варіант навмисно не пропонується в prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегує auth reverse proxy з урахуванням identity і довіряє заголовкам identity від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy loopback на тому самому хості не задовольняють auth trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки identity Tailscale Serve можуть задовольняти auth для UI керування/WebSocket (перевіряється через `tailscale whois`). Endpoint HTTP API **не** використовують цю auth заголовками Tailscale; натомість вони дотримуються звичайного режиму HTTP auth gateway. Цей потік без token передбачає, що хост gateway є довіреним. Типове значення `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб auth. Застосовується для кожного IP клієнта і для кожної області auth окремо (спільний секрет і token пристрою відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - В асинхронному шляху UI керування Tailscale Serve невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом про невдачу. Тому одночасні хибні спроби від того самого клієнта можуть спрацювати на обмежувач уже на другому запиті замість того, щоб обидві пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово дорівнює `true`; встановіть `false`, коли свідомо хочете також обмежувати localhost-трафік (для тестових конфігурацій або строгих розгортань через proxy).
- Спроби auth WS з джерелом браузера завжди обмежуються без винятку для loopback (додатковий захист від brute force localhost із браузера).
- На loopback ці блокування для джерел браузера ізольовані за нормалізованим значенням `Origin`,
  тому повторні невдачі з одного localhost-origin не блокують автоматично
  інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічний, вимагає auth).
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень Gateway WebSocket. Обов’язковий, коли очікуються клієнти браузера з origin, відмінних від loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, що вмикає fallback origin через заголовок Host для розгортань, які навмисно покладаються на політику origin заголовка Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійне перевизначення на боці клієнта, яке дозволяє відкритий `ws://` до довірених IP приватної мережі; типове обмеження для відкритого трафіку лишається лише для loopback.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі собою не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL зовнішнього relay APNs, який використовується офіційними/TestFlight збірками iOS після публікації relay-backed реєстрацій у gateway. Цей URL має збігатися з URL relay, скомпільованим у збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання gateway-to-relay у мілісекундах. Типове значення `10000`.
- Relay-backed реєстрації делегуються конкретній identity gateway. Парний застосунок iOS викликає `gateway.identity.get`, включає цю identity в relay-реєстрацію та передає gateway дозвіл на надсилання в межах цієї реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env-перевизначення для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний варіант лише для розробки для loopback HTTP relay URL. У production URL relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал монітора справності каналів у хвилинах. Встановіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типове значення: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типове значення: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/обліковий запис протягом ковзної години. Типове значення: `10`.
- `channels.<provider>.healthMonitor.enabled`: перевизначення для окремого каналу, щоб відмовитися від перезапусків health-monitor, залишивши глобальний монітор увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в багатооблікових каналах. Якщо задано, має пріоритет над перевизначенням рівня каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і вони не визначилися, визначення завершується fail-closed (без маскувального резервного переходу до remote).
- `trustedProxies`: IP reverse proxy, які завершують TLS або вставляють заголовки пересланого клієнта. Додавайте лише proxy, які ви контролюєте. Записи loopback усе ще припустимі для налаштувань proxy/локального виявлення на тому самому хості (наприклад Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типове значення `false` для fail-closed поведінки.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий список заборон).
- `gateway.tools.allow`: прибирає назви інструментів із типового списку заборон HTTP.

</Accordion>

### Endpoint OpenAI-compatible

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Захист URL-входу для Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist сприймаються як не задані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посиленого захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (встановлюйте лише для HTTPS-origin, які ви контролюєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька gateway на одному хості з унікальними портами і каталогами стану:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні прапори: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

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

- `enabled`: вмикає завершення TLS на слухачі gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, якщо явні файли не налаштовано; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файла сертифіката TLS.
- `keyPath`: шлях файлової системи до файла приватного ключа TLS; тримайте з обмеженими правами доступу.
- `caPath`: необов’язковий шлях до набору CA для перевірки клієнта або користувацьких ланцюжків довіри.

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
  - `"off"`: ігнорувати live-зміни; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway при зміні конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку пробувати hot reload; за потреби переходити до перезапуску.
- `debounceMs`: вікно debounce в мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: максимальний час у мс очікування завершення операцій у процесі перед примусовим перезапуском (типово: `300000` = 5 хвилин).

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
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
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
Query-string token для hooks відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` потребує непорожній `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання token Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежуйте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із payload запиту приймається лише тоді, коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → визначається через `hooks.mappings`

<Accordion title="Деталі mappings">

- `match.path` відповідає підшляху після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` відповідає полю payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають значення з payload.
- `transform` може вказувати на модуль JS/TS, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і лишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID повертаються до типового.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або не вказано = дозволити все, `[]` = заборонити все).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий allowlist префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово дорівнює `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволений, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

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

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, якщо це налаштовано. Встановіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
- Не запускайте окремий `gog gmail watch serve` паралельно з Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Обслуговує редаговані агентом HTML/CSS/JS і A2UI через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: зберігайте `gateway.bind: "loopback"` (типово).
- Для bind, відмінних від loopback: маршрути canvas вимагають auth Gateway (token/password/trusted-proxy), так само як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після того як node спарено й підключено, Gateway рекламує URL можливостей із областю node для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії node і швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live-reload у HTML, що обслуговується.
- Автоматично створює стартовий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
- Вимикайте live reload для великих каталогів або при помилках `EMFILE`.

---

## Виявлення

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

- `minimal` (типово): не включає `cliPath` + `sshPort` до TXT-записів.
- `full`: включає `cliPath` + `sshPort`.
- Ім’я хоста типово `openclaw`. Перевизначайте через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast DNS-SD zone у `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте з DNS-сервером (рекомендовано CoreDNS) + split DNS Tailscale.

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

- Вбудовані env-змінні застосовуються лише тоді, коли в середовищі процесу відсутній цей ключ.
- Файли `.env`: `.env` поточного робочого каталогу + `~/.openclaw/.env` (жоден не перевизначає вже наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої shell входу.
- Повний пріоритет див. в [Environment](/uk/help/environment).

### Підстановка env-змінних

Посилайтеся на env-змінні в будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Відповідають лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: відкриті значення й далі працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` для `source: "exec"` не повинні містити сегменти шляху `.` або `..`, розділені `/` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання в `auth-profiles.json` включені до runtime-визначення та покриття аудиту.

### Конфігурація провайдерів секретів

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
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

- Провайдер `file` підтримує `mode: "json"` і `mode: "singleValue"` (у режимі singleValue `id` має дорівнювати `"value"`).
- Провайдер `exec` вимагає абсолютний шлях `command` і використовує payload-и протоколу через stdin/stdout.
- Типово шляхи команд-symlink відхиляються. Встановіть `allowSymlinkCommand: true`, щоб дозволити шляхи symlink із перевіркою визначеного цільового шляху.
- Якщо налаштовано `trustedDirs`, перевірка довірених каталогів застосовується до визначеного цільового шляху.
- Середовище дочірнього процесу `exec` типово мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети визначаються в момент активації у знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Під час активації застосовується фільтрація активної поверхні: невизначені посилання на увімкнених поверхнях призводять до помилки запуску/reload, тоді як неактивні поверхні пропускаються з діагностикою.

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
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні runtime-облікові дані надходять зі знімків у пам’яті; застарілі статичні записи `auth.json` очищуються, коли їх виявлено.
- Застарілий імпорт OAuth із `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка runtime секретів і інструменти `audit/configure/apply`: [Керування секретами](/uk/gateway/secrets).

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

- `billingBackoffHours`: базовий backoff у годинах, коли профіль завершується помилкою через справжні
  billing/недостатній кредит (типово: `5`). Явний текст про billing все одно може
  потрапити сюди навіть у відповідях `401`/`403`, але
  provider-specific зіставлення тексту залишаються прив’язаними до провайдера, якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані повідомлення `402` про вікно використання або
  ліміти витрат організації/workspace натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин backoff для billing за провайдером.
- `billingMaxHours`: межа в годинах для експоненційного зростання billing backoff (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для високовпевнених збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: межа в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile в межах одного провайдера для помилок перевантаження перед переходом до fallback моделі (типово: `1`). Сюди потрапляють форми зайнятості провайдера, як-от `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile в межах одного провайдера для помилок rate-limit перед переходом до fallback моделі (типово: `1`). Цей кошик rate-limit включає специфічний для провайдера текст, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

---

## Логування

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

- Типовий файл журналу: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Встановіть `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug`, коли використано `--verbose`.
- `maxFileBytes`: максимальний розмір файла журналу в байтах, після якого запис припиняється (додатне ціле число; типово: `524288000` = 500 MB). Для production-розгортань використовуйте зовнішню ротацію журналів.

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

- `enabled`: головний перемикач для виводу інструментування (типово: `true`).
- `flags`: масив рядків-прапорів, які вмикають цільовий вивід журналу (підтримує wildcard-и, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для виведення попереджень про завислі сесії, поки сесія лишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`).
- `otel.endpoint`: URL collector для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, які надсилаються разом із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: вмикають експорт trace, metrics або logs.
- `otel.sampleRate`: частота вибірки trace `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання telemetry у мс.
- `cacheTrace.enabled`: журналювати знімки trace кешу для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL trace кешу (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід trace кешу (усі типово: `true`).

---

## Оновлення

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

- `channel`: канал релізів для npm/git-встановлень — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для встановлень пакетів (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автоматичним застосуванням stable-каналу (типово: `6`; максимум: `168`).
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

- `enabled`: глобальний feature gate для ACP (типово: `false`).
- `dispatch.enabled`: незалежний gate для dispatch ходу сесії ACP (типово: `true`). Встановіть `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: ID типового runtime-backend ACP (має відповідати зареєстрованому Plugin runtime ACP).
- `defaultAgent`: резервний ID цільового агента ACP, коли spawn не задає явної цілі.
- `allowedAgents`: allowlist ID агентів, дозволених для runtime-сесій ACP; порожній список означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір chunk перед розбиттям проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів на кожен хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: розділювач перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу помічника, що проєктується на один хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів до булевих перевизначень видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для працівників сесії ACP до можливого очищення.
- `runtime.installCommand`: необов’язкова команда встановлення для запуску під час bootstrap середовища runtime ACP.

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
  - `"default"`: фіксований нейтральний tagline (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту tagline (назва/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише tagline), встановіть env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Метадані, які записуються потоками керованого налаштування CLI (`onboard`, `configure`, `doctor`):

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

Див. поля identity у `agents.list` в розділі [Типові значення агентів](#agent-defaults).

---

## Bridge (застаріле, видалено)

Поточні збірки більше не містять TCP bridge. Node підключаються через Gateway WebSocket. Ключі `bridge.*` більше не входять до схеми конфігурації (валідація завершується помилкою, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Застаріла конфігурація bridge (історична довідка)">

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
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків Cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених transcript Cron. Типове значення: `24h`; встановіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір одного файла журналу запуску (`cron/runs/<jobId>.jsonl`) перед очищенням. Типове значення: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, які зберігаються, коли спрацьовує очищення журналу запуску. Типове значення: `2000`.
- `webhookToken`: bearer token, який використовується для доставлення POST на webhook Cron (`delivery.mode = "webhook"`); якщо не вказано, заголовок auth не надсилається.
- `webhook`: застарілий резервний URL webhook (http/https), який використовується лише для збережених завдань, що все ще мають `notify: true`.

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
- `retryOn`: типи помилок, які запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не вказуйте, щоб повторювати для всіх тимчасових типів.

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
- `after`: кількість послідовних збоїв перед надсиланням сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` надсилає POST на налаштований webhook.
- `accountId`: необов’язковий ID облікового запису або каналу для обмеження області доставки сповіщення.

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
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних про ціль.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна announce-ціль або URL webhook. Обов’язкове для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальну, ні для окремого завдання ціль збою, завдання, які вже доставляють через `announce`, у разі збою повертаються до цієї основної announce-цілі.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблону, які розгортаються в `tools.media.models[].args`:

| Змінна            | Опис                                            |
| ----------------- | ----------------------------------------------- |
| `{{Body}}`        | Повний текст вхідного повідомлення              |
| `{{RawBody}}`     | Сирий текст (без обгорток історії/відправника)  |
| `{{BodyStripped}}` | Текст без згадок групи                         |
| `{{From}}`        | Ідентифікатор відправника                       |
| `{{To}}`          | Ідентифікатор призначення                       |
| `{{MessageSid}}`  | ID повідомлення каналу                          |
| `{{SessionId}}`   | Поточний UUID сесії                             |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію             |
| `{{MediaUrl}}`    | Псевдо-URL вхідного медіа                       |
| `{{MediaPath}}`   | Локальний шлях до медіа                         |
| `{{MediaType}}`   | Тип медіа (image/audio/document/…)              |
| `{{Transcript}}`  | Аудіоtranscript                                 |
| `{{Prompt}}`      | Визначений media prompt для записів CLI         |
| `{{MaxChars}}`    | Визначена максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`    | `"direct"` або `"group"`                        |
| `{{GroupSubject}}` | Тема групи (best effort)                       |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`  | Відображуване ім’я відправника (best effort)    |
| `{{SenderE164}}`  | Номер телефону відправника (best effort)        |
| `{{Provider}}`    | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Include конфігурації (`$include`)

Розбивайте конфігурацію на кілька файлів:

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
- Масив файлів: глибоко об’єднується по порядку (пізніші перевизначають попередні).
- Сусідні ключі: об’єднуються після include (перевизначають включені значення).
- Вкладені include: до 10 рівнів глибини.
- Шляхи: визначаються відносно файла, який включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми/форми `../` дозволені лише тоді, коли після визначення вони все одно лишаються в межах цієї межі.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок парсингу та циклічних include.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_
