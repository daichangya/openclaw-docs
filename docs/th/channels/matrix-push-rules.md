---
read_when:
    - การตั้งค่าการสตรีมแบบเงียบของ Matrix สำหรับ Synapse หรือ Tuwunel ที่โฮสต์เอง
    - ผู้ใช้ต้องการรับการแจ้งเตือนเฉพาะเมื่อบล็อกเสร็จสิ้นเท่านั้น ไม่ใช่ทุกครั้งที่มีการแก้ไขตัวอย่าง
summary: กฎการส่งพุช Matrix แบบต่อผู้รับสำหรับการแก้ไขตัวอย่างก่อนเผยแพร่ขั้นสุดท้ายแบบเงียบ
title: กฎการส่งพุช Matrix สำหรับตัวอย่างแบบเงียบ
x-i18n:
    generated_at: "2026-04-23T14:56:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbfdf2552ca352858d4e8d03a2a0f5f3b420d33b01063c111c0335c0229f0534
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

# กฎการส่งพุช Matrix สำหรับตัวอย่างแบบเงียบ

เมื่อ `channels.matrix.streaming` เป็น `"quiet"` OpenClaw จะแก้ไขอีเวนต์ตัวอย่างรายการเดียวแบบแทนที่เดิม และทำเครื่องหมายการแก้ไขที่สรุปเสร็จแล้วด้วยแฟล็กเนื้อหาแบบกำหนดเอง Matrix client จะแจ้งเตือนในการแก้ไขสุดท้ายเท่านั้น หากกฎการส่งพุชต่อผู้ใช้ตรงกับแฟล็กนั้น หน้านี้มีไว้สำหรับผู้ดูแลระบบที่โฮสต์ Matrix เองและต้องการติดตั้งกฎนั้นให้กับแต่ละบัญชีผู้รับ

หากคุณต้องการเพียงพฤติกรรมการแจ้งเตือนมาตรฐานของ Matrix ให้ใช้ `streaming: "partial"` หรือปล่อยให้ปิดการสตรีมไว้ ดู [การตั้งค่าช่องทาง Matrix](/th/channels/matrix#streaming-previews)

## ข้อกำหนดเบื้องต้น

- ผู้ใช้ผู้รับ = บุคคลที่ควรได้รับการแจ้งเตือน
- ผู้ใช้บอต = บัญชี Matrix ของ OpenClaw ที่ส่งคำตอบ
- ใช้ access token ของผู้ใช้ผู้รับสำหรับการเรียก API ด้านล่าง
- จับคู่ `sender` ในกฎการส่งพุชกับ MXID แบบเต็มของผู้ใช้บอต
- บัญชีผู้รับต้องมี pusher ที่ทำงานได้อยู่แล้ว — กฎตัวอย่างแบบเงียบจะทำงานได้ก็ต่อเมื่อการส่งพุชของ Matrix ตามปกติทำงานสมบูรณ์

## ขั้นตอน

<Steps>
  <Step title="กำหนดค่าตัวอย่างแบบเงียบ">

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
    ใช้โทเค็นเซสชันไคลเอนต์ที่มีอยู่ซ้ำถ้าเป็นไปได้ หากต้องการสร้างใหม่:

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

หากไม่มี pusher กลับมา ให้แก้ไขการส่งพุชของ Matrix ตามปกติสำหรับบัญชีนี้ก่อนจึงค่อยดำเนินการต่อ

  </Step>

  <Step title="ติดตั้งกฎการส่งพุชแบบ override">
    OpenClaw ทำเครื่องหมายการแก้ไขตัวอย่างแบบข้อความล้วนที่สรุปเสร็จแล้วด้วย `content["com.openclaw.finalized_preview"] = true` ติดตั้งกฎที่ตรงกับตัวทำเครื่องหมายนี้ร่วมกับ MXID ของบอตในฐานะ sender:

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

    - `https://matrix.example.org`: base URL ของ homeserver ของคุณ
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

จากนั้นทดสอบคำตอบแบบสตรีม ในโหมดเงียบ ห้องจะแสดงตัวอย่างฉบับร่างแบบเงียบ และแจ้งเตือนหนึ่งครั้งเมื่อบล็อกหรือเทิร์นเสร็จสิ้น

  </Step>
</Steps>

หากต้องการลบกฎภายหลัง ให้ใช้ `DELETE` กับ URL ของกฎเดียวกันโดยใช้โทเค็นของผู้รับ

## หมายเหตุสำหรับหลายบอต

กฎการส่งพุชจะอ้างอิงด้วย `ruleId`: การรัน `PUT` ซ้ำกับ ID เดิมจะเป็นการอัปเดตกฎเดียว สำหรับบอต OpenClaw หลายตัวที่แจ้งเตือนผู้รับคนเดียวกัน ให้สร้างหนึ่งกฎต่อหนึ่งบอตโดยใช้การจับคู่ sender ที่แตกต่างกัน

กฎ `override` ที่ผู้ใช้กำหนดใหม่จะถูกแทรกไว้ก่อนกฎระงับเริ่มต้น ดังนั้นจึงไม่ต้องมีพารามิเตอร์การจัดลำดับเพิ่มเติม กฎนี้มีผลเฉพาะกับการแก้ไขตัวอย่างแบบข้อความล้วนที่สามารถสรุปแบบแทนที่เดิมได้เท่านั้น ส่วน fallback ของสื่อและ fallback ของตัวอย่างที่ล้าสมัยจะใช้การส่งของ Matrix ตามปกติ

## หมายเหตุเกี่ยวกับ homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    ไม่จำเป็นต้องเปลี่ยน `homeserver.yaml` เป็นพิเศษ หากการแจ้งเตือน Matrix ปกติเข้าถึงผู้ใช้นี้ได้อยู่แล้ว โทเค็นของผู้รับและการเรียก `pushrules` ข้างต้นคือขั้นตอนการตั้งค่าหลัก

    หากคุณรัน Synapse หลัง reverse proxy หรือ workers ให้แน่ใจว่า `/_matrix/client/.../pushrules/` ไปถึง Synapse ได้อย่างถูกต้อง การส่งพุชถูกจัดการโดยโปรเซสหลักหรือ `synapse.app.pusher` / pusher workers ที่กำหนดค่าไว้ — ตรวจสอบให้แน่ใจว่าส่วนเหล่านั้นทำงานปกติ

  </Accordion>

  <Accordion title="Tuwunel">
    ใช้ขั้นตอนเดียวกับ Synapse; ไม่ต้องมีการตั้งค่าเฉพาะของ Tuwunel สำหรับตัวทำเครื่องหมายตัวอย่างที่สรุปเสร็จแล้ว

    หากการแจ้งเตือนหายไปในขณะที่ผู้ใช้กำลังใช้งานอีกอุปกรณ์หนึ่งอยู่ ให้ตรวจสอบว่าเปิด `suppress_push_when_active` ไว้หรือไม่ Tuwunel เพิ่มตัวเลือกนี้ใน 1.4.2 (กันยายน 2025) และอาจระงับการส่งพุชไปยังอุปกรณ์อื่นโดยตั้งใจขณะที่มีอุปกรณ์หนึ่งกำลังใช้งานอยู่

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การตั้งค่าช่องทาง Matrix](/th/channels/matrix)
- [แนวคิดการสตรีม](/th/concepts/streaming)
