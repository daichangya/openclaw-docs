---
read_when:
    - تحتاج إلى دلالات التكوين الدقيقة على مستوى الحقول أو القيم الافتراضية
    - أنت تتحقق من كتل تكوين القنوات أو النماذج أو Gateway أو الأدوات
summary: مرجع تكوين Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-04-22T04:22:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0313f47079536b93385b4e9c7680a896098ac05dce4e368d389a33e31b4649ac
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع التكوين

مرجع التكوين الأساسي لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [التكوين](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح تكوين OpenClaw الرئيسية وتضع روابط خارجية عندما يكون لدى نظام فرعي مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل فهرس أوامر تملكه القنوات/Plugin أو كل إعداد عميق للذاكرة/QMD في صفحة واحدة.

مصدر الحقيقة في الشيفرة:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات التعريف الخاصة بالـ plugin/channel المضمّنة والمتاحة عند توفرها
- يعيد `config.schema.lookup` عقدة schema واحدة محددة بالمسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط الأساس لوثائق التكوين مقابل سطح schema الحالي

مراجع عميقة مخصصة:

- [مرجع تكوين الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وتكوين Dreaming تحت `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لفهرس الأوامر المضمّن + المجمّع الحالي
- صفحات القناة/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

صيغة التكوين هي **JSON5** (يُسمح بالتعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

تبدأ كل قناة تلقائيًا عندما يوجد قسم تكوينها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة           | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب على المالك الموافقة |
| `allowlist`         | فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن)             |
| `open`              | السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل جميع الرسائل المباشرة الواردة                                          |

| سياسة المجموعة          | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | فقط المجموعات المطابقة لقائمة السماح المكوّنة          |
| `open`                | تجاوز قوائم سماح المجموعات (مع بقاء بوابة الإشارة مطبقة) |
| `disabled`            | حظر جميع رسائل المجموعات/الغرف                          |

<Note>
يضبط `channels.defaults.groupPolicy` السياسة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالموفر معيّنة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويكون الحد الأقصى لطلبات اقتران الرسائل المباشرة المعلقة **3 لكل قناة**.
إذا كانت كتلة الموفر مفقودة بالكامل (`channels.<provider>` غير موجودة)، فإن سياسة مجموعات runtime تعود إلى `allowlist` (إخفاق مغلق) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معيّن. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المكوّنة. يُطبَّق تعيين القناة عندما لا تحتوي الجلسة بالفعل على تجاوز للنموذج (على سبيل المثال، تم تعيينه عبر `/model`).

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

استخدم `channels.defaults` للسلوك المشترك لسياسات المجموعات وHeartbeat عبر الموفرات:

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

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما لا تكون `groupPolicy` على مستوى الموفر معيّنة.
- `channels.defaults.contextVisibility`: وضع الرؤية الافتراضي للسياق التكميلي لجميع القنوات. القيم: `all` (الافتراضي، يتضمن كل سياق الاقتباس/الخيط/السجل)، و`allowlist` (يتضمن فقط السياق من المرسلين الموجودين في قائمة السماح)، و`allowlist_quote` (مثل allowlist لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/الخاطئة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat مضغوطة بنمط المؤشر.

### WhatsApp

يعمل WhatsApp عبر قناة الويب في Gateway ‏(Baileys Web). ويبدأ تلقائيًا عند وجود جلسة مرتبطة.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // علامات القراءة الزرقاء (false في وضع الدردشة الذاتية)
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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا فمعرّف الحساب الأول المكوَّن (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري هذا الاختيار الاحتياطي للحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- يتم ترحيل دليل مصادقة Baileys القديم أحادي الحساب بواسطة `openclaw doctor` إلى `whatsapp/default`.
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

- رمز bot: ‏`channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ يتم رفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- في إعدادات الحسابات المتعددة (معرّفا حسابين أو أكثر)، اضبط قيمة افتراضية صريحة (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذر `openclaw doctor` عندما يكون ذلك مفقودًا أو غير صالح.
- يمنع `configWrites: false` عمليات كتابة التكوين التي يطلقها Telegram ‏(ترحيلات معرفات supergroup، و`/config set|unset`).
- تقوم إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` بتكوين ارتباطات ACP مستمرة لموضوعات المنتدى (استخدم `chatId:topic:topicId` القياسي في `match.peer.id`). وتُشترك دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات التدفق في Telegram ‏`sendMessage` + `editMessageText` (وتعمل في الدردشات المباشرة والجماعية).
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

- الرمز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفر `token` صريحًا لـ Discord هذا الرمز في الاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب تأتي من الحساب المحدد في لقطة runtime النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- استخدم `user:<id>` ‏(DM) أو `channel:<id>` ‏(قناة guild) لأهداف التسليم؛ ويتم رفض المعرّفات الرقمية المجردة.
- تكون slugs الخاصة بـ guild بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المُحوّل إلى slug ‏(من دون `#`). ويفضل استخدام معرّفات guild.
- يتم تجاهل الرسائل التي أنشأها bot افتراضيًا. يفعّل `allowBots: true` قبولها؛ واستخدم `allowBots: "mentions"` لقبول رسائل bot التي تذكر bot فقط (مع استمرار تصفية الرسائل الخاصة به نفسه).
- يقوم `channels.discord.guilds.<id>.ignoreOtherMentions` ‏(وتجاوزات القناة) بإسقاط الرسائل التي تذكر مستخدمًا أو دورًا آخر ولكن لا تذكر bot (باستثناء ‎@everyone/‎@here).
- يقوم `maxLinesPerMessage` ‏(الافتراضي 17) بتقسيم الرسائل الطويلة رأسيًا حتى عند بقائها دون 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بعد عدم النشاط بالساعات (`0` يعطّل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل)
  - `spawnSubagentSessions`: مفتاح اشتراك اختياري لإنشاء/ربط السلاسل تلقائيًا في `sessions_spawn({ thread: true })`
- تقوم إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` بتكوين ارتباطات ACP مستمرة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). وتُشترك دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات Discord components v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية مع تجاوزات اختيارية للانضمام التلقائي + TTS.
- يتم تمرير `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (القيم الافتراضية `true` و`24`).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة جلسة صوتية ثم إعادة الانضمام إليها بعد تكرار حالات فشل فك التشفير.
- يُعد `channels.discord.streaming` مفتاح وضع التدفق القياسي. ويتم ترحيل `streamMode` القديم وقيم `streaming` المنطقية تلقائيًا.
- يربط `channels.discord.autoPresence` الإتاحة في runtime بحالة حضور bot ‏(سليم => online، متدهور => idle، منهك => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تمكين المطابقة القابلة للتغيير حسب الاسم/الوسم (وضع توافق طارئ).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية في Discord وتفويض المعتمدين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` ‏(الافتراضي). في وضع auto، تُفعَّل موافقات exec عندما يمكن حل المعتمدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. ويعود إلى `commands.ownerAllowFrom` عند حذفه.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (substring أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` ‏(الافتراضي) إلى الرسائل المباشرة للمعتمدين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى الاثنين. وعندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل المعتمدين الذين تم حلّهم.
  - `cleanupAfterResolve`: عند ضبطه على `true`، يحذف الرسائل المباشرة للموافقة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** ‏`off` ‏(لا شيء)، و`own` ‏(رسائل bot، الافتراضي)، و`all` ‏(جميع الرسائل)، و`allowlist` ‏(من `guilds.<id>.users` على جميع الرسائل).

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

- JSON لحساب الخدمة: مضمّن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- كما أن SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- القيم الاحتياطية لمتغيرات البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تمكين مطابقة email principal القابلة للتغيير (وضع توافق طارئ).

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

- يتطلب **Socket mode** كلاً من `botToken` و`appToken` ‏(`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كقيمة احتياطية من متغيرات البيئة للحساب الافتراضي).
- يتطلب **HTTP mode** ‏`botToken` بالإضافة إلى `signingSecret` ‏(في الجذر أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل
  نصية عادية أو كائنات SecretRef.
- تكشف لقطات حساب Slack عن حقول المصدر/الحالة لكل بيانات اعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. ويعني `configured_unavailable` أن الحساب
  مكوّن عبر SecretRef ولكن مسار الأمر/runtime الحالي لم يتمكن
  من حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة التكوين التي يطلقها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- يُعد `channels.slack.streaming.mode` مفتاح وضع تدفق Slack القياسي. ويتحكم `channels.slack.streaming.nativeTransport` في نقل التدفق الأصلي في Slack. ويتم ترحيل `streamMode` القديم وقيم `streaming` المنطقية و`nativeStreaming` تلقائيًا.
- استخدم `user:<id>` ‏(DM) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** ‏`off`، و`own` ‏(الافتراضي)، و`all`، و`allowlist` ‏(من `reactionAllowlist`).

**عزل جلسات السلاسل:** يكون `thread.historyScope` لكل سلسلة ‏(الافتراضي) أو مشتركًا عبر القناة. ويقوم `thread.inheritParent` بنسخ سجل القناة الأصلية إلى السلاسل الجديدة.

- يتطلب التدفق الأصلي في Slack بالإضافة إلى حالة السلسلة بنمط "is typing..." الخاصة بمساعد Slack هدف سلسلة رد. وتبقى الرسائل المباشرة ذات المستوى الأعلى خارج السلسلة افتراضيًا، لذا تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بنمط السلسلة.
- تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم تزيله عند الاكتمال. استخدم shortcode لرمز Slack التعبيري مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية في Slack وتفويض المعتمدين. المخطط نفسه كما في Discord: ‏`enabled` ‏(`true`/`false`/`"auto"`)، و`approvers` ‏(معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` ‏(`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراء | الافتراضي | ملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | القراءة/الإرسال/التحرير/الحذف  |
| pins         | مفعّل | التثبيت/إلغاء التثبيت/السرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة emoji المخصصة      |

### Mattermost

يأتي Mattermost كـ Plugin: ‏`openclaw plugins install @openclaw/mattermost`.

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

أوضاع الدردشة: `oncall` ‏(الرد عند @-mention، الافتراضي)، و`onmessage` ‏(كل رسالة)، و`onchar` ‏(الرسائل التي تبدأ ببادئة تشغيل).

عند تمكين الأوامر الأصلية في Mattermost:

- يجب أن يكون `commands.callbackPath` مسارًا (على سبيل المثال `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يشير `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلًا للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات slash الأصلية باستخدام الرموز الخاصة بكل أمر التي يعيدها
  Mattermost أثناء تسجيل أوامر الشرطة المائلة. وإذا فشل التسجيل أو لم يتم
  تنشيط أي أوامر، فسيرفض OpenClaw الاستدعاءات بالرسالة
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء الخاصين/الداخليين/‏tailnet، قد يتطلب Mattermost
  أن تتضمن `ServiceSettings.AllowedUntrustedInternalConnections` المضيف/النطاق الخاص بالاستدعاء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح أو المنع لعمليات كتابة التكوين التي يطلقها Mattermost.
- `channels.mattermost.requireMention`: اشتراط `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز بوابة الإشارة لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // ربط اختياري للحساب
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

**أوضاع إشعارات التفاعل:** ‏`off`، و`own` ‏(الافتراضي)، و`all`، و`allowlist` ‏(من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو المنع لعمليات كتابة التكوين التي يطلقها Signal.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.

### BlueBubbles

يُعد BlueBubbles المسار الموصى به لـ iMessage ‏(مدعومًا عبر Plugin، ومكوّنًا تحت `channels.bluebubbles`).

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
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP مستمرة. استخدم مقبض BlueBubbles أو سلسلة هدف (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تم توثيق تكوين قناة BlueBubbles الكامل في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يقوم OpenClaw بتشغيل `imsg rpc` ‏(JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- يفضل استخدام أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ واضبط `remoteHost` ‏(`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققًا صارمًا من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود بالفعل في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو المنع لعمليات كتابة التكوين التي يطلقها iMessage.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP مستمرة. استخدم مقبضًا مُطبّعًا أو هدف دردشة صريحًا (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم عبر Plugin ويتم تكوينه تحت `channels.matrix`.

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

- تستخدم مصادقة الرمز `accessToken`؛ وتستخدم مصادقة كلمة المرور `userId` + `password`.
- يقوم `channels.matrix.proxy` بتوجيه حركة HTTP الخاصة بـ Matrix عبر proxy ‏HTTP(S) صريح. ويمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. ويُعد `proxy` وخيار الشبكة هذا عنصرَي تحكم مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذا يتم تجاهل الغرف المدعو إليها ودعوات الرسائل المباشرة الجديدة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض المعتمدين.
  - `enabled`: ‏`true` أو `false` أو `"auto"` ‏(الافتراضي). في وضع auto، تُفعَّل موافقات exec عندما يمكن حل المعتمدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix ‏(مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (substring أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` ‏(الافتراضي)، أو `"channel"` ‏(الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل المباشرة في Matrix إلى جلسات: يشارك `per-user` ‏(الافتراضي) حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة رسائل مباشرة.
- تستخدم فحوصات حالة Matrix وعمليات البحث في الدليل الحية سياسة proxy نفسها المستخدمة في حركة runtime.
- تم توثيق تكوين Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم عبر Plugin ويتم تكوينه تحت `channels.msteams`.

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
- تم توثيق تكوين Teams الكامل (بيانات الاعتماد، وWebhook، وسياسة الرسائل المباشرة/المجموعات، وتجاوزات كل فريق/كل قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

IRC مدعوم عبر Plugin ويتم تكوينه تحت `channels.irc`.

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
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- تم توثيق تكوين قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الإشارة) في [IRC](/ar/channels/irc).

### حسابات متعددة (جميع القنوات)

شغّل عدة حسابات لكل قناة (لكل منها `accountId` خاص بها):

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

- يُستخدم `default` عند حذف `accountId` ‏(في CLI + التوجيه).
- لا تنطبق رموز متغيرات البيئة إلا على الحساب **default**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` ‏(أو الإعداد الأولي للقناة) بينما لا تزال على تكوين قناة أحادي الحساب من المستوى الأعلى، فسيقوم OpenClaw أولًا بترقية قيم الحساب الأحادي ذات المستوى الأعلى والمحددة بنطاق الحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. وتنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ بينما يمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.
- تستمر ارتباطات القناة فقط الحالية (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الارتباطات المحددة بنطاق الحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضًا الأشكال المختلطة عبر نقل قيم الحساب الأحادي ذات المستوى الأعلى والمحددة بنطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ بينما يمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود بدلًا من ذلك.

### قنوات Plugin الأخرى

يتم تكوين العديد من قنوات Plugin على أنها `channels.<id>` ويتم توثيقها في صفحات القنوات المخصصة لها (على سبيل المثال Feishu، وMatrix، وLINE، وNostr، وZalo، وNextcloud Talk، وSynology Chat، وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الإشارة في الدردشة الجماعية

تتطلب الرسائل الجماعية افتراضيًا **وجود إشارة** (إشارة metadata أو أنماط regex آمنة). وينطبق ذلك على WhatsApp وTelegram وDiscord وGoogle Chat ودردشات المجموعات في iMessage.

**أنواع الإشارة:**

- **إشارات metadata**: إشارات @ الأصلية في المنصة. ويتم تجاهلها في وضع الدردشة الذاتية لـ WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. ويتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- يتم فرض بوابة الإشارة فقط عندما يكون الاكتشاف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات تجاوزها باستخدام `channels.<channel>.historyLimit` ‏(أو لكل حساب). اضبط القيمة `0` للتعطيل.

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

آلية الحل: تجاوز لكل رسالة مباشرة → افتراضي الموفر → بلا حد (يتم الاحتفاظ بالجميع).

مدعوم في: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

أدرج رقمك الخاص في `allowFrom` لتمكين وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ولا يستجيب إلا لأنماط النص):

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

<Accordion title="تفاصيل الأوامر">

- تقوم هذه الكتلة بتكوين أسطح الأوامر. للحصول على فهرس الأوامر المضمّن + المجمّع الحالي، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح التكوين**، وليست فهرس الأوامر الكامل. يتم توثيق الأوامر التي تملكها القنوات/Plugin مثل `/bot-ping` و`/bot-help` و`/bot-logs` الخاصة بـ QQ Bot، و`/card` الخاصة بـ LINE، و`/pair` الخاصة بـ device-pair، و`/dreaming` الخاصة بالذاكرة، و`/phone` الخاصة بـ phone-control، و`/voice` الخاصة بـ Talk في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يقوم `native: "auto"` بتفعيل الأوامر الأصلية لـ Discord/Telegram، ويُبقي Slack معطّلًا.
- يقوم `nativeSkills: "auto"` بتفعيل أوامر Skills الأصلية لـ Discord/Telegram، ويُبقي Slack معطّلًا.
- تجاوز لكل قناة: `channels.discord.commands.native` ‏(قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى مسح الأوامر المسجلة سابقًا.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة bot في Telegram.
- يؤدي `bash: true` إلى تفعيل `! <cmd>` لصدفة المضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يؤدي `config: true` إلى تفعيل `/config` ‏(لقراءة/كتابة `openclaw.json`). وبالنسبة إلى عملاء `chat.send` في Gateway، تتطلب عمليات الكتابة الدائمة لـ `/config set|unset` أيضًا `operator.admin`؛ بينما يظل `/config show` للقراءة فقط متاحًا لعملاء operator العاديين ذوي نطاق الكتابة.
- يؤدي `mcp: true` إلى تفعيل `/mcp` لتكوين خادم MCP الذي يديره OpenClaw تحت `mcp.servers`.
- يؤدي `plugins: true` إلى تفعيل `/plugins` لاكتشاف Plugin وتثبيته والتحكم في تمكينه/تعطيله.
- يتحكم `channels.<provider>.configWrites` في طفرات التكوين لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يؤدي `restart: false` إلى تعطيل `/restart` وإجراءات أداة إعادة تشغيل Gateway. القيمة الافتراضية: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- يقوم `ownerDisplay: "hash"` بتجزئة معرّفات المالك في system prompt. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` يكون لكل provider. وعند ضبطه، يصبح **مصدر التفويض الوحيد** (ويتم تجاهل قوائم سماح القنوات/الاقتران و`useAccessGroups`).
- يتيح `useAccessGroups: false` للأوامر تجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطًا.
- خريطة وثائق الأوامر:
  - الفهرس المضمّن + المجمّع: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: ‏[QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر البطاقات في LINE: ‏[LINE](/ar/channels/line)
  - Dreaming الخاص بالذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## القيم الافتراضية للوكلاء

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime داخل system prompt. وإذا لم يتم ضبطه، يقوم OpenClaw باكتشافه تلقائيًا عبر الصعود من workspace.

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
      { id: "locked-down", skills: [] }, // بدون Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة القيم الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- تكون قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛
  ولا تندمج مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بـ workspace ‏(`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت حقن ملفات bootstrap الخاصة بـ workspace في system prompt. القيمة الافتراضية: `"always"`.

- `"continuation-skip"`: تتخطى دورات المتابعة الآمنة (بعد اكتمال رد المساعد) إعادة حقن bootstrap الخاص بـ workspace، مما يقلل حجم prompt. وتستمر عمليات Heartbeat وإعادات المحاولة بعد Compaction في إعادة بناء السياق.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى للأحرف لكل ملف bootstrap في workspace قبل الاقتطاع. القيمة الافتراضية: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي للأحرف المحقونة عبر جميع ملفات bootstrap الخاصة بـ workspace. القيمة الافتراضية: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عندما يتم اقتطاع سياق bootstrap.
القيمة الافتراضية: `"once"`.

- `"off"`: لا يحقن نص تحذير مطلقًا في system prompt.
- `"once"`: يحقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يمتلك OpenClaw عدة ميزانيات كبيرة الحجم للـ prompt/السياق، وهي
مقسّمة عمدًا حسب النظام الفرعي بدلًا من تمريرها جميعًا عبر
مفتاح عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن bootstrap العادي الخاص بـ workspace.
- `agents.defaults.startupContext.*`:
  تمهيد بدء تشغيل لمرة واحدة مع `/new` و`/reset`، بما في ذلك ملفات
  `memory/*.md` اليومية الحديثة.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في system prompt.
- `agents.defaults.contextLimits.*`:
  مقتطفات runtime المحدودة والكتل المملوكة لـ runtime والمحقونة.
- `memory.qmd.limits.*`:
  أحجام مقتطفات البحث في الذاكرة المفهرسة وحقنها.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى
ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد البدء الأول المحقون عند تشغيلات `/new` و`/reset`
العارية.

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

القيم الافتراضية المشتركة لأسطح سياق runtime المحدودة.

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
  بيانات وصفية للاقتطاع وإشعار بالمتابعة.
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ `memory_get` عند
  حذف `lines`.
- `toolResultMaxChars`: حد نتائج الأدوات الحي المستخدم للنتائج المستمرة
  واستعادة الفائض.
- `postCompactionMaxChars`: حد مقتطف `AGENTS.md` المستخدم أثناء حقن
  التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمفاتيح `contextLimits` المشتركة. وترث الحقول المحذوفة
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

الحد العام لقائمة Skills المضغوطة المحقونة في system prompt. هذا
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

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة داخل كتل الصور في transcript/tool قبل استدعاءات provider.
القيمة الافتراضية: `1200`.

تؤدي القيم الأقل عادةً إلى تقليل استخدام vision-token وحجم حمولة الطلبات في التشغيلات كثيرة لقطات الشاشة.
أما القيم الأعلى فتحافظ على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق system prompt (وليس للطوابع الزمنية للرسائل). وتعود إلى المنطقة الزمنية للمضيف إذا لم تُضبط.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في system prompt. القيمة الافتراضية: `auto` ‏(تفضيل نظام التشغيل).

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
      params: { cacheRetention: "long" }, // معلمات provider الافتراضية العامة
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

- `model`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - تضبط صيغة السلسلة النموذج الأساسي فقط.
  - تضبط صيغة الكائن النموذج الأساسي بالإضافة إلى نماذج التحويل عند الفشل بترتيب محدد.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` بوصفه تكوين نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الصور المشتركة وأي سطح أداة/Plugin مستقبلي ينشئ صورًا.
  - القيم المعتادة: `google/gemini-3.1-flash-image-preview` لإنشاء الصور الأصلي في Gemini، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images.
  - إذا اخترت provider/model مباشرة، فقم أيضًا بتكوين مصادقة/API key الخاصة بالـ provider المطابق (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` لـ `openai/*`، أو `FAL_KEY` لـ `fal/*`).
  - إذا تم حذفه، فلا يزال بإمكان `image_generate` استنتاج قيمة افتراضية لموفر مدعوم بالمصادقة. وهو يجرّب أولًا provider الافتراضي الحالي، ثم باقي موفري إنشاء الصور المسجلين بترتيب معرّف provider.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الموسيقى المشتركة وأداة `music_generate` المضمنة.
  - القيم المعتادة: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا تم حذفه، فلا يزال بإمكان `music_generate` استنتاج قيمة افتراضية لموفر مدعوم بالمصادقة. وهو يجرّب أولًا provider الافتراضي الحالي، ثم باقي موفري إنشاء الموسيقى المسجلين بترتيب معرّف provider.
  - إذا اخترت provider/model مباشرة، فقم أيضًا بتكوين مصادقة/API key الخاصة بالـ provider المطابق.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة قدرة إنشاء الفيديو المشتركة وأداة `video_generate` المضمنة.
  - القيم المعتادة: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا تم حذفه، فلا يزال بإمكان `video_generate` استنتاج قيمة افتراضية لموفر مدعوم بالمصادقة. وهو يجرّب أولًا provider الافتراضي الحالي، ثم باقي موفري إنشاء الفيديو المسجلين بترتيب معرّف provider.
  - إذا اخترت provider/model مباشرة، فقم أيضًا بتكوين مصادقة/API key الخاصة بالـ provider المطابق.
  - يدعم موفر إنشاء الفيديو Qwen المضمّن حتى 1 فيديو ناتج، و1 صورة إدخال، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات `size` و`aspectRatio` و`resolution` و`audio` و`watermark` على مستوى provider.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا تم حذفه، تعود أداة PDF إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يأخذها وضع الاستخراج الاحتياطي في أداة `pdf` في الاعتبار.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى المخرجات المرتفعة الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: الصيغة `provider/model` ‏(مثل `openai/gpt-5.4`). إذا حذفت provider، فسيحاول OpenClaw أولًا اسمًا مستعارًا، ثم مطابقة فريدة لموفر مكوّن لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى provider الافتراضي المكوَّن (سلوك توافق قديم، لذا يُفضّل استخدام `provider/model` الصريح). وإذا لم يعد ذلك provider يوفّر النموذج الافتراضي المكوّن، فسيعود OpenClaw إلى أول provider/model مكوّن بدلًا من إظهار قيمة افتراضية قديمة لموفر تمت إزالته.
- `models`: فهرس النماذج المكوّن وقائمة السماح لـ `/model`. يمكن أن يتضمن كل إدخال `alias` ‏(اختصار) و`params` ‏(خاصة بالـ provider، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
- `params`: معلمات provider الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` ‏(مثل `{ cacheRetention: "long" }`).
- أسبقية دمج `params` ‏(في التكوين): يتم تجاوز `agents.defaults.params` ‏(الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` ‏(لكل نموذج)، ثم يتجاوز `agents.list[].params` ‏(المطابق لمعرّف الوكيل) حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة runtime منخفضة المستوى الافتراضية للوكلاء المضمّنين. استخدم `runtime: "auto"` للسماح لـ plugin harnesses المسجلة بالمطالبة بالنماذج المدعومة، أو `runtime: "pi"` لفرض harness المضمّن PI، أو معرّف harness مسجل مثل `runtime: "codex"`. اضبط `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI.
- كتابات التكوين التي تغيّر هذه الحقول (على سبيل المثال `/models set` و`/models set-image` وأوامر add/remove الخاصة بالتحويل عند الفشل) تحفظ الصيغة الكائنية القياسية وتحافظ على قوائم التحويل عند الفشل الموجودة عندما يكون ذلك ممكنًا.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (مع بقاء كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في المنفذ منخفض المستوى الذي يشغّل أدوار الوكلاء المضمّنين.
وينبغي لمعظم البيئات الاحتفاظ بالقيمة الافتراضية `{ runtime: "auto", fallback: "pi" }`.
استخدمه عندما يوفّر Plugin موثوق harness أصليًا، مثل
Codex app-server harness المضمّن.

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

- `runtime`: ‏`"auto"` أو `"pi"` أو معرّف harness plugin مسجل. ويسجّل Plugin Codex المضمّن المعرف `codex`.
- `fallback`: ‏`"pi"` أو `"none"`. تُبقي `"pi"` على harness المضمّن PI كرجوع للتوافق. وتجعل `"none"` اختيار harness plugin المفقود أو غير المدعوم يفشل بدلًا من استخدام PI بصمت.
- تجاوزات البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` قيمة `runtime`؛ ويعطّل `OPENCLAW_AGENT_HARNESS_FALLBACK=none` الرجوع إلى PI لتلك العملية.
- لعمليات النشر الخاصة بـ Codex فقط، اضبط `model: "codex/gpt-5.4"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتحكم هذا في chat harness المضمّن فقط. ولا تزال قدرات إنشاء الوسائط والرؤية وPDF والموسيقى والفيديو وTTS تستخدم إعدادات provider/model الخاصة بها.

**اختصارات alias المضمّنة** (لا تنطبق إلا عندما يكون النموذج موجودًا في `agents.defaults.models`):

| Alias               | النموذج                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

تتغلب الأسماء المستعارة التي تكوّنها دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع thinking تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
وتفعّل نماذج Z.AI قيمة `tool_stream` افتراضيًا لتدفق استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` إلى `false` لتعطيله.
وتستخدم نماذج Anthropic Claude 4.6 قيمة `adaptive` افتراضيًا في thinking عندما لا يتم تعيين مستوى thinking صريح.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الرجوع النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كنسخة احتياطية عند فشل موفري API.

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

- تكون الواجهات الخلفية لـ CLI نصية أولًا؛ ويتم دائمًا تعطيل الأدوات.
- تكون الجلسات مدعومة عندما يتم ضبط `sessionArg`.
- يكون تمرير الصور مدعومًا عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل system prompt الكامل الذي يجمعه OpenClaw بسلسلة ثابتة. ويُضبط على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). وتكون القيم لكل وكيل ذات أسبقية أعلى؛ ويتم تجاهل القيمة الفارغة أو التي تحتوي على مسافات فقط. وهو مفيد لتجارب prompt المضبوطة.

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
        every: "30m", // 0m يعطّل
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // الافتراضي: true؛ false يحذف قسم Heartbeat من system prompt
        lightContext: false, // الافتراضي: false؛ true يُبقي فقط HEARTBEAT.md من ملفات bootstrap الخاصة بـ workspace
        isolatedSession: false, // الافتراضي: false؛ true يشغّل كل Heartbeat في جلسة جديدة (بلا سجل محادثة)
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

- `every`: سلسلة مدة (`ms`/`s`/`m`/`h`). الافتراضي: `30m` ‏(مصادقة API-key) أو `1h` ‏(مصادقة OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عندما تكون false، تحذف قسم Heartbeat من system prompt وتتخطى حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عندما تكون true، تمنع حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح به لدور وكيل Heartbeat قبل إلغائه. اتركه غير مضبوط لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. تسمح `allow` ‏(الافتراضي) بالتسليم إلى الأهداف المباشرة. وتمنع `block` التسليم إلى الأهداف المباشرة وتصدر `reason=dm-blocked`.
- `lightContext`: عندما تكون true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيف الوزن وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap الخاصة بـ workspace.
- `isolatedSession`: عندما تكون true، يعمل كل Heartbeat في جلسة جديدة بلا سجل محادثة سابق. وهو نمط العزل نفسه المستخدم في Cron ‏`sessionTarget: "isolated"`. ويقلل كلفة الرموز لكل Heartbeat من نحو 100K إلى نحو 2-5K رمز.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، **يعمل Heartbeat لهؤلاء الوكلاء فقط**.
- تشغّل Heartbeats أدوار وكيل كاملة — والفواصل الزمنية الأقصر تستهلك مزيدًا من الرموز.

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
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // يُستخدم عندما يكون identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] يعطّل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري للنموذج خاص بـ Compaction فقط
        notifyUser: true, // إرسال إشعارات مختصرة عند بدء Compaction واكتماله (الافتراضي: false)
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

- `mode`: ‏`default` أو `safeguard` ‏(تلخيص مقسّم إلى أجزاء للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin موفر Compaction مسجل. عند ضبطه، يتم استدعاء `summarize()` الخاص بالموفر بدلًا من التلخيص المضمن بواسطة LLM. ويعود إلى السلوك المضمن عند الفشل. يؤدي ضبط موفر إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى للثواني المسموح بها لعملية Compaction واحدة قبل أن يقوم OpenClaw بإلغائها. الافتراضي: `900`.
- `identifierPolicy`: ‏`strict` ‏(الافتراضي)، أو `off`، أو `custom`. تضيف القيمة `strict` إرشادات مضمّنة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة حقنها بعد Compaction. القيمة الافتراضية هي `["Session Startup", "Red Lines"]`؛ اضبطها على `[]` لتعطيل إعادة الحقن. وعند تركها غير مضبوطة أو ضبطها صراحةً على هذا الزوج الافتراضي، يتم أيضًا قبول عناوين `Every Session`/`Safety` الأقدم كرجوع قديم.
- `model`: تجاوز اختياري لـ `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما يجب أن تبقى الجلسة الرئيسية على نموذج معيّن لكن تعمل ملخصات Compaction على نموذج آخر؛ وعند حذفه، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عندما تكون `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction وعند اكتماله (مثل "Compacting context..." و"Compaction complete"). يكون معطّلًا افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. يتم تخطيه عندما تكون `workspace` للقراءة فقط.

### `agents.defaults.contextPruning`

يقوم بتقليم **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرسالها إلى LLM. ولا **يعدّل** سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // مدة (ms/s/m/h)، الوحدة الافتراضية: الدقائق
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

- يفعّل `mode: "cache-ttl"` عمليات التقليم.
- يتحكم `ttl` في عدد المرات التي يمكن أن يعمل فيها التقليم مجددًا (بعد آخر لمسة على cache).
- يقوم التقليم أولًا باقتطاع نتائج الأدوات الكبيرة اقتطاعًا خفيفًا، ثم يمسح نتائج الأدوات الأقدم مسحًا كاملًا إذا لزم الأمر.

**الاقتطاع الخفيف** يحتفظ بالبداية + النهاية ويُدرج `...` في الوسط.

**المسح الكامل** يستبدل نتيجة الأداة بالكامل بعنصر نائب.

ملاحظات:

- لا يتم أبدًا اقتطاع/مسح كتل الصور.
- تعتمد النسب على الأحرف (تقريبية)، وليست على عدد الرموز الدقيق.
- إذا وُجد عدد أقل من `keepLastAssistants` من رسائل المساعد، يتم تخطي التقليم.

</Accordion>

راجع [Session Pruning](/ar/concepts/session-pruning) للحصول على تفاصيل السلوك.

### التدفق على شكل كتل

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

- تتطلب القنوات غير Telegram ضبط `*.blockStreaming: true` صراحةً لتمكين الردود على شكل كتل.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` ‏(ومتغيرات كل حساب). وتستخدم Signal/Slack/Discord/Google Chat افتراضيًا `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود على شكل كتل. تعني `natural` = ‏800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) لمعرفة تفاصيل السلوك + التقسيم إلى أجزاء.

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

- القيم الافتراضية: `instant` للدردشات المباشرة/الإشارات، و`message` للدردشات الجماعية غير المشار فيها.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [Typing Indicators](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

إعداد sandbox اختياري للوكيل المضمّن. راجع [Sandboxing](/ar/gateway/sandboxing) للحصول على الدليل الكامل.

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
          // SecretRefs / المحتويات المضمنة مدعومة أيضًا:
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

<Accordion title="تفاصيل sandbox">

**الواجهة الخلفية:**

- `docker`: runtime محلي لـ Docker ‏(الافتراضي)
- `ssh`: runtime بعيد عام مدعوم بـ SSH
- `openshell`: runtime لـ OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بالـ runtime إلى
`plugins.entries.openshell.config`.

**تكوين الواجهة الخلفية لـ SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH ‏(الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لـ workspace لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت runtime
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح سياسة مفتاح المضيف في OpenSSH

**أسبقية مصادقة SSH:**

- يتغلب `identityData` على `identityFile`
- يتغلب `certificateData` على `certificateFile`
- يتغلب `knownHostsData` على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من لقطة runtime النشطة للأسرار قبل بدء جلسة sandbox

**سلوك الواجهة الخلفية لـ SSH:**

- يجهّز workspace البعيد مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي workspace البعيد عبر SSH هو النسخة الأساسية
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة تلقائيًا إلى المضيف
- لا يدعم حاويات متصفح sandbox

**وصول workspace:**

- `none`: ‏workspace لـ sandbox لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: ‏workspace لـ sandbox عند `/workspace`، وworkspace الوكيل مركّب للقراءة فقط عند `/agent`
- `rw`: ‏workspace الوكيل مركّب للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + workspace لكل جلسة
- `agent`: حاوية + workspace واحد لكل وكيل (الافتراضي)
- `shared`: حاوية وworkspace مشتركان (من دون عزل بين الجلسات)

**تكوين Plugin لـ OpenShell:**

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

- `mirror`: تجهيز البعيد من المحلي قبل `exec`، ثم المزامنة عكسيًا بعد `exec`؛ وتبقى workspace المحلية هي النسخة الأساسية
- `remote`: تجهيز البعيد مرة واحدة عند إنشاء sandbox، ثم إبقاء workspace البعيدة هي النسخة الأساسية

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw تلقائيًا إلى sandbox بعد خطوة التجهيز.
يكون النقل عبر SSH إلى sandbox الخاص بـ OpenShell، لكن Plugin يملك دورة حياة sandbox ومزامنة mirror الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى خروج شبكة، وجذر قابل للكتابة، ومستخدم root.

**تستخدم الحاويات افتراضيًا `network: "none"`** — اضبطها على `"bridge"` ‏(أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. ويتم حظر `"container:<id>"` افتراضيًا ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` ‏(وضع طارئ).

**تُجهَّز المرفقات الواردة** داخل `media/inbound/*` في workspace النشطة.

**`docker.binds`** يركّب أدلة إضافية من المضيف؛ ويتم دمج bindات المستوى العام وكل وكيل.

**المتصفح داخل sandbox** ‏(`sandbox.browser.enabled`): ‏Chromium + CDP داخل حاوية. يتم حقن عنوان noVNC URL في system prompt. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- يمنع `allowHostControl: false` ‏(الافتراضي) الجلسات داخل sandbox من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` ‏(شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا دخول CDP عند حافة الحاوية إلى نطاق CIDR ‏(على سبيل المثال `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بتركيب أدلة إضافية من المضيف داخل حاوية متصفح sandbox فقط. وعند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- يتم تعريف إعدادات التشغيل الافتراضية في `scripts/sandbox-browser-entrypoint.sh` وضبطها لمضيفي الحاويات:
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
    مفعّلة افتراضيًا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تمكين الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه على `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عندما يكون `noSandbox` مفعّلًا.
  - تمثل القيم الافتراضية خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير القيم الافتراضية للحاوية.

</Accordion>

يكون Browser sandboxing و`sandbox.docker.binds` مخصصين لـ Docker فقط.

بناء الصور:

```bash
scripts/sandbox-setup.sh           # صورة sandbox الرئيسية
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
        thinkingDefault: "high", // تجاوز لمستوى thinking لكل وكيل
        reasoningDefault: "on", // تجاوز لرؤية reasoning لكل وكيل
        fastModeDefault: false, // تجاوز للوضع السريع لكل وكيل
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

- `id`: معرّف ثابت للوكيل (مطلوب).
- `default`: عند ضبط عدة وكلاء، يفوز الأول (مع تسجيل تحذير). وإذا لم يتم ضبط أيٍّ منهم، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: تتجاوز صيغة السلسلة `primary` فقط؛ بينما تتجاوز صيغة الكائن `{ primary, fallbacks }` كليهما (`[]` يعطّل قيم التحويل عند الفشل العامة). وتظل مهام Cron التي تتجاوز `primary` فقط ترث قيم التحويل عند الفشل الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات تدفق لكل وكيل مدمجة فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. وإذا حُذفت، يرث الوكيل `agents.defaults.skills` عند ضبطها؛ وتستبدل القائمة الصريحة القيم الافتراضية بدلًا من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى thinking افتراضي اختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة.
- `reasoningDefault`: رؤية reasoning افتراضية اختيارية لكل وكيل (`on | off | stream`). وتُطبق عندما لا يكون هناك تجاوز reasoning لكل رسالة أو جلسة.
- `fastModeDefault`: افتراضي اختياري للوضع السريع لكل وكيل (`true | false`). ويُطبق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `embeddedHarness`: تجاوز اختياري لسياسة harness منخفض المستوى لكل وكيل. استخدم `{ runtime: "codex", fallback: "none" }` لجعل وكيل واحد خاصًا بـ Codex فقط بينما يحتفظ الوكلاء الآخرون بالرجوع الافتراضي إلى PI.
- `runtime`: واصف runtime اختياري لكل وكيل. استخدم `type: "acp"` مع القيم الافتراضية لـ `runtime.acp` ‏(`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يستخدم الوكيل جلسات ACP harness افتراضيًا.
- `identity.avatar`: مسار نسبي إلى workspace، أو عنوان `http(s)` URL، أو URI من نوع `data:`.
- تستمد `identity` قيمًا افتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لـ `sessions_spawn` ‏(`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حاجز وراثة sandbox: إذا كانت جلسة الطالب داخل sandbox، فإن `sessions_spawn` يرفض الأهداف التي ستعمل خارج sandbox.
- `subagents.requireAgentId`: عندما تكون true، يمنع استدعاءات `sessions_spawn` التي تحذف `agentId` ‏(يفرض اختيار profile صريح؛ الافتراضي: false).

---

## التوجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [Multi-Agent](/ar/concepts/multi-agent).

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

- `type` ‏(اختياري): ‏`route` للتوجيه العادي (والنوع المفقود افتراضيًا هو route)، و`acp` لارتباطات محادثات ACP المستمرة.
- `match.channel` ‏(مطلوب)
- `match.accountId` ‏(اختياري؛ `*` = أي حساب؛ والمحذوف = الحساب الافتراضي)
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

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw المطابقة حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات route binding أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (من دون sandbox)">

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

<Accordion title="أدوات + workspace للقراءة فقط">

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

راجع [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) للحصول على تفاصيل الأسبقية.

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
    parentForkMaxTokens: 100000, // تخطي تشعب السلسلة الأصلية فوق هذا العدد من الرموز (0 يعطّل)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // مدة أو false
      maxDiskBytes: "500mb", // ميزانية قصوى اختيارية
      highWaterBytes: "400mb", // هدف تنظيف اختياري
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // الإلغاء التلقائي للتركيز بعد عدم النشاط بالساعات (`0` يعطّل)
      maxAgeHours: 0, // الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل)
    },
    mainKey: "main", // قديم (يستخدم runtime دائمًا "main")
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
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون المقصود سياقًا مشتركًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك جميع الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: عزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: عزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: عزل لكل حساب + قناة + مرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: تعيين المعرفات الأساسية إلى أقران مسبوقين بالموفر من أجل مشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. تقوم `daily` بإعادة التعيين عند `atHour` وفق التوقيت المحلي؛ وتقوم `idle` بإعادة التعيين بعد `idleMinutes`. وعند تكوين الاثنين، يفوز أول ما تنتهي صلاحيته.
- **`resetByType`**: تجاوزات حسب النوع (`direct` و`group` و`thread`). ويتم قبول `dm` القديم كاسم مستعار لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لقيمة `totalTokens` في الجلسة الأصلية المسموح بها عند إنشاء جلسة سلسلة متشعبة (الافتراضي `100000`).
  - إذا كانت `totalTokens` في الأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة سلسلة جديدة بدلًا من وراثة سجل transcript الخاص بالأصل.
  - اضبطها على `0` لتعطيل هذا الحاجز والسماح دائمًا بالتشعب من الأصل.
- **`mainKey`**: حقل قديم. يستخدم runtime دائمًا `"main"` لحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء التبادلات بين الوكلاء (عدد صحيح، المجال: `0`–`5`). تؤدي القيمة `0` إلى تعطيل تسلسل ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` ‏(`direct|group|channel`، مع الاسم المستعار القديم `dm`) أو `keyPrefix` أو `rawKeyPrefix`. يفوز أول رفض.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات + الاحتفاظ.
  - `mode`: تقوم `warn` بإصدار تحذيرات فقط؛ بينما تطبق `enforce` التنظيف.
  - `pruneAfter`: حد العمر لإدخالات التقادم (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` ‏(الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات transcript من نوع `*.reset.<timestamp>`. وتكون افتراضيًا مساوية لـ `pruneAfter`؛ اضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. وفي وضع `warn` تسجل تحذيرات؛ وفي وضع `enforce` تزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. ويكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: القيم الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للموفرات تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: الإلغاء التلقائي الافتراضي للتركيز بعد عدم النشاط بالساعات (`0` يعطّل؛ ويمكن للموفرات تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ ويمكن للموفرات تجاوزه)

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
      debounceMs: 2000, // 0 يعطّل
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

آلية الحل (الأكثر تخصيصًا يفوز): الحساب ← القناة ← العام. تؤدي القيمة `""` إلى التعطيل وإيقاف التسلسل. وتستنتج `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف            | المثال                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | الاسم المختصر للنموذج       | `claude-opus-4-6`           |
| `{modelFull}`     | المعرّف الكامل للنموذج  | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم provider          | `anthropic`                 |
| `{thinkingLevel}` | مستوى thinking الحالي | `high` أو `low` أو `off`        |
| `{identity.name}` | اسم هوية الوكيل    | (مثل `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. ويُعد `{think}` اسمًا مستعارًا لـ `{thinkingLevel}`.

### تفاعل الإقرار

- يكون افتراضيًا `identity.emoji` الخاص بالوكيل النشط، وإلا `"👀"`. اضبطه على `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب ← القناة ← `messages.ackReaction` ← رجوع الهوية.
- النطاق: `group-mentions` ‏(الافتراضي)، أو `group-all`، أو `direct`، أو `all`.
- يقوم `removeAckAfterReply` بإزالة تفاعل الإقرار بعد الرد في Slack وDiscord وTelegram.
- يفعّل `messages.statusReactions.enabled` تفاعلات حالة دورة الحياة في Slack وDiscord وTelegram.
  وفي Slack وDiscord، يحافظ تركه غير مضبوط على تفعيل تفاعلات الحالة عندما تكون تفاعلات الإقرار نشطة.
  وفي Telegram، اضبطه صراحةً على `true` لتفعيل تفاعلات حالة دورة الحياة.

### تأخير الإدخال

يجمع الرسائل النصية السريعة فقط من المرسل نفسه في دور وكيل واحد. وتؤدي الوسائط/المرفقات إلى التفريغ فورًا. وتتجاوز أوامر التحكم آلية التأخير.

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
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` ‏(اشتراك اختياري).
- تعود API keys إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يتجاوز `openai.baseUrl` نقطة نهاية TTS في OpenAI. وترتيب الحل هو: التكوين، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية ليست من OpenAI، يتعامل OpenClaw معها على أنها خادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عندما يتم تكوين عدة موفري Talk.
- تكون مفاتيح Talk المسطحة القديمة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) للتوافق فقط، ويتم ترحيلها تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الصوت إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية عادية أو كائنات SecretRef.
- لا يُطبّق الرجوع إلى `ELEVENLABS_API_KEY` إلا عندما لا يكون هناك Talk API key مكوَّن.
- يسمح `providers.*.voiceAliases` لتوجيهات Talk باستخدام أسماء مألوفة.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع Talk بعد صمت المستخدم قبل إرسال transcript. ويؤدي تركه غير مضبوط إلى الإبقاء على نافذة التوقف الافتراضية الخاصة بالمنصة (`700 ms` على macOS وAndroid، و`900 ms` على iOS).

---

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

تضبط عملية الإعداد الأولي المحلي التكوينات المحلية الجديدة افتراضيًا على `tools.profile: "coding"` عندما تكون غير مضبوطة (مع الحفاظ على ملفات التعريف الصريحة الموجودة).

| ملف التعريف     | يتضمن                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط                                                                                                           |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status`                                       |
| `full`      | بلا قيود (مثل غير المضبوط)                                                                                                  |

### مجموعات الأدوات

| المجموعة              | الأدوات                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec` و`process` و`code_execution` ‏(`bash` مقبول كاسم مستعار لـ `exec`)                                         |
| `group:fs`         | `read` و`write` و`edit` و`apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list` و`sessions_history` و`sessions_send` و`sessions_spawn` و`sessions_yield` و`subagents` و`session_status` |
| `group:memory`     | `memory_search` و`memory_get`                                                                                           |
| `group:web`        | `web_search` و`x_search` و`web_fetch`                                                                                   |
| `group:ui`         | `browser` و`canvas`                                                                                                     |
| `group:automation` | `cron` و`gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image` و`image_generate` و`video_generate` و`tts`                                                                      |
| `group:openclaw`   | جميع الأدوات المضمنة (باستثناء provider plugins)                                                                          |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (المنع يفوز). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. وتُطبَّق حتى عندما يكون Docker sandbox معطّلًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقييد إضافي للأدوات لموفرين أو نماذج محددة. الترتيب: ملف التعريف الأساسي ← ملف تعريف provider ← allow/deny.

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

يتحكم في وصول `exec` المرتفع خارج sandbox:

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
- يقوم `/elevated on|off|ask|full` بتخزين الحالة لكل جلسة؛ بينما تنطبق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع sandboxing ويستخدم مسار الخروج المكوَّن (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

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

تكون فحوصات أمان حلقات الأدوات **معطلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف.
يمكن تعريف الإعدادات عمومًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

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
- `warningThreshold`: حد نمط التكرار بلا تقدم لإصدار التحذيرات.
- `criticalThreshold`: حد أعلى للتكرار لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: حد إيقاف صارم لأي تشغيل بلا تقدم.
- `detectors.genericRepeat`: التحذير عند تكرار استدعاءات الأداة نفسها/المعاملات نفسها.
- `detectors.knownPollNoProgress`: التحذير/الحظر عند أدوات polling المعروفة (`process.poll` و`command_status` وغير ذلك).
- `detectors.pingPong`: التحذير/الحظر عند أنماط الأزواج المتبادلة بلا تقدم.
- إذا كان `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // أو متغير البيئة BRAVE_API_KEY
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

يضبط فهم الوسائط الواردة (الصورة/الصوت/الفيديو):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // اشتراك اختياري: إرسال الموسيقى/الفيديو غير المتزامن المكتمل مباشرة إلى القناة
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

**إدخال provider** ‏(`type: "provider"` أو محذوف):

- `provider`: معرّف موفر API ‏(`openai` أو `anthropic` أو `google`/`gemini` أو `groq` وغير ذلك)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار profile من `auth-profiles.json`

**إدخال CLI** ‏(`type: "cli"`):

- `command`: الملف التنفيذي المراد تشغيله
- `args`: معاملات ذات قوالب (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وغير ذلك)

**الحقول المشتركة:**

- `capabilities`: قائمة اختيارية (`image` أو `audio` أو `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، و`google` ← صورة+صوت+فيديو، و`groq` ← صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تؤدي حالات الفشل إلى الرجوع إلى الإدخال التالي.

تتبع مصادقة provider الترتيب القياسي: `auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عندما تكون `true`، تحاول مهام
  `music_generate` و`video_generate` غير المتزامنة المكتملة التسليم المباشر إلى القناة أولًا. والقيمة الافتراضية `false`
  (مسار الاستيقاظ/تسليم النموذج القديم الخاص بجلسة الطالب).

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

الافتراضي: `tree` ‏(الجلسة الحالية + الجلسات التي أنشأتها، مثل subagents).

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
- `tree`: الجلسة الحالية + الجلسات التي أنشأتها الجلسة الحالية (subagents).
- `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (قد يتضمن مستخدمين آخرين إذا كنت تشغّل جلسات لكل مرسل تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. ولا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- تقييد sandbox: عندما تكون الجلسة الحالية داخل sandbox ويكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض الرؤية إلى `tree` حتى لو كانت `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // اشتراك اختياري: اضبطه على true للسماح بمرفقات ملفات مضمنة
        maxTotalBytes: 5242880, // 5 MB إجمالًا عبر جميع الملفات
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB لكل ملف
        retainOnSessionKeep: false, // الاحتفاظ بالمرفقات عندما يكون cleanup="keep"
      },
    },
  },
}
```

ملاحظات:

- تكون المرفقات مدعومة فقط لـ `runtime: "subagent"`. ويرفض ACP runtime هذه المرفقات.
- يتم تجسيد الملفات في workspace الفرعية عند `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
- يتم تلقائيًا تنقيح محتوى المرفقات من استمرار transcript.
- يتم التحقق من مدخلات Base64 بفحوص صارمة للأبجدية/الحشو وحاجز حجم قبل فك الترميز.
- تكون أذونات الملفات `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: يقوم `delete` دائمًا بإزالة المرفقات؛ بينما يحتفظ بها `keep` فقط عندما تكون `retainOnSessionKeep: true`.

### `tools.experimental`

أعلام الأدوات المضمنة التجريبية. تكون معطلة افتراضيًا ما لم تنطبق قاعدة تفعيل تلقائي صارمة لـ GPT-5 agentic.

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

- `planTool`: يفعّل أداة `update_plan` المنظمة لتتبع الأعمال متعددة الخطوات غير البسيطة.
- الافتراضي: `false` ما لم يتم ضبط `agents.defaults.embeddedPi.executionContract` ‏(أو تجاوز لكل وكيل) على `"strict-agentic"` لتشغيل من عائلة OpenAI أو OpenAI Codex GPT-5. اضبطه على `true` لفرض تفعيل الأداة خارج هذا النطاق، أو على `false` لإبقائها معطلة حتى في تشغيلات GPT-5 strict-agentic.
- عند تفعيلها، يضيف system prompt أيضًا إرشادات استخدام بحيث لا يستخدمها النموذج إلا للأعمال الجوهرية ويحافظ على خطوة واحدة فقط في حالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين المنشئين. وإذا حُذف، يرث الوكلاء الفرعيون نموذج المتصل.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء المستهدفة لـ `sessions_spawn` عندما لا يضبط وكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. وتعني القيمة `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## موفرو base URLs المخصصون

يستخدم OpenClaw فهرس النماذج المضمن. أضف موفرين مخصصين عبر `models.providers` في التكوين أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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
- تجاوز جذر تكوين الوكيل باستخدام `OPENCLAW_AGENT_DIR` ‏(أو `PI_CODING_AGENT_DIR`، وهو اسم مستعار قديم لمتغير البيئة).
- أسبقية الدمج لمعرّفات provider المطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاصة بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة في الوكيل فقط عندما لا يكون ذلك provider مُدارًا عبر SecretRef في سياق التكوين/ملف التعريف الحالي للمصادقة.
  - يتم تحديث قيم `apiKey` للموفرات المدارة عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec) بدلًا من استمرار الأسرار المحلولة.
  - يتم تحديث قيم header الخاصة بالموفرات المدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec).
  - تعود قيم `apiKey`/`baseUrl` الفارغة أو المحذوفة في الوكيل إلى `models.providers` في التكوين.
  - تستخدم القيم المطابقة لـ `contextWindow`/`maxTokens` في النموذج القيمة الأعلى بين التكوين الصريح وقيم الفهرس الضمنية.
  - يحتفظ `contextTokens` المطابق في النموذج بحد runtime صريح عند وجوده؛ استخدمه لتقييد السياق الفعلي من دون تغيير بيانات النموذج الأصلية.
  - استخدم `models.mode: "replace"` عندما تريد أن يعيد التكوين كتابة `models.json` بالكامل.
  - يكون استمرار العلامات معتمدًا على المصدر: تُكتب العلامات من لقطة تكوين المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة في runtime.

### تفاصيل حقول provider

- `models.mode`: سلوك فهرس provider ‏(`merge` أو `replace`).
- `models.providers`: خريطة الموفّرين المخصصين مفهرسة بمعرّف provider.
- `models.providers.*.api`: مهايئ الطلب (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai` وغير ذلك).
- `models.providers.*.apiKey`: بيانات اعتماد provider ‏(يُفضّل استخدام SecretRef/استبدال متغيرات البيئة).
- `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يتم حقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: فرض نقل بيانات الاعتماد في ترويسة `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لـ API العلوي.
- `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه proxy/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بموفر النموذج.
  - `request.headers`: ترويسات إضافية (تُدمج مع القيم الافتراضية للموفر). وتقبل القيم SecretRef.
  - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` ‏(استخدام المصادقة المضمنة الخاصة بالموفر)، و`"authorization-bearer"` ‏(مع `token`)، و`"header"` ‏(مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز HTTP proxy. الأوضاع: `"env-proxy"` ‏(استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`) و`"explicit-proxy"` ‏(مع `url`). ويقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` ‏(كلها تقبل SecretRef)، و`serverName` و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عندما تكون `true`، تسمح باستخدام HTTPS إلى `baseUrl` عندما يحل DNS إلى نطاقات خاصة أو CGNAT أو ما شابه، عبر حاجز جلب HTTP الخاص بالموفر (اشتراك اختياري للمشغل لنقاط النهاية OpenAI-compatible المستضافة ذاتيًا والموثوقة). ويستخدم WebSocket الطلب `request` نفسه للترويسات/TLS ولكن ليس حاجز SSRF الخاص بالجلب. القيمة الافتراضية `false`.
- `models.providers.*.models`: إدخالات فهرس نماذج provider الصريحة.
- `models.providers.*.models.*.contextWindow`: بيانات وصفية لنافذة سياق النموذج الأصلية.
- `models.providers.*.models.*.contextTokens`: حد سياق runtime اختياري. استخدم هذا عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير أصلي وغير فارغ (المضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` وقت runtime. ويُبقي `baseUrl` الفارغ/المحذوف سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية chat المتوافقة مع OpenAI التي تدعم المحتوى النصي فقط. وعندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية البحتة إلى سلاسل نصية عادية قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS الخاصة بالاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: عامل تصفية اختياري لمعرّف provider من أجل اكتشاف موجه.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فترة polling لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة سياق احتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الاحتياطي الأقصى لرموز الإخراج للنماذج المكتشفة.

### أمثلة على provider

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

اضبط `OPENCODE_API_KEY` ‏(أو `OPENCODE_ZEN_API_KEY`). استخدم مراجع `opencode/...` لفهرس Zen أو مراجع `opencode-go/...` لفهرس Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

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

اضبط `ZAI_API_KEY`. ويُقبل كل من `z.ai/*` و`z-ai/*` كأسماء مستعارة. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة النهاية البرمجية (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف provider مخصصًا مع تجاوز `baseUrl`.

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

بالنسبة إلى نقطة النهاية في الصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

تعلن نقاط النهاية الأصلية لـ Moonshot عن توافق استخدام التدفق على النقل المشترك
`openai-completions`، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية
وليس على معرّف provider المضمن وحده.

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

متوافق مع Anthropic، وprovider مضمّن. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (متوافق مع Anthropic)">

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

يجب أن يحذف Base URL اللاحقة `/v1` ‏(لأن عميل Anthropic يضيفها). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (مباشر)">

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
يكون فهرس النماذج افتراضيًا على M2.7 فقط.
في مسار التدفق المتوافق مع Anthropic، يعطّل OpenClaw قيمة thinking في MiniMax
افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. ويؤدي `/fast on` أو
`params.fastMode: true` إلى إعادة كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ وأبقِ النماذج المستضافة مدمجة للرجوع الاحتياطي.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة نصية عادية
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: قائمة سماح اختيارية لـ Skills المضمنة فقط (ولا تتأثر Skills المُدارة/الخاصة بـ workspace).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أسبقية).
- `install.preferBrew`: عندما تكون true، يفضّل استخدام Homebrew عند
  توفر `brew` قبل الرجوع إلى أنواع المُثبِّتات الأخرى.
- `install.nodeManager`: تفضيل مُثبِّت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` يعطّل Skill حتى لو كانت مضمّنة/مثبّتة.
- `entries.<skillKey>.apiKey`: وسيلة مريحة لـ Skills التي تعلن عن متغير بيئة أساسي (سلسلة نصية عادية أو كائن SecretRef).

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

- يتم التحميل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف OpenClaw plugins الأصلية بالإضافة إلى حِزم Codex المتوافقة وحِزم Claude، بما في ذلك حِزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات التكوين إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (يتم تحميل plugins المدرجة فقط). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل مريح على مستوى Plugin لمفتاح API ‏(عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يمنع core ‏`before_prompt_build` ويتجاهل الحقول المعدِّلة للـ prompt من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على hooks الخاصة بالـ Plugin الأصلية وأدلة hooks التي توفرها الحِزم المدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: الوثوق صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل في تشغيلات subagent الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية للأهداف القياسية `provider/model` لتجاوزات subagent الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن تكوين يعرّفه Plugin ‏(ويتم التحقق منه بواسطة schema الخاصة بـ OpenClaw Plugin الأصلية عندما تكون متاحة).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفر web-fetch الخاص بـ Firecrawl.
  - `apiKey`: مفتاح API الخاص بـ Firecrawl ‏(يقبل SecretRef). ويعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API الخاص بـ Firecrawl ‏(الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: العمر الأقصى للذاكرة المؤقتة بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث Grok على الويب).
  - `enabled`: تمكين موفر X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والحدود.
  - `enabled`: المفتاح الرئيسي لـ Dreaming ‏(الافتراضي `false`).
  - `frequency`: إيقاع Cron لكل اجتياح Dreaming كامل (الافتراضي `"0 3 * * *"`).
  - تُعد سياسة المراحل والحدود تفاصيل تنفيذ (وليست مفاتيح تكوين موجهة للمستخدم).
- يوجد تكوين الذاكرة الكامل في [مرجع تكوين الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضًا لـ Claude bundle plugins المفعّلة أن تسهم في القيم الافتراضية المضمنة لـ Pi من `settings.json`؛ ويطبق OpenClaw هذه القيم كإعدادات وكلاء منقّاة، وليس كرقع تكوين خام لـ OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ والافتراضي `"legacy"` ما لم تثبّت محركًا آخر وتحدده.
- `plugins.installs`: بيانات تعريف التثبيت المُدارة عبر CLI والمستخدمة بواسطة `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - تعامل مع `plugins.installs.*` على أنها حالة مُدارة؛ ويفضّل استخدام أوامر CLI بدلًا من التحرير اليدوي.

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
      // dangerouslyAllowPrivateNetwork: true, // اشترك فقط عند الثقة المتعمدة في الوصول إلى الشبكات الخاصة
      // allowPrivateNetwork: true, // اسم مستعار قديم
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
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عندما لا يُضبط، لذا يبقى تنقل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا في تنقل المتصفح داخل الشبكات الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية CDP للملفات التعريفية البعيدة (`profiles.*.cdpUrl`) لحظر الشبكات الخاصة نفسه أثناء فحوصات الوصول/الاكتشاف.
- يبقى `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون الملفات التعريفية البعيدة للربط فقط (ويتم تعطيل start/stop/reset).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw ‏`/json/version`؛ واستخدم WS(S)
  عندما يزوّدك provider بعنوان DevTools WebSocket URL مباشر.
- تستخدم الملفات التعريفية من نوع `existing-session` قيمة Chrome MCP بدلًا من CDP ويمكنها الربط على
  المضيف المحدد أو عبر browser node متصلة.
- يمكن للملفات التعريفية من نوع `existing-session` ضبط `userDataDir` لاستهداف
  ملف تعريف محدد لمتصفح قائم على Chromium مثل Brave أو Edge.
- تحتفظ الملفات التعريفية من نوع `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات معتمدة على snapshot/ref بدلًا من استهداف CSS-selector، وhooks لرفع ملف واحد،
  ومن دون تجاوزات لمهلات dialog، ومن دون `wait --load networkidle`، ومن دون
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو الإجراءات الدفعية.
- تقوم الملفات التعريفية المحلية المُدارة `openclaw` بتعيين `cdpPort` و`cdpUrl` تلقائيًا؛
  اضبط `cdpUrl` صراحةً فقط من أجل CDP البعيد.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائمًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- خدمة Control: على loopback فقط (منفذ مشتق من `gateway.port`، الافتراضي `18791`).
- يقوم `extraArgs` بإلحاق علامات تشغيل إضافية إلى بدء Chromium المحلي (على سبيل المثال
  `--disable-gpu` أو حجم النافذة أو علامات التصحيح).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji أو نص قصير أو image URL أو data URI
    },
  },
}
```

- `seamColor`: لون التمييز لـ UI chrome في التطبيق الأصلي (مثل تلوين فقاعة Talk Mode).
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
      // allowExternalEmbedUrls: false, // خطير: السماح بعناوين embed خارجية مطلقة من نوع http(s)
      // allowedOrigins: ["https://control.example.com"], // مطلوب لـ Control UI غير loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // وضع رجوع خطير لأصل Host-header
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
      // عمليات منع HTTP إضافية على /tools/invoke
      deny: ["browser"],
      // إزالة الأدوات من قائمة المنع الافتراضية لـ HTTP
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

- `mode`: ‏`local` ‏(تشغيل Gateway) أو `remote` ‏(الاتصال بـ Gateway بعيد). ويرفض Gateway البدء ما لم يكن `local`.
- `port`: منفذ واحد متعدد الإرسال لكل من WS + HTTP. الأسبقية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` ‏(الافتراضي) أو `lan` ‏(`0.0.0.0`) أو `tailnet` ‏(عنوان Tailscale IP فقط) أو `custom`.
- **أسماء bind المستعارة القديمة**: استخدم قيم وضع bind في `gateway.bind` ‏(`auto` أو `loopback` أو `lan` أو `tailnet` أو `custom`)، وليس أسماء المضيف المستعارة (`0.0.0.0` أو `127.0.0.1` أو `localhost` أو `::` أو `::1`).
- **ملاحظة Docker**: تستمع قيمة bind الافتراضية `loopback` على `127.0.0.1` داخل الحاوية. ومع Docker bridge networking ‏(`-p 18789:18789`)، تصل الحركة إلى `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` ‏(أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. وتتطلب قيم bind غير loopback مصادقة Gateway. ويعني ذلك عمليًا رمزًا/كلمة مرور مشتركة أو reverse proxy واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ويُنشئ معالج الإعداد الأولي رمزًا افتراضيًا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` ‏(بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. وتفشل تدفقات البدء وتثبيت/إصلاح الخدمة عندما يكون الاثنان مكوَّنين ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح من دون مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ ولا يتم عرضه عمدًا في مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوض المصادقة إلى reverse proxy واعٍ بالهوية وثق في ترويسات الهوية من `gateway.trustedProxies` ‏(راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر proxy **غير loopback**؛ ولا تستوفي reverse proxies المحلية على المضيف نفسه مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve أن تفي بمصادقة Control UI/WebSocket ‏(تم التحقق منها عبر `tailscale whois`). ولا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale تلك؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. ويفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. ويكون افتراضيًا `true` عندما يكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. ويُطبق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع السر المشترك ورمز الجهاز كلٌّ على حدة). وتعطي المحاولات المحظورة `429` + `Retry-After`.
  - على مسار Control UI غير المتزامن في Tailscale Serve، تُسلسَل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدد في الطلب الثاني بدلًا من أن تمر كلها كعدم تطابق عادي.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمدًا أيضًا تقييد حركة localhost (لإعدادات الاختبار أو عمليات النشر الصارمة عبر proxy).
- يتم دائمًا خنق محاولات مصادقة WS ذات الأصل المتصفح مع تعطيل إعفاء loopback (كوسيلة دفاع إضافية ضد القوة الغاشمة من المتصفح على localhost).
- على loopback، تُعزل حالات القفل تلك ذات أصل المتصفح لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` ‏(tailnet فقط، bind على loopback) أو `funnel` ‏(عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات WebSocket الخاصة بـ Gateway. وهي مطلوبة عندما يُتوقع عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى أصل Host-header لعمليات النشر التي تعتمد عمدًا على سياسة أصل Host-header.
- `remote.transport`: ‏`ssh` ‏(الافتراضي) أو `direct` ‏(ws/wss). وبالنسبة إلى `direct`، يجب أن تكون `remote.url` من النوع `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ من جهة العميل يسمح بـ `ws://` النصي إلى عناوين IP موثوقة داخل الشبكات الخاصة؛ وتبقى القيمة الافتراضية مقتصرة على loopback فقط بالنسبة إلى النصي.
- `gateway.remote.token` / `.password` هما حقلا بيانات اعتماد العميل البعيد. ولا يقومان بتهيئة مصادقة Gateway بحد ذاتهما.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS URL الأساسي لـ APNs relay الخارجي المستخدم بواسطة بنيات iOS الرسمية/‏TestFlight بعد أن تنشر تسجيلات مدعومة بالـ relay إلى Gateway. ويجب أن يطابق هذا العنوان عنوان relay المضمّن في بنية iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى relay بالمللي ثانية. والقيمة الافتراضية `10000`.
- يتم تفويض التسجيلات المدعومة بالـ relay إلى هوية Gateway محددة. ويجلب تطبيق iOS المقترن `gateway.identity.get`، ويُدرج تلك الهوية في تسجيل relay، ويمرر إذن إرسال ضمن نطاق التسجيل إلى Gateway. ولا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لتكوين relay أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج تطوير فقط لعناوين relay من نوع HTTP على loopback. ويجب أن تبقى عناوين relay الإنتاجية على HTTPS.
- `gateway.channelHealthCheckMinutes`: فترة مراقبة صحة القناة بالدقائق. اضبطها على `0` لتعطيل إعادة التشغيل عبر مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: حد socket القديمة بالدقائق. اجعل هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات التشغيل عبر مراقب الصحة لكل قناة/حساب في ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات التشغيل الخاصة بمراقب الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب في القنوات متعددة الحسابات. وعند ضبطه، تكون له أسبقية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كرجوع احتياطي فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حلّهما، فإن الحل يفشل بشكل مغلق (من دون إخفاء الرجوع البعيد).
- `trustedProxies`: عناوين IP الخاصة بالـ reverse proxies التي تنهي TLS أو تحقن ترويسات العميل المحوَّلة. أدرج فقط الـ proxies التي تتحكم فيها. وتبقى إدخالات loopback صالحة لإعدادات proxy المحلية/الاكتشاف المحلي على المضيف نفسه (مثل Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway قيمة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك فشل مغلق.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لطلب HTTP ‏`POST /tools/invoke` ‏(تمدد قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء الأدوات من قائمة المنع الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية استجابة اختيارية:
  - `gateway.http.securityHeaders.strictTransportSecurity` ‏(اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل متعدد المثيلات

شغّل عدة Gateways على مضيف واحد مع منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

علامات مريحة: `--dev` ‏(يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` ‏(يستخدم `~/.openclaw-<name>`).

راجع [Gateways متعددة](/ar/gateway/multiple-gateways).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway ‏(HTTPS/WSS) ‏(الافتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيًا زوج cert/key محليًا موقعًا ذاتيًا عندما لا تكون الملفات الصريحة مكوّنة؛ للاستخدام المحلي/التطويري فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ واحفظه بأذونات مقيّدة.
- `caPath`: مسار اختياري إلى حزمة CA للتحقق من العميل أو سلاسل الثقة المخصصة.

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

- `mode`: يتحكم في كيفية تطبيق تعديلات التكوين في runtime.
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغير التكوين.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` ‏(الافتراضي): جرّب أولًا إعادة التحميل الساخن؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة debounce بالمللي ثانية قبل تطبيق تغييرات التكوين (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى للوقت بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل (الافتراضي: `300000` = 5 دقائق).

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
يتم رفض رموز hook الموجودة في query-string.

ملاحظات التحقق والأمان:

- يتطلب `hooks.enabled=true` وجود `hooks.token` غير فارغ.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` ‏(مثل `["hook:"]`).
- إذا كان mapping أو preset يستخدم `sessionKey` قائمًا على القوالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. ولا تتطلب مفاتيح mapping الثابتة ذلك الاشتراك الاختياري.

**نقاط النهاية:**

- `POST /hooks/wake` ← `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` ← `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - يتم قبول `sessionKey` من حمولة الطلب فقط عندما يكون `hooks.allowRequestSessionKey=true` ‏(الافتراضي: `false`).
- `POST /hooks/<name>` ← يتم حلها عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` الخاصة بـ mapping والمولدة بالقوالب على أنها مزوّدة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل mapping">

- يطابق `match.path` المسار الفرعي بعد `/hooks` ‏(مثلًا `/hooks/gmail` ← `gmail`).
- يطابق `match.source` حقلًا من الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى ضمن `hooks.transformsDir` ‏(ويتم رفض المسارات المطلقة والتنقل العكسي).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو المحذوف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook من دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لعملاء `/hooks/agent` ولمفاتيح جلسات mapping المعتمدة على القوالب بتعيين `sessionKey` ‏(الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات الخاصة بقيم `sessionKey` الصريحة (الطلب + mapping)، مثل `["hook:"]`. وتصبح مطلوبة عندما يستخدم أي mapping أو preset قيمة `sessionKey` قائمة على القوالب.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ وتكون القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` قيمة LLM لتشغيل هذا hook ‏(ويجب أن يكون مسموحًا به إذا كان فهرس النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم preset المضمّن لـ Gmail القيمة `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لتطابق مساحة أسماء Gmail، مثل `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز preset باستخدام `sessionKey` ثابت بدلًا من القيمة الافتراضية المعتمدة على القوالب.

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

- يبدأ Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما يكون مكوّنًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لتعطيله.
- لا تشغّل `gog gmail watch serve` منفصلًا بالتوازي مع Gateway.

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
- عند استخدام bind غير loopback: تتطلب مسارات canvas مصادقة Gateway ‏(token/password/trusted-proxy)، مثل بقية أسطح HTTP في Gateway.
- لا ترسل Node WebViews عادةً ترويسات مصادقة؛ وبعد إقران node واتصالها، يعلن Gateway عناوين capability URLs ضمن نطاق node للوصول إلى canvas/A2UI.
- ترتبط capability URLs بجلسة WS النشطة الخاصة بـ node وتنتهي سريعًا. ولا يُستخدم الرجوع المعتمد على IP.
- يحقن عميل live-reload في HTML المقدّم.
- ينشئ تلقائيًا `index.html` ابتدائيًا عندما يكون فارغًا.
- يقدّم أيضًا A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
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
- `full`: يتضمن `cliPath` + `sshPort`.
- يكون اسم المضيف افتراضيًا `openclaw`. ويمكن تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### النطاق الواسع ‏(DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية الإرسال تحت `~/.openclaw/dns/`. ومن أجل الاكتشاف عبر الشبكات، اقترنه بخادم DNS ‏(يوصى بـ CoreDNS) + DNS مقسّم عبر Tailscale.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` ‏(متغيرات بيئة مضمنة)

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

- لا تُطبق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ‏`.env` في CWD + ‏`~/.openclaw/.env` ‏(ولا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف profile الخاص بصدفة تسجيل الدخول.
- راجع [البيئة](/ar/help/environment) للحصول على الأسبقية الكاملة.

### استبدال متغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة تكوين باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- لا تُطابق إلا الأسماء الكبيرة: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل التكوين.
- استخدم `$${VAR}` للحصول على `${VAR}` حرفيًا.
- يعمل هذا مع `$include`.

---

## الأسرار

تكون مراجع الأسرار إضافية: فلا تزال القيم النصية العادية تعمل.

### `SecretRef`

استخدم بنية كائن واحدة:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` مع `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ‏`id`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط `id` مع `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرفات `source: "exec"` على مقاطع مسار `.` أو `..` مفصولة بشرطات مائلة (على سبيل المثال يتم رفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- يستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُدرج مراجع `auth-profiles.json` في حل runtime وتغطية التدقيق.

### تكوين موفري الأسرار

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // موفر env صريح اختياري
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

- يدعم موفر `file` الوضعين `mode: "json"` و`mode: "singleValue"` ‏(ويجب أن يكون `id` مساويًا لـ `"value"` في وضع singleValue).
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات بروتوكول على stdin/stdout.
- تُرفض مسارات الأوامر الرمزية افتراضيًا. اضبط `allowSymlinkCommand: true` للسماح بالمسارات الرمزية مع التحقق من مسار الهدف المحلول.
- إذا كان `trustedDirs` مكوّنًا، فإن فحص الدليل الموثوق ينطبق على مسار الهدف المحلول.
- تكون بيئة الابن لـ `exec` ضئيلة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة في الذاكرة، ثم لا تقرأ مسارات الطلب إلا من اللقطة.
- يُطبق ترشيح السطح النشط أثناء التفعيل: تفشل المراجع غير المحلولة على الأسطح المفعّلة عند البدء/إعادة التحميل، بينما يتم تخطي الأسطح غير النشطة مع بيانات تشخيصية.

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

- يتم تخزين ملفات التعريف لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأنماط بيانات الاعتماد الثابتة.
- لا تدعم ملفات التعريف ذات وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد auth-profile المدعومة بـ SecretRef.
- تأتي بيانات اعتماد runtime الثابتة من لقطات محلولة في الذاكرة؛ ويتم تنظيف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- يتم الاستيراد القديم لـ OAuth من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك runtime الخاص بالأسرار وأدوات `audit/configure/apply`: ‏[إدارة الأسرار](/ar/gateway/secrets).

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

- `billingBackoffHours`: التراجع الأساسي بالساعات عندما يفشل ملف تعريف بسبب أخطاء
  فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). ولا يزال من الممكن أن
  يندرج نص الفوترة الصريح هنا حتى في استجابات `401`/`403`، لكن تظل
  مطابقات النص الخاصة بكل provider مقصورة على provider الذي يملكها
  (مثل `Key limit exceeded` في OpenRouter). أما رسائل نافذة الاستخدام القابلة لإعادة المحاولة عبر HTTP `402` أو
  حدود الإنفاق الخاصة بالمؤسسة/مساحة العمل فتبقى في مسار `rate_limit`
  بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل provider لساعات التراجع المرتبط بالفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو التراجع الأسي المرتبط بالفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو التراجع الخاص بـ `auth_permanent` ‏(الافتراضي: `60`).
- `failureWindowHours`: النافذة المتحركة بالساعات المستخدمة لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى للتدويرات لملفات تعريف المصادقة ضمن provider نفسه عند أخطاء الحمل الزائد قبل الانتقال إلى التحويل عند الفشل للنموذج (الافتراضي: `1`). وتندرج هنا الأشكال الخاصة بانشغال provider مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير provider/profile محمّل فوق طاقته (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدويرات ملفات تعريف المصادقة ضمن provider نفسه عند أخطاء تحديد المعدل قبل الانتقال إلى التحويل عند الفشل للنموذج (الافتراضي: `1`). ويتضمن هذا الحوض الخاص بتحديد المعدل نصوصًا على شكل provider مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- يرتفع `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل منع عمليات الكتابة (عدد صحيح موجب؛ الافتراضي: `524288000` = ‏500 MB). استخدم تدوير سجلات خارجيًا لعمليات النشر الإنتاجية.

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

- `enabled`: المفتاح الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل الأعلام التي تفعّل مخرجات سجل موجّهة (وتدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: حد العمر بالمللي ثانية لإصدار تحذيرات الجلسات العالقة بينما تظل الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل مسار التصدير الخاص بـ OpenTelemetry ‏(الافتراضي: `false`).
- `otel.endpoint`: عنوان URL للمجمّع الخاص بتصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` ‏(الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير traces أو metrics أو logs.
- `otel.sampleRate`: معدل أخذ عينات trace من `0` إلى `1`.
- `otel.flushIntervalMs`: فترة التفريغ الدوري للقياس بالمللي ثانية.
- `cacheTrace.enabled`: تسجيل لقطات cache trace للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لملف JSONL الخاص بـ cache trace ‏(الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يُضمَّن في مخرجات cache trace ‏(القيم الافتراضية للجميع: `true`).

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
- `checkOnStart`: التحقق من تحديثات npm عند بدء Gateway ‏(الافتراضي: `true`).
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable ‏(الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية بالساعات لطرح قناة stable ‏(الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد الساعات بين فحوصات قناة beta ‏(الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: بوابة الميزة العامة لـ ACP ‏(الافتراضي: `false`).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسات ACP ‏(الافتراضي: `true`). اضبطها على `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضية لـ ACP runtime ‏(ويجب أن يطابق Plugin runtime مسجلًا لـ ACP).
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات ACP runtime؛ وتعني القيمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة في الوقت نفسه.
- `stream.coalesceIdleMs`: نافذة التفريغ الخامل بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: منع تكرار أسطر الحالة/الأدوات لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: ‏`"live"` يبث تدريجيًا؛ و`"final_only"` يخزن مؤقتًا حتى أحداث إنهاء الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المُسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى لأحرف أسطر حالة/تحديث ACP المُسقطة.
- `stream.tagVisibility`: سجل يربط أسماء الوسوم بتجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL الخاملة بالدقائق لعوامل جلسات ACP قبل أن تصبح مؤهلة للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري للتشغيل عند تهيئة بيئة ACP runtime.

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

- يتحكم `cli.banner.taglineMode` في نمط الشعار الفرعي داخل banner:
  - `"random"` ‏(الافتراضي): شعارات فرعية متناوبة ومضحكة/موسمية.
  - `"default"`: شعار فرعي ثابت ومحايد (`All your chats, one OpenClaw.`).
  - `"off"`: من دون نص شعار فرعي (مع استمرار عرض عنوان banner/الإصدار).
- لإخفاء banner بالكامل (وليس فقط الشعارات الفرعية)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

بيانات تعريف يكتبها CLI في تدفقات الإعداد الموجّهة (`onboard` و`configure` و`doctor`):

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

راجع حقول الهوية في `agents.list` تحت [القيم الافتراضية للوكلاء](#agent-defaults).

---

## Bridge ‏(قديم، تمت إزالته)

لم تعد البنيات الحالية تتضمن TCP bridge. وتتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من schema الخاصة بالتكوين (وسيفشل التحقق حتى تتم إزالتها؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="تكوين bridge القديم (مرجع تاريخي)">

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
    webhook: "https://example.invalid/legacy", // رجوع قديم ومُهمَل للوظائف المخزنة notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token اختياري لمصادقة Webhook الصادر
    sessionRetention: "24h", // سلسلة مدة أو false
    runLog: {
      maxBytes: "2mb", // الافتراضي 2_000_000 بايت
      keepLines: 2000, // الافتراضي 2000
    },
  },
}
```

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. كما تتحكم أيضًا في تنظيف أرشيفات transcript الخاصة بـ Cron المحذوفة. الافتراضي: `24h`؛ اضبطها على `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى لحجم كل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفظ بها عند تفعيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: bearer token المستخدم لتسليم POST الخاص بـ Cron Webhook ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلا تُرسل ترويسة مصادقة.
- `webhook`: عنوان Webhook احتياطي قديم ومُهمَل (`http/https`) يُستخدم فقط للوظائف المخزنة التي ما زال لديها `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للوظائف ذات التشغيل الواحد عند الأخطاء العابرة (الافتراضي: `3`؛ المجال: `0`–`10`).
- `backoffMs`: مصفوفة من تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — ‏`"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة محاولة جميع الأنواع العابرة.

ينطبق هذا فقط على وظائف Cron ذات التشغيل الواحد. وتستخدم الوظائف المتكررة معالجة فشل منفصلة.

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

- `enabled`: تفعيل تنبيهات الفشل لوظائف Cron ‏(الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `mode`: وضع التسليم — ترسل `"announce"` عبر رسالة قناة؛ بينما ترسل `"webhook"` إلى Webhook المكوَّن.
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

- الوجهة الافتراضية لإشعارات فشل Cron عبر جميع الوظائف.
- `mode`: ‏`"announce"` أو `"webhook"`؛ وتكون القيمة الافتراضية `"announce"` عندما تتوفر بيانات هدف كافية.
- `channel`: تجاوز للقناة من أجل تسليم announce. وتعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان Webhook URL. وهو مطلوب لوضع webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- يتجاوز `delivery.failureDestination` لكل وظيفة هذا الافتراضي العام.
- عندما لا يتم ضبط وجهة فشل عامة ولا لكل وظيفة، فإن الوظائف التي تسلّم بالفعل عبر `announce` تعود عند الفشل إلى ذلك الهدف الأساسي الخاص بـ announce.
- لا يكون `delivery.failureDestination` مدعومًا إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [وظائف Cron](/ar/automation/cron-jobs). ويتم تتبع تشغيلات Cron المعزولة كـ [مهام في الخلفية](/ar/automation/tasks).

---

## متغيرات قوالب نماذج الوسائط

العناصر النائبة للقوالب الموسعة في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | النص الكامل للرسالة الواردة                         |
| `{{RawBody}}`      | النص الخام (من دون أغلفة السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات                 |
| `{{From}}`         | معرّف المرسل                                 |
| `{{To}}`           | معرّف الوجهة                            |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | عنوان pseudo-URL للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                  |
| `{{MediaType}}`    | نوع الوسائط (image/audio/document/…)               |
| `{{Transcript}}`   | transcript الصوت                                  |
| `{{Prompt}}`       | prompt الوسائط المحلول لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول للأحرف الناتجة لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)               |
| `{{SenderName}}`   | اسم العرض للمرسل (بأفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                 |
| `{{Provider}}`     | تلميح provider ‏(whatsapp أو telegram أو discord، إلخ) |

---

## تضمينات التكوين (`$include`)

قسّم التكوين إلى عدة ملفات:

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
- مصفوفة ملفات: تُدمج بعمق بالترتيب (ويغلب اللاحق السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (وتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى عمق 10 مستويات.
- المسارات: تُحل نسبةً إلى الملف المُضمِّن، لكن يجب أن تبقى داخل دليل التكوين ذي المستوى الأعلى (`dirname` الخاص بـ `openclaw.json`). ويُسمح بالأشكال المطلقة/‏`../` فقط عندما تُحلّ داخل ذلك الحد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [التكوين](/ar/gateway/configuration) · [أمثلة على التكوين](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_
