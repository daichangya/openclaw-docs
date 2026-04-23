---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - تصحيح أخطاء عدم تطابق البروتوكول أو فشل الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول Gateway WebSocket: المصافحة، والإطارات، والإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-04-23T07:25:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# بروتوكول Gateway (WebSocket)

بروتوكول Gateway WS هو **طبقة التحكم الوحيدة + ناقل العقد** في
OpenClaw. تتصل جميع العملاء (CLI وواجهة الويب وتطبيق macOS وعُقد iOS/Android
والعُقد عديمة الواجهة) عبر WebSocket وتعلن **الدور** + **النطاق**
عند وقت المصافحة.

## النقل

- WebSocket، وإطارات نصية بحمولة JSON.
- **يجب** أن يكون أول إطار طلب `connect`.
- تُحدَّد الإطارات قبل الاتصال بحد أقصى 64 KiB. وبعد نجاح المصافحة، ينبغي على العملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. وعند تفعيل التشخيصات،
  تصدر الإطارات الواردة الكبيرة جدًا والمخازن المؤقتة الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق Gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام والحدود والأسطح وأكواد الأسباب الآمنة. ولا تحتفظ
  بنص الرسالة أو محتويات المرفقات أو نص الإطار الخام أو tokens أو cookies أو القيم السرية.

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

تكون الحقول `server` و`features` و`snapshot` و`policy` كلها مطلوبة حسب المخطط
(`src/gateway/protocol/schema/frames.ts`). والحقل `canvasHostUrl` اختياري. ويُبلغ `auth`
عن الدور/النطاقات المتفاوض عليها عند توفرها، ويتضمن `deviceToken`
عندما يصدر Gateway واحدًا.

عندما لا يُصدر device token، يمكن أن يظل `hello-ok.auth` يبلّغ
عن الأذونات المتفاوض عليها:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

وعندما يُصدر device token، يتضمن `hello-ok` أيضًا:

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
إدخالات أدوار إضافية محدودة في `deviceTokens`:

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

في تدفق bootstrap المضمّن للعقدة/المشغّل، يبقى token العقدة الأساسي
`scopes: []` وتبقى أي operator token مسلَّمة مقيدة بقائمة السماح الخاصة بمشغّل bootstrap
(`operator.approvals` و`operator.read` و
`operator.talk.secrets` و`operator.write`). وتظل فحوصات نطاق bootstrap
مسبوقة بالدور: إدخالات operator لا تلبي إلا طلبات operator، وما زالت الأدوار
غير operator تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

### مثال لعقدة

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

تتطلب الأساليب ذات الآثار الجانبية **مفاتيح idempotency** (راجع المخطط).

## الأدوار + النطاقات

### الأدوار

- `operator` = عميل طبقة التحكم (CLI/UI/automation).
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

قد تطلب أساليب Gateway RPC المسجلة بواسطة Plugin نطاق operator خاصًا بها، لكن
البوادئ الأساسية الإدارية المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*` و
`update.*`) تُحل دائمًا إلى `operator.admin`.

يُعد نطاق الأسلوب البوابة الأولى فقط. فبعض أوامر slash التي تصل عبر
`chat.send` تطبق فحوصات على مستوى الأمر أكثر صرامة فوق ذلك. فعلى سبيل المثال، تتطلب
عمليات الكتابة الدائمة `/config set` و`/config unset` النطاق `operator.admin`.

ويمتلك `node.pair.approve` أيضًا فحص نطاق إضافيًا وقت الموافقة فوق
نطاق الأسلوب الأساسي:

- الطلبات من دون أوامر: `operator.pairing`
- الطلبات التي تحتوي أوامر عقدة غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

تعلن العقد عن مطالبات القدرات وقت الاتصال:

- `caps`: فئات القدرات عالية المستوى.
- `commands`: قائمة السماح للأوامر الخاصة بالاستدعاء.
- `permissions`: مفاتيح تشغيل/إيقاف دقيقة (مثل `screen.record` و`camera.capture`).

يعامل Gateway هذه على أنها **مطالبات** ويفرض قوائم السماح على جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بحسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` حتى تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بصفته **operator** و**node** معًا.

## تقييد نطاق أحداث البث

