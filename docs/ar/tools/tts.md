---
read_when:
    - تفعيل تحويل النص إلى كلام للردود
    - ضبط مزوّدي TTS أو الحدود
    - استخدام أوامر `/tts`
summary: تحويل النص إلى كلام (TTS) للردود الصادرة
title: تحويل النص إلى كلام
x-i18n:
    generated_at: "2026-04-23T07:34:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: be8f5a8ce90c56bcce58723702d51154fea3f9fd27a69ace144e2b1e5bdd7049
    source_path: tools/tts.md
    workflow: 15
---

# تحويل النص إلى كلام (TTS)

يمكن لـ OpenClaw تحويل الردود الصادرة إلى صوت باستخدام ElevenLabs أو Google Gemini أو Microsoft أو MiniMax أو OpenAI أو xAI.
ويعمل هذا في أي مكان يستطيع فيه OpenClaw إرسال الصوت.

## الخدمات المدعومة

- **ElevenLabs** (كمزوّد أساسي أو احتياطي)
- **Google Gemini** (كمزوّد أساسي أو احتياطي؛ يستخدم Gemini API TTS)
- **Microsoft** (كمزوّد أساسي أو احتياطي؛ يستخدم التنفيذ المضمّن الحالي `node-edge-tts`)
- **MiniMax** (كمزوّد أساسي أو احتياطي؛ يستخدم T2A v2 API)
- **OpenAI** (كمزوّد أساسي أو احتياطي؛ ويُستخدم أيضًا للملخصات)
- **xAI** (كمزوّد أساسي أو احتياطي؛ يستخدم xAI TTS API)

### ملاحظات حول كلام Microsoft

يستخدم مزوّد الكلام المضمّن من Microsoft حاليًا خدمة TTS العصبية
المتاحة عبر الإنترنت في Microsoft Edge من خلال مكتبة `node-edge-tts`. وهي خدمة مستضافة (وليست
محلية)، وتستخدم نقاط نهاية Microsoft، ولا تتطلب مفتاح API.
ويكشف `node-edge-tts` خيارات إعداد الكلام وتنسيقات الإخراج، لكن
ليست كل الخيارات مدعومة من الخدمة. ولا يزال الإدخال القديم في config والتوجيهات باستخدام
`edge` يعمل ويُطبَّع إلى `microsoft`.

ولأن هذا المسار خدمة ويب عامة من دون SLA أو حصة منشورة،
فتعامل معه على أساس أفضل جهد. وإذا كنت تحتاج إلى حدود ودعم مضمونين، فاستخدم OpenAI
أو ElevenLabs.

## مفاتيح اختيارية

إذا كنت تريد OpenAI أو ElevenLabs أو Google Gemini أو MiniMax أو xAI:

- `ELEVENLABS_API_KEY` (أو `XI_API_KEY`)
- `GEMINI_API_KEY` (أو `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

كلام Microsoft **لا** يتطلب مفتاح API.

إذا تم ضبط عدة مزوّدين، يُستخدم المزوّد المحدد أولًا وتكون المزوّدات الأخرى خيارات احتياطية.
ويستخدم التلخيص التلقائي `summaryModel` المهيأ (أو `agents.defaults.model.primary`)،
لذلك يجب أيضًا أن يكون هذا المزوّد مصادقًا عليه إذا فعّلت الملخصات.

## روابط الخدمة

- [دليل OpenAI لتحويل النص إلى كلام](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [تحويل النص إلى كلام في ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [المصادقة في ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات إخراج Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تحويل النص إلى كلام في xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## هل هو مفعّل افتراضيًا؟

لا. يكون Auto‑TTS **معطلًا** افتراضيًا. فعّله في config باستخدام
`messages.tts.auto` أو محليًا باستخدام `/tts on`.

عندما لا تكون `messages.tts.provider` مضبوطة، يختار OpenClaw أول
مزوّد كلام مهيأ وفق ترتيب الاختيار التلقائي في السجل.

## الإعدادات

توجد إعدادات TTS تحت `messages.tts` في `openclaw.json`.
ويظهر المخطط الكامل في [إعدادات Gateway](/ar/gateway/configuration).

### إعدادات دنيا (تفعيل + مزوّد)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI كأساسي مع ElevenLabs كاحتياطي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft كأساسي (من دون مفتاح API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax كأساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Google Gemini كأساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

يستخدم Google Gemini TTS مسار مفتاح Gemini API. ويكون مفتاح API من Google Cloud Console
المقيّد إلى Gemini API صالحًا هنا، وهو النمط نفسه من المفاتيح المستخدم
من قبل مزود توليد الصور المضمّن من Google. ويكون ترتيب التحليل:
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI كأساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

يستخدم xAI TTS مسار `XAI_API_KEY` نفسه الذي يستخدمه مزود نماذج Grok المضمّن.
ويكون ترتيب التحليل: `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
والأصوات الحية الحالية هي `ara` و`eve` و`leo` و`rex` و`sal` و`una`؛ ويُعد `eve`
الافتراضي. ويقبل `language` وسم BCP-47 أو `auto`.

### تعطيل كلام Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### حدود مخصصة + مسار prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### الرد بالصوت فقط بعد رسالة صوتية واردة

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### تعطيل التلخيص التلقائي للردود الطويلة

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

ثم شغّل:

```
/tts summary off
```

### ملاحظات حول الحقول

- `auto`: وضع Auto‑TTS (`off`، `always`، `inbound`، `tagged`).
  - يرسل `inbound` الصوت فقط بعد رسالة صوتية واردة.
  - يرسل `tagged` الصوت فقط عندما يتضمن الرد توجيهات `[[tts:key=value]]` أو كتلة `[[tts:text]]...[[/tts:text]]`.
- `enabled`: مفتاح تبديل قديم (يقوم doctor بترحيله إلى `auto`).
- `mode`: ‏`"final"` (افتراضي) أو `"all"` (يتضمن ردود الأدوات/الكتل).
- `provider`: معرّف مزود الكلام مثل `"elevenlabs"` أو `"google"` أو `"microsoft"` أو `"minimax"` أو `"openai"` (ويكون الرجوع الاحتياطي تلقائيًا).
- إذا كان `provider` **غير مضبوط**، يستخدم OpenClaw أول مزود كلام مهيأ وفق ترتيب الاختيار التلقائي في السجل.
- لا يزال `provider: "edge"` القديم يعمل ويُطبَّع إلى `microsoft`.
- `summaryModel`: نموذج منخفض الكلفة اختياري للتلخيص التلقائي؛ والافتراضي هو `agents.defaults.model.primary`.
  - يقبل `provider/model` أو اسمًا مستعارًا لنموذج مهيأ.
- `modelOverrides`: السماح للنموذج بإصدار توجيهات TTS (مفعّل افتراضيًا).
  - تكون القيمة الافتراضية لـ `allowProvider` هي `false` (ويستلزم تبديل المزوّد الاشتراك الصريح).
- `providers.<id>`: إعدادات مملوكة للمزوّد ومفهرسة بمعرّف مزود الكلام.
- تُرحَّل كتل المزوّد المباشرة القديمة (`messages.tts.openai`، `messages.tts.elevenlabs`، `messages.tts.microsoft`، `messages.tts.edge`) تلقائيًا إلى `messages.tts.providers.<id>` عند التحميل.
- `maxTextLength`: حد صارم لإدخال TTS (أحرف). يفشل `/tts audio` إذا تم تجاوزه.
- `timeoutMs`: مهلة الطلب (ms).
- `prefsPath`: تجاوز مسار prefs JSON المحلي (المزوّد/الحد/الملخص).
- تعود قيم `apiKey` إلى متغيرات البيئة (`ELEVENLABS_API_KEY`/`XI_API_KEY`، `GEMINI_API_KEY`/`GOOGLE_API_KEY`، `MINIMAX_API_KEY`، `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: تجاوز عنوان API الأساسي لـ ElevenLabs.
- `providers.openai.baseUrl`: تجاوز نقطة نهاية OpenAI TTS.
  - ترتيب التحليل: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - تُعامل القيم غير الافتراضية على أنها نقاط نهاية TTS متوافقة مع OpenAI، لذا تُقبل أسماء النماذج والأصوات المخصصة.
- `providers.elevenlabs.voiceSettings`:
  - `stability` و`similarityBoost` و`style`: ‏`0..1`
  - `useSpeakerBoost`: ‏`true|false`
  - `speed`: ‏`0.5..2.0` (1.0 = عادي)
- `providers.elevenlabs.applyTextNormalization`: ‏`auto|on|off`
- `providers.elevenlabs.languageCode`: معيار ISO 639-1 من حرفين (مثل `en`، `de`)
- `providers.elevenlabs.seed`: عدد صحيح `0..4294967295` (حتمية على أساس أفضل جهد)
- `providers.minimax.baseUrl`: تجاوز عنوان MiniMax API الأساسي (الافتراضي `https://api.minimax.io`، ومتغير البيئة: `MINIMAX_API_HOST`).
- `providers.minimax.model`: نموذج TTS (الافتراضي `speech-2.8-hd`، ومتغير البيئة: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: معرّف الصوت (الافتراضي `English_expressive_narrator`، ومتغير البيئة: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: سرعة التشغيل `0.5..2.0` (الافتراضي 1.0).
- `providers.minimax.vol`: مستوى الصوت `(0, 10]` (الافتراضي 1.0؛ ويجب أن يكون أكبر من 0).
- `providers.minimax.pitch`: تغيير طبقة الصوت `-12..12` (الافتراضي 0).
- `providers.google.model`: نموذج Gemini TTS (الافتراضي `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: اسم صوت Gemini الجاهز مسبقًا (الافتراضي `Kore`؛ كما يُقبل `voice` أيضًا).
- `providers.google.baseUrl`: تجاوز عنوان Gemini API الأساسي. ولا يُقبل إلا `https://generativelanguage.googleapis.com`.
  - إذا تم حذف `messages.tts.providers.google.apiKey`، يمكن لـ TTS إعادة استخدام `models.providers.google.apiKey` قبل الرجوع إلى متغيرات البيئة.
- `providers.xai.apiKey`: مفتاح xAI TTS API (متغير البيئة: `XAI_API_KEY`).
- `providers.xai.baseUrl`: تجاوز عنوان xAI TTS الأساسي (الافتراضي `https://api.x.ai/v1`، ومتغير البيئة: `XAI_BASE_URL`).
- `providers.xai.voiceId`: معرّف صوت xAI (الافتراضي `eve`؛ والأصوات الحية الحالية: `ara` و`eve` و`leo` و`rex` و`sal` و`una`).
- `providers.xai.language`: رمز لغة BCP-47 أو `auto` (الافتراضي `en`).
- `providers.xai.responseFormat`: ‏`mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw` (الافتراضي `mp3`).
- `providers.xai.speed`: تجاوز سرعة أصلي خاص بالمزوّد.
- `providers.microsoft.enabled`: السماح باستخدام كلام Microsoft (الافتراضي `true`؛ ومن دون مفتاح API).
- `providers.microsoft.voice`: اسم الصوت العصبي من Microsoft (مثل `en-US-MichelleNeural`).
- `providers.microsoft.lang`: رمز اللغة (مثل `en-US`).
- `providers.microsoft.outputFormat`: تنسيق إخراج Microsoft (مثل `audio-24khz-48kbitrate-mono-mp3`).
  - راجع تنسيقات إخراج Microsoft Speech للقيم الصالحة؛ إذ لا تدعم وسيلة النقل المضمّنة المعتمدة على Edge جميع التنسيقات.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: سلاسل نسب مئوية (مثل `+10%`، `-5%`).
- `providers.microsoft.saveSubtitles`: كتابة ترجمات JSON إلى جانب ملف الصوت.
- `providers.microsoft.proxy`: عنوان URL للـ proxy لطلبات كلام Microsoft.
- `providers.microsoft.timeoutMs`: تجاوز مهلة الطلب (ms).
- `edge.*`: اسم مستعار قديم لإعدادات Microsoft نفسها.

## تجاوزات يقودها النموذج (مفعلة افتراضيًا)

افتراضيًا، **يمكن** للنموذج إصدار توجيهات TTS لرد واحد.
وعندما تكون `messages.tts.auto` مساوية لـ `tagged`، تصبح هذه التوجيهات مطلوبة لتشغيل الصوت.

عند تفعيل ذلك، يمكن للنموذج إصدار توجيهات `[[tts:...]]` لتجاوز الصوت
لرد واحد، بالإضافة إلى كتلة اختيارية `[[tts:text]]...[[/tts:text]]` من أجل
تقديم وسوم تعبيرية (الضحك، وإشارات الغناء، وما إلى ذلك) ينبغي أن تظهر فقط في
الصوت.

يتم تجاهل توجيهات `provider=...` ما لم تكن قيمة `modelOverrides.allowProvider: true`.

مثال على حمولة رد:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

مفاتيح التوجيه المتاحة (عند التفعيل):

- `provider` (معرّف مزوّد الكلام المسجل، مثل `openai` أو `elevenlabs` أو `google` أو `minimax` أو `microsoft`؛ ويتطلب `allowProvider: true`)
- `voice` (صوت OpenAI)، أو `voiceName` / `voice_name` / `google_voice` (صوت Google)، أو `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (نموذج OpenAI TTS، أو معرّف نموذج ElevenLabs، أو نموذج MiniMax) أو `google_model` (نموذج Google TTS)
- `stability`، `similarityBoost`، `style`، `speed`، `useSpeakerBoost`
- `vol` / `volume` (مستوى صوت MiniMax، من 0 إلى 10)
- `pitch` (طبقة صوت MiniMax، من -12 إلى 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

عطّل كل تجاوزات النموذج:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

قائمة سماح اختيارية (تفعيل تبديل المزوّد مع إبقاء بقية المفاتيح قابلة للضبط):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## التفضيلات لكل مستخدم

تكتب أوامر slash التجاوزات المحلية إلى `prefsPath` (الافتراضي:
`~/.openclaw/settings/tts.json`، ويمكن تجاوزه عبر `OPENCLAW_TTS_PREFS` أو
`messages.tts.prefsPath`).

الحقول المخزنة:

- `enabled`
- `provider`
- `maxLength` (عتبة التلخيص؛ الافتراضي 1500 حرفًا)
- `summarize` (الافتراضي `true`)

تتجاوز هذه القيم `messages.tts.*` لهذا المضيف.

## تنسيقات الإخراج (ثابتة)

- **Feishu / Matrix / Telegram / WhatsApp**: رسالة صوتية Opus (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI).
  - يُعد 48kHz / 64kbps توازنًا جيدًا للرسائل الصوتية.
- **القنوات الأخرى**: MP3 (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI).
  - يُعد 44.1kHz / 128kbps التوازن الافتراضي لوضوح الكلام.
- **MiniMax**: ‏MP3 (نموذج `speech-2.8-hd`، بمعدل عينة 32kHz). ولا يُدعم تنسيق الملاحظات الصوتية أصلًا؛ استخدم OpenAI أو ElevenLabs للحصول على رسائل صوتية Opus مضمونة.
- **Google Gemini**: يعيد Gemini API TTS قيمة PCM خام بتردد 24kHz. ويغلفه OpenClaw كملف WAV لمرفقات الصوت، ويعيد PCM مباشرةً لـ Talk/الاتصالات الهاتفية. ولا يدعم هذا المسار تنسيق الملاحظات الصوتية الأصلي Opus.
- **xAI**: ‏MP3 افتراضيًا؛ ويمكن أن تكون `responseFormat` هي `mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw`. ويستخدم OpenClaw نقطة نهاية xAI REST TTS الدفعية ويعيد مرفقًا صوتيًا كاملًا؛ ولا يُستخدم WebSocket الخاص بـ TTS المتدفق في xAI في مسار هذا المزوّد. ولا يدعم هذا المسار تنسيق الملاحظات الصوتية الأصلي Opus.
- **Microsoft**: يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - تقبل وسيلة النقل المضمّنة `outputFormat`، لكن ليست كل التنسيقات متاحة من الخدمة.
  - تتبع قيم تنسيق الإخراج تنسيقات إخراج Microsoft Speech (بما في ذلك Ogg/WebM Opus).
  - يقبل `sendVoice` في Telegram التنسيقات OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج
    إلى رسائل صوتية Opus مضمونة.
  - إذا فشل تنسيق الإخراج المهيأ من Microsoft، يعيد OpenClaw المحاولة باستخدام MP3.

تكون تنسيقات الإخراج في OpenAI/ElevenLabs ثابتة لكل قناة (انظر أعلاه).

## سلوك Auto-TTS

عند التفعيل، يقوم OpenClaw بما يلي:

- يتخطى TTS إذا كان الرد يحتوي أصلًا على وسائط أو توجيه `MEDIA:`.
- يتخطى الردود القصيرة جدًا (< 10 أحرف).
- يلخص الردود الطويلة عند التفعيل باستخدام `agents.defaults.model.primary` (أو `summaryModel`).
- يرفق الصوت المولّد بالرد.

إذا تجاوز الرد `maxLength` وكان التلخيص معطلًا (أو لم يوجد مفتاح API لـ
نموذج التلخيص)،
فسيتم تخطي الصوت وإرسال الرد النصي العادي.

## مخطط التدفق

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## استخدام أمر slash

يوجد أمر واحد فقط: `/tts`.
راجع [أوامر slash](/ar/tools/slash-commands) لمعرفة تفاصيل التفعيل.

ملاحظة Discord: إن `/tts` أمر مدمج في Discord، لذلك يسجل OpenClaw
الأمر `/voice` كأمر أصلي هناك. ولا يزال النص `/tts ...` يعمل.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

ملاحظات:

- تتطلب الأوامر مرسلًا مخولًا (ولا تزال قواعد allowlist/المالك مطبقة).
- يجب أن تكون `commands.text` أو تسجيل الأوامر الأصلية مفعّلة.
- يقبل config في `messages.tts.auto` القيم `off|always|inbound|tagged`.
- يكتب `/tts on` تفضيل TTS المحلي إلى `always`؛ ويكتب `/tts off` إلى `off`.
- استخدم config عندما تريد القيم الافتراضية `inbound` أو `tagged`.
- يتم تخزين `limit` و`summary` في prefs المحلية، وليس في config الرئيسي.
- يولّد `/tts audio` ردًا صوتيًا لمرة واحدة (ولا يؤدي إلى تفعيل TTS).
- يتضمن `/tts status` إظهار الرجوع الاحتياطي لأحدث محاولة:
  - رجوع احتياطي ناجح: `Fallback: <primary> -> <used>` بالإضافة إلى `Attempts: ...`
  - فشل: `Error: ...` بالإضافة إلى `Attempts: ...`
  - تشخيصات مفصلة: `Attempt details: provider:outcome(reasonCode) latency`
- تتضمن إخفاقات OpenAI وElevenLabs API الآن تفاصيل أخطاء المزوّد المحللة ومعرّف الطلب (عند إرجاعه من المزوّد)، ويظهر ذلك في أخطاء/سجلات TTS.

## أداة الوكيل

تحول أداة `tts` النص إلى كلام وتعيد مرفقًا صوتيًا من أجل
تسليم الرد. وعندما تكون القناة Feishu أو Matrix أو Telegram أو WhatsApp،
يُسلَّم الصوت كرسالة صوتية بدلًا من مرفق ملف.

## Gateway RPC

أساليب Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
