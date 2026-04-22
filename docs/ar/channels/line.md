---
read_when:
    - تريد ربط OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook وبيانات الاعتماد لـ LINE
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد Plugin لواجهة LINE Messaging API، والتكوين، والاستخدام
title: LINE
x-i18n:
    generated_at: "2026-04-22T04:20:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

يتصل LINE بـ OpenClaw عبر LINE Messaging API. يعمل Plugin كمستقبل Webhook
على Gateway ويستخدم رمز وصول القناة + سر القناة لديك من أجل
المصادقة.

الحالة: Plugin مضمّن. الرسائل المباشرة، والمحادثات الجماعية، والوسائط، والمواقع، ورسائل Flex،
ورسائل القوالب، والردود السريعة مدعومة. التفاعلات وسلاسل الرسائل
غير مدعومة.

## Plugin المضمّن

يأتي LINE كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك فإن
البنيات المعبأة العادية لا تحتاج إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد LINE، فقم بتثبيته
يدويًا:

```bash
openclaw plugins install @openclaw/line
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## الإعداد

1. أنشئ حساب LINE Developers وافتح Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. أنشئ Provider (أو اختر واحدًا) وأضف قناة **Messaging API**.
3. انسخ **Channel access token** و**Channel secret** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. اضبط عنوان URL الخاص بـ Webhook على نقطة نهاية Gateway لديك (مطلوب HTTPS):

```
https://gateway-host/line/webhook
```

يستجيب Gateway للتحقق من Webhook الخاص بـ LINE ‏(GET) وللأحداث الواردة ‏(POST).
إذا كنت بحاجة إلى مسار مخصص، فاضبط `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث عنوان URL وفقًا لذلك.

ملاحظة أمنية:

- يعتمد التحقق من توقيع LINE على جسم الطلب (HMAC فوق الجسم الخام)، لذا يطبق OpenClaw حدودًا صارمة لحجم الجسم قبل المصادقة ومهلة زمنية قبل التحقق.
- يعالج OpenClaw أحداث Webhook من بايتات الطلب الخام التي تم التحقق منها. يتم تجاهل قيم `req.body` التي غيّرتها البرمجيات الوسيطة upstream حفاظًا على سلامة التوقيع.

## التكوين

الحد الأدنى من التكوين:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

متغيرات البيئة (للحساب الافتراضي فقط):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

ملفات الرمز/السر:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

يجب أن يشير `tokenFile` و`secretFile` إلى ملفات عادية. يتم رفض الروابط الرمزية.

حسابات متعددة:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## التحكم في الوصول

تستخدم الرسائل المباشرة الاقتران افتراضيًا. يحصل المرسلون غير المعروفين على رمز
اقتران ويتم تجاهل رسائلهم حتى تتم الموافقة عليهم.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

قوائم السماح والسياسات:

- `channels.line.dmPolicy`: ‏`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: معرّفات مستخدمي LINE المسموح لهم في الرسائل المباشرة
- `channels.line.groupPolicy`: ‏`allowlist | open | disabled`
- `channels.line.groupAllowFrom`: معرّفات مستخدمي LINE المسموح لهم في المجموعات
- عمليات تجاوز لكل مجموعة: `channels.line.groups.<groupId>.allowFrom`
- ملاحظة وقت التشغيل: إذا كان `channels.line` مفقودًا بالكامل، فسيعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

معرّفات LINE حساسة لحالة الأحرف. تبدو المعرّفات الصالحة كما يلي:

- مستخدم: `U` + ‏32 حرفًا سداسيًا عشريًا
- مجموعة: `C` + ‏32 حرفًا سداسيًا عشريًا
- غرفة: `R` + ‏32 حرفًا سداسيًا عشريًا

## سلوك الرسائل

- يتم تقسيم النص إلى أجزاء عند 5000 حرف.
- تتم إزالة تنسيق Markdown؛ وتُحوَّل كتل التعليمات البرمجية والجداول إلى بطاقات Flex
  عندما يكون ذلك ممكنًا.
- يتم تخزين الاستجابات المتدفقة مؤقتًا؛ ويتلقى LINE أجزاءً كاملة مع رسم متحرك
  للتحميل أثناء عمل الوكيل.
- يحدّ `channels.line.mediaMaxMb` من تنزيلات الوسائط (القيمة الافتراضية 10).

## بيانات القناة (الرسائل الغنية)

استخدم `channelData.line` لإرسال ردود سريعة، أو مواقع، أو بطاقات Flex، أو رسائل
قوالب.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

يأتي Plugin الخاص بـ LINE أيضًا مع أمر `/card` لإعدادات رسائل Flex المسبقة:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE ربط المحادثات عبر ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` يربط دردشة LINE الحالية بجلسة ACP من دون إنشاء سلسلة فرعية.
- تعمل ارتباطات ACP المكوّنة وجلسات ACP النشطة المرتبطة بالمحادثة على LINE مثل قنوات المحادثة الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على التفاصيل.

## الوسائط الصادرة

يدعم Plugin الخاص بـ LINE إرسال ملفات الصور والفيديو والصوت عبر أداة رسائل الوكيل. يتم إرسال الوسائط عبر مسار التسليم الخاص بـ LINE مع التعامل المناسب مع المعاينة والتتبع:

- **الصور**: تُرسل كرسائل صور LINE مع إنشاء معاينة تلقائيًا.
- **الفيديوهات**: تُرسل مع معالجة صريحة للمعاينة ونوع المحتوى.
- **الملفات الصوتية**: تُرسل كرسائل صوتية في LINE.

يجب أن تكون عناوين URL الخاصة بالوسائط الصادرة عناوين HTTPS عامة. يتحقق OpenClaw من اسم مضيف الوجهة قبل تمرير عنوان URL إلى LINE ويرفض الأهداف ذات local loopback وlink-local والشبكات الخاصة.

تعود عمليات إرسال الوسائط العامة إلى مسار الصور فقط الحالي عندما لا يكون مسار خاص بـ LINE متاحًا.

## استكشاف الأخطاء وإصلاحها

- **فشل التحقق من Webhook:** تأكد من أن عنوان URL الخاص بـ Webhook يستخدم HTTPS وأن
  `channelSecret` يطابق ما هو موجود في Console الخاصة بـ LINE.
- **لا توجد أحداث واردة:** أكّد أن مسار Webhook يطابق `channels.line.webhookPath`
  وأن Gateway يمكن الوصول إليه من LINE.
- **أخطاء تنزيل الوسائط:** زد قيمة `channels.line.mediaMaxMb` إذا كانت الوسائط تتجاوز
  الحد الافتراضي.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وضبط الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
