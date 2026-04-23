---
read_when:
    - กำลังดีบักมุมมอง WebChat บน mac หรือพอร์ต loopback
summary: วิธีที่แอป mac ฝัง Gateway WebChat และวิธีดีบักมัน
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-23T05:45:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2c45fa5512cc9c5d3b3aa188d94e2e5a90e4bcce607d959d40bea8b17c90c5
    source_path: platforms/mac/webchat.md
    workflow: 15
---

# WebChat (แอป macOS)

แอปในแถบเมนูของ macOS ฝัง UI ของ WebChat เป็นมุมมอง SwiftUI แบบเนทีฟ มัน
เชื่อมต่อกับ Gateway และใช้ค่าเริ่มต้นเป็น **main session** สำหรับเอเจนต์ที่เลือก
(พร้อมตัวสลับ session สำหรับ sessions อื่น)

- **โหมด Local**: เชื่อมต่อโดยตรงกับ Gateway WebSocket ในเครื่อง
- **โหมด Remote**: ส่งต่อ control port ของ Gateway ผ่าน SSH และใช้
  tunnel นั้นเป็น data plane

## การเปิดใช้งานและการดีบัก

- แบบ manual: เมนู Lobster → “Open Chat”
- เปิดอัตโนมัติสำหรับการทดสอบ:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Logs: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`)

## วิธีการเชื่อมต่อ

- Data plane: ใช้ methods ของ Gateway WS ได้แก่ `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` และ events ได้แก่ `chat`, `agent`, `presence`, `tick`, `health`
- `chat.history` จะส่งคืน transcript rows ที่ normalize แล้วสำหรับการแสดงผล: inline directive
  tags จะถูกลบออกจากข้อความที่มองเห็นได้, payload XML ของการเรียกใช้เครื่องมือในข้อความล้วน
  (รวมถึง `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` และบล็อกการเรียกใช้เครื่องมือแบบถูกตัดทอน) และ
  leaked ASCII/full-width model control tokens จะถูกลบออก, assistant rows ที่มีแต่
  silent-token ล้วนๆ เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละเว้น
  และ rows ที่มีขนาดใหญ่เกินไปอาจถูกแทนที่ด้วย placeholders
- Session: ใช้ session หลักเป็นค่าเริ่มต้น (`main` หรือ `global` เมื่อ scope เป็น
  global) UI สามารถสลับไปมาระหว่าง sessions ได้
- Onboarding ใช้ session เฉพาะเพื่อแยกการตั้งค่าครั้งแรกออกจากกัน

## พื้นผิวด้านความปลอดภัย

- โหมด Remote จะส่งต่อเฉพาะ Gateway WebSocket control port ผ่าน SSH เท่านั้น

## ข้อจำกัดที่ทราบ

- UI ถูกปรับให้เหมาะกับ chat sessions (ไม่ใช่ browser sandbox แบบเต็ม)
