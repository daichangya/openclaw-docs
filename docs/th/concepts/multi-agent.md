---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'การกำหนดเส้นทางแบบหลายเอเจนต์: เอเจนต์ที่แยกจากกัน บัญชีของช่องทาง และ bindings'
title: การกำหนดเส้นทางแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-04-23T05:30:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# การกำหนดเส้นทางแบบหลายเอเจนต์

เป้าหมาย: มีหลายเอเจนต์ที่_แยกจากกัน_ (workspace + `agentDir` + sessions แยกกัน) พร้อมทั้งมีหลายบัญชีของช่องทาง (เช่น WhatsApp สองบัญชี) ใน Gateway ที่รันอยู่ตัวเดียว ข้อความขาเข้าจะถูกกำหนดเส้นทางไปยังเอเจนต์ผ่าน bindings

## "หนึ่งเอเจนต์" คืออะไร

**เอเจนต์** คือสมองที่มีขอบเขตครบถ้วน โดยมีของตัวเองดังนี้:

- **Workspace** (ไฟล์, AGENTS.md/SOUL.md/USER.md, บันทึกในเครื่อง, กฎ persona)
- **ไดเรกทอรีสถานะ** (`agentDir`) สำหรับ auth profiles, model registry และคอนฟิกต่อเอเจนต์
- **ที่เก็บ Session** (ประวัติแชต + สถานะการกำหนดเส้นทาง) ภายใต้ `~/.openclaw/agents/<agentId>/sessions`

Auth profiles เป็นแบบ **ต่อเอเจนต์** แต่ละเอเจนต์จะอ่านจากไฟล์ของตัวเอง:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`session_history` คือเส้นทางเรียกคืนข้ามเซสชันที่ปลอดภัยกว่าที่นี่เช่นกัน: มันจะคืนมุมมองที่มีขอบเขตและผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่การ dump transcript ดิบ การเรียกคืนของผู้ช่วยจะลบแท็กการคิด, โครง `<relevant-memories>`, payload XML ของการเรียกใช้เครื่องมือในข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกใช้เครื่องมือแบบถูกตัดทอน), โครงของการเรียกใช้เครื่องมือแบบลดระดับแล้ว, โทเค็นควบคุมโมเดลแบบ ASCII/ความกว้างเต็มที่รั่วออกมา และ XML การเรียกใช้เครื่องมือของ MiniMax ที่ผิดรูปแบบ ก่อนการปิดทับ/ตัดทอน

ข้อมูลประจำตัวของเอเจนต์หลัก **ไม่ได้ถูกแชร์โดยอัตโนมัติ** ห้ามใช้ `agentDir` ร่วมกันระหว่างเอเจนต์เด็ดขาด (จะทำให้เกิดการชนกันของ auth/session) หากคุณต้องการแชร์ข้อมูลประจำตัว ให้คัดลอก `auth-profiles.json` ไปยัง `agentDir` ของอีกเอเจนต์

Skills จะถูกโหลดจาก workspace ของแต่ละเอเจนต์ รวมถึง shared roots อย่าง `~/.openclaw/skills` จากนั้นจึงถูกกรองตาม allowlist ของ Skills ที่มีผลกับเอเจนต์เมื่อมีการกำหนดค่า ใช้ `agents.defaults.skills` สำหรับ baseline ที่ใช้ร่วมกัน และ `agents.list[].skills` สำหรับการแทนที่แบบรายเอเจนต์ ดู
[Skills: ต่อเอเจนต์ เทียบกับใช้ร่วมกัน](/th/tools/skills#per-agent-vs-shared-skills) และ
[Skills: allowlist ของ Skills ของเอเจนต์](/th/tools/skills#agent-skill-allowlists)

Gateway สามารถโฮสต์ได้ทั้ง **หนึ่งเอเจนต์** (ค่าเริ่มต้น) หรือ **หลายเอเจนต์** วางเคียงกัน

**หมายเหตุเรื่อง Workspace:** workspace ของแต่ละเอเจนต์คือ **cwd เริ่มต้น** ไม่ใช่ sandbox แบบเข้มงวด พาธแบบ relative จะ resolve ภายใน workspace แต่พาธแบบ absolute ยังสามารถเข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิด sandboxing ดู
[Sandboxing](/th/gateway/sandboxing)

## พาธ (แผนที่ย่อ)

- คอนฟิก: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะ: `~/.openclaw` (หรือ `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (หรือ `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### โหมดเอเจนต์เดียว (ค่าเริ่มต้น)

หากคุณไม่ทำอะไรเลย OpenClaw จะรันด้วยเอเจนต์เดียว:

- `agentId` มีค่าเริ่มต้นเป็น **`main`**
- Sessions ถูกคีย์เป็น `agent:main:<mainKey>`
- Workspace มีค่าเริ่มต้นเป็น `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<profile>` เมื่อมีการตั้ง `OPENCLAW_PROFILE`)
- State มีค่าเริ่มต้นเป็น `~/.openclaw/agents/main/agent`

## ตัวช่วยเอเจนต์

ใช้ตัวช่วยสร้างเอเจนต์เพื่อเพิ่มเอเจนต์ที่แยกจากกันตัวใหม่:

```bash
openclaw agents add work
```

จากนั้นเพิ่ม `bindings` (หรือให้ตัวช่วยสร้างทำให้) เพื่อกำหนดเส้นทางข้อความขาเข้า

ตรวจสอบด้วย:

```bash
openclaw agents list --bindings
```

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="สร้าง workspace ของแต่ละเอเจนต์">

ใช้ตัวช่วยสร้าง หรือสร้าง workspace ด้วยตนเอง:

```bash
openclaw agents add coding
openclaw agents add social
```

แต่ละเอเจนต์จะมี workspace ของตัวเองพร้อม `SOUL.md`, `AGENTS.md` และ `USER.md` แบบไม่บังคับ รวมถึง `agentDir` และที่เก็บ session โดยเฉพาะภายใต้ `~/.openclaw/agents/<agentId>`

  </Step>

  <Step title="สร้างบัญชีของช่องทาง">

สร้างหนึ่งบัญชีต่อหนึ่งเอเจนต์บนช่องทางที่คุณต้องการ:

- Discord: หนึ่งบอตต่อหนึ่งเอเจนต์ เปิด Message Content Intent แล้วคัดลอก token ของแต่ละตัว
- Telegram: หนึ่งบอตต่อหนึ่งเอเจนต์ผ่าน BotFather แล้วคัดลอก token ของแต่ละตัว
- WhatsApp: ลิงก์แต่ละหมายเลขโทรศัพท์ต่อหนึ่งบัญชี

```bash
openclaw channels login --channel whatsapp --account work
```

ดูคู่มือของช่องทาง: [Discord](/th/channels/discord), [Telegram](/th/channels/telegram), [WhatsApp](/th/channels/whatsapp)

  </Step>

  <Step title="เพิ่มเอเจนต์ บัญชี และ bindings">

เพิ่มเอเจนต์ภายใต้ `agents.list`, เพิ่มบัญชีของช่องทางภายใต้ `channels.<channel>.accounts` แล้วเชื่อมต่อเข้าด้วยกันผ่าน `bindings` (มีตัวอย่างด้านล่าง)

  </Step>

  <Step title="รีสตาร์ตและตรวจสอบ">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## หลายเอเจนต์ = หลายคน หลายบุคลิก

เมื่อมี **หลายเอเจนต์** แต่ละ `agentId` จะกลายเป็น **persona ที่แยกจากกันโดยสมบูรณ์**:

- **หมายเลขโทรศัพท์/บัญชีที่ต่างกัน** (ผ่าน `accountId` ต่อช่องทาง)
- **บุคลิกที่ต่างกัน** (ผ่านไฟล์ใน workspace ต่อเอเจนต์ เช่น `AGENTS.md` และ `SOUL.md`)
- **auth + sessions แยกกัน** (ไม่มีการปะปนกัน เว้นแต่จะเปิดใช้ไว้อย่าง explicit)

สิ่งนี้ช่วยให้ **หลายคน** ใช้ Gateway server ตัวเดียวร่วมกันได้ โดยยังคงแยก “สมอง” AI และข้อมูลของแต่ละคนออกจากกัน

## การค้นหา memory แบบ QMD ข้ามเอเจนต์

หากเอเจนต์หนึ่งควรค้นหา transcript ของ session แบบ QMD ของอีกเอเจนต์ ให้เพิ่ม
collections เพิ่มเติมภายใต้ `agents.list[].memorySearch.qmd.extraCollections`
ใช้ `agents.defaults.memorySearch.qmd.extraCollections` เฉพาะเมื่อทุกเอเจนต์
ควรสืบทอด collections ของ transcript ที่ใช้ร่วมกันชุดเดียวกัน

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolve ภายใน workspace -> collection ชื่อ "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

พาธของ extra collection สามารถใช้ร่วมกันข้ามเอเจนต์ได้ แต่ชื่อ collection
ยังคงต้องระบุชัดเจนเมื่อพาธอยู่นอก workspace ของเอเจนต์ พาธภายใน workspace จะยังคงอยู่ในขอบเขตของเอเจนต์ ดังนั้นแต่ละเอเจนต์จึงยังคงมีชุดค้นหา transcript ของตัวเอง

## WhatsApp หนึ่งหมายเลข หลายคน (แยก DM)

คุณสามารถกำหนดเส้นทาง **DM ของ WhatsApp ที่ต่างกัน** ไปยังเอเจนต์ต่างกันได้ โดยยังคงอยู่บน **บัญชี WhatsApp เดียว** จับคู่ตาม E.164 ของผู้ส่ง (เช่น `+15551234567`) ด้วย `peer.kind: "direct"` คำตอบยังคงส่งออกจากหมายเลข WhatsApp เดิม (ไม่มีตัวตนผู้ส่งแยกตามเอเจนต์)

รายละเอียดสำคัญ: แชตแบบ direct จะถูกรวมไปที่ **main session key** ของเอเจนต์ ดังนั้นการแยกที่แท้จริงจึงต้องใช้ **หนึ่งเอเจนต์ต่อหนึ่งคน**

ตัวอย่าง:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

หมายเหตุ:

- การควบคุมการเข้าถึง DM เป็นแบบ **global ต่อบัญชี WhatsApp** (pairing/allowlist) ไม่ใช่ต่อเอเจนต์
- สำหรับกลุ่มที่ใช้ร่วมกัน ให้ bind กลุ่มนั้นเข้ากับเอเจนต์ตัวเดียว หรือใช้ [กลุ่มการกระจายข้อความ](/th/channels/broadcast-groups)

## กฎการกำหนดเส้นทาง (ข้อความเลือกเอเจนต์อย่างไร)

Bindings เป็นแบบ **กำหนดแน่นอน** และ **เฉพาะเจาะจงที่สุดชนะ**:

1. จับคู่ `peer` (id ของ DM/กลุ่ม/แชนเนล แบบตรงตัว)
2. จับคู่ `parentPeer` (การสืบทอดเธรด)
3. `guildId + roles` (การกำหนดเส้นทางตามบทบาทของ Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. จับคู่ `accountId` สำหรับช่องทาง
7. จับคู่ระดับช่องทาง (`accountId: "*"`)
8. fallback ไปยังเอเจนต์เริ่มต้น (`agents.list[].default`, มิฉะนั้นใช้รายการแรกใน list, ค่าเริ่มต้น: `main`)

หากมีหลาย binding ตรงกันใน tier เดียวกัน ตัวแรกตามลำดับในคอนฟิกจะชนะ
หาก binding ตั้งหลายฟิลด์การจับคู่ไว้พร้อมกัน (เช่น `peer` + `guildId`) ฟิลด์ที่ระบุทั้งหมดต้องตรงกัน (`AND` semantics)

รายละเอียดสำคัญของขอบเขตบัญชี:

- binding ที่ละ `accountId` ไว้ จะจับคู่กับบัญชีเริ่มต้นเท่านั้น
- ใช้ `accountId: "*"` สำหรับ fallback ระดับช่องทางที่ครอบคลุมทุกบัญชี
- หากภายหลังคุณเพิ่ม binding เดียวกันสำหรับเอเจนต์เดิมพร้อม `accountId` แบบ explicit OpenClaw จะอัปเกรด binding เดิมที่เป็นระดับช่องทางอย่างเดียวให้กลายเป็นแบบมีขอบเขตบัญชี แทนที่จะสร้างรายการซ้ำ

## หลายบัญชี / หลายหมายเลขโทรศัพท์

ช่องทางที่รองรับ **หลายบัญชี** (เช่น WhatsApp) ใช้ `accountId` เพื่อระบุ
แต่ละการล็อกอิน แต่ละ `accountId` สามารถกำหนดเส้นทางไปยังเอเจนต์ต่างกันได้ ดังนั้นเซิร์ฟเวอร์ตัวเดียวจึงโฮสต์
หลายหมายเลขโทรศัพท์ได้โดยไม่ปะปน session กัน

หากคุณต้องการบัญชีเริ่มต้นระดับช่องทางเมื่อไม่ได้ระบุ `accountId` ให้ตั้ง
`channels.<channel>.defaultAccount` (ไม่บังคับ) เมื่อไม่ได้ตั้งไว้ OpenClaw จะ fallback
ไปใช้ `default` หากมี มิฉะนั้นจะใช้ account id ตัวแรกที่กำหนดไว้ (เรียงลำดับแล้ว)

ช่องทางทั่วไปที่รองรับรูปแบบนี้ ได้แก่:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## แนวคิด

- `agentId`: “สมอง” หนึ่งตัว (workspace, auth ต่อเอเจนต์, ที่เก็บ session ต่อเอเจนต์)
- `accountId`: อินสแตนซ์บัญชีของช่องทางหนึ่งตัว (เช่น บัญชี WhatsApp `"personal"` เทียบกับ `"biz"`)
- `binding`: กำหนดเส้นทางข้อความขาเข้าไปยัง `agentId` ตาม `(channel, accountId, peer)` และอาจรวม guild/team ids ด้วย
- แชตแบบ direct จะรวมไปที่ `agent:<agentId>:<mainKey>` (main ต่อเอเจนต์; `session.mainKey`)

## ตัวอย่างตามแพลตฟอร์ม

### Discord bots ต่อเอเจนต์

บัญชีบอต Discord แต่ละตัวจะจับคู่กับ `accountId` ที่ไม่ซ้ำกัน Bind แต่ละบัญชีกับเอเจนต์หนึ่งตัว และคง allowlists แยกตามบอต

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

หมายเหตุ:

- เชิญบอตแต่ละตัวเข้า guild และเปิด Message Content Intent
- token อยู่ใน `channels.discord.accounts.<id>.token` (บัญชีเริ่มต้นสามารถใช้ `DISCORD_BOT_TOKEN` ได้)

### Telegram bots ต่อเอเจนต์

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

หมายเหตุ:

- สร้างบอตหนึ่งตัวต่อหนึ่งเอเจนต์ด้วย BotFather แล้วคัดลอก token ของแต่ละตัว
- token อยู่ใน `channels.telegram.accounts.<id>.botToken` (บัญชีเริ่มต้นสามารถใช้ `TELEGRAM_BOT_TOKEN` ได้)

### หมายเลข WhatsApp ต่อเอเจนต์

ลิงก์แต่ละบัญชีก่อนเริ่ม Gateway:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // การกำหนดเส้นทางแบบกำหนดแน่นอน: ตัวที่ตรงก่อนชนะ (เรียงตัวที่เฉพาะเจาะจงที่สุดไว้ก่อน)
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // การตั้งค่าแทนที่ราย peer แบบไม่บังคับ (ตัวอย่าง: ส่งกลุ่มเฉพาะไปยังเอเจนต์ work)
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // ปิดไว้โดยค่าเริ่มต้น: การส่งข้อความระหว่างเอเจนต์ต้องเปิดใช้งานและใส่ allowlist แบบ explicit
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // การตั้งค่าแทนที่แบบไม่บังคับ ค่าเริ่มต้น: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // การตั้งค่าแทนที่แบบไม่บังคับ ค่าเริ่มต้น: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## ตัวอย่าง: แชตรายวันบน WhatsApp + งานเชิงลึกบน Telegram

แยกตามช่องทาง: กำหนดเส้นทาง WhatsApp ไปยังเอเจนต์สำหรับการใช้งานประจำวันแบบรวดเร็ว และ Telegram ไปยังเอเจนต์ Opus

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

หมายเหตุ:

- หากคุณมีหลายบัญชีสำหรับช่องทางเดียวกัน ให้เพิ่ม `accountId` ลงใน binding (เช่น `{ channel: "whatsapp", accountId: "personal" }`)
- หากต้องการกำหนดเส้นทาง DM/กลุ่มเดียวไปยัง Opus โดยให้ที่เหลือยังอยู่กับ chat ให้เพิ่ม binding แบบ `match.peer` สำหรับ peer นั้น โดยการจับคู่ peer จะมีลำดับความสำคัญเหนือกว่ากฎระดับช่องทางเสมอ

## ตัวอย่าง: ช่องทางเดียวกัน แต่กำหนด peer หนึ่งไปยัง Opus

ให้ WhatsApp ใช้เอเจนต์แบบเร็ว แต่กำหนด DM หนึ่งรายการไปยัง Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

binding ของ peer จะชนะเสมอ ดังนั้นให้วางไว้เหนือกฎระดับช่องทาง

## เอเจนต์ครอบครัวที่ bind กับกลุ่ม WhatsApp

Bind เอเจนต์ครอบครัวเฉพาะเข้ากับกลุ่ม WhatsApp กลุ่มเดียว โดยใช้การจำกัดด้วยการ mention
และนโยบายเครื่องมือที่เข้มงวดกว่า:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

หมายเหตุ:

- รายการ allow/deny ของเครื่องมือเป็น **เครื่องมือ** ไม่ใช่ Skills หาก Skill ต้องรัน
  ไบนารี ให้ตรวจสอบว่าอนุญาต `exec` แล้ว และมีไบนารีนั้นอยู่ใน sandbox
- หากต้องการการจำกัดที่เข้มงวดยิ่งขึ้น ให้ตั้ง `agents.list[].groupChat.mentionPatterns` และคง
  allowlist ของกลุ่มไว้สำหรับช่องทางนั้น

## การกำหนดค่า Sandbox และเครื่องมือแบบรายเอเจนต์

แต่ละเอเจนต์สามารถมี sandbox และข้อจำกัดของเครื่องมือเป็นของตัวเองได้:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // ไม่มี sandbox สำหรับเอเจนต์ส่วนตัว
        },
        // ไม่มีข้อจำกัดของเครื่องมือ - ใช้เครื่องมือได้ทั้งหมด
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // อยู่ใน sandbox เสมอ
          scope: "agent",  // หนึ่งคอนเทนเนอร์ต่อหนึ่งเอเจนต์
          docker: {
            // การตั้งค่าแบบครั้งเดียวหลังสร้างคอนเทนเนอร์
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // ใช้ได้เฉพาะเครื่องมือ read
          deny: ["exec", "write", "edit", "apply_patch"],    // ปฏิเสธเครื่องมืออื่น
        },
      },
    ],
  },
}
```

หมายเหตุ: `setupCommand` อยู่ภายใต้ `sandbox.docker` และรันหนึ่งครั้งตอนสร้างคอนเทนเนอร์
การตั้งค่าแทนที่แบบรายเอเจนต์ของ `sandbox.docker.*` จะถูกละเว้นเมื่อ scope ที่ resolve ได้เป็น `"shared"`

**ประโยชน์:**

- **การแยกด้านความปลอดภัย**: จำกัดเครื่องมือสำหรับเอเจนต์ที่ไม่น่าเชื่อถือ
- **การควบคุมทรัพยากร**: ใช้ sandbox กับเอเจนต์บางตัว ขณะที่ตัวอื่นยังทำงานบนโฮสต์
- **นโยบายที่ยืดหยุ่น**: ใช้สิทธิ์ที่ต่างกันในแต่ละเอเจนต์

หมายเหตุ: `tools.elevated` เป็นแบบ **global** และอิงตามผู้ส่ง ไม่สามารถกำหนดค่าแยกตามเอเจนต์ได้
หากคุณต้องการขอบเขตแบบรายเอเจนต์ ให้ใช้ `agents.list[].tools` เพื่อปฏิเสธ `exec`
สำหรับการกำหนดเป้าหมายกลุ่ม ให้ใช้ `agents.list[].groupChat.mentionPatterns` เพื่อให้ @mentions จับคู่ไปยังเอเจนต์ที่ตั้งใจไว้ได้อย่างชัดเจน

ดู [Sandbox และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) สำหรับตัวอย่างโดยละเอียด

## ที่เกี่ยวข้อง

- [Channel Routing](/th/channels/channel-routing) — วิธีที่ข้อความถูกกำหนดเส้นทางไปยังเอเจนต์
- [Sub-Agents](/th/tools/subagents) — การสร้างการรันเอเจนต์เบื้องหลัง
- [ACP Agents](/th/tools/acp-agents) — การรันชุดเครื่องมือเขียนโค้ดภายนอก
- [Presence](/th/concepts/presence) — การแสดงตัวและความพร้อมใช้งานของเอเจนต์
- [Session](/th/concepts/session) — การแยกและการกำหนดเส้นทางของ session
