---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين التشفير التام بين الطرفين والتحقق في Matrix
summary: حالة دعم Matrix، والإعداد، وأمثلة التكوين
title: Matrix
x-i18n:
    generated_at: "2026-04-22T04:20:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e78d85096ea84361951935a0daf34966c575d822f8581277eb384276c7c706a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

‏Matrix هو plugin قناة مضمّن لـ OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، والخيوط، والوسائط، والتفاعلات، والاستطلاعات، والموقع، والتشفير التام بين الطرفين.

## plugin المضمّن

يأتي Matrix كـ plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
الإصدارات المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Matrix، فقم بتثبيته
يدويًا:

التثبيت من npm:

```bash
openclaw plugins install @openclaw/matrix
```

التثبيت من نسخة checkout محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك plugin وقواعد التثبيت.

## الإعداد

1. تأكد من أن plugin ‏Matrix متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ حساب Matrix على homeserver الخاص بك.
3. قم بتكوين `channels.matrix` باستخدام أحد الخيارين:
   - `homeserver` + `accessToken`، أو
   - `homeserver` + `userId` + `password`.
4. أعد تشغيل Gateway.
5. ابدأ رسالة مباشرة مع البوت أو ادعه إلى غرفة.
   - تعمل دعوات Matrix الجديدة فقط عندما يسمح `channels.matrix.autoJoin` بذلك.

مسارات الإعداد التفاعلية:

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب معالج Matrix ما يلي:

- عنوان URL لـ homeserver
- طريقة المصادقة: access token أو كلمة مرور
- معرّف المستخدم (لمصادقة كلمة المرور فقط)
- اسم الجهاز الاختياري
- ما إذا كان يجب تمكين التشفير التام بين الطرفين
- ما إذا كان يجب تكوين وصول الغرف والانضمام التلقائي للدعوات

سلوكيات المعالج الأساسية:

- إذا كانت متغيرات بيئة مصادقة Matrix موجودة بالفعل ولم يكن لهذا الحساب مصادقة محفوظة في التكوين، فسيعرض المعالج اختصارًا لمتغيرات البيئة للإبقاء على المصادقة في متغيرات البيئة.
- يتم توحيد أسماء الحسابات إلى معرّف الحساب. على سبيل المثال، يتحول `Ops Bot` إلى `ops-bot`.
- تقبل إدخالات قائمة السماح للرسائل المباشرة `@user:server` مباشرة؛ ولا تعمل أسماء العرض إلا عندما يعثر البحث المباشر في الدليل على تطابق واحد دقيق.
- تقبل إدخالات قائمة السماح للغرف معرّفات الغرف والأسماء المستعارة مباشرة. يُفضّل استخدام `!room:server` أو `#alias:server`؛ ويتم تجاهل الأسماء غير المحلولة في وقت التشغيل أثناء حل قائمة السماح.
- في وضع قائمة السماح للانضمام التلقائي للدعوات، استخدم فقط أهداف الدعوة الثابتة: `!roomId:server` أو `#alias:server` أو `*`. يتم رفض أسماء الغرف العادية.
- لحل أسماء الغرف قبل الحفظ، استخدم `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`.

إذا تركته بدون تعيين، فلن ينضم البوت إلى الغرف المدعو إليها أو دعوات الرسائل المباشرة الجديدة، لذلك لن يظهر في المجموعات الجديدة أو الرسائل المباشرة المدعو إليها ما لم تنضم يدويًا أولًا.

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

إعداد بسيط يعتمد على token:

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

إعداد يعتمد على كلمة المرور (يتم تخزين token مؤقتًا بعد تسجيل الدخول):

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
عند وجود بيانات اعتماد مؤقتة هناك، يتعامل OpenClaw مع Matrix على أنه مُكوَّن لأغراض الإعداد وdoctor واكتشاف حالة القناة حتى إذا لم تكن المصادقة الحالية معيّنة مباشرة في التكوين.

المكافئات في متغيرات البيئة (تُستخدم عندما لا يكون مفتاح التكوين مضبوطًا):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

للحسابات غير الافتراضية، استخدم متغيرات بيئة بنطاق خاص بالحساب:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

مثال للحساب `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

وبالنسبة إلى معرّف الحساب الموحّد `ops-bot`، استخدم:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

يقوم Matrix بتهريب علامات الترقيم في معرّفات الحسابات للحفاظ على عدم تعارض متغيرات البيئة ذات النطاق الخاص.
على سبيل المثال، يتحول `-` إلى `_X2D_`، لذلك يتم تحويل `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

لا يعرض المعالج التفاعلي اختصار متغيرات البيئة إلا عندما تكون متغيرات بيئة المصادقة هذه موجودة بالفعل ولا يكون الحساب المحدد لديه مصادقة Matrix محفوظة في التكوين.

## مثال على التكوين

هذا تكوين أساسي عملي مع pairing للرسائل المباشرة، وقائمة سماح للغرف، وتمكين التشفير التام بين الطرفين:

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
تصنيف الغرفة المدعو إليها بشكل موثوق على أنها رسالة مباشرة أو مجموعة في وقت الدعوة، لذلك تمر جميع الدعوات عبر `autoJoin`
أولًا. ويتم تطبيق `dm.policy` بعد أن ينضم البوت وتُصنَّف الغرفة على أنها رسالة مباشرة.

## معاينات البث

بث الردود في Matrix يتم عبر الاشتراك الاختياري.

