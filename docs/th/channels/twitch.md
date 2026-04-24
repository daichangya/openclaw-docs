---
read_when:
    - การตั้งค่าการผสานรวมแชต Twitch สำหรับ OpenClaw
summary: การกำหนดค่าและการตั้งค่าบอตแชต Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-24T09:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

รองรับแชต Twitch ผ่านการเชื่อมต่อ IRC OpenClaw เชื่อมต่อในฐานะผู้ใช้ Twitch (บัญชีบอต) เพื่อรับและส่งข้อความในแชนแนลต่าง ๆ

## Bundled plugin

Twitch มาพร้อมเป็น Plugin ที่รวมมากับ OpenClaw รุ่นปัจจุบัน ดังนั้น
สำหรับแพ็กเกจ build ปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้ build รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่มี Twitch ให้ติดตั้ง
ด้วยตนเอง:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/twitch
```

เช็กเอาต์ภายในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Twitch พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มเองได้ด้วยคำสั่งข้างต้น
2. สร้างบัญชี Twitch เฉพาะสำหรับบอต (หรือใช้บัญชีที่มีอยู่แล้ว)
3. สร้างข้อมูลรับรอง: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - เลือก **Bot Token**
   - ตรวจสอบว่าเลือก scopes `chat:read` และ `chat:write` แล้ว
   - คัดลอก **Client ID** และ **Access Token**
4. ค้นหา Twitch user ID ของคุณ: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. กำหนดค่า token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
   - หรือ config: `channels.twitch.accessToken`
   - หากตั้งค่าทั้งสองอย่าง config จะมีลำดับความสำคัญสูงกว่า (env fallback ใช้ได้กับบัญชีเริ่มต้นเท่านั้น)
6. เริ่ม gateway

**⚠️ สำคัญ:** เพิ่มการควบคุมการเข้าถึง (`allowFrom` หรือ `allowedRoles`) เพื่อป้องกันไม่ให้ผู้ใช้ที่ไม่ได้รับอนุญาตทริกเกอร์บอต `requireMention` มีค่าเริ่มต้นเป็น `true`

config ขั้นต่ำ:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // บัญชี Twitch ของบอต
      accessToken: "oauth:abc123...", // OAuth Access Token (หรือใช้ตัวแปร env OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID จาก Token Generator
      channel: "vevisk", // แชตของแชนแนล Twitch ที่จะเข้าร่วม (จำเป็น)
      allowFrom: ["123456789"], // (แนะนำ) อนุญาตเฉพาะ Twitch user ID ของคุณ - หาได้จาก https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## สิ่งนี้คืออะไร

- แชนแนล Twitch ที่ Gateway เป็นเจ้าของ
- การกำหนดเส้นทางแบบกำหนดแน่นอน: คำตอบจะกลับไปที่ Twitch เสมอ
- แต่ละบัญชีจะถูกแมปไปยังคีย์เซสชันแยกอิสระ `agent:<agentId>:twitch:<accountName>`
- `username` คือบัญชีของบอต (ผู้ทำการยืนยันตัวตน), ส่วน `channel` คือห้องแชตที่จะเข้าร่วม

## การตั้งค่า (แบบละเอียด)

### สร้างข้อมูลรับรอง

ใช้ [Twitch Token Generator](https://twitchtokengenerator.com/):

- เลือก **Bot Token**
- ตรวจสอบว่าเลือก scopes `chat:read` และ `chat:write` แล้ว
- คัดลอก **Client ID** และ **Access Token**

ไม่จำเป็นต้องลงทะเบียนแอปด้วยตนเอง token จะหมดอายุภายในไม่กี่ชั่วโมง

### กำหนดค่าบอต

**ตัวแปร Env (เฉพาะบัญชีเริ่มต้น):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**หรือ config:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

หากตั้งค่าทั้ง env และ config, config จะมีลำดับความสำคัญสูงกว่า

### การควบคุมการเข้าถึง (แนะนำ)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (แนะนำ) อนุญาตเฉพาะ Twitch user ID ของคุณ
    },
  },
}
```

แนะนำให้ใช้ `allowFrom` สำหรับ allowlist แบบเข้มงวด ใช้ `allowedRoles` แทนหากคุณต้องการการเข้าถึงตาม role

**roles ที่ใช้ได้:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`

**ทำไมต้องใช้ user IDs?** ชื่อผู้ใช้สามารถเปลี่ยนได้ ซึ่งเปิดช่องให้มีการปลอมตัว ส่วน user IDs เป็นค่าถาวร

ค้นหา Twitch user ID ของคุณ: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (แปลงชื่อผู้ใช้ Twitch ของคุณเป็น ID)

## การรีเฟรช token (ไม่บังคับ)

tokens จาก [Twitch Token Generator](https://twitchtokengenerator.com/) ไม่สามารถรีเฟรชอัตโนมัติได้ - ให้สร้างใหม่เมื่อหมดอายุ

หากต้องการรีเฟรช token อัตโนมัติ ให้สร้างแอป Twitch ของคุณเองที่ [Twitch Developer Console](https://dev.twitch.tv/console) แล้วเพิ่มลงใน config:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

บอตจะรีเฟรช token อัตโนมัติก่อนหมดอายุและบันทึกเหตุการณ์การรีเฟรชลงใน logs

## การรองรับหลายบัญชี

ใช้ `channels.twitch.accounts` พร้อม token แยกตามบัญชี ดู [`gateway/configuration`](/th/gateway/configuration) สำหรับรูปแบบที่ใช้ร่วมกัน

ตัวอย่าง (บัญชีบอตหนึ่งบัญชีในสองแชนแนล):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**หมายเหตุ:** แต่ละบัญชีต้องมี token ของตัวเอง (หนึ่ง token ต่อหนึ่งแชนแนล)

## การควบคุมการเข้าถึง

### ข้อจำกัดตาม role

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Allowlist ตาม User ID (ปลอดภัยที่สุด)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### การเข้าถึงตาม role (ทางเลือก)

`allowFrom` คือ allowlist แบบเข้มงวด เมื่อกำหนดแล้ว จะอนุญาตเฉพาะ user IDs เหล่านั้น
หากคุณต้องการการเข้าถึงตาม role ให้ปล่อย `allowFrom` ว่างไว้แล้วกำหนด `allowedRoles` แทน:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### ปิดข้อกำหนด @mention

โดยค่าเริ่มต้น `requireMention` เป็น `true` หากต้องการปิดและให้ตอบกลับทุกข้อความ:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## การแก้ไขปัญหา

ก่อนอื่น ให้รันคำสั่งวินิจฉัย:

```bash
openclaw doctor
openclaw channels status --probe
```

### บอตไม่ตอบกลับข้อความ

**ตรวจสอบการควบคุมการเข้าถึง:** ตรวจสอบว่า user ID ของคุณอยู่ใน `allowFrom` หรือเอา
`allowFrom` ออกชั่วคราวแล้วตั้ง `allowedRoles: ["all"]` เพื่อทดสอบ

**ตรวจสอบว่าบอตอยู่ในแชนแนล:** บอตต้องเข้าร่วมแชนแนลที่ระบุไว้ใน `channel`

### ปัญหา token

**"Failed to connect" หรือข้อผิดพลาดการยืนยันตัวตน:**

- ตรวจสอบว่า `accessToken` คือค่า OAuth access token จริง (โดยทั่วไปจะขึ้นต้นด้วย prefix `oauth:`)
- ตรวจสอบว่า token มี scopes `chat:read` และ `chat:write`
- หากใช้การรีเฟรช token ให้ตรวจสอบว่าตั้งค่า `clientSecret` และ `refreshToken` แล้ว

### การรีเฟรช token ไม่ทำงาน

**ตรวจสอบ logs สำหรับเหตุการณ์การรีเฟรช:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

หากคุณเห็น "token refresh disabled (no refresh token)":

- ตรวจสอบว่าได้ระบุ `clientSecret`
- ตรวจสอบว่าได้ระบุ `refreshToken`

## Config

**config ของบัญชี:**

- `username` - ชื่อผู้ใช้ของบอต
- `accessToken` - OAuth access token พร้อม `chat:read` และ `chat:write`
- `clientId` - Twitch Client ID (จาก Token Generator หรือแอปของคุณ)
- `channel` - แชนแนลที่จะเข้าร่วม (จำเป็น)
- `enabled` - เปิดใช้บัญชีนี้ (ค่าเริ่มต้น: `true`)
- `clientSecret` - ไม่บังคับ: สำหรับการรีเฟรช token อัตโนมัติ
- `refreshToken` - ไม่บังคับ: สำหรับการรีเฟรช token อัตโนมัติ
- `expiresIn` - เวลา token หมดอายุเป็นวินาที
- `obtainmentTimestamp` - เวลาที่ได้รับ token
- `allowFrom` - allowlist ของ User ID
- `allowedRoles` - การควบคุมการเข้าถึงตาม role (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - ต้องมี @mention (ค่าเริ่มต้น: `true`)

**ตัวเลือกของผู้ให้บริการ:**

- `channels.twitch.enabled` - เปิด/ปิดการเริ่มต้นแชนแนล
- `channels.twitch.username` - ชื่อผู้ใช้ของบอต (config แบบบัญชีเดียวอย่างง่าย)
- `channels.twitch.accessToken` - OAuth access token (config แบบบัญชีเดียวอย่างง่าย)
- `channels.twitch.clientId` - Twitch Client ID (config แบบบัญชีเดียวอย่างง่าย)
- `channels.twitch.channel` - แชนแนลที่จะเข้าร่วม (config แบบบัญชีเดียวอย่างง่าย)
- `channels.twitch.accounts.<accountName>` - config แบบหลายบัญชี (ใช้ฟิลด์บัญชีทั้งหมดข้างต้น)

ตัวอย่างเต็ม:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## การกระทำของเครื่องมือ

เอเจนต์สามารถเรียก `twitch` ด้วย action ต่อไปนี้:

- `send` - ส่งข้อความไปยังแชนแนล

ตัวอย่าง:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## ความปลอดภัยและการปฏิบัติการ

- **ปฏิบัติต่อ tokens เหมือนรหัสผ่าน** - อย่า commit tokens ลง git
- **ใช้การรีเฟรช token อัตโนมัติ** สำหรับบอตที่ทำงานระยะยาว
- **ใช้ allowlists ตาม user ID** แทนชื่อผู้ใช้สำหรับการควบคุมการเข้าถึง
- **ติดตาม logs** สำหรับเหตุการณ์การรีเฟรช token และสถานะการเชื่อมต่อ
- **จำกัด scopes ของ token เท่าที่จำเป็น** - ขอเพียง `chat:read` และ `chat:write`
- **หากยังติดขัด**: รีสตาร์ต gateway หลังยืนยันแล้วว่าไม่มีโปรเซสอื่นครอบครองเซสชันอยู่

## ข้อจำกัด

- **500 อักขระ** ต่อข้อความ (แบ่งข้อความอัตโนมัติตามขอบเขตคำ)
- Markdown จะถูกลบออกก่อนแบ่งข้อความ
- ไม่มีการจำกัดอัตราเพิ่มเติม (ใช้ข้อจำกัดอัตราในตัวของ Twitch)

## ที่เกี่ยวข้อง

- [Channels Overview](/th/channels) — แชนแนลที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [Groups](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการควบคุมด้วย mention
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ระบบแข็งแรงขึ้น
