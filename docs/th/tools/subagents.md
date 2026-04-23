---
read_when:
    - คุณต้องการงานเบื้องหลัง/งานแบบขนานผ่านเอเจนต์
    - คุณกำลังเปลี่ยนนโยบายของเครื่องมือ sessions_spawn หรือ sub-agent
    - คุณกำลังติดตั้งใช้งานหรือแก้ปัญหาเซสชัน subagent ที่ผูกกับเธรด
summary: 'Sub-agents: การเรียกใช้งานเอเจนต์แบบแยกอิสระซึ่งประกาศผลลัพธ์กลับมายังแชตของผู้ร้องขอ'
title: Sub-Agents
x-i18n:
    generated_at: "2026-04-23T06:03:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-agents

Sub-agents คือการรันเอเจนต์เบื้องหลังที่ถูกสร้างขึ้นจากการรันเอเจนต์ที่มีอยู่แล้ว โดยจะทำงานในเซสชันของตัวเอง (`agent:<agentId>:subagent:<uuid>`) และเมื่อเสร็จสิ้นแล้ว จะ **ประกาศ** ผลลัพธ์กลับไปยังช่องแชตของผู้ร้องขอ แต่ละการรันของ sub-agent จะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

## คำสั่ง Slash

ใช้ `/subagents` เพื่อตรวจสอบหรือควบคุมการรัน sub-agent สำหรับ **เซสชันปัจจุบัน**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

ตัวควบคุมการผูกกับเธรด:

คำสั่งเหล่านี้ใช้ได้กับช่องทางที่รองรับการผูกกับเธรดแบบคงอยู่ ดู **ช่องทางที่รองรับเธรด** ด้านล่าง

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` แสดง metadata ของการรัน (สถานะ, timestamps, session id, transcript path, cleanup)
ใช้ `sessions_history` สำหรับมุมมองการเรียกคืนแบบมีขอบเขตและผ่านตัวกรองความปลอดภัย; ตรวจสอบ
transcript path บนดิสก์เมื่อคุณต้องการ transcript แบบเต็มดิบ

### พฤติกรรมการ spawn

`/subagents spawn` จะเริ่ม sub-agent เบื้องหลังในรูปแบบคำสั่งผู้ใช้ ไม่ใช่ internal relay และจะส่งอัปเดตการเสร็จสิ้นขั้นสุดท้ายกลับไปยังแชตของผู้ร้องขอเมื่อการรันเสร็จสิ้น

- คำสั่ง spawn เป็นแบบ non-blocking; จะส่งกลับ run id ทันที
- เมื่อเสร็จสิ้น sub-agent จะประกาศข้อความสรุป/ผลลัพธ์กลับไปยังช่องแชตของผู้ร้องขอ
- การส่งมอบเมื่อเสร็จสิ้นเป็นแบบ push-based เมื่อ spawn แล้ว อย่าทำการ poll `/subagents list`,
  `sessions_list` หรือ `sessions_history` แบบวนลูปเพียงเพื่อรอให้มัน
  เสร็จสิ้น; ให้ตรวจสอบสถานะเฉพาะเมื่อจำเป็นสำหรับการดีบักหรือการแทรกแซง
- เมื่อเสร็จสิ้น OpenClaw จะพยายามอย่างดีที่สุดในการปิดแท็บ/โปรเซสของเบราว์เซอร์ที่ติดตามไว้ซึ่งเปิดโดยเซสชัน sub-agent นั้น ก่อนที่โฟลว์ cleanup สำหรับการประกาศจะดำเนินการต่อ
- สำหรับการ spawn แบบแมนนวล การส่งมอบมีความทนทาน:
  - OpenClaw จะลองส่งแบบ `agent` โดยตรงก่อนด้วย idempotency key ที่เสถียร
  - หากการส่งแบบตรงล้มเหลว จะ fallback ไปใช้ queue routing
  - หาก queue routing ยังไม่พร้อมใช้งาน การประกาศจะถูกลองใหม่ด้วย short exponential backoff ก่อนยอมแพ้ในที่สุด
- การส่งมอบเมื่อเสร็จสิ้นจะคง requester route ที่ถูก resolve แล้ว:
  - completion routes แบบ thread-bound หรือ conversation-bound จะมีลำดับความสำคัญเมื่อพร้อมใช้งาน
  - หากต้นทางการเสร็จสิ้นให้มาเพียง channel เท่านั้น OpenClaw จะเติม target/account ที่ขาดหายไปจาก resolved route ของ requester session (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งแบบตรงยังทำงานได้
- การ handoff สถานะเสร็จสิ้นไปยัง requester session เป็น internal context ที่สร้างขึ้นขณะรันไทม์ (ไม่ใช่ข้อความที่ผู้ใช้เขียน) และประกอบด้วย:
  - `Result` (ข้อความ `assistant` ล่าสุดที่มองเห็นได้ หรือหากไม่มี ให้ใช้ข้อความ tool/toolResult ล่าสุดที่ผ่านการ sanitize; การรันที่จบแบบ failed จะไม่นำข้อความตอบกลับที่จับไว้มาใช้ซ้ำ)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - สถิติ runtime/token แบบย่อ
  - คำสั่งการส่งมอบที่บอก requester agent ให้เขียนใหม่ด้วยน้ำเสียง assistant ตามปกติ (ไม่ใช่ส่งต่อ raw internal metadata)
- `--model` และ `--thinking` จะ override ค่าเริ่มต้นสำหรับการรันนั้นโดยเฉพาะ
- ใช้ `info`/`log` เพื่อตรวจสอบรายละเอียดและเอาต์พุตหลังจากเสร็จสิ้น
- `/subagents spawn` เป็นโหมด one-shot (`mode: "run"`) สำหรับเซสชันแบบ thread-bound ที่คงอยู่ ให้ใช้ `sessions_spawn` พร้อม `thread: true` และ `mode: "session"`
- สำหรับเซสชัน ACP harness (Codex, Claude Code, Gemini CLI) ให้ใช้ `sessions_spawn` พร้อม `runtime: "acp"` และดู [ACP Agents](/th/tools/acp-agents) โดยเฉพาะ [ACP delivery model](/th/tools/acp-agents#delivery-model) เมื่อต้องดีบักการส่งมอบเมื่อเสร็จสิ้นหรือ agent-to-agent loops

เป้าหมายหลัก:

- ทำงานแบบขนานสำหรับงานประเภท "ค้นคว้า / งานยาว / tool ที่ช้า" โดยไม่บล็อกการรันหลัก
- แยก sub-agent ออกจากกันโดยค่าเริ่มต้น (แยกเซสชัน + มี sandboxing แบบเลือกได้)
- ทำให้พื้นผิวของ tool ใช้งานผิดได้ยาก: sub-agents จะ **ไม่ได้รับ** session tools โดยค่าเริ่มต้น
- รองรับความลึกของการซ้อนที่กำหนดค่าได้สำหรับรูปแบบ orchestrator

หมายเหตุด้านค่าใช้จ่าย: แต่ละ sub-agent มี context และการใช้ token **เป็นของตัวเอง**
สำหรับงานที่หนักหรือทำซ้ำบ่อย ให้ตั้งโมเดลที่ถูกกว่าสำหรับ sub-agents และคงเอเจนต์หลักของคุณไว้บนโมเดลที่มีคุณภาพสูงกว่า
คุณสามารถกำหนดค่านี้ผ่าน `agents.defaults.subagents.model` หรือ overrides ระดับต่อเอเจนต์

## Tool

ใช้ `sessions_spawn`:

- เริ่มการรัน sub-agent (`deliver: false`, global lane: `subagent`)
- จากนั้นรันขั้นตอน announce และโพสต์คำตอบ announce ไปยังช่องแชตของผู้ร้องขอ
- โมเดลเริ่มต้น: สืบทอดจากผู้เรียก เว้นแต่คุณจะตั้ง `agents.defaults.subagents.model` (หรือ `agents.list[].subagents.model` ระดับต่อเอเจนต์); ค่า `sessions_spawn.model` แบบ explicit จะมีสิทธิ์เหนือกว่าเสมอ
- Thinking เริ่มต้น: สืบทอดจากผู้เรียก เว้นแต่คุณจะตั้ง `agents.defaults.subagents.thinking` (หรือ `agents.list[].subagents.thinking` ระดับต่อเอเจนต์); ค่า `sessions_spawn.thinking` แบบ explicit จะมีสิทธิ์เหนือกว่าเสมอ
- หมดเวลาการรันเริ่มต้น: หากละ `sessions_spawn.runTimeoutSeconds` ไว้ OpenClaw จะใช้ `agents.defaults.subagents.runTimeoutSeconds` หากมีการตั้งไว้; มิฉะนั้นจะ fallback ไปเป็น `0` (ไม่มี timeout)

พารามิเตอร์ของ tool:

- `task` (จำเป็น)
- `label?` (ไม่บังคับ)
- `agentId?` (ไม่บังคับ; spawn ภายใต้ agent id อื่นหากได้รับอนุญาต)
- `model?` (ไม่บังคับ; override โมเดลของ sub-agent; ค่าที่ไม่ถูกต้องจะถูกข้าม และ sub-agent จะรันบนโมเดลเริ่มต้นพร้อมคำเตือนในผลลัพธ์ของ tool)
- `thinking?` (ไม่บังคับ; override ระดับ thinking สำหรับการรัน sub-agent)
- `runTimeoutSeconds?` (ค่าเริ่มต้นคือ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งไว้ มิฉะนั้นเป็น `0`; เมื่อตั้งค่าไว้ การรัน sub-agent จะถูกยุติหลังจาก N วินาที)
- `thread?` (ค่าเริ่มต้น `false`; เมื่อเป็น `true` จะขอการผูกกับเธรดของช่องทางสำหรับเซสชัน sub-agent นี้)
- `mode?` (`run|session`)
  - ค่าเริ่มต้นคือ `run`
  - หาก `thread: true` และละ `mode` ไว้ ค่าเริ่มต้นจะเปลี่ยนเป็น `session`
  - `mode: "session"` ต้องใช้ร่วมกับ `thread: true`
- `cleanup?` (`delete|keep`, ค่าเริ่มต้น `keep`)
- `sandbox?` (`inherit|require`, ค่าเริ่มต้น `inherit`; `require` จะปฏิเสธการ spawn เว้นแต่ child runtime เป้าหมายจะอยู่ใน sandbox)
- `sessions_spawn` **ไม่** รับพารามิเตอร์การส่งผ่านช่องทาง (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`) สำหรับการส่งมอบ ให้ใช้ `message`/`sessions_send` จากการรันที่ถูก spawn

