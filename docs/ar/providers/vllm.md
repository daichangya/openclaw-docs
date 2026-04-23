---
read_when:
    - تريد تشغيل OpenClaw مقابل خادم vLLM محلي
    - تريد نقاط نهاية `/v1` متوافقة مع OpenAI مع نماذجك الخاصة
summary: تشغيل OpenClaw مع vLLM (خادم محلي متوافق مع OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-23T07:31:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6c4ceeb59cc10079630e45263485747eadfc66a66267d27579f466d0c0a91a1
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

يمكن لـ vLLM تقديم نماذج مفتوحة المصدر (وبعض النماذج المخصصة) عبر HTTP API **متوافقة مع OpenAI**. يتصل OpenClaw بـ vLLM باستخدام API من نوع `openai-completions`.

كما يمكن لـ OpenClaw أيضًا **اكتشاف النماذج المتاحة تلقائيًا** من vLLM عندما تفعّل ذلك باستخدام `VLLM_API_KEY` (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة) ولا تعرّف إدخالًا صريحًا لـ `models.providers.vllm`.

يتعامل OpenClaw مع `vllm` على أنه مزود محلي متوافق مع OpenAI ويدعم
محاسبة الاستخدام المتدفقة، بحيث يمكن تحديث عدّادات status/context token من
استجابات `stream_options.include_usage`.

| الخاصية         | القيمة                                    |
| ---------------- | ---------------------------------------- |
| معرّف المزوّد      | `vllm`                                   |
| API              | `openai-completions` (متوافق مع OpenAI) |
| المصادقة             | متغير البيئة `VLLM_API_KEY`      |
| عنوان URL الأساسي الافتراضي | `http://127.0.0.1:8000/v1`               |

## البدء

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    يجب أن يكشف عنوان URL الأساسي لديك نقاط نهاية `/v1` (مثل `/v1/models` و`/v1/chat/completions`). يعمل vLLM عادةً على:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    استبدل ذلك بأحد معرّفات نماذج vLLM الخاصة بك:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## اكتشاف النماذج (المزوّد الضمني)

عندما تكون `VLLM_API_KEY` مضبوطة (أو يوجد ملف تعريف مصادقة) و**لا** تعرّف `models.providers.vllm`، يستعلم OpenClaw من:

```
GET http://127.0.0.1:8000/v1/models
```

ثم يحوّل المعرّفات المعادة إلى إدخالات نماذج.

<Note>
إذا ضبطت `models.providers.vllm` صراحةً، فسيتم تخطي الاكتشاف التلقائي ويجب عليك تعريف النماذج يدويًا.
</Note>

## التهيئة الصريحة (نماذج يدوية)

استخدم التهيئة الصريحة عندما:

- يعمل vLLM على مضيف أو منفذ مختلف
- تريد تثبيت قيم `contextWindow` أو `maxTokens`
- يتطلب خادمك مفتاح API حقيقيًا (أو تريد التحكم في headers)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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

## ملاحظات متقدمة

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    يُعامل vLLM على أنه خلفية `/v1` متوافقة مع OpenAI بأسلوب proxy، وليس
    نقطة نهاية OpenAI أصلية. وهذا يعني:

    | السلوك | هل يُطبّق؟ |
    |----------|----------|
    | تشكيل طلبات OpenAI الأصلية | لا |
    | `service_tier` | لا يُرسل |
    | Responses `store` | لا يُرسل |
    | تلميحات Prompt-cache | لا تُرسل |
    | تشكيل الحمولة المتوافق مع reasoning في OpenAI | لا يُطبّق |
    | headers نسبة OpenClaw المخفية | لا تُحقن على عناوين URL الأساسية المخصصة |

  </Accordion>

  <Accordion title="Custom base URL">
    إذا كان خادم vLLM لديك يعمل على مضيف أو منفذ غير افتراضي، فاضبط `baseUrl` في تهيئة المزوّد الصريحة:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="Server not reachable">
    تحقق من أن خادم vLLM يعمل ويمكن الوصول إليه:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    إذا رأيت خطأ اتصال، فتحقق من المضيف والمنفذ، ومن أن vLLM بدأ باستخدام وضع الخادم المتوافق مع OpenAI.

  </Accordion>

  <Accordion title="Auth errors on requests">
    إذا فشلت الطلبات بأخطاء مصادقة، فاضبط `VLLM_API_KEY` حقيقيًا يطابق تهيئة خادمك، أو هيّئ المزوّد صراحةً تحت `models.providers.vllm`.

    <Tip>
    إذا كان خادم vLLM لديك لا يفرض المصادقة، فإن أي قيمة غير فارغة لـ `VLLM_API_KEY` تعمل كإشارة تفعيل اختيارية لـ OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    يتطلب الاكتشاف التلقائي أن تكون `VLLM_API_KEY` مضبوطة **و** ألا يوجد إدخال تهيئة صريح لـ `models.providers.vllm`. وإذا كنت قد عرّفت المزوّد يدويًا، فسيتخطى OpenClaw الاكتشاف ويستخدم فقط النماذج التي أعلنت عنها.
  </Accordion>
</AccordionGroup>

<Warning>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدات، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="OpenAI" href="/ar/providers/openai" icon="bolt">
    مزود OpenAI الأصلي وسلوك المسارات المتوافقة مع OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
