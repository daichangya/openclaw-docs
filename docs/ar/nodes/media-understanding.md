---
read_when:
    - تصميم فهم الوسائط أو إعادة هيكلته
    - ضبط المعالجة المسبقة للصور/الصوت/الفيديو الواردة
summary: فهم الصور/الصوت/الفيديو الواردة (اختياري) مع الرجوع إلى المزوّد وCLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-04-25T13:50:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# فهم الوسائط — الواردة (2026-01-17)

يمكن لـ OpenClaw **تلخيص الوسائط الواردة** (الصورة/الصوت/الفيديو) قبل تشغيل مسار الرد. وهو يكتشف تلقائيًا عند توفر الأدوات المحلية أو مفاتيح المزوّد، ويمكن تعطيله أو تخصيصه. وإذا كان الفهم معطّلًا، فلا تزال النماذج تتلقى الملفات/عناوين URL الأصلية كالمعتاد.

يتم تسجيل سلوك الوسائط الخاص بكل مزوّد بواسطة Plugins الخاصة بالمزوّد، بينما
يمتلك Core في OpenClaw إعدادات `tools.media` المشتركة، وترتيب الرجوع، والتكامل مع مسار الرد.

## الأهداف

- اختياري: هضم مسبق للوسائط الواردة إلى نص قصير لتوجيه أسرع + تحليل أفضل للأوامر.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائمًا).
- دعم **واجهات API الخاصة بالمزوّدين** و**عمليات الرجوع إلى CLI**.
- السماح بعدة نماذج مع ترتيب رجوع محدد (خطأ/حجم/مهلة).

## السلوك عالي المستوى

