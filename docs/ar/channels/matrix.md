---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين التشفير من طرف إلى طرف والتحقق في Matrix
summary: حالة دعم Matrix، والإعداد، وأمثلة التكوين
title: Matrix
x-i18n:
    generated_at: "2026-04-23T13:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

‏Matrix هو Plugin قناة مضمّن لـ OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل الخاصة، والغرف، والخيوط، والوسائط، والتفاعلات، والاستطلاعات، والموقع، والتشفير من طرف إلى طرف.

## Plugin مضمّن

يأتي Matrix كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البنيات المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Matrix، فثبّته
يدويًا:

التثبيت من npm:

```bash
openclaw plugins install @openclaw/matrix
```

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك الـ Plugin وقواعد التثبيت.

## الإعداد

1. تأكد من أن Plugin ‏Matrix متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ حساب Matrix على خادمك المنزلي.
3. كوّن `channels.matrix` باستخدام أحد الخيارين:
   - `homeserver` + `accessToken`، أو
   - `homeserver` + `userId` + `password`.
4. أعد تشغيل Gateway.
5. ابدأ رسالة خاصة مع البوت أو ادعه إلى غرفة.
   - تعمل دعوات Matrix الجديدة فقط عندما يسمح `channels.matrix.autoJoin` بذلك.

مسارات الإعداد التفاعلي:

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب معالج Matrix ما يلي:

- عنوان URL لـ homeserver
- طريقة المصادقة: access token أو كلمة مرور
- معرّف المستخدم (للمصادقة بكلمة المرور فقط)
- اسم جهاز اختياري
- ما إذا كان يجب تمكين التشفير من طرف إلى طرف
- ما إذا كان يجب تكوين الوصول إلى الغرف والانضمام التلقائي للدعوات

السلوكيات الأساسية للمعالج:

- إذا كانت متغيرات البيئة الخاصة بمصادقة Matrix موجودة بالفعل ولم يكن لهذا الحساب مصادقة محفوظة مسبقًا في الإعدادات، فسيعرض المعالج اختصارًا لاستخدام env للإبقاء على المصادقة في متغيرات البيئة.
- تتم تسوية أسماء الحسابات إلى معرّف الحساب. على سبيل المثال، يتحول `Ops Bot` إلى `ops-bot`.
- تقبل إدخالات قائمة السماح للرسائل الخاصة `@user:server` مباشرة؛ ولا تعمل أسماء العرض إلا عندما يعثر البحث المباشر في الدليل على تطابق واحد دقيق.
- تقبل إدخالات قائمة السماح للغرف معرّفات الغرف والأسماء المستعارة مباشرة. يُفضّل استخدام `!room:server` أو `#alias:server`؛ ويتم تجاهل الأسماء غير المحلولة وقت التشغيل أثناء حل قائمة السماح.
- في وضع قائمة السماح للانضمام التلقائي للدعوات، استخدم فقط أهداف الدعوات المستقرة: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية.
- لحل أسماء الغرف قبل الحفظ، استخدم `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`.

إذا تركته غير معيّن، فلن ينضم البوت إلى الغرف المدعو إليها أو إلى الدعوات الجديدة بأسلوب الرسائل الخاصة، لذلك لن يظهر في المجموعات الجديدة أو الرسائل الخاصة المدعو إليها ما لم تنضم يدويًا أولًا.

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

إعداد أساسي يعتمد على token:

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
عندما توجد بيانات اعتماد مؤقتة هناك، يتعامل OpenClaw مع Matrix على أنه مُكوَّن لأغراض الإعداد، وdoctor، واكتشاف حالة القناة، حتى إذا لم تكن المصادقة الحالية مضبوطة مباشرة في الإعدادات.

المكافئات من متغيرات البيئة (تُستخدم عندما لا يكون مفتاح الإعداد مضبوطًا):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

للحسابات غير الافتراضية، استخدم متغيرات البيئة الخاصة بكل حساب:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

مثال للحساب `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

ولمعرّف الحساب المُسوّى `ops-bot`، استخدم:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

يهرب Matrix علامات الترقيم في معرّفات الحسابات للحفاظ على عدم تعارض متغيرات البيئة الخاصة بالحسابات.
على سبيل المثال، يتحول `-` إلى `_X2D_`، لذا يتم تعيين `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

لا يعرض المعالج التفاعلي اختصار متغيرات البيئة إلا عندما تكون متغيرات بيئة المصادقة هذه موجودة بالفعل ولا يكون للحساب المحدد مصادقة Matrix محفوظة مسبقًا في الإعدادات.

لا يمكن تعيين `MATRIX_HOMESERVER` من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## مثال على التكوين

هذا إعداد أساسي عملي مع إقران الرسائل الخاصة، وقائمة سماح للغرف، وتمكين التشفير من طرف إلى طرف:

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

ينطبق `autoJoin` على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل الخاصة. لا يستطيع OpenClaw
تصنيف الغرفة المدعو إليها بشكل موثوق على أنها رسالة خاصة أو مجموعة وقت الدعوة، لذلك تمر جميع الدعوات عبر `autoJoin`
أولًا. ينطبق `dm.policy` بعد انضمام البوت وتصنيف الغرفة كرسالة خاصة.

## معاينات البث

بث الردود في Matrix هو خيار اختياري.

عيّن `channels.matrix.streaming` إلى `"partial"` عندما تريد أن يرسل OpenClaw
رد معاينة مباشرًا واحدًا، ويعدّل هذه المعاينة في مكانها أثناء قيام النموذج بإنشاء النص، ثم ينهيها عند
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

- `streaming: "off"` هو الإعداد الافتراضي. ينتظر OpenClaw الرد النهائي ويرسله مرة واحدة.
- ينشئ `streaming: "partial"` رسالة معاينة واحدة قابلة للتعديل لكتلة المساعد الحالية باستخدام رسائل Matrix النصية العادية. يحافظ هذا على سلوك الإشعارات القديم في Matrix القائم على المعاينة أولًا، لذلك قد ترسل العملاء القياسية إشعارًا عند أول نص معاينة متدفق بدلًا من الكتلة المكتملة.
- ينشئ `streaming: "quiet"` إشعار معاينة هادئًا واحدًا قابلًا للتعديل لكتلة المساعد الحالية. استخدم هذا فقط عندما تقوم أيضًا بتكوين قواعد push للمستلمين لتعديلات المعاينة النهائية.
- يتيح `blockStreaming: true` رسائل تقدم Matrix منفصلة. عند تمكين بث المعاينة، يحتفظ Matrix بالمسودة المباشرة للكتلة الحالية ويحافظ على الكتل المكتملة كرسائل منفصلة.
- عند تشغيل بث المعاينة وإيقاف `blockStreaming`، يعدّل Matrix المسودة المباشرة في مكانها وينهي الحدث نفسه عند اكتمال الكتلة أو الدور.
- إذا لم تعد المعاينة مناسبة ضمن حدث Matrix واحد، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي العادي.
- تظل ردود الوسائط ترسل المرفقات بشكل عادي. إذا تعذر إعادة استخدام معاينة قديمة بأمان، فسيحذف OpenClaw محتواها قبل إرسال الرد النهائي للوسائط.
- تكلف تعديلات المعاينة استدعاءات إضافية إلى Matrix API. اترك البث معطلًا إذا كنت تريد السلوك الأكثر تحفظًا فيما يتعلق بحدود المعدل.

