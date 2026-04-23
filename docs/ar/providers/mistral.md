---
read_when:
    - تريد استخدام نماذج Mistral في OpenClaw
    - تريد نسخًا فوريًا عبر Voxtral من أجل Voice Call
    - تحتاج إلى onboarding بمفتاح Mistral API ومراجع النماذج
summary: استخدام نماذج Mistral ونسخ Voxtral مع OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T07:31:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

يدعم OpenClaw Mistral لكل من توجيه نماذج النص/الصور (`mistral/...`) ونسخ
الصوت عبر Voxtral في فهم الوسائط.
كما يمكن استخدام Mistral لتضمينات memory (`memorySearch.provider = "mistral"`).

- المزوّد: `mistral`
- المصادقة: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## البدء

<Steps>
  <Step title="Get your API key">
    أنشئ مفتاح API في [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    أو مرّر المفتاح مباشرة:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## كتالوج LLM المضمّن

يشحن OpenClaw حاليًا كتالوج Mistral المضمّن التالي:

| مرجع النموذج                        | الإدخال       | السياق | الحد الأقصى للمخرجات | ملاحظات                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | نص، صورة | 262,144 | 16,384     | النموذج الافتراضي                                                    |
| `mistral/mistral-medium-2508`    | نص، صورة | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | نص، صورة | 128,000 | 16,384     | Mistral Small 4؛ reasoning قابلة للضبط عبر API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | نص، صورة | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | نص        | 256,000 | 4,096      | للبرمجة                                                           |
| `mistral/devstral-medium-latest` | نص        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | نص        | 128,000 | 40,000     | reasoning مفعّلة                                                |

## نسخ الصوت (Voxtral)

استخدم Voxtral لنسخ الصوت الدفعي عبر
خط أنابيب فهم الوسائط.

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
يستخدم مسار نسخ الوسائط `/v1/audio/transcriptions`. النموذج الصوتي الافتراضي لـ Mistral هو `voxtral-mini-latest`.
</Tip>

## البث المباشر لتحويل الكلام إلى نص في Voice Call

يسجل Plugin المضمّن `mistral` خدمة Voxtral Realtime كمزوّد
STT للبث في Voice Call.

| الإعداد      | مسار التهيئة                                                            | الافتراضي                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| مفتاح API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | يعود إلى `MISTRAL_API_KEY`         |
| النموذج        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| الترميز     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| معدل العينة  | `...mistral.sampleRate`                                                | `8000`                                  |
| التأخير المستهدف | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
يضبط OpenClaw افتراضيًا STT الفوري الخاص بـ Mistral على `pcm_mulaw` عند 8 kHz بحيث يستطيع Voice Call
تمرير إطارات وسائط Twilio مباشرة. استخدم `encoding: "pcm_s16le"` مع
`sampleRate` مطابق فقط إذا كان التدفق الصاعد لديك PCM خامًا أصلًا.
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="Adjustable reasoning (mistral-small-latest)">
    يطابق `mistral/mistral-small-latest` النموذج Mistral Small 4 ويدعم [reasoning القابلة للضبط](https://docs.mistral.ai/capabilities/reasoning/adjustable) على Chat Completions API عبر `reasoning_effort` (`none` يقلل التفكير الإضافي في المخرجات؛ و`high` يعرض آثار التفكير الكاملة قبل الإجابة النهائية).

    يطابق OpenClaw مستوى **thinking** الخاص بالجلسة مع Mistral API:

    | مستوى thinking في OpenClaw                          | `reasoning_effort` في Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    لا تستخدم نماذج كتالوج Mistral المضمنة الأخرى هذا المعامل. واصل استخدام نماذج `magistral-*` عندما تريد سلوك Mistral الأصلي المعتمد على reasoning أولًا.
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    يمكن لـ Mistral تقديم تضمينات memory عبر `/v1/embeddings` (النموذج الافتراضي: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - تستخدم مصادقة Mistral القيمة `MISTRAL_API_KEY`.
    - يكون عنوان URL الأساسي للمزوّد افتراضيًا `https://api.mistral.ai/v1`.
    - النموذج الافتراضي في onboarding هو `mistral/mistral-large-latest`.
    - تستخدم Z.AI مصادقة Bearer باستخدام مفتاح API الخاص بك.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدات، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="Media understanding" href="/ar/nodes/media-understanding" icon="microphone">
    إعداد نسخ الصوت واختيار المزوّد.
  </Card>
</CardGroup>
