---
read_when:
    - การ build หรือเซ็นบิลด์ดีบักบน macOS
summary: ขั้นตอนการเซ็นสำหรับบิลด์ดีบักบน macOS ที่สร้างโดยสคริปต์การแพ็กเกจ
title: การเซ็นบน macOS
x-i18n:
    generated_at: "2026-04-24T09:22:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# การเซ็นบน macOS (บิลด์ดีบัก)

โดยทั่วไปแอปนี้จะถูก build จาก [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ซึ่งตอนนี้:

- ตั้งค่า bundle identifier แบบคงที่สำหรับดีบัก: `ai.openclaw.mac.debug`
- เขียน Info.plist ด้วย bundle id ดังกล่าว (override ได้ผ่าน `BUNDLE_ID=...`)
- เรียก [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) เพื่อเซ็นไบนารีหลักและ app bundle เพื่อให้ macOS มองการ rebuild แต่ละครั้งเป็น signed bundle เดิม และคงสิทธิ์ TCC ไว้ (การแจ้งเตือน, accessibility, screen recording, mic, speech) หากต้องการให้สิทธิ์คงที่ ควรใช้ signing identity จริง; ad-hoc เป็นแบบ opt-in และเปราะบาง (ดู [สิทธิ์บน macOS](/th/platforms/mac/permissions))
- ใช้ `CODESIGN_TIMESTAMP=auto` เป็นค่าปริยาย; มันจะเปิด trusted timestamp สำหรับลายเซ็น Developer ID ตั้ง `CODESIGN_TIMESTAMP=off` เพื่อข้ามการประทับเวลา (สำหรับบิลด์ดีบักแบบออฟไลน์)
- inject metadata ของบิลด์ลงใน Info.plist: `OpenClawBuildTimestamp` (UTC) และ `OpenClawGitCommit` (short hash) เพื่อให้หน้า About แสดงข้อมูล build, git และช่องทาง debug/release ได้
- **การแพ็กเกจใช้ Node 24 เป็นค่าปริยาย**: สคริปต์จะรันการ build ของ TS และการ build ของ Control UI โดย Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับเพื่อความเข้ากันได้
- อ่าน `SIGN_IDENTITY` จาก environment เพิ่ม `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (หรือใบรับรอง Developer ID Application ของคุณ) ลงใน shell rc เพื่อให้เซ็นด้วยใบรับรองของคุณเสมอ การเซ็นแบบ ad-hoc ต้อง opt-in อย่างชัดเจนผ่าน `ALLOW_ADHOC_SIGNING=1` หรือ `SIGN_IDENTITY="-"` (ไม่แนะนำสำหรับการทดสอบสิทธิ์)
- รันการตรวจสอบ Team ID หลังการเซ็น และจะล้มเหลวหากมี Mach-O ภายใน app bundle ที่ถูกเซ็นด้วย Team ID คนละตัว ตั้ง `SKIP_TEAM_ID_CHECK=1` เพื่อข้าม

## การใช้งาน

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### หมายเหตุเกี่ยวกับการเซ็นแบบ ad-hoc

เมื่อเซ็นด้วย `SIGN_IDENTITY="-"` (ad-hoc) สคริปต์จะปิด **Hardened Runtime** (`--options runtime`) โดยอัตโนมัติ ซึ่งจำเป็นเพื่อป้องกันการ crash เมื่อแอปพยายามโหลด embedded framework (เช่น Sparkle) ที่ไม่ได้ใช้ Team ID เดียวกัน ลายเซ็นแบบ ad-hoc ยังทำให้การคงอยู่ของสิทธิ์ TCC ใช้งานไม่ได้ด้วย; ดู [สิทธิ์บน macOS](/th/platforms/mac/permissions) สำหรับขั้นตอนการกู้คืน

## metadata ของบิลด์สำหรับ About

`package-mac-app.sh` จะประทับข้อมูลต่อไปนี้ลงใน bundle:

- `OpenClawBuildTimestamp`: ISO8601 UTC ณ เวลาที่แพ็กเกจ
- `OpenClawGitCommit`: git hash แบบสั้น (หรือ `unknown` หากไม่สามารถระบุได้)

แท็บ About จะอ่านคีย์เหล่านี้เพื่อแสดงเวอร์ชัน วันที่ build git commit และว่าเป็นบิลด์ดีบักหรือไม่ (ผ่าน `#if DEBUG`) ให้รันตัวแพ็กเกจใหม่เพื่อรีเฟรชค่าเหล่านี้หลังจากโค้ดมีการเปลี่ยนแปลง

## เหตุผล

สิทธิ์ TCC จะผูกกับ bundle identifier _และ_ code signature บิลด์ดีบักแบบไม่ได้เซ็นซึ่งมี UUID เปลี่ยนไปเรื่อย ๆ ทำให้ macOS ลืมสิทธิ์ที่ให้ไว้หลังการ rebuild ทุกครั้ง การเซ็นไบนารี (ใช้ ad‑hoc เป็นค่าปริยาย) และคง bundle id/path ให้คงที่ (`dist/OpenClaw.app`) จะช่วยคงสิทธิ์เหล่านั้นไว้ระหว่างการ build แต่ละครั้ง ซึ่งสอดคล้องกับแนวทางของ VibeTunnel

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์บน macOS](/th/platforms/mac/permissions)
