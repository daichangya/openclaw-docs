---
read_when:
    - تحتاج إلى مرجع إعداد النماذج بحسب كل موفّر على حدة
    - تريد أمثلة على الإعدادات أو أوامر الإعداد عبر CLI لموفري النماذج
summary: نظرة عامة على موفري النماذج مع أمثلة على الإعدادات وتدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-04-25T13:45:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

مرجع **موفري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram). للاطلاع على قواعد اختيار النموذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

- تستخدم مراجع النماذج التنسيق `provider/model` (مثال: `opencode/claude-opus-4-6`).
- يعمل `agents.defaults.models` كقائمة سماح عند تعيينه.
- مساعدات CLI: ‏`openclaw onboard` و`openclaw models list` و`openclaw models set <provider/model>`.
- يُعد `models.providers.*.models[].contextWindow` بيانات تعريف أصلية للنموذج؛ أما `contextTokens` فهو الحد الفعّال في وقت التشغيل.
- قواعد التبديل الاحتياطي، وعمليات فحص التهدئة، واستمرارية تجاوزات الجلسة: [التبديل الاحتياطي للنموذج](/ar/concepts/model-failover).
- تكون مسارات عائلة OpenAI خاصة بالبادئة: يستخدم `openai/<model>` موفّر مفتاح OpenAI API المباشر في Pi، ويستخدم `openai-codex/<model>` مصادقة Codex OAuth في Pi، بينما يستخدم `openai/<model>` مع `agents.defaults.embeddedHarness.runtime: "codex"` حزام Codex الأصلي لخادم التطبيق. راجع [OpenAI](/ar/providers/openai) و[Codex harness](/ar/plugins/codex-harness). إذا كان الفصل بين الموفّر/بيئة التشغيل مربكًا، فاقرأ [بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes) أولًا.
- يتبع التمكين التلقائي لـ Plugin الحد الفاصل نفسه: ينتمي `openai-codex/<model>` إلى OpenAI plugin، بينما يتم تمكين Codex plugin بواسطة `embeddedHarness.runtime: "codex"` أو مراجع `codex/<model>` القديمة.
- تستخدم بيئات تشغيل CLI الفصل نفسه: اختر مراجع نماذج قياسية مثل `anthropic/claude-*` أو `google/gemini-*` أو `openai/gpt-*`، ثم اضبط `agents.defaults.embeddedHarness.runtime` إلى `claude-cli` أو `google-gemini-cli` أو `codex-cli` عندما تريد backend محليًا لـ CLI. تتم إعادة مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة إلى مراجع الموفّر القياسية مع تسجيل بيئة التشغيل بشكل منفصل.
- يتوفر GPT-5.5 عبر `openai-codex/gpt-5.5` في Pi، وعبر Codex harness الأصلي لخادم التطبيق، وعبر OpenAI API العام عندما يكشف كتالوج Pi المضمّن عن `openai/gpt-5.5` لتثبيتك.

## سلوك الموفّر المملوك لـ Plugin

