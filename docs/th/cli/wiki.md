---
read_when:
    - คุณต้องการใช้ CLI ของ memory-wiki
    - คุณกำลังจัดทำเอกสารหรือแก้ไข `openclaw wiki`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw wiki` (สถานะ vault ของ memory-wiki, การค้นหา, compile, lint, apply, bridge และตัวช่วย Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-24T09:05:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

ตรวจสอบและดูแล vault ของ `memory-wiki`

จัดให้โดย bundled plugin `memory-wiki`

ที่เกี่ยวข้อง:

- [Memory Wiki plugin](/th/plugins/memory-wiki)
- [Memory Overview](/th/concepts/memory)
- [CLI: memory](/th/cli/memory)

## ใช้ทำอะไร

ใช้ `openclaw wiki` เมื่อคุณต้องการ knowledge vault แบบ compile แล้วซึ่งมี:

- การค้นหาและการอ่านหน้าแบบ native ของ wiki
- syntheses ที่มี provenance ครบถ้วน
- รายงานความขัดแย้งและความใหม่ของข้อมูล
- การนำเข้าแบบ bridge จาก memory plugin ที่กำลังใช้งานอยู่
- ตัวช่วย CLI ของ Obsidian แบบไม่บังคับ

## คำสั่งที่ใช้บ่อย

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## คำสั่ง

### `wiki status`

ตรวจสอบโหมด vault ปัจจุบัน สุขภาพของระบบ และความพร้อมใช้งานของ Obsidian CLI

ใช้คำสั่งนี้ก่อนเมื่อคุณไม่แน่ใจว่า vault ถูกเริ่มต้นแล้วหรือไม่ โหมด bridge
ปกติดีหรือไม่ หรือมีการเชื่อมต่อกับ Obsidian หรือไม่

### `wiki doctor`

รันการตรวจสอบสุขภาพของ wiki และแสดงปัญหาของ config หรือ vault

ปัญหาที่พบบ่อย ได้แก่:

- เปิดโหมด bridge แต่ไม่มี public memory artifacts
- โครงสร้าง vault ไม่ถูกต้องหรือไม่มีอยู่
- ไม่มี Obsidian CLI ภายนอก ทั้งที่คาดว่าจะใช้โหมด Obsidian

### `wiki init`

สร้างโครงสร้าง vault ของ wiki และหน้าตั้งต้น

คำสั่งนี้จะเริ่มต้นโครงสร้างราก รวมถึงดัชนีระดับบนสุดและไดเรกทอรี
cache

### `wiki ingest <path-or-url>`

นำเข้าเนื้อหาเข้าสู่ source layer ของ wiki

หมายเหตุ:

- การ ingest จาก URL ถูกควบคุมด้วย `ingest.allowUrlIngest`
- หน้าซอร์สที่นำเข้าจะเก็บ provenance ไว้ใน frontmatter
- หากเปิดใช้งานไว้ ระบบสามารถรัน auto-compile หลัง ingest ได้

### `wiki compile`

สร้างดัชนี บล็อกที่เกี่ยวข้อง dashboards และ compiled digests ใหม่

คำสั่งนี้จะเขียน artifacts ที่คงที่สำหรับการใช้งานโดยเครื่องไว้ภายใต้:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

หากเปิดใช้ `render.createDashboards` การ compile จะรีเฟรชหน้ารายงานด้วย

### `wiki lint`

lint vault และรายงาน:

- ปัญหาเชิงโครงสร้าง
- ช่องว่างของ provenance
- ความขัดแย้ง
- คำถามที่ยังเปิดอยู่
- หน้า/claims ที่มีความเชื่อมั่นต่ำ
- หน้า/claims ที่ล้าสมัย

ให้รันคำสั่งนี้หลังมีการอัปเดต wiki ที่สำคัญ

### `wiki search <query>`

ค้นหาเนื้อหาใน wiki

พฤติกรรมขึ้นอยู่กับ config:

- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory` หรือ `all`

ใช้ `wiki search` เมื่อคุณต้องการการจัดอันดับหรือรายละเอียด provenance
เฉพาะของ wiki สำหรับการดึงข้อมูลกว้างๆ แบบ shared เพียงรอบเดียว ให้ใช้ `openclaw memory search`
เมื่อ memory plugin ที่กำลังใช้งานอยู่เปิดให้ใช้ shared search

### `wiki get <lookup>`

อ่านหน้าของ wiki ตาม id หรือ relative path

ตัวอย่าง:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

ใช้การเปลี่ยนแปลงแบบแคบโดยไม่ต้องผ่าตัดหน้าแบบ freeform

flow ที่รองรับ ได้แก่:

- สร้าง/อัปเดตหน้า synthesis
- อัปเดต metadata ของหน้า
- แนบ source ids
- เพิ่มคำถาม
- เพิ่มความขัดแย้ง
- อัปเดต confidence/status
- เขียน claims แบบมีโครงสร้าง

คำสั่งนี้มีไว้เพื่อให้ wiki พัฒนาได้อย่างปลอดภัย โดยไม่ต้องแก้ไขบล็อกที่ถูกจัดการ
ด้วยตนเอง

### `wiki bridge import`

นำเข้า public memory artifacts จาก memory plugin ที่กำลังใช้งานอยู่เข้าสู่ source pages
ที่รองรับโดย bridge

ใช้คำสั่งนี้ในโหมด `bridge` เมื่อคุณต้องการดึง memory artifacts ที่เพิ่ง export ล่าสุด
เข้าสู่ wiki vault

### `wiki unsafe-local import`

นำเข้าจากพาธในเครื่องที่กำหนดไว้อย่างชัดเจนในโหมด `unsafe-local`

ฟีเจอร์นี้เป็นแบบทดลองโดยตั้งใจ และใช้ได้เฉพาะบนเครื่องเดียวกันเท่านั้น

### `wiki obsidian ...`

คำสั่งตัวช่วย Obsidian สำหรับ vault ที่ทำงานในโหมดที่เป็นมิตรกับ Obsidian

คำสั่งย่อย:

- `status`
- `search`
- `open`
- `command`
- `daily`

คำสั่งเหล่านี้ต้องใช้ CLI ทางการ `obsidian` บน `PATH` เมื่อ
เปิดใช้ `obsidian.useOfficialCli`

## แนวทางการใช้งานจริง

- ใช้ `wiki search` + `wiki get` เมื่อ provenance และตัวตนของหน้ามีความสำคัญ
- ใช้ `wiki apply` แทนการแก้ไขส่วนที่ถูกสร้างและจัดการอัตโนมัติด้วยมือ
- ใช้ `wiki lint` ก่อนเชื่อถือเนื้อหาที่ขัดแย้งกันหรือมีความเชื่อมั่นต่ำ
- ใช้ `wiki compile` หลังนำเข้าข้อมูลจำนวนมากหรือหลังมีการเปลี่ยนแปลงซอร์ส เมื่อคุณต้องการ
  dashboards และ compiled digests ที่อัปเดตทันที
- ใช้ `wiki bridge import` เมื่อโหมด bridge ต้องพึ่งพา memory artifacts
  ที่เพิ่ง export ใหม่

## ความเชื่อมโยงกับ config

พฤติกรรมของ `openclaw wiki` ถูกกำหนดโดย:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

ดู [Memory Wiki plugin](/th/plugins/memory-wiki) สำหรับโมเดล config แบบเต็ม

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Memory wiki](/th/plugins/memory-wiki)
