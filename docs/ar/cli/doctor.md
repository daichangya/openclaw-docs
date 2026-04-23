---
read_when:
    - لديك مشكلات في الاتصال/المصادقة وتريد إصلاحات موجَّهة
    - لقد أجريت تحديثًا وتريد فحص سلامة سريعًا
summary: مرجع CLI لـ `openclaw doctor` (فحوصات السلامة + إصلاحات موجَّهة)
title: doctor
x-i18n:
    generated_at: "2026-04-23T07:22:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

فحوصات السلامة + إصلاحات سريعة لـ Gateway والقنوات.

ذو صلة:

- استكشاف الأخطاء وإصلاحها: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- التدقيق الأمني: [الأمان](/ar/gateway/security)

## أمثلة

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## الخيارات

- `--no-workspace-suggestions`: تعطيل اقتراحات الذاكرة/البحث لمساحة العمل
- `--yes`: قبول القيم الافتراضية من دون مطالبة
- `--repair`: تطبيق الإصلاحات الموصى بها من دون مطالبة
- `--fix`: اسم مستعار لـ `--repair`
- `--force`: تطبيق إصلاحات قوية، بما في ذلك الكتابة فوق إعدادات الخدمة المخصصة عند الحاجة
- `--non-interactive`: التشغيل من دون مطالبات؛ هجرات آمنة فقط
- `--generate-gateway-token`: إنشاء رمز Gateway وإعداده
- `--deep`: فحص خدمات النظام بحثًا عن عمليات تثبيت Gateway إضافية

ملاحظات:

- لا تعمل المطالبات التفاعلية (مثل إصلاحات keychain/OAuth) إلا عندما يكون stdin من نوع TTY ولا يكون `--non-interactive` **مضبوطًا**. ستتجاوز التشغيلات غير التفاعلية (Cron وTelegram ومن دون طرفية) المطالبات.
- الأداء: تتجاوز تشغيلات `doctor` غير التفاعلية التحميل المبكر لـ Plugin بحيث تبقى فحوصات السلامة غير التفاعلية سريعة. أما الجلسات التفاعلية فما تزال تحمّل Plugins بالكامل عندما يحتاج فحص ما إلى مساهمتها.
- يكتب `--fix` (الاسم المستعار لـ `--repair`) نسخة احتياطية إلى `~/.openclaw/openclaw.json.bak` ويحذف مفاتيح الإعدادات غير المعروفة، مع سرد كل عملية إزالة.
- تكتشف فحوصات تكامل الحالة الآن ملفات نصوص جلسات يتيمة في دليل sessions ويمكنها أرشفتها بصيغة `.deleted.<timestamp>` لاستعادة المساحة بأمان.
- يفحص Doctor أيضًا `~/.openclaw/cron/jobs.json` (أو `cron.store`) بحثًا عن أشكال مهام Cron القديمة ويمكنه إعادة كتابتها في مكانها قبل أن يضطر المجدول إلى التطبيع التلقائي لها وقت التشغيل.
- يصلح Doctor تبعيات بيئة تشغيل Plugin المضمّنة المفقودة من دون الحاجة إلى صلاحية كتابة على حزمة OpenClaw المثبتة. بالنسبة إلى تثبيتات npm المملوكة لـ root أو وحدات systemd المقواة، اضبط `OPENCLAW_PLUGIN_STAGE_DIR` على دليل قابل للكتابة مثل `/var/lib/openclaw/plugin-runtime-deps`.
- ينقل Doctor تلقائيًا إعدادات Talk المسطحة القديمة (`talk.voiceId` و`talk.modelId` وما شابه) إلى `talk.provider` + `talk.providers.<provider>`.
- لم تعد تشغيلات `doctor --fix` المتكررة تُبلغ/تطبق تطبيع Talk عندما يكون الاختلاف الوحيد هو ترتيب مفاتيح الكائن.
- يتضمن Doctor فحص جاهزية memory-search ويمكنه التوصية باستخدام `openclaw configure --section model` عند غياب بيانات اعتماد التضمين.
- إذا كان وضع sandbox مفعّلًا لكن Docker غير متاح، فسيُبلغ doctor عن تحذير عالي الإشارة مع خطوات المعالجة (`install Docker` أو `openclaw config set agents.defaults.sandbox.mode off`).
- إذا كانت `gateway.auth.token`/`gateway.auth.password` مُدارة عبر SecretRef وغير متاحة في مسار الأمر الحالي، فسيُبلغ doctor عن تحذير للقراءة فقط ولن يكتب بيانات اعتماد احتياطية بنص صريح.
- إذا فشل فحص SecretRef للقناة في مسار إصلاح، فسيستمر doctor ويبلغ عن تحذير بدلًا من الخروج مبكرًا.
- يتطلب الحل التلقائي لأسماء مستخدمي `allowFrom` في Telegram (`doctor --fix`) رمز Telegram قابلًا للحل في مسار الأمر الحالي. وإذا لم يكن فحص الرمز متاحًا، فسيُبلغ doctor عن تحذير ويتجاوز الحل التلقائي في تلك الجولة.

## macOS: تجاوزات البيئة في `launchctl`

إذا كنت قد شغّلت سابقًا `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (أو `...PASSWORD`)، فستتجاوز تلك القيمة ملف الإعدادات لديك وقد تسبب أخطاء “unauthorized” مستمرة.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
