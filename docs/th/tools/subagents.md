---
read_when:
    - คุณต้องการงานเบื้องหลัง/งานขนานผ่านเอเจนต์
    - คุณกำลังเปลี่ยนนโยบายของ `sessions_spawn` หรือเครื่องมือซับเอเจนต์ീന to=assistant final code արզ translate only.
    - คุณกำลังพัฒนาหรือแก้ปัญหาเซสชันซับเอเจนต์ที่ผูกกับเธรด
summary: 'ซับเอเจนต์: การ spawn การรันเอเจนต์แบบแยกที่ประกาศผลกลับไปยังแชตของผู้ร้องขอ'
title: ซับเอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:38:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

ซับเอเจนต์คือการรันเอเจนต์แบบเบื้องหลังที่ถูก spawn มาจากการรันเอเจนต์ที่มีอยู่เดิม พวกมันจะรันในเซสชันของตัวเอง (`agent:<agentId>:subagent:<uuid>`) และเมื่อเสร็จแล้วจะ **ประกาศ** ผลลัพธ์กลับไปยังช่องแชตของผู้ร้องขอ การรันซับเอเจนต์แต่ละครั้งจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

## Slash command

ใช้ `/subagents` เพื่อตรวจสอบหรือควบคุมการรันซับเอเจนต์สำหรับ **เซสชันปัจจุบัน**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

ตัวควบคุมการผูกกับเธรด:

คำสั่งเหล่านี้ใช้ได้บนช่องทางที่รองรับการผูกกับเธรดแบบคงอยู่ ดู **ช่องทางที่รองรับเธรด** ด้านล่าง

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` จะแสดง metadata ของการรัน (สถานะ เวลา session id พาธของทรานสคริปต์ การ cleanup)
ใช้ `sessions_history` เพื่อดูข้อมูลย้อนหลังแบบมีขอบเขตและกรองเพื่อความปลอดภัย; หากต้องการทรานสคริปต์ดิบแบบเต็ม ให้ตรวจสอบพาธของทรานสคริปต์บนดิสก์

### พฤติกรรมของการ spawn

`/subagents spawn` จะเริ่มซับเอเจนต์แบบเบื้องหลังในฐานะคำสั่งของผู้ใช้ ไม่ใช่ internal relay และจะส่งการอัปเดตการเสร็จสิ้นกลับไปยังแชตของผู้ร้องขอเพียงครั้งเดียวเมื่อการรันจบ

- คำสั่ง spawn ไม่บล็อก; มันจะคืน run id กลับมาทันที
- เมื่อเสร็จสิ้น ซับเอเจนต์จะประกาศข้อความสรุป/ผลลัพธ์กลับไปยังช่องแชตของผู้ร้องขอ
- การส่งผลเมื่อเสร็จสิ้นเป็นแบบ push เมื่อ spawn แล้ว อย่าทำ poll `/subagents list`,
  `sessions_list` หรือ `sessions_history` แบบวนลูปเพียงเพื่อรอให้มัน
  เสร็จ; ควรตรวจสอบสถานะเฉพาะเมื่อต้องการดีบักหรือแทรกแซง
- เมื่อเสร็จสิ้น OpenClaw จะพยายามปิดแท็บ/โพรเซสของเบราว์เซอร์ที่ติดตามไว้ซึ่งเปิดโดยเซสชันซับเอเจนต์นั้น ก่อนที่ flow announce cleanup จะดำเนินต่อ
- สำหรับการ spawn แบบ manual การส่งผลมีความทนทาน:
  - OpenClaw จะลองส่งแบบ direct `agent` ก่อนด้วย idempotency key ที่คงที่
  - หากการส่งแบบ direct ล้มเหลว จะ fallback ไปใช้ queue routing
  - หาก queue routing ยังใช้งานไม่ได้ announce จะถูก retry ด้วย exponential backoff สั้น ๆ ก่อนจะยอมแพ้ในที่สุด
- การส่งผลเมื่อเสร็จสิ้นจะคงเส้นทางของผู้ร้องขอที่ resolve แล้ว:
  - เส้นทางการเสร็จสิ้นแบบ thread-bound หรือ conversation-bound จะมีความสำคัญก่อนเมื่อมี
  - หากต้นทางของการเสร็จสิ้นให้มาเพียง channel, OpenClaw จะเติม target/account ที่ขาดหายไปจากเส้นทางที่ resolve แล้วของเซสชันผู้ร้องขอ (`lastChannel` / `lastTo` / `lastAccountId`) เพื่อให้การส่งแบบ direct ยังใช้งานได้
- การส่งต่อผลลัพธ์ที่เสร็จสิ้นไปยังเซสชันของผู้ร้องขอเป็นบริบทภายในที่สร้างโดย runtime (ไม่ใช่ข้อความที่ผู้ใช้เขียน) และประกอบด้วย:
  - `Result` (ข้อความ `assistant` ที่มองเห็นได้ล่าสุด หรือหากไม่มี จะใช้ข้อความล่าสุดของ tool/toolResult ที่ sanitize แล้ว; การรันที่ล้มเหลวแบบ terminal จะไม่ใช้ข้อความตอบที่จับไว้ซ้ำ)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - สถิติ runtime/token แบบย่อ
  - คำสั่งการส่งที่บอกให้เอเจนต์ของผู้ร้องขอเขียนใหม่ด้วยน้ำเสียง assistant ปกติ (ไม่ใช่ส่งต่อ metadata ภายในแบบดิบ)
- `--model` และ `--thinking` ใช้ override ค่าเริ่มต้นสำหรับการรันนั้นโดยเฉพาะ
- ใช้ `info`/`log` เพื่อตรวจสอบรายละเอียดและเอาต์พุตหลังเสร็จสิ้น
- `/subagents spawn` คือโหมดแบบครั้งเดียว (`mode: "run"`) สำหรับเซสชันแบบคงอยู่ที่ผูกกับเธรด ให้ใช้ `sessions_spawn` พร้อม `thread: true` และ `mode: "session"`
- สำหรับ ACP harness session (Codex, Claude Code, Gemini CLI) ให้ใช้ `sessions_spawn` พร้อม `runtime: "acp"` และดู [ACP Agents](/th/tools/acp-agents) โดยเฉพาะ [ACP delivery model](/th/tools/acp-agents#delivery-model) เมื่อดีบักการส่งผลเมื่อเสร็จสิ้นหรือลูประหว่างเอเจนต์

เป้าหมายหลัก:

- ทำให้งานแบบ "ค้นคว้า / งานยาว / เครื่องมือช้า" ขนานกันได้โดยไม่บล็อกการรันหลัก
- ทำให้ซับเอเจนต์แยกจากกันเป็นค่าปริยาย (แยกเซสชัน + sandbox แบบไม่บังคับ)
- ทำให้พื้นผิวของเครื่องมือยากต่อการใช้งานผิด: ซับเอเจนต์จะ **ไม่ได้** รับ session tool เป็นค่าปริยาย
- รองรับระดับความลึกของการซ้อนที่กำหนดค่าได้ สำหรับรูปแบบ orchestrator

หมายเหตุเรื่องค่าใช้จ่าย: ซับเอเจนต์แต่ละตัวมี **บริบทและการใช้โทเค็นของตัวเอง** เป็นค่าปริยาย สำหรับงานที่หนักหรือทำซ้ำบ่อย ควรตั้งโมเดลที่ถูกกว่าสำหรับซับเอเจนต์ และให้เอเจนต์หลักของคุณใช้โมเดลคุณภาพสูงกว่า คุณสามารถกำหนดค่านี้ผ่าน `agents.defaults.subagents.model` หรือ override รายเอเจนต์ได้ เมื่อ child ต้องใช้ทรานสคริปต์ปัจจุบันของผู้ร้องขอจริง ๆ เอเจนต์สามารถร้องขอ `context: "fork"` สำหรับการ spawn ครั้งนั้นได้

## เครื่องมือ

ใช้ `sessions_spawn`:

- เริ่มการรันซับเอเจนต์ (`deliver: false`, global lane: `subagent`)
- จากนั้นรันขั้น announce และโพสต์ announce reply กลับไปยังช่องแชตของผู้ร้องขอ
- โมเดลค่าปริยาย: สืบทอดจากผู้เรียก เว้นแต่คุณจะตั้ง `agents.defaults.subagents.model` (หรือ `agents.list[].subagents.model` รายเอเจนต์); ค่า `sessions_spawn.model` แบบ explicit ยังคงมีความสำคัญสูงสุด
- thinking ค่าปริยาย: สืบทอดจากผู้เรียก เว้นแต่คุณจะตั้ง `agents.defaults.subagents.thinking` (หรือ `agents.list[].subagents.thinking` รายเอเจนต์); ค่า `sessions_spawn.thinking` แบบ explicit ยังคงมีความสำคัญสูงสุด
- timeout ค่าปริยายของการรัน: หากไม่ระบุ `sessions_spawn.runTimeoutSeconds`, OpenClaw จะใช้ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่าไว้ มิฉะนั้นจะ fallback ไปเป็น `0` (ไม่มี timeout)

พารามิเตอร์ของเครื่องมือ:

- `task` (จำเป็น)
- `label?` (ไม่บังคับ)
- `agentId?` (ไม่บังคับ; spawn ภายใต้ agent id อื่นหากอนุญาต)
- `model?` (ไม่บังคับ; override โมเดลของซับเอเจนต์; ค่าที่ไม่ถูกต้องจะถูกข้าม และซับเอเจนต์จะรันด้วยโมเดลค่าปริยายพร้อมคำเตือนในผลลัพธ์ของเครื่องมือ)
- `thinking?` (ไม่บังคับ; override ระดับการคิดสำหรับการรันของซับเอเจนต์)
- `runTimeoutSeconds?` (ค่าปริยายคือ `agents.defaults.subagents.runTimeoutSeconds` เมื่อมีการตั้งค่าไว้ มิฉะนั้น `0`; เมื่อมีการตั้งค่า ซับเอเจนต์จะถูก abort หลังจาก N วินาที)
- `thread?` (ค่าปริยาย `false`; เมื่อเป็น `true` จะร้องขอการผูกกับ thread ของช่องทางสำหรับเซสชันซับเอเจนต์นี้)
- `mode?` (`run|session`)
  - ค่าปริยายคือ `run`
  - หาก `thread: true` และไม่ได้ระบุ `mode`, ค่าปริยายจะกลายเป็น `session`
  - `mode: "session"` ต้องใช้ `thread: true`
- `cleanup?` (`delete|keep`, ค่าปริยาย `keep`)
- `sandbox?` (`inherit|require`, ค่าปริยาย `inherit`; `require` จะปฏิเสธการ spawn เว้นแต่รันไทม์ของ child เป้าหมายจะถูก sandbox)
- `context?` (`isolated|fork`, ค่าปริยาย `isolated`; ใช้ได้เฉพาะ native sub-agent)
  - `isolated` จะสร้างทรานสคริปต์ของ child ใหม่ทั้งหมดและเป็นค่าปริยาย
  - `fork` จะแตกทรานสคริปต์ปัจจุบันของผู้ร้องขอไปยังเซสชันของ child ทำให้ child เริ่มต้นด้วยบริบทการสนทนาเดียวกัน
  - ใช้ `fork` เฉพาะเมื่อ child ต้องใช้ทรานสคริปต์ปัจจุบัน สำหรับงานที่มีขอบเขตชัดเจน ให้ละ `context` ไว้
- `sessions_spawn` **ไม่** รับพารามิเตอร์สำหรับการส่งไปยังช่องทาง (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`) สำหรับการส่งผล ให้ใช้ `message`/`sessions_send` จากการรันที่ถูก spawn แล้ว

