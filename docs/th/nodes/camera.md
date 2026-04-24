---
read_when:
    - กำลังเพิ่มหรือแก้ไขการจับภาพจากกล้องบน nodes ของ iOS/Android หรือ macOS
    - กำลังขยายเวิร์กโฟลว์ไฟล์ชั่วคราว MEDIA ที่เอเจนต์เข้าถึงได้
summary: 'การจับภาพจากกล้อง (nodes บน iOS/Android + แอป macOS) เพื่อให้เอเจนต์ใช้งาน: ภาพถ่าย (jpg) และคลิปวิดีโอสั้น (mp4)'
title: การจับภาพจากกล้อง
x-i18n:
    generated_at: "2026-04-24T09:19:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClaw รองรับ **การจับภาพจากกล้อง** สำหรับเวิร์กโฟลว์ของเอเจนต์:

- **iOS node** (pair ผ่าน Gateway): ถ่าย **ภาพ** (`jpg`) หรือ **คลิปวิดีโอสั้น** (`mp4` พร้อมเสียงแบบไม่บังคับ) ผ่าน `node.invoke`
- **Android node** (pair ผ่าน Gateway): ถ่าย **ภาพ** (`jpg`) หรือ **คลิปวิดีโอสั้น** (`mp4` พร้อมเสียงแบบไม่บังคับ) ผ่าน `node.invoke`
- **แอป macOS** (node ผ่าน Gateway): ถ่าย **ภาพ** (`jpg`) หรือ **คลิปวิดีโอสั้น** (`mp4` พร้อมเสียงแบบไม่บังคับ) ผ่าน `node.invoke`

การเข้าถึงกล้องทั้งหมดถูกควบคุมด้วย **การตั้งค่าที่ผู้ใช้ควบคุมเอง**

## iOS node

### การตั้งค่าของผู้ใช้ (ค่าเริ่มต้นเปิด)

- แท็บ Settings บน iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - ค่าเริ่มต้น: **เปิด** (หากไม่มีคีย์จะถือว่าเปิดใช้งานอยู่)
  - เมื่อปิด: คำสั่ง `camera.*` จะคืนค่า `CAMERA_DISABLED`

### คำสั่ง (ผ่าน Gateway `node.invoke`)

- `camera.list`
  - payload การตอบกลับ:
    - `devices`: อาร์เรย์ของ `{ id, name, position, deviceType }`

- `camera.snap`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `maxWidth`: number (ไม่บังคับ; ค่าเริ่มต้น `1600` บน iOS node)
    - `quality`: `0..1` (ไม่บังคับ; ค่าเริ่มต้น `0.9`)
    - `format`: ปัจจุบันคือ `jpg`
    - `delayMs`: number (ไม่บังคับ; ค่าเริ่มต้น `0`)
    - `deviceId`: string (ไม่บังคับ; จาก `camera.list`)
  - payload การตอบกลับ:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - ตัวป้องกัน payload: รูปภาพจะถูกบีบอัดใหม่เพื่อให้ payload แบบ base64 มีขนาดไม่เกิน 5 MB

- `camera.clip`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `durationMs`: number (ค่าเริ่มต้น `3000`, ถูก clamp สูงสุดที่ `60000`)
    - `includeAudio`: boolean (ค่าเริ่มต้น `true`)
    - `format`: ปัจจุบันคือ `mp4`
    - `deviceId`: string (ไม่บังคับ; จาก `camera.list`)
  - payload การตอบกลับ:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### ข้อกำหนดเรื่อง foreground

เช่นเดียวกับ `canvas.*`, iOS node อนุญาตคำสั่ง `camera.*` เฉพาะใน **foreground** เท่านั้น การเรียกใช้ใน background จะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`

### ตัวช่วย CLI (ไฟล์ชั่วคราว + MEDIA)

วิธีที่ง่ายที่สุดในการได้ไฟล์แนบคือใช้ตัวช่วย CLI ซึ่งจะเขียน media ที่ถอดรหัสแล้วลงในไฟล์ชั่วคราวและพิมพ์ `MEDIA:<path>`

ตัวอย่าง:

```bash
openclaw nodes camera snap --node <id>               # ค่าเริ่มต้น: ทั้ง front + back (2 บรรทัด MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

หมายเหตุ:

- `nodes camera snap` มีค่าเริ่มต้นเป็น **ทั้งสองด้าน** เพื่อให้เอเจนต์ได้ทั้งสองมุมมอง
- ไฟล์เอาต์พุตเป็นไฟล์ชั่วคราว (ในไดเรกทอรี temp ของ OS) เว้นแต่คุณจะสร้าง wrapper ของคุณเอง

## Android node

### การตั้งค่าของผู้ใช้บน Android (ค่าเริ่มต้นเปิด)

- แผ่น Settings บน Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - ค่าเริ่มต้น: **เปิด** (หากไม่มีคีย์จะถือว่าเปิดใช้งานอยู่)
  - เมื่อปิด: คำสั่ง `camera.*` จะคืนค่า `CAMERA_DISABLED`

### สิทธิ์การเข้าถึง

- Android ต้องใช้ runtime permissions:
  - `CAMERA` สำหรับทั้ง `camera.snap` และ `camera.clip`
  - `RECORD_AUDIO` สำหรับ `camera.clip` เมื่อ `includeAudio=true`

หากไม่มีสิทธิ์ แอปจะถามเมื่อเป็นไปได้; หากถูกปฏิเสธ คำขอ `camera.*` จะล้มเหลวพร้อมข้อผิดพลาด
`*_PERMISSION_REQUIRED`

### ข้อกำหนดเรื่อง foreground บน Android

เช่นเดียวกับ `canvas.*`, Android node อนุญาตคำสั่ง `camera.*` เฉพาะใน **foreground** เท่านั้น การเรียกใช้ใน background จะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`

### คำสั่งบน Android (ผ่าน Gateway `node.invoke`)

- `camera.list`
  - payload การตอบกลับ:
    - `devices`: อาร์เรย์ของ `{ id, name, position, deviceType }`

### ตัวป้องกัน payload

รูปภาพจะถูกบีบอัดใหม่เพื่อให้ payload แบบ base64 มีขนาดไม่เกิน 5 MB

## แอป macOS

### การตั้งค่าของผู้ใช้ (ค่าเริ่มต้นปิด)

แอปคู่หูบน macOS มีช่องทำเครื่องหมายดังนี้:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - ค่าเริ่มต้น: **ปิด**
  - เมื่อปิด: คำขอใช้กล้องจะคืนค่า “Camera disabled by user”

### ตัวช่วย CLI (node invoke)

ใช้ `openclaw` CLI หลักเพื่อเรียกคำสั่งกล้องบน macOS node

ตัวอย่าง:

```bash
openclaw nodes camera list --node <id>            # แสดงรายการ camera ids
openclaw nodes camera snap --node <id>            # พิมพ์ MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # พิมพ์ MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # พิมพ์ MEDIA:<path> (แฟลกแบบ legacy)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

หมายเหตุ:

- `openclaw nodes camera snap` มีค่าเริ่มต้นเป็น `maxWidth=1600` หากไม่ได้ override
- บน macOS, `camera.snap` จะรอ `delayMs` (ค่าเริ่มต้น 2000ms) หลัง warm-up/ปรับ exposure เสร็จ ก่อนจับภาพ
- payload ของรูปภาพจะถูกบีบอัดใหม่เพื่อให้ base64 มีขนาดไม่เกิน 5 MB

## ความปลอดภัย + ข้อจำกัดในทางปฏิบัติ

- การเข้าถึงกล้องและไมโครโฟนจะทริกเกอร์พรอมป์ต์ขอสิทธิ์ของ OS ตามปกติ (และต้องมี usage strings ใน Info.plist)
- คลิปวิดีโอมีการจำกัดความยาว (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยง payload ของ node ที่ใหญ่เกินไป (overhead ของ base64 + ขีดจำกัดของข้อความ)

## วิดีโอหน้าจอบน macOS (ระดับ OS)

สำหรับวิดีโอ **หน้าจอ** (ไม่ใช่กล้อง) ให้ใช้แอปคู่หูบน macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # พิมพ์ MEDIA:<path>
```

หมายเหตุ:

- ต้องใช้สิทธิ์ macOS **Screen Recording** (TCC)

## ที่เกี่ยวข้อง

- [Image and media support](/th/nodes/images)
- [Media understanding](/th/nodes/media-understanding)
- [Location command](/th/nodes/location-command)
