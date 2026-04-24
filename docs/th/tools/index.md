---
read_when:
    - คุณต้องการเข้าใจว่า OpenClaw มีเครื่องมืออะไรให้บ้าง
    - คุณต้องกำหนดค่า อนุญาต หรือปฏิเสธเครื่องมือ
    - คุณกำลังตัดสินใจเลือกระหว่างเครื่องมือในตัว Skills และ Plugin
summary: 'ภาพรวมเครื่องมือและ Plugin ของ OpenClaw: เอเจนต์ทำอะไรได้บ้าง และจะขยายความสามารถอย่างไร'
title: เครื่องมือและ Plugin
x-i18n:
    generated_at: "2026-04-24T09:37:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

ทุกสิ่งที่เอเจนต์ทำได้นอกเหนือจากการสร้างข้อความเกิดขึ้นผ่าน **เครื่องมือ**
เครื่องมือคือวิธีที่เอเจนต์ใช้ในการอ่านไฟล์ รันคำสั่ง ท่องเว็บ ส่ง
ข้อความ และโต้ตอบกับอุปกรณ์

## เครื่องมือ, Skills และ Plugin

OpenClaw มีสามชั้นที่ทำงานร่วมกัน:

<Steps>
  <Step title="เครื่องมือคือสิ่งที่เอเจนต์เรียกใช้">
    เครื่องมือคือฟังก์ชันแบบมีชนิดที่เอเจนต์สามารถเรียกใช้ได้ (เช่น `exec`, `browser`,
    `web_search`, `message`) OpenClaw มาพร้อมชุด **เครื่องมือในตัว** และ
    Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้

    เอเจนต์มองเห็นเครื่องมือเป็นนิยามฟังก์ชันแบบมีโครงสร้างที่ส่งไปยัง model API

  </Step>

  <Step title="Skills สอนเอเจนต์ว่าเมื่อไรและอย่างไร">
    Skill คือไฟล์ markdown (`SKILL.md`) ที่ถูกแทรกเข้าไปใน system prompt
    Skills ให้บริบท ข้อจำกัด และคำแนะนำทีละขั้นตอนแก่เอเจนต์สำหรับ
    การใช้เครื่องมืออย่างมีประสิทธิภาพ Skills อยู่ใน workspace ของคุณ ในโฟลเดอร์ที่ใช้ร่วมกัน
    หรือมาพร้อมอยู่ภายใน Plugin

    [ข้อมูลอ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugin แพ็กทุกอย่างรวมกัน">
    Plugin คือแพ็กเกจที่สามารถลงทะเบียนความสามารถได้หลายแบบร่วมกัน:
    channels, model providers, tools, skills, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch, web search และอื่น ๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ
    OpenClaw) ขณะที่บางตัวเป็น **external** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## เครื่องมือในตัว

เครื่องมือเหล่านี้มาพร้อมกับ OpenClaw และใช้งานได้โดยไม่ต้องติดตั้ง Plugin ใด ๆ:

| เครื่องมือ                                  | สิ่งที่ทำ                                                            | หน้า                                                         |
| ------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                          | รันคำสั่ง shell จัดการ process เบื้องหลัง                           | [Exec](/th/tools/exec), [การอนุมัติ Exec](/th/tools/exec-approvals) |
| `code_execution`                            | รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed                         | [Code Execution](/th/tools/code-execution)                      |
| `browser`                                   | ควบคุมเบราว์เซอร์ Chromium (นำทาง คลิก จับภาพหน้าจอ)               | [Browser](/th/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`     | ค้นหาเว็บ ค้นหาโพสต์บน X ดึงเนื้อหาหน้าเว็บ                         | [เว็บ](/th/tools/web), [Web Fetch](/th/tools/web-fetch)           |
| `read` / `write` / `edit`                   | I/O ไฟล์ใน workspace                                                 |                                                              |
| `apply_patch`                               | แพตช์ไฟล์หลาย hunk                                                   | [Apply Patch](/th/tools/apply-patch)                            |
| `message`                                   | ส่งข้อความข้ามทุก channels                                           | [การส่งเอเจนต์](/th/tools/agent-send)                           |
| `canvas`                                    | ควบคุม node Canvas (present, eval, snapshot)                         |                                                              |
| `nodes`                                     | ค้นหาและกำหนดเป้าหมายอุปกรณ์ที่จับคู่ไว้                            |                                                              |
| `cron` / `gateway`                          | จัดการงานตามกำหนดเวลา; ตรวจสอบ แพตช์ รีสตาร์ต หรืออัปเดต gateway   |                                                              |
| `image` / `image_generate`                  | วิเคราะห์หรือสร้างรูปภาพ                                             | [การสร้างรูปภาพ](/th/tools/image-generation)                    |
| `music_generate`                            | สร้างแทร็กเพลง                                                       | [การสร้างเพลง](/th/tools/music-generation)                      |
| `video_generate`                            | สร้างวิดีโอ                                                           | [การสร้างวิดีโอ](/th/tools/video-generation)                    |
| `tts`                                       | แปลงข้อความเป็นเสียงพูดแบบครั้งเดียว                                 | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list`  | การจัดการเซสชัน สถานะ และการประสานงาน sub-agent                     | [Sub-agents](/th/tools/subagents)                               |
| `session_status`                            | การอ่านกลับแบบเบา ๆ สไตล์ `/status` และการ override โมเดลต่อเซสชัน | [Session Tools](/th/concepts/session-tool)                      |

สำหรับงานรูปภาพ ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมายไปที่ `openai/*`, `google/*`, `fal/*` หรือผู้ให้บริการรูปภาพอื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานเพลง ใช้ `music_generate` หากคุณกำหนดเป้าหมายไปที่ `google/*`, `minimax/*` หรือผู้ให้บริการเพลงอื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานวิดีโอ ใช้ `video_generate` หากคุณกำหนดเป้าหมายไปที่ `qwen/*` หรือผู้ให้บริการวิดีโออื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นก่อน

สำหรับการสร้างเสียงแบบขับเคลื่อนด้วยเวิร์กโฟลว์ ใช้ `music_generate` เมื่อ Plugin เช่น
ComfyUI ลงทะเบียนเครื่องมือนี้ไว้ ซึ่งแยกจาก `tts` ที่เป็นการแปลงข้อความเป็นเสียงพูด

`session_status` คือเครื่องมือสถานะ/การอ่านกลับแบบเบาในกลุ่ม sessions
มันตอบคำถามสไตล์ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่า override โมเดลต่อเซสชันได้ตามต้องการ; `model=default` จะล้าง
override นั้น เช่นเดียวกับ `/status` มันสามารถเติมตัวนับ token/cache ที่กระจัดกระจาย และ
ป้ายชื่อโมเดลรันไทม์ที่ใช้งานอยู่จาก usage entry ล่าสุดในทรานสคริปต์ได้

`gateway` คือเครื่องมือรันไทม์สำหรับเจ้าของเท่านั้นสำหรับการดำเนินการกับ gateway:

- `config.schema.lookup` สำหรับ subtree ของ config แบบจำกัดพาธหนึ่งรายการก่อนแก้ไข
- `config.get` สำหรับ snapshot + hash ของ config ปัจจุบัน
- `config.patch` สำหรับการอัปเดต config บางส่วนพร้อมการรีสตาร์ต
- `config.apply` ใช้เฉพาะสำหรับการแทนที่ config ทั้งหมด
- `update.run` สำหรับ self-update + รีสตาร์ตแบบ explicit

สำหรับการเปลี่ยนแปลงบางส่วน ให้ใช้ `config.schema.lookup` แล้วจึง `config.patch`
ใช้ `config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่ config ทั้งหมด
เครื่องมือนี้ยังปฏิเสธการเปลี่ยน `tools.exec.ask` หรือ `tools.exec.security`;
alias แบบเดิม `tools.bash.*` จะถูกทำให้เป็นเส้นทาง exec ที่ได้รับการป้องกันแบบเดียวกัน

### เครื่องมือที่ Plugin จัดให้

Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและเรนเดอเรอร์ diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON-only สำหรับเอาต์พุตที่มีโครงสร้าง
- [Lobster](/th/tools/lobster) — รันไทม์เวิร์กโฟลว์แบบมีชนิดพร้อมการอนุมัติที่ resume ได้
- [Music Generation](/th/tools/music-generation) — เครื่องมือ `music_generate` ที่ใช้ร่วมกันกับผู้ให้บริการที่ขับเคลื่อนด้วยเวิร์กโฟลว์
- [OpenProse](/th/prose) — การประสานงานเวิร์กโฟลว์แบบ markdown-first
- [Tokenjuice](/th/tools/tokenjuice) — ย่อผลลัพธ์เครื่องมือ `exec` และ `bash` ที่มีสัญญาณรบกวนมากให้กระชับ

## การกำหนดค่าเครื่องมือ

### รายการอนุญาตและปฏิเสธ

ควบคุมว่าเอเจนต์สามารถเรียกใช้เครื่องมือใดได้ผ่าน `tools.allow` / `tools.deny` ใน
config โดย deny จะชนะ allow เสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อนที่จะนำ `allow`/`deny` มาใช้
override ต่อเอเจนต์: `agents.list[].tools.profile`

| โปรไฟล์     | สิ่งที่รวมอยู่                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | ไม่จำกัด (เหมือนกับไม่ตั้งค่า)                                                                                                                     |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                          |
| `minimal`   | `session_status` เท่านั้น                                                                                                                           |

โปรไฟล์ `coding` และ `messaging` ยังอนุญาตเครื่องมือ MCP bundle ที่กำหนดค่าไว้
ภายใต้คีย์ Plugin `bundle-mcp`
เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์คงเครื่องมือในตัวตามปกติไว้ แต่ซ่อนเครื่องมือ MCP ที่กำหนดค่าไว้ทั้งหมด
โปรไฟล์ `minimal` ไม่รวมเครื่องมือ MCP bundle

### กลุ่มเครื่องมือ

ใช้ชวเลข `group:*` ในรายการ allow/deny:

| กลุ่ม               | เครื่องมือ                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`     | exec, process, code_execution (`bash` ยอมรับเป็น alias ของ `exec`)                                       |
| `group:fs`          | read, write, edit, apply_patch                                                                            |
| `group:sessions`    | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`      | memory_search, memory_get                                                                                 |
| `group:web`         | web_search, x_search, web_fetch                                                                           |
| `group:ui`          | browser, canvas                                                                                           |
| `group:automation`  | cron, gateway                                                                                             |
| `group:messaging`   | message                                                                                                   |
| `group:nodes`       | nodes                                                                                                     |
| `group:agents`      | agents_list                                                                                               |
| `group:media`       | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`    | เครื่องมือ OpenClaw ในตัวทั้งหมด (ไม่รวมเครื่องมือจาก Plugin)                                             |

`sessions_history` จะส่งคืนมุมมองการเรียกคืนแบบมีขอบเขตและกรองเพื่อความปลอดภัย มันจะตัด
thinking tags, โครง `<relevant-memories>`, เพย์โหลด XML
ของการเรียกใช้เครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียกใช้เครื่องมือที่ถูกตัดทอน),
โครงร่างการเรียกใช้เครื่องมือที่ถูกลดระดับ, token ควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วออกมา,
และ XML การเรียกใช้เครื่องมือ MiniMax ที่มีรูปแบบไม่ถูกต้องออกจากข้อความของผู้ช่วย จากนั้นจึงใช้
การปกปิด/การตัดทอน และอาจใส่ placeholder สำหรับแถวที่มีขนาดใหญ่เกิน แทนที่จะทำงาน
เป็นการ dump ทรานสคริปต์ดิบ

### ข้อจำกัดเฉพาะผู้ให้บริการ

ใช้ `tools.byProvider` เพื่อจำกัดเครื่องมือสำหรับผู้ให้บริการบางรายโดยไม่
เปลี่ยนค่าเริ่มต้นระดับโกลบอล:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
