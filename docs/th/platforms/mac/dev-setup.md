---
read_when:
    - การตั้งค่าสภาพแวดล้อมการพัฒนาบน macOS
summary: คู่มือการตั้งค่าสำหรับนักพัฒนาที่ทำงานกับแอป OpenClaw บน macOS
title: การตั้งค่านักพัฒนาบน macOS
x-i18n:
    generated_at: "2026-04-23T05:44:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd13f17391bdd87ef59e4c575e5da3312c4066de00905731263bff655a5db357
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# การตั้งค่านักพัฒนาบน macOS

คู่มือนี้ครอบคลุมขั้นตอนที่จำเป็นสำหรับการ build และรันแอป OpenClaw บน macOS จากซอร์ส

## ข้อกำหนดเบื้องต้น

ก่อน build แอป โปรดตรวจสอบว่าคุณได้ติดตั้งสิ่งต่อไปนี้แล้ว:

1. **Xcode 26.2+**: จำเป็นสำหรับการพัฒนา Swift
2. **Node.js 24 & pnpm**: แนะนำสำหรับ gateway, CLI และสคริปต์แพ็กเกจ ส่วน Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับเพื่อความเข้ากันได้

## 1. ติดตั้ง Dependencies

ติดตั้ง dependencies ทั้งโครงการ:

```bash
pnpm install
```

## 2. Build และแพ็กแอป

หากต้องการ build แอป macOS และแพ็กเป็น `dist/OpenClaw.app` ให้รัน:

```bash
./scripts/package-mac-app.sh
```

หากคุณไม่มี Apple Developer ID certificate สคริปต์จะใช้ **ad-hoc signing** (`-`) โดยอัตโนมัติ

สำหรับโหมด dev run, แฟล็กการ signing และการแก้ปัญหา Team ID ดู README ของแอป macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **หมายเหตุ**: แอปที่เซ็นแบบ ad-hoc อาจทำให้เกิด security prompts หากแอปแครชทันทีพร้อม "Abort trap 6" ให้ดูส่วน [การแก้ปัญหา](#troubleshooting)

## 3. ติดตั้ง CLI

แอป macOS คาดหวังให้มีการติดตั้ง `openclaw` CLI แบบ global เพื่อจัดการงานเบื้องหลัง

**วิธีติดตั้ง (แนะนำ):**

1. เปิดแอป OpenClaw
2. ไปที่แท็บการตั้งค่า **General**
3. คลิก **"Install CLI"**

หรือจะติดตั้งด้วยตนเองก็ได้:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` และ `bun add -g openclaw@<version>` ก็ใช้ได้เช่นกัน
สำหรับรันไทม์ของ Gateway ยังคงแนะนำให้ใช้ Node

## การแก้ปัญหา

### Build ล้มเหลว: Toolchain หรือ SDK ไม่ตรงกัน

การ build แอป macOS คาดหวัง macOS SDK รุ่นล่าสุดและ Swift 6.2 toolchain

**System dependencies (จำเป็น):**

- **macOS เวอร์ชันล่าสุดที่มีใน Software Update** (จำเป็นสำหรับ Xcode 26.2 SDKs)
- **Xcode 26.2** (Swift 6.2 toolchain)

**การตรวจสอบ:**

```bash
xcodebuild -version
xcrun swift --version
```

หากเวอร์ชันไม่ตรงกัน ให้อัปเดต macOS/Xcode แล้วรัน build ใหม่

### แอปแครชตอนอนุญาตสิทธิ์

หากแอปแครชเมื่อคุณพยายามอนุญาตการเข้าถึง **Speech Recognition** หรือ **Microphone** สาเหตุอาจมาจาก TCC cache ที่เสียหายหรือ signature ไม่ตรงกัน

**วิธีแก้:**

1. รีเซ็ตสิทธิ์ TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. หากยังไม่สำเร็จ ให้เปลี่ยน `BUNDLE_ID` ชั่วคราวใน [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) เพื่อบังคับให้ macOS มองเป็น "clean slate"

### Gateway ค้างที่ "Starting..." ไม่สิ้นสุด

หากสถานะ gateway ค้างอยู่ที่ "Starting..." ให้ตรวจสอบว่ามี zombie process ยึดพอร์ตอยู่หรือไม่:

```bash
openclaw gateway status
openclaw gateway stop

# หากคุณไม่ได้ใช้ LaunchAgent (dev mode / manual runs) ให้หา listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

หากมีการรันแบบ manual ยึดพอร์ตอยู่ ให้หยุด process นั้น (Ctrl+C) หากจำเป็นจริงๆ ค่อย kill PID ที่คุณพบด้านบน
