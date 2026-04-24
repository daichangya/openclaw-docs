---
read_when:
    - การตั้งค่าเครื่องใหม่
    - คุณต้องการ “ใหม่ล่าสุดและดีที่สุด” โดยไม่ทำให้การตั้งค่าส่วนตัวของคุณพัง
summary: การตั้งค่าขั้นสูงและเวิร์กโฟลว์การพัฒนาสำหรับ OpenClaw
title: การตั้งค่า
x-i18n:
    generated_at: "2026-04-24T09:34:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
หากคุณกำลังตั้งค่าเป็นครั้งแรก ให้เริ่มจาก [Getting Started](/th/start/getting-started)
สำหรับรายละเอียดการเริ่มต้นใช้งาน ดู [Onboarding (CLI)](/th/start/wizard)
</Note>

## สรุปสั้น ๆ

เลือกเวิร์กโฟลว์การตั้งค่าตามความถี่ที่คุณต้องการอัปเดต และตามว่าคุณต้องการรัน Gateway เองหรือไม่:

- **การปรับแต่งอยู่ภายนอกรีโป:** เก็บ config และ workspace ของคุณไว้ใน `~/.openclaw/openclaw.json` และ `~/.openclaw/workspace/` เพื่อให้การอัปเดตรีโปไม่กระทบกับสิ่งเหล่านั้น
- **เวิร์กโฟลว์แบบเสถียร (แนะนำสำหรับผู้ใช้ส่วนใหญ่):** ติดตั้งแอป macOS และให้แอปเป็นผู้รัน Gateway ที่มากับชุดติดตั้ง
- **เวิร์กโฟลว์ล้ำหน้า (dev):** รัน Gateway เองผ่าน `pnpm gateway:watch` แล้วให้แอป macOS เชื่อมต่อในโหมด Local

## ข้อกำหนดเบื้องต้น (จากซอร์ส)

