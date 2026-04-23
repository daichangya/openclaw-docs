---
read_when:
    - إعداد Matrix في OpenClaw
    - تهيئة التشفير التام بين الطرفين والتحقق في Matrix
summary: حالة دعم Matrix، والإعداد، وأمثلة التهيئة
title: Matrix
x-i18n:
    generated_at: "2026-04-23T07:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 678d0e678cbb52a9817d5a1f4977a738820f6d0228f1810614c9c195c0de7218
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix هي قناة Plugin مضمّنة في OpenClaw.
وهي تستخدم `matrix-js-sdk` الرسمي وتدعم الرسائل المباشرة، والغرف، وسلاسل الرسائل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، والتشفير التام بين الطرفين.

## Plugin المضمّن

يأتي Matrix كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
الإصدارات المجمّعة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Matrix، فقم بتثبيته
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
   - تتضمنه بالفعل إصدارات OpenClaw المجمعة الحالية.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ حساب Matrix على الخادم المنزلي الخاص بك.
3. هيّئ `channels.matrix` باستخدام أحد الخيارين التاليين:
   - `homeserver` + `accessToken`، أو
   - `homeserver` + `userId` + `password`.
4. أعد تشغيل Gateway.
5. ابدأ رسالة مباشرة مع الروبوت أو ادعه إلى غرفة.
   - تعمل دعوات Matrix الجديدة فقط عندما يسمح `channels.matrix.autoJoin` بها.

مسارات الإعداد التفاعلية:

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب معالج Matrix ما يلي:

- عنوان URL للخادم المنزلي
- طريقة المصادقة: access token أو كلمة المرور
- معرّف المستخدم (لمصادقة كلمة المرور فقط)
- اسم اختياري للجهاز
- ما إذا كان يجب تمكين التشفير التام بين الطرفين
- ما إذا كان يجب تهيئة وصول الغرف والانضمام التلقائي للدعوات

سلوكيات المعالج الأساسية:

- إذا كانت متغيرات بيئة مصادقة Matrix موجودة بالفعل ولم يكن ذلك الحساب يحتوي بالفعل على مصادقة محفوظة في التهيئة، فسيعرض المعالج اختصارًا لمتغيرات البيئة للإبقاء على المصادقة في متغيرات البيئة.
- تُطبّع أسماء الحسابات إلى معرّف الحساب. على سبيل المثال، يتحول `Ops Bot` إلى `ops-bot`.
- تقبل إدخالات قائمة السماح للرسائل المباشرة `@user:server` مباشرة؛ ولا تعمل أسماء العرض إلا عندما يعثر البحث المباشر في الدليل على تطابق واحد دقيق.
- تقبل إدخالات قائمة السماح للغرف معرّفات الغرف والأسماء المستعارة مباشرة. يُفضّل استخدام `!room:server` أو `#alias:server`؛ ويتم تجاهل الأسماء غير المحلولة أثناء التشغيل عند تحليل قائمة السماح.
- في وضع قائمة السماح للانضمام التلقائي للدعوات، استخدم فقط أهداف الدعوات المستقرة: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية.
- لتحليل أسماء الغرف قبل الحفظ، استخدم `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`.

إذا تركتها بدون تعيين، فلن ينضم الروبوت إلى الغرف المدعو إليها أو الدعوات
الجديدة بأسلوب الرسائل المباشرة، لذلك لن يظهر في المجموعات الجديدة أو الرسائل
المباشرة المدعو إليها ما لم تنضم يدويًا أولًا.

اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي
يقبلها، أو اضبط `autoJoin: "always"` إذا كنت تريد منه الانضمام إلى كل دعوة.

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

إعداد أدنى يعتمد على token:

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
ويستخدم الحساب الافتراضي `credentials.json`؛ بينما تستخدم الحسابات المسماة `credentials-<account>.json`.
وعند وجود بيانات اعتماد مخزنة مؤقتًا هناك، يتعامل OpenClaw مع Matrix على أنه مُهيأ لأغراض الإعداد وdoctor واكتشاف حالة القناة، حتى إذا لم تكن المصادقة الحالية مضبوطة مباشرة في التهيئة.

المكافئات عبر متغيرات البيئة (تُستخدم عندما لا يكون مفتاح التهيئة مضبوطًا):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

للحسابات غير الافتراضية، استخدم متغيرات بيئة مقيّدة بالحساب:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

مثال للحساب `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

لمعرّف الحساب المطبّع `ops-bot`، استخدم:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

يقوم Matrix بتهريب علامات الترقيم في معرّفات الحسابات للحفاظ على متغيرات البيئة المقيّدة خالية من التعارضات.
فعلى سبيل المثال، يتحول `-` إلى `_X2D_`، ولذلك يتم تعيين `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

لا يعرض المعالج التفاعلي اختصار متغيرات البيئة إلا عندما تكون متغيرات بيئة المصادقة تلك موجودة بالفعل ولا يكون الحساب المحدد يحتوي بالفعل على مصادقة Matrix محفوظة في التهيئة.

<Note>
`MATRIX_HOMESERVER` موجود في قائمة حظر كتل نقاط النهاية ولا يمكن ضبطه من ملف
`.env` الخاص بمساحة العمل. يجب أن يأتي من بيئة shell أو بيئة عملية Gateway
حتى لا تتمكن مساحات العمل غير الموثوقة من إعادة توجيه حركة Matrix إلى خادم
منزلي مختلف. راجع
[ملفات `.env` لمساحة العمل](/ar/gateway/security) للاطلاع على القائمة الكاملة.
</Note>

## مثال على التهيئة

هذا مثال عملي أساسي للتهيئة مع إقران الرسائل المباشرة، وقائمة سماح للغرف، وتمكين التشفير التام بين الطرفين:

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

تنطبق `autoJoin` على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل المباشرة. لا يستطيع OpenClaw
تصنيف غرفة مدعو إليها بشكل موثوق على أنها رسالة مباشرة أو مجموعة وقت الدعوة، لذلك تمر جميع الدعوات عبر `autoJoin`
أولًا. وتُطبق `dm.policy` بعد انضمام الروبوت وتصنيف الغرفة على أنها رسالة مباشرة.

## معاينات البث

بث الردود في Matrix هو خيار يتطلب التفعيل.

اضبط `channels.matrix.streaming` على `"partial"` عندما تريد من OpenClaw إرسال معاينة مباشرة واحدة
للرد، وتحرير هذه المعاينة في مكانها بينما يولّد النموذج النص، ثم إنهاءها عند
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

