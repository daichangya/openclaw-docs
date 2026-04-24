---
read_when:
    - การปรับ UI ของเมนูบน mac หรือการเปลี่ยนตรรกะสถานะ
summary: ตรรกะสถานะของ menu bar และสิ่งที่แสดงให้ผู้ใช้เห็น
title: Menu bar
x-i18n:
    generated_at: "2026-04-24T09:21:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# ตรรกะสถานะของ Menu Bar

## สิ่งที่แสดง

- เราแสดงสถานะงานปัจจุบันของเอเจนต์ในไอคอน menu bar และในแถวสถานะแรกของเมนู
- สถานะสุขภาพจะถูกซ่อนไว้ขณะมีงาน active; และจะกลับมาเมื่อทุกเซสชัน idle
- บล็อก “Nodes” ในเมนูจะแสดงเฉพาะ **อุปกรณ์** เท่านั้น (paired nodes ผ่าน `node.list`) ไม่ใช่รายการ client/presence
- ส่วน “Usage” จะปรากฏใต้ Context เมื่อมี provider usage snapshots ให้ใช้

## แบบจำลองสถานะ

- Sessions: เหตุการณ์จะมาพร้อม `runId` (ต่อการรัน) บวกกับ `sessionKey` ใน payload เซสชัน “main” คือคีย์ `main`; หากไม่มี เราจะ fallback ไปยังเซสชันที่อัปเดตล่าสุด
- ลำดับความสำคัญ: main ชนะเสมอ หาก main active สถานะของมันจะแสดงทันที หาก main idle จะแสดงสถานะของเซสชัน non-main ที่ active ล่าสุด เราจะไม่สลับไปมาระหว่างกิจกรรม; จะสลับก็ต่อเมื่อเซสชันปัจจุบัน idle หรือ main กลายเป็น active
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

### การแมปเชิงภาพ

- `idle`: critter ปกติ
- `workingMain`: badge พร้อม glyph, tint เต็ม, แอนิเมชันขาแบบ “working”
- `workingOther`: badge พร้อม glyph, tint แบบ muted, ไม่มีการ scurry
- `overridden`: ใช้ glyph/tint ที่เลือกไว้โดยไม่ขึ้นกับกิจกรรม

## ข้อความในแถวสถานะ (เมนู)

- ขณะมีงาน active: `<Session role> · <activity label>`
  - ตัวอย่าง: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`
- เมื่อ idle: จะ fallback ไปยังสรุปสุขภาพ

## การรับเหตุการณ์เข้า

- แหล่งที่มา: เหตุการณ์ `agent` ของ control-channel (`ControlChannel.handleAgentEvent`)
- ฟิลด์ที่ parse:
  - `stream: "job"` พร้อม `data.state` สำหรับการเริ่ม/หยุด
  - `stream: "tool"` พร้อม `data.phase`, `name`, และ `meta`/`args` แบบไม่บังคับ
- Labels:
  - `exec`: บรรทัดแรกของ `args.command`
  - `read`/`write`: path แบบย่อ
  - `edit`: path พร้อมประเภทการเปลี่ยนแปลงที่อนุมานจาก `meta`/จำนวน diff
  - fallback: ชื่อเครื่องมือ

## Debug override

- Settings ▸ Debug ▸ ตัวเลือก “Icon override”:
  - `System (auto)` (ค่าเริ่มต้น)
  - `Working: main` (แยกตามประเภทเครื่องมือ)
  - `Working: other` (แยกตามประเภทเครื่องมือ)
  - `Idle`
- เก็บผ่าน `@AppStorage("iconOverride")`; แมปไปยัง `IconState.overridden`

## เช็กลิสต์การทดสอบ

- ทริกเกอร์งานของ main session: ตรวจสอบว่าไอคอนสลับทันทีและแถวสถานะแสดงป้ายของ main
- ทริกเกอร์งานของ non-main session ขณะที่ main idle: ไอคอน/สถานะแสดง non-main; คงที่จนกว่าจะเสร็จ
- เริ่ม main ขณะที่ other active: ไอคอนสลับไปที่ main ทันที
- tool bursts แบบรวดเร็ว: ตรวจสอบว่า badge ไม่กะพริบ (มี TTL grace บนผลลัพธ์ของ tool)
- แถวสุขภาพกลับมาอีกครั้งเมื่อทุกเซสชัน idle

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [ไอคอน menu bar](/th/platforms/mac/icon)
