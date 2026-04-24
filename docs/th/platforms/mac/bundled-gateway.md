---
read_when:
    - การแพ็ก OpenClaw.app
    - การแก้จุดบกพร่องบริการ launchd ของ gateway บน macOS
    - การติดตั้ง gateway CLI สำหรับ macOS
summary: Gateway runtime บน macOS (บริการ launchd ภายนอก)
title: Gateway บน macOS
x-i18n:
    generated_at: "2026-04-24T09:21:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app ไม่ได้ bundle Node/Bun หรือ Gateway runtime มาอีกต่อไป แอป macOS
คาดว่าจะมีการติดตั้ง `openclaw` CLI แบบ **ภายนอก** ไม่ spawn Gateway เป็น
child process และจัดการบริการ launchd แบบต่อผู้ใช้เพื่อให้ Gateway
ทำงานต่อเนื่อง (หรือ attach เข้ากับ Gateway ในเครื่องที่มีอยู่แล้ว หากมีการรันอยู่ก่อน)

## ติดตั้ง CLI (จำเป็นสำหรับ local mode)

Node 24 คือ runtime เริ่มต้นบน Mac ปัจจุบัน Node 22 LTS, `22.14+`, ก็ยังใช้งานได้เพื่อความเข้ากันได้ จากนั้นติดตั้ง `openclaw` แบบ global:

```bash
npm install -g openclaw@<version>
```

ปุ่ม **Install CLI** ในแอป macOS จะรัน flow การติดตั้งแบบ global แบบเดียวกับที่แอป
ใช้ภายใน: มันจะเลือก npm ก่อน จากนั้น pnpm แล้วค่อย bun หากเป็น package manager ตัวเดียวที่ตรวจพบ Node ยังคงเป็น Gateway runtime ที่แนะนำ

## Launchd (Gateway เป็น LaunchAgent)

Label:

- `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>`; แบบ legacy `com.openclaw.*` อาจยังคงอยู่)

ตำแหน่ง plist (ต่อผู้ใช้):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (หรือ `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

ตัวจัดการ:

- แอป macOS เป็นผู้ดูแลการติดตั้ง/อัปเดต LaunchAgent ใน Local mode
- CLI ก็ติดตั้งได้เช่นกัน: `openclaw gateway install`

พฤติกรรม:

- “OpenClaw Active” ใช้เปิด/ปิด LaunchAgent
- การปิดแอป **จะไม่** หยุด gateway (launchd จะคงให้มันทำงานต่อ)
- หากมี Gateway ทำงานอยู่แล้วบนพอร์ตที่กำหนด แอปจะ attach ไปยัง
  ตัวนั้นแทนการเริ่มตัวใหม่

การบันทึก logs:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## ความเข้ากันได้ของเวอร์ชัน

แอป macOS จะตรวจเวอร์ชันของ gateway เทียบกับเวอร์ชันของตัวเอง หาก
ไม่เข้ากัน ให้ update global CLI ให้ตรงกับเวอร์ชันของแอป

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

## ที่เกี่ยวข้อง

- [macOS app](/th/platforms/macos)
- [Gateway runbook](/th/gateway)
