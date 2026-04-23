---
read_when:
    - การตั้งค่าเครื่องใหม่
    - คุณต้องการ “ใหม่ล่าสุดและดีที่สุด” โดยไม่ทำให้การตั้งค่าส่วนตัวของคุณพัง＠＼(^analysis to=final  天天中彩票追号ানি translate only.
summary: เวิร์กโฟลว์การตั้งค่าและการพัฒนาขั้นสูงสำหรับ OpenClaw
title: การตั้งค่า
x-i18n:
    generated_at: "2026-04-23T05:58:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# การตั้งค่า

<Note>
หากคุณกำลังตั้งค่าเป็นครั้งแรก ให้เริ่มที่ [Getting Started](/th/start/getting-started)
สำหรับรายละเอียดของ onboarding ดู [Onboarding (CLI)](/th/start/wizard)
</Note>

## สรุปสั้น ๆ

- **การปรับแต่งอยู่ภายนอกรีโป:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (คอนฟิก)
- **เวิร์กโฟลว์แบบเสถียร:** ติดตั้งแอป macOS แล้วปล่อยให้มันรัน Gateway แบบ bundled
- **เวิร์กโฟลว์แบบ bleeding edge:** รัน Gateway เองผ่าน `pnpm gateway:watch` แล้วปล่อยให้แอป macOS มา attach ในโหมด Local

## ข้อกำหนดเบื้องต้น (จาก source)

- แนะนำ Node 24 (ยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+`)
- ควรใช้ `pnpm` (หรือ Bun หากคุณตั้งใจใช้ [เวิร์กโฟลว์ Bun](/th/install/bun))
- Docker (ไม่บังคับ; ใช้เฉพาะสำหรับชุดติดตั้งแบบคอนเทนเนอร์/e2e — ดู [Docker](/th/install/docker))

## กลยุทธ์การปรับแต่ง (เพื่อให้อัปเดตแล้วไม่พัง)

หากคุณต้องการให้ “ปรับให้เข้ากับฉัน 100%” _และ_ อัปเดตง่าย ให้เก็บการปรับแต่งของคุณไว้ใน:

- **คอนฟิก:** `~/.openclaw/openclaw.json` (ลักษณะ JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompt, memory; ควรทำให้เป็น private git repo)

bootstrap ครั้งเดียว:

```bash
openclaw setup
```

จากภายในรีโปนี้ ให้ใช้ entry ของ CLI ในเครื่อง:

```bash
openclaw setup
```

หากคุณยังไม่มีการติดตั้งแบบ global ให้รันผ่าน `pnpm openclaw setup` (หรือ `bun run openclaw setup` หากคุณใช้เวิร์กโฟลว์ Bun)

## รัน Gateway จากรีโปนี้

หลังจาก `pnpm build` คุณสามารถรัน CLI แบบแพ็กเกจได้โดยตรง:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## เวิร์กโฟลว์แบบเสถียร (แอป macOS มาก่อน)

1. ติดตั้ง + เปิด **OpenClaw.app** (แถบเมนู)
2. ทำ onboarding/เช็กลิสต์สิทธิ์ให้เสร็จ (prompt ของ TCC)
3. ตรวจสอบให้แน่ใจว่า Gateway เป็นโหมด **Local** และกำลังรันอยู่ (แอปจะจัดการให้)
4. เชื่อมพื้นผิวต่าง ๆ (ตัวอย่าง: WhatsApp):

```bash
openclaw channels login
```

5. ตรวจสอบความเรียบร้อย:

```bash
openclaw health
```

หาก build ของคุณไม่มี onboarding:

- รัน `openclaw setup` จากนั้น `openclaw channels login` แล้วเริ่ม Gateway ด้วยตนเอง (`openclaw gateway`)

## เวิร์กโฟลว์แบบ bleeding edge (Gateway ในเทอร์มินัล)

เป้าหมาย: ทำงานกับ Gateway ที่เขียนด้วย TypeScript, ได้ hot reload และยังคงให้ UI ของแอป macOS attach อยู่ได้

### 0) (ไม่บังคับ) รันแอป macOS จาก source ด้วย

หากคุณต้องการให้แอป macOS อยู่บน bleeding edge ด้วย:

```bash
./scripts/restart-mac.sh
```

### 1) เริ่ม dev Gateway

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` จะรัน Gateway ในโหมด watch และ reload เมื่อมีการเปลี่ยนแปลงของ source,
config และเมทาดาทาของ bundled-plugin ที่เกี่ยวข้อง
`pnpm openclaw setup` คือขั้นตอนเริ่มต้นแบบครั้งเดียวสำหรับคอนฟิก/workspace ภายในเครื่องใน checkout ใหม่
`pnpm gateway:watch` จะไม่ rebuild `dist/control-ui` ดังนั้นให้รัน `pnpm ui:build` ใหม่หลังมีการเปลี่ยนแปลงใน `ui/` หรือใช้ `pnpm ui:dev` ระหว่างพัฒนา Control UI

หากคุณตั้งใจใช้เวิร์กโฟลว์ Bun คำสั่งที่เทียบเท่าคือ:

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) ชี้แอป macOS ไปยัง Gateway ที่กำลังรันอยู่

ใน **OpenClaw.app**:

- Connection Mode: **Local**
  แอปจะ attach ไปยัง Gateway ที่กำลังรันอยู่บนพอร์ตที่ตั้งค่าไว้

### 3) ตรวจสอบ

- สถานะ Gateway ในแอปควรแสดง **“Using existing gateway …”**
- หรือผ่าน CLI:

```bash
openclaw health
```

### จุดพลาดที่พบบ่อย

- **พอร์ตผิด:** ค่าเริ่มต้นของ Gateway WS คือ `ws://127.0.0.1:18789`; ให้แอป + CLI ใช้พอร์ตเดียวกัน
- **state อยู่ที่ไหน:**
  - สถานะของช่องทาง/ผู้ให้บริการ: `~/.openclaw/credentials/`
  - auth profile ของโมเดล: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - เซสชัน: `~/.openclaw/agents/<agentId>/sessions/`
  - logs: `/tmp/openclaw/`

## แผนผังการจัดเก็บ credentials

ใช้สิ่งนี้เมื่อดีบัก auth หรือตัดสินใจว่าควรสำรองอะไรไว้:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติ; ไม่รับ symlink)
- **Discord bot token**: config/env หรือ SecretRef (ผู้ให้บริการ env/file/exec)
- **Slack tokens**: config/env (`channels.slack.*`)
- **allowlist ของ pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **auth profile ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload ของ secret ที่อิงไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบ legacy**: `~/.openclaw/credentials/oauth.json`
  รายละเอียดเพิ่มเติม: [Security](/th/gateway/security#credential-storage-map)

## การอัปเดต (โดยไม่ทำให้การตั้งค่าคุณพัง)

- ให้ถือว่า `~/.openclaw/workspace` และ `~/.openclaw/` เป็น “ของคุณ”; อย่าใส่ prompt/config ส่วนตัวลงในรีโป `openclaw`
- การอัปเดตจาก source: `git pull` + ขั้นตอนติดตั้งตาม package manager ที่คุณเลือก (`pnpm install` โดยค่าเริ่มต้น; `bun install` สำหรับเวิร์กโฟลว์ Bun) + ใช้คำสั่ง `gateway:watch` ที่ตรงกันต่อไป

## Linux (systemd user service)

การติดตั้งบน Linux ใช้ systemd **user** service โดยค่าเริ่มต้น systemd จะหยุด user
service เมื่อ logout/idle ซึ่งจะทำให้ Gateway หยุดด้วย Onboarding จะพยายามเปิด
lingering ให้คุณ (อาจถามหา sudo) หากยังปิดอยู่ ให้รัน:

```bash
sudo loginctl enable-linger $USER
```

สำหรับเซิร์ฟเวอร์ที่ต้องเปิดตลอดเวลาหรือมีหลายผู้ใช้ ควรพิจารณาใช้ **system** service แทน
user service (ไม่ต้องใช้ lingering) ดูหมายเหตุของ systemd ได้ที่ [Gateway runbook](/th/gateway)

## เอกสารที่เกี่ยวข้อง

- [Gateway runbook](/th/gateway) (แฟล็ก, การกำกับดูแล, พอร์ต)
- [Gateway configuration](/th/gateway/configuration) (schema ของคอนฟิก + ตัวอย่าง)
- [Discord](/th/channels/discord) และ [Telegram](/th/channels/telegram) (reply tag + การตั้งค่า replyToMode)
- [การตั้งค่า OpenClaw assistant](/th/start/openclaw)
- [แอป macOS](/th/platforms/macos) (วงจรชีวิตของ Gateway)
