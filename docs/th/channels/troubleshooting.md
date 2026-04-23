---
read_when:
    - ระบบขนส่งของช่องทางแสดงว่าเชื่อมต่อแล้ว แต่การตอบกลับล้มเหลว
    - คุณควรตรวจสอบเฉพาะของแต่ละช่องทางก่อนลงลึกไปยังเอกสารของผู้ให้บริการ
summary: การแก้ไขปัญหาระดับช่องทางอย่างรวดเร็ว พร้อมลักษณะความล้มเหลวและวิธีแก้แยกตามแต่ละช่องทาง
title: การแก้ไขปัญหาช่องทาง
x-i18n:
    generated_at: "2026-04-23T05:27:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# การแก้ไขปัญหาช่องทาง

ใช้หน้านี้เมื่อช่องทางเชื่อมต่อได้ แต่พฤติกรรมทำงานไม่ถูกต้อง

## ลำดับคำสั่ง

ให้รันคำสั่งเหล่านี้ตามลำดับก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ค่าพื้นฐานเมื่อระบบปกติ:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` หรือ `admin-capable`
- การ probe ของช่องทางแสดงว่าระบบขนส่งเชื่อมต่อแล้ว และในกรณีที่รองรับ จะแสดง `works` หรือ `audit ok`

## WhatsApp

### ลักษณะความล้มเหลวของ WhatsApp

| อาการ                            | สิ่งที่ควรตรวจสอบให้เร็วที่สุด                   | วิธีแก้                                                     |
| -------------------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| เชื่อมต่อแล้วแต่ไม่ตอบ DM        | `openclaw pairing list whatsapp`                 | อนุมัติผู้ส่ง หรือสลับนโยบาย DM/allowlist                 |
| ข้อความกลุ่มถูกเพิกเฉย          | ตรวจสอบ `requireMention` + mention pattern ในคอนฟิก | กล่าวถึงบอต หรือผ่อนนโยบายการกล่าวถึงสำหรับกลุ่มนั้น      |
| หลุดการเชื่อมต่อ/วนล็อกอินใหม่สุ่ม ๆ | `openclaw channels status --probe` + logs        | ล็อกอินใหม่ และตรวจสอบว่าไดเรกทอรี credentials ปกติดี      |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา WhatsApp](/th/channels/whatsapp#troubleshooting)

## Telegram

### ลักษณะความล้มเหลวของ Telegram

| อาการ                                | สิ่งที่ควรตรวจสอบให้เร็วที่สุด                   | วิธีแก้                                                                                                                |
| ------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ใช้ `/start` ได้ แต่ไม่มีโฟลว์ตอบกลับที่ใช้งานได้ | `openclaw pairing list telegram`                | อนุมัติการจับคู่ หรือเปลี่ยนนโยบาย DM                                                                                 |
| บอตออนไลน์ แต่ในกลุ่มยังเงียบอยู่      | ตรวจสอบข้อกำหนดการกล่าวถึงและ privacy mode ของบอต | ปิด privacy mode เพื่อให้มองเห็นในกลุ่ม หรือกล่าวถึงบอต                                                               |
| ส่งข้อความล้มเหลวพร้อมข้อผิดพลาดเครือข่าย | ตรวจสอบ logs สำหรับความล้มเหลวของการเรียก Telegram API | แก้ DNS/IPv6/proxy routing ไปยัง `api.telegram.org`                                                                     |
| การ polling ค้างหรือเชื่อมต่อใหม่ช้า   | `openclaw logs --follow` เพื่อดู polling diagnostics | อัปเกรด; หากการรีสตาร์ตเป็น false positive ให้ปรับ `pollingStallThresholdMs` ถ้ายังค้างจริง ให้ชี้ไปที่ proxy/DNS/IPv6 ต่อ |
| `setMyCommands` ถูกปฏิเสธตอนเริ่มระบบ | ตรวจสอบ logs หา `BOT_COMMANDS_TOO_MUCH`         | ลดคำสั่ง Telegram แบบ native จาก plugin/Skills/แบบกำหนดเอง หรือปิด native menus                                       |
| อัปเกรดแล้ว allowlist บล็อกคุณเอง      | `openclaw security audit` และคอนฟิก allowlist   | รัน `openclaw doctor --fix` หรือแทนที่ `@username` ด้วย sender ID แบบตัวเลข                                            |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา Telegram](/th/channels/telegram#troubleshooting)

## Discord

### ลักษณะความล้มเหลวของ Discord

| อาการ                           | สิ่งที่ควรตรวจสอบให้เร็วที่สุด          | วิธีแก้                                                       |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| บอตออนไลน์ แต่ไม่ตอบใน guild    | `openclaw channels status --probe`     | อนุญาต guild/channel และตรวจสอบ message content intent      |
| ข้อความกลุ่มถูกเพิกเฉย         | ตรวจสอบ logs หา mention gating drops  | กล่าวถึงบอต หรือตั้ง `requireMention: false` สำหรับ guild/channel |
| ไม่มีการตอบกลับใน DM            | `openclaw pairing list discord`        | อนุมัติการจับคู่ DM หรือปรับนโยบาย DM                       |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา Discord](/th/channels/discord#troubleshooting)

## Slack

### ลักษณะความล้มเหลวของ Slack

| อาการ                                 | สิ่งที่ควรตรวจสอบให้เร็วที่สุด          | วิธีแก้                                                                                                                                              |
| ------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode เชื่อมต่อแล้วแต่ไม่ตอบกลับ | `openclaw channels status --probe`     | ตรวจสอบ app token + bot token และ scope ที่จำเป็น; สังเกต `botTokenStatus` / `appTokenStatus = configured_unavailable` ในชุดติดตั้งที่รองรับ SecretRef |
| DM ถูกบล็อก                           | `openclaw pairing list slack`          | อนุมัติการจับคู่ หรือผ่อนนโยบาย DM                                                                                                                 |
| ข้อความในช่องถูกเพิกเฉย              | ตรวจสอบ `groupPolicy` และ channel allowlist | อนุญาตช่องนั้น หรือสลับนโยบายเป็น `open`                                                                                                         |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา Slack](/th/channels/slack#troubleshooting)

## iMessage และ BlueBubbles

### ลักษณะความล้มเหลวของ iMessage และ BlueBubbles

| อาการ                           | สิ่งที่ควรตรวจสอบให้เร็วที่สุด                                      | วิธีแก้                                                |
| ------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| ไม่มี event ขาเข้า              | ตรวจสอบการเข้าถึง webhook/server และสิทธิ์ของแอป                  | แก้ URL ของ Webhook หรือสถานะเซิร์ฟเวอร์ BlueBubbles |
| ส่งได้แต่รับไม่ได้บน macOS      | ตรวจสอบสิทธิ์ความเป็นส่วนตัวของ macOS สำหรับการทำงานอัตโนมัติของ Messages | ให้สิทธิ์ TCC ใหม่และรีสตาร์ตโปรเซสของช่องทาง        |
| ผู้ส่ง DM ถูกบล็อก              | `openclaw pairing list imessage` หรือ `openclaw pairing list bluebubbles` | อนุมัติการจับคู่ หรืออัปเดต allowlist                 |

การแก้ไขปัญหาแบบเต็ม:

- [การแก้ไขปัญหา iMessage](/th/channels/imessage#troubleshooting)
- [การแก้ไขปัญหา BlueBubbles](/th/channels/bluebubbles#troubleshooting)

## Signal

### ลักษณะความล้มเหลวของ Signal

| อาการ                           | สิ่งที่ควรตรวจสอบให้เร็วที่สุด         | วิธีแก้                                                     |
| ------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| daemon เข้าถึงได้ แต่บอตเงียบ   | `openclaw channels status --probe`    | ตรวจสอบ URL/account ของ `signal-cli` daemon และโหมด receive |
| DM ถูกบล็อก                     | `openclaw pairing list signal`        | อนุมัติผู้ส่ง หรือปรับนโยบาย DM                           |
| การตอบกลับในกลุ่มไม่ทริกเกอร์    | ตรวจสอบ group allowlist และ mention pattern | เพิ่มผู้ส่ง/กลุ่ม หรือผ่อนการกำหนดเงื่อนไข                 |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา Signal](/th/channels/signal#troubleshooting)

## QQ Bot

### ลักษณะความล้มเหลวของ QQ Bot

| อาการ                              | สิ่งที่ควรตรวจสอบให้เร็วที่สุด              | วิธีแก้                                                           |
| ---------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| บอตตอบว่า "gone to Mars"           | ตรวจสอบ `appId` และ `clientSecret` ในคอนฟิก | ตั้งค่า credentials หรือรีสตาร์ต Gateway                        |
| ไม่มีข้อความขาเข้า                 | `openclaw channels status --probe`         | ตรวจสอบ credentials บน QQ Open Platform                         |
| เสียงไม่ถูกถอดความ                 | ตรวจสอบคอนฟิกผู้ให้บริการ STT             | ตั้งค่า `channels.qqbot.stt` หรือ `tools.media.audio`            |
| ข้อความเชิงรุกส่งไม่ถึง            | ตรวจสอบข้อกำหนดด้าน interaction ของแพลตฟอร์ม QQ | QQ อาจบล็อกข้อความที่บอตเริ่มส่งเองหากไม่มี interaction ล่าสุด |

การแก้ไขปัญหาแบบเต็ม: [การแก้ไขปัญหา QQ Bot](/th/channels/qqbot#troubleshooting)

## Matrix

### ลักษณะความล้มเหลวของ Matrix

| อาการ                                  | สิ่งที่ควรตรวจสอบให้เร็วที่สุด             | วิธีแก้                                                                      |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| ล็อกอินแล้วแต่เพิกเฉยต่อข้อความในห้อง   | `openclaw channels status --probe`        | ตรวจสอบ `groupPolicy`, room allowlist และการกำหนดเงื่อนไขการกล่าวถึง        |
| DM ไม่ถูกประมวลผล                      | `openclaw pairing list matrix`            | อนุมัติผู้ส่ง หรือปรับนโยบาย DM                                              |
| ห้องที่เข้ารหัสล้มเหลว                 | `openclaw matrix verify status`           | ยืนยันอุปกรณ์ใหม่ จากนั้นตรวจสอบ `openclaw matrix verify backup status`      |
| การกู้คืนจาก backup ค้าง/เสีย           | `openclaw matrix verify backup status`    | รัน `openclaw matrix verify backup restore` หรือรันใหม่พร้อม recovery key    |
| cross-signing/bootstrap ดูผิดปกติ       | `openclaw matrix verify bootstrap`        | ซ่อม secret storage, cross-signing และสถานะ backup ในรอบเดียว               |

การตั้งค่าและคอนฟิกแบบเต็ม: [Matrix](/th/channels/matrix)
