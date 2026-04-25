---
read_when:
    - إضافة CLI النماذج أو تعديله (models list/set/scan/aliases/fallbacks)
    - تغيير سلوك الرجوع الخاص بالنموذج أو تجربة اختيار النموذج
    - تحديث مجسات فحص النموذج (الأدوات/الصور)
summary: 'CLI النماذج: الإدراج، والتعيين، والأسماء المستعارة، وعمليات الرجوع، والفحص، والحالة'
title: CLI النماذج
x-i18n:
    generated_at: "2026-04-25T13:45:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

راجع [/concepts/model-failover](/ar/concepts/model-failover) لمعرفة
تدوير ملفات تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع عمليات الرجوع.
نظرة عامة سريعة على المزوّدين + أمثلة: [/concepts/model-providers](/ar/concepts/model-providers).
تختار مراجع النماذج مزوّدًا ونموذجًا. وهي لا تختار عادةً
وقت تشغيل الوكيل منخفض المستوى. على سبيل المثال، يمكن تشغيل `openai/gpt-5.5` عبر
مسار مزوّد OpenAI العادي أو عبر وقت تشغيل خادم تطبيق Codex، اعتمادًا
على `agents.defaults.embeddedHarness.runtime`. راجع
[/concepts/agent-runtimes](/ar/concepts/agent-runtimes).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

1. النموذج **الأساسي** (`agents.defaults.model.primary` أو `agents.defaults.model`).
2. **عمليات الرجوع** في `agents.defaults.model.fallbacks` (حسب الترتيب).
3. يحدث **الرجوع في مصادقة المزوّد** داخل المزوّد قبل الانتقال إلى
   النموذج التالي.

ذو صلة:

- `agents.defaults.models` هي قائمة السماح/كتالوج النماذج التي يمكن لـ OpenClaw استخدامها (بالإضافة إلى الأسماء المستعارة).
- تُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
- تُستخدم `agents.defaults.pdfModel` بواسطة أداة `pdf`. وإذا حُذفت، فإن الأداة
  ترجع إلى `agents.defaults.imageModel`، ثم إلى النموذج
  المحلول للجلسة/الافتراضي.
