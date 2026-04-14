---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - البحث عن تسمية الإصدارات والوتيرة
summary: قنوات الإصدار العامة، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-04-14T02:08:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdc32839447205d74ba7a20a45fbac8e13b199174b442a1e260e3fce056c63da
    source_path: reference/RELEASING.md
    workflow: 15
---

# سياسة الإصدار

لدى OpenClaw ثلاث مسارات إصدار عامة:

- stable: إصدارات موسومة تنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- beta: وسوم إصدار تمهيدي تنشر إلى npm `beta`
- dev: الرأس المتحرك لفرع `main`

## تسمية الإصدارات

- إصدار النسخة المستقرة: `YYYY.M.D`
  - وسم Git: `vYYYY.M.D`
- إصدار التصحيح للنسخة المستقرة: `YYYY.M.D-N`
  - وسم Git: `vYYYY.M.D-N`
- إصدار النسخة التمهيدية beta: `YYYY.M.D-beta.N`
  - وسم Git: `vYYYY.M.D-beta.N`
- لا تضف أصفارًا بادئة للشهر أو اليوم
- `latest` يعني الإصدار المستقر الحالي المروّج على npm
- `beta` يعني هدف تثبيت beta الحالي
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ ويمكن لمشغلي الإصدار استهداف `latest` صراحةً، أو ترقية بنية beta مُعتمدة لاحقًا
- يشحن كل إصدار من OpenClaw حزمة npm وتطبيق macOS معًا

## وتيرة الإصدار

- تبدأ الإصدارات عبر beta أولًا
- لا يتبعها stable إلا بعد التحقق من أحدث beta
- إجراءات الإصدار التفصيلية، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصّصة للمشرفين فقط

## الفحص المسبق للإصدار

- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى تكون
  عناصر الإصدار المتوقعة في `dist/*` وحزمة Control UI موجودة من أجل خطوة
  التحقق من الحزمة
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- تعمل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- هذا الفصل مقصود: للحفاظ على مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركّزًا على العناصر، بينما تبقى الفحوصات الحية الأبطأ في
  مسارها الخاص حتى لا تؤخر النشر أو تمنعه
- يجب تشغيل فحوصات الإصدار من مرجع سير عمل `main` حتى تبقى
  منطقية سير العمل والأسرار معتمدة وموحّدة
- يقبل سير العمل هذا إما وسم إصدار موجودًا أو SHA الكامل الحالي
  المكوّن من 40 حرفًا لالتزام `main`
- في وضع SHA للالتزام، لا يقبل إلا HEAD الحالي لـ `origin/main`؛ استخدم
  وسم إصدار للالتزامات الأقدم الخاصة بالإصدار
- كما يقبل الفحص المسبق للتحقق فقط في `OpenClaw NPM Release` أيضًا
  SHA الكامل الحالي المكوّن من 40 حرفًا لالتزام `main` من دون الحاجة إلى وسم مدفوع
- هذا المسار عبر SHA مخصّص للتحقق فقط ولا يمكن ترقيته إلى نشر فعلي
- في وضع SHA، يُنشئ سير العمل `v<package.json version>` اصطناعيًا فقط من أجل
  فحص بيانات الحزمة؛ أما النشر الحقيقي فلا يزال يتطلب وسم إصدار حقيقيًا
- يحافظ كلا سيرَي العمل على مسار النشر والترقية الحقيقيين على مشغلات GitHub المستضافة،
  بينما يمكن لمسار التحقق غير المعدِّل استخدام
  مشغلات Blacksmith Linux الأكبر
- يشغّل ذلك السير
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام كلٍّ من أسرار سير العمل `OPENAI_API_KEY` و `ANTHROPIC_API_KEY`
- لم يعد الفحص المسبق لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو وسم beta/التصحيح المطابق) قبل الموافقة
- بعد النشر إلى npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو إصدار beta/التصحيح المطابق) للتحقق من مسار التثبيت المنشور من السجل
  ضمن بادئة مؤقتة جديدة
- تستخدم أتمتة الإصدار لدى المشرفين الآن أسلوب الفحص المسبق ثم الترقية:
  - يجب أن يجتاز النشر الحقيقي إلى npm `preflight_run_id` ناجحًا من npm
  - إصدارات npm المستقرة تستهدف `beta` افتراضيًا
  - يمكن لإصدارات npm المستقرة استهداف `latest` صراحةً عبر مدخل سير العمل
  - لا تزال ترقية الإصدار المستقر من `beta` إلى `latest` متاحة كوضع يدوي صريح ضمن سير العمل الموثوق `OpenClaw NPM Release`
  - يمكن أيضًا لعمليات النشر المستقرة المباشرة تشغيل وضع صريح لمزامنة dist-tag
    يوجّه كلًا من `latest` و `beta` إلى الإصدار المستقر المنشور بالفعل
  - لا تزال أوضاع dist-tag هذه تتطلب `NPM_TOKEN` صالحًا في بيئة `npm-release` لأن إدارة `npm dist-tag` منفصلة عن النشر الموثوق
  - `macOS Release` العام مخصّص للتحقق فقط
  - يجب أن يجتاز النشر الحقيقي الخاص بـ mac كلًا من
    `preflight_run_id` و `validate_run_id` الخاصين بنجاح في المسار الخاص بـ mac
  - تقوم مسارات النشر الحقيقية بترقية العناصر المُعدّة مسبقًا بدلًا من إعادة بنائها مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، يتحقق فاحص ما بعد النشر
  أيضًا من مسار الترقية نفسه ضمن بادئة مؤقتة من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار التثبيتات العامة الأقدم بصمت على
  حمولة النسخة المستقرة الأساسية
- يفشل الفحص المسبق لإصدار npm بشكل مغلق ما لم تتضمن الحزمة المضغوطة كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن مرة أخرى لوحة متصفح فارغة
- إذا مسّ عمل الإصدار تخطيط CI، أو بيانات توقيت الإضافات، أو
  مصفوفات اختبارات الإضافات، فأعِد توليد وراجِع مخرجات مصفوفة سير العمل
  `checks-node-extensions` المملوكة للمخطِّط من `.github/workflows/ci.yml`
  قبل الموافقة حتى لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تتضمن جاهزية إصدار macOS المستقر أيضًا أسطح التحديث:
  - يجب أن ينتهي إصدار GitHub محتويًا على الملفات المعبأة `.zip` و `.dmg` و `.dSYM.zip`
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المعبأ بمعرّف حزمة غير تصحيحي، وعنوان URL غير فارغ
    لتغذية Sparkle، و `CFBundleVersion` يساوي أو يتجاوز حد بناء Sparkle الأدنى
    المعتمد لذلك الإصدار

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` مدخلات يتحكم بها المشغّل كما يلي:

- `tag`: وسم الإصدار المطلوب، مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ وعندما تكون `preflight_only=true`، قد يكون أيضًا
  SHA الكامل الحالي المكوّن من 40 حرفًا لالتزام `main` من أجل فحص مسبق
  مخصّص للتحقق فقط
- `preflight_only`: القيمة `true` للتحقق/البناء/الحزمة فقط، و`false` لمسار
  النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد سير العمل استخدام
  الحزمة المضغوطة المُعدّة من تشغيل الفحص المسبق الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ والقيمة الافتراضية هي `beta`
- `promote_beta_to_latest`: القيمة `true` لتخطي النشر ونقل
  بنية `beta` المستقرة المنشورة بالفعل إلى `latest`
- `sync_stable_dist_tags`: القيمة `true` لتخطي النشر وتوجيه كل من `latest` و
  `beta` إلى إصدار مستقر منشور بالفعل

يقبل `OpenClaw Release Checks` مدخلات يتحكم بها المشغّل كما يلي:

- `ref`: وسم إصدار موجود أو SHA الكامل الحالي المكوّن من 40 حرفًا لالتزام `main`
  المراد التحقق منه

القواعد:

- يمكن لوسوم stable ووسوم التصحيح النشر إلى `beta` أو `latest`
- يمكن لوسوم الإصدار التمهيدي beta النشر إلى `beta` فقط
- يُسمح بإدخال SHA الكامل للالتزام فقط عندما تكون `preflight_only=true`
- كما يتطلب وضع SHA للالتزام في فحوصات الإصدار أيضًا HEAD الحالي لـ `origin/main`
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء الفحص المسبق؛
  ويتحقق سير العمل من تلك البيانات الوصفية قبل متابعة النشر
- يجب أن يستخدم وضع الترقية وسمًا مستقرًا أو وسم تصحيح، مع `preflight_only=false`،
  و`preflight_run_id` فارغ، و`npm_dist_tag=beta`
- يجب أن يستخدم وضع مزامنة dist-tag وسمًا مستقرًا أو وسم تصحيح،
  و`preflight_only=false`، و`preflight_run_id` فارغًا، و`npm_dist_tag=latest`،
  و`promote_beta_to_latest=false`
- تتطلب أوضاع الترقية ومزامنة dist-tag أيضًا `NPM_TOKEN` صالحًا لأن
  `npm dist-tag add` لا يزال يحتاج إلى مصادقة npm العادية؛ إذ إن النشر
  الموثوق يغطي مسار نشر الحزمة فقط

## تسلسل إصدار npm المستقر

عند إصدار نسخة npm مستقرة:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الكامل الحالي لفرع `main` من أجل
     تشغيل تجريبي للتحقق فقط من سير عمل الفحص المسبق
2. اختر `npm_dist_tag=beta` للتدفق المعتاد الذي يبدأ عبر beta، أو `latest` فقط
   عندما تريد عمدًا نشر نسخة مستقرة مباشرة
3. شغّل `OpenClaw Release Checks` بشكل منفصل باستخدام الوسم نفسه أو
   SHA الكامل الحالي لفرع `main` عندما تريد تغطية حية لذاكرة التخزين المؤقت للموجّه
   - هذا الفصل مقصود حتى تبقى التغطية الحية متاحة من دون
     إعادة ربط الفحوصات الطويلة أو غير المستقرة بسير عمل النشر
4. احفظ `preflight_run_id` الناجح
5. شغّل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، و`tag`
   نفسه، و`npm_dist_tag` نفسه، و`preflight_run_id` المحفوظ
6. إذا هبط الإصدار على `beta`، فشغّل `OpenClaw NPM Release` لاحقًا باستخدام
   `tag` المستقر نفسه، و`promote_beta_to_latest=true`، و`preflight_only=false`،
   و`preflight_run_id` فارغًا، و`npm_dist_tag=beta` عندما تريد نقل ذلك
   الإصدار المنشور إلى `latest`
7. إذا نُشر الإصدار مباشرةً إلى `latest` عن قصد وكان يجب أن يتبع `beta`
   البنية المستقرة نفسها، فشغّل `OpenClaw NPM Release` باستخدام `tag`
   المستقر نفسه، و`sync_stable_dist_tags=true`، و`promote_beta_to_latest=false`،
   و`preflight_only=false`، و`preflight_run_id` فارغًا، و`npm_dist_tag=latest`

لا تزال أوضاع الترقية ومزامنة dist-tag تتطلب موافقة بيئة `npm-release`
و`NPM_TOKEN` صالحًا يمكن لهذا التشغيل من سير العمل الوصول إليه.

وهذا يبقي مسار النشر المباشر ومسار الترقية الذي يبدأ عبر beta
موثّقين ومرئيين للمشغّل.

## المراجع العامة

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

يستخدم المشرفون وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
لدليل التشغيل الفعلي.
