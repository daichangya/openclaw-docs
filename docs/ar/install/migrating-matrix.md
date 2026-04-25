---
read_when:
    - ترقية تثبيت Matrix موجود
    - ترحيل سجل Matrix المشفّر وحالة الجهاز
summary: كيف يرقّي OpenClaw Plugin السابقة لـ Matrix في مكانها، بما في ذلك حدود استعادة الحالة المشفّرة وخطوات الاستعادة اليدوية.
title: ترحيل Matrix
x-i18n:
    generated_at: "2026-04-25T13:50:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

تغطي هذه الصفحة الترقيات من Plugin العامة السابقة `matrix` إلى التنفيذ الحالي.

بالنسبة إلى معظم المستخدمين، تكون الترقية في مكانها:

- يبقى Plugin باسم `@openclaw/matrix`
- تبقى القناة `matrix`
- تبقى التهيئة الخاصة بك تحت `channels.matrix`
- تبقى بيانات الاعتماد المخزنة مؤقتًا تحت `~/.openclaw/credentials/matrix/`
- تبقى حالة runtime تحت `~/.openclaw/matrix/`

لا تحتاج إلى إعادة تسمية مفاتيح التهيئة أو إعادة تثبيت Plugin باسم جديد.

## ما الذي يفعله الترحيل تلقائيًا

عندما تبدأ Gateway، وعندما تشغّل [`openclaw doctor --fix`](/ar/gateway/doctor)، يحاول OpenClaw إصلاح حالة Matrix القديمة تلقائيًا.
وقبل أن تغيّر أي خطوة ترحيل Matrix قابلة للتنفيذ الحالة الموجودة على القرص، ينشئ OpenClaw لقطة استرداد مركزة أو يعيد استخدامها.

عند استخدام `openclaw update`، يعتمد المشغّل الدقيق على كيفية تثبيت OpenClaw:

- تُشغّل تثبيتات المصدر `openclaw doctor --fix` أثناء تدفق التحديث، ثم تعيد تشغيل gateway افتراضيًا
- تُحدّث تثبيتات package-manager الحزمة، وتُشغّل مرور doctor غير تفاعلي، ثم تعتمد على إعادة تشغيل gateway الافتراضية حتى يُكمل بدء التشغيل ترحيل Matrix
- إذا استخدمت `openclaw update --no-restart`، فسيتم تأجيل ترحيل Matrix المعتمد على بدء التشغيل إلى أن تشغّل لاحقًا `openclaw doctor --fix` وتعيد تشغيل gateway

يشمل الترحيل التلقائي ما يلي:

- إنشاء لقطة قبل الترحيل أو إعادة استخدامها تحت `~/Backups/openclaw-migrations/`
- إعادة استخدام بيانات اعتماد Matrix المخزنة مؤقتًا
- الإبقاء على اختيار الحساب نفسه وتهيئة `channels.matrix`
- نقل أقدم مخزن مزامنة Matrix مسطح إلى الموقع الحالي المحدد حسب الحساب
- نقل أقدم مخزن تشفير Matrix مسطح إلى الموقع الحالي المحدد حسب الحساب عندما يمكن حل الحساب الهدف بأمان
- استخراج مفتاح فك تشفير النسخة الاحتياطية لمفاتيح غرف Matrix المحفوظ سابقًا من مخزن rust crypto القديم، عندما يكون هذا المفتاح موجودًا محليًا
- إعادة استخدام جذر تخزين hash الخاص بـ token الأكثر اكتمالًا الموجود لنفس حساب Matrix وhomeserver والمستخدم عندما يتغير access token لاحقًا
- فحص جذور تخزين hash الخاصة بـ token الشقيقة بحثًا عن بيانات وصفية معلقة لاستعادة الحالة المشفّرة عندما يكون access token الخاص بـ Matrix قد تغير لكن هوية الحساب/الجهاز بقيت كما هي
- استعادة مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير الجديد عند بدء تشغيل Matrix التالي

