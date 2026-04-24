---
read_when:
    - คุณต้องการใส่ system event เข้าแถวโดยไม่สร้างงาน Cron
    - คุณต้องการเปิดหรือปิด Heartbeat
    - คุณต้องการตรวจสอบรายการ presence ของระบบ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw system` (system events, Heartbeat, presence)
title: ระบบ
x-i18n:
    generated_at: "2026-04-24T09:04:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

ตัวช่วยระดับระบบสำหรับ Gateway: ใส่ system events เข้าแถว ควบคุม Heartbeat
และดู presence

subcommands ทั้งหมดของ `system` ใช้ Gateway RPC และรองรับแฟลกไคลเอนต์ที่ใช้ร่วมกัน:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## คำสั่งที่ใช้บ่อย

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

ใส่ system event เข้าแถวใน session **หลัก** Heartbeat ครั้งถัดไปจะฉีด
เหตุการณ์นี้เป็นบรรทัด `System:` ในพรอมป์ต์ ใช้ `--mode now` เพื่อทริกเกอร์ Heartbeat
ทันที; `next-heartbeat` จะรอ tick ตามกำหนดครั้งถัดไป

แฟลก:

- `--text <text>`: ข้อความ system event ที่จำเป็น
- `--mode <mode>`: `now` หรือ `next-heartbeat` (ค่าเริ่มต้น)
- `--json`: เอาต์พุตแบบเครื่องอ่านได้
- `--url`, `--token`, `--timeout`, `--expect-final`: แฟลก Gateway RPC ที่ใช้ร่วมกัน

## `system heartbeat last|enable|disable`

ตัวควบคุม Heartbeat:

- `last`: แสดงเหตุการณ์ Heartbeat ล่าสุด
- `enable`: เปิด Heartbeat กลับมาอีกครั้ง (ใช้เมื่อถูกปิดไว้)
- `disable`: หยุด Heartbeat ชั่วคราว

แฟลก:

- `--json`: เอาต์พุตแบบเครื่องอ่านได้
- `--url`, `--token`, `--timeout`, `--expect-final`: แฟลก Gateway RPC ที่ใช้ร่วมกัน

## `system presence`

แสดงรายการ presence ของระบบปัจจุบันที่ Gateway รู้จัก (Nodes,
instances และบรรทัดสถานะในลักษณะเดียวกัน)

แฟลก:

- `--json`: เอาต์พุตแบบเครื่องอ่านได้
- `--url`, `--token`, `--timeout`, `--expect-final`: แฟลก Gateway RPC ที่ใช้ร่วมกัน

## หมายเหตุ

- ต้องมี Gateway ที่กำลังรันและเข้าถึงได้ตาม config ปัจจุบันของคุณ (โลคัลหรือระยะไกล)
- system events เป็นแบบชั่วคราวและจะไม่ถูกเก็บไว้ข้ามการรีสตาร์ต

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
