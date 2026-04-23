---
read_when:
    - ضبط التفكير، أو وضع السرعة، أو تحليل التوجيه verbose أو القيم الافتراضية الخاصة به
summary: بنية التوجيه لأوامر `/think` و`/fast` و`/verbose` و`/trace` وظهور الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-04-23T14:03:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# مستويات التفكير (`/think` directives)

## ما الذي يفعله

- توجيه مضمّن داخل أي نص وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (الأسماء المستعارة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal ← “think”
  - low ← “think hard”
  - medium ← “think harder”
  - high ← “ultrathink” (الحد الأقصى للميزانية)
  - xhigh ← “ultrathink+” (جهد GPT-5.2 + نماذج Codex وAnthropic Claude Opus 4.7)
  - adaptive ← التفكير التكيفي المُدار من Provider (مدعوم لـ Claude 4.6 على Anthropic/Bedrock وAnthropic Claude Opus 4.7)
  - max ← أقصى استدلال لدى Provider (حاليًا Anthropic Claude Opus 4.7)
  - يتم تعيين `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` إلى `xhigh`.
  - يتم تعيين `highest` إلى `high`.
- ملاحظات خاصة بالـ Provider:
  - تُدار قوائم ومنتقيات التفكير بواسطة ملفات تعريف Provider. وتصرّح Plugins الخاصة بالـ Provider بمجموعة المستويات الدقيقة للنموذج المحدد، بما في ذلك تسميات مثل `on` الثنائية.
  - لا يتم الإعلان عن `adaptive` و`xhigh` و`max` إلا لملفات تعريف Provider/النموذج التي تدعمها. وتُرفض التوجيهات المكتوبة لمستويات غير مدعومة مع عرض الخيارات الصالحة لذلك النموذج.
  - تُعاد تسوية المستويات غير المدعومة المخزنة مسبقًا حسب رتبة ملف تعريف Provider. ويرجع `adaptive` إلى `medium` على النماذج غير التكيفية، بينما يرجع `xhigh` و`max` إلى أعلى مستوى مدعوم غير `off` للنموذج المحدد.
  - تستخدم نماذج Anthropic Claude 4.6 افتراضيًا `adaptive` عندما لا يكون هناك مستوى تفكير صريح معيّن.
  - لا يستخدم Anthropic Claude Opus 4.7 التفكير التكيفي افتراضيًا. وتظل القيمة الافتراضية لجهد API مملوكة للـ Provider ما لم تعيّن مستوى تفكير صريحًا.
  - يربط Anthropic Claude Opus 4.7 ‏`/think xhigh` بالتفكير التكيفي مع `output_config.effort: "xhigh"`، لأن `/think` هو توجيه تفكير و`xhigh` هو إعداد الجهد في Opus 4.7.
  - يوفّر Anthropic Claude Opus 4.7 أيضًا `/think max`؛ وهو يُربط بالمسار نفسه لأقصى جهد مملوك للـ Provider.
  - تربط نماذج OpenAI GPT ‏`/think` عبر دعم Responses API الخاص بالجهد حسب النموذج. ويرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج الهدف؛ وإلا فإن OpenClaw يحذف حمولة تعطيل الاستدلال بدلًا من إرسال قيمة غير مدعومة.
  - يستخدم MiniMax ‏(`minimax/*`) على مسار البث المتوافق مع Anthropic افتراضيًا `thinking: { type: "disabled" }` ما لم تعيّن التفكير صراحةً في params الخاصة بالنموذج أو params الخاصة بالطلب. ويمنع هذا تسرب فروق `reasoning_content` من تنسيق بث Anthropic غير الأصلي لدى MiniMax.
  - يدعم Z.AI ‏(`zai/*`) التفكير الثنائي فقط (`on`/`off`). ويُعامل أي مستوى غير `off` على أنه `on` (ويُربط بـ `low`).
  - يربط Moonshot ‏(`moonshot/*`) الأمر `/think off` إلى `thinking: { type: "disabled" }` وأي مستوى غير `off` إلى `thinking: { type: "enabled" }`. وعندما يكون التفكير مفعّلًا، لا يقبل Moonshot إلا `tool_choice` بالقيم `auto|none`؛ ويقوم OpenClaw بتسوية القيم غير المتوافقة إلى `auto`.

## ترتيب الحسم

1. التوجيه المضمّن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُضبط بإرسال رسالة تحتوي على التوجيه فقط).
3. الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في التكوين).
4. الافتراضي العام (`agents.defaults.thinkingDefault` في التكوين).
5. الرجوع: القيمة الافتراضية المصرّح بها من Provider عند توفرها؛ وإلا فإن النماذج القادرة على الاستدلال تُحسم إلى `medium` أو أقرب مستوى مدعوم غير `off` لذلك النموذج، بينما تظل النماذج غير الاستدلالية على `off`.

