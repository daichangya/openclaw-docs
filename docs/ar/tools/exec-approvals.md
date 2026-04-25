---
read_when:
    - تهيئة موافقات exec أو قوائم السماح
    - تنفيذ تجربة مستخدم موافقة exec في تطبيق macOS
    - مراجعة مطالبات الخروج من sandbox وآثارها
summary: موافقات exec، وقوائم السماح، ومطالبات الخروج من sandbox
title: موافقات exec
x-i18n:
    generated_at: "2026-04-25T13:59:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

موافقات exec هي **وسيلة الحماية في التطبيق المرافق / مضيف Node** للسماح لـ
وكيل يعمل داخل sandbox بتنفيذ أوامر على مضيف حقيقي (`gateway` أو `node`). وهي
تعشيق أمان: لا يُسمح بالأوامر إلا عندما تتفق السياسة + قائمة السماح + (اختياريًا) موافقة المستخدم جميعًا. وتتراكم موافقات exec **فوق** سياسة الأداة وحجب elevated (ما لم يتم ضبط elevated على `full`، إذ يتخطى ذلك الموافقات).

<Note>
السياسة الفعالة هي **الأكثر تقييدًا** بين `tools.exec.*` وافتراضيات approvals؛
وإذا حُذف حقل من حقول approvals، تُستخدم قيمة `tools.exec`. كما يستخدم exec على المضيف
حالة approvals المحلية على ذلك الجهاز — إذ إن قيمة `ask: "always"` المحلية على المضيف في `~/.openclaw/exec-approvals.json` تبقي المطالبات ظاهرة حتى لو
طلبت افتراضيات الجلسة أو التهيئة القيمة `ask: "on-miss"`.
</Note>

## فحص السياسة الفعالة

- `openclaw approvals get` و`... --gateway` و`... --node <id|name|ip>` — تعرض السياسة المطلوبة، ومصادر سياسة المضيف، والنتيجة الفعالة.
- `openclaw exec-policy show` — العرض المدمج للجهاز المحلي.
- `openclaw exec-policy set|preset` — مزامنة السياسة المطلوبة محليًا مع ملف approvals الخاص بالمضيف المحلي في خطوة واحدة.

عندما يطلب نطاق محلي `host=node`، فإن `exec-policy show` يبلغ عن هذا النطاق
على أنه مُدار من قبل node أثناء runtime بدلًا من الادعاء بأن ملف approvals المحلي هو مصدر الحقيقة.

إذا كانت واجهة التطبيق المرافق **غير متاحة**، فإن أي طلب كان من المفترض أن
يؤدي إلى مطالبة يُحسم بواسطة **ask fallback** (الافتراضي: deny).

<Tip>
يمكن لعملاء الموافقة الأصليين في الدردشة زرع وسائل تفاعل خاصة بالقناة على
رسالة الموافقة المعلقة. فعلى سبيل المثال، تقوم Matrix بزرع اختصارات للتفاعلات (`✅`
للسماح مرة واحدة، و`❌` للرفض، و`♾️` للسماح دائمًا) مع الإبقاء على أوامر
`/approve ...` في الرسالة كخيار fallback.
</Tip>

## أين يُطبَّق

تُفرض موافقات exec محليًا على مضيف التنفيذ:

- **مضيف gateway** → عملية `openclaw` على جهاز gateway
- **مضيف node** → مشغّل node ‏(تطبيق macOS المرافق أو مضيف node بدون واجهة)

ملاحظة حول نموذج الثقة:

- يُعد المستدعون المصادق عليهم على Gateway مشغّلين موثوقين لتلك Gateway.
- تمدّ Nodes المقترنة قدرة المشغّل الموثوق هذه إلى مضيف node.
- تقلل موافقات exec من خطر التنفيذ العرضي، لكنها ليست حدًا للمصادقة لكل مستخدم.
- تربط التشغيلات المعتمدة على مضيف node سياق التنفيذ القياسي: cwd القياسي، وargv الدقيقة، وربط env
  عند وجوده، ومسار الملف التنفيذي المثبّت عند الاقتضاء.
