---
read_when:
    - تبحث عن تعريفات قنوات الإصدار العامة
    - تبحث عن تسمية الإصدارات والوتيرة
summary: قنوات الإصدار العامة، وتسمية الإصدارات، والوتيرة
title: سياسة الإصدار
x-i18n:
    generated_at: "2026-04-25T13:57:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

لدى OpenClaw ثلاث قنوات إصدار عامة:

- stable: إصدارات موسومة تُنشر إلى npm `beta` افتراضيًا، أو إلى npm `latest` عند طلب ذلك صراحةً
- beta: وسوم إصدارات أولية تُنشر إلى npm `beta`
- dev: الرأس المتحرك لفرع `main`

## تسمية الإصدارات

- إصدار الإصدار المستقر: `YYYY.M.D`
  - وسم Git: ‏`vYYYY.M.D`
- إصدار التصحيح المستقر: `YYYY.M.D-N`
  - وسم Git: ‏`vYYYY.M.D-N`
- إصدار beta الأولي: `YYYY.M.D-beta.N`
  - وسم Git: ‏`vYYYY.M.D-beta.N`
- لا تضع أصفارًا بادئة للشهر أو اليوم
- تعني `latest` إصدار npm المستقر الحالي المُرقّى
- وتعني `beta` هدف التثبيت الحالي لإصدار beta
- تُنشر الإصدارات المستقرة وإصدارات التصحيح المستقرة إلى npm `beta` افتراضيًا؛ ويمكن لمشغّلي الإصدار استهداف `latest` صراحةً، أو ترقية بنية beta مُتحققًا منها لاحقًا
- يشحن كل إصدار مستقر من OpenClaw حزمة npm وتطبيق macOS معًا؛
  بينما تتحقق إصدارات beta وتنشر عادةً مسار حزمة npm أولًا، مع
  حجز بناء/توقيع/توثيق تطبيق Mac للإصدارات المستقرة ما لم يُطلب خلاف ذلك صراحةً

## وتيرة الإصدار

- تتحرك الإصدارات وفق مبدأ beta أولًا
- ولا يتبعها stable إلا بعد التحقق من أحدث beta
- ينشئ القائمون على الصيانة عادةً الإصدارات من فرع `release/YYYY.M.D` منشأ
  من `main` الحالي، حتى لا يحجب التحقق من الإصدار والإصلاحات التطوير الجديد على `main`
- إذا تم دفع أو نشر وسم beta واحتاج إلى إصلاح، فإن القائمين على الصيانة ينشئون
  الوسم التالي `-beta.N` بدلًا من حذف وسم beta القديم أو إعادة إنشائه
- إن إجراء الإصدار المفصل، والموافقات، وبيانات الاعتماد، وملاحظات الاستعادة
  مخصصة للقائمين على الصيانة فقط

## التحقق المسبق للإصدار

- شغّل `pnpm check:test-types` قبل التحقق المسبق للإصدار حتى تبقى TypeScript الخاصة بالاختبارات
  مغطاة خارج بوابة `pnpm check` المحلية الأسرع
- شغّل `pnpm check:architecture` قبل التحقق المسبق للإصدار حتى تكون فحوصات
  دورات الاستيراد الأوسع وحدود المعمارية خضراء خارج البوابة المحلية الأسرع
- شغّل `pnpm build && pnpm ui:build` قبل `pnpm release:check` حتى
  توجد مصنوعات الإصدار المتوقعة `dist/*` وحزمة Control UI من أجل
  خطوة التحقق من pack
- شغّل `pnpm release:check` قبل كل إصدار موسوم
- تعمل فحوصات الإصدار الآن في workflow يدوي منفصل:
  `OpenClaw Release Checks`
- ويشغّل `OpenClaw Release Checks` أيضًا بوابة parity الوهمية الخاصة بـ QA Lab بالإضافة إلى
  مسارات QA الحية لـ Matrix وTelegram قبل الموافقة على الإصدار. وتستخدم المسارات الحية
  البيئة `qa-live-shared`؛ ويستخدم Telegram أيضًا عقود إيجار بيانات اعتماد Convex CI.
