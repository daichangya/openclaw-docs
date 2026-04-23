---
read_when:
    - การเปลี่ยนเอาต์พุตหรือรูปแบบของการบันทึก
    - การดีบักเอาต์พุตของ CLI หรือ Gateway
summary: พื้นผิวการบันทึก, ไฟล์บันทึก, รูปแบบบันทึก WS และการจัดรูปแบบคอนโซล
title: การบันทึกของ Gateway
x-i18n:
    generated_at: "2026-04-23T05:33:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# การบันทึก

สำหรับภาพรวมที่เน้นผู้ใช้ (CLI + Control UI + config) ดูที่ [/logging](/th/logging)

OpenClaw มี “พื้นผิว” ของการบันทึกอยู่สองแบบ:

- **เอาต์พุตคอนโซล** (สิ่งที่คุณเห็นใน terminal / Debug UI)
- **ไฟล์บันทึก** (JSON lines) ที่เขียนโดยตัวบันทึกของ gateway

## ตัวบันทึกแบบอิงไฟล์

- ไฟล์บันทึกแบบหมุนเวียนตามค่าเริ่มต้นอยู่ภายใต้ `/tmp/openclaw/` (หนึ่งไฟล์ต่อวัน): `openclaw-YYYY-MM-DD.log`
  - วันที่ใช้เขตเวลาท้องถิ่นของโฮสต์ gateway
- สามารถกำหนดค่าพาธและระดับของไฟล์บันทึกได้ผ่าน `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

รูปแบบไฟล์คือหนึ่ง JSON object ต่อหนึ่งบรรทัด

แท็บ Logs ของ Control UI จะ tail ไฟล์นี้ผ่าน gateway (`logs.tail`)
CLI ก็ทำแบบเดียวกันได้:

```bash
openclaw logs --follow
```

**Verbose เทียบกับระดับ log**

- **ไฟล์บันทึก** ถูกควบคุมโดย `logging.level` เท่านั้น
- `--verbose` มีผลเฉพาะกับ **ความละเอียดของคอนโซล** (และรูปแบบ log ของ WS); มัน **ไม่**
  เพิ่มระดับของไฟล์บันทึก
- หากต้องการเก็บรายละเอียดระดับ verbose ลงในไฟล์บันทึก ให้ตั้ง `logging.level` เป็น `debug` หรือ
  `trace`

## การจับเอาต์พุตคอนโซล

CLI จะจับ `console.log/info/warn/error/debug/trace` และเขียนลงไฟล์บันทึก
พร้อมกับยังคงพิมพ์ไปที่ stdout/stderr

คุณสามารถปรับความละเอียดของคอนโซลแยกต่างหากได้ผ่าน:

- `logging.consoleLevel` (ค่าเริ่มต้น `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## การปกปิดข้อมูลในสรุปเครื่องมือ

สรุปเครื่องมือแบบ verbose (เช่น `🛠️ Exec: ...`) สามารถปกปิดโทเค็นที่ละเอียดอ่อนก่อนที่จะเข้าสู่
สตรีมคอนโซลได้ สิ่งนี้เป็น **เฉพาะเครื่องมือเท่านั้น** และไม่เปลี่ยนไฟล์บันทึก

- `logging.redactSensitive`: `off` | `tools` (ค่าเริ่มต้น: `tools`)
- `logging.redactPatterns`: อาร์เรย์ของสตริง regex (override ค่าเริ่มต้น)
  - ใช้สตริง regex แบบดิบ (ใส่ `gi` อัตโนมัติ) หรือ `/pattern/flags` หากคุณต้องการ flags แบบกำหนดเอง
  - ค่าที่ตรงกันจะถูกปกปิดโดยคงไว้ 6 อักขระแรก + 4 อักขระท้าย (เมื่อความยาว >= 18), นอกนั้นเป็น `***`
  - ค่าเริ่มต้นครอบคลุม key assignments ทั่วไป, CLI flags, ฟิลด์ JSON, bearer headers, PEM blocks และ token prefixes ยอดนิยม

