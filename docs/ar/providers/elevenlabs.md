---
read_when:
    - تريد استخدام تحويل النص إلى كلام من ElevenLabs في OpenClaw
    - تريد استخدام Scribe speech-to-text من ElevenLabs للمرفقات الصوتية
    - تريد استخدام النسخ الفوري من ElevenLabs لـ Voice Call
summary: استخدام كلام ElevenLabs وScribe STT والنسخ الفوري مع OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T07:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

يستخدم OpenClaw خدمة ElevenLabs لتحويل النص إلى كلام، وتحويل الكلام إلى نص دفعيًا باستخدام Scribe
v2، وتحويل الكلام إلى نص بشكل متدفق في Voice Call باستخدام Scribe v2 Realtime.

| الإمكانية | سطح OpenClaw | الافتراضي |
| --------- | ------------ | ---------- |
| تحويل النص إلى كلام | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| تحويل الكلام إلى نص دفعيًا | `tools.media.audio` | `scribe_v2` |
| تحويل الكلام إلى نص بشكل متدفق | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime` |

## المصادقة

اضبط `ELEVENLABS_API_KEY` في البيئة. كما يُقبل `XI_API_KEY` أيضًا
للتوافق مع أدوات ElevenLabs الموجودة.

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

## تحويل الكلام إلى نص

استخدم Scribe v2 للمرفقات الصوتية الواردة ومقاطع الصوت القصيرة المسجلة:

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

يرسل OpenClaw الصوت متعدد الأجزاء إلى نقطة النهاية `/v1/speech-to-text` في ElevenLabs مع
`model_id: "scribe_v2"`. ويتم ربط تلميحات اللغة إلى `language_code` عند وجودها.

## تحويل الكلام إلى نص بشكل متدفق في Voice Call

يسجل Plugin المضمّن `elevenlabs` خدمة Scribe v2 Realtime لتحويل
الكلام المتدفق إلى نص في Voice Call.

| الإعداد | مسار الإعدادات | الافتراضي |
| ------- | -------------- | ---------- |
| مفتاح API | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | يعود إلى `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| النموذج | `...elevenlabs.modelId` | `scribe_v2_realtime` |
| تنسيق الصوت | `...elevenlabs.audioFormat` | `ulaw_8000` |
| معدل العينة | `...elevenlabs.sampleRate` | `8000` |
| استراتيجية الالتزام | `...elevenlabs.commitStrategy` | `vad` |
| اللغة | `...elevenlabs.languageCode` | (غير مضبوط) |

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
يتلقى Voice Call وسائط Twilio بصيغة 8 kHz G.711 u-law. ويكون مزوّد ElevenLabs realtime
مضبوطًا افتراضيًا على `ulaw_8000`، لذلك يمكن تمرير إطارات الهاتف من دون
إعادة ترميز.
</Note>
