---
read_when:
    - การดีบักสคริปต์พัฒนาเฉพาะ Node หรือความล้มเหลวของโหมด watch
    - การสืบสวนการแครชของตัวโหลด tsx/esbuild ใน OpenClaw
summary: บันทึกและวิธีแก้ปัญหาชั่วคราวสำหรับการแครชของ Node + tsx แบบ "__name is not a function"
title: การแครชของ Node + tsx
x-i18n:
    generated_at: "2026-04-23T05:32:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
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

ปัญหานี้เริ่มขึ้นหลังจากเปลี่ยนสคริปต์พัฒนาจาก Bun มาเป็น `tsx` (commit `2871657e`, 2026-01-06) โดยเส้นทางรันไทม์เดียวกันนี้เคยทำงานได้กับ Bun

## สภาพแวดล้อม

- Node: v25.x (พบปัญหาบน v25.3.0)
- tsx: 4.21.0
- OS: macOS (มีแนวโน้มว่าจะเกิดซ้ำบนแพลตฟอร์มอื่นที่รัน Node 25 ได้เช่นกัน)

## การทำซ้ำปัญหา (เฉพาะ Node)

```bash
# ในรากของ repo
node --version
pnpm install
node --import tsx src/entry.ts status
```

## การทำซ้ำขั้นต่ำใน repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## การตรวจสอบเวอร์ชัน Node

- Node 25.3.0: ล้มเหลว
- Node 22.22.0 (Homebrew `node@22`): ล้มเหลว
- Node 24: ยังไม่ได้ติดตั้งที่นี่; ต้องตรวจสอบเพิ่มเติม

## หมายเหตุ / สมมติฐาน

- `tsx` ใช้ esbuild เพื่อแปลง TS/ESM โดย `keepNames` ของ esbuild จะสร้าง helper ชื่อ `__name` และห่อการประกาศฟังก์ชันด้วย `__name(...)`
- การแครชนี้บ่งชี้ว่า `__name` มีอยู่ แต่ไม่ใช่ฟังก์ชันในรันไทม์ ซึ่งหมายความว่า helper อาจหายไปหรือถูกเขียนทับสำหรับโมดูลนี้ในเส้นทาง loader ของ Node 25
- มีรายงานปัญหาลักษณะคล้ายกันเกี่ยวกับ helper `__name` ในผู้ใช้ esbuild รายอื่นเมื่อ helper หายไปหรือถูกเขียนใหม่

## ประวัติการถดถอย

- `2871657e` (2026-01-06): สคริปต์ถูกเปลี่ยนจาก Bun มาเป็น tsx เพื่อให้ Bun เป็นเพียงตัวเลือก
- ก่อนหน้านั้น (เส้นทาง Bun) `openclaw status` และ `gateway:watch` ทำงานได้

## วิธีแก้ปัญหาชั่วคราว

- ใช้ Bun สำหรับสคริปต์พัฒนา (เป็นการย้อนกลับชั่วคราวในปัจจุบัน)
- ใช้ `tsgo` สำหรับตรวจชนิดของ repo แล้วรันเอาต์พุตที่ build แล้ว:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- หมายเหตุทางประวัติ: เคยใช้ `tsc` ที่นี่ระหว่างดีบักปัญหา Node/tsx นี้ แต่ตอนนี้ lane การตรวจชนิดของ repo ใช้ `tsgo`
- ปิดการใช้ esbuild keepNames ใน TS loader หากทำได้ (จะป้องกันการแทรก helper `__name`); ปัจจุบัน tsx ยังไม่เปิดให้ตั้งค่านี้
- ทดสอบ Node LTS (22/24) กับ `tsx` เพื่อดูว่าปัญหานี้เกิดเฉพาะกับ Node 25 หรือไม่

## แหล่งอ้างอิง

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## ขั้นตอนถัดไป

- ทำซ้ำปัญหาบน Node 22/24 เพื่อยืนยันว่าเป็นการถดถอยของ Node 25
- ทดสอบ `tsx` รุ่น nightly หรือ pin ไปยังเวอร์ชันก่อนหน้า หากมีการถดถอยที่ทราบอยู่แล้ว
- หากปัญหาเกิดซ้ำบน Node LTS ให้ยื่น minimal repro ไปยัง upstream พร้อม stack trace ของ `__name`
