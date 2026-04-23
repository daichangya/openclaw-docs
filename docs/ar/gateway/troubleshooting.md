---
read_when:
    - أحالَك مركز استكشاف الأخطاء وإصلاحها إلى هنا من أجل تشخيص أعمق
    - تحتاج إلى أقسام دليل تشغيل مستقرة قائمة على الأعراض مع أوامر دقيقة
summary: دليل تشغيل متعمق لاستكشاف الأخطاء وإصلاحها لـ Gateway والقنوات والأتمتة وNode والمتصفح
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-04-23T07:25:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# استكشاف أخطاء Gateway وإصلاحها

هذه الصفحة هي دليل التشغيل المتعمق.
ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا كنت تريد تدفق الفرز السريع أولًا.

## سُلّم الأوامر

شغّل هذه الأوامر أولًا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

إشارات السلامة المتوقعة:

- يعرض `openclaw gateway status` القيم `Runtime: running` و`Connectivity probe: ok` وسطر `Capability: ...`.
- يبلّغ `openclaw doctor` عن عدم وجود مشكلات حظر في التكوين/الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب،
  وحيثما كان ذلك مدعومًا، نتائج probe/audit مثل `works` أو `audit ok`.

## Anthropic 429 يتطلب usage إضافيًا للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- يحتوي نموذج Anthropic Opus/Sonnet المحدد على `params.context1m: true`.
- بيانات اعتماد Anthropic الحالية غير مؤهلة لاستخدام السياق الطويل.
- تفشل الطلبات فقط على الجلسات الطويلة/تشغيلات النماذج التي تحتاج إلى مسار 1M التجريبي.

خيارات الإصلاح:

1. عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
2. استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو بدّل إلى مفتاح Anthropic API.
3. اضبط نماذج رجوع احتياطي حتى تستمر التشغيلات عندما تُرفض طلبات Anthropic ذات السياق الطويل.

ذو صلة:

