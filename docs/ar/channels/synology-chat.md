---
read_when:
    - إعداد Synology Chat مع OpenClaw
    - تصحيح أخطاء توجيه Webhook في Synology Chat
summary: إعداد Webhook لـ Synology Chat وتكوين OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T07:19:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: dda0d5d11e2526f4813b69ca914a63231003eb60d8bc2e1f030bcb3d77c8eda0
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

الحالة: Plugin مضمّن لقناة الرسائل المباشرة يستخدم Webhook الخاصة بـ Synology Chat.
يقبل Plugin الرسائل الواردة من Webhook الصادرة في Synology Chat ويرسل الردود
عبر Webhook واردة في Synology Chat.

## Plugin المضمّن

يأتي Synology Chat كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذا فإن
البنيات المجمّعة العادية لا تحتاج إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Synology Chat،
فقم بتثبيته يدويًا:

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

1. تأكد من أن Plugin الخاص بـ Synology Chat متاح.
   - تتضمن إصدارات OpenClaw المجمّعة الحالية هذا Plugin بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا من نسخة المصدر باستخدام الأمر أعلاه.
   - يعرض `openclaw onboard` الآن Synology Chat في قائمة إعداد القنوات نفسها التي يستخدمها `openclaw channels add`.
   - الإعداد غير التفاعلي: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. في تكاملات Synology Chat:
   - أنشئ Webhook واردة وانسخ URL الخاص بها.
   - أنشئ Webhook صادرة باستخدام الرمز السري الخاص بك.
3. وجّه URL الخاصة بـ Webhook الصادرة إلى Gateway الخاص بـ OpenClaw:
   - `https://gateway-host/webhook/synology` افتراضيًا.
   - أو `channels.synology-chat.webhookPath` المخصص لديك.
4. أكمل الإعداد في OpenClaw.
   - بإرشاد: `openclaw onboard`
   - مباشرة: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. أعد تشغيل Gateway وأرسل رسالة مباشرة إلى روبوت Synology Chat.

تفاصيل مصادقة Webhook:

- يقبل OpenClaw رمز Webhook الصادرة من `body.token`، ثم
  `?token=...`، ثم من الرؤوس.
- صيغ الرؤوس المقبولة:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- تُرفض الرموز الفارغة أو المفقودة افتراضيًا.

التهيئة الدنيا:

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

بالنسبة إلى الحساب الافتراضي، يمكنك استخدام متغيرات البيئة:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (مفصولة بفواصل)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

تتجاوز قيم التهيئة متغيرات البيئة.

<Note>
يوجد `SYNOLOGY_CHAT_INCOMING_URL` ضمن قائمة حظر كتل نقاط النهاية ولا يمكن ضبطه
من ملف `.env` خاص بمساحة العمل. يجب أن يأتي من بيئة shell أو من
بيئة عملية Gateway حتى لا تتمكن مساحات العمل غير الموثوقة من إعادة توجيه
حركة مرور Synology Chat إلى Webhook مختلفة. راجع
[ملفات `.env` لمساحة العمل](/ar/gateway/security) للاطلاع على القائمة الكاملة.
</Note>

## سياسة الرسائل المباشرة والتحكم في الوصول

- `dmPolicy: "allowlist"` هو الإعداد الافتراضي الموصى به.
- يقبل `allowedUserIds` قائمة (أو سلسلة مفصولة بفواصل) من معرّفات مستخدمي Synology.
- في وضع `allowlist`، تُعامل قائمة `allowedUserIds` الفارغة على أنها سوء تهيئة ولن يبدأ مسار Webhook (استخدم `dmPolicy: "open"` للسماح للجميع).
- يتيح `dmPolicy: "open"` لأي مرسل.
- يحظر `dmPolicy: "disabled"` الرسائل المباشرة.
- يبقى ربط مستلم الرد معتمدًا افتراضيًا على `user_id` الرقمي الثابت. يمثل `channels.synology-chat.dangerouslyAllowNameMatching: true` وضع توافق للطوارئ يعيد تفعيل البحث باستخدام اسم المستخدم/الاسم المستعار القابل للتغيير لتسليم الردود.
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

يتم دعم إرسال الوسائط عبر تسليم الملفات المستند إلى URL.
يجب أن تستخدم URL الملفات الصادرة `http` أو `https`، وتُرفض أهداف الشبكات الخاصة أو المحظورة بأي شكل آخر قبل أن يمرر OpenClaw URL إلى Webhook الخاصة بـ NAS.

## الحسابات المتعددة

تُدعَم حسابات Synology Chat المتعددة ضمن `channels.synology-chat.accounts`.
يمكن لكل حساب تجاوز الرمز، وURL الواردة، ومسار Webhook، وسياسة الرسائل المباشرة، والحدود.
تُعزل جلسات الرسائل المباشرة لكل حساب ولكل مستخدم، لذا فإن `user_id` الرقمي نفسه
على حسابي Synology مختلفين لا يشارك حالة النص نفسه.
امنح كل حساب مفعّل `webhookPath` مميزًا. يرفض OpenClaw الآن المسارات المتطابقة تمامًا
ويرفض بدء الحسابات المسماة التي ترث فقط مسار Webhook مشتركًا في إعدادات الحسابات المتعددة.
إذا كنت تحتاج عمدًا إلى هذا الإرث القديم لحساب مسمى، فاضبط
`dangerouslyAllowInheritedWebhookPath: true` على ذلك الحساب أو على `channels.synology-chat`,
لكن ستظل المسارات المتطابقة تمامًا مرفوضة افتراضيًا. ويفضَّل تعيين مسارات صريحة لكل حساب.

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
- يتم التحقق من طلبات Webhook الواردة باستخدام الرمز وتُطبَّق عليها حدود المعدّل لكل مرسل.
- تستخدم عمليات التحقق من الرموز غير الصالحة مقارنة أسرار بزمن ثابت وتفشل افتراضيًا.
- فضّل `dmPolicy: "allowlist"` في بيئات الإنتاج.
- أبقِ `dangerouslyAllowNameMatching` معطّلًا ما لم تكن تحتاج صراحةً إلى تسليم الردود القديم المعتمد على اسم المستخدم.
- أبقِ `dangerouslyAllowInheritedWebhookPath` معطّلًا ما لم تكن تقبل صراحةً مخاطر التوجيه عبر المسار المشترك في إعدادات الحسابات المتعددة.

## استكشاف الأخطاء وإصلاحها

- `Missing required fields (token, user_id, text)`:
  - حمولة Webhook الصادرة تفتقد أحد الحقول المطلوبة
  - إذا كان Synology يرسل الرمز في الرؤوس، فتأكد من أن Gateway/الوكيل العكسي يحافظ على تلك الرؤوس
- `Invalid token`:
  - الرمز السري لـ Webhook الصادرة لا يطابق `channels.synology-chat.token`
  - يصل الطلب إلى الحساب/مسار Webhook الخاطئ
  - أزال وكيل عكسي رأس الرمز قبل وصول الطلب إلى OpenClaw
- `Rate limit exceeded`:
  - قد تؤدي محاولات الرموز غير الصالحة الكثيرة جدًا من المصدر نفسه إلى حظر ذلك المصدر مؤقتًا
  - يخضع المرسلون الموثّقون أيضًا إلى حد منفصل لمعدل الرسائل لكل مستخدم
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - تم تفعيل `dmPolicy="allowlist"` لكن لم يتم ضبط أي مستخدمين
- `User not authorized`:
  - لا يوجد `user_id` الرقمي للمرسل ضمن `allowedUserIds`

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
