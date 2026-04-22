---
read_when:
    - تنفيذ عملاء WS للـ Gateway أو تحديثهم
    - تصحيح أخطاء عدم تطابق البروتوكول أو فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول Gateway WebSocket: المصافحة، والإطارات، وإصدار النسخ'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-04-22T04:22:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# بروتوكول Gateway ‏(WebSocket)

بروتوكول WS الخاص بـ Gateway هو **مستوى التحكم الوحيد + ناقل Node** في
OpenClaw. تتصل جميع العملاء (CLI وواجهة الويب وتطبيق macOS وعُقد iOS/Android
والعُقد عديمة الواجهة) عبر WebSocket وتعلن **الدور** + **النطاق**
عند وقت المصافحة.

## النقل

- WebSocket، إطارات نصية بحمولات JSON.
- **يجب** أن يكون أول إطار طلب `connect`.

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

تكون الحقول `server` و`features` و`snapshot` و`policy` مطلوبة كلها بحسب المخطط
(`src/gateway/protocol/schema/frames.ts`). يكون `canvasHostUrl` اختياريًا. ويعرض `auth`
الدور/النطاقات المتفاوض عليها عند توفرها، ويتضمن `deviceToken`
عندما يصدره الـ gateway.

عندما لا يتم إصدار device token، يمكن أن يظل `hello-ok.auth` يعرض
الأذونات المتفاوض عليها:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

عندما يتم إصدار device token، يتضمن `hello-ok` أيضًا:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

أثناء تسليم bootstrap الموثوق، قد يتضمن `hello-ok.auth` أيضًا
إدخالات أدوار إضافية مقيّدة في `deviceTokens`:

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

في تدفق bootstrap المدمج للعقدة/المشغّل، يبقى token الأساسي للعقدة
`scopes: []` وتبقى أي token خاصة بالمشغّل تم تسليمها مقيّدة بقائمة سماح
bootstrap الخاصة بالمشغّل (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). وتظل فحوصات النطاق الخاصة بـ bootstrap
مسبوقة بالدور: لا تلبّي إدخالات المشغّل إلا طلبات المشغّل، وما زالت
الأدوار غير المشغِّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

### مثال Node

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

- **الطلب**: `{type:"req", id, method, params}`
- **الاستجابة**: `{type:"res", id, ok, payload|error}`
- **الحدث**: `{type:"event", event, payload, seq?, stateVersion?}`

تتطلب الطرق ذات التأثيرات الجانبية **مفاتيح idempotency** (راجع المخطط).

## الأدوار + النطاقات

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/UI/الأتمتة).
- `node` = مضيف القدرات (`camera`/`screen`/`canvas`/`system.run`).

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

قد تطلب طرق Gateway RPC المسجّلة بواسطة plugin نطاق operator خاصًا بها، لكن
بادئات الإدارة الأساسية المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) تُحل دائمًا إلى `operator.admin`.

نطاق الطريقة هو البوابة الأولى فقط. تطبق بعض أوامر slash التي يتم الوصول إليها
عبر `chat.send` فحوصات أشد على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب
عمليات الكتابة الدائمة في `/config set` و`/config unset` النطاق `operator.admin`.

يحتوي `node.pair.approve` أيضًا على فحص نطاق إضافي وقت الموافقة فوق
نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تحتوي أوامر Node غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

تعلن العُقد مطالبات القدرات عند وقت الاتصال:

- `caps`: فئات القدرات عالية المستوى.
- `commands`: قائمة سماح الأوامر للاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record`, `camera.capture`).

يتعامل Gateway مع هذه القيم على أنها **مطالبات** ويفرض قوائم سماح من جهة الخادم.

## الحضور

- يعرض `system-presence` إدخالات مفهرسة حسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` حتى تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **operator** و**node** معًا.

## تحديد نطاق أحداث البث

تُقيَّد أحداث البث عبر WebSocket التي يدفعها الخادم بالنطاق بحيث لا تتلقى الجلسات ذات نطاق الاقتران أو جلسات node فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) تتطلب على الأقل `operator.read`. تتخطى الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- **عمليات البث `plugin.*` المعرّفة بواسطة Plugin** تكون مقيّدة إلى `operator.write` أو `operator.admin`، وفقًا للطريقة التي سجّلها بها Plugin.
- **أحداث الحالة والنقل** (`heartbeat`, `presence`, `tick`, ودورة حياة الاتصال/قطع الاتصال، وغيرها) تبقى غير مقيّدة حتى يظلّت صحة النقل قابلة للملاحظة لكل جلسة موثّقة.
- **عائلات أحداث البث غير المعروفة** تكون مقيّدة بالنطاق افتراضيًا (فشل مغلق) ما لم يقم معالج مسجّل بتخفيف ذلك صراحةً.

يحتفظ كل اتصال عميل برقم تسلسلي خاص به لكل عميل بحيث تحافظ عمليات البث على ترتيب تصاعدي على ذلك المقبس حتى عندما ترى عملاء مختلفون مجموعات فرعية مختلفة من تدفق الأحداث بعد تصفيتها بحسب النطاق.

## عائلات طرق RPC الشائعة

هذه الصفحة ليست تفريغًا مولدًا كاملًا، لكن سطح WS العام أوسع
من أمثلة المصافحة/المصادقة أعلاه. هذه هي عائلات الطرق الرئيسية التي
يعرضها Gateway اليوم.

تمثّل `hello-ok.features.methods` قائمة اكتشاف متحفظة مبنية من
`src/gateway/server-methods-list.ts` بالإضافة إلى صادرات طرق plugin/channel المحمّلة.
تعامل معها على أنها لاكتشاف الميزات، لا كتفريغ مولد لكل مساعد قابل للاستدعاء
مطبّق في `src/gateway/server-methods/*.ts`.

### النظام والهوية

- يعرض `health` لقطة صحة gateway المخبأة أو المفحوصة حديثًا.
- يعرض `status` ملخص gateway على نمط `/status`؛ وتُضمَّن الحقول الحساسة
  فقط لعملاء operator ذوي نطاق الإدارة.
- يعرض `gateway.identity.get` هوية جهاز gateway المستخدمة في relay
  وتدفقات الاقتران.
- يعرض `system-presence` لقطة الحضور الحالية للأجهزة المتصلة من نوع
  operator/node.
- يضيف `system-event` حدث نظام ويمكنه تحديث/بث
  سياق الحضور.
- يعرض `last-heartbeat` أحدث حدث Heartbeat محفوظ.
- يبدّل `set-heartbeats` معالجة Heartbeat على الـ gateway.

### النماذج والاستخدام

- يعرض `models.list` فهرس النماذج المسموح بها في وقت التشغيل.
- يعرض `usage.status` نوافذ استخدام المزوّد/ملخصات الحصة المتبقية.
- يعرض `usage.cost` ملخصات استخدام التكلفة المجمعة لنطاق تاريخ.
- يعرض `doctor.memory.status` جاهزية الذاكرة المتجهية / التضمين لمساحة عمل
  الوكيل الافتراضي النشطة.
