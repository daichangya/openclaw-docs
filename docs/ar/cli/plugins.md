---
read_when:
    - تريد تثبيت أو إدارة Plugins الخاصة بـ Gateway أو الحِزم المتوافقة.
    - تريد تصحيح أخطاء فشل تحميل Plugin.
summary: مرجع CLI لـ `openclaw plugins` (`list` و`install` و`marketplace` و`uninstall` و`enable/disable` و`doctor`)
title: plugins
x-i18n:
    generated_at: "2026-04-23T13:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

إدارة Plugins الخاصة بـ Gateway، وحِزم الخطافات، والحِزم المتوافقة.

ذو صلة:

- نظام Plugin: [Plugins](/ar/tools/plugin)
- توافق الحِزم: [حِزم Plugin](/ar/plugins/bundles)
- بيان Plugin والمخطط: [بيان Plugin](/ar/plugins/manifest)
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

تأتي Plugins المضمّنة مع OpenClaw. يكون بعضها مفعّلًا افتراضيًا (على سبيل المثال
موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح
المضمّن)؛ بينما يتطلب البعض الآخر `plugins enable`.

يجب أن تتضمن Plugins الأصلية الخاصة بـ OpenClaw ملف `openclaw.plugin.json` مع
JSON Schema مضمن (`configSchema`، حتى لو كان فارغًا). أما الحِزم المتوافقة
فتستخدم بيانات الحزمة الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما يعرض خرج
القائمة/المعلومات المفصل النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`)
إضافة إلى قدرات الحزمة المكتشفة.

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

تُفحص أسماء الحِزم المجردة في ClawHub أولًا، ثم npm. ملاحظة أمنية:
تعامل مع تثبيت Plugins كما لو كنت تشغّل شيفرة. ويُفضّل استخدام إصدارات مثبّتة.

إذا كان القسم `plugins` لديك يستند إلى `$include` أحادي الملف، فإن
`plugins install/update/enable/disable/uninstall` تكتب في ذلك الملف المضمّن
وتترك `openclaw.json` دون تعديل. وتفشل تضمينات الجذر، ومصفوفات التضمين،
والتضمينات التي تحتوي على تجاوزات مجاورة بشكل مغلق بدلًا من تسطيحها.
راجع [تضمينات التكوين](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

إذا كان التكوين غير صالح، فإن `plugins install` يفشل عادة بشكل مغلق ويطلب منك
تشغيل `openclaw doctor --fix` أولًا. والاستثناء الموثق الوحيد هو مسار
استرداد ضيق لPlugin مضمّن يختاره صراحةً
`openclaw.install.allowInvalidConfigRecovery`.

يعيد `--force` استخدام هدف التثبيت الحالي ويكتب فوق Plugin أو حزمة خطافات
مثبتة مسبقًا في مكانها. استخدمه عندما تكون بصدد إعادة تثبيت
المعرّف نفسه عمدًا من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو
مكوّن npm. أما للترقيات الاعتيادية لـ Plugin npm متتبَّع مسبقًا، ففضّل
`openclaw plugins update <id-or-npm-spec>`.

إذا شغّلت `plugins install` لمعرّف Plugin مثبت بالفعل، فإن OpenClaw
يتوقف ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية المعتادة،
أو إلى `plugins install <package> --force` عندما تريد فعلًا الكتابة فوق
التثبيت الحالي من مصدر مختلف.

ينطبق `--pin` على تثبيتات npm فقط. وهو غير مدعوم مع `--marketplace`،
لأن تثبيتات marketplace تحفظ بيانات مصدر marketplace بدلًا من
مواصفة npm.

يُعد `--dangerously-force-unsafe-install` خيار كسر زجاج للطوارئ عند
النتائج الإيجابية الكاذبة في ماسح الشيفرة الخطرة المضمّن. فهو يسمح
للتثبيت بالمتابعة حتى عندما يبلغ الماسح المضمّن عن نتائج `critical`،
لكنه **لا** يتجاوز كتل سياسة الخطاف `before_install` الخاصة بالـ Plugin،
ولا يتجاوز أيضًا حالات فشل الفحص.

تنطبق راية CLI هذه على تدفقات تثبيت/تحديث Plugin. أما تثبيتات تبعيات Skills
المدعومة من Gateway فتستخدم تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`،
بينما يظل `openclaw skills install` تدفق تنزيل/تثبيت Skills من ClawHub
منفصلًا.

