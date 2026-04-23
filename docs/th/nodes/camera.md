---
read_when:
    - กำลังเพิ่มหรือแก้ไขการจับภาพจากกล้องบน Node ของ iOS/Android หรือบน macOS
    - กำลังขยายเวิร์กโฟลว์ไฟล์ชั่วคราว MEDIA ที่เอเจนต์เข้าถึงได้
summary: 'การจับภาพจากกล้อง (Node บน iOS/Android + แอป macOS) สำหรับการใช้งานของเอเจนต์: ภาพถ่าย (jpg) และวิดีโอคลิปสั้น (mp4)'
title: การจับภาพจากกล้อง
x-i18n:
    generated_at: "2026-04-23T05:42:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# การจับภาพจากกล้อง (เอเจนต์)

OpenClaw รองรับ **การจับภาพจากกล้อง** สำหรับเวิร์กโฟลว์ของเอเจนต์:

- **Node บน iOS** (จับคู่ผ่าน Gateway): ถ่าย **ภาพถ่าย** (`jpg`) หรือ **วิดีโอคลิปสั้น** (`mp4` พร้อมเสียงแบบไม่บังคับ) ผ่าน `node.invoke`
- **Node บน Android** (จับคู่ผ่าน Gateway): ถ่าย **ภาพถ่าย** (`jpg`) หรือ **วิดีโอคลิปสั้น** (`mp4` พร้อมเสียงแบบไม่บังคับ) ผ่าน `node.invoke`
- **แอป macOS** (node ผ่าน Gateway): ถ่าย **ภาพถ่าย** (`jpg`) หรือ **วิดีโอคลิปสั้น** (`mp4` พร้อมเสียงแบบไม่บังคับ) ผ่าน `node.invoke`

การเข้าถึงกล้องทั้งหมดถูกควบคุมผ่าน **การตั้งค่าที่ผู้ใช้ควบคุมเอง**

## Node บน iOS

### การตั้งค่าของผู้ใช้ (เปิดอยู่โดยค่าเริ่มต้น)

- แท็บ Settings บน iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - ค่าเริ่มต้น: **เปิด** (หากไม่มีคีย์นี้จะถือว่าเปิดใช้งาน)
  - เมื่อปิด: คำสั่ง `camera.*` จะคืนค่า `CAMERA_DISABLED`

### คำสั่ง (ผ่าน Gateway `node.invoke`)

- `camera.list`
  - payload ของการตอบกลับ:
    - `devices`: อาร์เรย์ของ `{ id, name, position, deviceType }`

- `camera.snap`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `maxWidth`: number (ไม่บังคับ; ค่าเริ่มต้น `1600` บน node ของ iOS)
    - `quality`: `0..1` (ไม่บังคับ; ค่าเริ่มต้น `0.9`)
    - `format`: ปัจจุบันคือ `jpg`
    - `delayMs`: number (ไม่บังคับ; ค่าเริ่มต้น `0`)
    - `deviceId`: string (ไม่บังคับ; มาจาก `camera.list`)
  - payload ของการตอบกลับ:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - ตัวป้องกัน payload: ภาพถ่ายจะถูกบีบอัดใหม่เพื่อให้ base64 payload มีขนาดไม่เกิน 5 MB

- `camera.clip`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `durationMs`: number (ค่าเริ่มต้น `3000`, จำกัดสูงสุดที่ `60000`)
    - `includeAudio`: boolean (ค่าเริ่มต้น `true`)
    - `format`: ปัจจุบันคือ `mp4`
    - `deviceId`: string (ไม่บังคับ; มาจาก `camera.list`)
  - payload ของการตอบกลับ:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### ข้อกำหนดเรื่อง foreground

เช่นเดียวกับ `canvas.*` node บน iOS จะอนุญาตคำสั่ง `camera.*` เฉพาะเมื่ออยู่ใน **foreground** เท่านั้น การเรียกใช้จากพื้นหลังจะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`

### ตัวช่วย CLI (ไฟล์ชั่วคราว + MEDIA)

วิธีที่ง่ายที่สุดในการรับไฟล์แนบคือใช้ตัวช่วย CLI ซึ่งจะเขียน media ที่ถอดรหัสแล้วลงไฟล์ชั่วคราวและพิมพ์ `MEDIA:<path>`

ตัวอย่าง:

```bash
openclaw nodes camera snap --node <id>               # ค่าเริ่มต้น: ทั้ง front + back (2 บรรทัด MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

