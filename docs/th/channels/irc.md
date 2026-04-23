---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับช่อง IRC หรือ DM
    - คุณกำลังกำหนดค่า allowlist ของ IRC นโยบายกลุ่ม หรือการจำกัดด้วยการ mention
summary: การตั้งค่า Plugin IRC การควบคุมการเข้าถึง และการแก้ไขปัญหา
title: IRC
x-i18n:
    generated_at: "2026-04-23T05:26:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: fceab2979db72116689c6c774d6736a8a2eee3559e3f3cf8969e673d317edd94
    source_path: channels/irc.md
    workflow: 15
---

# IRC

ใช้ IRC เมื่อคุณต้องการให้ OpenClaw ทำงานในช่องแบบดั้งเดิม (`#room`) และข้อความส่วนตัว
IRC มาพร้อมเป็น Plugin ส่วนขยาย แต่กำหนดค่าในคอนฟิกหลักภายใต้ `channels.irc`

## เริ่มต้นอย่างรวดเร็ว

1. เปิดใช้งานคอนฟิก IRC ใน `~/.openclaw/openclaw.json`
2. กำหนดอย่างน้อยดังนี้:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

ควรใช้เซิร์ฟเวอร์ IRC แบบส่วนตัวสำหรับการประสานงานของบอต หากคุณตั้งใจจะใช้เครือข่าย IRC สาธารณะ ตัวเลือกที่ใช้กันทั่วไป ได้แก่ Libera.Chat, OFTC และ Snoonet หลีกเลี่ยงช่องสาธารณะที่คาดเดาได้ง่ายสำหรับทราฟฟิก backchannel ของบอตหรือ swarm

3. เริ่มต้นหรือรีสตาร์ต Gateway:

```bash
openclaw gateway run
```

## ค่าเริ่มต้นด้านความปลอดภัย

- `channels.irc.dmPolicy` มีค่าเริ่มต้นเป็น `"pairing"`
- `channels.irc.groupPolicy` มีค่าเริ่มต้นเป็น `"allowlist"`
- เมื่อ `groupPolicy="allowlist"` ให้กำหนด `channels.irc.groups` เพื่อระบุช่องที่อนุญาต
- ใช้ TLS (`channels.irc.tls=true`) เว้นแต่คุณตั้งใจยอมรับการส่งข้อมูลแบบ plaintext

## การควบคุมการเข้าถึง

มี “ด่าน” แยกกันสองส่วนสำหรับช่อง IRC:

1. **การเข้าถึงช่อง** (`groupPolicy` + `groups`): บอตจะยอมรับข้อความจากช่องนั้นเลยหรือไม่
2. **การเข้าถึงของผู้ส่ง** (`groupAllowFrom` / `groups["#channel"].allowFrom` แบบรายช่อง): ใครบ้างที่ได้รับอนุญาตให้เรียกใช้บอตภายในช่องนั้น

คีย์คอนฟิก:

- allowlist ของ DM (การเข้าถึงของผู้ส่งใน DM): `channels.irc.allowFrom`
- allowlist ของผู้ส่งในกลุ่ม (การเข้าถึงของผู้ส่งในช่อง): `channels.irc.groupAllowFrom`
- การควบคุมรายช่อง (ช่อง + ผู้ส่ง + กฎการ mention): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` อนุญาตช่องที่ไม่ได้กำหนดค่าไว้ (**แต่ยังคงถูกจำกัดด้วยการ mention โดยค่าเริ่มต้น**)

รายการใน allowlist ควรใช้ข้อมูลระบุตัวตนผู้ส่งที่คงที่ (`nick!user@host`)
การจับคู่ด้วย nick เปล่าเปลี่ยนแปลงได้ และจะเปิดใช้งานเมื่อ `channels.irc.dangerouslyAllowNameMatching: true` เท่านั้น

### จุดที่มักพลาด: `allowFrom` ใช้สำหรับ DM ไม่ใช่ช่อง

หากคุณเห็น log เช่น:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…หมายความว่าผู้ส่งไม่ได้รับอนุญาตสำหรับข้อความแบบ **กลุ่ม/ช่อง** ให้แก้โดย:

- กำหนด `channels.irc.groupAllowFrom` (ใช้แบบ global กับทุกช่อง) หรือ
- กำหนด allowlist ของผู้ส่งแบบรายช่อง: `channels.irc.groups["#channel"].allowFrom`

ตัวอย่าง (อนุญาตให้ทุกคนใน `#tuirc-dev` คุยกับบอตได้):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## การกระตุ้นการตอบกลับ (mentions)