عيّن `channels.matrix.streaming` إلى `"partial"` عندما تريد من OpenClaw إرسال معاينة مباشرة واحدة
للرد، وتعديل هذه المعاينة في مكانها أثناء قيام النموذج بإنشاء النص، ثم إنهاءها عند
اكتمال الرد:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` هو الإعداد الافتراضي. ينتظر OpenClaw الرد النهائي ثم يرسله مرة واحدة.
- `streaming: "partial"` ينشئ رسالة معاينة واحدة قابلة للتعديل لكتلة المساعد الحالية باستخدام رسائل Matrix النصية العادية. يحافظ هذا على سلوك الإشعارات القديم في Matrix القائم على المعاينة أولًا، لذلك قد ترسل العملاء الافتراضيون إشعارًا عند أول نص معاينة متدفق بدلًا من الكتلة المكتملة.
- `streaming: "quiet"` ينشئ إشعار معاينة هادئًا واحدًا قابلًا للتعديل لكتلة المساعد الحالية. استخدم هذا فقط عندما تقوم أيضًا بتكوين قواعد push للمستلمين من أجل تعديلات المعاينة النهائية.
- `blockStreaming: true` يمكّن رسائل تقدم Matrix المنفصلة. عند تمكين بث المعاينة، يحتفظ Matrix بالمسودة المباشرة للكتلة الحالية ويحافظ على الكتل المكتملة كرسائل منفصلة.
- عندما تكون معاينة البث قيد التشغيل و`blockStreaming` متوقفًا، يقوم Matrix بتعديل المسودة المباشرة في مكانها وينهي الحدث نفسه عند اكتمال الكتلة أو الدور.
- إذا لم تعد المعاينة تتسع في حدث Matrix واحد، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي العادي.
- تستمر ردود الوسائط في إرسال المرفقات بشكل طبيعي. وإذا لم يعد من الممكن إعادة استخدام معاينة قديمة بأمان، يقوم OpenClaw بحذفها قبل إرسال رد الوسائط النهائي.
- تتطلب تعديلات المعاينة استدعاءات إضافية إلى Matrix API. اترك البث معطّلًا إذا كنت تريد السلوك الأكثر تحفظًا فيما يتعلق بحدود المعدل.

لا يقوم `blockStreaming` بتمكين معاينات المسودات بمفرده.
استخدم `streaming: "partial"` أو `streaming: "quiet"` لتعديلات المعاينة؛ ثم أضف `blockStreaming: true` فقط إذا كنت تريد أيضًا أن تظل كتل المساعد المكتملة مرئية كرسائل تقدم منفصلة.

إذا كنت بحاجة إلى إشعارات Matrix الافتراضية من دون قواعد push مخصصة، فاستخدم `streaming: "partial"` لسلوك المعاينة أولًا أو اترك `streaming` متوقفًا للتسليم النهائي فقط. مع `streaming: "off"`:

- يرسل `blockStreaming: true` كل كتلة مكتملة كرسالة Matrix عادية مع إشعار.
- يرسل `blockStreaming: false` الرد المكتمل النهائي فقط كرسالة Matrix عادية مع إشعار.

### قواعد push ذاتية الاستضافة لمعاينات نهائية هادئة

إذا كنت تدير بنية Matrix التحتية الخاصة بك وتريد أن ترسل المعاينات الهادئة إشعارًا فقط عند اكتمال كتلة أو
الرد النهائي، فعيّن `streaming: "quiet"` وأضف قاعدة push لكل مستخدم من أجل تعديلات المعاينة النهائية.

يكون هذا عادة إعدادًا على مستوى المستخدم المستلم، وليس تغييرًا عالميًا في تكوين homeserver:

خريطة سريعة قبل البدء:

- المستخدم المستلم = الشخص الذي يجب أن يتلقى الإشعار
- مستخدم البوت = حساب OpenClaw Matrix الذي يرسل الرد
- استخدم access token الخاص بالمستخدم المستلم في استدعاءات API أدناه
- طابق `sender` في قاعدة push مع MXID الكامل لمستخدم البوت

1. قم بتكوين OpenClaw لاستخدام المعاينات الهادئة:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. تأكد من أن الحساب المستلم يتلقى بالفعل إشعارات Matrix push العادية. لا تعمل قواعد
   المعاينة الهادئة إلا إذا كان لدى هذا المستخدم بالفعل pushers/أجهزة عاملة.

3. احصل على access token الخاص بالمستخدم المستلم.
   - استخدم token الخاص بالمستخدم المتلقي، وليس token الخاص بالبوت.
   - تكون إعادة استخدام token جلسة عميل موجودة عادة أسهل.
   - إذا كنت بحاجة إلى إنشاء token جديد، يمكنك تسجيل الدخول عبر Matrix Client-Server API القياسي:

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

4. تحقق من أن حساب المستلم لديه pushers بالفعل:

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

- `https://matrix.example.org`: عنوان URL الأساسي لـ homeserver الخاص بك
- `$USER_ACCESS_TOKEN`: access token الخاص بالمستخدم المتلقي
- `openclaw-finalized-preview-botname`: معرّف قاعدة فريد لهذا البوت لهذا المستخدم المتلقي
- `@bot:example.org`: ‏MXID لبوت OpenClaw Matrix الخاص بك، وليس MXID الخاص بالمستخدم المتلقي

مهم لإعدادات متعددة البوتات:

- تُفهرس قواعد push بحسب `ruleId`. تؤدي إعادة تشغيل `PUT` على معرّف القاعدة نفسه إلى تحديث تلك القاعدة نفسها.
- إذا كان ينبغي لمستخدمٍ مستلم واحد أن يتلقى إشعارات لعدة حسابات بوت Matrix من OpenClaw، فأنشئ قاعدة واحدة لكل بوت مع معرّف قاعدة فريد لكل تطابق `sender`.
- النمط البسيط هو `openclaw-finalized-preview-<botname>`، مثل `openclaw-finalized-preview-ops` أو `openclaw-finalized-preview-support`.

يتم تقييم القاعدة على مرسل الحدث:

- قم بالمصادقة باستخدام token الخاص بالمستخدم المستلم
- طابق `sender` مع MXID لبوت OpenClaw

6. تحقّق من وجود القاعدة:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. اختبر ردًا متدفقًا. في الوضع الهادئ، يجب أن تُظهر الغرفة معاينة مسودة هادئة، ويجب أن يرسل
   التعديل النهائي في المكان نفسه إشعارًا واحدًا عند انتهاء الكتلة أو الدور.

إذا احتجت إلى إزالة القاعدة لاحقًا، فاحذف معرّف القاعدة نفسه باستخدام token الخاص بالمستخدم المستلم:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

ملاحظات:

- أنشئ القاعدة باستخدام access token الخاص بالمستخدم المستلم، وليس token الخاص بالبوت.
- تُدرج قواعد `override` الجديدة المعرّفة من المستخدم قبل قواعد المنع الافتراضية، لذلك لا حاجة إلى أي معامل ترتيب إضافي.
- يؤثر هذا فقط في تعديلات المعاينة النصية فقط التي يستطيع OpenClaw إنهاءها بأمان في المكان نفسه. أما بدائل الوسائط وبدائل المعاينات القديمة فما زالت تستخدم تسليم Matrix العادي.
- إذا أظهر `GET /_matrix/client/v3/pushers` عدم وجود pushers، فهذا يعني أن المستخدم لا يملك بعد تسليم push عاملًا في Matrix لهذا الحساب/الجهاز.

#### Synapse

بالنسبة إلى Synapse، يكون الإعداد أعلاه كافيًا عادةً بمفرده:

