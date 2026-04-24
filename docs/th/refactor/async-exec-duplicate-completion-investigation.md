---
read_when:
    - การดีบักเหตุการณ์ completion ของ node exec ที่เกิดซ้ำๆ
    - กำลังทำงานกับการ dedupe ของ Heartbeat/เหตุการณ์ระบบ
summary: บันทึกการตรวจสอบสำหรับการแทรก completion ของ async exec ที่ซ้ำกัน
title: การตรวจสอบ completion ที่ซ้ำกันของ async exec
x-i18n:
    generated_at: "2026-04-24T09:30:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## ขอบเขต

- เซสชัน: `agent:main:telegram:group:-1003774691294:topic:1`
- อาการ: async exec completion เดียวกันสำหรับ session/run `keen-nexus` ถูกบันทึกลงใน LCM ซ้ำสองครั้งในรูปแบบ user turns
- เป้าหมาย: ระบุว่าสิ่งนี้น่าจะเป็นการ inject เซสชันซ้ำ หรือเป็นเพียงการ retry การส่งขาออกตามปกติ

## ข้อสรุป

มีแนวโน้มสูงว่านี่คือ **การ inject เซสชันซ้ำ** ไม่ใช่เพียงการ retry การส่งขาออกล้วนๆ

ช่องโหว่ฝั่ง gateway ที่ชัดที่สุดอยู่ใน **เส้นทาง completion ของ node exec**:

1. การจบ exec ฝั่ง node จะปล่อย `exec.finished` พร้อม `runId` แบบเต็ม
2. Gateway `server-node-events` แปลงสิ่งนี้เป็นเหตุการณ์ระบบและร้องขอ Heartbeat
3. การรัน Heartbeat จะ inject บล็อกเหตุการณ์ระบบที่ถูก drain แล้วเข้าไปใน prompt ของเอเจนต์
4. embedded runner จะ persist prompt นั้นเป็น user turn ใหม่ใน transcript ของเซสชัน

หาก `exec.finished` เดียวกันมาถึง gateway ซ้ำสองครั้งสำหรับ `runId` เดียวกันไม่ว่าด้วยเหตุผลใดก็ตาม (replay, reconnect ซ้ำ, upstream resend, producer ซ้ำ) ปัจจุบัน OpenClaw **ไม่มีการตรวจสอบ idempotency ที่ผูกกับ `runId`/`contextKey`** บนเส้นทางนี้ สำเนาที่สองจะกลายเป็นข้อความผู้ใช้ลำดับที่สองที่มีเนื้อหาเหมือนกัน

## เส้นทางโค้ดที่แน่นอน

### 1. ผู้ผลิต: เหตุการณ์ completion ของ node exec

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` ปล่อย `node.event` พร้อมเหตุการณ์ `exec.finished`
  - payload มี `sessionKey` และ `runId` แบบเต็ม

### 2. การรับเหตุการณ์ใน Gateway

- `src/gateway/server-node-events.ts:574-640`
  - จัดการ `exec.finished`
  - สร้างข้อความ:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - ใส่เข้าคิวผ่าน:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - จากนั้นร้องขอ wake ทันที:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. จุดอ่อนของการ dedupe เหตุการณ์ระบบ

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` ระงับเฉพาะ **ข้อความซ้ำที่ติดกัน**
    - `if (entry.lastText === cleaned) return false`
  - มันเก็บ `contextKey` ไว้ แต่ **ไม่ได้** ใช้ `contextKey` สำหรับ idempotency
  - หลังจาก drain แล้ว การระงับรายการซ้ำจะถูกรีเซ็ต

ซึ่งหมายความว่า `exec.finished` ที่ถูก replay ด้วย `runId` เดิมสามารถถูกยอมรับอีกครั้งได้ในภายหลัง แม้ว่าโค้ดจะมีตัวเลือกที่เสถียรสำหรับ idempotency อยู่แล้ว (`exec:<runId>`)

### 4. การจัดการ wake ไม่ใช่ตัวทำให้เกิดรายการซ้ำหลัก

- `src/infra/heartbeat-wake.ts:79-117`
  - wake จะถูกรวมเข้าด้วยกันตาม `(agentId, sessionKey)`
  - คำขอ wake ซ้ำสำหรับเป้าหมายเดียวกันจะถูกรวมเป็นรายการ wake ที่รอดำเนินการรายการเดียว

สิ่งนี้ทำให้ **การจัดการ wake ซ้ำเพียงอย่างเดียว** เป็นคำอธิบายที่อ่อนกว่าการรับเหตุการณ์ซ้ำ