- يعرض `sessions.usage` ملخصات الاستخدام لكل جلسة.
- يعرض `sessions.usage.timeseries` استخدام السلاسل الزمنية لجلسة واحدة.
- يعرض `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

### القنوات ومساعدات تسجيل الدخول

- يعرض `channels.status` ملخصات حالة القنوات/الـ plugin المدمجة والمرفقة.
- يقوم `channels.logout` بتسجيل الخروج من قناة/حساب محدد عندما
  تدعم القناة تسجيل الخروج.
- يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لمزوّد قنوات الويب الحالي القادر على QR.
- ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ
  القناة عند النجاح.
- يرسل `push.test` إشعار APNs تجريبيًا إلى iOS Node مسجّلة.
- يعرض `voicewake.get` محفزات كلمة التنبيه المخزنة.
- يحدّث `voicewake.set` محفزات كلمة التنبيه ويبث التغيير.

### المراسلة والسجلات

- يمثّل `send` طريقة RPC مباشرة للتسليم الصادر لعمليات الإرسال الموجّهة
  إلى قناة/حساب/سلسلة خارج مشغّل الدردشة.
- يعرض `logs.tail` ذيل سجل ملفات gateway المكوَّن مع عناصر التحكم بالمؤشر/الحد
  والحد الأقصى للبايتات.

### Talk وTTS

- يعرض `talk.config` حمولة تكوين Talk الفعالة؛ ويتطلب `includeSecrets`
  النطاق `operator.talk.secrets` (أو `operator.admin`).
- يضبط `talk.mode` حالة Talk الحالية لوضع WebChat/Control UI
  ويبثها.
- يقوم `talk.speak` بتركيب الكلام عبر مزوّد كلام Talk النشط.
- يعرض `tts.status` حالة تفعيل TTS والمزوّد النشط ومزوّدي التراجع
  وحالة تكوين المزوّد.
- يعرض `tts.providers` فهرس مزوّدي TTS المرئي.
- يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
- يحدّث `tts.setProvider` مزوّد TTS المفضّل.
- ينفّذ `tts.convert` تحويل نص إلى كلام لمرة واحدة.

### الأسرار والتكوين والتحديث والمعالج

- يعيد `secrets.reload` حل SecretRefs النشطة ويستبدل حالة الأسرار في وقت التشغيل
  فقط عند النجاح الكامل.
- يحل `secrets.resolve` تعيينات الأسرار المستهدفة بالأوامر لمجموعة أوامر/أهداف محددة.
- يعرض `config.get` لقطة التكوين الحالية والتجزئة.
- يكتب `config.set` حمولة تكوين تم التحقق منها.
- يدمج `config.patch` تحديث تكوين جزئي.
- يتحقق `config.apply` من حمولة التكوين الكاملة ويستبدلها.
- يعرض `config.schema` حمولة مخطط التكوين الحي المستخدم من Control UI وأدوات
  CLI: المخطط و`uiHints` والإصدار وبيانات التوليد الوصفية، بما في
  ذلك بيانات مخطط plugin + channel الوصفية عندما يستطيع وقت التشغيل تحميلها. ويتضمن المخطط
  بيانات الحقل `title` / `description` المشتقة من نفس التسميات
  ونصوص المساعدة المستخدمة في الواجهة، بما في ذلك الكائنات المتداخلة، وwildcard، وعناصر المصفوفة،
  وفروع التركيب `anyOf` / `oneOf` / `allOf` عندما توجد وثائق
  مطابقة للحقل.
- يعرض `config.schema.lookup` حمولة بحث محددة بالمسار لمسار تكوين
  واحد: المسار المطبّع، وعقدة مخطط سطحية، والتلميح المطابق + `hintPath`، وملخصات الأبناء
  المباشرين للتدرج في UI/CLI.
  - تحتفظ عقد مخطط البحث بالوثائق المواجهة للمستخدم وحقول التحقق الشائعة:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    وحدود الأرقام/السلاسل/المصفوفات/الكائنات، والأعلام المنطقية مثل
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - تعرض ملخصات الأبناء `key`، و`path` المطبّع، و`type`، و`required`,
    و`hasChildren`، بالإضافة إلى `hint` / `hintPath` المطابق.
- يشغّل `update.run` تدفق تحديث gateway ويجدول إعادة تشغيل فقط عندما
  ينجح التحديث نفسه.
- تعرض `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel`
  معالج الإعداد الأولي عبر WS RPC.

### العائلات الرئيسية الحالية

#### الوكيل ومساعدات مساحة العمل

- يعرض `agents.list` إدخالات الوكلاء المكوّنة.
- تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء
  وربط مساحة العمل.
- تدير `agents.files.list` و`agents.files.get` و`agents.files.set`
  ملفات مساحة العمل الأساسية المعروضة لوكيل.
- يعرض `agent.identity.get` هوية المساعد الفعالة لوكيل أو
  جلسة.
- ينتظر `agent.wait` انتهاء التشغيل ويعيد اللقطة النهائية عند
  توفرها.

#### التحكم في الجلسة

- يعرض `sessions.list` فهرس الجلسات الحالي.
- تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسة
  لعميل WS الحالي.
- تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe`
  اشتراكات أحداث النصوص/الرسائل لجلسة واحدة.
- يعرض `sessions.preview` معاينات نصوص محدودة لمفاتيح جلسات
  محددة.
- يقوم `sessions.resolve` بحل أو توحيد هدف جلسة.
- ينشئ `sessions.create` إدخال جلسة جديدة.
- يرسل `sessions.send` رسالة إلى جلسة موجودة.
- يمثّل `sessions.steer` صيغة المقاطعة وإعادة التوجيه لجلسة
  نشطة.
- يجهض `sessions.abort` العمل النشط لجلسة.
- يحدّث `sessions.patch` بيانات الجلسة الوصفية/التجاوزات.
- تنفّذ `sessions.reset` و`sessions.delete` و`sessions.compact`
  صيانة الجلسة.
- يعرض `sessions.get` صف الجلسة المخزّن الكامل.
- ما زال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و
  `chat.abort` و`chat.inject`.
- يتم تطبيع `chat.history` للعرض لعملاء UI: حيث تتم إزالة وسوم التوجيه المضمنة من
  النص المرئي، كما تتم إزالة حمولات XML الخاصة باستدعاء الأدوات بالنص العادي
  (بما في ذلك `<tool_call>...</tool_call>`،
  و`<function_call>...</function_call>`،
  و`<tool_calls>...</tool_calls>`،
  و`<function_calls>...</function_calls>`،
  وكتل استدعاء الأدوات المبتورة) وكذلك رموز التحكم الخاصة بالنموذج المتسربة
  بصيغة ASCII/العرض الكامل، ويتم حذف صفوف المساعد التي تحتوي فقط على
  رموز صامتة مثل `NO_REPLY` / `no_reply` حرفيًا، وقد تُستبدل
  الصفوف الكبيرة جدًا بعناصر نائبة.

#### اقتران الأجهزة وdevice tokens

- يعرض `device.pair.list` الأجهزة المقترنة المعلقة والموافق عليها.
- تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove`
  سجلات اقتران الأجهزة.
- يقوم `device.token.rotate` بتدوير device token لجهاز مقترن ضمن
  حدود دوره ونطاقه الموافق عليهما.
- يقوم `device.token.revoke` بإبطال device token لجهاز مقترن.

#### اقتران Node والاستدعاء والعمل المعلق

- تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve`،
  و`node.pair.reject`، و`node.pair.verify` اقتران Node والتحقق من
  bootstrap.
- يعرض `node.list` و`node.describe` حالة Node المعروفة/المتصلة.
- يحدّث `node.rename` تسمية Node مقترنة.
- يمرر `node.invoke` أمرًا إلى Node متصلة.
- يعرض `node.invoke.result` نتيجة طلب استدعاء.
- يحمل `node.event` الأحداث الصادرة من Node مرة أخرى إلى gateway.
- يحدّث `node.canvas.capability.refresh` رموز canvas-capability
  المقيّدة بالنطاق.
- تمثل `node.pending.pull` و`node.pending.ack` واجهات API لطابور العمل
  للعقد المتصلة.
- تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق
  المتين للعقد غير المتصلة/المنفصلة.

#### عائلات الموافقات

- تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و
  `exec.approval.resolve` طلبات موافقة exec لمرة واحدة بالإضافة إلى
  البحث/إعادة التشغيل للموافقات المعلقة.
- ينتظر `exec.approval.waitDecision` قرار موافقة exec معلقة واحدة ويعيد
  القرار النهائي (أو `null` عند انتهاء المهلة).
- تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقات exec
  في gateway.
- تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقات exec
  المحلية للعقدة عبر أوامر relay الخاصة بـ node.
- تغطي `plugin.approval.request` و`plugin.approval.list`،
  و`plugin.approval.waitDecision`، و`plugin.approval.resolve`
  تدفقات الموافقات المعرّفة بواسطة Plugin.

#### عائلات رئيسية أخرى

