---
read_when:
    - تنفيذ عملاء Gateway WS أو تحديثهم
    - تصحيح حالات عدم تطابق البروتوكول أو حالات فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول Gateway WebSocket: المصافحة، الإطارات، إصدار النسخ'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-04-18T07:14:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f0eebcfdd8c926c90b4753a6d96c59e3134ddb91740f65478f11eb75be85e41
    source_path: gateway/protocol.md
    workflow: 15
---

# بروتوكول Gateway ‏(WebSocket)

يُعد بروتوكول Gateway WS **مستوى التحكم الوحيد + ناقل العقد** في
OpenClaw. تتصل جميع العملاء (CLI، وواجهة الويب، وتطبيق macOS، وعقد iOS/Android،
والعقد عديمة الواجهة) عبر WebSocket وتُصرّح عن **الدور** + **النطاق**
في وقت المصافحة.

## النقل

- WebSocket، بإطارات نصية تحتوي على حمولات JSON.
- يجب أن يكون الإطار الأول **بالضرورة** طلب `connect`.

## المصافحة (`connect`)

Gateway ← العميل (تحدي ما قبل الاتصال):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

العميل ← Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway ← العميل:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

تُعد الحقول `server` و`features` و`snapshot` و`policy` مطلوبة جميعًا بحسب المخطط
(`src/gateway/protocol/schema/frames.ts`). ويُعد `canvasHostUrl` اختياريًا. وتعرض
`auth` الدور/النطاقات التي تم التفاوض عليها عند توفرها، وتتضمن `deviceToken`
عندما يصدر الـ gateway واحدًا.

عند عدم إصدار رمز جهاز مميز، يمكن أن تعرض `hello-ok.auth` الأذونات التي تم التفاوض عليها رغم ذلك:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

عند إصدار رمز جهاز مميز، تتضمن `hello-ok` أيضًا:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

أثناء تسليم التمهيد الموثوق، قد تتضمن `hello-ok.auth` أيضًا إدخالات أدوار إضافية مقيّدة في `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

في تدفق التمهيد المضمن للعقدة/المشغّل، يبقى رمز العقدة الأساسي
`scopes: []` وأي رمز مشغّل مُسلَّم يظل مقيّدًا بقائمة سماح مشغّل التمهيد
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). وتظل عمليات التحقق من نطاقات التمهيد
مسبوقة بالدور: لا تلبّي إدخالات المشغّل إلا طلبات المشغّل، وما زالت الأدوار غير المشغّلة
تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

### مثال على عقدة

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## التأطير

- **طلب**: `{type:"req", id, method, params}`
- **استجابة**: `{type:"res", id, ok, payload|error}`
- **حدث**: `{type:"event", event, payload, seq?, stateVersion?}`

تتطلب الأساليب ذات الآثار الجانبية **مفاتيح idempotency** (راجع المخطط).

## الأدوار + النطاقات

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/UI/الأتمتة).
- `node` = مضيف الإمكانات (camera/screen/canvas/system.run).

### النطاقات (`operator`)

النطاقات الشائعة:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

يتطلب `talk.config` مع `includeSecrets: true` النطاق `operator.talk.secrets`
(أو `operator.admin`).

قد تطلب أساليب Gateway RPC المسجّلة بواسطة Plugin نطاق مشغّل خاصًا بها، لكن
بادئات الإدارة الأساسية المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) تُحل دائمًا إلى `operator.admin`.

يُعد نطاق الأسلوب هو بوابة التحقق الأولى فقط. فبعض أوامر الشرطة المائلة التي يتم الوصول إليها
عبر `chat.send` تطبّق عمليات تحقق أكثر صرامة على مستوى الأمر فوق ذلك. على سبيل المثال،
تتطلب عمليات الكتابة الدائمة في `/config set` و`/config unset` النطاق `operator.admin`.

ويمتلك `node.pair.approve` أيضًا تحقق نطاق إضافيًا في وقت الموافقة فوق نطاق الأسلوب الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تحتوي على أوامر عقدة غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

تُصرّح العقد بادعاءات الإمكانات عند وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى.
- `commands`: قائمة سماح الأوامر لعملية invoke.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه على أنها **ادعاءات** ويفرض قوائم سماح من جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بحسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` بحيث يمكن لواجهات المستخدم عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **operator** و**node** معًا.

