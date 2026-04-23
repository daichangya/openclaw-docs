---
read_when:
    - การเพิ่มการรองรับ node ด้านตำแหน่งหรือ UI สิทธิ์
    - การออกแบบสิทธิ์ตำแหน่งหรือพฤติกรรมเบื้องหน้าบน Android
summary: คำสั่งตำแหน่งสำหรับ nodes (`location.get`), โหมดสิทธิ์ และพฤติกรรมเบื้องหน้าของ Android
title: คำสั่งตำแหน่ง գտնىي assistant to=final
x-i18n:
    generated_at: "2026-04-23T05:43:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# คำสั่งตำแหน่ง (nodes)

## สรุปสั้น ๆ

- `location.get` เป็นคำสั่งของ node (ผ่าน `node.invoke`)
- ปิดไว้เป็นค่าเริ่มต้น
- การตั้งค่าแอปบน Android ใช้ตัวเลือก: ปิด / ขณะใช้งาน
- มีสวิตช์แยก: ตำแหน่งแบบแม่นยำ

## ทำไมต้องเป็นตัวเลือก (ไม่ใช่แค่สวิตช์)

สิทธิ์ของ OS มีหลายระดับ เราสามารถเปิดเผยตัวเลือกนี้ในแอปได้ แต่ OS ยังคงเป็นผู้ตัดสินสิทธิ์จริงที่ได้รับ

- iOS/macOS อาจแสดง **While Using** หรือ **Always** ในพรอมป์/Settings ของระบบ
- ปัจจุบันแอป Android รองรับเฉพาะตำแหน่งแบบเบื้องหน้า
- ตำแหน่งแบบแม่นยำเป็นสิทธิ์แยกต่างหาก (iOS 14+ “Precise”, Android “fine” เทียบกับ “coarse”)

ตัวเลือกใน UI เป็นตัวขับโหมดที่เราร้องขอ ส่วนสิทธิ์จริงอยู่ใน settings ของ OS

## โมเดลการตั้งค่า

ต่ออุปกรณ์ node หนึ่งเครื่อง:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

พฤติกรรมของ UI:

- การเลือก `whileUsing` จะร้องขอสิทธิ์ตำแหน่งแบบ foreground
- หาก OS ปฏิเสธระดับสิทธิ์ที่ร้องขอ ให้ย้อนกลับไปยังระดับสูงสุดที่ได้รับ และแสดงสถานะ

## การแมปสิทธิ์ (`node.permissions`)

เป็นตัวเลือก macOS node รายงาน `location` ผ่าน permissions map; iOS/Android อาจไม่รายงาน

## คำสั่ง: `location.get`

ถูกเรียกผ่าน `node.invoke`

พารามิเตอร์ (ที่แนะนำ):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

payload การตอบกลับ:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

ข้อผิดพลาด (โค้ดแบบคงที่):

- `LOCATION_DISABLED`: ตัวเลือกถูกปิดอยู่
- `LOCATION_PERMISSION_REQUIRED`: ไม่มีสิทธิ์ตามโหมดที่ร้องขอ
- `LOCATION_BACKGROUND_UNAVAILABLE`: แอปอยู่เบื้องหลัง แต่อนุญาตเฉพาะ While Using
- `LOCATION_TIMEOUT`: ได้ตำแหน่งไม่ทันเวลา
- `LOCATION_UNAVAILABLE`: ระบบล้มเหลว / ไม่มีผู้ให้บริการ

## พฤติกรรมเบื้องหลัง

- แอป Android จะปฏิเสธ `location.get` ขณะอยู่เบื้องหลัง
- ให้เปิด OpenClaw ค้างไว้เมื่อร้องขอตำแหน่งบน Android
- แพลตฟอร์ม node อื่นอาจแตกต่างกัน

## การผสานรวมกับโมเดล/tooling

- พื้นผิวของ tool: tool `nodes` เพิ่ม action `location_get` (ต้องมี node)
- CLI: `openclaw nodes location get --node <id>`
- แนวทางสำหรับเอเจนต์: เรียกใช้เฉพาะเมื่อผู้ใช้เปิดใช้งานตำแหน่งและเข้าใจขอบเขตแล้ว

## ข้อความ UX (แนะนำ)

- ปิด: “การแชร์ตำแหน่งถูกปิดใช้งานอยู่”
- ขณะใช้งาน: “เฉพาะเมื่อ OpenClaw เปิดอยู่”
- แบบแม่นยำ: “ใช้ตำแหน่ง GPS แบบแม่นยำ ปิดสวิตช์นี้เพื่อแชร์ตำแหน่งโดยประมาณ”
