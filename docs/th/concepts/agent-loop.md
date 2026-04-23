---
read_when:
    - คุณต้องการคำอธิบายแบบละเอียดที่ตรงตามจริงของลูปเอเจนต์หรือเหตุการณ์ในวงจรชีวิต
    - คุณกำลังเปลี่ยนการจัดคิวของ session, การเขียนทรานสคริปต์ หรือพฤติกรรมของ session write lock
summary: วงจรชีวิตของลูปเอเจนต์, สตรีม และเซแมนติกของการรอ
title: ลูปเอเจนต์
x-i18n:
    generated_at: "2026-04-23T05:29:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# ลูปเอเจนต์ (OpenClaw)

ลูปแบบ agentic คือการรันเอเจนต์แบบ “จริง” ครบวงจร: intake → การประกอบบริบท → model inference →
การเรียกใช้เครื่องมือ → การสตรีมคำตอบ → การเก็บข้อมูลถาวร นี่คือเส้นทางอ้างอิงหลักที่เปลี่ยนข้อความ
ให้กลายเป็นการกระทำและคำตอบสุดท้าย พร้อมทั้งรักษาความสอดคล้องของสถานะ session

ใน OpenClaw ลูปหนึ่งคือการรันหนึ่งครั้งต่อ session แบบ serialize ซึ่งปล่อย lifecycle และ stream events
ขณะที่โมเดลกำลังคิด เรียกใช้เครื่องมือ และสตรีมผลลัพธ์ เอกสารนี้อธิบายว่าลูปจริงนี้
เชื่อมต่อกันตั้งแต่ต้นจนจบอย่างไร

## จุดเริ่มต้น

- Gateway RPC: `agent` และ `agent.wait`
- CLI: คำสั่ง `agent`

## วิธีการทำงาน (ระดับสูง)

1. RPC `agent` ตรวจสอบ params, resolve session (`sessionKey`/`sessionId`), เก็บ metadata ของ session และคืน `{ runId, acceptedAt }` ทันที
2. `agentCommand` รันเอเจนต์:
   - resolve ค่าเริ่มต้นของ model + thinking/verbose/trace
   - โหลด snapshot ของ Skills
   - เรียก `runEmbeddedPiAgent` (รันไทม์ของ pi-agent-core)
   - ปล่อย **lifecycle end/error** หากลูปแบบ embedded ไม่ได้ปล่อยออกมาเอง
3. `runEmbeddedPiAgent`:
   - ทำให้การรันเป็นแบบ serialize ผ่านคิวต่อ session + คิวส่วนกลาง
   - resolve model + auth profile และสร้าง pi session
   - subscribe กับ pi events และสตรีม assistant/tool deltas
   - บังคับใช้ timeout -> abort การรันหากเกินเวลา
   - คืน payloads + metadata การใช้งาน
4. `subscribeEmbeddedPiSession` เชื่อม pi-agent-core events เข้ากับสตรีม `agent` ของ OpenClaw:
   - tool events => `stream: "tool"`
   - assistant deltas => `stream: "assistant"`
   - lifecycle events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` ใช้ `waitForAgentRun`:
   - รอ **lifecycle end/error** สำหรับ `runId`
   - คืน `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## การเข้าคิว + การทำงานพร้อมกัน

- การรันจะถูก serialize แยกตาม session key (session lane) และอาจผ่าน lane ส่วนกลางด้วย
- สิ่งนี้ป้องกัน race ของ tool/session และทำให้ประวัติ session สอดคล้องกัน
- ช่องทางส่งข้อความสามารถเลือก queue modes ได้ (collect/steer/followup) ซึ่งป้อนเข้าสู่ระบบ lane นี้
  ดู [Command Queue](/th/concepts/queue)
- การเขียนทรานสคริปต์ยังถูกป้องกันด้วย session write lock บนไฟล์ session ด้วย lock นี้
  รับรู้ระดับโปรเซสและอิงกับไฟล์ จึงสามารถตรวจจับผู้เขียนที่ข้ามคิวในโปรเซสหรือมาจาก
  โปรเซสอื่นได้
- session write locks จะไม่รองรับ reentrant โดยค่าเริ่มต้น หาก helper ตั้งใจซ้อนการได้มาซึ่ง
  lock เดียวกันโดยยังคงรักษาผู้เขียนเชิงตรรกะเพียงรายเดียวไว้ ต้องเปิดใช้งานอย่างชัดเจนด้วย
  `allowReentrant: true`

## การเตรียม session + workspace

- workspace จะถูก resolve และสร้างขึ้น; การรันแบบ sandboxed อาจ redirect ไปยังราก workspace ของ sandbox
- Skills จะถูกโหลด (หรือใช้ซ้ำจาก snapshot) และ inject เข้าไปใน env และ prompt
- ไฟล์ bootstrap/context จะถูก resolve และ inject เข้าไปในรายงาน system prompt
- จะมีการได้มาซึ่ง session write lock; `SessionManager` จะถูกเปิดและเตรียมก่อนการสตรีม เส้นทาง
  การเขียนทรานสคริปต์ใหม่ การ Compaction หรือการตัดทอนใดๆ ในภายหลัง จะต้องใช้ lock เดียวกันก่อนเปิดหรือ
  เปลี่ยนแปลงไฟล์ทรานสคริปต์

