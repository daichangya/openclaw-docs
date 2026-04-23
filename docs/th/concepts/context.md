---
read_when:
    - คุณต้องการทำความเข้าใจว่า “บริบท” หมายถึงอะไรใน OpenClaw
    - คุณกำลังแก้ไขปัญหาว่าทำไมโมเดล “รู้” บางอย่าง (หรือลืมมันไป)
    - คุณต้องการลดโอเวอร์เฮดของบริบท (/context, /status, /compact)
summary: 'บริบท: สิ่งที่โมเดลเห็น วิธีประกอบขึ้น และวิธีตรวจสอบมัน'
title: บริบท
x-i18n:
    generated_at: "2026-04-23T05:29:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 477ccb1d9654968d0e904b6846b32b8c14db6b6c0d3d2ec2b7409639175629f9
    source_path: concepts/context.md
    workflow: 15
---

# บริบท

“บริบท” คือ **ทุกอย่างที่ OpenClaw ส่งให้โมเดลสำหรับการรันหนึ่งครั้ง** โดยถูกจำกัดด้วย **หน้าต่างบริบท** ของโมเดล (ขีดจำกัดโทเค็น)

โมเดลความคิดสำหรับผู้เริ่มต้น:

- **System prompt** (OpenClaw เป็นผู้สร้าง): กฎ เครื่องมือ รายการ Skills เวลา/รันไทม์ และไฟล์ workspace ที่ถูกฉีดเข้าไป
- **ประวัติการสนทนา**: ข้อความของคุณ + ข้อความของผู้ช่วยสำหรับเซสชันนี้
- **การเรียก/ผลลัพธ์ของเครื่องมือ + ไฟล์แนบ**: เอาต์พุตคำสั่ง การอ่านไฟล์ รูปภาพ/เสียง ฯลฯ

บริบท _ไม่ใช่สิ่งเดียวกัน_ กับ “หน่วยความจำ”: หน่วยความจำอาจเก็บไว้บนดิสก์และโหลดใหม่ภายหลังได้; บริบทคือสิ่งที่อยู่ภายในหน้าต่างปัจจุบันของโมเดล

## เริ่มต้นอย่างรวดเร็ว (ตรวจสอบบริบท)

- `/status` → มุมมองแบบเร็วว่า “หน้าต่างของฉันเต็มแค่ไหน?” + การตั้งค่าเซสชัน
- `/context list` → สิ่งที่ถูกฉีดเข้าไป + ขนาดโดยประมาณ (ต่อไฟล์ + รวมทั้งหมด)
- `/context detail` → การแยกย่อยเชิงลึก: ต่อไฟล์ ขนาด schema ของแต่ละเครื่องมือ ขนาดรายการของแต่ละ skill และขนาด system prompt
- `/usage tokens` → เพิ่มส่วนท้ายการใช้โทเค็นต่อการตอบกลับในการตอบกลับปกติ
- `/compact` → สรุปประวัติที่เก่ากว่าให้เป็นรายการแบบกะทัดรัดเพื่อคืนพื้นที่ในหน้าต่าง

ดูเพิ่มเติม: [Slash commands](/th/tools/slash-commands), [Token use & costs](/th/reference/token-use), [Compaction](/th/concepts/compaction)

## ตัวอย่างเอาต์พุต

ค่าจะแตกต่างกันไปตามโมเดล provider นโยบายเครื่องมือ และสิ่งที่อยู่ใน workspace ของคุณ

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

## สิ่งที่นับรวมในหน้าต่างบริบท

ทุกอย่างที่โมเดลได้รับจะนับรวมทั้งหมด รวมถึง:

- System prompt (ทุกส่วน)
- ประวัติการสนทนา
- การเรียกเครื่องมือ + ผลลัพธ์ของเครื่องมือ
- ไฟล์แนบ/ทรานสคริปต์ (รูปภาพ/เสียง/ไฟล์)
- สรุป Compaction และอาร์ติแฟกต์จากการ pruning
- “wrapper” หรือ header ที่ซ่อนอยู่ของ provider (มองไม่เห็น แต่ยังถูกนับ)

## วิธีที่ OpenClaw ประกอบ system prompt

system prompt เป็นสิ่งที่ **OpenClaw เป็นเจ้าของ** และสร้างใหม่ทุกครั้งที่รัน โดยประกอบด้วย:

- รายการเครื่องมือ + คำอธิบายสั้น ๆ
- รายการ Skills (เฉพาะ metadata; ดูด้านล่าง)
- ตำแหน่งของ workspace
- เวลา (UTC + เวลาผู้ใช้ที่แปลงแล้วหากมีการกำหนดค่า)
- metadata ของรันไทม์ (host/OS/model/thinking)
- ไฟล์ bootstrap ของ workspace ที่ถูกฉีดภายใต้ **Project Context**

รายละเอียดทั้งหมด: [System Prompt](/th/concepts/system-prompt)

## ไฟล์ workspace ที่ถูกฉีด (Project Context)

โดยค่าเริ่มต้น OpenClaw จะฉีดชุดไฟล์ของ workspace แบบคงที่ (หากมี):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (เฉพาะครั้งแรกที่รัน)

ไฟล์ขนาดใหญ่จะถูกตัดต่อไฟล์ตาม `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น `12000` อักขระ) OpenClaw ยังบังคับเพดานรวมของการฉีด bootstrap ข้ามทุกไฟล์ด้วย `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น `60000` อักขระ) `/context` จะแสดงขนาด **raw เทียบกับ injected** และแสดงว่ามีการตัดหรือไม่

