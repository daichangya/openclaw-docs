---
read_when:
    - إعداد Matrix في OpenClaw
    - تهيئة التشفير التام بين الطرفين (E2EE) والتحقق في Matrix
summary: حالة دعم Matrix، والإعداد، وأمثلة التهيئة
title: Matrix
x-i18n:
    generated_at: "2026-04-21T07:18:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00fa6201d2ee4ac4ae5be3eb18ff687c5c2c9ef70cff12af1413b4c311484b24
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix هو Plugin قناة مضمّن لـ OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل الخاصة، والغرف، والسلاسل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، والتشفير التام بين الطرفين (E2EE).

## Plugin مضمّن

يأتي Matrix كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذا فإن
البنيات المجمّعة العادية لا تحتاج إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Matrix، فقم بتثبيته
يدويًا:

التثبيت من npm:

```bash
openclaw plugins install @openclaw/matrix
```

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

راجع [Plugins](/ar/tools/plugin) للاطلاع على سلوك Plugin وقواعد التثبيت.

## الإعداد

1. تأكد من أن Plugin Matrix متاح.
   - إصدارات OpenClaw المجمّعة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ حساب Matrix على الخادم المنزلي الخاص بك.
3. هيّئ `channels.matrix` باستخدام أحد الخيارين التاليين:
   - `homeserver` + `accessToken`، أو
   - `homeserver` + `userId` + `password`.
4. أعد تشغيل Gateway.
5. ابدأ رسالة خاصة مع الروبوت أو ادعه إلى غرفة.
   - لا تعمل دعوات Matrix الجديدة إلا عندما يسمح `channels.matrix.autoJoin` بذلك.

مسارات الإعداد التفاعلية:

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب معالج Matrix ما يلي:

- عنوان URL للخادم المنزلي
- طريقة المصادقة: رمز وصول أو كلمة مرور
- معرّف المستخدم (لمصادقة كلمة المرور فقط)
- اسم الجهاز الاختياري
- ما إذا كان سيتم تمكين E2EE
- ما إذا كان سيتم إعداد وصول الغرفة والانضمام التلقائي للدعوات

سلوكيات المعالج الأساسية:

- إذا كانت متغيرات بيئة مصادقة Matrix موجودة بالفعل ولم يكن لهذا الحساب مصادقة محفوظة بالفعل في التهيئة، يعرض المعالج اختصارًا لمتغيرات البيئة للإبقاء على المصادقة في متغيرات البيئة.
- يتم تطبيع أسماء الحسابات إلى معرّف الحساب. على سبيل المثال، يتحول `Ops Bot` إلى `ops-bot`.
- تقبل إدخالات قائمة السماح للرسائل الخاصة `@user:server` مباشرة؛ ولا تعمل أسماء العرض إلا عندما يعثر بحث الدليل المباشر على تطابق واحد دقيق.
- تقبل إدخالات قائمة السماح للغرف معرّفات الغرف والأسماء المستعارة مباشرة. يُفضّل استخدام `!room:server` أو `#alias:server`؛ ويتم تجاهل الأسماء غير المحلولة في وقت التشغيل أثناء تحليل قائمة السماح.
- في وضع قائمة السماح للانضمام التلقائي للدعوات، استخدم فقط أهداف الدعوة المستقرة: `!roomId:server` أو `#alias:server` أو `*`. يتم رفض أسماء الغرف العادية.
- لتحليل أسماء الغرف قبل الحفظ، استخدم `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
تكون القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`.

إذا تركته بدون تعيين، فلن ينضم الروبوت إلى الغرف المدعو إليها أو الدعوات الجديدة بنمط الرسائل الخاصة، لذلك لن يظهر في المجموعات الجديدة أو الرسائل الخاصة المدعو إليها ما لم تنضم يدويًا أولًا.

عيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها، أو عيّن `autoJoin: "always"` إذا كنت تريد منه الانضمام إلى كل دعوة.

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

إعداد بسيط قائم على الرمز المميز:

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

إعداد قائم على كلمة المرور (يتم تخزين الرمز المميز مؤقتًا بعد تسجيل الدخول):

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

يخزن Matrix بيانات الاعتماد المخبأة في `~/.openclaw/credentials/matrix/`.
يستخدم الحساب الافتراضي `credentials.json`؛ وتستخدم الحسابات المسماة `credentials-<account>.json`.
عندما تكون بيانات الاعتماد المخبأة موجودة هناك، يتعامل OpenClaw مع Matrix على أنه مُهيأ لأغراض الإعداد وdoctor واكتشاف حالة القناة، حتى إذا لم تكن المصادقة الحالية مضبوطة مباشرة في التهيئة.

المكافئات عبر متغيرات البيئة (تُستخدم عندما لا يكون مفتاح التهيئة مضبوطًا):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

للحسابات غير الافتراضية، استخدم متغيرات البيئة المقيّدة بالحساب:

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

يقوم Matrix بتهريب علامات الترقيم في معرّفات الحسابات للحفاظ على متغيرات البيئة المقيّدة خالية من التعارضات.
على سبيل المثال، يتحول `-` إلى `_X2D_`، لذلك يتم ربط `ops-prod` بـ `MATRIX_OPS_X2D_PROD_*`.

لا يعرض المعالج التفاعلي اختصار متغيرات البيئة إلا عندما تكون متغيرات بيئة المصادقة هذه موجودة بالفعل ولا يكون الحساب المحدد محفوظًا له بالفعل مصادقة Matrix في التهيئة.

## مثال على التهيئة

هذا خط أساس عملي للتهيئة مع اقتران الرسائل الخاصة، وقائمة سماح للغرف، وتمكين E2EE:

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

ينطبق `autoJoin` على جميع دعوات Matrix، بما في ذلك الدعوات بنمط الرسائل الخاصة. لا يستطيع OpenClaw
تصنيف غرفة تمت دعوتها بشكل موثوق على أنها رسالة خاصة أو مجموعة وقت الدعوة، لذا تمر جميع الدعوات عبر `autoJoin`
أولًا. يتم تطبيق `dm.policy` بعد انضمام الروبوت وتصنيف الغرفة كرسالة خاصة.

## معاينات البث

بث الردود في Matrix يتم بالاشتراك الاختياري.

