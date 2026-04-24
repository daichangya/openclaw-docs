---
read_when:
    - คุณกำลังเปลี่ยนวิธีแสดง timestamps ให้โมเดลหรือผู้ใช้
    - คุณกำลังแก้จุดบกพร่องการจัดรูปแบบเวลาในข้อความหรือเอาต์พุตของ system prompt
summary: การจัดการวันที่และเวลาครอบคลุมทั้ง envelopes, พรอมป์ต์, เครื่องมือ และ connectors
title: วันที่และเวลา
x-i18n:
    generated_at: "2026-04-24T09:08:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 15
---

# วันที่และเวลา

OpenClaw ใช้ค่าเริ่มต้นเป็น **เวลาท้องถิ่นของโฮสต์สำหรับ timestamps ของ transport** และใช้ **เขตเวลาของผู้ใช้เฉพาะใน system prompt เท่านั้น**
timestamps ของ provider จะถูกรักษาไว้ เพื่อให้เครื่องมือคงความหมายตามธรรมชาติของมัน (เวลาปัจจุบันดูได้ผ่าน `session_status`)

## Message envelopes (ใช้เวลาในเครื่องเป็นค่าเริ่มต้น)

ข้อความขาเข้าจะถูกห่อด้วย timestamp (ละเอียดระดับนาที):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

timestamp ของ envelope นี้จะเป็น **เวลาท้องถิ่นของโฮสต์โดยค่าเริ่มต้น** โดยไม่ขึ้นกับเขตเวลาของ provider

คุณสามารถ override พฤติกรรมนี้ได้:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` ใช้ UTC
- `envelopeTimezone: "local"` ใช้เขตเวลาของโฮสต์
- `envelopeTimezone: "user"` ใช้ `agents.defaults.userTimezone` (fallback ไปใช้เขตเวลาของโฮสต์)
- ใช้เขตเวลา IANA แบบระบุชัดเจน (เช่น `"America/Chicago"`) สำหรับโซนที่คงที่
- `envelopeTimestamp: "off"` จะลบ timestamps แบบสัมบูรณ์ออกจากส่วนหัวของ envelope
- `envelopeElapsed: "off"` จะลบส่วนต่อท้ายเวลาที่ผ่านไป (รูปแบบ `+2m`)

### ตัวอย่าง

**เวลาในเครื่อง (ค่าเริ่มต้น):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**เขตเวลาของผู้ใช้:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**เปิดใช้เวลาที่ผ่านไป:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## System prompt: Current Date & Time

หากทราบเขตเวลาของผู้ใช้ system prompt จะมีส่วน
**Current Date & Time** โดยเฉพาะ พร้อม **เขตเวลาเท่านั้น** (ไม่มีรูปแบบนาฬิกา/เวลา)
เพื่อให้ prompt caching คงที่:

```
Time zone: America/Chicago
```

เมื่อเอเจนต์ต้องการทราบเวลาปัจจุบัน ให้ใช้เครื่องมือ `session_status`; การ์ดสถานะ
จะมีบรรทัด timestamp อยู่

## บรรทัด system event (ใช้เวลาในเครื่องเป็นค่าเริ่มต้น)

system events ที่ถูกจัดคิวและแทรกลงในบริบทของเอเจนต์จะมี timestamp นำหน้าโดยใช้
การเลือกเขตเวลาแบบเดียวกับ message envelopes (ค่าเริ่มต้น: เวลาท้องถิ่นของโฮสต์)

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### กำหนดค่าเขตเวลาและรูปแบบของผู้ใช้

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` ตั้งค่า **เขตเวลาท้องถิ่นของผู้ใช้** สำหรับบริบทของพรอมป์ต์
- `timeFormat` ควบคุมการแสดงผลแบบ **12 ชั่วโมง/24 ชั่วโมง** ในพรอมป์ต์ `auto` จะอิงตามค่ากำหนดของ OS

## การตรวจจับรูปแบบเวลา (auto)

เมื่อ `timeFormat: "auto"` OpenClaw จะตรวจสอบค่ากำหนดของ OS (macOS/Windows)
และ fallback ไปใช้การจัดรูปแบบตาม locale ค่าที่ตรวจพบจะถูก **แคชต่อโปรเซส**
เพื่อหลีกเลี่ยงการเรียกระบบซ้ำๆ

## payloads ของเครื่องมือ + connectors (เวลาแบบดิบของ provider + ฟิลด์ที่ทำให้เป็นมาตรฐาน)

เครื่องมือของ channel จะส่งคืน **timestamps แบบ native ของ provider** และเพิ่มฟิลด์ที่ทำให้เป็นมาตรฐานเพื่อความสม่ำเสมอ:

- `timestampMs`: epoch milliseconds (UTC)
- `timestampUtc`: สตริง UTC แบบ ISO 8601

ฟิลด์ดิบของ provider จะถูกรักษาไว้เพื่อไม่ให้ข้อมูลสูญหาย

- Slack: สตริงลักษณะ epoch จาก API
- Discord: timestamps แบบ UTC ISO
- Telegram/WhatsApp: timestamps แบบตัวเลข/ISO เฉพาะของ provider

หากคุณต้องการเวลาในเครื่อง ให้แปลงภายหลังโดยใช้เขตเวลาที่ทราบ

## เอกสารที่เกี่ยวข้อง

- [System Prompt](/th/concepts/system-prompt)
- [Timezones](/th/concepts/timezone)
- [Messages](/th/concepts/messages)
