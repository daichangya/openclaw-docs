---
read_when:
    - تشغيل Gateway من CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف Gateways عبر Bonjour ‏(المحلي + DNS-SD واسع النطاق)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل Gateways والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-04-23T13:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

يُعد Gateway خادم WebSocket الخاص بـ OpenClaw ‏(القنوات، والعُقد، والجلسات، والخطافات).

توجد الأوامر الفرعية في هذه الصفحة ضمن `openclaw gateway …`.

المستندات ذات الصلة:

- [/gateway/bonjour](/ar/gateway/bonjour)
- [/gateway/discovery](/ar/gateway/discovery)
- [/gateway/configuration](/ar/gateway/configuration)

## تشغيل Gateway

شغّل عملية Gateway محلية:

```bash
openclaw gateway
```

الاسم البديل للتشغيل في الواجهة الأمامية:

```bash
openclaw gateway run
```

ملاحظات:

- بشكل افتراضي، يرفض Gateway البدء ما لم يتم تعيين `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيلات المخصصة/الخاصة بالتطوير.
- من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقودًا، فاعتبر ذلك إعدادًا معطوبًا أو تم العبث به وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
- إذا كان الملف موجودًا وكانت `gateway.mode` مفقودة، فإن Gateway يعتبر ذلك تلفًا مريبًا في الإعداد ويرفض أن “يفترض الوضع المحلي” نيابةً عنك.
- يتم حظر الربط خارج loopback من دون مصادقة (حاجز أمان).
- يؤدّي `SIGUSR1` إلى إعادة تشغيل داخل العملية عند التفويض (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لمنع إعادة التشغيل اليدوية، مع بقاء gateway tool/config apply/update مسموحًا).
- تعمل معالجات `SIGINT`/`SIGTERM` على إيقاف عملية gateway، لكنها لا تستعيد أي حالة مخصصة للطرفية. إذا كنت تغلّف CLI باستخدام TUI أو إدخال raw-mode، فأعِد الطرفية إلى حالتها قبل الخروج.

### الخيارات

- `--port <port>`: منفذ WebSocket ‏(القيمة الافتراضية تأتي من config/env؛ وعادةً تكون `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: وضع ربط المستمع.
- `--auth <token|password>`: تجاوز لوضع المصادقة.
- `--token <token>`: تجاوز للرمز المميز (ويعيّن أيضًا `OPENCLAW_GATEWAY_TOKEN` لهذه العملية).
- `--password <password>`: تجاوز لكلمة المرور. تحذير: قد تظهر كلمات المرور المضمّنة مباشرةً في قوائم العمليات المحلية.
- `--password-file <path>`: قراءة كلمة مرور gateway من ملف.
- `--tailscale <off|serve|funnel>`: كشف Gateway عبر Tailscale.
- `--tailscale-reset-on-exit`: إعادة تعيين إعدادات Tailscale serve/funnel عند الإيقاف.
- `--allow-unconfigured`: السماح ببدء gateway من دون `gateway.mode=local` في الإعداد. هذا يتجاوز حاجز بدء التشغيل لأغراض الإقلاع المخصص/التطوير فقط؛ ولا يكتب ملف الإعداد أو يصلحه.
- `--dev`: إنشاء إعداد + مساحة عمل للتطوير إذا لم يكونا موجودين (يتخطى `BOOTSTRAP.md`).
- `--reset`: إعادة تعيين إعداد التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
- `--force`: إنهاء أي مستمع موجود على المنفذ المحدد قبل البدء.
- `--verbose`: سجلات تفصيلية.
- `--cli-backend-logs`: عرض سجلات الواجهة الخلفية لـ CLI فقط في وحدة التحكم (مع تفعيل stdout/stderr).
- `--ws-log <auto|full|compact>`: نمط سجل websocket ‏(الافتراضي `auto`).
- `--compact`: اسم بديل لـ `--ws-log compact`.
- `--raw-stream`: تسجيل أحداث تدفق النموذج الخام إلى jsonl.
- `--raw-stream-path <path>`: مسار jsonl للتدفق الخام.

تحليل بدء التشغيل:

- عيّن `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء تشغيل Gateway.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء تشغيل Gateway. يسجّل القياس أول مخرجات للعملية، و`/healthz`، و`/readyz`، وتوقيتات تتبّع بدء التشغيل.

## الاستعلام عن Gateway قيد التشغيل

تستخدم كل أوامر الاستعلام WebSocket RPC.

أوضاع الإخراج:

- الافتراضي: مقروء للبشر (وملوّن في TTY).
- `--json`: JSON قابل للقراءة آليًا (من دون تنسيق/مؤشر دوران).
- `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الإبقاء على التخطيط البشري.

الخيارات المشتركة (عند الدعم):

- `--url <url>`: عنوان WebSocket الخاص بـ Gateway.
- `--token <token>`: رمز Gateway المميز.
- `--password <password>`: كلمة مرور Gateway.
- `--timeout <ms>`: المهلة/الميزانية الزمنية (تختلف حسب الأمر).
- `--expect-final`: الانتظار للحصول على استجابة “نهائية” (استدعاءات الوكيل).

ملاحظة: عند تعيين `--url`، لا يعود CLI إلى بيانات الاعتماد من config أو البيئة.
مرّر `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأً.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

تُعد نقطة النهاية HTTP ‏`/healthz` مسبار حيوية: إذ تُرجع الاستجابة بمجرد أن يتمكن الخادم من الرد عبر HTTP. أما نقطة النهاية HTTP ‏`/readyz` فهي أكثر صرامة وتظل غير جاهزة أثناء استقرار العمليات الجانبية عند بدء التشغيل، أو القنوات، أو الخطافات المضبوطة.

### `gateway usage-cost`

اجلب ملخصات تكلفة الاستخدام من سجلات الجلسات.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

الخيارات:

- `--days <days>`: عدد الأيام التي يجب تضمينها (الافتراضي `30`).

### `gateway stability`

اجلب مُسجّل الاستقرار التشخيصي الأخير من Gateway قيد التشغيل.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

الخيارات:

- `--limit <limit>`: الحد الأقصى لعدد الأحداث الأخيرة التي يجب تضمينها (الافتراضي `25`، والحد الأقصى `1000`).
- `--type <type>`: التصفية حسب نوع الحدث التشخيصي، مثل `payload.large` أو `diagnostic.memory.pressure`.
- `--since-seq <seq>`: تضمين الأحداث التي تلي رقم التسلسل التشخيصي فقط.
- `--bundle [path]`: قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرّر مباشرةً مسار JSON للحزمة.
- `--export`: كتابة ملف zip تشخيصي قابل للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
- `--output <path>`: مسار الإخراج لـ `--export`.

ملاحظات:

- تحتفظ السجلات ببيانات تشغيلية وصفية: أسماء الأحداث، والعدادات، وأحجام البايتات، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugin، وملخصات الجلسات المنقّحة. وهي لا تحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. عيّن `diagnostics.enabled: false` لتعطيل المُسجّل بالكامل.
- عند حالات خروج Gateway الفادحة، ومهل الإيقاف، وإخفاقات بدء التشغيل عند إعادة التشغيل، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المُسجّل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ كما تنطبق `--limit` و`--type` و`--since-seq` أيضًا على إخراج الحزمة.

### `gateway diagnostics export`

اكتب ملف zip تشخيصيًا محليًا مُصممًا لإرفاقه بتقارير الأخطاء.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

الخيارات:

- `--output <path>`: مسار zip للإخراج. تكون القيمة الافتراضية تصدير دعم ضمن دليل الحالة.
- `--log-lines <count>`: الحد الأقصى لأسطر السجل المنقّحة التي يجب تضمينها (الافتراضي `5000`).
- `--log-bytes <bytes>`: الحد الأقصى لبايتات السجل التي يجب فحصها (الافتراضي `1000000`).
- `--url <url>`: عنوان WebSocket الخاص بـ Gateway للّقطة الصحية.
- `--token <token>`: رمز Gateway المميز للّقطة الصحية.
- `--password <password>`: كلمة مرور Gateway للّقطة الصحية.
- `--timeout <ms>`: مهلة لقطة الحالة/الصحة (الافتراضي `3000`).
- `--no-stability-bundle`: تخطّي البحث عن حزمة الاستقرار المحفوظة.
- `--json`: طباعة المسار المكتوب، والحجم، والبيان الوصفي بصيغة JSON.

يحتوي التصدير على بيان وصفي، وملخص Markdown، وبنية config، وتفاصيل config منقّحة، وملخصات سجلات منقّحة، ولقطات حالة/صحة Gateway منقّحة، وأحدث حزمة استقرار عند وجودها.

وهو مخصص للمشاركة. ويحتفظ بتفاصيل تشغيلية تساعد على تصحيح الأخطاء، مثل حقول سجلات OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد الزمنية، والأوضاع المضبوطة، والمنافذ، ومعرّفات Plugin، ومعرّفات الموفّرين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقّحة. كما يحذف أو ينقّح نص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحساب/الرسائل، ونصوص المطالبات/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بأسلوب LogTape كأنها نص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بوجود رسالة محذوفة مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway ‏(`launchd/systemd/schtasks`) بالإضافة إلى فحص اختياري لإمكانات الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

الخيارات:

- `--url <url>`: إضافة هدف فحص صريح. ولا يزال يتم فحص الهدف البعيد المضبوط + localhost.
- `--token <token>`: مصادقة بالرمز المميز للفحص.
- `--password <password>`: مصادقة بكلمة المرور للفحص.
- `--timeout <ms>`: مهلة الفحص (الافتراضي `10000`).
- `--no-probe`: تخطّي فحص الاتصال (عرض الخدمة فقط).
- `--deep`: فحص خدمات على مستوى النظام أيضًا.
- `--require-rpc`: ترقية فحص الاتصال الافتراضي إلى فحص قراءة، والخروج برمز غير صفري عند فشل فحص القراءة هذا. لا يمكن دمجه مع `--no-probe`.

ملاحظات:

- يظل `gateway status` متاحًا لأغراض التشخيص حتى عندما يكون إعداد CLI المحلي مفقودًا أو غير صالح.
- يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانات المصادقة الظاهرة وقت المصافحة. لكنه لا يثبت عمليات القراءة/الكتابة/الإدارة.
- يحل `gateway status` مراجع SecretRef المضبوطة للمصادقة الخاصة بالفحص عندما يكون ذلك ممكنًا.
- إذا تعذر حل SecretRef مطلوب للمصادقة في مسار هذا الأمر، فإن `gateway status --json` يبلغ عن `rpc.authWarning` عند فشل اتصال/مصادقة الفحص؛ مرّر `--token`/`--password` صراحةً أو عالج مصدر السر أولًا.
- إذا نجح الفحص، يتم كتم تحذيرات auth-ref غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
- استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكفي خدمة تستمع فقط، وتحتاج أيضًا إلى أن تكون استدعاءات RPC ضمن نطاق القراءة سليمة.
- يضيف `--deep` فحصًا بأفضل جهد لتثبيتات `launchd/systemd/schtasks` الإضافية. وعند اكتشاف خدمات متعددة شبيهة بـ gateway، يطبع الإخراج البشري تلميحات للتنظيف ويحذّر من أن معظم الإعدادات يجب أن تشغّل gateway واحدًا لكل جهاز.
- يتضمن الإخراج البشري مسار سجل الملف المحلول بالإضافة إلى لقطة لمسارات/صلاحية إعداد CLI مقابل إعداد الخدمة للمساعدة في تشخيص انجراف ملف التعريف أو دليل الحالة.
- في تثبيتات Linux systemd، تقرأ فحوصات انجراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات بين علامات اقتباس، والملفات المتعددة، والملفات الاختيارية `-`).
- تعالج فحوصات الانجراف مراجع SecretRef الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كخيار احتياطي).
- إذا لم تكن مصادقة الرمز المميز فعّالة بالفعل (عند وجود `gateway.auth.mode` صريح بقيمة `password` أو `none` أو `trusted-proxy`، أو عند ترك الوضع غير معيّن حيث يمكن أن تتغلب كلمة المرور ولا يوجد مرشح رمز مميز يمكن أن يتغلب)، فإن فحوصات انجراف الرمز المميز تتخطى حل رمز config.

### `gateway probe`

يُعد `gateway probe` أمر “تصحيح كل شيء”. فهو يفحص دائمًا:

- الـ gateway البعيد المضبوط لديك (إن وُجد)، و
- localhost ‏(loopback) **حتى إذا كان الهدف البعيد مضبوطًا**.

إذا مرّرت `--url`، فسيُضاف هذا الهدف الصريح قبل كليهما. يضع الإخراج البشري تسميات للأهداف على النحو التالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

إذا أمكن الوصول إلى عدة Gateways، فسيعرضها جميعًا. تُدعم تعدد Gateways عندما تستخدم ملفات تعريف/منافذ معزولة (مثل rescue bot)، لكن معظم التثبيتات لا تزال تشغّل gateway واحدًا.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

التفسير:

- `Reachable: yes` يعني أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` يوضح ما الذي استطاع الفحص إثباته بشأن المصادقة. وهو منفصل عن إمكانية الوصول.
- `Read probe: ok` يعني أن استدعاءات RPC التفصيلية ضمن نطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
- `Read probe: limited - missing scope: operator.read` يعني أن الاتصال نجح لكن RPC ضمن نطاق القراءة محدود. ويُبلّغ عن ذلك بوصفه إمكانية وصول **متدهورة**، وليس فشلًا كاملًا.
- يكون رمز الخروج غير صفري فقط عندما لا يمكن الوصول إلى أي هدف تم فحصه.