## เซสชันที่ผูกกับเธรด

เมื่อเปิดใช้การผูกกับเธรดสำหรับช่องทางหนึ่ง ซับเอเจนต์สามารถคงการผูกกับเธรดไว้ได้ เพื่อให้ข้อความติดตามผลของผู้ใช้ในเธรดนั้นยังคงถูก route ไปยังเซสชันซับเอเจนต์เดิม

### ช่องทางที่รองรับเธรด

- Discord (ปัจจุบันเป็นช่องทางเดียวที่รองรับ): รองรับเซสชันซับเอเจนต์แบบคงอยู่ที่ผูกกับเธรด (`sessions_spawn` พร้อม `thread: true`), การควบคุมเธรดด้วยตนเอง (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) และคีย์ของ adapter เช่น `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` และ `channels.discord.threadBindings.spawnSubagentSessions`

โฟลว์แบบเร็ว:

1. Spawn ด้วย `sessions_spawn` โดยใช้ `thread: true` (และอาจใช้ `mode: "session"` ด้วย)
2. OpenClaw จะสร้างหรือผูกเธรดเข้ากับเป้าหมายเซสชันนั้นในช่องทางที่กำลังใช้งาน
3. คำตอบและข้อความติดตามผลในเธรดนั้นจะถูก route ไปยังเซสชันที่ถูกผูกไว้
4. ใช้ `/session idle` เพื่อตรวจสอบ/อัปเดตการ un-focus อัตโนมัติเมื่อไม่มีการใช้งาน และใช้ `/session max-age` เพื่อควบคุมเพดานสูงสุด
5. ใช้ `/unfocus` เพื่อยกเลิกการผูกด้วยตนเอง

