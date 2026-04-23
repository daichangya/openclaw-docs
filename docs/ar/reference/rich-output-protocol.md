---
read_when:
    - تغيير عرض مخرجات المساعد في Control UI
    - تصحيح أخطاء توجيهات العرض الخاصة بـ `[embed ...]` و`MEDIA:` وreply أو audio
summary: بروتوكول shortcodes للإخراج الغني للتضمينات والوسائط وتلميحات الصوت والردود
title: بروتوكول الإخراج الغني
x-i18n:
    generated_at: "2026-04-23T07:32:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# بروتوكول الإخراج الغني

يمكن أن تحمل مخرجات المساعد مجموعة صغيرة من توجيهات التسليم/العرض:

- `MEDIA:` لتسليم المرفقات
- `[[audio_as_voice]]` لتلميحات عرض الصوت
- `[[reply_to_current]]` / `[[reply_to:<id>]]` لبيانات الرد الوصفية
- `[embed ...]` للعرض الغني في Control UI

هذه التوجيهات منفصلة. تبقى `MEDIA:` ووسوم reply/voice بيانات وصفية للتسليم؛ أما `[embed ...]` فهو مسار العرض الغني الخاص بالويب فقط.

## `[embed ...]`

إن `[embed ...]` هو صيغة العرض الغني الوحيدة المواجهة للوكيل في Control UI.

مثال ذاتي الإغلاق:

```text
[embed ref="cv_123" title="Status" /]
```

القواعد:

- لم يعد `[view ...]` صالحًا للإخراج الجديد.
- تُعرض shortcodes الخاصة بالتضمين على سطح رسالة المساعد فقط.
- لا تُعرض إلا التضمينات المدعومة بعناوين URL. استخدم `ref="..."` أو `url="..."`.
- لا تُعرض shortcodes الخاصة بالتضمين بصيغة الكتل مع HTML المضمن.
- تزيل واجهة الويب shortcode من النص المرئي وتعرض التضمين inline.
- ليست `MEDIA:` اسمًا مستعارًا لـ embed ويجب عدم استخدامها لعرض التضمين الغني.

## شكل العرض المخزَّن

تكون كتلة محتوى المساعد المطبَّعة/المخزَّنة عنصر `canvas` مهيكلًا:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

تستخدم الكتل الغنية المخزنة/المعروضة شكل `canvas` هذا مباشرة. ولا يتم التعرف على `present_view`.
