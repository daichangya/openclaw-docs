---
read_when:
    - คุณต้องการดูว่า Skills ใดพร้อมใช้งานและพร้อมรันแล้ว
    - คุณต้องการค้นหา ติดตั้ง หรืออัปเดต Skills จาก ClawHub
    - คุณต้องการแก้ปัญหาไบนารี/ตัวแปรแวดล้อม/คอนฟิกที่ขาดหายสำหรับ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw skills` (ค้นหา/ติดตั้ง/อัปเดต/แสดงรายการ/ข้อมูล/ตรวจสอบ)
title: Skills
x-i18n:
    generated_at: "2026-04-24T09:04:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

ตรวจสอบ Skills ในเครื่อง และติดตั้ง/อัปเดต Skills จาก ClawHub

ที่เกี่ยวข้อง:

- ระบบ Skills: [Skills](/th/tools/skills)
- คอนฟิก Skills: [คอนฟิก Skills](/th/tools/skills-config)
- การติดตั้งจาก ClawHub: [ClawHub](/th/tools/clawhub)

## คำสั่ง

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` ใช้ ClawHub โดยตรงและติดตั้งลงในไดเรกทอรี `skills/`
ของ workspace ที่ใช้งานอยู่ ส่วน `list`/`info`/`check` ยังคงตรวจสอบ
Skills ในเครื่องที่มองเห็นได้จาก workspace และคอนฟิกปัจจุบัน

คำสั่ง `install` ของ CLI นี้จะดาวน์โหลดโฟลเดอร์ skill จาก ClawHub การติดตั้ง dependency
ของ skill ที่ถูกทริกเกอร์จาก onboarding หรือการตั้งค่า Skills ซึ่งอาศัย Gateway
จะใช้เส้นทางคำขอ `skills.install` แยกต่างหากแทน

หมายเหตุ:

- `search [query...]` รับคำค้นหาแบบไม่บังคับ; หากไม่ระบุ จะเป็นการเรียกดู feed ค้นหาเริ่มต้นของ
  ClawHub
- `search --limit <n>` จำกัดจำนวนผลลัพธ์ที่ส่งกลับ
- `install --force` จะเขียนทับโฟลเดอร์ skill ของ workspace ที่มีอยู่แล้วสำหรับ
  slug เดียวกัน
- `update --all` จะอัปเดตเฉพาะการติดตั้งจาก ClawHub ที่ติดตามไว้ใน workspace ที่ใช้งานอยู่
- `list` คือการกระทำค่าปริยายเมื่อไม่ได้ระบุ subcommand
- `list`, `info` และ `check` จะเขียนผลลัพธ์ที่ render แล้วไปยัง stdout เมื่อใช้
  `--json` หมายความว่า payload แบบ machine-readable จะยังคงอยู่บน stdout สำหรับ pipe
  และสคริปต์

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Skills](/th/tools/skills)
