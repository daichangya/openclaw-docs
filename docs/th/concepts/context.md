---
read_when:
    - คุณต้องการเข้าใจว่า “บริบท” หมายถึงอะไรใน OpenClaw
    - คุณกำลังแก้ไขปัญหาว่าทำไมโมเดลถึง “รู้” บางอย่าง (หรือลืมมันไป)
    - คุณต้องการลด overhead ของบริบท (`/context`, `/status`, `/compact`)
summary: 'บริบท: สิ่งที่โมเดลเห็น วิธีสร้างบริบท และวิธีตรวจสอบมัน'
title: บริบท
x-i18n:
    generated_at: "2026-04-24T09:05:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

“บริบท” คือ **ทุกอย่างที่ OpenClaw ส่งให้โมเดลสำหรับการรันหนึ่งครั้ง** โดยถูกจำกัดด้วย **context window** ของโมเดล (ขีดจำกัดโทเค็น)

แบบจำลองทางความคิดสำหรับผู้เริ่มต้น:

- **System prompt** (สร้างโดย OpenClaw): กฎ เครื่องมือ รายการ Skills เวลา/รันไทม์ และไฟล์พื้นที่ทำงานที่ถูกฉีดเข้าไป
- **ประวัติการสนทนา**: ข้อความของคุณ + ข้อความของผู้ช่วยสำหรับเซสชันนี้
- **การเรียก/ผลลัพธ์ของเครื่องมือ + ไฟล์แนบ**: เอาต์พุตของคำสั่ง การอ่านไฟล์ รูปภาพ/เสียง เป็นต้น

บริบท _ไม่ใช่สิ่งเดียวกัน_ กับ “ความจำ”: ความจำอาจถูกเก็บไว้บนดิสก์และโหลดกลับมาใหม่ภายหลังได้; บริบทคือสิ่งที่อยู่ภายในหน้าต่างปัจจุบันของโมเดล

## เริ่มต้นอย่างรวดเร็ว (ตรวจสอบบริบท)

- `/status` → มุมมองแบบรวดเร็วว่า “หน้าต่างของฉันเต็มแค่ไหนแล้ว?” + การตั้งค่าเซสชัน
- `/context list` → สิ่งที่ถูกฉีดเข้าไป + ขนาดคร่าว ๆ (ต่อไฟล์ + รวมทั้งหมด)
- `/context detail` → การแจกแจงที่ลึกขึ้น: ขนาดต่อไฟล์ ขนาด schema ของเครื่องมือต่อรายการ ขนาดรายการ Skill ต่อรายการ และขนาด system prompt
- `/usage tokens` → เพิ่มส่วนท้ายการใช้โทเค็นต่อคำตอบตามปกติ
- `/compact` → สรุปประวัติที่เก่ากว่าให้เป็นรายการแบบกะทัดรัดเพื่อคืนพื้นที่หน้าต่าง

ดูเพิ่มเติม: [Slash commands](/th/tools/slash-commands), [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use), [Compaction](/th/concepts/compaction)

## ตัวอย่างเอาต์พุต

ค่าอาจแตกต่างกันไปตามโมเดล ผู้ให้บริการ นโยบายเครื่องมือ และสิ่งที่อยู่ในพื้นที่ทำงานของคุณ

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## อะไรบ้างที่นับรวมใน context window

ทุกอย่างที่โมเดลได้รับจะถูกนับรวม รวมถึง:

- System prompt (ทุกส่วน)
- ประวัติการสนทนา
- การเรียกเครื่องมือ + ผลลัพธ์ของเครื่องมือ
- ไฟล์แนบ/ทรานสคริปต์ (รูปภาพ/เสียง/ไฟล์)
- สรุปจาก Compaction และสิ่งที่เกิดจากการ pruning
- “wrapper” หรือ header แฝงของผู้ให้บริการ (มองไม่เห็น แต่ยังนับรวม)

## OpenClaw สร้าง system prompt อย่างไร

System prompt เป็นสิ่งที่ **OpenClaw เป็นเจ้าของ** และถูกสร้างใหม่ทุกการรัน โดยรวมถึง:

- รายการเครื่องมือ + คำอธิบายสั้น ๆ
- รายการ Skills (เฉพาะ metadata; ดูด้านล่าง)
- ตำแหน่งของพื้นที่ทำงาน
- เวลา (UTC + เวลา local ของผู้ใช้ที่แปลงแล้วหากกำหนดค่าไว้)
- metadata ของ runtime (host/OS/model/thinking)
- ไฟล์ bootstrap ของพื้นที่ทำงานที่ถูกฉีดเข้าไปภายใต้ **Project Context**

การแจกแจงแบบเต็ม: [System Prompt](/th/concepts/system-prompt)

## ไฟล์พื้นที่ทำงานที่ถูกฉีดเข้าไป (Project Context)

โดยค่าเริ่มต้น OpenClaw จะฉีดไฟล์พื้นที่ทำงานชุดคงที่ (ถ้ามีอยู่):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะการรันครั้งแรก)

ไฟล์ขนาดใหญ่จะถูกตัดต่อไฟล์ตาม `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น `12000` chars) OpenClaw ยังบังคับเพดานรวมของการฉีด bootstrap ข้ามทุกไฟล์ด้วย `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น `60000` chars) `/context` จะแสดงขนาด **raw เทียบกับ injected** และจะแสดงว่ามีการตัดหรือไม่

