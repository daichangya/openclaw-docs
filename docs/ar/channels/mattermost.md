---
read_when:
    - إعداد Mattermost
    - تصحيح أخطاء توجيه Mattermost
summary: إعداد بوت Mattermost وتكوين OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T04:20:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

الحالة: plugin مضمّن (رمز bot المميز + أحداث WebSocket). القنوات والمجموعات والرسائل المباشرة مدعومة.
Mattermost هي منصة مراسلة فرق قابلة للاستضافة الذاتية؛ راجع الموقع الرسمي على
[mattermost.com](https://mattermost.com) للحصول على تفاصيل المنتج والتنزيلات.

## Plugin المضمّن

يأتي Mattermost كـ plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
الإصدارات المجمّعة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Mattermost،
فقم بتثبيته يدويًا:

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

1. تأكد من أن plugin الخاص بـ Mattermost متاح.
   - إصدارات OpenClaw المجمّعة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ حساب bot في Mattermost وانسخ **رمز bot المميز**.
3. انسخ **عنوان URL الأساسي** الخاص بـ Mattermost (مثل: `https://chat.example.com`).
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

## أوامر slash الأصلية

أوامر slash الأصلية اختيارية. عند تفعيلها، يقوم OpenClaw بتسجيل أوامر slash من نوع `oc_*` عبر
واجهة Mattermost API ويتلقى طلبات POST المرتدة على خادم HTTP الخاص بـ Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // استخدم هذا عندما يتعذر على Mattermost الوصول إلى Gateway مباشرةً (وكيل عكسي/عنوان URL عام).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

ملاحظات:

- القيمة الافتراضية لـ `native: "auto"` هي التعطيل في Mattermost. اضبط `native: true` للتفعيل.
- إذا تم حذف `callbackUrl`، فسيشتق OpenClaw القيمة من مضيف/منفذ Gateway + `callbackPath`.
- في إعدادات الحسابات المتعددة، يمكن ضبط `commands` في المستوى الأعلى أو تحت
  `channels.mattermost.accounts.<id>.commands` (قيم الحساب تتجاوز حقول المستوى الأعلى).
- يتم التحقق من صحة callbacks الخاصة بالأوامر باستخدام الرموز المميزة الخاصة بكل أمر التي يعيدها
  Mattermost عندما يسجل OpenClaw أوامر `oc_*`.
- تفشل callbacks الخاصة بـ slash بشكل مغلق عندما يفشل التسجيل، أو يكون بدء التشغيل جزئيًا، أو
  لا يطابق رمز callback المميز أيًا من الأوامر المسجلة.
- متطلب قابلية الوصول: يجب أن تكون نقطة نهاية callback قابلة للوصول من خادم Mattermost.
  - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على نفس المضيف/نطاق الشبكة مثل OpenClaw.
  - لا تضبط `callbackUrl` على عنوان URL الأساسي الخاص بـ Mattermost إلا إذا كان ذلك العنوان يمرر `/api/channels/mattermost/command` عبر وكيل عكسي إلى OpenClaw.
  - فحص سريع هو `curl https://<gateway-host>/api/channels/mattermost/command`; يجب أن يعيد طلب GET القيمة `405 Method Not Allowed` من OpenClaw، وليس `404`.
- متطلب قائمة السماح لخروج Mattermost:
  - إذا كان callback يستهدف عناوين خاصة/tailnet/داخلية، فاضبط
    `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost ليشمل مضيف/نطاق callback.
  - استخدم إدخالات المضيف/النطاق، وليس عناوين URL كاملة.
    - صحيح: `gateway.tailnet-name.ts.net`
    - غير صحيح: `https://gateway.tailnet-name.ts.net`

## متغيرات البيئة (الحساب الافتراضي)

اضبط هذه القيم على مضيف Gateway إذا كنت تفضل استخدام متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

تنطبق متغيرات البيئة فقط على الحساب **الافتراضي** (`default`). يجب أن تستخدم الحسابات الأخرى قيم التكوين.

## أوضاع الدردشة

يرد Mattermost على الرسائل المباشرة تلقائيًا. يتم التحكم في سلوك القنوات بواسطة `chatmode`:

- `oncall` (الافتراضي): الرد فقط عند الإشارة بـ @ في القنوات.
- `onmessage`: الرد على كل رسالة في القناة.
- `onchar`: الرد عندما تبدأ الرسالة ببادئة تشغيل.

مثال للتكوين:

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

- يستمر `onchar` في الرد على الإشارات الصريحة بـ @.
- لا يزال `channels.mattermost.requireMention` مدعومًا للتكوينات القديمة، لكن يُفضَّل `chatmode`.

## سلاسل الرسائل والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم فيما إذا كانت الردود في القنوات والمجموعات ستبقى في
القناة الرئيسية أو ستبدأ سلسلة رسائل تحت المنشور الذي تسبب في التشغيل.

- `off` (الافتراضي): لا يتم الرد في سلسلة رسائل إلا إذا كان المنشور الوارد موجودًا فيها بالفعل.
- `first`: بالنسبة لمنشورات القنوات/المجموعات من المستوى الأعلى، ابدأ سلسلة رسائل تحت ذلك المنشور ووجّه
  المحادثة إلى جلسة ضمن نطاق سلسلة الرسائل.
- `all`: نفس سلوك `first` في Mattermost حاليًا.
- تتجاهل الرسائل المباشرة هذا الإعداد وتبقى خارج سلاسل الرسائل.

مثال للتكوين:

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

- تستخدم الجلسات ضمن نطاق سلسلة الرسائل معرّف المنشور الذي تسبب في التشغيل كجذر للسلسلة.
- `first` و`all` متكافئان حاليًا لأنه بمجرد أن يمتلك Mattermost جذر سلسلة رسائل،
  تستمر الأجزاء اللاحقة والوسائط داخل نفس السلسلة.

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (المرسلون غير المعروفين يحصلون على رمز اقتران).
- الموافقة عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل المباشرة العامة: `channels.mattermost.dmPolicy="open"` بالإضافة إلى `channels.mattermost.allowFrom=["*"]`.

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (مقيّد بالإشارة).
- أضف المرسلين إلى قائمة السماح باستخدام `channels.mattermost.groupAllowFrom` (يوصى بمعرّفات المستخدمين).
- توجد تجاوزات الإشارة لكل قناة تحت `channels.mattermost.groups.<channelId>.requireMention`
  أو `channels.mattermost.groups["*"].requireMention` كقيمة افتراضية.
- مطابقة `@username` قابلة للتغيير ولا يتم تفعيلها إلا عندما تكون `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (مقيّدة بالإشارة).
- ملاحظة وقت التشغيل: إذا كانت `channels.mattermost` مفقودة بالكامل، فإن وقت التشغيل يعود إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

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

استخدم تنسيقات الهدف هذه مع `openclaw message send` أو Cron/Webhook:

- `channel:<id>` لقناة
- `user:<id>` لرسالة مباشرة
- `@username` لرسالة مباشرة (يتم حلها عبر Mattermost API)

المعرّفات الغامضة المجردة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم أم معرّف قناة).

يقوم OpenClaw بحلها **مستخدم أولًا**:

- إذا كان المعرّف موجودًا كمستخدم (`GET /api/v4/users/<id>` ينجح)، يرسل OpenClaw **رسالة مباشرة** عبر حل القناة المباشرة من خلال `/api/v4/channels/direct`.
- وإلا فسيتم التعامل مع المعرّف على أنه **معرّف قناة**.

إذا كنت بحاجة إلى سلوك حتمي، فاستخدم دائمًا البوادئ الصريحة (`user:<id>` / `channel:<id>`).

## إعادة محاولة قناة الرسائل المباشرة

عندما يرسل OpenClaw إلى هدف رسالة مباشرة في Mattermost ويحتاج إلى حل القناة المباشرة أولًا، فإنه
يعيد محاولة حالات الفشل المؤقتة في إنشاء القناة المباشرة افتراضيًا.

استخدم `channels.mattermost.dmChannelRetry` لضبط هذا السلوك عالميًا لـ plugin الخاص بـ Mattermost،
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

- ينطبق هذا فقط على إنشاء قناة الرسائل المباشرة (`/api/v4/channels/direct`)، وليس على كل استدعاء في Mattermost API.
- تنطبق إعادة المحاولة على حالات الفشل المؤقتة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو انتهاء المهلة.
- تُعامل أخطاء العميل 4xx بخلاف `429` على أنها دائمة ولا تتم إعادة محاولتها.

## بث المعاينة

يقوم Mattermost ببث التفكير ونشاط الأداة والنص الجزئي للرد داخل **منشور معاينة مسودة** واحد يتم تثبيته في مكانه عندما تصبح الإجابة النهائية آمنة للإرسال. تُحدَّث المعاينة على نفس معرّف المنشور بدلًا من إغراق القناة برسائل لكل جزء. تؤدي النهايات التي تحتوي على وسائط/أخطاء إلى إلغاء تعديلات المعاينة المعلقة واستخدام التسليم العادي بدلًا من تفريغ منشور معاينة مؤقت.

فعّل ذلك عبر `channels.mattermost.streaming`:

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

- `partial` هو الخيار المعتاد: منشور معاينة واحد يتم تعديله مع نمو الرد، ثم يُثبَّت بالإجابة الكاملة.
- يستخدم `block` أجزاء مسودة بأسلوب الإلحاق داخل منشور المعاينة.
- يعرض `progress` معاينة حالة أثناء التوليد ثم ينشر الإجابة النهائية فقط عند الاكتمال.
- يعطّل `off` بث المعاينة.
- إذا تعذر تثبيت البث في مكانه (على سبيل المثال إذا تم حذف المنشور أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا تضيع الإجابة أبدًا.
- راجع [Streaming](/ar/concepts/streaming#preview-streaming-modes) للاطلاع على مصفوفة تعيين القنوات.

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- `messageId` هو معرّف منشور Mattermost.
- يقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (النقطتان اختيارية).
- اضبط `remove=true` (منطقي) لإزالة تفاعل.
- تتم إعادة توجيه أحداث إضافة/إزالة التفاعل كأحداث نظام إلى جلسة الوكيل الموجّهة.

أمثلة:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

التكوين:

- `channels.mattermost.actions.reactions`: تفعيل/تعطيل إجراءات التفاعل (الافتراضي true).
- تجاوز لكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة الرسائل)

أرسل رسائل تحتوي على أزرار قابلة للنقر. عندما ينقر المستخدم زرًا، يتلقى الوكيل
الاختيار ويمكنه الرد.

فعّل الأزرار بإضافة `inlineButtons` إلى قدرات القناة:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

استخدم `message action=send` مع معلمة `buttons`. الأزرار عبارة عن مصفوفة ثنائية الأبعاد (صفوف من الأزرار):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

حقول الزر:

- `text` (مطلوب): تسمية العرض.
- `callback_data` (مطلوب): القيمة التي تُرسل عند النقر (تُستخدم كمعرّف الإجراء).
- `style` (اختياري): `"default"` أو `"primary"` أو `"danger"`.

عندما ينقر مستخدم زرًا:

1. يتم استبدال جميع الأزرار بسطر تأكيد (مثل: "✓ **Yes** selected by @user").
2. يتلقى الوكيل الاختيار كرسالة واردة ويرد.

ملاحظات:

- تستخدم callbacks الخاصة بالأزرار التحقق بواسطة HMAC-SHA256 (تلقائي، لا حاجة إلى إعداد).
- يزيل Mattermost بيانات callback من استجابات API الخاصة به (ميزة أمان)، لذلك تتم إزالة جميع الأزرار
  عند النقر — ولا يمكن الإزالة الجزئية.
- يتم تنظيف معرّفات الإجراءات التي تحتوي على شرطات أو شرطات سفلية تلقائيًا
  (قيد في التوجيه لدى Mattermost).

التكوين:

- `channels.mattermost.capabilities`: مصفوفة من سلاسل القدرات. أضف `"inlineButtons"` إلى
  تفعيل وصف أداة الأزرار في system prompt الخاص بالوكيل.
- `channels.mattermost.interactions.callbackBaseUrl`: عنوان URL أساسي خارجي اختياري لعمليات callback الخاصة بالأزرار
  (على سبيل المثال `https://gateway.example.com`). استخدم هذا عندما يتعذر على Mattermost
  الوصول إلى Gateway مباشرةً على مضيف الربط الخاص به.
- في إعدادات الحسابات المتعددة، يمكنك أيضًا ضبط الحقل نفسه تحت
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- إذا تم حذف `interactions.callbackBaseUrl`، فسيشتق OpenClaw عنوان URL الخاص بـ callback من
  `gateway.customBindHost` + `gateway.port`، ثم يعود إلى `http://localhost:<port>`.
- قاعدة قابلية الوصول: يجب أن يكون عنوان URL الخاص بـ callback للأزرار قابلاً للوصول من خادم Mattermost.
  لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على نفس المضيف/نطاق الشبكة.
- إذا كان هدف callback خاصًا/داخليًا/tailnet، فأضف مضيفه/نطاقه إلى
  `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.

### تكامل API مباشر (برامج نصية خارجية)

يمكن للبرامج النصية الخارجية وWebhooks نشر الأزرار مباشرةً عبر Mattermost REST API
بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من
الامتداد عندما يكون ذلك ممكنًا؛ وإذا كنت سترسل JSON خامًا، فاتبع هذه القواعد:

**بنية الحمولة:**

```json5
{
  channel_id: "<channelId>",
  message: "اختر خيارًا:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // أحرف وأرقام فقط — انظر أدناه
            type: "button", // مطلوب، وإلا فسيتم تجاهل النقرات بصمت
            name: "موافقة", // تسمية العرض
            style: "primary", // اختياري: "default" أو "primary" أو "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // يجب أن يطابق معرّف الزر (للبحث عن الاسم)
                action: "approve",
                // ... أي حقول مخصصة ...
                _token: "<hmac>", // راجع قسم HMAC أدناه
              },
            },
          },
        ],
      },
    ],
  },
}
```

**قواعد حرجة:**

1. توضع المرفقات في `props.attachments`، وليس في `attachments` على المستوى الأعلى (سيتم تجاهلها بصمت).
2. يحتاج كل إجراء إلى `type: "button"` — وبدونه سيتم ابتلاع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id` — يتجاهل Mattermost الإجراءات التي لا تحتوي على معرّفات.
4. يجب أن يكون `id` الخاص بالإجراء **أبجديًا رقميًا فقط** (`[a-zA-Z0-9]`). تؤدي الشرطات والشرطات السفلية إلى كسر
   توجيه الإجراءات على جانب خادم Mattermost (ويعيد 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` الخاصة بالزر حتى تعرض رسالة التأكيد
   اسم الزر (مثل "موافقة") بدلًا من معرّف خام.
6. الحقل `context.action_id` مطلوب — يعيد معالج التفاعل 400 بدونه.

**إنشاء رمز HMAC المميز:**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب على البرامج النصية الخارجية إنشاء رموز مميزة
تطابق منطق التحقق في Gateway:

1. اشتق السر من رمز bot المميز:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. أنشئ كائن context مع جميع الحقول **باستثناء** `_token`.
3. قم بالتسلسل باستخدام **مفاتيح مرتبة** و**من دون مسافات** (يستخدم Gateway الدالة `JSON.stringify`
   مع مفاتيح مرتبة، ما ينتج مخرجات مضغوطة).
4. وقّع باستخدام: `HMAC-SHA256(key=secret, data=serializedContext)`
5. أضف ملخص hex الناتج كقيمة `_token` في context.

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

- تضيف `json.dumps` في Python مسافات افتراضيًا (`{"key": "val"}`). استخدم
  `separators=(",", ":")` لمطابقة المخرجات المضغوطة في JavaScript (`{"key":"val"}`).
- وقّع دائمًا **جميع** حقول context (باستثناء `_token`). يزيل Gateway الحقل `_token` ثم
  يوقّع كل ما تبقى. يؤدي توقيع مجموعة فرعية إلى فشل التحقق بصمت.
- استخدم `sort_keys=True` — يرتب Gateway المفاتيح قبل التوقيع، وقد يقوم Mattermost
  بإعادة ترتيب حقول context عند تخزين الحمولة.
- اشتق السر من رمز bot المميز (بصورة حتمية)، وليس من بايتات عشوائية. يجب أن يكون السر
  نفسه عبر العملية التي تنشئ الأزرار وGateway الذي يتحقق منها.

## مُهايئ الدليل

يتضمن plugin الخاص بـ Mattermost مُهايئ دليل يحل أسماء القنوات والمستخدمين
عبر Mattermost API. يتيح هذا استخدام الأهداف `#channel-name` و`@username` في
`openclaw message send` وعمليات التسليم الخاصة بـ Cron/Webhook.

لا حاجة إلى أي إعداد — يستخدم المُهايئ رمز bot المميز من تكوين الحساب.

## حسابات متعددة

يدعم Mattermost حسابات متعددة تحت `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "أساسي", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "التنبيهات", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

- لا توجد ردود في القنوات: تأكد من أن bot موجود في القناة وأنك تشير إليه (oncall)، أو استخدم بادئة تشغيل (onchar)، أو اضبط `chatmode: "onmessage"`.
- أخطاء المصادقة: تحقق من رمز bot المميز، وعنوان URL الأساسي، وما إذا كان الحساب مفعّلًا.
- مشكلات الحسابات المتعددة: تنطبق متغيرات البيئة فقط على الحساب `default`.
- تعيد أوامر slash الأصلية `Unauthorized: invalid command token.`: لم
  يقبل OpenClaw رمز callback المميز. من الأسباب الشائعة:
  - فشل تسجيل أوامر slash أو اكتمل جزئيًا فقط عند بدء التشغيل
  - يتم توجيه callback إلى Gateway/حساب غير صحيح
  - لا يزال Mattermost يحتوي على أوامر قديمة تشير إلى هدف callback سابق
  - تمت إعادة تشغيل Gateway من دون إعادة تنشيط أوامر slash الأصلية
- إذا توقفت أوامر slash الأصلية عن العمل، فتحقق من السجلات بحثًا عن
  `mattermost: failed to register slash commands` أو
  `mattermost: native slash commands enabled but no commands could be registered`.
- إذا تم حذف `callbackUrl` وكانت السجلات تحذر من أن callback تم حله إلى
  `http://127.0.0.1:18789/...`، فمن المحتمل أن يكون هذا العنوان قابلاً للوصول فقط عندما
  يعمل Mattermost على نفس المضيف/نطاق الشبكة مثل OpenClaw. اضبط
  `commands.callbackUrl` صريحًا وقابلاً للوصول خارجيًا بدلًا من ذلك.
- تظهر الأزرار كمربعات بيضاء: ربما يرسل الوكيل بيانات أزرار غير صحيحة. تحقق من أن كل زر يحتوي على الحقلين `text` و`callback_data`.
- تُعرض الأزرار لكن النقرات لا تفعل شيئًا: تحقّق من أن `AllowedUntrustedInternalConnections` في إعدادات خادم Mattermost تتضمن `127.0.0.1 localhost`، وأن `EnablePostActionIntegration` تساوي `true` في ServiceSettings.
- تعيد الأزرار 404 عند النقر: من المحتمل أن `id` الخاص بالزر يحتوي على شرطات أو شرطات سفلية. يتعطل موجه الإجراءات في Mattermost مع المعرّفات غير الأبجدية الرقمية. استخدم `[a-zA-Z0-9]` فقط.
- تعرض سجلات Gateway الرسالة `invalid _token`: عدم تطابق HMAC. تحقق من أنك توقّع جميع حقول context (وليس مجموعة فرعية)، وتستخدم مفاتيح مرتبة، وJSON مضغوطًا (من دون مسافات). راجع قسم HMAC أعلاه.
- تعرض سجلات Gateway الرسالة `missing _token in context`: الحقل `_token` غير موجود في context الخاص بالزر. تأكد من تضمينه عند إنشاء حمولة التكامل.
- يعرض التأكيد معرّفًا خامًا بدلًا من اسم الزر: لا تطابق قيمة `context.action_id` قيمة `id` الخاصة بالزر. اضبط الاثنين على القيمة المنظفة نفسها.
- لا يعرف الوكيل الأزرار: أضف `capabilities: ["inlineButtons"]` إلى تكوين قناة Mattermost.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
