---
read_when:
    - การรันหรือการดีบักโปรเซส gateway
    - การตรวจสอบการบังคับใช้แบบอินสแตนซ์เดียว
summary: ตัวป้องกัน singleton ของ Gateway โดยใช้การ bind ของตัวรับฟัง WebSocket
title: ล็อก Gateway
x-i18n:
    generated_at: "2026-04-23T05:33:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 726c687ab53f2dd1e46afed8fc791b55310a5c1e62f79a0e38a7dc4ca7576093
    source_path: gateway/gateway-lock.md
    workflow: 15
---

# ล็อก Gateway

## เหตุผล

- ทำให้มั่นใจว่ามี Gateway ทำงานอยู่เพียงอินสแตนซ์เดียวต่อ base port บนโฮสต์เดียวกัน; Gateway เพิ่มเติมต้องใช้โปรไฟล์ที่แยกกันและพอร์ตที่ไม่ซ้ำกัน
- อยู่รอดได้แม้เกิด crash/SIGKILL โดยไม่ทิ้งไฟล์ล็อกค้างไว้
- ล้มเหลวอย่างรวดเร็วพร้อมข้อความผิดพลาดที่ชัดเจนเมื่อ control port ถูกใช้งานอยู่แล้ว

## กลไก

- Gateway จะ bind ตัวรับฟัง WebSocket (ค่าเริ่มต้น `ws://127.0.0.1:18789`) ทันทีเมื่อเริ่มต้น โดยใช้ตัวรับฟัง TCP แบบ exclusive
- หากการ bind ล้มเหลวด้วย `EADDRINUSE` การเริ่มต้นจะ throw `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`
- ระบบปฏิบัติการจะปล่อยตัวรับฟังให้อัตโนมัติเมื่อโปรเซสออกทุกกรณี รวมถึง crash และ SIGKILL—จึงไม่จำเป็นต้องมีไฟล์ล็อกแยกหรือขั้นตอน cleanup
- เมื่อปิดตัว Gateway จะปิด WebSocket server และ HTTP server ที่อยู่ข้างใต้เพื่อคืนพอร์ตอย่างรวดเร็ว

## พื้นที่ที่เกิดข้อผิดพลาด

- หากมีโปรเซสอื่นยึดพอร์ตนั้นอยู่ การเริ่มต้นจะ throw `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`
- ความล้มเหลวในการ bind แบบอื่นจะแสดงเป็น `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`

## หมายเหตุด้านการปฏิบัติงาน

- หากพอร์ตถูกใช้งานโดยโปรเซส _อื่น_ ข้อผิดพลาดจะเหมือนกัน; ให้ปล่อยพอร์ตนั้นหรือเลือกพอร์ตอื่นด้วย `openclaw gateway --port <port>`
- แอป macOS ยังคงมีตัวป้องกัน PID แบบเบาก่อนสปิน gateway; แต่ล็อกในรันไทม์ถูกบังคับใช้ด้วยการ bind ของ WebSocket

## ที่เกี่ยวข้อง

- [Gateway หลายตัว](/th/gateway/multiple-gateways) — การรันหลายอินสแตนซ์ด้วยพอร์ตที่ไม่ซ้ำกัน
- [การแก้ไขปัญหา](/th/gateway/troubleshooting) — การวินิจฉัย `EADDRINUSE` และความขัดแย้งของพอร์ต
