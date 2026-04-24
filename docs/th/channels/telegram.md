---
read_when:
    - กำลังทำงานกับฟีเจอร์หรือ Webhook ของ Telegram
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าสำหรับ Telegram bot
title: Telegram
x-i18n:
    generated_at: "2026-04-24T08:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdd6ea0277e074f90306f91d51fd329c6914de85dde0ae09a731713f1bba98d9
    source_path: channels/telegram.md
    workflow: 15
---

พร้อมใช้งานระดับ production สำหรับบอต DM และกลุ่มผ่าน grammY โดยค่าเริ่มต้นจะใช้โหมด long polling; โหมด webhook เป็นตัวเลือกเสริม

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    นโยบาย DM เริ่มต้นสำหรับ Telegram คือ pairing
  </Card>
  <Card title="การแก้ไขปัญหาช่องทาง" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทางและคู่มือการซ่อมแซม
  </Card>
  <Card title="การกำหนดค่า Gateway" icon="settings" href="/th/gateway/configuration">
    รูปแบบและตัวอย่าง config ของช่องทางแบบเต็ม
  </Card>
</CardGroup>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="สร้าง bot token ใน BotFather">
    เปิด Telegram แล้วแชตกับ **@BotFather** (ยืนยันว่า handle คือ `@BotFather` ตรงตัว)

    รัน `/newbot` ทำตามพรอมป์ และบันทึก token ไว้

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

    env fallback: `TELEGRAM_BOT_TOKEN=...` (บัญชีค่าเริ่มต้นเท่านั้น)
    Telegram **ไม่** ใช้ `openclaw channels login telegram`; ให้กำหนดค่า token ใน config/env แล้วจึงเริ่ม Gateway

  </Step>

  <Step title="เริ่ม Gateway และอนุมัติ DM แรก">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    รหัส pairing จะหมดอายุหลังจาก 1 ชั่วโมง

  </Step>

  <Step title="เพิ่มบอตเข้ากลุ่ม">
    เพิ่มบอตเข้าไปในกลุ่มของคุณ แล้วตั้งค่า `channels.telegram.groups` และ `groupPolicy` ให้ตรงกับโมเดลการเข้าถึงของคุณ
  </Step>
</Steps>

<Note>
ลำดับการ resolve token รับรู้ตามบัญชี ในทางปฏิบัติ ค่าจาก config จะมีลำดับความสำคัญสูงกว่า env fallback และ `TELEGRAM_BOT_TOKEN` ใช้กับบัญชีค่าเริ่มต้นเท่านั้น
</Note>

## การตั้งค่าฝั่ง Telegram

<AccordionGroup>
  <Accordion title="Privacy mode และการมองเห็นในกลุ่ม">
    โดยค่าเริ่มต้น Telegram bot จะใช้ **Privacy Mode** ซึ่งจำกัดข้อความกลุ่มที่บอตได้รับ

    หากบอตต้องเห็นข้อความทั้งหมดในกลุ่ม ให้ทำอย่างใดอย่างหนึ่งต่อไปนี้:

    - ปิด privacy mode ผ่าน `/setprivacy` หรือ
    - ทำให้บอตเป็นแอดมินของกลุ่ม

    เมื่อสลับ privacy mode ให้ลบบอตออกแล้วเพิ่มกลับเข้าไปใหม่ในแต่ละกลุ่ม เพื่อให้ Telegram ใช้การเปลี่ยนแปลงนั้น

  </Accordion>

  <Accordion title="สิทธิ์ของกลุ่ม">
    สถานะแอดมินถูกควบคุมในหน้าการตั้งค่ากลุ่มของ Telegram

    บอตที่เป็นแอดมินจะได้รับข้อความทั้งหมดของกลุ่ม ซึ่งมีประโยชน์สำหรับพฤติกรรมกลุ่มแบบ always-on

  </Accordion>

  <Accordion title="ตัวเลือก BotFather ที่มีประโยชน์">

    - `/setjoingroups` เพื่ออนุญาต/ปฏิเสธการเพิ่มเข้ากลุ่ม
    - `/setprivacy` สำหรับพฤติกรรมการมองเห็นในกลุ่ม

  </Accordion>
</AccordionGroup>

## การควบคุมการเข้าถึงและการเปิดใช้งาน

