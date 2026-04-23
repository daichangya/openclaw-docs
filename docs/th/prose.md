---
read_when:
    - คุณต้องการรันหรือเขียนเวิร์กโฟลว์ `.prose`
    - คุณต้องการเปิดใช้ Plugin OpenProse
    - คุณต้องเข้าใจการจัดเก็บ state
summary: 'OpenProse: เวิร์กโฟลว์ `.prose`, คำสั่ง slash และ state ใน OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-23T05:49:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse คือรูปแบบเวิร์กโฟลว์แบบพกพาและเน้น Markdown สำหรับประสานงานเซสชัน AI ใน OpenClaw มันมาพร้อมเป็น Plugin ที่ติดตั้ง skill pack ของ OpenProse พร้อมคำสั่ง slash `/prose` โปรแกรมจะอยู่ในไฟล์ `.prose` และสามารถ spawn sub-agent หลายตัวพร้อมโฟลว์ควบคุมแบบชัดเจนได้

เว็บไซต์ทางการ: [https://www.prose.md](https://www.prose.md)

## สิ่งที่มันทำได้

- งานวิจัย + การสังเคราะห์แบบ multi-agent พร้อม parallelism แบบชัดเจน
- เวิร์กโฟลว์ที่ทำซ้ำได้และปลอดภัยต่อการอนุมัติ (code review, incident triage, content pipeline)
- โปรแกรม `.prose` ที่นำกลับมาใช้ซ้ำได้และรันได้ข้ามรันไทม์ของเอเจนต์ที่รองรับ

## ติดตั้ง + เปิดใช้

Plugin ที่มากับระบบจะถูกปิดไว้โดยค่าเริ่มต้น เปิดใช้ OpenProse:

```bash
openclaw plugins enable open-prose
```

รีสตาร์ต Gateway หลังเปิดใช้ Plugin

checkout แบบ dev/local: `openclaw plugins install ./path/to/local/open-prose-plugin`

เอกสารที่เกี่ยวข้อง: [Plugins](/th/tools/plugin), [Plugin manifest](/th/plugins/manifest), [Skills](/th/tools/skills)

## คำสั่ง slash

OpenProse ลงทะเบียน `/prose` เป็นคำสั่ง skill ที่ผู้ใช้เรียกได้ มันกำหนดเส้นทางไปยังคำสั่ง VM ของ OpenProse และใช้เครื่องมือของ OpenClaw ภายใต้พื้นผิว

คำสั่งทั่วไป:

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

OpenProse จะเก็บ state ไว้ใต้ `.prose/` ใน workspace ของคุณ:

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

เอเจนต์ถาวรระดับผู้ใช้จะอยู่ที่:

```
~/.prose/agents/
```

## โหมด state

OpenProse รองรับ backend ของ state หลายแบบ:

- **filesystem** (ค่าเริ่มต้น): `.prose/runs/...`
- **in-context**: ชั่วคราว สำหรับโปรแกรมขนาดเล็ก
- **sqlite** (experimental): ต้องใช้ไบนารี `sqlite3`
- **postgres** (experimental): ต้องใช้ `psql` และ connection string

หมายเหตุ:

- sqlite/postgres เป็นแบบเลือกเปิดใช้และยัง experimental
- ข้อมูลรับรอง postgres จะไหลเข้าไปใน log ของ subagent; ใช้ฐานข้อมูลเฉพาะที่ให้สิทธิ์เท่าที่จำเป็น

## โปรแกรมระยะไกล

`/prose run <handle/slug>` จะ resolve ไปยัง `https://p.prose.md/<handle>/<slug>`
ส่วน URL โดยตรงจะถูกดึงมาตามที่ระบุ การดำเนินการนี้ใช้เครื่องมือ `web_fetch` (หรือ `exec` สำหรับ POST)

## การแมปกับรันไทม์ของ OpenClaw

โปรแกรม OpenProse แมปกับ primitive ของ OpenClaw ดังนี้:

| แนวคิดของ OpenProse          | เครื่องมือของ OpenClaw |
| ---------------------------- | ---------------------- |
| Spawn session / Task tool    | `sessions_spawn`       |
| การอ่าน/เขียนไฟล์            | `read` / `write`       |
| Web fetch                    | `web_fetch`            |

หาก allowlist ของเครื่องมือบล็อกเครื่องมือเหล่านี้ โปรแกรม OpenProse จะล้มเหลว ดู [Skills config](/th/tools/skills-config)

## ความปลอดภัย + การอนุมัติ

ให้ถือว่าไฟล์ `.prose` เป็นโค้ด ตรวจทานก่อนรัน ใช้ allowlist ของเครื่องมือ OpenClaw และ approval gate เพื่อควบคุม side effect

สำหรับเวิร์กโฟลว์ที่กำหนดผลลัพธ์ได้แน่นอนและมีกลไกอนุมัติ เปรียบเทียบได้กับ [Lobster](/th/tools/lobster)