## เซสชันที่ผูกกับเธรด

เมื่อเปิดใช้การผูกกับเธรดสำหรับช่องทางหนึ่ง sub-agent สามารถคงการผูกไว้กับเธรดได้ ดังนั้นข้อความผู้ใช้ที่ติดตามมาในเธรดนั้นจะยังคงถูกส่งไปยังเซสชัน sub-agent เดิม

### ช่องทางที่รองรับเธรด

- Discord (ปัจจุบันเป็นช่องทางเดียวที่รองรับ): รองรับเซสชัน subagent แบบผูกกับเธรดอย่างคงอยู่ (`sessions_spawn` พร้อม `thread: true`), ตัวควบคุมเธรดแบบแมนนวล (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) และ adapter keys `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` และ `channels.discord.threadBindings.spawnSubagentSessions`

โฟลว์แบบย่อ:

1. Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และอาจใช้ `mode: "session"` ด้วย)
2. OpenClaw จะสร้างหรือผูกเธรดเข้ากับเป้าหมายเซสชันนั้นในช่องทางที่ใช้งานอยู่
3. การตอบกลับและข้อความติดตามในเธรดนั้นจะถูกส่งไปยังเซสชันที่ผูกไว้
4. ใช้ `/session idle` เพื่อตรวจสอบ/อัปเดตการยกเลิกการโฟกัสอัตโนมัติจากการไม่มีการใช้งาน และใช้ `/session max-age` เพื่อควบคุม hard cap
5. ใช้ `/unfocus` เพื่อยกเลิกการผูกด้วยตนเอง

ตัวควบคุมแบบแมนนวล:

- `/focus <target>` จะผูกเธรดปัจจุบัน (หรือสร้างใหม่) เข้ากับเป้าหมาย sub-agent/session
- `/unfocus` จะลบการผูกสำหรับเธรดที่ผูกอยู่ในปัจจุบัน
- `/agents` จะแสดงรายการการรันที่ใช้งานอยู่และสถานะการผูก (`thread:<id>` หรือ `unbound`)
- `/session idle` และ `/session max-age` ใช้งานได้เฉพาะกับเธรดที่ถูกโฟกัสและผูกไว้เท่านั้น

สวิตช์การกำหนดค่า:

- ค่าเริ่มต้นส่วนกลาง: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- ค่า override ระดับช่องทางและคีย์ auto-bind ตอน spawn จะขึ้นกับ adapter ดู **ช่องทางที่รองรับเธรด** ด้านบน

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) และ [คำสั่ง Slash](/th/tools/slash-commands) สำหรับรายละเอียด adapter ปัจจุบัน

Allowlist:

- `agents.list[].subagents.allowAgents`: รายการ agent ids ที่สามารถกำหนดเป้าหมายผ่าน `agentId` ได้ (`["*"]` เพื่ออนุญาตทั้งหมด) ค่าเริ่มต้น: อนุญาตเฉพาะ requester agent
- `agents.defaults.subagents.allowAgents`: target-agent allowlist เริ่มต้นที่ใช้เมื่อ requester agent ไม่ได้ตั้ง `subagents.allowAgents` ของตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หาก requester session อยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่อาจรันนอก sandbox
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ไม่ระบุ `agentId` (บังคับให้เลือกโปรไฟล์อย่าง explicit) ค่าเริ่มต้น: false

การค้นหา:

- ใช้ `agents_list` เพื่อดูว่า agent ids ใดได้รับอนุญาตสำหรับ `sessions_spawn` อยู่ในปัจจุบัน

การเก็บถาวรอัตโนมัติ:

- เซสชัน sub-agent จะถูกเก็บถาวรโดยอัตโนมัติหลังจาก `agents.defaults.subagents.archiveAfterMinutes` (ค่าเริ่มต้น: 60)
- การเก็บถาวรใช้ `sessions.delete` และเปลี่ยนชื่อ transcript เป็น `*.deleted.<timestamp>` (โฟลเดอร์เดิม)
- `cleanup: "delete"` จะเก็บถาวรทันทีหลังจาก announce (แต่ยังคงเก็บ transcript ไว้ผ่านการเปลี่ยนชื่อ)
- การเก็บถาวรอัตโนมัติเป็นแบบ best-effort; timers ที่รอดำเนินการจะหายไปหาก gateway รีสตาร์ต
- `runTimeoutSeconds` **ไม่** ทำให้เกิดการเก็บถาวรอัตโนมัติ; มันเพียงหยุดการรันเท่านั้น เซสชันจะยังคงอยู่จนกว่าจะมีการเก็บถาวรอัตโนมัติ
- การเก็บถาวรอัตโนมัติใช้เหมือนกันทั้งกับเซสชัน depth-1 และ depth-2
- การ cleanup ของเบราว์เซอร์แยกจากการ cleanup ของการเก็บถาวร: แท็บ/โปรเซสของเบราว์เซอร์ที่ติดตามไว้จะถูกพยายามปิดอย่างดีที่สุดเมื่อการรันเสร็จสิ้น แม้ว่าจะเก็บ transcript/บันทึกเซสชันไว้ก็ตาม

## Nested Sub-Agents

โดยค่าเริ่มต้น sub-agents ไม่สามารถ spawn sub-agents ของตัวเองได้ (`maxSpawnDepth: 1`) คุณสามารถเปิดใช้การซ้อนได้หนึ่งระดับโดยตั้งค่า `maxSpawnDepth: 2` ซึ่งจะอนุญาต **รูปแบบ orchestrator**: main → orchestrator sub-agent → worker sub-sub-agents

### วิธีเปิดใช้

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // อนุญาตให้ sub-agents spawn ลูกได้ (ค่าเริ่มต้น: 1)
        maxChildrenPerAgent: 5, // จำนวนลูกที่ active พร้อมกันสูงสุดต่อเซสชันเอเจนต์ (ค่าเริ่มต้น: 5)
        maxConcurrent: 8, // concurrency lane cap ส่วนกลาง (ค่าเริ่มต้น: 8)
        runTimeoutSeconds: 900, // timeout เริ่มต้นสำหรับ sessions_spawn เมื่อไม่ระบุ (0 = ไม่มี timeout)
      },
    },
  },
}
```

### ระดับความลึก

| Depth | รูปแบบ session key                           | บทบาท                                        | spawn ได้หรือไม่              |
| ----- | -------------------------------------------- | -------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                            | เอเจนต์หลัก                                   | ได้เสมอ                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (หรือ orchestrator เมื่ออนุญาต depth 2) | ได้เฉพาะเมื่อ `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker ปลายทาง)               | ไม่ได้                         |