## عائلات أساليب RPC الشائعة

هذه الصفحة ليست تفريغًا كاملًا مُولّدًا، لكن سطح WS العام أوسع
من أمثلة المصافحة/المصادقة أعلاه. وهذه هي عائلات الأساليب الرئيسية التي
يعرّضها Gateway اليوم.

تُعد `hello-ok.features.methods` قائمة اكتشاف متحفظة مبنية من
`src/gateway/server-methods-list.ts` بالإضافة إلى صادرات أساليب Plugins/القنوات المحمّلة.
تعامل معها على أنها لاكتشاف الميزات، لا كتفريغ مُولّد لكل مساعد قابل للاستدعاء
ومنفذ في `src/gateway/server-methods/*.ts`.

### النظام والهوية

- يعيد `health` لقطة صحة الـ gateway المخبأة أو التي جرى فحصها حديثًا.
- يعيد `status` ملخص الـ gateway على نمط `/status`؛ وتُضمَّن الحقول الحساسة
  فقط لعملاء المشغّل ذوي النطاق الإداري.
- يعيد `gateway.identity.get` هوية جهاز الـ gateway المستخدمة في تدفقات relay
  والاقتران.
- يعيد `system-presence` لقطة الحضور الحالية للأجهزة المتصلة
  من نوع operator/node.
- يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق
  الحضور.
- يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
- يبدّل `set-heartbeats` معالجة Heartbeat على الـ gateway.

### النماذج والاستخدام

- يعيد `models.list` فهرس النماذج المسموح بها وقت التشغيل.
- يعيد `usage.status` ملخصات نوافذ استخدام المزوّد/الحصة المتبقية.
- يعيد `usage.cost` ملخصات تكلفة الاستخدام المجمعة لنطاق زمني.
- يعيد `doctor.memory.status` جاهزية الذاكرة المتجهية / التضمينات
  لمساحة عمل الوكيل الافتراضي النشطة.
- يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة.
- يعيد `sessions.usage.timeseries` سلسلة زمنية للاستخدام لجلسة واحدة.
- يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

### القنوات ومساعدات تسجيل الدخول

- يعيد `channels.status` ملخصات حالة القنوات/Plugins المضمنة والمجمعة.
- يسجّل `channels.logout` الخروج من قناة/حساب محدد حيثما كانت القناة
  تدعم تسجيل الخروج.
- يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قناة الويب
  القادر على QR الحالي.
- ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ
  القناة عند النجاح.
- يرسل `push.test` إشعار APNs تجريبيًا إلى عقدة iOS مسجلة.
- يعيد `voicewake.get` محفزات كلمات التنبيه المخزنة.
- يحدّث `voicewake.set` محفزات كلمات التنبيه ويبث التغيير.

### المراسلة والسجلات

- يُعد `send` أسلوب RPC للتسليم الصادر المباشر لعمليات الإرسال
  الموجّهة إلى قناة/حساب/محادثة خارج مشغّل الدردشة.
- يعيد `logs.tail` ذيل سجل ملفات الـ gateway المُهيأ مع المؤشر/الحد
  وعناصر التحكم في الحد الأقصى للبايتات.

### Talk وTTS

- يعيد `talk.config` حمولة إعدادات Talk الفعالة؛ ويتطلب `includeSecrets`
  النطاق `operator.talk.secrets` (أو `operator.admin`).
- يضبط `talk.mode` حالة وضع Talk الحالية ويبثها لعملاء WebChat/Control UI.
- يُركّب `talk.speak` الكلام عبر مزوّد الكلام النشط لـ Talk.
- يعيد `tts.status` حالة تمكين TTS، والمزوّد النشط، ومزوّدي الرجوع الاحتياطي،
  وحالة إعدادات المزوّد.
