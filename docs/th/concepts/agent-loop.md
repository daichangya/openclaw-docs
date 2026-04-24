---
read_when:
    - คุณต้องการคำอธิบายแบบละเอียดและตรงตัวของลูปเอเจนต์หรือเหตุการณ์ในวงจรชีวิต
    - คุณกำลังเปลี่ยนการเข้าคิวของเซสชัน การเขียนทรานสคริปต์ หรือพฤติกรรมของตัวล็อกการเขียนเซสชัน
summary: วงจรชีวิตลูปของเอเจนต์, สตรีม และความหมายของการรอ
title: ลูปของเอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:05:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# ลูปของเอเจนต์ (OpenClaw)

ลูปแบบ agentic คือการรันแบบ “ของจริง” ทั้งหมดของเอเจนต์: รับอินพุต → ประกอบบริบท → อนุมานด้วยโมเดล →
เรียกใช้เครื่องมือ → สตรีมคำตอบ → เก็บถาวรข้อมูล นี่คือเส้นทางหลักที่เชื่อถือได้ซึ่งเปลี่ยนข้อความ
ให้เป็นการกระทำและคำตอบสุดท้าย พร้อมรักษาความสอดคล้องของสถานะเซสชันไว้

ใน OpenClaw ลูปหนึ่งคือการรันเดี่ยวแบบ serialized ต่อหนึ่งเซสชัน ซึ่งจะปล่อยเหตุการณ์ lifecycle และ stream
ขณะที่โมเดลกำลังคิด เรียกใช้เครื่องมือ และสตรีมผลลัพธ์ เอกสารนี้อธิบายว่า loop ของจริงนี้
เชื่อมต่อกันแบบ end-to-end อย่างไร

## จุดเริ่มต้น

- Gateway RPC: `agent` และ `agent.wait`
- CLI: คำสั่ง `agent`

## วิธีการทำงาน (ระดับสูง)

1. RPC `agent` ตรวจสอบความถูกต้องของพารามิเตอร์, resolve เซสชัน (sessionKey/sessionId), เก็บ metadata ของเซสชัน และคืน `{ runId, acceptedAt }` ทันที
2. `agentCommand` รันเอเจนต์:
   - resolve ค่าเริ่มต้นของ model + thinking/verbose/trace
   - โหลด snapshot ของ Skills
   - เรียก `runEmbeddedPiAgent` (รันไทม์ pi-agent-core)
   - ปล่อย **lifecycle end/error** หาก embedded loop ไม่ได้ปล่อยออกมาเอง
3. `runEmbeddedPiAgent`:
   - serialize การรันผ่านคิวรายเซสชัน + คิวส่วนกลาง
   - resolve model + auth profile และ build pi session
   - subscribe เหตุการณ์ pi และสตรีม delta ของ assistant/tool
   - บังคับใช้ timeout -> abort การรันหากเกินเวลา
   - คืน payload และ usage metadata
4. `subscribeEmbeddedPiSession` เชื่อมเหตุการณ์จาก pi-agent-core ไปยังสตรีม `agent` ของ OpenClaw:
   - เหตุการณ์ของ tool => `stream: "tool"`
   - delta ของ assistant => `stream: "assistant"`
   - เหตุการณ์ lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` ใช้ `waitForAgentRun`:
   - รอ **lifecycle end/error** สำหรับ `runId`
   - คืน `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## การเข้าคิว + concurrency

- การรันจะถูก serialize ตาม session key (session lane) และอาจผ่าน global lane ด้วย
- สิ่งนี้ป้องกัน race ของ tool/session และรักษาความสอดคล้องของประวัติเซสชัน
- ช่องทางการส่งข้อความสามารถเลือกโหมดคิวได้ (collect/steer/followup) ซึ่งป้อนเข้าสู่ระบบ lane นี้
  ดู [Command Queue](/th/concepts/queue)
- การเขียนทรานสคริปต์ยังได้รับการป้องกันด้วย session write lock บนไฟล์เซสชันด้วย โดยตัวล็อกเป็นแบบ
  รับรู้โพรเซสและอิงไฟล์ จึงจับผู้เขียนที่ข้ามคิวในโพรเซสหรือมาจาก
  อีกโพรเซสหนึ่งได้
- Session write lock ไม่รองรับการเข้าซ้ำโดยค่าปริยาย หาก helper ตั้งใจซ้อนการได้มาของ
  lock เดิมโดยยังคงผู้เขียนเชิงตรรกะเพียงรายเดียวไว้ มันต้อง opt in อย่างชัดเจนด้วย
  `allowReentrant: true`

## การเตรียมเซสชัน + workspace

- Workspace จะถูก resolve และสร้างขึ้น; การรันแบบ sandbox อาจเปลี่ยนเส้นทางไปยัง sandbox workspace root
- Skills จะถูกโหลด (หรือใช้ซ้ำจาก snapshot) และ injected เข้าไปใน env และ prompt
- ไฟล์ bootstrap/context จะถูก resolve และ injected เข้าไปในรายงาน system prompt
- จะมีการ acquire session write lock; จากนั้น `SessionManager` จะถูกเปิดและเตรียมพร้อมก่อนสตรีม
  เส้นทาง rewrite, Compaction หรือ truncation ของทรานสคริปต์ในภายหลัง
  จะต้องใช้ lock เดียวกันก่อนเปิดหรือแก้ไขไฟล์ทรานสคริปต์

## การประกอบพรอมป์ + system prompt

- system prompt จะถูกสร้างจาก base prompt ของ OpenClaw, prompt ของ Skills, bootstrap context และ override ต่อการรัน
- ระบบจะบังคับใช้ข้อจำกัดเฉพาะของโมเดลและ reserve token สำหรับ Compaction
- ดู [System prompt](/th/concepts/system-prompt) สำหรับสิ่งที่โมเดลมองเห็น

## จุด Hook (ตำแหน่งที่คุณสามารถสอดแทรกได้)

OpenClaw มีระบบ Hook สองแบบ:

- **Internal hook** (Gateway hook): สคริปต์แบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์ lifecycle
- **Plugin hook**: จุดขยายภายใน lifecycle ของเอเจนต์/เครื่องมือ และ pipeline ของ gateway

### Internal hook (Gateway hook)

- **`agent:bootstrap`**: รันระหว่างสร้างไฟล์ bootstrap ก่อนที่ system prompt จะถูก finalize
  ใช้สิ่งนี้เพื่อเพิ่ม/ลบไฟล์ bootstrap context
- **Command hook**: `/new`, `/reset`, `/stop` และเหตุการณ์คำสั่งอื่น ๆ (ดูเอกสาร Hooks)

ดู [Hooks](/th/automation/hooks) สำหรับการตั้งค่าและตัวอย่าง

### Plugin hook (lifecycle ของเอเจนต์ + gateway)

Hook เหล่านี้รันภายในลูปของเอเจนต์หรือ pipeline ของ gateway:

- **`before_model_resolve`**: รันก่อนเซสชัน (ไม่มี `messages`) เพื่อ override provider/model แบบกำหนดแน่นอนก่อนการ resolve โมเดล
- **`before_prompt_build`**: รันหลังโหลดเซสชัน (พร้อม `messages`) เพื่อ inject `prependContext`, `systemPrompt`, `prependSystemContext` หรือ `appendSystemContext` ก่อนส่งพรอมป์ ใช้ `prependContext` สำหรับข้อความแบบ dynamic ต่อเทิร์น และใช้ฟิลด์ system-context สำหรับคำแนะนำที่เสถียรซึ่งควรอยู่ในพื้นที่ของ system prompt
- **`before_agent_start`**: Hook แบบเก่าเพื่อความเข้ากันได้ ซึ่งอาจรันในเฟสใดก็ได้; ควรใช้ hook แบบ explicit ด้านบนแทน
- **`before_agent_reply`**: รันหลัง inline action และก่อนเรียก LLM ทำให้ Plugin สามารถ claim เทิร์นนั้นและส่งคำตอบสังเคราะห์หรือปิดเทิร์นไปเลยโดยไม่ตอบ
- **`agent_end`**: ตรวจสอบรายการข้อความสุดท้ายและ metadata ของการรันหลังเสร็จสิ้น
- **`before_compaction` / `after_compaction`**: สังเกตหรือใส่หมายเหตุให้รอบ Compaction
- **`before_tool_call` / `after_tool_call`**: สอดแทรกพารามิเตอร์/ผลลัพธ์ของเครื่องมือ
- **`before_install`**: ตรวจสอบผลการสแกนที่มีมาในตัว และเลือกบล็อกการติดตั้ง skill หรือ Plugin ได้
- **`tool_result_persist`**: แปลงผลลัพธ์ของเครื่องมือแบบ synchronous ก่อนจะถูกเขียนลงในทรานสคริปต์เซสชันที่ OpenClaw เป็นเจ้าของ
- **`message_received` / `message_sending` / `message_sent`**: Hook ข้อความขาเข้า + ขาออก
- **`session_start` / `session_end`**: ขอบเขต lifecycle ของเซสชัน
- **`gateway_start` / `gateway_stop`**: เหตุการณ์ lifecycle ของ gateway

