---
read_when:
    - การแก้ไขข้อความ System prompt รายการ tools หรือส่วนเวลา/Heartbeat
    - การเปลี่ยนพฤติกรรมการบูตสแตรป workspace หรือการแทรก Skills
summary: สิ่งที่อยู่ใน system prompt ของ OpenClaw และวิธีประกอบมันขึ้นมา
title: System prompt
x-i18n:
    generated_at: "2026-04-24T09:07:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw จะสร้าง system prompt แบบกำหนดเองสำหรับทุกการรันของเอเจนต์ โดย prompt นี้เป็น **ของ OpenClaw เอง** และไม่ได้ใช้ prompt ค่าเริ่มต้นของ pi-coding-agent

prompt นี้จะถูกประกอบโดย OpenClaw และแทรกเข้าไปในการรันของเอเจนต์แต่ละครั้ง

Provider Plugins สามารถเพิ่มแนวทางการใช้ prompt ที่รับรู้ cache ได้ โดยไม่ต้องแทนที่
prompt ทั้งหมดที่ OpenClaw เป็นเจ้าของ runtime ของ provider สามารถ:

- แทนที่ core sections แบบมีชื่อจำนวนเล็กน้อย (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- แทรก **stable prefix** ไว้เหนือ prompt cache boundary
- แทรก **dynamic suffix** ไว้ใต้ prompt cache boundary

ใช้ส่วนเพิ่มที่เป็นของ provider สำหรับการปรับแต่งตามตระกูลโมเดลโดยเฉพาะ เก็บการแก้ไข prompt แบบเดิมผ่าน
`before_prompt_build` ไว้เพื่อความเข้ากันได้หรือสำหรับการเปลี่ยน prompt แบบโกลบอลจริง ๆ ไม่ใช่สำหรับพฤติกรรมปกติของ provider

overlay สำหรับตระกูล OpenAI GPT-5 จะคงกฎการทำงานหลักไว้ให้เล็ก และเพิ่ม
คำแนะนำเฉพาะโมเดลสำหรับ persona latching, เอาต์พุตที่กระชับ, วินัยในการใช้ tool,
parallel lookup, ความครอบคลุมของ deliverable, การตรวจสอบยืนยัน, บริบทที่ขาดหาย และ
สุขอนามัยของ terminal-tool

## โครงสร้าง

prompt นี้มีขนาดกะทัดรัดโดยตั้งใจ และใช้ sections แบบคงที่:

- **Tooling**: การเตือนว่า structured-tool เป็นแหล่งข้อมูลจริงหลัก พร้อมแนวทางการใช้ tool ใน runtime
- **Execution Bias**: แนวทางแบบกระชับเพื่อทำงานต่อให้จบ: ลงมือทำภายในเทิร์นกับ
  คำขอที่ลงมือได้ ดำเนินต่อจนเสร็จหรือถูกบล็อก ฟื้นตัวจากผลลัพธ์ tool ที่อ่อน
  ตรวจสอบ mutable state แบบสด และยืนยันก่อนสรุปผล
- **Safety**: การเตือน guardrail แบบสั้นเพื่อหลีกเลี่ยงพฤติกรรมแสวงหาอำนาจหรือหลบเลี่ยงการกำกับดูแล
- **Skills** (เมื่อมี): บอกโมเดลว่าจะโหลดคำสั่งของ skill ตามต้องการอย่างไร
- **OpenClaw Self-Update**: วิธีตรวจสอบ config อย่างปลอดภัยด้วย
  `config.schema.lookup`, patch config ด้วย `config.patch`, แทนที่ config ทั้งหมด
  ด้วย `config.apply` และรัน `update.run` ได้เฉพาะเมื่อผู้ใช้ร้องขออย่างชัดเจน
  tool `gateway` ที่จำกัดเฉพาะ owner ยังปฏิเสธการเขียนทับ
  `tools.exec.ask` / `tools.exec.security` รวมถึง alias แบบเดิม `tools.bash.*`
  ที่ถูก normalize ไปยัง protected exec paths เหล่านั้น
- **Workspace**: ไดเรกทอรีทำงาน (`agents.defaults.workspace`)
- **Documentation**: พาธภายในเครื่องไปยังเอกสาร OpenClaw (repo หรือ npm package) และควรอ่านเมื่อใด
- **Workspace Files (injected)**: ระบุว่า bootstrap files ถูกรวมไว้ด้านล่าง
- **Sandbox** (เมื่อเปิดใช้งาน): ระบุ runtime แบบ sandboxed, พาธของ sandbox และมี elevated exec หรือไม่
- **Current Date & Time**: เวลาท้องถิ่นของผู้ใช้ เขตเวลา และรูปแบบเวลา
- **Reply Tags**: ไวยากรณ์ของ reply tag แบบไม่บังคับสำหรับ providers ที่รองรับ
- **Heartbeats**: prompt ของ heartbeat และพฤติกรรม ack เมื่อเปิดใช้ heartbeat สำหรับเอเจนต์เริ่มต้น
- **Runtime**: โฮสต์, OS, node, โมเดล, repo root (เมื่อตรวจพบ), ระดับความคิด (หนึ่งบรรทัด)
- **Reasoning**: ระดับการมองเห็นปัจจุบัน + คำใบ้สำหรับสลับด้วย `/reasoning`

ส่วน Tooling ยังรวมแนวทางใน runtime สำหรับงานที่ใช้เวลานานด้วย:

- ใช้ cron สำหรับการติดตามในอนาคต (`check back later`, การเตือน, งานที่เกิดซ้ำ)
  แทน `exec` sleep loops, ลูกเล่นหน่วงเวลา `yieldMs` หรือการ polling `process`
  ซ้ำ ๆ
- ใช้ `exec` / `process` เฉพาะกับคำสั่งที่เริ่มตอนนี้และทำงานต่อ
  ในเบื้องหลัง
- เมื่อเปิดใช้งาน automatic completion wake ให้เริ่มคำสั่งเพียงครั้งเดียว และพึ่ง
  push-based wake path เมื่อคำสั่งนั้นส่งเอาต์พุตออกมาหรือล้มเหลว
- ใช้ `process` สำหรับ logs, status, input หรือการแทรกแซง เมื่อคุณต้องการ
  ตรวจสอบคำสั่งที่กำลังทำงานอยู่
- หากงานใหญ่กว่า ให้เลือกใช้ `sessions_spawn`; การเสร็จสิ้นของ sub-agent เป็น
  แบบ push-based และประกาศกลับไปยังผู้ร้องขอโดยอัตโนมัติ
- อย่า poll `subagents list` / `sessions_list` เป็นลูปเพียงเพื่อรอ
  การเสร็จสิ้น

เมื่อเปิดใช้ tool ทดลอง `update_plan` ส่วน Tooling จะบอกโมเดลด้วยว่า
ให้ใช้เฉพาะกับงานหลายขั้นตอนที่ไม่ใช่งานเล็กน้อย คงไว้เพียงหนึ่งขั้นที่มีสถานะ
`in_progress` และหลีกเลี่ยงการทวนทั้งแผนซ้ำหลังจากอัปเดตทุกครั้ง

Safety guardrails ใน system prompt เป็นเพียงคำแนะนำ พวกมันช่วยชี้นำพฤติกรรมของโมเดลแต่ไม่ได้บังคับใช้นโยบาย ใช้นโยบายของ tool, exec approvals, sandboxing และ channel allowlists สำหรับการบังคับใช้แบบจริงจัง; ผู้ปฏิบัติงานสามารถปิดสิ่งเหล่านี้ได้ตามการออกแบบ

บนแชนแนลที่มีการ์ด/ปุ่มอนุมัติแบบเนทีฟ runtime prompt ตอนนี้จะบอกเอเจนต์ให้
พึ่ง native approval UI นั้นก่อน โดยควรใส่คำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อ
ผลลัพธ์ของ tool ระบุว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็นทางเดียวเท่านั้น

## โหมดของ prompt

OpenClaw สามารถเรนเดอร์ system prompts ที่เล็กลงสำหรับ sub-agents ได้ runtime จะตั้งค่า
`promptMode` สำหรับแต่ละการรัน (ไม่ใช่ config ที่ผู้ใช้มองเห็นได้):

- `full` (ค่าเริ่มต้น): รวมทุก section ข้างต้น
- `minimal`: ใช้สำหรับ sub-agents; ตัด **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** และ **Heartbeats** ออก ส่วน Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (เมื่อทราบ), Runtime และ injected
  context ยังคงมีอยู่
- `none`: ส่งคืนเพียงบรรทัด identity พื้นฐานเท่านั้น

เมื่อ `promptMode=minimal`, prompts เพิ่มเติมที่ถูกแทรกจะถูกติดป้ายเป็น **Subagent
Context** แทน **Group Chat Context**

## การแทรก bootstrap ของ workspace

bootstrap files จะถูกตัดให้สั้นลงและต่อท้ายภายใต้ **Project Context** เพื่อให้โมเดลเห็นบริบทของ identity และ profile โดยไม่ต้องอ่านแบบ explicit:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะ workspaces ที่สร้างใหม่เท่านั้น)
- `MEMORY.md` เมื่อมีอยู่

