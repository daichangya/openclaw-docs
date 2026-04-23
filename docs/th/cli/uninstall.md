---
read_when:
    - คุณต้องการลบบริการ Gateway และ/หรือสถานะในเครื่อง
    - คุณต้องการดูตัวอย่างล่วงหน้าก่อน
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw uninstall` (ลบบริการ Gateway และข้อมูลในเครื่อง)
title: ถอนการติดตั้ง
x-i18n:
    generated_at: "2026-04-23T06:20:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

ถอนการติดตั้งบริการ Gateway + ข้อมูลในเครื่อง (CLI ยังคงอยู่)

ตัวเลือก:

- `--service`: ลบบริการ Gateway
- `--state`: ลบสถานะและ config
- `--workspace`: ลบไดเรกทอรีเวิร์กสเปซ
- `--app`: ลบแอป macOS
- `--all`: ลบบริการ สถานะ เวิร์กสเปซ และแอปรวมกัน
- `--yes`: ข้ามข้อความยืนยัน
- `--non-interactive`: ปิดใช้งานข้อความถาม; ต้องใช้ `--yes`
- `--dry-run`: พิมพ์การดำเนินการโดยไม่ลบไฟล์

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

- รัน `openclaw backup create` ก่อน หากคุณต้องการสแนปชอตที่กู้คืนได้ก่อนลบสถานะหรือเวิร์กสเปซ
- `--all` เป็นรูปแบบย่อสำหรับการลบบริการ สถานะ เวิร์กสเปซ และแอปร่วมกัน
- `--non-interactive` ต้องใช้ร่วมกับ `--yes`
