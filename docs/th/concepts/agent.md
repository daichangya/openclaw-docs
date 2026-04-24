---
read_when:
    - การเปลี่ยน Agent runtime การบูตสแตรป workspace หรือพฤติกรรมของเซสชัน
summary: Agent runtime สัญญา workspace และการบูตสแตรปเซสชัน
title: Agent runtime
x-i18n:
    generated_at: "2026-04-24T09:05:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw รัน **embedded agent runtime เดียว** — หนึ่งโปรเซสเอเจนต์ต่อ
Gateway โดยมี workspace, ไฟล์ bootstrap และ session store ของตัวเอง หน้านี้
ครอบคลุมสัญญาของ runtime นี้: workspace ต้องมีอะไรบ้าง ไฟล์ใดถูก inject
และเซสชัน bootstrap เข้ากับมันอย่างไร

## Workspace (จำเป็น)

OpenClaw ใช้ไดเรกทอรี workspace ของเอเจนต์เพียงรายการเดียว (`agents.defaults.workspace`) เป็นไดเรกทอรีทำงาน (`cwd`) **เพียงแห่งเดียว** ของเอเจนต์สำหรับ tools และ context

คำแนะนำ: ใช้ `openclaw setup` เพื่อสร้าง `~/.openclaw/openclaw.json` หากยังไม่มี และเริ่มต้นไฟล์ workspace

ผัง workspace แบบเต็ม + คู่มือการสำรองข้อมูล: [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)

หากเปิดใช้ `agents.defaults.sandbox` เซสชันที่ไม่ใช่ main สามารถ override ค่านี้ได้ด้วย
workspace รายเซสชันภายใต้ `agents.defaults.sandbox.workspaceRoot` (ดู
[การกำหนดค่า Gateway](/th/gateway/configuration))

## ไฟล์ Bootstrap (ถูก inject)

ภายใน `agents.defaults.workspace` OpenClaw คาดหวังไฟล์ที่ผู้ใช้แก้ไขได้เหล่านี้:

- `AGENTS.md` — คำสั่งการทำงาน + “ความทรงจำ”
- `SOUL.md` — บุคลิก ขอบเขต น้ำเสียง
- `TOOLS.md` — บันทึกเกี่ยวกับเครื่องมือที่ผู้ใช้ดูแลเอง (เช่น `imsg`, `sag`, ข้อตกลงต่าง ๆ)
- `BOOTSTRAP.md` — ขั้นตอนเริ่มต้นครั้งแรกแบบครั้งเดียว (ลบหลังเสร็จสิ้น)
- `IDENTITY.md` — ชื่อ/บรรยากาศ/อีโมจิของเอเจนต์
- `USER.md` — โปรไฟล์ผู้ใช้ + วิธีเรียกที่ต้องการ

ใน turn แรกของเซสชันใหม่ OpenClaw จะ inject เนื้อหาของไฟล์เหล่านี้เข้าไปใน context ของเอเจนต์โดยตรง

ไฟล์ว่างจะถูกข้าม ไฟล์ขนาดใหญ่จะถูกตัดแต่งและตัดทอนพร้อมตัวบ่งชี้เพื่อให้ prompt ยังคงกระชับ (ให้อ่านไฟล์โดยตรงหากต้องการเนื้อหาครบถ้วน)

หากไฟล์หายไป OpenClaw จะ inject บรรทัดตัวบ่งชี้ “missing file” เพียงบรรทัดเดียว (และ `openclaw setup` จะสร้างเทมเพลตเริ่มต้นที่ปลอดภัยให้)

`BOOTSTRAP.md` จะถูกสร้างขึ้นเฉพาะสำหรับ **workspace ใหม่เอี่ยม** เท่านั้น (ไม่มีไฟล์ bootstrap อื่นอยู่) หากคุณลบมันทิ้งหลังจากทำขั้นตอนเสร็จแล้ว มันไม่ควรถูกสร้างใหม่ในการรีสตาร์ตครั้งถัดไป

หากต้องการปิดการสร้างไฟล์ bootstrap ทั้งหมด (สำหรับ workspace ที่เตรียมไว้ล่วงหน้า) ให้ตั้งค่า:

```json5
{ agent: { skipBootstrap: true } }
```

## เครื่องมือในตัว

เครื่องมือแกนหลัก (read/exec/edit/write และเครื่องมือระบบที่เกี่ยวข้อง) พร้อมใช้งานเสมอ
โดยขึ้นอยู่กับนโยบายเครื่องมือ `apply_patch` เป็นตัวเลือกและถูกควบคุมโดย
`tools.exec.applyPatch` `TOOLS.md` **ไม่ได้**ควบคุมว่าเครื่องมือใดมีอยู่บ้าง; มันเป็น
คำแนะนำเกี่ยวกับวิธีที่_คุณ_ต้องการให้ใช้งานเครื่องมือเหล่านั้น

## Skills

OpenClaw โหลด Skills จากตำแหน่งเหล่านี้ (ลำดับความสำคัญสูงสุดก่อน):

