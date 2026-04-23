---
x-i18n:
    generated_at: "2026-04-23T05:24:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e1cf417b0c04d001bc494fbe03ac2fcb66866f759e21646dbfd1a9c3a968bff
    source_path: .i18n/README.md
    workflow: 15
---

# แอสเซ็ต i18n เอกสารของ OpenClaw

โฟลเดอร์นี้เก็บการตั้งค่าการแปลสำหรับ repo เอกสารต้นทาง

หน้าภาษาที่สร้างขึ้นและ translation memory แบบสดสำหรับแต่ละภาษาปัจจุบันอยู่ใน publish repo (`openclaw/docs`, เช็กเอาต์แบบ sibling ในเครื่องที่ `~/Projects/openclaw-docs`)

## ไฟล์

- `glossary.<lang>.json` — การแมปคำศัพท์ที่ควรใช้เป็นหลัก (ใช้ในคำแนะนำของพรอมป์ต์)
- `<lang>.tm.jsonl` — translation memory (แคช) ที่อิงตามเวิร์กโฟลว์ + โมเดล + แฮชข้อความ ใน repo นี้ ไฟล์ TM ของแต่ละภาษาจะถูกสร้างตามต้องการ

## รูปแบบ Glossary

`glossary.<lang>.json` เป็นอาร์เรย์ของรายการ:

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

ฟิลด์:

- `source`: วลีภาษาอังกฤษ (หรือภาษาต้นทาง) ที่ควรใช้เป็นหลัก
- `target`: ผลลัพธ์การแปลที่ควรใช้เป็นหลัก

## หมายเหตุ

- รายการ glossary จะถูกส่งให้โมเดลเป็น **คำแนะนำของพรอมป์ต์** (ไม่มีการเขียนทับแบบกำหนดตายตัว)
- `scripts/docs-i18n` ยังคงเป็นส่วนที่รับผิดชอบการสร้างงานแปล
- repo ต้นทางจะซิงก์เอกสารภาษาอังกฤษไปยัง publish repo ส่วนการสร้างภาษาท้องถิ่นจะทำที่นั่นแยกตามภาษาเมื่อมีการ push, ตามตารางเวลา และเมื่อมี release dispatch
