---
read_when:
    - การเปลี่ยนพฤติกรรมหรือค่าเริ่มต้นของคำปลุกด้วยเสียง
    - การเพิ่มแพลตฟอร์ม node ใหม่ที่ต้องซิงก์คำปลุกด้วยเสียง
summary: คำปลุกด้วยเสียงแบบโกลบอล (Gateway เป็นเจ้าของ) และวิธีที่มันซิงก์ข้าม nodes
title: การปลุกด้วยเสียง
x-i18n:
    generated_at: "2026-04-23T05:43:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# การปลุกด้วยเสียง (คำปลุกแบบโกลบอล)

OpenClaw มองว่า **คำปลุก** เป็น **รายการโกลบอลชุดเดียว** ที่ **Gateway** เป็นเจ้าของ

- **ไม่มีคำปลุกแบบกำหนดเองราย node**
- **UI ของ node/app ใดก็ได้สามารถแก้ไข** รายการนี้ได้; การเปลี่ยนแปลงจะถูกบันทึกโดย Gateway และกระจายไปยังทุกคน
- macOS และ iOS ยังคงมีสวิตช์เปิด/ปิด **Voice Wake** ในเครื่องของตนเอง (UX ในเครื่อง + สิทธิ์การเข้าถึงต่างกัน)
- Android ปัจจุบันยังคงปิด Voice Wake และใช้โฟลว์ไมโครโฟนแบบ manual ในแท็บ Voice

## การจัดเก็บ (บนโฮสต์ Gateway)

คำปลุกจะถูกเก็บไว้บนเครื่อง gateway ที่:

- `~/.openclaw/settings/voicewake.json`

รูปแบบ:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocol

### Methods

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` พร้อมพารามิเตอร์ `{ triggers: string[] }` → `{ triggers: string[] }`

หมายเหตุ:

- triggers จะถูก normalize (ตัดช่องว่าง, ทิ้งค่าว่าง) หากรายการว่างจะ fallback ไปใช้ค่าเริ่มต้น
- มีการบังคับใช้ขีดจำกัดเพื่อความปลอดภัย (จำนวน/ความยาวสูงสุด)

### Events

- `voicewake.changed` payload `{ triggers: string[] }`

ผู้ที่ได้รับ:

- ไคลเอนต์ WebSocket ทั้งหมด (แอป macOS, WebChat ฯลฯ)
- nodes ที่เชื่อมต่ออยู่ทั้งหมด (iOS/Android) และยังถูกส่งตอน node เชื่อมต่อด้วยในฐานะ push ของ “สถานะปัจจุบัน” ครั้งแรก

## พฤติกรรมของไคลเอนต์

### แอป macOS

- ใช้รายการโกลบอลเพื่อเป็นเกตสำหรับ triggers ของ `VoiceWakeRuntime`
- การแก้ไข “Trigger words” ในการตั้งค่า Voice Wake จะเรียก `voicewake.set` แล้วอาศัยการ broadcast เพื่อให้ไคลเอนต์อื่นซิงก์ตาม

### iOS node

- ใช้รายการโกลบอลสำหรับการตรวจจับ trigger ของ `VoiceWakeManager`
- การแก้ไข Wake Words ใน Settings จะเรียก `voicewake.set` (ผ่าน Gateway WS) และยังคงให้การตรวจจับคำปลุกในเครื่องตอบสนองได้ดี

### Android node

- ปัจจุบัน Voice Wake ถูกปิดใช้งานใน Android runtime/Settings
- ระบบเสียงของ Android ใช้การจับไมค์แบบ manual ในแท็บ Voice แทน triggers แบบคำปลุก
