---
read_when:
    - คุณต้องการเวิร์กโฟลว์หลายขั้นตอนแบบกำหนดได้แน่นอนพร้อมการอนุมัติที่ชัดเจน
    - คุณต้องการให้เวิร์กโฟลว์ทำงานต่อได้โดยไม่ต้องรันขั้นตอนก่อนหน้าใหม่อีกครั้ง
summary: รันไทม์เวิร์กโฟลว์แบบมีชนิดข้อมูลสำหรับ OpenClaw พร้อมจุดควบคุมการอนุมัติที่สามารถทำงานต่อได้
title: Lobster
x-i18n:
    generated_at: "2026-04-24T09:37:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster เป็นเชลล์เวิร์กโฟลว์ที่ทำให้ OpenClaw สามารถรันลำดับเครื่องมือหลายขั้นตอนเป็นการดำเนินการเดียวแบบกำหนดได้แน่นอน พร้อมจุดตรวจการอนุมัติที่ชัดเจน

Lobster เป็นชั้นการเขียนเวิร์กโฟลว์ที่อยู่สูงกว่างานเบื้องหลังแบบ detached อยู่หนึ่งระดับ สำหรับการ orchestrate โฟลว์ที่อยู่เหนือระดับงานเดี่ยว ดู [Task Flow](/th/automation/taskflow) (`openclaw tasks flow`) สำหรับ ledger กิจกรรมของงาน ดู [`openclaw tasks`](/th/automation/tasks)

## จุดเด่น

ผู้ช่วยของคุณสามารถสร้างเครื่องมือที่ใช้จัดการตัวมันเองได้ ขอเวิร์กโฟลว์มา แล้วอีก 30 นาทีต่อมาคุณก็ได้ CLI พร้อม pipelines ที่รันเป็นหนึ่งคำสั่งเรียก Lobster คือชิ้นส่วนที่ขาดหายไป: pipelines แบบกำหนดได้แน่นอน การอนุมัติแบบชัดเจน และสถานะที่ทำงานต่อได้

## ทำไมต้องมีสิ่งนี้

ปัจจุบัน เวิร์กโฟลว์ที่ซับซ้อนต้องใช้การเรียกเครื่องมือโต้ตอบกลับไปกลับมาหลายครั้ง แต่ละครั้งใช้โทเค็น และ LLM ต้อง orchestrate ทุกขั้นตอน Lobster ย้าย orchestration นั้นเข้าไปอยู่ใน runtime แบบมีชนิดข้อมูล:

- **หนึ่งคำสั่งเรียกแทนหลายครั้ง**: OpenClaw รันการเรียกเครื่องมือ Lobster เพียงครั้งเดียวและได้ผลลัพธ์แบบมีโครงสร้าง
- **มีการอนุมัติในตัว**: ผลข้างเคียง (ส่งอีเมล โพสต์คอมเมนต์) จะหยุดเวิร์กโฟลว์จนกว่าจะได้รับการอนุมัติอย่างชัดเจน
- **ทำงานต่อได้**: เวิร์กโฟลว์ที่หยุดไว้จะคืนโทเค็น; อนุมัติแล้วทำงานต่อได้โดยไม่ต้องรันทุกอย่างใหม่

## ทำไมต้องเป็น DSL แทนโปรแกรมทั่วไป?

Lobster ถูกออกแบบให้เล็กโดยตั้งใจ เป้าหมายไม่ใช่ “ภาษาใหม่” แต่เป็นสเปก pipeline ที่คาดการณ์ได้ เป็นมิตรกับ AI และมี approvals กับ resume tokens เป็นความสามารถหลัก