توجد معظم المنطقيات الخاصة بكل موفّر داخل موفّرات Plugins (`registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تمتلك Plugins عملية الإعداد، وكتالوجات النماذج، وتعيين متغيرات بيئة المصادقة، وتوحيد النقل/الإعداد، وتنظيف مخطط الأدوات، وتصنيف التبديل الاحتياطي، وتحديث OAuth، والإبلاغ عن الاستخدام، وملفات تعريف Thinking/الاستدلال، وغير ذلك.

توجد القائمة الكاملة لخطافات Provider SDK وأمثلة Plugins المضمنة في [Provider plugins](/ar/plugins/sdk-provider-plugins). أما الموفّر الذي يحتاج إلى منفذ طلبات مخصص بالكامل فهو سطح امتداد منفصل وأعمق.

<Note>
تُعد `capabilities` الخاصة بوقت تشغيل الموفّر بيانات تعريف مشتركة للمشغّل (عائلة الموفّر، وخصائص transcript/الأدوات، وتلميحات النقل/cache). وهي ليست مثل [نموذج الإمكانات العام](/ar/plugins/architecture#public-capability-model)، الذي يصف ما الذي يسجله Plugin (استدلال نصي، وكلام، وغير ذلك).
</Note>

## تدوير مفاتيح API

- يدعم التدوير العام للمفاتيح لبعض الموفّرين المحددين.
- قم بتهيئة عدة مفاتيح عبر:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز حي فردي، أعلى أولوية)
  - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فاصلات منقوطة)
  - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
  - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)
- بالنسبة إلى موفّري Google، يتم تضمين `GOOGLE_API_KEY` أيضًا كخيار احتياطي.
- يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.
- لا تتم إعادة محاولة الطلبات باستخدام المفتاح التالي إلا عند استجابات تحديد المعدل (مثل `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حدود الاستخدام الدورية).
- تفشل الأخطاء غير المتعلقة بتحديد المعدل فورًا؛ ولا تتم محاولة تدوير المفاتيح.
- عندما تفشل جميع المفاتيح المرشحة، يتم إرجاع الخطأ النهائي من آخر محاولة.

## الموفّرون المضمنون (كتالوج pi-ai)

يشحن OpenClaw مع كتالوج pi‑ai. لا تتطلب هذه الموفّرات أي
إعداد `models.providers`؛ فقط اضبط المصادقة + اختر نموذجًا.

### OpenAI

