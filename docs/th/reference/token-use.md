---
read_when:
    - อธิบายการใช้โทเค็น ต้นทุน หรือขนาดหน้าต่างบริบท
    - ดีบักการเพิ่มขึ้นของบริบทหรือพฤติกรรมของ Compaction
summary: วิธีที่ OpenClaw สร้างคอนเท็กซ์ของ prompt และรายงานการใช้โทเคน + ค่าใช้จ่าย
title: การใช้โทเคนและค่าใช้จ่าย
x-i18n:
    generated_at: "2026-04-24T09:33:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# การใช้โทเค็นและต้นทุน

OpenClaw ติดตาม **โทเค็น** ไม่ใช่อักขระ โทเค็นขึ้นอยู่กับแต่ละโมเดล แต่โมเดลสไตล์ OpenAI ส่วนใหญ่มักเฉลี่ยประมาณ 4 อักขระต่อ 1 โทเค็นสำหรับข้อความภาษาอังกฤษ

## วิธีสร้าง system prompt

OpenClaw จะประกอบ system prompt ของตัวเองทุกครั้งที่รัน โดยประกอบด้วย:

- รายการเครื่องมือ + คำอธิบายสั้นๆ
- รายการ Skills (เฉพาะเมทาดาทา; คำสั่งจะถูกโหลดตามต้องการด้วย `read`)
  บล็อก skills แบบย่อถูกจำกัดด้วย `skills.limits.maxSkillsPromptChars`
  และสามารถ override ต่อเอเจนต์ได้ที่
  `agents.list[].skillsLimits.maxSkillsPromptChars`
- คำสั่งการอัปเดตตัวเอง
- ไฟล์ workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` เมื่อเป็นไฟล์ใหม่ และ `MEMORY.md` เมื่อมีอยู่) `memory.md` ตัวพิมพ์เล็กที่รากจะไม่ถูก inject; มันเป็นอินพุตสำหรับการซ่อมแซมแบบเดิมของ `openclaw doctor --fix` เมื่อจับคู่กับ `MEMORY.md` ไฟล์ขนาดใหญ่จะถูกตัดทอนด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และการ inject bootstrap ทั้งหมดถูกจำกัดด้วย `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) ไฟล์รายวัน `memory/*.md` ไม่ได้เป็นส่วนหนึ่งของ bootstrap prompt ปกติ; ไฟล์เหล่านี้ยังคงถูกเรียกใช้ตามต้องการผ่าน memory tools ในเทิร์นปกติ แต่ `/new` และ `/reset` แบบเปล่าอาจเติมบล็อก startup-context แบบครั้งเดียวพร้อมหน่วยความจำรายวันล่าสุดสำหรับเทิร์นแรกได้ prelude ตอนเริ่มต้นนั้นควบคุมด้วย `agents.defaults.startupContext`
- เวลา (UTC + เขตเวลาของผู้ใช้)
- แท็กคำตอบ + พฤติกรรม Heartbeat
- เมทาดาทารันไทม์ (โฮสต์/OS/โมเดล/thinking)

ดูรายละเอียดแบบเต็มได้ที่ [System Prompt](/th/concepts/system-prompt)

## อะไรบ้างที่นับใน context window

ทุกอย่างที่โมเดลได้รับจะนับรวมในขีดจำกัด context:

- System prompt (ทุกส่วนที่ระบุไว้ข้างต้น)
- ประวัติการสนทนา (ข้อความผู้ใช้ + ผู้ช่วย)
- การเรียกใช้เครื่องมือและผลลัพธ์ของเครื่องมือ
- ไฟล์แนบ/ทรานสคริปต์ (รูปภาพ เสียง ไฟล์)
- สรุปจาก Compaction และอาร์ติแฟกต์จากการตัดทอน
- ตัวครอบของ provider หรือส่วนหัวด้านความปลอดภัย (มองไม่เห็น แต่ยังถูกนับ)