ไฟล์ทั้งหมดนี้จะถูก **แทรกเข้าไปในหน้าต่างบริบท** ทุกเทิร์น เว้นแต่
จะมี gate เฉพาะไฟล์ `HEARTBEAT.md` จะถูกละออกในการรันปกติเมื่อ
heartbeats ถูกปิดสำหรับเอเจนต์เริ่มต้น หรือเมื่อ
`agents.defaults.heartbeat.includeSystemPromptSection` เป็น false ให้ทำไฟล์ที่ถูกแทรก
ให้กระชับ — โดยเฉพาะ `MEMORY.md` ซึ่งอาจเติบโตขึ้นตามเวลาและนำไปสู่
การใช้บริบทสูงอย่างไม่คาดคิดและ Compaction ที่ถี่ขึ้น

> **หมายเหตุ:** ไฟล์รายวัน `memory/*.md` **ไม่** เป็นส่วนหนึ่งของ bootstrap
> Project Context ปกติ ในเทิร์นทั่วไปไฟล์เหล่านี้จะถูกเข้าถึงตามต้องการผ่าน
> tools `memory_search` และ `memory_get` ดังนั้นจึงไม่กินพื้นที่ใน
> context window เว้นแต่โมเดลจะอ่านมันอย่างชัดเจน เทิร์น `/new` และ
> `/reset` เปล่า ๆ เป็นข้อยกเว้น: runtime สามารถเติม memory รายวันล่าสุดไว้ข้างหน้า
> เป็นบล็อก startup-context แบบครั้งเดียวสำหรับเทิร์นแรกนั้น

