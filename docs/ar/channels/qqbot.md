---
read_when:
    - تريد ربط OpenClaw بـ QQ
    - تحتاج إلى إعداد بيانات اعتماد QQ Bot
    - تريد دعم QQ Bot للمجموعات أو الدردشة الخاصة
summary: إعداد QQ Bot، والتكوين، والاستخدام
title: QQ Bot
x-i18n:
    generated_at: "2026-04-22T04:20:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

يتصل QQ Bot بـ OpenClaw عبر QQ Bot API الرسمي (بوابة WebSocket). يدعم
Plugin الدردشة الخاصة C2C، ورسائل @ في المجموعات، ورسائل قنوات guild مع
وسائط غنية (صور، وصوت، وفيديو، وملفات).

الحالة: Plugin مضمّن. الرسائل المباشرة، والمحادثات الجماعية، وقنوات guild،
والوسائط مدعومة. التفاعلات وسلاسل الرسائل غير مدعومة.

## Plugin المضمّن

تتضمن إصدارات OpenClaw الحالية QQ Bot، لذلك لا تحتاج
البنيات المعبأة العادية إلى خطوة `openclaw plugins install` منفصلة.

## الإعداد

1. انتقل إلى [QQ Open Platform](https://q.qq.com/) وامسح رمز QR باستخدام
   تطبيق QQ على هاتفك للتسجيل / تسجيل الدخول.
2. انقر على **Create Bot** لإنشاء bot جديد في QQ.
3. اعثر على **AppID** و**AppSecret** في صفحة إعدادات bot وانسخهما.

> لا يتم تخزين AppSecret كنص عادي — إذا غادرت الصفحة من دون حفظه،
> فسيتعين عليك إنشاء واحد جديد.

4. أضف القناة:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. أعد تشغيل Gateway.

مسارات الإعداد التفاعلية:

```bash
openclaw channels add
openclaw configure --section channels
```

## التكوين

الحد الأدنى من التكوين:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

متغيرات البيئة للحساب الافتراضي:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret مستند إلى ملف:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

ملاحظات:

- ينطبق الرجوع إلى متغيرات البيئة على حساب QQ Bot الافتراضي فقط.
- يوفّر `openclaw channels add --channel qqbot --token-file ...`
  AppSecret فقط؛ ويجب أن يكون AppID مضبوطًا بالفعل في التكوين أو في `QQBOT_APP_ID`.
- يقبل `clientSecret` أيضًا إدخال SecretRef، وليس فقط سلسلة نصية عادية.

### إعداد حسابات متعددة

شغّل عدة bots من QQ ضمن مثيل OpenClaw واحد:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

يبدأ كل حساب اتصال WebSocket خاصًا به ويحافظ على ذاكرة تخزين مؤقت مستقلة
للرموز (معزولة بواسطة `appId`).

أضف bot ثانيًا عبر CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### الصوت (STT / TTS)

يدعم STT وTTS تكوينًا ذا مستويين مع رجوع حسب الأولوية:

| الإعداد | خاص بـ Plugin         | رجوع Framework             |
| ------- | --------------------- | -------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

اضبط `enabled: false` على أي منهما لتعطيله.

يمكن أيضًا ضبط سلوك رفع/تحويل الصوت الصادر باستخدام
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## تنسيقات الهدف

| التنسيق                  | الوصف                 |
| ------------------------ | --------------------- |
| `qqbot:c2c:OPENID`         | دردشة خاصة (C2C) |
| `qqbot:group:GROUP_OPENID` | دردشة جماعية         |
| `qqbot:channel:CHANNEL_ID` | قناة guild      |

> لكل bot مجموعته الخاصة من OpenID الخاصة بالمستخدمين. ولا يمكن استخدام OpenID
> الذي استلمه Bot A **لإرسال الرسائل** عبر Bot B.

## أوامر الشرطة المائلة

أوامر مدمجة يتم اعتراضها قبل قائمة انتظار الذكاء الاصطناعي:

| الأمر          | الوصف                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | اختبار زمن الاستجابة                                                                                     |
| `/bot-version` | عرض إصدار Framework الخاص بـ OpenClaw                                                                   |
| `/bot-help`    | عرض جميع الأوامر                                                                                        |
| `/bot-upgrade` | عرض رابط دليل ترقية QQBot                                                                               |
| `/bot-logs`    | تصدير سجلات Gateway الأخيرة كملف                                                                         |
| `/bot-approve` | الموافقة على إجراء QQ Bot معلّق (على سبيل المثال، تأكيد رفع C2C أو رفع مجموعة) عبر التدفق الأصلي. |

ألحِق `?` بأي أمر للحصول على تعليمات الاستخدام (على سبيل المثال `/bot-upgrade ?`).

## معمارية المحرك

يأتي QQ Bot كمحرك مكتفٍ ذاتيًا داخل Plugin:

- يمتلك كل حساب مكدس موارد معزولًا (اتصال WebSocket، وعميل API، وذاكرة تخزين مؤقت للرموز، وجذر تخزين للوسائط) مرتبطًا بـ `appId`. ولا تشارك الحسابات مطلقًا حالة الإدخال/الإخراج.
- يضيف مسجل الحسابات المتعددة وسمًا لسطور السجل بالحساب المالك حتى تظل التشخيصات منفصلة عند تشغيل عدة bots ضمن Gateway واحد.
- تشترك مسارات الإدخال، والإخراج، وجسر Gateway في جذر واحد لحمولات الوسائط تحت `~/.openclaw/media`، بحيث تصل عمليات الرفع والتنزيل وذاكرات التحويل المؤقتة إلى دليل واحد محمي بدلًا من شجرة لكل نظام فرعي.
- يمكن نسخ بيانات الاعتماد احتياطيًا واستعادتها كجزء من لقطات بيانات اعتماد OpenClaw القياسية؛ ويعيد المحرك إرفاق مكدس موارد كل حساب عند الاستعادة من دون الحاجة إلى اقتران جديد عبر رمز QR.

## الإعداد الأولي برمز QR

كبديل للصق `AppID:AppSecret` يدويًا، يدعم المحرك تدفق إعداد أولي برمز QR لربط QQ Bot بـ OpenClaw:

1. شغّل مسار إعداد QQ Bot (على سبيل المثال `openclaw channels add --channel qqbot`) واختر تدفق رمز QR عند مطالبتك بذلك.
2. امسح رمز QR الذي تم إنشاؤه باستخدام تطبيق الهاتف المرتبط بـ QQ Bot المستهدف.
3. وافق على الاقتران على الهاتف. يحتفظ OpenClaw ببيانات الاعتماد التي تم إرجاعها داخل `credentials/` ضمن نطاق الحساب الصحيح.

تظهر مطالبات الموافقة التي ينشئها bot نفسه (على سبيل المثال، تدفقات "هل تسمح بهذا الإجراء؟" التي يكشفها QQ Bot API) كمطالبات OpenClaw أصلية يمكنك قبولها باستخدام `/bot-approve` بدلًا من الرد عبر عميل QQ الخام.

## استكشاف الأخطاء وإصلاحها

- **يرد bot بعبارة "gone to Mars":** بيانات الاعتماد غير مكوّنة أو لم يتم بدء Gateway.
- **لا توجد رسائل واردة:** تحقّق من أن `appId` و`clientSecret` صحيحان، وأن
  bot مفعّل على QQ Open Platform.
- **لا يزال الإعداد باستخدام `--token-file` يظهر كغير مكوّن:** يقوم `--token-file` فقط
  بتعيين AppSecret. ما زلت بحاجة إلى `appId` في التكوين أو `QQBOT_APP_ID`.
- **الرسائل الاستباقية لا تصل:** قد يعترض QQ الرسائل التي يبدأها bot إذا
  لم يكن المستخدم قد تفاعل مؤخرًا.
- **لم يتم تفريغ الصوت إلى نص:** تأكد من تكوين STT وأن provider يمكن الوصول إليه.
