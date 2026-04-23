---
read_when:
    - การตั้งค่าการผสานรวมกับ IDE ที่ใช้ ACP
    - การดีบักการกำหนดเส้นทางเซสชัน ACP ไปยัง Gateway
summary: เรียกใช้สะพาน ACP สำหรับการผสานรวมกับ IDE
title: ACP
x-i18n:
    generated_at: "2026-04-23T06:17:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

เรียกใช้สะพาน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ที่สื่อสารกับ OpenClaw Gateway

คำสั่งนี้สื่อสาร ACP ผ่าน stdio สำหรับ IDE และส่งต่อพรอมป์ไปยัง Gateway
ผ่าน WebSocket โดยจะคงการแมปเซสชัน ACP กับคีย์เซสชันของ Gateway

`openclaw acp` เป็นสะพาน ACP ที่ทำงานผ่าน Gateway ไม่ใช่รันไทม์เอดิเตอร์แบบ ACP-native เต็มรูปแบบ
โดยเน้นที่การกำหนดเส้นทางเซสชัน การส่งพรอมป์ และการอัปเดตการสตรีมพื้นฐาน

หากคุณต้องการให้ไคลเอนต์ MCP ภายนอกสื่อสารกับการสนทนาผ่านแชนแนลของ OpenClaw โดยตรง
แทนการโฮสต์เซสชัน ACP harness ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน

## สิ่งที่นี่ไม่ใช่

หน้านี้มักถูกสับสนกับเซสชัน ACP harness

`openclaw acp` หมายถึง:

- OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ ACP
- IDE หรือไคลเอนต์ ACP เชื่อมต่อกับ OpenClaw
- OpenClaw ส่งต่องานนั้นเข้าไปยังเซสชัน Gateway

ซึ่งแตกต่างจาก [ACP Agents](/th/tools/acp-agents) ที่ OpenClaw เรียกใช้
harness ภายนอก เช่น Codex หรือ Claude Code ผ่าน `acpx`

กฎสั้นๆ:

- ถ้าเอดิเตอร์/ไคลเอนต์ต้องการสื่อสาร ACP กับ OpenClaw: ใช้ `openclaw acp`
- ถ้า OpenClaw ควรเรียกใช้ Codex/Claude/Gemini เป็น ACP harness: ใช้ `/acp spawn` และ [ACP Agents](/th/tools/acp-agents)

## ตารางความเข้ากันได้

