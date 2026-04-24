---
read_when:
    - คุณต้องการอัปเดต source checkout อย่างปลอดภัย【อ่านข้อความเต็มanalysis to=none  大发快三计划 없음
    - คุณต้องการทำความเข้าใจพฤติกรรมแบบย่อของ `--update`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw update` (อัปเดตซอร์สแบบปลอดภัยพอสมควร + รีสตาร์ต gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-04-24T09:04:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (ติดตั้งแบบ global และไม่มี git metadata)
การอัปเดตจะทำผ่านโฟลว์ของ package manager ตามใน [Updating](/th/install/updating)

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

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังอัปเดตสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางการอัปเดต (git + npm; บันทึกถาวรไว้ใน config)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะถูกแมปเป็น `github:openclaw/openclaw#main`
- `--dry-run`: ดูตัวอย่างการกระทำที่จะทำในการอัปเดต (channel/tag/target/restart flow) โดยไม่เขียน config ติดตั้ง ซิงก์ Plugins หรือรีสตาร์ต
- `--json`: พิมพ์ `UpdateRunResult` JSON แบบ machine-readable รวมถึง
  `postUpdate.plugins.integrityDrifts` เมื่อพบความคลาดเคลื่อนของ npm plugin artifact
  ระหว่างการซิงก์ Plugin หลังอัปเดต
- `--timeout <seconds>`: ระยะหมดเวลาต่อขั้นตอน (ค่าเริ่มต้น 1200 วินาที)
- `--yes`: ข้ามข้อความยืนยัน (เช่น การยืนยันการ downgrade)

หมายเหตุ: การ downgrade ต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้ config ใช้งานไม่ได้

## `update status`

แสดงช่องทางการอัปเดตที่ใช้งานอยู่ + git tag/branch/SHA (สำหรับ source checkouts) พร้อมทั้งสถานะว่ามีอัปเดตหรือไม่

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ status JSON แบบ machine-readable
- `--timeout <seconds>`: ระยะหมดเวลาสำหรับการตรวจสอบ (ค่าเริ่มต้น 3 วินาที)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกช่องทางการอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout
ระบบจะเสนอให้สร้างขึ้นมา

ตัวเลือก:

- `--timeout <seconds>`: ระยะหมดเวลาสำหรับแต่ละขั้นตอนการอัปเดต (ค่าเริ่มต้น `1200`)

## สิ่งที่คำสั่งนี้ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีติดตั้งให้สอดคล้องกันด้วย:

- `dev` → ตรวจสอบให้มี git checkout (ค่าเริ่มต้น: `~/openclaw`, แทนที่ได้ด้วย `OPENCLAW_GIT_DIR`)
  อัปเดตมัน แล้วติดตั้ง global CLI จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → ให้ความสำคัญกับ npm dist-tag `beta` แต่จะ fallback ไปที่ `latest` เมื่อไม่มี beta
  หรือเก่ากว่า stable release ปัจจุบัน

ตัวอัปเดตอัตโนมัติของ Gateway core (เมื่อเปิดใช้งานผ่าน config) จะใช้เส้นทางอัปเดตเดียวกันนี้ซ้ำ

สำหรับการติดตั้งผ่าน package manager, `openclaw update` จะ resolve เวอร์ชันแพ็กเกจ
เป้าหมายก่อนเรียกใช้ package manager หากเวอร์ชันที่ติดตั้งอยู่ตรงกับเป้าหมาย
อย่างพอดี และไม่มีการเปลี่ยนแปลงช่องทางอัปเดตที่ต้องบันทึกถาวร
คำสั่งจะออกโดยสถานะเป็น skipped ก่อนถึงขั้นติดตั้งแพ็กเกจ ซิงก์ Plugin รีเฟรชการเติมคำ
หรือรีสตาร์ต gateway

## โฟลว์ของ git checkout

ช่องทางต่าง ๆ:

- `stable`: checkout tag ล่าสุดที่ไม่ใช่ beta แล้ว build + doctor
- `beta`: ให้ความสำคัญกับ tag `-beta` ล่าสุด แต่ fallback ไปยัง stable tag ล่าสุด
  เมื่อไม่มี beta หรือเก่ากว่า
- `dev`: checkout `main` แล้ว fetch + rebase

ภาพรวมระดับสูง:

1. ต้องใช้ worktree ที่สะอาด (ไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit)
2. สลับไปยังช่องทางที่เลือก (tag หรือ branch)
3. ดึงข้อมูลจาก upstream (เฉพาะ dev)
4. เฉพาะ dev: รัน preflight lint + TypeScript build ใน temp worktree; หากปลายล่าสุดล้มเหลว จะย้อนกลับได้สูงสุด 10 commits เพื่อหา build ที่ผ่านล่าสุด
5. rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
6. ติดตั้ง dependencies ด้วย package manager ของ repo สำหรับ pnpm checkouts ตัวอัปเดตจะ bootstrap `pnpm` เมื่อจำเป็น (ผ่าน `corepack` ก่อน จากนั้น fallback เป็น `npm install pnpm@10` แบบชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
7. build และ build Control UI
8. รัน `openclaw doctor` เป็นการตรวจสอบ “safe update” ขั้นสุดท้าย
9. ซิงก์ Plugins ให้ตรงกับช่องทางที่ใช้งานอยู่ (dev ใช้ bundled plugins; stable/beta ใช้ npm) และอัปเดต Plugins ที่ติดตั้งผ่าน npm

หากการอัปเดต npm Plugin ที่ pin ไว้อย่างชัดเจน resolve ไปยัง artifact ที่มี integrity
ต่างจาก install record ที่เก็บไว้ `openclaw update` จะยกเลิกการอัปเดต artifact ของ Plugin นั้น
แทนการติดตั้ง ให้ติดตั้งหรืออัปเดต Plugin นั้นอย่างชัดเจนอีกครั้ง
หลังจากตรวจสอบแล้วว่าเชื่อถือ artifact ใหม่ได้เท่านั้น

หากการ bootstrap pnpm ยังล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่เนิ่น ๆ พร้อมข้อผิดพลาดเฉพาะของ package manager แทนที่จะลอง `npm run build` ภายใน checkout

## รูปแบบย่อ `--update`

`openclaw --update` จะถูกเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shells และ launcher scripts)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [Development channels](/th/install/development-channels)
- [Updating](/th/install/updating)
- [CLI reference](/th/cli)
