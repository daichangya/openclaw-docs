---
read_when:
    - تعلّم كيفية تهيئة OpenClaw
    - البحث عن أمثلة للتهيئة
    - إعداد OpenClaw للمرة الأولى
summary: أمثلة تهيئة دقيقة وفق schema لإعدادات OpenClaw الشائعة
title: أمثلة التهيئة
x-i18n:
    generated_at: "2026-04-25T13:46:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f31f70459d6232d2aefe668440312bb1800f18de0ef3c2783befa1de05f25f6
    source_path: gateway/configuration-examples.md
    workflow: 15
---

الأمثلة أدناه متوافقة مع schema الحالية للتهيئة. وللاطلاع على المرجع الكامل والملاحظات الخاصة بكل حقل، راجع [التهيئة](/ar/gateway/configuration).

## البدء السريع

### الحد الأدنى المطلق

```json5
{
  agent: { workspace: "~/.openclaw/workspace" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

احفظه في `~/.openclaw/openclaw.json` وستتمكن من مراسلة الروبوت مباشرة من ذلك الرقم.

### إعداد ابتدائي موصى به

```json5
{
  identity: {
    name: "Clawd",
    theme: "مساعد مفيد",
    emoji: "🦞",
  },
  agent: {
    workspace: "~/.openclaw/workspace",
    model: { primary: "anthropic/claude-sonnet-4-6" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## مثال موسع (الخيارات الرئيسية)

> يتيح لك JSON5 استخدام التعليقات والفواصل الختامية. كما يعمل JSON العادي أيضًا.

```json5
{
  // البيئة + shell
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

  // البيانات الوصفية لملف auth profile (توجد الأسرار في auth-profiles.json)
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:default": { provider: "openai", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:default"],
      "openai-codex": ["openai-codex:personal"],
    },
  },

  // الهوية
  identity: {
    name: "Samantha",
    theme: "كسلان مفيد",
    emoji: "🦥",
  },

  // التسجيل
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // تنسيق الرسائل
  messages: {
    messagePrefix: "[openclaw]",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
  },

  // التوجيه + قائمة الانتظار
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
      historyLimit: 50,
    },
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
        discord: "collect",
        slack: "collect",
        signal: "collect",
        imessage: "collect",
        webchat: "collect",
      },
    },
  },

  // الأدوات
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          // Fallback اختياري لـ CLI (ملف Whisper التنفيذي):
          // { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] }
        ],
        timeoutSeconds: 120,
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },

  // سلوك الجلسة
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // موصى به لصناديق الوارد متعددة المستخدمين
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60,
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/default/sessions/sessions.json",
    maintenance: {
      mode: "warn",
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // مدة أو false
      maxDiskBytes: "500mb", // اختياري
      highWaterBytes: "400mb", // اختياري (الافتراضي 80% من maxDiskBytes)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // القنوات
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },

    telegram: {
      enabled: true,
      botToken: "YOUR_TELEGRAM_BOT_TOKEN",
      allowFrom: ["123456789"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
    },

    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },

    slack: {
      enabled: true,
      botToken: "xoxb-REPLACE_ME",
      appToken: "xapp-REPLACE_ME",
      channels: {
        "#general": { allow: true, requireMention: true },
      },
      dm: { enabled: true, allowFrom: ["U123"] },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
    },
  },

  // بيئة تشغيل الوكيل
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      userTimezone: "America/Chicago",
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["anthropic/claude-opus-4-6", "openai/gpt-5.4"],
      },
      imageModel: {
        primary: "openrouter/anthropic/claude-sonnet-4-6",
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
        "openai/gpt-5.4": { alias: "gpt" },
      },
      skills: ["github", "weather"], // تورَّث إلى الوكلاء الذين يحذفون list[].skills
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      blockStreamingDefault: "off",
      blockStreamingBreak: "text_end",
      blockStreamingChunk: {
        minChars: 800,
        maxChars: 1200,
        breakPreference: "paragraph",
      },
      blockStreamingCoalesce: {
        idleMs: 1000,
      },
      humanDelay: {
        mode: "natural",
      },
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      typingIntervalSeconds: 5,
      maxConcurrent: 3,
      heartbeat: {
        every: "30m",
        model: "anthropic/claude-sonnet-4-6",
        target: "last",
        directPolicy: "allow", // allow (الافتراضي) | block
        to: "+15555550123",
        prompt: "HEARTBEAT",
        ackMaxChars: 300,
      },
      memorySearch: {
        provider: "gemini",
        model: "gemini-embedding-001",
        remote: {
          apiKey: "${GEMINI_API_KEY}",
        },
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
      sandbox: {
        mode: "non-main",
        scope: "session", // مفضل على perSession القديم: true
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
        },
        browser: {
          enabled: false,
        },
      },
    },
    list: [
      {
        id: "main",
        default: true,
        // يرث defaults.skills -> github, weather
        thinkingDefault: "high", // تجاوز التفكير لكل وكيل
        reasoningDefault: "on", // إظهار reasoning لكل وكيل
        fastModeDefault: false, // الوضع السريع لكل وكيل
      },
      {
        id: "quick",
        skills: [], // بلا Skills لهذا الوكيل
        fastModeDefault: true, // يعمل هذا الوكيل دائمًا بسرعة
        thinkingDefault: "off",
      },
    ],
  },

  tools: {
    allow: ["exec", "process", "read", "write", "edit", "apply_patch"],
    deny: ["browser", "canvas"],
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
    },
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        telegram: ["123456789"],
        discord: ["123456789012345678"],
        slack: ["U123"],
        signal: ["+15555550123"],
        imessage: ["user@example.com"],
        webchat: ["session:demo"],
      },
    },
  },

  // موفّرو النماذج المخصصون
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-responses",
        authHeader: true,
        headers: { "X-Proxy-Region": "us-west" },
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            api: "openai-responses",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },

  // وظائف Cron
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/cron.json",
    maxConcurrentRuns: 2,
    sessionRetention: "24h",
    runLog: {
      maxBytes: "2mb",
      keepLines: 2000,
    },
  },

  // Webhooks
  hooks: {
    enabled: true,
    path: "/hooks",
    token: "shared-secret",
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        id: "gmail-hook",
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "من: {{messages[0].from}}\nالموضوع: {{messages[0].subject}}",
        textTemplate: "{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        to: "+15555550123",
        thinking: "low",
        timeoutSeconds: 300,
        transform: {
          module: "gmail.js",
          export: "transformGmail",
        },
      },
    ],
    gmail: {
      account: "openclaw@gmail.com",
      label: "INBOX",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
    },
  },

  // Gateway + الشبكات
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    controlUi: { enabled: true, basePath: "/openclaw" },
    auth: {
      mode: "token",
      token: "gateway-token",
      allowTailscale: true,
    },
    tailscale: { mode: "serve", resetOnExit: false },
    remote: { url: "ws://gateway.tailnet:18789", token: "remote-token" },
    reload: { mode: "hybrid", debounceMs: 300 },
  },

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
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
    },
  },
}
```

## الأنماط الشائعة

### خط أساس مشترك لـ Skill مع تجاوز واحد

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      skills: ["github", "weather"],
    },
    list: [
      { id: "main", default: true },
      { id: "docs", workspace: "~/.openclaw/workspace-docs", skills: ["docs-search"] },
    ],
  },
}
```

- `agents.defaults.skills` هو خط الأساس المشترك.
- يستبدل `agents.list[].skills` ذلك الخط الأساسي لوكيل واحد.
- استخدم `skills: []` عندما يجب ألا يرى الوكيل أي Skills.

### إعداد متعدد المنصات

```json5
{
  agent: { workspace: "~/.openclaw/workspace" },
  channels: {
    whatsapp: { allowFrom: ["+15555550123"] },
    telegram: {
      enabled: true,
      botToken: "YOUR_TOKEN",
      allowFrom: ["123456789"],
    },
    discord: {
      enabled: true,
      token: "YOUR_TOKEN",
      dm: { allowFrom: ["123456789012345678"] },
    },
  },
}
```

### الموافقة التلقائية لعُقد الشبكة الموثوقة

أبقِ اقتران الأجهزة يدويًا ما لم تكن تتحكم في مسار الشبكة. وبالنسبة إلى
مختبر مخصص أو شبكة tailnet فرعية، يمكنك تفعيل الموافقة التلقائية لأول مرة على أجهزة Node
باستخدام CIDR أو عناوين IP مطابقة تمامًا:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
    },
  },
}
```