يُعد `plugins install` أيضًا واجهة التثبيت لحِزم الخطافات التي تعرض
`openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لعرض الخطافات
المصفّى وتمكين كل خطاف على حدة، وليس لتثبيت الحزمة.

تقتصر مواصفات npm على **السجل فقط** (اسم الحزمة مع **إصدار مطابق تمامًا** اختياري
أو **dist-tag**). ويتم رفض مواصفات Git/URL/file ونطاقات semver.
وتُشغَّل تثبيتات التبعيات باستخدام `--ignore-scripts` من أجل الأمان.

تظل المواصفات المجردة و`@latest` على مسار الإصدارات المستقرة. وإذا قام npm بحل
أيٍّ منهما إلى إصدار prerelease، فإن OpenClaw يتوقف ويطلب منك الموافقة
الصريحة باستخدام وسم prerelease مثل `@beta`/`@rc` أو إصدار prerelease
مطابق مثل `@1.2.3-beta.4`.

إذا طابقت مواصفة تثبيت مجردة معرّف Plugin مضمّنًا (مثل `diffs`)، فسيقوم OpenClaw
بتثبيت Plugin المضمّن مباشرة. ولتثبيت حزمة npm بالاسم نفسه، استخدم
مواصفة ذات نطاق صريحة (مثل `@scope/diffs`).

الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`.

تُدعَم أيضًا تثبيتات Claude marketplace.

تستخدم تثبيتات ClawHub محدِّدًا صريحًا بصيغة `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

يفضّل OpenClaw الآن أيضًا ClawHub لمواصفات Plugin المجردة والآمنة المتوافقة مع npm.
ولا يعود إلى npm إلا إذا لم تكن تلك الحزمة أو ذلك الإصدار موجودًا في ClawHub:

```bash
openclaw plugins install openclaw-codex-app-server
```

يقوم OpenClaw بتنزيل أرشيف الحزمة من ClawHub، ويفحص توافق واجهة برمجة Plugin /
الحد الأدنى من توافق Gateway المعلن، ثم يثبتها عبر مسار
الأرشيف المعتاد. وتحتفظ التثبيتات المسجلة ببيانات مصدر ClawHub الوصفية
لأجل التحديثات اللاحقة.

استخدم الصيغة المختصرة `plugin@marketplace` عندما يكون اسم marketplace موجودًا
في ذاكرة Claude المحلية للسجل ضمن `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

استخدم `--marketplace` عندما تريد تمرير مصدر marketplace بشكل صريح:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

يمكن أن تكون مصادر marketplace:

- اسم marketplace معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
- جذر marketplace محلي أو مسار `marketplace.json`
- صيغة مختصرة لمستودع GitHub مثل `owner/repo`
- URL لمستودع GitHub مثل `https://github.com/owner/repo`
- URL لـ git

بالنسبة إلى marketplaces البعيدة المحمّلة من GitHub أو git، يجب أن تبقى
إدخالات Plugin داخل مستودع marketplace المستنسخ. يقبل OpenClaw
مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugins من نوع HTTP(S)،
والمسارات المطلقة، وgit، وGitHub، وغيرها من المصادر غير المعتمدة على المسارات
من البيانات الوصفية البعيدة.

بالنسبة إلى المسارات المحلية والأرشيفات، يكتشف OpenClaw تلقائيًا:

- Plugins OpenClaw الأصلية (`openclaw.plugin.json`)
- الحِزم المتوافقة مع Codex (`.codex-plugin/plugin.json`)
- الحِزم المتوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط
  مكونات Claude الافتراضي)
- الحِزم المتوافقة مع Cursor (`.cursor-plugin/plugin.json`)

تُثبَّت الحِزم المتوافقة داخل جذر Plugin المعتاد وتشارك في
التدفق نفسه الخاص بـ list/info/enable/disable. حاليًا، تُدعَم Skills الخاصة بالحِزم،
وcommand-skills الخاصة بـ Claude، وقيم Claude الافتراضية في `settings.json`،
وقيم Claude الافتراضية في `.lsp.json` /
و`lspServers` المعلنة في البيان، وcommand-skills الخاصة بـ Cursor،
وأدلة الخطافات المتوافقة مع Codex؛ أما قدرات الحِزم المكتشفة الأخرى
فتُعرض في التشخيصات/المعلومات لكنها غير موصولة بعد بتنفيذ وقت التشغيل.

### العرض

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

استخدم `--enabled` لإظهار Plugins المحمّلة فقط. واستخدم `--verbose` للانتقال من
عرض الجدول إلى أسطر تفاصيل لكل Plugin مع بيانات المصدر/المنشأ/الإصدار/التفعيل.
واستخدم `--json` للحصول على جرد قابل للقراءة آليًا مع
تشخيصات السجل.

