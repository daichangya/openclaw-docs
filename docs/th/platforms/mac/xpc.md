---
read_when:
    - การแก้ไขสัญญา IPC หรือ IPC ของแอปบนแถบเมนู
summary: สถาปัตยกรรม IPC บน macOS สำหรับแอป OpenClaw, ระบบขนส่ง Node ของ Gateway และ PeekabooBridge
title: IPC บน macOS
x-i18n:
    generated_at: "2026-04-23T05:45:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# สถาปัตยกรรม IPC บน macOS ของ OpenClaw

**โมเดลปัจจุบัน:** Unix socket ภายในเครื่องเชื่อมระหว่าง **บริการโฮสต์ของ node** กับ **แอป macOS** สำหรับการอนุมัติ exec และ `system.run` มี debug CLI ชื่อ `openclaw-mac` สำหรับตรวจสอบการค้นพบ/การเชื่อมต่อ; การกระทำของเอเจนต์ยังคงไหลผ่าน Gateway WebSocket และ `node.invoke` ส่วนระบบอัตโนมัติของ UI ใช้ PeekabooBridge

## เป้าหมาย

- อินสแตนซ์ GUI app เดียวที่เป็นเจ้าของงานทั้งหมดที่เกี่ยวข้องกับ TCC (การแจ้งเตือน, การบันทึกหน้าจอ, ไมโครโฟน, เสียงพูด, AppleScript)
- พื้นผิวขนาดเล็กสำหรับระบบอัตโนมัติ: Gateway + คำสั่งของ node และมี PeekabooBridge สำหรับระบบอัตโนมัติของ UI
- สิทธิ์ที่คาดเดาได้: ใช้ bundle ID ที่เซ็นชื่อเดิมเสมอ เปิดโดย launchd ดังนั้นสิทธิ์ TCC จะคงอยู่

## วิธีการทำงาน

### Gateway + ระบบขนส่งของ node

- แอปรัน Gateway (โหมด local) และเชื่อมต่อเข้าไปในฐานะ node
- การกระทำของเอเจนต์ดำเนินการผ่าน `node.invoke` (เช่น `system.run`, `system.notify`, `canvas.*`)

### บริการ node + IPC ของแอป

- บริการโฮสต์ของ node แบบ headless จะเชื่อมต่อไปยัง Gateway WebSocket
- คำขอ `system.run` จะถูกส่งต่อไปยังแอป macOS ผ่าน local Unix socket
- แอปจะทำ exec ในบริบทของ UI ขอการอนุมัติหากจำเป็น และส่งผลลัพธ์กลับมา

แผนภาพ (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (ระบบอัตโนมัติของ UI)

- ระบบอัตโนมัติของ UI ใช้ UNIX socket แยกชื่อ `bridge.sock` และใช้โปรโตคอล JSON ของ PeekabooBridge
- ลำดับความสำคัญของโฮสต์ (ฝั่งไคลเอนต์): Peekaboo.app → Claude.app → OpenClaw.app → การรันในเครื่อง
- ความปลอดภัย: โฮสต์ของ bridge ต้องใช้ TeamID ที่อนุญาต; ช่องทางหลบแบบ same-UID สำหรับ DEBUG เท่านั้นจะถูกคุมด้วย `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (ข้อตกลงของ Peekaboo)
- ดู: [การใช้งาน PeekabooBridge](/th/platforms/mac/peekaboo) สำหรับรายละเอียด

## โฟลว์การปฏิบัติงาน

- รีสตาร์ต/สร้างใหม่: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - kill อินสแตนซ์ที่มีอยู่
  - build + package ด้วย Swift
  - เขียน/bootstrap/kickstart LaunchAgent
- อินสแตนซ์เดียว: แอปจะออกจากการทำงานเร็วตั้งแต่ต้นหากมีอีกอินสแตนซ์หนึ่งที่ใช้ bundle ID เดียวกันกำลังรันอยู่

## หมายเหตุด้านการเสริมความแข็งแรง

- ควรกำหนดให้ทุกพื้นผิวที่มีสิทธิ์สูงต้องตรวจสอบ TeamID ให้ตรงกัน
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG-only) อาจอนุญาตผู้เรียกแบบ same-UID สำหรับการพัฒนาในเครื่อง
- การสื่อสารทั้งหมดยังคงอยู่ภายในเครื่องเท่านั้น; ไม่มี network socket ใดถูกเปิดออก
- prompt ของ TCC จะมาจาก bundle ของ GUI app เท่านั้น; ควรคง bundle ID ที่เซ็นชื่อไว้ให้เสถียรข้ามการ build ใหม่
- การเสริมความแข็งแรงของ IPC: โหมด socket `0600`, token, การตรวจสอบ peer-UID, challenge/response แบบ HMAC, TTL สั้น
