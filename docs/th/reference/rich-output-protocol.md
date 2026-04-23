---
x-i18n:
    generated_at: "2026-04-23T05:54:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a8884fc2c304bf96d4675f0c1d1ff781d6dc1ae8c49d92ce08040c9c7709035
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# โปรโตคอล Rich Output

เอาต์พุตของผู้ช่วยสามารถมี directive สำหรับการส่งมอบ/การเรนเดอร์ได้ชุดเล็ก ๆ ดังนี้:

- `MEDIA:` สำหรับการส่งไฟล์แนบ
- `[[audio_as_voice]]` สำหรับคำใบ้การแสดงผลเสียง
- `[[reply_to_current]]` / `[[reply_to:<id>]]` สำหรับ metadata ของการตอบกลับ
- `[embed ...]` สำหรับการเรนเดอร์แบบ rich ของ Control UI

directive เหล่านี้แยกจากกัน `MEDIA:` และแท็ก reply/voice ยังคงเป็น metadata สำหรับการส่งมอบ; `[embed ...]` คือเส้นทางการเรนเดอร์แบบ rich ที่ใช้บนเว็บเท่านั้น

## `[embed ...]`

`[embed ...]` คือ syntax สำหรับ rich render ที่ผู้ช่วยใช้งานได้เพียงแบบเดียวใน Control UI

ตัวอย่างแบบ self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

กฎ:

- `[view ...]` ไม่ถูกต้องอีกต่อไปสำหรับเอาต์พุตใหม่
- embed shortcode จะเรนเดอร์เฉพาะในพื้นผิวข้อความของผู้ช่วยเท่านั้น
- จะเรนเดอร์เฉพาะ embed ที่มี URL รองรับเท่านั้น ใช้ `ref="..."` หรือ `url="..."`
- block-form inline HTML embed shortcode จะไม่ถูกเรนเดอร์
- web UI จะตัด shortcode ออกจากข้อความที่มองเห็น และเรนเดอร์ embed แบบ inline
- `MEDIA:` ไม่ใช่ alias ของ embed และไม่ควรใช้สำหรับการเรนเดอร์ rich embed

## รูปร่างของการเรนเดอร์ที่ถูกจัดเก็บ

บล็อกเนื้อหาของผู้ช่วยที่ถูก normalize/จัดเก็บแล้วเป็นรายการ `canvas` แบบมีโครงสร้าง:

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

บล็อก rich ที่ถูกจัดเก็บ/เรนเดอร์จะใช้รูปทรง `canvas` นี้โดยตรง `present_view` จะไม่ถูกรับรู้