พื้นผิวรันไทม์ที่ใช้ข้อมูลมากบางส่วนมีเพดานที่กำหนดไว้อย่างชัดเจนของตัวเอง:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

การ override ต่อเอเจนต์อยู่ภายใต้ `agents.list[].contextLimits` พารามิเตอร์เหล่านี้ใช้สำหรับข้อความตัดตอนของรันไทม์ที่มีขอบเขต และบล็อกที่รันไทม์เป็นเจ้าของซึ่งถูก inject เข้าไป โดยแยกจาก bootstrap limits, startup-context limits และ skills prompt limits

สำหรับรูปภาพ OpenClaw จะลดขนาด payload รูปภาพจากทรานสคริปต์/เครื่องมือก่อนเรียก provider
ใช้ `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`) เพื่อปรับค่า:

- ค่าที่ต่ำลงมักช่วยลดการใช้ vision token และขนาด payload
- ค่าที่สูงขึ้นจะคงรายละเอียดภาพได้มากขึ้นสำหรับภาพหน้าจอที่เน้น OCR/UI

สำหรับการแจกแจงเชิงปฏิบัติ (แยกตามไฟล์ที่ถูก inject, เครื่องมือ, Skills และขนาด system prompt) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## วิธีดูการใช้โทเค็นปัจจุบัน

ใช้คำสั่งเหล่านี้ในแชต:

- `/status` → **การ์ดสถานะที่มีอีโมจิจำนวนมาก** พร้อมโมเดลของเซสชัน การใช้ context โทเค็น input/output ของคำตอบล่าสุด และ **ต้นทุนโดยประมาณ** (เฉพาะ API key)
- `/usage off|tokens|full` → เพิ่ม **ส่วนท้ายการใช้งานต่อคำตอบ** ให้กับทุกคำตอบ
  - คงค่าไว้ต่อเซสชัน (เก็บเป็น `responseUsage`)
  - การยืนยันตัวตนแบบ OAuth **ซ่อนต้นทุน** (แสดงเฉพาะโทเค็น)
- `/usage cost` → แสดงสรุปต้นทุนในเครื่องจาก session logs ของ OpenClaw

พื้นผิวอื่นๆ:

- **TUI/Web TUI:** รองรับ `/status` + `/usage`
- **CLI:** `openclaw status --usage` และ `openclaw channels list` จะแสดงหน้าต่างโควตาของ provider ที่ทำให้เป็นมาตรฐานแล้ว (`เหลือ X%` ไม่ใช่ต้นทุนต่อคำตอบ)
  provider ของหน้าต่างการใช้งานที่รองรับในปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi และ z.ai

