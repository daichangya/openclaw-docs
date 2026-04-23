---
read_when:
    - تشغيل Gateway من خلال CLI ‏(للتطوير أو الخوادم)
    - تصحيح مصادقة Gateway، وأوضاع الربط، والاتصال
    - اكتشاف Gateways عبر Bonjour ‏(DNS-SD المحلي + واسع النطاق)
summary: CLI الخاص بـ OpenClaw Gateway ‏(`openclaw gateway`) — تشغيل Gateways والاستعلام عنها واكتشافها
title: gateway
x-i18n:
    generated_at: "2026-04-23T07:22:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30d261a33e54bed10c17c14d09d0dd2b8e227bbf9f0ed415e332e7bda4803f1e
    source_path: cli/gateway.md
    workflow: 15
---

# CLI الخاص بـ Gateway

Gateway هو خادم WebSocket الخاص بـ OpenClaw ‏(القنوات، والعُقد، والجلسات، وHooks).

توجد الأوامر الفرعية في هذه الصفحة تحت `openclaw gateway …`.

مستندات ذات صلة:

- [/gateway/bonjour](/ar/gateway/bonjour)
- [/gateway/discovery](/ar/gateway/discovery)
- [/gateway/configuration](/ar/gateway/configuration)

## تشغيل Gateway

شغّل عملية Gateway محلية:

```bash
openclaw gateway
```

الاسم البديل للمقدمة الأمامية:

```bash
openclaw gateway run
```

ملاحظات:

- افتراضيًا، يرفض Gateway البدء ما لم يتم ضبط `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيلات المخصصة/التطويرية.
- من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقودة، فاعتبر ذلك إعدادًا معطوبًا أو تم العبث به وقم بإصلاحه بدلًا من افتراض الوضع المحلي ضمنيًا.
- إذا كان الملف موجودًا وكانت `gateway.mode` مفقودة، فسيتعامل Gateway مع ذلك على أنه تلف مريب في الإعدادات ويرفض أن “يفترض الوضع المحلي” نيابةً عنك.
- يتم حظر الربط خارج loopback من دون مصادقة (حاجز أمان).
- يؤدي `SIGUSR1` إلى إعادة تشغيل داخل العملية عند السماح بذلك (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لحظر إعادة التشغيل اليدوية، مع بقاء gateway tool/config apply/update مسموحًا).
- تعمل معالجات `SIGINT`/`SIGTERM` على إيقاف عملية gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا كنت تغلف CLI باستخدام TUI أو إدخال raw-mode، فاستعد الطرفية قبل الخروج.

### الخيارات

- `--port <port>`: منفذ WebSocket ‏(الافتراضي يأتي من الإعدادات/البيئة؛ وعادةً `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: وضع ربط المستمع.
- `--auth <token|password>`: تجاوز وضع المصادقة.
- `--token <token>`: تجاوز الرمز المميز (ويعيّن أيضًا `OPENCLAW_GATEWAY_TOKEN` للعملية).
- `--password <password>`: تجاوز كلمة المرور. تحذير: قد تنكشف كلمات المرور المضمنة ضمن قوائم العمليات المحلية.
- `--password-file <path>`: اقرأ كلمة مرور gateway من ملف.
- `--tailscale <off|serve|funnel>`: كشف Gateway عبر Tailscale.
- `--tailscale-reset-on-exit`: إعادة تعيين إعداد serve/funnel في Tailscale عند الإيقاف.
- `--allow-unconfigured`: السماح ببدء gateway من دون `gateway.mode=local` في الإعدادات. يتجاوز هذا حاجز بدء التشغيل فقط من أجل التمهيد المخصص/التطويري؛ ولا يكتب ملف الإعدادات أو يصلحه.
- `--dev`: أنشئ إعدادات + مساحة عمل للتطوير إذا كانت مفقودة (يتجاوز `BOOTSTRAP.md`).
- `--reset`: أعد تعيين إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
- `--force`: اقتل أي مستمع موجود على المنفذ المحدد قبل البدء.
- `--verbose`: سجلات مطولة.
- `--cli-backend-logs`: اعرض فقط سجلات الواجهة الخلفية لـ CLI في الطرفية (ومع تمكين stdout/stderr).
- `--ws-log <auto|full|compact>`: نمط سجل websocket ‏(الافتراضي `auto`).
- `--compact`: اسم بديل لـ `--ws-log compact`.
- `--raw-stream`: سجّل أحداث بث النموذج الخام إلى jsonl.
- `--raw-stream-path <path>`: مسار jsonl للبث الخام.

تحليل بدء التشغيل:

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء Gateway.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء Gateway. يسجل القياس أول خرج للعملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع بدء التشغيل.

## الاستعلام عن Gateway قيد التشغيل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

أوضاع الخرج:

- الافتراضي: قابل للقراءة البشرية (وملوّن في TTY).
- `--json`: JSON قابل للقراءة آليًا (من دون تنسيق/مؤشر دوران).
- `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على التخطيط البشري.

الخيارات المشتركة (عند الدعم):

- `--url <url>`: عنوان URL الخاص بـ Gateway WebSocket.
- `--token <token>`: رمز Gateway المميز.
- `--password <password>`: كلمة مرور Gateway.
- `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
- `--expect-final`: انتظر استجابة “نهائية” (استدعاءات الوكيل).

ملاحظة: عندما تضبط `--url`، لا يعود CLI إلى بيانات الاعتماد من الإعدادات أو البيئة.
مرّر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة هو خطأ.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

تُعد نقطة النهاية HTTP ‏`/healthz` فحصًا للحيوية: فهي تستجيب بمجرد أن يتمكن الخادم من الرد على HTTP. أما نقطة النهاية HTTP ‏`/readyz` فهي أكثر صرامة وتبقى حمراء بينما لا تزال العمليات الجانبية عند بدء التشغيل، أو القنوات، أو Hooks المُعدّة تستقر.

### `gateway usage-cost`

اجلب ملخصات تكلفة الاستخدام من سجلات الجلسات.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

الخيارات:

- `--days <days>`: عدد الأيام المراد تضمينها (الافتراضي `30`).

### `gateway stability`

اجلب مسجل الثبات التشخيصي الأخير من Gateway قيد التشغيل.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

الخيارات:

- `--limit <limit>`: الحد الأقصى لعدد الأحداث الأخيرة المراد تضمينها (الافتراضي `25`، الحد الأقصى `1000`).
- `--type <type>`: التصفية حسب نوع الحدث التشخيصي، مثل `payload.large` أو `diagnostic.memory.pressure`.
- `--since-seq <seq>`: تضمين الأحداث بعد رقم التسلسل التشخيصي فقط.
- `--bundle [path]`: اقرأ حزمة ثبات محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة تحت دليل الحالة، أو مرّر مسار JSON للحزمة مباشرةً.
- `--export`: اكتب ملف zip تشخيصات دعم قابلًا للمشاركة بدلًا من طباعة تفاصيل الثبات.
- `--output <path>`: مسار الخرج لـ `--export`.

ملاحظات:

- يكون المسجل نشطًا افتراضيًا ومن دون حمولة: فهو يلتقط البيانات الوصفية التشغيلية فقط، وليس نص الدردشة، أو مخرجات الأدوات، أو نصوص الطلبات أو الردود الخام. اضبط `diagnostics.enabled: false` فقط عندما تحتاج إلى تعطيل جمع Heartbeat التشخيصي الخاص بـ Gateway بالكامل.
- تحتفظ السجلات بالبيانات الوصفية التشغيلية: أسماء الأحداث، والأعداد، وأحجام البايتات، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugin، وملخصات الجلسات المنقّحة. وهي لا تحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الردود الخام، أو الرموز المميزة، أو Cookies، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام.
- عند الخروج القاتل لـ Gateway، أو انتهاء مهلات الإيقاف، أو فشل بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ وتنطبق أيضًا `--limit` و`--type` و`--since-seq` على خرج الحزمة.

### `gateway diagnostics export`

اكتب ملف zip تشخيصات محلي مصممًا لإرفاقه بتقارير الأخطاء.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

الخيارات:

- `--output <path>`: مسار zip للخرج. يكون افتراضيًا تصدير دعم تحت دليل الحالة.
- `--log-lines <count>`: الحد الأقصى لأسطر السجلات المنقحة المراد تضمينها (الافتراضي `5000`).
- `--log-bytes <bytes>`: الحد الأقصى لبايتات السجل المراد فحصها (الافتراضي `1000000`).
- `--url <url>`: عنوان URL الخاص بـ Gateway WebSocket للّقطة الصحية.
- `--token <token>`: رمز Gateway المميز للّقطة الصحية.
- `--password <password>`: كلمة مرور Gateway للّقطة الصحية.
- `--timeout <ms>`: مهلة لقطة الحالة/الصحة (الافتراضي `3000`).
- `--no-stability-bundle`: تخطَّ البحث عن حزمة الثبات المحفوظة.
- `--json`: اطبع المسار المكتوب، والحجم، وmanifest كـ JSON.

يحتوي التصدير على manifest، وملخص Markdown، وشكل الإعدادات، وتفاصيل الإعدادات المنقحة، وملخصات السجلات المنقحة، ولقطات الحالة/الصحة المنقحة الخاصة بـ Gateway، وأحدث حزمة ثبات عند وجودها.

وهو مخصص للمشاركة. ويحتفظ بالتفاصيل التشغيلية التي تساعد في تصحيح الأخطاء، مثل حقول سجلات OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المضبوطة، والمنافذ، ومعرّفات Plugin، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقحة. ويحذف أو ينقّح نص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وCookies، ومعرّفات الحسابات/الرسائل، ونصوص prompts/instructions، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة على نمط LogTape وكأنها نص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بمعلومة أن رسالة ما قد حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway ‏(`launchd/systemd/schtasks`) بالإضافة إلى فحص اختياري للاتصال/قدرة المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

الخيارات:

- `--url <url>`: أضف هدف فحص صريحًا. لا يزال يتم فحص البعيد المضبوط + localhost.
- `--token <token>`: مصادقة الرمز المميز للفحص.
- `--password <password>`: مصادقة كلمة المرور للفحص.
- `--timeout <ms>`: مهلة الفحص (الافتراضي `10000`).
- `--no-probe`: تخطَّ فحص الاتصال (عرض الخدمة فقط).
- `--deep`: افحص أيضًا الخدمات على مستوى النظام.
- `--require-rpc`: ارفع فحص الاتصال الافتراضي إلى فحص قراءة، واخرج بقيمة غير صفرية عند فشل فحص القراءة هذا. لا يمكن دمجه مع `--no-probe`.

ملاحظات:

- يظل `gateway status` متاحًا للتشخيص حتى عندما تكون إعدادات CLI المحلية مفقودة أو غير صالحة.
- يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وقدرة المصادقة المرئية وقت Handshake. لكنه لا يثبت عمليات القراءة/الكتابة/الإدارة.
- يقوم `gateway status` بتحليل SecretRefs الخاصة بالمصادقة المضبوطة لاستخدامها في مصادقة الفحص عندما يكون ذلك ممكنًا.
- إذا تعذر تحليل SecretRef مطلوبة للمصادقة في مسار هذا الأمر، فسيعرض `gateway status --json` القيمة `rpc.authWarning` عند فشل فحص الاتصال/المصادقة؛ مرّر `--token`/`--password` صراحةً أو قم أولًا بتحليل مصدر السر.
- إذا نجح الفحص، فسيتم إخفاء تحذيرات auth-ref غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
- استخدم `--require-rpc` في النصوص البرمجية والأتمتة عندما لا يكفي وجود خدمة تستمع وتحتاج أيضًا إلى أن تكون استدعاءات RPC ذات نطاق القراءة سليمة.
- يضيف `--deep` فحصًا بأفضل جهد لتثبيتات `launchd/systemd/schtasks` الإضافية. عند اكتشاف عدة خدمات شبيهة بـ gateway، يطبع الخرج البشري تلميحات للتنظيف ويحذر من أن معظم الإعدادات يجب أن تشغّل gateway واحدة لكل جهاز.
- يتضمن الخرج البشري مسار سجل الملف المحلول بالإضافة إلى لقطة لمسارات/صلاحية الإعدادات بين CLI والخدمة للمساعدة في تشخيص انجراف ملف التعريف أو دليل الحالة.
- في تثبيتات Linux systemd، تقرأ فحوصات انجراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
- تقوم فحوصات الانجراف بتحليل SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة وقت التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم احتياط بيئة العملية).
- إذا لم تكن مصادقة الرمز المميز نشطة فعليًا (ضبط صريح لـ `gateway.auth.mode` على `password`/`none`/`trusted-proxy`، أو كان الوضع غير مضبوط حيث يمكن لكلمة المرور أن تفوز ولا يوجد مرشح رمز مميز يمكنه الفوز)، فتتخطى فحوصات انجراف الرمز تحليل رمز الإعدادات.

### `gateway probe`

يُعد `gateway probe` أمر “تصحيح كل شيء”. فهو يفحص دائمًا:

- الـ Gateway البعيد المضبوط لديك (إذا كان مضبوطًا)، و
- localhost ‏(loopback) **حتى إذا كان البعيد مضبوطًا**.

إذا مرّرت `--url`، فسيُضاف هذا الهدف الصريح قبل كليهما. يضع الخرج البشري تسميات على
الأهداف على النحو التالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `local loopback`

إذا كان يمكن الوصول إلى عدة Gateways، فسيطبعها جميعًا. تُدعم عدة Gateways عندما تستخدم ملفات تعريف/منافذ معزولة (مثل rescue bot)، لكن معظم التثبيتات لا تزال تشغّل gateway واحدة.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

التفسير:

- تعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
- يوضح `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` ما الذي استطاع الفحص إثباته بخصوص المصادقة. وهو منفصل عن قابلية الوصول.
- تعني `Read probe: ok` أن استدعاءات RPC التفصيلية ذات نطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
- تعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC ذات نطاق القراءة محدودة. ويُبلّغ عن ذلك على أنه قابلية وصول **متدهورة**، وليس فشلًا كاملًا.
- تكون قيمة الخروج غير صفرية فقط عندما لا يكون أي هدف من الأهداف المفحوصة قابلًا للوصول.

ملاحظات JSON ‏(`--json`):

- المستوى الأعلى:
  - `ok`: يمكن الوصول إلى هدف واحد على الأقل.
  - `degraded`: كان لدى هدف واحد على الأقل RPC تفصيلي محدود النطاق.
  - `capability`: أفضل قدرة شوهدت عبر الأهداف القابلة للوصول (`read_only` أو `write_capable` أو `admin_capable` أو `pairing_pending` أو `connected_no_operator_scope` أو `unknown`).
  - `primaryTargetId`: أفضل هدف للتعامل معه كفائز نشط وفق هذا الترتيب: عنوان URL الصريح، ثم SSH tunnel، ثم البعيد المضبوط، ثم local loopback.
  - `warnings[]`: سجلات تحذير بأفضل جهد تحتوي على `code` و`message` و`targetIds` اختيارية.
  - `network`: تلميحات عناوين URL الخاصة بـ local loopback/‏tailnet مشتقة من الإعدادات الحالية وشبكة المضيف.
  - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلية المستخدمة في تمريرة الفحص هذه.
- لكل هدف (`targets[].connect`):
  - `ok`: القابلية للوصول بعد الاتصال + تصنيف التدهور.
  - `rpcOk`: نجاح RPC التفصيلي الكامل.
  - `scopeLimited`: فشل RPC التفصيلي بسبب غياب نطاق المشغّل.
- لكل هدف (`targets[].auth`):
  - `role`: دور المصادقة المُبلّغ عنه في `hello-ok` عند توفره.
  - `scopes`: النطاقات الممنوحة المُبلّغ عنها في `hello-ok` عند توفرها.
  - `capability`: تصنيف قدرة المصادقة المعروض لذلك الهدف.

رموز التحذير الشائعة:

- `ssh_tunnel_failed`: فشل إعداد SSH tunnel؛ وعاد الأمر إلى الفحوصات المباشرة.
- `multiple_gateways`: أمكن الوصول إلى أكثر من هدف واحد؛ وهذا غير معتاد إلا إذا كنت تشغّل عمدًا ملفات تعريف معزولة، مثل rescue bot.
- `auth_secretref_unresolved`: تعذر تحليل SecretRef مصادقة مضبوطة لهدف فاشل.
- `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدودًا بسبب غياب `operator.read`.

#### البعيد عبر SSH ‏(تكافؤ تطبيق Mac)

يستخدم وضع “Remote over SSH” في تطبيق macOS إعادة توجيه منفذ محلية بحيث يصبح gateway البعيد (الذي قد يكون مربوطًا بـ loopback فقط) قابلًا للوصول على `ws://127.0.0.1:<port>`.

المكافئ في CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

الخيارات:

- `--ssh <target>`: ‏`user@host` أو `user@host:port` ‏(المنفذ افتراضيًا `22`).
- `--ssh-identity <path>`: ملف الهوية.
- `--ssh-auto`: اختر أول مضيف gateway مكتشف كهدف SSH من نقطة نهاية
  الاكتشاف المحلولة (`local.` بالإضافة إلى المجال واسع النطاق المضبوط، إن وجد). يتم تجاهل
  التلميحات المعتمدة على TXT فقط.

الإعدادات (اختيارية، وتُستخدم كقيم افتراضية):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

مساعد RPC منخفض المستوى.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

الخيارات:

- `--params <json>`: سلسلة كائن JSON للمعاملات (الافتراضي `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

ملاحظات:

- يجب أن تكون `--params` بصيغة JSON صالحة.
- يُستخدم `--expect-final` أساسًا لاستدعاءات RPC بأسلوب الوكيل التي تبث أحداثًا وسيطة قبل الحمولة النهائية.

## إدارة خدمة Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

خيارات الأوامر:

- `gateway status`: ‏`--url` و`--token` و`--password` و`--timeout` و`--no-probe` و`--require-rpc` و`--deep` و`--json`
- `gateway install`: ‏`--port` و`--runtime <node|bun>` و`--token` و`--force` و`--json`
- `gateway uninstall|start|stop|restart`: ‏`--json`

ملاحظات:

- يدعم `gateway install` الخيارات `--port` و`--runtime` و`--token` و`--force` و`--json`.
- عندما تتطلب مصادقة الرمز المميز وجود رمز وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن `gateway install` يتحقق من أن SecretRef قابلة للتحليل لكنه لا يحتفظ بالرمز المحلول داخل بيانات بيئة الخدمة الوصفية.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef الخاص بالرمز المضبوط غير قابل للتحليل، يفشل التثبيت بشكل مغلق بدلًا من حفظ نص صريح احتياطي.
- بالنسبة إلى مصادقة كلمة المرور في `gateway run`، ففضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعوم بـ SecretRef بدلًا من `--password` المضمن.
- في وضع المصادقة المستنتج، لا يؤدي `OPENCLAW_GATEWAY_PASSWORD` الموجود في shell فقط إلى تخفيف متطلبات رمز التثبيت؛ استخدم إعدادات دائمة (`gateway.auth.password` أو `env` في الإعدادات) عند تثبيت خدمة مُدارة.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكانت `gateway.auth.mode` غير مضبوطة، فسيتم حظر التثبيت حتى يتم ضبط الوضع صراحةً.
- تقبل أوامر دورة الحياة `--json` لاستخدامها في السكربتات.

## اكتشاف Gateways ‏(Bonjour)

يقوم `gateway discover` بمسح إشارات Gateway ‏(`_openclaw-gw._tcp`).

- DNS-SD متعدد الإرسال: `local.`
- DNS-SD أحادي الإرسال (Wide-Area Bonjour): اختر مجالًا (مثال: `openclaw.internal.`) واضبط split DNS + خادم DNS؛ راجع [/gateway/bonjour](/ar/gateway/bonjour)

فقط Gateways التي تم تفعيل اكتشاف Bonjour فيها (افتراضيًا) هي التي تعلن الإشارة.

تتضمن سجلات الاكتشاف واسع النطاق (TXT):

- `role` ‏(تلميح دور gateway)
- `transport` ‏(تلميح النقل، مثل `gateway`)
- `gatewayPort` ‏(منفذ WebSocket، وعادةً `18789`)
- `sshPort` ‏(اختياري؛ تفترض العملاء أن أهداف SSH الافتراضية هي `22` عند غيابه)
- `tailnetDns` ‏(اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` ‏(تفعيل TLS + بصمة الشهادة)
- `cliPath` ‏(تلميح التثبيت البعيد المكتوب إلى المنطقة واسعة النطاق)

### `gateway discover`

```bash
openclaw gateway discover
```

الخيارات:

- `--timeout <ms>`: مهلة لكل أمر (browse/resolve)؛ الافتراضي `2000`.
- `--json`: خرج قابل للقراءة آليًا (ويعطل أيضًا التنسيق/مؤشر الدوران).

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

ملاحظات:

- يقوم CLI بمسح `local.` بالإضافة إلى المجال واسع النطاق المضبوط عندما يكون مفعّلًا.
- يتم اشتقاق `wsUrl` في خرج JSON من نقطة نهاية الخدمة المحلولة، وليس من
  التلميحات المعتمدة على TXT فقط مثل `lanHost` أو `tailnetDns`.
- في mDNS الخاص بـ `local.`، لا يتم بث `sshPort` و`cliPath` إلا عندما
  تكون `discovery.mdns.mode` هي `full`. لا يزال DNS-SD واسع النطاق يكتب `cliPath`؛ كما يبقى `sshPort`
  اختياريًا هناك أيضًا.
