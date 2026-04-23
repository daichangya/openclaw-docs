---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'เหตุใด tool จึงถูกบล็อก: รันไทม์ sandbox, นโยบายอนุญาต/ปฏิเสธ tool และจุดควบคุม exec แบบยกระดับ'
title: Sandbox เทียบกับนโยบาย Tool เทียบกับ Elevated
x-i18n:
    generated_at: "2026-04-23T05:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox เทียบกับนโยบาย Tool เทียบกับ Elevated

OpenClaw มีตัวควบคุมที่เกี่ยวข้องกันสามอย่าง (แต่แตกต่างกัน):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) เป็นตัวตัดสินว่า **tools รันที่ไหน** (backend ของ sandbox หรือ host)
2. **นโยบาย Tool** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) เป็นตัวตัดสินว่า **tools ใดพร้อมใช้งาน/ได้รับอนุญาต**
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) คือ **ช่องทางหลีกเลี่ยงเฉพาะ exec** เพื่อรันนอก sandbox เมื่อคุณอยู่ในสภาพ sandbox (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อกำหนด exec target ไว้เป็น `node`)

## การดีบักแบบรวดเร็ว

ใช้ตัวตรวจสอบเพื่อดูว่า OpenClaw _กำลังทำอะไรอยู่จริง ๆ_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

มันจะแสดง:

- โหมด sandbox/scope/workspace access ที่มีผลจริง
- เซสชันนั้นกำลังอยู่ใน sandbox หรือไม่ (main เทียบกับ non-main)
- นโยบาย allow/deny ของ sandbox tool ที่มีผลจริง (และมาจาก agent/global/default หรือไม่)
- gate ของ elevated และพาธคีย์สำหรับแก้ไข

## Sandbox: tools รันที่ไหน

Sandboxing ถูกควบคุมโดย `agents.defaults.sandbox.mode`:

- `"off"`: ทุกอย่างรันบน host
- `"non-main"`: เฉพาะเซสชันที่ไม่ใช่ main เท่านั้นที่อยู่ใน sandbox (เป็น “จุดที่มักทำให้แปลกใจ” สำหรับ groups/channels)
- `"all"`: ทุกอย่างอยู่ใน sandbox

ดู [Sandboxing](/th/gateway/sandboxing) สำหรับเมทริกซ์ทั้งหมด (scope, workspace mounts, images)

### Bind mount (ตรวจสอบความปลอดภัยแบบรวดเร็ว)

- `docker.binds` _เจาะทะลุ_ ระบบไฟล์ของ sandbox: สิ่งที่คุณ mount จะมองเห็นได้ภายใน container ตามโหมดที่คุณตั้ง (`:ro` หรือ `:rw`)
- ค่าเริ่มต้นคือ read-write หากคุณไม่ระบุโหมด; ควรใช้ `:ro` สำหรับ source/secrets
- `scope: "shared"` จะไม่สนใจ bind ต่อเอเจนต์ (ใช้ได้เฉพาะ global bind)
- OpenClaw จะตรวจสอบแหล่งที่มาของ bind สองครั้ง: ครั้งแรกบนพาธต้นทางที่ normalized และอีกครั้งหลัง resolve ผ่าน ancestor ที่ลึกที่สุดที่มีอยู่แล้ว การหลบหนีผ่าน symlink-parent ไม่สามารถข้ามการตรวจ blocked-path หรือ allowed-root ได้
- พาธปลายทางที่ยังไม่มีอยู่ก็ยังถูกตรวจสอบอย่างปลอดภัย หาก `/workspace/alias-out/new-file` resolve ผ่าน parent ที่เป็น symlink ไปยังพาธที่ถูกบล็อกหรืออยู่นอก allowed roots ที่กำหนดไว้ bind จะถูกปฏิเสธ
- การ bind `/var/run/docker.sock` เทียบเท่ากับมอบสิทธิ์ควบคุม host ให้ sandbox; ทำเช่นนี้เฉพาะเมื่อเจตนาชัดเจน
- การเข้าถึง workspace (`workspaceAccess: "ro"`/`"rw"`) เป็นอิสระจากโหมดของ bind

## นโยบาย Tool: tools ใดมีอยู่/เรียกใช้ได้

มีสองชั้นที่สำคัญ:

