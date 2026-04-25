---
read_when:
    - إضافة أو تعديل أوامر `openclaw infer`
    - تصميم أتمتة قدرات مستقرة بدون واجهة تفاعلية
summary: CLI بنهج الاستدلال أولًا لسير العمل المعتمدة على المزوّد للنماذج، والصور، والصوت، وTTS، والفيديو، والويب، والتضمين
title: CLI للاستدلال
x-i18n:
    generated_at: "2026-04-25T13:44:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` هو الواجهة القياسية بدون تفاعل لسير عمل الاستدلال المعتمدة على المزوّد.

وهو يتعمّد عرض عائلات القدرات، وليس أسماء RPC الخام الخاصة بـ Gateway ولا معرّفات أدوات الوكيل الخام.

## حوّل infer إلى Skill

انسخ هذا والصقه إلى وكيل:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

يجب أن تقوم Skill جيدة مبنية على infer بما يلي:

- ربط نوايا المستخدم الشائعة بالأمر الفرعي الصحيح في infer
- تضمين بعض أمثلة infer القياسية لسير العمل التي تغطيها
- تفضيل `openclaw infer ...` في الأمثلة والاقتراحات
- تجنب إعادة توثيق واجهة infer بالكامل داخل نص Skill

التغطية المعتادة لـ Skills المركزة على infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## لماذا تستخدم infer

يوفر `openclaw infer` واجهة CLI واحدة ومتسقة لمهام الاستدلال المعتمدة على المزوّد داخل OpenClaw.

الفوائد:

- استخدم المزوّدين والنماذج المضبوطة بالفعل في OpenClaw بدلًا من توصيل أغلفة مخصصة منفصلة لكل خلفية.
- احتفظ بسير عمل النموذج، والصورة، ونسخ الصوت، وTTS، والفيديو، والويب، والتضمين تحت شجرة أوامر واحدة.
- استخدم شكل مخرجات `--json` ثابتًا للسكربتات، والأتمتة، وسير العمل المدفوعة بالوكيل.
- فضّل واجهة OpenClaw أصلية عندما تكون المهمة في جوهرها هي "تشغيل استدلال".
- استخدم المسار المحلي العادي من دون الحاجة إلى Gateway لمعظم أوامر infer.

لفحوصات المزوّد من طرف إلى طرف، فضّل `openclaw infer ...` بعد أن تصبح
اختبارات المزوّد منخفضة المستوى باللون الأخضر. فهو يختبر CLI المُصدَر،
وتحميل الإعدادات، وحل الوكيل الافتراضي، وتفعيل Plugin المضمّن، وإصلاح
تبعيات وقت التشغيل، ووقت تشغيل القدرات المشتركة قبل تنفيذ طلب المزوّد.

## شجرة الأوامر

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## المهام الشائعة

يربط هذا الجدول مهام الاستدلال الشائعة بأمر infer المقابل.

| المهمة                  | الأمر                                                                  | ملاحظات                                               |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| تشغيل مطالبة نصية/نموذج | `openclaw infer model run --prompt "..." --json`                       | يستخدم المسار المحلي العادي افتراضيًا                |
| إنشاء صورة              | `openclaw infer image generate --prompt "..." --json`                  | استخدم `image edit` عند البدء من ملف موجود           |
| وصف ملف صورة            | `openclaw infer image describe --file ./image.png --json`              | يجب أن يكون `--model` من نوع `<provider/model>` يدعم الصور |
| نسخ صوتي                | `openclaw infer audio transcribe --file ./memo.m4a --json`             | يجب أن يكون `--model` بصيغة `<provider/model>`        |
| تركيب كلام              | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` موجّه إلى Gateway                        |
| إنشاء فيديو             | `openclaw infer video generate --prompt "..." --json`                  | يدعم تلميحات المزوّد مثل `--resolution`               |
| وصف ملف فيديو           | `openclaw infer video describe --file ./clip.mp4 --json`               | يجب أن يكون `--model` بصيغة `<provider/model>`        |
| البحث على الويب         | `openclaw infer web search --query "..." --json`                       |                                                       |
| جلب صفحة ويب            | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| إنشاء تضمينات           | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## السلوك

- `openclaw infer ...` هي واجهة CLI الأساسية لهذه المسارات.
- استخدم `--json` عندما سيتم استهلاك المخرجات بواسطة أمر أو سكربت آخر.
- استخدم `--provider` أو `--model provider/model` عندما تكون هناك حاجة إلى خلفية محددة.
- بالنسبة إلى `image describe` و`audio transcribe` و`video describe`، يجب أن يستخدم `--model` الصيغة `<provider/model>`.
- بالنسبة إلى `image describe`، يؤدي `--model` الصريح إلى تشغيل ذلك المزوّد/النموذج مباشرة. يجب أن يكون النموذج قادرًا على معالجة الصور في فهرس النماذج أو إعدادات المزوّد. يشغّل `codex/<model>` دورة فهم صور محدودة عبر خادم تطبيق Codex؛ ويستخدم `openai-codex/<model>` مسار مزوّد OpenAI Codex OAuth.
- أوامر التنفيذ عديمة الحالة تستخدم الوضع المحلي افتراضيًا.
- أوامر الحالة المُدارة بواسطة Gateway تستخدم Gateway افتراضيًا.
- لا يتطلب المسار المحلي العادي أن يكون Gateway قيد التشغيل.
- `model run` يُشغّل مرة واحدة. تتم إزالة خوادم MCP المفتوحة عبر وقت تشغيل الوكيل لذلك الأمر بعد الرد سواء في التنفيذ المحلي أو `--gateway`، لذا فإن الاستدعاءات المتكررة ضمن السكربتات لا تُبقي العمليات الفرعية `stdio MCP` حيّة.

## Model

استخدم `model` للاستدلال النصي المعتمد على المزوّد وفحص النموذج/المزوّد.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

ملاحظات:

- يعيد `model run` استخدام وقت تشغيل الوكيل بحيث تتصرف تجاوزات المزوّد/النموذج مثل تنفيذ الوكيل العادي.
- لأن `model run` مخصص للأتمتة بدون تفاعل، فإنه لا يحتفظ ببيئات MCP المضمّنة الخاصة بكل جلسة بعد انتهاء الأمر.
- تدير `model auth login` و`model auth logout` و`model auth status` حالة مصادقة المزوّد المحفوظة.

## Image

استخدم `image` للإنشاء، والتحرير، والوصف.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

ملاحظات:

- استخدم `image edit` عند البدء من ملفات إدخال موجودة.
- استخدم `image providers --json` للتحقق من موفري الصور المضمّنين الذين يمكن
  اكتشافهم، وإعدادهم، واختيارهم، والقدرات التي يوفّرها كل مزوّد للإنشاء/التحرير.
- استخدم `image generate --model <provider/model> --json` كأضيق اختبار
  CLI حيّ لتغييرات إنشاء الصور. مثال:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  يبلّغ رد JSON عن `ok` و`provider` و`model` و`attempts` ومسارات
  المخرجات المكتوبة. عند ضبط `--output`، قد يتبع الامتداد النهائي
  نوع MIME الذي أعاده المزوّد.

- بالنسبة إلى `image describe`، يجب أن يكون `--model` من نوع `<provider/model>` يدعم الصور.
- بالنسبة إلى نماذج الرؤية المحلية في Ollama، اسحب النموذج أولًا واضبط `OLLAMA_API_KEY` على أي قيمة بديلة، مثل `ollama-local`. راجع [Ollama](/ar/providers/ollama#vision-and-image-description).

## Audio

استخدم `audio` لنسخ الملفات صوتيًا.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

ملاحظات:

- يُستخدم `audio transcribe` لنسخ الملفات، وليس لإدارة الجلسات الفورية.
- يجب أن يكون `--model` بصيغة `<provider/model>`.

## TTS

استخدم `tts` لتركيب الكلام وحالة مزوّد TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

ملاحظات:

- يستخدم `tts status` Gateway افتراضيًا لأنه يعكس حالة TTS المُدارة بواسطة Gateway.
- استخدم `tts providers` و`tts voices` و`tts set-provider` لفحص سلوك TTS وإعداده.

## Video

استخدم `video` للإنشاء والوصف.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

ملاحظات:

- يقبل `video generate` الوسائط `--size` و`--aspect-ratio` و`--resolution` و`--duration` و`--audio` و`--watermark` و`--timeout-ms` ويمررها إلى وقت تشغيل إنشاء الفيديو.
- يجب أن يكون `--model` بصيغة `<provider/model>` بالنسبة إلى `video describe`.

## Web

استخدم `web` لسير عمل البحث والجلب على الويب.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

ملاحظات:

- استخدم `web providers` لفحص المزوّدين المتاحين، والمهيئين، والمحددين.

## Embedding

استخدم `embedding` لإنشاء المتجهات وفحص موفري التضمين.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## مخرجات JSON

تقوم أوامر infer بتوحيد مخرجات JSON ضمن غلاف مشترك:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

الحقول ذات المستوى الأعلى ثابتة:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

بالنسبة إلى أوامر إنشاء الوسائط، يحتوي `outputs` على الملفات التي كتبها OpenClaw. استخدم
`path` و`mimeType` و`size` وأي أبعاد خاصة بالوسائط في تلك المصفوفة
للأتمتة بدلًا من تحليل `stdout` المقروء للبشر.

## أخطاء شائعة

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## ملاحظات

- `openclaw capability ...` هو اسم مستعار لـ `openclaw infer ...`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [النماذج](/ar/concepts/models)