- `streaming: "off"` هو الوضع الافتراضي. ينتظر OpenClaw الرد النهائي ويرسله مرة واحدة.
- ينشئ `streaming: "partial"` رسالة معاينة واحدة قابلة للتحرير لكتلة المساعد الحالية باستخدام رسائل Matrix النصية العادية. يحافظ هذا على سلوك الإشعارات القديم في Matrix القائم على المعاينة أولًا، لذلك قد تقوم العملاء القياسيون بالإشعار عند أول نص معاينة متدفق بدلًا من الكتلة المكتملة.
- ينشئ `streaming: "quiet"` إشعار معاينة هادئًا واحدًا قابلًا للتحرير لكتلة المساعد الحالية. استخدم هذا فقط عندما تهيئ أيضًا قواعد push للمستلمين من أجل تعديلات المعاينات النهائية.
- يفعّل `blockStreaming: true` رسائل تقدم Matrix منفصلة. عند تمكين بث المعاينة، يحتفظ Matrix بالمسودة المباشرة للكتلة الحالية ويحافظ على الكتل المكتملة كرسائل منفصلة.
- عندما يكون بث المعاينة قيد التشغيل ويكون `blockStreaming` معطّلًا، يعدّل Matrix المسودة المباشرة في مكانها وينهي الحدث نفسه عند اكتمال الكتلة أو الدور.
- إذا لم تعد المعاينة تتسع في حدث Matrix واحد، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي العادي.
- تظل ردود الوسائط ترسل المرفقات بشكل طبيعي. وإذا تعذر إعادة استخدام معاينة قديمة بأمان، يقوم OpenClaw بتنقيحها قبل إرسال رد الوسائط النهائي.
- تتطلب تعديلات المعاينة استدعاءات إضافية إلى Matrix API. اترك البث معطلًا إذا كنت تريد السلوك الأكثر تحفظًا تجاه حدود المعدل.

لا يفعّل `blockStreaming` معاينات المسودات بمفرده.
استخدم `streaming: "partial"` أو `streaming: "quiet"` لتعديلات المعاينة؛ ثم أضف `blockStreaming: true` فقط إذا كنت تريد أيضًا أن تظل كتل المساعد المكتملة مرئية كرسائل تقدم منفصلة.

إذا كنت تحتاج إلى إشعارات Matrix القياسية بدون قواعد push مخصصة، فاستخدم `streaming: "partial"` لسلوك المعاينة أولًا أو اترك `streaming` معطّلًا للتسليم النهائي فقط. مع `streaming: "off"`:

- يرسل `blockStreaming: true` كل كتلة مكتملة كرسالة Matrix عادية مُرسِلة للإشعارات.
- يرسل `blockStreaming: false` الرد النهائي المكتمل فقط كرسالة Matrix عادية مُرسِلة للإشعارات.

### قواعد push مستضافة ذاتيًا للمعاينات الهادئة النهائية

إذا كنت تشغّل بنية Matrix التحتية الخاصة بك وتريد أن ترسل المعاينات الهادئة إشعارًا فقط عند اكتمال كتلة أو
الرد النهائي، فاضبط `streaming: "quiet"` وأضف قاعدة push لكل مستخدم مستلم من أجل تعديلات المعاينات النهائية.

يكون هذا عادة إعدادًا على مستوى المستخدم المستلم، وليس تغييرًا عامًا على مستوى الخادم المنزلي:

خريطة سريعة قبل أن تبدأ:

- المستخدم المستلم = الشخص الذي يجب أن يتلقى الإشعار
- مستخدم الروبوت = حساب Matrix الخاص بـ OpenClaw الذي يرسل الرد
- استخدم access token الخاص بالمستخدم المستلم في استدعاءات API أدناه
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

2. تأكد من أن حساب المستلم يتلقى بالفعل إشعارات Matrix العادية. لا تعمل قواعد المعاينة
   الهادئة إلا إذا كان لدى ذلك المستخدم بالفعل pushers/أجهزة عاملة.

3. احصل على access token الخاص بالمستخدم المستلم.
   - استخدم token الخاص بالمستخدم المستلم للرسالة، وليس token الخاص بالروبوت.
   - غالبًا ما تكون إعادة استخدام token جلسة عميل موجودة بالفعل هي الأسهل.
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

4. تحقق من أن حساب المستلم لديه بالفعل pushers:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

إذا لم يُرجع هذا أي pushers/أجهزة نشطة، فأصلح إشعارات Matrix العادية أولًا قبل إضافة
قاعدة OpenClaw أدناه.

يضع OpenClaw علامة على تعديلات معاينات النصوص النهائية فقط باستخدام:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. أنشئ قاعدة push override لكل حساب مستلم يجب أن يتلقى هذه الإشعارات:

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

- `https://matrix.example.org`: عنوان URL الأساسي للخادم المنزلي الخاص بك
- `$USER_ACCESS_TOKEN`: access token الخاص بالمستخدم المستلم
- `openclaw-finalized-preview-botname`: معرّف قاعدة فريد لهذا الروبوت لهذا المستخدم المستلم
- `@bot:example.org`: MXID الخاص بروبوت Matrix في OpenClaw، وليس MXID الخاص بالمستخدم المستلم

مهم لإعدادات الروبوتات المتعددة:

- تُفهرس قواعد push بواسطة `ruleId`. وتؤدي إعادة تشغيل `PUT` على معرّف القاعدة نفسه إلى تحديث تلك القاعدة نفسها.
- إذا كان يجب على مستخدم مستلم واحد تلقي إشعارات من عدة حسابات Matrix bot خاصة بـ OpenClaw، فأنشئ قاعدة واحدة لكل روبوت مع معرّف قاعدة فريد لكل مطابقة `sender`.
- نمط بسيط لذلك هو `openclaw-finalized-preview-<botname>`، مثل `openclaw-finalized-preview-ops` أو `openclaw-finalized-preview-support`.

تُقيَّم القاعدة مقارنةً بمرسل الحدث:

- صادِق باستخدام token الخاص بالمستخدم المستلم
- طابِق `sender` مع MXID الخاص بروبوت OpenClaw

6. تحقّق من وجود القاعدة:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. اختبر ردًا متدفقًا. في الوضع الهادئ، يجب أن تُظهر الغرفة معاينة مسودة هادئة، ويجب أن
   يرسل التحرير النهائي في المكان نفسه إشعارًا بمجرد اكتمال الكتلة أو الدور.

إذا احتجت إلى إزالة القاعدة لاحقًا، فاحذف معرّف القاعدة نفسه باستخدام token الخاص بالمستخدم المستلم:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

ملاحظات:

- أنشئ القاعدة باستخدام access token الخاص بالمستخدم المستلم، وليس الخاص بالروبوت.
- تُدرج قواعد `override` الجديدة المعرّفة من المستخدم قبل قواعد المنع الافتراضية، لذلك لا حاجة إلى أي معامل ترتيب إضافي.
- يؤثر هذا فقط في تعديلات المعاينات النصية النهائية التي يستطيع OpenClaw إنهاءها بأمان في مكانها. أما بدائل الوسائط وبدائل المعاينات القديمة فلا تزال تستخدم تسليم Matrix العادي.
- إذا أظهر `GET /_matrix/client/v3/pushers` عدم وجود pushers، فهذا يعني أن المستخدم لا يملك بعد تسليم push يعمل في Matrix لهذا الحساب/الجهاز.

#### Synapse

بالنسبة إلى Synapse، يكون الإعداد أعلاه كافيًا عادةً بمفرده:

- لا يلزم إجراء تغيير خاص في `homeserver.yaml` لإشعارات معاينة OpenClaw النهائية.
- إذا كان نشر Synapse لديك يرسل بالفعل إشعارات Matrix عادية، فإن token المستخدم مع استدعاء `pushrules` أعلاه هما خطوة الإعداد الرئيسية.
- إذا كنت تشغّل Synapse خلف reverse proxy أو workers، فتأكد من أن `/_matrix/client/.../pushrules/` يصل إلى Synapse بشكل صحيح.
- إذا كنت تشغّل Synapse workers، فتأكد من أن pushers سليمة. يتولى التسليم عبر push العملية الرئيسية أو `synapse.app.pusher` / عمال pusher المهيئين.

#### Tuwunel

بالنسبة إلى Tuwunel، استخدم تدفق الإعداد نفسه واستدعاء `pushrules` API نفسه الموضحين أعلاه:

- لا يلزم أي إعداد خاص بـ Tuwunel لمؤشر المعاينة النهائية نفسه.
- إذا كانت إشعارات Matrix العادية تعمل بالفعل لذلك المستخدم، فإن token المستخدم مع استدعاء `pushrules` أعلاه هما خطوة الإعداد الرئيسية.
- إذا بدا أن الإشعارات تختفي بينما يكون المستخدم نشطًا على جهاز آخر، فتحقق مما إذا كان `suppress_push_when_active` ممكّنًا. أضاف Tuwunel هذا الخيار في Tuwunel 1.4.2 بتاريخ 12 سبتمبر 2025، ويمكنه عمدًا كتم push إلى الأجهزة الأخرى بينما يكون أحد الأجهزة نشطًا.

## غرف روبوت إلى روبوت

افتراضيًا، يتم تجاهل رسائل Matrix القادمة من حسابات Matrix أخرى مهيأة في OpenClaw.

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

- يقبل `allowBots: true` الرسائل من حسابات Matrix bot أخرى مهيأة في الغرف المسموح بها والرسائل المباشرة.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا الروبوت بوضوح في الغرف. وتظل الرسائل المباشرة مسموحًا بها.
- تتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- لا يزال OpenClaw يتجاهل الرسائل الواردة من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفّر Matrix هنا علامة bot أصلية؛ ويتعامل OpenClaw مع "مؤلَّف بواسطة bot" على أنه "مرسل بواسطة حساب Matrix آخر مهيأ على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تمكين حركة bot إلى bot في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تُشفَّر معاينات الصور مع المرفق الكامل. وتستخدم الغرف غير المشفرة `thumbnail_url` العادي. لا حاجة إلى أي تهيئة — يكتشف Plugin حالة E2EE تلقائيًا.

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

حالة تفصيلية (تشخيصات كاملة):

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

تشخيصات bootstrap التفصيلية:

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

تفاصيل التحقق من الجهاز بشكل تفصيلي:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

التحقق من سلامة النسخ الاحتياطي لمفاتيح الغرف:

```bash
openclaw matrix verify backup status
```

تشخيصات تفصيلية لسلامة النسخ الاحتياطي:

```bash
openclaw matrix verify backup status --verbose
```

استعادة مفاتيح الغرف من النسخ الاحتياطي على الخادم:

```bash
openclaw matrix verify backup restore
```

تشخيصات الاستعادة التفصيلية:

```bash
openclaw matrix verify backup restore --verbose
```

احذف النسخ الاحتياطي الحالي على الخادم وأنشئ خط أساس جديدًا للنسخ الاحتياطي. إذا تعذر تحميل
مفتاح النسخ الاحتياطي المخزن بشكل سليم، فيمكن لإعادة التعيين هذه أيضًا إعادة إنشاء التخزين السري بحيث
تتمكن عمليات البدء الباردة المستقبلية من تحميل مفتاح النسخ الاحتياطي الجديد:

```bash
openclaw matrix verify backup reset --yes
```

تكون جميع أوامر `verify` موجزة افتراضيًا (بما في ذلك تسجيلات SDK الداخلية الهادئة) ولا تعرض تشخيصات مفصلة إلا مع `--verbose`.
استخدم `--json` للحصول على مخرجات كاملة قابلة للقراءة آليًا عند كتابة السكربتات.

في إعدادات الحسابات المتعددة، تستخدم أوامر Matrix في CLI حساب Matrix الافتراضي الضمني ما لم تمرر `--account <id>`.
إذا قمت بتهيئة عدة حسابات مسماة، فاضبط `channels.matrix.defaultAccount` أولًا وإلا ستتوقف عمليات CLI الضمنية تلك وتطلب منك اختيار حساب صراحةً.
استخدم `--account` كلما أردت أن تستهدف عمليات التحقق أو الجهاز حسابًا مسمى صراحةً:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

عندما يكون التشفير معطّلًا أو غير متاح لحساب مسمى، تشير تحذيرات Matrix وأخطاء التحقق إلى مفتاح تهيئة ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

### ما معنى "تم التحقق"

يتعامل OpenClaw مع جهاز Matrix هذا على أنه تم التحقق منه فقط عندما يكون مُتحققًا منه بواسطة هوية cross-signing الخاصة بك.
وعمليًا، يكشف `openclaw matrix verify status --verbose` عن ثلاث إشارات ثقة:

- `Locally trusted`: هذا الجهاز موثوق به من قبل العميل الحالي فقط
- `Cross-signing verified`: يفيد SDK بأن الجهاز تم التحقق منه عبر cross-signing
- `Signed by owner`: الجهاز موقّع بواسطة مفتاح self-signing الخاص بك

تصبح `Verified by owner` مساوية لـ `yes` فقط عندما يكون تحقق cross-signing أو توقيع المالك موجودًا.
ولا تكفي الثقة المحلية وحدها لكي يعتبر OpenClaw الجهاز متحققًا منه بالكامل.

### ما الذي يفعله bootstrap

يُعد `openclaw matrix verify bootstrap` أمر الإصلاح والإعداد لحسابات Matrix المشفرة.
وهو يقوم بكل ما يلي بالترتيب:

- يهيئ التخزين السري، مع إعادة استخدام مفتاح استرداد موجود عند الإمكان
- يهيئ cross-signing ويرفع مفاتيح cross-signing العامة المفقودة
- يحاول وسم الجهاز الحالي وتوقيعه عبر cross-signing
- ينشئ نسخة احتياطية جديدة لمفاتيح الغرف على الخادم إذا لم تكن موجودة بالفعل

إذا كان الخادم المنزلي يتطلب مصادقة تفاعلية لرفع مفاتيح cross-signing، فسيحاول OpenClaw الرفع أولًا بدون مصادقة، ثم باستخدام `m.login.dummy`، ثم باستخدام `m.login.password` عندما تكون `channels.matrix.password` مهيأة.

استخدم `--force-reset-cross-signing` فقط عندما تريد عمدًا تجاهل هوية cross-signing الحالية وإنشاء هوية جديدة.

إذا كنت تريد عمدًا تجاهل النسخ الاحتياطي الحالي لمفاتيح الغرف وبدء
خط أساس نسخ احتياطي جديد للرسائل المستقبلية، فاستخدم `openclaw matrix verify backup reset --yes`.
افعل ذلك فقط عندما تكون موافقًا على أن السجل المشفر القديم غير القابل للاسترداد سيظل
غير متاح، وأن OpenClaw قد يعيد إنشاء التخزين السري إذا تعذر تحميل
سر النسخ الاحتياطي الحالي بأمان.

### خط أساس جديد للنسخ الاحتياطي

إذا كنت تريد الحفاظ على عمل الرسائل المشفرة المستقبلية وتقبل فقدان السجل القديم غير القابل للاسترداد، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

أضف `--account <id>` إلى كل أمر عندما تريد استهداف حساب Matrix مسمى صراحةً.

### سلوك بدء التشغيل

عندما تكون `encryption: true`، يعيّن Matrix افتراضيًا `startupVerification` إلى `"if-unverified"`.
عند بدء التشغيل، إذا كان هذا الجهاز لا يزال غير متحقق منه، فسيطلب Matrix التحقق الذاتي في عميل Matrix آخر،
ويتخطى الطلبات المكررة عندما يكون أحدها قيد الانتظار بالفعل، ويطبق فترة تهدئة محلية قبل إعادة المحاولة بعد إعادة التشغيل.
وتعيد محاولات الطلب الفاشلة المحاولة أسرع من إنشاء الطلب الناجح افتراضيًا.
اضبط `startupVerification: "off"` لتعطيل الطلبات التلقائية عند بدء التشغيل، أو عدّل `startupVerificationCooldownHours`
إذا كنت تريد نافذة إعادة محاولة أقصر أو أطول.

ينفذ بدء التشغيل أيضًا تمريرة bootstrap متحفظة للتشفير تلقائيًا.
وتحاول تلك التمريرة أولًا إعادة استخدام التخزين السري الحالي وهوية cross-signing الحالية، وتتجنب إعادة تعيين cross-signing ما لم تشغّل تدفق إصلاح bootstrap صريحًا.

إذا وجد بدء التشغيل حالة bootstrap معطلة رغم ذلك، فيمكن لـ OpenClaw محاولة مسار إصلاح مضبوط حتى عندما لا تكون `channels.matrix.password` مهيأة.
وإذا كان الخادم المنزلي يتطلب UIA قائمًا على كلمة المرور لهذا الإصلاح، فسيسجل OpenClaw تحذيرًا ويبقي بدء التشغيل غير قاتل بدلًا من إيقاف الروبوت.
وإذا كان الجهاز الحالي موقّعًا بالفعل من المالك، فسيحافظ OpenClaw على تلك الهوية بدلًا من إعادة تعيينها تلقائيًا.

راجع [ترحيل Matrix](/ar/install/migrating-matrix) للاطلاع على تدفق الترقية الكامل، والحدود، وأوامر الاسترداد، ورسائل الترحيل الشائعة.

### إشعارات التحقق

ينشر Matrix إشعارات دورة حياة التحقق مباشرة في غرفة التحقق الصارمة للرسائل المباشرة كرسائل `m.notice`.
ويشمل ذلك:

- إشعارات طلب التحقق
- إشعارات جاهزية التحقق (مع إرشاد صريح "تحقق بواسطة emoji")
- إشعارات بدء التحقق واكتماله
- تفاصيل SAS (emoji وأرقام عشرية) عند توفرها

تُتبع طلبات التحقق الواردة من عميل Matrix آخر ويقبلها OpenClaw تلقائيًا.
وبالنسبة إلى تدفقات التحقق الذاتي، يبدأ OpenClaw أيضًا تدفق SAS تلقائيًا عندما يصبح التحقق بالـ emoji متاحًا ويؤكد جانبه الخاص.
أما بالنسبة إلى طلبات التحقق القادمة من مستخدم/جهاز Matrix آخر، فيقبل OpenClaw الطلب تلقائيًا ثم ينتظر استمرار تدفق SAS بشكل طبيعي.
ولا يزال يتعين عليك مقارنة SAS بالـ emoji أو الأرقام العشرية في عميل Matrix لديك وتأكيد "They match" هناك لإكمال التحقق.

لا يقبل OpenClaw تلقائيًا التدفقات المكررة التي بدأها بنفسه بشكل أعمى. ويتخطى بدء التشغيل إنشاء طلب جديد عندما يكون طلب التحقق الذاتي قيد الانتظار بالفعل.

لا تُمرر إشعارات بروتوكول/نظام التحقق إلى مسار دردشة الوكيل، لذلك لا تنتج `NO_REPLY`.

### نظافة الأجهزة

يمكن أن تتراكم أجهزة Matrix القديمة التي يديرها OpenClaw على الحساب وتجعل فهم الثقة في الغرف المشفرة أصعب.
اعرضها باستخدام:

```bash
openclaw matrix devices list
```

أزل أجهزة OpenClaw المُدارة القديمة باستخدام:

```bash
openclaw matrix devices prune-stale
```

### مخزن التشفير

يستخدم التشفير التام بين الطرفين في Matrix مسار التشفير Rust الرسمي في `matrix-js-sdk` ضمن Node، مع `fake-indexeddb` كطبقة IndexedDB بديلة. تُحفَظ حالة التشفير في ملف لقطة (`crypto-idb-snapshot.json`) وتُستعاد عند بدء التشغيل. ملف اللقطة هذا يمثل حالة تشغيل حساسة ويُخزَّن بصلاحيات ملفات مقيّدة.

توجد حالة التشغيل المشفرة ضمن جذور لكل حساب ولكل مستخدم حسب تجزئة token في
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
ويحتوي هذا الدليل على مخزن المزامنة (`bot-storage.json`) ومخزن التشفير (`crypto/`)،
وملف مفتاح الاسترداد (`recovery-key.json`) ولقطة IndexedDB (`crypto-idb-snapshot.json`)،
وروابط سلاسل الرسائل (`thread-bindings.json`) وحالة التحقق عند بدء التشغيل (`startup-verification.json`).
وعندما يتغير token لكن تظل هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود
لتركيبة الحساب/الخادم المنزلي/المستخدم تلك بحيث تظل حالة المزامنة السابقة، وحالة التشفير، وروابط سلاسل الرسائل،
وحالة التحقق عند بدء التشغيل، مرئية.

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد باستخدام:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

أضف `--account <id>` عندما تريد استهداف حساب Matrix مسمى صراحةً.

يقبل Matrix عناوين URL للصورة الرمزية من نوع `mxc://` مباشرةً. وعندما تمرر عنوان URL للصورة الرمزية من نوع `http://` أو `https://`، يقوم OpenClaw أولًا برفعه إلى Matrix ثم يخزن عنوان `mxc://` الناتج مرة أخرى في `channels.matrix.avatarUrl` (أو في تجاوز الحساب المحدد).

## سلاسل الرسائل

يدعم Matrix سلاسل Matrix الأصلية لكل من الردود التلقائية وإرسال أدوات الرسائل.

- يبقي `dm.sessionScope: "per-user"` (الافتراضي) توجيه الرسائل المباشرة في Matrix ضمن نطاق المرسل، بحيث يمكن لعدة غرف رسائل مباشرة مشاركة جلسة واحدة عندما تُحل إلى النظير نفسه.
- يعزل `dm.sessionScope: "per-room"` كل غرفة رسائل مباشرة في Matrix ضمن مفتاح جلسة خاص بها مع الاستمرار في استخدام فحوصات المصادقة وقائمة السماح العادية للرسائل المباشرة.
- تظل روابط المحادثات الصريحة في Matrix متقدمة على `dm.sessionScope`، لذلك تحتفظ الغرف وسلاسل الرسائل المرتبطة بجلسة الهدف المختارة لها.
- يُبقي `threadReplies: "off"` الردود في المستوى الأعلى ويُبقي الرسائل الواردة ضمن سلسلة الرسائل على جلسة الأصل.
- يرد `threadReplies: "inbound"` داخل سلسلة رسائل فقط عندما تكون الرسالة الواردة موجودة أصلًا داخل تلك السلسلة.
- يُبقي `threadReplies: "always"` ردود الغرف داخل سلسلة رسائل متجذرة في الرسالة المُحفِّزة ويوجه تلك المحادثة عبر الجلسة المطابقة ذات النطاق الخاص بسلسلة الرسائل من أول رسالة مُحفِّزة.
- تتجاوز `dm.threadReplies` الإعداد الأعلى مستوى للرسائل المباشرة فقط. فعلى سبيل المثال، يمكنك إبقاء سلاسل الغرف معزولة مع إبقاء الرسائل المباشرة مسطحة.
- تتضمن الرسائل الواردة ضمن سلسلة الرسائل الرسالة الجذرية لتلك السلسلة كسياق إضافي للوكيل.
- ترث عمليات الإرسال عبر أدوات الرسائل سلسلة Matrix الحالية تلقائيًا عندما يكون الهدف هو الغرفة نفسها، أو هدف مستخدم الرسائل المباشرة نفسه، ما لم يتم توفير `threadId` صريح.
- لا يبدأ إعادة استخدام هدف مستخدم الرسائل المباشرة للجلسة نفسها إلا عندما تثبت بيانات تعريف الجلسة الحالية النظير نفسه للرسائل المباشرة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي على مستوى المستخدم.
- عندما يلاحظ OpenClaw اصطدام غرفة رسائل مباشرة في Matrix مع غرفة رسائل مباشرة أخرى في جلسة Matrix DM مشتركة نفسها، فإنه ينشر رسالة `m.notice` لمرة واحدة في تلك الغرفة مع منفذ الهروب `/focus` عندما تكون روابط سلاسل الرسائل مفعلة وتلميح `dm.sessionScope` موجودًا.
- يتم دعم روابط سلاسل الرسائل في وقت التشغيل لـ Matrix. تعمل الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبط بسلسلة الرسائل في غرف Matrix ورسائلها المباشرة.
- ينشئ `/focus` في المستوى الأعلى لغرفة/رسائل Matrix المباشرة سلسلة Matrix جديدة ويربطها بجلسة الهدف عندما تكون `threadBindings.spawnSubagentSessions=true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة الحالية بدلًا من ذلك.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وسلاسل Matrix الموجودة إلى مساحات عمل ACP دائمة دون تغيير سطح الدردشة.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix المباشرة أو الغرفة أو سلسلة الرسائل الموجودة التي تريد الاستمرار في استخدامها.
- في رسالة Matrix مباشرة أو غرفة من المستوى الأعلى، يظل سطح الدردشة هو غرفة/رسالة Matrix المباشرة الحالية وتُوجَّه الرسائل المستقبلية إلى جلسة ACP التي تم إنشاؤها.
- داخل سلسلة Matrix موجودة، يربط `--bind here` تلك السلسلة الحالية في مكانها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يُغلق `/acp close` جلسة ACP ويزيل الرابط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة Matrix فرعية.
- لا تكون `threadBindings.spawnAcpSessions` مطلوبة إلا لـ `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة Matrix فرعية أو ربطها.

### تهيئة ربط سلاسل الرسائل

يرث Matrix القيم الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات خاصة بكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

إشارات الإنشاء المرتبط بسلسلة الرسائل في Matrix هي خيارات تتطلب التفعيل:

- اضبط `threadBindings.spawnSubagentSessions: true` للسماح لـ `/focus` في المستوى الأعلى بإنشاء سلاسل Matrix جديدة وربطها.
- اضبط `threadBindings.spawnAcpSessions: true` للسماح لـ `/acp spawn --thread auto|here` بربط جلسات ACP بسلاسل Matrix.

## التفاعلات

يدعم Matrix إجراءات التفاعل الصادرة، وإشعارات التفاعل الواردة، وتفاعلات الإقرار الواردة.

- تُضبط أدوات التفاعل الصادرة بواسطة `channels["matrix"].actions.reactions`.
- يضيف `react` تفاعلًا إلى حدث Matrix محدد.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix محدد.
- يؤدي `emoji=""` إلى إزالة تفاعلات حساب الروبوت نفسه على ذلك الحدث.
- يؤدي `remove: true` إلى إزالة تفاعل emoji المحدد فقط من حساب الروبوت.

يستخدم نطاق تفاعلات الإقرار ترتيب الحسم القياسي في OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- الرجوع إلى emoji هوية الوكيل

يُحسم نطاق تفاعل الإقرار بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