ไฟล์ขนาดใหญ่จะถูกตัดพร้อม marker ขนาดสูงสุดต่อไฟล์ควบคุมด้วย
`agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) ปริมาณ bootstrap
ที่ถูกแทรกทั้งหมดข้ามหลายไฟล์ถูกจำกัดด้วย `agents.defaults.bootstrapTotalMaxChars`
(ค่าเริ่มต้น: 60000) ไฟล์ที่หายไปจะฉีดเครื่องหมายไฟล์หายแบบสั้น เมื่อเกิดการตัดทอน
OpenClaw สามารถฉีดบล็อกเตือนใน Project Context ได้; ควบคุมสิ่งนี้ด้วย
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
ค่าเริ่มต้น: `once`)

เซสชันของ sub-agent จะแทรกเฉพาะ `AGENTS.md` และ `TOOLS.md` เท่านั้น (bootstrap files อื่น
จะถูกกรองออกเพื่อให้บริบทของ sub-agent มีขนาดเล็ก)

hooks ภายในสามารถสกัดกั้นขั้นตอนนี้ผ่าน `agent:bootstrap` เพื่อแก้ไขหรือแทนที่
bootstrap files ที่ถูกแทรก (เช่น สลับ `SOUL.md` เป็น persona แบบอื่น)

หากคุณต้องการทำให้เอเจนต์ฟังดูทั่วไปน้อยลง ให้เริ่มจาก
[SOUL.md Personality Guide](/th/concepts/soul)

หากต้องการตรวจสอบว่าแต่ละไฟล์ที่ถูกแทรกส่งผลมากแค่ไหน (raw เทียบกับ injected, การตัดทอน รวมถึง overhead ของ schema ของ tool) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## การจัดการเวลา

system prompt จะมี section **Current Date & Time** โดยเฉพาะเมื่อทราบ
เขตเวลาของผู้ใช้ เพื่อให้ prompt มีความเสถียรต่อ cache ตอนนี้มันจะรวมเพียง
**เขตเวลา** เท่านั้น (ไม่มีนาฬิกาแบบไดนามิกหรือรูปแบบเวลา)

ใช้ `session_status` เมื่อเอเจนต์ต้องการเวลาปัจจุบัน; การ์ดสถานะจะมี
บรรทัดประทับเวลา tool เดียวกันนี้ยังสามารถตั้งค่า per-session model
override ได้ตามตัวเลือก (`model=default` จะล้างมัน)

กำหนดค่าด้วย:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดู [Date & Time](/th/date-time) สำหรับรายละเอียดพฤติกรรมทั้งหมด

## Skills

เมื่อมี Skills ที่เข้าเกณฑ์ OpenClaw จะฉีด **available skills list** แบบกะทัดรัด
(`formatSkillsForPrompt`) ที่รวม **พาธไฟล์** ของแต่ละ skill ด้วย prompt
จะสั่งให้โมเดลใช้ `read` เพื่อโหลด SKILL.md ที่ตำแหน่งที่ระบุไว้
(ใน workspace, แบบ managed หรือแบบ bundled) หากไม่มี skill ที่เข้าเกณฑ์
ส่วน Skills จะถูกละออก

เกณฑ์การมีสิทธิ์รวมถึง metadata gates ของ skill, การตรวจสอบ runtime environment/config
และ allowlist ของ Skills ที่มีผลกับเอเจนต์เมื่อมีการกำหนด
`agents.defaults.skills` หรือ `agents.list[].skills`

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

สิ่งนี้ช่วยให้ prompt พื้นฐานมีขนาดเล็ก ขณะเดียวกันก็ยังเปิดให้ใช้ skill แบบเจาะจงได้

งบประมาณของรายการ Skills เป็นของ subsystem ด้าน skills:

- ค่าเริ่มต้นแบบโกลบอล: `skills.limits.maxSkillsPromptChars`
- การแทนที่ต่อเอเจนต์: `agents.list[].skillsLimits.maxSkillsPromptChars`

excerpts ของ runtime แบบมีขอบเขตทั่วไปใช้พื้นผิวคนละส่วน:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

การแยกนี้ช่วยให้ขนาดของ skills แยกจากขนาดการอ่าน/การฉีดใน runtime เช่น
`memory_get`, ผลลัพธ์สดของ tool และการรีเฟรช `AGENTS.md` หลัง Compaction

## Documentation

เมื่อพร้อมใช้งาน system prompt จะมีส่วน **Documentation** ที่ชี้ไปยัง
ไดเรกทอรีเอกสาร OpenClaw ภายในเครื่อง (ทั้ง `docs/` ใน repo workspace หรือใน npm
package ที่รวมมา) และยังระบุกระจกสาธารณะ source repo ชุมชน Discord และ
ClawHub ([https://clawhub.ai](https://clawhub.ai)) สำหรับการค้นหา Skills prompt จะสั่งให้โมเดลอ้างอิงเอกสารภายในเครื่องก่อน
สำหรับพฤติกรรม คำสั่ง config หรือสถาปัตยกรรมของ OpenClaw และให้รัน
`openclaw status` เองเมื่อทำได้ (ถามผู้ใช้เฉพาะเมื่อไม่มีสิทธิ์เข้าถึง)

## ที่เกี่ยวข้อง

- [Agent runtime](/th/concepts/agent)
- [Agent workspace](/th/concepts/agent-workspace)
- [Context engine](/th/concepts/context-engine)
