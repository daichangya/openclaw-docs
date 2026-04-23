---
read_when:
    - تريد تثبيت أو إدارة Plugins الخاصة بـ Gateway أو الحزم المتوافقة
    - تريد تصحيح أخطاء فشل تحميل Plugin وإصلاحها
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T07:23:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7dd521db1de47ceb183d98a538005d3d816f52ffeee12593bcbaa8014d6e507b
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

إدارة Plugins الخاصة بـ Gateway، وحزم hook، والحزم المتوافقة.

ذو صلة:

- نظام Plugin: [Plugins](/ar/tools/plugin)
- توافق الحزم: [حزم Plugin](/ar/plugins/bundles)
- بيان Plugin + المخطط: [بيان Plugin](/ar/plugins/manifest)
- التقوية الأمنية: [الأمان](/ar/gateway/security)

## الأوامر

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

تأتي Plugins المضمّنة مع OpenClaw. ويكون بعضها مفعّلًا افتراضيًا (مثل
موفري النماذج المضمّنين، وموفري الكلام المضمّنين، وPlugin المتصفح
المضمّن)؛ بينما يتطلب بعضها الآخر تشغيل `plugins enable`.

يجب أن تأتي Plugins OpenClaw الأصلية مع `openclaw.plugin.json` يتضمن مخطط JSON
مضمنًا (`configSchema`، حتى لو كان فارغًا). أما الحزم المتوافقة فتستخدم
بيانات manifests الخاصة بحزمها بدلًا من ذلك.

يعرض `plugins list` قيمة `Format: openclaw` أو `Format: bundle`. كما يعرض
الإخراج المفصّل في list/info النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة
إلى قدرات الحزمة المكتشفة.

### Install

```bash
openclaw plugins install <package>                      # ClawHub أولًا، ثم npm
openclaw plugins install clawhub:<package>              # ClawHub فقط
openclaw plugins install <package> --force              # الكتابة فوق تثبيت موجود
openclaw plugins install <package> --pin                # تثبيت الإصدار
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # مسار محلي
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (صريح)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

تُفحص أسماء الحزم المجردة مقابل ClawHub أولًا، ثم npm. ملاحظة أمنية:
تعامل مع تثبيت Plugin كما تتعامل مع تشغيل تعليمات برمجية. ويفضّل استخدام إصدارات مثبّتة.

إذا كان قسم `plugins` لديك مدعومًا بملف `$include` أحادي الملف، فإن
`plugins install` و`plugins update` و`plugins enable` و`plugins disable` و`plugins uninstall`
تكتب إلى ذلك الملف المضمَّن وتترك `openclaw.json` من دون تغيير. أما
التضمينات الجذرية، ومصفوفات include، والتضمينات ذات التجاوزات الشقيقة
فتفشل بشكل مغلق بدلًا من التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration)
للاطلاع على الأشكال المدعومة.

إذا كانت الإعدادات غير صالحة، فإن `plugins install` يفشل عادةً بشكل مغلق ويطلب منك
تشغيل `openclaw doctor --fix` أولًا. والاستثناء الموثق الوحيد هو مسار ضيق
لاستعادة Plugin مضمّن يختاره Plugin صراحةً عبر
`openclaw.install.allowInvalidConfigRecovery`.

يعيد `--force` استخدام هدف التثبيت الحالي ويكتب فوق Plugin أو حزمة hook
مثبتة بالفعل في مكانها. استخدمه عندما تقصد عمدًا إعادة تثبيت المعرّف نفسه
من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو عنصر npm.
أما للترقيات المعتادة لـ Plugin npm مُتتبَّع بالفعل، ففضّل
`openclaw plugins update <id-or-npm-spec>`.

إذا شغّلت `plugins install` لمعرّف Plugin مثبت بالفعل، فسيتوقف OpenClaw
ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية المعتادة،
أو إلى `plugins install <package> --force` عندما تريد فعلًا الكتابة فوق
التثبيت الحالي من مصدر مختلف.

ينطبق `--pin` على تثبيتات npm فقط. وهو غير مدعوم مع `--marketplace`,
لأن تثبيتات marketplace تحفظ بيانات وصفية لمصدر marketplace بدلًا من
مواصفة npm.

يُعد `--dangerously-force-unsafe-install` خيار كسر زجاج للحالات الإيجابية
الخاطئة في ماسح التعليمات البرمجية الخطرة المدمج. فهو يسمح باستمرار التثبيت
حتى عندما يبلّغ الماسح المدمج عن نتائج `critical`، لكنه **لا**
يتجاوز كتل سياسة hook الخاصة بـ Plugin `before_install` و**لا** يتجاوز
إخفاقات الفحص.

ينطبق هذا الخيار في CLI على تدفقات تثبيت/تحديث Plugin. أما تثبيتات تبعيات Skill
المدعومة بـ Gateway فتستخدم تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`,
بينما يبقى `openclaw skills install` تدفق تنزيل/تثبيت Skills منفصلًا من ClawHub.

يُعد `plugins install` أيضًا سطح التثبيت لحزم hook التي تعرض
`openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لعرض hook
المفلتر وتمكين كل hook على حدة، وليس لتثبيت الحزمة.

مواصفات npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو
**dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. وتعمل تثبيتات
التبعيات باستخدام `--ignore-scripts` حفاظًا على الأمان.

تبقى المواصفات المجردة و`@latest` على المسار المستقر. وإذا حلّ npm أيًا منهما
إلى إصدار prerelease، فسيتوقف OpenClaw ويطلب منك الاشتراك صراحةً عبر
وسم prerelease مثل `@beta`/`@rc` أو إصدار prerelease دقيق مثل
`@1.2.3-beta.4`.

إذا طابقت مواصفة تثبيت مجردة معرّف Plugin مضمّن (مثل `diffs`)، فسيقوم OpenClaw
بتثبيت Plugin المضمّن مباشرة. ولتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة
محددة النطاق صريحة (مثل `@scope/diffs`).

الأرشيفات المدعومة: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

تُدعم أيضًا تثبيتات Claude marketplace.

تستخدم تثبيتات ClawHub محددًا صريحًا من نوع `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

يفضّل OpenClaw الآن أيضًا ClawHub لمواصفات Plugin المجردة الآمنة لـ npm. ولا
يعود إلى npm إلا إذا لم يكن ClawHub يملك تلك الحزمة أو ذلك الإصدار:

```bash
openclaw plugins install openclaw-codex-app-server
```

يقوم OpenClaw بتنزيل أرشيف الحزمة من ClawHub، ويتحقق من توافق
Plugin API المُعلن / الحد الأدنى لتوافق gateway، ثم يثبتها عبر مسار
الأرشيف المعتاد. وتحتفظ التثبيتات المسجلة ببياناتها الوصفية الخاصة بمصدر ClawHub
لأجل التحديثات اللاحقة.

