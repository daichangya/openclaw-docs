---
read_when:
    - تصميم أو إعادة هيكلة فهم الوسائط
    - ضبط المعالجة المسبقة للصور/الصوت/الفيديو الواردة
summary: فهم الصور/الصوت/الفيديو الواردة (اختياري) مع بدائل احتياطية من provider وCLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-04-22T04:24:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d80c9bcd965b521c3c782a76b9dd31eb6e6c635d8a1cc6895b6ccfaf5f9492e
    source_path: nodes/media-understanding.md
    workflow: 15
---

# فهم الوسائط - الواردة (2026-01-17)

يمكن لـ OpenClaw **تلخيص الوسائط الواردة** (الصور/الصوت/الفيديو) قبل تشغيل مسار الرد. ويكتشف تلقائيًا ما إذا كانت الأدوات المحلية أو مفاتيح provider متاحة، ويمكن تعطيله أو تخصيصه. وإذا كان الفهم معطلًا، فستتلقى النماذج الملفات/عناوين URL الأصلية كالمعتاد.

يتم تسجيل سلوك الوسائط الخاص بكل vendor بواسطة Plugins الخاصة بالـ vendor، بينما
يتولى OpenClaw core إعداد `tools.media` المشترك، وترتيب البدائل الاحتياطية، ودمج
مسار الرد.

## الأهداف

- اختياري: هضم مسبق للوسائط الواردة إلى نص قصير لتسريع التوجيه + تحسين تحليل الأوامر.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائمًا).
- دعم **واجهات provider API** و**بدائل CLI الاحتياطية**.
- السماح بعدة نماذج مع بدائل احتياطية مرتبة (خطأ/حجم/مهلة).

## السلوك عالي المستوى

