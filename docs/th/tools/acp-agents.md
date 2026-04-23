---
read_when:
    - การรัน coding harness ผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับบทสนทนาบนแชนเนลข้อความ
    - การ bind บทสนทนาบนแชนเนลข้อความเข้ากับเซสชัน ACP แบบคงอยู่ მუდმর persisted
    - การแก้ไขปัญหา ACP backend และการเชื่อมต่อของ plugin
    - การดีบักการส่งมอบ completion ของ ACP หรือการวนลูประหว่างเอเจนต์ต่อเอเจนต์
    - การใช้งานคำสั่ง `/acp` จากแชต
summary: ใช้เซสชัน ACP runtime สำหรับ Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP และเอเจนต์แบบ harness อื่น ๆ
title: ACP Agents
x-i18n:
    generated_at: "2026-04-23T05:58:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4c4c38e7a93c240f6bf30a4cc093e8717ef6459425d56a9287245adc625e51
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agents

เซสชัน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ช่วยให้ OpenClaw รัน harness ภายนอกสำหรับงานเขียนโค้ด (เช่น Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI และ harness ACPX อื่นที่รองรับ) ผ่าน ACP backend plugin

หากคุณสั่ง OpenClaw เป็นภาษาธรรมดาว่า “รันสิ่งนี้ใน Codex” หรือ “เริ่ม Claude Code ในเธรดหนึ่ง” OpenClaw ควรกำหนดเส้นทางคำขอนั้นไปยัง ACP runtime (ไม่ใช่ native sub-agent runtime) การ spawn เซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [แบ็กกราวด์ทาสก์](/th/automation/tasks)

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็น external MCP client โดยตรง
เข้ากับบทสนทนาแชนเนลที่มีอยู่ของ OpenClaw ให้ใช้ [`openclaw mcp serve`](/cli/mcp)
แทน ACP

## ฉันควรใช้หน้าไหน?

มีพื้นผิวใกล้เคียงกันสามแบบที่สับสนกันได้ง่าย:

| คุณต้องการจะ...                                                                   | ให้ใช้                                | หมายเหตุ                                                                                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| รัน Codex, Claude Code, Gemini CLI หรือ harness ภายนอกอื่น _ผ่าน_ OpenClaw       | หน้านี้: ACP agents                   | เซสชันที่ bind กับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, แบ็กกราวด์ทาสก์, ตัวควบคุม runtime |
| เปิดเผยเซสชัน OpenClaw Gateway _เป็น_ ACP server สำหรับ editor หรือ client        | [`openclaw acp`](/cli/acp)            | โหมด bridge IDE/client คุย ACP กับ OpenClaw ผ่าน stdio/WebSocket                                             |
| ใช้ AI CLI ในเครื่องซ้ำเป็นโมเดล fallback แบบข้อความล้วน                         | [CLI Backends](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มี OpenClaw tools, ไม่มี ACP control, ไม่มี harness runtime                                      |

## ใช้งานได้ทันทีเลยไหม?

โดยทั่วไปใช่

- การติดตั้งใหม่จะมาพร้อม bundled `acpx` runtime plugin ที่เปิดใช้งานเป็นค่าเริ่มต้น
- bundled `acpx` plugin จะเลือกใช้ไบนารี `acpx` ที่ปักหมุดไว้แบบ local ภายใน plugin ก่อน
- ตอนเริ่มต้น OpenClaw จะ probe ไบนารีนั้นและซ่อมแซมตัวเองหากจำเป็น
- เริ่มด้วย `/acp doctor` หากคุณต้องการตรวจ readiness อย่างรวดเร็ว

สิ่งที่ยังอาจเกิดขึ้นในการใช้งานครั้งแรก:

- target harness adapter อาจถูกดึงแบบ on demand ด้วย `npx` ครั้งแรกที่คุณใช้ harness นั้น
- auth ของ vendor ยังคงต้องมีอยู่บนโฮสต์สำหรับ harness นั้น
- หากโฮสต์ไม่มี npm/network access การดึง adapter ครั้งแรกอาจล้มเหลวจนกว่าจะอุ่นแคชไว้ล่วงหน้า หรือมีการติดตั้ง adapter ด้วยวิธีอื่น

ตัวอย่าง:

- `/acp spawn codex`: OpenClaw ควรพร้อม bootstrap `acpx` แล้ว แต่ Codex ACP adapter อาจยังต้องดึงครั้งแรก
- `/acp spawn claude`: เช่นเดียวกันสำหรับ Claude ACP adapter รวมถึง auth ฝั่ง Claude บนโฮสต์นั้น

## โฟลว์แบบเร็วสำหรับผู้ปฏิบัติการ

ใช้ส่วนนี้เมื่อคุณต้องการ runbook ของ `/acp` แบบใช้งานจริง:

1. Spawn เซสชัน:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. ทำงานในบทสนทนาหรือเธรดที่ถูก bind (หรือระบุ session key นั้นโดยตรง)
3. ตรวจสอบสถานะ runtime:
   - `/acp status`
4. ปรับตัวเลือก runtime ตามต้องการ:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. สะกิดเซสชันที่กำลังทำงานอยู่โดยไม่แทนที่ context:
   - `/acp steer tighten logging and continue`
6. หยุดการทำงาน:
   - `/acp cancel` (หยุด turn ปัจจุบัน) หรือ
   - `/acp close` (ปิดเซสชัน + เอา binding ออก)

## เริ่มต้นอย่างรวดเร็วสำหรับมนุษย์

ตัวอย่างคำขอแบบภาษาธรรมชาติ:

- "Bind this Discord channel to Codex."
- "Start a persistent Codex session in a thread here and keep it focused."
- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Bind this iMessage chat to Codex and keep follow-ups in the same workspace."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."

สิ่งที่ OpenClaw ควรทำ:

1. เลือก `runtime: "acp"`
2. resolve harness target ที่ร้องขอ (`agentId`, เช่น `codex`)
3. หากมีการร้องขอ current-conversation binding และแชนเนลปัจจุบันรองรับ ให้ bind เซสชัน ACP เข้ากับบทสนทนานั้น
4. มิฉะนั้น หากมีการร้องขอ thread binding และแชนเนลปัจจุบันรองรับ ให้ bind เซสชัน ACP เข้ากับเธรดนั้น
5. กำหนดเส้นทางข้อความติดตามผลที่ถูก bind ให้ไปยังเซสชัน ACP เดิมต่อไป จนกว่าจะ unfocused/closed/expired

## ACP เทียบกับ sub-agent

ใช้ ACP เมื่อต้องการ runtime ของ harness ภายนอก ใช้ sub-agent เมื่อต้องการ delegated run แบบเนทีฟของ OpenClaw

| พื้นที่        | ACP session                           | Sub-agent run                     |
| ------------- | ------------------------------------- | --------------------------------- |
| Runtime       | ACP backend plugin (เช่น acpx)        | native sub-agent runtime ของ OpenClaw |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>` |
| คำสั่งหลัก    | `/acp ...`                            | `/subagents ...`                  |
| Spawn tool    | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (runtime ค่าเริ่มต้น) |

ดูเพิ่มเติม [Sub-agents](/th/tools/subagents)

## วิธีที่ ACP รัน Claude Code

สำหรับ Claude Code ผ่าน ACP สแตกคือ:

1. ACP session control plane ของ OpenClaw
2. bundled `acpx` runtime plugin
3. Claude ACP adapter
4. runtime/session machinery ฝั่ง Claude

ความแตกต่างสำคัญ:

- ACP Claude คือ harness session ที่มี ACP control, session resume, การติดตามแบ็กกราวด์ทาสก์ และ optional conversation/thread binding
- CLI backend เป็น runtime fallback ในเครื่องแบบข้อความล้วนที่แยกต่างหาก ดู [CLI Backends](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติการ กฎเชิงปฏิบัติคือ:

- หากต้องการ `/acp spawn`, เซสชันที่ bind ได้, runtime control หรือ harness work แบบ persistent: ใช้ ACP
- หากต้องการ local text fallback แบบง่ายผ่าน CLI ดิบ: ใช้ CLI backend

## เซสชันที่ถูก bind

### current-conversation bind

ใช้ `/acp spawn <harness> --bind here` เมื่อคุณต้องการให้บทสนทนาปัจจุบันกลายเป็น ACP workspace แบบคงทนโดยไม่สร้าง child thread

พฤติกรรม:

- OpenClaw ยังคงเป็นเจ้าของ channel transport, auth, ความปลอดภัย และการส่งมอบ
- บทสนทนาปัจจุบันถูกปักหมุดเข้ากับ session key ของ ACP ที่ถูก spawn
- ข้อความติดตามผลในบทสนทนานั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP เดิม
- `/new` และ `/reset` จะรีเซ็ต ACP session ที่ถูก bind เดิมในตำแหน่งเดิม
- `/acp close` จะปิดเซสชันและเอา current-conversation binding ออก

สิ่งที่หมายถึงในทางปฏิบัติ:

- `--bind here` คงพื้นผิวแชตเดิมไว้ บน Discord แชนเนลปัจจุบันก็ยังคงเป็นแชนเนลปัจจุบัน
- `--bind here` ยังสามารถสร้าง ACP session ใหม่ได้ หากคุณกำลัง spawn งานใหม่ การ bind จะผูกเซสชันนั้นเข้ากับบทสนทนาปัจจุบัน
- `--bind here` จะไม่สร้าง child Discord thread หรือ Telegram topic ด้วยตัวมันเอง
- ACP runtime ยังคงมี working directory (`cwd`) หรือ backend-managed workspace บนดิสก์ของตัวเองได้ runtime workspace นั้นแยกจากพื้นผิวแชต และไม่ได้หมายความว่าจะมี messaging thread ใหม่
- หากคุณ spawn ไปยัง ACP agent อื่นและไม่ส่ง `--cwd` OpenClaw จะสืบทอด workspace ของ **target agent** เป็นค่าเริ่มต้น ไม่ใช่ของ requester
- หากพาธ workspace ที่สืบทอดมานั้นหายไป (`ENOENT`/`ENOTDIR`) OpenClaw จะ fallback ไปยัง backend default cwd แทนการใช้ tree ผิดโดยเงียบ ๆ
- หาก workspace ที่สืบทอดมามีอยู่แต่เข้าถึงไม่ได้ (เช่น `EACCES`) การ spawn จะส่งคืนข้อผิดพลาดด้านการเข้าถึงจริง แทนการทิ้ง `cwd`

โมเดลความคิด:

- chat surface: ที่ที่ผู้คนคุยกันต่อ (`Discord channel`, `Telegram topic`, `iMessage chat`)
- ACP session: สถานะ runtime แบบคงทนของ Codex/Claude/Gemini ที่ OpenClaw กำหนดเส้นทางให้
- child thread/topic: พื้นผิวข้อความเพิ่มเติมแบบทางเลือกที่สร้างขึ้นเฉพาะโดย `--thread ...`
- runtime workspace: ตำแหน่งบนไฟล์ระบบที่ harness ทำงานอยู่ (`cwd`, checkout ของ repo, workspace ของ backend)

ตัวอย่าง:

- `/acp spawn codex --bind here`: คงแชตนี้ไว้, spawn หรือแนบ Codex ACP session และกำหนดเส้นทางข้อความในอนาคตที่นี่ไปยังมัน
- `/acp spawn codex --thread auto`: OpenClaw อาจสร้าง child thread/topic แล้ว bind ACP session ไว้ที่นั่น
- `/acp spawn codex --bind here --cwd /workspace/repo`: bind แชตแบบเดียวกับด้านบน แต่ Codex รันใน `/workspace/repo`

การรองรับ current-conversation binding:

- แชนเนลแชต/ข้อความที่ประกาศว่ารองรับ current-conversation binding สามารถใช้ `--bind here` ผ่าน shared conversation-binding path ได้
- แชนเนลที่มี semantics ของ thread/topic แบบกำหนดเองยังคงสามารถให้ canonicalization แบบเฉพาะแชนเนลภายใต้ interface แบบ shared เดียวกันได้
- `--bind here` หมายถึง “bind บทสนทนาปัจจุบันในตำแหน่งเดิม” เสมอ
- generic current-conversation bind ใช้ shared binding store ของ OpenClaw และอยู่รอดผ่านการรีสตาร์ต gateway ตามปกติ

หมายเหตุ:

- `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้บน `/acp spawn`
- บน Discord, `--bind here` จะ bind แชนเนลหรือเธรดปัจจุบันในตำแหน่งเดิม `spawnAcpSessions` จำเป็นเฉพาะเมื่อ OpenClaw ต้องสร้าง child thread สำหรับ `--thread auto|here`
- หากแชนเนลที่ใช้งานอยู่ไม่ได้เปิดเผย ACP binding สำหรับ current-conversation OpenClaw จะส่งข้อความที่ชัดเจนว่ารองรับไม่ได้
- คำถามเรื่อง `resume` และ “new session” เป็นคำถามของ ACP session ไม่ใช่คำถามของแชนเนล คุณสามารถใช้ซ้ำหรือแทนที่ runtime state ได้โดยไม่เปลี่ยนพื้นผิวแชตปัจจุบัน

### เซสชันที่ bind กับเธรด

เมื่อเปิดใช้ thread binding สำหรับ channel adapter เซสชัน ACP สามารถ bind เข้ากับเธรดได้:

- OpenClaw bind เธรดเข้ากับ ACP session เป้าหมาย
- ข้อความติดตามผลในเธรดนั้นจะถูกกำหนดเส้นทางไปยัง ACP session ที่ถูก bind
- เอาต์พุตของ ACP จะถูกส่งกลับมายังเธรดเดิม
- การ unfocus/close/archive/idle-timeout หรือหมดอายุ max-age จะเอา binding ออก

การรองรับ thread binding เป็นแบบเฉพาะ adapter หาก channel adapter ที่ใช้งานอยู่ไม่รองรับ thread binding OpenClaw จะส่งข้อความที่ชัดเจนว่ารองรับไม่ได้/ไม่พร้อมใช้งาน

feature flag ที่ต้องใช้สำหรับ thread-bound ACP:

- `acp.enabled=true`
- `acp.dispatch.enabled` เปิดอยู่เป็นค่าเริ่มต้น (ตั้ง `false` เพื่อ pause ACP dispatch)
- เปิด channel-adapter ACP thread-spawn flag (ขึ้นกับ adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### แชนเนลที่รองรับเธรด

- channel adapter ใดก็ตามที่เปิดเผยความสามารถด้าน session/thread binding
- การรองรับในตัวปัจจุบัน:
  - Discord threads/channels
  - Telegram topics (forum topic ใน group/supergroup และ DM topic)
- plugin channel สามารถเพิ่มการรองรับผ่าน interface ของ binding เดียวกันได้

## การตั้งค่าเฉพาะแชนเนล

สำหรับเวิร์กโฟลว์ที่ไม่ใช่แบบชั่วคราว ให้กำหนด ACP binding แบบ persistent ใน `bindings[]` ระดับบนสุด

### โมเดลการ bind

- `bindings[].type="acp"` ใช้ระบุ persistent ACP conversation binding
- `bindings[].match` ใช้ระบุบทสนทนาเป้าหมาย:
  - Discord channel หรือ thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/group chat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    ควรใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับ group binding ที่เสถียร
  - iMessage DM/group chat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    ควรใช้ `chat_id:*` สำหรับ group binding ที่เสถียร
- `bindings[].agentId` คือ OpenClaw agent id เจ้าของ
- การแทนที่ ACP แบบไม่บังคับอยู่ภายใต้ `bindings[].acp`:
  - `mode` (`persistent` หรือ `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### ค่าเริ่มต้นของ runtime ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่า ACP เริ่มต้นหนึ่งครั้งต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ลำดับความสำคัญของการแทนที่สำหรับ ACP bound session:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. ค่าเริ่มต้น ACP แบบ global (เช่น `acp.backend`)

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

- OpenClaw ตรวจสอบให้แน่ใจว่า ACP session ที่กำหนดค่าไว้มีอยู่ก่อนใช้งาน
- ข้อความในแชนเนลหรือหัวข้อนั้นจะถูกกำหนดเส้นทางไปยัง ACP session ที่กำหนดไว้
- ในบทสนทนาที่ถูก bind, `/new` และ `/reset` จะรีเซ็ต ACP session key เดิมในตำแหน่งเดิม
- binding ของ runtime แบบชั่วคราว (เช่นที่สร้างโดยโฟลว์ thread-focus) ยังมีผลเมื่อมีอยู่
- สำหรับการ spawn ACP ข้ามเอเจนต์โดยไม่มี `cwd` แบบ explicit OpenClaw จะสืบทอด workspace ของ target agent จาก config ของเอเจนต์
- พาธ workspace ที่สืบทอดมาแต่หายไปจะ fallback ไปยัง backend default cwd; ส่วนข้อผิดพลาดการเข้าถึงที่แท้จริงจะถูกแสดงเป็น spawn error

## เริ่ม ACP session (interfaces)

### จาก `sessions_spawn`

ใช้ `runtime: "acp"` เพื่อเริ่ม ACP session จาก agent turn หรือ tool call

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

- `runtime` มีค่าเริ่มต้นเป็น `subagent` ดังนั้นให้ตั้ง `runtime: "acp"` อย่างชัดเจนสำหรับ ACP session
- หากละ `agentId` ไว้ OpenClaw จะใช้ `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้
- `mode: "session"` ต้องใช้ `thread: true` เพื่อคงบทสนทนาที่ bind แบบ persistent

รายละเอียดของ interface:

- `task` (จำเป็น): prompt เริ่มต้นที่ส่งไปยัง ACP session
- `runtime` (จำเป็นสำหรับ ACP): ต้องเป็น `"acp"`
- `agentId` (ไม่บังคับ): ACP target harness id จะ fallback ไปที่ `acp.defaultAgent` หากตั้งไว้
- `thread` (ไม่บังคับ, ค่าเริ่มต้น `false`): ขอใช้โฟลว์ thread binding เมื่อรองรับ
- `mode` (ไม่บังคับ): `run` (one-shot) หรือ `session` (persistent)
  - ค่าเริ่มต้นคือ `run`
  - หาก `thread: true` และไม่ระบุ mode, OpenClaw อาจใช้พฤติกรรมแบบ persistent เป็นค่าเริ่มต้นตาม runtime path
  - `mode: "session"` ต้องใช้ `thread: true`
- `cwd` (ไม่บังคับ): runtime working directory ที่ร้องขอ (ตรวจสอบโดยนโยบายของ backend/runtime) หากไม่ระบุ ACP spawn จะสืบทอด workspace ของ target agent เมื่อมีการกำหนดค่าไว้; พาธที่สืบทอดมาแต่หายไปจะ fallback ไปยังค่าเริ่มต้นของ backend ส่วนข้อผิดพลาดการเข้าถึงจริงจะถูกส่งคืน
- `label` (ไม่บังคับ): ป้ายที่แสดงต่อผู้ปฏิบัติการ ใช้ในข้อความของ session/banner
- `resumeSessionId` (ไม่บังคับ): resume ACP session ที่มีอยู่แทนการสร้างใหม่ เอเจนต์จะ replay ประวัติการสนทนาของมันผ่าน `session/load` ต้องใช้ `runtime: "acp"`
- `streamTo` (ไม่บังคับ): `"parent"` จะสตรีมสรุปความคืบหน้าของการรัน ACP เริ่มต้นกลับไปยัง requester session เป็น system event
  - เมื่อรองรับ การตอบกลับที่รับได้อาจมี `streamLogPath` ซึ่งชี้ไปยัง JSONL log แบบกำหนดขอบเขตตาม session (`<sessionId>.acp-stream.jsonl`) ที่คุณสามารถ tail เพื่อดู relay history แบบเต็มได้

## โมเดลการส่งมอบ

ACP session อาจเป็นได้ทั้ง workspace แบบโต้ตอบ หรือเป็นงานเบื้องหลังที่ parent เป็นเจ้าของ เส้นทางการส่งมอบขึ้นกับรูปแบบนั้น

### ACP session แบบโต้ตอบ

interactive session มีไว้เพื่อให้สนทนาต่อบนพื้นผิวแชตที่มองเห็นได้:

- `/acp spawn ... --bind here` จะ bind บทสนทนาปัจจุบันเข้ากับ ACP session
- `/acp spawn ... --thread ...` จะ bind เธรด/หัวข้อของแชนเนลเข้ากับ ACP session
- `bindings[].type="acp"` แบบ persistent จะกำหนดเส้นทางบทสนทนาที่ตรงเงื่อนไขไปยัง ACP session เดียวกัน

ข้อความติดตามผลในบทสนทนาที่ถูก bind จะถูกกำหนดเส้นทางตรงไปยัง ACP session และเอาต์พุต ACP จะถูกส่งกลับไปยังแชนเนล/เธรด/หัวข้อเดิมนั้น

### ACP session แบบ one-shot ที่ parent เป็นเจ้าของ

one-shot ACP session ที่ถูก spawn โดยการรันของเอเจนต์อีกตัวเป็นลูกแบบแบ็กกราวด์ คล้าย sub-agent:

- parent ขอให้ทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
- child รันใน ACP harness session ของตัวเอง
- การเสร็จสิ้นจะรายงานกลับผ่าน internal task-completion announce path
- parent จะเขียนผลลัพธ์ของ child ใหม่ในน้ำเสียงผู้ช่วยปกติ เมื่อจำเป็นต้องตอบกลับต่อผู้ใช้

อย่าปฏิบัติต่อเส้นทางนี้เหมือนเป็นแชตแบบ peer-to-peer ระหว่าง parent กับ child child มีช่องทาง completion กลับไปหา parent อยู่แล้ว

### `sessions_send` และการส่งแบบ A2A

`sessions_send` สามารถกำหนดเป้าหมายไปยังเซสชันอื่นหลังการ spawn ได้ สำหรับ peer session ปกติ OpenClaw ใช้เส้นทาง follow-up แบบ agent-to-agent (A2A) หลัง inject ข้อความแล้ว:

- รอคำตอบของเซสชันเป้าหมาย
- เลือกได้ว่าจะให้ requester และ target แลกเปลี่ยน follow-up แบบจำกัดจำนวน turn หรือไม่
- ขอให้ target สร้าง announce message
- ส่ง announce นั้นไปยังแชนเนลหรือเธรดที่มองเห็นได้

เส้นทาง A2A นี้เป็น fallback สำหรับการส่งไปยัง peer ซึ่งผู้ส่งต้องการ visible follow-up มันยังคงเปิดใช้งานเมื่อเซสชันที่ไม่เกี่ยวข้องกันสามารถมองเห็นและส่งข้อความถึง ACP target ได้ เช่น ภายใต้การตั้งค่า `tools.sessions.visibility` แบบกว้าง

OpenClaw จะข้าม A2A follow-up เฉพาะเมื่อ requester เป็น parent ของ child ACP แบบ one-shot ที่ parent เป็นเจ้าของเอง ในกรณีนั้น การรัน A2A ซ้อนทับบน task completion อาจปลุก parent ด้วยผลลัพธ์ของ child ส่งต่อคำตอบของ parent กลับเข้า child แล้วสร้างลูปเสียงสะท้อนระหว่าง parent/child ผลลัพธ์ของ `sessions_send` จะรายงาน `delivery.status="skipped"` สำหรับกรณี owned-child นี้ เพราะ completion path รับผิดชอบผลลัพธ์นั้นอยู่แล้ว

### Resume เซสชันที่มีอยู่

ใช้ `resumeSessionId` เพื่อดำเนิน ACP session ก่อนหน้าต่อ แทนการเริ่มใหม่ เอเจนต์จะ replay ประวัติการสนทนาของมันผ่าน `session/load` ดังนั้นมันจึงดำเนินต่อพร้อมบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้า

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

กรณีใช้งานทั่วไป:

- ส่งต่อ Codex session จากแล็ปท็อปไปยังโทรศัพท์ — บอกเอเจนต์ของคุณให้ทำต่อจากจุดเดิม
- ทำงาน coding session ที่เริ่มแบบโต้ตอบใน CLI ต่อ แต่ตอนนี้แบบ headless ผ่านเอเจนต์ของคุณ
- ทำงานต่อที่ถูกขัดจังหวะเพราะ gateway restart หรือ idle timeout

หมายเหตุ:

- `resumeSessionId` ต้องใช้ `runtime: "acp"` — หากใช้กับ sub-agent runtime จะส่งกลับเป็นข้อผิดพลาด
- `resumeSessionId` จะกู้ประวัติการสนทนา ACP ฝั่งต้นทาง; `thread` และ `mode` ยังคงมีผลตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังคงต้องใช้ `thread: true`
- target agent ต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
- หากไม่พบ session ID การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน — ไม่มีการ fallback แบบเงียบ ๆ ไปยังเซสชันใหม่

### operator smoke test

ใช้สิ่งนี้หลัง deploy gateway เมื่อคุณต้องการตรวจแบบ live อย่างรวดเร็วว่า ACP spawn
ทำงานแบบ end-to-end จริง ไม่ใช่แค่ผ่าน unit test

เกตที่แนะนำ:

1. ตรวจสอบเวอร์ชัน/commit ของ gateway ที่ deploy บนโฮสต์เป้าหมาย
2. ยืนยันว่าซอร์สที่ deploy มี ACP lineage acceptance ใน
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`)
3. เปิด ACPX bridge session ชั่วคราวไปยัง live agent (เช่น
   `razor(main)` บน `jpclawhq`)
4. ขอให้เอเจนต์นั้นเรียก `sessions_spawn` ด้วย:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. ตรวจสอบว่าเอเจนต์รายงาน:
   - `accepted=yes`
   - มี `childSessionKey` จริง
   - ไม่มี validator error
6. ทำความสะอาด ACPX bridge session ชั่วคราว

ตัวอย่าง prompt ถึง live agent:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

หมายเหตุ:

- ควรใช้ smoke test นี้กับ `mode: "run"` เว้นแต่คุณกำลังทดสอบ
  thread-bound persistent ACP session โดยตั้งใจ
- ไม่ต้องบังคับ `streamTo: "parent"` สำหรับเกตพื้นฐาน เส้นทางนั้นขึ้นกับความสามารถของ requester/session และเป็นการตรวจ integration คนละส่วน
- ให้ถือว่าการทดสอบ thread-bound `mode: "session"` เป็นรอบ integration ที่สองซึ่งเข้มข้นกว่า จาก Discord thread หรือ Telegram topic จริง

## ความเข้ากันได้กับ sandbox

ปัจจุบัน ACP session รันบน host runtime ไม่ได้รันภายใน sandbox ของ OpenClaw

ข้อจำกัดปัจจุบัน:

- หาก requester session อยู่ใน sandbox การ spawn ACP จะถูกบล็อกทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
  - ข้อผิดพลาด: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` พร้อม `runtime: "acp"` ไม่รองรับ `sandbox: "require"`
  - ข้อผิดพลาด: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

ใช้ `runtime: "subagent"` เมื่อคุณต้องการการรันที่ถูกบังคับด้วย sandbox

### จากคำสั่ง `/acp`

ใช้ `/acp spawn` เพื่อควบคุมโดยตรงจากแชตเมื่อจำเป็น

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

แฟล็กหลัก:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

ดู [Slash Commands](/th/tools/slash-commands)

## การ resolve เป้าหมายของเซสชัน

action ของ `/acp` ส่วนใหญ่รับเป้าหมายเซสชันแบบไม่บังคับ (`session-key`, `session-id` หรือ `session-label`)

ลำดับการ resolve:

1. อาร์กิวเมนต์เป้าหมายแบบ explicit (หรือ `--session` สำหรับ `/acp steer`)
   - ลองเป็น key ก่อน
   - จากนั้นจึงลอง session id ที่มีรูปร่างแบบ UUID
   - จากนั้น label
2. current thread binding (หากบทสนทนา/เธรดนี้ถูก bind กับ ACP session)
3. fallback ไปยัง requester session ปัจจุบัน

ทั้ง current-conversation binding และ thread binding เข้าร่วมในขั้นตอนที่ 2

หากไม่สามารถ resolve เป้าหมายใดได้ OpenClaw จะส่งกลับข้อผิดพลาดที่ชัดเจน (`Unable to resolve session target: ...`)

## โหมด bind ตอน spawn

`/acp spawn` รองรับ `--bind here|off`

| โหมด   | พฤติกรรม                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | bind บทสนทนาที่ active อยู่ในปัจจุบันไว้ในตำแหน่งเดิม; ล้มเหลวหากไม่มี active conversation |
| `off`  | ไม่สร้าง current-conversation binding                                  |

หมายเหตุ:

- `--bind here` คือเส้นทางที่ง่ายที่สุดสำหรับผู้ปฏิบัติการในกรณี “ทำให้แชนเนลหรือแชตนี้มี Codex อยู่ข้างหลัง”
- `--bind here` จะไม่สร้าง child thread
- `--bind here` ใช้ได้เฉพาะบนแชนเนลที่เปิดเผยการรองรับ current-conversation binding
- `--bind` และ `--thread` ใช้ร่วมกันไม่ได้ใน `/acp spawn` เดียวกัน

## โหมด thread ตอน spawn

`/acp spawn` รองรับ `--thread auto|here|off`

| โหมด   | พฤติกรรม                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------- |
| `auto` | หากอยู่ในเธรดที่ใช้งานอยู่: bind เธรดนั้น หากอยู่นอกเธรด: สร้าง/ผูก child thread เมื่อรองรับ        |
| `here` | ต้องอยู่ใน active thread ปัจจุบัน; ล้มเหลวหากไม่ได้อยู่ในเธรด                                       |
| `off`  | ไม่มีการ bind เซสชันจะเริ่มแบบไม่ถูก bind                                                          |

หมายเหตุ:

- บนพื้นผิวที่ไม่รองรับ thread binding พฤติกรรมเริ่มต้นจะเทียบเท่ากับ `off`
- การ spawn แบบ thread-bound ต้องการการรองรับจากนโยบายของแชนเนล:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- ใช้ `--bind here` เมื่อคุณต้องการปักหมุดบทสนทนาปัจจุบันโดยไม่สร้าง child thread

## ตัวควบคุม ACP

ตระกูลคำสั่งที่มี:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` จะแสดง runtime option ที่มีผลจริง และเมื่อมีได้ จะรวมทั้งตัวระบุเซสชันระดับ runtime และระดับ backend

ตัวควบคุมบางอย่างขึ้นกับความสามารถของ backend หาก backend ไม่รองรับตัวควบคุมใด OpenClaw จะส่งข้อผิดพลาด unsupported-control ที่ชัดเจนกลับมา

## คู่มือคำสั่ง ACP

| คำสั่ง               | สิ่งที่ทำ                                                   | ตัวอย่าง                                                      |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้าง ACP session; เลือก bind บทสนทนาปัจจุบันหรือ bind เธรดได้ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิก turn ที่กำลังทำงานของเซสชันเป้าหมาย                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่ง steer ไปยังเซสชันที่กำลังทำงาน                    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและยกเลิกการ bind เป้าหมายแบบ thread              | `/acp close`                                                  |
| `/acp status`        | แสดง backend, mode, state, runtime option, capabilities    | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่า runtime mode สำหรับเซสชันเป้าหมาย                  | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนค่า runtime config option แบบทั่วไป                    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่า runtime working directory override                  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่า profile ของ approval policy                         | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่า runtime timeout (วินาที)                            | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่า runtime model override                              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | เอา runtime option override ของเซสชันออกทั้งหมด            | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการ ACP session ล่าสุดจาก store                     | `/acp sessions`                                               |
| `/acp doctor`        | สถานะสุขภาพของ backend, capabilities, แนวทางแก้ไขที่ทำได้จริง | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนติดตั้งและเปิดใช้งานแบบกำหนดแน่นอน             | `/acp install`                                                |

`/acp sessions` จะอ่าน store สำหรับเซสชันที่ถูก bind ในปัจจุบันหรือ requester session ปัจจุบัน คำสั่งที่รับโทเค็น `session-key`, `session-id` หรือ `session-label` จะ resolve เป้าหมายผ่านการค้นพบเซสชันของ gateway รวมถึง `session.store` root แบบกำหนดเองรายเอเจนต์

## การแมป runtime option

`/acp` มีทั้งคำสั่งอำนวยความสะดวกและตัว setter แบบทั่วไป

การทำงานที่เทียบเท่ากัน:

- `/acp model <id>` แมปไปยัง runtime config key `model`
- `/acp permissions <profile>` แมปไปยัง runtime config key `approval_policy`
- `/acp timeout <seconds>` แมปไปยัง runtime config key `timeout`
- `/acp cwd <path>` อัปเดต runtime cwd override โดยตรง
- `/acp set <key> <value>` คือเส้นทางทั่วไป
  - กรณีพิเศษ: `key=cwd` จะใช้เส้นทาง cwd override
- `/acp reset-options` จะล้าง runtime override ทั้งหมดของเซสชันเป้าหมาย

## การรองรับ harness ของ acpx (ปัจจุบัน)

alias ของ harness แบบ built-in ใน acpx ปัจจุบัน:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

เมื่อ OpenClaw ใช้ acpx backend ควรใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่ config ของ acpx ในเครื่องของคุณจะนิยาม custom agent alias ไว้
หาก Cursor ที่ติดตั้งในเครื่องของคุณยังเปิดเผย ACP เป็น `agent acp` ให้ override คำสั่ง agent ของ `cursor` ใน config ของ acpx แทนการเปลี่ยนค่าเริ่มต้นแบบ built-in

การใช้งาน acpx CLI โดยตรงยังสามารถกำหนดเป้าหมายเป็น adapter แบบ arbitrary ผ่าน `--agent <command>` ได้ แต่ escape hatch แบบดิบนี้เป็นฟีเจอร์ของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

## config ที่จำเป็น

ACP baseline ของ core:

```json5
{
  acp: {
    enabled: true,
    // ไม่บังคับ ค่าเริ่มต้นคือ true; ตั้ง false เพื่อ pause ACP dispatch ขณะยังคง /acp control ไว้
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

config ของ thread binding จะเฉพาะกับ channel-adapter ตัวอย่างสำหรับ Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

หาก thread-bound ACP spawn ไม่ทำงาน ให้ตรวจ feature flag ของ adapter ก่อน:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

current-conversation bind ไม่ต้องใช้การสร้าง child-thread มันต้องการ active conversation context และ channel adapter ที่เปิดเผย ACP conversation binding

ดู [Configuration Reference](/th/gateway/configuration-reference)

## การตั้งค่า plugin สำหรับ acpx backend

การติดตั้งใหม่มาพร้อม bundled `acpx` runtime plugin ที่เปิดใช้งานเป็นค่าเริ่มต้น ดังนั้น ACP
มักทำงานได้โดยไม่ต้องติดตั้ง plugin ด้วยตนเองก่อน

เริ่มด้วย:

```text
/acp doctor
```

หากคุณปิดใช้ `acpx`, ปฏิเสธมันผ่าน `plugins.allow` / `plugins.deny` หรืออยาก
สลับไปใช้ local development checkout ให้ใช้เส้นทาง plugin แบบ explicit:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

การติดตั้ง local workspace ระหว่างการพัฒนา:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

จากนั้นตรวจสอบสุขภาพของ backend:

```text
/acp doctor
```

### การกำหนดค่าคำสั่งและเวอร์ชันของ acpx

โดยค่าเริ่มต้น bundled acpx backend plugin (`acpx`) จะใช้ไบนารีแบบ local ที่ปักหมุดไว้ใน plugin:

1. ค่าเริ่มต้นของคำสั่งคือ `node_modules/.bin/acpx` ภายในแพ็กเกจ ACPX plugin
2. เวอร์ชันที่คาดหวังจะใช้ค่าปักหมุดของ extension
3. ตอนเริ่มต้นจะลงทะเบียน ACP backend ทันทีในสถานะ not-ready
4. งาน ensure แบบแบ็กกราวด์จะตรวจสอบ `acpx --version`
5. หากไบนารีใน plugin หายไปหรือเวอร์ชันไม่ตรง ระบบจะรัน:
   `npm install --omit=dev --no-save acpx@<pinned>` แล้วตรวจซ้ำอีกครั้ง

คุณสามารถ override คำสั่ง/เวอร์ชันได้ใน plugin config:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

หมายเหตุ:

- `command` รับได้ทั้ง absolute path, relative path หรือชื่อคำสั่ง (`acpx`)
- relative path จะ resolve จากไดเรกทอรี workspace ของ OpenClaw
- `expectedVersion: "any"` จะปิดการจับคู่เวอร์ชันแบบเข้มงวด
- เมื่อ `command` ชี้ไปยังไบนารี/พาธแบบกำหนดเอง การติดตั้งอัตโนมัติแบบ plugin-local จะถูกปิด
- การเริ่มต้นของ OpenClaw ยังคงไม่บล็อกขณะ backend health check กำลังทำงาน

ดู [Plugins](/th/tools/plugin)

### การติดตั้ง dependency อัตโนมัติ

เมื่อคุณติดตั้ง OpenClaw แบบ global ด้วย `npm install -g openclaw`, runtime dependency ของ acpx
(ไบนารีเฉพาะแพลตฟอร์ม) จะถูกติดตั้งโดยอัตโนมัติผ่าน postinstall hook หากการติดตั้งอัตโนมัติล้มเหลว gateway ยังคงเริ่มทำงานได้ตามปกติ และรายงาน dependency ที่ขาดผ่าน `openclaw acp doctor`

### สะพาน MCP สำหรับ plugin tools

โดยค่าเริ่มต้น ACPX session **จะไม่** เปิดเผย tool ที่ลงทะเบียนโดย plugin ของ OpenClaw
ให้ ACP harness

หากคุณต้องการให้ ACP agent เช่น Codex หรือ Claude Code เรียก tool ของ OpenClaw plugin ที่ติดตั้งไว้ เช่น memory recall/store ให้เปิดใช้สะพานเฉพาะนี้:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่จะเกิดขึ้น:

- inject built-in MCP server ชื่อ `openclaw-plugin-tools` เข้าไปใน ACPX session bootstrap
- เปิดเผย plugin tool ที่ลงทะเบียนแล้วโดย OpenClaw plugin ที่ติดตั้งและเปิดใช้งานอยู่
- คงให้ฟีเจอร์นี้เป็นแบบ explicit และปิดไว้โดยค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความเชื่อถือ:

- สิ่งนี้ขยายพื้นผิวของ tool ที่ ACP harness เข้าถึงได้
- ACP agent จะเข้าถึงได้เฉพาะ plugin tool ที่ active อยู่แล้วใน gateway
- ให้ถือว่านี่คือขอบเขตความเชื่อถือเดียวกับการอนุญาตให้ plugin เหล่านั้นรันใน
  OpenClaw เอง
- ตรวจสอบ plugin ที่ติดตั้งไว้ก่อนเปิดใช้

`mcpServers` แบบกำหนดเองยังคงทำงานได้ตามเดิม สะพาน plugin-tools แบบ built-in เป็นเพียง
ความสะดวกแบบ opt-in เพิ่มเติม ไม่ใช่ตัวแทนของ config MCP server ทั่วไป

### สะพาน MCP สำหรับ OpenClaw tools

โดยค่าเริ่มต้น ACPX session จะ **ไม่** เปิดเผย built-in tool ของ OpenClaw ผ่าน
MCP เช่นกัน ให้เปิดใช้สะพาน core-tools แยกต่างหากเมื่อ ACP agent ต้องการ
built-in tool บางตัว เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่จะเกิดขึ้น:

- inject built-in MCP server ชื่อ `openclaw-tools` เข้าไปใน ACPX session
  bootstrap
- เปิดเผย built-in tool ของ OpenClaw ที่เลือกไว้ โดยเซิร์ฟเวอร์เริ่มต้นจะเปิดเผย `cron`
- คงการเปิดเผย core-tool ให้เป็นแบบ explicit และปิดไว้โดยค่าเริ่มต้น

### การกำหนดค่า runtime timeout

bundled `acpx` plugin ใช้ timeout 120 วินาทีเป็นค่าเริ่มต้นสำหรับ embedded runtime turn
วิธีนี้ทำให้ harness ที่ช้ากว่า เช่น Gemini CLI มีเวลาเพียงพอในการจบ ACP startup และ initialization คุณสามารถ override ได้หากโฮสต์ของคุณต้องการ runtime limit แบบอื่น:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รีสตาร์ต gateway หลังเปลี่ยนค่านี้

### การกำหนดค่า health probe agent

bundled `acpx` plugin จะ probe harness agent หนึ่งตัวขณะตัดสินว่า embedded runtime backend พร้อมหรือยัง ค่าเริ่มต้นคือ `codex` หาก deployment ของคุณใช้ ACP agent เริ่มต้นตัวอื่น ให้ตั้ง probe agent เป็น id เดียวกัน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ต gateway หลังเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

ACP session รันแบบไม่โต้ตอบ — ไม่มี TTY ให้อนุมัติหรือปฏิเสธ prompt สำหรับ file-write และ shell-exec โดย acpx plugin มีคีย์ config สองตัวที่ควบคุมวิธีจัดการสิทธิ์เหล่านี้:

สิทธิ์ของ ACPX harness เหล่านี้แยกจาก OpenClaw exec approval และแยกจากแฟล็ก vendor bypass ของ CLI-backend เช่น Claude CLI `--permission-mode bypassPermissions` โดย ACPX `approve-all` คือสวิตช์ break-glass ระดับ harness สำหรับ ACP session

### `permissionMode`

ควบคุมว่ามีการดำเนินการใดบ้างที่ harness agent ทำได้โดยไม่ต้องถาม

| ค่า              | พฤติกรรม                                                   |
| ---------------- | ---------------------------------------------------------- |
| `approve-all`    | อนุมัติการเขียนไฟล์และคำสั่ง shell ทั้งหมดโดยอัตโนมัติ   |
| `approve-reads`  | อนุมัติการอ่านโดยอัตโนมัติเท่านั้น; การเขียนและ exec ต้องมี prompt |
| `deny-all`       | ปฏิเสธ prompt เรื่องสิทธิ์ทั้งหมด                         |

### `nonInteractivePermissions`

ควบคุมว่าจะเกิดอะไรขึ้นเมื่อควรมี permission prompt แต่ไม่มี interactive TTY ให้ใช้ (ซึ่งเป็นกรณีเสมอสำหรับ ACP session)

| ค่า    | พฤติกรรม                                                        |
| ------ | ---------------------------------------------------------------- |
| `fail` | ยกเลิกเซสชันด้วย `AcpRuntimeError` **(ค่าเริ่มต้น)**            |
| `deny` | ปฏิเสธสิทธิ์นั้นอย่างเงียบ ๆ แล้วทำงานต่อ (graceful degradation) |

### การกำหนดค่า

ตั้งค่าผ่าน plugin config:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ต gateway หลังเปลี่ยนค่าเหล่านี้

> **สำคัญ:** ปัจจุบัน OpenClaw ใช้ค่าเริ่มต้นเป็น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ใน ACP session แบบไม่โต้ตอบ การเขียนหรือ exec ใด ๆ ที่ทำให้เกิด permission prompt อาจล้มเหลวด้วย `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`
>
> หากคุณต้องการจำกัดสิทธิ์ ให้ตั้ง `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดความสามารถลงอย่างนุ่มนวลแทนที่จะล่ม

## การแก้ไขปัญหา

| อาการ                                                                        | สาเหตุที่น่าจะเป็น                                                             | วิธีแก้                                                                                                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | ไม่มี backend plugin หรือถูกปิดใช้งาน                                          | ติดตั้งและเปิดใช้งาน backend plugin จากนั้นรัน `/acp doctor`                                                                                                       |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ถูกปิดทั่วทั้งระบบ                                                         | ตั้ง `acp.enabled=true`                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | ปิดการ dispatch จากข้อความเธรดปกติ                                            | ตั้ง `acp.dispatch.enabled=true`                                                                                                                                    |
| `ACP agent "<id>" is not allowed by policy`                                 | agent ไม่อยู่ใน allowlist                                                      | ใช้ `agentId` ที่อนุญาต หรืออัปเดต `acp.allowedAgents`                                                                                                             |
| `Unable to resolve session target: ...`                                     | โทเค็น key/id/label ไม่ถูกต้อง                                                 | รัน `/acp sessions`, คัดลอก key/label ที่ตรงกัน แล้วลองใหม่                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีบทสนทนาที่ bind ได้ซึ่งกำลัง active อยู่             | ย้ายไปยังแชต/แชนเนลเป้าหมายแล้วลองใหม่ หรือใช้การ spawn แบบไม่ bind                                                                                                |
| `Conversation bindings are unavailable for <channel>.`                      | adapter ไม่มีความสามารถ ACP binding สำหรับ current-conversation                | ใช้ `/acp spawn ... --thread ...` ในที่ที่รองรับ, กำหนด `bindings[]` ระดับบนสุด หรือย้ายไปยังแชนเนลที่รองรับ                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | ใช้ `--thread here` นอกบริบทของเธรด                                            | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                |
| `Only <user-id> can rebind this channel/conversation/thread.`               | ผู้ใช้อื่นเป็นเจ้าของ binding target ที่ active อยู่                           | ทำ rebind ในฐานะเจ้าของ หรือใช้บทสนทนาหรือเธรดอื่น                                                                                                                 |
| `Thread bindings are unavailable for <channel>.`                            | adapter ไม่มีความสามารถ thread binding                                         | ใช้ `--thread off` หรือย้ายไปยัง adapter/แชนเนลที่รองรับ                                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime อยู่ฝั่ง host; requester session อยู่ใน sandbox                    | ใช้ `runtime="subagent"` จาก session ที่ถูก sandbox หรือรัน ACP spawn จาก session ที่ไม่ถูก sandbox                                                                 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | มีการร้องขอ `sandbox="require"` สำหรับ ACP runtime                              | ใช้ `runtime="subagent"` หากต้องการ sandbox แบบบังคับ หรือใช้ ACP กับ `sandbox="inherit"` จาก session ที่ไม่ถูก sandbox                                            |
| Missing ACP metadata for bound session                                      | ACP session metadata เก่าค้าง/ถูกลบไปแล้ว                                      | สร้างใหม่ด้วย `/acp spawn` แล้ว rebind/focus thread ใหม่                                                                                                           |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` บล็อก write/exec ใน ACP session แบบไม่โต้ตอบ                 | ตั้ง `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ต gateway ดู [การกำหนดค่าสิทธิ์](#การกำหนดค่าสิทธิ์)                              |
| ACP session ล้มเหลวเร็วและมีเอาต์พุตน้อยมาก                                | permission prompt ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions`    | ตรวจ gateway log เพื่อหา `AcpRuntimeError` หากต้องการสิทธิ์เต็ม ให้ตั้ง `permissionMode=approve-all`; หากต้องการ graceful degradation ให้ตั้ง `nonInteractivePermissions=deny` |
| ACP session ค้างไม่สิ้นสุดหลังทำงานเสร็จ                                   | โปรเซส harness จบแล้ว แต่ ACP session ไม่รายงาน completion                     | เฝ้าดูด้วย `ps aux \| grep acpx`; kill โปรเซสที่ค้างด้วยตนเอง                                                                                                      |
