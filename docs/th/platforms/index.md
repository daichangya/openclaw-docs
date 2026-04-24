---
read_when:
    - กำลังมองหาการรองรับระบบปฏิบัติการหรือเส้นทางการติดตั้ง
    - กำลังตัดสินใจว่าจะรัน Gateway ที่ไหน
summary: ภาพรวมการรองรับแพลตฟอร์ม (Gateway + แอปคู่หู)
title: แพลตฟอร์ม
x-i18n:
    generated_at: "2026-04-24T09:21:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

แกนหลักของ OpenClaw เขียนด้วย TypeScript โดย **Node เป็น runtime ที่แนะนำ**
ไม่แนะนำให้ใช้ Bun สำหรับ Gateway — มีปัญหาที่ทราบแล้วกับ channels อย่าง WhatsApp และ
Telegram; ดู [Bun (experimental)](/th/install/bun) สำหรับรายละเอียด

มีแอปคู่หูสำหรับ macOS (แอปบนแถบเมนู) และ mobile nodes (iOS/Android) ส่วนแอปคู่หูสำหรับ Windows และ
Linux มีแผนจะตามมา แต่ Gateway รองรับอย่างสมบูรณ์แล้วในปัจจุบัน
แอปคู่หูแบบ native สำหรับ Windows ก็มีแผนจะตามมาเช่นกัน; สำหรับ Gateway แนะนำให้ใช้ผ่าน WSL2

## เลือกระบบปฏิบัติการของคุณ

- macOS: [macOS](/th/platforms/macos)
- iOS: [iOS](/th/platforms/ios)
- Android: [Android](/th/platforms/android)
- Windows: [Windows](/th/platforms/windows)
- Linux: [Linux](/th/platforms/linux)

## VPS และการโฮสต์

- ศูนย์รวม VPS: [VPS hosting](/th/vps)
- Fly.io: [Fly.io](/th/install/fly)
- Hetzner (Docker): [Hetzner](/th/install/hetzner)
- GCP (Compute Engine): [GCP](/th/install/gcp)
- Azure (Linux VM): [Azure](/th/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/th/install/exe-dev)

## ลิงก์ที่ใช้บ่อย

- คู่มือติดตั้ง: [Getting Started](/th/start/getting-started)
- คู่มือปฏิบัติการ Gateway: [Gateway](/th/gateway)
- การกำหนดค่า Gateway: [Configuration](/th/gateway/configuration)
- สถานะ service: `openclaw gateway status`

## การติดตั้งบริการ Gateway (CLI)

ใช้วิธีใดวิธีหนึ่งต่อไปนี้ (รองรับทั้งหมด):

- Wizard (แนะนำ): `openclaw onboard --install-daemon`
- โดยตรง: `openclaw gateway install`
- ผ่าน flow ของ configure: `openclaw configure` → เลือก **Gateway service**
- ซ่อมแซม/ย้ายระบบ: `openclaw doctor` (จะเสนอให้ติดตั้งหรือซ่อมบริการ)

เป้าหมายของบริการขึ้นอยู่กับระบบปฏิบัติการ:

- macOS: LaunchAgent (`ai.openclaw.gateway` หรือ `ai.openclaw.<profile>`; แบบ legacy คือ `com.openclaw.*`)
- Linux/WSL2: systemd user service (`openclaw-gateway[-<profile>].service`)
- Windows แบบ native: Scheduled Task (`OpenClaw Gateway` หรือ `OpenClaw Gateway (<profile>)`) พร้อม fallback เป็นรายการ login item ใน Startup folder แบบต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ

## ที่เกี่ยวข้อง

- [Install overview](/th/install)
- [macOS app](/th/platforms/macos)
- [iOS app](/th/platforms/ios)
