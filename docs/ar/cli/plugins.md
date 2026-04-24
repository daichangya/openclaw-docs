---
read_when:
    - تريد تثبيت أو إدارة مكونات Gateway الإضافية أو الحِزم المتوافقة
    - تريد تصحيح أخطاء فشل تحميل المكونات الإضافية
summary: مرجع CLI لـ `openclaw plugins` (`list`، `install`، `marketplace`، `uninstall`، `enable`/`disable`، `doctor`)
title: المكونات الإضافية
x-i18n:
    generated_at: "2026-04-24T15:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

إدارة مكونات Gateway الإضافية، وحِزم الخطافات، والحِزم المتوافقة.

ذو صلة:

- نظام Plugin: [المكونات الإضافية](/ar/tools/plugin)
- توافق الحِزم: [حِزم Plugin](/ar/plugins/bundles)
- بيان Plugin + المخطط: [بيان Plugin](/ar/plugins/manifest)
- تعزيز الأمان: [الأمان](/ar/gateway/security)

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

تأتي المكونات الإضافية المضمّنة مع OpenClaw. ويكون بعضُها مفعّلًا افتراضيًا (على سبيل المثال، موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح المضمّن)؛ بينما يتطلب بعضها الآخر `plugins enable`.

يجب أن توفّر مكونات OpenClaw الإضافية الأصلية الملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى إن كان فارغًا). أمّا الحِزم المتوافقة فتستخدم بيانات الحِزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما يعرض خرج `list/info` المفصل أيضًا النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى قدرات الحزمة المكتشفة.

### التثبيت

```bash
openclaw plugins install <package>                      # ClawHub أولًا، ثم npm
openclaw plugins install clawhub:<package>              # ClawHub فقط
openclaw plugins install <package> --force              # الكتابة فوق التثبيت الحالي
openclaw plugins install <package> --pin                # تثبيت الإصدار
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # مسار محلي
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (صريح)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

تُفحَص أسماء الحِزم المجرّدة في ClawHub أولًا، ثم npm. ملاحظة أمنية: تعامل مع تثبيت المكونات الإضافية كما لو أنك تشغّل شيفرة. ويُفضّل استخدام إصدارات مثبّتة.

إذا كان قسم `plugins` لديك يعتمد على `$include` لملف واحد، فإن `plugins install/update/enable/disable/uninstall` يكتب مباشرة إلى ذلك الملف المضمَّن ويترك `openclaw.json` دون تغيير. أمّا التضمينات الجذرية، ومصفوفات التضمين، والتضمينات التي تحتوي على تجاوزات شقيقة، فتفشل بشكل مغلق بدلًا من التسطيح. راجع [تضمينات الإعداد](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

إذا كان الإعداد غير صالح، فإن `plugins install` يفشل بشكل مغلق عادةً ويطلب منك تشغيل `openclaw doctor --fix` أولًا. والاستثناء الوحيد الموثق هو مسار استرداد ضيق خاص بالمكونات الإضافية المضمّنة للمكونات التي تُعلن صراحةً عن `openclaw.install.allowInvalidConfigRecovery`.

يعيد `--force` استخدام هدف التثبيت الحالي ويكتب فوق Plugin أو حزمة الخطافات المثبّتة بالفعل في مكانها. استخدمه عندما تكون بصدد إعادة تثبيت المعرّف نفسه عمدًا من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو عنصر npm. أمّا للترقيات الروتينية لـ Plugin npm متعقَّب بالفعل، فافضّل استخدام `openclaw plugins update <id-or-npm-spec>`.

إذا شغّلت `plugins install` لمعرّف Plugin مثبّت بالفعل، فسيتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا الكتابة فوق التثبيت الحالي من مصدر مختلف.

ينطبق `--pin` على عمليات تثبيت npm فقط. وهو غير مدعوم مع `--marketplace`، لأن عمليات التثبيت من marketplace تحفظ بيانات مصدر marketplace بدلًا من مواصفة npm.

يُعد `--dangerously-force-unsafe-install` خيارًا للطوارئ في حالات الإيجابيات الكاذبة ضمن ماسح الشيفرة الخطرة المدمج. فهو يسمح بمتابعة التثبيت حتى عندما يبلغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسة الخطاف `before_install` الخاص بالمكون الإضافي، كما أنه **لا** يتجاوز حالات فشل الفحص.

ينطبق هذا العلم في CLI على تدفقات تثبيت/تحديث Plugin. أمّا عمليات تثبيت تبعيات Skills المعتمدة على Gateway فتستخدم تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` تدفق تنزيل/تثبيت Skills مستقلًا من ClawHub.

يُعد `plugins install` أيضًا واجهة التثبيت لحِزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` للحصول على عرض مفلتر للخطافات وتمكين كل خطاف على حدة، وليس لتثبيت الحزمة.

مواصفات npm هي **للسجل فقط** (اسم الحزمة مع **إصدار مطابق تمامًا** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. وتُشغَّل عمليات تثبيت التبعيات مع `--ignore-scripts` من أجل الأمان.

تظل المواصفات المجرّدة و`@latest` على المسار المستقر. وإذا قام npm بحل أيٍّ منهما إلى إصدار تجريبي مسبق، فسيتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام وسم prerelease مثل `@beta`/`@rc` أو إصدار prerelease مطابق تمامًا مثل `@1.2.3-beta.4`.

إذا طابقت مواصفة تثبيت مجرّدة معرّف Plugin مضمّنًا (مثل `diffs`)، فسيثبّت OpenClaw Plugin المضمّن مباشرةً. ولتثبيت حزمة npm تحمل الاسم نفسه، استخدم مواصفة نطاق صريحة (مثل `@scope/diffs`).

الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`.

كما أن عمليات التثبيت من Claude marketplace مدعومة أيضًا.

تستخدم عمليات التثبيت من ClawHub محددًا صريحًا على هيئة `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

يفضّل OpenClaw الآن أيضًا ClawHub عند استخدام مواصفات Plugin المجرّدة الآمنة لـ npm. ولا يعود إلى npm إلا إذا لم يكن ذلك package أو الإصدار موجودًا في ClawHub:

```bash
openclaw plugins install openclaw-codex-app-server
```

يقوم OpenClaw بتنزيل أرشيف الحزمة من ClawHub، ويتحقق من توافق Plugin API المعلَن / الحد الأدنى لتوافق Gateway، ثم يثبّته عبر مسار الأرشيف العادي. وتحتفظ عمليات التثبيت المسجّلة ببيانات مصدر ClawHub الوصفية من أجل التحديثات اللاحقة.

استخدم الصيغة المختصرة `plugin@marketplace` عندما يكون اسم marketplace موجودًا في ذاكرة التخزين المحلية لسجل Claude في `~/.claude/plugins/known_marketplaces.json`:

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

- اسم marketplace معروفًا لدى Claude من `~/.claude/plugins/known_marketplaces.json`
- جذر marketplace محليًا أو مسار `marketplace.json`
- اختصار مستودع GitHub مثل `owner/repo`
- عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
- عنوان URL لـ git

بالنسبة إلى marketplaces البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع marketplace المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin من النوع HTTP(S) أو المسار المطلق أو git أو GitHub أو غيرها من المصادر غير المسارية القادمة من البيانات البعيدة.

بالنسبة إلى المسارات المحلية والأرشيفات، يكتشف OpenClaw تلقائيًا:

- مكونات OpenClaw الإضافية الأصلية (`openclaw.plugin.json`)
- الحِزم المتوافقة مع Codex (`.codex-plugin/plugin.json`)
- الحِزم المتوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- الحِزم المتوافقة مع Cursor (`.cursor-plugin/plugin.json`)

تُثبَّت الحِزم المتوافقة داخل جذر Plugin العادي وتشارك في تدفق `list/info/enable/disable` نفسه. حاليًا، تُدعَم Skills الخاصة بالحِزم، وClaude command-skills، والقيم الافتراضية لـ Claude `settings.json`، والقيم الافتراضية لـ Claude `.lsp.json` / `lspServers` المعلنة في البيان، وCursor command-skills، وأدلة خطافات Codex المتوافقة؛ أمّا قدرات الحِزم المكتشفة الأخرى فتُعرض في التشخيصات/المعلومات لكنها ليست موصولة بعد بتنفيذ وقت التشغيل.

### القائمة

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

استخدم `--enabled` لعرض المكونات الإضافية المحمّلة فقط. واستخدم `--verbose` للانتقال من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات المصدر/المنشأ/الإصدار/التفعيل. واستخدم `--json` للحصول على جرد قابل للقراءة الآلية بالإضافة إلى تشخيصات السجل.

ينفّذ `plugins list` الاكتشاف من بيئة CLI والإعداد الحاليين. وهو مفيد للتحقق مما إذا كان Plugin ممكّنًا/قابلًا للتحميل، لكنه ليس فحصًا حيًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير شيفرة Plugin أو حالة التمكين أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل شيفرة `register(api)` الجديدة أو الخطافات. وبالنسبة إلى عمليات النشر البعيدة/داخل الحاويات، تحقّق من أنك تعيد تشغيل العملية الفرعية الفعلية لـ `openclaw gateway run`، وليس مجرد عملية غلاف.

لتصحيح أخطاء الخطافات في وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --json` الخطافات المسجّلة والتشخيصات من تمريرة فحص مع تحميل الوحدة.
- يؤكد `openclaw gateway status --deep --require-rpc` Gateway القابل للوصول، وتلميحات الخدمة/العملية، ومسار الإعداد، وصحة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input` و`llm_output` و`agent_end`) القيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

لا يُدعَم `--force` مع `--link` لأن عمليات التثبيت المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في عمليات تثبيت npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في `plugins.installs` مع الإبقاء على السلوك الافتراضي غير المثبّت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يقوم `uninstall` بإزالة سجلات Plugin من `plugins.entries` و`plugins.installs` وقائمة السماح الخاصة بالمكونات الإضافية وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. وبالنسبة إلى مكونات الذاكرة Active Memory الإضافية، تعود خانة الذاكرة إلى `memory-core`.

افتراضيًا، يزيل إلغاء التثبيت أيضًا دليل تثبيت Plugin ضمن جذر Plugin الخاص بدليل الحالة النشط. استخدم `--keep-files` للاحتفاظ بالملفات على القرص.

الوسيطة `--keep-config` مدعومة باعتبارها اسمًا مستعارًا مهملًا لـ `--keep-files`.

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تُطبَّق التحديثات على عمليات التثبيت المتعقبة في `plugins.installs` وعلى عمليات تثبيت حِزم الخطافات المتعقبة في `hooks.internal.installs`.

عند تمرير معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجّلة لذلك Plugin. وهذا يعني أن وسوم dist-tags المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبّتة تستمر في الاستخدام في عمليات `update <id>` اللاحقة.

في عمليات تثبيت npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع dist-tag أو إصدار مطابق تمامًا. يحل OpenClaw اسم تلك الحزمة مرة أخرى إلى سجل Plugin المتعقَّب، ويحدّث ذلك Plugin المثبّت، ويسجّل مواصفة npm الجديدة من أجل التحديثات المستقبلية المعتمدة على المعرّف.

كما أن تمرير اسم حزمة npm من دون إصدار أو وسم يعيد أيضًا الحل إلى سجل Plugin المتعقَّب. استخدم ذلك عندما يكون Plugin مثبّتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

قبل تحديث npm فعليًا، يتحقق OpenClaw من إصدار الحزمة المثبّتة مقارنةً ببيانات npm الوصفية في السجل. وإذا كان إصدار الحزمة المثبّتة وهوية العنصر المسجّلة يطابقان الهدف المحلول بالفعل، فيُتخطّى التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

عند وجود قيمة hash للتكامل محفوظة وتغيّر hash للعنصر الذي تم جلبه،
يعامل OpenClaw ذلك على أنه انجراف في عنصر npm. يطبع الأمر التفاعلي
`openclaw plugins update` قيمتَي hash المتوقعة والفعلية ويطلب
التأكيد قبل المتابعة. أمّا أدوات التحديث غير التفاعلية فتفشل بشكل مغلق
ما لم يوفّر المستدعي سياسة متابعة صريحة.

يتوفر `--dangerously-force-unsafe-install` أيضًا مع `plugins update` بوصفه
تجاوزًا للطوارئ في حالات الإيجابيات الكاذبة ضمن فحص الشيفرة الخطرة المدمج أثناء
تحديثات Plugin. ومع ذلك، فهو لا يتجاوز حظر سياسة `before_install` الخاصة بـ Plugin
ولا حظر فشل الفحص، كما أنه ينطبق فقط على تحديثات Plugin، وليس على تحديثات
حِزم الخطافات.

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

فحص عميق لمكون إضافي واحد. يعرض الهوية، وحالة التحميل، والمصدر،
والقدرات المسجّلة، والخطافات، والأدوات، والأوامر، والخدمات، وطرائق Gateway،
ومسارات HTTP، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وقدرات الحِزم،
وأي دعم مكتشف لخوادم MCP أو LSP.

يُصنَّف كل Plugin بحسب ما يسجّله فعليًا في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin خاص بموفر فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — خطافات فقط، من دون قدرات أو واجهات
- **non-capability** — أدوات/أوامر/خدمات لكن من دون قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات حول نموذج القدرات.

تُخرج الوسيطة `--json` تقريرًا قابلًا للقراءة الآلية ومناسبًا للبرمجة النصية
والتدقيق.

يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن أعمدة للشكل، وأنواع القدرات،
وملاحظات التوافق، وقدرات الحِزم، وملخص الخطافات.

`info` هو اسم مستعار لـ `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

يعرض `doctor` أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وملاحظات
التوافق. وعندما يكون كل شيء سليمًا يطبع `No plugin issues
detected.`

في حالات فشل شكل الوحدة، مثل غياب الصادرات `register`/`activate`، أعد التشغيل
مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في
المخرجات التشخيصية.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

يقبل عرض marketplace مسار marketplace محليًا، أو مسار `marketplace.json`، أو
اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. تقوم `--json`
بطباعة تسمية المصدر المحلولة بالإضافة إلى بيان marketplace المحلَّل
وإدخالات Plugin.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [بناء المكونات الإضافية](/ar/plugins/building-plugins)
- [المكونات الإضافية المجتمعية](/ar/plugins/community)