กฎการตัดสินใจของ hook สำหรับ guard ขาออก/เครื่องมือ:

- `before_tool_call`: `{ block: true }` เป็นแบบสิ้นสุดและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_tool_call`: `{ block: false }` ไม่ทำอะไร และไม่ล้าง block ที่มีอยู่ก่อน
- `before_install`: `{ block: true }` เป็นแบบสิ้นสุดและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `before_install`: `{ block: false }` ไม่ทำอะไร และไม่ล้าง block ที่มีอยู่ก่อน
- `message_sending`: `{ cancel: true }` เป็นแบบสิ้นสุดและหยุด handler ที่มีลำดับความสำคัญต่ำกว่า
- `message_sending`: `{ cancel: false }` ไม่ทำอะไร และไม่ล้าง cancel ที่มีอยู่ก่อน

ดู [Plugin hooks](/th/plugins/architecture-internals#provider-runtime-hooks) สำหรับ API ของ hook และรายละเอียดการลงทะเบียน

Harness อาจปรับ hook เหล่านี้ต่างกันไป Codex app-server harness ยังคงใช้
Plugin hook ของ OpenClaw เป็นสัญญาความเข้ากันได้สำหรับพื้นผิวแบบ mirrored ที่มีเอกสารรองรับ
ขณะที่ Codex native hook ยังคงเป็นกลไกระดับล่างอีกชุดหนึ่งของ Codex ที่แยกต่างหาก

## การสตรีม + คำตอบบางส่วน

- delta ของ assistant จะถูกสตรีมจาก pi-agent-core และปล่อยออกมาเป็นเหตุการณ์ `assistant`
- block streaming สามารถปล่อยคำตอบบางส่วนได้ทั้งที่ `text_end` หรือ `message_end`
- reasoning streaming อาจถูกปล่อยเป็นสตรีมแยก หรือเป็นคำตอบแบบบล็อก
- ดู [Streaming](/th/concepts/streaming) สำหรับการแบ่งชังก์และพฤติกรรมของ block reply

## การเรียกใช้เครื่องมือ + เครื่องมือส่งข้อความ

- เหตุการณ์เริ่มต้น/อัปเดต/สิ้นสุดของเครื่องมือจะถูกปล่อยในสตรีม `tool`
- ผลลัพธ์ของเครื่องมือจะถูก sanitize สำหรับขนาดและ payload ของภาพก่อนการบันทึก/ปล่อยเหตุการณ์
- การส่งของเครื่องมือส่งข้อความจะถูกติดตามเพื่อระงับข้อความยืนยันจาก assistant ที่ซ้ำซ้อน

## การจัดรูปคำตอบ + การระงับ

- payload สุดท้ายจะถูกประกอบจาก:
  - ข้อความของ assistant (และ reasoning แบบเลือกได้)
  - สรุป inline ของเครื่องมือ (เมื่อเปิด verbose + ได้รับอนุญาต)
  - ข้อความ error ของ assistant เมื่อโมเดลเกิดข้อผิดพลาด
- โทเค็นเงียบแบบตรงตัว `NO_REPLY` / `no_reply` จะถูกกรองออกจาก
  payload ขาออก
- รายการที่ซ้ำกับเครื่องมือส่งข้อความจะถูกลบออกจากรายการ payload สุดท้าย
- หากไม่มี payload ที่ render ได้เหลืออยู่ และเครื่องมือเกิดข้อผิดพลาด ระบบจะปล่อย
  คำตอบ fallback สำหรับข้อผิดพลาดของเครื่องมือ (เว้นแต่เครื่องมือส่งข้อความจะได้ส่งคำตอบที่ผู้ใช้มองเห็นได้ไปแล้ว)

## Compaction + retry

- Auto-compaction จะปล่อยเหตุการณ์สตรีม `compaction` และอาจทริกเกอร์การ retry
- เมื่อ retry บัฟเฟอร์ในหน่วยความจำและสรุปของเครื่องมือจะถูกรีเซ็ตเพื่อหลีกเลี่ยงผลลัพธ์ซ้ำ
- ดู [Compaction](/th/concepts/compaction) สำหรับ pipeline ของ Compaction

## สตรีมเหตุการณ์ (ปัจจุบัน)

- `lifecycle`: ปล่อยโดย `subscribeEmbeddedPiSession` (และเป็น fallback โดย `agentCommand`)
- `assistant`: delta ที่สตรีมจาก pi-agent-core
- `tool`: เหตุการณ์ของเครื่องมือที่สตรีมจาก pi-agent-core

## การจัดการช่องทางแชต

- delta ของ assistant จะถูกบัฟเฟอร์เป็นข้อความแชตแบบ `delta`
- แชตแบบ `final` จะถูกปล่อยเมื่อ **lifecycle end/error**

## Timeout

- ค่าปริยายของ `agent.wait`: 30 วินาที (เฉพาะการรอ) พารามิเตอร์ `timeoutMs` ใช้ override ได้
- รันไทม์ของเอเจนต์: ค่าปริยายของ `agents.defaults.timeoutSeconds` คือ 172800 วินาที (48 ชั่วโมง); ถูกบังคับใช้ในตัวจับเวลา abort ของ `runEmbeddedPiAgent`
- LLM idle timeout: `agents.defaults.llm.idleTimeoutSeconds` จะ abort คำขอโมเดลเมื่อไม่มี response chunk เข้ามาก่อนหมดช่วง idle ตั้งค่านี้อย่างชัดเจนสำหรับโมเดลในเครื่องที่ช้า หรือ provider ที่ใช้ reasoning/tool-call; ตั้งเป็น 0 เพื่อปิดใช้งาน หากไม่ได้ตั้งค่า OpenClaw จะใช้ `agents.defaults.timeoutSeconds` เมื่อมีการกำหนดค่าไว้ มิฉะนั้นจะใช้ 120 วินาที การรันที่ทริกเกอร์ด้วย cron ซึ่งไม่มีการกำหนด timeout ของ LLM หรือเอเจนต์อย่างชัดเจน จะปิด idle watchdog และพึ่ง timeout ชั้นนอกของ cron

## จุดที่สิ้นสุดก่อนเวลาได้

- timeout ของเอเจนต์ (abort)
- AbortSignal (cancel)
- การตัดการเชื่อมต่อของ Gateway หรือ RPC timeout
- timeout ของ `agent.wait` (มีผลเฉพาะการรอ ไม่ได้หยุดเอเจนต์)

## ที่เกี่ยวข้อง

- [Tools](/th/tools) — เครื่องมือของเอเจนต์ที่ใช้งานได้
- [Hooks](/th/automation/hooks) — สคริปต์แบบขับเคลื่อนด้วยเหตุการณ์ที่ถูกทริกเกอร์โดยเหตุการณ์ lifecycle ของเอเจนต์
- [Compaction](/th/concepts/compaction) — วิธีสรุปการสนทนาที่ยาว
- [Exec Approvals](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่ง shell
- [Thinking](/th/tools/thinking) — การกำหนดค่าระดับการคิด/reasoning
