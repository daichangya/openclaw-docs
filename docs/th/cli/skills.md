---
read_when:
    - คุณต้องการดูว่า Skills ใดพร้อมใช้งานและพร้อมรันบ้าง
    - คุณต้องการค้นหา ติดตั้ง หรืออัปเดต Skills จาก ClawHub
    - คุณต้องการดีบักไบนารี/env/config ที่ขาดหายไปสำหรับ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw skills` (search/install/update/list/info/check)
title: skills
x-i18n:
    generated_at: "2026-04-23T06:19:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

ตรวจสอบ Skills ในเครื่อง และติดตั้ง/อัปเดต Skills จาก ClawHub

ที่เกี่ยวข้อง:

- ระบบ Skills: [Skills](/th/tools/skills)
- config ของ Skills: [Skills config](/th/tools/skills-config)
- การติดตั้ง ClawHub: [ClawHub](/th/tools/clawhub)

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
ของ workspace ที่กำลังใช้งานอยู่ ขณะที่ `list`/`info`/`check` ยังคงตรวจสอบ
Skills ในเครื่องที่มองเห็นได้จาก workspace และ config ปัจจุบัน

คำสั่ง CLI `install` นี้จะดาวน์โหลดโฟลเดอร์ skill จาก ClawHub ส่วนการติดตั้ง dependency
ของ skill ที่ถูกทริกเกอร์จาก onboarding หรือการตั้งค่า Skills ซึ่งทำงานผ่าน Gateway จะใช้
เส้นทางคำขอ `skills.install` แยกต่างหากแทน

หมายเหตุ:

- `search [query...]` รองรับ query แบบไม่บังคับ; หากไม่ระบุ จะเป็นการเรียกดูฟีดค้นหา ClawHub เริ่มต้น
- `search --limit <n>` จำกัดจำนวนผลลัพธ์ที่ส่งคืน
- `install --force` เขียนทับโฟลเดอร์ skill ใน workspace ที่มีอยู่แล้วสำหรับ
  slug เดียวกัน
- `update --all` จะอัปเดตเฉพาะการติดตั้ง ClawHub ที่ติดตามอยู่ใน workspace ที่กำลังใช้งาน
- `list` เป็นการทำงานเริ่มต้นเมื่อไม่ได้ระบุคำสั่งย่อย
- `list`, `info` และ `check` จะเขียนเอาต์พุตที่เรนเดอร์แล้วไปยัง stdout เมื่อใช้
  `--json` หมายความว่าเพย์โหลดที่เครื่องอ่านได้จะยังคงอยู่บน stdout สำหรับ pipe
  และสคริปต์
