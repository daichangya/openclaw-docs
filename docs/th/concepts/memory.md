---
read_when:
    - คุณต้องการเข้าใจว่า Memory ทำงานอย่างไร
    - คุณต้องการทราบว่าควรเขียนไฟล์ memory ใดบ้าง
summary: วิธีที่ OpenClaw จดจำสิ่งต่าง ๆ ข้ามหลายเซสชัน
title: ภาพรวมของ Memory
x-i18n:
    generated_at: "2026-04-24T09:06:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw จดจำสิ่งต่าง ๆ โดยเขียนเป็น **ไฟล์ Markdown แบบข้อความล้วน** ใน
workspace ของเอเจนต์คุณ โมเดลจะ “จดจำ” ได้เฉพาะสิ่งที่ถูกบันทึกลงดิสก์เท่านั้น --
ไม่มีสถานะซ่อนอยู่

## วิธีการทำงาน

เอเจนต์ของคุณมีไฟล์ที่เกี่ยวข้องกับ memory อยู่ 3 แบบ:

- **`MEMORY.md`** -- memory ระยะยาว สำหรับข้อเท็จจริง ความชอบ และ
  การตัดสินใจที่คงทน จะถูกโหลดเมื่อเริ่มทุกเซสชัน DM
- **`memory/YYYY-MM-DD.md`** -- บันทึกรายวัน สำหรับบริบทและข้อสังเกตที่กำลังดำเนินอยู่
  ระบบจะโหลดบันทึกของวันนี้และเมื่อวานโดยอัตโนมัติ
- **`DREAMS.md`** (ไม่บังคับ) -- Dream Diary และสรุปการกวาด Dreaming
  สำหรับให้มนุษย์ตรวจทาน รวมถึงรายการ backfill เชิงอ้างอิงจากประวัติ

ไฟล์เหล่านี้อยู่ใน workspace ของเอเจนต์ (ค่าปริยายคือ `~/.openclaw/workspace`)

<Tip>
หากคุณต้องการให้เอเจนต์ของคุณจดจำบางอย่าง เพียงบอกมันว่า: "จำไว้ว่าฉัน
ชอบ TypeScript" แล้วมันจะเขียนลงในไฟล์ที่เหมาะสม
</Tip>

## เครื่องมือ memory

เอเจนต์มีเครื่องมือ 2 ตัวสำหรับทำงานกับ memory:

- **`memory_search`** -- ค้นหาบันทึกที่เกี่ยวข้องด้วย semantic search แม้ถ้อยคำ
  จะแตกต่างจากต้นฉบับ
- **`memory_get`** -- อ่านไฟล์ memory ที่ระบุหรือช่วงบรรทัดที่กำหนด

เครื่องมือทั้งสองนี้ถูกจัดเตรียมโดย Plugin memory ที่กำลังใช้งานอยู่ (ค่าปริยาย: `memory-core`)

## Plugin คู่หู Memory Wiki

หากคุณต้องการให้ durable memory ทำงานคล้ายฐานความรู้ที่ได้รับการดูแลมากกว่า
การเป็นเพียงบันทึกดิบ ให้ใช้ Plugin `memory-wiki` ที่มาพร้อมระบบ

`memory-wiki` จะคอมไพล์ความรู้ที่คงทนให้อยู่ใน wiki vault พร้อมด้วย:

- โครงสร้างหน้าที่กำหนดแน่นอน
- claim และหลักฐานแบบมีโครงสร้าง
- การติดตามความขัดแย้งและความสดใหม่
- dashboard ที่สร้างขึ้นอัตโนมัติ
- digest ที่คอมไพล์แล้วสำหรับผู้ใช้ฝั่งเอเจนต์/รันไทม์
- เครื่องมือแบบเนทีฟของ wiki เช่น `wiki_search`, `wiki_get`, `wiki_apply` และ `wiki_lint`

มันไม่ได้แทนที่ Plugin memory ที่กำลังใช้งานอยู่ Plugin memory หลักยังคง
รับผิดชอบการเรียกคืน การเลื่อนระดับ และ Dreaming ส่วน `memory-wiki` จะเพิ่มเลเยอร์ความรู้
ที่มี provenance สูงเข้ามาอยู่ข้างกัน

ดู [Memory Wiki](/th/plugins/memory-wiki)

## การค้นหา memory

เมื่อมีการกำหนดค่า embedding provider, `memory_search` จะใช้ **hybrid
search** -- โดยรวม vector similarity (ความหมายเชิง semantic) เข้ากับการจับคู่คีย์เวิร์ด
(คำที่ตรงตัว เช่น ID และสัญลักษณ์ในโค้ด) สิ่งนี้ใช้งานได้ทันทีเมื่อคุณมี
API key ของ provider ที่รองรับตัวใดก็ได้

<Info>
OpenClaw จะตรวจหา embedding provider ของคุณโดยอัตโนมัติจาก API key ที่มีอยู่ หากคุณ
กำหนดค่า key ของ OpenAI, Gemini, Voyage หรือ Mistral ไว้ ระบบจะเปิดใช้
การค้นหา memory โดยอัตโนมัติ
</Info>

สำหรับรายละเอียดว่าการค้นหาทำงานอย่างไร ตัวเลือกการปรับแต่ง และการตั้งค่า provider โปรดดู
[Memory Search](/th/concepts/memory-search)

## แบ็กเอนด์ memory

<CardGroup cols={3}>
<Card title="Builtin (ค่าปริยาย)" icon="database" href="/th/concepts/memory-builtin">
อิงกับ SQLite ใช้งานได้ทันทีพร้อม keyword search, vector similarity และ
hybrid search ไม่ต้องมี dependency เพิ่มเติม
</Card>
<Card title="QMD" icon="search" href="/th/concepts/memory-qmd">
sidecar แบบ local-first พร้อม reranking, query expansion และความสามารถในการทำดัชนี
ไดเรกทอรีนอก workspace
</Card>
<Card title="Honcho" icon="brain" href="/th/concepts/memory-honcho">
memory ข้ามเซสชันแบบ AI-native พร้อมการทำแบบจำลองผู้ใช้ semantic search และ
การรับรู้หลายเอเจนต์ ติดตั้งผ่าน Plugin
</Card>
</CardGroup>

## เลเยอร์วิกิความรู้

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/th/plugins/memory-wiki">
คอมไพล์ durable memory ให้เป็น wiki vault ที่มี provenance สูง พร้อม claim,
dashboard, bridge mode และเวิร์กโฟลว์ที่เป็นมิตรกับ Obsidian
</Card>
</CardGroup>

## การ flush memory อัตโนมัติ

ก่อนที่ [Compaction](/th/concepts/compaction) จะสรุปการสนทนาของคุณ OpenClaw
จะรันเทิร์นแบบเงียบที่เตือนเอเจนต์ให้บันทึกบริบทสำคัญลงในไฟล์ memory
โดยเปิดใช้งานไว้เป็นค่าปริยาย -- คุณไม่ต้องกำหนดค่าอะไรเพิ่มเติม

<Tip>
การ flush memory ป้องกันการสูญเสียบริบทระหว่าง Compaction หากเอเจนต์ของคุณมี
ข้อเท็จจริงสำคัญอยู่ในการสนทนาที่ยังไม่ได้เขียนลงไฟล์ ข้อมูลเหล่านั้น
จะถูกบันทึกโดยอัตโนมัติก่อนเกิดการสรุป
</Tip>

## Dreaming

Dreaming คือขั้นตอนรวมข้อมูลในเบื้องหลังสำหรับ memory แบบไม่บังคับ มันจะรวบรวม
สัญญาณระยะสั้น ให้คะแนน candidate และเลื่อนระดับเฉพาะรายการที่ผ่านเกณฑ์เข้าไปใน
memory ระยะยาว (`MEMORY.md`)

มันถูกออกแบบมาเพื่อให้ memory ระยะยาวมีสัญญาณสูง:

- **ต้องเปิดใช้เอง**: ปิดไว้เป็นค่าปริยาย
- **ตั้งเวลาไว้**: เมื่อเปิดใช้ `memory-core` จะจัดการงาน cron แบบวนซ้ำหนึ่งงาน
  สำหรับการกวาด Dreaming แบบเต็มโดยอัตโนมัติ
- **มีเกณฑ์ขั้นต่ำ**: การเลื่อนระดับต้องผ่านเกตด้านคะแนน ความถี่การเรียกคืน และ
  ความหลากหลายของคำค้น
