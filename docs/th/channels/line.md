---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องการตั้งค่า Webhook และข้อมูลรับรองของ LINE
    - คุณต้องการตัวเลือกข้อความเฉพาะของ LINE
summary: การตั้งค่า config และการใช้งาน plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-23T05:26:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API โดย plugin จะทำงานเป็นตัวรับ Webhook บน Gateway และใช้ channel access token กับ channel secret ของคุณสำหรับการยืนยันตัวตน

สถานะ: plugin ที่มาพร้อมระบบ รองรับข้อความส่วนตัว แชตกลุ่ม สื่อ ตำแหน่งที่ตั้ง Flex message, template message และ quick reply ไม่รองรับ reaction และเธรด

## plugin ที่มาพร้อมระบบ

LINE มาพร้อมเป็น plugin ที่รวมอยู่ใน OpenClaw รุ่นปัจจุบัน ดังนั้น build แบบแพ็กเกจตามปกติจึงไม่ต้องติดตั้งแยก

หากคุณใช้ build รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม LINE ให้ติดตั้งด้วยตนเอง:

```bash
openclaw plugins install @openclaw/line
```

Local checkout (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## การตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider แล้วเพิ่มแชนเนล **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่าของแชนเนล
4. เปิดใช้ **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า URL ของ Webhook ให้เป็น endpoint ของ Gateway ของคุณ (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway จะตอบสนองต่อการยืนยัน Webhook ของ LINE (GET) และเหตุการณ์ขาเข้า (POST)
หากคุณต้องการพาธแบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ
`channels.line.accounts.<id>.webhookPath` และอัปเดต URL ให้สอดคล้องกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็นของ LINE ขึ้นกับเนื้อหา body (HMAC บน raw body) ดังนั้น OpenClaw จึงใช้ขีดจำกัดขนาด body ก่อนยืนยันตัวตนและ timeout แบบเข้มงวดก่อนการตรวจสอบ
- OpenClaw ประมวลผลเหตุการณ์ Webhook จากไบต์คำขอ raw ที่ผ่านการตรวจสอบแล้ว โดยจะไม่สนใจค่า `req.body` ที่ถูกแปลงโดย middleware ต้นทางเพื่อความปลอดภัยด้านความถูกต้องของลายเซ็น

## การกำหนดค่า

config ขั้นต่ำ:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

ตัวแปร env (เฉพาะบัญชีเริ่มต้น):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

ไฟล์ token/secret:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` และ `secretFile` ต้องชี้ไปยังไฟล์ปกติ จะไม่ยอมรับ symlink

หลายบัญชี:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## การควบคุมการเข้าถึง

ข้อความส่วนตัวใช้ pairing เป็นค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing และ
ข้อความของพวกเขาจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

allowlist และนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user ID ที่อยู่ใน allowlist สำหรับ DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user ID ที่อยู่ใน allowlist สำหรับกลุ่ม
- การแทนที่รายกลุ่ม: `channels.line.groups.<groupId>.allowFrom`
- หมายเหตุด้าน runtime: หากไม่มี `channels.line` เลย runtime จะ fallback เป็น `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่ม (แม้ว่าจะมีการตั้งค่า `channels.defaults.groupPolicy` ก็ตาม)

LINE ID แยกตัวพิมพ์เล็ก-ใหญ่ รูปแบบ ID ที่ถูกต้องมีลักษณะดังนี้:

- ผู้ใช้: `U` + อักขระฐานสิบหก 32 ตัว
- กลุ่ม: `C` + อักขระฐานสิบหก 32 ตัว
- ห้อง: `R` + อักขระฐานสิบหก 32 ตัว

## พฤติกรรมของข้อความ

- ข้อความจะถูกแบ่งชังก์ที่ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกตัดออก ส่วน code block และตารางจะถูกแปลงเป็น Flex card เมื่อเป็นไปได้
- การตอบกลับแบบสตรีมจะถูกบัฟเฟอร์ไว้ LINE จะได้รับชังก์เต็มพร้อมแอนิเมชันการโหลดระหว่างที่เอเจนต์กำลังทำงาน
- การดาวน์โหลดสื่อถูกจำกัดโดย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)

## ข้อมูลแชนเนล (ข้อความแบบ rich)

ใช้ `channelData.line` เพื่อส่ง quick reply, ตำแหน่งที่ตั้ง, Flex card หรือ template message

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

plugin LINE ยังมีคำสั่ง `/card` สำหรับ preset ของ Flex message:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับ ACP (Agent Communication Protocol) bindings ของการสนทนา:

- `/acp spawn <agent> --bind here` จะ bind แชต LINE ปัจจุบันเข้ากับเซสชัน ACP โดยไม่สร้าง child thread
- ACP bindings ที่กำหนดค่าไว้และเซสชัน ACP ที่ bind กับการสนทนาซึ่งกำลังใช้งานอยู่ ทำงานบน LINE เช่นเดียวกับแชนเนลการสนทนาอื่น

ดู [ACP agents](/th/tools/acp-agents) สำหรับรายละเอียด

## สื่อขาออก

plugin LINE รองรับการส่งไฟล์รูปภาพ วิดีโอ และเสียงผ่านเครื่องมือข้อความของเอเจนต์ โดยสื่อจะถูกส่งผ่านเส้นทางการส่งแบบเฉพาะของ LINE พร้อมการจัดการ preview และการติดตามที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพของ LINE พร้อมการสร้าง preview อัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการ preview และ content-type แบบชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียงของ LINE

URL สื่อขาออกต้องเป็น URL HTTPS แบบสาธารณะ OpenClaw จะตรวจสอบ hostname เป้าหมายก่อนส่ง URL ให้ LINE และจะปฏิเสธเป้าหมายแบบ loopback, link-local และเครือข่ายส่วนตัว

การส่งสื่อแบบทั่วไปจะ fallback ไปยังเส้นทางเดิมที่รองรับเฉพาะรูปภาพเมื่อไม่มีเส้นทางเฉพาะสำหรับ LINE

## การแก้ไขปัญหา

- **การยืนยัน Webhook ล้มเหลว:** ตรวจสอบให้แน่ใจว่า URL ของ Webhook เป็น HTTPS และ
  `channelSecret` ตรงกับใน LINE console
- **ไม่มีเหตุการณ์ขาเข้า:** ยืนยันว่าพาธ Webhook ตรงกับ `channels.line.webhookPath`
  และ Gateway สามารถเข้าถึงได้จาก LINE
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่มค่า `channels.line.mediaMaxMb` หากสื่อมีขนาดเกิน
  ขีดจำกัดเริ่มต้น

## ที่เกี่ยวข้อง

- [ภาพรวมแชนเนล](/th/channels) — แชนเนลที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตนผ่าน DM และโฟลว์ pairing
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการควบคุมด้วยการ mention
- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่งด้านความปลอดภัย
