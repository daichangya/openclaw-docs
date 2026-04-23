---
read_when:
    - คุณต้องการตรวจสอบ ตรวจประเมิน หรือยกเลิกรายการงานเบื้องหลัง
    - คุณกำลังจัดทำเอกสารคำสั่ง TaskFlow ภายใต้ `openclaw tasks flow`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw tasks` (บัญชีงานเบื้องหลังและสถานะ TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T06:19:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

ตรวจสอบงานเบื้องหลังแบบคงทนและสถานะ TaskFlow เมื่อไม่มีคำสั่งย่อย
`openclaw tasks` จะเทียบเท่ากับ `openclaw tasks list`

ดู [งานเบื้องหลัง](/th/automation/tasks) สำหรับวงจรชีวิตและโมเดลการส่งมอบ

## การใช้งาน

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## ตัวเลือกระดับราก

- `--json`: แสดงผลเป็น JSON
- `--runtime <name>`: กรองตามชนิด: `subagent`, `acp`, `cron` หรือ `cli`
- `--status <name>`: กรองตามสถานะ: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` หรือ `lost`

## คำสั่งย่อย

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

แสดงรายการงานเบื้องหลังที่ติดตามไว้ โดยเรียงจากใหม่สุดก่อน

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

แสดงงานหนึ่งรายการตาม task ID, run ID หรือ session key

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

เปลี่ยนนโยบายการแจ้งเตือนสำหรับงานที่กำลังทำงานอยู่

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

ยกเลิกงานเบื้องหลังที่กำลังทำงานอยู่

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

แสดงรายการงานและระเบียน TaskFlow ที่เก่า สูญหาย ส่งมอบล้มเหลว หรือไม่สอดคล้องกันในลักษณะอื่น

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

แสดงตัวอย่างหรือปรับใช้การกระทบยอด การประทับตราการล้างข้อมูล และการตัดทอนของงานและ TaskFlow

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

ตรวจสอบหรือยกเลิกสถานะ TaskFlow แบบคงทนภายใต้บัญชีงาน
