---
read_when:
    - กำลังทำงานเกี่ยวกับพฤติกรรมของ WhatsApp/เว็บหรือการกำหนดเส้นทางกล่องข้อความเข้า
summary: การรองรับช่องทาง WhatsApp การควบคุมการเข้าถึง พฤติกรรมการจัดส่ง และการปฏิบัติการ
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T09:00:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

สถานะ: พร้อมใช้งานระดับ production ผ่าน WhatsApp Web (Baileys) Gateway เป็นผู้ดูแลเซสชันที่ลิงก์ไว้

## ติดตั้ง (เมื่อต้องการ)

- Onboarding (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  จะถามให้ติดตั้ง WhatsApp plugin ในครั้งแรกที่คุณเลือกใช้งาน
- `openclaw channels login --channel whatsapp` ก็มีโฟลว์การติดตั้งให้เช่นกันเมื่อ
  ยังไม่มี plugin
- Dev channel + git checkout: ใช้พาธ plugin ในเครื่องเป็นค่าเริ่มต้น
- Stable/Beta: ใช้แพ็กเกจ npm `@openclaw/whatsapp` เป็นค่าเริ่มต้น

ยังคงติดตั้งด้วยตนเองได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="การจับคู่" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือการจับคู่สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    แนวทางวินิจฉัยและซ่อมแซมข้ามช่องทาง
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างการกำหนดค่าช่องทางแบบเต็ม
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

<Steps>
  <Step title="กำหนดนโยบายการเข้าถึง WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="ลิงก์ WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    สำหรับบัญชีเฉพาะ:

```bash
openclaw channels login --channel whatsapp --account work
```

    หากต้องการแนบไดเรกทอรี auth ของ WhatsApp Web ที่มีอยู่แล้ว/กำหนดเองก่อนเข้าสู่ระบบ:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="เริ่ม gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="อนุมัติคำขอจับคู่ครั้งแรก (หากใช้โหมด pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    คำขอจับคู่จะหมดอายุหลัง 1 ชั่วโมง โดยคำขอที่รอดำเนินการจะถูกจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้ใช้ WhatsApp กับหมายเลขแยกต่างหากเมื่อทำได้ (เมทาดาทาของช่องทางและโฟลว์การตั้งค่าถูกปรับให้เหมาะกับการตั้งค่านี้ แต่ก็ยังรองรับการใช้หมายเลขส่วนตัวเช่นกัน)
</Note>

## รูปแบบการติดตั้งใช้งาน

<AccordionGroup>
  <Accordion title="หมายเลขเฉพาะ (แนะนำ)">
    นี่คือโหมดการปฏิบัติการที่สะอาดที่สุด:

    - ตัวตน WhatsApp แยกต่างหากสำหรับ OpenClaw
    - allowlist ของ DM และขอบเขตการกำหนดเส้นทางชัดเจนกว่า
    - โอกาสเกิดความสับสนจากการแชตกับตัวเองต่ำกว่า

    รูปแบบนโยบายขั้นต่ำ:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ทางเลือกสำรองแบบใช้หมายเลขส่วนตัว">
    Onboarding รองรับโหมดหมายเลขส่วนตัวและจะเขียนค่าพื้นฐานที่เหมาะกับการแชตกับตัวเอง:

    - `dmPolicy: "allowlist"`
    - `allowFrom` มีหมายเลขส่วนตัวของคุณ
    - `selfChatMode: true`

    ในรันไทม์ การป้องกันการแชตกับตัวเองจะอิงจากหมายเลขของตัวเองที่ลิงก์ไว้และ `allowFrom`

  </Accordion>

  <Accordion title="ขอบเขตช่องทางเฉพาะ WhatsApp Web">
    ช่องทางแพลตฟอร์มการส่งข้อความอิงกับ WhatsApp Web (`Baileys`) ในสถาปัตยกรรมช่องทางปัจจุบันของ OpenClaw

    ไม่มีช่องทางส่งข้อความ WhatsApp ผ่าน Twilio แยกต่างหากในรีจิสทรีช่องทางแชตที่มีมาให้ในตัว

  </Accordion>
</AccordionGroup>

## โมเดลรันไทม์

- Gateway เป็นผู้ดูแล WhatsApp socket และลูปเชื่อมต่อใหม่
- การส่งขาออกต้องมีตัวรับฟัง WhatsApp ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย
- ระบบจะละเว้นแชตสถานะและบรอดแคสต์ (`@status`, `@broadcast`)
- แชตส่วนตัวใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` จะรวม DMs เข้าในเซสชันหลักของเอเจนต์)
- เซสชันกลุ่มถูกแยกออก (`agent:<agentId>:whatsapp:group:<jid>`)
- ทรานสปอร์ต WhatsApp Web รองรับตัวแปร environment มาตรฐานสำหรับพร็อกซีบนโฮสต์ gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / รูปแบบตัวพิมพ์เล็ก) แนะนำให้ใช้การกำหนดค่าพร็อกซีระดับโฮสต์แทนการตั้งค่าพร็อกซีเฉพาะ WhatsApp ระดับช่องทาง

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชตส่วนตัว:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `allowFrom` รับหมายเลขรูปแบบ E.164 (ระบบจะทำให้เป็นมาตรฐานภายใน)

    การแทนที่แบบหลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) จะมีลำดับความสำคัญเหนือค่าระดับช่องทางสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมขณะรันไทม์:

    - การจับคู่จะถูกเก็บไว้ใน allow-store ของช่องทางและรวมกับ `allowFrom` ที่กำหนดไว้
    - หากไม่มีการกำหนด allowlist ระบบจะอนุญาตหมายเลขของตัวเองที่ลิงก์ไว้โดยค่าเริ่มต้น
    - OpenClaw จะไม่จับคู่ DMs แบบขาออกที่เป็น `fromMe` โดยอัตโนมัติ (ข้อความที่คุณส่งถึงตัวเองจากอุปกรณ์ที่ลิงก์ไว้)

  </Tab>

  <Tab title="นโยบายกลุ่ม + allowlist">
    การเข้าถึงกลุ่มมี 2 ชั้น:

    1. **allowlist ของการเป็นสมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากไม่ระบุ `groups` ทุกกลุ่มจะมีสิทธิ์
       - หากมี `groups` จะทำหน้าที่เป็น allowlist ของกลุ่ม (`"*"` ใช้ได้)

    2. **นโยบายผู้ส่งในกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ของผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกข้อความขาเข้าจากกลุ่มทั้งหมด

    การ fallback ของ allowlist ผู้ส่ง:

    - หากไม่ได้ตั้งค่า `groupAllowFrom` รันไทม์จะ fallback ไปใช้ `allowFrom` เมื่อมี
    - allowlist ของผู้ส่งจะถูกประเมินก่อนการเปิดใช้งานด้วยการกล่าวถึง/การตอบกลับ

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` เลย การ fallback ของนโยบายกลุ่มในรันไทม์จะเป็น `allowlist` (พร้อม log คำเตือน) แม้ว่าจะตั้งค่า `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="การกล่าวถึง + /activation">
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มต้องมีการกล่าวถึง

    การตรวจจับการกล่าวถึงประกอบด้วย:

    - การกล่าวถึงตัวตนของบอตใน WhatsApp โดยตรง
    - รูปแบบ regex สำหรับการกล่าวถึงที่กำหนดไว้ (`agents.list[].groupChat.mentionPatterns`, fallback เป็น `messages.groupChat.mentionPatterns`)
    - การตรวจจับการตอบกลับถึงบอตโดยปริยาย (ผู้ส่งที่ถูกตอบกลับตรงกับตัวตนของบอต)

    หมายเหตุด้านความปลอดภัย:

    - การ quote/ตอบกลับเพียงแค่ผ่านเงื่อนไขการกั้นด้วยการกล่าวถึงเท่านั้น และ **ไม่ได้** ให้สิทธิ์ผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่อยู่ใน allowlist จะยังคงถูกบล็อกแม้ว่าจะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist ก็ตาม

    คำสั่งเปิดใช้งานระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` จะอัปเดตสถานะของเซสชัน (ไม่ใช่การกำหนดค่าระดับโกลบอล) โดยถูกกั้นให้เฉพาะเจ้าของ

  </Tab>
</Tabs>

## พฤติกรรมของหมายเลขส่วนตัวและการแชตกับตัวเอง

เมื่อหมายเลขของตัวเองที่ลิงก์ไว้มีอยู่ใน `allowFrom` ด้วย กลไกป้องกันการแชตกับตัวเองของ WhatsApp จะทำงาน:

- ข้าม read receipt สำหรับรอบการแชตกับตัวเอง
- ละเว้นพฤติกรรมการทริกเกอร์อัตโนมัติด้วย mention-JID ที่ไม่เช่นนั้นอาจจะ ping ตัวคุณเอง
- หากไม่ได้ตั้งค่า `messages.responsePrefix` คำตอบในการแชตกับตัวเองจะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การทำให้ข้อความเป็นมาตรฐานและบริบท

<AccordionGroup>
  <Accordion title="ซองข้อความขาเข้า + บริบทการตอบกลับ">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อด้วยซองข้อความขาเข้าที่ใช้ร่วมกัน

    หากมีการตอบกลับแบบอ้างอิง บริบทจะถูกต่อท้ายในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมทาดาทาการตอบกลับจะถูกเติมด้วยเมื่อมี (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)

  </Accordion>

  <Accordion title="ตัวยึดสื่อและการดึงข้อมูลตำแหน่ง/รายชื่อผู้ติดต่อ">
    ข้อความขาเข้าที่มีแต่สื่อจะถูกทำให้เป็นมาตรฐานด้วยตัวยึด เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    เนื้อหาตำแหน่งจะใช้ข้อความพิกัดแบบกระชับ ป้ายกำกับ/ความคิดเห็นของตำแหน่ง และรายละเอียดรายชื่อผู้ติดต่อ/vCard จะถูกเรนเดอร์เป็นเมทาดาทาที่ไม่น่าเชื่อถือแบบ fenced ไม่ใช่ข้อความพรอมป์ต์แบบอินไลน์

  </Accordion>

  <Accordion title="การแทรกประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูกบัฟเฟอร์และแทรกเป็นบริบทได้เมื่อบอตถูกทริกเกอร์ในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - การกำหนดค่า: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` คือปิดใช้งาน

    ตัวทำเครื่องหมายการแทรก:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipt">
    Read receipt ถูกเปิดใช้โดยค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่รับแล้ว

    ปิดใช้งานแบบโกลบอล:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    การแทนที่ต่อบัญชี:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    รอบการแชตกับตัวเองจะข้าม read receipt แม้ว่าจะเปิดใช้งานแบบโกลบอลก็ตาม

  </Accordion>
</AccordionGroup>

## การจัดส่ง การแบ่งข้อความ และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งข้อความ">
    - ขีดจำกัดการแบ่งข้อความเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อน จากนั้นจึง fallback ไปใช้การแบ่งข้อความตามความยาวที่ปลอดภัย
  </Accordion>

  <Accordion title="พฤติกรรมสื่อขาออก">
    - รองรับ payload แบบรูปภาพ วิดีโอ เสียง (โน้ตเสียง PTT) และเอกสาร
    - `audio/ogg` จะถูกเขียนใหม่เป็น `audio/ogg; codecs=opus` เพื่อให้เข้ากันได้กับโน้ตเสียง
    - รองรับการเล่น GIF แบบเคลื่อนไหวผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - คำบรรยายจะถูกใช้กับรายการสื่อชิ้นแรกเมื่อส่ง payload การตอบกลับแบบหลายสื่อ
    - แหล่งสื่ออาจเป็น HTTP(S), `file://` หรือพาธในเครื่อง

  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรม fallback">
    - ขีดจำกัดการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - ขีดจำกัดการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การแทนที่ต่อบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับแต่งอัตโนมัติ (ปรับขนาด/ไล่ระดับคุณภาพ) เพื่อให้พอดีกับข้อจำกัด
    - เมื่อการส่งสื่อล้มเหลว fallback ของรายการแรกจะส่งข้อความเตือนแทนการทิ้งคำตอบแบบเงียบ ๆ
  </Accordion>
</AccordionGroup>

## การ quote การตอบกลับ

WhatsApp รองรับการ quote การตอบกลับแบบเนทีฟ โดยคำตอบขาออกจะอ้างอิงข้อความขาเข้าอย่างชัดเจน ควบคุมได้ด้วย `channels.whatsapp.replyToMode`

| Value    | Behavior                                                                 |
| -------- | ------------------------------------------------------------------------ |
| `"auto"` | quote ข้อความขาเข้าเมื่อผู้ให้บริการรองรับ และข้ามการ quote ในกรณีอื่น |
| `"on"`   | quote ข้อความขาเข้าเสมอ และ fallback เป็นการส่งข้อความปกติหากการ quote ถูกปฏิเสธ |
| `"off"`  | ไม่ quote เลย; ส่งเป็นข้อความปกติ                                      |

ค่าเริ่มต้นคือ `"auto"` การแทนที่ต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.replyToMode`

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## ระดับ Reaction

`channels.whatsapp.reactionLevel` ควบคุมว่าเอเจนต์จะใช้ emoji reaction บน WhatsApp อย่างกว้างเพียงใด:

| Level         | Ack reactions | Agent-initiated reactions | Description                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | ไม่มี         | ไม่มี                     | ไม่มี reactions เลย                              |
| `"ack"`       | มี            | ไม่มี                     | มีเฉพาะ ack reactions (ยืนยันรับก่อนตอบกลับ)     |
| `"minimal"`   | มี            | มี (แบบระมัดระวัง)        | Ack + agent reactions พร้อมแนวทางแบบระมัดระวัง   |
| `"extensive"` | มี            | มี (แบบส่งเสริม)          | Ack + agent reactions พร้อมแนวทางแบบส่งเสริม     |

ค่าเริ่มต้น: `"minimal"`

การแทนที่ต่อบัญชีใช้ `channels.whatsapp.accounts.<id>.reactionLevel`

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Ack reaction

WhatsApp รองรับ ack reaction ทันทีเมื่อรับข้อความขาเข้าผ่าน `channels.whatsapp.ackReaction`
Ack reaction จะถูกควบคุมโดย `reactionLevel` — จะถูกระงับเมื่อ `reactionLevel` เป็น `"off"`

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

หมายเหตุด้านพฤติกรรม:

- ส่งทันทีหลังจากรับข้อความขาเข้าแล้ว (ก่อนตอบกลับ)
- หากล้มเหลวจะมีการบันทึก log แต่จะไม่บล็อกการส่งคำตอบปกติ
- โหมดกลุ่ม `mentions` จะ react ในรอบที่ถูกทริกเกอร์ด้วยการกล่าวถึง; การเปิดใช้งานกลุ่มแบบ `always` จะทำหน้าที่ข้ามการตรวจสอบนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (`messages.ackReaction` แบบเดิมไม่ถูกใช้ที่นี่)

## หลายบัญชีและข้อมูลรับรอง

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - account id มาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: `default` หากมี มิฉะนั้นใช้ account id ตัวแรกที่กำหนดไว้ (เรียงลำดับแล้ว)
    - account id จะถูกทำให้เป็นมาตรฐานภายในสำหรับการค้นหา
  </Accordion>

  <Accordion title="พาธข้อมูลรับรองและความเข้ากันได้กับระบบเดิม">
    - พาธ auth ปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - auth แบบเดิมสำหรับบัญชีเริ่มต้นใน `~/.openclaw/credentials/` ยังถูกจดจำ/ย้ายข้อมูลได้สำหรับโฟลว์บัญชีเริ่มต้น
  </Accordion>

  <Accordion title="พฤติกรรมการออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` จะล้างสถานะ auth ของ WhatsApp สำหรับบัญชีนั้น

    ในไดเรกทอรี auth แบบเดิม `oauth.json` จะถูกเก็บไว้ ในขณะที่ไฟล์ auth ของ Baileys จะถูกลบออก

  </Accordion>
</AccordionGroup>

## เครื่องมือ การกระทำ และการเขียนการกำหนดค่า

- การรองรับเครื่องมือของเอเจนต์รวมถึงการกระทำ reaction ของ WhatsApp (`react`)
- การกั้นการกระทำ:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนการกำหนดค่าที่เริ่มจากช่องทางถูกเปิดใช้โดยค่าเริ่มต้น (ปิดได้ผ่าน `channels.whatsapp.configWrites=false`)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ยังไม่ได้ลิงก์ (ต้องใช้ QR)">
    อาการ: สถานะช่องทางรายงานว่ายังไม่ได้ลิงก์

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="ลิงก์แล้วแต่ตัดการเชื่อมต่อ / วนเชื่อมต่อใหม่">
    อาการ: บัญชีลิงก์แล้วแต่ตัดการเชื่อมต่อซ้ำ ๆ หรือพยายามเชื่อมต่อใหม่ซ้ำ ๆ

    วิธีแก้:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    หากจำเป็น ให้ลิงก์ใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="ไม่มีตัวรับฟังที่ใช้งานอยู่ขณะส่ง">
    การส่งขาออกจะล้มเหลวทันทีเมื่อไม่มีตัวรับฟัง gateway ที่ทำงานอยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า gateway กำลังทำงานและบัญชีนั้นถูกลิงก์แล้ว

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกเพิกเฉยโดยไม่คาดคิด">
    ตรวจสอบตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ใน `groups`
    - การกั้นด้วยการกล่าวถึง (`requireMention` + รูปแบบการกล่าวถึง)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการที่อยู่หลังจะ override รายการก่อนหน้า ดังนั้นให้มี `groupPolicy` เพียงรายการเดียวต่อขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ Bun">
    รันไทม์ gateway ของ WhatsApp ควรใช้ Node โดย Bun ถูกระบุว่าไม่เข้ากันสำหรับการทำงานของ gateway WhatsApp/Telegram แบบเสถียร
  </Accordion>
</AccordionGroup>

## System prompt

WhatsApp รองรับ system prompt แบบเดียวกับ Telegram สำหรับกลุ่มและแชตส่วนตัวผ่านแมป `groups` และ `direct`

ลำดับชั้นการ resolve สำหรับข้อความกลุ่ม:

ระบบจะกำหนดแมป `groups` ที่มีผลใช้งานก่อน: หากบัญชีกำหนด `groups` ของตัวเองไว้ จะใช้แทนแมป `groups` ระดับรากทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบนแมปเดียวที่ได้ผลลัพธ์นั้น:

1. **system prompt เฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อรายการของกลุ่มนั้นกำหนด `systemPrompt`
2. **system prompt wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเฉพาะกลุ่มหรือไม่มีการกำหนด `systemPrompt`

ลำดับชั้นการ resolve สำหรับข้อความส่วนตัว:

ระบบจะกำหนดแมป `direct` ที่มีผลใช้งานก่อน: หากบัญชีกำหนด `direct` ของตัวเองไว้ จะใช้แทนแมป `direct` ระดับรากทั้งหมด (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบนแมปเดียวที่ได้ผลลัพธ์นั้น:

1. **system prompt เฉพาะแชตส่วนตัว** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อรายการของ peer นั้นกำหนด `systemPrompt`
2. **system prompt wildcard ของแชตส่วนตัว** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเฉพาะ peer หรือไม่มีการกำหนด `systemPrompt`

หมายเหตุ: `dms` ยังคงเป็นบักเก็ต override ประวัติราย DM แบบเบา (`dms.<id>.historyLimit`); ส่วนการ override prompt จะอยู่ภายใต้ `direct`

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram `groups` ระดับรากจะถูกระงับโดยตั้งใจสำหรับทุกบัญชีในระบบหลายบัญชี — แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตัวเอง — เพื่อป้องกันไม่ให้บอตรับข้อความกลุ่มจากกลุ่มที่มันไม่ได้อยู่ด้วย WhatsApp ไม่ใช้กลไกป้องกันนี้: `groups` และ `direct` ระดับรากจะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนด override ระดับบัญชีเสมอ ไม่ว่าจะมีการกำหนดกี่บัญชีก็ตาม ในการตั้งค่า WhatsApp แบบหลายบัญชี หากคุณต้องการ prompt รายบัญชีสำหรับกลุ่มหรือแชตส่วนตัว ให้กำหนดแมปทั้งหมดไว้ภายใต้แต่ละบัญชีอย่างชัดเจน แทนการอาศัยค่าเริ่มต้นระดับราก

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้งแมปการกำหนดค่ารายกลุ่มและ allowlist ระดับแชตของกลุ่ม ที่ระดับรากหรือระดับบัญชีก็ตาม `groups["*"]` หมายถึง "อนุญาตทุกกลุ่ม" สำหรับขอบเขตนั้น
- เพิ่ม wildcard group `systemPrompt` เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นอนุญาตทุกกลุ่มอยู่แล้วเท่านั้น หากคุณยังต้องการให้มีสิทธิ์เฉพาะ group ID ที่กำหนดไว้ตายตัว อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของ prompt แต่ให้ทำซ้ำ prompt ในแต่ละรายการกลุ่มที่อยู่ใน allowlist อย่างชัดเจนแทน
- การอนุญาตให้เข้ากลุ่มและการอนุญาตผู้ส่งเป็นการตรวจสอบแยกกัน `groups["*"]` จะขยายชุดของกลุ่มที่สามารถเข้าสู่การจัดการแบบกลุ่มได้ แต่ไม่ได้เป็นการอนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นโดยตัวมันเอง การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` เพียงให้การกำหนดค่าแชตส่วนตัวเริ่มต้นหลังจากที่ DM ได้รับอนุญาตแล้วโดย `dmPolicy` ร่วมกับ `allowFrom` หรือกฎ pairing-store

ตัวอย่าง:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## ตัวชี้ข้อมูลอ้างอิงการกำหนดค่า

ข้อมูลอ้างอิงหลัก:

- [ข้อมูลอ้างอิงการกำหนดค่า - WhatsApp](/th/gateway/config-channels#whatsapp)

ฟิลด์ WhatsApp ที่สำคัญ:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การจัดส่ง: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, การ override ระดับบัญชี
- การปฏิบัติการ: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- พฤติกรรมเซสชัน: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [ความปลอดภัย](/th/gateway/security)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