การควบคุมด้วยตนเอง:

- `/focus <target>` จะผูกเธรดปัจจุบัน (หรือสร้างขึ้นมาใหม่) เข้ากับเป้าหมายซับเอเจนต์/เซสชัน
- `/unfocus` จะลบการผูกสำหรับเธรดปัจจุบันที่ถูกผูกอยู่
- `/agents` จะแสดงรายการการรันที่ active และสถานะการผูก (`thread:<id>` หรือ `unbound`)
- `/session idle` และ `/session max-age` ใช้ได้เฉพาะกับเธรดที่ถูก focus และผูกไว้แล้วเท่านั้น

สวิตช์คอนฟิก:

- ค่าเริ่มต้นส่วนกลาง: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- คีย์ override รายช่องทางและคีย์สำหรับการ auto-bind ตอน spawn จะเป็นของ adapter นั้นโดยเฉพาะ ดู **ช่องทางที่รองรับเธรด** ด้านบน

ดู [Configuration Reference](/th/gateway/configuration-reference) และ [Slash commands](/th/tools/slash-commands) สำหรับรายละเอียดของ adapter ปัจจุบัน

Allowlist:

- `agents.list[].subagents.allowAgents`: รายการ agent id ที่สามารถกำหนดเป้าหมายผ่าน `agentId` ได้ (`["*"]` เพื่ออนุญาตทุกตัว) ค่าปริยาย: อนุญาตเฉพาะเอเจนต์ของผู้ร้องขอ
- `agents.defaults.subagents.allowAgents`: target-agent allowlist ค่าปริยายที่ใช้เมื่อเอเจนต์ของผู้ร้องขอไม่ได้ตั้ง `subagents.allowAgents` ของตัวเอง
- Sandbox inheritance guard: หากเซสชันของผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่อาจรันนอก sandbox
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ไม่ระบุ `agentId` (บังคับให้เลือกโปรไฟล์อย่าง explicit) ค่าปริยาย: false

การค้นพบ:

- ใช้ `agents_list` เพื่อดูว่า agent id ใดบ้างที่อนุญาตให้ `sessions_spawn` ได้ในขณะนี้

