---
read_when:
    - การดีบักหรือกำหนดค่าการเข้าถึง WebChat
summary: โฮสต์สแตติกของ WebChat บน loopback และการใช้งาน Gateway WS สำหรับ UI แชต
title: WebChat
x-i18n:
    generated_at: "2026-04-24T09:40:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

สถานะ: UI แชต SwiftUI บน macOS/iOS จะสื่อสารกับ Gateway WebSocket โดยตรง

## มันคืออะไร

- UI แชตแบบเนทีฟสำหรับ gateway (ไม่มี embedded browser และไม่มี local static server)
- ใช้กฎเซสชันและการกำหนดเส้นทางเดียวกับช่องทางส่งข้อความอื่น
- การกำหนดเส้นทางแบบกำหนดแน่นอน: คำตอบจะถูกส่งกลับไปยัง WebChat เสมอ

## เริ่มต้นอย่างรวดเร็ว

1. เริ่มต้น gateway
2. เปิด UI ของ WebChat (แอป macOS/iOS) หรือแท็บแชตใน Control UI
3. ตรวจสอบให้แน่ใจว่ามีการกำหนดค่าเส้นทางการยืนยันตัวตนของ gateway ที่ถูกต้องแล้ว (ค่าเริ่มต้นคือ shared-secret
   แม้บน loopback)

## วิธีการทำงาน (พฤติกรรม)

- UI จะเชื่อมต่อกับ Gateway WebSocket และใช้ `chat.history`, `chat.send` และ `chat.inject`
- `chat.history` ถูกจำกัดขอบเขตเพื่อความเสถียร: Gateway อาจตัดทอนฟิลด์ข้อความที่ยาว ละเว้นข้อมูลเมตาที่หนัก และแทนที่รายการที่ใหญ่เกินไปด้วย `[chat.history omitted: message too large]`
- `chat.history` ยังถูก normalize สำหรับการแสดงผลด้วย: แท็กคำสั่งกำกับการส่งแบบ inline
  เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`, payload XML ของการเรียกใช้เครื่องมือในข้อความธรรมดา
  (รวมถึง `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` และบล็อกการเรียกใช้เครื่องมือที่ถูกตัดทอน) และ
  model control tokens แบบ ASCII/full-width ที่รั่วออกมาจะถูกตัดออกจากข้อความที่มองเห็นได้
  และรายการ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดมีเพียงโทเค็นแบบเงียบที่ตรงกันทุกตัวอักษร
  `NO_REPLY` / `no_reply` จะถูกละเว้น
- `chat.inject` จะ append บันทึกของ assistant ลงใน transcript โดยตรง และกระจายไปยัง UI (ไม่มีการรันเอเจนต์)
- การรันที่ถูก abort สามารถคงเอาต์พุต assistant บางส่วนให้มองเห็นได้ใน UI
- Gateway จะ persist ข้อความ assistant บางส่วนจากการ abort ลงในประวัติ transcript เมื่อมี buffered output อยู่ และทำเครื่องหมายรายการเหล่านั้นด้วยข้อมูลเมตาการ abort
- ประวัติจะถูกดึงจาก gateway เสมอ (ไม่มีการเฝ้าดูไฟล์ในเครื่อง)
- หาก gateway ไม่สามารถเข้าถึงได้ WebChat จะเป็นแบบอ่านอย่างเดียว

## แผง tools ของ agents ใน Control UI

- แผง Tools ของ `/agents` ใน Control UI มีสองมุมมองแยกกัน:
  - **Available Right Now** ใช้ `tools.effective(sessionKey=...)` และแสดงสิ่งที่เซสชันปัจจุบัน
    สามารถใช้ได้จริงใน runtime รวมถึง tools ที่เป็นของ core, plugin และช่องทางส่งข้อความ
  - **Tool Configuration** ใช้ `tools.catalog` และยังคงเน้นที่ profiles, overrides และ
    semantics ของ catalog
- ความพร้อมใช้งานใน runtime มีขอบเขตตามเซสชัน การสลับเซสชันบนเอเจนต์เดียวกันสามารถเปลี่ยน
  รายการ **Available Right Now** ได้
- ตัวแก้ไข config ไม่ได้บ่งบอกถึงความพร้อมใช้งานใน runtime; การเข้าถึงที่มีผลจริงยังคงเป็นไปตาม
  ลำดับความสำคัญของนโยบาย (`allow`/`deny`, overrides ต่อเอเจนต์ และต่อผู้ให้บริการ/ช่องทางส่งข้อความ)

## การใช้งานระยะไกล

- โหมดระยะไกลจะ tunnel Gateway WebSocket ผ่าน SSH/Tailscale
- คุณไม่จำเป็นต้องรัน WebChat server แยกต่างหาก

## เอกสารอ้างอิงการกำหนดค่า (WebChat)

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของ WebChat:

- `gateway.webchat.chatHistoryMaxChars`: จำนวนอักขระสูงสุดสำหรับฟิลด์ข้อความใน response ของ `chat.history` เมื่อรายการ transcript เกินขีดจำกัดนี้ Gateway จะตัดทอนฟิลด์ข้อความที่ยาว และอาจแทนที่ข้อความที่ใหญ่เกินไปด้วย placeholder ไคลเอนต์ยังสามารถส่ง `maxChars` ต่อคำขอเพื่อ override ค่าเริ่มต้นนี้สำหรับการเรียก `chat.history` ครั้งเดียวได้

ตัวเลือก global ที่เกี่ยวข้อง:

- `gateway.port`, `gateway.bind`: โฮสต์/พอร์ตของ WebSocket
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  การยืนยันตัวตน WebSocket แบบ shared-secret
- `gateway.auth.allowTailscale`: แท็บแชตของ browser Control UI สามารถใช้ส่วนหัวตัวตนจาก Tailscale
  Serve ได้เมื่อเปิดใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxy auth สำหรับไคลเอนต์บนเบราว์เซอร์ที่อยู่หลัง proxy **ที่ไม่ใช่ loopback** และรับรู้ตัวตน (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: เป้าหมาย remote gateway
- `session.*`: ที่เก็บเซสชันและค่าเริ่มต้นของ main key

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui)
- [Dashboard](/th/web/dashboard)
