---
read_when:
    - การรันหรือดีบักโปรเซส gateway
    - การตรวจสอบการบังคับใช้แบบอินสแตนซ์เดียว
summary: ตัวป้องกัน singleton ของ Gateway โดยใช้การ bind ของตัวรับฟัง WebSocket
title: ล็อก Gateway
x-i18n:
    generated_at: "2026-04-24T09:10:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## เหตุผล

- ทำให้มั่นใจว่ามี gateway ทำงานอยู่เพียงอินสแตนซ์เดียวต่อ base port บนโฮสต์เดียวกัน; gateway เพิ่มเติมต้องใช้ profile ที่แยกกันและพอร์ตที่ไม่ซ้ำกัน
- อยู่รอดจากการ crash/SIGKILL โดยไม่ทิ้งไฟล์ lock ที่ค้างไว้
- ล้มเหลวอย่างรวดเร็วพร้อมข้อผิดพลาดที่ชัดเจนเมื่อ control port ถูกใช้งานอยู่แล้ว

## กลไก

- Gateway จะ bind ตัวรับฟัง WebSocket (ค่าเริ่มต้น `ws://127.0.0.1:18789`) ทันทีเมื่อเริ่มต้น โดยใช้ TCP listener แบบ exclusive
- หากการ bind ล้มเหลวด้วย `EADDRINUSE` การเริ่มต้นจะโยน `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`
- ระบบปฏิบัติการจะปล่อย listener โดยอัตโนมัติเมื่อโปรเซสออกจากการทำงาน ไม่ว่าจะเป็นการ crash หรือ SIGKILL—ไม่จำเป็นต้องมีไฟล์ lock แยกต่างหากหรือขั้นตอน cleanup
- เมื่อปิดการทำงาน gateway จะปิดเซิร์ฟเวอร์ WebSocket และเซิร์ฟเวอร์ HTTP ที่อยู่ข้างใต้เพื่อปล่อยพอร์ตอย่างรวดเร็ว

## พื้นผิวข้อผิดพลาด

- หากมีโปรเซสอื่นยึดพอร์ตอยู่ การเริ่มต้นจะโยน `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`
- ความล้มเหลวอื่น ๆ ในการ bind จะแสดงเป็น `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`

## หมายเหตุด้านการปฏิบัติการ

- หากพอร์ตถูกใช้งานโดยโปรเซส _อื่น_ ข้อผิดพลาดจะเหมือนกัน; ให้ปล่อยพอร์ตหรือเลือกพอร์ตอื่นด้วย `openclaw gateway --port <port>`
- แอป macOS ยังคงมีตัวป้องกัน PID แบบเบาของตัวเองก่อนสปอว์น gateway; ส่วนล็อกระดับรันไทม์ถูกบังคับใช้โดยการ bind ของ WebSocket

## ที่เกี่ยวข้อง

- [Multiple Gateways](/th/gateway/multiple-gateways) — การรันหลายอินสแตนซ์ด้วยพอร์ตที่ไม่ซ้ำกัน
- [การแก้ไขปัญหา](/th/gateway/troubleshooting) — การวินิจฉัย `EADDRINUSE` และความขัดแย้งของพอร์ต
