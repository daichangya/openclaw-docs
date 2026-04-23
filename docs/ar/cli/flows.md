---
read_when:
    - تصادف openclaw flows في مستندات أو ملاحظات إصدار أقدم
summary: 'إعادة توجيه: توجد أوامر التدفق ضمن `openclaw tasks flow`'
title: التدفقات (إعادة توجيه)
x-i18n:
    generated_at: "2026-04-23T07:22:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99377cf58ae17262291218639c4425abcec4efbd0405cf05b6df0d2e5b7f20bb
    source_path: cli/flows.md
    workflow: 15
---

# `openclaw tasks flow`

أوامر التدفق هي أوامر فرعية ضمن `openclaw tasks`، وليست أمر `flows` مستقلًا.

```bash
openclaw tasks flow list [--json]
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

للاطلاع على التوثيق الكامل، راجع [Task Flow](/ar/automation/taskflow) و[مرجع CLI الخاص بالمهام](/ar/cli/tasks).
