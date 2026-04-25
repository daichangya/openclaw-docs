---
read_when:
    - تريد فهم الميزات التي قد تستدعي واجهات API مدفوعة
    - تحتاج إلى تدقيق المفاتيح والتكاليف وإمكانية عرض الاستخدام
    - أنت تشرح تقارير التكلفة في ‎/status أو ‎/usage
summary: راجع ما الذي يمكن أن ينفق المال، والمفاتيح المستخدمة، وكيفية عرض الاستخدام
title: استخدام API والتكاليف
x-i18n:
    generated_at: "2026-04-25T13:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# استخدام API والتكاليف

تسرد هذه الوثيقة **الميزات التي يمكن أن تستدعي مفاتيح API** وأين تظهر تكاليفها. وهي تركّز على
ميزات OpenClaw التي يمكن أن تولّد استخدامًا لدى المزوّد أو استدعاءات API مدفوعة.

## أين تظهر التكاليف (الدردشة + CLI)

**لقطة تكلفة لكل جلسة**

- يعرض `/status` نموذج الجلسة الحالي، واستخدام السياق، ورموز الاستجابة الأخيرة.
- إذا كان النموذج يستخدم **مصادقة بمفتاح API**، فإن `/status` يعرض أيضًا **التكلفة التقديرية** لآخر رد.
- إذا كانت بيانات تعريف الجلسة المباشرة قليلة، يمكن لـ `/status` استعادة
  عدّادات الرموز/التخزين المؤقت ووسم نموذج وقت التشغيل النشط من أحدث إدخال استخدام
  في السجل. تظل القيم المباشرة غير الصفرية الحالية لها الأولوية، ويمكن أن تتغلب
  إجماليات السجل بحجم الموجّه عندما تكون الإجماليات المخزنة مفقودة أو أصغر.

**تذييل التكلفة لكل رسالة**

