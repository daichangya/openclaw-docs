---
read_when:
    - اقتران عقدة Android أو إعادة توصيلها
    - تصحيح اكتشاف Android لـ gateway أو المصادقة
    - التحقق من تطابق سجل الدردشة عبر العملاء
summary: 'تطبيق Android ‏(Node): دليل تشغيل الاتصال + سطح أوامر Connect/Chat/Voice/Canvas'
title: تطبيق Android
x-i18n:
    generated_at: "2026-04-25T13:51:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **ملاحظة:** لم يتم إصدار تطبيق Android علنًا بعد. الشيفرة المصدرية متاحة في [مستودع OpenClaw](https://github.com/openclaw/openclaw) تحت `apps/android`. يمكنك بناءه بنفسك باستخدام Java 17 وAndroid SDK ‏(`./gradlew :app:assemblePlayDebug`). راجع [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) للحصول على تعليمات البناء.

## لمحة عن الدعم

- الدور: تطبيق Node مرافق (لا يستضيف Android الـ Gateway).
- هل الـ Gateway مطلوبة؟ نعم (شغّلها على macOS أو Linux أو Windows عبر WSL2).
- التثبيت: [البدء](/ar/start/getting-started) + [الاقتران](/ar/channels/pairing).
- Gateway: [دليل التشغيل](/ar/gateway) + [الإعداد](/ar/gateway/configuration).
  - البروتوكولات: [بروتوكول Gateway](/ar/gateway/protocol) ‏(العُقد + مستوى التحكم).

## التحكم في النظام

يوجد التحكم في النظام (launchd/systemd) على مضيف Gateway. راجع [Gateway](/ar/gateway).

## دليل تشغيل الاتصال

تطبيق Android Node ⇄ ‏(mDNS/NSD + WebSocket) ⇄ **Gateway**

يتصل Android مباشرةً بـ Gateway WebSocket ويستخدم اقتران الأجهزة (`role: node`).

بالنسبة إلى Tailscale أو المضيفين العموميين، يتطلب Android نقطة نهاية آمنة:

- المفضل: Tailscale Serve / Funnel باستخدام `https://<magicdns>` / `wss://<magicdns>`
- مدعوم أيضًا: أي URL لـ Gateway بصيغة `wss://` مع نقطة نهاية TLS حقيقية
- يظل `ws://` غير المشفّر مدعومًا على عناوين LAN الخاصة / مضيفات `.local`، بالإضافة إلى `localhost` و`127.0.0.1` وجسر Android emulator ‏(`10.0.2.2`)

### المتطلبات المسبقة

- يمكنك تشغيل Gateway على الجهاز "الرئيسي".
- يمكن لجهاز/محاكي Android الوصول إلى Gateway WebSocket:
  - على الشبكة المحلية نفسها باستخدام mDNS/NSD، **أو**
  - على Tailscale tailnet نفسها باستخدام Wide-Area Bonjour / unicast DNS-SD ‏(راجع أدناه)، **أو**
  - باستخدام مضيف/منفذ Gateway يدويًا (احتياطيًا)
- لا يستخدم اقتران Android عبر tailnet/الإنترنت نقاط نهاية `ws://` المباشرة بعناوين tailnet IP. استخدم Tailscale Serve أو URL أخرى بصيغة `wss://` بدلًا من ذلك.
- يمكنك تشغيل CLI ‏(`openclaw`) على جهاز gateway (أو عبر SSH).

### 1) ابدأ Gateway

```bash
openclaw gateway --port 18789 --verbose
```

أكّد في السجلات أنك ترى شيئًا مثل:

- `listening on ws://0.0.0.0:18789`

للوصول البعيد من Android عبر Tailscale، فضّل Serve/Funnel بدلًا من ربط tailnet الخام:

```bash
openclaw gateway --tailscale serve
```

يوفر هذا لـ Android نقطة نهاية آمنة `wss://` / `https://`. ولا يكفي إعداد `gateway.bind: "tailnet"` وحده لاقتران Android البعيد لأول مرة إلا إذا قمت أيضًا بإنهاء TLS بشكل منفصل.

### 2) تحقّق من الاكتشاف (اختياري)

من جهاز gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

ملاحظات تصحيح إضافية: [Bonjour](/ar/gateway/bonjour).

إذا كنت قد كوّنت أيضًا نطاق اكتشاف واسع المجال، فقارن مع:

```bash
openclaw gateway discover --json
```

يعرض هذا `local.` بالإضافة إلى النطاق الواسع المكوّن في تمريرة واحدة ويستخدم
نقطة نهاية الخدمة المحلولة بدلًا من تلميحات TXT فقط.

#### اكتشاف tailnet ‏(Vienna ⇄ London) عبر unicast DNS-SD

لن يعبر اكتشاف Android NSD/mDNS بين الشبكات. إذا كانت عقدة Android والـ gateway على شبكتين مختلفتين لكنهما متصلتان عبر Tailscale، فاستخدم Wide-Area Bonjour / unicast DNS-SD بدلًا من ذلك.

الاكتشاف وحده غير كافٍ لاقتران Android عبر tailnet/الإنترنت. فالمسار المكتشف لا يزال يحتاج إلى نقطة نهاية آمنة (`wss://` أو Tailscale Serve):

1. جهّز منطقة DNS-SD ‏(مثال `openclaw.internal.`) على مضيف gateway وانشر سجلات `_openclaw-gw._tcp`.
2. كوّن Tailscale split DNS للنطاق الذي اخترته بحيث يشير إلى خادم DNS هذا.

التفاصيل ومثال إعداد CoreDNS: [Bonjour](/ar/gateway/bonjour).

### 3) اتصل من Android

في تطبيق Android:

- يحافظ التطبيق على اتصال gateway عبر **خدمة في المقدمة** (إشعار دائم).
- افتح تبويب **Connect**.
- استخدم وضع **Setup Code** أو **Manual**.
- إذا كان الاكتشاف محجوبًا، فاستخدم المضيف/المنفذ اليدويين في **Advanced controls**. بالنسبة إلى مضيفات LAN الخاصة، لا يزال `ws://` يعمل. أما بالنسبة إلى مضيفات Tailscale/الإنترنت، ففعّل TLS واستخدم نقطة نهاية `wss://` / Tailscale Serve.

بعد أول اقتران ناجح، يعيد Android الاتصال تلقائيًا عند التشغيل:

- بنقطة النهاية اليدوية (إذا كانت مفعّلة)، وإلا
- بآخر Gateway مكتشفة (بأفضل جهد).

### 4) وافق على الاقتران (CLI)

على جهاز gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

تفاصيل الاقتران: [الاقتران](/ar/channels/pairing).

اختياري: إذا كانت عقدة Android تتصل دائمًا من شبكة فرعية خاضعة لتحكم محكم،
يمكنك الاشتراك في الموافقة التلقائية على أول اقتران للعقدة باستخدام CIDRs أو عناوين IP دقيقة:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

هذا الخيار معطّل افتراضيًا. وينطبق فقط على اقتران `role: node` الجديد
من دون نطاقات مطلوبة. أما اقتران المشغل/المتصفح وأي تغيير في الدور أو
النطاق أو البيانات الوصفية أو المفتاح العام فلا يزال يتطلب موافقة يدوية.

### 5) تحقّق من أن العقدة متصلة

- عبر حالة العُقد:

  ```bash
  openclaw nodes status
  ```

- عبر Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) الدردشة + السجل

يدعم تبويب Chat في Android اختيار الجلسة (الافتراضية `main`، بالإضافة إلى الجلسات الأخرى الموجودة):