- يعيد `tts.providers` جرد مزوّدي TTS المرئيين.
- يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
- يحدّث `tts.setProvider` مزوّد TTS المفضل.
- يشغّل `tts.convert` تحويل نص إلى كلام لمرة واحدة.

### الأسرار والإعدادات والتحديث والمعالج

- يعيد `secrets.reload` حل SecretRefs النشطة ويبدّل حالة الأسرار وقت التشغيل
  فقط عند النجاح الكامل.
- يعيد `secrets.resolve` حل تعيينات الأسرار المستهدفة للأوامر لمجموعة
  أوامر/أهداف محددة.
- يعيد `config.get` لقطة الإعدادات الحالية وhash الخاص بها.
- يكتب `config.set` حمولة إعدادات تم التحقق من صحتها.
- يدمج `config.patch` تحديث إعدادات جزئيًا.
- يتحقق `config.apply` من حمولة الإعدادات الكاملة ويستبدلها.
- يعيد `config.schema` حمولة مخطط الإعدادات الحية التي تستخدمها Control UI وأدوات
  CLI: المخطط، و`uiHints`، والإصدار، وبيانات التوليد الوصفية، بما في ذلك
  بيانات مخطط Plugin + القناة عندما يستطيع وقت التشغيل تحميلها. ويتضمن المخطط
  بيانات `title` / `description` للحقل المستمدة من نفس التسميات
  ونصوص المساعدة المستخدمة في واجهة المستخدم، بما في ذلك الكائنات المتداخلة،
  وعناصر wildcard، وعناصر المصفوفات، وفروع التركيب `anyOf` / `oneOf` / `allOf`
  عندما توجد وثائق حقل مطابقة.
- يعيد `config.schema.lookup` حمولة بحث مقيّدة بالمسار لمسار إعدادات
  واحد: المسار الموحّد، وعقدة مخطط سطحية، و`hint` المطابق + `hintPath`،
  وملخصات الأبناء المباشرين للتنقل المتدرج في UI/CLI.
  - تحتفظ عقد مخطط البحث بالتوثيق المواجه للمستخدم وحقول التحقق الشائعة:
    `title` و`description` و`type` و`enum` و`const` و`format` و`pattern`،
    وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام منطقية مثل
    `additionalProperties` و`deprecated` و`readOnly` و`writeOnly`.
  - تعرض ملخصات الأبناء `key` و`path` الموحّد و`type` و`required` و`hasChildren`،
    بالإضافة إلى `hint` / `hintPath` المطابقين.
- يشغّل `update.run` تدفق تحديث الـ gateway ويجدول إعادة تشغيل فقط عندما
  ينجح التحديث نفسه.
- تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel`
  معالج الإعداد الأوّلي عبر WS RPC.

### العائلات الرئيسية الحالية

#### مساعدات الوكيل ومساحة العمل

- يعيد `agents.list` إدخالات الوكلاء المُهيأة.
- تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء
  وربط مساحة العمل.
- تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات
  مساحة العمل الخاصة بالتمهيد المعروضة لوكيل.
- يعيد `agent.identity.get` هوية المساعد الفعالة لوكيل أو
  جلسة.
- ينتظر `agent.wait` اكتمال التشغيل ويعيد اللقطة النهائية عند
  توفرها.

#### التحكم في الجلسة

- يعيد `sessions.list` فهرس الجلسات الحالي.
- يبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسات
  لعميل WS الحالي.
- يبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe`
  اشتراكات أحداث النصوص/الرسائل لجلسة واحدة.
- يعيد `sessions.preview` معاينات نصوص محصورة لمفاتيح جلسات
  محددة.