يُحسم وضع إشعارات التفاعل بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- الافتراضي: `own`

السلوك:

- يؤدي `reactionNotifications: "own"` إلى تمرير أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix المؤلفة بواسطة الروبوت.
- يؤدي `reactionNotifications: "off"` إلى تعطيل أحداث نظام التفاعل.
- لا تُصاغ عمليات إزالة التفاعل كأحداث نظام لأن Matrix يعرضها كعمليات تنقيح، وليس كعمليات إزالة `m.reaction` مستقلة.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الأخيرة المضمنة كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أي منهما مضبوطًا، تكون القيمة الافتراضية الفعلية `0`. اضبط `0` للتعطيل.
- يقتصر سجل غرف Matrix على الغرفة فقط. وتستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- سجل غرف Matrix معلّق فقط: يخزّن OpenClaw رسائل الغرفة التي لم تؤدِّ إلى رد بعد، ثم يلتقط تلك النافذة عند وصول ذكر أو مُحفّز آخر.
- لا تُضمَّن الرسالة المحفّزة الحالية في `InboundHistory`؛ إذ تبقى في متن الرسالة الواردة الرئيسي لذلك الدور.
- تعيد محاولات الحدث نفسه في Matrix استخدام لقطة السجل الأصلية بدلًا من الانجراف إلى رسائل غرفة أحدث.

## ظهور السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` للسياق التكميلي للغرفة مثل نص الرد المجتلب، وجذور سلاسل الرسائل، والسجل المعلّق.

- `contextVisibility: "all"` هو الافتراضي. يُحتفظ بالسياق التكميلي كما ورد.
- يقوم `contextVisibility: "allowlist"` بترشيح السياق التكميلي إلى المرسلين المسموح بهم وفق فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يعمل `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يحتفظ مع ذلك برد مقتبس صريح واحد.

يؤثر هذا الإعداد في ظهور السياق التكميلي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكنها تشغيل رد.
ولا يزال تفويض التشغيل يأتي من إعدادات `groupPolicy` و`groups` و`groupAllowFrom` وسياسة الرسائل المباشرة.

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

راجع [المجموعات](/ar/channels/groups) لمعرفة سلوك بوابة الذكر وقائمة السماح.

مثال الإقران لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير معتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الإقران المعلّق نفسه وقد يرسل رد تذكير مرة أخرى بعد فترة تهدئة قصيرة بدلًا من إصدار رمز جديد.

راجع [الإقران](/ar/channels/pairing) لمعرفة تدفق إقران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا أصبحت حالة الرسائل المباشرة غير متزامنة، فقد ينتهي الأمر بـ OpenClaw إلى امتلاك تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من الرسالة المباشرة الحية. افحص التعيين الحالي لنظير باستخدام:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

وأصلحه باستخدام:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

تدفق الإصلاح:

- يفضّل رسالة مباشرة صارمة 1:1 تم تعيينها بالفعل في `m.direct`
- يعود إلى أي رسالة مباشرة صارمة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف تدفق الإصلاح الغرف القديمة تلقائيًا. بل يختار فقط الرسالة المباشرة السليمة ويحدّث التعيين بحيث تستهدف عمليات الإرسال الجديدة في Matrix، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة مجددًا.

## موافقات Exec

يمكن لـ Matrix أن يعمل كعميل موافقة أصلي لحساب Matrix. وتظل
عناصر التحكم الأصلية في توجيه الرسائل المباشرة/القنوات ضمن تهيئة موافقة exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (اختياري؛ يعود إلى `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

يجب أن يكون الموافقون معرّفات مستخدمي Matrix مثل `@owner:example.org`. يفعّل Matrix الموافقات الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو مساوية لـ `"auto"` ويمكن حلّ وافق واحد على الأقل. تستخدم موافقات Exec مجموعة الموافقين من `execApprovals.approvers` أولًا ويمكن أن تعود إلى `channels.matrix.dm.allowFrom`. وتُفوض موافقات Plugin عبر `channels.matrix.dm.allowFrom`. اضبط `enabled: false` لتعطيل Matrix كعميل موافقة أصلي صراحةً. وبخلاف ذلك تعود طلبات الموافقة إلى مسارات الموافقة الأخرى المهيأة أو إلى سياسة الرجوع الخاصة بالموافقة.

يدعم التوجيه الأصلي في Matrix نوعَي الموافقات كليهما:

- يتحكم `channels.matrix.execApprovals.*` في وضع التوزيع الأصلي للرسائل المباشرة/القنوات لطلبات موافقة Matrix.
- تستخدم موافقات Exec مجموعة الموافقين من `execApprovals.approvers` أو `channels.matrix.dm.allowFrom`.
- تستخدم موافقات Plugin قائمة السماح الخاصة برسائل Matrix المباشرة من `channels.matrix.dm.allowFrom`.
- تنطبق اختصارات التفاعل في Matrix وتحديثات الرسائل على كل من موافقات exec وPlugin.

قواعد التسليم:

- يؤدي `target: "dm"` إلى إرسال طلبات الموافقة إلى الرسائل المباشرة للموافقين
- يؤدي `target: "channel"` إلى إرسال الطلب مرة أخرى إلى غرفة Matrix أو الرسالة المباشرة الأصلية
- يؤدي `target: "both"` إلى الإرسال إلى الرسائل المباشرة للموافقين وإلى غرفة Matrix أو الرسالة المباشرة الأصلية

تزرع طلبات الموافقة في Matrix اختصارات تفاعل على رسالة الموافقة الأساسية:

- `✅` = سماح مرة واحدة
- `❌` = رفض
- `♾️` = سماح دائم عندما يكون هذا القرار مسموحًا به وفق سياسة exec الفعلية

