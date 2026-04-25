---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

توفّر OpenAI واجهات API للمطورين لنماذج GPT. يدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. تحدد بادئة النموذج المسار:

- **مفتاح API** — وصول مباشر إلى منصة OpenAI مع فوترة حسب الاستخدام (نماذج `openai/*`)
- **اشتراك Codex عبر PI** — تسجيل دخول ChatGPT/Codex مع وصول عبر الاشتراك (نماذج `openai-codex/*`)
- **حزام Codex app-server** — تنفيذ أصلي لـ Codex app-server (نماذج `openai/*` بالإضافة إلى `agents.defaults.embeddedHarness.runtime: "codex"`)

تدعم OpenAI صراحةً استخدام OAuth الخاص بالاشتراك في الأدوات وسير العمل الخارجية مثل OpenClaw.

المزوّد، والنموذج، وبيئة التشغيل، والقناة هي طبقات منفصلة. إذا كانت هذه التسميات
تختلط معًا، فاقرأ [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes) قبل
تغيير الإعدادات.

## الاختيار السريع

| الهدف                                         | استخدم                                                   | ملاحظات                                                                      |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| فوترة مباشرة عبر مفتاح API                    | `openai/gpt-5.4`                                         | اضبط `OPENAI_API_KEY` أو شغّل تهيئة OpenAI لمفتاح API.                       |
| GPT-5.5 مع مصادقة اشتراك ChatGPT/Codex        | `openai-codex/gpt-5.5`                                   | مسار PI الافتراضي لـ Codex OAuth. أفضل خيار أول لإعدادات الاشتراك.          |
| GPT-5.5 مع سلوك Codex app-server الأصلي       | `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"` | يستخدم حزام Codex app-server، وليس مسار API العام لـ OpenAI.                |
| إنشاء الصور أو تحريرها                        | `openai/gpt-image-2`                                     | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.                              |

<Note>
يتوفر GPT-5.5 حاليًا في OpenClaw عبر مسارات الاشتراك/OAuth:
`openai-codex/gpt-5.5` مع مشغّل PI، أو `openai/gpt-5.5` مع
حزام Codex app-server. يُدعَم الوصول المباشر عبر مفتاح API إلى `openai/gpt-5.5`
بمجرد أن تفعّل OpenAI نموذج GPT-5.5 على واجهة API العامة؛ وحتى ذلك الحين استخدم
نموذجًا مفعّلًا على API مثل `openai/gpt-5.4` لإعدادات `OPENAI_API_KEY`.
</Note>

<Note>
لا يؤدي تمكين Plugin الخاص بـ OpenAI، أو اختيار نموذج `openai-codex/*`، إلى
تمكين Plugin المضمّن الخاص بـ Codex app-server. يفعّل OpenClaw هذا Plugin فقط
عندما تختار صراحةً حزام Codex الأصلي باستخدام
`embeddedHarness.runtime: "codex"` أو تستخدم مرجع نموذج قديمًا من `codex/*`.
</Note>

## تغطية ميزات OpenClaw

