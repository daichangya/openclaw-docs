---
read_when:
    - إعداد Mattermost
    - تصحيح أخطاء توجيه Mattermost
summary: إعداد بوت Mattermost وتكوين OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T07:19:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04913fe38ddce73eba2a7f3953ec3241b6871ce4a06e0393d09331e37a39cc2f
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

الحالة: Plugin مضمّن (رمز bot token + أحداث WebSocket). القنوات والمجموعات والرسائل الخاصة مدعومة.
Mattermost هو منصة مراسلة فرق قابلة للاستضافة الذاتية؛ راجع الموقع الرسمي على
[mattermost.com](https://mattermost.com) لمعرفة تفاصيل المنتج والتنزيلات.

## Plugin المضمّن

يأتي Mattermost كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البُنى المجمّعة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Mattermost،
فثبّته يدويًا:

التثبيت عبر CLI (سجل npm):

```bash
openclaw plugins install @openclaw/mattermost
```

نسخة محلية من المستودع (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع

1. تأكد من أن Plugin Mattermost متاح.
   - إصدارات OpenClaw المجمّعة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم أو المخصصة إضافته يدويًا بالأوامر أعلاه.
2. أنشئ حساب bot في Mattermost وانسخ **bot token**.
3. انسخ **base URL** الخاص بـ Mattermost (مثل `https://chat.example.com`).
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

أوامر slash الأصلية تعمل بنظام الاشتراك الاختياري. عند تفعيلها، يسجّل OpenClaw أوامر slash من نوع `oc_*` عبر
واجهة Mattermost API ويتلقى طلبات POST المرتدة على خادم HTTP الخاص بـ Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // استخدم هذا عندما لا يتمكن Mattermost من الوصول إلى Gateway مباشرة (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

ملاحظات:

- القيمة الافتراضية لـ `native: "auto"` هي التعطيل في Mattermost. اضبط `native: true` للتفعيل.
- إذا لم يتم تحديد `callbackUrl`، فسيشتقه OpenClaw من host/port الخاص بـ Gateway مع `callbackPath`.
- في إعدادات الحسابات المتعددة، يمكن ضبط `commands` على المستوى الأعلى أو تحت
  `channels.mattermost.accounts.<id>.commands` (قيم الحساب تتجاوز حقول المستوى الأعلى).
- يتم التحقق من نداءات الأوامر المرتدة باستخدام الرموز المميزة الخاصة بكل أمر التي يعيدها
  Mattermost عندما يسجّل OpenClaw أوامر `oc_*`.
- تفشل نداءات slash المرتدة بشكل مغلق عند فشل التسجيل، أو كان الإقلاع جزئيًا، أو
  لم يتطابق رمز النداء المرتد مع أحد الأوامر المسجّلة.
- متطلب قابلية الوصول: يجب أن يكون endpoint النداء المرتد قابلاً للوصول من خادم Mattermost.
  - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على نفس المضيف/حيّز الشبكة مثل OpenClaw.
  - لا تضبط `callbackUrl` على base URL الخاص بـ Mattermost ما لم يكن ذلك العنوان يمرر `/api/channels/mattermost/command` عبر reverse proxy إلى OpenClaw.
  - فحص سريع هو `curl https://<gateway-host>/api/channels/mattermost/command`; يجب أن يعيد طلب GET القيمة `405 Method Not Allowed` من OpenClaw وليس `404`.
- متطلب قائمة السماح الصادرة في Mattermost:
  - إذا كان callback الخاص بك يستهدف عناوين خاصة أو tailnet أو داخلية، فاضبط
    `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost ليشمل host/domain الخاص بالـ callback.
  - استخدم إدخالات host/domain، وليس عناوين URL كاملة.
    - صحيح: `gateway.tailnet-name.ts.net`
    - خطأ: `https://gateway.tailnet-name.ts.net`

## متغيرات البيئة (الحساب الافتراضي)

اضبط هذه القيم على مضيف Gateway إذا كنت تفضّل استخدام متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

تنطبق متغيرات البيئة فقط على الحساب **الافتراضي** (`default`). أما الحسابات الأخرى فيجب أن تستخدم قيم التكوين.

<Note>
`MATTERMOST_URL` موجود في قائمة حظر كتل endpoint ولا يمكن ضبطه من
ملف workspace `.env`.
ويجب أن يأتي من بيئة shell أو من بيئة عملية Gateway حتى لا تتمكن
مساحات العمل غير الموثوقة من إعادة توجيه حركة Mattermost
إلى خادم مختلف. راجع
[ملفات workspace `.env`](/ar/gateway/security) للاطلاع على القائمة الكاملة.
</Note>

## أوضاع الدردشة

يرد Mattermost على الرسائل الخاصة تلقائيًا. أما سلوك القنوات فيتحكم فيه `chatmode`:

- `oncall` (الافتراضي): الرد فقط عند الإشارة إليه @mention في القنوات.
- `onmessage`: الرد على كل رسالة في القناة.
- `onchar`: الرد عندما تبدأ الرسالة ببادئة trigger.

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

- لا يزال `onchar` يرد على إشارات @mention الصريحة.
- يتم احترام `channels.mattermost.requireMention` في التكوينات القديمة، لكن `chatmode` هو المفضل.

## سلاسل الرسائل والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم في ما إذا كانت الردود في القنوات والمجموعات تبقى في
القناة الرئيسية أو تبدأ سلسلة رسائل تحت المنشور الذي فعّلها.

- `off` (الافتراضي): الرد في سلسلة رسائل فقط عندما يكون المنشور الوارد ضمن سلسلة بالفعل.
- `first`: بالنسبة لمنشورات القنوات/المجموعات ذات المستوى الأعلى، ابدأ سلسلة رسائل تحت ذلك المنشور ووجّه
  المحادثة إلى جلسة ضمن نطاق سلسلة الرسائل.
- `all`: السلوك نفسه مثل `first` في Mattermost حاليًا.
- تتجاهل الرسائل الخاصة هذا الإعداد وتبقى دون سلاسل رسائل.

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

- تستخدم الجلسات ضمن نطاق سلسلة الرسائل معرّف المنشور الذي فعّلها كجذر للسلسلة.
- `first` و`all` متكافئان حاليًا لأنه بمجرد أن يمتلك Mattermost جذر سلسلة رسائل،
  تستمر المتابعات والوسائط في نفس تلك السلسلة.

## التحكم في الوصول (الرسائل الخاصة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (المرسلون غير المعروفين يحصلون على رمز pairing).
- الموافقة عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل الخاصة العامة: `channels.mattermost.dmPolicy="open"` مع `channels.mattermost.allowFrom=["*"]`.

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (مقيد بالإشارة mention).
- أضف المرسلين إلى قائمة السماح باستخدام `channels.mattermost.groupAllowFrom` (يوصى بمعرّفات المستخدمين).
- توجد تجاوزات الإشارة لكل قناة تحت `channels.mattermost.groups.<channelId>.requireMention`
  أو `channels.mattermost.groups["*"].requireMention` كقيمة افتراضية.
- المطابقة عبر `@username` قابلة للتغيّر ولا تُفعّل إلا عندما تكون `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (مقيدة بالإشارة mention).
- ملاحظة وقت التشغيل: إذا كان `channels.mattermost` مفقودًا بالكامل، فسيعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى لو كان `channels.defaults.groupPolicy` مضبوطًا).

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

استخدم صيغ الأهداف هذه مع `openclaw message send` أو مع Cron/Webhooks:

- `channel:<id>` لقناة
- `user:<id>` لرسالة خاصة
- `@username` لرسالة خاصة (يتم حلّها عبر Mattermost API)

المعرّفات المبهمة المجردة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم أم معرّف قناة).

يقوم OpenClaw بحلّها **بأولوية المستخدم أولًا**:

- إذا كان المعرّف موجودًا كمستخدم (`GET /api/v4/users/<id>` ينجح)، يرسل OpenClaw **رسالة خاصة** عبر حلّ القناة المباشرة من خلال `/api/v4/channels/direct`.
- خلاف ذلك، يُعامل المعرّف على أنه **معرّف قناة**.

إذا كنت تحتاج إلى سلوك حتمي، فاستخدم دائمًا البوادئ الصريحة (`user:<id>` / `channel:<id>`).

## إعادة محاولة قناة الرسائل الخاصة

عندما يرسل OpenClaw إلى هدف رسالة خاصة في Mattermost ويحتاج أولًا إلى حل القناة المباشرة،
فإنه يعيد المحاولة تلقائيًا عند حالات الفشل العابرة في إنشاء القناة المباشرة.

استخدم `channels.mattermost.dmChannelRetry` لضبط هذا السلوك على مستوى Plugin Mattermost بالكامل،
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

- ينطبق هذا فقط على إنشاء قناة الرسائل الخاصة (`/api/v4/channels/direct`)، وليس على كل استدعاء لـ Mattermost API.
- تنطبق إعادة المحاولة على حالات الفشل العابرة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو انتهاء المهلة.
- تُعامل أخطاء العميل 4xx بخلاف `429` على أنها دائمة ولا يُعاد المحاولة فيها.

## بث المعاينة

يبث Mattermost التفكير ونشاط الأدوات والنص الجزئي للرد في **منشور معاينة مسودة** واحد يُنهى في مكانه عندما يصبح إرسال الإجابة النهائية آمنًا. تُحدَّث المعاينة على نفس معرّف المنشور بدلًا من إغراق القناة برسائل لكل جزء. وتُلغي النهايات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة وتستخدم التسليم العادي بدلًا من تفريغ منشور معاينة مؤقت.

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

- `partial` هو الخيار المعتاد: منشور معاينة واحد يُحرَّر مع نمو الرد، ثم يُنهى بالإجابة الكاملة.
- يستخدم `block` أجزاء مسودة بنمط الإلحاق داخل منشور المعاينة.
- يعرض `progress` معاينة حالة أثناء التوليد وينشر الإجابة النهائية فقط عند الاكتمال.
- `off` يعطّل بث المعاينة.
- إذا تعذر إنهاء البث في مكانه (مثلًا إذا حُذف المنشور أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا تضيع الإجابة أبدًا.
- تُحجب الحمولة الخاصة بالتفكير فقط من منشورات القناة، بما في ذلك النص الذي يصل على شكل blockquote `> Reasoning:`. اضبط `/reasoning on` لرؤية التفكير في أسطح أخرى؛ أما المنشور النهائي في Mattermost فيحتفظ بالإجابة فقط.
- راجع [Streaming](/ar/concepts/streaming#preview-streaming-modes) لمصفوفة الربط الخاصة بالقنوات.

## التفاعلات (أداة message)

- استخدم `message action=react` مع `channel=mattermost`.
- `messageId` هو معرّف منشور Mattermost.
- يقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (النقطتان اختياريتان).
- اضبط `remove=true` (boolean) لإزالة تفاعل.
- يتم تمرير أحداث إضافة/إزالة التفاعلات كأحداث نظام إلى جلسة الوكيل الموجّهة.

أمثلة:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

التكوين:

- `channels.mattermost.actions.reactions`: تفعيل/تعطيل إجراءات التفاعل (الافتراضي true).
- تجاوز لكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة message)

أرسل رسائل تحتوي على أزرار قابلة للنقر. عندما ينقر مستخدم زرًا، يتلقى الوكيل
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

استخدم `message action=send` مع وسيطة `buttons`. الأزرار هي مصفوفة ثنائية الأبعاد (صفوف من الأزرار):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

حقول الزر:

- `text` (مطلوب): تسمية العرض.
- `callback_data` (مطلوب): القيمة التي تُرسل عند النقر (تُستخدم كمعرّف الإجراء).
- `style` (اختياري): `"default"` أو `"primary"` أو `"danger"`.

عندما ينقر مستخدم زرًا:

1. تُستبدل جميع الأزرار بسطر تأكيد (مثل: "✓ **Yes** selected by @user").
2. يتلقى الوكيل الاختيار كرسالة واردة ويرد.

ملاحظات:

- تستخدم نداءات الأزرار المرتدة تحقق HMAC-SHA256 (تلقائي، ولا حاجة إلى أي تكوين).
- يزيل Mattermost بيانات callback من استجابات API الخاصة به (ميزة أمان)، لذلك
  تُزال جميع الأزرار عند النقر — ولا يمكن الإزالة الجزئية.
- تُنقّى معرّفات الإجراءات التي تحتوي على شرطات أو شرطات سفلية تلقائيًا
  (بسبب قيود التوجيه في Mattermost).

التكوين:

- `channels.mattermost.capabilities`: مصفوفة من سلاسل الإمكانات. أضف `"inlineButtons"` إلى
  تفعيل وصف أداة الأزرار في system prompt الخاص بالوكيل.
- `channels.mattermost.interactions.callbackBaseUrl`: base URL خارجي اختياري لنداءات الأزرار
  المرتدة (مثل `https://gateway.example.com`). استخدم هذا عندما لا يتمكن Mattermost من
  الوصول إلى Gateway مباشرة عبر bind host الخاص به.
- في إعدادات الحسابات المتعددة، يمكنك أيضًا ضبط الحقل نفسه تحت
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- إذا لم يتم تحديد `interactions.callbackBaseUrl`، فسيشتق OpenClaw عنوان callback URL من
  `gateway.customBindHost` + `gateway.port`، ثم يعود إلى `http://localhost:<port>`.
- قاعدة قابلية الوصول: يجب أن يكون عنوان callback URL الخاص بالأزرار قابلاً للوصول من خادم Mattermost.
  لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على نفس المضيف/حيّز الشبكة.
- إذا كان هدف callback الخاص بك خاصًا أو على tailnet أو داخليًا، فأضف مضيفه/نطاقه إلى
  `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.

### تكامل API مباشر (سكربتات خارجية)

يمكن للسكربتات الخارجية وWebhooks نشر الأزرار مباشرة عبر Mattermost REST API
بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من
الـ Plugin متى أمكن؛ وإذا كنت سترسل JSON خامًا، فاتبع هذه القواعد:

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
            id: "mybutton01", // أحرف وأرقام فقط — انظر أدناه
            type: "button", // مطلوب، وإلا سيتم تجاهل النقرات بصمت
            name: "Approve", // تسمية العرض
            style: "primary", // اختياري: "default" أو "primary" أو "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // يجب أن يطابق معرّف الزر (لاستخدامه في lookup الاسم)
                action: "approve",
                // ... أي حقول مخصصة أخرى ...
                _token: "<hmac>", // انظر قسم HMAC أدناه
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

1. توضع attachments في `props.attachments`، وليس في `attachments` على المستوى الأعلى (وإلا يتم تجاهلها بصمت).
2. يحتاج كل إجراء إلى `type: "button"` — ومن دونه، تُبتلع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id` — يتجاهل Mattermost الإجراءات التي لا تحتوي على IDs.
4. يجب أن يكون `id` الخاص بالإجراء **أبجديًا رقميًا فقط** (`[a-zA-Z0-9]`). فالشرطات والشرطات السفلية تعطل
   توجيه الإجراءات على جانب خادم Mattermost (ويعيد 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` الخاصة بالزر حتى تعرض رسالة التأكيد
   اسم الزر (مثل "Approve") بدلًا من معرّف خام.
6. `context.action_id` مطلوب — إذ يعيد معالج التفاعل 400 عند غيابه.

**توليد رمز HMAC:**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. ويجب على السكربتات الخارجية توليد رموز
تطابق منطق التحقق في Gateway:

1. اشتق secret من bot token:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. أنشئ كائن context بجميع الحقول **باستثناء** `_token`.
3. نفّذ serialize باستخدام **مفاتيح مرتبة** و**من دون مسافات** (يستخدم Gateway الدالة `JSON.stringify`
   مع مفاتيح مرتبة، ما ينتج مخرجات مضغوطة).
4. وقّع باستخدام: `HMAC-SHA256(key=secret, data=serializedContext)`
5. أضف قيمة hex digest الناتجة كحقل `_token` داخل context.

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
- وقّع دائمًا **كل** حقول context (باستثناء `_token`). يزيل Gateway الحقل `_token` ثم
  يوقّع كل ما تبقى. يؤدي توقيع مجموعة فرعية فقط إلى فشل صامت في التحقق.
- استخدم `sort_keys=True` — إذ يرتب Gateway المفاتيح قبل التوقيع، وقد يقوم Mattermost
  بإعادة ترتيب حقول context عند تخزين الحمولة.
- اشتق secret من bot token (بشكل حتمي)، وليس من بايتات عشوائية. يجب أن يكون secret
  نفسه عبر العملية التي تنشئ الأزرار وGateway الذي يتحقق منها.

## محول الدليل

يتضمن Plugin Mattermost محول دليل يحل أسماء القنوات والمستخدمين
عبر Mattermost API. وهذا يتيح استخدام الأهداف `#channel-name` و`@username` في
`openclaw message send` وتسليمات Cron/Webhooks.

لا حاجة إلى أي تكوين — يستخدم المحول bot token من تكوين الحساب.

## حسابات متعددة

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

- لا توجد ردود في القنوات: تأكد من وجود bot في القناة والإشارة إليه (oncall)، أو استخدم بادئة trigger (onchar)، أو اضبط `chatmode: "onmessage"`.
- أخطاء المصادقة: تحقق من bot token وbase URL وما إذا كان الحساب مفعّلًا.
- مشكلات الحسابات المتعددة: تنطبق متغيرات البيئة فقط على الحساب `default`.
- تعيد أوامر slash الأصلية `Unauthorized: invalid command token.`: لم يقبل OpenClaw
  callback token. والأسباب المعتادة:
  - فشل تسجيل أمر slash أو اكتمل جزئيًا فقط عند بدء التشغيل
  - callback يصل إلى Gateway/حساب خاطئ
  - لا يزال Mattermost يحتفظ بأوامر قديمة تشير إلى هدف callback سابق
  - أُعيد تشغيل Gateway من دون إعادة تفعيل أوامر slash
- إذا توقفت أوامر slash الأصلية عن العمل، فتحقق من السجلات بحثًا عن
  `mattermost: failed to register slash commands` أو
  `mattermost: native slash commands enabled but no commands could be registered`.
- إذا تم حذف `callbackUrl` وحذرت السجلات من أن callback حُلّ إلى
  `http://127.0.0.1:18789/...`، فمن المحتمل أن يكون ذلك العنوان قابلاً للوصول فقط عندما
  يعمل Mattermost على نفس المضيف/حيّز الشبكة مثل OpenClaw. اضبط
  `commands.callbackUrl` صريحًا وقابلاً للوصول خارجيًا بدلًا من ذلك.
- تظهر الأزرار كمربعات بيضاء: قد يكون الوكيل يرسل بيانات أزرار غير صحيحة. تحقق من أن كل زر يحتوي على الحقلين `text` و`callback_data`.
- تُعرض الأزرار ولكن النقرات لا تفعل شيئًا: تحقق من أن `AllowedUntrustedInternalConnections` في تكوين خادم Mattermost يتضمن `127.0.0.1 localhost`، وأن `EnablePostActionIntegration` مضبوط على `true` في ServiceSettings.
- تعيد الأزرار 404 عند النقر: من المحتمل أن `id` الخاص بالزر يحتوي على شرطات أو شرطات سفلية. يتعطل موجه الإجراءات في Mattermost مع المعرفات غير الأبجدية الرقمية. استخدم `[a-zA-Z0-9]` فقط.
- يسجل Gateway `invalid _token`: عدم تطابق HMAC. تحقق من أنك توقّع جميع حقول context (وليس مجموعة فرعية)، وتستخدم مفاتيح مرتبة، وJSON مضغوطًا (من دون مسافات). راجع قسم HMAC أعلاه.
- يسجل Gateway `missing _token in context`: الحقل `_token` غير موجود في context الخاص بالزر. تأكد من تضمينه عند بناء حمولة integration.
- يعرض التأكيد معرّفًا خامًا بدلًا من اسم الزر: `context.action_id` لا يطابق `id` الخاص بالزر. اضبط كليهما على القيمة نفسها بعد التنقية.
- الوكيل لا يعرف الأزرار: أضف `capabilities: ["inlineButtons"]` إلى تكوين قناة Mattermost.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق pairing
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتدعيم
