---
read_when:
    - การแก้ไขข้อความของ system prompt, รายการเครื่องมือ หรือส่วนเวลา/Heartbeat
    - การเปลี่ยนพฤติกรรมของ workspace bootstrap หรือการ inject Skills
summary: system prompt ของ OpenClaw มีอะไรบ้างและถูกรวบรวมขึ้นมาอย่างไร
title: System prompt
x-i18n:
    generated_at: "2026-04-23T05:32:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# System Prompt

OpenClaw สร้าง system prompt แบบกำหนดเองสำหรับการรันเอเจนต์ทุกครั้ง พรอมป์ต์นี้ **เป็นของ OpenClaw เอง** และไม่ได้ใช้พรอมป์ต์เริ่มต้นของ pi-coding-agent

พรอมป์ต์จะถูกรวบรวมโดย OpenClaw และ inject เข้าไปในการรันเอเจนต์แต่ละครั้ง

Provider plugins สามารถเพิ่มคำแนะนำพรอมป์ต์แบบรับรู้ cache ได้ โดยไม่ต้องแทนที่
พรอมป์ต์ทั้งหมดที่ OpenClaw เป็นเจ้าของ รันไทม์ของ provider สามารถ:

- แทนที่ core sections แบบมีชื่อชุดเล็กๆ (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inject **stable prefix** เหนือขอบเขต prompt cache
- inject **dynamic suffix** ใต้ขอบเขต prompt cache

ใช้ส่วนที่ provider เป็นเจ้าของสำหรับการปรับแต่งเฉพาะตระกูลโมเดล เก็บการเปลี่ยนพรอมป์ต์แบบเดิมผ่าน
`before_prompt_build` ไว้เพื่อ compatibility หรือการเปลี่ยนพรอมป์ต์ระดับโกลบอลจริงๆ
ไม่ใช่พฤติกรรมของ provider ตามปกติ

overlay ของตระกูล OpenAI GPT-5 ทำให้กฎการทำงานหลักมีขนาดเล็ก และเพิ่ม
คำแนะนำเฉพาะโมเดลสำหรับ persona latching, ผลลัพธ์ที่กระชับ, วินัยในการใช้เครื่องมือ,
การค้นหาแบบขนาน, ความครอบคลุมของ deliverable, การตรวจสอบความถูกต้อง, บริบทที่ขาดหายไป
และสุขอนามัยของ terminal-tool

## โครงสร้าง

พรอมป์ต์ถูกออกแบบให้กะทัดรัดโดยตั้งใจ และใช้ sections แบบตายตัว:

- **Tooling**: การเตือนว่าแหล่งข้อมูลจริงของเครื่องมือแบบมีโครงสร้างคืออะไร พร้อมคำแนะนำการใช้เครื่องมือในรันไทม์
- **Execution Bias**: คำแนะนำแบบย่อให้ทำงานต่อเนื่อง: ลงมือในเทิร์นนั้นกับ
  คำขอที่ทำได้ทันที, ทำต่อจนเสร็จหรือจนติดขัด, ฟื้นตัวจากผลลัพธ์เครื่องมือที่อ่อน,
  ตรวจสอบสถานะที่เปลี่ยนแปลงได้จากของจริง และยืนยันก่อนสรุปคำตอบ
- **Safety**: การเตือน guardrail แบบสั้นเพื่อหลีกเลี่ยงพฤติกรรมแสวงหาอำนาจหรือเลี่ยงการกำกับดูแล
- **Skills** (เมื่อมี): บอกโมเดลว่าควรโหลดคำแนะนำของ skill ตามต้องการอย่างไร
- **OpenClaw Self-Update**: วิธีตรวจสอบ config อย่างปลอดภัยด้วย
  `config.schema.lookup`, แพตช์ config ด้วย `config.patch`, แทนที่
  config ทั้งหมดด้วย `config.apply` และรัน `update.run` เฉพาะเมื่อมีคำขอจากผู้ใช้อย่างชัดเจนเท่านั้น เครื่องมือ `gateway` ที่ใช้ได้เฉพาะเจ้าของยังปฏิเสธการเขียนทับ
  `tools.exec.ask` / `tools.exec.security` รวมถึง aliases แบบเดิม `tools.bash.*`
  ที่ถูก normalize ไปยัง exec paths ที่ได้รับการป้องกันเหล่านั้น
- **Workspace**: ไดเรกทอรีทำงาน (`agents.defaults.workspace`)
- **Documentation**: พาธในเครื่องไปยังเอกสารของ OpenClaw (repo หรือ npm package) และควรอ่านเมื่อใด
- **Workspace Files (injected)**: ระบุว่าไฟล์ bootstrap ถูกรวมไว้ด้านล่าง
- **Sandbox** (เมื่อเปิดใช้): ระบุรันไทม์แบบ sandboxed, พาธของ sandbox และมี elevated exec หรือไม่
- **Current Date & Time**: เวลาท้องถิ่นของผู้ใช้, timezone และรูปแบบเวลา
- **Reply Tags**: ไวยากรณ์ของ reply tag แบบไม่บังคับสำหรับ provider ที่รองรับ
- **Heartbeats**: พรอมป์ต์ heartbeat และพฤติกรรมการตอบรับ เมื่อเปิดใช้ heartbeats สำหรับเอเจนต์ค่าเริ่มต้น
- **Runtime**: host, OS, node, โมเดล, repo root (เมื่อตรวจพบ), ระดับการคิด (หนึ่งบรรทัด)
- **Reasoning**: ระดับการแสดงผลปัจจุบัน + คำใบ้สำหรับสลับ `/reasoning`

ส่วน Tooling ยังรวมคำแนะนำของรันไทม์สำหรับงานที่ใช้เวลานาน:

- ใช้ Cron สำหรับการติดตามผลในอนาคต (`check back later`, การเตือน, งานที่เกิดซ้ำ)
  แทน `exec` sleep loops, กลเม็ดหน่วงเวลา `yieldMs` หรือการ polling `process`
  ซ้ำๆ
- ใช้ `exec` / `process` เฉพาะกับคำสั่งที่เริ่มตอนนี้และทำงานต่อไป
  ในเบื้องหลัง
- เมื่อเปิดใช้ automatic completion wake ให้เริ่มคำสั่งครั้งเดียว และพึ่งพา
  เส้นทางปลุกแบบ push-based เมื่อมีผลลัพธ์ออกมาหรือเกิดความล้มเหลว
- ใช้ `process` สำหรับ logs, status, input หรือการแทรกแซงเมื่อคุณต้องการ
  ตรวจสอบคำสั่งที่กำลังรันอยู่
- หากงานมีขนาดใหญ่กว่า ให้เลือก `sessions_spawn`; การเสร็จสิ้นของ sub-agent เป็นแบบ
  push-based และประกาศกลับไปยังผู้ร้องขอโดยอัตโนมัติ
- อย่า polling `subagents list` / `sessions_list` เป็นลูปเพียงเพื่อรอ
  ให้เสร็จ

เมื่อเปิดใช้เครื่องมือ experimental `update_plan` ส่วน Tooling จะบอกโมเดลด้วยว่า
ให้ใช้เฉพาะกับงานหลายขั้นตอนที่ไม่ใช่งานง่ายๆ, คงไว้เพียงหนึ่งขั้นตอนที่เป็น
`in_progress` และหลีกเลี่ยงการทำซ้ำแผนทั้งหมดหลังการอัปเดตแต่ละครั้ง

Safety guardrails ใน system prompt เป็นเพียงคำแนะนำ มันชี้นำพฤติกรรมของโมเดลแต่ไม่ใช่การบังคับใช้นโยบาย ใช้นโยบายเครื่องมือ, การอนุมัติ exec, sandboxing และ channel allowlists สำหรับการบังคับใช้จริง; ผู้ปฏิบัติงานสามารถปิดสิ่งเหล่านี้ได้โดยเจตนา

บนช่องทางที่มี approval cards/buttons แบบ native ตอนนี้พรอมป์ต์ของรันไทม์จะบอก
เอเจนต์ให้พึ่งพา UI สำหรับการอนุมัติแบบ native นั้นก่อน มันควรใส่คำสั่ง
`/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือบอกว่า chat approvals ใช้ไม่ได้ หรือ
การอนุมัติด้วยตนเองเป็นเส้นทางเดียวเท่านั้น

## โหมดของพรอมป์ต์

OpenClaw สามารถเรนเดอร์ system prompts ที่เล็กลงสำหรับ sub-agents ได้ รันไทม์จะตั้ง
`promptMode` สำหรับการรันแต่ละครั้ง (ไม่ใช่ config ที่ผู้ใช้มองเห็น):

- `full` (ค่าเริ่มต้น): รวมทุก sections ด้านบน
- `minimal`: ใช้สำหรับ sub-agents; ตัด **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** และ **Heartbeats** ออก ส่วน Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (เมื่อทราบ), Runtime และบริบท
  ที่ inject ไว้จะยังคงมีอยู่
- `none`: คืนเฉพาะบรรทัดบอกอัตลักษณ์พื้นฐาน

เมื่อ `promptMode=minimal` พรอมป์ต์ที่ถูก inject เพิ่มเติมจะถูกติดป้ายเป็น **Subagent
Context** แทน **Group Chat Context**

## การ inject bootstrap ของ workspace

ไฟล์ bootstrap จะถูกตัดแต่งและต่อท้ายภายใต้ **Project Context** เพื่อให้โมเดลเห็นอัตลักษณ์และบริบทของโปรไฟล์โดยไม่ต้องอ่านอย่างชัดเจน:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะใน workspaces ที่เพิ่งสร้างใหม่)
- `MEMORY.md` เมื่อมีอยู่ มิฉะนั้นใช้ `memory.md` เป็น fallback แบบตัวพิมพ์เล็ก

ไฟล์ทั้งหมดเหล่านี้จะถูก **inject เข้าไปใน context window** ทุกเทิร์น เว้นแต่
จะมี gate เฉพาะไฟล์ `HEARTBEAT.md` จะถูกละไว้ในการรันปกติเมื่อ
ปิดใช้งาน heartbeats สำหรับเอเจนต์ค่าเริ่มต้น หรือ
`agents.defaults.heartbeat.includeSystemPromptSection` เป็น false ให้ไฟล์ที่ถูก inject
มีความกระชับ — โดยเฉพาะ `MEMORY.md` ซึ่งอาจเติบโตขึ้นตามเวลาและนำไปสู่
การใช้ context สูงโดยไม่คาดคิดและการ Compaction ที่ถี่ขึ้น

> **หมายเหตุ:** ไฟล์รายวัน `memory/*.md` **ไม่ใช่** ส่วนหนึ่งของ bootstrap
> Project Context ปกติ ในเทิร์นทั่วไป ไฟล์เหล่านี้จะถูกเข้าถึงตามต้องการผ่าน
> เครื่องมือ `memory_search` และ `memory_get` ดังนั้นจึงไม่กิน
> context window เว้นแต่โมเดลจะอ่านอย่างชัดเจน เทิร์น `/new` และ
> `/reset` แบบเปล่าเป็นข้อยกเว้น: รันไทม์สามารถ prepend daily memory ล่าสุด
> เป็นบล็อก startup-context แบบครั้งเดียวสำหรับเทิร์นแรกนั้นได้

ไฟล์ขนาดใหญ่จะถูกตัดทอนพร้อมตัวทำเครื่องหมาย ขนาดสูงสุดต่อไฟล์ถูกควบคุมโดย
`agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) เนื้อหา bootstrap ที่ inject
รวมกันทุกไฟล์ถูกจำกัดโดย `agents.defaults.bootstrapTotalMaxChars`
(ค่าเริ่มต้น: 60000) ไฟล์ที่หายไปจะ inject ตัวทำเครื่องหมายสั้นๆ ว่าไฟล์หายไป เมื่อเกิดการตัดทอน
OpenClaw สามารถ inject บล็อกคำเตือนไว้ใน Project Context ได้; ควบคุมสิ่งนี้ด้วย
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
ค่าเริ่มต้น: `once`)

sessions ของ sub-agent จะ inject เฉพาะ `AGENTS.md` และ `TOOLS.md` (ไฟล์ bootstrap อื่นๆ
จะถูกกรองออกเพื่อให้บริบทของ sub-agent มีขนาดเล็ก)

hooks ภายในสามารถดักขั้นตอนนี้ผ่าน `agent:bootstrap` เพื่อกลายพันธุ์หรือแทนที่
ไฟล์ bootstrap ที่ inject เข้าไป (เช่น สลับ `SOUL.md` เป็น persona ทางเลือก)

หากคุณต้องการทำให้เอเจนต์ฟังดูทั่วไปน้อยลง ให้เริ่มจาก
[คู่มือบุคลิกภาพ SOUL.md](/th/concepts/soul)

หากต้องการตรวจสอบว่าแต่ละไฟล์ที่ถูก inject มีส่วนเท่าใด (ดิบเทียบกับที่ inject, การตัดทอน รวมถึง overhead ของ schema เครื่องมือ) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## การจัดการเวลา

system prompt จะมี section **Current Date & Time** โดยเฉพาะเมื่อ
ทราบ timezone ของผู้ใช้ เพื่อให้ prompt cache คงที่ ตอนนี้มันจะรวมเฉพาะ
**time zone** (ไม่มีนาฬิกาแบบไดนามิกหรือรูปแบบเวลา)

ใช้ `session_status` เมื่อเอเจนต์ต้องการเวลาปัจจุบัน; การ์ดสถานะ
จะมีบรรทัด timestamp เครื่องมือเดียวกันนี้ยังสามารถตั้งค่า model
override ต่อ session ได้แบบไม่บังคับ (`model=default` ใช้เพื่อล้างค่า)

ตั้งค่าด้วย:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดู [Date & Time](/th/date-time) สำหรับรายละเอียดพฤติกรรมทั้งหมด

## Skills

เมื่อมี Skills ที่เข้าเกณฑ์ OpenClaw จะ inject **รายการ Skills ที่พร้อมใช้** แบบกะทัดรัด
(`formatSkillsForPrompt`) ซึ่งรวม **พาธไฟล์** ของแต่ละ skill พรอมป์ต์
จะสั่งให้โมเดลใช้ `read` เพื่อโหลด SKILL.md จากตำแหน่งที่ระบุไว้
(ใน workspace, managed หรือ bundled) หากไม่มี Skills ที่เข้าเกณฑ์ section
Skills จะถูกละไว้

เกณฑ์ความพร้อมใช้รวมถึง metadata gates ของ skill, การตรวจสอบสภาพแวดล้อม/การตั้งค่าของรันไทม์
และ allowlist ของ skill ที่มีผลบังคับใช้จริงของเอเจนต์ เมื่อมีการตั้งค่า `agents.defaults.skills` หรือ
`agents.list[].skills`

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

สิ่งนี้ทำให้ base prompt มีขนาดเล็ก ขณะเดียวกันก็ยังเปิดให้ใช้ skill แบบเจาะจงได้

งบประมาณของรายการ skills เป็นของ subsystem ของ skills:

- ค่าเริ่มต้นระดับโกลบอล: `skills.limits.maxSkillsPromptChars`
- การ override รายเอเจนต์: `agents.list[].skillsLimits.maxSkillsPromptChars`

excerpts ของรันไทม์แบบมีขอบเขตทั่วไปใช้พื้นผิวอีกแบบหนึ่ง:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

การแยกนี้ทำให้การกำหนดขนาดของ Skills แยกออกจากการกำหนดขนาดของการอ่าน/การ inject ในรันไทม์ เช่น
`memory_get`, ผลลัพธ์ของเครื่องมือแบบสด และการรีเฟรช AGENTS.md หลัง Compaction

## Documentation

เมื่อมีพร้อมใช้งาน system prompt จะมี section **Documentation** ที่ชี้ไปยัง
ไดเรกทอรีเอกสาร OpenClaw ในเครื่อง (ทั้ง `docs/` ใน repo workspace หรือเอกสารจาก npm
package ที่ bundled มา) และยังระบุมิเรอร์สาธารณะ, source repo, community Discord และ
ClawHub ([https://clawhub.ai](https://clawhub.ai)) สำหรับการค้นหา Skills พรอมป์ต์จะสั่งให้โมเดลปรึกษาเอกสารในเครื่องก่อน
สำหรับพฤติกรรม คำสั่ง การตั้งค่า หรือสถาปัตยกรรมของ OpenClaw และให้รัน
`openclaw status` เองเมื่อเป็นไปได้ (ให้ถามผู้ใช้เฉพาะเมื่อมันไม่มีสิทธิ์เข้าถึง)
