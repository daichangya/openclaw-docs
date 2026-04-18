---
read_when:
    - تحتاج إلى دلالات إعدادات دقيقة على مستوى الحقول أو إلى القيم الافتراضية.
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو Gateway أو الأداة.
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-18T07:14:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b504c9c6b47d7a327a0acf6934561c9b2606c01cc8ebe5526ccde73033d759f
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع الإعدادات

مرجع الإعدادات الأساسية لملف `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجّهة للمهام، راجع [الإعدادات](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح إعدادات OpenClaw الرئيسية وتضع روابط خارجية عندما يكون لأحد الأنظمة الفرعية مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل فهرس أوامر مملوك للقنوات/Plugin أو كل خيار تفصيلي عميق للذاكرة/QMD في صفحة واحدة.

مصدر الحقيقة في الشيفرة:

- يطبع `openclaw config schema` مخطط JSON Schema الفعلي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات التعريف الخاصة بالحزم المضمّنة/Plugin/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالمسار لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط الأساس لوثائق الإعدادات مقارنةً بسطح المخطط الحالي

المراجع التفصيلية المخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming تحت `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/ar/tools/slash-commands) لفهرس الأوامر الحالي المضمن + المجمّع
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بكل قناة

تنسيق الإعدادات هو **JSON5** (تُسمح التعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

تبدأ كل قناة تلقائيًا عند وجود قسم إعداداتها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist`         | فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن) |
| `open`              | السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled`          | تجاهل جميع الرسائل المباشرة الواردة |

| سياسة المجموعات | السلوك |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | فقط المجموعات المطابقة لقائمة السماح المُعدّة |
| `open`                | تجاوز قوائم السماح الخاصة بالمجموعات (مع استمرار تطبيق اشتراط الإشارة) |
| `disabled`            | حظر جميع رسائل المجموعات/الغرف |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالمزوّد معيّنة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويُحدَّد الحد الأقصى لطلبات اقتران الرسائل المباشرة المعلقة عند **3 لكل قناة**.
إذا كانت كتلة المزوّد مفقودة بالكامل (`channels.<provider>` غير موجودة)، فإن سياسة المجموعات أثناء التشغيل تعود إلى `allowlist` (إغلاق افتراضي) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معيّن. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المهيأة. يُطبَّق تعيين القناة عندما لا تكون الجلسة تملك بالفعل تجاوزًا للنموذج (على سبيل المثال، تم تعيينه عبر `/model`).

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

### الإعدادات الافتراضية للقنوات وHeartbeat

استخدم `channels.defaults` للسلوك المشترك الخاص بسياسة المجموعات وHeartbeat عبر المزوّدين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما لا تكون `groupPolicy` على مستوى المزوّد معيّنة.
- `channels.defaults.contextVisibility`: وضع إظهار السياق التكميلي الافتراضي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/المواضيع/السجل)، و`allowlist` (تضمين السياق فقط من المرسلين الموجودين في قائمة السماح)، و`allowlist_quote` (مثل allowlist لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat بأسلوب مؤشرات مضغوط.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بـ Gateway ‏(Baileys Web). ويبدأ تلقائيًا عند وجود جلسة مرتبطة.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // علامتا الصح الزرقاوان (false في وضع الدردشة الذاتية)
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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا فسيُستخدم أول معرّف حساب مُهيأ (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري هذا اختيار الحساب الافتراضي الاحتياطي عندما يطابق معرّف حساب مُهيأ.
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
      streaming: "partial", // off | partial | block | progress (الافتراضي: off؛ فعّله صراحةً لتجنب حدود معدل تعديل المعاينة)
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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كقيمة احتياطية للحساب الافتراضي.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيأ.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، عيّن افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذّر `openclaw doctor` عندما يكون هذا مفقودًا أو غير صالح.
- يؤدي `configWrites: false` إلى حظر عمليات كتابة الإعدادات التي يبدؤها Telegram (ترحيل معرّفات supergroup، و`/config set|unset`).
- تُهيّئ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة لموضوعات المنتدى (استخدم الصيغة القانونية `chatId:topic:topicId` في `match.peer.id`). دلالات الحقول مشتركة في [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات البث في Telegram كلًا من `sendMessage` و`editMessageText` (وتعمل في الدردشات المباشرة والجماعية).
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
      streaming: "off", // off | partial | block | progress (تُطابق progress مع partial على Discord)
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
        spawnSubagentSessions: false, // تفعيل اختياري لـ sessions_spawn({ thread: true })
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
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` صريحًا لـ Discord ذلك الرمز المميز لهذا الاستدعاء؛ بينما تستمر إعدادات إعادة المحاولة/السياسة الخاصة بالحساب في الاعتماد على الحساب المحدد في اللقطة النشطة أثناء التشغيل.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيأ.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة guild) كأهداف للتسليم؛ وتُرفض المعرّفات الرقمية المجردة.
- تكون الأسماء المختصرة لـ guild بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). ويُفضّل استخدام معرّفات guild.
- تُتجاهل الرسائل التي ينشئها البوت افتراضيًا. يفعّل `allowBots: true` قبولها؛ واستخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (مع استمرار تصفية رسائله الذاتية).
- يؤدي `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) إلى إسقاط الرسائل التي تذكر مستخدمًا آخر أو دورًا آخر ولكنها لا تذكر البوت (باستثناء @everyone/@here).
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة عموديًا حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`، والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بعد عدم النشاط، بالساعات (`0` للتعطيل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر، بالساعات (`0` للتعطيل)
  - `spawnSubagentSessions`: مفتاح تفعيل اختياري لإنشاء/ربط السلاسل تلقائيًا بواسطة `sessions_spawn({ thread: true })`
- تُهيّئ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات القنوات الصوتية في Discord وتجاوزات الانضمام التلقائي وTTS الاختيارية.
- يُمرَّر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (القيم الافتراضية `true` و`24`).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة الجلسة الصوتية وإعادة الانضمام إليها بعد تكرار إخفاقات فك التشفير.
- يُعد `channels.discord.streaming` مفتاح وضع البث القانوني. وتُرحَّل تلقائيًا القيم القديمة `streamMode` وقيم `streaming` المنطقية.
- يربط `channels.discord.autoPresence` حالة التوفر أثناء التشغيل بحضور البوت (سليم => online، متدهور => idle، مستنفد => dnd)، ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل المطابقة القابلة للتغيير للاسم/الوسم (وضع توافق طارئ).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية في Discord وتفويض الموافقين.
  - `enabled`: القيم `true` أو `false` أو `"auto"` (الافتراضي). في وضع auto، تُفعَّل موافقات exec عندما يمكن حلّ الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. ويُستخدم `commands.ownerAllowFrom` كقيمة احتياطية عند حذفه.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. ترسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافقين، وترسل `"channel"` إلى القناة الأصلية، وترسل `"both"` إلى كليهما. وعندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل الموافقين الذين تم حلّهم.
  - `cleanupAfterResolve`: عند تعيينه إلى `true`، يحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعلات:** `off` (بدون)، `own` (رسائل البوت، الافتراضي)، `all` (كل الرسائل)، `allowlist` (من `guilds.<id>.users` على جميع الرسائل).

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
- القيم الاحتياطية من البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` كأهداف للتسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة كيان البريد الإلكتروني القابلة للتغيير (وضع توافق طارئ).

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
        nativeTransport: true, // استخدم واجهة Slack الأصلية للبث عندما يكون mode=partial
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

- يتطلب **وضع Socket** كلًا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كقيمة احتياطية من البيئة للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` بالإضافة إلى `signingSecret` (على المستوى الجذري أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل اعتماد مثل `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP، `signingSecretStatus`. وتعني `configured_unavailable` أن الحساب مهيأ عبر SecretRef لكن مسار الأمر/التشغيل الحالي لم يتمكن من حل قيمة السر.
- يؤدي `configWrites: false` إلى حظر عمليات كتابة الإعدادات التي يبدؤها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيأ.
- يُعد `channels.slack.streaming.mode` مفتاح وضع بث Slack القانوني. ويتحكم `channels.slack.streaming.nativeTransport` في وسيلة النقل الأصلية للبث في Slack. وتُرحَّل تلقائيًا القيم القديمة `streamMode` وقيم `streaming` المنطقية و`nativeStreaming`.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` كأهداف للتسليم.

**أوضاع إشعارات التفاعلات:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** يكون `thread.historyScope` لكل سلسلة على حدة (الافتراضي) أو مشتركًا عبر القناة. ويؤدي `thread.inheritParent` إلى نسخ سجل القناة الأم إلى السلاسل الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة السلسلة بأسلوب Slack assistant "is typing..." هدف ردّ داخل سلسلة. وتبقى الرسائل المباشرة ذات المستوى الأعلى خارج السلاسل افتراضيًا، لذلك تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بأسلوب السلسلة.
- تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم تزيله عند الاكتمال. استخدم اختصار emoji في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية في Slack وتفويض الموافقين. نفس مخطط Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تعديل/حذف |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد |
| memberInfo   | مفعّل | معلومات العضو |
| emojiList    | مفعّل | قائمة emoji المخصصة |

### Mattermost

يُشحن Mattermost كـ Plugin: ‏`openclaw plugins install @openclaw/mattermost`.

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
        native: true, // تفعيل اختياري
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // عنوان URL صريح اختياري لعمليات النشر العامة/خلف وكيل عكسي
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

أوضاع الدردشة: `oncall` (الرد عند @-mention، الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة التشغيل).

عند تفعيل الأوامر الأصلية في Mattermost:

- يجب أن يكون `commands.callbackPath` مسارًا (على سبيل المثال `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يشير `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تُصادَق عمليات الاستدعاء العكسي الأصلية لـ slash بواسطة الرموز المميزة الخاصة بكل أمر التي يعيدها Mattermost أثناء تسجيل slash command. وإذا فشل التسجيل أو لم تُفعَّل أي أوامر، يرفض OpenClaw عمليات الاستدعاء العكسي بالرسالة `Unauthorized: invalid command token.`
- بالنسبة إلى مستضيفي الاستدعاء العكسي الخاصين/داخليي tailnet/الداخليين، قد يتطلب Mattermost أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مستضيف/نطاق الاستدعاء العكسي. استخدم قيم المستضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح أو الرفض لعمليات كتابة الإعدادات التي يبدؤها Mattermost.
- `channels.mattermost.requireMention`: طلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز اشتراط الإشارة لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيأ.

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

**أوضاع إشعارات التفاعلات:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو الرفض لعمليات كتابة الإعدادات التي يبدؤها Signal.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيأ.

### BlueBubbles

يُعد BlueBubbles المسار الموصى به لـ iMessage (مدعومًا بواسطة Plugin، ويُضبط تحت `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // راجع /channels/bluebubbles
    },
  },
}
```

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.bluebubbles` و`channels.bluebubbles.dmPolicy`.
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيأ.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم مقبض BlueBubbles أو سلسلة الهدف (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).
- إعداد قناة BlueBubbles الكامل موثق في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` ‏(JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيأ.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- يُفضل استخدام أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد الدردشات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP التحقق الصارم من مفتاح المستضيف، لذا تأكد من أن مفتاح مستضيف الترحيل موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو الرفض لعمليات كتابة الإعدادات التي يبدؤها iMessage.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم مقبضًا مُطبَّعًا أو هدف دردشة صريحًا (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [ACP Agents](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

تأتي Matrix مدعومة بواسطة extension وتُضبط تحت `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. ويمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. ويُعد كل من `proxy` وخيار الشبكة هذا عنصرَي تحكم مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذا تُتجاهل الغرف المدعوّة ودعوات الرسائل المباشرة الجديدة حتى تعيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: القيم `true` أو `false` أو `"auto"` (الافتراضي). في وضع auto، تُفعَّل موافقات exec عندما يمكن حلّ الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix ‏(مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي) أو `"channel"` (الغرفة الأصلية) أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل المباشرة في Matrix ضمن الجلسات: يشارك `per-user` (الافتراضي) حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة رسائل مباشرة على حدة.
- تستخدم مجسات الحالة في Matrix وعمليات بحث الدليل الحية سياسة الوكيل نفسها المستخدمة في حركة التشغيل.
- إعداد Matrix الكامل وقواعد الاستهداف وأمثلة الإعداد موثقة في [Matrix](/ar/channels/matrix).