عيّن `channels.matrix.streaming` إلى `"partial"` عندما تريد من OpenClaw إرسال معاينة حية واحدة
للرد، وتعديل تلك المعاينة في مكانها أثناء قيام النموذج بتوليد النص، ثم إنهاءها عند اكتمال
الرد:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` هو الإعداد الافتراضي. ينتظر OpenClaw الرد النهائي ويرسله مرة واحدة.
- `streaming: "partial"` ينشئ رسالة معاينة واحدة قابلة للتعديل لكتلة المساعد الحالية باستخدام رسائل Matrix النصية العادية. يحافظ هذا على سلوك الإشعار القديم في Matrix القائم على المعاينة أولًا، لذلك قد تُصدر العملاء الافتراضيون إشعارًا عند أول نص معاينة متدفق بدلًا من الكتلة المكتملة.
- `streaming: "quiet"` ينشئ إشعار معاينة هادئًا واحدًا قابلًا للتعديل لكتلة المساعد الحالية. استخدم هذا فقط عندما تقوم أيضًا بتهيئة قواعد push للمستلمين من أجل تعديلات المعاينة النهائية.
- `blockStreaming: true` يمكّن رسائل تقدم Matrix منفصلة. عند تمكين بث المعاينة، يحتفظ Matrix بالمسودة الحية للكتلة الحالية ويحافظ على الكتل المكتملة كرسائل منفصلة.
- عندما يكون بث المعاينة قيد التشغيل ويكون `blockStreaming` معطّلًا، يقوم Matrix بتعديل المسودة الحية في مكانها وينهي الحدث نفسه عند اكتمال الكتلة أو الدور.
- إذا لم تعد المعاينة تتسع في حدث Matrix واحد، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي العادي.
- لا تزال ردود الوسائط ترسل المرفقات بشكل عادي. وإذا تعذر إعادة استخدام معاينة قديمة بأمان، يقوم OpenClaw بحذفها قبل إرسال رد الوسائط النهائي.
- تتطلب تعديلات المعاينة استدعاءات إضافية إلى Matrix API. اترك البث معطّلًا إذا كنت تريد أكثر سلوك تحفظًا فيما يتعلق بحدود المعدل.

لا يقوم `blockStreaming` بتمكين معاينات المسودة بمفرده.
استخدم `streaming: "partial"` أو `streaming: "quiet"` لتعديلات المعاينة؛ ثم أضف `blockStreaming: true` فقط إذا كنت تريد أيضًا أن تظل كتل المساعد المكتملة مرئية كرسائل تقدم منفصلة.

إذا كنت تحتاج إلى إشعارات Matrix الافتراضية من دون قواعد push مخصصة، فاستخدم `streaming: "partial"` لسلوك المعاينة أولًا أو اترك `streaming` معطّلًا للتسليم النهائي فقط. مع `streaming: "off"`:

- يرسل `blockStreaming: true` كل كتلة مكتملة كرسالة Matrix عادية مُرسِلة للإشعارات.
- يرسل `blockStreaming: false` الرد المكتمل النهائي فقط كرسالة Matrix عادية مُرسِلة للإشعارات.

### قواعد push مستضافة ذاتيًا لمعاينات نهائية هادئة

إذا كنت تشغّل بنية Matrix التحتية الخاصة بك وتريد أن تُرسل المعاينات الهادئة إشعارًا فقط عند اكتمال كتلة أو
الرد النهائي، فعيّن `streaming: "quiet"` وأضف قاعدة push لكل مستخدم مستلم من أجل تعديلات المعاينة النهائية.

يكون هذا عادة إعدادًا على مستوى المستخدم المستلم، وليس تغييرًا عامًّا في تهيئة الخادم المنزلي:

خريطة سريعة قبل أن تبدأ:

- المستخدم المستلم = الشخص الذي يجب أن يتلقى الإشعار
- مستخدم الروبوت = حساب Matrix الخاص بـ OpenClaw الذي يرسل الرد
- استخدم رمز وصول المستخدم المستلم في استدعاءات API أدناه
- طابق `sender` في قاعدة push مع MXID الكامل لمستخدم الروبوت

1. هيّئ OpenClaw لاستخدام المعاينات الهادئة:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. تأكد من أن حساب المستلم يتلقى بالفعل إشعارات push العادية في Matrix. لا تعمل قواعد
   المعاينة الهادئة إلا إذا كان لدى ذلك المستخدم pushers/أجهزة عاملة بالفعل.

3. احصل على رمز وصول المستخدم المستلم.
   - استخدم رمز المستخدم المستلم، وليس رمز الروبوت.
   - تكون إعادة استخدام رمز جلسة عميل موجودة بالفعل هي الأسهل عادة.
   - إذا كنت بحاجة إلى إنشاء رمز جديد، يمكنك تسجيل الدخول عبر Matrix Client-Server API القياسي:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. تحقّق من أن حساب المستلم لديه بالفعل pushers:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

إذا أعاد هذا الاستدعاء عدم وجود pushers/أجهزة نشطة، فأصلح إشعارات Matrix العادية أولًا قبل إضافة
قاعدة OpenClaw أدناه.

يضع OpenClaw علامة على تعديلات المعاينة النهائية النصية فقط باستخدام:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. أنشئ قاعدة push من نوع override لكل حساب مستلم يجب أن يتلقى هذه الإشعارات:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

استبدل هذه القيم قبل تشغيل الأمر:

- `https://matrix.example.org`: عنوان URL الأساسي للخادم المنزلي لديك
- `$USER_ACCESS_TOKEN`: رمز وصول المستخدم المستلم
- `openclaw-finalized-preview-botname`: معرّف قاعدة فريد لهذا الروبوت لهذا المستخدم المستلم
- `@bot:example.org`: MXID روبوت Matrix الخاص بـ OpenClaw، وليس MXID المستخدم المستلم

مهم لإعدادات الروبوتات المتعددة:

- تتم فهرسة قواعد push بحسب `ruleId`. تؤدي إعادة تشغيل `PUT` على معرّف القاعدة نفسه إلى تحديث تلك القاعدة فقط.
- إذا كان يجب على مستخدم مستلم واحد تلقي إشعارات من عدة حسابات روبوت Matrix تابعة لـ OpenClaw، فأنشئ قاعدة واحدة لكل روبوت مع معرّف قاعدة فريد لكل تطابق `sender`.
- نمط بسيط لذلك هو `openclaw-finalized-preview-<botname>`، مثل `openclaw-finalized-preview-ops` أو `openclaw-finalized-preview-support`.

يتم تقييم القاعدة مقابل مُرسِل الحدث:

- قم بالمصادقة باستخدام رمز المستخدم المستلم
- طابِق `sender` مع MXID روبوت OpenClaw

6. تحقّق من وجود القاعدة:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. اختبر ردًا متدفقًا. في الوضع الهادئ، يجب أن تُظهر الغرفة معاينة مسودة هادئة، ويجب أن يرسل
   التعديل النهائي في مكانه إشعارًا واحدًا عند اكتمال الكتلة أو الدور.

إذا احتجت إلى إزالة القاعدة لاحقًا، فاحذف معرّف القاعدة نفسه باستخدام رمز المستخدم المستلم:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

ملاحظات:

- أنشئ القاعدة باستخدام رمز وصول المستخدم المستلم، وليس رمز الروبوت.
- يتم إدراج قواعد `override` الجديدة المعرّفة من قبل المستخدم قبل قواعد الكبت الافتراضية، لذلك لا حاجة إلى معلمة ترتيب إضافية.
- يؤثر هذا فقط في تعديلات المعاينة النصية فقط التي يمكن لـ OpenClaw إنهاؤها بأمان في مكانها. أما بدائل الوسائط وبدائل المعاينات القديمة فلا تزال تستخدم تسليم Matrix العادي.
- إذا أظهر `GET /_matrix/client/v3/pushers` عدم وجود pushers، فهذا يعني أن المستخدم لا يملك بعد تسليم push عاملًا من Matrix لهذا الحساب/الجهاز.

#### Synapse

بالنسبة إلى Synapse، يكون الإعداد أعلاه كافيًا عادة بمفرده:

- لا يلزم أي تغيير خاص في `homeserver.yaml` لإشعارات معاينات OpenClaw النهائية.
- إذا كان نشر Synapse لديك يرسل بالفعل إشعارات push عادية من Matrix، فإن رمز المستخدم + استدعاء `pushrules` أعلاه هما خطوة الإعداد الرئيسية.
- إذا كنت تشغّل Synapse خلف وكيل عكسي أو workers، فتأكد من أن `/_matrix/client/.../pushrules/` يصل إلى Synapse بشكل صحيح.
- إذا كنت تشغّل Synapse workers، فتأكد من أن pushers تعمل بشكل سليم. تتم معالجة تسليم push بواسطة العملية الرئيسية أو `synapse.app.pusher` / workers الخاصة بـ pusher المهيأة.

#### Tuwunel

بالنسبة إلى Tuwunel، استخدم تدفق الإعداد نفسه واستدعاء API الخاص بـ push-rule الموضّح أعلاه:

