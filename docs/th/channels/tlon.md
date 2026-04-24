---
read_when:
    - กำลังทำงานเกี่ยวกับฟีเจอร์ช่องทาง Tlon/Urbit
summary: สถานะ ความสามารถ และการกำหนดค่าการรองรับ Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-24T09:00:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon เป็นแอปส่งข้อความแบบกระจายศูนย์ที่สร้างบน Urbit OpenClaw เชื่อมต่อกับ ship Urbit ของคุณและสามารถ
ตอบกลับ DM และข้อความแชตกลุ่มได้ การตอบกลับในกลุ่มต้องมีการ @ กล่าวถึงโดยค่าเริ่มต้น และยังสามารถ
จำกัดเพิ่มเติมได้ผ่าน allowlist

สถานะ: bundled plugin รองรับ DMs, การกล่าวถึงในกลุ่ม, การตอบกลับในเธรด, การจัดรูปแบบ rich text และ
การอัปโหลดรูปภาพแล้ว ส่วน reactions และ polls ยังไม่รองรับ

## Bundled plugin

Tlon มาพร้อมเป็น bundled plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แพ็กเกจปกติ
จึงไม่ต้องติดตั้งแยก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Tlon ให้ติดตั้ง
ด้วยตนเอง:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

Local checkout (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่า

1. ตรวจสอบให้แน่ใจว่า plugin Tlon พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งด้านบน
2. เตรียม URL ของ ship และรหัสเข้าสู่ระบบของคุณ
3. กำหนดค่า `channels.tlon`
4. รีสตาร์ท gateway
5. ส่ง DM ไปยังบอตหรือกล่าวถึงบอตในช่องทางกลุ่ม

การกำหนดค่าขั้นต่ำ (บัญชีเดียว):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Ship แบบส่วนตัว/LAN

โดยค่าเริ่มต้น OpenClaw จะบล็อก hostname และช่วง IP ภายใน/ส่วนตัวเพื่อป้องกัน SSRF
หาก ship ของคุณรันอยู่บนเครือข่ายส่วนตัว (localhost, LAN IP หรือ hostname ภายใน)
คุณต้องเปิดใช้อย่างชัดเจน:

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

ใช้กับ URL เช่น:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ เปิดใช้งานสิ่งนี้เฉพาะเมื่อคุณเชื่อถือเครือข่ายภายในของคุณเท่านั้น การตั้งค่านี้จะปิดการป้องกัน SSRF
สำหรับคำขอไปยัง URL ของ ship ของคุณ

## ช่องทางกลุ่ม

เปิดใช้การค้นพบอัตโนมัติเป็นค่าเริ่มต้น คุณยังสามารถปักหมุดช่องทางด้วยตนเองได้:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

ปิดการค้นพบอัตโนมัติ:

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

allowlist สำหรับ DM (ว่าง = ไม่อนุญาต DM ใด ๆ ใช้ `ownerShip` สำหรับโฟลว์การอนุมัติ):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

การอนุญาตสำหรับกลุ่ม (จำกัดโดยค่าเริ่มต้น):

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

owner ship จะ **ได้รับอนุญาตโดยอัตโนมัติทุกที่** — คำเชิญ DM จะถูกยอมรับอัตโนมัติ และ
ข้อความในช่องทางจะได้รับอนุญาตเสมอ คุณไม่จำเป็นต้องเพิ่ม owner ลงใน `dmAllowlist` หรือ
`defaultAuthorizedShips`

เมื่อตั้งค่าไว้ เจ้าของจะได้รับการแจ้งเตือนทาง DM สำหรับ:

- คำขอ DM จาก ship ที่ไม่อยู่ใน allowlist
- การกล่าวถึงในช่องทางที่ยังไม่ได้รับอนุญาต
- คำขอเชิญเข้ากลุ่ม

## การตั้งค่าการยอมรับอัตโนมัติ

ยอมรับคำเชิญ DM อัตโนมัติ (สำหรับ ship ที่อยู่ใน dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

ยอมรับคำเชิญเข้ากลุ่มอัตโนมัติ:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## เป้าหมายการส่ง (CLI/Cron)

ใช้สิ่งเหล่านี้กับ `openclaw message send` หรือการส่งผ่าน Cron:

- DM: `~sampel-palnet` หรือ `dm/~sampel-palnet`
- กลุ่ม: `chat/~host-ship/channel` หรือ `group:~host-ship/channel`

## Skill ที่มาพร้อม

plugin Tlon มี skill ที่มาพร้อม ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
ซึ่งให้การเข้าถึงการทำงานของ Tlon ผ่าน CLI:

- **รายชื่อผู้ติดต่อ**: ดู/อัปเดตโปรไฟล์, แสดงรายชื่อผู้ติดต่อ
- **ช่องทาง**: แสดงรายการ, สร้าง, โพสต์ข้อความ, ดึงประวัติ
- **กลุ่ม**: แสดงรายการ, สร้าง, จัดการสมาชิก
- **DMs**: ส่งข้อความ, react กับข้อความ
- **Reactions**: เพิ่ม/ลบ emoji reaction ให้กับโพสต์และ DM
- **การตั้งค่า**: จัดการสิทธิ์ของ plugin ผ่านคำสั่ง slash

skill นี้พร้อมใช้งานโดยอัตโนมัติเมื่อมีการติดตั้ง plugin

## ความสามารถ

| Feature         | Status                                    |
| --------------- | ----------------------------------------- |
| ข้อความส่วนตัว | ✅ รองรับ                                  |
| กลุ่ม/ช่องทาง  | ✅ รองรับ (กั้นด้วยการกล่าวถึงโดยค่าเริ่มต้น) |
| เธรด            | ✅ รองรับ (ตอบกลับในเธรดอัตโนมัติ)         |
| Rich text       | ✅ แปลง Markdown เป็นรูปแบบของ Tlon       |
| รูปภาพ          | ✅ อัปโหลดไปยัง storage ของ Tlon          |
| Reactions       | ✅ ผ่าน [skill ที่มาพร้อม](#skill-ที่มาพร้อม) |
| Polls           | ❌ ยังไม่รองรับ                            |
| คำสั่งเนทีฟ     | ✅ รองรับ (เฉพาะเจ้าของโดยค่าเริ่มต้น)     |

## การแก้ไขปัญหา

ให้รันลำดับนี้ก่อน:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

ปัญหาที่พบบ่อย:

- **DM ถูกเพิกเฉย**: ผู้ส่งไม่อยู่ใน `dmAllowlist` และไม่ได้กำหนด `ownerShip` สำหรับโฟลว์การอนุมัติ
- **ข้อความกลุ่มถูกเพิกเฉย**: ไม่พบช่องทางหรือผู้ส่งไม่ได้รับอนุญาต
- **ข้อผิดพลาดการเชื่อมต่อ**: ตรวจสอบว่า URL ของ ship เข้าถึงได้; เปิด `allowPrivateNetwork` สำหรับ ship ภายใน
- **ข้อผิดพลาดการยืนยันตัวตน**: ตรวจสอบว่ารหัสเข้าสู่ระบบยังเป็นปัจจุบัน (รหัสมีการหมุนเวียน)

## ข้อมูลอ้างอิงการกำหนดค่า

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของผู้ให้บริการ:

- `channels.tlon.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.tlon.ship`: ชื่อ ship Urbit ของบอต (เช่น `~sampel-palnet`)
- `channels.tlon.url`: URL ของ ship (เช่น `https://sampel-palnet.tlon.network`)
- `channels.tlon.code`: รหัสเข้าสู่ระบบของ ship
- `channels.tlon.allowPrivateNetwork`: อนุญาต URL ของ localhost/LAN (ข้าม SSRF)
- `channels.tlon.ownerShip`: owner ship สำหรับระบบการอนุมัติ (ได้รับอนุญาตเสมอ)
- `channels.tlon.dmAllowlist`: ship ที่อนุญาตให้ส่ง DM (ว่าง = ไม่มี)
- `channels.tlon.autoAcceptDmInvites`: ยอมรับ DM อัตโนมัติจาก ship ที่อยู่ใน allowlist
- `channels.tlon.autoAcceptGroupInvites`: ยอมรับคำเชิญเข้ากลุ่มทั้งหมดอัตโนมัติ
- `channels.tlon.autoDiscoverChannels`: ค้นพบช่องทางกลุ่มอัตโนมัติ (ค่าเริ่มต้น: true)
- `channels.tlon.groupChannels`: nests ของช่องทางที่ปักหมุดเอง
- `channels.tlon.defaultAuthorizedShips`: ship ที่ได้รับอนุญาตสำหรับทุกช่องทาง
- `channels.tlon.authorization.channelRules`: กฎการยืนยันตัวตนต่อช่องทาง
- `channels.tlon.showModelSignature`: ต่อท้ายชื่อโมเดลในข้อความ

## หมายเหตุ

- การตอบกลับในกลุ่มต้องมีการกล่าวถึง (เช่น `~your-bot-ship`) จึงจะตอบกลับ
- การตอบกลับในเธรด: หากข้อความขาเข้าอยู่ในเธรด OpenClaw จะตอบกลับในเธรดนั้น
- Rich text: การจัดรูปแบบ Markdown (ตัวหนา, ตัวเอียง, โค้ด, หัวเรื่อง, รายการ) จะถูกแปลงเป็นรูปแบบเนทีฟของ Tlon
- รูปภาพ: URL จะถูกอัปโหลดไปยัง storage ของ Tlon และฝังเป็นบล็อกรูปภาพ

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแกร่ง
