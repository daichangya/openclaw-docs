---
read_when:
    - การตั้งค่า Synology Chat กับ OpenClaw
    - การดีบักการกำหนดเส้นทาง Webhook ของ Synology Chat
summary: การตั้งค่า Webhook ของ Synology Chat และการกำหนดค่า OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T08:59:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

สถานะ: Bundled Plugin สำหรับช่องทางข้อความส่วนตัวที่ใช้ Webhook ของ Synology Chat โดยตรง
Plugin นี้รับข้อความขาเข้าจาก outgoing webhook ของ Synology Chat และส่งคำตอบกลับ
ผ่าน incoming Webhook ของ Synology Chat

## Bundled Plugin

Synology Chat มาพร้อมเป็น Bundled Plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แพ็กเกจปกติจึงไม่ต้องติดตั้งแยก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Synology Chat
ให้ติดตั้งด้วยตนเอง:

ติดตั้งจาก local checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว

1. ตรวจสอบให้แน่ใจว่า Plugin Synology Chat พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันได้รวมไว้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองจาก source checkout ด้วยคำสั่งด้านบน
   - ตอนนี้ `openclaw onboard` จะแสดง Synology Chat ในรายการตั้งค่าช่องทางเดียวกันกับ `openclaw channels add`
   - การตั้งค่าแบบไม่โต้ตอบ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. ใน integrations ของ Synology Chat:
   - สร้าง incoming Webhook และคัดลอก URL ของมัน
   - สร้าง outgoing Webhook พร้อม secret token ของคุณ
3. ชี้ URL ของ outgoing Webhook ไปยัง gateway ของ OpenClaw:
   - ค่าเริ่มต้นคือ `https://gateway-host/webhook/synology`
   - หรือใช้ `channels.synology-chat.webhookPath` แบบกำหนดเอง
4. ตั้งค่าให้เสร็จใน OpenClaw
   - แบบมีคำแนะนำ: `openclaw onboard`
   - แบบตรง: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. รีสตาร์ท gateway แล้วส่ง DM ไปยังบอต Synology Chat

รายละเอียดการยืนยันตัวตนของ Webhook:

- OpenClaw รับ token ของ outgoing Webhook จาก `body.token` ก่อน จากนั้น
  `?token=...` แล้วจึงเป็น headers
- รูปแบบ header ที่ยอมรับ:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- token ที่ว่างหรือไม่มีจะถูกปฏิเสธแบบ fail-closed

การกำหนดค่าขั้นต่ำ:

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

## ตัวแปร environment

สำหรับบัญชีเริ่มต้น คุณสามารถใช้ env vars ได้:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (คั่นด้วยจุลภาค)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

ค่าการกำหนดค่าจะมีลำดับความสำคัญเหนือ env vars

ไม่สามารถตั้งค่า `SYNOLOGY_CHAT_INCOMING_URL` จาก workspace `.env` ได้; ดู [ไฟล์ `.env` ของ Workspace](/th/gateway/security)

## นโยบาย DM และการควบคุมการเข้าถึง

- `dmPolicy: "allowlist"` เป็นค่าเริ่มต้นที่แนะนำ
- `allowedUserIds` รับรายการ (หรือสตริงที่คั่นด้วยจุลภาค) ของ Synology user ID
- ในโหมด `allowlist` หากรายการ `allowedUserIds` ว่าง จะถือว่าเป็นการกำหนดค่าผิดพลาด และเส้นทาง Webhook จะไม่เริ่มทำงาน (ใช้ `dmPolicy: "open"` หากต้องการอนุญาตทั้งหมด)
- `dmPolicy: "open"` อนุญาตผู้ส่งทุกคน
- `dmPolicy: "disabled"` บล็อก DM
- การผูกผู้รับคำตอบจะยึดกับ `user_id` แบบตัวเลขที่คงที่โดยค่าเริ่มต้น `channels.synology-chat.dangerouslyAllowNameMatching: true` เป็นโหมดความเข้ากันได้แบบ break-glass ที่เปิดใช้การค้นหาชื่อผู้ใช้/ชื่อเล่นที่เปลี่ยนแปลงได้อีกครั้งสำหรับการส่งคำตอบ
- การอนุมัติการจับคู่ทำงานร่วมกับ:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## การส่งขาออก

ใช้ Synology Chat user ID แบบตัวเลขเป็นเป้าหมาย

ตัวอย่าง:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

รองรับการส่งสื่อด้วยการส่งไฟล์โดยใช้ URL
URL ไฟล์ขาออกต้องใช้ `http` หรือ `https` และเป้าหมายเครือข่ายส่วนตัวหรือเป้าหมายที่ถูกบล็อกจะถูกปฏิเสธก่อนที่ OpenClaw จะส่งต่อ URL ไปยัง Webhook ของ NAS

## หลายบัญชี

รองรับหลายบัญชี Synology Chat ภายใต้ `channels.synology-chat.accounts`
แต่ละบัญชีสามารถ override token, incoming URL, webhook path, นโยบาย DM และข้อจำกัดต่าง ๆ
เซสชันข้อความส่วนตัวจะถูกแยกตามบัญชีและผู้ใช้ ดังนั้น `user_id` แบบตัวเลขเดียวกัน
บนสองบัญชี Synology ที่ต่างกันจะไม่ใช้สถานะ transcript ร่วมกัน
กำหนด `webhookPath` ที่แตกต่างกันให้แต่ละบัญชีที่เปิดใช้งาน ตอนนี้ OpenClaw จะปฏิเสธเส้นทางแบบตรงกันซ้ำ
และจะปฏิเสธการเริ่มทำงานของบัญชีที่มีชื่อซึ่งสืบทอดเพียง webhook path ที่ใช้ร่วมกันในการตั้งค่าแบบหลายบัญชี
หากคุณตั้งใจต้องการการสืบทอดแบบเดิมสำหรับบัญชีที่มีชื่อ ให้ตั้งค่า
`dangerouslyAllowInheritedWebhookPath: true` ในบัญชีนั้นหรือที่ `channels.synology-chat`
แต่เส้นทางแบบตรงกันซ้ำจะยังคงถูกปฏิเสธแบบ fail-closed แนะนำให้กำหนด path แยกต่อบัญชีอย่างชัดเจน

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

- เก็บ `token` เป็นความลับ และหมุนเวียนหากมีการรั่วไหล
- ให้ `allowInsecureSsl: false` ไว้ เว้นแต่คุณจะเชื่อถือใบรับรอง NAS ภายในแบบ self-signed อย่างชัดเจน
- คำขอ Webhook ขาเข้าจะถูกตรวจสอบ token และจำกัดอัตราต่อผู้ส่ง
- การตรวจสอบ token ที่ไม่ถูกต้องใช้การเปรียบเทียบ secret แบบเวลาคงที่และปฏิเสธแบบ fail-closed
- แนะนำให้ใช้ `dmPolicy: "allowlist"` สำหรับ production
- อย่าเปิด `dangerouslyAllowNameMatching` เว้นแต่คุณต้องการการส่งคำตอบแบบอิงชื่อผู้ใช้ของระบบเดิมอย่างชัดเจน
- อย่าเปิด `dangerouslyAllowInheritedWebhookPath` เว้นแต่คุณยอมรับความเสี่ยงของการกำหนดเส้นทางแบบใช้ path ร่วมกันในการตั้งค่าแบบหลายบัญชีอย่างชัดเจน

## การแก้ไขปัญหา

- `Missing required fields (token, user_id, text)`:
  - payload ของ outgoing Webhook ไม่มีหนึ่งในฟิลด์ที่จำเป็น
  - หาก Synology ส่ง token ใน headers ให้ตรวจสอบว่า gateway/proxy เก็บ headers เหล่านั้นไว้
- `Invalid token`:
  - secret ของ outgoing Webhook ไม่ตรงกับ `channels.synology-chat.token`
  - คำขอกำลังไปยังบัญชี/เส้นทาง Webhook ที่ผิด
  - reverse proxy ลบ token header ก่อนที่คำขอจะถึง OpenClaw
- `Rate limit exceeded`:
  - ความพยายามใช้ token ที่ไม่ถูกต้องมากเกินไปจากแหล่งเดียวกันอาจทำให้แหล่งนั้นถูกล็อกชั่วคราว
  - ผู้ส่งที่ยืนยันตัวตนแล้วก็ยังมีข้อจำกัดอัตราข้อความแยกต่อผู้ใช้
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - เปิดใช้ `dmPolicy="allowlist"` แต่ยังไม่ได้กำหนดค่าผู้ใช้
- `User not authorized`:
  - `user_id` แบบตัวเลขของผู้ส่งไม่อยู่ใน `allowedUserIds`

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแกร่ง
