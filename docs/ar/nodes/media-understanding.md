---
read_when:
    - تصميم فهم الوسائط أو إعادة هيكلته
    - ضبط المعالجة المسبقة للصور/الصوت/الفيديو الواردة
summary: فهم الصور/الصوت/الفيديو الواردة (اختياري) مع بدائل fallback من provider وCLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-04-23T07:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# فهم الوسائط - الواردة (2026-01-17)

يمكن لـ OpenClaw **تلخيص الوسائط الواردة** (الصور/الصوت/الفيديو) قبل تشغيل خط الرد. يكتشف تلقائيًا متى تكون الأدوات المحلية أو مفاتيح provider متاحة، ويمكن تعطيله أو تخصيصه. وإذا كان الفهم معطّلًا، فستظل النماذج تتلقى الملفات/عناوين URL الأصلية كالمعتاد.

يُسجَّل سلوك الوسائط الخاص بكل vendor بواسطة Plugins الخاصة بالـ vendor، بينما
يمتلك OpenClaw core التكوين المشترك `tools.media`، وترتيب fallback، والتكامل مع خط الرد.

## الأهداف

- اختياري: تلخيص مسبق للوسائط الواردة إلى نص قصير لتوجيه أسرع + تحسين تحليل الأوامر.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائمًا).
- دعم **واجهات provider API** و**بدائل fallback عبر CLI**.
- السماح بعدة نماذج مع ترتيب fallback منظم (خطأ/حجم/مهلة).

## السلوك عالي المستوى

1. جمع المرفقات الواردة (`MediaPaths` و`MediaUrls` و`MediaTypes`).
2. لكل قدرة مفعلة (صورة/صوت/فيديو)، اختيار المرفقات حسب السياسة (الافتراضي: **الأول**).
3. اختيار أول إدخال نموذج مؤهل (الحجم + القدرة + المصادقة).
4. إذا فشل نموذج أو كان حجم الوسائط كبيرًا جدًا، **فانتقل إلى الإدخال التالي**.
5. عند النجاح:
   - تصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`.
   - يضبط الصوت `{{Transcript}}`؛ ويستخدم تحليل الأوامر نص التسمية التوضيحية عند وجوده،
     وإلا فيستخدم النص المفرغ.
   - تُحفظ التسميات التوضيحية داخل الكتلة بصيغة `User text:`.

إذا فشل الفهم أو كان معطلًا، **يتابع تدفق الرد** مع النص الأصلي + المرفقات.

## نظرة عامة على التكوين

يدعم `tools.media` **نماذج مشتركة** بالإضافة إلى تجاوزات خاصة بكل قدرة:

- `tools.media.models`: قائمة النماذج المشتركة (استخدم `capabilities` للضبط).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - القيم الافتراضية (`prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`)
  - تجاوزات provider (`baseUrl` و`headers` و`providerOptions`)
  - خيارات صوت Deepgram عبر `tools.media.audio.providerOptions.deepgram`
  - عناصر التحكم في إرجاع النص المفرغ للصوت (`echoTranscript`، الافتراضي `false`؛ و`echoFormat`)
  - قائمة `models` **اختيارية لكل قدرة** (تُفضّل قبل النماذج المشتركة)
  - سياسة `attachments` (`mode` و`maxAttachments` و`prefer`)
  - `scope` (تقييد اختياري حسب القناة/نوع الدردشة/مفتاح الجلسة)
- `tools.media.concurrency`: الحد الأقصى للتشغيلات المتزامنة للقدرات (الافتراضي **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* قائمة مشتركة */
      ],
      image: {
        /* تجاوزات اختيارية */
      },
      audio: {
        /* تجاوزات اختيارية */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* تجاوزات اختيارية */
      },
    },
  },
}
```

### إدخالات النموذج

يمكن أن يكون كل إدخال `models[]` من نوع **provider** أو **CLI**:

```json5
{
  type: "provider", // الافتراضي إذا حُذف
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // اختياري، يُستخدم للإدخالات متعددة الوسائط
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

يمكن لقوالب CLI أيضًا استخدام:

- `{{MediaDir}}` (الدليل الذي يحتوي على ملف الوسائط)
- `{{OutputDir}}` (دليل مؤقت أُنشئ لهذا التشغيل)
- `{{OutputBase}}` (المسار الأساسي لملف مؤقت، من دون امتداد)

## القيم الافتراضية والحدود

القيم الافتراضية الموصى بها:

- `maxChars`: **500** للصور/الفيديو (قصير وملائم للأوامر)
- `maxChars`: **غير مضبوط** للصوت (النص المفرغ الكامل ما لم تضبط حدًا)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

القواعد:

- إذا تجاوزت الوسائط `maxBytes`، يُتخطى ذلك النموذج وتُجرَّب **النموذج التالي**.
- تُعامل الملفات الصوتية الأصغر من **1024 bytes** على أنها فارغة/تالفة وتُتخطى قبل نسخ provider/CLI.
- إذا أعاد النموذج أكثر من `maxChars`، فسيُقص الناتج.
- تكون القيمة الافتراضية لـ `prompt` عبارة بسيطة من نوع “Describe the {media}.” مع إرشاد `maxChars` (للصورة/الفيديو فقط).
- إذا كان نموذج الصور الأساسي النشط يدعم الرؤية أصلًا، يتخطى OpenClaw
  كتلة الملخص `[Image]` ويمرر الصورة الأصلية إلى
  النموذج بدلًا من ذلك.
- تختلف طلبات `openclaw infer image describe --model <provider/model>` الصريحة: فهي تشغّل provider/model القادر على الصور مباشرة، بما في ذلك
  مراجع Ollama مثل `ollama/qwen2.5vl:7b`.
- إذا كان `<capability>.enabled: true` لكن لم تُضبط أي نماذج، يحاول OpenClaw
  استخدام **نموذج الرد النشط** عندما يدعم provider الخاص به هذه القدرة.

### الاكتشاف التلقائي لفهم الوسائط (الافتراضي)

إذا لم تُضبط `tools.media.<capability>.enabled` على **false** ولم تكن قد
ضبطت نماذج، يكتشف OpenClaw تلقائيًا بهذا الترتيب و**يتوقف عند أول
خيار يعمل**:

1. **نموذج الرد النشط** عندما يدعم provider الخاص به هذه القدرة.
2. المراجع الأساسية/الاحتياطية لـ **`agents.defaults.imageModel`** (للصور فقط).
3. **CLI محلية** (للصوت فقط؛ إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج tiny المضمّن)
   - `whisper` (Python CLI؛ ينزل النماذج تلقائيًا)
4. **Gemini CLI** (`gemini`) باستخدام `read_many_files`
5. **مصادقة provider**
   - تُجرَّب إدخالات `models.providers.*` المُكوّنة التي تدعم القدرة
     قبل ترتيب fallback المضمّن.
   - تُسجّل موفرو التكوين الخاصة بالصور فقط مع نموذج قادر على الصور تلقائيًا من أجل
     فهم الوسائط حتى عندما لا تكون Plugin vendor مضمّنة.
   - يتوفر فهم صور Ollama عند اختياره صراحة، على
     سبيل المثال عبر `agents.defaults.imageModel` أو
     `openclaw infer image describe --model ollama/<vision-model>`.
   - ترتيب fallback المضمّن:
     - الصوت: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - الصورة: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - الفيديو: Google → Qwen → Moonshot

لتعطيل الاكتشاف التلقائي، اضبط:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

ملاحظة: اكتشاف الملفات الثنائية يعمل بأفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجود على `PATH` (نحن نوسّع `~`)، أو اضبط نموذج CLI صريحًا مع المسار الكامل للأمر.

### دعم بيئة proxy (نماذج provider)

عندما يكون فهم الوسائط المعتمد على **audio** و**video** من provider مفعّلًا، يحترم OpenClaw
متغيرات بيئة proxy الصادرة القياسية لاستدعاءات HTTP الخاصة بالـ provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

إذا لم تُضبط أي متغيرات بيئة proxy، يستخدم فهم الوسائط اتصالًا مباشرًا.
وإذا كانت قيمة proxy غير صالحة، يسجل OpenClaw تحذيرًا ويعود إلى
الجلب المباشر.

## القدرات (اختياري)

إذا ضبطت `capabilities`، فلن يعمل الإدخال إلا لتلك الأنواع من الوسائط. وبالنسبة إلى
القوائم المشتركة، يستطيع OpenClaw استنتاج القيم الافتراضية:

- `openai` و`anthropic` و`minimax`: **صورة**
- `minimax-portal`: **صورة**
- `moonshot`: **صورة + فيديو**
- `openrouter`: **صورة**
- `google` (Gemini API): **صورة + صوت + فيديو**
- `qwen`: **صورة + فيديو**
- `mistral`: **صوت**
- `zai`: **صورة**
- `groq`: **صوت**
- `xai`: **صوت**
- `deepgram`: **صوت**
- أي كتالوج `models.providers.<id>.models[]` يحتوي على نموذج قادر على الصور:
  **صورة**

بالنسبة إلى إدخالات CLI، **اضبط `capabilities` صراحة** لتجنب المطابقات المفاجئة.
وإذا حذفت `capabilities`، فسيكون الإدخال مؤهلًا للقائمة التي يظهر فيها.

## مصفوفة دعم provider (تكاملات OpenClaw)

| القدرة | تكامل provider                                                                   | الملاحظات                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| الصورة      | OpenAI وOpenRouter وAnthropic وGoogle وMiniMax وMoonshot وQwen وZ.AI وموفرو التكوين | تسجل Plugins الخاصة بالـ vendor دعم الصور؛ ويستخدم كل من MiniMax وMiniMax OAuth القيمة `MiniMax-VL-01`؛ كما تسجل موفرو التكوين القادرة على الصور تلقائيًا. |
| الصوت      | OpenAI وGroq وDeepgram وGoogle وMistral                                                | نسخ provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| الفيديو      | Google وQwen وMoonshot                                                                 | فهم الفيديو عبر provider بواسطة Plugins الخاصة بالـ vendor؛ ويستخدم فهم الفيديو في Qwen نقاط نهاية DashScope Standard.                         |

ملاحظة MiniMax:

- يأتي فهم الصور في `minimax` و`minimax-portal` من
  موفر وسائط `MiniMax-VL-01` المملوك للـ Plugin.
- ما يزال كتالوج النصوص المضمّن لـ MiniMax يبدأ كنص فقط؛ بينما
  تُجسّد إدخالات `models.providers.minimax` الصريحة مراجع دردشة M2.7 القادرة على الصور.

## إرشادات اختيار النموذج

- فضّل أقوى نموذج من الجيل الأحدث المتاح لكل قدرة وسائط عندما تهم الجودة والسلامة.
- بالنسبة إلى الوكلاء الممكّنين بالأدوات الذين يتعاملون مع مدخلات غير موثوقة، تجنب نماذج الوسائط الأقدم/الأضعف.
- احتفظ ببديل fallback واحد على الأقل لكل قدرة من أجل الإتاحة (نموذج جودة + نموذج أسرع/أرخص).
- تفيد بدائل fallback عبر CLI (`whisper-cli` و`whisper` و`gemini`) عندما لا تتوفر واجهات provider API.
- ملاحظة `parakeet-mlx`: عند استخدام `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الإخراج `txt` (أو غير محدد)؛ أما التنسيقات غير `txt` فتعود إلى stdout.

