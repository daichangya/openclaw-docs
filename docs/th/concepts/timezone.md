---
read_when:
    - คุณต้องการทำความเข้าใจว่าระบบทำให้ timestamps เป็นมาตรฐานสำหรับโมเดลอย่างไร
    - การกำหนดค่าเขตเวลาของผู้ใช้สำหรับ system prompts
summary: การจัดการเขตเวลาสำหรับเอเจนต์ ซองข้อมูล และพรอมป์ต์
title: เขตเวลา
x-i18n:
    generated_at: "2026-04-24T09:08:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw ทำให้ timestamps เป็นมาตรฐานเพื่อให้โมเดลเห็น **เวลาอ้างอิงเพียงชุดเดียว**

## ซองข้อมูลข้อความ (ใช้เวลาในเครื่องเป็นค่าเริ่มต้น)

ข้อความขาเข้าจะถูกห่อด้วยซองข้อมูลในลักษณะดังนี้:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

timestamp ในซองข้อมูลจะเป็น **เวลาในเครื่องของโฮสต์โดยค่าเริ่มต้น** และมีความละเอียดระดับนาที

คุณสามารถกำหนดแทนได้ด้วย:

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

- `envelopeTimezone: "utc"` ใช้เวลา UTC
- `envelopeTimezone: "user"` ใช้ `agents.defaults.userTimezone` (หากไม่มีจะย้อนกลับไปใช้เขตเวลาของโฮสต์)
- ใช้ IANA timezone แบบชัดเจน (เช่น `"Europe/Vienna"`) สำหรับ offset แบบคงที่
- `envelopeTimestamp: "off"` จะลบ timestamps แบบสัมบูรณ์ออกจากส่วนหัวของซองข้อมูล
- `envelopeElapsed: "off"` จะลบคำต่อท้ายเวลาที่ผ่านไป (รูปแบบ `+2m`)

### ตัวอย่าง

**เวลาในเครื่อง (ค่าเริ่มต้น):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**เขตเวลาแบบคงที่:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**เวลาที่ผ่านไป:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## payload ของ tools (ข้อมูลดิบจาก provider + ฟิลด์ที่ทำให้เป็นมาตรฐาน)

การเรียก tools (`channels.discord.readMessages`, `channels.slack.readMessages` เป็นต้น) จะคืนค่า **timestamps ดิบจาก provider**
เรายังแนบฟิลด์ที่ทำให้เป็นมาตรฐานเพื่อความสอดคล้องด้วย:

- `timestampMs` (UTC epoch milliseconds)
- `timestampUtc` (สตริง UTC แบบ ISO 8601)

ฟิลด์ดิบจาก provider จะยังคงถูกเก็บไว้

## เขตเวลาของผู้ใช้สำหรับ system prompt

ตั้งค่า `agents.defaults.userTimezone` เพื่อบอกโมเดลเกี่ยวกับเขตเวลาท้องถิ่นของผู้ใช้ หาก
ไม่ได้ตั้งค่า OpenClaw จะ resolve **เขตเวลาของโฮสต์ขณะรันไทม์** (ไม่มีการเขียน config)

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

system prompt จะมี:

- ส่วน `Current Date & Time` พร้อมเวลาท้องถิ่นและเขตเวลา
- `Time format: 12-hour` หรือ `24-hour`

คุณสามารถควบคุมรูปแบบใน prompt ได้ด้วย `agents.defaults.timeFormat` (`auto` | `12` | `24`)

ดู [วันที่และเวลา](/th/date-time) สำหรับพฤติกรรมทั้งหมดและตัวอย่าง

## ที่เกี่ยวข้อง

- [Heartbeat](/th/gateway/heartbeat) — ชั่วโมงทำงานใช้เขตเวลาในการจัดตารางเวลา
- [งาน Cron](/th/automation/cron-jobs) — นิพจน์ Cron ใช้เขตเวลาในการจัดตารางเวลา
- [วันที่และเวลา](/th/date-time) — พฤติกรรมวันที่/เวลาแบบเต็มและตัวอย่าง