استخدم `--link` لتجنب نسخ دليل محلي (يضيف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

لا يُدعَم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام
مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في
`plugins.installs` مع الإبقاء على السلوك الافتراضي غير المثبّت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يقوم `uninstall` بإزالة سجلات Plugin من `plugins.entries` و`plugins.installs`،
وقائمة السماح الخاصة بالـ Plugin، وإدخالات `plugins.load.paths` المرتبطة
عند الاقتضاء. وبالنسبة إلى Plugins الخاصة بـ Active Memory، تُعاد فتحة الذاكرة إلى
`memory-core`.

افتراضيًا، يزيل إلغاء التثبيت أيضًا دليل تثبيت Plugin تحت
جذر Plugin الخاص بـ state-dir النشط. استخدم
`--keep-files` للإبقاء على الملفات على القرص.

يُدعَم `--keep-config` كاسم مستعار مهمل لـ `--keep-files`.

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على التثبيتات المتتبَّعة في `plugins.installs` وتثبيتات
حِزم الخطافات المتتبَّعة في `hooks.internal.installs`.

عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك
الـ Plugin. وهذا يعني أن dist-tags المخزنة سابقًا مثل `@beta` والإصدارات
المثبتة تمامًا تستمر في الاستخدام في عمليات `update <id>` اللاحقة.

بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة صريحة لحزمة npm مع dist-tag
أو إصدار مطابق. يحل OpenClaw اسم تلك الحزمة مرة أخرى إلى سجل Plugin المتتبَّع،
ويحدّث Plugin المثبت، ويسجل مواصفة npm الجديدة
لتحديثات المعرف المستقبلية.

إن تمرير اسم حزمة npm من دون إصدار أو وسم يعيد أيضًا الحل إلى
سجل Plugin المتتبَّع. استخدم ذلك عندما يكون Plugin مثبتًا على إصدار محدد تمامًا
وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

قبل تحديث npm فعلي، يفحص OpenClaw إصدار الحزمة المثبتة مقابل بيانات
سجل npm الوصفية. وإذا كان الإصدار المثبت وهوية
المكوّن المسجلة يطابقان الهدف المحلول بالفعل، يتم تخطي التحديث من دون
تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

عندما تكون قيمة hash سلامة مخزنة موجودة ويتغير hash المكوّن الذي جرى جلبه،
يعامل OpenClaw ذلك على أنه انجراف في مكوّن npm. ويقوم أمر
`openclaw plugins update` التفاعلي بطباعة hash المتوقع والفعلي ويطلب
التأكيد قبل المتابعة. أما مساعدات التحديث غير التفاعلية فتفشل بشكل مغلق
ما لم يزوّد المستدعي بسياسة متابعة صريحة.

يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كـ
تجاوز طوارئ عند النتائج الإيجابية الكاذبة في فحص الشيفرة الخطرة المضمّن أثناء
تحديثات Plugins. ومع ذلك، فهو لا يتجاوز كتل سياسة `before_install` الخاصة بالـ Plugin
ولا حظر فشل الفحص، كما أنه ينطبق فقط على تحديثات Plugins،
وليس على تحديثات حِزم الخطافات.

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

فحص عميق لـ Plugin واحد. يعرض الهوية، وحالة التحميل، والمصدر،
والقدرات المسجلة، والخطافات، والأدوات، والأوامر، والخدمات، وطرق Gateway،
ومسارات HTTP، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وقدرات الحزمة،
وأي دعم مكتشف لخوادم MCP أو LSP.

يُصنَّف كل Plugin بحسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin يقتصر على موفر فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — خطافات فقط، من دون قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن من دون قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات حول نموذج القدرات.

تُخرج الراية `--json` تقريرًا قابلًا للقراءة آليًا ومناسبًا للبرمجة النصية
والتدقيق.

يعرض `inspect --all` جدولًا على مستوى كامل المجموعة يتضمن أعمدة للشكل، وأنواع القدرات،
وملاحظات التوافق، وقدرات الحزمة، وملخص الخطافات.

`info` هو اسم مستعار لـ `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

يعرض `doctor` أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف،
وملاحظات التوافق. وعندما يكون كل شيء سليمًا يطبع `No plugin issues
detected.`

في حالات فشل شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل
مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في
مخرجات التشخيص.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

يقبل marketplace list مسار marketplace محليًا، أو مسار `marketplace.json`،
أو صيغة مختصرة لـ GitHub مثل `owner/repo`، أو URL لمستودع GitHub، أو URL لـ git.
وتطبع `--json` تسمية المصدر المحلولة بالإضافة إلى بيان marketplace المحلَّل
وإدخالات Plugin.
