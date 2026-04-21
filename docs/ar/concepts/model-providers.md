---
read_when:
    - أنت بحاجة إلى مرجع لإعداد النماذج حسب كل موفّر
    - أنت تريد أمثلة على الإعدادات أو أوامر التهيئة عبر CLI لموفري النماذج
summary: نظرة عامة على موفري النماذج مع أمثلة للإعدادات وتدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-04-21T07:19:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e433dfd51d1721832480089cb35ab1243e5c873a587f9968e14744840cb912cf
    source_path: concepts/model-providers.md
    workflow: 15
---

# موفرو النماذج

تغطي هذه الصفحة **موفري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram).
للاطلاع على قواعد اختيار النموذج، راجع [/concepts/models](/ar/concepts/models).

## قواعد سريعة

- تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
- إذا قمت بضبط `agents.defaults.models`، فسيصبح هذا هو قائمة السماح.
- مساعدات CLI: ‏`openclaw onboard`، و`openclaw models list`، و`openclaw models set <provider/model>`.
- قواعد الرجوع الاحتياطي وقت التشغيل، وفحوصات التهدئة، واستمرار تجاوزات الجلسات
  موثقة في [/concepts/model-failover](/ar/concepts/model-failover).
- `models.providers.*.models[].contextWindow` هي بيانات وصفية أصلية للنموذج؛
  أما `models.providers.*.models[].contextTokens` فهو الحد الفعلي وقت التشغيل.
- يمكن لـ Plugin الموفّر إدخال فهارس النماذج عبر `registerProvider({ catalog })`؛
  ويقوم OpenClaw بدمج هذا الناتج في `models.providers` قبل كتابة
  `models.json`.
- يمكن لبيانات تعريف الموفّر إعلان `providerAuthEnvVars` و
  `providerAuthAliases` حتى لا تحتاج فحوصات المصادقة العامة المعتمدة على البيئة ومتغيرات
  الموفّر إلى تحميل وقت تشغيل Plugin. أما خريطة متغيرات البيئة المتبقية في النواة فهي الآن
  فقط لموفري النواة/غير المعتمدين على Plugin وبعض حالات الأولوية العامة القليلة مثل
  التهيئة التي تعطي أولوية لمفتاح API في Anthropic.
- يمكن أيضًا لـ Plugin الموفّر امتلاك سلوك وقت تشغيل الموفّر عبر
  `normalizeModelId`، و`normalizeTransport`، و`normalizeConfig`،
  و`applyNativeStreamingUsageCompat`، و`resolveConfigApiKey`،
  و`resolveSyntheticAuth`، و`shouldDeferSyntheticProfileAuth`،
  و`resolveDynamicModel`، و`prepareDynamicModel`,
  و`normalizeResolvedModel`، و`contributeResolvedModelCompat`,
  و`capabilities`، و`normalizeToolSchemas`,
  و`inspectToolSchemas`، و`resolveReasoningOutputMode`,
  و`prepareExtraParams`، و`createStreamFn`، و`wrapStreamFn`,
  و`resolveTransportTurnState`، و`resolveWebSocketSessionPolicy`,
  و`createEmbeddingProvider`، و`formatApiKey`، و`refreshOAuth`,
  و`buildAuthDoctorHint`،
  و`matchesContextOverflowError`، و`classifyFailoverReason`,
  و`isCacheTtlEligible`، و`buildMissingAuthMessage`، و`suppressBuiltInModel`,
  و`augmentModelCatalog`، و`isBinaryThinking`، و`supportsXHighThinking`,
  و`supportsAdaptiveThinking`، و`supportsMaxThinking`,
  و`resolveDefaultThinkingLevel`، و`applyConfigDefaults`، و`isModernModelRef`,
  و`prepareRuntimeAuth`، و`resolveUsageAuth`، و`fetchUsageSnapshot`، و
  `onModelSelected`.