يظل هذا معطّلًا عند عدم تعيينه. وينطبق فقط على اقتران جديد لـ `role: node` من دون
نطاقات scopes مطلوبة. ولا تزال ترقية عملاء المشغّل/المتصفح أو ترقية الدور أو
النطاق أو البيانات الوصفية أو المفتاح العام تتطلب موافقة يدوية.

### وضع الرسائل الخاصة الآمن (صندوق وارد مشترك / رسائل خاصة متعددة المستخدمين)

إذا كان بإمكان أكثر من شخص مراسلة الروبوت مباشرة (وجود أكثر من إدخال في `allowFrom`، أو موافقات اقتران لعدة أشخاص، أو `dmPolicy: "open"`)، فعِّل **وضع الرسائل الخاصة الآمن** حتى لا تشترك الرسائل الخاصة من مرسلين مختلفين في سياق واحد افتراضيًا:

```json5
{
  // وضع الرسائل الخاصة الآمن (موصى به لوكلاء الرسائل الخاصة متعددي المستخدمين أو الحساسين)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // مثال: صندوق وارد WhatsApp متعدد المستخدمين
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // مثال: صندوق وارد Discord متعدد المستخدمين
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

بالنسبة إلى Discord وSlack وGoogle Chat وMicrosoft Teams وMattermost وIRC، يكون تفويض المرسل قائمًا على المعرّف أولًا افتراضيًا.
ولا تفعّل مطابقة الاسم/البريد الإلكتروني/الاسم المستعار القابل للتغيير مباشرة إلا باستخدام `dangerouslyAllowNameMatching: true` الخاص بكل قناة إذا كنت تقبل هذه المخاطرة صراحةً.

### مفتاح Anthropic API مع fallback إلى MiniMax

```json5
{
  auth: {
    profiles: {
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:api"],
    },
  },
  models: {
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        api: "anthropic-messages",
        apiKey: "${MINIMAX_API_KEY}",
      },
    },
  },
  agent: {
    workspace: "~/.openclaw/workspace",
    model: {
      primary: "anthropic/claude-opus-4-6",
      fallbacks: ["minimax/MiniMax-M2.7"],
    },
  },
}
```

### روبوت العمل (وصول مقيّد)

```json5
{
  identity: {
    name: "WorkBot",
    theme: "مساعد احترافي",
  },
  agent: {
    workspace: "~/work-openclaw",
    elevated: { enabled: false },
  },
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      channels: {
        "#engineering": { allow: true, requireMention: true },
        "#general": { allow: true, requireMention: true },
      },
    },
  },
}
```

### نماذج محلية فقط

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
    model: { primary: "lmstudio/my-local-model" },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## نصائح

- إذا ضبطت `dmPolicy: "open"`، فيجب أن تتضمن قائمة `allowFrom` المطابقة القيمة `"*"`.
- تختلف معرّفات الموفّرين (أرقام الهواتف، ومعرّفات المستخدمين، ومعرّفات القنوات). استخدم مستندات الموفّر لتأكيد الصيغة.
- الأقسام الاختيارية التي يمكنك إضافتها لاحقًا: `web` و`browser` و`ui` و`discovery` و`canvasHost` و`talk` و`signal` و`imessage`.
- راجع [الموفّرون](/ar/providers) و[استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting) للحصول على ملاحظات إعداد أعمق.

## ذو صلة

- [مرجع التهيئة](/ar/gateway/configuration-reference)
- [التهيئة](/ar/gateway/configuration)
