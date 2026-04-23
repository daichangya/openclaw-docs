---
read_when:
    - تريد فحص سجلات المهام في الخلفية أو تدقيقها أو إلغاؤها
    - أنت توثّق أوامر تدفق المهام ضمن `openclaw tasks flow`
summary: مرجع CLI لـ `openclaw tasks` (سجل المهام في الخلفية وحالة تدفق المهام)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T07:23:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

افحص المهام المستمرة في الخلفية وحالة تدفق المهام. عند عدم تحديد أمر فرعي،
يكون `openclaw tasks` مكافئًا لـ `openclaw tasks list`.

راجع [المهام في الخلفية](/ar/automation/tasks) للاطلاع على دورة الحياة ونموذج التسليم.

## الاستخدام

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## خيارات الجذر

- `--json`: إخراج JSON.
- `--runtime <name>`: التصفية حسب النوع: `subagent` أو `acp` أو `cron` أو `cli`.
- `--status <name>`: التصفية حسب الحالة: `queued` أو `running` أو `succeeded` أو `failed` أو `timed_out` أو `cancelled` أو `lost`.

## الأوامر الفرعية

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

يسرد المهام المتتبعة في الخلفية بدءًا بالأحدث.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

يعرض مهمة واحدة حسب معرّف المهمة أو معرّف التشغيل أو مفتاح الجلسة.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

يغيّر سياسة الإشعارات لمهمة قيد التشغيل.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

يلغي مهمة في الخلفية قيد التشغيل.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

يكشف سجلات المهام وتدفق المهام القديمة أو المفقودة أو الفاشلة في التسليم أو غير المتسقة بأي شكل آخر.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

يعاين أو يطبّق تسوية المهام وتدفق المهام، ووضع علامات التنظيف، والتقليم.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

يفحص أو يلغي حالة تدفق المهام المستمرة ضمن سجل المهام.
