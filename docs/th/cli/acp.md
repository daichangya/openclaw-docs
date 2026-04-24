---
read_when:
    - การตั้งค่าการผสานรวมกับ IDE ที่ใช้ ACP เป็นพื้นฐาน
    - การดีบักการกำหนดเส้นทางเซสชัน ACP ไปยัง Gateway
summary: เรียกใช้ ACP bridge สำหรับการผสานรวมกับ IDE
title: ACP
x-i18n:
    generated_at: "2026-04-24T09:01:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

เรียกใช้ [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) bridge ที่สื่อสารกับ OpenClaw Gateway

คำสั่งนี้สื่อสาร ACP ผ่าน stdio สำหรับ IDE และส่งต่อ prompts ไปยัง Gateway
ผ่าน WebSocket โดยจะคงการแมป ACP sessions เข้ากับ Gateway session keys

`openclaw acp` คือ ACP bridge ที่มี Gateway เป็นแบ็กเอนด์ ไม่ใช่ editor
runtime แบบ ACP-native เต็มรูปแบบ โดยมุ่งเน้นที่การกำหนดเส้นทางเซสชัน การส่ง prompt และการอัปเดตการสตรีมพื้นฐาน

หากคุณต้องการให้ MCP client ภายนอกสื่อสารกับบทสนทนาในแชนแนลของ OpenClaw
โดยตรง แทนการโฮสต์ ACP harness session ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน

## สิ่งนี้ไม่ใช่อะไร

หน้านี้มักถูกสับสนกับ ACP harness sessions

`openclaw acp` หมายถึง:

- OpenClaw ทำหน้าที่เป็น ACP server
- IDE หรือ ACP client เชื่อมต่อกับ OpenClaw
- OpenClaw ส่งต่องานนั้นเข้าไปยัง Gateway session

สิ่งนี้แตกต่างจาก [ACP Agents](/th/tools/acp-agents) ซึ่ง OpenClaw จะเรียกใช้
external harness เช่น Codex หรือ Claude Code ผ่าน `acpx`

กฎแบบสั้น:

- editor/client ต้องการคุย ACP กับ OpenClaw: ใช้ `openclaw acp`
- OpenClaw ควรเรียกใช้ Codex/Claude/Gemini เป็น ACP harness: ใช้ `/acp spawn` และ [ACP Agents](/th/tools/acp-agents)

## ตารางความเข้ากันได้

| ส่วนของ ACP                                                           | สถานะ      | หมายเหตุ                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | รองรับแล้ว | โฟลว์ bridge หลักผ่าน stdio ไปยัง Gateway chat/send + abort                                                                                                                                                                               |
| `listSessions`, slash commands                                        | รองรับแล้ว | รายการเซสชันทำงานกับสถานะเซสชันของ Gateway; คำสั่งจะถูกประกาศผ่าน `available_commands_update`                                                                                                                                         |
| `loadSession`                                                         | บางส่วน    | ผูก ACP session เข้ากับ Gateway session key ใหม่ และเล่นประวัติข้อความ text ของผู้ใช้/assistant ที่เก็บไว้ซ้ำ ประวัติ tool/system ยังไม่ถูกสร้างกลับมาในตอนนี้                                                                          |
| เนื้อหา prompt (`text`, `resource` แบบฝัง, รูปภาพ)                   | บางส่วน    | text/resources จะถูกรวมเป็นอินพุตแชต; รูปภาพจะกลายเป็นไฟล์แนบของ Gateway                                                                                                                                                                 |
| โหมดเซสชัน                                                           | บางส่วน    | รองรับ `session/set_mode` และ bridge เปิดเผยตัวควบคุมเซสชันแบบมี Gateway เป็นแบ็กเอนด์ชุดเริ่มต้นสำหรับระดับความคิด ความละเอียดของเครื่องมือ reasoning รายละเอียดการใช้งาน และ elevated actions ส่วนพื้นผิวโหมด/config แบบ ACP-native ที่กว้างกว่ายังอยู่นอกขอบเขต |
| ข้อมูลเซสชันและการอัปเดตการใช้งาน                                   | บางส่วน    | bridge ส่งการแจ้งเตือน `session_info_update` และ `usage_update` แบบ best-effort จาก Gateway session snapshots ที่แคชไว้ การใช้งานเป็นค่าโดยประมาณและจะส่งเมื่อ Gateway ทำเครื่องหมายว่า token totals เป็นข้อมูลใหม่เท่านั้น             |
| การสตรีม tool                                                        | บางส่วน    | เหตุการณ์ `tool_call` / `tool_call_update` รวม raw I/O เนื้อหา text และตำแหน่งไฟล์แบบ best-effort เมื่อ args/results ของ Gateway tool เปิดเผยข้อมูลเหล่านั้น ส่วน terminal แบบฝังและผลลัพธ์แบบ diff-native ที่สมบูรณ์กว่ายังไม่ถูกเปิดเผย |
| MCP servers แยกตามเซสชัน (`mcpServers`)                              | ไม่รองรับ  | โหมด bridge จะปฏิเสธคำขอ MCP server แยกตามเซสชัน ให้กำหนดค่า MCP บน OpenClaw gateway หรือ agent แทน                                                                                                                                   |
| เมธอด filesystem ของ client (`fs/read_text_file`, `fs/write_text_file`) | ไม่รองรับ  | bridge จะไม่เรียกเมธอด filesystem ของ ACP client                                                                                                                                                                                           |
| เมธอด terminal ของ client (`terminal/*`)                              | ไม่รองรับ  | bridge จะไม่สร้าง ACP client terminals หรือสตรีม terminal ids ผ่านการเรียก tool                                                                                                                                                           |
| การสตรีมแผนเซสชัน / ความคิด                                          | ไม่รองรับ  | ปัจจุบัน bridge ส่ง text เอาต์พุตและสถานะ tool ไม่ใช่การอัปเดตแผนหรือความคิดแบบ ACP                                                                                                                                                    |