- **ตรวจทานได้**: สรุปรายเฟสและรายการในไดอารีจะถูกเขียนลง `DREAMS.md`
  เพื่อให้มนุษย์ตรวจทาน

สำหรับพฤติกรรมของแต่ละเฟส สัญญาณการให้คะแนน และรายละเอียด Dream Diary โปรดดู
[Dreaming](/th/concepts/dreaming)

## Grounded backfill และ live promotion

ตอนนี้ระบบ Dreaming มี lane สำหรับการตรวจทานที่เกี่ยวข้องกันอย่างใกล้ชิด 2 แบบ:

- **Live dreaming** ทำงานจากที่เก็บ Dreaming ระยะสั้นภายใต้
  `memory/.dreams/` และเป็นสิ่งที่เฟส deep ปกติใช้เมื่อตัดสินใจว่าอะไร
  สามารถเลื่อนระดับเข้าสู่ `MEMORY.md` ได้
- **Grounded backfill** จะอ่านบันทึกย้อนหลัง `memory/YYYY-MM-DD.md` ในรูปของ
  ไฟล์รายวันแบบแยกเดี่ยว และเขียนผลลัพธ์การตรวจทานแบบมีโครงสร้างลงใน `DREAMS.md`

Grounded backfill มีประโยชน์เมื่อคุณต้องการย้อนเล่นบันทึกเก่าและตรวจดูว่า
ระบบมองว่าอะไรเป็นสิ่งที่คงทน โดยไม่ต้องแก้ไข `MEMORY.md` ด้วยตนเอง

เมื่อคุณใช้:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

candidate เชิงอ้างอิงที่คงทนจะไม่ถูกเลื่อนระดับโดยตรง แต่จะถูก staged เข้าไปใน
ที่เก็บ Dreaming ระยะสั้นชุดเดียวกับที่เฟส deep ปกติใช้อยู่แล้ว ซึ่งหมายความว่า:

- `DREAMS.md` ยังคงเป็นพื้นผิวสำหรับการตรวจทานโดยมนุษย์
- ที่เก็บระยะสั้นยังคงเป็นพื้นผิวการจัดอันดับสำหรับระบบ
- `MEMORY.md` ยังคงถูกเขียนโดยการเลื่อนระดับแบบ deep เท่านั้น

หากคุณตัดสินใจว่าการ replay นี้ไม่มีประโยชน์ คุณสามารถลบ artifact ที่ staged ไว้
โดยไม่กระทบรายการในไดอารีปกติหรือสถานะ recall ปกติได้:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # ตรวจสอบสถานะดัชนีและ provider
openclaw memory search "query"  # ค้นหาจากบรรทัดคำสั่ง
openclaw memory index --force   # สร้างดัชนีใหม่
```

## อ่านเพิ่มเติม

- [Builtin Memory Engine](/th/concepts/memory-builtin) -- แบ็กเอนด์ SQLite ค่าปริยาย
- [QMD Memory Engine](/th/concepts/memory-qmd) -- sidecar ขั้นสูงแบบ local-first
- [Honcho Memory](/th/concepts/memory-honcho) -- memory ข้ามเซสชันแบบ AI-native
- [Memory Wiki](/th/plugins/memory-wiki) -- คลังความรู้ที่คอมไพล์แล้วและเครื่องมือแบบเนทีฟของวิกิ
- [Memory Search](/th/concepts/memory-search) -- ไปป์ไลน์การค้นหา provider และ
  การปรับแต่ง
- [Dreaming](/th/concepts/dreaming) -- การเลื่อนระดับในเบื้องหลัง
  จากการเรียกคืนระยะสั้นไปยัง memory ระยะยาว
- [ข้อมูลอ้างอิงการกำหนดค่า memory](/th/reference/memory-config) -- ตัวเลือกคอนฟิกทั้งหมด
- [Compaction](/th/concepts/compaction) -- วิธีที่ Compaction ทำงานร่วมกับ memory

## ที่เกี่ยวข้อง

- [Active Memory](/th/concepts/active-memory)
- [Memory Search](/th/concepts/memory-search)
- [Builtin memory engine](/th/concepts/memory-builtin)
- [Honcho memory](/th/concepts/memory-honcho)
