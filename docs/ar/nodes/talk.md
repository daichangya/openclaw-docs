---
read_when:
    - تنفيذ وضع Talk على macOS/iOS/Android
    - تغيير سلوك الصوت/TTS/المقاطعة
summary: 'وضع Talk: محادثات صوتية مستمرة مع مزوّدي TTS المكوّنين'
title: وضع Talk
x-i18n:
    generated_at: "2026-04-25T13:51:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

وضع Talk هو حلقة محادثة صوتية مستمرة:

1. الاستماع إلى الكلام
2. إرسال النص المنسوخ إلى النموذج (الجلسة الرئيسية، `chat.send`)
3. انتظار الرد
4. نطقه عبر مزود Talk المكوّن (`talk.speak`)

## السلوك (macOS)

- **تراكب دائم التشغيل** ما دام وضع Talk مفعّلًا.
- انتقالات بين المراحل: **الاستماع → التفكير → التحدث**.
- عند حدوث **توقف قصير** (نافذة صمت)، يتم إرسال النص المنسوخ الحالي.
- تُكتب الردود **في WebChat** (كما لو كانت كتابة).
- **المقاطعة عند الكلام** (مفعلة افتراضيًا): إذا بدأ المستخدم بالكلام بينما يكون المساعد يتحدث، نوقف التشغيل ونسجّل طابع المقاطعة الزمني للموجّه التالي.

## توجيهات الصوت داخل الردود

يمكن للمساعد أن يسبق رده بـ **سطر JSON واحد** للتحكم في الصوت:

```json
{ "voice": "<voice-id>", "once": true }
```

القواعد:

- أول سطر غير فارغ فقط.
- يتم تجاهل المفاتيح غير المعروفة.
- تطبَّق `once: true` على الرد الحالي فقط.
- من دون `once`، يصبح الصوت هو الافتراضي الجديد لوضع Talk.
- تتم إزالة سطر JSON قبل تشغيل TTS.

المفاتيح المدعومة:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` ‏(WPM)، `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## الإعداد (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

القيم الافتراضية:

- `interruptOnSpeech`: ‏true
- `silenceTimeoutMs`: عند عدم تعيينه، يحتفظ Talk بنافذة التوقف الافتراضية الخاصة بالنظام الأساسي قبل إرسال النص المنسوخ (`700 ms` على macOS وAndroid، و`900 ms` على iOS)
- `provider`: يحدد مزود Talk النشط. استخدم `elevenlabs` أو `mlx` أو `system` لمسارات التشغيل المحلية على macOS.
- `providers.<provider>.voiceId`: يعود إلى `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` في ElevenLabs (أو إلى أول صوت ElevenLabs عندما يكون مفتاح API متاحًا).
- `providers.elevenlabs.modelId`: تكون القيمة الافتراضية `eleven_v3` عند عدم تعيينها.
- `providers.mlx.modelId`: تكون القيمة الافتراضية `mlx-community/Soprano-80M-bf16` عند عدم تعيينها.
- `providers.elevenlabs.apiKey`: يعود إلى `ELEVENLABS_API_KEY` (أو إلى ملف shell الشخصي الخاص بـ gateway إذا كان متاحًا).
- `outputFormat`: القيمة الافتراضية هي `pcm_44100` على macOS/iOS و`pcm_24000` على Android (عيّن `mp3_*` لفرض بث MP3)

## واجهة macOS

- زر تبديل في شريط القوائم: **Talk**
- تبويب الإعداد: مجموعة **Talk Mode** ‏(معرّف الصوت + زر تبديل المقاطعة)
- التراكب:
  - **الاستماع**: تنبض السحابة مع مستوى الميكروفون
  - **التفكير**: حركة غوص
  - **التحدث**: حلقات مشعة
  - النقر على السحابة: إيقاف التحدث
  - النقر على X: الخروج من وضع Talk

## ملاحظات

- يتطلب أذونات Speech + Microphone.
- يستخدم `chat.send` على مفتاح الجلسة `main`.
- تقوم gateway بحل تشغيل Talk عبر `talk.speak` باستخدام مزود Talk النشط. ويعود Android إلى TTS النظام المحلي فقط عندما لا يكون RPC هذا متاحًا.
- يستخدم تشغيل MLX المحلي على macOS المساعد المضمّن `openclaw-mlx-tts` عند وجوده، أو ملفًا تنفيذيًا على `PATH`. عيّن `OPENCLAW_MLX_TTS_BIN` للإشارة إلى ملف مساعد مخصص أثناء التطوير.
- يتم التحقق من `stability` في `eleven_v3` لتكون `0.0` أو `0.5` أو `1.0`؛ بينما تقبل النماذج الأخرى القيم `0..1`.
- يتم التحقق من `latency_tier` لتكون ضمن `0..4` عند تعيينها.
- يدعم Android تنسيقات الإخراج `pcm_16000` و`pcm_22050` و`pcm_24000` و`pcm_44100` لبث AudioTrack منخفض الكمون.

## ذو صلة

- [Voice wake](/ar/nodes/voicewake)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
