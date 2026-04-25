---
read_when:
    - تنفيذ عملاء WS لـ Gateway أو تحديثهم
    - تصحيح أخطاء عدم تطابق البروتوكول أو إخفاقات الاتصال
    - إعادة توليد مخطط/نماذج البروتوكول
summary: 'بروتوكول WebSocket الخاص بـ Gateway: المصافحة، والإطارات، وإدارة الإصدارات'
title: بروتوكول Gateway
x-i18n:
    generated_at: "2026-04-25T13:48:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

بروتوكول WebSocket الخاص بـ Gateway هو **مستوى التحكم الواحد + ناقل العقد** لـ
OpenClaw. تتصل جميع العملاء (CLI وواجهة الويب وتطبيق macOS وعقد iOS/Android والعقد
عديمة الواجهة) عبر WebSocket وتعلن **الدور** + **النطاق** الخاصين بها وقت
المصافحة.

## النقل

- WebSocket، بإطارات نصية ذات حمولات JSON.
- يجب أن يكون أول إطار **هو** طلب `connect`.
- يتم تقييد الإطارات قبل الاتصال عند 64 KiB. بعد المصافحة الناجحة، ينبغي للعملاء
  اتباع حدود `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes`. عند تمكين التشخيصات،
  تصدر الإطارات الواردة كبيرة الحجم والذاكرات الوسيطة الصادرة البطيئة أحداث `payload.large`
  قبل أن يغلق gateway الإطار المتأثر أو يسقطه. تحتفظ هذه الأحداث
  بالأحجام والحدود والأسطح ورموز الأسباب الآمنة. وهي لا تحتفظ
  بجسم الرسالة، أو محتويات المرفقات، أو جسم الإطار الخام، أو الرموز، أو cookies، أو القيم السرية.

## المصافحة (connect)

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

تُعد `server` و`features` و`snapshot` و`policy` جميعها مطلوبة حسب المخطط
(`src/gateway/protocol/schema/frames.ts`). ويكون `canvasHostUrl` اختياريًا. ويعرض `auth`
الدور/النطاقات المتفاوض عليها عند توفرها، ويتضمن `deviceToken`
عندما يصدره gateway.

عندما لا يتم إصدار device token، يمكن لـ `hello-ok.auth` مع ذلك عرض
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

أثناء تسليم trusted bootstrap، قد يتضمن `hello-ok.auth` أيضًا
إدخالات دور إضافية محدودة في `deviceTokens`:

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

في تدفق bootstrap المضمن للعقدة/المشغّل، يبقى الرمز الأساسي للعقدة
على `scopes: []` ويبقى أي رمز مشغّل مُسلَّم محدودًا بقائمة سماح
مشغّل bootstrap (`operator.approvals` و`operator.read` و
`operator.talk.secrets` و`operator.write`). وتبقى فحوصات نطاق bootstrap
مسبوقة بالدور: لا تلبّي إدخالات المشغّل إلا طلبات المشغّل، وما تزال الأدوار
غير التابعة للمشغّل تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

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

تتطلب الطرق ذات الآثار الجانبية **مفاتيح idempotency** (راجع المخطط).

## الأدوار + النطاقات

### الأدوار

- `operator` = عميل مستوى التحكم (CLI/UI/الأتمتة).
- `node` = مضيف الإمكانات (`camera`/`screen`/`canvas`/`system.run`).

### النطاقات (operator)

النطاقات الشائعة:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

يتطلب `talk.config` مع `includeSecrets: true` النطاق `operator.talk.secrets`
(أو `operator.admin`).

يمكن لطرق Gateway RPC المسجلة بواسطة Plugin أن تطلب نطاق operator خاصًا بها، لكن
البوادئ الإدارية الأساسية المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*` و
`update.*`) تُحل دائمًا إلى `operator.admin`.

يكون نطاق الطريقة هو البوابة الأولى فقط. فبعض أوامر slash التي يتم الوصول إليها عبر
`chat.send` تطبق فحوصات أشد على مستوى الأمر فوق ذلك. على سبيل المثال، تتطلب
عمليات الكتابة الدائمة لـ `/config set` و`/config unset` النطاق `operator.admin`.

يمتلك `node.pair.approve` أيضًا فحص نطاق إضافيًا وقت الموافقة فوق نطاق الطريقة الأساسي:

- الطلبات بلا أوامر: `operator.pairing`
- الطلبات التي تحتوي على أوامر node غير تنفيذية: `operator.pairing` + `operator.write`
- الطلبات التي تتضمن `system.run` أو `system.run.prepare` أو `system.which`:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions (node)

تعلن العقد عن مطالبات الإمكانات وقت الاتصال:

- `caps`: فئات إمكانات عالية المستوى.
- `commands`: قائمة سماح للأوامر الخاصة بالاستدعاء.
- `permissions`: مفاتيح تبديل دقيقة (مثل `screen.record` و`camera.capture`).

يتعامل Gateway مع هذه على أنها **مطالبات** ويفرض قوائم السماح من جهة الخادم.

## الحضور

- يعيد `system-presence` إدخالات مفهرسة بحسب هوية الجهاز.
- تتضمن إدخالات الحضور `deviceId` و`roles` و`scopes` حتى تتمكن واجهات المستخدم من عرض صف واحد لكل جهاز
  حتى عندما يتصل بوصفه **operator** و**node** معًا.

## تقييد نطاق أحداث البث

تخضع أحداث البث عبر WebSocket التي يدفعها الخادم لتقييد بالنطاق حتى لا
تتلقى الجلسات ذات نطاق الاقتران فقط أو جلسات العقد فقط محتوى الجلسة بشكل سلبي.

- **إطارات الدردشة والوكيل ونتائج الأدوات** (بما في ذلك أحداث `agent` المتدفقة ونتائج استدعاء الأدوات) تتطلب على الأقل `operator.read`. وتتجاوز الجلسات التي لا تملك `operator.read` هذه الإطارات بالكامل.
- **عمليات البث `plugin.*` المعرفة بواسطة Plugin** يتم تقييدها إلى `operator.write` أو `operator.admin` حسب كيفية تسجيل Plugin لها.
- **أحداث الحالة والنقل** (`heartbeat` و`presence` و`tick` ودورة حياة الاتصال/فصل الاتصال، وغير ذلك) تبقى غير مقيّدة حتى تبقى سلامة النقل قابلة للملاحظة لكل جلسة موثقة.
- **عائلات أحداث البث غير المعروفة** تكون مقيّدة بالنطاق افتراضيًا (فشل مغلق) ما لم يرخِّها معالج مسجل صراحة.

يحتفظ كل اتصال عميل برقم تسلسلي خاص به لكل عميل بحيث تحافظ عمليات البث على ترتيب رتيب على ذلك المقبس حتى عندما ترى عملاء مختلفة مجموعات فرعية مختلفة مفلترة بالنطاق من تدفق الأحداث.

## عائلات طرق RPC الشائعة

يعد سطح WS العام أوسع من أمثلة المصافحة/المصادقة أعلاه. هذه
ليست قائمة مولدة — فالقائمة `hello-ok.features.methods` هي قائمة
اكتشاف متحفظة مبنية من `src/gateway/server-methods-list.ts` بالإضافة إلى صادرات
الطرق المحملة من Plugins/القنوات. تعامل معها على أنها اكتشاف ميزات، لا تعدادًا كاملًا لـ `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="النظام والهوية">
    - يعيد `health` لقطة سلامة gateway المخزنة مؤقتًا أو التي تم فحصها حديثًا.
    - يعيد `diagnostics.stability` مسجل الاستقرار التشخيصي المحدود الأخير. ويحتفظ ببيانات تعريف تشغيلية مثل أسماء الأحداث، والأعداد، وأحجام البايتات، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugins، ومعرّفات الجلسات. ولا يحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلب أو الاستجابة الخام، أو الرموز، أو cookies، أو القيم السرية. ويتطلب نطاق قراءة operator.
    - يعيد `status` ملخص gateway على نمط `/status`؛ ولا تُضمَّن الحقول الحساسة إلا لعملاء operator ذوي النطاق الإداري.
    - يعيد `gateway.identity.get` هوية جهاز gateway المستخدمة في مسارات relay والاقتران.
    - يعيد `system-presence` لقطة الحضور الحالية لأجهزة operator/node المتصلة.
    - يضيف `system-event` حدث نظام ويمكنه تحديث/بث سياق الحضور.
    - يعيد `last-heartbeat` أحدث حدث Heartbeat محفوظ.
    - يقوم `set-heartbeats` بتبديل معالجة Heartbeat على gateway.
  </Accordion>

  <Accordion title="النماذج والاستخدام">
    - يعيد `models.list` كتالوج النماذج المسموح بها في وقت التشغيل.
    - يعيد `usage.status` نوافذ استخدام الموفّر/ملخصات الحصة المتبقية.
    - يعيد `usage.cost` ملخصات الاستخدام الكلي للتكلفة لنطاق تاريخ.
    - يعيد `doctor.memory.status` جاهزية vector-memory / embedding لمساحة العمل الافتراضية النشطة للوكيل.
    - يعيد `sessions.usage` ملخصات استخدام لكل جلسة.
    - يعيد `sessions.usage.timeseries` استخدامًا زمنيًا لجلسة واحدة.
    - يعيد `sessions.usage.logs` إدخالات سجل الاستخدام لجلسة واحدة.
  </Accordion>

  <Accordion title="القنوات ومساعدات تسجيل الدخول">
    - يعيد `channels.status` ملخصات حالة القنوات/Plugins المضمنة والمجمعة.
    - يقوم `channels.logout` بتسجيل الخروج من قناة/حساب محدد عندما تدعم القناة تسجيل الخروج.
    - يبدأ `web.login.start` تدفق تسجيل دخول QR/ويب لموفّر قناة الويب الحالي القابل لـ QR.
    - ينتظر `web.login.wait` اكتمال تدفق تسجيل دخول QR/ويب هذا ويبدأ القناة عند النجاح.
    - يرسل `push.test` دفعة APNs اختبارية إلى عقدة iOS مسجلة.
    - يعيد `voicewake.get` مشغلات كلمة التنبيه المخزنة.
    - يقوم `voicewake.set` بتحديث مشغلات كلمة التنبيه وبث التغيير.
  </Accordion>

  <Accordion title="المراسلة والسجلات">
    - يُعد `send` RPC التسليم الصادر المباشر للاستهداف حسب القناة/الحساب/الخيط خارج مشغّل الدردشة.
    - يعيد `logs.tail` ذيل سجل ملفات gateway المكوّن مع عناصر تحكم بالمؤشر/الحد وبالحد الأقصى للبايت.
  </Accordion>

  <Accordion title="Talk وTTS">
    - يعيد `talk.config` حمولة إعداد Talk الفعالة؛ ويتطلب `includeSecrets` النطاق `operator.talk.secrets` (أو `operator.admin`).
    - يضبط `talk.mode` حالة وضع Talk الحالية ويبثها لعملاء WebChat/Control UI.
    - يقوم `talk.speak` بتوليف الكلام عبر موفّر كلام Talk النشط.
    - يعيد `tts.status` حالة تمكين TTS، والموفّر النشط، والموفّرين الاحتياطيين، وحالة إعداد الموفّر.
    - يعيد `tts.providers` مخزون موفّري TTS المرئي.
    - يقوم `tts.enable` و`tts.disable` بتبديل حالة تفضيلات TTS.
    - يقوم `tts.setProvider` بتحديث موفّر TTS المفضل.
    - ينفذ `tts.convert` تحويل نص إلى كلام لمرة واحدة.
  </Accordion>

  <Accordion title="Secrets، والإعداد، والتحديث، والمعالج">
    - يقوم `secrets.reload` بإعادة حل SecretRefs النشطة ويبدّل حالة Secrets في وقت التشغيل فقط عند النجاح الكامل.
    - يقوم `secrets.resolve` بحل تعيينات Secrets المستهدفة بالأوامر لمجموعة أمر/هدف محددة.
    - يعيد `config.get` لقطة الإعداد الحالية وhash الخاص بها.
    - يكتب `config.set` حمولة إعداد متحققًا منها.
    - يدمج `config.patch` تحديث إعداد جزئيًا.
    - يقوم `config.apply` بالتحقق + استبدال حمولة الإعداد الكاملة.
    - يعيد `config.schema` حمولة مخطط الإعداد الحي المستخدمة بواسطة Control UI وأدوات CLI: المخطط، و`uiHints`، والإصدار، وبيانات تعريف التوليد، بما في ذلك بيانات تعريف مخطط Plugin + القناة عندما يتمكن وقت التشغيل من تحميلها. ويتضمن المخطط بيانات تعريف الحقل `title` / `description` المشتقة من التسميات نفسها ونصوص المساعدة المستخدمة بواسطة واجهة المستخدم، بما في ذلك فروع تركيب الكائنات المتداخلة، وwildcard، وعناصر المصفوفات، و`anyOf` / `oneOf` / `allOf` عندما يوجد توثيق حقول مطابق.
    - يعيد `config.schema.lookup` حمولة بحث مقيّدة بالمسار لمسار إعداد واحد: المسار الموحّد، وعقدة مخطط سطحية، وتلميحًا مطابقًا + `hintPath`، وملخصات فورية للعناصر الفرعية للتعمق في UI/CLI. تحتفظ عقد مخطط البحث بوثائق مواجهة للمستخدم وحقول التحقق الشائعة (`title` و`description` و`type` و`enum` و`const` و`format` و`pattern` وحدود الأرقام/السلاسل/المصفوفات/الكائنات، وأعلام مثل `additionalProperties` و`deprecated` و`readOnly` و`writeOnly`). وتعرض ملخصات العناصر الفرعية `key` و`path` الموحّد و`type` و`required` و`hasChildren` بالإضافة إلى `hint` / `hintPath` المطابقين.
    - يقوم `update.run` بتشغيل تدفق تحديث gateway ويجدول إعادة تشغيل فقط عندما ينجح التحديث نفسه.
    - تكشف `wizard.start` و`wizard.next` و`wizard.status` و`wizard.cancel` معالج الإعداد الأولي عبر WS RPC.
  </Accordion>

  <Accordion title="مساعدات الوكيل ومساحة العمل">
    - يعيد `agents.list` إدخالات الوكيل المكوّنة.
    - تدير `agents.create` و`agents.update` و`agents.delete` سجلات الوكيل وتوصيلات مساحة العمل.
    - تدير `agents.files.list` و`agents.files.get` و`agents.files.set` ملفات bootstrap الخاصة بمساحة العمل المعروضة لوكيل.
    - يعيد `agent.identity.get` هوية المساعد الفعالة لوكيل أو جلسة.
    - ينتظر `agent.wait` حتى ينتهي التشغيل ويعيد اللقطة النهائية عند توفرها.
  </Accordion>

  <Accordion title="التحكم في الجلسة">
    - يعيد `sessions.list` فهرس الجلسة الحالي.
    - تبدّل `sessions.subscribe` و`sessions.unsubscribe` اشتراكات أحداث تغيير الجلسة لعميل WS الحالي.
    - تبدّل `sessions.messages.subscribe` و`sessions.messages.unsubscribe` اشتراكات أحداث transcript/الرسائل لجلسة واحدة.
    - يعيد `sessions.preview` معاينات transcript محدودة لمفاتيح جلسات محددة.
    - يقوم `sessions.resolve` بحل أو توحيد هدف جلسة.
    - يقوم `sessions.create` بإنشاء إدخال جلسة جديد.
    - يقوم `sessions.send` بإرسال رسالة إلى جلسة موجودة.
    - يُعد `sessions.steer` صيغة المقاطعة والتوجيه لجلسة نشطة.
    - يقوم `sessions.abort` بإيقاف العمل النشط لجلسة.
    - يقوم `sessions.patch` بتحديث بيانات تعريف الجلسة/التجاوزات.
    - تنفذ `sessions.reset` و`sessions.delete` و`sessions.compact` صيانة الجلسة.
    - يعيد `sessions.get` صف الجلسة المخزن الكامل.
    - لا يزال تنفيذ الدردشة يستخدم `chat.history` و`chat.send` و`chat.abort` و`chat.inject`. يتم توحيد `chat.history` للعرض لعملاء UI: حيث تُزال وسوم التوجيه المضمّنة من النص الظاهر، وتُزال حمولات XML الخاصة باستدعاء الأدوات في النص العادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المقتطعة) ورموز تحكم النموذج المتسربة ASCII/كاملة العرض، وتُحذف صفوف المساعد ذات الرموز الصامتة الخالصة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.
  </Accordion>

  <Accordion title="اقتران الأجهزة وdevice tokens">
    - يعيد `device.pair.list` الأجهزة المقترنة المعلقة والمعتمدة.
    - تدير `device.pair.approve` و`device.pair.reject` و`device.pair.remove` سجلات اقتران الأجهزة.
    - يقوم `device.token.rotate` بتدوير رمز الجهاز المقترن ضمن حدود دوره ونطاقه المعتمدة.
    - يقوم `device.token.revoke` بإلغاء device token لجهاز مقترن.
  </Accordion>

  <Accordion title="اقتران العقد، والاستدعاء، والعمل المعلق">
    - تغطي `node.pair.request` و`node.pair.list` و`node.pair.approve` و`node.pair.reject` و`node.pair.verify` اقتران العقد والتحقق من bootstrap.
    - يعيد `node.list` و`node.describe` حالة العقد المعروفة/المتصلة.
    - يقوم `node.rename` بتحديث تسمية عقدة مقترنة.
    - يقوم `node.invoke` بتمرير أمر إلى عقدة متصلة.
    - يعيد `node.invoke.result` نتيجة طلب invoke.
    - يحمل `node.event` الأحداث الصادرة من العقدة مرة أخرى إلى gateway.
    - يقوم `node.canvas.capability.refresh` بتحديث رموز canvas-capability المقيّدة بالنطاق.
    - تُعد `node.pending.pull` و`node.pending.ack` واجهات queue API للعقد المتصلة.
    - تدير `node.pending.enqueue` و`node.pending.drain` الأعمال المعلقة الدائمة للعقد غير المتصلة/المفصولة.
  </Accordion>

  <Accordion title="عائلات الموافقات">
    - تغطي `exec.approval.request` و`exec.approval.get` و`exec.approval.list` و`exec.approval.resolve` طلبات موافقة exec لمرة واحدة بالإضافة إلى البحث/إعادة التشغيل للموافقات المعلقة.
    - ينتظر `exec.approval.waitDecision` قرار موافقة exec واحد معلق ويعيد القرار النهائي (أو `null` عند انتهاء المهلة).
    - تدير `exec.approvals.get` و`exec.approvals.set` لقطات سياسة موافقة exec في gateway.
    - تدير `exec.approvals.node.get` و`exec.approvals.node.set` سياسة موافقة exec المحلية للعقدة عبر أوامر relay الخاصة بالعقدة.
    - تغطي `plugin.approval.request` و`plugin.approval.list` و`plugin.approval.waitDecision` و`plugin.approval.resolve` تدفقات الموافقة المعرفة بواسطة Plugin.
  </Accordion>

  <Accordion title="الأتمتة، وSkills، والأدوات">
    - الأتمتة: يقوم `wake` بجدولة حقن نص تنبيه فوري أو في Heartbeat التالي؛ وتدير `cron.list` و`cron.status` و`cron.add` و`cron.update` و`cron.remove` و`cron.run` و`cron.runs` الأعمال المجدولة.
    - Skills والأدوات: `commands.list` و`skills.*` و`tools.catalog` و`tools.effective`.
  </Accordion>
