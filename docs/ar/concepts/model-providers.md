---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج لكل موفّر على حدة
    - تريد أمثلة على الإعدادات أو أوامر التهيئة عبر CLI لموفّري النماذج
summary: نظرة عامة على موفّر النموذج مع أمثلة على الإعدادات وتدفقات CLI
title: موفّرو النماذج
x-i18n:
    generated_at: "2026-04-21T13:35:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6732ab672757579c09395583a0f7d110348c909d4e4ab1d2accad68ad054c636
    source_path: concepts/model-providers.md
    workflow: 15
---

# موفّرو النماذج

تغطي هذه الصفحة **موفّري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram).
للاطّلاع على قواعد اختيار النموذج، راجع [/concepts/models](/ar/concepts/models).

## قواعد سريعة

- تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
- إذا قمت بتعيين `agents.defaults.models`، فسيصبح قائمة السماح.
- مساعدات CLI: `openclaw onboard` و`openclaw models list` و`openclaw models set <provider/model>`.
- قواعد التشغيل الاحتياطي وقت التشغيل، وفحوصات التهدئة، واستمرارية تجاوزات الجلسة
  موثّقة في [/concepts/model-failover](/ar/concepts/model-failover).
- `models.providers.*.models[].contextWindow` هي بيانات وصفية أصلية للنموذج؛
  أما `models.providers.*.models[].contextTokens` فهو الحدّ الفعّال وقت التشغيل.
- يمكن لـ Plugin الخاصة بالموفّر حقن فهارس النماذج عبر `registerProvider({ catalog })`؛
  ويقوم OpenClaw بدمج هذا الناتج في `models.providers` قبل كتابة
  `models.json`.
- يمكن لبيانات توصيف الموفّر إعلان `providerAuthEnvVars` و
  `providerAuthAliases` بحيث لا تحتاج فحوصات المصادقة العامة المعتمدة على المتغيرات البيئية
  ومتغيرات الموفّر إلى تحميل وقت تشغيل Plugin. أما خريطة متغيرات البيئة الأساسية المتبقية
  فهي الآن مخصّصة فقط للموفّرين الأساسيين/غير المعتمدين على Plugin وبعض حالات
  الأولوية العامة القليلة مثل تهيئة Anthropic التي تبدأ بمفتاح API.
- يمكن لـ Plugin الخاصة بالموفّر أيضًا امتلاك سلوك وقت تشغيل الموفّر عبر
  `normalizeModelId` و`normalizeTransport` و`normalizeConfig` و
  `applyNativeStreamingUsageCompat` و`resolveConfigApiKey` و
  `resolveSyntheticAuth` و`shouldDeferSyntheticProfileAuth` و
  `resolveDynamicModel` و`prepareDynamicModel` و
  `normalizeResolvedModel` و`contributeResolvedModelCompat` و
  `capabilities` و`normalizeToolSchemas` و
  `inspectToolSchemas` و`resolveReasoningOutputMode` و
  `prepareExtraParams` و`createStreamFn` و`wrapStreamFn` و
  `resolveTransportTurnState` و`resolveWebSocketSessionPolicy` و
  `createEmbeddingProvider` و`formatApiKey` و`refreshOAuth` و
  `buildAuthDoctorHint` و
  `matchesContextOverflowError` و`classifyFailoverReason` و
  `isCacheTtlEligible` و`buildMissingAuthMessage` و`suppressBuiltInModel` و
  `augmentModelCatalog` و`resolveThinkingProfile` و`isBinaryThinking` و
  `supportsXHighThinking` و`resolveDefaultThinkingLevel` و
  `applyConfigDefaults` و`isModernModelRef` و
  `prepareRuntimeAuth` و`resolveUsageAuth` و`fetchUsageSnapshot` و
  `onModelSelected`.
