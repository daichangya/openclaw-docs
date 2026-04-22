---
read_when:
    - إنشاء الصور عبر الوكيل
    - ضبط مزوّدي ونماذج توليد الصور
    - فهم معاملات أداة `image_generate`
summary: أنشئ الصور وحرّرها باستخدام المزوّدين المضبوطين (OpenAI وGoogle Gemini وfal وMiniMax وComfyUI وVydra)
title: توليد الصور
x-i18n:
    generated_at: "2026-04-22T04:29:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e365cd23f4f8d8c9ce88d57e65f06ac5ae5285b8b7f9ea37f0b08ab5f6ff7235
    source_path: tools/image-generation.md
    workflow: 15
---

# توليد الصور

تتيح أداة `image_generate` للوكيل إنشاء الصور وتحريرها باستخدام المزوّدين المضبوطين لديك. ويتم تسليم الصور المُنشأة تلقائيًا كمرفقات وسائط في رد الوكيل.

<Note>
لا تظهر الأداة إلا عندما يكون مزوّد واحد على الأقل لتوليد الصور متاحًا. إذا لم ترَ `image_generate` ضمن أدوات الوكيل لديك، فقم بضبط `agents.defaults.imageGenerationModel` أو أعد إعداد مفتاح API لأحد المزوّدين.
</Note>

## بداية سريعة

1. اضبط مفتاح API لمزوّد واحد على الأقل (مثلًا `OPENAI_API_KEY` أو `GEMINI_API_KEY`).
2. اختياريًا، اضبط النموذج المفضّل لديك:

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

3. اطلب من الوكيل: _"أنشئ صورة لتميمة لوبستر ودودة."_

سيستدعي الوكيل `image_generate` تلقائيًا. لا حاجة إلى قائمة سماح للأدوات — فهي مفعّلة افتراضيًا عندما يكون أحد المزوّدين متاحًا.

## المزوّدون المدعومون

| المزوّد | النموذج الافتراضي                    | دعم التحرير                       | مفتاح API                                               |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | نعم (حتى 5 صور)               | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | نعم                                | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | نعم                                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | نعم (مرجع الموضوع)            | `MINIMAX_API_KEY` أو MiniMax OAuth ‏(`minimax-portal`) |
| ComfyUI  | `workflow`                       | نعم (صورة واحدة، وفق إعداد workflow) | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة    |
| Vydra    | `grok-imagine`                   | لا                                 | `VYDRA_API_KEY`                                       |

استخدم `action: "list"` لفحص المزوّدين والنماذج المتاحة وقت التشغيل:

```
/tool image_generate action=list
```

## معاملات الأداة

| المعامل     | النوع     | الوصف                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | prompt لتوليد الصورة (مطلوب لـ `action: "generate"`)                           |
| `action`      | string   | `"generate"` (الافتراضي) أو `"list"` لفحص المزوّدين                               |
| `model`       | string   | تجاوز للمزوّد/النموذج، مثل `openai/gpt-image-2`                                    |
| `image`       | string   | مسار أو URL لصورة مرجعية واحدة لوضع التحرير                                      |
| `images`      | string[] | صور مرجعية متعددة لوضع التحرير (حتى 5)                                     |
| `size`        | string   | تلميح الحجم: `1024x1024` أو `1536x1024` أو `1024x1536` أو `2048x2048` أو `3840x2160`            |
| `aspectRatio` | string   | نسبة الأبعاد: `1:1` أو `2:3` أو `3:2` أو `3:4` أو `4:3` أو `4:5` أو `5:4` أو `9:16` أو `16:9` أو `21:9` |
| `resolution`  | string   | تلميح الدقة: `1K` أو `2K` أو `4K`                                                  |
| `count`       | number   | عدد الصور المطلوب إنشاؤها (1–4)                                                    |
| `filename`    | string   | تلميح اسم ملف الإخراج                                                                  |

لا يدعم كل المزوّدين كل المعاملات. وعندما يدعم مزوّد fallback خيار هندسة قريبًا بدلًا من المطلوب تمامًا، يعيد OpenClaw ربطه إلى أقرب حجم أو نسبة أبعاد أو دقة مدعومة قبل الإرسال. أما التجاوزات غير المدعومة فعلًا فيتم الإبلاغ عنها في نتيجة الأداة.

تبلّغ نتائج الأداة عن الإعدادات المطبقة. وعندما يعيد OpenClaw ربط الهندسة أثناء fallback للمزوّد، تعكس القيم المعادة `size` و`aspectRatio` و`resolution` ما تم إرساله فعليًا، بينما يلتقط `details.normalization` ترجمة المطلوب إلى المطبق.

## الإعدادات

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

عند إنشاء صورة، يحاول OpenClaw المزوّدين بهذا الترتيب:

1. **معامل `model`** من استدعاء الأداة (إذا حدده الوكيل)
2. **`imageGenerationModel.primary`** من config
3. **`imageGenerationModel.fallbacks`** بالترتيب
4. **الاكتشاف التلقائي** — يستخدم فقط الإعدادات الافتراضية للمزوّدين المدعومة بالمصادقة:
   - المزوّد الافتراضي الحالي أولًا
   - بقية مزوّدي توليد الصور المسجلين بترتيب معرّفات المزوّدين

إذا فشل مزوّد ما (خطأ مصادقة، حد معدل، إلخ)، تتم محاولة المرشح التالي تلقائيًا. وإذا فشل الجميع، فسيشمل الخطأ تفاصيل من كل محاولة.

ملاحظات:

- الاكتشاف التلقائي واعٍ بالمصادقة. ولا يدخل افتراضي المزوّد إلى قائمة المرشحين
  إلا عندما يستطيع OpenClaw فعلًا مصادقة ذلك المزوّد.
- يكون الاكتشاف التلقائي مفعّلًا افتراضيًا. اضبط
  `agents.defaults.mediaGenerationAutoProviderFallback: false` إذا كنت تريد
  لتوليد الصور أن يستخدم فقط الإدخالات الصريحة `model` و`primary` و`fallbacks`.
- استخدم `action: "list"` لفحص المزوّدين المسجلين حاليًا، ونماذجهم
  الافتراضية، وتلميحات متغيرات env الخاصة بالمصادقة.

### تحرير الصور

يدعم OpenAI وGoogle وfal وMiniMax وComfyUI تحرير الصور المرجعية. مرّر مسار صورة مرجعية أو URL:

```
"أنشئ نسخة مائية من هذه الصورة" + image: "/path/to/photo.jpg"
```

يدعم OpenAI وGoogle حتى 5 صور مرجعية عبر المعامل `images`. بينما يدعم fal وMiniMax وComfyUI صورة واحدة.

### OpenAI `gpt-image-2`

يستخدم توليد الصور في OpenAI افتراضيًا `openai/gpt-image-2`. ولا يزال
من الممكن اختيار النموذج الأقدم `openai/gpt-image-1` صراحةً، لكن يجب أن تستخدم
طلبات توليد الصور وتحريرها الجديدة في OpenAI النموذج `gpt-image-2`.

يدعم `gpt-image-2` كلًا من توليد الصور من النص وتحرير الصور المرجعية
عبر أداة `image_generate` نفسها. ويمرر OpenClaw القيم `prompt`،
و`count`، و`size`، والصور المرجعية إلى OpenAI. ولا تتلقى OpenAI القيم
`aspectRatio` أو `resolution` مباشرة؛ وعندما يكون ذلك ممكنًا يربط OpenClaw هذه القيم إلى
`size` مدعوم، وإلا تبلغ الأداة عنها كتجاوزات تم تجاهلها.

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

يتوفر توليد الصور في MiniMax عبر مساري المصادقة المضمّنين في MiniMax:

- `minimax/image-01` لإعدادات مفتاح API
- `minimax-portal/image-01` لإعدادات OAuth

## قدرات المزوّد

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| إنشاء              | نعم (حتى 4)        | نعم (حتى 4)        | نعم (حتى 4)       | نعم (حتى 9)              | نعم (مخرجات يحددها workflow)     | نعم (1) |
| التحرير/المرجع        | نعم (حتى 5 صور) | نعم (حتى 5 صور) | نعم (صورة واحدة)       | نعم (صورة واحدة، مرجع الموضوع) | نعم (صورة واحدة، وفق إعداد workflow) | لا      |
| التحكم في الحجم          | نعم (حتى 4K)       | نعم                  | نعم                 | لا                         | لا                                 | لا      |
| نسبة الأبعاد          | لا                   | نعم                  | نعم (للإنشاء فقط) | نعم                        | لا                                 | لا      |
| الدقة (1K/2K/4K) | لا                   | نعم                  | نعم                 | لا                         | لا                                 | لا      |

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — كل أدوات الوكيل المتاحة
- [fal](/ar/providers/fal) — إعداد مزوّد الصور والفيديو fal
- [ComfyUI](/ar/providers/comfy) — إعداد ComfyUI المحلي وComfy Cloud workflow
- [Google (Gemini)](/ar/providers/google) — إعداد مزوّد الصور Gemini
- [MiniMax](/ar/providers/minimax) — إعداد مزوّد الصور MiniMax
- [OpenAI](/ar/providers/openai) — إعداد مزوّد OpenAI Images
- [Vydra](/ar/providers/vydra) — إعداد الصور والفيديو والكلام في Vydra
- [مرجع الإعدادات](/ar/gateway/configuration-reference#agent-defaults) — إعداد `imageGenerationModel`
- [النماذج](/ar/concepts/models) — إعداد النموذج وfailover
