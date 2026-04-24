---
read_when:
    - การดีบักสคริปต์พัฒนาแบบเฉพาะ Node หรือความล้มเหลวของโหมด watch
    - การตรวจสอบการแครชของตัวโหลด tsx/esbuild ใน OpenClaw
summary: บันทึกปัญหาการแครชของ Node + tsx แบบ `"__name is not a function"` และวิธีหลีกเลี่ยง
title: การแครชของ Node + tsx
x-i18n:
    generated_at: "2026-04-24T09:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# การแครชของ Node + tsx แบบ "\_\_name is not a function"

## สรุป

การรัน OpenClaw ผ่าน Node ด้วย `tsx` ล้มเหลวตั้งแต่เริ่มต้นพร้อมข้อความ:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

ปัญหานี้เริ่มขึ้นหลังจากเปลี่ยน dev scripts จาก Bun ไปเป็น `tsx` (commit `2871657e`, 2026-01-06) โดยเส้นทาง runtime เดียวกันนี้เคยทำงานได้กับ Bun

## สภาพแวดล้อม

- Node: v25.x (พบปัญหาบน v25.3.0)
- tsx: 4.21.0
- OS: macOS (มีแนวโน้มว่าจะเกิดซ้ำได้บนแพลตฟอร์มอื่นที่รัน Node 25)

## วิธีทำให้เกิดซ้ำ (Node เท่านั้น)

```bash
# ในรูทของ repo
node --version
pnpm install
node --import tsx src/entry.ts status
```

## ตัวอย่างทำซ้ำขั้นต่ำใน repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## การตรวจสอบเวอร์ชัน Node

- Node 25.3.0: ล้มเหลว
- Node 22.22.0 (Homebrew `node@22`): ล้มเหลว
- Node 24: ยังไม่ได้ติดตั้งที่นี่; ต้องตรวจสอบเพิ่มเติม

## หมายเหตุ / สมมติฐาน

- `tsx` ใช้ esbuild เพื่อแปลง TS/ESM โดย `keepNames` ของ esbuild จะสร้าง helper ชื่อ `__name` และห่อการกำหนดฟังก์ชันด้วย `__name(...)`
- การแครชนี้บ่งชี้ว่า `__name` มีอยู่ แต่ไม่ใช่ฟังก์ชันในขณะรันไทม์ ซึ่งหมายความว่า helper หายไปหรือถูกเขียนทับสำหรับโมดูลนี้ในเส้นทาง loader ของ Node 25
- มีรายงานปัญหาที่คล้ายกันเกี่ยวกับ helper `__name` ในผู้ใช้ esbuild รายอื่นเมื่อ helper หายไปหรือถูกเขียนใหม่

## ประวัติการถดถอย

- `2871657e` (2026-01-06): scripts ถูกเปลี่ยนจาก Bun ไปเป็น tsx เพื่อให้ Bun เป็นทางเลือก
- ก่อนหน้านั้น (เส้นทาง Bun), `openclaw status` และ `gateway:watch` ทำงานได้

## วิธีหลีกเลี่ยง

- ใช้ Bun สำหรับ dev scripts (เป็นการย้อนกลับชั่วคราวในปัจจุบัน)
- ใช้ `tsgo` สำหรับ type checking ของ repo จากนั้นรันผลลัพธ์ที่ build แล้ว:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- หมายเหตุทางประวัติ: เคยใช้ `tsc` ขณะดีบักปัญหา Node/tsx นี้ แต่ปัจจุบัน lanes สำหรับ type-check ของ repo ใช้ `tsgo`
- ปิด esbuild keepNames ใน TS loader หากทำได้ (จะป้องกันการแทรก helper `__name`); ปัจจุบัน tsx ยังไม่เปิดให้กำหนดค่านี้
- ทดสอบ Node LTS (22/24) กับ `tsx` เพื่อดูว่าปัญหานี้เฉพาะกับ Node 25 หรือไม่

## แหล่งอ้างอิง

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## ขั้นตอนถัดไป

- ทำให้เกิดซ้ำบน Node 22/24 เพื่อยืนยันว่าเป็นการถดถอยของ Node 25
- ทดสอบ `tsx` รุ่น nightly หรือปักหมุดไปยังเวอร์ชันก่อนหน้า หากมีการถดถอยที่ทราบอยู่แล้ว
- หากเกิดซ้ำบน Node LTS ให้ส่งตัวอย่างทำซ้ำขั้นต่ำไปยัง upstream พร้อม stack trace ของ `__name`

## ที่เกี่ยวข้อง

- [การติดตั้ง Node.js](/th/install/node)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
