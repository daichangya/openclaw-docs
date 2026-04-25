---
read_when:
    - أحالك مركز استكشاف الأخطاء وإصلاحها إلى هنا لتشخيص أعمق
    - تحتاج إلى أقسام دليل تشغيل مستقرة قائمة على الأعراض مع أوامر دقيقة
summary: دليل تشغيل متعمق لاستكشاف الأخطاء وإصلاحها في Gateway والقنوات والأتمتة والعُقد والمتصفح
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-04-25T13:49:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
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

الإشارات المتوقعة عند الحالة السليمة:

- يعرض `openclaw gateway status` القيم `Runtime: running` و`Connectivity probe: ok` وسطرًا من نوع `Capability: ...`.
- يعرض `openclaw doctor` عدم وجود مشكلات حظر في الإعداد/الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، ومعها،
  حيثما كان مدعومًا، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## خطأ Anthropic 429: يلزم استخدام إضافي للسياق الطويل

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
- أن الطلبات تفشل فقط في الجلسات الطويلة أو تشغيلات النماذج التي تحتاج إلى مسار 1M التجريبي.

خيارات الإصلاح:

1. عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
2. استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو بدّل إلى مفتاح Anthropic API.
3. كوّن نماذج احتياطية حتى تستمر التشغيلات عندما يتم رفض طلبات Anthropic ذات السياق الطويل.

