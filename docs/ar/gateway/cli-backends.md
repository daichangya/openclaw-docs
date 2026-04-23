---
read_when:
    - أنت تريد رجوعًا احتياطيًا موثوقًا عندما تفشل موفرو API
    - أنت تشغّل Codex CLI أو واجهات CLI محلية أخرى للذكاء الاصطناعي وتريد إعادة استخدامها
    - أنت تريد فهم جسر MCP المحلي loopback للوصول إلى أدوات الواجهة الخلفية لـ CLI
summary: 'الواجهات الخلفية لـ CLI: رجوع احتياطي إلى CLI محلي للذكاء الاصطناعي مع جسر أدوات MCP اختياري'
title: الواجهات الخلفية لـ CLI
x-i18n:
    generated_at: "2026-04-23T07:24:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# الواجهات الخلفية لـ CLI (بيئة تشغيل احتياطية)

يمكن لـ OpenClaw تشغيل **واجهات CLI محلية للذكاء الاصطناعي** كـ **رجوع احتياطي نصي فقط** عندما تتعطل موفرو API،
أو تتعرض لتحديد المعدل، أو تسيء التصرف مؤقتًا. هذا النهج محافظ عمدًا:

- **لا تُحقن أدوات OpenClaw مباشرة**، لكن الواجهات الخلفية التي تحتوي على `bundleMcp: true`
  يمكنها تلقي أدوات Gateway عبر جسر MCP محلي loopback.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (حتى تظل الأدوار اللاحقة مترابطة).
- **يمكن تمرير الصور** إذا كانت واجهة CLI تقبل مسارات الصور.

صُمم هذا كـ **شبكة أمان** بدلًا من كونه مسارًا أساسيًا. استخدمه عندما
تريد استجابات نصية "تعمل دائمًا" من دون الاعتماد على واجهات API خارجية.

إذا كنت تريد بيئة تشغيل harness كاملة مع عناصر تحكم جلسات ACP، والمهام الخلفية،
وربط thread/المحادثة، وجلسات برمجة خارجية دائمة، فاستخدم
[ACP Agents](/ar/tools/acp-agents) بدلًا من ذلك. الواجهات الخلفية لـ CLI ليست ACP.

## بدء سريع مناسب للمبتدئين

يمكنك استخدام Codex CLI **من دون أي تكوين** (يسجل OpenAI Plugin
المضمّن واجهة خلفية افتراضية):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

إذا كان Gateway يعمل تحت launchd/systemd وكان PATH محدودًا، فأضف فقط مسار الأمر:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

هذا كل شيء. لا حاجة إلى مفاتيح، ولا إلى تكوين مصادقة إضافي يتجاوز ما تتطلبه CLI نفسها.

إذا كنت تستخدم واجهة خلفية CLI مضمّنة كـ **موفر الرسائل الأساسي** على
مضيف Gateway، فإن OpenClaw يقوم الآن بتحميل Plugin المضمّن المالِك تلقائيًا عندما يشير تكوينك
صراحةً إلى تلك الواجهة الخلفية في مرجع نموذج أو ضمن
`agents.defaults.cliBackends`.

## استخدامه كرجوع احتياطي

أضف واجهة CLI خلفية إلى قائمة الرجوع الاحتياطي لديك حتى لا تعمل إلا عند فشل النماذج الأساسية:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

ملاحظات:

- إذا كنت تستخدم `agents.defaults.models` (قائمة سماح)، فيجب تضمين نماذج الواجهة الخلفية لـ CLI فيها أيضًا.
- إذا فشل الموفر الأساسي (المصادقة، حدود المعدل، المهلات)، فسيحاول OpenClaw
  استخدام الواجهة الخلفية لـ CLI بعده.

## نظرة عامة على التكوين

توجد جميع الواجهات الخلفية لـ CLI تحت:

```
agents.defaults.cliBackends
```

يُفهرس كل إدخال بواسطة **معرّف موفر** (مثل `codex-cli` أو `my-cli`).
ويصبح معرّف الموفر هو الطرف الأيسر من مرجع النموذج:

```
<provider>/<model>
```

### مثال على التكوين

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // يمكن لواجهات CLI بأسلوب Codex الإشارة إلى ملف prompt بدلًا من ذلك:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## كيف يعمل

1. **يحدد واجهة خلفية** بناءً على بادئة الموفر (`codex-cli/...`).
2. **ينشئ system prompt** باستخدام prompt وسياق مساحة العمل نفسيهما في OpenClaw.
3. **ينفذ CLI** باستخدام معرّف جلسة (إذا كان مدعومًا) حتى يظل السجل متسقًا.
   تُبقي الواجهة الخلفية المضمّنة `claude-cli` عملية Claude stdio
   حية لكل جلسة OpenClaw وترسل الأدوار اللاحقة عبر stream-json على stdin.
4. **يحلل المخرجات** (JSON أو نص عادي) ويعيد النص النهائي.
5. **يحفظ معرّفات الجلسات** لكل واجهة خلفية، بحيث تعيد الأدوار اللاحقة استخدام جلسة CLI نفسها.

<Note>
أصبحت الواجهة الخلفية المضمّنة `claude-cli` من Anthropic مدعومة مرة أخرى. فقد
أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذا يتعامل OpenClaw
مع استخدام `claude -p` على أنه معتمد لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرر الواجهة الخلفية المضمّنة `codex-cli` من OpenAI system prompt الخاص بـ OpenClaw عبر
تجاوز إعداد `model_instructions_file` في Codex (`-c
model_instructions_file="..."`). لا يكشف Codex عن علامة
`--append-system-prompt` على نمط Claude، لذا يكتب OpenClaw prompt المُجمَّع إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى الواجهة الخلفية المضمّنة `claude-cli` من Anthropic لقطة Skills الخاصة بـ OpenClaw
بطريقتين: فهرس Skills المضغوط لـ OpenClaw في system prompt المُلحق،
وPlugin مؤقت لـ Claude Code يُمرر باستخدام `--plugin-dir`. يحتوي Plugin
فقط على Skills المؤهلة لذلك الوكيل/الجلسة، لذا يرى محلل Skills الأصلي في Claude Code
المجموعة المصفاة نفسها التي كان OpenClaw سيعلنها بخلاف ذلك داخل prompt.
تظل تجاوزات env/API key الخاصة بـ Skills مطبقة من OpenClaw على بيئة عملية
الابن أثناء التنفيذ.

## الجلسات

- إذا كانت CLI تدعم الجلسات، فاضبط `sessionArg` (مثل `--session-id`) أو
  `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم إدراج المعرّف
  في عدة علامات.
- إذا كانت CLI تستخدم **أمرًا فرعيًا للاستئناف** مع علامات مختلفة، فاضبط
  `resumeArgs` (يستبدل `args` عند الاستئناف) ويمكنك اختياريًا ضبط `resumeOutput`
  (للاستئنافات غير المعتمدة على JSON).
- `sessionMode`:
  - `always`: أرسل دائمًا معرّف جلسة (UUID جديد إذا لم يكن هناك معرّف مخزن).
  - `existing`: أرسل معرّف جلسة فقط إذا كان قد تم تخزينه من قبل.
  - `none`: لا ترسل أبدًا معرّف جلسة.
- تستخدم `claude-cli` افتراضيًا `liveSession: "claude-stdio"` و`output: "jsonl"`،
  و`input: "stdin"` بحيث تعيد الأدوار اللاحقة استخدام عملية Claude الحية بينما
  تظل نشطة. أصبح stdio الدافئ هو الوضع الافتراضي الآن، بما في ذلك للتكوينات
  المخصصة التي تحذف حقول النقل. إذا أُعيد تشغيل Gateway أو خرجت العملية
  الخاملة، فسيستأنف OpenClaw من معرّف جلسة Claude المخزن. يتم التحقق من
  معرّفات الجلسات المخزنة مقابل transcript مشروع قابل للقراءة وموجود قبل
  الاستئناف، بحيث تُزال الارتباطات الوهمية مع `reason=transcript-missing`
  بدلًا من بدء جلسة Claude CLI جديدة بصمت تحت `--resume`.
- جلسات CLI المخزنة هي استمرارية مملوكة للموفر. لا تؤدي إعادة تعيين الجلسة
  اليومية الضمنية إلى قطعها؛ بينما يؤدي `/reset` وسياسات `session.reset`
  الصريحة إلى ذلك.

ملاحظات حول التسلسل:

- يحافظ `serialize: true` على ترتيب التنفيذات في المسار نفسه.
- تُسلسل معظم واجهات CLI التنفيذات على مسار موفر واحد.
- يسقط OpenClaw إعادة استخدام جلسة CLI المخزنة عندما تتغير هوية المصادقة المختارة،
  بما في ذلك تغيّر معرّف ملف تعريف المصادقة، أو API key ثابت، أو token ثابت، أو هوية
  حساب OAuth عندما تكشفها CLI. لا يؤدي تدوير access token أو refresh token في OAuth
  إلى قطع جلسة CLI المخزنة. إذا لم تكشف CLI عن معرّف حساب OAuth ثابت،
  فإن OpenClaw يترك لتلك CLI فرض أذونات الاستئناف.

## الصور (تمرير مباشر)

إذا كانت CLI لديك تقبل مسارات الصور، فاضبط `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيكتب OpenClaw الصور المشفرة بـ base64 إلى ملفات مؤقتة. وإذا كان `imageArg`
مضبوطًا، فستُمرر هذه المسارات كوسائط CLI. وإذا كان `imageArg` مفقودًا،
فسيُلحق OpenClaw مسارات الملفات إلى prompt (حقن المسار)، وهو ما يكفي
لواجهات CLI التي تحمّل الملفات المحلية تلقائيًا من المسارات النصية العادية.

## المدخلات / المخرجات

- يحاول `output: "json"` (الافتراضي) تحليل JSON واستخراج النص + معرّف الجلسة.
- بالنسبة إلى مخرجات JSON من Gemini CLI، يقرأ OpenClaw نص الرد من `response`
  والاستخدام من `stats` عندما يكون `usage` مفقودًا أو فارغًا.
- يحلل `output: "jsonl"` تدفقات JSONL (مثل Codex CLI مع `--json`) ويستخرج رسالة الوكيل النهائية بالإضافة إلى
  معرّفات الجلسة عند وجودها.
- يتعامل `output: "text"` مع stdout باعتباره الاستجابة النهائية.

أوضاع الإدخال:

- يمرر `input: "arg"` (الافتراضي) prompt باعتباره الوسيطة الأخيرة لـ CLI.
- يرسل `input: "stdin"` prompt عبر stdin.
- إذا كان prompt طويلًا جدًا وكان `maxPromptArgChars` مضبوطًا، فسيُستخدم stdin.

## القيم الافتراضية (مملوكة لـ Plugin)

يسجل OpenAI Plugin المضمّن أيضًا قيمة افتراضية لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

يسجل Google Plugin المضمّن أيضًا قيمة افتراضية لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب المسبق: يجب أن تكون Gemini CLI المحلية مثبتة ومتاحة باسم
`gemini` ضمن `PATH` (`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات JSON الخاصة بـ Gemini CLI:

- يُقرأ نص الرد من الحقل `response` في JSON.
- يعود الاستخدام إلى `stats` عندما يكون `usage` غائبًا أو فارغًا.
- يُطبّع `stats.cached` إلى OpenClaw `cacheRead`.
- إذا كان `stats.input` مفقودًا، يستنتج OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

لا تُجرِ تجاوزًا إلا عند الحاجة (غالبًا: مسار `command` مطلق).

## القيم الافتراضية المملوكة لـ Plugin

أصبحت القيم الافتراضية للواجهات الخلفية لـ CLI الآن جزءًا من سطح Plugin:

- تسجلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية بادئة الموفر في مراجع النماذج.
- يظل تكوين المستخدم في `agents.defaults.cliBackends.<id>` يتجاوز القيمة الافتراضية الخاصة بـ Plugin.
- تظل عمليات تنظيف التكوين الخاصة بالواجهة الخلفية مملوكة لـ Plugin عبر
  خطاف `normalizeConfig` الاختياري.

يمكن للـ Plugins التي تحتاج إلى توفيقات صغيرة لتوافق prompt/الرسائل أن تعلن
تحويلات نصية ثنائية الاتجاه من دون استبدال موفر أو واجهة خلفية CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

يعيد `input` كتابة system prompt وuser prompt الممرَّرين إلى CLI. ويعيد `output`
كتابة دلتا المساعد المتدفقة والنص النهائي المحلل قبل أن يتعامل OpenClaw مع
محددات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى واجهات CLI التي تنتج JSONL متوافقًا مع stream-json الخاص بـ Claude Code، اضبط
`jsonlDialect: "claude-stream-json"` في تكوين تلك الواجهة الخلفية.

## تراكبات Bundle MCP

لا تتلقى الواجهات الخلفية لـ CLI **استدعاءات أدوات OpenClaw مباشرة**، لكن يمكن
للواجهة الخلفية الاشتراك في تراكب تكوين MCP مُولّد باستخدام `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف تكوين MCP صارم مُولّد
- `codex-cli`: تجاوزات تكوين مضمنة لـ `mcp_servers`
- `google-gemini-cli`: ملف إعدادات نظام Gemini مُولّد

عند تفعيل bundle MCP، يقوم OpenClaw بما يلي:

- يشغّل خادم MCP محلي loopback عبر HTTP يكشف أدوات Gateway لعملية CLI
- يصادق الجسر باستخدام رمز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات وفق الجلسة الحالية، والحساب، وسياق القناة
- يحمّل خوادم bundle-MCP المفعّلة لمساحة العمل الحالية
- يدمجها مع أي شكل إعدادات/تكوين MCP موجود للواجهة الخلفية
- يعيد كتابة تكوين التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الامتداد المالِك

إذا لم تكن هناك خوادم MCP مفعّلة، يظل OpenClaw يحقن تكوينًا صارمًا عندما
تشترك واجهة خلفية في bundle MCP حتى تظل التنفيذات الخلفية معزولة.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يحقن OpenClaw استدعاءات أدوات داخل
  بروتوكول الواجهة الخلفية لـ CLI. لا ترى الواجهات الخلفية أدوات Gateway إلا عندما تشترك في
  `bundleMcp: true`.
- **البث خاص بكل واجهة خلفية.** بعض الواجهات الخلفية تبث JSONL؛ بينما يخزن بعضها الآخر
  حتى الخروج.
- **المخرجات المهيكلة** تعتمد على تنسيق JSON الخاص بـ CLI.
- **جلسات Codex CLI** تستأنف عبر مخرجات نصية (من دون JSONL)، وهذا أقل
  هيكلة من تشغيل `--json` الأولي. ومع ذلك، تظل جلسات OpenClaw تعمل بشكل طبيعي.

## استكشاف الأخطاء وإصلاحها

- **CLI غير موجودة**: اضبط `command` على مسار كامل.
- **اسم نموذج خاطئ**: استخدم `modelAliases` لربط `provider/model` ← نموذج CLI.
- **لا يوجد استمرار للجلسة**: تأكد من تعيين `sessionArg` وأن `sessionMode` ليس
  `none` (لا يمكن لـ Codex CLI حاليًا الاستئناف بمخرجات JSON).
- **يتم تجاهل الصور**: اضبط `imageArg` (وتحقق من أن CLI تدعم مسارات الملفات).