## ข้อจำกัดที่ทราบ

- `loadSession` จะเล่นประวัติข้อความ text ของผู้ใช้และ assistant ที่เก็บไว้ซ้ำ แต่จะไม่
  สร้างการเรียก tool ในอดีต system notices หรือ
  ประเภทเหตุการณ์แบบ ACP-native ที่สมบูรณ์กว่ากลับมา
- หาก ACP clients หลายตัวใช้ Gateway session key เดียวกันร่วมกัน การกำหนดเส้นทาง
  เหตุการณ์และการยกเลิกจะเป็นแบบ best-effort มากกว่าการแยกต่อ client อย่างเข้มงวด
  แนะนำให้ใช้เซสชัน `acp:<uuid>` แบบแยกอิสระตามค่าเริ่มต้นเมื่อคุณต้องการ
  เทิร์นที่สะอาดเฉพาะใน editor
- สถานะ stop ของ Gateway จะถูกแปลงเป็น ACP stop reasons แต่การแมปนั้น
  แสดงรายละเอียดได้น้อยกว่ารันไทม์แบบ ACP-native เต็มรูปแบบ
- ตัวควบคุมเซสชันเริ่มต้นในปัจจุบันแสดงเพียงชุดย่อยที่โฟกัสของ knobs ฝั่ง Gateway:
  ระดับความคิด ความละเอียดของเครื่องมือ reasoning รายละเอียดการใช้งาน และ elevated
  actions ขณะนี้การเลือกโมเดลและตัวควบคุม exec-host ยังไม่ถูกเปิดเผยเป็น ACP
  config options
- `session_info_update` และ `usage_update` ถูกอนุมานจาก Gateway session
  snapshots ไม่ใช่การนับรันไทม์แบบ ACP-native สด การใช้งานเป็นค่าโดยประมาณ
  ไม่มีข้อมูลค่าใช้จ่าย และจะส่งเมื่อ Gateway ทำเครื่องหมายว่า total token
  data เป็นข้อมูลใหม่เท่านั้น
- ข้อมูลติดตาม tool เป็นแบบ best-effort bridge สามารถแสดงเส้นทางไฟล์ที่
  ปรากฏใน args/results ของ tool ที่รู้จักได้ แต่ยังไม่ส่ง ACP terminals หรือ
  structured file diffs

## การใช้งาน

```bash
openclaw acp

# Gateway ระยะไกล
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway ระยะไกล (token จากไฟล์)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# แนบกับ session key ที่มีอยู่แล้ว
openclaw acp --session agent:main:main

# แนบตาม label (ต้องมีอยู่แล้ว)
openclaw acp --session-label "support inbox"

# รีเซ็ต session key ก่อน prompt แรก
openclaw acp --session agent:main:main --reset-session
```

## ACP client (ดีบัก)

ใช้ ACP client ในตัวเพื่อตรวจสอบ bridge แบบคร่าว ๆ โดยไม่ต้องใช้ IDE
มันจะเรียก ACP bridge และให้คุณพิมพ์ prompts แบบโต้ตอบได้

```bash
openclaw acp client

# ชี้ bridge ที่ถูกเรียกไปยัง Gateway ระยะไกล
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# แทนที่คำสั่ง server (ค่าเริ่มต้น: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

โมเดลสิทธิ์ (โหมดดีบัก client):

- การอนุมัติอัตโนมัติเป็นแบบ allowlist และใช้กับ trusted core tool IDs เท่านั้น
- การอนุมัติอัตโนมัติสำหรับ `read` ถูกจำกัดขอบเขตที่ไดเรกทอรีทำงานปัจจุบัน (`--cwd` เมื่อกำหนด)
- ACP จะอนุมัติอัตโนมัติเฉพาะคลาส readonly แบบแคบ: การเรียก `read` ที่อยู่ใต้ cwd ปัจจุบันรวมถึง readonly search tools (`search`, `web_search`, `memory_search`) เครื่องมือที่ไม่รู้จัก/ไม่ใช่ core การอ่านนอกขอบเขต เครื่องมือที่สามารถ exec ได้ เครื่องมือ control-plane เครื่องมือที่เปลี่ยนแปลงข้อมูล และโฟลว์แบบโต้ตอบ จะต้องได้รับการอนุมัติผ่าน prompt อย่างชัดเจนเสมอ
- `toolCall.kind` ที่ server ให้มาจะถือเป็น metadata ที่ไม่น่าเชื่อถือ (ไม่ใช่แหล่งที่มาของการอนุญาต)
- นโยบาย ACP bridge นี้แยกจากสิทธิ์ของ ACPX harness หากคุณรัน OpenClaw ผ่านแบ็กเอนด์ `acpx` ค่า `plugins.entries.acpx.config.permissionMode=approve-all` คือสวิตช์แบบ break-glass “yolo” สำหรับ harness session นั้น

## วิธีใช้สิ่งนี้

ใช้ ACP เมื่อ IDE (หรือ client อื่น) สื่อสารด้วย Agent Client Protocol และคุณต้องการ
ให้มันควบคุม Gateway session ของ OpenClaw

1. ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานอยู่ (ภายในเครื่องหรือระยะไกล)
2. กำหนดค่า Gateway เป้าหมาย (ผ่าน config หรือ flags)
3. ชี้ IDE ของคุณให้รัน `openclaw acp` ผ่าน stdio

ตัวอย่าง config (บันทึกถาวร):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

ตัวอย่างการรันตรง (ไม่เขียน config):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# แนะนำเพื่อความปลอดภัยของโปรเซสภายในเครื่อง
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## การเลือก agents

ACP ไม่ได้เลือก agents โดยตรง แต่จะกำหนดเส้นทางตาม Gateway session key

ใช้ session keys ที่ผูกกับ agent เพื่อกำหนดเป้าหมาย agent เฉพาะ:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

แต่ละ ACP session จะถูกแมปไปยัง Gateway session key เดียว หนึ่ง agent สามารถมีได้หลาย
sessions; ACP ใช้เซสชัน `acp:<uuid>` แบบแยกอิสระเป็นค่าเริ่มต้น เว้นแต่คุณจะระบุ
key หรือ label เอง

ไม่รองรับ `mcpServers` แยกตามเซสชันในโหมด bridge หาก ACP client
ส่งมาระหว่าง `newSession` หรือ `loadSession` bridge จะส่ง
ข้อผิดพลาดที่ชัดเจนกลับไปแทนการเพิกเฉยแบบเงียบ ๆ

หากคุณต้องการให้ ACPX-backed sessions มองเห็น OpenClaw Plugin tools หรือ
built-in tools บางตัวที่เลือกไว้ เช่น `cron` ให้เปิดใช้ ACPX MCP bridges ฝั่ง gateway
แทนการพยายามส่ง `mcpServers` แยกตามเซสชัน ดู
[ACP Agents](/th/tools/acp-agents-setup#plugin-tools-mcp-bridge) และ
[OpenClaw tools MCP bridge](/th/tools/acp-agents-setup#openclaw-tools-mcp-bridge)

## ใช้จาก `acpx` (Codex, Claude, ACP clients อื่น ๆ)

หากคุณต้องการให้ coding agent เช่น Codex หรือ Claude Code สื่อสารกับ
บอต OpenClaw ของคุณผ่าน ACP ให้ใช้ `acpx` พร้อม target `openclaw`
ในตัว

โฟลว์ทั่วไป:

1. รัน Gateway และตรวจสอบให้แน่ใจว่า ACP bridge เข้าถึงได้
2. ชี้ `acpx openclaw` ไปที่ `openclaw acp`
3. กำหนดเป้าหมาย OpenClaw session key ที่คุณต้องการให้ coding agent ใช้

ตัวอย่าง:

```bash
# คำขอครั้งเดียวไปยัง OpenClaw ACP session เริ่มต้นของคุณ
acpx openclaw exec "Summarize the active OpenClaw session state."

# เซสชันแบบตั้งชื่อถาวรสำหรับเทิร์นติดตามผล
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

หากคุณต้องการให้ `acpx openclaw` กำหนดเป้าหมาย Gateway และ session key ที่เจาะจงทุกครั้ง
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

