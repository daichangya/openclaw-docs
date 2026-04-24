---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ LINE
    - คุณต้องตั้งค่า Webhook และข้อมูลรับรองของ LINE
    - คุณต้องการตัวเลือกข้อความเฉพาะของ LINE
summary: การตั้งค่า config และการใช้งาน Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-24T08:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE เชื่อมต่อกับ OpenClaw ผ่าน LINE Messaging API Plugin จะทำงานเป็นตัวรับ Webhook บน Gateway และใช้ channel access token กับ channel secret ของคุณสำหรับการยืนยันตัวตน

สถานะ: Plugin ที่มาพร้อมในชุด รองรับข้อความโดยตรง แชตกลุ่ม สื่อ ตำแหน่ง ข้อความ Flex ข้อความเทมเพลต และการตอบกลับด่วน ไม่รองรับการรีแอ็กชันและเธรด

## Plugin ที่มาพร้อมในชุด

LINE มาพร้อมเป็น Plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติไม่จำเป็นต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม LINE ให้ติดตั้งด้วยตนเอง:

```bash
openclaw plugins install @openclaw/line
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## การตั้งค่า

1. สร้างบัญชี LINE Developers และเปิด Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. สร้าง (หรือเลือก) Provider แล้วเพิ่มช่องทาง **Messaging API**
3. คัดลอก **Channel access token** และ **Channel secret** จากการตั้งค่าช่องทาง
4. เปิดใช้งาน **Use webhook** ในการตั้งค่า Messaging API
5. ตั้งค่า URL ของ Webhook เป็น endpoint ของ Gateway ของคุณ (ต้องใช้ HTTPS):

```
https://gateway-host/line/webhook
```

Gateway จะตอบสนองต่อการตรวจสอบ Webhook ของ LINE (GET) และเหตุการณ์ขาเข้า (POST) หากคุณต้องการพาธแบบกำหนดเอง ให้ตั้งค่า `channels.line.webhookPath` หรือ `channels.line.accounts.<id>.webhookPath` และอัปเดต URL ให้ตรงกัน

หมายเหตุด้านความปลอดภัย:

- การตรวจสอบลายเซ็นของ LINE ขึ้นอยู่กับ body (HMAC บน raw body) ดังนั้น OpenClaw จึงบังคับใช้ขีดจำกัดขนาด body ก่อนการยืนยันตัวตนและ timeout อย่างเข้มงวดก่อนการตรวจสอบ
- OpenClaw ประมวลผลเหตุการณ์ Webhook จากไบต์คำขอแบบดิบที่ผ่านการตรวจสอบแล้ว ค่า `req.body` ที่ถูกแปลงโดย middleware ต้นทางจะถูกเพิกเฉยเพื่อความปลอดภัยด้านความสมบูรณ์ของลายเซ็น

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

ตัวแปรสภาพแวดล้อม (บัญชีค่าเริ่มต้นเท่านั้น):

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

`tokenFile` และ `secretFile` ต้องชี้ไปยังไฟล์ปกติ Symlink จะถูกปฏิเสธ

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

ข้อความโดยตรงใช้ pairing เป็นค่าเริ่มต้น ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing และข้อความของพวกเขาจะถูกเพิกเฉยจนกว่าจะได้รับการอนุมัติ

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

allowlist และนโยบาย:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user ID ที่อยู่ใน allowlist สำหรับ DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user ID ที่อยู่ใน allowlist สำหรับกลุ่ม
- override รายกลุ่ม: `channels.line.groups.<groupId>.allowFrom`
- หมายเหตุขณะรัน: หากไม่มี `channels.line` เลย ขณะรันจะใช้ `groupPolicy="allowlist"` สำหรับการตรวจสอบกลุ่มเป็นค่าทดแทน (แม้จะตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม)

LINE ID แยกตัวพิมพ์เล็ก-ใหญ่ ID ที่ถูกต้องมีลักษณะดังนี้:

- ผู้ใช้: `U` + อักขระฐานสิบหก 32 ตัว
- กลุ่ม: `C` + อักขระฐานสิบหก 32 ตัว
- ห้อง: `R` + อักขระฐานสิบหก 32 ตัว

## พฤติกรรมข้อความ

- ข้อความจะถูกแบ่งเป็นช่วง ๆ ที่ 5000 อักขระ
- การจัดรูปแบบ Markdown จะถูกลบออก; บล็อกโค้ดและตารางจะถูกแปลงเป็นการ์ด Flex เมื่อเป็นไปได้
- การตอบกลับแบบสตรีมจะถูกบัฟเฟอร์; LINE จะได้รับช่วงข้อความเต็มพร้อมแอนิเมชันการโหลดขณะที่เอเจนต์กำลังทำงาน
- การดาวน์โหลดสื่อถูกจำกัดด้วย `channels.line.mediaMaxMb` (ค่าเริ่มต้น 10)

## ข้อมูลช่องทาง (ข้อความแบบริช)

ใช้ `channelData.line` เพื่อส่ง quick replies, ตำแหน่ง, การ์ด Flex หรือข้อความเทมเพลต

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

LINE Plugin ยังมาพร้อมกับคำสั่ง `/card` สำหรับชุดสำเร็จรูปของข้อความ Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## การรองรับ ACP

LINE รองรับการผูกการสนทนา ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` จะผูกแชต LINE ปัจจุบันเข้ากับเซสชัน ACP โดยไม่สร้างเธรดย่อย
- การผูก ACP ที่กำหนดค่าไว้และเซสชัน ACP ที่ผูกกับการสนทนาซึ่งกำลังใช้งานอยู่ทำงานบน LINE เช่นเดียวกับช่องทางการสนทนาอื่น ๆ

