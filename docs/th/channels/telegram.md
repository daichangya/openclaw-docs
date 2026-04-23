---
read_when:
    - การทำงานกับฟีเจอร์หรือ Webhook ของ Telegram
summary: สถานะความรองรับ ความสามารถ และการกำหนดค่าของ Telegram bot
title: Telegram
x-i18n:
    generated_at: "2026-04-23T05:27:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

สถานะ: พร้อมใช้งานในระดับ production สำหรับ DM และกลุ่มของบอตผ่าน grammY โดยมี long polling เป็นโหมดค่าเริ่มต้น และโหมด webhook เป็นตัวเลือกเพิ่มเติม

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือ pairing
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/th/channels/troubleshooting">
    คู่มือวินิจฉัยและแก้ไขปัญหาข้ามช่องทาง
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่างคอนฟิกช่องทางแบบครบถ้วน
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้าง bot token ใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่า handle เป็น `@BotFather` ตรงตัว)

    รัน `/newbot` ทำตามขั้นตอน และบันทึก token ไว้

  </Step>

  <Step title="กำหนดค่า token และนโยบาย DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (เฉพาะบัญชีค่าเริ่มต้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่า token ใน config/env แล้วจึงเริ่ม gateway

  </Step>

  <Step title="เริ่ม gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัส Pairing จะหมดอายุภายใน 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตเข้ากลุ่ม">
    เพิ่มบอตเข้ากลุ่มของคุณ แล้วตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการ resolve token รับรู้ตามบัญชี ในทางปฏิบัติ ค่าใน config จะมีความสำคัญกว่า env fallback และ `TELEGRAM_BOT_TOKEN` ใช้ได้เฉพาะกับบัญชีค่าเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="Privacy mode และการมองเห็นในกลุ่ม">
    บอต Telegram ใช้ **Privacy Mode** เป็นค่าเริ่มต้น ซึ่งจำกัดข้อความในกลุ่มที่บอตจะได้รับ

    หากบอตต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่งต่อไปนี้:

    - ปิด privacy mode ผ่าน `/setprivacy`, หรือ
    - ทำให้บอตเป็นแอดมินของกลุ่ม

    เมื่อสลับ privacy mode ให้ลบบอตออกแล้วเพิ่มกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram ใช้การเปลี่ยนแปลงนั้น

  </Accordion>

  <Accordion title="สิทธิ์ในกลุ่ม">
    สถานะแอดมินถูกควบคุมในค่าตั้งค่ากลุ่มของ Telegram

    บอตที่เป็นแอดมินจะได้รับข้อความทั้งหมดในกลุ่ม ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มแบบ always-on

  </Accordion>

  <Accordion title="ตัวเลือก BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการถูกเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี sender ID อย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องให้ `allowFrom` มี `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` รับ Telegram user ID แบบตัวเลข รองรับและทำ normalization ให้กับคำนำหน้า `telegram:` / `tg:`
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่างจะบล็อก DM ทั้งหมด และจะไม่ผ่านการตรวจสอบความถูกต้องของ config
    การตั้งค่าจะถามหาเฉพาะ user ID แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้ว config ของคุณมีรายการ allowlist เป็น `@username` ให้รัน `openclaw doctor --fix` เพื่อ resolve รายการเหล่านั้น (แบบ best-effort; ต้องมี Telegram bot token)
    หากก่อนหน้านี้คุณพึ่งพาไฟล์ allowlist จาก pairing-store `openclaw doctor --fix` สามารถกู้คืนรายการเข้า `channels.telegram.allowFrom` ในโฟลว์แบบ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี ID ที่ระบุไว้อย่างชัดเจน)

    สำหรับบอตที่มีเจ้าของคนเดียว แนะนำให้ใช้ `dmPolicy: "allowlist"` ร่วมกับ `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงอยู่ใน config อย่างถาวร (แทนที่จะขึ้นกับการอนุมัติ pairing ก่อนหน้า)

    จุดที่มักสับสน: การอนุมัติ DM pairing ไม่ได้แปลว่า "ผู้ส่งนี้ได้รับอนุญาตทุกที่"
    Pairing ให้สิทธิ์การเข้าถึง DM เท่านั้น การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ระบุไว้อย่างชัดเจน
    หากคุณต้องการให้ "ฉันได้รับอนุญาตครั้งเดียว แล้วใช้ได้ทั้ง DM และคำสั่งในกลุ่ม" ให้ใส่ Telegram user ID แบบตัวเลขของคุณใน `channels.telegram.allowFrom`

    ### การหา Telegram user ID ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    1. ส่ง DM หาบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่านค่า `from.id`

    วิธีด้วย Bot API อย่างเป็นทางการ:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีด้วยบริการบุคคลที่สาม (เป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีตัวควบคุมสองส่วนที่ใช้ร่วมกัน:

    1. **อนุญาตกลุ่มใดบ้าง** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อ `groupPolicy: "open"`: กลุ่มใดก็ผ่านการตรวจสอบ group-ID ได้
         - เมื่อ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการใน `groups` (หรือ `"*"`)
       - มีการกำหนด `groups`: จะทำหน้าที่เป็น allowlist (ID แบบชัดเจนหรือ `"*"`)

    2. **อนุญาตผู้ส่งใดบ้างในกลุ่ม** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่าไว้ Telegram จะ fallback ไปใช้ `allowFrom`
    รายการใน `groupAllowFrom` ควรเป็น Telegram user ID แบบตัวเลข (คำนำหน้า `telegram:` / `tg:` จะถูกทำ normalization)
    อย่าใส่ Telegram group หรือ supergroup chat ID ลงใน `groupAllowFrom` chat ID แบบค่าติดลบควรอยู่ภายใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกละเลยสำหรับการอนุญาตผู้ส่ง
    ขอบเขตความปลอดภัย (`2026.2.25+`): การยืนยันตัวตนผู้ส่งในกลุ่มจะ **ไม่** สืบทอดการอนุมัติจาก pairing-store ของ DM
    Pairing ยังคงเป็น DM-only สำหรับกลุ่ม ให้ตั้ง `groupAllowFrom` หรือ `allowFrom` ระดับกลุ่ม/ระดับหัวข้อ
    หากไม่ได้ตั้งค่า `groupAllowFrom` ไว้ Telegram จะ fallback ไปใช้ `allowFrom` ใน config ไม่ใช่ pairing store
    รูปแบบที่ใช้งานได้จริงสำหรับบอตเจ้าของคนเดียว: ตั้ง user ID ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ไว้ไม่ต้องตั้ง และอนุญาตกลุ่มเป้าหมายภายใต้ `channels.telegram.groups`
    หมายเหตุของรันไทม์: หากไม่มี `channels.telegram` ทั้งหมด รันไทม์จะใช้ค่าเริ่มต้นแบบ fail-closed คือ `groupPolicy="allowlist"` เว้นแต่จะมีการตั้งค่า `channels.defaults.groupPolicy` อย่างชัดเจน

    ตัวอย่าง: อนุญาตสมาชิกคนใดก็ได้ในกลุ่มเฉพาะหนึ่งกลุ่ม:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    ตัวอย่าง: อนุญาตเฉพาะผู้ใช้บางคนในกลุ่มเฉพาะหนึ่งกลุ่ม:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      ข้อผิดพลาดที่พบบ่อย: `groupAllowFrom` ไม่ใช่ allowlist ของกลุ่ม Telegram

      - ให้นำ Telegram group หรือ supergroup chat ID แบบค่าติดลบ เช่น `-1001234567890` ไปไว้ภายใต้ `channels.telegram.groups`
      - ให้นำ Telegram user ID เช่น `8734062810` ไปไว้ภายใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดในกลุ่มที่ได้รับอนุญาตสามารถเรียกใช้บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตคุยกับบอตได้
    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการกล่าวถึง">
    การตอบกลับในกลุ่มต้องมีการกล่าวถึงเป็นค่าเริ่มต้น

    การกล่าวถึงสามารถมาจาก:

    - การกล่าวถึง `@botusername` แบบเนทีฟ, หรือ
    - mention pattern ใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    ตัวสลับคำสั่งระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    คำสั่งเหล่านี้อัปเดตเฉพาะสถานะของเซสชัน ใช้ config หากต้องการให้คงอยู่ถาวร

    ตัวอย่าง config แบบคงอยู่:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    การดู group chat ID:

    - ส่งต่อข้อความจากกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบจาก Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรมขณะรัน

- Telegram ถูกดูแลโดยโปรเซส gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เป็นผู้เลือกช่องทาง)
- ข้อความขาเข้าจะถูกทำ normalization เข้าเป็น envelope ของช่องทางที่ใช้ร่วมกัน พร้อม metadata ของการตอบกลับและ placeholder ของสื่อ
- เซสชันกลุ่มจะแยกกันตาม group ID สำหรับ forum topic จะต่อท้าย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะกำหนดเส้นทางด้วย session key ที่รับรู้ตามเธรด และคง thread ID ไว้สำหรับการตอบกลับ
- Long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด การทำงานพร้อมกันโดยรวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- watchdog ของ long polling จะรีสตาร์ตเมื่อไม่มี completed `getUpdates` liveness เป็นเวลา 120 วินาทีตามค่าเริ่มต้น ให้เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการติดตั้งของคุณยังคงพบการรีสตาร์ตจาก polling stall ที่เป็น false positive ระหว่างงานที่ใช้เวลานาน ค่านี้เป็นมิลลิวินาที และอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับการ override รายบัญชี
- Telegram Bot API ไม่รองรับ read receipt (`sendReadReceipts` ใช้ไม่ได้)

## เอกสารอ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="ตัวอย่างสตรีมแบบ live (แก้ไขข้อความ)">
    OpenClaw สามารถสตรีมคำตอบบางส่วนแบบเรียลไทม์ได้:

    - แชตโดยตรง: ข้อความตัวอย่าง + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความตัวอย่าง + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` เป็น `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` จะถูกแมปเป็น `partial` บน Telegram (เพื่อรองรับการตั้งชื่อข้ามช่องทาง)
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดต tool/progress จะใช้ข้อความตัวอย่างที่ถูกแก้ไขเดิมซ้ำหรือไม่ (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อแยกข้อความ tool/progress ออกจากกัน
    - ค่าแบบ legacy ของ `channels.telegram.streamMode` และค่า boolean ของ `streaming` จะถูกแมปให้อัตโนมัติ

    สำหรับคำตอบที่เป็นข้อความล้วน:

    - DM: OpenClaw จะคงข้อความตัวอย่างเดิมไว้และทำการแก้ไขครั้งสุดท้ายในข้อความเดิม (ไม่มีข้อความที่สอง)
    - กลุ่ม/หัวข้อ: OpenClaw จะคงข้อความตัวอย่างเดิมไว้และทำการแก้ไขครั้งสุดท้ายในข้อความเดิม (ไม่มีข้อความที่สอง)

    สำหรับคำตอบที่ซับซ้อน (เช่น payload ของสื่อ) OpenClaw จะ fallback ไปใช้การส่งผลลัพธ์สุดท้ายตามปกติ แล้วจึงล้างข้อความตัวอย่างออก

    Preview streaming แยกจาก block streaming เมื่อเปิดใช้ block streaming สำหรับ Telegram อย่างชัดเจน OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    หาก native draft transport ใช้ไม่ได้/ถูกปฏิเสธ OpenClaw จะ fallback ไปใช้ `sendMessage` + `editMessageText` โดยอัตโนมัติ

    สตรีม reasoning เฉพาะ Telegram:

    - `/reasoning stream` จะส่ง reasoning ไปยังตัวอย่างแบบ live ระหว่างกำลังสร้าง
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="การจัดรูปแบบและ HTML fallback">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความสไตล์ Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการ parse ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่ parse แล้ว OpenClaw จะ retry เป็นข้อความล้วน

    การแสดงตัวอย่างลิงก์ถูกเปิดใช้งานเป็นค่าเริ่มต้น และสามารถปิดได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งแบบเนทีฟและคำสั่งแบบกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะถูกจัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งแบบเนทีฟ:

    - `commands.native: "auto"` จะเปิดใช้คำสั่งแบบเนทีฟสำหรับ Telegram

    เพิ่มรายการคำสั่งแบบกำหนดเองในเมนู:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    กฎ:

    - ชื่อจะถูกทำ normalization (ตัด `/` ด้านหน้าออก, แปลงเป็นตัวพิมพ์เล็ก)
    - แพตเทิร์นที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งแบบกำหนดเองไม่สามารถ override คำสั่งแบบเนทีฟได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกไว้

    หมายเหตุ:

    - คำสั่งแบบกำหนดเองเป็นเพียงรายการในเมนูเท่านั้น; ไม่ได้มีการติดตั้งพฤติกรรมให้อัตโนมัติ
    - คำสั่งจาก Plugin/Skills ยังสามารถทำงานได้เมื่อพิมพ์เข้าไป แม้จะไม่แสดงในเมนูของ Telegram

    หากปิดใช้คำสั่งแบบเนทีฟ คำสั่งในตัวจะถูกนำออก คำสั่งแบบกำหนดเอง/คำสั่งจาก Plugin อาจยังคงถูกลงทะเบียนได้หากมีการกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังมีรายการมากเกินไปแม้หลังจากตัดแล้ว; ให้ลดจำนวนคำสั่งแบบกำหนดเอง/คำสั่งจาก Plugin/Skills หรือปิด `channels.telegram.commands.native`
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักหมายความว่า outbound DNS/HTTPS ไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่งจับคู่อุปกรณ์ (`device-pair` Plugin)

    เมื่อติดตั้ง Plugin `device-pair` แล้ว:

    1. `/pair` จะสร้างรหัสการตั้งค่า
    2. วางรหัสในแอป iOS
    3. `/pair pending` จะแสดงคำขอที่รอดำเนินการ (รวมถึง role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รอดำเนินการเพียงรายการเดียว
       - `/pair approve latest` สำหรับรายการล่าสุด

    รหัสการตั้งค่าจะมี bootstrap token แบบอายุสั้นติดมาด้วย การส่งต่อ bootstrap ในตัวจะคง primary node token ไว้ที่ `scopes: []`; operator token ที่ถูกส่งต่อจะยังคงถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบ bootstrap scope ใช้คำนำหน้าตาม role ดังนั้น allowlist ของ operator จะตอบสนองได้เฉพาะคำขอของ operator เท่านั้น; role ที่ไม่ใช่ operator ยังคงต้องมี scope ภายใต้คำนำหน้าของ role นั้นเอง

    หากอุปกรณ์ทำการ retry พร้อมรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` คนละตัว ให้รัน `/pair pending` ใหม่อีกครั้งก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [Pairing](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่มแบบอินไลน์">
    กำหนดค่าขอบเขตของ inline keyboard:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    การ override รายบัญชี:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    ขอบเขต:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (ค่าเริ่มต้น)

    แบบ legacy `capabilities: ["inlineButtons"]` จะถูกแมปเป็น `inlineButtons: "all"`

    ตัวอย่าง action ของข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    การคลิก callback จะถูกส่งต่อให้เอเจนต์ในรูปแบบข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="action ของข้อความ Telegram สำหรับเอเจนต์และระบบอัตโนมัติ">
    action ของเครื่องมือ Telegram ประกอบด้วย:

    - `sendMessage` (`to`, `content`, `mediaUrl`, `replyToMessageId`, `messageThreadId` ที่เป็นตัวเลือก)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` ที่เป็นตัวเลือก)

    action ของข้อความช่องเปิดเผย alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุมการอนุญาต:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: ปัจจุบัน `edit` และ `topic-create` ถูกเปิดใช้งานเป็นค่าเริ่มต้น และยังไม่มีตัวสลับ `channels.telegram.actions.*` แยกต่างหาก
    การส่งในรันไทม์จะใช้สแนปช็อต config/secrets ที่กำลังใช้งานอยู่ (ตอนเริ่มต้น/รีโหลด) ดังนั้นเส้นทาง action จะไม่ทำ SecretRef re-resolution แบบ ad-hoc ใหม่ทุกครั้งที่ส่ง

    ความหมายของการลบ reaction: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กเธรดการตอบกลับ">
    Telegram รองรับแท็กเธรดการตอบกลับแบบชัดเจนในผลลัพธ์ที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่เป็นตัวกระตุ้น
    - `[[reply_to:<id>]]` ตอบกลับ Telegram message ID ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    หมายเหตุ: `off` จะปิดการทำ reply threading แบบโดยนัย แต่แท็ก `[[reply_to_*]]` ที่ระบุชัดเจนจะยังคงถูกใช้

  </Accordion>

  <Accordion title="Forum topic และพฤติกรรมของเธรด">
    Forum supergroup:

    - session key ของ topic จะต่อท้าย `:topic:<threadId>`
    - การตอบกลับและการพิมพ์จะมุ่งไปยังเธรดของ topic
    - พาธ config ของ topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของ General topic (`threadId=1`):

    - การส่งข้อความจะละเว้น `message_thread_id` (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - action การพิมพ์ยังคงรวม `message_thread_id`

    การสืบทอดของ topic: รายการ topic จะสืบทอดค่าตั้งค่าของกลุ่ม เว้นแต่จะมีการ override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นแบบ topic-only และไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางเอเจนต์ราย topic**: แต่ละ topic สามารถกำหนดเส้นทางไปยังเอเจนต์คนละตัวได้โดยตั้ง `agentId` ใน config ของ topic ซึ่งจะทำให้แต่ละ topic มี workspace, หน่วยความจำ และเซสชันที่แยกจากกัน ตัวอย่าง:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    จากนั้นแต่ละ topic จะมี session key ของตัวเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การผูก ACP ของ topic แบบถาวร**: Forum topic สามารถปักหมุดเซสชัน ACP harness ผ่าน ACP binding แบบมีชนิดที่ระดับบนสุด:

    - `bindings[]` ที่มี `type: "acp"` และ `match.channel: "telegram"`

    ตัวอย่าง:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    ปัจจุบันสิ่งนี้จำกัดขอบเขตอยู่ที่ forum topic ในกลุ่มและ supergroup

    **การสร้าง ACP ที่ผูกกับเธรดจากในแชต**:

    - `/acp spawn <agent> --thread here|auto` สามารถผูก Telegram topic ปัจจุบันกับเซสชัน ACP ใหม่ได้
    - ข้อความถัดไปใน topic จะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ผูกไว้โดยตรง (ไม่ต้องใช้ `/acp steer`)
    - OpenClaw จะปักหมุดข้อความยืนยันการสร้างไว้ใน topic หลังจากผูกสำเร็จ
    - ต้องมี `channels.telegram.threadBindings.spawnAcpSessions=true`

    บริบทของ template ประกอบด้วย:

    - `MessageThreadId`
    - `IsForum`

    พฤติกรรมของเธรด DM:

    - แชตส่วนตัวที่มี `message_thread_id` จะยังคงใช้การกำหนดเส้นทางแบบ DM แต่จะใช้ session key/เป้าหมายการตอบกลับที่รับรู้ตามเธรด

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่าง voice note กับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - ใช้แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับให้ส่งเป็น voice note

    ตัวอย่าง action ของข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### ข้อความวิดีโอ

    Telegram แยกความแตกต่างระหว่างไฟล์วิดีโอกับ video note

    ตัวอย่าง action ของข้อความ:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video note ไม่รองรับคำบรรยาย; ข้อความที่ระบุไว้จะถูกส่งแยกต่างหาก

    ### สติกเกอร์

    การจัดการสติกเกอร์ขาเข้า:

    - WEBP แบบคงที่: ดาวน์โหลดและประมวลผล (placeholder `<media:sticker>`)
    - TGS แบบเคลื่อนไหว: ข้าม
    - WEBM แบบวิดีโอ: ข้าม

    ฟิลด์บริบทของสติกเกอร์:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ไฟล์แคชของสติกเกอร์:

    - `~/.openclaw/telegram/sticker-cache.json`

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อทำได้) และแคชไว้เพื่อลดการเรียก vision ซ้ำ

    เปิดใช้งาน action ของสติกเกอร์:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    action สำหรับส่งสติกเกอร์:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    ค้นหาสติกเกอร์ที่แคชไว้:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="การแจ้งเตือน reaction">
    reaction ของ Telegram จะเข้ามาเป็นอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะนำ system event เข้าคิวในลักษณะเช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    คอนฟิก:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงเฉพาะ reaction ของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (แบบ best-effort ผ่านแคชข้อความที่ส่ง)
    - เหตุการณ์ reaction ยังคงอยู่ภายใต้การควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ thread ID มาในอัปเดต reaction
      - กลุ่มที่ไม่ใช่ forum จะกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่มแบบ forum จะกำหนดเส้นทางไปยังเซสชัน general-topic ของกลุ่ม (`:topic:1`) ไม่ใช่ topic ต้นทางที่แท้จริง

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` ให้โดยอัตโนมัติ

  </Accordion>

  <Accordion title="Ack reaction">
    `ackReaction` จะส่งอีโมจิยืนยันระหว่างที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback เป็นอีโมจิของ identity ของเอเจนต์ (`agents.list[].identity.emoji`, ถ้าไม่มีจะใช้ "👀")

    หมายเหตุ:

    - Telegram ต้องการอีโมจิแบบ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิด reaction นี้สำหรับช่องหรือบัญชี

  </Accordion>

  <Accordion title="การเขียนคอนฟิกจากเหตุการณ์และคำสั่งของ Telegram">
    การเขียน config จากช่องจะเปิดใช้งานเป็นค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ถูกทริกเกอร์จาก Telegram รวมถึง:

    - เหตุการณ์ย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
    - `/config set` และ `/config unset` (ต้องเปิดใช้งานคำสั่งไว้)

    ปิดใช้งาน:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling เทียบกับ webhook">
    ค่าเริ่มต้น: long polling

    โหมด Webhook:

    - ตั้งค่า `channels.telegram.webhookUrl`
    - ตั้งค่า `channels.telegram.webhookSecret` (จำเป็นเมื่อมีการตั้ง webhook URL)
    - มี `channels.telegram.webhookPath` เป็นตัวเลือก (ค่าเริ่มต้น `/telegram-webhook`)
    - มี `channels.telegram.webhookHost` เป็นตัวเลือก (ค่าเริ่มต้น `127.0.0.1`)
    - มี `channels.telegram.webhookPort` เป็นตัวเลือก (ค่าเริ่มต้น `8787`)

    ตัวรับฟังภายในเครื่องเริ่มต้นสำหรับโหมด webhook จะ bind ที่ `127.0.0.1:8787`

    หากปลายทางสาธารณะของคุณแตกต่างออกไป ให้ตั้ง reverse proxy ไว้ด้านหน้าแล้วชี้ `webhookUrl` ไปยัง URL สาธารณะนั้น
    ตั้งค่า `webhookHost` (เช่น `0.0.0.0`) เมื่อคุณต้องการรับทราฟฟิกขาเข้าจากภายนอกโดยตั้งใจ

  </Accordion>

  <Accordion title="ข้อจำกัด การ retry และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.timeoutSeconds` ใช้ override timeout ของ Telegram API client (หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY)
    - `channels.telegram.pollingStallThresholdMs` มีค่าเริ่มต้นเป็น `120000`; ปรับค่าในช่วง `30000` ถึง `600000` เฉพาะเมื่อเกิดการรีสตาร์ตจาก polling stall แบบ false positive
    - ประวัติบริบทของกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` คือปิดใช้งาน
    - บริบทเสริมของการตอบกลับ/อ้างอิง/ส่งต่อ ปัจจุบันจะถูกส่งต่อไปตามที่ได้รับมา
    - allowlist ของ Telegram ใช้ควบคุมหลัก ๆ ว่าใครสามารถเรียกใช้เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิด supplemental-context แบบเต็มรูปแบบ
    - ตัวควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - คอนฟิก `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้

    เป้าหมายการส่งของ CLI สามารถเป็น chat ID แบบตัวเลขหรือ username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram poll ใช้ `openclaw message poll` และรองรับ forum topic:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    แฟลก poll เฉพาะ Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` สำหรับ forum topic (หรือใช้เป้าหมายแบบ `:topic:`)

    การส่งของ Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboard เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอให้ปักหมุดเมื่อบอตสามารถปักหมุดได้ในแชตนั้น
    - `--force-document` เพื่อส่งรูปภาพและ GIF ขาออกเป็นเอกสารแทนการอัปโหลดเป็นภาพบีบอัดหรือสื่อเคลื่อนไหว

    การควบคุม action:

    - `channels.telegram.actions.sendMessage=false` จะปิดข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` จะปิดการสร้าง Telegram poll โดยยังคงเปิดการส่งข้อความปกติไว้

  </Accordion>

  <Accordion title="การอนุมัติ exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถโพสต์พรอมป์การอนุมัติในแชตหรือ topic ต้นทางได้ตามตัวเลือก

    พาธคอนฟิก:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (ไม่บังคับ; หากไม่ตั้งค่าจะ fallback ไปใช้ owner ID แบบตัวเลขที่อนุมานจาก `allowFrom` และ `defaultTo` ของข้อความโดยตรงเมื่อทำได้)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, ค่าเริ่มต้น: `dm`)
    - `agentFilter`, `sessionFilter`

    ผู้อนุมัติต้องเป็น Telegram user ID แบบตัวเลข Telegram จะเปิดใช้การอนุมัติ exec แบบเนทีฟโดยอัตโนมัติเมื่อ `enabled` ไม่ได้ตั้งค่าไว้หรือเป็น `"auto"` และสามารถ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งราย ไม่ว่าจะมาจาก `execApprovals.approvers` หรือจากคอนฟิก owner แบบตัวเลขของบัญชี (`allowFrom` และ `defaultTo` ของข้อความโดยตรง) ตั้ง `enabled: false` เพื่อปิด Telegram ไม่ให้เป็นไคลเอนต์การอนุมัติแบบเนทีฟอย่างชัดเจน มิฉะนั้นคำขออนุมัติจะ fallback ไปยังเส้นทางอนุมัติอื่นที่กำหนดค่าไว้ หรือใช้นโยบาย fallback ของการอนุมัติ exec

    Telegram ยังเรนเดอร์ปุ่มอนุมัติแบบใช้ร่วมกันซึ่งช่องแชตอื่น ๆ ใช้อยู่ด้วย ตัว adapter แบบเนทีฟของ Telegram เพิ่มหลัก ๆ ในส่วนของการกำหนดเส้นทาง DM ของผู้อนุมัติ การกระจายไปยัง channel/topic และ typing hint ก่อนการส่งมอบ
    เมื่อมีปุ่มเหล่านั้น ปุ่มจะเป็น UX การอนุมัติหลัก; OpenClaw
    ควรใส่คำสั่ง `/approve` แบบทำมือเฉพาะเมื่อผลลัพธ์ของเครื่องมือระบุว่า
    การอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบทำมือเป็นเส้นทางเดียวเท่านั้น

    กฎการส่งมอบ:

    - `target: "dm"` จะส่งพรอมป์อนุมัติไปยัง DM ของผู้อนุมัติที่ resolve ได้เท่านั้น
    - `target: "channel"` จะส่งพรอมป์กลับไปยังแชต/topic Telegram ต้นทาง
    - `target: "both"` จะส่งไปทั้ง DM ของผู้อนุมัติและแชต/topic ต้นทาง

    เฉพาะผู้อนุมัติที่ resolve ได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้ ผู้ที่ไม่ใช่ผู้อนุมัติจะใช้ `/approve` ไม่ได้ และไม่สามารถใช้ปุ่มอนุมัติของ Telegram ได้

    พฤติกรรมการ resolve การอนุมัติ:

    - ID ที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin เสมอ
    - ID การอนุมัติอื่น ๆ จะลอง `exec.approval.resolve` ก่อน
    - หาก Telegram ได้รับอนุญาตสำหรับการอนุมัติของ Plugin ด้วย และ gateway แจ้งว่า
      การอนุมัติ exec นั้นไม่รู้จัก/หมดอายุ Telegram จะ retry อีกหนึ่งครั้งผ่าน
      `plugin.approval.resolve`
    - การปฏิเสธ/ข้อผิดพลาดของการอนุมัติ exec จริง จะไม่ fallback แบบเงียบ ๆ ไปยัง
      การ resolve การอนุมัติของ Plugin

    การส่งใน channel จะแสดงข้อความคำสั่งในแชต ดังนั้นให้เปิด `channel` หรือ `both` เฉพาะในกลุ่ม/topic ที่เชื่อถือได้ เมื่อพรอมป์ไปอยู่ใน forum topic, OpenClaw จะคง topic เดิมไว้ทั้งสำหรับพรอมป์อนุมัติและการติดตามผลหลังการอนุมัติ การอนุมัติ exec จะหมดอายุภายใน 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติแบบอินไลน์ยังขึ้นอยู่กับว่า `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group`, หรือ `all`) หรือไม่

    เอกสารที่เกี่ยวข้อง: [Exec approvals](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ตัวควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดด้านการส่งมอบหรือผู้ให้บริการ Telegram สามารถเลือกได้ว่าจะตอบกลับด้วยข้อความข้อผิดพลาดหรือจะระงับไว้ มีคอนฟิกสองคีย์ที่ควบคุมพฤติกรรมนี้:

| คีย์                                | ค่า               | ค่าเริ่มต้น | คำอธิบาย                                                                                         |
| ----------------------------------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` จะส่งข้อความข้อผิดพลาดที่เป็นมิตรกลับไปยังแชต `silent` จะระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`     | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดในแชตเดียวกัน ป้องกันสแปมข้อผิดพลาดระหว่างระบบขัดข้อง       |

รองรับการ override รายบัญชี รายกลุ่ม และราย topic (ใช้รูปแบบการสืบทอดเดียวกับคีย์คอนฟิกอื่นของ Telegram)

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // ระงับข้อผิดพลาดในกลุ่มนี้
        },
      },
    },
  },
}
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="บอตไม่ตอบสนองต่อข้อความในกลุ่มที่ไม่มีการกล่าวถึง">

    - หาก `requireMention=false`, privacy mode ของ Telegram ต้องอนุญาตให้มองเห็นได้ทั้งหมด
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบบอตออกแล้วเพิ่มกลับเข้ากลุ่มใหม่
    - `openclaw channels status` จะเตือนเมื่อ config คาดหวังข้อความกลุ่มที่ไม่มีการกล่าวถึง
    - `openclaw channels status --probe` สามารถตรวจสอบ group ID แบบตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถ probe การเป็นสมาชิกได้
    - การทดสอบเซสชันแบบรวดเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความในกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` อยู่ กลุ่มนั้นต้องถูกระบุไว้ (หรือมี `"*"`)
    - ตรวจสอบว่าบอตเป็นสมาชิกในกลุ่ม
    - ตรวจสอบบันทึก: `openclaw logs --follow` เพื่อดูเหตุผลที่ถูกข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานได้บางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนของผู้ส่งของคุณ (pairing และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้ `groupPolicy` จะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูแบบเนทีฟมีรายการมากเกินไป; ลดจำนวนคำสั่งแบบกำหนดเอง/คำสั่งจาก Plugin/Skills หรือปิดเมนูแบบเนทีฟ
    - `setMyCommands failed` พร้อมข้อผิดพลาดเครือข่าย/fetch มักบ่งชี้ว่ามีปัญหาในการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="ความไม่เสถียรของ polling หรือเครือข่าย">

    - Node 22+ ร่วมกับ fetch/proxy แบบกำหนดเอง อาจทำให้เกิดการยกเลิกทันทีหากชนิดของ AbortSignal ไม่ตรงกัน
    - บางโฮสต์ resolve `api.telegram.org` ไปยัง IPv6 ก่อน; หาก IPv6 egress ใช้งานไม่ได้ อาจทำให้ Telegram API ล้มเหลวเป็นระยะ
    - หากบันทึกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!`, ตอนนี้ OpenClaw จะ retry ข้อผิดพลาดเหล่านี้ในฐานะข้อผิดพลาดเครือข่ายที่กู้คืนได้
    - หากบันทึกมี `Polling stall detected`, OpenClaw จะรีสตาร์ต polling และสร้าง Telegram transport ใหม่หลังจากไม่มี completed long-poll liveness เป็นเวลา 120 วินาทีตามค่าเริ่มต้น
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังปกติดี แต่โฮสต์ของคุณยังคงรายงานการรีสตาร์ตจาก polling stall แบบ false positive โดยทั่วไป stall ต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - บนโฮสต์ VPS ที่ direct egress/TLS ไม่เสถียร ให้ส่งการเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ใช้ค่าเริ่มต้นเป็น `autoSelectFamily=true` (ยกเว้น WSL2) และ `dnsResultOrder=ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนด้วยพฤติกรรม IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบในช่วง benchmark ตาม RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาต
      สำหรับการดาวน์โหลดสื่อของ Telegram โดยค่าเริ่มต้นอยู่แล้ว หาก fake-IP หรือ
      transparent proxy ที่เชื่อถือได้ เขียนทับ `api.telegram.org` ไปเป็น
      ที่อยู่ private/internal/special-use อื่นระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือก
      เปิด bypass แบบเฉพาะ Telegram ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - ยังมีตัวเลือกเดียวกันในระดับรายบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หากพร็อกซีของคุณ resolve โฮสต์สื่อของ Telegram ไปเป็น `198.18.x.x` ให้ปล่อย
      dangerous flag ปิดไว้ก่อน Telegram media อนุญาตช่วง benchmark ตาม RFC 2544
      นี้อยู่แล้วโดยค่าเริ่มต้น

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` จะลดความแข็งแกร่งของการป้องกัน Telegram
      media SSRF ใช้เฉพาะกับสภาพแวดล้อมพร็อกซีที่ผู้ปฏิบัติการควบคุมได้และเชื่อถือได้
      เช่นการกำหนดเส้นทาง fake-IP ของ Clash, Mihomo หรือ Surge เมื่อระบบเหล่านี้
      สร้างคำตอบแบบ private หรือ special-use นอกช่วง benchmark ตาม RFC 2544
      ให้ปิดไว้สำหรับการเข้าถึง Telegram แบบอินเทอร์เน็ตสาธารณะปกติ
    </Warning>

    - การ override ผ่านตัวแปรสภาพแวดล้อม (ชั่วคราว):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - ตรวจสอบคำตอบ DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)

## ตัวชี้เอกสารอ้างอิงคอนฟิก Telegram

เอกสารอ้างอิงหลัก:

- `channels.telegram.enabled`: เปิด/ปิดการเริ่มต้นช่อง
- `channels.telegram.botToken`: bot token (BotFather)
- `channels.telegram.tokenFile`: อ่าน token จากพาธไฟล์ปกติ ระบบจะปฏิเสธ symlink
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (ค่าเริ่มต้น: pairing)
- `channels.telegram.allowFrom`: allowlist ของ DM (Telegram user ID แบบตัวเลข) `allowlist` ต้องมี sender ID อย่างน้อยหนึ่งรายการ `open` ต้องมี `"*"` `openclaw doctor --fix` สามารถ resolve รายการ `@username` แบบ legacy ไปเป็น ID ได้ และสามารถกู้คืนรายการ allowlist จากไฟล์ pairing-store ในโฟลว์การย้าย allowlist ได้
- `channels.telegram.actions.poll`: เปิดหรือปิดการสร้าง Telegram poll (ค่าเริ่มต้น: เปิด; ยังต้องใช้ `sendMessage`)
- `channels.telegram.defaultTo`: เป้าหมาย Telegram เริ่มต้นที่ CLI `--deliver` ใช้เมื่อไม่มี `--reply-to` ที่ระบุชัดเจน
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (ค่าเริ่มต้น: allowlist)
- `channels.telegram.groupAllowFrom`: allowlist ของผู้ส่งในกลุ่ม (Telegram user ID แบบตัวเลข) `openclaw doctor --fix` สามารถ resolve รายการ `@username` แบบ legacy ไปเป็น ID ได้ รายการที่ไม่ใช่ตัวเลขจะถูกละเลยตอนยืนยันตัวตน การยืนยันตัวตนของกลุ่มจะไม่ใช้ fallback จาก DM pairing-store (`2026.2.25+`)
- ลำดับความสำคัญแบบหลายบัญชี:
  - เมื่อมีการกำหนด account ID ตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือรวม `channels.telegram.accounts.default`) เพื่อกำหนด default routing ให้ชัดเจน
  - หากไม่ได้ตั้งทั้งสองอย่าง OpenClaw จะ fallback ไปยัง account ID ตัวแรกที่ผ่าน normalization และ `openclaw doctor` จะเตือน
  - `channels.telegram.accounts.default.allowFrom` และ `channels.telegram.accounts.default.groupAllowFrom` ใช้เฉพาะกับบัญชี `default`
  - บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` และ `channels.telegram.groupAllowFrom` เมื่อไม่ได้ตั้งค่าระดับบัญชี
  - บัญชีที่มีชื่อจะไม่สืบทอด `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`
- `channels.telegram.groups`: ค่าเริ่มต้นรายกลุ่ม + allowlist (ใช้ `"*"` สำหรับค่าเริ่มต้นแบบ global)
  - `channels.telegram.groups.<id>.groupPolicy`: override รายกลุ่มสำหรับ groupPolicy (`open | allowlist | disabled`)
  - `channels.telegram.groups.<id>.requireMention`: ค่าเริ่มต้นของการควบคุมด้วยการกล่าวถึง
  - `channels.telegram.groups.<id>.skills`: ตัวกรอง Skills (ไม่ระบุ = ทุก Skills, ว่าง = ไม่มี)
  - `channels.telegram.groups.<id>.allowFrom`: override allowlist ของผู้ส่งรายกลุ่ม
  - `channels.telegram.groups.<id>.systemPrompt`: system prompt เพิ่มเติมสำหรับกลุ่ม
  - `channels.telegram.groups.<id>.enabled`: ปิดกลุ่มเมื่อเป็น `false`
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: override ราย topic (ฟิลด์ของกลุ่ม + `agentId` ที่มีเฉพาะ topic)
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: กำหนดเส้นทาง topic นี้ไปยังเอเจนต์เฉพาะ (override การกำหนดเส้นทางระดับกลุ่มและ binding)
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: override ราย topic สำหรับ groupPolicy (`open | allowlist | disabled`)
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: override การควบคุมด้วยการกล่าวถึงราย topic
- `bindings[]` ระดับบนสุดที่มี `type: "acp"` และ canonical topic id แบบ `chatId:topic:topicId` ใน `match.peer.id`: ฟิลด์การผูก ACP ของ topic แบบถาวร (ดู [ACP Agents](/th/tools/acp-agents#channel-specific-settings))
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: กำหนดเส้นทาง DM topic ไปยังเอเจนต์เฉพาะ (พฤติกรรมเดียวกับ forum topic)
- `channels.telegram.execApprovals.enabled`: เปิดใช้ Telegram เป็นไคลเอนต์การอนุมัติ exec ผ่านแชตสำหรับบัญชีนี้
- `channels.telegram.execApprovals.approvers`: Telegram user ID ที่อนุญาตให้อนุมัติหรือปฏิเสธคำขอ exec ไม่บังคับเมื่อ `channels.telegram.allowFrom` หรือ `channels.telegram.defaultTo` ของข้อความโดยตรงระบุเจ้าของไว้อยู่แล้ว
- `channels.telegram.execApprovals.target`: `dm | channel | both` (ค่าเริ่มต้น: `dm`) `channel` และ `both` จะคง Telegram topic ต้นทางไว้เมื่อมี
- `channels.telegram.execApprovals.agentFilter`: ตัวกรอง agent ID แบบไม่บังคับสำหรับพรอมป์อนุมัติที่ถูกส่งต่อ
- `channels.telegram.execApprovals.sessionFilter`: ตัวกรอง session key แบบไม่บังคับ (substring หรือ regex) สำหรับพรอมป์อนุมัติที่ถูกส่งต่อ
- `channels.telegram.accounts.<account>.execApprovals`: override รายบัญชีสำหรับการกำหนดเส้นทางการอนุมัติ exec ของ Telegram และการอนุญาตผู้อนุมัติ
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (ค่าเริ่มต้น: allowlist)
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: override รายบัญชี
- `channels.telegram.commands.nativeSkills`: เปิด/ปิดคำสั่ง Skills แบบเนทีฟของ Telegram
- `channels.telegram.replyToMode`: `off | first | all` (ค่าเริ่มต้น: `off`)
- `channels.telegram.textChunkLimit`: ขนาดการแบ่งข้อความขาออก (อักขระ)
- `channels.telegram.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.telegram.linkPreview`: เปิด/ปิดการแสดงตัวอย่างลิงก์สำหรับข้อความขาออก (ค่าเริ่มต้น: true)
- `channels.telegram.streaming`: `off | partial | block | progress` (ตัวอย่างสตรีมแบบ live; ค่าเริ่มต้น: `partial`; `progress` ถูกแมปเป็น `partial`; `block` เป็นความเข้ากันได้กับโหมดตัวอย่างแบบ legacy) การสตรีมตัวอย่างของ Telegram ใช้ข้อความตัวอย่างเพียงข้อความเดียวที่ถูกแก้ไขในที่เดิม
- `channels.telegram.streaming.preview.toolProgress`: ใช้ข้อความตัวอย่างแบบ live เดิมซ้ำสำหรับการอัปเดต tool/progress เมื่อเปิดใช้ preview streaming (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อเก็บข้อความ tool/progress แยกต่างหาก
- `channels.telegram.mediaMaxMb`: ขีดจำกัดสื่อ Telegram ขาเข้า/ขาออก (MB, ค่าเริ่มต้น: 100)
- `channels.telegram.retry`: นโยบาย retry สำหรับตัวช่วยส่งของ Telegram (CLI/tools/actions) เมื่อเกิดข้อผิดพลาด API ขาออกที่กู้คืนได้ (attempts, minDelayMs, maxDelayMs, jitter)
- `channels.telegram.network.autoSelectFamily`: override ค่า autoSelectFamily ของ Node (true=เปิด, false=ปิด) ค่าเริ่มต้นคือเปิดบน Node 22+ โดย WSL2 จะปิดเป็นค่าเริ่มต้น
- `channels.telegram.network.dnsResultOrder`: override ลำดับผลลัพธ์ DNS (`ipv4first` หรือ `verbatim`) ค่าเริ่มต้นคือ `ipv4first` บน Node 22+
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: ตัวเลือกอันตรายสำหรับสภาพแวดล้อม fake-IP หรือ transparent-proxy ที่เชื่อถือได้ ซึ่งการดาวน์โหลดสื่อของ Telegram resolve `api.telegram.org` ไปเป็นที่อยู่ private/internal/special-use นอกเหนือจากช่วง benchmark ตาม RFC 2544 ที่อนุญาตโดยค่าเริ่มต้น
- `channels.telegram.proxy`: proxy URL สำหรับการเรียก Bot API (SOCKS/HTTP)
- `channels.telegram.webhookUrl`: เปิดใช้โหมด Webhook (ต้องมี `channels.telegram.webhookSecret`)
- `channels.telegram.webhookSecret`: secret ของ Webhook (จำเป็นเมื่อมีการตั้งค่า webhookUrl)
- `channels.telegram.webhookPath`: พาธ Webhook ภายในเครื่อง (ค่าเริ่มต้น `/telegram-webhook`)
- `channels.telegram.webhookHost`: โฮสต์ bind ของ Webhook ภายในเครื่อง (ค่าเริ่มต้น `127.0.0.1`)
- `channels.telegram.webhookPort`: พอร์ต bind ของ Webhook ภายในเครื่อง (ค่าเริ่มต้น `8787`)
- `channels.telegram.actions.reactions`: ควบคุมการเปิดใช้ reaction ของเครื่องมือ Telegram
- `channels.telegram.actions.sendMessage`: ควบคุมการเปิดใช้การส่งข้อความของเครื่องมือ Telegram
- `channels.telegram.actions.deleteMessage`: ควบคุมการเปิดใช้การลบข้อความของเครื่องมือ Telegram
- `channels.telegram.actions.sticker`: ควบคุมการเปิดใช้ action ของสติกเกอร์ Telegram — ส่งและค้นหา (ค่าเริ่มต้น: false)
- `channels.telegram.reactionNotifications`: `off | own | all` — ควบคุมว่า reaction ใดจะกระตุ้น system event (ค่าเริ่มต้น: `own` หากไม่ได้ตั้งค่า)
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — ควบคุมความสามารถด้าน reaction ของเอเจนต์ (ค่าเริ่มต้น: `minimal` หากไม่ได้ตั้งค่า)
- `channels.telegram.errorPolicy`: `reply | silent` — ควบคุมพฤติกรรมการตอบกลับข้อผิดพลาด (ค่าเริ่มต้น: `reply`) รองรับการ override รายบัญชี/รายกลุ่ม/ราย topic
- `channels.telegram.errorCooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดในแชตเดียวกัน (ค่าเริ่มต้น: `60000`) ป้องกันสแปมข้อผิดพลาดระหว่างระบบขัดข้อง

- [เอกสารอ้างอิงการกำหนดค่า - Telegram](/th/gateway/configuration-reference#telegram)

ฟิลด์สำคัญเฉพาะ Telegram:

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; ระบบจะปฏิเสธ symlink)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- เธรด/การตอบกลับ: `replyToMode`
- การสตรีม: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่งมอบ: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- action/ความสามารถ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## ที่เกี่ยวข้อง

- [Pairing](/th/channels/pairing)
- [Groups](/th/channels/groups)
- [ความปลอดภัย](/th/gateway/security)
- [Channel routing](/th/channels/channel-routing)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การแก้ไขปัญหา](/th/channels/troubleshooting)