<Tabs>
  <Tab title="นโยบาย DM">
    `channels.telegram.dmPolicy` ควบคุมการเข้าถึงข้อความโดยตรง:

    - `pairing` (ค่าเริ่มต้น)
    - `allowlist` (ต้องมี sender ID อย่างน้อยหนึ่งรายการใน `allowFrom`)
    - `open` (ต้องมี `"*"` อยู่ใน `allowFrom`)
    - `disabled`

    `channels.telegram.allowFrom` รองรับ Telegram user ID แบบตัวเลข โดยยอมรับ prefix `telegram:` / `tg:` และจะ normalize ให้
    `dmPolicy: "allowlist"` ที่มี `allowFrom` ว่างจะบล็อก DM ทั้งหมดและจะถูกปฏิเสธโดยการตรวจสอบ config
    ขั้นตอนการตั้งค่าจะขอเฉพาะ user ID แบบตัวเลขเท่านั้น
    หากคุณอัปเกรดแล้วใน config มีรายการ allowlist แบบ `@username` ให้รัน `openclaw doctor --fix` เพื่อแก้ไข (best-effort; ต้องมี Telegram bot token)
    หากก่อนหน้านี้คุณอาศัยไฟล์ allowlist ของ pairing store, `openclaw doctor --fix` สามารถกู้รายการกลับเข้า `channels.telegram.allowFrom` ในโฟลว์ allowlist ได้ (เช่น เมื่อ `dmPolicy: "allowlist"` ยังไม่มี explicit ID)

    สำหรับบอตเจ้าของคนเดียว ควรใช้ `dmPolicy: "allowlist"` ร่วมกับ `allowFrom` แบบตัวเลขที่ระบุชัดเจน เพื่อให้นโยบายการเข้าถึงคงอยู่ใน config อย่างถาวร (แทนที่จะพึ่งการอนุมัติ pairing ก่อนหน้า)

    ความสับสนที่พบบ่อย: การอนุมัติ DM pairing ไม่ได้หมายความว่า "ผู้ส่งคนนี้ได้รับอนุญาตทุกที่"
    pairing ให้สิทธิ์เฉพาะการเข้าถึง DM เท่านั้น การอนุญาตผู้ส่งในกลุ่มยังคงมาจาก allowlist ใน config ที่ระบุไว้อย่างชัดเจน
    หากคุณต้องการให้ "ฉันได้รับอนุญาตครั้งเดียว แล้วทั้ง DM และคำสั่งในกลุ่มก็ใช้งานได้" ให้ใส่ Telegram user ID แบบตัวเลขของคุณไว้ใน `channels.telegram.allowFrom`

    ### การค้นหา Telegram user ID ของคุณ

    วิธีที่ปลอดภัยกว่า (ไม่ใช้บอตบุคคลที่สาม):

    1. ส่ง DM ไปหาบอตของคุณ
    2. รัน `openclaw logs --follow`
    3. อ่านค่า `from.id`

    วิธีอย่างเป็นทางการผ่าน Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    วิธีผ่านบุคคลที่สาม (ความเป็นส่วนตัวน้อยกว่า): `@userinfobot` หรือ `@getidsbot`

  </Tab>

  <Tab title="นโยบายกลุ่มและ allowlist">
    มีตัวควบคุมสองส่วนที่ใช้ร่วมกัน:

    1. **กลุ่มใดได้รับอนุญาตบ้าง** (`channels.telegram.groups`)
       - ไม่มี config `groups`:
         - เมื่อ `groupPolicy: "open"`: กลุ่มใดก็ได้สามารถผ่านการตรวจสอบ group-ID
         - เมื่อ `groupPolicy: "allowlist"` (ค่าเริ่มต้น): กลุ่มจะถูกบล็อกจนกว่าคุณจะเพิ่มรายการใน `groups` (หรือ `"*"`)
       - มีการกำหนดค่า `groups`: จะทำหน้าที่เป็น allowlist (ID แบบ explicit หรือ `"*"`)

    2. **ผู้ส่งใดได้รับอนุญาตในกลุ่มบ้าง** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (ค่าเริ่มต้น)
       - `disabled`

    `groupAllowFrom` ใช้สำหรับการกรองผู้ส่งในกลุ่ม หากไม่ได้ตั้งค่า Telegram จะ fallback ไปใช้ `allowFrom`
    รายการใน `groupAllowFrom` ควรเป็น Telegram user ID แบบตัวเลข (prefix `telegram:` / `tg:` จะถูก normalize)
    อย่าใส่ Telegram group หรือ supergroup chat ID ลงใน `groupAllowFrom` negative chat ID ควรอยู่ภายใต้ `channels.telegram.groups`
    รายการที่ไม่ใช่ตัวเลขจะถูกเพิกเฉยสำหรับการอนุญาตผู้ส่ง
    ขอบเขตด้านความปลอดภัย (`2026.2.25+`): การยืนยันตัวตนผู้ส่งในกลุ่มจะ **ไม่** สืบทอดการอนุมัติจาก DM pairing store
    pairing ยังคงเป็น DM-only สำหรับกลุ่ม ให้ตั้ง `groupAllowFrom` หรือ `allowFrom` แบบรายกลุ่ม/รายหัวข้อ
    หากไม่ได้ตั้ง `groupAllowFrom` Telegram จะ fallback ไปใช้ `allowFrom` จาก config ไม่ใช่ pairing store
    รูปแบบที่ใช้ได้จริงสำหรับบอตเจ้าของคนเดียว: ใส่ user ID ของคุณใน `channels.telegram.allowFrom`, ปล่อย `groupAllowFrom` ว่างไว้ และอนุญาตกลุ่มเป้าหมายภายใต้ `channels.telegram.groups`
    หมายเหตุขณะรัน: หากไม่มี `channels.telegram` เลย ขณะรันจะใช้ค่าเริ่มต้นแบบ fail-closed เป็น `groupPolicy="allowlist"` เว้นแต่จะมีการตั้ง `channels.defaults.groupPolicy` ไว้อย่างชัดเจน

    ตัวอย่าง: อนุญาตสมาชิกคนใดก็ได้ในกลุ่มที่ระบุหนึ่งกลุ่ม:

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

    ตัวอย่าง: อนุญาตเฉพาะผู้ใช้บางคนภายในกลุ่มที่ระบุหนึ่งกลุ่ม:

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

      - ให้วาง Telegram group หรือ supergroup chat ID แบบลบ เช่น `-1001234567890` ไว้ภายใต้ `channels.telegram.groups`
      - ให้วาง Telegram user ID เช่น `8734062810` ไว้ภายใต้ `groupAllowFrom` เมื่อคุณต้องการจำกัดว่าคนใดภายในกลุ่มที่ได้รับอนุญาตสามารถทริกเกอร์บอตได้
      - ใช้ `groupAllowFrom: ["*"]` เฉพาะเมื่อคุณต้องการให้สมาชิกคนใดก็ได้ของกลุ่มที่ได้รับอนุญาตสามารถคุยกับบอตได้
    </Warning>

  </Tab>

  <Tab title="พฤติกรรมการกล่าวถึง">
    โดยค่าเริ่มต้น การตอบกลับในกลุ่มต้องมีการกล่าวถึง

    การกล่าวถึงอาจมาจาก:

    - การกล่าวถึง `@botusername` แบบเนทีฟ หรือ
    - รูปแบบการกล่าวถึงใน:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    การสลับคำสั่งระดับเซสชัน:

    - `/activation always`
    - `/activation mention`

    สิ่งเหล่านี้จะอัปเดตเฉพาะสถานะของเซสชันเท่านั้น ใช้ config หากต้องการให้คงอยู่ถาวร

    ตัวอย่าง config แบบถาวร:

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

    การค้นหา group chat ID:

    - ส่งต่อข้อความของกลุ่มไปยัง `@userinfobot` / `@getidsbot`
    - หรืออ่าน `chat.id` จาก `openclaw logs --follow`
    - หรือตรวจสอบ Bot API `getUpdates`

  </Tab>
</Tabs>

## พฤติกรรมขณะรัน

- Telegram ถูกดูแลโดยโปรเซส Gateway
- การกำหนดเส้นทางเป็นแบบกำหนดแน่นอน: ข้อความตอบกลับขาเข้าจาก Telegram จะตอบกลับไปยัง Telegram (โมเดลไม่ได้เลือกช่องทาง)
- ข้อความขาเข้าจะถูก normalize ไปเป็น shared channel envelope พร้อม metadata ของการตอบกลับและ placeholder ของสื่อ
- เซสชันกลุ่มถูกแยกด้วย group ID สำหรับ forum topics จะต่อท้ายด้วย `:topic:<threadId>` เพื่อแยกหัวข้อออกจากกัน
- ข้อความ DM สามารถมี `message_thread_id`; OpenClaw จะกำหนดเส้นทางด้วย session key ที่รับรู้ thread และคง thread ID ไว้สำหรับการตอบกลับ
- long polling ใช้ grammY runner พร้อมการจัดลำดับต่อแชต/ต่อเธรด ส่วน concurrency รวมของ runner sink ใช้ `agents.defaults.maxConcurrent`
- ทริกเกอร์รีสตาร์ต watchdog ของ long polling จะทำงานหลังจากไม่มี completed `getUpdates` liveness เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อ deployment ของคุณยังพบการรีสตาร์ต polling-stall ผิดพลาดระหว่างงานที่ใช้เวลานาน ค่านี้เป็นมิลลิวินาที และอนุญาตตั้งแต่ `30000` ถึง `600000`; รองรับ override แยกตามบัญชี
- Telegram Bot API ไม่มีการรองรับ read-receipt (`sendReadReceipts` ใช้ไม่ได้)

## เอกสารอ้างอิงฟีเจอร์