لا يفعّل `blockStreaming` معاينات المسودات بمفرده.
استخدم `streaming: "partial"` أو `streaming: "quiet"` لتعديلات المعاينة؛ ثم أضف `blockStreaming: true` فقط إذا كنت تريد أيضًا أن تظل كتل المساعد المكتملة مرئية كرسائل تقدم منفصلة.

إذا كنت تحتاج إلى إشعارات Matrix القياسية بدون قواعد push مخصصة، فاستخدم `streaming: "partial"` لسلوك المعاينة أولًا أو اترك `streaming` معطلًا للتسليم النهائي فقط. عند استخدام `streaming: "off"`:

- يرسل `blockStreaming: true` كل كتلة مكتملة كرسالة Matrix عادية تُصدر إشعارًا.
- يرسل `blockStreaming: false` الرد المكتمل النهائي فقط كرسالة Matrix عادية تُصدر إشعارًا.

### قواعد push مستضافة ذاتيًا للمعاينات النهائية الهادئة

إذا كنت تدير بنية Matrix التحتية الخاصة بك وتريد أن ترسل المعاينات الهادئة إشعارًا فقط عند اكتمال كتلة أو
الرد النهائي، فعيّن `streaming: "quiet"` وأضف قاعدة push لكل مستخدم لتعديلات المعاينة النهائية.

يكون هذا عادة إعدادًا على مستوى المستخدم المستلم، وليس تغييرًا عامًا في إعدادات homeserver:

خريطة سريعة قبل أن تبدأ:

- المستخدم المستلم = الشخص الذي يجب أن يتلقى الإشعار
- مستخدم البوت = حساب Matrix الخاص بـ OpenClaw الذي يرسل الرد
- استخدم access token الخاص بالمستخدم المستلم لاستدعاءات API أدناه
- طابق `sender` في قاعدة push مع MXID الكامل لمستخدم البوت

1. كوّن OpenClaw لاستخدام المعاينات الهادئة:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. تأكد من أن حساب المستلم يتلقى بالفعل إشعارات push العادية من Matrix. تعمل قواعد المعاينة الهادئة
   فقط إذا كان لدى هذا المستخدم pushers/أجهزة عاملة بالفعل.

3. احصل على access token الخاص بالمستخدم المستلم.
   - استخدم token الخاص بالمستخدم المتلقي، وليس token الخاص بالبوت.
   - تكون إعادة استخدام token جلسة عميل موجودة غالبًا هي الأسهل.
   - إذا كنت بحاجة إلى إصدار token جديد، يمكنك تسجيل الدخول عبر Matrix Client-Server API القياسي:

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

إذا لم يُرجع هذا أي pushers/أجهزة نشطة، فأصلح إشعارات Matrix العادية أولًا قبل إضافة
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

- `https://matrix.example.org`: عنوان URL الأساسي لـ homeserver لديك
- `$USER_ACCESS_TOKEN`: access token الخاص بالمستخدم المتلقي
- `openclaw-finalized-preview-botname`: معرّف قاعدة فريد لهذا البوت لهذا المستخدم المتلقي
- `@bot:example.org`: ‏MXID بوت Matrix الخاص بـ OpenClaw، وليس MXID الخاص بالمستخدم المتلقي

مهم لإعدادات البوتات المتعددة:

- تُفهرس قواعد push بواسطة `ruleId`. تؤدي إعادة تشغيل `PUT` على معرّف القاعدة نفسه إلى تحديث تلك القاعدة نفسها.
- إذا كان يجب على مستخدم مستلم واحد تلقي إشعارات من عدة حسابات بوت Matrix خاصة بـ OpenClaw، فأنشئ قاعدة واحدة لكل بوت مع معرّف قاعدة فريد لكل تطابق `sender`.
- نمط بسيط هو `openclaw-finalized-preview-<botname>`، مثل `openclaw-finalized-preview-ops` أو `openclaw-finalized-preview-support`.

تُقيَّم القاعدة مقابل مُرسِل الحدث:

- صادِق باستخدام token الخاص بالمستخدم المستلم
- طابِق `sender` مع MXID بوت OpenClaw

6. تحقّق من وجود القاعدة:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. اختبر ردًا متدفقًا. في الوضع الهادئ، يجب أن تعرض الغرفة معاينة مسودة هادئة، ويجب أن يرسل
   التعديل النهائي في المكان إشعارًا واحدًا عند اكتمال الكتلة أو الدور.

إذا احتجت إلى إزالة القاعدة لاحقًا، فاحذف معرّف القاعدة نفسه باستخدام token الخاص بالمستخدم المستلم:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

ملاحظات:

- أنشئ القاعدة باستخدام access token الخاص بالمستخدم المستلم، وليس الخاص بالبوت.
- تُدرج قواعد `override` الجديدة المعرّفة من المستخدم قبل قواعد الكبت الافتراضية، لذلك لا حاجة إلى معلمة ترتيب إضافية.
- يؤثر هذا فقط على تعديلات المعاينة النصية النهائية التي يمكن لـ OpenClaw إنهاؤها بأمان في مكانها. أما بدائل الوسائط وبدائل المعاينات القديمة فما تزال تستخدم تسليم Matrix العادي.
- إذا أظهر `GET /_matrix/client/v3/pushers` عدم وجود pushers، فهذا يعني أن المستخدم لا يملك بعد تسليم push عاملًا في Matrix لهذا الحساب/الجهاز.

#### Synapse

بالنسبة إلى Synapse، يكون الإعداد أعلاه كافيًا عادةً بمفرده:

- لا يلزم أي تغيير خاص في `homeserver.yaml` لإشعارات معاينات OpenClaw النهائية.
- إذا كان نشر Synapse لديك يرسل بالفعل إشعارات push العادية من Matrix، فإن token المستخدم مع استدعاء `pushrules` أعلاه هو خطوة الإعداد الأساسية.
- إذا كنت تشغّل Synapse خلف reverse proxy أو workers، فتأكد من أن `/_matrix/client/.../pushrules/` يصل إلى Synapse بشكل صحيح.
- إذا كنت تشغّل Synapse workers، فتأكد من سلامة pushers. تتم معالجة تسليم push بواسطة العملية الرئيسية أو `synapse.app.pusher` / workers الخاصة بـ pusher المكوّنة.

#### Tuwunel

بالنسبة إلى Tuwunel، استخدم تدفق الإعداد نفسه واستدعاء API الخاص بـ push-rule الموضحين أعلاه:

- لا يلزم أي تكوين خاص بـ Tuwunel لعلامة المعاينة النهائية نفسها.
- إذا كانت إشعارات Matrix العادية تعمل بالفعل لهذا المستخدم، فإن token المستخدم مع استدعاء `pushrules` أعلاه هو خطوة الإعداد الأساسية.
- إذا بدا أن الإشعارات تختفي بينما يكون المستخدم نشطًا على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` مفعّلًا. أضاف Tuwunel هذا الخيار في Tuwunel 1.4.2 بتاريخ 12 سبتمبر 2025، ويمكنه كبت إشعارات push عمدًا إلى الأجهزة الأخرى بينما يكون أحد الأجهزة نشطًا.

## غرف بوت إلى بوت

افتراضيًا، يتم تجاهل رسائل Matrix القادمة من حسابات Matrix أخرى مكوّنة في OpenClaw.

استخدم `allowBots` عندما تريد عمدًا مرور حركة Matrix بين الوكلاء:

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

- يقبل `allowBots: true` الرسائل من حسابات بوت Matrix أخرى مكوّنة في الغرف والرسائل الخاصة المسموح بها.
- يقبل `allowBots: "mentions"` هذه الرسائل فقط عندما تذكر هذا البوت بوضوح داخل الغرف. وتظل الرسائل الخاصة مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- ما يزال OpenClaw يتجاهل الرسائل من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفّر Matrix هنا علامة bot أصلية؛ ويتعامل OpenClaw مع "الرسائل التي أنشأها bot" على أنها "مرسلة بواسطة حساب Matrix آخر مكوَّن على Gateway ‏OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تمكين حركة البوت إلى البوت في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفّرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تُشفَّر معاينات الصور إلى جانب المرفق الكامل. أما الغرف غير المشفّرة فما تزال تستخدم `thumbnail_url` العادي. لا حاجة إلى أي تكوين — يكتشف Plugin حالة E2EE تلقائيًا.

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

حالة مفصّلة (تشخيصات كاملة):

```bash
openclaw matrix verify status --verbose
```

تضمين مفتاح الاسترداد المخزن في المخرجات القابلة للقراءة آليًا:

```bash
openclaw matrix verify status --include-recovery-key --json
```

تهيئة حالة cross-signing والتحقق:

```bash
openclaw matrix verify bootstrap
```

تشخيصات تهيئة مفصلة:

```bash
openclaw matrix verify bootstrap --verbose
```

فرض إعادة تعيين جديدة لهوية cross-signing قبل التهيئة:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

التحقق من هذا الجهاز باستخدام مفتاح استرداد:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

تفاصيل التحقق من الجهاز بشكل مفصل:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

التحقق من سلامة النسخ الاحتياطي لمفاتيح الغرف:

```bash
openclaw matrix verify backup status
```

تشخيصات سلامة النسخ الاحتياطي بشكل مفصل:

```bash
openclaw matrix verify backup status --verbose
```

استعادة مفاتيح الغرف من النسخة الاحتياطية على الخادم:

```bash
openclaw matrix verify backup restore
```

تشخيصات الاستعادة بشكل مفصل:

```bash
openclaw matrix verify backup restore --verbose
```

احذف النسخة الاحتياطية الحالية على الخادم وأنشئ خط أساس جديدًا للنسخ الاحتياطي. إذا تعذر
تحميل مفتاح النسخ الاحتياطي المخزن بشكل سليم، فيمكن أن تؤدي إعادة التعيين هذه أيضًا إلى إعادة إنشاء التخزين السري بحيث
تستطيع عمليات التشغيل الباردة المستقبلية تحميل مفتاح النسخ الاحتياطي الجديد:

```bash
openclaw matrix verify backup reset --yes
```

تكون جميع أوامر `verify` موجزة افتراضيًا (بما في ذلك تسجيل SDK الداخلي الهادئ) ولا تعرض تشخيصات مفصلة إلا مع `--verbose`.
استخدم `--json` للحصول على مخرجات كاملة قابلة للقراءة آليًا عند كتابة السكربتات.

في إعدادات الحسابات المتعددة، تستخدم أوامر Matrix CLI حساب Matrix الافتراضي الضمني ما لم تمرر `--account <id>`.
إذا قمت بتكوين عدة حسابات مسماة، فاضبط `channels.matrix.defaultAccount` أولًا وإلا فستتوقف عمليات CLI الضمنية هذه وتطلب منك اختيار حساب صراحةً.
استخدم `--account` كلما أردت أن تستهدف عمليات التحقق أو الجهاز حسابًا مسمىً بشكل صريح:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

عندما يكون التشفير معطلًا أو غير متاح لحساب مسمى، تشير تحذيرات Matrix وأخطاء التحقق إلى مفتاح تكوين ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

### معنى "تم التحقق"

يتعامل OpenClaw مع جهاز Matrix هذا على أنه تم التحقق منه فقط عندما يتم التحقق منه بواسطة هوية cross-signing الخاصة بك.
عمليًا، يكشف `openclaw matrix verify status --verbose` ثلاث إشارات ثقة:

- `Locally trusted`: هذا الجهاز موثوق به من قبل العميل الحالي فقط
- `Cross-signing verified`: يفيد SDK بأن الجهاز تم التحقق منه عبر cross-signing
- `Signed by owner`: الجهاز موقّع بواسطة مفتاح self-signing الخاص بك

تصبح `Verified by owner` هي `yes` فقط عند وجود تحقق cross-signing أو توقيع المالك.
الثقة المحلية وحدها لا تكفي لكي يعتبر OpenClaw الجهاز متحققًا بالكامل.

### ما الذي تفعله التهيئة

يُعد `openclaw matrix verify bootstrap` أمر الإصلاح والإعداد لحسابات Matrix المشفرة.
وهو ينفذ كل ما يلي بالترتيب:

- يهيئ التخزين السري، مع إعادة استخدام مفتاح استرداد موجود عندما يكون ذلك ممكنًا
- يهيئ cross-signing ويرفع مفاتيح cross-signing العامة الناقصة
- يحاول وسم الجهاز الحالي وتوقيعه عبر cross-signing
- ينشئ نسخة احتياطية جديدة لمفاتيح الغرف على الخادم إذا لم تكن موجودة بالفعل

إذا كان homeserver يتطلب مصادقة تفاعلية لرفع مفاتيح cross-signing، يحاول OpenClaw الرفع أولًا بدون مصادقة، ثم باستخدام `m.login.dummy`، ثم باستخدام `m.login.password` عندما يكون `channels.matrix.password` مضبوطًا.

استخدم `--force-reset-cross-signing` فقط عندما تريد عمدًا تجاهل هوية cross-signing الحالية وإنشاء هوية جديدة.

إذا كنت تريد عمدًا تجاهل النسخة الاحتياطية الحالية لمفاتيح الغرف وبدء
خط أساس جديد للنسخ الاحتياطي للرسائل المستقبلية، فاستخدم `openclaw matrix verify backup reset --yes`.
افعل ذلك فقط إذا كنت تقبل بأن السجل المشفر القديم غير القابل للاسترداد سيظل
غير متاح، وأن OpenClaw قد يعيد إنشاء التخزين السري إذا تعذر تحميل سر النسخ الاحتياطي الحالي
بأمان.

### خط أساس جديد للنسخ الاحتياطي

إذا كنت تريد الإبقاء على الرسائل المشفرة المستقبلية تعمل وتقبل فقدان السجل القديم غير القابل للاسترداد، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

أضف `--account <id>` إلى كل أمر عندما تريد استهداف حساب Matrix مسمىً بشكل صريح.

### سلوك بدء التشغيل

عند استخدام `encryption: true`، يضبط Matrix القيمة الافتراضية لـ `startupVerification` على `"if-unverified"`.
عند بدء التشغيل، إذا كان هذا الجهاز ما يزال غير متحقق منه، فسيطلب Matrix التحقق الذاتي في عميل Matrix آخر،
وسيتجاوز الطلبات المكررة عندما يكون أحدها قيد الانتظار بالفعل، ويطبّق فترة تهدئة محلية قبل إعادة المحاولة بعد إعادة التشغيل.
تعيد محاولات الطلب الفاشلة المحاولة بشكل أسرع افتراضيًا من إنشاء الطلب الناجح.
اضبط `startupVerification: "off"` لتعطيل طلبات بدء التشغيل التلقائية، أو عدّل `startupVerificationCooldownHours`
إذا كنت تريد نافذة إعادة محاولة أقصر أو أطول.

ينفذ بدء التشغيل أيضًا مرورًا تلقائيًا محافظًا لتهيئة التشفير.
يحاول هذا المرور أولًا إعادة استخدام التخزين السري الحالي وهوية cross-signing الحالية، ويتجنب إعادة تعيين cross-signing ما لم تشغّل تدفق إصلاح تهيئة صريحًا.

إذا وجد بدء التشغيل رغم ذلك حالة تهيئة معطلة، فيمكن لـ OpenClaw محاولة مسار إصلاح محمي حتى عندما لا يكون `channels.matrix.password` مضبوطًا.
إذا كان homeserver يتطلب UIA قائمًا على كلمة المرور لهذا الإصلاح، فسيسجل OpenClaw تحذيرًا ويحافظ على كون بدء التشغيل غير قاتل بدلًا من إيقاف البوت.
إذا كان الجهاز الحالي موقّعًا بالفعل من المالك، فسيحافظ OpenClaw على تلك الهوية بدلًا من إعادة تعيينها تلقائيًا.

راجع [ترحيل Matrix](/ar/install/migrating-matrix) لمعرفة تدفق الترقية الكامل، والقيود، وأوامر الاسترداد، ورسائل الترحيل الشائعة.

### إشعارات التحقق

ينشر Matrix إشعارات دورة حياة التحقق مباشرة في غرفة الرسائل الخاصة الصارمة الخاصة بالتحقق على شكل رسائل `m.notice`.
ويشمل ذلك:

- إشعارات طلب التحقق
- إشعارات جاهزية التحقق (مع إرشاد صريح "تحقق عبر الرموز التعبيرية")
- إشعارات بدء التحقق واكتماله
- تفاصيل SAS (الرموز التعبيرية والأرقام العشرية) عندما تكون متاحة

تُتتبع طلبات التحقق الواردة من عميل Matrix آخر ويقبلها OpenClaw تلقائيًا.
وفي تدفقات التحقق الذاتي، يبدأ OpenClaw أيضًا تدفق SAS تلقائيًا عندما يصبح التحقق بالرموز التعبيرية متاحًا ويؤكد جانبه الخاص.
أما في طلبات التحقق من مستخدم/جهاز Matrix آخر، فيقبل OpenClaw الطلب تلقائيًا ثم ينتظر متابعة تدفق SAS بشكل عادي.
وما يزال عليك مقارنة SAS الرمزي أو العشري في عميل Matrix لديك وتأكيد "They match" هناك لإكمال التحقق.

لا يقبل OpenClaw تلقائيًا التدفقات المكررة التي بدأها ذاتيًا بشكل أعمى. يتجاوز بدء التشغيل إنشاء طلب جديد عندما يكون طلب تحقق ذاتي قيد الانتظار بالفعل.

لا تُمرَّر إشعارات بروتوكول/نظام التحقق إلى مسار دردشة الوكيل، لذلك لا تنتج `NO_REPLY`.

### نظافة الأجهزة

يمكن أن تتراكم أجهزة Matrix القديمة التي يديرها OpenClaw على الحساب وتجعل الثقة في الغرف المشفرة أصعب في الفهم.
اعرضها باستخدام:

```bash
openclaw matrix devices list
```

أزل أجهزة OpenClaw القديمة التي يديرها النظام باستخدام:

```bash
openclaw matrix devices prune-stale
```

### مخزن التشفير

يستخدم Matrix E2EE مسار التشفير Rust الرسمي في `matrix-js-sdk` داخل Node، مع `fake-indexeddb` كطبقة IndexedDB بديلة. تُحفَظ حالة التشفير في ملف لقطة (`crypto-idb-snapshot.json`) وتُستعاد عند بدء التشغيل. ملف اللقطة هذا يحتوي على حالة تشغيل حساسة ويُخزَّن بأذونات ملفات مقيّدة.

توجد حالة التشغيل المشفّرة ضمن جذور خاصة بكل حساب، ولكل مستخدم، ولكل hash للـ token في
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
يحتوي هذا الدليل على مخزن المزامنة (`bot-storage.json`) ومخزن التشفير (`crypto/`)،
وملف مفتاح الاسترداد (`recovery-key.json`) ولقطة IndexedDB (`crypto-idb-snapshot.json`)،
وروابط الخيوط (`thread-bindings.json`) وحالة التحقق عند بدء التشغيل (`startup-verification.json`).
عندما يتغير token مع بقاء هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود
لهذه الثلاثية account/homeserver/user بحيث تظل حالة المزامنة السابقة، وحالة التشفير، وروابط الخيوط،
وحالة التحقق عند بدء التشغيل مرئية.

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد باستخدام:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

أضف `--account <id>` عندما تريد استهداف حساب Matrix مسمىً بشكل صريح.

يقبل Matrix عناوين URL للصورة الرمزية من نوع `mxc://` مباشرة. عند تمرير عنوان URL للصورة الرمزية من نوع `http://` أو `https://`، يقوم OpenClaw أولًا برفعه إلى Matrix ثم يخزن عنوان `mxc://` الناتج مرة أخرى في `channels.matrix.avatarUrl` (أو في تجاوز الحساب المحدد).

