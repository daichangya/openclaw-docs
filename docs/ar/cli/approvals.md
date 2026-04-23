---
read_when:
    - تريد تعديل موافقات exec من CLI
    - تحتاج إلى إدارة قوائم السماح على مضيفات Gateway أو Node
summary: مرجع CLI لـ `openclaw approvals` و`openclaw exec-policy`
title: الموافقات
x-i18n:
    generated_at: "2026-04-23T07:21:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

أدر موافقات exec الخاصة بـ **المضيف المحلي** أو **مضيف gateway** أو **مضيف node**.
افتراضيًا، تستهدف الأوامر ملف الموافقات المحلي على القرص. استخدم `--gateway` للاستهداف إلى gateway، أو `--node` للاستهداف إلى node معيّن.

الاسم المستعار: `openclaw exec-approvals`

ذو صلة:

- موافقات Exec: [موافقات Exec](/ar/tools/exec-approvals)
- Nodes: [Nodes](/ar/nodes)

## `openclaw exec-policy`

إن `openclaw exec-policy` هو أمر الراحة المحلي للحفاظ على محاذاة
إعدادات `tools.exec.*` المطلوبة وملف موافقات المضيف المحلي في خطوة واحدة.

استخدمه عندما تريد:

- فحص السياسة المحلية المطلوبة، وملف موافقات المضيف، والدمج الفعّال
- تطبيق إعداد مسبق محلي مثل YOLO أو deny-all
- مزامنة `tools.exec.*` المحلية و`~/.openclaw/exec-approvals.json` المحلي

أمثلة:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

أوضاع الإخراج:

- بدون `--json`: يطبع عرض الجدول المقروء للبشر
- مع `--json`: يطبع مخرجات منظَّمة قابلة للقراءة آليًا

النطاق الحالي:

- `exec-policy` هو **محلي فقط**
- يحدّث ملف الإعدادات المحلي وملف الموافقات المحلي معًا
- لا يقوم **بدفع** السياسة إلى مضيف gateway أو مضيف node
- يتم رفض `--host node` في هذا الأمر لأن موافقات exec الخاصة بـ node تُجلب من node في وقت التشغيل ويجب إدارتها بدلًا من ذلك عبر أوامر الموافقات الموجَّهة إلى node
- يضع `openclaw exec-policy show` علامة على نطاقات `host=node` على أنها مُدارة بواسطة node في وقت التشغيل بدلًا من اشتقاق سياسة فعّالة من ملف الموافقات المحلي

إذا كنت بحاجة إلى تعديل موافقات المضيف البعيد مباشرةً، فاستمر في استخدام `openclaw approvals set --gateway`
أو `openclaw approvals set --node <id|name|ip>`.

## الأوامر الشائعة

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

يعرض `openclaw approvals get` الآن سياسة exec الفعّالة للأهداف المحلية وأهداف gateway وnode:

- سياسة `tools.exec` المطلوبة
- سياسة ملف موافقات المضيف
- النتيجة الفعّالة بعد تطبيق قواعد الأولوية

الأولوية مقصودة:

- ملف موافقات المضيف هو مصدر الحقيقة القابل للفرض
- يمكن لسياسة `tools.exec` المطلوبة أن تضيّق النية أو توسّعها، لكن النتيجة الفعّالة تظل مشتقة من قواعد المضيف
- يجمع `--node` بين ملف موافقات مضيف node وسياسة `tools.exec` الخاصة بـ gateway، لأن كليهما لا يزالان يُطبّقان في وقت التشغيل
- إذا لم تتوفر إعدادات gateway، يعود CLI إلى لقطة موافقات node ويشير إلى أنه تعذر حساب سياسة وقت التشغيل النهائية

## استبدال الموافقات من ملف

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

يقبل `set` تنسيق JSON5، وليس JSON الصارم فقط. استخدم إما `--file` أو `--stdin`، وليس كليهما.

## مثال "عدم المطالبة أبدًا" / YOLO

بالنسبة إلى مضيف يجب ألا يتوقف أبدًا عند موافقات exec، اضبط القيم الافتراضية لموافقات المضيف على `full` + `off`:

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

صيغة Node:

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

يغيّر هذا **ملف موافقات المضيف** فقط. وللحفاظ على محاذاة سياسة OpenClaw المطلوبة، اضبط أيضًا:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

سبب استخدام `tools.exec.host=gateway` في هذا المثال:

- لا يزال `host=auto` يعني "sandbox عند التوفر، وإلا gateway".
- YOLO يتعلق بالموافقات، وليس بالتوجيه.
- إذا كنت تريد exec على المضيف حتى عند إعداد sandbox، فاجعل اختيار المضيف صريحًا باستخدام `gateway` أو `/exec host=gateway`.

وهذا يطابق سلوك YOLO الحالي الافتراضي للمضيف. شدّده إذا كنت تريد موافقات.

الاختصار المحلي:

```bash
openclaw exec-policy preset yolo
```

يقوم هذا الاختصار المحلي بتحديث كل من إعدادات `tools.exec.*` المحلية المطلوبة
والقيم الافتراضية للموافقات المحلية معًا. وهو مكافئ في النية لإعداد الخطوتين اليدوي
أعلاه، ولكن للجهاز المحلي فقط.

## مساعدات قائمة السماح

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## الخيارات الشائعة

تدعم الأوامر `get` و`set` و`allowlist add|remove` جميعها:

- `--node <id|name|ip>`
- `--gateway`
- خيارات RPC المشتركة الخاصة بـ node: `--url` و`--token` و`--timeout` و`--json`

ملاحظات الاستهداف:

- عدم استخدام أعلام استهداف يعني ملف الموافقات المحلي على القرص
- يستهدف `--gateway` ملف موافقات مضيف gateway
- يستهدف `--node` مضيف node واحدًا بعد حلّ المعرّف أو الاسم أو IP أو بادئة المعرّف

كما يدعم `allowlist add|remove` أيضًا:

- `--agent <id>` (الافتراضي `*`)

## ملاحظات

- يستخدم `--node` محلل الأهداف نفسه مثل `openclaw nodes` (المعرّف أو الاسم أو ip أو بادئة المعرّف).
- القيمة الافتراضية لـ `--agent` هي `"*"`، وهذا ينطبق على جميع الوكلاء.
- يجب أن يعلن مضيف node عن `system.execApprovals.get/set` (تطبيق macOS أو مضيف node بدون واجهة).
- يتم تخزين ملفات الموافقات لكل مضيف في `~/.openclaw/exec-approvals.json`.