### สายโซ่การประกาศ

ผลลัพธ์จะไหลย้อนกลับขึ้นมาตามลำดับ:

1. worker ระดับ depth-2 เสร็จสิ้น → ประกาศไปยัง parent ของมัน (orchestrator ระดับ depth-1)
2. orchestrator ระดับ depth-1 รับการประกาศ สังเคราะห์ผลลัพธ์ เสร็จสิ้น → ประกาศไปยัง main
3. เอเจนต์หลักรับการประกาศและส่งต่อให้ผู้ใช้

แต่ละระดับจะมองเห็นเฉพาะการประกาศจากลูกโดยตรงของตัวเอง

แนวทางปฏิบัติการ:

- เริ่มงานของลูกเพียงครั้งเดียวแล้วรอ completion events แทนการสร้าง poll
  loops รอบ `sessions_list`, `sessions_history`, `/subagents list` หรือ
  คำสั่ง `exec` sleep
- หาก child completion event มาถึงหลังจากที่คุณส่งคำตอบสุดท้ายไปแล้ว
  การติดตามผลที่ถูกต้องคือโทเค็นแบบเงียบ `NO_REPLY` / `no_reply` แบบตรงตัว

### นโยบายของ tool ตามความลึก

- ขอบเขตของบทบาทและการควบคุมจะถูกเขียนลงใน metadata ของเซสชันตั้งแต่ตอน spawn ซึ่งช่วยป้องกันไม่ให้ session keys แบบแบนหรือที่ถูกกู้คืนกลับมา ได้สิทธิ์ orchestrator โดยไม่ตั้งใจ
- **Depth 1 (orchestrator, เมื่อ `maxSpawnDepth >= 2`)**: ได้รับ `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` เพื่อให้จัดการลูกของตัวเองได้ ส่วน session/system tools อื่น ๆ จะยังถูกปฏิเสธ
- **Depth 1 (leaf, เมื่อ `maxSpawnDepth == 1`)**: ไม่มี session tools (เป็นพฤติกรรมค่าเริ่มต้นในปัจจุบัน)
- **Depth 2 (leaf worker)**: ไม่มี session tools — `sessions_spawn` จะถูกปฏิเสธเสมอที่ depth 2 และไม่สามารถ spawn ลูกต่อได้อีก

### ขีดจำกัดการ spawn ต่อเอเจนต์

แต่ละเซสชันเอเจนต์ (ที่ depth ใดก็ได้) สามารถมีลูกที่ active พร้อมกันได้สูงสุด `maxChildrenPerAgent` (ค่าเริ่มต้น: 5) ซึ่งช่วยป้องกันการแตกแขนงเกินควบคุมจาก orchestrator ตัวเดียว

### การหยุดแบบ cascade

การหยุด orchestrator ระดับ depth-1 จะหยุดลูกระดับ depth-2 ทั้งหมดโดยอัตโนมัติ:

- `/stop` ในแชตหลักจะหยุดเอเจนต์ depth-1 ทั้งหมด และ cascade ไปยังลูก depth-2 ของพวกมัน
- `/subagents kill <id>` จะหยุด sub-agent ที่ระบุ และ cascade ไปยังลูกของมัน
- `/subagents kill all` จะหยุด sub-agents ทั้งหมดของ requester และ cascade ต่อไป

## การยืนยันตัวตน

การยืนยันตัวตนของ sub-agent ถูก resolve ตาม **agent id** ไม่ใช่ตามประเภทเซสชัน:

- session key ของ sub-agent คือ `agent:<agentId>:subagent:<uuid>`
- auth store จะถูกโหลดจาก `agentDir` ของเอเจนต์นั้น
- auth profiles ของเอเจนต์หลักจะถูกรวมเข้ามาเป็น **fallback**; หากมีความขัดแย้ง โปรไฟล์ของเอเจนต์จะมีสิทธิ์เหนือกว่าโปรไฟล์ของเอเจนต์หลัก

หมายเหตุ: การรวมเป็นแบบ additive ดังนั้นโปรไฟล์ของเอเจนต์หลักจะพร้อมใช้งานเป็น fallback เสมอ ขณะนี้ยังไม่รองรับการแยก auth แบบสมบูรณ์ต่อเอเจนต์

## การประกาศ

