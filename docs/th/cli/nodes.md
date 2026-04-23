---
read_when:
    - คุณกำลังจัดการ Nodes ที่จับคู่ไว้แล้ว (cameras, screen, canvas)
    - คุณต้องอนุมัติคำขอหรือเรียกใช้คำสั่งของ node
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw nodes` (สถานะ, การจับคู่, invoke, camera/canvas/screen)
title: Nodes
x-i18n:
    generated_at: "2026-04-23T06:18:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

จัดการ Nodes (อุปกรณ์) ที่จับคู่ไว้แล้ว และเรียกใช้ความสามารถของ node

ที่เกี่ยวข้อง:

- ภาพรวมของ Nodes: [Nodes](/th/nodes)
- กล้อง: [Camera nodes](/th/nodes/camera)
- รูปภาพ: [Image nodes](/th/nodes/images)

ตัวเลือกทั่วไป:

- `--url`, `--token`, `--timeout`, `--json`

## คำสั่งทั่วไป

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
ใช้ `--connected` เพื่อแสดงเฉพาะ nodes ที่เชื่อมต่ออยู่ในขณะนี้ ใช้ `--last-connected <duration>` เพื่อ
กรองให้เหลือเฉพาะ nodes ที่เชื่อมต่อภายในช่วงเวลาที่กำหนด (เช่น `24h`, `7d`)

หมายเหตุเกี่ยวกับการอนุมัติ:

- `openclaw nodes pending` ต้องใช้เฉพาะขอบเขต pairing เท่านั้น
- `openclaw nodes approve <requestId>` จะสืบทอดข้อกำหนดด้านขอบเขตเพิ่มเติมจาก
  คำขอที่รออยู่:
  - คำขอที่ไม่มีคำสั่ง: pairing เท่านั้น
  - คำสั่ง node ที่ไม่ใช่ exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

แฟล็กของ invoke:

- `--params <json>`: สตริงออบเจ็กต์ JSON (ค่าเริ่มต้น `{}`).
- `--invoke-timeout <ms>`: ระยะหมดเวลาของ node invoke (ค่าเริ่มต้น `15000`).
- `--idempotency-key <key>`: คีย์ idempotency แบบไม่บังคับ
- `system.run` และ `system.run.prepare` ถูกบล็อกที่นี่; ให้ใช้เครื่องมือ `exec` กับ `host=node` สำหรับการรัน shell

สำหรับการรัน shell บน node ให้ใช้เครื่องมือ `exec` กับ `host=node` แทน `openclaw nodes run`
ขณะนี้ CLI `nodes` มุ่งเน้นที่ความสามารถ: direct RPC ผ่าน `nodes invoke` รวมถึง pairing, camera,
screen, location, canvas และ notifications
