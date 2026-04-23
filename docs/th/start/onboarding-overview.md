---
read_when:
    - การเลือกเส้นทางการเริ่มต้นใช้งาน
    - การตั้งค่าสภาพแวดล้อมใหม่
sidebarTitle: Onboarding Overview
summary: ภาพรวมของตัวเลือกและโฟลว์การเริ่มต้นใช้งานของ OpenClaw
title: ภาพรวมการเริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-04-23T05:57:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374697c1dbe0c3871c43164076fbed7119ef032f4a40d0f6e421051f914806e5
    source_path: start/onboarding-overview.md
    workflow: 15
---

# ภาพรวมการเริ่มต้นใช้งาน

OpenClaw มีเส้นทางการเริ่มต้นใช้งานสองแบบ ทั้งสองแบบจะกำหนดค่า auth, Gateway และ
chat channels แบบไม่บังคับ — ต่างกันเพียงวิธีที่คุณโต้ตอบกับการตั้งค่า

## ควรใช้เส้นทางไหน?

|                | การเริ่มต้นใช้งานผ่าน CLI             | การเริ่มต้นใช้งานผ่านแอป macOS |
| -------------- | -------------------------------------- | ------------------------------ |
| **แพลตฟอร์ม**  | macOS, Linux, Windows (เนทีฟหรือ WSL2) | macOS เท่านั้น                 |
| **อินเทอร์เฟซ** | วิซาร์ดในเทอร์มินัล                    | Guided UI ภายในแอป             |
| **เหมาะที่สุดสำหรับ** | เซิร์ฟเวอร์, headless, การควบคุมเต็มรูปแบบ | Desktop Mac, การตั้งค่าแบบภาพ |
| **ระบบอัตโนมัติ** | `--non-interactive` สำหรับสคริปต์      | แบบ manual เท่านั้น            |
| **คำสั่ง**      | `openclaw onboard`                     | เปิดแอป                        |

ผู้ใช้ส่วนใหญ่ควรเริ่มด้วย **CLI onboarding** — ใช้งานได้ทุกที่และให้
การควบคุมได้มากที่สุด

## สิ่งที่ onboarding กำหนดค่า

ไม่ว่าคุณจะเลือกเส้นทางไหน onboarding จะตั้งค่าดังนี้:

1. **ผู้ให้บริการโมเดลและ auth** — API key, OAuth หรือ setup token สำหรับผู้ให้บริการที่คุณเลือก
2. **Workspace** — ไดเรกทอรีสำหรับไฟล์ของเอเจนต์, bootstrap templates และ memory
3. **Gateway** — พอร์ต, bind address, auth mode
4. **Channels** (ไม่บังคับ) — chat channels แบบ built-in และ bundled เช่น
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp และอื่นๆ
5. **Daemon** (ไม่บังคับ) — บริการเบื้องหลังเพื่อให้ Gateway เริ่มอัตโนมัติ

## CLI onboarding

รันในเทอร์มินัลใดก็ได้:

```bash
openclaw onboard
```

เพิ่ม `--install-daemon` หากต้องการติดตั้งบริการเบื้องหลังในขั้นตอนเดียวด้วย

เอกสารอ้างอิงแบบเต็ม: [Onboarding (CLI)](/th/start/wizard)
เอกสารคำสั่ง CLI: [`openclaw onboard`](/cli/onboard)

## การเริ่มต้นใช้งานผ่านแอป macOS

เปิดแอป OpenClaw วิซาร์ดที่รันครั้งแรกจะพาคุณผ่านขั้นตอนเดียวกัน
ด้วยอินเทอร์เฟซแบบภาพ

เอกสารอ้างอิงแบบเต็ม: [Onboarding (macOS App)](/th/start/onboarding)

## ผู้ให้บริการแบบกำหนดเองหรือที่ไม่มีในรายการ

หากผู้ให้บริการของคุณไม่มีในรายการ onboarding ให้เลือก **Custom Provider** แล้ว
กรอก:

- โหมดความเข้ากันได้ของ API (OpenAI-compatible, Anthropic-compatible หรือ auto-detect)
- Base URL และ API key
- Model ID และ alias แบบไม่บังคับ

custom endpoints หลายรายการสามารถอยู่ร่วมกันได้ — แต่ละรายการจะมี endpoint ID ของตัวเอง
