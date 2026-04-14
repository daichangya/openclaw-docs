---
read_when:
    - تريد تشغيل Gateway على خادم Linux أو على VPS سحابي
    - تحتاج إلى خريطة سريعة لأدلة الاستضافة
    - تريد ضبطًا عامًا لخادم Linux من أجل OpenClaw
sidebarTitle: Linux Server
summary: شغّل OpenClaw على خادم Linux أو على VPS سحابي — منتقي المزوّد، البنية المعمارية، والضبط الدقيق
title: خادم Linux
x-i18n:
    generated_at: "2026-04-14T02:08:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e623f4c770132e01628d66bfb8cd273bbef6dad633b812496c90da5e3e0f1383
    source_path: vps.md
    workflow: 15
---

# خادم Linux

شغّل OpenClaw Gateway على أي خادم Linux أو VPS سحابي. تساعدك هذه الصفحة على
اختيار مزوّد، وتشرح كيفية عمل عمليات النشر السحابية، وتغطي الضبط العام لـ Linux
الذي ينطبق في كل مكان.

## اختر مزوّدًا

<CardGroup cols={2}>
  <Card title="Railway" href="/ar/install/railway">إعداد بنقرة واحدة من المتصفح</Card>
  <Card title="Northflank" href="/ar/install/northflank">إعداد بنقرة واحدة من المتصفح</Card>
  <Card title="DigitalOcean" href="/ar/install/digitalocean">VPS مدفوع بسيط</Card>
  <Card title="Oracle Cloud" href="/ar/install/oracle">طبقة ARM مجانية دائمًا</Card>
  <Card title="Fly.io" href="/ar/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ar/install/hetzner">Docker على VPS من Hetzner</Card>
  <Card title="Hostinger" href="/ar/install/hostinger">VPS مع إعداد بنقرة واحدة</Card>
  <Card title="GCP" href="/ar/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ar/install/azure">آلة افتراضية Linux</Card>
  <Card title="exe.dev" href="/ar/install/exe-dev">آلة افتراضية مع وكيل HTTPS</Card>
  <Card title="Raspberry Pi" href="/ar/install/raspberry-pi">استضافة ذاتية ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / الطبقة المجانية)** يعمل أيضًا بشكل ممتاز.
يتوفر شرح فيديو من المجتمع على
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(مورد من المجتمع -- قد يصبح غير متاح).

## كيف تعمل الإعدادات السحابية

- يعمل **Gateway على الـ VPS** ويتولى الحالة + مساحة العمل.
- تتصل من الكمبيوتر المحمول أو الهاتف عبر **Control UI** أو **Tailscale/SSH**.
- اعتبر الـ VPS مصدر الحقيقة، و**انسخ احتياطيًا** الحالة + مساحة العمل بانتظام.
- الإعداد الآمن افتراضيًا: أبقِ Gateway على local loopback وادخل إليه عبر نفق SSH أو Tailscale Serve.
  إذا ربطته بـ `lan` أو `tailnet`، فاطلب `gateway.auth.token` أو `gateway.auth.password`.

الصفحات ذات الصلة: [الوصول البعيد إلى Gateway](/ar/gateway/remote)، [مركز المنصات](/ar/platforms).

## وكيل شركة مشترك على VPS

يُعد تشغيل وكيل واحد لفريق إعدادًا صالحًا عندما يكون كل مستخدم ضمن نفس نطاق الثقة ويكون الوكيل مخصصًا للأعمال فقط.

- أبقه على بيئة تشغيل مخصصة (VPS/VM/حاوية + مستخدم/حسابات نظام تشغيل مخصصة).
- لا تسجّل دخول بيئة التشغيل تلك إلى حسابات Apple/Google الشخصية أو ملفات المتصفح/مدير كلمات المرور الشخصية.
- إذا كان المستخدمون خصومًا لبعضهم البعض، فقسّمهم حسب gateway/المضيف/مستخدم نظام التشغيل.

تفاصيل نموذج الأمان: [الأمان](/ar/gateway/security).

## استخدام Node مع VPS

يمكنك إبقاء Gateway في السحابة وإقران **Node** على أجهزتك المحلية
(Mac/iOS/Android/بدون واجهة). توفّر Node إمكانات الشاشة/الكاميرا/لوحة الرسم المحلية و
`system.run` بينما يبقى Gateway في السحابة.

الوثائق: [Node](/ar/nodes)، [Node CLI](/cli/nodes).

## ضبط بدء التشغيل للآلات الافتراضية الصغيرة ومضيفي ARM

إذا كانت أوامر CLI تبدو بطيئة على الآلات الافتراضية منخفضة القدرة (أو مضيفي ARM)، فعّل ذاكرة التخزين المؤقت لتجميع الوحدات في Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- يعمل `NODE_COMPILE_CACHE` على تحسين أوقات بدء التشغيل المتكررة للأوامر.
- يتجنب `OPENCLAW_NO_RESPAWN=1` حمل بدء التشغيل الإضافي الناتج عن مسار إعادة التشغيل الذاتي.
- يؤدي تشغيل الأمر لأول مرة إلى تهيئة ذاكرة التخزين المؤقت؛ وتصبح عمليات التشغيل اللاحقة أسرع.
- للاطلاع على التفاصيل الخاصة بـ Raspberry Pi، راجع [Raspberry Pi](/ar/install/raspberry-pi).

### قائمة التحقق من ضبط systemd (اختياري)

بالنسبة لمضيفي الآلات الافتراضية الذين يستخدمون `systemd`، يُنصح بما يلي:

- أضف متغيرات بيئة للخدمة من أجل مسار بدء تشغيل ثابت:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- اجعل سلوك إعادة التشغيل صريحًا:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- فضّل الأقراص المعتمدة على SSD لمسارات الحالة/التخزين المؤقت لتقليل عقوبات البدء البارد الناتجة عن الإدخال/الإخراج العشوائي.

بالنسبة إلى المسار القياسي `openclaw onboard --install-daemon`، حرّر وحدة المستخدم:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

إذا كنت قد ثبّتَّ عمدًا وحدة نظام بدلًا من ذلك، فحرّر
`openclaw-gateway.service` عبر `sudo systemctl edit openclaw-gateway.service`.

كيف تساعد سياسات `Restart=` في الاسترداد التلقائي:
[يمكن لـ systemd أتمتة استرداد الخدمة](https://www.redhat.com/en/blog/systemd-automate-recovery).
