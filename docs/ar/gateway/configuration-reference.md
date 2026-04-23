---
read_when:
    - تحتاج إلى دلالات إعدادات دقيقة على مستوى الحقول أو إلى القيم الافتراضية
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-23T07:24:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75c7e0d88ea6eacb8a2dd41f83033da853130dc2a689950c1a188d7c4ca8f977
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# مرجع الإعدادات

مرجع الإعدادات الأساسي للملف `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح إعدادات OpenClaw الرئيسية وتربط إلى الخارج عندما يكون لأحد الأنظمة الفرعية مرجع أعمق خاص به. وهي **لا** تحاول تضمين كل كتالوج أوامر مملوك لقناة/Plugin أو كل إعداد عميق للذاكرة/QMD في صفحة واحدة.

مصدر الحقيقة في الشيفرة:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وControl UI، مع دمج بيانات metadata الخاصة بالحزم/Plugins/القنوات المضمنة عند توفرها
- يعيد `config.schema.lookup` عقدة schema واحدة محددة بالمسار لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من hash الأساسي لوثائق الإعدادات مقابل سطح schema الحالي

المراجع العميقة المخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming تحت `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر المضمنة + المجمعة الحالي
- صفحات القنوات/Plugins المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (يُسمح بالتعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

تبدأ كل قناة تلقائيًا عندما يكون قسم إعداداتها موجودًا (ما لم تكن `enabled: false`).

### الوصول إلى الرسائل الخاصة والمجموعات

تدعم جميع القنوات سياسات الرسائل الخاصة وسياسات المجموعات:

| سياسة الرسائل الخاصة | السلوك |
| ------------------- | ------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة؛ ويجب على المالك الموافقة |
| `allowlist` | يُسمح فقط للمرسلين الموجودين في `allowFrom` (أو مخزن السماح المقترن) |
| `open` | السماح بجميع الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled` | تجاهل جميع الرسائل الخاصة الواردة |

| سياسة المجموعات | السلوك |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | فقط المجموعات المطابقة لقائمة السماح المُعدّة |
| `open` | تجاوز قوائم سماح المجموعات (مع استمرار تطبيق التقييد بالإشارة) |
| `disabled` | حظر جميع رسائل المجموعات/الغرف |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالموفر معيّنة.
تنتهي صلاحية رموز الاقتران بعد ساعة واحدة. ويكون الحد الأقصى لطلبات اقتران الرسائل الخاصة المعلقة **3 لكل قناة**.
إذا كانت كتلة الموفّر مفقودة بالكامل (`channels.<provider>` غير موجودة)، فإن سياسة المجموعات في وقت التشغيل تعود إلى `allowlist` (فشل مغلق) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات النموذج لكل قناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج معيّن. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المُعدة. ويُطبق تعيين القناة عندما لا تكون الجلسة تملك بالفعل تجاوزًا للنموذج (على سبيل المثال، تم تعيينه عبر `/model`).

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
- `channels.defaults.contextVisibility`: وضع إظهار السياق الإضافي الافتراضي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/السلسلة/السجل)، و`allowlist` (تضمين السياق من المرسلين الموجودين في قائمة السماح فقط)، و`allowlist_quote` (مثل allowlist ولكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في خرج Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في خرج Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض خرج Heartbeat مضغوط بأسلوب المؤشرات.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بـ gateway (Baileys Web). ويبدأ تلقائيًا عندما تكون هناك جلسة مرتبطة.

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا فأول معرّف حساب مُعدّ (بعد الترتيب).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري هذا الاختيار الاحتياطي للحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- يتم ترحيل دليل تفويض Baileys القديم أحادي الحساب بواسطة `openclaw doctor` إلى `whatsapp/default`.
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
          systemPrompt: "اجعل الإجابات مختصرة.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "ابقَ ضمن الموضوع.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "نسخ احتياطي Git" },
        { command: "generate", description: "إنشاء صورة" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (الافتراضي: off؛ فعّلها صراحةً لتجنب حدود المعدل الخاصة بتعديلات المعاينة)
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

- رمز bot المميز: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كاحتياط للحساب الافتراضي.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- في الإعدادات متعددة الحسابات (معرّفا حسابين أو أكثر)، اضبط قيمة افتراضية صريحة (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذر `openclaw doctor` عندما يكون هذا مفقودًا أو غير صالح.
- يحظر `configWrites: false` كتابات الإعدادات التي تبدأ من Telegram (ترحيلات معرّفات المجموعات الفائقة، وأوامر `/config set|unset`).
- تقوم إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` بإعداد عمليات ربط ACP الدائمة لموضوعات المنتدى (استخدم الصيغة المعيارية `chatId:topic:topicId` في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تستخدم معاينات البث في Telegram الأمرين `sendMessage` + `editMessageText` (ويعملان في الدردشات المباشرة والجماعية).
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
              systemPrompt: "إجابات قصيرة فقط.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (يُعيَّن progress إلى partial في Discord)
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

- الرمز المميز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كاحتياط للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفر `token` صريحًا لـ Discord هذا الرمز المميز لذلك الاستدعاء؛ بينما تظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب تأتي من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` (قناة خادم) لأهداف التسليم؛ تُرفض المعرّفات الرقمية المجردة.
- تكون الأسماء المختصرة للخوادم بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). ويفضل استخدام معرّفات الخوادم.
- يتم تجاهل الرسائل التي يكتبها bot افتراضيًا. يفعّل `allowBots: true` هذه الرسائل؛ واستخدم `allowBots: "mentions"` لقبول رسائل bot التي تذكر bot فقط (مع استمرار تصفية الرسائل الخاصة به).
- يقوم `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) بإسقاط الرسائل التي تذكر مستخدمًا أو دورًا آخر ولكن ليس bot (باستثناء @everyone/@here).
- يقوم `maxLinesPerMessage` (الافتراضي 17) بتقسيم الرسائل الطويلة عموديًا حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`، بالإضافة إلى التسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي عند عدم النشاط بالساعات (`0` يعطّل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصلب للعمر بالساعات (`0` يعطّل)
  - `spawnSubagentSessions`: مفتاح اشتراك اختياري لإنشاء/ربط السلاسل تلقائيًا لـ `sessions_spawn({ thread: true })`
- تقوم إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` بإعداد عمليات ربط ACP الدائمة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات Discord components v2.
- يفعّل `channels.discord.voice` محادثات القنوات الصوتية في Discord مع الانضمام التلقائي الاختياري + تجاوزات TTS.
- يتم تمرير `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (الافتراضيتان `true` و`24`).
- يحاول OpenClaw أيضًا استعادة استقبال الصوت عبر مغادرة جلسة صوتية وإعادة الانضمام إليها بعد تكرار حالات فشل فك التشفير.
- يُعد `channels.discord.streaming` مفتاح وضع البث المعتمد. ويتم ترحيل `streamMode` القديم وقيم `streaming` المنطقية تلقائيًا.
- يربط `channels.discord.autoPresence` توفر وقت التشغيل بحالة bot (healthy => online، وdegraded => idle، وexhausted => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تمكين مطابقة الاسم/الوسم القابل للتغيير (وضع توافق اضطراري).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية في Discord وتفويض المعتمِدين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في وضع auto، يتم تفعيل موافقات exec عندما يمكن حلّ المعتمِدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. يحتاط إلى `commands.ownerAllowFrom` عند الحذف.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفه لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (substring أو regex).
  - `target`: المكان الذي تُرسل إليه طلبات الموافقة. `"dm"` (الافتراضي) يرسلها إلى الرسائل الخاصة للمعتمِدين، و`"channel"` يرسلها إلى القناة الأصلية، و`"both"` يرسلها إلى كليهما. عندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل المعتمِدين الذين تم حلّهم.
  - `cleanupAfterResolve`: عندما تكون `true`، يحذف رسائل الموافقة الخاصة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعلات:** `off` (لا شيء)، و`own` (رسائل bot، الافتراضي)، و`all` (جميع الرسائل)، و`allowlist` (من `guilds.<id>.users` على جميع الرسائل).

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
- كما أن SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- احتياطات env: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تمكين مطابقة principal للبريد الإلكتروني القابل للتغيير (وضع توافق اضطراري).

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
          systemPrompt: "إجابات قصيرة فقط.",
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
        nativeTransport: true, // استخدام واجهة البث الأصلية في Slack عندما يكون mode=partial
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

- يتطلب **وضع Socket** كلاً من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كاحتياط env للحساب الافتراضي).
- يتطلب **وضع HTTP** وجود `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken`
  سلاسل نصية صريحة أو عناصر SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل بيانات اعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus` و، في وضع HTTP،
  `signingSecretStatus`. وتعني `configured_unavailable` أن الحساب
  مُعدّ عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن
  من حل قيمة السر.
- يحظر `configWrites: false` كتابات الإعدادات التي تبدأ من Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- يُعد `channels.slack.streaming.mode` مفتاح وضع البث المعتمد في Slack. ويتحكم `channels.slack.streaming.nativeTransport` في وسيلة النقل الأصلية للبث في Slack. ويتم ترحيل قيم `streamMode` القديمة، وقيم `streaming` المنطقية، وقيم `nativeStreaming` تلقائيًا.
- استخدم `user:<id>` (رسالة خاصة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعلات:** `off` و`own` (الافتراضي) و`all` و`allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** تكون `thread.historyScope` لكل سلسلة على حدة (الافتراضي) أو مشتركة على مستوى القناة. وتقوم `thread.inheritParent` بنسخ سجل القناة الأصلية إلى السلاسل الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة السلسلة بأسلوب المساعد في Slack "is typing..." هدف سلسلة للرد. تبقى الرسائل الخاصة ذات المستوى الأعلى خارج السلسلة افتراضيًا، لذا تستخدم `typingReaction` أو التسليم العادي بدلًا من المعاينة بأسلوب السلسلة.
- تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم تزيله عند الاكتمال. استخدم shortcode لرمز تعبيري في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية في Slack وتفويض المعتمِدين. المخطط نفسه كما في Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | الملاحظات |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + عرض التفاعلات |
| messages     | مفعّل | القراءة/الإرسال/التحرير/الحذف |
| pins         | مفعّل | التثبيت/إلغاء التثبيت/العرض |
| memberInfo   | مفعّل | معلومات العضو |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة |

### Mattermost

يأتي Mattermost كـ Plugin: `openclaw plugins install @openclaw/mattermost`.

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
        // عنوان URL صريح اختياري لعمليات النشر عبر reverse-proxy/العلنية
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

أوضاع الدردشة: `oncall` (الرد عند @-mention، الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تمكين الأوامر الأصلية في Mattermost:

- يجب أن يكون `commands.callbackPath` مسارًا (على سبيل المثال `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يشير `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلاً للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات الشرطة المائلة الأصلية باستخدام الرموز المميزة الخاصة بكل أمر والتي
  يعيدها Mattermost أثناء تسجيل أوامر الشرطة المائلة. إذا فشل التسجيل أو لم يتم
  تنشيط أي أوامر، فسيرفض OpenClaw الاستدعاءات برسالة
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفات الاستدعاء الخاصة/الداخلية/ضمن tailnet، قد يتطلب Mattermost
  أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL الكاملة.
- `channels.mattermost.configWrites`: السماح أو المنع لكتابات الإعدادات التي تبدأ من Mattermost.
- `channels.mattermost.requireMention`: طلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز تقييد الإشارة لكل قناة (`"*"` للقيمة الافتراضية).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // ربط اختياري بالحساب
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

- `channels.signal.account`: يثبّت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو المنع لكتابات الإعدادات التي تبدأ من Signal.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

### BlueBubbles

يُعد BlueBubbles المسار الموصى به لـ iMessage (مدعومًا بـ Plugin، ويُعد تحت `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl وpassword وwebhookPath وعناصر التحكم في المجموعات والإجراءات المتقدمة:
      // راجع /channels/bluebubbles
    },
  },
}
```

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.bluebubbles` و`channels.bluebubbles.dmPolicy`.
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم مقبض BlueBubbles أو سلسلة الهدف (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).
- تم توثيق إعداد قناة BlueBubbles الكامل في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يقوم OpenClaw بتشغيل `imsg rpc` (JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- يُفضّل استخدام أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لعرض الدردشات.
- يمكن أن يشير `cliPath` إلى wrapper لـ SSH؛ واضبط `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP التحقق الصارم من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف relay موجود بالفعل في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو المنع لكتابات الإعدادات التي تبدأ من iMessage.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم handle مُطبَّعًا أو هدف دردشة صريحًا (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings).

<Accordion title="مثال على iMessage SSH wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

تتم إدارة Matrix عبر Plugin وتُعد تحت `channels.matrix`.

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

- يستخدم تفويض الرمز المميز `accessToken`؛ ويستخدم تفويض كلمة المرور `userId` + `password`.
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. ويمكن للحسابات المسماة تجاوزه عبر `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. ويُعد `proxy` وهذا الاشتراك في الشبكة عنصرَي تحكم مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في الإعدادات متعددة الحسابات.
- تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذا يتم تجاهل الغرف المدعوة ودعوات الرسائل الخاصة الجديدة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض المعتمِدين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في وضع auto، يتم تفعيل موافقات exec عندما يمكن حلّ المعتمِدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفه لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (substring أو regex).
  - `target`: المكان الذي تُرسل إليه طلبات الموافقة. `"dm"` (الافتراضي) أو `"channel"` (الغرفة الأصلية) أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع الرسائل الخاصة في Matrix داخل الجلسات: يشارك `per-user` (الافتراضي) حسب peer الموجّه، بينما يعزل `per-room` كل غرفة رسائل خاصة.
- تستخدم فحوصات الحالة في Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها المستخدمة في حركة وقت التشغيل.
- تم توثيق إعداد Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

تتم إدارة Microsoft Teams عبر Plugin وتُعد تحت `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId وappPassword وtenantId وwebhook وسياسات الفريق/القناة:
      // راجع /channels/msteams
    },
  },
}
```

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.msteams` و`channels.msteams.configWrites`.
- تم توثيق إعداد Teams الكامل (بيانات الاعتماد، وwebhook، وسياسة الرسائل الخاصة/المجموعات، والتجاوزات لكل فريق/قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

تتم إدارة IRC عبر Plugin وتُعد تحت `channels.irc`.

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
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدّ.
- تم توثيق إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/تقييد الإشارات) في [IRC](/ar/channels/irc).

### متعدد الحسابات (جميع القنوات)

شغّل حسابات متعددة لكل قناة (لكل منها `accountId` خاص به):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "البوت الأساسي",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "بوت التنبيهات",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- يتم استخدام `default` عند حذف `accountId` (في CLI + التوجيه).
- لا تنطبق رموز env المميزة إلا على الحساب **default**.
- تُطبَّق إعدادات القناة الأساسية على جميع الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو onboarding القناة) بينما لا تزال على إعداد قناة أحادي الحساب على المستوى الأعلى، فإن OpenClaw يرقّي أولًا القيم أحادية الحساب على المستوى الأعلى والمقيّدة بنطاق الحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف named/default موجود مطابق.
- تستمر عمليات الربط الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتظل عمليات الربط المقيّدة بالحساب اختيارية.
- يقوم `openclaw doctor --fix` أيضًا بإصلاح الأشكال المختلطة عبر نقل القيم أحادية الحساب على المستوى الأعلى والمقيّدة بنطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف named/default موجود مطابق.

### قنوات Plugin أخرى

تُعد العديد من قنوات Plugin على شكل `channels.<id>` ويتم توثيقها في صفحات القنوات المخصصة لها (على سبيل المثال Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### تقييد الإشارات في الدردشة الجماعية

تكون القيمة الافتراضية لرسائل المجموعات هي **طلب الإشارة** (إشارة metadata أو أنماط regex آمنة). وينطبق ذلك على دردشات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

**أنواع الإشارات:**

- **إشارات metadata**: إشارات @ الأصلية الخاصة بالمنصة. يتم تجاهلها في وضع الدردشة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يتم فرض تقييد الإشارات إلا عندما يكون الاكتشاف ممكنًا (إشارات أصلية أو وجود نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` القيمة الافتراضية العامة. ويمكن للقنوات تجاوزها عبر `channels.<channel>.historyLimit` (أو لكل حساب). اضبط القيمة `0` للتعطيل.

#### حدود سجل الرسائل الخاصة

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

الحلّ: تجاوز لكل رسالة خاصة → افتراضي الموفّر → بلا حد (يتم الاحتفاظ بكل شيء).

المدعوم: `telegram` و`whatsapp` و`discord` و`slack` و`signal` و`imessage` و`msteams`.

#### وضع الدردشة الذاتية

ضمّن رقمك الخاص في `allowFrom` لتمكين وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ويرد فقط على أنماط النص):

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
    native: "auto", // تسجيل الأوامر الأصلية عند الدعم
    nativeSkills: "auto", // تسجيل أوامر Skills الأصلية عند الدعم
    text: true, // تحليل أوامر /commands في رسائل الدردشة
    bash: false, // السماح بـ ! (اسم مستعار: /bash)
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

