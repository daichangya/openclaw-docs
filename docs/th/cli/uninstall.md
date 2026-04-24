---
read_when:
    - คุณต้องการลบบริการ gateway และ/หรือสถานะในเครื่อง
    - คุณต้องการลองแบบ dry-run ก่อน
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw uninstall` (ลบบริการ gateway + ข้อมูลในเครื่อง)
title: ถอนการติดตั้ง
x-i18n:
    generated_at: "2026-04-24T09:04:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

ถอนการติดตั้งบริการ gateway + ข้อมูลในเครื่อง (CLI ยังคงอยู่)

ตัวเลือก:

- `--service`: ลบบริการ gateway
- `--state`: ลบสถานะและคอนฟิก
- `--workspace`: ลบไดเรกทอรี workspace
- `--app`: ลบแอป macOS
- `--all`: ลบบริการ สถานะ workspace และแอปทั้งหมด
- `--yes`: ข้ามพรอมป์ยืนยัน
- `--non-interactive`: ปิดพรอมป์; ต้องใช้ร่วมกับ `--yes`
- `--dry-run`: แสดงการกระทำโดยยังไม่ลบไฟล์

ตัวอย่าง:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

หมายเหตุ:

- รัน `openclaw backup create` ก่อน หากคุณต้องการ snapshot ที่กู้คืนได้ก่อนลบสถานะหรือ workspace
- `--all` เป็นรูปแบบย่อสำหรับการลบบริการ สถานะ workspace และแอปร่วมกัน
- `--non-interactive` ต้องใช้ร่วมกับ `--yes`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ถอนการติดตั้ง](/th/install/uninstall)
