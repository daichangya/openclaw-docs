---
read_when:
    - การเพิ่มหรือเปลี่ยน integration ของ CLI ภายนอก
    - การดีบัก RPC adapter (signal-cli, imsg)
summary: RPC adapter สำหรับ CLI ภายนอก (signal-cli, imsg แบบเดิม) และรูปแบบของ gateway
title: RPC adapter
x-i18n:
    generated_at: "2026-04-23T05:55:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# RPC adapter

OpenClaw ผสานรวม CLI ภายนอกผ่าน JSON-RPC โดยปัจจุบันใช้สองรูปแบบ

## รูปแบบ A: HTTP daemon (`signal-cli`)

- `signal-cli` ทำงานเป็น daemon พร้อม JSON-RPC ผ่าน HTTP
- สตรีม event เป็น SSE (`/api/v1/events`)
- health probe: `/api/v1/check`
- OpenClaw เป็นเจ้าของวงจรชีวิตเมื่อ `channels.signal.autoStart=true`

ดู [Signal](/th/channels/signal) สำหรับการตั้งค่าและ endpoint

## รูปแบบ B: stdio child process (แบบเดิม: `imsg`)

> **หมายเหตุ:** สำหรับการตั้งค่า iMessage ใหม่ ให้ใช้ [BlueBubbles](/th/channels/bluebubbles) แทน

- OpenClaw spawn `imsg rpc` เป็น child process (integration แบบเดิมของ iMessage)
- JSON-RPC เป็นแบบแยกบรรทัดผ่าน stdin/stdout (หนึ่งออบเจ็กต์ JSON ต่อหนึ่งบรรทัด)
- ไม่มีพอร์ต TCP และไม่ต้องใช้ daemon

เมธอดหลักที่ใช้:

- `watch.subscribe` → การแจ้งเตือน (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostics)

ดู [iMessage](/th/channels/imessage) สำหรับการตั้งค่าแบบเดิมและการกำหนดปลายทาง (ควรใช้ `chat_id`)

## แนวทางของ adapter

- Gateway เป็นเจ้าของโปรเซส (การเริ่ม/หยุดผูกกับวงจรชีวิตของ provider)
- รักษา RPC client ให้ทนทาน: มี timeout, รีสตาร์ตเมื่อโปรเซสออก
- ควรใช้ ID ที่เสถียร (เช่น `chat_id`) แทนสตริงที่แสดงผล