### Microsoft Teams

تأتي Microsoft Teams مدعومة بواسطة extension وتُضبط تحت `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // راجع /channels/msteams
    },
  },
}
```

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.msteams` و`channels.msteams.configWrites`.
- إعداد Teams الكامل (بيانات الاعتماد وWebhook وسياسة الرسائل المباشرة/المجموعات والتجاوزات لكل فريق/قناة) موثق في [Microsoft Teams](/ar/channels/msteams).

### IRC

تأتي IRC مدعومة بواسطة extension وتُضبط تحت `channels.irc`.

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
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُهيأ.
- إعداد قناة IRC الكامل (المستضيف/المنفذ/TLS/القنوات/قوائم السماح/اشتراط الإشارة) موثق في [IRC](/ar/channels/irc).

### تعدد الحسابات (كل القنوات)

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

- يُستخدم `default` عند حذف `accountId` (في CLI والتوجيه).
- لا تنطبق الرموز المميزة من البيئة إلا على الحساب **default**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم تُتجاوز لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة) بينما لا تزال تستخدم إعداد قناة أحادي الحساب على المستوى الأعلى، فسيقوم OpenClaw أولًا بترقية قيم الحساب الأحادي على المستوى الأعلى والمحددة بنطاق الحساب إلى خريطة حسابات القناة لكي يستمر الحساب الأصلي في العمل. تنقلها معظم القنوات إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمّى/افتراضي مطابق موجود.
- تظل ارتباطات القناة فقط الحالية (من دون `accountId`) تطابق الحساب الافتراضي؛ وتبقى الارتباطات المحددة بنطاق الحساب اختيارية.
- يقوم `openclaw doctor --fix` أيضًا بإصلاح الأشكال المختلطة عبر نقل قيم الحساب الأحادي على المستوى الأعلى والمحددة بنطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمّى/افتراضي مطابق موجود.

### قنوات extension الأخرى

تُضبط العديد من قنوات extension على شكل `channels.<id>` وتُوثق في صفحات القنوات المخصصة لها (على سبيل المثال Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### اشتراط الإشارة في الدردشة الجماعية

تستخدم الرسائل الجماعية افتراضيًا **require mention** (إشارة في بيانات التعريف أو أنماط regex آمنة). ينطبق ذلك على دردشات المجموعات في WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الإشارة:**

- **الإشارات في بيانات التعريف**: إشارات @-mention الأصلية للمنصة. تُتجاهل في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. تُتجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يُفرض اشتراط الإشارة إلا عندما يكون الاكتشاف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات تجاوزها باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). عيّن القيمة `0` للتعطيل.

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

آلية الحل: تجاوز لكل رسالة مباشرة → افتراضي المزوّد → بلا حد (يُحتفَظ بكل شيء).

المدعوم: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

أدرج رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ويرد فقط على أنماط النص):

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
    native: "auto", // سجّل الأوامر الأصلية عندما تكون مدعومة
    nativeSkills: "auto", // سجّل أوامر Skills الأصلية عندما تكون مدعومة
    text: true, // حلّل /commands في رسائل الدردشة
    bash: false, // السماح بـ ! (الاسم البديل: /bash)
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

- تهيّئ هذه الكتلة أسطح الأوامر. لفهرس الأوامر الحالي المضمن + المجمّع، راجع [Slash Commands](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست فهرس الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل QQ Bot ‏`/bot-ping` و`/bot-help` و`/bot-logs`، وLINE ‏`/card`، وdevice-pair ‏`/pair`، وmemory ‏`/dreaming`، وphone-control ‏`/phone`، وTalk ‏`/voice` موثقة في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [Slash Commands](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يؤدي `native: "auto"` إلى تشغيل الأوامر الأصلية لـ Discord/Telegram، ويترك Slack معطّلًا.
- يؤدي `nativeSkills: "auto"` إلى تشغيل أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack معطّلًا.
- تجاوز لكل قناة: `channels.discord.commands.native` ‏(قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى مسح الأوامر المسجلة سابقًا.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لصدفة المستضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (لقراءة/كتابة `openclaw.json`). وبالنسبة إلى عملاء `chat.send` في Gateway، تتطلب عمليات الكتابة الدائمة عبر `/config set|unset` أيضًا `operator.admin`؛ بينما يبقى `/config show` للقراءة فقط متاحًا لعملاء operator العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP الذي يديره OpenClaw تحت `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها وعناصر التحكم في التفعيل/التعطيل.
- يتحكم `channels.<provider>.configWrites` في تعديلات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يؤدي `restart: false` إلى تعطيل `/restart` وإجراءات أداة إعادة تشغيل gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك الخاصة بالأوامر/الأدوات المخصصة للمالك فقط. وهي منفصلة عن `allowFrom`.
- يؤدي `ownerDisplay: "hash"` إلى تجزئة معرّفات المالك في system prompt. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` يكون لكل مزوّد. وعند تعيينه، يصبح **مصدر التفويض الوحيد** (ويتم تجاهل قوائم السماح/الاقتران الخاصة بالقناة و`useAccessGroups`).
- يتيح `useAccessGroups: false` للأوامر تجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` معيّنًا.
- خريطة وثائق الأوامر:
  - الفهرس المضمن + المجمّع: [Slash Commands](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بكل قناة: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [Pairing](/ar/channels/pairing)
  - أمر البطاقة في LINE: [LINE](/ar/channels/line)
  - Dreaming للذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## الإعدادات الافتراضية للوكلاء

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر المستودع الاختياري المعروض في سطر Runtime داخل system prompt. وإذا لم يُعيَّن، يكتشفه OpenClaw تلقائيًا عبر الصعود من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة السماح الافتراضية الاختيارية لـ Skills للوكلاء الذين لا يعيّنون
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
- عيّن `agents.list[].skills: []` لعدم استخدام أي Skills.
- تمثل قائمة `agents.list[].skills` غير الفارغة المجموعة النهائية لذلك الوكيل؛
  وهي لا تندمج مع القيم الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap الخاصة بمساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت حقن ملفات bootstrap الخاصة بمساحة العمل داخل system prompt. الافتراضي: `"always"`.

- `"continuation-skip"`: تتجاوز أدوار المتابعة الآمنة (بعد اكتمال استجابة المساعد) إعادة حقن bootstrap الخاص بمساحة العمل، مما يقلل حجم prompt. وتستمر تشغيلات Heartbeat وإعادات المحاولة بعد Compaction في إعادة بناء السياق.

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

يتحكم في نص التحذير المرئي للوكيل عند اقتطاع سياق bootstrap.
الافتراضي: `"once"`.

- `"off"`: لا تحقن نص التحذير مطلقًا في system prompt.
- `"once"`: احقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: احقن التحذير في كل تشغيل عندما يوجد اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يحتوي OpenClaw على عدة ميزانيات كبيرة الحجم لـ prompt/السياق، وهي
مقسمة عمدًا حسب النظام الفرعي بدلًا من مرورها كلها عبر
مفتاح ضبط عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن bootstrap العادي لمساحة العمل.
- `agents.defaults.startupContext.*`:
  تمهيد بدء التشغيل لمرة واحدة لأوامر `/new` و`/reset`،
  بما في ذلك ملفات `memory/*.md` اليومية الحديثة.
- `skills.limits.*`:
  قائمة Skills المدمجة المحقونة في system prompt.
- `agents.defaults.contextLimits.*`:
  مقتطفات التشغيل المحدودة والكتل المملوكة لوقت التشغيل والمحقونة.
- `memory.qmd.limits.*`:
  مقتطفات البحث في الذاكرة المفهرسة وتحجيم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى
ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل لأول دور، والذي يُحقن في تشغيلات `/new` و`/reset`
العادية.

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

إعدادات افتراضية مشتركة لأسطح سياق التشغيل المحدودة.

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
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ `memory_get` عند حذف `lines`.
- `toolResultMaxChars`: الحد الأقصى لنتائج الأدوات أثناء التشغيل والمستخدم للنتائج
  المحفوظة ومعالجة الفائض.
- `postCompactionMaxChars`: الحد الأقصى لمقتطفات AGENTS.md المستخدمة أثناء
  حقن التحديث بعد Compaction.

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

الحد الأقصى العام لقائمة Skills المدمجة المحقونة في system prompt. هذا
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

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة ضمن كتل صور السجل/الأدوات قبل استدعاءات المزوّد.
الافتراضي: `1200`.

تقلل القيم المنخفضة عادةً من استخدام رموز الرؤية وحجم حمولة الطلب في التشغيلات التي تحتوي على الكثير من لقطات الشاشة.
وتحافظ القيم الأعلى على قدر أكبر من التفاصيل المرئية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق system prompt (وليس الطوابع الزمنية للرسائل). وتعود إلى المنطقة الزمنية الخاصة بالمستضيف عند عدم التعيين.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في system prompt. الافتراضي: `auto` (تفضيل نظام التشغيل).

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
      params: { cacheRetention: "long" }, // معاملات المزوّد الافتراضية العامة
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

- `model`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يضبط نموذج السلسلة النموذج الأساسي فقط.
  - يضبط نموذج الكائن النموذج الأساسي بالإضافة إلى نماذج التحويل الاحتياطي المرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم في مسار أداة `image` كإعداد لنموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول مدخلات الصور.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم في إمكانية توليد الصور المشتركة وأي سطح أداة/Plugin مستقبلي يولد صورًا.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لتوليد صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-1` لـ OpenAI Images.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة المزوّد/مفتاح API المطابق (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`).
  - إذا لم يُعيَّن، يمكن لـ `image_generate` مع ذلك استنتاج افتراضي مزوّد مدعوم بالمصادقة. إذ يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الصور المسجلين حسب ترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم في إمكانية توليد الموسيقى المشتركة وفي الأداة المضمنة `music_generate`.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا لم يُعيَّن، يمكن لـ `music_generate` مع ذلك استنتاج افتراضي مزوّد مدعوم بالمصادقة. إذ يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الموسيقى المسجلين حسب ترتيب معرّف المزوّد.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة المزوّد/مفتاح API المطابق.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم في إمكانية توليد الفيديو المشتركة وفي الأداة المضمنة `video_generate`.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا لم يُعيَّن، يمكن لـ `video_generate` مع ذلك استنتاج افتراضي مزوّد مدعوم بالمصادقة. إذ يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الفيديو المسجلين حسب ترتيب معرّف المزوّد.
  - إذا اخترت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا مصادقة المزوّد/مفتاح API المطابق.
  - يدعم مزود توليد الفيديو المضمّن Qwen ما يصل إلى فيديو مخرج واحد، وصورة إدخال واحدة، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد مثل `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا لم يُعيَّن، تعود أداة PDF إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يُمرَّر `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي ينظر فيها وضع الاستخراج الاحتياطي في أداة `pdf`.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى المخرجات المرتفعة الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.4`). إذا حذفت المزوّد، يحاول OpenClaw أولًا اسمًا مستعارًا، ثم تطابقًا فريدًا لمزوّد مهيأ لذلك المعرّف الدقيق للنموذج، وبعدها فقط يعود إلى المزوّد الافتراضي المهيأ (سلوك توافق قديم ومهجور، لذا يُفضّل استخدام `provider/model` الصريح). وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مهيأ بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: فهرس النماذج المهيأ وقائمة السماح الخاصة بـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصارًا) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
- `params`: معاملات المزوّد الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أولوية دمج `params` (في الإعدادات): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (لمعرّف الوكيل المطابق) بالمفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة وقت التشغيل المضمن منخفضة المستوى الافتراضية للوكيل. استخدم `runtime: "auto"` للسماح لـ harnesses الخاصة بـ Plugin المسجلة بادعاء النماذج المدعومة، أو `runtime: "pi"` لفرض harness المضمن PI، أو معرّف harness مسجل مثل `runtime: "codex"`. عيّن `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI.
- تقوم كاتبات الإعدادات التي تعدّل هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياطي) بحفظ صيغة الكائن القانونية مع الحفاظ على قوائم fallback الموجودة متى أمكن.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكلاء المتوازية عبر الجلسات (مع بقاء كل جلسة متسلسلة داخليًا). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في المنفّذ منخفض المستوى الذي يشغّل أدوار الوكيل المضمنة.
ينبغي لمعظم عمليات النشر الإبقاء على الإعداد الافتراضي `{ runtime: "auto", fallback: "pi" }`.
استخدمه عندما يوفّر Plugin موثوق harness أصليًا، مثل
harness خادم التطبيق Codex المضمّن.

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

- `runtime`: القيم `"auto"` أو `"pi"` أو معرّف harness مسجل لأحد Plugin. يسجل Plugin Codex المضمّن المعرف `codex`.
- `fallback`: القيم `"pi"` أو `"none"`. تبقي `"pi"` harness PI المضمن كاحتياطي توافق. وتؤدي `"none"` إلى فشل اختيار harness الخاص بـ Plugin عندما يكون مفقودًا أو غير مدعوم بدلًا من استخدام PI بصمت.
- تجاوزات البيئة: يتجاوز `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` القيمة `runtime`؛ ويعطّل `OPENCLAW_AGENT_HARNESS_FALLBACK=none` الرجوع إلى PI لتلك العملية.
- لعمليات النشر الخاصة بـ Codex فقط، اضبط `model: "codex/gpt-5.4"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتحكم هذا فقط في harness الدردشة المضمن. أما توليد الوسائط والرؤية وPDF والموسيقى والفيديو وTTS فما زالت تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**الاختصارات المستعارة المضمنة** (تنطبق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

| الاسم المستعار | النموذج |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

تفوز الأسماء المستعارة التي تضبطها أنت دائمًا على القيم الافتراضية.

تفعّل نماذج Z.AI GLM-4.x وضع التفكير تلقائيًا ما لم تعيّن `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
وتفعّل نماذج Z.AI القيمة `tool_stream` افتراضيًا لبث استدعاءات الأدوات. عيّن `agents.defaults.models["zai/<model>"].params.tool_stream` إلى `false` لتعطيلها.
وتستخدم نماذج Anthropic Claude 4.6 افتراضيًا التفكير `adaptive` عندما لا يكون هناك مستوى تفكير صريح محدد.

### `agents.defaults.cliBackends`

واجهات CLI خلفية اختيارية لتشغيلات الاحتياط النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كنسخة احتياطية عند تعطل مزوّدي API.

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

- الواجهات الخلفية CLI موجهة للنص أولًا؛ وتكون الأدوات معطلة دائمًا.
- تُدعَم الجلسات عندما يكون `sessionArg` معيّنًا.
- يُدعَم تمرير الصور عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل system prompt الكامل الذي يجمعه OpenClaw بسلسلة ثابتة. يُضبط على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). وتأخذ القيم لكل وكيل الأولوية؛ وتُتجاهل القيم الفارغة أو التي تحتوي على مسافات بيضاء فقط. وهذا مفيد لتجارب prompt المنضبطة.

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
        lightContext: false, // الافتراضي: false؛ true يُبقي فقط HEARTBEAT.md من ملفات bootstrap الخاصة بمساحة العمل
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

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (مصادقة مفتاح API) أو `1h` (مصادقة OAuth). عيّنها إلى `0m` للتعطيل.
- `includeSystemPromptSection`: عند تعيينها إلى false، تُحذف فقرة Heartbeat من system prompt ويُتخطى حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند تعيينه إلى true، ي suppress حمولة تحذيرات أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لدور وكيل Heartbeat قبل إيقافه. اتركه غير معيّن لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/للرسائل المباشرة. تسمح `allow` (الافتراضي) بالتسليم المباشر إلى الهدف. وتؤدي `block` إلى منع التسليم المباشر إلى الهدف وإخراج `reason=dm-blocked`.
- `lightContext`: عند تعيينه إلى true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيفًا وتُبقي فقط `HEARTBEAT.md` من ملفات bootstrap الخاصة بمساحة العمل.
- `isolatedSession`: عند تعيينه إلى true، تعمل كل Heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. وهو نفس نمط العزل في Cron مع `sessionTarget: "isolated"`. ويقلل تكلفة الرموز لكل Heartbeat من نحو ~100K إلى ~2-5K رمز.
- لكل وكيل: اضبط `agents.list[].heartbeat`. وعندما يعرّف أي وكيل `heartbeat`، تعمل **هؤلاء الوكلاء فقط** على تشغيل Heartbeat.
- تشغّل Heartbeat أدوار وكلاء كاملة — والفواصل الأقصر تستهلك مزيدًا من الرموز.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // معرّف Plugin مزوّد Compaction مسجل (اختياري)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // يُستخدم عندما يكون identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // تؤدي [] إلى تعطيل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري للنموذج خاص بـ Compaction فقط
        notifyUser: true, // أرسل إشعارًا موجزًا عند بدء Compaction (الافتراضي: false)
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

