---
read_when:
    - คุณกำลังทำการตั้งค่าเริ่มต้นครั้งแรกโดยไม่ใช้การเริ่มต้นใช้งาน CLI แบบเต็มรูปแบบ
    - คุณต้องการตั้งค่าเส้นทาง workspace เริ่มต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw setup` (เริ่มต้น config + workspace)
title: การตั้งค่าเริ่มต้น
x-i18n:
    generated_at: "2026-04-24T09:04:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

เริ่มต้น `~/.openclaw/openclaw.json` และ workspace ของเอเจนต์

ที่เกี่ยวข้อง:

- เริ่มต้นใช้งาน: [เริ่มต้นใช้งาน](/th/start/getting-started)
- การเริ่มต้นใช้งาน CLI: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

## ตัวอย่าง

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## ตัวเลือก

- `--workspace <dir>`: ไดเรกทอรี workspace ของเอเจนต์ (จัดเก็บเป็น `agents.defaults.workspace`)
- `--wizard`: รันการเริ่มต้นใช้งาน
- `--non-interactive`: รันการเริ่มต้นใช้งานโดยไม่ถาม
- `--mode <local|remote>`: โหมดการเริ่มต้นใช้งาน
- `--remote-url <url>`: URL WebSocket ของ Gateway ระยะไกล
- `--remote-token <token>`: token ของ Gateway ระยะไกล

หากต้องการรันการเริ่มต้นใช้งานผ่าน setup:

```bash
openclaw setup --wizard
```

หมายเหตุ:

- `openclaw setup` แบบปกติจะเริ่มต้น config + workspace โดยไม่ใช้ขั้นตอนการเริ่มต้นใช้งานแบบเต็ม
- การเริ่มต้นใช้งานจะรันอัตโนมัติเมื่อมีแฟลกการเริ่มต้นใช้งานใด ๆ (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ภาพรวมการติดตั้ง](/th/install)