แม้ว่าช่องจะได้รับอนุญาตแล้ว (ผ่าน `groupPolicy` + `groups`) และผู้ส่งก็ได้รับอนุญาต OpenClaw จะใช้การ **จำกัดด้วยการ mention** โดยค่าเริ่มต้นในบริบทแบบกลุ่ม

นั่นหมายความว่าคุณอาจเห็น log เช่น `drop channel … (missing-mention)` เว้นแต่ข้อความจะมีรูปแบบการ mention ที่ตรงกับบอต

หากต้องการให้บอตตอบกลับในช่อง IRC **โดยไม่ต้อง mention** ให้ปิดการจำกัดด้วยการ mention สำหรับช่องนั้น:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

หรือหากต้องการอนุญาต **ทุก** ช่อง IRC (ไม่มี allowlist รายช่อง) และยังตอบได้โดยไม่ต้องมี mention:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## หมายเหตุด้านความปลอดภัย (แนะนำสำหรับช่องสาธารณะ)

หากคุณอนุญาต `allowFrom: ["*"]` ในช่องสาธารณะ ทุกคนจะสามารถ prompt บอตได้
เพื่อลดความเสี่ยง ให้จำกัดเครื่องมือสำหรับช่องนั้น

### ใช้เครื่องมือชุดเดียวกันสำหรับทุกคนในช่อง

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### ใช้เครื่องมือแตกต่างกันตามผู้ส่ง (เจ้าของมีสิทธิ์มากกว่า)

ใช้ `toolsBySender` เพื่อใช้ policy ที่เข้มงวดกว่ากับ `"*"` และผ่อนปรนกว่ากับ nick ของคุณ:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

หมายเหตุ:

- คีย์ `toolsBySender` ควรใช้ `id:` สำหรับค่าข้อมูลระบุตัวตนผู้ส่ง IRC:
  `id:eigen` หรือ `id:eigen!~eigen@174.127.248.171` เพื่อการจับคู่ที่เข้มงวดยิ่งขึ้น
- คีย์แบบเดิมที่ไม่มี prefix ยังรองรับอยู่ และจะจับคู่แบบ `id:` เท่านั้น
- policy ของผู้ส่งตัวแรกที่ตรงกันจะมีผล โดย `"*"` เป็น wildcard fallback

สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับการเข้าถึงกลุ่มเทียบกับการจำกัดด้วยการ mention (และวิธีที่ทั้งสองส่วนทำงานร่วมกัน) ดู: [/channels/groups](/th/channels/groups)

## NickServ

หากต้องการยืนยันตัวตนกับ NickServ หลังจากเชื่อมต่อ:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

การลงทะเบียนครั้งเดียวแบบไม่บังคับเมื่อเชื่อมต่อ:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

ปิด `register` หลังจากลงทะเบียน nick แล้ว เพื่อหลีกเลี่ยงการพยายาม REGISTER ซ้ำ

## ตัวแปรสภาพแวดล้อม

บัญชีค่าเริ่มต้นรองรับ:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (คั่นด้วยจุลภาค)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## การแก้ไขปัญหา

- หากบอตเชื่อมต่อได้แต่ไม่ตอบกลับในช่องเลย ให้ตรวจสอบ `channels.irc.groups` **และ** ตรวจสอบว่าการจำกัดด้วยการ mention กำลังตัดข้อความทิ้งหรือไม่ (`missing-mention`) หากคุณต้องการให้ตอบโดยไม่ต้อง ping ให้ตั้ง `requireMention:false` สำหรับช่องนั้น
- หากการเข้าสู่ระบบล้มเหลว ให้ตรวจสอบว่า nick ว่างพร้อมใช้งานและรหัสผ่านเซิร์ฟเวอร์ถูกต้อง
- หาก TLS ล้มเหลวบนเครือข่ายแบบกำหนดเอง ให้ตรวจสอบ host/port และการตั้งค่าใบรับรอง

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอน Pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการจำกัดด้วยการ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่งด้านความปลอดภัย
