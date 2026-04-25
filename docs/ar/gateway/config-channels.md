---
read_when:
    - ضبط Plugin قناة (المصادقة، والتحكم في الوصول، وتعدد الحسابات)
    - استكشاف أخطاء مفاتيح الإعداد الخاصة بكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة، أو سياسة المجموعات، أو تقييد الإشارات
summary: 'إعدادات القنوات: التحكم في الوصول، والاقتران، والمفاتيح الخاصة بكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها'
title: الإعدادات — القنوات
x-i18n:
    generated_at: "2026-04-25T13:46:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b7071f7cda3f7f71b464e64c2abb8e0b88326606234f0cf7778c80a7ef4b3e0
    source_path: gateway/config-channels.md
    workflow: 15
---

مفاتيح الإعداد الخاصة بكل قناة ضمن `channels.*`. تغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات تعدد الحسابات، وتقييد الإشارات، والمفاتيح الخاصة بكل قناة في Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها من Plugins القنوات المضمّنة.

بالنسبة إلى الوكلاء، والأدوات، ووقت تشغيل gateway، والمفاتيح الأخرى ذات المستوى الأعلى، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيًا عندما يكون قسم إعداداتها موجودًا (ما لم تكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب على المالك الموافقة |
| `allowlist`         | المرسلون الموجودون فقط في `allowFrom` (أو مخزن السماح المقترن)             |
| `open`              | السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل جميع الرسائل المباشرة الواردة                                          |

| سياسة المجموعات        | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | المجموعات المطابقة لقائمة السماح المهيأة فقط          |
| `open`                | تجاوز قوائم سماح المجموعات (مع استمرار تطبيق تقييد الإشارات) |
| `disabled`            | حظر جميع رسائل المجموعات/الغرف                          |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالمزوّد مضبوطة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويبلغ الحد الأقصى لطلبات اقتران الرسائل المباشرة المعلقة **3 لكل قناة**.
إذا كان مقطع المزوّد مفقودًا بالكامل (`channels.<provider>` غير موجود)، فإن سياسة المجموعات في وقت التشغيل تعود إلى `allowlist` (إغلاق آمن) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معين. تقبل القيم `provider/model` أو الأسماء المستعارة المهيأة للنموذج. ويُطبَّق ربط القناة عندما لا تكون للجلسة بالفعل قيمة تجاوز للنموذج (على سبيل المثال، مضبوطة عبر `/model`).

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

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشترك عبر المزوّدين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما لا تكون `groupPolicy` على مستوى المزوّد مضبوطة.
- `channels.defaults.contextVisibility`: وضع الرؤية الافتراضي للسياق التكميلي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/السلسلة/السجل)، و`allowlist` (تضمين السياق من المرسلين الموجودين في قائمة السماح فقط)، و`allowlist_quote` (مثل allowlist لكن مع الإبقاء على سياق الاقتباس/الرد الصريح). التجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat مدمجة بنمط المؤشر.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بـ gateway (Baileys Web). ويبدأ تلقائيًا عند وجود جلسة مرتبطة.

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