- تهيّئ هذه الكتلة أسطح الأوامر. للاطلاع على كتالوج الأوامر المضمنة + المجمعة الحالي، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. يتم توثيق الأوامر المملوكة للقنوات/Plugins مثل QQ Bot `/bot-ping` و`/bot-help` و`/bot-logs`، وLINE `/card`، وdevice-pair `/pair`، وmemory `/dreaming`، وphone-control `/phone`، وTalk `/voice` في صفحات القنوات/Plugins الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** مع بادئة `/`.
- يقوم `native: "auto"` بتشغيل الأوامر الأصلية لـ Discord/Telegram، ويُبقي Slack معطلًا.
- يقوم `nativeSkills: "auto"` بتشغيل أوامر Skills الأصلية لـ Discord/Telegram، ويُبقي Slack معطلًا.
- تجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى إزالة الأوامر المسجلة سابقًا.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة bot في Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لـ shell المضيف. ويتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (قراءة/كتابة `openclaw.json`). وبالنسبة إلى عملاء `chat.send` في gateway، فإن كتابات `/config set|unset` الدائمة تتطلب أيضًا `operator.admin`؛ بينما يظل `/config show` للقراءة فقط متاحًا لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP الذي يديره OpenClaw تحت `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugins وتثبيتها وعناصر التحكم في التمكين/التعطيل.
- يتحكم `channels.<provider>.configWrites` في تغييرات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في الكتابات التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل gateway. الافتراضي: `true`.
- تمثل `ownerAllowFrom` قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- تقوم `ownerDisplay: "hash"` بعمل hash لمعرّفات المالك في system prompt. اضبط `ownerDisplaySecret` للتحكم في عملية hash.
- تكون `allowFrom` لكل موفّر. وعند ضبطها، تصبح **مصدر التفويض الوحيد** (يتم تجاهل قوائم السماح/الاقتران الخاصة بالقناة و`useAccessGroups`).
- تسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا تكون `allowFrom` مضبوطة.
- خريطة وثائق الأوامر:
  - الكتالوج المضمن + المجمّع: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر البطاقة في LINE: [LINE](/ar/channels/line)
  - dreaming الخاصة بالذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## الإعدادات الافتراضية للوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر المستودع الاختياري الذي يظهر في سطر Runtime في system prompt. إذا لم يتم تعيينه، يكتشفه OpenClaw تلقائيًا عبر الصعود من مساحة العمل إلى الأعلى.

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
      { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية
      { id: "locked-down", skills: [] }, // بدون Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` للوراثة من الإعدادات الافتراضية.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- تكون قائمة `agents.list[].skills` غير الفارغة هي المجموعة النهائية لذلك الوكيل؛ وهي
  لا تُدمج مع الإعدادات الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap في مساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت حقن ملفات bootstrap الخاصة بمساحة العمل في system prompt. الافتراضي: `"always"`.

- `"continuation-skip"`: تتجاوز أدوار الاستمرار الآمنة (بعد اكتمال استجابة من assistant) إعادة حقن bootstrap لمساحة العمل، مما يقلل حجم prompt. بينما تعيد تشغيلات Heartbeat ومحاولات ما بعد Compaction بناء السياق.

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

الحد الأقصى لإجمالي عدد الأحرف المحقونة عبر جميع ملفات bootstrap الخاصة بمساحة العمل. الافتراضي: `60000`.

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
- `"always"`: احقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يحتوي OpenClaw على عدة ميزانيات مرتفعة الحجم لـ prompt/السياق، وهي
مقسّمة عمدًا حسب النظام الفرعي بدلًا من تدفقها كلها عبر مفتاح
عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن bootstrap العادي لمساحة العمل.
- `agents.defaults.startupContext.*`:
  المقدمة الافتتاحية لمرة واحدة في `/new` و`/reset`، بما في ذلك أحدث ملفات
  `memory/*.md` اليومية.
- `skills.limits.*`:
  قائمة Skills المضغوطة المحقونة في system prompt.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة مملوكة لوقت التشغيل.
- `memory.qmd.limits.*`:
  تحجيم مقتطفات البحث في الذاكرة المفهرسة وحقنها.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى
ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في المقدمة الافتتاحية المحقونة في الدور الأول عند تشغيل `/new` و`/reset` المجردين.

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

الإعدادات الافتراضية المشتركة لأسطح سياق وقت التشغيل المحدودة.

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
  بيانات metadata الخاصة بالاقتطاع وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية في `memory_get` عندما يتم
  حذف `lines`.
- `toolResultMaxChars`: الحد الحي لنتائج الأدوات المستخدم للنتائج المحفوظة
  واستعادة الفائض.
- `postCompactionMaxChars`: الحد الأقصى لمقتطف `AGENTS.md` المستخدم أثناء حقن
  التحديث بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل لمفاتيح `contextLimits` المشتركة. الحقول المحذوفة ترث
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

الحد الأقصى العام لقائمة Skills المضغوطة المحقونة في system prompt. وهذا
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

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة ضمن كتل الصور في السجل/الأدوات قبل استدعاءات الموفّر.
الافتراضي: `1200`.

تؤدي القيم الأقل عادةً إلى تقليل استخدام رموز الرؤية المميزة وحجم حمولة الطلب في التشغيلات الثقيلة باللقطات.
بينما تحافظ القيم الأعلى على مزيد من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق system prompt (وليس للطوابع الزمنية للرسائل). وتحتاط إلى المنطقة الزمنية الخاصة بالمضيف.

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
      params: { cacheRetention: "long" }, // معلمات الموفّر الافتراضية العامة
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
  - يضبط الشكل النصي النموذج الأساسي فقط.
  - يضبط شكل الكائن النموذج الأساسي بالإضافة إلى نماذج failover مرتبة.