تفاصيل اللقطة:

- يكتب OpenClaw ملف علامة في `~/.openclaw/matrix/migration-snapshot.json` بعد نجاح إنشاء اللقطة حتى تتمكن عمليات بدء التشغيل والإصلاح اللاحقة من إعادة استخدام الأرشيف نفسه.
- تقوم لقطات ترحيل Matrix التلقائية هذه بنسخ التهيئة + الحالة فقط (`includeWorkspace: false`).
- إذا كانت Matrix تحتوي فقط على حالة ترحيل تحذيرية، مثلًا لأن `userId` أو `accessToken` لا يزالان مفقودين، فلن ينشئ OpenClaw اللقطة بعد لأن أي تغيير على Matrix ليس قابلاً للتنفيذ بعد.
- إذا فشلت خطوة اللقطة، فإن OpenClaw يتخطى ترحيل Matrix في ذلك التشغيل بدلًا من تغيير الحالة من دون نقطة استرداد.

حول الترقيات متعددة الحسابات:

- إن مخزن Matrix المسطح الأقدم (`~/.openclaw/matrix/bot-storage.json` و`~/.openclaw/matrix/crypto/`) جاء من تخطيط مخزن أحادي، لذلك لا يمكن لـ OpenClaw ترحيله إلا إلى هدف حساب Matrix واحد تم حله
- يتم اكتشاف مخازن Matrix القديمة المحددة بالفعل حسب الحساب وتحضيرها لكل حساب Matrix مهيأ

## ما الذي لا يمكن للترحيل فعله تلقائيًا

لم تكن Plugin العامة السابقة لـ Matrix **تنشئ نسخًا احتياطية لمفاتيح غرف Matrix تلقائيًا**. فقد كانت تحفظ حالة التشفير المحلية وتطلب التحقق من الجهاز، لكنها لم تضمن أن مفاتيح الغرف الخاصة بك قد نُسخت احتياطيًا إلى homeserver.

وهذا يعني أن بعض التثبيتات المشفّرة لا يمكن ترحيلها إلا جزئيًا.

لا يستطيع OpenClaw استرداد ما يلي تلقائيًا:

- مفاتيح الغرف المحلية فقط التي لم تُنسخ احتياطيًا مطلقًا
- الحالة المشفّرة عندما لا يمكن بعد حل حساب Matrix الهدف لأن `homeserver` أو `userId` أو `accessToken` لا تزال غير متاحة
- الترحيل التلقائي لمخزن Matrix مسطح مشترك واحد عندما تكون عدة حسابات Matrix مهيأة ولكن لم يتم تعيين `channels.matrix.defaultAccount`
- تثبيتات مسار Plugin المخصصة المثبتة على مسار مستودع بدلًا من حزمة Matrix القياسية
- مفتاح استرداد مفقود عندما كان المخزن القديم يحتوي على مفاتيح منسوخة احتياطيًا لكنه لم يحتفظ بمفتاح فك التشفير محليًا

نطاق التحذيرات الحالي:

- يتم إظهار تثبيتات مسار Plugin الخاصة بـ Matrix المخصصة من كل من بدء تشغيل gateway و`openclaw doctor`

إذا كان التثبيت القديم لديك يحتوي على سجل مشفّر أقدم ومحلي فقط لم يُنسخ احتياطيًا مطلقًا، فقد تظل بعض الرسائل المشفّرة الأقدم غير قابلة للقراءة بعد الترقية.

## تدفق الترقية الموصى به

1. حدّث OpenClaw وPlugin الخاصة بـ Matrix بشكل عادي.
   ويفضّل استخدام `openclaw update` العادي من دون `--no-restart` حتى يتمكن بدء التشغيل من إكمال ترحيل Matrix فورًا.
