---
read_when:
    - تريد تقليل تكاليف رموز prompt باستخدام الاحتفاظ بالذاكرة المؤقتة
    - أنت بحاجة إلى سلوك Prompt cache لكل وكيل على حدة في إعدادات متعددة الوكلاء
    - أنت تقوم بضبط Heartbeat وتشذيب cache-ttl معًا
summary: عناصر تحكم Prompt cache، وترتيب الدمج، وسلوك الموفّر، وأنماط الضبط
title: Prompt cache
x-i18n:
    generated_at: "2026-04-25T13:57:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

يعني Prompt caching أن موفّر النموذج يمكنه إعادة استخدام بادئات prompt غير المتغيرة (عادةً تعليمات system/developer وغيرها من السياقات الثابتة) عبر الأدوار بدلًا من إعادة معالجتها في كل مرة. يقوم OpenClaw بتطبيع استخدام الموفّر إلى `cacheRead` و`cacheWrite` عندما تكشف API الصاعدة هذه العدّادات مباشرةً.

يمكن لواجهات الحالة أيضًا استعادة عدّادات cache من أحدث
سجل استخدام في transcript عندما تفتقدها اللقطة الحية للجلسة، بحيث يمكن لأمر `/status` أن يستمر
في إظهار سطر cache بعد فقدان جزئي لبيانات الجلسة الوصفية. وتظل
قيم cache الحية غير الصفرية الحالية ذات أولوية على قيم fallback المأخوذة من transcript.

أهمية ذلك: تكلفة رموز أقل، واستجابات أسرع، وأداء أكثر قابلية للتوقع للجلسات طويلة التشغيل. من دون caching، تدفع prompts المتكررة تكلفة prompt الكاملة في كل دور حتى عندما لا يتغير معظم الإدخال.

تغطي الأقسام أدناه كل عنصر تحكم متعلق بالـ cache يؤثر في إعادة استخدام prompt وتكلفة الرموز.

مراجع الموفّرين:

- Prompt caching في Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Prompt caching في OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- ترويسات OpenAI API ومعرّفات الطلبات: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- معرّفات الطلبات والأخطاء في Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## عناصر التحكم الأساسية

### `cacheRetention` (الافتراضي العام، والنموذج، ولكل وكيل)

اضبط الاحتفاظ بالـ cache كإعداد افتراضي عام لجميع النماذج:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

استبدله لكل نموذج:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

استبدال لكل وكيل:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ترتيب دمج الإعدادات:

1. `agents.defaults.params` (الإعداد الافتراضي العام — ينطبق على جميع النماذج)
2. `agents.defaults.models["provider/model"].params` (استبدال لكل نموذج)
3. `agents.list[].params` (معرّف الوكيل المطابق؛ يستبدل حسب المفتاح)

### `contextPruning.mode: "cache-ttl"`

يُشذّب سياق نتائج الأدوات القديمة بعد نوافذ TTL الخاصة بالـ cache حتى لا تعيد الطلبات بعد الخمول تخزين سجل ضخم مؤقتًا من جديد.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

راجع [تشذيب الجلسة](/ar/concepts/session-pruning) للاطلاع على السلوك الكامل.

### إبقاء Heartbeat دافئًا

يمكن لـ Heartbeat إبقاء نوافذ cache دافئة وتقليل عمليات كتابة cache المتكررة بعد فترات الخمول.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat لكل وكيل مدعوم في `agents.list[].heartbeat`.

## سلوك الموفّر

### Anthropic (API مباشر)

- `cacheRetention` مدعوم.
- مع ملفات تعريف مصادقة مفتاح API الخاصة بـ Anthropic، يضبط OpenClaw القيمة الأولية `cacheRetention: "short"` لمراجع نماذج Anthropic عندما لا تكون مضبوطة.
- تكشف استجابات Messages الأصلية في Anthropic كلاً من `cache_read_input_tokens` و`cache_creation_input_tokens`، لذا يمكن لـ OpenClaw عرض كل من `cacheRead` و`cacheWrite`.
- بالنسبة إلى طلبات Anthropic الأصلية، فإن `cacheRetention: "short"` تُطابق cache المؤقتة الافتراضية ذات الخمس دقائق، بينما تقوم `cacheRetention: "long"` بالترقية إلى TTL لمدة ساعة واحدة فقط على مضيفي `api.anthropic.com` المباشرين.