## تعيين افتراضي للجلسة

- أرسل رسالة تكون **فقط** هي التوجيه (مع السماح بالمسافات)، مثل `/think:medium` أو `/t high`.
- يظل هذا ثابتًا للجلسة الحالية (لكل مرسل افتراضيًا)؛ ويُمسح بواسطة `/think:off` أو بإعادة تعيين خمول الجلسة.
- يتم إرسال رد تأكيد (`Thinking level set to high.` / `Thinking disabled.`). وإذا كان المستوى غير صالح (مثل `/thinking big`) فسيُرفض الأمر مع تلميح وتبقى حالة الجلسة دون تغيير.
- أرسل `/think` (أو `/think:`) بدون وسيطة لمعرفة مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **Pi المضمّن**: يتم تمرير المستوى المحسوم إلى وقت تشغيل وكيل Pi داخل العملية.

## وضع السرعة (`/fast`)

- المستويات: `on|off`.
- تؤدي الرسالة التي تحتوي على التوجيه فقط إلى تبديل تجاوز وضع السرعة في الجلسة والرد بـ `Fast mode enabled.` / `Fast mode disabled.`.
- أرسل `/fast` (أو `/fast status`) بدون وضع لمعرفة حالة وضع السرعة الفعلية الحالية.
- يحسم OpenClaw وضع السرعة بهذا الترتيب:
  1. ‏`/fast on|off` المضمّن/التوجيه فقط
  2. تجاوز الجلسة
  3. الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. تكوين كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. الرجوع: `off`
- بالنسبة إلى `openai/*`، يُربط وضع السرعة بمعالجة OpenAI ذات الأولوية عبر إرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل وضع السرعة علم `service_tier=priority` نفسه على Codex Responses. ويحافظ OpenClaw على مفتاح `/fast` مشترك واحد عبر مساري المصادقة كليهما.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك الحركة الموثقة عبر OAuth المرسلة إلى `api.anthropic.com`، يُربط وضع السرعة بطبقات خدمة Anthropic: يؤدي `/fast on` إلى تعيين `service_tier=auto`، ويؤدي `/fast off` إلى تعيين `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` (أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز params الصريحة لـ Anthropic ‏`serviceTier` / `service_tier` الافتراضي الخاص بوضع السرعة عند تعيين كليهما. وما يزال OpenClaw يتجاوز حقن طبقة خدمة Anthropic لعناوين base URL الوكيلة غير التابعة لـ Anthropic.
- يعرض `/status` كلمة `Fast` فقط عندما يكون وضع السرعة مفعّلًا.

## توجيهات verbose ‏(`/verbose` أو `/v`)

- المستويات: `on` (حد أدنى) | `full` | `off` (الافتراضي).
- تؤدي الرسالة التي تحتوي على التوجيه فقط إلى تبديل verbose للجلسة والرد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ وتعيد المستويات غير الصالحة تلميحًا من دون تغيير الحالة.
- يؤدي `/verbose off` إلى تخزين تجاوز صريح للجلسة؛ ويمكن مسحه عبر واجهة الجلسات باختيار `inherit`.
- يؤثر التوجيه المضمّن في تلك الرسالة فقط؛ وإلا فتُطبّق افتراضيات الجلسة/العامة.
- أرسل `/verbose` (أو `/verbose:`) بدون وسيطة لمعرفة مستوى verbose الحالي.
- عندما يكون verbose مفعّلًا، فإن الوكلاء الذين يخرجون نتائج أدوات مهيكلة (Pi، ووكلاء JSON الآخرون) يعيدون إرسال كل استدعاء أداة كرسالة مستقلة خاصة بالبيانات التعريفية فقط، مع بادئة `<emoji> <tool-name>: <arg>` عند توفرها (المسار/الأمر). تُرسل ملخصات الأدوات هذه فور بدء كل أداة (فقاعات منفصلة)، وليس كبث فروق.
- تظل ملخصات فشل الأدوات مرئية في الوضع العادي، لكن لاحقات تفاصيل الأخطاء الخام تُخفى ما لم يكن verbose هو `on` أو `full`.
- عندما يكون verbose هو `full`، تُمرر أيضًا مخرجات الأدوات بعد اكتمالها (فقاعة منفصلة، مع اقتطاع إلى طول آمن). وإذا بدّلت `/verbose on|full|off` أثناء وجود تشغيل جارٍ، فستحترم فقاعات الأدوات اللاحقة الإعداد الجديد.

## توجيهات تتبع Plugin ‏(`/trace`)

- المستويات: `on` | `off` (الافتراضي).
- تؤدي الرسالة التي تحتوي على التوجيه فقط إلى تبديل مخرجات تتبع Plugin للجلسة والرد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمّن في تلك الرسالة فقط؛ وإلا فتُطبّق افتراضيات الجلسة/العامة.
- أرسل `/trace` (أو `/trace:`) بدون وسيطة لمعرفة مستوى التتبع الحالي.
- يُعد `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة للـ Plugin مثل ملخصات تصحيح Active Memory.
- قد تظهر أسطر التتبع في `/status` وكَرسالة تشخيصية لاحقة بعد رد المساعد العادي.

## ظهور الاستدلال (`/reasoning`)

- المستويات: `on|off|stream`.
- تؤدي الرسالة التي تحتوي على التوجيه فقط إلى تبديل ما إذا كانت كتل التفكير ستُعرض في الردود.
- عند التمكين، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Reasoning:`.
- `stream` ‏(Telegram فقط): يبث الاستدلال داخل فقاعة مسودة Telegram أثناء إنشاء الرد، ثم يرسل الإجابة النهائية من دون الاستدلال.
- الاسم المستعار: `/reason`.
- أرسل `/reasoning` (أو `/reasoning:`) بدون وسيطة لمعرفة مستوى الاستدلال الحالي.
- ترتيب الحسم: التوجيه المضمّن، ثم تجاوز الجلسة، ثم الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الرجوع (`off`).

## ذو صلة

- توجد وثائق الوضع المرتفع في [Elevated mode](/ar/tools/elevated).

## Heartbeats

- نص فحص Heartbeat هو prompt الخاص بـ Heartbeat المكوَّن (الافتراضي: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). وتُطبَّق التوجيهات المضمّنة في رسالة Heartbeat كالمعتاد (لكن تجنب تغيير افتراضيات الجلسة من رسائل Heartbeat).
- يستخدم تسليم Heartbeat افتراضيًا الحمولة النهائية فقط. ولإرسال رسالة `Reasoning:` المنفصلة أيضًا (عند توفرها)، عيّن `agents.defaults.heartbeat.includeReasoning: true` أو لكل وكيل `agents.list[].heartbeat.includeReasoning: true`.

## واجهة دردشة الويب

- يعكس منتقي التفكير في دردشة الويب المستوى المخزن للجلسة من مخزن/تكوين الجلسة الواردة عند تحميل الصفحة.
- يؤدي اختيار مستوى آخر إلى كتابة تجاوز الجلسة فورًا عبر `sessions.patch`؛ ولا ينتظر الإرسال التالي وليس تجاوزًا لمرة واحدة `thinkingOnce`.
- يكون الخيار الأول دائمًا `Default (<resolved level>)`، حيث تأتي القيمة الافتراضية المحسومة من ملف تعريف التفكير الخاص بـ Provider للنموذج النشط في الجلسة إضافةً إلى منطق الرجوع نفسه الذي يستخدمه `/status` و`session_status`.
- يستخدم المنتقي `thinkingOptions` المُعادة من صف جلسة Gateway. ولا تحتفظ واجهة المتصفح بقائمة Regex خاصة بها للـ Provider؛ إذ تمتلك Plugins مجموعات المستويات الخاصة بالنموذج.
- ما يزال `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزن نفسه، بحيث تظل توجيهات الدردشة والمنتقي متزامنين.

## ملفات تعريف Provider

- يمكن لـ Plugins الخاصة بالـ Provider كشف `resolveThinkingProfile(ctx)` لتعريف المستويات الافتراضية والمدعومة للنموذج.
- يحتوي كل مستوى في الملف التعريفي على `id` أساسي مخزن (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `xhigh` أو `adaptive` أو `max`) وقد يتضمن `label` للعرض. وتستخدم Providers الثنائية `{ id: "low", label: "on" }`.
- تظل hooks القديمة المنشورة (`supportsXHighThinking` و`isBinaryThinking` و`resolveDefaultThinkingLevel`) موجودة كمهايئات توافق، لكن مجموعات المستويات المخصصة الجديدة يجب أن تستخدم `resolveThinkingProfile`.
- تكشف صفوف Gateway القيمتين `thinkingOptions` و`thinkingDefault` بحيث تعرض عملاء ACP/الدردشة ملف التعريف نفسه الذي يستخدمه تحقق وقت التشغيل.
