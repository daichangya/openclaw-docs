---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'เหตุใดเครื่องมือจึงถูกบล็อก: runtime ของ sandbox, นโยบาย allow/deny ของเครื่องมือ และเกตของ elevated exec'
title: Sandbox เทียบกับนโยบายเครื่องมือ เทียบกับ elevated
x-i18n:
    generated_at: "2026-04-24T09:12:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw มีตัวควบคุมที่เกี่ยวข้องกันสามอย่าง (แต่แตกต่างกัน):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) ตัดสินใจว่า **เครื่องมือจะรันที่ไหน** (backend ของ sandbox เทียบกับโฮสต์)
2. **นโยบายเครื่องมือ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) ตัดสินใจว่า **เครื่องมือใดพร้อมใช้งาน/ได้รับอนุญาต**
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) คือ **ช่องทางหลุดเฉพาะ exec** สำหรับรันนอก sandbox เมื่อคุณอยู่ใน sandbox (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อมีการกำหนด exec target เป็น `node`)

## การแก้ไขปัญหาอย่างรวดเร็ว

ใช้ inspector เพื่อดูว่า OpenClaw _กำลังทำอะไรจริง ๆ_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

มันจะแสดง:

- โหมด/scope/การเข้าถึงพื้นที่ทำงานของ sandbox ที่มีผลจริง
- เซสชันปัจจุบันอยู่ใน sandbox หรือไม่ (main เทียบกับ non-main)
- allow/deny ของเครื่องมือใน sandbox ที่มีผลจริง (และมาจาก agent/global/default หรือไม่)
- เกตของ elevated และพาธคีย์สำหรับการแก้ไข

## Sandbox: เครื่องมือรันที่ไหน

Sandboxing ถูกควบคุมโดย `agents.defaults.sandbox.mode`:

- `"off"`: ทุกอย่างรันบนโฮสต์
- `"non-main"`: เฉพาะเซสชันที่ไม่ใช่ main เท่านั้นที่อยู่ใน sandbox (เป็น “เรื่องน่าประหลาดใจ” ที่พบบ่อยสำหรับกลุ่ม/ช่องทาง)
- `"all"`: ทุกอย่างอยู่ใน sandbox

ดู [Sandboxing](/th/gateway/sandboxing) สำหรับเมทริกซ์แบบเต็ม (scope, การ mount พื้นที่ทำงาน, image)

### Bind mount (การตรวจสอบความปลอดภัยแบบรวดเร็ว)

- `docker.binds` _เจาะผ่าน_ ระบบไฟล์ของ sandbox: สิ่งใดก็ตามที่คุณ mount จะมองเห็นได้ภายใน container ตามโหมดที่คุณตั้ง (`:ro` หรือ `:rw`)
- ค่าเริ่มต้นคือ read-write หากคุณละโหมดไว้; ควรใช้ `:ro` สำหรับ source/secrets
- `scope: "shared"` จะไม่สนใจ bind แบบต่อเอเจนต์ (จะใช้เฉพาะ bind แบบส่วนกลาง)
- OpenClaw ตรวจสอบแหล่งที่มาของ bind สองครั้ง: ครั้งแรกบนพาธต้นทางที่ normalize แล้ว จากนั้นตรวจสอบอีกครั้งหลัง resolve ผ่าน ancestor ที่มีอยู่จริงที่ลึกที่สุด การหลบหนีผ่าน symlink-parent ไม่สามารถหลบการตรวจ blocked-path หรือ allowed-root ได้
- leaf path ที่ยังไม่มีอยู่ก็ยังถูกตรวจสอบอย่างปลอดภัย หาก `/workspace/alias-out/new-file` resolve ผ่าน parent ที่เป็น symlink ไปยังพาธที่ถูกบล็อกหรืออยู่นอก allowed root ที่กำหนดไว้ bind จะถูกปฏิเสธ
- การ bind `/var/run/docker.sock` เทียบเท่ากับการยกอำนาจควบคุมโฮสต์ให้ sandbox; ทำสิ่งนี้เฉพาะเมื่อเจตนาเท่านั้น
- การเข้าถึงพื้นที่ทำงาน (`workspaceAccess: "ro"`/`"rw"`) แยกจากโหมดของ bind

## นโยบายเครื่องมือ: เครื่องมือใดมีอยู่/เรียกใช้ได้

มีสองชั้นที่สำคัญ:

