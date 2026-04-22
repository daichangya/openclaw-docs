---
read_when:
    - تقديم ClawHub للمستخدمين الجدد
    - تثبيت Skills أو Plugins أو البحث عنها أو نشرها
    - شرح أعلام CLI الخاصة بـ ClawHub وسلوك المزامنة
summary: 'دليل ClawHub: السجل العام، وتدفقات التثبيت الأصلية في OpenClaw، وتدفقات عمل CLI الخاصة بـ ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:29:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub هو السجل العام لـ **Skills وPlugins الخاصة بـ OpenClaw**.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت
  Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` عندما تحتاج إلى مصادقة السجل أو النشر أو الحذف أو إلغاء الحذف أو تدفقات عمل المزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## تدفقات OpenClaw الأصلية

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

تتم أيضًا تجربة مواصفات Plugin الآمنة في npm من دون بادئة أولًا مع ClawHub قبل npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

تثبّت أوامر `openclaw` الأصلية داخل مساحة العمل النشطة لديك وتُبقي بيانات
التعريف الخاصة بالمصدر بحيث يمكن لاستدعاءات `update` اللاحقة أن تبقى على ClawHub.

تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و`minGatewayVersion`
المعلنَين قبل تشغيل تثبيت الأرشيف، بحيث تفشل المضيفات غير المتوافقة
بشكل مغلق ومبكر بدلًا من تثبيت الحزمة جزئيًا.

لا يقبل `openclaw plugins install clawhub:...` إلا عائلات Plugins القابلة للتثبيت.
إذا كانت حزمة ClawHub في الواقع Skill، فسيتوقف OpenClaw ويوجهك إلى
`openclaw skills install <slug>` بدلًا من ذلك.

## ما هو ClawHub

- سجل عام لـ Skills وPlugins الخاصة بـ OpenClaw.
- مخزن مُدار بالإصدارات لحِزم Skills والبيانات الوصفية.
- سطح اكتشاف للبحث والوسوم وإشارات الاستخدام.

## كيف يعمل

1. ينشر مستخدم حزمة Skill (ملفات + بيانات وصفية).
2. يخزن ClawHub الحزمة، ويحلل البيانات الوصفية، ويعيّن إصدارًا.
3. يفهرس السجل Skill للبحث والاكتشاف.
4. يتصفح المستخدمون Skills وينزّلونها ويثبتونها في OpenClaw.

## ما الذي يمكنك فعله

- نشر Skills جديدة وإصدارات جديدة من Skills الحالية.
- اكتشاف Skills بالاسم أو الوسوم أو البحث.
- تنزيل حِزم Skills وفحص ملفاتها.
- الإبلاغ عن Skills المسيئة أو غير الآمنة.
- إذا كنت مشرفًا، يمكنك الإخفاء أو إلغاء الإخفاء أو الحذف أو الحظر.

## لمن هذا؟ (مناسب للمبتدئين)

إذا كنت تريد إضافة قدرات جديدة إلى وكيل OpenClaw الخاص بك، فإن ClawHub هو أسهل طريقة للعثور على Skills وتثبيتها. لا تحتاج إلى معرفة كيفية عمل الواجهة الخلفية. يمكنك:

- البحث عن Skills بلغة طبيعية.
- تثبيت Skill داخل مساحة عملك.
- تحديث Skills لاحقًا بأمر واحد.
- نسخ Skills الخاصة بك احتياطيًا عبر نشرها.

## بداية سريعة (غير تقنية)

1. ابحث عن شيء تحتاجه:
   - `openclaw skills search "calendar"`
2. ثبّت Skill:
   - `openclaw skills install <skill-slug>`
3. ابدأ جلسة OpenClaw جديدة حتى يلتقط Skill الجديدة.
4. إذا كنت تريد النشر أو إدارة مصادقة السجل، فثبّت أيضًا
   CLI المنفصل `clawhub`.

## تثبيت ClawHub CLI

أنت تحتاج إلى هذا فقط لتدفقات العمل التي تتطلب مصادقة السجل مثل النشر/المزامنة:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## كيف ينسجم مع OpenClaw

يقوم `openclaw skills install` الأصلي بالتثبيت داخل دليل `skills/`
في مساحة العمل النشطة. أما `openclaw plugins install clawhub:...` فيسجل
تثبيت Plugin مُدارًا عاديًا بالإضافة إلى بيانات تعريف مصدر ClawHub لأجل التحديثات.

كما أن عمليات تثبيت Plugin المجهولة من ClawHub تفشل بشكل مغلق للحزم الخاصة.
وما تزال القنوات المجتمعية أو غير الرسمية الأخرى قادرة على التثبيت، لكن OpenClaw يحذر
حتى يتمكن المشغّلون من مراجعة المصدر والتحقق قبل التفعيل.

يقوم CLI المنفصل `clawhub` أيضًا بتثبيت Skills داخل `./skills` ضمن
دليل العمل الحالي. وإذا كانت هناك مساحة عمل OpenClaw مهيأة، فإن `clawhub`
يعود إلى تلك المساحة ما لم تتجاوز ذلك عبر `--workdir` (أو
`CLAWHUB_WORKDIR`). يحمّل OpenClaw Skills مساحة العمل من `<workspace>/skills`
وسيلتقطها في الجلسة **التالية**. وإذا كنت تستخدم بالفعل
`~/.openclaw/skills` أو Skills المضمّنة، فإن Skills مساحة العمل تأخذ الأولوية.

لمزيد من التفاصيل حول كيفية تحميل Skills ومشاركتها وتقييدها، راجع
[Skills](/ar/tools/skills).

## نظرة عامة على نظام Skills

Skill هي حزمة مُدارة بالإصدارات من الملفات تعلّم OpenClaw كيفية تنفيذ
مهمة محددة. وكل عملية نشر تنشئ إصدارًا جديدًا، ويحتفظ السجل
بسجل الإصدارات حتى يتمكن المستخدمون من تدقيق التغييرات.

تتضمن Skill النموذجية عادةً:

- ملف `SKILL.md` يتضمن الوصف الأساسي وطريقة الاستخدام.
- إعدادات أو سكربتات أو ملفات داعمة اختيارية تستخدمها Skill.
- بيانات وصفية مثل الوسوم والملخص ومتطلبات التثبيت.

يستخدم ClawHub البيانات الوصفية لتشغيل الاكتشاف وإظهار قدرات Skill بأمان.
كما يتتبع السجل إشارات الاستخدام (مثل النجوم والتنزيلات) لتحسين
الترتيب والظهور.

## ما الذي توفره الخدمة (الميزات)

- **تصفح عام** للـ Skills ومحتوى `SKILL.md` الخاص بها.
- **بحث** مدعوم بالتضمينات embeddings (بحث متجهي)، وليس بالكلمات المفتاحية فقط.
- **إدارة الإصدارات** باستخدام semver وسجلات التغيير والوسوم (بما في ذلك `latest`).
- **تنزيلات** بصيغة zip لكل إصدار.
- **نجوم وتعليقات** لتغذية راجعة من المجتمع.
- **خطافات إدارة** للموافقات وعمليات التدقيق.
- **API صديقة لـ CLI** للأتمتة والسكربتات.

## الأمان والإشراف

ClawHub مفتوح افتراضيًا. يمكن لأي شخص رفع Skills، لكن يجب أن يكون حساب GitHub
عمره أسبوعًا واحدًا على الأقل للنشر. وهذا يساعد على إبطاء الإساءة من دون حظر
المساهمين الشرعيين.

الإبلاغ والإشراف:

- يمكن لأي مستخدم مسجل الدخول الإبلاغ عن Skill.
- أسباب الإبلاغ مطلوبة ويتم تسجيلها.
- يمكن لكل مستخدم امتلاك ما يصل إلى 20 بلاغًا نشطًا في الوقت نفسه.
- يتم إخفاء Skills التي لديها أكثر من 3 بلاغات فريدة تلقائيًا افتراضيًا.
- يمكن للمشرفين عرض Skills المخفية وإلغاء إخفائها أو حذفها أو حظر المستخدمين.
- قد يؤدي إساءة استخدام ميزة الإبلاغ إلى حظر الحساب.

هل تهتم بأن تصبح مشرفًا؟ اسأل في Discord الخاص بـ OpenClaw وتواصل مع
مشرف أو مسؤول صيانة.

## أوامر CLI والمعاملات

الخيارات العامة (تنطبق على جميع الأوامر):

- `--workdir <dir>`: دليل العمل (الافتراضي: الدليل الحالي؛ ويعود إلى مساحة عمل OpenClaw).
- `--dir <dir>`: دليل Skills، نسبةً إلى workdir (الافتراضي: `skills`).
- `--site <url>`: عنوان URL الأساسي للموقع (تسجيل الدخول عبر المتصفح).
- `--registry <url>`: عنوان URL الأساسي لـ API السجل.
- `--no-input`: تعطيل المطالبات (غير تفاعلي).
- `-V, --cli-version`: طباعة إصدار CLI.

المصادقة:

- `clawhub login` (تدفق عبر المتصفح) أو `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

الخيارات:

- `--token <token>`: لصق API token.
- `--label <label>`: التصنيف المخزن لرموز تسجيل الدخول عبر المتصفح (الافتراضي: `CLI token`).
- `--no-browser`: لا تفتح متصفحًا (يتطلب `--token`).

البحث:

- `clawhub search "query"`
- `--limit <n>`: أقصى عدد للنتائج.

التثبيت:

- `clawhub install <slug>`
- `--version <version>`: تثبيت إصدار محدد.
- `--force`: الكتابة فوق المجلد إذا كان موجودًا بالفعل.

التحديث:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: التحديث إلى إصدار محدد (Slug واحد فقط).
- `--force`: الكتابة فوق الملفات عندما لا تطابق الملفات المحلية أي إصدار منشور.

القائمة:

- `clawhub list` (يقرأ `.clawhub/lock.json`)

نشر Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: slug الخاص بـ Skill.
- `--name <name>`: اسم العرض.
- `--version <version>`: إصدار Semver.
- `--changelog <text>`: نص سجل التغيير (يمكن أن يكون فارغًا).
- `--tags <tags>`: وسوم مفصولة بفواصل (الافتراضي: `latest`).

نشر Plugins:

- `clawhub package publish <source>`
- يمكن أن يكون `<source>` مجلدًا محليًا، أو `owner/repo`، أو `owner/repo@ref`، أو عنوان URL على GitHub.
- `--dry-run`: بناء خطة النشر الدقيقة من دون رفع أي شيء.
- `--json`: إخراج قابل للقراءة آليًا لأجل CI.
- `--source-repo`، `--source-commit`، `--source-ref`: تجاوزات اختيارية عندما لا يكون الاكتشاف التلقائي كافيًا.

