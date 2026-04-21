---
read_when:
    - شرح استخدام الرموز، أو التكاليف، أو نوافذ السياق
    - تصحيح نمو السياق أو سلوك Compaction
summary: كيف يبني OpenClaw سياق المطالبة ويبلّغ عن استخدام الرموز والتكلفة + التكاليف
title: استخدام الرموز والتكاليف
x-i18n:
    generated_at: "2026-04-21T07:26:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# استخدام الرموز والتكاليف

يتتبع OpenClaw **الرموز**، وليس الأحرف. تختلف الرموز حسب النموذج، لكن معظم
النماذج على نمط OpenAI يبلغ متوسطها نحو 4 أحرف لكل رمز في النص الإنجليزي.

## كيف تُبنى مطالبة النظام

يجمع OpenClaw مطالبة النظام الخاصة به في كل تشغيل. وهي تتضمن:

- قائمة الأدوات + أوصافًا قصيرة
- قائمة Skills ‏(البيانات الوصفية فقط؛ ويتم تحميل التعليمات عند الطلب باستخدام `read`).
  وتُقيَّد كتلة Skills المضغوطة بواسطة `skills.limits.maxSkillsPromptChars`,
  مع تجاوز اختياري لكل وكيل عند
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- تعليمات التحديث الذاتي
- مساحة العمل + ملفات bootstrap ‏(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` عندما تكون جديدة، بالإضافة إلى `MEMORY.md` عند وجوده أو `memory.md` كبديل بأحرف صغيرة). يتم اقتطاع الملفات الكبيرة بواسطة `agents.defaults.bootstrapMaxChars` (الافتراضي: 12000)، ويُقيَّد إجمالي حقن bootstrap بواسطة `agents.defaults.bootstrapTotalMaxChars` (الافتراضي: 60000). ولا تكون ملفات `memory/*.md` اليومية جزءًا من مطالبة bootstrap العادية؛ بل تبقى عند الطلب عبر أدوات الذاكرة في الأدوار العادية، لكن يمكن للأمرين `/new` و`/reset` الخامين إلحاق كتلة سياق بدء تشغيل لمرة واحدة بذاكرة يومية حديثة في ذلك الدور الأول. ويتم التحكم في هذا التمهيد عبر `agents.defaults.startupContext`.
- الوقت (UTC + المنطقة الزمنية للمستخدم)
- وسوم الرد + سلوك Heartbeat
- بيانات وقت التشغيل الوصفية (المضيف/نظام التشغيل/النموذج/thinking)

راجع التفصيل الكامل في [مطالبة النظام](/ar/concepts/system-prompt).

## ما الذي يُحتسب داخل نافذة السياق

كل ما يستقبله النموذج يُحتسب ضمن حد السياق:

- مطالبة النظام (كل الأقسام المذكورة أعلاه)
- سجل المحادثة (رسائل المستخدم + المساعد)
- استدعاءات الأدوات ونتائج الأدوات
- المرفقات/النصوص المفرّغة (الصور، والصوت، والملفات)
- ملخصات Compaction وآثار التقليم
- أغلفة المزوّد أو ترويسات الأمان (غير مرئية، لكنها ما تزال محتسبة)

لبعض الأسطح الثقيلة وقت التشغيل حدود صريحة خاصة بها:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

توجد التجاوزات لكل وكيل تحت `agents.list[].contextLimits`. وهذه المفاتيح
مخصصة للمقتطفات المحدودة وقت التشغيل والكتل المحقونة المملوكة لوقت التشغيل. وهي
منفصلة عن حدود bootstrap، وحدود سياق بدء التشغيل، وحدود مطالبة Skills.

بالنسبة إلى الصور، يقوم OpenClaw بتصغير حمولات الصور في transcript/الأدوات قبل استدعاءات المزوّد.
استخدم `agents.defaults.imageMaxDimensionPx` (الافتراضي: `1200`) لضبط ذلك:

- تؤدي القيم الأقل عادةً إلى تقليل استخدام رموز الرؤية وحجم الحمولة.
- تحافظ القيم الأعلى على مزيد من التفاصيل البصرية للقطات الشاشة الثقيلة على OCR/واجهة المستخدم.

للحصول على تفصيل عملي (لكل ملف محقون، والأدوات، وSkills، وحجم مطالبة النظام)، استخدم `/context list` أو `/context detail`. راجع [السياق](/ar/concepts/context).

## كيفية رؤية استخدام الرموز الحالي

استخدم هذه الأوامر في الدردشة:

- `/status` → **بطاقة حالة غنية بالرموز التعبيرية** تعرض نموذج الجلسة، واستخدام السياق،
  ورموز الإدخال/الإخراج في آخر استجابة، و**التكلفة التقديرية** (لمفتاح API فقط).
- `/usage off|tokens|full` → يضيف **تذييل استخدام لكل استجابة** إلى كل رد.
  - يستمر لكل جلسة (ويُخزَّن على هيئة `responseUsage`).
  - تخفي مصادقة OAuth **التكلفة** (الرموز فقط).
- `/usage cost` → يعرض ملخص تكلفة محليًا من سجلات جلسة OpenClaw.

أسطح أخرى:

- **TUI/Web TUI:** يدعمان `/status` و`/usage`.
- **CLI:** يعرض `openclaw status --usage` و`openclaw channels list`
  نوافذ الحصة المطبّعة للمزوّد (`X% left`، وليس تكاليف لكل استجابة).
  المزوّدون الحاليون لنافذة الاستخدام: Anthropic، وGitHub Copilot، وGemini CLI،
  وOpenAI Codex، وMiniMax، وXiaomi، وz.ai.

تطبّع أسطح الاستخدام الأسماء المستعارة الشائعة لحقول المزوّد الأصلية قبل العرض.
وبالنسبة إلى حركة Responses من عائلة OpenAI، يشمل ذلك كلاً من `input_tokens` /
`output_tokens` و`prompt_tokens` / `completion_tokens`، لذا فإن أسماء الحقول الخاصة بالنقل
لا تغيّر `/status` أو `/usage` أو ملخصات الجلسة.
كما يُطبّع استخدام Gemini CLI JSON أيضًا: يأتي نص الرد من `response`، ويتم
تعيين `stats.cached` إلى `cacheRead` مع استخدام `stats.input_tokens - stats.cached`
عندما يحذف CLI الحقل الصريح `stats.input`.
وبالنسبة إلى حركة Responses الأصلية لعائلة OpenAI، يتم تطبيع الأسماء المستعارة لاستخدام WebSocket/SSE بالطريقة نفسها، وتعود المجاميع إلى الإدخال + الإخراج المطبّعين عندما يكون
`total_tokens` مفقودًا أو يساوي `0`.
وعندما تكون لقطة الجلسة الحالية sparse، يمكن لكل من `/status` و`session_status`
أيضًا استعادة عدادات الرموز/cache وتسمية نموذج وقت التشغيل النشط من أحدث سجل استخدام في transcript. وتبقى القيم الحية غير الصفرية الموجودة مقدَّمة على القيم المستعادة من transcript، ويمكن لمجاميع transcript الأكبر الموجّهة إلى المطالبات
أن تفوز عندما تكون المجاميع المخزنة مفقودة أو أصغر.
تأتي مصادقة الاستخدام لنافذة حصة المزوّد من hookات خاصة بالمزوّد عندما تكون متاحة؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/API-key
من ملفات تعريف المصادقة، أو البيئة، أو الإعدادات.
تحتفظ إدخالات transcript الخاصة بالمساعد بشكل الاستخدام المطبّع نفسه، بما في ذلك
`usage.cost` عندما يكون للنموذج النشط تسعير مضبوط ويُرجع المزوّد بيانات استخدام وصفية. وهذا يمنح `/usage cost` وحالة الجلسة المدعومة بـ transcript مصدرًا ثابتًا حتى بعد زوال حالة وقت التشغيل الحية.

## تقدير التكلفة (عند عرضها)

تُقدَّر التكاليف من إعدادات تسعير النموذج لديك:

```
models.providers.<provider>.models[].cost
```

وهي **دولار أمريكي لكل مليون رمز** لكل من `input` و`output` و`cacheRead` و
`cacheWrite`. وإذا كان التسعير مفقودًا، يعرض OpenClaw الرموز فقط. أما رموز OAuth
فلا تعرض تكلفة بالدولار أبدًا.

## أثر TTL الخاص بالـ cache والتقليم

لا ينطبق cache المطالبة لدى المزوّد إلا ضمن نافذة TTL الخاصة بالـ cache. ويمكن لـ OpenClaw
اختياريًا تشغيل **تقليم cache-ttl**: إذ يقلّم الجلسة بمجرد انتهاء TTL
للـ cache، ثم يعيد ضبط نافذة cache بحيث يمكن للطلبات اللاحقة إعادة استخدام السياق
المخزّن حديثًا بدلًا من إعادة تخزين السجل الكامل مرة أخرى. وهذا يُبقي تكاليف كتابة cache
أقل عندما تبقى الجلسة خاملة بعد TTL.

اضبط ذلك في [إعدادات Gateway](/ar/gateway/configuration) وراجع
تفاصيل السلوك في [تقليم الجلسة](/ar/concepts/session-pruning).

يمكن لـ Heartbeat إبقاء cache **دافئًا** عبر فجوات الخمول. فإذا كانت مدة TTL
لـ cache في نموذجك هي `1h`، فإن ضبط فاصل Heartbeat أقل بقليل من ذلك (مثل `55m`) يمكن أن يتجنب
إعادة تخزين المطالبة الكاملة، مما يقلل تكاليف كتابة cache.

في إعدادات متعددة الوكلاء، يمكنك الاحتفاظ بإعداد نموذج مشترك واحد وضبط سلوك cache
لكل وكيل عبر `agents.list[].params.cacheRetention`.

للحصول على دليل كامل لكل إعداد على حدة، راجع [Prompt Caching](/ar/reference/prompt-caching).

بالنسبة إلى تسعير Anthropic API، تكون قراءات cache أرخص بكثير من رموز
الإدخال، بينما تُفوتر كتابات cache بمضاعِف أعلى. راجع تسعير Anthropic لـ prompt caching
للحصول على أحدث الأسعار ومضاعِفات TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### مثال: إبقاء cache لمدة 1h دافئًا باستخدام Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### مثال: حركة مختلطة مع إستراتيجية cache لكل وكيل

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # خط أساس افتراضي لمعظم الوكلاء
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # إبقاء cache الطويل دافئًا للجلسات العميقة
    - id: "alerts"
      params:
        cacheRetention: "none" # تجنب كتابات cache للإشعارات المتدفقة
```

يُدمج `agents.list[].params` فوق `params` الخاصة بالنموذج المحدد، لذا يمكنك
تجاوز `cacheRetention` فقط ووراثة الإعدادات الافتراضية الأخرى للنموذج دون تغيير.

### مثال: تمكين ترويسة Anthropic 1M context beta

إن نافذة السياق 1M الخاصة بـ Anthropic مقيّدة حاليًا بمرحلة beta. ويمكن لـ OpenClaw حقن
قيمة `anthropic-beta` المطلوبة عندما تمكّن `context1m` على نماذج Opus
أو Sonnet المدعومة.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

يُعيَّن هذا إلى ترويسة beta الخاصة بـ Anthropic: ‏`context-1m-2025-08-07`.

ولا ينطبق هذا إلا عند ضبط `context1m: true` على إدخال ذلك النموذج.

المتطلب: يجب أن تكون بيانات الاعتماد مؤهلة لاستخدام السياق الطويل. وإذا لم تكن كذلك،
فسترد Anthropic بخطأ rate limit من جانب المزوّد لهذا الطلب.

إذا قمت بمصادقة Anthropic باستخدام رموز OAuth/الاشتراك (`sk-ant-oat-*`)،
فإن OpenClaw يتخطى ترويسة beta من نوع `context-1m-*` لأن Anthropic ترفض حاليًا
هذا الجمع مع HTTP 401.

## نصائح لتقليل ضغط الرموز

- استخدم `/compact` لتلخيص الجلسات الطويلة.
- قلّم مخرجات الأدوات الكبيرة في تدفقات العمل لديك.
- اخفض `agents.defaults.imageMaxDimensionPx` للجلسات الثقيلة بلقطات الشاشة.
- أبقِ أوصاف Skills قصيرة (إذ تُحقن قائمة Skills في المطالبة).
- فضّل النماذج الأصغر للأعمال المطولة والاستكشافية.

راجع [Skills](/ar/tools/skills) للحصول على الصيغة الدقيقة لحمل قائمة Skills.
