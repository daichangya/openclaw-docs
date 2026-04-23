---
read_when:
    - คุณต้องการทำความเข้าใจว่าเอเจนต์มีเครื่องมือเซสชันอะไรบ้าง
    - คุณต้องการกำหนดค่าการเข้าถึงข้ามเซสชันหรือการสร้าง sub-agent
    - คุณต้องการตรวจสอบสถานะหรือควบคุม sub-agent ที่ถูกสร้างขึ้น【อ่านข้อความเต็มanalysis to=multi_tool_use.parallel  天天中彩票是不是  手机天天彩票 omitted code block?
summary: เครื่องมือของเอเจนต์สำหรับสถานะข้ามเซสชัน การเรียกคืนข้อมูล การส่งข้อความ และการ orchestration ของ sub-agent
title: เครื่องมือเซสชัน
x-i18n:
    generated_at: "2026-04-23T05:31:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: d99408f3052f4fa461bc26bf79456e7f852069ec101b9d593442cef6dd20a3ac
    source_path: concepts/session-tool.md
    workflow: 15
---

# เครื่องมือเซสชัน

OpenClaw มอบเครื่องมือให้เอเจนต์ใช้ทำงานข้ามเซสชัน ตรวจสอบสถานะ และ
orchestration ของ sub-agent

## เครื่องมือที่มีให้

| เครื่องมือ         | สิ่งที่ทำ                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| `sessions_list`    | แสดงรายการเซสชันพร้อมตัวกรองแบบไม่บังคับ (ชนิด, ป้ายชื่อ, เอเจนต์, ความล่าสุด, preview) |
| `sessions_history` | อ่าน transcript ของเซสชันที่ระบุ                                          |
| `sessions_send`    | ส่งข้อความไปยังอีกเซสชันหนึ่งและเลือกได้ว่าจะรอหรือไม่                     |
| `sessions_spawn`   | สร้างเซสชัน sub-agent แบบแยกสำหรับงานเบื้องหลัง                          |
| `sessions_yield`   | จบ turn ปัจจุบันและรอผลลัพธ์ติดตามจาก sub-agent                          |
| `subagents`        | แสดงรายการ ชี้ทาง หรือ kill sub-agent ที่ถูกสร้างจากเซสชันนี้             |
| `session_status`   | แสดงการ์ดแบบ `/status` และเลือกตั้งค่า model override แยกตามเซสชันได้     |

## การแสดงรายการและอ่านเซสชัน

`sessions_list` จะคืนค่าเซสชันพร้อม key, agentId, kind, channel, model,
จำนวนโทเคน และ timestamp สามารถกรองตาม kind (`main`, `group`, `cron`, `hook`,
`node`), `label` แบบตรงตัว, `agentId` แบบตรงตัว, ข้อความค้นหา หรือความล่าสุด
(`activeMinutes`) ได้ เมื่อคุณต้องการการคัดแยกแบบกล่องจดหมาย เครื่องมือนี้ยังสามารถขอ
title ที่อนุมานได้, preview ของข้อความล่าสุด หรือข้อความล่าสุดแบบมีขอบเขตได้ด้วย
การอ่าน transcript แบบ preview จะถูกจำกัดขอบเขตตามนโยบายการมองเห็นของเครื่องมือเซสชันที่ตั้งค่าไว้

`sessions_history` จะดึง transcript ของการสนทนาสำหรับเซสชันที่ระบุ
โดยค่าเริ่มต้น จะไม่รวมผลลัพธ์จาก tool -- ให้ส่ง `includeTools: true` หากต้องการดู
มุมมองที่ส่งกลับมาจะถูกจำกัดขอบเขตและกรองเพื่อความปลอดภัยโดยตั้งใจ:

- ข้อความของ assistant จะถูก normalize ก่อนเรียกคืน:
  - ตัดแท็ก thinking ออก
  - ตัดบล็อก scaffolding ของ `<relevant-memories>` / `<relevant_memories>` ออก
  - ตัดบล็อก payload XML ของ tool-call แบบข้อความล้วน เช่น `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` และ
    `<function_calls>...</function_calls>` ออก รวมถึง payload ที่ถูกตัดค้างจนไม่ปิดแท็กสมบูรณ์
  - ตัด scaffolding ของ tool-call/result ที่ถูกลดรูป เช่น `[Tool Call: ...]`,
    `[Tool Result ...]` และ `[Historical context ...]` ออก
  - ตัดโทเคนควบคุมโมเดลที่รั่วออกมา เช่น `<|assistant|>`, โทเคน ASCII รูปแบบ
    `<|...|>` อื่น ๆ และรูปแบบ full-width `<｜...｜>` ออก
  - ตัด XML ของ tool-call แบบผิดรูปของ MiniMax เช่น `<invoke ...>` /
    `</minimax:tool_call>` ออก
- ข้อความลักษณะคล้าย credential/token จะถูกปกปิดก่อนส่งกลับ
- บล็อกข้อความยาวจะถูกตัดทอน
- ประวัติที่ใหญ่มากอาจตัดแถวเก่าออก หรือแทนที่แถวที่ใหญ่เกินไปด้วย
  `[sessions_history omitted: message too large]`
- เครื่องมือจะรายงานแฟล็กสรุป เช่น `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` และ `bytes`

ทั้งสองเครื่องมือรับได้ทั้ง **session key** (เช่น `"main"`) หรือ **session ID**
จากการเรียกรายการก่อนหน้า

หากคุณต้องการ transcript แบบตรงตามไบต์ทุกประการ ให้ตรวจสอบไฟล์ transcript บน
ดิสก์แทน แทนที่จะใช้ `sessions_history` เป็น raw dump

## การส่งข้อความข้ามเซสชัน

`sessions_send` จะส่งข้อความไปยังอีกเซสชันหนึ่ง และเลือกได้ว่าจะรอ
การตอบกลับหรือไม่:

- **ส่งแล้วไม่รอ:** ตั้ง `timeoutSeconds: 0` เพื่อเข้าคิวและส่งกลับทันที
- **รอคำตอบ:** ตั้งค่า timeout แล้วรับคำตอบแบบ inline

หลังจากเป้าหมายตอบแล้ว OpenClaw สามารถรัน **ลูปตอบกลับไปมา** โดยให้
เอเจนต์ผลัดกันส่งข้อความได้ (สูงสุด 5 turn) เอเจนต์ปลายทางสามารถตอบ
`REPLY_SKIP` เพื่อหยุดก่อนกำหนดได้

## ตัวช่วยด้านสถานะและ orchestration

`session_status` เป็นเครื่องมือเทียบเท่า `/status` แบบเบาสำหรับเซสชันปัจจุบัน
หรือเซสชันอื่นที่มองเห็นได้ โดยจะรายงานการใช้งาน เวลา สถานะ model/runtime และบริบทของงานเบื้องหลังที่ลิงก์ไว้เมื่อมี เช่นเดียวกับ `/status` เครื่องมือนี้สามารถเติมค่า token/cache counter ที่มีข้อมูลน้อยจากรายการ usage ล่าสุดใน transcript ได้ และ
`model=default` จะล้าง override แยกตามเซสชัน

`sessions_yield` จะจบ turn ปัจจุบันโดยตั้งใจ เพื่อให้ข้อความถัดไปกลายเป็น
อีเวนต์ติดตามผลที่คุณกำลังรออยู่ ใช้หลังจากสร้าง sub-agent แล้วเมื่อ
คุณต้องการให้ผลลัพธ์เมื่อเสร็จสิ้นมาถึงเป็นข้อความถัดไป แทนการสร้างลูป polling

