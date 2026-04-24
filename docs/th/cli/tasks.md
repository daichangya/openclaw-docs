---
read_when:
    - คุณต้องการตรวจสอบ ตรวจสอบย้อนหลัง หรือยกเลิกระเบียนงานเบื้องหลัง
    - คุณกำลังจัดทำเอกสารคำสั่ง Task Flow ภายใต้ `openclaw tasks flow`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw tasks` (บัญชีรายการงานเบื้องหลังและสถานะ Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T09:04:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

ตรวจสอบงานเบื้องหลังแบบคงทนและสถานะ Task Flow โดยเมื่อไม่มี subcommand
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

แสดงรายการงานเบื้องหลังที่ติดตามไว้ โดยเรียงจากใหม่ไปเก่า

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

แสดง task หนึ่งรายการตาม task ID, run ID หรือ session key

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

เปลี่ยนนโยบายการแจ้งเตือนสำหรับ task ที่กำลังทำงานอยู่

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

ยกเลิกงานเบื้องหลังที่กำลังทำงานอยู่

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

แสดงระเบียน task และ Task Flow ที่ค้าง สูญหาย ส่งมอบล้มเหลว หรือไม่สอดคล้องกันในลักษณะอื่น

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

แสดงตัวอย่างหรือปรับใช้การกระทบยอด Task และ Task Flow การประทับตราการล้างข้อมูล และการตัดทิ้ง

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

ตรวจสอบหรือยกเลิกสถานะ Task Flow แบบคงทนภายใต้บัญชีรายการ task

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [งานเบื้องหลัง](/th/automation/tasks)
