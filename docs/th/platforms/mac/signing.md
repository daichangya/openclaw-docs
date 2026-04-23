---
read_when:
    - การ build หรือเซ็นบิลด์ดีบักบน mac
summary: ขั้นตอนการเซ็นสำหรับบิลด์ดีบัก macOS ที่สร้างโดยสคริปต์แพ็กเกจિંગ
title: การเซ็น macOS
x-i18n:
    generated_at: "2026-04-23T05:45:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# การเซ็นบน mac (บิลด์ดีบัก)

โดยปกติแอปนี้จะถูก build จาก [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ซึ่งตอนนี้:

- ตั้งค่า bundle identifier แบบดีบักที่คงที่: `ai.openclaw.mac.debug`
- เขียน Info.plist ด้วย bundle id นั้น (override ได้ผ่าน `BUNDLE_ID=...`)
- เรียก [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) เพื่อเซ็น binary หลักและ app bundle เพื่อให้ macOS มองว่าแต่ละการ build ใหม่เป็น signed bundle เดิม และคงสิทธิ์ TCC ไว้ (การแจ้งเตือน, accessibility, screen recording, mic, speech) สำหรับสิทธิ์ที่เสถียร ให้ใช้ signing identity จริง; ad-hoc ต้องเปิดใช้เองและเปราะบาง (ดู [สิทธิ์บน macOS](/th/platforms/mac/permissions))
- ใช้ `CODESIGN_TIMESTAMP=auto` เป็นค่าเริ่มต้น; สิ่งนี้จะเปิด trusted timestamp สำหรับลายเซ็น Developer ID ตั้งค่า `CODESIGN_TIMESTAMP=off` เพื่อข้ามการประทับเวลา (บิลด์ดีบักแบบออฟไลน์)
- ฉีด build metadata ลงใน Info.plist: `OpenClawBuildTimestamp` (UTC) และ `OpenClawGitCommit` (short hash) เพื่อให้หน้าต่าง About แสดง build, git และ channel แบบ debug/release ได้
- **การแพ็กเกจใช้ Node 24 เป็นค่าเริ่มต้น**: สคริปต์จะรัน TS build และ build ของ Control UI ส่วน Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับเพื่อความเข้ากันได้
- อ่าน `SIGN_IDENTITY` จาก environment เพิ่ม `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (หรือใบรับรอง Developer ID Application ของคุณ) ลงใน shell rc ของคุณ เพื่อให้เซ็นด้วยใบรับรองของคุณเสมอ การเซ็นแบบ ad-hoc ต้องเปิดใช้โดยชัดเจนผ่าน `ALLOW_ADHOC_SIGNING=1` หรือ `SIGN_IDENTITY="-"` (ไม่แนะนำสำหรับการทดสอบสิทธิ์)
- รันการตรวจสอบ Team ID หลังการเซ็น และจะล้มเหลวหากมี Mach-O ใดภายใน app bundle ถูกเซ็นด้วย Team ID ที่ต่างออกไป ตั้งค่า `SKIP_TEAM_ID_CHECK=1` เพื่อข้าม

## การใช้งาน

```bash
# จากรากของ repo
scripts/package-mac-app.sh               # เลือก identity อัตโนมัติ; แจ้งข้อผิดพลาดหากไม่พบ
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # ใบรับรองจริง
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (สิทธิ์จะไม่คงอยู่)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc แบบ explicit (มีข้อควรระวังเหมือนกัน)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # วิธีแก้ชั่วคราวเฉพาะสำหรับ dev กรณี Sparkle Team ID ไม่ตรงกัน
```

### หมายเหตุเรื่องการเซ็นแบบ Ad-hoc

เมื่อเซ็นด้วย `SIGN_IDENTITY="-"` (ad-hoc) สคริปต์จะปิด **Hardened Runtime** (`--options runtime`) โดยอัตโนมัติ สิ่งนี้จำเป็นเพื่อป้องกันการแครชเมื่อแอปพยายามโหลด embedded framework (เช่น Sparkle) ที่ไม่ได้ใช้ Team ID เดียวกัน ลายเซ็นแบบ ad-hoc ยังทำให้การคงอยู่ของสิทธิ์ TCC ใช้งานไม่ได้; ดู [สิทธิ์บน macOS](/th/platforms/mac/permissions) สำหรับขั้นตอนการกู้คืน

## Build metadata สำหรับ About

`package-mac-app.sh` จะประทับข้อมูลต่อไปนี้ลงใน bundle:

- `OpenClawBuildTimestamp`: ISO8601 UTC ณ เวลาที่แพ็กเกจ
- `OpenClawGitCommit`: short git hash (หรือ `unknown` หากไม่สามารถใช้ได้)

แท็บ About จะอ่านคีย์เหล่านี้เพื่อแสดงเวอร์ชัน วันที่ build git commit และว่าเป็นบิลด์ดีบักหรือไม่ (ผ่าน `#if DEBUG`) ให้รันตัวแพ็กเกจเพื่อรีเฟรชค่าเหล่านี้หลังจากโค้ดเปลี่ยน

## เหตุผล

สิทธิ์ TCC ถูกผูกกับ bundle identifier _และ_ code signature บิลด์ดีบักที่ไม่ได้เซ็นซึ่งมี UUID เปลี่ยนไปเรื่อย ๆ ทำให้ macOS ลืมสิทธิ์ที่อนุญาตไว้หลังการ build ใหม่แต่ละครั้ง การเซ็น binary (ค่าเริ่มต้นคือ ad‑hoc) และคง bundle id/path ให้คงที่ (`dist/OpenClaw.app`) จะรักษาสิทธิ์เหล่านั้นไว้ระหว่างการ build ต่าง ๆ ซึ่งสอดคล้องกับแนวทางของ VibeTunnel
