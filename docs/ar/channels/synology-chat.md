---
read_when:
    - إعداد Synology Chat مع OpenClaw
    - تصحيح أخطاء توجيه Webhook في Synology Chat
summary: إعداد Webhook لـ Synology Chat وتكوين OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T19:20:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

الحالة: Plugin مضمّن لقناة الرسائل المباشرة يستخدم Webhook الخاصة بـ Synology Chat.
يقبل الـ Plugin الرسائل الواردة من Webhook الصادرة في Synology Chat ويرسل الردود
عبر Webhook واردة في Synology Chat.

## Plugin مضمّن

يأتي Synology Chat كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البُنى المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستثني Synology Chat،
فقم بتثبيته يدويًا:

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع

1. تأكد من أن Plugin الخاص بـ Synology Chat متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم أو المخصصة إضافته يدويًا من نسخة المصدر باستخدام الأمر أعلاه.
   - يعرض `openclaw onboard` الآن Synology Chat في قائمة إعداد القنوات نفسها الموجودة في `openclaw channels add`.
   - إعداد غير تفاعلي: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. في تكاملات Synology Chat:
   - أنشئ Webhook واردة وانسخ عنوان URL الخاص بها.
   - أنشئ Webhook صادرة باستخدام الرمز السري الخاص بك.
3. وجّه عنوان URL الخاص بـ Webhook الصادرة إلى Gateway الخاصة بـ OpenClaw:
   - `https://gateway-host/webhook/synology` افتراضيًا.
   - أو `channels.synology-chat.webhookPath` المخصص لديك.
4. أكمل الإعداد في OpenClaw.
   - موجه: `openclaw onboard`
   - مباشر: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. أعد تشغيل Gateway وأرسل رسالة مباشرة إلى روبوت Synology Chat.

تفاصيل مصادقة Webhook:

- يقبل OpenClaw رمز Webhook الصادرة من `body.token`، ثم
  `?token=...`، ثم الرؤوس.
- صيغ الرؤوس المقبولة:
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

## سياسة الرسائل المباشرة والتحكم في الوصول

- `dmPolicy: "allowlist"` هو الإعداد الافتراضي الموصى به.
- يقبل `allowedUserIds` قائمة (أو سلسلة مفصولة بفواصل) من معرّفات مستخدمي Synology.
- في وضع `allowlist`، تُعامل قائمة `allowedUserIds` الفارغة على أنها سوء تهيئة ولن يبدأ مسار Webhook (استخدم `dmPolicy: "open"` للسماح للجميع).
- `dmPolicy: "open"` يسمح لأي مُرسِل.
- `dmPolicy: "disabled"` يحظر الرسائل المباشرة.
- يبقى ربط مستلم الرد معتمدًا على `user_id` الرقمي الثابت افتراضيًا. يُعد `channels.synology-chat.dangerouslyAllowNameMatching: true` وضع توافق طارئ يعيد تمكين البحث باستخدام اسم المستخدم/الاسم المستعار القابل للتغيير لتسليم الردود.
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
يجب أن تستخدم عناوين URL للملفات الصادرة `http` أو `https`، ويتم رفض أهداف الشبكة الخاصة أو المحظورة بأي شكل آخر قبل أن يمرر OpenClaw عنوان URL إلى Webhook الخاصة بـ NAS.

## حسابات متعددة

تُدعَم حسابات Synology Chat المتعددة ضمن `channels.synology-chat.accounts`.
يمكن لكل حساب تجاوز الرمز، وعنوان URL الوارد، ومسار Webhook، وسياسة الرسائل المباشرة، والحدود.
تُعزل جلسات الرسائل المباشرة لكل حساب ومستخدم، لذلك فإن `user_id` الرقمي نفسه
على حسابين مختلفين في Synology لا يشارك حالة السجل النصي.
أعطِ كل حساب مفعّل `webhookPath` مميزًا. يرفض OpenClaw الآن المسارات المتطابقة تمامًا
ويرفض بدء الحسابات المسماة التي ترث فقط مسار Webhook مشتركًا في إعدادات الحسابات المتعددة.
إذا كنت تحتاج عمدًا إلى الوراثة القديمة لحساب مسمى، فاضبط
`dangerouslyAllowInheritedWebhookPath: true` على ذلك الحساب أو في `channels.synology-chat`،
لكن المسارات المتطابقة تمامًا ستظل مرفوضة بشكل مغلق. يُفضّل استخدام مسارات صريحة لكل حساب.

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

- حافظ على سرية `token` وبدّله إذا تسرّب.
- اترك `allowInsecureSsl: false` ما لم تكن تثق صراحةً بشهادة NAS محلية موقعة ذاتيًا.
- تُتحقق طلبات Webhook الواردة من الرمز وتُفرض عليها حدود معدل لكل مُرسِل.
- تستخدم عمليات التحقق من الرموز غير الصالحة مقارنة أسرار بزمن ثابت وتفشل بشكل مغلق.
- يُفضّل `dmPolicy: "allowlist"` في بيئات الإنتاج.
- اترك `dangerouslyAllowNameMatching` معطلاً ما لم تكن تحتاج صراحةً إلى تسليم الردود القديم المعتمد على اسم المستخدم.
- اترك `dangerouslyAllowInheritedWebhookPath` معطلاً ما لم تكن تقبل صراحةً مخاطر التوجيه عبر المسار المشترك في إعدادات الحسابات المتعددة.

## استكشاف الأخطاء وإصلاحها

- `Missing required fields (token, user_id, text)`:
  - حمولة Webhook الصادرة تفتقد أحد الحقول المطلوبة
  - إذا كان Synology يرسل الرمز في الرؤوس، فتأكد من أن Gateway/الوكيل يحافظ على تلك الرؤوس
- `Invalid token`:
  - الرمز السري لـ Webhook الصادرة لا يطابق `channels.synology-chat.token`
  - يصل الطلب إلى الحساب/مسار Webhook الخطأ
  - أزال وكيل عكسي ترويسة الرمز قبل وصول الطلب إلى OpenClaw
- `Rate limit exceeded`:
  - يمكن أن تؤدي كثرة محاولات الرمز غير الصالح من المصدر نفسه إلى حظر ذلك المصدر مؤقتًا
  - لدى المُرسِلين المصادق عليهم أيضًا حد معدل منفصل للرسائل لكل مستخدم
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - تم تفعيل `dmPolicy="allowlist"` لكن لم يتم تكوين أي مستخدمين
- `User not authorized`:
  - `user_id` الرقمي الخاص بالمُرسِل غير موجود في `allowedUserIds`

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