- [/providers/anthropic](/ar/providers/anthropic)
- [/reference/token-use](/ar/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ar/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## واجهة خلفية محلية متوافقة مع OpenAI تجتاز probes المباشرة لكن تشغيلات الوكيل تفشل

استخدم هذا عندما:

- يعمل `curl ... /v1/models`
- تعمل استدعاءات `/v1/chat/completions` المباشرة الصغيرة
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

- تنجح الاستدعاءات المباشرة الصغيرة، لكن تفشل تشغيلات OpenClaw فقط على prompts الأكبر
- أخطاء واجهة خلفية حول توقع `messages[].content` لقيمة string
- أعطال واجهة خلفية لا تظهر إلا مع أعداد أكبر من prompt-token أو prompts كاملة
  خاصة ببيئة تشغيل الوكيل

العلامات الشائعة:

- `messages[...].content: invalid type: sequence, expected a string` → الواجهة الخلفية
  ترفض أجزاء محتوى Chat Completions المهيكلة. الإصلاح: اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- تنجح الطلبات المباشرة الصغيرة، لكن تفشل أدوار وكيل OpenClaw مع أعطال واجهة خلفية/نموذج
  (مثل Gemma في بعض إصدارات `inferrs`) → من المحتمل أن يكون نقل OpenClaw صحيحًا بالفعل؛
  والمشكلة أن الواجهة الخلفية تفشل مع شكل prompt الأكبر الخاص ببيئة تشغيل الوكيل.
- تتقلص حالات الفشل بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات
  جزءًا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج/الخادم upstream أو في خطأ بالواجهة الخلفية.

خيارات الإصلاح:

1. اضبط `compat.requiresStringContent: true` للواجهات الخلفية Chat Completions التي تدعم string فقط.
2. اضبط `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا تستطيع التعامل
   بشكل موثوق مع سطح مخطط الأدوات في OpenClaw.
3. خفّض ضغط prompt حيثما أمكن: bootstrap أصغر لمساحة العمل، وسجل جلسة أقصر،
   أو نموذج محلي أخف، أو واجهة خلفية ذات دعم أقوى للسياق الطويل.
4. إذا ظلت الطلبات المباشرة الصغيرة تنجح بينما تستمر أدوار وكيل OpenClaw في التعطل
   داخل الواجهة الخلفية، فتعامل معها على أنها قيد في الخادم/النموذج upstream وقدّم
   repro هناك مع شكل الحمولة المقبول.

ذو صلة:

- [/gateway/local-models](/ar/gateway/local-models)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات تعمل لكن لا شيء يجيب، فتحقق من التوجيه والسياسة قبل إعادة اتصال أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- اقتران معلّق لمرسلي الرسائل المباشرة.
- تقييد الإشارات في المجموعات (`requireMention` و`mentionPatterns`).
- عدم تطابق قائمة السماح للقنوات/المجموعات.

العلامات الشائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة حتى وجود إشارة.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/pairing](/ar/channels/pairing)
- [/channels/groups](/ar/channels/groups)

## اتصال Dashboard control ui

عندما لا تتمكن Dashboard/Control UI من الاتصال، تحقّق من عنوان URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- صحة عنوان probe وعنوان dashboard URL.
- عدم تطابق وضع المصادقة/الرمز بين العميل وGateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

العلامات الشائعة:

- `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
- `origin not allowed` → لا يوجد `Origin` الخاص بالمتصفح في `gateway.controlUi.allowedOrigins`
  (أو أنك تتصل من أصل متصفح غير loopback من دون
  قائمة سماح صريحة).
- `device nonce required` / `device nonce mismatch` → لا يكمل العميل
  تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → وقّع العميل الحمولة الخاطئة
  (أو استخدم طابعًا زمنيًا قديمًا) للمصافحة الحالية.
- `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل تنفيذ إعادة محاولة موثوقة واحدة باستخدام device token مخزن مؤقتًا.
- تستخدم إعادة المحاولة عبر الرمز المخزن مؤقتًا مجموعة scopes المخزنة مع
  device token المقترن. أما المستدعون الذين يمررون `deviceToken` صريحًا / `scopes` صريحة فيحتفظون
  بمجموعة scopes المطلوبة.
- خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال هي
  shared token/password الصريح أولًا، ثم `deviceToken` الصريح، ثم device token المخزن، ثم bootstrap token.
- في مسار Control UI غير المتزامن عبر Tailscale Serve، تتم
  موازاة المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدِّد الفشل. لذلك قد تظهر محاولتا إعادة سيئتان متزامنتان من العميل نفسه الرسالة `retry later`
  في المحاولة الثانية بدلًا من ظهور حالتي عدم تطابق عاديتين.
- `too many failed authentication attempts (retry later)` من عميل loopback ذي أصل متصفح
  → يتم حظر الإخفاقات المتكررة من `Origin` المعياري نفسه مؤقتًا؛ ويستخدم أصل localhost آخر bucket منفصلة.
- تكرار `unauthorized` بعد إعادة المحاولة تلك → انجراف shared token/device token؛ حدّث تكوين الرمز وأعد الموافقة/التدوير لـ device token عند الحاجة.
- `gateway connect failed:` → هدف host/port/url خاطئ.

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل | المعنى | الإجراء الموصى به |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING` | لم يرسل العميل shared token مطلوبًا. | الصق/اضبط الرمز في العميل ثم أعد المحاولة. لمسارات dashboard: استخدم `openclaw config get gateway.auth.token` ثم الصقه في إعدادات Control UI. |
| `AUTH_TOKEN_MISMATCH` | لم يطابق shared token رمز مصادقة gateway. | إذا كانت `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد المحاولات عبر الرمز المخزن مؤقتًا استخدام scopes المعتمدة المخزنة؛ أما المستدعون الذين يمررون `deviceToken` / `scopes` صريحة فيحتفظون بالمجموعة المطلوبة. إذا استمر الفشل، فشغّل [قائمة التحقق من استرداد انجراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | أصبح الرمز المخزن لكل جهاز قديمًا أو أُلغي. | دوّر/أعد الموافقة على device token باستخدام [CLI الأجهزة](/ar/cli/devices)، ثم أعد الاتصال. |
| `PAIRING_REQUIRED` | تحتاج هوية الجهاز إلى موافقة. تحقّق من `error.details.reason` للقيم `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | وافق على الطلب المعلّق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات scope/role التدفق نفسه بعد مراجعة الوصول المطلوب. |

فحص ترحيل device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/signature، فحدّث العميل المتصل وتحقق من أنه:

1. ينتظر `connect.challenge`
2. يوقّع الحمولة المرتبطة بالتحدي
3. يرسل `connect.params.device.nonce` مع nonce التحدي نفسها

إذا تم رفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- يمكن لجلسات paired-device token إدارة **جهازها الخاص فقط** ما لم يكن
  لدى المستدعي أيضًا `operator.admin`
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب operator scopes إلا إذا
  كانت جلسة المستدعي تملكها بالفعل

ذو صلة:

- [/web/control-ui](/ar/web/control-ui)
- [/gateway/configuration](/ar/gateway/configuration) (أوضاع مصادقة gateway)
- [/gateway/trusted-proxy-auth](/ar/gateway/trusted-proxy-auth)
- [/gateway/remote](/ar/gateway/remote)
- [/cli/devices](/ar/cli/devices)

## خدمة Gateway لا تعمل

استخدم هذا عندما تكون الخدمة مثبّتة لكن العملية لا تبقى قيد التشغيل.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # فحص خدمات على مستوى النظام أيضًا
```

ابحث عن:

- `Runtime: stopped` مع تلميحات خروج.
- عدم تطابق تكوين الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

العلامات الشائعة:

- `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → لم يتم تفعيل وضع Gateway المحلي، أو تم إتلاف ملف التكوين وفقد الحقل `gateway.mode`. الإصلاح: اضبط `gateway.mode="local"` في التكوين لديك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم تكوين الوضع المحلي المتوقع. إذا كنت تشغّل OpenClaw عبر Podman، فإن مسار التكوين الافتراضي هو `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → محاولة ربط غير loopback من دون مسار مصادقة صالح لـ gateway (token/password، أو trusted-proxy عند ضبطه).
- `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
- `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. في معظم الإعدادات يجب الإبقاء على Gateway واحد لكل جهاز؛ وإذا كنت تحتاج فعلًا إلى أكثر من واحد، فاعزل المنافذ + التكوين/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

ذو صلة:

- [/gateway/background-process](/ar/gateway/background-process)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/doctor](/ar/gateway/doctor)

## استعاد Gateway التكوين الأخير المعروف السليم

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
- ملف `openclaw.json.clobbered.*` يحمل طابعًا زمنيًا بجانب التكوين النشط
- حدث نظام للوكيل الرئيسي يبدأ بـ `Config recovery warning`

ما الذي حدث:

- لم يجتز التكوين المرفوض التحقق أثناء بدء التشغيل أو إعادة التحميل السريع.
- احتفظ OpenClaw بالحمولة المرفوضة على شكل `.clobbered.*`.
- تمت استعادة التكوين النشط من آخر نسخة سليمة سبق التحقق منها.
- يتم تحذير الدور التالي للوكيل الرئيسي من إعادة كتابة التكوين المرفوض بشكل أعمى.

افحص وأصلح:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

العلامات الشائعة:

- وجود `.clobbered.*` → تمت استعادة تعديل مباشر خارجي أو قراءة بدء تشغيل.
- وجود `.rejected.*` → فشلت عملية كتابة تكوين مملوكة لـ OpenClaw في فحوصات schema أو clobber قبل الالتزام.
- `Config write rejected:` → حاولت الكتابة إسقاط شكل مطلوب، أو تقليص الملف بشكل حاد، أو حفظ تكوين غير صالح.
- `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` → تعامل بدء التشغيل مع الملف الحالي على أنه clobbered لأنه فقد حقولًا أو حجمًا مقارنةً بنسخة last-known-good الاحتياطية.
- `Config last-known-good promotion skipped` → احتوى المرشح على عناصر نائبة لأسرار منقحة مثل `***`.

خيارات الإصلاح:

1. احتفِظ بالتكوين النشط المستعاد إذا كان صحيحًا.
2. انسخ فقط المفاتيح المقصودة من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
3. شغّل `openclaw config validate` قبل إعادة التشغيل.
4. إذا كنت تعدّل يدويًا، فاحتفِظ بتكوين JSON5 الكامل، وليس فقط الكائن الجزئي الذي أردت تغييره.

ذو صلة:

- [/gateway/configuration#strict-validation](/ar/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ar/gateway/configuration#config-hot-reload)
- [/cli/config](/ar/cli/config)
- [/gateway/doctor](/ar/gateway/doctor)

## تحذيرات probe الخاصة بـ Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه يطبع كتلة تحذير مع ذلك.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في مخرجات JSON.
- ما إذا كان التحذير يتعلق برجوع SSH الاحتياطي، أو تعدد Gateways، أو scopes مفقودة، أو مراجع مصادقة غير محلولة.

العلامات الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر حاول مع ذلك الأهداف المباشرة المضبوطة/التي على loopback.
- `multiple reachable gateways detected` → أجاب أكثر من هدف واحد. يعني هذا عادة إعدادًا مقصودًا متعدد الـ Gateway أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن RPC التفاصيل مقيد بالنطاق؛ قم بإقران هوية الجهاز أو استخدم بيانات اعتماد تحتوي على `operator.read`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → أجاب Gateway، لكن هذا العميل ما زال يحتاج إلى اقتران/موافقة قبل الوصول العادي للمشغّل.
- نص تحذير `gateway.auth.*` / `gateway.remote.*` SecretRef غير المحلول → لم تكن مادة المصادقة متاحة في مسار هذا الأمر للهدف الفاشل.

ذو صلة:

- [/cli/gateway](/ar/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ar/gateway/remote)

## القناة متصلة لكن الرسائل لا تتدفق

إذا كانت حالة القناة متصلة لكن تدفق الرسائل متوقفًا، فركّز على السياسة والأذونات وقواعد التسليم الخاصة بكل قناة.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ابحث عن:

- سياسة الرسائل المباشرة (`pairing` أو `allowlist` أو `open` أو `disabled`).
- قائمة سماح المجموعات ومتطلبات الإشارة.
- أذونات/نطاقات API مفقودة خاصة بالقناة.

العلامات الشائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- آثار `pairing` / الموافقة المعلقة → لم تتم الموافقة على المرسل.
- `missing_scope` أو `not_in_channel` أو `Forbidden` أو `401/403` → مشكلة مصادقة/أذونات خاصة بالقناة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/whatsapp](/ar/channels/whatsapp)
- [/channels/telegram](/ar/channels/telegram)
- [/channels/discord](/ar/channels/discord)

## تسليم Cron وHeartbeat

إذا لم يعمل Cron أو Heartbeat أو لم يُسلِّما، فتحقق أولًا من حالة المجدول، ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تفعيل Cron ووجود وقت الاستيقاظ التالي.
- حالة سجل تشغيل المهمة (`ok` أو `skipped` أو `error`).
- أسباب تخطي Heartbeat (`quiet-hours` أو `requests-in-flight` أو `alerts-disabled` أو `empty-heartbeat-file` أو `no-tasks-due`).

العلامات الشائعة:

- `cron: scheduler disabled; jobs will not run automatically` → تم تعطيل Cron.
- `cron: timer tick failed` → فشل نبض المجدول؛ تحقق من أخطاء الملفات/السجلات/بيئة التشغيل.
- `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
- `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / عناوين Markdown، لذلك يتخطى OpenClaw استدعاء النموذج.
- `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهام مستحقة في هذه النبضة.
- `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم Heartbeat.
- `heartbeat skipped` مع `reason=dm-blocked` → تم resolve هدف Heartbeat إلى وجهة من نمط الرسائل المباشرة بينما كانت `agents.defaults.heartbeat.directPolicy` (أو التجاوز لكل وكيل) مضبوطة على `block`.

ذو صلة:

- [/automation/cron-jobs#troubleshooting](/ar/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ar/automation/cron-jobs)
- [/gateway/heartbeat](/ar/gateway/heartbeat)

## فشل أداة Node المقترنة

إذا كانت Node مقترنة لكن الأدوات تفشل، فاعزل حالة foreground والأذونات والموافقات.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- أن تكون Node متصلة وتعرض الإمكانات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- موافقات exec وحالة قائمة السماح.

العلامات الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في foreground.
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
- صحة مسار الملف التنفيذي للمتصفح.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome محليًا لملفات التعريف `existing-session` / `user`.

العلامات الشائعة:

- `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمّن بواسطة `plugins.allow`.
- غياب/عدم توفر أداة المتصفح بينما `browser.enabled=true` → يستبعد `plugins.allow` قيمة `browser`، لذلك لم يتم تحميل Plugin أصلًا.
- `Failed to start Chrome CDP on port` → فشلت عملية المتصفح في التشغيل.
- `browser.executablePath not found` → المسار المضبوط غير صالح.
- `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان CDP URL المضبوط مخططًا غير مدعوم مثل `file:` أو `ftp:`.
- `browser.cdpUrl has invalid port` → يحتوي عنوان CDP URL المضبوط على منفذ سيئ أو خارج النطاق.
- `Could not find DevToolsActivePort for chrome` → لم يتمكن Chrome MCP existing-session بعد من الارتباط بدليل بيانات المتصفح المحدد. افتح صفحة فحص المتصفح، وفعّل التصحيح عن بُعد، وأبقِ المتصفح مفتوحًا، ووافق على أول مطالبة بالارتباط، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المُدار `openclaw`.
- `No Chrome tabs found for profile="user"` → لا توجد علامات تبويب Chrome محلية مفتوحة لملف تعريف إرفاق Chrome MCP.
- `Remote CDP for profile "<name>" is not reachable` → نقطة نهاية CDP البعيدة المضبوطة غير قابلة للوصول من مضيف Gateway.
- `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف تعريف attach-only على هدف قابل للوصول، أو أن نقطة نهاية HTTP أجابت لكن تعذر مع ذلك فتح CDP WebSocket.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقر تثبيت Gateway الحالي إلى الاعتماد التشغيلي `playwright-core` الخاص بـ Plugin المتصفح المضمّن؛ شغّل `openclaw doctor --fix`، ثم أعد تشغيل Gateway. لا تزال لقطات ARIA ولقطات الشاشة الأساسية للصفحات قد تعمل، لكن التنقل وAI snapshots ولقطات عناصر CSS-selector وتصدير PDF ستظل غير متاحة.
- `fullPage is not supported for element screenshots` → خلط طلب لقطة الشاشة بين `--full-page` و`--ref` أو `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطة الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من snapshot، وليس CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج hooks رفع الملفات في Chrome MCP إلى snapshot refs، وليس محددات CSS.
- `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء في ملفات تعريف Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → لا تدعم hooks الحوار في ملفات تعريف Chrome MCP تجاوزات المهلة.
- `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خام.
- تجاوزات viewport / dark-mode / locale / offline القديمة على ملفات تعريف attach-only أو CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة المحاكاة الخاصة بـ Playwright/CDP من دون إعادة تشغيل Gateway بالكامل.

ذو صلة:

- [/tools/browser-linux-troubleshooting](/ar/tools/browser-linux-troubleshooting)
- [/tools/browser](/ar/tools/browser)

## إذا قمت بالترقية وانكسر شيء فجأة

معظم الأعطال بعد الترقية تكون بسبب انجراف التكوين أو فرض إعدادات افتراضية أكثر صرامة الآن.

### 1) تغيّر سلوك تجاوزات المصادقة وURL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

ما الذي يجب التحقق منه:

- إذا كانت `gateway.mode=remote`، فقد تكون استدعاءات CLI تستهدف جهة بعيدة بينما خدمتك المحلية سليمة.
- لا تعود الاستدعاءات الصريحة باستخدام `--url` إلى بيانات الاعتماد المخزنة.

العلامات الشائعة:

- `gateway connect failed:` → هدف URL خاطئ.
- `unauthorized` → نقطة النهاية قابلة للوصول لكن المصادقة خاطئة.

### 2) أصبحت قيود الربط والمصادقة أكثر صرامة

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

ما الذي يجب التحقق منه:

- تتطلب عمليات الربط غير loopback (`lan` و`tailnet` و`custom`) مسار مصادقة صالحًا لـ Gateway: مصادقة shared token/password، أو نشر `trusted-proxy` غير loopback مضبوطًا بشكل صحيح.
- لا تستبدل المفاتيح القديمة مثل `gateway.token` القيمة `gateway.auth.token`.

العلامات الشائعة:

- `refusing to bind gateway ... without auth` → ربط غير loopback من دون مسار مصادقة صالح لـ gateway.
- `Connectivity probe: failed` بينما بيئة التشغيل تعمل → Gateway حي لكنه غير قابل للوصول باستخدام المصادقة/URL الحاليين.

### 3) تغيّرت حالة الاقتران وهوية الجهاز

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

ما الذي يجب التحقق منه:

- موافقات أجهزة معلّقة لـ dashboard/nodes.
- موافقات اقتران رسائل مباشرة معلّقة بعد تغييرات السياسة أو الهوية.

العلامات الشائعة:

- `device identity required` → لم تتحقق مصادقة الجهاز.
- `pairing required` → يجب الموافقة على المرسل/الجهاز.

إذا ظل تكوين الخدمة وبيئة التشغيل غير متوافقين بعد الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من دليل profile/state نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذو صلة:

- [/gateway/pairing](/ar/gateway/pairing)
- [/gateway/authentication](/ar/gateway/authentication)
- [/gateway/background-process](/ar/gateway/background-process)
