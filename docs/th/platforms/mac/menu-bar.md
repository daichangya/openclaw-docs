---
read_when:
    - การปรับ UI ของเมนูบน Mac หรือตรรกะของสถานะ
summary: ตรรกะสถานะของ menu bar และสิ่งที่แสดงให้ผู้ใช้เห็น
title: Menu Bar
x-i18n:
    generated_at: "2026-04-23T05:45:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# ตรรกะสถานะของ Menu Bar

## สิ่งที่แสดง

- เราแสดงสถานะงานปัจจุบันของเอเจนต์ในไอคอนบน menu bar และในแถวสถานะแรกของเมนู
- สถานะสุขภาพจะถูกซ่อนขณะมีงานกำลังทำอยู่; มันจะกลับมาเมื่อทุก sessions อยู่ในสถานะ idle
- บล็อก “Nodes” ในเมนูจะแสดงเฉพาะ **อุปกรณ์** เท่านั้น (paired nodes ผ่าน `node.list`) ไม่ใช่รายการ client/presence
- ส่วน “Usage” จะปรากฏใต้ Context เมื่อมี provider usage snapshots พร้อมใช้งาน

## โมเดลสถานะ

- Sessions: events จะมาพร้อม `runId` (ต่อการรัน) และ `sessionKey` ใน payload โดย session “main” คือคีย์ `main`; หากไม่มี เราจะ fallback ไปยัง session ที่ถูกอัปเดตล่าสุด
- ลำดับความสำคัญ: main ชนะเสมอ หาก main กำลังทำงาน สถานะของมันจะถูกแสดงทันที หาก main ว่างอยู่ เราจะแสดงสถานะของ non-main session ที่เพิ่งทำงานล่าสุด เราจะไม่สลับไปมาระหว่างกิจกรรมกลางคัน; เราจะสลับเฉพาะเมื่อ session ปัจจุบันเข้าสู่ idle หรือเมื่อ main กลับมาทำงาน
- ประเภทของกิจกรรม:
  - `job`: การรันคำสั่งระดับสูง (`state: started|streaming|done|error`)
  - `tool`: `phase: start|result` พร้อม `toolName` และ `meta/args`

## enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (debug override)

### `ActivityKind` → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- ค่าเริ่มต้น → 🛠️

### การแมปด้านภาพ

- `idle`: critter แบบปกติ
- `workingMain`: มี badge พร้อม glyph, tint เต็ม และแอนิเมชันขาแบบ “working”
- `workingOther`: มี badge พร้อม glyph, tint แบบ muted, ไม่มีการ scurry
- `overridden`: ใช้ glyph/tint ที่เลือกไว้โดยไม่ขึ้นกับกิจกรรมจริง

## ข้อความแถวสถานะ (เมนู)

- ขณะมีงานกำลังทำอยู่: `<Session role> · <activity label>`
  - ตัวอย่าง: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`
- เมื่อ idle: จะ fallback ไปยังสรุปสถานะสุขภาพ

## การรับ events

- แหล่งที่มา: events `agent` จาก control-channel (`ControlChannel.handleAgentEvent`)
- ฟิลด์ที่แยกวิเคราะห์:
  - `stream: "job"` พร้อม `data.state` สำหรับ start/stop
  - `stream: "tool"` พร้อม `data.phase`, `name`, และ `meta`/`args` แบบไม่บังคับ
- Labels:
  - `exec`: บรรทัดแรกของ `args.command`
  - `read`/`write`: พาธแบบย่อ
  - `edit`: พาธพร้อมชนิดการเปลี่ยนแปลงที่อนุมานจาก `meta`/จำนวน diff
  - fallback: ชื่อเครื่องมือ

## Debug override

- Settings ▸ Debug ▸ ตัวเลือก “Icon override”:
  - `System (auto)` (ค่าเริ่มต้น)
  - `Working: main` (แยกตามชนิดของ tool)
  - `Working: other` (แยกตามชนิดของ tool)
  - `Idle`
- เก็บผ่าน `@AppStorage("iconOverride")`; แมปไปยัง `IconState.overridden`

## เช็กลิสต์การทดสอบ

- กระตุ้นงานใน main session: ตรวจสอบว่าไอคอนสลับทันทีและแถวสถานะแสดงป้าย main
- กระตุ้นงานใน non-main session ขณะ main idle: ไอคอน/สถานะแสดง non-main; และคงอยู่แบบเสถียรจนงานนั้นเสร็จ
- เริ่ม main ขณะ other กำลังทำงาน: ไอคอนต้องสลับเป็น main ทันที
- tool bursts ที่เกิดถี่ๆ: ตรวจสอบว่า badge ไม่กะพริบ (มี TTL grace บนผลลัพธ์ของ tool)
- แถวสถานะสุขภาพต้องกลับมาเมื่อทุก sessions idle