- لا يلزم أي إعداد خاص بـ Tuwunel لواسم المعاينة النهائية نفسه.
- إذا كانت إشعارات Matrix العادية تعمل بالفعل لذلك المستخدم، فإن رمز المستخدم + استدعاء `pushrules` أعلاه هما خطوة الإعداد الرئيسية.
- إذا بدت الإشعارات وكأنها تختفي أثناء نشاط المستخدم على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` مفعّلًا. أضاف Tuwunel هذا الخيار في Tuwunel 1.4.2 بتاريخ 12 سبتمبر 2025، ويمكنه كبت إشعارات push عمدًا إلى الأجهزة الأخرى أثناء نشاط أحد الأجهزة.

## غرف روبوت إلى روبوت

بشكل افتراضي، يتم تجاهل رسائل Matrix الواردة من حسابات Matrix أخرى مهيأة في OpenClaw.

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

- يقبل `allowBots: true` الرسائل الواردة من حسابات روبوت Matrix أخرى مهيأة في الغرف المسموح بها والرسائل الخاصة.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا الروبوت بوضوح في الغرف. ولا تزال الرسائل الخاصة مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- لا يزال OpenClaw يتجاهل الرسائل الواردة من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفّر Matrix هنا علامة روبوت أصلية؛ يتعامل OpenClaw مع "مكتوب بواسطة روبوت" على أنه "مرسل بواسطة حساب Matrix آخر مهيأ على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تمكين حركة الروبوت إلى الروبوت في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث يتم تشفير معاينات الصور إلى جانب المرفق الكامل. أما الغرف غير المشفرة فلا تزال تستخدم `thumbnail_url` العادي. لا حاجة إلى أي تهيئة — يكتشف Plugin حالة E2EE تلقائيًا.

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

التحقق من حالة التحقق:

```bash
openclaw matrix verify status
```

حالة مطولة (تشخيصات كاملة):

```bash
openclaw matrix verify status --verbose
```

تضمين مفتاح الاسترداد المخزّن في المخرجات القابلة للقراءة آليًا:

```bash
openclaw matrix verify status --include-recovery-key --json
```

تهيئة cross-signing وحالة التحقق:

```bash
openclaw matrix verify bootstrap
```

تشخيصات bootstrap مطولة:

```bash
openclaw matrix verify bootstrap --verbose
```

فرض إعادة تعيين جديدة لهوية cross-signing قبل التهيئة:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

تحقق من هذا الجهاز باستخدام مفتاح استرداد:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

تفاصيل مطولة للتحقق من الجهاز:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

التحقق من سلامة النسخ الاحتياطي لمفاتيح الغرف:

```bash
openclaw matrix verify backup status
```

تشخيصات مطولة لسلامة النسخ الاحتياطي:

```bash
openclaw matrix verify backup status --verbose
```

استعادة مفاتيح الغرف من النسخة الاحتياطية على الخادم:

```bash
openclaw matrix verify backup restore
```

تشخيصات مطولة للاستعادة:

```bash
openclaw matrix verify backup restore --verbose
```

احذف النسخة الاحتياطية الحالية على الخادم وأنشئ خط أساس جديدًا للنسخ الاحتياطي. إذا تعذر
تحميل مفتاح النسخ الاحتياطي المخزّن بشكل سليم، فيمكن أن تعيد عملية إعادة التعيين هذه أيضًا إنشاء
التخزين السري بحيث تتمكن عمليات البدء البارد المستقبلية من تحميل مفتاح النسخ الاحتياطي الجديد:

```bash
openclaw matrix verify backup reset --yes
```

تكون جميع أوامر `verify` موجزة بشكل افتراضي (بما في ذلك تسجيل SDK الداخلي الهادئ) ولا تعرض التشخيصات المفصلة إلا مع `--verbose`.
استخدم `--json` للحصول على مخرجات كاملة قابلة للقراءة آليًا عند البرمجة النصية.

في إعدادات الحسابات المتعددة، تستخدم أوامر Matrix CLI الحساب الافتراضي الضمني لـ Matrix ما لم تمرر `--account <id>`.
إذا قمت بتهيئة عدة حسابات مسماة، فعيّن `channels.matrix.defaultAccount` أولًا وإلا ستتوقف عمليات CLI الضمنية هذه وتطلب منك اختيار حساب صراحة.
استخدم `--account` كلما أردت أن تستهدف عمليات التحقق أو الجهاز حسابًا مسمى بشكل صريح:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

عندما يكون التشفير معطّلًا أو غير متاح لحساب مسمى، تشير تحذيرات Matrix وأخطاء التحقق إلى مفتاح تهيئة ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

### ما معنى "تم التحقق"

يتعامل OpenClaw مع جهاز Matrix هذا على أنه تم التحقق منه فقط عندما يتم التحقق منه بواسطة هوية cross-signing الخاصة بك.
عمليًا، يكشف `openclaw matrix verify status --verbose` عن ثلاث إشارات ثقة:

- `Locally trusted`: هذا الجهاز موثوق من العميل الحالي فقط
- `Cross-signing verified`: يفيد SDK بأن الجهاز تم التحقق منه عبر cross-signing
- `Signed by owner`: الجهاز موقّع بواسطة مفتاح self-signing الخاص بك

تتحول `Verified by owner` إلى `yes` فقط عند وجود تحقق عبر cross-signing أو توقيع من المالك.
الثقة المحلية وحدها لا تكفي لكي يتعامل OpenClaw مع الجهاز على أنه متحقق منه بالكامل.

### ما الذي يفعله bootstrap

يُعد `openclaw matrix verify bootstrap` أمر الإصلاح والإعداد لحسابات Matrix المشفرة.
وهو ينفّذ كل ما يلي بالترتيب:

- يهيئ التخزين السري، مع إعادة استخدام مفتاح استرداد موجود كلما أمكن
- يهيئ cross-signing ويرفع مفاتيح cross-signing العامة الناقصة
- يحاول وسم الجهاز الحالي وتوقيعه عبر cross-signing
- ينشئ نسخة احتياطية جديدة على الخادم لمفاتيح الغرف إذا لم تكن موجودة بالفعل

إذا كان الخادم المنزلي يتطلب مصادقة تفاعلية لرفع مفاتيح cross-signing، فسيحاول OpenClaw الرفع أولًا من دون مصادقة، ثم باستخدام `m.login.dummy`، ثم باستخدام `m.login.password` عندما يكون `channels.matrix.password` مهيأ.

استخدم `--force-reset-cross-signing` فقط عندما تريد عمدًا تجاهل هوية cross-signing الحالية وإنشاء هوية جديدة.

إذا كنت تريد عمدًا تجاهل النسخة الاحتياطية الحالية لمفاتيح الغرف وبدء
خط أساس جديد للنسخ الاحتياطي للرسائل المستقبلية، فاستخدم `openclaw matrix verify backup reset --yes`.
افعل ذلك فقط إذا كنت تقبل بأن السجل المشفر القديم غير القابل للاسترداد سيبقى
غير متاح، وأن OpenClaw قد يعيد إنشاء التخزين السري إذا تعذر تحميل
سر النسخ الاحتياطي الحالي بأمان.

### خط أساس جديد للنسخ الاحتياطي

إذا كنت تريد إبقاء الرسائل المشفرة المستقبلية تعمل وتقبل فقدان السجل القديم غير القابل للاسترداد، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

أضف `--account <id>` إلى كل أمر عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

### سلوك بدء التشغيل

عندما يكون `encryption: true`، يضبط Matrix `startupVerification` افتراضيًا على `"if-unverified"`.
عند بدء التشغيل، إذا كان هذا الجهاز لا يزال غير متحقق منه، فسيطلب Matrix تحققًا ذاتيًا في عميل Matrix آخر،
وسيتخطى الطلبات المكررة عندما يكون أحدها معلّقًا بالفعل، ويطبق فترة تهدئة محلية قبل إعادة المحاولة بعد عمليات إعادة التشغيل.
تُعاد محاولة الطلبات الفاشلة أسرع من إنشاء الطلبات الناجح بشكل افتراضي.
عيّن `startupVerification: "off"` لتعطيل طلبات بدء التشغيل التلقائية، أو اضبط `startupVerificationCooldownHours`
إذا كنت تريد نافذة إعادة محاولة أقصر أو أطول.

ينفذ بدء التشغيل أيضًا تمريرة bootstrap تشفيرية محافظة تلقائيًا.
تحاول هذه التمريرة أولًا إعادة استخدام التخزين السري الحالي وهوية cross-signing الحالية، وتتجنب إعادة تعيين cross-signing إلا إذا شغّلت تدفق إصلاح bootstrap صريحًا.

إذا وجد بدء التشغيل مع ذلك حالة bootstrap معطلة، فيمكن لـ OpenClaw محاولة مسار إصلاح محروس حتى عندما لا يكون `channels.matrix.password` مهيأ.
إذا كان الخادم المنزلي يتطلب UIA قائمًا على كلمة المرور لذلك الإصلاح، فسيسجل OpenClaw تحذيرًا ويبقي بدء التشغيل غير قاتل بدلًا من إيقاف الروبوت.
إذا كان الجهاز الحالي موقّعًا بالفعل من المالك، فسيحافظ OpenClaw على تلك الهوية بدلًا من إعادة تعيينها تلقائيًا.

راجع [ترحيل Matrix](/ar/install/migrating-matrix) للحصول على تدفق الترقية الكامل، والقيود، وأوامر الاسترداد، ورسائل الترحيل الشائعة.

### إشعارات التحقق

ينشر Matrix إشعارات دورة حياة التحقق مباشرة في غرفة الرسائل الخاصة الصارمة الخاصة بالتحقق كرسائل `m.notice`.
يشمل ذلك:

- إشعارات طلب التحقق
- إشعارات جاهزية التحقق (مع إرشاد صريح إلى "التحقق عبر الرموز التعبيرية")
- إشعارات بدء التحقق واكتماله
- تفاصيل SAS (الرموز التعبيرية والأرقام العشرية) عند توفرها

يتم تتبع طلبات التحقق الواردة من عميل Matrix آخر وقبولها تلقائيًا بواسطة OpenClaw.
وبالنسبة إلى تدفقات التحقق الذاتي، يبدأ OpenClaw أيضًا تدفق SAS تلقائيًا عندما يصبح التحقق عبر الرموز التعبيرية متاحًا ويؤكد جانبه الخاص.
أما بالنسبة إلى طلبات التحقق من مستخدم/جهاز Matrix آخر، فيقبل OpenClaw الطلب تلقائيًا ثم ينتظر أن يتقدم تدفق SAS بشكل طبيعي.
ولا يزال يتعين عليك مقارنة SAS بالرموز التعبيرية أو الأرقام العشرية في عميل Matrix لديك وتأكيد "They match" هناك لإكمال التحقق.

لا يقبل OpenClaw تلقائيًا التدفقات المكررة التي يبدأها بنفسه بشكل أعمى. يتخطى بدء التشغيل إنشاء طلب جديد عندما يكون طلب التحقق الذاتي معلّقًا بالفعل.

لا يتم تمرير إشعارات التحقق الخاصة بالبروتوكول/النظام إلى مسار دردشة الوكيل، لذلك لا تنتج `NO_REPLY`.

### نظافة الأجهزة

يمكن أن تتراكم أجهزة Matrix القديمة التي يديرها OpenClaw على الحساب وتجعل الثقة في الغرف المشفرة أصعب في الفهم.
اعرضها باستخدام:

```bash
openclaw matrix devices list
```

أزل أجهزة OpenClaw-managed القديمة باستخدام:

```bash
openclaw matrix devices prune-stale
```

### مخزن التشفير

يستخدم Matrix E2EE مسار التشفير Rust الرسمي في `matrix-js-sdk` ضمن Node، مع `fake-indexeddb` بوصفه shim لـ IndexedDB. يتم حفظ حالة التشفير في ملف snapshot (`crypto-idb-snapshot.json`) واستعادتها عند بدء التشغيل. يُعد ملف snapshot حالة تشغيل حساسة ويتم تخزينه بأذونات ملفات مقيّدة.

توجد حالة التشغيل المشفرة تحت جذور لكل حساب، ولكل مستخدم، ولكل تجزئة رمز مميز في
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
يحتوي هذا الدليل على مخزن المزامنة (`bot-storage.json`)، ومخزن التشفير (`crypto/`)،
وملف مفتاح الاسترداد (`recovery-key.json`)، وsnapshot لـ IndexedDB (`crypto-idb-snapshot.json`)،
وروابط السلاسل (`thread-bindings.json`)، وحالة التحقق عند بدء التشغيل (`startup-verification.json`).
عندما يتغير الرمز المميز لكن تظل هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود
لهذا الثلاثي account/homeserver/user بحيث تظل حالة المزامنة السابقة، وحالة التشفير، وروابط السلاسل،
وحالة التحقق عند بدء التشغيل مرئية.

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي لـ Matrix للحساب المحدد باستخدام:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

أضف `--account <id>` عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

يقبل Matrix عناوين URL للصورة الرمزية من نوع `mxc://` مباشرة. عندما تمرر عنوان URL للصورة الرمزية من نوع `http://` أو `https://`، يقوم OpenClaw أولًا برفعه إلى Matrix ثم يخزن عنوان `mxc://` المحلول مرة أخرى في `channels.matrix.avatarUrl` (أو في تجاوز الحساب المحدد).

## السلاسل

يدعم Matrix سلاسل Matrix الأصلية لكل من الردود التلقائية وعمليات الإرسال عبر أدوات الرسائل.

- يحافظ `dm.sessionScope: "per-user"` (الافتراضي) على توجيه الرسائل الخاصة في Matrix ضمن نطاق المرسل، بحيث يمكن لعدة غرف رسائل خاصة مشاركة جلسة واحدة عندما تُحل إلى النظير نفسه.
- يعزل `dm.sessionScope: "per-room"` كل غرفة رسائل خاصة في Matrix داخل مفتاح جلسة خاص بها مع الاستمرار في استخدام مصادقة الرسائل الخاصة العادية وفحوصات قائمة السماح.
- لا تزال روابط المحادثات الصريحة في Matrix تتفوق على `dm.sessionScope`، لذلك تحتفظ الغرف والسلاسل المرتبطة بالجلسة الهدف التي اختارتها.
- يحافظ `threadReplies: "off"` على الردود في المستوى الأعلى، ويُبقي الرسائل الواردة ضمن السلاسل على الجلسة الأصل.
- يرد `threadReplies: "inbound"` داخل سلسلة فقط عندما تكون الرسالة الواردة موجودة أصلًا في تلك السلسلة.
- يحافظ `threadReplies: "always"` على ردود الغرف داخل سلسلة متجذرة في الرسالة المُحفِّزة ويوجّه تلك المحادثة عبر الجلسة المطابقة ذات النطاق السلسلي بدءًا من أول رسالة محفزة.
- يتجاوز `dm.threadReplies` الإعداد الأعلى مستوىً للرسائل الخاصة فقط. على سبيل المثال، يمكنك إبقاء سلاسل الغرف معزولة مع إبقاء الرسائل الخاصة مسطحة.
- تتضمن الرسائل الواردة ضمن السلاسل الرسالة الجذرية للسلسلة كسياق إضافي للوكيل.
- ترث عمليات الإرسال عبر أدوات الرسائل سلسلة Matrix الحالية تلقائيًا عندما يكون الهدف هو الغرفة نفسها، أو هدف مستخدم الرسائل الخاصة نفسه، ما لم يتم توفير `threadId` صريح.
- لا يتم تفعيل إعادة استخدام هدف مستخدم الرسائل الخاصة ضمن الجلسة نفسها إلا عندما تثبت بيانات تعريف الجلسة الحالية النظير نفسه في الرسائل الخاصة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ضمن نطاق المستخدم.
- عندما يرى OpenClaw أن غرفة رسائل خاصة في Matrix تتصادم مع غرفة رسائل خاصة أخرى على جلسة Matrix DM مشتركة نفسها، فإنه ينشر رسالة `m.notice` لمرة واحدة في تلك الغرفة مع مخرج `/focus` عند تمكين روابط السلاسل وإشارة `dm.sessionScope`.
- يتم دعم روابط السلاسل وقت التشغيل في Matrix. تعمل الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبط بسلسلة داخل غرف Matrix والرسائل الخاصة.
- يؤدي `/focus` في المستوى الأعلى لغرفة/رسالة خاصة في Matrix إلى إنشاء سلسلة Matrix جديدة وربطها بالجلسة الهدف عندما يكون `threadBindings.spawnSubagentSessions=true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة الحالية بدلًا من ذلك.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل الخاصة والسلاسل الموجودة في Matrix إلى مساحات عمل ACP دائمة من دون تغيير سطح الدردشة.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix الخاصة أو الغرفة أو السلسلة الموجودة التي تريد الاستمرار في استخدامها.
- في رسالة خاصة أو غرفة Matrix من المستوى الأعلى، يبقى DM/الغرفة الحالية هي سطح الدردشة وتُوجَّه الرسائل المستقبلية إلى جلسة ACP التي تم إنشاؤها.
- داخل سلسلة Matrix موجودة، يقوم `--bind here` بربط تلك السلسلة الحالية في مكانها.
- يقوم `/new` و`/reset` بإعادة تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يقوم `/acp close` بإغلاق جلسة ACP وإزالة الربط.

ملاحظات:

- لا يقوم `--bind here` بإنشاء سلسلة Matrix فرعية.
- لا يكون `threadBindings.spawnAcpSessions` مطلوبًا إلا مع `/acp spawn --thread auto|here`، عندما يحتاج OpenClaw إلى إنشاء سلسلة Matrix فرعية أو ربطها.

### تهيئة ربط السلاسل

يرث Matrix القيم الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

إشارات الإنشاء المرتبط بالسلسلة في Matrix هي اشتراك اختياري:

- عيّن `threadBindings.spawnSubagentSessions: true` للسماح لـ `/focus` في المستوى الأعلى بإنشاء سلاسل Matrix جديدة وربطها.
- عيّن `threadBindings.spawnAcpSessions: true` للسماح لـ `/acp spawn --thread auto|here` بربط جلسات ACP بسلاسل Matrix.

## التفاعلات

يدعم Matrix إجراءات التفاعل الصادرة، وإشعارات التفاعل الواردة، وتفاعلات الإقرار الواردة.

- يتم تقييد أدوات التفاعل الصادرة بواسطة `channels["matrix"].actions.reactions`.
- يضيف `react` تفاعلًا إلى حدث Matrix محدد.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix محدد.
- يؤدي `emoji=""` إلى إزالة تفاعلات حساب الروبوت نفسه على ذلك الحدث.
- يؤدي `remove: true` إلى إزالة تفاعل الرمز التعبيري المحدد فقط من حساب الروبوت.

يستخدم نطاق تفاعلات الإقرار ترتيب التحليل القياسي في OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- الرجوع إلى الرمز التعبيري لهوية الوكيل

يتم تحليل نطاق تفاعلات الإقرار بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

يتم تحليل وضع إشعارات التفاعل بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- الافتراضي: `own`

السلوك:

- يؤدي `reactionNotifications: "own"` إلى تمرير أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix المكتوبة بواسطة الروبوت.
- يؤدي `reactionNotifications: "off"` إلى تعطيل أحداث نظام التفاعل.
- لا يتم تركيب عمليات إزالة التفاعلات كأحداث نظام لأن Matrix يعرضها كعمليات حذف redact، وليس كعمليات إزالة مستقلة لـ `m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة التي تُدرج كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. ويرجع إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أي منهما مضبوطًا، تكون القيمة الافتراضية الفعلية `0`. عيّن `0` للتعطيل.
- يكون سجل غرف Matrix ضمن الغرفة فقط. وتستمر الرسائل الخاصة في استخدام سجل الجلسة العادي.
- يكون سجل غرف Matrix قيد الانتظار فقط: يقوم OpenClaw بتخزين رسائل الغرفة التي لم تؤدِّ إلى رد بعد، ثم يلتقط snapshot لتلك النافذة عندما تصل إشارة mention أو محفّز آخر.
- لا يتم تضمين رسالة التحفيز الحالية في `InboundHistory`؛ بل تبقى في متن الإدخال الرئيسي لذلك الدور.
- تعيد محاولات الحدث نفسه في Matrix استخدام snapshot السجل الأصلي بدلًا من الانجراف إلى رسائل غرفة أحدث.