การเก็บถาวรอัตโนมัติ:

- เซสชันซับเอเจนต์จะถูกเก็บถาวรโดยอัตโนมัติหลัง `agents.defaults.subagents.archiveAfterMinutes` (ค่าปริยาย: 60)
- การเก็บถาวรใช้ `sessions.delete` และเปลี่ยนชื่อทรานสคริปต์เป็น `*.deleted.<timestamp>` (ในโฟลเดอร์เดียวกัน)
- `cleanup: "delete"` จะเก็บถาวรทันทีหลัง announce (แต่ยังคงเก็บทรานสคริปต์ไว้โดยการเปลี่ยนชื่อ)
- การเก็บถาวรอัตโนมัติเป็นแบบ best-effort; timer ที่ค้างอยู่จะหายไปหาก gateway รีสตาร์ต
- `runTimeoutSeconds` จะ **ไม่** เก็บถาวรอัตโนมัติ; มันเพียงหยุดการรันเท่านั้น เซสชันจะยังอยู่จนกว่าจะถูกเก็บถาวรอัตโนมัติ
- การเก็บถาวรอัตโนมัติใช้เหมือนกันทั้งกับเซสชันระดับ depth-1 และ depth-2
- การ cleanup ของเบราว์เซอร์แยกจาก archive cleanup: แท็บ/โพรเซสเบราว์เซอร์ที่ติดตามไว้จะถูกปิดแบบ best-effort เมื่อการรันเสร็จ แม้ว่าจะยังเก็บทรานสคริปต์/ระเบียนของเซสชันไว้ก็ตาม

## Nested Sub-Agents

โดยค่าปริยาย ซับเอเจนต์จะไม่สามารถ spawn ซับเอเจนต์ของตัวเองได้ (`maxSpawnDepth: 1`) คุณสามารถเปิดใช้การซ้อนหนึ่งระดับได้โดยตั้ง `maxSpawnDepth: 2` ซึ่งจะอนุญาตให้ใช้ **รูปแบบ orchestrator**: main → orchestrator sub-agent → worker sub-sub-agent

### วิธีเปิดใช้

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### ระดับความลึก