ملاحظات JSON ‏(`--json`):

- المستوى الأعلى:
  - `ok`: يمكن الوصول إلى هدف واحد على الأقل.
  - `degraded`: كان لدى هدف واحد على الأقل RPC تفصيلي محدود النطاق.
  - `capability`: أفضل قدرة جرى رصدها عبر الأهداف القابلة للوصول (`read_only` أو `write_capable` أو `admin_capable` أو `pairing_pending` أو `connected_no_operator_scope` أو `unknown`).
  - `primaryTargetId`: أفضل هدف يجب التعامل معه بوصفه الفائز النشط وفق هذا الترتيب: عنوان URL الصريح، أو نفق SSH، أو الهدف البعيد المضبوط، ثم local loopback.
  - `warnings[]`: سجلات تحذير بأفضل جهد تحتوي على `code` و`message` و`targetIds` اختيارية.
  - `network`: تلميحات عناوين URL الخاصة بـ local loopback/tailnet والمشتقة من الإعداد الحالي وشبكة المضيف.
  - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلية المستخدمة في جولة الفحص هذه.
- لكل هدف (`targets[].connect`):
  - `ok`: إمكانية الوصول بعد الاتصال + تصنيف الحالة المتدهورة.
  - `rpcOk`: نجاح كامل لـ RPC التفصيلي.
  - `scopeLimited`: فشل RPC التفصيلي بسبب غياب نطاق operator.
- لكل هدف (`targets[].auth`):
  - `role`: دور المصادقة المُبلغ عنه في `hello-ok` عند توفره.
  - `scopes`: النطاقات الممنوحة والمُبلغ عنها في `hello-ok` عند توفرها.
  - `capability`: تصنيف قدرة المصادقة المعروض لذلك الهدف.

رموز التحذير الشائعة:

- `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ وعاد الأمر إلى الفحوصات المباشرة.
- `multiple_gateways`: أمكن الوصول إلى أكثر من هدف واحد؛ وهذا غير معتاد ما لم تكن تشغّل عمدًا ملفات تعريف معزولة، مثل rescue bot.
- `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مضبوطة لهدف فاشل.
- `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدودًا بسبب غياب `operator.read`.

#### الاتصال البعيد عبر SSH ‏(تكافؤ تطبيق Mac)

يستخدم وضع “Remote over SSH” في تطبيق macOS إعادة توجيه منفذ محليًا بحيث يصبح الـ gateway البعيد (الذي قد يكون مربوطًا بـ loopback فقط) قابلًا للوصول عند `ws://127.0.0.1:<port>`.

المكافئ في CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

الخيارات:

- `--ssh <target>`: ‏`user@host` أو `user@host:port` ‏(المنفذ الافتراضي `22`).
- `--ssh-identity <path>`: ملف الهوية.
- `--ssh-auto`: اختيار أول مضيف gateway مكتشف بوصفه هدف SSH من نقطة نهاية
  الاكتشاف المحلولة (`local.` بالإضافة إلى النطاق واسع النطاق المضبوط، إن وجد). يتم تجاهل
  التلميحات المعتمدة على TXT فقط.

