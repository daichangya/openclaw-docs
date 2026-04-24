---
read_when:
    - คุณต้องการรันหรือเขียนเวิร์กโฟลว์ `.prose`
    - คุณต้องการเปิดใช้ Plugin OpenProse
    - คุณต้องการทำความเข้าใจการจัดเก็บสถานะ
summary: 'OpenProse: เวิร์กโฟลว์ `.prose`, คำสั่งสแลช และสถานะใน OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T09:26:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse เป็นรูปแบบเวิร์กโฟลว์แบบพกพาและยึด Markdown เป็นหลัก สำหรับ orchestration ของเซสชัน AI ใน OpenClaw มันมาในรูปแบบ Plugin ที่ติดตั้งชุด Skills ของ OpenProse พร้อมคำสั่งสแลช `/prose` โปรแกรมจะอยู่ในไฟล์ `.prose` และสามารถ spawn sub-agent หลายตัวด้วย control flow ที่ชัดเจน

เว็บไซต์ทางการ: [https://www.prose.md](https://www.prose.md)

## สิ่งที่ทำได้

- งานวิจัย + การสังเคราะห์แบบหลาย agent พร้อม parallelism ที่ชัดเจน
- เวิร์กโฟลว์ที่ทำซ้ำได้และปลอดภัยต่อ approval (code review, incident triage, content pipelines)
- โปรแกรม `.prose` ที่ใช้ซ้ำได้และรันข้าม agent runtime ที่รองรับได้

## ติดตั้ง + เปิดใช้

Plugin ที่มาพร้อมกันจะถูกปิดไว้ตามค่าเริ่มต้น เปิดใช้ OpenProse ได้ดังนี้:

```bash
openclaw plugins enable open-prose
```

รีสตาร์ต Gateway หลังจากเปิดใช้ Plugin แล้ว

สำหรับ dev/local checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

เอกสารที่เกี่ยวข้อง: [Plugins](/th/tools/plugin), [Plugin manifest](/th/plugins/manifest), [Skills](/th/tools/skills).

## คำสั่งสแลช

OpenProse ลงทะเบียน `/prose` เป็นคำสั่ง Skills ที่ผู้ใช้เรียกใช้ได้ โดยจะส่งต่อไปยังคำสั่งของ OpenProse VM และใช้เครื่องมือของ OpenClaw อยู่เบื้องหลัง

คำสั่งที่ใช้บ่อย:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## ตัวอย่าง: ไฟล์ `.prose` แบบง่าย

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## ตำแหน่งไฟล์

OpenProse เก็บสถานะไว้ใต้ `.prose/` ใน workspace ของคุณ:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

agent แบบคงอยู่ในระดับผู้ใช้จะอยู่ที่:

```
~/.prose/agents/
```

## โหมดสถานะ

OpenProse รองรับแบ็กเอนด์สถานะหลายแบบ:

- **filesystem** (ค่าเริ่มต้น): `.prose/runs/...`
- **in-context**: ชั่วคราว สำหรับโปรแกรมขนาดเล็ก
- **sqlite** (ทดลอง): ต้องใช้ไบนารี `sqlite3`
- **postgres** (ทดลอง): ต้องใช้ `psql` และ connection string

หมายเหตุ:

- sqlite/postgres เป็นแบบ opt-in และยังอยู่ในสถานะทดลอง
- credential ของ postgres จะไหลเข้าไปใน log ของ subagent; ให้ใช้ฐานข้อมูลเฉพาะที่มีสิทธิ์ต่ำที่สุดเท่าที่จำเป็น

## โปรแกรมระยะไกล

`/prose run <handle/slug>` จะ resolve ไปที่ `https://p.prose.md/<handle>/<slug>`
ส่วน URL ตรงจะถูกดึงตามที่ระบุไว้ การทำงานนี้ใช้เครื่องมือ `web_fetch` (หรือ `exec` สำหรับ POST)

## การแมป runtime ของ OpenClaw

โปรแกรม OpenProse จะถูกแมปเข้ากับ primitive ของ OpenClaw ดังนี้:

| แนวคิดของ OpenProse       | tool ของ OpenClaw |
| ------------------------- | ----------------- |
| Spawn session / Task tool | `sessions_spawn`  |
| อ่าน/เขียนไฟล์           | `read` / `write`  |
| ดึงข้อมูลเว็บ             | `web_fetch`       |

หาก allowlist ของ tool ของคุณบล็อกเครื่องมือเหล่านี้ โปรแกรม OpenProse จะล้มเหลว ดู [การกำหนดค่า Skills](/th/tools/skills-config)

## ความปลอดภัย + approval

ให้ปฏิบัติต่อไฟล์ `.prose` เสมือนโค้ด ตรวจสอบก่อนรัน ใช้ tool allowlist และ approval gate ของ OpenClaw เพื่อควบคุมผลข้างเคียง

หากต้องการเวิร์กโฟลว์ที่กำหนดแน่นอนและมี approval gate ให้เปรียบเทียบกับ [Lobster](/th/tools/lobster)

## ที่เกี่ยวข้อง

- [Text-to-speech](/th/tools/tts)
- [การจัดรูปแบบ Markdown](/th/concepts/markdown-formatting)