</AccordionGroup>

### عائلات الأحداث الشائعة

- `chat`: تحديثات دردشة UI مثل `chat.inject` وأحداث الدردشة الأخرى الخاصة بـ transcript فقط.
- `session.message` و`session.tool`: تحديثات transcript/تدفق الأحداث لجلسة مشترَك بها.
- `sessions.changed`: تغيّر فهرس الجلسة أو بيانات تعريفها.
- `presence`: تحديثات لقطة حضور النظام.
- `tick`: حدث keepalive / liveness دوري.
- `health`: تحديث لقطة سلامة gateway.
- `heartbeat`: تحديث تدفق أحداث Heartbeat.
- `cron`: حدث تغيير تشغيل/مهمة Cron.
- `shutdown`: إشعار إيقاف gateway.
- `node.pair.requested` / `node.pair.resolved`: دورة حياة اقتران العقدة.
- `node.invoke.request`: بث طلب invoke للعقدة.
- `device.pair.requested` / `device.pair.resolved`: دورة حياة الجهاز المقترن.
- `voicewake.changed`: تغيّر إعداد مشغّل كلمة التنبيه.
- `exec.approval.requested` / `exec.approval.resolved`: دورة حياة موافقة exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: دورة حياة موافقة Plugin.

### طرق المساعدة للعقدة

