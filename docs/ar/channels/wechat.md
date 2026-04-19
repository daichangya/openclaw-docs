---
read_when:
    - تريد ربط OpenClaw بـ WeChat أو Weixin
    - أنت تقوم بتثبيت Plugin القناة `openclaw-weixin` أو استكشاف أخطائه وإصلاحها
    - تحتاج إلى فهم كيفية تشغيل Plugins القنوات الخارجية إلى جانب Gateway
summary: إعداد قناة WeChat من خلال Plugin الخارجي openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-19T01:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

يتصل OpenClaw بـ WeChat من خلال Plugin القناة الخارجي
`@tencent-weixin/openclaw-weixin` التابع لـ Tencent.

الحالة: Plugin خارجي. المحادثات المباشرة والوسائط مدعومة. الدردشات الجماعية غير
معلن عنها في بيانات قدرات Plugin الحالية.

## التسمية

- **WeChat** هو الاسم الظاهر للمستخدم في هذه الوثائق.
- **Weixin** هو الاسم المستخدم من قِبل حزمة Tencent ومعرّف Plugin.
- `openclaw-weixin` هو معرّف قناة OpenClaw.
- `@tencent-weixin/openclaw-weixin` هي حزمة npm.

استخدم `openclaw-weixin` في أوامر CLI ومسارات الإعدادات.

## كيف يعمل

لا يوجد كود WeChat داخل مستودع OpenClaw الأساسي. يوفّر OpenClaw
عقد Plugin القناة العام، بينما يوفّر Plugin الخارجي
بيئة التشغيل الخاصة بـ WeChat:

1. يقوم `openclaw plugins install` بتثبيت `@tencent-weixin/openclaw-weixin`.
2. يكتشف Gateway ملف بيان Plugin ويحمّل نقطة إدخال Plugin.
3. يسجّل Plugin معرّف القناة `openclaw-weixin`.
4. يبدأ `openclaw channels login --channel openclaw-weixin` تسجيل الدخول عبر QR.
5. يخزّن Plugin بيانات اعتماد الحساب ضمن دليل حالة OpenClaw.
6. عند بدء تشغيل Gateway، يبدأ Plugin مراقبة Weixin لكل
   حساب تم تكوينه.
7. تتم تسوية رسائل WeChat الواردة عبر عقد القناة، وتوجيهها إلى
   وكيل OpenClaw المحدد، ثم إرسالها مرة أخرى عبر مسار الإرسال الصادر الخاص بـ Plugin.

هذا الفصل مهم: يجب أن يظل OpenClaw الأساسي غير مرتبط بأي قناة بعينها. تسجيل دخول WeChat،
واستدعاءات Tencent iLink API، ورفع/تنزيل الوسائط، ورموز السياق، ومراقبة
الحسابات كلها مملوكة لـ Plugin الخارجي.

## التثبيت

التثبيت السريع:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

التثبيت اليدوي:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

أعد تشغيل Gateway بعد التثبيت:

```bash
openclaw gateway restart
```

## تسجيل الدخول

شغّل تسجيل الدخول عبر QR على نفس الجهاز الذي يشغّل Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

امسح رمز QR باستخدام WeChat على هاتفك وأكّد تسجيل الدخول. يحفظ Plugin
رمز الحساب محليًا بعد نجاح المسح.

لإضافة حساب WeChat آخر، شغّل أمر تسجيل الدخول نفسه مرة أخرى. بالنسبة إلى
الحسابات المتعددة، اعزل جلسات الرسائل المباشرة حسب الحساب والقناة والمرسل:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## التحكم في الوصول

تستخدم الرسائل المباشرة نموذج الاقتران وقائمة السماح المعتادَين في OpenClaw لـ Plugins
القنوات.

اعتمد المرسلين الجدد:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

للاطلاع على نموذج التحكم الكامل في الوصول، راجع [الاقتران](/ar/channels/pairing).

## التوافق

يفحص Plugin إصدار OpenClaw على المضيف عند بدء التشغيل.

| سطر Plugin | إصدار OpenClaw         | وسم npm  |
| ---------- | ---------------------- | -------- |
| `2.x`      | `>=2026.3.22`          | `latest` |
| `1.x`      | `>=2026.1.0 <2026.3.22` | `legacy` |

إذا أبلغ Plugin أن إصدار OpenClaw لديك قديم جدًا، فإمّا أن تحدّث
OpenClaw أو تثبّت سطر Plugin القديم:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## عملية Sidecar

يمكن لـ Plugin الخاص بـ WeChat تشغيل أعمال مساعدة إلى جانب Gateway أثناء مراقبته
لـ Tencent iLink API. في المشكلة #68451، كشف مسار المساعد هذا عن خلل في
تنظيف Gateway القديم العام في OpenClaw: إذ كان بإمكان عملية فرعية أن تحاول تنظيف
عملية Gateway الأصلية، مما يسبب حلقات إعادة تشغيل ضمن مديري العمليات مثل systemd.

يستثني تنظيف بدء التشغيل الحالي في OpenClaw العملية الحالية وأسلافها،
لذلك يجب ألا تقوم أداة مساعدة للقناة بقتل Gateway الذي أطلقها. هذا الإصلاح
عام؛ وليس مسارًا خاصًا بـ WeChat داخل النظام الأساسي.

## استكشاف الأخطاء وإصلاحها

تحقق من التثبيت والحالة:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

إذا ظهرت القناة على أنها مثبّتة لكنها لا تتصل، فتأكد من أن Plugin
مفعّل ثم أعد التشغيل:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

إذا كان Gateway يعيد التشغيل بشكل متكرر بعد تفعيل WeChat، فحدّث كلًا من OpenClaw و
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

تعطيل مؤقت:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## وثائق ذات صلة

- نظرة عامة على القنوات: [قنوات الدردشة](/ar/channels)
- الاقتران: [الاقتران](/ar/channels/pairing)
- توجيه القنوات: [توجيه القنوات](/ar/channels/channel-routing)
- معمارية Plugin: [معمارية Plugin](/ar/plugins/architecture)
- SDK لـ Plugin القناة: [SDK لـ Plugin القناة](/ar/plugins/sdk-channel-plugins)
- الحزمة الخارجية: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