| ส่วนของ ACP                                                            | สถานะ        | หมายเหตุ                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                         | รองรับแล้ว   | โฟลว์สะพานหลักผ่าน stdio ไปยัง Gateway chat/send + abort                                                                                                                                                                                       |
| `listSessions`, slash commands                                         | รองรับแล้ว   | รายการเซสชันทำงานกับสถานะเซสชันของ Gateway; คำสั่งจะถูกประกาศผ่าน `available_commands_update`                                                                                                                                                  |
| `loadSession`                                                          | รองรับบางส่วน | รีไบน์เซสชัน ACP กับคีย์เซสชันของ Gateway และเล่นประวัติข้อความ user/assistant ที่เก็บไว้ซ้ำ ระบบยังไม่สร้างประวัติ tool/system กลับขึ้นมาใหม่                                                                                                   |
| เนื้อหาพรอมป์ (`text`, `resource` แบบฝัง, รูปภาพ)                    | รองรับบางส่วน | ข้อความ/ทรัพยากรถูก flatten ลงในอินพุตแชต; รูปภาพจะกลายเป็นไฟล์แนบของ Gateway                                                                                                                                                                 |
| โหมดเซสชัน                                                            | รองรับบางส่วน | รองรับ `session/set_mode` และสะพานเปิดเผยตัวควบคุมเซสชันเริ่มต้นที่ทำงานผ่าน Gateway สำหรับระดับความคิด ความละเอียดของเครื่องมือ การให้เหตุผล รายละเอียดการใช้งาน และการดำเนินการแบบยกระดับ ส่วนพื้นผิวโหมด/คอนฟิกแบบ ACP-native ที่กว้างกว่ายังอยู่นอกขอบเขต |
| ข้อมูลเซสชันและการอัปเดตการใช้งาน                                    | รองรับบางส่วน | สะพานส่งการแจ้งเตือน `session_info_update` และ `usage_update` แบบ best-effort จาก snapshot เซสชัน Gateway ที่แคชไว้ การใช้งานเป็นค่าโดยประมาณและจะส่งเฉพาะเมื่อยอดโทเคนของ Gateway ถูกทำเครื่องหมายว่าสดใหม่เท่านั้น                                   |
| การสตรีมเครื่องมือ                                                     | รองรับบางส่วน | อีเวนต์ `tool_call` / `tool_call_update` รวม raw I/O เนื้อหาข้อความ และตำแหน่งไฟล์แบบ best-effort เมื่ออาร์กิวเมนต์/ผลลัพธ์ของเครื่องมือ Gateway เปิดเผยข้อมูลเหล่านั้น เทอร์มินัลแบบฝังและเอาต์พุตแบบ diff-native ที่สมบูรณ์กว่ายังไม่ถูกเปิดเผย |
| เซิร์ฟเวอร์ MCP ต่อเซสชัน (`mcpServers`)                              | ไม่รองรับ    | โหมดสะพานปฏิเสธคำขอเซิร์ฟเวอร์ MCP ต่อเซสชัน ให้กำหนดค่า MCP บน OpenClaw gateway หรือ agent แทน                                                                                                                                                |
| เมทอด filesystem ของไคลเอนต์ (`fs/read_text_file`, `fs/write_text_file`) | ไม่รองรับ    | สะพานจะไม่เรียกใช้เมทอด filesystem ของไคลเอนต์ ACP                                                                                                                                                                                             |
| เมทอด terminal ของไคลเอนต์ (`terminal/*`)                             | ไม่รองรับ    | สะพานจะไม่สร้างเทอร์มินัลของไคลเอนต์ ACP หรือสตรีม terminal id ผ่านการเรียกเครื่องมือ                                                                                                                                                         |
| แผนเซสชัน / การสตรีมความคิด                                           | ไม่รองรับ    | ปัจจุบันสะพานส่งข้อความเอาต์พุตและสถานะของเครื่องมือ ไม่ใช่การอัปเดตแผนหรือความคิดแบบ ACP                                                                                                                                                    |

## ข้อจำกัดที่ทราบ

- `loadSession` เล่นประวัติข้อความ user และ assistant ที่เก็บไว้ซ้ำ แต่จะไม่
  สร้างการเรียกเครื่องมือในอดีต การแจ้งเตือนของระบบ หรือประเภทอีเวนต์แบบ ACP-native
  ที่สมบูรณ์กว่านั้นกลับขึ้นมาใหม่
- หากไคลเอนต์ ACP หลายตัวใช้คีย์เซสชัน Gateway เดียวกันร่วมกัน การกำหนดเส้นทางอีเวนต์และการยกเลิก
  จะเป็นแบบ best-effort แทนที่จะถูกแยกอย่างเคร่งครัดต่อไคลเอนต์แต่ละตัว ให้ใช้
  เซสชัน `acp:<uuid>` แบบแยกตามค่าเริ่มต้นเมื่อคุณต้องการ
  เทิร์นที่สะอาดแยกเฉพาะในเอดิเตอร์
- สถานะหยุดของ Gateway จะถูกแปลงเป็นเหตุผลการหยุดของ ACP แต่การแมปนั้น
  แสดงรายละเอียดได้น้อยกว่ารันไทม์แบบ ACP-native เต็มรูปแบบ
- ตัวควบคุมเซสชันเริ่มต้นในปัจจุบันแสดงเพียงชุดย่อยที่เน้นเฉพาะของตัวปรับ Gateway:
  ระดับความคิด ความละเอียดของเครื่องมือ การให้เหตุผล รายละเอียดการใช้งาน และการดำเนินการแบบยกระดับ
  การเลือกโมเดลและตัวควบคุม exec-host ยังไม่ถูกเปิดเผยเป็นตัวเลือกคอนฟิกของ ACP
- `session_info_update` และ `usage_update` ถูกคำนวณมาจาก snapshot เซสชันของ Gateway
  ไม่ใช่การคิดบัญชีรันไทม์แบบ ACP-native สด การใช้งานเป็นค่าโดยประมาณ
  ไม่มีข้อมูลต้นทุน และจะส่งออกเฉพาะเมื่อ Gateway ทำเครื่องหมายข้อมูลโทเคนรวม
  ว่าสดใหม่