- بالنسبة إلى البرامج النصية shell والاستدعاءات المباشرة لملفات المفسّر/runtime، يحاول OpenClaw أيضًا ربط
  مُعامِل ملف محلي ملموس واحد. وإذا تغيّر هذا الملف المرتبط بعد الموافقة ولكن قبل التنفيذ،
  فيُرفض التشغيل بدلًا من تنفيذ محتوى منحرف.
- هذا الربط للملفات هو جهد أفضل عمدًا، وليس نموذجًا دلاليًا كاملًا لكل
  مسار تحميل للمفسّرات وruntime. وإذا لم يتمكن وضع الموافقة من تحديد ملف محلي ملموس واحد
  لربطه بدقة، فإنه يرفض إصدار تشغيل مدعوم بالموافقة بدلًا من التظاهر بتغطية كاملة.

التقسيم على macOS:

- تقوم **خدمة مضيف node** بتمرير `system.run` إلى **تطبيق macOS** عبر IPC محلي.
- يقوم **تطبيق macOS** بفرض approvals + تنفيذ الأمر في سياق UI.

## الإعدادات والتخزين

توجد الموافقات في ملف JSON محلي على مضيف التنفيذ:

`~/.openclaw/exec-approvals.json`

مثال على schema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## وضع "YOLO" بدون موافقة

إذا كنت تريد أن يعمل exec على المضيف من دون مطالبات موافقة، فيجب أن تفتح **كلتا** طبقتي السياسة:

- سياسة exec المطلوبة في تهيئة OpenClaw ‏(`tools.exec.*`)
- سياسة approvals المحلية على المضيف في `~/.openclaw/exec-approvals.json`

وهذا هو الآن سلوك المضيف الافتراضي ما لم تقم بتشديده صراحةً:

- `tools.exec.security`: ‏`full` على `gateway`/`node`
- `tools.exec.ask`: ‏`off`
- `askFallback` على المضيف: ‏`full`

تمييز مهم:

- يختار `tools.exec.host=auto` مكان تشغيل exec: داخل sandbox عندما تكون متاحة، وإلا على gateway.
- يختار YOLO كيفية الموافقة على exec على المضيف: ‏`security=full` مع `ask=off`.
- يمكن للموفّرين المعتمدين على CLI والذين يعرّضون وضع أذونات غير تفاعلي خاص بهم اتباع هذه السياسة.
  تضيف Claude CLI القيمة `--permission-mode bypassPermissions` عندما تكون سياسة exec المطلوبة في OpenClaw
  هي YOLO. ويمكنك تجاوز سلوك backend هذا عبر معاملات Claude الصريحة تحت
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`، مثل
  `--permission-mode default` أو `acceptEdits` أو `bypassPermissions`.
- في وضع YOLO، لا يضيف OpenClaw بوابة موافقة منفصلة قائمة على heuristics لإخفاء الأوامر أو طبقة رفض script-preflight فوق سياسة exec على المضيف المهيأة.
- لا يجعل `auto` توجيه gateway تجاوزًا مجانيًا من جلسة داخل sandbox. ويُسمح بطلب `host=node` لكل استدعاء من `auto`، ولا يُسمح بـ `host=gateway` من `auto` إلا عندما لا تكون هناك runtime خاصة بـ sandbox نشطة. وإذا أردت افتراضيًا ثابتًا غير `auto`، فاضبط `tools.exec.host` أو استخدم `/exec host=...` صراحةً.

إذا أردت إعدادًا أكثر تحفظًا، فأعد تشديد أي من الطبقتين إلى `allowlist` / `on-miss`
أو `deny`.

إعداد "عدم المطالبة أبدًا" الدائم على مضيف gateway:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

ثم اضبط ملف approvals الخاص بالمضيف ليطابق ذلك:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

اختصار محلي للسياسة نفسها الخاصة بمضيف gateway على الجهاز الحالي:

```bash
openclaw exec-policy preset yolo
```

يحدّث هذا الاختصار المحلي كلا الأمرين:

- القيم المحلية `tools.exec.host/security/ask`
- افتراضيات `~/.openclaw/exec-approvals.json` المحلية

وهو محلي فقط عمدًا. وإذا كنت بحاجة إلى تغيير approvals الخاصة بمضيف gateway أو node
عن بُعد، فاستمر في استخدام `openclaw approvals set --gateway` أو
`openclaw approvals set --node <id|name|ip>`.

بالنسبة إلى مضيف node، طبّق ملف approvals نفسه على تلك node بدلًا من ذلك:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

قيد مهم محلي فقط:

- لا يقوم `openclaw exec-policy` بمزامنة approvals الخاصة بـ node
- يتم رفض `openclaw exec-policy set --host node`
- يتم جلب approvals الخاصة بـ exec على node من node أثناء runtime، لذلك يجب أن تستخدم التحديثات المستهدفة لـ node الأمر `openclaw approvals --node ...`

اختصار خاص بالجلسة فقط:

- يغيّر `/exec security=full ask=off` الجلسة الحالية فقط.
- يُعد `/elevated full` اختصارًا لكسر الزجاج في الطوارئ ويتخطى أيضًا موافقات exec لتلك الجلسة.

إذا بقي ملف approvals الخاص بالمضيف أكثر تقييدًا من التهيئة، فإن سياسة المضيف الأكثر تشددًا تظل هي الفائزة.

## مفاتيح السياسة

### الأمان (`exec.security`)

- **deny**: حظر جميع طلبات exec على المضيف.
- **allowlist**: السماح فقط بالأوامر الموجودة في allowlist.
- **full**: السماح بكل شيء (يكافئ elevated).

### السؤال (`exec.ask`)

- **off**: لا تطلب أبدًا.
- **on-miss**: اطلب فقط عندما لا توجد مطابقة في allowlist.
- **always**: اطلب عند كل أمر.
- لا يؤدي trust الدائم `allow-always` إلى كبت المطالبات عندما يكون وضع ask الفعّال هو `always`

### ask fallback ‏(`askFallback`)

إذا كانت المطالبة مطلوبة ولكن لا توجد واجهة UI قابلة للوصول، فإن fallback هي التي تقرر:

- **deny**: الحظر.
- **allowlist**: السماح فقط إذا وُجدت مطابقة في allowlist.
- **full**: السماح.

### تقوية eval للمفسّرات المضمّنة (`tools.exec.strictInlineEval`)

عندما تكون `tools.exec.strictInlineEval=true`، يتعامل OpenClaw مع صيغ eval للكود المضمّن على أنها لا تعمل إلا بالموافقة حتى لو كان ملف المفسّر التنفيذي نفسه موجودًا في allowlist.

أمثلة:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

وهذا دفاع إضافي في العمق بالنسبة إلى محمّلات المفسّرات التي لا تُربط
بوضوح إلى مُعامِل ملف واحد مستقر. وفي الوضع الصارم:

- لا تزال هذه الأوامر تحتاج إلى موافقة صريحة؛
- ولا يحتفظ `allow-always` تلقائيًا بإدخالات allowlist جديدة لها.

## Allowlist ‏(لكل وكيل)

تكون Allowlists **لكل وكيل**. وإذا كان هناك عدة وكلاء، فبدّل الوكيل الذي تقوم
بتحريره في تطبيق macOS. والأنماط هي مطابقات glob.
يمكن أن تكون الأنماط globs لمسارات ملفات تنفيذية محلولة أو globs لأسماء أوامر مجردة. والأسماء المجردة
تطابق فقط الأوامر المستدعاة عبر PATH، لذلك يمكن لـ `rg` أن يطابق `/opt/homebrew/bin/rg`
عندما يكون الأمر هو `rg`، ولكن ليس `./rg` أو `/tmp/rg`. استخدم glob للمسار عندما
تريد الوثوق في موقع ملف تنفيذي محدد.
ويتم ترحيل إدخالات `agents.default` القديمة إلى `agents.main` عند التحميل.
كما أن سلاسل shell مثل `echo ok && pwd` لا تزال تحتاج إلى أن يحقق كل مقطع من المستوى الأعلى قواعد allowlist.

أمثلة:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

يتتبع كل إدخال في allowlist ما يلي:

- **id**: UUID ثابت يُستخدم لهوية UI ‏(اختياري)
- **آخر استخدام** timestamp
- **آخر أمر مستخدم**
- **آخر مسار محلول**

## Auto-allow لـ Skills CLIs

عند تمكين **Auto-allow skill CLIs**، تُعامل الملفات التنفيذية المشار إليها بواسطة Skills المعروفة
على أنها موجودة في allowlist على nodes ‏(macOS node أو مضيف node بدون واجهة). ويستخدم هذا
`skills.bins` عبر Gateway RPC لجلب قائمة bin الخاصة بالـ skill. عطّل هذا إذا كنت تريد allowlists يدوية صارمة.

ملاحظات مهمة حول الثقة:

- هذه **allowlist مريحة ضمنية**، منفصلة عن إدخالات allowlist اليدوية الخاصة بالمسارات.
- وهي مخصصة لبيئات المشغّل الموثوقة حيث تقع Gateway وnode داخل حدود الثقة نفسها.
- وإذا كنت تتطلب ثقة صريحة صارمة، فأبقِ `autoAllowSkills: false` واستخدم إدخالات allowlist اليدوية الخاصة بالمسارات فقط.

## Safe bins وتمرير الموافقات

بالنسبة إلى safe bins ‏(المسار السريع المعتمد على stdin فقط)، وتفاصيل ربط المفسّر، وكيفية
تمرير مطالبات الموافقة إلى Slack/Discord/Telegram (أو تشغيلها كعملاء موافقة أصليين)، راجع [موافقات Exec — متقدم](/ar/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## التحرير عبر Control UI

استخدم بطاقة **Control UI → Nodes → Exec approvals** لتحرير القيم الافتراضية، وتجاوزات كل وكيل،
وقوائم allowlist. اختر نطاقًا (Defaults أو وكيلًا)، وعدّل السياسة،
وأضف/احذف أنماط allowlist، ثم **Save**. وتعرض UI بيانات **آخر استخدام**
لكل نمط حتى تتمكن من إبقاء القائمة مرتبة.

يختار محدد الهدف بين **Gateway** ‏(الموافقات المحلية) أو **Node**.
ويجب أن تعلن Nodes عن `system.execApprovals.get/set` ‏(تطبيق macOS أو مضيف node بدون واجهة).
وإذا لم تعلن node عن exec approvals بعد، فحرّر ملفها المحلي
`~/.openclaw/exec-approvals.json` مباشرةً.

CLI: يدعم `openclaw approvals` تحرير gateway أو node ‏(راجع [CLI الخاصة بالموافقات](/ar/cli/approvals)).

## تدفق الموافقة

عندما تكون المطالبة مطلوبة، تقوم gateway ببث `exec.approval.requested` إلى عملاء المشغّل.
وتقوم Control UI وتطبيق macOS بحل ذلك عبر `exec.approval.resolve`، ثم تقوم gateway بتمرير
الطلب المعتمد إلى مضيف node.

بالنسبة إلى `host=node`، تتضمن طلبات الموافقة حمولة `systemRunPlan` قياسية. وتستخدم gateway
هذه الخطة باعتبارها سياق الأمر/cwd/الجلسة الموثوق عند تمرير
طلبات `system.run` المعتمدة.

وهذا مهم بالنسبة إلى زمن موافقة async:

- يقوم مسار exec على node بتحضير خطة قياسية واحدة مسبقًا
- ويخزّن سجل الموافقة تلك الخطة وبيانات الربط الوصفية الخاصة بها
- وبمجرد الموافقة، يعيد استدعاء `system.run` النهائي المُمرَّر استخدام الخطة المخزنة
  بدلًا من الثقة في تعديلات المستدعي اللاحقة
- وإذا غيّر المستدعي `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بعد إنشاء طلب الموافقة، فإن gateway ترفض
  التشغيل المُمرَّر باعتباره عدم تطابق في الموافقة

