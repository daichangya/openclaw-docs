---
read_when:
    - استخدام أداة Exec أو تعديلها
    - تصحيح سلوك stdin أو TTY واستكشاف أخطائهما وإصلاحها
summary: استخدام أداة Exec، وأوضاع stdin، ودعم TTY
title: أداة Exec
x-i18n:
    generated_at: "2026-04-25T13:59:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

شغّل أوامر shell في مساحة العمل. يدعم التنفيذ في الواجهة الأمامية + الخلفية عبر `process`.
إذا كان `process` غير مسموح به، فإن `exec` يعمل بشكل متزامن ويتجاهل `yieldMs`/`background`.
جلسات الخلفية تكون ضمن نطاق كل عامل؛ ولا يرى `process` إلا الجلسات التابعة للعامل نفسه.

## المعلمات

<ParamField path="command" type="string" required>
أمر shell المطلوب تشغيله.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دليل العمل الخاص بالأمر.
</ParamField>

<ParamField path="env" type="object">
تجاوزات بيئة على شكل مفتاح/قيمة تُدمج فوق البيئة الموروثة.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
نقل الأمر تلقائيًا إلى الخلفية بعد هذا التأخير (بالملي ثانية).
</ParamField>

<ParamField path="background" type="boolean" default="false">
انقل الأمر إلى الخلفية فورًا بدلًا من الانتظار حتى `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
اقتل الأمر بعد هذا العدد من الثواني.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
شغّل في طرفية زائفة عند توفرها. استخدمه لأدوات CLI التي تتطلب TTY فقط، ووكلاء البرمجة، وواجهات الطرفية.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
مكان التنفيذ. تُحل القيمة `auto` إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطًا، وإلى `gateway` خلاف ذلك.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
وضع فرض القيود لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
سلوك مطالبة الموافقة لتنفيذ `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
معرّف/اسم Node عندما يكون `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
اطلب الوضع المرتفع — الهروب من sandbox إلى مسار المضيف المضبوط. لا يُفرض `security=full` إلا عندما يُحل elevated إلى `full`.
</ParamField>

ملاحظات:

- القيمة الافتراضية لـ `host` هي `auto`: sandbox عندما يكون وقت تشغيل sandbox نشطًا للجلسة، وإلا gateway.
- `auto` هي استراتيجية التوجيه الافتراضية، وليست wildcard. يُسمح بـ `host=node` لكل استدعاء انطلاقًا من `auto`؛ ويُسمح بـ `host=gateway` لكل استدعاء فقط عندما لا يكون وقت تشغيل sandbox نشطًا.
- من دون إعداد إضافي، يظل `host=auto` "يعمل ببساطة": إذا لم توجد sandbox فإنه يُحل إلى `gateway`؛ وإذا كانت sandbox حية فإنه يبقى داخل sandbox.
- يقوم `elevated` بالهروب من sandbox إلى مسار المضيف المضبوط: `gateway` افتراضيًا، أو `node` عندما يكون `tools.exec.host=node` (أو يكون الافتراضي للجلسة هو `host=node`). وهو متاح فقط عندما يكون الوصول المرتفع مفعّلًا للجلسة/المزوّد الحالي.
- تتحكم `~/.openclaw/exec-approvals.json` في موافقات `gateway`/`node`.
- يتطلب `node` Node مقترنًا (التطبيق المرافق أو مضيف Node بدون واجهة).
- إذا كانت هناك عدة Nodes متاحة، فاضبط `exec.node` أو `tools.exec.node` لاختيار إحداها.
- `exec host=node` هو مسار تنفيذ shell الوحيد لـ Nodes؛ وقد أُزيل الغلاف القديم `nodes.run`.
- على المضيفات غير Windows، يستخدم exec القيمة `SHELL` عندما تكون مضبوطة؛ وإذا كانت `SHELL` تساوي `fish`، فإنه يفضّل `bash` (أو `sh`)
  من `PATH` لتجنب السكربتات غير المتوافقة مع fish، ثم يعود إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفات Windows، يفضّل exec اكتشاف PowerShell 7 (`pwsh`) (ضمن Program Files وProgramW6432 ثم PATH)،
  ثم يعود إلى Windows PowerShell 5.1.
- يرفض تنفيذ المضيف (`gateway`/`node`) كلاً من `env.PATH` وتجاوزات المُحمّل (`LD_*`/`DYLD_*`) من أجل
  منع اختطاف الثنائيات أو حقن الشيفرة.
- يضبط OpenClaw المتغير `OPENCLAW_SHELL=exec` في بيئة الأمر المشغَّل (بما في ذلك PTY وتنفيذ sandbox) حتى تتمكن قواعد shell/profile من اكتشاف سياق أداة exec.
- مهم: يكون sandboxing **معطّلًا افتراضيًا**. إذا كان sandboxing معطلًا، فإن `host=auto`
  الضمني يُحل إلى `gateway`. بينما يفشل `host=sandbox` الصريح بشكل مغلق بدلًا من
  التشغيل بصمت على مضيف gateway. فعّل sandboxing أو استخدم `host=gateway` مع الموافقات.
- لا تفحص اختبارات preflight للسكربتات (للأخطاء الشائعة في صياغة shell الخاصة بـ Python/Node) إلا الملفات الموجودة داخل
  حدود `workdir` الفعّالة. إذا جرى حل مسار سكربت خارج `workdir`، فيُتخطى preflight لذلك
  الملف.
- بالنسبة إلى الأعمال طويلة التشغيل التي تبدأ الآن، ابدأها مرة واحدة واعتمد على
  تنبيه الإكمال التلقائي عند تفعيله وعندما يُخرج الأمر مخرجات أو يفشل.
  استخدم `process` للسجلات أو الحالة أو الإدخال أو التدخل؛ ولا تحاكِ
  الجدولة باستخدام حلقات sleep أو حلقات timeout أو الاستطلاع المتكرر.
- بالنسبة إلى الأعمال التي يجب أن تحدث لاحقًا أو وفق جدول، استخدم Cron بدلًا من
  أنماط sleep/delay في `exec`.

## الإعدادات

- `tools.exec.notifyOnExit` (الافتراضي: true): عند تفعيله، تدرج جلسات exec التي نُقلت إلى الخلفية حدث نظام وتطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): يُصدر إشعارًا واحدًا "قيد التشغيل" عندما يستمر exec الخاضع للموافقة لمدة أطول من هذا (0 يعطّل).
- `tools.exec.host` (الافتراضي: `auto`؛ ويُحل إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطًا، وإلا إلى `gateway`)
- `tools.exec.security` (الافتراضي: `deny` لـ sandbox، و`full` لـ gateway + node عندما لا يكون مضبوطًا)
- `tools.exec.ask` (الافتراضي: `off`)
- تنفيذ المضيف بلا موافقة هو الافتراضي لكل من gateway + node. إذا أردت سلوك الموافقات/قائمة السماح، فشدّد كلًا من `tools.exec.*` وسياسة المضيف في `~/.openclaw/exec-approvals.json`؛ راجع [موافقات Exec](/ar/tools/exec-approvals#no-approval-yolo-mode).
- يأتي وضع YOLO من القيم الافتراضية لسياسة المضيف (`security=full`, `ask=off`)، وليس من `host=auto`. إذا أردت فرض التوجيه إلى gateway أو node، فاضبط `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع exec على المضيف السياسة المضبوطة مباشرة؛ ولا توجد طبقة إضافية من الترشيح المسبق الاستدلالي لإخفاء الأوامر أو رفض preflight للسكربتات.
- `tools.exec.node` (الافتراضي: غير مضبوط)
- `tools.exec.strictInlineEval` (الافتراضي: false): عند تفعيله، تتطلب دائمًا صيغ eval المضمنة الخاصة بالمفسرات مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` موافقة صريحة. وما يزال بإمكان `allow-always` حفظ ثقة دائمة لاستدعاءات المفسر/السكربت غير الضارة، لكن صيغ inline-eval تظل تطلب الموافقة في كل مرة.
- `tools.exec.pathPrepend`: قائمة دلائل تُسبق إلى `PATH` أثناء تشغيل exec (لـ gateway + sandbox فقط).
- `tools.exec.safeBins`: ثنائيات آمنة تعتمد على stdin فقط ويمكن تشغيلها من دون إدخالات صريحة في قائمة السماح. راجع [Safe bins](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) لتفاصيل السلوك.
- `tools.exec.safeBinTrustedDirs`: دلائل صريحة إضافية موثوقة لفحوصات مسارات الملفات التنفيذية الخاصة بـ `safeBins`. لا تُوثق إدخالات `PATH` تلقائيًا أبدًا. والقيم الافتراضية المضمّنة هي `/bin` و`/usr/bin`.
- `tools.exec.safeBinProfiles`: سياسة argv مخصصة اختيارية لكل safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

مثال:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### التعامل مع PATH

- `host=gateway`: يدمج `PATH` الخاص بصدفة تسجيل الدخول لديك ضمن بيئة exec. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف. بينما يعمل daemon نفسه باستخدام `PATH` محدود:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: يشغّل `sh -lc` (صدفة تسجيل دخول) داخل الحاوية، لذا قد يعيد `/etc/profile` ضبط `PATH`.
  يسبق OpenClaw قيمة `env.PATH` بعد تحميل profile عبر متغير بيئة داخلي (من دون استيفاء shell)؛
  كما يطبَّق `tools.exec.pathPrepend` هنا أيضًا.
- `host=node`: لا تُرسل إلى Node إلا تجاوزات البيئة غير المحظورة التي تمرّرها. تُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف، ويتجاهلها مضيفو Node. إذا كنت بحاجة إلى إدخالات PATH إضافية على Node،
  فاضبط بيئة خدمة مضيف Node (systemd/launchd) أو ثبّت الأدوات في مواقع قياسية.

ربط Node لكل عامل (استخدم فهرس قائمة العامل في الإعدادات):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: تتضمن علامة تبويب Nodes لوحة صغيرة باسم “Exec node binding” للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لضبط القيم الافتراضية **لكل جلسة** لـ `host` و`security` و`ask` و`node`.
أرسل `/exec` من دون وسيطات لعرض القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التفويض

لا يُحترم `/exec` إلا للمرسلين **المصرَّح لهم** (قوائم السماح/الإقران الخاصة بالقنوات مع `commands.useAccessGroups`).
وهو يحدّث **حالة الجلسة فقط** ولا يكتب إلى الإعدادات. لتعطيل exec بشكل كامل، امنعه عبر
سياسة الأداة (`tools.deny: ["exec"]` أو على مستوى كل عامل). وما تزال موافقات المضيف تُطبق ما لم تضبط
صراحةً `security=full` و`ask=off`.

## موافقات Exec (التطبيق المرافق / مضيف Node)

يمكن للوكلاء ضمن sandbox أن يطلبوا موافقة لكل طلب قبل أن يعمل `exec` على مضيف gateway أو node.
راجع [موافقات Exec](/ar/tools/exec-approvals) للاطلاع على السياسة وقائمة السماح وتدفق واجهة المستخدم.

عندما تكون الموافقات مطلوبة، تعيد أداة exec فورًا
`status: "approval-pending"` ومعرّف موافقة. وبعد الموافقة (أو الرفض / انتهاء المهلة)،
يصدر Gateway أحداث نظام (`Exec finished` / `Exec denied`). وإذا كان الأمر ما يزال
قيد التشغيل بعد `tools.exec.approvalRunningNoticeMs`، فيصدر إشعارًا واحدًا `Exec running`.
وعلى القنوات التي تتضمن بطاقات/أزرار موافقة أصلية، يجب على العامل أن يعتمد على
واجهة المستخدم الأصلية أولًا وألا يضيف أمر `/approve` يدوي إلا عندما
تذكر نتيجة الأداة صراحةً أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي
المسار الوحيد.

## قائمة السماح + safe bins

يطابق فرض قائمة السماح اليدوية glob لمسارات الملفات التنفيذية المحلولة وglob لأسماء الأوامر المجردة.
وتطابق الأسماء المجردة فقط الأوامر المستدعاة عبر PATH، لذا يمكن لـ `rg` أن يطابق
`/opt/homebrew/bin/rg` عندما يكون الأمر هو `rg`، ولكن ليس `./rg` أو `/tmp/rg`.
وعندما يكون `security=allowlist`، لا تُسمح أوامر shell تلقائيًا إلا إذا كان كل مقطع في pipeline
موجودًا في قائمة السماح أو كان safe bin. كما تُرفض السلاسل (`;`, `&&`, `||`) وعمليات إعادة التوجيه
في وضع allowlist إلا إذا حقق كل مقطع من المستوى الأعلى
قائمة السماح (بما في ذلك safe bins). وما تزال عمليات إعادة التوجيه غير مدعومة.
الثقة الدائمة عبر `allow-always` لا تتجاوز هذه القاعدة: فالأمر المتسلسل يظل يتطلب مطابقة كل
مقطع من المستوى الأعلى.

`autoAllowSkills` هو مسار تسهيلي منفصل ضمن موافقات exec. وهو ليس مثل
إدخالات قائمة السماح اليدوية للمسارات. وللحفاظ على ثقة صريحة صارمة، أبقِ `autoAllowSkills` معطلًا.

استخدم أداتي التحكم هاتين لوظيفتين مختلفتين:

- `tools.exec.safeBins`: مرشحات تدفق صغيرة تعتمد على stdin فقط.
- `tools.exec.safeBinTrustedDirs`: دلائل صريحة إضافية موثوقة لمسارات الملفات التنفيذية الخاصة بـ safe-bin.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة لـ safe bins مخصصة.
- قائمة السماح: ثقة صريحة لمسارات الملفات التنفيذية.

لا تعامل `safeBins` على أنها قائمة سماح عامة، ولا تضف ثنائيات المفسرات/بيئات التشغيل (مثل `python3` أو `node` أو `ruby` أو `bash`). إذا احتجت إليها، فاستخدم إدخالات صريحة في قائمة السماح وأبقِ مطالبات الموافقة مفعّلة.
يحذر `openclaw security audit` عندما تفتقر إدخالات `safeBins` الخاصة بالمفسرات/بيئات التشغيل إلى ملفات تعريف صريحة، ويمكن لـ `openclaw doctor --fix` إنشاء إدخالات `safeBinProfiles` المخصصة المفقودة.
كما يحذر `openclaw security audit` و`openclaw doctor` أيضًا عندما تضيف صراحةً ملفات تشغيل ذات سلوك واسع مثل `jq` مرة أخرى إلى `safeBins`.
وإذا أضفت المفسرات صراحةً إلى قائمة السماح، ففعّل `tools.exec.strictInlineEval` حتى تظل صيغ تقييم الشيفرة المضمنة تتطلب موافقة جديدة.

للتفاصيل الكاملة للسياسة والأمثلة، راجع [موافقات Exec](/ar/tools/exec-approvals-advanced#safe-bins-stdin-only) و[Safe bins مقابل قائمة السماح](/ar/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## أمثلة

الواجهة الأمامية:

```json
{ "tool": "exec", "command": "ls -la" }
```

الخلفية + الاستطلاع:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

الاستطلاع مخصص للحالة عند الطلب، وليس حلقات الانتظار. وإذا كان تنبيه الإكمال التلقائي
مفعّلًا، فيمكن للأمر إيقاظ الجلسة عندما يُخرج مخرجات أو يفشل.

إرسال المفاتيح (على نمط tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

إرسال (إرسال CR فقط):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

لصق (بين أقواس bracketed افتراضيًا):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` أداة فرعية من `exec` من أجل التعديلات المنظمة متعددة الملفات.
وهي مفعّلة افتراضيًا لنماذج OpenAI وOpenAI Codex. استخدم الإعدادات فقط
عندما تريد تعطيلها أو قصرها على نماذج محددة:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

ملاحظات:

- متاحة فقط لنماذج OpenAI/OpenAI Codex.
- ما تزال سياسة الأداة مطبقة؛ إذ إن `allow: ["write"]` يسمح ضمنيًا بـ `apply_patch`.
- توجد الإعدادات تحت `tools.exec.applyPatch`.
- القيمة الافتراضية لـ `tools.exec.applyPatch.enabled` هي `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محتواة داخل مساحة العمل). اضبطها على `false` فقط إذا كنت تقصد عمدًا أن يقوم `apply_patch` بالكتابة/الحذف خارج دليل مساحة العمل.

## ذو صلة

- [موافقات Exec](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر shell
- [Sandboxing](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات معزولة
- [العملية الخلفية](/ar/gateway/background-process) — exec طويل التشغيل وأداة process
- [الأمان](/ar/gateway/security) — سياسة الأداة والوصول المرتفع