- `imageModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كإعداد نموذج الرؤية الخاص به.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال صورة.
- `imageGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية إنشاء الصور المشتركة وأي سطح أداة/Plugin مستقبلي ينشئ صورًا.
  - القيم المعتادة: `google/gemini-3.1-flash-image-preview` لإنشاء الصور الأصلي في Gemini، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images.
  - إذا حددت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا تفويض المزود/مفتاح API المطابق (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`).
  - إذا تم حذفه، فلا يزال بإمكان `image_generate` استنتاج افتراضي مزود مدعوم بالتفويض. وهو يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزودي إنشاء الصور المسجلين بترتيب معرّف المزوّد.
- `musicGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية إنشاء الموسيقى المشتركة وأداة `music_generate` المضمنة.
  - القيم المعتادة: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.5+`.
  - إذا تم حذفه، فلا يزال بإمكان `music_generate` استنتاج افتراضي مزود مدعوم بالتفويض. وهو يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزودي إنشاء الموسيقى المسجلين بترتيب معرّف المزوّد.
  - إذا حددت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا تفويض المزود/مفتاح API المطابق.
- `videoGenerationModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية إنشاء الفيديو المشتركة وأداة `video_generate` المضمنة.
  - القيم المعتادة: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا تم حذفه، فلا يزال بإمكان `video_generate` استنتاج افتراضي مزود مدعوم بالتفويض. وهو يحاول أولًا المزوّد الافتراضي الحالي، ثم بقية مزودي إنشاء الفيديو المسجلين بترتيب معرّف المزوّد.
  - إذا حددت مزودًا/نموذجًا مباشرةً، فاضبط أيضًا تفويض المزود/مفتاح API المطابق.
  - يدعم موفّر إنشاء الفيديو Qwen المجمّع حتى 1 فيديو خرج، و1 صورة إدخال، و4 فيديوهات إدخال، ومدة 10 ثوانٍ، وخيارات `size` و`aspectRatio` و`resolution` و`audio` و`watermark` على مستوى المزوّد.
- `pdfModel`: يقبل إما سلسلة نصية (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا تم حذفه، فإن أداة PDF تحتاط إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: الحد الافتراضي لحجم PDF لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي يأخذها وضع الاحتياط للاستخراج في أداة `pdf` في الاعتبار.
- `verboseDefault`: مستوى التفاصيل الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى الخرج المرتفع الافتراضي للوكلاء. القيم: `"off"` و`"on"` و`"ask"` و`"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.4`). إذا حذفت المزوّد، فإن OpenClaw يحاول أولًا اسمًا مستعارًا، ثم تطابقًا فريدًا لمزوّد مُعدّ لهذا المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المُعدّ (سلوك توافق قديم، لذا يُفضل استخدام `provider/model` الصريح). وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المُعدّ، فإن OpenClaw يعود إلى أول مزود/نموذج مُعدّ بدلًا من إظهار قيمة افتراضية قديمة لمزوّد تمت إزالته.
- `models`: كتالوج النماذج المُعدّ وقائمة السماح لأمر `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصار) و`params` (خاصة بالمزوّد، مثل `temperature` و`maxTokens` و`cacheRetention` و`context1m`).
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات قائمة السماح الحالية ما لم تمرر `--replace`.
  - تقوم تدفقات الإعداد/Onboarding المقيّدة بالمزوّد بدمج نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين الآخرين المُعدين وغير المرتبطين.
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أولوية دمج `params` (في الإعدادات): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم يتجاوز `agents.list[].params` (المطابق لمعرّف الوكيل) حسب المفتاح. راجع [تخزين prompt مؤقتًا](/ar/reference/prompt-caching) للتفاصيل.
- `embeddedHarness`: سياسة وقت التشغيل المضمن منخفض المستوى الافتراضية للوكيل. استخدم `runtime: "auto"` للسماح لـ harness المسجلة في Plugins بالمطالبة بالنماذج المدعومة، أو `runtime: "pi"` لفرض harness PI المضمنة، أو معرّف harness مسجل مثل `runtime: "codex"`. اضبط `fallback: "none"` لتعطيل الاحتياط التلقائي إلى PI.
- كُتّاب الإعدادات الذين يعدّلون هذه الحقول (على سبيل المثال `/models set` و`/models set-image` وأوامر إضافة/إزالة الاحتياط) يحفظون الشكل الكائني المعياري ويحافظون على قوائم الاحتياط الحالية متى أمكن.
- `maxConcurrent`: الحد الأقصى لتشغيلات الوكيل المتوازية عبر الجلسات (مع استمرار تسلسل كل جلسة). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في أي منفّذ منخفض المستوى يشغّل أدوار الوكيل المضمنة.
يجب أن تُبقي معظم عمليات النشر الإعداد الافتراضي `{ runtime: "auto", fallback: "pi" }`.
استخدمه عندما يوفّر Plugin موثوق harness أصلية، مثل
Codex app-server harness المجمعة.

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

- `runtime`: `"auto"` أو `"pi"` أو معرّف harness Plugin مسجل. يسجل Plugin Codex المجمّع القيمة `codex`.
- `fallback`: `"pi"` أو `"none"`. تُبقي `"pi"` harness PI المضمنة كاحتياط للتوافق عندما لا يتم اختيار أي harness من Plugin. وتجعل `"none"` اختيار harness Plugin مفقودة أو غير مدعومة يفشل بدلًا من استخدام PI بصمت. وتظهر أعطال harness Plugin المحددة دائمًا بشكل مباشر.
- تجاوزات البيئة: تقوم `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` بتجاوز `runtime`؛ كما أن `OPENCLAW_AGENT_HARNESS_FALLBACK=none` يعطّل الاحتياط إلى PI لتلك العملية.
- لعمليات النشر الخاصة بـ Codex فقط، اضبط `model: "codex/gpt-5.4"` و`embeddedHarness.runtime: "codex"` و`embeddedHarness.fallback: "none"`.
- يتحكم هذا فقط في chat harness المضمنة. أما إنشاء الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS فلا تزال تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمنة** (تُطبّق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

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

تتغلب الأسماء المستعارة التي أعددتها دائمًا على الإعدادات الافتراضية.

تقوم نماذج Z.AI GLM-4.x بتمكين وضع التفكير تلقائيًا ما لم تضبط `--thinking off` أو تعرّف `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
تفعّل نماذج Z.AI القيمة `tool_stream` افتراضيًا لبث استدعاءات الأدوات. اضبط `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيلها.
تستخدم نماذج Anthropic Claude 4.6 القيمة الافتراضية `adaptive` للتفكير عندما لا يتم تعيين مستوى تفكير صريح.

### `agents.defaults.cliBackends`

واجهات CLI اختيارية لتشغيلات الاحتياط النصية فقط (من دون استدعاءات أدوات). مفيدة كنسخة احتياطية عندما تفشل مزودات API.

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

- واجهات CLI الخلفية موجهة للنص أولًا؛ وتكون الأدوات دائمًا معطلة.
- تكون الجلسات مدعومة عند تعيين `sessionArg`.
- تكون تمريرات الصور مدعومة عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدل system prompt الكاملة التي يجمعها OpenClaw بسلسلة ثابتة. يتم ضبطها على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). تكون القيم الخاصة بكل وكيل ذات أولوية أعلى؛ ويتم تجاهل القيم الفارغة أو التي تحتوي على مسافات فقط. وهي مفيدة لتجارب prompt المضبوطة.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "أنت مساعد مفيد.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

طبقات Prompt مستقلة عن المزوّد تُطبق حسب عائلة النموذج. تتلقى معرّفات نماذج GPT-5 سلوك العقد المشترك عبر المزوّدين؛ بينما يتحكم `personality` فقط في طبقة أسلوب التفاعل الودود.

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

- يقوم `"friendly"` (الافتراضي) و`"on"` بتمكين طبقة أسلوب التفاعل الودود.
- يقوم `"off"` بتعطيل الطبقة الودودة فقط؛ بينما يبقى عقد سلوك GPT-5 الموسوم مفعّلًا.
- لا تزال القيمة القديمة `plugins.entries.openai.config.personality` تُقرأ عندما لا يكون هذا الإعداد المشترك معيّنًا.

### `agents.defaults.heartbeat`

تشغيلات Heartbeat الدورية.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m يعطل
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // الافتراضي: true؛ false يحذف قسم Heartbeat من system prompt
        lightContext: false, // الافتراضي: false؛ true يُبقي فقط HEARTBEAT.md من ملفات bootstrap لمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ true يشغّل كل Heartbeat في جلسة جديدة (من دون سجل المحادثة)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (الافتراضي) | block
        target: "none", // الافتراضي: none | الخيارات: last | whatsapp | telegram | discord | ...
        prompt: "اقرأ HEARTBEAT.md إذا كان موجودًا...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (تفويض مفتاح API) أو `1h` (تفويض OAuth). اضبطها على `0m` للتعطيل.
- `includeSystemPromptSection`: عند ضبطها على false، تحذف قسم Heartbeat من system prompt وتتجاوز حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند ضبطها على true، تمنع حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `timeoutSeconds`: الحد الأقصى للوقت بالثواني المسموح لدور وكيل Heartbeat قبل إلغائه. اتركه غير معيّن لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/الرسائل الخاصة. تسمح `allow` (الافتراضي) بالتسليم إلى الهدف المباشر. وتمنع `block` التسليم إلى الهدف المباشر وتصدر `reason=dm-blocked`.
- `lightContext`: عند ضبطها على true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap الخاصة بمساحة العمل.
- `isolatedSession`: عند ضبطها على true، تعمل كل Heartbeat في جلسة جديدة من دون أي سجل محادثة سابق. وهو نمط العزل نفسه في Cron `sessionTarget: "isolated"`. ويقلل تكلفة الرموز المميزة لكل Heartbeat من نحو ~100K إلى ~2-5K رموز.
- لكل وكيل: اضبط `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، **تشغّل تلك الوكلاء فقط** Heartbeats.
- تشغّل Heartbeats أدوار وكيل كاملة — والفواصل الأقصر تحرق مزيدًا من الرموز المميزة.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // معرّف Plugin مزود Compaction مسجل (اختياري)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "احتفظ بمعرّفات النشر، ومعرّفات التذاكر، وأزواج host:port كما هي تمامًا.", // تُستخدم عندما تكون identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] يعطل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري للنموذج خاص بـ Compaction فقط
        notifyUser: true, // إرسال إشعارات مختصرة عند بدء Compaction واكتمالها (الافتراضي: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "الجلسة تقترب من Compaction. خزّن الذكريات الدائمة الآن.",
          prompt: "اكتب أي ملاحظات دائمة إلى memory/YYYY-MM-DD.md؛ ورد بالرمز الصامت الدقيق NO_REPLY إذا لم يكن هناك ما يُخزَّن.",
        },
      },
    },
  },
}
```

- `mode`: `default` أو `safeguard` (تلخيص مقسّم إلى أجزاء للتواريخ الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزود Compaction مسجل. عند ضبطه، يتم استدعاء `summarize()` الخاصة بالمزوّد بدلًا من التلخيص المضمن المعتمد على LLM. ويعود إلى المضمن عند الفشل. يؤدي تعيين مزود إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى للثواني المسموح بها لعملية Compaction واحدة قبل أن يقوم OpenClaw بإلغائها. الافتراضي: `900`.
- `identifierPolicy`: `strict` (الافتراضي) أو `off` أو `custom`. تقوم `strict` بإضافة إرشادات مضمنة للاحتفاظ بالمعرّفات المعتمة قبل تلخيص Compaction.
- `identifierInstructions`: نص اختياري مخصص للحفاظ على المعرّفات يُستخدم عندما تكون `identifierPolicy=custom`.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة حقنها بعد Compaction. القيمة الافتراضية هي `["Session Startup", "Red Lines"]`؛ واضبطها على `[]` لتعطيل إعادة الحقن. وعندما لا تكون معيّنة أو عندما تُعيَّن صراحةً إلى هذا الزوج الافتراضي، تُقبل العناوين الأقدم `Every Session`/`Safety` أيضًا كاحتياط قديم.
- `model`: تجاوز اختياري `provider/model-id` لتلخيص Compaction فقط. استخدم هذا عندما يجب أن تحتفظ الجلسة الرئيسية بنموذج واحد بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم التعيين، تستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عندما تكون `true`، يرسل إشعارات مختصرة إلى المستخدم عند بدء Compaction وعند اكتمالها (مثل "Compacting context..." و"Compaction complete"). تكون معطلة افتراضيًا لإبقاء Compaction صامتة.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائية لتخزين الذكريات الدائمة. يتم تجاوزه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقصّ **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرسالها إلى LLM. ولا يقوم **بتعديل** سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // مدة (ms/s/m/h)، وحدة الافتراضي: الدقائق
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[تم مسح محتوى نتيجة الأداة القديمة]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="سلوك وضع cache-ttl">

- يؤدي `mode: "cache-ttl"` إلى تمكين عمليات القص.
- تتحكم `ttl` في عدد المرات التي يمكن أن يعمل فيها القص مرة أخرى (بعد آخر لمسة لذاكرة التخزين المؤقت).
- تقوم عملية القص أولًا بقص نتائج الأدوات الكبيرة بشكل مرن، ثم تمسح نتائج الأدوات الأقدم بالكامل إذا لزم الأمر.

يحافظ **القص المرن** على البداية + النهاية ويُدرج `...` في الوسط.

يستبدل **المسح الكامل** نتيجة الأداة بالكامل بالعنصر النائب.

ملاحظات:

- لا يتم قص/مسح كتل الصور أبدًا.
- تعتمد النسب على عدد الأحرف (تقريبيًا)، وليس على عدد الرموز الدقيق.
- إذا كان عدد رسائل assistant أقل من `keepLastAssistants`، يتم تجاوز القص.

</Accordion>

راجع [قص الجلسة](/ar/concepts/session-pruning) للحصول على تفاصيل السلوك.

### البث بالمقاطع

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

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحةً لتمكين الردود بالمقاطع.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات كل حساب). تستخدم Signal/Slack/Discord/Google Chat القيمة الافتراضية `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين ردود المقاطع. وتعني `natural` = من 800 إلى 2500 مللي ثانية. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [البث](/ar/concepts/streaming) للحصول على تفاصيل السلوك + التقسيم إلى مقاطع.

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