- يضيف `/usage full` تذييل استخدام إلى كل رد، بما في ذلك **التكلفة التقديرية** (لمفاتيح API فقط).
- يعرض `/usage tokens` الرموز فقط؛ وتخفي تدفقات OAuth/token بنمط الاشتراك وتدفقات CLI تكلفة الدولار.
- ملاحظة Gemini CLI: عندما يعيد CLI مخرجات JSON، يقرأ OpenClaw بيانات الاستخدام من
  `stats`، ويحوّل `stats.cached` إلى `cacheRead`، ويستنتج رموز الإدخال من
  `stats.input_tokens - stats.cached` عند الحاجة.

ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بنمط OpenClaw
مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p`
على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
ولا تزال Anthropic لا تعرض تقديرًا بالدولار لكل رسالة يمكن لـ OpenClaw
إظهاره في `/usage full`.

**نوافذ استخدام CLI (حصص المزوّد)**

- يعرض `openclaw status --usage` و`openclaw channels list` **نوافذ استخدام** المزوّد
  (لقطات للحصص، وليست تكاليف لكل رسالة).
- يتم توحيد المخرجات البشرية إلى `X% left` عبر جميع المزوّدين.
- مزودو نوافذ الاستخدام الحاليون: Anthropic وGitHub Copilot وGemini CLI
  وOpenAI Codex وMiniMax وXiaomi وz.ai.
- ملاحظة MiniMax: تعني الحقول الخام `usage_percent` / `usagePercent` الحصة
  المتبقية، لذلك يعكسها OpenClaw قبل العرض. وتظل الحقول المعتمدة على العدّ
  هي المفضلة عندما تكون موجودة. وإذا أعاد المزوّد `model_remains`، فإن OpenClaw يفضّل
  إدخال نموذج الدردشة، ويستنتج تسمية النافذة من الطوابع الزمنية عند الحاجة،
  ويضمّن اسم النموذج في تسمية الخطة.
- تأتي مصادقة الاستخدام لتلك النوافذ الخاصة بالحصص من خطافات خاصة بالمزوّد عندما تكون
  متاحة؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/مفتاح API
  من ملفات تعريف المصادقة أو env أو الإعدادات.

راجع [استخدام الرموز والتكاليف](/ar/reference/token-use) للحصول على التفاصيل والأمثلة.

## كيفية اكتشاف المفاتيح

يمكن لـ OpenClaw التقاط بيانات الاعتماد من:

- **ملفات تعريف المصادقة** (لكل وكيل، ومخزنة في `auth-profiles.json`).
- **متغيرات البيئة** (مثل `OPENAI_API_KEY` و`BRAVE_API_KEY` و`FIRECRAWL_API_KEY`).
- **الإعدادات** (`models.providers.*.apiKey` و`plugins.entries.*.config.webSearch.apiKey` و
  `plugins.entries.firecrawl.config.webFetch.apiKey` و`memorySearch.*` و
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) التي قد تصدّر المفاتيح إلى env لعملية Skill.

## الميزات التي يمكنها إنفاق المفاتيح

### 1) استجابات النماذج الأساسية (الدردشة + الأدوات)

يستخدم كل رد أو استدعاء أداة **مزوّد النموذج الحالي** (OpenAI أو Anthropic أو غيرهما). وهذا هو
المصدر الأساسي للاستخدام والتكلفة.

ويشمل ذلك أيضًا المزوّدين المستضافين بنمط الاشتراك الذين ما زالوا يفرضون رسومًا خارج
واجهة OpenClaw المحلية، مثل **OpenAI Codex** و**Alibaba Cloud Model Studio
Coding Plan** و**MiniMax Coding Plan** و**Z.AI / GLM Coding Plan** و
مسار Claude login في OpenClaw الخاص بـ Anthropic مع تفعيل **Extra Usage**.

راجع [النماذج](/ar/providers/models) لإعدادات التسعير و[استخدام الرموز والتكاليف](/ar/reference/token-use) للعرض.

### 2) فهم الوسائط (الصوت/الصورة/الفيديو)

يمكن تلخيص الوسائط الواردة أو نسخها صوتيًا قبل تشغيل الرد. ويستخدم هذا واجهات API للنماذج/المزوّدين.

- الصوت: OpenAI / Groq / Deepgram / Google / Mistral.
- الصور: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- الفيديو: Google / Qwen / Moonshot.

راجع [فهم الوسائط](/ar/nodes/media-understanding).

### 3) توليد الصور والفيديو

يمكن لقدرات التوليد المشتركة أيضًا أن تنفق مفاتيح المزوّدين:

- توليد الصور: OpenAI / Google / fal / MiniMax
- توليد الفيديو: Qwen

يمكن لتوليد الصور استنتاج مزوّد افتراضي مدعوم بالمصادقة عندما
يكون `agents.defaults.imageGenerationModel` غير مضبوط. ويتطلب توليد الفيديو حاليًا
`agents.defaults.videoGenerationModel` صريحًا مثل
`qwen/wan2.6-t2v`.

راجع [توليد الصور](/ar/tools/image-generation) و[Qwen Cloud](/ar/providers/qwen)
و[النماذج](/ar/concepts/models).

### 4) تضمينات الذاكرة + البحث الدلالي

يستخدم البحث الدلالي في الذاكرة **واجهات API للتضمينات** عندما يتم ضبطه على مزوّدين بعيدين:

- `memorySearch.provider = "openai"` ← تضمينات OpenAI
- `memorySearch.provider = "gemini"` ← تضمينات Gemini
- `memorySearch.provider = "voyage"` ← تضمينات Voyage
- `memorySearch.provider = "mistral"` ← تضمينات Mistral
- `memorySearch.provider = "lmstudio"` ← تضمينات LM Studio (محلية/مستضافة ذاتيًا)
- `memorySearch.provider = "ollama"` ← تضمينات Ollama (محلية/مستضافة ذاتيًا؛ عادةً بلا رسوم API مستضافة)
- تبديل احتياطي اختياري إلى مزوّد بعيد إذا فشلت التضمينات المحلية

يمكنك إبقاءه محليًا باستخدام `memorySearch.provider = "local"` (من دون استخدام API).

راجع [الذاكرة](/ar/concepts/memory).

### 5) أداة البحث على الويب

قد تتسبب `web_search` في رسوم استخدام حسب مزوّدك:

- **Brave Search API**: ‏`BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: ‏`EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: ‏`FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: ‏`GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: ‏`XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: ‏`KIMI_API_KEY` أو `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: ‏`MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY` أو `MINIMAX_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: من دون مفتاح افتراضيًا، لكنه يتطلب مضيف Ollama يمكن الوصول إليه بالإضافة إلى `ollama signin`؛ ويمكنه أيضًا إعادة استخدام مصادقة Bearer العادية الخاصة بمزوّد Ollama عندما يتطلبها المضيف
- **Perplexity Search API**: ‏`PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: ‏`TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: تبديل احتياطي من دون مفتاح (من دون فوترة API، لكنه غير رسمي ويعتمد على HTML)
- **SearXNG**: ‏`SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (من دون مفتاح/مستضاف ذاتيًا؛ بلا فوترة API مستضافة)

لا تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمّل عبر طبقة التوافق المؤقتة، لكنها لم تعد واجهة الإعدادات الموصى بها.

**رصيد Brave Search المجاني:** تتضمن كل خطة Brave رصيدًا مجانيًا متجددًا
بقيمة \$5/شهريًا. وتبلغ تكلفة خطة Search ‏\$5 لكل 1,000 طلب، لذا يغطي هذا الرصيد
1,000 طلب/شهريًا من دون رسوم. اضبط حد الاستخدام في لوحة تحكم Brave
لتجنب الرسوم غير المتوقعة.

راجع [أدوات الويب](/ar/tools/web).

### 5) أداة جلب الويب (Firecrawl)

يمكن لـ `web_fetch` استدعاء **Firecrawl** عند وجود مفتاح API:

- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webFetch.apiKey`

إذا لم يتم إعداد Firecrawl، تعود الأداة إلى الجلب المباشر بالإضافة إلى Plugin
`web-readability` المضمّن (من دون API مدفوع). عطّل `plugins.entries.web-readability.enabled` لتخطي استخراج Readability المحلي.

راجع [أدوات الويب](/ar/tools/web).

### 6) لقطات استخدام المزوّد (الحالة/السلامة)

تستدعي بعض أوامر الحالة **نقاط نهاية استخدام المزوّد** لعرض نوافذ الحصص أو سلامة المصادقة.
وعادةً ما تكون هذه الاستدعاءات منخفضة الحجم، لكنها ما تزال تضرب واجهات API الخاصة بالمزوّد:

- `openclaw status --usage`
- `openclaw models status --json`

راجع [CLI النماذج](/ar/cli/models).

### 7) تلخيص حماية Compaction

يمكن لحماية Compaction تلخيص سجل الجلسة باستخدام **النموذج الحالي**، مما
يستدعي واجهات API الخاصة بالمزوّدين عند تشغيله.

راجع [إدارة الجلسات + Compaction](/ar/reference/session-management-compaction).

### 8) فحص / اختبار النموذج

يمكن لـ `openclaw models scan` اختبار نماذج OpenRouter ويستخدم `OPENROUTER_API_KEY` عندما
يكون الاختبار مفعّلًا.

راجع [CLI النماذج](/ar/cli/models).

### 9) Talk (الكلام)

يمكن لوضع Talk استدعاء **ElevenLabs** عند إعداده:

- `ELEVENLABS_API_KEY` أو `talk.providers.elevenlabs.apiKey`

راجع [وضع Talk](/ar/nodes/talk).

### 10) Skills (واجهات API لجهات خارجية)

يمكن لـ Skills تخزين `apiKey` في `skills.entries.<name>.apiKey`. وإذا استخدمت Skill هذا المفتاح مع
واجهات API خارجية، فقد تترتب عليها تكاليف وفقًا لمزوّد تلك Skill.

راجع [Skills](/ar/tools/skills).

## ذو صلة

- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [التخزين المؤقت للموجّهات](/ar/reference/prompt-caching)
- [تتبّع الاستخدام](/ar/concepts/usage-tracking)