- الأتمتة:
  - يقوم `wake` بجدولة حقن نص تنبيه فوري أو عند Heartbeat التالي
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/الأدوات: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة UI مثل `chat.inject` وأحداث
  الدردشة الخاصة بالنص فقط.
- `session.message` و`session.tool`: تحديثات النص/تدفق الأحداث
  لجلسة مشترَك بها.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها الوصفية.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / حيوية دوري.
- `health`: تحديث لقطة صحة gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيّر تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف تشغيل gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة اقتران Node.
- `node.invoke.request`: بث طلب استدعاء Node.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر تكوين محفز كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة
  موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة
  موافقة Plugin.

### طرق المساعدة الخاصة بـ Node

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية للملفات التنفيذية لـ Skills
  من أجل فحوصات السماح التلقائي.

### طرق المساعدة الخاصة بـ operator

- يمكن لعملاء operator استدعاء `commands.list` (`operator.read`) لجلب فهرس الأوامر
  في وقت التشغيل لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعرض `text` رمز الأمر النصي الأساسي من دون الشرطة المائلة `/`
    - يعرض `native` والمسار الافتراضي `both` الأسماء الأصلية
      الواعية بالمزوّد عند توفرها
  - يحمل `textAliases` الأسماء المستعارة الدقيقة المسبوقة بشرطة مائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي الواعي بالمزوّد عند وجوده.
  - يكون `provider` اختياريًا ويؤثر فقط على التسمية الأصلية بالإضافة إلى
    توفر أوامر Plugin الأصلية.
  - يؤدي `includeArgs=false` إلى حذف بيانات الوسائط المتسلسلة من الاستجابة.
- يمكن لعملاء operator استدعاء `tools.catalog` (`operator.read`) لجلب فهرس الأدوات في وقت التشغيل
  لوكيل. تتضمن الاستجابة أدوات مجمعة وبيانات وصفية للمصدر:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما تكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن لعملاء operator استدعاء `tools.effective` (`operator.read`) لجلب فهرس الأدوات
  الفعالة في وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يستمد gateway سياق وقت التشغيل الموثوق من الجلسة على جانب الخادم بدلًا من قبول
    سياق المصادقة أو التسليم المزوّد من المستدعي.
  - تكون الاستجابة مقيّدة بنطاق الجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات core وPlugin والقنوات.
- يمكن لعملاء operator استدعاء `skills.status` (`operator.read`) لجلب فهرس
  Skills المرئية لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات المفقودة وفحوصات التكوين
    وخيارات التثبيت المنقحة من دون كشف القيم السرية الخام.
- يمكن لعملاء operator استدعاء `skills.search` و`skills.detail` (`operator.read`)
  للحصول على بيانات اكتشاف ClawHub الوصفية.
- يمكن لعملاء operator استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: `{ source: "clawhub", slug, version?, force? }` يثبّت
    مجلد Skill داخل الدليل `skills/` لمساحة عمل الوكيل الافتراضية.
  - وضع مُثبّت Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    يشغّل إجراء `metadata.openclaw.install` مُعلَنًا على مضيف gateway.
- يمكن لعملاء operator استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يحدّث وضع ClawHub slug واحدًا متتبعًا أو جميع تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يقوم وضع التكوين بترقيع قيم `skills.entries.<skillKey>` مثل `enabled`,
    و`apiKey`، و`env`.

## موافقات exec

