---
read_when:
    - إعداد Matrix في OpenClaw
    - تهيئة Matrix E2EE والتحقق
summary: حالة دعم Matrix، وأمثلة الإعداد والتهيئة
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix هو Plugin قناة مضمّن لـ OpenClaw.
وهو يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، وسلاسل الرسائل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، وE2EE.

## Plugin مضمّن

يأتي Matrix كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذا فإن
البنى المجمعة العادية لا تحتاج إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد Matrix، فقم بتثبيته
يدويًا:

التثبيت من npm:

```bash
openclaw plugins install @openclaw/matrix
```

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك Plugin وقواعد التثبيت.

## الإعداد

1. تأكد من أن Plugin الخاص بـ Matrix متاح.
   - إصدارات OpenClaw المجمعة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم أو المخصصة إضافته يدويًا بالأوامر أعلاه.
2. أنشئ حساب Matrix على الخادم المنزلي الخاص بك.
3. هيّئ `channels.matrix` باستخدام أحد الخيارين التاليين:
   - `homeserver` + `accessToken`، أو
   - `homeserver` + `userId` + `password`.
4. أعد تشغيل Gateway.
5. ابدأ رسالة مباشرة مع الروبوت أو ادعه إلى غرفة.
   - لا تعمل دعوات Matrix الجديدة إلا عندما يسمح `channels.matrix.autoJoin` بها.

مسارات الإعداد التفاعلية:

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب معالج Matrix ما يلي:

- عنوان URL للخادم المنزلي
- طريقة المصادقة: access token أو كلمة المرور
- معرّف المستخدم (لمصادقة كلمة المرور فقط)
- اسم الجهاز الاختياري
- ما إذا كان يجب تمكين E2EE
- ما إذا كان يجب تكوين الوصول إلى الغرف والانضمام التلقائي للدعوات

السلوكيات الأساسية للمعالج:

- إذا كانت متغيرات بيئة مصادقة Matrix موجودة بالفعل وكان هذا الحساب لا يحتوي بالفعل على مصادقة محفوظة في الإعدادات، فسيعرض المعالج اختصارًا للبيئة للإبقاء على المصادقة في متغيرات البيئة.
- تُطبَّع أسماء الحسابات إلى معرّف الحساب. على سبيل المثال، يتحول `Ops Bot` إلى `ops-bot`.
- تقبل إدخالات قائمة السماح للرسائل المباشرة `@user:server` مباشرة؛ ولا تعمل أسماء العرض إلا عندما يعثر البحث الحي في الدليل على تطابق واحد دقيق.
- تقبل إدخالات قائمة السماح للغرف معرّفات الغرف والأسماء المستعارة مباشرة. فضّل `!room:server` أو `#alias:server`؛ ويتم تجاهل الأسماء غير المحلولة وقت التشغيل أثناء تحليل قائمة السماح.
- في وضع قائمة السماح للانضمام التلقائي للدعوات، استخدم فقط أهداف الدعوة الثابتة: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية.
- لتحليل أسماء الغرف قبل الحفظ، استخدم `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`.

إذا تركته غير معيّن، فلن ينضم الروبوت إلى الغرف المدعو إليها أو إلى دعوات الرسائل المباشرة الجديدة، لذلك لن يظهر في المجموعات الجديدة أو الرسائل المباشرة المدعو إليها ما لم تنضم يدويًا أولًا.

عيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها، أو عيّن `autoJoin: "always"` إذا كنت تريد أن ينضم إلى كل دعوة.

في وضع `allowlist`، لا يقبل `autoJoinAllowlist` إلا `!roomId:server` أو `#alias:server` أو `*`.
</Warning>

مثال على قائمة السماح:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

الانضمام إلى كل دعوة:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

إعداد بسيط قائم على token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

إعداد قائم على كلمة المرور (يُخزَّن token مؤقتًا بعد تسجيل الدخول):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

يخزن Matrix بيانات الاعتماد المؤقتة في `~/.openclaw/credentials/matrix/`.
يستخدم الحساب الافتراضي `credentials.json`؛ وتستخدم الحسابات المسماة `credentials-<account>.json`.
عندما تكون بيانات الاعتماد المؤقتة موجودة هناك، يتعامل OpenClaw مع Matrix على أنه مُهيأ لأغراض الإعداد، وdoctor، واكتشاف حالة القناة حتى إذا لم تكن المصادقة الحالية معيّنة مباشرة في الإعدادات.

مكافئات متغيرات البيئة (تُستخدم عندما لا يكون مفتاح الإعداد معينًا):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

للحسابات غير الافتراضية، استخدم متغيرات البيئة الخاصة بنطاق الحساب:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

مثال للحساب `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

بالنسبة إلى معرّف الحساب المطبّع `ops-bot`، استخدم:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

يقوم Matrix بتهريب علامات الترقيم في معرّفات الحسابات للحفاظ على عدم تعارض متغيرات البيئة ذات النطاق.
على سبيل المثال، تتحول `-` إلى `_X2D_`، لذلك يتحول `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

لا يعرض المعالج التفاعلي اختصار متغيرات البيئة إلا عندما تكون متغيرات بيئة المصادقة تلك موجودة بالفعل ولا يكون الحساب المحدد يحتوي بالفعل على مصادقة Matrix محفوظة في الإعدادات.

لا يمكن تعيين `MATRIX_HOMESERVER` من ملف `.env` خاص بمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## مثال على التهيئة

هذا إعداد أساسي عملي يتضمن pairing للرسائل المباشرة، وقائمة سماح للغرف، وتمكين E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

ينطبق `autoJoin` على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل المباشرة. لا يستطيع OpenClaw
تصنيف الغرفة المدعو إليها بشكل موثوق على أنها رسالة مباشرة أو مجموعة وقت الدعوة، لذلك تمر جميع الدعوات عبر `autoJoin`
أولًا. ويُطبّق `dm.policy` بعد انضمام الروبوت وتصنيف الغرفة كرسالة مباشرة.