- الموفّر: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS` و`OPENAI_API_KEY_1` و`OPENAI_API_KEY_2` بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز فردي)
- أمثلة للنماذج: `openai/gpt-5.5` و`openai/gpt-5.4` و`openai/gpt-5.4-mini`
- يعتمد دعم GPT-5.5 عبر API المباشر على إصدار كتالوج PI المضمّن في تثبيتك؛ تحقق باستخدام `openclaw models list --provider openai` قبل استخدام `openai/gpt-5.5` من دون بيئة تشغيل Codex app-server.
- CLI: ‏`openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع الرجوع إلى SSE)
- يمكنك التجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` ‏(`"sse"` أو `"websocket"` أو `"auto"`)
- يتم تفعيل الإحماء الافتراضي لـ OpenAI Responses WebSocket عبر `params.openaiWsWarmup` ‏(`true`/`false`)
- يمكن تمكين المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة من `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد طبقة صريحة بدلًا من مفتاح `/fast` المشترك
- تنطبق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بحقول Responses `store` وتلميحات prompt-cache وتشكيل الحمولة المتوافقة مع OpenAI reasoning؛ أما مسارات الوكيل فلا تحتفظ بها
- تم إخفاء `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات OpenAI API الحية ترفضه ولأن كتالوج Codex الحالي لا يكشف عنه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- الموفّر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS` و`ANTHROPIC_API_KEY_1` و`ANTHROPIC_API_KEY_2` بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز فردي)
- مثال للنموذج: `anthropic/claude-opus-4-6`
- CLI: ‏`openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح `/fast` المشترك و`params.fastMode`، بما في ذلك حركة المرور الموثقة بمفتاح API وOAuth المرسلة إلى `api.anthropic.com`؛ ويربط OpenClaw ذلك إلى `service_tier` في Anthropic (`auto` مقابل `standard_only`)
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مصرح بهما لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- لا يزال رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- الموفّر: `openai-codex`
- المصادقة: OAuth ‏(ChatGPT)
- مرجع نموذج PI: ‏`openai-codex/gpt-5.5`
- مرجع Codex harness الأصلي لخادم التطبيق: ‏`openai/gpt-5.5` مع `agents.defaults.embeddedHarness.runtime: "codex"`
- توثيق Codex harness الأصلي لخادم التطبيق: [Codex harness](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يؤدي `openai-codex/*` إلى تحميل OpenAI plugin؛ أما Codex app-server plugin الأصلي فلا يتم اختياره إلا بواسطة بيئة تشغيل Codex harness أو مراجع `codex/*` القديمة.
- CLI: ‏`openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع الرجوع إلى SSE)
- يمكنك التجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` ‏(`"sse"` أو `"websocket"` أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` على طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- يتم إرفاق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`) فقط على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- يشارك مفتاح `/fast` المشترك نفسه وتهيئة `params.fastMode` نفسها مع `openai/*` المباشر؛ ويربط OpenClaw ذلك إلى `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` قيمة `contextWindow = 400000` الأصلية من كتالوج Codex، والحد الافتراضي لوقت التشغيل `contextTokens = 272000`؛ ويمكنك تجاوز حد وقت التشغيل عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة السياسة: إن OpenAI Codex OAuth مدعوم صراحة للأدوات/سير العمل الخارجية مثل OpenClaw.
- استخدم `openai-codex/gpt-5.5` عندما تريد مسار Codex OAuth/الاشتراك؛ واستخدم `openai/gpt-5.5` عندما يكشف إعداد مفتاح API والكتالوج المحلي لديك عن مسار API العام.

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

### خيارات مستضافة أخرى على نمط الاشتراك

- [Qwen Cloud](/ar/providers/qwen): سطح موفّر Qwen Cloud بالإضافة إلى تعيين نقاط النهاية لـ Alibaba DashScope وCoding Plan
- [MiniMax](/ar/providers/minimax): وصول MiniMax Coding Plan عبر OAuth أو مفتاح API
- [GLM models](/ar/providers/glm): نقاط نهاية Z.AI Coding Plan أو نقاط نهاية API العامة

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفّر بيئة تشغيل Zen: ‏`opencode`
- موفّر بيئة تشغيل Go: ‏`opencode-go`
- أمثلة للنماذج: `opencode/claude-opus-4-6` و`opencode-go/kimi-k2.6`
- CLI: ‏`openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- الموفّر: `google`
- المصادقة: `GEMINI_API_KEY`
- تدوير اختياري: `GEMINI_API_KEYS` و`GEMINI_API_KEY_1` و`GEMINI_API_KEY_2` وخيار `GOOGLE_API_KEY` الاحتياطي و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز فردي)
- أمثلة للنماذج: `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview`
- التوافق: يتم توحيد إعداد OpenClaw القديم الذي يستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: ‏`openclaw onboard --auth-choice gemini-api-key`
- Thinking: يستخدم `/think adaptive` التفكير الديناميكي في Google. تحذف Gemini 3/3.1 قيمة `thinkingLevel` الثابتة؛ أما Gemini 2.5 فترسل `thinkingBudget: -1`.
- تقبل عمليات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديم) لتمرير مقبض `cachedContents/...` الأصلي للمزوّد؛ وتظهر إصابات cache في Gemini على شكل `cacheRead` في OpenClaw

### Google Vertex وGemini CLI

- الموفّرون: `google-vertex` و`google-gemini-cli`
- المصادقة: يستخدم Vertex ‏gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به
- تحذير: يُعد Gemini CLI OAuth في OpenClaw تكاملًا غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من جهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
- يتم شحن Gemini CLI OAuth كجزء من `google` plugin المضمّن.
  - ثبّت Gemini CLI أولًا:
    - `brew install gemini-cli`
    - أو `npm install -g @google/gemini-cli`
  - التمكين: `openclaw plugins enable google`
  - تسجيل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
  - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
  - ملاحظة: لا تقوم **بلصق** client id أو secret في `openclaw.json`. يخزّن تدفق تسجيل الدخول عبر CLI الرموز في ملفات تعريف المصادقة على مضيف gateway.
  - إذا فشلت الطلبات بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف gateway.
  - يتم تحليل ردود JSON الخاصة بـ Gemini CLI من `response`؛ ويعود الاستخدام إلى `stats`، مع توحيد `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- الموفّر: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال للنموذج: `zai/glm-5.1`
- CLI: ‏`openclaw onboard --auth-choice zai-api-key`
  - الأسماء البديلة: يتم توحيد `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا؛ بينما تفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- الموفّر: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- أمثلة للنماذج: `vercel-ai-gateway/anthropic/claude-opus-4.6` و`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: ‏`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- الموفّر: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال للنموذج: `kilocode/kilo/auto`
- CLI: ‏`openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يشحن كتالوج احتياطي ثابت بالنموذج `kilocode/kilo/auto`؛ ويمكن لاكتشاف
  `https://api.kilo.ai/api/gateway/models` الحي توسيع كتالوج وقت التشغيل
  بشكل إضافي.
- التوجيه الفعلي upstream خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway،
  وليس مضمّنًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للحصول على تفاصيل الإعداد.

### Plugins موفّري الخدمة المضمنة الأخرى

| الموفّر                | المعرّف                           | متغير بيئة المصادقة                                         | مثال للنموذج                                  |
| ---------------------- | -------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| BytePlus               | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                          | `byteplus-plan/ark-code-latest`               |
| Cerebras               | `cerebras`                       | `CEREBRAS_API_KEY`                                          | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway  | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                             | —                                             |
| DeepSeek               | `deepseek`                       | `DEEPSEEK_API_KEY`                                          | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot         | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`        | —                                             |
| Groq                   | `groq`                           | `GROQ_API_KEY`                                              | —                                             |
| Hugging Face Inference | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`                       | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway           | `kilocode`                       | `KILOCODE_API_KEY`                                          | `kilocode/kilo/auto`                          |
| Kimi Coding            | `kimi`                           | `KIMI_API_KEY` أو `KIMICODE_API_KEY`                        | `kimi/kimi-code`                              |
| MiniMax                | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                   | `minimax/MiniMax-M2.7`                        |
| Mistral                | `mistral`                        | `MISTRAL_API_KEY`                                           | `mistral/mistral-large-latest`                |
| Moonshot               | `moonshot`                       | `MOONSHOT_API_KEY`                                          | `moonshot/kimi-k2.6`                          |
| NVIDIA                 | `nvidia`                         | `NVIDIA_API_KEY`                                            | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter             | `openrouter`                     | `OPENROUTER_API_KEY`                                        | `openrouter/auto`                             |
| Qianfan                | `qianfan`                        | `QIANFAN_API_KEY`                                           | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud             | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                           | `stepfun/step-3.5-flash`                      |
| Together               | `together`                       | `TOGETHER_API_KEY`                                          | `together/moonshotai/Kimi-K2.5`               |
| Venice                 | `venice`                         | `VENICE_API_KEY`                                            | —                                             |
| Vercel AI Gateway      | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                        | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                    | `volcengine-plan/ark-code-latest`             |
| xAI                    | `xai`                            | `XAI_API_KEY`                                               | `xai/grok-4`                                  |
| Xiaomi                 | `xiaomi`                         | `XIAOMI_API_KEY`                                            | `xiaomi/mimo-v2-flash`                        |

خصائص تستحق المعرفة:

- **OpenRouter** يطبّق ترويسات إسناد التطبيق وعلامات Anthropic ‏`cache_control` فقط على المسارات التي تم التحقق منها إلى `openrouter.ai`. تكون مراجع DeepSeek وMoonshot وZAI مؤهلة لـ cache-TTL لتخزين Prompt cache الذي يديره OpenRouter لكنها لا تتلقى علامات cache الخاصة بـ Anthropic. وباعتباره مسارًا على نمط proxy ومتوافقًا مع OpenAI، فإنه يتخطى التشكيل الأصلي الخاص بـ OpenAI فقط (`serviceTier` وResponses ‏`store` وتلميحات prompt-cache وتوافق OpenAI reasoning). وتحافظ المراجع المعتمدة على Gemini فقط على تنقية thought-signature الخاصة بـ proxy-Gemini.
- **Kilo Gateway** تتبع المراجع المعتمدة على Gemini فيه مسار التنقية نفسه الخاص بـ proxy-Gemini؛ أما `kilocode/kilo/auto` والمراجع الأخرى التي لا تدعم reasoning عبر proxy فتتخطى حقن reasoning عبر proxy.
- **MiniMax** يكتب الإعداد باستخدام مفتاح API تعريفات صريحة لنماذج دردشة M2.7 النصية فقط؛ وتبقى ميزة فهم الصور على موفّر الوسائط `MiniMax-VL-01` المملوك لـ Plugin.
- **xAI** يستخدم مسار xAI Responses. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى صيغها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** تستخدم نماذج GLM المعرفين `zai-glm-4.7` و`zai-glm-4.6`؛ ويكون عنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.

## الموفّرون عبر `models.providers` ‏(مخصص/عنوان URL أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة موفّرين **مخصصين** أو
وكلاء متوافقين مع OpenAI/Anthropic.

تنشر العديد من Plugins المضمنة لموفّري الخدمة أدناه كتالوجًا افتراضيًا بالفعل.
استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز
عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

### Moonshot AI (Kimi)

يشحن Moonshot كـ Plugin موفّر خدمة مضمن. استخدم الموفّر المضمن افتراضيًا،
وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما تحتاج إلى تجاوز
عنوان URL الأساسي أو بيانات تعريف النموذج:

- الموفّر: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال للنموذج: `moonshot/kimi-k2.6`
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
- مثال للنموذج: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

يبقى `kimi/k2p5` القديم مقبولًا كمعرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى داخل الصين.

- الموفّر: `volcengine` (للترميز: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- مثال للنموذج: `volcengine-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

يفترض الإعداد الأولي افتراضيًا سطح الترميز، لكن يتم تسجيل كتالوج
`volcengine/*` العام في الوقت نفسه.

في أدوات الاختيار الخاصة بالإعداد الأولي/تهيئة النموذج، يفضّل خيار مصادقة Volcengine
صفوف `volcengine/*` و`volcengine-plan/*` معًا. وإذا لم تكن هذه النماذج
محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المفلتر بدلًا من عرض أداة اختيار
فارغة مقيّدة بالموفّر.

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

يوفر BytePlus ARK الوصول إلى النماذج نفسها التي يوفرها Volcano Engine للمستخدمين الدوليين.

- الموفّر: `byteplus` (للترميز: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- مثال للنموذج: `byteplus-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

يفترض الإعداد الأولي افتراضيًا سطح الترميز، لكن يتم تسجيل كتالوج
`byteplus/*` العام في الوقت نفسه.

في أدوات الاختيار الخاصة بالإعداد الأولي/تهيئة النموذج، يفضّل خيار مصادقة BytePlus
صفوف `byteplus/*` و`byteplus-plan/*` معًا. وإذا لم تكن هذه النماذج
محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المفلتر بدلًا من عرض أداة اختيار
فارغة مقيّدة بالموفّر.

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

يوفر Synthetic نماذج متوافقة مع Anthropic خلف الموفّر `synthetic`:

- الموفّر: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- مثال للنموذج: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

يتم تكوين MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth ‏(عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth ‏(الصين): `--auth-choice minimax-cn-oauth`
- مفتاح MiniMax API ‏(عالمي): `--auth-choice minimax-global-api`
- مفتاح MiniMax API ‏(الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو
  `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للحصول على تفاصيل الإعداد وخيارات النماذج ومقتطفات الإعداد.

في مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw ميزة Thinking
افتراضيًا ما لم تضبطها صراحة، ويعيد `/fast on` كتابة
`MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

تقسيم الإمكانات المملوك لـ Plugin:

- تبقى الإعدادات الافتراضية للنص/الدردشة على `minimax/MiniMax-M2.7`
- يكون توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- يكون فهم الصور على `MiniMax-VL-01` المملوك لـ Plugin في مساري مصادقة MiniMax كليهما
- يبقى البحث على الويب على معرّف الموفّر `minimax`

### LM Studio

يشحن LM Studio كـ Plugin موفّر خدمة مضمن يستخدم API الأصلية:

- الموفّر: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

بعد ذلك اضبط نموذجًا (استبدله بأحد المعرّفات المعادة من `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw المسارين الأصليين لـ LM Studio ‏`/api/v1/models` و`/api/v1/models/load` لاكتشاف النماذج + التحميل التلقائي، مع استخدام `/v1/chat/completions` للاستدلال افتراضيًا.
راجع [/providers/lmstudio](/ar/providers/lmstudio) للحصول على الإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يشحن Ollama كـ Plugin موفّر خدمة مضمن ويستخدم API الأصلية لـ Ollama:

- الموفّر: `ollama`
- المصادقة: لا يلزم شيء (خادم محلي)
- مثال للنموذج: `ollama/llama3.3`
- التثبيت: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

يتم اكتشاف Ollama محليًا على `http://127.0.0.1:11434` عندما تشترك عبر
`OLLAMA_API_KEY`، ويضيف Plugin المضمن لموفّر الخدمة Ollama مباشرة إلى
`openclaw onboard` وأداة اختيار النموذج. راجع [/providers/ollama](/ar/providers/ollama)
للاطلاع على الإعداد الأولي ووضع السحابة/الوضع المحلي والإعداد المخصص.

### vLLM

يشحن vLLM كـ Plugin موفّر خدمة مضمن للخوادم المحلية/المستضافة ذاتيًا
المتوافقة مع OpenAI:

- الموفّر: `vllm`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

بعد ذلك اضبط نموذجًا (استبدله بأحد المعرّفات المعادة من `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للحصول على التفاصيل.

### SGLang

يشحن SGLang كـ Plugin موفّر خدمة مضمن للخوادم السريعة المستضافة ذاتيًا
المتوافقة مع OpenAI:

- الموفّر: `sglang`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا
يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

بعد ذلك اضبط نموذجًا (استبدله بأحد المعرّفات المعادة من `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للحصول على التفاصيل.

### الوكلاء المحليون (LM Studio وvLLM وLiteLLM وغير ذلك)

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
  وعند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- الموصى به: اضبط قيمًا صريحة تطابق حدود الوكيل/النموذج لديك.
- بالنسبة إلى `api: "openai-completions"` على نقاط نهاية غير أصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 الخاصة بالموفّر الناتجة عن أدوار `developer` غير المدعومة.
- كما تتخطى المسارات المتوافقة مع OpenAI على نمط proxy تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط: لا `service_tier`، ولا Responses ‏`store`، ولا Completions ‏`store`، ولا تلميحات prompt-cache، ولا تشكيل حمولة متوافق مع OpenAI reasoning، ولا ترويسات إسناد مخفية خاصة بـ OpenClaw.
- بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في متن الطلب الصادر.
- إذا كان `baseUrl` فارغًا/غير مذكور، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
- ومن أجل الأمان، يظل تجاوز `compat.supportsDeveloperRole: true` الصريح مُعاد الضبط على نقاط نهاية `openai-completions` غير الأصلية.

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [الإعداد](/ar/gateway/configuration) للحصول على أمثلة إعداد كاملة.

## ذو صلة

- [النماذج](/ar/concepts/models) — إعداد النموذج والأسماء البديلة
- [التبديل الاحتياطي للنموذج](/ar/concepts/model-failover) — سلاسل التراجع وسلوك إعادة المحاولة
- [مرجع الإعداد](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعداد النموذج
- [الموفّرون](/ar/providers) — أدلة الإعداد الخاصة بكل موفّر
