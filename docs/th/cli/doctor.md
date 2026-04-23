---
read_when:
    - คุณมีปัญหาด้านการเชื่อมต่อ/การยืนยันตัวตน และต้องการแนวทางแก้ไขแบบมีคำแนะนำ
    - คุณเพิ่งอัปเดตและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสุขภาพ + การซ่อมแซมแบบมีคำแนะนำ)
title: doctor
x-i18n:
    generated_at: "2026-04-23T06:17:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad44619b427b938b2f6d4f904fcdc2d9862ff33c569008590f25e17d12e03530
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

การตรวจสอบสุขภาพ + การแก้ไขด่วนสำหรับ gateway และ channels

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

- `--no-workspace-suggestions`: ปิดคำแนะนำเกี่ยวกับหน่วยความจำ/การค้นหาของ workspace
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ต้องถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำโดยไม่ต้องถาม
- `--fix`: ชื่อเรียกแทนของ `--repair`
- `--force`: ใช้การซ่อมแซมแบบเข้มข้น รวมถึงเขียนทับ config บริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: ทำงานโดยไม่มีพรอมป์ต์; เฉพาะการย้ายข้อมูลที่ปลอดภัย
- `--generate-gateway-token`: สร้างและกำหนดค่า gateway token
- `--deep`: สแกนบริการของระบบเพื่อค้นหาการติดตั้ง gateway เพิ่มเติม

หมายเหตุ:

- พรอมป์ต์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะทำงานเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` การรันแบบ headless (Cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมป์ต์
- `--fix` (ชื่อเรียกแทนของ `--repair`) จะเขียนไฟล์สำรองไปที่ `~/.openclaw/openclaw.json.bak` และลบ config keys ที่ไม่รู้จัก โดยแสดงรายการแต่ละรายการที่ถูกลบ
- การตรวจสอบความสมบูรณ์ของ state ตอนนี้สามารถตรวจจับไฟล์ transcript ที่ไม่มีเจ้าของในไดเรกทอรี sessions และสามารถเก็บถาวรเป็น `.deleted.<timestamp>` เพื่อคืนพื้นที่อย่างปลอดภัย
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน Cron แบบดั้งเดิม และสามารถเขียนใหม่แทนที่ในที่เดิมก่อนที่ scheduler จะต้องปรับให้อยู่ในรูปแบบปกติอัตโนมัติระหว่างรันไทม์
- Doctor ซ่อมแซม runtime dependencies ของ Plugin แบบ bundled ที่หายไปได้ โดยไม่ต้องใช้สิทธิ์เขียนไปยังแพ็กเกจ OpenClaw ที่ติดตั้งไว้ สำหรับการติดตั้ง npm ที่เป็นของ root หรือ systemd units ที่มีการ harden ให้ตั้งค่า `OPENCLAW_PLUGIN_STAGE_DIR` ไปยังไดเรกทอรีที่เขียนได้ เช่น `/var/lib/openclaw/plugin-runtime-deps`
- Doctor จะย้าย Talk config แบบแบนรุ่นเก่า (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้ Talk normalization อีกต่อไป หากความแตกต่างมีเพียงลำดับของ object keys
- Doctor มีการตรวจสอบความพร้อมของ memory-search และสามารถแนะนำ `openclaw configure --section model` เมื่อไม่มี credentials สำหรับ embedding
- หากเปิดใช้งานโหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่ชัดเจนพร้อมแนวทางแก้ไข (`ติดตั้ง Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการด้วย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียว และจะไม่เขียน credentials แบบ plaintext สำรอง
- หากการตรวจสอบ SecretRef ของ channel ล้มเหลวในเส้นทางการแก้ไข doctor จะทำงานต่อและรายงานคำเตือนแทนการออกจากโปรแกรมก่อนเวลา
- การ resolve ชื่อผู้ใช้แบบอัตโนมัติสำหรับ `allowFrom` ของ Telegram (`doctor --fix`) ต้องใช้ Telegram token ที่สามารถ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากไม่สามารถตรวจสอบ token ได้ doctor จะรายงานคำเตือนและข้ามการ resolve อัตโนมัติในรอบนั้น

## macOS: การ override env ของ `launchctl`

หากคุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) มาก่อน ค่านั้นจะ override ไฟล์ config ของคุณ และอาจทำให้เกิดข้อผิดพลาด “unauthorized” อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