### 5. Heartbeat ใช้เหตุการณ์นั้นและแปลงเป็นอินพุตของ prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - preflight จะ peek เหตุการณ์ระบบที่รอดำเนินการและจัดประเภทการรันแบบ exec-event
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` จะ drain คิวของเซสชัน
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - บล็อกเหตุการณ์ระบบที่ถูก drain แล้วจะถูก prepend เข้าไปในเนื้อหา prompt ของเอเจนต์

### 6. จุดที่ inject เข้า transcript

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` ส่ง prompt แบบเต็มไปยังเซสชัน PI แบบฝัง
  - นี่คือจุดที่ prompt ซึ่งได้มาจาก completion กลายเป็น user turn ที่ถูก persist

ดังนั้นเมื่อเหตุการณ์ระบบเดียวกันถูกสร้างกลับเข้า prompt สองครั้ง ก็ย่อมคาดหมายได้ว่าจะเกิดข้อความผู้ใช้ใน LCM ซ้ำกัน

## เหตุใดการ retry การส่งขาออกตามปกติจึงมีแนวโน้มน้อยกว่า

มีเส้นทางความล้มเหลวของขาออกจริงใน heartbeat runner:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - มีการสร้าง reply ก่อน
  - การส่งขาออกเกิดภายหลังผ่าน `deliverOutboundPayloads(...)`
  - หากล้มเหลวจะคืนค่า `{ status: "failed" }`

อย่างไรก็ตาม สำหรับรายการในคิวเหตุการณ์ระบบเดียวกัน เส้นทางนี้เพียงอย่างเดียว **ยังไม่เพียงพอ** ที่จะอธิบาย user turns ที่ซ้ำกัน:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - คิวเหตุการณ์ระบบถูก drain ไปแล้วก่อนการส่งขาออก

ดังนั้นการ retry การส่งของช่องทางเพียงอย่างเดียวจะไม่สร้างเหตุการณ์ในคิวเดิมขึ้นมาใหม่ มันอาจอธิบายการส่งภายนอกที่หายไป/ล้มเหลวได้ แต่เพียงลำพังไม่สามารถอธิบายข้อความผู้ใช้ในเซสชันที่เหมือนกันเป๊ะเป็นครั้งที่สองได้

## ความเป็นไปได้รองที่มีความเชื่อมั่นต่ำกว่า

มีลูป retry แบบเต็มรันใน agent runner:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - ความล้มเหลวชั่วคราวบางประเภทสามารถ retry การรันทั้งหมดและส่ง `commandBody` เดิมอีกครั้ง

สิ่งนี้อาจทำให้ prompt ผู้ใช้ที่ถูก persist แล้วซ้ำขึ้นมา **ภายในการทำงาน reply เดียวกัน** หาก prompt ถูก append ไปแล้วก่อนที่เงื่อนไข retry จะเกิดขึ้น

ฉันจัดอันดับความเป็นไปได้นี้ต่ำกว่าการรับ `exec.finished` ซ้ำ เพราะ:

- ช่องว่างที่สังเกตได้อยู่ราว 51 วินาที ซึ่งดูคล้าย wake/turn ครั้งที่สองมากกว่าการ retry ภายในโปรเซส
- รายงานยังระบุถึงความล้มเหลวของการส่งข้อความซ้ำๆ ซึ่งชี้ไปทาง turn แยกที่เกิดภายหลังมากกว่าการ retry ของโมเดล/runtime ทันที

## สมมติฐานสาเหตุราก

สมมติฐานที่มีความเชื่อมั่นสูงสุด:

- completion ของ `keen-nexus` เข้ามาผ่าน **เส้นทางเหตุการณ์ node exec**
- `exec.finished` เดียวกันถูกส่งมาถึง `server-node-events` สองครั้ง
- Gateway ยอมรับทั้งสองครั้ง เพราะ `enqueueSystemEvent(...)` ไม่ได้ dedupe ด้วย `contextKey` / `runId`
- เหตุการณ์แต่ละรายการที่ถูกยอมรับจะกระตุ้น Heartbeat และถูก inject เป็น user turn เข้า transcript ของ PI

## ข้อเสนอการแก้ไขแบบเล็กและเฉพาะจุด

หากต้องการแก้ไข การเปลี่ยนแปลงที่เล็กที่สุดแต่มีมูลค่าสูงคือ:

- ทำให้ idempotency ของ exec/เหตุการณ์ระบบเคารพ `contextKey` ภายในช่วงเวลาสั้นๆ อย่างน้อยสำหรับรายการซ้ำแบบตรงกันของ `(sessionKey, contextKey, text)`
- หรือเพิ่มการ dedupe เฉพาะใน `server-node-events` สำหรับ `exec.finished` โดยใช้คีย์ `(sessionKey, runId, event kind)`

วิธีนี้จะบล็อก `exec.finished` ที่ถูก replay ซ้ำโดยตรงก่อนที่มันจะกลายเป็น session turns

## ที่เกี่ยวข้อง

- [Exec tool](/th/tools/exec)
- [การจัดการเซสชัน](/th/concepts/session)
