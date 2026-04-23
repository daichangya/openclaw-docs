---
read_when:
    - إعداد Synology Chat مع OpenClaw
    - تصحيح أخطاء توجيه Webhook في Synology Chat
summary: إعداد Webhook لـ Synology Chat وتكوين OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T13:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

الحالة: Plugin مضمّن لقناة الرسائل المباشرة يستخدم Webhook الخاصة بـ Synology Chat.
يقبل الـ Plugin الرسائل الواردة من Webhook الصادرة في Synology Chat ويرسل الردود
عبر Webhook واردة في Synology Chat.

## Plugin مضمّن

يأتي Synology Chat كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
النسخ المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Synology Chat،
فقم بتثبيته يدويًا:

ثبّت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع

1. تأكد من أن Plugin الخاص بـ Synology Chat متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للإصدارات الأقدم أو التثبيتات المخصصة إضافته يدويًا من نسخة المصدر باستخدام الأمر أعلاه.
   - يعرض `openclaw onboard` الآن Synology Chat في قائمة إعداد القنوات نفسها التي يستخدمها `openclaw channels add`.
   - إعداد غير تفاعلي: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. في تكاملات Synology Chat:
   - أنشئ Webhook واردة وانسخ عنوان URL الخاص بها.
   - أنشئ Webhook صادرة باستخدام الرمز السري الخاص بك.
3. وجّه عنوان URL الخاص بـ Webhook الصادرة إلى Gateway الخاص بـ OpenClaw:
   - `https://gateway-host/webhook/synology` افتراضيًا.
   - أو `channels.synology-chat.webhookPath` المخصص لديك.
4. أكمل الإعداد في OpenClaw.
   - بإرشاد: `openclaw onboard`
   - مباشرة: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. أعد تشغيل Gateway وأرسل رسالة مباشرة إلى روبوت Synology Chat.

تفاصيل مصادقة Webhook:

- يقبل OpenClaw رمز Webhook الصادرة من `body.token`، ثم
  `?token=...`، ثم الترويسات.
- صيغ الترويسات المقبولة:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- تفشل الرموز الفارغة أو المفقودة بشكل مغلق.

الحد الأدنى من التكوين:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## متغيرات البيئة

بالنسبة للحساب الافتراضي، يمكنك استخدام متغيرات البيئة:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (مفصولة بفواصل)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

تتجاوز قيم التكوين متغيرات البيئة.

لا يمكن تعيين `SYNOLOGY_CHAT_INCOMING_URL` من ملف `.env` الخاص بمساحة العمل؛ راجع [ملفات `.env` الخاصة بمساحة العمل](/ar/gateway/security).

## سياسة الرسائل المباشرة والتحكم في الوصول

- `dmPolicy: "allowlist"` هو الإعداد الافتراضي الموصى به.
- يقبل `allowedUserIds` قائمة (أو سلسلة مفصولة بفواصل) من معرّفات مستخدمي Synology.
- في وضع `allowlist`، تُعامل قائمة `allowedUserIds` الفارغة على أنها سوء تهيئة ولن يبدأ مسار Webhook (استخدم `dmPolicy: "open"` للسماح للجميع).
- يتيح `dmPolicy: "open"` أي مرسل.
- يحظر `dmPolicy: "disabled"` الرسائل المباشرة.
- يبقى ربط مستلم الرد معتمدًا على `user_id` الرقمي الثابت افتراضيًا. يشكل `channels.synology-chat.dangerouslyAllowNameMatching: true` وضع توافق طارئ يعيد تفعيل البحث باستخدام اسم المستخدم/الاسم المستعار القابل للتغيير لتسليم الردود.
- تعمل موافقات الاقتران مع:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## التسليم الصادر

استخدم معرّفات مستخدمي Synology Chat الرقمية كأهداف.

أمثلة:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

عمليات إرسال الوسائط مدعومة عبر تسليم الملفات المعتمد على URL.
يجب أن تستخدم عناوين URL للملفات الصادرة `http` أو `https`، ويتم رفض أهداف الشبكة الخاصة أو المحجوبة بطريقة أخرى قبل أن يقوم OpenClaw بتمرير عنوان URL إلى Webhook الخاصة بـ NAS.

## حسابات متعددة

تتوفر عدة حسابات Synology Chat ضمن `channels.synology-chat.accounts`.
يمكن لكل حساب تجاوز الرمز وعنوان URL الوارد ومسار Webhook وسياسة الرسائل المباشرة والحدود.
تكون جلسات الرسائل المباشرة معزولة لكل حساب ولكل مستخدم، لذلك فإن `user_id` الرقمي نفسه
على حسابي Synology مختلفين لا يشارك حالة السجل.
امنح كل حساب مفعّل `webhookPath` مميزًا. يرفض OpenClaw الآن المسارات المتطابقة تمامًا
ويرفض بدء الحسابات المسماة التي ترث فقط مسار Webhook مشتركًا في إعدادات الحسابات المتعددة.
إذا كنت تحتاج عمدًا إلى الوراثة القديمة لحساب مسمّى، فعيّن
`dangerouslyAllowInheritedWebhookPath: true` على ذلك الحساب أو في `channels.synology-chat`,
ولكن لا تزال المسارات المتطابقة تمامًا تُرفض بشكل مغلق. يُفضل استخدام مسارات صريحة لكل حساب.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## ملاحظات الأمان

- حافظ على سرية `token` وقم بتدويره إذا تسرّب.
- أبقِ `allowInsecureSsl: false` ما لم تكن تثق صراحةً بشهادة NAS محلية موقعة ذاتيًا.
- يتم التحقق من طلبات Webhook الواردة بواسطة الرمز وتُطبق عليها حدود المعدل لكل مرسل.
- تستخدم عمليات التحقق من الرموز غير الصالحة مقارنة أسرار بزمن ثابت وتفشل بشكل مغلق.
- يُفضل `dmPolicy: "allowlist"` في بيئات الإنتاج.
- أبقِ `dangerouslyAllowNameMatching` معطلاً ما لم تكن تحتاج صراحةً إلى تسليم الردود القديم المعتمد على اسم المستخدم.
- أبقِ `dangerouslyAllowInheritedWebhookPath` معطلاً ما لم تكن تقبل صراحةً مخاطر التوجيه عبر المسار المشترك في إعداد حسابات متعددة.

## استكشاف الأخطاء وإصلاحها

- `Missing required fields (token, user_id, text)`:
  - حمولة Webhook الصادرة تفتقد أحد الحقول المطلوبة
  - إذا كان Synology يرسل الرمز في الترويسات، فتأكد من أن الـ Gateway/الوكيل يحافظ على تلك الترويسات
- `Invalid token`:
  - السر الخاص بـ Webhook الصادرة لا يطابق `channels.synology-chat.token`
  - الطلب يصل إلى الحساب أو مسار Webhook الخطأ
  - أزال وكيل عكسي ترويسة الرمز قبل أن يصل الطلب إلى OpenClaw
- `Rate limit exceeded`:
  - قد تؤدي محاولات الرمز غير الصالح الكثيرة جدًا من المصدر نفسه إلى حظر ذلك المصدر مؤقتًا
  - لدى المرسلين الموثقين أيضًا حد منفصل لمعدل الرسائل لكل مستخدم
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - تم تفعيل `dmPolicy="allowlist"` لكن لم يتم تكوين أي مستخدمين
- `User not authorized`:
  - `user_id` الرقمي الخاص بالمرسل غير موجود في `allowedUserIds`

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وضبط الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
