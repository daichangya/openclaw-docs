---
read_when:
    - การเปลี่ยนลักษณะการทำงานของแชตกลุ่มหรือการควบคุมด้วย mention
summary: ลักษณะการทำงานของแชตกลุ่มในแต่ละแพลตฟอร์ม (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: กลุ่ม
x-i18n:
    generated_at: "2026-04-24T08:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

ลักษณะการทำงานของแชตกลุ่มในแต่ละแพลตฟอร์ม (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)

## เกริ่นนำสำหรับผู้เริ่มต้น (2 นาที)

OpenClaw “ทำงานอยู่” บนบัญชีข้อความของคุณเอง ไม่มีผู้ใช้บอต WhatsApp แยกต่างหาก
ถ้า**คุณ**อยู่ในกลุ่ม OpenClaw ก็จะมองเห็นกลุ่มนั้นและตอบกลับในกลุ่มได้

ลักษณะการทำงานเริ่มต้น:

- กลุ่มจะถูกจำกัด (`groupPolicy: "allowlist"`).
- การตอบกลับต้องมี mention เว้นแต่คุณจะปิดการควบคุมด้วย mention อย่างชัดเจน

สรุปคือ: ผู้ส่งที่อยู่ใน allowlist สามารถเรียก OpenClaw ได้ด้วยการ mention

> สรุปสั้น ๆ
>
> - **การเข้าถึง DM** ควบคุมด้วย `*.allowFrom`
> - **การเข้าถึงกลุ่ม** ควบคุมด้วย `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`)
> - **การทริกเกอร์การตอบกลับ** ควบคุมด้วยการควบคุมด้วย mention (`requireMention`, `/activation`)

ลำดับแบบย่อ (สิ่งที่เกิดขึ้นกับข้อความในกลุ่ม):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## การมองเห็น context และ allowlists

มีตัวควบคุมที่แตกต่างกันสองส่วนที่เกี่ยวข้องกับความปลอดภัยของกลุ่ม:

- **การอนุญาตให้ทริกเกอร์**: ใครสามารถทริกเกอร์เอเจนต์ได้ (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists เฉพาะช่องทาง)
- **การมองเห็น context**: ข้อมูล context เสริมใดบ้างที่ถูกส่งเข้าโมเดล (ข้อความตอบกลับ ข้อความอ้างอิง ประวัติเธรด ข้อมูลเมตาของข้อความส่งต่อ)

ตามค่าเริ่มต้น OpenClaw ให้ความสำคัญกับลักษณะการทำงานแชตปกติและคง context ไว้ใกล้เคียงกับที่ได้รับมาเป็นส่วนใหญ่ ซึ่งหมายความว่า allowlists มีหน้าที่หลักในการตัดสินว่าใครสามารถทริกเกอร์การทำงานได้ ไม่ใช่ขอบเขตการปกปิดข้อมูลแบบครอบจักรวาลสำหรับทุกข้อความอ้างอิงหรือข้อความย้อนหลัง

ลักษณะการทำงานปัจจุบันขึ้นอยู่กับแต่ละช่องทาง:

- บางช่องทางมีการใช้การกรองตามผู้ส่งสำหรับ context เสริมในบางเส้นทางแล้ว (เช่น การ seed เธรดของ Slack, การ lookup reply/thread ของ Matrix)
- ช่องทางอื่น ๆ ยังส่ง context ของ quote/reply/forward ผ่านไปตามที่ได้รับมา

ทิศทางการเสริมความแข็งแกร่ง (วางแผนไว้):

- `contextVisibility: "all"` (ค่าเริ่มต้น) คงลักษณะการทำงานแบบตามที่ได้รับมาในปัจจุบัน
- `contextVisibility: "allowlist"` กรอง context เสริมให้เหลือเฉพาะผู้ส่งที่อยู่ใน allowlist
- `contextVisibility: "allowlist_quote"` คือ `allowlist` พร้อมข้อยกเว้นแบบชัดเจนหนึ่งรายการสำหรับ quote/reply

จนกว่าจะมีการทำให้โมเดลการเสริมความแข็งแกร่งนี้สอดคล้องกันในทุกช่องทาง ให้คาดว่าจะยังมีความแตกต่างกันในแต่ละแพลตฟอร์ม

![ลำดับการไหลของข้อความกลุ่ม](/images/groups-flow.svg)

หากคุณต้องการ...

| เป้าหมาย | สิ่งที่ต้องตั้งค่า |
| --- | --- |
| อนุญาตทุกกลุ่ม แต่ให้ตอบกลับเฉพาะเมื่อมี @mentions | `groups: { "*": { requireMention: true } }` |
| ปิดการตอบกลับในกลุ่มทั้งหมด | `groupPolicy: "disabled"` |
| เฉพาะบางกลุ่มเท่านั้น | `groups: { "<group-id>": { ... } }` (ไม่มีคีย์ `"*"` ) |
| ให้มีแค่คุณเท่านั้นที่ทริกเกอร์ได้ในกลุ่ม | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Session keys

- session ของกลุ่มใช้ session key รูปแบบ `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่องใช้ `agent:<agentId>:<channel>:channel:<id>`)
- หัวข้อฟอรัมของ Telegram จะเพิ่ม `:topic:<threadId>` ต่อท้าย group id เพื่อให้แต่ละหัวข้อมี session ของตัวเอง
- แชตโดยตรงใช้ session หลัก (หรือแยกตามผู้ส่งหากกำหนดค่าไว้)
- ระบบจะข้าม Heartbeat สำหรับ session ของกลุ่ม

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## รูปแบบ: DMs ส่วนตัว + กลุ่มสาธารณะ (เอเจนต์เดียว)

ได้ — รูปแบบนี้ใช้งานได้ดีหากทราฟฟิก “ส่วนตัว” ของคุณเป็น **DMs** และทราฟฟิก “สาธารณะ” ของคุณเป็น **กลุ่ม**

เหตุผล: ในโหมดเอเจนต์เดียว DMs มักจะไปอยู่ใน session key **หลัก** (`agent:main:main`) ขณะที่กลุ่มจะใช้ session key ที่**ไม่ใช่หลัก**เสมอ (`agent:main:<channel>:group:<id>`) ถ้าคุณเปิดใช้ sandboxing ด้วย `mode: "non-main"` session ของกลุ่มเหล่านั้นจะทำงานใน backend ของ sandbox ที่กำหนดไว้ ขณะที่ session DM หลักของคุณยังคงทำงานบนโฮสต์ Docker คือ backend เริ่มต้นหากคุณไม่ได้เลือกเอง

วิธีนี้ทำให้คุณมี “สมอง” ของเอเจนต์ตัวเดียว (workspace + memory ร่วมกัน) แต่มีรูปแบบการทำงานสองแบบ:

- **DMs**: เครื่องมือเต็มรูปแบบ (โฮสต์)
- **Groups**: sandbox + เครื่องมือที่จำกัดเฉพาะงานข้อความ

> หากคุณต้องการ workspace/บุคลิกที่แยกจากกันอย่างแท้จริง (“ส่วนตัว” และ “สาธารณะ” ต้องไม่ปะปนกันเลย) ให้ใช้เอเจนต์ตัวที่สอง + bindings ดู [Multi-Agent Routing](/th/concepts/multi-agent)

ตัวอย่าง (DMs บนโฮสต์, กลุ่มอยู่ใน sandbox + ใช้เฉพาะเครื่องมือส่งข้อความ):

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

ต้องการให้ “กลุ่มมองเห็นได้เฉพาะโฟลเดอร์ X” แทน “ไม่ให้เข้าถึงโฮสต์เลย” ใช่ไหม? ให้คง `workspaceAccess: "none"` ไว้ แล้ว mount เฉพาะ path ที่อยู่ใน allowlist เข้าไปใน sandbox:

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

- คีย์การกำหนดค่าและค่าเริ่มต้น: [การกำหนดค่า Gateway](/th/gateway/config-agents#agentsdefaultssandbox)
- ดีบักสาเหตุที่เครื่องมือถูกบล็อก: [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated)
- รายละเอียด bind mounts: [Sandboxing](/th/gateway/sandboxing#custom-bind-mounts)

## ป้ายชื่อที่แสดง

- ป้ายชื่อใน UI ใช้ `displayName` เมื่อมี โดยจัดรูปแบบเป็น `<channel>:<token>`
- `#room` สงวนไว้สำหรับห้อง/ช่อง; แชตกลุ่มใช้ `g-<slug>` (ตัวพิมพ์เล็ก, ช่องว่าง -> `-`, คง `#@+._-` ไว้)

## นโยบายกลุ่ม

ควบคุมวิธีจัดการข้อความในกลุ่ม/ห้องตามแต่ละช่องทาง:

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

| นโยบาย | ลักษณะการทำงาน |
| --- | --- |
| `"open"` | กลุ่มจะข้าม allowlists; แต่การควบคุมด้วย mention ยังมีผลอยู่ |
| `"disabled"` | บล็อกข้อความกลุ่มทั้งหมดโดยสมบูรณ์ |
| `"allowlist"` | อนุญาตเฉพาะกลุ่ม/ห้องที่ตรงกับ allowlist ที่กำหนดค่าไว้เท่านั้น |

หมายเหตุ:

- `groupPolicy` แยกจากการควบคุมด้วย mention (ซึ่งต้องใช้ @mentions)
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: ใช้ `groupAllowFrom` (สำรองเป็น `allowFrom` แบบระบุชัด)
- การอนุมัติการจับคู่ DM (รายการใน `*-allowFrom`) ใช้กับการเข้าถึง DM เท่านั้น; การอนุญาตผู้ส่งในกลุ่มยังคงต้องกำหนดอย่างชัดเจนผ่าน group allowlists
- Discord: allowlist ใช้ `channels.discord.guilds.<id>.channels`
- Slack: allowlist ใช้ `channels.slack.channels`
- Matrix: allowlist ใช้ `channels.matrix.groups` ควรใช้ room IDs หรือ aliases; การค้นหาชื่อห้องที่เข้าร่วมแล้วเป็นแบบ best-effort และชื่อที่ resolve ไม่ได้จะถูกละเว้นขณะรันไทม์ ใช้ `channels.matrix.groupAllowFrom` เพื่อจำกัดผู้ส่ง; รองรับ allowlists แบบ `users` รายห้องด้วยเช่นกัน
- Group DM ถูกควบคุมแยกต่างหาก (`channels.discord.dm.*`, `channels.slack.dm.*`)
- allowlist ของ Telegram สามารถจับคู่ด้วย user IDs (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) หรือ usernames (`"@alice"` หรือ `"alice"`) โดย prefixes ไม่สนตัวพิมพ์เล็กใหญ่
- ค่าเริ่มต้นคือ `groupPolicy: "allowlist"`; หาก group allowlist ของคุณว่างอยู่ ข้อความกลุ่มจะถูกบล็อก
- ความปลอดภัยขณะรันไทม์: เมื่อไม่มี provider block เลย (`channels.<provider>` ไม่มีอยู่) group policy จะกลับไปใช้โหมด fail-closed (โดยทั่วไปคือ `allowlist`) แทนการสืบทอดจาก `channels.defaults.groupPolicy`

โมเดลจำแบบย่อ (ลำดับการประเมินสำหรับข้อความกลุ่ม):

1. `groupPolicy` (open/disabled/allowlist)
2. group allowlists (`*.groups`, `*.groupAllowFrom`, allowlist เฉพาะช่องทาง)
3. การควบคุมด้วย mention (`requireMention`, `/activation`)

## การควบคุมด้วย mention (ค่าเริ่มต้น)

ข้อความกลุ่มต้องมี mention เว้นแต่จะมีการ override รายกลุ่ม ค่าเริ่มต้นอยู่ในแต่ละ subsystem ใต้ `*.groups."*"`

การตอบกลับข้อความของบอตจะนับเป็น mention โดยนัยเมื่อช่องทางนั้นรองรับข้อมูลเมตาของการตอบกลับ
การ quote ข้อความของบอตก็อาจนับเป็น mention โดยนัยได้เช่นกันบนช่องทางที่เปิดเผยข้อมูลเมตาของ quote กรณีที่รองรับในตัวปัจจุบันได้แก่ Telegram, WhatsApp, Slack, Discord, Microsoft Teams และ ZaloUser

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

- `mentionPatterns` คือแพตเทิร์น regex ที่ปลอดภัยและไม่สนตัวพิมพ์เล็กใหญ่; แพตเทิร์นที่ไม่ถูกต้องและรูปแบบ nested-repetition ที่ไม่ปลอดภัยจะถูกละเว้น
- แพลตฟอร์มที่มี mentions แบบชัดเจนยังคงผ่านได้; แพตเทิร์นเป็นเพียงตัวสำรอง
- การ override รายเอเจนต์: `agents.list[].groupChat.mentionPatterns` (มีประโยชน์เมื่อหลายเอเจนต์ใช้กลุ่มเดียวกัน)
- การควบคุมด้วย mention จะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับ mention ได้เท่านั้น (มี native mentions หรือกำหนด `mentionPatterns` ไว้)
- ค่าเริ่มต้นของ Discord อยู่ที่ `channels.discord.guilds."*"` (override ได้ตาม guild/channel)
- context ประวัติกลุ่มจะถูกห่อในรูปแบบเดียวกันในทุกช่องทาง และเป็นแบบ **pending-only** (ข้อความที่ถูกข้ามเพราะการควบคุมด้วย mention); ใช้ `messages.groupChat.historyLimit` สำหรับค่าเริ่มต้นแบบ global และ `channels.<channel>.historyLimit` (หรือ `channels.<channel>.accounts.*.historyLimit`) สำหรับการ override ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

## การจำกัดเครื่องมือในกลุ่ม/ช่อง (ไม่บังคับ)

การกำหนดค่าบางช่องทางรองรับการจำกัดว่าเครื่องมือใดบ้างที่ใช้ได้ **ภายในกลุ่ม/ห้อง/ช่องที่ระบุ**

- `tools`: allow/deny เครื่องมือสำหรับทั้งกลุ่ม
- `toolsBySender`: การ override รายผู้ส่งภายในกลุ่ม
  ให้ใช้คีย์พร้อม prefix แบบชัดเจน:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` และ wildcard `"*"`
  คีย์แบบเดิมที่ไม่มี prefix ยังรองรับอยู่และจะจับคู่แบบ `id:` เท่านั้น

ลำดับการ resolve (ที่เฉพาะเจาะจงที่สุดชนะ):

1. การจับคู่ `toolsBySender` ของกลุ่ม/ช่อง
2. `tools` ของกลุ่ม/ช่อง
3. การจับคู่ `toolsBySender` ของค่าเริ่มต้น (`"*"` )
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

- การจำกัดเครื่องมือในกลุ่ม/ช่องจะถูกนำไปใช้เพิ่มเติมจากนโยบายเครื่องมือระดับ global/agent (deny ยังคงมีผลสูงสุด)
- บางช่องทางใช้โครงสร้างซ้อนสำหรับห้อง/ช่องต่างกัน (เช่น Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`)

## Group allowlists

เมื่อมีการกำหนดค่า `channels.whatsapp.groups`, `channels.telegram.groups` หรือ `channels.imessage.groups` คีย์เหล่านั้นจะทำหน้าที่เป็น group allowlist ใช้ `"*"` เพื่ออนุญาตทุกกลุ่ม ขณะเดียวกันก็ยังตั้งค่าลักษณะการทำงานของ mention เริ่มต้นได้

จุดที่มักสับสน: การอนุมัติการจับคู่ DM ไม่เหมือนกับการอนุญาตสำหรับกลุ่ม
สำหรับช่องทางที่รองรับการจับคู่ DM รายการใน pairing store จะปลดล็อกเฉพาะ DM เท่านั้น คำสั่งในกลุ่มยังคงต้องอาศัยการอนุญาตผู้ส่งในกลุ่มอย่างชัดเจนจาก config allowlists เช่น `groupAllowFrom` หรือ config fallback ที่มีเอกสารระบุไว้สำหรับช่องทางนั้น

เจตนาการใช้งานที่พบบ่อย (คัดลอก/วางได้เลย):

1. ปิดการตอบกลับในกลุ่มทั้งหมด

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. อนุญาตเฉพาะบางกลุ่มเท่านั้น (WhatsApp)

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

3. อนุญาตทุกกลุ่ม แต่ต้องมี mention (แบบระบุชัด)

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

เจ้าของกลุ่มสามารถสลับการเปิดใช้งานรายกลุ่มได้:

- `/activation mention`
- `/activation always`

เจ้าของจะถูกกำหนดจาก `channels.whatsapp.allowFrom` (หรือ E.164 ของตัวบอตเองหากไม่ได้ตั้งค่า) ส่งคำสั่งเป็นข้อความเดี่ยว ๆ ขณะนี้แพลตฟอร์มอื่นจะไม่สนใจ `/activation`

## ฟิลด์ context

payload ขาเข้าของกลุ่มจะตั้งค่า:

- `ChatType=group`
- `GroupSubject` (หากทราบ)
- `GroupMembers` (หากทราบ)
- `WasMentioned` (ผลลัพธ์ของการควบคุมด้วย mention)
- หัวข้อฟอรัมของ Telegram จะรวม `MessageThreadId` และ `IsForum` ด้วย

หมายเหตุเฉพาะช่องทาง:

- BlueBubbles สามารถเพิ่มข้อมูลผู้เข้าร่วมกลุ่ม macOS ที่ไม่มีชื่อจากฐานข้อมูล Contacts ในเครื่องได้ก่อนเติม `GroupMembers` โดยเป็นตัวเลือกปิดไว้ตามค่าเริ่มต้น และจะทำงานหลังจากผ่านการควบคุมกลุ่มตามปกติแล้วเท่านั้น

system prompt ของเอเจนต์จะรวมบทเกริ่นนำสำหรับกลุ่มในเทิร์นแรกของ session กลุ่มใหม่ โดยจะเตือนให้โมเดลตอบเหมือนมนุษย์ หลีกเลี่ยงตาราง Markdown ลดการใช้บรรทัดว่างที่ไม่จำเป็น และทำตามการเว้นวรรคแบบแชตปกติ รวมถึงหลีกเลี่ยงการพิมพ์ลำดับอักขระ `\n` แบบตรงตัว ชื่อกลุ่มและป้ายชื่อผู้เข้าร่วมที่มาจากช่องทางจะถูกแสดงเป็นข้อมูลเมตาที่ไม่น่าเชื่อถือใน fenced block ไม่ใช่เป็นคำสั่งระบบแบบ inline

## รายละเอียดเฉพาะของ iMessage

- ควรใช้ `chat_id:<id>` เมื่อกำหนดเส้นทางหรือทำ allowlist
- แสดงรายการแชต: `imsg chats --limit 20`
- การตอบกลับในกลุ่มจะส่งกลับไปยัง `chat_id` เดิมเสมอ

## system prompts ของ WhatsApp

ดู [WhatsApp](/th/channels/whatsapp#system-prompts) สำหรับกฎ system prompt ของ WhatsApp ที่เป็นข้อมูลอ้างอิงหลัก รวมถึงการ resolve prompt สำหรับกลุ่มและแชตโดยตรง ลักษณะการทำงานของ wildcard และความหมายของ account override

## รายละเอียดเฉพาะของ WhatsApp

ดู [ข้อความกลุ่ม](/th/channels/group-messages) สำหรับลักษณะการทำงานที่มีเฉพาะ WhatsApp (การแทรกประวัติ รายละเอียดการจัดการ mention)

## ที่เกี่ยวข้อง

- [ข้อความกลุ่ม](/th/channels/group-messages)
- [กลุ่มการกระจายข้อความ](/th/channels/broadcast-groups)
- [การกำหนดเส้นทางของช่องทาง](/th/channels/channel-routing)
- [การจับคู่](/th/channels/pairing)
