---
read_when:
    - يشير نقل القناة إلى أنه متصل، لكن الردود تفشل
    - تحتاج إلى عمليات تحقق خاصة بالقناة قبل الرجوع إلى مستندات الموفّر المتعمقة
summary: استكشاف أخطاء مستوى القناة بسرعة باستخدام بصمات الفشل والإصلاحات الخاصة بكل قناة
title: استكشاف أخطاء القنوات وإصلاحها
x-i18n:
    generated_at: "2026-04-21T07:18:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
    source_path: channels/troubleshooting.md
    workflow: 15
---

# استكشاف أخطاء القنوات وإصلاحها

استخدم هذه الصفحة عندما تتصل قناة ما لكن يكون السلوك غير صحيح.

## تسلسل الأوامر

شغّل هذه الأوامر بهذا الترتيب أولًا:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

الخط الأساسي السليم:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only` أو `write-capable` أو `admin-capable`
- يُظهر فحص القناة أن وسيلة النقل متصلة، وحيثما كان ذلك مدعومًا، `works` أو `audit ok`

## WhatsApp

### بصمات فشل WhatsApp

| العرض | أسرع فحص | الإصلاح |
| --- | --- | --- |
| متصل لكن لا توجد ردود على الرسائل المباشرة | `openclaw pairing list whatsapp` | وافق على المُرسل أو بدّل سياسة الرسائل المباشرة/قائمة السماح. |
| يتم تجاهل رسائل المجموعات | تحقّق من `requireMention` وأنماط الإشارة في الإعدادات | أشر إلى البوت أو خفّف سياسة الإشارة لتلك المجموعة. |
| حالات قطع اتصال/حلقات تسجيل دخول عشوائية | `openclaw channels status --probe` + السجلات | أعد تسجيل الدخول وتحقق من سلامة دليل بيانات الاعتماد. |

الاستكشاف الكامل للأخطاء وإصلاحها: [/channels/whatsapp#troubleshooting](/ar/channels/whatsapp#troubleshooting)

## Telegram

### بصمات فشل Telegram

| العرض | أسرع فحص | الإصلاح |
| --- | --- | --- |
| `/start` لكن لا يوجد تدفق رد قابل للاستخدام | `openclaw pairing list telegram` | وافق على الاقتران أو غيّر سياسة الرسائل المباشرة. |
| البوت متصل لكن المجموعة تبقى صامتة | تحقّق من متطلب الإشارة ووضع خصوصية البوت | عطّل وضع الخصوصية لإتاحة رؤية المجموعة أو أشر إلى البوت. |
| فشل في الإرسال مع أخطاء شبكة | افحص السجلات بحثًا عن فشل استدعاءات Telegram API | أصلح توجيه DNS/IPv6/الوكيل إلى `api.telegram.org`. |
| يتوقف Polling أو يعيد الاتصال ببطء | `openclaw logs --follow` لتشخيصات polling | قم بالترقية؛ وإذا كانت إعادة التشغيل إنذارات كاذبة، فاضبط `pollingStallThresholdMs`. أما التعطل المستمر فلا يزال يشير إلى الوكيل/DNS/IPv6. |
| تم رفض `setMyCommands` عند بدء التشغيل | افحص السجلات بحثًا عن `BOT_COMMANDS_TOO_MUCH` | قلّل أوامر Telegram الأصلية الخاصة بالـ Plugin/Skills/المخصصة أو عطّل القوائم الأصلية. |
| قمت بالترقية وأصبحت قائمة السماح تمنعك | `openclaw security audit` وإعدادات قوائم السماح | شغّل `openclaw doctor --fix` أو استبدل `@username` بمعرّفات مُرسلين رقمية. |

الاستكشاف الكامل للأخطاء وإصلاحها: [/channels/telegram#troubleshooting](/ar/channels/telegram#troubleshooting)

## Discord

### بصمات فشل Discord

| العرض | أسرع فحص | الإصلاح |
| --- | --- | --- |
| البوت متصل لكن لا توجد ردود في الخوادم | `openclaw channels status --probe` | اسمح بالخادم/القناة وتحقق من intent الخاص بمحتوى الرسائل. |
| يتم تجاهل رسائل المجموعات | تحقّق من السجلات بحثًا عن إسقاطات بوابة الإشارة | أشر إلى البوت أو اضبط `requireMention: false` للخادم/القناة. |
| ردود الرسائل المباشرة مفقودة | `openclaw pairing list discord` | وافق على اقتران الرسائل المباشرة أو عدّل سياسة الرسائل المباشرة. |

الاستكشاف الكامل للأخطاء وإصلاحها: [/channels/discord#troubleshooting](/ar/channels/discord#troubleshooting)

## Slack

### بصمات فشل Slack

| العرض | أسرع فحص | الإصلاح |
| --- | --- | --- |
| Socket mode متصل لكن لا توجد استجابات | `openclaw channels status --probe` | تحقّق من app token وbot token والنطاقات المطلوبة؛ وراقب `botTokenStatus` / `appTokenStatus = configured_unavailable` في الإعدادات المدعومة بـ SecretRef. |
| الرسائل المباشرة محجوبة | `openclaw pairing list slack` | وافق على الاقتران أو خفّف سياسة الرسائل المباشرة. |
| تم تجاهل رسالة القناة | تحقّق من `groupPolicy` وقائمة سماح القناة | اسمح بالقناة أو بدّل السياسة إلى `open`. |

الاستكشاف الكامل للأخطاء وإصلاحها: [/channels/slack#troubleshooting](/ar/channels/slack#troubleshooting)

## iMessage وBlueBubbles

### بصمات فشل iMessage وBlueBubbles

| العرض | أسرع فحص | الإصلاح |
| --- | --- | --- |
| لا توجد أحداث واردة | تحقّق من إمكانية الوصول إلى Webhook/الخادم وأذونات التطبيق | أصلح عنوان Webhook أو حالة خادم BlueBubbles. |
| يمكن الإرسال لكن لا يوجد استقبال على macOS | تحقّق من أذونات الخصوصية في macOS لأتمتة Messages | امنح أذونات TCC من جديد وأعد تشغيل عملية القناة. |
| مُرسل الرسائل المباشرة محجوب | `openclaw pairing list imessage` أو `openclaw pairing list bluebubbles` | وافق على الاقتران أو حدّث قائمة السماح. |

الاستكشاف الكامل للأخطاء وإصلاحها:

- [/channels/imessage#troubleshooting](/ar/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/ar/channels/bluebubbles#troubleshooting)

## Signal

### بصمات فشل Signal

| العرض | أسرع فحص | الإصلاح |
| --- | --- | --- |
| يمكن الوصول إلى Daemon لكن البوت صامت | `openclaw channels status --probe` | تحقّق من عنوان URL الخاص بـ `signal-cli` daemon/الحساب ووضع الاستقبال. |
| الرسائل المباشرة محجوبة | `openclaw pairing list signal` | وافق على المُرسل أو عدّل سياسة الرسائل المباشرة. |
| لا يتم تشغيل ردود المجموعات | تحقّق من قائمة سماح المجموعات وأنماط الإشارة | أضف المُرسل/المجموعة أو خفّف القيود. |

الاستكشاف الكامل للأخطاء وإصلاحها: [/channels/signal#troubleshooting](/ar/channels/signal#troubleshooting)

## QQ Bot

### بصمات فشل QQ Bot

| العرض | أسرع فحص | الإصلاح |
| --- | --- | --- |
| يرد البوت بعبارة "gone to Mars" | تحقّق من `appId` و`clientSecret` في الإعدادات | اضبط بيانات الاعتماد أو أعد تشغيل Gateway. |
| لا توجد رسائل واردة | `openclaw channels status --probe` | تحقّق من بيانات الاعتماد على QQ Open Platform. |
| لا يتم نسخ الصوت إلى نص | تحقّق من إعدادات موفّر STT | اضبط `channels.qqbot.stt` أو `tools.media.audio`. |
| الرسائل الاستباقية لا تصل | تحقّق من متطلبات التفاعل في منصة QQ | قد تمنع QQ الرسائل التي يبدأها البوت من دون تفاعل حديث. |

الاستكشاف الكامل للأخطاء وإصلاحها: [/channels/qqbot#troubleshooting](/ar/channels/qqbot#troubleshooting)

## Matrix

### بصمات فشل Matrix

| العرض | أسرع فحص | الإصلاح |
| --- | --- | --- |
| تم تسجيل الدخول لكن يتم تجاهل رسائل الغرفة | `openclaw channels status --probe` | تحقّق من `groupPolicy` وقائمة سماح الغرفة وبوابة الإشارة. |
| لا تتم معالجة الرسائل المباشرة | `openclaw pairing list matrix` | وافق على المُرسل أو عدّل سياسة الرسائل المباشرة. |
| الغرف المشفرة تفشل | `openclaw matrix verify status` | أعد التحقق من الجهاز، ثم افحص `openclaw matrix verify backup status`. |
| استعادة النسخة الاحتياطية معلّقة/معطّلة | `openclaw matrix verify backup status` | شغّل `openclaw matrix verify backup restore` أو أعد التشغيل باستخدام مفتاح استرداد. |
| يبدو Cross-signing/bootstrap غير صحيح | `openclaw matrix verify bootstrap` | أصلح secret storage وcross-signing وحالة النسخ الاحتياطي دفعة واحدة. |

الإعداد والتهيئة الكاملان: [Matrix](/ar/channels/matrix)