- Workspace: `<workspace>/skills`
- Skills ของเอเจนต์ในโปรเจกต์: `<workspace>/.agents/skills`
- Skills ของเอเจนต์ส่วนตัว: `~/.agents/skills`
- แบบจัดการ/ในเครื่อง: `~/.openclaw/skills`
- แบบรวมมาให้ (มากับการติดตั้ง)
- โฟลเดอร์ skill เพิ่มเติม: `skills.load.extraDirs`

Skills อาจถูกควบคุมโดย config/env (ดู `skills` ใน [การกำหนดค่า Gateway](/th/gateway/configuration))

## ขอบเขตของ runtime

embedded agent runtime สร้างอยู่บนแกนเอเจนต์ Pi (models, tools และ
prompt pipeline) การจัดการเซสชัน การค้นพบ การเชื่อมต่อเครื่องมือ และการส่งมอบช่องทาง
เป็นเลเยอร์ที่ OpenClaw เป็นเจ้าของซึ่งอยู่เหนือแกนนั้น

## เซสชัน

บันทึก transcript ของเซสชันจะถูกเก็บเป็น JSONL ที่:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Session ID มีเสถียรภาพและถูกเลือกโดย OpenClaw
ระบบจะไม่อ่านโฟลเดอร์เซสชันแบบ legacy จากเครื่องมืออื่น

## การควบคุมทิศทางระหว่างการสตรีม

เมื่อโหมดคิวเป็น `steer` ข้อความขาเข้าจะถูก inject เข้าไปในการรันปัจจุบัน
ข้อความ steer ที่เข้าคิวไว้จะถูกส่ง **หลังจาก assistant turn ปัจจุบันรัน
tool calls เสร็จสิ้นแล้ว** ก่อนการเรียก LLM ครั้งถัดไป ตอนนี้การ steer จะไม่ข้าม
tool calls ที่เหลือจากข้อความ assistant ปัจจุบันอีกต่อไป; แต่จะ inject ข้อความที่เข้าคิวไว้ที่ขอบเขตของโมเดลถัดไปแทน

เมื่อโหมดคิวเป็น `followup` หรือ `collect` ข้อความขาเข้าจะถูกพักไว้จนกว่า
turn ปัจจุบันจะจบ จากนั้น agent turn ใหม่จะเริ่มด้วย payload ที่เข้าคิวไว้ ดู
[คิว](/th/concepts/queue) สำหรับพฤติกรรมของโหมด + debounce/cap

การสตรีมแบบบล็อกจะส่ง assistant blocks ที่เสร็จแล้วทันทีที่เสร็จ; โดย
**ปิดเป็นค่าเริ่มต้น** (`agents.defaults.blockStreamingDefault: "off"`).
ปรับขอบเขตได้ผ่าน `agents.defaults.blockStreamingBreak` (`text_end` เทียบกับ `message_end`; ค่าเริ่มต้นคือ text_end)
ควบคุมการแบ่ง chunk แบบ soft block ด้วย `agents.defaults.blockStreamingChunk` (ค่าเริ่มต้น
800–1200 ตัวอักษร; ให้ความสำคัญกับการขึ้นย่อหน้า จากนั้นขึ้นบรรทัดใหม่ และประโยคเป็นลำดับสุดท้าย)
รวม streamed chunks ด้วย `agents.defaults.blockStreamingCoalesce` เพื่อลด
สแปมบรรทัดเดียว (รวมแบบอิงช่วง idle ก่อนส่ง) ช่องทางที่ไม่ใช่ Telegram ต้อง
เปิด `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้ block replies
สรุปเครื่องมือแบบ verbose จะถูกส่งเมื่อเริ่มเครื่องมือ (ไม่มี debounce); Control UI
สตรีมเอาต์พุตของเครื่องมือผ่านเหตุการณ์ของเอเจนต์เมื่อรองรับ
รายละเอียดเพิ่มเติม: [การสตรีม + การแบ่ง chunk](/th/concepts/streaming)

## Model refs

Model refs ในคอนฟิก (เช่น `agents.defaults.model` และ `agents.defaults.models`) จะถูกแยกโดยแบ่งที่ `/` **ตัวแรก**

- ใช้ `provider/model` เมื่อกำหนดค่า models
- หาก model ID เองมี `/` (แบบ OpenRouter) ให้ใส่ provider prefix ด้วย (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นลอง
  จับคู่ configured-provider แบบไม่ซ้ำสำหรับ model id ที่ตรงกันนั้น และหลังจากนั้นจึง fallback
  ไปยัง provider เริ่มต้นที่กำหนดไว้เท่านั้น หาก provider นั้นไม่เปิดเผย
  model เริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw จะ fallback ไปยัง
  provider/model รายการแรกที่กำหนดค่าไว้แทน แทนที่จะแสดงค่าเริ่มต้นของ provider ที่ถูกลบไปแล้วและล้าสมัย

## การกำหนดค่า (ขั้นต่ำ)

อย่างน้อยที่สุด ให้ตั้งค่า:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (แนะนำอย่างยิ่ง)

---

_ถัดไป: [แชตกลุ่ม](/th/channels/group-messages)_ 🦞

## ที่เกี่ยวข้อง

- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การจัดการเซสชัน](/th/concepts/session)
