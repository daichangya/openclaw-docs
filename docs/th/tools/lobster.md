---
read_when:
    - คุณต้องการเวิร์กโฟลว์หลายขั้นตอนแบบกำหนดแน่นอนพร้อมการอนุมัติอย่างชัดเจน
    - คุณต้องการ resume เวิร์กโฟลว์โดยไม่ต้องรันขั้นตอนก่อนหน้าใหม่ ისევறு
summary: runtime ของ workflow แบบมี type สำหรับ OpenClaw พร้อม approval gate ที่ resume ได้
title: Lobster
x-i18n:
    generated_at: "2026-04-23T06:01:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1014945d104ef8fdca0d30be89e35136def1b274c6403b06de29e8502b8124b
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster คือ workflow shell ที่ทำให้ OpenClaw รันลำดับของ tool หลายขั้นตอนเป็นการทำงานเดียวแบบกำหนดแน่นอน พร้อม checkpoint การอนุมัติที่ชัดเจน

Lobster เป็นชั้นการเขียนงานที่อยู่เหนือ detached background work หนึ่งระดับ สำหรับ flow orchestration ที่อยู่เหนือ task แต่ละตัว ดู [Task Flow](/th/automation/taskflow) (`openclaw tasks flow`) สำหรับ ledger ของกิจกรรม task ดู [`openclaw tasks`](/th/automation/tasks)

## จุดดึงดูด

ผู้ช่วยของคุณสามารถสร้าง tool ที่ใช้จัดการตัวมันเองได้ ขอ workflow หนึ่งแบบ แล้ว 30 นาทีต่อมาคุณจะมี CLI พร้อม pipeline ที่รันเป็นการเรียกครั้งเดียว Lobster คือชิ้นส่วนที่ขาดหายไป: pipeline แบบกำหนดแน่นอน การอนุมัติอย่างชัดเจน และสถานะที่ resume ได้

## ทำไม

ทุกวันนี้ เวิร์กโฟลว์ที่ซับซ้อนต้องใช้การเรียก tool ไปกลับหลายครั้ง แต่ละครั้งกินโทเค็น และ LLM ต้องจัด orchestration ของทุกขั้นตอน Lobster ย้าย orchestration นั้นเข้าไปใน runtime แบบมี type:

- **เรียกครั้งเดียวแทนหลายครั้ง**: OpenClaw รัน Lobster tool call เพียงครั้งเดียวและได้ผลลัพธ์แบบมีโครงสร้าง
- **มี approvals ในตัว**: side effect (ส่งอีเมล, โพสต์คอมเมนต์) จะหยุดเวิร์กโฟลว์ไว้จนกว่าจะได้รับอนุมัติอย่างชัดเจน
- **Resume ได้**: เวิร์กโฟลว์ที่หยุดไว้จะส่งคืน token; อนุมัติแล้ว resume ต่อได้โดยไม่ต้องรันทุกอย่างใหม่

## ทำไมต้องใช้ DSL แทนโปรแกรมธรรมดา?

Lobster ถูกทำให้เล็กโดยตั้งใจ เป้าหมายไม่ใช่ “ภาษาใหม่” แต่เป็นสเปก pipeline ที่คาดเดาได้และเป็นมิตรกับ AI พร้อมการอนุมัติชั้นหนึ่งและ resume token

- **approve/resume มีในตัว**: โปรแกรมทั่วไปสามารถถามมนุษย์ได้ แต่ไม่สามารถ _หยุดแล้ว resume_ พร้อม durable token ได้ หากคุณไม่สร้าง runtime นั้นขึ้นมาเอง
- **Determinism + auditability**: pipeline เป็นข้อมูล จึงบันทึก, diff, replay และ review ได้ง่าย
- **พื้นผิวที่จำกัดสำหรับ AI**: grammar เล็ก + JSON piping ช่วยลดเส้นทางโค้ดแบบ “สร้างสรรค์” และทำให้การตรวจสอบเป็นจริงได้
- **มีนโยบายความปลอดภัยฝังไว้**: timeout, output cap, sandbox check และ allowlist ถูกบังคับโดย runtime ไม่ใช่โดยแต่ละสคริปต์
- **ยังคงเขียนโปรแกรมได้**: แต่ละ step เรียก CLI หรือสคริปต์ใดก็ได้ หากคุณต้องการ JS/TS ก็ให้สร้างไฟล์ `.lobster` จากโค้ด

## วิธีการทำงาน

OpenClaw รันเวิร์กโฟลว์ Lobster **ในโปรเซสเดียวกัน** โดยใช้ embedded runner ไม่มี external CLI subprocess ถูก spawn; workflow engine ทำงานภายในโปรเซสของ gateway และส่งคืน JSON envelope โดยตรง
หาก pipeline หยุดเพื่อรอการอนุมัติ tool จะส่งคืน `resumeToken` เพื่อให้คุณดำเนินต่อภายหลังได้