## معاينات البث

بث الردود في Matrix هو خيار اشتراك صريح.

عيّن `channels.matrix.streaming` إلى `"partial"` عندما تريد أن يرسل OpenClaw رد معاينة مباشرًا واحدًا،
ويعدّل هذه المعاينة في مكانها أثناء قيام النموذج بإنشاء النص، ثم يُنهيها عندما
يكتمل الرد:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` هو الوضع الافتراضي. ينتظر OpenClaw الرد النهائي ويرسله مرة واحدة.
- `streaming: "partial"` ينشئ رسالة معاينة واحدة قابلة للتحرير لكتلة المساعد الحالية باستخدام رسائل Matrix النصية العادية. هذا يحافظ على سلوك الإشعارات القديم في Matrix الذي يعتمد على المعاينة أولًا، لذلك قد تُرسل التطبيقات القياسية إشعارًا عند أول نص معاينة متدفق بدلًا من الكتلة النهائية.
- `streaming: "quiet"` ينشئ إشعار معاينة هادئًا واحدًا قابلًا للتحرير لكتلة المساعد الحالية. استخدم هذا فقط عندما تُهيّئ أيضًا قواعد دفع لدى المستلمين لتعديلات المعاينة النهائية.
- يفعّل `blockStreaming: true` رسائل تقدم منفصلة في Matrix. ومع تمكين بث المعاينة، يحتفظ Matrix بالمسودة المباشرة للكتلة الحالية ويحافظ على الكتل المكتملة كرسائل منفصلة.
- عندما يكون بث المعاينة مفعّلًا ويكون `blockStreaming` معطّلًا، يقوم Matrix بتحرير المسودة المباشرة في مكانها وينهي الحدث نفسه عند اكتمال الكتلة أو الدور.
- إذا لم تعد المعاينة تتسع داخل حدث Matrix واحد، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي العادي.
- تظل ردود الوسائط ترسل المرفقات بشكل عادي. وإذا تعذر إعادة استخدام معاينة قديمة بأمان، يقوم OpenClaw بحذفها قبل إرسال رد الوسائط النهائي.
- تتطلب تعديلات المعاينة طلبات إضافية إلى Matrix API. اترك البث معطّلًا إذا كنت تريد السلوك الأكثر تحفظًا تجاه حدود المعدل.

لا يفعّل `blockStreaming` معاينات المسودات بمفرده.
استخدم `streaming: "partial"` أو `streaming: "quiet"` لتعديلات المعاينة؛ ثم أضف `blockStreaming: true` فقط إذا كنت تريد أيضًا أن تظل كتل المساعد المكتملة مرئية كرسائل تقدم منفصلة.

إذا كنت تحتاج إلى إشعارات Matrix القياسية من دون قواعد دفع مخصصة، فاستخدم `streaming: "partial"` لسلوك المعاينة أولًا أو اترك `streaming` معطّلًا للتسليم النهائي فقط. مع `streaming: "off"`:

- يرسل `blockStreaming: true` كل كتلة مكتملة كرسالة Matrix عادية مُرسِلة للإشعارات.
- يرسل `blockStreaming: false` الرد النهائي المكتمل فقط كرسالة Matrix عادية مُرسِلة للإشعارات.

### قواعد دفع ذاتية الاستضافة للمعاينات الهادئة النهائية

لا يرسل البث الهادئ (`streaming: "quiet"`) إشعارًا للمستلمين إلا مرة واحدة عند إنهاء كتلة أو دور — يجب أن تطابق قاعدة دفع لكل مستخدم علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للحصول على الإعداد الكامل (token المستلم، وفحص pusher، وتثبيت القاعدة، والملاحظات الخاصة بكل homeserver).

## غرف bot-to-bot

بشكل افتراضي، يتم تجاهل رسائل Matrix القادمة من حسابات OpenClaw Matrix أخرى مُهيأة.

استخدم `allowBots` عندما تريد عمدًا حركة Matrix بين الوكلاء:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- يقبل `allowBots: true` الرسائل من حسابات روبوت Matrix أخرى مُهيأة في الغرف المسموح بها والرسائل المباشرة.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا الروبوت بوضوح في الغرف. وتظل الرسائل المباشرة مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- لا يزال OpenClaw يتجاهل الرسائل من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفّر Matrix هنا علامة روبوت أصلية؛ ويتعامل OpenClaw مع "مكتوب بواسطة روبوت" على أنه "مرسل بواسطة حساب Matrix مُهيأ آخر على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تمكين حركة bot-to-bot في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تُشفَّر معاينات الصور مع المرفق الكامل. وتظل الغرف غير المشفرة تستخدم `thumbnail_url` العادي. لا حاجة إلى أي تهيئة — يكتشف Plugin حالة E2EE تلقائيًا.

تمكين التشفير:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

أوامر التحقق (تقبل جميعها `--verbose` للتشخيصات و`--json` لمخرجات قابلة للقراءة الآلية):

```bash
openclaw matrix verify status
```

الحالة المفصلة (تشخيصات كاملة):

```bash
openclaw matrix verify status --verbose
```

تضمين مفتاح الاسترداد المخزن في مخرجات قابلة للقراءة الآلية:

```bash
openclaw matrix verify status --include-recovery-key --json
```

تهيئة حالة cross-signing والتحقق:

```bash
openclaw matrix verify bootstrap
```

تشخيصات bootstrap المفصلة:

```bash
openclaw matrix verify bootstrap --verbose
```

فرض إعادة تعيين جديدة لهوية cross-signing قبل bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

تحقق من هذا الجهاز باستخدام مفتاح استرداد:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

يبلغ هذا الأمر عن ثلاث حالات منفصلة:

- `Recovery key accepted`: قبل Matrix مفتاح الاسترداد للتخزين السري أو ثقة الجهاز.
- `Backup usable`: يمكن تحميل النسخة الاحتياطية لمفاتيح الغرفة باستخدام مادة استرداد موثوق بها.
- `Device verified by owner`: يتمتع جهاز OpenClaw الحالي بثقة كاملة لهوية Matrix عبر cross-signing.

إن `Signed by owner` في المخرجات المفصلة أو JSON هو للتشخيص فقط. لا يتعامل OpenClaw
مع ذلك على أنه كافٍ ما لم يكن `Cross-signing verified` أيضًا `yes`.

لا يزال الأمر ينتهي برمز غير صفري عندما لا تكتمل ثقة هوية Matrix الكاملة،
حتى إذا كان مفتاح الاسترداد قادرًا على فتح مادة النسخ الاحتياطي. في هذه الحالة، أكمل
التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

اقبل الطلب في عميل Matrix آخر، وقارن رموز SAS التعبيرية أو الأرقام العشرية،
واكتب `yes` فقط عندما تتطابق. ينتظر الأمر حتى يبلّغ Matrix عن
`Cross-signing verified: yes` قبل أن ينتهي بنجاح.

استخدم `verify bootstrap --force-reset-cross-signing` فقط عندما تريد عمدًا
استبدال هوية cross-signing الحالية.

تفاصيل التحقق المفصلة للجهاز:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

تحقق من سلامة النسخ الاحتياطي لمفاتيح الغرفة:

```bash
openclaw matrix verify backup status
```

تشخيصات سلامة النسخ الاحتياطي المفصلة:

```bash
openclaw matrix verify backup status --verbose
```

استعادة مفاتيح الغرفة من النسخة الاحتياطية على الخادم:

```bash
openclaw matrix verify backup restore
```

تدفق التحقق الذاتي التفاعلي:

```bash
openclaw matrix verify self
```

بالنسبة إلى الطلبات ذات المستوى الأدنى أو طلبات التحقق الواردة، استخدم:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

استخدم `openclaw matrix verify cancel <id>` لإلغاء طلب.

تشخيصات الاستعادة المفصلة:

```bash
openclaw matrix verify backup restore --verbose
```

احذف النسخة الاحتياطية الحالية على الخادم وأنشئ خط أساس جديدًا للنسخ الاحتياطي. إذا تعذر
تحميل مفتاح النسخ الاحتياطي المخزن بشكل سليم، فيمكن أن تعيد عملية إعادة الضبط هذه أيضًا إنشاء التخزين السري بحيث
تتمكن عمليات التشغيل البارد المستقبلية من تحميل مفتاح النسخ الاحتياطي الجديد:

```bash
openclaw matrix verify backup reset --yes
```

تكون جميع أوامر `verify` موجزة افتراضيًا (بما في ذلك تسجيلات SDK الداخلية الهادئة) وتعرض تشخيصات مفصلة فقط مع `--verbose`.
استخدم `--json` للحصول على مخرجات كاملة قابلة للقراءة آليًا عند إعداد النصوص البرمجية.

في إعدادات الحسابات المتعددة، تستخدم أوامر Matrix CLI حساب Matrix الافتراضي الضمني ما لم تمرر `--account <id>`.
إذا قمت بتهيئة عدة حسابات مسماة، فعيّن `channels.matrix.defaultAccount` أولًا وإلا ستتوقف عمليات CLI الضمنية تلك وتطلب منك اختيار حساب بشكل صريح.
استخدم `--account` كلما أردت أن تستهدف عمليات التحقق أو الجهاز حسابًا مسمى بشكل صريح:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

عندما يكون التشفير معطلًا أو غير متاح لحساب مسمى، تشير تحذيرات Matrix وأخطاء التحقق إلى مفتاح إعدادات ذلك الحساب، على سبيل المثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="ما معنى verified">
    يتعامل OpenClaw مع الجهاز على أنه verified فقط عندما توقّع عليه هوية cross-signing الخاصة بك. يكشف `verify status --verbose` عن ثلاث إشارات ثقة:

    - `Locally trusted`: موثوق به بواسطة هذا العميل فقط
    - `Cross-signing verified`: يبلّغ SDK عن التحقق عبر cross-signing
    - `Signed by owner`: موقّع بواسطة مفتاح self-signing الخاص بك

    تصبح `Verified by owner` مساوية لـ `yes` فقط عند وجود تحقق cross-signing.
    لا تكفي الثقة المحلية أو توقيع المالك وحده لكي يعتبر OpenClaw
    الجهاز موثقًا بالكامل.

  </Accordion>

  <Accordion title="ما الذي يفعله bootstrap">
    إن `verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفرة. وبالترتيب، فإنه:

    - يهيّئ التخزين السري، مع إعادة استخدام مفتاح استرداد موجود عند الإمكان
    - يهيّئ cross-signing ويرفع مفاتيح cross-signing العامة المفقودة
    - يضع علامة على الجهاز الحالي ويوقّعه عبر cross-signing
    - ينشئ نسخة احتياطية لمفاتيح الغرفة على جانب الخادم إذا لم تكن موجودة بالفعل

    إذا كان homeserver يتطلب UIA لرفع مفاتيح cross-signing، يحاول OpenClaw أولًا بدون مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`). استخدم `--force-reset-cross-signing` فقط عند التخلص عمدًا من الهوية الحالية.

  </Accordion>

  <Accordion title="خط أساس جديد للنسخ الاحتياطي">
    إذا كنت تريد الحفاظ على عمل الرسائل المشفرة المستقبلية وتقبّل فقدان السجل القديم غير القابل للاسترداد:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    أضف `--account <id>` لاستهداف حساب مسمى. يمكن أن تعيد هذه العملية أيضًا إنشاء التخزين السري إذا تعذر تحميل سر النسخ الاحتياطي الحالي بأمان.

  </Accordion>

  <Accordion title="سلوك بدء التشغيل">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب جهاز غير موثّق التحقق الذاتي في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة. اضبطه باستخدام `startupVerificationCooldownHours` أو عطّله باستخدام `startupVerification: "off"`.

    يشغّل بدء التشغيل أيضًا تمريرة bootstrap متحفظة للتشفير تعيد استخدام التخزين السري الحالي وهوية cross-signing الحالية. إذا كانت حالة bootstrap معطلة، يحاول OpenClaw إصلاحًا محروسًا حتى بدون `channels.matrix.password`؛ وإذا كان homeserver يتطلب UIA بكلمة مرور، يسجل بدء التشغيل تحذيرًا ويبقى غير قاتل. ويتم الحفاظ على الأجهزة الموقعة بالفعل من قبل المالك.

    راجع [ترحيل Matrix](/ar/install/migrating-matrix) للاطلاع على تدفق الترقية الكامل.

  </Accordion>

  <Accordion title="إشعارات التحقق">
    ينشر Matrix إشعارات دورة حياة التحقق داخل غرفة الرسائل المباشرة الصارمة الخاصة بالتحقق كرسائل `m.notice`: الطلب، والجاهزية (مع إرشادات "التحقق بواسطة الرموز التعبيرية")، والبدء/الاكتمال، وتفاصيل SAS (الرموز التعبيرية/الأرقام العشرية) عندما تكون متاحة.

    يتم تتبع الطلبات الواردة من عميل Matrix آخر وقبولها تلقائيًا. بالنسبة إلى التحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيًا ويؤكد جانبه هو بمجرد أن يصبح التحقق بالرموز التعبيرية متاحًا — وما زلت بحاجة إلى المقارنة وتأكيد "They match" في عميل Matrix الخاص بك.

    لا يتم تمرير إشعارات نظام التحقق إلى خط أنابيب دردشة الوكيل.

  </Accordion>

  <Accordion title="نظافة الأجهزة">
    يمكن أن تتراكم الأجهزة القديمة التي يديرها OpenClaw. اعرضها وقم بتقليص القديمة:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="مخزن التشفير">
    يستخدم Matrix E2EE مسار التشفير Rust الرسمي الخاص بـ `matrix-js-sdk` مع `fake-indexeddb` كطبقة IndexedDB بديلة. تستمر حالة التشفير في `crypto-idb-snapshot.json` (مع أذونات ملفات مقيّدة).

    تعيش حالة وقت التشغيل المشفرة ضمن `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتتضمن مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وروابط سلاسل الرسائل، وحالة التحقق عند بدء التشغيل. عندما يتغير token بينما تظل هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود بحيث تظل الحالة السابقة مرئية.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي لـ Matrix للحساب المحدد باستخدام:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

