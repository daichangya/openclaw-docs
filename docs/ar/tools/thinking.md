---
read_when:
    - ضبط تحليل أو الإعدادات الافتراضية لتوجيهات التفكير أو الوضع السريع أو verbose
summary: صياغة التوجيهات لـ `/think` و`/fast` و`/verbose` و`/trace` وإمكانية رؤية الاستدلال
title: مستويات التفكير
x-i18n:
    generated_at: "2026-04-21T07:27:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: edee9420e1cc3eccfa18d87061c4a4d6873e70cb51fff85305fafbcd6a5d6a7d
    source_path: tools/thinking.md
    workflow: 15
---

# مستويات التفكير (/think directives)

## ما الذي يفعله

- توجيه مضمن داخل أي نص وارد: `/t <level>` أو `/think:<level>` أو `/thinking <level>`.
- المستويات (والأسماء المستعارة): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal ← “think”
  - low ← “think hard”
  - medium ← “think harder”
  - high ← “ultrathink” ‏(الحد الأقصى للميزانية)
  - xhigh ← “ultrathink+” ‏(GPT-5.2 + نماذج Codex وجهد Anthropic Claude Opus 4.7)
  - adaptive ← تفكير تكيفي يديره الموفّر (مدعوم لـ Claude 4.6 على Anthropic/Bedrock وAnthropic Claude Opus 4.7)
  - max ← أقصى استدلال من الموفّر (حاليًا Anthropic Claude Opus 4.7)
  - `x-high` و`x_high` و`extra-high` و`extra high` و`extra_high` تتحول إلى `xhigh`.
  - `highest` تتحول إلى `high`.
- ملاحظات حول الموفّرين:
  - لا يتم الإعلان عن `adaptive` إلا في قوائم الأوامر والمنتقيات الأصلية للموفّرين/النماذج التي تصرح بدعم التفكير التكيفي. ومع ذلك، تظل مقبولة كتوجيه مكتوب للتوافق مع الإعدادات والأسماء المستعارة الحالية.
  - لا يتم الإعلان عن `max` إلا في قوائم الأوامر والمنتقيات الأصلية للموفّرين/النماذج التي تصرح بدعم أقصى تفكير. وتُعاد تعيين إعدادات `max` المخزنة الحالية إلى أكبر مستوى مدعوم للنموذج المحدد عندما لا يدعم النموذج `max`.
  - تستخدم نماذج Anthropic Claude 4.6 القيمة `adaptive` افتراضيًا عندما لا يكون هناك مستوى تفكير صريح مضبوط.
  - لا يستخدم Anthropic Claude Opus 4.7 التفكير التكيفي افتراضيًا. إذ يظل جهد API الافتراضي الخاص به مملوكًا للموفّر ما لم تضبط مستوى تفكير صراحة.
  - يربط Anthropic Claude Opus 4.7 الأمر `/think xhigh` بالتفكير التكيفي بالإضافة إلى `output_config.effort: "xhigh"`، لأن `/think` هو توجيه تفكير و`xhigh` هو إعداد الجهد في Opus 4.7.
  - يوفّر Anthropic Claude Opus 4.7 أيضًا الأمر `/think max`؛ وهو يرتبط بمسار أقصى جهد المملوك للموفّر نفسه.
  - تربط نماذج OpenAI GPT الأمر `/think` عبر دعم الجهد الخاص بـ Responses API لكل نموذج. ويرسل `/think off` القيمة `reasoning.effort: "none"` فقط عندما يدعمها النموذج الهدف؛ وإلا فإن OpenClaw يحذف حمولة تعطيل الاستدلال بدلًا من إرسال قيمة غير مدعومة.
  - تستخدم MiniMax ‏(`minimax/*`) على مسار البث المتوافق مع Anthropic القيمة الافتراضية `thinking: { type: "disabled" }` ما لم تضبط التفكير صراحة في معلمات النموذج أو الطلب. ويتجنب هذا تسرب فروق `reasoning_content` من تنسيق البث غير الأصلي لـ Anthropic في MiniMax.
  - تدعم Z.AI ‏(`zai/*`) التفكير الثنائي فقط (`on`/`off`). ويُعامل أي مستوى غير `off` على أنه `on` ‏(ويُربط بـ `low`).
  - تربط Moonshot ‏(`moonshot/*`) الأمر `/think off` بالقيمة `thinking: { type: "disabled" }` وأي مستوى غير `off` بالقيمة `thinking: { type: "enabled" }`. وعندما يكون التفكير مفعّلًا، لا تقبل Moonshot في `tool_choice` إلا القيمتين `auto|none`؛ ويطبع OpenClaw القيم غير المتوافقة إلى `auto`.

## ترتيب الحل

1. التوجيه المضمن في الرسالة (ينطبق على تلك الرسالة فقط).
2. تجاوز الجلسة (يُضبط بإرسال رسالة تحتوي على التوجيه فقط).
3. الافتراضي لكل وكيل (`agents.list[].thinkingDefault` في الإعدادات).
4. الافتراضي العام (`agents.defaults.thinkingDefault` في الإعدادات).
5. الرجوع الاحتياطي: `adaptive` لنماذج Anthropic Claude 4.6، و`off` لـ Anthropic Claude Opus 4.7 ما لم يتم ضبطه صراحة، و`low` للنماذج الأخرى القادرة على الاستدلال، و`off` فيما عدا ذلك.

## ضبط افتراضي للجلسة

- أرسل رسالة تكون **هي التوجيه فقط** ‏(المسافات مسموحة)، مثل `/think:medium` أو `/t high`.
- يبقى هذا ثابتًا للجلسة الحالية (لكل مرسل افتراضيًا)؛ ويُمسح عبر `/think:off` أو إعادة تعيين الخمول في الجلسة.
- يتم إرسال رد تأكيد (`Thinking level set to high.` / `Thinking disabled.`). وإذا كان المستوى غير صالح (مثل `/thinking big`)، يُرفض الأمر مع تلميح وتبقى حالة الجلسة من دون تغيير.
- أرسل `/think` ‏(أو `/think:`) من دون وسيطة لرؤية مستوى التفكير الحالي.

## التطبيق حسب الوكيل

- **Embedded Pi**: يتم تمرير المستوى المحلول إلى بيئة تشغيل Pi agent داخل العملية.

## الوضع السريع (/fast)

- المستويات: `on|off`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط تجاوز الوضع السريع للجلسة وترد بـ `Fast mode enabled.` / `Fast mode disabled.`.
- أرسل `/fast` ‏(أو `/fast status`) من دون وضع لرؤية حالة الوضع السريع الفعالة الحالية.
- يحل OpenClaw الوضع السريع بهذا الترتيب:
  1. `/fast on|off` المضمن/القائم على التوجيه فقط
  2. تجاوز الجلسة
  3. الافتراضي لكل وكيل (`agents.list[].fastModeDefault`)
  4. إعدادات كل نموذج: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. الرجوع الاحتياطي: `off`
- بالنسبة إلى `openai/*`، يربط الوضع السريع بالمعالجة ذات الأولوية في OpenAI عبر إرسال `service_tier=priority` في طلبات Responses المدعومة.
- بالنسبة إلى `openai-codex/*`، يرسل الوضع السريع العلم نفسه `service_tier=priority` في Codex Responses. ويحافظ OpenClaw على مفتاح `/fast` مشترك واحد عبر مساري المصادقة.
- بالنسبة إلى طلبات `anthropic/*` العامة المباشرة، بما في ذلك الحركة المصادَق عليها عبر OAuth المرسلة إلى `api.anthropic.com`، يربط الوضع السريع بمستويات خدمة Anthropic: حيث يضبط `/fast on` القيمة `service_tier=auto`، ويضبط `/fast off` القيمة `service_tier=standard_only`.
- بالنسبة إلى `minimax/*` على المسار المتوافق مع Anthropic، يعيد `/fast on` ‏(أو `params.fastMode: true`) كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
- تتجاوز معلمات النموذج الصريحة `serviceTier` / `service_tier` الخاصة بـ Anthropic القيمة الافتراضية للوضع السريع عندما يتم ضبطهما معًا. ومع ذلك، يظل OpenClaw يتخطى حقن مستوى خدمة Anthropic لعناوين URL الأساسية غير التابعة لـ Anthropic.

## توجيهات Verbose ‏(`/verbose` أو `/v`)

- المستويات: `on` ‏(أدنى) | `full` | `off` ‏(الافتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط verbose الخاص بالجلسة وترد بـ `Verbose logging enabled.` / `Verbose logging disabled.`؛ بينما تعيد المستويات غير الصالحة تلميحًا من دون تغيير الحالة.
- يخزّن `/verbose off` تجاوزًا صريحًا للجلسة؛ ويمكنك مسحه عبر واجهة Sessions باختيار `inherit`.
- يؤثر التوجيه المضمن في تلك الرسالة فقط؛ وتُطبق افتراضيات الجلسة/العالم فيما عدا ذلك.
- أرسل `/verbose` ‏(أو `/verbose:`) من دون وسيطة لرؤية مستوى verbose الحالي.
- عندما تكون verbose مفعلة، ترسل الوكلاء التي تصدر نتائج أدوات منظمة (Pi، ووكلاء JSON آخرون) كل استدعاء أداة مرة أخرى كرسالة مستقلة تحتوي على بيانات وصفية فقط، مع بادئة `<emoji> <tool-name>: <arg>` عند توفرها (المسار/الأمر). وتُرسل ملخصات الأدوات هذه فور بدء كل أداة (في فقاعات منفصلة)، وليس على شكل فروق بث.
- تظل ملخصات إخفاق الأدوات مرئية في الوضع العادي، لكن لاحقات تفاصيل الخطأ الخام تُخفى ما لم تكن verbose على `on` أو `full`.
- عندما تكون verbose على `full`، يتم أيضًا تمرير مخرجات الأدوات بعد الاكتمال (فقاعة منفصلة، مقتطعة إلى طول آمن). وإذا بدّلت `/verbose on|full|off` أثناء وجود تشغيل قيد التنفيذ، فإن فقاعات الأدوات اللاحقة تلتزم بالإعداد الجديد.

## توجيهات تتبع Plugin ‏(`/trace`)

- المستويات: `on` | `off` ‏(الافتراضي).
- تبدّل الرسالة التي تحتوي على التوجيه فقط مخرجات تتبع plugin الخاصة بالجلسة وترد بـ `Plugin trace enabled.` / `Plugin trace disabled.`.
- يؤثر التوجيه المضمن في تلك الرسالة فقط؛ وتُطبق افتراضيات الجلسة/العالم فيما عدا ذلك.
- أرسل `/trace` ‏(أو `/trace:`) من دون وسيطة لرؤية مستوى التتبع الحالي.
- `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ plugin مثل ملخصات تصحيح Active Memory.
- يمكن أن تظهر أسطر التتبع في `/status` وكاتباع تشخيصي بعد رد المساعد العادي.

## رؤية الاستدلال (/reasoning)

- المستويات: `on|off|stream`.
- تبدّل الرسالة التي تحتوي على التوجيه فقط ما إذا كانت كتل التفكير ستُعرض في الردود.
- عند التفعيل، يُرسل الاستدلال كـ **رسالة منفصلة** مسبوقة بـ `Reasoning:`.
- `stream` ‏(Telegram فقط): يبث الاستدلال إلى فقاعة المسودة في Telegram أثناء إنشاء الرد، ثم يرسل الإجابة النهائية من دون الاستدلال.
- الاسم المستعار: `/reason`.
- أرسل `/reasoning` ‏(أو `/reasoning:`) من دون وسيطة لرؤية مستوى الاستدلال الحالي.
- ترتيب الحل: التوجيه المضمن، ثم تجاوز الجلسة، ثم الافتراضي لكل وكيل (`agents.list[].reasoningDefault`)، ثم الرجوع الاحتياطي (`off`).

## ذو صلة

- توجد وثائق Elevated mode في [Elevated mode](/ar/tools/elevated).

## Heartbeats

- نص فحص Heartbeat هو مطالبة Heartbeat المضبوطة (الافتراضي: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). وتُطبّق التوجيهات المضمنة في رسالة Heartbeat كالمعتاد (لكن تجنب تغيير افتراضيات الجلسة من Heartbeats).
- يكون تسليم Heartbeat افتراضيًا للحمولة النهائية فقط. ولإرسال الرسالة المنفصلة `Reasoning:` أيضًا (عند توفرها)، اضبط `agents.defaults.heartbeat.includeReasoning: true` أو `agents.list[].heartbeat.includeReasoning: true` لكل وكيل.

## واجهة دردشة الويب

- يعكس محدد التفكير في دردشة الويب المستوى المخزن للجلسة من مخزن/إعدادات الجلسة الواردة عند تحميل الصفحة.
- يؤدي اختيار مستوى آخر إلى كتابة تجاوز الجلسة فورًا عبر `sessions.patch`؛ ولا ينتظر الإرسال التالي وليس تجاوزًا لمرة واحدة من نوع `thinkingOnce`.
- يكون الخيار الأول دائمًا `Default (<resolved level>)`، حيث يأتي الافتراضي المحلول من نموذج الجلسة النشط: `adaptive` لـ Claude 4.6 على Anthropic، و`off` لـ Anthropic Claude Opus 4.7 ما لم يتم ضبطه، و`low` للنماذج الأخرى القادرة على الاستدلال، و`off` فيما عدا ذلك.
- يظل المنتقي واعيًا بالموفّر:
  - تعرض معظم الموفّرين `off | minimal | low | medium | high`
  - يعرض Anthropic/Bedrock Claude 4.6 القيم `off | minimal | low | medium | high | adaptive`
  - يعرض Anthropic Claude Opus 4.7 القيم `off | minimal | low | medium | high | xhigh | adaptive | max`
  - تعرض Z.AI القيم الثنائية `off | on`
- يظل `/think:<level>` يعمل ويحدّث مستوى الجلسة المخزن نفسه، بحيث تظل توجيهات الدردشة والمنتقي متزامنين.