- لا يلزم أي تغيير خاص في `homeserver.yaml` لإشعارات معاينة OpenClaw النهائية.
- إذا كانت بيئة Synapse لديك ترسل بالفعل إشعارات Matrix العادية، فإن token المستخدم واستدعاء `pushrules` أعلاه هما خطوة الإعداد الأساسية.
- إذا كنت تشغّل Synapse خلف reverse proxy أو workers، فتأكد من أن `/_matrix/client/.../pushrules/` يصل إلى Synapse بشكل صحيح.
- إذا كنت تشغّل Synapse workers، فتأكد من أن pushers بحالة سليمة. تتم معالجة تسليم push بواسطة العملية الرئيسية أو `synapse.app.pusher` / pusher workers المكوّنة.

#### Tuwunel

بالنسبة إلى Tuwunel، استخدم تدفق الإعداد نفسه واستدعاء API لـ push-rule المعروض أعلاه:

- لا يلزم أي تكوين خاص بـ Tuwunel من أجل علامة المعاينة النهائية نفسها.
- إذا كانت إشعارات Matrix العادية تعمل بالفعل لهذا المستخدم، فإن token المستخدم واستدعاء `pushrules` أعلاه هما خطوة الإعداد الأساسية.
- إذا بدت الإشعارات وكأنها تختفي بينما يكون المستخدم نشطًا على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` مفعّلًا. أضاف Tuwunel هذا الخيار في Tuwunel 1.4.2 بتاريخ 12 سبتمبر 2025، ويمكنه عمدًا منع pushes إلى الأجهزة الأخرى بينما يكون أحد الأجهزة نشطًا.

## غرف bot إلى bot

بشكل افتراضي، يتم تجاهل رسائل Matrix الواردة من حسابات OpenClaw Matrix الأخرى المكوّنة.

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

- يقبل `allowBots: true` الرسائل الواردة من حسابات bot Matrix الأخرى المكوّنة في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا البوت بوضوح في الغرف. وتظل الرسائل المباشرة مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- ما زال OpenClaw يتجاهل الرسائل الواردة من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفّر Matrix هنا علامة bot أصلية؛ ويتعامل OpenClaw مع "مؤلف بواسطة bot" على أنه "مرسل بواسطة حساب Matrix مكوّن آخر على Gateway ‏OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تمكين حركة bot إلى bot في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تُشفّر معاينات الصور إلى جانب المرفق الكامل. أما الغرف غير المشفرة فما زالت تستخدم `thumbnail_url` العادي. لا يلزم أي تكوين — يكتشف plugin حالة E2EE تلقائيًا.

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

حالة مفصلة (تشخيصات كاملة):

```bash
openclaw matrix verify status --verbose
```

تضمين مفتاح الاسترداد المخزن في المخرجات القابلة للقراءة آليًا:

```bash
openclaw matrix verify status --include-recovery-key --json
```

تهيئة cross-signing وحالة التحقق:

```bash
openclaw matrix verify bootstrap
```

تشخيصات bootstrap مفصلة:

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

تفاصيل مفصلة للتحقق من الجهاز:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

التحقق من سلامة النسخ الاحتياطي لمفاتيح الغرف:

```bash
openclaw matrix verify backup status
```

تشخيصات مفصلة لسلامة النسخ الاحتياطي:

```bash
openclaw matrix verify backup status --verbose
```

استعادة مفاتيح الغرف من النسخة الاحتياطية على الخادم:

```bash
openclaw matrix verify backup restore
```

تشخيصات مفصلة للاستعادة:

```bash
openclaw matrix verify backup restore --verbose
```

احذف النسخة الاحتياطية الحالية على الخادم وأنشئ خط أساس جديدًا للنسخ الاحتياطي. إذا تعذر
تحميل مفتاح النسخ الاحتياطي المخزن بشكل سليم، فيمكن أن تعيد عملية إعادة التعيين هذه أيضًا إنشاء التخزين السري بحيث
تتمكن عمليات البدء الباردة المستقبلية من تحميل مفتاح النسخ الاحتياطي الجديد:

```bash
openclaw matrix verify backup reset --yes
```

تكون جميع أوامر `verify` موجزة افتراضيًا (بما في ذلك تسجيل SDK الداخلي الهادئ) ولا تعرض التشخيصات المفصلة إلا مع `--verbose`.
استخدم `--json` للحصول على مخرجات كاملة قابلة للقراءة آليًا عند كتابة السكربتات.

في إعدادات الحسابات المتعددة، تستخدم أوامر Matrix CLI حساب Matrix الافتراضي الضمني ما لم تمرر `--account <id>`.
إذا قمت بتكوين عدة حسابات مسماة، فعيّن `channels.matrix.defaultAccount` أولًا وإلا ستتوقف عمليات CLI الضمنية تلك وتطلب منك اختيار حساب بشكل صريح.
استخدم `--account` كلما أردت أن تستهدف عمليات التحقق أو الجهاز حسابًا مسمى بشكل صريح:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

عندما يكون التشفير معطّلًا أو غير متاح لحساب مسمى، تشير تحذيرات Matrix وأخطاء التحقق إلى مفتاح تكوين ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

### ما معنى "تم التحقق"

يتعامل OpenClaw مع جهاز Matrix هذا على أنه موثوق فقط عندما يتم التحقق منه بواسطة هوية cross-signing الخاصة بك.
عمليًا، يكشف `openclaw matrix verify status --verbose` عن ثلاث إشارات ثقة:

- `Locally trusted`: هذا الجهاز موثوق من قبل العميل الحالي فقط
- `Cross-signing verified`: يبلغ SDK أن الجهاز تم التحقق منه عبر cross-signing
- `Signed by owner`: الجهاز موقّع بواسطة مفتاح self-signing الخاص بك

تصبح `Verified by owner` مساوية لـ `yes` فقط عند وجود تحقق عبر cross-signing أو توقيع من المالك.
الثقة المحلية وحدها لا تكفي لكي يعامل OpenClaw الجهاز على أنه موثوق بالكامل.

### ما الذي يفعله bootstrap

الأمر `openclaw matrix verify bootstrap` هو أمر الإصلاح والإعداد لحسابات Matrix المشفرة.
ويقوم بكل ما يلي بالترتيب:

- يهيئ التخزين السري، مع إعادة استخدام مفتاح استرداد موجود إن أمكن
- يهيئ cross-signing ويرفع مفاتيح cross-signing العامة الناقصة
- يحاول تمييز الجهاز الحالي وتوقيعه عبر cross-signing
- ينشئ نسخة احتياطية جديدة لمفاتيح الغرف على جانب الخادم إذا لم تكن موجودة بالفعل

إذا كان homeserver يتطلب مصادقة تفاعلية لرفع مفاتيح cross-signing، يحاول OpenClaw الرفع بدون مصادقة أولًا، ثم باستخدام `m.login.dummy`، ثم باستخدام `m.login.password` عندما يكون `channels.matrix.password` مكوّنًا.

استخدم `--force-reset-cross-signing` فقط عندما تريد عمدًا تجاهل هوية cross-signing الحالية وإنشاء هوية جديدة.

إذا كنت تريد عمدًا تجاهل النسخة الاحتياطية الحالية لمفاتيح الغرف وبدء
خط أساس جديد للنسخ الاحتياطي للرسائل المستقبلية، فاستخدم `openclaw matrix verify backup reset --yes`.
افعل ذلك فقط عندما تقبل أن السجل المشفر القديم غير القابل للاسترداد سيظل
غير متاح وأن OpenClaw قد يعيد إنشاء التخزين السري إذا تعذر تحميل
سر النسخ الاحتياطي الحالي بأمان.

### خط أساس جديد للنسخ الاحتياطي

إذا كنت تريد الحفاظ على عمل الرسائل المشفرة المستقبلية وتقبل فقدان السجل القديم غير القابل للاسترداد، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

أضف `--account <id>` إلى كل أمر عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

### سلوك بدء التشغيل

عندما يكون `encryption: true`، يضبط Matrix القيمة الافتراضية لـ `startupVerification` على `"if-unverified"`.
عند بدء التشغيل، إذا كان هذا الجهاز ما يزال غير موثوق، فسيطلب Matrix التحقق الذاتي في عميل Matrix آخر،
ويتخطى الطلبات المكررة عندما يكون أحدها معلقًا بالفعل، ويطبّق مهلة محلية قبل إعادة المحاولة بعد عمليات إعادة التشغيل.
تُعاد محاولة الطلبات الفاشلة أسرع افتراضيًا من الإنشاء الناجح للطلبات.
عيّن `startupVerification: "off"` لتعطيل طلبات بدء التشغيل التلقائية، أو عدّل `startupVerificationCooldownHours`
إذا كنت تريد نافذة إعادة محاولة أقصر أو أطول.

ينفّذ بدء التشغيل أيضًا تمرير bootstrap محافظًا للتشفير تلقائيًا.
يحاول هذا التمرير أولًا إعادة استخدام التخزين السري الحالي وهوية cross-signing الحالية، ويتجنب إعادة تعيين cross-signing ما لم تشغّل تدفق إصلاح bootstrap صريحًا.

إذا ظل بدء التشغيل يجد حالة bootstrap معطلة، فيمكن لـ OpenClaw محاولة مسار إصلاح محروس حتى عندما لا يكون `channels.matrix.password` مكوّنًا.
إذا كان homeserver يتطلب UIA قائمًا على كلمة المرور لهذا الإصلاح، فسيسجل OpenClaw تحذيرًا ويحافظ على عدم فشل بدء التشغيل بدلًا من إيقاف البوت.
إذا كان الجهاز الحالي موقّعًا بالفعل من قبل المالك، فسيحافظ OpenClaw على تلك الهوية بدلًا من إعادة تعيينها تلقائيًا.

راجع [ترحيل Matrix](/ar/install/migrating-matrix) لمعرفة تدفق الترقية الكامل، والقيود، وأوامر الاسترداد، ورسائل الترحيل الشائعة.

### إشعارات التحقق

ينشر Matrix إشعارات دورة حياة التحقق مباشرة في غرفة التحقق الصارمة للرسائل المباشرة كرسائل `m.notice`.
ويشمل ذلك:

- إشعارات طلب التحقق
- إشعارات جاهزية التحقق (مع إرشادات صريحة "تحقق عبر الرموز التعبيرية")
- إشعارات بدء التحقق واكتماله
- تفاصيل SAS (الرموز التعبيرية والأرقام العشرية) عند توفرها

تتم متابعة طلبات التحقق الواردة من عميل Matrix آخر وقبولها تلقائيًا بواسطة OpenClaw.
وفي تدفقات التحقق الذاتي، يبدأ OpenClaw أيضًا تدفق SAS تلقائيًا عندما يصبح التحقق عبر الرموز التعبيرية متاحًا ويؤكد جانبه الخاص.
أما طلبات التحقق من مستخدم/جهاز Matrix آخر، فيقبل OpenClaw الطلب تلقائيًا ثم ينتظر استمرار تدفق SAS بشكل طبيعي.
ومع ذلك، لا تزال بحاجة إلى مقارنة SAS التعبيري أو العشري في عميل Matrix لديك وتأكيد "They match" هناك لإكمال التحقق.

لا يقبل OpenClaw تلقائيًا التدفقات المكررة التي بدأها بنفسه بشكل أعمى. يتخطى بدء التشغيل إنشاء طلب جديد عندما يكون طلب تحقق ذاتي معلقًا بالفعل.

لا تتم إعادة توجيه إشعارات التحقق/النظام إلى مسار دردشة الوكيل، لذلك لا تنتج `NO_REPLY`.

### نظافة الأجهزة

يمكن أن تتراكم أجهزة Matrix القديمة التي يديرها OpenClaw على الحساب وتجعل من الأصعب فهم الثقة في الغرف المشفرة.
اعرضها باستخدام:

```bash
openclaw matrix devices list
```

أزل أجهزة OpenClaw Matrix القديمة غير المستخدمة باستخدام:

```bash
openclaw matrix devices prune-stale
```

### مخزن التشفير

يستخدم Matrix E2EE مسار التشفير Rust الرسمي في `matrix-js-sdk` ضمن Node، مع `fake-indexeddb` كطبقة IndexedDB shim. يتم حفظ حالة التشفير في ملف snapshot (`crypto-idb-snapshot.json`) واستعادتها عند بدء التشغيل. ملف snapshot هو حالة تشغيل حساسة ويتم تخزينه بأذونات ملفات مقيّدة.

توجد حالة التشغيل المشفرة ضمن جذور لكل حساب ولكل مستخدم ولكل token-hash في
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
ويحتوي هذا الدليل على مخزن المزامنة (`bot-storage.json`) ومخزن التشفير (`crypto/`)،
وملف مفتاح الاسترداد (`recovery-key.json`) وsnapshot لـ IndexedDB (`crypto-idb-snapshot.json`)،
وارتباطات الخيوط (`thread-bindings.json`) وحالة تحقق بدء التشغيل (`startup-verification.json`).
عندما يتغير token بينما تظل هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود
لهذا الثلاثي account/homeserver/user بحيث تظل حالة المزامنة السابقة، وحالة التشفير، وارتباطات الخيوط،
وحالة تحقق بدء التشغيل مرئية.

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد باستخدام:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

أضف `--account <id>` عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

يقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرة. وعندما تمرر عنوان URL للصورة الرمزية بصيغة `http://` أو `https://`، يقوم OpenClaw أولًا برفعه إلى Matrix ثم يخزن عنوان `mxc://` الناتج مرة أخرى في `channels.matrix.avatarUrl` (أو في تجاوز الحساب المحدد).