- عندما يحتاج طلب exec إلى موافقة، يبث gateway الحدث `exec.approval.requested`.
- يحل عملاء operator ذلك عبر استدعاء `exec.approval.resolve` (يتطلب النطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` القيمة `systemRunPlan` (القيم المعيارية `argv`/`cwd`/`rawCommand`/بيانات الجلسة الوصفية). يتم رفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المُمرّرة استخدام
  `systemRunPlan` المعياري هذا كسياق موثوق للأمر/`cwd`/الجلسة.
- إذا قام مستدعٍ بتعديل `command` أو`rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير وتمرير `system.run` النهائي الموافق عليه، فإن
  gateway يرفض التشغيل بدلًا من الوثوق بالحمولة المعدّلة.

## تراجع تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب تسليم صادر.
- تحافظ `bestEffortDeliver=false` على السلوك الصارم: فالأهداف غير القابلة للحل أو الداخلية فقط تعيد `INVALID_REQUEST`.
- تسمح `bestEffortDeliver=true` بالتراجع إلى التنفيذ على مستوى الجلسة فقط عندما لا يمكن حل أي مسار تسليم خارجي (على سبيل المثال جلسات داخلية/ويب شات أو إعدادات متعددة القنوات ملتبسة).

## إصدار النسخ

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- يتم توليد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. القيم
مستقرة عبر البروتوكول v3 وهي خط الأساس المتوقع للعملاء من الأطراف الثالثة.

| الثابت | الافتراضي | المصدر |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| مهلة الطلب (لكل RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| مهلة ما قبل المصادقة / تحدي الاتصال       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (التقييد `250`–`10_000`) |
| التراجع الأولي لإعادة الاتصال                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| الحد الأقصى لتراجع إعادة الاتصال                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| تقييد إعادة المحاولة السريعة بعد إغلاق device token | `250` ms                                              | `src/gateway/client.ts`                                    |
| مهلة السماح قبل `terminate()` عند الإيقاف القسري     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| المهلة الافتراضية لـ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| الفاصل الافتراضي لـ tick (قبل `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| إغلاق مهلة tick                        | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

يعلن الخادم عن القيم الفعالة `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ ويجب على العملاء الالتزام بهذه القيم
بدلًا من القيم الافتراضية السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة gateway بالمفتاح السري المشترك القيمة `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المكوَّن.
- الأنماط الحاملة للهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` غير المرتبط بـ loopback تُلبّي فحص مصادقة الاتصال
  من رؤوس الطلب بدلًا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` الخاص بالإدخال الخاص مصادقة الاتصال بالمفتاح المشترك
  بالكامل؛ ولا تعرض هذا الوضع على إدخال عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **device token** مقيّدًا بدور الاتصال + نطاقاته. ويُعاد في
  `hello-ok.auth.deviceToken` ويجب أن يحفظه العميل للاتصالات المستقبلية.
- يجب على العملاء حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- يجب أن تؤدي إعادة الاتصال باستخدام **device token** **المحفوظ** هذا أيضًا إلى إعادة استخدام
  مجموعة النطاقات الموافق عليها المخزنة لذلك الرمز. هذا يحافظ على صلاحيات
  القراءة/الفحص/الحالة التي مُنحت مسبقًا ويمنع تقلص عمليات إعادة الاتصال بصمت إلى
  نطاق ضمني أضيق يقتصر على الإدارة فقط.
- تجميع مصادقة الاتصال من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - الحقل `auth.password` متعامد ويُمرَّر دائمًا عند ضبطه.
  - يُملأ `auth.token` بترتيب الأولوية: أولًا الرمز المشترك الصريح،
    ثم `deviceToken` صريح، ثم رمز محفوظ لكل جهاز (مفهرس حسب
    `deviceId` + `role`).
  - لا يُرسل `auth.bootstrapToken` إلا عندما لا يحل أي مما سبق
    قيمة `auth.token`. يؤدي الرمز المشترك أو أي device token محلول إلى كبت إرساله.
  - تكون الترقية التلقائية لـ device token محفوظ عند إعادة المحاولة
    الوحيدة `AUTH_TOKEN_MISMATCH` مقيّدة إلى **نقاط نهاية موثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبّت. لا يُعد `wss://` العام
    من دون تثبيت مؤهلًا.
- الإدخالات الإضافية `hello-ok.auth.deviceTokens` هي رموز تسليم bootstrap.
  احفظها فقط عندما يستخدم الاتصال مصادقة bootstrap على نقل موثوق
  مثل `wss://` أو loopback/الاقتران المحلي.
- إذا قدّم عميل `deviceToken` **صريحًا** أو `scopes` صريحة،
  فإن مجموعة النطاقات المطلوبة من المستدعي تظل هي المرجع المعتمد؛ ولا تُعاد
  استخدام النطاقات المخبأة إلا عندما يعيد العميل استخدام الرمز المحفوظ لكل جهاز.
- يمكن تدوير/إبطال device tokens عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب ذلك النطاق `operator.pairing`).
- يبقى إصدار/تدوير الرموز مقيّدًا بمجموعة الأدوار الموافق عليها والمسجلة في
  إدخالة اقتران ذلك الجهاز؛ ولا يمكن لتدوير رمز أن يوسّع الجهاز إلى
  دور لم تمنحه موافقة الاقتران أصلًا.
- بالنسبة لجلسات رموز الأجهزة المقترنة، تكون إدارة الأجهزة مقيّدة ذاتيًا ما لم يكن لدى
  المستدعي أيضًا `operator.admin`: لا يمكن للمستدعين غير الإداريين إزالة/إبطال/تدوير
  سوى إدخالة أجهزتهم **الخاصة**.
- يتحقق `device.token.rotate` أيضًا من مجموعة نطاقات operator المطلوبة مقابل
  نطاقات الجلسة الحالية للمستدعي. ولا يمكن للمستدعين غير الإداريين تدوير رمز إلى
  مجموعة نطاقات operator أوسع مما يملكونه بالفعل.
- تتضمن حالات فشل المصادقة القيمة `error.details.code` بالإضافة إلى
  تلميحات للتعافي:
  - `error.details.canRetryWithDeviceToken` (منطقي)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- سلوك العميل عند `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة مقيّدة باستخدام رمز محفوظ لكل جهاز.
  - إذا فشلت إعادة المحاولة هذه، فيجب على العملاء إيقاف حلقات إعادة الاتصال التلقائية وعرض إرشادات الإجراء للمشغّل.

## هوية الجهاز + الاقتران

- يجب أن تتضمن Nodes هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزًا لكل جهاز + دور.
- تتطلب موافقات الاقتران معرّفات أجهزة جديدة ما لم يكن تمكين الموافقة
  المحلية التلقائية مفعّلًا.
- تتمحور الموافقة التلقائية على الاقتران حول اتصالات local loopback المباشرة.
- يمتلك OpenClaw أيضًا مسار اتصال ذاتي ضيقًا محليًا على مستوى الخلفية/الحاوية
  لتدفقات المساعدات الموثوقة بالمفتاح المشترك.
- لا تزال اتصالات tailnet أو LAN على نفس المضيف تُعامل على أنها بعيدة فيما يتعلق بالاقتران
  وتتطلب موافقة.
- يجب على جميع عملاء WS تضمين هوية `device` أثناء `connect` (operator + node).
  يمكن لـ Control UI حذفها فقط في هذه الأوضاع:
  - `gateway.controlUi.allowInsecureAuth=true` من أجل توافق HTTP غير الآمن على localhost فقط.
  - نجاح مصادقة operator في `gateway.auth.mode: "trusted-proxy"` لـ Control UI.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (كسر زجاج، خفض أمني شديد).
- يجب أن توقّع جميع الاتصالات قيمة nonce الخاصة بـ `connect.challenge` التي يوفّرها الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة للعملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، تعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` تحت `error.details.code` مع قيمة ثابتة في `error.details.reason`.

إخفاقات الترحيل الشائعة:

| الرسالة | details.code | details.reason | المعنى |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسله فارغًا). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديمة/خاطئة. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | حمولة التوقيع لا تطابق حمولة v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقّع خارج حدود الانحراف المسموح بها. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | لا يطابق `device.id` بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/توحيد المفتاح العام. |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخاصة بالخادم.
- أرسل nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- لا تزال تواقيع `v2` القديمة مقبولة للتوافق، لكن تثبيت بيانات
  الجهاز المقترن الوصفية يظل يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريًا تثبيت بصمة شهادة gateway (راجع تكوين `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو خيار CLI ‏`--tls-fingerprint`).

## النطاق

يكشف هذا البروتوكول **واجهة API الكاملة للـ gateway** (الحالة، القنوات، النماذج، الدردشة،
الوكيل، الجلسات، Nodes، الموافقات، إلخ). ويتم تحديد السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.
