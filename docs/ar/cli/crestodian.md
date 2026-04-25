---
read_when:
    - تشغّل openclaw من دون أي أمر وتريد فهم Crestodian
    - تحتاج إلى طريقة آمنة من دون إعدادات مسبقة لفحص OpenClaw أو إصلاحه
    - أنت تصمّم أو تفعّل وضع الإنقاذ لقنوات الرسائل
summary: مرجع CLI ونموذج الأمان لـ Crestodian، أداة الإعداد والإصلاح الآمنة من دون إعدادات مسبقة
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian هو مساعد OpenClaw المحلي للإعداد والإصلاح والتكوين. وقد صُمم
ليظل متاحًا عندما يتعطل المسار الطبيعي للوكيل.

يؤدي تشغيل `openclaw` من دون أي أمر إلى بدء Crestodian في طرفية تفاعلية.
ويؤدي تشغيل `openclaw crestodian` إلى بدء المساعد نفسه بشكل صريح.

## ما الذي يعرضه Crestodian

عند بدء التشغيل، يفتح Crestodian التفاعلي غلاف TUI نفسه المستخدم بواسطة
`openclaw tui`، ولكن مع خلفية دردشة Crestodian. ويبدأ سجل الدردشة بتحية
قصيرة تتضمن:

- متى يجب بدء Crestodian
- النموذج أو مسار المخطط الحتمي الذي يستخدمه Crestodian فعليًا
- صلاحية الإعداد والوكيل الافتراضي
- إمكانية الوصول إلى Gateway من أول فحص عند بدء التشغيل
- إجراء التصحيح التالي الذي يمكن لـ Crestodian اتخاذه

لا يقوم بعرض الأسرار أو بتحميل أوامر CLI الخاصة بالـ Plugin فقط من أجل
البدء. ولا يزال TUI يوفر الرأس المعتاد وسجل الدردشة وسطر الحالة والتذييل
والإكمال التلقائي وعناصر تحكم المحرر.

استخدم `status` للحصول على الجرد المفصل الذي يتضمن مسار الإعداد
ومسارات docs/source وعمليات فحص CLI المحلية ووجود مفتاح API
والوكلاء والنموذج وتفاصيل Gateway.

يستخدم Crestodian آلية اكتشاف مراجع OpenClaw نفسها التي تستخدمها الوكلاء العاديون. في نسخة Git checkout،
يقوم بتوجيه نفسه إلى `docs/` المحلي وإلى شجرة المصدر المحلية. وفي تثبيت حزمة npm،
يستخدم docs المضمّنة مع الحزمة ويربط إلى
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)، مع
إرشاد صريح لمراجعة المصدر كلما لم تكن docs كافية.

## أمثلة

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

داخل TUI الخاص بـ Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## بدء تشغيل آمن

تم تقليص مسار بدء تشغيل Crestodian عمدًا. ويمكنه العمل عندما:

- يكون `openclaw.json` مفقودًا
- يكون `openclaw.json` غير صالح
- تكون Gateway متوقفة
- يكون تسجيل أوامر Plugin غير متاح
- لم يتم تكوين أي وكيل بعد

لا يزال كل من `openclaw --help` و`openclaw --version` يستخدمان المسارات
السريعة العادية. ويخرج `openclaw` غير التفاعلي برسالة قصيرة بدلًا من طباعة
مساعدة الجذر، لأن المنتج عند التشغيل بلا أمر هو Crestodian.

## العمليات والموافقة

يستخدم Crestodian عمليات مكتوبة بدلًا من تعديل الإعداد بشكل مخصص.

يمكن تشغيل العمليات للقراءة فقط فورًا:

- عرض نظرة عامة
- سرد الوكلاء
- عرض حالة النموذج/الواجهة الخلفية
- تشغيل فحوصات الحالة أو الصحة
- التحقق من إمكانية الوصول إلى Gateway
- تشغيل doctor من دون إصلاحات تفاعلية
- التحقق من صحة الإعداد
- عرض مسار سجل التدقيق

تتطلب العمليات الدائمة موافقة ضمن المحادثة في الوضع التفاعلي إلا
إذا مررت `--yes` لأمر مباشر:

- كتابة الإعداد
- تشغيل `config set`
- تعيين قيم SecretRef المدعومة عبر `config set-ref`
- تشغيل bootstrap الخاص بالإعداد/التهيئة الأولية
- تغيير النموذج الافتراضي
- بدء Gateway أو إيقافها أو إعادة تشغيلها
- إنشاء الوكلاء
- تشغيل إصلاحات doctor التي تعيد كتابة الإعداد أو الحالة

