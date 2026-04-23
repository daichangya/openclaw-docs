---
read_when:
    - การโฮสต์ PeekabooBridge ใน OpenClaw.app
    - การผสานรวม Peekaboo ผ่าน Swift Package Manager
    - การเปลี่ยนโปรโตคอล/พาธของ PeekabooBridge
summary: การผสานรวม PeekabooBridge สำหรับระบบอัตโนมัติของ UI บน macOS
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-23T05:45:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (ระบบอัตโนมัติของ UI บน macOS)

OpenClaw สามารถโฮสต์ **PeekabooBridge** เป็นโบรกเกอร์ระบบอัตโนมัติของ UI ภายในเครื่องที่รับรู้เรื่องสิทธิ์ได้
วิธีนี้ทำให้ CLI `peekaboo` สามารถขับระบบอัตโนมัติของ UI ได้ โดยใช้สิทธิ์ TCC ของแอป macOS ซ้ำได้

## สิ่งนี้คืออะไร (และไม่ใช่อะไร)

- **โฮสต์**: OpenClaw.app สามารถทำหน้าที่เป็นโฮสต์ของ PeekabooBridge ได้
- **ไคลเอนต์**: ให้ใช้ CLI `peekaboo` (ไม่มีพื้นผิว `openclaw ui ...` แยกต่างหาก)
- **UI**: overlay แบบภาพยังคงอยู่ใน Peekaboo.app; OpenClaw เป็นเพียงโฮสต์โบรกเกอร์แบบบาง

## เปิดใช้งาน bridge

ในแอป macOS:

- Settings → **Enable Peekaboo Bridge**

เมื่อเปิดใช้ OpenClaw จะเริ่มเซิร์ฟเวอร์ local UNIX socket หากปิดใช้งาน โฮสต์
จะหยุดทำงาน และ `peekaboo` จะ fallback ไปยังโฮสต์อื่นที่มีอยู่

## ลำดับการค้นพบของไคลเอนต์

โดยทั่วไปไคลเอนต์ Peekaboo จะลองโฮสต์ตามลำดับนี้:

1. Peekaboo.app (UX แบบเต็ม)
2. Claude.app (หากติดตั้งไว้)
3. OpenClaw.app (โบรกเกอร์แบบบาง)

ใช้ `peekaboo bridge status --verbose` เพื่อดูว่าโฮสต์ใดกำลัง active และใช้
พาธ socket ใดอยู่ คุณสามารถ override ได้ด้วย:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## ความปลอดภัยและสิทธิ์

- bridge จะตรวจสอบ **ลายเซ็นโค้ดของผู้เรียก**; มีการบังคับใช้ allowlist ของ TeamID
  (TeamID ของโฮสต์ Peekaboo + TeamID ของแอป OpenClaw)
- คำขอจะหมดเวลาภายในประมาณ 10 วินาที
- หากไม่มีสิทธิ์ที่จำเป็น bridge จะส่งข้อความข้อผิดพลาดที่ชัดเจนกลับมา
  แทนการเปิด System Settings

## พฤติกรรมของ snapshot (automation)

snapshot จะถูกเก็บไว้ใน memory และหมดอายุอัตโนมัติหลังช่วงเวลาสั้น ๆ
หากคุณต้องการเก็บไว้นานขึ้น ให้จับใหม่จากฝั่งไคลเอนต์

## การแก้ไขปัญหา

- หาก `peekaboo` รายงานว่า “bridge client is not authorized” ให้ตรวจสอบว่าไคลเอนต์
  ถูกเซ็นอย่างถูกต้อง หรือรันโฮสต์ด้วย `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  ในโหมด **debug** เท่านั้น
- หากไม่พบโฮสต์ใดเลย ให้เปิดแอปโฮสต์ตัวใดตัวหนึ่ง (Peekaboo.app หรือ OpenClaw.app)
  และยืนยันว่าได้ให้สิทธิ์เรียบร้อยแล้ว