## سياسة المرفقات

يتحكم `attachments` لكل قدرة في أي المرفقات تتم معالجتها:

- `mode`: `first` (الافتراضي) أو `all`
- `maxAttachments`: يقيّد العدد المُعالج (الافتراضي **1**)
- `prefer`: `first` أو `last` أو `path` أو `url`

عندما يكون `mode: "all"`، توضع تسميات على المخرجات مثل `[Image 1/2]` و`[Audio 2/2]` وهكذا.

سلوك استخراج مرفقات الملفات:

- يُغلّف النص المستخرج من الملف باعتباره **محتوى خارجيًا غير موثوق** قبل
  إلحاقه بطلب الوسائط.
- تستخدم الكتلة المحقونة علامات حدود صريحة مثل
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر
  بيانات وصفية `Source: External`.
- يتعمد مسار استخراج المرفقات هذا حذف الشعار الطويل
  `SECURITY NOTICE:` لتجنب تضخيم طلب الوسائط؛ لكن تبقى
  علامات الحدود والبيانات الوصفية موجودة.
- إذا لم يكن للملف نص قابل للاستخراج، يحقن OpenClaw القيمة `[No extractable text]`.
- إذا عاد PDF في هذا المسار إلى صور صفحات مرسومة، فإن طلب الوسائط يحتفظ
  بالعنصر النائب `[PDF content rendered to images; images not forwarded to model]`
  لأن خطوة استخراج المرفقات هذه تمرر كتل نص، لا صور PDF المرسومة.

## أمثلة على التكوين

### 1) قائمة نماذج مشتركة + تجاوزات

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) الصوت + الفيديو فقط (الصورة معطلة)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) فهم صور اختياري

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) إدخال واحد متعدد الوسائط (قدرات صريحة)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## مخرجات الحالة

عند تشغيل فهم الوسائط، يتضمن `/status` سطر ملخص قصير:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

يعرض هذا النتائج لكل قدرة على حدة وprovider/model المختار عند الاقتضاء.

## ملاحظات

- الفهم يعمل **بأفضل جهد**. ولا تمنع الأخطاء الردود.
- لا تزال المرفقات تمرر إلى النماذج حتى عندما يكون الفهم معطّلًا.
- استخدم `scope` لتقييد الأماكن التي يعمل فيها الفهم (مثل الرسائل الخاصة فقط).

## وثائق ذات صلة

- [التكوين](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
