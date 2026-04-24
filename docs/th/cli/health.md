---
read_when:
    - คุณต้องการตรวจสอบสุขภาพของ Gateway ที่กำลังทำงานอยู่แบบรวดเร็ว
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw health` (สแนปช็อตสถานะสุขภาพของ Gateway ผ่าน RPC)
title: สุขภาพ სისტემ
x-i18n:
    generated_at: "2026-04-24T09:02:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

ดึงข้อมูลสุขภาพจาก Gateway ที่กำลังทำงานอยู่

ตัวเลือก:

- `--json`: เอาต์พุตแบบอ่านได้ด้วยเครื่อง
- `--timeout <ms>`: timeout การเชื่อมต่อเป็นมิลลิวินาที (ค่าเริ่มต้น `10000`)
- `--verbose`: การบันทึกแบบ verbose
- `--debug`: alias ของ `--verbose`

ตัวอย่าง:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

หมายเหตุ:

- `openclaw health` ตามค่าเริ่มต้นจะขอสแนปช็อตสุขภาพจาก gateway ที่กำลังทำงานอยู่ เมื่อ
  gateway มีสแนปช็อตที่แคชไว้และยังใหม่อยู่แล้ว ก็อาจส่งคืน payload ที่แคชไว้นั้นได้ และ
  รีเฟรชในเบื้องหลัง
- `--verbose` จะบังคับให้ probe แบบสด พิมพ์รายละเอียดการเชื่อมต่อ gateway และขยาย
  เอาต์พุตแบบอ่านได้สำหรับมนุษย์ให้ครอบคลุมทุกบัญชีและเอเจนต์ที่กำหนดค่าไว้
- เอาต์พุตจะรวม session store ของแต่ละเอเจนต์เมื่อมีการกำหนดค่าหลายเอเจนต์

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [สุขภาพของ Gateway](/th/gateway/health)