## إظهار السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` للسياق الإضافي للغرفة، مثل نص الرد الذي تم جلبه، وجذور السلاسل، والسجل المعلّق.

- `contextVisibility: "all"` هو الإعداد الافتراضي. يتم الاحتفاظ بالسياق الإضافي كما تم استلامه.
- يقوم `contextVisibility: "allowlist"` بتصفية السياق الإضافي إلى المرسلين المسموح لهم بواسطة فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يعمل `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه لا يزال يحتفظ برد مقتبس صريح واحد.

يؤثر هذا الإعداد في إظهار السياق الإضافي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكن أن تؤدي إلى رد.
ويظل تفويض التحفيز صادرًا من إعدادات `groupPolicy` و`groups` و`groupAllowFrom` وسياسات الرسائل الخاصة.

## سياسة الرسائل الخاصة والغرف

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

راجع [Groups](/ar/channels/groups) للاطلاع على سلوك تقييد الذكر وقائمة السماح.

مثال على الاقتران لرسائل Matrix الخاصة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير معتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الاقتران المعلّق نفسه وقد يرسل رد تذكير مرة أخرى بعد فترة تهدئة قصيرة بدلًا من إنشاء رمز جديد.

راجع [Pairing](/ar/channels/pairing) لتدفق اقتران الرسائل الخاصة المشترك وتخطيط التخزين.

## إصلاح الغرف المباشرة

إذا أصبحت حالة الرسائل المباشرة غير متزامنة، فقد ينتهي الأمر بـ OpenClaw مع تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من الرسائل الخاصة النشطة. افحص التعيين الحالي لنظير باستخدام:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

وأصلحه باستخدام:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

تدفق الإصلاح:

- يفضّل رسالة خاصة صارمة 1:1 تم تعيينها بالفعل في `m.direct`
- يعود إلى أي رسالة خاصة صارمة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة خاصة سليمة

لا يحذف تدفق الإصلاح الغرف القديمة تلقائيًا. بل يختار فقط الرسالة الخاصة السليمة ويحدّث التعيين بحيث تستهدف عمليات الإرسال الجديدة في Matrix، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة مرة أخرى.

## موافقات Exec

يمكن أن يعمل Matrix كعميل موافقة أصلي لحساب Matrix. ولا تزال
عناصر توجيه الرسائل الخاصة/القنوات الأصلية موجودة تحت تهيئة موافقات exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (اختياري؛ ويرجع إلى `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

يجب أن يكون الموافقون معرّفات مستخدمي Matrix مثل `@owner:example.org`. يفعّل Matrix الموافقات الأصلية تلقائيًا عندما يكون `enabled` غير مضبوط أو `"auto"` ويمكن تحليل موافِق واحد على الأقل. تستخدم موافقات Exec أولًا `execApprovals.approvers` ويمكن أن تعود إلى `channels.matrix.dm.allowFrom`. وتفوّض موافقات Plugin عبر `channels.matrix.dm.allowFrom`. عيّن `enabled: false` لتعطيل Matrix كعميل موافقة أصلي بشكل صريح. وإلا تعود طلبات الموافقة إلى مسارات الموافقة الأخرى المهيأة أو إلى سياسة الرجوع للموافقة.

يدعم التوجيه الأصلي في Matrix كلا نوعي الموافقات:

- يتحكم `channels.matrix.execApprovals.*` في وضع التوزيع الأصلي إلى الرسائل الخاصة/القنوات لمطالبات الموافقة في Matrix.
- تستخدم موافقات Exec مجموعة الموافقين الخاصة بـ exec من `execApprovals.approvers` أو `channels.matrix.dm.allowFrom`.
- تستخدم موافقات Plugin قائمة سماح الرسائل الخاصة في Matrix من `channels.matrix.dm.allowFrom`.
- تنطبق اختصارات التفاعل في Matrix وتحديثات الرسائل على كل من موافقات exec وموافقات Plugin.

قواعد التسليم:

- يؤدي `target: "dm"` إلى إرسال مطالبات الموافقة إلى الرسائل الخاصة للموافقين
- يؤدي `target: "channel"` إلى إعادة إرسال المطالبة إلى غرفة أو رسالة Matrix الخاصة الأصلية
- يؤدي `target: "both"` إلى الإرسال إلى الرسائل الخاصة للموافقين وإلى غرفة أو رسالة Matrix الخاصة الأصلية

تزرع مطالبات الموافقة في Matrix اختصارات تفاعل على رسالة الموافقة الأساسية:

- `✅` = السماح مرة واحدة
- `❌` = الرفض
- `♾️` = السماح دائمًا عندما يكون هذا القرار مسموحًا به بواسطة سياسة exec الفعلية

يمكن للموافقين التفاعل مع تلك الرسالة أو استخدام أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once` أو `/approve <id> allow-always` أو `/approve <id> deny`.

يمكن فقط للموافقين الذين تم تحليلهم الموافقة أو الرفض. بالنسبة إلى موافقات exec، يتضمن التسليم عبر القناة نص الأمر، لذا فعّل `channel` أو `both` فقط في الغرف الموثوقة.

تجاوز لكل حساب:

- `channels.matrix.accounts.<account>.execApprovals`

الوثائق ذات الصلة: [Exec approvals](/ar/tools/exec-approvals)

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

تعمل القيم ذات المستوى الأعلى في `channels.matrix` كقيم افتراضية للحسابات المسماة ما لم يقم أحد الحسابات بتجاوزها.
يمكنك تقييد إدخالات الغرف الموروثة إلى حساب Matrix واحد باستخدام `groups.<room>.account`.
وتظل الإدخالات التي لا تحتوي على `account` مشتركة بين جميع حسابات Matrix، كما تظل الإدخالات التي تحتوي على `account: "default"` تعمل عندما يكون الحساب الافتراضي مهيأ مباشرة على المستوى الأعلى `channels.matrix.*`.
لا تؤدي القيم الافتراضية المشتركة الجزئية للمصادقة إلى إنشاء حساب افتراضي ضمني منفصل بمفردها. لا يقوم OpenClaw بإنشاء الحساب الأعلى مستوى `default` إلا عندما تكون لدى ذلك الافتراضي مصادقة حديثة (`homeserver` مع `accessToken`، أو `homeserver` مع `userId` و`password`)؛ ويمكن للحسابات المسماة أن تظل قابلة للاكتشاف من خلال `homeserver` مع `userId` عندما تفي بيانات الاعتماد المخبأة بالمصادقة لاحقًا.
إذا كان Matrix يحتوي بالفعل على حساب مسمى واحد بالضبط، أو كان `defaultAccount` يشير إلى مفتاح حساب مسمى موجود، فإن ترقية الإصلاح/الإعداد من حساب واحد إلى حسابات متعددة تحافظ على ذلك الحساب بدلًا من إنشاء إدخال جديد `accounts.default`. تنتقل فقط مفاتيح المصادقة/التهيئة الخاصة بـ Matrix إلى ذلك الحساب المُرقّى؛ بينما تبقى مفاتيح سياسة التسليم المشتركة على المستوى الأعلى.
عيّن `defaultAccount` عندما تريد من OpenClaw أن يفضّل حساب Matrix مسمى واحدًا للتوجيه الضمني، والفحص، وعمليات CLI.
إذا تم إعداد عدة حسابات Matrix وكان أحد معرّفات الحسابات هو `default`، فسيستخدم OpenClaw ذلك الحساب ضمنيًا حتى لو لم يكن `defaultAccount` مضبوطًا.
إذا قمت بإعداد عدة حسابات مسماة، فعيّن `defaultAccount` أو مرّر `--account <id>` لأوامر CLI التي تعتمد على اختيار الحساب الضمني.
مرّر `--account <id>` إلى `openclaw matrix verify ...` و`openclaw matrix devices ...` عندما تريد تجاوز هذا الاختيار الضمني لأمر واحد.

راجع [مرجع التهيئة](/ar/gateway/configuration-reference#multi-account-all-channels) للاطلاع على نمط الحسابات المتعددة المشترك.

## خوادم منزلية خاصة/ضمن LAN

بشكل افتراضي، يحظر OpenClaw خوادم Matrix المنزلية الخاصة/الداخلية للحماية من SSRF ما لم
تقم بالاشتراك الصريح لكل حساب.

إذا كان خادمك المنزلي يعمل على localhost أو على عنوان IP ضمن LAN/Tailscale أو على اسم مضيف داخلي، فقم بتمكين
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

مثال على الإعداد عبر CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

يسمح هذا الاشتراك فقط بالأهداف الخاصة/الداخلية الموثوقة. أما الخوادم المنزلية العامة غير المشفرة مثل
`http://matrix.example.org:8008` فتظل محظورة. يُفضّل استخدام `https://` كلما أمكن.

## تمرير حركة Matrix عبر Proxy

إذا كان نشر Matrix لديك يحتاج إلى Proxy صريح لحركة HTTP(S) الصادرة، فعيّن `channels.matrix.proxy`:

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

يمكن للحسابات المسماة تجاوز القيمة الافتراضية العليا باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد Proxy نفسه لكل من حركة Matrix وقت التشغيل وفحوصات حالة الحساب.

## تحليل الهدف

يقبل Matrix صيغ الأهداف التالية في أي مكان يطلب منك OpenClaw فيه هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

يستخدم بحث الدليل المباشر حساب Matrix المسجل دخوله:

- تستعلم عمليات بحث المستخدمين من دليل مستخدمي Matrix على ذلك الخادم المنزلي.
- تقبل عمليات بحث الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- يكون البحث في أسماء الغرف المنضم إليها بأفضل جهد. إذا تعذر تحليل اسم الغرفة إلى معرّف أو اسم مستعار، فيتم تجاهله في تحليل قائمة السماح وقت التشغيل.

## مرجع التهيئة