เมื่อมีการตัด รันไทม์สามารถฉีดบล็อกคำเตือนภายในพรอมป์ภายใต้ Project Context ได้ กำหนดค่านี้ด้วย `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; ค่าเริ่มต้น `once`)

## Skills: ที่ถูกฉีดเทียบกับที่โหลดตามต้องการ

system prompt จะมี **รายการ Skills** แบบกะทัดรัด (ชื่อ + คำอธิบาย + ตำแหน่ง) ซึ่งมีโอเวอร์เฮดจริง

คำสั่งของ skill จะ _ไม่_ ถูกรวมไว้โดยค่าเริ่มต้น โมเดลถูกคาดหมายให้ `read` ไฟล์ `SKILL.md` ของ skill **เฉพาะเมื่อจำเป็นเท่านั้น**

## Tools: มีต้นทุนอยู่สองแบบ

Tools ส่งผลต่อบริบทในสองทาง:

1. **ข้อความรายการเครื่องมือ** ใน system prompt (สิ่งที่คุณเห็นใน “Tooling”)
2. **schema ของเครื่องมือ** (JSON) สิ่งเหล่านี้ถูกส่งให้โมเดลเพื่อให้เรียกใช้เครื่องมือได้ โดยนับรวมในบริบทแม้ว่าคุณจะไม่เห็นเป็นข้อความธรรมดา

`/context detail` จะแยกย่อย schema ของเครื่องมือที่ใหญ่ที่สุด เพื่อให้คุณเห็นว่าอะไรครองสัดส่วนมากที่สุด

## คำสั่ง directive และ "inline shortcuts"

Slash commands ถูกจัดการโดย Gateway โดยมีพฤติกรรมต่างกันเล็กน้อย:

- **คำสั่งแบบสแตนด์อโลน**: ข้อความที่มีเพียง `/...` จะถูกรันเป็นคำสั่ง
- **Directive**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` จะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความ
  - ข้อความที่มีแต่ directive จะคงค่าการตั้งค่าเซสชันไว้
  - directive แบบอินไลน์ในข้อความปกติจะทำหน้าที่เป็นคำใบ้ต่อข้อความนั้น
- **Inline shortcuts** (เฉพาะผู้ส่งที่อยู่ใน allowlist): โทเค็น `/...` บางตัวในข้อความปกติสามารถรันได้ทันที (ตัวอย่าง: “hey /status”) และจะถูกตัดออกก่อนที่โมเดลจะเห็นข้อความที่เหลือ

รายละเอียด: [Slash commands](/th/tools/slash-commands)

## เซสชัน Compaction และ pruning (สิ่งที่คงอยู่)

สิ่งที่จะคงอยู่ข้ามข้อความขึ้นอยู่กับกลไกที่ใช้:

- **ประวัติปกติ** จะคงอยู่ในทรานสคริปต์ของเซสชันจนกว่าจะถูก compact/prune ตามนโยบาย
- **Compaction** จะคงสรุปไว้ในทรานสคริปต์และเก็บข้อความล่าสุดไว้เหมือนเดิม
- **Pruning** จะลบผลลัพธ์เครื่องมือเก่าออกจากพรอมป์ _ในหน่วยความจำ_ สำหรับการรัน แต่จะไม่เขียนทรานสคริปต์ใหม่

เอกสาร: [Session](/th/concepts/session), [Compaction](/th/concepts/compaction), [Session pruning](/th/concepts/session-pruning)

โดยค่าเริ่มต้น OpenClaw ใช้ context engine แบบ built-in `legacy` สำหรับการประกอบและ
Compaction หากคุณติดตั้ง Plugin ที่ให้ `kind: "context-engine"` และ
เลือกด้วย `plugins.slots.contextEngine`, OpenClaw จะมอบหมายการประกอบบริบท
`/compact` และ hook วงจรชีวิตบริบทของ subagent ที่เกี่ยวข้องให้กับ
engine นั้นแทน `ownsCompaction: false` จะไม่ fallback กลับไปยัง legacy
engine โดยอัตโนมัติ; engine ที่ใช้งานอยู่ยังคงต้องติดตั้ง `compact()` ให้ถูกต้อง ดู
[Context Engine](/th/concepts/context-engine) สำหรับอินเทอร์เฟซแบบ pluggable
hook ของวงจรชีวิตทั้งหมด และการกำหนดค่า

## สิ่งที่ `/context` รายงานจริง ๆ

`/context` จะเลือกใช้รายงาน system prompt **ที่สร้างจากการรันจริง** ล่าสุดก่อนเมื่อมี:

- `System prompt (run)` = เก็บมาจากการรันแบบ embedded ล่าสุด (รองรับเครื่องมือ) และคงไว้ใน session store
- `System prompt (estimate)` = คำนวณแบบ on the fly เมื่อยังไม่มีรายงานจากการรัน (หรือเมื่อรันผ่าน backend ของ CLI ที่ไม่สร้างรายงานนี้)

ไม่ว่าจะกรณีใด มันจะรายงานขนาดและผู้มีส่วนร่วมหลัก; มันจะ **ไม่** dump system prompt หรือ schema ของเครื่องมือทั้งหมด

## ที่เกี่ยวข้อง

- [Context Engine](/th/concepts/context-engine) — การฉีดบริบทแบบกำหนดเองผ่าน plugins
- [Compaction](/th/concepts/compaction) — การสรุปบทสนทนายาว
- [System Prompt](/th/concepts/system-prompt) — วิธีประกอบ system prompt
- [Agent Loop](/th/concepts/agent-loop) — วงจรการทำงานของเอเจนต์ทั้งหมด
