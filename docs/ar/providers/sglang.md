---
read_when:
    - تريد تشغيل OpenClaw مقابل خادم SGLang محلي
    - تريد نقاط نهاية `/v1` متوافقة مع OpenAI مع نماذجك الخاصة
summary: تشغيل OpenClaw مع SGLang (خادم مستضاف ذاتيًا ومتوافق مع OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T07:31:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

يمكن لـ SGLang تقديم نماذج مفتوحة المصدر عبر HTTP API **متوافق مع OpenAI**.
ويمكن لـ OpenClaw الاتصال بـ SGLang باستخدام واجهة `openai-completions` API.

كما يمكن لـ OpenClaw أيضًا **اكتشاف النماذج المتاحة تلقائيًا** من SGLang عندما تختار
ذلك عبر `SGLANG_API_KEY` (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة)
ولا تعرّف إدخالًا صريحًا `models.providers.sglang`.

يتعامل OpenClaw مع `sglang` باعتباره provider محليًا متوافقًا مع OpenAI ويدعم
محاسبة الاستخدام المتدفق، بحيث يمكن تحديث أعداد tokens الخاصة بالحالة/السياق من
استجابات `stream_options.include_usage`.

## البدء

<Steps>
  <Step title="ابدأ SGLang">
    شغّل SGLang مع خادم متوافق مع OpenAI. يجب أن يكشف base URL لديك
    نقاط نهاية `/v1` (مثل `/v1/models` و`/v1/chat/completions`). ويعمل SGLang
    عادةً على:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="اضبط مفتاح API">
    تعمل أي قيمة إذا لم تُضبط مصادقة على خادمك:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="شغّل الإعداد الأولي أو اضبط نموذجًا مباشرة">
    ```bash
    openclaw onboard
    ```

    أو اضبط النموذج يدويًا:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## اكتشاف النموذج (provider ضمني)

عندما يكون `SGLANG_API_KEY` مضبوطًا (أو يوجد ملف تعريف مصادقة) و**لا**
تعرّف `models.providers.sglang`، سيستعلم OpenClaw عن:

- `GET http://127.0.0.1:30000/v1/models`

ويحوّل المعرّفات المعادة إلى إدخالات نماذج.

<Note>
إذا ضبطت `models.providers.sglang` صراحة، فسيتم تخطي الاكتشاف التلقائي
ويجب عليك تعريف النماذج يدويًا.
</Note>

## التكوين الصريح (نماذج يدوية)

استخدم التكوين الصريح عندما:

- يعمل SGLang على مضيف/منفذ مختلف.
- تريد تثبيت قيم `contextWindow`/`maxTokens`.
- يتطلب خادمك مفتاح API حقيقيًا (أو تريد التحكم في الرؤوس).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "نموذج SGLang محلي",
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

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="سلوك بنمط Proxy">
    يُعامل SGLang على أنه backend متوافق مع OpenAI `/v1` بنمط proxy، وليس
    نقطة نهاية OpenAI أصلية.

    | السلوك | SGLang |
    |----------|--------|
    | تشكيل الطلبات الخاص بـ OpenAI فقط | غير مطبق |
    | `service_tier` و`store` الخاص بـ Responses وتلميحات prompt-cache | لا تُرسل |
    | تشكيل حمولة reasoning-compat | غير مطبق |
    | رؤوس الإسناد المخفية (`originator` و`version` و`User-Agent`) | لا تُحقن على عناوين base URL المخصصة لـ SGLang |

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    **لا يمكن الوصول إلى الخادم**

    تحقّق من أن الخادم يعمل ويستجيب:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **أخطاء المصادقة**

    إذا فشلت الطلبات بأخطاء مصادقة، فاضبط `SGLANG_API_KEY` حقيقيًا يطابق
    تكوين خادمك، أو اضبط provider صراحة تحت
    `models.providers.sglang`.

    <Tip>
    إذا كنت تشغّل SGLang من دون مصادقة، فإن أي قيمة غير فارغة لـ
    `SGLANG_API_KEY` تكفي للاشتراك في اكتشاف النماذج.
    </Tip>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار موفري الخدمة، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التكوين الكامل بما في ذلك إدخالات provider.
  </Card>
</CardGroup>