أضف `--account <id>` عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

يقبل Matrix عناوين URL للصورة الرمزية بصيغة `mxc://` مباشرة. عندما تمرر عنوان URL للصورة الرمزية بصيغة `http://` أو `https://`، يقوم OpenClaw برفعه إلى Matrix أولًا ويخزن عنوان URL المحلول بصيغة `mxc://` مرة أخرى في `channels.matrix.avatarUrl` (أو تجاوز الحساب المحدد).

## سلاسل الرسائل

يدعم Matrix سلاسل رسائل Matrix الأصلية لكل من الردود التلقائية وإرسالات أداة الرسائل.

- يحافظ `dm.sessionScope: "per-user"` (الافتراضي) على توجيه الرسائل المباشرة في Matrix ضمن نطاق المرسل، بحيث يمكن لعدة غرف رسائل مباشرة مشاركة جلسة واحدة عندما تُحل إلى النظير نفسه.
- يعزل `dm.sessionScope: "per-room"` كل غرفة رسائل مباشرة في Matrix في مفتاح جلسة خاص بها مع الاستمرار في استخدام مصادقة الرسائل المباشرة العادية وفحوصات قائمة السماح.
- لا تزال روابط محادثات Matrix الصريحة تتغلب على `dm.sessionScope`، لذلك تحتفظ الغرف وسلاسل الرسائل المرتبطة بالجلسة المستهدفة المختارة.
- يحافظ `threadReplies: "off"` على الردود في المستوى الأعلى ويبقي الرسائل الواردة ضمن سلاسل الرسائل على الجلسة الأصلية.
- يرد `threadReplies: "inbound"` داخل سلسلة رسائل فقط عندما تكون الرسالة الواردة أصلًا داخل تلك السلسلة.
- يحافظ `threadReplies: "always"` على ردود الغرف داخل سلسلة رسائل متجذرة في الرسالة المُشغِّلة ويوجه تلك المحادثة عبر الجلسة المطابقة ذات نطاق سلسلة الرسائل من أول رسالة مُشغِّلة.
- يتجاوز `dm.threadReplies` الإعداد الأعلى مستوى للرسائل المباشرة فقط. على سبيل المثال، يمكنك إبقاء سلاسل رسائل الغرف معزولة مع إبقاء الرسائل المباشرة مسطحة.
- تتضمن الرسائل الواردة ضمن سلاسل الرسائل رسالة جذر السلسلة كسياق إضافي للوكيل.
- ترث إرسالات أداة الرسائل تلقائيًا سلسلة رسائل Matrix الحالية عندما يكون الهدف هو الغرفة نفسها، أو هدف مستخدم الرسائل المباشرة نفسه، ما لم يتم توفير `threadId` صراحةً.
- لا يُفعّل إعادة استخدام هدف مستخدم الرسائل المباشرة ضمن الجلسة نفسها إلا عندما تثبت بيانات تعريف الجلسة الحالية النظير نفسه للرسائل المباشرة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ضمن نطاق المستخدم.
- عندما يكتشف OpenClaw أن غرفة رسائل Matrix مباشرة تتصادم مع غرفة رسائل مباشرة أخرى على جلسة الرسائل المباشرة المشتركة نفسها في Matrix، فإنه ينشر رسالة `m.notice` لمرة واحدة في تلك الغرفة مع منفذ الهروب `/focus` عندما تكون روابط سلاسل الرسائل مفعّلة وتلميح `dm.sessionScope`.
- روابط سلاسل الرسائل وقت التشغيل مدعومة في Matrix. تعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبط بسلسلة الرسائل في غرف Matrix ورسائله المباشرة.
- ينشئ `/focus` في المستوى الأعلى لغرفة/رسالة Matrix مباشرة سلسلة رسائل Matrix جديدة ويربطها بالجلسة المستهدفة عندما يكون `threadBindings.spawnSubagentSessions=true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة رسائل Matrix موجودة بالفعل إلى ربط سلسلة الرسائل الحالية تلك بدلًا من ذلك.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وسلاسل رسائل Matrix الموجودة إلى مساحات عمل ACP مستدامة من دون تغيير سطح الدردشة.

تدفق سريع للمشغل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو الغرفة أو سلسلة الرسائل الموجودة في Matrix التي تريد الاستمرار في استخدامها.
- في رسالة Matrix مباشرة أو غرفة من المستوى الأعلى، يظل سطح الدردشة هو الرسالة المباشرة/الغرفة الحالية وتُوجَّه الرسائل المستقبلية إلى جلسة ACP المنشأة.
- داخل سلسلة رسائل Matrix موجودة، يقوم `--bind here` بربط سلسلة الرسائل الحالية في مكانها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة رسائل Matrix فرعية.
- لا يكون `threadBindings.spawnAcpSessions` مطلوبًا إلا مع `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة رسائل Matrix فرعية أو ربطها.

