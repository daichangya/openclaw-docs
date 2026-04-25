---
read_when:
    - تنفيذ خطافات وقت تشغيل المزوّد، أو دورة حياة القناة، أو حزم packages
    - تصحيح ترتيب تحميل Plugin أو حالة السجل
    - إضافة إمكانية Plugin جديدة أو Plugin لمحرك السياق
summary: 'البنية الداخلية لـ Plugin: مسار التحميل، والسجل، وخطافات وقت التشغيل، ومسارات HTTP، والجداول المرجعية'
title: البنية الداخلية لـ Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

بالنسبة إلى نموذج الإمكانيات العام، وأشكال Plugins، وعقود الملكية/التنفيذ،
راجع [بنية Plugin](/ar/plugins/architecture). هذه الصفحة هي
المرجع للآليات الداخلية: مسار التحميل، والسجل، وخطافات وقت التشغيل،
ومسارات Gateway HTTP، ومسارات الاستيراد، وجداول المخططات.

## مسار التحميل

عند بدء التشغيل، ينفذ OpenClaw تقريبًا ما يلي:

1. اكتشاف جذور Plugin المرشحة
2. قراءة manifests للحزم الأصلية أو الحزم المتوافقة وبيانات package الوصفية
3. رفض المرشحين غير الآمنين
4. توحيد إعدادات Plugin (`plugins.enabled` و`allow` و`deny` و`entries`،
   و`slots` و`load.paths`)
5. تقرير التمكين لكل مرشح
6. تحميل الوحدات الأصلية المفعّلة: تستخدم الوحدات المجمّعة المبنية أداة تحميل أصلية؛
   وتستخدم Plugins الأصلية غير المبنية jiti
7. استدعاء خطافات `register(api)` الأصلية وتجميع التسجيلات في سجل Plugins
8. كشف السجل لأسطح الأوامر/وقت التشغيل

<Note>
`activate` هو اسم بديل قديم لـ `register` — وتقوم أداة التحميل بتحليل أيهما موجود (`def.register ?? def.activate`) وتستدعيه في النقطة نفسها. تستخدم جميع Plugins المجمّعة `register`؛ ويفضّل استخدام `register` في Plugins الجديدة.
</Note>

تحدث بوابات الأمان **قبل** تنفيذ وقت التشغيل. ويتم حظر المرشحين
عندما يهرب الإدخال من جذر Plugin، أو يكون المسار قابلاً للكتابة عالميًا، أو
تبدو ملكية المسار مشبوهة بالنسبة إلى Plugins غير المجمّعة.

### السلوك القائم على manifest أولًا

يُعد manifest هو مصدر الحقيقة في مستوى التحكم. ويستخدمه OpenClaw من أجل:

- تحديد Plugin
- اكتشاف القنوات/Skills/مخططات الإعدادات أو إمكانيات الحزمة المعلنة
- التحقق من `plugins.entries.<id>.config`
- تحسين تسميات/عناصر نائبة في Control UI
- عرض بيانات التعريف الخاصة بالتثبيت/الكتالوج
- الحفاظ على واصفات تنشيط وإعداد خفيفة من دون تحميل وقت تشغيل Plugin

بالنسبة إلى Plugins الأصلية، تكون وحدة وقت التشغيل هي جزء مستوى البيانات. فهي تسجل
السلوك الفعلي مثل الخطافات، أو الأدوات، أو الأوامر، أو تدفقات المزوّد.

تبقى كتل manifest الاختيارية `activation` و`setup` ضمن مستوى التحكم.
وهي واصفات بيانات تعريف فقط لتخطيط التنشيط واكتشاف الإعداد؛
ولا تستبدل التسجيل في وقت التشغيل، أو `register(...)`، أو `setupEntry`.
ويستخدم أول المستهلكين لتفعيل التنشيط الحي الآن تلميحات manifest الخاصة بالأوامر والقنوات والمزوّدين
لتضييق تحميل Plugins قبل توسيع السجل على نطاق أوسع:

- يضيّق تحميل CLI إلى Plugins التي تملك الأمر الأساسي المطلوب
- يضيّق إعداد القناة/تحليل Plugin إلى Plugins التي تملك
  معرّف القناة المطلوب
- يضيّق إعداد/تحليل وقت التشغيل للمزوّد الصريح إلى Plugins التي تملك
  معرّف المزوّد المطلوب

يكشف مخطط التنشيط كلاً من API خاص بالمعرّفات فقط للمستدعين الحاليين وAPI
للمخطط للتشخيصات الجديدة. وتبلغ إدخالات المخطط عن سبب اختيار Plugin،
مفصّلةً بين تلميحات مخطط `activation.*` الصريحة وعمليات الرجوع الخاصة بملكية manifest
مثل `providers` و`channels` و`commandAliases` و`setup.providers`،
و`contracts.tools` والخطافات. ويُعد هذا الفصل في السبب هو حد التوافق:
إذ تستمر بيانات التعريف الحالية لـ Plugin في العمل، بينما يمكن للشفرة الجديدة اكتشاف التلميحات الواسعة
أو سلوك الرجوع من دون تغيير دلالات تحميل وقت التشغيل.

يفضّل اكتشاف الإعداد الآن المعرّفات المملوكة للواصفات مثل `setup.providers` و
`setup.cliBackends` لتضييق Plugins المرشحة قبل أن يرجع إلى
`setup-api` للPlugins التي لا تزال تحتاج إلى خطافات وقت تشغيل في وقت الإعداد. يستخدم تدفق
إعداد المزوّد manifest `providerAuthChoices` أولًا، ثم يرجع إلى
خيارات wizard في وقت التشغيل وخيارات كتالوج التثبيت للتوافق. ويُعد
`setup.requiresRuntime: false` الصريح نقطة قطع على مستوى الواصف فقط؛ أما حذف
`requiresRuntime` فيُبقي رجوع `setup-api` القديم للتوافق. إذا ادّعت
أكثر من Plugin مكتشفة واحدة ملكية معرّف مزوّد إعداد أو
واجهة خلفية CLI موحّد، فإن البحث عن الإعداد يرفض الملكية الملتبسة بدلًا من الاعتماد على
ترتيب الاكتشاف. وعندما يُنفَّذ وقت تشغيل الإعداد، تبلغ تشخيصات السجل عن
الانجراف بين `setup.providers` / `setup.cliBackends` وبين المزوّدين أو واجهات CLI
الخلفية المسجلة بواسطة `setup-api` من دون حظر Plugins القديمة.

### ما الذي تخزنه أداة التحميل مؤقتًا

يحتفظ OpenClaw بذاكرات تخزين مؤقت قصيرة داخل العملية من أجل:

- نتائج الاكتشاف
- بيانات سجل manifest
- سجلات Plugins المحمّلة

تقلل هذه الذاكرات المؤقتة من ارتفاعات بدء التشغيل والنفقات المتكررة للأوامر. ويمكنك
اعتبارها ذاكرات مؤقتة قصيرة العمر للأداء، وليست تخزينًا دائمًا.

ملاحظة أداء:

- اضبط `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` أو
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` لتعطيل هذه الذاكرات المؤقتة.
- اضبط نوافذ الذاكرة المؤقتة باستخدام `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` و
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## نموذج السجل

لا تقوم Plugins المحمّلة بتعديل متغيرات Core عشوائية مباشرة. بل تسجل نفسها في
سجل Plugins مركزي.

يتتبع السجل ما يلي:

- سجلات Plugins (الهوية، والمصدر، والأصل، والحالة، والتشخيصات)
- الأدوات
- الخطافات القديمة والخطافات المtyped
- القنوات
- المزوّدون
- معالجات Gateway RPC
- مسارات HTTP
- مسجلات CLI
- الخدمات الخلفية
- الأوامر المملوكة لـ Plugin

ثم تقرأ ميزات Core من ذلك السجل بدلًا من التحدث إلى وحدات Plugin
مباشرة. وهذا يبقي التحميل في اتجاه واحد:

- وحدة Plugin -> التسجيل في السجل
- وقت تشغيل Core -> استهلاك السجل

هذا الفصل مهم لقابلية الصيانة. إذ يعني أن معظم أسطح Core لا تحتاج إلا إلى
نقطة تكامل واحدة: "اقرأ السجل"، وليس "ضع حالة خاصة لكل وحدة Plugin".

## استدعاءات الربط الخاصة بالمحادثة

يمكن للPlugins التي تربط محادثة أن تتفاعل عند حل موافقة.

استخدم `api.onConversationBindingResolved(...)` لتلقي استدعاء بعد الموافقة على
طلب الربط أو رفضه:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

حقول حمولة الاستدعاء:

- `status`: `"approved"` أو `"denied"`
- `decision`: `"allow-once"` أو `"allow-always"` أو `"deny"`
- `binding`: الربط المحلول للطلبات الموافق عليها
- `request`: ملخص الطلب الأصلي، وتلميح الفصل، ومعرّف المرسل، وبيانات
  تعريف المحادثة

هذا الاستدعاء مخصص للإشعارات فقط. ولا يغيّر من يُسمح له بربط
محادثة، ويعمل بعد انتهاء المعالجة الأساسية للموافقة.

## خطافات وقت تشغيل المزوّد

تحتوي Plugins الخاصة بالمزوّد على ثلاث طبقات:

- **بيانات تعريف manifest** للبحث الخفيف قبل وقت التشغيل:
  `setup.providers[].envVars`، والتوافق القديم المهمل `providerAuthEnvVars`،
  و`providerAuthAliases`، و`providerAuthChoices`، و`channelEnvVars`.
- **خطافات وقت الإعداد**: `catalog` (القديم `discovery`) بالإضافة إلى
  `applyConfigDefaults`.
- **خطافات وقت التشغيل**: أكثر من 40 خطافًا اختياريًا تغطي المصادقة، وتحليل
  النموذج، وتغليف البث، ومستويات التفكير، وسياسة الإعادة، ونقاط نهاية الاستخدام. راجع
  القائمة الكاملة تحت [ترتيب الخطافات والاستخدام](#hook-order-and-usage).

لا يزال OpenClaw يمتلك حلقة الوكيل العامة، والرجوع، ومعالجة النصوص، وسياسة
الأدوات. وهذه الخطافات هي سطح الامتداد الخاص بالسلوك المرتبط بالمزوّد من دون
الحاجة إلى نقل استدلال مخصص كامل.

استخدم manifest `setup.providers[].envVars` عندما يكون لدى المزوّد بيانات اعتماد
معتمدة على env وينبغي أن تراها مسارات المصادقة/الحالة/منتقي النماذج العامة من دون
تحميل وقت تشغيل Plugin. لا يزال `providerAuthEnvVars` المهمل يُقرأ بواسطة
مهايئ التوافق أثناء نافذة الإهمال، وتتلقى Plugins غير المجمّعة التي تستخدمه
تشخيصًا في manifest. استخدم manifest `providerAuthAliases`
عندما ينبغي لمعرّف مزوّد أن يعيد استخدام متغيرات env الخاصة بمزوّد آخر، وملفات تعريف المصادقة،
والمصادقة المدعومة بالإعدادات، وخيار الإعداد الأولي لمفتاح API. استخدم manifest
`providerAuthChoices` عندما ينبغي أن تعرف أسطح onboarding/auth-choice في CLI
معرّف اختيار المزوّد، وتسميات المجموعات، وأسلاك المصادقة البسيطة ذات العلامة الواحدة من دون
تحميل وقت تشغيل المزوّد. واحتفظ في وقت تشغيل المزوّد بـ
`envVars` للتلميحات الموجهة للمشغّل مثل تسميات onboarding أو
متغيرات إعداد client-id/client-secret الخاصة بـ OAuth.

استخدم manifest `channelEnvVars` عندما تكون لدى القناة مصادقة أو إعداد
معتمد على env وينبغي أن تراه عمليات الرجوع العامة الخاصة بـ shell-env، أو فحوصات الإعدادات/الحالة، أو مطالبات الإعداد من دون تحميل وقت تشغيل القناة.

### ترتيب الخطافات والاستخدام

بالنسبة إلى Plugins النماذج/المزوّدين، يستدعي OpenClaw الخطافات بهذا الترتيب التقريبي.
ويُعد عمود "متى يُستخدم" هو دليل القرار السريع.

| #   | الخطاف                              | ما الذي يفعله                                                                                                   | متى يُستخدم                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | نشر إعدادات المزوّد داخل `models.providers` أثناء إنشاء `models.json`                                | عندما يمتلك المزوّد كتالوجًا أو قيم `base URL` افتراضية                                                                                                  |
| 2   | `applyConfigDefaults`             | تطبيق القيم الافتراضية العامة المملوكة للمزوّد أثناء تجسيد الإعدادات                                      | عندما تعتمد القيم الافتراضية على وضع المصادقة، أو env، أو دلالات عائلة نموذج المزوّد                                                                         |
| --  | _(البحث المدمج عن النموذج)_         | يحاول OpenClaw أولًا مسار السجل/الكتالوج العادي                                                          | _(ليس خطاف Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | توحيد الأسماء المستعارة القديمة أو الخاصة بالمعاينة لمعرّف النموذج قبل البحث                                                     | عندما يمتلك المزوّد تنظيف الأسماء المستعارة قبل تحليل النموذج القياسي                                                                                 |
| 4   | `normalizeTransport`              | توحيد `api` / `baseUrl` الخاصة بعائلة المزوّد قبل التجميع العام للنموذج                                      | عندما يمتلك المزوّد تنظيف النقل لمعرّفات مزوّد مخصصة ضمن عائلة النقل نفسها                                                          |
| 5   | `normalizeConfig`                 | توحيد `models.providers.<id>` قبل تحليل وقت التشغيل/المزوّد                                           | عندما يحتاج المزوّد إلى تنظيف إعدادات ينبغي أن يبقى مع Plugin؛ كما أن مساعدات عائلة Google المجمّعة تسند أيضًا إدخالات إعدادات Google المدعومة   |
| 6   | `applyNativeStreamingUsageCompat` | تطبيق إعادات كتابة توافق الاستخدام في البث الأصلي على مزوّدي الإعدادات                                               | عندما يحتاج المزوّد إلى إصلاحات بيانات وصفية للاستخدام الأصلي في البث تعتمد على نقطة النهاية                                                                          |
| 7   | `resolveConfigApiKey`             | تحليل مصادقة علامة env لمزوّدي الإعدادات قبل تحميل مصادقة وقت التشغيل                                       | عندما يملك المزوّد تحليلًا لمفتاح API بعلامة env مملوكًا للمزوّد؛ كما يملك `amazon-bedrock` أيضًا محللًا مدمجًا لعلامات AWS env هنا                  |
| 8   | `resolveSyntheticAuth`            | إظهار مصادقة محلية/مستضافة ذاتيًا أو مدعومة بالإعدادات من دون حفظ نص صريح                                   | عندما يستطيع المزوّد العمل مع علامة بيانات اعتماد تركيبية/محلية                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | تراكب ملفات تعريف المصادقة الخارجية المملوكة للمزوّد؛ والقيمة الافتراضية لـ `persistence` هي `runtime-only` لبيانات اعتماد CLI/التطبيق المملوكة | عندما يعيد المزوّد استخدام بيانات اعتماد مصادقة خارجية من دون حفظ رموز تحديث منسوخة؛ صرّح عن `contracts.externalAuthProviders` في manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | خفض أولوية العناصر النائبة لملفات التعريف التركيبية المخزنة خلف المصادقة المدعومة بـ env/الإعدادات                                      | عندما يخزن المزوّد ملفات تعريف تركيبية نائبة لا ينبغي أن تفوز بالأولوية                                                                 |
| 11  | `resolveDynamicModel`             | رجوع متزامن لمعرّفات نماذج مملوكة للمزوّد ليست موجودة بعد في السجل المحلي                                       | عندما يقبل المزوّد معرّفات نماذج علوية اعتباطية                                                                                                 |
| 12  | `prepareDynamicModel`             | تهيئة غير متزامنة، ثم يُشغَّل `resolveDynamicModel` مرة أخرى                                                           | عندما يحتاج المزوّد إلى بيانات وصفية شبكية قبل تحليل المعرّفات غير المعروفة                                                                                  |
| 13  | `normalizeResolvedModel`          | إعادة كتابة نهائية قبل أن يستخدم المشغّل المضمّن النموذج المحلول                                               | عندما يحتاج المزوّد إلى إعادات كتابة للنقل لكنه لا يزال يستخدم نقلًا أساسيًا                                                                             |
| 14  | `contributeResolvedModelCompat`   | المساهمة بأعلام التوافق لنماذج المزوّد خلف نقل متوافق آخر                                  | عندما يتعرف المزوّد على نماذجه الخاصة على عمليات نقل وسيطة من دون الاستحواذ على المزوّد                                                       |
| 15  | `capabilities`                    | بيانات وصفية للنصوص/الأدوات مملوكة للمزوّد وتستخدمها منطقية Core المشتركة                                           | عندما يحتاج المزوّد إلى سلوكيات خاصة بالنصوص/عائلة المزوّد                                                                                              |
| 16  | `normalizeToolSchemas`            | توحيد مخططات الأدوات قبل أن يراها المشغّل المضمّن                                                    | عندما يحتاج المزوّد إلى تنظيف مخططات مرتبط بعائلة النقل                                                                                                |
| 17  | `inspectToolSchemas`              | إظهار تشخيصات مخططات مملوكة للمزوّد بعد التوحيد                                                  | عندما يريد المزوّد تحذيرات بالكلمات المفتاحية من دون تعليم Core قواعد خاصة بالمزوّد                                                                 |
| 18  | `resolveReasoningOutputMode`      | اختيار عقد خرج التفكير الأصلي مقابل العقد المعلّم                                                              | عندما يحتاج المزوّد إلى خرج تفكير/نهائي معلّم بدلًا من الحقول الأصلية                                                                         |
| 19  | `prepareExtraParams`              | توحيد معلمات الطلب قبل مغلفات خيارات البث العامة                                              | عندما يحتاج المزوّد إلى معلمات طلب افتراضية أو تنظيف معلمات لكل مزوّد                                                                           |
| 20  | `createStreamFn`                  | استبدال مسار البث العادي بالكامل بنقل مخصص                                                   | عندما يحتاج المزوّد إلى بروتوكول wire مخصص، وليس مجرد مغلف                                                                                     |
| 21  | `wrapStreamFn`                    | مغلف بث بعد تطبيق المغلفات العامة                                                              | عندما يحتاج المزوّد إلى مغلفات توافق للطلب/الترويسات/النص/النموذج من دون نقل مخصص                                                          |
| 22  | `resolveTransportTurnState`       | إرفاق ترويسات أو بيانات وصفية أصلية لكل دور                                                           | عندما يريد المزوّد من عمليات النقل العامة إرسال هوية دور أصلية خاصة بالمزوّد                                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | إرفاق ترويسات WebSocket أصلية أو سياسة تهدئة للجلسة                                                    | عندما يريد المزوّد من عمليات نقل WS العامة ضبط ترويسات الجلسة أو سياسة الرجوع                                                               |
| 24  | `formatApiKey`                    | مُنسّق ملف تعريف المصادقة: يتحول الملف المخزّن إلى سلسلة `apiKey` في وقت التشغيل                                     | عندما يخزن المزوّد بيانات تعريف مصادقة إضافية ويحتاج إلى شكل رمز وقت تشغيل مخصص                                                                    |
| 25  | `refreshOAuth`                    | تجاوز تحديث OAuth لنقاط نهاية تحديث مخصصة أو سياسة فشل التحديث                                  | عندما لا يلائم المزوّد أدوات التحديث المشتركة `pi-ai`                                                                                           |
| 26  | `buildAuthDoctorHint`             | تلميح إصلاح يُضاف عند فشل تحديث OAuth                                                                  | عندما يحتاج المزوّد إلى إرشادات إصلاح مصادقة مملوكة للمزوّد بعد فشل التحديث                                                                      |
| 27  | `matchesContextOverflowError`     | مطابِق تجاوز نافذة السياق المملوك للمزوّد                                                                 | عندما تكون لدى المزوّد أخطاء تجاوز خام لا تلتقطها الاستدلالات العامة                                                                                |
| 28  | `classifyFailoverReason`          | تصنيف سبب الرجوع المملوك للمزوّد                                                                  | عندما يستطيع المزوّد ربط أخطاء API/النقل الخام بأسباب مثل حد المعدل/التحميل الزائد/إلخ                                                                          |
| 29  | `isCacheTtlEligible`              | سياسة Prompt cache للمزوّدين الوكلاء/الترحيل الخلفي                                                               | عندما يحتاج المزوّد إلى تقييد TTL خاص بالوكيل                                                                                                |
| 30  | `buildMissingAuthMessage`         | بديل لرسالة استرداد المصادقة المفقودة العامة                                                      | عندما يحتاج المزوّد إلى تلميح استرداد خاص بالمزوّد عند غياب المصادقة                                                                                 |
| 31  | `suppressBuiltInModel`            | إخفاء النماذج العلوية القديمة مع تلميح خطأ اختياري موجّه للمستخدم                                          | عندما يحتاج المزوّد إلى إخفاء صفوف علوية قديمة أو استبدالها بتلميح خاص بالمورّد                                                                 |
| 32  | `augmentModelCatalog`             | صفوف كتالوج تركيبية/نهائية تُلحق بعد الاكتشاف                                                          | عندما يحتاج المزوّد إلى صفوف توافق أمامي تركيبية في `models list` وأدوات الاختيار                                                                     |
| 33  | `resolveThinkingProfile`          | مجموعة مستويات `/think` الخاصة بالنموذج، وتسميات العرض، والقيمة الافتراضية                                                 | عندما يوفّر المزوّد سُلّم تفكير مخصصًا أو تسمية ثنائية للنماذج المحددة                                                                 |
| 34  | `isBinaryThinking`                | خطاف توافق لتبديل التفكير تشغيل/إيقاف                                                                     | عندما يوفّر المزوّد تفكيرًا ثنائيًا تشغيل/إيقاف فقط                                                                                                  |
| 35  | `supportsXHighThinking`           | خطاف توافق لدعم التفكير `xhigh`                                                                   | عندما يريد المزوّد تفعيل `xhigh` فقط لمجموعة فرعية من النماذج                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | خطاف توافق لمستوى `/think` الافتراضي                                                                      | عندما يمتلك المزوّد سياسة `/think` افتراضية لعائلة نماذج                                                                                      |
| 37  | `isModernModelRef`                | مطابِق النموذج الحديث لمرشحات الملفات الحية واختيار smoke                                              | عندما يمتلك المزوّد مطابقة النموذج المفضّل للاختبارات الحية/الدخانية                                                                                             |
| 38  | `prepareRuntimeAuth`              | استبدال بيانات اعتماد مُعدّة بالرمز/المفتاح الفعلي لوقت التشغيل قبل الاستدلال مباشرة                       | عندما يحتاج المزوّد إلى تبادل رمز أو بيانات اعتماد طلب قصيرة العمر                                                                             |
| 39  | `resolveUsageAuth`                | تحليل بيانات اعتماد الاستخدام/الفوترة لـ `/usage` والأسطح ذات الصلة بالحالة                                     | عندما يحتاج المزوّد إلى تحليل مخصص لرمز الاستخدام/الحصة أو إلى بيانات اعتماد استخدام مختلفة                                                               |
| 40  | `fetchUsageSnapshot`              | جلب وتوحيد لقطات الاستخدام/الحصة الخاصة بالمزوّد بعد تحليل المصادقة                             | عندما يحتاج المزوّد إلى نقطة نهاية استخدام خاصة به أو محلل حمولة خاصة به                                                                           |
| 41  | `createEmbeddingProvider`         | بناء مهايئ تضمين مملوك للمزوّد من أجل الذاكرة/البحث                                                     | عندما ينتمي سلوك تضمين الذاكرة إلى Plugin الخاص بالمزوّد                                                                                    |
| 42  | `buildReplayPolicy`               | إرجاع سياسة إعادة تشغيل تتحكم في معالجة النصوص الخاصة بالمزوّد                                        | عندما يحتاج المزوّد إلى سياسة نصوص مخصصة (على سبيل المثال، إزالة كتل التفكير)                                                               |
| 43  | `sanitizeReplayHistory`           | إعادة كتابة سجل الإعادة بعد تنظيف النصوص العام                                                        | عندما يحتاج المزوّد إلى إعادات كتابة خاصة به تتجاوز مساعدات Compaction المشتركة                                                             |
| 44  | `validateReplayTurns`             | التحقق النهائي من أدوار الإعادة أو إعادة تشكيلها قبل المشغّل المضمّن                                           | عندما يحتاج نقل المزوّد إلى تحقق أكثر صرامة للأدوار بعد التنقية العامة                                                                    |
| 45  | `onModelSelected`                 | تشغيل تأثيرات جانبية بعد الاختيار يملكها المزوّد                                                                 | عندما يحتاج المزوّد إلى telemetry أو حالة مملوكة له عند تنشيط نموذج ما                                                                  |

يتحقق `normalizeModelId` و`normalizeTransport` و`normalizeConfig` أولًا من
Plugin المزوّد المطابق، ثم ينتقل إلى Plugins المزوّد الأخرى القادرة على الخطافات
حتى يقوم أحدها فعليًا بتغيير
معرّف النموذج أو النقل/الإعدادات. وهذا يحافظ على عمل واجهات المزودات الوسيطة الخاصة بالأسماء المستعارة/التوافق
من دون أن يضطر المستدعي إلى معرفة أي Plugin مضمّنة تملك إعادة الكتابة. وإذا لم يقم أي
خطاف مزوّد بإعادة كتابة إدخال إعدادات مدعوم من عائلة Google،
فإن موحّد إعدادات Google المضمّن يطبق ذلك التنظيف التوافقي أيضًا.

إذا كان المزوّد يحتاج إلى بروتوكول wire مخصص بالكامل أو منفّذ طلبات مخصص،
فهذه فئة مختلفة من الامتداد. وهذه الخطافات مخصصة لسلوك المزوّد
الذي لا يزال يعمل على حلقة الاستدلال العادية الخاصة بـ OpenClaw.

### مثال على مزوّد

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### أمثلة مدمجة

تجمع Plugins المزوّد المجمّعة بين الخطافات المذكورة أعلاه لتناسب احتياجات كل مورّد
في الكتالوج، والمصادقة، والتفكير، والإعادة، والاستخدام. وتوجد مجموعة الخطافات المعتمدة
مع كل Plugin تحت `extensions/`; وتوضّح هذه الصفحة الأشكال بدلًا من
عكس القائمة.

<AccordionGroup>
  <Accordion title="مزوّدو كتالوج المرور المباشر">
    يسجل OpenRouter وKilocode وZ.AI وxAI كلًا من `catalog` و
    `resolveDynamicModel` / `prepareDynamicModel` حتى يمكنهم إظهار معرّفات
    النماذج العلوية قبل الكتالوج الثابت لـ OpenClaw.
  </Accordion>
  <Accordion title="مزوّدو OAuth ونقاط نهاية الاستخدام">
    يقترن GitHub Copilot وGemini CLI وChatGPT Codex وMiniMax وXiaomi وz.ai
    بين `prepareRuntimeAuth` أو `formatApiKey` وبين `resolveUsageAuth` +
    `fetchUsageSnapshot` لامتلاك تبادل الرموز وتكامل `/usage`.
  </Accordion>
  <Accordion title="عائلات الإعادة وتنظيف النصوص">
    تسمح العائلات المسماة المشتركة (`google-gemini` و`passthrough-gemini` و
    `anthropic-by-model` و`hybrid-anthropic-openai`) للمزوّدين بالاشتراك في
    سياسة النصوص عبر `buildReplayPolicy` بدلًا من أن يعيد كل Plugin
    تنفيذ التنظيف.
  </Accordion>
  <Accordion title="مزوّدو الكتالوج فقط">
    تسجل `byteplus` و`cloudflare-ai-gateway` و`huggingface` و`kimi-coding` و`nvidia`،
    و`qianfan` و`synthetic` و`together` و`venice` و`vercel-ai-gateway`، و
    `volcengine` القيمة `catalog` فقط وتعتمد على حلقة الاستدلال المشتركة.
  </Accordion>
  <Accordion title="مساعدات البث الخاصة بـ Anthropic">
    تعيش ترويسات Beta، و`/fast` / `serviceTier`، و`context1m` داخل
    seam العام `api.ts` / `contract-api.ts` الخاص بـ Plugin Anthropic
    (`wrapAnthropicProviderStream` و`resolveAnthropicBetas`،
    و`resolveAnthropicFastMode` و`resolveAnthropicServiceTier`) بدلًا من
    SDK العامة.
  </Accordion>
</AccordionGroup>

## مساعدات وقت التشغيل

يمكن للPlugins الوصول إلى مجموعة مختارة من مساعدات Core عبر `api.runtime`. بالنسبة إلى TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

ملاحظات:

- يعيد `textToSpeech` حمولة خرج TTS الأساسية العادية لأسطح الملفات/الملاحظات الصوتية.
- يستخدم إعدادات Core `messages.tts` واختيار المزوّد.
- يعيد مخزن PCM الصوتي المؤقت + معدل العينة. ويجب على Plugins إعادة أخذ العينات/الترميز للمزوّدين.
- تكون `listVoices` اختيارية لكل مزوّد. استخدمها لمنتقيات الأصوات أو تدفقات الإعداد المملوكة للمورّد.
- يمكن أن تتضمن قوائم الأصوات بيانات وصفية أغنى مثل اللغة والمنطقة، والجنس، وعلامات الشخصية للمنتقيات المدركة للمزوّد.
- يدعم OpenAI وElevenLabs خدمات الهاتف اليوم. أما Microsoft فلا يدعمها.

يمكن للPlugins أيضًا تسجيل مزوّدي الكلام عبر `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