2. شغّل:

   ```bash
   openclaw doctor --fix
   ```

   إذا كانت Matrix تحتوي على عمل ترحيل قابل للتنفيذ، فسيقوم doctor بإنشاء لقطة ما قبل الترحيل أو إعادة استخدامها أولًا وسيطبع مسار الأرشيف.

3. ابدأ gateway أو أعد تشغيلها.
4. تحقق من حالة التحقق والنسخ الاحتياطي الحالية:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. إذا أخبرك OpenClaw بأن مفتاح استرداد مطلوب، فشغّل:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. إذا كان هذا الجهاز لا يزال غير متحقق منه، فشغّل:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   إذا تم قبول مفتاح الاسترداد وكانت النسخة الاحتياطية قابلة للاستخدام، لكن `Cross-signing verified`
   لا تزال `no`، فأكمل التحقق الذاتي من عميل Matrix آخر:

   ```bash
   openclaw matrix verify self
   ```

   اقبل الطلب في عميل Matrix آخر، وقارن الرموز التعبيرية أو الأرقام العشرية،
   واكتب `yes` فقط عندما تتطابق. لا يخرج الأمر بنجاح إلا
   بعد أن تصبح `Cross-signing verified` تساوي `yes`.

7. إذا كنت تتخلى عمدًا عن السجل القديم غير القابل للاسترداد وتريد خط أساس جديدًا للنسخ الاحتياطي للرسائل المستقبلية، فشغّل:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. إذا لم توجد نسخة احتياطية لمفاتيح جانب الخادم بعد، فأنشئ واحدة لعمليات الاسترداد المستقبلية:

   ```bash
   openclaw matrix verify bootstrap
   ```

## كيف يعمل الترحيل المشفّر

الترحيل المشفّر عملية من مرحلتين:

1. ينشئ بدء التشغيل أو `openclaw doctor --fix` لقطة ما قبل الترحيل أو يعيد استخدامها إذا كان الترحيل المشفّر قابلاً للتنفيذ.
2. يفحص بدء التشغيل أو `openclaw doctor --fix` مخزن تشفير Matrix القديم عبر تثبيت Plugin الحالي النشط لـ Matrix.
3. إذا تم العثور على مفتاح فك تشفير النسخة الاحتياطية، يكتبه OpenClaw في تدفق recovery-key الجديد ويعلّم استعادة مفاتيح الغرف على أنها معلقة.
4. عند بدء تشغيل Matrix التالي، يستعيد OpenClaw مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير الجديد تلقائيًا.

إذا أبلغ المخزن القديم عن مفاتيح غرف لم تُنسخ احتياطيًا مطلقًا، فإن OpenClaw يحذّر بدلًا من التظاهر بأن الاسترداد نجح.

## الرسائل الشائعة وما تعنيه

### رسائل الترقية والاكتشاف

`Matrix plugin upgraded in place.`

- المعنى: تم اكتشاف حالة Matrix القديمة على القرص وترحيلها إلى التخطيط الحالي.
- ما الذي يجب فعله: لا شيء ما لم يتضمن الإخراج نفسه تحذيرات أيضًا.

`Matrix migration snapshot created before applying Matrix upgrades.`

