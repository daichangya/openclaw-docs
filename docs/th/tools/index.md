---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw มี tool อะไรให้บ้าง
    - คุณต้องการตั้งค่า อนุญาต หรือปฏิเสธ toolներ
    - คุณกำลังตัดสินใจระหว่าง built-in tools, Skills และ Plugins
summary: 'ภาพรวมของ tools และ Plugins ใน OpenClaw: เอเจนต์ทำอะไรได้บ้าง และจะขยายความสามารถอย่างไร'
title: Tools and Plugins
x-i18n:
    generated_at: "2026-04-23T06:01:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c32414dfa99969372e9b0c846305a1af1ffb18a282e6dfc8a6adabe3fab145a
    source_path: tools/index.md
    workflow: 15
---

# Tools and Plugins

ทุกสิ่งที่เอเจนต์ทำได้ นอกเหนือจากการสร้างข้อความ เกิดขึ้นผ่าน **tools**
tool คือวิธีที่เอเจนต์ใช้ในการอ่านไฟล์ รันคำสั่ง browse เว็บ ส่งข้อความ และโต้ตอบกับอุปกรณ์

## Tools, Skills และ Plugins

OpenClaw มี 3 ชั้นที่ทำงานร่วมกัน:

<Steps>
  <Step title="Tools คือสิ่งที่เอเจนต์เรียกใช้">
    tool คือฟังก์ชันแบบมีชนิดที่เอเจนต์สามารถ invoke ได้ (เช่น `exec`, `browser`,
    `web_search`, `message`) OpenClaw มาพร้อม **built-in tools** ชุดหนึ่ง และ
    Plugin สามารถลงทะเบียน tool เพิ่มเติมได้

    เอเจนต์มองเห็น tool เป็นนิยามฟังก์ชันแบบมีโครงสร้างที่ส่งไปยัง model API

  </Step>

  <Step title="Skills สอนเอเจนต์ว่าเมื่อไรและอย่างไร">
    Skill คือไฟล์ markdown (`SKILL.md`) ที่ถูก inject เข้าไปใน system prompt
    Skills ให้บริบท ข้อจำกัด และคำแนะนำทีละขั้นตอนแก่เอเจนต์
    สำหรับการใช้ tool อย่างมีประสิทธิภาพ Skills อยู่ใน workspace ของคุณ, โฟลเดอร์ที่ใช้ร่วมกัน,
    หรือมากับ Plugin

    [เอกสารอ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugins รวมทุกอย่างเข้าด้วยกัน">
    Plugin คือ package ที่สามารถลงทะเบียนความสามารถแบบใดก็ได้ร่วมกัน:
    channels, ผู้ให้บริการโมเดล, tools, Skills, เสียงพูด, การถอดเสียงแบบ realtime,
    เสียงแบบ realtime, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ,
    web fetch, web search และอื่น ๆ บาง Plugin เป็น **core** (มากับ
    OpenClaw) บางตัวเป็น **external** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและตั้งค่า Plugins](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## built-in tools

tool เหล่านี้มากับ OpenClaw และใช้งานได้โดยไม่ต้องติดตั้ง Plugin ใด ๆ:

| Tool                                       | สิ่งที่ทำ                                                             | หน้า                                        |
| ------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | รันคำสั่ง shell, จัดการ background process                            | [Exec](/th/tools/exec)                         |
| `code_execution`                           | รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed                          | [Code Execution](/th/tools/code-execution)     |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (navigate, click, screenshot)              | [Browser](/th/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ, ค้นหาโพสต์บน X, ดึงเนื้อหาหน้าเว็บ                        | [Web](/th/tools/web)                           |
| `read` / `write` / `edit`                  | I/O กับไฟล์ใน workspace                                                |                                             |
| `apply_patch`                              | แพตช์ไฟล์หลาย hunk                                                    | [Apply Patch](/th/tools/apply-patch)           |
| `message`                                  | ส่งข้อความข้ามทุกช่องทาง                                               | [Agent Send](/th/tools/agent-send)             |
| `canvas`                                   | ควบคุม node Canvas (present, eval, snapshot)                          |                                             |
| `nodes`                                    | ค้นหาและกำหนดเป้าหมายอุปกรณ์ที่จับคู่ไว้                              |                                             |
| `cron` / `gateway`                         | จัดการงานตามเวลา; ตรวจสอบ, patch, restart หรืออัปเดต Gateway         |                                             |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างภาพ                                                 | [Image Generation](/th/tools/image-generation) |
| `music_generate`                           | สร้างแทร็กเพลง                                                        | [Music Generation](/th/tools/music-generation) |
| `video_generate`                           | สร้างวิดีโอ                                                            | [Video Generation](/th/tools/video-generation) |
| `tts`                                      | การแปลงข้อความเป็นเสียงแบบครั้งเดียว                                   | [TTS](/th/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | การจัดการเซสชัน สถานะ และ orchestration ของ sub-agent                 | [Sub-agents](/th/tools/subagents)              |
| `session_status`                           | การอ่านสถานะแบบเบาในสไตล์ `/status` และ model override แยกตามเซสชัน | [Session Tools](/th/concepts/session-tool)     |

สำหรับงานด้านภาพ ให้ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมายเป็น `openai/*`, `google/*`, `fal/*` หรือผู้ให้บริการภาพที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้ตั้งค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานด้านเพลง ให้ใช้ `music_generate` หากคุณกำหนดเป้าหมายเป็น `google/*`, `minimax/*` หรือผู้ให้บริการเพลงที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้ตั้งค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานด้านวิดีโอ ให้ใช้ `video_generate` หากคุณกำหนดเป้าหมายเป็น `qwen/*` หรือผู้ให้บริการวิดีโอที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้ตั้งค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับการสร้างเสียงแบบขับเคลื่อนด้วย workflow ให้ใช้ `music_generate` เมื่อ Plugin เช่น
ComfyUI ลงทะเบียนมันไว้ สิ่งนี้แยกจาก `tts` ซึ่งเป็นการแปลงข้อความเป็นเสียงพูด

`session_status` คือ tool สำหรับอ่านสถานะ/ข้อมูลย้อนหลังแบบเบาในกลุ่ม sessions
มันตอบคำถามในสไตล์ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่า model override แยกตามเซสชันได้แบบไม่บังคับ; `model=default` จะล้าง
override นั้น เช่นเดียวกับ `/status` มันสามารถเติม token/cache counter ที่มีข้อมูลน้อย
และป้ายชื่อโมเดล runtime ที่ active จากรายการ usage ล่าสุดใน transcript ได้

`gateway` คือ tool ของรันไทม์ระดับเจ้าของสำหรับการปฏิบัติการกับ Gateway:

- `config.schema.lookup` สำหรับ subtree ของคอนฟิกตามพาธหนึ่งรายการก่อนแก้ไข
- `config.get` สำหรับสแนปชอตคอนฟิกปัจจุบัน + hash
- `config.patch` สำหรับการอัปเดตคอนฟิกบางส่วนพร้อม restart
- `config.apply` ใช้เฉพาะสำหรับการแทนที่คอนฟิกทั้งหมด
- `update.run` สำหรับ self-update + restart แบบ explicit

สำหรับการเปลี่ยนบางส่วน ให้เลือก `config.schema.lookup` แล้วตามด้วย `config.patch` ใช้
`config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่คอนฟิกทั้งหมดเท่านั้น
tool นี้ยังปฏิเสธการเปลี่ยน `tools.exec.ask` หรือ `tools.exec.security`;
alias แบบ legacy ของ `tools.bash.*` จะถูก normalize ไปยังพาธ exec ที่ป้องกันไว้แบบเดียวกัน

### tool ที่มาจาก Plugin

Plugin สามารถลงทะเบียน tool เพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและตัวเรนเดอร์ diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON-only สำหรับเอาต์พุตที่มีโครงสร้าง
- [Lobster](/th/tools/lobster) — runtime ของ workflow แบบมีชนิดพร้อม approval ที่ resume ได้
- [Music Generation](/th/tools/music-generation) — tool `music_generate` แบบใช้ร่วมกันพร้อมผู้ให้บริการแบบ workflow-backed
- [OpenProse](/th/prose) — orchestration ของ workflow ที่ยึด markdown เป็นหลัก
- [Tokenjuice](/th/tools/tokenjuice) — ย่อผลลัพธ์ของ tool `exec` และ `bash` ที่มี noise มาก

## การตั้งค่า tool

### allowlist และ denylist

ควบคุมว่าเอเจนต์จะเรียก tool ไหนได้ผ่าน `tools.allow` / `tools.deny` ใน
คอนฟิก deny จะชนะ allow เสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### โปรไฟล์ของ tool

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อนจะใช้ `allow`/`deny`
override แยกตามเอเจนต์: `agents.list[].tools.profile`

| โปรไฟล์      | สิ่งที่รวมอยู่                                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`       | ไม่จำกัด (เหมือนกับไม่ได้ตั้งค่า)                                                                                                                  |
| `coding`     | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging`  | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`    | `session_status` เท่านั้น                                                                                                                          |

โปรไฟล์ `coding` และ `messaging` ยังอนุญาต bundle MCP tool ที่ตั้งค่าไว้
ภายใต้คีย์ Plugin `bundle-mcp` ด้วย เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์คง built-in ปกติไว้ แต่ซ่อน MCP tool ทั้งหมดที่ตั้งค่าไว้
โปรไฟล์ `minimal` ไม่รวม bundle MCP tool

### กลุ่มของ tool

ใช้ shorthand แบบ `group:*` ใน allow/deny list:

| กลุ่ม              | Tools                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` ยอมรับเป็น alias ของ `exec`)                                        |
| `group:fs`         | read, write, edit, apply_patch                                                                             |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                  |
| `group:web`        | web_search, x_search, web_fetch                                                                            |
| `group:ui`         | browser, canvas                                                                                            |
| `group:automation` | cron, gateway                                                                                              |
| `group:messaging`  | message                                                                                                    |
| `group:nodes`      | nodes                                                                                                      |
| `group:agents`     | agents_list                                                                                                |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                 |
| `group:openclaw`   | built-in tool ทั้งหมดของ OpenClaw (ไม่รวม tool จาก Plugin)                                                 |

`sessions_history` จะส่งคืนมุมมองสำหรับเรียกคืนข้อมูลที่มีขอบเขตและผ่านการกรองเพื่อความปลอดภัย มันจะตัด
แท็ก thinking, scaffolding ของ `<relevant-memories>`, payload XML ของ tool-call แบบข้อความล้วน
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดค้าง),
scaffolding ของ tool-call ที่ถูกลดรูป, โทเคนควบคุมโมเดลแบบ ASCII/full-width ที่รั่วออกมา และ XML ของ tool-call ของ MiniMax ที่ผิดรูปออกจากข้อความของ assistant จากนั้นจึงใช้
การปกปิด/การตัดทอน และอาจแทนแถวที่ใหญ่เกินไปด้วย placeholder แทนที่จะทำหน้าที่เป็น raw transcript dump

### ข้อจำกัดเฉพาะผู้ให้บริการ

ใช้ `tools.byProvider` เพื่อจำกัด tool สำหรับผู้ให้บริการเฉพาะราย โดยไม่
เปลี่ยนค่าเริ่มต้นแบบ global:

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
