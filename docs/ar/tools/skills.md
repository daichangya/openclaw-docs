---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير قواعد بوابة Skills أو تحميلها
summary: 'Skills: المُدارة مقابل مساحة العمل، وقواعد البوابة، وربط التكوين/البيئة'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:29:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

يستخدم OpenClaw مجلدات Skills **المتوافقة مع [AgentSkills](https://agentskills.io)** لتعليم الوكيل كيفية استخدام الأدوات. وكل Skill هو دليل يحتوي على `SKILL.md` مع frontmatter بصيغة YAML وتعليمات. ويحمّل OpenClaw **Skills المضمّنة** بالإضافة إلى التجاوزات المحلية الاختيارية، ويصفّيها وقت التحميل بناءً على البيئة، والتكوين، ووجود الملفات التنفيذية.

## المواقع والأولوية

يحمّل OpenClaw Skills من هذه المصادر:

1. **مجلدات Skills الإضافية**: تُكوَّن عبر `skills.load.extraDirs`
2. **Skills المضمّنة**: تُشحن مع التثبيت (حزمة npm أو OpenClaw.app)
3. **Skills المُدارة/المحلية**: ‏`~/.openclaw/skills`
4. **Skills الوكيل الشخصية**: ‏`~/.agents/skills`
5. **Skills وكيل المشروع**: ‏`<workspace>/.agents/skills`
6. **Skills مساحة العمل**: ‏`<workspace>/skills`

إذا حدث تعارض في اسم Skill، تكون الأولوية كالتالي:

`<workspace>/skills` (الأعلى) ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← Skills المضمّنة ← `skills.load.extraDirs` (الأدنى)

## Skills لكل وكيل مقابل Skills المشتركة

في إعدادات **الوكلاء المتعددين**، يمتلك كل وكيل مساحة عمل خاصة به. وهذا يعني:

- توجد **Skills الخاصة بكل وكيل** في `<workspace>/skills` لذلك الوكيل فقط.
- توجد **Skills وكيل المشروع** في `<workspace>/.agents/skills` وتُطبَّق على
  مساحة العمل تلك قبل مجلد `skills/` العادي في مساحة العمل.
- توجد **Skills الوكيل الشخصية** في `~/.agents/skills` وتُطبَّق عبر
  مساحات العمل على ذلك الجهاز.
- توجد **Skills المشتركة** في `~/.openclaw/skills` (المُدارة/المحلية) وتكون مرئية
  **لجميع الوكلاء** على الجهاز نفسه.
- يمكن أيضًا إضافة **مجلدات مشتركة** عبر `skills.load.extraDirs` (أدنى
  أولوية) إذا كنت تريد حزمة Skills مشتركة يستخدمها عدة وكلاء.

إذا كان اسم Skill نفسه موجودًا في أكثر من مكان، فتُطبَّق الأولوية
المعتادة: تفوز مساحة العمل، ثم Skills وكيل المشروع، ثم Skills الوكيل الشخصية،
ثم المُدارة/المحلية، ثم المضمّنة، ثم الأدلة الإضافية.

## قوائم سماح Skills لكل وكيل

إن **موقع** Skill و**مرئية** Skill عنصران منفصلان للتحكم.

- يحدد الموقع/الأولوية أي نسخة من Skill ذي الاسم نفسه تفوز.
- تحدد قوائم سماح الوكيل أي Skills مرئية يمكن للوكيل استخدامها فعليًا.

استخدم `agents.defaults.skills` كأساس مشترك، ثم تجاوز لكل وكيل عبر
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

- احذف `agents.defaults.skills` إذا أردت Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
- عيّن `agents.list[].skills: []` لعدم وجود Skills.
- تكون القائمة غير الفارغة في `agents.list[].skills` هي المجموعة النهائية لذلك الوكيل؛
  ولا تُدمج مع القيم الافتراضية.

يطبّق OpenClaw مجموعة Skills الفعالة للوكيل عبر بناء المطالبة،
واكتشاف الأوامر المائلة لـ Skill، والمزامنة مع sandbox، ولقطات Skill.

## Plugins + Skills

يمكن لـ Plugins شحن Skills خاصة بها من خلال إدراج أدلة `skills` في
`openclaw.plugin.json` (مسارات نسبةً إلى جذر Plugin). وتُحمَّل Skills Plugin
عند تفعيل Plugin. واليوم تُدمج هذه الأدلة في نفس المسار منخفض الأولوية مثل `skills.load.extraDirs`، لذلك فإن Skill مضمّنًا أو مُدارًا أو خاصًا بالوكيل أو بمساحة العمل يحمل الاسم نفسه يتجاوزه.
يمكنك وضع بوابة عليها عبر `metadata.openclaw.requires.config` على إدخال تكوين Plugin.
راجع [Plugins](/ar/tools/plugin) لاكتشافها/تكوينها، و[Tools](/ar/tools) لسطح
الأدوات الذي تعلّمه تلك Skills.

## Skill Workshop

يمكن لـ Plugin ‏Skill Workshop الاختياري والتجريبي إنشاء Skills مساحة العمل
أو تحديثها من إجراءات قابلة لإعادة الاستخدام لوحظت أثناء عمل الوكيل. وهو معطّل افتراضيًا ويجب تفعيله صراحة عبر
`plugins.entries.skill-workshop`.

يكتب Skill Workshop فقط إلى `<workspace>/skills`، ويفحص المحتوى المُولّد،
ويدعم الموافقة المعلّقة أو الكتابة الآلية الآمنة، ويعزل
الاقتراحات غير الآمنة، ويحدّث لقطة Skill بعد الكتابة الناجحة حتى يمكن أن تصبح
Skills الجديدة متاحة من دون إعادة تشغيل Gateway.

استخدمه عندما تريد أن تصبح تصحيحات مثل "في المرة القادمة، تحقّق من إسناد GIF"
أو إجراءات مكتسبة بشق الأنفس مثل قوائم فحص QA للوسائط تعليمات إجرائية دائمة. ابدأ بالموافقة المعلّقة؛ واستخدم الكتابات الآلية فقط في مساحات العمل الموثوقة بعد مراجعة اقتراحاته. الدليل الكامل:
[Plugin ‏Skill Workshop](/ar/plugins/skill-workshop).

## ClawHub (التثبيت + المزامنة)

ClawHub هو سجل Skills العام لـ OpenClaw. تصفّح عبر
[https://clawhub.ai](https://clawhub.ai). استخدم أوامر `openclaw skills`
الأصلية لاكتشاف Skills وتثبيتها وتحديثها، أو CLI المنفصلة `clawhub` عندما
تحتاج إلى تدفقات النشر/المزامنة.
الدليل الكامل: [ClawHub](/ar/tools/clawhub).

التدفقات الشائعة:

- تثبيت Skill في مساحة العمل:
  - `openclaw skills install <skill-slug>`
- تحديث جميع Skills المثبّتة:
  - `openclaw skills update --all`
- المزامنة (الفحص + نشر التحديثات):
  - `clawhub sync --all`

يقوم `openclaw skills install` الأصلي بالتثبيت في الدليل النشط `skills/`
بمساحة العمل. كما يقوم CLI المنفصل `clawhub` أيضًا بالتثبيت في `./skills` تحت
دليل العمل الحالي (أو يعود إلى مساحة عمل OpenClaw المُكوّنة).
ويلتقط OpenClaw ذلك باعتباره `<workspace>/skills` في الجلسة التالية.

## ملاحظات الأمان

- تعامل مع Skills الجهات الخارجية باعتبارها **كودًا غير موثوق**. اقرأها قبل تفعيلها.
- فضّل التشغيلات المعزولة للمدخلات غير الموثوقة والأدوات الخطرة. راجع [Sandboxing](/ar/gateway/sandboxing).
- لا يقبل اكتشاف Skills مساحة العمل والأدلة الإضافية إلا جذور Skills وملفات `SKILL.md` التي يبقى realpath المحلول لها داخل الجذر المُكوَّن.
- تقوم عمليات تثبيت تبعيات Skill المدعومة من Gateway (`skills.install`، والإعداد الأولي، وواجهة إعدادات Skills) بتشغيل ماسح built-in dangerous-code قبل تنفيذ بيانات تعريف المُثبّت. وتحظر نتائج `critical` افتراضيًا ما لم يعيّن المستدعي صراحة تجاوز الخطورة؛ بينما تظل النتائج المشبوهة تحذيرات فقط.
- يختلف `openclaw skills install <slug>` عن ذلك: فهو ينزّل مجلد Skill من ClawHub إلى `skills/` في مساحة العمل ولا يستخدم مسار بيانات تعريف المُثبّت أعلاه.
- تقوم `skills.entries.*.env` و`skills.entries.*.apiKey` بحقن الأسرار في **عملية المضيف**
  لذلك الدور الخاص بالوكيل (وليس في sandbox). أبقِ الأسرار خارج المطالبات والسجلات.
- للحصول على نموذج تهديد أوسع وقوائم فحص، راجع [Security](/ar/gateway/security).

## التنسيق (AgentSkills + متوافق مع Pi)

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

ملاحظات:

- نتبع مواصفة AgentSkills من حيث التخطيط/النية.
- يدعم المحلل المستخدم بواسطة الوكيل المضمّن مفاتيح frontmatter **أحادية السطر** فقط.
- يجب أن يكون `metadata` **كائن JSON أحادي السطر**.
- استخدم `{baseDir}` في التعليمات للإشارة إلى مسار مجلد Skill.
- مفاتيح frontmatter الاختيارية:
  - `homepage` — عنوان URL يظهر باعتباره “Website” في واجهة Skills على macOS (مدعوم أيضًا عبر `metadata.openclaw.homepage`).
  - `user-invocable` — ‏`true|false` (الافتراضي: `true`). عند تعيينه إلى `true`، يُكشف Skill كأمر مائل للمستخدم.
  - `disable-model-invocation` — ‏`true|false` (الافتراضي: `false`). عند تعيينه إلى `true`، يُستبعَد Skill من مطالبة النموذج (لكنه يظل متاحًا عبر استدعاء المستخدم).
  - `command-dispatch` — ‏`tool` (اختياري). عند تعيينه إلى `tool`، يتجاوز الأمر المائل النموذج ويُوزَّع مباشرة إلى أداة.
  - `command-tool` — اسم الأداة التي سيتم استدعاؤها عندما يتم تعيين `command-dispatch: tool`.
  - `command-arg-mode` — ‏`raw` (الافتراضي). في حالة توزيع الأداة، يمرّر سلسلة الوسائط الخام إلى الأداة (من دون تحليل في Core).

    تُستدعى الأداة بالمعلمات التالية:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## البوابة (مرشحات وقت التحميل)

يقوم OpenClaw **بتصفية Skills وقت التحميل** باستخدام `metadata` ‏(JSON أحادي السطر):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
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

- `always: true` — تضمين Skill دائمًا (وتخطي البوابات الأخرى).
- `emoji` — رمز تعبيري اختياري تستخدمه واجهة Skills على macOS.
- `homepage` — عنوان URL اختياري يظهر باعتباره “Website” في واجهة Skills على macOS.
- `os` — قائمة اختيارية للمنصات (`darwin` و`linux` و`win32`). وإذا تم تعيينها، يكون Skill مؤهلًا فقط على أنظمة التشغيل هذه.
- `requires.bins` — قائمة؛ يجب أن يوجد كل عنصر منها على `PATH`.
- `requires.anyBins` — قائمة؛ يجب أن يوجد عنصر واحد منها على الأقل على `PATH`.
- `requires.env` — قائمة؛ يجب أن يوجد متغير البيئة **أو** يتم توفيره في التكوين.
- `requires.config` — قائمة بمسارات `openclaw.json` التي يجب أن تكون truthy.
- `primaryEnv` — اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
- `install` — مصفوفة اختيارية من مواصفات المُثبّت المستخدمة بواسطة واجهة Skills على macOS ‏(brew/node/go/uv/download).

ملاحظة حول sandboxing:

- يتم التحقق من `requires.bins` على **المضيف** عند وقت تحميل Skill.
- إذا كان الوكيل يعمل داخل sandbox، فيجب أيضًا أن يوجد الملف التنفيذي **داخل الحاوية**.
  ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` (أو صورة مخصصة).
  يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية.
  كما تتطلب تثبيتات الحزم أيضًا خروجًا شبكيًا، ونظام ملفات جذري قابلًا للكتابة، ومستخدم root داخل sandbox.
  مثال: يتطلب Skill ‏`summarize` ‏(`skills/summarize/SKILL.md`) وجود CLI ‏`summarize`
  داخل حاوية sandbox لكي يعمل هناك.

مثال على المُثبّت:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
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
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

ملاحظات:

- إذا تم إدراج عدة مُثبّتات، يختار Gateway خيارًا **مفضّلًا واحدًا** (brew عند توفره، وإلا node).
- إذا كانت جميع المُثبّتات من نوع `download`، يسرد OpenClaw كل إدخال حتى تتمكن من رؤية جميع العناصر المتاحة.
- يمكن أن تتضمن مواصفات المُثبّت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
- تحترم تثبيتات Node قيمة `skills.install.nodeManager` في `openclaw.json` (الافتراضي: npm؛ الخيارات: npm/pnpm/yarn/bun).
  يؤثر هذا فقط في **تثبيتات Skill**؛ ويجب أن يظل وقت تشغيل Gateway هو Node
  (لا يوصى باستخدام Bun مع WhatsApp/Telegram).
- اختيار المُثبّت المدعوم من Gateway يعتمد على الأفضلية، وليس على node فقط:
  عندما تمزج مواصفات التثبيت بين الأنواع، يفضّل OpenClaw Homebrew عندما
  تكون `skills.install.preferBrew` مفعّلة ويوجد `brew`، ثم `uv`، ثم
  مدير node المُكوَّن، ثم وسائل الرجوع الاحتياطي الأخرى مثل `go` أو `download`.
- إذا كانت كل مواصفات التثبيت من نوع `download`، يعرض OpenClaw جميع خيارات التنزيل
  بدلًا من اختصارها إلى مُثبّت مفضّل واحد.
- تثبيتات Go: إذا لم يوجد `go` وكان `brew` متاحًا، يثبّت Gateway أداة Go عبر Homebrew أولًا ويعيّن `GOBIN` إلى `bin` الخاصة بـ Homebrew عند الإمكان.
- تثبيتات التنزيل: ‏`url` (مطلوب)، و`archive` ‏(`tar.gz` | `tar.bz2` | `zip`)، و`extract` (الافتراضي: auto عند اكتشاف أرشيف)، و`stripComponents`، و`targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).

إذا لم يكن `metadata.openclaw` موجودًا، يكون Skill مؤهلًا دائمًا (ما لم
يُعطّل في التكوين أو يُحظر بواسطة `skills.allowBundled` بالنسبة إلى Skills المضمّنة).

## تجاوزات التكوين (`~/.openclaw/openclaw.json`)

يمكن تفعيل/تعطيل Skills المضمّنة/المُدارة وتزويدها بقيم env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة نصية plaintext
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

إذا كنت تريد توليد/تحرير الصور القياسي داخل OpenClaw نفسه، فاستخدم أداة
`image_generate` الأساسية مع `agents.defaults.imageGenerationModel` بدلًا من
Skill مضمّن. وأمثلة Skills هنا مخصّصة لتدفقات العمل المخصصة أو الخارجية.

ولتحليل الصور الأصلي، استخدم أداة `image` مع `agents.defaults.imageModel`.
وللتوليد/التحرير الأصلي للصور، استخدم `image_generate` مع
`agents.defaults.imageGenerationModel`. وإذا اخترت `openai/*` أو `google/*` أو
`fal/*` أو أي نموذج صور خاص بمزوّد آخر، فأضف أيضًا مصادقة/مفتاح API لذلك
المزوّد.

تطابق مفاتيح التكوين **اسم Skill** افتراضيًا. وإذا عرّف Skill
`metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح تحت `skills.entries`.

القواعد:

- يعطّل `enabled: false` Skill حتى لو كان مضمّنًا/مثبّتًا.
- يتم حقن `env` **فقط إذا** لم يكن المتغير معيّنًا بالفعل في العملية.
- `apiKey`: وسيلة ملائمة لـ Skills التي تعلن `metadata.openclaw.primaryEnv`.
  ويدعم سلسلة plaintext أو كائن SecretRef ‏(`{ source, provider, id }`).
- `config`: حقيبة اختيارية للحقول المخصصة لكل Skill؛ ويجب أن تعيش المفاتيح المخصصة هنا.
- `allowBundled`: قائمة سماح اختيارية لـ **Skills المضمّنة** فقط. وإذا تم تعيينها، تصبح فقط
  Skills المضمّنة المدرجة في القائمة مؤهلة (ولا تتأثر Skills المُدارة/مساحة العمل).

## حقن البيئة (لكل تشغيل وكيل)

عند بدء تشغيل الوكيل، يقوم OpenClaw بما يلي:

1. قراءة بيانات تعريف Skill.
2. تطبيق أي `skills.entries.<key>.env` أو `skills.entries.<key>.apiKey` على
   `process.env`.
3. بناء مطالبة النظام باستخدام Skills **المؤهلة**.
4. استعادة البيئة الأصلية بعد انتهاء التشغيل.

هذا **محصور بتشغيل الوكيل**، وليس بيئة shell عامة.

بالنسبة إلى الواجهة الخلفية `claude-cli` المضمّنة، يقوم OpenClaw أيضًا بتمثيل
اللقطة المؤهلة نفسها باعتبارها Plugin مؤقتًا لـ Claude Code ويمررها عبر
`--plugin-dir`. ويمكن لـ Claude Code حينها استخدام محلل Skills الأصلي الخاص به بينما
يظل OpenClaw مالكًا للأولوية، وقوائم السماح لكل وكيل، والبوابة، وحقن
البيئة/مفاتيح API في `skills.entries.*`. أما الواجهات الخلفية الأخرى لـ CLI
فتستخدم فهرس المطالبات فقط.

## لقطة الجلسة (الأداء)

يلتقط OpenClaw Skills المؤهلة **عند بدء الجلسة** ويعيد استخدام تلك القائمة في الأدوار اللاحقة ضمن الجلسة نفسها. وتدخل التغييرات على Skills أو التكوين حيز التنفيذ في الجلسة الجديدة التالية.

كما يمكن لـ Skills أن تُحدَّث أثناء الجلسة عندما تكون أداة مراقبة Skills مفعّلة أو عند ظهور Node بعيدة مؤهلة جديدة (راجع أدناه). فكّر في ذلك على أنه **إعادة تحميل ساخنة**: تُلتقط القائمة المحدّثة في دور الوكيل التالي.

إذا تغيّرت قائمة السماح الفعالة لـ Skills الخاصة بذلك الوكيل لتلك الجلسة، فإن OpenClaw
يحدّث اللقطة حتى تبقى Skills المرئية متوافقة مع الوكيل الحالي.

## Nodes macOS البعيدة (Linux Gateway)

إذا كان Gateway يعمل على Linux ولكن **Node macOS** متصلة **مع السماح بـ `system.run`** (عدم تعيين أمان موافقات Exec إلى `deny`)، فيمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما تكون الملفات التنفيذية المطلوبة موجودة على تلك Node. وينبغي للوكيل تنفيذ تلك Skills عبر أداة `exec` باستخدام `host=node`.

يعتمد هذا على أن تقوم Node بالإبلاغ عن دعم أوامرها وعلى فحص الملفات التنفيذية عبر `system.run`. وإذا أصبحت Node macOS غير متصلة لاحقًا، فستظل Skills مرئية؛ وقد تفشل الاستدعاءات حتى تعيد Node الاتصال.

## أداة مراقبة Skills (التحديث التلقائي)

افتراضيًا، يراقب OpenClaw مجلدات Skills ويزيد لقطة Skills عندما تتغير ملفات `SKILL.md`. ويمكن تكوين ذلك ضمن `skills.load`:

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

## تأثير الرموز (قائمة Skills)

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مدمجة بالـ Skills المتاحة داخل مطالبة النظام (عبر `formatSkillsForPrompt` في `pi-coding-agent`). وتكون التكلفة حتمية:

- **الكلفة الأساسية (فقط عند وجود ≥1 Skill):** ‏195 حرفًا.
- **لكل Skill:** ‏97 حرفًا + طول القيم بعد XML-escaped لكل من `<name>` و`<description>` و`<location>`.

الصيغة (بالحروف):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

ملاحظات:

- يؤدي XML escaping إلى توسيع `& < > " '` إلى كيانات (`&amp;` و`&lt;` وما إلى ذلك)، مما يزيد الطول.
- تختلف أعداد الرموز حسب tokenizer الخاص بالنموذج. والتقدير التقريبي بأسلوب OpenAI هو نحو 4 أحرف/رمز، لذا فإن **97 حرفًا ≈ 24 رمزًا** لكل Skill بالإضافة إلى أطوال الحقول الفعلية.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills باعتبارها **Skills مضمّنة** كجزء من
التثبيت (حزمة npm أو OpenClaw.app). ويوجد `~/.openclaw/skills` للتجاوزات المحلية
(مثل تثبيت/تصحيح Skill من دون تغيير النسخة المضمّنة). أما Skills مساحة العمل فهي مملوكة للمستخدم وتتجاوز كليهما عند تعارض الأسماء.

## مرجع التكوين

راجع [إعدادات Skills](/ar/tools/skills-config) لمعرفة مخطط التكوين الكامل.

## هل تبحث عن المزيد من Skills؟

تصفّح [https://clawhub.ai](https://clawhub.ai).

---

## ذو صلة

- [إنشاء Skills](/ar/tools/creating-skills) — بناء Skills مخصصة
- [إعدادات Skills](/ar/tools/skills-config) — مرجع تكوين Skills
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) — جميع أوامر الشرطة المائلة المتاحة
- [Plugins](/ar/tools/plugin) — نظرة عامة على نظام Plugins
