---
read_when:
    - การตั้งค่า Mattermost
    - การแก้จุดบกพร่องการ route ของ Mattermost
summary: การตั้งค่า Mattermost bot และ config ของ OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-24T08:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

สถานะ: bundled plugin (bot token + เหตุการณ์ WebSocket) รองรับ channels, groups และ DMs
Mattermost เป็นแพลตฟอร์มส่งข้อความสำหรับทีมที่โฮสต์เองได้ ดูรายละเอียดผลิตภัณฑ์และดาวน์โหลดได้ที่เว็บไซต์ทางการ
[mattermost.com](https://mattermost.com)

## Bundled plugin

Mattermost มาพร้อมเป็น bundled plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้น build แบบแพ็กเกจทั่วไปจึงไม่ต้องติดตั้งแยก

หากคุณใช้ build เก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Mattermost ไว้
ให้ติดตั้งด้วยตนเอง:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/mattermost
```

checkout ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว

1. ตรวจสอบให้แน่ใจว่าสามารถใช้งาน Mattermost plugin ได้
   - OpenClaw รุ่นแพ็กเกจปัจจุบันจะรวมมาให้อยู่แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้เองด้วยคำสั่งด้านบน
2. สร้างบัญชีบอท Mattermost และคัดลอก **bot token**
3. คัดลอก **base URL** ของ Mattermost (เช่น `https://chat.example.com`)
4. กำหนดค่า OpenClaw และเริ่ม gateway

config ขั้นต่ำ:

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

## Native slash commands

Native slash commands เป็นแบบ opt-in เมื่อเปิดใช้ OpenClaw จะลงทะเบียน slash commands `oc_*` ผ่าน Mattermost API และรับ callback POST บนเซิร์ฟเวอร์ HTTP ของ gateway

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // ใช้เมื่อ Mattermost ไม่สามารถเข้าถึง gateway ได้โดยตรง (reverse proxy/URL สาธารณะ)
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

หมายเหตุ:

- `native: "auto"` มีค่าเริ่มต้นเป็นปิดสำหรับ Mattermost ให้ตั้ง `native: true` เพื่อเปิดใช้
- หากไม่ระบุ `callbackUrl` OpenClaw จะสร้างค่าจาก host/port ของ gateway + `callbackPath`
- สำหรับการตั้งค่าแบบหลายบัญชี สามารถตั้ง `commands` ไว้ที่ระดับบนสุด หรือภายใต้
  `channels.mattermost.accounts.<id>.commands` (ค่าระดับบัญชีจะ override ฟิลด์ระดับบนสุด)
- callback ของคำสั่งจะถูกตรวจสอบด้วย token รายคำสั่งที่ Mattermost ส่งกลับมา
  เมื่อ OpenClaw ลงทะเบียนคำสั่ง `oc_*`
- slash callbacks จะปฏิเสธโดยค่าเริ่มต้นเมื่อการลงทะเบียนล้มเหลว การเริ่มต้นระบบไม่สมบูรณ์ หรือ
  callback token ไม่ตรงกับคำสั่งใดที่ลงทะเบียนไว้
- ข้อกำหนดด้านการเข้าถึง: endpoint ของ callback ต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
  - อย่าตั้ง `callbackUrl` เป็น `localhost` เว้นแต่ Mattermost จะทำงานอยู่บนโฮสต์หรือ network namespace เดียวกับ OpenClaw
  - อย่าตั้ง `callbackUrl` เป็น base URL ของ Mattermost เว้นแต่ URL นั้นจะทำ reverse-proxy `/api/channels/mattermost/command` ไปยัง OpenClaw
  - วิธีตรวจสอบอย่างรวดเร็วคือ `curl https://<gateway-host>/api/channels/mattermost/command`; คำขอ GET ควรได้ `405 Method Not Allowed` จาก OpenClaw ไม่ใช่ `404`
- ข้อกำหนด Mattermost egress allowlist:
  - หาก callback ของคุณชี้ไปยังที่อยู่แบบ private/tailnet/internal ให้ตั้งค่า Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` ให้รวม host/domain ของ callback ไว้
  - ใช้รายการแบบ host/domain ไม่ใช่ URL เต็ม
    - ถูกต้อง: `gateway.tailnet-name.ts.net`
    - ไม่ถูกต้อง: `https://gateway.tailnet-name.ts.net`

## ตัวแปรสภาพแวดล้อม (บัญชีเริ่มต้น)

ตั้งค่าบนโฮสต์ gateway หากคุณต้องการใช้ env vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

env vars จะใช้กับบัญชี **default** (`default`) เท่านั้น บัญชีอื่นต้องใช้ค่าจาก config

ไม่สามารถตั้ง `MATTERMOST_URL` จาก `.env` ของ workspace ได้ ดู [Workspace `.env` files](/th/gateway/security)

## โหมดแชต

Mattermost ตอบ DMs โดยอัตโนมัติ พฤติกรรมของ channel ถูกควบคุมด้วย `chatmode`:

- `oncall` (ค่าเริ่มต้น): ตอบเฉพาะเมื่อมีการ @mention ใน channels
- `onmessage`: ตอบทุกข้อความใน channel
- `onchar`: ตอบเมื่อข้อความขึ้นต้นด้วย trigger prefix

ตัวอย่าง config:

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

- `onchar` จะยังตอบเมื่อมีการ @mention โดยตรง
- `channels.mattermost.requireMention` ยังรองรับสำหรับ config แบบเดิม แต่แนะนำให้ใช้ `chatmode`

## Threading และเซสชัน

ใช้ `channels.mattermost.replyToMode` เพื่อควบคุมว่าการตอบใน channel และ group จะอยู่ใน
channel หลัก หรือเริ่ม thread ใต้โพสต์ที่ทริกเกอร์

- `off` (ค่าเริ่มต้น): ตอบใน thread เฉพาะเมื่อโพสต์ขาเข้าอยู่ใน thread อยู่แล้ว
- `first`: สำหรับโพสต์ระดับบนสุดใน channel/group ให้เริ่ม thread ใต้โพสต์นั้น และ route
  การสนทนาไปยังเซสชันที่อิงตาม thread
- `all`: ปัจจุบันสำหรับ Mattermost มีพฤติกรรมเหมือน `first`
- Direct messages จะไม่ใช้การตั้งค่านี้และยังคงไม่เป็น thread

ตัวอย่าง config:

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

- เซสชันที่อิงตาม thread จะใช้ post id ที่ทริกเกอร์เป็น thread root
- ปัจจุบัน `first` และ `all` เทียบเท่ากัน เพราะเมื่อ Mattermost มี thread root แล้ว
  chunk และสื่อที่ตามมาจะต่อใน thread เดิม

## การควบคุมการเข้าถึง (DMs)

- ค่าเริ่มต้น: `channels.mattermost.dmPolicy = "pairing"` (ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code)
- อนุมัติผ่าน:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs แบบสาธารณะ: `channels.mattermost.dmPolicy="open"` พร้อม `channels.mattermost.allowFrom=["*"]`

## Channels (groups)

- ค่าเริ่มต้น: `channels.mattermost.groupPolicy = "allowlist"` (มี mention gating)
- ใส่ผู้ส่งที่อนุญาตใน allowlist ด้วย `channels.mattermost.groupAllowFrom` (แนะนำให้ใช้ user IDs)
- การ override เรื่อง mention ต่อ channel อยู่ภายใต้ `channels.mattermost.groups.<channelId>.requireMention`
  หรือ `channels.mattermost.groups["*"].requireMention` สำหรับค่าเริ่มต้น
- การจับคู่ `@username` เปลี่ยนแปลงได้ และจะเปิดใช้ก็ต่อเมื่อ `channels.mattermost.dangerouslyAllowNameMatching: true`
- Open channels: `channels.mattermost.groupPolicy="open"` (มี mention gating)
- หมายเหตุด้าน runtime: หากไม่มี `channels.mattermost` เลย runtime จะ fallback ไปใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

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

## Targets สำหรับการส่งขาออก

ใช้รูปแบบ target เหล่านี้กับ `openclaw message send` หรือ cron/webhooks:

- `channel:<id>` สำหรับ channel
- `user:<id>` สำหรับ DM
- `@username` สำหรับ DM (resolve ผ่าน Mattermost API)

ID แบบ opaque เปล่าๆ (เช่น `64ifufp...`) **กำกวม** ใน Mattermost (อาจเป็น user ID หรือ channel ID)

OpenClaw จะ resolve แบบ **user-first**:

- หาก ID นั้นมีอยู่ในฐานะผู้ใช้ (`GET /api/v4/users/<id>` สำเร็จ) OpenClaw จะส่งเป็น **DM** โดย resolve direct channel ผ่าน `/api/v4/channels/direct`
- มิฉะนั้น ID จะถือเป็น **channel ID**

หากคุณต้องการพฤติกรรมที่แน่นอน ให้ใช้ prefix แบบชัดเจนเสมอ (`user:<id>` / `channel:<id>`)

## การลองใหม่ของ DM channel

เมื่อ OpenClaw ส่งไปยัง target แบบ Mattermost DM และต้อง resolve direct channel ก่อน
ระบบจะลองใหม่เมื่อการสร้าง direct-channel ล้มเหลวแบบชั่วคราวโดยค่าเริ่มต้น

ใช้ `channels.mattermost.dmChannelRetry` เพื่อปรับพฤติกรรมนี้ทั้งระบบสำหรับ Mattermost plugin
หรือใช้ `channels.mattermost.accounts.<id>.dmChannelRetry` สำหรับบัญชีเดียว

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

- ใช้กับการสร้าง DM channel (`/api/v4/channels/direct`) เท่านั้น ไม่ใช่ทุกการเรียก Mattermost API
- จะลองใหม่กับความล้มเหลวชั่วคราว เช่น rate limits, การตอบกลับ 5xx และข้อผิดพลาดเครือข่ายหรือ timeout
- ข้อผิดพลาดฝั่งไคลเอนต์ 4xx อื่นนอกจาก `429` จะถือเป็นถาวรและจะไม่ลองใหม่

## Preview streaming

Mattermost จะสตรีมความคิด กิจกรรมของเครื่องมือ และข้อความตอบกลับบางส่วนลงใน **draft preview post** เดียว ซึ่งจะสรุปเป็นคำตอบสุดท้ายในตำแหน่งเดิมเมื่อคำตอบสุดท้ายปลอดภัยที่จะส่ง การแสดงตัวอย่างจะอัปเดตบน post id เดิมแทนการรบกวน channel ด้วยข้อความราย chunk สื่อ/ข้อผิดพลาดที่เป็นคำตอบสุดท้ายจะยกเลิกการแก้ไข preview ที่ค้างอยู่ และใช้การส่งปกติแทนการ flush preview post ชั่วคราว

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

- `partial` เป็นตัวเลือกที่ใช้บ่อย: preview post เดียวที่ถูกแก้ไขเมื่อคำตอบยาวขึ้น แล้วสรุปเป็นคำตอบสมบูรณ์
- `block` ใช้ draft chunks แบบ append ภายใน preview post
- `progress` แสดงตัวอย่างสถานะระหว่างสร้าง และโพสต์คำตอบสุดท้ายเมื่อเสร็จสิ้นเท่านั้น
- `off` ปิด preview streaming
- หากไม่สามารถสรุป stream ในตำแหน่งเดิมได้ (เช่น post ถูกลบระหว่างสตรีม) OpenClaw จะ fallback ไปส่ง final post ใหม่ เพื่อไม่ให้คำตอบสูญหาย
- payload ที่มีแต่ reasoning จะถูกซ่อนจากโพสต์ใน channel รวมถึงข้อความที่มาในรูปแบบ blockquote `> Reasoning:` ด้วย ตั้งค่า `/reasoning on` เพื่อดูความคิดในพื้นผิวอื่น; final post ของ Mattermost จะแสดงเฉพาะคำตอบ
- ดู [Streaming](/th/concepts/streaming#preview-streaming-modes) สำหรับตารางการแมประดับ channel

## Reactions (message tool)

- ใช้ `message action=react` กับ `channel=mattermost`
- `messageId` คือ post id ของ Mattermost
- `emoji` รับชื่อเช่น `thumbsup` หรือ `:+1:` (ใส่ colon หรือไม่ก็ได้)
- ตั้ง `remove=true` (boolean) เพื่อลบ reaction
- เหตุการณ์เพิ่ม/ลบ reaction จะถูกส่งต่อเป็น system events ไปยังเซสชันเอเจนต์ที่ถูก route

ตัวอย่าง:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Config:

- `channels.mattermost.actions.reactions`: เปิด/ปิดใช้งาน reaction actions (ค่าเริ่มต้น true)
- การ override ต่อบัญชี: `channels.mattermost.accounts.<id>.actions.reactions`

## ปุ่มโต้ตอบ (message tool)

ส่งข้อความพร้อมปุ่มที่คลิกได้ เมื่อผู้ใช้คลิกปุ่ม เอเจนต์จะได้รับ
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

ใช้ `message action=send` พร้อมพารามิเตอร์ `buttons` ปุ่มเป็นอาร์เรย์ 2 มิติ (แถวของปุ่ม):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ฟิลด์ของปุ่ม:

- `text` (จำเป็น): ป้ายข้อความที่แสดง
- `callback_data` (จำเป็น): ค่าที่ส่งกลับเมื่อคลิก (ใช้เป็น action ID)
- `style` (ไม่บังคับ): `"default"`, `"primary"` หรือ `"danger"`

เมื่อผู้ใช้คลิกปุ่ม:

1. ปุ่มทั้งหมดจะถูกแทนที่ด้วยบรรทัดยืนยัน (เช่น "✓ **Yes** selected by @user")
2. เอเจนต์จะได้รับตัวเลือกนั้นเป็นข้อความขาเข้าและตอบกลับ

หมายเหตุ:

- callback ของปุ่มใช้การตรวจสอบ HMAC-SHA256 (อัตโนมัติ ไม่ต้องตั้งค่า)
- Mattermost จะตัด callback data ออกจากการตอบกลับของ API (คุณลักษณะด้านความปลอดภัย) ดังนั้นเมื่อคลิกแล้ว
  ปุ่มทั้งหมดจะถูกลบออก — ไม่สามารถลบบางส่วนได้
- Action IDs ที่มีเครื่องหมายขีดกลางหรือขีดล่างจะถูก sanitize โดยอัตโนมัติ
  (ข้อจำกัดด้าน routing ของ Mattermost)

Config:

- `channels.mattermost.capabilities`: อาร์เรย์ของสตริงความสามารถ เพิ่ม `"inlineButtons"` เพื่อ
  เปิดใช้คำอธิบายเครื่องมือปุ่มใน system prompt ของเอเจนต์
- `channels.mattermost.interactions.callbackBaseUrl`: base URL ภายนอกแบบไม่บังคับสำหรับ
  callbacks ของปุ่ม (เช่น `https://gateway.example.com`) ใช้สิ่งนี้เมื่อ Mattermost ไม่สามารถ
  เข้าถึง gateway ที่ bind host ของมันได้โดยตรง
- ในการตั้งค่าแบบหลายบัญชี คุณยังสามารถตั้งค่าฟิลด์เดียวกันนี้ภายใต้
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`
- หากไม่ได้ระบุ `interactions.callbackBaseUrl` OpenClaw จะสร้าง callback URL จาก
  `gateway.customBindHost` + `gateway.port` แล้ว fallback ไปที่ `http://localhost:<port>`
- กฎด้านการเข้าถึง: URL callback ของปุ่มต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
  `localhost` ใช้ได้ก็ต่อเมื่อ Mattermost และ OpenClaw ทำงานอยู่บนโฮสต์หรือ network namespace เดียวกัน
- หาก target ของ callback เป็นแบบ private/tailnet/internal ให้เพิ่ม host/domain ของมันลงใน Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`

### การเชื่อมต่อ Direct API (สคริปต์ภายนอก)

สคริปต์ภายนอกและ webhooks สามารถโพสต์ปุ่มโดยตรงผ่าน Mattermost REST API
แทนการส่งผ่านเครื่องมือ `message` ของเอเจนต์ ใช้ `buildButtonAttachments()` จาก
plugin หากเป็นไปได้; หากโพสต์ JSON ดิบ ให้ทำตามกฎเหล่านี้:

**โครงสร้าง payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // ต้องเป็นอักขระตัวอักษรหรือตัวเลขเท่านั้น — ดูด้านล่าง
            type: "button", // จำเป็น มิฉะนั้นการคลิกจะถูกเพิกเฉยแบบเงียบๆ
            name: "Approve", // ป้ายข้อความที่แสดง
            style: "primary", // ไม่บังคับ: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ต้องตรงกับ id ของปุ่ม (สำหรับ lookup ชื่อ)
                action: "approve",
                // ... ฟิลด์กำหนดเองอื่นๆ ...
                _token: "<hmac>", // ดูส่วน HMAC ด้านล่าง
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

1. attachments ต้องอยู่ใน `props.attachments` ไม่ใช่ `attachments` ระดับบนสุด (ไม่เช่นนั้นจะถูกเพิกเฉยแบบเงียบๆ)
2. ทุก action ต้องมี `type: "button"` — หากไม่มี การคลิกจะถูกกลืนหายแบบเงียบๆ
3. ทุก action ต้องมีฟิลด์ `id` — Mattermost จะเพิกเฉยต่อ actions ที่ไม่มี ID
4. `id` ของ action ต้องเป็น **ตัวอักษรหรือตัวเลขเท่านั้น** (`[a-zA-Z0-9]`) เครื่องหมายขีดกลางและขีดล่างจะทำให้
   routing action ฝั่งเซิร์ฟเวอร์ของ Mattermost พัง (ตอบกลับ 404) ให้ลบออกก่อนใช้งาน
5. `context.action_id` ต้องตรงกับ `id` ของปุ่ม เพื่อให้ข้อความยืนยันแสดง
   ชื่อปุ่ม (เช่น "Approve") แทน ID ดิบ
6. จำเป็นต้องมี `context.action_id` — interaction handler จะตอบกลับ 400 หากไม่มี

**การสร้าง HMAC token:**

gateway จะตรวจสอบการคลิกปุ่มด้วย HMAC-SHA256 สคริปต์ภายนอกต้องสร้าง token
ให้ตรงกับตรรกะการตรวจสอบของ gateway:

1. สร้าง secret จาก bot token:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. สร้างออบเจ็กต์ context โดยใส่ทุกฟิลด์ **ยกเว้น** `_token`
3. serialize ด้วย **คีย์ที่เรียงลำดับแล้ว** และ **ไม่มีช่องว่าง** (gateway ใช้ `JSON.stringify`
   กับคีย์ที่เรียงลำดับ ซึ่งให้ผลลัพธ์แบบ compact)
4. เซ็น: `HMAC-SHA256(key=secret, data=serializedContext)`
5. เพิ่ม hex digest ที่ได้เป็น `_token` ใน context

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

ข้อผิดพลาด HMAC ที่พบบ่อย:

- `json.dumps` ของ Python จะเพิ่มช่องว่างโดยค่าเริ่มต้น (`{"key": "val"}`) ให้ใช้
  `separators=(",", ":")` เพื่อให้ตรงกับผลลัพธ์ compact ของ JavaScript (`{"key":"val"}`)
- ให้เซ็น **ทุก** ฟิลด์ของ context (ยกเว้น `_token`) เสมอ gateway จะตัด `_token` ออกแล้ว
  เซ็นทุกอย่างที่เหลือ การเซ็นแค่บางส่วนจะทำให้การตรวจสอบล้มเหลวแบบเงียบๆ
- ใช้ `sort_keys=True` — gateway จะเรียงคีย์ก่อนเซ็น และ Mattermost อาจ
  เรียงฟิลด์ context ใหม่เมื่อจัดเก็บ payload
- สร้าง secret จาก bot token (แบบกำหนดได้แน่นอน) ไม่ใช่ไบต์สุ่ม secret
  ต้องเหมือนกันทั้งในโปรเซสที่สร้างปุ่มและ gateway ที่ทำการตรวจสอบ

## Directory adapter

Mattermost plugin มี directory adapter ที่ resolve ชื่อ channel และผู้ใช้
ผ่าน Mattermost API ซึ่งทำให้สามารถใช้ target แบบ `#channel-name` และ `@username` ใน
`openclaw message send` และการส่งผ่าน cron/webhook ได้

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

## การแก้ปัญหา

- ไม่มีการตอบกลับใน channels: ตรวจสอบให้แน่ใจว่าบอทอยู่ใน channel และมีการ mention ถึงมัน (oncall), ใช้ trigger prefix (onchar) หรือตั้ง `chatmode: "onmessage"`
- ข้อผิดพลาดด้าน auth: ตรวจสอบ bot token, base URL และดูว่าบัญชีถูกเปิดใช้งานหรือไม่
- ปัญหาแบบหลายบัญชี: env vars ใช้กับบัญชี `default` เท่านั้น
- Native slash commands ตอบกลับ `Unauthorized: invalid command token.`: OpenClaw
  ไม่ยอมรับ callback token สาเหตุที่พบบ่อย:
  - การลงทะเบียน slash command ล้มเหลวหรือเสร็จสมบูรณ์เพียงบางส่วนตอนเริ่มต้นระบบ
  - callback กำลังไปที่ gateway/บัญชีผิดตัว
  - Mattermost ยังมีคำสั่งเก่าที่ชี้ไปยัง callback target ก่อนหน้า
  - gateway รีสตาร์ตโดยไม่ได้เปิดใช้งาน slash commands ใหม่
- หาก native slash commands หยุดทำงาน ให้ตรวจสอบ logs เพื่อหา
  `mattermost: failed to register slash commands` หรือ
  `mattermost: native slash commands enabled but no commands could be registered`
- หากไม่ได้ระบุ `callbackUrl` และ logs เตือนว่า callback ถูก resolve เป็น
  `http://127.0.0.1:18789/...` URL นี้อาจเข้าถึงได้เฉพาะเมื่อ
  Mattermost ทำงานอยู่บนโฮสต์หรือ network namespace เดียวกับ OpenClaw ให้ตั้ง
  `commands.callbackUrl` ที่เข้าถึงได้จากภายนอกอย่างชัดเจนแทน
- ปุ่มแสดงเป็นกล่องสีขาว: เอเจนต์อาจกำลังส่งข้อมูลปุ่มที่ไม่ถูกต้อง ตรวจสอบว่าปุ่มแต่ละปุ่มมีทั้งฟิลด์ `text` และ `callback_data`
- ปุ่มแสดงผลแต่คลิกแล้วไม่เกิดอะไรขึ้น: ตรวจสอบว่า `AllowedUntrustedInternalConnections` ใน config เซิร์ฟเวอร์ Mattermost มี `127.0.0.1 localhost` และ `EnablePostActionIntegration` เป็น `true` ใน ServiceSettings
- ปุ่มตอบกลับ 404 เมื่อคลิก: `id` ของปุ่มน่าจะมีเครื่องหมายขีดกลางหรือขีดล่าง Mattermost action router จะพังเมื่อ ID ไม่ใช่ตัวอักษรหรือตัวเลข ใช้ `[a-zA-Z0-9]` เท่านั้น
- Gateway log `invalid _token`: HMAC ไม่ตรงกัน ตรวจสอบว่าคุณเซ็นทุกฟิลด์ของ context (ไม่ใช่แค่บางส่วน), ใช้คีย์ที่เรียงลำดับแล้ว และใช้ JSON แบบ compact (ไม่มีช่องว่าง) ดูส่วน HMAC ด้านบน
- Gateway log `missing _token in context`: ไม่มีฟิลด์ `_token` ใน context ของปุ่ม ตรวจสอบว่าได้รวมไว้ตอนสร้าง integration payload
- ข้อความยืนยันแสดง ID ดิบแทนชื่อปุ่ม: `context.action_id` ไม่ตรงกับ `id` ของปุ่ม ให้ตั้งทั้งสองค่าเป็นค่า sanitize เดียวกัน
- เอเจนต์ไม่รู้จักปุ่ม: เพิ่ม `capabilities: ["inlineButtons"]` ใน config channel ของ Mattermost

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — channels ที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอน pairing
- [Groups](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการบังคับ mention
- [Channel Routing](/th/channels/channel-routing) — การ route เซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความปลอดภัย
