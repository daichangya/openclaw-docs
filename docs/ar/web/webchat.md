---
read_when:
    - تصحيح أو تهيئة الوصول إلى WebChat
summary: مضيف WebChat الثابت على loopback واستخدام Gateway WS لواجهة الدردشة
title: WebChat
x-i18n:
    generated_at: "2026-04-25T14:02:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

الحالة: تتحدث واجهة الدردشة SwiftUI على macOS/iOS مباشرة مع WebSocket الخاص بـ Gateway.

## ما هي

- واجهة دردشة أصلية للـ gateway (من دون متصفح مضمّن ومن دون خادم ثابت محلي).
- تستخدم الجلسات وقواعد التوجيه نفسها المستخدمة في القنوات الأخرى.
- توجيه حتمي: تعود الردود دائمًا إلى WebChat.

## البدء السريع

1. ابدأ الـ gateway.
2. افتح واجهة WebChat ‏(تطبيق macOS/iOS) أو علامة تبويب الدردشة في Control UI.
3. تأكد من تهيئة مسار مصادقة صالح للـ gateway (السر المشترك افتراضيًا،
   حتى على loopback).

## كيف تعمل (السلوك)

- تتصل الواجهة بـ Gateway WebSocket وتستخدم `chat.history` و`chat.send` و`chat.inject`.
- يكون `chat.history` مقيدًا من أجل الاستقرار: قد يقوم Gateway باقتطاع حقول النص الطويلة، وإهمال البيانات الوصفية الثقيلة، واستبدال الإدخالات كبيرة الحجم بالقيمة `[chat.history omitted: message too large]`.
- يتم أيضًا تطبيع `chat.history` من أجل العرض: إذ تُزال من النص المرئي
  سياقات OpenClaw الخاصة بوقت التشغيل فقط،
  وأغلفة المظاريف الواردة، ووسوم توجيهات التسليم المضمنة
  مثل `[[reply_to_*]]` و`[[audio_as_voice]]`، وحمولات XML النصية العادية
  لاستدعاءات الأدوات (بما في ذلك `<tool_call>...</tool_call>`،
  و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
  و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)، و
  رموز التحكم الخاصة بالنموذج المسرّبة بصيغة ASCII/العرض الكامل،
  كما تُحذف إدخالات المساعد التي يكون كامل نصها المرئي هو فقط
  الرمز الصامت المطابق تمامًا `NO_REPLY` / `no_reply`.
- يضيف `chat.inject` ملاحظة مساعد مباشرة إلى النص المفرغ ويبثها إلى الواجهة (من دون تشغيل agent).
- يمكن للتشغيلات المُجهضة إبقاء مخرجات المساعد الجزئية مرئية في الواجهة.
- يحتفظ Gateway بنص المساعد الجزئي المُجهَض في سجل النص المفرغ عندما تكون هناك مخرجات مخزنة مؤقتًا، ويعلّم تلك الإدخالات ببيانات وصفية للإجهاض.
- يُجلَب السجل دائمًا من الـ gateway (من دون مراقبة ملفات محلية).
- إذا كان الـ gateway غير قابل للوصول، تصبح WebChat للقراءة فقط.

## لوحة أدوات agents في Control UI

- تحتوي لوحة الأدوات في `/agents` ضمن Control UI على عرضين منفصلين:
  - يستخدم **المتاح الآن** القيمة `tools.effective(sessionKey=...)` ويعرض ما يمكن
    للجلسة الحالية استخدامه فعليًا وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات Plugins، والأدوات المملوكة للقنوات.
  - يستخدم **تهيئة الأدوات** القيمة `tools.catalog` ويبقى مركّزًا على ملفات التعريف، والتجاوزات، و
    دلالات الفهرس.
- يكون التوفر وقت التشغيل ضمن نطاق الجلسة. ويمكن أن يؤدي تبديل الجلسات على الـ agent نفسه إلى تغيير
  قائمة **المتاح الآن**.
- لا يعني محرر التهيئة توفرًا وقت التشغيل؛ فما يزال الوصول الفعلي يتبع
  أولوية السياسة (`allow`/`deny`، والتجاوزات لكل agent ولكل موفر/قناة).

## الاستخدام البعيد

- يقوم الوضع البعيد بنفق Gateway WebSocket عبر SSH/Tailscale.
- لا تحتاج إلى تشغيل خادم WebChat منفصل.

## مرجع التهيئة (WebChat)

التهيئة الكاملة: [التهيئة](/ar/gateway/configuration)

خيارات WebChat:

- `gateway.webchat.chatHistoryMaxChars`: الحد الأقصى لعدد الأحرف في حقول النص ضمن استجابات `chat.history`. عندما يتجاوز إدخال في النص المفرغ هذا الحد، يقوم Gateway باقتطاع حقول النص الطويلة وقد يستبدل الرسائل كبيرة الحجم بعنصر نائب. ويمكن أيضًا للعميل إرسال `maxChars` لكل طلب لتجاوز هذا الافتراضي في استدعاء `chat.history` واحد.

الخيارات العامة ذات الصلة:

- `gateway.port`، `gateway.bind`: مضيف/منفذ WebSocket.
- `gateway.auth.mode`، `gateway.auth.token`، `gateway.auth.password`:
  مصادقة WebSocket بالسر المشترك.
- `gateway.auth.allowTailscale`: يمكن لعلامة تبويب الدردشة في Control UI ضمن المتصفح استخدام
  رؤوس هوية Tailscale Serve عند التمكين.
- `gateway.auth.mode: "trusted-proxy"`: مصادقة الوكيل العكسي لعملاء المتصفح خلف مصدر وكيل **غير loopback** واعٍ بالهوية (راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth)).
- `gateway.remote.url`، `gateway.remote.token`، `gateway.remote.password`: هدف الـ gateway البعيد.
- `session.*`: تخزين الجلسة وافتراضيات المفتاح الرئيسي.

## ذو صلة

- [Control UI](/ar/web/control-ui)
- [لوحة التحكم](/ar/web/dashboard)
