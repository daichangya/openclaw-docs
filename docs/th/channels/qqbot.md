---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ QQ
    - คุณต้องตั้งค่าข้อมูลรับรองของ QQ Bot
    - คุณต้องการการรองรับแชตกลุ่มหรือแชตส่วนตัวของ QQ Bot
summary: การตั้งค่า คอนฟิก และการใช้งาน QQ Bot
title: QQ Bot
x-i18n:
    generated_at: "2026-04-23T05:27:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot เชื่อมต่อกับ OpenClaw ผ่าน QQ Bot API อย่างเป็นทางการ (WebSocket gateway) Plugin นี้รองรับแชตส่วนตัวแบบ C2C, @messages ในกลุ่ม และข้อความใน guild channel พร้อมสื่อแบบ rich media (รูปภาพ เสียง วิดีโอ ไฟล์)

สถานะ: Plugin ที่มาพร้อมกันในชุด รองรับข้อความโดยตรง แชตกลุ่ม guild channel และสื่อ ไม่รองรับ reactions และ threads

## Plugin ที่มาพร้อมกันในชุด

OpenClaw รุ่นปัจจุบันรวม QQ Bot มาให้แล้ว ดังนั้น build แบบแพ็กเกจปกติจึงไม่ต้องมีขั้นตอน `openclaw plugins install` แยกต่างหาก

## การตั้งค่า

1. ไปที่ [QQ Open Platform](https://q.qq.com/) และสแกน QR code ด้วย QQ บนโทรศัพท์ของคุณเพื่อลงทะเบียน / เข้าสู่ระบบ
2. คลิก **Create Bot** เพื่อสร้าง QQ bot ใหม่
3. ค้นหา **AppID** และ **AppSecret** ในหน้าการตั้งค่าของบอต แล้วคัดลอกไว้

> AppSecret จะไม่ถูกจัดเก็บเป็นข้อความล้วน — หากคุณออกจากหน้านี้โดยไม่บันทึก คุณจะต้องสร้างอันใหม่อีกครั้ง

4. เพิ่มช่อง:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. รีสตาร์ต Gateway

เส้นทางการตั้งค่าแบบโต้ตอบ:

```bash
openclaw channels add
openclaw configure --section channels
```

## กำหนดค่า

คอนฟิกขั้นต่ำ:

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

ตัวแปรสภาพแวดล้อมสำหรับบัญชีค่าเริ่มต้น:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret แบบอ่านจากไฟล์:

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

- การ fallback จาก env ใช้กับบัญชี QQ Bot ค่าเริ่มต้นเท่านั้น
- `openclaw channels add --channel qqbot --token-file ...` จะส่ง AppSecret ให้เท่านั้น; ต้องตั้ง AppID ไว้ล่วงหน้าในคอนฟิกหรือใน `QQBOT_APP_ID`
- `clientSecret` ยังรองรับอินพุตแบบ SecretRef ไม่ใช่แค่สตริงข้อความล้วน

### การตั้งค่าแบบหลายบัญชี

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

แต่ละบัญชีจะเปิดการเชื่อมต่อ WebSocket ของตัวเองและดูแล token cache ที่เป็นอิสระต่อกัน (แยกตาม `appId`)

เพิ่มบอตตัวที่สองผ่าน CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### เสียง (STT / TTS)

รองรับ STT และ TTS แบบกำหนดค่าได้สองระดับพร้อมการ fallback ตามลำดับความสำคัญ:

| การตั้งค่า | เฉพาะ Plugin         | fallback ของเฟรมเวิร์ก       |
| ---------- | -------------------- | ----------------------------- |
| STT        | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts` | `messages.tts`                |

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

ตั้ง `enabled: false` ในรายการใดรายการหนึ่งเพื่อปิดใช้งาน

พฤติกรรมการอัปโหลด/แปลงรหัสเสียงขาออกยังสามารถปรับได้ด้วย `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## รูปแบบเป้าหมาย

| รูปแบบ                     | คำอธิบาย            |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | แชตส่วนตัว (C2C)    |
| `qqbot:group:GROUP_OPENID` | แชตกลุ่ม            |
| `qqbot:channel:CHANNEL_ID` | Guild channel       |

> แต่ละบอตมีชุด OpenID ของผู้ใช้เป็นของตัวเอง OpenID ที่ได้รับโดย Bot A **ไม่สามารถ** ใช้ส่งข้อความผ่าน Bot B ได้

## Slash commands

คำสั่งในตัวที่ถูกดักไว้ก่อนเข้าคิว AI:

| คำสั่ง         | คำอธิบาย                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `/bot-ping`     | ทดสอบ latency                                                                                    |
| `/bot-version`  | แสดงเวอร์ชันของเฟรมเวิร์ก OpenClaw                                                               |
| `/bot-help`     | แสดงรายการคำสั่งทั้งหมด                                                                          |
| `/bot-upgrade`  | แสดงลิงก์คู่มืออัปเกรด QQBot                                                                     |
| `/bot-logs`     | ส่งออกบันทึก gateway ล่าสุดเป็นไฟล์                                                               |
| `/bot-approve`  | อนุมัติการกระทำของ QQ Bot ที่กำลังรออยู่ (เช่น การยืนยันการอัปโหลด C2C หรือกลุ่ม) ผ่านโฟลว์แบบเนทีฟ |

เติม `?` ต่อท้ายคำสั่งใดก็ได้เพื่อดูวิธีใช้งาน (เช่น `/bot-upgrade ?`)

## สถาปัตยกรรมของเอนจิน

QQ Bot มาพร้อมเอนจินแบบครบชุดในตัว Plugin:

- แต่ละบัญชีเป็นเจ้าของสแตกทรัพยากรที่แยกจากกัน (การเชื่อมต่อ WebSocket, API client, token cache, รากที่เก็บสื่อ) โดยอิงตาม `appId` บัญชีจะไม่มีการใช้สถานะขาเข้า/ขาออกร่วมกัน
- ตัวบันทึกสำหรับหลายบัญชีจะติดแท็กบรรทัดบันทึกด้วยบัญชีเจ้าของ เพื่อให้การวินิจฉัยแยกจากกันได้เมื่อคุณรันหลายบอตภายใต้ gateway เดียว
- เส้นทางขาเข้า ขาออก และ gateway bridge ใช้ราก payload ของสื่อร่วมกันเพียงจุดเดียวภายใต้ `~/.openclaw/media` ดังนั้นการอัปโหลด ดาวน์โหลด และแคชการแปลงรหัสจะอยู่ในไดเรกทอรีที่มีการป้องกันเดียวกัน แทนที่จะกระจายอยู่ตาม tree ของแต่ละ subsystem
- ข้อมูลรับรองสามารถสำรองและกู้คืนได้เป็นส่วนหนึ่งของสแนปช็อตข้อมูลรับรองมาตรฐานของ OpenClaw; เมื่อกู้คืนแล้ว เอนจินจะเชื่อมสแตกทรัพยากรของแต่ละบัญชีกลับมาใหม่โดยไม่ต้องจับคู่ผ่าน QR code ใหม่

## การเริ่มต้นใช้งานด้วย QR code

นอกจากการวาง `AppID:AppSecret` ด้วยตนเองแล้ว เอนจินยังรองรับโฟลว์การเริ่มต้นใช้งานด้วย QR code สำหรับเชื่อม QQ Bot เข้ากับ OpenClaw:

1. รันเส้นทางการตั้งค่า QQ Bot (เช่น `openclaw channels add --channel qqbot`) และเลือกโฟลว์ QR code เมื่อมีการถาม
2. สแกน QR code ที่สร้างขึ้นด้วยแอปบนโทรศัพท์ที่ผูกกับ QQ Bot เป้าหมาย
3. อนุมัติการจับคู่บนโทรศัพท์ OpenClaw จะบันทึกข้อมูลรับรองที่ส่งกลับมาไว้ใน `credentials/` ภายใต้ขอบเขตบัญชีที่ถูกต้อง

พรอมป์การอนุมัติที่สร้างโดยบอตเอง (เช่น โฟลว์ "อนุญาตการกระทำนี้หรือไม่?" ที่เปิดเผยผ่าน QQ Bot API) จะแสดงเป็นพรอมป์แบบเนทีฟของ OpenClaw ซึ่งคุณสามารถยอมรับได้ด้วย `/bot-approve` แทนการตอบผ่านไคลเอนต์ QQ ดิบโดยตรง

## การแก้ไขปัญหา

- **บอตตอบว่า "gone to Mars":** ยังไม่ได้กำหนดค่าข้อมูลรับรอง หรือยังไม่ได้เริ่ม Gateway
- **ไม่มีข้อความขาเข้า:** ตรวจสอบว่า `appId` และ `clientSecret` ถูกต้อง และบอตถูกเปิดใช้งานบน QQ Open Platform
- **ตั้งค่าด้วย `--token-file` แล้วยังแสดงว่ายังไม่ได้กำหนดค่า:** `--token-file` จะตั้งค่า AppSecret เท่านั้น คุณยังต้องมี `appId` ในคอนฟิกหรือใน `QQBOT_APP_ID`
- **ข้อความเชิงรุกไม่ถูกส่งถึง:** QQ อาจดักข้อความที่บอตเริ่มส่งเอง หากผู้ใช้ไม่ได้โต้ตอบมาระยะหนึ่ง
- **เสียงไม่ถูกถอดความ:** ตรวจสอบว่าได้กำหนดค่า STT แล้ว และสามารถเข้าถึง provider ได้
