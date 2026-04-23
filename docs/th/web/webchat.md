---
read_when:
    - การดีบักหรือกำหนดค่าการเข้าถึง WebChat
summary: โฮสต์แบบสแตติกของ WebChat บน loopback และการใช้งาน Gateway WS สำหรับ UI แชต
title: WebChat
x-i18n:
    generated_at: "2026-04-23T06:20:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2588be04e9ae38149bdf284bf4d75b6784d63899026d2351c4e0e7efdf05ff39
    source_path: web/webchat.md
    workflow: 15
---

# WebChat (UI ของ Gateway WebSocket)

สถานะ: UI แชต SwiftUI บน macOS/iOS สื่อสารกับ Gateway WebSocket โดยตรง

## คืออะไร

- UI แชตแบบ native สำหรับ gateway (ไม่มีเบราว์เซอร์ฝังตัวและไม่มีเซิร์ฟเวอร์สแตติกแบบ local)
- ใช้เซสชันและกฎการกำหนดเส้นทางเดียวกันกับช่องทางอื่น
- การกำหนดเส้นทางแบบกำหนดแน่นอน: การตอบกลับจะย้อนกลับไปที่ WebChat เสมอ

## เริ่มต้นอย่างรวดเร็ว

1. เริ่ม gateway
2. เปิด UI WebChat (แอป macOS/iOS) หรือแท็บแชตใน Control UI
3. ตรวจสอบให้แน่ใจว่าได้กำหนดค่าเส้นทางการยืนยันตัวตนของ gateway ที่ถูกต้องแล้ว (ค่าเริ่มต้นคือ shared-secret
   แม้บน loopback)

## วิธีการทำงาน (พฤติกรรม)

- UI เชื่อมต่อกับ Gateway WebSocket และใช้ `chat.history`, `chat.send` และ `chat.inject`
- `chat.history` มีขอบเขตเพื่อความเสถียร: Gateway อาจตัดข้อความที่ยาวเกินไป ละเว้น metadata ที่มีขนาดใหญ่ และแทนที่รายการที่มีขนาดเกินด้วย `[chat.history omitted: message too large]`
- `chat.history` ยังถูกปรับให้เป็นมาตรฐานสำหรับการแสดงผลด้วย: แท็กคำสั่งการส่งแบบ inline
  เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`, payload XML ของการเรียกเครื่องมือในข้อความล้วน
  (รวมถึง `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`,
  และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน), รวมถึงโทเค็นควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วออกมา จะถูกลบออกจากข้อความที่มองเห็นได้
  และรายการของ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดมีเพียง
  โทเค็นเงียบที่ตรงกันเป๊ะ `NO_REPLY` / `no_reply` จะถูกละเว้น
- `chat.inject` จะต่อท้ายบันทึกของ assistant ลงใน transcript โดยตรงและกระจายไปยัง UI (ไม่มีการรัน agent)
- การรันที่ถูกยกเลิกอาจยังคงแสดงผลลัพธ์บางส่วนของ assistant ใน UI
- Gateway จะคงข้อความ assistant บางส่วนจากการยกเลิกลงในประวัติ transcript เมื่อมีเอาต์พุตที่บัฟเฟอร์ไว้ และทำเครื่องหมายรายการเหล่านั้นด้วย metadata ของการยกเลิก
- ประวัติจะถูกดึงจาก gateway เสมอ (ไม่มีการเฝ้าดูไฟล์แบบ local)
- หากไม่สามารถเข้าถึง gateway ได้ WebChat จะเป็นแบบอ่านอย่างเดียว

## แผงเครื่องมือ agents ใน Control UI

- แผง Tools ของ `/agents` ใน Control UI มี 2 มุมมองแยกกัน:
  - **ใช้งานได้ในขณะนี้** ใช้ `tools.effective(sessionKey=...)` และแสดงสิ่งที่เซสชันปัจจุบัน
    ใช้งานได้จริงขณะรัน รวมถึงเครื่องมือที่เป็นของ core, Plugin และช่องทาง
  - **การกำหนดค่าเครื่องมือ** ใช้ `tools.catalog` และยังคงมุ่งเน้นไปที่โปรไฟล์ การแทนที่ และ
    ความหมายของแคตตาล็อก
- ความพร้อมใช้งานขณะรันมีขอบเขตระดับเซสชัน การสลับเซสชันบน agent เดียวกันอาจเปลี่ยน
  รายการ **ใช้งานได้ในขณะนี้**
- ตัวแก้ไข config ไม่ได้บอกเป็นนัยว่าพร้อมใช้งานขณะรัน; การเข้าถึงที่มีผลจริงยังคงเป็นไปตามลำดับความสำคัญของนโยบาย
  (`allow`/`deny`, การแทนที่ต่อ agent และต่อ provider/channel)

## การใช้งานแบบ remote

- โหมด remote จะทำ tunnel ให้ Gateway WebSocket ผ่าน SSH/Tailscale
- คุณไม่จำเป็นต้องรันเซิร์ฟเวอร์ WebChat แยกต่างหาก

## เอกสารอ้างอิงการกำหนดค่า (WebChat)

การกำหนดค่าแบบเต็ม: [การกำหนดค่า](/th/gateway/configuration)

ตัวเลือกของ WebChat:

- `gateway.webchat.chatHistoryMaxChars`: จำนวนอักขระสูงสุดสำหรับฟิลด์ข้อความในการตอบกลับ `chat.history` เมื่อรายการ transcript เกินขีดจำกัดนี้ Gateway จะตัดข้อความที่ยาวเกินไป และอาจแทนที่ข้อความที่มีขนาดเกินด้วย placeholder โดยไคลเอนต์ยังสามารถส่ง `maxChars` ต่อคำขอเพื่อแทนที่ค่าเริ่มต้นนี้สำหรับการเรียก `chat.history` เพียงครั้งเดียวได้

ตัวเลือกระดับ global ที่เกี่ยวข้อง:

- `gateway.port`, `gateway.bind`: โฮสต์/พอร์ตของ WebSocket
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  การยืนยันตัวตน WebSocket แบบ shared-secret
- `gateway.auth.allowTailscale`: แท็บแชตของ Control UI บนเบราว์เซอร์สามารถใช้ส่วนหัว identity ของ Tailscale
  Serve ได้เมื่อเปิดใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: การยืนยันตัวตนผ่าน reverse-proxy สำหรับไคลเอนต์เบราว์เซอร์ที่อยู่หลังแหล่งพร็อกซี **ที่ไม่ใช่ loopback** ซึ่งรับรู้ตัวตน (ดู [การยืนยันตัวตน Trusted Proxy](/th/gateway/trusted-proxy-auth))
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: เป้าหมาย gateway แบบ remote
- `session.*`: ที่เก็บเซสชันและค่าเริ่มต้นของคีย์หลัก