يمكن للموافقين التفاعل على تلك الرسالة أو استخدام أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once` أو `/approve <id> allow-always` أو `/approve <id> deny`.

يمكن فقط للموافقين الذين تم حلّهم إصدار الموافقة أو الرفض. وبالنسبة إلى موافقات exec، يتضمن التسليم عبر القناة نص الأمر، لذا لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

تجاوز خاص بكل حساب:

- `channels.matrix.accounts.<account>.execApprovals`

الوثائق ذات الصلة: [موافقات Exec](/ar/tools/exec-approvals)

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة في Matrix (مثل `/new` و`/reset` و`/model`) مباشرة في الرسائل المباشرة. وفي الغرف، يتعرف OpenClaw أيضًا على أوامر الشرطة المائلة التي تسبقها إشارة Matrix الخاصة بالروبوت نفسه، لذا فإن `@bot:server /new` يفعّل مسار الأمر من دون الحاجة إلى تعبير mention مخصص. وهذا يبقي الروبوت مستجيبًا لمنشورات الغرف بأسلوب `@mention /command` التي يصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم الروبوت باستخدام tab قبل كتابة الأمر.

تظل قواعد التفويض سارية: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك الخاصة بالرسائل المباشرة أو الغرف تمامًا كما هو الحال مع الرسائل العادية.

## الحسابات المتعددة

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

تعمل قيم `channels.matrix` في المستوى الأعلى كقيم افتراضية للحسابات المسماة ما لم يقم حساب ما بتجاوزها.
يمكنك تقييد إدخالات الغرف الموروثة إلى حساب Matrix واحد باستخدام `groups.<room>.account`.
وتظل الإدخالات التي لا تحتوي على `account` مشتركة بين جميع حسابات Matrix، كما أن الإدخالات التي تحتوي على `account: "default"` تظل تعمل عندما يكون الحساب الافتراضي مهيأ مباشرة في `channels.matrix.*` من المستوى الأعلى.
لا تنشئ القيم الافتراضية المشتركة الجزئية للمصادقة حسابًا افتراضيًا ضمنيًا منفصلًا بمفردها. لا يقوم OpenClaw بتركيب حساب `default` من المستوى الأعلى إلا عندما يكون لذلك الافتراضي مصادقة حديثة (`homeserver` مع `accessToken`، أو `homeserver` مع `userId` و`password`)؛ ويمكن للحسابات المسماة أن تظل قابلة للاكتشاف من `homeserver` مع `userId` عندما تلبي بيانات الاعتماد المخزنة مؤقتًا المصادقة لاحقًا.
إذا كان Matrix يحتوي بالفعل على حساب مسمى واحد بالضبط، أو كانت `defaultAccount` تشير إلى مفتاح حساب مسمى موجود، فإن ترقية الإصلاح/الإعداد من حساب واحد إلى عدة حسابات تحافظ على ذلك الحساب بدلًا من إنشاء إدخال جديد `accounts.default`. تنتقل فقط مفاتيح المصادقة/Bootstrap الخاصة بـ Matrix إلى ذلك الحساب المُرقّى؛ وتبقى مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.
اضبط `defaultAccount` عندما تريد من OpenClaw تفضيل حساب Matrix مسمى واحد للتوجيه الضمني، والاستكشاف، وعمليات CLI.
إذا تم تهيئة عدة حسابات Matrix وكان أحد معرّفات الحسابات هو `default`، فإن OpenClaw يستخدم ذلك الحساب ضمنيًا حتى إذا لم تكن `defaultAccount` مضبوطة.
إذا قمت بتهيئة عدة حسابات مسماة، فاضبط `defaultAccount` أو مرر `--account <id>` لأوامر CLI التي تعتمد على الاختيار الضمني للحساب.
مرر `--account <id>` إلى `openclaw matrix verify ...` و`openclaw matrix devices ...` عندما تريد تجاوز هذا الاختيار الضمني لأمر واحد.

راجع [مرجع التهيئة](/ar/gateway/configuration-reference#multi-account-all-channels) لمعرفة النمط المشترك للحسابات المتعددة.

## خوادم منزلية خاصة/على الشبكة المحلية

افتراضيًا، يحظر OpenClaw خوادم Matrix المنزلية الخاصة/الداخلية للحماية من SSRF ما لم
تقم صراحةً بتفعيل ذلك لكل حساب.

إذا كان خادمك المنزلي يعمل على localhost أو عنوان LAN/Tailscale IP أو اسم مضيف داخلي، فقم بتمكين
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

يسمح هذا التفعيل فقط بالأهداف الخاصة/الداخلية الموثوقة. وتظل الخوادم المنزلية العامة غير المشفرة مثل
`http://matrix.example.org:8008` محظورة. يُفضّل استخدام `https://` كلما أمكن.

## تمرير حركة Matrix عبر Proxy

إذا كان نشر Matrix لديك يحتاج إلى HTTP(S) proxy صريح للخروج، فاضبط `channels.matrix.proxy`:

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
يستخدم OpenClaw إعداد proxy نفسه لكل من حركة Matrix أثناء التشغيل واستكشافات حالة الحساب.

## تحليل الهدف

يقبل Matrix صيغ الأهداف هذه في أي مكان يطلب منك فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

يستخدم البحث المباشر في الدليل حساب Matrix الذي سجل الدخول:

- تستعلم عمليات البحث عن المستخدمين من دليل مستخدمي Matrix على ذلك الخادم المنزلي.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- يكون البحث باسم الغرفة ضمن الغرف المنضم إليها على أساس أفضل جهد. وإذا تعذر تحليل اسم الغرفة إلى معرّف أو اسم مستعار، فسيتم تجاهله عند تحليل قائمة السماح أثناء التشغيل.

## مرجع التهيئة

