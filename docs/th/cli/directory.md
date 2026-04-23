---
read_when:
    - คุณต้องการค้นหารหัสผู้ติดต่อ/กลุ่ม/ตัวเองสำหรับช่องทางหนึ่ง
    - คุณกำลังพัฒนาอะแดปเตอร์ไดเรกทอรีของช่องทาง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw directory` (ตัวเอง, peers, groups)
title: ไดเรกทอรี
x-i18n:
    generated_at: "2026-04-23T06:17:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

การค้นหาไดเรกทอรีสำหรับ channels ที่รองรับ (ผู้ติดต่อ/peers, groups และ “me”)

## แฟลกทั่วไป

- `--channel <name>`: id/นามแฝงของ channel (จำเป็นเมื่อมีการตั้งค่าหลาย channels; ระบุอัตโนมัติเมื่อมีการตั้งค่าไว้เพียงหนึ่งเดียว)
- `--account <id>`: id ของบัญชี (ค่าเริ่มต้น: ค่าเริ่มต้นของ channel)
- `--json`: แสดงผลเป็น JSON

## หมายเหตุ

- `directory` มีไว้เพื่อช่วยคุณค้นหา ID ที่สามารถนำไปวางในคำสั่งอื่นได้ (โดยเฉพาะ `openclaw message send --target ...`)
- สำหรับหลาย channels ผลลัพธ์จะอิงตาม config (allowlists / groups ที่ตั้งค่าไว้) มากกว่าจะเป็นไดเรกทอรีสดจาก provider
- เอาต์พุตเริ่มต้นคือ `id` (และบางครั้งมี `name`) คั่นด้วยแท็บ; ใช้ `--json` สำหรับการเขียนสคริปต์

## การใช้ผลลัพธ์กับ `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## รูปแบบ ID (ตาม channel)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (group)
- Telegram: `@username` หรือ chat id แบบตัวเลข; groups ใช้ id แบบตัวเลข
- Slack: `user:U…` และ `channel:C…`
- Discord: `user:<id>` และ `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` หรือ `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` และ `conversation:<id>`
- Zalo (Plugin): user id (Bot API)
- Zalo Personal / `zalouser` (Plugin): thread id (DM/group) จาก `zca` (`me`, `friend list`, `group list`)

## ตัวเอง ("me")

```bash
openclaw directory self --channel zalouser
```

## Peers (ผู้ติดต่อ/ผู้ใช้)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Groups

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```
