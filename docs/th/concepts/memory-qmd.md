---
read_when:
    - คุณต้องการตั้งค่า QMD เป็นแบ็กเอนด์หน่วยความจำของคุณ
    - คุณต้องการฟีเจอร์หน่วยความจำขั้นสูง เช่น การจัดอันดับซ้ำหรือพาธที่ทำดัชนีเพิ่มเติม
summary: sidecar การค้นหาแบบ local-first พร้อม BM25, เวกเตอร์, การจัดอันดับซ้ำ และการขยายคำค้น
title: เอนจินหน่วยความจำ QMD
x-i18n:
    generated_at: "2026-04-24T09:06:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d7af326291e194a04a17aa425901bf7e2517c23bae8282cd504802d24e9e522
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) คือ sidecar การค้นหาแบบ local-first ที่ทำงาน
ควบคู่ไปกับ OpenClaw โดยรวม BM25, การค้นหาแบบเวกเตอร์ และการจัดอันดับซ้ำไว้ใน
ไบนารีเดียว และสามารถทำดัชนีเนื้อหานอกเหนือจากไฟล์หน่วยความจำใน workspace ของคุณได้

## สิ่งที่เพิ่มจาก builtin

- **การจัดอันดับซ้ำและการขยายคำค้น** เพื่อการดึงคืนข้อมูลที่ดีขึ้น
- **ทำดัชนีไดเรกทอรีเพิ่มเติม** -- เอกสารโปรเจ็กต์, โน้ตของทีม หรืออะไรก็ได้บนดิสก์
- **ทำดัชนี transcript ของเซสชัน** -- เรียกคืนการสนทนาก่อนหน้า
- **ทำงานในเครื่องทั้งหมด** -- รันผ่าน Bun + node-llama-cpp, ดาวน์โหลดโมเดล GGUF อัตโนมัติ
- **fallback อัตโนมัติ** -- หาก QMD ใช้งานไม่ได้ OpenClaw จะ fallback ไปยัง
  เอนจิน builtin อย่างราบรื่น

## เริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น

- ติดตั้ง QMD: `npm install -g @tobilu/qmd` หรือ `bun install -g @tobilu/qmd`
- SQLite build ที่อนุญาต extensions (`brew install sqlite` บน macOS)
- QMD ต้องอยู่บน `PATH` ของ gateway
- macOS และ Linux ใช้งานได้ทันที Windows รองรับได้ดีที่สุดผ่าน WSL2

### เปิดใช้งาน

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw จะสร้าง QMD home แบบ self-contained ภายใต้
`~/.openclaw/agents/<agentId>/qmd/` และจัดการวงจรชีวิตของ sidecar
โดยอัตโนมัติ -- collections, updates และการรัน embeddings จะถูกจัดการให้
ทั้งหมด ระบบจะใช้ collection และรูปร่างคำขอ MCP ของ QMD รุ่นปัจจุบันก่อน แต่ยัง fallback ไปใช้
flags ของ collection แบบ legacy `--mask` และชื่อเครื่องมือ MCP รุ่นเก่าได้เมื่อจำเป็น
การ reconcile ระหว่างบูตก็จะสร้าง managed collections ที่เก่าค้างให้กลับไปเป็น
รูปแบบ canonical อีกครั้ง เมื่อยังมี QMD collection รุ่นเก่าที่ใช้ชื่อเดียวกันอยู่

## sidecar ทำงานอย่างไร

- OpenClaw จะสร้าง collections จากไฟล์หน่วยความจำใน workspace ของคุณและ
  `memory.qmd.paths` ที่กำหนดค่าไว้ จากนั้นรัน `qmd update` + `qmd embed` ระหว่างบูต
  และตามรอบเวลา (ค่าเริ่มต้นทุก 5 นาที)
- collection เริ่มต้นของ workspace จะติดตาม `MEMORY.md` รวมถึง tree `memory/`
  โดย `memory.md` ตัวพิมพ์เล็กจะไม่ถูกทำดัชนีเป็นไฟล์หน่วยความจำราก
- การรีเฟรชตอนบูตจะรันในพื้นหลัง เพื่อไม่ให้บล็อกการเริ่มต้นแชต
- การค้นหาใช้ `searchMode` ที่กำหนดค่าไว้ (ค่าเริ่มต้น: `search`; รองรับ
  `vsearch` และ `query` ด้วย) หากโหมดหนึ่งล้มเหลว OpenClaw จะลองใหม่ด้วย `qmd query`
- หาก QMD ล้มเหลวทั้งหมด OpenClaw จะ fallback ไปยังเอนจิน SQLite แบบ builtin

<Info>
การค้นหาครั้งแรกอาจช้า -- QMD จะดาวน์โหลดโมเดล GGUF (~2 GB) อัตโนมัติสำหรับ
การจัดอันดับซ้ำและการขยายคำค้นในการรัน `qmd query` ครั้งแรก
</Info>

## การ override โมเดล

ตัวแปรสภาพแวดล้อมของโมเดล QMD จะถูกส่งผ่านจากโปรเซสของ gateway โดยไม่เปลี่ยนแปลง
ดังนั้นคุณสามารถปรับแต่ง QMD แบบทั้งระบบได้โดยไม่ต้องเพิ่ม config ใหม่ใน OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