- `mode`: ‏`default` أو `safeguard` (تلخيص مجزأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزوّد Compaction مسجل. عند تعيينه، يُستدعى `summarize()` الخاص بالمزوّد بدلًا من التلخيص المضمن في LLM. ويعود إلى المضمن عند الفشل. ويؤدي تعيين مزوّد إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يقوم OpenClaw بإيقافها. الافتراضي: `900`.
- `identifierPolicy`: ‏`strict` (الافتراضي) أو `off` أو `custom`. تضيف `strict` تلقائيًا إرشادات مضمنة للحفاظ على المعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما يكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من AGENTS.md لإعادة حقنها بعد Compaction. القيمة الافتراضية `["Session Startup", "Red Lines"]`؛ عيّن `[]` لتعطيل إعادة الحقن. وعندما لا تكون معيّنة أو تكون معيّنة صراحةً إلى هذا الزوج الافتراضي، تُقبل أيضًا العناوين الأقدم `Every Session`/`Safety` كقيمة احتياطية قديمة.
- `model`: تجاوز اختياري `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما يجب أن تبقي الجلسة الرئيسية نموذجًا معينًا بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم تعيينه، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عند تعيينه إلى `true`، يرسل إشعارًا موجزًا إلى المستخدم عند بدء Compaction (على سبيل المثال: "Compacting context..."). وهو معطّل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيلي صامت قبل Compaction التلقائي لتخزين الذكريات الدائمة. ويُتخطى عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقص **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرسالها إلى LLM. ولا **يعدّل** سجل الجلسة على القرص.

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

- يفعّل `mode: "cache-ttl"` عمليات القص.
- يتحكم `ttl` في عدد المرات التي يمكن فيها تشغيل القص مرة أخرى (بعد آخر لمسة cache).
- تقوم عملية القص أولًا باقتطاع نتائج الأدوات المتضخمة بشكل جزئي، ثم تمسح نتائج الأدوات الأقدم بالكامل إذا لزم الأمر.

**الاقتطاع الجزئي** يحتفظ بالبداية + النهاية ويُدرج `...` في المنتصف.

**المسح الكامل** يستبدل نتيجة الأداة بالكامل بالنص النائب.

ملاحظات:

- لا تُقتطع/تُمسح كتل الصور مطلقًا.
- تستند النِّسب إلى عدد الأحرف (تقريبيًا)، وليس إلى أعداد الرموز الدقيقة.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، تُتخطى عملية القص.

</Accordion>

راجع [Session Pruning](/ar/concepts/session-pruning) لتفاصيل السلوك.

### البث على شكل كتل

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

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحةً لتفعيل الردود على شكل كتل.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات كل حساب). تستخدم Signal/Slack/Discord/Google Chat افتراضيًا `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين الردود على شكل كتل. تعني `natural` = ‏800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) لمعرفة تفاصيل السلوك والتقسيم.

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

إعداد اختياري لـ sandbox للوكيل المضمن. راجع [Sandboxing](/ar/gateway/sandboxing) للحصول على الدليل الكامل.

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

<Accordion title="تفاصيل sandbox">

