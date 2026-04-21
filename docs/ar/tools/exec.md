---
read_when:
    - استخدام أداة exec أو تعديلها
    - تصحيح سلوك stdin أو TTY
summary: استخدام أداة exec، وأوضاع stdin، ودعم TTY
title: أداة exec
x-i18n:
    generated_at: "2026-04-21T07:27:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# أداة exec

شغّل أوامر shell في مساحة العمل. تدعم التنفيذ في المقدمة + الخلفية عبر `process`.
إذا كان `process` غير مسموح، تعمل `exec` بشكل متزامن وتتجاهل `yieldMs`/`background`.
تكون جلسات الخلفية محددة النطاق لكل وكيل؛ ولا يرى `process` إلا الجلسات الخاصة بالوكيل نفسه.

## المعلمات

- `command` (مطلوب)
- `workdir` (القيمة الافتراضية هي cwd)
- `env` (تجاوزات key/value)
- `yieldMs` (الافتراضي 10000): التحويل التلقائي إلى الخلفية بعد تأخير
- `background` (منطقي): الخلفية فورًا
- `timeout` (بالثواني، الافتراضي 1800): القتل عند انتهاء المدة
- `pty` (منطقي): التشغيل في pseudo-terminal عند توفره (أدوات CLI التي تعمل فقط مع TTY، ووكلاء البرمجة، وواجهات terminal)
- `host` (`auto | sandbox | gateway | node`): مكان التنفيذ
- `security` (`deny | allowlist | full`): وضع الفرض لـ `gateway`/`node`
- `ask` (`off | on-miss | always`): مطالبات الموافقة لـ `gateway`/`node`
- `node` (سلسلة): معرّف/اسم node لـ `host=node`
- `elevated` (منطقي): طلب الوضع المرتفع (الخروج من sandbox إلى مسار المضيف المُهيأ)؛ ولا يُفرض `security=full` إلا عندما يُحل elevated إلى `full`

ملاحظات:

- القيمة الافتراضية لـ `host` هي `auto`: ‏sandbox عندما يكون وقت تشغيل sandbox نشطًا للجلسة، وإلا `gateway`.
- `auto` هي استراتيجية التوجيه الافتراضية، وليست wildcard. يُسمح باستدعاء `host=node` لكل طلب انطلاقًا من `auto`؛ ويُسمح باستدعاء `host=gateway` لكل طلب فقط عندما لا يكون أي وقت تشغيل sandbox نشطًا.
- من دون أي إعداد إضافي، يظل `host=auto` "يعمل ببساطة": من دون sandbox يُحل إلى `gateway`؛ ومع sandbox حي يظل داخل sandbox.
- يخرج `elevated` من sandbox إلى مسار المضيف المُهيأ: `gateway` افتراضيًا، أو `node` عندما يكون `tools.exec.host=node` (أو عندما تكون القيمة الافتراضية للجلسة هي `host=node`). ولا يكون متاحًا إلا عندما يكون الوصول المرتفع مفعّلًا للجلسة/المزوّد الحاليين.
- تتحكم `~/.openclaw/exec-approvals.json` في الموافقات الخاصة بـ `gateway`/`node`.
- يتطلب `node` وجود node مقترن (تطبيق مرافق أو مضيف node بدون واجهة).
- إذا كانت عدة nodes متاحة، فاضبط `exec.node` أو `tools.exec.node` لاختيار واحدة.
- إن `exec host=node` هو مسار تنفيذ shell الوحيد للعُقد؛ وقد أزيل الغلاف القديم `nodes.run`.
- على المضيفات غير Windows، تستخدم exec القيمة `SHELL` عند ضبطها؛ وإذا كانت `SHELL` هي `fish`، فإنها تفضّل `bash` (أو `sh`)
  من `PATH` لتجنب scripts غير المتوافقة مع fish، ثم تعود إلى `SHELL` إذا لم يوجد أي منهما.
- على مضيفات Windows، تفضّل exec اكتشاف PowerShell 7 ‏(`pwsh`) (Program Files ثم ProgramW6432 ثم PATH)،
  ثم تعود إلى Windows PowerShell 5.1.
- يرفض التنفيذ على المضيف (`gateway`/`node`) القيمة `env.PATH` وتجاوزات loader ‏(`LD_*`/`DYLD_*`) من أجل
  منع خطف الملفات الثنائية أو حقن الشيفرة.
