---
read_when:
    - การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
summary: คู่มือการตั้งค่าสำหรับนักพัฒนาที่ทำงานกับแอป macOS ของ OpenClaw
title: การตั้งค่านักพัฒนาสำหรับ macOS
x-i18n:
    generated_at: "2026-04-24T09:21:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# การตั้งค่านักพัฒนาสำหรับ macOS

คู่มือนี้ครอบคลุมขั้นตอนที่จำเป็นสำหรับการ build และรันแอป macOS ของ OpenClaw จากซอร์ส

## ข้อกำหนดเบื้องต้น

ก่อน build แอป โปรดตรวจสอบว่าคุณติดตั้งสิ่งต่อไปนี้แล้ว:

1. **Xcode 26.2+**: จำเป็นสำหรับการพัฒนา Swift
2. **Node.js 24 & pnpm**: แนะนำสำหรับ gateway, CLI และสคริปต์การแพ็กเกจ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับเพื่อความเข้ากันได้

## 1. ติดตั้ง dependency

ติดตั้ง dependency ทั้งโปรเจกต์:

```bash
pnpm install
```

## 2. Build และแพ็กเกจแอป

หากต้องการ build แอป macOS และแพ็กเกจเป็น `dist/OpenClaw.app` ให้รัน:

```bash
./scripts/package-mac-app.sh
```

หากคุณไม่มีใบรับรอง Apple Developer ID สคริปต์จะใช้ **ad-hoc signing** (`-`) โดยอัตโนมัติ

สำหรับโหมดการรันแบบ dev, แฟล็กสำหรับ signing และการแก้ปัญหา Team ID โปรดดู README ของแอป macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **หมายเหตุ**: แอปที่ signed แบบ ad-hoc อาจกระตุ้น security prompt หากแอป crash ทันทีพร้อมข้อความ "Abort trap 6" ให้ดูส่วน [การแก้ปัญหา](#การแก้ปัญหา)

## 3. ติดตั้ง CLI

แอป macOS คาดว่าจะมีการติดตั้ง CLI `openclaw` แบบ global เพื่อจัดการงานเบื้องหลัง

**หากต้องการติดตั้ง (แนะนำ):**

1. เปิดแอป OpenClaw
2. ไปที่แท็บการตั้งค่า **General**
3. คลิก **"Install CLI"**

หรือจะติดตั้งด้วยตนเองก็ได้:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` และ `bun add -g openclaw@<version>` ก็ใช้งานได้เช่นกัน
สำหรับรันไทม์ของ Gateway, Node ยังคงเป็นเส้นทางที่แนะนำ

## การแก้ปัญหา

### Build ล้มเหลว: Toolchain หรือ SDK ไม่ตรงกัน

การ build แอป macOS คาดหวัง macOS SDK รุ่นล่าสุดและ Swift 6.2 toolchain

**dependency ของระบบ (จำเป็น):**

- **macOS เวอร์ชันล่าสุดที่มีใน Software Update** (จำเป็นสำหรับ SDK ของ Xcode 26.2)
- **Xcode 26.2** (Swift 6.2 toolchain)

**ตรวจสอบ:**

```bash
xcodebuild -version
xcrun swift --version
```

หากเวอร์ชันไม่ตรงกัน ให้อัปเดต macOS/Xcode แล้วรันการ build ใหม่

### แอป crash ตอนให้สิทธิ์

หากแอป crash เมื่อคุณพยายามอนุญาตการเข้าถึง **Speech Recognition** หรือ **Microphone** อาจเกิดจาก TCC cache เสียหาย หรือ signature ไม่ตรงกัน

**วิธีแก้:**

1. รีเซ็ตสิทธิ์ TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. หากยังไม่สำเร็จ ให้เปลี่ยน `BUNDLE_ID` ชั่วคราวใน [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) เพื่อบังคับให้ macOS มองเป็น "clean slate"

### Gateway แสดง "Starting..." ไม่สิ้นสุด

หากสถานะของ gateway ค้างอยู่ที่ "Starting..." ให้ตรวจสอบว่ามี zombie process จับพอร์ตอยู่หรือไม่:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

หากมี manual run จับพอร์ตอยู่ ให้หยุดโพรเซสนั้น (Ctrl+C) หากจำเป็นจริง ๆ ให้ kill PID ที่คุณพบจากด้านบน

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [ภาพรวมการติดตั้ง](/th/install)
