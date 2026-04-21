---
read_when:
    - أحالَك مركز استكشاف الأخطاء وإصلاحها إلى هنا لتشخيص أعمق
    - أنت بحاجة إلى أقسام دليل تشغيل مستقرة قائمة على الأعراض مع أوامر دقيقة
summary: دليل تشغيل متعمق لاستكشاف الأخطاء وإصلاحها لـ Gateway، والقنوات، والأتمتة، وNode، والمتصفح
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-04-21T07:20:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: add7625785e3b78897c750b4785b7fe84a3d91c23c4175de750c4834272967f9
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# استكشاف أخطاء Gateway وإصلاحها

هذه الصفحة هي دليل التشغيل المتعمق.
ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا كنت تريد تدفق الفرز السريع أولًا.

## تسلسل الأوامر

شغّل هذه الأوامر أولًا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

الإشارات السليمة المتوقعة:

- يعرض `openclaw gateway status` القيم `Runtime: running` و `Connectivity probe: ok` وسطر `Capability: ...`.
- يبلغ `openclaw doctor` عن عدم وجود مشكلات مانعة في الإعدادات/الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، ونتائج الفحص/التدقيق حيثما كانت مدعومة، مثل `works` أو `audit ok`.

## Anthropic 429 يتطلب استخدامًا إضافيًا للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- أن نموذج Anthropic Opus/Sonnet المحدد يحتوي على `params.context1m: true`.
- أن بيانات اعتماد Anthropic الحالية غير مؤهلة لاستخدام السياق الطويل.
- أن الطلبات تفشل فقط في الجلسات الطويلة/تشغيلات النماذج التي تحتاج إلى مسار 1M التجريبي.

خيارات الإصلاح:

1. عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
2. استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو انتقل إلى مفتاح Anthropic API.
3. اضبط نماذج بديلة بحيث تستمر التشغيلات عند رفض طلبات Anthropic ذات السياق الطويل.

ذو صلة:

- [/providers/anthropic](/ar/providers/anthropic)
- [/reference/token-use](/ar/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ar/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## الواجهة الخلفية المحلية المتوافقة مع OpenAI تجتاز الفحوصات المباشرة لكن تشغيلات الوكيل تفشل

استخدم هذا عندما:

- ينجح `curl ... /v1/models`
- تنجح استدعاءات `/v1/chat/completions` المباشرة الصغيرة
- تفشل تشغيلات نماذج OpenClaw فقط في أدوار الوكيل العادية

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ابحث عن:

- أن الاستدعاءات المباشرة الصغيرة تنجح، لكن تشغيلات OpenClaw تفشل فقط مع المطالبات الأكبر
- أخطاء في الواجهة الخلفية حول أن `messages[].content` تتوقع سلسلة نصية
- أعطال في الواجهة الخلفية تظهر فقط مع أعداد أكبر من رموز المطالبات أو مع مطالبات وقت تشغيل الوكيل الكاملة

التوقيعات الشائعة:

- `messages[...].content: invalid type: sequence, expected a string` → ترفض الواجهة الخلفية أجزاء محتوى Chat Completions المهيكلة. الإصلاح: اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- تنجح الطلبات المباشرة الصغيرة، لكن تشغيلات وكيل OpenClaw تفشل مع أعطال الواجهة الخلفية/النموذج
  (على سبيل المثال Gemma على بعض إصدارات `inferrs`) → من المرجح أن نقل OpenClaw
  صحيح بالفعل؛ إذ تفشل الواجهة الخلفية على شكل مطالبة وقت تشغيل الوكيل الأكبر.
- تتقلص الإخفاقات بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات
  جزءًا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج/الخادم العليا
  أو في خطأ في الواجهة الخلفية.

خيارات الإصلاح:

1. اضبط `compat.requiresStringContent: true` للواجهات الخلفية لـ Chat Completions التي تدعم المحتوى النصي فقط.
2. اضبط `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا تستطيع التعامل
   بشكل موثوق مع سطح مخطط الأدوات في OpenClaw.
3. خفّض ضغط المطالبات حيثما أمكن: bootstrap أصغر لمساحة العمل، وسجل جلسات أقصر،
   أو نموذج محلي أخف، أو واجهة خلفية بدعم أقوى للسياق الطويل.
4. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما ما تزال أدوار وكيل OpenClaw تتعطل
   داخل الواجهة الخلفية، فاعتبر ذلك قيدًا في الخادم/النموذج الأعلى وافتح
   تقرير إعادة إنتاج هناك مع شكل الحمولة المقبول.

ذو صلة:

- [/gateway/local-models](/ar/gateway/local-models)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات تعمل ولكن لا يوجد أي رد، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- اقتران معلق لمرسلي الرسائل المباشرة.
- تقييد الإشارة في المجموعات (`requireMention`، `mentionPatterns`).
- عدم تطابق قائمة السماح للقناة/المجموعة.

التوقيعات الشائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة حتى وجود إشارة.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/pairing](/ar/channels/pairing)
- [/channels/groups](/ar/channels/groups)

## اتصال واجهة dashboard/control ui

عندما لا تتمكن واجهة dashboard/control UI من الاتصال، تحقّق من URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان probe الصحيح وعنوان dashboard الصحيح.
- عدم تطابق وضع/رمز المصادقة بين العميل وGateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

التوقيعات الشائعة:

- `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
- `origin not allowed` → قيمة `Origin` في المتصفح ليست ضمن `gateway.controlUi.allowedOrigins`
  (أو أنك تتصل من Origin متصفح غير loopback بدون
  قائمة سماح صريحة).
- `device nonce required` / `device nonce mismatch` → لا يُكمل العميل
  تدفق مصادقة الجهاز المعتمد على التحدي (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → وقّع العميل الحمولة الخاطئة
  (أو استخدم طابعًا زمنيًا قديمًا) للمصافحة الحالية.
- `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل إجراء إعادة محاولة موثوقة واحدة باستخدام رمز الجهاز المخزن مؤقتًا.
- تعيد إعادة المحاولة بذلك الرمز المخزن مؤقتًا استخدام مجموعة النطاقات المخزنة مع
  رمز الجهاز المقترن. أما المستدعون الذين يمررون `deviceToken` صريحًا / `scopes` صريحة
  فيحتفظون بمجموعة النطاقات المطلوبة لديهم.
- خارج مسار إعادة المحاولة هذا، تكون أسبقية مصادقة الاتصال:
  الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن،
  ثم رمز bootstrap.
- في مسار Tailscale Serve Control UI غير المتزامن، تتم
  مَسْلسَلة المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدِّد الفشل. لذلك قد تظهر
  محاولتا إعادة سيئتان ومتزامنتان من العميل نفسه رسالة `retry later`
  في المحاولة الثانية بدلًا من حالتي عدم تطابق عاديتين.
- `too many failed authentication attempts (retry later)` من عميل loopback
  ذو origin متصفح → يتم قفل الإخفاقات المتكررة من نفس `Origin` المطبع مؤقتًا؛
  ويستخدم origin آخر على localhost سلة منفصلة.
- تكرار `unauthorized` بعد إعادة المحاولة تلك → انجراف في الرمز المشترك/رمز الجهاز؛ حدّث إعداد الرمز وأعد اعتماد/تدوير رمز الجهاز عند الحاجة.
- `gateway connect failed:` → هدف host/port/url غير صحيح.

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                | المعنى                                                                                                                                                                                      | الإجراء الموصى به                                                                                                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | لم يرسل العميل رمزًا مشتركًا مطلوبًا.                                                                                                                                                      | الصق/اضبط الرمز في العميل وأعد المحاولة. لمسارات dashboard: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات Control UI.                                                                                                                                                  |
| `AUTH_TOKEN_MISMATCH`       | لم يتطابق الرمز المشترك مع رمز مصادقة Gateway.                                                                                                                                              | إذا كانت `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد إعادة المحاولة بالرمز المخزن مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ بينما يحتفظ المستدعون الذين يمررون `deviceToken` / `scopes` صراحةً بالنطاقات المطلوبة لديهم. إذا استمر الفشل، شغّل [قائمة التحقق من استعادة انجراف الرمز](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | رمز كل جهاز المخزن مؤقتًا قديم أو أُلغي.                                                                                                                                                   | دوّر/أعد اعتماد رمز الجهاز باستخدام [CLI للأجهزة](/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                       |
| `PAIRING_REQUIRED`          | تحتاج هوية الجهاز إلى موافقة. تحقّق من `error.details.reason` لمعرفة `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | وافق على الطلب المعلق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                                           |

فحص ترحيل مصادقة الأجهزة v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/signature، فحدّث العميل المتصل وتحقّق من أنه:

1. ينتظر `connect.challenge`
2. يوقّع الحمولة المرتبطة بالتحدي
3. يرسل `connect.params.device.nonce` مع nonce التحدي نفسها

إذا تم رفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- لا يمكن لجلسات رمز الجهاز المقترن إدارة إلا **الجهاز الخاص بها** ما لم يكن
  لدى المستدعي أيضًا `operator.admin`
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات operator
  إلا إذا كانت جلسة المستدعي تمتلكها بالفعل

ذو صلة:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
- [/gateway/trusted-proxy-auth](/ar/gateway/trusted-proxy-auth)
- [/gateway/remote](/ar/gateway/remote)
- [/cli/devices](/cli/devices)

## خدمة Gateway لا تعمل

استخدم هذا عندما تكون الخدمة مثبتة لكن العملية لا تبقى قيد التشغيل.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # يفحص أيضًا الخدمات على مستوى النظام
```

ابحث عن:

- `Runtime: stopped` مع تلميحات الخروج.
- عدم تطابق إعدادات الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

التوقيعات الشائعة:

- `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → لم يتم تمكين وضع Gateway المحلي، أو تم العبث بملف الإعدادات وفقد `gateway.mode`. الإصلاح: اضبط `gateway.mode="local"` في إعداداتك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعدادات الوضع المحلي المتوقعة. إذا كنت تشغّل OpenClaw عبر Podman، فمسار الإعدادات الافتراضي هو `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → ربط غير loopback بدون مسار مصادقة صالح لـ Gateway (رمز/كلمة مرور، أو trusted-proxy عند ضبطه).
- `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
- `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. يجب أن تحتفظ معظم الإعدادات ببوابة واحدة لكل جهاز؛ وإذا كنت تحتاج فعلًا إلى أكثر من واحدة، فاعزل المنافذ + الإعدادات/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

ذو صلة:

- [/gateway/background-process](/ar/gateway/background-process)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/doctor](/ar/gateway/doctor)

## استعاد Gateway إعدادات آخر حالة سليمة معروفة

استخدم هذا عندما يبدأ Gateway، لكن السجلات تقول إنه استعاد `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

ابحث عن:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- ملف `openclaw.json.clobbered.*` مختوم بوقت بجانب الإعدادات النشطة
- حدث نظام الوكيل الرئيسي الذي يبدأ بـ `Config recovery warning`

ما الذي حدث:

- لم تجتز الإعدادات المرفوضة التحقق أثناء بدء التشغيل أو إعادة التحميل الساخن.
- احتفظ OpenClaw بالحمولة المرفوضة على هيئة `.clobbered.*`.
- تمت استعادة الإعدادات النشطة من آخر نسخة سليمة تم التحقق منها.
- يتم تحذير دور الوكيل الرئيسي التالي من إعادة كتابة الإعدادات المرفوضة بشكل أعمى.

الفحص والإصلاح:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

التوقيعات الشائعة:

- وجود `.clobbered.*` → تمت استعادة تعديل مباشر خارجي أو قراءة بدء تشغيل.
- وجود `.rejected.*` → فشلت كتابة إعدادات مملوكة لـ OpenClaw في فحوصات schema أو clobber قبل الالتزام.
- `Config write rejected:` → حاولت الكتابة إسقاط الشكل المطلوب، أو تقليص الملف بشكل حاد، أو حفظ إعدادات غير صالحة.
- `Config last-known-good promotion skipped` → احتوى المرشح على عناصر نائبة لأسرار منقحة مثل `***`.

خيارات الإصلاح:

1. احتفظ بالإعدادات النشطة المستعادة إذا كانت صحيحة.
2. انسخ فقط المفاتيح المقصودة من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
3. شغّل `openclaw config validate` قبل إعادة التشغيل.
4. إذا قمت بالتحرير يدويًا، فاحتفظ بإعداد JSON5 الكامل، وليس فقط الكائن الجزئي الذي أردت تغييره.

ذو صلة:

- [/gateway/configuration#strict-validation](/ar/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ar/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه ما يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و `primaryTargetId` في خرج JSON.
- ما إذا كان التحذير يتعلق بالرجوع إلى SSH، أو تعدد البوابات، أو النطاقات المفقودة، أو مراجع المصادقة غير المحلولة.

التوقيعات الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر لا يزال يحاول الأهداف المباشرة المضبوطة/loopback.
- `multiple reachable gateways detected` → استجاب أكثر من هدف واحد. يعني هذا عادة إعدادًا متعمدًا متعدد البوابات أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن RPC التفصيلي مقيَّد بالنطاقات؛ قم باقتران هوية الجهاز أو استخدم بيانات اعتماد تحتوي على `operator.read`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → استجاب Gateway، لكن هذا العميل ما يزال يحتاج إلى اقتران/موافقة قبل وصول operator العادي.
- نص تحذير `gateway.auth.*` / `gateway.remote.*` غير المحلول عبر SecretRef → كانت مادة المصادقة غير متاحة في مسار هذا الأمر للهدف الفاشل.

ذو صلة:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ar/gateway/remote)

## القناة متصلة لكن الرسائل لا تتدفق

إذا كانت حالة القناة متصلة لكن تدفق الرسائل متوقف، فركّز على السياسة والأذونات وقواعد التسليم الخاصة بالقناة.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ابحث عن:

- سياسة DM ‏(`pairing` أو `allowlist` أو `open` أو `disabled`).
- قائمة سماح المجموعة ومتطلبات الإشارة.
- أذونات/نطاقات API الخاصة بالقناة المفقودة.

التوقيعات الشائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- آثار `pairing` / الموافقة المعلقة → المرسل غير معتمد.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → مشكلة مصادقة/أذونات في القناة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/whatsapp](/ar/channels/whatsapp)
- [/channels/telegram](/ar/channels/telegram)
- [/channels/discord](/ar/channels/discord)

## تسليم Cron و Heartbeat

إذا لم يعمل Cron أو Heartbeat أو لم يسلّم، فتحقق أولًا من حالة المجدول، ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- أن Cron مفعّل وأن وقت الاستيقاظ التالي موجود.
- حالة سجل تشغيل المهمة (`ok` أو `skipped` أو `error`).
- أسباب تخطي Heartbeat ‏(`quiet-hours` أو `requests-in-flight` أو `alerts-disabled` أو `empty-heartbeat-file` أو `no-tasks-due`).

التوقيعات الشائعة:

- `cron: scheduler disabled; jobs will not run automatically` → تم تعطيل Cron.
- `cron: timer tick failed` → فشل نبض المؤقت للمجدول؛ تحقق من أخطاء الملفات/السجلات/وقت التشغيل.
- `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
- `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / عناوين markdown، لذا يتخطى OpenClaw استدعاء النموذج.
- `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهام مستحقة في هذه النبضة.
- `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم Heartbeat.
- `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف Heartbeat إلى وجهة بنمط DM بينما تم ضبط `agents.defaults.heartbeat.directPolicy` (أو التجاوز لكل وكيل) على `block`.

ذو صلة:

- [/automation/cron-jobs#troubleshooting](/ar/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ar/automation/cron-jobs)
- [/gateway/heartbeat](/ar/gateway/heartbeat)

## فشل أداة Node المقترنة

إذا كانت Node مقترنة لكن الأدوات تفشل، فاعزل حالة الواجهة الأمامية، والأذونات، وحالة الموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- أن Node متصلة بالإمكانات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- موافقات exec وحالة قائمة السماح.

التوقيعات الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة exec معلقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → تم حظر الأمر بواسطة قائمة السماح.

ذو صلة:

- [/nodes/troubleshooting](/ar/nodes/troubleshooting)
- [/nodes/index](/ar/nodes/index)
- [/tools/exec-approvals](/ar/tools/exec-approvals)

## فشل أداة المتصفح

استخدم هذا عندما تفشل إجراءات أداة المتصفح رغم أن Gateway نفسه سليم.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ابحث عن:

- ما إذا كان `plugins.allow` مضبوطًا ويتضمن `browser`.
- مسار صالح للملف التنفيذي للمتصفح.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome المحلي لملفات التعريف `existing-session` / `user`.

التوقيعات الشائعة:

- `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمّن بواسطة `plugins.allow`.
- غياب/عدم توفر أداة المتصفح بينما `browser.enabled=true` → يستبعد `plugins.allow` القيمة `browser`، لذا لم يتم تحميل Plugin مطلقًا.
- `Failed to start Chrome CDP on port` → فشلت عملية المتصفح في البدء.
- `browser.executablePath not found` → المسار المضبوط غير صالح.
- `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان CDP المضبوط مخططًا غير مدعوم مثل `file:` أو `ftp:`.
- `browser.cdpUrl has invalid port` → يحتوي عنوان CDP المضبوط على منفذ سيئ أو خارج النطاق.
- `Could not find DevToolsActivePort for chrome` → لم يتمكن Chrome MCP existing-session من الارتباط بعد بدليل بيانات المتصفح المحدد. افتح صفحة فحص المتصفح، ومكّن التصحيح عن بُعد، وأبقِ المتصفح مفتوحًا، ووافق على أول مطالبة ارتباط، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المُدار `openclaw`.
- `No Chrome tabs found for profile="user"` → لا يحتوي ملف تعريف ارتباط Chrome MCP على علامات تبويب Chrome محلية مفتوحة.
- `Remote CDP for profile "<name>" is not reachable` → نقطة نهاية CDP البعيدة المضبوطة غير قابلة للوصول من مضيف Gateway.
- `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف تعريف attach-only على هدف قابل للوصول، أو أن نقطة نهاية HTTP استجابت لكن تعذر رغم ذلك فتح CDP WebSocket.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقد تثبيت Gateway الحالي إلى حزمة Playwright الكاملة؛ ما تزال لقطات ARIA ولقطات الشاشة الأساسية للصفحات تعمل، لكن التنقل ولقطات AI ولقطات العناصر عبر CSS selector وتصدير PDF تبقى غير متاحة.
- `fullPage is not supported for element screenshots` → خلط طلب لقطة الشاشة بين `--full-page` و `--ref` أو `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات الشاشة لـ Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من snapshot، وليس CSS ‏`--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج hooks رفع الملفات في Chrome MCP إلى مراجع snapshot، وليس محددات CSS.
- `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة في كل استدعاء على ملفات تعريف Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → لا تدعم hooks الحوارات في ملفات تعريف Chrome MCP تجاوزات المهلة.
- `response body is not supported for existing-session profiles yet.` → ما يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خام.
- تجاوزات قديمة لـ viewport / dark-mode / locale / offline على ملفات تعريف attach-only أو CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP بدون إعادة تشغيل Gateway بالكامل.

ذو صلة:

- [/tools/browser-linux-troubleshooting](/ar/tools/browser-linux-troubleshooting)
- [/tools/browser](/ar/tools/browser)

## إذا قمت بالترقية وتعطل شيء فجأة

يكون معظم التعطل بعد الترقية بسبب انجراف الإعدادات أو فرض إعدادات افتراضية أكثر صرامة الآن.

### 1) تغيّر سلوك المصادقة وتجاوز URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

ما الذي يجب التحقق منه:

- إذا كان `gateway.mode=remote`، فقد تستهدف استدعاءات CLI البوابة البعيدة بينما تكون خدمتك المحلية سليمة.
- لا تعود استدعاءات `--url` الصريحة إلى بيانات الاعتماد المخزنة.

التوقيعات الشائعة:

- `gateway connect failed:` → هدف URL غير صحيح.
- `unauthorized` → نقطة النهاية قابلة للوصول لكن المصادقة خاطئة.

### 2) أصبحت ضوابط الربط والمصادقة أكثر صرامة

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

ما الذي يجب التحقق منه:

- تحتاج عمليات الربط غير loopback ‏(`lan`، `tailnet`، `custom`) إلى مسار مصادقة صالح لـ Gateway: مصادقة برمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير loopback مضبوط بشكل صحيح.
- لا تستبدل المفاتيح القديمة مثل `gateway.token` القيمة `gateway.auth.token`.

التوقيعات الشائعة:

- `refusing to bind gateway ... without auth` → ربط غير loopback بدون مسار مصادقة صالح لـ Gateway.
- `Connectivity probe: failed` بينما وقت التشغيل يعمل → Gateway حي لكنه غير قابل للوصول باستخدام المصادقة/URL الحاليين.

### 3) تغيّرت حالة الاقتران وهوية الجهاز

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

ما الذي يجب التحقق منه:

- موافقات أجهزة معلقة لـ dashboard/nodes.
- موافقات اقتران DM معلقة بعد تغييرات السياسة أو الهوية.

التوقيعات الشائعة:

- `device identity required` → لم يتم استيفاء مصادقة الجهاز.
- `pairing required` → يجب اعتماد المرسل/الجهاز.

إذا استمر عدم توافق إعدادات الخدمة ووقت التشغيل بعد الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من دليل الملف التعريفي/الحالة نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذو صلة:

- [/gateway/pairing](/ar/gateway/pairing)
- [/gateway/authentication](/ar/gateway/authentication)
- [/gateway/background-process](/ar/gateway/background-process)
