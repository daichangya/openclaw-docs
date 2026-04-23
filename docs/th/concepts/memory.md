---
read_when:
    - คุณต้องการเข้าใจว่า Memory ทำงานอย่างไร
    - คุณต้องการทราบว่าควรเขียนไฟล์หน่วยความจำใดบ้าง
summary: OpenClaw จดจำสิ่งต่าง ๆ ข้ามเซสชันอย่างไร
title: ภาพรวมของ Memory
x-i18n:
    generated_at: "2026-04-23T05:30:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad1adafe1d81f1703d24f48a9c9da2b25a0ebbd4aad4f65d8bde5df78195d55b
    source_path: concepts/memory.md
    workflow: 15
---

# ภาพรวมของ Memory

OpenClaw จดจำสิ่งต่าง ๆ โดยการเขียน **ไฟล์ Markdown แบบธรรมดา** ลงใน
workspace ของเอเจนต์ของคุณ โมเดลจะ "จดจำ" ได้เฉพาะสิ่งที่ถูกบันทึกลงดิสก์เท่านั้น --
ไม่มีสถานะซ่อนอยู่

## วิธีการทำงาน

เอเจนต์ของคุณมีไฟล์ที่เกี่ยวข้องกับหน่วยความจำอยู่สามประเภท:

- **`MEMORY.md`** -- หน่วยความจำระยะยาว ข้อเท็จจริง ความชอบ และ
  การตัดสินใจที่คงทน โหลดเมื่อเริ่มทุกเซสชัน DM
- **`memory/YYYY-MM-DD.md`** -- บันทึกรายวัน บริบทและข้อสังเกตที่ดำเนินต่อเนื่อง
  บันทึกของวันนี้และเมื่อวานจะถูกโหลดโดยอัตโนมัติ
- **`DREAMS.md`** (ไม่บังคับ) -- Dream Diary และ
  สรุปการกวาด Dreaming สำหรับการตรวจทานโดยมนุษย์ รวมถึงรายการ grounded historical backfill

ไฟล์เหล่านี้อยู่ใน workspace ของเอเจนต์ (ค่าเริ่มต้น `~/.openclaw/workspace`)

<Tip>
หากคุณต้องการให้เอเจนต์จดจำบางอย่าง ก็เพียงบอกมันว่า: "จำไว้ว่าฉัน
ชอบ TypeScript" มันจะเขียนลงไฟล์ที่เหมาะสมให้
</Tip>

## Tools สำหรับหน่วยความจำ

เอเจนต์มี tools สองตัวสำหรับทำงานกับหน่วยความจำ:

- **`memory_search`** -- ค้นหาบันทึกที่เกี่ยวข้องโดยใช้การค้นหาเชิงความหมาย แม้ว่า
  ถ้อยคำจะแตกต่างจากต้นฉบับ
- **`memory_get`** -- อ่านไฟล์หน่วยความจำหรือช่วงบรรทัดที่ระบุ

ทั้งสอง tools นี้มาจาก memory plugin ที่ใช้งานอยู่ (ค่าเริ่มต้น: `memory-core`)

## Plugin เสริม Memory Wiki

หากคุณต้องการให้หน่วยความจำระยะยาวทำงานคล้ายฐานความรู้ที่ได้รับการดูแลมากกว่า
การเป็นเพียงบันทึกดิบ ให้ใช้ Plugin `memory-wiki` ที่มาพร้อมกัน

`memory-wiki` คอมไพล์ความรู้ที่คงทนให้เป็นคลังวิกิพร้อม:

- โครงสร้างหน้าที่กำหนดแน่นอน
- claims และ evidence แบบมีโครงสร้าง
- การติดตามความขัดแย้งและความสดใหม่
- dashboard ที่สร้างอัตโนมัติ
- digest ที่คอมไพล์แล้วสำหรับผู้ใช้เอเจนต์/รันไทม์
- tools แบบวิกิโดยตรง เช่น `wiki_search`, `wiki_get`, `wiki_apply` และ `wiki_lint`

มันไม่ได้แทนที่ memory plugin ที่ใช้งานอยู่ memory plugin ที่ใช้งานอยู่ยังคง
รับผิดชอบ recall การยกระดับ และ Dreaming ส่วน `memory-wiki` จะเพิ่มชั้นความรู้
ที่มี provenance สูงควบคู่ไปกับมัน

ดู [Memory Wiki](/th/plugins/memory-wiki)

## การค้นหาในหน่วยความจำ

เมื่อมีการกำหนดค่า embedding provider ไว้ `memory_search` จะใช้ **การค้นหาแบบไฮบริด**
-- ผสาน vector similarity (ความหมายเชิงความหมาย) เข้ากับการจับคู่คีย์เวิร์ด
(คำที่ตรงกันเป๊ะ เช่น ID และ code symbol) ซึ่งใช้งานได้ทันทีเมื่อคุณมี
API key สำหรับผู้ให้บริการที่รองรับรายใดก็ได้

<Info>
OpenClaw จะตรวจจับ embedding provider ของคุณโดยอัตโนมัติจาก API key ที่มีอยู่ หากคุณ
ตั้งค่า key ของ OpenAI, Gemini, Voyage หรือ Mistral ไว้
การค้นหาในหน่วยความจำจะถูกเปิดใช้งานโดยอัตโนมัติ
</Info>

สำหรับรายละเอียดเกี่ยวกับวิธีการค้นหา ตัวเลือกการปรับแต่ง และการตั้งค่าผู้ให้บริการ โปรดดู
[Memory Search](/th/concepts/memory-search)

## Memory backends

<CardGroup cols={3}>
<Card title="Builtin (ค่าเริ่มต้น)" icon="database" href="/th/concepts/memory-builtin">
อิง SQLite ใช้งานได้ทันทีพร้อมการค้นหาด้วยคีย์เวิร์ด vector similarity และ
การค้นหาแบบไฮบริด ไม่ต้องมี dependency เพิ่มเติม
</Card>
<Card title="QMD" icon="search" href="/th/concepts/memory-qmd">
sidecar แบบ local-first พร้อม reranking, query expansion และความสามารถในการทำดัชนี
ไดเรกทอรีนอก workspace
</Card>
<Card title="Honcho" icon="brain" href="/th/concepts/memory-honcho">
หน่วยความจำข้ามเซสชันแบบ AI-native พร้อมการสร้างแบบจำลองผู้ใช้ การค้นหาเชิงความหมาย และ
การรับรู้หลายเอเจนต์ ต้องติดตั้ง Plugin
</Card>
</CardGroup>

## ชั้นวิกิความรู้

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/th/plugins/memory-wiki">
คอมไพล์หน่วยความจำที่คงทนให้เป็นคลังวิกิที่มี provenance สูง พร้อม claims,
dashboard, bridge mode และเวิร์กโฟลว์ที่เป็นมิตรกับ Obsidian
</Card>
</CardGroup>

## การ flush หน่วยความจำอัตโนมัติ

ก่อนที่ [Compaction](/th/concepts/compaction) จะสรุปการสนทนาของคุณ OpenClaw
จะรันเทิร์นเงียบเพื่อเตือนเอเจนต์ให้บันทึกบริบทสำคัญลงในไฟล์หน่วยความจำ
โดยเปิดใช้งานไว้เป็นค่าเริ่มต้น -- คุณไม่ต้องกำหนดค่าอะไร

<Tip>
การ flush หน่วยความจำช่วยป้องกันการสูญเสียบริบทระหว่าง Compaction หากเอเจนต์ของคุณมี
ข้อเท็จจริงสำคัญอยู่ในการสนทนาที่ยังไม่ได้เขียนลงไฟล์
ระบบจะบันทึกให้อัตโนมัติก่อนเกิดการสรุป
</Tip>

## Dreaming

Dreaming คือกระบวนการรวมหน่วยความจำเบื้องหลังแบบไม่บังคับ มันรวบรวม
สัญญาณระยะสั้น ให้คะแนนตัวเลือก และยกระดับเฉพาะรายการที่ผ่านเกณฑ์เข้าสู่
หน่วยความจำระยะยาว (`MEMORY.md`)

มันถูกออกแบบมาเพื่อทำให้หน่วยความจำระยะยาวมีสัญญาณสำคัญสูง:

- **Opt-in**: ปิดใช้งานเป็นค่าเริ่มต้น
- **ตั้งเวลาได้**: เมื่อเปิดใช้ `memory-core` จะจัดการ Cron job แบบวนซ้ำหนึ่งรายการโดยอัตโนมัติ
  สำหรับการกวาด Dreaming แบบเต็ม
- **มี threshold**: การยกระดับต้องผ่านเกณฑ์ด้านคะแนน ความถี่ recall และ
  ความหลากหลายของ query
- **ตรวจทานได้**: สรุปแต่ละเฟสและรายการไดอารี่จะถูกเขียนลง `DREAMS.md`
  เพื่อให้มนุษย์ตรวจทาน

สำหรับพฤติกรรมของเฟส สัญญาณการให้คะแนน และรายละเอียดของ Dream Diary โปรดดู
[Dreaming](/th/concepts/dreaming)

## Grounded backfill และการยกระดับแบบ live

ตอนนี้ระบบ Dreaming มีเลนตรวจทานที่เกี่ยวข้องกันอย่างใกล้ชิดสองแบบ:

- **Live dreaming** ทำงานจากที่เก็บ Dreaming ระยะสั้นใต้
  `memory/.dreams/` และเป็นสิ่งที่เฟส deep ปกติใช้เมื่อพิจารณาว่าอะไร
  สามารถเลื่อนระดับเข้าสู่ `MEMORY.md` ได้
- **Grounded backfill** อ่านบันทึก `memory/YYYY-MM-DD.md` ในอดีตเป็น
  ไฟล์รายวันแบบแยกอิสระ และเขียนเอาต์พุตการตรวจทานแบบมีโครงสร้างลงใน `DREAMS.md`

Grounded backfill มีประโยชน์เมื่อคุณต้องการ replay บันทึกเก่าและตรวจสอบว่า
ระบบมองว่าอะไรควรคงทน โดยไม่ต้องแก้ไข `MEMORY.md` ด้วยตนเอง

เมื่อคุณใช้:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

ตัวเลือกแบบคงทนที่ grounded จะไม่ถูกยกระดับโดยตรง แต่จะถูกจัดเตรียมไว้ใน
ที่เก็บ Dreaming ระยะสั้นเดียวกันกับที่เฟส deep ปกติใช้อยู่แล้ว ซึ่งหมายความว่า:

- `DREAMS.md` ยังคงเป็นพื้นผิวการตรวจทานสำหรับมนุษย์
- ที่เก็บระยะสั้นยังคงเป็นพื้นผิวการจัดอันดับฝั่งเครื่อง
- `MEMORY.md` ยังคงถูกเขียนโดยการยกระดับแบบ deep เท่านั้น

หากคุณตัดสินใจว่า replay นั้นไม่มีประโยชน์ คุณสามารถลบอาร์ติแฟกต์ที่จัดเตรียมไว้ได้
โดยไม่แตะต้องรายการไดอารี่ปกติหรือสถานะ recall ปกติ:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # ตรวจสอบสถานะดัชนีและผู้ให้บริการ
openclaw memory search "query"  # ค้นหาจากบรรทัดคำสั่ง
openclaw memory index --force   # สร้างดัชนีใหม่
```

## อ่านเพิ่มเติม

- [Builtin Memory Engine](/th/concepts/memory-builtin) -- backend SQLite ค่าเริ่มต้น
- [QMD Memory Engine](/th/concepts/memory-qmd) -- sidecar แบบ local-first ขั้นสูง
- [Honcho Memory](/th/concepts/memory-honcho) -- หน่วยความจำข้ามเซสชันแบบ AI-native
- [Memory Wiki](/th/plugins/memory-wiki) -- คลังความรู้ที่คอมไพล์แล้วและ tools แบบวิกิโดยตรง
- [Memory Search](/th/concepts/memory-search) -- ไปป์ไลน์การค้นหา ผู้ให้บริการ และ
  การปรับแต่ง
- [Dreaming](/th/concepts/dreaming) -- การยกระดับเบื้องหลัง
  จาก recall ระยะสั้นสู่หน่วยความจำระยะยาว
- [เอกสารอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config) -- ปุ่มปรับ config ทั้งหมด
- [Compaction](/th/concepts/compaction) -- Compaction ทำงานร่วมกับหน่วยความจำอย่างไร