| Depth | รูปแบบ session key                           | บทบาท                                         | Spawn ได้หรือไม่              |
| ----- | -------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                            | เอเจนต์หลัก                                   | ได้เสมอ                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | ซับเอเจนต์ (หรือ orchestrator เมื่ออนุญาต depth 2) | ได้เฉพาะเมื่อ `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | ซับเอเจนต์ชั้นย่อย (worker ปลายทาง)          | ไม่ได้                        |

### ห่วงโซ่ของ announce

ผลลัพธ์จะไหลย้อนกลับขึ้นมาตามห่วงโซ่:

1. worker ที่ depth-2 เสร็จสิ้น → ประกาศไปยัง parent ของมัน (orchestrator ที่ depth-1)
2. orchestrator ที่ depth-1 ได้รับ announce, สังเคราะห์ผลลัพธ์, เสร็จสิ้น → ประกาศไปยัง main
3. เอเจนต์หลักได้รับ announce แล้วส่งต่อให้ผู้ใช้

แต่ละระดับจะเห็นเฉพาะ announce จากลูกโดยตรงของตัวเองเท่านั้น

คำแนะนำในการปฏิบัติงาน:

- เริ่มงานของ child เพียงครั้งเดียวและรอ event การเสร็จสิ้น แทนการสร้างลูป poll
  รอบ ๆ `sessions_list`, `sessions_history`, `/subagents list` หรือ
  คำสั่ง `exec` sleep
- หาก event การเสร็จสิ้นของ child มาถึงหลังจากที่คุณส่งคำตอบสุดท้ายไปแล้ว
  การติดตามผลที่ถูกต้องคือ silent token แบบตรงตัว `NO_REPLY` / `no_reply`

### นโยบายเครื่องมือตามระดับความลึก

- บทบาทและขอบเขตการควบคุมจะถูกเขียนลงใน metadata ของเซสชันตอน spawn ซึ่งช่วยป้องกันไม่ให้ session key แบบแบนหรือแบบกู้คืนกลับมาได้สิทธิ์ orchestrator โดยไม่ตั้งใจ
- **Depth 1 (orchestrator, เมื่อ `maxSpawnDepth >= 2`)**: ได้รับ `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` เพื่อให้จัดการ child ของตัวเองได้ ส่วน session/system tool อื่น ๆ จะยังถูกปฏิเสธ
- **Depth 1 (leaf, เมื่อ `maxSpawnDepth == 1`)**: ไม่มี session tool (พฤติกรรมค่าปริยายปัจจุบัน)
- **Depth 2 (leaf worker)**: ไม่มี session tool — `sessions_spawn` จะถูกปฏิเสธเสมอที่ depth 2 ไม่สามารถ spawn child เพิ่มได้อีก

### ขีดจำกัดการ spawn รายเอเจนต์

แต่ละเซสชันของเอเจนต์ (ในทุกระดับความลึก) สามารถมี child ที่ active พร้อมกันได้สูงสุด `maxChildrenPerAgent` (ค่าปริยาย: 5) เท่านั้น สิ่งนี้ช่วยป้องกันการแตกแขนงแบบ runaway จาก orchestrator ตัวเดียว

### Cascade stop

การหยุด orchestrator ที่ depth-1 จะหยุด child ที่ depth-2 ทั้งหมดโดยอัตโนมัติ:

- `/stop` ในแชตหลักจะหยุดเอเจนต์ทั้งหมดที่ depth-1 และ cascade ไปยัง child ที่ depth-2 ของพวกมัน
- `/subagents kill <id>` จะหยุดซับเอเจนต์ตัวที่ระบุ และ cascade ไปยัง child ของมัน
- `/subagents kill all` จะหยุดซับเอเจนต์ทั้งหมดของผู้ร้องขอและทำ cascade

## Authentication

auth ของซับเอเจนต์จะถูก resolve ตาม **agent id** ไม่ใช่ตามประเภทของเซสชัน:

- session key ของซับเอเจนต์คือ `agent:<agentId>:subagent:<uuid>`
- auth store จะถูกโหลดจาก `agentDir` ของเอเจนต์นั้น
- auth profile ของเอเจนต์หลักจะถูก merge เข้ามาเป็น **fallback**; profile ของเอเจนต์จะ override profile ของเอเจนต์หลักเมื่อมีความขัดแย้ง

หมายเหตุ: การ merge เป็นแบบ additive ดังนั้น profile ของเอเจนต์หลักจะพร้อมใช้งานเป็น fallback เสมอ ขณะนี้ยังไม่รองรับ auth ที่แยกขาดโดยสมบูรณ์รายเอเจนต์

## Announce

ซับเอเจนต์จะรายงานกลับผ่านขั้น announce:

- ขั้น announce จะรันภายในเซสชันของซับเอเจนต์ (ไม่ใช่เซสชันของผู้ร้องขอ)
- หากซับเอเจนต์ตอบกลับเป็น `ANNOUNCE_SKIP` แบบตรงตัว จะไม่มีการโพสต์อะไร
- หากข้อความ assistant ล่าสุดเป็น silent token แบบตรงตัว `NO_REPLY` / `no_reply`,
  เอาต์พุตของ announce จะถูกระงับ แม้ว่าก่อนหน้านั้นจะมีความคืบหน้าที่มองเห็นได้ก็ตาม
- มิฉะนั้น การส่งผลจะขึ้นอยู่กับความลึกของผู้ร้องขอ:
  - เซสชันผู้ร้องขอระดับบนสุดจะใช้การเรียก `agent` แบบ follow-up พร้อม external delivery (`deliver=true`)
  - เซสชันซับเอเจนต์ของผู้ร้องขอที่ซ้อนอยู่จะได้รับ internal follow-up injection (`deliver=false`) เพื่อให้ orchestrator สังเคราะห์ผลลัพธ์ของ child ภายในเซสชัน
  - หากเซสชันซับเอเจนต์ของผู้ร้องขอที่ซ้อนอยู่นั้นหายไป OpenClaw จะ fallback ไปยัง requester ของเซสชันนั้นเมื่อทำได้
- สำหรับเซสชันผู้ร้องขอระดับบนสุด การส่งผลแบบ completion-mode direct delivery จะ resolve เส้นทาง conversation/thread ที่ถูก bind และ hook override ก่อน จากนั้นจึงเติมฟิลด์ channel-target ที่ขาดหายจากเส้นทางที่เก็บไว้ของเซสชันผู้ร้องขอ ทำให้ completion ยังคงไปยังแชต/หัวข้อที่ถูกต้องแม้ว่าต้นทางของ completion จะระบุเพียง channel
- การรวมผลของ child ที่เสร็จสิ้นจะถูกจำกัดขอบเขตไว้ที่ requester run ปัจจุบันเมื่อสร้าง nested completion findings เพื่อป้องกันไม่ให้เอาต์พุตของ child จาก run เก่ารั่วเข้ามาใน announce ปัจจุบัน
- announce reply จะคงการ route ตาม thread/topic ไว้เมื่อ channel adapter รองรับ
- บริบทของ announce จะถูก normalize เป็นบล็อก event ภายในที่คงที่:
  - แหล่งที่มา (`subagent` หรือ `cron`)
  - child session key/id
  - ประเภทของ announce + ป้ายกำกับ task
  - บรรทัดสถานะที่ได้มาจากผลลัพธ์ของ runtime (`success`, `error`, `timeout` หรือ `unknown`)
  - เนื้อหาผลลัพธ์ที่เลือกจากข้อความ assistant ล่าสุดที่มองเห็นได้ หรือหากไม่มี จะใช้ข้อความล่าสุดของ tool/toolResult ที่ sanitize แล้ว; การรันที่ล้มเหลวแบบ terminal จะรายงานสถานะล้มเหลวโดยไม่ replay ข้อความตอบที่จับไว้
  - คำสั่งติดตามผลที่อธิบายว่าเมื่อใดควรตอบ และเมื่อใดควรเงียบ
- `Status` ไม่ได้อนุมานจากเอาต์พุตของโมเดล; มันมาจากสัญญาณผลลัพธ์ของ runtime
- เมื่อ timeout หาก child ไปได้ไกลเพียงระดับการเรียกใช้เครื่องมือ announce สามารถยุบประวัตินั้นให้เป็นสรุปความคืบหน้าบางส่วนแบบสั้น ๆ แทนการ replay เอาต์พุตเครื่องมือดิบ

payload ของ announce จะมีบรรทัดสถิติที่ท้ายเสมอ (แม้ในกรณีที่ถูก wrap):

- Runtime (เช่น `runtime 5m12s`)
- การใช้โทเค็น (input/output/total)
- ค่าใช้จ่ายโดยประมาณเมื่อมีการกำหนดราคาโมเดลไว้ (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` และพาธของทรานสคริปต์ (เพื่อให้เอเจนต์หลักดึงประวัติผ่าน `sessions_history` หรือตรวจสอบไฟล์บนดิสก์ได้)
- metadata ภายในมีไว้สำหรับ orchestration เท่านั้น; คำตอบที่ส่งให้ผู้ใช้ควรถูกเขียนใหม่ด้วยน้ำเสียง assistant ปกติ

