---
read_when:
    - คุณต้องการตั้งค่า QMD เป็นแบ็กเอนด์หน่วยความจำของคุณ
    - คุณต้องการความสามารถด้านหน่วยความจำขั้นสูง เช่น การจัดอันดับซ้ำหรือพาธที่ทำดัชนีเพิ่มเติม
summary: ไซด์คาร์การค้นหาแบบ local-first ที่มี BM25, เวกเตอร์, การจัดอันดับซ้ำ และการขยายคำค้น
title: QMD Memory Engine
x-i18n:
    generated_at: "2026-04-23T05:30:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27afc996b959d71caed964a3cae437e0e29721728b30ebe7f014db124c88da04
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# QMD Memory Engine

[QMD](https://github.com/tobi/qmd) คือไซด์คาร์การค้นหาแบบ local-first ที่ทำงาน
ควบคู่ไปกับ OpenClaw โดยรวม BM25 การค้นหาแบบเวกเตอร์ และการจัดอันดับซ้ำไว้ใน
ไบนารีเดียว และสามารถทำดัชนีเนื้อหาที่อยู่นอกเหนือจากไฟล์หน่วยความจำใน workspace ของคุณได้

## สิ่งที่เพิ่มจาก builtin

- **การจัดอันดับซ้ำและการขยายคำค้น** เพื่อให้เรียกคืนข้อมูลได้ดีขึ้น
- **ทำดัชนีไดเรกทอรีเพิ่มเติม** -- เอกสารโปรเจกต์ โน้ตของทีม หรืออะไรก็ตามบนดิสก์
- **ทำดัชนีทรานสคริปต์ของเซสชัน** -- เรียกคืนบทสนทนาก่อนหน้า
- **ภายในเครื่องทั้งหมด** -- รันผ่าน Bun + node-llama-cpp และดาวน์โหลดโมเดล GGUF อัตโนมัติ
- **fallback อัตโนมัติ** -- หาก QMD ไม่พร้อมใช้งาน OpenClaw จะ fallback ไปยัง
  engine แบบ builtin อย่างราบรื่น

## เริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น

- ติดตั้ง QMD: `npm install -g @tobilu/qmd` หรือ `bun install -g @tobilu/qmd`
- บิลด์ SQLite ที่อนุญาตส่วนขยาย (`brew install sqlite` บน macOS)
- QMD ต้องอยู่บน `PATH` ของ gateway
- macOS และ Linux ใช้งานได้ทันที Windows รองรับได้ดีที่สุดผ่าน WSL2

### เปิดใช้

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw จะสร้างโฮม QMD แบบครบถ้วนในตัวภายใต้
`~/.openclaw/agents/<agentId>/qmd/` และจัดการวงจรชีวิตของไซด์คาร์
โดยอัตโนมัติ -- คอลเลกชัน การอัปเดต และการรัน embedding จะถูกจัดการให้คุณ
โดยจะเลือกใช้รูปแบบคอลเลกชันและคิวรี MCP ของ QMD ปัจจุบันก่อน แต่ยัง fallback ไปใช้
แฟล็กคอลเลกชัน `--mask` แบบเดิมและชื่อเครื่องมือ MCP รุ่นเก่าเมื่อจำเป็น

## วิธีทำงานของไซด์คาร์

- OpenClaw จะสร้างคอลเลกชันจากไฟล์หน่วยความจำใน workspace ของคุณและ
  `memory.qmd.paths` ที่กำหนดค่าไว้ จากนั้นรัน `qmd update` + `qmd embed` ตอนบูต
  และเป็นระยะ ๆ (ค่าเริ่มต้นทุก 5 นาที)
- คอลเลกชัน workspace ค่าเริ่มต้นจะติดตาม `MEMORY.md` พร้อมกับต้นไม้ `memory/`
  ส่วน `memory.md` ตัวพิมพ์เล็กยังคงเป็น fallback สำหรับ bootstrap ไม่ใช่คอลเลกชัน QMD
  แยกต่างหาก
- การรีเฟรชตอนบูตจะทำงานในเบื้องหลังเพื่อไม่ให้การเริ่มต้นแชตถูกบล็อก
- การค้นหาจะใช้ `searchMode` ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `search`; รองรับ
  `vsearch` และ `query` ด้วย) หากโหมดใดล้มเหลว OpenClaw จะลองใหม่ด้วย `qmd query`
- หาก QMD ล้มเหลวทั้งหมด OpenClaw จะ fallback ไปยัง SQLite engine แบบ builtin

<Info>
การค้นหาครั้งแรกอาจช้า -- QMD จะดาวน์โหลดโมเดล GGUF (~2 GB) อัตโนมัติสำหรับ
การจัดอันดับซ้ำและการขยายคำค้นในการรัน `qmd query` ครั้งแรก
</Info>

## การแทนที่โมเดล

ตัวแปรสภาพแวดล้อมของโมเดล QMD จะถูกส่งผ่านจากโปรเซส gateway
โดยไม่เปลี่ยนแปลง ดังนั้นคุณจึงปรับแต่ง QMD ได้ทั้งระบบโดยไม่ต้องเพิ่มการกำหนดค่า OpenClaw ใหม่:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

