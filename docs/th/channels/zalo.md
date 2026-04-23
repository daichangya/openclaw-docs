---
read_when:
    - การทำงานกับฟีเจอร์หรือ Webhook ของ Zalo
summary: สถานะการรองรับบอต Zalo, ความสามารถ และการตั้งค่า
title: Zalo
x-i18n:
    generated_at: "2026-04-23T05:28:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab94642ba28e79605b67586af8f71c18bc10e0af60343a7df508e6823b6f4119
    source_path: channels/zalo.md
    workflow: 15
---

# Zalo (Bot API)

สถานะ: experimental รองรับ DMs ส่วนหัวข้อ [ความสามารถ](#capabilities) ด้านล่างสะท้อนพฤติกรรมปัจจุบันของบอต Marketplace

## Bundled Plugin

Zalo มาพร้อมเป็น bundled Plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้น build แบบแพ็กเกจตามปกติ
จึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้ build รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Zalo ไว้ ให้ติดตั้ง
ด้วยตนเอง:

- ติดตั้งผ่าน CLI: `openclaw plugins install @openclaw/zalo`
- หรือจาก source checkout: `openclaw plugins install ./path/to/local/zalo-plugin`
- รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Zalo Plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันได้รวมมาไว้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. ตั้งค่า token:
   - Env: `ZALO_BOT_TOKEN=...`
   - หรือ config: `channels.zalo.accounts.default.botToken: "..."`
3. รีสตาร์ต Gateway (หรือทำขั้นตอนการตั้งค่าให้เสร็จ)
4. การเข้าถึง DM ใช้ pairing เป็นค่าเริ่มต้น; อนุมัติ pairing code เมื่อมีการติดต่อครั้งแรก

การตั้งค่าขั้นต่ำ:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## คืออะไร

Zalo เป็นแอปส่งข้อความที่เน้นผู้ใช้ในเวียดนาม; Bot API ของมันช่วยให้ Gateway รันบอตสำหรับการสนทนาแบบ 1:1 ได้
เป็นตัวเลือกที่เหมาะสำหรับงานซัพพอร์ตหรือการแจ้งเตือน เมื่อคุณต้องการให้การกำหนดเส้นทางกลับไปยัง Zalo เป็นแบบกำหนดแน่นอน

หน้านี้สะท้อนพฤติกรรมปัจจุบันของ OpenClaw สำหรับ **บอต Zalo Bot Creator / Marketplace**
**บอต Zalo Official Account (OA)** เป็นพื้นผิวผลิตภัณฑ์อีกแบบหนึ่งของ Zalo และอาจมีพฤติกรรมต่างออกไป

- ช่องทาง Zalo Bot API ที่ Gateway เป็นเจ้าของ
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะกลับไปยัง Zalo; โมเดลจะไม่เป็นผู้เลือกช่องทาง
- DMs ใช้ session main ของเอเจนต์ร่วมกัน
- ส่วน [ความสามารถ](#capabilities) ด้านล่างแสดงการรองรับปัจจุบันของบอต Marketplace

## การตั้งค่า (เส้นทางแบบเร็ว)

### 1) สร้าง bot token (แพลตฟอร์ม Zalo Bot)

1. ไปที่ [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) แล้วลงชื่อเข้าใช้
2. สร้างบอตใหม่และกำหนดค่าการตั้งค่าของมัน
3. คัดลอก bot token แบบเต็ม (โดยทั่วไปคือ `numeric_id:secret`) สำหรับบอต Marketplace โทเค็นรันไทม์ที่ใช้ได้จริงอาจปรากฏในข้อความต้อนรับของบอตหลังสร้างเสร็จ

### 2) ตั้งค่า token (env หรือ config)

ตัวอย่าง:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

หากภายหลังคุณย้ายไปใช้พื้นผิวบอต Zalo ที่รองรับกลุ่ม คุณสามารถเพิ่ม config เฉพาะกลุ่ม เช่น `groupPolicy` และ `groupAllowFrom` ได้อย่างชัดเจน สำหรับพฤติกรรมปัจจุบันของบอต Marketplace โปรดดู [ความสามารถ](#capabilities)

ตัวเลือก env: `ZALO_BOT_TOKEN=...` (ใช้ได้กับบัญชี default เท่านั้น)

การรองรับหลายบัญชี: ใช้ `channels.zalo.accounts` พร้อมโทเค็นแยกตามบัญชีและ `name` แบบไม่บังคับ

3. รีสตาร์ต Gateway โดย Zalo จะเริ่มทำงานเมื่อ resolve โทเค็นได้แล้ว (จาก env หรือ config)
4. การเข้าถึง DM ใช้ pairing เป็นค่าเริ่มต้น อนุมัติรหัสเมื่อมีการติดต่อกับบอตครั้งแรก

## วิธีการทำงาน (พฤติกรรม)

- ข้อความขาเข้าจะถูก normalize เข้าเป็น channel envelope ที่ใช้ร่วมกัน พร้อม placeholders สำหรับสื่อ
- การตอบกลับจะถูกกำหนดเส้นทางกลับไปยังแชต Zalo เดิมเสมอ
- ใช้ long-polling เป็นค่าเริ่มต้น; มีโหมด Webhook ผ่าน `channels.zalo.webhookUrl`

## ข้อจำกัด

- ข้อความขาออกจะถูกแบ่งเป็นช่วงละ 2000 ตัวอักษร (ขีดจำกัดของ Zalo API)
- การดาวน์โหลด/อัปโหลดสื่อถูกจำกัดโดย `channels.zalo.mediaMaxMb` (ค่าเริ่มต้น 5)
- การสตรีมถูกบล็อกโดยค่าเริ่มต้น เพราะข้อจำกัด 2000 ตัวอักษรทำให้การสตรีมมีประโยชน์น้อยลง

## การควบคุมการเข้าถึง (DMs)

### การเข้าถึง DM

- ค่าเริ่มต้น: `channels.zalo.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะได้รับ pairing code; ข้อความจะถูกเพิกเฉยจนกว่าจะได้รับอนุมัติ (รหัสหมดอายุภายใน 1 ชั่วโมง)
- อนุมัติผ่าน:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing เป็นการแลกเปลี่ยนโทเค็นแบบค่าเริ่มต้น รายละเอียด: [Pairing](/th/channels/pairing)
- `channels.zalo.allowFrom` รับ user IDs แบบตัวเลข (ไม่มีการค้นหา username)

## การควบคุมการเข้าถึง (Groups)

สำหรับ **บอต Zalo Bot Creator / Marketplace** การรองรับกลุ่มใช้งานไม่ได้จริง เพราะไม่สามารถเพิ่มบอตเข้าไปในกลุ่มได้เลย

นั่นหมายความว่าคีย์ config ที่เกี่ยวข้องกับกลุ่มด้านล่างมีอยู่ใน schema แต่ไม่สามารถใช้งานได้กับบอต Marketplace:

- `channels.zalo.groupPolicy` ควบคุมการจัดการข้อความกลุ่มขาเข้า: `open | allowlist | disabled`
- `channels.zalo.groupAllowFrom` จำกัดว่า sender IDs ใดสามารถกระตุ้นบอตในกลุ่มได้
- หากไม่ได้ตั้ง `groupAllowFrom` Zalo จะ fallback ไปใช้ `allowFrom` สำหรับการตรวจสอบผู้ส่ง
- หมายเหตุด้านรันไทม์: หากไม่มี `channels.zalo` เลย รันไทม์จะยังคง fallback เป็น `groupPolicy="allowlist"` เพื่อความปลอดภัย

ค่า group policy (เมื่อพื้นผิวบอตของคุณมีการเข้าถึงกลุ่ม) คือ:

- `groupPolicy: "disabled"` — บล็อกข้อความกลุ่มทั้งหมด
- `groupPolicy: "open"` — อนุญาตสมาชิกกลุ่มทุกคน (จำกัดด้วยการ mention)
- `groupPolicy: "allowlist"` — ค่าเริ่มต้นแบบ fail-closed; ยอมรับเฉพาะผู้ส่งที่ได้รับอนุญาต

หากคุณกำลังใช้พื้นผิวผลิตภัณฑ์บอต Zalo แบบอื่น และได้ยืนยันแล้วว่าพฤติกรรมกลุ่มใช้งานได้จริง ให้บันทึกแยกต่างหากแทนการสมมติว่าตรงกับโฟลว์ของบอต Marketplace

## long-polling เทียบกับ Webhook

- ค่าเริ่มต้น: long-polling (ไม่ต้องใช้ URL สาธารณะ)
- โหมด Webhook: ตั้งค่า `channels.zalo.webhookUrl` และ `channels.zalo.webhookSecret`
  - webhook secret ต้องยาว 8-256 ตัวอักษร
  - URL ของ Webhook ต้องใช้ HTTPS
  - Zalo ส่งเหตุการณ์พร้อม header `X-Bot-Api-Secret-Token` เพื่อการตรวจสอบ
  - HTTP ของ Gateway จัดการคำขอ Webhook ที่ `channels.zalo.webhookPath` (ค่าเริ่มต้นเป็นพาธของ webhook URL)
  - คำขอต้องใช้ `Content-Type: application/json` (หรือ media types แบบ `+json`)
  - เหตุการณ์ซ้ำ (`event_name + message_id`) จะถูกเพิกเฉยภายในช่วงเวลาป้องกัน replay สั้นๆ
  - ทราฟฟิกแบบ burst จะถูก rate-limit แยกตาม path/source และอาจคืนค่า HTTP 429

**หมายเหตุ:** `getUpdates` (polling) และ Webhook ใช้งานร่วมกันไม่ได้ ตามเอกสารของ Zalo API

## ประเภทข้อความที่รองรับ

หากต้องการภาพรวมแบบรวดเร็ว โปรดดู [ความสามารถ](#capabilities) หมายเหตุด้านล่างเพิ่มรายละเอียดในส่วนที่พฤติกรรมต้องการบริบทเพิ่มเติม

- **ข้อความตัวอักษร**: รองรับเต็มรูปแบบพร้อมการแบ่งช่วงละ 2000 ตัวอักษร
- **URL แบบข้อความธรรมดา**: ทำงานเหมือนข้อความตัวอักษรทั่วไป
- **Link previews / rich link cards**: ดูสถานะของบอต Marketplace ใน [ความสามารถ](#capabilities); ในทางปฏิบัติไม่สามารถกระตุ้นการตอบกลับได้อย่างน่าเชื่อถือ
- **ข้อความรูปภาพ**: ดูสถานะของบอต Marketplace ใน [ความสามารถ](#capabilities); การจัดการรูปภาพขาเข้าไม่น่าเชื่อถือ (มีตัวบ่งชี้การพิมพ์ แต่ไม่มีการตอบกลับสุดท้าย)
- **Stickers**: ดูสถานะของบอต Marketplace ใน [ความสามารถ](#capabilities)
- **ข้อความเสียง / ไฟล์เสียง / วิดีโอ / ไฟล์แนบทั่วไป**: ดูสถานะของบอต Marketplace ใน [ความสามารถ](#capabilities)
- **ประเภทที่ไม่รองรับ**: จะถูกบันทึกล็อกไว้ (ตัวอย่างเช่น ข้อความจากผู้ใช้ที่ถูกป้องกัน)

## ความสามารถ

ตารางนี้สรุปพฤติกรรมปัจจุบันของ **บอต Zalo Bot Creator / Marketplace** ใน OpenClaw

| ฟีเจอร์                     | สถานะ                                  |
| --------------------------- | --------------------------------------- |
| Direct messages             | ✅ รองรับ                                |
| Groups                      | ❌ ไม่พร้อมใช้งานสำหรับบอต Marketplace   |
| Media (inbound images)      | ⚠️ จำกัด / ควรตรวจสอบในสภาพแวดล้อมของคุณ |
| Media (outbound images)     | ⚠️ ยังไม่ได้ทดสอบซ้ำสำหรับบอต Marketplace |
| Plain URLs in text          | ✅ รองรับ                                |
| Link previews               | ⚠️ ไม่น่าเชื่อถือสำหรับบอต Marketplace   |
| Reactions                   | ❌ ไม่รองรับ                             |
| Stickers                    | ⚠️ บอต Marketplace ไม่มีการตอบกลับจากเอเจนต์ |
| Voice notes / audio / video | ⚠️ บอต Marketplace ไม่มีการตอบกลับจากเอเจนต์ |
| File attachments            | ⚠️ บอต Marketplace ไม่มีการตอบกลับจากเอเจนต์ |
| Threads                     | ❌ ไม่รองรับ                             |
| Polls                       | ❌ ไม่รองรับ                             |
| Native commands             | ❌ ไม่รองรับ                             |
| Streaming                   | ⚠️ ถูกบล็อก (ขีดจำกัด 2000 ตัวอักษร)     |

## เป้าหมายการส่ง (CLI/cron)

- ใช้ chat id เป็นเป้าหมาย
- ตัวอย่าง: `openclaw message send --channel zalo --target 123456789 --message "hi"`

## การแก้ไขปัญหา

**บอตไม่ตอบสนอง:**

- ตรวจสอบว่าโทเค็นใช้ได้: `openclaw channels status --probe`
- ตรวจสอบว่าผู้ส่งได้รับอนุมัติแล้ว (pairing หรือ allowFrom)
- ตรวจสอบล็อกของ Gateway: `openclaw logs --follow`

**Webhook ไม่ได้รับเหตุการณ์:**

- ตรวจสอบให้แน่ใจว่า URL ของ Webhook ใช้ HTTPS
- ตรวจสอบว่า secret token ยาว 8-256 ตัวอักษร
- ยืนยันว่า endpoint HTTP ของ Gateway เข้าถึงได้ตาม path ที่ตั้งค่าไว้
- ตรวจสอบว่า `getUpdates` polling ไม่ได้กำลังทำงานอยู่ (สองอย่างนี้ใช้ร่วมกันไม่ได้)

## เอกสารอ้างอิงการตั้งค่า (Zalo)

การตั้งค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

คีย์ระดับบนสุดแบบ flat (`channels.zalo.botToken`, `channels.zalo.dmPolicy` และคีย์อื่นในลักษณะเดียวกัน) เป็น shorthand แบบเดิมสำหรับบัญชีเดียว สำหรับ config ใหม่ให้ใช้ `channels.zalo.accounts.<id>.*` ทั้งสองรูปแบบยังคงมีอยู่ในเอกสารนี้เพราะยังมีอยู่ใน schema

ตัวเลือกของผู้ให้บริการ:

- `channels.zalo.enabled`: เปิด/ปิดการเริ่มต้น channel
- `channels.zalo.botToken`: bot token จากแพลตฟอร์ม Zalo Bot
- `channels.zalo.tokenFile`: อ่าน token จากพาธไฟล์ปกติ จะปฏิเสธ symlinks
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.zalo.allowFrom`: DM allowlist (user IDs) การใช้ `open` ต้องมี `"*"` ตัวช่วยตั้งค่าจะถามหา IDs แบบตัวเลข
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist) มีอยู่ใน config; โปรดดู [ความสามารถ](#capabilities) และ [การควบคุมการเข้าถึง (Groups)](#access-control-groups) สำหรับพฤติกรรมปัจจุบันของบอต Marketplace
- `channels.zalo.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม (user IDs) จะ fallback ไปใช้ `allowFrom` หากไม่ได้ตั้งค่า
- `channels.zalo.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า/ขาออก (MB, ค่าเริ่มต้น 5)
- `channels.zalo.webhookUrl`: เปิดใช้โหมด Webhook (ต้องใช้ HTTPS)
- `channels.zalo.webhookSecret`: webhook secret (8-256 ตัวอักษร)
- `channels.zalo.webhookPath`: พาธของ Webhook บนเซิร์ฟเวอร์ HTTP ของ Gateway
- `channels.zalo.proxy`: proxy URL สำหรับคำขอ API

ตัวเลือกแบบหลายบัญชี:

- `channels.zalo.accounts.<id>.botToken`: โทเค็นแยกตามบัญชี
- `channels.zalo.accounts.<id>.tokenFile`: ไฟล์ token แบบปกติแยกตามบัญชี จะปฏิเสธ symlinks
- `channels.zalo.accounts.<id>.name`: ชื่อที่แสดง
- `channels.zalo.accounts.<id>.enabled`: เปิด/ปิดบัญชี
- `channels.zalo.accounts.<id>.dmPolicy`: นโยบาย DM แยกตามบัญชี
- `channels.zalo.accounts.<id>.allowFrom`: allowlist แยกตามบัญชี
- `channels.zalo.accounts.<id>.groupPolicy`: นโยบายกลุ่มแยกตามบัญชี มีอยู่ใน config; โปรดดู [ความสามารถ](#capabilities) และ [การควบคุมการเข้าถึง (Groups)](#access-control-groups) สำหรับพฤติกรรมปัจจุบันของบอต Marketplace
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่มแยกตามบัญชี
- `channels.zalo.accounts.<id>.webhookUrl`: webhook URL แยกตามบัญชี
- `channels.zalo.accounts.<id>.webhookSecret`: webhook secret แยกตามบัญชี
- `channels.zalo.accounts.<id>.webhookPath`: webhook path แยกตามบัญชี
- `channels.zalo.accounts.<id>.proxy`: proxy URL แยกตามบัญชี

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตนของ DM และโฟลว์การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการจำกัดด้วยการ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแกร่งขึ้น
