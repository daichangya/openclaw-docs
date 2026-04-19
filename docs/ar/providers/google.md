---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini ‏(مفتاح API + OAuth، إنشاء الصور، فهم الوسائط، تحويل النص إلى كلام، البحث على الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-19T01:11:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

يوفّر Plugin ‏Google إمكانية الوصول إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى
إنشاء الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- واجهة API: ‏Google Gemini API
- مزوّد بديل: `google-gemini-cli` ‏(OAuth)

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** الوصول القياسي إلى Gemini API عبر Google AI Studio.

    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        أو مرّر المفتاح مباشرةً:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="تعيين نموذج افتراضي">
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
      <Step title="التحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    يتم قبول متغيرَي البيئة `GEMINI_API_KEY` و `GOOGLE_API_KEY` كليهما. استخدم أيًّا منهما إذا كان مُعدًا لديك بالفعل.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI ‏(OAuth)">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Gemini CLI موجود عبر PKCE OAuth بدلًا من مفتاح API منفصل.

    <Warning>
    يعدّ المزوّد `google-gemini-cli` تكاملًا غير رسمي. يفيد بعض المستخدمين
    بوجود قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك الخاصة.
    </Warning>

    <Steps>
      <Step title="تثبيت Gemini CLI">
        يجب أن يكون الأمر المحلي `gemini` متاحًا على `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        يدعم OpenClaw كلًا من تثبيتات Homebrew والتثبيتات العامة عبر npm، بما في ذلك
        تخطيطات Windows/npm الشائعة.
      </Step>
      <Step title="تسجيل الدخول عبر OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="التحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
    - الاسم البديل: `gemini-cli`

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (أو صيغ `GEMINI_CLI_*`.)

    <Note>
    إذا فشلت طلبات OAuth الخاصة بـ Gemini CLI بعد تسجيل الدخول، فقم بتعيين `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء تدفق المتصفح، فتأكد من أن الأمر المحلي `gemini`
    مثبت ومتاح على `PATH`.
    </Note>

    إن المزوّد `google-gemini-cli` المخصص لـ OAuth فقط هو
    سطح مستقل للاستدلال النصي. تظلّ ميزات إنشاء الصور، وفهم الوسائط، وGemini Grounding على
    معرّف المزوّد `google`.

  </Tab>
</Tabs>

## الإمكانات

| الإمكانية             | مدعومة                         |
| --------------------- | ------------------------------ |
| إكمالات الدردشة       | نعم                            |
| إنشاء الصور           | نعم                            |
| إنشاء الموسيقى        | نعم                            |
| تحويل النص إلى كلام   | نعم                            |
| فهم الصور             | نعم                            |
| نسخ الصوت             | نعم                            |
| فهم الفيديو           | نعم                            |
| البحث على الويب (Grounding) | نعم                     |
| التفكير/الاستدلال     | نعم (`Gemini 2.5+` / `Gemini 3+`) |
| نماذج Gemma 4         | نعم                            |

<Tip>
تستخدم نماذج Gemini 3 القيمة `thinkingLevel` بدلًا من `thinkingBudget`. يقوم OpenClaw
بربط عناصر التحكم في الاستدلال الخاصة بـ Gemini 3 وGemini 3.1 والاسم البديل `gemini-*-latest`
بـ `thinkingLevel` حتى لا ترسل عمليات التشغيل الافتراضية/منخفضة الكمون
قيم `thinkingBudget` المعطّلة.

تدعم نماذج Gemma 4 (على سبيل المثال `gemma-4-26b-a4b-it`) وضع التفكير. يعيد OpenClaw
كتابة `thinkingBudget` إلى قيمة Google ‏`thinkingLevel` مدعومة لنماذج Gemma 4.
ويؤدي تعيين التفكير إلى `off` إلى إبقاء التفكير معطّلًا بدلًا من ربطه بـ
`MINIMAL`.
</Tip>

## إنشاء الصور

يستخدم مزوّد إنشاء الصور `google` المضمّن افتراضيًا
`google/gemini-3.1-flash-image-preview`.

- يدعم أيضًا `google/gemini-3-pro-image-preview`
- الإنشاء: حتى 4 صور لكل طلب
- وضع التعديل: مفعّل، حتى 5 صور إدخال
- عناصر التحكم الهندسية: `size` و `aspectRatio` و `resolution`

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
راجع [إنشاء الصور](/ar/tools/image-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## إنشاء الفيديو

يسجّل Plugin ‏`google` المضمّن أيضًا إنشاء الفيديو عبر الأداة المشتركة
`video_generate`.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، وتدفقات مرجعية لفيديو واحد
- يدعم `aspectRatio` و `resolution` و `audio`
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
راجع [إنشاء الفيديو](/ar/tools/video-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## إنشاء الموسيقى

يسجّل Plugin ‏`google` المضمّن أيضًا إنشاء الموسيقى عبر الأداة المشتركة
`music_generate`.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر التحكم في المطالبة: `lyrics` و `instrumental`
- تنسيق الخرج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- المدخلات المرجعية: حتى 10 صور
- تُفصل عمليات التشغيل المدعومة بالجلسة عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

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
راجع [إنشاء الموسيقى](/ar/tools/music-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## تحويل النص إلى كلام

يستخدم مزوّد الكلام `google` المضمّن مسار TTS الخاص بـ Gemini API مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الخرج: ‏WAV لمرفقات TTS العادية، وPCM للمكالمات Talk/الهاتفية
- خرج الملاحظات الصوتية الأصلي: غير مدعوم في مسار Gemini API هذا لأن واجهة API تُرجع PCM بدلًا من Opus

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
        },
      },
    },
  },
}
```

يقبل TTS في Gemini API علامات صوتية تعبيرية بين أقواس مربعة داخل النص، مثل
`[whispers]` أو `[laughs]`. ولإبقاء العلامات خارج رد الدردشة الظاهر مع
إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
يعدّ مفتاح API من Google Cloud Console المقيّد بـ Gemini API صالحًا لهذا
المزوّد. هذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="إعادة استخدام ذاكرة Gemini المؤقتة مباشرةً">
    بالنسبة إلى عمليات Gemini API المباشرة (`api: "google-generative-ai"`)، يقوم OpenClaw
    بتمرير مقبض `cachedContent` مُعدّ إلى طلبات Gemini.

    - اضبط المعلمات لكل نموذج أو المعلمات العامة باستخدام
      `cachedContent` أو `cached_content` القديم
    - إذا كان كلاهما موجودًا، تكون الأولوية لـ `cachedContent`
    - مثال على القيمة: `cachedContents/prebuilt-context`
    - تتم تسوية استخدام إصابة الذاكرة المؤقتة في Gemini إلى `cacheRead` في OpenClaw انطلاقًا من
      `cachedContentTokenCount` في المصدر

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
    عند استخدام مزوّد OAuth ‏`google-gemini-cli`، يقوم OpenClaw بتسوية
    خرج JSON الخاص بـ CLI على النحو التالي:

    - يأتي نص الرد من الحقل `response` في JSON الخاص بـ CLI.
    - يعود الاستخدام إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - تتم تسوية `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="إعداد البيئة والخدمة">
    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الموسيقى" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
</CardGroup>