- ข้อมูลการติดตามเครื่องมือเป็นแบบ best-effort สะพานสามารถแสดงพาธไฟล์ที่
  ปรากฏในอาร์กิวเมนต์/ผลลัพธ์ของเครื่องมือที่รู้จักได้ แต่ยังไม่ส่ง ACP terminals หรือ
  file diff แบบมีโครงสร้าง

## การใช้งาน

```bash
openclaw acp

# Gateway ระยะไกล
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway ระยะไกล (อ่าน token จากไฟล์)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# แนบกับคีย์เซสชันที่มีอยู่แล้ว
openclaw acp --session agent:main:main

# แนบตาม label (ต้องมีอยู่แล้ว)
openclaw acp --session-label "support inbox"

# รีเซ็ตคีย์เซสชันก่อนพรอมป์แรก
openclaw acp --session agent:main:main --reset-session
```

## ไคลเอนต์ ACP (ดีบัก)

ใช้ไคลเอนต์ ACP ที่มีมาให้ในตัวเพื่อตรวจสอบความถูกต้องพื้นฐานของสะพานโดยไม่ต้องใช้ IDE
มันจะเรียกสะพาน ACP ขึ้นมาและให้คุณพิมพ์พรอมป์แบบโต้ตอบได้

```bash
openclaw acp client

# ชี้สะพานที่ถูกเรียกขึ้นไปยัง Gateway ระยะไกล
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# แทนที่คำสั่งเซิร์ฟเวอร์ (ค่าเริ่มต้น: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

โมเดลสิทธิ์ (โหมดดีบักไคลเอนต์):

- การอนุมัติอัตโนมัติใช้ allowlist และใช้กับเฉพาะ tool ID แกนหลักที่เชื่อถือได้เท่านั้น
- การอนุมัติอัตโนมัติของ `read` ถูกจำกัดขอบเขตไว้ที่ไดเรกทอรีทำงานปัจจุบัน (`--cwd` เมื่อกำหนด)
- ACP อนุมัติอัตโนมัติเฉพาะคลาสแบบอ่านอย่างเดียวที่แคบเท่านั้น: การเรียก `read` ที่อยู่ภายใต้ cwd ที่ใช้งานอยู่บวกกับเครื่องมือค้นหาแบบอ่านอย่างเดียว (`search`, `web_search`, `memory_search`) เครื่องมือที่ไม่รู้จัก/ไม่ใช่แกนหลัก การอ่านนอกขอบเขต เครื่องมือที่รันคำสั่งได้ เครื่องมือ control-plane เครื่องมือที่แก้ไขข้อมูล และโฟลว์แบบโต้ตอบ ต้องได้รับการอนุมัติผ่านพรอมป์อย่างชัดเจนเสมอ
- `toolCall.kind` ที่เซิร์ฟเวอร์ให้มาจะถูกถือเป็นเมทาดาทาที่ไม่น่าเชื่อถือ (ไม่ใช่แหล่งสำหรับการอนุญาต)
- นโยบายของสะพาน ACP นี้แยกจากสิทธิ์ของ ACPX harness หากคุณรัน OpenClaw ผ่านแบ็กเอนด์ `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` คือสวิตช์ break-glass แบบ “yolo” สำหรับเซสชัน harness นั้น

## วิธีใช้งาน

ใช้ ACP เมื่อ IDE (หรือไคลเอนต์อื่น) สื่อสารด้วย Agent Client Protocol และคุณต้องการ
ให้มันขับเคลื่อนเซสชัน OpenClaw Gateway

1. ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานอยู่ (ในเครื่องหรือระยะไกล)
2. กำหนดค่าเป้าหมาย Gateway (ผ่านคอนฟิกหรือแฟล็ก)
3. ชี้ IDE ของคุณให้รัน `openclaw acp` ผ่าน stdio

ตัวอย่างคอนฟิก (บันทึกถาวร):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

ตัวอย่างการรันโดยตรง (ไม่เขียนคอนฟิก):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# แนะนำเพื่อความปลอดภัยของโปรเซสในเครื่อง
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## การเลือก agent

ACP จะไม่เลือก agent โดยตรง แต่จะกำหนดเส้นทางผ่านคีย์เซสชันของ Gateway

ใช้คีย์เซสชันที่ผูกกับ agent เพื่อกำหนดเป้าหมายไปยัง agent ที่ต้องการ:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

แต่ละเซสชัน ACP จะถูกแมปกับคีย์เซสชัน Gateway เดียว หนึ่ง agent สามารถมีได้หลาย
เซสชัน; โดยค่าเริ่มต้น ACP จะใช้เซสชัน `acp:<uuid>` แบบแยกต่างหาก เว้นแต่คุณจะระบุแทนที่
คีย์หรือ label

ไม่รองรับ `mcpServers` ต่อเซสชันในโหมดสะพาน หากไคลเอนต์ ACP
ส่งมาระหว่าง `newSession` หรือ `loadSession` สะพานจะส่งข้อผิดพลาดที่ชัดเจนกลับไป
แทนที่จะเพิกเฉยแบบเงียบๆ

หากคุณต้องการให้เซสชันที่ทำงานผ่าน ACPX มองเห็นเครื่องมือ Plugin ของ OpenClaw หรือเครื่องมือ
ในตัวบางตัวที่เลือกไว้ เช่น `cron` ให้เปิดใช้สะพาน ACPX MCP ฝั่ง gateway
แทนการพยายามส่ง `mcpServers` ต่อเซสชัน ดู
[ACP Agents](/th/tools/acp-agents#plugin-tools-mcp-bridge) และ
[สะพาน MCP ของเครื่องมือ OpenClaw](/th/tools/acp-agents#openclaw-tools-mcp-bridge)

## ใช้จาก `acpx` (Codex, Claude, ไคลเอนต์ ACP อื่นๆ)

หากคุณต้องการให้ coding agent เช่น Codex หรือ Claude Code สื่อสารกับ
บอต OpenClaw ของคุณผ่าน ACP ให้ใช้ `acpx` พร้อม target `openclaw`
ที่มีมาให้ในตัว

โฟลว์ทั่วไป:

1. รัน Gateway และตรวจสอบให้แน่ใจว่าสะพาน ACP เข้าถึงได้
2. ชี้ `acpx openclaw` ไปที่ `openclaw acp`
3. กำหนดเป้าหมายคีย์เซสชัน OpenClaw ที่คุณต้องการให้ coding agent ใช้

ตัวอย่าง:

```bash
# คำขอแบบ one-shot ไปยังเซสชัน OpenClaw ACP เริ่มต้นของคุณ
acpx openclaw exec "สรุปสถานะเซสชัน OpenClaw ที่กำลังใช้งานอยู่"