- يمكن للعقد استدعاء `skills.bins` لجلب القائمة الحالية لملفات Skills التنفيذية من أجل فحوصات السماح التلقائي.

### طرق المساعدة للمشغّل

- يمكن للمشغّلين استدعاء `commands.list` ‏(`operator.read`) لجلب مخزون الأوامر في وقت التشغيل لوكيل.
  - يكون `agentId` اختياريًا؛ احذفه لقراءة مساحة العمل الافتراضية للوكيل.
  - يتحكم `scope` في السطح الذي يستهدفه `name` الأساسي:
    - يعيد `text` رمز أمر النص الأساسي من دون الشرطة المائلة البادئة `/`
    - يعيد `native` والمسار الافتراضي `both` أسماء أصلية مدركة للموفّر عند توفرها
  - يحمل `textAliases` الأسماء البديلة الدقيقة ذات الشرطة المائلة مثل `/model` و`/m`.
  - يحمل `nativeName` اسم الأمر الأصلي المدرك للموفّر عندما يوجد.
  - يكون `provider` اختياريًا ولا يؤثر إلا في التسمية الأصلية وتوفر أوامر Plugin الأصلية.
  - يؤدي `includeArgs=false` إلى حذف بيانات تعريف الوسيطات المتسلسلة من الاستجابة.
