---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ QQ
    - คุณต้องตั้งค่าข้อมูลรับรองของ QQ Bot
    - คุณต้องการการรองรับแชตกลุ่มหรือแชตส่วนตัวของ QQ Bot
summary: การตั้งค่า config และการใช้งาน QQ Bot
title: QQ bot
x-i18n:
    generated_at: "2026-04-24T08:59:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8127ec59d3a17222e7fe883e77aa1c7d384b231b7d479385421df51c995f7dc2
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot เชื่อมต่อกับ OpenClaw ผ่าน QQ Bot API อย่างเป็นทางการ (WebSocket Gateway) Plugin นี้รองรับแชตส่วนตัวแบบ C2C, group @messages และข้อความใน guild channel พร้อมสื่อแบบริช (รูปภาพ เสียง วิดีโอ ไฟล์)

สถานะ: Plugin ที่มาพร้อมในชุด รองรับข้อความโดยตรง แชตกลุ่ม guild channel และสื่อ ไม่รองรับการรีแอ็กชันและเธรด

## Plugin ที่มาพร้อมในชุด

OpenClaw รุ่นปัจจุบันรวม QQ Bot มาให้แล้ว ดังนั้นบิลด์แบบแพ็กเกจปกติไม่จำเป็นต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก

## การตั้งค่า

1. ไปที่ [QQ Open Platform](https://q.qq.com/) แล้วสแกน QR code ด้วยแอป QQ บนโทรศัพท์ของคุณเพื่อลงทะเบียน / เข้าสู่ระบบ
2. คลิก **Create Bot** เพื่อสร้าง QQ bot ใหม่
3. ค้นหา **AppID** และ **AppSecret** ในหน้าการตั้งค่าของบอต แล้วคัดลอกไว้

> AppSecret จะไม่ถูกเก็บเป็นข้อความล้วน — หากคุณออกจากหน้านี้โดยไม่บันทึก คุณจะต้องสร้างอันใหม่อีกครั้ง

4. เพิ่มช่องทาง:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. รีสตาร์ต Gateway

เส้นทางการตั้งค่าแบบโต้ตอบ:

```bash
openclaw channels add
openclaw configure --section channels
```

## การกำหนดค่า

config ขั้นต่ำ:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

ตัวแปรสภาพแวดล้อมของบัญชีค่าเริ่มต้น:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret แบบอิงไฟล์:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

หมายเหตุ:

- env fallback ใช้กับบัญชี QQ Bot ค่าเริ่มต้นเท่านั้น
- `openclaw channels add --channel qqbot --token-file ...` ให้เฉพาะ AppSecret เท่านั้น; AppID ต้องถูกตั้งไว้แล้วใน config หรือ `QQBOT_APP_ID`
- `clientSecret` รองรับอินพุตแบบ SecretRef ได้เช่นกัน ไม่ได้จำกัดเฉพาะสตริงข้อความล้วน

### การตั้งค่าหลายบัญชี

รัน QQ bot หลายตัวภายใต้ OpenClaw อินสแตนซ์เดียว:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

แต่ละบัญชีจะเปิดการเชื่อมต่อ WebSocket ของตัวเองและดูแล token cache แบบอิสระ (แยกตาม `appId`)

เพิ่มบอตตัวที่สองผ่าน CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### เสียง (STT / TTS)

การรองรับ STT และ TTS ใช้การกำหนดค่า 2 ระดับพร้อมลำดับความสำคัญแบบ fallback:

| การตั้งค่า | เฉพาะ Plugin | fallback ของเฟรมเวิร์ก |
| ------- | -------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

ตั้ง `enabled: false` ในส่วนใดส่วนหนึ่งเพื่อปิดใช้งาน

พฤติกรรมการอัปโหลด/แปลงเสียงขาออกสามารถปรับได้ด้วย `channels.qqbot.audioFormatPolicy` เช่นกัน:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## รูปแบบเป้าหมาย

| รูปแบบ | คำอธิบาย |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | แชตส่วนตัว (C2C) |
| `qqbot:group:GROUP_OPENID` | แชตกลุ่ม |
| `qqbot:channel:CHANNEL_ID` | Guild channel |

> แต่ละบอตมีชุด OpenID ของผู้ใช้เป็นของตัวเอง OpenID ที่ได้รับโดย Bot A **ไม่สามารถ** ใช้ส่งข้อความผ่าน Bot B ได้

## คำสั่ง Slash

คำสั่งในตัวที่ถูกดักจับก่อนเข้าคิว AI:

| คำสั่ง | คำอธิบาย |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | ทดสอบ latency |
| `/bot-version` | แสดงเวอร์ชันของเฟรมเวิร์ก OpenClaw |
| `/bot-help`    | แสดงรายการคำสั่งทั้งหมด |
| `/bot-upgrade` | แสดงลิงก์คู่มืออัปเกรด QQBot |
| `/bot-logs`    | ส่งออกบันทึก Gateway ล่าสุดเป็นไฟล์ |
| `/bot-approve` | อนุมัติการดำเนินการ QQ Bot ที่กำลังรออยู่ (เช่น การยืนยันการอัปโหลดแบบ C2C หรือกลุ่ม) ผ่านโฟลว์แบบเนทีฟ |

เติม `?` ต่อท้ายคำสั่งใดก็ได้เพื่อดูวิธีใช้ (เช่น `/bot-upgrade ?`)

## สถาปัตยกรรมเอนจิน

QQ Bot มาพร้อมเอนจินแบบครบชุดในตัว Plugin:

- แต่ละบัญชีเป็นเจ้าของสแตกทรัพยากรแบบแยกอิสระ (การเชื่อมต่อ WebSocket, API client, token cache, รากจัดเก็บสื่อ) ที่คีย์ด้วย `appId` บัญชีจะไม่แชร์สถานะขาเข้าหรือขาออกกัน
- logger สำหรับหลายบัญชีจะติดแท็กบรรทัดบันทึกด้วยบัญชีเจ้าของ เพื่อให้การวินิจฉัยแยกจากกันได้เมื่อคุณรันหลายบอตภายใต้ Gateway เดียว
- เส้นทางขาเข้า ขาออก และ gateway bridge ใช้ media payload root เดียวภายใต้ `~/.openclaw/media` ดังนั้นการอัปโหลด ดาวน์โหลด และ transcode cache จะลงในไดเรกทอรีที่มีการป้องกันเพียงแห่งเดียว แทนที่จะเป็นโครงสร้างแยกตามซับซิสเต็ม
- ข้อมูลรับรองสามารถสำรองและกู้คืนได้เป็นส่วนหนึ่งของ snapshot ข้อมูลรับรองมาตรฐานของ OpenClaw; เอนจินจะเชื่อมสแตกทรัพยากรของแต่ละบัญชีกลับมาใหม่เมื่อกู้คืน โดยไม่ต้องจับคู่ QR code ใหม่

## การเริ่มต้นใช้งานด้วย QR code

นอกจากการวาง `AppID:AppSecret` ด้วยตนเองแล้ว เอนจินยังรองรับโฟลว์เริ่มต้นด้วย QR code เพื่อเชื่อม QQ Bot เข้ากับ OpenClaw:

1. รันเส้นทางการตั้งค่า QQ Bot (เช่น `openclaw channels add --channel qqbot`) แล้วเลือกโฟลว์ QR code เมื่อระบบถาม
2. สแกน QR code ที่สร้างขึ้นด้วยแอปบนโทรศัพท์ที่ผูกกับ QQ Bot เป้าหมาย
3. อนุมัติการจับคู่บนโทรศัพท์ OpenClaw จะบันทึกข้อมูลรับรองที่ได้รับลงใน `credentials/` ภายใต้ขอบเขตบัญชีที่ถูกต้อง

พรอมป์การอนุมัติที่สร้างโดยตัวบอตเอง (เช่น โฟลว์ “allow this action?” ที่เปิดเผยผ่าน QQ Bot API) จะแสดงเป็นพรอมป์แบบเนทีฟของ OpenClaw ซึ่งคุณสามารถยอมรับได้ด้วย `/bot-approve` แทนการตอบผ่านไคลเอนต์ QQ โดยตรง

## การแก้ไขปัญหา

- **บอตตอบว่า "gone to Mars":** ยังไม่ได้กำหนดค่าข้อมูลรับรอง หรือ Gateway ยังไม่เริ่มทำงาน
- **ไม่มีข้อความขาเข้า:** ตรวจสอบว่า `appId` และ `clientSecret` ถูกต้อง และบอตถูกเปิดใช้งานบน QQ Open Platform
- **ตั้งค่าด้วย `--token-file` แล้วยังแสดงว่าไม่ได้กำหนดค่า:** `--token-file` ตั้งค่าเฉพาะ AppSecret คุณยังต้องมี `appId` ใน config หรือ `QQBOT_APP_ID`
- **ข้อความเชิงรุกส่งไม่ถึง:** QQ อาจดักข้อความที่บอตเริ่มส่งเอง หากผู้ใช้ไม่ได้โต้ตอบเมื่อไม่นานมานี้
- **เสียงไม่ถูกถอดความ:** ตรวจสอบให้แน่ใจว่าได้กำหนดค่า STT แล้ว และผู้ให้บริการสามารถเข้าถึงได้

## ที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Groups](/th/channels/groups)
- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
