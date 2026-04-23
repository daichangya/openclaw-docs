---
read_when:
    - คุณต้องติดตามล็อกของ Gateway จากระยะไกล (โดยไม่ใช้ SSH)
    - คุณต้องการบรรทัดล็อกแบบ JSON สำหรับเครื่องมือ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw logs` (ติดตามล็อก Gateway แบบต่อท้ายผ่าน RPC)
title: บันทึก日志
x-i18n:
    generated_at: "2026-04-23T06:18:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

ติดตามล็อกไฟล์ของ Gateway แบบต่อท้ายผ่าน RPC (ทำงานได้ในโหมด remote)

ที่เกี่ยวข้อง:

- ภาพรวมการบันทึกล็อก: [การบันทึกล็อก](/th/logging)
- Gateway CLI: [gateway](/th/cli/gateway)

## ตัวเลือก

- `--limit <n>`: จำนวนบรรทัดล็อกสูงสุดที่จะส่งกลับ (ค่าเริ่มต้น `200`)
- `--max-bytes <n>`: จำนวนไบต์สูงสุดที่จะอ่านจากไฟล์ล็อก (ค่าเริ่มต้น `250000`)
- `--follow`: ติดตามสตรีมล็อกต่อเนื่อง
- `--interval <ms>`: ช่วงเวลา polling ขณะติดตาม (ค่าเริ่มต้น `1000`)
- `--json`: ส่งอีเวนต์ JSON แบบหนึ่งบรรทัดต่อหนึ่งรายการ
- `--plain`: เอาต์พุตข้อความธรรมดาโดยไม่มีการจัดรูปแบบสไตล์
- `--no-color`: ปิดใช้งานสี ANSI
- `--local-time`: แสดงผลการประทับเวลาในเขตเวลาท้องถิ่นของคุณ

## ตัวเลือก Gateway RPC ที่ใช้ร่วมกัน

`openclaw logs` รองรับแฟล็กไคลเอนต์ Gateway มาตรฐานด้วย:

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: โทเค็นของ Gateway
- `--timeout <ms>`: หมดเวลาเป็นมิลลิวินาที (ค่าเริ่มต้น `30000`)
- `--expect-final`: รอการตอบกลับสุดท้ายเมื่อการเรียก Gateway ทำงานผ่าน agent

เมื่อคุณส่ง `--url` CLI จะไม่ใช้ข้อมูลรับรองจากคอนฟิกหรือสภาพแวดล้อมโดยอัตโนมัติ หาก Gateway เป้าหมายต้องใช้การยืนยันตัวตน ให้ระบุ `--token` อย่างชัดเจน

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

- ใช้ `--local-time` เพื่อแสดงผลการประทับเวลาในเขตเวลาท้องถิ่นของคุณ
- หาก local loopback Gateway ขอการจับคู่ `openclaw logs` จะกลับไปใช้ไฟล์ล็อกในเครื่องที่ตั้งค่าไว้โดยอัตโนมัติ เป้าหมาย `--url` แบบระบุชัดเจนจะไม่ใช้ fallback นี้