- يمكن للمشغّلين استدعاء `tools.catalog` ‏(`operator.read`) لجلب كتالوج الأدوات في وقت التشغيل لوكيل. تتضمن الاستجابة أدوات مجمعة وبيانات تعريف المصدر:
  - `source`: ‏`core` أو `plugin`
  - `pluginId`: Plugin المالك عندما يكون `source="plugin"`
  - `optional`: ما إذا كانت أداة Plugin اختيارية
- يمكن للمشغّلين استدعاء `tools.effective` ‏(`operator.read`) لجلب مخزون الأدوات الفعال في وقت التشغيل لجلسة.
  - `sessionKey` مطلوب.
  - يستمد gateway سياق وقت تشغيل موثوقًا من الجلسة على جهة الخادم بدلًا من قبول سياق مصادقة أو تسليم يورده المستدعي.
  - تكون الاستجابة مقيّدة بالجلسة وتعكس ما يمكن للمحادثة النشطة استخدامه الآن، بما في ذلك أدوات core وPlugin والقناة.
- يمكن للمشغّلين استدعاء `skills.status` ‏(`operator.read`) لجلب مخزون Skills المرئي لوكيل.
  - يكون `agentId` اختياريًا؛ احذفه لقراءة مساحة العمل الافتراضية للوكيل.
  - تتضمن الاستجابة الأهلية، والمتطلبات المفقودة، وفحوصات الإعداد، وخيارات التثبيت المنقحة من دون كشف القيم السرية الخام.