- แนะนำ Node 24 (ยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+`)
- แนะนำ `pnpm` (หรือ Bun หากคุณตั้งใจใช้ [เวิร์กโฟลว์ Bun](/th/install/bun))
- Docker (ไม่บังคับ; ใช้เฉพาะสำหรับการตั้งค่าแบบคอนเทนเนอร์/e2e — ดู [Docker](/th/install/docker))

## กลยุทธ์การปรับแต่ง (เพื่อไม่ให้อัปเดตแล้วเจ็บตัว)

หากคุณต้องการให้ “ปรับแต่งให้เหมาะกับฉัน 100%” _และ_ อัปเดตได้ง่าย ให้เก็บการปรับแต่งของคุณไว้ใน:

- **Config:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (Skills, พรอมป์, ความทรงจำ; ทำให้เป็น private git repo ได้)

บูตสแตรปหนึ่งครั้ง:

```bash
openclaw setup
```

จากภายในรีโปนี้ ให้ใช้ entry ของ CLI ในเครื่อง:

```bash
openclaw setup
```

หากคุณยังไม่ได้ติดตั้งแบบ global ให้รันผ่าน `pnpm openclaw setup` (หรือ `bun run openclaw setup` หากคุณใช้เวิร์กโฟลว์ Bun)

## รัน Gateway จากรีโปนี้

หลังจาก `pnpm build` คุณสามารถรัน CLI ที่แพ็กเกจแล้วได้โดยตรง:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## เวิร์กโฟลว์แบบเสถียร (ใช้แอป macOS ก่อน)

1. ติดตั้ง + เปิด **OpenClaw.app** (แถบเมนู)
2. ทำรายการตรวจสอบการเริ่มต้นใช้งาน/การอนุญาตให้เสร็จสิ้น (พรอมป์ TCC)
3. ตรวจสอบให้แน่ใจว่า Gateway เป็นโหมด **Local** และกำลังทำงานอยู่ (แอปจะจัดการให้)
4. เชื่อมโยงพื้นผิวการใช้งานต่าง ๆ (ตัวอย่าง: WhatsApp):

```bash
openclaw channels login
```

5. ตรวจสอบแบบคร่าว ๆ:

```bash
openclaw health
```

หากบิลด์ของคุณยังไม่มีการเริ่มต้นใช้งาน:

- รัน `openclaw setup` จากนั้น `openclaw channels login` แล้วเริ่ม Gateway ด้วยตนเอง (`openclaw gateway`)

## เวิร์กโฟลว์ล้ำหน้า (Gateway ในเทอร์มินัล)

เป้าหมาย: ทำงานกับ TypeScript Gateway, ได้ hot reload, และยังคงให้ UI ของแอป macOS เชื่อมต่ออยู่

### 0) (ไม่บังคับ) รันแอป macOS จากซอร์สด้วย

หากคุณต้องการให้แอป macOS ใช้เวอร์ชันล้ำหน้าด้วย:

```bash
./scripts/restart-mac.sh
```

### 1) เริ่ม Gateway สำหรับ dev

```bash
pnpm install
# รันครั้งแรกเท่านั้น (หรือหลังจากรีเซ็ต local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` จะรัน gateway ในโหมด watch และรีโหลดเมื่อมีการเปลี่ยนแปลงที่เกี่ยวข้องในซอร์ส,
config และเมทาดาทาของ bundled plugin
`pnpm openclaw setup` คือขั้นตอนเริ่มต้นแบบครั้งเดียวสำหรับ local config/workspace ใน checkout ใหม่
`pnpm gateway:watch` จะไม่ rebuild `dist/control-ui` ดังนั้นให้รัน `pnpm ui:build` อีกครั้งหลังจากมีการเปลี่ยนแปลงใน `ui/` หรือใช้ `pnpm ui:dev` ระหว่างพัฒนา Control UI

หากคุณตั้งใจใช้เวิร์กโฟลว์ Bun คำสั่งที่เทียบเท่าคือ:

```bash
bun install
# รันครั้งแรกเท่านั้น (หรือหลังจากรีเซ็ต local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) ชี้แอป macOS ไปยัง Gateway ที่คุณกำลังรันอยู่

ใน **OpenClaw.app**:

- โหมดการเชื่อมต่อ: **Local**
  แอปจะเชื่อมต่อกับ gateway ที่กำลังรันอยู่บนพอร์ตที่กำหนดค่าไว้

### 3) ตรวจสอบ

- สถานะ Gateway ในแอปควรแสดง **“Using existing gateway …”**
- หรือผ่าน CLI:

```bash
openclaw health
```

### จุดพลาดที่พบบ่อย

- **พอร์ตไม่ถูกต้อง:** Gateway WS ใช้ค่าเริ่มต้นเป็น `ws://127.0.0.1:18789`; ให้แอปและ CLI ใช้พอร์ตเดียวกัน
- **ตำแหน่งที่เก็บสถานะ:**
  - สถานะของช่องทาง/ผู้ให้บริการ: `~/.openclaw/credentials/`
  - โปรไฟล์การยืนยันตัวตนของโมเดล: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - เซสชัน: `~/.openclaw/agents/<agentId>/sessions/`
  - บันทึก: `/tmp/openclaw/`

## แผนผังการจัดเก็บข้อมูลรับรอง

ใช้ส่วนนี้เมื่อดีบักการยืนยันตัวตนหรือตัดสินใจว่าควรสำรองอะไรไว้:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น; ปฏิเสธ symlink)
- **Discord bot token**: config/env หรือ SecretRef (ผู้ให้บริการ env/file/exec)
- **Slack tokens**: config/env (`channels.slack.*`)
- **allowlist สำหรับการจับคู่**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีค่าเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **โปรไฟล์การยืนยันตัวตนของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **เพย์โหลดข้อมูลลับแบบไฟล์รองรับ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบเดิม**: `~/.openclaw/credentials/oauth.json`
  รายละเอียดเพิ่มเติม: [Security](/th/gateway/security#credential-storage-map)

## การอัปเดต (โดยไม่ทำให้การตั้งค่าของคุณพัง)

- เก็บ `~/.openclaw/workspace` และ `~/.openclaw/` เป็น “ของคุณ”; อย่านำพรอมป์/config ส่วนตัวไปไว้ในรีโป `openclaw`
- การอัปเดตซอร์ส: `git pull` + ขั้นตอนติดตั้งของ package manager ที่คุณเลือก (`pnpm install` ตามค่าเริ่มต้น; `bun install` สำหรับเวิร์กโฟลว์ Bun) + ใช้คำสั่ง `gateway:watch` ที่ตรงกันต่อไป

## Linux (บริการผู้ใช้ systemd)

การติดตั้งบน Linux ใช้บริการผู้ใช้ของ systemd (**user** service) โดยค่าเริ่มต้น systemd จะหยุดบริการผู้ใช้
เมื่อ logout/idle ซึ่งจะทำให้ Gateway หยุดทำงาน การเริ่มต้นใช้งานจะพยายามเปิด lingering ให้คุณโดยอัตโนมัติ
(อาจขอ sudo) หากยังปิดอยู่ ให้รัน:

```bash
sudo loginctl enable-linger $USER
```

สำหรับเซิร์ฟเวอร์ที่ต้องเปิดตลอดเวลาหรือมีหลายผู้ใช้ ให้พิจารณาใช้ **system** service แทน
user service (ไม่ต้องใช้ lingering) ดูหมายเหตุเกี่ยวกับ systemd ได้ที่ [Gateway runbook](/th/gateway)

## เอกสารที่เกี่ยวข้อง

- [Gateway runbook](/th/gateway) (แฟล็ก, การควบคุมดูแล, พอร์ต)
- [การกำหนดค่า Gateway](/th/gateway/configuration) (schema ของ config + ตัวอย่าง)
- [Discord](/th/channels/discord) และ [Telegram](/th/channels/telegram) (แท็กการตอบกลับ + การตั้งค่า replyToMode)
- [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw)
- [แอป macOS](/th/platforms/macos) (วงจรชีวิตของ gateway)
