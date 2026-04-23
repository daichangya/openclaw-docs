---
read_when:
    - กำลังอธิบายการใช้โทเค็น ค่าใช้จ่าย หรือ context windows
    - กำลังดีบักการเติบโตของบริบทหรือพฤติกรรมของ Compaction
summary: วิธีที่ OpenClaw สร้างบริบทของ prompt และรายงานการใช้โทเค็น + ค่าใช้จ่าย
title: การใช้โทเค็นและต้นทุน
x-i18n:
    generated_at: "2026-04-23T05:56:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# การใช้โทเค็นและต้นทุน

OpenClaw ติดตาม **โทเค็น** ไม่ใช่อักขระ โทเค็นขึ้นอยู่กับโมเดล แต่โดยทั่วไป
โมเดลสไตล์ OpenAI ส่วนใหญ่เฉลี่ยอยู่ที่ประมาณ 4 อักขระต่อโทเค็นสำหรับข้อความภาษาอังกฤษ

## วิธีสร้าง system prompt

OpenClaw จะประกอบ system prompt ของตัวเองใหม่ในทุกการรัน โดยรวมสิ่งต่อไปนี้:

- รายการเครื่องมือ + คำอธิบายสั้นๆ
- รายการ Skills (เฉพาะ metadata; instructions จะถูกโหลดตามต้องการด้วย `read`)
  บล็อก skills แบบย่อถูกจำกัดด้วย `skills.limits.maxSkillsPromptChars`
  โดยสามารถ override เป็นรายเอเจนต์ได้ที่
  `agents.list[].skillsLimits.maxSkillsPromptChars`
- คำสั่งสำหรับ self-update
- Workspace + bootstrap files (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` เมื่อเป็นของใหม่ รวมถึง `MEMORY.md` เมื่อมี หรือ `memory.md` แบบตัวพิมพ์เล็กเป็น fallback) ไฟล์ขนาดใหญ่จะถูกตัดทอนด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และการ inject bootstrap รวมทั้งหมดถูกจำกัดด้วย `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) ไฟล์รายวัน `memory/*.md` ไม่ใช่ส่วนหนึ่งของ bootstrap prompt ปกติ; มันจะยังคงถูกเรียกใช้ตามต้องการผ่าน memory tools ในเทิร์นปกติ แต่ `/new` และ `/reset` แบบเดี่ยวสามารถ prepend บล็อก startup-context แบบใช้ครั้งเดียวด้วยหน่วยความจำรายวันที่เพิ่งผ่านมา สำหรับเทิร์นแรกนั้น prelude ตอนเริ่มต้นนี้ถูกควบคุมด้วย `agents.defaults.startupContext`
- เวลา (UTC + timezone ของผู้ใช้)
- reply tags + พฤติกรรมของ Heartbeat
- runtime metadata (host/OS/model/thinking)

ดูรายละเอียดทั้งหมดได้ใน [System Prompt](/th/concepts/system-prompt)

## อะไรบ้างที่นับรวมใน context window

ทุกอย่างที่โมเดลได้รับจะนับรวมในขีดจำกัด context:

- System prompt (ทุกส่วนที่ระบุไว้ด้านบน)
- ประวัติการสนทนา (ข้อความของผู้ใช้ + ผู้ช่วย)
- Tool calls และผลลัพธ์ของเครื่องมือ
- ไฟล์แนบ/transcripts (ภาพ เสียง ไฟล์)
- สรุปจาก Compaction และอาร์ติแฟกต์จากการ pruning
- provider wrappers หรือ safety headers (มองไม่เห็น แต่ยังคงถูกนับ)

พื้นผิวที่ใช้ runtime หนักบางส่วนมีขีดจำกัดแบบ explicit ของตัวเอง:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

การ override แบบรายเอเจนต์อยู่ภายใต้ `agents.list[].contextLimits` ตัวเลือกเหล่านี้
ใช้กับ runtime excerpts แบบมีขอบเขตและบล็อกที่ runtime เป็นเจ้าของซึ่งถูก inject เข้ามา
แยกจาก bootstrap limits, startup-context limits และ skills prompt limits

สำหรับภาพ OpenClaw จะ downscale payload ของภาพจาก transcript/tool ก่อนเรียกผู้ให้บริการ
ใช้ `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`) เพื่อปรับแต่งสิ่งนี้:

- ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาด payload
- ค่าที่สูงกว่าจะรักษารายละเอียดภาพไว้ได้มากกว่า สำหรับ screenshots ที่เน้น OCR/UI

สำหรับการแจกแจงแบบใช้งานจริง (ต่อไฟล์ที่ถูก inject, tools, skills และขนาด system prompt) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## วิธีดูการใช้โทเค็นปัจจุบัน

