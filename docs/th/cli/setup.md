---
read_when:
    - คุณกำลังทำการตั้งค่าครั้งแรกโดยไม่ใช้กระบวนการ onboarding แบบเต็มของ CLI
    - คุณต้องการตั้งค่าพาธเวิร์กสเปซเริ่มต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw setup` (เริ่มต้นคอนฟิก + เวิร์กสเปซ)
title: ตั้งค่า
x-i18n:
    generated_at: "2026-04-23T06:19:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

เริ่มต้น `~/.openclaw/openclaw.json` และเวิร์กสเปซของ agent

ที่เกี่ยวข้อง:

- เริ่มต้นใช้งาน: [เริ่มต้นใช้งาน](/th/start/getting-started)
- การ onboarding ผ่าน CLI: [Onboarding (CLI)](/th/start/wizard)

## ตัวอย่าง

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## ตัวเลือก

- `--workspace <dir>`: ไดเรกทอรีเวิร์กสเปซของ agent (บันทึกเป็น `agents.defaults.workspace`)
- `--wizard`: เรียกใช้ onboarding
- `--non-interactive`: เรียกใช้ onboarding โดยไม่มีพรอมป์
- `--mode <local|remote>`: โหมด onboarding
- `--remote-url <url>`: URL WebSocket ของ Gateway ระยะไกล
- `--remote-token <token>`: โทเค็นของ Gateway ระยะไกล

หากต้องการเรียกใช้ onboarding ผ่าน setup:

```bash
openclaw setup --wizard
```

หมายเหตุ:

- `openclaw setup` แบบธรรมดาจะเริ่มต้นคอนฟิก + เวิร์กสเปซ โดยไม่มีโฟลว์ onboarding เต็มรูปแบบ
- ระบบจะเรียกใช้ onboarding อัตโนมัติเมื่อมีแฟล็ก onboarding ใดๆ (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`)
