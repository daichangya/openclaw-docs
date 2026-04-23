---
read_when:
    - إنشاء الصور عبر الوكيل
    - تكوين موفري خدمة إنشاء الصور والنماذج
    - فهم معاملات أداة `image_generate`
summary: إنشاء الصور وتحريرها باستخدام موفري الخدمة المضبوطين (OpenAI وGoogle Gemini وfal وMiniMax وComfyUI وVydra وxAI)
title: إنشاء الصور
x-i18n:
    generated_at: "2026-04-23T14:02:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fbd8eda2cb0867d1426b9349f6778c231051d600ebe451534efbee0e215c871
    source_path: tools/image-generation.md
    workflow: 15
---

# إنشاء الصور

تتيح أداة `image_generate` للوكيل إنشاء الصور وتحريرها باستخدام موفري الخدمة المضبوطين لديك. وتُسلَّم الصور المُنشأة تلقائيًا كمرفقات وسائط في رد الوكيل.

<Note>
لا تظهر الأداة إلا عندما يكون موفر خدمة واحد على الأقل لإنشاء الصور متاحًا. إذا لم ترَ `image_generate` ضمن أدوات وكيلك، فاضبط `agents.defaults.imageGenerationModel` أو أعد إعداد مفتاح API لموفر خدمة.
</Note>

## البدء السريع

1. اضبط مفتاح API لموفر خدمة واحد على الأقل (مثل `OPENAI_API_KEY` أو `GEMINI_API_KEY`).
2. اختياريًا، اضبط النموذج المفضل لديك:

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

3. اطلب من الوكيل: _"أنشئ صورة لتميمة كركند ودودة."_

سيستدعي الوكيل `image_generate` تلقائيًا. لا حاجة إلى قائمة سماح للأدوات — فهي مفعلة افتراضيًا عندما يكون موفر خدمة متاحًا.

## موفرو الخدمة المدعومون

| Provider | النموذج الافتراضي              | دعم التحرير                        | مفتاح API                                              |
| -------- | ------------------------------ | ---------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                  | نعم (حتى 5 صور)                    | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | نعم                              | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                   |
| fal      | `fal-ai/flux/dev`              | نعم                                | `FAL_KEY`                                              |
| MiniMax  | `image-01`                     | نعم (مرجع موضوع)                   | `MINIMAX_API_KEY` أو MiniMax OAuth (`minimax-portal`)  |
| ComfyUI  | `workflow`                     | نعم (صورة واحدة، وفق سير العمل)   | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة       |
| Vydra    | `grok-imagine`                 | لا                                 | `VYDRA_API_KEY`                                        |
| xAI      | `grok-imagine-image`           | نعم (حتى 5 صور)                    | `XAI_API_KEY`                                          |

استخدم `action: "list"` لفحص موفري الخدمة والنماذج المتاحة وقت التشغيل:

```
/tool image_generate action=list
```

## معاملات الأداة

| المعامل      | النوع    | الوصف                                                                                   |
| ------------ | -------- | --------------------------------------------------------------------------------------- |
| `prompt`     | string   | مطالبة إنشاء الصورة (مطلوبة لـ `action: "generate"`)                                  |
| `action`     | string   | `"generate"` (افتراضي) أو `"list"` لفحص موفري الخدمة                                   |
| `model`      | string   | تجاوز Provider/نموذج، مثل `openai/gpt-image-2`                                         |
| `image`      | string   | مسار صورة مرجعية واحدة أو URL لوضع التحرير                                              |
| `images`     | string[] | صور مرجعية متعددة لوضع التحرير (حتى 5)                                                  |
| `size`       | string   | تلميح الحجم: `1024x1024`، `1536x1024`، `1024x1536`، `2048x2048`، `3840x2160`            |
| `aspectRatio`| string   | نسبة الأبعاد: `1:1`، `2:3`، `3:2`، `3:4`، `4:3`، `4:5`، `5:4`، `9:16`، `16:9`، `21:9` |
| `resolution` | string   | تلميح الدقة: `1K` أو `2K` أو `4K`                                                       |
| `count`      | number   | عدد الصور المطلوب إنشاؤها (1–4)                                                         |
| `filename`   | string   | تلميح اسم ملف الإخراج                                                                   |

لا تدعم كل موفري الخدمة جميع المعاملات. وعندما يدعم موفر خدمة احتياطي خيارًا هندسيًا قريبًا بدلًا من الخيار المطلوب بدقة، يعيد OpenClaw تعيينه إلى أقرب حجم أو نسبة أبعاد أو دقة مدعومة قبل الإرسال. أما التجاوزات غير المدعومة فعلًا فما تزال تُبلّغ في نتيجة الأداة.

تُبلّغ نتائج الأداة عن الإعدادات المطبقة. وعندما يعيد OpenClaw تعيين الهندسة أثناء الرجوع الاحتياطي بين موفري الخدمة، فإن القيم المعادة في `size` و`aspectRatio` و`resolution` تعكس ما أُرسل فعليًا، ويلتقط `details.normalization` التحويل من المطلوب إلى المطبق.

## التكوين

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

### ترتيب اختيار Provider

عند إنشاء صورة، يجرب OpenClaw موفري الخدمة بهذا الترتيب:

1. **المعامل `model`** من استدعاء الأداة (إذا حدده الوكيل)
2. **`imageGenerationModel.primary`** من التكوين
3. **`imageGenerationModel.fallbacks`** بالترتيب
4. **الاكتشاف التلقائي** — يستخدم فقط الإعدادات الافتراضية لموفري الخدمة المدعومة بالمصادقة:
   - موفر الخدمة الافتراضي الحالي أولًا
   - بقية موفري خدمة إنشاء الصور المسجلين بترتيب معرّف Provider

إذا فشل موفر خدمة (خطأ مصادقة، حد معدل، إلخ)، تُجرَّب المرشحة التالية تلقائيًا. وإذا فشل الجميع، يتضمن الخطأ تفاصيل من كل محاولة.

ملاحظات:

- الاكتشاف التلقائي واعٍ بالمصادقة. لا يدخل افتراضي موفر الخدمة إلى قائمة المرشحين
  إلا عندما يتمكن OpenClaw فعلًا من مصادقة ذلك Provider.
- يكون الاكتشاف التلقائي مفعّلًا افتراضيًا. اضبط
  `agents.defaults.mediaGenerationAutoProviderFallback: false` إذا كنت تريد أن يستخدم
  إنشاء الصور فقط الإدخالات الصريحة `model` و`primary` و`fallbacks`.
- استخدم `action: "list"` لفحص موفري الخدمة المسجلين حاليًا، والنماذج الافتراضية
  الخاصة بهم، وتلميحات متغيرات البيئة الخاصة بالمصادقة.

### تحرير الصور

تدعم OpenAI وGoogle وfal وMiniMax وComfyUI وxAI تحرير الصور المرجعية. مرّر مسار صورة مرجعية أو URL:

```
"أنشئ نسخة مائية من هذه الصورة" + image: "/path/to/photo.jpg"
```

تدعم OpenAI وGoogle وxAI ما يصل إلى 5 صور مرجعية عبر المعامل `images`. بينما يدعم fal وMiniMax وComfyUI صورة واحدة.

### OpenAI `gpt-image-2`

يستخدم إنشاء الصور في OpenAI النموذج الافتراضي `openai/gpt-image-2`. لا يزال
من الممكن اختيار النموذج الأقدم `openai/gpt-image-1` صراحةً، لكن يجب أن تستخدم
طلبات OpenAI الجديدة لإنشاء الصور وتحريرها `gpt-image-2`.

يدعم `gpt-image-2` كلاً من إنشاء الصور من النص وتحرير الصور المرجعية
عبر أداة `image_generate` نفسها. يمرر OpenClaw القيم `prompt`،
و`count`، و`size`، والصور المرجعية إلى OpenAI. ولا تتلقى OpenAI
القيم `aspectRatio` أو `resolution` مباشرةً؛ وعندما يكون ذلك ممكنًا يعيد OpenClaw
تعيينها إلى `size` مدعومة، وإلا تُبلغ الأداة عنها كتجاوزات تم تجاهلها.

أنشئ صورة أفقية واحدة بدقة 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

أنشئ صورتين مربعتين:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

حرّر صورة مرجعية محلية واحدة:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

حرّر باستخدام مراجع متعددة:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

لتوجيه إنشاء الصور في OpenAI عبر نشر Azure OpenAI بدلًا من
`api.openai.com`، راجع [Azure OpenAI endpoints](/ar/providers/openai#azure-openai-endpoints)
في وثائق OpenAI Provider.

يتوفر إنشاء الصور في MiniMax عبر مساري مصادقة MiniMax المضمنين كليهما:

- `minimax/image-01` لإعدادات مفتاح API
- `minimax-portal/image-01` لإعدادات OAuth

## قدرات Provider

| القدرة                | OpenAI             | Google             | fal                | MiniMax                     | ComfyUI                           | Vydra   | xAI                 |
| --------------------- | ------------------ | ------------------ | ------------------ | --------------------------- | --------------------------------- | ------- | ------------------- |
| إنشاء                 | نعم (حتى 4)        | نعم (حتى 4)        | نعم (حتى 4)        | نعم (حتى 9)                 | نعم (مخرجات يحددها سير العمل)     | نعم (1) | نعم (حتى 4)         |
| تحرير/مرجع            | نعم (حتى 5 صور)    | نعم (حتى 5 صور)    | نعم (صورة واحدة)   | نعم (صورة واحدة، مرجع موضوع) | نعم (صورة واحدة، وفق سير العمل)   | لا      | نعم (حتى 5 صور)     |
| التحكم في الحجم       | نعم (حتى 4K)       | نعم                | نعم                | لا                          | لا                                | لا      | لا                  |
| نسبة الأبعاد          | لا                 | نعم                | نعم (للإنشاء فقط)  | نعم                         | لا                                | لا      | نعم                 |
| الدقة (1K/2K/4K)      | لا                 | نعم                | نعم                | لا                          | لا                                | لا      | نعم (1K/2K)         |

### xAI `grok-imagine-image`

يستخدم xAI Provider المضمّن المسار `/v1/images/generations` للطلبات المعتمدة على المطالبة فقط
والمسار `/v1/images/edits` عندما تكون `image` أو `images` موجودة.

- النماذج: `xai/grok-imagine-image`، `xai/grok-imagine-image-pro`
- العدد: حتى 4
- المراجع: `image` واحدة أو حتى خمس `images`
- نسب الأبعاد: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `2:3`، `3:2`
- الدقات: `1K`، `2K`
- المخرجات: تُعاد كمرفقات صور يديرها OpenClaw

يتعمد OpenClaw عدم إظهار عناصر التحكم الأصلية الخاصة بـ xAI مثل `quality` و`mask` و`user` أو
نسب الأبعاد الإضافية الخاصة بالواجهة الأصلية إلى أن تتوفر تلك العناصر ضمن
عقدة `image_generate` المشتركة عبر موفري الخدمة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [fal](/ar/providers/fal) — إعداد fal لموفر الصور والفيديو
- [ComfyUI](/ar/providers/comfy) — إعداد ComfyUI المحلي وComfy Cloud وسير العمل
- [Google (Gemini)](/ar/providers/google) — إعداد موفر صور Gemini
- [MiniMax](/ar/providers/minimax) — إعداد موفر صور MiniMax
- [OpenAI](/ar/providers/openai) — إعداد موفر OpenAI Images
- [Vydra](/ar/providers/vydra) — إعداد Vydra للصور والفيديو والكلام
- [xAI](/ar/providers/xai) — إعداد Grok للصور والفيديو والبحث وتنفيذ الكود وTTS
- [مرجع التكوين](/ar/gateway/configuration-reference#agent-defaults) — تكوين `imageGenerationModel`
- [Models](/ar/concepts/models) — تكوين النماذج والرجوع الاحتياطي