พื้นผิวการใช้งานจะทำให้ alias ฟิลด์ native ของ provider ที่ใช้ร่วมกันเป็นมาตรฐานก่อนแสดงผล
สำหรับทราฟฟิก OpenAI-family Responses รวมถึงทั้ง `input_tokens` /
`output_tokens` และ `prompt_tokens` / `completion_tokens` ดังนั้นชื่อฟิลด์เฉพาะของ transport จะไม่เปลี่ยนผลลัพธ์ของ `/status`, `/usage` หรือสรุปเซสชัน
การใช้งาน JSON ของ Gemini CLI ก็ถูกทำให้เป็นมาตรฐานเช่นกัน: ข้อความคำตอบมาจาก `response` และ
`stats.cached` จะถูกแมปเป็น `cacheRead` โดยใช้ `stats.input_tokens - stats.cached`
เมื่อ CLI ไม่ได้ส่งฟิลด์ `stats.input` แบบชัดเจนมา
สำหรับทราฟฟิก OpenAI-family Responses แบบ native, alias การใช้งานของ WebSocket/SSE ก็ถูกทำให้เป็นมาตรฐานแบบเดียวกัน และค่ารวมจะ fallback ไปใช้ input + output ที่ผ่านการทำให้เป็นมาตรฐานแล้วเมื่อ
`total_tokens` ไม่มีหรือเป็น `0`
เมื่อ snapshot ของเซสชันปัจจุบันมีข้อมูลน้อย `/status` และ `session_status` ยังสามารถ
กู้คืนตัวนับ token/cache และป้ายชื่อโมเดลรันไทม์ที่ใช้งานอยู่จาก usage log ล่าสุดของทรานสคริปต์ได้
ค่าที่ไม่เป็นศูนย์จากสถานะ live ที่มีอยู่เดิมยังคงมีลำดับความสำคัญเหนือค่าที่ fallback จากทรานสคริปต์ และ
ค่ารวมจากทรานสคริปต์ที่เน้น prompt และมีขนาดใหญ่กว่าสามารถชนะได้เมื่อค่ารวมที่เก็บไว้ไม่มีหรือเล็กกว่า
การยืนยันตัวตนสำหรับหน้าต่างโควตาของ provider มาจาก hook เฉพาะ provider เมื่อมีให้ใช้; มิฉะนั้น OpenClaw จะ fallback ไปจับคู่ข้อมูลรับรอง OAuth/API-key
จาก auth profiles, env หรือ config
รายการทรานสคริปต์ของผู้ช่วยจะคงรูปแบบ usage ที่ผ่านการทำให้เป็นมาตรฐานแบบเดียวกันไว้ รวมถึง
`usage.cost` เมื่อโมเดลที่ใช้งานอยู่มีการตั้งค่า pricing และ provider
ส่งเมทาดาทาการใช้งานกลับมา สิ่งนี้ทำให้ `/usage cost` และสถานะเซสชันที่อิงจากทรานสคริปต์มีแหล่งข้อมูลที่เสถียร แม้สถานะรันไทม์ live จะหายไปแล้วก็ตาม

## การประเมินต้นทุน (เมื่อมีการแสดงผล)

ต้นทุนจะถูกประเมินจากการตั้งค่า pricing ของโมเดลคุณ:

```
models.providers.<provider>.models[].cost
```

นี่คือ **USD ต่อ 1M tokens** สำหรับ `input`, `output`, `cacheRead` และ
`cacheWrite` หากไม่มี pricing OpenClaw จะแสดงเฉพาะโทเค็น โทเค็น OAuth
จะไม่แสดงต้นทุนเป็นดอลลาร์

## ผลกระทบของ Cache TTL และการตัดทอน

การทำ prompt caching ของ provider จะมีผลเฉพาะภายในหน้าต่าง Cache TTL เท่านั้น OpenClaw สามารถ
รัน **cache-ttl pruning** แบบเลือกได้: ระบบจะตัดทอนเซสชันเมื่อ Cache TTL
หมดอายุ จากนั้นรีเซ็ตหน้าต่างแคชเพื่อให้คำขอถัดไปสามารถนำ context ที่ถูกแคชใหม่ล่าสุดกลับมาใช้ซ้ำได้ แทนที่จะต้องแคชประวัติทั้งหมดใหม่ วิธีนี้ช่วยให้ต้นทุนการเขียนแคชต่ำลงเมื่อเซสชันว่างเกิน TTL

กำหนดค่าได้ใน [Gateway configuration](/th/gateway/configuration) และดูรายละเอียดพฤติกรรมได้ใน [Session pruning](/th/concepts/session-pruning)

Heartbeat สามารถช่วยให้แคช **อุ่นอยู่เสมอ** ตลอดช่วงเวลาว่างได้ หาก Cache TTL ของโมเดลคุณ
เป็น `1h` การตั้งช่วงเวลา Heartbeat ให้ต่ำกว่านั้นเล็กน้อย (เช่น `55m`) อาจช่วยหลีกเลี่ยงการแคชพรอมป์ทั้งหมดใหม่ ซึ่งลดต้นทุนการเขียนแคชได้

