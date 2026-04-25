---
read_when:
    - تريد نتائج أقصر لأداتي `exec` أو `bash` في OpenClaw
    - تريد تفعيل Plugin المضمّن tokenjuice
    - أنت بحاجة إلى فهم ما الذي يغيّره tokenjuice وما الذي يتركه خامًا
summary: ضغط نتائج أدوات exec وbash الصاخبة باستخدام Plugin مضمّن اختياري
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-25T14:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` هو Plugin مضمّن اختياري يقوم بضغط نتائج أداتي `exec` و`bash`
الصاخبة بعد أن يكون الأمر قد نُفِّذ بالفعل.

وهو يغيّر `tool_result` المعاد، وليس الأمر نفسه. ولا يقوم Tokenjuice
بإعادة كتابة مدخلات shell، أو إعادة تشغيل الأوامر، أو تغيير رموز الخروج.

واليوم ينطبق هذا على تشغيلات PI المضمّنة وأدوات OpenClaw الديناميكية في حزام
Codex app-server. ويتصل Tokenjuice بوسيط نتائج الأدوات في OpenClaw ويقوم
بتقليم المخرجات قبل أن تعود إلى جلسة الحزام النشطة.

## فعّل Plugin

المسار السريع:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

والمكافئ له:

```bash
openclaw plugins enable tokenjuice
```

يشحن OpenClaw هذا Plugin بالفعل. ولا توجد خطوة منفصلة من نوع `plugins install`
أو `tokenjuice install openclaw`.

إذا كنت تفضّل تعديل الإعدادات مباشرة:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## ما الذي يغيّره tokenjuice

- يضغط نتائج `exec` و`bash` الصاخبة قبل إعادتها إلى الجلسة.
- يبقي تنفيذ الأمر الأصلي من دون تغيير.
- يحافظ على قراءات محتوى الملفات الدقيقة والأوامر الأخرى التي ينبغي أن يتركها tokenjuice خامًا.
- يظل خيار اشتراك صريح: عطّل Plugin إذا كنت تريد مخرجات حرفية في كل مكان.

## تحقق من أنه يعمل

1. فعّل Plugin.
2. ابدأ جلسة يمكنها استدعاء `exec`.
3. شغّل أمرًا صاخبًا مثل `git status`.
4. تحقق من أن نتيجة الأداة المعادة أقصر وأكثر تنظيمًا من مخرجات shell الخام.

## عطّل Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

أو:

```bash
openclaw plugins disable tokenjuice
```

## ذو صلة

- [أداة Exec](/ar/tools/exec)
- [مستويات التفكير](/ar/tools/thinking)
- [محرك السياق](/ar/concepts/context-engine)
