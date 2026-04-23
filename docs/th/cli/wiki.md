---
read_when:
    - คุณต้องการใช้ CLI ของ memory-wiki
    - คุณกำลังจัดทำเอกสารหรือเปลี่ยนแปลง `openclaw wiki`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw wiki` (สถานะคลัง memory-wiki, การค้นหา, การคอมไพล์, การ lint, การ apply, สะพาน และตัวช่วยสำหรับ Obsidian)
title: วิกิ
x-i18n:
    generated_at: "2026-04-23T06:20:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

ตรวจสอบและดูแลคลัง `memory-wiki`

จัดเตรียมโดย Plugin `memory-wiki` ที่มาพร้อมในชุด

ที่เกี่ยวข้อง:

- [Plugin Memory Wiki](/th/plugins/memory-wiki)
- [ภาพรวม Memory](/th/concepts/memory)
- [CLI: memory](/th/cli/memory)

## ใช้สำหรับอะไร

ใช้ `openclaw wiki` เมื่อต้องการคลังความรู้ที่คอมไพล์แล้วพร้อมคุณสมบัติดังนี้:

- การค้นหาและการอ่านหน้าแบบ native ของวิกิ
- การสังเคราะห์ที่มี provenance ครบถ้วน
- รายงานความขัดแย้งและความสดใหม่
- การนำเข้าผ่านสะพานจาก Plugin memory ที่ใช้งานอยู่
- ตัวช่วย CLI สำหรับ Obsidian แบบไม่บังคับ

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

ตรวจสอบโหมดคลังปัจจุบัน สถานะสุขภาพ และความพร้อมใช้งานของ Obsidian CLI

ใช้คำสั่งนี้ก่อนเมื่อคุณยังไม่แน่ใจว่าคลังถูกเริ่มต้นแล้วหรือยัง โหมดสะพาน
มีสถานะดีหรือไม่ หรือมีการผสานรวมกับ Obsidian พร้อมใช้งานหรือไม่

### `wiki doctor`

เรียกใช้การตรวจสอบสุขภาพของวิกิและแสดงปัญหาคอนฟิกหรือปัญหาคลัง

ปัญหาที่พบบ่อยได้แก่:

- เปิดใช้โหมดสะพานโดยไม่มีอาร์ติแฟกต์ memory แบบสาธารณะ
- โครงร่างคลังไม่ถูกต้องหรือไม่มีอยู่
- ไม่มี Obsidian CLI ภายนอก ทั้งที่คาดว่าจะใช้โหมด Obsidian

### `wiki init`

สร้างโครงร่างคลังวิกิและหน้าเริ่มต้น

คำสั่งนี้จะเริ่มต้นโครงสร้างราก รวมถึงดัชนีระดับบนสุดและไดเรกทอรี
แคช

### `wiki ingest <path-or-url>`

นำเข้าเนื้อหาเข้าสู่ชั้น source ของวิกิ

หมายเหตุ:

- การนำเข้าจาก URL ถูกควบคุมโดย `ingest.allowUrlIngest`
- หน้า source ที่นำเข้าจะเก็บ provenance ไว้ใน frontmatter
- สามารถรันการคอมไพล์อัตโนมัติหลังการนำเข้าได้เมื่อเปิดใช้งาน

### `wiki compile`

สร้างดัชนี บล็อกที่เกี่ยวข้อง แดชบอร์ด และ digest ที่คอมไพล์แล้วขึ้นใหม่

คำสั่งนี้จะเขียนอาร์ติแฟกต์แบบคงที่สำหรับเครื่องไว้ที่:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

หากเปิดใช้ `render.createDashboards` การคอมไพล์จะรีเฟรชหน้ารายงานด้วย

### `wiki lint`

lint คลังและรายงาน:

- ปัญหาเชิงโครงสร้าง
- ช่องว่างของ provenance
- ความขัดแย้ง
- คำถามที่ยังเปิดอยู่
- หน้า/claims ที่มีความเชื่อมั่นต่ำ
- หน้า/claims ที่ล้าสมัย

ให้รันหลังจากมีการอัปเดตวิกิที่มีนัยสำคัญ

### `wiki search <query>`

ค้นหาเนื้อหาในวิกิ

พฤติกรรมขึ้นอยู่กับคอนฟิก:

- `search.backend`: `shared` หรือ `local`
- `search.corpus`: `wiki`, `memory`, หรือ `all`

ใช้ `wiki search` เมื่อต้องการการจัดอันดับหรือรายละเอียด provenance
เฉพาะของวิกิ สำหรับการเรียกคืนแบบแชร์กว้างๆ เพียงครั้งเดียว ให้ใช้
`openclaw memory search` เมื่อ Plugin memory ที่ใช้งานอยู่เปิดเผยการค้นหาแบบแชร์

### `wiki get <lookup>`

อ่านหน้าวิกิตาม id หรือพาธสัมพัทธ์

ตัวอย่าง:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

ใช้การเปลี่ยนแปลงแบบจำกัดขอบเขตโดยไม่ต้องผ่าตัดหน้าแบบ freeform

โฟลว์ที่รองรับ ได้แก่:

- สร้าง/อัปเดตหน้าสังเคราะห์
- อัปเดต metadata ของหน้า
- แนบ source id
- เพิ่มคำถาม
- เพิ่มความขัดแย้ง
- อัปเดตความเชื่อมั่น/สถานะ
- เขียน claims แบบมีโครงสร้าง

คำสั่งนี้มีไว้เพื่อให้วิกิพัฒนาได้อย่างปลอดภัยโดยไม่ต้องแก้ไข
บล็อกที่ระบบจัดการด้วยตนเองโดยตรง

### `wiki bridge import`

นำเข้าอาร์ติแฟกต์ memory แบบสาธารณะจาก Plugin memory ที่ใช้งานอยู่เข้าสู่หน้า source
ที่รองรับโดยสะพาน

ใช้คำสั่งนี้ในโหมด `bridge` เมื่อต้องการดึงอาร์ติแฟกต์ memory ที่ส่งออกล่าสุด
เข้าสู่คลังวิกิ

### `wiki unsafe-local import`

นำเข้าจากพาธภายในเครื่องที่กำหนดไว้อย่างชัดเจนในโหมด `unsafe-local`

นี่เป็นฟีเจอร์เชิงทดลองโดยตั้งใจและใช้ได้เฉพาะบนเครื่องเดียวกันเท่านั้น

### `wiki obsidian ...`

คำสั่งตัวช่วย Obsidian สำหรับคลังที่ทำงานในโหมดที่เป็นมิตรกับ Obsidian

คำสั่งย่อย:

- `status`
- `search`
- `open`
- `command`
- `daily`

คำสั่งเหล่านี้ต้องใช้ `obsidian` CLI อย่างเป็นทางการใน `PATH` เมื่อ
เปิดใช้ `obsidian.useOfficialCli`

## แนวทางการใช้งานจริง

- ใช้ `wiki search` + `wiki get` เมื่อ provenance และตัวตนของหน้ามีความสำคัญ
- ใช้ `wiki apply` แทนการแก้ไขส่วนที่ระบบสร้างและจัดการเองด้วยมือ
- ใช้ `wiki lint` ก่อนเชื่อถือเนื้อหาที่มีความขัดแย้งหรือมีความเชื่อมั่นต่ำ
- ใช้ `wiki compile` หลังการนำเข้าจำนวนมากหรือหลังเปลี่ยน source เมื่อคุณต้องการ
  แดชบอร์ดและ digest ที่คอมไพล์แล้วใหม่ทันที
- ใช้ `wiki bridge import` เมื่อโหมดสะพานขึ้นอยู่กับอาร์ติแฟกต์ memory
  ที่เพิ่งส่งออกใหม่

## ส่วนที่เชื่อมโยงกับคอนฟิก

พฤติกรรมของ `openclaw wiki` ถูกกำหนดโดย:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

ดู [Plugin Memory Wiki](/th/plugins/memory-wiki) สำหรับโมเดลคอนฟิกทั้งหมด