## รูปแบบ: CLI ขนาดเล็ก + JSON pipe + approvals

สร้างคำสั่งเล็ก ๆ ที่พูดด้วย JSON แล้วจึงเชื่อมมันเป็น Lobster call เดียว (ชื่อคำสั่งในตัวอย่างด้านล่างเป็นเพียงตัวอย่าง — เปลี่ยนเป็นของคุณเองได้)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

หาก pipeline ต้องการการอนุมัติ ให้ resume ด้วย token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI เป็นผู้ทริกเกอร์ workflow; Lobster เป็นผู้รันขั้นตอน approval gate ทำให้ side effect ชัดเจนและตรวจสอบย้อนหลังได้

ตัวอย่าง: แมป input item ไปเป็นการเรียก tool:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## ขั้นตอน LLM แบบ JSON-only (`llm-task`)

สำหรับเวิร์กโฟลว์ที่ต้องการ **ขั้นตอน LLM แบบมีโครงสร้าง** ให้เปิดใช้
plugin tool แบบเลือกได้ `llm-task` แล้วเรียกมันจาก Lobster วิธีนี้ทำให้เวิร์กโฟลว์ยังคง
กำหนดแน่นอน ขณะยังให้คุณใช้โมเดลเพื่อจัดหมวดหมู่/สรุป/ร่างข้อความได้

เปิดใช้ tool:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

ใช้ใน pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

ดู [LLM Task](/th/tools/llm-task) สำหรับรายละเอียดและตัวเลือกการกำหนดค่า

## ไฟล์ workflow (`.lobster`)

Lobster สามารถรันไฟล์ workflow แบบ YAML/JSON ที่มีฟิลด์ `name`, `args`, `steps`, `env`, `condition` และ `approval` ได้ ใน OpenClaw tool call ให้ตั้ง `pipeline` เป็นพาธของไฟล์

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

หมายเหตุ:

- `stdin: $step.stdout` และ `stdin: $step.json` ใช้ส่งเอาต์พุตจาก step ก่อนหน้า
- `condition` (หรือ `when`) ใช้ gate step โดยอิงกับ `$step.approved`

## ติดตั้ง Lobster

เวิร์กโฟลว์ Lobster แบบ bundled จะรันในโปรเซสเดียวกัน; ไม่จำเป็นต้องมีไบนารี `lobster` แยก embedded runner มาพร้อมกับ Lobster plugin อยู่แล้ว

