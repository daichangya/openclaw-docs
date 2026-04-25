---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجَّهة
    - لقد قمت بالتحديث وتريد فحصًا سريعًا للتأكد من السلامة
summary: مرجع CLI لـ `openclaw doctor` (فحوصات الصحة + إصلاحات موجَّهة)
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

فحوصات الصحة + إصلاحات سريعة لـ gateway والقنوات.

ذو صلة:

- استكشاف الأخطاء وإصلاحها: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- تدقيق الأمان: [الأمان](/ar/gateway/security)

## أمثلة

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## الخيارات

- `--no-workspace-suggestions`: تعطيل اقتراحات ذاكرة/بحث مساحة العمل
- `--yes`: قبول القيم الافتراضية من دون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها من دون مطالبة
- `--fix`: اسم بديل لـ `--repair`
- `--force`: تطبيق إصلاحات صارمة، بما في ذلك الكتابة فوق إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل من دون مطالبات؛ عمليات ترحيل آمنة فقط
- `--generate-gateway-token`: إنشاء رمز مميز لـ gateway وضبطه
- `--deep`: فحص خدمات النظام بحثًا عن عمليات تثبيت gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin عبارة عن TTY ولم يتم ضبط `--non-interactive`. وتتجاوز عمليات التشغيل من دون واجهة (cron، Telegram، من دون طرفية) المطالبات.
- الأداء: تتجاوز عمليات `doctor` غير التفاعلية التحميل المبكر لـ Plugin بحيث تبقى فحوصات الصحة من دون واجهة سريعة. أما الجلسات التفاعلية فلا تزال تحمّل Plugins بالكامل عندما يحتاج فحص ما إلى مساهمتها.
- يقوم `--fix` (اسم بديل لـ `--repair`) بكتابة نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعدادات غير المعروفة، مع سرد كل عملية إزالة.
- تكتشف فحوصات سلامة الحالة الآن ملفات transcript اليتيمة في دليل الجلسات ويمكنها أرشفتها بصيغة `.deleted.<timestamp>` لاستعادة المساحة بأمان.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى تطبيعها تلقائيًا في وقت التشغيل.
- يصلح Doctor تبعيات وقت تشغيل Plugin المضمّنة المفقودة من دون الكتابة داخل عمليات التثبيت العامة المجمّعة. وبالنسبة إلى عمليات تثبيت npm المملوكة للجذر أو وحدات systemd المحصّنة، اضبط `OPENCLAW_PLUGIN_STAGE_DIR` على دليل قابل للكتابة مثل `/var/lib/openclaw/plugin-runtime-deps`.
- يقوم Doctor بترحيل إعداد Talk المسطح القديم (`talk.voiceId` و`talk.modelId` وما شابه) تلقائيًا إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد عمليات التشغيل المتكررة لـ `doctor --fix` تُبلغ عن تطبيع Talk أو تطبقه عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية بحث الذاكرة ويمكنه التوصية بالأمر `openclaw configure --section model` عندما تكون بيانات اعتماد embedding مفقودة.
- إذا كان وضع sandbox مفعّلًا لكن Docker غير متاح، فسيبلغ doctor عن تحذير عالي الأهمية مع المعالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، فسيبلغ doctor عن تحذير للقراءة فقط ولن يكتب بيانات اعتماد احتياطية بنص صريح.
- إذا فشل فحص SecretRef الخاص بالقناة في مسار إصلاح، يواصل doctor العمل ويبلغ عن تحذير بدلًا من الخروج مبكرًا.
- يتطلب التحليل التلقائي لاسم المستخدم في `allowFrom` الخاص بـ Telegram (`doctor --fix`) رمز Telegram قابلًا للتحليل في مسار الأمر الحالي. وإذا لم يكن فحص الرمز متاحًا، فسيبلغ doctor عن تحذير ويتجاوز التحليل التلقائي في تلك العملية.

## macOS: تجاوزات متغيرات البيئة في `launchctl`

إذا سبق لك تشغيل `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فإن تلك القيمة تتجاوز ملف الإعدادات لديك ويمكن أن تتسبب في أخطاء “unauthorized” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Doctor الخاص بـ Gateway](/ar/gateway/doctor)