### تهيئة ربط سلاسل الرسائل

يرث Matrix القيم الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

علامات الإنشاء المرتبط بسلاسل الرسائل في Matrix هي اشتراك صريح:

- عيّن `threadBindings.spawnSubagentSessions: true` للسماح لـ `/focus` في المستوى الأعلى بإنشاء سلاسل رسائل Matrix جديدة وربطها.
- عيّن `threadBindings.spawnAcpSessions: true` للسماح لـ `/acp spawn --thread auto|here` بربط جلسات ACP بسلاسل رسائل Matrix.

## التفاعلات

يدعم Matrix إجراءات التفاعل الصادرة، وإشعارات التفاعل الواردة، وتفاعلات الإقرار الواردة.

- تخضع أدوات التفاعل الصادرة إلى `channels["matrix"].actions.reactions`.
- يضيف `react` تفاعلًا إلى حدث Matrix محدد.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix محدد.
- يؤدي `emoji=""` إلى إزالة تفاعلات حساب الروبوت نفسه على ذلك الحدث.
- يؤدي `remove: true` إلى إزالة تفاعل الرمز التعبيري المحدد فقط من حساب الروبوت.

يستخدم نطاق تفاعلات الإقرار ترتيب الحل القياسي في OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- الرجوع إلى الرمز التعبيري لهوية الوكيل

