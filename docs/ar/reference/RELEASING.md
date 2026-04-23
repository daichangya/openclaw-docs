---
read_when:
    - تبحث عن تعريفات قنوات الإصدار العامة
    - تبحث عن تسمية الإصدارات والوتيرة الزمنية لها
summary: قنوات الإصدار العامة، وتسمية الإصدارات، والوتيرة الزمنية لها
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-04-23T07:32:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# سياسة الإصدار

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- stable: إصدارات موسومة تُنشَر إلى npm ‏`beta` افتراضيًا، أو إلى npm ‏`latest` عند الطلب الصريح
- beta: وسوم prerelease تُنشَر إلى npm ‏`beta`
- dev: الرأس المتحرك للفرع `main`

## تسمية الإصدارات

- إصدار release المستقر: `YYYY.M.D`
  - وسم Git: ‏`vYYYY.M.D`
- إصدار التصحيح المستقر: `YYYY.M.D-N`
  - وسم Git: ‏`vYYYY.M.D-N`
- إصدار Beta prerelease: ‏`YYYY.M.D-beta.N`
  - وسم Git: ‏`vYYYY.M.D-beta.N`
- لا تضع أصفارًا بادئة للشهر أو اليوم
- `latest` تعني إصدار npm المستقر المروَّج الحالي
- `beta` تعني هدف تثبيت beta الحالي
- تُنشَر إصدارات stable وإصدارات التصحيح المستقر إلى npm ‏`beta` افتراضيًا؛ ويمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بنية beta مُعتمدة لاحقًا
- يشحن كل إصدار OpenClaw مستقر حزمة npm وتطبيق macOS معًا؛
  أما إصدارات beta فتتحقق وتنشر عادةً مسار npm/package أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق mac ما لم يُطلب خلاف ذلك

## وتيرة الإصدار

- تبدأ الإصدارات أولًا عبر beta
- لا يتبعها stable إلا بعد التحقق من أحدث beta
- ينشئ المشرفون عادةً الإصدارات من فرع `release/YYYY.M.D`
  المُنشأ من `main` الحالي، بحيث لا تمنع عملية التحقق من الإصدار وإصلاحاته
  التطوير الجديد على `main`
- إذا دُفع وسم beta أو نُشر واحتاج إلى إصلاح، فإن المشرفين ينشئون
  الوسم التالي `-beta.N` بدلًا من حذف وسم beta القديم أو إعادة إنشائه
- تمثل إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات
  الاسترداد معلومات خاصة بالمشرفين فقط

## الفحص التمهيدي للإصدار

- شغّل `pnpm check:test-types` قبل الفحص التمهيدي للإصدار حتى يظل TypeScript الخاص بالاختبارات
  مغطى خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل الفحص التمهيدي للإصدار حتى تكون فحوصات دورات الاستيراد الأوسع
  وحدود البنية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى
  توجد عناصر الإصدار المتوقعة `dist/*` وحزمة Control UI من أجل
  خطوة التحقق من الحزمة
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- تعمل فحوصات الإصدار الآن في workflow يدوية منفصلة:
  `OpenClaw Release Checks`
- تنفّذ `OpenClaw Release Checks` أيضًا بوابة تكافؤ QA Lab الوهمية بالإضافة إلى
  مساري QA الحيَّين الخاصين بـ Matrix وTelegram قبل الموافقة على الإصدار. وتستخدم
  المسارات الحية البيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا عقود
  اعتماد Convex CI.
- يُرسَل التحقق من التثبيت والترقية عبر أنظمة التشغيل من
  workflow المستدعي الخاصة
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  التي تستدعي workflow العامة القابلة لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- هذا الفصل مقصود: أبقِ مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركّزًا على العناصر، بينما تبقى الفحوصات الحية الأبطأ في
  مسارها الخاص حتى لا تؤخر النشر أو تمنعه
- يجب إرسال فحوصات الإصدار من مرجع workflow للفرع `main` أو من
  مرجع workflow للفرع `release/YYYY.M.D` حتى يظل منطق workflow والأسرار
  تحت السيطرة
