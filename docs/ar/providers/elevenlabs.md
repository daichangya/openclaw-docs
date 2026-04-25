---
read_when:
    - تريد تحويل النص إلى كلام باستخدام ElevenLabs في OpenClaw
    - تريد تحويل الكلام إلى نص باستخدام ElevenLabs Scribe لمرفقات الصوت
    - تريد النسخ الفوري باستخدام ElevenLabs لـ Voice Call
summary: استخدم الكلام من ElevenLabs، وScribe STT، والنسخ الفوري مع OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:56:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

يستخدم OpenClaw خدمة ElevenLabs لتحويل النص إلى كلام، وتحويل الكلام إلى نص دفعيًا باستخدام Scribe
v2، وكذلك للنسخ المتدفق في Voice Call باستخدام Scribe v2 Realtime.

| القدرة                  | سطح OpenClaw                                  | الافتراضي               |
| ----------------------- | --------------------------------------------- | ----------------------- |
| تحويل النص إلى كلام     | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| تحويل الكلام إلى نص دفعيًا | `tools.media.audio`                        | `scribe_v2`             |
| تحويل الكلام إلى نص متدفق | Voice Call ‏`streaming.provider: "elevenlabs"` | `scribe_v2_realtime`    |

## المصادقة

اضبط `ELEVENLABS_API_KEY` في البيئة. كما يتم قبول `XI_API_KEY` أيضًا من أجل
التوافق مع أدوات ElevenLabs الحالية.

```bash
export ELEVENLABS_API_KEY="..."
```

## تحويل النص إلى كلام

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

اضبط `modelId` على `eleven_v3` لاستخدام ElevenLabs v3 TTS. ويحافظ OpenClaw على
`eleven_multilingual_v2` كافتراضي للتثبيتات الحالية.

## تحويل الكلام إلى نص

استخدم Scribe v2 لمرفقات الصوت الواردة ولمقاطع الصوت المسجلة القصيرة:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

يرسل OpenClaw الصوت متعدد الأجزاء إلى ElevenLabs عبر `/v1/speech-to-text` مع
`model_id: "scribe_v2"`. ويتم ربط تلميحات اللغة إلى `language_code` عند وجودها.

## النسخ المتدفق في Voice Call

تسجّل Plugin المجمّعة `elevenlabs` خدمة Scribe v2 Realtime من أجل
النسخ المتدفق في Voice Call.

| الإعداد           | مسار التهيئة                                                                 | الافتراضي                                           |
| ----------------- | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| مفتاح API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`    | يعود إلى `ELEVENLABS_API_KEY` / `XI_API_KEY`        |
| النموذج           | `...elevenlabs.modelId`                                                      | `scribe_v2_realtime`                                |
| تنسيق الصوت       | `...elevenlabs.audioFormat`                                                  | `ulaw_8000`                                         |
| معدل العينة       | `...elevenlabs.sampleRate`                                                   | `8000`                                              |
| استراتيجية الالتزام | `...elevenlabs.commitStrategy`                                             | `vad`                                               |
| اللغة             | `...elevenlabs.languageCode`                                                 | (غير معيّنة)                                        |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
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
تتلقى Voice Call وسائط Twilio بصيغة G.711 u-law عند 8 kHz. ويكون
موفّر ElevenLabs الفوري مضبوطًا افتراضيًا على `ulaw_8000`، بحيث يمكن تمرير إطارات الهاتف
من دون إعادة ترميز.
</Note>

## ذو صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [اختيار النموذج](/ar/concepts/model-providers)