- المعنى: أنشأ OpenClaw أرشيف استرداد قبل تغيير حالة Matrix.
- ما الذي يجب فعله: احتفظ بمسار الأرشيف المطبوع حتى تتأكد من نجاح الترحيل.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- المعنى: عثر OpenClaw على علامة لقطة ترحيل Matrix موجودة وأعاد استخدام ذلك الأرشيف بدلًا من إنشاء نسخة احتياطية مكررة.
- ما الذي يجب فعله: احتفظ بمسار الأرشيف المطبوع حتى تتأكد من نجاح الترحيل.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- المعنى: توجد حالة Matrix قديمة، لكن OpenClaw لا يستطيع ربطها بحساب Matrix حالي لأن Matrix غير مهيأة.
- ما الذي يجب فعله: هيّئ `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: عثر OpenClaw على حالة قديمة، لكنه لا يزال غير قادر على تحديد جذر الحساب/الجهاز الحالي الدقيق.
- ما الذي يجب فعله: ابدأ gateway مرة واحدة باستخدام تسجيل دخول Matrix يعمل، أو أعد تشغيل `openclaw doctor --fix` بعد توفر بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: عثر OpenClaw على مخزن Matrix مسطح مشترك واحد، لكنه يرفض التخمين بشأن حساب Matrix المسمى الذي يجب أن يستلمه.
- ما الذي يجب فعله: اضبط `channels.matrix.defaultAccount` على الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- المعنى: يحتوي الموقع الجديد المحدد حسب الحساب بالفعل على مخزن مزامنة أو تشفير، لذلك لم يقم OpenClaw بالكتابة فوقه تلقائيًا.
- ما الذي يجب فعله: تحقّق من أن الحساب الحالي هو الحساب الصحيح قبل إزالة الهدف المتعارض أو نقله يدويًا.

`Failed migrating Matrix legacy sync store (...)` أو `Failed migrating Matrix legacy crypto store (...)`

- المعنى: حاول OpenClaw نقل حالة Matrix القديمة لكن عملية نظام الملفات فشلت.
- ما الذي يجب فعله: افحص أذونات نظام الملفات وحالة القرص، ثم أعد تشغيل `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- المعنى: عثر OpenClaw على مخزن Matrix قديم مشفّر، لكن لا توجد تهيئة Matrix حالية لإرفاقه بها.
- ما الذي يجب فعله: هيّئ `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: يوجد المخزن المشفّر، لكن OpenClaw لا يستطيع أن يقرر بأمان أي حساب/جهاز حالي ينتمي إليه.
- ما الذي يجب فعله: ابدأ gateway مرة واحدة باستخدام تسجيل دخول Matrix يعمل، أو أعد تشغيل `openclaw doctor --fix` بعد توفر بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: عثر OpenClaw على مخزن تشفير قديم مسطح ومشترك واحد، لكنه يرفض التخمين بشأن حساب Matrix المسمى الذي يجب أن يستلمه.
- ما الذي يجب فعله: اضبط `channels.matrix.defaultAccount` على الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- المعنى: اكتشف OpenClaw حالة Matrix قديمة، لكن الترحيل لا يزال محجوبًا بسبب فقدان بيانات الهوية أو بيانات الاعتماد.
- ما الذي يجب فعله: أكمل إعداد تسجيل الدخول أو تهيئة Matrix، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- المعنى: عثر OpenClaw على حالة Matrix قديمة مشفّرة، لكنه لم يتمكن من تحميل نقطة دخول الأداة المساعدة من Plugin الخاصة بـ Matrix التي تفحص ذلك المخزن عادةً.
- ما الذي يجب فعله: أعد تثبيت Plugin الخاصة بـ Matrix أو أصلحها (`openclaw plugins install @openclaw/matrix`، أو `openclaw plugins install ./path/to/local/matrix-plugin` لنسخة مستودع)، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- المعنى: عثر OpenClaw على مسار ملف أداة مساعدة يخرج خارج جذر Plugin أو يفشل في فحوصات حدود Plugin، لذلك رفض استيراده.
- ما الذي يجب فعله: أعد تثبيت Plugin الخاصة بـ Matrix من مسار موثوق، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- المعنى: رفض OpenClaw تغيير حالة Matrix لأنه لم يتمكن أولًا من إنشاء لقطة الاسترداد.
- ما الذي يجب فعله: عالج خطأ النسخ الاحتياطي، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Failed migrating legacy Matrix client storage: ...`

- المعنى: عثر fallback الخاص بجانب عميل Matrix على مخزن مسطح قديم، لكن عملية النقل فشلت. ويقوم OpenClaw الآن بإلغاء ذلك fallback بدلًا من البدء بصمت باستخدام مخزن جديد.
- ما الذي يجب فعله: افحص أذونات نظام الملفات أو التعارضات، وأبقِ الحالة القديمة سليمة، ثم أعد المحاولة بعد إصلاح الخطأ.

