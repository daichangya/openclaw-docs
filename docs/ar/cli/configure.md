---
read_when:
    - تريد تعديل بيانات الاعتماد أو الأجهزة أو الإعدادات الافتراضية للوكيل بشكل تفاعلي
summary: مرجع CLI لـ `openclaw configure` (مطالبات الإعداد التفاعلية)
title: إعداد
x-i18n:
    generated_at: "2026-04-23T07:21:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

مطالبة تفاعلية لإعداد بيانات الاعتماد والأجهزة والإعدادات الافتراضية للوكيل.

ملاحظة: يتضمن قسم **Model** الآن اختيارًا متعددًا لقائمة السماح
`agents.defaults.models` (ما يظهر في `/model` وفي منتقي النماذج).
تدمج اختيارات الإعداد المحصورة بالمزوّد النماذج المحددة ضمن
قائمة السماح الحالية بدلًا من استبدال المزوّدين غير المرتبطين الموجودين
سابقًا في الإعداد.

عندما يبدأ configure من خيار مصادقة مزوّد، فإن منتقي النموذج الافتراضي
وقائمة السماح يفضّلان ذلك المزوّد تلقائيًا. وبالنسبة إلى المزوّدين المقترنين
مثل Volcengine/BytePlus، فإن هذا التفضيل نفسه يطابق أيضًا متغيرات
خطة البرمجة الخاصة بهما (`volcengine-plan/*` و`byteplus-plan/*`). وإذا
أنتج عامل التصفية الخاص بالمزوّد المفضّل قائمة فارغة، فإن configure يعود إلى
الفهرس غير المصفّى بدلًا من عرض منتقٍ فارغ.

نصيحة: يفتح `openclaw config` من دون أمر فرعي المعالج نفسه. استخدم
`openclaw config get|set|unset` لإجراء تعديلات غير تفاعلية.

بالنسبة إلى البحث على الويب، يتيح لك `openclaw configure --section web` اختيار مزوّد
وإعداد بيانات اعتماده. كما تعرض بعض المزوّدات أيضًا مطالبات متابعة
خاصة بالمزوّد:

- يمكن أن يوفّر **Grok** إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY` نفسه،
  ويتيح لك اختيار نموذج `x_search`.
- يمكن أن يطلب **Kimi** منطقة Moonshot API ‏(`api.moonshot.ai` مقابل
  `api.moonshot.cn`) ونموذج البحث على الويب الافتراضي لـ Kimi.

ذو صلة:

- مرجع إعداد Gateway: [الإعداد](/ar/gateway/configuration)
- CLI الخاص بالإعداد: [Config](/ar/cli/config)

## الخيارات

- `--section <section>`: عامل تصفية أقسام قابل للتكرار

الأقسام المتاحة:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

ملاحظات:

- يؤدي اختيار مكان تشغيل Gateway دائمًا إلى تحديث `gateway.mode`. يمكنك تحديد "متابعة" من دون أقسام أخرى إذا كان هذا كل ما تحتاجه.
- تطلب الخدمات الموجّهة إلى القنوات (Slack/Discord/Matrix/Microsoft Teams) قوائم سماح القنوات/الغرف أثناء الإعداد. يمكنك إدخال الأسماء أو المعرّفات؛ ويحاول المعالج تحويل الأسماء إلى معرّفات عند الإمكان.
- إذا شغّلت خطوة تثبيت daemon، فإن المصادقة بالرمز تتطلب رمزًا، وإذا كانت `gateway.auth.token` مُدارة عبر SecretRef، فإن configure يتحقق من SecretRef لكنه لا يحفظ قيم الرموز النصية الصريحة التي تم حلّها ضمن بيانات تعريف بيئة خدمة المشرف.
- إذا كانت المصادقة بالرمز تتطلب رمزًا وكان SecretRef المضبوط للرمز غير محلول، فإن configure يمنع تثبيت daemon مع إرشادات معالجة عملية.
- إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مضبوطتين وكانت `gateway.auth.mode` غير مضبوطة، فإن configure يمنع تثبيت daemon إلى أن يتم ضبط الوضع صراحةً.

## أمثلة

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
