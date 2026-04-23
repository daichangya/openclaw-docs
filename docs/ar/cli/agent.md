---
read_when:
    - تريد تشغيل دور وكيل واحد من البرامج النصية (مع إمكانية تسليم الرد)
summary: مرجع CLI لـ `openclaw agent` (إرسال دور وكيل واحد عبر Gateway)
title: agent
x-i18n:
    generated_at: "2026-04-23T07:21:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

شغّل دور وكيل عبر Gateway (استخدم `--local` للوضع المضمن).
استخدم `--agent <id>` لاستهداف وكيل مُعدّ مباشرة.

مرّر محدد جلسة واحدًا على الأقل:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

ذو صلة:

- أداة إرسال الوكيل: [Agent send](/ar/tools/agent-send)

## الخيارات

- `-m, --message <text>`: نص الرسالة المطلوب
- `-t, --to <dest>`: المستلم المستخدم لاشتقاق مفتاح الجلسة
- `--session-id <id>`: معرّف جلسة صريح
- `--agent <id>`: معرّف الوكيل؛ يتجاوز عمليات ربط التوجيه
- `--thinking <level>`: مستوى تفكير الوكيل (`off` و`minimal` و`low` و`medium` و`high`، بالإضافة إلى المستويات المخصصة التي يدعمها المزود مثل `xhigh` و`adaptive` و`max`)
- `--verbose <on|off>`: حفظ مستوى التفاصيل للجلسة
- `--channel <channel>`: قناة التسليم؛ احذفه لاستخدام قناة الجلسة الرئيسية
- `--reply-to <target>`: تجاوز هدف التسليم
- `--reply-channel <channel>`: تجاوز قناة التسليم
- `--reply-account <id>`: تجاوز حساب التسليم
- `--local`: شغّل الوكيل المضمن مباشرة (بعد التحميل المسبق لسجل Plugin)
- `--deliver`: أرسل الرد مرة أخرى إلى القناة/الهدف المحدد
- `--timeout <seconds>`: تجاوز مهلة الوكيل (الافتراضي 600 أو قيمة الإعدادات)
- `--json`: إخراج JSON

## أمثلة

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## ملاحظات

- يحتاط وضع Gateway إلى الوكيل المضمن عندما يفشل طلب Gateway. استخدم `--local` لفرض التنفيذ المضمن من البداية.
- لا يزال `--local` يحمّل سجل Plugin مسبقًا أولًا، بحيث تظل الموفرات والأدوات والقنوات التي يوفّرها Plugin متاحة أثناء التشغيلات المضمنة.
- تؤثر `--channel` و`--reply-channel` و`--reply-account` في تسليم الرد، وليس في توجيه الجلسة.
- عندما يؤدي هذا الأمر إلى إعادة إنشاء `models.json`، يتم حفظ بيانات اعتماد المزود المُدارة عبر SecretRef كعلامات غير سرية (على سبيل المثال أسماء متغيرات البيئة أو `secretref-env:ENV_VAR_NAME` أو `secretref-managed`)، وليس كنصوص سرية صريحة محلولة.
- تكون كتابات العلامات معتمدة على المصدر: يحفظ OpenClaw العلامات من لقطة إعدادات المصدر النشطة، وليس من قيم الأسرار المحلولة في وقت التشغيل.
