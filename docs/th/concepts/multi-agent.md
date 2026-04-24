---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'การกำหนดเส้นทางหลายเอเจนต์: เอเจนต์แบบแยกอิสระ บัญชีแชนแนล และ bindings'
title: การกำหนดเส้นทางหลายเอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:06:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

เรียกใช้เอเจนต์แบบ _แยกอิสระ_ หลายตัว — แต่ละตัวมี workspace, ไดเรกทอรีสถานะ (`agentDir`) และประวัติเซสชันของตัวเอง — พร้อมกับหลายบัญชีแชนแนล (เช่น WhatsApp สองบัญชี) ภายใน Gateway ที่กำลังทำงานอยู่หนึ่งตัว ข้อความขาเข้าจะถูกกำหนดเส้นทางไปยังเอเจนต์ที่ถูกต้องผ่าน bindings

**เอเจนต์** ในที่นี้หมายถึงขอบเขตทั้งหมดต่อ persona: ไฟล์ workspace, auth profiles, model registry และ session store `agentDir` คือไดเรกทอรีสถานะบนดิสก์ที่เก็บ config ต่อเอเจนต์ไว้ที่ `~/.openclaw/agents/<agentId>/` ส่วน **binding** คือการแมปบัญชีแชนแนล (เช่น Slack workspace หรือหมายเลข WhatsApp) ไปยังเอเจนต์ตัวใดตัวหนึ่ง

## “หนึ่งเอเจนต์” คืออะไร

**เอเจนต์** คือสมองที่มีขอบเขตครบถ้วนพร้อมของตัวเอง:

- **Workspace** (ไฟล์, `AGENTS.md`/`SOUL.md`/`USER.md`, โน้ตภายในเครื่อง, กฎ persona)
- **ไดเรกทอรีสถานะ** (`agentDir`) สำหรับ auth profiles, model registry และ config ต่อเอเจนต์
- **Session store** (ประวัติแชต + สถานะการกำหนดเส้นทาง) ภายใต้ `~/.openclaw/agents/<agentId>/sessions`

Auth profiles เป็นแบบ **ต่อเอเจนต์** แต่ละเอเจนต์จะอ่านจากไฟล์ของตัวเอง:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` ยังเป็นเส้นทางเรียกคืนข้ามเซสชันที่ปลอดภัยกว่าที่นี่เช่นกัน: มันจะส่งคืน
มุมมองที่มีขอบเขตและผ่านการ sanitize แล้ว ไม่ใช่ transcript ดิบทั้งก้อน การเรียกคืนฝั่ง assistant
จะลบ thinking tags, โครงสร้าง `<relevant-memories>`, payload XML
ของการเรียก tool แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียก tool ที่ถูกตัดทอน),
โครงสร้างการเรียก tool ที่ถูกลดระดับ, model control
tokens แบบ ASCII/full-width ที่รั่วออกมา และ MiniMax tool-call XML ที่ผิดรูปแบบก่อนการ redaction/truncation

ข้อมูลรับรองของเอเจนต์หลักจะ **ไม่** ถูกใช้ร่วมกันโดยอัตโนมัติ อย่าใช้ `agentDir`
ร่วมกันระหว่างเอเจนต์เด็ดขาด (จะทำให้เกิดการชนกันของ auth/session) หากคุณต้องการใช้ข้อมูลรับรองร่วมกัน
ให้คัดลอก `auth-profiles.json` ไปยัง `agentDir` ของเอเจนต์อีกตัว

Skills จะถูกโหลดจาก workspace ของแต่ละเอเจนต์รวมถึงรากที่ใช้ร่วมกัน เช่น
`~/.openclaw/skills` แล้วจึงถูกกรองตาม allowlist ของ Skills ที่มีผลกับเอเจนต์เมื่อ
มีการกำหนดค่า ใช้ `agents.defaults.skills` สำหรับ baseline ที่ใช้ร่วมกัน และ
`agents.list[].skills` สำหรับการแทนที่เฉพาะเอเจนต์ ดู
[Skills: per-agent vs shared](/th/tools/skills#per-agent-vs-shared-skills) และ
[Skills: agent skill allowlists](/th/tools/skills#agent-skill-allowlists)

Gateway สามารถโฮสต์ได้ทั้ง **หนึ่งเอเจนต์** (ค่าเริ่มต้น) หรือ **หลายเอเจนต์** แบบอยู่ข้างกัน

**หมายเหตุเรื่อง workspace:** workspace ของแต่ละเอเจนต์คือ **cwd เริ่มต้น** ไม่ใช่
sandbox แบบบังคับ พาธแบบ relative จะ resolve ภายใน workspace แต่พาธแบบ absolute ยังสามารถ
เข้าถึงตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้งาน sandboxing ดู
[Sandboxing](/th/gateway/sandboxing)

## พาธต่าง ๆ (แผนที่แบบย่อ)

- Config: `~/.openclaw/openclaw.json` (หรือ `OPENCLAW_CONFIG_PATH`)
- ไดเรกทอรีสถานะ: `~/.openclaw` (หรือ `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (หรือ `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### โหมดเอเจนต์เดียว (ค่าเริ่มต้น)

หากคุณไม่ทำอะไรเลย OpenClaw จะรันเอเจนต์เดียว:

- `agentId` มีค่าเริ่มต้นเป็น **`main`**
- เซสชันจะใช้คีย์เป็น `agent:main:<mainKey>`
- Workspace มีค่าเริ่มต้นเป็น `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<profile>` เมื่อมีการตั้ง `OPENCLAW_PROFILE`)
- State มีค่าเริ่มต้นเป็น `~/.openclaw/agents/main/agent`

## ตัวช่วยจัดการเอเจนต์

ใช้วิซาร์ดเอเจนต์เพื่อเพิ่มเอเจนต์แบบแยกอิสระตัวใหม่:

```bash
openclaw agents add work
```

จากนั้นเพิ่ม `bindings` (หรือให้วิซาร์ดทำให้) เพื่อกำหนดเส้นทางข้อความขาเข้า

ตรวจสอบด้วย:

```bash
openclaw agents list --bindings
```

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="สร้าง workspace ของแต่ละเอเจนต์">

ใช้วิซาร์ดหรือสร้าง workspaces ด้วยตนเอง:

```bash
openclaw agents add coding
openclaw agents add social
```

แต่ละเอเจนต์จะมี workspace ของตัวเองพร้อม `SOUL.md`, `AGENTS.md` และ `USER.md` แบบไม่บังคับ รวมทั้งมี `agentDir` และ session store เฉพาะภายใต้ `~/.openclaw/agents/<agentId>`

  </Step>

  <Step title="สร้างบัญชีแชนแนล">

สร้างหนึ่งบัญชีต่อหนึ่งเอเจนต์บนแชนแนลที่คุณต้องการ:

- Discord: หนึ่งบอตต่อหนึ่งเอเจนต์ เปิด Message Content Intent และคัดลอก token ของแต่ละตัว
- Telegram: หนึ่งบอตต่อหนึ่งเอเจนต์ผ่าน BotFather และคัดลอก token ของแต่ละตัว
- WhatsApp: ลิงก์แต่ละหมายเลขโทรศัพท์ต่อบัญชี

```bash
openclaw channels login --channel whatsapp --account work
```

ดูคู่มือของแชนแนล: [Discord](/th/channels/discord), [Telegram](/th/channels/telegram), [WhatsApp](/th/channels/whatsapp)

  </Step>

  <Step title="เพิ่มเอเจนต์ บัญชี และ bindings">

เพิ่มเอเจนต์ภายใต้ `agents.list`, เพิ่มบัญชีแชนแนลภายใต้ `channels.<channel>.accounts` และเชื่อมเข้าด้วยกันด้วย `bindings` (ดูตัวอย่างด้านล่าง)

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

เมื่อมี **หลายเอเจนต์** แต่ละ `agentId` จะกลายเป็น **persona ที่แยกอิสระอย่างสมบูรณ์**:

- **หมายเลขโทรศัพท์/บัญชีต่างกัน** (ต่อ `accountId` ของแต่ละแชนแนล)
- **บุคลิกต่างกัน** (ผ่านไฟล์ workspace ต่อเอเจนต์ เช่น `AGENTS.md` และ `SOUL.md`)
- **auth + sessions แยกจากกัน** (ไม่มีการปะปนกัน เว้นแต่จะเปิดใช้งานอย่างชัดเจน)

สิ่งนี้ทำให้ **หลายคน** ใช้ Gateway server เดียวกันร่วมกันได้ โดยยังคงแยก “สมอง” AI และข้อมูลของแต่ละคนออกจากกัน

## การค้นหา QMD memory ข้ามเอเจนต์

หากเอเจนต์หนึ่งควรค้นหา transcripts ของเซสชัน QMD ของอีกเอเจนต์ ให้เพิ่ม
collections เพิ่มเติมภายใต้ `agents.list[].memorySearch.qmd.extraCollections`
ใช้ `agents.defaults.memorySearch.qmd.extraCollections` เฉพาะเมื่อทุกเอเจนต์
ควรสืบทอด transcript collections ที่ใช้ร่วมกันแบบเดียวกัน

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
ยังคงต้องระบุอย่างชัดเจนเมื่อพาธอยู่นอก workspace ของเอเจนต์ พาธภายใน
workspace จะยังคงอยู่ในขอบเขตของเอเจนต์ เพื่อให้แต่ละเอเจนต์มีชุดการค้นหา transcript ของตัวเอง

## WhatsApp หมายเลขเดียว หลายคน (DM split)

คุณสามารถกำหนดเส้นทาง **DM ของ WhatsApp ที่ต่างกัน** ไปยังเอเจนต์ต่างกันได้ โดยยังคงใช้ **บัญชี WhatsApp เดียวกัน** จับคู่ตาม E.164 ของผู้ส่ง (เช่น `+15551234567`) ด้วย `peer.kind: "direct"` คำตอบจะยังส่งออกจากหมายเลข WhatsApp เดิมเสมอ (ไม่มี sender identity แยกตามเอเจนต์)

รายละเอียดสำคัญ: direct chats จะถูกรวมเข้ากับ **main session key** ของเอเจนต์ ดังนั้นการแยกจริงจึงต้องใช้ **หนึ่งเอเจนต์ต่อหนึ่งคน**

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

- การควบคุมการเข้าถึง DM เป็นแบบ **โกลบอลต่อหนึ่งบัญชี WhatsApp** (pairing/allowlist) ไม่ใช่ต่อเอเจนต์
- สำหรับกลุ่มที่ใช้ร่วมกัน ให้ผูกกลุ่มนั้นกับเอเจนต์เดียว หรือใช้ [Broadcast groups](/th/channels/broadcast-groups)

## กฎการกำหนดเส้นทาง (ข้อความเลือกเอเจนต์อย่างไร)

Bindings เป็นแบบ **กำหนดแน่นอน** และ **รายการที่เฉพาะที่สุดชนะ**:

1. การจับคู่ `peer` (id ของ DM/กลุ่ม/แชนแนลที่ตรงกันทุกตัว)
2. การจับคู่ `parentPeer` (การสืบทอดของเธรด)
3. `guildId + roles` (การกำหนดเส้นทาง role ของ Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. การจับคู่ `accountId` สำหรับแชนแนล
7. การจับคู่ระดับแชนแนล (`accountId: "*"`)
8. fallback ไปยังเอเจนต์เริ่มต้น (`agents.list[].default`, มิฉะนั้นใช้รายการแรก, ค่าเริ่มต้น: `main`)

หากมีหลาย binding ที่ตรงกันในระดับเดียวกัน รายการแรกตามลำดับใน config จะเป็นผู้ชนะ
หาก binding ตั้งค่า match fields หลายตัว (เช่น `peer` + `guildId`) ฟิลด์ที่ระบุไว้ทั้งหมดต้องตรงกัน (`AND` semantics)

รายละเอียดสำคัญเรื่องขอบเขตบัญชี:

- binding ที่ไม่ระบุ `accountId` จะจับคู่กับบัญชีเริ่มต้นเท่านั้น
- ใช้ `accountId: "*"` สำหรับ fallback ระดับแชนแนลครอบคลุมทุกบัญชี
- หากภายหลังคุณเพิ่ม binding เดียวกันสำหรับเอเจนต์เดียวกันพร้อม account id แบบระบุชัดเจน OpenClaw จะอัปเกรด channel-only binding เดิมให้เป็นแบบมีขอบเขตตามบัญชีแทนที่จะทำซ้ำ

## หลายบัญชี / หลายหมายเลขโทรศัพท์

แชนแนลที่รองรับ **หลายบัญชี** (เช่น WhatsApp) ใช้ `accountId` เพื่อระบุ
แต่ละการล็อกอิน แต่ละ `accountId` สามารถถูกกำหนดเส้นทางไปยังเอเจนต์ต่างกันได้ ทำให้เซิร์ฟเวอร์หนึ่งเครื่องโฮสต์
หลายหมายเลขโทรศัพท์ได้โดยไม่ปะปนกันของเซสชัน

หากคุณต้องการบัญชีเริ่มต้นระดับแชนแนลเมื่อไม่ระบุ `accountId` ให้ตั้งค่า
`channels.<channel>.defaultAccount` (ไม่บังคับ) หากไม่ตั้งค่า OpenClaw จะ fallback
ไปยัง `default` หากมี มิฉะนั้นจะใช้ account id ตัวแรกที่กำหนดไว้ (เรียงลำดับแล้ว)

แชนแนลทั่วไปที่รองรับรูปแบบนี้ ได้แก่:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## แนวคิด

- `agentId`: หนึ่ง “สมอง” (workspace, auth ต่อเอเจนต์, session store ต่อเอเจนต์)
- `accountId`: หนึ่งอินสแตนซ์ของบัญชีแชนแนล (เช่นบัญชี WhatsApp `"personal"` เทียบกับ `"biz"`)
- `binding`: กำหนดเส้นทางข้อความขาเข้าไปยัง `agentId` ตาม `(channel, accountId, peer)` และอาจรวม guild/team ids ด้วย
- direct chats จะถูกรวมเป็น `agent:<agentId>:<mainKey>` (main ต่อเอเจนต์; `session.mainKey`)

## ตัวอย่างตามแพลตฟอร์ม

### Discord bots แยกตามเอเจนต์

แต่ละบัญชีบอต Discord จะถูกแมปกับ `accountId` ที่ไม่ซ้ำกัน ผูกแต่ละบัญชีเข้ากับเอเจนต์และคง allowlists แยกตามบอต

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

- เชิญแต่ละบอตเข้าสู่กิลด์และเปิดใช้งาน Message Content Intent
- Tokens อยู่ที่ `channels.discord.accounts.<id>.token` (บัญชีเริ่มต้นสามารถใช้ `DISCORD_BOT_TOKEN` ได้)

### Telegram bots แยกตามเอเจนต์

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

- สร้างหนึ่งบอตต่อหนึ่งเอเจนต์ด้วย BotFather และคัดลอก token ของแต่ละตัว
- Tokens อยู่ที่ `channels.telegram.accounts.<id>.botToken` (บัญชีเริ่มต้นสามารถใช้ `TELEGRAM_BOT_TOKEN` ได้)

### หมายเลข WhatsApp แยกตามเอเจนต์

ลิงก์แต่ละบัญชีก่อนเริ่ม gateway:

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

  // การกำหนดเส้นทางแบบกำหนดแน่นอน: รายการแรกที่ตรงจะชนะ (เรียงจากเฉพาะที่สุดก่อน)
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // การแทนที่แยกตาม peer แบบไม่บังคับ (ตัวอย่าง: ส่งกลุ่มเฉพาะไปยัง work agent)
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // ปิดไว้เป็นค่าเริ่มต้น: การส่งข้อความระหว่างเอเจนต์ต้องเปิดใช้งานและใส่ allowlist อย่างชัดเจน
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
          // การแทนที่แบบไม่บังคับ ค่าเริ่มต้น: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // การแทนที่แบบไม่บังคับ ค่าเริ่มต้น: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## ตัวอย่าง: แชตรายวันบน WhatsApp + งานเชิงลึกบน Telegram

แยกตามแชนแนล: กำหนดเส้นทาง WhatsApp ไปยังเอเจนต์สำหรับงานประจำวันแบบรวดเร็ว และ Telegram ไปยังเอเจนต์ Opus

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

- หากคุณมีหลายบัญชีสำหรับแชนแนลหนึ่ง ให้เพิ่ม `accountId` ลงใน binding (เช่น `{ channel: "whatsapp", accountId: "personal" }`)
- หากต้องการกำหนดเส้นทาง DM/กลุ่มเดียวไปยัง Opus ขณะที่ที่เหลือยังไปหา chat ให้เพิ่ม binding แบบ `match.peer` สำหรับ peer นั้น; การจับคู่แบบ peer จะชนะกฎระดับแชนแนลเสมอ

## ตัวอย่าง: แชนแนลเดียวกัน แต่มีหนึ่ง peer ไปหา Opus

คง WhatsApp ไว้กับเอเจนต์แบบเร็ว แต่กำหนดเส้นทาง DM รายหนึ่งไปหา Opus:

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

Peer bindings จะชนะเสมอ ดังนั้นให้วางไว้เหนือกฎระดับแชนแนล

## Family agent ที่ผูกกับกลุ่ม WhatsApp

ผูก family agent โดยเฉพาะเข้ากับกลุ่ม WhatsApp เดียว พร้อม mention gating
และนโยบายเครื่องมือที่เข้มงวดขึ้น:

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

- รายการ allow/deny ของ tool คือ **tools** ไม่ใช่ skills หาก skill ใดต้องรัน
  ไบนารี ให้ตรวจสอบว่าอนุญาต `exec` แล้ว และมีไบนารีนั้นอยู่ใน sandbox
- หากต้องการการควบคุมที่เข้มงวดยิ่งขึ้น ให้ตั้งค่า `agents.list[].groupChat.mentionPatterns` และเปิดใช้
  group allowlists ไว้สำหรับแชนแนลนั้นต่อไป

## การกำหนดค่า Sandbox และเครื่องมือแยกตามเอเจนต์

แต่ละเอเจนต์สามารถมีข้อจำกัด sandbox และเครื่องมือของตัวเองได้:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // ไม่มี sandbox สำหรับ personal agent
        },
        // ไม่มีข้อจำกัดของเครื่องมือ - ใช้งานได้ทุกเครื่องมือ
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
          allow: ["read"],                    // อนุญาตเฉพาะ read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // ปฏิเสธตัวอื่น
        },
      },
    ],
  },
}
```

หมายเหตุ: `setupCommand` อยู่ภายใต้ `sandbox.docker` และจะรันหนึ่งครั้งตอนสร้างคอนเทนเนอร์
การแทนที่ `sandbox.docker.*` แยกตามเอเจนต์จะถูกละเว้นเมื่อ scope ที่ resolve ได้เป็น `"shared"`

**ประโยชน์:**

- **การแยกด้านความปลอดภัย**: จำกัดเครื่องมือสำหรับเอเจนต์ที่ไม่น่าเชื่อถือ
- **การควบคุมทรัพยากร**: ทำ sandbox ให้เอเจนต์บางตัว ขณะที่ตัวอื่นยังทำงานบนโฮสต์
- **นโยบายที่ยืดหยุ่น**: สิทธิ์ต่างกันได้ในแต่ละเอเจนต์

หมายเหตุ: `tools.elevated` เป็นแบบ **โกลบอล** และอิงตามผู้ส่ง; ไม่สามารถกำหนดค่าแยกตามเอเจนต์ได้
หากคุณต้องการขอบเขตแยกตามเอเจนต์ ให้ใช้ `agents.list[].tools` เพื่อปฏิเสธ `exec`
สำหรับการกำหนดเป้าหมายกลุ่ม ให้ใช้ `agents.list[].groupChat.mentionPatterns` เพื่อให้ @mentions แมปไปยังเอเจนต์ที่ตั้งใจไว้ได้อย่างชัดเจน

ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับตัวอย่างโดยละเอียด

## ที่เกี่ยวข้อง

- [Channel Routing](/th/channels/channel-routing) — วิธีที่ข้อความถูกกำหนดเส้นทางไปยังเอเจนต์
- [Sub-Agents](/th/tools/subagents) — การ spawn การรันเอเจนต์ในเบื้องหลัง
- [ACP Agents](/th/tools/acp-agents) — การรัน external coding harnesses
- [Presence](/th/concepts/presence) — presence และความพร้อมใช้งานของเอเจนต์
- [Session](/th/concepts/session) — การแยกและการกำหนดเส้นทางของเซสชัน
