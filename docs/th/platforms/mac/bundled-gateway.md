---
read_when:
    - การแพ็ก OpenClaw.app
    - การดีบักบริการ launchd ของ Gateway บน macOS
    - การติดตั้ง Gateway CLI สำหรับ macOS
summary: รันไทม์ของ Gateway บน macOS (บริการ launchd ภายนอก)
title: Gateway บน macOS
x-i18n:
    generated_at: "2026-04-23T05:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# Gateway บน macOS (launchd ภายนอก)

ขณะนี้ OpenClaw.app ไม่ได้รวม Node/Bun หรือรันไทม์ของ Gateway มาในตัวอีกต่อไป แอป macOS
คาดหวังให้มีการติดตั้ง `openclaw` CLI แบบ **ภายนอก** แอปจะไม่ spawn Gateway เป็น
child process และจะจัดการบริการ launchd แบบต่อผู้ใช้เพื่อให้ Gateway ยังคง
ทำงานอยู่ (หรือจะเชื่อมต่อเข้ากับ Gateway ภายในเครื่องที่มีอยู่แล้วหากกำลังรันอยู่)

## ติดตั้ง CLI (จำเป็นสำหรับโหมด local)

Node 24 คือรันไทม์เริ่มต้นบน Mac ส่วน Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังใช้งานได้เพื่อความเข้ากันได้ จากนั้นติดตั้ง `openclaw` แบบ global:

```bash
npm install -g openclaw@<version>
```

ปุ่ม **Install CLI** ของแอป macOS จะรันโฟลว์การติดตั้งแบบ global แบบเดียวกับที่แอป
ใช้ภายใน: มันจะเลือก npm ก่อน จากนั้น pnpm แล้วจึง bun หากนั่นคือ package manager
เพียงตัวเดียวที่ตรวจพบ Node ยังคงเป็นรันไทม์ของ Gateway ที่แนะนำ

## Launchd (Gateway ในฐานะ LaunchAgent)

Label:

- `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>`; แบบเดิม `com.openclaw.*` อาจยังคงอยู่)

ตำแหน่งของ plist (แบบต่อผู้ใช้):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (หรือ `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

ตัวจัดการ:

- แอป macOS เป็นเจ้าของการติดตั้ง/อัปเดต LaunchAgent ในโหมด Local
- CLI ก็สามารถติดตั้งได้เช่นกัน: `openclaw gateway install`

พฤติกรรม:

- “OpenClaw Active” ใช้เปิด/ปิด LaunchAgent
- การออกจากแอปจะ **ไม่** หยุด gateway (launchd จะคงมันไว้)
- หากมี Gateway รันอยู่แล้วบนพอร์ตที่กำหนดค่าไว้ แอปจะเชื่อมต่อเข้ากับ
  ตัวนั้นแทนที่จะเริ่มตัวใหม่

การบันทึก:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## ความเข้ากันได้ของเวอร์ชัน

แอป macOS จะตรวจสอบเวอร์ชันของ gateway เทียบกับเวอร์ชันของแอปเอง หากไม่
เข้ากัน ให้ อัปเดต global CLI ให้ตรงกับเวอร์ชันของแอป

## การตรวจสอบแบบ smoke

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

จากนั้น:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
