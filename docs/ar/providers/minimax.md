---
read_when:
    - تريد نماذج MiniMax في OpenClaw
    - تحتاج إلى إرشادات إعداد MiniMax
summary: استخدم نماذج MiniMax في OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

يستخدم موفّر MiniMax في OpenClaw افتراضيًا **MiniMax M2.7**.

كما توفّر MiniMax أيضًا:

- توليد الكلام المجمّع عبر T2A v2
- فهم الصور المجمّع عبر `MiniMax-VL-01`
- توليد الموسيقى المجمّع عبر `music-2.6`
- `web_search` المجمّع عبر واجهة MiniMax Coding Plan search API

تقسيم الموفّر:

| معرّف الموفّر   | المصادقة  | القدرات                                                      |
| --------------- | --------- | ------------------------------------------------------------ |
| `minimax`       | مفتاح API | النص، وتوليد الصور، وفهم الصور، والكلام، والبحث في الويب     |
| `minimax-portal`| OAuth     | النص، وتوليد الصور، وفهم الصور، والكلام                      |

## الفهرس المدمج

| النموذج                   | النوع            | الوصف                                       |
| ------------------------- | ---------------- | ------------------------------------------- |
| `MiniMax-M2.7`            | دردشة (reasoning) | نموذج reasoning المستضاف الافتراضي         |
| `MiniMax-M2.7-highspeed`  | دردشة (reasoning) | طبقة reasoning أسرع لـ M2.7                |
| `MiniMax-VL-01`           | رؤية             | نموذج فهم الصور                             |
| `image-01`                | توليد صور        | تحويل النص إلى صورة وتحرير صورة إلى صورة    |
| `music-2.6`               | توليد موسيقى     | نموذج الموسيقى الافتراضي                    |
| `music-2.5`               | توليد موسيقى     | الطبقة السابقة لتوليد الموسيقى              |
| `music-2.0`               | توليد موسيقى     | طبقة توليد الموسيقى القديمة                 |
| `MiniMax-Hailuo-2.3`      | توليد فيديو      | تدفقات النص إلى فيديو ومرجع الصور           |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **الأفضل من أجل:** إعداد سريع مع MiniMax Coding Plan عبر OAuth، من دون الحاجة إلى مفتاح API.

    <Tabs>
      <Tab title="دولي">
        <Steps>
          <Step title="شغّل الإعداد التوجيهي">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            يؤدي هذا إلى المصادقة مقابل `api.minimax.io`.
          </Step>
          <Step title="تحقق من توفر النموذج">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="الصين">
        <Steps>
          <Step title="شغّل الإعداد التوجيهي">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            يؤدي هذا إلى المصادقة مقابل `api.minimaxi.com`.
          </Step>
          <Step title="تحقق من توفر النموذج">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    تستخدم إعدادات OAuth معرّف الموفّر `minimax-portal`. وتتبع مراجع النماذج الصيغة `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    رابط إحالة إلى MiniMax Coding Plan ‏(خصم 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="مفتاح API">
    **الأفضل من أجل:** MiniMax المستضافة مع API متوافقة مع Anthropic.

    <Tabs>
      <Tab title="دولي">
        <Steps>
          <Step title="شغّل الإعداد التوجيهي">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            يؤدي هذا إلى تهيئة `api.minimax.io` باعتباره base URL.
          </Step>
          <Step title="تحقق من توفر النموذج">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="الصين">
        <Steps>
          <Step title="شغّل الإعداد التوجيهي">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            يؤدي هذا إلى تهيئة `api.minimaxi.com` باعتباره base URL.
          </Step>
          <Step title="تحقق من توفر النموذج">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### مثال على التهيئة

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    على مسار البث المتوافق مع Anthropic، يعطّل OpenClaw reasoning في MiniMax افتراضيًا ما لم تعيّن `thinking` بنفسك صراحةً. إذ إن نقطة نهاية البث الخاصة بـ MiniMax تُصدر `reasoning_content` في أجزاء delta بأسلوب OpenAI بدلًا من كتل thinking الأصلية لـ Anthropic، مما قد يؤدي إلى تسريب reasoning الداخلية إلى الخرج المرئي إذا تُركت مفعّلة ضمنيًا.
    </Warning>

    <Note>
    تستخدم إعدادات مفتاح API معرّف الموفّر `minimax`. وتتبع مراجع النماذج الصيغة `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## التهيئة عبر `openclaw configure`

استخدم معالج التهيئة التفاعلي لضبط MiniMax من دون تحرير JSON:

<Steps>
  <Step title="شغّل المعالج">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="اختر Model/auth">
    اختر **Model/auth** من القائمة.
  </Step>
  <Step title="اختر أحد خيارات مصادقة MiniMax">
    اختر أحد خيارات MiniMax المتاحة:

    | خيار المصادقة | الوصف |
    | --- | --- |
    | `minimax-global-oauth` | OAuth دولية (Coding Plan) |
    | `minimax-cn-oauth` | OAuth في الصين (Coding Plan) |
    | `minimax-global-api` | مفتاح API دولي |
    | `minimax-cn-api` | مفتاح API في الصين |

  </Step>
  <Step title="اختر النموذج الافتراضي">
    اختر النموذج الافتراضي عند مطالبتك بذلك.
  </Step>
</Steps>

## القدرات

### توليد الصور

تسجّل Plugin الخاصة بـ MiniMax النموذج `image-01` لأداة `image_generate`. وهو يدعم:

- **توليد الصور من النص** مع التحكم في نسبة الأبعاد
- **تحرير الصورة إلى صورة** (مرجع الموضوع) مع التحكم في نسبة الأبعاد
- ما يصل إلى **9 صور ناتجة** لكل طلب
- ما يصل إلى **1 صورة مرجعية** لكل طلب تحرير
- نسب الأبعاد المدعومة: `1:1` و`16:9` و`4:3` و`3:2` و`2:3` و`3:4` و`9:16` و`21:9`

لاستخدام MiniMax لتوليد الصور، اضبطها كموفّر توليد الصور:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

تستخدم Plugin المصادقة نفسها `MINIMAX_API_KEY` أو OAuth كما في النماذج النصية. ولا يلزم أي إعداد إضافي إذا كانت MiniMax مضبوطة بالفعل.

يسجل كل من `minimax` و`minimax-portal` أداة `image_generate` مع النموذج نفسه
`image-01`. وتستخدم إعدادات مفتاح API القيمة `MINIMAX_API_KEY`؛ أما إعدادات OAuth فيمكنها استخدام
مسار المصادقة المجمّع `minimax-portal` بدلًا من ذلك.

عندما تكتب onboarding أو إعداد مفتاح API إدخالات صريحة في `models.providers.minimax`,
فإن OpenClaw ينشئ `MiniMax-M2.7` و
`MiniMax-M2.7-highspeed` كنماذج دردشة نصية فقط. ويتم تعريض فهم الصور
بشكل منفصل عبر موفّر الوسائط `MiniMax-VL-01` المملوك للـ Plugin.

<Note>
راجع [توليد الصور](/ar/tools/image-generation) للاطلاع على معاملات الأدوات المشتركة، واختيار الموفّر، وسلوك failover.
</Note>

### تحويل النص إلى كلام

تسجّل Plugin المجمّعة `minimax` أيضًا خدمة MiniMax T2A v2 كموفّر كلام من أجل
`messages.tts`.

- نموذج TTS الافتراضي: `speech-2.8-hd`
- الصوت الافتراضي: `English_expressive_narrator`
- تتضمن معرّفات النماذج المجمّعة المدعومة `speech-2.8-hd` و`speech-2.8-turbo`،
  و`speech-2.6-hd`، و`speech-2.6-turbo`، و`speech-02-hd`،
  و`speech-02-turbo`، و`speech-01-hd`، و`speech-01-turbo`.
- يكون حل المصادقة بالترتيب: `messages.tts.providers.minimax.apiKey`، ثم
  auth profiles الخاصة بـ OAuth/token لـ `minimax-portal`، ثم مفاتيح البيئة لخطة Token (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`)، ثم `MINIMAX_API_KEY`.
- إذا لم تتم تهيئة مضيف TTS، فإن OpenClaw يعيد استخدام مضيف OAuth المهيأ لـ
  `minimax-portal` ويزيل لواحق المسارات المتوافقة مع Anthropic
  مثل `/anthropic`.
- تظل مرفقات الصوت العادية بصيغة MP3.
- تتم إعادة ترميز أهداف الملاحظات الصوتية مثل Feishu وTelegram من MP3 الخاصة بـ MiniMax
  إلى Opus بتردد 48kHz باستخدام `ffmpeg`، لأن واجهة Feishu/Lark الخاصة بالملفات لا
  تقبل إلا `file_type: "opus"` للرسائل الصوتية الأصلية.
- تقبل MiniMax T2A قيم `speed` و`vol` الكسرية، لكن `pitch` تُرسل على هيئة
  عدد صحيح؛ ويقوم OpenClaw بقطع القيم الكسرية لـ `pitch` قبل طلب API.

| الإعداد                                  | متغير env              | الافتراضي                    | الوصف                              |
| ---------------------------------------- | ---------------------- | ---------------------------- | ---------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`     | مضيف MiniMax T2A API.              |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`              | معرّف نموذج TTS.                   |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator`| معرّف الصوت المستخدم في خرج الكلام. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                        | سرعة التشغيل، `0.5..2.0`.          |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                        | مستوى الصوت، `(0, 10]`.            |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                          | إزاحة pitch صحيحة، `-12..12`.      |

### توليد الموسيقى

تسجّل Plugin المجمّعة `minimax` أيضًا توليد الموسيقى عبر
أداة `music_generate` المشتركة.

- نموذج الموسيقى الافتراضي: `minimax/music-2.6`
- كما يدعم `minimax/music-2.5` و`minimax/music-2.0`
- عناصر التحكم في prompt: ‏`lyrics` و`instrumental` و`durationSeconds`
- صيغة الخرج: `mp3`
- تُفصل التشغيلات المدعومة بالجلسات عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

لاستخدام MiniMax كموفّر الموسيقى الافتراضي:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
راجع [توليد الموسيقى](/ar/tools/music-generation) للاطلاع على معاملات الأدوات المشتركة، واختيار الموفّر، وسلوك failover.
</Note>

### توليد الفيديو

تسجّل Plugin المجمّعة `minimax` أيضًا توليد الفيديو عبر
أداة `video_generate` المشتركة.

- نموذج الفيديو الافتراضي: `minimax/MiniMax-Hailuo-2.3`
- الأوضاع: النص إلى فيديو وتدفقات المرجع أحادي الصورة
- يدعم `aspectRatio` و`resolution`

لاستخدام MiniMax كموفّر الفيديو الافتراضي:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
راجع [توليد الفيديو](/ar/tools/video-generation) للاطلاع على معاملات الأدوات المشتركة، واختيار الموفّر، وسلوك failover.
</Note>

### فهم الصور

تسجّل Plugin الخاصة بـ MiniMax فهم الصور بشكل منفصل عن الفهرس
النصي:

| معرّف الموفّر   | نموذج الصور الافتراضي |
| --------------- | --------------------- |
| `minimax`       | `MiniMax-VL-01`       |
| `minimax-portal`| `MiniMax-VL-01`       |

ولهذا السبب يمكن للتوجيه التلقائي للوسائط استخدام فهم الصور في MiniMax حتى
عندما لا يزال فهرس موفّر النصوص المجمّع يعرض مراجع دردشة M2.7 النصية فقط.

### البحث في الويب

تسجّل Plugin الخاصة بـ MiniMax أيضًا `web_search` عبر
واجهة MiniMax Coding Plan search API.

- معرّف الموفّر: `minimax`
- النتائج المهيكلة: العناوين، وعناوين URL، والمقتطفات، والاستعلامات ذات الصلة
- متغير البيئة المفضل: `MINIMAX_CODE_PLAN_KEY`
- الاسم البديل المقبول في env: `MINIMAX_CODING_API_KEY`
- fallback للتوافق: `MINIMAX_API_KEY` عندما يشير بالفعل إلى token لخطة coding-plan
- إعادة استخدام المنطقة: `plugins.entries.minimax.config.webSearch.region`، ثم `MINIMAX_API_HOST`، ثم base URLs الخاصة بموفّر MiniMax
- يبقى البحث على معرّف الموفّر `minimax`؛ ويمكن لإعداد OAuth الخاص بـ CN/global أن يوجّه المنطقة بشكل غير مباشر عبر `models.providers.minimax-portal.baseUrl`

توجد التهيئة تحت `plugins.entries.minimax.config.webSearch.*`.

<Note>
راجع [MiniMax Search](/ar/tools/minimax-search) للاطلاع على التهيئة الكاملة للبحث في الويب وطريقة الاستخدام.
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="خيارات التهيئة">
    | الخيار | الوصف |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | فضّل `https://api.minimax.io/anthropic` ‏(متوافق مع Anthropic)؛ ويُعد `https://api.minimax.io/v1` اختياريًا للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.api` | فضّل `anthropic-messages`؛ ويُعد `openai-completions` اختياريًا للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.apiKey` | مفتاح MiniMax API ‏(`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | عرّف `id` و`name` و`reasoning` و`contextWindow` و`maxTokens` و`cost` |
    | `agents.defaults.models` | أعطِ أسماء بديلة للنماذج التي تريدها في allowlist |
    | `models.mode` | أبقه على `merge` إذا كنت تريد إضافة MiniMax إلى جانب النماذج المدمجة |
  </Accordion>

  <Accordion title="القيم الافتراضية للتفكير">
    على `api: "anthropic-messages"`، يحقن OpenClaw القيمة `thinking: { type: "disabled" }` ما لم يكن التفكير مضبوطًا بالفعل صراحةً في params/config.

    وهذا يمنع نقطة نهاية البث الخاصة بـ MiniMax من إصدار `reasoning_content` في أجزاء delta بأسلوب OpenAI، وهو ما قد يؤدي إلى تسريب reasoning الداخلية إلى الخرج المرئي.

  </Accordion>

  <Accordion title="الوضع السريع">
    يعيد `/fast on` أو `params.fastMode: true` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed` على مسار البث المتوافق مع Anthropic.
  </Accordion>

  <Accordion title="مثال على fallback">
    **الأفضل من أجل:** الاحتفاظ بأقوى نموذج حديث لديك كنموذج أساسي، مع fallback إلى MiniMax M2.7. يستخدم المثال أدناه Opus كنموذج أساسي محدد؛ استبدله بالنموذج الحديث الأساسي الذي تفضله.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="تفاصيل استخدام Coding Plan">
    - واجهة API لاستخدام Coding Plan: ‏`https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` ‏(تتطلب مفتاح coding plan).
    - يقوم OpenClaw بتطبيع استخدام MiniMax coding-plan إلى العرض نفسه `% left` المستخدم لدى الموفّرين الآخرين. وتُعد حقول MiniMax الخام `usage_percent` / `usagePercent` حصة متبقية، وليست حصة مستهلكة، لذلك يعكسها OpenClaw. وتكون الحقول القائمة على العد هي الأسبق عند وجودها.
    - عندما تعيد API القيمة `model_remains`، يفضّل OpenClaw إدخال نموذج الدردشة، ويشتق تسمية النافذة من `start_time` / `end_time` عند الحاجة، ويضمّن اسم النموذج المختار في تسمية الخطة بحيث يصبح التمييز بين نوافذ coding-plan أسهل.
    - تتعامل لقطات الاستخدام مع `minimax` و`minimax-cn` و`minimax-portal` على أنها سطح الحصة نفسه لـ MiniMax، وتفضّل MiniMax OAuth المخزنة قبل الرجوع إلى متغيرات env الخاصة بمفتاح Coding Plan.
  </Accordion>
</AccordionGroup>

## ملاحظات

- تتبع مراجع النماذج مسار المصادقة:
  - إعداد مفتاح API: ‏`minimax/<model>`
  - إعداد OAuth: ‏`minimax-portal/<model>`
- نموذج الدردشة الافتراضي: `MiniMax-M2.7`
- نموذج الدردشة البديل: `MiniMax-M2.7-highspeed`
- يكتب onboarding والإعداد المباشر لمفتاح API تعريفات نماذج نصية فقط لكلا نسختي M2.7
- يستخدم فهم الصور موفّر الوسائط `MiniMax-VL-01` المملوك للـ Plugin
- حدّث قيم التسعير في `models.json` إذا كنت بحاجة إلى تتبع تكلفة دقيق
- استخدم `openclaw models list` لتأكيد معرّف الموفّر الحالي، ثم بدّل باستخدام `openclaw models set minimax/MiniMax-M2.7` أو `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
رابط إحالة إلى MiniMax Coding Plan ‏(خصم 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
راجع [موفّرو النماذج](/ar/concepts/model-providers) للاطلاع على قواعد الموفّرين.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    يعني هذا عادةً أن **موفّر MiniMax غير مهيأ** (لا يوجد إدخال موفّر مطابق ولا يوجد مفتاح env أو auth profile مطابق لـ MiniMax). وقد وُضع إصلاح لهذا الاكتشاف في **2026.1.12**. أصلح ذلك عبر:

    - الترقية إلى **2026.1.12** ‏(أو التشغيل من المصدر `main`)، ثم إعادة تشغيل gateway.
    - تشغيل `openclaw configure` واختيار أحد خيارات auth الخاصة بـ **MiniMax**، أو
    - إضافة كتلة `models.providers.minimax` أو `models.providers.minimax-portal` المطابقة يدويًا، أو
    - تعيين `MINIMAX_API_KEY` أو `MINIMAX_OAUTH_TOKEN` أو auth profile خاصة بـ MiniMax بحيث يمكن حقن الموفّر المطابق.

    تأكد من أن معرّف النموذج **حساس لحالة الأحرف**:

    - مسار مفتاح API: ‏`minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed`
    - مسار OAuth: ‏`minimax-portal/MiniMax-M2.7` أو `minimax-portal/MiniMax-M2.7-highspeed`

    ثم أعد التحقق باستخدام:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أدوات الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    معاملات أدوات الموسيقى المشتركة واختيار الموفّر.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أدوات الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="MiniMax Search" href="/ar/tools/minimax-search" icon="magnifying-glass">
    تهيئة البحث في الويب عبر MiniMax Coding Plan.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء العامة وإصلاحها والأسئلة الشائعة.
  </Card>
</CardGroup>
