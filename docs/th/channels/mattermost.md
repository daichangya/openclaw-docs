---
read_when:
    - การตั้งค่า Mattermost
    - การดีบักการกำหนดเส้นทางของ Mattermost
summary: การตั้งค่าบอต Mattermost และการตั้งค่า OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T05:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

สถานะ: bundled Plugin (bot token + เหตุการณ์ WebSocket) รองรับ channels, groups และ DMs
Mattermost เป็นแพลตฟอร์มส่งข้อความสำหรับทีมที่โฮสต์เองได้ ดูรายละเอียดผลิตภัณฑ์และดาวน์โหลดได้ที่เว็บไซต์ทางการ
[mattermost.com](https://mattermost.com)

## Bundled Plugin

Mattermost มาพร้อมเป็น bundled Plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้น build แบบแพ็กเกจตามปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้ build รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Mattermost ไว้
ให้ติดตั้งด้วยตนเอง:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/mattermost
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว

1. ตรวจสอบให้แน่ใจว่า Mattermost Plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันได้รวมมาไว้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. สร้างบัญชีบอต Mattermost และคัดลอก **bot token**
3. คัดลอก **base URL** ของ Mattermost (เช่น `https://chat.example.com`)
4. ตั้งค่า OpenClaw แล้วเริ่ม Gateway

การตั้งค่าขั้นต่ำ:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## คำสั่ง slash แบบ native

คำสั่ง slash แบบ native เป็นแบบเลือกเปิดใช้ เมื่อเปิดแล้ว OpenClaw จะลงทะเบียนคำสั่ง slash `oc_*` ผ่าน
Mattermost API และรับ callback POSTs บนเซิร์ฟเวอร์ HTTP ของ Gateway

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // ใช้เมื่อตัว Mattermost ไม่สามารถเข้าถึง Gateway ได้โดยตรง (reverse proxy/public URL)
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

หมายเหตุ:

- `native: "auto"` จะปิดใช้งานเป็นค่าเริ่มต้นสำหรับ Mattermost ตั้ง `native: true` เพื่อเปิดใช้
- หากละ `callbackUrl` ไว้ OpenClaw จะอนุมานจาก host/port ของ Gateway + `callbackPath`
- สำหรับการตั้งค่าแบบหลายบัญชี สามารถตั้ง `commands` ไว้ที่ระดับบนสุด หรือภายใต้
  `channels.mattermost.accounts.<id>.commands` (ค่าระดับบัญชีจะ override ฟิลด์ระดับบนสุด)
- command callbacks จะถูกตรวจสอบด้วย token รายคำสั่งที่
  Mattermost ส่งกลับมาเมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
- slash callbacks จะ fail closed หากการลงทะเบียนล้มเหลว, การเริ่มต้นไม่สมบูรณ์ หรือ
  callback token ไม่ตรงกับคำสั่งที่ลงทะเบียนไว้รายการใดรายการหนึ่ง
- ข้อกำหนดด้านการเข้าถึง: endpoint สำหรับ callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
  - อย่าตั้ง `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะรันอยู่บน host/network namespace เดียวกับ OpenClaw
  - อย่าตั้ง `callbackUrl` เป็น Mattermost base URL ของคุณ เว้นแต่ URL นั้นจะ reverse-proxy `/api/channels/mattermost/command` มายัง OpenClaw
  - วิธีตรวจสอบอย่างรวดเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command`; การเรียกแบบ GET ควรได้ `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`
- ข้อกำหนด Mattermost egress allowlist:
  - หาก callback ของคุณชี้ไปยังที่อยู่แบบ private/tailnet/internal ให้ตั้งค่า Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` ให้รวม host/domain ของ callback ด้วย
  - ใช้รายการแบบ host/domain ไม่ใช่ URL เต็ม
    - ดี: `gateway.tailnet-name.ts.net`
    - ไม่ดี: `https://gateway.tailnet-name.ts.net`

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

ตั้งค่าสิ่งเหล่านี้บน host ของ Gateway หากคุณต้องการใช้ตัวแปรแวดล้อม:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

ตัวแปรแวดล้อมจะใช้กับบัญชี **default** (`default`) เท่านั้น บัญชีอื่นต้องใช้ค่าจาก config

## โหมดแชต

Mattermost ตอบ DM โดยอัตโนมัติ พฤติกรรมใน channel ถูกควบคุมด้วย `chatmode`:

- `oncall` (ค่าเริ่มต้น): ตอบเฉพาะเมื่อมีการ @mention ใน channels
- `onmessage`: ตอบทุกข้อความใน channel
- `onchar`: ตอบเมื่อข้อความขึ้นต้นด้วย trigger prefix

ตัวอย่างการตั้งค่า:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

หมายเหตุ:

- `onchar` ยังคงตอบต่อ @mentions แบบชัดเจน
- `channels.mattermost.requireMention` ยังรองรับสำหรับ config แบบเดิม แต่แนะนำให้ใช้ `chatmode`

## เธรดและ sessions

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าการตอบใน channel และ group จะอยู่ใน
channel หลักต่อไป หรือเริ่มเธรดใต้โพสต์ที่เป็นตัวกระตุ้น

- `off` (ค่าเริ่มต้น): ตอบในเธรดเฉพาะเมื่อโพสต์ขาเข้าอยู่ในเธรดอยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดใน channel/group ให้เริ่มเธรดใต้โพสต์นั้นและกำหนดเส้นทางการสนทนาไปยัง session ที่มีขอบเขตเป็นเธรด
- `all`: พฤติกรรมเหมือน `first` สำหรับ Mattermost ในปัจจุบัน
- ข้อความส่วนตัวจะไม่ใช้การตั้งค่านี้และยังคงไม่เป็นเธรด

ตัวอย่างการตั้งค่า:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

หมายเหตุ:

- sessions ที่มีขอบเขตเป็นเธรดใช้ post id ของโพสต์ตัวกระตุ้นเป็น thread root
- `first` และ `all` เทียบเท่ากันในปัจจุบัน เพราะเมื่อ Mattermost มี thread root แล้ว
  chunks และสื่อที่ตามมาจะอยู่ในเธรดเดียวกันนั้นต่อไป

## การควบคุมการเข้าถึง (DMs)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code)
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs แบบสาธารณะ: `channels.mattermost.dmPolicy="open"` ร่วมกับ `channels.mattermost.allowFrom=["*"]`

## Channels (groups)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (จำกัดด้วยการ mention)
- ใส่ผู้ส่งใน allowlist ด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ user IDs)
- การ override การ mention ราย channel อยู่ภายใต้ `channels.mattermost.groups.<channelId>.requireMention`
  หรือ `channels.mattermost.groups["*"].requireMention` เพื่อใช้เป็นค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้และจะเปิดใช้ก็ต่อเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- เปิด channels: `channels.mattermost.groupPolicy="open"` (ยังคงจำกัดด้วยการ mention)
- หมายเหตุด้านรันไทม์: หากไม่มี `channels.mattermost` เลย รันไทม์จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบ group (แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

ตัวอย่าง:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## เป้าหมายสำหรับการส่งขาออก

ใช้รูปแบบเป้าหมายเหล่านี้กับ `openclaw message send` หรือ cron/webhooks:

- `channel:<id>` สำหรับ channel
- `user:<id>` สำหรับ DM
- `@username` สำหรับ DM (resolve ผ่าน Mattermost API)

opaque IDs แบบไม่มีคำนำหน้า (เช่น `64ifufp...`) มีความ **กำกวม** ใน Mattermost (อาจเป็น user ID หรือ channel ID)

OpenClaw จะ resolve แบบ **user-first**:

- หาก ID นั้นมีอยู่เป็น user (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่งเป็น **DM** โดย resolve direct channel ผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID นั้นจะถูกมองเป็น **channel ID**

หากคุณต้องการพฤติกรรมที่กำหนดแน่นอน ให้ใช้คำนำหน้าที่ชัดเจนเสมอ (`user:<id>` / `channel:<id>`)

## การลองใหม่ของ DM channel

เมื่อ OpenClaw ส่งไปยังเป้าหมาย DM ของ Mattermost และจำเป็นต้อง resolve direct channel ก่อน
โดยค่าเริ่มต้นจะมีการลองใหม่เมื่อการสร้าง direct channel ล้มเหลวแบบชั่วคราว

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับพฤติกรรมนั้นสำหรับ Mattermost Plugin ทั้งหมด
หรือ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีใดบัญชีหนึ่ง

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

หมายเหตุ:

- ใช้กับการสร้าง DM channel เท่านั้น (`/api/v4/channels/direct`) ไม่ใช่ทุกการเรียก Mattermost API
- การลองใหม่จะใช้กับความล้มเหลวชั่วคราว เช่น rate limits, การตอบกลับ 5xx และข้อผิดพลาดเครือข่ายหรือ timeout
- ข้อผิดพลาดฝั่งไคลเอนต์แบบ 4xx อื่นที่ไม่ใช่ `429` จะถือว่าเป็นแบบถาวรและจะไม่ลองใหม่

## การสตรีมแบบพรีวิว

Mattermost สตรีมสถานะการคิด, กิจกรรมของเครื่องมือ และข้อความตอบกลับบางส่วนลงใน **draft preview post** เดียว ซึ่งจะถูกทำให้สมบูรณ์ในตำแหน่งเดิมเมื่อคำตอบสุดท้ายปลอดภัยที่จะส่งได้ การอัปเดตพรีวิวจะเกิดบน post id เดิม แทนที่จะสแปม channel ด้วยข้อความราย chunk สื่อ/ผลลัพธ์ข้อผิดพลาดในตอนจบจะยกเลิกการแก้ไขพรีวิวที่ค้างอยู่ และใช้การส่งปกติแทนการ flush preview post ที่มีไว้ชั่วคราว

เปิดใช้ผ่าน `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

หมายเหตุ:

- `partial` เป็นตัวเลือกที่ใช้โดยทั่วไป: มี preview post เดียวที่ถูกแก้ไขเมื่อคำตอบยาวขึ้น แล้วปิดท้ายด้วยคำตอบฉบับสมบูรณ์
- `block` ใช้ draft chunks แบบต่อท้ายภายใน preview post
- `progress` แสดง status preview ระหว่างการสร้าง และจะโพสต์คำตอบสุดท้ายเมื่อเสร็จสิ้นเท่านั้น
- `off` ปิดการสตรีมแบบพรีวิว
- หากไม่สามารถ finalize สตรีมในตำแหน่งเดิมได้ (เช่น โพสต์ถูกลบระหว่างสตรีม) OpenClaw จะ fallback ไปส่งโพสต์สุดท้ายอันใหม่ เพื่อให้แน่ใจว่าจะไม่สูญเสียคำตอบ
- ดู [Streaming](/th/concepts/streaming#preview-streaming-modes) สำหรับเมทริกซ์การแมปตามช่องทาง

## Reactions (เครื่องมือ message)

- ใช้ `message action=react` กับ `channel=mattermost`
- `messageId` คือ post id ของ Mattermost
- `emoji` รับชื่อเช่น `thumbsup` หรือ `:+1:` (ใส่โคลอนหรือไม่ก็ได้)
- ตั้ง `remove=true` (บูลีน) เพื่อลบ reaction
- เหตุการณ์เพิ่ม/ลบ reaction จะถูกส่งต่อเป็นเหตุการณ์ระบบไปยัง session ของเอเจนต์ที่ถูกกำหนดเส้นทาง

ตัวอย่าง:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

การตั้งค่า:

- `channels.mattermost.actions.reactions`: เปิด/ปิดการทำงานของ reaction actions (ค่าเริ่มต้น true)
- การ override รายบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบได้ (เครื่องมือ message)

ส่งข้อความพร้อมปุ่มที่กดได้ เมื่อผู้ใช้กดปุ่ม เอเจนต์จะได้รับ
ตัวเลือกนั้นและสามารถตอบกลับได้

เปิดใช้ปุ่มโดยเพิ่ม `inlineButtons` ลงในความสามารถของ channel:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

ใช้ `message action=send` พร้อมพารามิเตอร์ `buttons` ปุ่มจะเป็นอาร์เรย์ 2 มิติ (แถวของปุ่ม):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ฟิลด์ของปุ่ม:

- `text` (จำเป็น): ป้ายข้อความที่แสดง
- `callback_data` (จำเป็น): ค่าที่ส่งกลับเมื่อคลิก (ใช้เป็น action ID)
- `style` (ไม่บังคับ): `"default"`, `"primary"` หรือ `"danger"`

เมื่อผู้ใช้กดปุ่ม:

1. ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น `"✓ **Yes** selected by @user"`)
2. เอเจนต์จะได้รับตัวเลือกนั้นเป็นข้อความขาเข้าและตอบกลับ

หมายเหตุ:

- button callbacks ใช้การตรวจสอบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องตั้งค่า)
- Mattermost ตัด callback data ออกจากการตอบกลับของ API (คุณสมบัติด้านความปลอดภัย) ดังนั้นปุ่มทั้งหมด
  จะถูกลบเมื่อคลิก — ไม่สามารถลบบางส่วนได้
- Action IDs ที่มีเครื่องหมายขีดกลางหรือขีดล่างจะถูก sanitize โดยอัตโนมัติ
  (ข้อจำกัดของการกำหนดเส้นทางใน Mattermost)

การตั้งค่า:

- `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อ
  เปิดใช้คำอธิบายเครื่องมือปุ่มใน system prompt ของเอเจนต์
- `channels.mattermost.interactions.callbackBaseUrl`: base URL ภายนอกแบบไม่บังคับสำหรับ button
  callbacks (ตัวอย่างเช่น `https://gateway.example.com`) ใช้สิ่งนี้เมื่อ Mattermost ไม่สามารถ
  เข้าถึง Gateway ที่ bind host ของมันได้โดยตรง
- ในการตั้งค่าแบบหลายบัญชี คุณยังสามารถตั้งค่าฟิลด์เดียวกันนี้ภายใต้
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`
- หากละ `interactions.callbackBaseUrl` ไว้ OpenClaw จะอนุมาน callback URL จาก
  `gateway.customBindHost` + `gateway.port` แล้วจึง fallback ไปที่ `http://localhost:<port>`
- กฎการเข้าถึง: URL ของ button callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
  `localhost` ใช้ได้เฉพาะเมื่อ Mattermost และ OpenClaw รันอยู่บน host/network namespace เดียวกัน
- หากเป้าหมาย callback ของคุณเป็น private/tailnet/internal ให้เพิ่ม host/domain ของมันลงใน Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`

### การเชื่อมต่อกับ API โดยตรง (สคริปต์ภายนอก)

สคริปต์ภายนอกและ webhooks สามารถโพสต์ปุ่มได้โดยตรงผ่าน Mattermost REST API
แทนการส่งผ่านเครื่องมือ `message` ของเอเจนต์ ใช้ `buildButtonAttachments()` จาก
extension เมื่อเป็นไปได้; หากโพสต์ JSON ดิบ ให้ทำตามกฎเหล่านี้:

**โครงสร้างเพย์โหลด:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // ตัวอักษรและตัวเลขเท่านั้น — ดูด้านล่าง
            type: "button", // จำเป็น มิฉะนั้นการคลิกจะถูกเพิกเฉยแบบเงียบๆ
            name: "Approve", // ป้ายข้อความที่แสดง
            style: "primary", // ไม่บังคับ: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ต้องตรงกับ button id (สำหรับค้นหาชื่อ)
                action: "approve",
                // ... ฟิลด์กำหนดเองอื่นๆ ...
                _token: "<hmac>", // ดูหัวข้อ HMAC ด้านล่าง
              },
            },
          },
        ],
      },
    ],
  },
}
```

**กฎสำคัญ:**

1. ต้องใส่ attachments ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (ไม่เช่นนั้นจะถูกเพิกเฉยแบบเงียบๆ)
2. ทุก action ต้องมี `type: "button"` — หากไม่มี การคลิกจะถูกกลืนหายไปแบบเงียบๆ
3. ทุก action ต้องมีฟิลด์ `id` — Mattermost จะเพิกเฉยต่อ actions ที่ไม่มี ID
4. `id` ของ action ต้องเป็น **ตัวอักษรและตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) เครื่องหมายขีดกลางและขีดล่างจะทำให้
   การกำหนดเส้นทาง action ฝั่งเซิร์ฟเวอร์ของ Mattermost พัง (คืนค่า 404) ให้ลบออกก่อนใช้งาน
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม เพื่อให้ข้อความยืนยันแสดง
   ชื่อปุ่ม (เช่น `"Approve"`) แทน ID ดิบ
6. `context.action_id` เป็นค่าจำเป็น — ตัวจัดการ interaction จะคืนค่า 400 หากไม่มีค่านี้

**การสร้างโทเค็น HMAC:**

Gateway ตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้างโทเค็น
ให้ตรงกับตรรกะการตรวจสอบของ Gateway:

1. สร้าง secret จาก bot token:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. สร้างออบเจ็กต์ context พร้อมทุกฟิลด์ **ยกเว้น** `_token`
3. serialize โดยใช้ **คีย์ที่เรียงลำดับแล้ว** และ **ไม่มีช่องว่าง** (Gateway ใช้ `JSON.stringify`
   พร้อมคีย์ที่เรียงแล้ว ซึ่งจะให้ผลลัพธ์แบบกะทัดรัด)
4. ลงนาม: `HMAC-SHA256(key=secret, data=serializedContext)`
5. เพิ่มค่า hex digest ที่ได้เป็น `_token` ใน context

ตัวอย่าง Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

ข้อผิดพลาดที่พบบ่อยเกี่ยวกับ HMAC:

- โดยค่าเริ่มต้น `json.dumps` ของ Python จะเพิ่มช่องว่าง (`{"key": "val"}`) ให้ใช้
  `separators=(",", ":")` เพื่อให้ตรงกับผลลัพธ์แบบกะทัดรัดของ JavaScript (`{"key":"val"}`)
- ให้ลงนาม **ทุก** ฟิลด์ของ context (ยกเว้น `_token`) เสมอ Gateway จะตัด `_token` ออกก่อน แล้ว
  ลงนามทุกอย่างที่เหลือ การลงนามเพียงบางส่วนจะทำให้การตรวจสอบล้มเหลวแบบเงียบๆ
- ใช้ `sort_keys=True` — Gateway จะเรียงคีย์ก่อนลงนาม และ Mattermost อาจ
  เปลี่ยนลำดับฟิลด์ของ context เมื่อจัดเก็บเพย์โหลด
- สร้าง secret จาก bot token (แบบกำหนดได้แน่นอน) ไม่ใช่จากไบต์สุ่ม โดย secret
  ต้องเหมือนกันทั้งในโปรเซสที่สร้างปุ่มและ Gateway ที่ตรวจสอบ

## Directory adapter

Mattermost Plugin มี directory adapter ที่ resolve ชื่อ channel และชื่อผู้ใช้
ผ่าน Mattermost API สิ่งนี้ทำให้ใช้เป้าหมาย `#channel-name` และ `@username` ได้ใน
`openclaw message send` และการส่งผ่าน cron/webhook

ไม่ต้องตั้งค่าเพิ่มเติม — adapter ใช้ bot token จาก config ของบัญชี

## หลายบัญชี

Mattermost รองรับหลายบัญชีภายใต้ `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## การแก้ไขปัญหา

- ไม่มีการตอบกลับใน channels: ตรวจสอบให้แน่ใจว่าบอตอยู่ใน channel แล้ว และมีการ mention มัน (`oncall`), ใช้ trigger prefix (`onchar`) หรือตั้ง `chatmode: "onmessage"`
- ข้อผิดพลาดด้านการยืนยันตัวตน: ตรวจสอบ bot token, base URL และดูว่าบัญชีนั้นเปิดใช้งานอยู่หรือไม่
- ปัญหาแบบหลายบัญชี: ตัวแปรแวดล้อมใช้ได้กับบัญชี `default` เท่านั้น
- คำสั่ง slash แบบ native คืนค่า `Unauthorized: invalid command token.`: OpenClaw
  ไม่ยอมรับ callback token สาเหตุที่พบบ่อย:
  - การลงทะเบียนคำสั่ง slash ล้มเหลว หรือเสร็จสมบูรณ์เพียงบางส่วนตอนเริ่มต้น
  - callback ไปยัง gateway/account ที่ไม่ถูกต้อง
  - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยังเป้าหมาย callback ก่อนหน้า
  - Gateway รีสตาร์ตโดยไม่ได้เปิดใช้งานคำสั่ง slash ใหม่
- หากคำสั่ง slash แบบ native หยุดทำงาน ให้ตรวจสอบล็อกสำหรับ
  `mattermost: failed to register slash commands` หรือ
  `mattermost: native slash commands enabled but no commands could be registered`
- หากละ `callbackUrl` ไว้และล็อกเตือนว่า callback ถูก resolve ไปยัง
  `http://127.0.0.1:18789/...` URL นั้นมักจะเข้าถึงได้เฉพาะเมื่อ
  Mattermost รันอยู่บน host/network namespace เดียวกับ OpenClaw ให้ตั้ง
  `commands.callbackUrl` แบบชัดเจนที่เข้าถึงได้จากภายนอกแทน
- ปุ่มแสดงเป็นกล่องสีขาว: เอเจนต์อาจกำลังส่งข้อมูลปุ่มที่มีรูปแบบผิด ตรวจสอบให้แน่ใจว่าทุกปุ่มมีทั้งฟิลด์ `text` และ `callback_data`
- ปุ่มแสดงผลแต่คลิกแล้วไม่เกิดอะไรขึ้น: ตรวจสอบว่า `AllowedUntrustedInternalConnections` ใน config ของเซิร์ฟเวอร์ Mattermost มี `127.0.0.1 localhost` รวมอยู่ และ `EnablePostActionIntegration` เป็น `true` ใน ServiceSettings
- ปุ่มคืนค่า 404 เมื่อคลิก: `id` ของปุ่มน่าจะมีเครื่องหมายขีดกลางหรือขีดล่าง Mattermost action router จะพังเมื่อเจอ ID ที่ไม่ใช่ตัวอักษรและตัวเลข ใช้เฉพาะ `[a-zA-Z0-9]`
- ล็อกของ Gateway แสดง `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณลงนามฟิลด์ context ทั้งหมด (ไม่ใช่เพียงบางส่วน), ใช้คีย์ที่เรียงลำดับ และใช้ JSON แบบกะทัดรัด (ไม่มีช่องว่าง) ดูหัวข้อ HMAC ด้านบน
- ล็อกของ Gateway แสดง `missing _token in context`: ไม่มีฟิลด์ `_token` อยู่ใน context ของปุ่ม ตรวจสอบให้แน่ใจว่าได้ใส่ไว้ตอนสร้าง integration payload
- ข้อความยืนยันแสดง ID ดิบแทนชื่อปุ่ม: `context.action_id` ไม่ตรงกับ `id` ของปุ่ม ให้ตั้งทั้งสองค่าให้เป็นค่า sanitize เดียวกัน
- เอเจนต์ไม่รู้จักปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ลงใน config ช่องทาง Mattermost

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตนของ DM และโฟลว์การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการจำกัดด้วยการ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแกร่งขึ้น
