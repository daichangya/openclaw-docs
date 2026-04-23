---
read_when:
    - การตั้งค่า Synology Chat กับ OpenClaw
    - การดีบักการกำหนดเส้นทาง Webhook ของ Synology Chat
summary: การตั้งค่า Webhook ของ Synology Chat และคอนฟิก OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T05:27:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

สถานะ: bundled plugin สำหรับช่องทางข้อความโดยตรงที่ใช้ Webhook ของ Synology Chat
Plugin นี้รับข้อความขาเข้าจาก outgoing Webhook ของ Synology Chat และส่งคำตอบกลับ
ผ่าน incoming Webhook ของ Synology Chat

## Bundled plugin

Synology Chat มาพร้อมเป็น bundled plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้น
build แบบแพ็กเกจปกติจึงไม่ต้องติดตั้งแยก

หากคุณใช้ build รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Synology Chat มา
ให้ติดตั้งด้วยตนเอง:

ติดตั้งจาก local checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว

1. ตรวจสอบให้แน่ใจว่า Plugin Synology Chat พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันจะรวมมาให้อยู่แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองจาก source checkout โดยใช้คำสั่งด้านบน
   - ตอนนี้ `openclaw onboard` จะแสดง Synology Chat ในรายการตั้งค่าช่องทางเดียวกันกับ `openclaw channels add`
   - การตั้งค่าแบบ non-interactive: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. ใน integrations ของ Synology Chat:
   - สร้าง incoming Webhook และคัดลอก URL ของมัน
   - สร้าง outgoing Webhook พร้อม secret token ของคุณ
3. ชี้ URL ของ outgoing Webhook ไปยัง OpenClaw Gateway ของคุณ:
   - ใช้ `https://gateway-host/webhook/synology` โดยค่าเริ่มต้น
   - หรือใช้ `channels.synology-chat.webhookPath` แบบกำหนดเองของคุณ
4. ตั้งค่าใน OpenClaw ให้เสร็จสิ้น
   - แบบมีคำแนะนำ: `openclaw onboard`
   - แบบตรง: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. รีสตาร์ต Gateway แล้วส่ง DM ไปยังบอต Synology Chat

รายละเอียดการยืนยันตัวตนของ Webhook:

- OpenClaw รับ token ของ outgoing Webhook จาก `body.token` จากนั้น
  `?token=...` จากนั้นจึงดูจาก header
- รูปแบบ header ที่ยอมรับ:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- token ที่ว่างหรือไม่มีจะถูกปฏิเสธแบบ fail-closed

คอนฟิกขั้นต่ำ:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## ตัวแปรสภาพแวดล้อม

สำหรับบัญชีเริ่มต้น คุณสามารถใช้ env var ได้:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (คั่นด้วยจุลภาค)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

ค่าคอนฟิกจะ override env var

## นโยบาย DM และการควบคุมการเข้าถึง

