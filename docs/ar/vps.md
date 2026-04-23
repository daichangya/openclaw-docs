---
read_when:
    - تريد تشغيل Gateway على خادم Linux أو VPS سحابي
    - تحتاج إلى خريطة سريعة لأدلة الاستضافة
    - تريد ضبطًا عامًا لخادم Linux لـ OpenClaw
sidebarTitle: Linux Server
summary: 'شغّل OpenClaw على خادم Linux أو VPS سحابي — اختيار المزوّد، والبنية، والضبط /*#__analysis to=none code  大发时时彩计划  ഇല്ല reasoning: final only translated text done'
title: خادم Linux
x-i18n:
    generated_at: "2026-04-23T07:34:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# خادم Linux

شغّل OpenClaw Gateway على أي خادم Linux أو VPS سحابي. تساعدك هذه الصفحة على
اختيار مزوّد، وتشرح كيفية عمل النشرات السحابية، وتغطي الضبط العام لـ Linux
الذي ينطبق في كل مكان.

## اختر مزوّدًا

<CardGroup cols={2}>
  <Card title="Railway" href="/ar/install/railway">إعداد بنقرة واحدة عبر المتصفح</Card>
  <Card title="Northflank" href="/ar/install/northflank">إعداد بنقرة واحدة عبر المتصفح</Card>
  <Card title="DigitalOcean" href="/ar/install/digitalocean">VPS مدفوعة بسيطة</Card>
  <Card title="Oracle Cloud" href="/ar/install/oracle">طبقة ARM مجانية دائمًا</Card>
  <Card title="Fly.io" href="/ar/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ar/install/hetzner">Docker على Hetzner VPS</Card>
  <Card title="Hostinger" href="/ar/install/hostinger">VPS مع إعداد بنقرة واحدة</Card>
  <Card title="GCP" href="/ar/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ar/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ar/install/exe-dev">VM مع HTTPS proxy</Card>
  <Card title="Raspberry Pi" href="/ar/install/raspberry-pi">استضافة ذاتية على ARM</Card>
</CardGroup>

تعمل **AWS (EC2 / Lightsail / الفئة المجانية)** أيضًا بشكل جيد.
يتوفر شرح مرئي من المجتمع على
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(مورد من المجتمع -- وقد يصبح غير متاح).

## كيف تعمل الإعدادات السحابية

- تعمل **Gateway على VPS** وتمتلك الحالة + مساحة العمل.
- تتصل من حاسوبك المحمول أو هاتفك عبر **Control UI** أو **Tailscale/SSH**.
- تعامل مع VPS على أنها مصدر الحقيقة، وقم **بنسخ** الحالة + مساحة العمل احتياطيًا بانتظام.
- الافتراضي الآمن: أبقِ Gateway على loopback وادخل إليها عبر نفق SSH أو Tailscale Serve.
  إذا أجريت bind إلى `lan` أو `tailnet`, فاشترط `gateway.auth.token` أو `gateway.auth.password`.

صفحات ذات صلة: [الوصول البعيد إلى Gateway](/ar/gateway/remote)، [مركز المنصات](/ar/platforms).

## وكيل شركة مشترك على VPS

إن تشغيل وكيل واحد لفريق كامل هو إعداد صالح عندما يكون كل المستخدمين ضمن حد الثقة نفسه ويكون الوكيل مخصصًا للأعمال فقط.

- أبقه على بيئة تشغيل مخصصة (VPS/VM/container + مستخدم نظام تشغيل/حسابات مخصصة).
- لا تسجّل دخول بيئة التشغيل تلك إلى حسابات Apple/Google الشخصية أو ملفات تعريف المتصفح/مدير كلمات المرور الشخصية.
- إذا كان المستخدمون عدائيين بعضهم تجاه بعض، فافصل حسب gateway/المضيف/مستخدم نظام التشغيل.

تفاصيل نموذج الأمان: [الأمان](/ar/gateway/security).

## استخدام Nodes مع VPS

يمكنك إبقاء Gateway في السحابة واقتران **Nodes** على أجهزتك المحلية
(Mac/iOS/Android/بدون واجهة). توفّر Nodes إمكانات الشاشة/الكاميرا/canvas المحلية و
`system.run` بينما تبقى Gateway في السحابة.

الوثائق: [Nodes](/ar/nodes)، [CLI الخاصة بـ Nodes](/ar/cli/nodes).

## ضبط بدء التشغيل للـ VMs الصغيرة ومضيفي ARM

إذا بدت أوامر CLI بطيئة على VMs منخفضة القدرة (أو على مضيفي ARM)، فعّل module compile cache الخاص بـ Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- يحسن `NODE_COMPILE_CACHE` أزمنة بدء التشغيل المتكررة للأوامر.
- يتجنب `OPENCLAW_NO_RESPAWN=1` الحمل الإضافي لبدء التشغيل الناتج عن مسار إعادة التشغيل الذاتي.
- يعمل أول تشغيل للأمر على تسخين cache؛ وتكون التشغيلات اللاحقة أسرع.
- بالنسبة إلى التفاصيل الخاصة بـ Raspberry Pi، راجع [Raspberry Pi](/ar/install/raspberry-pi).

### قائمة تحقق لضبط systemd (اختياري)

بالنسبة إلى مضيفي VM الذين يستخدمون `systemd`, فكّر في:

- إضافة env للخدمة لمسار بدء تشغيل ثابت:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- إبقاء سلوك إعادة التشغيل صريحًا:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- فضّل الأقراص المدعومة بـ SSD لمسارات الحالة/cache لتقليل عقوبات بدء التشغيل البارد الناتجة عن الإدخال/الإخراج العشوائي.

بالنسبة إلى المسار القياسي `openclaw onboard --install-daemon`, عدّل وحدة المستخدم:

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

إذا كنت قد ثبّتَّ عمدًا وحدة نظام بدلًا من ذلك، فعدّل
`openclaw-gateway.service` عبر `sudo systemctl edit openclaw-gateway.service`.

كيف تساعد سياسات `Restart=` في الاستعادة التلقائية:
[يمكن لـ systemd أتمتة استعادة الخدمة](https://www.redhat.com/en/blog/systemd-automate-recovery).

وبالنسبة إلى سلوك OOM في Linux، واختيار الضحية بين العمليات الفرعية، وتشخيصات
`exit 137`, راجع [ضغط الذاكرة وعمليات القتل بسبب OOM في Linux](/ar/platforms/linux#memory-pressure-and-oom-kills).