## การบันทึก WebSocket ของ Gateway

gateway จะพิมพ์บันทึกของโปรโตคอล WebSocket ในสองโหมด:

- **โหมดปกติ (ไม่มี `--verbose`)**: จะพิมพ์เฉพาะผลลัพธ์ RPC ที่ “น่าสนใจ”:
  - ข้อผิดพลาด (`ok=false`)
  - การเรียกที่ช้า (ค่า threshold เริ่มต้น: `>= 50ms`)
  - ข้อผิดพลาดในการ parse
- **โหมด verbose (`--verbose`)**: พิมพ์ทราฟฟิก WS request/response ทั้งหมด

### รูปแบบ log ของ WS

`openclaw gateway` รองรับตัวสลับรูปแบบต่อ gateway:

- `--ws-log auto` (ค่าเริ่มต้น): โหมดปกติถูกปรับให้เหมาะสม; โหมด verbose ใช้เอาต์พุตแบบ compact
- `--ws-log compact`: เอาต์พุตแบบ compact (จับคู่ request/response) เมื่ออยู่ในโหมด verbose
- `--ws-log full`: เอาต์พุตเต็มแบบต่อเฟรมเมื่ออยู่ในโหมด verbose
- `--compact`: alias ของ `--ws-log compact`

ตัวอย่าง:

```bash
# ปรับให้เหมาะสม (แสดงเฉพาะข้อผิดพลาด/ช้า)
openclaw gateway

# แสดงทราฟฟิก WS ทั้งหมด (จับคู่)
openclaw gateway --verbose --ws-log compact

# แสดงทราฟฟิก WS ทั้งหมด (meta เต็ม)
openclaw gateway --verbose --ws-log full
```

## การจัดรูปแบบคอนโซล (การบันทึกของ subsystem)

ตัวจัดรูปแบบคอนโซล **รับรู้ TTY** และพิมพ์บรรทัดที่สม่ำเสมอพร้อมคำนำหน้า
ตัวบันทึกของ subsystem จะคงเอาต์พุตให้จัดกลุ่มและสแกนได้ง่าย

พฤติกรรม:

- **คำนำหน้า subsystem** ในทุกบรรทัด (เช่น `[gateway]`, `[canvas]`, `[tailscale]`)
- **สีของ subsystem** (คงที่ต่อ subsystem) ร่วมกับการไล่สีตามระดับ
- **แสดงสีเมื่อเอาต์พุตเป็น TTY หรือสภาพแวดล้อมดูเหมือน terminal ที่สมบูรณ์** (`TERM`/`COLORTERM`/`TERM_PROGRAM`) และเคารพ `NO_COLOR`
- **คำนำหน้า subsystem แบบย่อ**: ตัด `gateway/` + `channels/` ด้านหน้าออก และคงไว้ 2 ส่วนท้ายสุด (เช่น `whatsapp/outbound`)
- **sub-loggers แยกตาม subsystem** (คำนำหน้าอัตโนมัติ + structured field `{ subsystem }`)
- **`logRaw()`** สำหรับเอาต์พุต QR/UX (ไม่มีคำนำหน้า ไม่มีการจัดรูปแบบ)
- **รูปแบบคอนโซล** (เช่น `pretty | compact | json`)
- **ระดับ log ของคอนโซล** แยกจากระดับ log ของไฟล์ (ไฟล์ยังคงเก็บรายละเอียดครบเมื่อ `logging.level` ตั้งเป็น `debug`/`trace`)
- **เนื้อหาข้อความ WhatsApp** จะถูกบันทึกที่ระดับ `debug` (ใช้ `--verbose` เพื่อดู)

สิ่งนี้ช่วยให้ไฟล์บันทึกเดิมยังคงเสถียร ขณะเดียวกันก็ทำให้เอาต์พุตแบบโต้ตอบสแกนอ่านได้ง่าย