ذو صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [لماذا أرى HTTP 429 من Anthropic؟](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## واجهة خلفية محلية متوافقة مع OpenAI تنجح فيها الفحوصات المباشرة لكن تفشل تشغيلات الوكيل

استخدم هذا عندما:

- ينجح `curl ... /v1/models`
- تنجح نداءات `/v1/chat/completions` المباشرة الصغيرة
- تفشل تشغيلات نماذج OpenClaw فقط في الأدوار العادية للوكيل

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ابحث عن:

- نجاح النداءات المباشرة الصغيرة، لكن فشل تشغيلات OpenClaw فقط مع الموجّهات الأكبر
- أخطاء في الواجهة الخلفية حول أن `messages[].content` يتوقع سلسلة نصية
- أعطال في الواجهة الخلفية تظهر فقط مع عدد أكبر من رموز الموجّه أو مع موجّهات وقت تشغيل الوكيل الكاملة

التوقيعات الشائعة:

- `messages[...].content: invalid type: sequence, expected a string` → الواجهة الخلفية
  ترفض أجزاء المحتوى المهيكلة في Chat Completions. الإصلاح: عيّن
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- تنجح الطلبات المباشرة الصغيرة، لكن تفشل تشغيلات وكيل OpenClaw مع أعطال في الواجهة الخلفية/النموذج
  (مثل Gemma في بعض إصدارات `inferrs`) → من المحتمل أن يكون نقل OpenClaw
  صحيحًا بالفعل؛ المشكلة أن الواجهة الخلفية تفشل مع شكل موجّه
  وقت تشغيل الوكيل الأكبر.
- تتراجع حالات الفشل بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات
  جزءًا من الضغط، لكن المشكلة المتبقية لا تزال منبعها سعة النموذج/الخادم
  أو علة في الواجهة الخلفية.

خيارات الإصلاح:

1. عيّن `compat.requiresStringContent: true` للواجهات الخلفية Chat Completions التي تدعم النصوص فقط.
2. عيّن `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا تستطيع
   التعامل مع سطح مخطط الأدوات في OpenClaw بشكل موثوق.
3. خفف ضغط الموجّه حيثما أمكن: bootstrap أصغر لمساحة العمل، أو سجل جلسة أقصر، أو نموذج محلي أخف، أو واجهة خلفية تدعم السياق الطويل بشكل أقوى.
4. إذا ظلت الطلبات المباشرة الصغيرة ناجحة بينما لا تزال أدوار وكيل OpenClaw تتعطل
   داخل الواجهة الخلفية، فاعتبرها قيدًا في الخادم/النموذج من المصدر وقدّم
   بلاغ إعادة إنتاج هناك مع شكل الحمولة المقبول.

ذو صلة:

- [النماذج المحلية](/ar/gateway/local-models)
- [الإعداد](/ar/gateway/configuration)
- [نقاط النهاية المتوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات تعمل لكن لا يوجد أي رد، فتحقق من التوجيه والسياسة قبل إعادة ربط أي شيء.

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
- عدم تطابق في قوائم السماح للقنوات/المجموعات.

التوقيعات الشائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة حتى تتم الإشارة.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذو صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)

## اتصال واجهة تحكم لوحة المعلومات

عندما لا تتصل لوحة المعلومات/Control UI، تحقّق من URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- URL الصحيح للفحص وURL الصحيح للوحة المعلومات.
- عدم تطابق وضع المصادقة/الرمز بين العميل وGateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

التوقيعات الشائعة:

- `device identity required` → سياق غير آمن أو غياب مصادقة الجهاز.
- `origin not allowed` → قيمة `Origin` في المتصفح ليست ضمن `gateway.controlUi.allowedOrigins`
  (أو أنك تتصل من `Origin` متصفح غير loopback من دون
  قائمة سماح صريحة).
- `device nonce required` / `device nonce mismatch` → العميل لا يُكمل
  تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → العميل وقّع حمولة غير صحيحة
  (أو استخدم طابعًا زمنيًا قديمًا) للمصافحة الحالية.
- `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل إجراء إعادة محاولة موثوقة واحدة باستخدام رمز الجهاز المخزن مؤقتًا.
- تعيد إعادة المحاولة بذلك الرمز المخزن مؤقتًا استخدام مجموعة النطاقات المخزنة مع
  رمز الجهاز المقترن. أما المستدعون الذين يستخدمون `deviceToken` صريحًا / `scopes` صريحة فيحتفظون
  بمجموعة النطاقات المطلوبة الخاصة بهم.
- خارج مسار إعادة المحاولة ذلك، تكون أولوية مصادقة الاتصال هي:
  رمز/كلمة مرور مشتركان صريحان أولًا، ثم `deviceToken` صريح، ثم رمز الجهاز المخزن،
  ثم رمز bootstrap.
- في مسار Control UI غير المتزامن عبر Tailscale Serve، يتم تسلسل المحاولات الفاشلة
  لنفس `{scope, ip}` قبل أن يسجل المحدّد الفشل. لذلك قد تظهر
  محاولة ثانية سيئة متزامنة من العميل نفسه رسالة `retry later`
  في المحاولة الثانية بدلًا من ظهور حالتي عدم تطابق عاديتين.
- `too many failed authentication attempts (retry later)` من عميل loopback
  من أصل متصفح → يتم قفل الإخفاقات المتكررة من `Origin` المطبع نفسه مؤقتًا؛ بينما يستخدم origin localhost آخر حاوية منفصلة.
- `unauthorized` متكرر بعد إعادة المحاولة تلك → انحراف في الرمز المشترك/رمز الجهاز؛ حدّث إعداد الرمز وأعد الموافقة/دوّر رمز الجهاز عند الحاجة.
- `gateway connect failed:` → الهدف host/port/url غير صحيح.

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                 | المعنى                                                                                                                                                                                       | الإجراء الموصى به                                                                                                                                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل رمزًا مشتركًا مطلوبًا.                                                                                                                                                      | ألصق/عيّن الرمز في العميل ثم أعد المحاولة. بالنسبة إلى مسارات لوحة المعلومات: `openclaw config get gateway.auth.token` ثم ألصقه في إعدادات Control UI.                                                                                                                               |
| `AUTH_TOKEN_MISMATCH`        | لم يطابق الرمز المشترك رمز مصادقة Gateway.                                                                                                                                                 | إذا كانت `canRetryWithDeviceToken=true`، اسمح بإعادة محاولة موثوقة واحدة. تعيد عمليات إعادة المحاولة بالرمز المخزن مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ أما المستدعون الذين يستخدمون `deviceToken` / `scopes` صريحة فيحتفظون بالنطاقات المطلوبة. وإذا استمر الفشل، شغّل [قائمة التحقق من استرداد انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | رمز كل جهاز المخزن مؤقتًا قديم أو تم إبطاله.                                                                                                                                               | دوّر/أعد اعتماد رمز الجهاز باستخدام [CLI الأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                       |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى موافقة. تحقق من `error.details.reason` لمعرفة القيم `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | وافق على الطلب المعلق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. وتستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                                           |

فحص ترحيل مصادقة الجهاز v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/signature، فحدّث العميل المتصل وتأكد من أنه:

1. ينتظر `connect.challenge`
2. يوقّع الحمولة المرتبطة بالتحدي
3. يرسل `connect.params.device.nonce` مع nonce التحدي نفسها

إذا تم رفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- لا يمكن لجلسات رموز الأجهزة المقترنة إدارة إلا **أجهزتها الخاصة**
  ما لم يكن لدى المستدعي أيضًا `operator.admin`
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات تشغيل
  إلا إذا كانت جلسة المستدعي تحملها بالفعل

ذو صلة:

- [Control UI](/ar/web/control-ui)
- [الإعداد](/ar/gateway/configuration) (أوضاع مصادقة gateway)
- [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)
- [الوصول البعيد](/ar/gateway/remote)
- [الأجهزة](/ar/cli/devices)

## خدمة Gateway لا تعمل

استخدم هذا عندما تكون الخدمة مثبتة لكن العملية لا تبقى قيد التشغيل.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # يفحص أيضًا خدمات على مستوى النظام
```

ابحث عن:

- `Runtime: stopped` مع تلميحات عن الخروج.
- عدم تطابق إعداد الخدمة (`Config (cli)` مقابل `Config (service)`).
- تضاربات المنفذ/المستمع.
- عمليات تثبيت launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

التوقيعات الشائعة:

- `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → وضع gateway المحلي غير مفعّل، أو تم العبث بملف الإعداد وفقدان `gateway.mode`. الإصلاح: عيّن `gateway.mode="local"` في إعدادك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعداد الوضع المحلي المتوقع. إذا كنت تشغّل OpenClaw عبر Podman، فمسار الإعداد الافتراضي هو `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → محاولة ربط غير loopback من دون مسار مصادقة صالح لـ gateway ‏(رمز/كلمة مرور، أو trusted-proxy حيث يكون مكوّنًا).
- `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
- `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. يجب أن تحتفظ معظم الإعدادات بـ gateway واحدة لكل جهاز؛ وإذا كنت تحتاج فعلًا إلى أكثر من واحدة، فاعزل المنافذ + الإعداد/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

ذو صلة:

- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [الإعداد](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## استعاد Gateway الإعداد السليم الأخير

استخدم هذا عندما تبدأ Gateway، لكن السجلات تقول إنها استعادت `openclaw.json`.

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
- ملفًا مختومًا بوقت من نوع `openclaw.json.clobbered.*` بجانب الإعداد النشط
- حدث نظام للوكيل الرئيسي يبدأ بـ `Config recovery warning`

ما الذي حدث:

- الإعداد المرفوض لم يجتز التحقق أثناء بدء التشغيل أو إعادة التحميل السريع.
- احتفظ OpenClaw بالحمولة المرفوضة كملف `.clobbered.*`.
- تمت استعادة الإعداد النشط من آخر نسخة سليمة تم التحقق منها.
- يتم تحذير الدور التالي للوكيل الرئيسي من عدم إعادة كتابة الإعداد المرفوض بشكل أعمى.
- إذا كانت جميع مشكلات التحقق تقع تحت `plugins.entries.<id>...`، فلن يستعيد OpenClaw
  الملف كله. إذ تبقى حالات الفشل المحلية للـ Plugin ظاهرة بينما تظل
  إعدادات المستخدم غير ذات الصلة في الإعداد النشط.

افحص وأصلح:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

التوقيعات الشائعة:

- وجود `.clobbered.*` → تمت استعادة تعديل مباشر خارجي أو قراءة بدء تشغيل.
- وجود `.rejected.*` → فشلت كتابة إعداد مملوكة لـ OpenClaw في اجتياز فحوصات المخطط أو العبث قبل الالتزام.
- `Config write rejected:` → حاولت الكتابة إسقاط بنية مطلوبة، أو تقليص الملف بشكل حاد، أو حفظ إعداد غير صالح.
- `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` → اعتبر بدء التشغيل الملف الحالي ملفًا تم العبث به لأنه فقد حقولًا أو حجمًا مقارنةً بنسخة last-known-good الاحتياطية.
- `Config last-known-good promotion skipped` → احتوى المرشح على عناصر نائبة منقحة للأسرار مثل `***`.

خيارات الإصلاح:

1. احتفظ بالإعداد النشط المستعاد إذا كان صحيحًا.
2. انسخ فقط المفاتيح المقصودة من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
3. شغّل `openclaw config validate` قبل إعادة التشغيل.
4. إذا كنت تعدّل يدويًا، فاحتفظ بملف JSON5 الكامل، وليس فقط الكائن الجزئي الذي أردت تغييره.

ذو صلة:

- [الإعداد: تحقق صارم](/ar/gateway/configuration#strict-validation)
- [الإعداد: إعادة التحميل السريع](/ar/gateway/configuration#config-hot-reload)
- [Config](/ar/cli/config)
- [Doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه لا يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في مخرجات JSON.
- ما إذا كان التحذير يتعلق باحتياط SSH، أو تعدد Gateways، أو غياب النطاقات، أو مراجع مصادقة غير محلولة.

التوقيعات الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر حاول مع ذلك الأهداف المباشرة المكوّنة/loopback.
- `multiple reachable gateways detected` → استجابت أكثر من وجهة. وهذا يعني عادة إعدادًا مقصودًا متعدد الـ Gateways أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن RPC التفصيلي مقيّد بالنطاقات؛ قم بإقران هوية الجهاز أو استخدم بيانات اعتماد تحتوي على `operator.read`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → استجابت gateway، لكن هذا العميل لا يزال يحتاج إلى اقتران/موافقة قبل الوصول التشغيلي العادي.
- نص تحذير SecretRef غير المحلول لـ `gateway.auth.*` / `gateway.remote.*` → كانت مواد المصادقة غير متاحة في مسار هذا الأمر للهدف الفاشل.

ذو صلة:

- [Gateway](/ar/cli/gateway)
- [Gateways متعددة على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
- [الوصول البعيد](/ar/gateway/remote)

## القناة متصلة لكن الرسائل لا تتدفق

إذا كانت حالة القناة متصلة لكن تدفق الرسائل متوقف، فركّز على السياسة، والأذونات، وقواعد التسليم الخاصة بالقناة.

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
- أذونات/نطاقات API الخاصة بالقناة المفقودة.

التوقيعات الشائعة:

- `mention required` → تم تجاهل الرسالة بواسطة سياسة الإشارة في المجموعة.
- آثار `pairing` / الموافقة المعلقة → المرسل غير معتمد.
- `missing_scope` أو `not_in_channel` أو `Forbidden` أو `401/403` → مشكلة مصادقة/أذونات في القناة.

ذو صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [WhatsApp](/ar/channels/whatsapp)
- [Telegram](/ar/channels/telegram)
- [Discord](/ar/channels/discord)

## تسليم Cron وHeartbeat

إذا لم تعمل Cron أو Heartbeat أو لم يتم التسليم، فتحقق أولًا من حالة المجدول، ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تمكين Cron ووجود وقت التنبيه التالي.
- حالة سجل تشغيل الوظائف (`ok` أو `skipped` أو `error`).
- أسباب تخطي Heartbeat ‏(`quiet-hours` أو `requests-in-flight` أو `alerts-disabled` أو `empty-heartbeat-file` أو `no-tasks-due`).

التوقيعات الشائعة:

- `cron: scheduler disabled; jobs will not run automatically` → Cron معطّلة.
- `cron: timer tick failed` → فشل نبضة المجدول؛ افحص أخطاء الملفات/السجلات/وقت التشغيل.
- `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
- `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / عناوين Markdown، لذلك يتجاوز OpenClaw نداء النموذج.
- `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن أياً من المهام ليس مستحقًا في هذه النبضة.
- `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم Heartbeat.
- `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف Heartbeat إلى وجهة على نمط الرسائل المباشرة بينما كانت `agents.defaults.heartbeat.directPolicy` (أو تجاوز لكل وكيل) مضبوطة على `block`.

ذو صلة:

- [المهام المجدولة: استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [Heartbeat](/ar/gateway/heartbeat)

## أداة العقدة المقترنة تفشل

إذا كانت العقدة مقترنة لكن الأدوات تفشل، فاعزل حالة المقدمة، والأذونات، والموافقات.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- أن العقدة متصلة مع القدرات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/المايكروفون/الموقع/الشاشة.
- موافقات exec وحالة قائمة السماح.

التوقيعات الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق العقدة في المقدمة.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة exec معلّقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → تم حظر الأمر بواسطة قائمة السماح.

ذو صلة:

- [استكشاف أخطاء العقد وإصلاحها](/ar/nodes/troubleshooting)
- [Nodes](/ar/nodes/index)
- [موافقات exec](/ar/tools/exec-approvals)

## أداة المتصفح تفشل

استخدم هذا عندما تفشل إجراءات أداة المتصفح رغم أن Gateway نفسها سليمة.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ابحث عن:

- ما إذا كانت `plugins.allow` معينة وتتضمن `browser`.
- مسار ملف تنفيذي صالح للمتصفح.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome محليًا لملفات تعريف `existing-session` / `user`.

التوقيعات الشائعة:

- `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمّن بواسطة `plugins.allow`.
- أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → تستبعد `plugins.allow` قيمة `browser`، لذلك لم يتم تحميل Plugin مطلقًا.
- `Failed to start Chrome CDP on port` → فشلت عملية المتصفح في البدء.
- `browser.executablePath not found` → المسار المكوّن غير صالح.
- `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان CDP URL المكوّن مخططًا غير مدعوم مثل `file:` أو `ftp:`.
- `browser.cdpUrl has invalid port` → يحتوي CDP URL المكوّن على منفذ غير صالح أو خارج النطاق.
- `Could not find DevToolsActivePort for chrome` → لم يتمكن Chrome MCP existing-session من الإرفاق بدليل بيانات المتصفح المحدد بعد. افتح صفحة inspect للمتصفح، ومكّن التصحيح عن بُعد، وأبقِ المتصفح مفتوحًا، ووافق على أول مطالبة إرفاق، ثم أعد المحاولة. وإذا لم تكن هناك حاجة إلى حالة تسجيل الدخول، ففضّل ملف التعريف المُدار `openclaw`.
- `No Chrome tabs found for profile="user"` → لا توجد علامات تبويب Chrome محلية مفتوحة لملف تعريف الإرفاق الخاص بـ Chrome MCP.
- `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المكوّنة من مضيف gateway.
- `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف التعريف attach-only على هدف يمكن الوصول إليه، أو أن نقطة نهاية HTTP استجابت لكن تعذر فتح CDP WebSocket مع ذلك.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقد تثبيت gateway الحالي تبعية وقت التشغيل `playwright-core` الخاصة بـ Plugin المتصفح المضمّن؛ شغّل `openclaw doctor --fix`، ثم أعد تشغيل gateway. ولا تزال لقطات ARIA ولقطات الشاشة الأساسية للصفحات تعمل، لكن التنقل ولقطات AI ولقطات عناصر محددات CSS وتصدير PDF تظل غير متاحة.
- `fullPage is not supported for element screenshots` → جمع طلب لقطة الشاشة بين `--full-page` و`--ref` أو `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم نداءات لقطات الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من snapshot، وليس `--element` الخاص بـ CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات رفع الملفات في Chrome MCP إلى مراجع snapshot، وليس محددات CSS.
- `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء في ملفات تعريف Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات الحوارات في ملفات تعريف Chrome MCP تجاوزات timeout.
- `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` من `act:type` عند `profile="user"` / ملفات تعريف Chrome MCP existing-session، أو استخدم ملف تعريف متصفح مُدار/CDP عندما تكون هناك حاجة إلى timeout مخصص.
- `existing-session evaluate does not support timeoutMs overrides.` → احذف `timeoutMs` من `act:evaluate` عند `profile="user"` / ملفات تعريف Chrome MCP existing-session، أو استخدم ملف تعريف متصفح مُدار/CDP عندما تكون هناك حاجة إلى timeout مخصص.
- `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف raw CDP.
- تجاوزات قديمة لـ viewport / الوضع الداكن / اللغة / عدم الاتصال على ملفات تعريف attach-only أو CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP من دون إعادة تشغيل gateway بالكامل.

ذو صلة:

- [استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [المتصفح (مدار بواسطة OpenClaw)](/ar/tools/browser)

## إذا قمت بالترقية وتعطل شيء فجأة

معظم الأعطال بعد الترقية تكون بسبب انحراف الإعداد أو فرض إعدادات افتراضية أكثر صرامة الآن.

### 1) تغيّر سلوك تجاوز المصادقة وURL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

ما الذي يجب التحقق منه:

- إذا كانت `gateway.mode=remote`، فقد تستهدف نداءات CLI مضيفًا بعيدًا بينما تكون خدمتك المحلية سليمة.
- لا تعود نداءات `--url` الصريحة إلى بيانات الاعتماد المخزنة.

التوقيعات الشائعة:

- `gateway connect failed:` → هدف URL غير صحيح.
- `unauthorized` → يمكن الوصول إلى نقطة النهاية لكن المصادقة غير صحيحة.

### 2) أصبحت قيود الربط والمصادقة أكثر صرامة

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

ما الذي يجب التحقق منه:

- تحتاج الروابط غير loopback ‏(`lan` أو `tailnet` أو `custom`) إلى مسار مصادقة صالح لـ gateway: مصادقة برمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير loopback مكوّن بشكل صحيح.
- لا تحل المفاتيح القديمة مثل `gateway.token` محل `gateway.auth.token`.

التوقيعات الشائعة:

- `refusing to bind gateway ... without auth` → ربط غير loopback من دون مسار مصادقة صالح لـ gateway.
- `Connectivity probe: failed` بينما وقت التشغيل يعمل → gateway حية لكن يتعذر الوصول إليها بالمصادقة/URL الحاليين.

### 3) تغيّرت حالة الاقتران وهوية الجهاز

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

ما الذي يجب التحقق منه:

- موافقات أجهزة معلقة للوحة المعلومات/العقد.
- موافقات اقتران رسائل مباشرة معلقة بعد تغييرات السياسة أو الهوية.

التوقيعات الشائعة:

- `device identity required` → لم يتم استيفاء مصادقة الجهاز.
- `pairing required` → يجب اعتماد المرسل/الجهاز.

إذا ظل إعداد الخدمة ووقت التشغيل غير متطابقين بعد الفحوصات، فأعد تثبيت بيانات الخدمة الوصفية من دليل profile/state نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذو صلة:

- [الاقتران المملوك لـ Gateway](/ar/gateway/pairing)
- [المصادقة](/ar/gateway/authentication)
- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [Doctor](/ar/gateway/doctor)
- [الأسئلة الشائعة](/ar/help/faq)