Sub-agents รายงานกลับผ่านขั้นตอน announce:

- ขั้นตอน announce จะรันภายในเซสชัน sub-agent (ไม่ใช่เซสชันของ requester)
- หาก sub-agent ตอบกลับเป็น `ANNOUNCE_SKIP` แบบตรงตัว จะไม่มีการโพสต์อะไร
- หากข้อความ assistant ล่าสุดเป็นโทเค็นแบบเงียบ `NO_REPLY` / `no_reply` แบบตรงตัว
  เอาต์พุต announce จะถูกระงับ แม้ว่าก่อนหน้านี้จะมีความคืบหน้าที่มองเห็นได้ก็ตาม
- มิฉะนั้น การส่งมอบจะขึ้นอยู่กับ depth ของ requester:
  - เซสชัน requester ระดับบนสุดจะใช้การเรียก `agent` แบบ follow-up พร้อมการส่งออกภายนอก (`deliver=true`)
  - nested requester subagent sessions จะได้รับ internal follow-up injection (`deliver=false`) เพื่อให้ orchestrator สังเคราะห์ผลลัพธ์ของลูกภายในเซสชัน
  - หาก nested requester subagent session ไม่มีอยู่แล้ว OpenClaw จะ fallback ไปยัง requester ของเซสชันนั้นเมื่อสามารถทำได้
- สำหรับเซสชัน requester ระดับบนสุด การส่งแบบตรงใน completion-mode จะ resolve เส้นทาง conversation/thread ที่ผูกไว้และ hook override ก่อน จากนั้นจึงเติม channel-target fields ที่ขาดหายไปจากเส้นทางที่เก็บไว้ของ requester session ซึ่งช่วยให้ completions ไปยังแชต/หัวข้อที่ถูกต้อง แม้ต้นทางของ completion จะระบุเพียง channel เท่านั้น
- การรวม child completion จะถูกจำกัดขอบเขตไว้ที่ requester run ปัจจุบันเมื่อสร้าง nested completion findings เพื่อป้องกันไม่ให้เอาต์พุตของลูกจากรันก่อนหน้าที่ค้างอยู่รั่วไหลเข้ามาใน announce ปัจจุบัน
- คำตอบ announce จะคงเส้นทาง thread/topic ไว้เมื่อ channel adapters รองรับ
- announce context ถูกปรับให้เป็นบล็อกเหตุการณ์ภายในที่เสถียร:
  - แหล่งที่มา (`subagent` หรือ `cron`)
  - child session key/id
  - ประเภท announce + ป้ายกำกับ task
  - บรรทัดสถานะที่อนุมานจากผลลัพธ์ของ runtime (`success`, `error`, `timeout` หรือ `unknown`)
  - เนื้อหาผลลัพธ์ที่เลือกจากข้อความ assistant ล่าสุดที่มองเห็นได้ หรือหากไม่มี ให้ใช้ข้อความ tool/toolResult ล่าสุดที่ผ่านการ sanitize; การรันที่จบแบบ failed จะรายงานสถานะล้มเหลวโดยไม่เล่นซ้ำข้อความตอบกลับที่จับไว้
  - คำสั่ง follow-up ที่อธิบายว่าเมื่อใดควรตอบ และเมื่อใดควรเงียบ
- `Status` ไม่ได้อนุมานจากเอาต์พุตของโมเดล แต่ได้มาจากสัญญาณผลลัพธ์ของ runtime
- เมื่อหมดเวลา หาก child ไปได้เพียงถึงขั้น tool calls announce อาจย่อประวัตินั้นให้เป็นสรุปความคืบหน้าบางส่วนสั้น ๆ แทนการเล่นซ้ำเอาต์พุตของ tool แบบดิบ

payloads ของ announce จะมีบรรทัดสถิติที่ท้ายเสมอ (แม้จะอยู่ในรูปแบบ wrapped):