## الخيوط

يدعم Matrix خيوط Matrix الأصلية لكل من الردود التلقائية وإرسالات أدوات الرسائل.

- يحتفظ `dm.sessionScope: "per-user"` (الافتراضي) بتوجيه الرسائل الخاصة في Matrix ضمن نطاق المُرسِل، بحيث يمكن لعدة غرف رسائل خاصة مشاركة جلسة واحدة عندما تُحل إلى النظير نفسه.
- يعزل `dm.sessionScope: "per-room"` كل غرفة رسائل خاصة في Matrix ضمن مفتاح جلسة خاص بها مع الاستمرار في استخدام فحوصات المصادقة وقائمة السماح العادية للرسائل الخاصة.
- تظل روابط محادثات Matrix الصريحة لها الأولوية على `dm.sessionScope`، لذا تحتفظ الغرف والخيوط المرتبطة بالجلسة الهدف التي اختارتها.
- يبقي `threadReplies: "off"` الردود في المستوى الأعلى ويحافظ على الرسائل الواردة ضمن الخيوط على جلسة الرسالة الأصلية.
- يرد `threadReplies: "inbound"` داخل خيط فقط عندما تكون الرسالة الواردة أصلًا ضمن ذلك الخيط.
- يبقي `threadReplies: "always"` ردود الغرف داخل خيط متجذر في الرسالة المُطلِقة ويوجّه تلك المحادثة عبر الجلسة المطابقة ذات النطاق الخيطي بدءًا من أول رسالة مُطلِقة.
- يتجاوز `dm.threadReplies` الإعداد الأعلى مستوى للرسائل الخاصة فقط. على سبيل المثال، يمكنك إبقاء خيوط الغرف معزولة مع إبقاء الرسائل الخاصة مسطحة.
- تتضمن الرسائل الواردة ضمن الخيوط رسالة جذر الخيط كسياق إضافي للوكيل.
- ترث إرسالات أدوات الرسائل خيط Matrix الحالي تلقائيًا عندما يكون الهدف هو الغرفة نفسها، أو هدف مستخدم الرسائل الخاصة نفسه، ما لم يتم توفير `threadId` صريح.
- لا يُفعَّل إعادة استخدام هدف مستخدم الرسائل الخاصة ضمن الجلسة نفسها إلا عندما تثبت بيانات تعريف الجلسة الحالية أنه النظير نفسه في الرسائل الخاصة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ذي النطاق الخاص بالمستخدم.
- عندما يرى OpenClaw أن غرفة رسائل خاصة في Matrix تتصادم مع غرفة رسائل خاصة أخرى على جلسة رسائل Matrix مشتركة واحدة، فإنه ينشر رسالة `m.notice` لمرة واحدة في تلك الغرفة تتضمن مخرج `/focus` عندما تكون روابط الخيوط مفعّلة وتلميح `dm.sessionScope` موجودًا.
- روابط الخيوط أثناء التشغيل مدعومة في Matrix. تعمل الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبط بالخيط في غرف Matrix والرسائل الخاصة.
- يؤدي `/focus` في المستوى الأعلى لغرفة/رسالة خاصة في Matrix إلى إنشاء خيط Matrix جديد وربطه بالجلسة الهدف عندما يكون `threadBindings.spawnSubagentSessions=true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل خيط Matrix موجود إلى ربط ذلك الخيط الحالي بدلًا من ذلك.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل الخاصة وخيوط Matrix الموجودة إلى مساحات عمل ACP دائمة دون تغيير واجهة الدردشة.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة الخاصة أو الغرفة أو الخيط الموجود في Matrix الذي تريد الاستمرار في استخدامه.
- في رسالة خاصة أو غرفة Matrix على المستوى الأعلى، يظل سطح الدردشة هو نفس الرسالة الخاصة/الغرفة الحالية، وتُوجَّه الرسائل المستقبلية إلى جلسة ACP التي تم إنشاؤها.
- داخل خيط Matrix موجود، يربط `--bind here` ذلك الخيط الحالي في مكانه.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الرابط.

ملاحظات:

- لا يؤدي `--bind here` إلى إنشاء خيط Matrix فرعي.
- لا يلزم `threadBindings.spawnAcpSessions` إلا مع `/acp spawn --thread auto|here`، عندما يحتاج OpenClaw إلى إنشاء خيط Matrix فرعي أو ربطه.

### إعداد روابط الخيوط

يرث Matrix القيم الافتراضية العامة من `session.threadBindings`، كما يدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

إشارات الإنشاء المرتبطة بالخيوط في Matrix هي خيار اختياري:

- عيّن `threadBindings.spawnSubagentSessions: true` للسماح لأمر `/focus` في المستوى الأعلى بإنشاء خيوط Matrix جديدة وربطها.
- عيّن `threadBindings.spawnAcpSessions: true` للسماح لـ `/acp spawn --thread auto|here` بربط جلسات ACP بخيوط Matrix.

## التفاعلات

يدعم Matrix إجراءات التفاعلات الصادرة، وإشعارات التفاعلات الواردة، وتفاعلات الإقرار الواردة.

- تُدار أدوات التفاعلات الصادرة بواسطة `channels["matrix"].actions.reactions`.
- يضيف `react` تفاعلًا إلى حدث Matrix محدد.
- يعرض `reactions` ملخص التفاعلات الحالي لحدث Matrix محدد.
- يؤدي `emoji=""` إلى إزالة تفاعلات حساب البوت نفسه على ذلك الحدث.
- يؤدي `remove: true` إلى إزالة تفاعل الإيموجي المحدد فقط من حساب البوت.

يستخدم نطاق تفاعلات الإقرار ترتيب الحسم القياسي في OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- الرجوع إلى إيموجي هوية الوكيل

يُحسم نطاق تفاعلات الإقرار بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

يُحسم وضع إشعارات التفاعل بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- الافتراضي: `own`

السلوك:

- يؤدي `reactionNotifications: "own"` إلى تمرير أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix أنشأها البوت.
- يؤدي `reactionNotifications: "off"` إلى تعطيل أحداث نظام التفاعلات.
- لا تُحوَّل إزالة التفاعلات إلى أحداث نظام مركبة لأن Matrix يعرضها كعمليات redaction، وليس كإزالات مستقلة لـ `m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة التي تُضمَّن كـ `InboundHistory` عندما تُطلِق رسالة غرفة Matrix الوكيل. ويرجع إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أيٌّ منهما مضبوطًا، فالقيمة الافتراضية الفعلية هي `0`. عيّن `0` للتعطيل.
- سجل غرف Matrix خاص بالغرف فقط. وتستمر الرسائل الخاصة في استخدام سجل الجلسة العادي.
- سجل غرف Matrix خاص بالرسائل المعلقة فقط: يقوم OpenClaw بتخزين رسائل الغرفة التي لم تُطلق ردًا بعد، ثم يلتقط لقطة لهذه النافذة عند وصول ذكر أو مُطلِق آخر.
- لا تُضمَّن رسالة الإطلاق الحالية في `InboundHistory`؛ إذ تبقى في جسم الإدخال الرئيسي لذلك الدور.
- تعيد محاولات الحدث نفسه في Matrix استخدام لقطة السجل الأصلية بدلًا من الانجراف إلى رسائل أحدث في الغرفة.

