---
read_when:
    - คุณรัน OpenClaw ด้วย Docker บ่อย ๆ และต้องการคำสั่งประจำวันให้สั้นลง
    - คุณต้องการชั้นตัวช่วยสำหรับแดชบอร์ด บันทึก การตั้งค่าโทเค็น และโฟลว์ pairing
summary: ตัวช่วยเชลล์ ClawDock สำหรับการติดตั้ง OpenClaw แบบ Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T09:16:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock คือชั้นตัวช่วยเชลล์ขนาดเล็กสำหรับการติดตั้ง OpenClaw แบบ Docker

มันให้คำสั่งสั้น ๆ เช่น `clawdock-start`, `clawdock-dashboard` และ `clawdock-fix-token` แทนการใช้คำสั่ง `docker compose ...` ที่ยาวกว่า

หากคุณยังไม่ได้ตั้งค่า Docker ให้เริ่มที่ [Docker](/th/install/docker)

## การติดตั้ง

ใช้พาธตัวช่วยมาตรฐาน:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากก่อนหน้านี้คุณติดตั้ง ClawDock จาก `scripts/shell-helpers/clawdock-helpers.sh` ให้ติดตั้งใหม่จากพาธใหม่ `scripts/clawdock/clawdock-helpers.sh` พาธ raw GitHub แบบเก่าถูกลบออกแล้ว

## สิ่งที่คุณจะได้รับ

### การดำเนินการพื้นฐาน

| คำสั่ง | คำอธิบาย |
| ------------------ | ---------------------- |
| `clawdock-start`   | เริ่ม Gateway |
| `clawdock-stop`    | หยุด Gateway |
| `clawdock-restart` | รีสตาร์ต Gateway |
| `clawdock-status`  | ตรวจสอบสถานะคอนเทนเนอร์ |
| `clawdock-logs`    | ติดตามบันทึกของ Gateway |

### การเข้าถึงคอนเทนเนอร์

| คำสั่ง | คำอธิบาย |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | เปิดเชลล์ภายในคอนเทนเนอร์ Gateway |
| `clawdock-cli <command>`  | รันคำสั่ง OpenClaw CLI ใน Docker |
| `clawdock-exec <command>` | รันคำสั่งใด ๆ ภายในคอนเทนเนอร์ |

### เว็บ UI และการจับคู่

| คำสั่ง | คำอธิบาย |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | เปิด URL ของ Control UI |
| `clawdock-devices`      | แสดงรายการการจับคู่อุปกรณ์ที่กำลังรอ |
| `clawdock-approve <id>` | อนุมัติคำขอการจับคู่ |

### การตั้งค่าและการบำรุงรักษา

| คำสั่ง | คำอธิบาย |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | กำหนดค่า Gateway token ภายในคอนเทนเนอร์ |
| `clawdock-update`    | pull, rebuild และ restart |
| `clawdock-rebuild`   | rebuild เฉพาะ Docker image |
| `clawdock-clean`     | ลบคอนเทนเนอร์และโวลุ่ม |

### เครื่องมืออรรถประโยชน์

| คำสั่ง | คำอธิบาย |
| ---------------------- | --------------------------------------- |
| `clawdock-health`      | รันการตรวจสอบสุขภาพของ Gateway |
| `clawdock-token`       | แสดง Gateway token |
| `clawdock-cd`          | กระโดดไปยังไดเรกทอรีโปรเจกต์ OpenClaw |
| `clawdock-config`      | เปิด `~/.openclaw` |
| `clawdock-show-config` | พิมพ์ไฟล์ config พร้อมปิดทับค่า |
| `clawdock-workspace`   | เปิดไดเรกทอรีพื้นที่ทำงาน |

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

## Config และ secrets

ClawDock ใช้งานร่วมกับการแยก config แบบ Docker เดียวกับที่อธิบายไว้ใน [Docker](/th/install/docker):

- `<project>/.env` สำหรับค่าที่เฉพาะกับ Docker เช่นชื่อ image, พอร์ต และ Gateway token
- `~/.openclaw/.env` สำหรับคีย์ของผู้ให้บริการและ bot token ที่อิงกับ env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` สำหรับ auth ของผู้ให้บริการแบบ OAuth/API-key ที่เก็บไว้
- `~/.openclaw/openclaw.json` สำหรับ config พฤติกรรม

ใช้ `clawdock-show-config` เมื่อคุณต้องการตรวจสอบไฟล์ `.env` และ `openclaw.json` อย่างรวดเร็ว มันจะปิดทับค่าใน `.env` ในเอาต์พุตที่พิมพ์ออกมา

## หน้าที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [Docker VM Runtime](/th/install/docker-vm-runtime)
- [การอัปเดต](/th/install/updating)