- **การอนุมัติ/ทำงานต่อมีมาในตัว**: โปรแกรมทั่วไปสามารถถามมนุษย์ได้ แต่ไม่สามารถ _หยุดแล้วทำงานต่อ_ ด้วยโทเค็นแบบคงทนได้ หากคุณไม่สร้าง runtime นั้นขึ้นมาเอง
- **กำหนดได้แน่นอน + ตรวจสอบย้อนหลังได้**: pipelines เป็นข้อมูล จึงบันทึก log, diff, replay และ review ได้ง่าย
- **พื้นผิวจำกัดสำหรับ AI**: ไวยากรณ์เล็ก ๆ + การส่งข้อมูลผ่าน JSON ช่วยลดเส้นทางโค้ดแบบ “สร้างสรรค์” และทำให้การ validation เป็นจริงได้
- **ฝังนโยบายความปลอดภัยไว้แล้ว**: timeouts, output caps, การตรวจสอบ sandbox และ allowlists ถูกบังคับใช้โดย runtime ไม่ใช่โดยแต่ละสคริปต์
- **ยังคงเขียนโปรแกรมได้**: แต่ละขั้นตอนสามารถเรียก CLI หรือสคริปต์ใดก็ได้ หากคุณต้องการ JS/TS ให้สร้างไฟล์ `.lobster` จากโค้ด

## วิธีการทำงาน

OpenClaw รันเวิร์กโฟลว์ Lobster **ภายในโปรเซส** โดยใช้ runner แบบฝัง ไม่ได้ spawn subprocess ของ CLI ภายนอก; เอนจินเวิร์กโฟลว์ทำงานอยู่ภายในโปรเซสของ gateway และคืน JSON envelope โดยตรง
หาก pipeline หยุดเพื่อรอการอนุมัติ เครื่องมือจะคืน `resumeToken` เพื่อให้คุณทำต่อภายหลังได้

## รูปแบบ: CLI เล็ก ๆ + JSON pipes + approvals

สร้างคำสั่งขนาดเล็กที่สื่อสารด้วย JSON แล้วเชื่อมต่อเป็นการเรียก Lobster เพียงครั้งเดียว (ชื่อตัวอย่างด้านล่าง — เปลี่ยนเป็นของคุณเองได้)

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

หาก pipeline ขอการอนุมัติ ให้ทำงานต่อด้วยโทเค็น:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI เป็นผู้ทริกเกอร์เวิร์กโฟลว์; Lobster เป็นผู้รันขั้นตอนต่าง ๆ จุดควบคุมการอนุมัติทำให้ผลข้างเคียงยังคงชัดเจนและตรวจสอบย้อนหลังได้

ตัวอย่าง: map รายการอินพุตไปเป็นการเรียกเครื่องมือ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## ขั้นตอน LLM แบบ JSON-only (`llm-task`)

สำหรับเวิร์กโฟลว์ที่ต้องการ **ขั้นตอน LLM แบบมีโครงสร้าง** ให้เปิดใช้เครื่องมือ Plugin `llm-task` แบบทางเลือก
แล้วเรียกใช้จาก Lobster วิธีนี้ทำให้เวิร์กโฟลว์ยังคง
กำหนดได้แน่นอน ขณะเดียวกันก็ยังให้คุณจัดหมวดหมู่/สรุป/ร่างด้วยโมเดลได้

เปิดใช้เครื่องมือ:

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

## ไฟล์เวิร์กโฟลว์ (.lobster)

Lobster สามารถรันไฟล์เวิร์กโฟลว์ YAML/JSON ที่มีฟิลด์ `name`, `args`, `steps`, `env`, `condition` และ `approval` ได้ ในการเรียกเครื่องมือของ OpenClaw ให้ตั้ง `pipeline` เป็นพาธของไฟล์

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

- `stdin: $step.stdout` และ `stdin: $step.json` ใช้ส่งเอาต์พุตของขั้นตอนก่อนหน้า
- `condition` (หรือ `when`) ใช้ควบคุมการรันขั้นตอนตาม `$step.approved` ได้

## ติดตั้ง Lobster