استخدم الصيغة المختصرة `plugin@marketplace` عندما يكون اسم marketplace موجودًا
في cache السجل المحلي لـ Claude ضمن `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

استخدم `--marketplace` عندما تريد تمرير مصدر marketplace صراحةً:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

يمكن أن تكون مصادر marketplace:

- اسم marketplace معروف لـ Claude من `~/.claude/plugins/known_marketplaces.json`
- جذر marketplace محلي أو مسار `marketplace.json`
- صيغة مختصرة لمستودع GitHub مثل `owner/repo`
- عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
- عنوان URL لـ git

بالنسبة إلى marketpaces البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin
داخل مستودع marketplace المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من
ذلك المستودع ويرفض HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وسائر
مصادر Plugin غير المعتمدة على المسار من manifests البعيدة.

بالنسبة إلى المسارات المحلية والأرشيفات، يكتشف OpenClaw تلقائيًا:

- Plugins OpenClaw الأصلية (`openclaw.plugin.json`)
- الحزم المتوافقة مع Codex (`.codex-plugin/plugin.json`)
- الحزم المتوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude
  الافتراضي)
- الحزم المتوافقة مع Cursor (`.cursor-plugin/plugin.json`)

تُثبَّت الحزم المتوافقة في جذر Plugin المعتاد وتشارك في التدفق نفسه لـ
list/info/enable/disable. وحتى الآن، تُدعم Skills الحزمة، وClaude
command-skills، وقيم Claude الافتراضية في `settings.json`, وافتراضات Claude `.lsp.json` /
`lspServers` المعلنة في manifest، وCursor command-skills، وأدلة hook المتوافقة
مع Codex؛ أما قدرات الحزم المكتشفة الأخرى فتُعرض في diagnostics/info
لكنها ليست موصولة بعد بتنفيذ بيئة التشغيل.

### List

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

استخدم `--enabled` لإظهار Plugins المحمّلة فقط. واستخدم `--verbose` للتحول من
عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات المصدر/الأصل/الإصدار/التفعيل.
واستخدم `--json` للحصول على جرد قابل للقراءة الآلية بالإضافة إلى
diagnostics السجل.

استخدم `--link` لتجنب نسخ دليل محلي (يضيف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

لا يُدعم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام
مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` مع تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في
`plugins.installs` مع إبقاء السلوك الافتراضي غير مثبّت.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries` و`plugins.installs`,
ومن قائمة السماح لـ Plugin، ومن إدخالات `plugins.load.paths` المرتبطة عند الاقتضاء.
وبالنسبة إلى Plugins الذاكرة النشطة، تعود خانة الذاكرة إلى `memory-core`.

افتراضيًا، يزيل إلغاء التثبيت أيضًا دليل تثبيت Plugin تحت جذر Plugin في state-dir
النشط. استخدم
`--keep-files` للاحتفاظ بالملفات على القرص.

يُدعم `--keep-config` بوصفه اسمًا مستعارًا مهملًا لـ `--keep-files`.

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على التثبيتات المتتبعة في `plugins.installs` وتثبيتات حزم hook
المتتبعة في `hooks.internal.installs`.

عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك
Plugin. وهذا يعني أن dist-tags المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة
المثبّتة تستمر في الاستخدام في تشغيلات `update <id>` اللاحقة.

وبالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع dist-tag
أو إصدار دقيق. ويحل OpenClaw اسم تلك الحزمة مجددًا إلى سجل Plugin المتتبَّع،
ويحدّث Plugin المثبّت، ويسجّل مواصفة npm الجديدة لأجل التحديثات المستقبلية
المعتمدة على المعرّف.

كما أن تمرير اسم حزمة npm من دون إصدار أو وسم يعيد أيضًا الحل إلى
سجل Plugin المتتبَّع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق
وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات
سجل npm الوصفية. وإذا كان الإصدار المثبّت وهوية العنصر المسجلة
يطابقان بالفعل الهدف المحلول، فيُتجاوز التحديث من دون تنزيل أو إعادة تثبيت
أو إعادة كتابة `openclaw.json`.

عندما يكون هناك تجزئة سلامة مخزنة وتتغير تجزئة العنصر الذي جرى جلبه،
يتعامل OpenClaw مع ذلك على أنه انجراف في عنصر npm. ويقوم الأمر التفاعلي
`openclaw plugins update` بطباعة التجزئات المتوقعة والفعلية ويطلب
التأكيد قبل المتابعة. أما مساعدات التحديث غير التفاعلية فتفشل بشكل مغلق
ما لم يوفّر المستدعي سياسة متابعة صريحة.

يتوفر `--dangerously-force-unsafe-install` أيضًا مع `plugins update` بوصفه
تجاوز كسر زجاج للحالات الإيجابية الخاطئة في فحص التعليمات البرمجية الخطرة المدمج أثناء
تحديثات Plugin. وما يزال لا يتجاوز كتل سياسة `before_install` الخاصة بـ Plugin
ولا منع فشل الفحص، كما أنه ينطبق على تحديثات Plugin فقط، وليس على تحديثات حزم hook.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

تفحّص عميق لـ Plugin واحدة. يعرض الهوية، وحالة التحميل، والمصدر،
والقدرات المسجلة، وhooks، والأدوات، والأوامر، والخدمات، وأساليب gateway،
ومسارات HTTP، وأعلام السياسات، وdiagnostics، وبيانات التثبيت الوصفية، وقدرات الحزمة،
وأي دعم مكتشف لـ MCP أو LSP server.

تُصنَّف كل Plugin بحسب ما تسجله فعليًا في بيئة التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin خاصة بمزوّد فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — hooks فقط، من دون قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن من دون قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) للمزيد عن نموذج القدرات.

يُخرج الخيار `--json` تقريرًا قابلًا للقراءة آليًا مناسبًا للنصوص البرمجية
والتدقيق.

يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن الشكل، وأنواع القدرات،
وإشعارات التوافق، وقدرات الحزمة، وأعمدة ملخص hook.

`info` هو اسم مستعار لـ `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

يبلغ `doctor` عن أخطاء تحميل Plugin، وdiagnostics البيان/الاكتشاف،
وإشعارات التوافق. وعندما يكون كل شيء سليمًا فإنه يطبع `No plugin issues
detected.`

بالنسبة إلى إخفاقات شكل الوحدة مثل غياب الصادرات `register`/`activate`، أعد التشغيل
مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في
إخراج diagnostics.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

يقبل `marketplace list` مسار marketplace محليًا، أو مسار `marketplace.json`,
أو صيغة GitHub مختصرة مثل `owner/repo`, أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git.
ويطبع `--json` تسمية المصدر المحلولة بالإضافة إلى بيان marketplace المحلَّل
وإدخالات Plugin.