ในระบบหลายเอเจนต์ คุณสามารถใช้การตั้งค่าโมเดลที่ใช้ร่วมกันหนึ่งชุด และปรับพฤติกรรมแคช
แยกตามเอเจนต์ด้วย `agents.list[].params.cacheRetention`

สำหรับคู่มือแบบละเอียดทีละพารามิเตอร์ ดู [Prompt Caching](/th/reference/prompt-caching)

สำหรับราคา Anthropic API การอ่านแคชมีราคาถูกกว่า input
tokens อย่างมาก ในขณะที่การเขียนแคชจะถูกคิดเงินด้วยตัวคูณที่สูงกว่า ดูราคา prompt caching ของ Anthropic สำหรับอัตราล่าสุดและตัวคูณ TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### ตัวอย่าง: คงแคช 1h ให้อุ่นด้วย Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### ตัวอย่าง: ทราฟฟิกแบบผสมพร้อมกลยุทธ์แคชต่อเอเจนต์

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # ค่าพื้นฐานเริ่มต้นสำหรับเอเจนต์ส่วนใหญ่
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # คงแคชแบบ long ให้อุ่นสำหรับเซสชันเชิงลึก
    - id: "alerts"
      params:
        cacheRetention: "none" # หลีกเลี่ยงการเขียนแคชสำหรับการแจ้งเตือนแบบเป็นช่วง
```

`agents.list[].params` จะ merge ทับบน `params` ของโมเดลที่เลือก ดังนั้นคุณสามารถ
override เฉพาะ `cacheRetention` และสืบทอดค่าเริ่มต้นอื่นๆ ของโมเดลโดยไม่เปลี่ยนแปลง

### ตัวอย่าง: เปิดใช้ beta header สำหรับ Anthropic 1M context

context window ขนาด 1M ของ Anthropic ปัจจุบันยังถูกจำกัดด้วย beta OpenClaw สามารถ inject ค่า `anthropic-beta` ที่ต้องใช้เมื่อคุณเปิด `context1m` บนโมเดล Opus
หรือ Sonnet ที่รองรับ

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

ค่านี้จะถูกแมปไปยัง beta header ของ Anthropic คือ `context-1m-2025-08-07`

จะมีผลก็ต่อเมื่อมีการตั้งค่า `context1m: true` บนรายการโมเดลนั้น

ข้อกำหนด: credential ต้องมีสิทธิ์ใช้งาน long-context หากไม่เป็นเช่นนั้น
Anthropic จะตอบกลับด้วยข้อผิดพลาด rate limit ฝั่ง provider สำหรับคำขอนั้น

หากคุณยืนยันตัวตนกับ Anthropic โดยใช้โทเค็น OAuth/subscription (`sk-ant-oat-*`)
OpenClaw จะข้าม beta header `context-1m-*` เพราะปัจจุบัน Anthropic
ปฏิเสธการใช้งานชุดนั้นด้วย HTTP 401

## เคล็ดลับเพื่อลดแรงกดดันด้านโทเค็น

- ใช้ `/compact` เพื่อสรุปเซสชันที่ยาว
- ตัดผลลัพธ์เครื่องมือขนาดใหญ่ออกใน workflow ของคุณ
- ลด `agents.defaults.imageMaxDimensionPx` สำหรับเซสชันที่มีภาพหน้าจอจำนวนมาก
- ทำให้คำอธิบาย skill สั้น (รายการ skill ถูก inject เข้าไปในพรอมป์)
- เลือกใช้โมเดลขนาดเล็กกว่าสำหรับงานที่อธิบายเยอะและสำรวจไปเรื่อยๆ

ดู [Skills](/th/tools/skills) สำหรับสูตร overhead ของรายการ skill แบบละเอียด

## ที่เกี่ยวข้อง

- [API usage and costs](/th/reference/api-usage-costs)
- [Prompt caching](/th/reference/prompt-caching)
- [Usage tracking](/th/concepts/usage-tracking)