- يضبط OpenClaw القيمة `OPENCLAW_SHELL=exec` في بيئة الأمر المُنشأ (بما في ذلك تنفيذ PTY وsandbox) حتى تتمكن قواعد shell/profile من اكتشاف سياق أداة exec.
- مهم: العزل **معطّل افتراضيًا**. إذا كان العزل معطّلًا، فإن `host=auto`
  الضمني يُحل إلى `gateway`. أما `host=sandbox` الصريح فيفشل مغلقًا بدلًا من التشغيل بصمت
  على مضيف gateway. فعّل العزل أو استخدم `host=gateway` مع الموافقات.
- لا تفحص فحوصات script preflight ‏(للأخطاء الشائعة في صياغة Python/Node shell) إلا الملفات الموجودة داخل
  حدود `workdir` الفعالة. وإذا كان مسار script يُحل خارج `workdir`، فيتم تخطي preflight لذلك
  الملف.
- بالنسبة إلى العمل طويل التشغيل الذي يبدأ الآن، ابدأه مرة واحدة واعتمد على
  تنبيه الإكمال التلقائي عندما يكون مفعّلًا ويُخرج الأمر بيانات أو يفشل.
  استخدم `process` للسجلات، أو الحالة، أو الإدخال، أو التدخل؛ ولا تحاكِ
  الجدولة باستخدام حلقات sleep، أو حلقات timeout، أو polling المتكرر.
- بالنسبة إلى العمل الذي يجب أن يحدث لاحقًا أو وفق جدول، استخدم Cron بدلًا من
  أنماط sleep/delay في `exec`.

## الإعداد

