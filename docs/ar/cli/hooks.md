---
read_when:
    - تريد إدارة خطافات الوكيل
    - تريد فحص توفر الخطافات أو تمكين خطافات مساحة العمل
summary: مرجع CLI لـ `openclaw hooks` (خطافات الوكيل)
title: الخطافات
x-i18n:
    generated_at: "2026-04-23T07:22:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

إدارة خطافات الوكيل (أتمتات مدفوعة بالأحداث لأوامر مثل `/new` و`/reset` وبدء Gateway).

يُعادِل تشغيل `openclaw hooks` من دون أمر فرعي تشغيل `openclaw hooks list`.

ذو صلة:

- الخطافات: [Hooks](/ar/automation/hooks)
- خطافات Plugin: [Plugin hooks](/ar/plugins/architecture#provider-runtime-hooks)

## عرض جميع الخطافات

```bash
openclaw hooks list
```

يعرض جميع الخطافات المكتشفة من أدلة مساحة العمل، والمُدارة، والإضافية، والمضمّنة.
لا يحمّل بدء Gateway معالجات الخطافات الداخلية حتى يتم ضبط خطاف داخلي واحد على الأقل.

**الخيارات:**

- `--eligible`: عرض الخطافات المؤهلة فقط (التي استوفت المتطلبات)
- `--json`: الإخراج بصيغة JSON
- `-v, --verbose`: عرض معلومات تفصيلية بما في ذلك المتطلبات المفقودة

**مثال على الإخراج:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - تشغيل BOOT.md عند بدء Gateway
  📎 bootstrap-extra-files ✓ - حقن ملفات bootstrap إضافية لمساحة العمل أثناء bootstrap الوكيل
  📝 command-logger ✓ - تسجيل جميع أحداث الأوامر في ملف تدقيق مركزي
  💾 session-memory ✓ - حفظ سياق الجلسة في الذاكرة عند إصدار الأمر /new أو /reset
```

**مثال (مفصّل):**

```bash
openclaw hooks list --verbose
```

يعرض المتطلبات المفقودة للخطافات غير المؤهلة.

**مثال (JSON):**

```bash
openclaw hooks list --json
```

يعيد JSON منظّمًا للاستخدام البرمجي.

## الحصول على معلومات خطاف

```bash
openclaw hooks info <name>
```

يعرض معلومات تفصيلية عن خطاف محدد.

**الوسائط:**

- `<name>`: اسم الخطاف أو مفتاحه (مثل `session-memory`)

**الخيارات:**

- `--json`: الإخراج بصيغة JSON

**مثال:**

```bash
openclaw hooks info session-memory
```

**الإخراج:**

```
💾 session-memory ✓ جاهز

حفظ سياق الجلسة في الذاكرة عند إصدار الأمر /new أو /reset

التفاصيل:
  المصدر: openclaw-bundled
  المسار: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  المعالج: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  الصفحة الرئيسية: https://docs.openclaw.ai/automation/hooks#session-memory
  الأحداث: command:new, command:reset

المتطلبات:
  الإعداد: ✓ workspace.dir
```

## التحقق من أهلية الخطافات

```bash
openclaw hooks check
```

يعرض ملخصًا لحالة أهلية الخطافات (عدد الخطافات الجاهزة مقابل غير الجاهزة).

**الخيارات:**

- `--json`: الإخراج بصيغة JSON

**مثال على الإخراج:**

```
حالة الخطافات

إجمالي الخطافات: 4
جاهزة: 4
غير جاهزة: 0
```

## تمكين خطاف

```bash
openclaw hooks enable <name>
```

يمكّن خطافًا محددًا عبر إضافته إلى الإعداد الخاص بك (`~/.openclaw/openclaw.json` افتراضيًا).

**ملاحظة:** تكون خطافات مساحة العمل معطّلة افتراضيًا إلى أن يتم تمكينها هنا أو في الإعداد. تُظهر الخطافات المُدارة بواسطة Plugins القيمة `plugin:<id>` في `openclaw hooks list` ولا يمكن تمكينها/تعطيلها هنا. قم بتمكين/تعطيل Plugin بدلًا من ذلك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثل `session-memory`)

**مثال:**

```bash
openclaw hooks enable session-memory
```

**الإخراج:**

```
✓ تم تمكين الخطاف: 💾 session-memory
```

**ما الذي يفعله:**

- يتحقق مما إذا كان الخطاف موجودًا ومؤهلًا
- يحدّث `hooks.internal.entries.<name>.enabled = true` في الإعداد الخاص بك
- يحفظ الإعداد على القرص

إذا كان الخطاف يأتي من `<workspace>/hooks/`، فإن خطوة الاشتراك هذه مطلوبة قبل
أن يحمّله Gateway.

**بعد التمكين:**

- أعد تشغيل Gateway حتى تُعاد تحميل الخطافات (إعادة تشغيل تطبيق شريط القوائم على macOS، أو إعادة تشغيل عملية Gateway في التطوير).

## تعطيل خطاف

```bash
openclaw hooks disable <name>
```

يعطّل خطافًا محددًا عبر تحديث الإعداد الخاص بك.

**الوسائط:**

- `<name>`: اسم الخطاف (مثل `command-logger`)

**مثال:**

```bash
openclaw hooks disable command-logger
```

**الإخراج:**

```
⏸ تم تعطيل الخطاف: 📝 command-logger
```

**بعد التعطيل:**

- أعد تشغيل Gateway حتى تُعاد تحميل الخطافات

## ملاحظات

- يكتب `openclaw hooks list --json` و`info --json` و`check --json` JSON منظّمًا مباشرة إلى stdout.
- لا يمكن تمكين الخطافات المُدارة بواسطة Plugins أو تعطيلها هنا؛ قم بتمكين أو تعطيل Plugin المالك بدلًا من ذلك.

## تثبيت حزم الخطافات

```bash
openclaw plugins install <package>        # ClawHub أولًا، ثم npm
openclaw plugins install <package> --pin  # تثبيت الإصدار
openclaw plugins install <path>           # مسار محلي
```

ثبّت حزم الخطافات عبر مُثبّت Plugins الموحّد.

لا يزال `openclaw hooks install` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير إيقاف استخدام ويوجّه إلى `openclaw plugins install`.

تكون مواصفات npm **خاصة بالسجل فقط** (اسم الحزمة مع **إصدار مطابق تمامًا** اختياري أو
**dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. وتعمل عمليات تثبيت
التبعيات مع `--ignore-scripts` لأسباب تتعلق بالأمان.

تبقى المواصفات المجردة و`@latest` على المسار المستقر. وإذا حلّت npm أيًا منهما
إلى إصدار prerelease، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام
وسم prerelease مثل `@beta`/`@rc` أو إصدار prerelease مطابق تمامًا.

**ما الذي يفعله:**

- ينسخ حزمة الخطافات إلى `~/.openclaw/hooks/<id>`
- يمكّن الخطافات المثبّتة في `hooks.internal.entries.*`
- يسجّل التثبيت تحت `hooks.internal.installs`

**الخيارات:**

- `-l, --link`: ربط دليل محلي بدلًا من نسخه (يضيفه إلى `hooks.internal.load.extraDirs`)
- `--pin`: تسجيل عمليات تثبيت npm على أنها `name@version` محلولة بدقة في `hooks.internal.installs`

**الأرشيفات المدعومة:** `.zip` و`.tgz` و`.tar.gz` و`.tar`

**أمثلة:**

```bash
# دليل محلي
openclaw plugins install ./my-hook-pack

# أرشيف محلي
openclaw plugins install ./my-hook-pack.zip

# حزمة NPM
openclaw plugins install @openclaw/my-hook-pack

# ربط دليل محلي من دون نسخه
openclaw plugins install -l ./my-hook-pack
```

تُعامل حزم الخطافات المرتبطة على أنها خطافات مُدارة من دليل
يضبطه المشغّل، وليست كخطافات مساحة عمل.

## تحديث حزم الخطافات

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

حدّث حزم الخطافات المتعقَّبة المعتمدة على npm عبر محدّث Plugins الموحّد.

لا يزال `openclaw hooks update` يعمل كاسم بديل للتوافق، لكنه يطبع
تحذير إيقاف استخدام ويوجّه إلى `openclaw plugins update`.

**الخيارات:**

- `--all`: تحديث جميع حزم الخطافات المتعقَّبة
- `--dry-run`: عرض ما الذي سيتغير من دون كتابة

عندما توجد قيمة hash سلامة مخزنة ويتغير hash العنصر الذي تم جلبه،
يطبع OpenClaw تحذيرًا ويطلب التأكيد قبل المتابعة. استخدم
الخيار العام `--yes` لتجاوز المطالبات في تشغيلات CI/غير التفاعلية.

## الخطافات المضمّنة

### session-memory

يحفظ سياق الجلسة في الذاكرة عند إصدار `/new` أو `/reset`.

**التمكين:**

```bash
openclaw hooks enable session-memory
```

**الإخراج:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**راجع:** [توثيق session-memory](/ar/automation/hooks#session-memory)

### bootstrap-extra-files

يحقن ملفات bootstrap إضافية (مثل `AGENTS.md` / `TOOLS.md` المحلية في monorepo) أثناء `agent:bootstrap`.

**التمكين:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**راجع:** [توثيق bootstrap-extra-files](/ar/automation/hooks#bootstrap-extra-files)

### command-logger

يسجّل جميع أحداث الأوامر في ملف تدقيق مركزي.

**التمكين:**

```bash
openclaw hooks enable command-logger
```

**الإخراج:** `~/.openclaw/logs/commands.log`

**عرض السجلات:**

```bash
# الأوامر الأخيرة
tail -n 20 ~/.openclaw/logs/commands.log

# تنسيق جميل
cat ~/.openclaw/logs/commands.log | jq .

# التصفية حسب الإجراء
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**راجع:** [توثيق command-logger](/ar/automation/hooks#command-logger)

### boot-md

يشغّل `BOOT.md` عند بدء Gateway (بعد بدء القنوات).

**الأحداث**: `gateway:startup`

**التمكين**:

```bash
openclaw hooks enable boot-md
```

**راجع:** [توثيق boot-md](/ar/automation/hooks#boot-md)
