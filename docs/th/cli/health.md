---
read_when:
    - คุณต้องการตรวจสอบสถานะสุขภาพของ Gateway ที่กำลังทำงานอยู่ได้อย่างรวดเร็ว
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw health` (สแนปช็อตสถานะสุขภาพของ Gateway ผ่าน RPC)
title: สุขภาพ
x-i18n:
    generated_at: "2026-04-23T06:17:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

ดึงสถานะสุขภาพจาก Gateway ที่กำลังทำงานอยู่

ตัวเลือก:

- `--json`: เอาต์พุตที่เครื่องอ่านได้
- `--timeout <ms>`: เวลา timeout ของการเชื่อมต่อเป็นมิลลิวินาที (ค่าเริ่มต้น `10000`)
- `--verbose`: การบันทึกแบบ verbose
- `--debug`: นามแฝงของ `--verbose`

ตัวอย่าง:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

หมายเหตุ:

- `openclaw health` ตามค่าเริ่มต้นจะขอให้ gateway ที่กำลังทำงานอยู่ส่งสแนปช็อตสถานะสุขภาพของมันมา เมื่อ gateway มีสแนปช็อตแคชใหม่อยู่แล้ว มันสามารถส่งเพย์โหลดที่แคชไว้นั้นกลับมาและรีเฟรชในเบื้องหลังได้
- `--verbose` จะบังคับให้ตรวจสอบแบบสด พิมพ์รายละเอียดการเชื่อมต่อของ gateway และขยายเอาต์พุตที่มนุษย์อ่านได้ให้ครอบคลุมทุกบัญชีและเอเจนต์ที่ตั้งค่าไว้
- เอาต์พุตจะรวม session stores รายเอเจนต์เมื่อมีการตั้งค่าหลายเอเจนต์
