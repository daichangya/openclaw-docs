---
read_when:
    - أنت تريد توصيل OpenClaw بـ QQ
    - تحتاج إلى إعداد بيانات اعتماد QQ Bot
    - أنت تريد دعم المحادثات الجماعية أو الخاصة في QQ Bot
summary: إعداد QQ Bot، وإعداداته، واستخدامه
title: روبوت QQ
x-i18n:
    generated_at: "2026-04-25T13:41:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

يتصل QQ Bot بـ OpenClaw عبر واجهة QQ Bot API الرسمية (بوابة WebSocket). يدعم
Plugin المحادثات الخاصة C2C، ورسائل @ في المجموعات، ورسائل قنوات guild مع
وسائط غنية (الصور، والصوت، والفيديو، والملفات).

الحالة: Plugin مضمّن. الرسائل المباشرة، والمحادثات الجماعية، وقنوات guild، و
الوسائط مدعومة. ردود الفعل والخيوط غير مدعومة.

## Plugin مضمّن

تتضمن إصدارات OpenClaw الحالية QQ Bot، لذا لا تحتاج الإصدارات المجمعة العادية
إلى خطوة `openclaw plugins install` منفصلة.

## الإعداد

1. انتقل إلى [QQ Open Platform](https://q.qq.com/) وامسح رمز QR باستخدام
   تطبيق QQ على هاتفك للتسجيل / تسجيل الدخول.
2. انقر على **Create Bot** لإنشاء QQ bot جديد.
3. اعثر على **AppID** و**AppSecret** في صفحة إعدادات البوت وانسخهما.

> لا يتم تخزين AppSecret كنص عادي — إذا غادرت الصفحة دون حفظه،
> فسيتعين عليك إعادة إنشاء واحد جديد.

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

## الإعدادات

الحد الأدنى من الإعدادات:

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

AppSecret معتمد على ملف:

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
  AppSecret فقط؛ يجب أن يكون AppID مضبوطًا مسبقًا في الإعدادات أو في `QQBOT_APP_ID`.
- يقبل `clientSecret` أيضًا إدخال SecretRef، وليس مجرد سلسلة نصية عادية.

### إعداد حسابات متعددة

شغّل عدة روبوتات QQ ضمن مثيل OpenClaw واحد:

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

يشغّل كل حساب اتصال WebSocket خاصًا به ويحافظ على ذاكرة تخزين مؤقت مستقلة
للرموز المميزة (معزولة حسب `appId`).

أضف روبوتًا ثانيًا عبر CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### الصوت (STT / TTS)

يدعم STT وTTS إعدادًا على مستويين مع أولوية الرجوع الاحتياطي:

| الإعداد | خاص بـ Plugin         | الرجوع الاحتياطي من الإطار      |
| ------- | --------------------- | ------------------------------- |
| STT     | `channels.qqbot.stt`  | `tools.media.audio.models[0]`   |
| TTS     | `channels.qqbot.tts`  | `messages.tts`                  |

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

تُعرَض مرفقات الصوت الواردة من QQ للوكلاء كبيانات وصفية لوسائط صوتية مع
إبقاء ملفات الصوت الخام خارج `MediaPaths` العامة. تقوم الردود النصية العادية
`[[audio_as_voice]]` بتركيب TTS وإرسال رسالة صوتية أصلية في QQ عندما يكون TTS
مهيأً.

يمكن أيضًا ضبط سلوك رفع/تحويل الصوت الصادر باستخدام
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## التنسيقات المستهدفة

| التنسيق                   | الوصف              |
| ------------------------- | ------------------ |
| `qqbot:c2c:OPENID`        | محادثة خاصة (C2C)  |
| `qqbot:group:GROUP_OPENID` | محادثة جماعية      |
| `qqbot:channel:CHANNEL_ID` | قناة guild         |

> لكل بوت مجموعة OpenID خاصة به للمستخدمين. لا يمكن استخدام OpenID تم استلامه
> بواسطة Bot A **لإرسال الرسائل** عبر Bot B.

## أوامر الشرطة المائلة

أوامر مدمجة يتم اعتراضها قبل طابور الذكاء الاصطناعي:

| الأمر          | الوصف                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `/bot-ping`    | اختبار زمن الاستجابة                                                                             |
| `/bot-version` | عرض إصدار إطار OpenClaw                                                                         |
| `/bot-help`    | عرض جميع الأوامر                                                                                 |
| `/bot-upgrade` | عرض رابط دليل ترقية QQBot                                                                       |
| `/bot-logs`    | تصدير سجلات Gateway الحديثة كملف                                                                 |
| `/bot-approve` | الموافقة على إجراء QQ Bot معلّق (على سبيل المثال، تأكيد رفع C2C أو رفع جماعي) عبر التدفق الأصلي. |

أضف `?` إلى أي أمر للحصول على تعليمات الاستخدام (على سبيل المثال `/bot-upgrade ?`).

## بنية المحرك

يأتي QQ Bot كمحرك مستقل بذاته داخل Plugin:

- يمتلك كل حساب مكدس موارد معزولًا (اتصال WebSocket، وعميل API، وذاكرة تخزين مؤقت للرموز المميزة، وجذر تخزين الوسائط) مرتبطًا بـ `appId`. لا تشارك الحسابات أبدًا حالة الإدخال/الإخراج.
- يضيف مسجل الحسابات المتعددة وسم الحساب المالك إلى أسطر السجل بحيث تظل بيانات التشخيص قابلة للفصل عند تشغيل عدة روبوتات تحت Gateway واحد.
- تشترك مسارات الإدخال، والإخراج، والربط مع Gateway في جذر واحد لحمولات الوسائط تحت `~/.openclaw/media`، بحيث تنزل عمليات الرفع والتنزيل وذاكرات التخزين المؤقت للتحويل تحت دليل واحد محمي بدلًا من شجرة لكل نظام فرعي.
- يمكن نسخ بيانات الاعتماد احتياطيًا واستعادتها كجزء من لقطات بيانات اعتماد OpenClaw القياسية؛ ويعيد المحرك إرفاق مكدس موارد كل حساب عند الاستعادة دون الحاجة إلى اقتران جديد برمز QR.

## الإعداد عبر رمز QR

كبديل عن لصق `AppID:AppSecret` يدويًا، يدعم المحرك تدفق إعداد عبر رمز QR لربط QQ Bot بـ OpenClaw:

1. شغّل مسار إعداد QQ Bot (على سبيل المثال `openclaw channels add --channel qqbot`) واختر تدفق رمز QR عند الطلب.
2. امسح رمز QR الناتج باستخدام تطبيق الهاتف المرتبط بـ QQ Bot المستهدف.
3. وافق على الاقتران على الهاتف. يقوم OpenClaw بحفظ بيانات الاعتماد المعادة ضمن `credentials/` في نطاق الحساب الصحيح.

تظهر مطالبات الموافقة التي ينشئها البوت نفسه (على سبيل المثال، تدفقات "السماح بهذا الإجراء؟" التي تعرضها QQ Bot API) كمطالبات OpenClaw أصلية يمكنك قبولها باستخدام `/bot-approve` بدلًا من الرد عبر عميل QQ الخام.

## استكشاف الأخطاء وإصلاحها

- **يرد البوت بعبارة "gone to Mars":** بيانات الاعتماد غير مهيأة أو لم يتم تشغيل Gateway.
- **لا توجد رسائل واردة:** تحقق من صحة `appId` و`clientSecret`، وأن
  البوت مفعّل على QQ Open Platform.
- **لا يزال الإعداد باستخدام `--token-file` يظهر على أنه غير مهيأ:** يقوم `--token-file`
  بتعيين AppSecret فقط. وما زلت بحاجة إلى `appId` في الإعدادات أو `QQBOT_APP_ID`.
- **الرسائل الاستباقية لا تصل:** قد يعترض QQ الرسائل التي يبدأها البوت إذا
  لم يتفاعل المستخدم مؤخرًا.
- **لا يتم تحويل الصوت إلى نص:** تأكد من أن STT مهيأ وأن المزوّد متاح.

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
