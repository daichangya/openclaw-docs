---
read_when:
    - تمكين تحويل النص إلى كلام للردود
    - ضبط مزوّدي TTS أو الحدود
    - استخدام أوامر `/tts`
summary: تحويل النص إلى كلام (TTS) للردود الصادرة
title: تحويل النص إلى كلام
x-i18n:
    generated_at: "2026-04-25T14:01:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

يمكن لـ OpenClaw تحويل الردود الصادرة إلى صوت باستخدام ElevenLabs أو Google Gemini أو Gradium أو Local CLI أو Microsoft أو MiniMax أو OpenAI أو Vydra أو xAI أو Xiaomi MiMo.
ويعمل ذلك في أي مكان يستطيع فيه OpenClaw إرسال الصوت.

## الخدمات المدعومة

- **ElevenLabs** (كمزوّد أساسي أو احتياطي)
- **Google Gemini** (كمزوّد أساسي أو احتياطي؛ يستخدم Gemini API TTS)
- **Gradium** (كمزوّد أساسي أو احتياطي؛ يدعم إخراج الملاحظات الصوتية والاتصالات الهاتفية)
- **Local CLI** (كمزوّد أساسي أو احتياطي؛ يشغّل أمر TTS محليًا مضبوطًا)
- **Microsoft** (كمزوّد أساسي أو احتياطي؛ يستخدم التنفيذ المضمّن الحالي `node-edge-tts`)
- **MiniMax** (كمزوّد أساسي أو احتياطي؛ يستخدم T2A v2 API)
- **OpenAI** (كمزوّد أساسي أو احتياطي؛ ويُستخدم أيضًا للملخصات)
- **Vydra** (كمزوّد أساسي أو احتياطي؛ مزوّد مشترك للصور والفيديو والكلام)
- **xAI** (كمزوّد أساسي أو احتياطي؛ يستخدم xAI TTS API)
- **Xiaomi MiMo** (كمزوّد أساسي أو احتياطي؛ يستخدم MiMo TTS عبر إكمالات دردشة Xiaomi)

### ملاحظات حول كلام Microsoft

يستخدم مزوّد الكلام المضمّن من Microsoft حاليًا خدمة TTS العصبية
التي تعمل عبر الإنترنت من Microsoft Edge من خلال مكتبة `node-edge-tts`. وهي خدمة مستضافة (وليست
محلية)، وتستخدم نقاط نهاية Microsoft، ولا تتطلب مفتاح API.
تكشف `node-edge-tts` خيارات إعداد الكلام وتنسيقات الإخراج، لكن
ليست كل الخيارات مدعومة من الخدمة. وما يزال الإدخال القديم للإعدادات والتوجيه
الذي يستخدم `edge` يعمل ويُطبّع إلى `microsoft`.

ولأن هذا المسار خدمة ويب عامة من دون SLA أو حصة منشورة،
فتعامل معه على أنه أفضل جهد. وإذا كنت تحتاج إلى حدود ودعم مضمونين، فاستخدم OpenAI
أو ElevenLabs.

## المفاتيح الاختيارية

