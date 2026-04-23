---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างพังหลังการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งแบบ global หรือจาก source) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-04-23T05:42:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# การอัปเดต

ทำให้ OpenClaw ทันสมัยอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีที่เร็วที่สุดในการอัปเดต มันจะตรวจจับประเภทการติดตั้งของคุณ (npm หรือ git), ดึงเวอร์ชันล่าสุด, รัน `openclaw doctor` และรีสตาร์ต gateway

```bash
openclaw update
```

หากต้องการสลับ channel หรือกำหนดเป้าหมายเป็นเวอร์ชันเฉพาะ:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # ดูตัวอย่างโดยไม่ลงมือใช้จริง
```

`--channel beta` จะให้ความสำคัญกับ beta แต่รันไทม์จะ fallback ไปยัง stable/latest เมื่อ
ไม่มีแท็ก beta หรือ beta เก่ากว่า stable รุ่นล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag แบบดิบสำหรับการอัปเดตแพ็กเกจแบบครั้งเดียว

ดู [Development channels](/th/install/development-channels) สำหรับความหมายของ channel

## ทางเลือก: รันตัวติดตั้งใหม่

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

### การติดตั้ง npm แบบ global ที่ root เป็นเจ้าของ

ในการตั้งค่า npm บน Linux บางแบบ แพ็กเกจ global จะถูกติดตั้งไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น
`/usr/lib/node_modules/openclaw` OpenClaw รองรับรูปแบบนี้: แพ็กเกจที่ติดตั้งแล้ว
จะถูกมองเป็นแบบอ่านอย่างเดียวในรันไทม์ และ dependency ของรันไทม์สำหรับ bundled plugin
จะถูกจัดเตรียมไว้ในไดเรกทอรีรันไทม์ที่เขียนได้ แทนที่จะเปลี่ยนแปลง
ต้นไม้แพ็กเกจ

สำหรับ systemd unit แบบเสริมความแข็งแรง ให้ตั้งค่าไดเรกทอรี staging ที่เขียนได้ ซึ่งรวมอยู่ใน
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

หากไม่ได้ตั้งค่า `OPENCLAW_PLUGIN_STAGE_DIR` OpenClaw จะใช้ `$STATE_DIRECTORY` เมื่อ
systemd จัดเตรียมไว้ให้ จากนั้นจึง fallback ไปที่ `~/.openclaw/plugin-runtime-deps`

## ตัวอัปเดตอัตโนมัติ

ตัวอัปเดตอัตโนมัติถูกปิดไว้เป็นค่าเริ่มต้น เปิดใช้งานได้ใน `~/.openclaw/openclaw.json`:

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

| Channel  | พฤติกรรม                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` จากนั้นจึงนำไปใช้พร้อม deterministic jitter กระจายอยู่ทั่ว `stableJitterHours` (กระจาย rollout) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และนำไปใช้ทันที                               |
| `dev`    | ไม่มีการนำไปใช้โดยอัตโนมัติ ให้ใช้ `openclaw update` ด้วยตนเอง                                               |

gateway ยังบันทึกคำใบ้เรื่องการอัปเดตตอนเริ่มทำงานด้วย (ปิดได้ด้วย `update.checkOnStart: false`)

## หลังการอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config ตรวจสอบนโยบาย DM และตรวจสอบสุขภาพของ gateway รายละเอียด: [Doctor](/th/gateway/doctor)

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

### Pin เวอร์ชัน (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

เคล็ดลับ: `npm view openclaw version` จะแสดงเวอร์ชันที่เผยแพร่ปัจจุบัน

### Pin commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

หากต้องการกลับไปเป็นล่าสุด: `git checkout main && git pull`

## หากคุณติดปัญหา

- รัน `openclaw doctor` อีกครั้งและอ่านเอาต์พุตอย่างละเอียด
- สำหรับ `openclaw update --channel dev` บน source checkout ตัวอัปเดตจะบูตสแตรป `pnpm` ให้อัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาดการบูตสแตรป pnpm/corepack ให้ติดตั้ง `pnpm` ด้วยตนเอง (หรือเปิด `corepack` กลับมา) แล้วรันการอัปเดตอีกครั้ง
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีการติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor) — การตรวจสุขภาพหลังการอัปเดต
- [Migrating](/th/install/migrating) — คู่มือย้ายเวอร์ชันหลัก