- `tools.exec.notifyOnExit` (الافتراضي: true): عندما تكون true، تدرج جلسات exec التي تعمل في الخلفية حدث نظام وتطلب Heartbeat عند الخروج.
- `tools.exec.approvalRunningNoticeMs` (الافتراضي: 10000): إصدار إشعار واحد "قيد التشغيل" عندما تستمر exec المحكومة بالموافقة أكثر من ذلك (0 للتعطيل).
- `tools.exec.host` (الافتراضي: `auto`; ويُحل إلى `sandbox` عندما يكون وقت تشغيل sandbox نشطًا، وإلى `gateway` خلاف ذلك)
- `tools.exec.security` (الافتراضي: `deny` لـ sandbox، و`full` لـ gateway + node عند عدم الضبط)
- `tools.exec.ask` (الافتراضي: `off`)
- إن تنفيذ المضيف من دون موافقة هو الوضع الافتراضي لـ gateway + node. إذا كنت تريد سلوك الموافقات/قائمة السماح، فشدّد كلًا من `tools.exec.*` وملف `~/.openclaw/exec-approvals.json` الخاص بالمضيف؛ راجع [Exec approvals](/ar/tools/exec-approvals#no-approval-yolo-mode).
- يأتي وضع YOLO من الإعدادات الافتراضية لسياسة المضيف (`security=full`, `ask=off`)، وليس من `host=auto`. إذا كنت تريد فرض التوجيه إلى gateway أو node، فاضبط `tools.exec.host` أو استخدم `/exec host=...`.
- في وضع `security=full` مع `ask=off`، يتبع تنفيذ المضيف السياسة المُهيأة مباشرة؛ ولا توجد طبقة إضافية من مرشح تمويه الأوامر الاستدلالي أو رفض script-preflight.
- `tools.exec.node` (الافتراضي: غير مضبوط)
- `tools.exec.strictInlineEval` (الافتراضي: false): عندما تكون true، فإن صيغ eval المضمّنة للمفسر مثل `python -c` و`node -e` و`ruby -e` و`perl -e` و`php -r` و`lua -e` و`osascript -e` تتطلب دائمًا موافقة صريحة. ويمكن أن يستمر `allow-always` في حفظ استدعاءات المفسر/script غير الضارة، لكن صيغ inline-eval تظل تطلب الموافقة في كل مرة.
- `tools.exec.pathPrepend`: قائمة بالأدلة التي تسبق `PATH` لتشغيلات exec ‏(gateway + sandbox فقط).
- `tools.exec.safeBins`: ملفات ثنائية آمنة تعمل عبر stdin فقط ويمكن تشغيلها من دون إدخالات صريحة في allowlist. لتفاصيل السلوك، راجع [Safe bins](/ar/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: أدلة صريحة إضافية موثوقة لفحوصات مسار الملفات التنفيذية الخاصة بـ `safeBins`. لا تُوثق إدخالات `PATH` تلقائيًا أبدًا. والقيم الافتراضية المدمجة هي `/bin` و`/usr/bin`.
- `tools.exec.safeBinProfiles`: سياسة argv مخصصة اختيارية لكل safe bin ‏(`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: يدمج `PATH` الخاص بـ login shell في بيئة exec. وتُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف. ومع ذلك، يعمل daemon نفسه باستخدام `PATH` بسيط:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: يشغّل `sh -lc` (login shell) داخل الحاوية، لذا قد يعيد `/etc/profile` ضبط `PATH`.
  يضيف OpenClaw القيمة `env.PATH` قبل الجميع بعد تحميل profile عبر متغير env داخلي (من دون shell interpolation)؛ كما ينطبق `tools.exec.pathPrepend` هنا أيضًا.
- `host=node`: تُرسل فقط تجاوزات env غير المحظورة التي تمررها إلى node. وتُرفض تجاوزات `env.PATH`
  لتنفيذ المضيف ويتم تجاهلها من قِبل مضيفات node. إذا كنت تحتاج إلى إدخالات PATH إضافية على node،
  فقم بتهيئة بيئة خدمة مضيف node ‏(systemd/launchd) أو ثبّت الأدوات في مواقع قياسية.

ربط node لكل وكيل (استخدم فهرس قائمة الوكيل في الإعداد):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

واجهة التحكم: تتضمن علامة تبويب Nodes لوحة صغيرة بعنوان “Exec node binding” للإعدادات نفسها.

## تجاوزات الجلسة (`/exec`)

استخدم `/exec` لتعيين القيم الافتراضية **لكل جلسة** الخاصة بـ `host` و`security` و`ask` و`node`.
أرسل `/exec` من دون وسائط لعرض القيم الحالية.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## نموذج التفويض

لا يُحترم `/exec` إلا للـ **مرسلين المخولين** (قوائم السماح/الاقتران الخاصة بالقناة بالإضافة إلى `commands.useAccessGroups`).
وهو يحدّث **حالة الجلسة فقط** ولا يكتب الإعداد. ولتعطيل exec تعطيلًا صارمًا، امنعه عبر
سياسة الأداة (`tools.deny: ["exec"]` أو لكل وكيل). ولا تزال موافقات المضيف تنطبق ما لم تضبط
صراحةً `security=full` و`ask=off`.

## Exec approvals ‏(التطبيق المرافق / مضيف node)

يمكن للوكلاء المعزولين أن يطلبوا موافقة لكل طلب قبل تشغيل `exec` على مضيف gateway أو node.
راجع [Exec approvals](/ar/tools/exec-approvals) لمعرفة السياسة وقائمة السماح وتدفق واجهة المستخدم.

عندما تكون الموافقات مطلوبة، تعود أداة exec فورًا مع
`status: "approval-pending"` ومعرّف موافقة. وبعد الموافقة (أو الرفض / انتهاء المهلة)،
يبعث Gateway أحداث نظام (`Exec finished` / `Exec denied`). وإذا ظل الأمر
قيد التشغيل بعد `tools.exec.approvalRunningNoticeMs`، يُبعث إشعار واحد `Exec running`.
وفي القنوات التي تحتوي على بطاقات/أزرار موافقة أصلية، يجب على الوكيل الاعتماد على
واجهة المستخدم الأصلية تلك أولًا وعدم تضمين أمر `/approve` يدوي إلا عندما
تقول نتيجة الأداة صراحة إن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي
المسار الوحيد.

## قائمة السماح + safe bins

يطابق فرض allowlist اليدوي **مسارات الملفات الثنائية المحلولة فقط** (من دون مطابقة basename). عندما
تكون `security=allowlist`، تُسمح أوامر shell تلقائيًا فقط إذا كان كل جزء من أجزاء pipeline
موجودًا في allowlist أو كان safe bin. أما chaining ‏(`;`, `&&`, `||`) وعمليات redirection فتُرفض في
وضع allowlist ما لم يستوفِ كل جزء من المستوى الأعلى allowlist ‏(بما في ذلك safe bins).
ولا تزال redirections غير مدعومة.
ولا تتجاوز الثقة الدائمة `allow-always` هذه القاعدة: إذ لا يزال الأمر المتسلسل يتطلب أن يطابق كل
جزء من المستوى الأعلى.

يُعد `autoAllowSkills` مسار راحة منفصلًا في exec approvals. وهو ليس الشيء نفسه مثل
إدخالات allowlist اليدوية للمسارات. وللحصول على ثقة صريحة صارمة، أبقِ `autoAllowSkills` معطلًا.

استخدم خياري التحكم لهاتين الوظيفتين المختلفتين:

- `tools.exec.safeBins`: مرشحات تدفق صغيرة تعمل عبر stdin فقط.
- `tools.exec.safeBinTrustedDirs`: أدلة إضافية صريحة موثوقة لمسارات الملفات التنفيذية الخاصة بـ safe-bin.
- `tools.exec.safeBinProfiles`: سياسة argv صريحة لـ safe bins المخصصة.
- allowlist: ثقة صريحة لمسارات الملفات التنفيذية.

لا تتعامل مع `safeBins` باعتباره allowlist عامة، ولا تضف ملفات ثنائية للمفسرات/أوقات التشغيل (مثل `python3` أو `node` أو `ruby` أو `bash`). إذا كنت تحتاج إليها، فاستخدم إدخالات allowlist صريحة وأبقِ مطالبات الموافقة مفعلة.
يحذّر `openclaw security audit` عندما تفتقد إدخالات `safeBins` الخاصة بالمفسرات/أوقات التشغيل إلى profiles صريحة، ويمكن لـ `openclaw doctor --fix` إعداد إدخالات `safeBinProfiles` المخصصة المفقودة.
كما يحذّر `openclaw security audit` و`openclaw doctor` عندما تضيف صراحةً ملفات ثنائية ذات سلوك واسع مثل `jq` مجددًا إلى `safeBins`.
وإذا سمحت صراحةً بالمفسرات عبر allowlist، ففعّل `tools.exec.strictInlineEval` بحيث تظل صيغ eval المضمنة تتطلب موافقة جديدة.

للحصول على تفاصيل السياسة الكاملة والأمثلة، راجع [Exec approvals](/ar/tools/exec-approvals#safe-bins-stdin-only) و[Safe bins versus allowlist](/ar/tools/exec-approvals#safe-bins-versus-allowlist).

## أمثلة

المقدمة:

```json
{ "tool": "exec", "command": "ls -la" }
```

الخلفية + polling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

إن polling مخصص للحالة عند الطلب، وليس لحلقات الانتظار. وإذا كان تنبيه
الإكمال التلقائي مفعّلًا، فيمكن للأمر تنبيه الجلسة عندما يُخرج بيانات أو يفشل.

إرسال مفاتيح (بأسلوب tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

إرسال submit ‏(إرسال CR فقط):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

اللصق (محاطًا بأقواس افتراضيًا):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

يُعد `apply_patch` أداة فرعية من `exec` للتعديلات المنظمة متعددة الملفات.
وهو مفعّل افتراضيًا لنماذج OpenAI وOpenAI Codex. استخدم الإعداد فقط
عندما تريد تعطيله أو قصره على نماذج محددة:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

ملاحظات:

- متاحة فقط لنماذج OpenAI/OpenAI Codex.
- لا تزال سياسة الأداة تنطبق؛ و`allow: ["write"]` تسمح ضمنيًا بـ `apply_patch`.
- يوجد الإعداد ضمن `tools.exec.applyPatch`.
- تكون القيمة الافتراضية لـ `tools.exec.applyPatch.enabled` هي `true`؛ اضبطها على `false` لتعطيل الأداة لنماذج OpenAI.
- تكون القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (مقيدة بمساحة العمل). اضبطها على `false` فقط إذا كنت تريد عمدًا أن تكتب `apply_patch` أو تحذف خارج دليل مساحة العمل.

## ذو صلة

- [Exec Approvals](/ar/tools/exec-approvals) — بوابات الموافقة لأوامر shell
- [Sandboxing](/ar/gateway/sandboxing) — تشغيل الأوامر في بيئات sandbox معزولة
- [Background Process](/ar/gateway/background-process) — العمليات طويلة التشغيل الخاصة بـ exec وأداة process
- [الأمان](/ar/gateway/security) — سياسة الأداة والوصول المرتفع
