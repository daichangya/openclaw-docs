---
read_when:
    - การเพิ่มหรือแก้ไขการแยกวิเคราะห์ตำแหน่งของช่องทาง
    - การใช้ฟิลด์บริบทตำแหน่งในพรอมป์ต์ของเอเจนต์หรือเครื่องมือ
summary: การแยกวิเคราะห์ตำแหน่งของช่องทางขาเข้า (Telegram/WhatsApp/Matrix) และฟิลด์บริบท
title: การแยกวิเคราะห์ตำแหน่งของช่องทาง
x-i18n:
    generated_at: "2026-04-23T05:26:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# การแยกวิเคราะห์ตำแหน่งของช่องทาง

OpenClaw ทำการ normalize ตำแหน่งที่แชร์จากช่องทางแชตให้เป็น:

- ข้อความที่มนุษย์อ่านเข้าใจได้ซึ่งถูกต่อท้ายในเนื้อหาขาเข้า และ
- ฟิลด์แบบมีโครงสร้างในเพย์โหลดบริบทการตอบกลับอัตโนมัติ

ที่รองรับในปัจจุบัน:

- **Telegram** (หมุดตำแหน่ง + สถานที่ + ตำแหน่งสด)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` พร้อม `geo_uri`)

## การจัดรูปแบบข้อความ

ตำแหน่งจะแสดงเป็นบรรทัดที่อ่านง่ายโดยไม่มีวงเล็บ:

- หมุด:
  - `📍 48.858844, 2.294351 ±12m`
- สถานที่ที่มีชื่อ:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- การแชร์สด:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

หากช่องทางมี caption/comment ข้อความนั้นจะถูกต่อในบรรทัดถัดไป:

```
📍 48.858844, 2.294351 ±12m
เจอกันที่นี่
```

## ฟิลด์บริบท

เมื่อมีตำแหน่งอยู่ จะมีการเพิ่มฟิลด์เหล่านี้ลงใน `ctx`:

- `LocationLat` (ตัวเลข)
- `LocationLon` (ตัวเลข)
- `LocationAccuracy` (ตัวเลข, เมตร; ไม่บังคับ)
- `LocationName` (สตริง; ไม่บังคับ)
- `LocationAddress` (สตริง; ไม่บังคับ)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (บูลีน)

## หมายเหตุแยกตามช่องทาง

- **Telegram**: venues จะถูกแมปไปยัง `LocationName/LocationAddress`; ตำแหน่งสดใช้ `live_period`
- **WhatsApp**: `locationMessage.comment` และ `liveLocationMessage.caption` จะถูกต่อเป็นบรรทัด caption
- **Matrix**: `geo_uri` จะถูกแยกวิเคราะห์เป็นตำแหน่งแบบหมุด; altitude จะถูกละเลย และ `LocationIsLive` จะเป็น false เสมอ
