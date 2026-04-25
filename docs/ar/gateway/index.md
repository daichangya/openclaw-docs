---
read_when:
    - تشغيل عملية Gateway أو تصحيح أخطائها
summary: دليل التشغيل لخدمة Gateway ودورة حياتها وعملياتها
title: دليل تشغيل Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

استخدم هذه الصفحة لعمليات بدء التشغيل في اليوم الأول وعمليات التشغيل في اليوم الثاني لخدمة Gateway.

<CardGroup cols={2}>
  <Card title="استكشاف الأخطاء المتعمق" icon="siren" href="/ar/gateway/troubleshooting">
    تشخيصات تبدأ من الأعراض مع سلاسل أوامر دقيقة وتواقيع سجلات.
  </Card>
  <Card title="الإعداد" icon="sliders" href="/ar/gateway/configuration">
    دليل إعداد موجّه للمهام + مرجع إعداد كامل.
  </Card>
  <Card title="إدارة Secrets" icon="key-round" href="/ar/gateway/secrets">
    عقد SecretRef، وسلوك اللقطة في وقت التشغيل، وعمليات الترحيل/إعادة التحميل.
  </Card>
  <Card title="عقد خطة Secrets" icon="shield-check" href="/ar/gateway/secrets-plan-contract">
    قواعد الهدف/المسار الدقيقة لـ `secrets apply` وسلوك ملف تعريف المصادقة المرجعي فقط.
  </Card>
</CardGroup>

## بدء تشغيل محلي خلال 5 دقائق

<Steps>
  <Step title="ابدأ تشغيل Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="تحقق من سلامة الخدمة">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

الخط الأساسي السليم: `Runtime: running` و`Connectivity probe: ok` و`Capability: ...` بما يطابق ما تتوقعه. استخدم `openclaw gateway status --require-rpc` عندما تحتاج إلى إثبات RPC بنطاق القراءة، وليس مجرد إمكانية الوصول.

  </Step>

  <Step title="تحقق من جاهزية القناة">

```bash
openclaw channels status --probe
```

مع وجود Gateway يمكن الوصول إليه، يشغّل هذا عمليات فحص حية لكل حساب واختبارات اختيارية.
إذا تعذر الوصول إلى Gateway، يعود CLI إلى ملخصات القنوات المعتمدة على الإعداد فقط بدلًا
من خرج الفحص الحي.

  </Step>
</Steps>

<Note>
تراقب إعادة تحميل إعداد Gateway مسار ملف الإعداد النشط (الذي يتم حله من القيم الافتراضية للملف الشخصي/الحالة، أو `OPENCLAW_CONFIG_PATH` عند تعيينه).
الوضع الافتراضي هو `gateway.reload.mode="hybrid"`.
بعد أول تحميل ناجح، تخدم العملية الجارية لقطة الإعداد النشطة داخل الذاكرة؛ وتستبدل إعادة التحميل الناجحة هذه اللقطة بشكل ذري.
</Note>

## نموذج وقت التشغيل