- الإعدادات الافتراضية: `instant` للدردشات المباشرة/الإشارات، و`message` للدردشات الجماعية غير المشار فيها.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [مؤشرات الكتابة](/ar/concepts/typing-indicators).

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
- `ssh`: وقت تشغيل بعيد عام مدعوم عبر SSH
- `openshell`: وقت تشغيل OpenShell

عند تحديد `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**إعداد الواجهة الخلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: جذر بعيد مطلق يُستخدم لمساحات العمل حسب النطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة في وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح سياسة مفتاح المضيف في OpenSSH

**أولوية تفويض SSH:**

- تتغلب `identityData` على `identityFile`
- تتغلب `certificateData` على `certificateFile`
- تتغلب `knownHostsData` على `knownHostsFile`
- يتم حل قيم `*Data` المدعومة بـ SecretRef من اللقطة النشطة لوقت تشغيل الأسرار قبل بدء جلسة sandbox

**سلوك الواجهة الخلفية SSH:**

- تزرع مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم تُبقي مساحة عمل SSH البعيدة هي المرجع المعياري
- توجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا تزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيًا
- لا تدعم حاويات متصفح sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل sandbox حسب النطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل sandbox في `/workspace`، مع تركيب مساحة عمل الوكيل للقراءة فقط في `/agent`
- `rw`: تركيب مساحة عمل الوكيل للقراءة/الكتابة في `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**إعداد Plugin الخاصة بـ OpenShell:**

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

- `mirror`: يزرع النسخة البعيدة من المحلية قبل exec، ثم يزامنها مرة أخرى بعد exec؛ وتبقى مساحة العمل المحلية هي المرجع المعياري
- `remote`: يزرع النسخة البعيدة مرة واحدة عند إنشاء sandbox، ثم يُبقي مساحة العمل البعيدة هي المرجع المعياري

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw تلقائيًا إلى sandbox بعد خطوة الزرع.
يكون النقل عبر SSH إلى OpenShell sandbox، لكن Plugin تمتلك دورة حياة sandbox وخيار المزامنة mirror.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى خروج شبكة، وجذر قابل للكتابة، ومستخدم root.