หากคุณต้องการ Lobster CLI แบบ standalone สำหรับการพัฒนาหรือ pipeline ภายนอก ให้ติดตั้งจาก [repo ของ Lobster](https://github.com/openclaw/lobster) และตรวจสอบว่า `lobster` อยู่บน `PATH`

## เปิดใช้ tool

Lobster เป็น **plugin tool แบบทางเลือก** (ไม่ได้เปิดใช้เป็นค่าเริ่มต้น)

แนะนำ (แบบ additive และปลอดภัย):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

หรือรายเอเจนต์:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  },
}
```

หลีกเลี่ยงการใช้ `tools.allow: ["lobster"]` เว้นแต่คุณตั้งใจจะรันในโหมด allowlist แบบจำกัด

หมายเหตุ: allowlist เป็นแบบ opt-in สำหรับ plugin ทางเลือก หาก allowlist ของคุณระบุแค่
plugin tool (เช่น `lobster`) OpenClaw จะยังคงเปิด core tool ไว้ หากต้องการจำกัด core
tool ให้รวม core tool หรือกลุ่มที่คุณต้องการไว้ใน allowlist ด้วย

## ตัวอย่าง: Email triage

หากไม่มี Lobster:

```text
User: "Check my email and draft replies"
→ openclaw เรียก gmail.list
→ LLM สรุปผล
→ User: "draft replies to #2 and #5"
→ LLM ร่างข้อความ
→ User: "send #2"
→ openclaw เรียก gmail.send
(ทำซ้ำทุกวัน โดยไม่มีความทรงจำว่าอันไหนถูก triage ไปแล้ว)
```

หากมี Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

ส่งคืน JSON envelope (ตัดทอนแล้ว):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

ผู้ใช้อ นุมัติ → resume:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

หนึ่ง workflow กำหนดแน่นอน ปลอดภัย

## พารามิเตอร์ของ tool

### `run`

รัน pipeline ใน tool mode

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

รันไฟล์ workflow พร้อม args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

ดำเนินเวิร์กโฟลว์ที่หยุดไว้ต่อ หลังได้รับการอนุมัติ

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### อินพุตแบบไม่บังคับ

- `cwd`: ไดเรกทอรีทำงานแบบ relative สำหรับ pipeline (ต้องอยู่ภายใน gateway working directory)
- `timeoutMs`: ยกเลิก workflow หากเกินระยะเวลานี้ (ค่าเริ่มต้น: 20000)
- `maxStdoutBytes`: ยกเลิก workflow หากเอาต์พุตเกินขนาดนี้ (ค่าเริ่มต้น: 512000)
- `argsJson`: สตริง JSON ที่ส่งไปยัง `lobster run --args-json` (เฉพาะไฟล์ workflow)

## Output envelope

Lobster ส่งคืน JSON envelope พร้อมหนึ่งในสามสถานะ:

- `ok` → เสร็จสมบูรณ์สำเร็จ
- `needs_approval` → หยุดชั่วคราว; ต้องใช้ `requiresApproval.resumeToken` เพื่อ resume
- `cancelled` → ถูกปฏิเสธหรือยกเลิกอย่างชัดเจน

tool จะเปิดเผย envelope ทั้งใน `content` (pretty JSON) และ `details` (raw object)

## Approvals

หากมี `requiresApproval` ให้ตรวจดู prompt และตัดสินใจ:

- `approve: true` → resume และทำ side effect ต่อ
- `approve: false` → ยกเลิกและปิดเวิร์กโฟลว์

ใช้ `approve --preview-from-stdin --limit N` เพื่อแนบ JSON preview กับคำขออนุมัติโดยไม่ต้องใช้ jq/heredoc แบบกำหนดเอง ตอนนี้ resume token มีขนาดกะทัดรัด: Lobster เก็บ workflow resume state ไว้ใต้ state dir ของตัวเอง แล้วส่งกลับเป็น token key ขนาดเล็ก

## OpenProse

OpenProse ใช้งานร่วมกับ Lobster ได้ดี: ใช้ `/prose` เพื่อ orchestrate การเตรียมงานแบบหลายเอเจนต์ จากนั้นรัน Lobster pipeline เพื่อ approval แบบกำหนดแน่นอน หาก Prose program ต้องใช้ Lobster ให้อนุญาต tool `lobster` สำหรับ sub-agent ผ่าน `tools.subagents.tools` ดู [OpenProse](/th/prose)

## ความปลอดภัย

- **ในเครื่องและในโปรเซสเท่านั้น** — workflow รันภายในโปรเซสของ gateway; plugin เองไม่ทำ network call
- **ไม่มี secrets** — Lobster ไม่ได้จัดการ OAuth; มันเรียก OpenClaw tool ที่จัดการให้
- **รับรู้ sandbox** — ถูกปิดใช้งานเมื่อบริบทของ tool อยู่ใน sandbox
- **เสริมความแข็งแกร่งแล้ว** — embedded runner บังคับใช้ timeout และ output cap

## การแก้ไขปัญหา

- **`lobster timed out`** → เพิ่ม `timeoutMs` หรือแยก pipeline ที่ยาวออก
- **`lobster output exceeded maxStdoutBytes`** → เพิ่ม `maxStdoutBytes` หรือทำให้เอาต์พุตเล็กลง
- **`lobster returned invalid JSON`** → ตรวจสอบว่า pipeline รันใน tool mode และพิมพ์เฉพาะ JSON
- **`lobster failed`** → ตรวจ gateway log เพื่อดูรายละเอียดข้อผิดพลาดของ embedded runner

## เรียนรู้เพิ่มเติม

- [Plugins](/th/tools/plugin)
- [Plugin tool authoring](/th/plugins/building-plugins#registering-agent-tools)

## กรณีศึกษา: เวิร์กโฟลว์จากชุมชน

ตัวอย่างสาธารณะหนึ่งคือ “second brain” CLI + Lobster pipeline ที่จัดการ Markdown vault สามชุด (ส่วนตัว, คู่ชีวิต, ใช้ร่วมกัน) CLI ส่ง JSON สำหรับสถิติ รายการ inbox และ stale scan; Lobster เชื่อมคำสั่งเหล่านั้นเป็น workflow เช่น `weekly-review`, `inbox-triage`, `memory-consolidation` และ `shared-task-sync` โดยแต่ละอันมี approval gate AI จัดการการตัดสินใจ (การจัดหมวดหมู่) เมื่อทำได้ และ fallback ไปยังกฎแบบกำหนดแน่นอนเมื่อทำไม่ได้

- เธรด: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ที่เกี่ยวข้อง

- [Automation & Tasks](/th/automation) — การตั้งเวลาเวิร์กโฟลว์ Lobster
- [Automation Overview](/th/automation) — กลไกระบบอัตโนมัติทั้งหมด
- [Tools Overview](/th/tools) — ภาพรวม tool ทั้งหมดที่เอเจนต์ใช้ได้