**الواجهة الخلفية:**

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل بعيد عام مدعوم بواسطة SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد SSH backend:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH ‏(الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة مسبقًا تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة أثناء التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح سياسة مفاتيح المستضيف في OpenSSH

**أولوية مصادقة SSH:**

- `identityData` يتغلب على `identityFile`
- `certificateData` يتغلب على `certificateFile`
- `knownHostsData` يتغلب على `knownHostsFile`
- تُحل قيم `*Data` المدعومة بواسطة SecretRef من اللقطة النشطة لوقت تشغيل الأسرار قبل بدء جلسة sandbox

**سلوك SSH backend:**

- يزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة عمل SSH البعيدة هي القانونية
- ويوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- ولا يزامن التغييرات البعيدة إلى المستضيف تلقائيًا
- ولا يدعم حاويات متصفح sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل sandbox لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل sandbox عند `/workspace`، مع تركيب مساحة عمل الوكيل للقراءة فقط عند `/agent`
- `rw`: تركيب مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**إعداد Plugin OpenShell:**

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

- `mirror`: زرع البعيد من المحلي قبل التنفيذ، ثم المزامنة عكسيًا بعد التنفيذ؛ وتبقى مساحة العمل المحلية هي القانونية
- `remote`: زرع البعيد مرة واحدة عند إنشاء sandbox، ثم إبقاء مساحة العمل البعيدة هي القانونية

في وضع `remote`، لا تُزامَن تعديلات المستضيف المحلية التي تُجرى خارج OpenClaw إلى sandbox تلقائيًا بعد خطوة الزرع.
تكون وسيلة النقل عبر SSH إلى sandbox الخاص بـ OpenShell، لكن Plugin يملك دورة حياة sandbox والمزامنة العكسية الاختيارية.

**`setupCommand`** يعمل مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى خروج شبكي، وجذر قابل للكتابة، ومستخدم root.

**تستخدم الحاويات افتراضيًا `network: "none"`** — عيّنها إلى `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
تكون `"host"` محظورة. وتكون `"container:<id>"` محظورة افتراضيًا ما لم تعيّن صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (وضع طارئ).

**تُجهَّز المرفقات الواردة** ضمن `media/inbound/*` في مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة إضافية من المستضيف؛ ويتم دمج الروابط العامة وتلك الخاصة بكل وكيل.

**المتصفح داخل sandbox** (`sandbox.browser.enabled`): ‏Chromium + CDP داخل حاوية. يتم حقن عنوان noVNC URL في system prompt. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC مصادقة VNC افتراضيًا، ويصدر OpenClaw عنوان URL برمز مميز قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- يؤدي `allowHostControl: false` (الافتراضي) إلى حظر استهداف جلسات sandbox للمستعرض الموجود على المستضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقيّد `cdpSourceRange` اختياريًا حركة CDP الواردة عند حافة الحاوية إلى نطاق CIDR ‏(على سبيل المثال `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بتركيب أدلة إضافية من المستضيف داخل حاوية متصفح sandbox فقط. وعند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح.
- تُعرَّف افتراضيات التشغيل في `scripts/sandbox-browser-entrypoint.sh` وتُضبط لمستضيفي الحاويات:
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
  - `--disable-extensions` (مفعّل افتراضيًا)
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعّلة افتراضيًا، ويمكن تعطيلها عبر
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/‏3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تفعيل الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` عبر
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطه إلى `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عندما يكون `noSandbox` مفعّلًا.
  - تمثل القيم الافتراضية خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير افتراضيات الحاوية.

</Accordion>

يقتصر عزل المتصفح و`sandbox.docker.binds` على Docker فقط.

أنشئ الصور:

```bash
scripts/sandbox-setup.sh           # صورة sandbox الرئيسية
scripts/sandbox-browser-setup.sh   # صورة المتصفح الاختيارية
```

### `agents.list` (تجاوزات لكل وكيل)

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
        thinkingDefault: "high", // تجاوز مستوى التفكير الافتراضي لكل وكيل
        reasoningDefault: "on", // تجاوز إظهار الاستدلال الافتراضي لكل وكيل
        fastModeDefault: false, // تجاوز الوضع السريع الافتراضي لكل وكيل
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // يتجاوز قيم defaults.models.params المطابقة حسب المفتاح
        skills: ["docs-search"], // يستبدل agents.defaults.skills عند التعيين
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
- `default`: عند تعيين عدة قيم، يفوز الأول (مع تسجيل تحذير). وإذا لم تُعيَّن أي قيمة، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: يتجاوز نموذج السلسلة القيمة `primary` فقط؛ أما نموذج الكائن `{ primary, fallbacks }` فيتجاوز كليهما (`[]` يعطّل القيم الاحتياطية العامة). وتظل مهام Cron التي تتجاوز `primary` فقط ترث القيم الاحتياطية الافتراضية ما لم تعيّن `fallbacks: []`.
- `params`: معاملات البث لكل وكيل، وتُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار فهرس النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ وتستبدل القائمة الصريحة القيم الافتراضية بدلًا من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة.
- `reasoningDefault`: إظهار الاستدلال الافتراضي الاختياري لكل وكيل (`on | off | stream`). ويُطبَّق عندما لا يكون هناك تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: القيمة الافتراضية الاختيارية لكل وكيل للوضع السريع (`true | false`). وتُطبَّق عندما لا يكون هناك تجاوز للوضع السريع لكل رسالة أو جلسة.
- `embeddedHarness`: تجاوز اختياري لسياسة harness منخفضة المستوى لكل وكيل. استخدم `{ runtime: "codex", fallback: "none" }` لجعل أحد الوكلاء يعمل بـ Codex فقط بينما يحتفظ الآخرون بالقيمة الاحتياطية الافتراضية PI.
- `runtime`: واصف وقت تشغيل اختياري لكل وكيل. استخدم `type: "acp"` مع القيم الافتراضية `runtime.acp` ‏(`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يستخدم الوكيل افتراضيًا جلسات ACP harness.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL من نوع `http(s)`، أو معرّف URI من نوع `data:`.
- تستمد `identity` القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لـ `sessions_spawn` ‏(`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حماية وراثة sandbox: إذا كانت جلسة الطالب داخل sandbox، فإن `sessions_spawn` يرفض الأهداف التي ستعمل خارج sandbox.
- `subagents.requireAgentId`: عند تعيينه إلى true، يحظر استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## توجيه الوكلاء المتعددين

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

### حقول المطابقة في Binding

- `type` (اختياري): `route` للتوجيه العادي (وعند غياب النوع تكون القيمة الافتراضية route)، و`acp` لارتباطات المحادثات الدائمة الخاصة بـ ACP.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ والحذف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لإدخالات `type: "acp"`): ‏`{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة تامة، بلا peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

داخل كل مستوى، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw بالاعتماد على هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب مستويات route binding المذكور أعلاه.

### ملفات الوصول لكل وكيل

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

راجع [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأولوية.

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
    parentForkMaxTokens: 100000, // تخطَّ fork السلسلة الأم فوق هذا العدد من الرموز (0 للتعطيل)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // مدة أو false
      maxDiskBytes: "500mb", // ميزانية قصوى صلبة اختيارية
      highWaterBytes: "400mb", // هدف تنظيف اختياري
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // القيمة الافتراضية لإلغاء التركيز التلقائي بعد عدم النشاط، بالساعات (`0` للتعطيل)
      maxAgeHours: 0, // القيمة الافتراضية للحد الأقصى الصارم للعمر، بالساعات (`0` للتعطيل)
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
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة ضمن سياق القناة.
  - `global`: يشارك جميع المشاركين في سياق القناة جلسة واحدة (استخدمه فقط عندما يكون المقصود سياقًا مشتركًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك جميع الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: يربط المعرّفات القانونية بالنظراء ذوي بادئة المزوّد لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. يعيد `daily` التعيين عند `atHour` بالتوقيت المحلي؛ ويعيد `idle` التعيين بعد `idleMinutes`. وعند ضبط كليهما، يفوز الذي تنتهي مدته أولًا.
- **`resetByType`**: تجاوزات حسب النوع (`direct` و`group` و`thread`). وتُقبل `dm` القديمة كاسم بديل لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لـ `totalTokens` المسموح به في الجلسة الأم عند إنشاء جلسة سلسلة متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` في الجلسة الأم أعلى من هذا الحد، يبدأ OpenClaw جلسة سلسلة جديدة بدلًا من وراثة سجل الجلسة الأم.
  - عيّن القيمة `0` لتعطيل هذه الحماية والسماح دائمًا بالتفرع من الجلسة الأم.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` كحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لعدد أدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). تؤدي `0` إلى تعطيل تسلسل ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel`، و`chatType` ‏(`direct|group|channel`، مع الاسم البديل القديم `dm`)، أو `keyPrefix`، أو `rawKeyPrefix`. يفوز أول رفض.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات والاحتفاظ بها.
  - `mode`: يؤدي `warn` إلى إصدار تحذيرات فقط؛ ويطبق `enforce` التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. وتكون افتراضيًا مساوية لـ `pruneAfter`؛ اضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` تسجَّل تحذيرات؛ وفي وضع `enforce` تُزال أقدم الملفات/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. ويكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: القيم الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للمزوّدين تجاوزه؛ يستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: القيمة الافتراضية لإلغاء التركيز التلقائي بعد عدم النشاط، بالساعات (`0` للتعطيل؛ ويمكن للمزوّدين تجاوزها)
  - `maxAgeHours`: القيمة الافتراضية للحد الأقصى الصارم للعمر، بالساعات (`0` للتعطيل؛ ويمكن للمزوّدين تجاوزها)

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

آلية الحل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. تؤدي `""` إلى التعطيل وإيقاف التسلسل. وتشتق `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير | الوصف | مثال |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | الاسم المختصر للنموذج | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد | `anthropic`                 |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high`، `low`، `off`        |
| `{identity.name}` | اسم هوية الوكيل | (مثل `"auto"`)          |

المتغيرات غير حساسة لحالة الأحرف. وتُعد `{think}` اسمًا بديلًا لـ `{thinkingLevel}`.

### تفاعل التأكيد

- تكون القيمة الافتراضية هي `identity.emoji` الخاصة بالوكيل النشط، وإلا `"👀"`. عيّن `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → الاحتياط المستند إلى الهوية.
- النطاق: `group-mentions` (الافتراضي) و`group-all` و`direct` و`all`.
- يؤدي `removeAckAfterReply` إلى إزالة التأكيد بعد الرد في Slack وDiscord وTelegram.
- يفعّل `messages.statusReactions.enabled` تفاعلات الحالة خلال دورة الحياة في Slack وDiscord وTelegram.
  وفي Slack وDiscord، يؤدي عدم التعيين إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات التأكيد نشطة.
  وفي Telegram، عيّنه صراحةً إلى `true` لتفعيل تفاعلات الحالة خلال دورة الحياة.

### إزالة الارتداد للرسائل الواردة

تجمع الرسائل النصية السريعة من المرسل نفسه في دور وكيل واحد. وتؤدي الوسائط/المرفقات إلى التفريغ فورًا. وتتجاوز أوامر التحكم إزالة الارتداد.

### TTS (تحويل النص إلى كلام)

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن أن يتجاوز `/tts on|off` التفضيلات المحلية، بينما يعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` القيمة `agents.defaults.model.primary` للتلخيص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (تفعيل اختياري).
- تعود مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- يتجاوز `openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو: الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما يشير `openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يتعامل OpenClaw معها على أنها خادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## Talk

الإعدادات الافتراضية لوضع Talk ‏(macOS/iOS/Android).

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

- يجب أن يطابق `talk.provider` مفتاحًا في `talk.providers` عند إعداد عدة مزوّدين لـ Talk.
- مفاتيح Talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) مخصصة للتوافق فقط، وتُرحَّل تلقائيًا إلى `talk.providers.<provider>`.
- تعود معرّفات الأصوات إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- يقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- لا يُطبَّق الاحتياطي `ELEVENLABS_API_KEY` إلا عندما لا يكون مفتاح API الخاص بـ Talk مُعدًّا.
- يتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء سهلة.
- يتحكم `silenceTimeoutMs` في مدة انتظار وضع Talk بعد صمت المستخدم قبل إرسال النص المفرغ. وعند عدم تعيينه، تُستخدم نافذة التوقف الافتراضية الخاصة بالمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).

---

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

تضبط عملية الإعداد المحلية الافتراضية للإعدادات المحلية الجديدة `tools.profile: "coding"` عندما لا يكون معينًا (وتُحفَظ ملفات التعريف الصريحة الحالية).

| ملف التعريف | يتضمن |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط                                                                                                           |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status`                                       |
| `full`      | بلا قيود (مثل عدم التعيين)                                                                                                  |

### مجموعات الأدوات

| المجموعة | الأدوات |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec` و`process` و`code_execution` (`bash` مقبول كاسم بديل لـ `exec`)                                         |
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
| `group:openclaw`   | جميع الأدوات المضمنة (باستثناء Plugin الخاصة بالمزوّد)                                                                          |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (المنع يفوز). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. وتُطبَّق حتى عندما يكون Docker sandbox معطّلًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقييد إضافي للأدوات لمزوّدين أو نماذج محددة. الترتيب: ملف التعريف الأساسي → ملف تعريف المزوّد → السماح/المنع.

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

- لا يمكن لتجاوز كل وكيل (`agents.list[].tools.elevated`) إلا أن يضيف مزيدًا من التقييد.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتُطبَّق التوجيهات المضمنة على رسالة واحدة فقط.
- يتجاوز `exec` المرتفع العزل في sandbox ويستخدم مسار الهروب المهيأ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

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

تكون فحوصات أمان حلقات الأدوات **معطلة افتراضيًا**. عيّن `enabled: true` لتفعيل الاكتشاف.
يمكن تعريف الإعدادات عالميًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

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
- `criticalThreshold`: حد تكرار أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: حد إيقاف صارم لأي تشغيل بلا تقدم.
- `detectors.genericRepeat`: يحذر من الاستدعاءات المتكررة للأداة نفسها/المعاملات نفسها.
- `detectors.knownPollNoProgress`: يحذر/يحظر أدوات الاستطلاع المعروفة (`process.poll` و`command_status` وما إلى ذلك).
- `detectors.pingPong`: يحذر/يحظر أنماط الأزواج المتناوبة بلا تقدم.
- إذا كان `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // أو BRAVE_API_KEY في البيئة
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

يضبط فهم الوسائط الواردة (صورة/صوت/فيديو):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // تفعيل اختياري: أرسل الموسيقى/الفيديو غير المتزامنين المكتملين مباشرة إلى القناة
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

**إدخال المزوّد** (`type: "provider"` أو عند الحذف):

- `provider`: معرّف مزوّد API ‏(`openai` أو `anthropic` أو `google`/`gemini` أو `groq` وما إلى ذلك)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار ملف تعريف من `auth-profiles.json`

**إدخال CLI** (`type: "cli"`):

- `command`: الملف التنفيذي المطلوب تشغيله
- `args`: معاملات ذات قوالب (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وما إلى ذلك)

**حقول مشتركة:**

- `capabilities`: قائمة اختيارية (`image` أو `audio` أو `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، و`google` ← صورة+صوت+فيديو، و`groq` ← صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تؤدي الإخفاقات إلى الرجوع إلى الإدخال التالي.

تتبع مصادقة المزوّد الترتيب القياسي: `auth-profiles.json` → متغيرات البيئة → `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عند تعيينه إلى `true`، تحاول مهام
  `music_generate` و`video_generate` غير المتزامنة المكتملة التسليم المباشر إلى القناة أولًا. الافتراضي: `false`
  (مسار wake/model-delivery القديم المعتمد على جلسة الطالب).

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

يتحكم في الجلسات التي يمكن استهدافها بواسطة أدوات الجلسة (`sessions_list` و`sessions_history` و`sessions_send`).

الافتراضي: `tree` (الجلسة الحالية + الجلسات التي أنشأتها، مثل الوكلاء الفرعيين).

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
- `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (وقد يشمل ذلك مستخدمين آخرين إذا كنت تستخدم جلسات per-sender تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. وما يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- تقييد sandbox: عندما تكون الجلسة الحالية داخل sandbox ويكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض القيمة `tree` على مستوى الرؤية حتى لو كان `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // تفعيل اختياري: عيّنه إلى true للسماح بمرفقات ملفات مضمنة
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

- لا تُدعَم المرفقات إلا مع `runtime: "subagent"`. ويرفض وقت تشغيل ACP هذه المرفقات.
- تُحوَّل الملفات إلى مساحة عمل الابن في `.openclaw/attachments/<uuid>/` مع `.manifest.json`.
- يُحجَب محتوى المرفقات تلقائيًا من حفظ السجل.
- تُتحقق مدخلات Base64 باستخدام فحوص صارمة للأبجدية/الحشو وحارس حجم قبل فك الترميز.
- تكون صلاحيات الملفات `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: يزيل `delete` المرفقات دائمًا؛ بينما يحتفظ `keep` بها فقط عندما يكون `retainOnSessionKeep: true`.

### `tools.experimental`

أعلام الأدوات المضمنة التجريبية. تكون معطلة افتراضيًا ما لم تنطبق قاعدة تفعيل تلقائي صارمة لوضع GPT-5 الوكيلي.

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

- `planTool`: يفعّل الأداة المهيكلة `update_plan` لتتبع العمل غير البسيط متعدد الخطوات.
- الافتراضي: `false` ما لم تكن `agents.defaults.embeddedPi.executionContract` (أو تجاوز لكل وكيل) مضبوطة على `"strict-agentic"` في تشغيل OpenAI أو OpenAI Codex من عائلة GPT-5. عيّنه إلى `true` لفرض تشغيل الأداة خارج ذلك النطاق، أو إلى `false` لإبقائها معطلة حتى في تشغيلات GPT-5 الصارمة الوكيلية.
- عند التفعيل، تضيف system prompt أيضًا إرشادات استخدام بحيث يستخدمها النموذج فقط للأعمال الكبيرة ويحافظ على خطوة واحدة فقط كحد أقصى في حالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين الذين تم إنشاؤهم. وإذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء المستهدفة في `sessions_spawn` عندما لا يعيّن الوكيل الطالب قيمة `subagents.allowAgents` الخاصة به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## المزوّدون المخصصون وعناوين URL الأساسية

يستخدم OpenClaw فهرس النماذج المضمن. أضف مزوّدين مخصصين عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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
- تجاوز جذر إعداد الوكيل باستخدام `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم قديم بديل لمتغير البيئة).
- أولوية الدمج لمعرّفات المزوّد المطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاصة بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة الخاصة بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا بواسطة SecretRef في سياق الإعداد/ملف تعريف المصادقة الحالي.
  - تُحدَّث قيم `apiKey` الخاصة بالمزوّد المُدار بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لإحالات البيئة، و`secretref-managed` لإحالات الملف/التنفيذ) بدلًا من حفظ الأسرار المحلولة.
  - تُحدَّث قيم الرؤوس الخاصة بالمزوّد المُدار بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لإحالات البيئة، و`secretref-managed` لإحالات الملف/التنفيذ).
  - تعود القيم الفارغة أو المفقودة لـ `apiKey`/`baseUrl` الخاصة بالوكيل إلى `models.providers` في الإعدادات.
  - تستخدم القيم المطابقة `contextWindow`/`maxTokens` للنموذج القيمة الأعلى بين الإعداد الصريح وقيم الفهرس الضمنية.
  - تحافظ القيم المطابقة `contextTokens` للنموذج على حد تشغيل صريح عندما يكون موجودًا؛ استخدمه لتقييد السياق الفعلي دون تغيير بيانات التعريف الأصلية للنموذج.
  - استخدم `models.mode: "replace"` عندما تريد من الإعدادات إعادة كتابة `models.json` بالكامل.
  - يكون حفظ العلامات معتمدًا على المصدر: تُكتب العلامات من لقطة إعداد المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة أثناء التشغيل.

### تفاصيل حقول المزوّد

- `models.mode`: سلوك فهرس المزوّد (`merge` أو `replace`).
- `models.providers`: خريطة مزوّدين مخصصين مفهرسة بمعرّف المزوّد.
- `models.providers.*.api`: مهايئ الطلب (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai` وما إلى ذلك).
- `models.providers.*.apiKey`: بيانات اعتماد المزوّد (يُفضّل SecretRef/الاستبدال من البيئة).
- `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: يفرض نقل بيانات الاعتماد في رأس `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لواجهة API في المصدر.
- `models.providers.*.headers`: رؤوس ثابتة إضافية لتوجيه الوكيل/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بمزوّد النموذج.
  - `request.headers`: رؤوس إضافية (تُدمج مع القيم الافتراضية للمزوّد). وتقبل القيم SecretRef.
  - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدام المصادقة المضمنة الخاصة بالمزوّد)، و`"authorization-bearer"` (مع `token`)، و`"header"` (مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز وكيل HTTP. الأوضاع: `"env-proxy"` (استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`)، و`"explicit-proxy"` (مع `url`). ويقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` (كلها تقبل SecretRef) و`serverName` و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عند تعيينه إلى `true`، يسمح باتصالات HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو نطاقات مشابهة، عبر حارس جلب HTTP الخاص بالمزوّد (تفعيل اختياري للمشغّل لنقاط النهاية المتوافقة مع OpenAI والمستضافة ذاتيًا والموثوق بها). وتستخدم WebSocket الكائن `request` نفسه للرؤوس/TLS ولكن ليس بوابة SSRF الخاصة بالجلب. الافتراضي `false`.
- `models.providers.*.models`: إدخالات صريحة لفهرس نماذج المزوّد.
- `models.providers.*.models.*.contextWindow`: بيانات تعريف نافذة السياق الأصلية للنموذج.
- `models.providers.*.models.*.contextTokens`: حد سياق اختياري أثناء التشغيل. استخدمه عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير فارغ وغير أصلي (المستضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` أثناء التشغيل. أما `baseUrl` الفارغ/المحذوف فيبقي سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI والتي تقبل السلاسل فقط. وعندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية الخالصة إلى سلاسل عادية قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف المزوّد من أجل اكتشاف موجّه.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصل الاستطلاع لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الاحتياطي الأقصى لرموز المخرجات للنماذج المكتشفة.

### أمثلة على المزوّدين

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

استخدم `cerebras/zai-glm-4.7` مع Cerebras؛ واستخدم `zai/glm-4.7` مع Z.AI مباشرةً.

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

عيّن `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم المراجع `opencode/...` لفهرس Zen أو المراجع `opencode-go/...` لفهرس Go. اختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

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

عيّن `ZAI_API_KEY`. وتُقبل `z.ai/*` و`z-ai/*` كأسماء مستعارة. اختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف مزودًا مخصصًا مع تجاوز `baseUrl`.

</Accordion>

<Accordion title="Moonshot AI ‏(Kimi)">

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

بالنسبة إلى نقطة النهاية في الصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

تعلن نقاط النهاية الأصلية لـ Moonshot عن توافق استخدام البث على النقل المشترك
`openai-completions`، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية
وليس على معرّف المزوّد المضمن وحده.

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

متوافق مع Anthropic، ومزوّد مضمن. اختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

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

يجب أن يحذف عنوان URL الأساسي `/v1` (لأن عميل Anthropic يضيفه). اختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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

عيّن `MINIMAX_API_KEY`. الاختصارات:
`openclaw onboard --auth-choice minimax-global-api` أو
`openclaw onboard --auth-choice minimax-cn-api`.
يفترض فهرس النماذج القيمة M2.7 فقط.
في مسار البث المتوافق مع Anthropic، يعطّل OpenClaw التفكير في MiniMax
افتراضيًا ما لم تعيّن `thinking` بنفسك صراحةً. ويعيد `/fast on` أو
`params.fastMode: true` كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [Local Models](/ar/gateway/local-models). باختصار: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ وأبقِ النماذج المستضافة مدمجة من أجل الاحتياط.

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
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `install.preferBrew`: عند تعيينه إلى true، يفضّل أدوات التثبيت عبر Homebrew عندما يكون `brew`
  متاحًا قبل الرجوع إلى أنواع أدوات التثبيت الأخرى.
- `install.nodeManager`: تفضيل مُثبّت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يؤدي `entries.<skillKey>.enabled: false` إلى تعطيل Skill حتى لو كانت مضمّنة/مثبّتة.
- `entries.<skillKey>.apiKey`: عنصر مناسب لـ Skills التي تعرّف متغير بيئة أساسيًا (سلسلة نصية صريحة أو كائن SecretRef).

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
- يقبل الاكتشاف Plugin الأصلية لـ OpenClaw بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل gateway.**
- `allow`: قائمة سماح اختيارية (يتم تحميل Plugin المدرجة فقط). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل مناسب لمفتاح API على مستوى Plugin (عندما يكون مدعومًا من Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون القيمة `false`، يحظر core الحدث `before_prompt_build` ويتجاهل الحقول القديمة المعدّلة لـ prompt من `before_agent_start`، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على hooks الأصلية لـ Plugin وعلى أدلة hooks التي توفّرها الحزم المدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: وثّق هذه Plugin صراحةً لطلب تجاوزات `provider` و`model` لكل تشغيل بالنسبة إلى تشغيلات الوكلاء الفرعيين في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية الخاصة بتجاوزات الوكلاء الفرعيين الموثوق بها. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات معرّف من Plugin (ويُتحقق منه بواسطة مخطط Plugin الأصلي لـ OpenClaw عندما يكون متاحًا).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزوّد Firecrawl لجلب الويب.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). ويعود احتياطيًا إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ Firecrawl API (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر cache بالميلي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث Grok على الويب).
  - `enabled`: تفعيل مزوّد X Search.
  - `model`: نموذج Grok المطلوب استخدامه للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) لمعرفة المراحل والحدود.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل عملية Dreaming كاملة (`"0 3 * * *"` افتراضيًا).
  - سياسة المراحل والحدود هي تفاصيل تنفيذية (وليست مفاتيح إعدادات موجّهة للمستخدم).
- يوجد إعداد الذاكرة الكامل في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضًا لحزم Claude المفعّلة أن تساهم بقيم Pi افتراضية مضمنة من `settings.json`؛ ويطبّق OpenClaw هذه القيم كإعدادات وكيل منقّحة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشطة، أو `"none"` لتعطيل Plugin الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin لمحرك السياق النشط؛ وتكون القيمة الافتراضية `"legacy"` ما لم تثبّت وتحدد محركًا آخر.
- `plugins.installs`: بيانات تعريف التثبيت التي يديرها CLI وتستخدمها `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - تعامل مع `plugins.installs.*` على أنها حالة مُدارة؛ وفضّل أوامر CLI بدلًا من التعديلات اليدوية.

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
      // dangerouslyAllowPrivateNetwork: true, // فعّله فقط للوصول الموثوق إلى الشبكات الخاصة
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
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عندما لا يُعيَّن، لذلك يبقى تنقل المتصفح صارمًا افتراضيًا.
- عيّن `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا في تنقل المتصفح عبر الشبكات الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لنفس حظر الشبكات الخاصة أثناء فحوصات الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون ملفات التعريف البعيدة بنمط الإرفاق فقط (start/stop/reset معطّلة).
- تقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw المسار `/json/version`؛ واستخدم WS(S)
  عندما يوفّر لك مزوّدك عنوان DevTools WebSocket مباشرًا.
- تكون ملفات تعريف `existing-session` خاصة بالمستضيف فقط وتستخدم Chrome MCP بدلًا من CDP.
- يمكن لملفات تعريف `existing-session` تعيين `userDataDir` لاستهداف
  ملف تعريف محدد لمتصفح مبني على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات موجّهة باللقطات/المراجع بدلًا من الاستهداف بمحددات CSS، وخطافات رفع ملف واحد،
  ومن دون تجاوزات مهلة الحوارات، ومن دون `wait --load networkidle`، ومن دون
  `responsebody` أو تصدير PDF أو اعتراض التنزيل أو الإجراءات الدفعية.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة تلقائيًا `cdpPort` و`cdpUrl`؛ ولا
  تعيّن `cdpUrl` صراحةً إلا لـ CDP البعيد.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنيًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` رايات تشغيل إضافية إلى بدء Chromium المحلي (على سبيل المثال
  `--disable-gpu` أو تحديد حجم النافذة أو رايات التصحيح).

---

## UI

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

- `seamColor`: لون التمييز لعناصر واجهة التطبيق الأصلية (مثل تلوين فقاعة Talk Mode، وما إلى ذلك).
- `assistant`: تجاوز هوية Control UI. ويعود احتياطيًا إلى هوية الوكيل النشط.

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
      // trustedProxy: { userHeader: "x-forwarded-user" }, // لوضع mode=trusted-proxy؛ راجع /gateway/trusted-proxy-auth
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
      // allowedOrigins: ["https://control.example.com"], // مطلوبة لواجهة Control UI غير loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // وضع خطير للاعتماد على أصل Host-header
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
      // عناصر رفض HTTP إضافية لـ /tools/invoke
      deny: ["browser"],
      // إزالة أدوات من قائمة الرفض الافتراضية لـ HTTP
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

- `mode`: ‏`local` (تشغيل gateway) أو `remote` (الاتصال بـ gateway بعيد). ويرفض Gateway البدء ما لم يكن `local`.
- `port`: منفذ متعدد الإرسال واحد لـ WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` (الافتراضي) أو `lan` ‏(`0.0.0.0`) أو `tailnet` (عنوان IP لـ Tailscale فقط) أو `custom`.
- **الأسماء البديلة القديمة لـ bind**: استخدم قيم وضع bind في `gateway.bind` ‏(`auto` و`loopback` و`lan` و`tailnet` و`custom`)، وليس أسماء المستضيف البديلة (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع شبكات Docker bridge ‏(`-p 18789:18789`)، تصل الحركة إلى `eth0`، لذلك يصبح gateway غير قابل للوصول. استخدم `--network host`، أو عيّن `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب bind غير loopback مصادقة gateway. وعمليًا، يعني ذلك رمزًا مشتركًا/كلمة مرور مشتركة أو وكيلًا عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`. ويولّد معالج الإعداد رمزًا افتراضيًا.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين (بما في ذلك SecretRefs)، فعيّن `gateway.auth.mode` صراحةً إلى `token` أو `password`. وتفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مهيأين ويكون mode غير معيّن.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط مع إعدادات local loopback الموثوق بها؛ وهذا غير معروض عمدًا في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى وكيل عكسي مدرك للهوية ووثّق رؤوس الهوية من `gateway.trustedProxies` (راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير loopback**؛ إذ لا تلبّي الوكلاء العكسية ذات loopback على المستضيف نفسه مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عند تعيينه إلى `true`، يمكن لرؤوس هوية Tailscale Serve استيفاء مصادقة Control UI/WebSocket (بعد التحقق عبر `tailscale whois`). ولا تستخدم نقاط نهاية HTTP API مصادقة رؤوس Tailscale تلك؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ gateway بدلًا من ذلك. ويفترض هذا التدفق من دون رمز أن مستضيف gateway موثوق. وتكون القيمة الافتراضية `true` عندما يكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدّد اختياري لمحاولات المصادقة الفاشلة. ويُطبَّق لكل IP عميل ولكل نطاق مصادقة (يُتتبَّع السر المشترك ورمز الجهاز مستقلين عن بعضهما). وتعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Tailscale Serve غير المتزامن الخاص بـ Control UI، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تفعّل المحدِّد عند الطلب الثاني بدلًا من أن يمر الاثنان على أنهما عدم تطابق عادي.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ عيّنها إلى `false` عندما تريد عمدًا تطبيق تحديد المعدل على حركة localhost أيضًا (لإعدادات الاختبار أو عمليات نشر الوكيل الصارمة).
- تُخفَّض دائمًا محاولات مصادقة WS ذات أصل المتصفح مع تعطيل إعفاء loopback (كإجراء دفاعي إضافي ضد الهجمات بالقوة الغاشمة على localhost انطلاقًا من المتصفح).
- على loopback، تُعزَل حالات القفل ذات الأصل من المتصفح بحسب قيمة `Origin`
  المطَبَّعة، بحيث لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` (tailnet فقط، مع bind loopback) أو `funnel` (عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح من أجل اتصالات WebSocket بـ Gateway. وهي مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى أصل Host-header لعمليات النشر التي تعتمد عمدًا على سياسة أصل Host-header.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` ‏(ws/wss). وبالنسبة إلى `direct`، يجب أن يكون `remote.url` من النوع `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ من جهة العميل يسمح باستخدام `ws://` النصي الصريح مع عناوين IP موثوق بها على الشبكات الخاصة؛ وتبقى القيمة الافتراضية مقتصرة على loopback فقط بالنسبة إلى الاتصالات النصية الصريحة.
- `gateway.remote.token` / `.password`: حقول بيانات اعتماد للعميل البعيد. وهي لا تهيّئ مصادقة gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي للوكيل الخارجي APNs relay الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالوكيل إلى gateway. ويجب أن يطابق هذا العنوان عنوان relay المضمّن في نسخة iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من gateway إلى relay بالميلي ثانية. الافتراضي `10000`.
- تُفوَّض التسجيلات المدعومة بالوكيل إلى هوية gateway محددة. ويجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل relay، ويمرّر صلاحية إرسال ضمن نطاق التسجيل إلى gateway. ولا يمكن لـ gateway آخر إعادة استخدام ذلك التسجيل المخزَّن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لإعداد relay المذكور أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج تطويري فقط لعناوين relay من نوع HTTP على loopback. ويجب أن تبقى عناوين relay الإنتاجية على HTTPS.
- `gateway.channelHealthCheckMinutes`: فترة مراقبة صحة القنوات بالدقائق. عيّن القيمة `0` لتعطيل إعادة التشغيل الخاصة بمراقبة الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: حد المقبس القديم بالدقائق. اجعل هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات التشغيل بسبب مراقبة الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات التشغيل الخاصة بمراقبة الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب في القنوات متعددة الحسابات. وعند تعيينه، تكون له الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء gateway المحلية استخدام `gateway.remote.*` كاحتياطي فقط عندما لا تكون `gateway.auth.*` معيّنة.
- إذا كان `gateway.auth.token` / `gateway.auth.password` مهيأين صراحةً عبر SecretRef وكانا غير محلولين، يفشل الحل بإغلاق افتراضي (من دون تمويه عبر احتياطي بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين الذين ينهون TLS أو يحقنون رؤوس العميل المُحوَّلة. أدرج فقط الوكلاء الذين تتحكم بهم. وتظل إدخالات loopback صالحة لإعدادات الاكتشاف المحلي/الوكيل على المستضيف نفسه (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند تعيينه إلى `true`، يقبل gateway القيمة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك الإغلاق الافتراضي.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لطلب HTTP `POST /tools/invoke` (تمتد فوق قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة الرفض الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطّلة افتراضيًا. فعّلها عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامَل قوائم السماح الفارغة على أنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- رأس تقوية اختياري للاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (عيّنه فقط لأصول HTTPS التي تتحكم بها؛ راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل بين النسخ المتعددة

شغّل عدة Gateways على مستضيف واحد مع منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

رايات مناسبة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [Multiple Gateways](/ar/gateway/multiple-gateways).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع gateway ‏(HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: يولّد تلقائيًا زوج cert/key محليًا موقّعًا ذاتيًا عندما لا تكون الملفات الصريحة مهيأة؛ للاستخدام local/dev فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ ويجب إبقاء الوصول إليه مقيّدًا.
- `caPath`: مسار اختياري إلى حزمة CA من أجل التحقق من العميل أو سلاسل الثقة المخصصة.

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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات أثناء التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): حاول أولًا إعادة التحميل الحية؛ وعُد إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة ارتداد بالميلي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى بالميلي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل (الافتراضي: `300000` = 5 دقائق).

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

المصادقة: `Authorization: Bearer <token>` أو `x-openclaw-token: <token>`.
تُرفض رموز hook في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة غير فارغة لـ `hooks.token`.
- يجب أن تكون `hooks.token` **مختلفة** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` مساويًا لـ `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيد `hooks.allowedSessionKeyPrefixes` (مثل `["hook:"]`).

**نقاط النهاية:**

- `POST /hooks/wake` → ‏`{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → ‏`{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا تُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثل `/hooks/gmail` ← `gmail`).
- يطابق `match.source` حقلًا من الحمولة بالنسبة إلى المسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن لـ `transform` الإشارة إلى وحدة JS/TS تُرجع إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى ضمن `hooks.transformsDir` (وتُرفض المسارات المطلقة وعمليات العبور).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، و`[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات hook agent التي لا تحتوي على `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات الخاصة بقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ وتكون القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` قيمة LLM لهذا التشغيل الخاص بـ hook (ويجب أن يكون مسموحًا به إذا كان فهرس النماذج معيّنًا).

</Accordion>

### تكامل Gmail

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

- يبدأ Gateway تلقائيًا تشغيل `gog gmail watch serve` عند الإقلاع عندما يكون مهيأً. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` لتعطيله.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

---

## مستضيف Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // أو OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يقدّم HTML/CSS/JS القابلة للتعديل من الوكيل وA2UI عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- في bind غير loopback: تتطلب مسارات canvas مصادقة Gateway (token/password/trusted-proxy)، مثل بقية أسطح HTTP في Gateway.
- لا ترسل WebViews الخاصة بـ Node عادةً رؤوس مصادقة؛ وبعد إقران Node واتصالها، يعلن Gateway عناوين capability URL ضمن نطاق node للوصول إلى canvas/A2UI.
- ترتبط عناوين capability URL بجلسة WS النشطة الخاصة بـ node وتنتهي بسرعة. ولا يُستخدم احتياطي يعتمد على IP.
- يحقن عميل إعادة التحميل الحية في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عند الفراغ.
- كما يقدّم A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل gateway.
- عطّل إعادة التحميل الحية بالنسبة إلى الأدلة الكبيرة أو أخطاء `EMFILE`.

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

- `minimal` (الافتراضي): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`.
- يكون اسم المستضيف افتراضيًا `openclaw`. ويمكن تجاوزه عبر `OPENCLAW_MDNS_HOSTNAME`.

### النطاق الواسع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة unicast DNS-SD تحت `~/.openclaw/dns/`. وبالنسبة إلى الاكتشاف عبر الشبكات، اجمعه مع خادم DNS ‏(ويُوصى بـ CoreDNS) + ‏Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` (متغيرات بيئة مضمنة)

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

- لا تُطبَّق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + الملف `~/.openclaw/.env` (ولا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول لديك.
- راجع [Environment](/ar/help/environment) لمعرفة الأولوية الكاملة.

### الاستبدال بمتغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تُطابق الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` لتمثيل `${VAR}` حرفيًا.
- يعمل ذلك مع `$include`.

---

## الأسرار

تكون مراجع الأسرار إضافية: ما تزال القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكل كائن واحد:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` عند `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` مع `id`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط `id` عند `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار `.` أو `..` مفصولة بشرطة مائلة (مثل `a/../b` وهو مرفوض)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القانونية: [SecretRef Credential Surface](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُدرج مراجع `auth-profiles.json` في الحل أثناء التشغيل وفي تغطية التدقيق.

### إعداد موفري الأسرار

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

- يدعم موفّر `file` الوضعين `mode: "json"` و`mode: "singleValue"` (ويجب أن يكون `id` مساويًا لـ `"value"` في وضع singleValue).
- يتطلب موفّر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول على stdin/stdout.
- تُرفض مسارات الأوامر الرمزية افتراضيًا. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا كان `trustedDirs` معيّنًا، فيُطبَّق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة العملية الابنة لـ `exec` محدودة افتراضيًا؛ ومرّر المتغيرات المطلوبة صراحةً عبر `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة موجودة في الذاكرة، ثم تقرأ مسارات الطلب تلك اللقطة فقط.
- يُطبَّق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعّلة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع بيانات تشخيصية.

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

- تُخزَّن ملفات التعريف لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` للوضع `api_key`، و`tokenRef` للوضع `token`) لأنماط بيانات الاعتماد الثابتة.
- لا تدعم ملفات تعريف وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملفات التعريف المدعومة بواسطة SecretRef.
- تأتي بيانات الاعتماد الثابتة أثناء التشغيل من لقطات محلولة في الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- استيرادات OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك وقت تشغيل الأسرار وأدوات `audit/configure/apply`: ‏[Secrets Management](/ar/gateway/secrets).

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

- `billingBackoffHours`: فترة التراجع الأساسية بالساعات عندما يفشل ملف التعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية
  (الافتراضي: `5`). ويمكن أن تصل نصوص الفوترة الصريحة
  إلى هنا حتى على استجابات `401`/`403`، لكن
  مطابِقات النصوص الخاصة بكل مزوّد تظل محصورة بالمزوّد الذي يملكها (مثل OpenRouter
  `Key limit exceeded`). وتبقى رسائل نافذة الاستخدام القابلة لإعادة المحاولة في HTTP `402` أو
  رسائل حدود الإنفاق الخاصة بالمؤسسة/مساحة العمل ضمن مسار `rate_limit`
  بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية حسب المزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: فترة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: النافذة المتحركة بالساعات المستخدمة لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لعمليات تدوير ملفات تعريف المصادقة للمزوّد نفسه في حالات الحمل الزائد قبل التحويل إلى fallback للنموذج (الافتراضي: `1`). وتدخل هنا أشكال انشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير ملف تعريف/مزوّد مثقل (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لعمليات تدوير ملفات تعريف المصادقة للمزوّد نفسه في حالات تحديد المعدل قبل التحويل إلى fallback للنموذج (الافتراضي: `1`). وتتضمن سلة تحديد المعدل تلك نصوصًا بصياغة المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- عيّن `logging.file` للحصول على مسار ثابت.
- يرتفع `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل كبح الكتابة (عدد صحيح موجب؛ الافتراضي: `524288000` = 500 MB). استخدم تدوير السجلات الخارجي لعمليات النشر الإنتاجية.

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
- `flags`: مصفوفة من سلاسل الرايات التي تفعّل مخرجات سجل موجّهة (وتدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: حد العمر بالميلي ثانية لإصدار تحذيرات الجلسة العالقة بينما تبقى الجلسة في حالة معالجة.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`).
- `otel.endpoint`: عنوان URL للمجمّع من أجل تصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: رؤوس بيانات تعريف HTTP/gRPC إضافية تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير الأثر أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات الأثر من `0` إلى `1`.
- `otel.flushIntervalMs`: فترة التفريغ الدورية للقياسات بالميلي ثانية.
- `cacheTrace.enabled`: تسجيل لقطات تتبع cache للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لملف JSONL الخاص بتتبع cache (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم في ما يُضمَّن في مخرجات تتبع cache (وجميعها افتراضيًا: `true`).

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
- `checkOnStart`: التحقق من تحديثات npm عند بدء gateway (الافتراضي: `true`).
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable (الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية بالساعات لتطبيقات قناة stable (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد المرات التي تُجرى فيها فحوص قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: بوابة الميزات العامة لـ ACP (الافتراضي: `false`).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسات ACP (الافتراضي: `true`). عيّنها إلى `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضية لوقت تشغيل ACP (ويجب أن يطابق Plugin وقت تشغيل ACP مسجلة).
- `defaultAgent`: معرّف وكيل ACP الاحتياطي المستهدف عندما لا تحدد عمليات spawn هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ وتعني القيمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة بالتوازي.
- `stream.coalesceIdleMs`: نافذة التفريغ عند الخمول بالميلي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم القطعة قبل تقسيم إسقاط الكتل المتدفقة.
- `stream.repeatSuppression`: كبح أسطر الحالة/الأدوات المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تؤدي `"live"` إلى البث التدريجي؛ بينما تقوم `"final_only"` بالتخزين المؤقت حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى لأحرف أسطر الحالة/التحديث المسقطة الخاصة بـ ACP.
- `stream.tagVisibility`: سجل بأسماء الوسوم إلى تجاوزات إظهار منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: قيمة TTL للخمول بالدقائق لعمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
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

- يتحكم `cli.banner.taglineMode` في نمط الشعار النصي:
  - `"random"` (الافتراضي): شعارات نصية متداولة طريفة/موسمية.
  - `"default"`: شعار نصي محايد ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بدون نص شعار (مع بقاء عنوان/إصدار الشعار ظاهرين).
- لإخفاء الشعار بالكامل (وليس الشعارات النصية فقط)، عيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

بيانات تعريف يكتبها تدفق الإعداد الموجّه في CLI ‏(`onboard` و`configure` و`doctor`):

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

راجع حقول الهوية في `agents.list` تحت [الإعدادات الافتراضية للوكلاء](#agent-defaults).

---

## Bridge (قديم، أُزيل)

لم تعد الإصدارات الحالية تتضمن TCP bridge. تتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعدادات (ويفشل التحقق حتى إزالتها؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

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
    webhook: "https://example.invalid/legacy", // قيمة احتياطية قديمة ومهجورة للوظائف المخزنة ذات notify:true
    webhookToken: "replace-with-dedicated-token", // رمز bearer اختياري لمصادقة Webhook الصادر
    sessionRetention: "24h", // سلسلة مدة أو false
    runLog: {
      maxBytes: "2mb", // الافتراضي 2_000_000 بايت
      keepLines: 2000, // الافتراضي 2000
    },
  },
}
```

- `sessionRetention`: المدة التي تُحفَظ خلالها جلسات تشغيل Cron المعزولة المكتملة قبل قصّها من `sessions.json`. كما تتحكم أيضًا في تنظيف أرشيفات نصوص Cron المحذوفة. الافتراضي: `24h`؛ عيّن `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى للحجم لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل القص. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي يُحتفَظ بها عند تفعيل قص سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز bearer المستخدم في تسليم POST الخاص بـ Cron webhook ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلن يُرسَل رأس مصادقة.
- `webhook`: عنوان URL احتياطي قديم ومهجور لـ webhook ‏(http/https) يُستخدم فقط للوظائف المخزنة التي ما زالت تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للوظائف أحادية التشغيل عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالميلي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — `"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة محاولة جميع الأنواع العابرة.

ينطبق ذلك فقط على وظائف Cron أحادية التشغيل. أما الوظائف المتكررة فتستخدم معالجة فشل منفصلة.

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

- `enabled`: تفعيل تنبيهات فشل وظائف Cron (الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالميلي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `mode`: وضع التسليم — ترسل `"announce"` عبر رسالة قناة؛ بينما تنشر `"webhook"` إلى Webhook المهيأ.
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
- `channel`: تجاوز القناة لتسليم announce. وتعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان URL لـ Webhook. وهو مطلوب لوضع webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- يتجاوز `delivery.failureDestination` لكل وظيفة هذا الافتراضي العام.
- عندما لا تكون هناك وجهة فشل عامة أو خاصة بالوظيفة، فإن الوظائف التي تُسلِّم أصلًا عبر `announce` تعود احتياطيًا إلى هدف announce الأساسي نفسه عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [Cron Jobs](/ar/automation/cron-jobs). وتُتتبَّع عمليات تنفيذ Cron المعزولة كـ [background tasks](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

العناصر النائبة في القالب التي تُوسَّع في `tools.media.models[].args`:

| المتغير | الوصف |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | متن الرسالة الواردة بالكامل                         |
| `{{RawBody}}`      | المتن الخام (من دون أغلفة السجل/المرسل)             |
| `{{BodyStripped}}` | المتن بعد إزالة إشارات المجموعات منه                 |
| `{{From}}`         | معرّف المرسل                                 |
| `{{To}}`           | معرّف الوجهة                            |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                              |
| `{{IsNewSession}}` | القيمة `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | عنوان pseudo-URL للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                  |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`   | النص المفرغ للصوت                                  |
| `{{Prompt}}`       | prompt الوسائط المحلول لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف المخرجات لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)               |
| `{{SenderName}}`   | اسم العرض للمرسل (بأفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                 |
| `{{Provider}}`     | تلميح المزوّد (whatsapp أو telegram أو discord، إلخ.) |

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
- مصفوفة ملفات: تُدمَج عميقًا بالترتيب (واللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمَج بعد التضمينات (وتتجاوز القيم المضمَّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف المتضمِّن، لكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` الخاص بـ `openclaw.json`). وتُسمح الصيغ المطلقة/`../` فقط عندما تظل تُحل داخل ذلك الحد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة على الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_