เมื่อมีการตัด รันไทม์สามารถฉีดบล็อกคำเตือนในพรอมป์ภายใต้ Project Context ได้ กำหนดค่านี้ด้วย `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; ค่าเริ่มต้น `once`)

## Skills: ฉีดเข้าไปเทียบกับโหลดตามต้องการ

System prompt จะรวม **รายการ Skills** แบบกะทัดรัด (ชื่อ + คำอธิบาย + ตำแหน่ง) รายการนี้มี overhead จริง

คำสั่งของ Skill _จะไม่_ ถูกรวมโดยค่าเริ่มต้น โมเดลถูกคาดหวังให้ใช้ `read` กับ `SKILL.md` ของ Skill **เมื่อจำเป็นเท่านั้น**

## Tools: มีค่าใช้จ่ายสองแบบ

เครื่องมือมีผลต่อบริบทสองทาง:

1. **ข้อความรายการเครื่องมือ** ใน system prompt (สิ่งที่คุณเห็นเป็น “Tooling”)
2. **schema ของเครื่องมือ** (JSON) สิ่งเหล่านี้ถูกส่งให้โมเดลเพื่อให้สามารถเรียกใช้เครื่องมือได้ พวกมันนับรวมในบริบทแม้ว่าคุณจะไม่เห็นเป็นข้อความล้วน

`/context detail` จะแจกแจง schema ของเครื่องมือที่ใหญ่ที่สุด เพื่อให้คุณเห็นว่าส่วนไหนครองพื้นที่มากที่สุด

## คำสั่ง, directive และ "inline shortcut"

Slash command ถูกจัดการโดย Gateway โดยมีพฤติกรรมหลายแบบ:

- **คำสั่งเดี่ยว**: ข้อความที่มีเพียง `/...` จะถูกรันเป็นคำสั่ง
- **Directive**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` จะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความ
  - ข้อความที่มีแต่ directive จะคงการตั้งค่าเซสชันไว้
  - directive แบบ inline ในข้อความปกติจะทำหน้าที่เป็น hint ต่อข้อความ
- **Inline shortcut** (เฉพาะผู้ส่งที่อยู่ใน allowlist): โทเค็น `/...` บางชนิดภายในข้อความปกติสามารถรันได้ทันที (ตัวอย่าง: “hey /status”) และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ

รายละเอียด: [Slash commands](/th/tools/slash-commands)

## เซสชัน, Compaction และ pruning (อะไรที่คงอยู่)

สิ่งที่คงอยู่ข้ามข้อความขึ้นอยู่กับกลไก:

- **ประวัติปกติ** จะคงอยู่ใน transcript ของเซสชันจนกว่าจะถูก compact/prune ตามนโยบาย
- **Compaction** จะคงสรุปไว้ใน transcript และเก็บข้อความล่าสุดไว้เหมือนเดิม
- **Pruning** จะทิ้งผลลัพธ์เครื่องมือเก่าออกจากพรอมป์ _ในหน่วยความจำ_ เพื่อคืนพื้นที่ context window แต่จะไม่เขียนทับ transcript ของเซสชัน — ประวัติเต็มยังตรวจสอบได้บนดิสก์

เอกสาร: [Session](/th/concepts/session), [Compaction](/th/concepts/compaction), [Session pruning](/th/concepts/session-pruning)

โดยค่าเริ่มต้น OpenClaw จะใช้ context engine แบบ `legacy` ที่มีมาในตัวสำหรับการประกอบและ
Compaction หากคุณติดตั้ง Plugin ที่ให้ `kind: "context-engine"` และ
เลือกมันด้วย `plugins.slots.contextEngine`, OpenClaw จะมอบหมายการประกอบบริบท
`/compact` และ hook วงจรชีวิตบริบทของ subagent ที่เกี่ยวข้อง ให้กับ
engine นั้นแทน `ownsCompaction: false` จะไม่ auto-fallback กลับไปใช้
engine แบบ legacy; engine ที่ใช้งานอยู่ยังคงต้องติดตั้ง `compact()` ให้ถูกต้อง
ดู [Context Engine](/th/concepts/context-engine) สำหรับอินเทอร์เฟซแบบเสียบปลั๊ก
hook วงจรชีวิต และการกำหนดค่าแบบเต็ม

## สิ่งที่ `/context` รายงานจริง ๆ

`/context` จะเลือกใช้รายงาน system prompt แบบ **สร้างจากการรันล่าสุด** หากมี:

- `System prompt (run)` = ดึงมาจากการรันแบบ embedded ครั้งล่าสุด (ที่รองรับเครื่องมือ) และคงไว้ใน session store
- `System prompt (estimate)` = คำนวณแบบทันทีเมื่อไม่มีรายงานจากการรัน (หรือเมื่อรันผ่าน backend ของ CLI ที่ไม่สร้างรายงานนี้)

ไม่ว่ากรณีใด มันจะรายงานขนาดและผู้มีส่วนร่วมหลัก; มันจะ **ไม่** dump system prompt หรือ schema ของเครื่องมือทั้งหมด

## ที่เกี่ยวข้อง

- [Context Engine](/th/concepts/context-engine) — การฉีดบริบทแบบกำหนดเองผ่าน Plugin
- [Compaction](/th/concepts/compaction) — การสรุปบทสนทนาที่ยาว
- [System Prompt](/th/concepts/system-prompt) — วิธีสร้าง system prompt
- [Agent Loop](/th/concepts/agent-loop) — วงจรการทำงานเต็มรูปแบบของเอเจนต์
