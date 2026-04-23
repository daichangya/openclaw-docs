---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج مفتوحة المصدر عبر LM Studio
    - تريد إعداد LM Studio وتهيئته
summary: شغّل OpenClaw باستخدام LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T14:01:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062b26cf10631e74f4e1917ea9011133eb4433f5fb7ee85748d00080a6ca212d
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

يُعد LM Studio تطبيقًا سهل الاستخدام لكنه قوي لتشغيل النماذج مفتوحة الأوزان على عتادك الخاص. يتيح لك تشغيل نماذج llama.cpp ‏(GGUF) أو MLX ‏(Apple Silicon). ويتوفر كحزمة GUI أو daemon بدون واجهة (`llmster`). للاطلاع على وثائق المنتج والإعداد، راجع [lmstudio.ai](https://lmstudio.ai/).

## البدء السريع

1. ثبّت LM Studio ‏(سطح المكتب) أو `llmster` ‏(بدون واجهة)، ثم ابدأ الخادم المحلي:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. ابدأ الخادم

تأكد من أنك إما تشغّل تطبيق سطح المكتب أو تشغّل daemon باستخدام الأمر التالي:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

إذا كنت تستخدم التطبيق، فتأكد من تفعيل JIT للحصول على تجربة سلسة. تعرّف على المزيد في [دليل JIT وTTL في LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. يتطلب OpenClaw قيمة token خاصة بـ LM Studio. اضبط `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

إذا كانت المصادقة في LM Studio معطلة، فاستخدم أي قيمة token غير فارغة:

```bash
export LM_API_TOKEN="placeholder-key"
```

للحصول على تفاصيل إعداد المصادقة في LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. شغّل الإعداد الأولي واختر `LM Studio`:

```bash
openclaw onboard
```

5. أثناء الإعداد الأولي، استخدم مطالبة `Default model` لاختيار نموذج LM Studio الخاص بك.

يمكنك أيضًا ضبطه أو تغييره لاحقًا:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

تتبع مفاتيح النماذج في LM Studio تنسيق `author/model-name` ‏(مثل `qwen/qwen3.5-9b`). وتضيف مراجع النماذج في OpenClaw
اسم المزوّد في البداية: `lmstudio/qwen/qwen3.5-9b`. ويمكنك العثور على المفتاح الدقيق
لنموذج ما عبر تشغيل `curl http://localhost:1234/api/v1/models` والنظر إلى الحقل `key`.

## الإعداد الأولي غير التفاعلي

استخدم الإعداد الأولي غير التفاعلي عندما تريد أتمتة الإعداد (CI، أو التهيئة، أو bootstrap عن بُعد):

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

يأخذ `--custom-model-id` مفتاح النموذج كما يعيده LM Studio ‏(مثل `qwen/qwen3.5-9b`) من دون
بادئة المزوّد `lmstudio/`.

يتطلب الإعداد الأولي غير التفاعلي `--lmstudio-api-key` (أو `LM_API_TOKEN` في env).
وبالنسبة إلى خوادم LM Studio غير الموثقة، فإن أي قيمة token غير فارغة تعمل.

ما يزال `--custom-api-key` مدعومًا للتوافق، لكن `--lmstudio-api-key` هو المفضل مع LM Studio.

يؤدي هذا إلى كتابة `models.providers.lmstudio`، وضبط النموذج الافتراضي إلى
`lmstudio/<custom-model-id>`، وكتابة ملف تعريف auth ‏`lmstudio:default`.

يمكن للإعداد التفاعلي أن يطلب طول preferred load context اختياريًا ويطبقه على نماذج LM Studio المكتشفة التي يحفظها في config.

## الإعدادات

### توافق استخدام البث

يتوافق LM Studio مع streaming-usage. وعندما لا يصدر كائن `usage`
بصيغة OpenAI، يستعيد OpenClaw أعداد tokens من بيانات
`timings.prompt_n` / `timings.predicted_n` الوصفية بصيغة llama.cpp بدلًا من ذلك.

ينطبق السلوك نفسه على backends المحلية المتوافقة مع OpenAI التالية:

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

تأكد من أن LM Studio قيد التشغيل وأنك ضبطت `LM_API_TOKEN` (وبالنسبة إلى الخوادم غير الموثقة، فإن أي قيمة token غير فارغة تعمل):

```bash
# ابدأ عبر تطبيق سطح المكتب، أو بدون واجهة:
lms server start --port 1234
```

تحقق من أن API متاحة:

```bash
curl http://localhost:1234/api/v1/models
```

### أخطاء المصادقة (HTTP 401)

إذا أبلغ الإعداد عن HTTP 401، فتحقق من مفتاح API الخاص بك:

- تأكد من أن `LM_API_TOKEN` يطابق المفتاح المضبوط في LM Studio.
- للحصول على تفاصيل إعداد المصادقة في LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- إذا كان خادمك لا يتطلب مصادقة، فاستخدم أي قيمة token غير فارغة لـ `LM_API_TOKEN`.

### التحميل الفوري للنموذج

يدعم LM Studio التحميل الفوري للنموذج (JIT)، حيث تُحمَّل النماذج عند أول طلب. تأكد من تفعيل هذا لتجنب أخطاء "Model not loaded".