## การประกอบพรอมป์ต์ + system prompt

- system prompt ถูกสร้างจาก base prompt ของ OpenClaw, พรอมป์ต์ของ Skills, bootstrap context และ overrides รายการรัน
- มีการบังคับใช้ข้อจำกัดเฉพาะของโมเดลและ reserve tokens สำหรับ Compaction
- ดู [System prompt](/th/concepts/system-prompt) เพื่อดูว่าโมเดลเห็นอะไร

## จุดของ Hooks (จุดที่คุณแทรกได้)

OpenClaw มีระบบ Hooks สองแบบ:

- **hooks ภายใน** (Gateway hooks): สคริปต์แบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและ lifecycle events
- **Plugin hooks**: จุดขยายภายในวงจรชีวิตของเอเจนต์/เครื่องมือและ pipeline ของ Gateway

### hooks ภายใน (Gateway hooks)

- **`agent:bootstrap`**: รันระหว่างการสร้างไฟล์ bootstrap ก่อนที่ system prompt จะถูก finalize
  ใช้สิ่งนี้เพื่อเพิ่ม/ลบไฟล์ bootstrap context
- **Command hooks**: `/new`, `/reset`, `/stop` และเหตุการณ์คำสั่งอื่นๆ (ดูเอกสาร Hooks)

ดู [Hooks](/th/automation/hooks) สำหรับการตั้งค่าและตัวอย่าง

### Plugin hooks (วงจรชีวิตเอเจนต์ + Gateway)

สิ่งเหล่านี้รันภายในลูปเอเจนต์หรือ pipeline ของ Gateway:

- **`before_model_resolve`**: รันก่อน session (ไม่มี `messages`) เพื่อ override provider/model แบบกำหนดแน่นอนก่อนการ resolve model
- **`before_prompt_build`**: รันหลังโหลด session (พร้อม `messages`) เพื่อ inject `prependContext`, `systemPrompt`, `prependSystemContext` หรือ `appendSystemContext` ก่อนส่งพรอมป์ต์ ใช้ `prependContext` สำหรับข้อความไดนามิกรายเทิร์น และใช้ฟิลด์ system-context สำหรับคำแนะนำที่คงที่ซึ่งควรอยู่ในพื้นที่ของ system prompt
- **`before_agent_start`**: hook แบบ compatibility เดิมที่อาจรันในทั้งสองช่วง; ควรใช้ hooks แบบชัดเจนด้านบนแทน
- **`before_agent_reply`**: รันหลัง inline actions และก่อนการเรียก LLM ทำให้ Plugin สามารถยึดเทิร์นนั้นและคืนคำตอบสังเคราะห์หรือปิดเทิร์นนั้นทั้งหมดยังได้
- **`agent_end`**: ตรวจสอบรายการข้อความสุดท้ายและ metadata การรันหลังเสร็จสิ้น
- **`before_compaction` / `after_compaction`**: สังเกตหรือใส่คำอธิบายประกอบรอบของ Compaction
- **`before_tool_call` / `after_tool_call`**: ดักจับ params/results ของเครื่องมือ
- **`before_install`**: ตรวจสอบผลการสแกนที่มีมาในตัว และเลือกบล็อกการติดตั้ง skill หรือ Plugin ได้
- **`tool_result_persist`**: แปลงผลลัพธ์ของเครื่องมือแบบ synchronous ก่อนถูกเขียนลงในทรานสคริปต์ของ session
- **`message_received` / `message_sending` / `message_sent`**: hooks ของข้อความขาเข้า + ขาออก
- **`session_start` / `session_end`**: ขอบเขตวงจรชีวิตของ session
- **`gateway_start` / `gateway_stop`**: lifecycle events ของ Gateway

กฎการตัดสินใจของ hook สำหรับการป้องกันขาออก/เครื่องมือ:

- `before_tool_call`: `{ block: true }` เป็นสถานะสิ้นสุดและหยุด handlers ลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` ไม่มีผลและไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็นสถานะสิ้นสุดและหยุด handlers ลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` ไม่มีผลและไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นสถานะสิ้นสุดและหยุด handlers ลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` ไม่มีผลและไม่ล้าง cancel ก่อนหน้า

ดู [Plugin hooks](/th/plugins/architecture#provider-runtime-hooks) สำหรับ API ของ hook และรายละเอียดการลงทะเบียน

## การสตรีม + คำตอบบางส่วน

- assistant deltas ถูกสตรีมจาก pi-agent-core และปล่อยออกมาเป็น events แบบ `assistant`
- block streaming สามารถปล่อยคำตอบบางส่วนได้ทั้งตอน `text_end` หรือ `message_end`
- reasoning streaming สามารถปล่อยเป็นสตรีมแยก หรือเป็น block replies
- ดู [Streaming](/th/concepts/streaming) สำหรับพฤติกรรมของ chunking และ block reply

## การเรียกใช้เครื่องมือ + เครื่องมือส่งข้อความ

- tool start/update/end events จะถูกปล่อยบนสตรีม `tool`
- ผลลัพธ์ของเครื่องมือจะถูก sanitize ด้านขนาดและ payload รูปภาพก่อนบันทึกล็อก/ปล่อยออก
- การส่งของเครื่องมือส่งข้อความจะถูกติดตามไว้เพื่อกดการยืนยันซ้ำจาก assistant

## การจัดรูปคำตอบ + การกดทับ

- payloads สุดท้ายถูกรวบรวมจาก:
  - ข้อความ assistant (และ reasoning แบบไม่บังคับ)
  - สรุปเครื่องมือแบบ inline (เมื่อ verbose + ได้รับอนุญาต)
  - ข้อความข้อผิดพลาดของ assistant เมื่อโมเดลเกิดข้อผิดพลาด
- silent token แบบตรงตัว `NO_REPLY` / `no_reply` จะถูกกรองออกจาก
  payloads ขาออก
- รายการซ้ำของเครื่องมือส่งข้อความจะถูกลบออกจากรายการ payload สุดท้าย
- หากไม่เหลือ payload ที่เรนเดอร์ได้ และเครื่องมือเกิดข้อผิดพลาด จะมีการปล่อย
  คำตอบ fallback สำหรับข้อผิดพลาดของเครื่องมือ (เว้นแต่เครื่องมือส่งข้อความได้ส่งคำตอบที่ผู้ใช้มองเห็นได้ไปแล้ว)

## Compaction + การลองใหม่

- auto-Compaction จะปล่อย stream events แบบ `compaction` และอาจกระตุ้นให้เกิดการลองใหม่
- เมื่อมีการลองใหม่ บัฟเฟอร์ในหน่วยความจำและสรุปเครื่องมือจะถูกรีเซ็ตเพื่อหลีกเลี่ยงผลลัพธ์ซ้ำ
- ดู [Compaction](/th/concepts/compaction) สำหรับ pipeline ของ Compaction

## สตรีมเหตุการณ์ (ปัจจุบัน)

- `lifecycle`: ปล่อยโดย `subscribeEmbeddedPiSession` (และเป็น fallback โดย `agentCommand`)
- `assistant`: deltas ที่สตรีมจาก pi-agent-core
- `tool`: tool events ที่สตรีมจาก pi-agent-core

## การจัดการช่องทางแชต

- assistant deltas จะถูกบัฟเฟอร์เป็นข้อความแชต `delta`
- แชต `final` จะถูกปล่อยเมื่อเกิด **lifecycle end/error**

## Timeouts

- ค่าเริ่มต้นของ `agent.wait`: 30 วินาที (เฉพาะการรอ) param `timeoutMs` ใช้ override ได้
- รันไทม์เอเจนต์: ค่าเริ่มต้น `agents.defaults.timeoutSeconds` คือ 172800 วินาที (48 ชั่วโมง); บังคับใช้ใน `runEmbeddedPiAgent` ผ่าน abort timer
- LLM idle timeout: `agents.defaults.llm.idleTimeoutSeconds` จะ abort คำขอของโมเดลเมื่อไม่มี response chunks เข้ามาก่อนหมดช่วง idle window ตั้งค่านี้อย่างชัดเจนสำหรับโมเดลในเครื่องที่ช้า หรือ provider ที่ใช้ reasoning/tool-call; ตั้งเป็น 0 เพื่อปิดใช้งาน หากไม่ได้ตั้งไว้ OpenClaw จะใช้ `agents.defaults.timeoutSeconds` เมื่อมีการตั้งค่าไว้ มิฉะนั้นจะใช้ 120 วินาที การรันที่ถูกกระตุ้นด้วย Cron ซึ่งไม่มี LLM หรือ agent timeout แบบชัดเจน จะปิด idle watchdog และพึ่งพา timeout ชั้นนอกของ cron แทน

## จุดที่สิ้นสุดก่อนเวลาได้

- timeout ของเอเจนต์ (abort)
- AbortSignal (ยกเลิก)
- Gateway disconnect หรือ RPC timeout
- timeout ของ `agent.wait` (เฉพาะการรอ ไม่ได้หยุดเอเจนต์)

## ที่เกี่ยวข้อง

- [Tools](/th/tools) — เครื่องมือของเอเจนต์ที่มีให้ใช้
- [Hooks](/th/automation/hooks) — สคริปต์แบบขับเคลื่อนด้วยเหตุการณ์ที่ถูกกระตุ้นโดย lifecycle events ของเอเจนต์
- [Compaction](/th/concepts/compaction) — วิธีสรุปการสนทนายาวๆ
- [Exec Approvals](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่ง shell
- [Thinking](/th/tools/thinking) — การตั้งค่าระดับการคิด/reasoning
