---
read_when:
    - การทำงานกับฟีเจอร์ช่องทาง Tlon/Urbit
summary: สถานะการรองรับ Tlon/Urbit, ความสามารถ และการตั้งค่า
title: Tlon
x-i18n:
    generated_at: "2026-04-23T05:27:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon เป็นเมสเซนเจอร์แบบกระจายศูนย์ที่สร้างบน Urbit OpenClaw เชื่อมต่อกับ ship Urbit ของคุณและสามารถ
ตอบข้อความส่วนตัวและข้อความในแชตกลุ่มได้ โดยค่าเริ่มต้น การตอบกลับในกลุ่มต้องมีการ @ mention และยังสามารถ
จำกัดเพิ่มเติมด้วย allowlist ได้

สถานะ: bundled Plugin รองรับ DMs, การ mention ในกลุ่ม, การตอบกลับในเธรด, การจัดรูปแบบ rich text และ
การอัปโหลดรูปภาพ ส่วน reactions และ polls ยังไม่รองรับ

## Bundled Plugin

Tlon มาพร้อมเป็น bundled Plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้น build แบบแพ็กเกจตามปกติ
จึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้ build รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Tlon ไว้ ให้ติดตั้ง
ด้วยตนเอง:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่า

1. ตรวจสอบให้แน่ใจว่า Tlon Plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันได้รวมมาไว้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. เตรียม ship URL และรหัสเข้าสู่ระบบของคุณ
3. ตั้งค่า `channels.tlon`
4. รีสตาร์ต Gateway
5. ส่ง DM ไปยังบอตหรือ mention มันใน channel กลุ่ม

