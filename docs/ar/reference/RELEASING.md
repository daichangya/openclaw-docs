---
read_when:
    - البحث عن تعريفات قنوات الإصدار العامة
    - البحث عن تسمية الإصدارات والوتيرة
summary: قنوات الإصدار العامة، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-04-21T07:26:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# سياسة الإصدار

لدى OpenClaw ثلاثة مسارات إصدار عامة:

- stable: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند الطلب صراحةً
- beta: وسوم إصدارات تمهيدية تُنشر إلى npm `beta`
- dev: الرأس المتحرك للفرع `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: ‏`vYYYY.M.D`
- إصدار تصحيح الإصدار المستقر: `YYYY.M.D-N`
  - وسم Git: ‏`vYYYY.M.D-N`
- إصدار beta تمهيدي: `YYYY.M.D-beta.N`
  - وسم Git: ‏`vYYYY.M.D-beta.N`
- لا تضف أصفارًا بادئة للشهر أو اليوم
- `latest` تعني إصدار npm المستقر المرقّى الحالي
- `beta` تعني هدف التثبيت الحالي لـ beta
- تُنشر الإصدارات المستقرة وتصحيحات الإصدارات المستقرة إلى npm `beta` افتراضيًا؛ ويمكن لمشغلي الإصدار استهداف `latest` صراحةً، أو ترقية إصدار beta مُراجع لاحقًا
- يشحن كل إصدار مستقر من OpenClaw حزمة npm وتطبيق macOS معًا؛
  بينما تتحقق إصدارات beta عادةً من مسار حزمة npm/نشرها أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق mac للإصدار المستقر ما لم يُطلب خلاف ذلك صراحةً

## وتيرة الإصدار

- تتحرك الإصدارات وفق مبدأ beta أولًا
- ولا يتبعها stable إلا بعد التحقق من أحدث beta
- يقوم القائمون على الصيانة عادةً بقطع الإصدارات من فرع `release/YYYY.M.D`
  المُنشأ من `main` الحالي، حتى لا تمنع عمليات التحقق والإصلاح الخاصة بالإصدار
  التطوير الجديد على `main`
- إذا تم دفع أو نشر وسم beta واحتاج إلى إصلاح، يقوم القائمون على الصيانة
  بقطع الوسم التالي `-beta.N` بدلًا من حذف وسم beta القديم أو إعادة إنشائه
- إن إجراء الإصدار التفصيلي، والموافقات، وبيانات الاعتماد، وملاحظات الاسترداد
  مخصصة للقائمين على الصيانة فقط

## الفحص المسبق للإصدار

- شغّل `pnpm check:test-types` قبل الفحص المسبق للإصدار حتى يبقى TypeScript الخاص بالاختبارات
  مغطى خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل الفحص المسبق للإصدار حتى تكون
  فحوصات دورات الاستيراد الأوسع وحدود المعمارية سليمة خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى توجد
  عناصر الإصدار المتوقعة `dist/*` وحزمة Control UI من أجل خطوة
  التحقق من الحزمة
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- تُشغَّل فحوصات الإصدار الآن في سير عمل يدوي منفصل:
  `OpenClaw Release Checks`
- يتم إرسال التحقق من وقت التشغيل الخاص بالتثبيت والترقية عبر أنظمة التشغيل المختلفة من
  سير عمل الاستدعاء الخاص
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  والذي يستدعي سير العمل العام القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- وهذا الفصل مقصود: للحفاظ على مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركّزًا على العناصر، بينما تبقى الفحوصات الحية الأبطأ في
  مسارها الخاص حتى لا تؤخر أو تمنع النشر
- يجب إرسال فحوصات الإصدار من مرجع سير عمل `main` أو من
  مرجع سير عمل `release/YYYY.M.D` حتى تبقى منطقية سير العمل والأسرار
  تحت السيطرة
- يقبل هذا السير إما وسم إصدار موجودًا أو SHA كاملًا من 40 حرفًا لالتزام فرع سير العمل الحالي
- في وضع SHA الخاص بالالتزام، لا يقبل إلا HEAD الحالي لفرع سير العمل؛ استخدم
  وسم إصدار للإصدارات الأقدم
- كما أن الفحص المسبق للتحقق فقط في `OpenClaw NPM Release`
  يقبل أيضًا SHA الكامل الحالي ذي 40 حرفًا لفرع سير العمل دون الحاجة إلى وسم مدفوع
- مسار SHA هذا مخصص للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، يقوم سير العمل بتوليف `v<package.json version>` فقط
  لفحص بيانات الحزمة؛ أما النشر الحقيقي فلا يزال يتطلب وسم إصدار حقيقيًا
- يحافظ كلا سيرَي العمل على مسار النشر والترقية الحقيقي على
  GitHub-hosted runners، بينما يمكن لمسار التحقق غير المعدِّل استخدام
  Blacksmith Linux runners الأكبر
- يشغّل هذا السير
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام كل من سري سير العمل `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد الفحص المسبق لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو الوسم المطابق لإصدار beta/التصحيح) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو الإصدار المطابق لـ beta/التصحيح) للتحقق من مسار التثبيت المنشور في السجل
  داخل temp prefix جديد
- تستخدم أتمتة الإصدار الخاصة بالقائمين على الصيانة الآن نمط الفحص المسبق ثم الترقية:
  - يجب أن يمر نشر npm الحقيقي عبر `preflight_run_id` ناجح لـ npm
  - يجب إرسال نشر npm الحقيقي من الفرع نفسه `main` أو
    `release/YYYY.M.D` الذي انطلق منه تشغيل الفحص المسبق الناجح
  - إصدارات npm المستقرة تستهدف `beta` افتراضيًا
  - يمكن أن يستهدف نشر npm المستقر `latest` صراحةً عبر مدخل سير العمل
  - أصبح تعديل npm dist-tag المعتمد على الرمز موجودًا الآن في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما يحتفظ
    المستودع العام بالنشر المعتمد فقط على OIDC
  - `macOS Release` العام مخصص للتحقق فقط
  - يجب أن يمر نشر mac الخاص الحقيقي عبر تشغيلين ناجحين خاصين بـ mac:
    `preflight_run_id` و`validate_run_id`
  - تقوم مسارات النشر الحقيقية بترقية العناصر المُحضّرة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، فإن أداة التحقق بعد النشر
  تتحقق أيضًا من مسار الترقية نفسه داخل temp prefix من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار بشكل صامت عمليات التثبيت العامة الأقدم على
  حمولة الإصدار المستقر الأساسية
- يفشل الفحص المسبق لإصدار npm بوضع مغلق افتراضيًا ما لم تتضمن الحزمة كِلا
  `dist/control-ui/index.html` وحمولة غير فارغة في `dist/control-ui/assets/`
  حتى لا نشحن مرة أخرى لوحة تحكم متصفح فارغة
- يفرض `pnpm test:install:smoke` أيضًا ميزانية `unpackedSize` الخاصة بحزمة npm
  على tarball التحديث المرشح، بحيث تلتقط e2e الخاصة بالمثبّت
  تضخم الحزمة غير المقصود قبل مسار نشر الإصدار
- إذا لمس عمل الإصدار تخطيط CI أو manifests توقيت الامتدادات أو
  مصفوفات اختبار الامتدادات، فأعد توليد وراجع مخرجات مصفوفة
  سير العمل `checks-node-extensions` المملوكة للمخطط من `.github/workflows/ci.yml`
  قبل الموافقة حتى لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- تشمل جاهزية إصدار macOS المستقر أيضًا أسطح المُحدِّث:
  - يجب أن ينتهي إصدار GitHub وهو يحتوي على `.zip` و`.dmg` و`.dSYM.zip`
    المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى ملف zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المعبأ بمعرّف حزمة غير خاص بالتصحيح، وURL غير فارغ
    لخلاصة Sparkle، وقيمة `CFBundleVersion` عند أو فوق الحد الأدنى الرسمي
    لبناء Sparkle لذلك الإصدار

## مدخلات سير عمل NPM

يقبل `OpenClaw NPM Release` مدخلات يتحكم فيها المشغّل:

- `tag`: وسم الإصدار المطلوب مثل `v2026.4.2` أو `v2026.4.2-1` أو
  `v2026.4.2-beta.1`؛ وعندما يكون `preflight_only=true`، يمكن أن يكون أيضًا
  SHA الكامل الحالي ذي 40 حرفًا لالتزام فرع سير العمل من أجل فحص مسبق للتحقق فقط
- `preflight_only`: القيمة `true` من أجل التحقق/البناء/الحزمة فقط، و`false` من أجل
  مسار النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى يعيد سير العمل استخدام
  tarball المُحضّر من تشغيل الفحص المسبق الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ والقيمة الافتراضية هي `beta`

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم فيها المشغّل:

- `ref`: وسم إصدار موجود أو SHA كامل حالي من 40 حرفًا لالتزام `main`
  للتحقق عند الإرسال من `main`؛ ومن فرع الإصدار استخدم
  وسم إصدار موجودًا أو SHA كاملًا حاليًا من 40 حرفًا لالتزام فرع الإصدار

القواعد:

- يمكن لوسوم stable والتصحيحات النشر إلى `beta` أو `latest`
- لا يمكن لوسوم beta التمهيدية النشر إلا إلى `beta`
- بالنسبة إلى `OpenClaw NPM Release`، لا يُسمح بإدخال SHA الكامل للالتزام إلا عندما
  تكون `preflight_only=true`
- يكون `OpenClaw Release Checks` دائمًا للتحقق فقط ويقبل أيضًا
  SHA الحالي لالتزام فرع سير العمل
- يتطلب وضع SHA لالتزام فحوصات الإصدار أيضًا HEAD الحالي لفرع سير العمل
- يجب أن يستخدم مسار النشر الحقيقي نفس `npm_dist_tag` المستخدم أثناء الفحص المسبق؛
  ويتحقق سير العمل من هذه البيانات الوصفية قبل استمرار النشر

## تسلسل إصدار npm المستقر

عند قطع إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الكامل الحالي لالتزام فرع سير العمل
     من أجل تشغيل جاف للتحقق فقط لسير عمل الفحص المسبق
2. اختر `npm_dist_tag=beta` لتدفق beta-first العادي، أو `latest` فقط
   عندما تريد عمدًا نشر stable مباشر
3. شغّل `OpenClaw Release Checks` بشكل منفصل باستخدام الوسم نفسه أو
   SHA الكامل الحالي لفرع سير العمل عندما تريد تغطية prompt cache الحية
   - وهذا منفصل عن قصد حتى تبقى التغطية الحية متاحة من دون
     إعادة ربط الفحوصات الطويلة أو غير المستقرة بسير عمل النشر
4. احفظ `preflight_run_id` الناجح
5. شغّل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، ونفس
   `tag`، ونفس `npm_dist_tag`، و`preflight_run_id` المحفوظ
6. إذا وصل الإصدار إلى `beta`، فاستخدم سير العمل الخاص
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية هذا الإصدار المستقر من `beta` إلى `latest`
7. إذا تم نشر الإصدار عمدًا مباشرة إلى `latest` وكان من المفترض أن يتبع `beta`
   البناء المستقر نفسه فورًا، فاستخدم سير العمل الخاص نفسه لتوجيه
   كلتا علامتي dist-tags إلى الإصدار المستقر، أو دع مزامنة الإصلاح الذاتي المجدولة
   تنقل `beta` لاحقًا

يعيش تعديل dist-tag في المستودع الخاص لأسباب أمنية لأنه لا يزال
يتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بالنشر المعتمد فقط على OIDC.

وهذا يُبقي مسار النشر المباشر ومسار الترقية وفق beta-first موثقين معًا
ومرئيين للمشغّل.

## مراجع عامة

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

يستخدم القائمون على الصيانة وثائق الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
كدليل التشغيل الفعلي.
