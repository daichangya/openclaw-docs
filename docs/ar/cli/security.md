---
read_when:
    - تريد تشغيل تدقيق أمني سريع على الإعدادات/الحالة
    - تريد تطبيق اقتراحات «الإصلاح» الآمنة (الأذونات، وتشديد الإعدادات الافتراضية)
summary: مرجع CLI لـ `openclaw security` (تدقيق ومعالجة الثغرات الأمنية الشائعة)
title: الأمان
x-i18n:
    generated_at: "2026-04-23T07:23:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

أدوات الأمان (تدقيق + إصلاحات اختيارية).

ذو صلة:

- دليل الأمان: [الأمان](/ar/gateway/security)

## التدقيق

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

يحذر التدقيق عندما يشارك عدة مرسلين للرسائل الخاصة الجلسة الرئيسية ويوصي بـ **وضع الرسائل الخاصة الآمن**: `session.dmScope="per-channel-peer"` (أو `per-account-channel-peer` للقنوات متعددة الحسابات) لصناديق الوارد المشتركة.
هذا مخصص لتقوية صناديق الوارد التعاونية/المشتركة. لا يُعد إعداد Gateway واحد مشترك بين مشغلين غير موثوقين ببعضهم أو متعارضين إعدادًا موصى به؛ افصل حدود الثقة باستخدام بوابات منفصلة (أو مستخدمي نظام تشغيل/مضيفين منفصلين).
كما يُصدر `security.trust_model.multi_user_heuristic` عندما تشير الإعدادات إلى احتمال وجود إدخال مشترك بين مستخدمين (على سبيل المثال سياسة رسائل خاصة/مجموعات مفتوحة، أو أهداف مجموعات مُعدّة، أو قواعد مرسلين شاملة)، ويذكرك بأن نموذج الثقة في OpenClaw هو افتراضيًا نموذج مساعد شخصي.
وبالنسبة إلى الإعدادات المشتركة المتعمدة بين مستخدمين، فإن إرشادات التدقيق توصي بعزل جميع الجلسات، والإبقاء على وصول نظام الملفات ضمن نطاق مساحة العمل، وإبعاد الهويات أو بيانات الاعتماد الشخصية/الخاصة عن بيئة التشغيل تلك.
كما يحذر أيضًا عند استخدام نماذج صغيرة (`<=300B`) من دون sandbox ومع تمكين أدوات web/browser.
وبالنسبة إلى إدخال Webhook، فإنه يحذر عندما يعيد `hooks.token` استخدام رمز Gateway المميز، أو عندما يكون `hooks.token` قصيرًا، أو عندما يكون `hooks.path="/"`، أو عندما لا يكون `hooks.defaultSessionKey` معيّنًا، أو عندما تكون `hooks.allowedAgentIds` غير مقيّدة، أو عندما تكون تجاوزات `sessionKey` في الطلب مفعلة، أو عندما تكون التجاوزات مفعلة من دون `hooks.allowedSessionKeyPrefixes`.
كما يحذر أيضًا عندما تكون إعدادات sandbox Docker مُعدة بينما وضع sandbox متوقف، أو عندما يستخدم `gateway.nodes.denyCommands` إدخالات نمطية/غير معروفة غير فعالة (مطابقة دقيقة لأسماء أوامر node فقط، وليس ترشيح نص shell)، أو عندما يقوم `gateway.nodes.allowCommands` بتمكين أوامر node خطيرة صراحةً، أو عندما يتم تجاوز `tools.profile="minimal"` العام بواسطة ملفات تعريف أدوات الوكيل، أو عندما تكشف المجموعات المفتوحة أدوات وقت التشغيل/نظام الملفات من دون حواجز sandbox/مساحة العمل، أو عندما يمكن الوصول إلى أدوات Plugin المثبتة تحت سياسة أدوات متساهلة.
كما يضع علامة على `gateway.allowRealIpFallback=true` (خطر تزوير الترويسات إذا كانت الوكلاء معرّفة بشكل خاطئ) و`discovery.mdns.mode="full"` (تسرب بيانات وصفية عبر سجلات mDNS TXT).
كما يحذر أيضًا عندما يستخدم متصفح sandbox شبكة Docker من نوع `bridge` من دون `sandbox.browser.cdpSourceRange`.
كما يضع علامة أيضًا على أوضاع شبكات sandbox Docker الخطيرة (بما في ذلك `host` وعمليات الانضمام إلى namespace من نوع `container:*`).
كما يحذر أيضًا عندما تحتوي حاويات Docker الحالية الخاصة بمتصفح sandbox على تسميات hash مفقودة/قديمة (على سبيل المثال الحاويات السابقة للترحيل التي تفتقد `openclaw.browserConfigEpoch`) ويوصي باستخدام `openclaw sandbox recreate --browser --all`.
كما يحذر أيضًا عندما تكون سجلات تثبيت Plugin/hook المعتمدة على npm غير مثبتة بالإصدار، أو تفتقد بيانات integrity الوصفية، أو تنحرف عن إصدارات الحزم المثبتة حاليًا.
ويحذر عندما تعتمد قوائم السماح الخاصة بالقنوات على أسماء/بريد إلكتروني/وسوم قابلة للتغيير بدلًا من المعرّفات الثابتة (Discord وSlack وGoogle Chat وMicrosoft Teams وMattermost ونطاقات IRC عند الاقتضاء).
ويحذر عندما يترك `gateway.auth.mode="none"` واجهات HTTP API الخاصة بـ Gateway قابلة للوصول من دون سر مشترك (`/tools/invoke` بالإضافة إلى أي نقطة نهاية `/v1/*` مفعلة).
الإعدادات ذات البادئة `dangerous`/`dangerously` هي تجاوزات صريحة للمشغل في حالات الطوارئ؛ وتمكين أحدها لا يُعد، بحد ذاته، تقرير ثغرة أمنية.
وللحصول على الجرد الكامل للمعاملات الخطيرة، راجع قسم "ملخص الأعلام غير الآمنة أو الخطيرة" في [الأمان](/ar/gateway/security).

