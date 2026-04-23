---
read_when:
    - คุณรัน OpenClaw ด้วย Docker บ่อย ๆ และต้องการคำสั่งประจำวันให้สั้นลง
    - คุณต้องการชั้นตัวช่วยสำหรับแดชบอร์ด ล็อก การตั้งค่า token และโฟลว์การจับคู่
summary: ตัวช่วย shell ของ ClawDock สำหรับการติดตั้ง OpenClaw แบบ Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-23T05:38:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDock คือชั้นตัวช่วย shell ขนาดเล็กสำหรับการติดตั้ง OpenClaw แบบ Docker

มันให้คำสั่งสั้น ๆ เช่น `clawdock-start`, `clawdock-dashboard` และ `clawdock-fix-token` แทนการใช้คำสั่ง `docker compose ...` ที่ยาวกว่า

หากคุณยังไม่ได้ตั้งค่า Docker ให้เริ่มจาก [Docker](/th/install/docker)

## ติดตั้ง

ใช้พาธตัวช่วยที่เป็นมาตรฐาน:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณเคยติดตั้ง ClawDock มาก่อนจาก `scripts/shell-helpers/clawdock-helpers.sh` ให้ติดตั้งใหม่จากพาธใหม่ `scripts/clawdock/clawdock-helpers.sh` พาธ raw GitHub แบบเก่าถูกนำออกแล้ว

## สิ่งที่คุณจะได้รับ

### การทำงานพื้นฐาน

| คำสั่ง            | คำอธิบาย               |
| ----------------- | ---------------------- |
| `clawdock-start`   | เริ่ม gateway          |
| `clawdock-stop`    | หยุด gateway           |
| `clawdock-restart` | รีสตาร์ต gateway       |
| `clawdock-status`  | ตรวจสอบสถานะ container |
| `clawdock-logs`    | ติดตามล็อกของ gateway  |

### การเข้าถึง container

| คำสั่ง                   | คำอธิบาย                                   |
| ------------------------ | ------------------------------------------ |
| `clawdock-shell`          | เปิด shell ภายใน gateway container         |
| `clawdock-cli <command>`  | รันคำสั่ง OpenClaw CLI ใน Docker           |
| `clawdock-exec <command>` | สั่งรันคำสั่งใด ๆ ภายใน container          |

### Web UI และการจับคู่

| คำสั่ง                 | คำอธิบาย                    |
| ---------------------- | --------------------------- |
| `clawdock-dashboard`    | เปิด URL ของ Control UI     |
| `clawdock-devices`      | แสดงรายการการจับคู่อุปกรณ์ที่รออยู่ |
| `clawdock-approve <id>` | อนุมัติคำขอจับคู่            |

### การตั้งค่าและการบำรุงรักษา

| คำสั่ง              | คำอธิบาย                                          |
| ------------------- | ------------------------------------------------- |
| `clawdock-fix-token` | กำหนดค่า gateway token ภายใน container           |
| `clawdock-update`    | ดึง อัปเดต build ใหม่ และรีสตาร์ต                |
| `clawdock-rebuild`   | build Docker image ใหม่เท่านั้น                   |
| `clawdock-clean`     | ลบ containers และ volumes                         |

### เครื่องมืออรรถประโยชน์

| คำสั่ง                | คำอธิบาย                               |
| --------------------- | -------------------------------------- |
| `clawdock-health`      | รันการตรวจสุขภาพของ gateway           |
| `clawdock-token`       | พิมพ์ gateway token                    |
| `clawdock-cd`          | กระโดดไปยังไดเรกทอรีโปรเจกต์ OpenClaw |
| `clawdock-config`      | เปิด `~/.openclaw`                     |
| `clawdock-show-config` | พิมพ์ไฟล์ config พร้อมค่าที่ถูกปกปิด  |
| `clawdock-workspace`   | เปิดไดเรกทอรี workspace                |

## โฟลว์ครั้งแรก

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

หากเบราว์เซอร์บอกว่าต้องมีการจับคู่:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Config และความลับ

ClawDock ใช้งานร่วมกับการแยก config แบบ Docker เดียวกับที่อธิบายไว้ใน [Docker](/th/install/docker):

- `<project>/.env` สำหรับค่าเฉพาะ Docker เช่น ชื่อ image, พอร์ต และ gateway token
- `~/.openclaw/.env` สำหรับ provider key และ bot token ที่อิงกับ env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` สำหรับ auth ของ provider แบบ OAuth/API-key ที่เก็บไว้
- `~/.openclaw/openclaw.json` สำหรับ config ด้านพฤติกรรม

ใช้ `clawdock-show-config` เมื่อต้องการตรวจสอบไฟล์ `.env` และ `openclaw.json` อย่างรวดเร็ว มันจะปกปิดค่าใน `.env` ในเอาต์พุตที่พิมพ์ออกมา

## หน้าที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [Docker VM Runtime](/th/install/docker-vm-runtime)
- [Updating](/th/install/updating)
