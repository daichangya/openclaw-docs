---
read_when:
    - تريد تشغيل دورة وكيل واحدة من خلال البرامج النصية (مع تسليم الرد اختياريًا)
summary: مرجع CLI لـ `openclaw agent` (إرسال دورة وكيل واحدة عبر Gateway)
title: الوكيل
x-i18n:
    generated_at: "2026-04-25T13:43:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

شغّل دورة وكيل عبر Gateway (استخدم `--local` للتشغيل المضمّن).
استخدم `--agent <id>` لاستهداف وكيل مُهيأ مباشرة.

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
- `--agent <id>`: معرّف الوكيل؛ يتجاوز روابط التوجيه
- `--thinking <level>`: مستوى تفكير الوكيل (`off` و`minimal` و`low` و`medium` و`high`، بالإضافة إلى المستويات المخصصة المدعومة من الموفّر مثل `xhigh` و`adaptive` و`max`)
- `--verbose <on|off>`: الاحتفاظ بمستوى verbosity للجلسة
- `--channel <channel>`: قناة التسليم؛ احذفها لاستخدام قناة الجلسة الرئيسية
- `--reply-to <target>`: تجاوز هدف التسليم
- `--reply-channel <channel>`: تجاوز قناة التسليم
- `--reply-account <id>`: تجاوز حساب التسليم
- `--local`: شغّل الوكيل المضمّن مباشرة (بعد التحميل المسبق لسجل Plugin)
- `--deliver`: أرسل الرد مرة أخرى إلى القناة/الهدف المحددين
- `--timeout <seconds>`: تجاوز مهلة الوكيل (الافتراضي 600 أو قيمة التهيئة)
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

- يعود وضع Gateway إلى الوكيل المضمّن عند فشل طلب Gateway. استخدم `--local` لفرض التنفيذ المضمّن من البداية.
- يظل `--local` يحمّل سجل Plugin مسبقًا أولًا، بحيث تبقى الموفّرات والأدوات والقنوات التي توفرها Plugins متاحة أثناء التشغيلات المضمّنة.
- يُعامل كل استدعاء لـ `openclaw agent` على أنه تشغيل لمرة واحدة. يتم إنهاء خوادم MCP المجمّعة أو المهيأة من قبل المستخدم المفتوحة لذلك التشغيل بعد الرد، حتى عند استخدام الأمر لمسار Gateway، لذلك لا تظل العمليات الفرعية `stdio` الخاصة بـ MCP حية بين الاستدعاءات البرمجية النصية.
- تؤثر `--channel` و`--reply-channel` و`--reply-account` في تسليم الرد، وليس في توجيه الجلسة.
- يحتفظ `--json` بـ stdout مخصصًا لاستجابة JSON. ويتم توجيه تشخيصات Gateway وPlugin والرجوع إلى التنفيذ المضمّن إلى stderr حتى تتمكن البرامج النصية من تحليل stdout مباشرة.
- عندما يؤدي هذا الأمر إلى إعادة توليد `models.json`، يتم الاحتفاظ ببيانات اعتماد الموفّر المُدارة بواسطة SecretRef كعلامات غير سرية (مثل أسماء متغيرات البيئة، أو `secretref-env:ENV_VAR_NAME`، أو `secretref-managed`) وليس كنصوص سرية صريحة محلولة.
- تكون كتابات العلامات معتمدة على المصدر: يحتفظ OpenClaw بالعلامات من لقطة تهيئة المصدر النشطة، وليس من قيم الأسرار المحلولة وقت التشغيل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [بيئة تشغيل الوكيل](/ar/concepts/agent)
