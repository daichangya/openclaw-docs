---
read_when:
    - การเปลี่ยนลักษณะการทำงานหรือค่าเริ่มต้นของคำปลุกด้วยเสียง
    - การเพิ่มแพลตฟอร์ม Node ใหม่ที่ต้องซิงก์คำปลุกించేเสียง
summary: คำปลุกด้วยเสียงแบบ global (เป็นของ Gateway) และวิธีซิงก์ข้าม Nodes
title: คำปลุกด้วยเสียง
x-i18n:
    generated_at: "2026-04-24T09:20:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw ถือว่า **คำปลุกด้วยเสียงเป็นรายการ global เดียว** ที่เป็นของ **Gateway**

- **ไม่มีคำปลุกแบบกำหนดเองราย Node**
- **UI ของ Node/แอปใดก็ได้สามารถแก้ไข** รายการนี้ได้; การเปลี่ยนแปลงจะถูกบันทึกโดย Gateway และกระจายไปยังทุกคน
- macOS และ iOS เก็บสวิตช์ **Voice Wake เปิด/ปิด** แบบโลคัลไว้ (UX และสิทธิ์ในเครื่องต่างกัน)
- ปัจจุบัน Android ปิด Voice Wake ไว้ และใช้ flow ไมโครโฟนแบบแมนนวลในแท็บ Voice

## ที่จัดเก็บ (โฮสต์ Gateway)

คำปลุกจะถูกเก็บไว้บนเครื่อง gateway ที่:

- `~/.openclaw/settings/voicewake.json`

รูปแบบ:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## โปรโตคอล

### Methods

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` พร้อมพารามิเตอร์ `{ triggers: string[] }` → `{ triggers: string[] }`

หมายเหตุ:

- Triggers จะถูก normalize (ตัดช่องว่าง, ลบค่าที่ว่าง) รายการว่างจะย้อนกลับไปใช้ค่าเริ่มต้น
- มีการบังคับใช้ขีดจำกัดเพื่อความปลอดภัย (จำนวน/ความยาวสูงสุด)

### Events

- `voicewake.changed` payload `{ triggers: string[] }`

ผู้ที่ได้รับ:

- ไคลเอนต์ WebSocket ทั้งหมด (แอป macOS, WebChat เป็นต้น)
- Nodes ที่เชื่อมต่ออยู่ทั้งหมด (iOS/Android) และจะได้รับตอน node เชื่อมต่อเป็นการส่ง “สถานะปัจจุบัน” ครั้งแรกด้วย

## ลักษณะการทำงานของไคลเอนต์

### แอป macOS

- ใช้รายการ global เพื่อกำกับ triggers ของ `VoiceWakeRuntime`
- การแก้ไข “Trigger words” ในการตั้งค่า Voice Wake จะเรียก `voicewake.set` แล้วอาศัย broadcast เพื่อให้ไคลเอนต์อื่นซิงก์ตาม

### iOS node

- ใช้รายการ global สำหรับการตรวจจับ trigger ของ `VoiceWakeManager`
- การแก้ไข Wake Words ใน Settings จะเรียก `voicewake.set` (ผ่าน Gateway WS) และยังคงทำให้การตรวจจับคำปลุกแบบโลคัลตอบสนองได้ดี

### Android node

- ปัจจุบัน Voice Wake ถูกปิดใช้งานใน runtime/Settings ของ Android
- เสียงบน Android ใช้การจับไมค์แบบแมนนวลในแท็บ Voice แทน triggers ของคำปลุก

## ที่เกี่ยวข้อง

- [Talk mode](/th/nodes/talk)
- [Audio และ voice notes](/th/nodes/audio)
- [ความเข้าใจสื่อ](/th/nodes/media-understanding)
