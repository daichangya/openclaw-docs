---
read_when:
    - أنت تريد استخدام models من Mistral في OpenClaw
    - أنت بحاجة إلى تهيئة Mistral API key ومراجع model
summary: استخدم models من Mistral ونسخ Voxtral مع OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-21T07:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87d04e3d45c04280c90821b1addd87dd612191249836747fba27cde48b9890f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

يدعم OpenClaw مزود Mistral لكل من توجيه models النصية/الصور (`mistral/...`) و
نسخ الصوت عبر Voxtral ضمن فهم الوسائط.
كما يمكن استخدام Mistral أيضًا من أجل embeddings الذاكرة (`memorySearch.provider = "mistral"`).

- المزوّد: `mistral`
- المصادقة: `MISTRAL_API_KEY`
- API: ‏Mistral Chat Completions (`https://api.mistral.ai/v1`)

## البدء

<Steps>
  <Step title="احصل على API key الخاص بك">
    أنشئ API key في [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="شغّل التهيئة الأولية">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    أو مرّر المفتاح مباشرةً:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="اضبط model افتراضيًا">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="تحقق من أن model متاح">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## كتالوج LLM المدمج

يشحن OpenClaw حاليًا كتالوج Mistral المجمّع التالي:

| مرجع model                        | الإدخال       | السياق | الحد الأقصى للإخراج | الملاحظات                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | نص، صورة | 262,144 | 16,384     | model الافتراضي                                                    |
| `mistral/mistral-medium-2508`    | نص، صورة | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | نص، صورة | 128,000 | 16,384     | Mistral Small 4؛ استدلال قابل للتعديل عبر `reasoning_effort` في API |
| `mistral/pixtral-large-latest`   | نص، صورة | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | نص        | 256,000 | 4,096      | للبرمجة                                                           |
| `mistral/devstral-medium-latest` | نص        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | نص        | 128,000 | 40,000     | مفعّل للاستدلال                                                |

## نسخ الصوت (Voxtral)

استخدم Voxtral لنسخ الصوت عبر مسار فهم الوسائط.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
يستخدم مسار نسخ الوسائط `/v1/audio/transcriptions`. وmodel الصوت الافتراضي لـ Mistral هو `voxtral-mini-latest`.
</Tip>

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="استدلال قابل للتعديل (mistral-small-latest)">
    يتم ربط `mistral/mistral-small-latest` مع Mistral Small 4 ويدعم [الاستدلال القابل للتعديل](https://docs.mistral.ai/capabilities/reasoning/adjustable) على Chat Completions API عبر `reasoning_effort` (`none` يقلل التفكير الإضافي في الإخراج؛ و`high` يعرض آثار التفكير الكاملة قبل الإجابة النهائية).

    يربط OpenClaw مستوى **thinking** الخاص بالجلسة مع API الخاص بـ Mistral:

    | مستوى thinking في OpenClaw                          | `reasoning_effort` في Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    لا تستخدم models الأخرى في كتالوج Mistral المجمّع هذا المعامل. استمر في استخدام models ‏`magistral-*` عندما تريد السلوك الأصلي في Mistral المبني على الاستدلال أولًا.
    </Note>

  </Accordion>

  <Accordion title="Embeddings الذاكرة">
    يمكن لـ Mistral تقديم embeddings الذاكرة عبر `/v1/embeddings` (model الافتراضي: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="المصادقة وعنوان URL الأساسي">
    - تستخدم مصادقة Mistral المتغير `MISTRAL_API_KEY`.
    - يكون عنوان URL الأساسي للمزوّد افتراضيًا `https://api.mistral.ai/v1`.
    - model الافتراضي أثناء التهيئة الأولية هو `mistral/mistral-large-latest`.
    - يستخدم Z.A.I مصادقة Bearer مع API key الخاص بك.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار model" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدات، ومراجع model، وسلوك الفشل الاحتياطي.
  </Card>
  <Card title="فهم الوسائط" href="/tools/media-understanding" icon="microphone">
    إعداد نسخ الصوت واختيار المزوّد.
  </Card>
</CardGroup>
