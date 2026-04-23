---
read_when:
    - تريد عدة وكلاء معزولين (مساحات عمل + توجيه + مصادقة)
summary: مرجع CLI لـ `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agents
x-i18n:
    generated_at: "2026-04-23T07:21:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

إدارة وكلاء معزولين (مساحات عمل + مصادقة + توجيه).

ذو صلة:

- توجيه متعدد الوكلاء: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- مساحة عمل الوكيل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- إعدادات ظهور Skills: [إعدادات Skills](/ar/tools/skills-config)

## أمثلة

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## ارتباطات التوجيه

استخدم ارتباطات التوجيه لتثبيت حركة القنوات الواردة على وكيل محدد.

إذا كنت تريد أيضًا Skills مرئية مختلفة لكل وكيل، فاضبط
`agents.defaults.skills` و`agents.list[].skills` في `openclaw.json`. راجع
[إعدادات Skills](/ar/tools/skills-config) و
[مرجع التهيئة](/ar/gateway/configuration-reference#agents-defaults-skills).

عرض الارتباطات:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

إضافة ارتباطات:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

إذا حذفت `accountId` (`--bind <channel>`)، فسيقوم OpenClaw بحلّه من القيم الافتراضية للقناة وhook إعداد Plugin عند توفرهما.

إذا حذفت `--agent` مع `bind` أو `unbind`، فسيستهدف OpenClaw الوكيل الافتراضي الحالي.

### سلوك نطاق الارتباط

- الارتباط من دون `accountId` يطابق الحساب الافتراضي للقناة فقط.
- `accountId: "*"` هو البديل الاحتياطي على مستوى القناة (كل الحسابات) وهو أقل تحديدًا من ارتباط حساب صريح.
- إذا كان الوكيل نفسه يملك بالفعل ارتباط قناة مطابقًا من دون `accountId`، ثم أجريت لاحقًا ارتباطًا مع `accountId` صريح أو محلول، فسيقوم OpenClaw بترقية ذلك الارتباط الموجود في مكانه بدلًا من إضافة ارتباط مكرر.

مثال:

```bash
# ارتباط أولي على مستوى القناة فقط
openclaw agents bind --agent work --bind telegram

# ترقية لاحقة إلى ارتباط على مستوى الحساب
openclaw agents bind --agent work --bind telegram:ops
```

بعد الترقية، يصبح التوجيه لذلك الارتباط محصورًا في `telegram:ops`. وإذا كنت تريد أيضًا توجيه الحساب الافتراضي، فأضفه صراحةً (مثلًا `--bind telegram:default`).

إزالة الارتباطات:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

يقبل `unbind` إما `--all` أو قيمة واحدة أو أكثر من `--bind`، وليس كليهما معًا.

## سطح الأوامر

### `agents`

تشغيل `openclaw agents` من دون أمر فرعي يعادل `openclaw agents list`.

### `agents list`

الخيارات:

- `--json`
- `--bindings`: تضمين قواعد التوجيه الكاملة، وليس فقط الأعداد/الملخصات لكل وكيل

### `agents add [name]`

الخيارات:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--non-interactive`
- `--json`

ملاحظات:

- يؤدي تمرير أي علامات add صريحة إلى تحويل الأمر إلى المسار غير التفاعلي.
- يتطلب الوضع غير التفاعلي كلًا من اسم الوكيل و`--workspace`.
- `main` محجوز ولا يمكن استخدامه كمعرّف الوكيل الجديد.

### `agents bindings`

الخيارات:

- `--agent <id>`
- `--json`

### `agents bind`

الخيارات:

- `--agent <id>` (الافتراضي هو الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--json`

### `agents unbind`

الخيارات:

- `--agent <id>` (الافتراضي هو الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--all`
- `--json`

### `agents delete <id>`

الخيارات:

- `--force`
- `--json`

ملاحظات:

- لا يمكن حذف `main`.
- من دون `--force`، تكون التأكيدات التفاعلية مطلوبة.
- تُنقل أدلة مساحة العمل، وحالة الوكيل، ونصوص الجلسات إلى Trash، ولا تُحذف حذفًا نهائيًا.

## ملفات الهوية

يمكن أن تتضمن مساحة عمل كل وكيل ملف `IDENTITY.md` في جذر مساحة العمل:

- مسار مثال: `~/.openclaw/workspace/IDENTITY.md`
- يقرأ `set-identity --from-identity` من جذر مساحة العمل (أو من `--identity-file` صريح)

تُحل مسارات الصورة الرمزية نسبةً إلى جذر مساحة العمل.

## تعيين الهوية

يكتب `set-identity` الحقول في `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (مسار نسبي لمساحة العمل، أو URL من نوع http(s)، أو data URI)

الخيارات:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

ملاحظات:

- يمكن استخدام `--agent` أو `--workspace` لتحديد الوكيل المستهدف.
- إذا اعتمدت على `--workspace` وكان عدة وكلاء يشاركون مساحة العمل تلك، فسيفشل الأمر ويطلب منك تمرير `--agent`.
- عند عدم توفير حقول هوية صريحة، يقرأ الأمر بيانات الهوية من `IDENTITY.md`.

التحميل من `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

تجاوز الحقول صراحةً:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

نموذج إعدادات:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
