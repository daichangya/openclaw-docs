---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับช่อง IRC หรือ DM
    - คุณกำลังกำหนดค่า allowlist ของ IRC นโยบายกลุ่ม หรือ mention gating
summary: การตั้งค่า Plugin IRC การควบคุมการเข้าถึง และการแก้ไขปัญหา
title: IRC
x-i18n:
    generated_at: "2026-04-24T08:58:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

ใช้ IRC เมื่อคุณต้องการให้ OpenClaw อยู่ในช่องแบบดั้งเดิม (`#room`) และข้อความส่วนตัว
IRC มาพร้อมเป็น Plugin ที่รวมมาให้ แต่จะกำหนดค่าในคอนฟิกหลักภายใต้ `channels.irc`

## เริ่มต้นอย่างรวดเร็ว

1. เปิดใช้คอนฟิก IRC ใน `~/.openclaw/openclaw.json`
2. ตั้งค่าอย่างน้อย:

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

ควรใช้เซิร์ฟเวอร์ IRC แบบส่วนตัวสำหรับการประสานงานของบอต หากคุณตั้งใจใช้เครือข่าย IRC สาธารณะ ตัวเลือกที่พบบ่อยได้แก่ Libera.Chat, OFTC และ Snoonet หลีกเลี่ยงช่องสาธารณะที่คาดเดาได้ง่ายสำหรับทราฟฟิก backchannel ของบอตหรือ swarm

3. เริ่มต้น/รีสตาร์ต Gateway:

```bash
openclaw gateway run
```

## ค่าเริ่มต้นด้านความปลอดภัย

- `channels.irc.dmPolicy` มีค่าเริ่มต้นเป็น `"pairing"`
- `channels.irc.groupPolicy` มีค่าเริ่มต้นเป็น `"allowlist"`
- เมื่อ `groupPolicy="allowlist"` ให้ตั้งค่า `channels.irc.groups` เพื่อกำหนดช่องที่อนุญาต
- ใช้ TLS (`channels.irc.tls=true`) เว้นแต่คุณตั้งใจยอมรับการส่งข้อมูลแบบ plaintext

## การควบคุมการเข้าถึง

มี “ด่าน” แยกกันสองชั้นสำหรับช่อง IRC:

1. **การเข้าถึงช่อง** (`groupPolicy` + `groups`): บอตจะยอมรับข้อความจากช่องนั้นเลยหรือไม่
2. **การเข้าถึงของผู้ส่ง** (`groupAllowFrom` / `groups["#channel"].allowFrom` แบบรายช่อง): ใครบ้างที่ได้รับอนุญาตให้เรียกใช้บอตภายในช่องนั้น

คีย์คอนฟิก:

- allowlist ของ DM (การเข้าถึงของผู้ส่ง DM): `channels.irc.allowFrom`
- allowlist ของผู้ส่งในกลุ่ม (การเข้าถึงของผู้ส่งในช่อง): `channels.irc.groupAllowFrom`
- ตัวควบคุมรายช่อง (ช่อง + ผู้ส่ง + กฎ mention): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` อนุญาตช่องที่ไม่ได้ตั้งค่า (**แต่ยังคงถูกควบคุมด้วย mention เป็นค่าเริ่มต้น**)

รายการใน allowlist ควรใช้ตัวตนผู้ส่งที่คงที่ (`nick!user@host`)
การจับคู่ด้วย nick อย่างเดียวเปลี่ยนแปลงได้ และจะเปิดใช้ก็ต่อเมื่อ `channels.irc.dangerouslyAllowNameMatching: true`

### จุดที่พลาดกันบ่อย: `allowFrom` ใช้สำหรับ DM ไม่ใช่ช่อง

หากคุณเห็นล็อกเช่น:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…นั่นหมายความว่าผู้ส่งไม่ได้รับอนุญาตสำหรับข้อความแบบ **group/channel** แก้ไขได้โดย:

- ตั้งค่า `channels.irc.groupAllowFrom` (ใช้ทั่วโลกกับทุกช่อง) หรือ
- ตั้งค่า allowlist ผู้ส่งแบบรายช่อง: `channels.irc.groups["#channel"].allowFrom`

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

## การทริกเกอร์การตอบกลับ (mentions)

แม้ว่าช่องจะได้รับอนุญาตแล้ว (ผ่าน `groupPolicy` + `groups`) และผู้ส่งก็ได้รับอนุญาต OpenClaw จะใช้**การควบคุมด้วย mention**เป็นค่าเริ่มต้นในบริบทกลุ่ม

นั่นหมายความว่าคุณอาจเห็นล็อกเช่น `drop channel … (missing-mention)` เว้นแต่ข้อความนั้นจะมีรูปแบบ mention ที่ตรงกับบอต

หากต้องการให้บอตตอบในช่อง IRC **โดยไม่ต้องมี mention** ให้ปิดการควบคุมด้วย mention สำหรับช่องนั้น:

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

หรือหากต้องการอนุญาต **ทุก** ช่อง IRC (ไม่มี allowlist รายช่อง) และยังให้ตอบโดยไม่ต้องมี mentions:

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

หากคุณอนุญาต `allowFrom: ["*"]` ในช่องสาธารณะ ใครก็สามารถ prompt บอตได้
เพื่อลดความเสี่ยง ให้จำกัดเครื่องมือสำหรับช่องนั้น

### เครื่องมือชุดเดียวกันสำหรับทุกคนในช่อง

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

### เครื่องมือต่างกันตามผู้ส่ง (เจ้าของมีสิทธิ์มากกว่า)

ใช้ `toolsBySender` เพื่อใช้นโยบายที่เข้มงวดกว่ากับ `"*"` และผ่อนปรนกว่ากับ nick ของคุณ:

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

- คีย์ของ `toolsBySender` ควรใช้ `id:` สำหรับค่าตัวตนผู้ส่งของ IRC:
  `id:eigen` หรือ `id:eigen!~eigen@174.127.248.171` เพื่อการจับคู่ที่เข้มงวดยิ่งขึ้น
- คีย์แบบ legacy ที่ไม่มี prefix ยังรองรับอยู่ และจะจับคู่เป็น `id:` เท่านั้น
- นโยบายผู้ส่งตัวแรกที่ตรงกันจะเป็นตัวชนะ; `"*"` คือ wildcard fallback

สำหรับข้อมูลเพิ่มเติมเกี่ยวกับการเข้าถึงกลุ่มเทียบกับการควบคุมด้วย mention (และวิธีที่ทั้งสองทำงานร่วมกัน) ดู: [/channels/groups](/th/channels/groups)

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

การลงทะเบียนครั้งเดียวเมื่อเชื่อมต่อแบบไม่บังคับ:

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

บัญชีเริ่มต้นรองรับ:

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

ไม่สามารถตั้งค่า `IRC_HOST` จาก `.env` ของ workspace ได้; ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)

## การแก้ไขปัญหา

- หากบอตเชื่อมต่อได้แต่ไม่เคยตอบในช่อง ให้ตรวจสอบ `channels.irc.groups` **และ** ตรวจสอบว่าการควบคุมด้วย mention กำลังทิ้งข้อความอยู่หรือไม่ (`missing-mention`) หากคุณต้องการให้ตอบโดยไม่ต้อง ping ให้ตั้งค่า `requireMention:false` สำหรับช่องนั้น
- หากเข้าสู่ระบบไม่สำเร็จ ให้ตรวจสอบว่า nick ใช้งานได้และรหัสผ่านเซิร์ฟเวอร์ถูกต้อง
- หาก TLS ล้มเหลวบนเครือข่ายแบบกำหนดเอง ให้ตรวจสอบ host/port และการตั้งค่า certificate

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการควบคุมด้วย mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
