---
read_when:
    - การขนส่งของ channel แสดงว่าเชื่อมต่อแล้ว แต่การตอบกลับล้มเหลว
    - คุณต้องตรวจสอบเฉพาะของ channel ก่อนลงลึกไปยังเอกสารของ provider
summary: การแก้ปัญหาระดับ channel แบบรวดเร็ว พร้อมรูปแบบความล้มเหลวเฉพาะของแต่ละ channel และวิธีแก้ไข
title: การแก้ปัญหา channel
x-i18n:
    generated_at: "2026-04-24T09:00:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
    source_path: channels/troubleshooting.md
    workflow: 15
---

ใช้หน้านี้เมื่อ channel เชื่อมต่อได้ แต่พฤติกรรมทำงานไม่ถูกต้อง

## ลำดับคำสั่งตรวจสอบ

ให้รันคำสั่งเหล่านี้ตามลำดับก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สถานะพื้นฐานที่ปกติ:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` หรือ `admin-capable`
- การ probe ของ channel แสดงว่าการขนส่งเชื่อมต่อแล้ว และในกรณีที่รองรับ จะแสดง `works` หรือ `audit ok`

## WhatsApp

### รูปแบบความล้มเหลวของ WhatsApp

| อาการ                          | จุดตรวจสอบที่เร็วที่สุด                           | วิธีแก้ไข                                             |
| ------------------------------ | ------------------------------------------------ | ----------------------------------------------------- |
| เชื่อมต่อแล้วแต่ไม่มีการตอบ DM | `openclaw pairing list whatsapp`                 | อนุมัติผู้ส่งหรือเปลี่ยน DM policy/allowlist         |
| ข้อความกลุ่มถูกเพิกเฉย        | ตรวจสอบ `requireMention` + รูปแบบ mention ใน config | mention บอทหรือผ่อนนโยบาย mention สำหรับกลุ่มนั้น |
| หลุดการเชื่อมต่อ/วนล็อกอินใหม่แบบสุ่ม | `openclaw channels status --probe` + logs        | ล็อกอินใหม่และตรวจสอบว่าไดเรกทอรี credentials ปกติ |

การแก้ปัญหาแบบเต็ม: [WhatsApp troubleshooting](/th/channels/whatsapp#troubleshooting)

## Telegram

### รูปแบบความล้มเหลวของ Telegram

| อาการ                                | จุดตรวจสอบที่เร็วที่สุด                           | วิธีแก้ไข                                                                                                                   |
| ------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| มี `/start` แต่ไม่มี flow ตอบกลับที่ใช้งานได้ | `openclaw pairing list telegram`                 | อนุมัติ pairing หรือเปลี่ยน DM policy                                                                                      |
| บอทออนไลน์แต่กลุ่มเงียบ              | ตรวจสอบข้อกำหนด mention และ privacy mode ของบอท | ปิด privacy mode เพื่อให้มองเห็นในกลุ่ม หรือ mention บอท                                                                  |
| ส่งข้อความล้มเหลวพร้อมข้อผิดพลาดเครือข่าย | ตรวจสอบ logs สำหรับความล้มเหลวของ Telegram API call | แก้ DNS/IPv6/proxy routing ไปยัง `api.telegram.org`                                                                         |
| polling ค้างหรือ reconnect ช้า       | `openclaw logs --follow` สำหรับ polling diagnostics | อัปเกรด; หากการรีสตาร์ตเป็น false positive ให้ปรับ `pollingStallThresholdMs` แต่หากค้างต่อเนื่องยังชี้ไปที่ proxy/DNS/IPv6 |
| `setMyCommands` ถูกปฏิเสธตอนเริ่มต้นระบบ | ตรวจสอบ logs สำหรับ `BOT_COMMANDS_TOO_MUCH`      | ลดจำนวนคำสั่ง Telegram จาก plugin/Skills/คำสั่งกำหนดเอง หรือปิด native menus                                               |
| อัปเกรดแล้ว allowlist บล็อกคุณ        | `openclaw security audit` และ config allowlists  | รัน `openclaw doctor --fix` หรือแทนที่ `@username` ด้วย sender ID แบบตัวเลข                                                |

การแก้ปัญหาแบบเต็ม: [Telegram troubleshooting](/th/channels/telegram#troubleshooting)

## Discord

### รูปแบบความล้มเหลวของ Discord

| อาการ                        | จุดตรวจสอบที่เร็วที่สุด                  | วิธีแก้ไข                                                |
| ---------------------------- | --------------------------------------- | -------------------------------------------------------- |
| บอทออนไลน์แต่ไม่ตอบใน guild | `openclaw channels status --probe`      | อนุญาต guild/channel และตรวจสอบ message content intent  |
| ข้อความกลุ่มถูกเพิกเฉย       | ตรวจสอบ logs สำหรับ mention gating drops | mention บอทหรือตั้ง `requireMention: false` สำหรับ guild/channel |
| ไม่มีการตอบ DM               | `openclaw pairing list discord`         | อนุมัติ DM pairing หรือปรับ DM policy                    |

การแก้ปัญหาแบบเต็ม: [Discord troubleshooting](/th/channels/discord#troubleshooting)

## Slack

### รูปแบบความล้มเหลวของ Slack

| อาการ                                   | จุดตรวจสอบที่เร็วที่สุด                | วิธีแก้ไข                                                                                                                                               |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| socket mode เชื่อมต่อแล้วแต่ไม่ตอบกลับ | `openclaw channels status --probe`   | ตรวจสอบ app token + bot token และ scopes ที่จำเป็น; ดูค่า `botTokenStatus` / `appTokenStatus = configured_unavailable` ในการตั้งค่าแบบ SecretRef-backed |
| DMs ถูกบล็อก                            | `openclaw pairing list slack`        | อนุมัติ pairing หรือผ่อน DM policy                                                                                                                     |
| ข้อความใน channel ถูกเพิกเฉย            | ตรวจสอบ `groupPolicy` และ channel allowlist | อนุญาต channel หรือเปลี่ยนนโยบายเป็น `open`                                                                                                      |

การแก้ปัญหาแบบเต็ม: [Slack troubleshooting](/th/channels/slack#troubleshooting)

## iMessage และ BlueBubbles

### รูปแบบความล้มเหลวของ iMessage และ BlueBubbles

| อาการ                           | จุดตรวจสอบที่เร็วที่สุด                                                  | วิธีแก้ไข                                           |
| ------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- |
| ไม่มีเหตุการณ์ขาเข้า             | ตรวจสอบการเข้าถึง webhook/server และสิทธิ์ของแอป                      | แก้ไข URL ของ webhook หรือสถานะเซิร์ฟเวอร์ BlueBubbles |
| ส่งได้แต่รับไม่ได้บน macOS      | ตรวจสอบสิทธิ์ความเป็นส่วนตัวของ macOS สำหรับ Messages automation      | ให้สิทธิ์ TCC ใหม่และรีสตาร์ต process ของ channel    |
| ผู้ส่ง DM ถูกบล็อก              | `openclaw pairing list imessage` หรือ `openclaw pairing list bluebubbles` | อนุมัติ pairing หรืออัปเดต allowlist               |

การแก้ปัญหาแบบเต็ม:

- [iMessage troubleshooting](/th/channels/imessage#troubleshooting)
- [BlueBubbles troubleshooting](/th/channels/bluebubbles#troubleshooting)

## Signal

### รูปแบบความล้มเหลวของ Signal

| อาการ                           | จุดตรวจสอบที่เร็วที่สุด             | วิธีแก้ไข                                                |
| ------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| daemon เข้าถึงได้แต่บอทเงียบ    | `openclaw channels status --probe` | ตรวจสอบ URL/บัญชีของ `signal-cli` daemon และโหมดรับข้อความ |
| DM ถูกบล็อก                     | `openclaw pairing list signal`     | อนุมัติผู้ส่งหรือปรับ DM policy                          |
| การตอบในกลุ่มไม่ถูกทริกเกอร์    | ตรวจสอบ group allowlist และรูปแบบ mention | เพิ่มผู้ส่ง/กลุ่มหรือผ่อน gating                     |

การแก้ปัญหาแบบเต็ม: [Signal troubleshooting](/th/channels/signal#troubleshooting)

## QQ Bot

### รูปแบบความล้มเหลวของ QQ Bot

| อาการ                           | จุดตรวจสอบที่เร็วที่สุด                    | วิธีแก้ไข                                                          |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| บอทตอบว่า "gone to Mars"        | ตรวจสอบ `appId` และ `clientSecret` ใน config | ตั้งค่า credentials หรือรีสตาร์ต gateway                           |
| ไม่มีข้อความขาเข้า               | `openclaw channels status --probe`        | ตรวจสอบ credentials บน QQ Open Platform                           |
| เสียงไม่ถูกถอดเสียง              | ตรวจสอบ config ของ provider STT           | กำหนดค่า `channels.qqbot.stt` หรือ `tools.media.audio`             |
| ข้อความเชิงรุกส่งไม่ถึง          | ตรวจสอบข้อกำหนด interaction ของแพลตฟอร์ม QQ | QQ อาจบล็อกข้อความที่บอทเริ่มส่งเองหากไม่มี interaction ล่าสุด |

การแก้ปัญหาแบบเต็ม: [QQ Bot troubleshooting](/th/channels/qqbot#troubleshooting)

## Matrix

### รูปแบบความล้มเหลวของ Matrix

| อาการ                                 | จุดตรวจสอบที่เร็วที่สุด                  | วิธีแก้ไข                                                                      |
| ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| ล็อกอินแล้วแต่ไม่สนใจข้อความในห้อง     | `openclaw channels status --probe`      | ตรวจสอบ `groupPolicy`, room allowlist และ mention gating                      |
| DMs ไม่ถูกประมวลผล                    | `openclaw pairing list matrix`          | อนุมัติผู้ส่งหรือปรับ DM policy                                               |
| ห้องที่เข้ารหัสล้มเหลว                | `openclaw matrix verify status`         | ยืนยันอุปกรณ์ใหม่อีกครั้ง แล้วตรวจสอบ `openclaw matrix verify backup status` |
| การกู้คืนแบ็กอัปค้าง/เสีย              | `openclaw matrix verify backup status`  | รัน `openclaw matrix verify backup restore` หรือรันใหม่พร้อม recovery key     |
| cross-signing/bootstrap ดูผิดปกติ      | `openclaw matrix verify bootstrap`      | ซ่อมสถานะ secret storage, cross-signing และ backup ในรอบเดียว                 |

การตั้งค่าและ config แบบเต็ม: [Matrix](/th/channels/matrix)

## ที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Channel routing](/th/channels/channel-routing)
- [Gateway troubleshooting](/th/gateway/troubleshooting)
