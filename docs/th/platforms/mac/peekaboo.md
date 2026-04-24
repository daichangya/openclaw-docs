---
read_when:
    - การโฮสต์ PeekabooBridge ใน OpenClaw.app
    - การเชื่อมต่อ Peekaboo ผ่าน Swift Package Manager
    - การเปลี่ยนโปรโตคอล/พาธของ PeekabooBridge
summary: การเชื่อมต่อ PeekabooBridge สำหรับระบบอัตโนมัติของ UI บน macOS
title: Peekaboo bridge
x-i18n:
    generated_at: "2026-04-24T09:22:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw สามารถโฮสต์ **PeekabooBridge** ในฐานะ broker สำหรับระบบอัตโนมัติของ UI ภายในเครื่องที่รับรู้สิทธิ์อนุญาตได้ ซึ่งช่วยให้ CLI `peekaboo` สามารถขับเคลื่อนระบบอัตโนมัติของ UI ได้โดยใช้สิทธิ์ TCC ของแอป macOS ร่วมกัน

## สิ่งนี้คืออะไร (และไม่ใช่อะไร)

- **โฮสต์**: OpenClaw.app สามารถทำหน้าที่เป็นโฮสต์ของ PeekabooBridge ได้
- **ไคลเอนต์**: ให้ใช้ CLI `peekaboo` (ไม่มีพื้นผิว `openclaw ui ...` แยกต่างหาก)
- **UI**: visual overlays ยังคงอยู่ใน Peekaboo.app; OpenClaw เป็นเพียงโฮสต์ broker แบบบาง

## เปิดใช้ bridge

ในแอป macOS:

- Settings → **Enable Peekaboo Bridge**

เมื่อเปิดใช้ OpenClaw จะเริ่มเซิร์ฟเวอร์ UNIX socket ภายในเครื่อง เมื่อปิดใช้งาน โฮสต์
จะถูกหยุด และ `peekaboo` จะ fallback ไปยังโฮสต์อื่นที่ใช้งานได้

## ลำดับการค้นพบของไคลเอนต์

โดยทั่วไปไคลเอนต์ของ Peekaboo จะลองโฮสต์ตามลำดับนี้:

1. Peekaboo.app (UX เต็มรูปแบบ)
2. Claude.app (หากติดตั้งไว้)
3. OpenClaw.app (thin broker)

ใช้ `peekaboo bridge status --verbose` เพื่อดูว่าโฮสต์ใด active อยู่ และใช้
socket path ใดอยู่ คุณสามารถ override ได้ด้วย:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## ความปลอดภัยและสิทธิ์อนุญาต

- bridge จะตรวจสอบ **ลายเซ็นโค้ดของผู้เรียก**; มีการบังคับใช้ allowlist ของ TeamID
  (TeamID ของโฮสต์ Peekaboo + TeamID ของแอป OpenClaw)
- คำขอจะหมดเวลาหลังจากประมาณ 10 วินาที
- หากไม่มีสิทธิ์ที่จำเป็น bridge จะส่งข้อความข้อผิดพลาดที่ชัดเจนกลับมา
  แทนการเปิด System Settings

## พฤติกรรมของ snapshot (ระบบอัตโนมัติ)

snapshot จะถูกเก็บไว้ในหน่วยความจำและหมดอายุอัตโนมัติหลังจากช่วงเวลาสั้น ๆ
หากคุณต้องการการเก็บไว้นานขึ้น ให้จับใหม่จากไคลเอนต์

## การแก้ไขปัญหา

- หาก `peekaboo` รายงานว่า “bridge client is not authorized” ให้ตรวจสอบว่าไคลเอนต์
  ถูกลงลายเซ็นอย่างถูกต้อง หรือรันโฮสต์ด้วย `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  เฉพาะในโหมด **debug** เท่านั้น
- หากไม่พบโฮสต์ใดเลย ให้เปิดแอปโฮสต์ตัวใดตัวหนึ่ง (Peekaboo.app หรือ OpenClaw.app)
  และยืนยันว่าได้ให้สิทธิ์อนุญาตแล้ว

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์อนุญาตบน macOS](/th/platforms/mac/permissions)
