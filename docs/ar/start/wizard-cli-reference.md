---
read_when:
    - تحتاج إلى سلوك مفصل للأمر `openclaw onboard`
    - أنت تقوم بتصحيح نتائج الإعداد الأولي أو دمج عملاء الإعداد الأولي
sidebarTitle: CLI reference
summary: المرجع الكامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والآليات الداخلية
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-04-25T13:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

هذه الصفحة هي المرجع الكامل للأمر `openclaw onboard`.
وللحصول على الدليل المختصر، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## ما الذي يفعله المعالج

يرشدك الوضع المحلي (الافتراضي) خلال:

- إعداد النموذج والمصادقة (OAuth لاشتراك OpenAI Code، أو Anthropic Claude CLI أو مفتاح API، بالإضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات التهيئة الأولية
- إعدادات Gateway (المنفذ، والربط، والمصادقة، وTailscale)
- القنوات والموفّرين (Telegram وWhatsApp وDiscord وGoogle Chat وMattermost وSignal وBlueBubbles، وغيرها من Plugins القنوات المضمّنة)
- تثبيت daemon ‏(LaunchAgent، أو وحدة systemd للمستخدم، أو Scheduled Task أصلية في Windows مع رجوع احتياطي إلى مجلد Startup)
- فحص الصحة
- إعداد Skills

يهيّئ الوضع البعيد هذا الجهاز للاتصال بـ Gateway موجود في مكان آخر.
وهو لا يثبّت أو يعدّل أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="كشف الإعداد الحالي">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر الاحتفاظ أو التعديل أو إعادة الضبط.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء ما لم تختر صراحة إعادة الضبط (أو تمرر `--reset`).
    - يستخدم `--reset` في CLI افتراضيًا النطاق `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كانت التهيئة غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة الضبط `trash` وتعرض نطاقات:
      - التهيئة فقط
      - التهيئة + بيانات الاعتماد + الجلسات
      - إعادة ضبط كاملة (تزيل مساحة العمل أيضًا)
  </Step>
  <Step title="النموذج والمصادقة">
    - مصفوفة الخيارات الكاملة موجودة في [خيارات المصادقة والنموذج](#auth-and-model-options).
  </Step>
  <Step title="مساحة العمل">
    - الافتراضي `~/.openclaw/workspace` (قابل للتهيئة).
    - يزرع ملفات مساحة العمل اللازمة لطقس التهيئة الأولية لأول تشغيل.
    - تخطيط مساحة العمل: [مساحة عمل agent](/ar/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، وتعريض Tailscale.
    - الموصى به: إبقاء مصادقة الرمز المميز مفعلة حتى مع local loopback بحيث يتعين على عملاء WS المحليين المصادقة.
    - في وضع الرمز المميز، يقدّم الإعداد التفاعلي:
      - **إنشاء/تخزين رمز مميز بنص صريح** (الافتراضي)
      - **استخدام SecretRef** (اختياري)
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو عبر SecretRef.
    - مسار SecretRef غير التفاعلي للرمز المميز: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق بالكامل في كل عملية محلية.
    - تتطلب الارتباطات غير loopback أيضًا المصادقة.
  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري
    - [Telegram](/ar/channels/telegram): رمز مميز للبوت
    - [Discord](/ar/channels/discord): رمز مميز للبوت
    - [Google Chat](/ar/channels/googlechat): JSON حساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز مميز للبوت + عنوان URL أساسي
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + إعداد الحساب
    - [BlueBubbles](/ar/channels/bluebubbles): موصى به لـ iMessage؛ عنوان URL للخادم + كلمة المرور + Webhook
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI القديم + الوصول إلى قاعدة البيانات
    - أمان الرسائل الخاصة: الافتراضي هو الاقتران. ترسل أول رسالة خاصة رمزًا؛ وافق عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="تثبيت daemon">
    - macOS: ‏LaunchAgent
      - يتطلب جلسة مستخدم مسجل الدخول؛ وللوضع عديم الواجهة، استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux وWindows عبر WSL2: وحدة systemd للمستخدم
      - يحاول المعالج تنفيذ `loginctl enable-linger <user>` حتى يبقى Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ ويحاول أولًا من دون sudo.
    - Windows الأصلي: ‏Scheduled Task أولًا
      - إذا تم رفض إنشاء المهمة، يعود OpenClaw إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup ويبدأ Gateway فورًا.
      - تبقى Scheduled Tasks مفضلة لأنها توفر حالة مشرف أفضل.
    - اختيار وقت التشغيل: Node (موصى به؛ ومطلوب لـ WhatsApp وTelegram). ولا يُنصح بـ Bun.
  </Step>
  <Step title="فحص الصحة">
    - يبدأ Gateway (عند الحاجة) ويشغّل `openclaw health`.
    - يضيف `openclaw status --deep` مسبار صحة Gateway المباشر إلى مخرجات الحالة، بما في ذلك مجسات القنوات عند الدعم.
  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويفحص المتطلبات.
    - يتيح لك اختيار مدير Node: ‏npm، أو pnpm، أو bun.
    - يثبّت التبعيات الاختيارية (يستخدم بعضها Homebrew على macOS).
  </Step>
  <Step title="الإنهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات تطبيقات iOS وAndroid وmacOS.
  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف واجهة رسومية، يطبع المعالج تعليمات إعادة توجيه منفذ SSH لـ Control UI بدلًا من فتح متصفح.
وإذا كانت أصول Control UI مفقودة، يحاول المعالج بناءها؛ والمسار الاحتياطي هو `pnpm ui:build` (يثبّت تبعيات UI تلقائيًا).
</Note>

## تفاصيل الوضع البعيد

يهيئ الوضع البعيد هذا الجهاز للاتصال بـ Gateway موجود في مكان آخر.

<Info>
لا يثبّت الوضع البعيد أو يعدّل أي شيء على المضيف البعيد.
</Info>

ما الذي تضبطه:

- عنوان URL لـ Gateway البعيد (`ws://...`)
- الرمز المميز إذا كانت مصادقة Gateway البعيد مطلوبة (موصى به)

<Note>
- إذا كان Gateway مقصورًا على loopback فقط، فاستخدم نفق SSH أو tailnet.
- تلميحات الاكتشاف:
  - macOS: ‏Bonjour (`dns-sd`)
  - Linux: ‏Avahi (`avahi-browse`)
</Note>

## خيارات المصادقة والنموذج

<AccordionGroup>
  <Accordion title="مفتاح API لـ Anthropic">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام daemon.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code ‏(OAuth)">
    تدفق متصفح؛ الصق `code#state`.

    يضبط `agents.defaults.model` إلى `openai-codex/gpt-5.5` عندما يكون النموذج غير معيّن أو من عائلة OpenAI بالفعل.

  </Accordion>
  <Accordion title="اشتراك OpenAI Code ‏(اقتران الجهاز)">
    تدفق اقتران في المتصفح مع رمز جهاز قصير العمر.

    يضبط `agents.defaults.model` إلى `openai-codex/gpt-5.5` عندما يكون النموذج غير معيّن أو من عائلة OpenAI بالفعل.

  </Accordion>
  <Accordion title="مفتاح API لـ OpenAI">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزن بيانات الاعتماد في ملفات تعريف المصادقة.

    يضبط `agents.defaults.model` إلى `openai/gpt-5.4` عندما يكون النموذج غير معيّن، أو `openai/*`، أو `openai-codex/*`.

  </Accordion>
  <Accordion title="مفتاح API لـ xAI ‏(Grok)">
    يطلب `XAI_API_KEY` ويهيئ xAI كموفّر نماذج.
  </Accordion>
  <Accordion title="OpenCode">
    يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`) ويتيح لك اختيار فهرس Zen أو Go.
    عنوان URL للإعداد: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="مفتاح API ‏(عام)">
    يخزّن المفتاح نيابة عنك.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    يطلب `AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    يطلب معرّف الحساب، ومعرّف Gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    تُكتب التهيئة تلقائيًا. الافتراضي المستضاف هو `MiniMax-M2.7`؛ ويستخدم إعداد مفتاح API
    `minimax/...`، بينما يستخدم إعداد OAuth ‏`minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    تُكتب التهيئة تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط نهاية الصين أو العالمية.
    يتضمن القياسي حاليًا `step-3.5-flash`، ويتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (نماذج سحابية ومحلية مفتوحة)">
    يطلب أولًا `Cloud + Local`، أو `Cloud only`، أو `Local only`.
    يستخدم `Cloud only` المتغير `OLLAMA_API_KEY` مع `https://ollama.com`.
    تطلب الأوضاع المدعومة بالمضيف عنوان URL الأساسي (الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح افتراضيات.
    ويتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب إعدادات Moonshot ‏(Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="موفّر مخصص">
    يعمل مع نقاط نهاية متوافقة مع OpenAI ومتوافقة مع Anthropic.

    يدعم الإعداد الأولي التفاعلي خيارات تخزين مفتاح API نفسها الموجودة في تدفقات مفاتيح API الأخرى للموفّرين:
    - **ألصق مفتاح API الآن** (نص صريح)
    - **استخدم مرجعًا سريًا** (مرجع بيئة أو مرجع موفّر مهيأ، مع تحقق تمهيدي مسبق)

    الأعلام غير التفاعلية:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختياري؛ يعود إلى `CUSTOM_API_KEY`)
    - `--custom-provider-id` (اختياري)
    - `--custom-compatibility <openai|anthropic>` (اختياري؛ الافتراضي `openai`)

  </Accordion>
  <Accordion title="تخطي">
    يترك المصادقة غير مهيأة.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل الموفّر والنموذج يدويًا.
- عندما يبدأ الإعداد الأولي من اختيار مصادقة موفّر، يفضّل منتقي النماذج
  ذلك الموفّر تلقائيًا. وبالنسبة إلى Volcengine وBytePlus، تطابق الأفضلية نفسها
  أيضًا متغيرات خطة البرمجة الخاصة بهما (`volcengine-plan/*`,
  `byteplus-plan/*`).
- إذا كان عامل التصفية المفضل لذلك الموفّر سيصبح فارغًا، يعود المنتقي إلى
  الفهرس الكامل بدلًا من عرض لا شيء.
- يشغّل المعالج فحصًا للنموذج ويحذّر إذا كان النموذج المهيأ غير معروف أو كانت المصادقة مفقودة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: `~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- يخزّن سلوك الإعداد الأولي الافتراضي مفاتيح API كقيم بنص صريح في ملفات تعريف المصادقة.
- يفعّل `--secret-input-mode ref` وضع المراجع بدلًا من تخزين المفاتيح بنص صريح.
  وفي الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة (على سبيل المثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع موفّر مهيأ (`file` أو `exec`) مع اسم مستعار للموفّر + معرّف
- يشغّل وضع المراجع التفاعلي تحققًا تمهيديًا سريعًا قبل الحفظ.
  - مراجع البيئة: يتحقق من اسم المتغير + القيمة غير الفارغة في بيئة الإعداد الأولي الحالية.
  - مراجع الموفّر: يتحقق من تهيئة الموفّر ويحل المعرف المطلوب.
  - إذا فشل التحقق التمهيدي، يعرض الإعداد الأولي الخطأ ويتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` مدعومًا بالبيئة فقط.
  - اضبط متغير بيئة الموفّر في بيئة عملية الإعداد الأولي.
  - تتطلب أعلام المفاتيح المضمنة (مثل `--openai-api-key`) أن يكون متغير البيئة مضبوطًا؛ وإلا يفشل الإعداد الأولي سريعًا.
  - بالنسبة إلى الموفّرين المخصصين، يخزّن وضع `ref` غير التفاعلي `models.providers.<id>.apiKey` بالشكل `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة الموفّر المخصص هذه، يتطلب `--custom-api-key` أن يكون `CUSTOM_API_KEY` مضبوطًا؛ وإلا يفشل الإعداد الأولي سريعًا.
- تدعم بيانات اعتماد مصادقة Gateway خيارات النص الصريح وSecretRef في الإعداد التفاعلي:
  - وضع الرمز المميز: **إنشاء/تخزين رمز مميز بنص صريح** (الافتراضي) أو **استخدام SecretRef**.
  - وضع كلمة المرور: نص صريح أو SecretRef.
- مسار SecretRef غير التفاعلي للرمز المميز: `--gateway-token-ref-env <ENV_VAR>`.
- تستمر الإعدادات الحالية ذات النص الصريح في العمل كما هي.

<Note>
نصيحة للخوادم والبيئات عديمة الواجهة: أكمل OAuth على جهاز يملك متصفحًا، ثم انسخ
`auth-profiles.json` لذلك الـ agent (على سبيل المثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو المسار المطابق
`$OPENCLAW_STATE_DIR/...`) إلى مضيف Gateway. أما `credentials/oauth.json`
فهو مجرد مصدر استيراد قديم.
</Note>

## المخرجات والآليات الداخلية

الحقول المعتادة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` عند تمرير `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (يضبط الإعداد الأولي المحلي هذا افتراضيًا على `"coding"` عندما لا يكون معينًا؛ وتُحفَظ القيم الصريحة الموجودة)
- `gateway.*` (الوضع، والربط، والمصادقة، وTailscale)
- `session.dmScope` (يضبط الإعداد الأولي المحلي هذا افتراضيًا على `per-channel-peer` عندما لا يكون معينًا؛ وتُحفَظ القيم الصريحة الموجودة)
- `channels.telegram.botToken`، و`channels.discord.token`، و`channels.matrix.*`، و`channels.signal.*`، و`channels.imessage.*`
- قوائم السماح الخاصة بالقنوات (Slack وDiscord وMatrix وMicrosoft Teams) عندما تختار ذلك أثناء المطالبات (تُحل الأسماء إلى معرّفات عند الإمكان)
- `skills.install.nodeManager`
  - يقبل العلم `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بالإمكان ضبط التهيئة يدويًا لاحقًا إلى `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

تنتقل بيانات اعتماد WhatsApp إلى `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزَّن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
تُسلَّم بعض القنوات على شكل Plugins. وعند اختيارها أثناء الإعداد، يطلب المعالج
تثبيت Plugin (من npm أو من مسار محلي) قبل تهيئة القناة.
</Note>

‏Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات دون إعادة تنفيذ منطق الإعداد الأولي.

سلوك إعداد Signal:

- ينزّل أصل الإصدار المناسب
- يخزّنه تحت `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في التهيئة
- تتطلب إصدارات JVM وجود Java 21
- تُستخدم الإصدارات الأصلية عند توفرها
- يستخدم Windows بيئة WSL2 ويتبع تدفق `signal-cli` الخاص بـ Linux داخل WSL

## مستندات ذات صلة

- مركز الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- الأتمتة والبرامج النصية: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
