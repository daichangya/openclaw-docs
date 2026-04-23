---
read_when:
    - คุณต้องเข้าใจวิธีที่ timestamp ถูกทำให้เป็นมาตรฐานสำหรับโมเดล
    - การกำหนดค่าเขตเวลาของผู้ใช้สำหรับ system prompt
summary: การจัดการเขตเวลาสำหรับเอเจนต์ envelope และพรอมป์
title: เขตเวลา
x-i18n:
    generated_at: "2026-04-23T05:32:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# เขตเวลา

OpenClaw ทำให้ timestamp เป็นมาตรฐานเพื่อให้โมเดลเห็น **เวลาอ้างอิงเพียงชุดเดียว**

## envelope ของข้อความ (ใช้เวลาในเครื่องเป็นค่าเริ่มต้น)

ข้อความขาเข้าจะถูกห่อด้วย envelope ลักษณะนี้:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

timestamp ใน envelope จะเป็น **เวลาในเครื่องของโฮสต์โดยค่าเริ่มต้น** โดยมีความละเอียดระดับนาที

คุณสามารถแทนที่ได้ด้วย:

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
- `envelopeTimezone: "user"` ใช้ `agents.defaults.userTimezone` (fallback ไปยังเขตเวลาของโฮสต์)
- ใช้เขตเวลา IANA แบบชัดเจน (เช่น `"Europe/Vienna"`) สำหรับ offset คงที่
- `envelopeTimestamp: "off"` จะลบ timestamp แบบ absolute ออกจากส่วนหัวของ envelope
- `envelopeElapsed: "off"` จะลบ suffix เวลาที่ผ่านไป (แบบ `+2m`)

### ตัวอย่าง

**เวลาในเครื่อง (ค่าเริ่มต้น):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**เขตเวลาคงที่:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**เวลาที่ผ่านไป:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## payload ของเครื่องมือ (ข้อมูลดิบของ provider + ฟิลด์ที่ทำให้เป็นมาตรฐาน)

การเรียกใช้เครื่องมือ (`channels.discord.readMessages`, `channels.slack.readMessages` เป็นต้น) จะคืนค่า **timestamp ดิบของ provider**
นอกจากนี้ เรายังแนบฟิลด์ที่ทำให้เป็นมาตรฐานเพื่อความสม่ำเสมอ:

- `timestampMs` (UTC epoch milliseconds)
- `timestampUtc` (สตริง UTC แบบ ISO 8601)

ฟิลด์ดิบของ provider จะยังคงถูกรักษาไว้

## เขตเวลาของผู้ใช้สำหรับ system prompt

ตั้งค่า `agents.defaults.userTimezone` เพื่อบอกโมเดลถึงเขตเวลาท้องถิ่นของผู้ใช้ หาก
ไม่ได้ตั้งค่า OpenClaw จะ resolve **เขตเวลาของโฮสต์ขณะรันไทม์** (ไม่มีการเขียน config)

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

system prompt จะประกอบด้วย:

- ส่วน `Current Date & Time` พร้อมเวลาท้องถิ่นและเขตเวลา
- `Time format: 12-hour` หรือ `24-hour`

คุณสามารถควบคุมรูปแบบในพรอมป์ได้ด้วย `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดู [Date & Time](/th/date-time) สำหรับพฤติกรรมเต็มและตัวอย่าง

## ที่เกี่ยวข้อง

- [Heartbeat](/th/gateway/heartbeat) — ชั่วโมงที่ใช้งานอยู่ใช้เขตเวลาสำหรับการจัดตาราง
- [Cron Jobs](/th/automation/cron-jobs) — นิพจน์ Cron ใช้เขตเวลาสำหรับการจัดตาราง
- [Date & Time](/th/date-time) — พฤติกรรมวันเวลาเต็มและตัวอย่าง