| إمكانات OpenAI             | سطح OpenClaw                                              | الحالة                                                  |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| الدردشة / Responses        | مزوّد النموذج `openai/<model>`                            | نعم                                                     |
| نماذج اشتراك Codex         | `openai-codex/<model>` مع OAuth `openai-codex`            | نعم                                                     |
| حزام Codex app-server      | `openai/<model>` مع `embeddedHarness.runtime: codex`      | نعم                                                     |
| البحث على الويب من جهة الخادم | أداة OpenAI Responses الأصلية                            | نعم، عند تمكين البحث على الويب وعدم تثبيت مزوّد محدد     |
| الصور                      | `image_generate`                                          | نعم                                                     |
| الفيديو                    | `video_generate`                                          | نعم                                                     |
| تحويل النص إلى كلام        | `messages.tts.provider: "openai"` / `tts`                 | نعم                                                     |
| تحويل الكلام إلى نص على دفعات | `tools.media.audio` / فهم الوسائط                        | نعم                                                     |
| تحويل الكلام إلى نص بشكل متدفق | Voice Call `streaming.provider: "openai"`                | نعم                                                     |
| الصوت الفوري               | Voice Call `realtime.provider: "openai"` / Control UI Talk | نعم                                                     |
| التضمينات                  | مزوّد تضمينات الذاكرة                                     | نعم                                                     |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (منصة OpenAI)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [لوحة تحكم منصة OpenAI](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل التهيئة">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرّر المفتاح مباشرةً:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API مباشر لمنصة OpenAI | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API مباشر لمنصة OpenAI | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | مسار API مباشر مستقبلي بمجرد أن تفعّل OpenAI نموذج GPT-5.5 على API | `OPENAI_API_KEY` |

    <Note>
    يكون `openai/*` هو مسار OpenAI المباشر عبر مفتاح API ما لم تجبر صراحةً
    استخدام حزام Codex app-server. أما GPT-5.5 نفسه فهو حاليًا عبر الاشتراك/OAuth
    فقط؛ استخدم `openai-codex/*` لـ Codex OAuth عبر مشغّل PI الافتراضي، أو
    استخدم `openai/gpt-5.5` مع `embeddedHarness.runtime: "codex"` لتنفيذ
    Codex app-server الأصلي.
    </Note>

    ### مثال على الإعداد

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    لا يوفّر OpenClaw **مطلقًا** `openai/gpt-5.3-codex-spark`. ترفض طلبات OpenAI API الحية هذا النموذج، كما أن فهرس Codex الحالي لا يوفّره أيضًا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex بدلًا من مفتاح API منفصل. يتطلب Codex السحابي تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرةً:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        بالنسبة إلى البيئات عديمة الواجهة أو غير الملائمة لعمليات الاستدعاء الراجع، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز الجهاز الخاص بـ ChatGPT بدلًا من ردّ الاتصال عبر متصفح localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="اضبط النموذج الافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth عبر PI | تسجيل دخول Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | حزام Codex app-server | مصادقة Codex app-server |

    <Note>
    واصل استخدام معرّف المزوّد `openai-codex` لأوامر المصادقة/الملف الشخصي. كما أن
    بادئة النموذج `openai-codex/*` هي أيضًا المسار الصريح لـ PI من أجل Codex OAuth.
    وهي لا تختار ولا تفعّل تلقائيًا حزام Codex app-server المضمّن.
    </Note>

    ### مثال على الإعداد

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    لم تعد التهيئة تستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — ويدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكيل الخاص به.
    </Note>

    ### مؤشر الحالة

    تعرض الدردشة `/status` بيئة تشغيل النموذج النشطة للجلسة الحالية.
    يظهر حزام PI الافتراضي على شكل `Runtime: OpenClaw Pi Default`. وعندما
    يتم اختيار حزام Codex app-server المضمّن، تعرض `/status`
    `Runtime: OpenAI Codex`. تحتفظ الجلسات الحالية بمعرّف الحزام المسجل الخاص بها، لذا استخدم
    `/new` أو `/reset` بعد تغيير `embeddedHarness` إذا أردت أن يعكس `/status`
    اختيار PI/Codex جديدًا.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات تعريف النموذج وحد بيئة التشغيل للسياق كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - الحد الافتراضي `contextTokens` في بيئة التشغيل: `272000`

    يتمتع الحد الافتراضي الأصغر بزمن استجابة وخصائص جودة أفضل عمليًا. يمكنك تجاوزه باستخدام `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    استخدم `contextWindow` للتصريح ببيانات تعريف النموذج الأصلية. واستخدم `contextTokens` لتقييد ميزانية السياق في بيئة التشغيل.
    </Note>

    ### استعادة الفهرس

    يستخدم OpenClaw بيانات تعريف فهرس Codex المصدرية لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل الاكتشاف الحي لـ Codex الصف `openai-codex/gpt-5.5` بينما
    يكون الحساب موثّقًا، فإن OpenClaw ينشئ هذا الصف الخاص بنموذج OAuth اصطناعيًا حتى
    لا تفشل عمليات cron، والوكلاء الفرعيين، وتشغيلات النموذج الافتراضي المكوَّن
    بسبب الخطأ `Unknown model`.

  </Tab>
</Tabs>

## إنشاء الصور

يسجل Plugin المضمّن `openai` إنشاء الصور من خلال الأداة `image_generate`.
وهو يدعم كلًا من إنشاء الصور عبر مفتاح OpenAI API وإنشاء الصور
عبر Codex OAuth باستخدام مرجع النموذج نفسه `openai/gpt-image-2`.

| الإمكانية                  | مفتاح OpenAI API                    | Codex OAuth                           |
| -------------------------- | ----------------------------------- | ------------------------------------- |
| مرجع النموذج               | `openai/gpt-image-2`                | `openai/gpt-image-2`                  |
| المصادقة                   | `OPENAI_API_KEY`                    | تسجيل دخول OpenAI Codex OAuth         |
| النقل                      | OpenAI Images API                   | الواجهة الخلفية لـ Codex Responses    |
| الحد الأقصى للصور لكل طلب   | 4                                   | 4                                     |
| وضع التحرير                | مفعّل (حتى 5 صور مرجعية)            | مفعّل (حتى 5 صور مرجعية)              |
| تجاوزات الحجم              | مدعوم، بما في ذلك أحجام 2K/4K       | مدعوم، بما في ذلك أحجام 2K/4K         |
| نسبة الأبعاد / الدقة       | لا يتم تمريرها إلى OpenAI Images API | تُحوَّل إلى حجم مدعوم عندما يكون ذلك آمنًا |

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
راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

يمثل `gpt-image-2` الإعداد الافتراضي لكل من إنشاء الصور من النص في OpenAI وتحرير
الصور. لا يزال `gpt-image-1` قابلًا للاستخدام كتجاوز صريح للنموذج، لكن
ينبغي أن تستخدم مهام سير عمل الصور الجديدة في OpenAI `openai/gpt-image-2`.

بالنسبة إلى عمليات التثبيت التي تستخدم Codex OAuth، احتفِظ بمرجع `openai/gpt-image-2` نفسه. عند
تهيئة ملف OAuth شخصي لـ `openai-codex`، يقوم OpenClaw بحل رمز وصول OAuth
المخزن هذا ويرسل طلبات الصور عبر الواجهة الخلفية لـ Codex Responses. وهو
لا يحاول أولًا استخدام `OPENAI_API_KEY` ولا يعود بصمت إلى مفتاح API لهذا
الطلب. هيّئ `models.providers.openai` صراحةً باستخدام مفتاح API،
أو عنوان URL أساسي مخصص، أو نقطة نهاية Azure عندما تريد استخدام مسار
OpenAI Images API المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه موجودة على شبكة LAN موثوقة/عنوان خاص، فاضبط أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ يبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم يكن هذا الخيار
الاختياري موجودًا.

إنشاء:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

تحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## إنشاء الفيديو

يسجل Plugin المضمّن `openai` إنشاء الفيديو من خلال الأداة `video_generate`.

| الإمكانية       | القيمة                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2`                                                                   |
| الأوضاع          | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو فردي                                   |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد                                                          |
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
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## مساهمة مطالبة GPT-5

يضيف OpenClaw مساهمة مطالبة مشتركة لـ GPT-5 لتشغيلات عائلة GPT-5 عبر المزوّدين. وهي تُطبَّق بحسب معرّف النموذج، لذا فإن `openai-codex/gpt-5.5` و`openai/gpt-5.4` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` وغيرها من مراجع GPT-5 المتوافقة تتلقى الطبقة الإضافية نفسها. أما نماذج GPT-4.x الأقدم فلا تتلقاها.

يستخدم حزام Codex الأصلي المضمّن السلوك نفسه الخاص بـ GPT-5 وطبقة Heartbeat الإضافية عبر تعليمات المطوّر في Codex app-server، لذلك تحتفظ جلسات `openai/gpt-5.x` المفروضة عبر `embeddedHarness.runtime: "codex"` بإرشادات المتابعة نفسها وإرشادات Heartbeat الاستباقية نفسها، حتى مع كون Codex يملك بقية مطالبة الحزام.

تضيف مساهمة GPT-5 عقد سلوك مع وسم للاستمرارية الخاصة بالشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وعمليات التحقق من الاكتمال، والتحقق. ويظل سلوك الردود الخاص بالقنوات وسلوك الرسائل الصامتة في مطالبة النظام المشتركة لـ OpenClaw وسياسة التسليم الصادرة. تكون إرشادات GPT-5 ممكّنة دائمًا للنماذج المطابقة. أما طبقة أسلوب التفاعل الودي فهي منفصلة وقابلة للتهيئة.

| القيمة                 | التأثير                                     |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (الافتراضي) | تمكين طبقة أسلوب التفاعل الودي             |
| `"on"`                 | اسم بديل لـ `"friendly"`                    |
| `"off"`                | تعطيل طبقة الأسلوب الودي فقط                |

<Tabs>
  <Tab title="الإعداد">
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
القيم غير حساسة لحالة الأحرف وقت التشغيل، لذا فإن `"Off"` و`"off"` كلتيهما تعطلان طبقة الأسلوب الودي.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم مقروءًا كخيار توافق احتياطي عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="تركيب الكلام (TTS)">
    يسجل Plugin المضمّن `openai` تركيب الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود إلى `OPENAI_API_KEY` |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS من دون التأثير في نقطة نهاية API الخاصة بالدردشة.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجل Plugin المضمّن `openai` تحويل الكلام إلى نص على دفعات من خلال
    سطح النسخ الخاص بفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: واجهة REST من OpenAI على `/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم في OpenClaw أينما استخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية وملفات
      الصوت المرفقة في القنوات

    لفرض استخدام OpenAI لنسخ الصوت الوارد:

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

    يتم تمرير تلميحات اللغة والمطالبة إلى OpenAI عند توفيرها عبر
    إعدادات وسائط الصوت المشتركة أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ الفوري">
    يسجل Plugin المضمّن `openai` النسخ الفوري لـ Plugin الخاص بـ Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير مضبوط) |
    | المطالبة | `...openai.prompt` | (غير مضبوط) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). موفّر البث هذا مخصّص لمسار النسخ الفوري في Voice Call؛ أما صوت Discord فيسجل حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ الدفعي `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    يسجل Plugin المضمّن `openai` الصوت الفوري لـ Plugin الخاص بـ Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفتاحي الإعداد `azureEndpoint` و`azureDeployment`. ويدعم استدعاء الأدوات في الاتجاهين. ويستخدم تنسيق الصوت G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لمزوّد `openai` المضمّن استهداف مورد Azure OpenAI لإنشاء
الصور عبر تجاوز عنوان URL الأساسي. وفي مسار إنشاء الصور، يكتشف OpenClaw
أسماء مضيفي Azure على `models.providers.openai.baseUrl` ويتحول إلى
شكل طلب Azure تلقائيًا.

<Note>
يستخدم الصوت الفوري مسار إعداد منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع قسم **الصوت
الفوري** القابل للطي ضمن [الصوت والكلام](#voice-and-speech) للاطلاع على
إعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI، أو حصة، أو اتفاقية مؤسسية
- تحتاج إلى الإقامة الإقليمية للبيانات أو عناصر التحكم في الامتثال التي توفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure حالي

### الإعداد

لإنشاء الصور عبر Azure من خلال مزوّد `openai` المضمّن، وجّه
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

يتعرف OpenClaw على لواحق مضيف Azure التالية لمسار إنشاء الصور
في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

بالنسبة إلى طلبات إنشاء الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل الترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات ضمن النشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب

أما عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI) فتحتفظ
بشكل طلب الصور القياسي الخاص بـ OpenAI.

<Note>
يتطلب توجيه Azure لمسار إنشاء الصور الخاص بمزوّد `openai`
الإصدار OpenClaw 2026.4.22 أو الأحدث. فالإصدارات الأقدم تتعامل مع أي
`openai.baseUrl` مخصص كما لو كان نقطة نهاية OpenAI العامة، وبالتالي ستفشل مع
عمليات نشر الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار Azure محدد، سواء كان تجريبيًا أو إصدار GA،
لمسار إنشاء الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما لا يكون المتغير مضبوطًا.

### أسماء النماذج هي أسماء عمليات النشر

يربط Azure OpenAI النماذج بعمليات النشر. وبالنسبة إلى طلبات إنشاء الصور في Azure
الموجّهة عبر مزوّد `openai` المضمّن، يجب أن يكون الحقل `model` في OpenClaw
هو **اسم نشر Azure** الذي قمت بتهيئته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يخدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات إنشاء الصور الموجّهة عبر
مزوّد `openai` المضمّن.

### التوفر الإقليمي

يتوفر إنشاء الصور في Azure حاليًا فقط في مجموعة فرعية من المناطق
(على سبيل المثال `eastus2` و`swedencentral` و`polandcentral` و`westus3` و
`uaenorth`). تحقق من قائمة المناطق الحالية لدى Microsoft قبل إنشاء
عملية نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا تقبل Azure OpenAI وOpenAI العامة دائمًا معلمات الصور نفسها.
فقد ترفض Azure خيارات تسمح بها OpenAI العامة (على سبيل المثال بعض قيم
`background` في `gpt-image-2`) أو لا تتيحها إلا في إصدارات محددة من
النموذج. تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. إذا فشل طلب Azure بسبب خطأ تحقق من الصحة، فتحقق من
مجموعة المعلمات التي يدعمها النشر وإصدار API المحددان لديك في
بوابة Azure.

<Note>
تستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنها لا تتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع الأكورديون **المسارات
الأصلية مقابل المسارات المتوافقة مع OpenAI** ضمن [الإعدادات المتقدمة](#advanced-configuration).

بالنسبة إلى حركة مرور الدردشة أو Responses على Azure (إلى جانب إنشاء
الصور)، استخدم تدفق التهيئة أو إعداد مزوّد Azure مخصص — إن `openai.baseUrl`
وحده لا يلتقط شكل Azure الخاص بـ API/المصادقة. يوجد مزوّد منفصل
`azure-openai-responses/*`؛ راجع
أكورديون Compaction من جهة الخادم أدناه.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw WebSocket أولًا مع الرجوع الاحتياطي إلى SSE (`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد المحاولة بعد فشل WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد الفشل، يضع علامة على WebSocket على أنه متدهور لمدة تقارب 60 ثانية ويستخدم SSE خلال فترة التهدئة
    - يرفق ترويسات مستقرة لهوية الجلسة والدور لعمليات إعادة المحاولة وإعادة الاتصال
    - يطبّع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل المختلفة

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، مع رجوع احتياطي إلى SSE |
    | `"sse"` | فرض SSE فقط |
    | `"websocket"` | فرض WebSocket فقط |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    مستندات OpenAI ذات الصلة:
    - [Realtime API مع WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [استجابات API المتدفقة (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="تهيئة WebSocket المسبقة">
    يفعّل OpenClaw التهيئة المسبقة لـ WebSocket افتراضيًا لكل من `openai/*` و`openai-codex/*` لتقليل زمن الاستجابة في الدور الأول.

    ```json5
    // تعطيل التهيئة المسبقة
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

  <Accordion title="الوضع السريع">
    يوفّر OpenClaw مفتاح تبديل مشترك للوضع السريع لكل من `openai/*` و`openai-codex/*`:

    - **الدردشة/UI:** `/fast status|on|off`
    - **الإعداد:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التمكين، يربط OpenClaw الوضع السريع بالمعالجة ذات الأولوية في OpenAI (`service_tier = "priority"`). ويتم الاحتفاظ بقيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    تتغلب تجاوزات الجلسة على الإعداد. تؤدي إزالة تجاوز الجلسة في UI الجلسات إلى إعادة الجلسة إلى الإعداد الافتراضي المهيأ.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    تعرض واجهة API الخاصة بـ OpenAI المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    القيم المدعومة: `auto` و`default` و`flex` و`priority`.

    <Warning>
    لا يتم تمرير `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا مرّرت أيًا من المزوّدين عبر وكيل، يترك OpenClaw `service_tier` كما هو.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جهة الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل غلاف التدفق الخاص بحزام Pi في Plugin الخاص بـ OpenAI ميزة Compaction من جهة الخادم تلقائيًا:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` الافتراضي: 70% من `contextWindow` (أو `80000` عندما لا يكون متاحًا)

    ينطبق ذلك على مسار حزام Pi المضمّن وعلى خطافات مزوّد OpenAI المستخدمة في التشغيلات المضمّنة. أما حزام Codex app-server الأصلي فيدير السياق الخاص به عبر Codex ويُهيّأ بشكل منفصل باستخدام `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="تمكين صريح">
        مفيد لنقاط النهاية المتوافقة مثل Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. ولا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يضبط التوافق `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الوكيلي الصارم">
    بالنسبة إلى تشغيلات عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

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
    - لم يعد يتعامل مع دور قائم على الخطة فقط على أنه تقدم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور مع توجيه للتنفيذ الفوري
    - يفعّل `update_plan` تلقائيًا للأعمال الجوهرية
    - يعرض حالة تعطّل صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    هذا النطاق يقتصر على تشغيلات OpenAI وCodex من عائلة GPT-5 فقط. أما المزوّدون الآخرون وعائلات النماذج الأقدم فتحتفظ بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI المباشرة وCodex وAzure OpenAI بطريقة مختلفة عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`, Azure OpenAI):
    - تحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - تُسقط reasoning المعطّل للنماذج أو الوكلاء الذين يرفضون `reasoning.effort: "none"`
    - تجعل مخططات الأدوات في الوضع الصارم افتراضيًا
    - ترفق ترويسات إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط
    - تحتفظ بتشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier` و`store` وتوافق reasoning وتلميحات ذاكرة التخزين المؤقت للمطالبة)

    **المسارات الوكيلة/المتوافقة:**
    - تستخدم سلوك توافق أكثر تساهلًا
    - تزيل Completions `store` من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوكلاء Completions المتوافقين مع OpenAI
    - لا تفرض مخططات أدوات صارمة ولا ترويسات أصلية فقط

    تستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنها لا تتلقى ترويسات الإسناد المخفية.

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
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
