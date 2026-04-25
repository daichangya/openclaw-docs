---
read_when:
    - تريد إدارة خطافات الوكيل
    - تريد فحص توفر الخطافات أو تمكين خطافات مساحة العمل
summary: مرجع CLI لـ `openclaw hooks` (خطافات الوكيل)
title: الخطافات
x-i18n:
    generated_at: "2026-04-25T13:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

إدارة خطافات الوكيل (عمليات أتمتة معتمدة على الأحداث لأوامر مثل `/new` و`/reset` وبدء تشغيل gateway).

يُعادل تشغيل `openclaw hooks` بدون أمر فرعي تشغيل `openclaw hooks list`.

ذو صلة:

- الخطافات: [Hooks](/ar/automation/hooks)
- خطافات Plugin: [Plugin hooks](/ar/plugins/hooks)

## سرد جميع الخطافات

```bash
openclaw hooks list
```

يسرد جميع الخطافات المكتشفة من أدلة مساحة العمل، والأدلة المُدارة، والإضافية، والمضمنة.
لا يحمّل بدء تشغيل Gateway معالجات الخطافات الداخلية حتى يتم تكوين خطاف داخلي واحد على الأقل.

**الخيارات:**

- `--eligible`: إظهار الخطافات المؤهلة فقط (المتطلبات مستوفاة)
- `--json`: إخراج بصيغة JSON
- `-v, --verbose`: إظهار معلومات تفصيلية بما في ذلك المتطلبات المفقودة

**مثال على الخرج:**

```text
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**مثال (verbose):**

```bash
openclaw hooks list --verbose
```

يعرض المتطلبات المفقودة للخطافات غير المؤهلة.

**مثال (JSON):**

```bash
openclaw hooks list --json
```

يعيد JSON منظمًا للاستخدام البرمجي.

## الحصول على معلومات الخطاف

```bash
openclaw hooks info <name>
```

اعرض معلومات تفصيلية عن خطاف محدد.

**الوسيطات:**

- `<name>`: اسم الخطاف أو مفتاح الخطاف (مثل `session-memory`)

**الخيارات:**

- `--json`: إخراج بصيغة JSON

**مثال:**

```bash
openclaw hooks info session-memory
```

**الخرج:**

```text
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## التحقق من أهلية الخطافات

```bash
openclaw hooks check
```

اعرض ملخصًا لحالة أهلية الخطافات (عدد الجاهز منها مقابل غير الجاهز).

**الخيارات:**

- `--json`: إخراج بصيغة JSON

**مثال على الخرج:**