- `dmPolicy: "allowlist"` คือค่าเริ่มต้นที่แนะนำ
- `allowedUserIds` รับรายการ Synology user ID (หรือสตริงคั่นด้วยจุลภาค)
- ในโหมด `allowlist` หากรายการ `allowedUserIds` ว่าง จะถือว่าเป็นการตั้งค่าผิดพลาด และเส้นทาง Webhook จะไม่เริ่มทำงาน (ให้ใช้ `dmPolicy: "open"` หากต้องการอนุญาตทุกคน)
- `dmPolicy: "open"` อนุญาตผู้ส่งทุกคน
- `dmPolicy: "disabled"` บล็อก DM
- การผูกผู้รับสำหรับการตอบกลับจะยึดตาม `user_id` แบบตัวเลขที่คงที่เป็นค่าเริ่มต้น `channels.synology-chat.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้แบบ break-glass ที่เปิดการค้นหาด้วย username/nickname ที่เปลี่ยนแปลงได้อีกครั้งเพื่อใช้ส่งคำตอบกลับ
- การอนุมัติการจับคู่ใช้งานได้กับ:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## การส่งออกขาออก

ใช้ Synology Chat user ID แบบตัวเลขเป็นเป้าหมาย

ตัวอย่าง:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

รองรับการส่งสื่อผ่านการส่งไฟล์แบบอิง URL
URL ไฟล์ขาออกต้องใช้ `http` หรือ `https` และระบบจะปฏิเสธเป้าหมายเครือข่ายส่วนตัวหรือเป้าหมายที่ถูกบล็อกก่อนที่ OpenClaw จะส่ง URL ต่อไปยัง Webhook ของ NAS

## หลายบัญชี

รองรับหลายบัญชี Synology Chat ภายใต้ `channels.synology-chat.accounts`
แต่ละบัญชีสามารถ override token, incoming URL, webhook path, นโยบาย DM และข้อจำกัดต่าง ๆ ได้
เซสชันข้อความโดยตรงจะถูกแยกตามบัญชีและผู้ใช้ ดังนั้น `user_id` แบบตัวเลขเดียวกัน
บนบัญชี Synology สองบัญชีที่ต่างกันจะไม่ใช้สถานะทรานสคริปต์ร่วมกัน
กำหนด `webhookPath` ที่ต่างกันให้แต่ละบัญชีที่เปิดใช้งาน ตอนนี้ OpenClaw จะปฏิเสธ path แบบตรงกันซ้ำ
และจะไม่ยอมเริ่มบัญชีแบบมีชื่อที่สืบทอด webhook path แบบใช้ร่วมกันเพียงอย่างเดียวในชุดติดตั้งหลายบัญชี
หากคุณตั้งใจต้องการการสืบทอดแบบ legacy สำหรับบัญชีแบบมีชื่อ
ให้ตั้งค่า `dangerouslyAllowInheritedWebhookPath: true` บนบัญชีนั้นหรือที่ `channels.synology-chat`
แต่ path แบบตรงกันซ้ำก็ยังจะถูกปฏิเสธแบบ fail-closed อยู่ดี ควรใช้ path แยกต่อบัญชีแบบ explicit

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## หมายเหตุด้านความปลอดภัย

- เก็บ `token` เป็นความลับ และหมุนเปลี่ยนหากมีการรั่วไหล
- คง `allowInsecureSsl: false` ไว้ เว้นแต่คุณจะเชื่อถือใบรับรอง local NAS แบบ self-signed อย่างชัดเจน
- คำขอ Webhook ขาเข้าจะถูกตรวจสอบ token และจำกัดอัตราต่อผู้ส่ง
- การตรวจสอบ token ที่ไม่ถูกต้องใช้การเปรียบเทียบ secret แบบ constant-time และปฏิเสธแบบ fail-closed
- สำหรับการใช้งานจริง ควรใช้ `dmPolicy: "allowlist"`
- ปิด `dangerouslyAllowNameMatching` ไว้ เว้นแต่คุณจำเป็นต้องใช้การส่งคำตอบกลับแบบอิง username ตาม legacy อย่างชัดเจน
- ปิด `dangerouslyAllowInheritedWebhookPath` ไว้ เว้นแต่คุณยอมรับความเสี่ยงของการกำหนดเส้นทางผ่าน path ร่วมกันในชุดติดตั้งหลายบัญชีอย่างชัดเจน

## การแก้ไขปัญหา

- `Missing required fields (token, user_id, text)`:
  - payload ของ outgoing Webhook ไม่มีฟิลด์บังคับอย่างใดอย่างหนึ่ง
  - หาก Synology ส่ง token มาใน header ให้ตรวจสอบว่า gateway/proxy ยังคงส่ง header เหล่านั้นต่อไป
- `Invalid token`:
  - secret ของ outgoing Webhook ไม่ตรงกับ `channels.synology-chat.token`
  - คำขอนี้กำลังไปยังบัญชี/เส้นทาง Webhook ที่ไม่ถูกต้อง
  - reverse proxy เอา token header ออกก่อนที่คำขอจะมาถึง OpenClaw
- `Rate limit exceeded`:
  - ความพยายามใช้ token ที่ไม่ถูกต้องจากแหล่งเดิมมากเกินไป อาจทำให้แหล่งนั้นถูกล็อกชั่วคราว
  - ผู้ส่งที่ยืนยันตัวตนแล้วจะมีการจำกัดอัตราข้อความแยกต่อผู้ใช้ด้วย
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - เปิดใช้ `dmPolicy="allowlist"` แต่ยังไม่ได้กำหนดผู้ใช้
- `User not authorized`:
  - `user_id` แบบตัวเลขของผู้ส่งไม่อยู่ใน `allowedUserIds`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกำหนดเงื่อนไขการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแรง
