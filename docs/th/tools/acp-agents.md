---
read_when:
    - การรัน harness สำหรับเขียนโค้ดผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับบทสนทนาบนช่องทางการส่งข้อความ
    - การผูกบทสนทนาในช่องทางการส่งข้อความเข้ากับเซสชัน ACP แบบถาวร
    - การแก้ไขปัญหาแบ็กเอนด์ ACP และการเชื่อมต่อ Plugin
    - การดีบักการส่งมอบ completion ของ ACP หรือการวนลูประหว่างเอเจนต์
    - การใช้งานคำสั่ง /acp จากแชต
summary: ใช้เซสชันรันไทม์ ACP สำหรับ Claude Code, Cursor, Gemini CLI, explicit Codex ACP fallback, OpenClaw ACP และเอเจนต์ harness อื่น ๆ
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-04-24T09:34:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

เซสชัน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ช่วยให้ OpenClaw รัน harness ภายนอกสำหรับงานเขียนโค้ด (เช่น Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI และ harness ACPX อื่น ๆ ที่รองรับ) ผ่าน ACP backend Plugin

หากคุณขอให้ OpenClaw ผูกหรือควบคุม Codex ในบทสนทนาปัจจุบันด้วยภาษาปกติ OpenClaw ควรใช้ native Codex app-server plugin (`/codex bind`, `/codex threads`, `/codex resume`) หากคุณขอ `/acp`, ACP, acpx หรือ Codex background child session, OpenClaw ยังสามารถส่ง Codex ผ่าน ACP ได้ การ spawn เซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

หากคุณขอให้ OpenClaw “เริ่ม Claude Code ในเธรด” ด้วยภาษาปกติ หรือใช้ harness ภายนอกอื่น OpenClaw ควรส่งคำขอนั้นไปยังรันไทม์ ACP (ไม่ใช่ native sub-agent runtime)

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็น MCP client ภายนอกโดยตรง
กับบทสนทนาในช่องทางของ OpenClaw ที่มีอยู่ ให้ใช้ [`openclaw mcp serve`](/th/cli/mcp)
แทน ACP

## ฉันต้องการหน้าไหน?

มีพื้นผิวการใช้งานที่อยู่ใกล้กันสามแบบซึ่งสับสนกันได้ง่าย:

| คุณต้องการ...                                                                                  | ใช้สิ่งนี้                           | หมายเหตุ                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ผูกหรือควบคุม Codex ในบทสนทนาปัจจุบัน                                                         | `/codex bind`, `/codex threads`       | เส้นทาง native Codex app-server; รวมการตอบกลับแชตที่ผูกไว้ การส่งต่อรูปภาพ model/fast/permissions การหยุด และการควบคุมการบังคับทิศทาง ACP เป็น fallback แบบ explicit |
| รัน Claude Code, Gemini CLI, explicit Codex ACP หรือ harness ภายนอกอื่น _ผ่าน_ OpenClaw        | หน้านี้: เอเจนต์ ACP                 | เซสชันที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานเบื้องหลัง, ตัวควบคุมรันไทม์                                                  |
| เปิดเผยเซสชัน OpenClaw Gateway _ให้เป็น_ ACP server สำหรับเอดิเตอร์หรือไคลเอนต์              | [`openclaw acp`](/th/cli/acp)            | โหมด bridge IDE/ไคลเอนต์คุย ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                           |
| ใช้ AI CLI ในเครื่องซ้ำเป็นโมเดล fallback แบบข้อความล้วน                                      | [CLI Backends](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีตัวควบคุม ACP ไม่มี harness runtime                                                                                 |

## ใช้งานได้ทันทีเลยหรือไม่?

โดยทั่วไป ใช่ การติดตั้งใหม่จะมาพร้อม runtime plugin `acpx` แบบ bundled ที่เปิดใช้งานตามค่าเริ่มต้น พร้อมไบนารี `acpx` ที่ตรึงเวอร์ชันไว้ในระดับ Plugin ซึ่ง OpenClaw จะตรวจสอบและซ่อมแซมตัวเองตอนเริ่มทำงาน รัน `/acp doctor` เพื่อตรวจสอบความพร้อมใช้งาน

ข้อควรระวังในการใช้งานครั้งแรก:

- อะแดปเตอร์ของ harness เป้าหมาย (Codex, Claude ฯลฯ) อาจถูกดึงแบบ on demand ด้วย `npx` ในครั้งแรกที่คุณใช้งาน
- การยืนยันตัวตนของผู้ให้บริการยังคงต้องมีอยู่บนโฮสต์สำหรับ harness นั้น
- หากโฮสต์ไม่มี npm หรือไม่มีการเข้าถึงเครือข่าย การดึงอะแดปเตอร์ครั้งแรกจะล้มเหลวจนกว่าจะอุ่นแคชไว้ล่วงหน้าหรือติดตั้งอะแดปเตอร์ด้วยวิธีอื่น

## คู่มือปฏิบัติการสำหรับผู้ดูแล

โฟลว์ `/acp` แบบรวดเร็วจากแชต:

1. **Spawn** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` หรือ `/acp spawn codex --bind here` แบบ explicit
2. **ทำงาน** ในบทสนทนาหรือเธรดที่ผูกไว้ (หรือระบุ session key เป้าหมายโดยตรง)
3. **ตรวจสอบสถานะ** — `/acp status`
4. **ปรับแต่ง** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **บังคับทิศทาง** โดยไม่แทนที่บริบท — `/acp steer tighten logging and continue`
6. **หยุด** — `/acp cancel` (เทิร์นปัจจุบัน) หรือ `/acp close` (เซสชัน + การผูก)

ทริกเกอร์ภาษาธรรมชาติที่ควรถูกส่งไปยัง native Codex plugin:

- "Bind this Discord channel to Codex."
- "Attach this chat to Codex thread `<id>`."
- "Show Codex threads, then bind this one."

การผูกบทสนทนา Codex แบบ native เป็นเส้นทางควบคุมแชตตามค่าเริ่มต้น แต่จงใจทำอย่างระมัดระวังสำหรับโฟลว์การอนุมัติ/เครื่องมือแบบโต้ตอบของ Codex: เครื่องมือแบบไดนามิกของ OpenClaw และพรอมป์การอนุมัติยังไม่ถูกเปิดเผยผ่านเส้นทางแชตที่ผูกไว้นี้ ดังนั้นคำขอเหล่านั้นจะถูกปฏิเสธพร้อมคำอธิบายที่ชัดเจน ใช้เส้นทาง Codex harness หรือ explicit ACP fallback เมื่อเวิร์กโฟลว์ต้องพึ่งพาเครื่องมือแบบไดนามิกของ OpenClaw หรือการอนุมัติแบบโต้ตอบที่ใช้เวลานาน

ทริกเกอร์ภาษาธรรมชาติที่ควรถูกส่งไปยังรันไทม์ ACP:

- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
- "Run Codex through ACP in a background thread."

OpenClaw จะเลือก `runtime: "acp"` แก้หา `agentId` ของ harness ผูกกับบทสนทนาหรือเธรดปัจจุบันเมื่อรองรับ และส่งคำติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะใช้เส้นทางนี้ก็ต่อเมื่อมีการระบุ ACP อย่าง explicit หรือรันไทม์เบื้องหลังที่ร้องขอยังต้องใช้ ACP

## ACP เทียบกับ sub-agent

ใช้ ACP เมื่อคุณต้องการ harness runtime ภายนอก ใช้ native Codex app-server สำหรับการผูก/ควบคุมบทสนทนา Codex ใช้ sub-agent เมื่อคุณต้องการ delegated run แบบ native ของ OpenClaw

| พื้นที่       | เซสชัน ACP                            | การรัน sub-agent                    |
| ------------- | ------------------------------------- | ----------------------------------- |
| รันไทม์       | ACP backend plugin (เช่น acpx)        | native sub-agent runtime ของ OpenClaw |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| คำสั่งหลัก    | `/acp ...`                            | `/subagents ...`                    |
| เครื่องมือ spawn | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (รันไทม์ค่าเริ่มต้น) |

ดูเพิ่มเติมที่ [Sub-agents](/th/tools/subagents)

## ACP รัน Claude Code อย่างไร

สำหรับ Claude Code ผ่าน ACP สแตกคือ:

1. control plane ของเซสชัน OpenClaw ACP
2. runtime plugin `acpx` แบบ bundled
3. Claude ACP adapter
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ความแตกต่างสำคัญ:

- ACP Claude เป็นเซสชัน harness ที่มีตัวควบคุม ACP การ resume เซสชัน การติดตามงานเบื้องหลัง และการผูกบทสนทนา/เธรดเพิ่มเติมตามต้องการ
- CLI backend เป็นรันไทม์ fallback ในเครื่องแบบข้อความล้วนที่แยกออกจากกัน ดู [CLI Backends](/th/gateway/cli-backends)

สำหรับผู้ดูแล กฎเชิงปฏิบัติคือ:

- หากต้องการ `/acp spawn`, เซสชันที่ผูกได้ ตัวควบคุมรันไทม์ หรือการทำงานของ harness แบบถาวร: ใช้ ACP
- หากต้องการ fallback ข้อความแบบง่ายในเครื่องผ่าน CLI ดิบ: ใช้ CLI backends

## เซสชันที่ผูกไว้

### การผูกกับบทสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` จะตรึงบทสนทนาปัจจุบันเข้ากับเซสชัน ACP ที่ถูก spawn — ไม่มี child thread ใช้พื้นผิวแชตเดิม OpenClaw ยังคงเป็นเจ้าของ transport, auth, safety และการส่งมอบ ข้อความติดตามผลในบทสนทนานั้นจะถูกส่งไปยังเซสชันเดิม `/new` และ `/reset` จะรีเซ็ตเซสชันในที่เดิม และ `/acp close` จะลบการผูก

โมเดลทางความคิด:

- **พื้นผิวแชต** — ที่ที่ผู้คนยังคุยกันต่อไป (ช่อง Discord, หัวข้อ Telegram, แชต iMessage)
- **เซสชัน ACP** — สถานะรันไทม์ Codex/Claude/Gemini แบบคงทนที่ OpenClaw ส่งต่อให้
- **child thread/topic** — พื้นผิวการส่งข้อความเพิ่มเติมตามต้องการ ซึ่งจะถูกสร้างเฉพาะโดย `--thread ...`
- **workspace ของรันไทม์** — ตำแหน่งในระบบไฟล์ (`cwd`, checkout ของรีโป, backend workspace) ที่ harness ทำงาน อยู่เป็นอิสระจากพื้นผิวแชต

ตัวอย่าง:

- `/codex bind` — คงแชตนี้ไว้ spawn หรือแนบ native Codex app-server แล้วส่งข้อความในอนาคตมาที่นี่
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — ปรับ native Codex thread ที่ผูกไว้จากแชต
- `/codex stop` หรือ `/codex steer focus on the failing tests first` — ควบคุมเทิร์น native Codex ที่กำลังทำงาน
- `/acp spawn codex --bind here` — explicit ACP fallback สำหรับ Codex
- `/acp spawn codex --thread auto` — OpenClaw อาจสร้าง child thread/topic และผูกไว้ที่นั่น
- `/acp spawn codex --bind here --cwd /workspace/repo` — ผูกกับแชตเดิม แต่ Codex รันใน `/workspace/repo`

หมายเหตุ:

- `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
- `--bind here` ใช้ได้เฉพาะกับช่องทางที่ประกาศว่ารองรับการผูกกับบทสนทนาปัจจุบัน OpenClaw จะส่งข้อความแจ้งชัดเจนหากไม่รองรับ การผูกจะคงอยู่ข้ามการรีสตาร์ต gateway
- บน Discord, `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้าง child thread สำหรับ `--thread auto|here` — ไม่จำเป็นสำหรับ `--bind here`
- หากคุณ spawn ไปยัง ACP agent อื่นโดยไม่มี `--cwd`, OpenClaw จะสืบทอด workspace ของ **เอเจนต์เป้าหมาย** ตามค่าเริ่มต้น หาก path ที่สืบทอดมาไม่มีอยู่ (`ENOENT`/`ENOTDIR`) จะ fallback ไปยังค่าเริ่มต้นของ backend; แต่ข้อผิดพลาดการเข้าถึงอื่น ๆ (เช่น `EACCES`) จะถูกแสดงเป็นข้อผิดพลาดในการ spawn

### เซสชันที่ผูกกับเธรด

เมื่อเปิดใช้การผูกกับเธรดสำหรับ channel adapter แล้ว เซสชัน ACP สามารถผูกกับเธรดได้:

- OpenClaw ผูกเธรดเข้ากับเซสชัน ACP เป้าหมาย
- ข้อความติดตามผลในเธรดนั้นจะถูกส่งไปยังเซสชัน ACP ที่ผูกไว้
- เอาต์พุต ACP จะถูกส่งกลับไปยังเธรดเดียวกัน
- การ unfocus/close/archive/หมดเวลาขณะไม่ใช้งาน หรือหมดอายุตามอายุสูงสุด จะลบการผูกออก

การรองรับการผูกกับเธรดขึ้นอยู่กับ adapter หาก channel adapter ที่ใช้งานอยู่ไม่รองรับการผูกกับเธรด OpenClaw จะส่งข้อความ unsupported/unavailable ที่ชัดเจนกลับมา

feature flag ที่จำเป็นสำหรับ ACP แบบผูกกับเธรด:

- `acp.enabled=true`
- `acp.dispatch.enabled` เปิดอยู่ตามค่าเริ่มต้น (ตั้งเป็น `false` เพื่อพักการ dispatch ของ ACP)
- เปิด flag การ spawn เธรด ACP ของ channel adapter (ขึ้นอยู่กับ adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### ช่องทางที่รองรับเธรด

- channel adapter ใด ๆ ที่เปิดเผยความสามารถในการผูกเซสชัน/เธรด
- การรองรับในตัวปัจจุบัน:
  - เธรด/ช่องของ Discord
  - หัวข้อ Telegram (forum topic ในกลุ่ม/supergroup และหัวข้อ DM)
- ช่องทาง Plugin สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการผูกเดียวกันได้

## การตั้งค่าเฉพาะช่องทาง

สำหรับเวิร์กโฟลว์ที่ไม่ใช่แบบชั่วคราว ให้กำหนดค่าการผูก ACP แบบถาวรในรายการ `bindings[]` ระดับบนสุด

### โมเดลการผูก

- `bindings[].type="acp"` ทำเครื่องหมายว่าเป็นการผูกบทสนทนา ACP แบบถาวร
- `bindings[].match` ระบุบทสนทนาเป้าหมาย:
  - ช่องหรือเธรด Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - หัวข้อ forum ของ Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - แชต DM/กลุ่มของ BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    ควรใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับการผูกกลุ่มที่เสถียร
  - แชต DM/กลุ่มของ iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    ควรใช้ `chat_id:*` สำหรับการผูกกลุ่มที่เสถียร
- `bindings[].agentId` คือ agent id ของ OpenClaw ที่เป็นเจ้าของ
- การ override ACP แบบไม่บังคับอยู่ภายใต้ `bindings[].acp`:
  - `mode` (`persistent` หรือ `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### ค่าเริ่มต้นของรันไทม์ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้น ACP หนึ่งครั้งต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ลำดับความสำคัญของการ override สำหรับเซสชัน ACP ที่ผูกไว้:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. ค่าเริ่มต้น ACP ระดับโกลบอล (เช่น `acp.backend`)

ตัวอย่าง:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

พฤติกรรม:

- OpenClaw จะตรวจสอบให้แน่ใจว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่ก่อนใช้งาน
- ข้อความในช่องหรือหัวข้อนั้นจะถูกส่งไปยังเซสชัน ACP ที่กำหนดค่าไว้
- ในบทสนทนาที่ผูกไว้ `/new` และ `/reset` จะรีเซ็ต session key ของ ACP เดิมในที่เดิม
- การผูกรันไทม์ชั่วคราว (เช่น ที่สร้างโดยโฟลว์โฟกัสเธรด) ยังคงมีผลเมื่อมีอยู่
- สำหรับการ spawn ACP ข้ามเอเจนต์โดยไม่มี `cwd` แบบ explicit, OpenClaw จะสืบทอด workspace ของเอเจนต์เป้าหมายจาก config ของเอเจนต์
- path ของ workspace ที่สืบทอดมาแต่ไม่มีอยู่จะ fallback ไปยัง cwd ค่าเริ่มต้นของ backend; ความล้มเหลวในการเข้าถึงที่ไม่ใช่กรณี path ไม่มีอยู่จะถูกแสดงเป็นข้อผิดพลาดในการ spawn

## เริ่มเซสชัน ACP (อินเทอร์เฟซ)

### จาก `sessions_spawn`

ใช้ `runtime: "acp"` เพื่อเริ่มเซสชัน ACP จากเทิร์นของเอเจนต์หรือการเรียกใช้เครื่องมือ

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

หมายเหตุ:

- `runtime` มีค่าเริ่มต้นเป็น `subagent` ดังนั้นให้ตั้ง `runtime: "acp"` แบบ explicit สำหรับเซสชัน ACP
- หากละ `agentId` ไว้ OpenClaw จะใช้ `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้
- `mode: "session"` ต้องใช้ร่วมกับ `thread: true` เพื่อคงบทสนทนาที่ผูกไว้แบบถาวร

รายละเอียดของอินเทอร์เฟซ:

- `task` (จำเป็น): พรอมป์เริ่มต้นที่ส่งไปยังเซสชัน ACP
- `runtime` (จำเป็นสำหรับ ACP): ต้องเป็น `"acp"`
- `agentId` (ไม่บังคับ): harness id ของ ACP เป้าหมาย จะ fallback ไปยัง `acp.defaultAgent` หากตั้งค่าไว้
- `thread` (ไม่บังคับ, ค่าเริ่มต้น `false`): ขอใช้โฟลว์การผูกกับเธรดเมื่อรองรับ
- `mode` (ไม่บังคับ): `run` (one-shot) หรือ `session` (ถาวร)
  - ค่าเริ่มต้นคือ `run`
  - หาก `thread: true` และไม่ได้ระบุ mode ไว้ OpenClaw อาจใช้พฤติกรรมแบบถาวรตามค่าเริ่มต้นตามเส้นทางรันไทม์
  - `mode: "session"` ต้องใช้ `thread: true`
- `cwd` (ไม่บังคับ): ไดเรกทอรีทำงานของรันไทม์ที่ร้องขอ (ตรวจสอบโดยนโยบาย backend/runtime) หากไม่ระบุ ACP spawn จะสืบทอด workspace ของเอเจนต์เป้าหมายเมื่อมีการกำหนดค่าไว้ path ที่สืบทอดมาแต่ไม่มีอยู่จะ fallback ไปยังค่าเริ่มต้นของ backend ขณะที่ข้อผิดพลาดการเข้าถึงจริงจะถูกส่งกลับ
- `label` (ไม่บังคับ): label สำหรับผู้ดูแลที่ใช้ในข้อความของเซสชัน/แบนเนอร์
- `resumeSessionId` (ไม่บังคับ): resume เซสชัน ACP ที่มีอยู่แทนการสร้างใหม่ เอเจนต์จะ replay ประวัติบทสนทนาผ่าน `session/load` ต้องใช้ `runtime: "acp"`
- `streamTo` (ไม่บังคับ): `"parent"` จะสตรีมสรุปความคืบหน้าของการรัน ACP เริ่มต้นกลับไปยังเซสชันผู้ร้องขอในรูป system event
  - เมื่อมีให้ใช้ การตอบกลับที่ยอมรับแล้วจะรวม `streamLogPath` ซึ่งชี้ไปยังล็อก JSONL แบบผูกกับเซสชัน (`<sessionId>.acp-stream.jsonl`) ที่คุณสามารถ tail เพื่อติดตามประวัติการส่งต่อทั้งหมดได้
- `model` (ไม่บังคับ): override โมเดลแบบ explicit สำหรับเซสชันลูก ACP จะมีผลกับ `runtime: "acp"` เพื่อให้เซสชันลูกใช้โมเดลที่ร้องขอแทนการ fallback ไปยังค่าเริ่มต้นของเอเจนต์เป้าหมายแบบเงียบ ๆ

## โมเดลการส่งมอบ

เซสชัน ACP อาจเป็นได้ทั้ง workspace แบบโต้ตอบหรือเป็นงานเบื้องหลังที่มี parent เป็นเจ้าของ เส้นทางการส่งมอบขึ้นอยู่กับรูปแบบนั้น

### เซสชัน ACP แบบโต้ตอบ

เซสชันแบบโต้ตอบมีไว้เพื่อพูดคุยต่อบนพื้นผิวแชตที่มองเห็นได้:

- `/acp spawn ... --bind here` จะผูกบทสนทนาปัจจุบันเข้ากับเซสชัน ACP
- `/acp spawn ... --thread ...` จะผูกเธรด/หัวข้อของช่องเข้ากับเซสชัน ACP
- `bindings[].type="acp"` แบบถาวรที่กำหนดค่าไว้จะส่งบทสนทนาที่ตรงเงื่อนไขไปยังเซสชัน ACP เดิม

ข้อความติดตามผลในบทสนทนาที่ผูกไว้จะถูกส่งตรงไปยังเซสชัน ACP และเอาต์พุต ACP จะถูกส่งกลับไปยังช่อง/เธรด/หัวข้อนั้นโดยตรง

### เซสชัน ACP แบบ one-shot ที่มี parent เป็นเจ้าของ

เซสชัน ACP แบบ one-shot ที่ถูก spawn โดยการรันของเอเจนต์อื่นเป็น child เบื้องหลัง คล้ายกับ sub-agent:

- parent ขอให้งานทำผ่าน `sessions_spawn({ runtime: "acp", mode: "run" })`
- child รันในเซสชัน harness ACP ของตัวเอง
- การทำงานเสร็จจะรายงานกลับผ่านเส้นทางประกาศการทำงานเสร็จภายใน
- parent จะเขียนผลลัพธ์ของ child ใหม่ด้วยน้ำเสียงผู้ช่วยปกติเมื่อมีประโยชน์ที่จะตอบให้ผู้ใช้เห็น

อย่ามองเส้นทางนี้เป็นแชตแบบ peer-to-peer ระหว่าง parent กับ child เพราะ child มีช่องทางส่งผลลัพธ์เมื่อเสร็จกลับไปยัง parent อยู่แล้ว

### `sessions_send` และการส่งมอบแบบ A2A

`sessions_send` สามารถกำหนดเป้าหมายไปยังอีกเซสชันหนึ่งหลังการ spawn ได้ สำหรับเซสชันแบบ peer ปกติ OpenClaw จะใช้เส้นทางติดตามผลแบบ agent-to-agent (A2A) หลังจากแทรกข้อความแล้ว:

- รอการตอบกลับของเซสชันเป้าหมาย
- เลือกได้ว่าจะให้ผู้ร้องขอและเป้าหมายแลกเปลี่ยนข้อความติดตามผลกันตามจำนวนรอบที่จำกัด
- ขอให้เป้าหมายสร้างข้อความประกาศ
- ส่งประกาศนั้นไปยังช่องหรือเธรดที่มองเห็นได้

เส้นทาง A2A นั้นเป็น fallback สำหรับการส่งไปยัง peer ในกรณีที่ผู้ส่งต้องการการติดตามผลที่มองเห็นได้ เส้นทางนี้จะยังคงเปิดใช้งานเมื่อเซสชันที่ไม่เกี่ยวข้องสามารถมองเห็นและส่งข้อความไปยัง ACP เป้าหมายได้ เช่น ภายใต้การตั้งค่า `tools.sessions.visibility` ที่กว้าง

OpenClaw จะข้ามการติดตามผลแบบ A2A เฉพาะเมื่อผู้ร้องขอเป็น parent ของ child ACP แบบ one-shot ที่มี parent เป็นเจ้าของเอง ในกรณีนั้น การรัน A2A ทับบนการทำงานเสร็จอาจปลุก parent ด้วยผลลัพธ์ของ child ส่งต่อคำตอบของ parent กลับเข้าไปใน child และสร้างลูป echo ระหว่าง parent/child ผลลัพธ์ของ `sessions_send` จะรายงาน `delivery.status="skipped"` สำหรับกรณี owned-child นี้ เพราะเส้นทางการทำงานเสร็จรับผิดชอบผลลัพธ์อยู่แล้ว

### Resume เซสชันที่มีอยู่

ใช้ `resumeSessionId` เพื่อทำต่อจากเซสชัน ACP ก่อนหน้าแทนการเริ่มใหม่ เอเจนต์จะ replay ประวัติบทสนทนาผ่าน `session/load` ดังนั้นจึงสามารถทำงานต่อพร้อมบริบทครบถ้วนของสิ่งที่เกิดขึ้นก่อนหน้า

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

กรณีใช้งานทั่วไป:

- ส่งต่องานเซสชัน Codex จากแล็ปท็อปของคุณไปยังโทรศัพท์ — บอกเอเจนต์ของคุณให้ทำต่อจากจุดที่ค้างไว้
- ทำงานเขียนโค้ดต่อจากเซสชันที่คุณเริ่มแบบโต้ตอบใน CLI ตอนนี้แบบ headless ผ่านเอเจนต์ของคุณ
- ทำงานต่อจากที่ถูกขัดจังหวะโดย gateway restart หรือ idle timeout

หมายเหตุ:

- `resumeSessionId` ต้องใช้ `runtime: "acp"` — จะส่งคืนข้อผิดพลาดหากใช้กับรันไทม์ sub-agent
- `resumeSessionId` จะคืนค่าประวัติบทสนทนา ACP ต้นทาง ส่วน `thread` และ `mode` ยังคงมีผลตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังคงต้องใช้ `thread: true`
- เอเจนต์เป้าหมายต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
- หากไม่พบ session ID การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน — ไม่มีการ fallback แบบเงียบ ๆ ไปยังเซสชันใหม่

<Accordion title="ทดสอบ smoke หลัง deploy">

หลัง deploy gateway ให้รันการตรวจสอบ end-to-end แบบ live แทนการเชื่อเพียง unit test:

1. ตรวจสอบเวอร์ชันและ commit ของ gateway ที่ deploy บนโฮสต์เป้าหมาย
2. เปิดเซสชัน bridge ACPX ชั่วคราวไปยังเอเจนต์จริง
3. ขอให้เอเจนต์นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` และ task `Reply with exactly LIVE-ACP-SPAWN-OK`
4. ตรวจสอบ `accepted=yes`, มี `childSessionKey` จริง และไม่มีข้อผิดพลาดจาก validator
5. ล้างเซสชัน bridge ชั่วคราว

ให้คงเกตไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` — เส้นทาง `mode: "session"` แบบผูกกับเธรดและเส้นทาง stream-relay เป็นการทดสอบการเชื่อมต่อที่แยกออกไปและสมบูรณ์ยิ่งขึ้น

</Accordion>

## ความเข้ากันได้ของ sandbox

ปัจจุบันเซสชัน ACP รันบนรันไทม์ของโฮสต์ ไม่ได้รันภายใน sandbox ของ OpenClaw

ข้อจำกัดปัจจุบัน:

- หากเซสชันผู้ร้องขออยู่ใน sandbox การ spawn ACP จะถูกบล็อกทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
  - ข้อผิดพลาด: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` ที่ใช้ `runtime: "acp"` ไม่รองรับ `sandbox: "require"`
  - ข้อผิดพลาด: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

ใช้ `runtime: "subagent"` เมื่อคุณต้องการการรันที่ถูกบังคับใช้ด้วย sandbox

### จากคำสั่ง `/acp`

ใช้ `/acp spawn` เพื่อควบคุมแบบ explicit จากแชตเมื่อจำเป็น

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

แฟล็กสำคัญ:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

ดู [Slash Commands](/th/tools/slash-commands)

## การแก้หาเป้าหมายเซสชัน

การทำงานส่วนใหญ่ของ `/acp` ยอมรับเป้าหมายเซสชันแบบไม่บังคับ (`session-key`, `session-id` หรือ `session-label`)

ลำดับการแก้หา:

1. อาร์กิวเมนต์เป้าหมายแบบ explicit (หรือ `--session` สำหรับ `/acp steer`)
   - ลองเป็น key ก่อน
   - จากนั้นเป็น session id ที่มีรูปแบบ UUID
   - จากนั้นเป็น label
2. การผูกกับเธรดปัจจุบัน (หากบทสนทนา/เธรดนี้ถูกผูกกับเซสชัน ACP)
3. fallback ไปยังเซสชันของผู้ร้องขอปัจจุบัน

ทั้งการผูกกับบทสนทนาปัจจุบันและการผูกกับเธรดจะเข้าร่วมในขั้นตอนที่ 2

หากไม่สามารถแก้หาเป้าหมายได้ OpenClaw จะส่งข้อผิดพลาดที่ชัดเจน (`Unable to resolve session target: ...`)

## โหมดการผูกตอน spawn

`/acp spawn` รองรับ `--bind here|off`

| โหมด  | พฤติกรรม                                                              |
| ------ | ---------------------------------------------------------------------- |
| `here` | ผูกบทสนทนาที่ใช้งานอยู่ปัจจุบันในที่เดิม; ล้มเหลวหากไม่มีบทสนทนาที่ใช้งานอยู่ |
| `off`  | ไม่สร้างการผูกกับบทสนทนาปัจจุบัน                                      |

หมายเหตุ:

- `--bind here` เป็นเส้นทางสำหรับผู้ดูแลที่ง่ายที่สุดสำหรับ “ทำให้ช่องหรือแชตนี้รองรับ Codex”
- `--bind here` จะไม่สร้าง child thread
- `--bind here` ใช้ได้เฉพาะกับช่องทางที่เปิดเผยการรองรับการผูกกับบทสนทนาปัจจุบัน
- `--bind` และ `--thread` ไม่สามารถใช้ร่วมกันในการเรียก `/acp spawn` เดียวกันได้

## โหมดเธรดตอน spawn

`/acp spawn` รองรับ `--thread auto|here|off`

| โหมด  | พฤติกรรม                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `auto` | ถ้าอยู่ในเธรดที่ใช้งานอยู่: ผูกเธรดนั้น นอกเธรด: สร้าง/ผูก child thread เมื่อรองรับ |
| `here` | ต้องอยู่ในเธรดที่ใช้งานอยู่ปัจจุบัน; ล้มเหลวหากไม่ได้อยู่ในเธรด                                                  |
| `off`  | ไม่มีการผูก เซสชันจะเริ่มแบบไม่ผูกไว้                                                                     |

หมายเหตุ:

- บนพื้นผิวที่ไม่รองรับการผูกกับเธรด พฤติกรรมค่าเริ่มต้นจะเทียบเท่ากับ `off`
- การ spawn แบบผูกกับเธรดต้องการการรองรับจากนโยบายของช่องทาง:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- ใช้ `--bind here` เมื่อคุณต้องการตรึงบทสนทนาปัจจุบันโดยไม่สร้าง child thread

## ตัวควบคุม ACP

| คำสั่ง               | สิ่งที่ทำ                                                     | ตัวอย่าง                                                      |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; จะผูกกับตำแหน่งปัจจุบันหรือผูกกับเธรดก็ได้ตามต้องการ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิกเทิร์นที่กำลังทำงานสำหรับเซสชันเป้าหมาย                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่ง steer ไปยังเซสชันที่กำลังทำงาน                      | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและยกเลิกการผูกเป้าหมายของเธรด                      | `/acp close`                                                  |
| `/acp status`        | แสดง backend, mode, state, ตัวเลือกของรันไทม์ และความสามารถ | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่าโหมดรันไทม์สำหรับเซสชันเป้าหมาย                        | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือก config ของรันไทม์แบบทั่วไป                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่า override ไดเรกทอรีทำงานของรันไทม์                     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ                               | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่า timeout ของรันไทม์ (วินาที)                           | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่า override โมเดลของรันไทม์                              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบ override ตัวเลือกของรันไทม์ของเซสชัน                       | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจากสโตร์                           | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพของ backend, ความสามารถ, วิธีแก้ไขที่ทำได้จริง         | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนการติดตั้งและเปิดใช้งานแบบกำหนดแน่นอน            | `/acp install`                                                |

`/acp status` จะแสดงตัวเลือกของรันไทม์ที่มีผลจริง พร้อมตัวระบุเซสชันทั้งในระดับรันไทม์และระดับ backend ข้อผิดพลาดกรณีไม่รองรับการควบคุมจะถูกแสดงอย่างชัดเจนเมื่อ backend ขาดความสามารถนั้น `/acp sessions` จะอ่านสโตร์สำหรับเซสชันที่ผูกอยู่ปัจจุบันหรือเซสชันของผู้ร้องขอปัจจุบัน โดย token ของเป้าหมาย (`session-key`, `session-id` หรือ `session-label`) จะถูกแก้หาผ่านการค้นหาเซสชันของ gateway รวมถึงราก `session.store` แบบกำหนดเองต่อเอเจนต์

## การแมปตัวเลือกของรันไทม์

`/acp` มีทั้งคำสั่งอำนวยความสะดวกและตัวตั้งค่าแบบทั่วไป

การทำงานที่เทียบเท่ากัน:

- `/acp model <id>` ถูกแมปไปยังคีย์ config ของรันไทม์ `model`
- `/acp permissions <profile>` ถูกแมปไปยังคีย์ config ของรันไทม์ `approval_policy`
- `/acp timeout <seconds>` ถูกแมปไปยังคีย์ config ของรันไทม์ `timeout`
- `/acp cwd <path>` อัปเดต override ของ cwd ของรันไทม์โดยตรง
- `/acp set <key> <value>` เป็นเส้นทางแบบทั่วไป
  - กรณีพิเศษ: `key=cwd` จะใช้เส้นทาง override ของ cwd
- `/acp reset-options` จะล้าง override ของรันไทม์ทั้งหมดสำหรับเซสชันเป้าหมาย

## acpx harness, การตั้งค่า Plugin และสิทธิ์

สำหรับการกำหนดค่า acpx harness (alias ของ Claude Code / Codex / Gemini CLI), MCP bridge ของ plugin-tools และ OpenClaw-tools และโหมดสิทธิ์ของ ACP ดูที่
[เอเจนต์ ACP — การตั้งค่า](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ                                                                        | สาเหตุที่เป็นไปได้                                                               | วิธีแก้                                                                                                                                                                    |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                       | ไม่มี backend plugin หรือถูกปิดใช้งาน                                            | ติดตั้งและเปิดใช้งาน backend plugin แล้วรัน `/acp doctor`                                                                                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                               | ACP ถูกปิดใช้งานในระดับโกลบอล                                                   | ตั้งค่า `acp.enabled=true`                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`             | การ dispatch จากข้อความเธรดปกติถูกปิดใช้งาน                                     | ตั้งค่า `acp.dispatch.enabled=true`                                                                                                                                        |
| `ACP agent "<id>" is not allowed by policy`                                   | เอเจนต์ไม่อยู่ใน allowlist                                                       | ใช้ `agentId` ที่อนุญาตหรืออัปเดต `acp.allowedAgents`                                                                                                                     |
| `Unable to resolve session target: ...`                                       | token ของ key/id/label ไม่ถูกต้อง                                                | รัน `/acp sessions`, คัดลอก key/label ที่ถูกต้อง แล้วลองอีกครั้ง                                                                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation`   | ใช้ `--bind here` โดยไม่มีบทสนทนาที่ผูกได้ซึ่งกำลังใช้งานอยู่                    | ย้ายไปยังแชต/ช่องเป้าหมายแล้วลองอีกครั้ง หรือใช้การ spawn แบบไม่ผูก                                                                                                       |
| `Conversation bindings are unavailable for <channel>.`                        | adapter ไม่มีความสามารถ ACP สำหรับการผูกกับบทสนทนาปัจจุบัน                      | ใช้ `/acp spawn ... --thread ...` เมื่อรองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องทางที่รองรับ                                                               |
| `--thread here requires running /acp spawn inside an active ... thread`       | ใช้ `--thread here` นอกบริบทของเธรด                                              | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`                 | ผู้ใช้อื่นเป็นเจ้าของเป้าหมายการผูกที่ใช้งานอยู่                                | ผูกใหม่ในฐานะเจ้าของ หรือใช้บทสนทนาหรือเธรดอื่น                                                                                                                           |
| `Thread bindings are unavailable for <channel>.`                              | adapter ไม่มีความสามารถในการผูกกับเธรด                                           | ใช้ `--thread off` หรือย้ายไปยัง adapter/ช่องที่รองรับ                                                                                                                     |
| `Sandboxed sessions cannot spawn ACP sessions ...`                            | รันไทม์ ACP อยู่ฝั่งโฮสต์; เซสชันผู้ร้องขออยู่ใน sandbox                         | ใช้ `runtime="subagent"` จากเซสชันที่อยู่ใน sandbox หรือรัน ACP spawn จากเซสชันที่ไม่อยู่ใน sandbox                                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`       | มีการร้องขอ `sandbox="require"` สำหรับรันไทม์ ACP                                | ใช้ `runtime="subagent"` เมื่อต้องการ sandbox แบบบังคับ หรือใช้ ACP กับ `sandbox="inherit"` จากเซสชันที่ไม่อยู่ใน sandbox                                                |
| ไม่มีเมทาดาทา ACP สำหรับเซสชันที่ผูกไว้                                        | เมทาดาทาของเซสชัน ACP เก่าหรือถูกลบ                                              | สร้างใหม่ด้วย `/acp spawn` แล้วผูกใหม่/โฟกัสเธรดอีกครั้ง                                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`      | `permissionMode` บล็อกการเขียน/exec ในเซสชัน ACP แบบไม่โต้ตอบ                    | ตั้ง `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ต gateway ดู [การกำหนดค่าสิทธิ์](/th/tools/acp-agents-setup#permission-configuration)        |
| เซสชัน ACP ล้มเหลวตั้งแต่เนิ่น ๆ โดยมีเอาต์พุตน้อย                            | พรอมป์สิทธิ์ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions`             | ตรวจสอบล็อก gateway สำหรับ `AcpRuntimeError` หากต้องการสิทธิ์เต็ม ให้ตั้ง `permissionMode=approve-all`; หากต้องการลดความสามารถอย่างนุ่มนวล ให้ตั้ง `nonInteractivePermissions=deny` |
| เซสชัน ACP ค้างไม่สิ้นสุดหลังทำงานเสร็จ                                       | process ของ harness จบแล้ว แต่เซสชัน ACP ไม่รายงานการเสร็จสิ้น                  | ตรวจสอบด้วย `ps aux \| grep acpx`; kill process ที่ค้างด้วยตนเอง                                                                                                          |

## ที่เกี่ยวข้อง

- [Sub-agents](/th/tools/subagents)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [การส่งเอเจนต์](/th/tools/agent-send)
