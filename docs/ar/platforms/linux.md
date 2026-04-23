---
read_when:
    - البحث عن حالة التطبيق المرافق على Linux
    - تخطيط تغطية المنصات أو المساهمات
    - تصحيح عمليات القتل بسبب نفاد الذاكرة على Linux أو خروج 137 على VPS أو حاوية
summary: دعم Linux + حالة التطبيق المرافق
title: تطبيق Linux
x-i18n:
    generated_at: "2026-04-23T07:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# تطبيق Linux

يحظى Gateway بدعم كامل على Linux. وتُعد **Node هي بيئة التشغيل الموصى بها**.
ولا يُنصح باستخدام Bun مع Gateway (بسبب أخطاء WhatsApp/Telegram).

تطبيقات Linux المرافقة الأصلية مخطط لها. والمساهمات مرحّب بها إذا كنت تريد المساعدة في بناء واحد.

## المسار السريع للمبتدئين (VPS)

1. ثبّت Node 24 (موصى به؛ ولا تزال Node 22 LTS، حاليًا `22.14+`، تعمل من أجل التوافق)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. من حاسوبك المحمول: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. افتح `http://127.0.0.1:18789/` وصادِق باستخدام السر المشترك المهيأ (الرمز افتراضيًا؛ أو كلمة المرور إذا ضبطت `gateway.auth.mode: "password"`)

دليل خادم Linux الكامل: [خادم Linux](/ar/vps). ومثال VPS خطوة بخطوة: [exe.dev](/ar/install/exe-dev)

## التثبيت

- [البدء](/ar/start/getting-started)
- [التثبيت والتحديثات](/ar/install/updating)
- تدفقات اختيارية: [Bun (تجريبي)](/ar/install/bun)، [Nix](/ar/install/nix)، [Docker](/ar/install/docker)

## Gateway

- [دليل تشغيل Gateway](/ar/gateway)
- [الإعدادات](/ar/gateway/configuration)

## تثبيت خدمة Gateway (CLI)

استخدم أحد الأوامر التالية:

```
openclaw onboard --install-daemon
```

أو:

```
openclaw gateway install
```

أو:

```
openclaw configure
```

اختر **خدمة Gateway** عند المطالبة.

للإصلاح/الترحيل:

```
openclaw doctor
```

## التحكم بالنظام (وحدة مستخدم systemd)

يثبّت OpenClaw خدمة مستخدم **systemd** افتراضيًا. استخدم خدمة **نظام**
للخوادم المشتركة أو الدائمة التشغيل. ويقوم `openclaw gateway install` و
`openclaw onboard --install-daemon` بالفعل بإنشاء الوحدة القياسية الحالية
لك؛ فاكتب واحدة يدويًا فقط عندما تحتاج إلى إعداد مخصص للنظام/مدير الخدمة.
وتوجد إرشادات الخدمة الكاملة في [دليل تشغيل Gateway](/ar/gateway).

إعداد أدنى:

أنشئ الملف `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

فعّله:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## ضغط الذاكرة وعمليات القتل بسبب نفاد الذاكرة

في Linux، تختار النواة ضحية OOM عندما تنفد الذاكرة من مضيف أو آلة افتراضية أو cgroup
خاصة بحاوية. وقد يكون Gateway ضحية سيئة لأنه يملك جلسات طويلة العمر
واتصالات قنوات. لذلك يجعل OpenClaw عمليات الأبناء العابرة أكثر عرضة
للقتل قبل Gateway عندما يكون ذلك ممكنًا.

بالنسبة إلى عمليات الأبناء المؤهلة على Linux، يبدأ OpenClaw العملية الابنة من خلال
غلاف `/bin/sh` قصير يرفع قيمة `oom_score_adj` الخاصة بالابن إلى `1000`، ثم
ينفّذ الأمر الحقيقي عبر `exec`. وهذه عملية غير مميزة لأن الابن
لا يفعل سوى زيادة احتمالية قتله بسبب OOM.

تشمل أسطح عمليات الأبناء المغطاة ما يلي:

- أبناء الأوامر المُدارة بواسطة supervisor،
- أبناء PTY shell،
- أبناء خوادم MCP stdio،
- عمليات المتصفح/Chrome التي يطلقها OpenClaw.

هذا الغلاف خاص بـ Linux فقط ويتم تخطيه عندما لا يكون `/bin/sh` متاحًا. كما
يتم تخطيه أيضًا إذا ضبطت بيئة الابن القيمة `OPENCLAW_CHILD_OOM_SCORE_ADJ=0` أو `false` أو
`no` أو `off`.

للتحقق من عملية ابن:

```bash
cat /proc/<child-pid>/oom_score_adj
```

القيمة المتوقعة للأبناء المغطّين هي `1000`. ويجب أن يحتفظ
Gateway بدرجته العادية، وعادة تكون `0`.

هذا لا يغني عن ضبط الذاكرة المعتاد. إذا كانت VPS أو الحاوية تقتل الأبناء
مرارًا، فزد حد الذاكرة، أو خفّض التزامن، أو أضف عناصر تحكم أقوى بالموارد مثل
`MemoryMax=` في systemd أو حدود الذاكرة على مستوى الحاوية.