สำหรับเช็กเอาต์ OpenClaw ภายใน repo ให้ใช้ CLI entrypoint โดยตรงแทน
dev runner เพื่อให้ ACP stream สะอาด ตัวอย่างเช่น:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

นี่เป็นวิธีที่ง่ายที่สุดในการให้ Codex, Claude Code หรือ ACP-aware client อื่น
ดึงข้อมูลบริบทจากเอเจนต์ OpenClaw โดยไม่ต้อง scrape จากเทอร์มินัล

## การตั้งค่า Zed editor

เพิ่ม ACP agent แบบกำหนดเองใน `~/.config/zed/settings.json` (หรือใช้ Settings UI ของ Zed):

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

โดยค่าเริ่มต้น ACP sessions จะได้รับ Gateway session key แบบแยกอิสระที่มีคำนำหน้า `acp:`
หากต้องการใช้เซสชันที่รู้จักอยู่แล้วซ้ำ ให้ส่ง session key หรือ label:

- `--session <key>`: ใช้ Gateway session key ที่ระบุ
- `--session-label <label>`: resolve เซสชันที่มีอยู่ตาม label
- `--reset-session`: สร้าง session id ใหม่สำหรับ key นั้น (key เดิม, transcript ใหม่)

หาก ACP client ของคุณรองรับ metadata คุณสามารถแทนที่เป็นรายเซสชันได้:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

เรียนรู้เพิ่มเติมเกี่ยวกับ session keys ได้ที่ [/concepts/session](/th/concepts/session)

## ตัวเลือก

- `--url <url>`: Gateway WebSocket URL (ค่าเริ่มต้นใช้ `gateway.remote.url` เมื่อมีการกำหนดค่า)
- `--token <token>`: token สำหรับยืนยันตัวตนกับ Gateway
- `--token-file <path>`: อ่าน token สำหรับยืนยันตัวตนกับ Gateway จากไฟล์
- `--password <password>`: รหัสผ่านสำหรับยืนยันตัวตนกับ Gateway
- `--password-file <path>`: อ่านรหัสผ่านสำหรับยืนยันตัวตนกับ Gateway จากไฟล์
- `--session <key>`: session key เริ่มต้น
- `--session-label <label>`: session label เริ่มต้นที่จะ resolve
- `--require-existing`: ล้มเหลวหากไม่มี session key/label นั้นอยู่
- `--reset-session`: รีเซ็ต session key ก่อนใช้งานครั้งแรก
- `--no-prefix-cwd`: ไม่เติมไดเรกทอรีทำงานไว้หน้าพรอมป์
- `--provenance <off|meta|meta+receipt>`: รวม metadata หรือ receipts ของ ACP provenance
- `--verbose, -v`: บันทึก logs แบบละเอียดไปยัง stderr

หมายเหตุด้านความปลอดภัย:

- `--token` และ `--password` อาจมองเห็นได้ในรายการโปรเซสภายในเครื่องบนบางระบบ
- แนะนำให้ใช้ `--token-file`/`--password-file` หรือตัวแปรสภาพแวดล้อม (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)
- การ resolve การยืนยันตัวตนของ Gateway เป็นไปตามสัญญาแบบใช้ร่วมกันเดียวกับ Gateway clients อื่น:
  - โหมด local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback ไป `gateway.remote.*` เฉพาะเมื่อ `gateway.auth.*` ยังไม่ได้ตั้งค่า (local SecretRefs ที่ถูกตั้งค่าไว้แต่ resolve ไม่ได้จะล้มเหลวแบบปิด)
  - โหมด remote: `gateway.remote.*` พร้อม env/config fallback ตามกฎลำดับความสำคัญของ remote
  - `--url` ปลอดภัยต่อการแทนที่และจะไม่นำข้อมูลรับรองโดยนัยจาก config/env มาใช้ซ้ำ; ให้ส่ง `--token`/`--password` แบบระบุชัดเจน (หรือแบบไฟล์)
- โปรเซสลูกของ ACP runtime backend จะได้รับ `OPENCLAW_SHELL=acp` ซึ่งสามารถใช้กับกฎ shell/profile ตามบริบทได้
- `openclaw acp client` จะตั้งค่า `OPENCLAW_SHELL=acp-client` ให้กับโปรเซส bridge ที่ถูกเรียก

### ตัวเลือกของ `acp client`

- `--cwd <dir>`: ไดเรกทอรีทำงานสำหรับ ACP session
- `--server <command>`: คำสั่ง ACP server (ค่าเริ่มต้น: `openclaw`)
- `--server-args <args...>`: อาร์กิวเมนต์เพิ่มเติมที่ส่งให้ ACP server
- `--server-verbose`: เปิดการบันทึก logs แบบละเอียดบน ACP server
- `--verbose, -v`: การบันทึก logs ของ client แบบละเอียด

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [ACP agents](/th/tools/acp-agents)
