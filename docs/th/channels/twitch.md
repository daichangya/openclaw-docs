---
read_when:
    - การตั้งค่าการผสานรวมแชต Twitch สำหรับ OpenClaw
summary: การกำหนดค่าและการตั้งค่าบอตแชต Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-23T05:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47af9fb6edb1f462c5919850ee9d05e500a1914ddd0d64a41608fbe960e77cd6
    source_path: channels/twitch.md
    workflow: 15
---

# Twitch

รองรับแชต Twitch ผ่านการเชื่อมต่อ IRC OpenClaw เชื่อมต่อในฐานะผู้ใช้ Twitch (บัญชีบอต) เพื่อรับและส่งข้อความในช่องต่าง ๆ

## Plugin ที่มาพร้อมกัน

Twitch มาพร้อมเป็น Plugin ที่รวมมาในรีลีส OpenClaw ปัจจุบัน ดังนั้น
บิลด์แพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์เก่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Twitch ให้ติดตั้ง
ด้วยตนเอง:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/twitch
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าแบบรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Plugin Twitch พร้อมใช้งาน
   - รีลีส OpenClaw แบบแพ็กเกจในปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองด้วยคำสั่งด้านบน
2. สร้างบัญชี Twitch เฉพาะสำหรับบอต (หรือใช้บัญชีที่มีอยู่)
3. สร้างข้อมูลรับรอง: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - เลือก **Bot Token**
   - ตรวจสอบว่าเลือก scope `chat:read` และ `chat:write` แล้ว
   - คัดลอก **Client ID** และ **Access Token**
4. ค้นหา Twitch user ID ของคุณ: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. กำหนดค่า token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (เฉพาะบัญชีเริ่มต้น)
   - หรือ config: `channels.twitch.accessToken`
   - หากตั้งค่าทั้งสองแบบ config จะมีลำดับความสำคัญสูงกว่า (env fallback ใช้ได้เฉพาะบัญชีเริ่มต้น)
6. เริ่ม gateway

**⚠️ สำคัญ:** เพิ่มการควบคุมการเข้าถึง (`allowFrom` หรือ `allowedRoles`) เพื่อป้องกันผู้ใช้ที่ไม่ได้รับอนุญาตจากการกระตุ้นบอต `requireMention` มีค่าเริ่มต้นเป็น `true`

config ขั้นต่ำ:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // บัญชี Twitch ของบอต
      accessToken: "oauth:abc123...", // OAuth Access Token (หรือใช้ตัวแปร env OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID จาก Token Generator
      channel: "vevisk", // แชตของช่อง Twitch ที่จะเข้าร่วม (จำเป็น)
      allowFrom: ["123456789"], // (แนะนำ) เฉพาะ Twitch user ID ของคุณ - ดูได้จาก https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## สิ่งนี้คืออะไร

- ช่อง Twitch ที่ Gateway เป็นผู้ดูแล
- การกำหนดเส้นทางแบบกำหนดแน่นอน: คำตอบจะกลับไปที่ Twitch เสมอ
- แต่ละบัญชีจะจับคู่กับคีย์เซสชันแบบแยก `agent:<agentId>:twitch:<accountName>`
- `username` คือบัญชีของบอต (ผู้ที่ยืนยันตัวตน) ส่วน `channel` คือห้องแชตที่จะเข้าร่วม

## การตั้งค่า (แบบละเอียด)

### สร้างข้อมูลรับรอง

ใช้ [Twitch Token Generator](https://twitchtokengenerator.com/):

- เลือก **Bot Token**
- ตรวจสอบว่าเลือก scope `chat:read` และ `chat:write` แล้ว
- คัดลอก **Client ID** และ **Access Token**

ไม่จำเป็นต้องลงทะเบียนแอปด้วยตนเอง token จะหมดอายุหลังจากผ่านไปหลายชั่วโมง

### กำหนดค่าบอต

**ตัวแปร env (เฉพาะบัญชีเริ่มต้น):**

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

หากตั้งค่าทั้ง env และ config ไว้พร้อมกัน config จะมีลำดับความสำคัญสูงกว่า

### การควบคุมการเข้าถึง (แนะนำ)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (แนะนำ) เฉพาะ Twitch user ID ของคุณ
    },
  },
}
```

ควรใช้ `allowFrom` สำหรับ allowlist แบบบังคับ หากคุณต้องการการเข้าถึงตามบทบาท ให้ใช้ `allowedRoles` แทน

**บทบาทที่ใช้ได้:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`

**ทำไมต้องใช้ user ID?** ชื่อผู้ใช้สามารถเปลี่ยนได้ ทำให้เกิดการปลอมตัวได้ ส่วน user ID เป็นค่าถาวร

ค้นหา Twitch user ID ของคุณ: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (แปลงชื่อผู้ใช้ Twitch ของคุณเป็น ID)

## การรีเฟรช token (ไม่บังคับ)

