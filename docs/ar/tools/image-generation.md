---
read_when:
    - إنشاء الصور عبر العامل
    - ضبط مزودات ونماذج توليد الصور
    - فهم معلمات الأداة `image_generate`
summary: أنشئ الصور وعدّلها باستخدام المزودين المضبوطين (OpenAI، وOpenAI Codex OAuth، وGoogle Gemini، وOpenRouter، وfal، وMiniMax، وComfyUI، وVydra، وxAI)
title: توليد الصور
x-i18n:
    generated_at: "2026-04-25T13:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

تتيح أداة `image_generate` للعامل إنشاء الصور وتعديلها باستخدام المزودين المضبوطين لديك. ويتم تسليم الصور المُنشأة تلقائيًا كمرفقات وسائط في رد العامل.

<Note>
لا تظهر الأداة إلا عند توفر مزود واحد على الأقل لتوليد الصور. إذا لم ترَ `image_generate` ضمن أدوات العامل لديك، فاضبط `agents.defaults.imageGenerationModel`، أو أعد إعداد مفتاح API لمزود، أو سجّل الدخول باستخدام OpenAI Codex OAuth.
</Note>

## البدء السريع

1. اضبط مفتاح API لمزود واحد على الأقل (مثل `OPENAI_API_KEY` أو `GEMINI_API_KEY` أو `OPENROUTER_API_KEY`) أو سجّل الدخول باستخدام OpenAI Codex OAuth.
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

يستخدم Codex OAuth مرجع النموذج نفسه `openai/gpt-image-2`. عند
ضبط ملف تعريف OAuth من `openai-codex`، يوجه OpenClaw طلبات الصور
عبر ملف تعريف OAuth نفسه بدلًا من محاولة استخدام `OPENAI_API_KEY` أولًا.
ويؤدي الضبط الصريح المخصص للصور في `models.providers.openai`، مثل مفتاح API أو
عنوان URL أساسي مخصص/Azure، إلى إعادة تفعيل مسار OpenAI Images API المباشر.
وبالنسبة إلى نقاط النهاية المحلية المتوافقة مع OpenAI على الشبكة المحلية مثل LocalAI، احتفظ بالقيمة المخصصة
`models.providers.openai.baseUrl` وفعل الاشتراك الصريح عبر
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ تظل نقاط
نهاية الصور الخاصة/الداخلية محجوبة افتراضيًا.

3. اطلب من العامل: _"أنشئ صورة لتميمة روبوت ودود."_

يستدعي العامل `image_generate` تلقائيًا. لا حاجة إلى قائمة سماح للأداة — فهي مفعلة افتراضيًا عند توفر مزود.

## المسارات الشائعة

| الهدف                                                 | مرجع النموذج                                          | المصادقة                                 |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| توليد الصور في OpenAI مع فوترة API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| توليد الصور في OpenAI مع مصادقة اشتراك Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                   |
| توليد الصور في OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| توليد الصور في Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` or `GOOGLE_API_KEY` |

تتعامل أداة `image_generate` نفسها مع إنشاء الصور من النص وتعديل
الصور المرجعية. استخدم `image` لمرجع واحد أو `images` لمراجع متعددة.
وتُمرر تلميحات الإخراج التي يدعمها المزود مثل `quality` و`outputFormat` و
`background` الخاصة بـ OpenAI عند توفرها، ويتم الإبلاغ عنها بوصفها
متجاهَلة عندما لا يدعمها المزود.

## المزودون المدعومون

| المزود   | النموذج الافتراضي                           | دعم التعديل                       | المصادقة                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | نعم (حتى 4 صور)               | `OPENAI_API_KEY` أو OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | نعم (حتى 5 صور إدخال)         | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`        | نعم                                | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                  |
| fal        | `fal-ai/flux/dev`                       | نعم                                | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | نعم (مرجع الموضوع)            | `MINIMAX_API_KEY` أو MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | نعم (صورة واحدة، حسب ضبط سير العمل) | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة    |
| Vydra      | `grok-imagine`                          | لا                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | نعم (حتى 5 صور)               | `XAI_API_KEY`                                         |

استخدم `action: "list"` لفحص المزودين والنماذج المتاحة في وقت التشغيل:

```
/tool image_generate action=list
```

## معلمات الأداة

<ParamField path="prompt" type="string" required>
موجّه توليد الصورة. مطلوب لـ `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
استخدم `"list"` لفحص المزودين والنماذج المتاحة في وقت التشغيل.
</ParamField>

<ParamField path="model" type="string">
تجاوز المزود/النموذج، مثل `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
مسار صورة مرجعية واحدة أو عنوان URL لوضع التعديل.
</ParamField>

<ParamField path="images" type="string[]">
صور مرجعية متعددة لوضع التعديل (حتى 5).
</ParamField>

<ParamField path="size" type="string">
تلميح الحجم: `1024x1024` أو `1536x1024` أو `1024x1536` أو `2048x2048` أو `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
نسبة العرض إلى الارتفاع: `1:1` أو `2:3` أو `3:2` أو `3:4` أو `4:3` أو `4:5` أو `5:4` أو `9:16` أو `16:9` أو `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
تلميح الدقة.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
تلميح الجودة عندما يدعمه المزود.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
تلميح تنسيق الإخراج عندما يدعمه المزود.
</ParamField>

<ParamField path="count" type="number">
عدد الصور المطلوب إنشاؤها (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
مهلة اختيارية لطلب المزود بالمللي ثانية.
</ParamField>

<ParamField path="filename" type="string">
تلميح اسم ملف الإخراج.
</ParamField>

<ParamField path="openai" type="object">
تلميحات خاصة بـ OpenAI: ‏`background` و`moderation` و`outputCompression` و`user`.
</ParamField>

لا تدعم جميع المزودات جميع المعلمات. وعندما يدعم مزود الرجوع الاحتياطي خيارًا هندسيًا قريبًا بدلًا من الخيار المطلوب تمامًا، يعيد OpenClaw التعيين إلى أقرب حجم أو نسبة عرض إلى ارتفاع أو دقة مدعومة قبل الإرسال. وتُسقط تلميحات الإخراج غير المدعومة مثل `quality` أو `outputFormat` للمزودات التي لا تعلن عن دعمها، ويُبلّغ عنها في نتيجة الأداة.

تُظهر نتائج الأداة الإعدادات المطبقة. وعندما يعيد OpenClaw تعيين الهندسة أثناء الرجوع الاحتياطي بين المزودين، تعكس القيم المعادة `size` و`aspectRatio` و`resolution` ما أُرسل فعليًا، وتلتقط `details.normalization` الترجمة من المطلوب إلى المطبق.

## الإعداد

### اختيار النموذج

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### ترتيب اختيار المزود

عند إنشاء صورة، يجرّب OpenClaw المزودين بهذا الترتيب:

1. **معلمة `model`** من استدعاء الأداة (إذا حدد العامل واحدة)
2. **`imageGenerationModel.primary`** من الإعدادات
3. **`imageGenerationModel.fallbacks`** بالترتيب
4. **الاكتشاف التلقائي** — يستخدم القيم الافتراضية للمزودات المدعومة بالمصادقة فقط:
   - المزود الافتراضي الحالي أولًا
   - مزودات توليد الصور المسجلة المتبقية بترتيب معرف المزود

إذا فشل أحد المزودين (خطأ مصادقة، أو حد معدل، وما إلى ذلك)، تُجرَّب المرشحات المضبوطة التالية تلقائيًا. وإذا فشل الجميع، يتضمن الخطأ تفاصيل من كل محاولة.

ملاحظات:

- يكون تجاوز `model` لكل استدعاء دقيقًا: يجرّب OpenClaw ذلك المزود/النموذج فقط
  ولا ينتقل إلى القيم `primary`/`fallback` المضبوطة أو المزودات
  المكتشفة تلقائيًا.
- يعتمد الاكتشاف التلقائي على المصادقة. ولا يدخل الافتراضي الخاص بالمزود قائمة المرشحين
  إلا عندما يكون OpenClaw قادرًا فعليًا على مصادقة ذلك المزود.
- يكون الاكتشاف التلقائي مفعّلًا افتراضيًا. اضبط
  `agents.defaults.mediaGenerationAutoProviderFallback: false` إذا أردت أن يستخدم
  توليد الصور فقط الإدخالات الصريحة `model` و`primary` و`fallbacks`.
- استخدم `action: "list"` لفحص المزودين المسجلين حاليًا، ونماذجهم
  الافتراضية، وتلميحات متغيرات بيئة المصادقة.

### تعديل الصور

تدعم OpenAI وOpenRouter وGoogle وfal وMiniMax وComfyUI وxAI تعديل الصور المرجعية. مرّر مسار صورة مرجعية أو عنوان URL:

```
"أنشئ نسخة مائية من هذه الصورة" + image: "/path/to/photo.jpg"
```

تدعم OpenAI وOpenRouter وGoogle وxAI حتى 5 صور مرجعية عبر المعلمة `images`. بينما تدعم fal وMiniMax وComfyUI صورة واحدة.

### نماذج الصور في OpenRouter

يستخدم توليد الصور في OpenRouter مفتاح `OPENROUTER_API_KEY` نفسه ويوجَّه عبر واجهة API الخاصة بصور chat completions في OpenRouter. حدّد نماذج صور OpenRouter باستخدام البادئة `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

يمرر OpenClaw القيم `prompt` و`count` والصور المرجعية وتلميحات `aspectRatio` / `resolution` المتوافقة مع Gemini إلى OpenRouter. تتضمن الاختصارات المضمّنة الحالية لنماذج صور OpenRouter القيم `google/gemini-3.1-flash-image-preview` و`google/gemini-3-pro-image-preview` و`openai/gpt-5.4-image-2`؛ استخدم `action: "list"` لمعرفة ما الذي يعرضه Plugin المضبوط لديك.

### OpenAI `gpt-image-2`

يفترض توليد الصور في OpenAI استخدام `openai/gpt-image-2`. إذا كان
ملف تعريف OAuth من `openai-codex` مضبوطًا، يعيد OpenClaw استخدام ملف تعريف OAuth
نفسه المستخدم في نماذج المحادثة باشتراك Codex ويرسل طلب الصورة
عبر الواجهة الخلفية Codex Responses. وتُحوَّل عناوين URL الأساسية القديمة لـ Codex مثل
`https://chatgpt.com/backend-api` إلى الشكل القياسي
`https://chatgpt.com/backend-api/codex` لطلبات الصور. وهو لا
يرجع بصمت إلى `OPENAI_API_KEY` لهذا الطلب. ولإجبار التوجيه المباشر إلى OpenAI
Images API، اضبط `models.providers.openai` صراحةً باستخدام مفتاح API،
أو عنوان URL أساسي مخصص، أو نقطة نهاية Azure. ولا يزال من الممكن اختيار
النموذج الأقدم `openai/gpt-image-1` صراحةً، لكن طلبات OpenAI الأحدث
لتوليد الصور وتعديلها يجب أن تستخدم `gpt-image-2`.

يدعم `gpt-image-2` كلاً من إنشاء الصور من النص وتعديل
الصور المرجعية من خلال الأداة نفسها `image_generate`. يمرر OpenClaw القيم `prompt`
و`count` و`size` و`quality` و`outputFormat` والصور المرجعية إلى OpenAI.
ولا تستقبل OpenAI القيمتين `aspectRatio` أو `resolution` مباشرة؛ وعند الإمكان
يعيد OpenClaw تعيينهما إلى `size` مدعوم، وإلا تُبلغ الأداة عنهما
بوصفهما تجاوزات متجاهلة.

توجد الخيارات الخاصة بـ OpenAI تحت الكائن `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

تقبل `openai.background` القيم `transparent` أو `opaque` أو `auto`؛ وتتطلب
المخرجات الشفافة أن تكون قيمة `outputFormat` هي `png` أو `webp`. وتُطبق
`openai.outputCompression` على مخرجات JPEG/WebP.

أنشئ صورة أفقية واحدة بدقة 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="ملصق تحريري نظيف لتوليد الصور في OpenClaw" size=3840x2160 count=1
```

أنشئ صورتين مربعتين:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="اتجاهان بصريان لأيقونة تطبيق إنتاجية هادئة" size=1024x1024 count=2
```

عدّل صورة مرجعية محلية واحدة:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="أبقِ الموضوع كما هو، واستبدل الخلفية بإعداد استوديو ساطع" image=/path/to/reference.png size=1024x1536
```

التعديل باستخدام مراجع متعددة:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="ادمج هوية الشخصية من الصورة الأولى مع لوحة الألوان من الصورة الثانية" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

لتوجيه توليد الصور في OpenAI عبر نشر Azure OpenAI بدلًا
من `api.openai.com`، راجع [نقاط نهاية Azure OpenAI](/ar/providers/openai#azure-openai-endpoints)
في وثائق مزود OpenAI.

يتوفر توليد الصور في MiniMax من خلال مساري المصادقة المضمّنين في MiniMax:

- `minimax/image-01` لإعدادات مفتاح API
- `minimax-portal/image-01` لإعدادات OAuth

## إمكانيات المزود

| الإمكانية            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| إنشاء              | نعم (حتى 4)        | نعم (حتى 4)        | نعم (حتى 4)       | نعم (حتى 9)              | نعم (مخرجات يحددها سير العمل)     | نعم (1) | نعم (حتى 4)        |
| تعديل/مرجع        | نعم (حتى 5 صور) | نعم (حتى 5 صور) | نعم (صورة واحدة)       | نعم (صورة واحدة، مرجع موضوع) | نعم (صورة واحدة، حسب ضبط سير العمل) | لا      | نعم (حتى 5 صور) |
| التحكم في الحجم          | نعم (حتى 4K)       | نعم                  | نعم                 | لا                         | لا                                 | لا      | لا                   |
| نسبة العرض إلى الارتفاع          | لا                   | نعم                  | نعم (للإنشاء فقط) | نعم                        | لا                                 | لا      | نعم                  |
| الدقة (1K/2K/4K) | لا                   | نعم                  | نعم                 | لا                         | لا                                 | لا      | نعم (1K/2K)          |

### xAI `grok-imagine-image`

يستخدم مزود xAI المضمّن المسار `/v1/images/generations` للطلبات المعتمدة على الموجّه فقط
والمسار `/v1/images/edits` عند وجود `image` أو `images`.

- النماذج: `xai/grok-imagine-image`، `xai/grok-imagine-image-pro`
- العدد: حتى 4
- المراجع: قيمة `image` واحدة أو حتى خمس قيم `images`
- نسب العرض إلى الارتفاع: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `2:3`، `3:2`
- الدقات: `1K`، `2K`
- المخرجات: تُعاد كمرفقات صور يديرها OpenClaw

يتعمد OpenClaw عدم تعريض `quality` أو `mask` أو `user` الأصلية الخاصة بـ xAI، أو
نسب العرض إلى الارتفاع الإضافية الأصلية فقط، إلى أن تتوفر تلك العناصر ضمن العقد
المشترك العابر للمزودات في `image_generate`.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات العامل المتاحة
- [fal](/ar/providers/fal) — إعداد مزود الصور والفيديو fal
- [ComfyUI](/ar/providers/comfy) — إعداد سير العمل المحلي لـ ComfyUI وComfy Cloud
- [Google (Gemini)](/ar/providers/google) — إعداد مزود الصور Gemini
- [MiniMax](/ar/providers/minimax) — إعداد مزود الصور MiniMax
- [OpenAI](/ar/providers/openai) — إعداد مزود OpenAI Images
- [Vydra](/ar/providers/vydra) — إعداد الصور والفيديو والكلام في Vydra
- [xAI](/ar/providers/xai) — إعداد Grok للصور والفيديو والبحث وتنفيذ الكود وTTS
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — إعداد `imageGenerationModel`
- [النماذج](/ar/concepts/models) — إعداد النموذج والرجوع الاحتياطي