1. اجمع المرفقات الواردة (`MediaPaths` و`MediaUrls` و`MediaTypes`).
2. لكل إمكانية مفعّلة (صورة/صوت/فيديو)، اختر المرفقات وفق السياسة (الافتراضي: **الأول**).
3. اختر أول إدخال نموذج مؤهل (الحجم + الإمكانية + المصادقة).
4. إذا فشل نموذج أو كانت الوسائط كبيرة جدًا، **فارجع إلى الإدخال التالي**.
5. عند النجاح:
   - تصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`.
   - يعيّن الصوت `{{Transcript}}`؛ ويستخدم تحليل الأوامر نص التسمية التوضيحية عند وجوده،
     وإلا فيستخدم النص المنسوخ.
   - يتم الحفاظ على التسميات التوضيحية على أنها `User text:` داخل الكتلة.

إذا فشل الفهم أو كان معطّلًا، **يستمر تدفق الرد** مع النص الأصلي + المرفقات.

## نظرة عامة على الإعدادات

يدعم `tools.media` **نماذج مشتركة** بالإضافة إلى تجاوزات لكل إمكانية:

- `tools.media.models`: قائمة نماذج مشتركة (استخدم `capabilities` للتقييد).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - القيم الافتراضية (`prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`)
  - تجاوزات المزوّد (`baseUrl` و`headers` و`providerOptions`)
  - خيارات الصوت لـ Deepgram عبر `tools.media.audio.providerOptions.deepgram`
  - عناصر التحكم في تكرار النص المنسوخ للصوت (`echoTranscript`، الافتراضي `false`؛ و`echoFormat`)
  - قائمة `models` **اختيارية لكل إمكانية** (مفضلة قبل النماذج المشتركة)
  - سياسة `attachments` (`mode` و`maxAttachments` و`prefer`)
  - `scope` (تقييد اختياري حسب القناة/نوع الدردشة/مفتاح الجلسة)
- `tools.media.concurrency`: الحد الأقصى للتشغيلات المتزامنة للإمكانات (الافتراضي **2**).

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

يمكن أن يكون كل إدخال في `models[]` من نوع **مزوّد** أو **CLI**:

```json5
{
  type: "provider", // الافتراضي إذا تم حذفه
  provider: "openai",
  model: "gpt-5.5",
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
- `{{OutputDir}}` (دليل مؤقت تم إنشاؤه لهذا التشغيل)
- `{{OutputBase}}` (المسار الأساسي للملف المؤقت، بدون امتداد)

## القيم الافتراضية والحدود

القيم الافتراضية الموصى بها:

- `maxChars`: **500** للصورة/الفيديو (قصير، وملائم للأوامر)
- `maxChars`: **غير معيّن** للصوت (نص منسوخ كامل ما لم تعيّن حدًا)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

القواعد:

- إذا تجاوزت الوسائط `maxBytes`، يتم تخطي ذلك النموذج وتجربة **النموذج التالي**.
- تُعامل ملفات الصوت الأصغر من **1024 بايت** على أنها فارغة/تالفة ويتم تخطيها قبل النسخ عبر المزوّد/CLI.
- إذا أعاد النموذج أكثر من `maxChars`، يتم اقتطاع الخرج.
- تكون القيمة الافتراضية لـ `prompt` هي صيغة بسيطة مثل “Describe the {media}.” مع إرشادات `maxChars` (للصورة/الفيديو فقط).
- إذا كان نموذج الصورة الأساسي النشط يدعم الرؤية أصلًا، فإن OpenClaw
  يتخطى كتلة الملخص `[Image]` ويمرر الصورة الأصلية إلى
  النموذج بدلًا من ذلك.
- إذا كان النموذج الأساسي لـ Gateway/WebChat نصيًا فقط، فسيتم الحفاظ على مرفقات الصور كمراجع `media://inbound/*` مُفرغة حتى تظل أدوات الصورة/PDF أو نموذج الصور المُعدّ قادرة على فحصها بدلًا من فقدان المرفق.
- تختلف طلبات `openclaw infer image describe --model <provider/model>` الصريحة: فهي تشغّل ذلك المزوّد/النموذج القادر على الصور مباشرة، بما في ذلك
  مراجع Ollama مثل `ollama/qwen2.5vl:7b`.
- إذا كانت `<capability>.enabled: true` لكن لم يتم إعداد أي نماذج، فإن OpenClaw يحاول
  **نموذج الرد النشط** عندما يدعم مزوّده تلك الإمكانية.

### الاكتشاف التلقائي لفهم الوسائط (افتراضي)

إذا لم يتم تعيين `tools.media.<capability>.enabled` إلى **`false`** ولم تكن قد
أعددت نماذج، فإن OpenClaw يكتشف تلقائيًا بهذا الترتيب و**يتوقف عند أول
خيار يعمل**:

1. **نموذج الرد النشط** عندما يدعم مزوّده تلك الإمكانية.
2. مراجع `agents.defaults.imageModel` الأساسية/الراجعة (للصورة فقط).
3. **أدوات CLI المحلية** (للصوت فقط؛ إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج tiny المضمّن)
   - `whisper` (Python CLI؛ يقوم بتنزيل النماذج تلقائيًا)
4. **Gemini CLI** (`gemini`) باستخدام `read_many_files`
5. **مصادقة المزوّد**
   - تتم تجربة إدخالات `models.providers.*` المُعدّة التي تدعم الإمكانية قبل ترتيب الرجوع المضمّن.
   - يقوم مزوّدو الإعدادات الخاصون بالصور فقط مع نموذج قادر على الصور بالتسجيل التلقائي لفهم الوسائط حتى عندما لا يكونون Plugin مضمّنًا لمزوّد.
   - يتوفر فهم الصور في Ollama عند تحديده صراحةً، مثلًا عبر
     `agents.defaults.imageModel` أو
     `openclaw infer image describe --model ollama/<vision-model>`.
   - ترتيب الرجوع المضمّن:
     - الصوت: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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

ملاحظة: يكون اكتشاف الملفات الثنائية بأفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجود على `PATH` (ونحن نوسّع `~`)، أو عيّن نموذج CLI صريحًا مع مسار أمر كامل.

### دعم بيئة الوكيل (لنماذج المزوّد)

عند تمكين فهم الوسائط **الصوتية** و**المرئية** المعتمد على المزوّد، يحترم OpenClaw
متغيرات بيئة الوكيل القياسية للاتصالات الصادرة لطلبات HTTP الخاصة بالمزوّد:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

إذا لم يتم تعيين أي متغيرات بيئة للوكيل، فسيستخدم فهم الوسائط اتصالًا مباشرًا.
إذا كانت قيمة الوكيل غير صحيحة التنسيق، يسجل OpenClaw تحذيرًا ويرجع إلى الجلب
المباشر.

## الإمكانات (اختياري)

إذا قمت بتعيين `capabilities`، فلن يعمل الإدخال إلا لتلك الأنواع من الوسائط. بالنسبة إلى
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

بالنسبة إلى إدخالات CLI، **عيّن `capabilities` صراحةً** لتجنب المطابقات المفاجئة.
إذا حذفت `capabilities`، فسيكون الإدخال مؤهلًا للقائمة التي يظهر فيها.

## مصفوفة دعم المزوّد (تكاملات OpenClaw)

| الإمكانية | تكامل المزوّد                                                                                                         | ملاحظات                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الصورة      | OpenAI، وOpenAI Codex OAuth، وCodex app-server، وOpenRouter، وAnthropic، وGoogle، وMiniMax، وMoonshot، وQwen، وZ.AI، ومزوّدو الإعدادات | تسجل Plugins الخاصة بالمزوّد دعم الصور؛ ويستخدم `openai-codex/*` بنية OAuth الخاصة بالمزوّد؛ ويستخدم `codex/*` دورًا مقيّدًا لخادم تطبيق Codex؛ ويستخدم كل من MiniMax وMiniMax OAuth القيمة `MiniMax-VL-01`؛ كما يتم تسجيل مزوّدي الإعدادات القادرين على الصور تلقائيًا. |
| الصوت      | OpenAI، وGroq، وxAI، وDeepgram، وGoogle، وSenseAudio، وElevenLabs، وMistral                                                         | نسخ عبر المزوّد (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| الفيديو      | Google، وQwen، وMoonshot                                                                                                       | فهم الفيديو عبر المزوّد بواسطة Plugins الخاصة بالمزوّد؛ ويستخدم فهم الفيديو في Qwen نقاط نهاية DashScope القياسية.                                                                                                                        |

ملاحظة MiniMax:

- يأتي فهم الصور في `minimax` و`minimax-portal` من
  مزوّد الوسائط `MiniMax-VL-01` المملوك لـ Plugin.
- لا يزال كتالوج النصوص المضمّن لـ MiniMax يبدأ كنصي فقط؛ بينما تُجسّد
  إدخالات `models.providers.minimax` الصريحة مراجع دردشة M2.7 القادرة على الصور.

## إرشادات اختيار النموذج

- فضّل أقوى نموذج من أحدث جيل متاح لكل إمكانية وسائط عندما تكون الجودة والأمان مهمين.
- بالنسبة إلى الوكلاء المفعّلة لديهم الأدوات الذين يتعاملون مع مدخلات غير موثوقة، تجنب نماذج الوسائط الأقدم/الأضعف.
- احتفظ بعملية رجوع واحدة على الأقل لكل إمكانية لضمان التوفر (نموذج جودة + نموذج أسرع/أرخص).
- تكون عمليات الرجوع إلى CLI (`whisper-cli` و`whisper` و`gemini`) مفيدة عندما لا تكون واجهات API الخاصة بالمزوّد متاحة.
- ملاحظة `parakeet-mlx`: مع `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الخرج `txt` (أو غير معيّن)؛ أما التنسيقات غير `txt` فترجع إلى stdout.

## سياسة المرفقات

يتحكم `attachments` لكل إمكانية في المرفقات التي تتم معالجتها:

- `mode`: `first` (افتراضي) أو `all`
- `maxAttachments`: الحد الأقصى لعدد العناصر المعالجة (الافتراضي **1**)
- `prefer`: `first` أو `last` أو `path` أو `url`

عندما تكون `mode: "all"`، يتم تسمية المخرجات على أنها `[Image 1/2]` و`[Audio 2/2]` وما إلى ذلك.

سلوك استخراج مرفقات الملفات:

- يتم تغليف النص المستخرج من الملف بوصفه **محتوى خارجيًا غير موثوق** قبل
  إلحاقه بمطالبة الوسائط.
- تستخدم الكتلة المُحقنة علامات حدود صريحة مثل
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر بيانات وصفية
  `Source: External`.
- يتعمد مسار استخراج المرفقات هذا حذف شعار
  `SECURITY NOTICE:` الطويل لتجنب تضخيم مطالبة الوسائط؛ لكن
  علامات الحدود والبيانات الوصفية تبقى موجودة.
- إذا لم يكن للملف نص قابل للاستخراج، يحقن OpenClaw القيمة `[No extractable text]`.
- إذا رجع PDF في هذا المسار إلى صور صفحات مُرندرَة، فإن مطالبة الوسائط تحتفظ
  بالعنصر النائب `[PDF content rendered to images; images not forwarded to model]`
  لأن خطوة استخراج المرفقات هذه تمرر كتل نص، وليس صور PDF المُرندرَة.

## أمثلة على الإعدادات

### 1) قائمة نماذج مشتركة + تجاوزات

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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

### 2) الصوت + الفيديو فقط (الصورة معطّلة)

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

### 3) فهم الصور الاختياري

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
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

### 4) إدخال واحد متعدد الوسائط (إمكانات صريحة)

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

## خرج الحالة

عند تشغيل فهم الوسائط، يتضمن `/status` سطر ملخص قصير:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

يعرض هذا النتائج لكل إمكانية على حدة والمزوّد/النموذج المختار عند الاقتضاء.

## ملاحظات

- يكون الفهم **بأفضل جهد**. لا تؤدي الأخطاء إلى حظر الردود.
- لا تزال المرفقات تُمرَّر إلى النماذج حتى عندما يكون الفهم معطّلًا.
- استخدم `scope` لتقييد الأماكن التي يعمل فيها الفهم (مثل الرسائل الخاصة فقط).

## مستندات ذات صلة

- [الإعدادات](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