1. جمع المرفقات الواردة (`MediaPaths` و`MediaUrls` و`MediaTypes`).
2. لكل إمكانية مفعلة (صورة/صوت/فيديو)، يتم اختيار المرفقات وفق السياسة (الافتراضي: **الأول**).
3. اختيار أول إدخال نموذج مؤهل (الحجم + الإمكانية + المصادقة).
4. إذا فشل نموذج أو كانت الوسائط كبيرة جدًا، **يتم الرجوع إلى الإدخال التالي**.
5. عند النجاح:
   - يصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`.
   - يضبط الصوت `{{Transcript}}`؛ ويستخدم تحليل الأوامر نص caption عند وجوده،
     وإلا فيستخدم transcript.
   - يتم الحفاظ على captions على شكل `User text:` داخل الكتلة.

إذا فشل الفهم أو كان معطلًا، **فإن تدفق الرد يستمر** باستخدام النص الأصلي + المرفقات.

## نظرة عامة على الإعداد

يدعم `tools.media` **نماذج مشتركة** بالإضافة إلى تجاوزات لكل إمكانية:

- `tools.media.models`: قائمة نماذج مشتركة (استخدم `capabilities` للتحكم).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - القيم الافتراضية (`prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`)
  - تجاوزات provider (`baseUrl` و`headers` و`providerOptions`)
  - خيارات Deepgram الصوتية عبر `tools.media.audio.providerOptions.deepgram`
  - عناصر التحكم في echo الخاصة بالنص الصوتي (`echoTranscript`، الافتراضي `false`؛ و`echoFormat`)
  - قائمة `models` **اختيارية لكل إمكانية** (تُفضَّل قبل النماذج المشتركة)
  - سياسة `attachments` ‏(`mode` و`maxAttachments` و`prefer`)
  - `scope` (تحكم اختياري حسب القناة/نوع الدردشة/مفتاح الجلسة)
- `tools.media.concurrency`: الحد الأقصى لعمليات الإمكانيات المتزامنة (الافتراضي **2**).

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

### إدخالات النماذج

يمكن أن يكون كل إدخال في `models[]` من نوع **provider** أو **CLI**:

```json5
{
  type: "provider", // الافتراضي إذا تم حذفه
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
- `{{OutputDir}}` (دليل مؤقت scratch تم إنشاؤه لهذا التشغيل)
- `{{OutputBase}}` (مسار ملف scratch الأساسي، دون امتداد)

## القيم الافتراضية والحدود

القيم الافتراضية الموصى بها:

- `maxChars`: **500** للصورة/الفيديو (قصير وصديق للأوامر)
- `maxChars`: **غير مضبوط** للصوت (النص الكامل ما لم تضع حدًا)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

القواعد:

- إذا تجاوزت الوسائط `maxBytes`، يتم تخطي ذلك النموذج وتجربة **النموذج التالي**.
- تُعتبر ملفات الصوت الأصغر من **1024 بايت** فارغة/تالفة ويتم تخطيها قبل نسخ provider/CLI.
- إذا أعاد النموذج أكثر من `maxChars`، يتم تقليم الناتج.
- تكون قيمة `prompt` الافتراضية عبارة بسيطة مثل “Describe the {media}.” بالإضافة إلى توجيه `maxChars` (للصورة/الفيديو فقط).
- إذا كان نموذج الصورة الأساسي النشط يدعم الرؤية أصلًا، فإن OpenClaw
  يتجاوز كتلة الملخص `[Image]` ويمرر الصورة الأصلية إلى
  النموذج بدلًا من ذلك.
- تختلف الطلبات الصريحة `openclaw infer image describe --model <provider/model>`:
  فهي تشغّل ذلك الـ provider/model القادر على الصور مباشرةً، بما في ذلك
  مراجع Ollama مثل `ollama/qwen2.5vl:7b`.
- إذا كانت قيمة `<capability>.enabled: true` لكن لم يتم إعداد نماذج، فسيحاول OpenClaw
  **نموذج الرد النشط** عندما يدعم provider الخاص به الإمكانية.

### الاكتشاف التلقائي لفهم الوسائط (الافتراضي)

إذا لم يتم ضبط `tools.media.<capability>.enabled` على **`false`** ولم تكن قد
أعددت نماذج، فسيكتشف OpenClaw تلقائيًا بالترتيب التالي و**يتوقف عند أول
خيار يعمل**:

1. **نموذج الرد النشط** عندما يدعم provider الخاص به الإمكانية.
2. مراجع `agents.defaults.imageModel` الأساسية/الاحتياطية (للصورة فقط).
3. **CLI محلية** (للصوت فقط؛ إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` ‏(`whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج tiny المجمّع)
   - `whisper` ‏(Python CLI؛ ينزّل النماذج تلقائيًا)
4. **Gemini CLI** ‏(`gemini`) باستخدام `read_many_files`
5. **مصادقة provider**
   - تتم تجربة الإدخالات المعدّة ضمن `models.providers.*` التي تدعم الإمكانية
     قبل ترتيب البدائل الاحتياطية المجمّعة.
   - يقوم موفرو الإعدادات الخاصة بالصور فقط مع نموذج قادر على الصور بالتسجيل تلقائيًا
     لفهم الوسائط حتى عندما لا يكونون Plugin vendor مجمّعة.
   - يكون فهم صور Ollama متاحًا عند اختياره صراحةً، مثلًا عبر
     `agents.defaults.imageModel` أو
     `openclaw infer image describe --model ollama/<vision-model>`.
   - ترتيب البدائل الاحتياطية المجمّعة:
     - الصوت: OpenAI ← Groq ← Deepgram ← Google ← Mistral
     - الصورة: OpenAI ← Anthropic ← Google ← MiniMax ← MiniMax Portal ← Z.AI
     - الفيديو: Google ← Qwen ← Moonshot

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

ملاحظة: اكتشاف الملفات التنفيذية هو best-effort عبر macOS/Linux/Windows؛ تأكد من أن CLI موجودة على `PATH` (نحن نوسّع `~`) أو اضبط نموذج CLI صريحًا مع مسار أمر كامل.

### دعم بيئة الوكيل Proxy (نماذج provider)

عندما يكون فهم الوسائط **الصوتية** و**الفيديو** المعتمد على provider مفعّلًا، فإن OpenClaw
يحترم متغيرات بيئة الوكيل الصادر القياسية لاستدعاءات HTTP الخاصة بالـ provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

إذا لم يتم ضبط أي متغيرات proxy env، يستخدم فهم الوسائط اتصالًا مباشرًا.
إذا كانت قيمة الوكيل غير صحيحة الصياغة، يسجل OpenClaw تحذيرًا ويعود إلى الجلب
المباشر.

## الإمكانيات (اختياري)

إذا قمت بضبط `capabilities`، فلن يعمل الإدخال إلا لأنواع الوسائط هذه. وبالنسبة إلى
القوائم المشتركة، يمكن لـ OpenClaw استنتاج القيم الافتراضية:

- `openai` و`anthropic` و`minimax`: **صورة**
- `minimax-portal`: **صورة**
- `moonshot`: **صورة + فيديو**
- `openrouter`: **صورة**
- `google` ‏(Gemini API): **صورة + صوت + فيديو**
- `qwen`: **صورة + فيديو**
- `mistral`: **صوت**
- `zai`: **صورة**
- `groq`: **صوت**
- `deepgram`: **صوت**
- أي فهرس `models.providers.<id>.models[]` مع نموذج قادر على الصور:
  **صورة**

بالنسبة إلى إدخالات CLI، **اضبط `capabilities` صراحةً** لتجنب المطابقات غير المتوقعة.
إذا حذفت `capabilities`، يكون الإدخال مؤهلًا للقائمة التي يظهر فيها.

## مصفوفة دعم provider (تكاملات OpenClaw)

| الإمكانية | تكامل provider                                                                       | ملاحظات                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| الصورة     | OpenAI وOpenRouter وAnthropic وGoogle وMiniMax وMoonshot وQwen وZ.AI وموفرو الإعدادات | تسجل Plugins الخاصة بالـ vendor دعم الصور؛ ويستخدم كل من MiniMax وMiniMax OAuth القيمة `MiniMax-VL-01`؛ كما تسجل موفرو الإعدادات القادرون على الصور أنفسهم تلقائيًا. |
| الصوت      | OpenAI وGroq وDeepgram وGoogle وMistral                                              | نسخ provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                           |
| الفيديو    | Google وQwen وMoonshot                                                               | فهم الفيديو المعتمد على provider عبر Plugins vendor؛ ويستخدم فهم فيديو Qwen نقاط نهاية Standard DashScope.                              |

ملاحظة MiniMax:

- يأتي فهم الصور في `minimax` و`minimax-portal` من
  provider الوسائط `MiniMax-VL-01` المملوك للـ Plugin.
- لا يزال فهرس نص MiniMax المجمّع يبدأ نصيًا فقط؛
  وتؤدي إدخالات `models.providers.minimax` الصريحة إلى إظهار مراجع محادثة M2.7 القادرة على الصور.

## إرشادات اختيار النموذج

- فضّل أقوى نموذج متاح من الجيل الأحدث لكل إمكانية وسائط عندما تكون الجودة والأمان مهمين.
- بالنسبة إلى الوكلاء المفعّلين بالأدوات الذين يتعاملون مع مدخلات غير موثوقة، تجنب نماذج الوسائط الأقدم/الأضعف.
- احتفظ ببديل احتياطي واحد على الأقل لكل إمكانية لضمان التوفر (نموذج جودة + نموذج أسرع/أرخص).
- تكون بدائل CLI الاحتياطية (`whisper-cli` و`whisper` و`gemini`) مفيدة عندما لا تكون واجهات provider API متاحة.
- ملاحظة `parakeet-mlx`: مع `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الإخراج `txt` (أو غير محدد)؛ وتعود التنسيقات غير `txt` إلى stdout.

## سياسة المرفقات

يتحكم `attachments` لكل إمكانية في المرفقات التي تتم معالجتها:

- `mode`: ‏`first` (الافتراضي) أو `all`
- `maxAttachments`: الحد الأقصى للعدد المعالج (الافتراضي **1**)
- `prefer`: ‏`first` أو `last` أو `path` أو `url`

عند `mode: "all"`، تُوسم النواتج على الشكل `[Image 1/2]` و`[Audio 2/2]` وما إلى ذلك.

سلوك استخراج مرفقات الملفات:

- يتم تغليف النص المستخرج من الملف على أنه **محتوى خارجي غير موثوق** قبل
  إلحاقه بـ prompt الوسائط.
- تستخدم الكتلة المُدرجة علامات حدود صريحة مثل
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن
  سطر بيانات وصفية `Source: External`.
- يتعمد مسار استخراج المرفقات هذا حذف الشعار الطويل
  `SECURITY NOTICE:` لتجنب تضخيم prompt الوسائط؛ ومع ذلك
  تبقى علامات الحدود والبيانات الوصفية موجودة.
- إذا لم يكن للملف نص قابل للاستخراج، يدرج OpenClaw القيمة `[No extractable text]`.
- إذا عاد PDF في هذا المسار إلى صور صفحات مصيّرة، فإن prompt الوسائط يحتفظ
  بالعنصر النائب `[PDF content rendered to images; images not forwarded to model]`
  لأن خطوة استخراج المرفقات هذه تمرر كتلًا نصية، وليس صور PDF المصرّفة.

## أمثلة على الإعداد

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

### 2) الصوت + الفيديو فقط (إيقاف الصورة)

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

### 3) فهم اختياري للصور

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

### 4) إدخال واحد متعدد الوسائط (إمكانيات صريحة)

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

يعرض هذا النتائج لكل إمكانية على حدة وprovider/model المختار عند الاقتضاء.

## ملاحظات

- الفهم يتم على أساس **best-effort**. لا تمنع الأخطاء الردود.
- لا تزال المرفقات تُمرَّر إلى النماذج حتى عند تعطيل الفهم.
- استخدم `scope` لتقييد الأماكن التي يعمل فيها الفهم (مثلًا في الرسائل المباشرة فقط).

## مستندات ذات صلة

- [الإعدادات](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
