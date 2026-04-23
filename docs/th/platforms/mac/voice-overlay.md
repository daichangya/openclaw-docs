---
read_when:
    - การปรับพฤติกรรมของโอเวอร์เลย์เสียง
summary: วงจรชีวิตของโอเวอร์เลย์เสียงเมื่อ wake-word และ push-to-talk ทับซ้อนกัน
title: โอเวอร์เลย์เสียง
x-i18n:
    generated_at: "2026-04-23T05:45:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# วงจรชีวิตของโอเวอร์เลย์เสียง (macOS)

กลุ่มผู้อ่าน: ผู้ร่วมพัฒนาแอป macOS เป้าหมาย: ทำให้โอเวอร์เลย์เสียงมีพฤติกรรมที่คาดเดาได้เมื่อ wake-word และ push-to-talk ทับซ้อนกัน

## เจตนาปัจจุบัน

- หากโอเวอร์เลย์แสดงอยู่แล้วจาก wake-word แล้วผู้ใช้กด hotkey เซสชันของ hotkey จะ _รับช่วง_ ข้อความเดิมแทนการรีเซ็ต โอเวอร์เลย์จะยังคงแสดงอยู่ตราบใดที่ยังกด hotkey ค้างไว้ เมื่อผู้ใช้ปล่อย: ให้ส่งถ้ามีข้อความที่ trim แล้ว มิฉะนั้นให้ปิด
- การใช้ wake-word อย่างเดียวยังคงส่งอัตโนมัติเมื่อเงียบ; push-to-talk จะส่งทันทีเมื่อปล่อย

## สิ่งที่ implement แล้ว (9 ธ.ค. 2025)

- ตอนนี้เซสชันของโอเวอร์เลย์มี token ต่อการจับหนึ่งครั้ง (wake-word หรือ push-to-talk) การอัปเดต partial/final/send/dismiss/level จะถูกทิ้งเมื่อ token ไม่ตรงกัน ซึ่งช่วยหลีกเลี่ยง callback เก่าค้าง
- push-to-talk จะรับข้อความโอเวอร์เลย์ที่มองเห็นอยู่มาเป็น prefix (ดังนั้นการกด hotkey ขณะ wake overlay แสดงอยู่จะคงข้อความเดิมไว้และต่อคำพูดใหม่เพิ่ม) มันจะรอ final transcript ได้นานถึง 1.5 วินาที ก่อน fallback ไปใช้ข้อความปัจจุบัน
- log ของ chime/overlay จะถูกปล่อยที่ระดับ `info` ใน category `voicewake.overlay`, `voicewake.ptt` และ `voicewake.chime` (session start, partial, final, send, dismiss, เหตุผลของ chime)

## ขั้นตอนถัดไป

1. **VoiceSessionCoordinator (actor)**
   - เป็นเจ้าของ `VoiceSession` ได้เพียงหนึ่งเดียวในเวลาใดเวลาหนึ่ง
   - API (อิง token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`
   - ทิ้ง callback ที่มี token เก่าค้าง (ป้องกันไม่ให้ recognizer เก่าเปิดโอเวอร์เลย์ขึ้นมาอีก)

2. **VoiceSession (model)**
   - ฟิลด์: `token`, `source` (wakeWord|pushToTalk), ข้อความแบบ committed/volatile, flag ของ chime, ตัวจับเวลา (auto-send, idle), `overlayMode` (display|editing|sending), เส้นตายของ cooldown

3. **การผูกกับโอเวอร์เลย์**
   - `VoiceSessionPublisher` (`ObservableObject`) ทำมิเรอร์เซสชันที่ใช้งานอยู่ไปยัง SwiftUI
   - `VoiceWakeOverlayView` เรนเดอร์ผ่าน publisher เท่านั้น; มันจะไม่ mutate singleton ระดับ global โดยตรง
   - การกระทำของผู้ใช้บนโอเวอร์เลย์ (`sendNow`, `dismiss`, `edit`) จะ callback กลับเข้า coordinator พร้อม token ของเซสชัน

4. **เส้นทางการส่งแบบรวมศูนย์**
   - เมื่อ `endCapture`: หากข้อความที่ trim แล้วว่าง → ปิด; มิฉะนั้น `performSend(session:)` (เล่น send chime หนึ่งครั้ง ส่งต่อ แล้วปิด)
   - Push-to-talk: ไม่มีการหน่วง; wake-word: มีการหน่วงแบบทางเลือกสำหรับ auto-send
   - ใช้ cooldown สั้น ๆ กับ wake runtime หลังจาก push-to-talk เสร็จ เพื่อไม่ให้ wake-word ทริกเกอร์ซ้ำทันที

5. **Logging**
   - Coordinator ปล่อย log `.info` ใน subsystem `ai.openclaw`, category `voicewake.overlay` และ `voicewake.chime`
   - event สำคัญ: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`

## เช็กลิสต์การดีบัก

- สตรีม log ขณะกำลัง reproduce อาการโอเวอร์เลย์ค้าง:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- ตรวจสอบให้แน่ใจว่ามี session token ที่ใช้งานอยู่เพียงหนึ่งเดียว; callback ที่เก่าค้างควรถูกทิ้งโดย coordinator
- ตรวจสอบให้แน่ใจว่าการปล่อย push-to-talk เรียก `endCapture` พร้อม token ที่ใช้งานอยู่เสมอ; หากข้อความว่าง ควรคาดหวัง `dismiss` โดยไม่มี chime หรือ send

## ขั้นตอนการย้ายระบบ (แนะนำ)

1. เพิ่ม `VoiceSessionCoordinator`, `VoiceSession` และ `VoiceSessionPublisher`
2. refactor `VoiceWakeRuntime` ให้สร้าง/อัปเดต/ปิดเซสชัน แทนการแตะ `VoiceWakeOverlayController` โดยตรง
3. refactor `VoicePushToTalk` ให้รับช่วงเซสชันที่มีอยู่และเรียก `endCapture` ตอนปล่อย; ใช้ runtime cooldown
4. เชื่อม `VoiceWakeOverlayController` เข้ากับ publisher; เอาการเรียกโดยตรงจาก runtime/PTT ออก
5. เพิ่ม integration test สำหรับการรับช่วงเซสชัน, cooldown และการปิดเมื่อข้อความว่าง
