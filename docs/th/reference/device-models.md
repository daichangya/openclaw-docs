---
read_when:
    - กำลังอัปเดตการแมปรหัสรุ่นอุปกรณ์หรือไฟล์ NOTICE/license
    - กำลังเปลี่ยนวิธีที่ UI ของ Instances แสดงชื่ออุปกรณ์
summary: วิธีที่ OpenClaw vend รหัสรุ่นอุปกรณ์ Apple เพื่อใช้ชื่อที่เป็นมิตรในแอป macOS
title: ฐานข้อมูลรุ่นอุปกรณ์
x-i18n:
    generated_at: "2026-04-23T05:54:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# ฐานข้อมูลรุ่นอุปกรณ์ (ชื่อที่เป็นมิตร)

แอปคู่หูบน macOS จะแสดงชื่อรุ่นอุปกรณ์ Apple แบบที่เป็นมิตรใน UI ของ **Instances** โดยแมปรหัสรุ่นอุปกรณ์ Apple (เช่น `iPad16,6`, `Mac16,6`) ไปเป็นชื่อที่มนุษย์อ่านเข้าใจได้

การแมปนี้ถูก vend เป็น JSON ภายใต้:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## แหล่งข้อมูล

ขณะนี้เรา vend การแมปมาจาก repository ที่ใช้สัญญาอนุญาตแบบ MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

เพื่อให้บิลด์กำหนดผลลัพธ์ได้แน่นอน ไฟล์ JSON จะถูก pin ไว้กับ commit upstream ที่ระบุ (บันทึกไว้ใน `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`)

## การอัปเดตฐานข้อมูล

1. เลือก commit upstream ที่คุณต้องการ pin ไว้ (หนึ่งสำหรับ iOS, หนึ่งสำหรับ macOS)
2. อัปเดตค่าแฮชของ commit ใน `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`
3. ดาวน์โหลดไฟล์ JSON ใหม่ โดย pin ตาม commit เหล่านั้น:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. ตรวจสอบให้แน่ใจว่า `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` ยังคงตรงกับ upstream (แทนที่ไฟล์นี้หากสัญญาอนุญาต upstream เปลี่ยน)
5. ตรวจสอบว่าแอป macOS บิลด์ผ่านอย่างสะอาด (ไม่มีคำเตือน):

```bash
swift build --package-path apps/macos
```