`Matrix is installed from a custom path: ...`

- المعنى: تم تثبيت Matrix من مسار path install، لذلك لا تستبدل التحديثات الرئيسية هذا التثبيت تلقائيًا بحزمة Matrix القياسية الخاصة بالمستودع.
- ما الذي يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix` عندما تريد العودة إلى Plugin الافتراضية لـ Matrix.

### رسائل استعادة الحالة المشفّرة

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- المعنى: تمت استعادة مفاتيح الغرف المنسوخة احتياطيًا بنجاح إلى مخزن التشفير الجديد.
- ما الذي يجب فعله: عادة لا شيء.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- المعنى: كانت بعض مفاتيح الغرف القديمة موجودة فقط في المخزن المحلي القديم ولم يتم رفعها أبدًا إلى نسخة Matrix الاحتياطية.
- ما الذي يجب فعله: توقع أن يظل بعض السجل المشفّر القديم غير متاح ما لم تتمكن من استرداد تلك المفاتيح يدويًا من عميل آخر موثّق.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- المعنى: توجد نسخة احتياطية، لكن OpenClaw لم يتمكن من استرداد مفتاح الاسترداد تلقائيًا.
- ما الذي يجب فعله: شغّل `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- المعنى: عثر OpenClaw على المخزن المشفّر القديم، لكنه لم يتمكن من فحصه بدرجة أمان كافية لتحضير الاسترداد.
- ما الذي يجب فعله: أعد تشغيل `openclaw doctor --fix`. وإذا تكرر ذلك، فأبقِ دليل الحالة القديم سليمًا واسترد باستخدام عميل Matrix آخر موثّق بالإضافة إلى `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- المعنى: اكتشف OpenClaw تعارضًا في مفتاح النسخة الاحتياطية ورفض الكتابة فوق ملف recovery-key الحالي تلقائيًا.
- ما الذي يجب فعله: تحقق من مفتاح الاسترداد الصحيح قبل إعادة محاولة أي أمر استرداد.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- المعنى: هذا هو الحد الصعب لتنسيق التخزين القديم.
- ما الذي يجب فعله: لا يزال من الممكن استعادة المفاتيح المنسوخة احتياطيًا، لكن السجل المشفّر المحلي فقط قد يظل غير متاح.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- المعنى: حاولت Plugin الجديدة إجراء الاستعادة لكن Matrix أعادت خطأ.
- ما الذي يجب فعله: شغّل `openclaw matrix verify backup status`، ثم أعد المحاولة باستخدام `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` إذا لزم الأمر.

### رسائل الاسترداد اليدوي

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- المعنى: يعرف OpenClaw أنه يجب أن يكون لديك مفتاح نسخة احتياطية، لكنه غير نشط على هذا الجهاز.
- ما الذي يجب فعله: شغّل `openclaw matrix verify backup restore`، أو مرّر `--recovery-key` إذا لزم الأمر.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- المعنى: لا يحتوي هذا الجهاز حاليًا على مفتاح الاسترداد مخزنًا.
- ما الذي يجب فعله: تحقّق من الجهاز باستخدام مفتاح الاسترداد أولًا، ثم استعد النسخة الاحتياطية.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- المعنى: المفتاح المخزن لا يطابق نسخة Matrix الاحتياطية النشطة.
- ما الذي يجب فعله: أعد تشغيل `openclaw matrix verify device "<your-recovery-key>"` باستخدام المفتاح الصحيح.

إذا كنت تقبل فقدان السجل المشفّر القديم غير القابل للاسترداد، فيمكنك بدلًا من ذلك إعادة ضبط
خط الأساس الحالي للنسخة الاحتياطية باستخدام `openclaw matrix verify backup reset --yes`. وعندما يكون
سر النسخة الاحتياطية المخزن معطّلًا، فقد تعيد عملية الضبط تلك أيضًا إنشاء secret storage بحيث
يمكن تحميل مفتاح النسخة الاحتياطية الجديد بشكل صحيح بعد إعادة التشغيل.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- المعنى: النسخة الاحتياطية موجودة، لكن هذا الجهاز لا يثق بعد بسلسلة Cross-signing بدرجة كافية.
- ما الذي يجب فعله: أعد تشغيل `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- المعنى: حاولت تنفيذ خطوة استرداد من دون تقديم مفتاح استرداد حين كان مطلوبًا.
- ما الذي يجب فعله: أعد تشغيل الأمر باستخدام مفتاح الاسترداد الخاص بك.

`Invalid Matrix recovery key: ...`

- المعنى: تعذر تحليل المفتاح المقدم أو لم يطابق الصيغة المتوقعة.
- ما الذي يجب فعله: أعد المحاولة باستخدام مفتاح الاسترداد الدقيق من عميل Matrix أو من ملف recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- المعنى: تمكن OpenClaw من تطبيق مفتاح الاسترداد، لكن Matrix لا تزال لم
  تنشئ ثقة كاملة في هوية Cross-signing لهذا الجهاز. تحقق من
  مخرجات الأمر بحثًا عن `Recovery key accepted` و`Backup usable` و
  `Cross-signing verified` و`Device verified by owner`.
- ما الذي يجب فعله: شغّل `openclaw matrix verify self`، واقبل الطلب من عميل
  Matrix آخر، وقارن SAS، واكتب `yes` فقط عندما تتطابق. وينتظر
  الأمر اكتمال ثقة هوية Matrix قبل الإبلاغ عن النجاح. استخدم
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  فقط عندما تريد عمدًا استبدال هوية Cross-signing الحالية.

`Matrix key backup is not active on this device after loading from secret storage.`

- المعنى: لم ينتج عن secret storage جلسة نسخة احتياطية نشطة على هذا الجهاز.
- ما الذي يجب فعله: تحقّق من الجهاز أولًا، ثم أعد الفحص باستخدام `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- المعنى: لا يمكن لهذا الجهاز الاستعادة من secret storage حتى يكتمل التحقق من الجهاز.
- ما الذي يجب فعله: شغّل `openclaw matrix verify device "<your-recovery-key>"` أولًا.

### رسائل تثبيت Plugin المخصصة

`Matrix is installed from a custom path that no longer exists: ...`

- المعنى: يشير سجل تثبيت Plugin لديك إلى مسار محلي لم يعد موجودًا.
- ما الذي يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix`، أو إذا كنت تعمل من نسخة مستودع، فاستخدم `openclaw plugins install ./path/to/local/matrix-plugin`.

## إذا لم يعد السجل المشفّر بعد

شغّل هذه الفحوصات بالترتيب:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

إذا تمت استعادة النسخة الاحتياطية بنجاح لكن بعض الغرف القديمة ما زالت تفتقد إلى السجل، فمن المحتمل أن تلك المفاتيح المفقودة لم تكن منسوخة احتياطيًا مطلقًا بواسطة Plugin السابقة.

## إذا كنت تريد البدء من جديد للرسائل المستقبلية

إذا كنت تقبل فقدان السجل المشفّر القديم غير القابل للاسترداد وتريد فقط خط أساس نظيفًا للنسخ الاحتياطي للمستقبل، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

إذا كان الجهاز لا يزال غير متحقق منه بعد ذلك، فأكمل التحقق من عميل Matrix الخاص بك عبر مقارنة رموز SAS التعبيرية أو الأكواد العشرية والتأكد من تطابقها.

## صفحات ذات صلة

- [Matrix](/ar/channels/matrix)
- [Doctor](/ar/gateway/doctor)
- [الترحيل](/ar/install/migrating)
- [Plugins](/ar/tools/plugin)
