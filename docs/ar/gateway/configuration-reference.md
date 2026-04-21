---
read_when:
    - أنت بحاجة إلى دلالات إعدادات دقيقة على مستوى الحقول أو إلى القيم الافتراضية
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-21T07:19:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82a9a150a862c20863c187ac5c118b74aeac624e99849cf4c6e3fb56629423e
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع الإعدادات

مرجع الإعدادات الأساسي لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة بالمهام، راجع [الإعدادات](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح إعدادات OpenClaw الرئيسية وتضع روابط خارجية عندما يكون لأحد الأنظمة الفرعية مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل فهرس أوامر تملكه القنوات/Plugin أو كل إعداد عميق للذاكرة/QMD في صفحة واحدة.

مصدر الحقيقة في الكود:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات metadata الخاصة بالقنوات/Plugin المضمنة عند توفرها
- يعيد `config.schema.lookup` عقدة schema واحدة محددة بالمسار لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من hash الأساسي لوثائق الإعدادات مقابل سطح schema الحالي

المراجع العميقة المخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming تحت `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لفهرس الأوامر المضمنة + المجمعة الحالي
- صفحات القناة/Plugin المالكة لأسطح الأوامر الخاصة بكل قناة

صيغة الإعدادات هي **JSON5** (تُسمح التعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

تبدأ كل قناة تلقائيًا عندما يوجد قسم إعداداتها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                         |
| ---------------------- | -------------------------------------------------------------- |
| `pairing` (افتراضي)    | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist`            | فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن) |
| `open`                 | السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled`             | تجاهل كل الرسائل المباشرة الواردة                              |

| سياسة المجموعات         | السلوك                                                     |
| ---------------------- | ---------------------------------------------------------- |
| `allowlist` (افتراضي)  | فقط المجموعات المطابقة لقائمة السماح المهيأة               |
| `open`                 | تجاوز قوائم سماح المجموعات (مع استمرار تطبيق بوابة الإشارة) |
| `disabled`             | حظر كل رسائل المجموعات/الغرف                               |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بموفّر معيّنة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويُحدَّد الحد الأقصى لطلبات اقتران الرسائل المباشرة المعلقة عند **3 لكل قناة**.
إذا كانت كتلة الموفّر مفقودة بالكامل (غياب `channels.<provider>`)، فإن سياسة المجموعات وقت التشغيل تعود إلى `allowlist` (إغلاق افتراضي) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات معينة على نموذج محدد. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المهيأة. ويُطبَّق ربط القناة عندما لا تكون للجلسة بالفعل قيمة تجاوز للنموذج (مثلًا، تم ضبطها عبر `/model`).

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

### القيم الافتراضية للقنوات وHeartbeat

استخدم `channels.defaults` للسلوك المشترك لسياسة المجموعات وHeartbeat عبر الموفّرين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما لا تكون `groupPolicy` على مستوى الموفّر معيّنة.
- `channels.defaults.contextVisibility`: وضع رؤية السياق الإضافي الافتراضي لكل القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/الخيط/السجل)، و`allowlist` (تضمين السياق فقط من المرسلين الموجودين في قائمة السماح)، و`allowlist_quote` (مثل allowlist لكن مع الإبقاء على سياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/التي بها أخطاء في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat مضغوطة بأسلوب المؤشر.

### WhatsApp

يعمل WhatsApp من خلال قناة الويب الخاصة بـ Gateway ‏(Baileys Web). ويبدأ تلقائيًا عند وجود جلسة مرتبطة.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // العلامات الزرقاء (false في وضع الدردشة الذاتية)
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

<Accordion title="WhatsApp متعدد الحسابات">

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

- تفترض الأوامر الصادرة الحساب `default` إذا كان موجودًا؛ وإلا أول معرّف حساب مهيأ (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري هذا الاختيار الافتراضي الاحتياطي للحساب عندما يطابق معرّف حساب مهيأ.
- ينقل `openclaw doctor` دليل مصادقة Baileys القديم أحادي الحساب إلى `whatsapp/default`.
- تجاوزات لكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts` و`channels.whatsapp.accounts.<id>.dmPolicy` و`channels.whatsapp.accounts.<id>.allowFrom`.

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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفَض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، اضبط قيمة افتراضية صريحة (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذر `openclaw doctor` عندما تكون هذه القيمة مفقودة أو غير صالحة.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Telegram ‏(نقل معرّفات supergroup، و`/config set|unset`).
- تهيّئ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط ACP دائمًا لموضوعات المنتدى (استخدم الصيغة القياسية `chatId:topic:topicId` في `match.peer.id`). وتكون دلالات الحقول مشتركة في [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات تدفق Telegram ‏`sendMessage` + `editMessageText` ‏(وتعمل في الدردشات المباشرة والجماعية).
- سياسة إعادة المحاولة: راجع [سياسة إعادة المحاولة](/ar/concepts/retry).

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
        spawnSubagentSessions: false, // اشتراك اختياري لـ sessions_spawn({ thread: true })
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

- الرمز المميز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` صريحًا لـ Discord هذا الرمز المميز في الاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب قادمة من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- استخدم `user:<id>` ‏(رسالة مباشرة) أو `channel:<id>` ‏(قناة guild) لأهداف التسليم؛ وتُرفَض المعرّفات الرقمية المجردة.
- تكون slugs الخاصة بـ Guild بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المُحوَّل إلى slug ‏(من دون `#`). ويفضَّل استخدام معرّفات guild.
- تُتجاهل الرسائل التي يكتبها البوت افتراضيًا. يفعّل `allowBots: true` قبولها؛ واستخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (مع استمرار تصفية رسائل البوت نفسه).
- يُسقِط `channels.discord.guilds.<id>.ignoreOtherMentions` ‏(وتجاوزات القناة) الرسائل التي تذكر مستخدمًا آخر أو دورًا آخر من دون ذكر البوت (باستثناء @everyone/@here).
- يقسم `maxLinesPerMessage` ‏(الافتراضي 17) الرسائل الطويلة عموديًا حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بخيوط Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالخيوط (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` للتعطيل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` للتعطيل)
  - `spawnSubagentSessions`: مفتاح اشتراك اختياري لإنشاء/ربط الخيوط تلقائيًا في `sessions_spawn({ thread: true })`
- تهيّئ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط ACP دائمًا للقنوات والخيوط (استخدم معرّف القناة/الخيط في `match.peer.id`). وتكون دلالات الحقول مشتركة في [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات Discord components v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية بالإضافة إلى الانضمام التلقائي الاختياري + تجاوزات TTS.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` ‏(`true` و`24` افتراضيًا).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة/إعادة الانضمام إلى جلسة صوتية بعد تكرار إخفاقات فك التشفير.
- `channels.discord.streaming` هو مفتاح وضع التدفق القياسي. وتُنقَل قيم `streamMode` القديمة وقيم `streaming` المنطقية تلقائيًا.
- يربط `channels.discord.autoPresence` التوفر وقت التشغيل بحالة حضور البوت (سليم => online، ومتدهور => idle، ومرهَق => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل المطابقة بالاسم/الوسم القابلين للتغيير (وضع توافق طارئ).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلية في Discord وتفويض الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` ‏(الافتراضي). في الوضع التلقائي، تُفعَّل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. ويعود إلى `commands.ownerAllowFrom` عند عدم ضبطه.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` ‏(الافتراضي) إلى الرسائل المباشرة للموافقين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. وعندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا بواسطة الموافقين الذين جرى حلهم.
  - `cleanupAfterResolve`: عندما تكون `true`، تحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** `off` ‏(لا شيء)، و`own` ‏(رسائل البوت، الافتراضي)، و`all` ‏(كل الرسائل)، و`allowlist` ‏(من `guilds.<id>.users` على جميع الرسائل).

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

- JSON حساب الخدمة: مضمن (`serviceAccount`) أو معتمد على ملف (`serviceAccountFile`).
- كما أن SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- القيم الاحتياطية للبيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة email principal القابلة للتغيير (وضع توافق طارئ).

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

- يتطلب **وضع Socket** كِلا `botToken` و`appToken` ‏(`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كقيمة احتياطية من البيئة للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` بالإضافة إلى `signingSecret` ‏(في الجذر أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل
  نصية صريحة أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل بيانات الاعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus` و`signingSecretStatus`
  في وضع HTTP. وتعني `configured_unavailable` أن الحساب
  مهيأ عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن
  من حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- `channels.slack.streaming.mode` هو مفتاح وضع تدفق Slack القياسي. ويتحكم `channels.slack.streaming.nativeTransport` في النقل الأصلي للتدفق في Slack. وتُنقَل قيم `streamMode` القديمة وقيم `streaming` المنطقية و`nativeStreaming` تلقائيًا.
- استخدم `user:<id>` ‏(رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** `off` و`own` ‏(الافتراضي) و`all` و`allowlist` ‏(من `reactionAllowlist`).

**عزل جلسة الخيط:** يكون `thread.historyScope` لكل خيط على حدة (الافتراضي) أو مشتركًا على مستوى القناة. ويقوم `thread.inheritParent` بنسخ سجل القناة الأصلية إلى الخيوط الجديدة.

- يتطلب التدفق الأصلي في Slack بالإضافة إلى حالة الخيط بأسلوب مساعد Slack "is typing..." هدف رد داخل خيط. وتبقى الرسائل المباشرة العليا خارج الخيط افتراضيًا، لذا تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بأسلوب الخيط.
- تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم تزيله عند الإكمال. استخدم رمز Slack emoji مختصرًا مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات التنفيذ الأصلية في Slack وتفويض الموافقين. المخطط نفسه كما في Discord: ‏`enabled` ‏(`true`/`false`/`"auto"`)، و`approvers` ‏(معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` ‏(`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراء | الافتراضي | ملاحظات                    |
| -------------- | --------- | -------------------------- |
| reactions      | مفعّل     | التفاعل + سرد التفاعلات    |
| messages       | مفعّل     | قراءة/إرسال/تحرير/حذف      |
| pins           | مفعّل     | تثبيت/إلغاء تثبيت/سرد      |
| memberInfo     | مفعّل     | معلومات العضو              |
| emojiList      | مفعّل     | قائمة emoji المخصصة        |

### Mattermost

يُشحَن Mattermost على هيئة Plugin: ‏`openclaw plugins install @openclaw/mattermost`.

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
        native: true, // اشتراك اختياري
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // عنوان URL صريح اختياري لعمليات النشر عبر reverse-proxy/العامة
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

أوضاع الدردشة: `oncall` ‏(الرد عند @-mention، الافتراضي)، و`onmessage` ‏(كل رسالة)، و`onchar` ‏(الرسائل التي تبدأ ببادئة المشغّل).

عندما تكون الأوامر الأصلية لـ Mattermost مفعّلة:

- يجب أن يكون `commands.callbackPath` مسارًا (مثل `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يحل `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تُوثَّق عمليات الاستدعاء العكسي الأصلية للشرطة المائلة بواسطة الرموز
  المميزة لكل أمر التي يعيدها Mattermost أثناء تسجيل أمر الشرطة المائلة. وإذا فشل التسجيل أو لم
  تُفعَّل أي أوامر، يرفض OpenClaw عمليات الاستدعاء العكسي برسالة
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء العكسي الخاصين/الداخليين/Tailscale، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء العكسي.
  استخدم قيم المضيف/النطاق، وليس عناوين URL الكاملة.
- `channels.mattermost.configWrites`: السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها Mattermost.
- `channels.mattermost.requireMention`: اشتراط `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز بوابة الإشارة لكل قناة (`"*"` للقيمة الافتراضية).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // ربط حساب اختياري
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

**أوضاع إشعارات التفاعل:** `off` و`own` ‏(الافتراضي) و`all` و`allowlist` ‏(من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها Signal.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

### BlueBubbles

يُعد BlueBubbles المسار الموصى به لـ iMessage ‏(مدعومًا عبر Plugin، ويُهيّأ تحت `channels.bluebubbles`).

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.bluebubbles` و`channels.bluebubbles.dmPolicy`.
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم BlueBubbles handle أو سلسلة target ‏(`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- إعداد قناة BlueBubbles الكامل موثق في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يشغّل OpenClaw ‏`imsg rpc` ‏(JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد الدردشات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ واضبط `remoteHost` ‏(`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP التحقق الصارم من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو المنع لعمليات كتابة الإعدادات التي يبدأها iMessage.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم handle مطبعًا أو هدف دردشة صريحًا (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

القناة Matrix مدعومة عبر extension وتُهيّأ تحت `channels.matrix`.

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

- تستخدم مصادقة الرمز المميز `accessToken`؛ وتستخدم مصادقة كلمة المرور `userId` + `password`.
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر HTTP(S) proxy صريح. ويمكن للحسابات المسماة تجاوزه عبر `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. و`proxy` وهذا الاشتراك الاختياري للشبكة عنصران مستقلان.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذا تُتجاهل الغرف المدعوّة ودعوات الرسائل المباشرة الجديدة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات التنفيذ الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` ‏(الافتراضي). في الوضع التلقائي، تُفعَّل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix ‏(مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` ‏(الافتراضي)، أو `"channel"` ‏(الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل المباشرة في Matrix إلى جلسات: يشارك `per-user` ‏(الافتراضي) حسب peer الموجّه، بينما يعزل `per-room` كل غرفة رسائل مباشرة.
- تستخدم تحققات الحالة في Matrix وعمليات البحث في الدليل الحي سياسة proxy نفسها مثل حركة وقت التشغيل.
- إعداد Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد موثقة في [Matrix](/ar/channels/matrix).

### Microsoft Teams

القناة Microsoft Teams مدعومة عبر extension وتُهيّأ تحت `channels.msteams`.

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.msteams` و`channels.msteams.configWrites`.
- إعداد Teams الكامل (بيانات الاعتماد، وWebhook، وسياسة الرسائل المباشرة/المجموعات، والتجاوزات لكل team/per-channel) موثق في [Microsoft Teams](/ar/channels/msteams).

### IRC

القناة IRC مدعومة عبر extension وتُهيّأ تحت `channels.irc`.

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.irc` و`channels.irc.dmPolicy` و`channels.irc.configWrites` و`channels.irc.nickserv.*`.
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الإشارة) موثق في [IRC](/ar/channels/irc).

### تعدد الحسابات (كل القنوات)

شغّل عدة حسابات لكل قناة (كل منها مع `accountId` خاص به):

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

- يُستخدم `default` عند حذف `accountId` ‏(CLI + التوجيه).
- تنطبق رموز البيئة فقط على الحساب **default**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم تُتجاوز لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` ‏(أو onboarding للقناة) بينما لا تزال على إعداد قناة أحادي الحساب في المستوى الأعلى، فسيقوم OpenClaw أولًا بترقية القيم العليا أحادية الحساب المحددة على نطاق الحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف named/default موجود ومطابق.
- تستمر عمليات الربط الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتظل عمليات الربط المحددة على نطاق الحساب اختيارية.
- يقوم `openclaw doctor --fix` أيضًا بإصلاح الأشكال المختلطة عبر نقل القيم العليا أحادية الحساب المحددة على نطاق الحساب إلى الحساب المرفّع المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف named/default موجود ومطابق.

### قنوات extension أخرى

تُهيّأ كثير من قنوات extension على شكل `channels.<id>` وتُوثَّق في صفحات القنوات المخصصة لها (مثل Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الإشارة في الدردشات الجماعية

تكون رسائل المجموعات افتراضيًا **تتطلب إشارة** (إشارة metadata أو أنماط regex آمنة). ينطبق ذلك على دردشات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الإشارة:**

- **إشارات Metadata**: إشارات @ الأصلية على المنصة. تُتجاهل في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. تُتجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- تُفرَض بوابة الإشارة فقط عندما يكون الاكتشاف ممكنًا (الإشارات الأصلية أو وجود نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات التجاوز عبر `channels.<channel>.historyLimit` ‏(أو لكل حساب). اضبط `0` للتعطيل.

#### حدود سجل الرسائل المباشرة

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

آلية الحل: تجاوز لكل رسالة مباشرة → افتراضي الموفّر → بلا حد (الاحتفاظ بالجميع).

المدعوم: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

ضمّن رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ويستجيب فقط لأنماط النص):

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

### الأوامر (معالجة أوامر الدردشة)

```json5
{
  commands: {
    native: "auto", // تسجيل الأوامر الأصلية عندما تكون مدعومة
    nativeSkills: "auto", // تسجيل أوامر Skills الأصلية عندما تكون مدعومة
    text: true, // تحليل /commands في رسائل الدردشة
    bash: false, // السماح بـ ! (اسم بديل: /bash)
    bashForegroundMs: 2000,
    config: false, // السماح بـ /config
    mcp: false, // السماح بـ /mcp
    plugins: false, // السماح بـ /plugins
    debug: false, // السماح بـ /debug
    restart: true, // السماح بـ /restart + أداة إعادة تشغيل gateway
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

<Accordion title="تفاصيل الأوامر">

- تهيّئ هذه الكتلة أسطح الأوامر. لفهرس الأوامر المضمنة + المجمعة الحالي، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع مفاتيح إعدادات**، وليست فهرس الأوامر الكامل. الأوامر التي تملكها القنوات/Plugin مثل `/bot-ping` و`/bot-help` و`/bot-logs` في QQ Bot، و`/card` في LINE، و`/pair` في device-pair، و`/dreaming` في الذاكرة، و`/phone` في phone-control، و`/voice` في Talk موثقة في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** مع `/` في البداية.
- يقوم `native: "auto"` بتشغيل الأوامر الأصلية لـ Discord/Telegram، ويترك Slack متوقفًا.
- يقوم `nativeSkills: "auto"` بتشغيل أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack متوقفًا.
- تجاوز لكل قناة: `channels.discord.commands.native` ‏(قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى مسح الأوامر المسجلة سابقًا.
- تجاوز تسجيل Skills الأصلية لكل قناة عبر `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لصدفة المضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل موجودًا في `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` ‏(قراءة/كتابة `openclaw.json`). وبالنسبة إلى عملاء gateway ‏`chat.send`، تتطلب أيضًا عمليات الكتابة الدائمة لـ `/config set|unset` الصلاحية `operator.admin`؛ بينما يظل `/config show` للقراءة فقط متاحًا لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المُدار بواسطة OpenClaw تحت `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها والتحكم في تمكينها/تعطيلها.
- يتحكم `channels.<provider>.configWrites` في طفرات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم أيضًا `channels.<provider>.accounts.<id>.configWrites` في عمليات الكتابة التي تستهدف ذلك الحساب (مثل `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل gateway. الافتراضي: `true`.
- يمثل `ownerAllowFrom` قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهو منفصل عن `allowFrom`.
- يقوم `ownerDisplay: "hash"` بعمل hash لمعرّفات المالك في system prompt. اضبط `ownerDisplaySecret` للتحكم في عملية الـ hash.
- يكون `allowFrom` لكل موفّر. وعند ضبطه، يصبح **مصدر التفويض الوحيد** (تُتجاهل قوائم السماح/الاقتران الخاصة بالقناة و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطًا.
- خريطة وثائق الأوامر:
  - الفهرس المضمن + المجمع: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بكل قناة: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر البطاقة في LINE: [LINE](/ar/channels/line)
  - Dreaming في الذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## القيم الافتراضية للوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime داخل system prompt. وعند عدم ضبطه، يكتشفه OpenClaw تلقائيًا بالصعود من مساحة العمل إلى الأعلى.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح افتراضية اختيارية لـ Skills للوكلاء الذين لا يضبطون
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // يرث github وweather
      { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- اضبط `agents.list[].skills: []` لعدم وجود Skills.
- تكون قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛
  ولا تُدمج مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في توقيت حقن ملفات bootstrap الخاصة بمساحة العمل داخل system prompt. الافتراضي: `"always"`.

- `"continuation-skip"`: تتجاوز أدوار الاستمرار الآمنة (بعد اكتمال رد من المساعد) إعادة حقن bootstrap الخاصة بمساحة العمل، مما يقلل حجم prompt. وتستمر تشغيلات Heartbeat وإعادات المحاولة بعد Compaction في إعادة بناء السياق.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى لعدد الأحرف لكل ملف bootstrap في مساحة العمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى لإجمالي الأحرف المحقونة عبر جميع ملفات bootstrap الخاصة بمساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عندما يُقتطع سياق bootstrap.
الافتراضي: `"once"`.

- `"off"`: لا يحقن نص تحذير في system prompt مطلقًا.
- `"once"`: يحقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يمتلك OpenClaw عدة ميزانيات كبيرة الحجم لـ prompt/السياق، وهي
مقسمة عمدًا حسب النظام الفرعي بدلًا من تمريرها جميعًا عبر
مفتاح عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  الحقن العادي لـ bootstrap الخاصة بمساحة العمل.
- `agents.defaults.startupContext.*`:
  المقدمة الافتتاحية أحادية الاستخدام لأوامر `/new` و`/reset`، بما في ذلك
  ملفات `memory/*.md` اليومية الحديثة.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في system prompt.
- `agents.defaults.contextLimits.*`:
  المقتطفات المحدودة وقت التشغيل والكتل المحقونة المملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  مقطع البحث في الذاكرة المفهرسة وتحديد حجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى
ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في المقدمة الافتتاحية للسياق في الدور الأول، والتي تُحقن في تشغيلات
`/new` و`/reset` المجردة.

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

القيم الافتراضية المشتركة لأسطح السياق المحدودة وقت التشغيل.

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

- `memoryGetMaxChars`: الحد الافتراضي لمقتطف `memory_get` قبل إضافة
  بيانات metadata الخاصة بالاقتطاع وإشعار الاستمرار.
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ `memory_get` عند
  حذف `lines`.
- `toolResultMaxChars`: الحد الحي لنتائج الأدوات المستخدم للنتائج المحفوظة
  ومعالجة التجاوز.
- `postCompactionMaxChars`: الحد الأقصى لمقتطف `AGENTS.md` المستخدم أثناء حقن
  التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمفاتيح `contextLimits` المشتركة. ترث الحقول المحذوفة
من `agents.defaults.contextLimits`.

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

الحد العام لقائمة Skills المضغوطة المحقونة في system prompt. وهذا
لا يؤثر في قراءة ملفات `SKILL.md` عند الطلب.

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

تجاوز لكل وكيل لميزانية prompt الخاصة بـ Skills.

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

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة داخل كتل الصور في السجل/الأدوات قبل استدعاءات الموفّر.
الافتراضي: `1200`.

تؤدي القيم الأقل عادةً إلى تقليل استخدام vision-token وحجم حمولة الطلب في التشغيلات التي تكثر فيها لقطات الشاشة.
وتحافظ القيم الأعلى على قدر أكبر من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق system prompt (وليس للطوابع الزمنية للرسائل). وتعود إلى المنطقة الزمنية للمضيف عند عدم الضبط.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في system prompt. الافتراضي: `auto` ‏(تفضيل نظام التشغيل).

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
      params: { cacheRetention: "long" }, // القيم الافتراضية العامة لمعاملات الموفّر
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

- يقبل `model` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تضبط صيغة السلسلة النموذج الأساسي فقط.
  - تضبط صيغة الكائن النموذج الأساسي بالإضافة إلى نماذج failover المرتبة.
- يقبل `imageModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` بصفته إعداد نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما يتعذر على النموذج المحدد/الافتراضي قبول إدخال الصور.
- يقبل `imageGenerationModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة القدرة المشتركة لتوليد الصور وأي سطح أداة/Plugin مستقبلي يُنشئ صورًا.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-1` لـ OpenAI Images.
  - إذا حددت موفّرًا/نموذجًا مباشرة، فاضبط أيضًا مصادقة الموفّر/مفتاح API المطابق (مثل `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`).
  - عند حذفه، تظل `image_generate` قادرة على استنتاج موفّر افتراضي مدعوم بالمصادقة. وهي تحاول أولًا الموفّر الافتراضي الحالي، ثم بقية موفّري توليد الصور المسجلين بترتيب معرّف الموفّر.
- يقبل `musicGenerationModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة القدرة المشتركة لتوليد الموسيقى وبواسطة الأداة المضمنة `music_generate`.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - عند حذفه، تظل `music_generate` قادرة على استنتاج موفّر افتراضي مدعوم بالمصادقة. وهي تحاول أولًا الموفّر الافتراضي الحالي، ثم بقية موفّري توليد الموسيقى المسجلين بترتيب معرّف الموفّر.
  - إذا حددت موفّرًا/نموذجًا مباشرة، فاضبط أيضًا مصادقة الموفّر/مفتاح API المطابق.
- يقبل `videoGenerationModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة القدرة المشتركة لتوليد الفيديو وبواسطة الأداة المضمنة `video_generate`.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - عند حذفه، تظل `video_generate` قادرة على استنتاج موفّر افتراضي مدعوم بالمصادقة. وهي تحاول أولًا الموفّر الافتراضي الحالي، ثم بقية موفّري توليد الفيديو المسجلين بترتيب معرّف الموفّر.
  - إذا حددت موفّرًا/نموذجًا مباشرة، فاضبط أيضًا مصادقة الموفّر/مفتاح API المطابق.
  - يدعم موفّر توليد الفيديو Qwen المضمن حتى 1 فيديو مخرج، و1 صورة مُدخلة، و4 فيديوهات مُدخلة، ومدة 10 ثوانٍ، وخيارات على مستوى الموفّر مثل `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- يقبل `pdfModel` إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - عند حذفه، تعود أداة PDF إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرَّر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي ينظر إليها وضع fallback الخاص بالاستخراج في أداة `pdf`.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى الإخراج المرتفع الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` ‏(مثل `openai/gpt-5.4`). إذا حذفت الموفّر، فسيحاول OpenClaw أولًا اسمًا مستعارًا، ثم مطابقة فريدة لموفّر مهيأ لهذا المعرّف النموذجي الدقيق، وبعد ذلك فقط يعود إلى الموفّر الافتراضي المهيأ (سلوك توافق قديم، لذا يُفضَّل `provider/model` الصريح). وإذا لم يعد ذلك الموفّر يعرِض النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول موفّر/نموذج مهيأ بدلًا من إظهار قيمة افتراضية قديمة لموفّر أزيل.
- `models`: فهرس النماذج المُهيأ وقائمة السماح الخاصة بـ `/model`. ويمكن أن يتضمن كل إدخال `alias` ‏(اختصارًا) و`params` ‏(خاصة بالموفّر، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
- `params`: معاملات الموفّر الافتراضية العامة المطبقة على جميع النماذج. تُضبط عند `agents.defaults.params` ‏(مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` ‏(في الإعدادات): تتجاوز `agents.defaults.params` ‏(الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` ‏(لكل نموذج)، ثم تتجاوز `agents.list[].params` ‏(المطابقة لمعرّف الوكيل) حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة وقت تشغيل الوكيل المضمن منخفضة المستوى الافتراضية. استخدم `runtime: "auto"` للسماح لـ Plugin harnesses المسجلة باختيار النماذج المدعومة، أو `runtime: "pi"` لفرض harness المضمن PI، أو معرّف harness مسجل مثل `runtime: "codex"`. اضبط `fallback: "none"` لتعطيل fallback التلقائي إلى PI.
- تحفظ كُتّاب الإعدادات الذين يطفرون هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة fallback) صيغة الكائن القياسية وتحافظ على قوائم fallback الحالية متى أمكن.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (مع بقاء كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في أي منفّذ منخفض المستوى يشغّل أدوار الوكيل المضمنة.
يجب أن تُبقي معظم عمليات النشر على القيمة الافتراضية `{ runtime: "auto", fallback: "pi" }`.
استخدمه عندما يوفّر Plugin موثوق harness أصليًا، مثل
Codex app-server harness المضمن.

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

- `runtime`: ‏`"auto"` أو `"pi"` أو معرّف Plugin harness مسجل. يسجل Plugin ‏Codex المضمن `codex`.
- `fallback`: ‏`"pi"` أو `"none"`. تُبقي `"pi"` على harness ‏PI المضمن كـ fallback للتوافق. وتجعل `"none"` اختيار Plugin harness مفقود أو غير مدعوم يفشل بدلًا من استخدام PI بصمت.
- تجاوزات البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` قيمة `runtime`؛ ويعطّل `OPENCLAW_AGENT_HARNESS_FALLBACK=none` fallback إلى PI لتلك العملية.
- لعمليات النشر الخاصة بـ Codex فقط، اضبط `model: "codex/gpt-5.4"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتحكم هذا فقط في chat harness المضمن. أما توليد الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS فما تزال تستخدم إعدادات الموفّر/النموذج الخاصة بها.

**اختصارات alias المضمنة** (تنطبق فقط عندما يكون النموذج في `agents.defaults.models`):

| Alias               | النموذج                                |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

تفوز الأسماء المستعارة التي تهيئها أنت دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI قيمة `tool_stream` افتراضيًا لبث استدعاء الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
تستخدم نماذج Anthropic Claude 4.6 افتراضيًا التفكير `adaptive` عندما لا يكون هناك مستوى تفكير صريح مضبوط.

### `agents.defaults.cliBackends`

خلفيات CLI اختيارية لتشغيلات fallback النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كنسخة احتياطية عندما تفشل موفّرات API.

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

- تكون خلفيات CLI نصية أولًا؛ وتُعطَّل الأدوات دائمًا.
- تكون الجلسات مدعومة عندما يُضبط `sessionArg`.
- يكون تمرير الصور مدعومًا عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل system prompt الكامل المجمّع بواسطة OpenClaw بسلسلة ثابتة. يُضبط على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون القيم لكل وكيل ذات أسبقية؛ وتُتجاهل القيمة الفارغة أو التي تحتوي على مسافات بيضاء فقط. وهو مفيد لتجارب prompt المنضبطة.

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

تشغيلات Heartbeat الدورية.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m للتعطيل
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // الافتراضي: true؛ false يحذف قسم Heartbeat من system prompt
        lightContext: false, // الافتراضي: false؛ true يبقي فقط HEARTBEAT.md من ملفات bootstrap الخاصة بمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ true يشغّل كل Heartbeat في جلسة جديدة (من دون سجل محادثة)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (الافتراضي) | block
        target: "none", // الافتراضي: none | الخيارات: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: سلسلة مدة (`ms/s/m/h`). الافتراضي: `30m` ‏(مصادقة مفتاح API) أو `1h` ‏(مصادقة OAuth). اضبطه على `0m` للتعطيل.
- `includeSystemPromptSection`: عند false، يحذف قسم Heartbeat من system prompt ويتجاوز حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند true، يمنع حمولات تحذيرات أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: أقصى وقت بالثواني مسموح به لدور وكيل Heartbeat قبل إلغائه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/الرسائل المباشرة. تسمح `allow` ‏(الافتراضي) بالتسليم إلى الهدف المباشر. وتمنع `block` التسليم إلى الهدف المباشر وتصدر `reason=dm-blocked`.
- `lightContext`: عند true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيفًا وتبقي فقط `HEARTBEAT.md` من ملفات bootstrap الخاصة بمساحة العمل.
- `isolatedSession`: عند true، يعمل كل Heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. وهو نمط العزل نفسه في Cron مع `sessionTarget: "isolated"`. ويقلل تكلفة التوكن لكل Heartbeat من نحو ~100K إلى ~2-5K توكن.
- لكل وكيل: اضبط `agents.list[].heartbeat`. وعندما يعرّف أي وكيل `heartbeat`، فإن **هؤلاء الوكلاء فقط** هم الذين يشغّلون Heartbeat.
- تشغّل Heartbeat أدوار وكيل كاملة — والفواصل الأقصر تستهلك مزيدًا من التوكنات.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // معرّف Plugin موفر Compaction مسجل (اختياري)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // يُستخدم عندما تكون identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] يعطّل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري للنموذج مخصص لـ Compaction فقط
        notifyUser: true, // أرسل إشعارات موجزة عند بدء Compaction واكتماله (الافتراضي: false)
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

- `mode`: ‏`default` أو `safeguard` ‏(تلخيص مقسّم إلى مقاطع للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin موفر Compaction مسجل. عند ضبطه، يُستدعى `summarize()` الخاص بالموفّر بدلًا من تلخيص LLM المدمج. ويعود إلى المدمج عند الفشل. يؤدي ضبط موفّر إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يوقفها OpenClaw. الافتراضي: `900`.
- `identifierPolicy`: ‏`strict` ‏(الافتراضي) أو `off` أو `custom`. تقوم `strict` بإضافة إرشادات مدمجة للحفاظ على المعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما تكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة حقنها بعد Compaction. الافتراضي هو `["Session Startup", "Red Lines"]`؛ اضبط `[]` لتعطيل إعادة الحقن. وعندما يكون غير مضبوط أو مضبوطًا صراحةً على هذا الزوج الافتراضي، تُقبل أيضًا العناوين الأقدم `Every Session`/`Safety` كحل احتياطي قديم.
- `model`: تجاوز اختياري `provider/model-id` لتلخيص Compaction فقط. استخدمه عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم ضبطه، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عندما تكون `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثل "جارٍ ضغط السياق..." و"اكتمل Compaction"). ويكون معطّلًا افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. ويُتجاوز عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقلّم **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرسالها إلى LLM. ولا **يعدّل** سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // مدة (ms/s/m/h)، وحدة القياس الافتراضية: الدقائق
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

<Accordion title="سلوك وضع cache-ttl">

- يفعّل `mode: "cache-ttl"` تمريرات التقليص.
- يتحكم `ttl` في عدد مرات السماح بإعادة تشغيل التقليص (بعد آخر لمسة cache).
- يقوم التقليص أولًا باقتطاع نتائج الأدوات كبيرة الحجم اقتطاعًا لينًا، ثم يمسح نتائج الأدوات الأقدم مسحًا صارمًا عند الحاجة.

**الاقتطاع اللين** يحتفظ بالبداية + النهاية ويُدرج `...` في الوسط.

**المسح الصارم** يستبدل نتيجة الأداة بالكامل بالنص النائب.

ملاحظات:

- لا تُقتطع/تُمسح كتل الصور مطلقًا.
- تستند النسب إلى الأحرف (تقريبية)، وليست إلى أعداد التوكنات الدقيقة.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، فيُتجاوز التقليص.

</Accordion>

راجع [تقليص الجلسة](/ar/concepts/session-pruning) لمعرفة تفاصيل السلوك.

### التدفق الكتلي

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (استخدم minMs/maxMs)
    },
  },
}
```

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحةً لتمكين الردود الكتلية.
- تجاوزات القناة: `channels.<channel>.blockStreamingCoalesce` ‏(ومتغيرات كل حساب). ويكون الافتراضي في Signal/Slack/Discord/Google Chat هو `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود الكتلية. وتعني `natural` = ‏800–2500 مللي ثانية. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [التدفق](/ar/concepts/streaming) لمعرفة السلوك + تفاصيل التقسيم إلى مقاطع.

### مؤشرات الكتابة

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

- القيم الافتراضية: `instant` للدردشات المباشرة/الإشارات، و`message` لدردشات المجموعات غير المشار فيها.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing اختياري للوكيل المضمن. راجع [Sandboxing](/ar/gateway/sandboxing) للدليل الكامل.

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
          // كما أن SecretRefs / المحتويات المضمنة مدعومة أيضًا:
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

<Accordion title="تفاصيل Sandbox">

**الواجهة الخلفية:**

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم عبر SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد الواجهة الخلفية لـ SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH ‏(الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يحوّلها OpenClaw إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح سياسة مفتاح المضيف الخاصة بـ OpenSSH

**أسبقية مصادقة SSH:**

- تتقدم `identityData` على `identityFile`
- تتقدم `certificateData` على `certificateFile`
- تتقدم `knownHostsData` على `knownHostsFile`
- تُحل قيم `*Data` المدعومة عبر SecretRef من اللقطة النشطة لوقت تشغيل الأسرار قبل بدء جلسة Sandbox

**سلوك الواجهة الخلفية لـ SSH:**

- يهيّئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة عمل SSH البعيدة هي المرجع الأساسي
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيًا
- لا يدعم حاويات متصفح Sandbox

**الوصول إلى مساحة العمل:**

- `none`: مساحة عمل Sandbox لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل Sandbox عند `/workspace`، مع ربط مساحة عمل الوكيل للقراءة فقط عند `/agent`
- `rw`: ربط مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**إعداد Plugin ‏OpenShell:**

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
          gateway: "lab", // اختياري
          gatewayEndpoint: "https://lab.example", // اختياري
          policy: "strict", // معرّف سياسة OpenShell اختياري
          providers: ["openai"], // اختياري
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**وضع OpenShell:**

- `mirror`: تهيئة البعيد من المحلي قبل `exec`، ثم المزامنة العكسية بعد `exec`؛ وتبقى مساحة العمل المحلية هي المرجع الأساسي
- `remote`: تهيئة البعيد مرة واحدة عند إنشاء Sandbox، ثم الإبقاء على مساحة العمل البعيدة كمرجع أساسي

في وضع `remote`، لا تُزامَن تلقائيًا إلى Sandbox التعديلات المحلية على المضيف التي أُجريت خارج OpenClaw بعد خطوة التهيئة.
يكون النقل عبر SSH إلى OpenShell sandbox، لكن Plugin هو من يملك دورة حياة Sandbox ومزامنة mirror الاختيارية.

يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويتطلب خروجًا شبكيًا، وجذرًا قابلًا للكتابة، ومستخدم root.

**تكون الحاويات افتراضيًا على `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
تكون `"host"` محظورة. وتكون `"container:<id>"` محظورة افتراضيًا ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` ‏(وضع طارئ).

تُرحَّل **المرفقات الواردة** إلى `media/inbound/*` في مساحة العمل النشطة.

يقوم `docker.binds` بربط أدلة مضيف إضافية؛ وتُدمج عمليات الربط العامة وتلك الخاصة بكل وكيل.

**المتصفح داخل Sandbox** ‏(`sandbox.browser.enabled`): ‏Chromium + CDP داخل حاوية. ويُحقن عنوان noVNC URL في system prompt. ولا يتطلب `browser.enabled` في `openclaw.json`.
ويستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضيًا ويصدر OpenClaw عنوان URL ذي رمز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- تمنع `allowHostControl: false` ‏(الافتراضي) الجلسات داخل Sandbox من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` ‏(شبكة bridge مخصصة). واضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند حافة الحاوية إلى نطاق CIDR ‏(مثل `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بربط أدلة مضيف إضافية داخل حاوية متصفح Sandbox فقط. وعند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرَّف إعدادات الإطلاق الافتراضية في `scripts/sandbox-browser-entrypoint.sh` ومضبوطة خصيصًا لمضيفي الحاويات:
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
  - `--disable-extensions` ‏(مفعّل افتراضيًا)
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعّلة افتراضيًا ويمكن تعطيلها عبر
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/ثلاثي الأبعاد يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` عبر
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ واضبط `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عند تفعيل `noSandbox`.
  - تمثل القيم الافتراضية خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير افتراضيات الحاوية.

</Accordion>

يدعم Sandboxing للمتصفح و`sandbox.docker.binds` وضع Docker فقط.

أنشئ الصور:

```bash
scripts/sandbox-setup.sh           # صورة Sandbox الرئيسية
scripts/sandbox-browser-setup.sh   # صورة المتصفح الاختيارية
```

### `agents.list` ‏(تجاوزات لكل وكيل)

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
        model: "anthropic/claude-opus-4-6", // أو { primary, fallbacks }
        thinkingDefault: "high", // تجاوز مستوى التفكير لكل وكيل
        reasoningDefault: "on", // تجاوز رؤية reasoning لكل وكيل
        fastModeDefault: false, // تجاوز fast mode لكل وكيل
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // يتجاوز مفاتيح params المطابقة في defaults.models
        skills: ["docs-search"], // يستبدل agents.defaults.skills عند ضبطه
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

- `id`: معرّف وكيل ثابت (مطلوب).
- `default`: عند ضبط أكثر من واحد، يفوز الأول (مع تسجيل تحذير). وإذا لم يُضبط أيٌّ منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: تتجاوز صيغة السلسلة `primary` فقط؛ بينما تتجاوز صيغة الكائن `{ primary, fallbacks }` كليهما (`[]` يعطّل fallback العامة). تظل وظائف Cron التي تتجاوز `primary` فقط ترث fallback الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معاملات تدفق لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. وعند حذفها، يرث الوكيل `agents.defaults.skills` إذا كانت مضبوطة؛ وتستبدل القائمة الصريحة القيم الافتراضية بدلًا من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة.
- `reasoningDefault`: رؤية reasoning الافتراضية الاختيارية لكل وكيل (`on | off | stream`). وتُطبّق عندما لا يكون هناك تجاوز لـ reasoning لكل رسالة أو جلسة.
- `fastModeDefault`: القيمة الافتراضية الاختيارية لكل وكيل لـ fast mode ‏(`true | false`). وتُطبّق عندما لا يكون هناك تجاوز لـ fast mode لكل رسالة أو جلسة.
- `embeddedHarness`: تجاوز اختياري لسياسة harness منخفضة المستوى لكل وكيل. استخدم `{ runtime: "codex", fallback: "none" }` لجعل وكيل واحد يعمل مع Codex فقط بينما تحتفظ الوكلاء الأخرى بـ fallback الافتراضي إلى PI.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع قيم `runtime.acp` الافتراضية (`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يستخدم الوكيل جلسات ACP harness افتراضيًا.
- `identity.avatar`: مسار نسبي لمساحة العمل، أو عنوان URL من نوع `http(s)`، أو `data:` URI.
- تستنتج `identity` القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لـ `sessions_spawn` ‏(`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حاجز وراثة Sandbox: إذا كانت جلسة الطالب داخل Sandbox، فإن `sessions_spawn` يرفض الأهداف التي ستعمل خارج Sandbox.
- `subagents.requireAgentId`: عند true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` ‏(يفرض اختيار profile صريح؛ الافتراضي: false).

---

## توجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [متعدد الوكلاء](/ar/concepts/multi-agent).

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

### حقول مطابقة الربط

- `type` ‏(اختياري): `route` للتوجيه العادي (غياب النوع يعني route افتراضيًا)، و`acp` لربط محادثات ACP الدائم.
- `match.channel` ‏(مطلوب)
- `match.accountId` ‏(اختياري؛ `*` = أي حساب؛ والحذف = الحساب الافتراضي)
- `match.peer` ‏(اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` ‏(اختياري؛ خاص بالقناة)
- `acp` ‏(اختياري؛ فقط لـ `type: "acp"`): ‏`{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` ‏(مطابقة تامة، من دون peer/guild/team)
5. `match.accountId: "*"` ‏(على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

وبالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات route binding المذكور أعلاه.

### ملفات الوصول لكل وكيل

<Accordion title="وصول كامل (من دون Sandbox)">

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

<Accordion title="أدوات + مساحة عمل للقراءة فقط">

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

<Accordion title="من دون وصول إلى نظام الملفات (مراسلة فقط)">

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

راجع [Sandbox & Tools متعدد الوكلاء](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأسبقية.

---

## الجلسة

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
    parentForkMaxTokens: 100000, // تخطَّ fork للخيط الأصل فوق هذا العدد من التوكنات (0 للتعطيل)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // مدة أو false
      maxDiskBytes: "500mb", // ميزانية صارمة اختيارية
      highWaterBytes: "400mb", // هدف تنظيف اختياري
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // إلغاء التركيز التلقائي الافتراضي بعد عدم النشاط بالساعات (`0` للتعطيل)
      maxAgeHours: 0, // الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` للتعطيل)
    },
    mainKey: "main", // قديم (يستخدم وقت التشغيل دائمًا "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="تفاصيل حقول الجلسة">

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات الدردشة الجماعية.
  - `per-sender` ‏(الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك جميع الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: عزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: ربط المعرّفات الأساسية بنظراء ذوي بادئة موفّر لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين عند `atHour` حسب التوقيت المحلي؛ ويعيد `idle` التعيين بعد `idleMinutes`. وعند تهيئة الاثنين معًا، يفوز أيهما ينتهي أولًا.
- **`resetByType`**: تجاوزات لكل نوع (`direct` و`group` و`thread`). ويُقبل `dm` القديم كاسم بديل لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لقيمة `totalTokens` في الجلسة الأصلية المسموح بها عند إنشاء جلسة خيط متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` في الأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة خيط جديدة بدلًا من وراثة سجل الجلسة الأصلية.
  - اضبط `0` لتعطيل هذا الحاجز والسماح دائمًا بتفريع الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` كحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل-إلى-وكيل (عدد صحيح، النطاق: `0`–`5`). وتعطّل `0` تسلسل ping-pong.
- **`sendPolicy`**: مطابقة حسب `channel` أو `chatType` ‏(`direct|group|channel`، مع الاسم البديل القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. ويفوز أول `deny`.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: يقوم `warn` بإصدار تحذيرات فقط؛ ويطبّق `enforce` التنظيف.
  - `pruneAfter`: حد عمر الإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` ‏(الافتراضي `500`).
  - `rotateBytes`: يقوم بتدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. وتعود افتراضيًا إلى `pruneAfter`؛ واضبط `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم artifacts/جلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. ويكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: القيم الافتراضية العامة لميزات الجلسات المرتبطة بالخيوط.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للموفّرين تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: إلغاء التركيز التلقائي الافتراضي بعد عدم النشاط بالساعات (`0` للتعطيل؛ ويمكن للموفّرين التجاوز)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` للتعطيل؛ ويمكن للموفّرين التجاوز)

</Accordion>

---

## الرسائل

```json5
{
  messages: {
    responsePrefix: "🦞", // أو "auto"
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
      debounceMs: 2000, // 0 للتعطيل
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### بادئة الاستجابة

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix` و`channels.<channel>.accounts.<id>.responsePrefix`.

آلية الحل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. يؤدي `""` إلى التعطيل وإيقاف التسلسل. ويستنتج `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف                 | المثال                      |
| ---------------- | --------------------- | --------------------------- |
| `{model}`        | الاسم المختصر للنموذج | `claude-opus-4-6`           |
| `{modelFull}`    | معرّف النموذج الكامل  | `anthropic/claude-opus-4-6` |
| `{provider}`     | اسم الموفّر           | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high` أو `low` أو `off`    |
| `{identity.name}` | اسم هوية الوكيل      | (مثل `"auto"`)              |

المتغيرات غير حساسة لحالة الأحرف. و`{think}` هو اسم بديل لـ `{thinkingLevel}`.

### تفاعل الإقرار

- يعود افتراضيًا إلى `identity.emoji` للوكيل النشط، وإلا إلى `"👀"`. اضبط `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → fallback الهوية.
- النطاق: `group-mentions` ‏(الافتراضي)، و`group-all`، و`direct`، و`all`.
- يزيل `removeAckAfterReply` تفاعل الإقرار بعد الرد في Slack وDiscord وTelegram.
- يفعّل `messages.statusReactions.enabled` تفاعلات الحالة الخاصة بدورة الحياة في Slack وDiscord وTelegram.
  وفي Slack وDiscord، يؤدي عدم ضبطه إلى إبقاء تفاعلات الحالة مفعلة عندما تكون تفاعلات الإقرار نشطة.
  وفي Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات الحالة الخاصة بدورة الحياة.

### إزالة الارتداد للرسائل الواردة

يجمع الرسائل النصية السريعة المتتابعة من المرسل نفسه في دور وكيل واحد. وتقوم الوسائط/المرفقات بالتفريغ فورًا. وتتجاوز أوامر التحكم إزالة الارتداد.

### TTS ‏(تحويل النص إلى كلام)

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للملخص التلقائي.
- تكون `modelOverrides` مفعلة افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` ‏(اشتراك اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يتجاوز `openai.baseUrl` نقطة نهاية OpenAI TTS. ويكون ترتيب الحل هو الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية ليست OpenAI، يتعامل OpenClaw معها على أنها خادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## Talk

القيم الافتراضية لوضع Talk ‏(macOS/iOS/Android).

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند تهيئة عدة موفّري Talk.
- مفاتيح Talk المسطحة القديمة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط، وتُنقَل تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الأصوات إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- ينطبق fallback الخاص بـ `ELEVENLABS_API_KEY` فقط عندما لا يكون هناك مفتاح API مهيأ لـ Talk.
- يسمح `providers.*.voiceAliases` لتوجيهات Talk باستخدام أسماء مألوفة.
- يتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع Talk بعد صمت المستخدم قبل أن يرسل النص المفرغ. ويؤدي عدم ضبطه إلى الإبقاء على نافذة التوقف الافتراضية للمنصة (`700 ms` على macOS وAndroid، و`900 ms` على iOS).

---

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

تجعل عملية الإعداد المحلية التهيئات المحلية الجديدة افتراضيًا على `tools.profile: "coding"` عند عدم ضبطه (مع الحفاظ على ملفات التعريف الصريحة الحالية).

| ملف التعريف | يتضمن                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط                                                                                                           |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status`                                      |
| `full`      | بلا تقييد (مثل عدم الضبط)                                                                                                      |

### مجموعات الأدوات

| المجموعة           | الأدوات                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec` و`process` و`code_execution` ‏(`bash` مقبول كاسم بديل لـ `exec`)                                                  |
| `group:fs`         | `read` و`write` و`edit` و`apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list` و`sessions_history` و`sessions_send` و`sessions_spawn` و`sessions_yield` و`subagents` و`session_status` |
| `group:memory`     | `memory_search` و`memory_get`                                                                                            |
| `group:web`        | `web_search` و`x_search` و`web_fetch`                                                                                    |
| `group:ui`         | `browser` و`canvas`                                                                                                      |
| `group:automation` | `cron` و`gateway`                                                                                                        |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`                                                                                                            |
| `group:media`      | `image` و`image_generate` و`video_generate` و`tts`                                                                       |
| `group:openclaw`   | جميع الأدوات المضمنة (باستثناء Plugins الخاصة بالموفّر)                                                                 |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (المنع يفوز). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. وتُطبَّق حتى عندما يكون Docker sandbox متوقفًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقييد إضافي للأدوات لموفّرين أو نماذج محددة. الترتيب: ملف التعريف الأساسي → ملف تعريف الموفّر → allow/deny.

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

يتحكم في وصول `exec` المرتفع خارج Sandbox:

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

- لا يمكن للتجاوز لكل وكيل (`agents.list[].tools.elevated`) إلا زيادة التقييد.
- يخزّن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتُطبّق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع Sandboxing ويستخدم مسار الهروب المهيأ (`gateway` افتراضيًا، أو `node` عندما يكون هدف التنفيذ هو `node`).

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

فحوصات أمان حلقات الأدوات تكون **معطّلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف.
يمكن تعريف الإعدادات عالميًا في `tools.loopDetection` وتجاوزها لكل وكيل عند `agents.list[].tools.loopDetection`.

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

- `historySize`: الحد الأقصى لسجل استدعاءات الأدوات المحتفظ به لتحليل الحلقات.
- `warningThreshold`: عتبة نمط التكرار بلا تقدم لإصدار التحذيرات.
- `criticalThreshold`: عتبة تكرار أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: عتبة إيقاف صارمة لأي تشغيل بلا تقدم.
- `detectors.genericRepeat`: يحذّر من الاستدعاءات المتكررة للأداة نفسها/المعاملات نفسها.
- `detectors.knownPollNoProgress`: يحذّر/يحظر أدوات الاستطلاع المعروفة (`process.poll` و`command_status` وغير ذلك).
- `detectors.pingPong`: يحذّر/يحظر أنماط الأزواج المتناوبة بلا تقدم.
- إذا كانت `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // أو BRAVE_API_KEY من البيئة
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // اختياري؛ احذفه للاكتشاف التلقائي
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

يهيّئ فهم الوسائط الواردة (صورة/صوت/فيديو):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // اشتراك اختياري: إرسال الموسيقى/الفيديو غير المتزامنين المكتملين مباشرة إلى القناة
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

<Accordion title="حقول إدخال نموذج الوسائط">

**إدخال الموفّر** ‏(`type: "provider"` أو عند الحذف):

- `provider`: معرّف موفّر API ‏(`openai` أو `anthropic` أو `google`/`gemini` أو `groq`، إلخ)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار profile من `auth-profiles.json`

**إدخال CLI** ‏(`type: "cli"`):

- `command`: الملف التنفيذي المراد تشغيله
- `args`: معاملات templated ‏(تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وغير ذلك)

**الحقول المشتركة:**

- `capabilities`: قائمة اختيارية (`image` أو `audio` أو `video`). الافتراضيات: `openai`/`anthropic`/`minimax` ← صورة، و`google` ← صورة+صوت+فيديو، و`groq` ← صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تعود الإخفاقات إلى الإدخال التالي.

تتبع مصادقة الموفّر الترتيب القياسي: `auth-profiles.json` → متغيرات البيئة → `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عندما تكون `true`، تحاول المهام المكتملة لـ `music_generate`
  و`video_generate` غير المتزامنتين التسليم المباشر إلى القناة أولًا. الافتراضي: `false`
  (مسار الإيقاظ/التسليم عبر نموذج جلسة الطالب القديم).

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

يتحكم في الجلسات التي يمكن استهدافها بواسطة أدوات الجلسات (`sessions_list` و`sessions_history` و`sessions_send`).

الافتراضي: `tree` ‏(الجلسة الحالية + الجلسات التي أنشأتها، مثل الوكلاء الفرعيين).

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

ملاحظات:

- `self`: مفتاح الجلسة الحالية فقط.
- `tree`: الجلسة الحالية + الجلسات التي أنشأتها الجلسة الحالية (الوكلاء الفرعيون).
- `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (وقد يشمل ذلك مستخدمين آخرين إذا كنت تشغّل جلسات لكل مرسل تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. وما يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- تقييد Sandbox: عندما تكون الجلسة الحالية داخل Sandbox وكانت `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرَض `visibility` على `tree` حتى لو كانت `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // اشتراك اختياري: اضبطه على true للسماح بمرفقات ملفات مضمنة
        maxTotalBytes: 5242880, // إجمالي 5 MB عبر كل الملفات
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB لكل ملف
        retainOnSessionKeep: false, // الاحتفاظ بالمرفقات عندما تكون cleanup="keep"
      },
    },
  },
}
```

ملاحظات:

- المرفقات مدعومة فقط لـ `runtime: "subagent"`. ويرفض وقت تشغيل ACP هذه المرفقات.
- تُجسَّد الملفات داخل مساحة عمل الابن في `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
- يُحجَب محتوى المرفقات تلقائيًا من حفظ السجل.
- تُتحقق مدخلات Base64 باستخدام فحوصات صارمة للأبجدية/الحشو وحاجز حجم قبل فك الترميز.
- تكون أذونات الملفات `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: تقوم `delete` دائمًا بإزالة المرفقات؛ وتحتفظ `keep` بها فقط عندما تكون `retainOnSessionKeep: true`.

### `tools.experimental`

أعلام الأدوات المضمنة التجريبية. تكون متوقفة افتراضيًا ما لم تنطبق قاعدة التفعيل التلقائي الصارمة agentic لـ GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // تفعيل update_plan التجريبية
    },
  },
}
```

ملاحظات:

- `planTool`: يفعّل الأداة المنظمة `update_plan` لتتبع الأعمال غير التافهة متعددة الخطوات.
- الافتراضي: `false` ما لم تكن `agents.defaults.embeddedPi.executionContract` ‏(أو تجاوز لكل وكيل) مضبوطة على `"strict-agentic"` لتشغيل من عائلة OpenAI أو OpenAI Codex GPT-5. اضبط `true` لفرض تشغيل الأداة خارج هذا النطاق، أو `false` لإبقائها متوقفة حتى في تشغيلات GPT-5 الصارمة agentic.
- عند التفعيل، تضيف system prompt أيضًا إرشادات استخدام حتى لا يستخدمها النموذج إلا للأعمال المهمة ويحافظ على خطوة واحدة فقط بحالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين المُنشئين. وعند حذفه، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء الهدف في `sessions_spawn` عندما لا يضبط الوكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## الموفّرون المخصصون وعناوين URL الأساسية

يستخدم OpenClaw فهرس النماذج المضمن. أضف موفّرين مخصصين عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (الافتراضي) | replace
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

- استخدم `authHeader: true` + `headers` لاحتياجات المصادقة المخصصة.
- تجاوز جذر إعدادات الوكيل عبر `OPENCLAW_AGENT_DIR` ‏(أو `PI_CODING_AGENT_DIR`، وهو اسم بديل قديم لمتغير البيئة).
- أسبقية الدمج لمعرّفات الموفّر المطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاصة بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة في الوكيل فقط عندما لا يكون ذلك الموفّر مُدارًا عبر SecretRef في سياق الإعدادات/ملف المصادقة الحالي.
  - تُحدَّث قيم `apiKey` الخاصة بالموفّرين المُدارين عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلًا من حفظ الأسرار المحلولة.
  - تُحدَّث قيم headers الخاصة بالموفّرين المُدارين عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
  - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى `models.providers` في الإعدادات.
  - تستخدم القيم المطابقة `contextWindow`/`maxTokens` في النموذج القيمة الأعلى بين الإعداد الصريح وقيم الفهرس الضمنية.
  - تحفظ `contextTokens` المطابقة في النموذج حد وقت التشغيل الصريح عند وجوده؛ استخدمها لتقييد السياق الفعّال من دون تغيير metadata الأصلية للنموذج.
  - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
  - يكون حفظ العلامات معتمدًا على المصدر: تُكتب العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة وقت التشغيل.

### تفاصيل حقول الموفّر

- `models.mode`: سلوك فهرس الموفّر (`merge` أو `replace`).
- `models.providers`: خريطة الموفّرين المخصصين بمفاتيح معرّف الموفّر.
- `models.providers.*.api`: محول الطلبات (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai`، إلخ).
- `models.providers.*.apiKey`: بيانات اعتماد الموفّر (يفضَّل SecretRef/الاستبدال من البيئة).
- `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: يفرض نقل بيانات الاعتماد في ترويسة `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لـ API upstream.
- `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه proxy/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بموفّر النموذج.
  - `request.headers`: ترويسات إضافية (تُدمج مع افتراضيات الموفّر). وتقبل القيم SecretRef.
  - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` ‏(استخدام المصادقة المضمنة للموفّر)، و`"authorization-bearer"` ‏(مع `token`)، و`"header"` ‏(مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز HTTP proxy. الأوضاع: `"env-proxy"` ‏(استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`) و`"explicit-proxy"` ‏(مع `url`). ويقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` ‏(كلها تقبل SecretRef)، و`serverName` و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عندما تكون `true`، تسمح باتصالات HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو ما شابه، عبر حاجز جلب HTTP الخاص بالموفّر (اشتراك اختياري للمشغّل لنقاط النهاية الموثوقة ذاتية الاستضافة المتوافقة مع OpenAI). ويستخدم WebSocket قيمة `request` نفسها للترويسات/TLS ولكن ليس حاجز SSRF الخاص بالجلب. الافتراضي `false`.
- `models.providers.*.models`: إدخالات فهرس نماذج الموفّر الصريحة.
- `models.providers.*.models.*.contextWindow`: metadata نافذة السياق الأصلية للنموذج.
- `models.providers.*.models.*.contextTokens`: حد سياق اختياري لوقت التشغيل. استخدمه عندما تريد ميزانية سياق فعّالة أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير فارغ وغير أصلي (المضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة على `false` وقت التشغيل. أما `baseUrl` الفارغ/المحذوف فيُبقي سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط النهاية المتوافقة مع OpenAI التي تقبل سلاسل فقط. وعندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية البحتة إلى سلاسل نصية عادية قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف الموفّر للاكتشاف المستهدف.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فترة الاستطلاع لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الاحتياطي الأقصى لتوكنات المخرجات للنماذج المكتشفة.

### أمثلة على الموفّرين

<Accordion title="Cerebras ‏(GLM 4.6 / 4.7)">

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

استخدم `cerebras/zai-glm-4.7` لـ Cerebras؛ واستخدم `zai/glm-4.7` لـ Z.AI المباشر.

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

اضبط `OPENCODE_API_KEY` ‏(أو `OPENCODE_ZEN_API_KEY`). واستخدم المراجع `opencode/...` لفهرس Zen أو المراجع `opencode-go/...` لفهرس Go. اختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI ‏(GLM-4.7)">

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

اضبط `ZAI_API_KEY`. وتُقبل `z.ai/*` و`z-ai/*` كأسماء بديلة. اختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- لنقطة النهاية العامة، عرّف موفّرًا مخصصًا مع تجاوز `baseUrl`.

</Accordion>

<Accordion title="Moonshot AI ‏(Kimi)">

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

لنقطة النهاية الخاصة بالصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام التدفق على نقل
`openai-completions` المشترك، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية
وليس على معرّف الموفّر المضمن وحده.

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

متوافق مع Anthropic، وموفّر مضمّن. اختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic ‏(متوافق مع Anthropic)">

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

يجب أن يحذف `baseUrl` الجزء `/v1` ‏(لأن عميل Anthropic يضيفه). اختصار: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 ‏(مباشر)">

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

اضبط `MINIMAX_API_KEY`. الاختصارات:
`openclaw onboard --auth-choice minimax-global-api` أو
`openclaw onboard --auth-choice minimax-cn-api`.
يفترض فهرس النماذج القيمة M2.7 فقط.
وفي مسار التدفق المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax
افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. وتؤدي `/fast on` أو
`params.fastMode: true` إلى إعادة كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية ‏(LM Studio)">

راجع [النماذج المحلية](/ar/gateway/local-models). الخلاصة: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ واحتفظ بالنماذج المستضافة مدمجة كحل احتياطي.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة نصية صريحة
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: قائمة سماح اختيارية لـ Skills المضمنة فقط (ولا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أسبقية).
- `install.preferBrew`: عندما تكون true، يفضّل مُثبّتات Homebrew عندما يكون `brew`
  متاحًا قبل العودة إلى أنواع المثبّتات الأخرى.
- `install.nodeManager`: تفضيل مُثبّت Node لمواصفات
  `metadata.openclaw.install` ‏(`npm` | `pnpm` | `yarn` | `bun`).
- يؤدي `entries.<skillKey>.enabled: false` إلى تعطيل Skill حتى لو كانت مضمّنة/مثبتة.
- `entries.<skillKey>.apiKey`: وسيلة مريحة لـ Skills التي تعرّف متغير بيئة أساسيًا (سلسلة نصية صريحة أو كائن SecretRef).

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

- يُحمَّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins الأصلية لـ OpenClaw بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (تُحمَّل Plugins المدرجة فقط). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل مريح لمفتاح API على مستوى Plugin ‏(عند دعمه من Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات البيئة على نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يمنع core الخطاف `before_prompt_build` ويتجاهل الحقول المعدِّلة للـ prompt من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على خطافات Plugins الأصلية وعلى أدلة الخطافات الموفَّرة من الحزم المدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكلاء الفرعيين في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه Plugin ‏(ويتحقق منه مخطط Plugin الأصلي لـ OpenClaw عند توفره).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفّر جلب الويب Firecrawl.
  - `apiKey`: مفتاح API الخاص بـ Firecrawl ‏(يقبل SecretRef). ويعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان Firecrawl API الأساسي (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر cache بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث الويب Grok).
  - `enabled`: تمكين موفّر X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: تكرار Cron لكل عملية Dreaming كاملة (`"0 3 * * *"` افتراضيًا).
  - سياسة المراحل والعتبات هي تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضًا لـ Plugins حزم Claude المفعّلة المساهمة في افتراضيات Pi المضمنة من `settings.json`؛ ويطبّق OpenClaw هذه القيم كإعدادات وكيل منقّحة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ ويكون افتراضيًا `"legacy"` ما لم تثبّت وتحدد محركًا آخر.
- `plugins.installs`: metadata تثبيت مُدارة من CLI تُستخدم بواسطة `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - تعامل مع `plugins.installs.*` على أنها حالة مُدارة؛ وفضّل أوامر CLI على التعديلات اليدوية.

راجع [Plugins](/ar/tools/plugin).

---

## المتصفح

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // اشترك فقط عند الوثوق المقصود بوصول المتصفح إلى الشبكات الخاصة
      // allowPrivateNetwork: true, // اسم بديل قديم
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

- يؤدي `evaluateEnabled: false` إلى تعطيل `act:evaluate` و`wait --fn`.
- تكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة عند عدم ضبطها، لذا يبقى تنقل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا في تنقل المتصفح داخل الشبكات الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه الخاص بالشبكات الخاصة أثناء فحوصات الوصول/الاكتشاف.
- يبقى `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون الملفات الشخصية البعيدة بوضع attach-only ‏(بدء/إيقاف/إعادة تعيين معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يوفّر لك الموفّر عنوان DevTools WebSocket مباشرًا.
- تستخدم الملفات الشخصية `existing-session` قيمة Chrome MCP بدلًا من CDP ويمكنها الاتصال على
  المضيف المحدد أو عبر browser node متصل.
- يمكن لملفات `existing-session` الشخصية ضبط `userDataDir` لاستهداف
  ملف شخصي محدد لمتصفح مبني على Chromium مثل Brave أو Edge.
- تحتفظ ملفات `existing-session` الشخصية بقيود مسار Chrome MCP الحالية:
  إجراءات معتمدة على snapshot/ref بدلًا من الاستهداف بمحددات CSS، وخطافات رفع ملف واحد،
  ومن دون تجاوزات لمهلة الحوارات، ومن دون `wait --load networkidle`، ومن دون
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو الإجراءات الدفعية.
- تعيّن ملفات `openclaw` الشخصية المحلية المُدارة القيم `cdpPort` و`cdpUrl` تلقائيًا؛
  ولا تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنيًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- خدمة Control: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- تضيف `extraArgs` أعلام تشغيل إضافية إلى بدء Chromium المحلي (مثل
  `--disable-gpu` أو حجم النافذة أو أعلام debug).

---

## واجهة المستخدم

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji، أو نص قصير، أو عنوان URL لصورة، أو data URI
    },
  },
}
```

- `seamColor`: لون التمييز لواجهة التطبيق الأصلية (مثل تلوين فقاعة Talk Mode، إلخ).
- `assistant`: تجاوز هوية Control UI. ويعود إلى هوية الوكيل النشط.

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
      // password: "your-password", // أو OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // للوضع mode=trusted-proxy؛ راجع /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // خطر: السماح بعناوين embed المطلقة الخارجية http(s)
      // allowedOrigins: ["https://control.example.com"], // مطلوبة لـ Control UI غير القائمة على loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // وضع fallback خطير لأصل Host-header
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
    // اختياري. الافتراضي false.
    allowRealIpFallback: false,
    tools: {
      // عمليات deny إضافية عبر HTTP في /tools/invoke
      deny: ["browser"],
      // إزالة الأدوات من قائمة deny الافتراضية عبر HTTP
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

<Accordion title="تفاصيل حقول Gateway">

- `mode`: ‏`local` ‏(تشغيل gateway) أو `remote` ‏(الاتصال بـ gateway بعيد). ويرفض Gateway البدء ما لم يكن `local`.
- `port`: منفذ واحد متعدد الإرسال لكل من WS + HTTP. الأسبقية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` ‏(الافتراضي) أو `lan` ‏(`0.0.0.0`) أو `tailnet` ‏(عنوان Tailscale IP فقط) أو `custom`.
- **الأسماء البديلة القديمة للربط**: استخدم قيم وضع الربط في `gateway.bind` ‏(`auto` و`loopback` و`lan` و`tailnet` و`custom`)، وليس الأسماء البديلة للمضيف (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: يستمع الربط الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع Docker bridge networking ‏(`-p 18789:18789`)، تصل الحركة إلى `eth0`، لذا يصبح gateway غير قابل للوصول. استخدم `--network host`، أو اضبط `bind: "lan"` ‏(أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات الربط غير القائمة على loopback مصادقة gateway. وعمليًا يعني ذلك رمزًا/كلمة مرور مشتركة أو reverse proxy واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ويولّد معالج onboarding رمزًا افتراضيًا.
- إذا جرى تهيئة كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. وتفشل عمليات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون الاثنان مهيأين ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ وهذا غير معروض عمدًا في مطالبات onboarding.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى reverse proxy واعٍ بالهوية واثق من ترويسات الهوية القادمة من `gateway.trustedProxies` ‏(راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر proxy **غير قائم على loopback**؛ ولا تفي reverse proxies القائمة على loopback على المضيف نفسه بمتطلبات مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve أن تستوفي مصادقة Control UI/WebSocket ‏(يتم التحقق عبر `tailscale whois`). ولا تستخدم نقاط نهاية HTTP API مصادقة ترويسات Tailscale تلك؛ بل تتبع وضع مصادقة HTTP العادي للـ gateway. ويفترض هذا التدفق بلا رمز مميز أن مضيف gateway موثوق. ويكون افتراضيًا `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لإخفاقات المصادقة. ويُطبَّق لكل عنوان IP للعميل ولكل نطاق مصادقة (يُتتبَّع السر المشترك ورمز الجهاز المميز بشكل مستقل). وتعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن عبر Tailscale Serve، تُسلسَل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الإخفاق. ولذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تفعل المحدِّد عند الطلب الثاني بدل أن تمر الاثنتان كعدم تطابق عادي.
  - يكون `gateway.auth.rateLimit.exemptLoopback` افتراضيًا `true`؛ واضبطه على `false` عندما تريد عمدًا أيضًا تطبيق تحديد المعدل على حركة localhost (لإعدادات الاختبار أو عمليات النشر الصارمة عبر proxy).
- تُخضَع محاولات مصادقة WS ذات أصل المتصفح دائمًا لتحديد المعدل مع تعطيل إعفاء loopback (دفاعًا إضافيًا ضد القوة الغاشمة من المتصفح على localhost).
- على loopback، تكون عمليات الحظر ذات أصل المتصفح هذه معزولة بحسب قيمة
  `Origin` المطبع، بحيث لا تؤدي الإخفاقات المتكررة من أصل localhost واحد
  تلقائيًا إلى حظر أصل مختلف.
- `tailscale.mode`: ‏`serve` ‏(tailnet فقط، ربط loopback) أو `funnel` ‏(عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح الخاصة باتصالات Gateway WebSocket. وهي مطلوبة عندما يُتوقع عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل fallback أصل Host-header لعمليات النشر التي تعتمد عمدًا على سياسة أصل Host-header.
- `remote.transport`: ‏`ssh` ‏(الافتراضي) أو `direct` ‏(ws/wss). وبالنسبة إلى `direct`، يجب أن يكون `remote.url` من نوع `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ من جهة العميل يسمح باستخدام `ws://` النصي إلى عناوين IP موثوقة في الشبكات الخاصة؛ بينما يبقى الافتراضي مقتصرًا على loopback فقط للاتصالات النصية.
- `gateway.remote.token` / `.password` هما حقلا بيانات اعتماد لعميل بعيد. وهما لا يهيئان مصادقة gateway بحد ذاتهما.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي لوسيط APNs الخارجي المستخدم من قِبل إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالوسيط إلى gateway. ويجب أن يطابق هذا العنوان عنوان الوسيط المضمَّن في إصدار iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من gateway إلى الوسيط بالمللي ثانية. والافتراضي `10000`.
- تُفوَّض التسجيلات المدعومة بالوسيط إلى هوية gateway محددة. ويجلب تطبيق iOS المقترن `gateway.identity.get` ويضمّن تلك الهوية في تسجيل الوسيط ويحوّل منحة إرسال على نطاق التسجيل إلى gateway. ولا يمكن لـ gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئية مؤقتة لإعدادات الوسيط المذكورة أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب مخصص للتطوير فقط لعناوين HTTP الخاصة بوسيط loopback. ويجب أن تظل عناوين الوسيط الإنتاجية على HTTPS.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القنوات بالدقائق. اضبط `0` لتعطيل إعادة التشغيل بواسطة مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. اجعلها أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات التشغيل لكل قناة/حساب ضمن ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: اشتراك اختياري بالخروج لكل قناة من إعادات التشغيل بواسطة مراقب الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب في القنوات متعددة الحسابات. وعند ضبطه، تكون له الأسبقية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء gateway المحلية استخدام `gateway.remote.*` كحل احتياطي فقط عندما لا تكون `gateway.auth.*` مضبوطة.
- إذا جرى تهيئة `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم تُحل، فإن الحل يفشل بإغلاق افتراضي (من دون إخفاء عبر fallback بعيد).
- `trustedProxies`: عناوين IP للـ reverse proxy التي تنهي TLS أو تحقن ترويسات العميل المُمرّرة. اذكر فقط proxies التي تتحكم بها. وما تزال إدخالات loopback صالحة لإعدادات الكشف المحلي/الـ proxy على المضيف نفسه (مثل Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل gateway القيمة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. والافتراضي `false` لسلوك إغلاق افتراضي.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لطلب HTTP ‏`POST /tools/invoke` ‏(تمتد على قائمة الحظر الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة الحظر الافتراضية عبر HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. فعّلها عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية مدخلات URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة كما لو كانت غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة اختيارية لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` ‏(اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل بين عدة نُسخ

شغّل عدة Gateways على مضيف واحد مع منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام مريحة: `--dev` ‏(يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` ‏(يستخدم `~/.openclaw-<name>`).

راجع [عدة Gateways](/ar/gateway/multiple-gateways).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع gateway ‏(HTTPS/WSS) ‏(الافتراضي: `false`).
- `autoGenerate`: يولّد تلقائيًا زوج cert/key ذاتي التوقيع محليًا عندما لا تكون الملفات الصريحة مهيأة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات لملف شهادة TLS.
- `keyPath`: مسار نظام الملفات لملف المفتاح الخاص بـ TLS؛ ويجب إبقاؤه مقيّد الأذونات.
- `caPath`: مسار اختياري لحزمة CA للتحقق من العميل أو سلاسل الثقة المخصصة.

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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` ‏(الافتراضي): حاول أولًا إعادة التحميل الساخنة؛ ثم عد إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة debounce بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل (الافتراضي: `300000` = 5 دقائق).

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

المصادقة: `Authorization: Bearer <token>` أو `x-openclaw-token: <token>`.
وتُرفض رموز Hook المميزة في سلسلة الاستعلام.

ملاحظات التحقق والأمان:

- يتطلب `hooks.enabled=true` قيمة `hooks.token` غير فارغة.
- يجب أن تكون `hooks.token` **مختلفة** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن تكون `hooks.path` هي `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` ‏(مثل `["hook:"]`).
- إذا كان mapping أو preset يستخدم `sessionKey` templated، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. أما مفاتيح mapping الثابتة فلا تتطلب هذا الاشتراك الاختياري.

**نقاط النهاية:**

- `POST /hooks/wake` ← `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` ← `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` ‏(الافتراضي: `false`).
- `POST /hooks/<name>` ← يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في mapping المُنشأة بالقوالب على أنها مُورَّدة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل Mapping">

- يطابق `match.path` المسار الفرعي بعد `/hooks` ‏(مثل `/hooks/gmail` ← `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء Hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى داخل `hooks.transformsDir` ‏(تُرفض المسارات المطلقة واجتياز المسارات).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = منع الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل Hook من دون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` ولمفاتيح الجلسات في mappings المعتمدة على القوالب بضبط `sessionKey` ‏(الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية لبادئات قيم `sessionKey` الصريحة (الطلب + mapping)، مثل `["hook:"]`. وتصبح مطلوبة عندما يستخدم أي mapping أو preset قيمة `sessionKey` قائمة على القوالب.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ وتكون `channel` افتراضيًا `last`.
- يتجاوز `model` قيمة LLM لهذا التشغيل Hook ‏(ويجب أن يكون مسموحًا به إذا كان فهرس النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم preset المضمن لـ Gmail القيمة `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لتطابق نطاق Gmail، مثل `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز preset باستخدام `sessionKey` ثابت بدلًا من القيمة الافتراضية القائمة على القوالب.

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

- يبدأ Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما يكون مضبوطًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لتعطيله.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

---

## مضيف Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // أو OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يقدّم HTML/CSS/JS وA2UI القابلة للتحرير بواسطة الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` ‏(الافتراضي).
- في عمليات الربط غير loopback: تتطلب مسارات canvas مصادقة Gateway ‏(token/password/trusted-proxy)، مثل بقية أسطح HTTP الخاصة بـ Gateway.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ وبعد إقران node واتصاله، يعلن Gateway عناوين URL ذات إمكانات على نطاق node للوصول إلى canvas/A2UI.
- تكون عناوين URL ذات الإمكانات مرتبطة بجلسة WS النشطة الخاصة بالـ node وتنتهي سريعًا. ولا يُستخدم fallback المعتمد على IP.
- يحقن عميل live-reload في HTML المقدَّم.
- ينشئ تلقائيًا `index.html` ابتدائيًا عندما يكون الدليل فارغًا.
- يقدّم أيضًا A2UI على `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل gateway.
- عطّل live reload للأدلة الكبيرة أو عند أخطاء `EMFILE`.

---

## الاكتشاف

### mDNS ‏(Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` ‏(الافتراضي): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يضمّن `cliPath` + `sshPort`.
- يكون اسم المضيف افتراضيًا `openclaw`. تجاوزه عبر `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق ‏(DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة unicast DNS-SD تحت `~/.openclaw/dns/`. وللاكتشاف عبر الشبكات، اقترنه بخادم DNS ‏(يوصى بـ CoreDNS) + Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` ‏(متغيرات البيئة المضمنة)

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

- لا تُطبَّق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد ذلك المفتاح.
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` ‏(ولا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من profile صدفة الدخول الخاصة بك.
- راجع [البيئة](/ar/help/environment) لمعرفة الأسبقية الكاملة.

### استبدال متغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- لا تُطابق إلا الأسماء الكبيرة: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للحصول على `${VAR}` حرفيًا.
- يعمل هذا مع `$include`.

---

## الأسرار

تكون مراجع الأسرار إضافية: وتظل القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكل كائن واحد:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` لـ `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ‏`id`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط `id` لـ `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطات مائلة من نوع `.` أو `..` ‏(مثل `a/../b` يُرفض)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُضمَّن مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعداد موفّري الأسرار

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // موفّر env صريح اختياري
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

ملاحظات:

- يدعم موفّر `file` كلًا من `mode: "json"` و`mode: "singleValue"` ‏(ويجب أن يكون `id` هو `"value"` في وضع singleValue).
- يتطلب موفّر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول على stdin/stdout.
- تُرفض مسارات الأوامر الرمزية افتراضيًا. اضبط `allowSymlinkCommand: true` للسماح بالمسارات الرمزية مع التحقق من المسار الهدف المحلول.
- إذا جرى تهيئة `trustedDirs`، فإن فحص الدليل الموثوق يُطبَّق على المسار الهدف المحلول.
- تكون بيئة عملية الابن لـ `exec` محدودة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً عبر `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة موجودة في الذاكرة، ثم تقرأ مسارات الطلبات هذه اللقطة فقط.
- يُطبَّق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعلة إلى فشل البدء/إعادة التحميل، بينما تُتجاوز الأسطح غير النشطة مع تشخيصات.

---

## تخزين المصادقة

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

- تُخزَّن Profiles لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- لا تدعم Profiles وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد profile مدعومة بـ SecretRef.
- تأتي بيانات الاعتماد الثابتة لوقت التشغيل من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- عمليات استيراد OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك وقت تشغيل الأسرار وأدوات `audit/configure/apply`: ‏[إدارة الأسرار](/ar/gateway/secrets).

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

- `billingBackoffHours`: زمن التراجع الأساسي بالساعات عندما يفشل profile بسبب أخطاء الفوترة/عدم كفاية الرصيد الحقيقية (الافتراضي: `5`). ويمكن للنص الصريح الخاص بالفوترة أن ينتهي هنا حتى عند استجابات `401`/`403`، لكن تبقى مطابِقات النص الخاصة بكل موفّر محصورة في الموفّر الذي يملكها (مثل OpenRouter ‏`Key limit exceeded`). أما رسائل `402` القابلة لإعادة المحاولة الخاصة بنافذة الاستخدام أو حدود إنفاق المؤسسة/مساحة العمل فتظل في مسار `rate_limit` بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل موفّر لساعات التراجع الخاصة بالفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأُسّي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: زمن التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لعمليات تدوير auth-profile للموفّر نفسه عند أخطاء الحمل الزائد قبل التحويل إلى fallback النموذج (الافتراضي: `1`). وتدخل أشكال انشغال الموفّر مثل `ModelNotReadyException` هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير الموفّر/الـ profile المحمّل أكثر من اللازم (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لعمليات تدوير auth-profile للموفّر نفسه عند أخطاء rate-limit قبل التحويل إلى fallback النموذج (الافتراضي: `1`). ويتضمن هذا الدلو الخاص بـ rate-limit نصوصًا من شكل الموفّر مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

---

## التسجيل

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

- ملف السجل الافتراضي: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- اضبط `logging.file` للحصول على مسار ثابت.
- ترتفع `consoleLevel` إلى `debug` عند `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل منع الكتابات (عدد صحيح موجب؛ الافتراضي: `524288000` = ‏500 MB). استخدم تدوير سجلات خارجيًا لعمليات النشر الإنتاجية.

---

## التشخيصات

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

- `enabled`: المفتاح الرئيسي لمخرجات الأدوات التشخيصية (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل الأعلام تفعّل مخرجات سجل مستهدفة (وتدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة العمر بالمللي ثانية لإصدار تحذيرات الجلسات العالقة بينما تبقى الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry ‏(الافتراضي: `false`).
- `otel.endpoint`: عنوان URL للمجمّع الخاص بتصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` ‏(الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات metadata إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير trace أو metrics أو logs.
- `otel.sampleRate`: معدل أخذ عينات trace من `0` إلى `1`.
- `otel.flushIntervalMs`: فاصل تفريغ telemetry الدوري بالمللي ثانية.
- `cacheTrace.enabled`: يسجل لقطات cache trace للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ cache trace JSONL ‏(الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يُضمَّن في مخرجات cache trace ‏(جميعها افتراضيًا: `true`).

---

## التحديث

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

- `channel`: قناة الإصدار لتثبيتات npm/git — ‏`"stable"` أو `"beta"` أو `"dev"`.
- `checkOnStart`: تحقق من تحديثات npm عند بدء gateway ‏(الافتراضي: `true`).
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي على قناة stable ‏(الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية لطرح قناة stable بالساعات (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد مرات تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: مفتاح ميزات ACP العام (الافتراضي: `false`).
- `dispatch.enabled`: مفتاح مستقل لإرسال أدوار جلسة ACP ‏(الافتراضي: `true`). اضبطه على `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضية لوقت تشغيل ACP ‏(ويجب أن يطابق Plugin وقت تشغيل ACP مسجلًا).
- `defaultAgent`: معرّف وكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ والقيمة الفارغة تعني عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة في الوقت نفسه.
- `stream.coalesceIdleMs`: نافذة التفريغ الخامل بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم المقطع قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: يمنع تكرار أسطر الحالة/الأدوات لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يقوم `"live"` بالتدفق التزايدي؛ بينما يخزّن `"final_only"` حتى أحداث انتهاء الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المُسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى لأحرف أسطر الحالة/التحديثات المُسقطة الخاصة بـ ACP.
- `stream.tagVisibility`: سجل يربط أسماء الوسوم بتجاوزات رؤية منطقية لأحداث التدفق.
- `runtime.ttlMinutes`: قيمة TTL للخمول بالدقائق لعمال جلسة ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري يُشغَّل عند تهيئة بيئة وقت تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في نمط الشعار النصي في banner:
  - `"random"` ‏(الافتراضي): شعارات نصية مضحكة/موسمية متناوبة.
  - `"default"`: شعار نصي محايد ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بدون نص شعار (مع استمرار إظهار عنوان banner/الإصدار).
- لإخفاء banner بالكامل (وليس الشعارات النصية فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

Metadata يكتبها CLI في تدفقات الإعداد الموجّهة (`onboard` و`configure` و`doctor`):

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

## الهوية

راجع حقول الهوية في `agents.list` تحت [القيم الافتراضية للوكيل](#agent-defaults).

---

## Bridge ‏(قديم، أزيل)

لم تعد الإصدارات الحالية تتضمن TCP bridge. وتتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعدادات (ويفشل التحقق حتى تُزال؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="إعداد Bridge القديم (مرجع تاريخي)">

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
    webhook: "https://example.invalid/legacy", // fallback قديم ومهمل لوظائف notify:true المخزنة
    webhookToken: "replace-with-dedicated-token", // رمز bearer اختياري لمصادقة Webhook الصادر
    sessionRetention: "24h", // سلسلة مدة أو false
    runLog: {
      maxBytes: "2mb", // الافتراضي 2_000_000 بايت
      keepLines: 2000, // الافتراضي 2000
    },
  },
}
```

- `sessionRetention`: المدة التي تُحفَظ خلالها جلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. وتتحكم أيضًا في تنظيف نُسخ Cron النصية المؤرشفة المحذوفة. الافتراضي: `24h`؛ واضبط `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى للحجم لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفظ بها عند تفعيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز bearer يُستخدم لتسليم POST الخاص بـ Cron Webhook ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلن تُرسل أي ترويسة مصادقة.
- `webhook`: عنوان Webhook قديم ومهمل احتياطي (`http/https`) يُستخدم فقط للوظائف المخزنة التي لا تزال تملك `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للوظائف أحادية التشغيل عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات backoff بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تفعّل إعادة المحاولة — ‏`"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة المحاولة لكل الأنواع العابرة.

ينطبق هذا فقط على وظائف Cron أحادية التشغيل. أما الوظائف المتكررة فتستخدم معالجة إخفاق منفصلة.

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

- `enabled`: تفعيل تنبيهات الإخفاق لوظائف Cron ‏(الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `mode`: وضع التسليم — يرسل `"announce"` عبر رسالة قناة؛ بينما يقوم `"webhook"` بإرسال POST إلى Webhook المهيأ.
- `accountId`: معرّف حساب أو قناة اختياري لتحديد نطاق تسليم التنبيه.

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

- وجهة افتراضية لإشعارات إخفاق Cron عبر جميع الوظائف.
- `mode`: ‏`"announce"` أو `"webhook"`؛ ويكون افتراضيًا `"announce"` عندما تتوفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم announce. وتعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان Webhook. وهو مطلوب لوضع webhook.
- `accountId`: تجاوز اختياري للحساب عند التسليم.
- يتجاوز `delivery.failureDestination` لكل وظيفة هذا الافتراضي العام.
- عندما لا تُضبط وجهة إخفاق عامة ولا لكل وظيفة، تعود الوظائف التي تسلّم أصلًا عبر `announce` إلى هدف announce الأساسي ذاك عند الإخفاق.
- لا يُدعَم `delivery.failureDestination` إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [وظائف Cron](/ar/automation/cron-jobs). وتُتتبَّع تنفيذات Cron المعزولة على أنها [مهام في الخلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

العناصر النائبة للقالب الموسعة في `tools.media.models[].args`:

| المتغير           | الوصف                                         |
| ----------------- | --------------------------------------------- |
| `{{Body}}`        | نص الرسالة الواردة الكامل                     |
| `{{RawBody}}`     | النص الخام (من دون أغلفة السجل/المرسل)       |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات منه          |
| `{{From}}`        | معرّف المرسل                                  |
| `{{To}}`          | معرّف الوجهة                                  |
| `{{MessageSid}}`  | معرّف رسالة القناة                            |
| `{{SessionId}}`   | UUID الجلسة الحالية                           |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                |
| `{{MediaUrl}}`    | pseudo-URL للوسائط الواردة                    |
| `{{MediaPath}}`   | مسار الوسائط المحلي                           |
| `{{MediaType}}`   | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`  | النص المفرغ للصوت                             |
| `{{Prompt}}`      | prompt الوسائط المحلول لإدخالات CLI          |
| `{{MaxChars}}`    | الحد الأقصى المحلول لأحرف المخرجات لإدخالات CLI |
| `{{ChatType}}`    | `"direct"` أو `"group"`                       |
| `{{GroupSubject}}` | موضوع المجموعة (أفضل جهد)                    |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (أفضل جهد)             |
| `{{SenderName}}`  | اسم العرض الخاص بالمرسل (أفضل جهد)          |
| `{{SenderE164}}`  | رقم هاتف المرسل (أفضل جهد)                   |
| `{{Provider}}`    | تلميح الموفّر (whatsapp أو telegram أو discord، إلخ) |

---

## تضمينات الإعدادات (`$include`)

قسّم الإعدادات إلى عدة ملفات:

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

**سلوك الدمج:**

- ملف واحد: يستبدل الكائن الحاوي.
- مصفوفة ملفات: تُدمج دمجًا عميقًا بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (وتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى عمق 10 مستويات.
- المسارات: تُحل نسبةً إلى الملف المُضمِّن، لكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` الخاص بـ `openclaw.json`). وتُسمح الصيغ المطلقة/`../` فقط عندما تُحل في النهاية داخل ذلك الحد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_
