---
read_when:
    - أنت تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى تدفق مصادقة مفتاح API أو OAuth
summary: إعداد Google Gemini (مفتاح API + OAuth، وتوليد الصور، وفهم الوسائط، وTTS، والبحث على الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T13:56:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

يوفّر Plugin Google وصولًا إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى
توليد الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- API: Google Gemini API
- خيار وقت التشغيل: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  يعيد استخدام OAuth الخاص بـ Gemini CLI مع الإبقاء على مراجع النماذج القياسية بصيغة `google/*`.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** الوصول القياسي إلى Gemini API عبر Google AI Studio.

    <Steps>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    كل من متغيرَي البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY` مقبولان. استخدم أيًّا منهما لديك بالفعل.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Gemini CLI موجود عبر PKCE OAuth بدلًا من مفتاح API منفصل.

    <Warning>
    يُعد المزوّد `google-gemini-cli` تكاملًا غير رسمي. يفيد بعض المستخدمين
    بوجود قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك الخاصة.
    </Warning>

    <Steps>
      <Step title="ثبّت Gemini CLI">
        يجب أن يكون الأمر المحلي `gemini` متاحًا على `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # أو npm
        npm install -g @google/gemini-cli
        ```

        يدعم OpenClaw كلًا من تثبيتات Homebrew وتثبيتات npm العامة، بما في ذلك
        التخطيطات الشائعة في Windows/npm.
      </Step>
      <Step title="سجّل الدخول عبر OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - النموذج الافتراضي: `google/gemini-3.1-pro-preview`
    - وقت التشغيل: `google-gemini-cli`
    - الاسم البديل: `gemini-cli`

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (أو صيغ `GEMINI_CLI_*` البديلة.)

    <Note>
    إذا فشلت طلبات OAuth الخاصة بـ Gemini CLI بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء تدفق المتصفح، فتأكد من أن الأمر المحلي `gemini`
    مثبت وموجود على `PATH`.
    </Note>

    تُعد مراجع النماذج `google-gemini-cli/*` أسماء بديلة قديمة للتوافق. يجب أن تستخدم
    الإعدادات الجديدة مراجع نماذج `google/*` بالإضافة إلى وقت التشغيل `google-gemini-cli`
    عندما تريد تنفيذ Gemini CLI محليًا.

  </Tab>
</Tabs>

## القدرات

| القدرة                 | مدعومة                        |
| ---------------------- | ----------------------------- |
| إكمالات الدردشة        | نعم                           |
| توليد الصور            | نعم                           |
| توليد الموسيقى         | نعم                           |
| تحويل النص إلى كلام    | نعم                           |
| الصوت الفوري           | نعم (Google Live API)         |
| فهم الصور              | نعم                           |
| نسخ الصوت              | نعم                           |
| فهم الفيديو            | نعم                           |
| البحث على الويب (Grounding) | نعم                     |
| التفكير/الاستدلال      | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4          | نعم                           |

<Tip>
تستخدم نماذج Gemini 3 `thinkingLevel` بدلًا من `thinkingBudget`. يقوم OpenClaw
بربط عناصر التحكم في الاستدلال الخاصة بـ Gemini 3 وGemini 3.1 والأسماء البديلة
`gemini-*-latest` إلى `thinkingLevel` حتى لا ترسل
عمليات التشغيل الافتراضية/منخفضة الكمون قيم `thinkingBudget`
معطلة.

يحافظ `/think adaptive` على دلالات التفكير الديناميكية الخاصة بـ Google بدلًا من اختيار
مستوى ثابت من OpenClaw. تُهمل Gemini 3 وGemini 3.1 قيمة `thinkingLevel` الثابتة حتى
تتمكن Google من اختيار المستوى؛ بينما ترسل Gemini 2.5 القيمة الحارسة الديناميكية من Google
`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (مثل `gemma-4-26b-a4b-it`) وضع التفكير. ويقوم OpenClaw
بإعادة كتابة `thinkingBudget` إلى `thinkingLevel` مدعوم من Google بالنسبة إلى Gemma 4.
ويؤدي ضبط التفكير على `off` إلى إبقاء التفكير معطّلًا بدلًا من ربطه بـ
`MINIMAL`.
</Tip>

## توليد الصور

يضبط مزوّد توليد الصور `google` المضمّن افتراضيًا على
`google/gemini-3.1-flash-image-preview`.

- يدعم أيضًا `google/gemini-3-pro-image-preview`
- التوليد: حتى 4 صور لكل طلب
- وضع التحرير: مفعّل، حتى 5 صور إدخال
- عناصر التحكم الهندسية: `size` و`aspectRatio` و`resolution`

لاستخدام Google كمزوّد الصور الافتراضي:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
راجع [توليد الصور](/ar/tools/image-generation) لمعلمات الأدوات المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## توليد الفيديو

يسجّل Plugin `google` المضمّن أيضًا توليد الفيديو عبر
الأداة المشتركة `video_generate`.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: من نص إلى فيديو، ومن صورة إلى فيديو، وتدفقات مرجعية لفيديو واحد
- يدعم `aspectRatio` و`resolution` و`audio`
- الحد الحالي للمدة: **من 4 إلى 8 ثوانٍ**

لاستخدام Google كمزوّد الفيديو الافتراضي:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأدوات المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## توليد الموسيقى

يسجّل Plugin `google` المضمّن أيضًا توليد الموسيقى عبر
الأداة المشتركة `music_generate`.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر التحكم في المطالبة: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- المدخلات المرجعية: حتى 10 صور
- تُفصل عمليات التشغيل المعتمدة على الجلسة عبر تدفق المهام/الحالة المشترك، بما في ذلك `action: "status"`

لاستخدام Google كمزوّد الموسيقى الافتراضي:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
راجع [توليد الموسيقى](/ar/tools/music-generation) لمعلمات الأدوات المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## تحويل النص إلى كلام

يستخدم مزوّد الكلام `google` المضمّن مسار TTS في Gemini API مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وPCM للمكالمات/الاتصالات الهاتفية
- إخراج الملاحظات الصوتية الأصلي: غير مدعوم على مسار Gemini API هذا لأن API تُرجع PCM بدلًا من Opus

لاستخدام Google كمزوّد TTS الافتراضي:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "تحدث بأسلوب مهني وبنبرة هادئة.",
        },
      },
    },
  },
}
```

يستخدم TTS في Gemini API مطالبات بلغة طبيعية للتحكم في الأسلوب. اضبط
`audioProfile` لإضافة مطالبة أسلوب قابلة لإعادة الاستخدام قبل النص المنطوق. واضبط
`speakerName` عندما يشير نص مطالبتك إلى متحدث مُسمّى.

كما يقبل TTS في Gemini API علامات صوتية تعبيرية بين أقواس مربعة داخل النص،
مثل `[whispers]` أو `[laughs]`. ولإبقاء العلامات خارج رد الدردشة المرئي
مع إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
إليك نص الرد النظيف.

[[tts:text]][whispers] هذه هي النسخة المنطوقة.[[/tts:text]]
```

<Note>
يُعد مفتاح API من Google Cloud Console مقيّدًا بـ Gemini API صالحًا لهذا
المزوّد. وليس هذا هو المسار المنفصل لـ Cloud Text-to-Speech API.
</Note>

## الصوت الفوري

يسجّل Plugin `google` المضمّن مزوّد صوت فوري مدعومًا بواسطة
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد               | مسار الإعداد                                                        | الافتراضي                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| النموذج               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| الصوت                 | `...google.voice`                                                   | `Kore`                                                                               |
| درجة الحرارة         | `...google.temperature`                                             | (غير مضبوط)                                                                          |
| حساسية بدء VAD       | `...google.startSensitivity`                                        | (غير مضبوط)                                                                          |
| حساسية انتهاء VAD    | `...google.endSensitivity`                                          | (غير مضبوط)                                                                          |
| مدة الصمت            | `...google.silenceDurationMs`                                       | (غير مضبوط)                                                                          |
| مفتاح API            | `...google.apiKey`                                                  | يعود إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال على إعداد الصوت الفوري لـ Voice Call:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
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
تستخدم Google Live API صوتًا ثنائي الاتجاه واستدعاء دوال عبر WebSocket.
يقوم OpenClaw بمواءمة صوت جسور الهاتف/Meet إلى تدفق PCM Live API الخاص بـ Gemini
ويُبقي استدعاءات الأدوات على عقد الصوت الفوري المشترك. اترك `temperature`
غير مضبوط ما لم تكن تحتاج إلى تغييرات في أخذ العينات؛ إذ يتجاهل OpenClaw القيم غير الموجبة
لأن Google Live قد يعيد نصوصًا منسوخة من دون صوت عند `temperature: 0`.
ويُفعّل النسخ في Gemini API من دون `languageCodes`؛ إذ إن Google SDK الحالية
ترفض تلميحات رموز اللغة على مسار API هذا.
</Note>

<Note>
ما تزال جلسات المتصفح الخاصة بـ Control UI Talk تتطلب مزوّد صوت فوري
بتنفيذ جلسة WebRTC في المتصفح. واليوم، يكون هذا المسار هو OpenAI Realtime؛ أما
مزوّد Google فهو مخصص لجسور وقت التشغيل الخلفية.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="إعادة استخدام ذاكرة Gemini المؤقتة مباشرة">
    بالنسبة إلى عمليات Gemini API المباشرة (`api: "google-generative-ai"`)، يقوم OpenClaw
    بتمرير معرّف `cachedContent` مضبوط إلى طلبات Gemini.

    - اضبط معلمات خاصة بكل نموذج أو معلمات عامة باستخدام
      `cachedContent` أو الاسم القديم `cached_content`
    - إذا وُجد كلاهما، فإن `cachedContent` له الأولوية
    - مثال على القيمة: `cachedContents/prebuilt-context`
    - يُطبّع استخدام إصابة ذاكرة Gemini المؤقتة إلى `cacheRead` في OpenClaw انطلاقًا من
      القيمة المصدرية `cachedContentTokenCount`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ملاحظات استخدام JSON في Gemini CLI">
    عند استخدام مزوّد OAuth ‏`google-gemini-cli`، يقوم OpenClaw بتطبيع
    خرج JSON الخاص بـ CLI كما يلي:

    - يأتي نص الرد من الحقل `response` في JSON الخاص بـ CLI.
    - يعود الاستخدام إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - يُطبّع `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يستنتج OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="إعداد البيئة والخدمة">
    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (مثلًا، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
</CardGroup>