## الخيوط

يدعم Matrix خيوط Matrix الأصلية لكل من الردود التلقائية وعمليات الإرسال عبر أدوات الرسائل.

- يحتفظ `dm.sessionScope: "per-user"` (الافتراضي) بتوجيه الرسائل المباشرة في Matrix على نطاق المرسل، بحيث يمكن لعدة غرف رسائل مباشرة مشاركة جلسة واحدة عندما تُحل إلى النظير نفسه.
- يعزل `dm.sessionScope: "per-room"` كل غرفة رسائل مباشرة في Matrix ضمن مفتاح جلسة خاص بها مع الاستمرار في استخدام مصادقة الرسائل المباشرة العادية وفحوصات قائمة السماح.
- تظل ارتباطات المحادثات الصريحة في Matrix لها الأولوية على `dm.sessionScope`، لذلك تحتفظ الغرف والخيوط المرتبطة بجلسة الهدف المختارة.
- يبقي `threadReplies: "off"` الردود في المستوى الأعلى ويبقي الرسائل الواردة ضمن خيوط على الجلسة الأصل.
- يرد `threadReplies: "inbound"` داخل خيط فقط عندما تكون الرسالة الواردة أصلًا ضمن ذلك الخيط.
- يبقي `threadReplies: "always"` ردود الغرف داخل خيط جذره الرسالة المحفِّزة ويوجه تلك المحادثة عبر الجلسة المطابقة ذات نطاق الخيط بدءًا من أول رسالة محفِّزة.
- يتجاوز `dm.threadReplies` الإعداد ذي المستوى الأعلى للرسائل المباشرة فقط. على سبيل المثال، يمكنك إبقاء خيوط الغرف معزولة مع إبقاء الرسائل المباشرة مسطحة.
- تتضمن الرسائل الواردة ضمن خيوط رسالة جذر الخيط كسياق إضافي للوكيل.
- ترث عمليات الإرسال عبر أدوات الرسائل خيط Matrix الحالي تلقائيًا عندما يكون الهدف هو الغرفة نفسها أو هدف مستخدم الرسائل المباشرة نفسه، ما لم يتم توفير `threadId` صريح.
- لا يُفعَّل إعادة استخدام هدف مستخدم الرسائل المباشرة للجلسة نفسها إلا عندما تثبت بيانات تعريف الجلسة الحالية النظير نفسه في الرسائل المباشرة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي على نطاق المستخدم.
- عندما يرى OpenClaw أن غرفة رسائل مباشرة في Matrix تتعارض مع غرفة رسائل مباشرة أخرى على جلسة Matrix DM المشتركة نفسها، فإنه ينشر رسالة `m.notice` لمرة واحدة في تلك الغرفة مع مخرج `/focus` عند تمكين ارتباطات الخيوط وتلميح `dm.sessionScope`.
- ارتباطات الخيوط في وقت التشغيل مدعومة في Matrix. تعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبطة بالخيوط في غرف Matrix والرسائل المباشرة.
- يقوم `/focus` في المستوى الأعلى لغرفة/رسالة مباشرة في Matrix بإنشاء خيط Matrix جديد وربطه بجلسة الهدف عندما يكون `threadBindings.spawnSubagentSessions=true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل خيط Matrix موجود إلى ربط هذا الخيط الحالي بدلًا من ذلك.

## ارتباطات محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وخيوط Matrix الموجودة إلى مساحات عمل ACP دائمة دون تغيير واجهة الدردشة.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسائل المباشرة أو الغرفة أو الخيط الموجود في Matrix الذي تريد الاستمرار في استخدامه.
- في رسالة مباشرة أو غرفة Matrix من المستوى الأعلى، يظل DM/الغرفة الحالية هي واجهة الدردشة وتُوجَّه الرسائل المستقبلية إلى جلسة ACP التي تم إنشاؤها.
- داخل خيط Matrix موجود، يقوم `--bind here` بربط هذا الخيط الحالي في مكانه.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

ملاحظات:

- لا ينشئ `--bind here` خيط Matrix فرعيًا.
- لا يكون `threadBindings.spawnAcpSessions` مطلوبًا إلا من أجل `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء خيط Matrix فرعي أو ربطه.

