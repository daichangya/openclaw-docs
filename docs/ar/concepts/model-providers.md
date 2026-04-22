---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج مزودًا بمزود
    - أنت تريد أمثلة على التهيئة أو أوامر Onboarding عبر CLI لمزودي النماذج
summary: نظرة عامة على مزودي النماذج مع أمثلة على التهيئة وتدفقات CLI
title: مزودو النماذج
x-i18n:
    generated_at: "2026-04-22T04:22:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# مزودو النماذج

تغطي هذه الصفحة **مزودي LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram).
للاطلاع على قواعد اختيار النموذج، راجع [/concepts/models](/ar/concepts/models).

## قواعد سريعة

- تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
- إذا عيّنت `agents.defaults.models`، فستصبح قائمة السماح.
- مساعدات CLI: `openclaw onboard`، و`openclaw models list`، و`openclaw models set <provider/model>`.
- قواعد runtime الاحتياطية، وفحوصات التهدئة، واستمرارية تجاوزات الجلسات موثقة
  في [/concepts/model-failover](/ar/concepts/model-failover).
- `models.providers.*.models[].contextWindow` هي بيانات التعريف الأصلية للنموذج؛
  أما `models.providers.*.models[].contextTokens` فهو الحد الفعلي في runtime.
- يمكن لـ Plugins المزود حقن فهارس النماذج عبر `registerProvider({ catalog })`؛
  ويدمج OpenClaw هذا الناتج في `models.providers` قبل كتابة
  `models.json`.
- يمكن لبيانات تعريف المزود إعلان `providerAuthEnvVars` و
  `providerAuthAliases` بحيث لا تحتاج فحوصات المصادقة العامة المعتمدة على env ومتغيرات المزود
  إلى تحميل runtime الـ Plugin. أما خريطة متغيرات env الأساسية المتبقية فهي الآن
  فقط للمزودين الأساسيين/غير المعتمدين على Plugin وبعض حالات الأسبقية العامة
  مثل Onboarding الخاص بـ Anthropic القائم على مفتاح API أولًا.
- يمكن لـ Plugins المزود أيضًا امتلاك سلوك runtime الخاص بالمزود عبر
  `normalizeModelId` و`normalizeTransport` و`normalizeConfig`،
  و`applyNativeStreamingUsageCompat`، و`resolveConfigApiKey`،
  و`resolveSyntheticAuth`، و`shouldDeferSyntheticProfileAuth`،
  و`resolveDynamicModel`، و`prepareDynamicModel`،
  و`normalizeResolvedModel`، و`contributeResolvedModelCompat`،
  و`capabilities`، و`normalizeToolSchemas`،
  و`inspectToolSchemas`، و`resolveReasoningOutputMode`،
  و`prepareExtraParams`، و`createStreamFn`، و`wrapStreamFn`،
  و`resolveTransportTurnState`، و`resolveWebSocketSessionPolicy`،
  و`createEmbeddingProvider`، و`formatApiKey`، و`refreshOAuth`،
  و`buildAuthDoctorHint`،
  و`matchesContextOverflowError`، و`classifyFailoverReason`،
  و`isCacheTtlEligible`، و`buildMissingAuthMessage`، و`suppressBuiltInModel`،
  و`augmentModelCatalog`، و`resolveThinkingProfile`، و`isBinaryThinking`،
  و`supportsXHighThinking`، و`resolveDefaultThinkingLevel`،
  و`applyConfigDefaults`، و`isModernModelRef`،
  و`prepareRuntimeAuth`، و`resolveUsageAuth`، و`fetchUsageSnapshot`، و
  `onModelSelected`.
- ملاحظة: إن `capabilities` في runtime الخاص بالمزود هي بيانات تعريف runner مشتركة (عائلة المزود، وملاحظات transcript/tooling، وتلميحات النقل/التخزين المؤقت). وهي ليست نفسها [نموذج الإمكانات العام](/ar/plugins/architecture#public-capability-model)
  الذي يصف ما الذي يسجله Plugin (استدلال نصي، وكلام، وغير ذلك).
- المزود المضمّن `codex` مقترن بحزمة وكيل Codex المضمّنة.
  استخدم `codex/gpt-*` عندما تريد تسجيل الدخول الذي يملكه Codex، واكتشاف النماذج، واستئناف thread الأصلي، وتنفيذ app-server. أما المراجع العادية `openai/gpt-*` فتستمر
  في استخدام مزود OpenAI ونقل المزود العادي في OpenClaw.
  ويمكن لعمليات النشر المعتمدة على Codex فقط تعطيل الرجوع التلقائي إلى PI عبر
  `agents.defaults.embeddedHarness.fallback: "none"`؛ راجع
  [Codex Harness](/ar/plugins/codex-harness).

## السلوك المملوك لـ Plugin الخاص بالمزود

يمكن لـ Plugins المزود الآن امتلاك معظم المنطق الخاص بالمزود بينما يحتفظ OpenClaw
بحلقة الاستدلال العامة.

التقسيم المعتاد:

- `auth[].run` / `auth[].runNonInteractive`: يمتلك المزود تدفقات
  Onboarding/تسجيل الدخول الخاصة بـ `openclaw onboard` و`openclaw models auth` والإعداد بدون واجهة
- `wizard.setup` / `wizard.modelPicker`: يمتلك المزود تسميات خيارات المصادقة،
  والأسماء المستعارة القديمة، وتلميحات قائمة السماح في Onboarding، وإدخالات الإعداد في أدوات اختيار Onboarding/النموذج
- `catalog`: يظهر المزود في `models.providers`
- `normalizeModelId`: يقوم المزود بتطبيع معرّفات النماذج القديمة/التجريبية قبل
  البحث أو التحويل إلى الصيغة القياسية
- `normalizeTransport`: يطبع المزود `api` / `baseUrl` لعائلة النقل
  قبل التجميع العام للنموذج؛ ويفحص OpenClaw المزود المطابق أولًا،
  ثم Plugins المزود الأخرى القادرة على hook حتى يغير أحدها
  النقل فعليًا
- `normalizeConfig`: يطبع المزود تهيئة `models.providers.<id>` قبل
  استخدامها في runtime؛ ويفحص OpenClaw المزود المطابق أولًا، ثم Plugins المزود
  الأخرى القادرة على hook حتى يغير أحدها التهيئة فعليًا. وإذا لم
  تعِد أي hook خاصة بالمزود كتابة التهيئة، فستظل مساعدات Google-family المضمّنة
  تطبع إدخالات مزود Google المدعومة.
- `applyNativeStreamingUsageCompat`: يطبق المزود إعادات كتابة التوافق الخاصة باستخدام البث الأصلي والمدفوعة بنقطة النهاية لمزودي التهيئة
- `resolveConfigApiKey`: يحل المزود مصادقة env-marker لمزودي التهيئة
  دون فرض تحميل مصادقة runtime كاملة. كما أن `amazon-bedrock` لديه أيضًا
  محلل AWS env-marker مضمّن هنا، رغم أن مصادقة Bedrock في runtime تستخدم
  سلسلة AWS SDK الافتراضية.
- `resolveSyntheticAuth`: يمكن للمزود عرض توفر المصادقة المحلية/المستضافة ذاتيًا
  أو المصادقة الأخرى المدعومة بالتهيئة دون حفظ أسرار نصية صريحة
- `shouldDeferSyntheticProfileAuth`: يمكن للمزود تعليم عناصر
  synthetic profile المخزنة على أنها أقل أسبقية من المصادقة المدعومة بـ env/التهيئة
- `resolveDynamicModel`: يقبل المزود معرّفات النماذج غير الموجودة بعد في الفهرس
  الثابت المحلي
- `prepareDynamicModel`: يحتاج المزود إلى تحديث بيانات التعريف قبل إعادة محاولة
  الحل الديناميكي
- `normalizeResolvedModel`: يحتاج المزود إلى إعادة كتابة النقل أو base URL
- `contributeResolvedModelCompat`: يساهم المزود بأعلام التوافق لنماذج البائع الخاصة به
  حتى عندما تصل عبر نقل متوافق آخر
- `capabilities`: ينشر المزود الملاحظات الخاصة بـ transcript/tooling/provider-family
- `normalizeToolSchemas`: ينظف المزود مخططات الأدوات قبل أن يراها
  embedded runner
- `inspectToolSchemas`: يعرض المزود تحذيرات المخطط الخاصة بالنقل
  بعد التطبيع
- `resolveReasoningOutputMode`: يختار المزود عقود مخرجات الاستدلال الأصلية أو الموسومة
- `prepareExtraParams`: يعيّن المزود القيم الافتراضية أو يطبع معلمات الطلب لكل نموذج
- `createStreamFn`: يستبدل المزود مسار البث العادي بنقل مخصص بالكامل
- `wrapStreamFn`: يطبق المزود أغلفة توافق الطلب/الرؤوس/الجسم/النموذج
- `resolveTransportTurnState`: يوفّر المزود رؤوس أو بيانات تعريف أصلية للنقل لكل دورة
- `resolveWebSocketSessionPolicy`: يوفّر المزود رؤوس جلسة WebSocket أصلية
  أو سياسة تهدئة الجلسة
- `createEmbeddingProvider`: يمتلك المزود سلوك Embedding الخاص بالذاكرة عندما
  يكون من الأنسب أن يعيش داخل Plugin المزود بدلًا من switchboard الأساسي للـ Embedding
- `formatApiKey`: ينسّق المزود ملفات تعريف المصادقة المخزنة إلى سلسلة
  `apiKey` الخاصة بـ runtime والمتوقعة من النقل
- `refreshOAuth`: يمتلك المزود تحديث OAuth عندما لا تكفي
  آليات التحديث المشتركة `pi-ai`
- `buildAuthDoctorHint`: يضيف المزود إرشادات الإصلاح عندما يفشل
  تحديث OAuth
- `matchesContextOverflowError`: يتعرف المزود على أخطاء تجاوز
  نافذة السياق الخاصة بالمزود والتي قد تفوتها الاستدلالات العامة
- `classifyFailoverReason`: يربط المزود أخطاء النقل/API الخام الخاصة بالمزود
  بأسباب الرجوع مثل حد المعدل أو الحمل الزائد
- `isCacheTtlEligible`: يقرر المزود أي معرّفات النماذج العليا تدعم TTL لذاكرة prompt المؤقتة
- `buildMissingAuthMessage`: يستبدل المزود خطأ مخزن المصادقة العام
  بتلميح استرداد خاص بالمزود
- `suppressBuiltInModel`: يخفي المزود الصفوف العليا القديمة ويمكنه إرجاع
  خطأ مملوك للبائع عند فشل الحل المباشر
- `augmentModelCatalog`: يضيف المزود صفوف فهرس synthetic/نهائية بعد
  الاكتشاف ودمج التهيئة
- `resolveThinkingProfile`: يمتلك المزود المجموعة الدقيقة لمستويات `/think`،
  وتسميات العرض الاختيارية، والمستوى الافتراضي للنموذج المحدد
- `isBinaryThinking`: hook توافق لواجهة تشغيل/إيقاف التفكير الثنائية
- `supportsXHighThinking`: hook توافق لنماذج `xhigh` المحددة
- `resolveDefaultThinkingLevel`: hook توافق لسياسة `/think` الافتراضية
- `applyConfigDefaults`: يطبق المزود الإعدادات الافتراضية العامة الخاصة بالمزود
  أثناء تجسيد التهيئة بناءً على وضع المصادقة أو env أو عائلة النموذج
- `isModernModelRef`: يمتلك المزود مطابقة النموذج المفضل الحي/لـ smoke
- `prepareRuntimeAuth`: يحول المزود بيانات الاعتماد المهيأة إلى
  رمز runtime قصير العمر
- `resolveUsageAuth`: يحل المزود بيانات اعتماد الاستخدام/الحصة الخاصة بـ `/usage`
  والأسطح المرتبطة بالحالة/التقارير
- `fetchUsageSnapshot`: يمتلك المزود جلب/تحليل نقطة نهاية الاستخدام بينما
  يظل الأساس مسؤولًا عن غلاف الملخص والتنسيق
- `onModelSelected`: يشغّل المزود تأثيرات لاحقة بعد الاختيار مثل
  telemetry أو حفظ الجلسة المملوك للمزود

الأمثلة المضمّنة الحالية:

- `anthropic`: رجوع احتياطي متوافق مستقبلًا لـ Claude 4.6، وتلميحات إصلاح المصادقة، وجلب نقطة نهاية الاستخدام، وبيانات تعريف cache-TTL/provider-family، والإعدادات العامة الافتراضية الواعية بالمصادقة
- `amazon-bedrock`: مطابقة تجاوز نافذة السياق المملوكة للمزود وتصنيف أسباب الرجوع الاحتياطي لأخطاء Bedrock الخاصة بالتقييد/عدم الجاهزية، بالإضافة إلى عائلة إعادة التشغيل المشتركة `anthropic-by-model` لحواجز سياسة إعادة التشغيل الخاصة بـ Claude فقط على حركة Anthropic
- `anthropic-vertex`: حواجز سياسة إعادة التشغيل الخاصة بـ Claude فقط على حركة رسائل Anthropic
- `openrouter`: معرّفات نماذج تمريرية، وأغلفة الطلبات، وتلميحات إمكانات المزود، وتنظيف thought-signature الخاصة بـ Gemini على حركة Gemini عبر proxy، وحقن الاستدلال عبر proxy من خلال عائلة التدفق `openrouter-thinking`، وتمرير بيانات تعريف التوجيه، وسياسة cache-TTL
- `github-copilot`: Onboarding/تسجيل دخول الجهاز، ورجوع احتياطي متوافق مستقبلًا للنماذج، وتلميحات transcript لتفكير Claude، وتبادل رموز runtime، وجلب نقطة نهاية الاستخدام
- `openai`: رجوع احتياطي متوافق مستقبلًا لـ GPT-5.4، وتطبيع نقل OpenAI المباشر، وتلميحات missing-auth الواعية بـ Codex، وكبت Spark، وصفوف فهرس OpenAI/Codex الاصطناعية، وسياسة thinking/live-model، وتطبيع الأسماء المستعارة لرموز الاستخدام (`input` / `output` و`prompt` / `completion`)، وعائلة التدفق المشتركة `openai-responses-defaults` لأغلفة OpenAI/Codex الأصلية، وبيانات تعريف provider-family، وتسجيل مزود توليد الصور المضمّن لـ `gpt-image-2`، وتسجيل مزود توليد الفيديو المضمّن لـ `sora-2`
- `google` و`google-gemini-cli`: رجوع احتياطي متوافق مستقبلًا لـ Gemini 3.1، والتحقق الأصلي من إعادة تشغيل Gemini، وتنظيف إعادة التشغيل أثناء bootstrap، ووضع مخرجات الاستدلال الموسوم، ومطابقة النماذج الحديثة، وتسجيل مزود توليد الصور المضمّن لنماذج Gemini image-preview، وتسجيل مزود توليد الفيديو المضمّن لنماذج Veo؛ كما يمتلك Gemini CLI OAuth أيضًا تنسيق رموز ملفات تعريف المصادقة، وتحليل رموز الاستخدام، وجلب نقطة نهاية الحصة لأسطح الاستخدام
- `moonshot`: نقل مشترك، وتطبيع حمولة thinking مملوك لـ Plugin
- `kilocode`: نقل مشترك، ورؤوس طلبات مملوكة لـ Plugin، وتطبيع حمولة الاستدلال، وتنظيف thought-signature الخاصة بـ Gemini عبر proxy، وسياسة cache-TTL
- `zai`: رجوع احتياطي متوافق مستقبلًا لـ GLM-5، وإعدادات `tool_stream` الافتراضية، وسياسة cache-TTL، وسياسة binary-thinking/live-model، ومصادقة الاستخدام + جلب الحصة؛ وتُركّب معرّفات `glm-5*` غير المعروفة اصطناعيًا من قالب `glm-4.7` المضمّن
- `xai`: تطبيع نقل Responses الأصلي، وإعادة كتابة الأسماء المستعارة `/fast` لنسخ Grok السريعة، و`tool_stream` الافتراضي، وتنظيف tool-schema / reasoning-payload الخاص بـ xAI، وتسجيل مزود توليد الفيديو المضمّن لـ `grok-imagine-video`
- `mistral`: بيانات تعريف الإمكانات المملوكة لـ Plugin
- `opencode` و`opencode-go`: بيانات تعريف الإمكانات المملوكة لـ Plugin بالإضافة إلى تنظيف thought-signature الخاصة بـ Gemini عبر proxy
- `alibaba`: فهرس توليد الفيديو المملوك لـ Plugin لمراجع نماذج Wan المباشرة مثل `alibaba/wan2.6-t2v`
- `byteplus`: فهارس مملوكة لـ Plugin بالإضافة إلى تسجيل مزود توليد الفيديو المضمّن لنماذج Seedance لتحويل النص إلى فيديو/الصورة إلى فيديو
- `fal`: تسجيل مزود توليد الفيديو المضمّن لنماذج الجهات الخارجية المستضافة، وتسجيل مزود توليد الصور المضمّن لنماذج صور FLUX، بالإضافة إلى تسجيل مزود توليد الفيديو المضمّن لنماذج الفيديو المستضافة التابعة لجهات خارجية
- `cloudflare-ai-gateway` و`huggingface` و`kimi` و`nvidia` و`qianfan` و`stepfun` و`synthetic` و`venice` و`vercel-ai-gateway` و`volcengine`: فهارس مملوكة لـ Plugin فقط
- `qwen`: فهارس مملوكة لـ Plugin للنماذج النصية بالإضافة إلى تسجيلات مزود media-understanding وتوليد الفيديو المشتركة لأسطحه متعددة الوسائط؛ ويستخدم توليد الفيديو في Qwen نقاط نهاية الفيديو القياسية لـ DashScope مع نماذج Wan المضمّنة مثل `wan2.6-t2v` و`wan2.7-r2v`
- `runway`: تسجيل مزود توليد الفيديو المملوك لـ Plugin لنماذج Runway الأصلية المعتمدة على المهام مثل `gen4.5`
- `minimax`: فهارس مملوكة لـ Plugin، وتسجيل مزود توليد الفيديو المضمّن لنماذج فيديو Hailuo، وتسجيل مزود توليد الصور المضمّن لـ `image-01`، واختيار سياسة إعادة تشغيل هجينة بين Anthropic/OpenAI، ومنطق مصادقة/لقطة الاستخدام
- `together`: فهارس مملوكة لـ Plugin بالإضافة إلى تسجيل مزود توليد الفيديو المضمّن لنماذج فيديو Wan
- `xiaomi`: فهارس مملوكة لـ Plugin بالإضافة إلى منطق مصادقة/لقطة الاستخدام

يمتلك Plugin المضمّن `openai` الآن كلا معرّفي المزود: `openai` و
`openai-codex`.

وهذا يغطي المزودين الذين ما زالوا يتوافقون مع وسائل النقل العادية في OpenClaw. أما المزود
الذي يحتاج إلى منفذ طلبات مخصص بالكامل فهو سطح توسعة منفصل وأعمق.

## تدوير مفاتيح API

- يدعم تدوير المزود العام لمزودين محددين.
- هيّئ عدة مفاتيح عبر:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر منفرد، أعلى أولوية)
  - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
  - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
  - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)
- بالنسبة لمزودي Google، يتم تضمين `GOOGLE_API_KEY` أيضًا كخيار احتياطي.
- يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.
- لا تُعاد محاولة الطلبات بالمفتاح التالي إلا عند استجابات حد المعدل (على
  سبيل المثال `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many
concurrent requests` أو `ThrottlingException` أو `concurrency limit reached`،
  أو `workers_ai ... quota limit exceeded`، أو رسائل حد الاستخدام الدورية).
- تفشل حالات الإخفاق غير المتعلقة بحد المعدل فورًا؛ ولا تتم محاولة تدوير المفاتيح.
- عندما تفشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من آخر محاولة.

## المزودون المضمنون (فهرس pi-ai)

يشحن OpenClaw مع فهرس pi‑ai. ولا تتطلب هذه المزودات **أي**
تهيئة `models.providers`؛ فقط اضبط المصادقة + اختر نموذجًا.

### OpenAI

- المزود: `openai`
- المصادقة: `OPENAI_API_KEY`
- التدوير الاختياري: `OPENAI_API_KEYS` و`OPENAI_API_KEY_1` و`OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز منفرد)
- أمثلة على النماذج: `openai/gpt-5.4` و`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، والرجوع إلى SSE)
- يمكن التجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يكون الإحماء الافتراضي لـ OpenAI Responses WebSocket مفعّلًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة `openai/*` بالقيمة `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحًا بدلًا من زر `/fast` المشترك
- تُطبّق رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و
  `User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس
  على proxies العامة المتوافقة مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بقيمة `store` في Responses، وتلميحات prompt-cache،
  وتشكيل حمولة توافق استدلال OpenAI؛ أما مسارات proxy فلا تفعل ذلك
- يتم كبت `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن OpenAI API المباشرة ترفضه؛ ويُعامَل Spark على أنه خاص بـ Codex فقط

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- المزود: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- التدوير الاختياري: `ANTHROPIC_API_KEYS` و`ANTHROPIC_API_KEY_1` و`ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز منفرد)
- مثال على النموذج: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة زر `/fast` المشترك و`params.fastMode`، بما في ذلك الحركة المصادق عليها بمفتاح API وOAuth المرسلة إلى `api.anthropic.com`؛ ويربط OpenClaw ذلك بـ Anthropic `service_tier` (`auto` مقابل `standard_only`)
- ملاحظة Anthropic: أخبرنا فريق Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- ما يزال setup-token الخاص بـ Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- المزود: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مثال على النموذج: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، والرجوع إلى SSE)
- يمكن التجاوز لكل نموذج عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` على طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- تُرفق رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و
  `User-Agent`) فقط على حركة Codex الأصلية إلى
  `chatgpt.com/backend-api`، وليس على proxies العامة المتوافقة مع OpenAI
- يشترك مع `openai/*` المباشر في زر `/fast` نفسه وتهيئة `params.fastMode`؛ ويربط OpenClaw ذلك بـ `service_tier=priority`
- يظل `openai-codex/gpt-5.3-codex-spark` متاحًا عندما يعرضه فهرس Codex OAuth؛ ويعتمد على الاستحقاق
- يحتفظ `openai-codex/gpt-5.4` بقيمته الأصلية `contextWindow = 1050000` والافتراضية في runtime وهي `contextTokens = 272000`؛ ويمكنك تجاوز حد runtime عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة سياسة: إن OpenAI Codex OAuth مدعوم صراحةً للأدوات/التدفقات الخارجية مثل OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### خيارات أخرى مستضافة بأسلوب الاشتراك

- [Qwen Cloud](/ar/providers/qwen): سطح مزود Qwen Cloud بالإضافة إلى Alibaba DashScope وتخطيط نقطة نهاية Coding Plan
- [MiniMax](/ar/providers/minimax): وصول MiniMax Coding Plan عبر OAuth أو مفتاح API
- [GLM Models](/ar/providers/glm): نقاط نهاية Z.AI Coding Plan أو API العامة

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- مزود runtime لـ Zen: `opencode`
- مزود runtime لـ Go: `opencode-go`
- أمثلة على النماذج: `opencode/claude-opus-4-6` و`opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- المزود: `google`
- المصادقة: `GEMINI_API_KEY`
- التدوير الاختياري: `GEMINI_API_KEYS` و`GEMINI_API_KEY_1` و`GEMINI_API_KEY_2`، مع خيار `GOOGLE_API_KEY` الاحتياطي، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز منفرد)
- أمثلة على النماذج: `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview`
- التوافق: تُطبّع تهيئة OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- تقبل عمليات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent`
  (أو `cached_content` القديم) لتمرير معرّف أصلي للمزود
  من نوع `cachedContents/...`؛ وتظهر إصابات ذاكرة Gemini المؤقتة على أنها OpenClaw `cacheRead`

### Google Vertex وGemini CLI

- المزودات: `google-vertex`، `google-gemini-cli`
- المصادقة: يستخدم Vertex ‏gcloud ADC؛ بينما يستخدم Gemini CLI تدفق OAuth الخاص به
- تحذير: إن Gemini CLI OAuth في OpenClaw تكامل غير رسمي. وقد أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من جهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
- يُشحن Gemini CLI OAuth كجزء من Plugin `google` المضمّن.
  - ثبّت Gemini CLI أولًا:
    - `brew install gemini-cli`
    - أو `npm install -g @google/gemini-cli`
  - التفعيل: `openclaw plugins enable google`
  - تسجيل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
  - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
  - ملاحظة: أنت **لا** تلصق `client id` أو `secret` في `openclaw.json`. يخزن تدفق تسجيل الدخول عبر CLI
    الرموز في ملفات تعريف المصادقة على مضيف Gateway.
  - إذا فشلت الطلبات بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  - تُحلَّل ردود Gemini CLI بصيغة JSON من `response`؛ ويعود الاستخدام احتياطيًا إلى
    `stats`، مع تطبيع `stats.cached` إلى OpenClaw `cacheRead`.

### Z.AI (GLM)

- المزود: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال على النموذج: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: تُطبَّع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا؛ بينما تفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- المزود: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- أمثلة على النماذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`،
  و`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- المزود: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال على النموذج: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يشحن فهرس الرجوع الاحتياطي الثابت `kilocode/kilo/auto`؛ ويمكن لاكتشاف
  `https://api.kilo.ai/api/gateway/models` المباشر توسيع فهرس runtime
  أكثر.
- إن التوجيه العلوي الدقيق وراء `kilocode/kilo/auto` مملوك لـ Kilo Gateway،
  وليس مُثبتًا داخل OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) لمعرفة تفاصيل الإعداد.

### Plugins مزودات مضمّنة أخرى

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- أمثلة على النماذج: `openrouter/auto`، `openrouter/moonshotai/kimi-k2.6`
- يطبق OpenClaw رؤوس إسناد التطبيق الموثقة لدى OpenRouter فقط عندما
  يستهدف الطلب فعلًا `openrouter.ai`
- كما تُقيَّد علامات `cache_control` الخاصة بـ Anthropic والمحددة لـ OpenRouter
  على مسارات OpenRouter المتحقق منها، وليس على أي عناوين proxy عشوائية
- يظل OpenRouter على المسار المتوافق مع OpenAI بأسلوب proxy، لذا فإن
  تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط (`serviceTier`، و`store` في Responses،
  وتلميحات prompt-cache، وحمولات توافق استدلال OpenAI) لا يتم تمريره
- تحتفظ مراجع OpenRouter المعتمدة على Gemini فقط بمسار تنظيف thought-signature الخاص بـ Gemini عبر proxy؛ بينما تظل عمليات التحقق الأصلية من إعادة تشغيل Gemini وإعادات كتابة bootstrap معطلة
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- مثال على النموذج: `kilocode/kilo/auto`
- تحتفظ مراجع Kilo المعتمدة على Gemini بمسار تنظيف thought-signature
  الخاص بـ Gemini عبر proxy نفسه؛ أما `kilocode/kilo/auto` وغيره من
  التلميحات غير المدعومة للاستدلال عبر proxy فتتجاوز حقن الاستدلال عبر proxy
- MiniMax: ‏`minimax` (مفتاح API) و`minimax-portal` (OAuth)
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`
- مثال على النموذج: `minimax/MiniMax-M2.7` أو `minimax-portal/MiniMax-M2.7`
- يكتب إعداد MiniMax عبر Onboarding/مفتاح API تعريفات صريحة لنموذج M2.7 مع
  `input: ["text", "image"]`؛ بينما يُبقي فهرس المزود المضمّن مراجع الدردشة
  نصية فقط حتى يتم تجسيد تهيئة ذلك المزود
- Moonshot: ‏`moonshot` (`MOONSHOT_API_KEY`)
- مثال على النموذج: `moonshot/kimi-k2.6`
- Kimi Coding: ‏`kimi` (`KIMI_API_KEY` أو `KIMICODE_API_KEY`)
- مثال على النموذج: `kimi/kimi-code`
- Qianfan: ‏`qianfan` (`QIANFAN_API_KEY`)
- مثال على النموذج: `qianfan/deepseek-v3.2`
- Qwen Cloud: ‏`qwen` (`QWEN_API_KEY` أو `MODELSTUDIO_API_KEY` أو `DASHSCOPE_API_KEY`)
- مثال على النموذج: `qwen/qwen3.5-plus`
- NVIDIA: ‏`nvidia` (`NVIDIA_API_KEY`)
- مثال على النموذج: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: ‏`stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- أمثلة على النماذج: `stepfun/step-3.5-flash`، `stepfun-plan/step-3.5-flash-2603`
- Together: ‏`together` (`TOGETHER_API_KEY`)
- مثال على النموذج: `together/moonshotai/Kimi-K2.5`
- Venice: ‏`venice` (`VENICE_API_KEY`)
- Xiaomi: ‏`xiaomi` (`XIAOMI_API_KEY`)
- مثال على النموذج: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: ‏`vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: ‏`huggingface` (`HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`)
- Cloudflare AI Gateway: ‏`cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: ‏`volcengine` (`VOLCANO_ENGINE_API_KEY`)
- مثال على النموذج: `volcengine-plan/ark-code-latest`
- BytePlus: ‏`byteplus` (`BYTEPLUS_API_KEY`)
- مثال على النموذج: `byteplus-plan/ark-code-latest`
- xAI: ‏`xai` (`XAI_API_KEY`)
  - تستخدم طلبات xAI الأصلية المضمّنة مسار xAI Responses
  - تعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini`،
    و`grok-4`، و`grok-4-0709` إلى المتغيرات `*-fast` الخاصة بها
  - يكون `tool_stream` مفعّلًا افتراضيًا؛ اضبط
    `agents.defaults.models["xai/<model>"].params.tool_stream` على `false`
    لتعطيله
- Mistral: ‏`mistral` (`MISTRAL_API_KEY`)
- مثال على النموذج: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: ‏`groq` (`GROQ_API_KEY`)
- Cerebras: ‏`cerebras` (`CEREBRAS_API_KEY`)
  - تستخدم نماذج GLM على Cerebras المعرّفين `zai-glm-4.7` و`zai-glm-4.6`.
  - عنوان URL أساسي متوافق مع OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: ‏`github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- مثال على نموذج Hugging Face Inference: ‏`huggingface/deepseek-ai/DeepSeek-R1`؛ CLI: ‏`openclaw onboard --auth-choice huggingface-api-key`. راجع [Hugging Face (Inference)](/ar/providers/huggingface).

## المزودات عبر `models.providers` (عنوان URL مخصص/أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة مزودات **مخصصة** أو
proxies متوافقة مع OpenAI/Anthropic.

تنشر كثير من Plugins المزودات المضمّنة أدناه بالفعل فهرسًا افتراضيًا.
استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز
عنوان URL الأساسي الافتراضي أو الرؤوس أو قائمة النماذج.

### Moonshot AI (Kimi)

يُشحن Moonshot على هيئة Plugin مزود مضمّن. استخدم المزود المضمّن بشكل
افتراضي، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما
تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات تعريف النموذج:

- المزود: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال على النموذج: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` أو `openclaw onboard --auth-choice moonshot-api-key-cn`

معرّفات نماذج Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

يستخدم Kimi Coding نقطة نهاية Moonshot AI المتوافقة مع Anthropic:

- المزود: `kimi`
- المصادقة: `KIMI_API_KEY`
- مثال على النموذج: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

يبقى `kimi/k2p5` القديم مقبولًا بوصفه معرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) وصولًا إلى Doubao ونماذج أخرى داخل الصين.

- المزود: `volcengine` (الترميز: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- مثال على النموذج: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

يكون Onboarding افتراضيًا على سطح البرمجة، لكن فهرس
`volcengine/*` العام يُسجَّل في الوقت نفسه.

في أدوات اختيار النماذج ضمن Onboarding/تهيئة النموذج، يفضّل خيار مصادقة Volcengine
كلًا من صفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن تلك النماذج
محملة بعد، فإن OpenClaw يعود إلى الفهرس غير المصفّى بدلًا من عرض
أداة اختيار فارغة محصورة بالمزود.

النماذج المتاحة:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

نماذج البرمجة (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (الدولي)

يوفّر BytePlus ARK الوصول إلى النماذج نفسها التي يوفّرها Volcano Engine للمستخدمين الدوليين.

- المزود: `byteplus` (البرمجة: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- مثال على النموذج: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

يكون Onboarding افتراضيًا على سطح البرمجة، لكن فهرس
`byteplus/*` العام يُسجَّل في الوقت نفسه.

في أدوات اختيار النماذج ضمن Onboarding/تهيئة النموذج، يفضّل خيار مصادقة BytePlus
كلًا من صفوف `byteplus/*` و`byteplus-plan/*`. وإذا لم تكن تلك النماذج
محملة بعد، فإن OpenClaw يعود إلى الفهرس غير المصفّى بدلًا من عرض
أداة اختيار فارغة محصورة بالمزود.

النماذج المتاحة:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

نماذج البرمجة (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

يوفّر Synthetic نماذج متوافقة مع Anthropic خلف المزود `synthetic`:

- المزود: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- مثال على النموذج: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

يتم إعداد MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح API لـ MiniMax (عالمي): `--auth-choice minimax-global-api`
- مفتاح API لـ MiniMax (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو
  `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) لمعرفة تفاصيل الإعداد وخيارات النماذج ومقتطفات التهيئة.

على مسار البث المتوافق مع Anthropic الخاص بـ MiniMax، يعطّل OpenClaw التفكير
افتراضيًا ما لم تضبطه صراحةً، كما أن `/fast on` يعيد كتابة
`MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

تقسيم الإمكانات المملوك لـ Plugin:

- تظل الإعدادات الافتراضية للنص/الدردشة على `minimax/MiniMax-M2.7`
- يكون توليد الصور على `minimax/image-01` أو `minimax-portal/image-01`
- يكون فهم الصور عبر `MiniMax-VL-01` المملوك لـ Plugin على مساري مصادقة MiniMax
- يبقى البحث على الويب على معرّف المزود `minimax`

### LM Studio

يُشحن LM Studio على هيئة Plugin مزود مضمّن يستخدم API الأصلية:

- المزود: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي تُرجعها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw المسارين الأصليين لـ LM Studio وهما `/api/v1/models` و`/api/v1/models/load`
للاكتشاف + التحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضيًا.
راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يُشحن Ollama على هيئة Plugin مزود مضمّن ويستخدم API الأصلية الخاصة بـ Ollama:

- المزود: `ollama`
- المصادقة: لا شيء مطلوب (خادم محلي)
- مثال على النموذج: `ollama/llama3.3`
- التثبيت: [https://ollama.com/download](https://ollama.com/download)

```bash
# ثبّت Ollama، ثم اسحب نموذجًا:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

يُكتشف Ollama محليًا على `http://127.0.0.1:11434` عندما تُفعّل ذلك باستخدام
`OLLAMA_API_KEY`، ويضيف Plugin المزود المضمّن Ollama مباشرةً إلى
`openclaw onboard` وأداة اختيار النموذج. راجع [/providers/ollama](/ar/providers/ollama)
لـ Onboarding، ووضع السحابة/الوضع المحلي، والتهيئة المخصصة.

### vLLM

يُشحن vLLM على هيئة Plugin مزود مضمّن لخوادم
OpenAI-compatible المحلية/المستضافة ذاتيًا:

- المزود: `vllm`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للتفعيل الاختياري للاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي تُرجعها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يُشحن SGLang على هيئة Plugin مزود مضمّن لخوادم
OpenAI-compatible السريعة والمستضافة ذاتيًا:

- المزود: `sglang`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للتفعيل الاختياري للاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا
يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي تُرجعها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### proxies المحلية (LM Studio وvLLM وLiteLLM وغيرها)

مثال (متوافق مع OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

ملاحظات:

- بالنسبة للمزودات المخصصة، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية.
  وعند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- الموصى به: عيّن قيمًا صريحة تطابق حدود proxy/النموذج لديك.
- بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من المزود بسبب أدوار `developer` غير المدعومة.
- كما تتجاوز المسارات المتوافقة مع OpenAI بأسلوب proxy أيضًا تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط:
  فلا يوجد `service_tier`، ولا `store` في Responses، ولا تلميحات prompt-cache، ولا
  تشكيل حمولة توافق استدلال OpenAI، ولا رؤوس إسناد OpenClaw المخفية.
- إذا كان `baseUrl` فارغًا/غير مذكور، فسيحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
- ومن باب الأمان، فإن القيمة الصريحة `compat.supportsDeveloperRole: true` لا تزال تُتجاهل على نقاط نهاية `openai-completions` غير الأصلية.

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [/gateway/configuration](/ar/gateway/configuration) للحصول على أمثلة التهيئة الكاملة.

## ذو صلة

- [النماذج](/ar/concepts/models) — تهيئة النماذج والأسماء المستعارة
- [الرجوع الاحتياطي للنموذج](/ar/concepts/model-failover) — سلاسل الرجوع الاحتياطي وسلوك إعادة المحاولة
- [مرجع التهيئة](/ar/gateway/configuration-reference#agent-defaults) — مفاتيح تهيئة النموذج
- [المزودات](/ar/providers) — أدلة الإعداد لكل مزود
