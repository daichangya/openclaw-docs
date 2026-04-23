---
read_when:
    - أنت تحتاج إلى سلوك مفصل للأمر `openclaw onboard`
    - أنت تستكشف أخطاء نتائج onboarding أو تدمج عملاء onboarding وإصلاحها
sidebarTitle: CLI reference
summary: المرجع الكامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والبنية الداخلية
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-04-23T07:33:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# مرجع إعداد CLI

هذه الصفحة هي المرجع الكامل للأمر `openclaw onboard`.
وللدليل المختصر، راجع [Onboarding (CLI)](/ar/start/wizard).

## ما الذي يفعله المعالج

يقودك الوضع المحلي (الافتراضي) عبر ما يلي:

- إعداد النموذج والمصادقة (OAuth لاشتراك OpenAI Code، وAnthropic Claude CLI أو مفتاح API، بالإضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات bootstrap
- إعدادات Gateway (المنفذ، والربط، والمصادقة، وTailscale)
- القنوات والموفّرين (Telegram وWhatsApp وDiscord وGoogle Chat وMattermost وSignal وBlueBubbles وغيرها من Plugins القنوات المضمّنة)
- تثبيت الخدمة الخلفية (LaunchAgent، أو وحدة systemd للمستخدم، أو Scheduled Task أصلية على Windows مع رجوع احتياطي إلى مجلد Startup)
- الفحص الصحي
- إعداد Skills

يضبط الوضع البعيد هذه الآلة للاتصال بـ Gateway موجود في مكان آخر.
ولا يقوم بتثبيت أو تعديل أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف التكوين الموجود">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر بين Keep أو Modify أو Reset.
    - لا يؤدي تشغيل المعالج مرة أخرى إلى مسح أي شيء ما لم تختر صراحةً Reset (أو تمرر `--reset`).
    - يستخدم `--reset` في CLI افتراضيًا النطاق `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كان التكوين غير صالح أو يحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - يستخدم Reset الأمر `trash` ويعرض النطاقات التالية:
      - التكوين فقط
      - التكوين + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)
  </Step>
  <Step title="النموذج والمصادقة">
    - توجد مصفوفة الخيارات الكاملة في [خيارات المصادقة والنموذج](#auth-and-model-options).
  </Step>
  <Step title="مساحة العمل">
    - القيمة الافتراضية هي `~/.openclaw/workspace` (قابلة للتكوين).
    - تزرع ملفات مساحة العمل اللازمة لطقس bootstrap عند أول تشغيل.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، وتعريض Tailscale.
    - الموصى به: الإبقاء على مصادقة token مفعلة حتى مع loopback حتى تضطر عملاء WS المحليون إلى المصادقة.
    - في وضع token، يعرض الإعداد التفاعلي:
      - **Generate/store plaintext token** (الافتراضي)
      - **Use SecretRef** (اختياري)
    - في وضع password، يدعم الإعداد التفاعلي أيضًا تخزين plaintext أو SecretRef.
    - مسار SecretRef غير التفاعلي للرمز: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية onboarding.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق بالكامل في كل عملية محلية.
    - لا تزال عمليات الربط غير loopback تتطلب مصادقة.
  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري
    - [Telegram](/ar/channels/telegram): رمز bot
    - [Discord](/ar/channels/discord): رمز bot
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز bot + Base URL
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + تكوين الحساب
    - [BlueBubbles](/ar/channels/bluebubbles): موصى به لـ iMessage؛ عنوان URL للخادم + كلمة مرور + Webhook
    - [iMessage](/ar/channels/imessage): مسار CLI القديم `imsg` + وصول قاعدة البيانات
    - أمان الرسائل المباشرة: الافتراضي هو pairing. ترسل أول رسالة مباشرة رمزًا؛ وافق عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="تثبيت الخدمة الخلفية">
    - macOS: ‏LaunchAgent
      - يتطلب جلسة مستخدم مسجّلة الدخول؛ وللتشغيل دون واجهة استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux وWindows عبر WSL2: وحدة systemd للمستخدم
      - يحاول المعالج تنفيذ `loginctl enable-linger <user>` حتى يبقى gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ ويحاول أولًا دون sudo.
    - Windows الأصلي: Scheduled Task أولًا
      - إذا رُفض إنشاء المهمة، يعود OpenClaw إلى عنصر تسجيل دخول لكل مستخدم داخل مجلد Startup ويبدأ gateway فورًا.
      - تظل Scheduled Tasks مفضلة لأنها توفر حالة supervisor أفضل.
    - اختيار بيئة التشغيل: Node (موصى به؛ ومطلوب لـ WhatsApp وTelegram). ‏Bun غير موصى به.
  </Step>
  <Step title="الفحص الصحي">
    - يبدأ gateway (إذا لزم الأمر) ويشغّل `openclaw health`.
    - يضيف `openclaw status --deep` فحص صحة gateway الحي إلى مخرجات الحالة، بما في ذلك فحوصات القنوات عند الدعم.
  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح لك اختيار مدير Node: ‏npm أو pnpm أو bun.
    - يثبت التبعيات الاختيارية (بعضها يستخدم Homebrew على macOS).
  </Step>
  <Step title="إنهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات تطبيقات iOS وAndroid وmacOS.
  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف واجهة رسومية، يطبع المعالج تعليمات إعادة توجيه منفذ SSH الخاصة بـ Control UI بدلًا من فتح متصفح.
وإذا كانت أصول Control UI مفقودة، يحاول المعالج بناءها؛ ومسار الرجوع الاحتياطي هو `pnpm ui:build` (ويثبت تبعيات UI تلقائيًا).
</Note>

## تفاصيل الوضع البعيد

يضبط الوضع البعيد هذه الآلة للاتصال بـ Gateway موجود في مكان آخر.

<Info>
لا يقوم الوضع البعيد بتثبيت أو تعديل أي شيء على المضيف البعيد.
</Info>

ما الذي تضبطه:

- عنوان URL لـ Gateway البعيد (`ws://...`)
- token إذا كانت مصادقة Gateway البعيد مطلوبة (موصى به)

<Note>
- إذا كان Gateway على loopback فقط، فاستخدم نفق SSH أو tailnet.
- تلميحات الاكتشاف:
  - macOS: ‏Bonjour ‏(`dns-sd`)
  - Linux: ‏Avahi ‏(`avahi-browse`)
</Note>

## خيارات المصادقة والنموذج

<AccordionGroup>
  <Accordion title="مفتاح API لـ Anthropic">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام الخدمة الخلفية.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code (OAuth)">
    تدفق متصفح؛ الصق `code#state`.

    يضبط `agents.defaults.model` إلى `openai-codex/gpt-5.4` عندما يكون النموذج غير مضبوط أو من نوع `openai/*`.

  </Accordion>
  <Accordion title="اشتراك OpenAI Code (اقتران الجهاز)">
    تدفق اقتران عبر المتصفح باستخدام رمز جهاز قصير العمر.

    يضبط `agents.defaults.model` إلى `openai-codex/gpt-5.4` عندما يكون النموذج غير مضبوط أو من نوع `openai/*`.

  </Accordion>
  <Accordion title="مفتاح API لـ OpenAI">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزن بيانات الاعتماد في ملفات تعريف المصادقة.

    يضبط `agents.defaults.model` إلى `openai/gpt-5.4` عندما يكون النموذج غير مضبوط، أو من نوع `openai/*`، أو `openai-codex/*`.

  </Accordion>
  <Accordion title="مفتاح API لـ xAI (Grok)">
    يطلب `XAI_API_KEY` ويضبط xAI كموفر نماذج.
  </Accordion>
  <Accordion title="OpenCode">
    يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`) ويتيح لك اختيار فهرس Zen أو Go.
    عنوان URL للإعداد: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="مفتاح API (عام)">
    يخزن المفتاح لك.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    يطلب `AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    يطلب معرّف الحساب، ومعرّف gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    يُكتب التكوين تلقائيًا. الافتراضي المستضاف هو `MiniMax-M2.7`؛ ويستخدم إعداد مفتاح API
    `minimax/...`، بينما يستخدم إعداد OAuth الصيغة `minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    يُكتب التكوين تلقائيًا لـ StepFun standard أو Step Plan على نقاط نهاية الصين أو النقاط العالمية.
    يتضمن Standard حاليًا `step-3.5-flash`، كما يتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (السحابة والنماذج المفتوحة المحلية)">
    يطلب أولًا `Cloud + Local` أو `Cloud only` أو `Local only`.
    يستخدم `Cloud only` المفتاح `OLLAMA_API_KEY` مع `https://ollama.com`.
    وتطلب الأوضاع المعتمدة على المضيف Base URL ‏(الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح القيم الافتراضية.
    كما يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama ذاك مسجّل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب تكوينات Moonshot ‏(Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="موفر مخصص">
    يعمل مع نقاط النهاية المتوافقة مع OpenAI والمتوافقة مع Anthropic.

    يدعم onboarding التفاعلي خيارات تخزين مفتاح API نفسها مثل تدفقات مفاتيح API الخاصة بالموفرين الآخرين:
    - **لصق مفتاح API الآن** (plaintext)
    - **استخدام مرجع سري** (مرجع env أو مرجع موفر مضبوط، مع تحقق مسبق)

    العلامات غير التفاعلية:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختياري؛ يعود إلى `CUSTOM_API_KEY`)
    - `--custom-provider-id` (اختياري)
    - `--custom-compatibility <openai|anthropic>` (اختياري؛ الافتراضي `openai`)

  </Accordion>
  <Accordion title="تخطي">
    يترك المصادقة غير مضبوطة.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل الموفر والنموذج يدويًا.
- عندما يبدأ onboarding من اختيار مصادقة موفر، يفضّل منتقي النماذج
  ذلك الموفّر تلقائيًا. وبالنسبة إلى Volcengine وBytePlus، تطابق هذه الأفضلية
  أيضًا متغيرات coding-plan الخاصة بهما (`volcengine-plan/*`,
  `byteplus-plan/*`).
- إذا كان هذا المرشح للمزوّد المفضّل فارغًا، يعود المنتقي إلى
  الفهرس الكامل بدلًا من إظهار عدم وجود نماذج.
- يشغّل المعالج فحصًا للنموذج ويحذّر إذا كان النموذج المضبوط غير معروف أو تنقصه المصادقة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): ‏`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: ‏`~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- يحفظ سلوك onboarding الافتراضي مفاتيح API كقيم plaintext داخل ملفات تعريف المصادقة.
- يفعّل `--secret-input-mode ref` وضع المرجع بدلًا من تخزين المفتاح بصيغة plaintext.
  في الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة (مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع موفر مضبوط (`file` أو `exec`) مع اسم مستعار للموفر + معرّف
- يشغّل وضع المرجع التفاعلي تحققًا مسبقًا سريعًا قبل الحفظ.
  - مراجع Env: يتحقق من اسم المتغير + القيمة غير الفارغة في بيئة onboarding الحالية.
  - مراجع الموفر: يتحقق من تكوين الموفّر ويحل المعرّف المطلوب.
  - إذا فشل التحقق المسبق، يعرض onboarding الخطأ ويتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` معتمدًا على env فقط.
  - اضبط متغير بيئة الموفّر داخل بيئة عملية onboarding.
  - تتطلب علامات المفاتيح المضمنة (مثل `--openai-api-key`) ضبط متغير env ذاك؛ وإلا يفشل onboarding بسرعة.
  - بالنسبة إلى الموفّرين المخصصين، يخزن وضع `ref` غير التفاعلي القيمة `models.providers.<id>.apiKey` على شكل `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة الموفّر المخصص هذه، يتطلب `--custom-api-key` ضبط `CUSTOM_API_KEY`؛ وإلا يفشل onboarding بسرعة.
- تدعم بيانات اعتماد مصادقة Gateway خيارات plaintext وSecretRef في الإعداد التفاعلي:
  - وضع Token: ‏**Generate/store plaintext token** (الافتراضي) أو **Use SecretRef**.
  - وضع Password: ‏plaintext أو SecretRef.
- مسار SecretRef غير التفاعلي للرمز: ‏`--gateway-token-ref-env <ENV_VAR>`.
- تستمر إعدادات plaintext الحالية في العمل من دون تغيير.

<Note>
نصيحة للخوادم والبيئات الرأسية: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
ملف `auth-profiles.json` الخاص بذلك الوكيل (مثل
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو
المسار المطابق `.../$OPENCLAW_STATE_DIR`) إلى مضيف gateway. أما `credentials/oauth.json`
فهو مجرد مصدر استيراد قديم.
</Note>

## المخرجات والبنية الداخلية

الحقول الشائعة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار MiniMax)
- `tools.profile` (يضبط onboarding المحلي هذا الحقل افتراضيًا على `"coding"` عندما لا يكون معيّنًا؛ وتُحفَظ القيم الصريحة الموجودة)
- `gateway.*` ‏(mode، bind، auth، tailscale)
- `session.dmScope` (يضبط onboarding المحلي هذا الحقل افتراضيًا على `per-channel-peer` عندما لا يكون معيّنًا؛ وتُحفَظ القيم الصريحة الموجودة)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- قوائم السماح للقنوات (Slack وDiscord وMatrix وMicrosoft Teams) عندما تختار الاشتراك أثناء المطالبات (تُحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا)
- `skills.install.nodeManager`
  - تقبل العلامة `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بالإمكان ضبط `skills.install.nodeManager: "yarn"` يدويًا لاحقًا في التكوين.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` وإلى `bindings` الاختيارية.

تذهب بيانات اعتماد WhatsApp إلى `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزَّن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
تُسلَّم بعض القنوات كـ Plugins. وعند اختيارها أثناء الإعداد، يطلب المعالج
تثبيت Plugin ‏(npm أو مسار محلي) قبل تكوين القناة.
</Note>

‏Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات من دون إعادة تنفيذ منطق onboarding.

سلوك إعداد Signal:

- ينزّل أصل الإصدار المناسب
- يخزّنه تحت `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في التكوين
- تتطلب إصدارات JVM وجود Java 21
- تُستخدم الإصدارات الأصلية عندما تكون متاحة
- يستخدم Windows ‏WSL2 ويتبع تدفق signal-cli الخاص بـ Linux داخل WSL

## مستندات ذات صلة

- مركز onboarding: ‏[Onboarding (CLI)](/ar/start/wizard)
- الأتمتة والسكربتات: ‏[CLI Automation](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