تُقيَّد أحداث البث المدفوعة من الخادم عبر WebSocket بالنطاق حتى لا تتلقى الجلسات ذات نطاق pairing أو جلسات node فقط محتوى الجلسة بصورة سلبية.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) تتطلب على الأقل `operator.read`. وتتجاوز الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- تُقيَّد **أحداث البث `plugin.*` المعرّفة بواسطة Plugin** بالنطاق `operator.write` أو `operator.admin`، حسب كيفية تسجيل Plugin لها.
- تظل **أحداث الحالة والنقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/الانفصال، إلخ) غير مقيّدة حتى تظل صحة النقل قابلة للملاحظة لكل جلسة موثقة.
- تُقيَّد **عائلات أحداث البث غير المعروفة** بالنطاق افتراضيًا (فشل مغلق) ما لم يخفف معالج مسجل ذلك صراحة.

تحتفظ كل وصلة عميل برقم تسلسل خاص بها لكل عميل بحيث تحافظ عمليات البث على الترتيب التصاعدي على ذلك المقبس حتى عندما ترى عملاء مختلفون مجموعات فرعية مختلفة من مجرى الأحداث تم ترشيحها بالنطاق.

## عائلات أساليب RPC الشائعة

هذه الصفحة ليست تفريغًا مولدًا كاملًا، لكن سطح WS العام أوسع
من أمثلة المصافحة/المصادقة أعلاه. وهذه هي عائلات الأساليب الرئيسية التي
يكشفها Gateway اليوم.

يمثل `hello-ok.features.methods` قائمة اكتشاف متحفظة مبنية من
`src/gateway/server-methods-list.ts` بالإضافة إلى صادرات methods الخاصة بالـ Plugin/القناة المحملة.
تعامل معها على أنها لاكتشاف الميزات، لا على أنها تفريغ مولد لكل مساعد قابل للاستدعاء
منفذ في `src/gateway/server-methods/*.ts`.

### النظام والهوية

- يعيد `health` لقطة سلامة Gateway المخبأة أو التي أُجري لها probe حديثًا.
- يعيد `diagnostics.stability` مسجل ثبات تشخيصي محدودًا حديثًا.
  وهو يحتفظ ببيانات تشغيل وصفية مثل أسماء الأحداث والأعداد وأحجام
  البايت وقراءات الذاكرة وحالة الطابور/الجلسة وأسماء القنوات/Plugins ومعرّفات الجلسات.
  ولا يحتفظ بنص الدردشة أو أجسام Webhook أو مخرجات الأدوات أو أجسام الطلبات أو
  الاستجابات الخام أو tokens أو cookies أو القيم السرية. ويلزم نطاق operator read.
- يعيد `status` ملخص Gateway بأسلوب `/status`؛ وتُضمَّن الحقول الحساسة
  فقط لعملاء operator ذوي النطاق الإداري.
- يعيد `gateway.identity.get` هوية جهاز Gateway المستخدمة بواسطة تدفقات relay و
  pairing.
- يعيد `system-presence` لقطة الحضور الحالية للأجهزة operator/node
  المتصلة.
- يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق
  الحضور.
- يعيد `last-heartbeat` أحدث حدث Heartbeat مستمر.
- يبدّل `set-heartbeats` معالجة Heartbeat على Gateway.

### النماذج والاستخدام

- يعيد `models.list` كتالوج النماذج المسموح بها وقت التشغيل.
- يعيد `usage.status` ملخصات نوافذ استخدام provider/الحصة المتبقية.
- يعيد `usage.cost` ملخصات استخدام التكلفة المجمعة لنطاق تاريخ.
- يعيد `doctor.memory.status` جاهزية vector-memory / embedding لمساحة عمل
  الوكيل الافتراضي النشط.
- يعيد `sessions.usage` ملخصات الاستخدام لكل جلسة.
- يعيد `sessions.usage.timeseries` سلسلة زمنية للاستخدام لجلسة واحدة.
- يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.

### القنوات ومساعدات تسجيل الدخول

- يعيد `channels.status` ملخصات حالة القنوات/Plugins المضمّنة والمجمّعة.
- يسجل `channels.logout` الخروج من قناة/حساب محدد حيث تدعم القناة
  تسجيل الخروج.
- يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب للقناة الحالية في الويب
  القادرة على QR.
- ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب ذلك ويبدأ
  القناة عند النجاح.
