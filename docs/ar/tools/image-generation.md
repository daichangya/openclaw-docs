---
read_when:
    - إنشاء الصور عبر الوكيل
    - تهيئة مزوّدي ونماذج توليد الصور
    - فهم معاملات أداة `image_generate`
summary: إنشاء الصور وتحريرها باستخدام المزوّدين المهيئين (OpenAI وGoogle Gemini وfal وMiniMax وComfyUI وVydra وxAI)
title: توليد الصور
x-i18n:
    generated_at: "2026-04-23T07:33:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# توليد الصور

تتيح أداة `image_generate` للوكيل إنشاء الصور وتحريرها باستخدام المزوّدات المهيأة لديك. وتُسلَّم الصور المُولَّدة تلقائيًا كمرفقات وسائط في رد الوكيل.

<Note>
لا تظهر الأداة إلا عندما يكون مزوّد واحد على الأقل لتوليد الصور متاحًا. إذا كنت لا ترى `image_generate` ضمن أدوات وكيلك، فقم بتهيئة `agents.defaults.imageGenerationModel` أو اضبط مفتاح API لمزوّد.
</Note>

## بداية سريعة

1. اضبط مفتاح API لمزوّد واحد على الأقل (مثل `OPENAI_API_KEY` أو `GEMINI_API_KEY`).
2. اضبط اختياريًا النموذج المفضل لديك:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

3. اطلب من الوكيل: _"Generate an image of a friendly lobster mascot."_

يستدعي الوكيل `image_generate` تلقائيًا. ولا حاجة إلى قائمة سماح للأداة — فهي مفعّلة افتراضيًا عندما يكون مزوّد متاحًا.

## المزوّدات المدعومة

| المزوّد | النموذج الافتراضي                    | دعم التحرير                       | مفتاح API                                               |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | نعم (حتى 5 صور)               | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | نعم                                | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | نعم                                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | نعم (مرجع للموضوع)            | `MINIMAX_API_KEY` أو MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                       | نعم (صورة واحدة، وفق workflow) | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة    |
| Vydra    | `grok-imagine`                   | لا                                 | `VYDRA_API_KEY`                                       |
| xAI      | `grok-imagine-image`             | نعم (حتى 5 صور)               | `XAI_API_KEY`                                         |

استخدم `action: "list"` لفحص المزوّدات والنماذج المتاحة وقت التشغيل:

```
/tool image_generate action=list
```

## معاملات الأداة

| المعامل     | النوع     | الوصف                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | prompt لتوليد الصورة (مطلوب لـ `action: "generate"`)                           |
| `action`      | string   | `"generate"` (الافتراضي) أو `"list"` لفحص المزوّدات                               |
| `model`       | string   | تجاوز للمزوّد/النموذج، مثل `openai/gpt-image-2`                                    |
| `image`       | string   | مسار صورة مرجعية واحدة أو عنوان URL لوضع التحرير                                      |
| `images`      | string[] | عدة صور مرجعية لوضع التحرير (حتى 5)                                     |
| `size`        | string   | تلميح الحجم: `1024x1024` أو `1536x1024` أو `1024x1536` أو `2048x2048` أو `3840x2160`            |
| `aspectRatio` | string   | نسبة العرض إلى الارتفاع: `1:1` أو `2:3` أو `3:2` أو `3:4` أو `4:3` أو `4:5` أو `5:4` أو `9:16` أو `16:9` أو `21:9` |
| `resolution`  | string   | تلميح الدقة: `1K` أو `2K` أو `4K`                                                  |
| `count`       | number   | عدد الصور المطلوب توليدها (1–4)                                                    |
| `filename`    | string   | تلميح اسم ملف الإخراج                                                                  |

لا تدعم كل المزوّدات جميع المعاملات. وعندما يدعم مزود fallback خيار هندسة قريبًا بدلًا من الخيار المطلوب تمامًا، يقوم OpenClaw بإعادة التعيين إلى أقرب حجم أو نسبة عرض إلى ارتفاع أو دقة مدعومة قبل الإرسال. أما التجاوزات غير المدعومة فعليًا فسيتم الإبلاغ عنها في نتيجة الأداة.

تُبلّغ نتائج الأداة عن الإعدادات المطبقة. وعندما يعيد OpenClaw تعيين الهندسة أثناء fallback للمزوّد، فإن القيم المعادة في `size` و`aspectRatio` و`resolution` تعكس ما تم إرساله فعليًا، بينما تلتقط `details.normalization` ترجمة المطلوب إلى المطبق.

## التهيئة

### اختيار النموذج

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### ترتيب اختيار المزوّد

عند توليد صورة، يجرب OpenClaw المزوّدات بهذا الترتيب:

1. **معامل `model`** من استدعاء الأداة (إذا حدده الوكيل)
2. **`imageGenerationModel.primary`** من التهيئة
3. **`imageGenerationModel.fallbacks`** بالترتيب
4. **الاكتشاف التلقائي** — يستخدم فقط القيم الافتراضية للمزوّدات المدعومة بالمصادقة:
   - المزوّد الافتراضي الحالي أولًا
   - ثم بقية مزوّدي توليد الصور المسجلين حسب ترتيب معرّف المزوّد

إذا فشل مزوّد ما (خطأ مصادقة، أو حد معدل، وما إلى ذلك)، تتم تجربة المرشح التالي تلقائيًا. وإذا فشل الجميع، يتضمن الخطأ تفاصيل من كل محاولة.

ملاحظات:

- يكون الاكتشاف التلقائي واعيًا بالمصادقة. لا يدخل افتراضي المزوّد إلى قائمة المرشحين
  إلا عندما يتمكن OpenClaw فعليًا من مصادقة ذلك المزوّد.
- يكون الاكتشاف التلقائي مفعّلًا افتراضيًا. اضبط
  `agents.defaults.mediaGenerationAutoProviderFallback: false` إذا كنت تريد أن يستخدم
  توليد الصور فقط الإدخالات الصريحة `model` و`primary` و`fallbacks`.
- استخدم `action: "list"` لفحص المزوّدات المسجلة حاليًا،
  ونماذجها الافتراضية، وتلميحات متغيرات env الخاصة بالمصادقة.

### تحرير الصور

يدعم OpenAI وGoogle وfal وMiniMax وComfyUI وxAI تحرير الصور المرجعية. مرّر مسار صورة مرجعية أو عنوان URL:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

يدعم OpenAI وGoogle وxAI حتى 5 صور مرجعية عبر المعامل `images`. أما fal وMiniMax وComfyUI فتدعم صورة واحدة.

### OpenAI `gpt-image-2`

يفترض توليد الصور في OpenAI افتراضيًا النموذج `openai/gpt-image-2`. ولا يزال
من الممكن اختيار النموذج الأقدم `openai/gpt-image-1` صراحةً، لكن طلبات OpenAI
الجديدة الخاصة بتوليد الصور وتحريرها يجب أن تستخدم `gpt-image-2`.

يدعم `gpt-image-2` كلاً من توليد الصور من النص وتحرير الصور المرجعية
عبر أداة `image_generate` نفسها. يمرر OpenClaw القيم `prompt` و`count` و`size` والصور المرجعية إلى OpenAI. ولا تتلقى OpenAI
القيم `aspectRatio` أو `resolution` مباشرة؛ وعندما يكون ذلك ممكنًا يقوم OpenClaw بتحويلها إلى
`size` مدعوم، وإلا تُبلّغ الأداة عنها على أنها تجاوزات تم تجاهلها.

توليد صورة landscape واحدة بدقة 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

توليد صورتين مربعتين:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

تحرير صورة مرجعية محلية واحدة:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

التحرير باستخدام عدة مراجع:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

يتوفر توليد الصور في MiniMax عبر مساري مصادقة MiniMax المضمّنين معًا:

- `minimax/image-01` لإعدادات API-key
- `minimax-portal/image-01` لإعدادات OAuth

## قدرات المزوّد

| القدرة            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| التوليد              | نعم (حتى 4)        | نعم (حتى 4)        | نعم (حتى 4)       | نعم (حتى 9)              | نعم (مخرجات يحددها workflow)     | نعم (1) | نعم (حتى 4)        |
| التحرير/المرجع        | نعم (حتى 5 صور) | نعم (حتى 5 صور) | نعم (صورة واحدة)       | نعم (صورة واحدة، مرجع للموضوع) | نعم (صورة واحدة، وفق workflow) | لا      | نعم (حتى 5 صور) |
| التحكم في الحجم          | نعم (حتى 4K)       | نعم                  | نعم                 | لا                         | لا                                 | لا      | لا                   |
| نسبة العرض إلى الارتفاع          | لا                   | نعم                  | نعم (للتوليد فقط) | نعم                        | لا                                 | لا      | نعم                  |
| الدقة (1K/2K/4K) | لا                   | نعم                  | نعم                 | لا                         | لا                                 | لا      | نعم (1K/2K)          |

### xAI `grok-imagine-image`

يستخدم مزوّد xAI المضمّن `/v1/images/generations` لطلبات
prompt فقط، ويستخدم `/v1/images/edits` عندما تكون `image` أو `images` موجودة.

- النماذج: `xai/grok-imagine-image`، `xai/grok-imagine-image-pro`
- العدد: حتى 4
- المراجع: `image` واحدة أو حتى خمس `images`
- نسب العرض إلى الارتفاع: `1:1` و`16:9` و`9:16` و`4:3` و`3:4` و`2:3` و`3:2`
- الدقات: `1K`، `2K`
- المخرجات: تُعاد كمرفقات صور مُدارة بواسطة OpenClaw

يتعمد OpenClaw عدم كشف القيم الأصلية الخاصة بـ xAI مثل `quality` أو `mask` أو `user` أو
نسب العرض إلى الارتفاع الإضافية الأصلية فقط إلى أن تصبح هذه العناصر موجودة في
العقد المشترك `image_generate` عبر المزوّدات.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [fal](/ar/providers/fal) — إعداد مزوّد الصور والفيديو fal
- [ComfyUI](/ar/providers/comfy) — إعداد local ComfyUI وComfy Cloud workflow
- [Google (Gemini)](/ar/providers/google) — إعداد مزوّد الصور Gemini
- [MiniMax](/ar/providers/minimax) — إعداد مزوّد الصور MiniMax
- [OpenAI](/ar/providers/openai) — إعداد مزوّد OpenAI Images
- [Vydra](/ar/providers/vydra) — إعداد الصور والفيديو والكلام في Vydra
- [xAI](/ar/providers/xai) — إعداد Grok للصور والفيديو والبحث وتنفيذ الشيفرة وTTS
- [مرجع التهيئة](/ar/gateway/configuration-reference#agent-defaults) — تهيئة `imageGenerationModel`
- [النماذج](/ar/concepts/models) — تهيئة النموذج وfailover
