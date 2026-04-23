---
read_when:
    - การทำงานกับพฤติกรรมของ WhatsApp/เว็บแชนเนล หรือการกำหนดเส้นทางกล่องข้อความเข้า
summary: การรองรับช่องทาง WhatsApp, การควบคุมการเข้าถึง, พฤติกรรมการส่งมอบ และการดำเนินงาน
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T05:28:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c527b9f7f58f4bb7272a6d1c0f9a435d7d46a9b99790243594afb5c305606b3
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (ช่องทางเว็บ)

สถานะ: พร้อมใช้งานจริงผ่าน WhatsApp Web (Baileys) Gateway เป็นผู้ดูแล linked session

## ติดตั้ง (เมื่อต้องการ)

- ระหว่าง onboarding (`openclaw onboard`) และ `openclaw channels add --channel whatsapp`
  ระบบจะถามให้ติดตั้ง Plugin WhatsApp ครั้งแรกที่คุณเลือกใช้งาน
- `openclaw channels login --channel whatsapp` ก็มีโฟลว์ติดตั้งให้เช่นกันเมื่อ
  ยังไม่มี Plugin อยู่
- Dev channel + git checkout: ค่าเริ่มต้นจะใช้พาธ Plugin ในเครื่อง
- Stable/Beta: ค่าเริ่มต้นจะใช้แพ็กเกจ npm `@openclaw/whatsapp`

ยังสามารถติดตั้งด้วยตนเองได้:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นคือ pairing สำหรับผู้ส่งที่ไม่รู้จัก
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    คู่มือวินิจฉัยและซ่อมแซมข้ามหลายช่องทาง
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างคอนฟิกช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าแบบรวดเร็ว

<Steps>
  <Step title="ตั้งค่านโยบายการเข้าถึง WhatsApp">

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

  <Step title="เชื่อมต่อ WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    สำหรับบัญชีเฉพาะ:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="เริ่มต้น Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="อนุมัติคำขอ pairing แรก (หากใช้โหมด pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    คำขอ pairing จะหมดอายุภายใน 1 ชั่วโมง คำขอที่รอดำเนินการถูกจำกัดไว้ที่ 3 รายการต่อช่องทาง

  </Step>
</Steps>

<Note>
OpenClaw แนะนำให้ใช้งาน WhatsApp บนหมายเลขแยกต่างหากเมื่อเป็นไปได้ (เมทาดาทาของช่องทางและโฟลว์การตั้งค่าถูกปรับให้เหมาะกับรูปแบบนั้น แต่ก็ยังรองรับการใช้งานด้วยหมายเลขส่วนตัวเช่นกัน)
</Note>

## รูปแบบการติดตั้งใช้งาน

<AccordionGroup>
  <Accordion title="หมายเลขเฉพาะสำหรับงานนี้ (แนะนำ)">
    นี่คือโหมดการใช้งานที่สะอาดที่สุด:

    - ตัวตน WhatsApp แยกต่างหากสำหรับ OpenClaw
    - allowlist ของ DM และขอบเขตการกำหนดเส้นทางชัดเจนกว่า
    - โอกาสสับสนกับการคุยกับตัวเองต่ำกว่า

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

  <Accordion title="ใช้หมายเลขส่วนตัวเป็นทางเลือกสำรอง">
    Onboarding รองรับโหมดหมายเลขส่วนตัว และจะเขียนค่าพื้นฐานที่เหมาะกับ self-chat ให้:

    - `dmPolicy: "allowlist"`
    - `allowFrom` มีหมายเลขส่วนตัวของคุณรวมอยู่ด้วย
    - `selfChatMode: true`

    ระหว่างรันไทม์ กลไกป้องกัน self-chat จะอิงจากหมายเลขของตัวเองที่เชื่อมไว้และ `allowFrom`

  </Accordion>

  <Accordion title="ขอบเขตช่องทางแบบ WhatsApp Web เท่านั้น">
    ช่องทางของแพลตฟอร์มส่งข้อความในสถาปัตยกรรมช่องทางปัจจุบันของ OpenClaw ใช้ WhatsApp Web (`Baileys`)

    ไม่มีช่องทางส่งข้อความ WhatsApp ผ่าน Twilio แยกต่างหากใน registry ของช่องทางแชตที่มีมาในตัว

  </Accordion>
</AccordionGroup>

## โมเดลรันไทม์

- Gateway เป็นผู้ดูแล socket ของ WhatsApp และลูป reconnect
- การส่งขาออกต้องมีตัวรับฟัง WhatsApp ที่ active สำหรับบัญชีเป้าหมาย
- ระบบจะเพิกเฉยต่อแชตสถานะและบรอดแคสต์ (`@status`, `@broadcast`)
- แชตโดยตรงใช้กฎเซสชัน DM (`session.dmScope`; ค่าเริ่มต้น `main` จะรวม DM เข้ากับเซสชันหลักของเอเจนต์)
- เซสชันกลุ่มถูกแยกออกจากกัน (`agent:<agentId>:whatsapp:group:<jid>`)
- ระบบขนส่ง WhatsApp Web รองรับตัวแปรสภาพแวดล้อม proxy มาตรฐานบนโฮสต์ของ Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / แบบตัวพิมพ์เล็ก) ควรใช้คอนฟิก proxy ระดับโฮสต์แทนการตั้งค่า proxy เฉพาะช่องทางของ WhatsApp

## การควบคุมการเข้าถึงและ activation

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.whatsapp.dmPolicy` ควบคุมการเข้าถึงแชตโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist`
    - `open` (ต้องมี `"*"` อยู่ใน `allowFrom`)
    - `disabled`

    `allowFrom` รับหมายเลขแบบ E.164 (จะ normalize ภายในระบบ)

    การ override สำหรับหลายบัญชี: `channels.whatsapp.accounts.<id>.dmPolicy` (และ `allowFrom`) จะมีผลเหนือค่าระดับช่องทางสำหรับบัญชีนั้น

    รายละเอียดพฤติกรรมระหว่างรันไทม์:

    - pairings จะถูกเก็บไว้ใน allow-store ของช่องทาง และรวมเข้ากับ `allowFrom` ที่ตั้งค่าไว้
    - หากไม่มีการตั้งค่า allowlist ระบบจะอนุญาตหมายเลขของตัวเองที่ลิงก์ไว้โดยค่าเริ่มต้น
    - DM แบบขาออกจาก `fromMe` จะไม่ถูกจับคู่ให้อัตโนมัติ

  </Tab>

  <Tab title="นโยบายกลุ่ม + allowlist">
    การเข้าถึงกลุ่มมีสองชั้น:

    1. **allowlist ของสมาชิกกลุ่ม** (`channels.whatsapp.groups`)
       - หากไม่กำหนด `groups` ทุกกลุ่มจะมีสิทธิ์เข้าเกณฑ์
       - หากกำหนด `groups` ระบบจะถือสิ่งนี้เป็น allowlist ของกลุ่ม (`"*"` ใช้ได้)

    2. **นโยบายผู้ส่งในกลุ่ม** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: ข้าม allowlist ของผู้ส่ง
       - `allowlist`: ผู้ส่งต้องตรงกับ `groupAllowFrom` (หรือ `*`)
       - `disabled`: บล็อกข้อความขาเข้าจากกลุ่มทั้งหมด

    fallback ของ allowlist ผู้ส่ง:

    - หากไม่ได้ตั้ง `groupAllowFrom` รันไทม์จะ fallback ไปใช้ `allowFrom` เมื่อมี
    - ระบบจะประเมิน allowlist ของผู้ส่งก่อน mention/reply activation

    หมายเหตุ: หากไม่มีบล็อก `channels.whatsapp` อยู่เลย รันไทม์จะ fallback นโยบายกลุ่มเป็น `allowlist` (พร้อม log เตือน) แม้ว่าจะมีการตั้ง `channels.defaults.groupPolicy` ไว้ก็ตาม

  </Tab>

  <Tab title="Mentions + /activation">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงโดยค่าเริ่มต้น

    การตรวจจับการกล่าวถึงประกอบด้วย:

    - การกล่าวถึงบอตแบบ explicit ใน WhatsApp
    - แพตเทิร์น regex สำหรับการกล่าวถึงที่ตั้งค่าไว้ (`agents.list[].groupChat.mentionPatterns`, fallback คือ `messages.groupChat.mentionPatterns`)
    - การตรวจจับการตอบกลับถึงบอตแบบ implicit (ผู้ส่งในข้อความตอบกลับตรงกับตัวตนของบอต)

    หมายเหตุด้านความปลอดภัย:

    - quote/reply ใช้เพื่อผ่าน mention gating เท่านั้น; มัน**ไม่ได้**ให้สิทธิ์อนุญาตผู้ส่ง
    - เมื่อใช้ `groupPolicy: "allowlist"` ผู้ส่งที่ไม่อยู่ใน allowlist จะยังคงถูกบล็อกแม้ว่าจะตอบกลับข้อความของผู้ใช้ที่อยู่ใน allowlist ก็ตาม

    คำสั่ง activation ระดับเซสชัน:

    - `/activation mention`
    - `/activation always`

    `activation` จะอัปเดตสถานะของเซสชัน (ไม่ใช่คอนฟิก global) และจำกัดให้เจ้าของเท่านั้นใช้ได้

  </Tab>