- يرسل `push.test` دفعة APNs اختبارية إلى عقدة iOS مسجلة.
- يعيد `voicewake.get` محفزات wake-word المخزنة.
- يحدّث `voicewake.set` محفزات wake-word ويبث التغيير.

### المراسلة والسجلات

- `send` هو RPC التسليم الصادر المباشر للإرسال الموجه إلى
  channel/account/thread خارج مشغل الدردشة.
- يعيد `logs.tail` ذيل سجل ملفات Gateway المُكوَّن مع أدوات تحكم في المؤشر/الحد
  والحد الأقصى للبايتات.

### Talk وTTS

- يعيد `talk.config` حمولة تكوين Talk الفعالة؛ ويتطلب `includeSecrets`
  النطاق `operator.talk.secrets` (أو `operator.admin`).
- يضبط `talk.mode` حالة وضع Talk الحالية ويبثها لعملاء WebChat/Control UI.
- يولد `talk.speak` كلامًا عبر مزود الكلام النشط في Talk.
- يعيد `tts.status` حالة تمكين TTS والمزود النشط وموفري fallback
  وحالة تكوين provider.
- يعيد `tts.providers` مخزون موفري TTS المرئي.
- يبدّل `tts.enable` و`tts.disable` حالة تفضيلات TTS.
- يحدّث `tts.setProvider` مزود TTS المفضل.
- يشغّل `tts.convert` تحويل نص إلى كلام لمرة واحدة.

### الأسرار والتكوين والتحديث والمعالج

- يقوم `secrets.reload` بإعادة حل SecretRefs النشطة ويبدّل حالة الأسرار وقت التشغيل
  فقط عند النجاح الكامل.
- يقوم `secrets.resolve` بحل إسنادات الأسرار المستهدفة بالأوامر لمجموعة
  command/target محددة.
- يعيد `config.get` لقطة التكوين الحالية وhash الخاص بها.
- يكتب `config.set` حمولة تكوين تم التحقق منها.
- يدمج `config.patch` تحديث تكوين جزئيًا.
- يقوم `config.apply` بالتحقق من حمولة التكوين الكاملة + استبدالها.
- يعيد `config.schema` حمولة مخطط التكوين الحي المستخدمة بواسطة Control UI و
  أدوات CLI: المخطط، و`uiHints`، والإصدار، وبيانات التوليد الوصفية، بما في ذلك
  بيانات مخطط Plugin + القناة الوصفية عندما يتمكن وقت التشغيل من تحميلها. ويتضمن المخطط
  بيانات `title` / `description` الوصفية للحقول المستمدة من التسميات نفسها
  ونصوص المساعدة المستخدمة في UI، بما في ذلك فروع الكائنات المتداخلة والبدائل العامة وعناصر المصفوفات
  وتركيبات `anyOf` / `oneOf` / `allOf` عند وجود
  توثيق حقول مطابق.
- يعيد `config.schema.lookup` حمولة lookup مقيّدة بالمسار لمسار تكوين
  واحد: المسار المطبع، وعقدة مخطط سطحية، وhint المطابق + `hintPath`،
  وملخصات الأبناء المباشرين من أجل التعمق في UI/CLI.
  - تحتفظ عقد lookup في المخطط بالوثائق الموجهة للمستخدم وحقول التحقق الشائعة:
    `title` و`description` و`type` و`enum` و`const` و`format` و`pattern`،
    وحدود الأرقام/السلاسل/المصفوفات/الكائنات، والأعلام المنطقية مثل
    `additionalProperties` و`deprecated` و`readOnly` و`writeOnly`.
  - تعرض ملخصات الأبناء القيم `key` و`path` المطبع و`type` و`required` و
    `hasChildren`، بالإضافة إلى `hint` / `hintPath` المطابقين.
- يشغّل `update.run` تدفق تحديث Gateway ويجدول إعادة تشغيل فقط عندما
  ينجح التحديث نفسه.
- تكشف `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel`
  معالج الإعداد الأولي عبر WS RPC.

### العائلات الرئيسية الموجودة

#### مساعدات الوكيل ومساحة العمل

- يعيد `agents.list` إدخالات الوكلاء المُكوَّنين.
- تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكلاء و
  ربط مساحة العمل.
- تدير `agents.files.list` و`agents.files.get` و`agents.files.set`
  ملفات مساحة العمل الأولية المكشوفة لوكيل.