- **โปรไฟล์เครื่องมือ**: `tools.profile` และ `agents.list[].tools.profile` (allowlist พื้นฐาน)
- **โปรไฟล์เครื่องมือของผู้ให้บริการ**: `tools.byProvider[provider].profile` และ `agents.list[].tools.byProvider[provider].profile`
- **นโยบายเครื่องมือแบบส่วนกลาง/ต่อเอเจนต์**: `tools.allow`/`tools.deny` และ `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **นโยบายเครื่องมือของผู้ให้บริการ**: `tools.byProvider[provider].allow/deny` และ `agents.list[].tools.byProvider[provider].allow/deny`
- **นโยบายเครื่องมือของ sandbox** (ใช้เฉพาะเมื่ออยู่ใน sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` และ `agents.list[].tools.sandbox.tools.*`

หลักทั่วไป:

- `deny` ชนะเสมอ
- หาก `allow` ไม่ว่าง ทุกอย่างที่เหลือจะถือว่าถูกบล็อก
- นโยบายเครื่องมือคือจุดหยุดแบบ hard stop: `/exec` ไม่สามารถ override เครื่องมือ `exec` ที่ถูก deny ได้
- `/exec` เปลี่ยนเฉพาะค่าเริ่มต้นของเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต; มันไม่ได้มอบสิทธิ์เข้าถึงเครื่องมือ
  คีย์เครื่องมือของผู้ให้บริการรับได้ทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

### กลุ่มเครื่องมือ (shorthand)

นโยบายเครื่องมือ (global, agent, sandbox) รองรับรายการ `group:*` ที่ขยายเป็นหลายเครื่องมือ:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

กลุ่มที่มีให้ใช้:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` ยอมรับเป็น
  alias ของ `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: เครื่องมือ OpenClaw ในตัวทั้งหมด (ไม่รวม provider Plugin)

## Elevated: "รันบนโฮสต์" แบบเฉพาะ exec

Elevated **ไม่ได้** มอบเครื่องมือเพิ่ม; มันมีผลเฉพาะกับ `exec`

- หากคุณอยู่ใน sandbox, `/elevated on` (หรือ `exec` ที่มี `elevated: true`) จะรันนอก sandbox (อาจยังต้องมีการอนุมัติอยู่)
- ใช้ `/elevated full` เพื่อข้ามการอนุมัติ exec สำหรับเซสชันนั้น
- หากคุณกำลังรันแบบ direct อยู่แล้ว elevated แทบไม่มีผล (แต่ยังอยู่ภายใต้เกต)
- Elevated **ไม่** ถูกกำหนดขอบเขตตาม Skill และ **ไม่** override allow/deny ของเครื่องมือ
- Elevated ไม่ได้มอบการ override ข้ามโฮสต์ตามอำเภอใจจาก `host=auto`; มันเป็นไปตามกฎ exec target ปกติ และจะคง `node` ไว้เฉพาะเมื่อ target ที่กำหนดไว้/ของเซสชันเป็น `node` อยู่แล้ว
- `/exec` แยกจาก elevated มันเพียงปรับค่าเริ่มต้นของ exec ต่อเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต

เกต:

- การเปิดใช้งาน: `tools.elevated.enabled` (และแบบเลือกได้ `agents.list[].tools.elevated.enabled`)
- allowlist ของผู้ส่ง: `tools.elevated.allowFrom.<provider>` (และแบบเลือกได้ `agents.list[].tools.elevated.allowFrom.<provider>`)

ดู [Elevated Mode](/th/tools/elevated)

## วิธีแก้ "คุก sandbox" ที่พบบ่อย

### "Tool X blocked by sandbox tool policy"

คีย์สำหรับแก้ไข (เลือกอย่างใดอย่างหนึ่ง):

- ปิดใช้งาน sandbox: `agents.defaults.sandbox.mode=off` (หรือ `agents.list[].sandbox.mode=off` ต่อเอเจนต์)
- อนุญาตเครื่องมือนั้นภายใน sandbox:
  - เอาออกจาก `tools.sandbox.tools.deny` (หรือ `agents.list[].tools.sandbox.tools.deny` ต่อเอเจนต์)
  - หรือเพิ่มเข้า `tools.sandbox.tools.allow` (หรือ allow ต่อเอเจนต์)

### "ฉันคิดว่านี่คือ main ทำไมมันถึงอยู่ใน sandbox?"

ในโหมด `"non-main"` คีย์ของกลุ่ม/ช่องทาง _ไม่ใช่_ main ใช้ main session key (แสดงโดย `sandbox explain`) หรือสลับโหมดเป็น `"off"`

## ที่เกี่ยวข้อง

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox แบบเต็ม (โหมด, scope, backend, image)
- [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) -- override ต่อเอเจนต์และลำดับความสำคัญ
- [Elevated Mode](/th/tools/elevated)
