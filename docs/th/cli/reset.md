---
read_when:
    - คุณต้องการล้างสถานะในเครื่องโดยยังคงติดตั้ง CLI ไว้ต่อไป
    - คุณต้องการดูตัวอย่างล่วงหน้าว่าอะไรจะถูกลบออกบ้าง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw reset` (รีเซ็ตสถานะ/การกำหนดค่าในเครื่อง)
title: รีเซ็ต
x-i18n:
    generated_at: "2026-04-23T06:19:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

รีเซ็ต config/สถานะในเครื่อง (ยังคงติดตั้ง CLI ไว้)

ตัวเลือก:

- `--scope <scope>`: `config`, `config+creds+sessions` หรือ `full`
- `--yes`: ข้ามข้อความยืนยัน
- `--non-interactive`: ปิดใช้งานข้อความถาม; ต้องใช้ร่วมกับ `--scope` และ `--yes`
- `--dry-run`: พิมพ์การดำเนินการโดยไม่ลบไฟล์

ตัวอย่าง:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

หมายเหตุ:

- รัน `openclaw backup create` ก่อน หากคุณต้องการสแนปชอตที่กู้คืนได้ก่อนลบสถานะในเครื่อง
- หากคุณไม่ระบุ `--scope`, `openclaw reset` จะใช้ข้อความถามแบบโต้ตอบเพื่อเลือกสิ่งที่จะลบ
- `--non-interactive` ใช้ได้ก็ต่อเมื่อตั้งค่าทั้ง `--scope` และ `--yes` แล้ว