## أحداث النظام

تظهر دورة حياة Exec على شكل رسائل نظام:

- `Exec running` ‏(فقط إذا تجاوز الأمر عتبة إشعار التشغيل)
- `Exec finished`
- `Exec denied`

تُنشر هذه الرسائل في جلسة الوكيل بعد أن تبلغ node عن الحدث.
وتصدر موافقات exec على مضيف Gateway أحداث دورة الحياة نفسها عندما ينتهي الأمر (واختياريًا عندما يستمر مدة أطول من العتبة).
وتعيد أوامر exec المحكومة بالموافقة استخدام معرّف الموافقة بوصفه `runId` في هذه الرسائل لتسهيل الربط.

## سلوك الموافقة المرفوضة

عندما تُرفض موافقة exec غير المتزامنة، يمنع OpenClaw الوكيل من إعادة استخدام
مخرجات أي تشغيل سابق للأمر نفسه في الجلسة. ويتم تمرير سبب الرفض
مع إرشاد صريح يفيد بعدم توفر أي مخرجات للأمر، مما يمنع
الوكيل من الادعاء بوجود مخرجات جديدة أو تكرار الأمر المرفوض مع
نتائج قديمة من تشغيل ناجح سابق.

## الآثار المترتبة

- إن `full` قوية جدًا؛ لذا فضّل allowlists متى أمكن.
- تُبقيك `ask` داخل الحلقة مع الاستمرار في السماح بالموافقات السريعة.
- تمنع allowlists لكل وكيل تسرب موافقات وكيل إلى وكلاء آخرين.
- لا تنطبق approvals إلا على طلبات exec على المضيف من **مرسلين مخوّلين**. ولا يمكن للمرسلين غير المخولين إصدار `/exec`.
- يُعد `/exec security=full` وسيلة راحة على مستوى الجلسة للمشغّلين المخوّلين ويتخطى approvals عمدًا. ولحظر exec على المضيف منعًا باتًا، اضبط approvals security على `deny` أو احظر أداة `exec` عبر سياسة الأدوات.

## ذو صلة

<CardGroup cols={2}>
  <Card title="موافقات Exec — متقدم" href="/ar/tools/exec-approvals-advanced" icon="gear">
    Safe bins، وربط المفسّر، وتمرير الموافقات إلى الدردشة.
  </Card>
  <Card title="أداة Exec" href="/ar/tools/exec" icon="terminal">
    أداة تنفيذ أوامر shell.
  </Card>
  <Card title="الوضع Elevated" href="/ar/tools/elevated" icon="shield-exclamation">
    مسار كسر الزجاج الذي يتخطى approvals أيضًا.
  </Card>
  <Card title="Sandboxing" href="/ar/gateway/sandboxing" icon="box">
    أوضاع sandbox والوصول إلى مساحة العمل.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security" icon="lock">
    نموذج الأمان والتقوية.
  </Card>
  <Card title="Sandbox مقابل سياسة الأدوات مقابل Elevated" href="/ar/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    متى تستخدم كل وسيلة تحكم.
  </Card>
  <Card title="Skills" href="/ar/tools/skills" icon="sparkles">
    سلوك auto-allow المدعوم بالـ Skill.
  </Card>
</CardGroup>
