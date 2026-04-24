---
read_when:
    - การเปลี่ยนการเรนเดอร์เอาต์พุตของผู้ช่วยใน Control UI
    - การดีบักคำสั่งกำกับการแสดงผล `[embed ...]`, `MEDIA:`, reply หรือ audio
summary: โปรโตคอล shortcode สำหรับเอาต์พุตแบบริชสำหรับ embeds, สื่อ, คำใบ้เสียง และการตอบกลับ
title: โปรโตคอลเอาต์พุตแบบริช
x-i18n:
    generated_at: "2026-04-24T09:31:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

เอาต์พุตของผู้ช่วยสามารถมีคำสั่งกำกับการส่ง/การเรนเดอร์ชุดเล็กๆ ได้:

- `MEDIA:` สำหรับการส่งไฟล์แนบ
- `[[audio_as_voice]]` สำหรับคำใบ้การแสดงผลเสียง
- `[[reply_to_current]]` / `[[reply_to:<id>]]` สำหรับข้อมูลเมตาการตอบกลับ
- `[embed ...]` สำหรับการเรนเดอร์แบบริชใน Control UI

คำสั่งกำกับเหล่านี้แยกจากกัน `MEDIA:` และแท็ก reply/voice ยังคงเป็นข้อมูลเมตาการส่ง; ส่วน `[embed ...]` เป็นเส้นทางการเรนเดอร์แบบริชสำหรับเว็บเท่านั้น

## `[embed ...]`

`[embed ...]` เป็น syntax สำหรับการเรนเดอร์แบบริชที่หันหน้าให้เอเจนต์เพียงแบบเดียวสำหรับ Control UI

ตัวอย่างแบบ self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

กฎ:

- `[view ...]` ใช้ไม่ได้อีกต่อไปสำหรับเอาต์พุตใหม่
- embed shortcodes จะเรนเดอร์เฉพาะในพื้นผิวข้อความของผู้ช่วยเท่านั้น
- จะเรนเดอร์เฉพาะ embeds ที่อิงกับ URL เท่านั้น ใช้ `ref="..."` หรือ `url="..."`
- จะไม่เรนเดอร์ embed shortcodes แบบ HTML inline ในรูป block-form
- เว็บ UI จะตัด shortcode ออกจากข้อความที่มองเห็นได้ และเรนเดอร์ embed แบบ inline
- `MEDIA:` ไม่ใช่นามแฝงของ embed และไม่ควรใช้สำหรับการเรนเดอร์ embed แบบริช

## โครงสร้างการเรนเดอร์ที่จัดเก็บไว้

บล็อกเนื้อหาผู้ช่วยที่ผ่านการ normalize/จัดเก็บแล้วจะเป็นรายการ `canvas` แบบมีโครงสร้าง:

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

บล็อกแบบริชที่ถูกจัดเก็บ/เรนเดอร์จะใช้โครงสร้าง `canvas` นี้โดยตรง `present_view` ไม่ถูกรู้จัก

## ที่เกี่ยวข้อง

- [RPC adapters](/th/reference/rpc)
- [Typebox](/th/concepts/typebox)
