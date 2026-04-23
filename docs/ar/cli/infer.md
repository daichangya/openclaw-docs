---
read_when:
    - إضافة أو تعديل أوامر `openclaw infer`
    - تصميم أتمتة قدرات مستقرة من دون واجهة interactive
summary: واجهة CLI تعتمد infer-first لسير العمل المدعوم من المزوّد للنموذج، والصور، والصوت، وTTS، والفيديو، والويب، والتضمين
title: Inference CLI
x-i18n:
    generated_at: "2026-04-23T07:22:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57d2438d0da24e1ed880bbacd244ede4af56beba4ac1baa3f2a1e393e641c9c
    source_path: cli/infer.md
    workflow: 15
---

# Inference CLI

`openclaw infer` هو السطح القياسي بدون واجهة interactive لسير عمل الاستدلال المدعوم من المزوّد.

وهو يتعمد عرض عائلات القدرات، لا أسماء RPC الخام الخاصة بـ gateway ولا معرّفات أدوات الوكيل الخام.

## حوّل infer إلى Skill

انسخ هذا والصقه إلى وكيل:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

يجب أن تقوم Skill جيدة تعتمد على infer بما يلي:

- ربط نوايا المستخدم الشائعة بالأمر الفرعي الصحيح في infer
- تضمين بعض أمثلة infer القياسية لسير العمل التي تغطيها
- تفضيل `openclaw infer ...` في الأمثلة والاقتراحات
- تجنب إعادة توثيق سطح infer بالكامل داخل متن Skill

التغطية النموذجية لـ Skill تركز على infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## لماذا تستخدم infer

يوفر `openclaw infer` واجهة CLI واحدة ومتسقة لمهام الاستدلال المدعومة من المزوّد داخل OpenClaw.

الفوائد:

- استخدم المزوّدين والنماذج المضبوطة مسبقًا في OpenClaw بدلًا من توصيل مغلفات مخصصة منفصلة لكل واجهة خلفية.
- حافظ على سير عمل النموذج، والصور، ونسخ الصوت، وTTS، والفيديو، والويب، والتضمين ضمن شجرة أوامر واحدة.
- استخدم صيغة إخراج `--json` ثابتة للنصوص البرمجية، والأتمتة، وسير العمل الذي يقوده الوكيل.
- فضّل سطح OpenClaw أصليًا عندما تكون المهمة في جوهرها هي "تشغيل استدلال".
- استخدم المسار المحلي المعتاد من دون الحاجة إلى gateway لمعظم أوامر infer.

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

| المهمة                    | الأمر                                                                | ملاحظات                                                 |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| تشغيل مطالبة نص/نموذج | `openclaw infer model run --prompt "..." --json`                       | يستخدم المسار المحلي المعتاد افتراضيًا                 |
| إنشاء صورة       | `openclaw infer image generate --prompt "..." --json`                  | استخدم `image edit` عند البدء من ملف موجود  |
| وصف ملف صورة  | `openclaw infer image describe --file ./image.png --json`              | يجب أن يكون `--model` من نوع `<provider/model>` يدعم الصور |
| نسخ صوت إلى نص        | `openclaw infer audio transcribe --file ./memo.m4a --json`             | يجب أن يكون `--model` بصيغة `<provider/model>`                  |
| توليد كلام       | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` موجه نحو gateway                      |
| إنشاء فيديو        | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| وصف ملف فيديو   | `openclaw infer video describe --file ./clip.mp4 --json`               | يجب أن يكون `--model` بصيغة `<provider/model>`                  |
| البحث في الويب          | `openclaw infer web search --query "..." --json`                       |                                                       |
| جلب صفحة ويب        | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| إنشاء تضمينات       | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## السلوك

- `openclaw infer ...` هو سطح CLI الأساسي لهذه التدفقات.
- استخدم `--json` عندما يستهلك أمر آخر أو نص برمجي هذا الإخراج.
- استخدم `--provider` أو `--model provider/model` عندما تكون واجهة خلفية محددة مطلوبة.
- بالنسبة إلى `image describe` و`audio transcribe` و`video describe`، يجب أن يستخدم `--model` الصيغة `<provider/model>`.
- بالنسبة إلى `image describe`، يؤدي `--model` الصريح إلى تشغيل ذلك المزوّد/النموذج مباشرة. ويجب أن يكون النموذج قادرًا على التعامل مع الصور في فهرس النماذج أو إعدادات المزوّد.
- أوامر التنفيذ عديمة الحالة تستخدم المسار المحلي افتراضيًا.
- أوامر الحالة المُدارة بواسطة Gateway تستخدم gateway افتراضيًا.
- لا يتطلب المسار المحلي المعتاد تشغيل gateway.

## Model

استخدم `model` للاستدلال النصي المدعوم من المزوّد ولتفحّص النموذج/المزوّد.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
```

ملاحظات:

- يعيد `model run` استخدام بيئة تشغيل الوكيل بحيث تتصرف تجاوزات المزوّد/النموذج مثل تنفيذ الوكيل المعتاد.
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
- بالنسبة إلى `image describe`، يجب أن يكون `--model` من نوع `<provider/model>` يدعم الصور.
- بالنسبة إلى نماذج الرؤية المحلية في Ollama، اسحب النموذج أولًا واضبط `OLLAMA_API_KEY` على أي قيمة نائبة، مثل `ollama-local`. راجع [Ollama](/ar/providers/ollama#vision-and-image-description).

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

استخدم `tts` لتوليف الكلام وحالة مزوّد TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

ملاحظات:

- يستخدم `tts status` gateway افتراضيًا لأنه يعكس حالة TTS المُدارة بواسطة gateway.
- استخدم `tts providers` و`tts voices` و`tts set-provider` لتفحّص سلوك TTS وتهيئته.

## Video

استخدم `video` للإنشاء والوصف.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

ملاحظات:

- يجب أن يكون `--model` بصيغة `<provider/model>` في `video describe`.

## Web

استخدم `web` لتدفقات البحث والجلب.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

ملاحظات:

- استخدم `web providers` لتفحّص المزوّدين المتاحين والمهيئين والمحددين.

## Embedding

استخدم `embedding` لإنشاء المتجهات وتفحّص مزوّدات التضمين.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## إخراج JSON

تقوم أوامر infer بتوحيد إخراج JSON ضمن غلاف مشترك:

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

الحقول العليا ثابتة:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## الأخطاء الشائعة

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