ดูรายละเอียดได้ที่ [เอเจนต์ ACP](/th/tools/acp-agents)

## สื่อขาออก

LINE Plugin รองรับการส่งไฟล์รูปภาพ วิดีโอ และเสียงผ่านเครื่องมือข้อความของเอเจนต์ สื่อจะถูกส่งผ่านเส้นทางการส่งเฉพาะของ LINE พร้อมการจัดการพรีวิวและการติดตามที่เหมาะสม:

- **รูปภาพ**: ส่งเป็นข้อความรูปภาพของ LINE พร้อมการสร้างพรีวิวอัตโนมัติ
- **วิดีโอ**: ส่งพร้อมการจัดการพรีวิวและ content-type อย่างชัดเจน
- **เสียง**: ส่งเป็นข้อความเสียงของ LINE

URL สื่อขาออกต้องเป็น URL HTTPS สาธารณะ OpenClaw จะตรวจสอบ hostname เป้าหมายก่อนส่ง URL ให้ LINE และจะปฏิเสธเป้าหมายที่เป็น local loopback, link-local และเครือข่ายส่วนตัว

การส่งสื่อแบบทั่วไปจะย้อนกลับไปใช้เส้นทางเดิมที่รองรับเฉพาะรูปภาพเมื่อไม่มีเส้นทางเฉพาะของ LINE ให้ใช้

## การแก้ไขปัญหา

- **การตรวจสอบ Webhook ล้มเหลว:** ตรวจสอบให้แน่ใจว่า URL ของ Webhook เป็น HTTPS และ `channelSecret` ตรงกับใน LINE console
- **ไม่มีเหตุการณ์ขาเข้า:** ยืนยันว่าพาธของ Webhook ตรงกับ `channels.line.webhookPath` และ Gateway สามารถเข้าถึงได้จาก LINE
- **ข้อผิดพลาดในการดาวน์โหลดสื่อ:** เพิ่ม `channels.line.mediaMaxMb` หากสื่อมีขนาดเกินขีดจำกัดค่าเริ่มต้น

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกำหนดการทริกเกอร์ด้วยการกล่าวถึง
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแรงขึ้น
