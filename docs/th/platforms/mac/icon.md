---
read_when:
    - กำลังเปลี่ยนพฤติกรรมของไอคอนแถบเมนู
summary: สถานะและแอนิเมชันของไอคอนแถบเมนูสำหรับ OpenClaw บน macOS
title: ไอคอนแถบเมนู
x-i18n:
    generated_at: "2026-04-24T09:21:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# สถานะของไอคอนแถบเมนู

ผู้เขียน: steipete · อัปเดต: 2025-12-06 · ขอบเขต: แอป macOS (`apps/macos`)

- **Idle:** แอนิเมชันของไอคอนตามปกติ (กะพริบตา, กระดิกเล็กน้อยเป็นครั้งคราว)
- **Paused:** status item ใช้ `appearsDisabled`; ไม่มีการเคลื่อนไหว
- **Voice trigger (หูใหญ่):** ตัวตรวจจับ voice wake จะเรียก `AppState.triggerVoiceEars(ttl: nil)` เมื่อได้ยิน wake word ทำให้ `earBoostActive=true` คงอยู่ระหว่างการจับคำพูด หูจะขยายขึ้น (1.9x), มีรูหูทรงกลมเพื่อให้อ่านง่ายขึ้น จากนั้นจะลดลงผ่าน `stopVoiceEars()` หลังจากไม่มีเสียง 1 วินาที ปัจจุบันจะทริกเกอร์จาก pipeline เสียงภายในแอปเท่านั้น
- **Working (เอเจนต์กำลังทำงาน):** `AppState.isWorking=true` จะขับการเคลื่อนไหวจิ๋วแบบ “หาง/ขาวิ่งจุกจิก”: ขากระดิกเร็วขึ้นและมีการเลื่อนตำแหน่งเล็กน้อยระหว่างที่งานกำลังทำอยู่ ปัจจุบันเปิด/ปิดรอบการรันเอเจนต์ของ WebChat; ให้เพิ่มการเปิด/ปิดแบบเดียวกันรอบงานยาวอื่นๆ เมื่อคุณเชื่อมต่อมัน

จุดเชื่อมต่อ

- Voice wake: runtime/tester เรียก `AppState.triggerVoiceEars(ttl: nil)` ตอนทริกเกอร์ และเรียก `stopVoiceEars()` หลังเงียบไป 1 วินาที เพื่อให้ตรงกับช่วงเวลาการจับเสียง
- กิจกรรมของเอเจนต์: ตั้ง `AppStateStore.shared.setWorking(true/false)` รอบช่วงเวลาที่มีงานทำ (ทำไว้แล้วในการเรียกเอเจนต์ของ WebChat) ให้ช่วงเวลาสั้นและรีเซ็ตในบล็อก `defer` เพื่อหลีกเลี่ยงแอนิเมชันค้าง

รูปร่างและขนาด

- ไอคอนพื้นฐานถูกวาดใน `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`
- ขนาดของหูเริ่มต้นเป็น `1.0`; voice boost จะตั้ง `earScale=1.9` และสลับ `earHoles=true` โดยไม่เปลี่ยนเฟรมโดยรวม (ภาพ template ขนาด 18×18 pt ที่เรนเดอร์ลงใน Retina backing store ขนาด 36×36 px)
- scurry ใช้ leg wiggle สูงสุดประมาณ ~1.0 พร้อมการขยับแนวนอนเล็กน้อย; มันจะถูกบวกเพิ่มจาก idle wiggle ที่มีอยู่

หมายเหตุด้านพฤติกรรม

- ไม่มีตัวสลับ ears/working จาก CLI หรือ broker ภายนอก; ควรเก็บไว้ภายในสัญญาณของแอปเองเพื่อหลีกเลี่ยงการสลับถี่โดยไม่ตั้งใจ
- รักษา TTLs ให้สั้น (&lt;10s) เพื่อให้ไอคอนกลับสู่สถานะปกติอย่างรวดเร็วหากงานค้าง

## ที่เกี่ยวข้อง

- [Menu bar](/th/platforms/mac/menu-bar)
- [macOS app](/th/platforms/macos)
