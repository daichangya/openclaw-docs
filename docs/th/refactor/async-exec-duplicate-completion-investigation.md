---
x-i18n:
    generated_at: "2026-04-23T05:53:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95e56c5411204363676f002059c942201503e2359515d1a4b409882cc2e04920
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# การสืบสวนปัญหาการเสร็จสิ้นแบบ Async Exec ซ้ำกัน

## ขอบเขต

- เซสชัน: `agent:main:telegram:group:-1003774691294:topic:1`
- อาการ: มีการบันทึกการเสร็จสิ้นของ async exec เดียวกันสำหรับเซสชัน/การรัน `keen-nexus` ซ้ำสองครั้งใน LCM ในฐานะ user turn
- เป้าหมาย: ระบุว่าสิ่งนี้มีแนวโน้มสูงสุดว่าเป็นการ inject เข้าเซสชันซ้ำ หรือเป็นเพียงการลองส่งขาออกใหม่ตามปกติ

## บทสรุป

มีแนวโน้มสูงสุดว่านี่คือ **การ inject เข้าเซสชันซ้ำกัน** ไม่ใช่เพียงการลองส่งขาออกใหม่ล้วน ๆ

ช่องโหว่ฝั่ง Gateway ที่ชัดที่สุดอยู่ใน **เส้นทาง completion ของ node exec**:

1. การสิ้นสุด exec ฝั่ง node จะปล่อย `exec.finished` พร้อม `runId` เต็ม
2. `server-node-events` ของ Gateway จะแปลงสิ่งนั้นเป็น system event และร้องขอ Heartbeat
3. การรัน Heartbeat จะ inject บล็อก system event ที่ถูก drain แล้วเข้าไปใน prompt ของเอเจนต์
4. embedded runner จะบันทึก prompt นั้นเป็น user turn ใหม่ใน transcript ของเซสชัน

หาก `exec.finished` เดียวกันไปถึง Gateway ซ้ำสองครั้งสำหรับ `runId` เดียวกันไม่ว่าด้วยเหตุผลใดก็ตาม (replay, reconnect ซ้ำ, upstream ส่งซ้ำ, producer ซ้ำ) ปัจจุบัน OpenClaw **ไม่มีการตรวจสอบ idempotency ที่อิง `runId`/`contextKey`** บนเส้นทางนี้ สำเนาที่สองจะกลายเป็นข้อความผู้ใช้อีกข้อความหนึ่งที่มีเนื้อหาเหมือนกัน

## เส้นทางโค้ดแบบตรงตัว

### 1. ผู้ผลิต: event การเสร็จสิ้นของ node exec

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` ปล่อย `node.event` ด้วย event `exec.finished`
  - payload มี `sessionKey` และ `runId` เต็ม

### 2. การรับ event ของ Gateway

- `src/gateway/server-node-events.ts:574-640`
  - จัดการ `exec.finished`
  - สร้างข้อความ:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - เข้าคิวผ่าน:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - และร้องขอ wake ทันที:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. จุดอ่อนของการ dedupe system event

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` จะระงับเฉพาะ **ข้อความซ้ำที่ติดกันเท่านั้น**:
    - `if (entry.lastText === cleaned) return false`
  - มันเก็บ `contextKey` ไว้ แต่ **ไม่**ใช้ `contextKey` สำหรับ idempotency
  - หลังจาก drain แล้ว การระงับข้อความซ้ำจะถูกรีเซ็ต

นั่นหมายความว่า `exec.finished` ที่ถูก replay พร้อม `runId` เดิม สามารถถูกยอมรับอีกครั้งในภายหลังได้ แม้ว่าโค้ดจะมีตัวเลือก idempotency ที่เสถียรอยู่แล้ว (`exec:<runId>`)

### 4. การจัดการ wake ไม่ใช่ตัวทำซ้ำหลัก

- `src/infra/heartbeat-wake.ts:79-117`
  - wake จะถูก coalesce ตาม `(agentId, sessionKey)`
  - คำขอ wake ซ้ำสำหรับเป้าหมายเดียวกันจะยุบเหลือรายการ pending wake เดียว

สิ่งนี้ทำให้ **การจัดการ wake ซ้ำเพียงอย่างเดียว** เป็นคำอธิบายที่อ่อนกว่าการรับ event ซ้ำ