- يمكن للمشغّلين استدعاء `skills.search` و`skills.detail` ‏(`operator.read`) للحصول على بيانات تعريف الاكتشاف في ClawHub.
- يمكن للمشغّلين استدعاء `skills.install` ‏(`operator.admin`) في وضعين:
  - وضع ClawHub: ‏`{ source: "clawhub", slug, version?, force? }` يثبت مجلد Skill داخل دليل `skills/` الخاص بمساحة العمل الافتراضية للوكيل.
  - وضع مثبّت Gateway: ‏`{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    يشغّل إجراء `metadata.openclaw.install` معلنًا على مضيف gateway.
- يمكن للمشغّلين استدعاء `skills.update` ‏(`operator.admin`) في وضعين:
  - يقوم وضع ClawHub بتحديث slug واحد متتبَّع أو جميع تثبيتات ClawHub المتتبعة في مساحة العمل الافتراضية للوكيل.
  - يقوم وضع الإعداد بترقيع قيم `skills.entries.<skillKey>` مثل `enabled` و`apiKey` و`env`.

## موافقات Exec

- عندما يحتاج طلب exec إلى موافقة، يبث gateway الحدث `exec.approval.requested`.
- يقوم عملاء المشغّل بالحل عبر استدعاء `exec.approval.resolve` (يتطلب النطاق `operator.approvals`).
- بالنسبة إلى `host=node`، يجب أن يتضمن `exec.approval.request` القيمة `systemRunPlan` ‏(القيم القياسية `argv`/`cwd`/`rawCommand`/بيانات تعريف الجلسة). تُرفض الطلبات التي تفتقد `systemRunPlan`.
- بعد الموافقة، تعيد استدعاءات `node.invoke system.run` المُمرَّرة استخدام
  `systemRunPlan` القياسي هذا بوصفه السياق المعتمد للأمر/`cwd`/الجلسة.
- إذا قام مستدعٍ بتعديل `command` أو`rawCommand` أو`cwd` أو`agentId` أو
  `sessionKey` بين التحضير وتمرير `system.run` النهائي المعتمد، فإن
  gateway يرفض التشغيل بدلًا من الوثوق بالحمولة المعدّلة.

## التراجع في تسليم الوكيل

- يمكن أن تتضمن طلبات `agent` القيمة `deliver=true` لطلب التسليم الصادر.
- تحافظ `bestEffortDeliver=false` على السلوك الصارم: إذ تعيد أهداف التسليم غير المحلولة أو الداخلية فقط القيمة `INVALID_REQUEST`.
- تسمح `bestEffortDeliver=true` بالتراجع إلى التنفيذ الخاص بالجلسة فقط عندما لا يمكن حل أي مسار خارجي قابل للتسليم (مثل جلسات internal/webchat أو إعدادات متعددة القنوات ملتبسة).

## إدارة الإصدارات

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema/protocol-schemas.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- يتم توليد المخططات + النماذج من تعريفات TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثوابت العميل

يستخدم العميل المرجعي في `src/gateway/client.ts` هذه القيم الافتراضية. وتكون القيم
مستقرة عبر البروتوكول v3 وهي خط الأساس المتوقع للعملاء من جهات خارجية.

| الثابت                                   | الافتراضي                                             | المصدر                                                     |
| ---------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                       | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| مهلة الطلب (لكل RPC)                    | `30_000` مللي ثانية                                   | `src/gateway/client.ts` ‏(`requestTimeoutMs`)              |
| مهلة ما قبل المصادقة / connect-challenge | `10_000` مللي ثانية                                   | `src/gateway/handshake-timeouts.ts` ‏(القيد `250`–`10_000`) |
| تراجع إعادة الاتصال الابتدائي           | `1_000` مللي ثانية                                    | `src/gateway/client.ts` ‏(`backoffMs`)                     |
| الحد الأقصى لتراجع إعادة الاتصال         | `30_000` مللي ثانية                                   | `src/gateway/client.ts` ‏(`scheduleReconnect`)             |
| قيد إعادة المحاولة السريعة بعد إغلاق device-token | `250` مللي ثانية                                | `src/gateway/client.ts`                                    |
| مهلة السماح قبل `terminate()` عند الإيقاف القسري | `250` مللي ثانية                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| المهلة الافتراضية لـ `stopAndWait()`    | `1_000` مللي ثانية                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| الفاصل الافتراضي لـ tick ‏(قبل `hello-ok`) | `30_000` مللي ثانية                                 | `src/gateway/client.ts`                                    |
| إغلاق مهلة tick                          | الرمز `4000` عندما يتجاوز الصمت `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                      | `25 * 1024 * 1024` ‏(25 MB)                           | `src/gateway/server-constants.ts`                          |