- Runtime (เช่น `runtime 5m12s`)
- การใช้ token (input/output/total)
- ค่าใช้จ่ายโดยประมาณเมื่อมีการกำหนดราคาโมเดลไว้ (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` และ transcript path (เพื่อให้เอเจนต์หลักดึงประวัติผ่าน `sessions_history` หรือตรวจสอบไฟล์บนดิสก์ได้)
- metadata ภายในมีไว้เพื่อการ orchestration เท่านั้น; คำตอบที่แสดงต่อผู้ใช้ควรถูกเขียนใหม่ด้วยน้ำเสียง assistant ตามปกติ

`sessions_history` เป็นเส้นทาง orchestration ที่ปลอดภัยกว่า:

- การเรียกคืน assistant จะถูก normalize ก่อน:
  - ลบ thinking tags
  - ลบบล็อก scaffolding ของ `<relevant-memories>` / `<relevant_memories>`
  - ลบบล็อก payload XML ของ tool-call แบบ plain text เช่น `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` และ
    `<function_calls>...</function_calls>` รวมถึง payloads ที่ถูกตัดทอน
    ซึ่งไม่เคยปิดครบถ้วน
  - ลบ scaffolding ของ tool-call/result ที่ถูก downgraded และ historical-context markers
  - ลบ model control tokens ที่รั่วไหล เช่น `<|assistant|>`, โทเค็น ASCII
    รูปแบบ `<|...|>` อื่น ๆ และตัวแปร full-width แบบ `<｜...｜>`
  - ลบ XML ของ tool-call จาก MiniMax ที่มีรูปแบบผิด
- ข้อความที่คล้าย credential/token จะถูกปกปิด
- บล็อกยาวอาจถูกตัดทอน
- ประวัติที่ใหญ่มากอาจตัดแถวเก่าออก หรือแทนที่แถวที่ใหญ่เกินไปด้วย
  `[sessions_history omitted: message too large]`
- การตรวจสอบ transcript ดิบบนดิสก์เป็นทางเลือกสำรองเมื่อคุณต้องการ transcript แบบเต็มทุกไบต์ตามต้นฉบับ

## นโยบายของ Tool (tools ของ sub-agent)

โดยค่าเริ่มต้น sub-agents จะได้รับ **ทุก tool ยกเว้น session tools** และ system tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` ยังคงเป็นมุมมองการเรียกคืนแบบมีขอบเขตและผ่านการ sanitize ที่นี่เช่นกัน; มัน
ไม่ใช่การ dump transcript ดิบ

เมื่อ `maxSpawnDepth >= 2`, sub-agents แบบ orchestrator ระดับ depth-1 จะได้รับ `sessions_spawn`, `subagents`, `sessions_list` และ `sessions_history` เพิ่มเติม เพื่อให้จัดการลูกของตัวเองได้

override ผ่าน config:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny มีสิทธิ์เหนือกว่า
        deny: ["gateway", "cron"],
        // หากมีการตั้ง allow จะกลายเป็น allow-only (deny ยังมีสิทธิ์เหนือกว่า)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrency

Sub-agents ใช้ queue lane ภายในโปรเซสที่แยกเฉพาะ:

- ชื่อ lane: `subagent`
- Concurrency: `agents.defaults.subagents.maxConcurrent` (ค่าเริ่มต้น `8`)

## การหยุด

- การส่ง `/stop` ในแชตของ requester จะยกเลิก requester session และหยุดการรัน sub-agent ที่ active ทั้งหมดที่ถูก spawn จากมัน โดย cascade ไปยังลูกที่ซ้อนอยู่
- `/subagents kill <id>` จะหยุด sub-agent ที่ระบุ และ cascade ไปยังลูกของมัน

## ข้อจำกัด

- announce ของ sub-agent เป็นแบบ **best-effort** หาก gateway รีสตาร์ต งาน "announce back" ที่รอดำเนินการจะหายไป
- Sub-agents ยังคงใช้ทรัพยากรของโปรเซส gateway เดียวกันร่วมกัน; ให้ถือว่า `maxConcurrent` เป็นวาล์วนิรภัย
- `sessions_spawn` เป็นแบบ non-blocking เสมอ: มันจะส่งกลับ `{ status: "accepted", runId, childSessionKey }` ทันที
- context ของ sub-agent จะ inject เฉพาะ `AGENTS.md` + `TOOLS.md` (ไม่มี `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` หรือ `BOOTSTRAP.md`)
- ความลึกสูงสุดของการซ้อนคือ 5 (`maxSpawnDepth` ช่วง: 1–5) โดยแนะนำให้ใช้ depth 2 สำหรับกรณีใช้งานส่วนใหญ่
- `maxChildrenPerAgent` จำกัดจำนวนลูกที่ active ต่อเซสชัน (ค่าเริ่มต้น: 5, ช่วง: 1–20)
