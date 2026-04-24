---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างพังหลังการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งแบบ global หรือจาก source) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-04-24T09:19:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

ดูแล OpenClaw ให้เป็นเวอร์ชันล่าสุดอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีที่เร็วที่สุดในการอัปเดต มันจะตรวจจับชนิดการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor` และรีสตาร์ต gateway

```bash
openclaw update
```

หากต้องการสลับ channel หรือกำหนดเป้าหมายเวอร์ชันเฉพาะ:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # แสดงตัวอย่างโดยไม่ลงมือใช้จริง
```

`--channel beta` จะให้ความสำคัญกับ beta แต่ runtime จะ fallback ไปใช้ stable/latest เมื่อ
beta tag ไม่มีอยู่หรือเก่ากว่า stable release ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag แบบดิบสำหรับการอัปเดตแพ็กเกจแบบครั้งเดียว

ดู [Development channels](/th/install/development-channels) สำหรับความหมายของ channel

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding สำหรับการติดตั้งจาก source ให้ส่ง `--install-method git --no-onboard`

## ทางเลือก: npm, pnpm หรือ bun แบบ manual

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### การติดตั้ง npm แบบ global ที่เป็นเจ้าของโดย root

บางการตั้งค่า npm บน Linux จะติดตั้งแพ็กเกจ global ไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น
`/usr/lib/node_modules/openclaw` OpenClaw รองรับโครงแบบนั้น: แพ็กเกจที่ติดตั้งแล้ว
จะถูกมองว่าเป็นแบบ read-only ขณะรัน และ dependency ของ runtime สำหรับ Plugin ที่มาพร้อม
จะถูกจัดวางไว้ในไดเรกทอรี runtime ที่เขียนได้ แทนที่จะเปลี่ยนแปลง tree ของแพ็กเกจ

สำหรับ systemd unit แบบ hardened ให้ตั้งไดเรกทอรี stage ที่เขียนได้ ซึ่งรวมอยู่ใน
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

หากไม่ได้ตั้ง `OPENCLAW_PLUGIN_STAGE_DIR`, OpenClaw จะใช้ `$STATE_DIRECTORY` เมื่อ
systemd จัดเตรียมให้ จากนั้นจึง fallback ไปที่ `~/.openclaw/plugin-runtime-deps`

## ตัวอัปเดตอัตโนมัติ

ตัวอัปเดตอัตโนมัติปิดอยู่โดยค่าเริ่มต้น เปิดใช้งานได้ใน `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | พฤติกรรม |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` จากนั้นจึงใช้จริงพร้อม deterministic jitter ตลอด `stableJitterHours` (กระจาย rollout) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และใช้จริงทันที |
| `dev`    | ไม่มีการใช้จริงอัตโนมัติ ใช้ `openclaw update` ด้วยตนเอง |

Gateway ยังบันทึกคำใบ้การอัปเดตเมื่อเริ่มต้นด้วย (ปิดได้ด้วย `update.checkOnStart: false`)

## หลังการอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config, ตรวจสอบ DM policy และตรวจสอบสุขภาพของ gateway รายละเอียด: [Doctor](/th/gateway/doctor)

### รีสตาร์ต gateway

```bash
openclaw gateway restart
```

### ตรวจสอบ

```bash
openclaw health
```

</Steps>

## การย้อนกลับ

### ปักหมุดเวอร์ชัน (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

เคล็ดลับ: `npm view openclaw version` จะแสดงเวอร์ชันที่เผยแพร่อยู่ในปัจจุบัน

### ปักหมุด commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

หากต้องการกลับไปเวอร์ชันล่าสุด: `git checkout main && git pull`

## หากคุณติดขัด

- รัน `openclaw doctor` อีกครั้งและอ่านเอาต์พุตอย่างละเอียด
- สำหรับ `openclaw update --channel dev` บน source checkout ตัวอัปเดตจะ bootstrap `pnpm` ให้อัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาด bootstrap ของ pnpm/corepack ให้ติดตั้ง `pnpm` ด้วยตนเอง (หรือเปิด `corepack` กลับมา) แล้วรันการอัปเดตใหม่
- ตรวจสอบ: [Troubleshooting](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor) — การตรวจสอบสุขภาพหลังการอัปเดต
- [Migrating](/th/install/migrating) — คู่มือการย้ายเวอร์ชันหลัก