## ظهور السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` لسياق الغرفة التكميلي مثل نصوص الردود التي تم جلبها، وجذور الخيوط، والسجل المعلق.

- `contextVisibility: "all"` هو الافتراضي. يُحتفَظ بالسياق التكميلي كما تم استلامه.
- يقوم `contextVisibility: "allowlist"` بتصفية السياق التكميلي إلى المُرسِلين المسموح لهم وفقًا لفحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يعمل `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يحتفظ أيضًا برد مقتبس صريح واحد.

يؤثر هذا الإعداد في ظهور السياق التكميلي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكن أن تُطلِق ردًا.
ويظل تفويض الإطلاق صادرًا عن إعدادات `groupPolicy` و`groups` و`groupAllowFrom` وسياسات الرسائل الخاصة.

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

راجع [Groups](/ar/channels/groups) لمعرفة سلوك التقييد بالذكر وقائمة السماح.

مثال على الاقتران لرسائل Matrix الخاصة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا واصل مستخدم Matrix غير معتمد مراسلتك قبل الموافقة، فسيعيد OpenClaw استخدام رمز الاقتران المعلق نفسه وقد يرسل رد تذكير مرة أخرى بعد فترة تهدئة قصيرة بدلًا من إصدار رمز جديد.

راجع [Pairing](/ar/channels/pairing) لمعرفة تدفق اقتران الرسائل الخاصة المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا خرجت حالة الرسائل المباشرة عن التزامن، فقد ينتهي الأمر بـ OpenClaw إلى وجود تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من الرسالة الخاصة الحية. افحص التعيين الحالي لنظير باستخدام:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

وأصلحه باستخدام:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

تدفق الإصلاح:

- يفضّل رسالة خاصة صارمة 1:1 تكون مُعيّنة بالفعل في `m.direct`
- يعود إلى أي رسالة خاصة صارمة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة خاصة سليمة

لا يحذف تدفق الإصلاح الغرف القديمة تلقائيًا. بل يختار فقط الرسالة الخاصة السليمة ويحدّث التعيين بحيث تستهدف إرسالات Matrix الجديدة، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة مرة أخرى.

## موافقات exec

يمكن أن يعمل Matrix كعميل موافقة أصلي لحساب Matrix. وتظل
عناصر توجيه الرسائل الخاصة/القنوات الأصلية ضمن إعداد موافقات exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (اختياري؛ يرجع إلى `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

