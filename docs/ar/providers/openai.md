---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكلاء GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T14:02:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  توفّر OpenAI واجهات API للمطورين لنماذج GPT. يدعم OpenClaw مسارين للمصادقة:

  - **مفتاح API** — وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (لنماذج `openai/*`)
  - **اشتراك Codex** — تسجيل دخول ChatGPT/Codex مع وصول عبر الاشتراك (لنماذج `openai-codex/*`)

  تدعم OpenAI صراحةً استخدام OAuth الخاص بالاشتراك في الأدوات وسير العمل الخارجية مثل OpenClaw.

  ## تغطية ميزات OpenClaw

  | قدرات OpenAI              | سطح OpenClaw                              | الحالة                                                 |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | الدردشة / Responses       | موفر النموذج `openai/<model>`             | نعم                                                    |
  | نماذج اشتراك Codex        | موفر النموذج `openai-codex/<model>`       | نعم                                                    |
  | البحث على الويب من جهة الخادم | أداة OpenAI Responses الأصلية         | نعم، عندما يكون بحث الويب مفعّلًا ولا يوجد موفر مثبّت |
  | الصور                     | `image_generate`                          | نعم                                                    |
  | الفيديو                   | `video_generate`                          | نعم                                                    |
  | تحويل النص إلى كلام       | `messages.tts.provider: "openai"` / `tts` | نعم                                                    |
  | تحويل الكلام إلى نص دفعةً واحدة | `tools.media.audio` / فهم الوسائط    | نعم                                                    |
  | تحويل الكلام إلى نص بالبث  | Voice Call `streaming.provider: "openai"` | نعم                                                    |
  | الصوت الآني               | Voice Call `realtime.provider: "openai"`  | نعم                                                    |
  | التضمينات                 | موفر تضمينات الذاكرة                      | نعم                                                    |

  ## البدء

  اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

  <Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** وصول API المباشر والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai/gpt-5.4` | OpenAI Platform API مباشر | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | OpenAI Platform API مباشر | `OPENAI_API_KEY` |

    <Note>
    يُوجَّه تسجيل دخول ChatGPT/Codex عبر `openai-codex/*` وليس `openai/*`.
    </Note>

    ### مثال على التكوين

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    لا يعرّض OpenClaw **مطلقًا** `openai/gpt-5.3-codex-spark` على مسار API المباشر. ترفض طلبات OpenAI API الحية ذلك النموذج. Spark مخصص لـ Codex فقط.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex الخاص بك بدلًا من مفتاح API منفصل. يتطلب Codex السحابي تسجيل دخول ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        بالنسبة للإعدادات دون واجهة أو غير الملائمة لرد نداءات callback، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز الجهاز الخاص بـ ChatGPT بدلًا من رد نداء المتصفح المحلي:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="عيّن النموذج الافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | تسجيل دخول Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | تسجيل دخول Codex (بحسب الاستحقاق) |

    <Note>
    هذا المسار منفصل عمدًا عن `openai/gpt-5.4`. استخدم `openai/*` مع مفتاح API للوصول المباشر إلى Platform، واستخدم `openai-codex/*` للوصول عبر اشتراك Codex.
    </Note>

    ### مثال على التكوين

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    لم يعد الإعداد الأولي يستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة agent الخاص به.
    </Note>

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات النموذج الوصفية وحد السياق وقت التشغيل باعتبارهما قيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.4`:

    - `contextWindow` الأصلي: `1050000`
    - الحد الافتراضي لـ `contextTokens` في وقت التشغيل: `272000`

    يتمتع الحد الافتراضي الأصغر بخصائص أفضل عمليًا من حيث زمن الاستجابة والجودة. ويمكنك تجاوزه باستخدام `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    استخدم `contextWindow` للتصريح ببيانات النموذج الوصفية الأصلية. واستخدم `contextTokens` لتقييد ميزانية السياق في وقت التشغيل.
    </Note>

  </Tab>
</Tabs>

## إنشاء الصور

يسجّل Plugin ‏`openai` المضمّن إنشاء الصور عبر الأداة `image_generate`.

| القدرة                  | القيمة                             |
| ----------------------- | ---------------------------------- |
| النموذج الافتراضي       | `openai/gpt-image-2`               |
| الحد الأقصى للصور لكل طلب | 4                                |
| وضع التحرير             | مفعّل (حتى 5 صور مرجعية)           |
| تجاوزات الحجم           | مدعومة، بما في ذلك أحجام 2K/4K     |
| نسبة العرض إلى الارتفاع / الدقة | لا تُمرَّر إلى OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات الأدوات المشتركة، واختيار الموفّر، وسلوك تجاوز الفشل.
</Note>

`gpt-image-2` هو الافتراضي لكل من إنشاء الصور من النص في OpenAI وتحرير الصور. ويظل `gpt-image-1` قابلًا للاستخدام كتجاوز صريح للنموذج، لكن تدفقات عمل الصور الجديدة في OpenAI يجب أن تستخدم `openai/gpt-image-2`.

إنشاء:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

تحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## إنشاء الفيديو

يسجّل Plugin ‏`openai` المضمّن إنشاء الفيديو عبر الأداة `video_generate`.

| القدرة          | القيمة                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2`                                                                  |
| الأوضاع          | تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، وتحرير فيديو واحد                  |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد                                                         |
| تجاوزات الحجم    | مدعومة                                                                            |
| تجاوزات أخرى     | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة     |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأدوات المشتركة، واختيار الموفّر، وسلوك تجاوز الفشل.
</Note>

## مساهمة موجه GPT-5

يضيف OpenClaw مساهمة موجه مشتركة لـ GPT-5 لتشغيلات عائلة GPT-5 عبر الموفّرين. وهي تُطبَّق بحسب معرّف النموذج، لذلك تتلقى `openai/gpt-5.4` و`openai-codex/gpt-5.4` و`openrouter/openai/gpt-5.4` و`opencode/gpt-5.4` ومراجع GPT-5 المتوافقة الأخرى الطبقة نفسها. أما نماذج GPT-4.x الأقدم فلا تتلقاها.

يستخدم موفّر حزمة Codex الأصلية المضمّن (`codex/*`) سلوك GPT-5 نفسه وطبقة Heartbeat نفسها عبر تعليمات المطوّر الخاصة بخادم تطبيق Codex، لذا تحافظ جلسات `codex/gpt-5.x` على الإرشادات نفسها الخاصة بالمتابعة والتصرف الاستباقي عبر Heartbeat، رغم أن Codex يملك بقية موجه الحزمة.

تضيف مساهمة GPT-5 عقد سلوك موسومًا للاستمرار في الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق. ويظل سلوك الرد الخاص بالقناة وسلوك الرسائل الصامتة ضمن موجه النظام المشترك لـ OpenClaw وسياسة التسليم الصادرة. وتكون إرشادات GPT-5 مفعّلة دائمًا للنماذج المطابقة. أما طبقة أسلوب التفاعل الودّي فهي منفصلة وقابلة للتكوين.

| القيمة                 | التأثير                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (افتراضي) | تفعيل طبقة أسلوب التفاعل الودّي             |
| `"on"`                 | اسم مستعار لـ `"friendly"`                  |
| `"off"`                | تعطيل طبقة الأسلوب الودّي فقط               |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
القيم غير حساسة لحالة الأحرف في وقت التشغيل، لذا فإن `"Off"` و`"off"` كلتاهما تعطّلان طبقة الأسلوب الودّي.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم مقروءًا كخيار توافق احتياطي عندما لا يكون الإعداد المشترك `agents.defaults.promptOverlays.gpt5.personality` مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="تركيب الكلام (TTS)">
    يسجّل Plugin ‏`openai` المضمّن تركيب الكلام لسطح `messages.tts`.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود إلى `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    النماذج المتاحة: `gpt-4o-mini-tts` و`tts-1` و`tts-1-hd`. والأصوات المتاحة: `alloy` و`ash` و`ballad` و`cedar` و`coral` و`echo` و`fable` و`juniper` و`marin` و`onyx` و`nova` و`sage` و`shimmer` و`verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان Base URL الخاص بـ TTS من دون التأثير في نقطة نهاية chat API.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin ‏`openai` المضمّن تحويل الكلام إلى نص على دفعات عبر
    سطح النسخ الخاص بفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: ‏OpenAI REST ‏`/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم في OpenClaw أينما كان نسخ الصوت الوارد يستخدم
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية ومرفقات
      الصوت في القنوات

    لفرض OpenAI لنسخ الصوت الوارد:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    تُمرَّر تلميحات اللغة والموجه إلى OpenAI عند توفيرها بواسطة
    إعداد الوسائط الصوتية المشترك أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ الفوري">
    يسجّل Plugin ‏`openai` المضمّن النسخ الفوري لPlugin ‏Voice Call.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير مضبوط) |
    | الموجه | `...openai.prompt` | (غير مضبوط) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). موفر البث هذا مخصص لمسار النسخ الفوري في Voice Call؛ أما الصوت في Discord فيسجّل حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ الدفعي `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    يسجّل Plugin ‏`openai` المضمّن الصوت الفوري لPlugin ‏Voice Call.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفاتيح التكوين `azureEndpoint` و`azureDeployment`. ويدعم استدعاء الأدوات ثنائي الاتجاه. ويستخدم تنسيق الصوت G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفّر `openai` المضمّن استهداف مورد Azure OpenAI من أجل
إنشاء الصور عبر تجاوز عنوان Base URL. وعلى مسار إنشاء الصور، يكتشف OpenClaw
أسماء مضيفي Azure على `models.providers.openai.baseUrl` وينتقل إلى
صيغة طلب Azure تلقائيًا.

<Note>
يستخدم الصوت الفوري مسار تكوين منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت
الفوري** ضمن [الصوت والكلام](#voice-and-speech) لمعرفة إعدادات Azure
الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- يكون لديك بالفعل اشتراك Azure OpenAI، أو حصة، أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure موجود

### التكوين

لإنشاء الصور عبر Azure من خلال موفّر `openai` المضمّن، وجّه
`models.providers.openai.baseUrl` إلى مورد Azure الخاص بك واضبط `apiKey` على
مفتاح Azure OpenAI (وليس مفتاح OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

يتعرف OpenClaw على لاحقات مضيف Azure التالية لمسار Azure الخاص بإنشاء الصور:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

وبالنسبة إلى طلبات إنشاء الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل الترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات مقيّدة بالنشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب

أما عناوين Base URL الأخرى (OpenAI العامة، وواجهات proxy المتوافقة مع OpenAI) فتبقي
صيغة طلب الصور القياسية الخاصة بـ OpenAI.

<Note>
يتطلب توجيه Azure لمسار إنشاء الصور في موفّر `openai`
OpenClaw 2026.4.22 أو أحدث. أما الإصدارات الأقدم فتتعامل مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مع عمليات نشر
الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار Azure معاينة أو GA محدد
لمسار إنشاء الصور عبر Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما لا يكون المتغير مضبوطًا.

### أسماء النماذج هي أسماء عمليات النشر

يربط Azure OpenAI النماذج بعمليات النشر. وبالنسبة إلى طلبات إنشاء الصور في Azure
الموجّهة عبر موفّر `openai` المضمّن، يجب أن يكون الحقل `model` في OpenClaw
هو **اسم نشر Azure** الذي ضبطته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت عملية نشر باسم `gpt-image-2-prod` تخدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

وتنطبق قاعدة اسم النشر نفسها على استدعاءات إنشاء الصور الموجّهة عبر
موفّر `openai` المضمّن.

### التوفر الإقليمي

يتوفر إنشاء الصور في Azure حاليًا فقط في مجموعة فرعية من المناطق
(مثل `eastus2` و`swedencentral` و`polandcentral` و`westus3` و
`uaenorth`). راجع قائمة المناطق الحالية من Microsoft قبل إنشاء
عملية نشر، وأكد أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا تقبل Azure OpenAI وOpenAI العامة دائمًا معلمات الصور نفسها.
وقد ترفض Azure خيارات تسمح بها OpenAI العامة (مثل بعض قيم
`background` على `gpt-image-2`) أو تتيحها فقط على إصدارات نماذج محددة.
وتأتي هذه الاختلافات من Azure ومن النموذج الأساسي، وليس من
OpenClaw. وإذا فشل طلب Azure بخطأ تحقق، فتحقق من
مجموعة المعلمات المدعومة لعملية النشر المحددة وإصدار API في
بوابة Azure.

<Note>
تستخدم Azure OpenAI سلوك نقل وتوافق أصليًا لكنها لا تتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw. راجع أكورديون **المسارات الأصلية مقابل
المسارات المتوافقة مع OpenAI** ضمن [التكوين المتقدم](#advanced-configuration)
للتفاصيل.
</Note>

<Tip>
للحصول على موفّر Azure OpenAI Responses منفصل (مختلف عن موفّر `openai`)، راجع مراجع `azure-openai-responses/*` في أكورديون [Compaction من جهة الخادم](#server-side-compaction-responses-api).
</Tip>

<Note>
تحتاج حركة Azure الخاصة بالدردشة وResponses إلى إعداد موفّر/API خاص بـ Azure
بالإضافة إلى تجاوز عنوان Base URL. وإذا كنت تريد استدعاءات نماذج Azure تتجاوز إنشاء
الصور، فاستخدم تدفق الإعداد الأولي أو إعداد موفّر يضبط
صيغة Azure API/المصادقة المناسبة بدلًا من افتراض أن `openai.baseUrl` وحده
يكفي.
</Note>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw وضع WebSocket أولًا مع رجوع إلى SSE (`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد الفشل، يعلّم WebSocket على أنه متدهور لمدة ~60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات مستقرة لهوية الجلسة والدور لإعادة المحاولة وإعادة الاتصال
    - يطبع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل المختلفة

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (افتراضي) | WebSocket أولًا، مع رجوع إلى SSE |
    | `"sse"` | فرض SSE فقط |
    | `"websocket"` | فرض WebSocket فقط |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    وثائق OpenAI ذات الصلة:
    - [Realtime API مع WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [استجابات API المتدفقة (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="إحماء WebSocket">
    يفعّل OpenClaw إحماء WebSocket افتراضيًا لـ `openai/*` لتقليل زمن الاستجابة في الدور الأول.

    ```json5
    // تعطيل الإحماء
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

<a id="openai-fast-mode"></a>

  <Accordion title="الوضع السريع">
    يوفّر OpenClaw مفتاح تبديل مشتركًا للوضع السريع لكل من `openai/*` و`openai-codex/*`:

    - **الدردشة/واجهة المستخدم:** `/fast status|on|off`
    - **التكوين:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التفعيل، يربط OpenClaw الوضع السريع بالمعالجة ذات الأولوية في OpenAI (`service_tier = "priority"`). وتُحفَظ قيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    تتغلب تجاوزات الجلسة على التكوين. وتؤدي إزالة تجاوز الجلسة في واجهة Sessions إلى إعادة الجلسة إلى القيمة الافتراضية المضبوطة.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    توفّر واجهة OpenAI API المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    القيم المدعومة: `auto` و`default` و`flex` و`priority`.

    <Warning>
    لا تُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). وإذا وجّهت أيًّا من الموفّرين عبر proxy، يترك OpenClaw قيمة `service_tier` دون تعديل.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جهة الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل OpenClaw تلقائيًا Compaction من جهة الخادم:

    - يفرض `store: true` (ما لم يعيّن توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - القيمة الافتراضية لـ `compact_threshold`: 70% من `contextWindow` (أو `80000` عند عدم توفرها)

    <Tabs>
      <Tab title="التفعيل صراحةً">
        مفيد لنقاط النهاية المتوافقة مثل Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="عتبة مخصصة">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="تعطيل">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. ولا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يعيّن التوافق `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT العامل الصارم">
    بالنسبة إلى تشغيلات عائلة GPT-5 على `openai/*` و`openai-codex/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    مع `strict-agentic`، يقوم OpenClaw بما يلي:
    - لم يعد يعتبر دورًا يحتوي على خطة فقط تقدمًا ناجحًا عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور مع توجيه للتصرف الآن
    - يفعّل `update_plan` تلقائيًا للأعمال الجوهرية
    - يعرض حالة تعطّل صريحة إذا استمر النموذج في التخطيط من دون تنفيذ

    <Note>
    يقتصر ذلك على تشغيلات عائلة GPT-5 الخاصة بـ OpenAI وCodex فقط. أما الموفّرون الآخرون وعائلات النماذج الأقدم فتبقي السلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط النهاية المباشرة الخاصة بـ OpenAI وCodex وAzure OpenAI بشكل مختلف عن واجهات proxy العامة المتوافقة مع OpenAI عبر `/v1`:

    **المسارات الأصلية** (`openai/*` و`openai-codex/*` وAzure OpenAI):
    - تُبقي `reasoning: { effort: "none" }` فقط للنماذج التي تدعم قيمة `none` الخاصة بـ OpenAI
    - تحذف التعليل المعطّل للنماذج أو الوكلاء proxies الذين يرفضون `reasoning.effort: "none"`
    - تجعل مخططات الأدوات افتراضيًا في الوضع الصارم
    - ترفق ترويسات إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط
    - تُبقي تشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier` و`store` وتوافق reasoning وتلميحات التخزين المؤقت للموجهات)

    **مسارات proxy/المسارات المتوافقة:**
    - تستخدم سلوك توافق أكثر مرونة
    - لا تفرض مخططات أدوات صارمة أو ترويسات أصلية فقط

    تستخدم Azure OpenAI سلوك نقل وتوافق أصليًا لكنها لا تتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