- `enabled`: تمكين القناة أو تعطيلها.
- `name`: تسمية اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضل عند تهيئة عدة حسابات Matrix.
- `homeserver`: عنوان URL للخادم المنزلي، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب في Matrix بالاتصال بخوادم منزلية خاصة/داخلية. فعّل هذا عندما يُحل الخادم المنزلي إلى `localhost` أو عنوان LAN/Tailscale IP أو مضيف داخلي مثل `matrix-synapse`.
- `proxy`: عنوان URL اختياري لـ HTTP(S) proxy لحركة Matrix. ويمكن للحسابات المسماة تجاوز القيمة الافتراضية في المستوى الأعلى باستخدام `proxy` الخاص بها.
- `userId`: معرّف مستخدم Matrix الكامل، مثل `@bot:example.org`.
- `accessToken`: access token للمصادقة المعتمدة على token. تُدعَم القيم النصية الصريحة وقيم SecretRef لكل من `channels.matrix.accessToken` و`channels.matrix.accounts.<id>.accessToken` عبر مزودي env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).
- `password`: كلمة المرور لتسجيل الدخول المعتمد على كلمة المرور. تُدعَم القيم النصية الصريحة وقيم SecretRef.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز لتسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL المخزّن للصورة الرمزية الذاتية لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.
- `encryption`: تمكين التشفير التام بين الطرفين.
- `allowlistOnly`: عندما تكون القيمة `true`، تتم ترقية سياسة الغرف `open` إلى `allowlist`، ويُفرَض تحويل جميع سياسات الرسائل المباشرة النشطة باستثناء `disabled` (بما في ذلك `pairing` و`open`) إلى `allowlist`. ولا يؤثر ذلك في سياسات `disabled`.
- `allowBots`: السماح بالرسائل القادمة من حسابات Matrix أخرى مهيأة في OpenClaw (`true` أو `"mentions"`).
- `groupPolicy`: `open` أو `allowlist` أو `disabled`.
- `contextVisibility`: وضع ظهور سياق الغرفة التكميلي (`all` أو `allowlist` أو `allowlist_quote`).
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف. تُعد معرّفات مستخدمي Matrix الكاملة الأكثر أمانًا؛ وتُحل المطابقات الدقيقة في الدليل عند بدء التشغيل وعند تغير قائمة السماح أثناء تشغيل المراقب. وتُتجاهل الأسماء غير المحلولة.
- `historyLimit`: الحد الأقصى لرسائل الغرفة المضمنة كسياق سجل للمجموعة. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أي منهما مضبوطًا، تكون القيمة الافتراضية الفعلية `0`. اضبط `0` للتعطيل.
- `replyToMode`: `off` أو `first` أو `all` أو `batched`.
- `markdown`: تهيئة اختيارية لعرض Markdown للنصوص الصادرة في Matrix.
- `streaming`: `off` (الافتراضي) أو `"partial"` أو `"quiet"` أو `true` أو `false`. يفعّل `"partial"` و`true` تحديثات المسودات القائمة على المعاينة أولًا باستخدام رسائل Matrix النصية العادية. ويستخدم `"quiet"` إشعارات معاينة غير مرسلة للإشعار لإعدادات قواعد push المستضافة ذاتيًا. وتكافئ `false` القيمة `"off"`.
- `blockStreaming`: تؤدي القيمة `true` إلى تمكين رسائل تقدم منفصلة لكتل المساعد المكتملة أثناء نشاط بث معاينة المسودة.
- `threadReplies`: `off` أو `inbound` أو `always`.
- `threadBindings`: تجاوزات خاصة بكل قناة لتوجيه الجلسات المرتبطة بسلاسل الرسائل ودورة حياتها.
- `startupVerification`: وضع طلب التحقق الذاتي التلقائي عند بدء التشغيل (`if-unverified` أو `off`).
- `startupVerificationCooldownHours`: فترة التهدئة قبل إعادة محاولة طلبات التحقق التلقائي عند بدء التشغيل.
- `textChunkLimit`: حجم تجزئة الرسالة الصادرة بالأحرف (يُطبّق عندما تكون `chunkMode` هي `length`).
- `chunkMode`: يؤدي `length` إلى تقسيم الرسائل حسب عدد الأحرف؛ ويؤدي `newline` إلى تقسيمها عند حدود الأسطر.
- `responsePrefix`: سلسلة اختيارية تُضاف في البداية إلى جميع الردود الصادرة لهذه القناة.
- `ackReaction`: تجاوز اختياري لتفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز اختياري لنطاق تفاعل الإقرار (`group-mentions` أو `group-all` أو `direct` أو `all` أو `none` أو `off`).
- `reactionNotifications`: وضع إشعارات التفاعل الواردة (`own` أو `off`).
- `mediaMaxMb`: حد حجم الوسائط بالميغابايت للإرسال الصادر ومعالجة الوسائط الواردة.
- `autoJoin`: سياسة الانضمام التلقائي للدعوات (`always` أو `allowlist` أو `off`). الافتراضي: `off`. وتنطبق على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `allowlist`. وتُحل إدخالات الأسماء المستعارة إلى معرّفات غرف أثناء معالجة الدعوة؛ ولا يثق OpenClaw في حالة الاسم المستعار التي تدعيها الغرفة المدعو إليها.
- `dm`: كتلة سياسة الرسائل المباشرة (`enabled` أو `policy` أو `allowFrom` أو `sessionScope` أو `threadReplies`).
- `dm.policy`: يتحكم في الوصول إلى الرسائل المباشرة بعد انضمام OpenClaw إلى الغرفة وتصنيفها كرسالة مباشرة. ولا يغير ما إذا كانت الدعوة ستتم معالجتها بالانضمام التلقائي.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل المباشرة. تُعد معرّفات مستخدمي Matrix الكاملة الأكثر أمانًا؛ وتُحل المطابقات الدقيقة في الدليل عند بدء التشغيل وعند تغير قائمة السماح أثناء تشغيل المراقب. وتُتجاهل الأسماء غير المحلولة.
- `dm.sessionScope`: `per-user` (الافتراضي) أو `per-room`. استخدم `per-room` عندما تريد أن يحتفظ كل غرفة رسائل مباشرة في Matrix بسياق منفصل حتى لو كان النظير هو نفسه.
- `dm.threadReplies`: تجاوز لسياسة سلاسل الرسائل خاص بالرسائل المباشرة فقط (`off` أو `inbound` أو `always`). وهو يتجاوز إعداد `threadReplies` في المستوى الأعلى لكل من موضع الرد وعزل الجلسة في الرسائل المباشرة.
- `execApprovals`: تسليم موافقات exec الأصلية في Matrix (`enabled` أو `approvers` أو `target` أو `agentFilter` أو `sessionFilter`).
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة على طلبات exec. وهو اختياري عندما يكون `dm.allowFrom` يحدد الموافقين بالفعل.
- `execApprovals.target`: `dm | channel | both` (الافتراضي: `dm`).
- `accounts`: تجاوزات مسماة خاصة بكل حساب. تعمل قيم `channels.matrix` في المستوى الأعلى كقيم افتراضية لهذه الإدخالات.
- `groups`: خريطة سياسة خاصة بكل غرفة. يُفضّل استخدام معرّفات الغرف أو الأسماء المستعارة؛ وتُتجاهل أسماء الغرف غير المحلولة أثناء التشغيل. تستخدم هوية الجلسة/المجموعة معرّف الغرفة الثابت بعد التحليل.
- `groups.<room>.account`: قصر إدخال غرفة موروث واحد على حساب Matrix محدد في إعدادات الحسابات المتعددة.
- `groups.<room>.allowBots`: تجاوز على مستوى الغرفة للمرسلين من الروبوتات المهيأة (`true` أو `"mentions"`).
- `groups.<room>.users`: قائمة سماح للمرسلين خاصة بكل غرفة.
- `groups.<room>.tools`: تجاوزات السماح/المنع الخاصة بالأدوات لكل غرفة.
- `groups.<room>.autoReply`: تجاوز على مستوى الغرفة لبوابة الذكر. تؤدي `true` إلى تعطيل متطلبات الذكر لتلك الغرفة؛ وتؤدي `false` إلى فرضها مرة أخرى.
- `groups.<room>.skills`: عامل تصفية Skills اختياري على مستوى الغرفة.
- `groups.<room>.systemPrompt`: مقتطف system prompt اختياري على مستوى الغرفة.
- `rooms`: اسم مستعار قديم لـ `groups`.
- `actions`: بوابة الأدوات الخاصة بكل إجراء (`messages` أو `reactions` أو `pins` أو `profile` أو `memberInfo` أو `channelInfo` أو `verification`).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الذكر
- [توجيه القناة](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية الأمنية
