---
read_when:
    - إضافة CLI النماذج أو تعديله (`models list`/`set`/`scan`/`aliases`/`fallbacks`)
    - تغيير سلوك بدائل fallback للنماذج أو تجربة اختيارها
    - تحديث probes فحص النماذج (`tools`/`images`)
summary: 'CLI النماذج: `list` و`set` و`aliases` و`fallbacks` و`scan` و`status`'
title: CLI النماذج
x-i18n:
    generated_at: "2026-04-23T07:24:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# CLI النماذج

راجع [/concepts/model-failover](/ar/concepts/model-failover) للاطلاع على
تدوير ملفات تعريف المصادقة، وفترات التهدئة، وكيفية تفاعل ذلك مع بدائل fallback.
وللحصول على نظرة سريعة على موفري الخدمة مع أمثلة: [/concepts/model-providers](/ar/concepts/model-providers).

## كيف يعمل اختيار النموذج

يختار OpenClaw النماذج بهذا الترتيب:

1. النموذج **الأساسي** (`agents.defaults.model.primary` أو `agents.defaults.model`).
2. بدائل **fallback** في `agents.defaults.model.fallbacks` (بالترتيب).
3. يحدث **التحويل عند فشل مصادقة provider** داخل provider نفسه قبل الانتقال إلى
   النموذج التالي.

ذو صلة:

- `agents.defaults.models` هي قائمة السماح/الكتالوج للنماذج التي يمكن لـ OpenClaw استخدامها (بالإضافة إلى الأسماء المستعارة).
- يُستخدم `agents.defaults.imageModel` **فقط عندما** لا يستطيع النموذج الأساسي قبول الصور.
- يستخدم `agents.defaults.pdfModel` بواسطة أداة `pdf`. وإذا لم يُحدد، فإن الأداة
  تعود إلى `agents.defaults.imageModel`، ثم إلى
  النموذج المحلول الخاص بالجلسة/الافتراضي.
- يُستخدم `agents.defaults.imageGenerationModel` بواسطة القدرة المشتركة لتوليد الصور. وإذا لم يُحدد، فلا يزال بإمكان `image_generate` استنتاج قيمة provider افتراضية مدعومة بالمصادقة. وهو يجرّب أولًا provider الافتراضي الحالي، ثم بقية موفري توليد الصور المسجلين بترتيب معرّفات provider. وإذا ضبطت provider/model محددًا، فاضبط أيضًا مصادقة/API key لذلك الـ provider.
- يُستخدم `agents.defaults.musicGenerationModel` بواسطة القدرة المشتركة لتوليد الموسيقى. وإذا لم يُحدد، فلا يزال بإمكان `music_generate` استنتاج قيمة provider افتراضية مدعومة بالمصادقة. وهو يجرّب أولًا provider الافتراضي الحالي، ثم بقية موفري توليد الموسيقى المسجلين بترتيب معرّفات provider. وإذا ضبطت provider/model محددًا، فاضبط أيضًا مصادقة/API key لذلك الـ provider.
- يُستخدم `agents.defaults.videoGenerationModel` بواسطة القدرة المشتركة لتوليد الفيديو. وإذا لم يُحدد، فلا يزال بإمكان `video_generate` استنتاج قيمة provider افتراضية مدعومة بالمصادقة. وهو يجرّب أولًا provider الافتراضي الحالي، ثم بقية موفري توليد الفيديو المسجلين بترتيب معرّفات provider. وإذا ضبطت provider/model محددًا، فاضبط أيضًا مصادقة/API key لذلك الـ provider.
- يمكن للقيم الافتراضية لكل وكيل تجاوز `agents.defaults.model` عبر `agents.list[].model` بالإضافة إلى bindings (راجع [/concepts/multi-agent](/ar/concepts/multi-agent)).

## سياسة سريعة للنماذج

- اضبط النموذج الأساسي على أقوى نموذج من الجيل الأحدث متاح لك.
- استخدم بدائل fallback للمهام الحساسة للتكلفة/زمن الاستجابة ولمحادثات المخاطر المنخفضة.
- بالنسبة إلى الوكلاء الممكّنين بالأدوات أو المدخلات غير الموثوقة، تجنب طبقات النماذج الأقدم/الأضعف.

