---
read_when:
    - คุณกำลังใช้ DM ในโหมดการจับคู่และต้องการอนุมัติผู้ส่ง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw pairing` (อนุมัติ/แสดงรายการคำขอจับคู่)
title: การจับคู่
x-i18n:
    generated_at: "2026-04-24T09:03:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

อนุมัติหรือตรวจสอบคำขอจับคู่ DM (สำหรับแชนแนลที่รองรับการจับคู่)

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

แสดงรายการคำขอจับคู่ที่รอดำเนินการสำหรับหนึ่งแชนแนล

ตัวเลือก:

- `[channel]`: channel id แบบระบุตำแหน่ง
- `--channel <channel>`: channel id แบบระบุชัดเจน
- `--account <accountId>`: account id สำหรับแชนแนลแบบหลายบัญชี
- `--json`: เอาต์พุตแบบ machine-readable

หมายเหตุ:

- หากมีหลายแชนแนลที่รองรับการจับคู่ถูกกำหนดค่าไว้ คุณต้องระบุแชนแนล ไม่ว่าจะเป็นแบบระบุตำแหน่งหรือด้วย `--channel`
- อนุญาตให้ใช้ extension channels ได้ ตราบใดที่ channel id ถูกต้อง

## `pairing approve`

อนุมัติรหัสการจับคู่ที่รอดำเนินการและอนุญาตผู้ส่งนั้น

การใช้งาน:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` เมื่อมีการกำหนดค่าแชนแนลที่รองรับการจับคู่ไว้เพียงหนึ่งแชนแนล

ตัวเลือก:

- `--channel <channel>`: channel id แบบระบุชัดเจน
- `--account <accountId>`: account id สำหรับแชนแนลแบบหลายบัญชี
- `--notify`: ส่งการยืนยันกลับไปยังผู้ร้องขอบนแชนแนลเดียวกัน

## หมายเหตุ

- อินพุตแชนแนล: ส่งแบบระบุตำแหน่ง (`pairing list telegram`) หรือด้วย `--channel <channel>`
- `pairing list` รองรับ `--account <accountId>` สำหรับแชนแนลแบบหลายบัญชี
- `pairing approve` รองรับ `--account <accountId>` และ `--notify`
- หากมีการกำหนดค่าแชนแนลที่รองรับการจับคู่ไว้เพียงหนึ่งแชนแนล อนุญาตให้ใช้ `pairing approve <code>` ได้

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Channel pairing](/th/channels/pairing)
