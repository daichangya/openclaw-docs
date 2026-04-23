---
read_when:
    - تريد تحويل الكلام إلى نص من Deepgram للمرفقات الصوتية
    - تريد نسخًا متدفقًا من Deepgram لـ Voice Call
    - تحتاج إلى مثال إعدادات سريع لـ Deepgram
summary: نسخ Deepgram للمذكرات الصوتية الواردة
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T07:30:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (نسخ الصوت)

Deepgram هي واجهة برمجة تطبيقات لتحويل الكلام إلى نص. وتُستخدم في OpenClaw من أجل
نسخ الصوت/المذكرات الصوتية الواردة عبر `tools.media.audio` ومن أجل STT
المتدفق في Voice Call عبر `plugins.entries.voice-call.config.streaming`.

بالنسبة إلى النسخ الدفعي، يرفع OpenClaw ملف الصوت الكامل إلى Deepgram
ويحقن النص المنسوخ في مسار الرد (`{{Transcript}}` +
الكتلة `[Audio]`). أما بالنسبة إلى النسخ المتدفق في Voice Call، فيقوم OpenClaw بتمرير
إطارات G.711 u-law الحية عبر نقطة نهاية WebSocket `listen` الخاصة بـ Deepgram ويصدر النصوص الجزئية أو
النهائية عند إرجاعها من Deepgram.

| التفصيل        | القيمة                                                      |
| ------------- | ---------------------------------------------------------- |
| الموقع       | [deepgram.com](https://deepgram.com)                       |
| الوثائق          | [developers.deepgram.com](https://developers.deepgram.com) |
| المصادقة          | `DEEPGRAM_API_KEY`                                         |
| النموذج الافتراضي | `nova-3`                                                   |

## البدء

<Steps>
  <Step title="اضبط مفتاح API الخاص بك">
    أضف مفتاح Deepgram API إلى البيئة:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="فعّل مزود الصوت">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="أرسل مذكرة صوتية">
    أرسل رسالة صوتية عبر أي قناة متصلة. سيقوم OpenClaw بنسخها
    عبر Deepgram وحقن النص المنسوخ في مسار الرد.
  </Step>
</Steps>

## خيارات الإعدادات

| الخيار            | المسار                                                         | الوصف                           |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | معرّف نموذج Deepgram (الافتراضي: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | تلميح اللغة (اختياري)              |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | تفعيل اكتشاف اللغة (اختياري)  |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | تفعيل علامات الترقيم (اختياري)         |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | تفعيل التنسيق الذكي (اختياري)    |

<Tabs>
  <Tab title="مع تلميح اللغة">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="مع خيارات Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## STT المتدفق في Voice Call

يسجل Plugin ‏`deepgram` المضمّن أيضًا مزود نسخ فوري
لـ Plugin ‏Voice Call.

| الإعداد         | مسار الإعدادات                                                             | الافتراضي                          |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| مفتاح API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | يعود إلى `DEEPGRAM_API_KEY` |
| النموذج           | `...deepgram.model`                                                     | `nova-3`                         |
| اللغة        | `...deepgram.language`                                                  | (غير مضبوط)                          |
| الترميز        | `...deepgram.encoding`                                                  | `mulaw`                          |
| معدل العينة     | `...deepgram.sampleRate`                                                | `8000`                           |
| تحديد النهاية     | `...deepgram.endpointingMs`                                             | `800`                            |
| النتائج المرحلية | `...deepgram.interimResults`                                            | `true`                           |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
يتلقى Voice Call الصوت الهاتفي بصيغة 8 kHz G.711 u-law. ويستخدم مزود
البث المتدفق في Deepgram افتراضيًا `encoding: "mulaw"` و`sampleRate: 8000`, لذلك
يمكن تمرير إطارات وسائط Twilio مباشرة.
</Note>

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    تتبع المصادقة ترتيب مصادقة المزوّد القياسي. ويُعد `DEEPGRAM_API_KEY`
    أبسط مسار.
  </Accordion>
  <Accordion title="Proxy ونقاط النهاية المخصصة">
    تجاوز نقاط النهاية أو الرؤوس باستخدام `tools.media.audio.baseUrl` و
    `tools.media.audio.headers` عند استخدام proxy.
  </Accordion>
  <Accordion title="سلوك الإخراج">
    يتبع الإخراج قواعد الصوت نفسها الخاصة بالمزوّدين الآخرين (حدود الحجم، والمهلات،
    وحقن النص المنسوخ).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="أدوات الوسائط" href="/ar/tools/media-overview" icon="photo-film">
    نظرة عامة على مسار معالجة الصوت والصورة والفيديو.
  </Card>
  <Card title="التهيئة" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعدادات الكامل بما في ذلك إعدادات أداة الوسائط.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات التصحيح.
  </Card>
  <Card title="الأسئلة الشائعة" href="/ar/help/faq" icon="circle-question">
    الأسئلة الشائعة حول إعداد OpenClaw.
  </Card>
</CardGroup>