يُحل نطاق تفاعل الإقرار بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

يُحل وضع إشعارات التفاعل بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- الافتراضي: `own`

السلوك:

- `reactionNotifications: "own"` يعيد توجيه أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي أنشأها الروبوت.
- `reactionNotifications: "off"` يعطل أحداث نظام التفاعلات.
- لا تُحوَّل عمليات إزالة التفاعل إلى أحداث نظام، لأن Matrix يعرضها كعمليات redaction، وليس كعمليات إزالة `m.reaction` مستقلة.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة التي تُضمَّن كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. ويرجع إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أيٌّ منهما معينًا، فالقيمة الافتراضية الفعلية هي `0`. عيّن `0` للتعطيل.
- سجل غرفة Matrix خاص بالغرفة فقط. وتستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- سجل غرفة Matrix خاص بالرسائل المعلقة فقط: يقوم OpenClaw بتخزين رسائل الغرفة التي لم تؤدِّ بعد إلى تشغيل رد، ثم يلتقط لقطة لتلك النافذة عندما يصل mention أو مشغّل آخر.
- لا تُدرج رسالة المشغّل الحالية ضمن `InboundHistory`؛ بل تبقى في متن الرسالة الواردة الرئيسي لذلك الدور.
- تعيد محاولات الحدث نفسه في Matrix استخدام لقطة السجل الأصلية بدلًا من الانجراف إلى رسائل غرفة أحدث.

## ظهور السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` للسياق الإضافي للغرفة، مثل نص الرد الذي تم جلبه، وجذور سلاسل الرسائل، والسجل المعلق.

- `contextVisibility: "all"` هو الإعداد الافتراضي. يتم الاحتفاظ بالسياق الإضافي كما تم استلامه.
- `contextVisibility: "allowlist"` يرشّح السياق الإضافي إلى المرسلين المسموح لهم وفقًا لفحوصات قائمة السماح النشطة للغرفة/المستخدم.
- `contextVisibility: "allowlist_quote"` يعمل مثل `allowlist`، لكنه يحتفظ أيضًا برد مقتبس صريح واحد.

يؤثر هذا الإعداد في ظهور السياق الإضافي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكن أن تؤدي إلى تشغيل رد.
ويظل تفويض المشغّل صادرًا من إعدادات `groupPolicy` و`groups` و`groupAllowFrom` وسياسة الرسائل المباشرة.

## سياسة الرسائل المباشرة والغرف

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

راجع [المجموعات](/ar/channels/groups) لمعرفة سلوك تقييد mentions وقائمة السماح.

مثال على pairing لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير معتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز pairing المعلق نفسه وقد يرسل رد تذكير مرة أخرى بعد فترة تهدئة قصيرة بدلًا من إصدار رمز جديد.