- السجل: `chat.history` ‏(مطبع للعرض؛ تتم إزالة وسوم التوجيه المضمنة
  من النص المرئي، كما تتم إزالة حمولات XML النصية العادية لاستدعاءات الأدوات (بما في ذلك
  `<tool_call>...</tool_call>` و`<function_call>...</function_call>`،
  و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>`،
  وكتل استدعاءات الأدوات المقتطعة)، كما تتم إزالة رموز التحكم الخاصة بالنموذج
  المسربة بصيغة ASCII/العرض الكامل، ويتم حذف صفوف المساعد الصامتة الخالصة مثل
  `NO_REPLY` / `no_reply` تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة)
- الإرسال: `chat.send`
- التحديثات الفورية (بأفضل جهد): `chat.subscribe` → `event:"chat"`

### 7) Canvas + الكاميرا

#### Gateway Canvas Host ‏(موصى به لمحتوى الويب)

إذا كنت تريد أن تعرض العقدة محتوى HTML/CSS/JS حقيقيًا يمكن للوكيل تعديله على القرص، فوجه العقدة إلى مضيف canvas الخاص بـ Gateway.

ملاحظة: تقوم العُقد بتحميل canvas من خادم Gateway HTTP ‏(المنفذ نفسه الخاص بـ `gateway.port`، والافتراضي `18789`).

1. أنشئ `~/.openclaw/workspace/canvas/index.html` على مضيف gateway.

2. وجّه العقدة إليه (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet ‏(اختياري): إذا كان الجهازان على Tailscale، فاستخدم اسم MagicDNS أو عنوان tailnet IP بدلًا من `.local`، مثل `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

يقوم هذا الخادم بحقن عميل إعادة تحميل حي داخل HTML ويعيد التحميل عند تغيّر الملفات.
يوجد مضيف A2UI على `http://<gateway-host>:18789/__openclaw__/a2ui/`.

أوامر Canvas ‏(في المقدمة فقط):

- `canvas.eval` و`canvas.snapshot` و`canvas.navigate` ‏(استخدم `{"url":""}` أو `{"url":"/"}` للعودة إلى الهيكل الافتراضي). يعيد `canvas.snapshot` القيمة `{ format, base64 }` ‏(الافتراضي `format="jpeg"`).
- A2UI: ‏`canvas.a2ui.push` و`canvas.a2ui.reset` ‏(`canvas.a2ui.pushJSONL` اسم مستعار قديم)

أوامر الكاميرا ‏(في المقدمة فقط؛ محكومة بالأذونات):

- `camera.snap` ‏(jpg)
- `camera.clip` ‏(mp4)

راجع [Camera node](/ar/nodes/camera) للاطلاع على المعلمات ومساعدات CLI.

### 8) الصوت + سطح أوامر Android الموسّع

- الصوت: يستخدم Android تدفق تشغيل/إيقاف ميكروفون واحدًا في تبويب Voice مع التقاط النص المنسوخ وتشغيل `talk.speak`. ويُستخدم TTS النظام المحلي فقط عندما لا يكون `talk.speak` متاحًا. ويتوقف الصوت عندما يغادر التطبيق المقدمة.
- تمت إزالة أزرار تبديل Voice wake / Talk mode حاليًا من تجربة مستخدم Android ووقت تشغيلها.
- عائلات أوامر Android الإضافية (يعتمد توفرها على الجهاز + الأذونات):
  - `device.status` و`device.info` و`device.permissions` و`device.health`
  - `notifications.list` و`notifications.actions` ‏(راجع [إعادة توجيه الإشعارات](#notification-forwarding) أدناه)
  - `photos.latest`
  - `contacts.search` و`contacts.add`
  - `calendar.events` و`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity` و`motion.pedometer`

## نقاط دخول المساعد

يدعم Android تشغيل OpenClaw من مشغل مساعد النظام (Google
Assistant). وعند الإعداد، يؤدي الضغط المطول على زر الصفحة الرئيسية أو قول "Hey Google, ask
OpenClaw..." إلى فتح التطبيق وتمرير الموجّه إلى محرر الدردشة.

يستخدم هذا بيانات تعريف **App Actions** في Android المعلنة في manifest الخاص بالتطبيق. ولا
يلزم أي إعداد إضافي على جانب gateway — إذ تتم معالجة intent الخاصة بالمساعد بالكامل
داخل تطبيق Android ثم تُمرَّر كرسالة دردشة عادية.

<Note>
يعتمد توفر App Actions على الجهاز وإصدار Google Play Services
وعلى ما إذا كان المستخدم قد عيّن OpenClaw كتطبيق المساعد الافتراضي.
</Note>

## إعادة توجيه الإشعارات

يمكن لـ Android إعادة توجيه إشعارات الجهاز إلى gateway كأحداث. وتتيح عدة عناصر تحكم تحديد نطاق الإشعارات التي تُعاد توجيهها ومتى يحدث ذلك.

| المفتاح                          | النوع          | الوصف                                                                                         |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | أعد توجيه الإشعارات من أسماء هذه الحزم فقط. وإذا تم تعيينه، يتم تجاهل جميع الحزم الأخرى.      |
| `notifications.denyPackages`     | string[]       | لا تُعد توجيه الإشعارات من أسماء هذه الحزم مطلقًا. ويتم تطبيقه بعد `allowPackages`.            |
| `notifications.quietHours.start` | string (HH:mm) | بداية نافذة الساعات الهادئة (بالتوقيت المحلي للجهاز). يتم كتم الإشعارات خلال هذه النافذة.      |
| `notifications.quietHours.end`   | string (HH:mm) | نهاية نافذة الساعات الهادئة.                                                                   |
| `notifications.rateLimit`        | number         | الحد الأقصى لعدد الإشعارات المعاد توجيهها لكل حزمة في الدقيقة. ويتم إسقاط الإشعارات الزائدة.   |

كما يستخدم منتقي الإشعارات سلوكًا أكثر أمانًا لأحداث الإشعارات المعاد توجيهها، ما يمنع إعادة توجيه الإشعارات النظامية الحساسة عن طريق الخطأ.

مثال على الإعداد:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
تتطلب إعادة توجيه الإشعارات إذن Android Notification Listener. ويطالب التطبيق بهذا أثناء الإعداد.
</Note>

## ذو صلة

- [تطبيق iOS](/ar/platforms/ios)
- [Nodes](/ar/nodes)
- [استكشاف أخطاء Android node وإصلاحها](/ar/nodes/troubleshooting)