يجب أن يكون الموافقون معرّفات مستخدمي Matrix مثل `@owner:example.org`. يقوم Matrix بتمكين الموافقات الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو تساوي `"auto"` ويمكن حلّ موافق واحد على الأقل. تستخدم موافقات Exec أولًا `execApprovals.approvers` ويمكن أن تعود إلى `channels.matrix.dm.allowFrom`. وتخوّل موافقات Plugin عبر `channels.matrix.dm.allowFrom`. عيّن `enabled: false` لتعطيل Matrix كعميل موافقة أصلي بشكل صريح. بخلاف ذلك، تعود طلبات الموافقة إلى مسارات الموافقة الأخرى المكوّنة أو إلى سياسة الرجوع للموافقة.

يدعم التوجيه الأصلي في Matrix كلا نوعي الموافقة:

- تتحكم `channels.matrix.execApprovals.*` في وضع التوزيع الأصلي للرسائل الخاصة/القنوات لطلبات موافقة Matrix.
- تستخدم موافقات Exec مجموعة الموافقين من `execApprovals.approvers` أو `channels.matrix.dm.allowFrom`.
- تستخدم موافقات Plugin قائمة السماح للرسائل الخاصة في Matrix من `channels.matrix.dm.allowFrom`.
- تنطبق اختصارات التفاعلات وتحديثات الرسائل في Matrix على كل من موافقات exec وموافقات Plugin.

قواعد التسليم:

- يرسل `target: "dm"` طلبات الموافقة إلى الرسائل الخاصة للموافقين
- يرسل `target: "channel"` الطلب مرة أخرى إلى غرفة أو رسالة Matrix الأصلية
- يرسل `target: "both"` إلى الرسائل الخاصة للموافقين وإلى غرفة أو رسالة Matrix الأصلية

تُنشئ طلبات موافقة Matrix اختصارات تفاعلات على رسالة الموافقة الأساسية:

- `✅` = السماح مرة واحدة
- `❌` = الرفض
- `♾️` = السماح دائمًا عندما يكون هذا القرار مسموحًا به وفقًا لسياسة exec الفعلية

يمكن للموافقين التفاعل على تلك الرسالة أو استخدام أوامر slash البديلة: `/approve <id> allow-once` أو `/approve <id> allow-always` أو `/approve <id> deny`.

يمكن فقط للموافقين الذين تم حلهم أن يوافقوا أو يرفضوا. بالنسبة إلى موافقات exec، يتضمن التسليم عبر القناة نص الأمر، لذلك لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

تجاوز لكل حساب:

- `channels.matrix.accounts.<account>.execApprovals`

الوثائق ذات الصلة: [Exec approvals](/ar/tools/exec-approvals)