### 5. Heartbeat ใช้ event นั้นและเปลี่ยนมันเป็นอินพุตของ prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - preflight จะ peek system event ที่ยัง pending และจัดประเภทการรัน exec-event
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` จะ drain คิวสำหรับเซสชันนั้น
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - บล็อก system event ที่ถูก drain แล้วจะถูก prepend เข้าไปใน prompt body ของเอเจนต์

### 6. จุดที่ inject ลง transcript

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` ส่ง prompt ทั้งหมดเข้าไปยัง embedded PI session
  - นี่คือจุดที่ prompt ที่มาจาก completion กลายเป็น user turn ที่ถูกบันทึกถาวร

ดังนั้นเมื่อ system event เดียวกันถูกสร้างกลับเข้า prompt สองครั้ง การเกิดข้อความผู้ใช้ซ้ำใน LCM จึงเป็นสิ่งที่คาดได้

## ทำไมการลองส่งขาออกใหม่ล้วน ๆ จึงมีโอกาสน้อยกว่า

มีเส้นทางความล้มเหลวของขาออกจริงใน heartbeat runner:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - มีการสร้างคำตอบก่อน
  - การส่งขาออกเกิดขึ้นภายหลังผ่าน `deliverOutboundPayloads(...)`
  - ความล้มเหลวตรงนั้นจะคืน `{ status: "failed" }`

อย่างไรก็ตาม สำหรับรายการ system event ในคิวเดียวกัน นี่เพียงอย่างเดียว **ยังไม่เพียงพอ** ที่จะอธิบาย user turn ที่ซ้ำกัน:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - คิว system event ถูก drain ไปแล้วก่อนการส่งขาออก

ดังนั้นการลองส่งข้อความของช่องทางใหม่เพียงอย่างเดียวจะไม่สร้าง queued event เดิมขึ้นมาอีก มันอาจอธิบายการส่งภายนอกที่หายไป/ล้มเหลวได้ แต่ไม่เพียงพอในตัวเองที่จะอธิบายการเกิดข้อความผู้ใช้ในเซสชันแบบเหมือนเดิมอีกครั้ง

## ความเป็นไปได้รองที่มีความเชื่อมั่นต่ำกว่า

มีลูป retry แบบ full-run อยู่ใน agent runner:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - ความล้มเหลวชั่วคราวบางประเภทสามารถ retry ทั้งการรันและส่ง `commandBody` เดิมอีกครั้ง

สิ่งนี้สามารถทำให้ prompt ของผู้ใช้ที่ถูกบันทึกไว้แล้วซ้ำขึ้นมา **ภายในการรันตอบกลับครั้งเดียวกัน** ได้ หาก prompt ถูก append ไปแล้วก่อนที่เงื่อนไข retry จะถูกทริกเกอร์

ฉันจัดอันดับสิ่งนี้ต่ำกว่าการรับ `exec.finished` ซ้ำ เพราะ:

- ช่องว่างที่สังเกตได้อยู่ราว 51 วินาที ซึ่งดูเหมือนการเกิด wake/turn ครั้งที่สองมากกว่าการ retry ภายในโปรเซส
- รายงานได้กล่าวถึงการส่งข้อความล้มเหลวซ้ำ ๆ อยู่แล้ว ซึ่งชี้ไปยัง turn แยกต่างหากในภายหลัง มากกว่าการ retry ทันทีของ model/runtime

## สมมติฐานสาเหตุราก

สมมติฐานที่มีความเชื่อมั่นสูงสุด:

- completion ของ `keen-nexus` เข้ามาทาง **เส้นทาง event ของ node exec**
- `exec.finished` เดียวกันถูกส่งไปยัง `server-node-events` สองครั้ง
- Gateway ยอมรับทั้งสองครั้ง เพราะ `enqueueSystemEvent(...)` ไม่ dedupe ตาม `contextKey` / `runId`
- event ที่ถูกยอมรับแต่ละรายการทริกเกอร์ Heartbeat และถูก inject เป็น user turn เข้า transcript ของ PI

## ข้อเสนอการแก้ไขแบบเล็กและเฉพาะจุด

หากต้องการแก้ จุดเปลี่ยนที่เล็กแต่คุ้มค่าสูงที่สุดคือ:

- ทำให้ idempotency ของ exec/system-event เคารพ `contextKey` ในช่วงเวลาสั้น ๆ อย่างน้อยสำหรับการซ้ำแบบตรงตัวของ `(sessionKey, contextKey, text)`
- หรือเพิ่มการ dedupe เฉพาะใน `server-node-events` สำหรับ `exec.finished` โดยอิง `(sessionKey, runId, event kind)`

สิ่งนี้จะบล็อกการซ้ำของ `exec.finished` ที่ถูก replay ได้โดยตรง ก่อนที่มันจะกลายเป็น turn ของเซสชัน
