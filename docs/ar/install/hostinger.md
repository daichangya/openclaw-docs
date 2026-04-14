---
read_when:
    - إعداد OpenClaw على Hostinger
    - تبحث عن VPS مُدار لـ OpenClaw
    - استخدام OpenClaw بنقرة واحدة من Hostinger
summary: استضف OpenClaw على Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-14T02:08:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf173cdcf6344f8ee22e839a27f4e063a3a102186f9acc07c4a33d4794e2c034
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

شغّل Gateway دائمًا لـ OpenClaw على [Hostinger](https://www.hostinger.com/openclaw) عبر نشر مُدار **بنقرة واحدة** أو تثبيت **VPS**.

## المتطلبات المسبقة

- حساب Hostinger ([التسجيل](https://www.hostinger.com/openclaw))
- حوالي 5-10 دقائق

## الخيار أ: OpenClaw بنقرة واحدة

أسرع طريقة للبدء. تتولى Hostinger البنية التحتية وDocker والتحديثات التلقائية.

<Steps>
  <Step title="الشراء والتشغيل">
    1. من [صفحة OpenClaw على Hostinger](https://www.hostinger.com/openclaw)، اختر خطة OpenClaw مُدارة وأكمل عملية الشراء.

    <Note>
    أثناء إتمام الشراء، يمكنك اختيار أرصدة **Ready-to-Use AI** التي يتم شراؤها مسبقًا ودمجها فورًا داخل OpenClaw -- بدون الحاجة إلى حسابات خارجية أو مفاتيح API من مزودين آخرين. يمكنك بدء الدردشة فورًا. وبدلًا من ذلك، يمكنك تقديم مفتاحك الخاص من Anthropic أو OpenAI أو Google Gemini أو xAI أثناء الإعداد.
    </Note>

  </Step>

  <Step title="اختر قناة مراسلة">
    اختر قناة واحدة أو أكثر للاتصال بها:

    - **WhatsApp** -- امسح رمز QR الظاهر في معالج الإعداد.
    - **Telegram** -- الصق رمز البوت من [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="أكمل التثبيت">
    انقر على **Finish** لنشر المثيل. بمجرد أن يصبح جاهزًا، ادخل إلى لوحة معلومات OpenClaw من **OpenClaw Overview** في hPanel.
  </Step>

</Steps>

## الخيار ب: OpenClaw على VPS

تحكم أكبر في خادمك. تقوم Hostinger بنشر OpenClaw عبر Docker على VPS الخاص بك، وأنت تديره من خلال **Docker Manager** في hPanel.

<Steps>
  <Step title="شراء VPS">
    1. من [صفحة OpenClaw على Hostinger](https://www.hostinger.com/openclaw)، اختر خطة OpenClaw على VPS وأكمل عملية الشراء.

    <Note>
    يمكنك اختيار أرصدة **Ready-to-Use AI** أثناء إتمام الشراء -- يتم شراؤها مسبقًا ودمجها فورًا داخل OpenClaw، بحيث يمكنك بدء الدردشة بدون أي حسابات خارجية أو مفاتيح API من مزودين آخرين.
    </Note>

  </Step>

  <Step title="تهيئة OpenClaw">
    بمجرد توفير VPS، املأ حقول التهيئة:

    - **Gateway token** -- يُنشأ تلقائيًا؛ احفظه لاستخدامه لاحقًا.
    - **رقم WhatsApp** -- رقمك مع رمز الدولة (اختياري).
    - **Telegram bot token** -- من [BotFather](https://t.me/BotFather) (اختياري).
    - **مفاتيح API** -- مطلوبة فقط إذا لم تختر أرصدة Ready-to-Use AI أثناء إتمام الشراء.

  </Step>

  <Step title="ابدأ OpenClaw">
    انقر على **Deploy**. بمجرد أن يعمل، افتح لوحة معلومات OpenClaw من hPanel بالنقر على **Open**.
  </Step>

</Steps>

تُدار السجلات وعمليات إعادة التشغيل والتحديثات مباشرة من واجهة Docker Manager في hPanel. للتحديث، اضغط على **Update** في Docker Manager وسيؤدي ذلك إلى سحب أحدث صورة.

## تحقّق من إعدادك

أرسل "Hi" إلى مساعدك على القناة التي قمت بربطها. سيرد OpenClaw ويأخذك عبر التفضيلات الأولية.

## استكشاف الأخطاء وإصلاحها

**لوحة المعلومات لا يتم تحميلها** -- انتظر بضع دقائق حتى ينتهي توفير الحاوية. تحقق من سجلات Docker Manager في hPanel.

**حاوية Docker تستمر في إعادة التشغيل** -- افتح سجلات Docker Manager وابحث عن أخطاء في التهيئة (رموز مفقودة، مفاتيح API غير صالحة).

**بوت Telegram لا يستجيب** -- أرسل رسالة رمز الاقتران من Telegram مباشرة كرسالة داخل دردشة OpenClaw الخاصة بك لإكمال الاتصال.

## الخطوات التالية

- [القنوات](/ar/channels) -- اربط Telegram وWhatsApp وDiscord والمزيد
- [تهيئة Gateway](/ar/gateway/configuration) -- جميع خيارات التهيئة