يتم تسجيل عمليات الكتابة المطبقة في:

```text
~/.openclaw/audit/crestodian.jsonl
```

لا يتم تدقيق الاكتشاف. يتم تسجيل العمليات والكتابات المطبقة فقط.

يؤدي `openclaw onboard --modern` إلى بدء Crestodian كمعاينة الإعداد الأولي الحديثة.
أما `openclaw onboard` العادي فلا يزال يشغّل الإعداد الأولي الكلاسيكي.

## Bootstrap الإعداد

`setup` هو bootstrap للإعداد الأولي المعتمد على الدردشة أولًا. وهو يكتب فقط عبر
عمليات إعداد مكتوبة ويطلب الموافقة أولًا.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

عندما لا يكون هناك نموذج مُكوَّن، يختار setup أول واجهة خلفية قابلة للاستخدام
بهذا الترتيب ويخبرك بما اختاره:

- النموذج الصريح الحالي، إذا كان مُكوَّنًا بالفعل
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

إذا لم يكن أي منها متاحًا، فسيظل setup يكتب مساحة العمل الافتراضية ويترك
النموذج غير معيّن. ثبّت Codex/Claude Code أو سجّل الدخول إليهما، أو وفّر
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`، ثم شغّل setup مرة أخرى.

## المخطط المدعوم بالنموذج

يبدأ Crestodian دائمًا في الوضع الحتمي. وبالنسبة إلى الأوامر غير الدقيقة التي
لا يفهمها المحلل الحتمي، يمكن لـ Crestodian المحلي تنفيذ دورة تخطيط واحدة
محدودة عبر مسارات وقت تشغيل OpenClaw العادية. ويستخدم أولًا
نموذج OpenClaw المكوَّن. وإذا لم يكن أي نموذج مكوَّن صالحًا للاستخدام بعد،
فيمكنه الرجوع إلى أوقات التشغيل المحلية الموجودة بالفعل على الجهاز:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: ‏`openai/gpt-5.5` مع `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

لا يمكن للمخطط المدعوم بالنموذج تعديل الإعداد مباشرةً. بل يجب عليه ترجمة
الطلب إلى أحد أوامر Crestodian المكتوبة، ثم تُطبَّق قواعد الموافقة
والتدقيق العادية. ويطبع Crestodian النموذج الذي استخدمه والأمر المفسَّر
قبل أن ينفّذ أي شيء. تكون دورات المخطط الاحتياطية الخالية من الإعداد
مؤقتة، مع تعطيل الأدوات حيث يدعم وقت التشغيل ذلك، وتستخدم
مساحة عمل/جلسة مؤقتة.

لا يستخدم وضع إنقاذ قنوات الرسائل المخطط المدعوم بالنموذج. ويظل الإنقاذ
البعيد حتميًا حتى لا يمكن استخدام مسار الوكيل العادي المعطّل أو المخترق
كمحرر إعداد.

## التبديل إلى وكيل

استخدم محددًا بلغة طبيعية لمغادرة Crestodian وفتح TUI العادي:

```text
talk to agent
talk to work agent
switch to main agent
```

لا تزال الأوامر `openclaw tui` و`openclaw chat` و`openclaw terminal` تفتح
TUI الوكيل العادي مباشرةً. وهي لا تبدأ Crestodian.

بعد التبديل إلى TUI العادي، استخدم `/crestodian` للعودة إلى Crestodian.
ويمكنك تضمين طلب متابعة:

```text
/crestodian
/crestodian restart gateway
```

تترك عمليات تبديل الوكيل داخل TUI أثرًا يوضّح أن `/crestodian` متاح.

## وضع إنقاذ الرسائل

وضع إنقاذ الرسائل هو نقطة دخول Crestodian عبر قنوات الرسائل. وهو مخصص
لحالة يكون فيها وكيلك العادي متعطلًا، لكن قناة موثوقة مثل WhatsApp
لا تزال تتلقى الأوامر.

أمر النص المدعوم:

- `/crestodian <request>`

تدفق المشغل:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

يمكن أيضًا وضع إنشاء الوكلاء في قائمة الانتظار من الموجّه المحلي أو من وضع الإنقاذ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