- يتم إرسال التحقق من وقت التشغيل للتثبيت والترقية عبر الأنظمة التشغيلية من
  workflow المتصل الخاص
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  والذي يستدعي workflow العام القابل لإعادة الاستخدام
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- وهذا الفصل مقصود: إبقاء مسار إصدار npm الحقيقي قصيرًا،
  وحتميًا، ومركّزًا على المصنوعات، بينما تبقى الفحوصات الحية الأبطأ في
  مسارها الخاص حتى لا تؤخر النشر أو تمنعه
- يجب إرسال فحوصات الإصدار من مرجع workflow الخاص بـ `main` أو من
  مرجع workflow خاص بـ `release/YYYY.M.D` حتى تبقى منطقية workflow والأسرار
  تحت السيطرة
- تقبل تلك workflow إما وسم إصدار موجودًا أو SHA الكامل الحالي المؤلف من 40 حرفًا لالتزام فرع workflow
- في وضع commit-SHA، لا تقبل إلا HEAD الحالي لفرع workflow؛ استخدم
  وسم إصدار للالتزامات الأقدم الخاصة بالإصدار
- كما أن التحقق المسبق "للتحقق فقط" في `OpenClaw NPM Release` يقبل أيضًا
  SHA الكامل الحالي المؤلف من 40 حرفًا لالتزام فرع workflow من دون الحاجة إلى وسم مدفوع
- يكون مسار SHA هذا للتحقق فقط ولا يمكن ترقيته إلى نشر حقيقي
- في وضع SHA، تُركّب workflow الوسم `v<package.json version>` فقط من أجل فحص
  بيانات تعريف الحزمة؛ أما النشر الحقيقي فلا يزال يتطلب وسم إصدار حقيقيًا
- تُبقي كلتا workflowين مسار النشر والترقية الحقيقيين على مشغلات GitHub المستضافة، بينما يمكن لمسار التحقق غير المعدِّل أن يستخدم
  مشغلات Blacksmith Linux الأكبر
- تشغّل تلك workflow الأمر
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  باستخدام سري workflow هما `OPENAI_API_KEY` و`ANTHROPIC_API_KEY`
- لم يعد التحقق المسبق لإصدار npm ينتظر مسار فحوصات الإصدار المنفصل
- شغّل `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (أو الوسم المطابق لـ beta/التصحيح) قبل الموافقة
- بعد نشر npm، شغّل
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (أو الإصدار المطابق لـ beta/التصحيح) للتحقق من مسار التثبيت من السجل
  المنشور ضمن بادئة temp جديدة
- بعد نشر beta، شغّل `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  للتحقق من الإعداد الأولي للحزمة المثبتة، وإعداد Telegram، وTelegram E2E الحقيقي
  مقابل حزمة npm المنشورة باستخدام مجموعة بيانات اعتماد Telegram المؤجرة المشتركة.
  ويمكن للعمليات الفردية المحلية للقائمين على الصيانة حذف متغيرات Convex وتمرير
  بيانات الاعتماد البيئية الثلاث `OPENCLAW_QA_TELEGRAM_*` مباشرةً.
- ويمكن للقائمين على الصيانة تشغيل الفحص نفسه بعد النشر من خلال GitHub Actions عبر
  workflow اليدوي `NPM Telegram Beta E2E`. وهو مخصص عمدًا للوضع اليدوي فقط
  ولا يعمل عند كل دمج.
- تستخدم أتمتة الإصدار لدى القائمين على الصيانة الآن أسلوب التحقق المسبق ثم الترقية:
  - يجب أن يجتاز نشر npm الحقيقي `preflight_run_id` ناجحًا
  - يجب إرسال نشر npm الحقيقي من فرع `main` نفسه أو
    من فرع `release/YYYY.M.D` نفسه الذي خرج منه تشغيل التحقق المسبق الناجح
  - تفترض إصدارات npm المستقرة افتراضيًا الوسم `beta`
  - يمكن لنشر npm المستقر استهداف `latest` صراحةً عبر مدخلات workflow
  - تعيش الآن عملية تغيير npm dist-tag المعتمدة على token في
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    لأسباب أمنية، لأن `npm dist-tag add` لا يزال يحتاج إلى `NPM_TOKEN` بينما يحتفظ
    المستودع العام بنشر يعتمد على OIDC فقط
  - يكون `macOS Release` العام للتحقق فقط
  - يجب أن يجتاز النشر الحقيقي الخاص بالـ Mac كلًا من
    `preflight_run_id` و`validate_run_id` الخاصين بالـ Mac
  - تروّج مسارات النشر الحقيقية للمصنوعات المُحضّرة بدلًا من إعادة بنائها
    مرة أخرى
- بالنسبة إلى إصدارات التصحيح المستقرة مثل `YYYY.M.D-N`، فإن المتحقق بعد النشر
  يفحص أيضًا مسار الترقية نفسه في بادئة temp من `YYYY.M.D` إلى `YYYY.M.D-N`
  حتى لا تترك تصحيحات الإصدار بصمت عمليات التثبيت العامة الأقدم على
  حمولة الإصدار المستقر الأساسية
- يفشل التحقق المسبق لإصدار npm بإغلاق صارم ما لم يتضمن tarball كلًا من
  `dist/control-ui/index.html` وحمولة غير فارغة لـ `dist/control-ui/assets/`
  حتى لا نشحن لوحة تحكم متصفح فارغة مرة أخرى
- كما يتحقق التحقق بعد النشر أيضًا من أن التثبيت المنشور من السجل
  يحتوي على تبعيات وقت تشغيل غير فارغة لـ Plugin المضمّنة تحت التخطيط الجذري `dist/*`.
  وأي إصدار يُشحَن مع حمولات تبعيات Plugin مضمّنة مفقودة أو فارغة
  يفشل في متحقق ما بعد النشر ولا يمكن ترقيته
  إلى `latest`.
- كما يفرض `pnpm test:install:smoke` ميزانية `unpackedSize` الخاصة بـ npm pack على
  tarball التحديث المرشح، بحيث تلتقط اختبارات installer e2e
  التضخم غير المقصود في pack قبل مسار نشر الإصدار
- إذا لامس عمل الإصدار تخطيط CI، أو بيانات توقيت extensions manifest، أو
  مصفوفات اختبارات extensions، فأعد توليد ومراجعة
  مخرجات مصفوفة workflow `checks-node-extensions` المملوكة للمخطط من `.github/workflows/ci.yml`
  قبل الموافقة حتى لا تصف ملاحظات الإصدار تخطيط CI قديمًا
- يشمل استعداد الإصدار المستقر لـ macOS أيضًا أسطح برنامج التحديث:
  - يجب أن ينتهي إصدار GitHub بملفات `.zip` و`.dmg` و`.dSYM.zip` المعبأة
  - يجب أن يشير `appcast.xml` على `main` إلى zip المستقر الجديد بعد النشر
  - يجب أن يحتفظ التطبيق المعبأ بمعرّف bundle غير تصحيحي، وعنوان
    Sparkle feed غير فارغ، و`CFBundleVersion` مساوٍ أو أعلى من الحد الأدنى
    القياسي لبنية Sparkle لذلك الإصدار

## مدخلات workflow الخاصة بـ NPM

يقبل `OpenClaw NPM Release` مدخلات يتحكم فيها المشغّل:

- `tag`: وسم الإصدار المطلوب مثل `v2026.4.2`، أو `v2026.4.2-1`، أو
  `v2026.4.2-beta.1`؛ وعندما تكون `preflight_only=true`، يمكن أن يكون أيضًا
  SHA الكامل الحالي المؤلف من 40 حرفًا لالتزام فرع workflow من أجل التحقق المسبق فقط
- `preflight_only`: ‏`true` للتحقق/البناء/الحزم فقط، و`false` من أجل
  مسار النشر الحقيقي
- `preflight_run_id`: مطلوب في مسار النشر الحقيقي حتى تعيد workflow استخدام
  tarball المُحضَّر من تشغيل التحقق المسبق الناجح
- `npm_dist_tag`: وسم npm المستهدف لمسار النشر؛ والافتراضي هو `beta`

يقبل `OpenClaw Release Checks` هذه المدخلات التي يتحكم فيها المشغّل:

- `ref`: وسم إصدار موجود أو SHA الكامل الحالي المؤلف من 40 حرفًا لالتزام `main`
  للتحقق عند الإرسال من `main`؛ أما من فرع إصدار، فاستخدم
  وسم إصدار موجودًا أو SHA الكامل الحالي المؤلف من 40 حرفًا لالتزام فرع الإصدار

القواعد:

- يمكن لوسوم الإصدارات المستقرة والتصحيحية النشر إلى `beta` أو `latest`
- لا يمكن لوسوم beta الأولية النشر إلا إلى `beta`
- بالنسبة إلى `OpenClaw NPM Release`، يُسمح بإدخال commit SHA الكامل فقط عندما تكون
  `preflight_only=true`
- تكون `OpenClaw Release Checks` للتحقق فقط دائمًا وتقبل أيضًا
  SHA الخاص بالتزام فرع workflow الحالي
- كما يتطلب وضع commit-SHA في فحوصات الإصدار HEAD الحالي لفرع workflow أيضًا
- يجب أن يستخدم مسار النشر الحقيقي `npm_dist_tag` نفسه المستخدم أثناء التحقق المسبق؛
  وتتحقق workflow من استمرار هذه البيانات الوصفية قبل النشر

## تسلسل إصدار npm المستقر

عند إنشاء إصدار npm مستقر:

1. شغّل `OpenClaw NPM Release` مع `preflight_only=true`
   - قبل وجود وسم، يمكنك استخدام SHA الكامل الحالي لالتزام فرع workflow
     لإجراء تشغيل جاف للتحقق فقط من workflow التحقق المسبق
2. اختر `npm_dist_tag=beta` من أجل التدفق العادي الذي يبدأ بـ beta، أو `latest` فقط
   عندما تريد عمدًا نشرًا مستقِرًا مباشرًا
3. شغّل `OpenClaw Release Checks` بشكل منفصل باستخدام الوسم نفسه أو
   SHA الكامل الحالي لالتزام فرع workflow عندما تريد تغطية prompt cache الحية،
   وQA Lab parity، وMatrix، وTelegram
   - وهذا منفصل عمدًا حتى تبقى التغطية الحية متاحة من دون
     إعادة ربط الفحوصات الطويلة أو المتقلبة بـ workflow النشر
4. احفظ `preflight_run_id` الناجح
5. شغّل `OpenClaw NPM Release` مرة أخرى مع `preflight_only=false`، وباستخدام
   `tag` نفسه، و`npm_dist_tag` نفسه، و`preflight_run_id` المحفوظ
6. إذا نزل الإصدار على `beta`، فاستخدم
   workflow الخاص `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   لترقية ذلك الإصدار المستقر من `beta` إلى `latest`
7. إذا نُشر الإصدار عمدًا مباشرة إلى `latest` وكان ينبغي أن يتبعه `beta`
   بالبنية المستقرة نفسها فورًا، فاستخدم workflow الخاص نفسه
   لتوجيه كلا dist-tagين إلى الإصدار المستقر، أو اترك مزامنة الإصلاح الذاتي المجدولة
   تنقل `beta` لاحقًا

تعيش عملية تغيير dist-tag في المستودع الخاص لأسباب أمنية لأنها لا تزال
تتطلب `NPM_TOKEN`، بينما يحتفظ المستودع العام بنشر يعتمد على OIDC فقط.

وهذا يُبقي كلاً من مسار النشر المباشر ومسار الترقية الذي يبدأ بـ beta موثقين
ومرئيين للمشغّل.

إذا اضطر أحد القائمين على الصيانة إلى الرجوع إلى مصادقة npm محلية، فشغّل أي أوامر
1Password CLI (`op`) داخل جلسة tmux مخصصة فقط. ولا تستدعِ `op`
مباشرة من shell الوكيل الرئيسي؛ فإبقاؤه داخل tmux يجعل المطالبات،
والتنبيهات، ومعالجة OTP قابلة للملاحظة ويمنع تنبيهات المضيف المتكررة.

## مراجع عامة

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

يستخدم القائمون على الصيانة مستندات الإصدار الخاصة في
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
كدليل التشغيل الفعلي.

## ذو صلة

- [قنوات الإصدار](/ar/install/development-channels)
