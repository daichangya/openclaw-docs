---
read_when:
    - تحتاج إلى التقاط حركة نقل OpenClaw محليًا لأغراض التصحيح
    - تريد فحص جلسات الوكيل الخاص بالتصحيح، أو الكائنات الثنائية الكبيرة، أو إعدادات الاستعلام المسبقة المدمجة
summary: مرجع CLI لـ `openclaw proxy`، والوكيل المحلي للتصحيح، ومفتش الالتقاط
title: وكيل
x-i18n:
    generated_at: "2026-04-23T13:59:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

شغّل وكيل التصحيح المحلي الصريح وافحص الحركة الملتقطة.

هذا أمر مخصص للتصحيح من أجل التحقيق على مستوى النقل. ويمكنه تشغيل وكيل محلي، وتشغيل أمر فرعي مع تفعيل الالتقاط، وسرد جلسات الالتقاط، والاستعلام عن أنماط الحركة الشائعة، وقراءة الكائنات الثنائية الكبيرة الملتقطة، وحذف بيانات الالتقاط المحلية.

## الأوامر

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## إعدادات الاستعلام المسبقة

يقبل `openclaw proxy query --preset <name>` ما يلي:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## ملاحظات

- يستخدم `start` القيمة الافتراضية `127.0.0.1` ما لم يتم تعيين `--host`.
- يبدأ `run` وكيل تصحيح محليًا ثم يشغّل الأمر الذي يلي `--`.
- اللقطات هي بيانات تصحيح محلية؛ استخدم `openclaw proxy purge` عند الانتهاء.