الإعداد (اختياري، يُستخدم كقيم افتراضية):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

مساعد RPC منخفض المستوى.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

الخيارات:

- `--params <json>`: سلسلة كائن JSON للمعلمات (الافتراضي `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

ملاحظات:

- يجب أن تكون قيمة `--params` بصيغة JSON صالحة.
- `--expect-final` مخصص أساسًا لاستدعاءات RPC بأسلوب الوكيل التي تبث أحداثًا وسيطة قبل حمولة نهائية.

## إدارة خدمة Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

خيارات الأوامر:

- `gateway status`: ‏`--url`، `--token`، `--password`، `--timeout`، `--no-probe`، `--require-rpc`، `--deep`، `--json`
- `gateway install`: ‏`--port`، `--runtime <node|bun>`، `--token`، `--force`، `--json`
- `gateway uninstall|start|stop|restart`: ‏`--json`

ملاحظات:

- يدعم `gateway install` الخيارات `--port` و`--runtime` و`--token` و`--force` و`--json`.
- عندما تتطلب مصادقة الرمز المميز وجود رمز مميز وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن `gateway install` يتحقق من إمكانية حل SecretRef لكنه لا يحفظ الرمز المميز المحلول في بيانات بيئة الخدمة الوصفية.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا مميزًا وكان SecretRef الخاص بالرمز المميز المضبوط غير محلول، يفشل التثبيت بشكل مغلق بدلًا من حفظ نص عادي احتياطي.
- لمصادقة كلمة المرور في `gateway run`، يُفضَّل استخدام `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعوم عبر SecretRef بدلًا من `--password` المضمّن.
- في وضع المصادقة المستنتج، لا يؤدي `OPENCLAW_GATEWAY_PASSWORD` الموجود في shell فقط إلى تخفيف متطلبات رمز التثبيت المميز؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو `env` في config) عند تثبيت خدمة مُدارة.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكانت `gateway.auth.mode` غير معيّنة، فسيتم حظر التثبيت حتى يُضبط الوضع صراحةً.
- تقبل أوامر دورة الحياة الخيار `--json` لأغراض السكربتات.

## اكتشاف Gateways ‏(Bonjour)

يفحص `gateway discover` إشارات Gateway ‏(`_openclaw-gw._tcp`).

- DNS-SD متعدد الإرسال: `local.`
- DNS-SD أحادي الإرسال (Wide-Area Bonjour): اختر نطاقًا (مثال: `openclaw.internal.`) وأعد split DNS + خادم DNS؛ راجع [/gateway/bonjour](/ar/gateway/bonjour)

فقط الـ Gateways التي تم تمكين اكتشاف Bonjour فيها (افتراضيًا) تعلن عن الإشارة.

تتضمن سجلات الاكتشاف واسع النطاق (TXT):

- `role` (تلميح دور gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، وعادةً `18789`)
- `sshPort` (اختياري؛ تستخدم الأطراف العميلة `22` كهدف SSH افتراضي عند غيابه)
- `tailnetDns` (اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` (تمكين TLS + بصمة الشهادة)
- `cliPath` (تلميح التثبيت البعيد المكتوب إلى المنطقة واسعة النطاق)

### `gateway discover`

```bash
openclaw gateway discover
```

الخيارات:

- `--timeout <ms>`: مهلة لكل أمر (browse/resolve)؛ الافتراضي `2000`.
- `--json`: إخراج قابل للقراءة آليًا (ويعطّل أيضًا التنسيق/مؤشر الدوران).

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

ملاحظات:

- يفحص CLI النطاق `local.` بالإضافة إلى النطاق واسع النطاق المضبوط عندما يكون مفعّلًا.
- تُشتق `wsUrl` في إخراج JSON من نقطة نهاية الخدمة المحلولة، وليس من
  التلميحات المعتمدة على TXT فقط مثل `lanHost` أو `tailnetDns`.
- في mDNS الخاص بـ `local.`، لا يتم بث `sshPort` و`cliPath` إلا عندما
  تكون `discovery.mdns.mode` مساوية لـ `full`. ولا يزال DNS-SD واسع النطاق يكتب `cliPath`؛
  كما يبقى `sshPort` اختياريًا هناك أيضًا.