## أوامر slash

تعمل أوامر slash في Matrix (مثل `/new` و`/reset` و`/model`) مباشرة في الرسائل الخاصة. وفي الغرف، يتعرف OpenClaw أيضًا على أوامر slash التي تسبقها إشارة Matrix الخاصة بالبوت نفسه، لذلك يؤدي `@bot:server /new` إلى تشغيل مسار الأمر دون الحاجة إلى تعبير mention مخصص. وهذا يُبقي البوت مستجيبًا لمنشورات `@mention /command` بأسلوب الغرف التي يصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم البوت تلقائيًا قبل كتابة الأمر.

تظل قواعد التفويض سارية: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك للرسائل الخاصة أو الغرف تمامًا مثل الرسائل العادية.

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

تعمل القيم ذات المستوى الأعلى في `channels.matrix` كقيم افتراضية للحسابات المسماة ما لم يتجاوزها أحد الحسابات.
يمكنك قصر إدخالات الغرف الموروثة على حساب Matrix واحد باستخدام `groups.<room>.account`.
تظل الإدخالات التي لا تحتوي على `account` مشتركة بين جميع حسابات Matrix، كما أن الإدخالات التي تحتوي على `account: "default"` تظل تعمل عندما يكون الحساب الافتراضي مضبوطًا مباشرة في `channels.matrix.*` على المستوى الأعلى.
لا يؤدي وجود قيم افتراضية جزئية مشتركة للمصادقة وحده إلى إنشاء حساب افتراضي ضمني منفصل. لا يُنشئ OpenClaw حساب `default` ذي المستوى الأعلى إلا عندما تكون لهذا الحساب الافتراضي مصادقة حديثة (`homeserver` مع `accessToken`، أو `homeserver` مع `userId` و`password`)؛ ويمكن أن تظل الحسابات المسماة قابلة للاكتشاف من `homeserver` مع `userId` عندما تلبي بيانات الاعتماد المخزنة مؤقتًا المصادقة لاحقًا.
إذا كان Matrix يحتوي بالفعل على حساب مسمى واحد بالضبط، أو كان `defaultAccount` يشير إلى مفتاح حساب مسمى موجود، فإن ترقية الإصلاح/الإعداد من حساب واحد إلى حسابات متعددة تحافظ على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد. ولا تُنقل إلى ذلك الحساب المُرقّى إلا مفاتيح المصادقة/التهيئة الخاصة بـ Matrix؛ أما مفاتيح سياسة التسليم المشتركة فتبقى على المستوى الأعلى.
اضبط `defaultAccount` عندما تريد أن يفضّل OpenClaw حساب Matrix مسمى واحدًا للتوجيه الضمني، والفحص، وعمليات CLI.
إذا جرى تكوين عدة حسابات Matrix وكان أحد معرّفات الحسابات هو `default`، فسيستخدم OpenClaw ذلك الحساب ضمنيًا حتى عندما لا يكون `defaultAccount` مضبوطًا.
إذا قمت بتكوين عدة حسابات مسماة، فاضبط `defaultAccount` أو مرر `--account <id>` لأوامر CLI التي تعتمد على اختيار حساب ضمني.
مرر `--account <id>` إلى `openclaw matrix verify ...` و`openclaw matrix devices ...` عندما تريد تجاوز هذا الاختيار الضمني لحساب واحد في أمر واحد.

