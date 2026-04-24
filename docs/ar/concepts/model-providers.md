---
read_when:
    - أنت بحاجة إلى مرجع لإعداد النماذج لكل موفّر على حدة
    - أنت تريد أمثلة على الإعدادات أو أوامر التهيئة عبر CLI لموفّري النماذج
summary: نظرة عامة على موفّر النموذج مع أمثلة على الإعدادات + تدفقات CLI
title: موفّرو النماذج
x-i18n:
    generated_at: "2026-04-24T15:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79258cb26fae7926c65b6fe0db938c7b5736a540b33bc24c1fad5ad706ac8204
    source_path: concepts/model-providers.md
    workflow: 15
---

تغطي هذه الصفحة **موفّري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram).
للاطلاع على قواعد اختيار النموذج، راجع [/concepts/models](/ar/concepts/models).

## قواعد سريعة

- تستخدم مراجع النماذج التنسيق `provider/model` (مثال: `opencode/claude-opus-4-6`).
- تعمل `agents.defaults.models` كقائمة سماح عند تعيينها.
- مساعدات CLI: ‏`openclaw onboard`، ‏`openclaw models list`، ‏`openclaw models set <provider/model>`.
- تمثل `models.providers.*.models[].contextWindow` بيانات تعريف أصلية للنموذج؛ أما `contextTokens` فهو الحد الفعّال وقت التشغيل.
- قواعد التبديل الاحتياطي، وفحوصات فترة التهدئة، واستمرارية تجاوز الجلسة: [تجاوز فشل النموذج](/ar/concepts/model-failover).
- تكون مسارات عائلة OpenAI خاصة بالبادئة: يستخدم `openai/<model>` موفّر مفتاح API المباشر لـ OpenAI في PI، ويستخدم `openai-codex/<model>` مصادقة Codex عبر OAuth في PI، بينما يستخدم `openai/<model>` مع `agents.defaults.embeddedHarness.runtime: "codex"` حزام Codex الأصلي لخادم التطبيق. راجع [OpenAI](/ar/providers/openai) و[حزام Codex](/ar/plugins/codex-harness).
- يتبع التفعيل التلقائي لـ Plugin الحد نفسه: ينتمي `openai-codex/<model>` إلى Plugin الخاص بـ OpenAI، بينما يتم تفعيل Plugin الخاص بـ Codex بواسطة `embeddedHarness.runtime: "codex"` أو مراجع `codex/<model>` القديمة.
- يتوفر GPT-5.5 حاليًا عبر مسارات الاشتراك/OAuth: ‏`openai-codex/gpt-5.5` في PI أو `openai/gpt-5.5` مع حزام خادم تطبيق Codex. يُدعَم المسار المباشر بمفتاح API لـ `openai/gpt-5.5` بمجرد أن تفعّل OpenAI نموذج GPT-5.5 على واجهة API العامة؛ وحتى ذلك الحين استخدم النماذج المفعّلة عبر API مثل `openai/gpt-5.4` لإعدادات `OPENAI_API_KEY`.

## سلوك الموفّر المملوك لـ Plugin

يعيش معظم المنطق الخاص بكل موفّر داخل Plugins الخاصة بالموفّرين (`registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تتولى Plugins التهيئة، وكتالوجات النماذج، وربط متغيرات بيئة المصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف التبديل الاحتياطي، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، وغير ذلك.

توجد القائمة الكاملة لخطافات SDK الخاصة بالموفّر وأمثلة Plugins المضمّنة في [Plugins الموفّر](/ar/plugins/sdk-provider-plugins). أما الموفّر الذي يحتاج إلى منفّذ طلبات مخصص بالكامل فيُعد سطح توسعة منفصلًا وأعمق.

<Note>
تمثل `capabilities` في وقت تشغيل الموفّر بيانات وصفية مشتركة للمشغّل (عائلة الموفّر، وخصائص السجل/الأدوات، وتلميحات النقل/الذاكرة المؤقتة). وهي ليست نفسها [نموذج القدرات العام](/ar/plugins/architecture#public-capability-model)، الذي يصف ما الذي يسجله Plugin (استدلال نصي، كلام، إلخ).
</Note>

## تدوير مفاتيح API

- يدعم تدويرًا عامًا لمفاتيح الموفّر لدى موفّرين محددين.
- اضبط عدة مفاتيح عبر:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر واحد، أعلى أولوية)
  - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فاصلة منقوطة)
  - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
  - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)
- بالنسبة إلى موفّري Google، يتم تضمين `GOOGLE_API_KEY` أيضًا كخيار احتياطي.
- يحافظ ترتيب اختيار المفاتيح على الأولوية مع إزالة القيم المكررة.
- لا تُعاد محاولة الطلبات باستخدام المفتاح التالي إلا عند استجابات تجاوز المعدل (مثل `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حدود الاستخدام الدورية).
- تفشل الأخطاء غير المرتبطة بتجاوز المعدل مباشرة؛ ولا تجري أي محاولة لتدوير المفتاح.
- عند فشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من آخر محاولة.