إذا كنت تريد OpenAI أو ElevenLabs أو Google Gemini أو Gradium أو MiniMax أو Vydra أو xAI أو Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (أو `XI_API_KEY`)
- `GEMINI_API_KEY` (أو `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`؛ كما يقبل MiniMax TTS مصادقة Token Plan عبر
  `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_CODE_PLAN_KEY` أو
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

لا يتطلب كل من Local CLI وكلام Microsoft **أي** مفتاح API.

إذا جرى ضبط عدة مزوّدين، فسيُستخدم المزوّد المحدد أولًا ويكون الآخرون خيارات احتياطية.
ويستخدم الملخص التلقائي `summaryModel` المضبوط (أو `agents.defaults.model.primary`)،
لذلك يجب أيضًا أن يكون هذا المزوّد موثَّقًا إذا فعّلت الملخصات.

## روابط الخدمات

- [دليل OpenAI لتحويل النص إلى كلام](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [تحويل النص إلى كلام في ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [المصادقة في ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ar/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [تخليق الكلام في Xiaomi MiMo](/ar/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات إخراج Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تحويل النص إلى كلام في xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## هل هو مفعّل افتراضيًا؟

لا. يكون Auto‑TTS **معطّلًا** افتراضيًا. فعّله في الإعدادات باستخدام
`messages.tts.auto` أو محليًا باستخدام `/tts on`.

عندما لا يكون `messages.tts.provider` مضبوطًا، يختار OpenClaw أول
مزوّد كلام مضبوط وفق ترتيب الاختيار التلقائي في السجل.

## الإعدادات

توجد إعدادات TTS تحت `messages.tts` في `openclaw.json`.
يوجد المخطط الكامل في [إعدادات Gateway](/ar/gateway/configuration).

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

### OpenAI كمزوّد أساسي مع ElevenLabs كاحتياطي

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

### Microsoft كمزوّد أساسي (من دون مفتاح API)

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

### MiniMax كمزوّد أساسي

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

تُحل مصادقة MiniMax TTS بالترتيب التالي: `messages.tts.providers.minimax.apiKey`، ثم
ملفات تعريف OAuth/token المخزنة `minimax-portal`، ثم مفاتيح بيئة Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`)، ثم `MINIMAX_API_KEY`. وعندما لا يكون
`baseUrl` الصريح لـ TTS مضبوطًا، يمكن لـ OpenClaw إعادة استخدام مضيف OAuth
الخاص بـ `minimax-portal` المضبوط من أجل كلام Token Plan.

### Google Gemini كمزوّد أساسي

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

يستخدم Google Gemini TTS مسار مفتاح Gemini API. ويُعد مفتاح API من Google Cloud Console
المقيد بـ Gemini API صالحًا هنا، وهو النمط نفسه من المفاتيح المستخدم
من قبل مزوّد توليد الصور المضمّن من Google. وترتيب الحل هو
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI كمزوّد أساسي

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

يستخدم xAI TTS مسار `XAI_API_KEY` نفسه المستخدم من قِبل مزوّد نماذج Grok المضمّن.
وترتيب الحل هو `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
الأصوات الحية الحالية هي `ara` و`eve` و`leo` و`rex` و`sal` و`una`؛ وتكون `eve`
هي الافتراضية. وتقبل `language` وسم BCP-47 أو القيمة `auto`.

### Xiaomi MiMo كمزوّد أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

يستخدم Xiaomi MiMo TTS مسار `XIAOMI_API_KEY` نفسه المستخدم من قِبل مزوّد نماذج Xiaomi
المضمّن. ومعرّف مزوّد الكلام هو `xiaomi`؛ كما يُقبل `mimo` كاسم بديل.
ويُرسل النص الهدف بوصفه رسالة assistant، بما يطابق عقد TTS لدى Xiaomi.
أما `style` الاختياري فيُرسل كتوجيه من user ولا يُنطق.

### OpenRouter كمزوّد أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

يستخدم OpenRouter TTS مسار `OPENROUTER_API_KEY` نفسه المستخدم من قِبل
مزوّد نماذج OpenRouter المضمّن. وترتيب الحل هو
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI كمزوّد أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```

يشغّل Local CLI TTS الأمر المضبوط على مضيف gateway. وتُوسّع العناصر النائبة
`{{Text}}` و`{{OutputPath}}` و`{{OutputDir}}` و`{{OutputBase}}`
في `args`؛ وإذا لم توجد أي عنصر نائبة `{{Text}}`، يكتب OpenClaw
النص المنطوق إلى stdin. ويقبل `outputFormat` القيم `mp3` أو `opus` أو `wav`.
وتُحوّل أهداف الملاحظات الصوتية إلى Ogg/Opus ويُحوّل إخراج الاتصالات الهاتفية
إلى PCM خام أحادي القناة 16 kHz باستخدام `ffmpeg`. وما يزال الاسم البديل القديم للمزوّد
`cli` يعمل، لكن يجب أن تستخدم الإعدادات الجديدة `tts-local-cli`.

### Gradium كمزوّد أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

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

### تعطيل الملخص التلقائي للردود الطويلة

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

- `auto`: وضع Auto‑TTS (`off` أو `always` أو `inbound` أو `tagged`).
  - `inbound` يرسل الصوت فقط بعد رسالة صوتية واردة.
  - `tagged` يرسل الصوت فقط عندما يتضمن الرد توجيهات `[[tts:key=value]]` أو كتلة `[[tts:text]]...[[/tts:text]]`.
- `enabled`: مفتاح قديم (يقوم doctor بترحيله إلى `auto`).
- `mode`: إما `"final"` (الافتراضي) أو `"all"` (يتضمن ردود الأدوات/الكتل).
- `provider`: معرّف مزوّد الكلام مثل `"elevenlabs"` أو `"google"` أو `"gradium"` أو `"microsoft"` أو `"minimax"` أو `"openai"` أو `"vydra"` أو `"xai"` أو `"xiaomi"` (ويكون الاحتياطي تلقائيًا).
- إذا كان `provider` **غير مضبوط**، يستخدم OpenClaw أول مزوّد كلام مضبوط وفق ترتيب الاختيار التلقائي في السجل.
- يُصلح الإعداد القديم `provider: "edge"` بواسطة `openclaw doctor --fix` ويُعاد
  كتابته إلى `provider: "microsoft"`.
- `summaryModel`: نموذج رخيص اختياري للملخص التلقائي؛ والافتراضي هو `agents.defaults.model.primary`.
  - يقبل `provider/model` أو اسمًا بديلًا مضبوطًا للنموذج.
- `modelOverrides`: يسمح للنموذج بإصدار توجيهات TTS (مفعّل افتراضيًا).
  - تكون القيمة الافتراضية لـ `allowProvider` هي `false` (التبديل بين المزوّدين يتطلب الاشتراك صراحةً).
- `providers.<id>`: إعدادات يملكها المزوّد ومفهرسة بحسب معرّف مزوّد الكلام.
- تُصلَح كتل المزوّد المباشرة القديمة (`messages.tts.openai` و`messages.tts.elevenlabs` و`messages.tts.microsoft` و`messages.tts.edge`) بواسطة `openclaw doctor --fix`؛ ويجب أن تستخدم الإعدادات المحفوظة `messages.tts.providers.<id>`.
- كما يُصلَح أيضًا `messages.tts.providers.edge` القديم بواسطة `openclaw doctor --fix`؛ ويجب أن تستخدم الإعدادات المحفوظة `messages.tts.providers.microsoft`.
- `maxTextLength`: حد أقصى صارم لإدخال TTS (بالمحارف). يفشل `/tts audio` إذا جرى تجاوزه.
- `timeoutMs`: مهلة الطلب (بالمللي ثانية).
- `prefsPath`: تجاوز مسار JSON المحلي الخاص بالتفضيلات (المزوّد/الحد/الملخص).
- تعود قيم `apiKey` إلى متغيرات البيئة (`ELEVENLABS_API_KEY`/`XI_API_KEY` و`GEMINI_API_KEY`/`GOOGLE_API_KEY` و`GRADIUM_API_KEY` و`MINIMAX_API_KEY` و`OPENAI_API_KEY` و`VYDRA_API_KEY` و`XAI_API_KEY` و`XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: تجاوز Base URL الخاص بـ ElevenLabs API.
- `providers.openai.baseUrl`: تجاوز نقطة نهاية OpenAI TTS.
  - ترتيب الحل: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - تُعامل القيم غير الافتراضية على أنها نقاط نهاية TTS متوافقة مع OpenAI، لذا تُقبل أسماء النماذج والأصوات المخصصة.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: ضمن `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: ضمن `0.5..2.0` (1.0 = عادي)
- `providers.elevenlabs.applyTextNormalization`: ‏`auto|on|off`
- `providers.elevenlabs.languageCode`: رمز ISO 639-1 من حرفين (مثل `en`, `de`)
- `providers.elevenlabs.seed`: عدد صحيح ضمن `0..4294967295` (حتمية بأفضل جهد)
- `providers.minimax.baseUrl`: تجاوز Base URL الخاص بـ MiniMax API (الافتراضي `https://api.minimax.io`، ومتغير البيئة: `MINIMAX_API_HOST`).
- `providers.minimax.model`: نموذج TTS (الافتراضي `speech-2.8-hd`، ومتغير البيئة: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: معرّف الصوت (الافتراضي `English_expressive_narrator`، ومتغير البيئة: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: سرعة التشغيل ضمن `0.5..2.0` (الافتراضي 1.0).
- `providers.minimax.vol`: مستوى الصوت ضمن `(0, 10]` (الافتراضي 1.0؛ ويجب أن يكون أكبر من 0).
- `providers.minimax.pitch`: إزاحة درجة صوتية صحيحة ضمن `-12..12` (الافتراضي 0). تُقتطع القيم الكسرية قبل استدعاء MiniMax T2A لأن API ترفض قيم pitch غير الصحيحة.
- `providers.tts-local-cli.command`: ملف تنفيذي محلي أو سلسلة أوامر لـ CLI TTS.
- `providers.tts-local-cli.args`: وسيطات الأمر؛ وتدعم العناصر النائبة `{{Text}}` و`{{OutputPath}}` و`{{OutputDir}}` و`{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: تنسيق خرج CLI المتوقع (`mp3` أو `opus` أو `wav`؛ والافتراضي `mp3` لمرفقات الصوت).
- `providers.tts-local-cli.timeoutMs`: مهلة الأمر بالمللي ثانية (الافتراضي `120000`).
- `providers.tts-local-cli.cwd`: دليل عمل اختياري للأمر.
- `providers.tts-local-cli.env`: تجاوزات بيئة نصية اختيارية للأمر.
- `providers.google.model`: نموذج Gemini TTS (الافتراضي `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: اسم الصوت الجاهز في Gemini (الافتراضي `Kore`؛ كما تُقبل `voice`).
- `providers.google.audioProfile`: مطالبة أسلوب بلغة طبيعية تُضاف قبل النص المنطوق.
- `providers.google.speakerName`: تسمية متحدث اختيارية تُضاف قبل النص المنطوق عندما تستخدم مطالبة TTS الخاصة بك متحدثًا ذا اسم.
- `providers.google.baseUrl`: تجاوز Base URL الخاص بـ Gemini API. ولا يُقبل إلا `https://generativelanguage.googleapis.com`.
  - إذا أُهمل `messages.tts.providers.google.apiKey`، يمكن لـ TTS إعادة استخدام `models.providers.google.apiKey` قبل الرجوع إلى البيئة.
- `providers.gradium.baseUrl`: تجاوز Base URL الخاص بـ Gradium API (الافتراضي `https://api.gradium.ai`).
- `providers.gradium.voiceId`: معرّف صوت Gradium (الافتراضي Emma، ‏`YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: مفتاح xAI TTS API (متغير البيئة: `XAI_API_KEY`).
- `providers.xai.baseUrl`: تجاوز Base URL الخاص بـ xAI TTS (الافتراضي `https://api.x.ai/v1`، ومتغير البيئة: `XAI_BASE_URL`).
- `providers.xai.voiceId`: معرّف صوت xAI (الافتراضي `eve`؛ والأصوات الحية الحالية: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: رمز لغة BCP-47 أو `auto` (الافتراضي `en`).
- `providers.xai.responseFormat`: ‏`mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw` (الافتراضي `mp3`).
- `providers.xai.speed`: تجاوز سرعة أصلي خاص بالمزوّد.
- `providers.xiaomi.apiKey`: مفتاح Xiaomi MiMo API (متغير البيئة: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: تجاوز Base URL الخاص بـ Xiaomi MiMo API (الافتراضي `https://api.xiaomimimo.com/v1`، ومتغير البيئة: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: نموذج TTS (الافتراضي `mimo-v2.5-tts`، ومتغير البيئة: `XIAOMI_TTS_MODEL`؛ كما أن `mimo-v2-tts` مدعوم أيضًا).
- `providers.xiaomi.voice`: معرّف صوت MiMo (الافتراضي `mimo_default`، ومتغير البيئة: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: ‏`mp3` أو `wav` (الافتراضي `mp3`، ومتغير البيئة: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: توجيه أسلوب اختياري بلغة طبيعية يُرسل كرسالة user؛ ولا يُنطق.
- `providers.openrouter.apiKey`: مفتاح OpenRouter API (متغير البيئة: `OPENROUTER_API_KEY`؛ ويمكنه إعادة استخدام `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: تجاوز Base URL الخاص بـ OpenRouter TTS (الافتراضي `https://openrouter.ai/api/v1`؛ ويُطبّع `https://openrouter.ai/v1` القديم).
- `providers.openrouter.model`: معرّف نموذج OpenRouter TTS (الافتراضي `hexgrad/kokoro-82m`؛ كما تُقبل `modelId`).
- `providers.openrouter.voice`: معرّف صوت خاص بالمزوّد (الافتراضي `af_alloy`؛ كما تُقبل `voiceId`).
- `providers.openrouter.responseFormat`: ‏`mp3` أو `pcm` (الافتراضي `mp3`).
- `providers.openrouter.speed`: تجاوز سرعة أصلي خاص بالمزوّد.
- `providers.microsoft.enabled`: السماح باستخدام كلام Microsoft (الافتراضي `true`؛ من دون مفتاح API).
- `providers.microsoft.voice`: اسم الصوت العصبي في Microsoft (مثل `en-US-MichelleNeural`).
- `providers.microsoft.lang`: رمز اللغة (مثل `en-US`).
- `providers.microsoft.outputFormat`: تنسيق خرج Microsoft (مثل `audio-24khz-48kbitrate-mono-mp3`).
  - راجع تنسيقات إخراج Microsoft Speech للقيم الصالحة؛ فليست كل التنسيقات مدعومة من مسار النقل المضمّن المعتمد على Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: سلاسل نسب مئوية (مثل `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: كتابة ترجمات JSON إلى جانب ملف الصوت.
- `providers.microsoft.proxy`: URL وكيل لطلبات كلام Microsoft.
- `providers.microsoft.timeoutMs`: تجاوز مهلة الطلب (بالمللي ثانية).
- `edge.*`: اسم بديل قديم للإعدادات نفسها الخاصة بـ Microsoft. شغّل
  `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `providers.microsoft`.

## التجاوزات المدفوعة بالنموذج (مفعّلة افتراضيًا)

افتراضيًا، **يمكن** للنموذج إصدار توجيهات TTS لرد واحد.
عندما يكون `messages.tts.auto` مساويًا لـ `tagged`، تكون هذه التوجيهات مطلوبة لتشغيل الصوت.

عند التفعيل، يمكن للنموذج إصدار توجيهات `[[tts:...]]` لتجاوز الصوت
لرد واحد، بالإضافة إلى كتلة اختيارية `[[tts:text]]...[[/tts:text]]`
لتوفير علامات تعبيرية (الضحك، إشارات الغناء، إلخ) ينبغي أن تظهر فقط في
الصوت.

تُتجاهل توجيهات `provider=...` ما لم يكن `modelOverrides.allowProvider: true`.

مثال على حمولة الرد:

```
تفضل.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](يضحك) اقرأ الأغنية مرة أخرى.[[/tts:text]]
```

مفاتيح التوجيه المتاحة (عند التفعيل):

- `provider` (معرّف مزوّد كلام مسجّل، مثل `openai` أو `elevenlabs` أو `google` أو `gradium` أو `minimax` أو `microsoft` أو `vydra` أو `xai` أو `xiaomi`؛ ويتطلب `allowProvider: true`)
- `voice` (صوت OpenAI أو Gradium أو Xiaomi)، أو `voiceName` / `voice_name` / `google_voice` (صوت Google)، أو `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (نموذج OpenAI TTS أو معرّف نموذج ElevenLabs أو نموذج MiniMax أو نموذج Xiaomi MiMo TTS) أو `google_model` (نموذج Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (مستوى صوت MiniMax، من 0 إلى 10)
- `pitch` (درجة MiniMax الصحيحة، من -12 إلى 12؛ وتُقتطع القيم الكسرية قبل طلب MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (‏ISO 639-1)
- `seed`

تعطيل جميع تجاوزات النموذج:

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

قائمة سماح اختيارية (تفعيل التبديل بين المزوّدين مع إبقاء بقية عناصر التحكم قابلة للضبط):

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

## تفضيلات لكل مستخدم

تكتب أوامر الشرطة المائلة تجاوزات محلية إلى `prefsPath` (الافتراضي:
`~/.openclaw/settings/tts.json`، ويمكن تجاوزه عبر `OPENCLAW_TTS_PREFS` أو
`messages.tts.prefsPath`).

الحقول المخزنة:

- `enabled`
- `provider`
- `maxLength` (عتبة التلخيص؛ والافتراضي 1500 محرف)
- `summarize` (الافتراضي `true`)

تتجاوز هذه الحقول `messages.tts.*` لذلك المضيف.

## تنسيقات الإخراج (ثابتة)

- **Feishu / Matrix / Telegram / WhatsApp**: تفضّل الردود على شكل ملاحظات صوتية تنسيق Opus (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI).
  - يُعد 48kHz / 64kbps توازنًا جيدًا لرسائل الصوت.
- **Feishu**: عندما يُنتَج رد ملاحظة صوتية بصيغة MP3/WAV/M4A أو أي
  ملف صوتي محتمل آخر، يقوم Plugin ‏Feishu بتحويله إلى 48kHz Ogg/Opus باستخدام
  `ffmpeg` قبل إرسال فقاعة `audio` الأصلية. وإذا فشل التحويل، يتلقى Feishu
  الملف الأصلي كمرفق.
- **القنوات الأخرى**: MP3 (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI).
  - يُعد 44.1kHz / 128kbps التوازن الافتراضي لوضوح الكلام.
- **MiniMax**: يستخدم MP3 (نموذج `speech-2.8-hd`، بمعدل عينات 32kHz) لمرفقات الصوت العادية. وبالنسبة إلى أهداف الملاحظات الصوتية مثل Feishu وTelegram، يقوم OpenClaw بتحويل MP3 الخاص بـ MiniMax إلى 48kHz Opus باستخدام `ffmpeg` قبل التسليم.
- **Xiaomi MiMo**: يستخدم MP3 افتراضيًا، أو WAV عند ضبطه. وبالنسبة إلى أهداف الملاحظات الصوتية مثل Feishu وTelegram، يقوم OpenClaw بتحويل خرج Xiaomi إلى 48kHz Opus باستخدام `ffmpeg` قبل التسليم.
- **Local CLI**: يستخدم `outputFormat` المضبوط. وتُحوّل أهداف الملاحظات الصوتية
  إلى Ogg/Opus ويُحوّل خرج الاتصالات الهاتفية إلى PCM خام أحادي 16 kHz
  باستخدام `ffmpeg`.
- **Google Gemini**: يعيد Gemini API TTS بيانات PCM خامًا بتردد 24kHz. يقوم OpenClaw بتغليفها بصيغة WAV لمرفقات الصوت ويعيد PCM مباشرةً لـ Talk/الاتصالات الهاتفية. ولا يدعم هذا المسار تنسيق Opus الأصلي للملاحظات الصوتية.
- **Gradium**: يستخدم WAV لمرفقات الصوت، وOpus لأهداف الملاحظات الصوتية، و`ulaw_8000` عند 8 kHz للاتصالات الهاتفية.
- **xAI**: يستخدم MP3 افتراضيًا؛ ويمكن أن تكون `responseFormat` واحدة من `mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw`. يستخدم OpenClaw نقطة نهاية TTS الدُفعية REST الخاصة بـ xAI ويعيد مرفقًا صوتيًا كاملًا؛ ولا يُستخدم WebSocket الخاص بـ TTS المتدفق في xAI ضمن مسار هذا المزوّد. ولا يدعم هذا المسار تنسيق Opus الأصلي للملاحظات الصوتية.
- **Microsoft**: يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - يقبل مسار النقل المضمّن `outputFormat`، لكن ليست كل التنسيقات متاحة من الخدمة.
  - تتبع قيم تنسيق الإخراج تنسيقات إخراج Microsoft Speech (بما في ذلك Ogg/WebM Opus).
  - يقبل Telegram `sendVoice` بصيغ OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج
    إلى رسائل صوتية Opus مضمونة.
  - إذا فشل تنسيق الإخراج المضبوط لـ Microsoft، يعيد OpenClaw المحاولة باستخدام MP3.

تكون تنسيقات إخراج OpenAI/ElevenLabs ثابتة لكل قناة (راجع أعلاه).

## سلوك Auto-TTS

عند التفعيل، يقوم OpenClaw بما يلي:

- يتخطى TTS إذا كان الرد يتضمن وسائط بالفعل أو توجيه `MEDIA:`.
- يتخطى الردود القصيرة جدًا (< 10 محارف).
- يلخص الردود الطويلة عند التفعيل باستخدام `agents.defaults.model.primary` (أو `summaryModel`).
- يرفق الصوت المُولَّد بالرد.

إذا تجاوز الرد `maxLength` وكان التلخيص معطّلًا (أو لم يوجد مفتاح API لـ
نموذج التلخيص)،
فسيُتخطى الصوت ويُرسل الرد النصي العادي.

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

## استخدام أمر الشرطة المائلة

يوجد أمر واحد فقط: `/tts`.
راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) لمعرفة تفاصيل التفعيل.

ملاحظة Discord: يُعد `/tts` أمرًا مضمّنًا في Discord، لذا يسجّل OpenClaw
`/voice` كأمر أصلي هناك. وما يزال النص `/tts ...` يعمل.

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

- تتطلب الأوامر مرسلًا مصرّحًا له (وما تزال قواعد allowlist/المالك مطبقة).
- يجب أن يكون `commands.text` أو تسجيل الأوامر الأصلية مفعّلًا.
- يقبل الإعداد `messages.tts.auto` القيم `off|always|inbound|tagged`.
- يكتب `/tts on` تفضيل TTS المحلي إلى `always`؛ ويكتب `/tts off` إلى `off`.
- استخدم الإعدادات عندما تريد القيم الافتراضية `inbound` أو `tagged`.
- يُخزّن `limit` و`summary` في التفضيلات المحلية، لا في الإعدادات الرئيسية.
- يقوم `/tts audio` بإنشاء رد صوتي لمرة واحدة (ولا يفعّل TTS).
- يتضمن `/tts status` عرضًا واضحًا للاحتياطي لأحدث محاولة:
  - احتياطي ناجح: `Fallback: <primary> -> <used>` مع `Attempts: ...`
  - فشل: `Error: ...` مع `Attempts: ...`
  - تشخيصات مفصلة: `Attempt details: provider:outcome(reasonCode) latency`
- تتضمن الآن إخفاقات OpenAI وElevenLabs API تفاصيل خطأ المزوّد المحللة ومعرّف الطلب (عند إرجاعه من المزوّد)، ويظهر ذلك في أخطاء/سجلات TTS.

## أداة العامل

تحوّل الأداة `tts` النص إلى كلام وتعيد مرفقًا صوتيًا من أجل
تسليم الرد. وعندما تكون القناة هي Feishu أو Matrix أو Telegram أو WhatsApp،
يُسلَّم الصوت كرسالة صوتية بدلًا من مرفق ملف.
ويمكن لـ Feishu تحويل خرج TTS غير Opus في هذا المسار عندما يكون `ffmpeg`
متاحًا.
وتقبل حقلي `channel` و`timeoutMs` اختياريين؛ ويكون `timeoutMs` هو
مهلة طلب المزوّد لكل استدعاء بالمللي ثانية.

## Gateway RPC

أساليب Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## ذو صلة

- [نظرة عامة على الوسائط](/ar/tools/media-overview)
- [توليد الموسيقى](/ar/tools/music-generation)
- [توليد الفيديو](/ar/tools/video-generation)