راجع [مرجع التكوين](/ar/gateway/configuration-reference#multi-account-all-channels) لمعرفة نمط الحسابات المتعددة المشترك.

## homeserver خاصة/ضمن LAN

افتراضيًا، يحظر OpenClaw خوادم Matrix المنزلية الخاصة/الداخلية للحماية من SSRF ما لم
تفعّل ذلك صراحةً لكل حساب.

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

مثال إعداد عبر CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

يسمح هذا التفعيل الاختياري فقط بالأهداف الخاصة/الداخلية الموثوقة. أما
خوادم homeserver العامة غير المشفرة مثل
`http://matrix.example.org:8008` فتظل محظورة. ويفضل استخدام `https://` متى أمكن.

## تمرير حركة Matrix عبر Proxy

إذا كان نشر Matrix لديك يحتاج إلى proxy صريح لحركة HTTP(S) الصادرة، فاضبط `channels.matrix.proxy`:

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
يستخدم OpenClaw إعداد proxy نفسه لكل من حركة Matrix أثناء التشغيل وفحوصات حالة الحساب.

## حل الأهداف

يقبل Matrix صيغ الأهداف التالية في أي مكان يطلب منك فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

يستخدم البحث المباشر في الدليل حساب Matrix المسجل الدخول:

- تستعلم عمليات بحث المستخدمين من دليل مستخدمي Matrix على ذلك homeserver.
- تقبل عمليات بحث الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- يكون البحث في أسماء الغرف المنضم إليها على أساس أفضل جهد. وإذا تعذر حل اسم الغرفة إلى معرّف أو اسم مستعار، فسيُتجاهل عند حل قائمة السماح وقت التشغيل.

## مرجع التكوين

- `enabled`: تمكين القناة أو تعطيلها.
- `name`: تسمية اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضّل عند تكوين عدة حسابات Matrix.
- `homeserver`: عنوان URL لـ homeserver، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب في Matrix بالاتصال بخوادم homeserver الخاصة/الداخلية. فعّل هذا عندما يُحل homeserver إلى `localhost` أو عنوان IP ضمن LAN/Tailscale أو مضيف داخلي مثل `matrix-synapse`.
- `proxy`: عنوان URL اختياري لـ HTTP(S) proxy لحركة Matrix. يمكن للحسابات المسماة تجاوز القيمة الافتراضية ذات المستوى الأعلى باستخدام `proxy` خاص بها.
- `userId`: معرّف مستخدم Matrix الكامل، مثل `@bot:example.org`.
- `accessToken`: access token للمصادقة القائمة على token. تُدعم القيم النصية الصريحة وقيم SecretRef لكل من `channels.matrix.accessToken` و`channels.matrix.accounts.<id>.accessToken` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).
- `password`: كلمة المرور لتسجيل الدخول القائم على كلمة المرور. تُدعم القيم النصية الصريحة وقيم SecretRef.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز لتسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL المخزن للصورة الرمزية الذاتية لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.
- `encryption`: تمكين E2EE.
- `allowlistOnly`: عندما تكون القيمة `true`، تتم ترقية سياسة الغرف `open` إلى `allowlist`، ويتم فرض جميع سياسات الرسائل الخاصة النشطة باستثناء `disabled` (بما في ذلك `pairing` و`open`) لتصبح `allowlist`. ولا يؤثر ذلك في سياسات `disabled`.
- `allowBots`: السماح بالرسائل من حسابات Matrix أخرى مكوّنة في OpenClaw (`true` أو `"mentions"`).
- `groupPolicy`: ‏`open` أو `allowlist` أو `disabled`.
- `contextVisibility`: وضع ظهور سياق الغرفة التكميلي (`all` أو `allowlist` أو `allowlist_quote`).
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف. تُعد معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ وتُحل التطابقات الدقيقة في الدليل عند بدء التشغيل وعندما تتغير قائمة السماح أثناء عمل المراقب. يتم تجاهل الأسماء غير المحلولة.
- `historyLimit`: الحد الأقصى لرسائل الغرفة التي تُضمَّن كسياق لسجل المجموعات. ويرجع إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أيٌّ منهما مضبوطًا، فالقيمة الافتراضية الفعلية هي `0`. عيّن `0` للتعطيل.
- `replyToMode`: ‏`off` أو `first` أو `all` أو `batched`.
- `markdown`: إعداد اختياري لعرض Markdown لنص Matrix الصادر.
- `streaming`: ‏`off` (الافتراضي) أو `"partial"` أو `"quiet"` أو `true` أو `false`. يفعّل `"partial"` و`true` تحديثات المسودات بنمط المعاينة أولًا باستخدام رسائل Matrix النصية العادية. ويستخدم `"quiet"` إشعارات معاينة غير مُنبِّهة لإعدادات قواعد push المستضافة ذاتيًا. وتكافئ `false` القيمة `"off"`.
- `blockStreaming`: تؤدي القيمة `true` إلى تمكين رسائل تقدم منفصلة لكتل المساعد المكتملة أثناء نشاط بث معاينة المسودات.
- `threadReplies`: ‏`off` أو `inbound` أو `always`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالخيوط ودورة حياتها.
- `startupVerification`: وضع طلب التحقق الذاتي التلقائي عند بدء التشغيل (`if-unverified` أو `off`).
- `startupVerificationCooldownHours`: فترة التهدئة قبل إعادة محاولة طلبات التحقق التلقائي عند بدء التشغيل.
- `textChunkLimit`: حجم تجزئة الرسائل الصادرة بالأحرف (يُطبق عندما تكون `chunkMode` هي `length`).
- `chunkMode`: تقسم `length` الرسائل حسب عدد الأحرف؛ وتقسم `newline` عند حدود الأسطر.
- `responsePrefix`: سلسلة اختيارية تُضاف في بداية جميع الردود الصادرة لهذه القناة.
- `ackReaction`: تجاوز اختياري لتفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز اختياري لنطاق تفاعل الإقرار (`group-mentions` أو `group-all` أو `direct` أو `all` أو `none` أو `off`).
- `reactionNotifications`: وضع إشعارات التفاعلات الواردة (`own` أو `off`).
- `mediaMaxMb`: الحد الأقصى لحجم الوسائط بالميغابايت للإرسال الصادر ومعالجة الوسائط الواردة.
- `autoJoin`: سياسة الانضمام التلقائي للدعوات (`always` أو `allowlist` أو `off`). الافتراضي: `off`. وتنطبق على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل الخاصة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `allowlist`. تُحل إدخالات الأسماء المستعارة إلى معرّفات غرف أثناء معالجة الدعوات؛ ولا يثق OpenClaw في حالة الاسم المستعار التي تدّعيها الغرفة المدعو إليها.
- `dm`: كتلة سياسة الرسائل الخاصة (`enabled` أو `policy` أو `allowFrom` أو `sessionScope` أو `threadReplies`).
- `dm.policy`: يتحكم في الوصول إلى الرسائل الخاصة بعد أن ينضم OpenClaw إلى الغرفة ويصنفها كرسالة خاصة. ولا يغيّر ما إذا كانت الدعوة ستُنضم إليها تلقائيًا.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل الخاصة. تُعد معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ وتُحل التطابقات الدقيقة في الدليل عند بدء التشغيل وعندما تتغير قائمة السماح أثناء عمل المراقب. يتم تجاهل الأسماء غير المحلولة.
- `dm.sessionScope`: ‏`per-user` (الافتراضي) أو `per-room`. استخدم `per-room` عندما تريد أن تحتفظ كل غرفة رسائل خاصة في Matrix بسياق منفصل حتى لو كان النظير هو نفسه.
- `dm.threadReplies`: تجاوز سياسة الخيوط للرسائل الخاصة فقط (`off` أو `inbound` أو `always`). ويتجاوز إعداد `threadReplies` ذي المستوى الأعلى لكل من موضع الرد وعزل الجلسة في الرسائل الخاصة.
- `execApprovals`: تسليم موافقات exec الأصلي في Matrix (`enabled` أو `approvers` أو `target` أو `agentFilter` أو `sessionFilter`).
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة على طلبات exec. وهو اختياري عندما يحدد `dm.allowFrom` الموافقين بالفعل.
- `execApprovals.target`: ‏`dm | channel | both` (الافتراضي: `dm`).
- `accounts`: تجاوزات مسماة لكل حساب. تعمل قيم `channels.matrix` ذات المستوى الأعلى كقيم افتراضية لهذه الإدخالات.
- `groups`: خريطة سياسات لكل غرفة. يُفضّل استخدام معرّفات الغرف أو الأسماء المستعارة؛ ويتم تجاهل أسماء الغرف غير المحلولة وقت التشغيل. وتستخدم هوية الجلسة/المجموعة معرّف الغرفة المستقر بعد الحل.
- `groups.<room>.account`: قصر إدخال غرفة موروث واحد على حساب Matrix محدد في إعدادات الحسابات المتعددة.
- `groups.<room>.allowBots`: تجاوز على مستوى الغرفة للمرسلين من البوتات المكوّنة (`true` أو `"mentions"`).
- `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
- `groups.<room>.tools`: تجاوزات سماح/منع الأدوات لكل غرفة.
- `groups.<room>.autoReply`: تجاوز على مستوى الغرفة لتقييد الذكر. تؤدي `true` إلى تعطيل متطلبات الذكر لتلك الغرفة؛ وتؤدي `false` إلى فرضها مجددًا.
- `groups.<room>.skills`: عامل تصفية Skills اختياري على مستوى الغرفة.
- `groups.<room>.systemPrompt`: مقتطف system prompt اختياري على مستوى الغرفة.
- `rooms`: اسم مستعار قديم لـ `groups`.
- `actions`: تقييد الأدوات لكل إجراء (`messages` أو `reactions` أو `pins` أو `profile` أو `memberInfo` أو `channelInfo` أو `verification`).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [Groups](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الذكر
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
