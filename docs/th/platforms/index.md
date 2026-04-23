---
read_when:
    - กำลังมองหาการรองรับระบบปฏิบัติการหรือเส้นทางการติดตั้ง
    - การตัดสินใจว่าจะรัน Gateway ที่ใด
summary: ภาพรวมการรองรับแพลตฟอร์ม (Gateway + แอปประกอบ)
title: แพลตฟอร์ม
x-i18n:
    generated_at: "2026-04-23T05:44:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# แพลตฟอร์ม

แกนของ OpenClaw เขียนด้วย TypeScript โดย **แนะนำให้ใช้ Node เป็นรันไทม์**
ไม่แนะนำให้ใช้ Bun สำหรับ Gateway (มีบั๊กกับ WhatsApp/Telegram)

มีแอปประกอบสำหรับ macOS (แอปบน menu bar) และ mobile nodes (iOS/Android) ส่วนแอปประกอบสำหรับ Windows และ
Linux มีแผนจะตามมา แต่ Gateway รองรับเต็มรูปแบบแล้วในวันนี้
แอปประกอบแบบเนทีฟสำหรับ Windows ก็มีแผนเช่นกัน; แนะนำให้ใช้ Gateway ผ่าน WSL2

## เลือกระบบปฏิบัติการของคุณ

- macOS: [macOS](/th/platforms/macos)
- iOS: [iOS](/th/platforms/ios)
- Android: [Android](/th/platforms/android)
- Windows: [Windows](/th/platforms/windows)
- Linux: [Linux](/th/platforms/linux)

## VPS และการโฮสต์

- ศูนย์กลาง VPS: [VPS hosting](/th/vps)
- Fly.io: [Fly.io](/th/install/fly)
- Hetzner (Docker): [Hetzner](/th/install/hetzner)
- GCP (Compute Engine): [GCP](/th/install/gcp)
- Azure (Linux VM): [Azure](/th/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/th/install/exe-dev)

## ลิงก์ทั่วไป

- คู่มือติดตั้ง: [Getting Started](/th/start/getting-started)
- คู่มือปฏิบัติการ Gateway: [Gateway](/th/gateway)
- การกำหนดค่า Gateway: [Configuration](/th/gateway/configuration)
- สถานะ service: `openclaw gateway status`

## การติดตั้ง service ของ Gateway (CLI)

ใช้วิธีใดวิธีหนึ่งต่อไปนี้ (รองรับทั้งหมด):

- Wizard (แนะนำ): `openclaw onboard --install-daemon`
- โดยตรง: `openclaw gateway install`
- ผ่านโฟลว์ configure: `openclaw configure` → เลือก **Gateway service**
- ซ่อมแซม/ย้ายระบบ: `openclaw doctor` (จะเสนอให้ติดตั้งหรือแก้ไข service)

service target ขึ้นกับระบบปฏิบัติการ:

- macOS: LaunchAgent (`ai.openclaw.gateway` หรือ `ai.openclaw.<profile>`; แบบเดิม `com.openclaw.*`)
- Linux/WSL2: systemd user service (`openclaw-gateway[-<profile>].service`)
- Windows แบบเนทีฟ: Scheduled Task (`OpenClaw Gateway` หรือ `OpenClaw Gateway (<profile>)`) พร้อม fallback เป็นรายการล็อกอินใน Startup-folder แบบต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ
