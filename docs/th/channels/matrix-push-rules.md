---
read_when:
    - การตั้งค่า Matrix quiet streaming สำหรับ Synapse หรือ Tuwunel ที่โฮสต์เอง
    - ผู้ใช้ต้องการรับการแจ้งเตือนเฉพาะเมื่อบล็อกเสร็จสมบูรณ์ ไม่ใช่ทุกครั้งที่มีการแก้ไขตัวอย่างข้อความ
summary: กฎ push ของ Matrix แบบรายผู้รับสำหรับการแก้ไขตัวอย่างที่สรุปแล้วแบบเงียบ
title: กฎ push ของ Matrix สำหรับตัวอย่างแบบเงียบ
x-i18n:
    generated_at: "2026-04-24T08:58:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

เมื่อ `channels.matrix.streaming` เป็น `"quiet"` OpenClaw จะแก้ไข preview event เดียวในตำแหน่งเดิม และทำเครื่องหมายการแก้ไขที่สรุปแล้วด้วยแฟล็กเนื้อหาแบบกำหนดเอง Matrix client จะส่งการแจ้งเตือนเมื่อมีการแก้ไขครั้งสุดท้ายเท่านั้น หากกฎ push ต่อผู้ใช้ตรงกับแฟล็กนั้น หน้านี้มีไว้สำหรับผู้ดูแลระบบที่โฮสต์ Matrix เองและต้องการติดตั้งกฎดังกล่าวสำหรับแต่ละบัญชีผู้รับ

หากคุณต้องการใช้พฤติกรรมการแจ้งเตือน Matrix มาตรฐานเท่านั้น ให้ใช้ `streaming: "partial"` หรือปล่อยให้ปิด streaming ไว้ ดู [การตั้งค่าช่องทาง Matrix](/th/channels/matrix#streaming-previews)

## ข้อกำหนดเบื้องต้น

- ผู้ใช้ผู้รับ = บุคคลที่ควรได้รับการแจ้งเตือน
- ผู้ใช้บอต = บัญชี Matrix ของ OpenClaw ที่ส่งคำตอบ
- ใช้ access token ของผู้ใช้ผู้รับสำหรับการเรียก API ด้านล่าง
- ให้ `sender` ในกฎ push ตรงกับ MXID แบบเต็มของผู้ใช้บอต
- บัญชีผู้รับต้องมี pusher ที่ทำงานได้อยู่แล้ว — กฎ quiet preview จะทำงานได้ก็ต่อเมื่อการส่ง push ของ Matrix ตามปกติทำงานปกติ

## ขั้นตอน

<Steps>
  <Step title="กำหนดค่า quiet previews">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="รับ access token ของผู้รับ">
    ใช้โทเค็นเซสชันของไคลเอนต์ที่มีอยู่เดิมซ้ำหากทำได้ หากต้องการสร้างโทเค็นใหม่:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="ตรวจสอบว่ามี pusher อยู่">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

หากไม่มี pusher ส่งกลับมา ให้แก้ไขการส่ง push ของ Matrix ตามปกติสำหรับบัญชีนี้ก่อนจึงค่อยดำเนินการต่อ

  </Step>

  <Step title="ติดตั้งกฎ override push">
    OpenClaw จะทำเครื่องหมายการแก้ไข preview แบบข้อความล้วนที่สรุปแล้วด้วย `content["com.openclaw.finalized_preview"] = true` ติดตั้งกฎที่ตรงกับตัวทำเครื่องหมายดังกล่าวร่วมกับ MXID ของบอตในฐานะผู้ส่ง:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    แทนที่ค่าต่อไปนี้ก่อนรัน:

    - `https://matrix.example.org`: URL พื้นฐานของ homeserver ของคุณ
    - `$USER_ACCESS_TOKEN`: access token ของผู้ใช้ผู้รับ
    - `openclaw-finalized-preview-botname`: rule ID ที่ไม่ซ้ำกันต่อบอตต่อผู้รับ (รูปแบบ: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID ของบอต OpenClaw ของคุณ ไม่ใช่ของผู้รับ

  </Step>

  <Step title="ตรวจสอบ">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

จากนั้นทดสอบคำตอบแบบสตรีม ในโหมด quiet ห้องจะแสดง preview ฉบับร่างแบบเงียบ และจะแจ้งเตือนหนึ่งครั้งเมื่อบล็อกหรือเทิร์นเสร็จสิ้น

  </Step>
</Steps>

หากต้องการลบกฎนี้ในภายหลัง ให้ใช้ `DELETE` กับ URL ของกฎเดียวกันโดยใช้โทเค็นของผู้รับ

## หมายเหตุสำหรับหลายบอต

กฎ push อ้างอิงด้วย `ruleId`: การรัน `PUT` ซ้ำกับ ID เดิมจะอัปเดตกฎเดิมเพียงข้อเดียว สำหรับหลายบอต OpenClaw ที่แจ้งเตือนผู้รับคนเดียวกัน ให้สร้างกฎหนึ่งข้อต่อหนึ่งบอตโดยมีการจับคู่ผู้ส่งที่แตกต่างกัน

กฎ `override` ที่ผู้ใช้กำหนดใหม่จะถูกแทรกไว้ก่อนกฎ suppress เริ่มต้น ดังนั้นจึงไม่ต้องใช้พารามิเตอร์จัดลำดับเพิ่มเติม กฎนี้มีผลเฉพาะกับการแก้ไข preview แบบข้อความล้วนที่สามารถสรุปในตำแหน่งเดิมได้เท่านั้น ส่วน fallback สำหรับสื่อและ fallback สำหรับ preview ที่ค้างอยู่จะใช้การส่งของ Matrix ตามปกติ

## หมายเหตุเกี่ยวกับ homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    ไม่จำเป็นต้องเปลี่ยนแปลง `homeserver.yaml` เป็นพิเศษ หากการแจ้งเตือน Matrix ตามปกติส่งถึงผู้ใช้นี้อยู่แล้ว โทเค็นของผู้รับ + การเรียก `pushrules` ด้านบนคือขั้นตอนการตั้งค่าหลัก

    หากคุณรัน Synapse หลัง reverse proxy หรือ workers ให้แน่ใจว่า `/_matrix/client/.../pushrules/` ส่งถึง Synapse ได้อย่างถูกต้อง การส่ง push จะถูกจัดการโดยโพรเซสหลักหรือ `synapse.app.pusher` / pusher workers ที่กำหนดค่าไว้ — ตรวจสอบให้แน่ใจว่าส่วนเหล่านี้ทำงานปกติ

  </Accordion>

  <Accordion title="Tuwunel">
    ขั้นตอนเหมือนกับ Synapse; ไม่ต้องมีคอนฟิกเฉพาะของ Tuwunel สำหรับ finalized preview marker นี้

    หากการแจ้งเตือนหายไปในขณะที่ผู้ใช้กำลังใช้งานอุปกรณ์อื่นอยู่ ให้ตรวจสอบว่าเปิด `suppress_push_when_active` อยู่หรือไม่ Tuwunel เพิ่มตัวเลือกนี้ใน 1.4.2 (กันยายน 2025) และมันอาจระงับการส่ง push ไปยังอุปกรณ์อื่นโดยเจตนาในขณะที่มีอุปกรณ์หนึ่งกำลังใช้งานอยู่

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การตั้งค่าช่องทาง Matrix](/th/channels/matrix)
- [แนวคิดเกี่ยวกับการสตรีม](/th/concepts/streaming)