- يعيد `agent.identity.get` هوية المساعد الفعالة لوكيل أو
  جلسة.
- ينتظر `agent.wait` انتهاء تشغيل ويعيد اللقطة النهائية عند
  توفرها.

#### التحكم في الجلسة

- يعيد `sessions.list` فهرس الجلسات الحالي.
- تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيّر الجلسات
  لعميل WS الحالي.
- تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe`
  اشتراكات أحداث النصوص/الرسائل لجلسة واحدة.
- يعيد `sessions.preview` معاينات نصية محدودة لجلسات
  محددة.
- يحل `sessions.resolve` هدف الجلسة أو يحوله إلى صورة قانونية.
- ينشئ `sessions.create` إدخال جلسة جديدًا.
- يرسل `sessions.send` رسالة إلى جلسة موجودة.
- يمثل `sessions.steer` متغير المقاطعة وإعادة التوجيه لجلسة نشطة.
- يجهض `sessions.abort` العمل النشط لجلسة.
- يحدّث `sessions.patch` بيانات الجلسة الوصفية/التجاوزات.
- تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact`
  أعمال صيانة الجلسة.
- يعيد `sessions.get` صف الجلسة المخزن كاملًا.
- ما يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و
  `chat.inject`.
- يُطبَّع `chat.history` للعرض لعملاء UI: إذ تُزال وسوم التوجيه المضمنة من
  النص المرئي، وتُزال حمولة XML الخاصة باستدعاء الأدوات في النص العادي (بما في ذلك
  `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و
  `<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` و
  كتل استدعاء الأدوات المبتورة) وكذلك tokens التحكم الخاصة بالنموذج
  المسربة بنمط ASCII/العرض الكامل، وتُحذف صفوف المساعد المكوّنة بالكامل من tokens الصامتة
  مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف الكبيرة جدًا بعناصر نائبة.

#### إقران الأجهزة وdevice tokens

- يعيد `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
- تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove`
  سجلات إقران الأجهزة.
- يقوم `device.token.rotate` بتدوير device token لجهاز مقترن ضمن حدود
  الدور والنطاق المعتمدين.
- يقوم `device.token.revoke` بإلغاء device token لجهاز مقترن.

#### إقران العقدة والاستدعاء والعمل المعلق

- تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و
  `node.pair.reject` و`node.pair.verify` إقران العقدة والتحقق من
  bootstrap.
- تعيد `node.list` و`node.describe` حالة العقد المعروفة/المتصلة.
- يحدّث `node.rename` تسمية عقدة مقترنة.
- يمرر `node.invoke` أمرًا إلى عقدة متصلة.
- يعيد `node.invoke.result` النتيجة لطلب invoke.
- يحمل `node.event` الأحداث الصادرة من العقدة مرة أخرى إلى Gateway.
- يجدّد `node.canvas.capability.refresh` tokens قدرة canvas المقيّدة بالنطاق.
- تمثل `node.pending.pull` و`node.pending.ack` واجهات queue الخاصة بالعقدة المتصلة.
- تدير `node.pending.enqueue` و`node.pending.drain` العمل المعلق المستمر
  للعقد غير المتصلة/المنفصلة.

#### عائلات الموافقات

- تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و
  `exec.approval.resolve` طلبات موافقة exec أحادية المرة بالإضافة إلى
  lookup/replay للموافقات المعلقة.
- ينتظر `exec.approval.waitDecision` قرار موافقة exec واحدًا معلقًا ويعيد
  القرار النهائي (أو `null` عند انتهاء المهلة).
- تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقات exec
  في Gateway.
- تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقات exec
  المحلية للعقدة عبر أوامر relay الخاصة بالعقدة.
- تغطي `plugin.approval.request` و`plugin.approval.list` و
  `plugin.approval.waitDecision` و`plugin.approval.resolve`
  تدفقات الموافقة المعرّفة بواسطة Plugin.

#### عائلات رئيسية أخرى

- automation:
  - يقوم `wake` بجدولة حقن نص wake فوري أو عند Heartbeat التالي
  - `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و
    `cron.run` و`cron.runs`
- skills/tools: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective`

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة UI مثل `chat.inject` وغيرها من
  أحداث الدردشة الخاصة بالنصوص فقط.
- `session.message` و`session.tool`: تحديثات النصوص/تدفق الأحداث لجلسة
  مشتركة.
- `sessions.changed`: تغيّر فهرس الجلسات أو بياناتها الوصفية.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / liveliness دوري.
- `health`: تحديث لقطة سلامة Gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيّر تشغيل/وظيفة Cron.
- `shutdown`: إشعار إيقاف Gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة إقران العقدة.
- `node.invoke.request`: بث طلب invoke للعقدة.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر تكوين محفز wake-word.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة
  موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة
  موافقة Plugin.

### أساليب مساعدة العقدة

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية للملفات التنفيذية الخاصة بالـ Skills
  من أجل فحوصات السماح التلقائي.

### أساليب مساعدة operator

- يمكن للمشغّلين استدعاء `commands.list` (`operator.read`) لجلب
  مخزون الأوامر وقت التشغيل لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` الرمز الأساسي لأمر النص من دون الشرطة المائلة `/`
    - يعيد `native` ومسار `both` الافتراضي أسماء أصلية مدركة للـ provider
      عند توفرها
  - يحمل `textAliases` أسماء slash المستعارة الدقيقة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي المدرك للـ provider عند وجوده.
  - `provider` اختياري ويؤثر فقط في التسمية الأصلية بالإضافة إلى توافر أوامر
    Plugin الأصلية.
  - يؤدي `includeArgs=false` إلى حذف بيانات الوسائط المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` (`operator.read`) لجلب كتالوج الأدوات وقت التشغيل الخاص بـ
  وكيل. وتتضمن الاستجابة أدوات مجمعة وبيانات مصدر وصفية:
  - `source`: `core` أو `plugin`
  - `pluginId`: مالك Plugin عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` (`operator.read`) لجلب
  مخزون الأدوات الفعلي وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يشتق Gateway سياق وقت تشغيل موثوقًا من الجلسة على جهة الخادم بدلًا من قبول
    سياق مصادقة أو تسليم يورّده المتصل.
  - تكون الاستجابة مقيّدة بالجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن،
    بما في ذلك أدوات core وPlugin والقناة.
- يمكن للمشغّلين استدعاء `skills.status` (`operator.read`) لجلب مخزون
  Skills المرئي لوكيل.
  - `agentId` اختياري؛ احذفه لقراءة مساحة عمل الوكيل الافتراضية.
  - تتضمن الاستجابة الأهلية والمتطلبات المفقودة وفحوصات التكوين وخيارات
    التثبيت المنقّحة من دون كشف القيم السرية الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` (`operator.read`) من أجل
  بيانات اكتشاف ClawHub الوصفية.
- يمكن للمشغّلين استدعاء `skills.install` (`operator.admin`) في وضعين:
  - وضع ClawHub: `{ source: "clawhub", slug, version?, force? }` يثبّت
    مجلد Skill في دليل `skills/` الخاص بمساحة عمل الوكيل الافتراضية.
  - وضع مُثبّت Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    يشغّل إجراء `metadata.openclaw.install` مُعلنًا على مضيف Gateway.
- يمكن للمشغّلين استدعاء `skills.update` (`operator.admin`) في وضعين:
  - يقوم وضع ClawHub بتحديث slug متتبع واحد أو جميع تثبيتات ClawHub المتتبعة في
    مساحة عمل الوكيل الافتراضية.
  - يقوم وضع Config بتعديل قيم `skills.entries.<skillKey>` مثل `enabled`
    و`apiKey` و`env`.

## موافقات exec

- عندما يحتاج طلب exec إلى موافقة، يبث Gateway الحدث `exec.approval.requested`.
- يحسم عملاء operator القرار عبر استدعاء `exec.approval.resolve` (يتطلب النطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` الحقل `systemRunPlan` (القيم القانونية لـ `argv`/`cwd`/`rawCommand`/بيانات الجلسة الوصفية). وتُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` الممررة استخدام
  `systemRunPlan` القانوني ذاك بوصفه السياق المرجعي للأمر/`cwd`/الجلسة.
- إذا غيّر المتصل `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بين التحضير والتمرير النهائي الموافق عليه لـ `system.run`، فإن
  Gateway يرفض التشغيل بدلًا من الوثوق بالحمولة المعدّلة.

## بديل تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب تسليم صادر.
- يحافظ `bestEffortDeliver=false` على السلوك الصارم: إذ تعيد أهداف التسليم غير المحلولة أو الداخلية فقط القيمة `INVALID_REQUEST`.
- يسمح `bestEffortDeliver=true` بالرجوع إلى التنفيذ داخل الجلسة فقط عندما يتعذر حل أي مسار تسليم خارجي قابل للتسليم (مثل جلسات الويب الداخلية/webchat أو تكوينات القنوات المتعددة الملتبسة).

## الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- تُولَّد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. وتُعد القيم
ثابتة عبر البروتوكول v3 وهي خط الأساس المتوقع لعملاء الجهات الثالثة.

| الثابت                                  | القيمة الافتراضية                                      | المصدر                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| مهلة الطلب (لكل RPC)                      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| مهلة ما قبل المصادقة / تحدي الاتصال       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| التراجع الأولي لإعادة الاتصال             | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| الحد الأقصى للتراجع لإعادة الاتصال        | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| clamp إعادة المحاولة السريعة بعد إغلاق device-token | `250` ms                                      | `src/gateway/client.ts`                                    |
| مهلة السماح قبل `terminate()` عند الإيقاف القسري | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| المهلة الافتراضية لـ `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| الفاصل الافتراضي لـ tick (قبل `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| إغلاق مهلة tick                           | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

يعلن الخادم القيم الفعالة `policy.tickIntervalMs` و`policy.maxPayload` و
`policy.maxBufferedBytes` في `hello-ok`؛ وينبغي على العملاء احترام تلك القيم
بدلًا من القيم الافتراضية السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة Gateway بالسر المشترك الحقل `connect.params.auth.token` أو
  `connect.params.auth.password`، حسب وضع المصادقة المُكوَّن.
- الأوضاع الحاملة للهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو
  `gateway.auth.mode: "trusted-proxy"` غير القائم على loopback، تُلبي فحص مصادقة الاتصال من
  رؤوس الطلب بدلًا من `connect.params.auth.*`.
- يتخطى وضع الإدخال الخاص `gateway.auth.mode: "none"` مصادقة الاتصال بالسر المشترك
  بالكامل؛ ولا تعرّض هذا الوضع على إدخال عام/غير موثوق.
- بعد pairing، يصدر Gateway **device token** مقيّدًا بدور الاتصال + نطاقاته.
  ويُعاد في `hello-ok.auth.deviceToken` ويجب أن يحتفظ به العميل
  للاتصالات المستقبلية.
- يجب على العملاء حفظ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- يجب أن تعيد إعادة الاتصال باستخدام **device token** المخزن أيضًا استخدام مجموعة
  النطاقات المعتمدة المخزنة لذلك الـ token. وهذا يحافظ على وصول القراءة/الفحص/الحالة
  الذي مُنح بالفعل ويتجنب تقليص إعادة الاتصال بصمت إلى
  نطاق إداري ضمني أضيق.
- تجميع مصادقة الاتصال على جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - الحقل `auth.password` مستقل ويُمرَّر دائمًا عند ضبطه.
  - يُملأ `auth.token` حسب ترتيب الأولوية: shared token صريح أولًا،
    ثم `deviceToken` صريح، ثم token مخزن لكل جهاز (مفهرس حسب
    `deviceId` + `role`).
  - لا يُرسل `auth.bootstrapToken` إلا عندما لا يحل أي مما سبق
    قيمة `auth.token`. ويمنع shared token أو أي device token محلول إرساله.
  - تُقيَّد الترقية التلقائية لـ device token مخزن عند
    إعادة المحاولة الوحيدة `AUTH_TOKEN_MISMATCH` على **النهايات الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبّت. أما `wss://` العام
    من دون تثبيت فلا يُعد مؤهلًا.
- تمثل الإدخالات الإضافية `hello-ok.auth.deviceTokens` tokens تسليم bootstrap.
  ولا تحفظها إلا عندما يستخدم الاتصال مصادقة bootstrap على نقل موثوق
  مثل `wss://` أو loopback/local pairing.
- إذا قدّم العميل `deviceToken` **صريحًا** أو `scopes` صريحة، فإن
  مجموعة النطاقات المطلوبة من المتصل تبقى هي المرجعية؛ ولا يُعاد استخدام النطاقات المخبأة إلا
  عندما يعيد العميل استخدام token المخزن لكل جهاز.
- يمكن تدوير device tokens/إلغاؤها عبر `device.token.rotate` و
  `device.token.revoke` (يتطلب النطاق `operator.pairing`).
- يبقى إصدار/تدوير token مقيدًا بمجموعة الأدوار المعتمدة والمسجلة في
  إدخال pairing لذلك الجهاز؛ ولا يمكن لتدوير token توسيع الجهاز إلى
  دور لم تمنحه موافقة pairing أصلًا.
- بالنسبة إلى جلسات token الخاصة بالأجهزة المقترنة، تكون إدارة الجهاز مقيّدة ذاتيًا ما لم
  يمتلك المتصل أيضًا `operator.admin`: فلا يمكن لغير المشرفين إزالة/إلغاء/تدوير
  إلا إدخال الجهاز **الخاص بهم**.
- يتحقق `device.token.rotate` أيضًا من مجموعة نطاقات operator المطلوبة مقابل
  نطاقات جلسة المتصل الحالية. ولا يمكن لغير المشرفين تدوير token إلى
  مجموعة نطاقات operator أوسع مما يمتلكونه بالفعل.
- تتضمن إخفاقات المصادقة القيمة `error.details.code` بالإضافة إلى تلميحات الاسترداد:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token` أو `update_auth_configuration` أو `update_auth_credentials` أو `wait_then_retry` أو `review_auth_configuration`)
- سلوك العميل تجاه `AUTH_TOKEN_MISMATCH`:
  - يمكن للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام token مخزن لكل جهاز.
  - إذا فشلت تلك المحاولة، فيجب على العملاء إيقاف حلقات إعادة الاتصال التلقائية وعرض إرشادات لاتخاذ إجراء من operator.

## هوية الجهاز + pairing

- يجب أن تتضمن العقد هوية جهاز ثابتة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways tokens لكل جهاز + دور.
- يلزم اعتماد pairing لمعرّفات الأجهزة الجديدة ما لم تكن الموافقة المحلية التلقائية
  مفعلة.
- تتمحور الموافقة التلقائية على pairing حول اتصالات loopback المحلية المباشرة.
- يمتلك OpenClaw أيضًا مسار self-connect محليًا ضيقًا للخلفية/الحاوية
  من أجل تدفقات المساعدة الموثوقة ذات السر المشترك.
- ما تزال اتصالات tailnet أو LAN على المضيف نفسه تُعامل على أنها بعيدة بالنسبة إلى pairing وتتطلب موافقة.
- يجب أن تتضمن جميع عملاء WS هوية `device` أثناء `connect` (operator + node).
  ويمكن لـ Control UI حذفها فقط في هذه الأوضاع:
  - `gateway.controlUi.allowInsecureAuth=true` من أجل توافق HTTP غير الآمن على localhost فقط.
  - نجاح مصادقة operator لـ Control UI في وضع `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (حل أخير طارئ، وتخفيض أمني شديد).
- يجب على جميع الاتصالات توقيع قيمة nonce التي يقدّمها الخادم في `connect.challenge`.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز تفاصيل `DEVICE_AUTH_*` تحت `error.details.code` مع قيمة `error.details.reason` ثابتة.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسله فارغًا).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | لا تطابق حمولة التوقيع حمولة v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | يقع الطابع الزمني الموقَّع خارج الانحراف المسموح به.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | لا يطابق `device.id` بصمة المفتاح العام. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/تطبيع المفتاح العام.         |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخادم.
- أرسل قيمة nonce نفسها في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول device/client/role/scopes/token/nonce.
- تظل توقيعات `v2` القديمة مقبولة من أجل التوافق، لكن
  تثبيت بيانات الجهاز المقترن الوصفية ما يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- TLS مدعوم لاتصالات WS.
- يمكن للعملاء اختياريًا تثبيت بصمة شهادة Gateway (راجع تكوين `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو خيار CLI `--tls-fingerprint`).

## النطاق

يكشف هذا البروتوكول **واجهة Gateway API الكاملة** (الحالة، والقنوات، والنماذج، والدردشة،
والوكيل، والجلسات، والعقد، والموافقات، إلخ). ويُعرَّف السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.