</Tabs>

## พฤติกรรมสำหรับหมายเลขส่วนตัวและ self-chat

เมื่อหมายเลขของตัวเองที่เชื่อมไว้มีอยู่ใน `allowFrom` ด้วย ระบบป้องกัน self-chat ของ WhatsApp จะทำงาน:

- ข้าม read receipt สำหรับ turn ของ self-chat
- เพิกเฉยต่อพฤติกรรม auto-trigger ของ mention-JID ที่อาจทำให้คุณไปทริกเกอร์ตัวเอง
- หากไม่ได้ตั้ง `messages.responsePrefix` คำตอบใน self-chat จะใช้ค่าเริ่มต้นเป็น `[{identity.name}]` หรือ `[openclaw]`

## การ normalize ข้อความและบริบท

<AccordionGroup>
  <Accordion title="envelope ของขาเข้า + บริบทการตอบกลับ">
    ข้อความ WhatsApp ขาเข้าจะถูกห่อด้วย inbound envelope ที่ใช้ร่วมกัน

    หากมีข้อความตอบกลับแบบ quote อยู่ ระบบจะเติมบริบทในรูปแบบนี้:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    ฟิลด์เมทาดาทาของการตอบกลับจะถูกเติมด้วยเมื่อมี (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164)

  </Accordion>

  <Accordion title="ตัวยึดตำแหน่งของสื่อ และการดึงข้อมูลตำแหน่งที่ตั้ง/รายชื่อผู้ติดต่อ">
    ข้อความขาเข้าที่มีแต่สื่อจะถูก normalize ด้วยตัวยึดตำแหน่ง เช่น:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    payload ของตำแหน่งที่ตั้งและรายชื่อผู้ติดต่อจะถูก normalize เป็นบริบทข้อความก่อนกำหนดเส้นทาง

  </Accordion>

  <Accordion title="การ inject ประวัติกลุ่มที่รอดำเนินการ">
    สำหรับกลุ่ม ข้อความที่ยังไม่ได้ประมวลผลสามารถถูกบัฟเฟอร์และ inject เป็นบริบทได้เมื่อบอตถูกทริกเกอร์ในที่สุด

    - ขีดจำกัดเริ่มต้น: `50`
    - คอนฟิก: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - ตั้งเป็น `0` เพื่อปิดใช้งาน

    ตัวทำเครื่องหมายการ inject:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipt">
    Read receipt เปิดใช้งานเป็นค่าเริ่มต้นสำหรับข้อความ WhatsApp ขาเข้าที่ได้รับการยอมรับ

    ปิดแบบ global:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Override แยกตามบัญชี:

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

    turn ของ self-chat จะข้าม read receipt แม้จะเปิดใช้งานแบบ global อยู่ก็ตาม

  </Accordion>
</AccordionGroup>

## การส่งมอบ การแบ่งข้อความ และสื่อ

<AccordionGroup>
  <Accordion title="การแบ่งข้อความ">
    - ขีดจำกัดการแบ่งข้อความเริ่มต้น: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - โหมด `newline` จะพยายามแบ่งตามขอบเขตย่อหน้า (บรรทัดว่าง) ก่อน แล้วจึง fallback ไปใช้การแบ่งตามความยาวที่ปลอดภัย
  </Accordion>

  <Accordion title="พฤติกรรมของสื่อขาออก">
    - รองรับ payload แบบรูปภาพ วิดีโอ เสียง (PTT voice-note) และเอกสาร
    - `audio/ogg` จะถูกเขียนใหม่เป็น `audio/ogg; codecs=opus` เพื่อให้เข้ากันได้กับ voice-note
    - รองรับการเล่น animated GIF ผ่าน `gifPlayback: true` ในการส่งวิดีโอ
    - เมื่อตอบกลับด้วยหลายสื่อ caption จะถูกใส่กับรายการสื่อรายการแรก
    - แหล่งสื่อสามารถเป็น HTTP(S), `file://` หรือพาธภายในเครื่อง
  </Accordion>

  <Accordion title="ขีดจำกัดขนาดสื่อและพฤติกรรม fallback">
    - เพดานการบันทึกสื่อขาเข้า: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - เพดานการส่งสื่อขาออก: `channels.whatsapp.mediaMaxMb` (ค่าเริ่มต้น `50`)
    - การ override แยกตามบัญชีใช้ `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - รูปภาพจะถูกปรับแต่งอัตโนมัติ (resize/quality sweep) เพื่อให้อยู่ในขีดจำกัด
    - เมื่อการส่งสื่อล้มเหลว fallback ของรายการแรกจะส่งข้อความเตือนแทนที่จะเงียบหายไปโดยไม่ตอบกลับ
  </Accordion>
</AccordionGroup>

## ระดับ reaction

`channels.whatsapp.reactionLevel` ควบคุมว่าเอเจนต์จะใช้ emoji reaction บน WhatsApp กว้างแค่ไหน:

| ระดับ         | Ack reaction | reaction ที่เอเจนต์เริ่มเอง | คำอธิบาย                                          |
| ------------- | ------------ | ---------------------------- | ------------------------------------------------- |
| `"off"`       | ไม่ใช้        | ไม่ใช้                        | ไม่ใช้ reaction เลย                               |
| `"ack"`       | ใช่          | ไม่ใช้                        | ใช้เฉพาะ ack reaction (การตอบรับก่อนตอบกลับ)     |
| `"minimal"`   | ใช่          | ใช่ (แบบระมัดระวัง)          | ack + reaction ของเอเจนต์พร้อมแนวทางแบบระมัดระวัง |
| `"extensive"` | ใช่          | ใช่ (สนับสนุนให้ใช้)         | ack + reaction ของเอเจนต์พร้อมแนวทางที่สนับสนุน   |

ค่าเริ่มต้น: `"minimal"`

การ override แยกตามบัญชีใช้ `channels.whatsapp.accounts.<id>.reactionLevel`

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
Ack reaction จะถูกควบคุมโดย `reactionLevel` — ระบบจะระงับเมื่อ `reactionLevel` เป็น `"off"`

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

- ส่งทันทีหลังจากยอมรับข้อความขาเข้าแล้ว (ก่อนตอบกลับ)
- หากล้มเหลวจะบันทึก log แต่ไม่ขัดขวางการส่งคำตอบตามปกติ
- โหมดกลุ่ม `mentions` จะ react กับ turn ที่ถูกทริกเกอร์โดยการกล่าวถึง; group activation แบบ `always` ทำหน้าที่เป็นตัวข้ามการตรวจสอบนี้
- WhatsApp ใช้ `channels.whatsapp.ackReaction` (`messages.ackReaction` แบบ legacy ไม่ได้ใช้ในที่นี้)

## หลายบัญชีและ credentials

<AccordionGroup>
  <Accordion title="การเลือกบัญชีและค่าเริ่มต้น">
    - account id มาจาก `channels.whatsapp.accounts`
    - การเลือกบัญชีเริ่มต้น: ใช้ `default` หากมี มิฉะนั้นใช้ account id ตัวแรกที่ตั้งค่าไว้ (เรียงลำดับแล้ว)
    - account id จะถูก normalize ภายในเพื่อใช้ในการค้นหา
  </Accordion>

  <Accordion title="พาธของ credentials และความเข้ากันได้กับระบบเดิม">
    - พาธการยืนยันตัวตนปัจจุบัน: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ไฟล์สำรอง: `creds.json.bak`
    - ระบบยังคงรู้จัก/ย้ายข้อมูลการยืนยันตัวตนเริ่มต้นแบบเดิมใน `~/.openclaw/credentials/` สำหรับโฟลว์ของบัญชีเริ่มต้น
  </Accordion>

  <Accordion title="พฤติกรรมการออกจากระบบ">
    `openclaw channels logout --channel whatsapp [--account <id>]` จะล้างสถานะการยืนยันตัวตนของ WhatsApp สำหรับบัญชีนั้น

    ในไดเรกทอรีการยืนยันตัวตนแบบเดิม ระบบจะเก็บ `oauth.json` ไว้ แต่ลบไฟล์การยืนยันตัวตนของ Baileys ออก

  </Accordion>
</AccordionGroup>

## เครื่องมือ การกระทำ และการเขียนคอนฟิก

- การรองรับเครื่องมือของเอเจนต์รวมถึงการกระทำ reaction ของ WhatsApp (`react`)
- ตัวควบคุมการกระทำ:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- การเขียนคอนฟิกที่เริ่มจากช่องทางเปิดใช้งานอยู่โดยค่าเริ่มต้น (ปิดได้ด้วย `channels.whatsapp.configWrites=false`)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ยังไม่เชื่อมต่อ (ต้องใช้ QR)">
    อาการ: สถานะช่องทางรายงานว่ายังไม่เชื่อมต่อ

    วิธีแก้:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="เชื่อมต่อแล้วแต่ขาดการเชื่อมต่อ / วน reconnect">
    อาการ: บัญชีเชื่อมต่อแล้ว แต่มีการตัดการเชื่อมต่อหรือพยายาม reconnect ซ้ำ ๆ

    วิธีแก้:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    หากจำเป็น ให้เชื่อมต่อใหม่ด้วย `channels login`

  </Accordion>

  <Accordion title="ไม่มี listener ที่ active ระหว่างการส่ง">
    การส่งขาออกจะล้มเหลวทันทีเมื่อไม่มี listener ของ Gateway ที่ active อยู่สำหรับบัญชีเป้าหมาย

    ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานอยู่ และบัญชีนั้นเชื่อมต่อแล้ว

  </Accordion>

  <Accordion title="ข้อความกลุ่มถูกเพิกเฉยโดยไม่คาดคิด">
    ให้ตรวจสอบตามลำดับนี้:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - รายการ allowlist ใน `groups`
    - mention gating (`requireMention` + mention pattern)
    - คีย์ซ้ำใน `openclaw.json` (JSON5): รายการหลังจะ override รายการก่อน ดังนั้นควรมี `groupPolicy` เพียงรายการเดียวต่อแต่ละขอบเขต

  </Accordion>

  <Accordion title="คำเตือนรันไทม์ Bun">
    รันไทม์ของ WhatsApp Gateway ควรใช้ Node โดย Bun ถูกระบุว่าไม่เข้ากันสำหรับการทำงานของ WhatsApp/Telegram Gateway แบบเสถียร
  </Accordion>
</AccordionGroup>

## system prompt

WhatsApp รองรับ system prompt แบบเดียวกับ Telegram สำหรับกลุ่มและแชตโดยตรง ผ่าน map `groups` และ `direct`

ลำดับชั้นการ resolve สำหรับข้อความกลุ่ม:

ระบบจะกำหนด map `groups` ที่มีผลจริงก่อน: หากบัญชีกำหนด `groups` ของตัวเองไว้ ระบบจะใช้แทนที่ map `groups` ระดับรากทั้งหมดทันที (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบน map เดี่ยวที่ได้ผลลัพธ์นั้น:

1. **system prompt เฉพาะกลุ่ม** (`groups["<groupId>"].systemPrompt`): ใช้เมื่อรายการของกลุ่มนั้นกำหนด `systemPrompt` ไว้
2. **system prompt แบบ wildcard ของกลุ่ม** (`groups["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเฉพาะของกลุ่ม หรือมีแต่ไม่ได้กำหนด `systemPrompt`

ลำดับชั้นการ resolve สำหรับข้อความโดยตรง:

ระบบจะกำหนด map `direct` ที่มีผลจริงก่อน: หากบัญชีกำหนด `direct` ของตัวเองไว้ ระบบจะใช้แทนที่ map `direct` ระดับรากทั้งหมดทันที (ไม่มี deep merge) จากนั้นการค้นหา prompt จะทำงานบน map เดี่ยวที่ได้ผลลัพธ์นั้น:

1. **system prompt เฉพาะแชตโดยตรง** (`direct["<peerId>"].systemPrompt`): ใช้เมื่อรายการ peer นั้นกำหนด `systemPrompt` ไว้
2. **system prompt แบบ wildcard ของแชตโดยตรง** (`direct["*"].systemPrompt`): ใช้เมื่อไม่มีรายการเฉพาะของ peer หรือมีแต่ไม่ได้กำหนด `systemPrompt`

หมายเหตุ: `dms` ยังคงเป็นบักเก็ต override ประวัติราย DM แบบเบา (`dms.<id>.historyLimit`); ส่วน prompt override จะอยู่ภายใต้ `direct`

**ความแตกต่างจากพฤติกรรมหลายบัญชีของ Telegram:** ใน Telegram ระบบจะตั้งใจระงับ `groups` ระดับรากสำหรับทุกบัญชีในชุดติดตั้งหลายบัญชี แม้แต่บัญชีที่ไม่ได้กำหนด `groups` ของตัวเองเลย เพื่อป้องกันไม่ให้บอตได้รับข้อความกลุ่มจากกลุ่มที่มันไม่ได้อยู่ในนั้น ส่วน WhatsApp ไม่ใช้กลไกป้องกันนี้: `groups` ระดับรากและ `direct` ระดับรากจะถูกสืบทอดโดยบัญชีที่ไม่ได้กำหนด override ระดับบัญชีเสมอ ไม่ว่าจะมีการตั้งค่ากี่บัญชีก็ตาม ในชุดติดตั้ง WhatsApp แบบหลายบัญชี หากคุณต้องการ prompt สำหรับกลุ่มหรือแชตโดยตรงแยกตามบัญชี ให้กำหนด map ทั้งชุดไว้ภายใต้แต่ละบัญชีอย่างชัดเจน แทนการพึ่งค่าเริ่มต้นระดับราก

พฤติกรรมสำคัญ:

- `channels.whatsapp.groups` เป็นทั้ง map คอนฟิกแยกตามกลุ่ม และ allowlist ของกลุ่มในระดับแชต ไม่ว่าจะเป็นในขอบเขตรากหรือขอบเขตบัญชี `groups["*"]` หมายถึง "อนุญาตทุกกลุ่ม" สำหรับขอบเขตนั้น
- ให้เพิ่ม system prompt ของกลุ่มแบบ wildcard เฉพาะเมื่อคุณต้องการให้ขอบเขตนั้นอนุญาตทุกกลุ่มอยู่แล้วเท่านั้น หากคุณยังต้องการให้มีเพียง group ID ที่กำหนดตายตัวบางรายการเท่านั้นที่เข้าเกณฑ์ อย่าใช้ `groups["*"]` เป็นค่าเริ่มต้นของ prompt แต่ให้ทำซ้ำ prompt เดียวกันในแต่ละรายการกลุ่มที่อยู่ใน allowlist อย่างชัดเจนแทน
- การอนุญาตให้เข้ากลุ่มและการอนุญาตผู้ส่งเป็นการตรวจสอบคนละส่วนกัน `groups["*"]` จะขยายชุดของกลุ่มที่สามารถเข้าสู่การจัดการแบบกลุ่มได้ แต่ไม่ได้อนุญาตผู้ส่งทุกคนในกลุ่มเหล่านั้นโดยอัตโนมัติ การเข้าถึงของผู้ส่งยังคงถูกควบคุมแยกต่างหากโดย `channels.whatsapp.groupPolicy` และ `channels.whatsapp.groupAllowFrom`
- `channels.whatsapp.direct` ไม่มีผลข้างเคียงแบบเดียวกันสำหรับ DM `direct["*"]` ใช้เพียงเพื่อให้คอนฟิกแชตโดยตรงเริ่มต้น หลังจาก DM นั้นได้รับอนุญาตแล้วด้วย `dmPolicy` บวกกับ `allowFrom` หรือกฎจาก pairing-store

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

## ตัวชี้ไปยังเอกสารอ้างอิงคอนฟิก

เอกสารอ้างอิงหลัก:

- [เอกสารอ้างอิงคอนฟิก - WhatsApp](/th/gateway/configuration-reference#whatsapp)

ฟิลด์ WhatsApp ที่สำคัญ:

- การเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- การส่งมอบ: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- หลายบัญชี: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override ระดับบัญชี
- การดำเนินงาน: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- พฤติกรรมเซสชัน: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [Security](/th/gateway/security)
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