- **โปรไฟล์ Tool**: `tools.profile` และ `agents.list[].tools.profile` (allowlist พื้นฐาน)
- **โปรไฟล์ Tool ต่อ provider**: `tools.byProvider[provider].profile` และ `agents.list[].tools.byProvider[provider].profile`
- **นโยบาย Tool ระดับ global/ต่อเอเจนต์**: `tools.allow`/`tools.deny` และ `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **นโยบาย Tool ต่อ provider**: `tools.byProvider[provider].allow/deny` และ `agents.list[].tools.byProvider[provider].allow/deny`
- **นโยบาย Sandbox tool** (มีผลเฉพาะเมื่ออยู่ใน sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` และ `agents.list[].tools.sandbox.tools.*`

หลักจำง่าย ๆ:

- `deny` ชนะเสมอ
- ถ้า `allow` ไม่ว่าง ทุกอย่างที่เหลือจะถูกมองว่า blocked
- นโยบาย Tool คือจุดหยุดแบบเด็ดขาด: `/exec` ไม่สามารถ override `exec` tool ที่ถูกปฏิเสธได้
- `/exec` เปลี่ยนเฉพาะค่าเริ่มต้นของเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต; มันไม่ได้มอบสิทธิ์เข้าถึง tool
  คีย์ tool ต่อ provider ยอมรับได้ทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

### กลุ่ม Tool (ชอร์ตแฮนด์)

นโยบาย Tool (global, agent, sandbox) รองรับรายการ `group:*` ที่ขยายเป็นหลาย tools:

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

กลุ่มที่ใช้ได้:

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
- `group:openclaw`: tools แบบ built-in ทั้งหมดของ OpenClaw (ไม่รวม provider plugins)

## Elevated: “รันบน host” แบบ exec-only

Elevated **ไม่ได้** มอบ tools เพิ่มเติม; มันมีผลเฉพาะกับ `exec`

- หากคุณอยู่ใน sandbox, `/elevated on` (หรือ `exec` ที่มี `elevated: true`) จะรันนอก sandbox (อาจยังต้องมี approvals)
- ใช้ `/elevated full` เพื่อข้าม exec approvals สำหรับเซสชันนั้น
- หากคุณกำลังรันแบบ direct อยู่แล้ว elevated แทบจะไม่มีผลอะไร (แต่ยังคงมีกลไก gate)
- Elevated **ไม่ได้** ผูกกับ Skills และ **ไม่ได้** override allow/deny ของ tool
- Elevated ไม่ได้มอบการ override ข้าม host แบบอิสระจาก `host=auto`; มันทำตามกฎ exec target ปกติ และจะคง `node` ไว้เฉพาะเมื่อ target ที่กำหนด/ของเซสชันเป็น `node` อยู่แล้วเท่านั้น
- `/exec` แยกจาก elevated มันแค่ปรับค่าเริ่มต้นของ exec ต่อเซสชันสำหรับผู้ส่งที่ได้รับอนุญาต

Gates:

- การเปิดใช้งาน: `tools.elevated.enabled` (และอาจใช้ `agents.list[].tools.elevated.enabled`)
- allowlist ของผู้ส่ง: `tools.elevated.allowFrom.<provider>` (และอาจใช้ `agents.list[].tools.elevated.allowFrom.<provider>`)

ดู [Elevated Mode](/th/tools/elevated)

## วิธีแก้ปัญหา “ถูกขังใน sandbox” ที่พบบ่อย

### "Tool X blocked by sandbox tool policy"

คีย์สำหรับแก้ไข (เลือกอย่างใดอย่างหนึ่ง):

- ปิด sandbox: `agents.defaults.sandbox.mode=off` (หรือแบบต่อเอเจนต์ `agents.list[].sandbox.mode=off`)
- อนุญาต tool นั้นภายใน sandbox:
  - เอามันออกจาก `tools.sandbox.tools.deny` (หรือแบบต่อเอเจนต์ `agents.list[].tools.sandbox.tools.deny`)
  - หรือเพิ่มมันเข้าไปใน `tools.sandbox.tools.allow` (หรือ allow แบบต่อเอเจนต์)

### "ฉันคิดว่านี่คือ main ทำไมมันถึงอยู่ใน sandbox?"

ในโหมด `"non-main"` คีย์ของ group/channel _ไม่ใช่_ main ใช้ session key ของ main (แสดงโดย `sandbox explain`) หรือสลับโหมดเป็น `"off"`

## ดูเพิ่มเติม

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox แบบเต็ม (โหมด, scope, backend, images)
- [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) -- การ override ต่อเอเจนต์และลำดับความสำคัญ
- [Elevated Mode](/th/tools/elevated)