# เซสชันแบบมีชื่อถาวรสำหรับเทิร์นติดตามผล
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "ถาม work agent ของ OpenClaw ของฉันเกี่ยวกับบริบทล่าสุดที่เกี่ยวข้องกับ repo นี้"
```

หากคุณต้องการให้ `acpx openclaw` กำหนดเป้าหมายไปยัง Gateway และคีย์เซสชันเฉพาะทุกครั้ง
ให้แทนที่คำสั่ง agent `openclaw` ใน `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

สำหรับ checkout ของ OpenClaw ภายใน repo ในเครื่อง ให้ใช้ CLI entrypoint โดยตรงแทน
dev runner เพื่อให้สตรีม ACP สะอาด ตัวอย่างเช่น:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

นี่คือวิธีที่ง่ายที่สุดในการให้ Codex, Claude Code หรือไคลเอนต์ที่รองรับ ACP อื่น
ดึงข้อมูลบริบทจาก OpenClaw agent โดยไม่ต้องสแครปจากเทอร์มินัล

## การตั้งค่า Zed editor

เพิ่ม ACP agent แบบกำหนดเองใน `~/.config/zed/settings.json` (หรือใช้ UI การตั้งค่าของ Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

หากต้องการกำหนดเป้าหมาย Gateway หรือ agent เฉพาะ:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

ใน Zed ให้เปิดแผง Agent แล้วเลือก “OpenClaw ACP” เพื่อเริ่มเธรด

## การแมปเซสชัน

โดยค่าเริ่มต้น เซสชัน ACP จะได้รับคีย์เซสชัน Gateway แบบแยกต่างหากโดยมีคำนำหน้า `acp:`
หากต้องการใช้เซสชันที่ทราบอยู่แล้วซ้ำ ให้ส่งคีย์เซสชันหรือ label:

- `--session <key>`: ใช้คีย์เซสชัน Gateway ที่ระบุ
- `--session-label <label>`: resolve เซสชันที่มีอยู่แล้วตาม label
- `--reset-session`: สร้าง session id ใหม่สำหรับคีย์นั้น (คีย์เดิม แต่ transcript ใหม่)

หากไคลเอนต์ ACP ของคุณรองรับ metadata คุณสามารถแทนที่ต่อเซสชันได้:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

ดูข้อมูลเพิ่มเติมเกี่ยวกับคีย์เซสชันได้ที่ [/concepts/session](/th/concepts/session)

## ตัวเลือก

- `--url <url>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นคือ gateway.remote.url เมื่อมีการกำหนดค่าไว้)
- `--token <token>`: โทเค็นยืนยันตัวตนของ Gateway
- `--token-file <path>`: อ่านโทเค็นยืนยันตัวตนของ Gateway จากไฟล์
- `--password <password>`: รหัสผ่านยืนยันตัวตนของ Gateway
- `--password-file <path>`: อ่านรหัสผ่านยืนยันตัวตนของ Gateway จากไฟล์
- `--session <key>`: คีย์เซสชันเริ่มต้น
- `--session-label <label>`: label เซสชันเริ่มต้นที่จะ resolve
- `--require-existing`: ล้มเหลวหากไม่มีคีย์เซสชัน/label ดังกล่าว
- `--reset-session`: รีเซ็ตคีย์เซสชันก่อนใช้งานครั้งแรก
- `--no-prefix-cwd`: ไม่เติมไดเรกทอรีทำงานไว้หน้าพรอมป์
- `--provenance <off|meta|meta+receipt>`: รวม metadata หรือ receipt ของ provenance ของ ACP
- `--verbose, -v`: บันทึกแบบละเอียดไปยัง stderr

หมายเหตุด้านความปลอดภัย:

- `--token` และ `--password` อาจมองเห็นได้ในรายการโปรเซสภายในเครื่องบนบางระบบ
- แนะนำให้ใช้ `--token-file`/`--password-file` หรือตัวแปรสภาพแวดล้อม (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)
- การ resolve การยืนยันตัวตนของ Gateway เป็นไปตามสัญญาร่วมที่ใช้โดยไคลเอนต์ Gateway อื่น:
  - โหมด local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback ไป `gateway.remote.*` เฉพาะเมื่อ `gateway.auth.*` ยังไม่ถูกตั้งค่า (SecretRefs ภายในเครื่องที่ถูกตั้งค่าไว้แต่ resolve ไม่ได้จะ fail closed)
  - โหมด remote: `gateway.remote.*` พร้อม env/config fallback ตามกฎลำดับความสำคัญของ remote
  - `--url` สามารถแทนที่ได้อย่างปลอดภัย และจะไม่ใช้ข้อมูลรับรองจาก config/env แบบ implicit ซ้ำ; ให้ส่ง `--token`/`--password` แบบ explicit (หรือแบบไฟล์)
- โปรเซสลูกของรันไทม์แบ็กเอนด์ ACP จะได้รับ `OPENCLAW_SHELL=acp` ซึ่งสามารถใช้สำหรับกฎ shell/profile ตามบริบทเฉพาะได้
- `openclaw acp client` จะตั้งค่า `OPENCLAW_SHELL=acp-client` ให้กับโปรเซสสะพานที่ถูกเรียกขึ้นมา

### ตัวเลือก `acp client`

- `--cwd <dir>`: ไดเรกทอรีทำงานสำหรับเซสชัน ACP
- `--server <command>`: คำสั่งเซิร์ฟเวอร์ ACP (ค่าเริ่มต้น: `openclaw`)
- `--server-args <args...>`: อาร์กิวเมนต์เพิ่มเติมที่ส่งให้เซิร์ฟเวอร์ ACP
- `--server-verbose`: เปิดใช้การบันทึกแบบละเอียดบนเซิร์ฟเวอร์ ACP
- `--verbose, -v`: การบันทึกแบบละเอียดของไคลเอนต์
