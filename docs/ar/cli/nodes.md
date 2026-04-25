---
read_when:
    - أنت تدير عُقدًا مقترنة (الكاميرات، الشاشة، اللوحة)
    - تحتاج إلى الموافقة على الطلبات أو استدعاء أوامر العُقد
summary: مرجع CLI لـ `openclaw nodes` (الحالة، pairing، invoke، الكاميرا/اللوحة/الشاشة)
title: العُقد
x-i18n:
    generated_at: "2026-04-25T13:44:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

إدارة العُقد المقترنة (الأجهزة) واستدعاء إمكانات العُقد.

ذو صلة:

- نظرة عامة على العُقد: [Nodes](/ar/nodes)
- الكاميرا: [عُقد الكاميرا](/ar/nodes/camera)
- الصور: [عُقد الصور](/ar/nodes/images)

الخيارات الشائعة:

- `--url` و`--token` و`--timeout` و`--json`

## الأوامر الشائعة

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

يطبع `nodes list` جداول العُقد المعلقة/المقترنة. وتتضمن الصفوف المقترنة أحدث مدة منذ الاتصال (آخر اتصال).
استخدم `--connected` لإظهار العُقد المتصلة حاليًا فقط. واستخدم `--last-connected <duration>` من أجل
التصفية إلى العُقد التي اتصلت خلال مدة محددة (مثل `24h` أو `7d`).

ملاحظة الموافقة:

- يحتاج `openclaw nodes pending` إلى نطاق pairing فقط.
- يمكن لـ `gateway.nodes.pairing.autoApproveCidrs` تخطي خطوة التعليق فقط من أجل
  اقتران أول مرة الموثوق صراحةً لجهاز `role: node`. وهو معطل
  افتراضيًا ولا يوافق على الترقيات.
- يرث `openclaw nodes approve <requestId>` متطلبات نطاق إضافية من
  الطلب المعلق:
  - طلب بلا أوامر: pairing فقط
  - أوامر عقدة ليست exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## الاستدعاء

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

علامات الاستدعاء:

- `--params <json>`: سلسلة كائن JSON (الافتراضي `{}`).
- `--invoke-timeout <ms>`: مهلة استدعاء العقدة (الافتراضي `15000`).
- `--idempotency-key <key>`: مفتاح idempotency اختياري.
- يتم حظر `system.run` و`system.run.prepare` هنا؛ استخدم أداة `exec` مع `host=node` لتنفيذ shell.

لتنفيذ shell على عقدة، استخدم أداة `exec` مع `host=node` بدلًا من `openclaw nodes run`.
يركز CLI الخاص بـ `nodes` الآن على الإمكانات: RPC مباشر عبر `nodes invoke`، بالإضافة إلى pairing، والكاميرا،
والشاشة، والموقع، واللوحة، والإشعارات.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Nodes](/ar/nodes)
