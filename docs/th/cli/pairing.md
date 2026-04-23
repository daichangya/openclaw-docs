---
read_when:
    - คุณกำลังใช้ข้อความส่วนตัวใน pairing-mode และต้องอนุมัติผู้ส่ง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw pairing` (อนุมัติ/แสดงรายการคำขอจับคู่)
title: pairing
x-i18n:
    generated_at: "2026-04-23T06:19:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

อนุมัติหรือตรวจสอบคำขอจับคู่ DM (สำหรับ channel ที่รองรับการจับคู่)

ที่เกี่ยวข้อง:

- โฟลว์การจับคู่: [Pairing](/th/channels/pairing)

## คำสั่ง

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

แสดงรายการคำขอจับคู่ที่รอดำเนินการสำหรับหนึ่ง channel

ตัวเลือก:

- `[channel]`: ID ของ channel แบบ positional
- `--channel <channel>`: ID ของ channel แบบระบุชัดเจน
- `--account <accountId>`: ID ของบัญชีสำหรับ channel แบบหลายบัญชี
- `--json`: เอาต์พุตที่เครื่องอ่านได้

หมายเหตุ:

- หากมีการตั้งค่า channel ที่รองรับการจับคู่หลายรายการ คุณต้องระบุ channel ไม่ว่าจะในรูปแบบ positional หรือด้วย `--channel`
- อนุญาตให้ใช้ channel ของ extension ได้ ตราบใดที่ ID ของ channel ถูกต้อง

## `pairing approve`

อนุมัติรหัสจับคู่ที่รอดำเนินการและอนุญาตผู้ส่งนั้น

การใช้งาน:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` เมื่อมีการตั้งค่า channel ที่รองรับการจับคู่ไว้เพียงหนึ่งรายการเท่านั้น

ตัวเลือก:

- `--channel <channel>`: ID ของ channel แบบระบุชัดเจน
- `--account <accountId>`: ID ของบัญชีสำหรับ channel แบบหลายบัญชี
- `--notify`: ส่งการยืนยันกลับไปยังผู้ร้องขอบน channel เดียวกัน

## หมายเหตุ

- อินพุต channel: ส่งแบบ positional (`pairing list telegram`) หรือด้วย `--channel <channel>`
- `pairing list` รองรับ `--account <accountId>` สำหรับ channel แบบหลายบัญชี
- `pairing approve` รองรับ `--account <accountId>` และ `--notify`
- หากมีการตั้งค่า channel ที่รองรับการจับคู่เพียงหนึ่งรายการ อนุญาตให้ใช้ `pairing approve <code>` ได้
