---
read_when:
    - تريد تشغيل OpenClaw مع نماذج مفتوحة المصدر عبر LM Studio
    - تريد إعداد LM Studio وتهيئته
summary: شغّل OpenClaw مع LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T07:31:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 733527e95041da04562c0ee5d9486750d8355a255624a6d5735954de34429a5c
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio هو تطبيق سهل الاستخدام وقوي لتشغيل النماذج ذات الأوزان المفتوحة على عتادك الخاص. ويتيح لك تشغيل نماذج llama.cpp ‏(GGUF) أو MLX ‏(على Apple Silicon). ويتوفر ضمن حزمة GUI أو كخادم بدون واجهة (`llmster`). وللاطلاع على وثائق المنتج والإعداد، راجع [lmstudio.ai](https://lmstudio.ai/).

## البدء السريع

1. ثبّت LM Studio (سطح المكتب) أو `llmster` (بدون واجهة)، ثم ابدأ تشغيل الخادم المحلي:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. ابدأ تشغيل الخادم

تأكد من أنك إما بدأت تطبيق سطح المكتب أو شغّلت الخادم باستخدام الأمر التالي:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

إذا كنت تستخدم التطبيق، فتأكد من تفعيل JIT للحصول على تجربة سلسة. تعرّف أكثر في [دليل LM Studio حول JIT وTTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. يتطلب OpenClaw قيمة token لـ LM Studio. اضبط `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

إذا كانت مصادقة LM Studio معطلة، فاستخدم أي قيمة token غير فارغة:

```bash
export LM_API_TOKEN="placeholder-key"
```

للحصول على تفاصيل إعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. شغّل الإعداد الأولي واختر `LM Studio`:

```bash
openclaw onboard
```

5. في الإعداد الأولي، استخدم مطالبة `Default model` لاختيار نموذج LM Studio الخاص بك.

يمكنك أيضًا ضبطه أو تغييره لاحقًا:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

تتبع مفاتيح نماذج LM Studio تنسيق `author/model-name` (مثل `qwen/qwen3.5-9b`). وتسبق مراجع
النماذج في OpenClaw اسم المزوّد: `lmstudio/qwen/qwen3.5-9b`. ويمكنك العثور على المفتاح الدقيق
للنموذج عبر تشغيل `curl http://localhost:1234/api/v1/models` والنظر إلى الحقل `key`.

## الإعداد الأولي غير التفاعلي

استخدم الإعداد الأولي غير التفاعلي عندما تريد برمجة الإعداد نصيًا (CI، أو التزويد، أو التمهيد البعيد):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

أو حدّد base URL أو النموذج مع مفتاح API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

تأخذ `--custom-model-id` مفتاح النموذج كما يعيده LM Studio (مثل `qwen/qwen3.5-9b`) من دون
بادئة المزوّد `lmstudio/`.

يتطلب الإعداد الأولي غير التفاعلي `--lmstudio-api-key` (أو `LM_API_TOKEN` في env).
وبالنسبة إلى خوادم LM Studio غير المصادق عليها، تعمل أي قيمة token غير فارغة.

يبقى `--custom-api-key` مدعومًا للتوافق، لكن `--lmstudio-api-key` هو المفضل لـ LM Studio.

يكتب هذا `models.providers.lmstudio`، ويضبط النموذج الافتراضي على
`lmstudio/<custom-model-id>`, ويكتب ملف تعريف المصادقة `lmstudio:default`.

يمكن أن يطلب الإعداد التفاعلي طول سياق تحميل مفضّلًا اختياريًا ويطبقه على نماذج LM Studio المكتشفة التي يحفظها في الإعدادات.

## الإعدادات

### توافق استخدام البث المتدفق

يضع OpenClaw علامة على LM Studio على أنه متوافق مع استخدام البث المتدفق، لذلك لم يعد حساب الرموز يتدهور إلى إجماليات مجهولة أو قديمة في الإكمالات المتدفقة. كما يستعيد OpenClaw أيضًا أعداد الرموز من بيانات `timings.prompt_n` / `timings.predicted_n` الوصفية على نمط llama.cpp عندما لا يرسل LM Studio كائن `usage` بشكل OpenAI.

واجهات خلفية محلية أخرى متوافقة مع OpenAI يشملها السلوك نفسه:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### إعدادات صريحة

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

### لم يتم اكتشاف LM Studio

تأكد من أن LM Studio يعمل وأنك ضبطت `LM_API_TOKEN` (وبالنسبة إلى الخوادم غير المصادق عليها، تعمل أي قيمة token غير فارغة):

```bash
# ابدأ عبر تطبيق سطح المكتب، أو بدون واجهة:
lms server start --port 1234
```

تحقق من أن API قابلة للوصول:

```bash
curl http://localhost:1234/api/v1/models
```

### أخطاء المصادقة (HTTP 401)

إذا أبلغ الإعداد عن HTTP 401، فتحقق من مفتاح API الخاص بك:

- تأكد من أن `LM_API_TOKEN` يطابق المفتاح المضبوط في LM Studio.
- للحصول على تفاصيل إعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- إذا كان الخادم لديك لا يتطلب مصادقة، فاستخدم أي قيمة token غير فارغة لـ `LM_API_TOKEN`.

### تحميل النموذج عند الطلب

يدعم LM Studio تحميل النموذج عند الطلب (JIT)، حيث تُحمَّل النماذج عند أول طلب. تأكد من تفعيل ذلك لتجنب أخطاء 'Model not loaded'.