`subagents` เป็นตัวช่วย control-plane สำหรับ sub-agent ของ OpenClaw
ที่ถูกสร้างไปแล้ว โดยรองรับ:

- `action: "list"` เพื่อตรวจสอบการรันที่ active/ล่าสุด
- `action: "steer"` เพื่อส่งคำแนะนำติดตามผลให้ child ที่กำลังรันอยู่
- `action: "kill"` เพื่อหยุด child หนึ่งตัวหรือ `all`

## การสร้าง sub-agent

`sessions_spawn` จะสร้างเซสชันแบบแยกสำหรับงานเบื้องหลัง โดยจะเป็นแบบ
ไม่บล็อกเสมอ -- ส่งกลับทันทีพร้อม `runId` และ `childSessionKey`

ตัวเลือกสำคัญ:

- `runtime: "subagent"` (ค่าเริ่มต้น) หรือ `"acp"` สำหรับเอเจนต์ harness ภายนอก
- การ override `model` และ `thinking` สำหรับ child session
- `thread: true` เพื่อผูกการสร้างเข้ากับเธรดแชต (Discord, Slack ฯลฯ)
- `sandbox: "require"` เพื่อบังคับให้ child ใช้ sandbox

sub-agent ระดับ leaf ตามค่าเริ่มต้นจะไม่ได้รับเครื่องมือเซสชัน เมื่อ
`maxSpawnDepth >= 2` sub-agent แบบ orchestrator ที่ระดับความลึก 1 จะได้รับ
`sessions_spawn`, `subagents`, `sessions_list` และ `sessions_history` เพิ่มเติม เพื่อให้
สามารถจัดการ child ของตนเองได้ ส่วนการรันระดับ leaf ยังคงไม่ได้รับ
เครื่องมือ orchestration แบบเรียกซ้ำ

หลังเสร็จสิ้น ขั้นตอน announce จะโพสต์ผลลัพธ์ไปยังช่องทางของผู้ขอ
การส่งมอบเมื่อเสร็จสิ้นจะคงการกำหนดเส้นทาง thread/topic ที่ผูกไว้เมื่อมีข้อมูลพร้อม และหาก
origin ของการเสร็จสิ้นระบุเพียงช่องทาง OpenClaw ก็ยังสามารถนำเส้นทางที่เก็บไว้ของ requester session (`lastChannel` / `lastTo`) กลับมาใช้ซ้ำเพื่อส่งตรงได้

สำหรับพฤติกรรมเฉพาะ ACP ดู [ACP Agents](/th/tools/acp-agents)

## การมองเห็น

เครื่องมือเซสชันถูกกำหนดขอบเขตไว้เพื่อจำกัดสิ่งที่เอเจนต์มองเห็นได้:

| ระดับ   | ขอบเขต                                   |
| ------- | ---------------------------------------- |
| `self`  | เฉพาะเซสชันปัจจุบัน                     |
| `tree`  | เซสชันปัจจุบัน + sub-agent ที่สร้างออกไป |
| `agent` | ทุกเซสชันของเอเจนต์นี้                  |
| `all`   | ทุกเซสชัน (ข้ามเอเจนต์หากมีการตั้งค่า)   |

ค่าเริ่มต้นคือ `tree` เซสชันที่อยู่ใน sandbox จะถูกบังคับจำกัดไว้ที่ `tree`
ไม่ว่าคอนฟิกจะตั้งไว้อย่างไร

## อ่านเพิ่มเติม

- [Session Management](/th/concepts/session) -- การกำหนดเส้นทาง วงจรชีวิต และการบำรุงรักษา
- [ACP Agents](/th/tools/acp-agents) -- การสร้าง harness ภายนอก
- [Multi-agent](/th/concepts/multi-agent) -- สถาปัตยกรรมหลายเอเจนต์
- [Gateway Configuration](/th/gateway/configuration) -- ตัวเลือกคอนฟิกของเครื่องมือเซสชัน