وضع الإنقاذ البعيد هو سطح إداري. ويجب التعامل معه بوصفه إصلاح إعداد بعيد،
وليس بوصفه دردشة عادية.

عقد الأمان للإنقاذ البعيد:

- يتم تعطيله عندما يكون sandboxing نشطًا. وإذا كانت أي جلسة/وكيل داخل
  sandbox، فيجب على Crestodian رفض الإنقاذ البعيد وشرح أن إصلاح CLI المحلي
  مطلوب.
- الحالة الفعالة الافتراضية هي `auto`: اسمح بالإنقاذ البعيد فقط في تشغيل
  YOLO الموثوق، حيث يمتلك وقت التشغيل أصلًا صلاحية محلية غير معزولة.
- يتطلب هوية مالك صريحة. يجب ألا يقبل الإنقاذ قواعد مرسل wildcard،
  أو سياسة مجموعة مفتوحة، أو Webhooks غير موثقة، أو قنوات مجهولة.
- الرسائل المباشرة للمالك فقط افتراضيًا. ويتطلب إنقاذ المجموعة/القناة
  اشتراكًا صريحًا، ويجب رغم ذلك توجيه مطالبات الموافقة إلى رسالة المالك المباشرة.
- لا يمكن للإنقاذ البعيد فتح TUI المحلي أو التبديل إلى جلسة وكيل تفاعلية.
  استخدم `openclaw` المحلي لتسليم المهمة إلى وكيل.
- لا تزال الكتابات الدائمة تتطلب موافقة، حتى في وضع الإنقاذ.
- قم بتدقيق كل عملية إنقاذ مطبقة، بما في ذلك القناة والحساب والمرسل
  ومفتاح الجلسة والعملية وhash الإعداد قبل العملية وhash الإعداد بعدها.
- لا تعكس الأسرار مطلقًا. يجب أن يُبلغ فحص SecretRef عن التوفر، لا عن القيم.
- إذا كانت Gateway حية، ففضّل العمليات المكتوبة الخاصة بـ Gateway. وإذا كانت
  Gateway متوقفة، فاستخدم فقط سطح الإصلاح المحلي الأدنى الذي لا يعتمد على
  حلقة الوكيل العادية.

شكل الإعداد:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

يجب أن تقبل `enabled` ما يلي:

- `"auto"`: الافتراضي. اسمح فقط عندما يكون وقت التشغيل الفعال هو YOLO
  ويكون sandboxing متوقفًا.
- `false`: لا تسمح أبدًا بإنقاذ قنوات الرسائل.
- `true`: اسمح صراحةً بالإنقاذ عندما تنجح فحوصات المالك/القناة. ولا
  يجب أن يتجاوز هذا مع ذلك رفض sandboxing.

وضعية YOLO الافتراضية في `"auto"` هي:

- يتم حسم وضع sandbox إلى `off`
- يتم حسم `tools.exec.security` إلى `full`
- يتم حسم `tools.exec.ask` إلى `off`

تتم تغطية الإنقاذ البعيد بواسطة مسار Docker:

```bash
pnpm test:docker:crestodian-rescue
```

تتم تغطية آلية الرجوع إلى المخطط المحلي الخالي من الإعداد بواسطة:

```bash
pnpm test:docker:crestodian-planner
```

يتحقق اختبار smoke اختياري حي لسطح أوامر القناة من `/crestodian status` بالإضافة
إلى جولة موافقة دائمة ذهابًا وإيابًا عبر معالج الإنقاذ:

```bash
pnpm test:live:crestodian-rescue-channel
```

تتم تغطية عملية الإعداد الجديدة الخالية من الإعداد عبر Crestodian بواسطة:

```bash
pnpm test:docker:crestodian-first-run
```

يبدأ هذا المسار بدليل حالة فارغ، ويوجه `openclaw` العاري إلى Crestodian،
ويضبط النموذج الافتراضي، وينشئ وكيلًا إضافيًا، ويكوّن Discord عبر
تفعيل Plugin بالإضافة إلى SecretRef للرمز المميز، ويتحقق من صحة الإعداد،
ويفحص سجل التدقيق. ويحتوي QA Lab أيضًا على سيناريو مدعوم بالمستودع
للتدفق نفسه في Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Doctor](/ar/cli/doctor)
- [TUI](/ar/cli/tui)
- [Sandbox](/ar/cli/sandbox)
- [الأمان](/ar/cli/security)