- تُستخدم `agents.defaults.imageGenerationModel` بواسطة إمكانية إنشاء الصور المشتركة. وإذا حُذفت، فلا يزال بإمكان `image_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. وهو يحاول أولًا مزوّد الخدمة الافتراضي الحالي، ثم مزوّدي إنشاء الصور المسجّلين المتبقين بحسب ترتيب معرّفات المزوّدين. إذا عيّنت مزوّدًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك المزوّد.
- تُستخدم `agents.defaults.musicGenerationModel` بواسطة إمكانية إنشاء الموسيقى المشتركة. وإذا حُذفت، فلا يزال بإمكان `music_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. وهو يحاول أولًا مزوّد الخدمة الافتراضي الحالي، ثم مزوّدي إنشاء الموسيقى المسجّلين المتبقين بحسب ترتيب معرّفات المزوّدين. إذا عيّنت مزوّدًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك المزوّد.
- تُستخدم `agents.defaults.videoGenerationModel` بواسطة إمكانية إنشاء الفيديو المشتركة. وإذا حُذفت، فلا يزال بإمكان `video_generate` استنتاج افتراضي مزوّد مدعوم بالمصادقة. وهو يحاول أولًا مزوّد الخدمة الافتراضي الحالي، ثم مزوّدي إنشاء الفيديو المسجّلين المتبقين بحسب ترتيب معرّفات المزوّدين. إذا عيّنت مزوّدًا/نموذجًا محددًا، فاضبط أيضًا مصادقة/مفتاح API لذلك المزوّد.
- يمكن للقيم الافتراضية لكل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` بالإضافة إلى عمليات الربط (راجع [/concepts/multi-agent](/ar/concepts/multi-agent)).

## سياسة سريعة للنموذج

- اضبط النموذج الأساسي على أقوى نموذج من أحدث جيل متاح لك.
- استخدم عمليات الرجوع للمهام الحساسة من حيث التكلفة/زمن الاستجابة وللدردشة الأقل أهمية.
- بالنسبة إلى الوكلاء المفعّلة لديهم الأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تعديل الإعدادات يدويًا، فشغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة لمزوّدين شائعين، بما في ذلك **اشتراك OpenAI Code (Codex)**
(OAuth) و**Anthropic** (مفتاح API أو Claude CLI).

## مفاتيح الإعدادات (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء المستعارة + معلمات المزوّد)
- `models.providers` (مزوّدون مخصصون مكتوبون في `models.json`)

تتم تسوية مراجع النماذج إلى أحرف صغيرة. كما تتم تسوية
الأسماء المستعارة للمزوّدين مثل `z.ai/*` إلى `zai/*`.

توجد أمثلة إعداد المزوّدين (بما في ذلك OpenCode) في
[/providers/opencode](/ar/providers/opencode).

### تعديلات آمنة على قائمة السماح

استخدم كتابات إضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

يحمي `openclaw config set` خرائط النماذج/المزوّدين من الاستبدال العرضي. يتم
رفض التعيين النصي الصريح لكائن إلى `agents.defaults.models` أو `models.providers` أو
`models.providers.<id>.models` عندما يؤدي ذلك إلى إزالة إدخالات
موجودة. استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما
يجب أن تصبح القيمة المقدمة هي القيمة الهدف الكاملة.

كما يقوم إعداد المزوّد التفاعلي و`openclaw configure --section model`
بدمج التحديدات الخاصة بنطاق المزوّد في قائمة السماح الحالية، لذا فإن إضافة Codex
أو Ollama أو مزوّد آخر لا يؤدي إلى إسقاط إدخالات النماذج غير المرتبطة.
يحافظ configure على `agents.defaults.model.primary` الموجود عندما تتم
إعادة تطبيق مصادقة المزوّد. أما أوامر تعيين الافتراضي الصريحة مثل
`openclaw models auth login --provider <id> --set-default` و
`openclaw models set <model>` فتظل تستبدل `agents.defaults.model.primary`.

## "النموذج غير مسموح به" (ولماذا تتوقف الردود)

إذا تم تعيين `agents.defaults.models`، فإنها تصبح **قائمة السماح** لـ `/model` ولتجاوزات
الجلسة. وعندما يختار المستخدم نموذجًا غير موجود في قائمة السماح هذه،
يعيد OpenClaw:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

يحدث هذا **قبل** إنشاء رد عادي، لذلك قد يبدو أن الرسالة
"لم تحصل على رد". والحل هو أحد ما يلي:

- إضافة النموذج إلى `agents.defaults.models`، أو
- مسح قائمة السماح (إزالة `agents.defaults.models`)، أو
- اختيار نموذج من `/model list`.

مثال على إعداد قائمة السماح:

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

- يُعد `/model` (و`/model list`) أداة اختيار مدمجة ومرقمة (عائلة النموذج + المزوّدون المتاحون).
- على Discord، يفتح `/model` و`/models` أداة اختيار تفاعلية مع قوائم منسدلة للمزوّد والنموذج بالإضافة إلى خطوة Submit.
- أصبح `/models add` مهملًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من الدردشة.
- يختار `/model <#>` من أداة الاختيار هذه.
- يحفظ `/model` التحديد الجديد للجلسة فورًا.
- إذا كان الوكيل خاملًا، تستخدم العملية التالية النموذج الجديد مباشرة.
- إذا كانت هناك عملية نشطة بالفعل، يضع OpenClaw التبديل المباشر قيد الانتظار ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأدوات أو خرج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو حتى دور المستخدم التالي.
- يُعد `/model status` العرض التفصيلي (مرشحو المصادقة، و`baseUrl` و`api` الخاصتان بنقطة نهاية المزوّد عند الإعداد).
- يتم تحليل مراجع النماذج عبر التقسيم عند **أول** `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
- إذا كان معرّف النموذج نفسه يحتوي على `/` (على نمط OpenRouter)، فيجب أن تدرج بادئة المزوّد (مثال: `/model openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، يحلل OpenClaw الإدخال بهذا الترتيب:
  1. مطابقة الاسم المستعار
  2. مطابقة مزوّد مُعدّ فريدة لذلك معرّف النموذج غير المسبوق نفسه
  3. رجوع قديم إلى المزوّد الافتراضي المُعدّ
     إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المُعدّ، فإن OpenClaw
     يرجع بدلًا من ذلك إلى أول مزوّد/نموذج مُعدّ لتجنب
     إظهار افتراضي قديم لمزوّد تمت إزالته.

سلوك/إعدادات الأمر الكاملة: [أوامر الشرطة المائلة](/ar/tools/slash-commands).

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

يعرض النماذج المُعدّة افتراضيًا. العلامات المفيدة:

- `--all`: الكتالوج الكامل
- `--local`: المزوّدون المحليون فقط
- `--provider <id>`: التصفية حسب معرّف المزوّد، مثل `moonshot`؛ ولا تُقبل
  تسميات العرض من أدوات الاختيار التفاعلية
- `--plain`: نموذج واحد في كل سطر
- `--json`: خرج قابل للقراءة آليًا

يتضمن `--all` صفوف الكتالوج الثابتة المملوكة للمزوّد والمضمّنة قبل
إعداد المصادقة، لذلك يمكن لعروض الاكتشاف فقط أن تعرض نماذج غير متاحة حتى
تضيف بيانات اعتماد مزوّد مطابقة.

### `models status`

يعرض النموذج الأساسي المحلول، وعمليات الرجوع، ونموذج الصور، ونظرة عامة على
المصادقة الخاصة بالمزوّدين المُعدّين. كما يعرض حالة انتهاء صلاحية OAuth لملفات التعريف الموجودة
في مخزن المصادقة (ويحذّر خلال 24 ساعة افتراضيًا). يطبع `--plain` فقط
النموذج الأساسي المحلول.
يتم دائمًا عرض حالة OAuth (وتضمينها في خرج `--json`). إذا كان لدى مزوّد
مُعدّ لا يملك بيانات اعتماد، فإن `models status` يطبع قسم **Missing auth**.
يتضمن JSON كلاً من `auth.oauth` (نافذة التحذير + الملفات الشخصية) و`auth.providers`
(المصادقة الفعّالة لكل مزوّد، بما في ذلك بيانات الاعتماد المدعومة بالبيئة). وتمثل `auth.oauth`
فقط سلامة ملفات تعريف مخزن المصادقة؛ ولا تظهر المزوّدات المعتمدة على env فقط هناك.
استخدم `--check` للأتمتة (خروج `1` عند الغياب/الانتهاء، و`2` عند قرب الانتهاء).
واستخدم `--probe` لفحوصات المصادقة الحية؛ ويمكن أن تأتي صفوف probe من ملفات تعريف المصادقة أو بيانات اعتماد env
أو `models.json`.
إذا كانت `auth.order.<provider>` الصريحة تحذف ملف تعريف مخزنًا، فإن probe يعرض
`excluded_by_auth_order` بدلًا من محاولة استخدامه. وإذا كانت المصادقة موجودة لكن لا يمكن تحليل نموذج قابل للفحص لذلك المزوّد، فإن probe يعرض `status: no_model`.

يعتمد اختيار المصادقة على المزوّد/الحساب. بالنسبة إلى مضيفات Gateway الدائمة التشغيل، تكون مفاتيح API عادةً الأكثر قابلية للتنبؤ؛ كما أن إعادة استخدام Claude CLI وملفات تعريف OAuth/الرمز الخاصة بـ Anthropic الموجودة مدعومة أيضًا.

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (النماذج المجانية في OpenRouter)

يقوم `openclaw models scan` بفحص **كتالوج النماذج المجانية** في OpenRouter ويمكنه
اختياريًا فحص النماذج للتحقق من دعم الأدوات والصور.

العلامات الرئيسية:

- `--no-probe`: تخطي الفحوصات الحية (بيانات وصفية فقط)
- `--min-params <b>`: الحد الأدنى لحجم المعلمات (بالمليارات)
- `--max-age-days <days>`: تخطي النماذج الأقدم
- `--provider <name>`: مرشح بادئة المزوّد
- `--max-candidates <n>`: حجم قائمة الرجوع
- `--set-default`: تعيين `agents.defaults.model.primary` إلى أول تحديد
- `--set-image`: تعيين `agents.defaults.imageModel.primary` إلى أول تحديد للصور

يُعد كتالوج `/models` في OpenRouter عامًا، لذا يمكن للفحوصات المعتمدة على البيانات الوصفية فقط أن تسرد
المرشحين المجانيين من دون مفتاح. لكن الفحص والاستدلال لا يزالان يتطلبان
مفتاح OpenRouter API (من ملفات تعريف المصادقة أو `OPENROUTER_API_KEY`). وإذا لم يتوفر مفتاح،
فإن `openclaw models scan` يرجع إلى خرج البيانات الوصفية فقط ويترك
الإعدادات بلا تغيير. استخدم `--no-probe` لطلب وضع البيانات الوصفية فقط صراحةً.

يتم ترتيب نتائج الفحص حسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعلمات

المدخلات

- قائمة OpenRouter `/models` (مرشح `:free`)
- تتطلب الفحوصات الحية مفتاح OpenRouter API من ملفات تعريف المصادقة أو `OPENROUTER_API_KEY` (راجع [/environment](/ar/help/environment))
- مرشحات اختيارية: `--max-age-days` و`--min-params` و`--provider` و`--max-candidates`
- عناصر التحكم في الطلب/الفحص: `--timeout` و`--concurrency`

عند تشغيل الفحوصات الحية في TTY، يمكنك اختيار عمليات الرجوع بشكل تفاعلي. وفي
الوضع غير التفاعلي، مرّر `--yes` لقبول القيم الافتراضية. أما نتائج البيانات الوصفية فقط فهي
لأغراض معلوماتية؛ ويتطلب `--set-default` و`--set-image` فحوصات حية حتى
لا يقوم OpenClaw بإعداد نموذج OpenRouter غير قابل للاستخدام وبدون مفتاح.

## سجل النماذج (`models.json`)

تُكتب المزوّدات المخصصة في `models.providers` إلى `models.json` ضمن
دليل الوكيل (الافتراضي `~/.openclaw/agents/<agentId>/agent/models.json`). ويتم دمج هذا الملف
افتراضيًا ما لم يتم تعيين `models.mode` إلى `replace`.

أولوية وضع الدمج لمعرّفات المزوّد المطابقة:

- تفوز قيمة `baseUrl` غير الفارغة الموجودة بالفعل في `models.json` الخاص بالوكيل.
- تفوز قيمة `apiKey` غير الفارغة في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا بواسطة SecretRef في سياق الإعدادات/ملف تعريف المصادقة الحالي.
- يتم تحديث قيم `apiKey` الخاصة بالمزوّدات المُدارة بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec) بدلًا من حفظ الأسرار المحلولة.
- يتم تحديث قيم ترويسات المزوّد المُدارة بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec).
- ترجع قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في ملف الوكيل إلى `models.providers` في الإعدادات.
- يتم تحديث حقول المزوّد الأخرى من الإعدادات وبيانات الكتالوج الموحّدة.

يكون حفظ العلامات معتمدًا على المصدر: يكتب OpenClaw العلامات من لقطة إعدادات المصدر النشطة (قبل التحليل)، وليس من قيم الأسرار المحلولة في وقت التشغيل.
وينطبق ذلك كلما أعاد OpenClaw إنشاء `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.

## ذو صلة

- [Model Providers](/ar/concepts/model-providers) — توجيه المزوّد والمصادقة
- [Agent Runtimes](/ar/concepts/agent-runtimes) — Pi وCodex وأوقات تشغيل حلقات الوكيل الأخرى
- [Model Failover](/ar/concepts/model-failover) — سلاسل الرجوع
- [Image Generation](/ar/tools/image-generation) — إعدادات نموذج الصور
- [Music Generation](/ar/tools/music-generation) — إعدادات نموذج الموسيقى
- [Video Generation](/ar/tools/video-generation) — إعدادات نموذج الفيديو
- [Configuration Reference](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعدادات النموذج