`sessions_history` เป็นเส้นทาง orchestration ที่ปลอดภัยกว่า:

- การดึงข้อความ assistant ย้อนหลังจะถูก normalize ก่อน:
  - ลบแท็กการคิด
  - ลบบล็อก scaffolding `<relevant-memories>` / `<relevant_memories>`
  - ลบบล็อก payload XML ของการเรียกใช้เครื่องมือในรูปแบบ plain-text เช่น `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` และ
    `<function_calls>...</function_calls>` รวมถึง payload ที่ถูกตัดและปิดไม่สมบูรณ์
  - ลบ scaffolding ของ tool-call/result ที่ถูกลดระดับแล้วและ historical-context marker
  - ลบ leaked model control token เช่น `<|assistant|>`, token ASCII อื่นในรูป
    `<|...|>` และตัวแปร full-width แบบ `<｜...｜>`
  - ลบ XML ของการเรียกเครื่องมือแบบผิดรูปของ MiniMax
- ข้อความที่คล้าย credential/token จะถูก redact
- บล็อกยาว ๆ อาจถูกตัดทอน
- ประวัติที่ใหญ่มากอาจตัดแถวเก่าออก หรือแทนที่แถวที่ใหญ่เกินไปด้วย
  `[sessions_history omitted: message too large]`