ใช้คำสั่งเหล่านี้ในแชต:

- `/status` → **การ์ดสถานะแบบอีโมจิ** ที่มีโมเดลของ session, การใช้ context,
  จำนวนโทเค็น input/output ของการตอบกลับล่าสุด และ **ต้นทุนโดยประมาณ** (เฉพาะ API key)
- `/usage off|tokens|full` → ต่อท้ายทุกคำตอบด้วย **usage footer รายการตอบกลับ**
  - คงอยู่ต่อ session (เก็บเป็น `responseUsage`)
  - auth แบบ OAuth **ซ่อนต้นทุน** (แสดงเฉพาะโทเค็น)
- `/usage cost` → แสดงสรุปต้นทุนในเครื่องจาก session logs ของ OpenClaw

พื้นผิวอื่นๆ:

- **TUI/Web TUI:** รองรับ `/status` + `/usage`
- **CLI:** `openclaw status --usage` และ `openclaw channels list` แสดง
  normalized provider quota windows (`X% left` ไม่ใช่ต้นทุนต่อการตอบกลับ)
  ปัจจุบันผู้ให้บริการที่รองรับ usage-window ได้แก่ Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai

พื้นผิว usage จะ normalize aliases ของฟิลด์แบบ native ของผู้ให้บริการก่อนแสดงผล
สำหรับทราฟฟิก Responses ของตระกูล OpenAI จะรวมทั้ง `input_tokens` /
`output_tokens` และ `prompt_tokens` / `completion_tokens` เพื่อให้ชื่อฟิลด์เฉพาะ transport
ไม่เปลี่ยน `/status`, `/usage` หรือ session summaries
Gemini CLI JSON usage ก็ถูก normalize เช่นกัน: ข้อความตอบกลับมาจาก `response` และ
`stats.cached` ถูกแมปไปที่ `cacheRead` โดยใช้ `stats.input_tokens - stats.cached`
เมื่อ CLI ไม่มีฟิลด์ `stats.input` แบบ explicit
สำหรับทราฟฟิก Responses แบบ native ของตระกูล OpenAI aliases ของ usage จาก WebSocket/SSE ก็ถูก normalize แบบเดียวกัน และยอดรวมจะ fallback ไปใช้ normalized input + output เมื่อ
`total_tokens` ไม่มีหรือเป็น `0`
เมื่อ snapshot ของ session ปัจจุบันมีข้อมูลน้อย `/status` และ `session_status` ยังสามารถ
กู้คืนตัวนับ token/cache และป้ายกำกับ active runtime model จาก transcript usage log ล่าสุดได้ ค่า live ที่ไม่เป็นศูนย์ซึ่งมีอยู่แล้วจะยังคงมีความสำคัญเหนือค่าที่ fallback มาจาก transcript และยอดรวมจาก transcript ที่โน้มเอียงไปทาง prompt ซึ่งมากกว่าสามารถชนะได้เมื่อยอดรวมที่เก็บไว้ไม่มีหรือมีน้อยกว่า
usage auth สำหรับ provider quota windows มาจาก hooks เฉพาะผู้ให้บริการเมื่อมี
หากไม่มี OpenClaw จะ fallback ไปจับคู่ OAuth/API-key credentials จาก auth profiles, env หรือ config
entries ใน assistant transcript จะ persist รูปแบบ usage แบบ normalized เดียวกัน รวมถึง
`usage.cost` เมื่อโมเดลที่ใช้งานมีการตั้งค่า pricing ไว้และผู้ให้บริการส่ง usage metadata กลับมา สิ่งนี้ทำให้ `/usage cost` และสถานะ session ที่อิง transcript มีแหล่งข้อมูลที่เสถียรแม้ live runtime state จะหายไปแล้ว

## การประเมินต้นทุน (เมื่อมีการแสดง)

ต้นทุนจะถูกประเมินจากคอนฟิก pricing ของโมเดลของคุณ:

```
models.providers.<provider>.models[].cost
```

ค่าเหล่านี้เป็น **USD ต่อ 1M tokens** สำหรับ `input`, `output`, `cacheRead` และ
`cacheWrite` หากไม่มี pricing OpenClaw จะแสดงเฉพาะโทเค็น OAuth tokens
จะไม่แสดงต้นทุนเป็นดอลลาร์เลย

## ผลกระทบของ cache TTL และ pruning

prompt caching ของผู้ให้บริการจะมีผลเฉพาะภายในหน้าต่าง TTL ของแคชเท่านั้น OpenClaw สามารถ
เปิดใช้ **cache-ttl pruning** แบบไม่บังคับ: มันจะ prune session เมื่อ cache TTL
หมดอายุ จากนั้นรีเซ็ตหน้าต่างแคช เพื่อให้คำขอต่อไปสามารถใช้บริบทที่เพิ่งถูกแคชใหม่ได้ซ้ำ แทนที่จะต้อง re-cache ประวัติทั้งหมด สิ่งนี้ช่วยให้ต้นทุน
cache write ต่ำลงเมื่อ session idle ผ่าน TTL ไปแล้ว

กำหนดค่าได้ใน [Gateway configuration](/th/gateway/configuration) และดู
รายละเอียดพฤติกรรมใน [Session pruning](/th/concepts/session-pruning)

Heartbeat สามารถทำให้แคช **อุ่นอยู่** ตลอดช่วง idle ได้ หาก cache TTL ของโมเดล
ของคุณคือ `1h`, การตั้ง heartbeat interval ให้ต่ำกว่านั้นเล็กน้อย (เช่น `55m`) สามารถช่วยหลีกเลี่ยง
การ re-cache prompt ทั้งหมด และลดต้นทุน cache write

ในการตั้งค่าแบบหลายเอเจนต์ คุณสามารถคงคอนฟิกโมเดลแบบใช้ร่วมกันหนึ่งชุด และปรับพฤติกรรมแคช
รายเอเจนต์ด้วย `agents.list[].params.cacheRetention`

สำหรับคู่มือทีละตัวเลือกแบบเต็ม ดู [Prompt Caching](/th/reference/prompt-caching)

สำหรับ pricing ของ Anthropic API, cache reads มีราคาถูกกว่า input
tokens อย่างมาก ขณะที่ cache writes จะถูกคิดราคาในตัวคูณที่สูงกว่า ดู pricing สำหรับ
prompt caching ของ Anthropic เพื่อดูอัตราล่าสุดและตัวคูณ TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### ตัวอย่าง: ทำให้แคช 1h อุ่นอยู่ด้วย Heartbeat

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

### ตัวอย่าง: ทราฟฟิกแบบผสมพร้อมกลยุทธ์แคชรายเอเจนต์

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # baseline เริ่มต้นสำหรับเอเจนต์ส่วนใหญ่
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # ทำให้แคชยาวอุ่นอยู่สำหรับเซสชันเชิงลึก
    - id: "alerts"
      params:
        cacheRetention: "none" # หลีกเลี่ยง cache writes สำหรับการแจ้งเตือนแบบ bursty
```

`agents.list[].params` จะ merge ทับบน `params` ของโมเดลที่ถูกเลือก ดังนั้นคุณสามารถ
override เฉพาะ `cacheRetention` และสืบทอดค่าเริ่มต้นอื่นของโมเดลต่อไปโดยไม่เปลี่ยนแปลง

### ตัวอย่าง: เปิดใช้ beta header สำหรับ Anthropic 1M context

หน้าต่าง context 1M ของ Anthropic ปัจจุบันยังอยู่หลัง beta gate OpenClaw สามารถ inject ค่า `anthropic-beta`
ที่จำเป็นได้เมื่อคุณเปิด `context1m` บนโมเดล Opus
หรือ Sonnet ที่รองรับ

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

สิ่งนี้จะถูกแมปไปยัง beta header `context-1m-2025-08-07` ของ Anthropic

จะมีผลเฉพาะเมื่อมีการตั้ง `context1m: true` บน model entry นั้นเท่านั้น

ข้อกำหนด: credential ต้องมีสิทธิ์ใช้ long-context หากไม่เป็นเช่นนั้น
Anthropic จะตอบกลับด้วย provider-side rate limit error สำหรับคำขอนั้น

หากคุณยืนยันตัวตนกับ Anthropic ด้วย OAuth/subscription tokens (`sk-ant-oat-*`),
OpenClaw จะข้าม beta header `context-1m-*` เพราะปัจจุบัน Anthropic
ปฏิเสธการใช้คู่นี้ด้วย HTTP 401

## เคล็ดลับสำหรับการลดแรงกดดันด้านโทเค็น

- ใช้ `/compact` เพื่อสรุป sessions ที่ยาว
- ตัดผลลัพธ์ของเครื่องมือขนาดใหญ่ใน workflows ของคุณ
- ลด `agents.defaults.imageMaxDimensionPx` สำหรับเซสชันที่ใช้ screenshots จำนวนมาก
- ทำให้คำอธิบายของ Skill สั้นไว้ (เพราะรายการ Skill ถูก inject เข้าไปใน prompt)
- เลือกใช้โมเดลที่เล็กกว่าสำหรับงานที่ verbose และ exploratory

ดู [Skills](/th/tools/skills) สำหรับสูตร overhead ของรายการ Skill แบบตรงตัว