หลังเปลี่ยนโมเดล embedding ให้รัน embedding ใหม่เพื่อให้ดัชนีตรงกับ
พื้นที่เวกเตอร์ใหม่

## การทำดัชนีพาธเพิ่มเติม

ชี้ QMD ไปยังไดเรกทอรีเพิ่มเติมเพื่อให้ค้นหาได้:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

snippet จากพาธเพิ่มเติมจะปรากฏเป็น `qmd/<collection>/<relative-path>` ใน
ผลการค้นหา `memory_get` เข้าใจคำนำหน้านี้และจะอ่านจาก
รากคอลเลกชันที่ถูกต้อง

## การทำดัชนีทรานสคริปต์ของเซสชัน

เปิดใช้การทำดัชนีเซสชันเพื่อเรียกคืนบทสนทนาก่อนหน้า:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

ทรานสคริปต์จะถูกส่งออกเป็นเทิร์น User/Assistant ที่ผ่านการทำความสะอาดไปยังคอลเลกชัน QMD
เฉพาะภายใต้ `~/.openclaw/agents/<id>/qmd/sessions/`

## ขอบเขตการค้นหา

โดยค่าเริ่มต้น ผลการค้นหาของ QMD จะแสดงในเซสชัน direct และ channel
(ไม่รวมกลุ่ม) กำหนดค่า `memory.qmd.scope` เพื่อเปลี่ยนสิ่งนี้:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

เมื่อ scope ปฏิเสธการค้นหา OpenClaw จะบันทึกคำเตือนพร้อม channel และ
chat type ที่อนุมานได้ เพื่อให้แก้ไขปัญหาผลลัพธ์ว่างได้ง่ายขึ้น

## การอ้างอิงแหล่งที่มา

เมื่อ `memory.citations` เป็น `auto` หรือ `on` snippet ของการค้นหาจะมี
ส่วนท้าย `Source: <path#line>` ตั้งค่า `memory.citations = "off"` เพื่อละส่วนท้ายนี้
แต่ยังคงส่งพาธให้เอเจนต์ภายใน

## ควรใช้เมื่อใด

เลือก QMD เมื่อคุณต้องการ:

- การจัดอันดับซ้ำเพื่อให้ได้ผลลัพธ์คุณภาพสูงขึ้น
- ค้นหาเอกสารโปรเจกต์หรือโน้ตที่อยู่นอก workspace
- เรียกคืนบทสนทนาจากเซสชันก่อนหน้า
- การค้นหาแบบภายในเครื่องทั้งหมดโดยไม่ใช้ API key

สำหรับการตั้งค่าที่ง่ายกว่า [builtin engine](/th/concepts/memory-builtin) ทำงานได้ดี
โดยไม่ต้องมี dependency เพิ่มเติม

## การแก้ไขปัญหา

**ไม่พบ QMD?** ตรวจสอบให้แน่ใจว่าไบนารีอยู่บน `PATH` ของ gateway หาก OpenClaw
ทำงานเป็น service ให้สร้าง symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`

**การค้นหาครั้งแรกช้ามาก?** QMD จะดาวน์โหลดโมเดล GGUF เมื่อใช้งานครั้งแรก อุ่นระบบล่วงหน้า
ด้วย `qmd query "test"` โดยใช้ XDG dir เดียวกับที่ OpenClaw ใช้

**การค้นหาหมดเวลา?** เพิ่ม `memory.qmd.limits.timeoutMs` (ค่าเริ่มต้น: 4000ms)
ตั้งเป็น `120000` สำหรับฮาร์ดแวร์ที่ช้ากว่า

**ผลลัพธ์ว่างในแชตกลุ่ม?** ตรวจสอบ `memory.qmd.scope` -- ค่าเริ่มต้นจะ
อนุญาตเฉพาะเซสชัน direct และ channel

**temp repo ที่มองเห็นได้จาก workspace ทำให้เกิด `ENAMETOOLONG` หรือทำดัชนีเสียหาย?**
ขณะนี้การไล่ traversing ของ QMD ยังคงเป็นไปตามพฤติกรรมของตัวสแกน QMD พื้นฐานแทนที่จะเป็น
กฎ symlink แบบ builtin ของ OpenClaw เก็บการ checkout monorepo ชั่วคราวไว้ใต้
ไดเรกทอรีซ่อนอย่าง `.tmp/` หรือไว้นอกราก QMD ที่ทำดัชนีไว้ จนกว่า QMD จะรองรับ
การ traverse ที่ปลอดภัยจาก cycle หรือมีตัวควบคุม exclusion แบบชัดเจน

## การกำหนดค่า

สำหรับพื้นผิวการกำหนดค่าเต็ม (`memory.qmd.*`) โหมดการค้นหา
ช่วงเวลาอัปเดต กฎ scope และตัวปรับอื่นทั้งหมด ดูที่
[Memory configuration reference](/th/reference/memory-config)
