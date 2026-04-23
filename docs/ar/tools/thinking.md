---
read_when:
    - تعديل التفكير أو وضع fast أو تحليل توجيهات verbose أو قيمها الافتراضية
summary: صياغة التوجيهات لأوامر `/think` و`/fast` و`/verbose` و`/trace` وظهور reasoning
title: مستويات التفكير
x-i18n:
    generated_at: "2026-04-23T07:34:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66033bb9272c9b9ea8fc85dc91e33e95ce4c469c56a8cd10c19632a5aa8a2338
    source_path: tools/thinking.md
    workflow: 15
---

# مستويات التفكير (توجيهات `/think`)

## ما الذي تفعله

- توجيه مضمّن داخل أي متن وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (والأسماء المستعارة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (الحد الأقصى للميزانية)
  - xhigh → "ultrathink+" (لنماذج GPT-5.2 + Codex ومستوى الجهد في Anthropic Claude Opus 4.7)
  - adaptive → تفكير تكيفي يديره المزوّد (مدعوم لـ Claude 4.6 على Anthropic/Bedrock وAnthropic Claude Opus 4.7)
  - max → reasoning بأقصى درجة لدى المزوّد (حاليًا Anthropic Claude Opus 4.7)
  - تُطابق `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` القيمة `xhigh`.
  - تُطابق `highest` القيمة `high`.
- ملاحظات المزوّد:
  - تستند قوائم ومستخرجات التفكير إلى ملف تعريف المزوّد. وتعلن Plugins الخاصة بالمزوّد مجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل `on` الثنائية.
  - لا يتم الإعلان عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف المزوّد/النموذج التي تدعمها. وتُرفض التوجيهات المكتوبة للمستويات غير المدعومة مع إظهار الخيارات الصحيحة لذلك النموذج.
  - تُعاد مطابقة المستويات غير المدعومة المخزنة سابقًا حسب رتبة ملف تعريف المزوّد. تعود `adaptive` إلى `medium` في النماذج غير التكيفية، بينما تعود `xhigh` و`max` إلى أعلى مستوى مدعوم غير `off` للنموذج المحدد.
  - تستخدم نماذج Anthropic Claude 4.6 افتراضيًا القيمة `adaptive` عندما لا يتم ضبط مستوى thinking صريح.
  - لا يستخدم Anthropic Claude Opus 4.7 التفكير التكيفي افتراضيًا. ويظل الجهد الافتراضي في API مملوكًا للمزوّد ما لم تضبط مستوى thinking صريحًا.
  - يطابق Anthropic Claude Opus 4.7 الأمر `/think xhigh` مع التفكير التكيفي إضافة إلى `output_config.effort: "xhigh"`، لأن `/think` هو توجيه thinking و`xhigh` هو إعداد الجهد في Opus 4.7.
  - كما يكشف Anthropic Claude Opus 4.7 أيضًا عن `/think max`؛ وهو يطابق مسار أقصى جهد مملوك للمزوّد نفسه.
  - تطابق نماذج OpenAI GPT الأمر `/think` عبر دعم `reasoning.effort` الخاص بـ Responses API حسب النموذج. ويرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج المستهدف؛ وإلا يحذف OpenClaw حمولة تعطيل reasoning بدلًا من إرسال قيمة غير مدعومة.
  - تستخدم MiniMax (`minimax/*`) على مسار البث المتوافق مع Anthropic افتراضيًا `thinking: { type: "disabled" }` ما لم تضبط thinking صراحةً في params الخاصة بالنموذج أو الطلب. وهذا يتجنب تسرّب دلتا `reasoning_content` من صيغة بث Anthropic غير الأصلية لدى MiniMax.
  - تدعم Z.AI (`zai/*`) فقط التفكير الثنائي (`on`/`off`). ويُعامل أي مستوى غير `off` على أنه `on` (ويُطابق `low`).
  - تطابق Moonshot (`moonshot/*`) الأمر `/think off` مع `thinking: { type: "disabled" }`، وأي مستوى غير `off` مع `thinking: { type: "enabled" }`. وعندما يكون التفكير مفعّلًا، لا تقبل Moonshot إلا `tool_choice` من النوع `auto|none`؛ ويقوم OpenClaw بتطبيع القيم غير المتوافقة إلى `auto`.

## ترتيب الحسم

1. التوجيه المضمّن داخل الرسالة (يُطبّق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُضبط بإرسال رسالة تحتوي على التوجيه فقط).
3. الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في التهيئة).
4. الافتراضي العام (`agents.defaults.thinkingDefault` في التهيئة).
5. الرجوع الاحتياطي: الافتراضي المعلن من المزوّد عند التوفر، و`low` لبقية نماذج الكتالوج المعلَّمة بأنها قادرة على reasoning، و`off` خلاف ذلك.