راجع [Pairing](/ar/channels/pairing) لمعرفة تدفق pairing المشترك للرسائل المباشرة وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا أصبحت حالة الرسائل المباشرة غير متزامنة، فقد ينتهي الأمر بـ OpenClaw إلى وجود تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من الرسالة المباشرة النشطة. افحص التعيين الحالي لنظير باستخدام:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحه باستخدام:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

تدفق الإصلاح:

- يفضّل رسالة مباشرة صارمة 1:1 مُعيّنة بالفعل في `m.direct`
- يرجع إلى أي رسالة مباشرة صارمة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف تدفق الإصلاح الغرف القديمة تلقائيًا. بل يختار فقط الرسالة المباشرة السليمة ويحدّث التعيين بحيث تستهدف الإرسالات الجديدة في Matrix، وإشعارات التحقق، وغيرها من تدفقات الرسائل المباشرة، الغرفة الصحيحة مرة أخرى.

## موافقات Exec

يمكن لـ Matrix أن يعمل كعميل موافقة أصلي لحساب Matrix. وتبقى
عناصر التحكم الأصلية في توجيه الرسائل المباشرة/القنوات ضمن إعدادات موافقة exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (اختياري؛ يرجع إلى `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

يجب أن يكون الموافقون معرّفات مستخدم Matrix مثل `@owner:example.org`. يفعّل Matrix الموافقات الأصلية تلقائيًا عندما يكون `enabled` غير معيّن أو مساويًا لـ `"auto"` ويمكن تحليل موافق واحد على الأقل. تستخدم موافقات Exec مجموعة الموافقين من `execApprovals.approvers` أولًا ويمكن أن ترجع إلى `channels.matrix.dm.allowFrom`. وتفوض موافقات Plugin عبر `channels.matrix.dm.allowFrom`. عيّن `enabled: false` لتعطيل Matrix كعميل موافقة أصلي صراحةً. بخلاف ذلك، ترجع طلبات الموافقة إلى مسارات الموافقة الأخرى المهيأة أو إلى سياسة الرجوع للموافقة.

يدعم التوجيه الأصلي في Matrix كلا نوعي الموافقات:

- يتحكم `channels.matrix.execApprovals.*` في وضع التوزيع الأصلي للرسائل المباشرة/القنوات لطلبات الموافقة في Matrix.
- تستخدم موافقات Exec مجموعة الموافقين الخاصة بـ exec من `execApprovals.approvers` أو `channels.matrix.dm.allowFrom`.
- تستخدم موافقات Plugin قائمة السماح للرسائل المباشرة في Matrix من `channels.matrix.dm.allowFrom`.
- تنطبق اختصارات التفاعلات في Matrix وتحديثات الرسائل على كل من موافقات exec وPlugin.

قواعد التسليم:

- يرسل `target: "dm"` طلبات الموافقة إلى الرسائل المباشرة للموافقين
- يرسل `target: "channel"` الطلب مرة أخرى إلى غرفة Matrix أو الرسالة المباشرة الأصلية
- يرسل `target: "both"` إلى الرسائل المباشرة للموافقين وإلى غرفة Matrix أو الرسالة المباشرة الأصلية

تزرع طلبات الموافقة في Matrix اختصارات التفاعلات على رسالة الموافقة الأساسية:

- `✅` = السماح مرة واحدة
- `❌` = الرفض
- `♾️` = السماح دائمًا عندما يكون هذا القرار مسموحًا به وفقًا لسياسة exec الفعلية

يمكن للموافقين التفاعل على تلك الرسالة أو استخدام أوامر slash الاحتياطية: `/approve <id> allow-once` أو `/approve <id> allow-always` أو `/approve <id> deny`.

لا يمكن الموافقة أو الرفض إلا من الموافقين الذين تم تحليلهم. بالنسبة إلى موافقات exec، يتضمن التسليم عبر القناة نص الأمر، لذا لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

تجاوز لكل حساب:

- `channels.matrix.accounts.<account>.execApprovals`

مستندات ذات صلة: [موافقات Exec](/ar/tools/exec-approvals)

## أوامر Slash

تعمل أوامر Matrix slash (على سبيل المثال `/new` و`/reset` و`/model`) مباشرة في الرسائل المباشرة. وفي الغرف، يتعرف OpenClaw أيضًا على أوامر slash المسبوقة بـ mention الخاص بالروبوت نفسه في Matrix، لذا فإن `@bot:server /new` يشغّل مسار الأوامر من دون الحاجة إلى تعبير mention مخصص. وهذا يبقي الروبوت مستجيبًا لمنشورات الغرف بأسلوب `@mention /command` التي تصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم الروبوت قبل كتابة الأمر.

ولا تزال قواعد التفويض سارية: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح أو الملكية للرسائل المباشرة أو الغرف تمامًا مثل الرسائل العادية.

## حسابات متعددة

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

تعمل قيم `channels.matrix` ذات المستوى الأعلى كقيم افتراضية للحسابات المسماة ما لم يقم حساب ما بتجاوزها.
يمكنك تقييد إدخالات الغرف الموروثة على حساب Matrix واحد باستخدام `groups.<room>.account`.
وتظل الإدخالات التي لا تحتوي على `account` مشتركة بين جميع حسابات Matrix، وتستمر الإدخالات التي تحتوي على `account: "default"` في العمل عندما يكون الحساب الافتراضي مهيأ مباشرة على `channels.matrix.*` في المستوى الأعلى.
لا تؤدي الإعدادات الافتراضية الجزئية المشتركة للمصادقة إلى إنشاء حساب افتراضي ضمني منفصل بمفردها. لا يُنشئ OpenClaw حساب `default` في المستوى الأعلى إلا عندما يحتوي ذلك الافتراضي على مصادقة جديدة (`homeserver` مع `accessToken`، أو `homeserver` مع `userId` و`password`)؛ ويمكن للحسابات المسماة أن تظل قابلة للاكتشاف من `homeserver` مع `userId` عندما تستوفي بيانات الاعتماد المؤقتة المصادقة لاحقًا.
إذا كان لدى Matrix بالفعل حساب مسمى واحد فقط بالضبط، أو كان `defaultAccount` يشير إلى مفتاح حساب مسمى موجود، فإن ترقية الإصلاح/الإعداد من حساب واحد إلى حسابات متعددة تحافظ على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد. لا تنتقل إلى هذا الحساب المُرقّى إلا مفاتيح مصادقة/Bootstrap الخاصة بـ Matrix؛ وتظل مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.
عيّن `defaultAccount` عندما تريد أن يفضّل OpenClaw حساب Matrix مسمى واحدًا للتوجيه الضمني، والفحص، وعمليات CLI.
إذا كانت حسابات Matrix متعددة مهيأة وكان أحد معرّفات الحسابات هو `default`، فإن OpenClaw يستخدم ذلك الحساب ضمنيًا حتى عندما لا يكون `defaultAccount` معيّنًا.
إذا قمت بتهيئة عدة حسابات Matrix مسماة، فعيّن `defaultAccount` أو مرّر `--account <id>` لأوامر CLI التي تعتمد على اختيار الحساب الضمني.
مرّر `--account <id>` إلى `openclaw matrix verify ...` و`openclaw matrix devices ...` عندما تريد تجاوز ذلك الاختيار الضمني لأمر واحد.

راجع [مرجع الإعدادات](/ar/gateway/config-channels#multi-account-all-channels) لمعرفة النمط المشترك للحسابات المتعددة.

## homeserver خاص/ضمن LAN

افتراضيًا، يمنع OpenClaw homeserverات Matrix الخاصة/الداخلية للحماية من SSRF ما لم
تقم بالاشتراك الصريح لكل حساب.

إذا كان homeserver لديك يعمل على localhost، أو عنوان IP ضمن LAN/Tailscale، أو اسم مضيف داخلي، فقم بتمكين
`network.dangerouslyAllowPrivateNetwork` لذلك الحساب في Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

مثال على إعداد CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

يسمح هذا الاشتراك فقط بالأهداف الخاصة/الداخلية الموثوقة. وتظل homeserverات النص الصريح العامة مثل
`http://matrix.example.org:8008` محجوبة. فضّل `https://` كلما أمكن.

## توجيه حركة Matrix عبر proxy

إذا كان نشر Matrix لديك يحتاج إلى proxy صريح لحركة HTTP(S) الصادرة، فعيّن `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

يمكن للحسابات المسماة تجاوز القيمة الافتراضية في المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد proxy نفسه لحركة Matrix أثناء التشغيل ولفحوصات حالة الحساب.

## تحليل الهدف

يقبل Matrix صيغ الأهداف هذه في أي مكان يطلب منك فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

يستخدم البحث الحي في الدليل حساب Matrix المسجل الدخول:

- تستعلم عمليات بحث المستخدمين من دليل مستخدمي Matrix على ذلك homeserver.
- تقبل عمليات بحث الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم ترجع إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- يعد البحث في أسماء الغرف المنضم إليها جهدًا بأفضل ما يمكن. وإذا تعذر تحليل اسم غرفة إلى معرّف أو اسم مستعار، يتم تجاهله أثناء تحليل قائمة السماح وقت التشغيل.

## مرجع الإعدادات

- `enabled`: تمكين القناة أو تعطيلها.
- `name`: تسمية اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضّل عند تهيئة عدة حسابات Matrix.
- `homeserver`: عنوان URL لـ homeserver، على سبيل المثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب في Matrix بالاتصال بـ homeserverات خاصة/داخلية. فعّل هذا عندما يُحل homeserver إلى `localhost`، أو عنوان IP ضمن LAN/Tailscale، أو مضيف داخلي مثل `matrix-synapse`.
- `proxy`: عنوان URL اختياري لـ proxy لحركة Matrix عبر HTTP(S). يمكن للحسابات المسماة تجاوز القيمة الافتراضية في المستوى الأعلى باستخدام `proxy` خاص بها.
- `userId`: معرّف مستخدم Matrix الكامل، على سبيل المثال `@bot:example.org`.
- `accessToken`: access token للمصادقة القائمة على token. القيم النصية الصريحة وقيم SecretRef مدعومة لكل من `channels.matrix.accessToken` و`channels.matrix.accounts.<id>.accessToken` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).
- `password`: كلمة المرور لتسجيل الدخول القائم على كلمة المرور. القيم النصية الصريحة وقيم SecretRef مدعومة.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز لتسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL المخزّن للصورة الرمزية الذاتية لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.
- `encryption`: تمكين E2EE.
- `allowlistOnly`: عندما تكون `true`، تقوم بترقية سياسة الغرف `open` إلى `allowlist`، وتفرض جميع سياسات الرسائل المباشرة النشطة باستثناء `disabled` (بما في ذلك `pairing` و`open`) إلى `allowlist`. ولا تؤثر في سياسات `disabled`.
- `allowBots`: السماح بالرسائل من حسابات OpenClaw Matrix أخرى مُهيأة (`true` أو `"mentions"`).
- `groupPolicy`: `open` أو `allowlist` أو `disabled`.
- `contextVisibility`: وضع ظهور سياق الغرفة الإضافي (`all` أو `allowlist` أو `allowlist_quote`).
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف. معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ ويتم تحليل تطابقات الدليل الدقيقة عند بدء التشغيل وعندما تتغير قائمة السماح أثناء تشغيل المراقب. ويتم تجاهل الأسماء غير المحلولة.
- `historyLimit`: الحد الأقصى لرسائل الغرف التي تُضمَّن كسياق لسجل المجموعات. ويرجع إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أيٌّ منهما معينًا، فالقيمة الافتراضية الفعلية هي `0`. عيّن `0` للتعطيل.
- `replyToMode`: `off` أو `first` أو `all` أو `batched`.
- `markdown`: تهيئة اختيارية لعرض Markdown لنص Matrix الصادر.
- `streaming`: `off` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو `true`، أو `false`. يقوم `"partial"` و`true` بتمكين تحديثات المسودات بنمط المعاينة أولًا باستخدام رسائل Matrix النصية العادية. ويستخدم `"quiet"` إشعارات معاينة غير مُرسِلة للإشعارات لإعدادات قواعد الدفع ذاتية الاستضافة. و`false` مكافئ لـ `"off"`.
- `blockStreaming`: يتيح `true` رسائل تقدم منفصلة لكتل المساعد المكتملة أثناء نشاط بث معاينة المسودة.
- `threadReplies`: `off` أو `inbound` أو `always`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بسلاسل الرسائل ودورة حياتها.
- `startupVerification`: وضع طلب التحقق الذاتي التلقائي عند بدء التشغيل (`if-unverified` أو `off`).
- `startupVerificationCooldownHours`: فترة التهدئة قبل إعادة محاولة طلبات التحقق التلقائي عند بدء التشغيل.
- `textChunkLimit`: حجم تجزئة الرسائل الصادرة بالأحرف (يُطبّق عندما يكون `chunkMode` هو `length`).
- `chunkMode`: يقوم `length` بتقسيم الرسائل حسب عدد الأحرف؛ ويقوم `newline` بتقسيمها عند حدود الأسطر.
- `responsePrefix`: سلسلة اختيارية تُضاف في بداية جميع الردود الصادرة لهذه القناة.
- `ackReaction`: تجاوز اختياري لتفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز اختياري لنطاق تفاعل الإقرار (`group-mentions` أو `group-all` أو `direct` أو `all` أو `none` أو `off`).
- `reactionNotifications`: وضع إشعارات التفاعلات الواردة (`own` أو `off`).
- `mediaMaxMb`: الحد الأقصى لحجم الوسائط بالميغابايت للإرسالات الصادرة ومعالجة الوسائط الواردة.
- `autoJoin`: سياسة الانضمام التلقائي للدعوات (`always` أو `allowlist` أو `off`). الافتراضي: `off`. تنطبق على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `allowlist`. تُحل إدخالات الأسماء المستعارة إلى معرّفات غرف أثناء معالجة الدعوة؛ ولا يثق OpenClaw في حالة الاسم المستعار التي تدعيها الغرفة المدعو إليها.
- `dm`: كتلة سياسة الرسائل المباشرة (`enabled` أو `policy` أو `allowFrom` أو `sessionScope` أو `threadReplies`).
- `dm.policy`: يتحكم في وصول الرسائل المباشرة بعد انضمام OpenClaw إلى الغرفة وتصنيفها كرسالة مباشرة. ولا يغيّر ما إذا كانت الدعوة ستتم معالجتها بالانضمام التلقائي.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل المباشرة. معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ ويتم تحليل تطابقات الدليل الدقيقة عند بدء التشغيل وعندما تتغير قائمة السماح أثناء تشغيل المراقب. ويتم تجاهل الأسماء غير المحلولة.
- `dm.sessionScope`: `per-user` (الافتراضي) أو `per-room`. استخدم `per-room` عندما تريد أن يحتفظ كل غرفة رسائل مباشرة في Matrix بسياق منفصل حتى إذا كان النظير هو نفسه.
- `dm.threadReplies`: تجاوز لسياسة سلاسل الرسائل خاص بالرسائل المباشرة فقط (`off` أو `inbound` أو `always`). ويتجاوز إعداد `threadReplies` في المستوى الأعلى لكل من موضع الرد وعزل الجلسة في الرسائل المباشرة.
- `execApprovals`: تسليم موافقات exec الأصلي في Matrix (`enabled` أو `approvers` أو `target` أو `agentFilter` أو `sessionFilter`).
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة على طلبات exec. وهو اختياري عندما يكون `dm.allowFrom` يحدد الموافقين بالفعل.
- `execApprovals.target`: `dm | channel | both` (الافتراضي: `dm`).
- `accounts`: تجاوزات مسماة لكل حساب. تعمل قيم `channels.matrix` ذات المستوى الأعلى كقيم افتراضية لهذه الإدخالات.
- `groups`: خريطة سياسات لكل غرفة. فضّل معرّفات الغرف أو الأسماء المستعارة؛ ويتم تجاهل أسماء الغرف غير المحلولة وقت التشغيل. وتستخدم هوية الجلسة/المجموعة معرّف الغرفة الثابت بعد التحليل.
- `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب Matrix محدد في إعدادات الحسابات المتعددة.
- `groups.<room>.allowBots`: تجاوز على مستوى الغرفة للمرسلين من الروبوتات المهيأة (`true` أو `"mentions"`).
- `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
- `groups.<room>.tools`: تجاوزات السماح/المنع للأدوات لكل غرفة.
- `groups.<room>.autoReply`: تجاوز تقييد mentions على مستوى الغرفة. تقوم `true` بتعطيل متطلبات mention لتلك الغرفة؛ وتقوم `false` بفرضها مرة أخرى.
- `groups.<room>.skills`: مرشح Skills اختياري على مستوى الغرفة.
- `groups.<room>.systemPrompt`: مقتطف system prompt اختياري على مستوى الغرفة.
- `rooms`: اسم مستعار قديم لـ `groups`.
- `actions`: تقييد الأدوات لكل إجراء (`messages` أو `reactions` أو `pins` أو `profile` أو `memberInfo` أو `channelInfo` أو `verification`).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق pairing
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وتقييد mentions
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