หมายเหตุ:

- `nodes camera snap` จะใช้ **ทั้งสองด้านกล้อง** โดยค่าเริ่มต้น เพื่อให้เอเจนต์เห็นทั้งสองมุมมอง
- ไฟล์เอาต์พุตเป็นไฟล์ชั่วคราว (ในไดเรกทอรี temp ของระบบปฏิบัติการ) เว้นแต่คุณจะสร้าง wrapper ของคุณเอง

## Node บน Android

### การตั้งค่าของผู้ใช้บน Android (เปิดอยู่โดยค่าเริ่มต้น)

- แผ่นงาน Settings บน Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - ค่าเริ่มต้น: **เปิด** (หากไม่มีคีย์นี้จะถือว่าเปิดใช้งาน)
  - เมื่อปิด: คำสั่ง `camera.*` จะคืนค่า `CAMERA_DISABLED`

### Permissions

- Android ต้องใช้ runtime permissions:
  - `CAMERA` สำหรับทั้ง `camera.snap` และ `camera.clip`
  - `RECORD_AUDIO` สำหรับ `camera.clip` เมื่อ `includeAudio=true`

หากไม่มี permissions แอปจะ prompt เมื่อทำได้; หากถูกปฏิเสธ คำขอ `camera.*` จะล้มเหลวพร้อมข้อผิดพลาด
`*_PERMISSION_REQUIRED`

### ข้อกำหนดเรื่อง foreground บน Android

เช่นเดียวกับ `canvas.*` node บน Android จะอนุญาตคำสั่ง `camera.*` เฉพาะเมื่ออยู่ใน **foreground** เท่านั้น การเรียกใช้จากพื้นหลังจะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`

### คำสั่งบน Android (ผ่าน Gateway `node.invoke`)

- `camera.list`
  - payload ของการตอบกลับ:
    - `devices`: อาร์เรย์ของ `{ id, name, position, deviceType }`

### ตัวป้องกัน payload

ภาพถ่ายจะถูกบีบอัดใหม่เพื่อให้ base64 payload มีขนาดไม่เกิน 5 MB

## แอป macOS

### การตั้งค่าของผู้ใช้ (ปิดอยู่โดยค่าเริ่มต้น)

แอปคู่หูบน macOS มีช่องทำเครื่องหมายดังนี้:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - ค่าเริ่มต้น: **ปิด**
  - เมื่อปิด: คำขอจากกล้องจะคืนค่า “Camera disabled by user”

### ตัวช่วย CLI (node invoke)

ใช้ CLI หลักของ `openclaw` เพื่อเรียกใช้คำสั่งกล้องบน macOS node

ตัวอย่าง:

```bash
openclaw nodes camera list --node <id>            # แสดงรายการ camera ids
openclaw nodes camera snap --node <id>            # พิมพ์ MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # พิมพ์ MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # พิมพ์ MEDIA:<path> (แฟล็กแบบเดิม)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

หมายเหตุ:

- `openclaw nodes camera snap` ใช้ค่าเริ่มต้น `maxWidth=1600` เว้นแต่จะมีการแทนที่
- บน macOS, `camera.snap` จะรอ `delayMs` (ค่าเริ่มต้น 2000ms) หลังจาก warm-up/exposure settle ก่อนจะถ่ายภาพ
- payload ของภาพถ่ายจะถูกบีบอัดใหม่เพื่อให้ base64 มีขนาดไม่เกิน 5 MB

## ความปลอดภัย + ข้อจำกัดเชิงปฏิบัติ

- การเข้าถึงกล้องและไมโครโฟนจะเรียก prompt เรื่องสิทธิ์ของระบบปฏิบัติการตามปกติ (และต้องมี usage strings ใน Info.plist)
- วิดีโอคลิปถูกจำกัดความยาว (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยง payload ของ node ที่มีขนาดใหญ่เกินไป (overhead ของ base64 + ขีดจำกัดข้อความ)

## วิดีโอหน้าจอบน macOS (ระดับระบบปฏิบัติการ)

สำหรับวิดีโอของ _หน้าจอ_ (ไม่ใช่กล้อง) ให้ใช้แอปคู่หูบน macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # พิมพ์ MEDIA:<path>
```

หมายเหตุ:

- ต้องใช้สิทธิ์ macOS **Screen Recording** (TCC)
