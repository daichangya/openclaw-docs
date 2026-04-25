---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير قواعد بوابة Skills أو تحميلها
summary: 'Skills: المُدارة مقابل مساحة العمل، وقواعد البوابة، وربط الإعدادات/البيئة'
title: Skills
x-i18n:
    generated_at: "2026-04-25T14:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

يستخدم OpenClaw مجلدات Skills المتوافقة مع **[AgentSkills](https://agentskills.io)** لتعليم العامل كيفية استخدام الأدوات. كل Skill هو دليل يحتوي على `SKILL.md` مع YAML frontmatter وتعليمات. يحمّل OpenClaw **Skills المضمّنة** بالإضافة إلى تجاوزات محلية اختيارية، ويقوم بتصفيتها وقت التحميل استنادًا إلى البيئة، والإعدادات، ووجود الملفات التنفيذية.

## المواقع والأولوية

يحمّل OpenClaw Skills من هذه المصادر:

1. **مجلدات Skills الإضافية**: تُضبط عبر `skills.load.extraDirs`
2. **Skills المضمّنة**: تُشحن مع التثبيت (حزمة npm أو OpenClaw.app)
3. **Skills المُدارة/المحلية**: `~/.openclaw/skills`
4. **Skills العامل الشخصية**: `~/.agents/skills`
5. **Skills عامل المشروع**: `<workspace>/.agents/skills`
6. **Skills مساحة العمل**: `<workspace>/skills`

إذا حدث تعارض في اسم Skill، تكون الأولوية كما يلي:

`<workspace>/skills` (الأعلى) ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← Skills المضمّنة ← `skills.load.extraDirs` (الأدنى)

## Skills لكل عامل مقابل Skills المشتركة

في إعدادات **متعددة العوامل**، يمتلك كل عامل مساحة عمل خاصة به. وهذا يعني:

- توجد **Skills الخاصة بكل عامل** في `<workspace>/skills` لذلك العامل فقط.
- توجد **Skills عامل المشروع** في `<workspace>/.agents/skills` وتُطبّق على
  تلك المساحة قبل مجلد `skills/` العادي في مساحة العمل.
- توجد **Skills العامل الشخصية** في `~/.agents/skills` وتُطبّق عبر
  مساحات العمل على ذلك الجهاز.
- توجد **Skills المشتركة** في `~/.openclaw/skills` (مُدارة/محلية) وتكون مرئية
  **لجميع العوامل** على الجهاز نفسه.
- يمكن أيضًا إضافة **مجلدات مشتركة** عبر `skills.load.extraDirs` (أدنى
  أولوية) إذا كنت تريد حزمة Skills مشتركة يستخدمها عدة عوامل.

إذا وُجد اسم Skill نفسه في أكثر من مكان، تُطبّق الأولوية المعتادة:
تفوز مساحة العمل، ثم Skills عامل المشروع، ثم Skills العامل الشخصية،
ثم المُدارة/المحلية، ثم المضمّنة، ثم الأدلة الإضافية.

## قوائم السماح لـ Skills الخاصة بالعوامل

يُعد **موقع** Skill و**مرئية** Skill عنصرَي تحكم منفصلين.

- يحدد الموقع/الأولوية أي نسخة من Skill تحمل الاسم نفسه تفوز.
- تحدد قوائم السماح الخاصة بالعامل أي Skills مرئية يمكن للعامل استخدامها فعليًا.

استخدم `agents.defaults.skills` كخط أساس مشترك، ثم تجاوز لكل عامل عبر
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // يرث github, weather
      { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

القواعد:

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
- اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
- تمثل قائمة `agents.list[].skills` غير الفارغة المجموعة النهائية لذلك العامل؛ فهي
  لا تُدمج مع القيم الافتراضية.

يطبق OpenClaw مجموعة Skills الفعلية الخاصة بالعامل عبر بناء الموجّه،
واكتشاف أوامر slash الخاصة بالـ Skill، والمزامنة مع sandbox، ولقطات Skill.

## Plugins + Skills

يمكن لـ Plugins شحن Skills الخاصة بها من خلال إدراج أدلة `skills` في
`openclaw.plugin.json` (مسارات نسبةً إلى جذر Plugin). تُحمَّل Skills الخاصة بالPlugin
عندما يكون Plugin مفعّلًا. وهذا هو الموضع الصحيح لأدلة التشغيل الخاصة بالأداة
والتي تكون أطول من أن توضع داخل وصف الأداة لكن ينبغي أن تكون متاحة
كلما كان Plugin مثبتًا؛ على سبيل المثال، يشحن Plugin المتصفح
Skill باسم `browser-automation` للتحكم متعدد الخطوات في المتصفح. اليوم تُدمج هذه
الأدلة في نفس المسار منخفض الأولوية مثل
`skills.load.extraDirs`، لذا فإن Skill المضمّنة، أو المُدارة، أو الخاصة بالعامل، أو مساحة العمل
التي تحمل الاسم نفسه تتجاوزها.
يمكنك تقييدها عبر `metadata.openclaw.requires.config` في إدخال إعدادات Plugin.
راجع [Plugins](/ar/tools/plugin) للاكتشاف/الإعدادات و[الأدوات](/ar/tools) لسطح
الأدوات الذي تعلّمه هذه Skills.

## Skill Workshop

يمكن لـ Plugin Skill Workshop الاختياري والتجريبي إنشاء Skills مساحة العمل
أو تحديثها انطلاقًا من إجراءات قابلة لإعادة الاستخدام لوحظت أثناء عمل العامل. وهو معطّل
افتراضيًا ويجب تفعيله صراحة عبر
`plugins.entries.skill-workshop`.

يكتب Skill Workshop فقط إلى `<workspace>/skills`، ويفحص المحتوى المُولّد،
ويدعم الموافقة المعلّقة أو الكتابات الآمنة التلقائية، ويعزل
المقترحات غير الآمنة، ويحدّث لقطة Skill بعد الكتابات الناجحة حتى يمكن أن تصبح
Skills الجديدة متاحة من دون إعادة تشغيل Gateway.

استخدمه عندما تريد أن تصبح تصحيحات مثل "في المرة القادمة، تحقّق من نسبة GIF" أو
تدفّقات العمل المكتسبة بصعوبة مثل قوائم التحقق الخاصة بضمان جودة الوسائط تعليمات إجرائية
دائمة. ابدأ بالموافقة المعلّقة؛ واستخدم الكتابة التلقائية فقط في
مساحات العمل الموثوقة بعد مراجعة مقترحاته. الدليل الكامل:
[Plugin Skill Workshop](/ar/plugins/skill-workshop).

## ClawHub (التثبيت + المزامنة)

ClawHub هو سجل Skills العام لـ OpenClaw. تصفحه على
[https://clawhub.ai](https://clawhub.ai). استخدم أوامر `openclaw skills`
الأصلية لاكتشاف Skills أو تثبيتها أو تحديثها، أو استخدم CLI المنفصل `clawhub` عندما
تحتاج إلى عمليات نشر/مزامنة.
الدليل الكامل: [ClawHub](/ar/tools/clawhub).

التدفقات الشائعة:

- تثبيت Skill في مساحة العمل:
  - `openclaw skills install <skill-slug>`
- تحديث كل Skills المثبتة:
  - `openclaw skills update --all`
- المزامنة (فحص + نشر التحديثات):
  - `clawhub sync --all`

يقوم `openclaw skills install` الأصلي بالتثبيت داخل دليل `skills/`
في مساحة العمل النشطة. كما يقوم CLI المنفصل `clawhub` أيضًا بالتثبيت في `./skills` تحت
دليل العمل الحالي (أو يعود إلى مساحة عمل OpenClaw المضبوطة).
ويتعرف OpenClaw على ذلك باعتباره `<workspace>/skills` في الجلسة التالية.

## ملاحظات الأمان

- تعامل مع Skills الخارجية على أنها **كود غير موثوق**. اقرأها قبل التفعيل.
- فضّل التشغيل ضمن sandbox للمدخلات غير الموثوقة والأدوات عالية المخاطر. راجع [Sandboxing](/ar/gateway/sandboxing).
- لا يقبل اكتشاف Skills في مساحة العمل وفي الأدلة الإضافية إلا جذور Skills وملفات `SKILL.md` التي يبقى realpath المحلول لها داخل الجذر المضبوط.
- تقوم عمليات تثبيت تبعيات Skill المدعومة من Gateway (`skills.install`، والإعداد الأولي، وواجهة إعدادات Skills) بتشغيل ماسح الكود الخطير المضمّن قبل تنفيذ بيانات التثبيت الوصفية. وتحظر النتائج `critical` افتراضيًا ما لم يضبط المستدعي صراحة تجاوز الخطر؛ أما النتائج المشبوهة فتظل تحذيرات فقط.
- يختلف `openclaw skills install <slug>` عن ذلك: فهو ينزّل مجلد Skill من ClawHub إلى مساحة العمل ولا يستخدم مسار بيانات التثبيت الوصفية المذكور أعلاه.
- تقوم `skills.entries.*.env` و`skills.entries.*.apiKey` بحقن الأسرار في عملية **المضيف**
  لذلك الدور الخاص بالعامل (وليس داخل sandbox). أبقِ الأسرار خارج الموجّهات والسجلات.
- للاطلاع على نموذج تهديد أوسع وقوائم تحقق، راجع [الأمان](/ar/gateway/security).

## التنسيق (AgentSkills + Pi-compatible)

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: أنشئ الصور أو عدّلها عبر تدفق عمل صور مدعوم من مزود
---
```

ملاحظات:

- نتبع مواصفات AgentSkills من حيث التخطيط/النية.
- يدعم المُحلِّل الذي يستخدمه العامل المضمّن مفاتيح frontmatter **أحادية السطر** فقط.
- يجب أن تكون `metadata` **كائن JSON في سطر واحد**.
- استخدم `{baseDir}` في التعليمات للإشارة إلى مسار مجلد Skill.
- مفاتيح frontmatter الاختيارية:
  - `homepage` — عنوان URL يظهر بوصفه “Website” في واجهة مستخدم Skills على macOS (ويدعَم أيضًا عبر `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (الافتراضي: `true`). عند ضبطه على `true`، تُعرَض Skill كأمر slash للمستخدم.
  - `disable-model-invocation` — `true|false` (الافتراضي: `false`). عند ضبطه على `true`، تُستبعد Skill من موجّه النموذج (مع بقائها متاحة عبر استدعاء المستخدم).
  - `command-dispatch` — `tool` (اختياري). عند ضبطه على `tool`، يتجاوز أمر slash النموذج ويُمرَّر مباشرة إلى أداة.
  - `command-tool` — اسم الأداة المطلوب استدعاؤها عند ضبط `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (الافتراضي). في تمرير الأدوات، تُمرَّر سلسلة الوسيطات الخام إلى الأداة (من دون تحليل أساسي).

    تُستدعى الأداة بهذه المعلمات:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## البوابة (مرشحات وقت التحميل)

يقوم OpenClaw **بتصفية Skills وقت التحميل** باستخدام `metadata` (JSON أحادي السطر):

```markdown
---
name: image-lab
description: أنشئ الصور أو عدّلها عبر تدفق عمل صور مدعوم من مزود
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

الحقول ضمن `metadata.openclaw`:

- `always: true` — أدرج Skill دائمًا (تخطَّ البوابات الأخرى).
- `emoji` — رمز تعبيري اختياري تستخدمه واجهة مستخدم Skills على macOS.
- `homepage` — عنوان URL اختياري يظهر على أنه “Website” في واجهة مستخدم Skills على macOS.
- `os` — قائمة اختيارية للمنصات (`darwin` و`linux` و`win32`). إذا ضُبطت، فلا تكون Skill مؤهلة إلا على أنظمة التشغيل تلك.
- `requires.bins` — قائمة؛ يجب أن يوجد كل عنصر منها على `PATH`.
- `requires.anyBins` — قائمة؛ يجب أن يوجد عنصر واحد منها على الأقل على `PATH`.
- `requires.env` — قائمة؛ يجب أن يوجد متغير البيئة **أو** أن يكون مقدمًا في الإعدادات.
- `requires.config` — قائمة بمسارات `openclaw.json` التي يجب أن تكون ذات قيمة truthy.
- `primaryEnv` — اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
- `install` — مصفوفة اختيارية من مواصفات المُثبت المستخدمة بواسطة واجهة مستخدم Skills على macOS (brew/node/go/uv/download).

لا تزال كتل `metadata.clawdbot` القديمة مقبولة عندما يكون
`metadata.openclaw` غير موجود، بحيث تحتفظ Skills المثبتة القديمة
ببوابات التبعيات وتلميحات المُثبت الخاصة بها. يجب أن تستخدم
Skills الجديدة والمحدّثة `metadata.openclaw`.

ملاحظة حول sandboxing:

- يتم التحقق من `requires.bins` على **المضيف** في وقت تحميل Skill.
- إذا كان العامل يعمل داخل sandbox، فيجب أن يوجد الملف التنفيذي أيضًا **داخل الحاوية**.
  قم بتثبيته عبر `agents.defaults.sandbox.docker.setupCommand` (أو صورة مخصصة).
  ويعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية.
  كما تتطلب عمليات تثبيت الحزم خروجًا إلى الشبكة، ونظام ملفات جذريًا قابلًا للكتابة، ومستخدم root داخل sandbox.
  مثال: تحتاج Skill `summarize` (`skills/summarize/SKILL.md`) إلى CLI
  `summarize` داخل حاوية sandbox لكي تعمل هناك.

مثال على المُثبت:

```markdown
---
name: gemini
description: استخدم Gemini CLI للمساعدة في البرمجة وعمليات بحث Google.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "ثبّت Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

ملاحظات:

- إذا أُدرجت عدة مثبتات، يختار Gateway خيارًا مفضّلًا **واحدًا** (brew عند توفره، وإلا node).
- إذا كانت كل المثبتات من نوع `download`، يسرد OpenClaw كل إدخال حتى تتمكن من رؤية العناصر المتاحة.
- يمكن أن تتضمن مواصفات المُثبت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
- تراعي عمليات تثبيت Node القيمة `skills.install.nodeManager` في `openclaw.json` (الافتراضي: npm؛ والخيارات: npm/pnpm/yarn/bun).
  وهذا يؤثر فقط في **تثبيت Skills**؛ أما وقت تشغيل Gateway فيجب أن يبقى Node
  (ولا يُنصح باستخدام Bun مع WhatsApp/Telegram).
- يعتمد اختيار المُثبت المدعوم من Gateway على التفضيل، وليس على node فقط:
  فعندما تمزج مواصفات التثبيت بين الأنواع، يفضّل OpenClaw Homebrew عندما
  يكون `skills.install.preferBrew` مفعّلًا ويكون `brew` موجودًا، ثم `uv`، ثم
  مدير node المضبوط، ثم بدائل أخرى مثل `go` أو `download`.
- إذا كانت كل مواصفات التثبيت من نوع `download`، يعرض OpenClaw جميع خيارات التنزيل
  بدلًا من طيّها في مُثبت مفضّل واحد.
- تثبيتات Go: إذا كان `go` مفقودًا وكان `brew` متاحًا، يقوم Gateway أولًا بتثبيت Go عبر Homebrew ويضبط `GOBIN` على `bin` الخاص بـ Homebrew متى أمكن.
- تثبيتات التنزيل: `url` (مطلوب)، و`archive` (`tar.gz` | `tar.bz2` | `zip`)، و`extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، و`stripComponents`، و`targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).

إذا لم توجد `metadata.openclaw`، فستكون Skill مؤهلة دائمًا (إلا إذا
تم تعطيلها في الإعدادات أو حُجبت بواسطة `skills.allowBundled` بالنسبة إلى Skills المضمّنة).

## تجاوزات الإعدادات (`~/.openclaw/openclaw.json`)

يمكن تبديل Skills المضمّنة/المُدارة وتزويدها بقيم البيئة:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة نصية صريحة
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

ملاحظة: إذا كان اسم Skill يحتوي على شرطات، فضع المفتاح بين علامتي اقتباس (يسمح JSON5 بالمفاتيح المقتبسة).

إذا كنت تريد إنشاء/تعديل صور أساسيًا داخل OpenClaw نفسه، فاستخدم الأداة الأساسية
`image_generate` مع `agents.defaults.imageGenerationModel` بدلًا من
Skill مضمّنة. أمثلة Skills هنا مخصصة لتدفقات العمل المخصصة أو الخارجية.

للتحليل الأصلي للصور، استخدم الأداة `image` مع `agents.defaults.imageModel`.
وللإنشاء/التعديل الأصلي للصور، استخدم `image_generate` مع
`agents.defaults.imageGenerationModel`. وإذا اخترت `openai/*` أو `google/*` أو
`fal/*` أو أي نموذج صور آخر خاص بمزود، فأضف أيضًا مفتاح
المصادقة/API لذلك المزود.

تطابق مفاتيح الإعداد **اسم Skill** افتراضيًا. وإذا عرّفت Skill القيمة
`metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح تحت `skills.entries`.

القواعد:

- `enabled: false` يعطّل Skill حتى لو كانت مضمّنة/مثبتة.
- `env`: يتم حقنه **فقط إذا** لم يكن المتغير مضبوطًا بالفعل في العملية.
- `apiKey`: وسيلة مريحة لـ Skills التي تعلن عن `metadata.openclaw.primaryEnv`.
  يدعم سلسلة نصية صريحة أو كائن SecretRef (`{ source, provider, id }`).
- `config`: حاوية اختيارية للحقول المخصصة لكل Skill؛ يجب أن تعيش المفاتيح المخصصة هنا.
- `allowBundled`: قائمة سماح اختيارية لـ Skills **المضمّنة** فقط. إذا تم ضبطها،
  فلا تكون مؤهلة إلا Skills المضمّنة الموجودة في القائمة (ولا تتأثر Skills المُدارة/مساحة العمل).

## حقن البيئة (لكل تشغيل عامل)

عند بدء تشغيل عامل، يقوم OpenClaw بما يلي:

1. يقرأ بيانات Skill الوصفية.
2. يطبق أي قيم من `skills.entries.<key>.env` أو `skills.entries.<key>.apiKey` على
   `process.env`.
3. يبني موجّه النظام باستخدام Skills **المؤهلة**.
4. يستعيد البيئة الأصلية بعد انتهاء التشغيل.

هذا **محصور بتشغيل العامل**، وليس بيئة shell عامة.

بالنسبة إلى الواجهة الخلفية المضمّنة `claude-cli`، يقوم OpenClaw أيضًا
بتجسيد اللقطة المؤهلة نفسها باعتبارها Plugin مؤقتًا لـ Claude Code ويمررها
باستخدام `--plugin-dir`. ويمكن لـ Claude Code بعد ذلك استخدام محلل Skills الأصلي الخاص به بينما يحتفظ
OpenClaw بالأولوية، وقوائم السماح لكل عامل، والبوابة، وحقن البيئة/مفاتيح API
لـ `skills.entries.*`. أما الواجهات الخلفية الأخرى لـ CLI فتستخدم
فهرس الموجّهات فقط.

## لقطة الجلسة (الأداء)

يلتقط OpenClaw Snapshot للSkills المؤهلة **عند بدء الجلسة** ويعيد استخدام تلك القائمة في الأدوار اللاحقة ضمن الجلسة نفسها. وتدخل التغييرات على Skills أو الإعدادات حيز التنفيذ في الجلسة الجديدة التالية.

يمكن أيضًا تحديث Skills في منتصف الجلسة عند تفعيل مراقب Skills أو عند ظهور Node بعيدة جديدة مؤهلة (انظر أدناه). ويمكنك التفكير في ذلك على أنه **إعادة تحميل سريعة**: حيث تُلتقط القائمة المحدَّثة في الدور التالي للعامل.

إذا تغيّرت قائمة السماح الفعلية لـ Skills الخاصة بالعامل لتلك الجلسة، يحدّث OpenClaw
اللقطة حتى تبقى Skills المرئية متوافقة مع العامل الحالي.

## Nodes macOS البعيدة (Linux gateway)

إذا كان Gateway يعمل على Linux لكن **Node macOS** متصلة **مع السماح بـ `system.run`** (أي لم يتم ضبط أمان Exec approvals على `deny`)، فيمكن لـ OpenClaw التعامل مع Skills الخاصة بـ macOS فقط على أنها مؤهلة عندما تكون الملفات التنفيذية المطلوبة موجودة على تلك Node. ويجب على العامل تنفيذ تلك Skills عبر أداة `exec` مع `host=node`.

يعتمد ذلك على قيام Node بالإبلاغ عن دعم الأوامر لديها وعلى فحص الملفات التنفيذية عبر `system.run`. وإذا أصبحت Node الخاصة بـ macOS غير متصلة لاحقًا، تظل Skills مرئية؛ وقد تفشل عمليات الاستدعاء إلى أن تعود Node للاتصال.

## مراقب Skills (التحديث التلقائي)

يراقب OpenClaw افتراضيًا مجلدات Skills ويزيد لقطة Skills عندما تتغير ملفات `SKILL.md`. اضبط هذا ضمن `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## تأثير التوكنات (قائمة Skills)

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مضغوطة بالSkills المتاحة داخل موجّه النظام (عبر `formatSkillsForPrompt` في `pi-coding-agent`). وتكون الكلفة حتمية:

- **الكلفة الأساسية (فقط عند وجود ≥1 Skill):** 195 حرفًا.
- **لكل Skill:** 97 حرفًا + طول القيم `<name>` و`<description>` و`<location>` بعد الهروب XML.

الصيغة (بالأحرف):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

ملاحظات:

- يؤدي الهروب XML إلى توسيع `& < > " '` إلى كيانات (`&amp;` و`&lt;` وغيرها)، مما يزيد الطول.
- تختلف أعداد التوكنات حسب مقسّم التوكنات الخاص بالنموذج. ويُعد تقدير تقريبي على نمط OpenAI هو ~4 أحرف/توكن، لذا فإن **97 حرفًا ≈ 24 توكنًا** لكل Skill بالإضافة إلى الأطوال الفعلية لحقولك.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills بوصفها **Skills مضمّنة** كجزء من
التثبيت (حزمة npm أو OpenClaw.app). وتوجد `~/.openclaw/skills` من أجل
التجاوزات المحلية (مثل تثبيت/ترقيع Skill من دون تغيير النسخة
المضمّنة). أما Skills مساحة العمل فهي مملوكة للمستخدم وتتجاوز الاثنين معًا عند تعارض الأسماء.

## مرجع الإعدادات

راجع [إعدادات Skills](/ar/tools/skills-config) للاطلاع على مخطط الإعداد الكامل.

## هل تبحث عن المزيد من Skills؟

تصفح [https://clawhub.ai](https://clawhub.ai).

---

## ذو صلة

- [إنشاء Skills](/ar/tools/creating-skills) — بناء Skills مخصصة
- [إعدادات Skills](/ar/tools/skills-config) — مرجع إعدادات Skills
- [أوامر Slash](/ar/tools/slash-commands) — جميع أوامر slash المتاحة
- [Plugins](/ar/tools/plugin) — نظرة عامة على نظام Plugin