- تقبل هذه workflow إما وسم إصدار موجودًا أو SHA الكامل الحالي المكوَّن من 40 حرفًا لالتزام فرع workflow
- في وضع SHA الخاص بالالتزام، فهي لا تقبل إلا HEAD الحالي لفرع workflow؛ استخدم
  وسم إصدار من أجل التزامات الإصدار الأقدم
- يقبل الفحص التمهيدي للتحقق فقط في `OpenClaw NPM Release` أيضًا SHA الكامل الحالي المكوَّن من 40 حرفًا لالتزام فرع workflow من دون الحاجة إلى وسم مدفوع
- يمثل مسار SHA هذا تحققًا فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، تقوم workflow بتوليد `v<package.json version>` فقط
  من أجل فحص بيانات الحزمة؛ أما النشر الحقيقي فلا يزال يتطلب وسم إصدار حقيقيًا
- تبقي كلتا workflow مسار النشر والترقية الحقيقيين على GitHub-hosted
  runners، بينما يمكن لمسار التحقق غير المغير استخدام
  Blacksmith Linux runners الأكبر
- تشغّل هذه workflow الأمر
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري workflow هما `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص التمهيدي لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار التثبيت المنشور من السجل
  في temp prefix جديدة
- تستخدم أتمتة الإصدار الخاصة بالمشرفين الآن النمط preflight-then-promote:
  - يجب أن يمر نشر npm الحقيقي عبر `preflight_run_id` ناجح
  - يجب إرسال نشر npm الحقيقي من الفرع `main` أو
    `release/YYYY.M.D` نفسه الذي انطلق منه الفحص التمهيدي الناجح
  - تستخدم إصدارات npm المستقرة `beta` افتراضيًا
  - يمكن أن يستهدف نشر npm المستقر `latest` صراحةً عبر مدخل workflow
  - توجد الآن عملية تعديل npm dist-tag المعتمدة على الرموز في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما يحتفظ المستودع
    العام بالنشر المعتمد على OIDC فقط
  - يمثل `macOS Release` العام تحققًا فقط
  - يجب أن يمر النشر الخاص الحقيقي لتطبيق mac عبر
    `preflight_run_id` و`validate_run_id` الخاصين بتطبيق mac
  - تروّج مسارات النشر الحقيقية العناصر المُعدة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقر مثل `YYYY.M.D-N`، يتحقق المصدِّق بعد النشر
  أيضًا من مسار الترقية نفسه في temp prefix من `YYYY.M.D` إلى `YYYY.M.D-N`
  بحيث لا تترك تصحيحات الإصدارات تثبيتات global الأقدم بصمت على
  الحمولة المستقرة الأساسية
- يفشل الفحص التمهيدي لإصدار npm افتراضيًا ما لم تتضمن tarball كلا الملفين
  `dist/control-ui/index.html` وحمولة غير فارغة ضمن `dist/control-ui/assets/`
  حتى لا نشحن dashboard متصفح فارغة مرة أخرى
- يتحقق الفحص بعد النشر أيضًا من أن التثبيت المنشور من السجل
  يحتوي على تبعيات وقت تشغيل غير فارغة للـ Plugins المضمّنة تحت تخطيط
  الجذر `dist/*`. ويفشل الإصدار الذي يُشحن مع تبعيات
  مفقودة أو فارغة للـ Plugins المضمّنة في المصدّق بعد النشر ولا يمكن ترقيته
  إلى `latest`.
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بـ npm pack على
  tarball التحديث المرشحة، بحيث تلتقط e2e الخاصة بالمثبّت التضخم العرضي في الحزمة
  قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI، أو بيانات توقيت الامتدادات، أو
  مصفوفات اختبارات الامتدادات، فأعد توليد وراجع نواتج مصفوفة workflow
  `checks-node-extensions` المملوكة للمخطِّط من `.github/workflows/ci.yml`
  قبل الموافقة حتى لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح برنامج التحديث:
  - يجب أن ينتهي إصدار GitHub بوجود الملفات المعبأة `.zip` و`.dmg` و`.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المعبأ بـ bundle id غير خاص بالتصحيح، وfeed URL غير فارغة لـ Sparkle، و`CFBundleVersion` عند أو فوق الحد الأدنى الأساسي لبناء Sparkle لذلك الإصدار

## مدخلات workflow الخاصة بـ NPM

تقبل `OpenClaw NPM Release` مدخلات يتحكم بها المشغّل:

- `tag`: وسم إصدار مطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ وعندما تكون `preflight_only=true`، يمكن أن تكون أيضًا
  SHA الكامل الحالي المكوَّن من 40 حرفًا لالتزام فرع workflow من أجل فحص تمهيدي للتحقق فقط
- `preflight_only`: تكون `true` من أجل التحقق/البناء/الحزمة فقط، وتكون `false` من أجل
  مسار النشر الحقيقي
- `preflight_run_id`: مطلوبة في مسار النشر الحقيقي حتى تعيد workflow استخدام
  tarball المُعدة من تشغيل الفحص التمهيدي الناجح
- `npm_dist_tag`: وسم npm الهدف لمسار النشر؛ والافتراضي هو `beta`

تقبل `OpenClaw Release Checks` مدخلات يتحكم بها المشغّل:

- `ref`: وسم إصدار موجود أو SHA الكامل الحالي المكوَّن من 40 حرفًا لالتزام `main`
  للتحقق منه عند الإرسال من `main`؛ ومن فرع إصدار، استخدم
  وسم إصدار موجودًا أو SHA الكامل الحالي المكوَّن من 40 حرفًا لالتزام فرع الإصدار

القواعد:

- يمكن أن تُنشَر وسوم stable ووسوم التصحيح إلى `beta` أو `latest`
- لا يمكن أن تُنشَر وسوم Beta prerelease إلا إلى `beta`
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال SHA الكامل للالتزام فقط عندما
  تكون `preflight_only=true`
- تمثل `OpenClaw Release Checks` دائمًا تحققًا فقط وتقبل أيضًا
  SHA لالتزام فرع workflow الحالي
- يتطلب وضع SHA للالتزام في فحوصات الإصدار أيضًا HEAD الحالي لفرع workflow
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسها المستخدمة أثناء الفحص التمهيدي؛ وتتحقق workflow من تلك البيانات الوصفية قبل استمرار النشر

## تسلسل إصدار npm المستقر

عند إنشاء إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الكامل الحالي لالتزام فرع workflow
     من أجل تنفيذ جاف للتحقق فقط من workflow الفحص التمهيدي
2. اختر `npm_dist_tag=beta` من أجل التدفق العادي الذي يبدأ بـ beta، أو `latest` فقط
   عندما تريد عمدًا نشرًا مستقراً مباشرًا
3. شغّل `OpenClaw Release Checks` بشكل منفصل باستخدام الوسم نفسه أو
   SHA الكامل الحالي لالتزام فرع workflow عندما تريد تغطية الذاكرة المخبئية الحية للمطالبات،
   وتكافؤ QA Lab، وMatrix، وTelegram
   - وهذا الفصل مقصود بحيث تبقى التغطية الحية متاحة من دون
     إعادة ربط الفحوصات الطويلة أو المتقلبة بـ workflow النشر
4. احفظ `preflight_run_id` الناجح
5. شغّل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، والقيمة نفسها
   لـ `tag`، والقيمة نفسها لـ `npm_dist_tag`، و`preflight_run_id` المحفوظ
6. إذا وصل الإصدار إلى `beta`، فاستخدم workflow الخاصة
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
7. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وكان ينبغي أن يتبعه `beta`
   بالبنية المستقرة نفسها فورًا، فاستخدم workflow الخاصة نفسها
   لتوجيه كلا dist-tags إلى الإصدار المستقر، أو دع مزامنتها العلاجية المجدولة
   تنقل `beta` لاحقًا

توجد عملية تعديل dist-tag في المستودع الخاص لأسباب أمنية لأنها لا تزال
تتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد على OIDC فقط.

وهذا يُبقي مسار النشر المباشر ومسار الترقية الذي يبدأ بـ beta كلاهما
موثقين ومرئيين للمشغّل.

## المراجع العامة

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
كدليل التشغيل الفعلي.