**تستخدم الحاويات القيمة الافتراضية `network: "none"`** — اضبطها على `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. كما يتم حظر `"container:<id>"` افتراضيًا ما لم تضبط صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (حل طارئ).

يتم تهيئة **المرفقات الواردة** في `media/inbound/*` داخل مساحة العمل النشطة.

تقوم **`docker.binds`** بتركيب أدلة مضيف إضافية؛ ويتم دمج التركيبات العامة وتركيبات كل وكيل.

**المتصفح المعزول** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. ويتم حقن عنوان noVNC في system prompt. ولا يتطلب `browser.enabled` في `openclaw.json`.
يستخدم وصول المراقبة عبر noVNC تفويض VNC افتراضيًا ويصدر OpenClaw عنوان URL قصير العمر مع رمز مميز (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- تمنع `allowHostControl: false` (الافتراضي) الجلسات المعزولة من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). اضبطها على `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- تقيّد `cdpSourceRange` اختياريًا إدخال CDP عند حافة الحاوية إلى نطاق CIDR (على سبيل المثال `172.21.0.1/32`).
- تقوم `sandbox.browser.binds` بتركيب أدلة مضيف إضافية داخل حاوية متصفح sandbox فقط. وعند تعيينها (بما في ذلك `[]`)، فإنها تستبدل `docker.binds` بالنسبة إلى حاوية المتصفح.
- يتم تعريف الإعدادات الافتراضية للتشغيل في `scripts/sandbox-browser-entrypoint.sh` وقد تم ضبطها لمضيفات الحاويات:
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
  - `--disable-extensions` (مفعلة افتراضيًا)
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعلة افتراضيًا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تمكين الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ اضبطها على `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` و`--disable-setuid-sandbox` عند تمكين `noSandbox`.
  - تمثل القيم الافتراضية خط الأساس لصورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير إعدادات الحاوية الافتراضية.

</Accordion>

تقتصر Browser sandboxing و`sandbox.docker.binds` على Docker فقط.

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
        name: "الوكيل الرئيسي",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // أو { primary, fallbacks }
        thinkingDefault: "high", // تجاوز مستوى التفكير لكل وكيل
        reasoningDefault: "on", // تجاوز إظهار الاستدلال لكل وكيل
        fastModeDefault: false, // تجاوز الوضع السريع لكل وكيل
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // يتجاوز مفاتيح params المطابقة في defaults.models
        skills: ["docs-search"], // يستبدل agents.defaults.skills عند التعيين
        identity: {
          name: "Samantha",
          theme: "كسلان مفيد",
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
- `default`: عند تعيين عدة قيم، تفوز الأولى (مع تسجيل تحذير). وإذا لم يتم تعيين أي قيمة، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: يتجاوز الشكل النصي `primary` فقط؛ ويتجاوز شكل الكائن `{ primary, fallbacks }` الاثنين معًا (`[]` تعطل الاحتياطات العامة). وتظل وظائف Cron التي تتجاوز `primary` فقط ترث الاحتياطات الافتراضية ما لم تضبط `fallbacks: []`.
- `params`: معلمات دفق لكل وكيل يتم دمجها فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا لتجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النماذج بالكامل.
- `skills`: قائمة سماح اختيارية لـ Skills لكل وكيل. إذا حُذفت، يرث الوكيل `agents.defaults.skills` عند تعيينها؛ وتستبدل القائمة الصريحة الإعدادات الافتراضية بدلًا من دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى التفكير الافتراضي الاختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يتم تعيين تجاوز لكل رسالة أو جلسة.
- `reasoningDefault`: إظهار الاستدلال الافتراضي الاختياري لكل وكيل (`on | off | stream`). ويُطبَّق عندما لا يتم تعيين تجاوز للاستدلال لكل رسالة أو جلسة.
- `fastModeDefault`: الافتراضي الاختياري للوضع السريع لكل وكيل (`true | false`). ويُطبَّق عندما لا يتم تعيين تجاوز للوضع السريع لكل رسالة أو جلسة.
- `embeddedHarness`: تجاوز اختياري لسياسة harness منخفضة المستوى لكل وكيل. استخدم `{ runtime: "codex", fallback: "none" }` لجعل وكيل واحد خاصًا بـ Codex فقط بينما تحتفظ الوكلاء الآخرون باحتياط PI الافتراضي.
- `runtime`: واصف اختياري لوقت التشغيل لكل وكيل. استخدم `type: "acp"` مع إعدادات `runtime.acp` الافتراضية (`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يكون الوكيل افتراضيًا إلى جلسات ACP harness.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL بـ `http(s)`، أو URI بـ `data:`.
- تستنتج `identity` القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء لـ `sessions_spawn` (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حاجز وراثة sandbox: إذا كانت جلسة الطالب معزولة، فإن `sessions_spawn` ترفض الأهداف التي ستعمل من دون sandbox.
- `subagents.requireAgentId`: عند ضبطها على true، تحظر استدعاءات `sessions_spawn` التي تُهمل `agentId` (تفرض اختيار profile صريح؛ الافتراضي: false).

---

## التوجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحدة. راجع [Multi-Agent](/ar/concepts/multi-agent).

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

### حقول المطابقة في الربط

- `type` (اختياري): `route` للتوجيه العادي (يؤدي غياب النوع إلى افتراض route)، و`acp` لعمليات ربط محادثات ACP الدائمة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ والحذف = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياري؛ خاص بالقناة)
- `acp` (اختياري؛ فقط لإدخالات `type: "acp"`): `{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة دقيقة، من دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

ضمن كل طبقة، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يحل OpenClaw المطابقة حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب طبقات ربط route أعلاه.

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

راجع [Multi-Agent Sandbox & Tools](/ar/tools/multi-agent-sandbox-tools) للحصول على تفاصيل الأولوية.

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
    parentForkMaxTokens: 100000, // تجاوز تفرع السلسلة الأصلية فوق هذا العدد من الرموز (0 يعطل)
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
      idleHours: 24, // الإلغاء التلقائي الافتراضي للتركيز عند عدم النشاط بالساعات (`0` يعطل)
      maxAgeHours: 0, // الحد الأقصى الصلب الافتراضي للعمر بالساعات (`0` يعطل)
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

- **`scope`**: استراتيجية تجميع الجلسات الأساسية في سياقات الدردشة الجماعية.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة داخل سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون المقصود سياقًا مشتركًا).
- **`dmScope`**: كيفية تجميع الرسائل الخاصة.
  - `main`: تشترك جميع الرسائل الخاصة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به لتعدد الحسابات).
- **`identityLinks`**: تعيين المعرّفات المعيارية إلى peers مسبوقة باسم الموفّر لمشاركة الجلسات عبر القنوات.
- **`reset`**: سياسة إعادة التعيين الأساسية. يقوم `daily` بإعادة التعيين عند `atHour` بالتوقيت المحلي؛ ويقوم `idle` بإعادة التعيين بعد `idleMinutes`. وعندما يتم إعداد الاثنين، يفوز الأسبق انتهاءً.
- **`resetByType`**: تجاوزات لكل نوع (`direct` و`group` و`thread`). ويُقبل الاسم القديم `dm` كاسم مستعار لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى المسموح به لـ `totalTokens` في الجلسة الأصلية عند إنشاء جلسة سلسلة متفرعة (الافتراضي `100000`).
  - إذا كانت `totalTokens` في الأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة سلسلة جديدة بدلًا من وراثة سجل الجلسة الأصلية.
  - اضبطها على `0` لتعطيل هذا الحاجز والسماح دائمًا بالتفرع من الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` كحاوية الدردشة المباشرة الرئيسية.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، النطاق: `0`–`5`). تؤدي القيمة `0` إلى تعطيل تسلسل ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel` أو `chatType` (`direct|group|channel`، مع الاسم القديم `dm` كاسم مستعار)، أو `keyPrefix`، أو `rawKeyPrefix`. ويفوز أول رفض.
- **`maintenance`**: عناصر التحكم في تنظيف مخزن الجلسات والاحتفاظ بها.
  - `mode`: تقوم `warn` بإصدار تحذيرات فقط؛ بينما تطبق `enforce` التنظيف.
  - `pruneAfter`: حد العمر الفاصل للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات السجل `*.reset.<timestamp>`. وتكون افتراضيًا مساوية لـ `pruneAfter`؛ اضبطها على `false` للتعطيل.
  - `maxDiskBytes`: ميزانية اختيارية لمساحة قرص دليل الجلسات. وفي وضع `warn` تسجل تحذيرات؛ وفي وضع `enforce` تزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. ويكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: الإعدادات الافتراضية العامة لميزات الجلسات المرتبطة بالسلاسل.
  - `enabled`: مفتاح افتراضي رئيسي (يمكن للموفرين تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: الإلغاء التلقائي الافتراضي للتركيز عند عدم النشاط بالساعات (`0` يعطل؛ ويمكن للموفرين تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصلب الافتراضي للعمر بالساعات (`0` يعطل؛ ويمكن للموفرين تجاوزه)

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
      debounceMs: 2000, // 0 يعطل
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### بادئة الرد

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix` و`channels.<channel>.accounts.<id>.responsePrefix`.

طريقة الحلّ (الأكثر تحديدًا يفوز): الحساب → القناة → العام. تؤدي `""` إلى التعطيل وإيقاف التسلسل. وتشتق `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير | الوصف | المثال |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | اسم النموذج المختصر | `claude-opus-4-6` |
| `{modelFull}`     | معرّف النموذج الكامل | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد | `anthropic` |
| `{thinkingLevel}` | مستوى التفكير الحالي | `high` أو `low` أو `off` |
| `{identity.name}` | اسم هوية الوكيل | (مثل `"auto"`) |

المتغيرات غير حساسة لحالة الأحرف. ويُعد `{think}` اسمًا مستعارًا لـ `{thinkingLevel}`.

### تفاعل التأكيد

- تكون القيمة الافتراضية هي `identity.emoji` الخاصة بالوكيل النشط، وإلا `"👀"`. اضبط `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحلّ: الحساب → القناة → `messages.ackReaction` → الاحتياط إلى الهوية.
- النطاق: `group-mentions` (الافتراضي)، و`group-all`، و`direct`، و`all`.
- تقوم `removeAckAfterReply` بإزالة التأكيد بعد الرد في Slack وDiscord وTelegram.
- تقوم `messages.statusReactions.enabled` بتمكين تفاعلات الحالة الدورية في Slack وDiscord وTelegram.
  وفي Slack وDiscord، يؤدي عدم التعيين إلى إبقاء تفاعلات الحالة مفعلة عندما تكون تفاعلات التأكيد نشطة.
  وفي Telegram، اضبطها صراحةً على `true` لتمكين تفاعلات الحالة الدورية.

### إزالة الاهتزاز للرسائل الواردة

تجمع الرسائل النصية السريعة من المرسل نفسه في دور وكيل واحد. ويتم تفريغ الوسائط/المرفقات فورًا. وتتجاوز أوامر التحكم إزالة الاهتزاز.

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

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن لـ `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعالة.
- يتجاوز `summaryModel` القيمة `agents.defaults.model.primary` للملخص التلقائي.
- تكون `modelOverrides` مفعلة افتراضيًا؛ بينما تكون `modelOverrides.allowProvider` افتراضيًا `false` (اشتراك اختياري).
- تحتاط مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- تتجاوز `openai.baseUrl` نقطة نهاية OpenAI TTS. ويكون ترتيب الحلّ: الإعدادات، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما تشير `openai.baseUrl` إلى نقطة نهاية غير تابعة لـ OpenAI، يعاملها OpenClaw كخادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## Talk

الإعدادات الافتراضية لوضع Talk (macOS/iOS/Android).

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

- يجب أن تطابق `talk.provider` مفتاحًا في `talk.providers` عند إعداد عدة مزودات Talk.
- تكون مفاتيح Talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) للتوافق فقط ويتم ترحيلها تلقائيًا إلى `talk.providers.<provider>`.
- تحتاط معرّفات الأصوات إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- تقبل `providers.*.apiKey` سلاسل نصية صريحة أو عناصر SecretRef.
- لا يُستخدم احتياط `ELEVENLABS_API_KEY` إلا عندما لا يكون مفتاح Talk API مُعدًا.
- تسمح `providers.*.voiceAliases` لتوجيهات Talk باستخدام أسماء ودية.
- تتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع Talk بعد صمت المستخدم قبل إرسال النص المفرغ. ويؤدي عدم التعيين إلى الإبقاء على نافذة التوقف الافتراضية للمنصة (`700 ms على macOS وAndroid، و900 ms على iOS`).

---

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

تقوم عملية Onboarding المحلية افتراضيًا بإعداد التكوينات المحلية الجديدة على `tools.profile: "coding"` عندما لا يكون معيّنًا (مع الحفاظ على الملفات الصريحة الحالية).

| ملف التعريف | يتضمن |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status` |
| `full`      | بلا تقييد (مثل عدم التعيين) |

### مجموعات الأدوات

| المجموعة | الأدوات |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec` و`process` و`code_execution` (يُقبل `bash` كاسم مستعار لـ `exec`) |
| `group:fs`         | `read` و`write` و`edit` و`apply_patch` |
| `group:sessions`   | `sessions_list` و`sessions_history` و`sessions_send` و`sessions_spawn` و`sessions_yield` و`subagents` و`session_status` |
| `group:memory`     | `memory_search` و`memory_get` |
| `group:web`        | `web_search` و`x_search` و`web_fetch` |
| `group:ui`         | `browser` و`canvas` |
| `group:automation` | `cron` و`gateway` |
| `group:messaging`  | `message` |
| `group:nodes`      | `nodes` |
| `group:agents`     | `agents_list` |
| `group:media`      | `image` و`image_generate` و`video_generate` و`tts` |
| `group:openclaw`   | جميع الأدوات المضمنة (باستثناء Plugins الخاصة بالمزوّد) |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (المنع يفوز). وهي غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. وتُطبَّق حتى عندما تكون Docker sandbox معطلة.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقييد إضافي للأدوات لمزودين أو نماذج محددة. الترتيب: ملف التعريف الأساسي → ملف تعريف المزوّد → السماح/المنع.

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

يتحكم في وصول exec المرتفع خارج sandbox:

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

- يمكن للتجاوز لكل وكيل (`agents.list[].tools.elevated`) فقط أن يضيف مزيدًا من التقييد.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ بينما تنطبق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع sandboxing ويستخدم مسار الهروب المُعدّ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

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
- `warningThreshold`: عتبة نمط التكرار من دون تقدم لإطلاق التحذيرات.
- `criticalThreshold`: عتبة تكرار أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: عتبة توقف صارمة لأي تشغيل من دون تقدم.
- `detectors.genericRepeat`: التحذير عند تكرار الأداة نفسها/الوسائط نفسها.
- `detectors.knownPollNoProgress`: التحذير/الحظر عند أدوات الاستطلاع المعروفة (`process.poll` و`command_status` وما إلى ذلك).
- `detectors.pingPong`: التحذير/الحظر عند أنماط الأزواج المتناوبة من دون تقدم.
- إذا كانت `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // أو BRAVE_API_KEY في env
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

**إدخال المزوّد** (`type: "provider"` أو عند الحذف):

- `provider`: معرّف مزود API (`openai` أو `anthropic` أو `google`/`gemini` أو `groq` وما إلى ذلك)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار profile من `auth-profiles.json`

**إدخال CLI** (`type: "cli"`):

- `command`: الملف التنفيذي المراد تشغيله
- `args`: وسائط قالبية (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وما إلى ذلك)

**الحقول المشتركة:**

- `capabilities`: قائمة اختيارية (`image` و`audio` و`video`). الافتراضيات: `openai`/`anthropic`/`minimax` → صورة، و`google` → صورة+صوت+فيديو، و`groq` → صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تحتاط حالات الفشل إلى الإدخال التالي.

يتبع تفويض المزوّد الترتيب القياسي: `auth-profiles.json` → متغيرات env → `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عندما تكون `true`، تحاول المهام
  غير المتزامنة المكتملة لـ `music_generate` و`video_generate` التسليم المباشر إلى القناة أولًا. الافتراضي: `false`
  (المسار القديم لإيقاظ جلسة الطالب/تسليم النموذج).

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
- `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (وقد يشمل ذلك مستخدمين آخرين إذا كنت تشغّل جلسات لكل مرسل تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. ولا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- تقييد sandbox: عندما تكون الجلسة الحالية معزولة وتكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، يتم فرض `visibility` على `tree` حتى لو كانت `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // اشتراك اختياري: اضبط true للسماح بمرفقات الملفات المضمنة
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

- لا تكون المرفقات مدعومة إلا لـ `runtime: "subagent"`. ويرفض وقت تشغيل ACP هذه المرفقات.
- يتم إنشاء الملفات داخل مساحة عمل الطفل في `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
- يتم تلقائيًا حجب محتوى المرفقات من حفظ السجل.
- يتم التحقق من مدخلات Base64 باستخدام فحوص صارمة للأبجدية/الحشو وحاجز حجم قبل فك الترميز.
- تكون أذونات الملفات `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: يقوم `delete` دائمًا بإزالة المرفقات؛ بينما يحتفظ `keep` بها فقط عندما تكون `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

أعلام الأدوات المضمنة التجريبية. تكون معطلة افتراضيًا ما لم تنطبق قاعدة التمكين التلقائي الصارمة والوكيليّة لـ GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // تمكين update_plan التجريبية
    },
  },
}
```

ملاحظات:

- `planTool`: يمكّن الأداة البنيوية `update_plan` لتتبع العمل غير البسيط متعدد الخطوات.
- الافتراضي: `false` ما لم يتم ضبط `agents.defaults.embeddedPi.executionContract` (أو تجاوز لكل وكيل) على `"strict-agentic"` لتشغيل من عائلة GPT-5 الخاصة بـ OpenAI أو OpenAI Codex. اضبطه على `true` لفرض تشغيل الأداة خارج ذلك النطاق، أو `false` للإبقاء عليها معطلة حتى مع تشغيلات GPT-5 الصارمة الوكيليّة.
- عند التمكين، تضيف system prompt أيضًا إرشادات استخدام بحيث يستخدمها النموذج فقط للأعمال الجوهرية ويحافظ على خطوة واحدة كحد أقصى في حالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين المنشأين. وإذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء الهدف لـ `sessions_spawn` عندما لا يضبط الوكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يُهمل استدعاء الأداة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## المزودات المخصصة وعناوين URL الأساسية

يستخدم OpenClaw كتالوج النماذج المضمن. أضف مزودات مخصصة عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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

- استخدم `authHeader: true` مع `headers` لاحتياجات التفويض المخصصة.
- تجاوز جذر إعدادات الوكيل باستخدام `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم مستعار قديم لمتغير البيئة).
- أولوية الدمج لمعرّفات المزوّد المتطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاصة بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة للوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا عبر SecretRef في سياق الإعدادات/ملف تعريف التفويض الحالي.
  - يتم تحديث قيم `apiKey` الخاصة بالمزوّدات المُدارة عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec) بدلًا من حفظ الأسرار المحلولة.
  - يتم تحديث قيم ترويسات المزوّدات المُدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec).
  - تحتاط قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى `models.providers` في الإعدادات.
  - تستخدم قيمتا `contextWindow`/`maxTokens` في النموذج المطابق القيمة الأعلى بين الإعداد الصريح وقيم الكتالوج الضمنية.
  - تحتفظ القيمة `contextTokens` في النموذج المطابق بسقف وقت تشغيل صريح عندما يكون موجودًا؛ استخدمها لتقييد السياق الفعّال من دون تغيير بيانات metadata الأصلية للنموذج.
  - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
  - يكون حفظ العلامات معتمدًا على المصدر: تُكتب العلامات من لقطة إعدادات المصدر النشطة (قبل الحلّ)، وليس من قيم الأسرار المحلولة في وقت التشغيل.

### تفاصيل حقول المزوّد

- `models.mode`: سلوك كتالوج المزوّد (`merge` أو `replace`).
- `models.providers`: خريطة مزودات مخصصة مفاتيحها معرّفات المزوّد.
  - تعديلات آمنة: استخدم `openclaw config set models.providers.<id> '<json>' --strict-json --merge` أو `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` للتحديثات الإضافية. يرفض `config set` الاستبدالات المدمّرة ما لم تمرر `--replace`.
- `models.providers.*.api`: مهايئ الطلب (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai` وما إلى ذلك).
- `models.providers.*.apiKey`: بيانات اعتماد المزوّد (يفضّل SecretRef/استبدال env).
- `models.providers.*.auth`: استراتيجية التفويض (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: يفرض نقل بيانات الاعتماد في ترويسة `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: عنوان URL الأساسي لواجهة API العلوية.
- `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه الوكيل/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بمزوّد النموذج.
  - `request.headers`: ترويسات إضافية (تُدمج مع افتراضيات المزوّد). وتقبل القيم SecretRef.
  - `request.auth`: تجاوز لاستراتيجية التفويض. الأوضاع: `"provider-default"` (استخدام تفويض المزوّد المضمن)، و`"authorization-bearer"` (مع `token`)، و`"header"` (مع `headerName` و`value` و`prefix` الاختياري).
  - `request.proxy`: تجاوز وكيل HTTP. الأوضاع: `"env-proxy"` (استخدام متغيرات env `HTTP_PROXY`/`HTTPS_PROXY`)، و`"explicit-proxy"` (مع `url`). ويقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` (جميعها تقبل SecretRef)، و`serverName` و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عند ضبطها على `true`، تسمح باستخدام HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو ما شابه، عبر حاجز fetch HTTP الخاص بالمزوّد (اشتراك اختياري من المشغّل لنقاط نهاية OpenAI-compatible ذاتية الاستضافة الموثوقة). يستخدم WebSocket القيمة `request` نفسها للترويسات/TLS ولكن ليس لذلك الحاجز الخاص بـ SSRF في fetch. الافتراضي `false`.
- `models.providers.*.models`: إدخالات كتالوج النماذج الصريحة للمزوّد.
- `models.providers.*.models.*.contextWindow`: بيانات metadata الخاصة بنافذة السياق الأصلية للنموذج.
- `models.providers.*.models.*.contextTokens`: سقف اختياري لسياق وقت التشغيل. استخدمه عندما تريد ميزانية سياق فعالة أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير فارغ وغير أصلي (مضيفه ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة على `false` في وقت التشغيل. أما `baseUrl` الفارغ/المحذوف فيُبقي سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية chat المتوافقة مع OpenAI والتي تدعم السلاسل النصية فقط. عندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية الخالصة إلى سلاسل نصية بسيطة قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي في Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف المزوّد من أجل الاكتشاف المستهدف.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فترة الاستطلاع لتحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الاحتياطي الأقصى لرموز الخرج للنماذج المكتشفة.

### أمثلة على المزوّدين

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

اضبط `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم المراجع `opencode/...` لكتالوج Zen أو المراجع `opencode-go/...` لكتالوج Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

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

اضبط `ZAI_API_KEY`. وتُقبل `z.ai/*` و`z-ai/*` كأسماء مستعارة. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف مزودًا مخصصًا مع تجاوز `baseUrl`.

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

تعلن نقاط نهاية Moonshot الأصلية توافق استخدام البث على النقل المشترك
`openai-completions`، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية
وليس فقط على معرّف المزوّد المضمن.

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

متوافق مع Anthropic، مزود مضمن. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

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

يجب أن يحذف `baseUrl` اللاحقة `/v1` (لأن عميل Anthropic يضيفها). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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
يفترض كتالوج النماذج القيمة M2.7 فقط.
على مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax
افتراضيًا ما لم تضبط `thinking` صراحةً بنفسك. ويقوم `/fast on` أو
`params.fastMode: true` بإعادة كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ وأبقِ النماذج المستضافة مدمجة كاحتياط.

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

- `allowBundled`: قائمة سماح اختيارية لـ Skills المجمعة فقط (ولا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `install.preferBrew`: عند ضبطها على true، تفضّل أدوات التثبيت عبر Homebrew عندما يكون `brew`
  متاحًا قبل الاحتياط إلى أنواع المثبّتات الأخرى.
- `install.nodeManager`: تفضيل مدير Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- تؤدي `entries.<skillKey>.enabled: false` إلى تعطيل Skill حتى إن كانت مجمعة/مثبتة.
- `entries.<skillKey>.apiKey`: حقل راحة للـ Skills التي تعلن متغير env أساسيًا (سلسلة نصية صريحة أو عنصر SecretRef).

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

- يتم تحميلها من `~/.openclaw/extensions`، و`<workspace>/.openclaw/extensions`، بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins OpenClaw الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل gateway.**
- `allow`: قائمة سماح اختيارية (لا يتم تحميل إلا Plugins المدرجة). ويفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل راحة لمفتاح API على مستوى Plugin (عندما تدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات env ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يقوم core بحظر `before_prompt_build` ويتجاهل الحقول المعدِّلة لـ prompt من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على hooks الأصلية في Plugin وعلى أدلة hooks الموفَّرة من الحزم المدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً بهذه Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لعمليات الوكلاء الفرعيين في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` المعيارية لتجاوزات الوكلاء الفرعيين الموثوق بها. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات معرّف بواسطة Plugin (يتم التحقق منه بواسطة schema Plugin الأصلية في OpenClaw عند توفرها).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزود web-fetch الخاص بـ Firecrawl.
  - `apiKey`: مفتاح Firecrawl API (يقبل SecretRef). ويحتاط إلى `plugins.entries.firecrawl.config.webSearch.apiKey`، أو `tools.web.fetch.firecrawl.apiKey` القديم، أو متغير env `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ Firecrawl API (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر ذاكرة التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخراج بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: تمكين مزود X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل عملية اكتساح كاملة لـ Dreaming (الافتراضي `"0 3 * * *"`).
  - تكون سياسة المراحل والعتبات تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- يوجد إعداد الذاكرة الكامل في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لحزم Claude Plugins المفعلة أيضًا أن تساهم في افتراضيات Pi المضمنة من `settings.json`؛ ويطبّقها OpenClaw كإعدادات وكيل مُنقّاة، وليس كتصحيحات إعدادات خام لـ OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشطة، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ والافتراضي هو `"legacy"` ما لم تقم بتثبيت محرك آخر وتحديده.
- `plugins.installs`: بيانات metadata للتثبيت التي يديرها CLI وتستخدمها `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - تعامل مع `plugins.installs.*` كحالة مُدارة؛ ويفضّل استخدام أوامر CLI بدلًا من التعديلات اليدوية.

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
      // dangerouslyAllowPrivateNetwork: true, // اشتراك اختياري فقط للوصول الموثوق إلى الشبكات الخاصة
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
- تكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة عند عدم تعيينها، لذا يبقى تنقل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تكون تثق عمدًا في تنقل المتصفح داخل الشبكات الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه الخاص بالشبكات الخاصة أثناء فحوصات الوصول/الاكتشاف.
- لا يزال `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون الملفات الشخصية البعيدة attach-only (بدء/إيقاف/إعادة تعيين معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw `/json/version`؛ واستخدم WS(S)
  عندما يزودك المزوّد بعنوان DevTools WebSocket مباشر.
- تستخدم ملفات `existing-session` Chrome MCP بدلًا من CDP ويمكنها الاتصال
  على المضيف المحدد أو عبر browser node متصلة.
- يمكن لملفات `existing-session` تعيين `userDataDir` لاستهداف ملف تعريف
  محدد لمتصفح قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات قائمة على snapshot/ref بدلًا من استهداف CSS-selector، وخطافات رفع ملف واحد،
  ومن دون تجاوزات لمهلات الحوارات، ومن دون `wait --load networkidle`،
  ومن دون `responsebody` أو تصدير PDF أو اعتراض التنزيل أو الإجراءات الدفعية.
- تقوم ملفات `openclaw` المحلية المُدارة بتعيين `cdpPort` و`cdpUrl` تلقائيًا؛
  ولا تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائمًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- خدمة التحكم: local loopback فقط (منفذ مشتق من `gateway.port`، الافتراضي `18791`).
- تضيف `extraArgs` أعلام تشغيل إضافية عند بدء Chromium المحلي (مثل
  `--disable-gpu` أو تحجيم النافذة أو أعلام التصحيح).

---

## واجهة المستخدم

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // رمز تعبيري، نص قصير، URL للصورة، أو data URI
    },
  },
}
```

- `seamColor`: لون تمييز لعناصر واجهة التطبيق الأصلية (لون فقاعة Talk Mode، وما إلى ذلك).
- `assistant`: تجاوز هوية Control UI. وتحتاط إلى هوية الوكيل النشط.

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
      // allowExternalEmbedUrls: false, // خطير: السماح بعناوين embed خارجية مطلقة http(s)
      // allowedOrigins: ["https://control.example.com"], // مطلوب لـ Control UI غير الخاصة بـ loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // وضع خطير للاحتياط إلى أصل Host-header
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

- `mode`: `local` (تشغيل gateway) أو `remote` (الاتصال بـ gateway بعيدة). وترفض Gateway البدء ما لم تكن `local`.
- `port`: منفذ واحد متعدد الاستخدامات لكل من WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto` أو `loopback` (الافتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط) أو `custom`.
- **الأسماء المستعارة القديمة للربط**: استخدم قيم وضع الربط في `gateway.bind` (`auto` أو `loopback` أو `lan` أو `tailnet` أو `custom`)، وليس الأسماء المستعارة للمضيف (`0.0.0.0` أو `127.0.0.1` أو `localhost` أو `::` أو `::1`).
- **ملاحظة Docker**: قيمة الربط الافتراضية `loopback` تستمع على `127.0.0.1` داخل الحاوية. ومع شبكات Docker bridge (`-p 18789:18789`)، تصل الحركة إلى `eth0`، وبالتالي تصبح gateway غير قابلة للوصول. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **التفويض**: مطلوب افتراضيًا. تتطلب الروابط غير الخاصة بـ loopback تفويض gateway. وعمليًا يعني ذلك رمزًا/كلمة مرور مشتركة أو reverse proxy واعية بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ويولّد معالج Onboarding رمزًا مميزًا افتراضيًا.
- إذا تم إعداد كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. وتفشل عمليات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما معدًا والوضع غير معيّن.
- `gateway.auth.mode: "none"`: وضع صريح من دون تفويض. استخدمه فقط في إعدادات local loopback الموثوقة؛ ولا يُعرض هذا عمدًا في مطالبات Onboarding.
- `gateway.auth.mode: "trusted-proxy"`: فوّض التفويض إلى reverse proxy واعية بالهوية وثق في ترويسات الهوية من `gateway.trustedProxies` (راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع وجود مصدر proxy **غير loopback**؛ ولا تفي reverse proxies على loopback وعلى نفس المضيف بمتطلبات trusted-proxy auth.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve تلبية تفويض Control UI/WebSocket (يتم التحقق منها عبر `tailscale whois`). ولا تستخدم نقاط نهاية HTTP API هذا التفويض عبر ترويسات Tailscale؛ بل تتبع وضع تفويض HTTP العادي في gateway. ويفترض هذا التدفق بلا رمز أن مضيف gateway موثوق. ويكون افتراضيًا `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات التفويض الفاشلة. ويُطبق لكل IP عميل ولكل نطاق تفويض (يتم تتبع السر المشترك ورمز الجهاز المميز بشكل مستقل). وتعيد المحاولات المحظورة `429` + `Retry-After`.
  - في المسار غير المتزامن لـ Tailscale Serve Control UI، يتم تسلسل المحاولات الفاشلة الخاصة بالمجموعة `{scope, clientIp}` نفسها قبل كتابة الفشل. ولذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدد في الطلب الثاني بدلًا من مرور الاثنين كتطابقات غير صحيحة.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمدًا أيضًا تطبيق تحديد المعدل على حركة localhost (لإعدادات الاختبار أو عمليات النشر الصارمة عبر proxy).
- يتم دائمًا تقييد محاولات تفويض WS ذات أصل المتصفح مع تعطيل إعفاء loopback (دفاعًا إضافيًا ضد محاولات القوة الغاشمة المحلية المعتمدة على المتصفح).
- على loopback، تكون عمليات الحظر هذه ذات أصل المتصفح معزولة لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى حظر أصل مختلف.
- `tailscale.mode`: `serve` (tailnet فقط، مع ربط loopback) أو `funnel` (عام، ويتطلب تفويضًا).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. وهي مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الاحتياط إلى أصل Host-header لعمليات النشر التي تعتمد عمدًا على سياسة أصل Host-header.
- `remote.transport`: `ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` بصيغة `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ من جانب العميل يسمح باستخدام `ws://` النصي مع عناوين IP موثوقة على الشبكات الخاصة؛ بينما يبقى الافتراضي مقتصرًا على local loopback للاتصالات النصية.
- تمثل `gateway.remote.token` / `.password` حقول بيانات اعتماد عميل بعيد. وهي لا تهيّئ تفويض gateway بذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي لـ APNs relay الخارجية المستخدمة من قبل إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالـ relay إلى gateway. ويجب أن يطابق هذا العنوان عنوان relay المضمن في بناء iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من gateway إلى relay بالمللي ثانية. والافتراضي هو `10000`.
- يتم تفويض التسجيلات المدعومة بالـ relay إلى هوية gateway محددة. ويجلب تطبيق iOS المقترن القيمة `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل relay، ويمرر إذن إرسال محدد النطاق الخاص بالتسجيل إلى gateway. ولا يمكن لـ gateway أخرى إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات env مؤقتة لإعداد relay أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين relay عبر HTTP على loopback. ويجب أن تبقى عناوين relay الإنتاجية على HTTPS.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القنوات بالدقائق. اضبطه على `0` لتعطيل إعادة تشغيل مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. احرص على أن تكون أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لعمليات إعادة التشغيل من مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: اشتراك خروج لكل قناة من عمليات إعادة تشغيل مراقب الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب في القنوات متعددة الحسابات. وعند تعيينه، تكون له الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء gateway المحلية استخدام `gateway.remote.*` كاحتياط فقط عندما لا تكون `gateway.auth.*` معيّنة.
- إذا كانت `gateway.auth.token` / `gateway.auth.password` معدة صراحةً عبر SecretRef ولم يتم حلّها، يفشل الحل بشكل مغلق (من دون احتياط بعيد يُخفي المشكلة).
- `trustedProxies`: عناوين IP الخاصة بالـ reverse proxy التي تنهي TLS أو تحقن ترويسات العميل المُمرّرة. أدرج فقط proxies التي تتحكم فيها. ولا تزال إدخالات loopback صالحة لإعدادات proxy على المضيف نفسه/الاكتشاف المحلي (مثل Tailscale Serve أو reverse proxy محلية)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، تقبل gateway الترويسة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. والافتراضي `false` لسلوك فشل مغلق.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (تمدد قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة الرفض الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. قم بتمكينها عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- تقوية مدخلات URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة اختيارية لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (عيّنها فقط لأصول HTTPS التي تتحكم فيها؛ راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل بين النسخ المتعددة

شغّل عدة Gateways على مضيف واحد باستخدام منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام راحة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [بوابات متعددة](/ar/gateway/multiple-gateways).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع gateway (HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: يولد تلقائيًا زوج cert/key محليًا موقعًا ذاتيًا عندما لا تكون الملفات الصريحة معدة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص بـ TLS؛ احرص على تقييد أذوناته.
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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات في وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): حاول hot reload أولًا؛ واحتط إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة اهتزاز بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
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
        messageTemplate: "من: {{messages[0].from}}\nالموضوع: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

التفويض: `Authorization: Bearer <token>` أو `x-openclaw-token: <token>`.
يتم رفض رموز hook في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` وجود `hooks.token` غير فارغ.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز Gateway المميز.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقيد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).
- إذا كان mapping أو preset يستخدم `sessionKey` قالبية، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. ولا تتطلب مفاتيح mapping الثابتة هذا الاشتراك الاختياري.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يتم قبول `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يتم حلّه عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في mapping الناتجة عن القوالب على أنها مزودة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل الـ Mapping">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثل `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن لـ `transform` أن يشير إلى وحدة JS/TS تُرجع إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى ضمن `hooks.transformsDir` (تُرفض المسارات المطلقة والتنقل عبر المسارات).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، و`[]` = المنع للجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook من دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمتصلّي `/hooks/agent` ومفاتيح جلسات الـ mapping المعتمدة على القوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية لبادئات قيم `sessionKey` الصريحة (في الطلب + الـ mapping)، مثل `["hook:"]`. وتصبح مطلوبة عندما يستخدم أي mapping أو preset قيمة `sessionKey` قالبية.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ والقيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` قيمة LLM لهذا التشغيل من hook (ويجب أن يكون مسموحًا به إذا تم تعيين كتالوج النماذج).

</Accordion>

### تكامل Gmail

- يستخدم Gmail preset المضمن القيمة `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا احتفظت بهذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` بحيث تطابق مساحة أسماء Gmail، مثل `["hook:", "hook:gmail:"]`.
- إذا كنت بحاجة إلى `hooks.allowRequestSessionKey: false`، فتجاوز preset باستخدام `sessionKey` ثابتة بدلًا من القيمة القالبية الافتراضية.

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

- تقوم Gateway بتشغيل `gog gmail watch serve` تلقائيًا عند الإقلاع عندما تكون مُعدة. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لتعطيل ذلك.
- لا تشغّل `gog gmail watch serve` منفصلة بجانب Gateway.

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

- يقدّم ملفات HTML/CSS/JS وA2UI القابلة للتعديل بواسطة الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- بالنسبة إلى الروابط غير loopback: تتطلب مسارات canvas تفويض Gateway (رمز/كلمة مرور/trusted-proxy)، مثل أسطح HTTP الأخرى الخاصة بـ Gateway.
- لا ترسل Node WebViews عادةً ترويسات تفويض؛ وبعد إقران node واتصالها، تعلن Gateway عن عناوين URL لقدرات ضمن نطاق node للوصول إلى canvas/A2UI.
- تكون عناوين URL الخاصة بالقدرات مرتبطة بجلسة WS النشطة الخاصة بـ node وتنتهي صلاحيتها بسرعة. ولا يُستخدم احتياط قائم على IP.
- يحقن عميل إعادة التحميل المباشر داخل HTML المقدَّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
- كما يقدّم A2UI أيضًا على `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل gateway.
- عطّل live reload للأدلة الكبيرة أو عند أخطاء `EMFILE`.

---

## الاكتشاف

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

- `minimal` (الافتراضي): يحذف `cliPath` و`sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` و`sshPort`.
- يكون اسم المضيف افتراضيًا `openclaw`. وتجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### على نطاق واسع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية الإرسال تحت `~/.openclaw/dns/`. ولاكتشاف عبر الشبكات، اجمع ذلك مع خادم DNS (يوصى بـ CoreDNS) + Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` (متغيرات env مضمّنة)

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

- لا يتم تطبيق متغيرات env المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + الملف `~/.openclaw/.env` (ولا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف shell الخاص بتسجيل الدخول.
- راجع [البيئة](/ar/help/environment) للحصول على الأولوية الكاملة.

### استبدال متغيرات env

أشر إلى متغيرات env في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- لا تتم مطابقة إلا الأسماء المكتوبة بأحرف كبيرة: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للحصول على `${VAR}` حرفيًا.
- يعمل ذلك مع `$include`.

---

## الأسرار

تكون مراجع الأسرار إضافية: لا تزال القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكل كائن واحدًا:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` عند `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: مؤشر JSON مطلق (على سبيل المثال `"/providers/openai/apiKey"`)
- نمط `id` عند `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار `.` أو `..` مفصولة بشرطة مائلة (على سبيل المثال يتم رفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة المعيارية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- يتم تضمين مراجع `auth-profiles.json` في حلّ وقت التشغيل وتغطية التدقيق.

### إعداد مزودي الأسرار

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // مزود env صريح اختياري
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

- يدعم مزود `file` وضعي `mode: "json"` و`mode: "singleValue"` (ويجب أن تكون `id` هي `"value"` في وضع singleValue).
- يتطلب مزود `exec` مسار `command` مطلقًا ويستخدم حمولات بروتوكول على stdin/stdout.
- تُرفض مسارات الأوامر الرمزية افتراضيًا. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا تم إعداد `trustedDirs`، فإن فحص الدليل الموثوق يُطبَّق على مسار الهدف المحلول.
- تكون بيئة عملية `exec` الفرعية محدودة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- يتم حل مراجع الأسرار في وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب هذه اللقطة فقط.
- يُطبق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعلة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتجاوز الأسطح غير النشطة مع تشخيصات.

---

## تخزين التفويض

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

- يتم تخزين الملفات الشخصية لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- لا تدعم الملفات الشخصية ذات وضع OAuth (`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد الملفات الشخصية المدعومة عبر SecretRef.
- تأتي بيانات الاعتماد الثابتة لوقت التشغيل من لقطات محلولة داخل الذاكرة؛ ويتم تنظيف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- الاستيرادات القديمة لـ OAuth تأتي من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك وقت تشغيل الأسرار وأدوات `audit/configure/apply`: [إدارة الأسرار](/ar/gateway/secrets).

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

- `billingBackoffHours`: مهلة التراجع الأساسية بالساعات عندما يفشل ملف شخصي بسبب
  أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). ويمكن أن تنتهي نصوص الفوترة
  الصريحة هنا حتى عند استجابات `401`/`403`، لكن أدوات المطابقة النصية الخاصة
  بكل مزود تبقى محصورة في المزوّد الذي يملكها (مثل OpenRouter
  `Key limit exceeded`). أما رسائل نافذة الاستخدام القابلة لإعادة المحاولة في HTTP `402` أو
  حدود الإنفاق الخاصة بالمؤسسة/مساحة العمل فتبقى في مسار `rate_limit`
  بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزود لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مهلة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدويرات auth-profile للمزوّد نفسه عند أخطاء التحميل الزائد قبل التحول إلى احتياط النموذج (الافتراضي: `1`). وتندرج أشكال انشغال المزوّد مثل `ModelNotReadyException` هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزود/ملف شخصي محمّل فوق طاقته (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدويرات auth-profile للمزوّد نفسه عند أخطاء تحديد المعدل قبل التحول إلى احتياط النموذج (الافتراضي: `1`). وتتضمن حزمة تحديد المعدل هذه نصوصًا خاصة بالمزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل إيقاف الكتابات (عدد صحيح موجب؛ الافتراضي: `524288000` = 500 MB). استخدم تدوير سجلات خارجيًا لعمليات النشر الإنتاجية.

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

- `enabled`: المفتاح الرئيسي لخرج الأدوات التشخيصية (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل الأعلام التي تمكّن خرج السجل المستهدف (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة العمر بالمللي ثانية لإصدار تحذيرات الجلسة العالقة بينما تظل الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل مسار التصدير الخاص بـ OpenTelemetry (الافتراضي: `false`).
- `otel.endpoint`: عنوان URL الخاص بالمجمّع لتصدير OTel.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات metadata إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تمكين تصدير trace أو metrics أو logs.
- `otel.sampleRate`: معدل أخذ عينات trace من `0` إلى `1`.
- `otel.flushIntervalMs`: فاصل تفريغ telemetry الدوري بالمللي ثانية.
- `cacheTrace.enabled`: تسجيل لقطات cache trace للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ cache trace JSONL (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم في ما يتم تضمينه في خرج cache trace (وجميعها افتراضيًا: `true`).

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

- `channel`: قناة الإصدار لعمليات تثبيت npm/git — `"stable"` أو `"beta"` أو `"dev"`.
- `checkOnStart`: التحقق من تحديثات npm عند بدء gateway (الافتراضي: `true`).
- `auto.enabled`: تمكين التحديث التلقائي في الخلفية لعمليات تثبيت الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي في القناة المستقرة (الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية لطرح القناة المستقرة بالساعات (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد ساعات تكرار فحوصات القناة التجريبية (الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `false`).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسات ACP (الافتراضي: `true`). اضبطها على `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضية لوقت تشغيل ACP (ويجب أن يطابق Plugin وقت تشغيل ACP مسجلة).
- `defaultAgent`: معرّف وكيل ACP الاحتياطي المستهدف عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ وتعني القائمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة في الوقت نفسه.
- `stream.coalesceIdleMs`: نافذة التفريغ عند الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم المقطع قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: يمنع تكرار أسطر الحالة/الأدوات لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تقوم `"live"` بالبث تدريجيًا؛ بينما تقوم `"final_only"` بالتجميع حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف خرج assistant المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف في أسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل من أسماء الوسوم إلى تجاوزات الإظهار المنطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعاملات جلسات ACP قبل أن تصبح مؤهلة للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري للتشغيل عند تهيئة بيئة وقت تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في أسلوب tagline الخاصة باللافتة:
  - `"random"` (الافتراضي): taglines دورية مضحكة/موسمية.
  - `"default"`: tagline محايدة ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: من دون نص tagline (مع استمرار عرض عنوان/إصدار اللافتة).
- لإخفاء اللافتة بالكامل (وليس taglines فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

بيانات metadata يكتبها CLI في تدفقات الإعداد الموجّهة (`onboard` و`configure` و`doctor`):

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

راجع حقول الهوية في `agents.list` تحت [الإعدادات الافتراضية للوكيل](#agent-defaults).

---

## Bridge (قديم، أزيل)

لم تعد الإصدارات الحالية تتضمن TCP bridge. وتتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من schema الإعدادات (يفشل التحقق حتى تتم إزالتها؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="إعداد bridge القديم (مرجع تاريخي)">

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
    webhook: "https://example.invalid/legacy", // احتياط قديم ومهجور لوظائف notify:true المخزنة
    webhookToken: "replace-with-dedicated-token", // bearer token اختياري لتفويض Webhook الصادر
    sessionRetention: "24h", // سلسلة مدة أو false
    runLog: {
      maxBytes: "2mb", // الافتراضي 2_000_000 بايت
      keepLines: 2000, // الافتراضي 2000
    },
  },
}
```

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل قصّها من `sessions.json`. كما تتحكم أيضًا في تنظيف سجلات Cron النصية المؤرشفة المحذوفة. الافتراضي: `24h`؛ اضبطها على `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى لحجم كل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل القص. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفظ بها عند تفعيل قص سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: bearer token يُستخدم لتسليم POST إلى Webhook في Cron (`delivery.mode = "webhook"`)، وإذا حُذف لا يتم إرسال ترويسة تفويض.
- `webhook`: عنوان URL احتياطي قديم ومهجور لـ webhook (http/https) يُستخدم فقط للوظائف المخزنة التي لا تزال تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادة المحاولة للوظائف أحادية التنفيذ عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — `"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفه لإعادة المحاولة على جميع الأنواع العابرة.

ينطبق هذا فقط على وظائف Cron أحادية التنفيذ. أما الوظائف المتكررة فلها معالجة فشل منفصلة.

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

- `enabled`: تمكين تنبيهات الفشل لوظائف Cron (الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى للمللي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `mode`: وضع التسليم — تقوم `"announce"` بالإرسال عبر رسالة قناة؛ بينما تقوم `"webhook"` بالنشر إلى webhook المعدة.
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
- `mode`: `"announce"` أو `"webhook"`؛ وتكون افتراضيًا `"announce"` عندما تتوفر بيانات هدف كافية.
- `channel`: تجاوز قناة لتسليم announce. ويعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان URL لـ webhook. وهو مطلوب لوضع webhook.
- `accountId`: تجاوز اختياري للحساب عند التسليم.
- تتجاوز `delivery.failureDestination` لكل وظيفة هذا الإعداد الافتراضي العام.
- عندما لا يتم تعيين وجهة فشل عامة ولا لكل وظيفة، فإن الوظائف التي تقوم أصلًا بالتسليم عبر `announce` تعود عند الفشل إلى هدف announce الأساسي هذا.
- لا تكون `delivery.failureDestination` مدعومة إلا لوظائف `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [وظائف Cron](/ar/automation/cron-jobs). ويتم تتبع عمليات Cron المعزولة كـ [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

العناصر النائبة للقالب التي يتم توسيعها في `tools.media.models[].args`:

| المتغير | الوصف |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | جسم الرسالة الواردة الكامل |
| `{{RawBody}}`      | الجسم الخام (من دون أغلفة السجل/المرسل) |
| `{{BodyStripped}}` | الجسم بعد إزالة إشارات المجموعات |
| `{{From}}`         | معرّف المرسل |
| `{{To}}`           | معرّف الوجهة |
| `{{MessageSid}}`   | معرّف رسالة القناة |
| `{{SessionId}}`    | UUID الجلسة الحالية |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة |
| `{{MediaUrl}}`     | عنوان pseudo-URL للوسائط الواردة |
| `{{MediaPath}}`    | المسار المحلي للوسائط |
| `{{MediaType}}`    | نوع الوسائط (image/audio/document/…) |
| `{{Transcript}}`   | تفريغ الصوت |
| `{{Prompt}}`       | prompt الوسائط المحلولة لإدخالات CLI |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الخرج لإدخالات CLI |
| `{{ChatType}}`     | `"direct"` أو `"group"` |
| `{{GroupSubject}}` | موضوع المجموعة (أفضل جهد) |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (أفضل جهد) |
| `{{SenderName}}`   | اسم عرض المرسل (أفضل جهد) |
| `{{SenderE164}}`   | رقم هاتف المرسل (أفضل جهد) |
| `{{Provider}}`     | تلميح المزوّد (whatsapp أو telegram أو discord وما إلى ذلك) |

---

## تضمينات الإعدادات (`$include`)

قسّم الإعدادات إلى ملفات متعددة:

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
- المفاتيح الشقيقة: تُدمج بعد التضمينات (فتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى عمق 10 مستويات.
- المسارات: تُحل نسبةً إلى الملف المضمِّن، ولكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` لـ `openclaw.json`). ويُسمح بالأشكال المطلقة/`../` فقط عندما تُحل في النهاية داخل هذا الحد.
- تقوم الكتابات المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى ومدعومًا بتضمين ملف واحد بالكتابة مباشرة إلى ذلك الملف المضمَّن. على سبيل المثال، يقوم `plugins install` بتحديث `plugins: { $include: "./plugins.json5" }` داخل `plugins.json5` ويترك `openclaw.json` كما هو.
- تكون التضمينات الجذرية، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة إلى الكتابات المملوكة لـ OpenClaw؛ وتفشل هذه الكتابات بشكل مغلق بدلًا من تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_