ملاحظات:

- أبقِ سياسة TTS، والرجوع، وتسليم الردود في Core.
- استخدم مزوّدي الكلام لسلوك التوليف المملوك للمورّد.
- يتم توحيد الإدخال القديم `edge` الخاص بـ Microsoft إلى معرّف المزوّد `microsoft`.
- نموذج الملكية المفضّل موجّه إلى الشركة: يمكن لـ Plugin مورّد واحدة أن تمتلك
  مزوّدي النصوص، والكلام، والصور، والوسائط المستقبلية مع إضافة OpenClaw
  لعقود الإمكانيات تلك.

بالنسبة إلى فهم الصور/الصوت/الفيديو، تسجل Plugins مزوّدًا typed واحدًا
لفهم الوسائط بدلًا من كيس مفاتيح/قيم عام:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

ملاحظات:

- أبقِ التنسيق، والرجوع، والإعدادات، ووصلات القنوات في Core.
- أبقِ سلوك المورّد في Plugin المزوّد.
- يجب أن يبقى التوسع الإضافي typed: أساليب اختيارية جديدة، وحقول نتائج اختيارية جديدة، وإمكانات اختيارية جديدة.
- يتبع توليد الفيديو النمط نفسه بالفعل:
  - يمتلك Core عقد الإمكانية ومساعد وقت التشغيل
  - تسجل Plugins المورّد `api.registerVideoGenerationProvider(...)`
  - تستهلك Plugins الميزات/القنوات `api.runtime.videoGeneration.*`

بالنسبة إلى مساعدات وقت التشغيل لفهم الوسائط، يمكن للPlugins استدعاء:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

وبالنسبة إلى نسخ الصوت، يمكن للPlugins استخدام وقت تشغيل فهم الوسائط
أو الاسم البديل الأقدم STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // اختياري عندما لا يمكن استنتاج MIME بشكل موثوق:
  mime: "audio/ogg",
});
```

ملاحظات:

- يُعد `api.runtime.mediaUnderstanding.*` الواجهة المشتركة المفضلة لـ
  فهم الصور/الصوت/الفيديو.
- يستخدم إعدادات الصوت الأساسية لفهم الوسائط (`tools.media.audio`) وترتيب الرجوع بين المزوّدين.
- يعيد `{ text: undefined }` عندما لا يتم إنتاج خرج نسخ (مثلًا عند التخطي/عدم دعم الإدخال).
- يبقى `api.runtime.stt.transcribeAudioFile(...)` اسمًا بديلًا للتوافق.

يمكن للPlugins أيضًا إطلاق تشغيلات وكلاء فرعيين في الخلفية عبر `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

ملاحظات:

- يكون `provider` و`model` تجاوزين اختياريين لكل تشغيل، وليس تغييرات مستمرة على الجلسة.
- لا يحترم OpenClaw حقول التجاوز هذه إلا للمستدعين الموثوقين.
- بالنسبة إلى تشغيلات الرجوع المملوكة لـ Plugin، يجب على المشغّلين الاشتراك صراحةً عبر `plugins.entries.<id>.subagent.allowModelOverride: true`.
- استخدم `plugins.entries.<id>.subagent.allowedModels` لتقييد Plugins الموثوقة على أهداف canonical محددة من `provider/model`، أو `"*"` للسماح صراحةً بأي هدف.
- لا تزال تشغيلات الوكيل الفرعي الخاصة بـ Plugin غير الموثوقة تعمل، لكن طلبات التجاوز تُرفض بدلًا من الرجوع بصمت.

