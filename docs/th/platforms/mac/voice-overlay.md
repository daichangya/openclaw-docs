---
read_when:
    - การปรับลักษณะการทำงานของ voice overlay
summary: วงจรชีวิตของ voice overlay เมื่อคำปลุกและ push-to-talk ซ้อนทับกัน
title: voice overlay
x-i18n:
    generated_at: "2026-04-24T09:22:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# วงจรชีวิตของ voice overlay (macOS)

ผู้อ่านเป้าหมาย: ผู้ร่วมพัฒนาแอป macOS เป้าหมายคือทำให้ voice overlay มีพฤติกรรมที่คาดเดาได้เมื่อคำปลุกและ push-to-talk ซ้อนทับกัน

## เจตนาปัจจุบัน

- หาก overlay แสดงอยู่แล้วจากคำปลุก และผู้ใช้กด hotkey เซสชัน hotkey จะ _รับข้อความเดิมมาใช้ต่อ_ แทนการรีเซ็ต Overlay จะยังคงแสดงอยู่ตราบเท่าที่กด hotkey ค้างไว้ เมื่อผู้ใช้ปล่อย: หากมีข้อความที่ตัดช่องว่างแล้วก็ให้ส่ง มิฉะนั้นให้ปิด
- คำปลุกเพียงอย่างเดียวยังคงส่งอัตโนมัติเมื่อเงียบ; push-to-talk จะส่งทันทีเมื่อปล่อย

## ติดตั้งใช้งานแล้ว (9 ธ.ค. 2025)

- ตอนนี้เซสชัน overlay มี token ต่อหนึ่งการจับเสียง (wake-word หรือ push-to-talk) การอัปเดต partial/final/send/dismiss/level จะถูกทิ้งเมื่อ token ไม่ตรงกัน เพื่อหลีกเลี่ยง stale callbacks
- Push-to-talk จะรับข้อความบน overlay ที่มองเห็นอยู่มาใช้เป็น prefix (ดังนั้นการกด hotkey ขณะ wake overlay แสดงอยู่จะคงข้อความเดิมไว้และต่อท้ายด้วยคำพูดใหม่) มันจะรอ final transcript ได้นานถึง 1.5 วินาที ก่อน fallback ไปใช้ข้อความปัจจุบัน
- logging สำหรับ chime/overlay จะถูกส่งที่ระดับ `info` ในหมวด `voicewake.overlay`, `voicewake.ptt` และ `voicewake.chime` (เริ่มเซสชัน, partial, final, send, dismiss, เหตุผลของ chime)

## ขั้นตอนถัดไป

1. **VoiceSessionCoordinator (actor)**
   - เป็นเจ้าของ `VoiceSession` ได้ครั้งละหนึ่งรายการเท่านั้น
   - API (อิง token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`
   - ทิ้ง callbacks ที่มี stale tokens (ป้องกันไม่ให้ recognizers เก่าเปิด overlay ขึ้นมาใหม่)

2. **VoiceSession (model)**
   - ฟิลด์: `token`, `source` (wakeWord|pushToTalk), committed/volatile text, flags ของ chime, timers (auto-send, idle), `overlayMode` (display|editing|sending), cooldown deadline

3. **Overlay binding**
   - `VoiceSessionPublisher` (`ObservableObject`) จะสะท้อนเซสชันที่ active ไปยัง SwiftUI
   - `VoiceWakeOverlayView` จะแสดงผลผ่าน publisher เท่านั้น; มันจะไม่ mutate global singletons โดยตรง
   - การกระทำของผู้ใช้ใน overlay (`sendNow`, `dismiss`, `edit`) จะเรียกกลับไปยัง coordinator พร้อม session token

4. **เส้นทางการส่งแบบรวมศูนย์**
   - เมื่อ `endCapture`: ถ้าข้อความที่ตัดช่องว่างแล้วว่างเปล่า → ปิด; มิฉะนั้น `performSend(session:)` (เล่น send chime ครั้งเดียว, ส่งต่อ, ปิด)
   - Push-to-talk: ไม่หน่วงเวลา; wake-word: อาจมีการหน่วงเวลาแบบไม่บังคับสำหรับ auto-send
   - ใช้ cooldown สั้น ๆ กับ wake runtime หลัง push-to-talk จบ เพื่อไม่ให้คำปลุกทริกเกอร์ซ้ำทันที

5. **Logging**
   - Coordinator จะส่ง `.info` logs ใน subsystem `ai.openclaw`, หมวด `voicewake.overlay` และ `voicewake.chime`
   - เหตุการณ์สำคัญ: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`

## เช็กลิสต์สำหรับการดีบัก

- สตรีม logs ระหว่างทำให้ overlay ค้างซ้ำ:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- ตรวจสอบว่ามี active session token เพียงหนึ่งรายการ; stale callbacks ควรถูกทิ้งโดย coordinator
- ตรวจสอบให้แน่ใจว่าการปล่อย push-to-talk เรียก `endCapture` ด้วย active token เสมอ; หากข้อความว่าง ควรเห็น `dismiss` โดยไม่มี chime หรือ send

## ขั้นตอนการย้ายระบบ (แนะนำ)

1. เพิ่ม `VoiceSessionCoordinator`, `VoiceSession` และ `VoiceSessionPublisher`
2. รีแฟกเตอร์ `VoiceWakeRuntime` ให้สร้าง/อัปเดต/จบเซสชันแทนการแตะ `VoiceWakeOverlayController` โดยตรง
3. รีแฟกเตอร์ `VoicePushToTalk` ให้รับเซสชันที่มีอยู่มาใช้ต่อและเรียก `endCapture` เมื่อปล่อย; ใช้ runtime cooldown
4. เชื่อม `VoiceWakeOverlayController` เข้ากับ publisher; เอาการเรียกตรงจาก runtime/PTT ออก
5. เพิ่ม integration tests สำหรับการรับช่วงเซสชัน, cooldown และการปิดเมื่อข้อความว่าง

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [Voice wake (macOS)](/th/platforms/mac/voicewake)
- [Talk mode](/th/nodes/talk)