يعلن الخادم عن القيم الفعالة `policy.tickIntervalMs` و`policy.maxPayload`
و`policy.maxBufferedBytes` في `hello-ok`؛ وينبغي للعملاء الالتزام بهذه القيم
بدلًا من القيم الافتراضية السابقة للمصافحة.

## المصادقة

- تستخدم مصادقة gateway ذات shared-secret القيم `connect.params.auth.token` أو
  `connect.params.auth.password`، بحسب وضع المصادقة المكوَّن.
- تلبي الأوضاع الحاملة للهوية مثل Tailscale Serve
  (`gateway.auth.allowTailscale: true`) أو الوضع غير loopback
  `gateway.auth.mode: "trusted-proxy"` فحص مصادقة connect من
  ترويسات الطلب بدلًا من `connect.params.auth.*`.
- يتجاوز `gateway.auth.mode: "none"` الخاص بـ private-ingress مصادقة connect ذات shared-secret
  بالكامل؛ لا تعرّض هذا الوضع على ingress عام/غير موثوق.
- بعد الاقتران، يصدر Gateway **device token** مقيّدًا بدور الاتصال + نطاقاته.
  ويُعاد في `hello-ok.auth.deviceToken` ويجب أن يحتفظ به العميل للاتصالات المستقبلية.
- يجب على العملاء الاحتفاظ بـ `hello-ok.auth.deviceToken` الأساسي بعد أي
  اتصال ناجح.
- عند إعادة الاتصال باستخدام هذا **device token المخزن**، يجب أيضًا إعادة استخدام مجموعة
  النطاقات المعتمدة المخزنة لذلك الرمز. وهذا يحافظ على وصول القراءة/الفحص/الحالة
  الذي مُنح بالفعل ويتجنب تضييق عمليات إعادة الاتصال بصمت إلى
  نطاق إداري ضمني أضيق فقط.
- تجميع مصادقة connect من جهة العميل (`selectConnectAuth` في
  `src/gateway/client.ts`):
  - يكون `auth.password` مستقلًا ويتم تمريره دائمًا عند تعيينه.
  - يتم ملء `auth.token` حسب ترتيب الأولوية: shared token صريح أولًا،
    ثم `deviceToken` صريح، ثم رمز مخزن لكل جهاز (مفتاحه
    `deviceId` + `role`).
  - لا يتم إرسال `auth.bootstrapToken` إلا عندما لا يحل أي من العناصر السابقة
    قيمة لـ `auth.token`. يؤدي shared token أو أي device token محلول إلى كبحه.
  - يتم تقييد الترقية التلقائية لـ device token مخزن في إعادة المحاولة الوحيدة
    `AUTH_TOKEN_MISMATCH` على **نقاط النهاية الموثوقة فقط** —
    loopback، أو `wss://` مع `tlsFingerprint` مثبت. أما `wss://` العام
    من دون تثبيت فلا يَصلح.
- إدخالات `hello-ok.auth.deviceTokens` الإضافية هي رموز تسليم bootstrap.
  لا تحتفظ بها إلا عندما يستخدم الاتصال مصادقة bootstrap على ناقل موثوق
  مثل `wss://` أو loopback/اقتران محلي.
- إذا قدّم عميل **`deviceToken` صريحًا** أو **`scopes` صريحة**، تبقى
  مجموعة النطاقات المطلوبة من المستدعي هي المعتمدة؛ ولا يُعاد استخدام النطاقات المخزنة
  إلا عندما يعيد العميل استخدام الرمز المخزن لكل جهاز.
- يمكن تدوير/إلغاء device tokens عبر `device.token.rotate` و
  `device.token.revoke` ‏(يتطلب النطاق `operator.pairing`).
- يبقى إصدار/تدوير الرموز مقيّدًا بمجموعة الأدوار المعتمدة المسجلة في
  إدخال اقتران ذلك الجهاز؛ ولا يمكن لتدوير رمز أن يوسّع الجهاز إلى
  دور لم تمنحه موافقة الاقتران مطلقًا.
- بالنسبة إلى جلسات الرموز الخاصة بالأجهزة المقترنة، تكون إدارة الجهاز مقيّدة ذاتيًا ما لم يكن لدى
  المستدعي أيضًا `operator.admin`: لا يمكن لغير الإداريين إزالة/إلغاء/تدوير
  إلا إدخال جهازهم **الخاص**.