- عملية واحدة دائمة التشغيل للتوجيه ومستوى التحكم واتصالات القنوات.
- منفذ واحد متعدد الإرسال من أجل:
  - تحكم/RPC عبر WebSocket
  - HTTP APIs، متوافقة مع OpenAI ‏(`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI والخطافات
- وضع الربط الافتراضي: `loopback`.
- تكون المصادقة مطلوبة افتراضيًا. تستخدم إعدادات shared-secret
  القيم `gateway.auth.token` / `gateway.auth.password` (أو
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)، ويمكن لإعدادات
  reverse-proxy غير loopback استخدام `gateway.auth.mode: "trusted-proxy"`.

## نقاط النهاية المتوافقة مع OpenAI

أعلى سطح توافق تأثيرًا في OpenClaw أصبح الآن:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

لماذا تهم هذه المجموعة:

- تتحقق معظم تكاملات Open WebUI وLobeChat وLibreChat من `/v1/models` أولًا.
- تتوقع كثير من مسارات RAG والذاكرة وجود `/v1/embeddings`.
- تفضّل التطبيقات الأصلية للوكلاء بشكل متزايد `/v1/responses`.

ملاحظة تخطيطية:

- المسار `/v1/models` موجّه للوكلاء أولًا: فهو يعيد `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
- `openclaw/default` هو الاسم البديل المستقر الذي يرتبط دائمًا بالوكيل الافتراضي المكوَّن.
- استخدم `x-openclaw-model` عندما تريد تجاوز موفّر/model في backend؛ وإلا فسيظل النموذج العادي للوكيل المختار وإعداد embeddings الخاص به هما المسيطرين.

كل هذه المسارات تعمل على منفذ Gateway الرئيسي وتستخدم حد المصادقة نفسه للمشغّل الموثوق مثل بقية Gateway HTTP API.

### أولوية المنفذ والربط

| الإعداد      | ترتيب الحل                                                     |
| ------------ | -------------------------------------------------------------- |
| منفذ Gateway | `--port` ← `OPENCLAW_GATEWAY_PORT` ← `gateway.port` ← `18789` |
| وضع الربط    | CLI/التجاوز ← `gateway.bind` ← `loopback`                     |

### أوضاع إعادة التحميل الساخن

| `gateway.reload.mode` | السلوك                                   |
| --------------------- | ---------------------------------------- |
| `off`                 | لا إعادة تحميل للإعداد                   |
| `hot`                 | تطبيق التغييرات الآمنة ساخنًا فقط        |
| `restart`             | إعادة التشغيل عند التغييرات التي تتطلب إعادة تحميل |
| `hybrid` (الافتراضي)  | تطبيق ساخن عند الأمان، وإعادة تشغيل عند الحاجة |

## مجموعة أوامر المشغّل

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

إن `gateway status --deep` مخصّص لاكتشاف الخدمة الإضافي (LaunchDaemons/وحدات systemd على مستوى النظام/schtasks)، وليس لفحص سلامة RPC أعمق.

## عدة Gateways (على المضيف نفسه)

يجب أن تشغّل معظم عمليات التثبيت gateway واحدًا لكل جهاز. يمكن لـ gateway واحد استضافة عدة
وكلاء وقنوات.

أنت تحتاج إلى عدة Gateways فقط عندما تريد عمدًا العزل أو روبوت إنقاذ.

فحوصات مفيدة:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

ما الذي تتوقعه:

- يمكن لـ `gateway status --deep` الإبلاغ عن `Other gateway-like services detected (best effort)`
  وطباعة تلميحات تنظيف عندما لا تزال تثبيتات launchd/systemd/schtasks القديمة موجودة.
- يمكن لـ `gateway probe` التحذير من `multiple reachable gateways` عندما يستجيب أكثر من هدف واحد.
- إذا كان ذلك مقصودًا، فاعزل المنافذ والإعداد/الحالة وجذور مساحة العمل لكل gateway.

قائمة التحقق لكل مثيل:

- `gateway.port` فريد
- `OPENCLAW_CONFIG_PATH` فريد
- `OPENCLAW_STATE_DIR` فريد
- `agents.defaults.workspace` فريد

مثال:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

إعداد مفصل: [/gateway/multiple-gateways](/ar/gateway/multiple-gateways).

## نقطة نهاية الدماغ الآني لـ VoiceClaw

يكشف OpenClaw عن نقطة نهاية WebSocket آنية متوافقة مع VoiceClaw على
`/voiceclaw/realtime`. استخدمها عندما يجب أن يتحدث عميل VoiceClaw المكتبي
مباشرةً إلى دماغ OpenClaw آني بدلًا من المرور عبر عملية relay منفصلة.

تستخدم نقطة النهاية Gemini Live للصوت الآني وتستدعي OpenClaw بوصفه
الدماغ من خلال كشف أدوات OpenClaw مباشرة إلى Gemini Live. تعيد استدعاءات الأدوات
نتيجة `working` فورية للحفاظ على استجابة الدور الصوتي، ثم ينفذ OpenClaw
الأداة الفعلية بشكل غير متزامن ويحقن النتيجة مرة أخرى في
الجلسة الحية. اضبط `GEMINI_API_KEY` في بيئة عملية gateway. وإذا
كانت مصادقة gateway مفعلة، يرسل العميل المكتبي رمز gateway أو كلمة المرور
في أول رسالة `session.config`.

يشغّل الوصول إلى الدماغ الآني أوامر وكيل OpenClaw المصرح بها من المالك. احصر
`gateway.auth.mode: "none"` في مثيلات الاختبار الخاصة بـ loopback فقط. أما
اتصالات الدماغ الآني غير المحلية فتتطلب مصادقة gateway.

للحصول على gateway اختبار معزول، شغّل مثيلًا منفصلًا بمنفذه وإعداده
وحالته الخاصة:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

ثم هيّئ VoiceClaw لاستخدام:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## الوصول عن بُعد

المفضّل: Tailscale/VPN.
البديل: نفق SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

ثم صِل العملاء محليًا إلى `ws://127.0.0.1:18789`.

<Warning>
لا تتجاوز أنفاق SSH مصادقة gateway. في إعدادات shared-secret، ما يزال على العملاء
إرسال `token`/`password` حتى عبر النفق. أما في الأوضاع التي تحمل هوية،
فلا يزال على الطلب تلبية مسار المصادقة هذا.
</Warning>

راجع: [Remote Gateway](/ar/gateway/remote)، [Authentication](/ar/gateway/authentication)، [Tailscale](/ar/gateway/tailscale).

## الإشراف ودورة حياة الخدمة

استخدم التشغيل تحت الإشراف للحصول على اعتمادية تشبه الإنتاج.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

تكون تسميات LaunchAgent هي `ai.openclaw.gateway` (الافتراضي) أو `ai.openclaw.<profile>` (ملف شخصي مسمى). يقوم `openclaw doctor` بتدقيق انجراف إعداد الخدمة وإصلاحه.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

للاستمرارية بعد تسجيل الخروج، فعّل lingering:

```bash
sudo loginctl enable-linger <user>
```

مثال يدوي لوحدة مستخدم عندما تحتاج إلى مسار تثبيت مخصص:

```ini
[Unit]
Description=OpenClaw Gateway
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

  </Tab>

  <Tab title="Windows (أصلي)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

يستخدم بدء التشغيل المُدار أصليًا في Windows مهمة مجدولة باسم `OpenClaw Gateway`
(أو `OpenClaw Gateway (<profile>)` للملفات الشخصية المسماة). إذا تم رفض إنشاء
المهمة المجدولة، يعود OpenClaw إلى مشغّل مجلد Startup لكل مستخدم
يشير إلى `gateway.cmd` داخل دليل الحالة.

  </Tab>

  <Tab title="Linux (خدمة نظام)">

استخدم وحدة نظام للمضيفين متعددي المستخدمين/الدائمين.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

استخدم متن الخدمة نفسه الخاص بوحدة المستخدم، لكن ثبّته تحت
`/etc/systemd/system/openclaw-gateway[-<profile>].service` واضبط
`ExecStart=` إذا كان ملف `openclaw` الثنائي لديك موجودًا في مكان آخر.

  </Tab>
</Tabs>

## المسار السريع لملف dev الشخصي

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

تتضمن الإعدادات الافتراضية حالة/إعدادًا معزولين ومنفذ gateway أساسيًا هو `19001`.

## مرجع البروتوكول السريع (منظور المشغّل)

- يجب أن يكون أول إطار للعميل هو `connect`.
- يعيد Gateway لقطة `hello-ok` ‏(`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- إن `hello-ok.features.methods` / `events` قائمة اكتشاف متحفظة، وليست
  تفريغًا مولدًا لكل مسار مساعد قابل للاستدعاء.
- الطلبات: `req(method, params)` ← `res(ok/payload|error)`.
- تشمل الأحداث الشائعة `connect.challenge` و`agent` و`chat` و
  `session.message` و`session.tool` و`sessions.changed` و`presence` و`tick` و
  `health` و`heartbeat` وأحداث دورة حياة الاقتران/الموافقة و`shutdown`.

تكون عمليات تشغيل الوكيل على مرحلتين:

1. إقرار قبول فوري (`status:"accepted"`)
2. استجابة إكمال نهائية (`status:"ok"|"error"`)، مع تدفق أحداث `agent` بينهما.

راجع توثيق البروتوكول الكامل: [Gateway Protocol](/ar/gateway/protocol).

## الفحوصات التشغيلية

### الحيوية

- افتح WS وأرسل `connect`.
- توقّع استجابة `hello-ok` مع لقطة.

### الجاهزية

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### استعادة الفجوات

لا تتم إعادة تشغيل الأحداث. عند وجود فجوات في التسلسل، حدّث الحالة (`health`, `system-presence`) قبل المتابعة.

## تواقيع الأعطال الشائعة

| التوقيع                                                       | المشكلة المحتملة                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | ربط غير loopback من دون مسار مصادقة صالح لـ gateway                            |
| `another gateway instance is already listening` / `EADDRINUSE` | تعارض منفذ                                                                       |
| `Gateway start blocked: set gateway.mode=local`               | تم ضبط الإعداد على الوضع البعيد، أو أن ختم الوضع المحلي مفقود من إعداد تالف     |
| `unauthorized` during connect                                 | عدم تطابق المصادقة بين العميل وGateway                                          |

للحصول على سلاسل تشخيص كاملة، استخدم [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting).

## ضمانات السلامة

- تفشل عملاء بروتوكول Gateway بسرعة عندما لا يكون Gateway متاحًا (لا يوجد رجوع ضمني إلى القناة المباشرة).
- يتم رفض وإغلاق الإطارات الأولى غير الصالحة/غير `connect`.
- يصدر الإيقاف السلس حدث `shutdown` قبل إغلاق المقبس.

---

ذو صلة:

- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- [العملية الخلفية](/ar/gateway/background-process)
- [الإعداد](/ar/gateway/configuration)
- [السلامة](/ar/gateway/health)
- [Doctor](/ar/gateway/doctor)
- [المصادقة](/ar/gateway/authentication)

## ذو صلة

- [الإعداد](/ar/gateway/configuration)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [الوصول عن بُعد](/ar/gateway/remote)
- [إدارة Secrets](/ar/gateway/secrets)