- ملاحظة: إن `capabilities` في وقت تشغيل الموفّر هي بيانات وصفية مشتركة للمشغّل (عائلة
  الموفّر، وخصائص النصوص وأدواتها، وتلميحات النقل/التخزين المؤقت). وهي ليست
  نفسها [نموذج القدرات العام](/ar/plugins/architecture#public-capability-model)
  الذي يصف ما الذي يسجله Plugin (استدلال نصي، وكلام، وغير ذلك).
- الموفّر المضمّن `codex` مقترن بإطار عمل عامل Codex المضمّن.
  استخدم `codex/gpt-*` عندما تريد تسجيل دخول يملكه Codex، واكتشاف النماذج، والاستئناف الأصلي
  للسلاسل، والتنفيذ عبر خادم التطبيق. وتظل مراجع `openai/gpt-*` العادية
  تستخدم موفّر OpenAI ونقل الموفّر العادي في OpenClaw.
  ويمكن لعمليات النشر الخاصة بـ Codex فقط تعطيل الرجوع التلقائي إلى PI عبر
  `agents.defaults.embeddedHarness.fallback: "none"`؛ راجع
  [Codex Harness](/ar/plugins/codex-harness).

## السلوك الخاص بالموفّر والمملوك من Plugin

يمكن الآن لـ Plugin الموفّر امتلاك معظم المنطق الخاص بالموفّر، بينما يحتفظ OpenClaw
بحلقة الاستدلال العامة.

التقسيم المعتاد:

- `auth[].run` / `auth[].runNonInteractive`: يمتلك الموفّر تدفقات
  التهيئة/تسجيل الدخول الخاصة بـ `openclaw onboard`، و`openclaw models auth`، والإعداد غير التفاعلي
- `wizard.setup` / `wizard.modelPicker`: يمتلك الموفّر تسميات اختيارات المصادقة،
  والأسماء المستعارة القديمة، وتلميحات قائمة السماح أثناء التهيئة، وإدخالات
  الإعداد في أدوات اختيار التهيئة/النموذج
- `catalog`: يظهر الموفّر في `models.providers`
- `normalizeModelId`: يطبع الموفّر معرّفات النماذج القديمة/المعاينة قبل
  البحث أو التحويل إلى الصيغة القياسية
- `normalizeTransport`: يطبع الموفّر `api` / `baseUrl` الخاصة بعائلة النقل قبل
  التجميع العام للنموذج؛ ويتحقق OpenClaw أولًا من الموفّر المطابق،
  ثم من Plugins الموفّر الأخرى القادرة على استخدام هذا الخطاف حتى يقوم أحدها
  فعلًا بتغيير النقل
- `normalizeConfig`: يطبع الموفّر إعداد `models.providers.<id>` قبل أن
  يستخدمه وقت التشغيل؛ ويتحقق OpenClaw أولًا من الموفّر المطابق، ثم من Plugins
  الموفّر الأخرى القادرة على استخدام هذا الخطاف حتى يقوم أحدها فعلًا بتغيير
  الإعداد. وإذا لم يُعد أي خطاف موفّر كتابة الإعداد، فستستمر مساعدات Google-family
  المضمّنة في تطبيع إدخالات موفري Google المدعومة.
- `applyNativeStreamingUsageCompat`: يطبق الموفّر عمليات إعادة كتابة توافق استخدام البث الأصلية المعتمدة على نقطة النهاية لموفري الإعداد
- `resolveConfigApiKey`: يحل الموفّر مصادقة علامات البيئة لموفري الإعداد
  من دون فرض تحميل كامل لمصادقة وقت التشغيل. كما يحتوي `amazon-bedrock` أيضًا على
  محلّل مضمّن لعلامات بيئة AWS هنا، رغم أن مصادقة وقت تشغيل Bedrock تستخدم
  سلسلة AWS SDK الافتراضية.
- `resolveSyntheticAuth`: يمكن للموفّر إتاحة توفر المصادقة المحلية/المستضافة ذاتيًا أو غيرها من
  المصادقات المعتمدة على الإعداد من دون حفظ أسرار نصية صريحة
- `shouldDeferSyntheticProfileAuth`: يمكن للموفّر تعليم العناصر النائبة للمصادقة الاصطناعية المخزنة على أنها أقل أولوية من المصادقة المعتمدة على البيئة/الإعداد
- `resolveDynamicModel`: يقبل الموفّر معرّفات نماذج غير موجودة بعد في
  الفهرس الثابت المحلي
- `prepareDynamicModel`: يحتاج الموفّر إلى تحديث البيانات الوصفية قبل إعادة
  محاولة الحل الديناميكي
- `normalizeResolvedModel`: يحتاج الموفّر إلى إعادة كتابة النقل أو عنوان URL الأساسي
- `contributeResolvedModelCompat`: يضيف الموفّر إشارات التوافق لنماذجه الخاصة
  حتى عندما تصل عبر نقل متوافق آخر
- `capabilities`: ينشر الموفّر خصائص عائلة الموفّر/الأدوات/النصوص
- `normalizeToolSchemas`: ينظف الموفّر مخططات الأدوات قبل أن يراها
  المشغّل المضمّن
- `inspectToolSchemas`: يعرض الموفّر تحذيرات مخطط خاصة بالنقل
  بعد التطبيع
- `resolveReasoningOutputMode`: يختار الموفّر عقود مخرجات الاستدلال الأصلية أو الموسومة
- `prepareExtraParams`: يضبط الموفّر افتراضيًا أو يطبع معاملات الطلب لكل نموذج
- `createStreamFn`: يستبدل الموفّر مسار البث العادي بنقل
  مخصص بالكامل
- `wrapStreamFn`: يطبّق الموفّر أغلفة توافق الرؤوس/الجسم/النموذج على الطلب
- `resolveTransportTurnState`: يوفّر الموفّر رؤوسًا أو بيانات وصفية
  أصلية خاصة بكل دورة للنقل
- `resolveWebSocketSessionPolicy`: يوفّر الموفّر رؤوس جلسات WebSocket أصلية
  أو سياسة تهدئة للجلسات
- `createEmbeddingProvider`: يمتلك الموفّر سلوك التضمين الخاص بالذاكرة عندما
  يكون من الأنسب أن يوجد مع Plugin الموفّر بدلًا من لوحة التحويل الأساسية للتضمين
- `formatApiKey`: ينسّق الموفّر ملفات تعريف المصادقة المخزنة إلى سلسلة
  `apiKey` الخاصة بوقت التشغيل والمتوقعة من النقل
- `refreshOAuth`: يمتلك الموفّر تحديث OAuth عندما لا تكون أدوات التحديث المشتركة الخاصة بـ `pi-ai`
  كافية
- `buildAuthDoctorHint`: يضيف الموفّر إرشادات إصلاح عندما يفشل تحديث OAuth
- `matchesContextOverflowError`: يتعرف الموفّر على أخطاء تجاوز نافذة السياق
  الخاصة بالموفّر والتي قد تفوتها الأساليب العامة
- `classifyFailoverReason`: يربط الموفّر أخطاء النقل/API الخام الخاصة به
  بأسباب الرجوع الاحتياطي مثل حد المعدل أو التحميل الزائد
- `isCacheTtlEligible`: يحدد الموفّر أي معرّفات النماذج العليا تدعم TTL لذاكرة التخزين المؤقت للموجّهات
- `buildMissingAuthMessage`: يستبدل الموفّر خطأ مخزن المصادقة العام
  بتلميح استرداد خاص بالموفّر
- `suppressBuiltInModel`: يُخفي الموفّر الصفوف العليا القديمة ويمكنه إرجاع
  خطأ مملوك للمورّد عند فشل الحل المباشر
- `augmentModelCatalog`: يضيف الموفّر صفوف فهرسة اصطناعية/نهائية بعد
  الاكتشاف ودمج الإعدادات
- `isBinaryThinking`: يمتلك الموفّر واجهة التفكير الثنائية تشغيل/إيقاف
- `supportsXHighThinking`: يُدخل الموفّر نماذج محددة في `xhigh`
- `supportsAdaptiveThinking`: يُدخل الموفّر نماذج محددة في `adaptive`
- `supportsMaxThinking`: يُدخل الموفّر نماذج محددة في `max`
- `resolveDefaultThinkingLevel`: يمتلك الموفّر سياسة `/think` الافتراضية
  لعائلة نماذج معينة
- `applyConfigDefaults`: يطبق الموفّر افتراضيات عامة خاصة به
  أثناء تشكيل الإعداد استنادًا إلى وضع المصادقة أو البيئة أو عائلة النموذج
- `isModernModelRef`: يمتلك الموفّر مطابقة النموذج المفضّل في الوضع الحي/الاختبار السريع
- `prepareRuntimeAuth`: يحوّل الموفّر بيانات الاعتماد المكوّنة إلى رمز
  وقت تشغيل قصير الأجل
- `resolveUsageAuth`: يحل الموفّر بيانات اعتماد الاستخدام/الحصة لأجل `/usage`
  والواجهات ذات الصلة بالحالة/التقارير
- `fetchUsageSnapshot`: يمتلك الموفّر جلب/تحليل نقطة نهاية الاستخدام، بينما
  تظل النواة مالكة لغلاف الملخص والتنسيق
- `onModelSelected`: يشغّل الموفّر التأثيرات الجانبية بعد الاختيار مثل
  القياس عن بُعد أو حفظ الجلسات المملوك للموفّر

الأمثلة المضمّنة الحالية:

- `anthropic`: رجوع احتياطي للتوافق المستقبلي لـ Claude 4.6، وتلميحات إصلاح المصادقة، وجلب
  نقطة نهاية الاستخدام، وبيانات cache-TTL/عائلة الموفّر الوصفية، وافتراضيات
  الإعدادات العامة الواعية بالمصادقة
- `amazon-bedrock`: مطابقة تجاوز نافذة السياق المملوكة للموفّر وتصنيف
  أسباب الرجوع الاحتياطي لأخطاء Bedrock الخاصة بالاختناق/عدم الجاهزية، بالإضافة إلى
  عائلة إعادة التشغيل المشتركة `anthropic-by-model` لحواجز سياسة إعادة التشغيل الخاصة بـ Claude فقط
  على حركة Anthropic
- `anthropic-vertex`: حواجز سياسة إعادة التشغيل الخاصة بـ Claude فقط على حركة
  رسائل Anthropic
- `openrouter`: معرّفات نماذج تمريرية، وأغلفة الطلبات، وتلميحات قدرات الموفّر،
  وتنقية thought-signature الخاصة بـ Gemini على حركة Gemini عبر الوكيل،
  وحقن الاستدلال عبر الوكيل من خلال عائلة البث `openrouter-thinking`،
  وتمرير بيانات التوجيه الوصفية، وسياسة cache-TTL
- `github-copilot`: التهيئة/تسجيل الدخول عبر الجهاز، والرجوع الاحتياطي للتوافق المستقبلي للنموذج،
  وتلميحات نص Claude-thinking، وتبادل الرموز وقت التشغيل، وجلب نقطة
  نهاية الاستخدام
- `openai`: رجوع احتياطي للتوافق المستقبلي لـ GPT-5.4، وتطبيع نقل OpenAI المباشر،
  وتلميحات غياب المصادقة الواعية بـ Codex، وكبت Spark، وصفوف فهرسة
  اصطناعية لـ OpenAI/Codex، وسياسة التفكير/النموذج الحي، وتطبيع الأسماء
  المستعارة لرموز الاستخدام (`input` / `output` وعائلات `prompt` / `completion`)، وعائلة
  البث المشتركة `openai-responses-defaults` لأغلفة OpenAI/Codex الأصلية،
  وبيانات عائلة الموفّر الوصفية، وتسجيل موفّر توليد الصور المضمّن
  لـ `gpt-image-1`، وتسجيل موفّر توليد الفيديو المضمّن
  لـ `sora-2`
- `google` و`google-gemini-cli`: رجوع احتياطي للتوافق المستقبلي لـ Gemini 3.1،
  والتحقق الأصلي من إعادة تشغيل Gemini، وتنقية إعادة تشغيل التمهيد، ووضع
  مخرجات الاستدلال الموسومة، ومطابقة النماذج الحديثة، وتسجيل موفّر
  توليد الصور المضمّن لنماذج Gemini image-preview، وتسجيل موفّر
  توليد الفيديو المضمّن لنماذج Veo؛ كما أن Gemini CLI OAuth يمتلك أيضًا
  تنسيق رموز ملفات تعريف المصادقة، وتحليل رموز الاستخدام، وجلب نقطة
  نهاية الحصة لواجهات الاستخدام
- `moonshot`: نقل مشترك، وتطبيع حمولة التفكير المملوك من Plugin
- `kilocode`: نقل مشترك، ورؤوس طلبات مملوكة من Plugin، وتطبيع
  حمولة الاستدلال، وتنقية thought-signature الخاصة بـ Gemini عبر الوكيل، وسياسة
  cache-TTL
- `zai`: رجوع احتياطي للتوافق المستقبلي لـ GLM-5، وافتراضيات `tool_stream`،
  وسياسة cache-TTL، وسياسة التفكير الثنائي/النموذج الحي، ومصادقة الاستخدام + جلب الحصة؛
  ويتم توليف معرّفات `glm-5*` غير المعروفة من قالب `glm-4.7` المضمّن
- `xai`: تطبيع نقل Responses الأصلي، وإعادة كتابة الأسماء المستعارة `/fast` لـ
  متغيرات Grok السريعة، و`tool_stream` الافتراضي، وتنظيف
  مخطط الأدوات / حمولة الاستدلال الخاصة بـ xAI، وتسجيل موفّر توليد الفيديو
  المضمّن لـ `grok-imagine-video`
- `mistral`: بيانات قدرات وصفية مملوكة من Plugin
- `opencode` و`opencode-go`: بيانات قدرات وصفية مملوكة من Plugin بالإضافة إلى
  تنقية thought-signature الخاصة بـ Gemini عبر الوكيل
- `alibaba`: فهرس توليد فيديو مملوك من Plugin لمراجع نماذج Wan المباشرة
  مثل `alibaba/wan2.6-t2v`
- `byteplus`: فهارس مملوكة من Plugin بالإضافة إلى تسجيل موفّر توليد الفيديو المضمّن
  لنماذج Seedance الخاصة بتحويل النص إلى فيديو/الصورة إلى فيديو
- `fal`: تسجيل موفّر توليد الفيديو المضمّن لنماذج فيديو مستضافة من جهات خارجية
  وتسجيل موفّر توليد الصور لنماذج صور FLUX بالإضافة إلى تسجيل موفّر
  توليد الفيديو المضمّن لنماذج فيديو مستضافة من جهات خارجية
- `cloudflare-ai-gateway` و`huggingface` و`kimi` و`nvidia` و`qianfan`،
  و`stepfun` و`synthetic` و`venice` و`vercel-ai-gateway` و`volcengine`:
  فهارس مملوكة من Plugin فقط
- `qwen`: فهارس مملوكة من Plugin للنماذج النصية بالإضافة إلى تسجيلات مشتركة
  لموفري فهم الوسائط وتوليد الفيديو لواجهاته متعددة الوسائط؛ ويستخدم
  توليد الفيديو في Qwen نقاط نهاية DashScope Standard للفيديو مع نماذج Wan
  المضمّنة مثل `wan2.6-t2v` و`wan2.7-r2v`
- `runway`: تسجيل موفّر توليد الفيديو المملوك من Plugin لنماذج Runway الأصلية
  القائمة على المهام مثل `gen4.5`
- `minimax`: فهارس مملوكة من Plugin، وتسجيل موفّر توليد الفيديو المضمّن
  لنماذج فيديو Hailuo، وتسجيل موفّر توليد الصور المضمّن
  لـ `image-01`، واختيار هجين لسياسة إعادة التشغيل بين Anthropic/OpenAI،
  ومنطق مصادقة الاستخدام/اللقطة
- `together`: فهارس مملوكة من Plugin بالإضافة إلى تسجيل موفّر توليد الفيديو المضمّن
  لنماذج فيديو Wan
- `xiaomi`: فهارس مملوكة من Plugin بالإضافة إلى منطق مصادقة الاستخدام/اللقطة

أصبح Plugin المضمّن `openai` يمتلك الآن معرّفي الموفّر كليهما: `openai` و
`openai-codex`.

وهذا يغطي الموفّرين الذين ما زالوا يلائمون وسائل النقل العادية في OpenClaw. أما الموفّر
الذي يحتاج إلى منفّذ طلبات مخصص بالكامل فهو سطح توسعة منفصل وأعمق.

## تدوير مفاتيح API

- يدعم تدوير الموفّر العام لموفّرين محددين.
- قم بتكوين عدة مفاتيح عبر:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز حي واحد، أعلى أولوية)
  - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فاصلة منقوطة)
  - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
  - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)
- بالنسبة إلى موفري Google، يتم تضمين `GOOGLE_API_KEY` أيضًا كخيار رجوعي.
- يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.
- تتم إعادة محاولة الطلبات باستخدام المفتاح التالي فقط عند استجابات حد المعدل (على
  سبيل المثال `429`، أو `rate_limit`، أو `quota`، أو `resource exhausted`، أو `Too many
concurrent requests`، أو `ThrottlingException`، أو `concurrency limit reached`،
  أو `workers_ai ... quota limit exceeded`، أو رسائل حدود الاستخدام الدورية).
- تفشل الأخطاء غير المرتبطة بحد المعدل فورًا؛ ولا تتم أي محاولة لتدوير المفاتيح.
- عندما تفشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من آخر محاولة.

## الموفّرون المضمّنون (فهرس pi-ai)

يأتي OpenClaw مع فهرس pi‑ai. ولا تتطلب هذه الموفّرات أي إعداد
`models.providers`؛ فقط اضبط المصادقة + اختر نموذجًا.

### OpenAI

- الموفّر: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS`، و`OPENAI_API_KEY_1`، و`OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `openai/gpt-5.4`، `openai/gpt-5.4-pro`
- CLI: ‏`openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم الرجوع إلى SSE)
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`، أو `"websocket"`، أو `"auto"`)
- تكون تهيئة OpenAI Responses WebSocket الأولية مفعّلة افتراضيًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- تقوم `/fast` و`params.fastMode` بربط طلبات Responses المباشرة `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد فئة صريحة بدلًا من مفتاح `/fast` المشترك
- تنطبق ترويسات نسب OpenClaw المخفية (`originator`، و`version`،
  و`User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس
  على الوكلاء العامين المتوافقين مع OpenAI
- كما تحتفظ مسارات OpenAI الأصلية أيضًا بحقل Responses `store`، وتلميحات cache للموجّهات، و
  تشكيل حمولة التوافق مع استدلال OpenAI؛ أما المسارات عبر الوكيل فلا تحتفظ بذلك
- تم كبت `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن OpenAI API الحية ترفضه؛ ويُعامل Spark على أنه خاص بـ Codex فقط

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- الموفّر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS`، و`ANTHROPIC_API_KEY_1`، و`ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال على النموذج: `anthropic/claude-opus-4-6`
- CLI: ‏`openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح `/fast` المشترك و`params.fastMode`، بما في ذلك الحركة المرسلة بالمصادقة عبر مفتاح API أو OAuth إلى `api.anthropic.com`؛ ويقوم OpenClaw بربط ذلك إلى Anthropic `service_tier` (`auto` مقابل `standard_only`)
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مرة أخرى، لذا يعامل OpenClaw إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مسموحان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- يظل رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- الموفّر: `openai-codex`
- المصادقة: OAuth ‏(ChatGPT)
- مثال على النموذج: `openai-codex/gpt-5.4`
- CLI: ‏`openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم الرجوع إلى SSE)
- تجاوز لكل نموذج عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`، أو `"websocket"`، أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` في طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- تُرفق ترويسات نسب OpenClaw المخفية (`originator`، و`version`،
  و`User-Agent`) فقط على حركة Codex الأصلية إلى
  `chatgpt.com/backend-api`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- يشارك نفس مفتاح `/fast` وإعداد `params.fastMode` الخاص بـ `openai/*` المباشر؛ ويقوم OpenClaw بربط ذلك إلى `service_tier=priority`
- يظل `openai-codex/gpt-5.3-codex-spark` متاحًا عندما يعرضه فهرس Codex OAuth؛ وذلك بحسب الاستحقاق
- يحتفظ `openai-codex/gpt-5.4` بالقيمة الأصلية `contextWindow = 1050000` وبحد وقت تشغيل افتراضي `contextTokens = 272000`؛ ويمكنك تجاوز حد وقت التشغيل عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة السياسة: إن OpenAI Codex OAuth مدعوم صراحةً للأدوات/التدفقات الخارجية مثل OpenClaw.

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

### خيارات مستضافة أخرى على نمط الاشتراك

- [Qwen Cloud](/ar/providers/qwen): سطح موفّر Qwen Cloud بالإضافة إلى تعيين نقطة نهاية Alibaba DashScope وCoding Plan
- [MiniMax](/ar/providers/minimax): وصول MiniMax Coding Plan عبر OAuth أو مفتاح API
- [GLM Models](/ar/providers/glm): نقاط نهاية Z.AI Coding Plan أو API العامة

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفّر وقت تشغيل Zen: ‏`opencode`
- موفّر وقت تشغيل Go: ‏`opencode-go`
- أمثلة على النماذج: `opencode/claude-opus-4-6`، `opencode-go/kimi-k2.5`
- CLI: ‏`openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- الموفّر: `google`
- المصادقة: `GEMINI_API_KEY`
- تدوير اختياري: `GEMINI_API_KEYS`، و`GEMINI_API_KEY_1`، و`GEMINI_API_KEY_2`، وخيار `GOOGLE_API_KEY` الرجوعي، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `google/gemini-3.1-pro-preview`، `google/gemini-3-flash-preview`
- التوافق: يتم تطبيع إعداد OpenClaw القديم الذي يستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: ‏`openclaw onboard --auth-choice gemini-api-key`
- تقبل عمليات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent`
  (أو `cached_content` القديم) لتمرير مقبض
  `cachedContents/...` أصلي من الموفّر؛ وتظهر إصابات cache في Gemini على أنها `cacheRead` في OpenClaw

### Google Vertex وGemini CLI

- الموفّران: `google-vertex`، `google-gemini-cli`
- المصادقة: يستخدم Vertex ‏gcloud ADC؛ بينما يستخدم Gemini CLI تدفق OAuth الخاص به
- تحذير: إن Gemini CLI OAuth في OpenClaw تكامل غير رسمي. وقد أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من جهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
- يتم شحن Gemini CLI OAuth كجزء من Plugin ‏`google` المضمّن.
  - ثبّت Gemini CLI أولًا:
    - `brew install gemini-cli`
    - أو `npm install -g @google/gemini-cli`
  - فعّل: `openclaw plugins enable google`
  - سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
  - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
  - ملاحظة: أنت **لا** تلصق client id أو secret في `openclaw.json`. إذ يخزن تدفق تسجيل الدخول عبر CLI
    الرموز في ملفات تعريف المصادقة على مضيف gateway.
  - إذا فشلت الطلبات بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف gateway.
  - يتم تحليل ردود JSON الخاصة بـ Gemini CLI من `response`؛ بينما يعود الاستخدام إلى
    `stats`، مع تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- الموفّر: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال على النموذج: `zai/glm-5.1`
- CLI: ‏`openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: يتم تطبيع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ بينما يفرض `zai-coding-global`، و`zai-coding-cn`، و`zai-global`، و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- الموفّر: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- مثال على النموذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: ‏`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- الموفّر: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال على النموذج: `kilocode/kilo/auto`
- CLI: ‏`openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يأتي فهرس الرجوع الاحتياطي الثابت مع `kilocode/kilo/auto`؛ ويمكن
  لاكتشاف `https://api.kilo.ai/api/gateway/models` الحي توسيع
  فهرس وقت التشغيل أكثر.
- إن التوجيه الدقيق للمنبع وراء `kilocode/kilo/auto` مملوك لـ Kilo Gateway،
  وليس مضمّنًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للحصول على تفاصيل الإعداد.

### Plugins الموفّر المضمّنة الأخرى

- OpenRouter: ‏`openrouter` (`OPENROUTER_API_KEY`)
- مثال على النموذج: `openrouter/auto`
- يطبّق OpenClaw ترويسات نسب التطبيق الموثقة من OpenRouter فقط عندما
  يستهدف الطلب فعلًا `openrouter.ai`
- كما تُقيَّد علامات `cache_control` الخاصة بـ Anthropic والمخصصة لـ OpenRouter
  أيضًا بمسارات OpenRouter التي تم التحقق منها، وليس بعناوين URL الوكيلة الاعتباطية
- يظل OpenRouter على مسار الوكيل المتوافق مع OpenAI، لذلك لا يتم تمرير
  تشكيل الطلب الأصلي الخاص بـ OpenAI فقط (`serviceTier`، و`store` في Responses،
  وتلميحات cache للموجّهات، وحمولات التوافق مع استدلال OpenAI)
- تحتفظ مراجع OpenRouter المبنية على Gemini فقط بمسار تنقية thought-signature الخاص بـ Gemini عبر الوكيل؛
  بينما يظل التحقق الأصلي من إعادة تشغيل Gemini وإعادات كتابة التمهيد معطّلين
- Kilo Gateway: ‏`kilocode` (`KILOCODE_API_KEY`)
- مثال على النموذج: `kilocode/kilo/auto`
- تحتفظ مراجع Kilo المبنية على Gemini بنفس
  مسار تنقية thought-signature الخاص بـ Gemini عبر الوكيل؛ أما `kilocode/kilo/auto` وغيرها من
  التلميحات الوكيلة غير الداعمة لاستدلال الوكيل فتتخطى حقن استدلال الوكيل
- MiniMax: ‏`minimax` (مفتاح API) و`minimax-portal` (OAuth)
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`
- مثال على النموذج: `minimax/MiniMax-M2.7` أو `minimax-portal/MiniMax-M2.7`
- تكتب تهيئة MiniMax/إعداد مفتاح API تعريفات صريحة لنموذج M2.7 مع
  `input: ["text", "image"]`؛ بينما يُبقي فهرس الموفّر المضمّن مراجع الدردشة
  نصية فقط إلى أن يتم تشكيل إعداد هذا الموفّر
- Moonshot: ‏`moonshot` (`MOONSHOT_API_KEY`)
- مثال على النموذج: `moonshot/kimi-k2.6`
- Kimi Coding: ‏`kimi` (`KIMI_API_KEY` أو `KIMICODE_API_KEY`)
- مثال على النموذج: `kimi/kimi-code`
- Qianfan: ‏`qianfan` (`QIANFAN_API_KEY`)
- مثال على النموذج: `qianfan/deepseek-v3.2`
- Qwen Cloud: ‏`qwen` (`QWEN_API_KEY`، أو `MODELSTUDIO_API_KEY`، أو `DASHSCOPE_API_KEY`)
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
  - تستخدم طلبات xAI المضمّنة الأصلية مسار xAI Responses
  - يقوم `/fast` أو `params.fastMode: true` بإعادة كتابة `grok-3`، و`grok-3-mini`،
    و`grok-4`، و`grok-4-0709` إلى متغيراتها `*-fast`
  - يكون `tool_stream` مفعّلًا افتراضيًا؛ اضبط
    `agents.defaults.models["xai/<model>"].params.tool_stream` على `false` من أجل
    تعطيله
- Mistral: ‏`mistral` (`MISTRAL_API_KEY`)
- مثال على النموذج: `mistral/mistral-large-latest`
- CLI: ‏`openclaw onboard --auth-choice mistral-api-key`
- Groq: ‏`groq` (`GROQ_API_KEY`)
- Cerebras: ‏`cerebras` (`CEREBRAS_API_KEY`)
  - تستخدم نماذج GLM على Cerebras المعرّفين `zai-glm-4.7` و`zai-glm-4.6`.
  - عنوان URL الأساسي المتوافق مع OpenAI: ‏`https://api.cerebras.ai/v1`.
- GitHub Copilot: ‏`github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- مثال نموذج Hugging Face Inference: ‏`huggingface/deepseek-ai/DeepSeek-R1`؛ وCLI: ‏`openclaw onboard --auth-choice huggingface-api-key`. راجع [Hugging Face (Inference)](/ar/providers/huggingface).

## الموفّرون عبر `models.providers` (مخصص/عنوان URL أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة موفّرين **مخصصين** أو
وكلاء متوافقين مع OpenAI/Anthropic.

العديد من Plugins الموفّر المضمّنة أدناه تنشر بالفعل فهرسًا افتراضيًا.
استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز
عنوان URL الأساسي أو الترويسات أو قائمة النماذج الافتراضية.

### Moonshot AI (Kimi)

يأتي Moonshot باعتباره Plugin موفّرًا مضمّنًا. استخدم الموفّر المضمّن
افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما
تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات النموذج الوصفية:

- الموفّر: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال على النموذج: `moonshot/kimi-k2.6`
- CLI: ‏`openclaw onboard --auth-choice moonshot-api-key` أو `openclaw onboard --auth-choice moonshot-api-key-cn`

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

يستخدم Kimi Coding نقطة النهاية المتوافقة مع Anthropic الخاصة بـ Moonshot AI:

- الموفّر: `kimi`
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

لا يزال `kimi/k2p5` القديم مقبولًا باعتباره معرّف نموذج توافق.

### Volcano Engine (Doubao)

يوفّر Volcano Engine (火山引擎) وصولًا إلى Doubao ونماذج أخرى داخل الصين.

- الموفّر: `volcengine` (البرمجة: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- مثال على النموذج: `volcengine-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

تستخدم التهيئة الافتراضية سطح البرمجة، لكن فهرس `volcengine/*`
العام يُسجَّل في الوقت نفسه.

في أدوات اختيار النموذج الخاصة بالتهيئة/الضبط، يفضّل خيار مصادقة Volcengine كِلَا
الصفّين `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن هذه النماذج محمّلة بعد،
فسيرجع OpenClaw إلى الفهرس غير المصفّى بدلًا من إظهار أداة اختيار فارغة
محددة بنطاق الموفّر.

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

### BytePlus (دولي)

يوفّر BytePlus ARK وصولًا إلى النماذج نفسها التي يوفّرها Volcano Engine للمستخدمين الدوليين.

- الموفّر: `byteplus` (البرمجة: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- مثال على النموذج: `byteplus-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

تستخدم التهيئة الافتراضية سطح البرمجة، لكن فهرس `byteplus/*`
العام يُسجَّل في الوقت نفسه.

في أدوات اختيار النموذج الخاصة بالتهيئة/الضبط، يفضّل خيار مصادقة BytePlus كِلَا
الصفّين `byteplus/*` و`byteplus-plan/*`. وإذا لم تكن هذه النماذج محمّلة بعد،
فسيرجع OpenClaw إلى الفهرس غير المصفّى بدلًا من إظهار أداة اختيار فارغة
محددة بنطاق الموفّر.

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

يوفّر Synthetic نماذج متوافقة مع Anthropic خلف الموفّر `synthetic`:

- الموفّر: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- مثال على النموذج: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: ‏`openclaw onboard --auth-choice synthetic-api-key`

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

يتم تكوين MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح API لـ MiniMax (عالمي): `--auth-choice minimax-global-api`
- مفتاح API لـ MiniMax (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو
  `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للحصول على تفاصيل الإعداد، وخيارات النماذج، ومقتطفات الإعدادات.

على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير
افتراضيًا ما لم تقم بضبطه صراحةً، ويؤدي `/fast on` إلى إعادة كتابة
`MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

تقسيم القدرات المملوك من Plugin:

- تظل افتراضيات النص/الدردشة على `minimax/MiniMax-M2.7`
- يكون توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- يكون فهم الصور هو `MiniMax-VL-01` المملوك من Plugin على مساري مصادقة MiniMax كليهما
- يظل البحث على الويب على معرّف الموفّر `minimax`

### LM Studio

يأتي LM Studio باعتباره Plugin موفّرًا مضمّنًا يستخدم API الأصلي:

- الموفّر: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يعيدها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw المسارين الأصليين في LM Studio ‏`/api/v1/models` و`/api/v1/models/load`
للاكتشاف + التحميل التلقائي، مع استخدام `/v1/chat/completions` للاستدلال افتراضيًا.
راجع [/providers/lmstudio](/ar/providers/lmstudio) للحصول على الإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama باعتباره Plugin موفّرًا مضمّنًا ويستخدم API الأصلي لـ Ollama:

- الموفّر: `ollama`
- المصادقة: لا شيء مطلوب (خادم محلي)
- مثال على النموذج: `ollama/llama3.3`
- التثبيت: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

يتم اكتشاف Ollama محليًا عند `http://127.0.0.1:11434` عندما تقوم بالاشتراك باستخدام
`OLLAMA_API_KEY`، ويضيف Plugin الموفّر المضمّن Ollama مباشرة إلى
`openclaw onboard` وأداة اختيار النموذج. راجع [/providers/ollama](/ar/providers/ollama)
للاطلاع على التهيئة، ووضع السحابة/الوضع المحلي، والإعدادات المخصصة.

### vLLM

يأتي vLLM باعتباره Plugin موفّرًا مضمّنًا لخوادم OpenAI-compatible
المحلية/المستضافة ذاتيًا:

- الموفّر: `vllm`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang باعتباره Plugin موفّرًا مضمّنًا لخوادم OpenAI-compatible
السريعة والمستضافة ذاتيًا:

- الموفّر: `sglang`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا
يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### الوكلاء المحليون (LM Studio، وvLLM، وLiteLLM، وغير ذلك)

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

- بالنسبة إلى الموفّرين المخصصين، تكون `reasoning`، و`input`، و`cost`، و`contextWindow`، و`maxTokens` اختيارية.
  وعند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- الموصى به: اضبط قيمًا صريحة تطابق حدود الوكيل/النموذج لديك.
- بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من الموفّر بشأن أدوار `developer` غير المدعومة.
- كما تتخطى أيضًا المسارات الوكيلة المتوافقة مع OpenAI تشكيل الطلب الأصلي الخاص بـ OpenAI فقط:
  لا يوجد `service_tier`، ولا `store` في Responses، ولا تلميحات cache للموجّهات، ولا
  تشكيل حمولة التوافق مع استدلال OpenAI، ولا ترويسات نسب OpenClaw
  المخفية.
- إذا كان `baseUrl` فارغًا/محذوفًا، فسيحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
- ولأسباب السلامة، لا يزال يتم تجاوز `compat.supportsDeveloperRole: true` الصريح على نقاط النهاية غير الأصلية `openai-completions`.

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [/gateway/configuration](/ar/gateway/configuration) للحصول على أمثلة إعدادات كاملة.

## ذو صلة

- [النماذج](/ar/concepts/models) — إعدادات النماذج والأسماء المستعارة
- [الرجوع الاحتياطي للنموذج](/ar/concepts/model-failover) — سلاسل الرجوع الاحتياطي وسلوك إعادة المحاولة
- [مرجع الإعدادات](/ar/gateway/configuration-reference#agent-defaults) — مفاتيح إعدادات النموذج
- [الموفّرون](/ar/providers) — أدلة إعداد لكل موفّر
