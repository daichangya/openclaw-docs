---
read_when:
    - إضافة CLI النماذج أو تعديله (`models list/set/scan/aliases/fallbacks`)
    - تغيير سلوك الرجوع الاحتياطي للنموذج أو تجربة اختيار المستخدم
    - تحديث مجسات فحص النموذج (الأدوات/الصور)
summary: 'CLI النماذج: الإدراج، والتعيين، والأسماء المستعارة، وعمليات الرجوع الاحتياطي، والفحص، والحالة'
title: CLI النماذج
x-i18n:
    generated_at: "2026-04-22T04:22:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf7a17a20bea66e5e8dce134ed08b483417bc70ed875e796609d850aa79280e
    source_path: concepts/models.md
    workflow: 15
---

# CLI النماذج

راجع [/concepts/model-failover](/ar/concepts/model-failover) لمعرفة تدوير ملفات تعريف المصادقة،
وفترات التهدئة، وكيفية تفاعل ذلك مع عمليات الرجوع الاحتياطي.
ولنظرة سريعة على المزوّدين مع أمثلة: [/concepts/model-providers](/ar/concepts/model-providers).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

1. النموذج **الأساسي** (`agents.defaults.model.primary` أو `agents.defaults.model`).
2. **عمليات الرجوع الاحتياطي** في `agents.defaults.model.fallbacks` (بالترتيب).
3. يحدث **الرجوع الاحتياطي لمصادقة المزوّد** داخل المزوّد قبل الانتقال إلى
   النموذج التالي.

ذو صلة:

- `agents.defaults.models` هو قائمة السماح/الفهرس للنماذج التي يمكن لـ OpenClaw استخدامها (بالإضافة إلى الأسماء المستعارة).
- يُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
- يُستخدم `agents.defaults.pdfModel` بواسطة أداة `pdf`. وإذا تم حذفه، تعود الأداة
  إلى `agents.defaults.imageModel`، ثم إلى النموذج الافتراضي/نموذج الجلسة الذي تم حله.
- يُستخدم `agents.defaults.imageGenerationModel` بواسطة إمكانية توليد الصور المشتركة. وإذا تم حذفه، يمكن لـ `image_generate` مع ذلك استنتاج مزوّد افتراضي مدعوم بالمصادقة. وهو يجرّب أولًا مزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الصور المسجلين بترتيب معرّفات المزوّدين. وإذا عيّنت مزوّدًا/نموذجًا محددًا، فقم أيضًا بتكوين المصادقة/مفتاح API لذلك المزوّد.
- يُستخدم `agents.defaults.musicGenerationModel` بواسطة إمكانية توليد الموسيقى المشتركة. وإذا تم حذفه، يمكن لـ `music_generate` مع ذلك استنتاج مزوّد افتراضي مدعوم بالمصادقة. وهو يجرّب أولًا مزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّفات المزوّدين. وإذا عيّنت مزوّدًا/نموذجًا محددًا، فقم أيضًا بتكوين المصادقة/مفتاح API لذلك المزوّد.
- يُستخدم `agents.defaults.videoGenerationModel` بواسطة إمكانية توليد الفيديو المشتركة. وإذا تم حذفه، يمكن لـ `video_generate` مع ذلك استنتاج مزوّد افتراضي مدعوم بالمصادقة. وهو يجرّب أولًا مزوّد الافتراضي الحالي، ثم بقية مزوّدي توليد الفيديو المسجلين بترتيب معرّفات المزوّدين. وإذا عيّنت مزوّدًا/نموذجًا محددًا، فقم أيضًا بتكوين المصادقة/مفتاح API لذلك المزوّد.
- يمكن للإعدادات الافتراضية لكل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` مع الارتباطات (راجع [/concepts/multi-agent](/ar/concepts/multi-agent)).

## سياسة سريعة للنماذج

- اضبط نموذجك الأساسي على أقوى نموذج حديث الجيل متاح لك.
- استخدم عمليات الرجوع الاحتياطي للمهام الحساسة للتكلفة/زمن الاستجابة ولمحادثات المخاطر الأقل.
- بالنسبة للوكلاء المفعّلين بالأدوات أو للمدخلات غير الموثوقة، تجنب فئات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تعديل التكوين يدويًا، فشغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة للمزوّدين الشائعين، بما في ذلك **اشتراك OpenAI Code (Codex)**
(OAuth) و**Anthropic** (مفتاح API أو Claude CLI).

## مفاتيح التكوين (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء المستعارة + معلمات المزوّد)
- `models.providers` (المزوّدون المخصصون المكتوبون في `models.json`)

تُطبّع مراجع النماذج إلى أحرف صغيرة. كما تُطبّع الأسماء المستعارة للمزوّدين مثل `z.ai/*`
إلى `zai/*`.

توجد أمثلة على تكوين المزوّدين (بما في ذلك OpenCode) في
[/providers/opencode](/ar/providers/opencode).

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا تم تعيين `agents.defaults.models`، فإنه يصبح **قائمة السماح** لأمر `/model` ولتجاوزات
الجلسة. وعندما يختار المستخدم نموذجًا غير موجود في قائمة السماح تلك،
يعرض OpenClaw:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

يحدث هذا **قبل** إنشاء رد عادي، لذلك قد يبدو أن الرسالة
"لم تتلقَّ ردًا". والحل هو أحد الخيارات التالية:

- إضافة النموذج إلى `agents.defaults.models`، أو
- مسح قائمة السماح (إزالة `agents.defaults.models`)، أو
- اختيار نموذج من `/model list`.

مثال على تكوين قائمة السماح:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## تبديل النماذج في الدردشة (`/model`)

يمكنك تبديل النماذج للجلسة الحالية دون إعادة التشغيل:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

ملاحظات:

- `/model` (و`/model list`) هو منتقي مدمج مرقّم (عائلة النموذج + المزوّدون المتاحون).
- على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للمزوّد والنموذج بالإضافة إلى خطوة إرسال.
- يختار `/model <#>` من هذا المنتقي.
- يحفظ `/model` اختيار الجلسة الجديد فورًا.
- إذا كان الوكيل في وضع الخمول، فسيستخدم التشغيل التالي النموذج الجديد مباشرة.
- إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw تبديلًا مباشرًا بعلامة الانتظار ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأداة أو إخراج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو حتى دور المستخدم التالي.
- `/model status` هو العرض التفصيلي (مرشحو المصادقة، وعند التكوين، `baseUrl` لنقطة نهاية المزوّد + وضع `api`).
- يتم تحليل مراجع النماذج بالتقسيم عند **أول** `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
- إذا كان معرّف النموذج نفسه يحتوي على `/` (بنمط OpenRouter)، فيجب عليك تضمين بادئة المزوّد (مثال: `/model openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، فسيحل OpenClaw الإدخال بهذا الترتيب:
  1. مطابقة الاسم المستعار
  2. مطابقة فريدة لمزوّد مُكوَّن لذلك المعرّف غير المسبوق للموديل
  3. رجوع احتياطي قديم إلى المزوّد الافتراضي المُكوَّن
     إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المُكوَّن، فإن OpenClaw
     يعود بدلًا من ذلك إلى أول مزوّد/نموذج مُكوَّن لتجنّب
     إظهار افتراضي قديم من مزوّد تمت إزالته.

سلوك الأمر/التكوين الكامل: [أوامر الشرطة المائلة](/ar/tools/slash-commands).

## أوامر CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

يُعد `openclaw models` (من دون أمر فرعي) اختصارًا لـ `models status`.

### `models list`

يعرض النماذج المُكوَّنة افتراضيًا. علامات مفيدة:

- `--all`: الفهرس الكامل
- `--local`: المزوّدون المحليون فقط
- `--provider <name>`: التصفية حسب المزوّد
- `--plain`: نموذج واحد في كل سطر
- `--json`: إخراج قابل للقراءة الآلية

يتضمن `--all` صفوف الفهرس الثابتة المملوكة للمزوّد والمضمّنة قبل
تكوين المصادقة، لذلك يمكن لعروض الاكتشاف فقط إظهار نماذج غير متاحة حتى
تضيف بيانات اعتماد مزوّد مطابقة.

### `models status`

يعرض النموذج الأساسي الذي تم حله، وعمليات الرجوع الاحتياطي، ونموذج الصور، ونظرة عامة على مصادقة
المزوّدين المُكوَّنين. كما يعرض أيضًا حالة انتهاء صلاحية OAuth لملفات التعريف الموجودة
في مخزن المصادقة (ويحذّر خلال 24 ساعة افتراضيًا). ويطبع `--plain` النموذج
الأساسي الذي تم حله فقط.
تُعرض حالة OAuth دائمًا (وتُضمَّن في إخراج `--json`). وإذا لم تكن لدى
أحد المزوّدين المُكوَّنين بيانات اعتماد، يطبع `models status` قسم **Missing auth**.
ويتضمن JSON كلًا من `auth.oauth` (نافذة التحذير + ملفات التعريف) و`auth.providers`
(المصادقة الفعّالة لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة بالبيئة). ويمثل `auth.oauth`
صحة ملفات تعريف مخزن المصادقة فقط؛ أما المزوّدون الذين يعتمدون على البيئة فقط فلا يظهرون هناك.
استخدم `--check` للأتمتة (رمز خروج `1` عند الفقد/انتهاء الصلاحية، و`2` عند قرب الانتهاء).
واستخدم `--probe` لإجراء فحوصات مصادقة مباشرة؛ ويمكن أن تأتي صفوف الفحص من ملفات تعريف المصادقة، أو بيانات اعتماد البيئة، أو `models.json`.
إذا حذف `auth.order.<provider>` الصريح ملف تعريف مخزّنًا، فسيعرض الفحص
`excluded_by_auth_order` بدلًا من تجربته. وإذا كانت المصادقة موجودة لكن لا يمكن
حل نموذج قابل للفحص لذلك المزوّد، فسيعرض الفحص `status: no_model`.

يعتمد اختيار المصادقة على المزوّد/الحساب. بالنسبة لمضيفي Gateway الذين يعملون دائمًا،
تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما يتم أيضًا دعم إعادة استخدام Claude CLI وملفات تعريف OAuth/الرموز الحالية الخاصة بـ Anthropic.

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يفحص `openclaw models scan` **فهرس النماذج المجانية** في OpenRouter، ويمكنه
اختياريًا اختبار النماذج للتحقق من دعم الأدوات والصور.

العلامات الأساسية:

- `--no-probe`: تخطّي الفحوصات المباشرة (بيانات وصفية فقط)
- `--min-params <b>`: الحد الأدنى لحجم المعلمات (بالمليارات)
- `--max-age-days <days>`: تخطّي النماذج الأقدم
- `--provider <name>`: عامل تصفية لبادئة المزوّد
- `--max-candidates <n>`: حجم قائمة الرجوع الاحتياطي
- `--set-default`: تعيين `agents.defaults.model.primary` إلى أول اختيار
- `--set-image`: تعيين `agents.defaults.imageModel.primary` إلى أول اختيار للصور

يتطلب الفحص مفتاح OpenRouter API (من ملفات تعريف المصادقة أو
`OPENROUTER_API_KEY`). ومن دون مفتاح، استخدم `--no-probe` لإدراج المرشحين فقط.

تُرتَّب نتائج الفحص حسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعلمات

المدخلات

- قائمة OpenRouter ‏`/models` (عامل التصفية `:free`)
- يتطلب مفتاح OpenRouter API من ملفات تعريف المصادقة أو `OPENROUTER_API_KEY` (راجع [/environment](/ar/help/environment))
- عوامل تصفية اختيارية: `--max-age-days` و`--min-params` و`--provider` و`--max-candidates`
- عناصر تحكم الفحص: `--timeout` و`--concurrency`

عند التشغيل في TTY، يمكنك اختيار عمليات الرجوع الاحتياطي تفاعليًا. وفي الوضع
غير التفاعلي، مرّر `--yes` لقبول القيم الافتراضية.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن
دليل الوكيل (الافتراضي `~/.openclaw/agents/<agentId>/agent/models.json`). ويُدمج هذا الملف
افتراضيًا ما لم يتم تعيين `models.mode` إلى `replace`.

أسبقية وضع الدمج لمعرّفات المزوّدات المتطابقة:

- يفوز `baseUrl` غير الفارغ الموجود بالفعل في `models.json` الخاص بالوكيل.
- يفوز `apiKey` غير الفارغ في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا بواسطة SecretRef في سياق التكوين/ملف تعريف المصادقة الحالي.
- يتم تحديث قيم `apiKey` للمزوّد المُدار بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلًا من حفظ الأسرار المحلولة.
- يتم تحديث قيم رؤوس المزوّد المُدار بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
- تعود قيمة `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى `models.providers` في التكوين.
- يتم تحديث حقول المزوّد الأخرى من التكوين وبيانات الفهرس المطبّعة.

إن حفظ العلامات مرجعه المصدر: يكتب OpenClaw العلامات من لقطة تكوين المصدر النشط (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحلولة.
وينطبق هذا كلما أعاد OpenClaw إنشاء `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.

## ذو صلة

- [Model Providers](/ar/concepts/model-providers) — توجيه المزوّد والمصادقة
- [Model Failover](/ar/concepts/model-failover) — سلاسل الرجوع الاحتياطي
- [Image Generation](/ar/tools/image-generation) — تكوين نموذج الصور
- [Music Generation](/ar/tools/music-generation) — تكوين نموذج الموسيقى
- [Video Generation](/ar/tools/video-generation) — تكوين نموذج الفيديو
- [Configuration Reference](/ar/gateway/configuration-reference#agent-defaults) — مفاتيح تكوين النموذج
