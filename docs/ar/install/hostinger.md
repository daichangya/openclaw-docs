---
read_when:
    - إعداد OpenClaw على Hostinger
    - البحث عن VPS مُدار لـ OpenClaw
    - استخدام OpenClaw بنقرة واحدة على Hostinger
summary: استضافة OpenClaw على Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T07:26:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

شغّل OpenClaw Gateway دائمًا على [Hostinger](https://www.hostinger.com/openclaw) عبر نشر **بنقرة واحدة** مُدار أو تثبيت **VPS**.

## المتطلبات المسبقة

- حساب Hostinger ([التسجيل](https://www.hostinger.com/openclaw))
- نحو 5 إلى 10 دقائق

## الخيار A: OpenClaw بنقرة واحدة

أسرع طريقة للبدء. يتولى Hostinger البنية التحتية وDocker والتحديثات التلقائية.

<Steps>
  <Step title="الشراء والتشغيل">
    1. من [صفحة OpenClaw على Hostinger](https://www.hostinger.com/openclaw)، اختر خطة OpenClaw مُدارة وأكمل عملية الشراء.

    <Note>
    أثناء الدفع يمكنك اختيار أرصدة **Ready-to-Use AI** التي تكون مشتراة مسبقًا ومتكاملة فورًا داخل OpenClaw -- ولا حاجة إلى حسابات خارجية أو مفاتيح API من مزودين آخرين. يمكنك البدء في الدردشة فورًا. وبدلًا من ذلك، يمكنك توفير مفتاحك الخاص من Anthropic أو OpenAI أو Google Gemini أو xAI أثناء الإعداد.
    </Note>

  </Step>

  <Step title="اختيار قناة مراسلة">
    اختر قناة واحدة أو أكثر للاتصال:

    - **WhatsApp** -- امسح رمز QR المعروض في معالج الإعداد.
    - **Telegram** -- الصق رمز البوت من [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="إكمال التثبيت">
    انقر **Finish** لنشر المثيل. وبمجرد أن يصبح جاهزًا، ادخل إلى لوحة معلومات OpenClaw من **OpenClaw Overview** في hPanel.
  </Step>

</Steps>

## الخيار B: OpenClaw على VPS

تحكم أكبر في الخادم لديك. ينشر Hostinger OpenClaw عبر Docker على VPS الخاص بك وتديره من خلال **Docker Manager** في hPanel.

<Steps>
  <Step title="شراء VPS">
    1. من [صفحة OpenClaw على Hostinger](https://www.hostinger.com/openclaw)، اختر خطة OpenClaw على VPS وأكمل عملية الشراء.

    <Note>
    يمكنك اختيار أرصدة **Ready-to-Use AI** أثناء الدفع -- وهي أرصدة مشتراة مسبقًا ومتكاملة فورًا داخل OpenClaw، بحيث يمكنك بدء الدردشة من دون أي حسابات خارجية أو مفاتيح API من مزودين آخرين.
    </Note>

  </Step>

  <Step title="إعداد OpenClaw">
    بمجرد توفير VPS، املأ حقول الإعداد:

    - **Gateway token** -- يُنشأ تلقائيًا؛ احفظه لاستخدامه لاحقًا.
    - **رقم WhatsApp** -- رقمك مع رمز الدولة (اختياري).
    - **رمز بوت Telegram** -- من [BotFather](https://t.me/BotFather) (اختياري).
    - **مفاتيح API** -- مطلوبة فقط إذا لم تختر أرصدة Ready-to-Use AI أثناء الدفع.

  </Step>

  <Step title="تشغيل OpenClaw">
    انقر **Deploy**. وبمجرد أن يبدأ التشغيل، افتح لوحة معلومات OpenClaw من hPanel بالنقر على **Open**.
  </Step>

</Steps>

تُدار السجلات وعمليات إعادة التشغيل والتحديثات مباشرة من واجهة Docker Manager في hPanel. وللتحديث، اضغط **Update** في Docker Manager وسيؤدي ذلك إلى سحب أحدث صورة.

## التحقق من الإعداد

أرسل "Hi" إلى مساعدك على القناة التي قمت بتوصيلها. سيرد OpenClaw ويقودك خلال التفضيلات الأولية.

## استكشاف الأخطاء وإصلاحها

**لوحة المعلومات لا تُحمَّل** -- انتظر بضع دقائق حتى تنتهي الحاوية من التهيئة. تحقّق من سجلات Docker Manager في hPanel.

**حاوية Docker تستمر في إعادة التشغيل** -- افتح سجلات Docker Manager وابحث عن أخطاء الإعداد (رموز مفقودة أو مفاتيح API غير صالحة).

**بوت Telegram لا يستجيب** -- أرسل رسالة رمز الاقتران من Telegram مباشرة كرسالة داخل دردشة OpenClaw لإكمال الاتصال.

## الخطوات التالية

- [القنوات](/ar/channels) -- وصّل Telegram وWhatsApp وDiscord وغير ذلك
- [إعدادات Gateway](/ar/gateway/configuration) -- جميع خيارات الإعداد