การตั้งค่าขั้นต่ำ (บัญชีเดียว):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // แนะนำ: ship ของคุณ อนุญาตเสมอ
    },
  },
}
```

## ship แบบ private/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อก hostnames และช่วง IP แบบ private/internal เพื่อป้องกัน SSRF
หาก ship ของคุณทำงานอยู่บนเครือข่าย private (localhost, LAN IP หรือ internal hostname)
คุณต้องเปิดใช้งานอย่างชัดเจน:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

สิ่งนี้ใช้กับ URL เช่น:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ เปิดใช้งานเฉพาะเมื่อคุณเชื่อถือเครือข่ายภายในของคุณเท่านั้น การตั้งค่านี้จะปิดการป้องกัน SSRF
สำหรับคำขอไปยัง URL ของ ship ของคุณ

## channel กลุ่ม

เปิดใช้การค้นหาอัตโนมัติเป็นค่าเริ่มต้น คุณยังสามารถปักหมุด channels ด้วยตนเองได้:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

ปิดการค้นหาอัตโนมัติ:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## การควบคุมการเข้าถึง

DM allowlist (ว่าง = ไม่อนุญาต DMs ใช้ `ownerShip` สำหรับโฟลว์การอนุมัติ):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

การอนุญาตกลุ่ม (จำกัดโดยค่าเริ่มต้น):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## ระบบเจ้าของและการอนุมัติ

ตั้งค่า owner ship เพื่อรับคำขออนุมัติเมื่อผู้ใช้ที่ไม่ได้รับอนุญาตพยายามโต้ตอบ:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

owner ship จะได้รับอนุญาต **โดยอัตโนมัติทุกที่** — คำเชิญ DM จะถูกรับอัตโนมัติ และ
ข้อความใน channel จะได้รับอนุญาตเสมอ คุณไม่จำเป็นต้องเพิ่มเจ้าของลงใน `dmAllowlist` หรือ
`defaultAuthorizedShips`

เมื่อมีการตั้งค่าไว้ เจ้าของจะได้รับการแจ้งเตือนทาง DM สำหรับ:

- คำขอ DM จาก ships ที่ไม่ได้อยู่ใน allowlist
- การ mention ใน channels ที่ไม่มีการอนุญาต
- คำขอเชิญเข้ากลุ่ม

## การตั้งค่าการรับอัตโนมัติ

รับคำเชิญ DM อัตโนมัติ (สำหรับ ships ใน dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

รับคำเชิญกลุ่มอัตโนมัติ:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## เป้าหมายการส่ง (CLI/cron)

ใช้สิ่งเหล่านี้กับ `openclaw message send` หรือการส่งของ cron:

- DM: `~sampel-palnet` หรือ `dm/~sampel-palnet`
- กลุ่ม: `chat/~host-ship/channel` หรือ `group:~host-ship/channel`

## Skills ที่มาพร้อมกัน

Tlon Plugin มี Skills แบบ bundled ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
ที่ให้การเข้าถึงการทำงานของ Tlon ผ่าน CLI:

- **Contacts**: ดู/อัปเดตโปรไฟล์, แสดงรายชื่อ contacts
- **Channels**: แสดงรายการ, สร้าง, โพสต์ข้อความ, ดึงประวัติ
- **Groups**: แสดงรายการ, สร้าง, จัดการสมาชิก
- **DMs**: ส่งข้อความ, เพิ่ม reaction ให้ข้อความ
- **Reactions**: เพิ่ม/ลบ emoji reactions ให้โพสต์และ DMs
- **Settings**: จัดการสิทธิ์ของ Plugin ผ่าน slash commands

Skill นี้พร้อมใช้งานโดยอัตโนมัติเมื่อมีการติดตั้ง Plugin

## ความสามารถ

| ฟีเจอร์         | สถานะ                                   |
| --------------- | --------------------------------------- |
| Direct messages | ✅ รองรับ                                |
| Groups/channels | ✅ รองรับ (จำกัดด้วย mention โดยค่าเริ่มต้น) |
| Threads         | ✅ รองรับ (ตอบกลับในเธรดอัตโนมัติ)         |
| Rich text       | ✅ แปลง Markdown เป็นรูปแบบของ Tlon      |
| Images          | ✅ อัปโหลดไปยัง Tlon storage            |
| Reactions       | ✅ ผ่าน [Skills ที่มาพร้อมกัน](#bundled-skill) |
| Polls           | ❌ ยังไม่รองรับ                           |
| Native commands | ✅ รองรับ (เจ้าของเท่านั้นโดยค่าเริ่มต้น)  |

## การแก้ไขปัญหา

ให้รันลำดับนี้ก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

ปัญหาที่พบบ่อย:

- **DMs ถูกเพิกเฉย**: ผู้ส่งไม่ได้อยู่ใน `dmAllowlist` และไม่ได้ตั้งค่า `ownerShip` สำหรับโฟลว์การอนุมัติ
- **ข้อความกลุ่มถูกเพิกเฉย**: ยังไม่ค้นพบ channel หรือผู้ส่งไม่ได้รับอนุญาต
- **ข้อผิดพลาดการเชื่อมต่อ**: ตรวจสอบว่าเข้าถึง ship URL ได้; เปิด `allowPrivateNetwork` สำหรับ ship ในเครื่อง
- **ข้อผิดพลาดด้านการยืนยันตัวตน**: ตรวจสอบว่ารหัสเข้าสู่ระบบยังเป็นรหัสปัจจุบัน (รหัสจะหมุนเวียน)

## เอกสารอ้างอิงการตั้งค่า

การตั้งค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของผู้ให้บริการ:

- `channels.tlon.enabled`: เปิด/ปิดการเริ่มต้น channel
- `channels.tlon.ship`: ชื่อ ship Urbit ของบอต (เช่น `~sampel-palnet`)
- `channels.tlon.url`: URL ของ ship (เช่น `https://sampel-palnet.tlon.network`)
- `channels.tlon.code`: รหัสเข้าสู่ระบบของ ship
- `channels.tlon.allowPrivateNetwork`: อนุญาต URL แบบ localhost/LAN (ข้าม SSRF)
- `channels.tlon.ownerShip`: owner ship สำหรับระบบอนุมัติ (อนุญาตเสมอ)
- `channels.tlon.dmAllowlist`: ships ที่อนุญาตให้ส่ง DM (ว่าง = ไม่มี)
- `channels.tlon.autoAcceptDmInvites`: รับ DMs จาก ships ที่อยู่ใน allowlist อัตโนมัติ
- `channels.tlon.autoAcceptGroupInvites`: รับคำเชิญกลุ่มทั้งหมดอัตโนมัติ
- `channels.tlon.autoDiscoverChannels`: ค้นหา channel กลุ่มอัตโนมัติ (ค่าเริ่มต้น: true)
- `channels.tlon.groupChannels`: nests ของ channel ที่ปักหมุดด้วยตนเอง
- `channels.tlon.defaultAuthorizedShips`: ships ที่ได้รับอนุญาตสำหรับทุก channel
- `channels.tlon.authorization.channelRules`: กฎการยืนยันตัวตนราย channel
- `channels.tlon.showModelSignature`: ต่อท้ายข้อความด้วยชื่อโมเดล

## หมายเหตุ

- การตอบกลับในกลุ่มต้องมีการ mention (เช่น `~your-bot-ship`) จึงจะตอบ
- การตอบกลับในเธรด: หากข้อความขาเข้าอยู่ในเธรด OpenClaw จะตอบในเธรด
- Rich text: การจัดรูปแบบ Markdown (ตัวหนา, ตัวเอียง, โค้ด, ส่วนหัว, รายการ) จะถูกแปลงเป็นรูปแบบดั้งเดิมของ Tlon
- รูปภาพ: URL จะถูกอัปโหลดไปยัง Tlon storage และฝังเป็นบล็อกรูปภาพ

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตนของ DM และโฟลว์การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการจำกัดด้วยการ mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทาง session สำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแกร่งขึ้น
