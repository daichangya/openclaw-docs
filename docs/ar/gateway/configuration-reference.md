---
read_when:
    - أنت بحاجة إلى دلالات دقيقة على مستوى الحقول أو القيم الافتراضية للتهيئة
    - أنت تتحقق من كتل تهيئة القنوات أو النماذج أو Gateway أو الأدوات
summary: مرجع تهيئة Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط مراجع الأنظمة الفرعية المخصصة
title: مرجع التهيئة
x-i18n:
    generated_at: "2026-04-25T13:46:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

مرجع التهيئة الأساسي لـ `~/.openclaw/openclaw.json`. وللاطلاع على نظرة عامة موجهة حسب المهام، راجع [التهيئة](/ar/gateway/configuration).

يغطي هذا السطوح الرئيسية لتهيئة OpenClaw ويربط إلى الخارج عندما يكون لأحد الأنظمة الفرعية مرجع أعمق خاص به. وتوجد كتالوجات الأوامر المملوكة للقنوات وPlugin ومفاتيح الذاكرة العميقة/QMD في صفحاتها الخاصة بدلًا من هذه الصفحة.

مصدر الحقيقة في الكود:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وControl UI، مع دمج بيانات التعريف المجمعة/الخاصة بـ Plugin/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة schema واحدة محددة بالمسار لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من hash الأساسي لوثائق التهيئة مقابل سطح schema الحالي

المراجع العميقة المخصصة:

- [مرجع تهيئة الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وتهيئة Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر المضمنة + المجمعة الحالي
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

صيغة التهيئة هي **JSON5** (يُسمح بالتعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

نُقلت مفاتيح التهيئة الخاصة بكل قناة إلى صفحة مخصصة — راجع
[التهيئة — القنوات](/ar/gateway/config-channels) لـ `channels.*`,
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها
من القنوات المجمعة (المصادقة، والتحكم في الوصول، وتعدد الحسابات، وضبط الإشارة).

## إعدادات الوكيل الافتراضية، وتعدد الوكلاء، والجلسات، والرسائل

نُقلت إلى صفحة مخصصة — راجع
[التهيئة — الوكلاء](/ar/gateway/config-agents) لما يلي:

- `agents.defaults.*` (مساحة العمل، والنموذج، والتفكير، وHeartbeat، والذاكرة، والوسائط، وSkills، وsandbox)
- `multiAgent.*` (توجيه متعدد الوكلاء والروابط)
- `session.*` (دورة حياة الجلسة، وCompaction، والتقليم)
- `messages.*` (تسليم الرسائل، وTTS، وعرض markdown)
- `talk.*` (وضع Talk)
  - `talk.silenceTimeoutMs`: عند عدم ضبطه، يحتفظ Talk بنافذة التوقف المؤقت الافتراضية للمنصة قبل إرسال النص (`700 ms على macOS وAndroid، و900 ms على iOS`)

## الأدوات والمزوّدون المخصصون

نُقلَت سياسة الأدوات، ومفاتيح التبديل التجريبية، وتهيئة الأدوات المدعومة من المزوّد، وإعداد المزوّد المخصص / base-URL إلى صفحة مخصصة — راجع
[التهيئة — الأدوات والمزوّدون المخصصون](/ar/gateway/config-tools).

## MCP

توجد تعريفات خوادم MCP المُدارة من OpenClaw ضمن `mcp.servers` وتُستهلك بواسطة Pi المضمن ومهايئات بيئات التشغيل الأخرى. وتدير أوامر `openclaw mcp list`,
و`show` و`set` و`unset` هذه الكتلة من دون الاتصال بالخادم
الهدف أثناء تعديلات التهيئة.

```json5
{
  mcp: {
    // اختياري. الافتراضي: 600000 ms (10 دقائق). اضبط 0 لتعطيل الإخلاء عند الخمول.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: تعريفات خوادم MCP مسماة عبر stdio أو عن بُعد لبيئات التشغيل التي
  تكشف أدوات MCP المهيأة.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لبيئات MCP المجمعة على مستوى الجلسة.
  تطلب التشغيلات المضمنة أحادية التشغيل التنظيف عند نهاية التشغيل؛ وتمثل مدة TTL هذه الحاجز الاحتياطي
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تُطبق التغييرات تحت `mcp.*` مباشرةً بإتلاف بيئات MCP المخبأة الخاصة بالجلسة.
  ويؤدي الاكتشاف/الاستخدام التالي للأداة إلى إعادة إنشائها من التهيئة الجديدة، بحيث تُزال
  إدخالات `mcp.servers` المحذوفة فورًا بدلًا من انتظار مدة TTL للخمول.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و
[واجهات CLI الخلفية](/ar/gateway/cli-backends#bundle-mcp-overlays) لسلوك وقت التشغيل.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: قائمة سماح اختيارية لـ Skills المجمعة فقط (لا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `install.preferBrew`: عندما تكون `true`، فُضّل أدوات التثبيت عبر Homebrew عندما يكون `brew`
  متاحًا قبل العودة إلى أنواع أدوات التثبيت الأخرى.
- `install.nodeManager`: تفضيل أداة تثبيت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` يعطل Skill حتى لو كانت مجمعة/مثبتة.
- `entries.<skillKey>.apiKey`: حقل مناسب لـ API key للـ Skills التي تعلن عن متغير env أساسي (سلسلة plaintext أو كائن SecretRef).

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

- تُحمّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins الأصلية لـ OpenClaw بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات التهيئة إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا تُحمّل إلا Plugins المدرجة). ويتغلب `deny`.
- `plugins.entries.<id>.apiKey`: حقل مناسب على مستوى Plugin لمفتاح API (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة env ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، تحظر النواة `before_prompt_build` وتتجاهل الحقول المعدِّلة للتلقين من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على hooks الأصلية لـ Plugin والدلائل المدعومة للـ hooks التي توفرها الحزم.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن للـ Plugins الموثوقة غير المجمعة قراءة محتوى المحادثة الخام من hooks مكتوبة مثل `llm_input` و`llm_output` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكيل الفرعي في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن تهيئة يعرّفه Plugin (ويتحقق منه schema الخاصة بـ Plugin الأصلية لـ OpenClaw عند توفرها).
- تعيش إعدادات الحساب/بيئة التشغيل الخاصة بـ Plugin القناة تحت `channels.<id>` ويجب وصفها عبر بيانات التعريف `channelConfigs` في manifest الخاصة بـ Plugin المالكة، وليس عبر سجل خيارات مركزي لـ OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزوّد الجلب من الويب Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). ويعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey`، أو `tools.web.fetch.firecrawl.apiKey` القديم، أو متغير env ‏`FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان API الأساسي لـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر لذاكرة التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخراج بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث Grok على الويب).
  - `enabled`: تمكين مزوّد X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل عملية اجتياح Dreaming كاملة (الافتراضي `"0 3 * * *"`).
  - سياسة المراحل والعتبات هي تفاصيل تنفيذ (وليست مفاتيح تهيئة موجهة للمستخدم).
- توجد تهيئة الذاكرة الكاملة في [مرجع تهيئة الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضًا لحزم Claude المفعلة أن تساهم بإعدادات Pi مضمنة من `settings.json`; ويطبق OpenClaw هذه كإعدادات وكيل منقحة، وليس كتصحيحات خام لتهيئة OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ والافتراضي `"legacy"` ما لم تثبّت محركًا آخر وتختَره.
- `plugins.installs`: بيانات تعريف التثبيت المُدارة عبر CLI والمستخدمة بواسطة `openclaw plugins update`.
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
      // dangerouslyAllowPrivateNetwork: true, // فعّل ذلك فقط للوصول الموثوق إلى شبكة خاصة
      // allowPrivateNetwork: true, // اسم مستعار قديم
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد وقت الخمول أو عندما
  تتجاوز الجلسة الحد الأقصى الخاص بها. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0`
  لتعطيل أوضاع التنظيف الفردية تلك.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلًا عند عدم ضبطه، لذا يظل تنقل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا في تنقل المتصفح عبر شبكة خاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات CDP الشخصية البعيدة (`profiles.*.cdpUrl`) للحظر نفسه الخاص بالشبكات الخاصة أثناء فحوصات الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للحصول على استثناءات صريحة.
- الملفات الشخصية البعيدة للربط فقط (بدء/إيقاف/إعادة تعيين معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw المسار `/json/version`; واستخدم WS(S)
  عندما يمنحك المزوّد عنوان DevTools WebSocket مباشرًا.
- تستخدم ملفات `existing-session` الشخصية Chrome MCP بدلًا من CDP ويمكنها الارتباط على
  المضيف المحدد أو عبر Node متصفح متصل.
- يمكن لملفات `existing-session` الشخصية ضبط `userDataDir` لاستهداف
  ملف شخصي محدد لمتصفح مبني على Chromium مثل Brave أو Edge.
- تحافظ ملفات `existing-session` الشخصية على حدود مسار Chrome MCP الحالية:
  إجراءات تعتمد على اللقطة/المرجع بدلًا من استهداف محددات CSS، وhooks
  رفع ملف واحد، وعدم وجود تجاوزات لمهلات مربعات الحوار، وعدم وجود `wait --load networkidle`، وكذلك لا يوجد
  `responsebody` أو تصدير PDF أو اعتراض للتنزيل أو إجراءات دفعية.
- تقوم ملفات `openclaw` الشخصية المحلية المُدارة بتعيين `cdpPort` و`cdpUrl` تلقائيًا؛
  ولا تضبط `cdpUrl` صراحةً إلا من أجل CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف الشخصي. استخدم ذلك لتشغيل ملف شخصي
  في Chrome وآخر في Brave.
- تستخدم الملفات الشخصية المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف HTTP الخاص بـ Chrome CDP
  بعد بدء العملية، و`browser.localCdpReadyTimeoutMs` من أجل
  جاهزية WebSocket الخاصة بـ CDP بعد الإطلاق. ارفع هذه القيم على المضيفات الأبطأ حيث يبدأ
  Chrome بنجاح لكن فحوصات الجاهزية تتسابق مع بدء التشغيل.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنيًا على Chromium ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يقبل `browser.executablePath` الرمز `~` لدليل المنزل الخاص بنظام التشغيل لديك.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` علامات تشغيل إضافية إلى بدء تشغيل Chromium المحلي (على سبيل المثال
  `--disable-gpu` أو تحديد حجم النافذة أو علامات التصحيح).

---

## واجهة المستخدم

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // رمز تعبيري أو نص قصير أو URL لصورة أو data URI
    },
  },
}
```

- `seamColor`: لون التمييز لعناصر واجهة المستخدم الأصلية في التطبيق (مثل تلوين فقاعة Talk Mode، وغيرها).
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
      // allowedOrigins: ["https://control.example.com"], // مطلوب لـ Control UI غير المعتمد على loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // وضع خطير للرجوع إلى الأصل عبر ترويسة Host
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
    nodes: {
      pairing: {
        // اختياري. الافتراضي غير مضبوط/معطل.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // حالات الرفض الإضافية لـ /tools/invoke عبر HTTP
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

- `mode`: ‏`local` ‏(تشغيل Gateway) أو `remote` ‏(الاتصال بـ Gateway بعيد). ويرفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الإرسال لكل من WS + HTTP. ترتيب الأولوية: ‏`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` ‏(افتراضي) أو `lan` ‏(`0.0.0.0`) أو `tailnet` ‏(عنوان Tailscale IP فقط) أو `custom`.
- **أسماء bind المستعارة القديمة**: استخدم قيم وضع bind في `gateway.bind` ‏(`auto` و`loopback` و`lan` و`tailnet` و`custom`) وليس الأسماء المستعارة للمضيف (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع شبكات Docker الجسرية (`-p 18789:18789`) تصل حركة المرور على `eth0`، لذلك يصبح Gateway غير قابل للوصول. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. وتتطلب عمليات bind غير المعتمدة على loopback مصادقة Gateway. ويعني ذلك عمليًا رمزًا/كلمة مرور مشتركة أو وكيلًا عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`. وينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا تم ضبط كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. وتفشل عمليات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون الاثنان مضبوطين ويكون mode غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ ولا يُعرض هذا عمدًا في مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى وكيل عكسي مدرك للهوية وثق في ترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth)). ويتوقع هذا الوضع مصدر وكيل **غير loopback**؛ إذ لا تستوفي الوكلاء العكسية loopback على المضيف نفسه مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve أن تستوفي مصادقة Control UI/WebSocket (ويتم التحقق منها عبر `tailscale whois`). أما نقاط نهاية HTTP API فلا تستخدم مصادقة ترويسة Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. ويفترض هذا التدفق من دون رمز أن مضيف Gateway موثوق. وتكون القيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. ويُطبق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع السر المشترك ورمز الجهاز بشكل مستقل). وتعِيد المحاولات المحظورة `429` + `Retry-After`.
  - في المسار غير المتزامن لـ Tailscale Serve Control UI، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. ولذلك يمكن أن تؤدي المحاولات السيئة المتزامنة من العميل نفسه إلى تشغيل المحدد في الطلب الثاني بدلًا من أن يمر الاثنان معًا كعدم تطابق عادي.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`; اضبطها على `false` عندما تريد عمدًا أن تخضع حركة localhost لتحديد المعدل أيضًا (لإعدادات الاختبار أو نشرات الوكيل الصارمة).
- تُخفَّض دائمًا محاولات مصادقة WS ذات أصل المتصفح مع تعطيل إعفاء loopback (دفاعًا إضافيًا ضد هجمات القوة الغاشمة على localhost المعتمدة على المتصفح).
- على loopback، تُعزل حالات القفل الناتجة عن أصل المتصفح حسب قيمة `Origin`
  المُسوّاة، بحيث لا يؤدي الفشل المتكرر من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` ‏(tailnet فقط، مع bind على loopback) أو `funnel` ‏(عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. وهي مطلوبة عندما يُتوقع عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى الأصل عبر ترويسة Host للنشرات التي تعتمد عمدًا على سياسة الأصل المستندة إلى ترويسة Host.
- `remote.transport`: ‏`ssh` ‏(افتراضي) أو `direct` ‏(ws/wss). وبالنسبة إلى `direct`، يجب أن تكون `remote.url` من نوع `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ على مستوى بيئة عملية العميل
  يسمح باستخدام `ws://` بنص صريح إلى عناوين IP خاصة موثوقة على الشبكات الخاصة؛
  وتظل القيمة الافتراضية مقتصرة على loopback فقط بالنسبة إلى النص الصريح. ولا يوجد
  ما يعادله في `openclaw.json`، كما أن تهيئة الشبكة الخاصة في المتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` لا تؤثر في عملاء Gateway
  عبر WebSocket.
- `gateway.remote.token` / `.password`: حقول بيانات اعتماد عميل بعيد. وهي لا تضبط مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي لمرحل APNs الخارجي المستخدم من قِبل إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالمرحل إلى Gateway. ويجب أن يطابق هذا العنوان عنوان المرحل المضمّن في إصدار iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. الافتراضي: `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. حيث يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال ضمن نطاق التسجيل إلى Gateway. ولا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات env مؤقتة لتهيئة المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ طوارئ مخصص للتطوير فقط لعناوين المرحل HTTP المعتمدة على loopback. ويجب أن تظل عناوين المرحل الإنتاجية على HTTPS.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القناة بالدقائق. اضبط `0` لتعطيل عمليات إعادة تشغيل مراقب الصحة على مستوى النظام ككل. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس الراكد بالدقائق. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لعمليات إعادة تشغيل مراقب الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. وعند ضبطه، تكون له أولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كبديل فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا تم ضبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يمكن تحليلها، يفشل التحليل بشكل مغلق (من دون إخفاء الفشل عبر بديل remote).
- `trustedProxies`: عناوين IP لوكلاء عكسيين ينهون TLS أو يحقنون ترويسات العميل المحوّلة. أدرج فقط الوكلاء الذين تتحكم بهم. وتظل إدخالات loopback صالحة لإعدادات الكشف المحلي/الوكيل على المضيف نفسه (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لاستخدام `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway الترويسة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك فشل مغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على أول اقتران لجهاز Node من دون نطاقات مطلوبة. وتكون معطلة عند عدم ضبطها. ولا يوافق هذا تلقائيًا على اقتران operator/browser/Control UI/WebChat، كما لا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل عام للسماح/المنع للأوامر المعلنة لـ Node بعد الاقتران وتقييم قائمة السماح.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP ‏`POST /tools/invoke` (توسّع قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة الرفض الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. فعّلها عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية اختيارية للرد:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل متعدد النسخ

شغّل عدة Gateways على مضيف واحد باستخدام منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

علامات مريحة: `--dev` ‏(يستخدم `~/.openclaw-dev` + المنفذ `19001`) و`--profile <name>` ‏(يستخدم `~/.openclaw-<name>`).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway ‏(HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محليًا موقّعًا ذاتيًا عندما لا تكون الملفات الصريحة مضبوطة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ ويجب تقييد أذوناته.
- `caPath`: مسار اختياري لحزمة CA من أجل التحقق من العميل أو سلاسل الثقة المخصصة.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: يتحكم في كيفية تطبيق تعديلات التهيئة وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير التهيئة.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (افتراضي): جرّب إعادة التحميل السريع أولًا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة اهتزاز بالمللي ثانية قبل تطبيق تغييرات التهيئة (عدد صحيح غير سالب).
- `deferralTimeoutMs`: أقصى وقت اختياري بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل. احذفه أو اضبطه على `0` للانتظار إلى أجل غير مسمى مع تسجيل تحذيرات دورية لا تزال معلقة.

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
يتم رفض رموز hook ضمن query-string.

ملاحظات التحقق والأمان:

- يتطلب `hooks.enabled=true` قيمة `hooks.token` غير فارغة.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`; ويُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` مساويًا لـ `/`; استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقيد `hooks.allowedSessionKeyPrefixes` (مثلًا `["hook:"]`).
- إذا كانت mapping أو preset تستخدم `sessionKey` ذا قوالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. أما مفاتيح mapping الثابتة فلا تتطلب هذا التفعيل الاختياري.

**نقاط النهاية:**

- `POST /hooks/wake` → ‏`{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → ‏`{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يتم تحليله عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` الخاصة بـ mapping المعروضة بالقوالب على أنها موردة خارجيًا، وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل Mapping">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → ‏`gmail`).
- يطابق `match.source` حقلًا من الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى ضمن `hooks.transformsDir` (وتُرفض المسارات المطلقة والتنقلات عبر المسار).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook من دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` ومفاتيح الجلسة الخاصة بـ mapping المعتمدة على القوالب بضبط `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + mapping)، مثل `["hook:"]`. وتصبح مطلوبة عندما تستخدم أي mapping أو preset قيمة `sessionKey` معتمدة على القوالب.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ وتكون `channel` افتراضيًا `last`.
- يتجاوز `model` نموذج LLM لهذا التشغيل الخاص بـ hook (ويجب أن يكون مسموحًا إذا كان كتالوج النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم Gmail preset المضمن القيمة `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا احتفظت بهذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيد `hooks.allowedSessionKeyPrefixes` لتطابق مساحة اسم Gmail، مثل `["hook:", "hook:gmail:"]`.
- إذا كنت بحاجة إلى `hooks.allowRequestSessionKey: false`، فقم بتجاوز preset باستخدام `sessionKey` ثابت بدلًا من القيمة الافتراضية المعتمدة على القوالب.

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

- يبدأ Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما تكون التهيئة موجودة. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
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

- يقدّم HTML/CSS/JS وA2UI القابلة للتحرير من الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- في عمليات bind غير المعتمدة على loopback: تتطلب مسارات canvas مصادقة Gateway ‏(token/password/trusted-proxy)، مثلها مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل WebViews الخاصة بـ Node عادةً ترويسات المصادقة؛ وبعد أن يتم اقتران Node واتصاله، يعلن Gateway عن عناوين capability ضمن نطاق Node للوصول إلى canvas/A2UI.
- ترتبط عناوين capability بجلسة WS النشطة لـ Node وتنتهي صلاحيتها بسرعة. ولا يُستخدم بديل قائم على IP.
- يحقن عميل live-reload في HTML المُقدّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
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

- `minimal` (افتراضي): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يضمّن `cliPath` + `sshPort`.
- يكون اسم المضيف افتراضيًا `openclaw`. ويمكن تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق ‏(DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية الإرسال تحت `~/.openclaw/dns/`. ولاكتشاف عبر الشبكات، قم بإقرانه مع خادم DNS ‏(يُوصى بـ CoreDNS) + DNS مقسم لـ Tailscale.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` ‏(متغيرات env مضمّنة)

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

- لا تُطبَّق متغيرات env المضمّنة إلا إذا كانت بيئة العملية تفتقد إلى المفتاح.
- ملفات `.env`: ملف `.env` في CWD + ‏`~/.openclaw/.env` (ولا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف shell لتسجيل الدخول.
- راجع [البيئة](/ar/help/environment) للاطلاع على الأولوية الكاملة.

### استبدال متغيرات env

ارجع إلى متغيرات env في أي سلسلة تهيئة باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- لا تُطابق إلا الأسماء المكتوبة بأحرف كبيرة: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل التهيئة.
- استخدم `$${VAR}` للهروب من أجل `${VAR}` حرفية.
- يعمل ذلك مع `$include`.

---

## الأسرار

تكون مراجع الأسرار إضافية: ولا تزال قيم plaintext تعمل.

### `SecretRef`

استخدم شكل كائن واحد:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` عند `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `id` عند `source: "file"`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط `id` عند `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة من نوع `.` أو `..` ‏(مثلًا تُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُضمَّن مراجع `auth-profiles.json` في تحليل وقت التشغيل وتغطية التدقيق.

### تهيئة مزوّدي الأسرار

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

- يدعم مزود `file` القيمتين `mode: "json"` و`mode: "singleValue"` ‏(ويجب أن تكون `id` مساوية لـ `"value"` في وضع singleValue).
- تفشل مسارات مزود file وexec بشكل مغلق عندما يكون التحقق من Windows ACL غير متاح. اضبط `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب مزود `exec` مسار `command` مطلقًا ويستخدم حمولات بروتوكول على stdin/stdout.
- تُرفض مسارات الأوامر الرمزية افتراضيًا. اضبط `allowSymlinkCommand: true` للسماح بالمسارات الرمزية مع التحقق من مسار الهدف المحلول.
- إذا كانت `trustedDirs` مضبوطة، فإن فحص الدليل الموثوق يُطبق على مسار الهدف المحلول.
- تكون بيئة العملية الفرعية لـ `exec` محدودة افتراضيًا؛ ومرّر المتغيرات المطلوبة صراحةً عبر `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب من اللقطة فقط.
- يُطبق ترشيح السطح النشط أثناء التفعيل: فتؤدي المراجع غير المحلولة على الأسطح المفعلة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

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

- تُخزن الملفات الشخصية لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- لا تدعم الملفات الشخصية في وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد الملفات الشخصية المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُنظف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- يتم الاستيراد القديم لـ OAuth من `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: مدة backoff الأساسية بالساعات عندما يفشل ملف شخصي بسبب
  أخطاء فعلية في الفوترة/عدم كفاية الرصيد (الافتراضي: `5`). ولا يزال من الممكن أن
  تقع نصوص الفوترة الصريحة هنا حتى في استجابات `401`/`403`، لكن
  تبقى مطابِقات النصوص الخاصة بالمزوّد ضمن نطاق المزوّد الذي يملكها
  (مثل OpenRouter ‏`Key limit exceeded`). أما رسائل `402` القابلة لإعادة المحاولة
  الخاصة بنافذة الاستخدام أو حد الإنفاق الخاص بالمؤسسة/مساحة العمل
  فتبقى ضمن مسار `rate_limit` بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزود لمدة backoff الخاصة بالفوترة بالساعات.
- `billingMaxHours`: حد أقصى بالساعات للنمو الأسي لمدة backoff الخاصة بالفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة backoff أساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: حد أقصى بالدقائق لنمو backoff الخاص بـ `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات backoff (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدويرات ملف المصادقة للمزوّد نفسه في حالة أخطاء التحميل الزائد قبل الانتقال إلى fallback للنموذج (الافتراضي: `1`). وتقع هنا الأشكال الخاصة بانشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة المحاولة مع مزوّد/تدوير ملف شخصي محمّل فوق طاقته (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدويرات ملف المصادقة للمزوّد نفسه في حالة أخطاء تحديد المعدل قبل الانتقال إلى fallback للنموذج (الافتراضي: `1`). وتتضمن مجموعة تحديد المعدل نصوصًا خاصة بالمزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل كبت عمليات الكتابة (عدد صحيح موجب؛ الافتراضي: `524288000` = 500 ميغابايت). استخدم تدوير سجلات خارجيًا في النشرات الإنتاجية.

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
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
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

- `enabled`: مفتاح التبديل الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات لتمكين مخرجات سجل مستهدفة (تدعم أحرفًا عامة مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر بالمللي ثانية لإصدار تحذيرات الجلسة العالقة بينما تظل الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry ‏(الافتراضي: `false`).
- `otel.endpoint`: عنوان المُجمِّع لتصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` ‏(افتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية HTTP/gRPC إضافية تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير trace أو metrics أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات trace بين `0` و`1`.
- `otel.flushIntervalMs`: فاصل التفريغ الدوري لبيانات telemetry بالمللي ثانية.
- `otel.captureContent`: التقاط اختياري للمحتوى الخام ضمن سمات OTel span. وهو معطل افتراضيًا. تؤدي القيمة المنطقية `true` إلى التقاط محتوى الرسائل/الأدوات غير الخاصة بالنظام؛ بينما يتيح شكل الكائن تمكين `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحةً.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح تبديل بيئة للمضيفات التي سجلت بالفعل OpenTelemetry SDK عامًا. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك لـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `cacheTrace.enabled`: تسجيل لقطات cache trace للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار خرج JSONL لـ cache trace (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم في ما يتم تضمينه في مخرجات cache trace (وجميعها افتراضيًا: `true`).

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
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable ‏(الافتراضي: `6`; الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية لقناة stable بالساعات (الافتراضي: `12`; الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد مرات تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`; الحد الأقصى: `24`).

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
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسة ACP ‏(الافتراضي: `true`). اضبطها على `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضي لبيئة تشغيل ACP ‏(يجب أن يطابق Plugin بيئة تشغيل ACP مسجلة).
- `defaultAgent`: معرّف وكيل ACP الاحتياطي عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات بيئة تشغيل ACP؛ وتعني القيمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة التفريغ عند الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم المقطع قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: قمع أسطر الحالة/الأداة المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تقوم `"live"` بالبث التدريجي؛ بينما تقوم `"final_only"` بالتخزين المؤقت حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف خرج المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف في أسطر الحالة/التحديث المعروضة لـ ACP.
- `stream.tagVisibility`: سجل من أسماء الوسوم إلى تجاوزات الرؤية المنطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعمال جلسة ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري للتشغيل عند تهيئة بيئة تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في نمط الشعار الفرعي:
  - `"random"` (افتراضي): شعارات فرعية مضحكة/موسمية متناوبة.
  - `"default"`: شعار فرعي ثابت ومحايد (`All your chats, one OpenClaw.`).
  - `"off"`: بدون نص شعار فرعي (مع بقاء عنوان/إصدار الشعار ظاهرًا).
- لإخفاء الشعار بالكامل (وليس الشعارات الفرعية فقط)، اضبط env ‏`OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية تكتبها تدفقات الإعداد الموجّهة في CLI ‏(`onboard` و`configure` و`doctor`):

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

راجع حقول الهوية في `agents.list` ضمن [إعدادات الوكيل الافتراضية](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، أزيل)

لم تعد الإصدارات الحالية تتضمن جسر TCP. وتتصل Node عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من schema الخاصة بالتهيئة (ويفشل التحقق حتى تُزال؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="تهيئة الجسر القديمة (مرجع تاريخي)">

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
    webhook: "https://example.invalid/legacy", // بديل قديم ومهمَل للوظائف المخزنة notify:true
    webhookToken: "replace-with-dedicated-token", // رمز bearer اختياري لمصادقة Webhook الصادرة
    sessionRetention: "24h", // سلسلة مدة أو false
    runLog: {
      maxBytes: "2mb", // الافتراضي 2_000_000 بايت
      keepLines: 2000, // الافتراضي 2000
    },
  },
}
```

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. كما تتحكم في تنظيف نصوص Cron المحذوفة المؤرشفة. الافتراضي: `24h`; اضبط `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى لحجم كل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي يتم الاحتفاظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز bearer المستخدم في تسليم POST الخاص بـ Cron Webhook ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلن يُرسل أي ترويسة مصادقة.
- `webhook`: عنوان Webhook قديم ومهمَل (http/https) يُستخدم فقط للوظائف المخزنة التي ما زالت تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للوظائف أحادية التشغيل عند الأخطاء العابرة (الافتراضي: `3`; النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات backoff بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`; من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تُطلق إعادة المحاولة — ‏`"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفه لإعادة المحاولة على جميع الأنواع العابرة.

ينطبق هذا فقط على وظائف Cron أحادية التشغيل. أما الوظائف المتكررة فلها معالجة فشل منفصلة.

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

- `enabled`: تمكين تنبيهات الفشل لوظائف Cron ‏(الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `mode`: وضع التسليم — تقوم `"announce"` بالإرسال عبر رسالة قناة؛ بينما تنشر `"webhook"` إلى Webhook المهيأ.
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
- `mode`: ‏`"announce"` أو `"webhook"`؛ وتكون `"announce"` افتراضيًا عندما توجد بيانات هدف كافية.
- `channel`: تجاوز للقناة لتسليم announce. وتعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان Webhook. وهو مطلوب لوضع Webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- تتجاوز `delivery.failureDestination` لكل وظيفة هذا الافتراضي العام.
- عندما لا يتم ضبط أي وجهة فشل عامة أو لكل وظيفة، فإن الوظائف التي ترسل بالفعل عبر `announce` تعود عند الفشل إلى هدف announce الأساسي ذلك.
- لا تكون `delivery.failureDestination` مدعومة إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [وظائف Cron](/ar/automation/cron-jobs). ويتم تتبع تنفيذات Cron المعزولة باعتبارها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قوالب نماذج الوسائط

العناصر النائبة للقوالب التي يتم توسيعها في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (من دون أغلفة السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات                 |
| `{{From}}`         | معرّف المرسل                                 |
| `{{To}}`           | معرّف الوجهة                            |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | عنوان URL شبهّي للوسائط الواردة                          |
| `{{MediaPath}}`    | المسار المحلي للوسائط                                  |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`   | نص تفريغ الصوت                                  |
| `{{Prompt}}`       | تلقين الوسائط المحلول لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الخرج لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)               |
| `{{SenderName}}`   | الاسم المعروض للمرسل (بأفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                 |
| `{{Provider}}`     | تلميح المزوّد (whatsapp أو telegram أو discord، إلخ) |

---

## تضمينات التهيئة (`$include`)

قسّم التهيئة إلى عدة ملفات:

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
- مصفوفة ملفات: تُدمج عميقًا بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (وتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف المُضمِّن، لكن يجب أن تبقى داخل دليل التهيئة الأعلى مستوى (`dirname` الخاص بـ `openclaw.json`). وتُسمح الأشكال المطلقة/`../` فقط إذا كانت لا تزال تُحل داخل هذا الحد.
- تقوم الكتابات المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى والمدعوم بتضمين ملف واحد بالكتابة مباشرة إلى ذلك الملف المضمَّن. على سبيل المثال، يقوم `plugins install` بتحديث `plugins: { $include: "./plugins.json5" }` داخل `plugins.json5` ويترك `openclaw.json` كما هو.
- تكون تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة إلى الكتابات المملوكة لـ OpenClaw؛ وتفشل هذه الكتابات بشكل مغلق بدلًا من تسطيح التهيئة.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [التهيئة](/ar/gateway/configuration) · [أمثلة التهيئة](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [التهيئة](/ar/gateway/configuration)
- [أمثلة التهيئة](/ar/gateway/configuration-examples)
