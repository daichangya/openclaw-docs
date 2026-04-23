---
read_when:
    - تريد تحديث نسخة المصدر المحلية بأمان
    - تحتاج إلى فهم السلوك المختصر لـ `--update`
summary: مرجع CLI لـ `openclaw update` (تحديث المصدر بشكل آمن نسبيًا + إعادة تشغيل Gateway تلقائيًا)
title: تحديث
x-i18n:
    generated_at: "2026-04-23T07:23:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

حدّث OpenClaw بأمان وبدّل بين قنوات stable/beta/dev.

إذا كنت قد ثبّتَّ عبر **npm/pnpm/bun** (تثبيت عام، من دون بيانات git)،
فستحدث التحديثات عبر تدفق مدير الحزم في [التحديث](/ar/install/updating).

## الاستخدام

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## الخيارات

- `--no-restart`: تخطَّ إعادة تشغيل خدمة Gateway بعد تحديث ناجح.
- `--channel <stable|beta|dev>`: اضبط قناة التحديث (git + npm؛ وتُحفَظ في الإعداد).
- `--tag <dist-tag|version|spec>`: تجاوز هدف الحزمة لهذا التحديث فقط. وبالنسبة إلى تثبيتات الحزم، تُعيَّن `main` إلى `github:openclaw/openclaw#main`.
- `--dry-run`: اعرض إجراءات التحديث المخطط لها (القناة/الوسم/الهدف/تدفق إعادة التشغيل) من دون كتابة الإعداد، أو التثبيت، أو مزامنة Plugins، أو إعادة التشغيل.
- `--json`: اطبع JSON قابلًا للقراءة الآلية من `UpdateRunResult`، بما في ذلك
  `postUpdate.plugins.integrityDrifts` عند اكتشاف انحراف في عنصر Plugin
  المثبّت عبر npm أثناء مزامنة Plugins بعد التحديث.
- `--timeout <seconds>`: مهلة لكل خطوة (الافتراضي 1200 ثانية).
- `--yes`: تخطَّ مطالبات التأكيد (مثل تأكيد الرجوع إلى إصدار أقدم)

ملاحظة: تتطلب عمليات الرجوع إلى إصدار أقدم تأكيدًا لأن الإصدارات الأقدم قد تكسر الإعداد.

## `update status`

اعرض قناة التحديث النشطة + الوسم/الفرع/SHA في git (لنسخ المصدر المحلية)، بالإضافة إلى توفر التحديثات.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

الخيارات:

- `--json`: اطبع JSON للحالة قابلًا للقراءة الآلية.
- `--timeout <seconds>`: مهلة للفحوصات (الافتراضي 3 ثوانٍ).

## `update wizard`

تدفق تفاعلي لاختيار قناة تحديث وتأكيد ما إذا كنت تريد إعادة تشغيل Gateway
بعد التحديث (الافتراضي هو إعادة التشغيل). وإذا اخترت `dev` من دون نسخة git محلية،
فسيعرض إنشاء واحدة.

الخيارات:

- `--timeout <seconds>`: مهلة لكل خطوة تحديث (الافتراضي `1200`)

## ما الذي يفعله

عندما تبدّل القنوات صراحةً (`--channel ...`)، يحافظ OpenClaw أيضًا على
محاذاة طريقة التثبيت:

- `dev` ← يضمن وجود نسخة git محلية (الافتراضي: `~/openclaw`، ويمكن تجاوزها عبر `OPENCLAW_GIT_DIR`)،
  ويحدّثها، ويثبّت CLI العام من تلك النسخة.
- `stable` ← يثبّت من npm باستخدام `latest`.
- `beta` ← يفضّل npm dist-tag ‏`beta`، لكنه يعود إلى `latest` عندما تكون beta
  مفقودة أو أقدم من الإصدار المستقر الحالي.

يعيد المحدّث التلقائي لنواة Gateway (عندما يكون مفعّلًا عبر الإعداد) استخدام مسار التحديث نفسه هذا.

بالنسبة إلى تثبيتات مدير الحزم، يحل `openclaw update` إصدار الحزمة الهدف
قبل استدعاء مدير الحزم. وإذا طابق الإصدار المثبّت الهدف تمامًا
ولم تكن هناك حاجة إلى حفظ تغيير في قناة التحديث، فإن الأمر ينتهي كحالة تخطٍ قبل
تثبيت الحزمة، أو مزامنة Plugins، أو تحديث الإكمال، أو إعادة تشغيل Gateway.

## تدفق نسخة git المحلية

القنوات:

- `stable`: نفّذ checkout لأحدث وسم غير beta، ثم build + doctor.
- `beta`: فضّل أحدث وسم `-beta`، لكن ارجع إلى أحدث وسم stable
  عندما تكون beta مفقودة أو أقدم.
- `dev`: نفّذ checkout للفرع `main`، ثم fetch + rebase.

على مستوى عالٍ:

1. يتطلب شجرة عمل نظيفة (من دون تغييرات غير ملتزم بها).
2. يبدّل إلى القناة المحددة (وسم أو فرع).
3. يجلب من المنبع upstream (في `dev` فقط).
4. في `dev` فقط: ينفذ فحصًا تمهيديًا لـ lint + TypeScript build في شجرة عمل مؤقتة؛ وإذا فشل الرأس tip، يتراجع حتى 10 التزامات للعثور على أحدث build نظيف.
5. يجري rebase على الالتزام المحدد (في `dev` فقط).
6. يثبّت التبعيات باستخدام مدير الحزم الخاص بالمستودع. وبالنسبة إلى نسخ pnpm المحلية، يقوم المحدّث بتهيئة `pnpm` عند الطلب (عبر `corepack` أولًا، ثم احتياطيًا عبر `npm install pnpm@10` مؤقت) بدلًا من تشغيل `npm run build` داخل مساحة عمل pnpm.
7. ينفذ build ويُنشئ Control UI.
8. يشغّل `openclaw doctor` كفحص "تحديث آمن" نهائي.
9. يزامن Plugins مع القناة النشطة (تستخدم `dev` Plugins المضمّنة؛ وتستخدم `stable`/`beta` npm) ويحدّث Plugins المثبّتة عبر npm.

إذا حُلّ تحديث Plugin مثبّتة عبر npm ومثبّتة بإصدار دقيق إلى عنصر يختلف
تكاملُه عن سجل التثبيت المخزن، فإن `openclaw update` يوقف تحديث عنصر تلك Plugin
بدلًا من تثبيته. أعد تثبيت Plugin أو تحديثها صراحةً فقط بعد التحقق من أنك تثق
بالعنصر الجديد.

إذا استمرت تهيئة pnpm في الفشل، فإن المحدّث يتوقف الآن مبكرًا مع خطأ
خاص بمدير الحزم بدلًا من محاولة `npm run build` داخل النسخة المحلية.

## الاختصار `--update`

يعيد `openclaw --update` الكتابة إلى `openclaw update` (وهو مفيد لـ shell scripts ونصوص launcher).

## راجع أيضًا

- `openclaw doctor` (يعرض تشغيل update أولًا في نسخ git المحلية)
- [قنوات التطوير](/ar/install/development-channels)
- [التحديث](/ar/install/updating)
- [مرجع CLI](/ar/cli)