- يتحقق `device.token.rotate` أيضًا من مجموعة نطاقات operator المطلوبة مقارنةً بـ
  نطاقات الجلسة الحالية للمستدعي. لا يمكن لغير الإداريين تدوير رمز إلى
  مجموعة نطاقات operator أوسع مما يملكونه بالفعل.
- تتضمن إخفاقات المصادقة `error.details.code` بالإضافة إلى تلميحات استرداد:
  - `error.details.canRetryWithDeviceToken` ‏(قيمة منطقية)
  - `error.details.recommendedNextStep` ‏(`retry_with_device_token` أو `update_auth_configuration` أو `update_auth_credentials` أو `wait_then_retry` أو `review_auth_configuration`)
- سلوك العميل مع `AUTH_TOKEN_MISMATCH`:
  - قد تحاول العملاء الموثوقة إعادة محاولة واحدة محدودة باستخدام رمز مخزن لكل جهاز.
  - إذا فشلت إعادة المحاولة هذه، ينبغي للعملاء إيقاف حلقات إعادة الاتصال التلقائية وإظهار إرشادات لاتخاذ إجراء من المشغّل.

## هوية الجهاز + الاقتران

- ينبغي للعقد تضمين هوية جهاز مستقرة (`device.id`) مشتقة من
  بصمة زوج مفاتيح.
- تصدر Gateways رموزًا لكل جهاز + دور.
- يلزم الحصول على موافقات اقتران لمعرّفات الأجهزة الجديدة ما لم يكن التحقق التلقائي المحلي
  مفعّلًا.
- يتمحور التحقق التلقائي من الاقتران حول اتصالات loopback المحلية المباشرة.
- يمتلك OpenClaw أيضًا مسار self-connect محليًا للحاوية/backend ضيقًا
  لتدفقات المساعدة الموثوقة ذات shared-secret.
- ما تزال اتصالات same-host tailnet أو LAN تُعامل على أنها بعيدة لأغراض الاقتران
  وتتطلب موافقة.
- يجب على جميع عملاء WS تضمين هوية `device` أثناء `connect` ‏(operator + node).
  يمكن لـ Control UI حذفها فقط في هذه الأوضاع:
  - `gateway.controlUi.allowInsecureAuth=true` للتوافق المحلي فقط مع HTTP غير الآمن.
  - نجاح مصادقة Control UI الخاصة بالمشغّل في `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` ‏(كسر زجاج، تراجع أمني شديد).
- يجب على جميع الاتصالات توقيع `connect.challenge` nonce الذي يوفره الخادم.

### تشخيصات ترحيل مصادقة الجهاز

بالنسبة إلى العملاء القدامى الذين ما زالوا يستخدمون سلوك التوقيع السابق للتحدي، يعيد `connect` الآن
رموز التفاصيل `DEVICE_AUTH_*` تحت `error.details.code` مع قيمة ثابتة `error.details.reason`.

إخفاقات الترحيل الشائعة:

| الرسالة                     | details.code                     | details.reason           | المعنى                                             |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | حذف العميل `device.nonce` (أو أرسله فارغًا).      |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | وقّع العميل باستخدام nonce قديم/خاطئ.             |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | لا تطابق حمولة التوقيع حمولة v2.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | الطابع الزمني الموقّع خارج الانحراف المسموح به.   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | لا يطابق `device.id` بصمة المفتاح العام.          |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | فشل تنسيق/توحيد المفتاح العام.                    |

هدف الترحيل:

- انتظر دائمًا `connect.challenge`.
- وقّع حمولة v2 التي تتضمن nonce الخاص بالخادم.
- أرسل nonce نفسه في `connect.params.device.nonce`.
- حمولة التوقيع المفضلة هي `v3`، التي تربط `platform` و`deviceFamily`
  بالإضافة إلى حقول الجهاز/العميل/الدور/النطاقات/الرمز/nonce.
- تبقى توقيعات `v2` القديمة مقبولة للتوافق، لكن تثبيت بيانات تعريف
  الجهاز المقترن ما يزال يتحكم في سياسة الأوامر عند إعادة الاتصال.

## TLS + التثبيت

- يتم دعم TLS لاتصالات WS.
- يمكن للعملاء اختياريًا تثبيت بصمة شهادة gateway (راجع إعداد `gateway.tls`
  بالإضافة إلى `gateway.remote.tlsFingerprint` أو CLI ‏`--tls-fingerprint`).

## النطاق

يكشف هذا البروتوكول عن **واجهة Gateway API الكاملة** (الحالة، والقنوات، والنماذج، والدردشة،
والوكيل، والجلسات، والعقد، والموافقات، وغير ذلك). ويتم تعريف السطح الدقيق بواسطة
مخططات TypeBox في `src/gateway/protocol/schema.ts`.

## ذو صلة

- [Bridge protocol](/ar/gateway/bridge-protocol)
- [دليل تشغيل Gateway](/ar/gateway)