بالنسبة إلى البحث على الويب، يمكن للPlugins استهلاك مساعد وقت التشغيل المشترك بدلًا من
الوصول إلى أسلاك أداة الوكيل:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

يمكن للPlugins أيضًا تسجيل مزوّدي البحث على الويب عبر
`api.registerWebSearchProvider(...)`.

ملاحظات:

- أبقِ اختيار المزوّد، وتحليل بيانات الاعتماد، ودلالات الطلب المشتركة في Core.
- استخدم مزوّدي البحث على الويب لعمليات النقل الخاصة بالبحث المملوك للمورّد.
- يُعد `api.runtime.webSearch.*` الواجهة المشتركة المفضلة لـ Plugins الميزات/القنوات التي تحتاج إلى سلوك بحث من دون الاعتماد على مغلف أداة الوكيل.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: إنشاء صورة باستخدام سلسلة مزوّد إنشاء الصور المُعدّة.
- `listProviders(...)`: إدراج مزوّدي إنشاء الصور المتاحين وإمكاناتهم.

## مسارات Gateway HTTP

يمكن للPlugins كشف نقاط نهاية HTTP عبر `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

حقول المسار:

- `path`: مسار route تحت خادم HTTP الخاص بـ gateway.
- `auth`: مطلوب. استخدم `"gateway"` لطلب مصادقة gateway العادية، أو `"plugin"` للمصادقة/التحقق من Webhook المُدار من قبل Plugin.
- `match`: اختياري. `"exact"` (افتراضي) أو `"prefix"`.
- `replaceExisting`: اختياري. يسمح للPlugin نفسها باستبدال تسجيل المسار الموجود الخاص بها.
- `handler`: أعد `true` عندما يكون المسار قد عالج الطلب.

ملاحظات:

- تمت إزالة `api.registerHttpHandler(...)` وستتسبب في خطأ تحميل Plugin. استخدم `api.registerHttpRoute(...)` بدلًا منها.
- يجب أن تصرّح مسارات Plugins عن `auth` صراحةً.
- يتم رفض تعارضات `path + match` التامة ما لم تكن `replaceExisting: true`، ولا يمكن لـ Plugin واحدة استبدال مسار Plugin أخرى.
- يتم رفض المسارات المتداخلة ذات مستويات `auth` المختلفة. أبقِ سلاسل السقوط `exact`/`prefix` على مستوى المصادقة نفسه فقط.
- لا تتلقى مسارات `auth: "plugin"` نطاقات وقت تشغيل المشغّل تلقائيًا. فهي مخصصة لـ Webhooks/التحقق من التوقيع المُدار من قبل Plugin، وليست لاستدعاءات مساعد Gateway ذات الامتيازات.
- تعمل مسارات `auth: "gateway"` داخل نطاق وقت تشغيل طلب Gateway، لكن هذا النطاق متحفّظ عمدًا:
  - تبقي مصادقة bearer ذات السر المشترك (`gateway.auth.mode = "token"` / `"password"`) نطاقات وقت تشغيل مسار Plugin مثبتة على `operator.write`، حتى إذا أرسل المستدعي `x-openclaw-scopes`
  - تحترم أوضاع HTTP الموثوقة الحاملة للهوية (مثل `trusted-proxy` أو `gateway.auth.mode = "none"` على إدخال خاص) `x-openclaw-scopes` فقط عندما تكون الترويسة موجودة صراحةً
  - إذا كانت `x-openclaw-scopes` غائبة عن طلبات مسار Plugin الحاملة للهوية تلك، فإن نطاق وقت التشغيل يرجع إلى `operator.write`
- القاعدة العملية: لا تفترض أن مسار Plugin المصادق عليه عبر gateway هو واجهة إدارية ضمنية. إذا كان مسارك يحتاج إلى سلوك إداري فقط، فاطلب وضع مصادقة حاملاً للهوية ووثّق عقد الترويسة `x-openclaw-scopes` الصريح.

## مسارات الاستيراد في Plugin SDK

استخدم المسارات الفرعية الضيقة في SDK بدلًا من شريط الجذر الأحادي `openclaw/plugin-sdk`
عند تأليف Plugins جديدة. المسارات الفرعية الأساسية:

| المسار الفرعي                         | الغرض                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | بدائيات تسجيل Plugin                               |
| `openclaw/plugin-sdk/channel-core`  | مساعدات إدخال/بناء القنوات                         |
| `openclaw/plugin-sdk/core`          | مساعدات مشتركة عامة وعقد شامل                      |
| `openclaw/plugin-sdk/config-schema` | مخطط Zod للجذر `openclaw.json` (`OpenClawSchema`) |

تختار Plugins القنوات من عائلة من الوصلات الضيقة — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, و`channel-actions`. يجب أن يتركّز سلوك الموافقة
على عقد `approvalCapability` واحد بدلًا من مزجه عبر حقول Plugin
غير المرتبطة. راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).

توجد مساعدات وقت التشغيل والإعداد ضمن مسارات فرعية مطابقة من نوع `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, وغيرها).

<Info>
`openclaw/plugin-sdk/channel-runtime` مهمل — وهو طبقة توافق
لـ Plugins الأقدم. يجب أن تستورد الشيفرة الجديدة بدائيات عامة أضيق بدلًا من ذلك.
</Info>

نقاط الإدخال الداخلية للمستودع (لكل جذر حزمة Plugin مضمّنة):

- `index.js` — إدخال Plugin المضمّن
- `api.js` — شريط مساعدات/أنواع
- `runtime-api.js` — شريط مخصّص لوقت التشغيل فقط
- `setup-entry.js` — إدخال Plugin الخاص بالإعداد

يجب على Plugins الخارجية أن تستورد فقط من المسارات الفرعية `openclaw/plugin-sdk/*`. لا
تستورد أبدًا `src/*` الخاصة بحزمة Plugin أخرى من النواة أو من Plugin أخرى.
تفضّل نقاط الإدخال المحمّلة عبر الواجهة لقطة إعدادات وقت التشغيل النشطة عندما تكون
موجودة، ثم تعود إلى ملف الإعدادات المحلول على القرص.

توجد مسارات فرعية خاصة بالقدرات مثل `image-generation`, `media-understanding`,
و`speech` لأن Plugins المضمّنة تستخدمها اليوم. وهي ليست تلقائيًا عقودًا خارجية
مجمّدة على المدى الطويل — تحقّق من صفحة مرجع SDK ذات الصلة عند الاعتماد عليها.

## مخططات أدوات الرسائل

يجب أن تمتلك Plugins مساهمات مخطط `describeMessageTool(...)` الخاصة بالقناة
للبدائيات غير الرسائلية مثل التفاعلات وعمليات القراءة والاستطلاعات.
يجب أن يستخدم عرض الإرسال المشترك عقد `MessagePresentation` العام
بدلًا من حقول الأزرار أو المكوّنات أو الكتل أو البطاقات الأصلية لدى المزوّد.
راجع [عرض الرسالة](/ar/plugins/message-presentation) للاطلاع على العقد
وقواعد التراجع وتعيين المزوّد وقائمة التحقق الخاصة بمؤلفي Plugins.

تعلن Plugins القادرة على الإرسال ما يمكنها عرضه عبر قدرات الرسائل:

- `presentation` لكتل العرض الدلالية (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` لطلبات التسليم المثبّتة

تقرّر النواة ما إذا كانت ستعرض التقديم بشكل أصلي أو ستحوّله إلى نص.
لا تكشف مسارات هروب لواجهة المستخدم الأصلية الخاصة بالمزوّد من أداة الرسائل العامة.
ما تزال مساعدات SDK المهملة للمخططات الأصلية القديمة مُصدّرة من أجل
Plugins الخارجية الحالية، لكن يجب ألا تستخدمها Plugins الجديدة.

## حل أهداف القنوات

يجب أن تمتلك Plugins القنوات دلالات الأهداف الخاصة بالقناة. أبقِ مضيف
الإرسال المشترك عامًا واستخدم سطح مُحوّل المراسلة لقواعد المزوّد:

- `messaging.inferTargetChatType({ to })` يقرّر ما إذا كان يجب التعامل مع
  هدف مُطبّع على أنه `direct` أو `group` أو `channel` قبل البحث في الدليل.
- `messaging.targetResolver.looksLikeId(raw, normalized)` يخبر النواة ما إذا كان
  ينبغي أن يتجاوز الإدخال مباشرة إلى حل شبيه بالمعرّف بدلًا من البحث في الدليل.
- `messaging.targetResolver.resolveTarget(...)` هو بديل Plugin عندما
  تحتاج النواة إلى حل نهائي مملوك للمزوّد بعد التطبيع أو بعد
  إخفاق البحث في الدليل.
- `messaging.resolveOutboundSessionRoute(...)` يمتلك إنشاء مسار الجلسة الصادرة
  الخاص بالمزوّد بمجرد حل الهدف.

التقسيم الموصى به:

- استخدم `inferTargetChatType` لقرارات الفئة التي يجب أن تحدث قبل
  البحث في الأقران/المجموعات.
- استخدم `looksLikeId` لفحوصات "عامِل هذا كمعرّف هدف صريح/أصلي".
- استخدم `resolveTarget` كبديل تطبيع خاص بالمزوّد، وليس
  للبحث الواسع في الدليل.
- أبقِ المعرّفات الأصلية الخاصة بالمزوّد مثل معرّفات الدردشة ومعرّفات الخيوط وJIDs والمعرّفات
  وroom ids داخل قيم `target` أو المعاملات الخاصة بالمزوّد، لا في حقول SDK العامة.

## الأدلة المدعومة بالإعدادات

Plugins التي تستمد إدخالات الدليل من الإعدادات يجب أن تُبقي هذا المنطق داخل
Plugin وأن تعيد استخدام المساعدات المشتركة من
`openclaw/plugin-sdk/directory-runtime`.

استخدم هذا عندما تحتاج القناة إلى أقران/مجموعات مدعومة بالإعدادات مثل:

- أقران الرسائل المباشرة المعتمدين على قائمة السماح
- خرائط القنوات/المجموعات المضبوطة
- بدائل دليل ثابتة ضمن نطاق الحساب

المساعدات المشتركة في `directory-runtime` تتعامل فقط مع العمليات العامة:

- تصفية الاستعلامات
- تطبيق الحدود
- مساعدات إزالة التكرار/التطبيع
- بناء `ChannelDirectoryEntry[]`

يجب أن يبقى فحص الحساب الخاص بالقناة وتطبيع المعرّفات داخل تنفيذ Plugin.

## كتالوجات المزوّدين

يمكن لـ Plugins المزوّدين تعريف كتالوجات نماذج للاستدلال باستخدام
`registerProvider({ catalog: { run(...) { ... } } })`.

يعيد `catalog.run(...)` البنية نفسها التي يكتبها OpenClaw في
`models.providers`:

- `{ provider }` لإدخال مزوّد واحد
- `{ providers }` لإدخالات مزوّدين متعددة

استخدم `catalog` عندما تمتلك Plugin معرّفات نماذج خاصة بالمزوّد أو
إعدادات افتراضية لـ base URL أو بيانات تعريف نماذج محكومة بالمصادقة.

يتحكّم `catalog.order` في وقت دمج كتالوج Plugin بالنسبة إلى
المزوّدين الضمنيين المضمّنين في OpenClaw:

- `simple`: مزوّدون عاديون يعتمدون على مفتاح API أو متغيرات البيئة
- `profile`: مزوّدون يظهرون عند وجود ملفات تعريف للمصادقة
- `paired`: مزوّدون يُنشئون إدخالات مزوّد مترابطة متعددة
- `late`: المرور الأخير، بعد سائر المزوّدين الضمنيين

يفوز المزوّدون اللاحقون عند تصادم المفاتيح، لذا يمكن لـ Plugins
أن تتجاوز عمدًا إدخال مزوّد مضمّنًا له معرّف المزوّد نفسه.

التوافق:

- ما يزال `discovery` يعمل كاسم بديل قديم
- إذا سُجّل كل من `catalog` و`discovery`، فإن OpenClaw يستخدم `catalog`

## فحص القنوات للقراءة فقط

إذا كانت Plugin تسجّل قناة، ففضّل تنفيذ
`plugin.config.inspectAccount(cfg, accountId)` إلى جانب `resolveAccount(...)`.

السبب:

- `resolveAccount(...)` هو مسار وقت التشغيل. ويُسمح له بافتراض أن بيانات الاعتماد
  قد جرى تجسيدها بالكامل ويمكنه الإخفاق بسرعة عندما تكون الأسرار المطلوبة مفقودة.
- لا ينبغي لمسارات الأوامر للقراءة فقط مثل `openclaw status` و`openclaw status --all`
  و`openclaw channels status` و`openclaw channels resolve` ومسارات doctor/إصلاح الإعدادات
  أن تحتاج إلى تجسيد بيانات اعتماد وقت التشغيل فقط من أجل
  وصف الإعدادات.

السلوك الموصى به لـ `inspectAccount(...)`:

- أعِد فقط حالة وصفية للحساب.
- حافظ على `enabled` و`configured`.
- ضمّن حقول مصدر/حالة بيانات الاعتماد عند الحاجة، مثل:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لا تحتاج إلى إعادة قيم الرموز الخام فقط للإبلاغ عن التوفر
  للقراءة فقط. يكفي إرجاع `tokenStatus: "available"` (ومعه حقل المصدر
  المطابق) لأوامر من نمط الحالة.
- استخدم `configured_unavailable` عندما تكون بيانات الاعتماد مضبوطة عبر SecretRef لكن
  غير متاحة في مسار الأمر الحالي.

يتيح هذا للأوامر المخصّصة للقراءة فقط أن تُبلغ عن "مُضبط ولكن غير متاح في مسار
الأمر هذا" بدلًا من التعطل أو الإبلاغ خطأً بأن الحساب غير مُضبط.

## حِزم الحزم

يمكن أن يتضمن دليل Plugin ملف `package.json` يحتوي على `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

يصبح كل إدخال Plugin. إذا سردت الحزمة عدة إضافات، فإن معرّف Plugin
يصبح `name/<fileBase>`.

إذا كانت Plugin تستورد تبعيات npm، فثبّتها في ذلك الدليل بحيث يكون
`node_modules` متاحًا (`npm install` / `pnpm install`).

حاجز أمان: يجب أن يبقى كل إدخال `openclaw.extensions` داخل دليل Plugin
بعد حل الروابط الرمزية. تُرفض الإدخالات التي تخرج من دليل الحزمة.

ملاحظة أمنية: يقوم `openclaw plugins install` بتثبيت تبعيات Plugin باستخدام
`npm install --omit=dev --ignore-scripts` (من دون نصوص دورة حياة، ومن دون تبعيات تطوير وقت التشغيل). حافظ على أشجار تبعيات Plugin
"JS/TS خالصة" وتجنب الحزم التي تتطلب بناء `postinstall`.

اختياري: يمكن أن يشير `openclaw.setupEntry` إلى وحدة خفيفة مخصّصة للإعداد فقط.
عندما يحتاج OpenClaw إلى أسطح الإعداد لقناة Plugin معطّلة، أو
عندما تكون قناة Plugin مفعّلة لكنها ما تزال غير مضبوطة، فإنه يحمّل `setupEntry`
بدلًا من إدخال Plugin الكامل. يحافظ هذا على خفة البدء والإعداد
عندما يقوم إدخال Plugin الرئيسي أيضًا بربط الأدوات أو الخطافات أو
سائر شيفرة وقت التشغيل فقط.

اختياري: يمكن لـ
`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
أن يضم قناة Plugin إلى مسار `setupEntry` نفسه أثناء مرحلة بدء التشغيل السابقة
للاستماع في Gateway، حتى عندما تكون القناة مضبوطة بالفعل.

استخدم هذا فقط عندما يغطّي `setupEntry` سطح بدء التشغيل بالكامل الذي يجب أن يكون
موجودًا قبل أن يبدأ Gateway بالاستماع. عمليًا، يعني هذا أن إدخال الإعداد
يجب أن يسجل كل قدرة مملوكة للقناة يعتمد عليها بدء التشغيل، مثل:

- تسجيل القناة نفسها
- أي مسارات HTTP يجب أن تكون متاحة قبل أن يبدأ Gateway بالاستماع
- أي أساليب أو أدوات أو خدمات في Gateway يجب أن تكون موجودة خلال النافذة نفسها

إذا كان الإدخال الكامل ما يزال يمتلك أي قدرة مطلوبة عند بدء التشغيل، فلا تفعّل
هذا الخيار. أبقِ Plugin على السلوك الافتراضي ودع OpenClaw يحمّل
الإدخال الكامل أثناء بدء التشغيل.

يمكن للقنوات المضمّنة أيضًا نشر مساعدات سطح عقد مخصّصة للإعداد فقط يمكن للنواة
الرجوع إليها قبل تحميل وقت تشغيل القناة الكامل. سطح ترقية الإعداد الحالي هو:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

تستخدم النواة هذا السطح عندما تحتاج إلى ترقية إعداد قناة قديم لحساب واحد
إلى `channels.<id>.accounts.*` من دون تحميل إدخال Plugin الكامل.
تُعد Matrix المثال المضمّن الحالي: فهي تنقل فقط مفاتيح المصادقة/التمهيد
إلى حساب مُرقّى مُسمّى عندما تكون الحسابات المسماة موجودة بالفعل، ويمكنها
الحفاظ على مفتاح حساب افتراضي غير قياسي مُضبط بدلًا من إنشاء
`accounts.default` دائمًا.

تُبقي مُحوّلات تصحيح الإعداد هذه اكتشاف سطح العقد المضمّن كسولًا. يبقى وقت
الاستيراد خفيفًا؛ ويُحمّل سطح الترقية فقط عند أول استخدام بدلًا من
إعادة دخول بدء تشغيل القناة المضمّنة عند استيراد الوحدة.

عندما تتضمن أسطح بدء التشغيل هذه أساليب Gateway RPC، فأبقِها ضمن بادئة
خاصة بالـ Plugin. تظل مساحات أسماء الإدارة الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا
إلى `operator.admin`، حتى إذا طلبت Plugin نطاقًا أضيق.

مثال:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### بيانات تعريف كتالوج القنوات

يمكن لـ Plugins القنوات الإعلان عن بيانات تعريف الإعداد/الاكتشاف عبر `openclaw.channel` و
تلميحات التثبيت عبر `openclaw.install`. هذا يبقي بيانات الكتالوج في النواة خالية من البيانات.

مثال:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (مستضاف ذاتيًا)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "دردشة مستضافة ذاتيًا عبر روبوتات Webhook الخاصة بـ Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

حقول `openclaw.channel` المفيدة بالإضافة إلى المثال الأدنى:

- `detailLabel`: تسمية ثانوية لأسطح الكتالوج/الحالة الأكثر غنى
- `docsLabel`: تجاوز نص الرابط الخاص برابط التوثيق
- `preferOver`: معرّفات Plugin/قناة ذات أولوية أقل يجب أن يتفوق عليها إدخال الكتالوج هذا
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: عناصر تحكم في النص لسطح الاختيار
- `markdownCapable`: يحدد القناة على أنها قادرة على Markdown لقرارات التنسيق الصادر
- `exposure.configured`: إخفاء القناة من أسطح سرد القنوات المضبوطة عند ضبطها على `false`
- `exposure.setup`: إخفاء القناة من منتقيات الإعداد/التهيئة التفاعلية عند ضبطها على `false`
- `exposure.docs`: تمييز القناة على أنها داخلية/خاصة لأسطح التنقل في التوثيق
- `showConfigured` / `showInSetup`: أسماء بديلة قديمة ما تزال مقبولة للتوافق؛ يُفضّل `exposure`
- `quickstartAllowFrom`: يضم القناة إلى تدفق `allowFrom` القياسي في البدء السريع
- `forceAccountBinding`: يفرض ربط الحساب صراحةً حتى عند وجود حساب واحد فقط
- `preferSessionLookupForAnnounceTarget`: يفضّل البحث عن الجلسة عند حل أهداف الإعلان

يمكن لـ OpenClaw أيضًا دمج **كتالوجات القنوات الخارجية** (مثلًا، تصدير سجل
MPM). ضع ملف JSON في أحد المواقع التالية:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

أو وجّه `OPENCLAW_PLUGIN_CATALOG_PATHS` (أو `OPENCLAW_MPM_CATALOG_PATHS`) إلى
ملف JSON واحد أو أكثر (محددة بفواصل/فواصل منقوطة/محدِّد `PATH`). يجب أن يحتوي كل ملف
على `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. كما يقبل المحلل أيضًا
`"packages"` أو `"plugins"` كأسماء بديلة قديمة للمفتاح `"entries"`.

تكشف إدخالات كتالوج القنوات المُولَّدة وإدخالات كتالوج تثبيت المزوّد
عن حقائق مُطبَّعة خاصة بمصدر التثبيت إلى جانب كتلة `openclaw.install` الخام. تحدد
الحقائق المُطبَّعة ما إذا كانت مواصفة npm إصدارًا ثابتًا أو محددًا عائمًا،
وما إذا كانت بيانات التكامل المتوقعة موجودة، وما إذا كان مسار مصدر محلي
متاحًا أيضًا. وعندما تكون هوية الكتالوج/الحزمة معروفة، فإن الحقائق المُطبَّعة
تحذّر إذا انحرف اسم حزمة npm المحلل عن تلك الهوية.
كما تحذّر أيضًا عندما تكون `defaultChoice` غير صالحة أو تشير إلى مصدر
غير متاح، وعندما تكون بيانات تكامل npm موجودة من دون
مصدر npm صالح. يجب على المستهلكين التعامل مع `installSource` بوصفه حقلاً اختياريًا
إضافيًا حتى لا تضطر الإدخالات اليدوية الأقدم وطبقات التوافق
إلى توليفه. يتيح هذا لعمليات الإعداد التشخيصية وعمليات التشخيص
شرح حالة مستوى المصدر من دون استيراد وقت تشغيل Plugin.

يجب أن تفضّل إدخالات npm الخارجية الرسمية
`npmSpec` ثابتة مع `expectedIntegrity`.
ما تزال أسماء الحزم المجردة ووسوم dist تعمل من أجل التوافق،
لكنها تُظهر تحذيرات على مستوى المصدر بحيث يستطيع الكتالوج التوجه
نحو عمليات تثبيت مثبتة ومتحقق من تكاملها من دون كسر Plugins الحالية.
عند تنفيذ التثبيت أثناء الإعداد من مسار كتالوج محلي، فإنه يسجل
إدخال `plugins.installs` مع `source: "path"` و
`sourcePath` نسبي إلى مساحة العمل عندما يكون ذلك ممكنًا. يظل مسار التحميل
التشغيلي المطلق في `plugins.load.paths`؛ ويتجنب سجل التثبيت تكرار
مسارات محطة العمل المحلية ضمن إعدادات طويلة الأمد. وهذا يُبقي عمليات التثبيت
المحلية الخاصة بالتطوير مرئية لتشخيصات مستوى المصدر من دون إضافة
سطح كشف ثانٍ خام لمسارات نظام الملفات.

## Plugins محرّك السياق

تمتلك Plugins محرّك السياق تنسيق سياق الجلسة لعمليات الإدخال
والتجميع وCompaction. سجّلها من Plugin الخاصة بك باستخدام
`api.registerContextEngine(id, factory)`، ثم اختر المحرك النشط عبر
`plugins.slots.contextEngine`.

استخدم هذا عندما تحتاج Plugin الخاصة بك إلى استبدال مسار
السياق الافتراضي أو توسيعه بدلًا من مجرد إضافة بحث في الذاكرة أو خطافات.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

إذا كان المحرك **لا** يمتلك خوارزمية Compaction، فأبقِ `compact()`
منفذة وفوّضها صراحةً:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## إضافة قدرة جديدة

عندما تحتاج Plugin إلى سلوك لا يلائم API الحالية، فلا تتجاوز
نظام Plugin عبر وصول خاص داخلي. أضف القدرة الناقصة.

التسلسل الموصى به:

1. عرّف عقد النواة
   قرر السلوك المشترك الذي يجب أن تمتلكه النواة: السياسة، والتراجع، ودمج الإعدادات،
   ودورة الحياة، والدلالات المواجهة للقناة، وشكل مساعد وقت التشغيل.
2. أضف أسطح تسجيل/وقت تشغيل Plugin مكتوبة Typed
   وسّع `OpenClawPluginApi` و/أو `api.runtime` بأصغر
   سطح قدرة Typed مفيد.
3. صِل النواة + مستهلكي القنوات/الميزات
   يجب أن تستهلك القنوات وPlugins الميزات القدرة الجديدة عبر النواة،
   لا من خلال استيراد تنفيذ مورّد مباشرة.
4. سجّل تطبيقات المورّدين
   ثم تسجل Plugins المورّدين واجهاتها الخلفية مقابل القدرة.
5. أضف تغطية العقد
   أضف اختبارات حتى تبقى الملكية وشكل التسجيل واضحين بمرور الوقت.

هكذا يبقى OpenClaw ذا توجه واضح من دون أن يصبح مشفرًا بشكل ثابت
وفق رؤية مزوّد واحد. راجع [كتاب وصفات القدرات](/ar/plugins/architecture)
للحصول على قائمة تحقق عملية للملفات ومثال كامل.

### قائمة تحقق القدرة

عند إضافة قدرة جديدة، يجب أن يلمس التنفيذ عادةً هذه
الأسطح معًا:

- أنواع عقد النواة في `src/<capability>/types.ts`
- مساعد النواة للتشغيل/وقت التشغيل في `src/<capability>/runtime.ts`
- سطح تسجيل API الخاصة بـ Plugin في `src/plugins/types.ts`
- ربط سجل Plugin في `src/plugins/registry.ts`
- إتاحة وقت تشغيل Plugin في `src/plugins/runtime/*` عندما تحتاج Plugins
  الميزات/القنوات إلى استهلاكها
- مساعدات الالتقاط/الاختبار في `src/test-utils/plugin-registration.ts`
- تأكيدات الملكية/العقد في `src/plugins/contracts/registry.ts`
- توثيق المشغل/Plugin في `docs/`

إذا كان أحد هذه الأسطح مفقودًا، فعادةً ما يكون ذلك علامة على أن القدرة
لم تُدمج بالكامل بعد.

### قالب القدرة

نمط أدنى:

```ts
// عقد النواة
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// Plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// مساعد وقت تشغيل مشترك لميزات/Plugins القنوات
const clip = await api.runtime.videoGeneration.generate({
  prompt: "اعرض الروبوت وهو يمشي عبر المختبر.",
  cfg,
});
```

نمط اختبار العقد:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

هذا يُبقي القاعدة بسيطة:

- تمتلك النواة عقد القدرة + التنسيق
- تمتلك Plugins المورّدين تطبيقات المورّدين
- تستهلك Plugins الميزات/القنوات مساعدات وقت التشغيل
- تُبقي اختبارات العقد الملكية واضحة

## ذو صلة

- [بنية Plugin](/ar/plugins/architecture) — نموذج القدرات العامة وأشكالها
- [المسارات الفرعية لـ Plugin SDK](/ar/plugins/sdk-subpaths)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