- การตรวจสอบทรานสคริปต์ดิบบนดิสก์คือ fallback เมื่อคุณต้องการทรานสคริปต์แบบเต็มทุกไบต์

## นโยบายเครื่องมือ (เครื่องมือของซับเอเจนต์)

โดยค่าปริยาย ซับเอเจนต์จะได้รับ **เครื่องมือทั้งหมด ยกเว้น session tool** และ system tool:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

` sessions_history` ยังคงเป็นมุมมองย้อนกลับแบบมีขอบเขตและผ่านการ sanitize ที่นี่เช่นกัน; มันไม่ใช่
การ dump ทรานสคริปต์ดิบ

เมื่อ `maxSpawnDepth >= 2`, ซับเอเจนต์ orchestrator ที่ depth-1 จะได้รับ `sessions_spawn`, `subagents`, `sessions_list` และ `sessions_history` เพิ่มเติม เพื่อให้จัดการ child ของตัวเองได้

override ได้ผ่านคอนฟิก:

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrency

ซับเอเจนต์ใช้ lane ของคิวภายในโพรเซสโดยเฉพาะ:

- ชื่อ lane: `subagent`
- Concurrency: `agents.defaults.subagents.maxConcurrent` (ค่าปริยาย `8`)

## การหยุด

- การส่ง `/stop` ในแชตของผู้ร้องขอจะ abort เซสชันของผู้ร้องขอและหยุดการรันซับเอเจนต์ที่ active ซึ่งถูก spawn มาจากมัน รวมถึง cascade ไปยัง child ที่ซ้อนกัน
- `/subagents kill <id>` จะหยุดซับเอเจนต์ตัวที่ระบุและ cascade ไปยัง child ของมัน

## ข้อจำกัด

- announce ของซับเอเจนต์เป็นแบบ **best-effort** หาก gateway รีสตาร์ต งาน "ประกาศกลับ" ที่ค้างอยู่จะสูญหาย
- ซับเอเจนต์ยังคงแชร์ทรัพยากรของโพรเซส gateway เดียวกัน; ให้มอง `maxConcurrent` เป็นวาล์วความปลอดภัย
- `sessions_spawn` ไม่บล็อกเสมอ: มันจะคืน `{ status: "accepted", runId, childSessionKey }` กลับมาทันที
- บริบทของซับเอเจนต์จะ inject เฉพาะ `AGENTS.md` + `TOOLS.md` เท่านั้น (ไม่มี `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` หรือ `BOOTSTRAP.md`)
- ความลึกสูงสุดของการซ้อนคือ 5 (`maxSpawnDepth` ช่วง: 1–5) โดยแนะนำให้ใช้ depth 2 สำหรับกรณีใช้งานส่วนใหญ่
- `maxChildrenPerAgent` ใช้จำกัดจำนวน child ที่ active ต่อเซสชัน (ค่าปริยาย: 5, ช่วง: 1–20)

## ที่เกี่ยวข้อง

- [ACP agents](/th/tools/acp-agents)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [Agent send](/th/tools/agent-send)