เวิร์กโฟลว์ Lobster ที่ bundled มาจะรันภายในโปรเซส; ไม่ต้องมีไบนารี `lobster` แยกต่างหาก embedded runner จะมาพร้อมกับ Plugin Lobster

หากคุณต้องการ Lobster CLI แบบ standalone สำหรับการพัฒนาหรือ pipelines ภายนอก ให้ติดตั้งจาก [รีโป Lobster](https://github.com/openclaw/lobster) และตรวจสอบให้แน่ใจว่า `lobster` อยู่บน `PATH`

## เปิดใช้เครื่องมือ

Lobster เป็นเครื่องมือ Plugin แบบ **ทางเลือก** (ไม่ได้เปิดใช้โดยค่าเริ่มต้น)

คำแนะนำที่ปลอดภัยและเพิ่มแบบไม่กระทบของเดิม:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

หรือกำหนดต่อเอเจนต์:

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
  }
}
```

หลีกเลี่ยงการใช้ `tools.allow: ["lobster"]` เว้นแต่คุณตั้งใจจะรันในโหมด allowlist แบบจำกัด

หมายเหตุ: allowlists สำหรับ optional plugins เป็นแบบ opt-in หาก allowlist ของคุณระบุชื่อเฉพาะ
เครื่องมือ Plugin (เช่น `lobster`) OpenClaw จะยังคงเปิดใช้ core tools ไว้ หากต้องการจำกัด core
tools ให้ใส่ core tools หรือกลุ่มที่คุณต้องการไว้ใน allowlist ด้วย

## ตัวอย่าง: การคัดแยกอีเมล

หากไม่มี Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

เมื่อใช้ Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

จะคืน JSON envelope (ตัดทอนแล้ว):

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

ผู้ใช้อนุมัติ → ทำงานต่อ:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

หนึ่งเวิร์กโฟลว์ กำหนดได้แน่นอน ปลอดภัย

## พารามิเตอร์ของเครื่องมือ

### `run`

รัน pipeline ในโหมดเครื่องมือ

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

รันไฟล์เวิร์กโฟลว์พร้อม args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

ทำเวิร์กโฟลว์ที่หยุดไว้ให้ทำงานต่อหลังการอนุมัติ

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### อินพุตทางเลือก

- `cwd`: ไดเรกทอรีทำงานแบบ relative สำหรับ pipeline (ต้องอยู่ภายในไดเรกทอรีทำงานของ gateway เท่านั้น)
- `timeoutMs`: ยกเลิกเวิร์กโฟลว์หากใช้เวลานานเกินค่านี้ (ค่าเริ่มต้น: 20000)
- `maxStdoutBytes`: ยกเลิกเวิร์กโฟลว์หากเอาต์พุตเกินขนาดนี้ (ค่าเริ่มต้น: 512000)
- `argsJson`: สตริง JSON ที่ส่งให้ `lobster run --args-json` (เฉพาะไฟล์เวิร์กโฟลว์)

## Output envelope

Lobster คืน JSON envelope พร้อมหนึ่งในสามสถานะ:

- `ok` → เสร็จสมบูรณ์สำเร็จ
- `needs_approval` → หยุดชั่วคราว; ต้องใช้ `requiresApproval.resumeToken` เพื่อทำงานต่อ
- `cancelled` → ถูกปฏิเสธหรือยกเลิกอย่างชัดเจน

เครื่องมือจะแสดง envelope ทั้งใน `content` (pretty JSON) และ `details` (ออบเจ็กต์ดิบ)

## การอนุมัติ

หากมี `requiresApproval` ให้ตรวจสอบ prompt และตัดสินใจ:

- `approve: true` → ทำงานต่อและดำเนินผลข้างเคียงต่อ
- `approve: false` → ยกเลิกและจบเวิร์กโฟลว์

ใช้ `approve --preview-from-stdin --limit N` เพื่อแนบ preview แบบ JSON ไปกับคำขออนุมัติโดยไม่ต้องใช้ glue แบบ jq/heredoc เอง resume tokens ตอนนี้มีขนาดเล็กลง: Lobster จะเก็บสถานะสำหรับ resume ของเวิร์กโฟลว์ไว้ใต้ state dir ของมัน และส่งคืนเพียงคีย์โทเค็นขนาดเล็ก

## OpenProse

OpenProse ใช้งานร่วมกับ Lobster ได้ดี: ใช้ `/prose` เพื่อ orchestrate การเตรียมงานหลายเอเจนต์ แล้วค่อยรัน pipeline ของ Lobster สำหรับ approvals แบบกำหนดได้แน่นอน หากโปรแกรม Prose ต้องใช้ Lobster ให้เปิดใช้เครื่องมือ `lobster` สำหรับ Sub-agent ผ่าน `tools.subagents.tools` ดู [OpenProse](/th/prose)

## ความปลอดภัย

- **ภายในโปรเซสในเครื่องเท่านั้น** — เวิร์กโฟลว์ทำงานภายในโปรเซสของ gateway; ตัว Plugin เองไม่เรียกเครือข่าย
- **ไม่มีการจัดการความลับ** — Lobster ไม่จัดการ OAuth; มันเรียกเครื่องมือของ OpenClaw ที่จัดการเรื่องนั้น
- **รับรู้สถานะ sandbox** — จะถูกปิดเมื่อบริบทของเครื่องมืออยู่ใน sandbox
- **เสริมความแข็งแกร่งแล้ว** — embedded runner บังคับใช้ timeouts และ output caps

## การแก้ไขปัญหา

- **`lobster timed out`** → เพิ่ม `timeoutMs` หรือแยก pipeline ที่ยาวออกเป็นส่วน ๆ
- **`lobster output exceeded maxStdoutBytes`** → เพิ่ม `maxStdoutBytes` หรือลดขนาดเอาต์พุต
- **`lobster returned invalid JSON`** → ตรวจสอบให้แน่ใจว่า pipeline รันในโหมดเครื่องมือและพิมพ์เฉพาะ JSON เท่านั้น
- **`lobster failed`** → ตรวจสอบ gateway logs เพื่อดูรายละเอียดข้อผิดพลาดจาก embedded runner

## เรียนรู้เพิ่มเติม

- [Plugins](/th/tools/plugin)
- [การเขียนเครื่องมือ Plugin](/th/plugins/building-plugins#registering-agent-tools)

## กรณีศึกษา: เวิร์กโฟลว์จากชุมชน

ตัวอย่างสาธารณะหนึ่งรายการ: CLI แบบ “second brain” + pipelines ของ Lobster ที่จัดการ Markdown vault สามชุด (ส่วนตัว, คู่ชีวิต, ใช้ร่วมกัน) CLI จะปล่อย JSON สำหรับสถิติ รายการ inbox และการสแกนสิ่งที่ค้างนาน; Lobster เชื่อมคำสั่งเหล่านั้นเป็นเวิร์กโฟลว์อย่าง `weekly-review`, `inbox-triage`, `memory-consolidation` และ `shared-task-sync` โดยแต่ละรายการมีจุดควบคุมการอนุมัติ AI จัดการงานที่ต้องใช้ดุลยพินิจ (การจัดหมวดหมู่) เมื่อพร้อมใช้งาน และ fallback ไปใช้กฎแบบกำหนดได้แน่นอนเมื่อไม่พร้อมใช้งาน

- เธรด: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- รีโป: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ที่เกี่ยวข้อง

- [Automation & Tasks](/th/automation) — การตั้งเวลารันเวิร์กโฟลว์ Lobster
- [ภาพรวม Automation](/th/automation) — กลไกอัตโนมัติทั้งหมด
- [ภาพรวมเครื่องมือ](/th/tools) — เครื่องมือเอเจนต์ทั้งหมดที่มีให้ใช้งาน
