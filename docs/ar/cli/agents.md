---
read_when:
    - أنت تريد عدة وكلاء معزولين (مساحات عمل + توجيه + مصادقة)
summary: مرجع CLI لـ `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: الوكلاء
x-i18n:
    generated_at: "2026-04-25T13:43:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

إدارة الوكلاء المعزولين (مساحات العمل + المصادقة + التوجيه).

ذو صلة:

- التوجيه متعدد الوكلاء: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
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

## روابط التوجيه

استخدم روابط التوجيه لتثبيت حركة القناة الواردة إلى وكيل محدد.

إذا كنت تريد أيضًا Skills مرئية مختلفة لكل وكيل، فاضبط
`agents.defaults.skills` و`agents.list[].skills` في `openclaw.json`. راجع
[إعدادات Skills](/ar/tools/skills-config) و
[مرجع الإعدادات](/ar/gateway/config-agents#agents-defaults-skills).

عرض الروابط:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

إضافة روابط:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

إذا حذفت `accountId` (`--bind <channel>`)، فسيقوم OpenClaw بحله من القيم الافتراضية للقناة وخطافات إعداد Plugin عند توفرها.

إذا حذفت `--agent` في `bind` أو `unbind`، فسيستهدف OpenClaw الوكيل الافتراضي الحالي.

### سلوك نطاق الرابط

- الرابط بدون `accountId` يطابق الحساب الافتراضي للقناة فقط.
- `accountId: "*"` هو الخيار الاحتياطي على مستوى القناة (جميع الحسابات) وهو أقل تحديدًا من رابط حساب صريح.
- إذا كان الوكيل نفسه لديه بالفعل رابط قناة مطابق بدون `accountId`، ثم قمت لاحقًا بعمل رابط مع `accountId` صريح أو محلول، فسيقوم OpenClaw بترقية هذا الرابط الموجود في مكانه بدلًا من إضافة رابط مكرر.

مثال:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

بعد الترقية، يصبح التوجيه لهذا الرابط محصورًا في `telegram:ops`. إذا كنت تريد أيضًا توجيه الحساب الافتراضي، فأضفه صراحةً (على سبيل المثال `--bind telegram:default`).

إزالة الروابط:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

يقبل `unbind` إما `--all` أو قيمة واحدة أو أكثر من `--bind`، وليس كليهما معًا.

## واجهة الأوامر

### `agents`

يشغّل `openclaw agents` بدون أمر فرعي السلوك نفسه لـ `openclaw agents list`.

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

- يؤدي تمرير أي رايات إضافة صريحة إلى تحويل الأمر إلى المسار غير التفاعلي.
- يتطلب الوضع غير التفاعلي اسم وكيل و`--workspace` معًا.
- `main` محجوز ولا يمكن استخدامه كمعرّف للوكيل الجديد.

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
- بدون `--force`، تكون المطالبة التفاعلية بالتأكيد مطلوبة.
- يتم نقل مساحة العمل، وحالة الوكيل، وأدلة نصوص الجلسات إلى المهملات، ولا يتم حذفها نهائيًا.
- إذا كانت مساحة عمل وكيل آخر هي المسار نفسه، أو داخل مساحة العمل هذه، أو تحتوي على مساحة العمل هذه،
  فسيتم الاحتفاظ بمساحة العمل وسيقوم `--json` بالإبلاغ عن `workspaceRetained`،
  و`workspaceRetainedReason`، و`workspaceSharedWith`.

## ملفات الهوية

يمكن أن تتضمن مساحة عمل كل وكيل ملف `IDENTITY.md` في جذر مساحة العمل:

- مسار مثال: `~/.openclaw/workspace/IDENTITY.md`
- يقرأ `set-identity --from-identity` من جذر مساحة العمل (أو من `--identity-file` صريح)

يتم حل مسارات الصور الرمزية نسبةً إلى جذر مساحة العمل.

## تعيين الهوية

يكتب `set-identity` الحقول في `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (مسار نسبةً إلى مساحة العمل، أو URL من نوع http(s)، أو data URI)

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
- إذا كنت تعتمد على `--workspace` وكانت عدة وكلاء تشارك مساحة العمل نفسها، فسيفشل الأمر ويطلب منك تمرير `--agent`.
- عند عدم توفير حقول هوية صريحة، يقرأ الأمر بيانات الهوية من `IDENTITY.md`.

التحميل من `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

تجاوز الحقول صراحةً:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

مثال إعدادات:

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

## ذو صلة

- [مرجع CLI](/ar/cli)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