## ضبط افتراضي للجلسة

- أرسل رسالة تكون **فقط** التوجيه (مع السماح بالمسافات)، مثل `/think:medium` أو `/t high`.
- يظل ذلك مثبتًا للجلسة الحالية (لكل مرسل افتراضيًا)؛ ويُزال بواسطة `/think:off` أو إعادة تعيين خمول الجلسة.
- يتم إرسال رد تأكيد (`Thinking level set to high.` / `Thinking disabled.`). وإذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتبقى حالة الجلسة من دون تغيير.
- أرسل `/think` (أو `/think:`) من دون وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق بحسب الوكيل

- **Embedded Pi**: يتم تمرير المستوى المحسوم إلى وقت تشغيل Pi المضمّن داخل العملية.

## وضع Fast (`/fast`)

- المستويات: `on|off`.
- تبدّل الرسالة التي تحتوي فقط على التوجيه تجاوز fast-mode للجلسة وترد بـ `Fast mode enabled.` / `Fast mode disabled.`.
- أرسل `/fast` (أو `/fast status`) من دون وضع لرؤية حالة fast-mode الفعلية الحالية.
- يحسم OpenClaw وضع fast بهذا الترتيب:
  1. التوجيه المضمّن/الخاص بالرسالة فقط `/fast on|off`
  2. تجاوز الجلسة
  3. الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. تهيئة كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. الرجوع الاحتياطي: `off`