## الموفّرون المدمجون (كتالوج pi-ai)

يأتي OpenClaw مع كتالوج pi‑ai. لا تتطلب هذه الموفّرات أي إعداد `models.providers`؛ فقط اضبط المصادقة واختر نموذجًا.

### OpenAI

- الموفّر: `openai`
- المصادقة: `OPENAI_API_KEY`
- التدوير الاختياري: `OPENAI_API_KEYS` و`OPENAI_API_KEY_1` و`OPENAI_API_KEY_2` بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز فردي)
- أمثلة النماذج: `openai/gpt-5.4`، ‏`openai/gpt-5.4-mini`
- دعم GPT-5.5 المباشر عبر API جاهز هنا للمستقبل بمجرد أن تتيح OpenAI نموذج GPT-5.5 على API
- CLI: ‏`openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE احتياطيًا)
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` ‏(`"sse"` أو `"websocket"` أو `"auto"`)
- يكون الإحماء المسبق لـ OpenAI Responses WebSocket مفعّلًا افتراضيًا عبر `params.openaiWsWarmup` ‏(`true`/`false`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة من `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحًا بدلًا من مفتاح `/fast` المشترك
- تنطبق رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء العامّين المتوافقين مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بقيمة `store` الخاصة بـ Responses، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتشكيل الحمولة المتوافق مع استدلال OpenAI؛ بينما لا تفعل مسارات الوكيل ذلك
- يتم إخفاء `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات OpenAI API الحية ترفضه، كما أن كتالوج Codex الحالي لا يعرِضه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- الموفّر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- التدوير الاختياري: `ANTHROPIC_API_KEYS` و`ANTHROPIC_API_KEY_1` و`ANTHROPIC_API_KEY_2` بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز فردي)
- مثال نموذج: `anthropic/claude-opus-4-6`
- CLI: ‏`openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح `/fast` المشترك و`params.fastMode`، بما في ذلك الحركة المرسلة بمصادقة مفتاح API وOAuth إلى `api.anthropic.com`؛ ويقوم OpenClaw بربط ذلك بـ Anthropic `service_tier` ‏(`auto` مقابل `standard_only`)
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- ما يزال رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- الموفّر: `openai-codex`
- المصادقة: OAuth ‏(ChatGPT)
- مرجع نموذج PI: ‏`openai-codex/gpt-5.5`
- مرجع حزام خادم تطبيق Codex الأصلي: ‏`openai/gpt-5.5` مع `agents.defaults.embeddedHarness.runtime: "codex"`
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يقوم `openai-codex/*` بتحميل Plugin الخاص بـ OpenAI؛ بينما لا يُختار Plugin الأصلي لخادم تطبيق Codex إلا عبر وقت تشغيل حزام Codex أو مراجع `codex/*` القديمة.
- CLI: ‏`openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE احتياطيًا)
- تجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` ‏(`"sse"` أو `"websocket"` أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` في طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- لا تُرفق رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`) إلا على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء العامّين المتوافقين مع OpenAI
- يشترك مع `openai/*` المباشر في مفتاح `/fast` وتهيئة `params.fastMode` نفسها؛ ويقوم OpenClaw بربط ذلك إلى `service_tier=priority`
- يحتفظ `openai-codex/gpt-5.5` بالقيمة الأصلية `contextWindow = 1000000` وبالحد الافتراضي وقت التشغيل `contextTokens = 272000`؛ ويمكنك تجاوز حد وقت التشغيل عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة السياسة: مصادقة OpenAI Codex عبر OAuth مدعومة صراحةً للأدوات/سير العمل الخارجية مثل OpenClaw.
- يستخدم الوصول الحالي إلى GPT-5.5 هذا المسار القائم على OAuth/الاشتراك حتى تفعّل OpenAI نموذج GPT-5.5 على واجهة API العامة.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### خيارات أخرى مستضافة على نمط الاشتراك

- [Qwen Cloud](/ar/providers/qwen): سطح موفّر Qwen Cloud بالإضافة إلى ربط نقاط نهاية Alibaba DashScope وCoding Plan
- [MiniMax](/ar/providers/minimax): وصول MiniMax Coding Plan عبر OAuth أو مفتاح API
- [GLM Models](/ar/providers/glm): نقاط نهاية Z.AI Coding Plan أو واجهات API العامة

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفّر وقت تشغيل Zen: ‏`opencode`
- موفّر وقت تشغيل Go: ‏`opencode-go`
- أمثلة النماذج: `opencode/claude-opus-4-6`، ‏`opencode-go/kimi-k2.5`
- CLI: ‏`openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- الموفّر: `google`
- المصادقة: `GEMINI_API_KEY`
- التدوير الاختياري: `GEMINI_API_KEYS` و`GEMINI_API_KEY_1` و`GEMINI_API_KEY_2` وخيار `GOOGLE_API_KEY` الاحتياطي و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز فردي)
- أمثلة النماذج: `google/gemini-3.1-pro-preview`، ‏`google/gemini-3-flash-preview`
- التوافق: تُطبَّع إعدادات OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: ‏`openclaw onboard --auth-choice gemini-api-key`
- تقبل تشغيلات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديم) لتمرير معرّف `cachedContents/...` الأصلي للموفّر؛ وتظهر إصابات ذاكرة Gemini المؤقتة في OpenClaw كـ `cacheRead`

### Google Vertex وGemini CLI

- الموفّرون: `google-vertex`، ‏`google-gemini-cli`
- المصادقة: يستخدم Vertex ‏gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به
- تحذير: تكامل OAuth الخاص بـ Gemini CLI في OpenClaw تكامل غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من أطراف خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
- يُشحن Gemini CLI OAuth كجزء من Plugin `google` المضمّن.
  - ثبّت Gemini CLI أولًا:
    - `brew install gemini-cli`
    - أو `npm install -g @google/gemini-cli`
  - التفعيل: `openclaw plugins enable google`
  - تسجيل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
  - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
  - ملاحظة: **لا** تلصق معرّف عميل أو سرًا في `openclaw.json`. يخزن تدفق تسجيل الدخول عبر CLI
    الرموز المميزة في ملفات تعريف المصادقة على مضيف Gateway.
  - إذا فشلت الطلبات بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  - تُحلَّل ردود JSON من Gemini CLI من `response`، بينما يعود الاستخدام إلى `stats`، مع تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- الموفّر: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال نموذج: `zai/glm-5.1`
- CLI: ‏`openclaw onboard --auth-choice zai-api-key`
  - الأسماء البديلة: يتم تطبيع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يقوم `zai-api-key` بالكشف التلقائي عن نقطة نهاية Z.AI المطابقة؛ بينما يفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- الموفّر: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- أمثلة النماذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`،
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: ‏`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- الموفّر: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال نموذج: `kilocode/kilo/auto`
- CLI: ‏`openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يشحن كتالوج احتياطي ثابت `kilocode/kilo/auto`؛ ويمكن لاكتشاف `https://api.kilo.ai/api/gateway/models` الحي
  أن يوسّع كتالوج وقت التشغيل أكثر.
- تملك Kilo Gateway التوجيه الفعلي في المنبع خلف `kilocode/kilo/auto`،
  وهو غير مضمّن بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للحصول على تفاصيل الإعداد.

### Plugins أخرى مدمجة للموفّرين

| الموفّر                | المعرّف                              | متغيرات بيئة المصادقة                                        | مثال على نموذج                                  |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus               | `byteplus` / `byteplus-plan`         | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras               | `cerebras`                           | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway  | `cloudflare-ai-gateway`              | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek               | `deepseek`                           | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot         | `github-copilot`                     | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                   | `groq`                               | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference | `huggingface`                        | `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway           | `kilocode`                           | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding            | `kimi`                               | `KIMI_API_KEY` أو `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                | `minimax` / `minimax-portal`         | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                | `mistral`                            | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot               | `moonshot`                           | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                 | `nvidia`                             | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter             | `openrouter`                         | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                | `qianfan`                            | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud             | `qwen`                               | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                | `stepfun` / `stepfun-plan`           | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together               | `together`                           | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                 | `venice`                             | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway      | `vercel-ai-gateway`                  | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan`    | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                    | `xai`                                | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                 | `xiaomi`                             | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

خصائص مهمة تستحق المعرفة:

- **OpenRouter** يطبّق رؤوس إسناد التطبيق وعلامات `cache_control` الخاصة بـ Anthropic فقط على المسارات المتحقق منها في `openrouter.ai`. وباعتباره مسارًا وكيليًا متوافقًا مع OpenAI، فإنه يتجاوز التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier`، و`store` الخاص بـ Responses، وتلميحات ذاكرة التخزين المؤقت للمطالبات، والتوافق مع استدلال OpenAI). تحتفظ المراجع المدعومة بـ Gemini فقط بتنقية توقيع التفكير الخاصة بـ Gemini الوكيل.
- **Kilo Gateway** تتبع المراجع المدعومة بـ Gemini فيه مسار تنقية Gemini الوكيل نفسه؛ بينما يتجاوز `kilocode/kilo/auto` وغيره من المراجع الوكيلة التي لا تدعم الاستدلال حقن الاستدلال الوكيلي.
- **MiniMax** تكتب التهيئة بمفتاح API تعريفات صريحة لنماذج M2.7 مع `input: ["text", "image"]`؛ بينما يُبقي الكتالوج المضمّن مراجع الدردشة نصية فقط إلى أن تتحقق هذه الإعدادات.
- **xAI** يستخدم مسار xAI Responses. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ ويمكن تعطيله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** تستخدم نماذج GLM القيمتين `zai-glm-4.7` و`zai-glm-4.6`؛ أما عنوان URL الأساسي المتوافق مع OpenAI فهو `https://api.cerebras.ai/v1`.

## الموفّرون عبر `models.providers` ‏(مخصص/عنوان URL أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة **موفّرين مخصصين** أو
وكلاء متوافقين مع OpenAI/Anthropic.

تنشر كثير من Plugins الموفّرين المضمّنة أدناه كتالوجًا افتراضيًا بالفعل.
استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز
عنوان URL الأساسي الافتراضي، أو الرؤوس، أو قائمة النماذج.

### Moonshot AI (Kimi)

يُشحن Moonshot كـ Plugin موفّر مضمّن. استخدم الموفّر المدمج
افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما
تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات تعريف النموذج:

- الموفّر: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال نموذج: `moonshot/kimi-k2.6`
- CLI: ‏`openclaw onboard --auth-choice moonshot-api-key` أو `openclaw onboard --auth-choice moonshot-api-key-cn`

معرّفات نماذج Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

يستخدم Kimi Coding نقطة النهاية المتوافقة مع Anthropic الخاصة بـ Moonshot AI:

- الموفّر: `kimi`
- المصادقة: `KIMI_API_KEY`
- مثال نموذج: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

لا يزال `kimi/k2p5` القديم مقبولًا كمعرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفّر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

- الموفّر: `volcengine` (الترميز: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- مثال نموذج: `volcengine-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

تستخدم التهيئة سطح الترميز افتراضيًا، لكن كتالوج `volcengine/*`
العام يُسجَّل في الوقت نفسه.

في أدوات اختيار النماذج أثناء التهيئة/الضبط، يفضّل خيار مصادقة Volcengine
كلًا من صفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن هذه النماذج
محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المفلتر بدلًا من إظهار أداة
اختيار فارغة مقيّدة بالموفّر.

النماذج المتاحة:

- `volcengine/doubao-seed-1-8-251228` ‏(Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` ‏(Kimi K2.5)
- `volcengine/glm-4-7-251222` ‏(GLM 4.7)
- `volcengine/deepseek-v3-2-251201` ‏(DeepSeek V3.2 128K)

نماذج الترميز (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (الدولي)

يوفّر BytePlus ARK الوصول إلى النماذج نفسها التي يوفّرها Volcano Engine للمستخدمين الدوليين.

- الموفّر: `byteplus` (الترميز: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- مثال نموذج: `byteplus-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

تستخدم التهيئة سطح الترميز افتراضيًا، لكن كتالوج `byteplus/*`
العام يُسجَّل في الوقت نفسه.

في أدوات اختيار النماذج أثناء التهيئة/الضبط، يفضّل خيار مصادقة BytePlus
كلًا من صفوف `byteplus/*` و`byteplus-plan/*`. وإذا لم تكن هذه النماذج
محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المفلتر بدلًا من إظهار أداة
اختيار فارغة مقيّدة بالموفّر.

النماذج المتاحة:

- `byteplus/seed-1-8-251228` ‏(Seed 1.8)
- `byteplus/kimi-k2-5-260127` ‏(Kimi K2.5)
- `byteplus/glm-4-7-251222` ‏(GLM 4.7)

نماذج الترميز (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

يوفّر Synthetic نماذج متوافقة مع Anthropic خلف الموفّر `synthetic`:

- الموفّر: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- مثال نموذج: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: ‏`openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

يُضبط MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح API لـ MiniMax (عالمي): `--auth-choice minimax-global-api`
- مفتاح API لـ MiniMax (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو
  `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) لمعرفة تفاصيل الإعداد وخيارات النماذج ومقتطفات الإعدادات.

في مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير
افتراضيًا ما لم تضبطه صراحةً، ويعيد `/fast on` كتابة
`MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

تقسيم القدرات المملوك لـ Plugin:

- تبقى إعدادات النص/الدردشة الافتراضية على `minimax/MiniMax-M2.7`
- يكون توليد الصور على `minimax/image-01` أو `minimax-portal/image-01`
- يكون فهم الصور على `MiniMax-VL-01` المملوك لـ Plugin على مساري مصادقة MiniMax كليهما
- يبقى البحث على الويب على معرّف الموفّر `minimax`

### LM Studio

يُشحن LM Studio كـ Plugin موفّر مضمّن يستخدم API الأصلي:

- الموفّر: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يُرجعها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw المسارين الأصليين لـ LM Studio ‏`/api/v1/models` و`/api/v1/models/load`
للاكتشاف + التحميل التلقائي، مع استخدام `/v1/chat/completions` للاستدلال افتراضيًا.
راجع [/providers/lmstudio](/ar/providers/lmstudio) لمعرفة الإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يُشحن Ollama كـ Plugin موفّر مضمّن ويستخدم API الأصلي الخاص بـ Ollama:

- الموفّر: `ollama`
- المصادقة: لا شيء مطلوب (خادم محلي)
- مثال نموذج: `ollama/llama3.3`
- التثبيت: [https://ollama.com/download](https://ollama.com/download)

```bash
# ثبّت Ollama، ثم اسحب نموذجًا:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

يتم اكتشاف Ollama محليًا على `http://127.0.0.1:11434` عندما تختار الاشتراك باستخدام
`OLLAMA_API_KEY`، ويضيف Plugin الموفّر المضمّن Ollama مباشرةً إلى
`openclaw onboard` وأداة اختيار النموذج. راجع [/providers/ollama](/ar/providers/ollama)
للاطلاع على التهيئة، ووضع السحابة/الوضع المحلي، والإعدادات المخصصة.

### vLLM

يُشحن vLLM كـ Plugin موفّر مضمّن لخوادم
OpenAI-compatible المحلية/المستضافة ذاتيًا:

- الموفّر: `vllm`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يُرجعها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يُشحن SGLang كـ Plugin موفّر مضمّن لخوادم
OpenAI-compatible السريعة المستضافة ذاتيًا:

- الموفّر: `sglang`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا
يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يُرجعها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### الوكلاء المحليون (LM Studio وvLLM وLiteLLM وما إلى ذلك)

مثال (متوافق مع OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

ملاحظات:

- بالنسبة إلى الموفّرين المخصصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية.
  عند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- الموصى به: اضبط قيمًا صريحة تطابق حدود الوكيل/النموذج لديك.
- بالنسبة إلى `api: "openai-completions"` على نقاط نهاية غير أصلية (أي `baseUrl` غير فارغ يكون مضيفه غير `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء الموفّر 400 للأدوار `developer` غير المدعومة.
- تتجاوز أيضًا المسارات الوكيلة المتوافقة مع OpenAI التشكيل الخاص بـ OpenAI الأصلي فقط:
  لا يوجد `service_tier`، ولا `store` الخاص بـ Responses، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات، ولا تشكيل حمولة متوافق مع استدلال OpenAI، ولا رؤوس إسناد مخفية خاصة بـ OpenClaw.
- إذا كان `baseUrl` فارغًا/غير مذكور، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
- حرصًا على السلامة، ما يزال يتم تجاوز `compat.supportsDeveloperRole: true` الصريح على نقاط نهاية `openai-completions` غير الأصلية.

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [/gateway/configuration](/ar/gateway/configuration) للحصول على أمثلة إعداد كاملة.

## ذو صلة

- [النماذج](/ar/concepts/models) — إعدادات النماذج والأسماء المستعارة
- [تجاوز فشل النموذج](/ar/concepts/model-failover) — سلاسل التبديل الاحتياطي وسلوك إعادة المحاولة
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعدادات النموذج
- [الموفّرون](/ar/providers) — أدلة إعداد كل موفّر على حدة