- تفترض الأوامر الصادرة الحساب `default` إذا كان موجودًا؛ وإلا فمعرّف الحساب الأول المهيأ (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري هذا الاختيار الاحتياطي الافتراضي للحساب عندما يطابق معرّف حساب مهيأ.
- يرحّل `openclaw doctor` دليل مصادقة Baileys القديم أحادي الحساب إلى `whatsapp/default`.
- تجاوزات لكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، و`channels.whatsapp.accounts.<id>.dmPolicy`، و`channels.whatsapp.accounts.<id>.allowFrom`.

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

- رمز bot: ‏`channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كرجوع احتياطي للحساب الافتراضي.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- في إعدادات تعدد الحسابات (معرّفا حسابين أو أكثر)، اضبط قيمة افتراضية صريحة (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويصدر `openclaw doctor` تحذيرًا عند غياب هذا الإعداد أو عدم صحته.
- يؤدي `configWrites: false` إلى حظر عمليات كتابة الإعدادات التي يبدأها Telegram (ترحيلات معرّف supergroup، و`/config set|unset`).
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` عمليات ربط ACP دائمة لموضوعات المنتدى (استخدم الصيغة القياسية `chatId:topic:topicId` في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات البث في Telegram الأمرين `sendMessage` + `editMessageText` (ويعمل ذلك في الدردشات المباشرة والجماعية).
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

- الرمز المميز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كرجوع احتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفّر `token` صريحًا لـ Discord ذلك الرمز المميز في الاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب آتية من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة guild) لأهداف التسليم؛ وتُرفض المعرّفات الرقمية المجرّدة.
- تكون slugs الخاصة بـ Guild بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المحوّل إلى slug (من دون `#`). ويفضَّل استخدام معرّفات guild.
- يتم تجاهل الرسائل التي يكتبها bot افتراضيًا. ويؤدي `allowBots: true` إلى تفعيلها؛ واستخدم `allowBots: "mentions"` لقبول رسائل bot التي تذكر bot فقط (مع استمرار تصفية رسائله الذاتية).
- يؤدي `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) إلى إسقاط الرسائل التي تذكر مستخدمًا آخر أو دورًا آخر لكن لا تذكر bot (باستثناء @everyone/@here).
- يقوم `maxLinesPerMessage` (الافتراضي 17) بتقسيم الرسائل الطويلة عموديًا حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`، والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب الخمول بالساعات (`0` للتعطيل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` للتعطيل)
  - `spawnSubagentSessions`: مفتاح اشتراك صريح لإنشاء/ربط السلاسل تلقائيًا عبر `sessions_spawn({ thread: true })`
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` عمليات ربط ACP دائمة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات Discord components v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية بالإضافة إلى تجاوزات اختيارية لـ auto-join + LLM + TTS.
- يقوم `channels.discord.voice.model` اختياريًا بتجاوز نموذج LLM المستخدم لردود قنوات Discord الصوتية.
- تمرّر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` مباشرة إلى خيارات DAVE في `@discordjs/voice` (الافتراضيان `true` و`24`).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة جلسة الصوت والانضمام إليها مجددًا بعد تكرار إخفاقات فك التشفير.
- يُعد `channels.discord.streaming` مفتاح وضع البث القياسي. وتتم ترحيل القيم القديمة `streamMode` والقيم المنطقية `streaming` تلقائيًا.
- يربط `channels.discord.autoPresence` التوفر في وقت التشغيل بحالة حضور bot (سليم => online، متدهور => idle، مستنفد => dnd) ويتيح تجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق كسر الزجاج).
- `channels.discord.execApprovals`: تسليم موافقات Exec الأصلية في Discord وتفويض المعتمِدين.
  - `enabled`: ‏`true`، أو `false`، أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن تحليل المعتمِدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. ويعود إلى `commands.ownerAllowFrom` عند حذفه.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتوجيه الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو regex).
  - `target`: المكان الذي تُرسل إليه مطالبات الموافقة. ترسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للمعتمِدين، وترسل `"channel"` إلى القناة الأصلية، وترسل `"both"` إلى كليهما. وعندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل المعتمِدين الذين تم تحليلهم.
  - `cleanupAfterResolve`: عندما تكون `true`، يحذف الرسائل المباشرة الخاصة بالموافقة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** ‏`off` (بلا شيء)، و`own` (رسائل bot، الافتراضي)، و`all` (كل الرسائل)، و`allowlist` (من `guilds.<id>.users` على جميع الرسائل).

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

- JSON الخاص بحساب الخدمة: مضمن (`serviceAccount`) أو معتمد على ملف (`serviceAccountFile`).
- كما أن SecretRef الخاص بحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- الرجوع الاحتياطي إلى البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة email principal القابلة للتغيير (وضع توافق كسر الزجاج).

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

- يتطلب **Socket mode** كلاً من `botToken` و`appToken` (مع `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كرجوع احتياطي من البيئة للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية
  صريحة أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل بيانات اعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus` و، في وضع HTTP،
  `signingSecretStatus`. وتعني `configured_unavailable` أن الحساب
  مضبوط عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن
  من تحليل قيمة السر.
- يؤدي `configWrites: false` إلى حظر عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- يُعد `channels.slack.streaming.mode` مفتاح وضع البث القياسي لـ Slack. ويتحكم `channels.slack.streaming.nativeTransport` في ناقل البث الأصلي الخاص بـ Slack. وتتم ترحيل القيم القديمة `streamMode` والقيم المنطقية `streaming` و`nativeStreaming` تلقائيًا.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** ‏`off`، و`own` (الافتراضي)، و`all`، و`allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** يكون `thread.historyScope` لكل سلسلة (الافتراضي) أو مشتركًا على مستوى القناة. ويقوم `thread.inheritParent` بنسخ transcript القناة الأم إلى السلاسل الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة السلسلة بنمط مساعد Slack "is typing..." هدف سلسلة رد. وتبقى الرسائل المباشرة العليا خارج السلسلة افتراضيًا، لذلك تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بنمط السلسلة.
- يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يكون الرد قيد التشغيل، ثم يزيله عند الاكتمال. استخدم shortcode لرمز تعبيري في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات Exec الأصلية في Slack وتفويض المعتمِدين. المخطط نفسه كما في Discord: ‏`enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"`، أو `"channel"`، أو `"both"`).

| مجموعة الإجراء | الافتراضي | ملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | التفاعل + سرد التفاعلات |
| messages     | enabled | القراءة/الإرسال/التحرير/الحذف  |
| pins         | enabled | التثبيت/إلغاء التثبيت/السرد         |
| memberInfo   | enabled | معلومات العضو            |
| emojiList    | enabled | قائمة emoji المخصصة      |

### Mattermost

يُشحَن Mattermost كـ Plugin: ‏`openclaw plugins install @openclaw/mattermost`.

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

أوضاع الدردشة: `oncall` (الرد عند @-mention، الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة التفعيل).

عند تفعيل الأوامر الأصلية في Mattermost:

- يجب أن يكون `commands.callbackPath` مسارًا (مثل `/api/channels/mattermost/command`) وليس عنوان URL كاملًا.
- يجب أن يُحل `commands.callbackUrl` إلى نقطة نهاية gateway الخاصة بـ OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تتم مصادقة نداءات slash الأصلية باستخدام الرموز المميزة لكل أمر التي تعيدها
  Mattermost أثناء تسجيل أوامر الشرطة المائلة. وإذا فشل التسجيل أو لم يتم
  تفعيل أي أوامر، فسيرفض OpenClaw النداءات مع
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي النداءات الخاصة/‏tailnet/الداخلية، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق النداء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL الكاملة.
- `channels.mattermost.configWrites`: السماح أو الرفض لعمليات كتابة الإعدادات التي يبدأها Mattermost.
- `channels.mattermost.requireMention`: اشتراط `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز تقييد الإشارة لكل قناة (`"*"` للإعداد الافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

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

**أوضاع إشعارات التفاعل:** ‏`off`، و`own` (الافتراضي)، و`all`، و`allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو الرفض لعمليات كتابة الإعدادات التي يبدأها Signal.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

### BlueBubbles

يُعد BlueBubbles المسار الموصى به لـ iMessage (مدعومًا عبر Plugin، ومضبوطًا تحت `channels.bluebubbles`).

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.bluebubbles`، و`channels.bluebubbles.dmPolicy`.
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم معالج BlueBubbles أو سلسلة الهدف (`chat_id:*`، أو `chat_guid:*`، أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- إعدادات قناة BlueBubbles الكاملة موثقة في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` (JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ.

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

- يتطلب Full Disk Access لقاعدة بيانات Messages.
- فضّل الأهداف من نوع `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP التحقق الصارم من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو الرفض لعمليات كتابة الإعدادات التي يبدأها iMessage.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم معالجًا مطبعًا أو هدف دردشة صريحًا (`chat_id:*`، أو `chat_guid:*`، أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

يُدعَم Matrix عبر Plugin ويُضبط تحت `channels.matrix`.

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

- تستخدم مصادقة token القيمة `accessToken`؛ وتستخدم مصادقة كلمة المرور `userId` + `password`.
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر proxy ‏HTTP(S) صريح. ويمكن للحسابات المسماة تجاوزه عبر `channels.matrix.accounts.<id>.proxy`.
- يتيح `channels.matrix.network.dangerouslyAllowPrivateNetwork` خوادم homeserver الخاصة/الداخلية. وكل من `proxy` وهذا الاشتراك الصريح في الشبكة عنصران مستقلان.
- يحدد `channels.matrix.defaultAccount` الحساب المفضّل في إعدادات تعدد الحسابات.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك تُتجاهل الغرف المدعو إليها والدعوات الجديدة الشبيهة بالرسائل المباشرة إلى أن تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات Exec الأصلية في Matrix وتفويض المعتمِدين.
  - `enabled`: ‏`true`، أو `false`، أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعَّل موافقات exec عندما يمكن تحليل المعتمِدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتوجيه الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو regex).
  - `target`: المكان الذي تُرسل إليه مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل المباشرة في Matrix داخل الجلسات: `per-user` (الافتراضي) يشارك حسب النظير الموجَّه إليه، بينما يعزل `per-room` كل غرفة رسالة مباشرة.
- تستخدم اختبارات حالة Matrix وعمليات البحث المباشر في الدليل سياسة proxy نفسها المستخدمة في حركة وقت التشغيل.
- إعدادات Matrix الكاملة، وقواعد الاستهداف، وأمثلة الإعداد موثقة في [Matrix](/ar/channels/matrix).

### Microsoft Teams

يُدعَم Microsoft Teams عبر Plugin ويُضبط تحت `channels.msteams`.

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.msteams`، و`channels.msteams.configWrites`.
- إعدادات Teams الكاملة (بيانات الاعتماد، وwebhook، وسياسة الرسائل المباشرة/المجموعات، والتجاوزات لكل فريق/لكل قناة) موثقة في [Microsoft Teams](/ar/channels/msteams).

### IRC

يُدعَم IRC عبر Plugin ويُضبط تحت `channels.irc`.

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.irc`، و`channels.irc.dmPolicy`، و`channels.irc.configWrites`، و`channels.irc.nickserv.*`.
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- إعدادات قناة IRC الكاملة (المضيف/المنفذ/TLS/القنوات/قوائم السماح/تقييد الإشارات) موثقة في [IRC](/ar/channels/irc).

### تعدد الحسابات (جميع القنوات)

شغّل حسابات متعددة لكل قناة (لكل منها `accountId` خاص بها):

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

- يُستخدم `default` عند حذف `accountId` (في CLI + التوجيه).
- لا تنطبق الرموز المميزة من البيئة إلا على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم تُتجاوَز لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو عبر إعداد القناة الأولي) بينما لا تزال على إعداد قناة أحادي الحساب على المستوى الأعلى، فإن OpenClaw يرفع أولًا القيم أحادية الحساب على المستوى الأعلى والمحددة بنطاق الحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. وتنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ أما Matrix فيمكنه بدلًا من ذلك الحفاظ على هدف مسمّى/افتراضي مطابق موجود.
- تظل عمليات الربط الحالية الخاصة بالقناة فقط (من دون `accountId`) تطابق الحساب الافتراضي؛ وتبقى عمليات الربط المحددة بنطاق الحساب اختيارية.
- كما أن `openclaw doctor --fix` يصلح الأشكال المختلطة عبر نقل القيم أحادية الحساب على المستوى الأعلى والمحددة بنطاق الحساب إلى الحساب المرفوع المختار لتلك القناة. وتستخدم معظم القنوات `accounts.default`؛ أما Matrix فيمكنه الحفاظ على هدف مسمّى/افتراضي مطابق موجود بدلًا من ذلك.

### قنوات Plugin أخرى

يتم ضبط العديد من قنوات Plugin بصيغة `channels.<id>` وتوثيقها في صفحات القنوات المخصصة لها (مثل Feishu، وMatrix، وLINE، وNostr، وZalo، وNextcloud Talk، وSynology Chat، وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### تقييد الإشارات في الدردشة الجماعية

تفترض الرسائل الجماعية **اشتراط الإشارة** افتراضيًا (إشارة بيانات تعريف أو أنماط regex آمنة). وينطبق ذلك على دردشات المجموعات في WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الإشارات:**

- **إشارات بيانات التعريف**: إشارات @ الأصلية في المنصة. ويتم تجاهلها في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. ويتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يُفرض تقييد الإشارات إلا عندما يكون الاكتشاف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات تجاوزها عبر `channels.<channel>.historyLimit` (أو لكل حساب). اضبطها على `0` للتعطيل.

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

آلية التحليل: تجاوز لكل رسالة مباشرة → افتراضي المزوّد → بلا حد (الاحتفاظ بالجميع).

المدعوم: `telegram`، و`whatsapp`، و`discord`، و`slack`، و`signal`، و`imessage`، و`msteams`.

#### وضع الدردشة الذاتية

ضمّن رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ولا يرد إلا على أنماط النص):

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

- يضبط هذا المقطع أسطح الأوامر. وبالنسبة إلى كتالوج الأوامر الحالي المضمّن + المشحون، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. فالأوامر المملوكة للقناة/الـ Plugin مثل `/bot-ping` و`/bot-help` و`/bot-logs` الخاصة بـ QQ Bot، و`/card` الخاصة بـ LINE، و`/pair` الخاصة بـ device-pair، و`/dreaming` الخاصة بالذاكرة، و`/phone` الخاصة بالتحكم بالهاتف، و`/voice` الخاصة بـ Talk موثقة في صفحات القنوات/Plugins الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** مع `/` في البداية.
- تؤدي `native: "auto"` إلى تفعيل الأوامر الأصلية لـ Discord/Telegram، وتترك Slack معطلًا.
- تؤدي `nativeSkills: "auto"` إلى تفعيل أوامر Skills الأصلية لـ Discord/Telegram، وتترك Slack معطلًا.
- يمكن التجاوز لكل قناة عبر `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). وتؤدي القيمة `false` إلى مسح الأوامر المسجلة سابقًا.
- يمكن تجاوز تسجيل Skills الأصلية لكل قناة عبر `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة bot في Telegram.
- يؤدي `bash: true` إلى تفعيل `! <cmd>` لقشرة المضيف. ويتطلب ذلك `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يؤدي `config: true` إلى تفعيل `/config` (للقراءة/الكتابة في `openclaw.json`). وبالنسبة إلى عملاء `chat.send` في gateway، فإن عمليات الكتابة الدائمة عبر `/config set|unset` تتطلب أيضًا `operator.admin`؛ بينما يظل `/config show` للقراءة فقط متاحًا لعملاء المشغل العاديين ذوي نطاق الكتابة.
- يؤدي `mcp: true` إلى تفعيل `/mcp` لإعداد خادم MCP الذي يديره OpenClaw تحت `mcp.servers`.
- يؤدي `plugins: true` إلى تفعيل `/plugins` لاكتشاف Plugins وتثبيتها وتمكينها/تعطيلها.
- يتحكم `channels.<provider>.configWrites` في طفرات الإعدادات لكل قناة (الافتراضي: true).
- وبالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (مثل `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يؤدي `restart: false` إلى تعطيل `/restart` وإجراءات أداة إعادة تشغيل gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك بالنسبة إلى الأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- يؤدي `ownerDisplay: "hash"` إلى تجزئة معرّفات المالك في مطالبة النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- تكون `allowFrom` لكل مزوّد. وعند ضبطها، تصبح **مصدر التفويض الوحيد** (ويتم تجاهل قوائم سماح القنوات/الاقتران و`useAccessGroups`).
- يتيح `useAccessGroups: false` للأوامر تجاوز سياسات مجموعات الوصول عندما لا تكون `allowFrom` مضبوطة.
- خريطة توثيق الأوامر:
  - الكتالوج المضمّن + المشحون: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر البطاقة في LINE: [LINE](/ar/channels/line)
  - Dreaming الخاص بالذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — المفاتيح ذات المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
