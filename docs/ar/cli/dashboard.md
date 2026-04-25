---
read_when:
    - تريد فتح واجهة Control UI باستخدام الرمز المميز الحالي لديك
    - تريد طباعة عنوان URL من دون تشغيل متصفح
summary: مرجع CLI لـ `openclaw dashboard` (افتح واجهة Control UI)
title: لوحة التحكم
x-i18n:
    generated_at: "2026-04-25T13:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

افتح واجهة Control UI باستخدام المصادقة الحالية لديك.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

ملاحظات:

- يقوم `dashboard` بتحليل SecretRefs المضبوطة في `gateway.auth.token` عندما يكون ذلك ممكنًا.
- يتبع `dashboard` الإعداد `gateway.tls.enabled`: إذ تطبع/تفتح بوابات Gateway المفعّل فيها TLS
  عناوين URL الخاصة بـ Control UI باستخدام `https://` وتتصل عبر `wss://`.
- بالنسبة إلى الرموز المميزة المُدارة عبر SecretRef (سواء كانت محلولة أو غير محلولة)، يقوم `dashboard` بطباعة/نسخ/فتح عنوان URL غير مضمَّن فيه رمز مميز لتجنب كشف الأسرار الخارجية في مخرجات الطرفية أو سجل الحافظة أو معاملات تشغيل المتصفح.
- إذا كان `gateway.auth.token` مُدارًا عبر SecretRef لكنه غير محلول في مسار هذا الأمر، فسيطبع الأمر عنوان URL غير مضمَّن فيه رمز مميز مع إرشادات معالجة صريحة بدلًا من تضمين عنصر نائب غير صالح لرمز مميز.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [لوحة التحكم](/ar/web/dashboard)
