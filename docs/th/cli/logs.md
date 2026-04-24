---
read_when:
    - คุณต้องการ tail ล็อกของ Gateway จากระยะไกล (โดยไม่ใช้ SSH)
    - คุณต้องการบรรทัดล็อกแบบ JSON สำหรับเครื่องมือ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw logs` (tail ล็อกของ Gateway ผ่าน RPC)
title: ล็อก
x-i18n:
    generated_at: "2026-04-24T09:03:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

tail ล็อกไฟล์ของ Gateway ผ่าน RPC (ทำงานได้ในโหมดระยะไกล)

ที่เกี่ยวข้อง:

- ภาพรวมการบันทึกล็อก: [Logging](/th/logging)
- Gateway CLI: [gateway](/th/cli/gateway)

## ตัวเลือก

- `--limit <n>`: จำนวนบรรทัดล็อกสูงสุดที่จะส่งกลับ (ค่าเริ่มต้น `200`)
- `--max-bytes <n>`: จำนวนไบต์สูงสุดที่จะอ่านจากไฟล์ล็อก (ค่าเริ่มต้น `250000`)
- `--follow`: ติดตามสตรีมล็อกต่อเนื่อง
- `--interval <ms>`: ช่วงเวลา polling ระหว่างการติดตาม (ค่าเริ่มต้น `1000`)
- `--json`: ส่งออกเหตุการณ์ JSON แบบหนึ่งบรรทัดต่อหนึ่งรายการ
- `--plain`: เอาต์พุตข้อความล้วนโดยไม่มีการจัดรูปแบบ
- `--no-color`: ปิดใช้งานสี ANSI
- `--local-time`: แสดง timestamp ตามเขตเวลาท้องถิ่นของคุณ

## ตัวเลือก RPC ของ Gateway ที่ใช้ร่วมกัน

`openclaw logs` ยังรองรับแฟล็กมาตรฐานของไคลเอนต์ Gateway:

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: โทเค็นของ Gateway
- `--timeout <ms>`: timeout เป็นมิลลิวินาที (ค่าเริ่มต้น `30000`)
- `--expect-final`: รอการตอบกลับสุดท้ายเมื่อการเรียก Gateway มี agent เป็นตัวขับเคลื่อน

เมื่อคุณส่ง `--url` CLI จะไม่ใช้ credentials จากคอนฟิกหรือ environment โดยอัตโนมัติ ให้ระบุ `--token` อย่างชัดเจนหาก Gateway เป้าหมายต้องการการยืนยันตัวตน

## ตัวอย่าง

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## หมายเหตุ

- ใช้ `--local-time` เพื่อแสดง timestamp ตามเขตเวลาท้องถิ่นของคุณ
- หาก Gateway แบบ local loopback ขอให้ทำ pairing, `openclaw logs` จะ fallback ไปใช้ไฟล์ล็อกในเครื่องที่กำหนดค่าไว้โดยอัตโนมัติ เป้าหมาย `--url` ที่ระบุอย่างชัดเจนจะไม่ใช้ fallback นี้

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การบันทึกล็อกของ Gateway](/th/gateway/logging)