الحذف/إلغاء الحذف (للمالك/المشرف فقط):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

المزامنة (فحص Skills المحلية + نشر الجديدة/المحدّثة):

- `clawhub sync`
- `--root <dir...>`: جذور فحص إضافية.
- `--all`: رفع كل شيء من دون مطالبات.
- `--dry-run`: عرض ما الذي سيتم رفعه.
- `--bump <type>`: `patch|minor|major` للتحديثات (الافتراضي: `patch`).
- `--changelog <text>`: سجل التغيير للتحديثات غير التفاعلية.
- `--tags <tags>`: وسوم مفصولة بفواصل (الافتراضي: `latest`).
- `--concurrency <n>`: فحوصات السجل (الافتراضي: 4).

## تدفقات العمل الشائعة للوكلاء

### البحث عن Skills

```bash
clawhub search "postgres backups"
```

### تنزيل Skills جديدة

```bash
clawhub install my-skill-pack
```

### تحديث Skills المثبتة

```bash
clawhub update --all
```

### نسخ Skills احتياطيًا (نشر أو مزامنة)

بالنسبة إلى مجلد Skill واحد:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

لفحص العديد من Skills ونسخها احتياطيًا دفعة واحدة:

```bash
clawhub sync --all
```

### نشر Plugin من GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

يجب أن تتضمن Plugins البرمجية البيانات الوصفية المطلوبة من OpenClaw في `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

ينبغي أن تشحن الحزم المنشورة JavaScript مبنيًا وأن تشير `runtimeExtensions`
إلى ذلك الناتج. وما تزال عمليات التثبيت من Git checkout قادرة على الرجوع إلى مصدر TypeScript
عندما لا توجد ملفات مبنية، لكن إدخالات وقت التشغيل المبنية تتجنب ترجمة TypeScript
في وقت التشغيل ضمن مسارات بدء التشغيل وdoctor وتحميل Plugin.

## تفاصيل متقدمة (تقنية)

### الإصدارات والوسوم

- كل عملية نشر تنشئ `SkillVersion` جديدًا وفق **semver**.
- تشير الوسوم (مثل `latest`) إلى إصدار؛ ويسمح لك تحريك الوسوم بالتراجع.
- تُرفق سجلات التغيير بكل إصدار ويمكن أن تكون فارغة عند المزامنة أو نشر التحديثات.

### التغييرات المحلية مقابل إصدارات السجل

تقارن التحديثات محتويات Skill المحلية بإصدارات السجل باستخدام hash للمحتوى. وإذا لم تطابق الملفات المحلية أي إصدار منشور، يطلب CLI تأكيدًا قبل الكتابة فوقها (أو يتطلب `--force` في التشغيلات غير التفاعلية).

### فحص المزامنة والجذور الاحتياطية

يقوم `clawhub sync` أولًا بفحص workdir الحالي. وإذا لم يتم العثور على Skills، فإنه يعود إلى المواقع القديمة المعروفة (مثل `~/openclaw/skills` و`~/.openclaw/skills`). وقد صُمم هذا للعثور على تثبيتات Skills الأقدم من دون أعلام إضافية.

### التخزين وملف القفل

- يتم تسجيل Skills المثبتة في `.clawhub/lock.json` تحت workdir الخاص بك.
- يتم تخزين رموز المصادقة في ملف config الخاص بـ ClawHub CLI (يمكن التجاوز عبر `CLAWHUB_CONFIG_PATH`).

### Telemetry (عدادات التثبيت)

عندما تشغّل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة دنيا لحساب أعداد التثبيت. يمكنك تعطيل هذا بالكامل:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## متغيرات البيئة

- `CLAWHUB_SITE`: تجاوز عنوان URL الخاص بالموقع.
- `CLAWHUB_REGISTRY`: تجاوز عنوان URL الخاص بـ API السجل.
- `CLAWHUB_CONFIG_PATH`: تجاوز مكان تخزين CLI للرمز/config.
- `CLAWHUB_WORKDIR`: تجاوز workdir الافتراضي.
- `CLAWHUB_DISABLE_TELEMETRY=1`: تعطيل Telemetry في `sync`.