### تكوين ربط الخيوط

يرث Matrix القيم الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

علامات الإنشاء المرتبط بالخيوط في Matrix تعمل بالاشتراك الاختياري:

- عيّن `threadBindings.spawnSubagentSessions: true` للسماح لـ `/focus` في المستوى الأعلى بإنشاء خيوط Matrix جديدة وربطها.
- عيّن `threadBindings.spawnAcpSessions: true` للسماح لـ `/acp spawn --thread auto|here` بربط جلسات ACP بخيوط Matrix.

## التفاعلات

يدعم Matrix إجراءات التفاعل الصادرة، وإشعارات التفاعل الواردة، وتفاعلات الإقرار الواردة.

- يتم تقييد أدوات التفاعل الصادرة بواسطة `channels["matrix"].actions.reactions`.
- يضيف `react` تفاعلًا إلى حدث Matrix محدد.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix محدد.
- تؤدي `emoji=""` إلى إزالة تفاعلات حساب البوت نفسه على ذلك الحدث.
- تؤدي `remove: true` إلى إزالة تفاعل emoji المحدد فقط من حساب البوت.

يستخدم نطاق تفاعلات الإقرار ترتيب الحل القياسي في OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback إلى emoji هوية الوكيل

يُحل نطاق تفاعل الإقرار بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

يُحل وضع إشعارات التفاعل بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- الافتراضي: `own`

السلوك:

- يقوم `reactionNotifications: "own"` بإعادة توجيه أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix المؤلفة بواسطة bot.
- يؤدي `reactionNotifications: "off"` إلى تعطيل أحداث نظام التفاعل.
- لا تتم محاكاة إزالة التفاعلات كأحداث نظام لأن Matrix يعرضها كعمليات redaction، وليس كإزالات مستقلة لـ `m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة التي تُضمَّن كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا كان كلاهما غير مضبوط، فالقيمة الافتراضية الفعلية هي `0`. عيّن `0` للتعطيل.
- يقتصر سجل غرف Matrix على الغرف فقط. وتستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- سجل غرف Matrix خاص بالرسائل المعلقة فقط: يقوم OpenClaw بتخزين رسائل الغرفة التي لم تؤدِّ إلى رد بعد، ثم يلتقط snapshot لتلك النافذة عندما يصل ذكر أو محفّز آخر.
- لا يتم تضمين رسالة التحفيز الحالية في `InboundHistory`؛ بل تبقى في متن الرسالة الواردة الرئيسي لذلك الدور.
- تعيد محاولات الحدث نفسه في Matrix استخدام snapshot السجل الأصلي بدلًا من الانجراف إلى رسائل غرفة أحدث.

## ظهور السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` للسياق الإضافي للغرف مثل نص الرد الذي تم جلبه، وجذور الخيوط، والسجل المعلق.

- `contextVisibility: "all"` هو الإعداد الافتراضي. يتم الاحتفاظ بالسياق الإضافي كما وصل.
- يقوم `contextVisibility: "allowlist"` بتصفية السياق الإضافي إلى المرسلين المسموح لهم وفق فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يعمل `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يحتفظ مع ذلك برد مقتبس صريح واحد.

يؤثر هذا الإعداد في ظهور السياق الإضافي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكن أن تؤدي إلى رد.
ويظل تفويض التحفيز آتيًا من إعدادات `groupPolicy` و`groups` و`groupAllowFrom` وسياسة الرسائل المباشرة.

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

راجع [Groups](/ar/channels/groups) لمعرفة سلوك تقييد الذكر وقائمة السماح.

مثال على pairing لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير المعتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز pairing المعلق نفسه وقد يرسل رد تذكير مرة أخرى بعد مهلة قصيرة بدلًا من إنشاء رمز جديد.

راجع [Pairing](/ar/channels/pairing) لمعرفة تدفق pairing المشترك للرسائل المباشرة وتخطيط التخزين.

## إصلاح الغرف المباشرة

إذا خرجت حالة الرسائل المباشرة عن المزامنة، فقد ينتهي الأمر بـ OpenClaw إلى امتلاك تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من DM الحي. افحص التعيين الحالي لنظير باستخدام:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

وأصلحه باستخدام:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

تدفق الإصلاح:

- يفضّل DM صارم 1:1 يكون معيّنًا بالفعل في `m.direct`
- يعود إلى أي DM صارم 1:1 منضم إليه حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم يكن هناك DM سليم

لا يقوم تدفق الإصلاح بحذف الغرف القديمة تلقائيًا. فهو فقط يختار DM السليم ويحدّث التعيين بحيث تستهدف عمليات الإرسال الجديدة في Matrix وإشعارات التحقق وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة من جديد.

## موافقات Exec

يمكن أن يعمل Matrix كعميل موافقة أصلي لحساب Matrix. وما تزال
عناصر توجيه الرسائل المباشرة/القنوات الأصلية موجودة تحت تكوين موافقة exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (اختياري؛ يعود إلى `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

يجب أن يكون الموافقون معرّفات مستخدم Matrix مثل `@owner:example.org`. يفعّل Matrix الموافقات الأصلية تلقائيًا عندما يكون `enabled` غير مضبوط أو يساوي `"auto"` ويمكن حلّ موافق واحد على الأقل. تستخدم موافقات Exec أولًا `execApprovals.approvers` ويمكن أن تعود إلى `channels.matrix.dm.allowFrom`. وتخوّل موافقات Plugin عبر `channels.matrix.dm.allowFrom`. عيّن `enabled: false` لتعطيل Matrix كعميل موافقة أصلي بشكل صريح. وخلاف ذلك، تعود طلبات الموافقة إلى مسارات الموافقة المكوّنة الأخرى أو إلى سياسة fallback للموافقة.

يدعم التوجيه الأصلي في Matrix كلا نوعي الموافقات:

- يتحكم `channels.matrix.execApprovals.*` في وضع التوزيع الأصلي للرسائل المباشرة/القنوات لطلبات الموافقة في Matrix.
- تستخدم موافقات Exec مجموعة الموافقين التنفيذية من `execApprovals.approvers` أو `channels.matrix.dm.allowFrom`.
- تستخدم موافقات Plugin قائمة سماح الرسائل المباشرة في Matrix من `channels.matrix.dm.allowFrom`.
- تنطبق اختصارات التفاعل في Matrix وتحديثات الرسائل على كل من موافقات exec وplugin.

قواعد التسليم:

- يرسل `target: "dm"` طلبات الموافقة إلى الرسائل المباشرة للموافقين
- يرسل `target: "channel"` الطلب مرة أخرى إلى غرفة أو رسالة Matrix المباشرة الأصلية
- يرسل `target: "both"` إلى الرسائل المباشرة للموافقين وإلى غرفة أو رسالة Matrix المباشرة الأصلية

تزرع طلبات الموافقة في Matrix اختصارات التفاعل على رسالة الموافقة الأساسية:

- `✅` = السماح مرة واحدة
- `❌` = الرفض
- `♾️` = السماح دائمًا عندما يكون هذا القرار مسموحًا به بموجب سياسة exec الفعلية