- يحل `sessions.resolve` هدف جلسة أو يوحّده.
- ينشئ `sessions.create` إدخال جلسة جديدًا.
- يرسل `sessions.send` رسالة إلى جلسة موجودة.
- يُعد `sessions.steer` صيغة المقاطعة وإعادة التوجيه لجلسة نشطة.
- يوقف `sessions.abort` العمل النشط لجلسة ما.
- يحدّث `sessions.patch` بيانات الجلسة الوصفية/التجاوزات.
- تنفّذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة
  الجلسة.
- يعيد `sessions.get` صف الجلسة المخزن كاملًا.
- ما زال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و
  `chat.inject`.
- يُطبَّع `chat.history` للعرض لعملاء UI: تُزال وسوم التوجيه المضمنة من
  النص المرئي، وتُزال حمولات XML الخاصة باستدعاء الأدوات بالنص العادي (بما في ذلك
  `<tool_call>...</tool_call>` و`<function_call>...</function_call>`،
  و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>`،
  وكتل استدعاء الأدوات المبتورة) ورموز التحكم الخاصة بالنموذج المتسربة بصيغة ASCII/العرض الكامل،
  وتُحذف صفوف المساعد التي تحتوي فقط على رموز صامتة مثل `NO_REPLY` /
  `no_reply` تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.

#### اقتران الأجهزة ورموز الأجهزة

- يعيد `device.pair.list` الأجهزة المقترنة المعلقة والموافق عليها.
- تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove`
  سجلات اقتران الأجهزة.
- يدوّر `device.token.rotate` رمز جهاز مقترن ضمن حدود
  الدور والنطاق الموافق عليهما.
- يلغي `device.token.revoke` رمز جهاز مقترنًا.

#### اقتران العقدة والاستدعاء والعمل المعلّق

- تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و
  `node.pair.reject` و`node.pair.verify` اقتران العقدة والتحقق من
  التمهيد.
- يعيد `node.list` و`node.describe` حالة العقدة المعروفة/المتصلة.
- يحدّث `node.rename` تسمية عقدة مقترنة.
- يمرر `node.invoke` أمرًا إلى عقدة متصلة.
- يعيد `node.invoke.result` نتيجة طلب استدعاء.
- يحمل `node.event` الأحداث الصادرة من العقدة إلى الـ gateway.
- يجدّد `node.canvas.capability.refresh` رموز إمكانات canvas
  المقيّدة.
- تُعد `node.pending.pull` و`node.pending.ack` واجهات API لطابور العقدة
  المتصلة.
- تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلّق المتين
  للعقد غير المتصلة/غير المتصلة حاليًا.

#### عائلات الموافقات

- تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و
  `exec.approval.resolve` طلبات موافقة التنفيذ لمرة واحدة بالإضافة إلى
  البحث/إعادة التشغيل للموافقات المعلقة.
- ينتظر `exec.approval.waitDecision` قرار موافقة تنفيذ واحدة معلقة ويعيد
  القرار النهائي (أو `null` عند انتهاء المهلة).
- تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقات
  التنفيذ في الـ gateway.
- تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقات التنفيذ
  المحلية للعقدة عبر أوامر relay الخاصة بالعقدة.
- تغطي `plugin.approval.request` و`plugin.approval.list` و
  `plugin.approval.waitDecision` و`plugin.approval.resolve`
  تدفقات الموافقات التي يعرّفها Plugin.

#### عائلات رئيسية أخرى

- الأتمتة:
  - يجدول `wake` إدخال نص تنبيه فوري أو عند Heartbeat التالي
  - `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove`،
    و`cron.run` و`cron.runs`
- Skills/الأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective`

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة UI مثل `chat.inject` وغيرها من
  أحداث الدردشة الخاصة بالنص فقط.
- `session.message` و`session.tool`: تحديثات النص/دفق الأحداث لجلسة
  مشترَك بها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها الوصفية.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / حيوية دوري.
- `health`: تحديث لقطة صحة الـ gateway.
- `heartbeat`: تحديث دفق أحداث Heartbeat.
- `cron`: حدث تغيّر تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف الـ gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة اقتران العقدة.
- `node.invoke.request`: بث طلب استدعاء عقدة.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعدادات محفز كلمات التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة
  موافقة التنفيذ.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة
  Plugin.

### أساليب مساعدة العقدة

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية للملفات التنفيذية الخاصة بـ Skills
  من أجل عمليات التحقق التلقائية من السماح.

### أساليب مساعدة المشغّل

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب مخزون الأوامر وقت التشغيل
  لوكيل ما.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي دون الشرطة المائلة البادئة `/`
    - يعيد `native` ومسار `both` الافتراضي أسماء native المدركة للمزوّد
      عند توفرها
  - يحمل `textAliases` الأسماء المستعارة الدقيقة ذات الشرطة المائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر native المدرك للمزوّد عندما يوجد.
  - `provider` اختياري ويؤثر فقط في التسمية native وتوفر أوامر Plugin
    native.
  - يؤدي `includeArgs=false` إلى حذف بيانات الوسائط المسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب فهرس الأدوات وقت التشغيل لوكيل
  ما. وتتضمن الاستجابة أدوات مجمّعة وبيانات وصفية للمصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب
  مخزون الأدوات الفعّال وقت التشغيل لجلسة ما.
  - `sessionKey` مطلوب.
  - يستمد الـ gateway سياق وقت تشغيل موثوقًا من الجلسة من جهة الخادم بدلًا من قبول
    سياق مصادقة أو تسليم يزوّده المستدعي.
  - تكون الاستجابة مقيّدة بالجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات core وPlugin والقناة.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب
  مخزون Skills المرئي لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية، والمتطلبات المفقودة، وعمليات تحقق الإعدادات،
    وخيارات التثبيت المنقحة دون كشف القيم السرية الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) للحصول على
  بيانات الاكتشاف الوصفية لـ ClawHub.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: `{ source: "clawhub", slug, version?, force? }` يثبّت
    مجلد Skill في دليل `skills/` الخاص بمساحة عمل الوكيل الافتراضية.
  - وضع مُثبّت Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    يشغّل إجراء `metadata.openclaw.install` مُعلَنًا على مضيف الـ gateway.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يحدّث وضع ClawHub slug واحدًا متتبَّعًا أو جميع عمليات تثبيت ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يقوم وضع الإعدادات بترقيع قيم `skills.entries.<skillKey>` مثل `enabled`،
    و`apiKey`، و`env`.

## موافقات التنفيذ

- عندما يحتاج طلب تنفيذ إلى موافقة، يبث الـ gateway `exec.approval.requested`.
- يحل عملاء المشغّل ذلك عبر استدعاء `exec.approval.resolve` (يتطلب النطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` الحقل `systemRunPlan` (الحقول القياسية `argv`/`cwd`/`rawCommand`/بيانات الجلسة الوصفية). وتُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` الممررة استخدام
  `systemRunPlan` القياسي هذا باعتباره السياق المعتمد للأمر/‏`cwd`/الجلسة.
- إذا عدّل مستدعٍ `command` أو`rawCommand` أو`cwd` أو`agentId` أو
  `sessionKey` بين التحضير والتمرير النهائي الموافق عليه لـ `system.run`، فإن
  الـ gateway يرفض التشغيل بدلًا من الثقة بالحمولة المعدّلة.

## الرجوع الاحتياطي لتسليم الوكيل

- يمكن أن تتضمن طلبات `agent` الحقل `deliver=true` لطلب التسليم الصادر.
- يُبقي `bestEffortDeliver=false` السلوك الصارم: إذ تُرجع أهداف التسليم غير المحلولة أو الداخلية فقط `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع الاحتياطي إلى التنفيذ على مستوى الجلسة عندما لا يمكن حل أي مسار تسليم خارجي قابل للتسليم (مثلًا جلسات internal/webchat أو إعدادات متعددة القنوات ملتبسة).

## إصدار النسخ

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` و`maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- تُولَّد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. وهذه القيم
مستقرة عبر البروتوكول v3 وهي خط الأساس المتوقع للعملاء من الجهات الخارجية.

| الثابت | الافتراضي | المصدر |
| --- | --- | --- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| مهلة الطلب (لكل RPC) | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| مهلة ما قبل المصادقة / تحدي الاتصال | `10_000` ms | `src/gateway/handshake-timeouts.ts` (التقييد `250`–`10_000`) |
| التراجع الأولي لإعادة الاتصال | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| الحد الأقصى للتراجع لإعادة الاتصال | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| تقييد إعادة المحاولة السريعة بعد إغلاق رمز الجهاز | `250` ms | `src/gateway/client.ts` |
| مهلة السماح قبل `terminate()` في الإيقاف القسري | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| المهلة الافتراضية لـ `stopAndWait()` | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| الفاصل الزمني الافتراضي لـ tick (قبل `hello-ok`) | `30_000` ms | `src/gateway/client.ts` |
| إغلاق مهلة tick | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024` ‏(25 MB) | `src/gateway/server-constants.ts` |

يعلن الخادم عن القيم الفعالة لـ `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ ويجب على العملاء احترام هذه القيم
بدلًا من القيم الافتراضية السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة الـ gateway ذات السر المشترك `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المُهيأ.
- أوضاع حمل الهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` غير المعتمد على loopback
  تستوفي فحص مصادقة الاتصال من
  ترويسات الطلب بدلًا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` على ingress الخاص مصادقة الاتصال ذات السر المشترك
  بالكامل؛ لا تعرض هذا الوضع على ingress عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **رمز جهاز** مقيّدًا بدور الاتصال +
  النطاقات. ويُعاد في `hello-ok.auth.deviceToken` ويجب على العميل
  الاحتفاظ به للاتصالات المستقبلية.
- يجب على العملاء الاحتفاظ بالرمز الأساسي `hello-ok.auth.deviceToken` بعد أي
  اتصال ناجح.
- يجب أن تؤدي إعادة الاتصال باستخدام رمز الجهاز **المحفوظ** هذا أيضًا إلى إعادة استخدام
  مجموعة النطاقات الموافق عليها والمحفوظة لذلك الرمز. وهذا يحافظ على وصول
  القراءة/الفحص/الحالة الذي مُنح مسبقًا ويتجنب تقليص عمليات إعادة الاتصال بصمت إلى
  نطاق إداري ضمني أضيق فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - `auth.password` مستقل ويُمرَّر دائمًا عند ضبطه.
  - يُملأ `auth.token` بحسب أولوية الترتيب التالية: الرمز المشترك الصريح أولًا،
    ثم `deviceToken` صريح، ثم رمز محفوظ لكل جهاز (مفهرس بواسطة
    `deviceId` + `role`).
  - لا يُرسل `auth.bootstrapToken` إلا عندما لا يحل أي مما سبق
    قيمة `auth.token`. ويؤدي الرمز المشترك أو أي رمز جهاز محلول إلى منعه.
  - يخضع الترفيع التلقائي لرمز جهاز محفوظ في إعادة المحاولة الوحيدة
    `AUTH_TOKEN_MISMATCH` إلى **نقاط نهاية موثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبّت. ولا يُعد `wss://` العام
    دون تثبيت مؤهلًا.
- تُعد الإدخالات الإضافية `hello-ok.auth.deviceTokens` رموز تسليم تمهيد.
  احتفظ بها فقط عندما يكون الاتصال قد استخدم مصادقة التمهيد على نقل موثوق
  مثل `wss://` أو الاقتران المحلي/loopback.
- إذا زوّد العميل `deviceToken` **صريحًا** أو `scopes` صريحة، فإن
  مجموعة النطاقات التي طلبها المستدعي تبقى هي المعتمدة؛ ولا يُعاد استخدام
  النطاقات المخبأة إلا عندما يعيد العميل استخدام الرمز المحفوظ لكل جهاز.
- يمكن تدوير/إلغاء رموز الأجهزة عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب ذلك النطاق `operator.pairing`).
- يبقى إصدار/تدوير الرموز مقيّدًا بمجموعة الأدوار الموافق عليها والمُسجّلة في
  إدخال اقتران ذلك الجهاز؛ ولا يمكن أن يؤدي تدوير رمز إلى توسيع الجهاز إلى
  دور لم تمنحه موافقة الاقتران أصلًا.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون إدارة الجهاز مقيّدة بالذات ما لم يكن لدى
  المستدعي أيضًا `operator.admin`: إذ لا يمكن للمستدعين غير الإداريين إزالة/إلغاء/تدوير
  إلا إدخال جهازهم **الخاص**.
- يتحقق `device.token.rotate` أيضًا من مجموعة نطاقات المشغّل المطلوبة مقارنةً مع
  نطاقات جلسة المستدعي الحالية. ولا يمكن للمستدعين غير الإداريين تدوير رمز إلى
  مجموعة نطاقات مشغّل أوسع مما يملكونه بالفعل.
- تتضمن حالات فشل المصادقة `error.details.code` بالإضافة إلى تلميحات للاسترداد:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل عند `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة مقيّدة باستخدام رمز محفوظ لكل جهاز.
  - إذا فشلت إعادة المحاولة هذه، يجب على العملاء إيقاف حلقات إعادة الاتصال التلقائي وعرض إرشادات لاتخاذ إجراء من المشغّل.

## هوية الجهاز + الاقتران

- يجب أن تتضمن العقد هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر الـ gateways رموزًا لكل جهاز + دور.
- تتطلب معرفات الأجهزة الجديدة موافقات اقتران ما لم يكن
  القبول التلقائي المحلي مفعّلًا.
- يتمحور القبول التلقائي للاقتران حول اتصالات loopback المحلية المباشرة.
- يمتلك OpenClaw أيضًا مسار اتصال ذاتي ضيقًا محليًا على الخلفية/الحاوية
  لتدفقات المساعدات الموثوقة ذات السر المشترك.
- تظل اتصالات tailnet أو LAN على نفس المضيف تُعامل على أنها بعيدة بالنسبة إلى الاقتران
  وتتطلب موافقة.
- يجب على جميع عملاء WS تضمين هوية `device` أثناء `connect` (operator + node).
  يمكن لـ Control UI حذفها فقط في هذه الأوضاع:
  - `gateway.controlUi.allowInsecureAuth=true` من أجل توافق HTTP غير الآمن الخاص بـ localhost فقط.
  - نجاح مصادقة مشغّل Control UI في `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (خيار طوارئ، تخفيض أمني شديد).
