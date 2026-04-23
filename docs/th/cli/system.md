---
read_when:
    - คุณต้องการเพิ่มเหตุการณ์ของระบบเข้าคิวโดยไม่ต้องสร้างงาน Cron【อ่านข้อความเต็มanalysis to=final code  sorry
    - คุณต้องเปิดหรือปิด Heartbeat
    - คุณต้องการตรวจสอบรายการการแสดงสถานะของระบบ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw system` (เหตุการณ์ของระบบ, Heartbeat, การแสดงสถานะ)
title: system
x-i18n:
    generated_at: "2026-04-23T06:19:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

ตัวช่วยระดับระบบสำหรับ Gateway: เพิ่มเหตุการณ์ของระบบเข้าคิว ควบคุม Heartbeat
และดูการแสดงสถานะ

คำสั่งย่อย `system` ทั้งหมดใช้ Gateway RPC และรองรับแฟล็กไคลเอนต์ที่ใช้ร่วมกันดังนี้:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## คำสั่งทั่วไป

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

เพิ่มเหตุการณ์ของระบบเข้าคิวในเซสชัน **main** Heartbeat ครั้งถัดไปจะฉีด
เหตุการณ์นั้นเข้าไปเป็นบรรทัด `System:` ในพรอมป์ต์ ใช้ `--mode now` เพื่อทริกเกอร์ Heartbeat
ทันที; `next-heartbeat` จะรอรอบ tick ที่กำหนดไว้ถัดไป

แฟล็ก:

- `--text <text>`: ข้อความเหตุการณ์ของระบบที่จำเป็นต้องระบุ
- `--mode <mode>`: `now` หรือ `next-heartbeat` (ค่าเริ่มต้น)
- `--json`: เอาต์พุตที่เครื่องอ่านได้
- `--url`, `--token`, `--timeout`, `--expect-final`: แฟล็ก Gateway RPC ที่ใช้ร่วมกัน

## `system heartbeat last|enable|disable`

การควบคุม Heartbeat:

- `last`: แสดงเหตุการณ์ Heartbeat ล่าสุด
- `enable`: เปิด Heartbeat กลับมาอีกครั้ง (ใช้เมื่อตอนก่อนหน้านี้ถูกปิดไว้)
- `disable`: หยุด Heartbeat ชั่วคราว

แฟล็ก:

- `--json`: เอาต์พุตที่เครื่องอ่านได้
- `--url`, `--token`, `--timeout`, `--expect-final`: แฟล็ก Gateway RPC ที่ใช้ร่วมกัน

## `system presence`

แสดงรายการการแสดงสถานะของระบบปัจจุบันที่ Gateway รับรู้ (nodes,
instances และบรรทัดสถานะที่คล้ายกัน)

แฟล็ก:

- `--json`: เอาต์พุตที่เครื่องอ่านได้
- `--url`, `--token`, `--timeout`, `--expect-final`: แฟล็ก Gateway RPC ที่ใช้ร่วมกัน

## หมายเหตุ

- ต้องมี Gateway ที่กำลังทำงานและเข้าถึงได้ผ่าน config ปัจจุบันของคุณ (local หรือ remote)
- เหตุการณ์ของระบบเป็นข้อมูลชั่วคราวและจะไม่ถูกเก็บคงไว้ข้ามการรีสตาร์ต