يمكن للموافقين التفاعل على تلك الرسالة أو استخدام أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once` أو `/approve <id> allow-always` أو `/approve <id> deny`.

يمكن فقط للموافقين الذين تم حلّهم الموافقة أو الرفض. بالنسبة إلى موافقات exec، يتضمن التسليم عبر القناة نص الأمر، لذا لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

تجاوز لكل حساب:

- `channels.matrix.accounts.<account>.execApprovals`

الوثائق ذات الصلة: [Exec approvals](/ar/tools/exec-approvals)

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة في Matrix (مثل `/new` و`/reset` و`/model`) مباشرة في الرسائل المباشرة. وفي الغرف، يتعرف OpenClaw أيضًا على أوامر الشرطة المائلة التي تكون مسبوقة بذكر Matrix الخاص بالبوت نفسه، لذا فإن `@bot:server /new` يفعّل مسار الأمر من دون الحاجة إلى regex مخصص للذكر. يحافظ هذا على استجابة البوت لمنشورات `@mention /command` بأسلوب الغرف التي يصدرها Element والعملاء المشابهون عندما يُكمل المستخدم اسم البوت باستخدام tab قبل كتابة الأمر.

تظل قواعد التفويض مطبقة: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالكين في الرسائل المباشرة أو الغرف تمامًا كما في الرسائل العادية.

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
تظل الإدخالات التي لا تحتوي على `account` مشتركة بين جميع حسابات Matrix، كما تظل الإدخالات التي تحتوي على `account: "default"` تعمل عندما يكون الحساب الافتراضي مكوّنًا مباشرة في `channels.matrix.*` ذي المستوى الأعلى.
لا تؤدي القيم الافتراضية الجزئية المشتركة للمصادقة إلى إنشاء حساب افتراضي ضمني منفصل بمفردها. لا يقوم OpenClaw بتجميع حساب `default` ذي المستوى الأعلى إلا عندما يملك ذلك الافتراضي مصادقة حديثة (`homeserver` مع `accessToken`، أو `homeserver` مع `userId` و`password`)؛ ويمكن للحسابات المسماة أن تظل قابلة للاكتشاف من خلال `homeserver` مع `userId` عندما تفي بيانات الاعتماد المؤقتة بالمصادقة لاحقًا.
إذا كان Matrix يحتوي بالفعل على حساب مسمى واحد بالضبط، أو كان `defaultAccount` يشير إلى مفتاح حساب مسمى موجود، فإن ترقية الإصلاح/الإعداد من حساب واحد إلى حسابات متعددة تحافظ على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد. ويتم نقل مفاتيح المصادقة/التهيئة الخاصة بـ Matrix فقط إلى ذلك الحساب المرقّى؛ وتبقى مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.
عيّن `defaultAccount` عندما تريد أن يفضّل OpenClaw حساب Matrix مسمى واحدًا للتوجيه الضمني، والاستكشاف، وعمليات CLI.
إذا تم تكوين عدة حسابات Matrix وكان أحد معرّفات الحسابات هو `default`، فسيستخدم OpenClaw ذلك الحساب ضمنيًا حتى عندما لا يكون `defaultAccount` مضبوطًا.
إذا قمت بتكوين عدة حسابات مسماة، فعيّن `defaultAccount` أو مرّر `--account <id>` لأوامر CLI التي تعتمد على اختيار حساب ضمني.
مرّر `--account <id>` إلى `openclaw matrix verify ...` و`openclaw matrix devices ...` عندما تريد تجاوز هذا الاختيار الضمني لأمر واحد.

راجع [مرجع التكوين](/ar/gateway/configuration-reference#multi-account-all-channels) لمعرفة النمط المشترك للحسابات المتعددة.

## homeserver خاصة/ضمن LAN

افتراضيًا، يمنع OpenClaw homeserver الخاصة/الداخلية لـ Matrix للحماية من SSRF ما لم
تقم بالتفعيل الصريح لكل حساب.

إذا كان homeserver الخاص بك يعمل على localhost، أو عنوان IP ضمن LAN/Tailscale، أو اسم مضيف داخلي، فقم بتمكين
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

يسمح هذا الاشتراك الاختياري فقط بالأهداف الخاصة/الداخلية الموثوقة. وتظل homeserver العامة غير المشفرة مثل
`http://matrix.example.org:8008` محجوبة. ويُفضَّل استخدام `https://` كلما أمكن.

## تمرير حركة Matrix عبر proxy

إذا كان نشر Matrix لديك يحتاج إلى proxy صريح صادر لـ HTTP(S)، فعيّن `channels.matrix.proxy`:

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

يمكن للحسابات المسماة تجاوز القيمة الافتراضية ذات المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد proxy نفسه لحركة Matrix أثناء التشغيل وعمليات استكشاف حالة الحساب.

## حل الأهداف

يقبل Matrix صيغ الأهداف هذه في أي مكان يطلب منك فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

يستخدم البحث المباشر في الدليل حساب Matrix المسجل دخوله:

- تستعلم عمليات البحث عن المستخدمين دليل مستخدمي Matrix على ذلك homeserver.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- يكون البحث في أسماء الغرف المنضم إليها على أساس best-effort. وإذا تعذر حل اسم غرفة إلى معرّف أو اسم مستعار، فسيتم تجاهله عند حل قائمة السماح أثناء التشغيل.

## مرجع التكوين