token จาก [Twitch Token Generator](https://twitchtokengenerator.com/) ไม่สามารถรีเฟรชอัตโนมัติได้ - ให้สร้างใหม่เมื่อหมดอายุ

หากต้องการรีเฟรช token อัตโนมัติ ให้สร้างแอป Twitch ของคุณเองที่ [Twitch Developer Console](https://dev.twitch.tv/console) และเพิ่มลงใน config:

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

บอตจะรีเฟรช token อัตโนมัติก่อนหมดอายุและบันทึกเหตุการณ์การรีเฟรชลงในล็อก

## การรองรับหลายบัญชี

ใช้ `channels.twitch.accounts` พร้อม token แยกตามบัญชี ดูรูปแบบที่ใช้ร่วมกันได้ที่ [`gateway/configuration`](/th/gateway/configuration)

ตัวอย่าง (บัญชีบอตหนึ่งบัญชีในสองช่อง):

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

**หมายเหตุ:** แต่ละบัญชีต้องมี token ของตัวเอง (หนึ่ง token ต่อหนึ่งช่อง)

## การควบคุมการเข้าถึง

### การจำกัดตามบทบาท

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

### การเข้าถึงตามบทบาท (ทางเลือก)

`allowFrom` คือ allowlist แบบบังคับ เมื่อมีการตั้งค่าไว้ จะอนุญาตเฉพาะ user ID เหล่านั้นเท่านั้น
หากคุณต้องการการเข้าถึงตามบทบาท ให้เว้น `allowFrom` ไว้และกำหนด `allowedRoles` แทน:

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

โดยค่าเริ่มต้น `requireMention` เป็น `true` หากต้องการปิดและตอบทุกข้อความ:

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

### บอตไม่ตอบข้อความ

**ตรวจสอบการควบคุมการเข้าถึง:** ตรวจสอบว่า user ID ของคุณอยู่ใน `allowFrom` หรือเอา
`allowFrom` ออกชั่วคราวแล้วตั้ง `allowedRoles: ["all"]` เพื่อทดสอบ

**ตรวจสอบว่าบอตอยู่ในช่องแล้ว:** บอตต้องเข้าร่วมช่องที่ระบุไว้ใน `channel`

### ปัญหาเกี่ยวกับ token

**"Failed to connect" หรือข้อผิดพลาดในการยืนยันตัวตน:**

- ตรวจสอบว่า `accessToken` คือค่า OAuth access token (โดยทั่วไปจะขึ้นต้นด้วยคำนำหน้า `oauth:`)
- ตรวจสอบว่า token มี scope `chat:read` และ `chat:write`
- หากใช้การรีเฟรช token ให้ตรวจสอบว่าได้ตั้งค่า `clientSecret` และ `refreshToken` แล้ว

### การรีเฟรช token ไม่ทำงาน

**ตรวจสอบล็อกสำหรับเหตุการณ์การรีเฟรช:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

หากคุณเห็น "token refresh disabled (no refresh token)":

- ตรวจสอบว่ามีการระบุ `clientSecret`
- ตรวจสอบว่ามีการระบุ `refreshToken`

## Config

**config ของบัญชี:**

- `username` - ชื่อผู้ใช้ของบอต
- `accessToken` - OAuth access token ที่มี `chat:read` และ `chat:write`
- `clientId` - Twitch Client ID (จาก Token Generator หรือแอปของคุณ)
- `channel` - ช่องที่จะเข้าร่วม (จำเป็น)
- `enabled` - เปิดใช้งานบัญชีนี้ (ค่าเริ่มต้น: `true`)
- `clientSecret` - ไม่บังคับ: สำหรับการรีเฟรช token อัตโนมัติ
- `refreshToken` - ไม่บังคับ: สำหรับการรีเฟรช token อัตโนมัติ
- `expiresIn` - เวลาหมดอายุของ token เป็นวินาที
- `obtainmentTimestamp` - เวลาที่ได้รับ token
- `allowFrom` - allowlist ของ user ID
- `allowedRoles` - การควบคุมการเข้าถึงตามบทบาท (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - ต้องมี @mention (ค่าเริ่มต้น: `true`)

**ตัวเลือกของผู้ให้บริการ:**

- `channels.twitch.enabled` - เปิด/ปิดการเริ่มต้นของช่อง
- `channels.twitch.username` - ชื่อผู้ใช้ของบอต (config แบบบัญชีเดียวที่ง่ายขึ้น)
- `channels.twitch.accessToken` - OAuth access token (config แบบบัญชีเดียวที่ง่ายขึ้น)
- `channels.twitch.clientId` - Twitch Client ID (config แบบบัญชีเดียวที่ง่ายขึ้น)
- `channels.twitch.channel` - ช่องที่จะเข้าร่วม (config แบบบัญชีเดียวที่ง่ายขึ้น)
- `channels.twitch.accounts.<accountName>` - config หลายบัญชี (ทุกฟิลด์ของบัญชีด้านบน)

ตัวอย่างแบบเต็ม:

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

## การกระทำของ tool

เอเจนต์สามารถเรียก `twitch` ด้วยการกระทำ:

- `send` - ส่งข้อความไปยังช่อง

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

## ความปลอดภัยและการดำเนินงาน

- **ถือว่า token เป็นเหมือนรหัสผ่าน** - อย่า commit token ลง git
- **ใช้การรีเฟรช token อัตโนมัติ** สำหรับบอตที่ทำงานต่อเนื่องยาวนาน
- **ใช้ allowlist ตาม user ID** แทนชื่อผู้ใช้สำหรับการควบคุมการเข้าถึง
- **เฝ้าดูล็อก** สำหรับเหตุการณ์การรีเฟรช token และสถานะการเชื่อมต่อ
- **ขอ scope เท่าที่จำเป็นเท่านั้น** - ขอเพียง `chat:read` และ `chat:write`
- **หากยังติดปัญหา**: รีสตาร์ต gateway หลังยืนยันว่าไม่มีโปรเซสอื่นเป็นเจ้าของเซสชัน

## ข้อจำกัด

- **500 อักขระ** ต่อข้อความ (แบ่งอัตโนมัติตามขอบเขตคำ)
- Markdown จะถูกลบออกก่อนแบ่งข้อความ
- ไม่มีการจำกัดอัตราเพิ่มเติม (ใช้ rate limit ที่มากับ Twitch)

## ที่เกี่ยวข้อง

- [ภาพรวมของช่องทาง](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และขั้นตอนการจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการกำหนดให้ต้องมีการ mention
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแรง
