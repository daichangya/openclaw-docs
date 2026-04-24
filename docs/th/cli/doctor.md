---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การยืนยันตัวตน และต้องการการแก้ไขแบบมีแนวทาง
    - คุณอัปเดตแล้วและต้องการการตรวจสอบความพร้อมเบื้องต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะระบบ + การซ่อมแซมแบบมีแนวทาง)
title: Doctor
x-i18n:
    generated_at: "2026-04-24T09:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

การตรวจสอบสถานะระบบ + การแก้ไขอย่างรวดเร็วสำหรับ gateway และช่องทางต่าง ๆ

ที่เกี่ยวข้อง:

- การแก้ไขปัญหา: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- การตรวจสอบความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## ตัวอย่าง

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## ตัวเลือก

- `--no-workspace-suggestions`: ปิดคำแนะนำเกี่ยวกับหน่วยความจำ/การค้นหาใน workspace
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ถาม
- `--repair`: ใช้การแก้ไขที่แนะนำโดยไม่ถาม
- `--fix`: alias ของ `--repair`
- `--force`: ใช้การแก้ไขเชิงรุก รวมถึงการเขียนทับ config บริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่ถาม; ใช้เฉพาะ migrations ที่ปลอดภัย
- `--generate-gateway-token`: สร้างและกำหนดค่า gateway token
- `--deep`: สแกนบริการของระบบเพื่อหา gateway installs เพิ่มเติม

หมายเหตุ:

- พรอมป์ต์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเฉพาะเมื่อ stdin เป็น TTY และ**ไม่ได้**ตั้ง `--non-interactive` การรันแบบ headless (Cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมป์ต์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin แบบ eager เพื่อให้การตรวจสอบสถานะแบบ headless ยังคงรวดเร็ว ส่วนเซสชันแบบโต้ตอบจะยังคงโหลด Plugins เต็มรูปแบบเมื่อการตรวจสอบต้องใช้ส่วนร่วมจาก Plugin เหล่านั้น
- `--fix` (alias ของ `--repair`) จะเขียนไฟล์สำรองไปที่ `~/.openclaw/openclaw.json.bak` และลบคีย์ config ที่ไม่รู้จัก พร้อมแสดงรายการที่ถูกลบแต่ละรายการ
- การตรวจสอบความสมบูรณ์ของสถานะตอนนี้สามารถตรวจพบไฟล์ transcript ที่ไม่มีการอ้างอิงในไดเรกทอรี sessions และสามารถเก็บถาวรเป็น `.deleted.<timestamp>` เพื่อคืนพื้นที่อย่างปลอดภัย
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน Cron แบบเดิม และสามารถเขียนทับเพื่อปรับรูปแบบให้ถูกต้องในตำแหน่งเดิมก่อนที่ตัวตั้งเวลาจะต้อง normalize อัตโนมัติระหว่างรันไทม์
- Doctor ซ่อมแซม runtime dependencies ที่หายไปของ bundled Plugin ได้โดยไม่ต้องมีสิทธิ์เขียนไปยังแพ็กเกจ OpenClaw ที่ติดตั้งไว้ สำหรับการติดตั้ง npm ที่เป็นของ root หรือ systemd units ที่มีการ hardening ให้ตั้ง `OPENCLAW_PLUGIN_STAGE_DIR` เป็นไดเรกทอรีที่เขียนได้ เช่น `/var/lib/openclaw/plugin-runtime-deps`
- Doctor จะย้าย legacy Talk config แบบ flat (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การ normalize ของ Talk อีก หากความแตกต่างเพียงอย่างเดียวคือลำดับคีย์ของออบเจ็กต์
- Doctor มีการตรวจสอบความพร้อมใช้งานของ memory-search และสามารถแนะนำ `openclaw configure --section model` ได้เมื่อไม่มีข้อมูลรับรองสำหรับ embeddings
- หากเปิดใช้โหมด sandbox แต่ไม่มี Docker, doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมแนวทางแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการด้วย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียวและจะไม่เขียนข้อมูลรับรอง plaintext แบบ fallback
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวในเส้นทางการแก้ไข doctor จะดำเนินการต่อและรายงานเป็นคำเตือนแทนการออกก่อนกำหนด
- การ resolve ชื่อผู้ใช้แบบอัตโนมัติของ Telegram `allowFrom` (`doctor --fix`) ต้องใช้ Telegram token ที่ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากการตรวจสอบ token ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนและข้ามการ resolve อัตโนมัติในรอบนั้น

## macOS: การ override env ของ `launchctl`

หากก่อนหน้านี้คุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override config file ของคุณ และอาจทำให้เกิดข้อผิดพลาด “unauthorized” อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
