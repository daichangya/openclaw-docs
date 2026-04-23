---
read_when:
    - คุณต้องการอัปเดต source checkout อย่างปลอดภัย
    - คุณต้องเข้าใจพฤติกรรมแบบย่อของ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (อัปเดตซอร์สแบบปลอดภัยพอสมควร + รีสตาร์ต Gateway อัตโนมัติ)
title: update
x-i18n:
    generated_at: "2026-04-23T06:20:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc049ecf3d35fe276a1e5962bb8e5316dbbc3219ef0b91ee64d41cbbea20f9ae
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (ติดตั้งแบบ global และไม่มีข้อมูลเมตา git)
การอัปเดตจะเกิดขึ้นผ่านโฟลว์ของตัวจัดการแพ็กเกจใน [การอัปเดต](/th/install/updating)

## การใช้งาน

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## ตัวเลือก

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังจากอัปเดตสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางการอัปเดต (git + npm; บันทึกไว้ใน config)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะจับคู่เป็น `github:openclaw/openclaw#main`
- `--dry-run`: แสดงตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (ช่องทาง/tag/เป้าหมาย/โฟลว์รีสตาร์ต) โดยไม่เขียน config, ติดตั้ง, ซิงก์ Plugin หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่เครื่องอ่านได้ ซึ่งรวมถึง
  `postUpdate.plugins.integrityDrifts` เมื่อพบความคลาดเคลื่อนของอาร์ติแฟกต์ Plugin npm
  ระหว่างการซิงก์ Plugin หลังอัปเดต
- `--timeout <seconds>`: หมดเวลาต่อหนึ่งขั้นตอน (ค่าเริ่มต้นคือ 1200 วินาที)
- `--yes`: ข้ามพรอมต์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

หมายเหตุ: การดาวน์เกรดต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้การตั้งค่าใช้งานไม่ได้

## `update status`

แสดงช่องทางการอัปเดตที่ใช้งานอยู่ + tag/branch/SHA ของ git (สำหรับ source checkout) พร้อมสถานะความพร้อมของการอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่เครื่องอ่านได้
- `--timeout <seconds>`: หมดเวลาสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3 วินาที)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกช่องทางการอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout
ระบบจะเสนอให้สร้าง checkout ขึ้นมา

ตัวเลือก:

- `--timeout <seconds>`: หมดเวลาสำหรับแต่ละขั้นตอนของการอัปเดต (ค่าเริ่มต้น `1200`)

## สิ่งที่คำสั่งนี้ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีติดตั้งให้สอดคล้องกันด้วย:

- `dev` → ตรวจสอบให้มี git checkout (ค่าเริ่มต้น: `~/openclaw`, แทนที่ได้ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → ใช้ npm dist-tag `beta` ก่อน แต่จะ fallback ไปใช้ `latest` เมื่อ beta
  ไม่มีอยู่หรือเก่ากว่า stable release ปัจจุบัน

ตัวอัปเดตอัตโนมัติของแกน Gateway (เมื่อเปิดใช้งานผ่าน config) จะใช้เส้นทางการอัปเดตเดียวกันนี้ซ้ำ

สำหรับการติดตั้งผ่านตัวจัดการแพ็กเกจ `openclaw update` จะ resolve เวอร์ชันแพ็กเกจเป้าหมาย
ก่อนเรียกตัวจัดการแพ็กเกจ หากเวอร์ชันที่ติดตั้งอยู่
ตรงกับเป้าหมายพอดี และไม่มีการเปลี่ยนช่องทางการอัปเดตที่ต้องบันทึก
คำสั่งจะออกโดยระบุว่าข้ามแล้วก่อนถึงขั้นติดตั้งแพ็กเกจ, ซิงก์ Plugin, รีเฟรช completion
หรือรีสตาร์ต gateway

## โฟลว์ของ git checkout

ช่องทาง:

- `stable`: checkout tag ล่าสุดที่ไม่ใช่ beta จากนั้น build + doctor
- `beta`: ใช้ tag `-beta` ล่าสุดก่อน แต่จะ fallback ไปใช้ tag stable ล่าสุด
  เมื่อไม่มี beta หรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch + rebase

ภาพรวมระดับสูง:

1. ต้องใช้ worktree ที่สะอาด (ไม่มีการเปลี่ยนแปลงที่ยังไม่ commit)
2. สลับไปยังช่องทางที่เลือก (tag หรือ branch)
3. ดึงจาก upstream (เฉพาะ dev)
4. เฉพาะ dev: ตรวจสอบล่วงหน้าด้วย lint + TypeScript build ใน worktree ชั่วคราว; หากปลายล่าสุดล้มเหลว จะย้อนกลับได้สูงสุด 10 commit เพื่อหา build ที่สะอาดล่าสุด
5. Rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
6. ติดตั้ง dependency ด้วยตัวจัดการแพ็กเกจของ repo สำหรับ checkout แบบ pnpm ตัวอัปเดตจะบูตสแตรป `pnpm` ตามต้องการ (ผ่าน `corepack` ก่อน แล้วค่อย fallback เป็น `npm install pnpm@10` ชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
7. Build และ build Control UI
8. รัน `openclaw doctor` เป็นการตรวจสอบ “การอัปเดตอย่างปลอดภัย” ขั้นสุดท้าย
9. ซิงก์ Plugin ไปยังช่องทางที่ใช้งานอยู่ (dev ใช้ extension ที่มาพร้อมระบบ; stable/beta ใช้ npm) และอัปเดต Plugin ที่ติดตั้งผ่าน npm

หากการอัปเดต Plugin npm แบบ pin ตรง resolve ไปยังอาร์ติแฟกต์ที่มีค่า integrity
ต่างจากบันทึกการติดตั้งที่เก็บไว้ `openclaw update` จะยกเลิกการอัปเดตอาร์ติแฟกต์ Plugin นั้น
แทนการติดตั้ง ให้ติดตั้งหรืออัปเดต Plugin นั้นใหม่อย่างชัดเจน
หลังจากตรวจสอบแล้วเท่านั้นว่าคุณเชื่อถืออาร์ติแฟกต์ใหม่

หากการบูตสแตรป pnpm ยังล้มเหลว ตัวอัปเดตจะหยุดก่อนตั้งแต่เนิ่น ๆ พร้อมข้อผิดพลาด
เฉพาะของตัวจัดการแพ็กเกจ แทนการพยายามรัน `npm run build` ภายใน checkout

## รูปแบบย่อ `--update`

`openclaw --update` จะถูกเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และ launcher script)

## ดูเพิ่มเติม

- `openclaw doctor` (เสนอให้รันการอัปเดตก่อนบน git checkout)
- [ช่องทางการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [ข้อมูลอ้างอิง CLI](/th/cli)