- بالنسبة إلى `openai/*`، يطابق وضع fast المعالجة ذات الأولوية في OpenAI بإرسال `service_tier=priority` على طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل وضع fast الإشارة نفسها `service_tier=priority` على Codex Responses. ويحافظ OpenClaw على مفتاح `/fast` مشترك واحد عبر مساري المصادقة.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك الحركة المرسلة بمصادقة OAuth إلى `api.anthropic.com`، يطابق وضع fast مستويات خدمة Anthropic: يؤدي `/fast on` إلى ضبط `service_tier=auto`، ويؤدي `/fast off` إلى ضبط `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتقدم params الصريحة `serviceTier` / `service_tier` الخاصة بـ Anthropic على القيمة الافتراضية لوضع fast عندما يتم ضبط الاثنين معًا. ومع ذلك، لا يزال OpenClaw يتخطى حقن مستوى الخدمة الخاص بـ Anthropic لعناوين URL الأساسية غير التابعة لـ Anthropic.
- يعرض `/status` القيمة `Fast` فقط عندما يكون وضع fast مفعّلًا.

## توجيهات Verbose (`/verbose` أو `/v`)

- المستويات: `on` (حد أدنى) | `full` | `off` (الافتراضي).
- تبدّل الرسالة التي تحتوي فقط على التوجيه verbose الخاصة بالجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ وتعيد المستويات غير الصالحة تلميحًا من دون تغيير الحالة.
- يخزن `/verbose off` تجاوزًا صريحًا للجلسة؛ ويمكنك مسحه عبر واجهة Sessions UI باختيار `inherit`.
- يؤثر التوجيه المضمّن فقط في تلك الرسالة؛ وتُطبق الافتراضيات على مستوى الجلسة/العالمية في غير ذلك.
- أرسل `/verbose` (أو `/verbose:`) من دون وسيطة لرؤية مستوى verbose الحالي.
- عندما تكون verbose مفعّلة، ترسل الوكلاء التي تصدر نتائج أدوات منظّمة (Pi، ووكلاء JSON الآخرون) كل استدعاء أداة مرة أخرى كرسالة مستقلة للبيانات الوصفية فقط، وتبدأ بـ `<emoji> <tool-name>: <arg>` عندما يكون ذلك متاحًا (المسار/الأمر). وتُرسل هذه الملخصات الخاصة بالأدوات بمجرد بدء كل أداة (فقاعات منفصلة)، وليس كتدفّقات delta.
- تظل ملخصات إخفاق الأدوات مرئية في الوضع العادي، لكن لواحق تفاصيل الأخطاء الخام تُخفى ما لم تكن verbose مساوية لـ `on` أو `full`.
- عندما تكون verbose مساوية لـ `full`، تُمرر أيضًا مخرجات الأدوات بعد الاكتمال (فقاعة منفصلة، مقطوعة إلى طول آمن). وإذا بدّلت `/verbose on|full|off` أثناء تشغيل جارٍ، فإن فقاعات الأدوات اللاحقة ستحترم الإعداد الجديد.

## توجيهات تتبع Plugin (`/trace`)

- المستويات: `on` | `off` (الافتراضي).
- تبدّل الرسالة التي تحتوي فقط على التوجيه مخرجات تتبع Plugin الخاصة بالجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمّن فقط في تلك الرسالة؛ وتُطبق الافتراضيات على مستوى الجلسة/العالمية في غير ذلك.
- أرسل `/trace` (أو `/trace:`) من دون وسيطة لرؤية مستوى التتبع الحالي.
- يُعد `/trace` أضيق من `/verbose`: فهو يكشف فقط عن أسطر trace/debug المملوكة لـ Plugin مثل ملخصات debug الخاصة بـ Active Memory.
- يمكن أن تظهر أسطر التتبع في `/status` وكـ رسالة تشخيص متابعة بعد رد المساعد العادي.

## ظهور Reasoning (`/reasoning`)

- المستويات: `on|off|stream`.
- تبدّل الرسالة التي تحتوي فقط على التوجيه ما إذا كانت كتل التفكير ستُعرض في الردود.
- عند التمكين، تُرسل reasoning كـ **رسالة منفصلة** تبدأ بـ `Reasoning:`.
- `stream` (Telegram فقط): يبث reasoning داخل فقاعة المسودة في Telegram أثناء توليد الرد، ثم يرسل الإجابة النهائية من دون reasoning.
- الاسم المستعار: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) من دون وسيطة لرؤية مستوى reasoning الحالي.
- ترتيب الحسم: التوجيه المضمّن، ثم تجاوز الجلسة، ثم الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الرجوع الاحتياطي (`off`).

## ذو صلة

- توجد وثائق الوضع المرتفع في [Elevated mode](/ar/tools/elevated).

## Heartbeats

- يكون متن Heartbeat probe هو prompt الخاصة بـ heartbeat المهيأة (الافتراضي: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). وتُطبق التوجيهات المضمّنة في رسالة heartbeat كالمعتاد (لكن تجنب تغيير افتراضيات الجلسة من heartbeats).
- يستخدم تسليم Heartbeat افتراضيًا الحمولة النهائية فقط. ولإرسال الرسالة المنفصلة `Reasoning:` أيضًا (عند التوفر)، اضبط `agents.defaults.heartbeat.includeReasoning: true` أو `agents.list[].heartbeat.includeReasoning: true` لكل وكيل.

## واجهة دردشة الويب

- يعكس محدد thinking في دردشة الويب المستوى المخزن للجلسة من مخزن/تهيئة الجلسة الواردة عند تحميل الصفحة.
- يؤدي اختيار مستوى آخر إلى كتابة تجاوز الجلسة فورًا عبر `sessions.patch`؛ ولا ينتظر الإرسال التالي كما أنه ليس تجاوز `thinkingOnce` لمرة واحدة.
- يكون الخيار الأول دائمًا `Default (<resolved level>)`، حيث تأتي القيمة الافتراضية المحسومة من ملف تعريف thinking الخاص بالمزوّد للنموذج النشط في الجلسة.
- يستخدم المحدد `thinkingOptions` التي يعيدها صف جلسة gateway. ولا تحتفظ واجهة المتصفح بقائمة regex خاصة بها للمزوّدات؛ إذ تمتلك Plugins مجموعات المستويات الخاصة بكل نموذج.
- لا يزال `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزن نفسه، لذلك تظل توجيهات الدردشة والمحدد متزامنين.

## ملفات تعريف المزوّد

- يمكن لـ Plugins الخاصة بالمزوّد كشف `resolveThinkingProfile(ctx)` لتعريف المستويات الافتراضية والمدعومة للنموذج.
- يملك كل مستوى في ملف التعريف `id` أساسيًا مخزنًا (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `xhigh` أو `adaptive` أو `max`) ويمكن أن يتضمن `label` للعرض. وتستخدم المزوّدات الثنائية `{ id: "low", label: "on" }`.
- تظل الخطافات القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) موجودة كمحوّلات توافق، لكن مجموعات المستويات المخصصة الجديدة يجب أن تستخدم `resolveThinkingProfile`.
- تكشف صفوف Gateway عن `thinkingOptions` و`thinkingDefault` بحيث تعرض عملاء ACP/chat ملف التعريف نفسه الذي يستخدمه التحقق وقت التشغيل.