سلوك SecretRef:

- يقوم `security audit` بحل قيم SecretRef المدعومة في وضع القراءة فقط للمسارات المستهدفة.
- إذا لم تكن قيمة SecretRef متاحة في مسار الأمر الحالي، يستمر التدقيق ويبلغ عن `secretDiagnostics` (بدلًا من التعطل).
- لا تقوم `--token` و`--password` إلا بتجاوز تفويض الفحص العميق لهذا الاستدعاء من الأمر؛ ولا تعيدان كتابة الإعدادات أو تعيينات SecretRef.

## خرج JSON

استخدم `--json` لعمليات CI/فحوصات السياسة:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

إذا تم الجمع بين `--fix` و`--json`، فسيشمل الخرج كلاً من إجراءات الإصلاح والتقرير النهائي:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## ما الذي يغيره `--fix`

يطبق `--fix` معالجات آمنة وحتمية:

- يبدّل `groupPolicy="open"` الشائع إلى `groupPolicy="allowlist"` (بما في ذلك متغيرات الحسابات في القنوات المدعومة)
- عند تبديل سياسة مجموعات WhatsApp إلى `allowlist`، فإنه يزرع `groupAllowFrom` من
  ملف `allowFrom` المخزن عندما تكون هذه القائمة موجودة ولا تكون الإعدادات قد
  عرّفت `allowFrom` بالفعل
- يضبط `logging.redactSensitive` من `"off"` إلى `"tools"`
- يشدّد الأذونات لملفات الحالة/الإعدادات والملفات الحساسة الشائعة
  (`credentials/*.json` و`auth-profiles.json` و`sessions.json` وملفات الجلسات
  `*.jsonl`)
- كما يشدّد ملفات تضمين الإعدادات المشار إليها من `openclaw.json`
- يستخدم `chmod` على مضيفات POSIX وعمليات إعادة تعيين `icacls` على Windows

لا يقوم `--fix` بما يلي:

- تدوير الرموز المميزة/كلمات المرور/مفاتيح API
- تعطيل الأدوات (`gateway` و`cron` و`exec` وما إلى ذلك)
- تغيير خيارات الربط/التفويض/تعريض الشبكة الخاصة بـ gateway
- إزالة أو إعادة كتابة Plugins/Skills
