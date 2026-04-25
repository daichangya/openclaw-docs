---
read_when:
    - تريد خيارًا احتياطيًا موثوقًا عندما تفشل مزودات API
    - أنت تشغّل Codex CLI أو واجهات CLI محلية أخرى للذكاء الاصطناعي وتريد إعادة استخدامها
    - تريد فهم جسر MCP loopback للوصول إلى أدوات الواجهة الخلفية CLI
summary: 'واجهات CLI الخلفية: احتياط محلي لواجهات CLI الخاصة بالذكاء الاصطناعي مع جسر أدوات MCP اختياري'
title: واجهات CLI الخلفية
x-i18n:
    generated_at: "2026-04-25T13:46:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

يمكن لـ OpenClaw تشغيل **واجهات CLI محلية للذكاء الاصطناعي** كخيار **احتياطي نصي فقط** عندما تتعطل مزودات API،
أو تُفرض عليها حدود معدّل، أو تُظهر سلوكًا غير مستقر مؤقتًا. وهذا النهج متحفظ عمدًا:

- **لا يتم حقن أدوات OpenClaw مباشرةً**، لكن الواجهات الخلفية التي تحتوي على `bundleMcp: true`
  يمكنها تلقي أدوات Gateway عبر جسر MCP loopback.
- **بث JSONL** لواجهات CLI التي تدعمه.
- **الجلسات مدعومة** (بحيث تظل الأدوار اللاحقة مترابطة).
- **يمكن تمرير الصور** إذا كانت واجهة CLI تقبل مسارات الصور.

تم تصميم هذا كـ **شبكة أمان** وليس كمسار أساسي. استخدمه عندما
تريد ردودًا نصية "تعمل دائمًا" من دون الاعتماد على API خارجية.

إذا كنت تريد وقت تشغيل harness كاملًا مع عناصر تحكم جلسات ACP، والمهام الخلفية،
وربط الخيوط/المحادثات، وجلسات برمجة خارجية دائمة، فاستخدم
[وكلاء ACP](/ar/tools/acp-agents) بدلًا من ذلك. الواجهات الخلفية CLI ليست ACP.

## بداية سريعة مناسبة للمبتدئين

يمكنك استخدام Codex CLI **من دون أي إعداد** (يسجّل Plugin OpenAI المضمّن
واجهة خلفية افتراضية):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

إذا كانت Gateway تعمل تحت launchd/systemd وكان PATH محدودًا، فأضف فقط
مسار الأمر:

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

هذا كل شيء. لا مفاتيح، ولا حاجة إلى إعداد مصادقة إضافي بخلاف واجهة CLI نفسها.

إذا كنت تستخدم واجهة خلفية CLI مضمّنة بوصفها **مزود الرسائل الأساسي** على
مضيف Gateway، فإن OpenClaw يقوم الآن بتحميل Plugin المضمّن المالك تلقائيًا عندما
يشير إعدادك صراحةً إلى تلك الواجهة الخلفية في مرجع نموذج أو تحت
`agents.defaults.cliBackends`.

## استخدامه كخيار احتياطي

أضف واجهة خلفية CLI إلى قائمة الاحتياط لديك بحيث لا تعمل إلا عند فشل النماذج الأساسية:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

ملاحظات:

- إذا كنت تستخدم `agents.defaults.models` ‏(قائمة السماح)، فيجب أن تتضمن نماذج واجهتك الخلفية CLI أيضًا.
- إذا فشل المزوّد الأساسي (المصادقة أو حدود المعدّل أو المهلات)، فسيحاول OpenClaw
  استخدام الواجهة الخلفية CLI بعد ذلك.

## نظرة عامة على الإعداد

توجد جميع الواجهات الخلفية CLI تحت:

```
agents.defaults.cliBackends
```

يُفهرس كل إدخال بواسطة **معرّف مزوّد** (مثل `codex-cli` أو `my-cli`).
ويصبح معرّف المزوّد هو الجزء الأيسر من مرجع النموذج:

```
<provider>/<model>
```

### مثال على الإعداد

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
          // بالنسبة إلى واجهات CLI التي تحتوي على راية مخصصة لملف الموجّه:
          // systemPromptFileArg: "--system-file",
          // يمكن لواجهات CLI على نمط Codex الإشارة إلى ملف موجّه بدلًا من ذلك:
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

1. **يختار واجهة خلفية** استنادًا إلى بادئة المزوّد (`codex-cli/...`).
2. **ينشئ موجّه نظام** باستخدام موجّه OpenClaw نفسه + سياق مساحة العمل.
3. **يشغّل CLI** مع معرّف جلسة (إذا كان مدعومًا) حتى يبقى السجل متسقًا.
   تحافظ الواجهة الخلفية المضمّنة `claude-cli` على بقاء عملية Claude stdio
   حية لكل جلسة OpenClaw وترسل الأدوار اللاحقة عبر stdin من نوع stream-json.
4. **يحلل المخرجات** (JSON أو نص عادي) ويعيد النص النهائي.
5. **يحفظ معرّفات الجلسات** لكل واجهة خلفية، بحيث تعيد الأدوار اللاحقة استخدام الجلسة نفسها في CLI.

<Note>
الواجهة الخلفية المضمّنة `claude-cli` الخاصة بـ Anthropic مدعومة مرة أخرى. وقد أخبرنا موظفو Anthropic
أن استخدام Claude CLI على نمط OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع
استخدام `claude -p` على أنه معتمد لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة.
</Note>

تمرر الواجهة الخلفية المضمّنة `codex-cli` الخاصة بـ OpenAI موجّه نظام OpenClaw عبر
تجاوز إعداد Codex المسمى `model_instructions_file` ‏(`-c
model_instructions_file="..."`). ولا يوفّر Codex راية
`--append-system-prompt` على نمط Claude، لذلك يكتب OpenClaw الموجّه المُنشأ إلى
ملف مؤقت لكل جلسة Codex CLI جديدة.

تتلقى الواجهة الخلفية المضمّنة `claude-cli` الخاصة بـ Anthropic لقطة Skills في OpenClaw
بطريقتين: فهرس Skills المدمج في OpenClaw داخل موجّه النظام الملحق، و
Claude Code Plugin مؤقت يُمرَّر باستخدام `--plugin-dir`. يحتوي هذا Plugin
فقط على Skills المؤهلة لذلك الوكيل/تلك الجلسة، بحيث يرى محلل Skills الأصلي في Claude Code
المجموعة المفلترة نفسها التي كان OpenClaw سيعلن عنها بطريقة أخرى داخل
الموجّه. ولا تزال تجاوزات متغيرات البيئة/مفاتيح API الخاصة بـ Skills تُطبَّق من قبل OpenClaw على
بيئة العملية التابعة أثناء التشغيل.

يمتلك Claude CLI أيضًا وضع أذونات خاصًا به لغير التفاعلي. ويقوم OpenClaw بربطه
بسياسة exec الحالية بدلًا من إضافة إعداد خاص بـ Claude: عندما تكون سياسة exec المطلوبة
الفعالة هي YOLO ‏(`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، يضيف OpenClaw القيمة `--permission-mode bypassPermissions`.
تتجاوز إعدادات `agents.list[].tools.exec` لكل وكيل القيم العامة `tools.exec` لذلك
الوكيل. ولإجبار وضع Claude مختلف، عيّن وسائط الواجهة الخلفية الخام صراحةً مثل
`--permission-mode default` أو `--permission-mode acceptEdits` تحت
`agents.defaults.cliBackends.claude-cli.args` و`resumeArgs` المطابقة.

قبل أن يتمكن OpenClaw من استخدام الواجهة الخلفية المضمّنة `claude-cli`، يجب أن يكون Claude Code نفسه قد سجّل الدخول بالفعل على المضيف نفسه:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

استخدم `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون الملف التنفيذي `claude`
موجودًا بالفعل على `PATH`.

## الجلسات

- إذا كانت واجهة CLI تدعم الجلسات، فعيّن `sessionArg` ‏(مثل `--session-id`) أو
  `sessionArgs` ‏(العنصر النائب `{sessionId}`) عندما يكون من الضروري إدراج المعرّف
  داخل عدة رايات.
- إذا كانت واجهة CLI تستخدم **أمرًا فرعيًا للاستئناف** مع رايات مختلفة، فعيّن
  `resumeArgs` ‏(يستبدل `args` عند الاستئناف) ويمكنك اختياريًا تعيين `resumeOutput`
  (لعمليات الاستئناف غير JSON).
- `sessionMode`:
  - `always`: يرسل دائمًا معرّف جلسة (UUID جديد إذا لم يكن هناك معرّف محفوظ).
  - `existing`: يرسل معرّف جلسة فقط إذا كان قد تم حفظه سابقًا.
  - `none`: لا يرسل أبدًا معرّف جلسة.
- تستخدم `claude-cli` افتراضيًا `liveSession: "claude-stdio"` و`output: "jsonl"` و
  `input: "stdin"` بحيث تعيد الأدوار اللاحقة استخدام عملية Claude الحية بينما
  تظل نشطة. وأصبح stdio الدافئ هو الافتراضي الآن، بما في ذلك للإعدادات المخصصة
  التي تحذف حقول النقل. وإذا أعيد تشغيل Gateway أو خرجت
  العملية الخاملة، يستأنف OpenClaw من معرّف جلسة Claude المخزن. ويتم التحقق من
  معرّفات الجلسات المخزنة مقابل project transcript موجود وقابل للقراءة قبل
  الاستئناف، بحيث يتم مسح الارتباطات الوهمية مع `reason=transcript-missing`
  بدلًا من بدء جلسة Claude CLI جديدة بصمت تحت `--resume`.
- جلسات CLI المخزنة هي استمرارية يملكها المزوّد. ولا يقطعها
  إعادة تعيين الجلسة اليومية الضمنية؛ لكن `/reset` وسياسات `session.reset` الصريحة تفعل ذلك.

ملاحظات حول التسلسل:

- يؤدي `serialize: true` إلى إبقاء التشغيلات في المسار نفسه مرتبة.
- تقوم معظم واجهات CLI بالتسلسل على مسار مزوّد واحد.
- يتوقف OpenClaw عن إعادة استخدام جلسة CLI المخزنة عندما تتغير هوية المصادقة المختارة،
  بما في ذلك تغيّر معرّف ملف تعريف المصادقة، أو مفتاح API ثابت، أو رمز ثابت، أو
  هوية حساب OAuth عندما تكشفها واجهة CLI. ولا يؤدي تدوير access token أو refresh token في OAuth
  إلى قطع جلسة CLI المخزنة. وإذا كانت واجهة CLI لا تكشف عن معرّف حساب OAuth
  ثابت، فإن OpenClaw يترك لتلك الواجهة فرض أذونات الاستئناف.

## الصور (تمرير مباشر)

إذا كانت واجهة CLI الخاصة بك تقبل مسارات الصور، فعيّن `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

سيقوم OpenClaw بكتابة الصور المشفّرة base64 إلى ملفات مؤقتة. وإذا تم تعيين `imageArg`، فسيتم
تمرير تلك المسارات كوسائط CLI. وإذا كان `imageArg` مفقودًا، فسيضيف OpenClaw
مسارات الملفات إلى الموجّه (حقن المسار)، وهو ما يكفي لواجهات CLI التي تقوم
بتحميل الملفات المحلية تلقائيًا من المسارات العادية.

## المدخلات / المخرجات

- `output: "json"` ‏(افتراضي) يحاول تحليل JSON واستخراج النص + معرّف الجلسة.
- بالنسبة إلى مخرجات JSON الخاصة بـ Gemini CLI، يقرأ OpenClaw نص الرد من `response` و
  الاستخدام من `stats` عندما تكون `usage` مفقودة أو فارغة.
- `output: "jsonl"` يحلل تدفقات JSONL ‏(مثل Codex CLI ‏`--json`) ويستخرج رسالة الوكيل النهائية بالإضافة إلى
  معرّفات الجلسة عند وجودها.
- `output: "text"` يتعامل مع stdout بوصفه الرد النهائي.

أوضاع الإدخال:

- `input: "arg"` ‏(افتراضي) يمرر الموجّه كآخر وسيطة CLI.
- `input: "stdin"` يرسل الموجّه عبر stdin.
- إذا كان الموجّه طويلًا جدًا وتم تعيين `maxPromptArgChars`، فسيتم استخدام stdin.

## الإعدادات الافتراضية (مملوكة لـ Plugin)

يسجّل Plugin OpenAI المضمّن أيضًا إعدادًا افتراضيًا لـ `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

يسجّل Plugin Google المضمّن أيضًا إعدادًا افتراضيًا لـ `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

المتطلب المسبق: يجب أن يكون Gemini CLI المحلي مثبتًا ومتاحًا باسم
`gemini` على `PATH` ‏(`brew install gemini-cli` أو
`npm install -g @google/gemini-cli`).

ملاحظات JSON الخاصة بـ Gemini CLI:

- تتم قراءة نص الرد من حقل JSON المسمى `response`.
- يعود الاستخدام إلى `stats` عندما تكون `usage` غائبة أو فارغة.
- يتم تطبيع `stats.cached` إلى OpenClaw `cacheRead`.
- إذا كانت `stats.input` مفقودة، يستنتج OpenClaw رموز الإدخال من
  `stats.input_tokens - stats.cached`.

قم بالتجاوز فقط عند الحاجة (الأكثر شيوعًا: مسار `command` مطلق).

## الإعدادات الافتراضية المملوكة لـ Plugin

أصبحت الإعدادات الافتراضية للواجهات الخلفية CLI الآن جزءًا من سطح Plugin:

- تسجلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية هو بادئة المزوّد في مراجع النماذج.
- يظل إعداد المستخدم في `agents.defaults.cliBackends.<id>` يتجاوز الإعداد الافتراضي للـ Plugin.
- تظل عملية تنظيف إعدادات الواجهة الخلفية الخاصة مملوكة للـ Plugin عبر hook
  الاختياري `normalizeConfig`.

يمكن للـ Plugins التي تحتاج إلى طبقات توافق صغيرة للموجّهات/الرسائل أن تعلن عن
تحويلات نصية ثنائية الاتجاه من دون استبدال مزوّد أو واجهة خلفية CLI:

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

يعيد `input` كتابة موجّه النظام وموجّه المستخدم الممرَّرين إلى واجهة CLI. ويعيد
`output` كتابة تدفقات assistant deltas والنص النهائي المحلل قبل أن يعالج OpenClaw
علامات التحكم الخاصة به وتسليم القناة.

بالنسبة إلى واجهات CLI التي تنتج JSONL متوافقًا مع stream-json الخاص بـ Claude Code، قم بتعيين
`jsonlDialect: "claude-stream-json"` على إعداد تلك الواجهة الخلفية.

## تراكبات Bundle MCP

لا تتلقى الواجهات الخلفية CLI **استدعاءات أدوات OpenClaw مباشرةً**، لكن يمكن لواجهة خلفية
أن تشترك في تراكب إعداد MCP مُنشأ عبر `bundleMcp: true`.

السلوك المضمّن الحالي:

- `claude-cli`: ملف إعداد MCP صارم مُنشأ
- `codex-cli`: تجاوزات إعداد مضمّنة لـ `mcp_servers`؛ ويتم تمييز
  خادم OpenClaw loopback المُنشأ بوضع موافقة الأدوات لكل خادم في Codex
  بحيث لا يمكن أن تتعطل استدعاءات MCP بسبب مطالبات الموافقة المحلية
- `google-gemini-cli`: ملف إعدادات نظام Gemini مُنشأ

عند تمكين bundle MCP، يقوم OpenClaw بما يلي:

- يشغّل خادم MCP محليًا عبر HTTP loopback يعرّض أدوات Gateway إلى عملية CLI
- يصادق الجسر باستخدام رمز مميز لكل جلسة (`OPENCLAW_MCP_TOKEN`)
- يقيّد الوصول إلى الأدوات بحسب الجلسة الحالية والحساب وسياق القناة
- يحمّل خوادم bundle-MCP المفعّلة لمساحة العمل الحالية
- يدمجها مع أي شكل موجود مسبقًا لإعداد/إعدادات MCP في الواجهة الخلفية
- يعيد كتابة إعداد التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الامتداد المالك

إذا لم تكن أي خوادم MCP مفعّلة، يظل OpenClaw يحقن إعدادًا صارمًا عندما
تشترك واجهة خلفية في bundle MCP حتى تظل التشغيلات الخلفية معزولة.

يتم تخزين أوقات التشغيل المضمّنة لـ MCP ضمن نطاق الجلسة مؤقتًا لإعادة استخدامها داخل الجلسة، ثم
تتم إزالتها بعد `mcp.sessionIdleTtlMs` ملي ثانية من الخمول (الافتراضي 10
دقائق؛ عيّن القيمة `0` للتعطيل). تقوم التشغيلات المضمّنة ذات اللقطة الواحدة مثل
فحوصات المصادقة، وإنشاء slug، وعمليات استدعاء Active Memory بطلب تنظيف عند نهاية التشغيل حتى لا تعيش
أبناء stdio وتدفقات Streamable HTTP/SSE بعد انتهاء التشغيل.

## القيود

- **لا توجد استدعاءات مباشرة لأدوات OpenClaw.** لا يقوم OpenClaw بحقن استدعاءات الأدوات في
  بروتوكول الواجهة الخلفية CLI. ولا ترى الواجهات الخلفية أدوات Gateway إلا عندما تشترك في
  `bundleMcp: true`.
- **يعتمد البث على الواجهة الخلفية.** فبعض الواجهات الخلفية تبث JSONL؛ بينما تقوم أخرى بالتخزين المؤقت
  حتى الخروج.
- **المخرجات المهيكلة** تعتمد على تنسيق JSON الخاص بواجهة CLI.
- **جلسات Codex CLI** تُستأنف عبر مخرجات نصية (من دون JSONL)، وهي أقل
  هيكلة من تشغيل `--json` الأولي. ومع ذلك، تظل جلسات OpenClaw تعمل
  بشكل طبيعي.

## استكشاف الأخطاء وإصلاحها

- **لم يتم العثور على CLI**: عيّن `command` إلى مسار كامل.
- **اسم نموذج غير صحيح**: استخدم `modelAliases` لربط `provider/model` ← نموذج CLI.
- **لا يوجد استمرارية للجلسة**: تأكد من تعيين `sessionArg` وأن `sessionMode` ليست
  `none` (لا يستطيع Codex CLI حاليًا الاستئناف مع مخرجات JSON).
- **يتم تجاهل الصور**: عيّن `imageArg` (وتحقق من أن CLI تدعم مسارات الملفات).

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