## الإعداد الأولي (موصى به)

إذا كنت لا تريد تحرير التكوين يدويًا، فشغّل الإعداد الأولي:

```bash
openclaw onboard
```

يمكنه إعداد النموذج + المصادقة لموفري الخدمة الشائعين، بما في ذلك **اشتراك
OpenAI Code (Codex)** (OAuth) و**Anthropic** (API key أو Claude CLI).

## مفاتيح التكوين (نظرة عامة)

- `agents.defaults.model.primary` و`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` و`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` و`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` و`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` و`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (قائمة السماح + الأسماء المستعارة + معلمات provider)
- `models.providers` (موفرو الخدمة المخصصون المكتوبون في `models.json`)

تُطبَّع مراجع النماذج إلى أحرف صغيرة. كما تُطبَّع الأسماء المستعارة لموفري الخدمة مثل `z.ai/*`
إلى `zai/*`.

توجد أمثلة على تكوين provider (بما في ذلك OpenCode) في
[/providers/opencode](/ar/providers/opencode).

### تعديلات آمنة على قائمة السماح

استخدم عمليات كتابة إضافية عند تحديث `agents.defaults.models` يدويًا:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

يحمي `openclaw config set` خرائط النماذج/موفري الخدمة من الاستبدال العرضي. ويُرفض
إسناد كائن عادي إلى `agents.defaults.models` أو `models.providers` أو
`models.providers.<id>.models` عندما يؤدي إلى إزالة إدخالات موجودة.
استخدم `--merge` للتغييرات الإضافية؛ واستخدم `--replace` فقط عندما ينبغي أن
تصبح القيمة المقدمة هي القيمة الكاملة للمسار المستهدف.

كما أن إعداد provider التفاعلي و`openclaw configure --section model` يدمجان
التحديدات المقيدة بالـ provider في قائمة السماح الحالية، لذلك فإن إضافة Codex
أو Ollama أو provider آخر لا تؤدي إلى إسقاط إدخالات النماذج غير المرتبطة.

## "Model is not allowed" (ولماذا تتوقف الردود)

إذا كان `agents.defaults.models` مضبوطًا، فإنه يصبح **قائمة السماح** للأمر `/model` ولتجاوزات
الجلسة. وعندما يختار المستخدم نموذجًا غير موجود في قائمة السماح تلك،
يعيد OpenClaw:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

يحدث هذا **قبل** إنشاء رد عادي، لذلك قد تشعر الرسالة
كما لو أنها "لم ترد". والحل هو أحد الأمور التالية:

- أضف النموذج إلى `agents.defaults.models`، أو
- امسح قائمة السماح (أزل `agents.defaults.models`)، أو
- اختر نموذجًا من `/model list`.

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

يمكنك تبديل النماذج للجلسة الحالية من دون إعادة التشغيل:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

ملاحظات:

- `/model` (و`/model list`) هو منتقٍ مضغوط ومرقّم (عائلة النموذج + موفرو الخدمة المتاحون).
- في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للـ provider والنموذج بالإضافة إلى خطوة Submit.
- يتوفر `/models add` افتراضيًا ويمكن تعطيله عبر `commands.modelsWrite=false`.
- عند تفعيله، يكون `/models add <provider> <modelId>` أسرع مسار؛ بينما يبدأ `/models add` المجرد تدفقًا موجّهًا يبدأ بالـ provider عندما يكون ذلك مدعومًا.
- بعد `/models add`، يصبح النموذج الجديد متاحًا في `/models` و`/model` من دون إعادة تشغيل Gateway.
- يختار `/model <#>` من ذلك المنتقي.
- يحفظ `/model` اختيار الجلسة الجديد فورًا.
- إذا كان الوكيل في وضع الخمول، فسيستخدم التشغيل التالي النموذج الجديد مباشرة.
- إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw علامة على التبديل الحي باعتباره معلقًا ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأداة أو مخرجات الرد قد بدأت بالفعل، فقد يبقى التبديل المعلق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
- `/model status` هو العرض التفصيلي (مرشحو المصادقة، وعند التكوين، `baseUrl` لنقطة نهاية provider + وضع `api`).
- تُحلَّل مراجع النموذج عبر التقسيم عند **أول** `/`. استخدم `provider/model` عند كتابة `/model <ref>`.
- إذا كان معرّف النموذج نفسه يحتوي على `/` (بنمط OpenRouter)، فيجب تضمين بادئة provider (مثال: `/model openrouter/moonshotai/kimi-k2`).
- إذا حذفت provider، فسيحل OpenClaw الإدخال بهذا الترتيب:
  1. مطابقة الاسم المستعار
  2. مطابقة فريدة للـ provider المُكوَّن لذلك معرّف النموذج غير المسبوق ببادئة
  3. fallback قديم إلى provider الافتراضي المُكوَّن
     وإذا لم يعد ذلك الـ provider يوفّر النموذج الافتراضي المُكوَّن، فسيعود OpenClaw
     بدلًا من ذلك إلى أول provider/model مُكوَّن لتجنب
     إظهار قيمة افتراضية قديمة لprovider تمت إزالته.

السلوك/التكوين الكامل للأمر: [أوامر Slash](/ar/tools/slash-commands).

أمثلة:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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

يمثل `openclaw models` (من دون أمر فرعي) اختصارًا لـ `models status`.

### `models list`

يعرض النماذج المُكوَّنة افتراضيًا. إشارات مفيدة:

- `--all`: الكتالوج الكامل
- `--local`: موفرو الخدمة المحليون فقط
- `--provider <id>`: التصفية حسب معرّف provider، مثل `moonshot`؛ ولا تُقبل
  تسميات العرض من المنتقيات التفاعلية
- `--plain`: نموذج واحد في كل سطر
- `--json`: مخرجات قابلة للقراءة آليًا

يتضمن `--all` صفوف الكتالوج الثابتة المملوكة للـ provider والمضمّنة قبل
ضبط المصادقة، بحيث يمكن لعروض الاكتشاف فقط أن تعرض نماذج غير متاحة حتى
تضيف بيانات اعتماد provider المطابقة.

### `models status`

يعرض النموذج الأساسي المحلول، وبدائل fallback، ونموذج الصور، ونظرة عامة على المصادقة
لموفري الخدمة المُكوَّنين. كما يعرض حالة انتهاء OAuth لملفات التعريف الموجودة
في مخزن المصادقة (ويحذر خلال 24 ساعة افتراضيًا). ويطبع `--plain` فقط
النموذج الأساسي المحلول.
تُعرض حالة OAuth دائمًا (وتُضمَّن في مخرجات `--json`). وإذا كان provider مُكوَّنًا
لا يملك بيانات اعتماد، فإن `models status` يطبع قسم **Missing auth**.
ويتضمن JSON كلًا من `auth.oauth` (نافذة التحذير + ملفات التعريف) و`auth.providers`
(المصادقة الفعالة لكل provider، بما في ذلك بيانات الاعتماد المدعومة بـ env). ويقتصر `auth.oauth`
على صحة ملف تعريف مخزن المصادقة فقط؛ ولا تظهر موفرو الخدمة الذين يعتمدون على env فقط هناك.
استخدم `--check` للأتمتة (رمز الخروج `1` عند الفقدان/الانتهاء، و`2` عند قرب الانتهاء).
واستخدم `--probe` لفحوصات المصادقة الحية؛ وقد تأتي صفوف probe من ملفات تعريف المصادقة، أو بيانات اعتماد env،
أو `models.json`.
إذا كان `auth.order.<provider>` الصريح يستبعد ملف تعريف مخزنًا، فإن probe يبلغ
عن `excluded_by_auth_order` بدلًا من محاولة استخدامه. وإذا وجدت مصادقة لكن تعذر حل
نموذج قابل للفحص لذلك الـ provider، فإن probe يبلغ عن `status: no_model`.

يعتمد اختيار المصادقة على provider/الحساب. وبالنسبة إلى مضيفي Gateway الدائمين،
تكون API keys عادةً الأكثر قابلية للتنبؤ؛ كما أن إعادة استخدام Claude CLI وملفات تعريف Anthropic
OAuth/token الموجودة مدعومة أيضًا.

مثال (Claude CLI):

```bash
claude auth login
openclaw models status
```

## الفحص (نماذج OpenRouter المجانية)

يفحص `openclaw models scan` **كتالوج النماذج المجانية** لـ OpenRouter ويمكنه
اختياريًا إجراء probes للنماذج للتحقق من دعم الأدوات والصور.

الإشارات الرئيسية:

- `--no-probe`: تخطَّ probes الحية (بيانات وصفية فقط)
- `--min-params <b>`: الحد الأدنى لحجم المعلمات (بالمليارات)
- `--max-age-days <days>`: تخطَّ النماذج الأقدم
- `--provider <name>`: مرشح بادئة provider
- `--max-candidates <n>`: حجم قائمة fallback
- `--set-default`: اضبط `agents.defaults.model.primary` على أول اختيار
- `--set-image`: اضبط `agents.defaults.imageModel.primary` على أول اختيار صورة

تتطلب عملية الفحص وجود OpenRouter API key (من ملفات تعريف المصادقة أو
`OPENROUTER_API_KEY`). ومن دون مفتاح، استخدم `--no-probe` لسرد المرشحين فقط.

تُرتب نتائج الفحص بحسب:

1. دعم الصور
2. زمن استجابة الأدوات
3. حجم السياق
4. عدد المعلمات

المدخلات

- قائمة OpenRouter `/models` (مرشح `:free`)
- تتطلب OpenRouter API key من ملفات تعريف المصادقة أو `OPENROUTER_API_KEY` (راجع [/environment](/ar/help/environment))
- مرشحات اختيارية: `--max-age-days` و`--min-params` و`--provider` و`--max-candidates`
- عناصر التحكم في probe: `--timeout` و`--concurrency`

عند التشغيل في TTY، يمكنك اختيار بدائل fallback تفاعليًا. وفي
الوضع غير التفاعلي، مرّر `--yes` لقبول القيم الافتراضية.

## سجل النماذج (`models.json`)

تُكتب موفرو الخدمة المخصصون في `models.providers` إلى `models.json` داخل
دليل الوكيل (الافتراضي `~/.openclaw/agents/<agentId>/agent/models.json`). ويُدمج هذا الملف
افتراضيًا ما لم يكن `models.mode` مضبوطًا على `replace`.

أولوية وضع الدمج عند تطابق معرّفات provider:

- تكون أولوية `baseUrl` غير الفارغ الموجود مسبقًا في `models.json` الخاص بالوكيل.
- تكون أولوية `apiKey` غير الفارغ في `models.json` الخاص بالوكيل فقط عندما لا يكون ذلك الـ provider مُدارًا بواسطة SecretRef في سياق التكوين/ملف تعريف المصادقة الحالي.
- تُحدَّث قيم `apiKey` الخاصة بالـ provider المُدار بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec) بدلًا من حفظ الأسرار المحلولة.
- تُحدَّث قيم header الخاصة بالـ provider المُدار بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع env، و`secretref-managed` لمراجع file/exec).
- تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى التكوين `models.providers`.
- تُحدَّث حقول provider الأخرى من التكوين وبيانات الكتالوج المطبعّة.

إن حفظ العلامات مرجعه المصدر: يكتب OpenClaw العلامات من لقطة التكوين المصدرية النشطة (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحلولة.
وينطبق هذا كلما أعاد OpenClaw توليد `models.json`، بما في ذلك المسارات المدفوعة بالأوامر مثل `openclaw agent`.

## ذو صلة

- [موفرو النماذج](/ar/concepts/model-providers) — توجيه provider والمصادقة
- [تجاوز فشل النموذج](/ar/concepts/model-failover) — سلاسل fallback
- [توليد الصور](/ar/tools/image-generation) — تكوين نموذج الصور
- [توليد الموسيقى](/ar/tools/music-generation) — تكوين نموذج الموسيقى
- [توليد الفيديو](/ar/tools/video-generation) — تكوين نموذج الفيديو
- [مرجع التكوين](/ar/gateway/configuration-reference#agent-defaults) — مفاتيح تكوين النموذج