หลังจากเปลี่ยนโมเดล embeddings ให้รัน embeddings ใหม่เพื่อให้ดัชนีตรงกับ
vector space ใหม่

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

snippets จากพาธเพิ่มเติมจะแสดงเป็น `qmd/<collection>/<relative-path>` ใน
ผลการค้นหา `memory_get` เข้าใจ prefix นี้และจะอ่านจาก root ของ
collection ที่ถูกต้อง

## การทำดัชนี transcript ของเซสชัน

เปิดใช้การทำดัชนีเซสชันเพื่อเรียกคืนการสนทนาก่อนหน้า:

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

transcripts จะถูก export เป็นรอบบทสนทนา User/Assistant ที่ผ่านการ sanitize ไปยัง QMD
collection เฉพาะภายใต้ `~/.openclaw/agents/<id>/qmd/sessions/`

## ขอบเขตการค้นหา

โดยค่าเริ่มต้น ผลการค้นหาของ QMD จะแสดงใน direct และ channel sessions
(ไม่รวม groups) กำหนดค่า `memory.qmd.scope` เพื่อเปลี่ยนพฤติกรรมนี้:

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
chat type ที่อนุมานได้ เพื่อให้แก้จุดบกพร่องผลลัพธ์ว่างได้ง่ายขึ้น

## การอ้างอิงแหล่งที่มา

เมื่อ `memory.citations` เป็น `auto` หรือ `on` snippets ของการค้นหาจะมี
footer `Source: <path#line>` ตั้งค่า `memory.citations = "off"` เพื่อไม่แสดง footer
แต่ยังคงส่งพาธให้เอเจนต์ภายในต่อไป

## ควรใช้เมื่อใด

เลือก QMD เมื่อคุณต้องการ:

- การจัดอันดับซ้ำเพื่อผลลัพธ์ที่มีคุณภาพสูงขึ้น
- ค้นหาเอกสารโปรเจ็กต์หรือโน้ตที่อยู่นอก workspace
- เรียกคืนบทสนทนาของเซสชันที่ผ่านมา
- การค้นหาแบบ local ทั้งหมดโดยไม่ต้องใช้ API keys

สำหรับการตั้งค่าที่ง่ายกว่า [builtin engine](/th/concepts/memory-builtin) ทำงานได้ดี
โดยไม่ต้องมี dependencies เพิ่มเติม

## การแก้ปัญหา

**ไม่พบ QMD?** ตรวจสอบให้แน่ใจว่าไบนารีอยู่บน `PATH` ของ gateway หาก OpenClaw
ทำงานเป็นบริการ ให้สร้าง symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`

**การค้นหาครั้งแรกช้ามาก?** QMD จะดาวน์โหลดโมเดล GGUF เมื่อใช้งานครั้งแรก อุ่นระบบล่วงหน้า
ด้วย `qmd query "test"` โดยใช้ XDG dirs เดียวกับที่ OpenClaw ใช้

**การค้นหาหมดเวลา?** เพิ่มค่า `memory.qmd.limits.timeoutMs` (ค่าเริ่มต้น: 4000ms)
ตั้งเป็น `120000` สำหรับฮาร์ดแวร์ที่ช้ากว่า

**ผลลัพธ์ว่างใน group chats?** ตรวจสอบ `memory.qmd.scope` -- ค่าเริ่มต้น
อนุญาตเฉพาะ direct และ channel sessions

**การค้นหา root memory กว้างเกินไปแบบกะทันหัน?** รีสตาร์ต gateway หรือรอการ reconcile
ตอนเริ่มต้นครั้งถัดไป OpenClaw จะสร้าง managed collections ที่เก่าค้างกลับเป็น
รูปแบบ canonical ของ `MEMORY.md` และ `memory/` เมื่อพบความขัดแย้งจาก collection ชื่อเดียวกัน

**temp repos ที่มองเห็นได้จาก workspace ทำให้เกิด `ENAMETOOLONG` หรือการทำดัชนีเสียหรือไม่?**
ปัจจุบันการไล่ traversal ของ QMD ยังคงอิงตามพฤติกรรมของตัวสแกน QMD เอง แทนที่จะอิง
กฎ symlink builtin ของ OpenClaw ให้เก็บ monorepo checkouts ชั่วคราวไว้ภายใต้
ไดเรกทอรีที่ซ่อนอยู่ เช่น `.tmp/` หรือไว้นอก roots ของ QMD ที่ทำดัชนี จนกว่า QMD จะรองรับ
cycle-safe traversal หรือการควบคุม exclusions แบบชัดเจน

## การกำหนดค่า

สำหรับพื้นผิว config แบบเต็ม (`memory.qmd.*`), โหมดการค้นหา, ช่วงเวลาอัปเดต,
กฎ scope และตัวเลือกอื่นๆ ทั้งหมด ดู
[Memory configuration reference](/th/reference/memory-config)

## ที่เกี่ยวข้อง

- [Memory overview](/th/concepts/memory)
- [Builtin memory engine](/th/concepts/memory-builtin)
- [Honcho memory](/th/concepts/memory-honcho)
