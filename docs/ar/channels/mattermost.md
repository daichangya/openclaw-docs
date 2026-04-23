---
read_when:
    - إعداد Mattermost
    - تصحيح أخطاء توجيه Mattermost
summary: إعداد بوت Mattermost وتكوين OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T13:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

الحالة: Plugin مضمّن (رمز بوت + أحداث WebSocket). القنوات والمجموعات والرسائل المباشرة مدعومة.
Mattermost هي منصة مراسلة جماعية قابلة للاستضافة الذاتية؛ راجع الموقع الرسمي على
[mattermost.com](https://mattermost.com) للحصول على تفاصيل المنتج والتنزيلات.

## Plugin المضمّن

يأتي Mattermost كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البنيات المجمعة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا لا يتضمن Mattermost،
فثبّته يدويًا:

التثبيت عبر CLI (سجل npm):

```bash
openclaw plugins install @openclaw/mattermost
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

1. تأكد من أن Plugin Mattermost متاح.
   - إصدارات OpenClaw المجمعة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا بالأوامر أعلاه.
2. أنشئ حساب بوت في Mattermost وانسخ **رمز البوت**.
3. انسخ **عنوان URL الأساسي** لـ Mattermost (مثل `https://chat.example.com`).
4. اضبط OpenClaw وابدأ Gateway.

الحد الأدنى من التكوين:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## أوامر الشرطة المائلة الأصلية

أوامر الشرطة المائلة الأصلية اختيارية التفعيل. عند تمكينها، يسجل OpenClaw أوامر الشرطة المائلة `oc_*` عبر
واجهة Mattermost API ويتلقى عمليات POST الراجعة على خادم HTTP الخاص بـ Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // يُستخدم عندما يتعذر على Mattermost الوصول إلى Gateway مباشرةً (وكيل عكسي/عنوان URL عام).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

ملاحظات:

- `native: "auto"` يكون معطلاً افتراضيًا لـ Mattermost. اضبط `native: true` للتمكين.
- إذا تم حذف `callbackUrl`، فسيشتق OpenClaw قيمة منه من مضيف/منفذ Gateway مع `callbackPath`.
- في إعدادات الحسابات المتعددة، يمكن ضبط `commands` على المستوى الأعلى أو تحت
  `channels.mattermost.accounts.<id>.commands` (قيم الحساب تتجاوز حقول المستوى الأعلى).
- يتم التحقق من عمليات رد الأوامر باستخدام الرموز الخاصة بكل أمر التي يعيدها
  Mattermost عندما يسجل OpenClaw أوامر `oc_*`.
- تفشل عمليات رد أوامر الشرطة المائلة بشكل مغلق عند فشل التسجيل، أو عند بدء تشغيل جزئي، أو
  عندما لا يطابق رمز الرد أيًا من الأوامر المسجلة.
- متطلب قابلية الوصول: يجب أن يكون من الممكن الوصول إلى نقطة نهاية الرد من خادم Mattermost.
  - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على نفس المضيف/مساحة اسم الشبكة مثل OpenClaw.
  - لا تضبط `callbackUrl` على عنوان URL الأساسي لـ Mattermost ما لم يكن هذا العنوان يمرر `/api/channels/mattermost/command` عكسيًا إلى OpenClaw.
  - فحص سريع هو `curl https://<gateway-host>/api/channels/mattermost/command`; يجب أن يعيد طلب GET القيمة `405 Method Not Allowed` من OpenClaw، وليس `404`.
- متطلب قائمة السماح لحركة الخروج في Mattermost:
  - إذا كان الرد يستهدف عناوين خاصة/tailnet/داخلية، فاضبط
    `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost ليشمل مضيف/نطاق الرد.
  - استخدم إدخالات مضيف/نطاق، وليس عناوين URL كاملة.
    - جيد: `gateway.tailnet-name.ts.net`
    - سيئ: `https://gateway.tailnet-name.ts.net`

## متغيرات البيئة (الحساب الافتراضي)

اضبط هذه القيم على مضيف Gateway إذا كنت تفضل استخدام متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

تنطبق متغيرات البيئة فقط على الحساب **الافتراضي** (`default`). يجب أن تستخدم الحسابات الأخرى قيم التكوين.

لا يمكن ضبط `MATTERMOST_URL` من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## أوضاع الدردشة

يرد Mattermost على الرسائل المباشرة تلقائيًا. ويتم التحكم في سلوك القنوات بواسطة `chatmode`:

- `oncall` (افتراضي): الرد فقط عند الإشارة بـ @ في القنوات.
- `onmessage`: الرد على كل رسالة في القناة.
- `onchar`: الرد عندما تبدأ الرسالة ببادئة تشغيل.

مثال على التكوين:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

ملاحظات:

- يظل `onchar` يرد على إشارات @ الصريحة.
- تتم مراعاة `channels.mattermost.requireMention` للتكوينات القديمة، لكن `chatmode` هو المفضل.

## سلاسل الرسائل والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم فيما إذا كانت الردود في القنوات والمجموعات ستبقى في
القناة الرئيسية أو ستبدأ سلسلة رسائل تحت المنشور الذي تسبب في التشغيل.

- `off` (افتراضي): الرد في سلسلة رسائل فقط عندما يكون المنشور الوارد موجودًا بالفعل ضمن سلسلة.
- `first`: بالنسبة إلى منشورات القنوات/المجموعات ذات المستوى الأعلى، ابدأ سلسلة رسائل تحت ذلك المنشور ووجّه
  المحادثة إلى جلسة مرتبطة بسلسلة الرسائل.
- `all`: نفس سلوك `first` في Mattermost حاليًا.
- تتجاهل الرسائل المباشرة هذا الإعداد وتبقى بدون سلاسل.

مثال على التكوين:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

ملاحظات:

- تستخدم الجلسات المرتبطة بسلسلة الرسائل معرّف المنشور الذي تسبب في التشغيل كجذر للسلسلة.
- `first` و`all` متكافئان حاليًا لأنه بمجرد أن يمتلك Mattermost جذر سلسلة رسائل،
  فإن الأجزاء اللاحقة والوسائط تستمر في نفس السلسلة.

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (يرسل المرسلون غير المعروفين رمز اقتران).
- الموافقة عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل المباشرة العامة: `channels.mattermost.dmPolicy="open"` مع `channels.mattermost.allowFrom=["*"]`.

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (محكومة بالإشارة).
- أضف المرسلين إلى قائمة السماح باستخدام `channels.mattermost.groupAllowFrom` (ويُوصى باستخدام معرّفات المستخدمين).
- توجد تجاوزات الإشارة لكل قناة تحت `channels.mattermost.groups.<channelId>.requireMention`
  أو `channels.mattermost.groups["*"].requireMention` كقيمة افتراضية.
- مطابقة `@username` قابلة للتغير ولا تُفعّل إلا عند ضبط `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (محكومة بالإشارة).
- ملاحظة وقت التشغيل: إذا كان `channels.mattermost` مفقودًا بالكامل، فسيعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

مثال:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## الأهداف للتسليم الصادر

استخدم تنسيقات الأهداف هذه مع `openclaw message send` أو Cron/Webhook:

- `channel:<id>` لقناة
- `user:<id>` لرسالة مباشرة
- `@username` لرسالة مباشرة (يتم حلها عبر Mattermost API)

المعرّفات المعتمة المجردة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم أم معرّف قناة).

يقوم OpenClaw بحلها **بأولوية المستخدم أولًا**:

- إذا كان المعرّف موجودًا كمستخدم (`GET /api/v4/users/<id>` ينجح)، فإن OpenClaw يرسل **رسالة مباشرة** عبر حل القناة المباشرة باستخدام `/api/v4/channels/direct`.
- وإلا فسيتم التعامل مع المعرّف على أنه **معرّف قناة**.

إذا كنت تحتاج إلى سلوك حتمي، فاستخدم دائمًا البادئات الصريحة (`user:<id>` / `channel:<id>`).

## إعادة محاولة قناة الرسائل المباشرة

عندما يرسل OpenClaw إلى هدف رسالة مباشرة في Mattermost ويحتاج أولًا إلى حل القناة المباشرة، فإنه
يعيد محاولة حالات الفشل العابرة في إنشاء القناة المباشرة افتراضيًا.

استخدم `channels.mattermost.dmChannelRetry` لضبط هذا السلوك عمومًا لـ Plugin Mattermost،
أو `channels.mattermost.accounts.<id>.dmChannelRetry` لحساب واحد.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

ملاحظات:

- ينطبق هذا فقط على إنشاء قناة الرسائل المباشرة (`/api/v4/channels/direct`)، وليس على كل استدعاء لـ Mattermost API.
- تنطبق إعادة المحاولة على الإخفاقات العابرة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو انتهاء المهلة.
- تُعامل أخطاء العميل 4xx بخلاف `429` على أنها دائمة ولا يُعاد المحاولة لها.

## بث المعاينة

يبث Mattermost التفكير ونشاط الأدوات ونص الرد الجزئي في **منشور معاينة مسودة** واحد يكتمل في مكانه عند أمان إرسال الإجابة النهائية. تتحدث المعاينة على نفس معرّف المنشور بدلًا من إغراق القناة برسائل لكل جزء. تؤدي النهايات الخاصة بالوسائط/الأخطاء إلى إلغاء تعديلات المعاينة المعلقة وتستخدم التسليم العادي بدلًا من تفريغ منشور معاينة مؤقت.

يمكن التمكين عبر `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

ملاحظات:

- `partial` هو الخيار المعتاد: منشور معاينة واحد يُعدَّل مع نمو الرد، ثم يُنهى بالإجابة الكاملة.
- يستخدم `block` أجزاء مسودة بنمط الإلحاق داخل منشور المعاينة.
- يعرض `progress` معاينة حالة أثناء الإنشاء ولا ينشر الإجابة النهائية إلا عند الاكتمال.
- يعطّل `off` بث المعاينة.
- إذا تعذر إنهاء البث في مكانه (على سبيل المثال إذا حُذف المنشور أثناء البث)، فسيعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا تضيع الإجابة أبدًا.
- تُخفى الحمولات التي تحتوي على التفكير فقط من منشورات القنوات، بما في ذلك النص الذي يصل على شكل blockquote من نوع `> Reasoning:`. اضبط `/reasoning on` لرؤية التفكير في واجهات أخرى؛ أما المنشور النهائي في Mattermost فيحتفظ بالإجابة فقط.
- راجع [Streaming](/ar/concepts/streaming#preview-streaming-modes) للاطلاع على مصفوفة ربط القنوات.

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- `messageId` هو معرّف منشور Mattermost.
- تقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (النقطتان اختيارية).
- اضبط `remove=true` (قيمة منطقية) لإزالة تفاعل.
- يتم تمرير أحداث إضافة/إزالة التفاعلات كأحداث نظام إلى جلسة الوكيل الموجّهة.

أمثلة:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

التكوين:

- `channels.mattermost.actions.reactions`: تمكين/تعطيل إجراءات التفاعلات (الافتراضي true).
- تجاوز لكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة الرسائل)

أرسل رسائل تحتوي على أزرار قابلة للنقر. عندما ينقر المستخدم زرًا، يتلقى الوكيل
الاختيار ويمكنه الرد.

فعّل الأزرار بإضافة `inlineButtons` إلى إمكانات القناة:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

استخدم `message action=send` مع المعامل `buttons`. الأزرار عبارة عن مصفوفة ثنائية الأبعاد (صفوف من الأزرار):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

حقول الزر:

- `text` (مطلوب): تسمية العرض.
- `callback_data` (مطلوب): القيمة التي تُعاد عند النقر (تُستخدم كمعرّف للإجراء).
- `style` (اختياري): `"default"` أو `"primary"` أو `"danger"`.

عندما ينقر المستخدم زرًا:

1. تُستبدل جميع الأزرار بسطر تأكيد (مثل: "✓ **تم اختيار نعم** بواسطة @user").
2. يتلقى الوكيل الاختيار كرسالة واردة ويرد.

ملاحظات:

- تستخدم عمليات رد الأزرار التحقق باستخدام HMAC-SHA256 (تلقائيًا، ولا حاجة إلى تكوين).
- يزيل Mattermost بيانات الرد من استجابات API الخاصة به (ميزة أمان)، لذلك
  تتم إزالة جميع الأزرار عند النقر — ولا يمكن الإزالة الجزئية.
- تُنقّى معرّفات الإجراءات التي تحتوي على شرطات أو شرطات سفلية تلقائيًا
  (قيد في توجيه Mattermost).

التكوين:

- `channels.mattermost.capabilities`: مصفوفة من سلاسل الإمكانات. أضف `"inlineButtons"` إلى
  تمكين وصف أداة الأزرار في مطالبة النظام الخاصة بالوكيل.
- `channels.mattermost.interactions.callbackBaseUrl`: عنوان URL أساسي خارجي اختياري لعمليات رد
  الأزرار (على سبيل المثال `https://gateway.example.com`). استخدم هذا عندما يتعذر على Mattermost
  الوصول إلى Gateway عند مضيف الربط الخاص به مباشرةً.
- في إعدادات الحسابات المتعددة، يمكنك أيضًا ضبط الحقل نفسه تحت
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- إذا تم حذف `interactions.callbackBaseUrl`، فسيشتق OpenClaw عنوان URL للرد من
  `gateway.customBindHost` + `gateway.port`، ثم يعود إلى `http://localhost:<port>`.
- قاعدة قابلية الوصول: يجب أن يكون عنوان URL لرد الزر قابلاً للوصول من خادم Mattermost.
  لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على نفس المضيف/مساحة اسم الشبكة.
- إذا كان هدف الرد خاصًا/tailnet/داخليًا، فأضف مضيفه/نطاقه إلى
  `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.

### التكامل المباشر مع API (البرامج النصية الخارجية)

يمكن للبرامج النصية الخارجية وWebhook نشر الأزرار مباشرةً عبر Mattermost REST API
بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من
Plugin متى أمكن؛ وإذا كنت سترسل JSON خامًا، فاتبع هذه القواعد:

**بنية الحمولة:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

**القواعد الحرجة:**

1. يجب أن توضع المرفقات في `props.attachments`، وليس في `attachments` على المستوى الأعلى (وإلا يتم تجاهلها بصمت).
2. يحتاج كل إجراء إلى `type: "button"` — وبدونه، يتم ابتلاع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id` — يتجاهل Mattermost الإجراءات التي لا تحتوي على معرّفات.
4. يجب أن يكون `id` الخاص بالإجراء **أبجديًا رقميًا فقط** (`[a-zA-Z0-9]`). الشرطات والشرطات السفلية تكسر
   توجيه الإجراءات على جانب خادم Mattermost (تعيد 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` الخاصة بالزر حتى تعرض رسالة التأكيد
   اسم الزر (مثل "Approve") بدلًا من معرّف خام.
6. الحقل `context.action_id` مطلوب — يعيد معالج التفاعل 400 من دونه.

**توليد رمز HMAC:**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب على البرامج النصية الخارجية إنشاء رموز
تطابق منطق التحقق في Gateway:

1. اشتق السر من رمز البوت:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. ابنِ كائن السياق بكل الحقول **باستثناء** `_token`.
3. نفّذ التسلسل باستخدام **مفاتيح مرتبة** و**من دون مسافات** (يستخدم Gateway `JSON.stringify`
   مع مفاتيح مرتبة، ما ينتج مخرجات مضغوطة).
4. وقّع: `HMAC-SHA256(key=secret, data=serializedContext)`
5. أضف ملخص hex الناتج كقيمة `_token` في السياق.

مثال Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

المشكلات الشائعة في HMAC:

- يضيف `json.dumps` في Python مسافات افتراضيًا (`{"key": "val"}`). استخدم
  `separators=(",", ":")` لمطابقة المخرجات المضغوطة في JavaScript (`{"key":"val"}`).
- وقّع دائمًا **جميع** حقول السياق (باستثناء `_token`). يزيل Gateway الحقل `_token` ثم
  يوقّع كل ما تبقى. توقيع مجموعة فرعية يسبب فشل التحقق بصمت.
- استخدم `sort_keys=True` — يرتب Gateway المفاتيح قبل التوقيع، وقد يعيد Mattermost
  ترتيب حقول السياق عند تخزين الحمولة.
- اشتق السر من رمز البوت (بشكل حتمي)، وليس من بايتات عشوائية. يجب أن يكون السر
  نفسه عبر العملية التي تنشئ الأزرار وGateway الذي يتحقق منها.

## مهايئ الدليل

يتضمن Plugin Mattermost مهايئ دليل يحل أسماء القنوات والمستخدمين
عبر Mattermost API. يتيح هذا استخدام الأهداف `#channel-name` و`@username` في
`openclaw message send` وعمليات تسليم Cron/Webhook.

لا حاجة إلى أي تكوين — يستخدم المهايئ رمز البوت من تكوين الحساب.

## الحسابات المتعددة

يدعم Mattermost حسابات متعددة تحت `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

- لا توجد ردود في القنوات: تأكد من أن البوت موجود في القناة واذكره (oncall)، أو استخدم بادئة تشغيل (onchar)، أو اضبط `chatmode: "onmessage"`.
- أخطاء المصادقة: تحقق من رمز البوت وعنوان URL الأساسي وما إذا كان الحساب ممكّنًا.
- مشكلات الحسابات المتعددة: تنطبق متغيرات البيئة على الحساب `default` فقط.
- تعيد أوامر الشرطة المائلة الأصلية `Unauthorized: invalid command token.`: لم يقبل OpenClaw
  رمز الرد. الأسباب الشائعة:
  - فشل تسجيل أوامر الشرطة المائلة أو اكتمل جزئيًا فقط عند بدء التشغيل
  - يصل الرد إلى Gateway/الحساب الخطأ
  - لا يزال Mattermost يحتوي على أوامر قديمة تشير إلى هدف رد سابق
  - أُعيد تشغيل Gateway من دون إعادة تفعيل أوامر الشرطة المائلة
- إذا توقفت أوامر الشرطة المائلة الأصلية عن العمل، فتحقق من السجلات بحثًا عن
  `mattermost: failed to register slash commands` أو
  `mattermost: native slash commands enabled but no commands could be registered`.
- إذا تم حذف `callbackUrl` وكانت السجلات تحذر من أن الرد تم حله إلى
  `http://127.0.0.1:18789/...`، فمن المرجح أن يكون هذا العنوان قابلاً للوصول فقط عندما
  يعمل Mattermost على نفس المضيف/مساحة اسم الشبكة مثل OpenClaw. اضبط
  `commands.callbackUrl` صريحًا وقابلاً للوصول خارجيًا بدلًا من ذلك.
- تظهر الأزرار كمربعات بيضاء: قد يكون الوكيل يرسل بيانات أزرار غير صحيحة البنية. تحقق من أن كل زر يحتوي على الحقلين `text` و`callback_data`.
- تُعرَض الأزرار لكن النقرات لا تفعل شيئًا: تحقق من أن `AllowedUntrustedInternalConnections` في تكوين خادم Mattermost يتضمن `127.0.0.1 localhost`، وأن `EnablePostActionIntegration` تساوي `true` في `ServiceSettings`.
- تعيد الأزرار 404 عند النقر: من المحتمل أن `id` الخاص بالزر يحتوي على شرطات أو شرطات سفلية. يتعطل موجّه الإجراءات في Mattermost مع المعرّفات غير الأبجدية الرقمية. استخدم `[a-zA-Z0-9]` فقط.
- يسجل Gateway الرسالة `invalid _token`: عدم تطابق HMAC. تحقق من أنك توقّع جميع حقول السياق (وليس مجموعة فرعية)، وتستخدم مفاتيح مرتبة، وJSON مضغوطًا (من دون مسافات). راجع قسم HMAC أعلاه.
- يسجل Gateway الرسالة `missing _token in context`: الحقل `_token` غير موجود في سياق الزر. تأكد من تضمينه عند بناء حمولة التكامل.
- يعرض التأكيد معرّفًا خامًا بدلًا من اسم الزر: `context.action_id` لا يطابق `id` الخاص بالزر. اضبط القيمتين على نفس القيمة المنقّاة.
- الوكيل لا يعرف الأزرار: أضف `capabilities: ["inlineButtons"]` إلى تكوين قناة Mattermost.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية والتحكم عبر الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
