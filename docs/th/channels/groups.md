---
read_when:
    - การเปลี่ยนพฤติกรรมของแชตกลุ่มหรือการกำหนดเงื่อนไขการกล่าวถึง
summary: พฤติกรรมของแชตกลุ่มข้ามแต่ละพื้นผิวการใช้งาน (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-04-23T05:25:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86e202c7e990e040eb092aaef46bc856ee8d39b2e5fe1c733e24f1b35faa824
    source_path: channels/groups.md
    workflow: 15
---

# กลุ่ม

OpenClaw จัดการแชตกลุ่มอย่างสอดคล้องกันในทุกพื้นผิวการใช้งาน: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo

## เกริ่นนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw “อาศัยอยู่” บนบัญชีแอปส่งข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก
ถ้า**คุณ**อยู่ในกลุ่ม OpenClaw ก็จะมองเห็นกลุ่มนั้นและตอบกลับในกลุ่มนั้นได้

พฤติกรรมเริ่มต้น:

- กลุ่มถูกจำกัดไว้ (`groupPolicy: "allowlist"`)
- การตอบกลับต้องมีการกล่าวถึง เว้นแต่คุณจะปิดการกำหนดเงื่อนไขการกล่าวถึงอย่างชัดเจน

แปลว่า: ผู้ส่งที่อยู่ใน allowlist สามารถเรียกใช้ OpenClaw ได้โดยการกล่าวถึงมัน

> สรุปสั้น ๆ
>
> - **การเข้าถึง DM** ควบคุมโดย `*.allowFrom`
> - **การเข้าถึงกลุ่ม** ควบคุมโดย `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`)
> - **การทริกเกอร์การตอบกลับ** ควบคุมโดยการกำหนดเงื่อนไขการกล่าวถึง (`requireMention`, `/activation`)

โฟลว์แบบรวดเร็ว (สิ่งที่เกิดขึ้นกับข้อความในกลุ่ม):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## การมองเห็นบริบทและ allowlist

มีตัวควบคุมสองแบบที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตให้ทริกเกอร์**: ใครสามารถทริกเกอร์เอเจนต์ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist เฉพาะช่องทาง)
- **การมองเห็นบริบท**: บริบทเสริมใดบ้างที่ถูก inject เข้าไปในโมเดล (ข้อความตอบกลับ, ข้อความอ้างอิง, ประวัติเธรด, เมทาดาทาของข้อความที่ส่งต่อ)

โดยค่าเริ่มต้น OpenClaw ให้ความสำคัญกับพฤติกรรมแชตตามปกติ และคงบริบทไว้ตามที่ได้รับมาเป็นส่วนใหญ่ ซึ่งหมายความว่า allowlist ใช้ตัดสินเป็นหลักว่าใครสามารถทริกเกอร์การกระทำได้ ไม่ใช่ขอบเขตการปกปิดข้อมูลแบบครอบจักรวาลสำหรับทุกข้อความอ้างอิงหรือข้อความย้อนหลัง

พฤติกรรมปัจจุบันขึ้นอยู่กับแต่ละช่องทาง:

- บางช่องทางมีการใช้การกรองตามผู้ส่งกับบริบทเสริมในบางเส้นทางอยู่แล้ว (เช่น การตั้งต้นเธรดของ Slack, การค้นหาการตอบกลับ/เธรดของ Matrix)
- ช่องทางอื่นยังคงส่งผ่านบริบท quote/reply/forward ตามที่ได้รับมา

ทิศทางการเสริมความแข็งแรง (มีแผนไว้):

- `contextVisibility: "all"` (ค่าเริ่มต้น) คงพฤติกรรมปัจจุบันตามที่ได้รับมา
- `contextVisibility: "allowlist"` กรองบริบทเสริมให้เหลือเฉพาะผู้ส่งที่อยู่ใน allowlist
- `contextVisibility: "allowlist_quote"` คือ `allowlist` บวกข้อยกเว้นแบบ explicit หนึ่งรายการสำหรับ quote/reply

จนกว่าโมเดลการเสริมความแข็งแรงนี้จะถูกนำไปใช้ได้อย่างสม่ำเสมอในทุกช่องทาง ให้คาดหวังว่าพฤติกรรมจะต่างกันไปตามแต่ละพื้นผิวการใช้งาน

![โฟลว์ข้อความกลุ่ม](/images/groups-flow.svg)

ถ้าคุณต้องการ...

| เป้าหมาย                                      | สิ่งที่ต้องตั้งค่า                                         |
| --------------------------------------------- | ---------------------------------------------------------- |
| อนุญาตทุกกลุ่ม แต่ตอบกลับเฉพาะเมื่อมี @mention | `groups: { "*": { requireMention: true } }`                |
| ปิดการตอบกลับในกลุ่มทั้งหมด                    | `groupPolicy: "disabled"`                                  |
| เฉพาะบางกลุ่ม                                  | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"` )     |
| ให้มีแค่คุณที่ทริกเกอร์ได้ในกลุ่ม               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## คีย์เซสชัน

- เซสชันกลุ่มใช้คีย์เซสชันรูปแบบ `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัมของ Telegram จะเพิ่ม `:topic:<threadId>` ต่อท้าย group id เพื่อให้แต่ละหัวข้อมีเซสชันของตัวเอง
- แชตโดยตรงใช้เซสชันหลัก (หรือแยกตามผู้ส่ง หากตั้งค่าไว้)
- Heartbeat จะถูกข้ามสำหรับเซสชันกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DM ส่วนตัว + กลุ่มสาธารณะ (เอเจนต์เดียว)

ได้ — รูปแบบนี้ใช้ได้ดีหากทราฟฟิก “ส่วนตัว” ของคุณคือ**DM** และทราฟฟิก “สาธารณะ” ของคุณคือ**กลุ่ม**

เหตุผล: ในโหมดเอเจนต์เดียว DM โดยทั่วไปจะลงที่คีย์เซสชัน**หลัก** (`agent:main:main`) ขณะที่กลุ่มจะใช้คีย์เซสชัน**ที่ไม่ใช่หลัก** (`agent:main:<channel>:group:<id>`) เสมอ หากคุณเปิด sandbox ด้วย `mode: "non-main"` เซสชันกลุ่มเหล่านั้นจะรันบนแบ็กเอนด์ sandbox ที่กำหนดไว้ ขณะที่เซสชัน DM หลักของคุณยังคงรันบนโฮสต์ Docker คือแบ็กเอนด์เริ่มต้นหากคุณไม่ได้เลือกเอง

สิ่งนี้ทำให้คุณมี “สมอง” ของเอเจนต์ตัวเดียว (workspace + memory ร่วมกัน) แต่มีท่าทางการทำงานสองแบบ:

- **DM**: เครื่องมือเต็มรูปแบบ (โฮสต์)
- **กลุ่ม**: sandbox + เครื่องมือแบบจำกัด

> หากคุณต้องการ workspace/persona ที่แยกขาดกันจริง ๆ (“ส่วนตัว” และ “สาธารณะ” ต้องไม่ปะปนกันเลย) ให้ใช้เอเจนต์ตัวที่สอง + bindings ดู [Multi-Agent Routing](/th/concepts/multi-agent)

ตัวอย่าง (DM อยู่บนโฮสต์, กลุ่มถูก sandbox + ใช้เครื่องมือส่งข้อความเท่านั้น):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

ต้องการให้ “กลุ่มมองเห็นได้เฉพาะโฟลเดอร์ X” แทน “ไม่มีสิทธิ์เข้าถึงโฮสต์” ใช่ไหม? ให้คง `workspaceAccess: "none"` ไว้ แล้ว mount เฉพาะพาธที่อยู่ใน allowlist เข้าไปใน sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

ที่เกี่ยวข้อง:

- คีย์การตั้งค่าและค่าเริ่มต้น: [การตั้งค่า Gateway](/th/gateway/configuration-reference#agentsdefaultssandbox)
- ดีบักว่าเหตุใดเครื่องมือจึงถูกบล็อก: [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียด bind mount: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายชื่อที่แสดง

- ป้ายชื่อใน UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่อง; แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, ช่องว่าง -> `-`, คง `#@+._-` ไว้)

## นโยบายกลุ่ม

ควบคุมวิธีจัดการข้อความกลุ่ม/ห้องแยกตามช่องทาง:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| นโยบาย        | พฤติกรรม                                                        |
| ------------- | ---------------------------------------------------------------- |
| `"open"`      | กลุ่มจะข้าม allowlist; แต่การกำหนดเงื่อนไขการกล่าวถึงยังมีผล    |
| `"disabled"`  | บล็อกข้อความกลุ่มทั้งหมดโดยสิ้นเชิง                              |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับ allowlist ที่กำหนดไว้เท่านั้น     |

หมายเหตุ:

- `groupPolicy` แยกจากการกำหนดเงื่อนไขการกล่าวถึง (ซึ่งกำหนดให้ต้องมี @mention)
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (fallback: `allowFrom` แบบ explicit)
- การอนุมัติการจับคู่ DM (รายการใน store ของ `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น; การอนุญาตผู้ส่งในกลุ่มยังคงต้องกำหนดอย่างชัดเจนใน group allowlist
- Discord: allowlist ใช้ `channels.discord.guilds.<id>.channels`
- Slack: allowlist ใช้ `channels.slack.channels`
- Matrix: allowlist ใช้ `channels.matrix.groups` ควรใช้ room ID หรือ alias; การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบ best-effort และชื่อที่ resolve ไม่ได้จะถูกละเลยระหว่างรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง; รองรับ allowlist `users` ระดับต่อห้องด้วย
- Group DM ถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
- allowlist ของ Telegram สามารถจับคู่กับ user ID (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือ username (`"@alice"` หรือ `"alice"`) ได้; คำนำหน้าไม่แยกตัวพิมพ์เล็กใหญ่
- ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หาก group allowlist ของคุณว่าง ข้อความกลุ่มจะถูกบล็อก
- ความปลอดภัยระหว่างรันไทม์: เมื่อไม่มี provider block เลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มจะ fallback ไปยังโหมดแบบ fail-closed (โดยทั่วไปคือ `allowlist`) แทนที่จะสืบทอดจาก `channels.defaults.groupPolicy`

แบบจำลองสั้น ๆ ในใจ (ลำดับการประเมินสำหรับข้อความกลุ่ม):

1. `groupPolicy` (open/disabled/allowlist)
2. group allowlist (`*.groups`, `*.groupAllowFrom`, allowlist เฉพาะช่องทาง)
3. การกำหนดเงื่อนไขการกล่าวถึง (`requireMention`, `/activation`)

## การกำหนดเงื่อนไขการกล่าวถึง (ค่าเริ่มต้น)

ข้อความกลุ่มต้องมีการกล่าวถึง เว้นแต่จะ override แยกตามกลุ่ม ค่าเริ่มต้นอยู่แยกตาม subsystem ภายใต้ `*.groups."*"`

การตอบกลับข้อความของบอตจะนับเป็นการกล่าวถึงโดยนัย เมื่อช่องทางนั้นรองรับเมทาดาทาการตอบกลับ การ quote ข้อความของบอตก็อาจนับเป็นการกล่าวถึงโดยนัยได้เช่นกันในช่องทางที่เปิดเผยเมทาดาทาการ quote กรณีในตัวที่รองรับปัจจุบันได้แก่ Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

หมายเหตุ:

- `mentionPatterns` คือแพตเทิร์น regex ที่ปลอดภัยและไม่แยกตัวพิมพ์เล็กใหญ่; แพตเทิร์นที่ไม่ถูกต้องและรูปแบบ nested-repetition ที่ไม่ปลอดภัยจะถูกละเลย
- พื้นผิวการใช้งานที่มี explicit mention อยู่แล้วจะยังผ่านได้; แพตเทิร์นเป็น fallback
- การ override ระดับเอเจนต์: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อหลายเอเจนต์แชร์กลุ่มเดียวกัน)
- การกำหนดเงื่อนไขการกล่าวถึงจะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับการกล่าวถึงได้เท่านั้น (มี native mention หรือกำหนด `mentionPatterns` ไว้)
- ค่าเริ่มต้นของ Discord อยู่ใน `channels.discord.guilds."*"` (override ได้แยกตาม guild/channel)
- บริบทประวัติกลุ่มจะถูกครอบในรูปแบบเดียวกันในทุกช่องทาง และเป็นแบบ **pending-only** (ข้อความที่ถูกข้ามเพราะการกำหนดเงื่อนไขการกล่าวถึง); ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นแบบ global และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการ override ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

## การจำกัดเครื่องมือสำหรับกลุ่ม/ช่อง (ไม่บังคับ)

การตั้งค่าช่องทางบางแบบรองรับการจำกัดว่าเครื่องมือใดบ้างที่ใช้ได้**ภายในกลุ่ม/ห้อง/ช่องที่กำหนด**

- `tools`: อนุญาต/ปฏิเสธเครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: การ override แยกตามผู้ส่งภายในกลุ่ม
  ให้ใช้คำนำหน้าคีย์แบบ explicit:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และ wildcard `"*"`
  คีย์แบบเก่าที่ไม่มีคำนำหน้ายังรองรับอยู่ และจะจับคู่เป็น `id:` เท่านั้น

ลำดับการ resolve (เฉพาะเจาะจงที่สุดชนะ):

1. การจับคู่ `toolsBySender` ของกลุ่ม/ช่อง
2. `tools` ของกลุ่ม/ช่อง
3. การจับคู่ `toolsBySender` ของค่าเริ่มต้น (`"*"`)
4. `tools` ของค่าเริ่มต้น (`"*"`)

ตัวอย่าง (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

หมายเหตุ:

- การจำกัดเครื่องมือสำหรับกลุ่ม/ช่องจะถูกบังคับใช้เพิ่มเติมจากนโยบายเครื่องมือระดับ global/agent (deny ยังคงมีผลชนะ)
- บางช่องทางใช้โครงสร้างการซ้อนที่ต่างกันสำหรับห้อง/ช่อง (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)

## allowlist ของกลุ่ม

เมื่อมีการกำหนด `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` คีย์เหล่านั้นจะทำหน้าที่เป็น allowlist ของกลุ่ม ใช้ `"*"` เพื่ออนุญาตทุกกลุ่ม ขณะเดียวกันก็ยังตั้งค่าพฤติกรรมการกล่าวถึงเริ่มต้นได้

จุดที่มักสับสน: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตกลุ่ม
สำหรับช่องทางที่รองรับการจับคู่ DM นั้น pairing store จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งในกลุ่มยังคงต้องได้รับการอนุญาตผู้ส่งในกลุ่มอย่างชัดเจนจาก allowlist ในคอนฟิก เช่น `groupAllowFrom` หรือคอนฟิก fallback ที่ระบุไว้สำหรับช่องทางนั้น

เจตนาการใช้งานที่พบบ่อย (คัดลอก/วางได้เลย):

1. ปิดการตอบกลับในกลุ่มทั้งหมด

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. อนุญาตเฉพาะบางกลุ่ม (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. อนุญาตทุกกลุ่ม แต่กำหนดให้ต้องมีการกล่าวถึง (แบบ explicit)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. ให้เฉพาะเจ้าของเท่านั้นที่ทริกเกอร์ได้ในกลุ่ม (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Activation (เจ้าของเท่านั้น)

เจ้าของกลุ่มสามารถสลับการเปิดใช้งานแยกตามกลุ่มได้:

- `/activation mention`
- `/activation always`

เจ้าของจะถูกกำหนดโดย `channels.whatsapp.allowFrom` (หรือ E.164 ของบอตเองหากไม่ได้ตั้งค่าไว้) ให้ส่งคำสั่งเป็นข้อความเดี่ยว ๆ พื้นผิวการใช้งานอื่นในตอนนี้จะเพิกเฉยต่อ `/activation`

## ฟิลด์บริบท

payload ขาเข้าของกลุ่มจะตั้งค่าดังนี้:

- `ChatType=group`
- `GroupSubject` (ถ้าทราบ)
- `GroupMembers` (ถ้าทราบ)
- `WasMentioned` (ผลลัพธ์ของการกำหนดเงื่อนไขการกล่าวถึง)
- หัวข้อฟอรัมของ Telegram จะมี `MessageThreadId` และ `IsForum` เพิ่มเติมด้วย

หมายเหตุเฉพาะช่องทาง:

- BlueBubbles สามารถ enrich ผู้เข้าร่วมกลุ่มบน macOS ที่ไม่มีชื่อได้จากฐานข้อมูล Contacts ภายในเครื่องก่อนเติมค่า `GroupMembers` โดยเป็นตัวเลือกเสริม ฟีเจอร์นี้ปิดไว้เป็นค่าเริ่มต้น และจะทำงานก็ต่อเมื่อผ่านการกำหนดเงื่อนไขกลุ่มตามปกติแล้วเท่านั้น

system prompt ของเอเจนต์จะมีข้อความเกริ่นนำสำหรับกลุ่มใน turn แรกของเซสชันกลุ่มใหม่ โดยจะเตือนโมเดลให้ตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดบรรทัดว่างที่ไม่จำเป็น ใช้การเว้นวรรคแบบแชตปกติ และหลีกเลี่ยงการพิมพ์ลำดับอักขระ `\n` แบบตรงตัว

## รายละเอียดเฉพาะของ iMessage

- ควรใช้ `chat_id:<id>` เมื่อต้อง route หรือใส่ใน allowlist
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับในกลุ่มจะถูกส่งกลับไปยัง `chat_id` เดิมเสมอ

## system prompt ของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎ system prompt ของ WhatsApp ฉบับมาตรฐาน รวมถึงการ resolve prompt สำหรับกลุ่มและข้อความโดยตรง พฤติกรรม wildcard และความหมายของการ override ระดับบัญชี

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับพฤติกรรมเฉพาะ WhatsApp (การ inject ประวัติ รายละเอียดการจัดการการกล่าวถึง)