- ملاحظة: إن `capabilities` الخاصة بوقت تشغيل الموفّر هي بيانات وصفية مشتركة للمشغّل (عائلة الموفّر، وخصائص السجل والأدوات، وتلميحات النقل/التخزين المؤقت). وهي ليست
  نفسها [نموذج القدرات العام](/ar/plugins/architecture#public-capability-model)
  الذي يصف ما الذي يسجله Plugin (استدلال نصي، كلام، إلخ).
- الموفّر المضمّن `codex` مقترن ببيئة Codex المضمّنة للوكيل.
  استخدم `codex/gpt-*` عندما تريد تسجيل دخول مملوكًا لـ Codex، واكتشاف النماذج،
  واستئناف السلاسل الأصلية، وتنفيذ خادم التطبيق. أما مراجع `openai/gpt-*` العادية
  فتستمر في استخدام موفّر OpenAI ونقل موفّر OpenClaw العادي.
  ويمكن لعمليات النشر الخاصة بـ Codex فقط تعطيل الرجوع التلقائي إلى PI عبر
  `agents.defaults.embeddedHarness.fallback: "none"`؛ راجع
  [Codex Harness](/ar/plugins/codex-harness).

## سلوك الموفّر المملوك لـ Plugin

يمكن الآن لـ Plugin الخاصة بالموفّر امتلاك معظم المنطق الخاص بكل موفّر بينما يحتفظ OpenClaw
بحلقة الاستدلال العامة.

التقسيم المعتاد:

- `auth[].run` / `auth[].runNonInteractive`: يتولى الموفّر تدفقات
  التهيئة/تسجيل الدخول لـ `openclaw onboard` و`openclaw models auth` والإعداد
  دون تفاعل
- `wizard.setup` / `wizard.modelPicker`: يتولى الموفّر تسميات خيارات المصادقة،
  والأسماء المستعارة القديمة، وتلميحات قائمة السماح للتهيئة، وإدخالات الإعداد في محددات التهيئة/النماذج
- `catalog`: يظهر الموفّر في `models.providers`
- `normalizeModelId`: يقوم الموفّر بتطبيع معرّفات النماذج القديمة/التجريبية قبل
  البحث أو التحويل إلى الصيغة القياسية
- `normalizeTransport`: يقوم الموفّر بتطبيع `api` / `baseUrl` الخاصة بعائلة النقل
  قبل التجميع العام للنموذج؛ يفحص OpenClaw أولًا الموفّر المطابق،
  ثم Plugin الأخرى القادرة على هذه الخطافات حتى تقوم إحداها فعليًا بتغيير
  النقل
- `normalizeConfig`: يقوم الموفّر بتطبيع إعداد `models.providers.<id>` قبل
  أن يستخدمه وقت التشغيل؛ يفحص OpenClaw أولًا الموفّر المطابق، ثم Plugin الأخرى
  القادرة على هذه الخطافات حتى تقوم إحداها فعليًا بتغيير الإعداد. إذا لم تقم أي
  خطافة موفّر بإعادة كتابة الإعداد، فإن مساعدات Google-family المضمّنة
  لا تزال تطبّع إدخالات موفّري Google المدعومة.
- `applyNativeStreamingUsageCompat`: يطبّق الموفّر عمليات إعادة كتابة توافق
  استخدام البث الأصلي المعتمدة على نقطة النهاية لموفّري الإعدادات
- `resolveConfigApiKey`: يحلّ الموفّر مصادقة مؤشرات البيئة لموفّري الإعدادات
  دون فرض تحميل كامل لمصادقة وقت التشغيل. كما أن `amazon-bedrock` يحتوي أيضًا على
  محلّل مؤشرات بيئة AWS مضمّن هنا، رغم أن مصادقة وقت تشغيل Bedrock تستخدم
  سلسلة AWS SDK الافتراضية.
- `resolveSyntheticAuth`: يمكن للموفّر كشف توفر المصادقة المحلية/المستضافة ذاتيًا
  أو غيرها من المصادقات المدعومة بالإعدادات دون تخزين أسرار نصية صريحة
- `shouldDeferSyntheticProfileAuth`: يمكن للموفّر وسم العناصر النائبة المخزّنة
  لملفات التعريف الاصطناعية على أنها أقل أولوية من المصادقة المدعومة
  بالبيئة/الإعدادات
- `resolveDynamicModel`: يقبل الموفّر معرّفات النماذج غير الموجودة بعد في
  الفهرس الثابت المحلي
- `prepareDynamicModel`: يحتاج الموفّر إلى تحديث للبيانات الوصفية قبل إعادة محاولة
  الحل الديناميكي
- `normalizeResolvedModel`: يحتاج الموفّر إلى إعادة كتابة للنقل أو base URL
- `contributeResolvedModelCompat`: يساهم الموفّر بعلامات توافق خاصة بـ
  نماذج المورّد التابعة له حتى عندما تصل عبر نقل متوافق آخر
- `capabilities`: ينشر الموفّر خصائص السجل/الأدوات/عائلة الموفّر
- `normalizeToolSchemas`: ينظّف الموفّر مخططات الأدوات قبل أن يراها
  المشغّل المضمّن
- `inspectToolSchemas`: يعرض الموفّر تحذيرات المخطط الخاصة بالنقل
  بعد التطبيع
- `resolveReasoningOutputMode`: يختار الموفّر بين عقود مخرجات الاستدلال
  الأصلية أو المعلّمة
- `prepareExtraParams`: يعيّن الموفّر القيم الافتراضية أو يطبّع معلمات الطلب
  لكل نموذج
- `createStreamFn`: يستبدل الموفّر مسار البث العادي بنقل
  مخصّص بالكامل
- `wrapStreamFn`: يطبّق الموفّر أغلفة توافق الطلب/الجسم/النموذج
- `resolveTransportTurnState`: يوفّر الموفّر رؤوس نقل أصلية لكل دورة
  أو بيانات وصفية
- `resolveWebSocketSessionPolicy`: يوفّر الموفّر رؤوس جلسات WebSocket الأصلية
  أو سياسة تهدئة الجلسة
- `createEmbeddingProvider`: يمتلك الموفّر سلوك التضمين الخاص بالذاكرة عندما
  يكون من الأنسب أن ينتمي إلى Plugin الخاصة بالموفّر بدلًا من لوحة التحويل
  الأساسية للتضمين
- `formatApiKey`: ينسّق الموفّر ملفات تعريف المصادقة المخزّنة إلى
  سلسلة `apiKey` الخاصة بوقت التشغيل والمتوقعة من النقل
- `refreshOAuth`: يمتلك الموفّر تحديث OAuth عندما لا تكون أدوات التحديث المشتركة
  `pi-ai` كافية
- `buildAuthDoctorHint`: يضيف الموفّر إرشادات إصلاح عند فشل
  تحديث OAuth
- `matchesContextOverflowError`: يتعرّف الموفّر على
  أخطاء تجاوز نافذة السياق الخاصة بالموفّر التي قد تفوتها الاستدلالات العامة
- `classifyFailoverReason`: يربط الموفّر أخطاء النقل/API الخام الخاصة بالموفّر
  بأسباب التحويل الاحتياطي مثل تجاوز الحد أو الحمل الزائد
- `isCacheTtlEligible`: يقرر الموفّر أي معرّفات النماذج العليا تدعم مدة صلاحية ذاكرة التخزين المؤقت للموجّه
- `buildMissingAuthMessage`: يستبدل الموفّر خطأ مخزن المصادقة العام
  بتلميح استرداد خاص بالموفّر
- `suppressBuiltInModel`: يخفي الموفّر الصفوف العليا القديمة ويمكنه إرجاع
  خطأ مملوك للمورّد عند فشل الحل المباشر
- `augmentModelCatalog`: يضيف الموفّر صفوف فهرس اصطناعية/نهائية بعد
  الاكتشاف ودمج الإعدادات
- `resolveThinkingProfile`: يمتلك الموفّر مجموعة مستويات `/think` الدقيقة،
  وتسميات العرض الاختيارية، والمستوى الافتراضي للنموذج المحدد
- `isBinaryThinking`: خطاف توافق لواجهة التفكير الثنائية تشغيل/إيقاف
- `supportsXHighThinking`: خطاف توافق لنماذج `xhigh` المحددة
- `resolveDefaultThinkingLevel`: خطاف توافق لسياسة `/think` الافتراضية
- `applyConfigDefaults`: يطبّق الموفّر الإعدادات الافتراضية العامة الخاصة به
  أثناء تجسيد الإعدادات بناءً على وضع المصادقة أو البيئة أو عائلة النموذج
- `isModernModelRef`: يمتلك الموفّر مطابقة النماذج المفضلة المباشرة/الخاصة باختبارات smoke
- `prepareRuntimeAuth`: يحوّل الموفّر بيانات الاعتماد المهيأة إلى
  رمز وقت تشغيل قصير العمر
- `resolveUsageAuth`: يحلّ الموفّر بيانات اعتماد الاستخدام/الحصة لـ `/usage`
  والأسطح الأخرى ذات الصلة بالحالة/التقارير
- `fetchUsageSnapshot`: يمتلك الموفّر جلب/تحليل نقطة نهاية الاستخدام بينما
  يظلّ اللب مسؤولًا عن غلاف الملخص والتنسيق
- `onModelSelected`: يشغّل الموفّر تأثيرات لاحقة بعد الاختيار مثل
  القياس عن بُعد أو حفظ الجلسة المملوك للموفّر

الأمثلة المضمّنة الحالية:

- `anthropic`: توافق مستقبلي احتياطي لـ Claude 4.6، وتلميحات إصلاح المصادقة، وجلب
  نقطة نهاية الاستخدام، وبيانات وصفية خاصة بعائلة الموفّر ومدة صلاحية التخزين المؤقت، وإعدادات عامة
  افتراضية تراعي المصادقة
- `amazon-bedrock`: مطابقة تجاوز نافذة السياق مملوكة للموفّر وتصنيف
  أسباب التحويل الاحتياطي لأخطاء Bedrock الخاصة مثل التقييد/عدم الجاهزية، بالإضافة
  إلى عائلة إعادة التشغيل المشتركة `anthropic-by-model` لحواجز سياسة إعادة التشغيل
  الخاصة بـ Claude فقط على حركة Anthropic
- `anthropic-vertex`: حواجز سياسة إعادة التشغيل الخاصة بـ Claude فقط على
  حركة رسائل Anthropic
- `openrouter`: معرّفات نماذج تمريرية، وأغلفة الطلبات، وتلميحات قدرات الموفّر،
  وتنقية توقيع أفكار Gemini على حركة Gemini عبر الوكيل، وحقن الاستدلال عبر
  الوكيل من خلال عائلة البث `openrouter-thinking`، وتمرير بيانات وصفية
  للتوجيه، وسياسة مدة صلاحية التخزين المؤقت
- `github-copilot`: التهيئة/تسجيل الدخول عبر الجهاز، والتوافق المستقبلي الاحتياطي للنموذج،
  وتلميحات سجل Claude للتفكير، وتبادل الرموز وقت التشغيل، وجلب نقطة نهاية
  الاستخدام
- `openai`: توافق مستقبلي احتياطي لـ GPT-5.4، وتطبيع
  النقل المباشر لـ OpenAI، وتلميحات فقدان المصادقة المدركة لـ Codex، وقمع Spark،
  وصفوف فهرس اصطناعية لـ OpenAI/Codex، وسياسة التفكير/النماذج الحية، وتطبيع
  الأسماء المستعارة لرموز الاستخدام (`input` / `output` و`prompt` / `completion`)، وعائلة
  البث المشتركة `openai-responses-defaults` لأغلفة OpenAI/Codex الأصلية،
  وبيانات وصفية خاصة بعائلة الموفّر، وتسجيل موفّر توليد الصور المضمّن
  لـ `gpt-image-1`، وتسجيل موفّر توليد الفيديو المضمّن
  لـ `sora-2`
- `google` و`google-gemini-cli`: توافق مستقبلي احتياطي لـ Gemini 3.1،
  والتحقق الأصلي من إعادة تشغيل Gemini، وتنقية إعادة التشغيل عند الإقلاع، ووضع
  مخرجات الاستدلال المعلّمة، ومطابقة النماذج الحديثة، وتسجيل موفّر توليد
  الصور المضمّن لنماذج Gemini image-preview، وتسجيل موفّر توليد
  الفيديو المضمّن لنماذج Veo؛ كما أن OAuth الخاص بـ Gemini CLI
  يمتلك أيضًا تنسيق رموز ملف تعريف المصادقة، وتحليل رموز الاستخدام، وجلب
  نقطة نهاية الحصة لواجهات الاستخدام
- `moonshot`: نقل مشترك، وتطبيع حمولة التفكير مملوك لـ Plugin
- `kilocode`: نقل مشترك، ورؤوس طلبات مملوكة لـ Plugin، وتطبيع
  حمولة الاستدلال، وتنقية توقيع أفكار Gemini عبر الوكيل، وسياسة
  مدة صلاحية التخزين المؤقت
- `zai`: توافق مستقبلي احتياطي لـ GLM-5، وافتراضات `tool_stream`، وسياسة
  مدة صلاحية التخزين المؤقت، وسياسة التفكير الثنائي/النماذج الحية، ومصادقة الاستخدام + جلب الحصة؛
  يتم توليف معرّفات `glm-5*` غير المعروفة من قالب `glm-4.7` المضمّن
- `xai`: تطبيع نقل Responses الأصلي، وإعادة كتابة الأسماء المستعارة `/fast` لـ
  متغيرات Grok السريعة، و`tool_stream` الافتراضي، وتنظيف
  مخططات الأدوات / حمولة الاستدلال الخاصة بـ xAI، وتسجيل موفّر توليد الفيديو
  المضمّن لـ `grok-imagine-video`
- `mistral`: بيانات وصفية للقدرات مملوكة لـ Plugin
- `opencode` و`opencode-go`: بيانات وصفية للقدرات مملوكة لـ Plugin بالإضافة
  إلى تنقية توقيع أفكار Gemini عبر الوكيل
- `alibaba`: فهرس توليد فيديو مملوك لـ Plugin لمراجع نماذج Wan المباشرة
  مثل `alibaba/wan2.6-t2v`
- `byteplus`: فهارس مملوكة لـ Plugin بالإضافة إلى تسجيل موفّر توليد الفيديو
  المضمّن لنماذج Seedance لتحويل النص إلى فيديو/الصورة إلى فيديو
- `fal`: تسجيل موفّر توليد الفيديو المضمّن لنماذج الجهات الخارجية المستضافة
  وتسجيل موفّر توليد الصور لنماذج صور FLUX بالإضافة إلى تسجيل موفّر
  توليد الفيديو المضمّن لنماذج الفيديو المستضافة من جهات خارجية
- `cloudflare-ai-gateway` و`huggingface` و`kimi` و`nvidia` و`qianfan` و
  `stepfun` و`synthetic` و`venice` و`vercel-ai-gateway` و`volcengine`:
  فهارس مملوكة لـ Plugin فقط
- `qwen`: فهارس مملوكة لـ Plugin للنماذج النصية بالإضافة إلى تسجيلات
  موفّر الفهم متعدد الوسائط وتوليد الفيديو المشتركة لواجهاته
  متعددة الوسائط؛ يستخدم توليد الفيديو في Qwen نقاط نهاية فيديو DashScope القياسية
  مع نماذج Wan المضمّنة مثل `wan2.6-t2v` و`wan2.7-r2v`
- `runway`: تسجيل موفّر توليد فيديو مملوك لـ Plugin لنماذج Runway الأصلية
  المعتمدة على المهام مثل `gen4.5`
- `minimax`: فهارس مملوكة لـ Plugin، وتسجيل موفّر توليد الفيديو المضمّن
  لنماذج فيديو Hailuo، وتسجيل موفّر توليد الصور المضمّن
  لـ `image-01`، واختيار هجين لسياسة إعادة التشغيل بين Anthropic/OpenAI،
  ومنطق مصادقة/لقطات الاستخدام
- `together`: فهارس مملوكة لـ Plugin بالإضافة إلى تسجيل موفّر توليد الفيديو
  المضمّن لنماذج فيديو Wan
- `xiaomi`: فهارس مملوكة لـ Plugin بالإضافة إلى منطق مصادقة/لقطات الاستخدام

أصبحت Plugin المضمّنة `openai` الآن تمتلك معرّفي الموفّر كليهما: `openai` و
`openai-codex`.

هذا يغطّي الموفّرين الذين ما زالوا يتوافقون مع عمليات النقل العادية في OpenClaw. أما الموفّر
الذي يحتاج إلى منفّذ طلبات مخصّص بالكامل فهو سطح توسعة منفصل وأعمق.

## تدوير مفاتيح API

- يدعم تدويرًا عامًا للمفاتيح لدى موفّرين محددين.
- قم بإعداد عدة مفاتيح عبر:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز حي واحد، أعلى أولوية)
  - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
  - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
  - `<PROVIDER>_API_KEY_*` (قائمة مرقّمة، مثل `<PROVIDER>_API_KEY_1`)
- بالنسبة إلى موفّري Google، يتم أيضًا تضمين `GOOGLE_API_KEY` كخيار احتياطي.
- يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.
- يُعاد تنفيذ الطلبات باستخدام المفتاح التالي فقط عند استجابات تجاوز الحد (مثل
  `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many
concurrent requests` أو `ThrottlingException` أو `concurrency limit reached`،
  أو `workers_ai ... quota limit exceeded`، أو رسائل حدود الاستخدام الدورية).
- تفشل حالات الإخفاق غير المتعلقة بتجاوز الحد فورًا؛ ولا تتم محاولة تدوير المفاتيح.
- عندما تفشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من آخر محاولة.

## الموفّرون المضمّنون (فهرس pi-ai)

يشحن OpenClaw مع فهرس pi‑ai. لا تتطلب هذه الموفّرات أي إعداد
`models.providers`؛ فقط عيّن المصادقة واختر نموذجًا.

### OpenAI

- الموفّر: `openai`
- المصادقة: `OPENAI_API_KEY`
- التدوير الاختياري: `OPENAI_API_KEYS` و`OPENAI_API_KEY_1` و`OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `openai/gpt-5.4` و`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE كخيار احتياطي)
- قم بالتجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم تفعيل الإحماء المسبق لـ OpenAI Responses WebSocket افتراضيًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يقوم `/fast` و`params.fastMode` بربط طلبات Responses المباشرة `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحًا بدلًا من مفتاح `/fast` المشترك
- تنطبق رؤوس إسناد OpenClaw المخفية (`originator` و`version` و
  `User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على
  الوكلاء العامين المتوافقين مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بإعداد `store` في Responses، وتلميحات
  التخزين المؤقت للموجّه، وتشكيل حمولة توافق استدلال OpenAI؛ أما المسارات
  الوكيلة فلا تفعل ذلك
- تم قمع `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن OpenAI API الحي يرفضه؛ ويُعامل Spark على أنه خاص بـ Codex فقط

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- الموفّر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- التدوير الاختياري: `ANTHROPIC_API_KEYS` و`ANTHROPIC_API_KEY_1` و`ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال على نموذج: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة أيضًا مفتاح `/fast` المشترك و`params.fastMode`، بما في ذلك الحركة الموثقة بمفتاح API وOAuth المرسلة إلى `api.anthropic.com`؛ ويقوم OpenClaw بربط ذلك إلى `service_tier` في Anthropic (`auto` مقابل `standard_only`)
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مسموحان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- يظل رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- الموفّر: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مثال على نموذج: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE كخيار احتياطي)
- قم بالتجاوز لكل نموذج عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` في طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- تُرفق رؤوس إسناد OpenClaw المخفية (`originator` و`version` و
  `User-Agent`) فقط على حركة Codex الأصلية إلى
  `chatgpt.com/backend-api`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- يشترك مع `openai/*` المباشر في مفتاح `/fast` نفسه وإعداد `params.fastMode`؛ ويقوم OpenClaw بربط ذلك إلى `service_tier=priority`
- يظل `openai-codex/gpt-5.3-codex-spark` متاحًا عندما يكشف فهرس Codex OAuth عنه؛ ويعتمد ذلك على الاستحقاق
- يحتفظ `openai-codex/gpt-5.4` بالقيم الأصلية `contextWindow = 1050000` وبحد تشغيل افتراضي `contextTokens = 272000`؛ ويمكن تجاوز حد التشغيل عبر `models.providers.openai-codex.models[].contextTokens`
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

### خيارات مستضافة أخرى بنمط الاشتراك

- [Qwen Cloud](/ar/providers/qwen): سطح موفّر Qwen Cloud بالإضافة إلى ربط نقاط نهاية Alibaba DashScope وCoding Plan
- [MiniMax](/ar/providers/minimax): وصول MiniMax Coding Plan عبر OAuth أو مفتاح API
- [GLM Models](/ar/providers/glm): نقاط نهاية Z.AI Coding Plan أو API العامة

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفّر وقت تشغيل Zen: `opencode`
- موفّر وقت تشغيل Go: `opencode-go`
- أمثلة على النماذج: `opencode/claude-opus-4-6` و`opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- الموفّر: `google`
- المصادقة: `GEMINI_API_KEY`
- التدوير الاختياري: `GEMINI_API_KEYS` و`GEMINI_API_KEY_1` و`GEMINI_API_KEY_2`، وخيار `GOOGLE_API_KEY` الاحتياطي، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview`
- التوافق: يتم تطبيع إعداد OpenClaw القديم الذي يستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- تقبل عمليات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent`
  (أو `cached_content` القديم) لتمرير معرّف
  `cachedContents/...` أصلي خاص بالموفّر؛ وتظهر إصابات التخزين المؤقت في Gemini على شكل `cacheRead` في OpenClaw

### Google Vertex وGemini CLI

- الموفّرون: `google-vertex` و`google-gemini-cli`
- المصادقة: يستخدم Vertex ‏gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به
- تحذير: إن Gemini CLI OAuth في OpenClaw تكامل غير رسمي. أبلغ بعض المستخدمين عن فرض قيود على حسابات Google بعد استخدام عملاء من جهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
- يتم شحن Gemini CLI OAuth كجزء من Plugin `google` المضمّنة.
  - ثبّت Gemini CLI أولًا:
    - `brew install gemini-cli`
    - أو `npm install -g @google/gemini-cli`
  - التفعيل: `openclaw plugins enable google`
  - تسجيل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
  - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
  - ملاحظة: **لا** تقم بلصق client id أو secret داخل `openclaw.json`. يقوم تدفق تسجيل الدخول عبر CLI بتخزين
    الرموز في ملفات تعريف المصادقة على مضيف Gateway.
  - إذا فشلت الطلبات بعد تسجيل الدخول، فقم بتعيين `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  - يتم تحليل ردود Gemini CLI بصيغة JSON من `response`؛ ويعود الاستخدام احتياطيًا إلى
    `stats`، مع تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- الموفّر: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال على نموذج: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: يتم تطبيع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يقوم `zai-api-key` بالكشف التلقائي عن نقطة نهاية Z.AI المطابقة؛ بينما تفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- الموفّر: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- مثال على نموذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- الموفّر: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال على نموذج: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- يشحن فهرس احتياطي ثابت مع `kilocode/kilo/auto`؛ ويمكن لاكتشاف
  `https://api.kilo.ai/api/gateway/models` الحي توسيع فهرس وقت التشغيل
  بشكل إضافي.
- إن التوجيه العلوي الدقيق خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway،
  وليس مضمّنًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للاطّلاع على تفاصيل الإعداد.

### Plugins الموفّرين المضمّنة الأخرى

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- مثال على نموذج: `openrouter/auto`
- يطبّق OpenClaw رؤوس إسناد التطبيق الموثّقة لدى OpenRouter فقط عندما
  يستهدف الطلب فعليًا `openrouter.ai`
- كما يتم تقييد علامات `cache_control` الخاصة بـ Anthropic والمميزة لـ OpenRouter
  على مسارات OpenRouter المتحقق منها، وليس على عناوين URL الوكيلة العشوائية
- يظل OpenRouter على المسار الوكيلي المتوافق مع OpenAI، لذا لا يتم
  تمرير تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط (`serviceTier`، و`store` في Responses،
  وتلميحات التخزين المؤقت للموجّه، وحمولات توافق استدلال OpenAI)
- تحتفظ مراجع OpenRouter المعتمدة على Gemini فقط بمسار تنقية توقيع أفكار Gemini عبر الوكيل؛
  بينما يبقى التحقق الأصلي من إعادة تشغيل Gemini وإعادات الكتابة عند الإقلاع معطّلين
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- مثال على نموذج: `kilocode/kilo/auto`
- تحتفظ مراجع Kilo المعتمدة على Gemini بالمسار نفسه لتنقية
  توقيع أفكار Gemini عبر الوكيل؛ كما أن `kilocode/kilo/auto` وتلميحات
  الاستدلال الوكيلي الأخرى غير المدعومة تتخطى حقن الاستدلال الوكيلي
- MiniMax: ‏`minimax` (مفتاح API) و`minimax-portal` (OAuth)
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`
- مثال على نموذج: `minimax/MiniMax-M2.7` أو `minimax-portal/MiniMax-M2.7`
- تكتب تهيئة MiniMax/إعداد مفتاح API تعريفات صريحة لنموذج M2.7 مع
  `input: ["text", "image"]`؛ بينما يُبقي فهرس الموفّر المضمّن مراجع الدردشة
  نصية فقط حتى يتم تجسيد إعداد ذلك الموفّر
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- مثال على نموذج: `moonshot/kimi-k2.6`
- Kimi Coding: ‏`kimi` (`KIMI_API_KEY` أو `KIMICODE_API_KEY`)
- مثال على نموذج: `kimi/kimi-code`
- Qianfan: ‏`qianfan` (`QIANFAN_API_KEY`)
- مثال على نموذج: `qianfan/deepseek-v3.2`
- Qwen Cloud: ‏`qwen` (`QWEN_API_KEY` أو `MODELSTUDIO_API_KEY` أو `DASHSCOPE_API_KEY`)
- مثال على نموذج: `qwen/qwen3.5-plus`
- NVIDIA: ‏`nvidia` (`NVIDIA_API_KEY`)
- مثال على نموذج: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: ‏`stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- أمثلة على النماذج: `stepfun/step-3.5-flash` و`stepfun-plan/step-3.5-flash-2603`
- Together: ‏`together` (`TOGETHER_API_KEY`)
- مثال على نموذج: `together/moonshotai/Kimi-K2.5`
- Venice: ‏`venice` (`VENICE_API_KEY`)
- Xiaomi: ‏`xiaomi` (`XIAOMI_API_KEY`)
- مثال على نموذج: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: ‏`vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: ‏`huggingface` (`HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`)
- Cloudflare AI Gateway: ‏`cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: ‏`volcengine` (`VOLCANO_ENGINE_API_KEY`)
- مثال على نموذج: `volcengine-plan/ark-code-latest`
- BytePlus: ‏`byteplus` (`BYTEPLUS_API_KEY`)
- مثال على نموذج: `byteplus-plan/ark-code-latest`
- xAI: ‏`xai` (`XAI_API_KEY`)
  - تستخدم طلبات xAI الأصلية المضمّنة مسار xAI Responses
  - يقوم `/fast` أو `params.fastMode: true` بإعادة كتابة `grok-3` و`grok-3-mini` و
    `grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`
  - يتم تفعيل `tool_stream` افتراضيًا؛ قم بتعيين
    `agents.defaults.models["xai/<model>"].params.tool_stream` إلى `false`
    لتعطيله
- Mistral: ‏`mistral` (`MISTRAL_API_KEY`)
- مثال على نموذج: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: ‏`groq` (`GROQ_API_KEY`)
- Cerebras: ‏`cerebras` (`CEREBRAS_API_KEY`)
  - تستخدم نماذج GLM على Cerebras المعرّفات `zai-glm-4.7` و`zai-glm-4.6`.
  - Base URL المتوافق مع OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: ‏`github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- مثال نموذج Hugging Face Inference: ‏`huggingface/deepseek-ai/DeepSeek-R1`؛ CLI: ‏`openclaw onboard --auth-choice huggingface-api-key`. راجع [Hugging Face (Inference)](/ar/providers/huggingface).

## الموفّرون عبر `models.providers` ‏(مخصص/Base URL)

استخدم `models.providers` (أو `models.json`) لإضافة موفّرين **مخصصين** أو
وكلاء متوافقين مع OpenAI/Anthropic.

تنشر العديد من Plugins الموفّرين المضمّنة أدناه بالفعل فهرسًا افتراضيًا.
استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز
Base URL أو الرؤوس أو قائمة النماذج الافتراضية.

### Moonshot AI (Kimi)

يأتي Moonshot كـ Plugin موفّر مضمّنة. استخدم الموفّر المضمّن
افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما
تحتاج إلى تجاوز Base URL أو البيانات الوصفية للنموذج:

- الموفّر: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال على نموذج: `moonshot/kimi-k2.6`
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

يستخدم Kimi Coding نقطة النهاية المتوافقة مع Anthropic من Moonshot AI:

- الموفّر: `kimi`
- المصادقة: `KIMI_API_KEY`
- مثال على نموذج: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

لا يزال `kimi/k2p5` القديم مقبولًا كمعرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) وصولًا إلى Doubao ونماذج أخرى في الصين.

- الموفّر: `volcengine` (الترميز: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- مثال على نموذج: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

تُعيِّن التهيئة الافتراضية سطح الترميز، لكن فهرس `volcengine/*`
العام يُسجَّل في الوقت نفسه.

في محددات النماذج الخاصة بالتهيئة/الإعداد، يفضّل خيار مصادقة Volcengine كِلا
الصفَّين `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن هذه النماذج محمّلة بعد،
فإن OpenClaw يعود إلى الفهرس غير المصفّى بدلًا من عرض محدد
فارغ مقيّد بالموفّر.

النماذج المتاحة:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

نماذج الترميز (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (دولي)

يوفر BytePlus ARK إمكانية الوصول إلى النماذج نفسها التي يوفّرها Volcano Engine للمستخدمين الدوليين.

- الموفّر: `byteplus` (الترميز: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- مثال على نموذج: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

تُعيِّن التهيئة الافتراضية سطح الترميز، لكن فهرس `byteplus/*`
العام يُسجَّل في الوقت نفسه.

في محددات النماذج الخاصة بالتهيئة/الإعداد، يفضّل خيار مصادقة BytePlus كِلا
الصفَّين `byteplus/*` و`byteplus-plan/*`. وإذا لم تكن هذه النماذج محمّلة بعد،
فإن OpenClaw يعود إلى الفهرس غير المصفّى بدلًا من عرض محدد
فارغ مقيّد بالموفّر.

النماذج المتاحة:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

نماذج الترميز (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

توفّر Synthetic نماذج متوافقة مع Anthropic خلف الموفّر `synthetic`:

- الموفّر: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- مثال على نموذج: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

يتم إعداد MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصّصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح API لـ MiniMax (عالمي): `--auth-choice minimax-global-api`
- مفتاح API لـ MiniMax (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو
  `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للاطّلاع على تفاصيل الإعداد وخيارات النماذج ومقتطفات الإعداد.

على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير
افتراضيًا ما لم تقم بتعيينه صراحةً، كما أن `/fast on` يعيد كتابة
`MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

تقسيم القدرات المملوك لـ Plugin:

- تبقى الإعدادات الافتراضية للنص/الدردشة على `minimax/MiniMax-M2.7`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور هو `MiniMax-VL-01` مملوك لـ Plugin على كلا مساري مصادقة MiniMax
- يظل البحث على الويب على معرّف الموفّر `minimax`

### LM Studio

يأتي LM Studio كـ Plugin موفّر مضمّنة تستخدم API الأصلية:

- الموفّر: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- Base URL الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي يعيدها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw مساري LM Studio الأصليين `/api/v1/models` و`/api/v1/models/load`
للاكتشاف + التحميل التلقائي، مع استخدام `/v1/chat/completions` للاستدلال افتراضيًا.
راجع [/providers/lmstudio](/ar/providers/lmstudio) للاطّلاع على الإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama كـ Plugin موفّر مضمّنة ويستخدم API الأصلية لـ Ollama:

- الموفّر: `ollama`
- المصادقة: لا شيء مطلوب (خادم محلي)
- مثال على نموذج: `ollama/llama3.3`
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

يتم اكتشاف Ollama محليًا على `http://127.0.0.1:11434` عندما تشترك صراحةً عبر
`OLLAMA_API_KEY`، وتضيف Plugin الموفّر المضمّنة Ollama مباشرةً إلى
`openclaw onboard` ومحدد النماذج. راجع [/providers/ollama](/ar/providers/ollama)
للاطّلاع على التهيئة، ووضع السحابة/المحلي، والإعدادات المخصّصة.

### vLLM

يأتي vLLM كـ Plugin موفّر مضمّنة للخوادم المحلية/المستضافة ذاتيًا
المتوافقة مع OpenAI:

- الموفّر: `vllm`
- المصادقة: اختيارية (بحسب خادمك)
- Base URL الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang كـ Plugin موفّر مضمّنة للخوادم السريعة المستضافة ذاتيًا
المتوافقة مع OpenAI:

- الموفّر: `sglang`
- المصادقة: اختيارية (بحسب خادمك)
- Base URL الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا
يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### الوكلاء المحليون (LM Studio وvLLM وLiteLLM وما إلى ذلك)

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

- بالنسبة إلى الموفّرين المخصّصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية.
  وعند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- الموصى به: تعيين قيم صريحة تطابق حدود الوكيل/النموذج لديك.
- بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من الموفّر بسبب أدوار `developer` غير المدعومة.
- تتخطى أيضًا المسارات الوكيلة المتوافقة مع OpenAI تشكيل الطلبات الأصلية الخاصة بـ OpenAI فقط:
  لا يوجد `service_tier`، ولا `store` في Responses، ولا تلميحات للتخزين المؤقت للموجّه، ولا
  تشكيل لحمولات توافق استدلال OpenAI، ولا رؤوس إسناد OpenClaw المخفية.
- إذا كان `baseUrl` فارغًا/محذوفًا، فسيحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
- لأسباب تتعلق بالسلامة، يظل `compat.supportsDeveloperRole: true` الصريح مُتجاوزًا على نقاط النهاية غير الأصلية `openai-completions`.

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [/gateway/configuration](/ar/gateway/configuration) للحصول على أمثلة إعداد كاملة.

## ذو صلة

- [Models](/ar/concepts/models) — إعدادات النماذج والأسماء المستعارة
- [Model Failover](/ar/concepts/model-failover) — سلاسل التراجع وسلوك إعادة المحاولة
- [Configuration Reference](/ar/gateway/configuration-reference#agent-defaults) — مفاتيح إعدادات النماذج
- [Providers](/ar/providers) — أدلة الإعداد لكل موفّر