```text
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## تمكين خطاف

```bash
openclaw hooks enable <name>
```

مكّن خطافًا محددًا بإضافته إلى إعدادك (`~/.openclaw/openclaw.json` افتراضيًا).

**ملاحظة:** تكون خطافات مساحة العمل معطلة افتراضيًا حتى يتم تمكينها هنا أو في الإعداد. تعرض الخطافات المُدارة بواسطة Plugins القيمة `plugin:<id>` في `openclaw hooks list` ولا يمكن تمكينها/تعطيلها هنا. قم بتمكين/تعطيل Plugin بدلًا من ذلك.

**الوسيطات:**

- `<name>`: اسم الخطاف (مثل `session-memory`)

**مثال:**

```bash
openclaw hooks enable session-memory
```

**الخرج:**

```text
✓ Enabled hook: 💾 session-memory
```

**ما الذي يفعله:**

- يتحقق مما إذا كان الخطاف موجودًا ومؤهلًا
- يحدّث `hooks.internal.entries.<name>.enabled = true` في إعدادك
- يحفظ الإعداد على القرص

إذا كان الخطاف قادمًا من `<workspace>/hooks/`، فخطوة الاشتراك هذه مطلوبة قبل
أن يحمّله Gateway.

**بعد التمكين:**

- أعد تشغيل gateway حتى تُعاد تحميل الخطافات (إعادة تشغيل تطبيق شريط القوائم على macOS، أو إعادة تشغيل عملية gateway في بيئة التطوير).

## تعطيل خطاف

```bash
openclaw hooks disable <name>
```

عطّل خطافًا محددًا عبر تحديث إعدادك.

**الوسيطات:**

- `<name>`: اسم الخطاف (مثل `command-logger`)

**مثال:**

```bash
openclaw hooks disable command-logger
```

**الخرج:**

```text
⏸ Disabled hook: 📝 command-logger
```

**بعد التعطيل:**

- أعد تشغيل gateway حتى تُعاد تحميل الخطافات

## ملاحظات

- تكتب الأوامر `openclaw hooks list --json` و`info --json` و`check --json` بيانات JSON منظمة مباشرة إلى stdout.
- لا يمكن تمكين الخطافات المُدارة بواسطة Plugin أو تعطيلها هنا؛ قم بتمكين أو تعطيل Plugin المالك بدلًا من ذلك.

## تثبيت حزم الخطافات

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

ثبّت حزم الخطافات من خلال مُثبّت Plugins الموحّد.

لا يزال `openclaw hooks install` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير إهمال ويوجّه التنفيذ إلى `openclaw plugins install`.

تقتصر مواصفات npm على **السجل فقط** (اسم الحزمة مع **نسخة دقيقة** اختيارية أو
**dist-tag**). يتم رفض مواصفات Git/URL/file ونطاقات semver. تعمل عمليات
تثبيت التبعيات مع `--ignore-scripts` لأسباب تتعلق بالسلامة.

تظل المواصفات المجردة و`@latest` على المسار المستقر. إذا قام npm بحل أي منهما
إلى إصدار prerelease، فسيتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام
وسم prerelease مثل `@beta`/`@rc` أو نسخة prerelease دقيقة.

**ما الذي يفعله:**

- ينسخ حزمة الخطافات إلى `~/.openclaw/hooks/<id>`
- يمكّن الخطافات المثبتة في `hooks.internal.entries.*`
- يسجل التثبيت تحت `hooks.internal.installs`

**الخيارات:**

- `-l, --link`: ربط دليل محلي بدلًا من نسخه (يضيفه إلى `hooks.internal.load.extraDirs`)
- `--pin`: تسجيل عمليات تثبيت npm بصيغة `name@version` الدقيقة المحلولة في `hooks.internal.installs`

**الأرشيفات المدعومة:** `.zip` و`.tgz` و`.tar.gz` و`.tar`

**أمثلة:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

تُعامل حزم الخطافات المرتبطة كخطافات مُدارة من دليل قام المشغّل بتكوينه،
وليس كخطافات مساحة عمل.

## تحديث حزم الخطافات

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

حدّث حزم الخطافات المستندة إلى npm والمتتبعة من خلال محدّث Plugins الموحّد.

لا يزال `openclaw hooks update` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير إهمال ويوجّه التنفيذ إلى `openclaw plugins update`.

**الخيارات:**

- `--all`: تحديث جميع حزم الخطافات المتتبعة
- `--dry-run`: عرض ما الذي سيتغير من دون كتابة

عندما تكون هناك قيمة hash سلامة مخزنة ويتغير hash العنصر الذي تم جلبه،
يطبع OpenClaw تحذيرًا ويطلب تأكيدًا قبل المتابعة. استخدم الخيار العام `--yes`
لتجاوز المطالبات في تشغيلات CI/غير التفاعلية.

## الخطافات المضمنة

### session-memory

يحفظ سياق الجلسة في الذاكرة عند إصدار `/new` أو `/reset`.

**التمكين:**

```bash
openclaw hooks enable session-memory
```

**الخرج:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**راجع:** [توثيق session-memory](/ar/automation/hooks#session-memory)

### bootstrap-extra-files

يحقن ملفات تهيئة إضافية (مثل `AGENTS.md` / `TOOLS.md` المحلية في monorepo) أثناء `agent:bootstrap`.

**التمكين:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**راجع:** [توثيق bootstrap-extra-files](/ar/automation/hooks#bootstrap-extra-files)

### command-logger

يسجل جميع أحداث الأوامر في ملف تدقيق مركزي.

**التمكين:**

```bash
openclaw hooks enable command-logger
```

**الخرج:** `~/.openclaw/logs/commands.log`

**عرض السجلات:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**راجع:** [توثيق command-logger](/ar/automation/hooks#command-logger)

### boot-md

يشغّل `BOOT.md` عند بدء تشغيل gateway (بعد بدء القنوات).

**الأحداث**: `gateway:startup`

**التمكين**:

```bash
openclaw hooks enable boot-md
```

**راجع:** [توثيق boot-md](/ar/automation/hooks#boot-md)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [خطافات الأتمتة](/ar/automation/hooks)
