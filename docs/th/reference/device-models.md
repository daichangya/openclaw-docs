---
read_when:
    - การอัปเดตแมปตัวระบุรุ่นอุปกรณ์หรือไฟล์ NOTICE/license
    - การเปลี่ยนวิธีที่ UI ของ Instances แสดงชื่ออุปกรณ์
summary: วิธีที่ OpenClaw ทำ vendor ให้กับตัวระบุรุ่นอุปกรณ์ Apple เพื่อใช้ชื่อที่เป็นมิตรในแอป macOS
title: ฐานข้อมูลรุ่นอุปกรณ์
x-i18n:
    generated_at: "2026-04-24T09:31:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# ฐานข้อมูลรุ่นอุปกรณ์ (ชื่อที่เป็นมิตร)

แอป macOS companion จะแสดงชื่อรุ่นอุปกรณ์ Apple ที่เป็นมิตรใน UI **Instances** โดยการแมปตัวระบุรุ่นของ Apple (เช่น `iPad16,6`, `Mac16,6`) ไปเป็นชื่อที่มนุษย์อ่านเข้าใจได้

การแมปนี้ถูกทำ vendor เป็น JSON ไว้ที่:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## แหล่งข้อมูล

ปัจจุบันเราทำ vendor การแมปนี้มาจาก repository ที่ใช้สัญญาอนุญาต MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

เพื่อให้การ build มีความแน่นอน ไฟล์ JSON จะถูก pin ไว้กับ commit ของ upstream ที่เฉพาะเจาะจง (บันทึกไว้ใน `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`)

## การอัปเดตฐานข้อมูล

1. เลือก commit ของ upstream ที่คุณต้องการ pin ไว้ (หนึ่งรายการสำหรับ iOS และหนึ่งรายการสำหรับ macOS)
2. อัปเดต commit hash ใน `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`
3. ดาวน์โหลดไฟล์ JSON ใหม่โดย pin กับ commit เหล่านั้น:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. ตรวจสอบว่า `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` ยังคงตรงกับ upstream (แทนที่ไฟล์นี้หากสัญญาอนุญาตของ upstream เปลี่ยนไป)
5. ตรวจสอบว่าแอป macOS build ผ่านอย่างสะอาด (ไม่มีคำเตือน):

```bash
swift build --package-path apps/macos
```

## ที่เกี่ยวข้อง

- [Nodes](/th/nodes)
- [การแก้ปัญหา Node](/th/nodes/troubleshooting)
