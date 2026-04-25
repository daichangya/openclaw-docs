---
read_when:
    - تشغيل مضيف Node بدون واجهة
    - اقتران Node غير تابع لـ macOS لاستخدام `system.run`
summary: مرجع CLI لـ `openclaw node` ‏(مضيف Node بدون واجهة)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

شغّل **مضيف Node بدون واجهة** يتصل بـ Gateway WebSocket ويعرض
`system.run` و`system.which` على هذا الجهاز.

## لماذا تستخدم مضيف Node؟

استخدم مضيف Node عندما تريد أن تقوم الوكلاء **بتشغيل الأوامر على أجهزة أخرى** في
شبكتك من دون تثبيت تطبيق مرافق كامل لـ macOS عليها.

حالات الاستخدام الشائعة:

- تشغيل الأوامر على أجهزة Linux/Windows بعيدة (خوادم البناء، وأجهزة المختبر، وNAS).
- الإبقاء على exec **ضمن sandbox** على Gateway، مع تفويض عمليات التشغيل الموافق عليها إلى مضيفين آخرين.
- توفير هدف تنفيذ خفيف وبدون واجهة للأتمتة أو عقد CI.

لا يزال التنفيذ محكومًا بواسطة **موافقات exec** وقوائم السماح الخاصة بكل وكيل على
مضيف Node، بحيث يمكنك إبقاء الوصول إلى الأوامر محدد النطاق وواضحًا.

## وكيل المتصفح (من دون إعداد)

تعلن مضيفات Node تلقائيًا عن وكيل متصفح إذا لم يتم تعطيل `browser.enabled` على
العقدة. وهذا يتيح للوكيل استخدام أتمتة المتصفح على تلك العقدة من دون إعداد إضافي.

بشكل افتراضي، يعرّض الوكيل سطح ملف تعريف المتصفح العادي للعقدة. وإذا قمت
بتعيين `nodeHost.browserProxy.allowProfiles`، يصبح الوكيل مقيّدًا:
يتم رفض استهداف ملفات التعريف غير المدرجة في قائمة السماح، ويتم حظر
مسارات إنشاء/حذف ملفات التعريف الدائمة عبر الوكيل.

عطّله على العقدة إذا لزم الأمر:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## التشغيل (في المقدمة)

```bash
openclaw node run --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف Gateway WebSocket ‏(الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket ‏(الافتراضي: `18789`)
- `--tls`: استخدام TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (`sha256`)
- `--node-id <id>`: تجاوز معرّف العقدة (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز الاسم المعروض للعقدة

## مصادقة Gateway لمضيف Node

يحل `openclaw node run` و`openclaw node install` مصادقة Gateway من config/env (من دون إشارات `--token`/`--password` في أوامر العقدة):

- يتم التحقق من `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` أولًا.
- ثم الاحتياط إلى الإعداد المحلي: `gateway.auth.token` / `gateway.auth.password`.
- في الوضع المحلي، لا يرث مضيف Node عمدًا `gateway.remote.token` / `gateway.remote.password`.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حلّه، فإن حل مصادقة العقدة يفشل بشكل مغلق (من دون احتياط بعيد يحجب المشكلة).
- في `gateway.mode=remote`، تكون حقول العميل البعيد (`gateway.remote.token` / `gateway.remote.password`) مؤهلة أيضًا وفق قواعد أولوية الوضع البعيد.
- لا يراعي حل مصادقة مضيف Node إلا متغيرات البيئة `OPENCLAW_GATEWAY_*`.

بالنسبة إلى عقدة تتصل بـ Gateway غير loopback عبر `ws://` على شبكة خاصة
موثوقة، عيّن `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. ومن دون ذلك، يفشل
بدء تشغيل العقدة بشكل مغلق ويطلب منك استخدام `wss://` أو نفق SSH أو Tailscale.
هذا اشتراك على مستوى بيئة العملية، وليس مفتاح إعداد في `openclaw.json`.
ويقوم `openclaw node install` بحفظه في خدمة العقدة الخاضعة للإشراف عندما يكون
موجودًا في بيئة أمر التثبيت.

## الخدمة (في الخلفية)

ثبّت مضيف Node بدون واجهة كخدمة مستخدم.

```bash
openclaw node install --host <gateway-host> --port 18789
```

الخيارات:

- `--host <host>`: مضيف Gateway WebSocket ‏(الافتراضي: `127.0.0.1`)
- `--port <port>`: منفذ Gateway WebSocket ‏(الافتراضي: `18789`)
- `--tls`: استخدام TLS لاتصال Gateway
- `--tls-fingerprint <sha256>`: بصمة شهادة TLS المتوقعة (`sha256`)
- `--node-id <id>`: تجاوز معرّف العقدة (يمسح رمز الاقتران)
- `--display-name <name>`: تجاوز الاسم المعروض للعقدة
- `--runtime <runtime>`: وقت تشغيل الخدمة (`node` أو `bun`)
- `--force`: إعادة التثبيت/الاستبدال إذا كانت مثبّتة بالفعل

إدارة الخدمة:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

استخدم `openclaw node run` لمضيف Node يعمل في المقدمة (من دون خدمة).

تقبل أوامر الخدمة `--json` للحصول على مخرجات قابلة للقراءة آليًا.

## الاقتران

ينشئ أول اتصال طلب اقتران جهاز معلقًا (`role: node`) على Gateway.
وافق عليه عبر:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

في شبكات العقد الخاضعة لتحكم محكم، يمكن لمشغل Gateway الاشتراك صراحةً
في الموافقة التلقائية على أول اقتران للعقدة من CIDRs موثوقة:

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

هذا معطّل افتراضيًا. وينطبق فقط على اقتران `role: node` الجديد
من دون نطاقات مطلوبة. أما عملاء المشغل/المتصفح وControl UI وWebChat
وترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام فلا تزال
تتطلب موافقة يدوية.

إذا أعادت العقدة محاولة الاقتران مع تغيّر تفاصيل المصادقة (الدور/النطاقات/المفتاح العام)،
فسيتم استبدال الطلب المعلق السابق وإنشاء `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

يخزن مضيف Node معرّف العقدة والرمز والاسم المعروض ومعلومات اتصال Gateway في
`~/.openclaw/node.json`.

## موافقات exec

تكون `system.run` محكومة بموافقات exec المحلية:

- `~/.openclaw/exec-approvals.json`
- [موافقات exec](/ar/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (للتحرير من Gateway)

بالنسبة إلى exec غير المتزامن الموافق عليه على العقدة، يُعد OpenClaw
`systemRunPlan` قياسيًا قبل طلب الموافقة. وتعيد عملية تمرير `system.run`
الموافق عليها لاحقًا استخدام تلك الخطة المخزنة، لذلك يتم رفض التعديلات على
حقول الأمر أو`cwd` أو الجلسة بعد إنشاء طلب الموافقة بدلًا من تغيير ما
تنفذه العقدة.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Nodes](/ar/nodes)