- `enabled`: تمكين القناة أو تعطيلها.
- `name`: تسمية اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضّل عند إعداد عدة حسابات Matrix.
- `homeserver`: عنوان URL للخادم المنزلي، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب في Matrix بالاتصال بالخوادم المنزلية الخاصة/الداخلية. قم بتمكين هذا عندما يُحل الخادم المنزلي إلى `localhost` أو عنوان IP ضمن LAN/Tailscale أو مضيف داخلي مثل `matrix-synapse`.
- `proxy`: عنوان URL اختياري لـ HTTP(S) proxy لحركة Matrix. ويمكن للحسابات المسماة تجاوز القيمة الافتراضية العليا باستخدام `proxy` خاص بها.
- `userId`: معرّف مستخدم Matrix الكامل، مثل `@bot:example.org`.
- `accessToken`: رمز وصول للمصادقة القائمة على الرمز. القيم النصية الصريحة وقيم SecretRef مدعومة لكل من `channels.matrix.accessToken` و`channels.matrix.accounts.<id>.accessToken` عبر مزوّدي env/file/exec. راجع [Secrets Management](/ar/gateway/secrets).
- `password`: كلمة مرور لتسجيل الدخول القائم على كلمة المرور. القيم النصية الصريحة وقيم SecretRef مدعومة.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز لتسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL للصورة الرمزية الذاتية المخزّنة لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.
- `encryption`: تمكين E2EE.
- `allowlistOnly`: عندما تكون `true`، تتم ترقية سياسة الغرف `open` إلى `allowlist`، ويتم فرض جميع سياسات الرسائل الخاصة النشطة باستثناء `disabled` (بما في ذلك `pairing` و`open`) إلى `allowlist`. لا يؤثر هذا في سياسات `disabled`.
- `allowBots`: السماح بالرسائل من حسابات Matrix أخرى مهيأة في OpenClaw (`true` أو `"mentions"`).
- `groupPolicy`: `open` أو `allowlist` أو `disabled`.
- `contextVisibility`: وضع إظهار السياق الإضافي للغرفة (`all` أو `allowlist` أو `allowlist_quote`).
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف. معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ ويتم تحليل التطابقات الدقيقة في الدليل عند بدء التشغيل وعند تغيّر قائمة السماح أثناء تشغيل المراقب. يتم تجاهل الأسماء غير المحلولة.
- `historyLimit`: الحد الأقصى لرسائل الغرفة التي يتم تضمينها كسياق سجل المجموعة. ويرجع إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أي منهما مضبوطًا، تكون القيمة الافتراضية الفعلية `0`. عيّن `0` للتعطيل.
- `replyToMode`: `off` أو `first` أو `all` أو `batched`.
- `markdown`: تهيئة Markdown اختيارية للنص الصادر في Matrix.
- `streaming`: `off` (الافتراضي) أو `"partial"` أو `"quiet"` أو `true` أو `false`. يؤدي `"partial"` و`true` إلى تمكين تحديثات المسودات بنمط المعاينة أولًا باستخدام رسائل Matrix النصية العادية. ويستخدم `"quiet"` إشعارات معاينة غير مُرسِلة للإشعارات لإعدادات push-rule المستضافة ذاتيًا. ويكافئ `false` القيمة `"off"`.
- `blockStreaming`: يؤدي `true` إلى تمكين رسائل تقدم منفصلة لكتل المساعد المكتملة أثناء نشاط بث معاينة المسودة.
- `threadReplies`: `off` أو `inbound` أو `always`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالسلاسل ودورة حياتها.
- `startupVerification`: وضع طلب التحقق الذاتي التلقائي عند بدء التشغيل (`if-unverified` أو `off`).
- `startupVerificationCooldownHours`: فترة التهدئة قبل إعادة محاولة طلبات التحقق التلقائي عند بدء التشغيل.
- `textChunkLimit`: حجم تقطيع الرسائل الصادرة بالأحرف (ينطبق عندما يكون `chunkMode` هو `length`).
- `chunkMode`: يقوم `length` بتقسيم الرسائل حسب عدد الأحرف؛ ويقوم `newline` بالتقسيم عند حدود الأسطر.
- `responsePrefix`: سلسلة اختيارية تسبق جميع الردود الصادرة لهذه القناة.
- `ackReaction`: تجاوز اختياري لتفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز اختياري لنطاق تفاعل الإقرار (`group-mentions` أو `group-all` أو `direct` أو `all` أو `none` أو `off`).
- `reactionNotifications`: وضع إشعارات التفاعل الواردة (`own` أو `off`).
- `mediaMaxMb`: الحد الأقصى لحجم الوسائط بالميغابايت لعمليات الإرسال الصادرة ومعالجة الوسائط الواردة.
- `autoJoin`: سياسة الانضمام التلقائي للدعوات (`always` أو `allowlist` أو `off`). الافتراضي: `off`. تنطبق على جميع دعوات Matrix، بما في ذلك الدعوات بنمط الرسائل الخاصة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما يكون `autoJoin` هو `allowlist`. يتم تحليل إدخالات الأسماء المستعارة إلى معرّفات غرف أثناء معالجة الدعوة؛ ولا يثق OpenClaw بحالة الاسم المستعار التي تدّعيها الغرفة المدعو إليها.
- `dm`: كتلة سياسة الرسائل الخاصة (`enabled` أو `policy` أو `allowFrom` أو `sessionScope` أو `threadReplies`).
- `dm.policy`: يتحكم في وصول الرسائل الخاصة بعد أن ينضم OpenClaw إلى الغرفة ويصنفها كرسالة خاصة. ولا يغيّر هذا ما إذا كانت الدعوة تُقبل تلقائيًا.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل الخاصة. معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ ويتم تحليل التطابقات الدقيقة في الدليل عند بدء التشغيل وعند تغيّر قائمة السماح أثناء تشغيل المراقب. يتم تجاهل الأسماء غير المحلولة.
- `dm.sessionScope`: `per-user` (الافتراضي) أو `per-room`. استخدم `per-room` عندما تريد أن تحتفظ كل غرفة رسائل خاصة في Matrix بسياق منفصل حتى لو كان النظير هو نفسه.
- `dm.threadReplies`: تجاوز لسياسة السلاسل في الرسائل الخاصة فقط (`off` أو `inbound` أو `always`). وهو يتجاوز الإعداد الأعلى مستوى `threadReplies` لكل من موضع الرد وعزل الجلسة في الرسائل الخاصة.
- `execApprovals`: تسليم موافقات exec الأصلي في Matrix (`enabled` أو `approvers` أو `target` أو `agentFilter` أو `sessionFilter`).
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة على طلبات exec. وهو اختياري عندما تكون `dm.allowFrom` قد حددت الموافقين بالفعل.
- `execApprovals.target`: `dm | channel | both` (الافتراضي: `dm`).
- `accounts`: تجاوزات مسماة لكل حساب. تعمل القيم العليا في `channels.matrix` كقيم افتراضية لهذه الإدخالات.
- `groups`: خريطة سياسات لكل غرفة. يُفضّل استخدام معرّفات الغرف أو الأسماء المستعارة؛ ويتم تجاهل أسماء الغرف غير المحلولة وقت التشغيل. تستخدم هوية الجلسة/المجموعة معرّف الغرفة المستقر بعد التحليل.
- `groups.<room>.account`: تقييد إدخال غرفة موروث واحد إلى حساب Matrix محدد في إعدادات الحسابات المتعددة.
- `groups.<room>.allowBots`: تجاوز على مستوى الغرفة للمرسلين من الروبوتات المهيأة (`true` أو `"mentions"`).
- `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
- `groups.<room>.tools`: تجاوزات السماح/المنع للأدوات لكل غرفة.
- `groups.<room>.autoReply`: تجاوز على مستوى الغرفة لتقييد الذكر. يؤدي `true` إلى تعطيل متطلبات الذكر لتلك الغرفة؛ ويؤدي `false` إلى فرضها من جديد.
- `groups.<room>.skills`: مرشح Skills اختياري على مستوى الغرفة.
- `groups.<room>.systemPrompt`: مقتطف system prompt اختياري على مستوى الغرفة.
- `rooms`: اسم مستعار قديم لـ `groups`.
- `actions`: تقييد الأدوات لكل إجراء (`messages` أو `reactions` أو `pins` أو `profile` أو `memberInfo` أو `channelInfo` أو `verification`).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [Groups](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الذكر
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
