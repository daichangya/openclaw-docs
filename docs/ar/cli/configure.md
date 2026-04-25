---
read_when:
    - أنت تريد تعديل بيانات الاعتماد، أو الأجهزة، أو الإعدادات الافتراضية للوكيل بشكل تفاعلي
summary: مرجع CLI لـ `openclaw configure` (مطالبات الإعداد التفاعلية)
title: الإعدادات
x-i18n:
    generated_at: "2026-04-25T13:43:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

مطالبة تفاعلية لإعداد بيانات الاعتماد، والأجهزة، والإعدادات الافتراضية للوكيل.

ملاحظة: يتضمن قسم **Model** الآن تحديدًا متعددًا لقائمة السماح
`agents.defaults.models` (ما يظهر في `/model` وأداة اختيار النموذج).
تقوم خيارات الإعداد ذات النطاق الخاص بالمزوّد بدمج النماذج المحددة في
قائمة السماح الحالية بدلًا من استبدال المزوّدين غير المرتبطين الموجودين بالفعل
في الإعدادات.
إن إعادة تشغيل مصادقة المزوّد من خلال configure تحافظ على
`agents.defaults.model.primary` الموجود؛ استخدم `openclaw models auth login --provider <id> --set-default`
أو `openclaw models set <model>` عندما تريد عمدًا تغيير النموذج الافتراضي.

عندما يبدأ configure من خيار مصادقة مزوّد، فإن أداة اختيار النموذج الافتراضي
وقائمة السماح تفضّلان ذلك المزوّد تلقائيًا. وبالنسبة إلى المزوّدين المقترنين مثل
Volcengine/BytePlus، فإن التفضيل نفسه يطابق أيضًا متغيرات
coding-plan الخاصة بهما (`volcengine-plan/*`، `byteplus-plan/*`). وإذا كان
عامل تصفية المزوّد المفضّل سيؤدي إلى قائمة فارغة، فإن configure يعود إلى
الفهرس غير المفلتر بدلًا من عرض أداة اختيار فارغة.

نصيحة: يفتح `openclaw config` بدون أمر فرعي المعالج نفسه. استخدم
`openclaw config get|set|unset` للتعديلات غير التفاعلية.

بالنسبة إلى البحث على الويب، يتيح لك `openclaw configure --section web` اختيار مزوّد
وضبط بيانات اعتماده. كما تعرض بعض المزوّدات مطالبات متابعة خاصة بها:

- يمكن لـ **Grok** أن يقدّم إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY` نفسه
  ويتيح لك اختيار نموذج `x_search`.
- يمكن لـ **Kimi** أن يطلب منطقة Moonshot API (`api.moonshot.ai` مقابل
  `api.moonshot.cn`) ونموذج البحث على الويب الافتراضي لـ Kimi.

ذو صلة:

- مرجع إعدادات Gateway: [الإعدادات](/ar/gateway/configuration)
- CLI الخاص بالإعدادات: [Config](/ar/cli/config)

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

- يؤدي اختيار مكان تشغيل Gateway دائمًا إلى تحديث `gateway.mode`. يمكنك اختيار "متابعة" بدون أقسام أخرى إذا كان هذا كل ما تحتاجه.
- تطلب الخدمات الموجّهة للقنوات (Slack/Discord/Matrix/Microsoft Teams) قوائم سماح للقنوات/الغرف أثناء الإعداد. يمكنك إدخال أسماء أو معرّفات؛ وسيقوم المعالج بحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا.
- إذا شغّلت خطوة تثبيت daemon، وكانت مصادقة الرمز المميز تتطلب رمزًا مميزًا، وكانت `gateway.auth.token` مُدارة عبر SecretRef، فإن configure يتحقق من SecretRef لكنه لا يحفظ قيم الرمز المميز النصية المحلولة في بيانات البيئة الخاصة بخدمة supervisor.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا مميزًا وكان SecretRef الخاص بالرمز المميز المضبوط غير محلول، فإن configure يمنع تثبيت daemon مع إرشادات معالجة عملية.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكانت `gateway.auth.mode` غير مضبوطة، فإن configure يمنع تثبيت daemon حتى يتم ضبط الوضع صراحةً.

## أمثلة

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعدادات](/ar/gateway/configuration)