### OpenAI (API مباشر)

- Prompt caching تلقائي على النماذج الحديثة المدعومة. لا يحتاج OpenClaw إلى حقن مؤشرات cache على مستوى الكتل.
- يستخدم OpenClaw القيمة `prompt_cache_key` للحفاظ على استقرار توجيه cache عبر الأدوار، ويستخدم `prompt_cache_retention: "24h"` فقط عند اختيار `cacheRetention: "long"` على مضيفي OpenAI المباشرين.
- تتلقى موفّرات OpenAI-compatible Completions القيمة `prompt_cache_key` فقط عندما يضبط إعداد النموذج لديها صراحةً `compat.supportsPromptCacheKey: true`؛ وتظل `cacheRetention: "none"` تمنعها.
- تكشف استجابات OpenAI عن رموز prompt المخزنة مؤقتًا عبر `usage.prompt_tokens_details.cached_tokens` (أو `input_tokens_details.cached_tokens` في أحداث Responses API). ويحوّل OpenClaw ذلك إلى `cacheRead`.
- لا تكشف OpenAI عن عدّاد منفصل لرموز كتابة cache، لذلك تبقى `cacheWrite` مساوية لـ `0` على مسارات OpenAI حتى عندما يقوم الموفّر بتسخين cache.
- تعيد OpenAI ترويسات مفيدة للتتبّع وحدود المعدل مثل `x-request-id` و`openai-processing-ms` و`x-ratelimit-*`، لكن يجب أن تأتي محاسبة إصابات cache من حمولة الاستخدام، لا من الترويسات.
- عمليًا، غالبًا ما تتصرف OpenAI كأنها cache لبادئة أولية بدلًا من إعادة استخدام كامل السجل المتحرك على طريقة Anthropic. يمكن أن تستقر الأدوار ذات النصوص الطويلة والثابتة قرب مستوى `4864` من الرموز المخزنة مؤقتًا في الاختبارات الحية الحالية، بينما تستقر transcripts الثقيلة بالأدوات أو بأسلوب MCP غالبًا قرب `4608` رموز مخزنة مؤقتًا حتى مع التطابق التام في الإعادة.

### Anthropic Vertex

- تدعم نماذج Anthropic على Vertex AI ‏(`anthropic-vertex/*`) القيمة `cacheRetention` بالطريقة نفسها مثل Anthropic المباشر.
- تقوم `cacheRetention: "long"` بالمطابقة مع TTL حقيقي لمدة ساعة واحدة لـ prompt-cache على نقاط نهاية Vertex AI.
- يطابق الاحتفاظ الافتراضي بالـ cache لـ `anthropic-vertex` افتراضيات Anthropic المباشر.
- تُوجَّه طلبات Vertex عبر تشكيل cache واعٍ بالحدود بحيث تظل إعادة الاستخدام متوافقة مع ما تتلقاه الموفّرات فعليًا.

### Amazon Bedrock

- تدعم مراجع نماذج Anthropic Claude ‏(`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` الصريح.
- تُفرض على نماذج Bedrock غير التابعة لـ Anthropic القيمة `cacheRetention: "none"` وقت التشغيل.

### نماذج OpenRouter

بالنسبة إلى مراجع النماذج `openrouter/anthropic/*`، يقوم OpenClaw بحقن
`cache_control` الخاص بـ Anthropic في كتل prompt الخاصة بـ system/developer لتحسين إعادة استخدام prompt-cache
فقط عندما يظل الطلب يستهدف مسار OpenRouter متحققًا منه
(`openrouter` على نقطة نهايته الافتراضية، أو أي موفّر/عنوان أساس يُحل
إلى `openrouter.ai`).

وبالنسبة إلى مراجع النماذج `openrouter/deepseek/*` و`openrouter/moonshot*/*` و`openrouter/zai/*`،
فإن `contextPruning.mode: "cache-ttl"` مسموح به لأن OpenRouter
يتولى prompt caching على جانب الموفّر تلقائيًا. لا يقوم OpenClaw بحقن
مؤشرات `cache_control` الخاصة بـ Anthropic في هذه الطلبات.

يتم إنشاء cache في DeepSeek على أساس أفضل جهد وقد يستغرق بضع ثوانٍ. قد
تُظهر المتابعة الفورية القيمة `cached_tokens: 0`؛ تحقق من ذلك بطلب متكرر
له البادئة نفسها بعد تأخير قصير واستخدم `usage.prompt_tokens_details.cached_tokens`
كمؤشر على إصابة cache.

إذا أعدت توجيه النموذج إلى عنوان proxy عشوائي متوافق مع OpenAI، فسيتوقف OpenClaw
عن حقن مؤشرات cache الخاصة بـ Anthropic والمخصصة لـ OpenRouter.

### موفّرون آخرون

إذا لم يكن الموفّر يدعم وضع cache هذا، فلن يكون لـ `cacheRetention` أي تأثير.

### Google Gemini direct API

- يبلغ النقل المباشر لـ Gemini ‏(`api: "google-generative-ai"`) عن إصابات cache
  عبر `cachedContentTokenCount` الصاعد؛ ويحوّل OpenClaw ذلك إلى `cacheRead`.
- عند ضبط `cacheRetention` على نموذج Gemini مباشر، يقوم OpenClaw تلقائيًا
  بإنشاء موارد `cachedContents` وإعادة استخدامها وتحديثها لـ prompts الخاصة بالنظام
  على تشغيلات Google AI Studio. وهذا يعني أنك لم تعد بحاجة إلى
  إنشاء مقبض cached-content مسبقًا يدويًا.
- ما يزال بإمكانك تمرير مقبض Gemini cached-content موجود مسبقًا
  عبر `params.cachedContent` (أو القديم `params.cached_content`) على
  النموذج المضبوط.
- هذا منفصل عن prompt-prefix caching في Anthropic/OpenAI. بالنسبة إلى Gemini،
  يدير OpenClaw مورد `cachedContents` أصليًا خاصًا بالموفّر بدلًا من
  حقن مؤشرات cache داخل الطلب.

### استخدام Gemini CLI JSON

- يمكن أن يُظهر خرج JSON الخاص بـ Gemini CLI أيضًا إصابات cache عبر `stats.cached`؛
  ويحوّل OpenClaw ذلك إلى `cacheRead`.
- إذا حذف CLI قيمة `stats.input` المباشرة، فإن OpenClaw يستنتج رموز الإدخال
  من `stats.input_tokens - stats.cached`.
- هذا مجرد تطبيع للاستخدام. ولا يعني أن OpenClaw ينشئ
  مؤشرات prompt-cache بأسلوب Anthropic/OpenAI من أجل Gemini CLI.

## حد cache الخاص بـ system-prompt

يقسم OpenClaw system prompt إلى **بادئة ثابتة** و**لاحقة متقلبة**
يفصل بينهما حد داخلي لبادئة cache. يتم ترتيب المحتوى فوق
الحد (تعريفات الأدوات، وبيانات Skills الوصفية، وملفات مساحة العمل، وغير ذلك من
السياق الثابت نسبيًا) بحيث يبقى مطابقًا على مستوى البايتات عبر الأدوار.
أما المحتوى أسفل الحد (مثل `HEARTBEAT.md`، والطوابع الزمنية لوقت التشغيل،
وغيرها من البيانات الوصفية لكل دور) فيُسمح له بالتغير من دون إبطال
البادئة المخزنة مؤقتًا.

خيارات التصميم الرئيسية:

- تُرتّب ملفات سياق المشروع الثابتة في مساحة العمل قبل `HEARTBEAT.md` بحيث
  لا يؤدي تغيّر Heartbeat إلى كسر البادئة الثابتة.
- يُطبَّق الحد عبر تشكيل cache لعائلة Anthropic، وعائلة OpenAI، وGoogle،
  وCLI transport بحيث تستفيد كل الموفّرات المدعومة من استقرار البادئة نفسه.
- تُوجَّه طلبات Codex Responses وAnthropic Vertex عبر
  تشكيل cache واعٍ بالحدود بحيث تظل إعادة الاستخدام متوافقة مع ما
  تتلقاه الموفّرات فعليًا.
- تُطبَّع بصمات system-prompt (المسافات البيضاء، ونهايات الأسطر،
  والسياق المضاف عبر hooks، وترتيب إمكانات وقت التشغيل) بحيث تشترك
  prompts غير المتغيرة دلاليًا في KV/cache عبر الأدوار.

إذا رأيت ارتفاعات غير متوقعة في `cacheWrite` بعد تغيير في الإعدادات أو مساحة العمل،
فتحقق مما إذا كان التغيير يقع فوق حد cache أو تحته. إن نقل
المحتوى المتقلب إلى أسفل الحد (أو تثبيته) يحل المشكلة غالبًا.

## وسائل الحماية لاستقرار cache في OpenClaw

يحافظ OpenClaw أيضًا على عدة أشكال من الحمولات الحساسة للـ cache بشكل حتمي
قبل أن يصل الطلب إلى الموفّر:

- تُرتّب كتالوجات أدوات MCP المجمّعة ترتيبًا حتميًا قبل تسجيل
  الأداة، بحيث لا يؤدي تغيّر ترتيب `listTools()` إلى اضطراب كتلة الأدوات
  وكسر بادئات prompt-cache.
- تحتفظ الجلسات القديمة التي تحتوي على كتل صور محفوظة بأحدث **3 أدوار مكتملة**
  كما هي؛ وقد تُستبدل كتل الصور الأقدم التي تمت معالجتها بالفعل
  بعلامة حتى لا تستمر المتابعات الثقيلة بالصور في إعادة إرسال
  حمولات قديمة كبيرة.

## أنماط الضبط

### حركة مرور مختلطة (الافتراضي الموصى به)

احتفظ بخط أساس طويل الأمد على وكيلك الرئيسي، وعطّل caching على وكلاء الإشعارات المتقطعين:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### خط أساس يركز على التكلفة

- اضبط خط الأساس `cacheRetention: "short"`.
- فعّل `contextPruning.mode: "cache-ttl"`.
- أبقِ Heartbeat تحت TTL الخاص بك فقط للوكلاء الذين يستفيدون من cache الدافئ.

## تشخيصات cache

يكشف OpenClaw عن تشخيصات مخصصة لتتبّع cache لتشغيلات الوكيل المضمّنة.

وبالنسبة إلى التشخيصات العادية الموجهة للمستخدم، يمكن لأمر `/status` وملخصات الاستخدام الأخرى أن تستخدم
أحدث إدخال استخدام في transcript كمصدر fallback لـ `cacheRead` /
`cacheWrite` عندما لا يحتوي إدخال الجلسة الحية على تلك العدّادات.

## اختبارات التراجع الحية

يحتفظ OpenClaw ببوابة تراجع حية موحدة واحدة لإعادة البادئات المتكررة، وأدوار الأدوات، وأدوار الصور، وtranscripts الأدوات بأسلوب MCP، وعنصر تحكم Anthropic بدون cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

شغّل البوابة الحية الضيقة باستخدام:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

يخزن ملف خط الأساس أحدث الأرقام الحية المرصودة بالإضافة إلى حدود التراجع الخاصة بكل موفّر التي يستخدمها الاختبار.
كما يستخدم المشغّل معرّفات جلسات جديدة لكل تشغيل ومساحات أسماء prompts جديدة حتى لا تلوّث حالة cache السابقة عينة التراجع الحالية.

تتعمّد هذه الاختبارات عدم استخدام معايير نجاح متطابقة بين الموفّرين.

### التوقعات الحية لـ Anthropic

- توقّع كتابات تسخين صريحة عبر `cacheWrite`.
- توقّع إعادة استخدام شبه كاملة للسجل في الأدوار المتكررة لأن عنصر التحكم بالـ cache في Anthropic يقدّم نقطة توقف cache خلال المحادثة.
- ما تزال التأكيدات الحية الحالية تستخدم حدودًا مرتفعة لمعدل الإصابة في المسارات الثابتة، ومسارات الأدوات، ومسارات الصور.

### التوقعات الحية لـ OpenAI

- توقّع `cacheRead` فقط. وتظل `cacheWrite` مساوية لـ `0`.
- تعامل مع إعادة استخدام cache في الأدوار المتكررة على أنها مستوى استقرار خاص بالموفّر، لا على أنها إعادة استخدام كامل السجل المتحرك بأسلوب Anthropic.
- تستخدم التأكيدات الحية الحالية فحوصات دنيا متحفظة مشتقة من السلوك الحي المرصود على `gpt-5.4-mini`:
  - بادئة ثابتة: `cacheRead >= 4608`، ومعدل إصابة `>= 0.90`
  - transcript الأدوات: `cacheRead >= 4096`، ومعدل إصابة `>= 0.85`
  - transcript الصور: `cacheRead >= 3840`، ومعدل إصابة `>= 0.82`
  - transcript بأسلوب MCP: ‏`cacheRead >= 4096`، ومعدل إصابة `>= 0.85`

وصل أحدث تحقق حي مجمّع في 2026-04-04 إلى:

- بادئة ثابتة: `cacheRead=4864`، ومعدل إصابة `0.966`
- transcript الأدوات: `cacheRead=4608`، ومعدل إصابة `0.896`
- transcript الصور: `cacheRead=4864`، ومعدل إصابة `0.954`
- transcript بأسلوب MCP: ‏`cacheRead=4608`، ومعدل إصابة `0.891`

كان الزمن المحلي الأخير على ساعة الحائط للبوابة المجمّعة نحو `88s`.

لماذا تختلف التأكيدات:

- يكشف Anthropic عن نقاط توقف cache صريحة وإعادة استخدام متحركة لسجل المحادثة.
- ما يزال Prompt caching في OpenAI حساسًا للبادئة المطابقة تمامًا، لكن البادئة القابلة لإعادة الاستخدام فعليًا في حركة Responses الحية قد تستقر عند نقطة أبكر من prompt الكامل.
- ولهذا السبب، فإن مقارنة Anthropic وOpenAI باستخدام حد نسبة مئوية واحد عبر جميع الموفّرين تؤدي إلى تراجعات زائفة.

### إعداد `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # اختياري
    includeMessages: false # الافتراضي true
    includePrompt: false # الافتراضي true
    includeSystem: false # الافتراضي true
```

القيم الافتراضية:

- `filePath`: ‏`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: ‏`true`
- `includePrompt`: ‏`true`
- `includeSystem`: ‏`true`

### مفاتيح Env (لتصحيح مؤقت)

- `OPENCLAW_CACHE_TRACE=1` يفعّل تتبّع cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` يستبدل مسار الإخراج.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` يبدّل التقاط حمولة الرسائل الكاملة.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` يبدّل التقاط نص prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` يبدّل التقاط system prompt.

### ما الذي يجب فحصه

- أحداث تتبّع cache تكون بصيغة JSONL وتتضمن لقطات مرحلية مثل `session:loaded` و`prompt:before` و`stream:context` و`session:after`.
- يظهر أثر رموز cache لكل دور في واجهات الاستخدام العادية عبر `cacheRead` و`cacheWrite` (مثل `/usage full` وملخصات استخدام الجلسة).
- بالنسبة إلى Anthropic، توقّع وجود كل من `cacheRead` و`cacheWrite` عندما يكون caching نشطًا.
- بالنسبة إلى OpenAI، توقّع `cacheRead` عند إصابات cache وأن تبقى `cacheWrite` مساوية لـ `0`؛ إذ لا تنشر OpenAI حقلًا منفصلًا لرموز كتابة cache.
- إذا كنت بحاجة إلى تتبّع الطلبات، فسجّل معرّفات الطلبات وترويسات حدود المعدل بشكل منفصل عن مقاييس cache. إن خرج تتبّع cache الحالي في OpenClaw يركز على شكل prompt/session واستخدام الرموز المطبّع بدلًا من ترويسات استجابات الموفّر الخام.

## استكشاف الأعطال السريع

- ارتفاع `cacheWrite` في معظم الأدوار: تحقّق من مدخلات system-prompt المتقلبة وتأكد من أن النموذج/الموفّر يدعم إعدادات cache الخاصة بك.
- ارتفاع `cacheWrite` في Anthropic: يعني غالبًا أن نقطة توقف cache تقع على محتوى يتغير مع كل طلب.
- انخفاض `cacheRead` في OpenAI: تحقّق من أن البادئة الثابتة موجودة في البداية، وأن البادئة المتكررة لا تقل عن 1024 رمزًا، وأنه يعاد استخدام `prompt_cache_key` نفسه في الأدوار التي ينبغي أن تشترك في cache.
- عدم وجود تأثير لـ `cacheRetention`: تأكد من أن مفتاح النموذج يطابق `agents.defaults.models["provider/model"]`.
- طلبات Bedrock Nova/Mistral مع إعدادات cache: من المتوقع فرض القيمة `none` وقت التشغيل.

الوثائق ذات الصلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [تشذيب الجلسة](/ar/concepts/session-pruning)
- [مرجع إعدادات Gateway](/ar/gateway/configuration-reference)

## ذو صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [استخدام API والتكاليف](/ar/reference/api-usage-costs)
