---
read_when:
    - คุณต้องการค้นหาเอกสาร OpenClaw แบบสดจากเทอร์มินัล
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw docs` (ค้นหาในดัชนีเอกสารสด)
title: เอกสาร
x-i18n:
    generated_at: "2026-04-23T06:17:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

ค้นหาในดัชนีเอกสารสด

อาร์กิวเมนต์:

- `[query...]`: คำค้นหาที่จะส่งไปยังดัชนีเอกสารสด

ตัวอย่าง:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

หมายเหตุ:

- หากไม่มีคำค้นหา `openclaw docs` จะเปิดจุดเริ่มต้นการค้นหาเอกสารสด
- คำค้นหาหลายคำจะถูกส่งต่อเป็นคำขอค้นหาเดียว
