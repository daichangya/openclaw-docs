---
read_when:
    - คุณต้องการค้นหาเอกสาร OpenClaw แบบ live จากเทอร์มินัล
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw docs` (ค้นหาดัชนีเอกสารแบบ live)
title: เอกสาร
x-i18n:
    generated_at: "2026-04-24T09:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

ค้นหาดัชนีเอกสารแบบ live

อาร์กิวเมนต์:

- `[query...]`: คำค้นหาที่จะส่งไปยังดัชนีเอกสารแบบ live

ตัวอย่าง:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

หมายเหตุ:

- หากไม่มีคำค้นหา `openclaw docs` จะเปิดจุดเริ่มต้นการค้นหาเอกสารแบบ live
- คำค้นหาหลายคำจะถูกส่งผ่านเป็นคำขอค้นหาเดียว

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
