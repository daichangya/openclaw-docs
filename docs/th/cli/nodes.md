---
read_when:
    - คุณกำลังจัดการ Node ที่จับคู่ไว้ (กล้อง, หน้าจอ, canvas)
    - คุณต้องอนุมัติคำขอหรือเรียกใช้คำสั่งของ Node
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Node
x-i18n:
    generated_at: "2026-04-24T09:03:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

จัดการ Node (อุปกรณ์) ที่จับคู่ไว้ และเรียกใช้ความสามารถของ Node

ที่เกี่ยวข้อง:

- ภาพรวมของ Node: [Nodes](/th/nodes)
- กล้อง: [Camera nodes](/th/nodes/camera)
- รูปภาพ: [Image nodes](/th/nodes/images)

ตัวเลือกที่ใช้บ่อย:

- `--url`, `--token`, `--timeout`, `--json`

## คำสั่งที่ใช้บ่อย

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` จะแสดงตาราง pending/paired แถวที่จับคู่แล้วจะรวมอายุการเชื่อมต่อล่าสุด (Last Connect)
ใช้ `--connected` เพื่อแสดงเฉพาะ Node ที่เชื่อมต่ออยู่ในขณะนี้ ใช้ `--last-connected <duration>` เพื่อ
กรองเฉพาะ Node ที่เชื่อมต่อภายในช่วงเวลาที่กำหนด (เช่น `24h`, `7d`)

หมายเหตุเกี่ยวกับการอนุมัติ:

- `openclaw nodes pending` ต้องการเพียงขอบเขต pairing
- `openclaw nodes approve <requestId>` จะสืบทอดข้อกำหนดขอบเขตเพิ่มเติมจาก
  คำขอที่รอดำเนินการ:
  - คำขอที่ไม่มีคำสั่ง: pairing เท่านั้น
  - คำสั่งของ Node ที่ไม่ใช่ exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

แฟล็กของ invoke:

- `--params <json>`: สตริงออบเจ็กต์ JSON (ค่าเริ่มต้น `{}`)
- `--invoke-timeout <ms>`: ระยะหมดเวลาของการ invoke บน Node (ค่าเริ่มต้น `15000`)
- `--idempotency-key <key>`: คีย์ idempotency แบบไม่บังคับ
- `system.run` และ `system.run.prepare` ถูกบล็อกที่นี่; ให้ใช้เครื่องมือ `exec` กับ `host=node` สำหรับการรัน shell

สำหรับการรัน shell บน Node ให้ใช้เครื่องมือ `exec` กับ `host=node` แทน `openclaw nodes run`
ตอนนี้ CLI ของ `nodes` เน้นที่ความสามารถ: RPC โดยตรงผ่าน `nodes invoke` พร้อมด้วยการจับคู่ กล้อง
หน้าจอ ตำแหน่ง canvas และการแจ้งเตือน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Nodes](/th/nodes)
