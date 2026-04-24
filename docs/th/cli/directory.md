---
read_when:
    - คุณต้องการค้นหา IDs ของผู้ติดต่อ/กลุ่ม/ตัวเองสำหรับช่องทางหนึ่ง
    - คุณกำลังพัฒนาอะแดปเตอร์ไดเรกทอรีของช่องทาง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw directory` (ตัวเอง เพื่อนร่วมงาน กลุ่ม)
title: ไดเรกทอรี
x-i18n:
    generated_at: "2026-04-24T09:02:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

การค้นหาไดเรกทอรีสำหรับช่องทางที่รองรับ (ผู้ติดต่อ/เพื่อนร่วมงาน กลุ่ม และ “ตัวฉัน”)

## แฟล็กทั่วไป

- `--channel <name>`: id/alias ของช่องทาง (จำเป็นเมื่อมีการกำหนดค่าหลายช่องทาง; ใช้อัตโนมัติเมื่อกำหนดค่าไว้เพียงช่องทางเดียว)
- `--account <id>`: account id (ค่าเริ่มต้น: ค่าเริ่มต้นของช่องทาง)
- `--json`: แสดงผลเป็น JSON

## หมายเหตุ

- `directory` มีไว้เพื่อช่วยคุณค้นหา IDs ที่สามารถนำไปวางในคำสั่งอื่นได้ (โดยเฉพาะ `openclaw message send --target ...`)
- สำหรับหลายช่องทาง ผลลัพธ์จะอิงตามคอนฟิก (allowlists / กลุ่มที่กำหนดค่าไว้) มากกว่าไดเรกทอรีสดจากผู้ให้บริการ
- เอาต์พุตเริ่มต้นคือ `id` (และบางครั้งมี `name`) คั่นด้วยแท็บ; ใช้ `--json` สำหรับงานสคริปต์

## การใช้ผลลัพธ์กับ `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## รูปแบบ ID (แยกตามช่องทาง)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (กลุ่ม)
- Telegram: `@username` หรือ numeric chat id; กลุ่มเป็น numeric ids
- Slack: `user:U…` และ `channel:C…`
- Discord: `user:<id>` และ `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` หรือ `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` และ `conversation:<id>`
- Zalo (Plugin): user id (Bot API)
- Zalo Personal / `zalouser` (Plugin): thread id (DM/กลุ่ม) จาก `zca` (`me`, `friend list`, `group list`)

## ตัวฉัน ("me")

```bash
openclaw directory self --channel zalouser
```

## เพื่อนร่วมงาน (ผู้ติดต่อ/ผู้ใช้)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## กลุ่ม

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