- يجب على جميع الاتصالات توقيع nonce الخاص بـ `connect.challenge` الذي يوفّره الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` تحت `error.details.code` مع قيمة `error.details.reason` مستقرة.

أعطال الترحيل الشائعة:

| الرسالة | details.code | details.reason | المعنى |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | أغفل العميل `device.nonce` (أو أرسله فارغًا). |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | وقّع العميل باستخدام nonce قديم/خاطئ. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | حمولة التوقيع لا تطابق حمولة v2. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | الطابع الزمني الموقّع خارج نطاق الانحراف المسموح. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | لا يطابق `device.id` بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | فشل تنسيق/توحيد المفتاح العام. |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخاص بالخادم.
- أرسل nonce نفسه في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول device/client/role/scopes/token/nonce.
- تظل تواقيع `v2` القديمة مقبولة للتوافق، لكن تثبيت البيانات الوصفية للأجهزة
  المقترنة ما زال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- يدعم البروتوكول TLS لاتصالات WS.
- يمكن للعملاء اختياريًا تثبيت بصمة شهادة الـ gateway (راجع إعدادات `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو خيار CLI `--tls-fingerprint`).

## النطاق

يكشف هذا البروتوكول **واجهة API الكاملة للـ gateway** (الحالة، والقنوات، والنماذج، والدردشة،
والوكيل، والجلسات، والعقد، والموافقات، وما إلى ذلك). ويُعرَّف السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.