- `enabled`: تمكين القناة أو تعطيلها.
- `name`: تسمية اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضّل عندما يتم تكوين عدة حسابات Matrix.
- `homeserver`: عنوان URL لـ homeserver، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب في Matrix بالاتصال بـ homeserver خاصة/داخلية. فعّل هذا عندما يُحل homeserver إلى `localhost`، أو عنوان IP ضمن LAN/Tailscale، أو مضيف داخلي مثل `matrix-synapse`.
- `proxy`: عنوان URL اختياري لـ HTTP(S) proxy لحركة Matrix. يمكن للحسابات المسماة تجاوز القيمة الافتراضية ذات المستوى الأعلى باستخدام `proxy` خاص بها.
- `userId`: معرّف مستخدم Matrix الكامل، مثل `@bot:example.org`.
- `accessToken`: access token للمصادقة المعتمدة على token. القيم النصية الصريحة وقيم SecretRef مدعومتان لـ `channels.matrix.accessToken` و`channels.matrix.accounts.<id>.accessToken` عبر مزودي env/file/exec. راجع [Secrets Management](/ar/gateway/secrets).
- `password`: كلمة المرور لتسجيل الدخول المعتمد على كلمة المرور. القيم النصية الصريحة وقيم SecretRef مدعومتان.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز لتسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL للصورة الرمزية الذاتية المخزن لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.
- `encryption`: تمكين E2EE.
- `allowlistOnly`: عندما تكون قيمته `true`، يرقّي سياسة الغرف `open` إلى `allowlist`، ويفرض جميع سياسات الرسائل المباشرة النشطة باستثناء `disabled` (بما في ذلك `pairing` و`open`) إلى `allowlist`. لا يؤثر في سياسات `disabled`.
- `allowBots`: السماح بالرسائل الواردة من حسابات OpenClaw Matrix الأخرى المكوّنة (`true` أو `"mentions"`).
- `groupPolicy`: ‏`open` أو `allowlist` أو `disabled`.
- `contextVisibility`: وضع ظهور السياق الإضافي للغرف (`all` أو `allowlist` أو `allowlist_quote`).
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف. تكون معرّفات مستخدم Matrix الكاملة هي الأكثر أمانًا؛ وتُحل التطابقات الدقيقة في الدليل عند بدء التشغيل وعندما تتغير قائمة السماح أثناء عمل المراقب. ويتم تجاهل الأسماء غير المحلولة.
- `historyLimit`: الحد الأقصى لرسائل الغرفة التي يتم تضمينها كسياق سجل المجموعة. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا كان كلاهما غير مضبوط، فالقيمة الافتراضية الفعلية هي `0`. عيّن `0` للتعطيل.
- `replyToMode`: ‏`off` أو `first` أو `all` أو `batched`.
- `markdown`: تكوين اختياري لعرض Markdown لنص Matrix الصادر.
- `streaming`: ‏`off` (الافتراضي) أو `"partial"` أو `"quiet"` أو `true` أو `false`. يفعّل `"partial"` و`true` تحديثات المسودات بنمط المعاينة أولًا باستخدام رسائل Matrix النصية العادية. ويستخدم `"quiet"` إشعارات معاينة غير مُنبِّهة لإعدادات قواعد push ذاتية الاستضافة. ويكافئ `false` القيمة `"off"`.
- `blockStreaming`: تؤدي القيمة `true` إلى تمكين رسائل تقدم منفصلة لكتل المساعد المكتملة بينما يكون بث معاينة المسودة نشطًا.
- `threadReplies`: ‏`off` أو `inbound` أو `always`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالخيوط ودورة حياتها.
- `startupVerification`: وضع طلب التحقق الذاتي التلقائي عند بدء التشغيل (`if-unverified` أو `off`).
- `startupVerificationCooldownHours`: المهلة قبل إعادة محاولة طلبات التحقق التلقائي عند بدء التشغيل.
- `textChunkLimit`: حجم تجزئة الرسالة الصادرة بالأحرف (ينطبق عندما تكون `chunkMode` هي `length`).
- `chunkMode`: تقوم `length` بتقسيم الرسائل حسب عدد الأحرف؛ وتقوم `newline` بالتقسيم عند حدود الأسطر.
- `responsePrefix`: سلسلة اختيارية تُضاف في بداية جميع الردود الصادرة لهذه القناة.
- `ackReaction`: تجاوز اختياري لتفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز اختياري لنطاق تفاعل الإقرار (`group-mentions` أو `group-all` أو `direct` أو `all` أو `none` أو `off`).
- `reactionNotifications`: وضع إشعارات التفاعل الواردة (`own` أو `off`).
- `mediaMaxMb`: الحد الأقصى لحجم الوسائط بالميغابايت للإرسال الصادر ومعالجة الوسائط الواردة.
- `autoJoin`: سياسة الانضمام التلقائي للدعوات (`always` أو `allowlist` أو `off`). الافتراضي: `off`. تنطبق على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `allowlist`. يتم حل إدخالات الأسماء المستعارة إلى معرّفات غرف أثناء معالجة الدعوة؛ ولا يثق OpenClaw بحالة الاسم المستعار التي تدعيها الغرفة المدعو إليها.
- `dm`: كتلة سياسة الرسائل المباشرة (`enabled` أو `policy` أو `allowFrom` أو `sessionScope` أو `threadReplies`).
- `dm.policy`: يتحكم في وصول الرسائل المباشرة بعد أن ينضم OpenClaw إلى الغرفة ويصنفها على أنها رسالة مباشرة. ولا يغيّر ما إذا كان سيتم الانضمام إلى الدعوة تلقائيًا.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل المباشرة. تكون معرّفات مستخدم Matrix الكاملة هي الأكثر أمانًا؛ وتُحل التطابقات الدقيقة في الدليل عند بدء التشغيل وعندما تتغير قائمة السماح أثناء عمل المراقب. ويتم تجاهل الأسماء غير المحلولة.
- `dm.sessionScope`: ‏`per-user` (الافتراضي) أو `per-room`. استخدم `per-room` عندما تريد أن تحتفظ كل غرفة رسائل مباشرة في Matrix بسياق منفصل حتى إذا كان النظير هو نفسه.
- `dm.threadReplies`: تجاوز لسياسة الخيوط خاص بالرسائل المباشرة (`off` أو `inbound` أو `always`). وهو يتجاوز إعداد `threadReplies` ذي المستوى الأعلى لكل من موضع الرد وعزل الجلسة في الرسائل المباشرة.
- `execApprovals`: تسليم موافقات exec الأصلي في Matrix (`enabled` أو `approvers` أو `target` أو `agentFilter` أو `sessionFilter`).
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة على طلبات exec. وهو اختياري عندما تكون `dm.allowFrom` تحدد الموافقين بالفعل.
- `execApprovals.target`: ‏`dm | channel | both` (الافتراضي: `dm`).
- `accounts`: تجاوزات مسماة لكل حساب. تعمل القيم ذات المستوى الأعلى في `channels.matrix` كقيم افتراضية لهذه الإدخالات.
- `groups`: خريطة سياسة لكل غرفة. يُفضّل استخدام معرّفات الغرف أو الأسماء المستعارة؛ ويتم تجاهل أسماء الغرف غير المحلولة أثناء التشغيل. وتستخدم هوية الجلسة/المجموعة معرّف الغرفة الثابت بعد الحل.
- `groups.<room>.account`: تقييد إدخال غرفة موروث واحد إلى حساب Matrix محدد في إعدادات الحسابات المتعددة.
- `groups.<room>.allowBots`: تجاوز على مستوى الغرفة للمرسلين bots المكوّنين (`true` أو `"mentions"`).
- `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
- `groups.<room>.tools`: تجاوزات السماح/المنع للأدوات لكل غرفة.
- `groups.<room>.autoReply`: تجاوز تقييد الذكر على مستوى الغرفة. تؤدي `true` إلى تعطيل متطلبات الذكر لتلك الغرفة؛ وتؤدي `false` إلى فرضها من جديد.
- `groups.<room>.skills`: عامل تصفية Skills اختياري على مستوى الغرفة.
- `groups.<room>.systemPrompt`: مقتطف system prompt اختياري على مستوى الغرفة.
- `rooms`: اسم مستعار قديم لـ `groups`.
- `actions`: تقييد الأدوات لكل إجراء (`messages` أو `reactions` أو `pins` أو `profile` أو `memberInfo` أو `channelInfo` أو `verification`).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق pairing
- [Groups](/ar/channels/groups) — سلوك دردشة المجموعات وتقييد الذكر
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