<AccordionGroup>
  <Accordion title="พรีวิวสตรีมแบบสด (แก้ไขข้อความ)">
    OpenClaw สามารถสตรีมการตอบกลับบางส่วนแบบเรียลไทม์ได้:

    - แชตโดยตรง: ข้อความพรีวิว + `editMessageText`
    - กลุ่ม/หัวข้อ: ข้อความพรีวิว + `editMessageText`

    ข้อกำหนด:

    - `channels.telegram.streaming` เป็น `off | partial | block | progress` (ค่าเริ่มต้น: `partial`)
    - `progress` จะถูกแมปเป็น `partial` บน Telegram (เพื่อความเข้ากันได้กับการตั้งชื่อข้ามช่องทาง)
    - `streaming.preview.toolProgress` ควบคุมว่าการอัปเดต tool/progress จะใช้ข้อความพรีวิวที่แก้ไขเดียวกันซ้ำหรือไม่ (ค่าเริ่มต้น: `true`) ตั้งค่าเป็น `false` เพื่อคงข้อความ tool/progress แยกต่างหาก
    - ค่าเดิม `channels.telegram.streamMode` และค่า boolean `streaming` จะถูกแมปให้อัตโนมัติ

    สำหรับการตอบกลับแบบข้อความล้วน:

    - DM: OpenClaw จะคงข้อความพรีวิวเดิมไว้และทำ final edit ในตำแหน่งเดิม (ไม่มีข้อความที่สอง)
    - กลุ่ม/หัวข้อ: OpenClaw จะคงข้อความพรีวิวเดิมไว้และทำ final edit ในตำแหน่งเดิม (ไม่มีข้อความที่สอง)

    สำหรับการตอบกลับที่ซับซ้อน (เช่น media payload) OpenClaw จะ fallback ไปใช้การส่ง final delivery แบบปกติ แล้วจึงล้างข้อความพรีวิว

    preview streaming แยกจาก block streaming เมื่อมีการเปิด block streaming อย่างชัดเจนสำหรับ Telegram, OpenClaw จะข้าม preview stream เพื่อหลีกเลี่ยงการสตรีมซ้ำซ้อน

    หาก native draft transport ใช้งานไม่ได้/ถูกปฏิเสธ OpenClaw จะ fallback ไปใช้ `sendMessage` + `editMessageText` โดยอัตโนมัติ

    reasoning stream เฉพาะ Telegram:

    - `/reasoning stream` จะส่ง reasoning ไปยังพรีวิวแบบสดระหว่างการสร้าง
    - คำตอบสุดท้ายจะถูกส่งโดยไม่มีข้อความ reasoning

  </Accordion>

  <Accordion title="การจัดรูปแบบและ HTML fallback">
    ข้อความขาออกใช้ Telegram `parse_mode: "HTML"`

    - ข้อความลักษณะ Markdown จะถูกเรนเดอร์เป็น HTML ที่ปลอดภัยสำหรับ Telegram
    - HTML ดิบจากโมเดลจะถูก escape เพื่อลดความล้มเหลวในการ parse ของ Telegram
    - หาก Telegram ปฏิเสธ HTML ที่ parse แล้ว OpenClaw จะลองใหม่เป็นข้อความล้วน

    พรีวิวลิงก์ถูกเปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดได้ด้วย `channels.telegram.linkPreview: false`

  </Accordion>

  <Accordion title="คำสั่งแบบเนทีฟและคำสั่งกำหนดเอง">
    การลงทะเบียนเมนูคำสั่งของ Telegram จะจัดการตอนเริ่มต้นด้วย `setMyCommands`

    ค่าเริ่มต้นของคำสั่งแบบเนทีฟ:

    - `commands.native: "auto"` เปิดใช้งานคำสั่งแบบเนทีฟสำหรับ Telegram

    เพิ่มรายการเมนูคำสั่งแบบกำหนดเอง:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "สำรองข้อมูล Git" },
        { command: "generate", description: "สร้างรูปภาพ" },
      ],
    },
  },
}
```

    กฎ:

    - ชื่อจะถูก normalize (ตัด `/` นำหน้าออก, เป็นตัวพิมพ์เล็ก)
    - รูปแบบที่ถูกต้อง: `a-z`, `0-9`, `_`, ความยาว `1..32`
    - คำสั่งกำหนดเองไม่สามารถ override คำสั่งแบบเนทีฟได้
    - ความขัดแย้ง/รายการซ้ำจะถูกข้ามและบันทึกลงล็อก

    หมายเหตุ:

    - คำสั่งกำหนดเองเป็นเพียงรายการในเมนูเท่านั้น; ไม่ได้ติดตั้งพฤติกรรมให้อัตโนมัติ
    - คำสั่งของ Plugin/Skills ยังสามารถทำงานได้เมื่อพิมพ์เอง แม้จะไม่แสดงในเมนู Telegram

    หากปิดใช้งานคำสั่งแบบเนทีฟ คำสั่งในตัวจะถูกลบออก คำสั่งแบบกำหนดเอง/Plugin อาจยังลงทะเบียนได้หากมีการกำหนดค่าไว้

    ความล้มเหลวในการตั้งค่าที่พบบ่อย:

    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนู Telegram ยังล้นอยู่แม้หลังจากตัดรายการแล้ว; ให้ลดจำนวนคำสั่งจาก Plugin/Skills/คำสั่งกำหนดเอง หรือปิด `channels.telegram.commands.native`
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch โดยทั่วไปหมายความว่า outbound DNS/HTTPS ไปยัง `api.telegram.org` ถูกบล็อก

    ### คำสั่ง Pairing อุปกรณ์ (`device-pair` Plugin)

    เมื่อติดตั้ง Plugin `device-pair` แล้ว:

    1. `/pair` จะสร้างรหัสตั้งค่า
    2. วางรหัสดังกล่าวในแอป iOS
    3. `/pair pending` แสดงรายการคำขอที่กำลังรอ (รวมถึง role/scopes)
    4. อนุมัติคำขอ:
       - `/pair approve <requestId>` สำหรับการอนุมัติแบบระบุชัดเจน
       - `/pair approve` เมื่อมีคำขอที่รออยู่เพียงหนึ่งรายการ
       - `/pair approve latest` สำหรับรายการล่าสุด

    รหัสตั้งค่าจะมี bootstrap token แบบอายุสั้นติดมาด้วย การส่งต่อ bootstrap ในตัวจะคง primary node token ไว้ที่ `scopes: []`; operator token ที่ถูกส่งต่อจะยังคงถูกจำกัดอยู่ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write` การตรวจสอบ scope ของ bootstrap จะมี prefix ตาม role ดังนั้น allowlist ของ operator นั้นจะตอบสนองได้เฉพาะคำขอของ operator เท่านั้น; role ที่ไม่ใช่ operator ยังต้องมี scope ภายใต้ prefix ของ role ตนเอง

    หากอุปกรณ์ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป (เช่น role/scopes/public key) คำขอที่รอก่อนหน้าจะถูกแทนที่ และคำขอใหม่จะใช้ `requestId` คนละตัว ให้รัน `/pair pending` ใหม่ก่อนอนุมัติ

    รายละเอียดเพิ่มเติม: [Pairing](/th/channels/pairing#pair-via-telegram-recommended-for-ios)

  </Accordion>

  <Accordion title="ปุ่ม Inline">
    กำหนดค่า scope ของ inline keyboard:

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

    override แยกตามบัญชี:

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

    Scope:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (ค่าเริ่มต้น)

    ค่าเดิม `capabilities: ["inlineButtons"]` จะถูกแมปเป็น `inlineButtons: "all"`.

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

    การคลิก callback จะถูกส่งต่อให้เอเจนต์เป็นข้อความ:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions สำหรับเอเจนต์และ Automation">
    Telegram tool actions ประกอบด้วย:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Channel message actions มี alias ที่ใช้งานสะดวก (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)

    ตัวควบคุมการกำหนดสิทธิ์:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (ค่าเริ่มต้น: ปิดใช้งาน)

    หมายเหตุ: `edit` และ `topic-create` เปิดใช้งานอยู่โดยค่าเริ่มต้นในปัจจุบัน และยังไม่มี toggle `channels.telegram.actions.*` แยกต่างหาก
    การส่งขณะรันจะใช้ snapshot ของ config/secrets ที่กำลังใช้งานอยู่ (startup/reload) ดังนั้นเส้นทาง action จะไม่ทำ SecretRef re-resolution แบบ ad-hoc แยกในแต่ละครั้งที่ส่ง

    ความหมายของการลบ reaction: [/tools/reactions](/th/tools/reactions)

  </Accordion>

  <Accordion title="แท็กการตอบกลับแบบเธรด">
    Telegram รองรับแท็กการตอบกลับแบบเธรดอย่างชัดเจนในเอาต์พุตที่สร้างขึ้น:

    - `[[reply_to_current]]` ตอบกลับข้อความที่เป็นตัวทริกเกอร์
    - `[[reply_to:<id>]]` ตอบกลับ Telegram message ID ที่ระบุ

    `channels.telegram.replyToMode` ควบคุมการจัดการ:

    - `off` (ค่าเริ่มต้น)
    - `first`
    - `all`

    หมายเหตุ: `off` จะปิดใช้งานการตอบกลับแบบเธรดโดยปริยาย แต่แท็ก `[[reply_to_*]]` แบบ explicit จะยังคงถูกใช้งาน

  </Accordion>

  <Accordion title="Forum topics และพฤติกรรมของเธรด">
    Forum supergroups:

    - คีย์เซสชันของ topic จะต่อท้ายด้วย `:topic:<threadId>`
    - การตอบกลับและการพิมพ์จะกำหนดเป้าหมายไปยังเธรดของ topic
    - พาธ config ของ topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    กรณีพิเศษของ General topic (`threadId=1`):

    - การส่งข้อความจะละ `message_thread_id` ออก (Telegram ปฏิเสธ `sendMessage(...thread_id=1)`)
    - action การพิมพ์จะยังคงมี `message_thread_id`

    การสืบทอดของ topic: รายการ topic จะสืบทอดการตั้งค่าของกลุ่ม เว้นแต่จะมีการ override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)
    `agentId` เป็นระดับ topic เท่านั้นและจะไม่สืบทอดจากค่าเริ่มต้นของกลุ่ม

    **การกำหนดเส้นทางเอเจนต์ราย topic**: แต่ละ topic สามารถกำหนดเส้นทางไปยังเอเจนต์คนละตัวได้โดยตั้ง `agentId` ใน config ของ topic วิธีนี้ทำให้แต่ละ topic มี workspace, memory และ session แยกเป็นอิสระของตัวเอง ตัวอย่าง:

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

    แต่ละ topic จะมี session key ของตัวเอง: `agent:zu:telegram:group:-1001234567890:topic:3`

    **การผูก ACP ของ topic แบบคงอยู่**: Forum topics สามารถปักหมุดเซสชัน ACP harness ผ่านการผูก ACP แบบ typed ระดับบนสุด (`bindings[]` ที่มี `type: "acp"` และ `match.channel: "telegram"`, `peer.kind: "group"` และ id ที่มีการระบุ topic เช่น `-1001234567890:topic:42`) ขณะนี้จำกัดขอบเขตอยู่ที่ forum topics ใน groups/supergroups ดู [ACP Agents](/th/tools/acp-agents)

    **ACP spawn ที่ผูกกับเธรดจากแชต**: `/acp spawn <agent> --thread here|auto` จะผูก topic ปัจจุบันเข้ากับเซสชัน ACP ใหม่; การติดตามผลจะถูกกำหนดเส้นทางไปที่นั่นโดยตรง OpenClaw จะปักหมุดข้อความยืนยันการ spawn ไว้ภายใน topic ต้องใช้ `channels.telegram.threadBindings.spawnAcpSessions=true`

    บริบทของเทมเพลตจะแสดง `MessageThreadId` และ `IsForum` แชต DM ที่มี `message_thread_id` จะยังคงใช้เส้นทาง DM แต่จะใช้ session key ที่รับรู้ thread

  </Accordion>

  <Accordion title="เสียง วิดีโอ และสติกเกอร์">
    ### ข้อความเสียง

    Telegram แยกความแตกต่างระหว่าง voice note กับไฟล์เสียง

    - ค่าเริ่มต้น: พฤติกรรมแบบไฟล์เสียง
    - แท็ก `[[audio_as_voice]]` ในคำตอบของเอเจนต์เพื่อบังคับให้ส่งเป็น voice note

    ตัวอย่าง message action:

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

    ตัวอย่าง message action:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video note ไม่รองรับคำบรรยายใต้ภาพ; ข้อความที่ให้มาจะถูกส่งแยกต่างหาก

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

    ไฟล์แคชสติกเกอร์:

    - `~/.openclaw/telegram/sticker-cache.json`

    สติกเกอร์จะถูกอธิบายหนึ่งครั้ง (เมื่อเป็นไปได้) และแคชไว้เพื่อลดการเรียก vision ซ้ำ

    เปิดใช้งาน sticker actions:

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

    ส่ง sticker action:

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

  <Accordion title="การแจ้งเตือนการรีแอ็กชัน">
    การรีแอ็กชันของ Telegram จะมาถึงในรูปแบบอัปเดต `message_reaction` (แยกจาก payload ของข้อความ)

    เมื่อเปิดใช้งาน OpenClaw จะใส่งานระบบเข้าคิว เช่น:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (ค่าเริ่มต้น: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (ค่าเริ่มต้น: `minimal`)

    หมายเหตุ:

    - `own` หมายถึงเฉพาะการรีแอ็กชันของผู้ใช้ต่อข้อความที่บอตส่งเท่านั้น (best-effort ผ่าน sent-message cache)
    - เหตุการณ์การรีแอ็กชันยังคงเคารพการควบคุมการเข้าถึงของ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ผู้ส่งที่ไม่ได้รับอนุญาตจะถูกทิ้ง
    - Telegram ไม่ให้ thread ID มาในอัปเดตการรีแอ็กชัน
      - กลุ่มที่ไม่ใช่ forum จะถูกกำหนดเส้นทางไปยังเซสชันแชตกลุ่ม
      - กลุ่ม forum จะถูกกำหนดเส้นทางไปยังเซสชัน general-topic ของกลุ่ม (`:topic:1`) ไม่ใช่ topic ต้นทางที่แน่นอน

    `allowed_updates` สำหรับ polling/webhook จะรวม `message_reaction` โดยอัตโนมัติ

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` จะส่งอีโมจิยืนยันระหว่างที่ OpenClaw กำลังประมวลผลข้อความขาเข้า

    ลำดับการ resolve:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback ไปใช้อีโมจิจาก identity ของเอเจนต์ (`agents.list[].identity.emoji`, มิฉะนั้นใช้ "👀")

    หมายเหตุ:

    - Telegram คาดหวังอีโมจิแบบ unicode (เช่น "👀")
    - ใช้ `""` เพื่อปิดใช้งาน reaction สำหรับช่องทางหรือบัญชี

  </Accordion>

  <Accordion title="การเขียน config จากเหตุการณ์และคำสั่งของ Telegram">
    การเขียน config ของช่องทางเปิดใช้งานอยู่โดยค่าเริ่มต้น (`configWrites !== false`)

    การเขียนที่ทริกเกอร์จาก Telegram รวมถึง:

    - เหตุการณ์การย้ายกลุ่ม (`migrate_to_chat_id`) เพื่ออัปเดต `channels.telegram.groups`
    - `/config set` และ `/config unset` (ต้องเปิดใช้งานคำสั่ง)

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
    ค่าเริ่มต้นคือ long polling สำหรับโหมด webhook ให้ตั้ง `channels.telegram.webhookUrl` และ `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` เป็นตัวเลือกเสริม (ค่าเริ่มต้น `/telegram-webhook`, `127.0.0.1`, `8787`)

    ตัวรับฟังในเครื่องจะ bind กับ `127.0.0.1:8787` สำหรับ public ingress ให้ตั้ง reverse proxy ไว้หน้าพอร์ตภายในเครื่อง หรือจงใจตั้ง `webhookHost: "0.0.0.0"`

  </Accordion>

  <Accordion title="ขีดจำกัด การลองใหม่ และเป้าหมาย CLI">
    - ค่าเริ่มต้นของ `channels.telegram.textChunkLimit` คือ 4000
    - `channels.telegram.chunkMode="newline"` จะให้ความสำคัญกับขอบเขตย่อหน้า (บรรทัดว่าง) ก่อนการแบ่งตามความยาว
    - `channels.telegram.mediaMaxMb` (ค่าเริ่มต้น 100) จำกัดขนาดสื่อ Telegram ทั้งขาเข้าและขาออก
    - `channels.telegram.timeoutSeconds` ใช้ override timeout ของ Telegram API client (หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของ grammY)
    - `channels.telegram.pollingStallThresholdMs` มีค่าเริ่มต้นเป็น `120000`; ปรับในช่วง `30000` ถึง `600000` เฉพาะกรณีการรีสตาร์ต polling-stall แบบ false positive
    - ประวัติบริบทกลุ่มใช้ `channels.telegram.historyLimit` หรือ `messages.groupChat.historyLimit` (ค่าเริ่มต้น 50); `0` คือปิดใช้งาน
    - บริบทเสริมจากการตอบกลับ/อ้างอิง/ส่งต่อ ปัจจุบันจะถูกส่งผ่านตามที่ได้รับ
    - allowlist ของ Telegram ใช้กำหนดหลัก ๆ ว่าใครสามารถทริกเกอร์เอเจนต์ได้ ไม่ใช่ขอบเขตการปกปิดบริบทเสริมแบบเต็มรูปแบบ
    - ตัวควบคุมประวัติ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` ใช้กับตัวช่วยส่งของ Telegram (CLI/tools/actions) สำหรับข้อผิดพลาด API ขาออกที่กู้คืนได้

    เป้าหมายการส่งของ CLI สามารถเป็น chat ID แบบตัวเลขหรือ username ได้:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram poll ใช้ `openclaw message poll` และรองรับ forum topics:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    แฟล็ก poll เฉพาะ Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` สำหรับ forum topics (หรือใช้เป้าหมายแบบ `:topic:`)

    การส่งบน Telegram ยังรองรับ:

    - `--presentation` พร้อมบล็อก `buttons` สำหรับ inline keyboard เมื่อ `channels.telegram.capabilities.inlineButtons` อนุญาต
    - `--pin` หรือ `--delivery '{"pin":true}'` เพื่อขอให้ปักหมุดข้อความเมื่อบอตมีสิทธิ์ปักหมุดในแชตนั้น
    - `--force-document` เพื่อส่งรูปภาพและ GIF ขาออกเป็นเอกสารแทนการอัปโหลดเป็นรูปภาพแบบบีบอัดหรือสื่อเคลื่อนไหว

    การกำหนดสิทธิ์ action:

    - `channels.telegram.actions.sendMessage=false` ปิดใช้งานข้อความ Telegram ขาออก รวมถึง poll
    - `channels.telegram.actions.poll=false` ปิดใช้งานการสร้าง poll บน Telegram โดยยังคงเปิดการส่งข้อความปกติ

  </Accordion>

  <Accordion title="การอนุมัติ Exec ใน Telegram">
    Telegram รองรับการอนุมัติ exec ใน DM ของผู้อนุมัติ และสามารถโพสต์พรอมป์แบบเลือกได้ในแชตหรือ topic ต้นทาง ผู้อนุมัติต้องเป็น Telegram user ID แบบตัวเลข

    พาธ config:

    - `channels.telegram.execApprovals.enabled` (จะเปิดใช้งานอัตโนมัติเมื่อ resolve ผู้อนุมัติได้อย่างน้อยหนึ่งคน)
    - `channels.telegram.execApprovals.approvers` (fallback ไปใช้ owner ID แบบตัวเลขจาก `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (ค่าเริ่มต้น) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    การส่งไปยังช่องทางจะแสดงข้อความคำสั่งในแชต; เปิดใช้ `channel` หรือ `both` เฉพาะในกลุ่ม/topics ที่เชื่อถือได้เท่านั้น เมื่อพรอมป์ไปอยู่ใน forum topic, OpenClaw จะคง topic ไว้ทั้งสำหรับพรอมป์อนุมัติและการติดตามผล การอนุมัติ exec จะหมดอายุหลังจาก 30 นาทีโดยค่าเริ่มต้น

    ปุ่มอนุมัติแบบ inline ยังต้องการให้ `channels.telegram.capabilities.inlineButtons` อนุญาตพื้นผิวเป้าหมาย (`dm`, `group` หรือ `all`) approval ID ที่ขึ้นต้นด้วย `plugin:` จะ resolve ผ่านการอนุมัติของ Plugin; รายการอื่นจะ resolve ผ่านการอนุมัติ exec ก่อน

    ดู [การอนุมัติ Exec](/th/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ตัวควบคุมการตอบกลับข้อผิดพลาด

เมื่อเอเจนต์พบข้อผิดพลาดในการส่งหรือข้อผิดพลาดจากผู้ให้บริการ Telegram สามารถเลือกตอบกลับด้วยข้อความข้อผิดพลาดหรือไม่แสดงอะไรเลยได้ โดยมีคีย์ config สองรายการที่ควบคุมพฤติกรรมนี้:

| คีย์ | ค่า | ค่าเริ่มต้น | คำอธิบาย |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` จะส่งข้อความข้อผิดพลาดที่เป็นมิตรกลับไปยังแชต `silent` จะระงับการตอบกลับข้อผิดพลาดทั้งหมด |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | เวลาขั้นต่ำระหว่างการตอบกลับข้อผิดพลาดในแชตเดียวกัน ช่วยป้องกันสแปมข้อผิดพลาดระหว่างช่วงที่ระบบขัดข้อง |

รองรับ override แยกตามบัญชี แยกตามกลุ่ม และแยกตาม topic (ใช้การสืบทอดแบบเดียวกับคีย์ config อื่น ๆ ของ Telegram)

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
  <Accordion title="บอตไม่ตอบข้อความกลุ่มที่ไม่มีการกล่าวถึง">

    - หาก `requireMention=false`, Telegram privacy mode ต้องอนุญาตการมองเห็นทั้งหมด
      - BotFather: `/setprivacy` -> Disable
      - จากนั้นลบ + เพิ่มบอตกลับเข้ากลุ่มใหม่
    - `openclaw channels status` จะเตือนเมื่อ config คาดหวังข้อความกลุ่มที่ไม่มีการกล่าวถึง
    - `openclaw channels status --probe` สามารถตรวจสอบ group ID แบบตัวเลขที่ระบุชัดเจนได้; wildcard `"*"` ไม่สามารถตรวจสอบการเป็นสมาชิกได้
    - การทดสอบเซสชันแบบรวดเร็ว: `/activation always`

  </Accordion>

  <Accordion title="บอตไม่เห็นข้อความกลุ่มเลย">

    - เมื่อมี `channels.telegram.groups` อยู่ กลุ่มนั้นต้องอยู่ในรายการ (หรือมี `"*"`)
    - ตรวจสอบว่าบอตเป็นสมาชิกของกลุ่ม
    - ตรวจสอบบันทึก: `openclaw logs --follow` เพื่อดูเหตุผลที่ถูกข้าม

  </Accordion>

  <Accordion title="คำสั่งทำงานได้บางส่วนหรือไม่ทำงานเลย">

    - อนุญาตตัวตนของผู้ส่งของคุณ (pairing และ/หรือ `allowFrom` แบบตัวเลข)
    - การอนุญาตคำสั่งยังคงมีผลแม้ `groupPolicy` จะเป็น `open`
    - `setMyCommands failed` พร้อม `BOT_COMMANDS_TOO_MUCH` หมายความว่าเมนูแบบเนทีฟมีรายการมากเกินไป; ให้ลดจำนวนคำสั่งจาก Plugin/Skill/คำสั่งกำหนดเอง หรือปิดเมนูแบบเนทีฟ
    - `setMyCommands failed` พร้อมข้อผิดพลาด network/fetch โดยทั่วไปบ่งชี้ว่ามีปัญหาการเข้าถึง DNS/HTTPS ไปยัง `api.telegram.org`

  </Accordion>

  <Accordion title="Polling หรือเครือข่ายไม่เสถียร">

    - Node 22+ + fetch/proxy แบบกำหนดเองอาจทำให้เกิดพฤติกรรม abort ทันทีหากชนิดของ AbortSignal ไม่ตรงกัน
    - โฮสต์บางแห่ง resolve `api.telegram.org` เป็น IPv6 ก่อน; หาก egress IPv6 เสีย อาจทำให้เกิดความล้มเหลวของ Telegram API เป็นช่วง ๆ
    - หากบันทึกมี `TypeError: fetch failed` หรือ `Network request for 'getUpdates' failed!`, ตอนนี้ OpenClaw จะลองใหม่กับข้อผิดพลาดเครือข่ายเหล่านี้ในฐานะข้อผิดพลาดที่กู้คืนได้
    - หากบันทึกมี `Polling stall detected`, OpenClaw จะรีสตาร์ต polling และสร้าง Telegram transport ใหม่หลังจากไม่มี completed long-poll liveness เป็นเวลา 120 วินาทีโดยค่าเริ่มต้น
    - เพิ่ม `channels.telegram.pollingStallThresholdMs` เฉพาะเมื่อการเรียก `getUpdates` ที่ใช้เวลานานยังทำงานปกติ แต่โฮสต์ของคุณยังรายงานการรีสตาร์ต polling-stall แบบ false positive การ stall อย่างต่อเนื่องมักชี้ไปที่ปัญหา proxy, DNS, IPv6 หรือ TLS egress ระหว่างโฮสต์กับ `api.telegram.org`
    - บนโฮสต์ VPS ที่ direct egress/TLS ไม่เสถียร ให้กำหนดเส้นทางการเรียก Telegram API ผ่าน `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ใช้ค่าเริ่มต้น `autoSelectFamily=true` (ยกเว้น WSL2) และ `dnsResultOrder=ipv4first`
    - หากโฮสต์ของคุณเป็น WSL2 หรือทำงานได้ดีกว่าอย่างชัดเจนเมื่อใช้พฤติกรรม IPv4-only ให้บังคับการเลือก family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - คำตอบในช่วง benchmark ตาม RFC 2544 (`198.18.0.0/15`) ได้รับอนุญาตแล้ว
      สำหรับการดาวน์โหลดสื่อของ Telegram โดยค่าเริ่มต้น หาก fake-IP ที่เชื่อถือได้หรือ
      transparent proxy เขียนทับ `api.telegram.org` ไปยังที่อยู่อื่น
      ที่เป็น private/internal/special-use ระหว่างการดาวน์โหลดสื่อ คุณสามารถเลือก
      เปิดใช้การ bypass เฉพาะ Telegram นี้ได้:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - ตัวเลือกเปิดใช้งานแบบเดียวกันนี้มีให้ใช้แยกตามบัญชีที่
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
    - หาก proxy ของคุณ resolve โฮสต์สื่อของ Telegram เป็น `198.18.x.x` ให้ปล่อย
      แฟล็กอันตรายนี้ปิดไว้ก่อน สื่อของ Telegram อนุญาตช่วง benchmark ตาม RFC 2544
      อยู่แล้วโดยค่าเริ่มต้น

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` จะทำให้การป้องกัน SSRF
      ของสื่อ Telegram อ่อนลง ใช้เฉพาะในสภาพแวดล้อม proxy ที่เชื่อถือได้และผู้ปฏิบัติการควบคุมได้
      เช่น fake-IP routing ของ Clash, Mihomo หรือ Surge เมื่อระบบเหล่านั้น
      สร้างคำตอบแบบ private หรือ special-use ที่อยู่นอกช่วง benchmark RFC 2544
      ปล่อยให้ปิดไว้สำหรับการเข้าถึง Telegram ผ่านอินเทอร์เน็ตสาธารณะตามปกติ
    </Warning>

    - env override (ชั่วคราว):
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

## เอกสารอ้างอิงการกำหนดค่า

เอกสารอ้างอิงหลัก: [เอกสารอ้างอิง Configuration - Telegram](/th/gateway/config-channels#telegram)

<Accordion title="ฟิลด์ Telegram ที่มีสัญญาณสูง">

- การเริ่มต้น/การยืนยันตัวตน: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` ต้องชี้ไปยังไฟล์ปกติ; Symlink จะถูกปฏิเสธ)
- การควบคุมการเข้าถึง: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ระดับบนสุด (`type: "acp"`)
- การอนุมัติ exec: `execApprovals`, `accounts.*.execApprovals`
- คำสั่ง/เมนู: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/การตอบกลับ: `replyToMode`
- การสตรีม: `streaming` (พรีวิว), `streaming.preview.toolProgress`, `blockStreaming`
- การจัดรูปแบบ/การส่ง: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- สื่อ/เครือข่าย: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- การรีแอ็กชัน: `reactionNotifications`, `reactionLevel`
- ข้อผิดพลาด: `errorPolicy`, `errorCooldownMs`
- การเขียน/ประวัติ: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
ลำดับความสำคัญแบบหลายบัญชี: เมื่อมีการกำหนด account ID ตั้งแต่สองรายการขึ้นไป ให้ตั้ง `channels.telegram.defaultAccount` (หรือรวม `channels.telegram.accounts.default`) เพื่อให้ default routing ชัดเจน มิฉะนั้น OpenClaw จะ fallback ไปใช้ account ID แรกที่ normalize แล้ว และ `openclaw doctor` จะเตือน บัญชีที่มีชื่อจะสืบทอด `channels.telegram.allowFrom` / `groupAllowFrom` แต่จะไม่สืบทอดค่าจาก `accounts.default.*`
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/th/channels/pairing">
    จับคู่ผู้ใช้ Telegram กับ Gateway
  </Card>
  <Card title="Groups" icon="users" href="/th/channels/groups">
    พฤติกรรม allowlist ของกลุ่มและ topic
  </Card>
  <Card title="การกำหนดเส้นทางช่องทาง" icon="route" href="/th/channels/channel-routing">
    กำหนดเส้นทางข้อความขาเข้าไปยังเอเจนต์
  </Card>
  <Card title="Security" icon="shield" href="/th/gateway/security">
    แบบจำลองภัยคุกคามและการทำให้แข็งแรงขึ้น
  </Card>
  <Card title="การกำหนดเส้นทางหลายเอเจนต์" icon="sitemap" href="/th/concepts/multi-agent">
    แมปกลุ่มและ topic ไปยังเอเจนต์
  </Card>
  <Card title="การแก้ไขปัญหา" icon="wrench" href="/th/channels/troubleshooting">
    การวินิจฉัยข้ามช่องทาง
  </Card>
</CardGroup>
