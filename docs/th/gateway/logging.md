---
read_when:
    - การเปลี่ยนเอาต์พุตหรือรูปแบบของ logging
    - การดีบักเอาต์พุตของ CLI หรือ gateway
summary: พื้นผิวการ logging, ไฟล์ log, รูปแบบ log ของ WS และการจัดรูปแบบคอนโซล
title: การ logging ของ Gateway
x-i18n:
    generated_at: "2026-04-24T09:11:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

สำหรับภาพรวมที่เน้นผู้ใช้ (CLI + Control UI + config) ดู [/logging](/th/logging)

OpenClaw มี “พื้นผิว” ของ log สองแบบ:

- **เอาต์พุตคอนโซล** (สิ่งที่คุณเห็นในเทอร์มินัล / Debug UI)
- **ไฟล์ log** (JSON lines) ที่เขียนโดย logger ของ gateway

## logger แบบอิงไฟล์

- ไฟล์ log แบบหมุนเวียนตามค่าเริ่มต้นอยู่ใต้ `/tmp/openclaw/` (หนึ่งไฟล์ต่อวัน): `openclaw-YYYY-MM-DD.log`
  - วันที่ใช้เขตเวลา local ของโฮสต์ gateway
- สามารถกำหนดค่าพาธไฟล์ log และระดับได้ผ่าน `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

รูปแบบไฟล์คือหนึ่งออบเจ็กต์ JSON ต่อหนึ่งบรรทัด

แท็บ Logs ใน Control UI จะ tail ไฟล์นี้ผ่าน gateway (`logs.tail`)
CLI ก็ทำแบบเดียวกันได้:

```bash
openclaw logs --follow
```

**Verbose เทียบกับระดับ log**

- **ไฟล์ log** ถูกควบคุมโดย `logging.level` เท่านั้น
- `--verbose` มีผลเฉพาะกับ **ความละเอียดของคอนโซล** (และรูปแบบ log ของ WS); มัน **ไม่ได้**
  เพิ่มระดับ log ของไฟล์
- หากต้องการเก็บรายละเอียดระดับ verbose ลงในไฟล์ log ให้ตั้งค่า `logging.level` เป็น `debug` หรือ
  `trace`

## การจับข้อความคอนโซล

CLI จะจับ `console.log/info/warn/error/debug/trace` และเขียนลงไฟล์ log
ขณะที่ยังคงพิมพ์ไปที่ stdout/stderr

คุณสามารถปรับความละเอียดของคอนโซลแยกต่างหากได้ผ่าน:

- `logging.consoleLevel` (ค่าเริ่มต้น `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## การปกปิดข้อมูลในสรุปของเครื่องมือ

สรุปเครื่องมือแบบ verbose (เช่น `🛠️ Exec: ...`) สามารถปกปิดโทเค็นที่ละเอียดอ่อนได้ก่อนจะไปถึง
สตรีมคอนโซล การทำงานนี้เป็นแบบ **เฉพาะเครื่องมือ** และไม่เปลี่ยนแปลงไฟล์ log

- `logging.redactSensitive`: `off` | `tools` (ค่าเริ่มต้น: `tools`)
- `logging.redactPatterns`: อาร์เรย์ของสตริง regex (override ค่าเริ่มต้น)
  - ใช้สตริง regex แบบดิบ (`gi` อัตโนมัติ) หรือ `/pattern/flags` หากคุณต้องการ flags แบบกำหนดเอง
  - ข้อความที่ตรงกันจะถูกปกปิดโดยเก็บ 6 ตัวแรก + 4 ตัวท้าย (ถ้าความยาว >= 18) มิฉะนั้นใช้ `***`
  - ค่าเริ่มต้นครอบคลุมการกำหนดค่าคีย์ทั่วไป, CLI flags, ฟิลด์ JSON, bearer headers, PEM blocks และ prefix ของโทเค็นยอดนิยม

## log WebSocket ของ Gateway

gateway พิมพ์ log ของโปรโตคอล WebSocket ได้สองโหมด:

- **โหมดปกติ (ไม่มี `--verbose`)**: จะพิมพ์เฉพาะผลลัพธ์ RPC ที่ “น่าสนใจ”:
  - ข้อผิดพลาด (`ok=false`)
  - คำขอที่ช้า (ค่า threshold เริ่มต้น: `>= 50ms`)
  - parse errors
- **โหมด verbose (`--verbose`)**: พิมพ์ทราฟฟิก WS request/response ทั้งหมด

### รูปแบบ log ของ WS

`openclaw gateway` รองรับการสลับรูปแบบต่อ gateway:

- `--ws-log auto` (ค่าเริ่มต้น): โหมดปกติถูกปรับให้เหมาะสม; โหมด verbose ใช้เอาต์พุตแบบ compact
- `--ws-log compact`: เอาต์พุตแบบ compact (จับคู่ request/response) เมื่ออยู่ในโหมด verbose
- `--ws-log full`: เอาต์พุตแบบเต็มต่อเฟรมเมื่ออยู่ในโหมด verbose
- `--compact`: ชื่อเรียกแทนของ `--ws-log compact`

ตัวอย่าง:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## การจัดรูปแบบคอนโซล (logging ของระบบย่อย)

ตัวจัดรูปแบบคอนโซล **รับรู้ TTY** และพิมพ์บรรทัดที่มีคำนำหน้าอย่างสม่ำเสมอ
logger ของระบบย่อยช่วยให้เอาต์พุตถูกจัดกลุ่มและสแกนได้ง่าย

พฤติกรรม:

- **คำนำหน้าของระบบย่อย** ในทุกบรรทัด (เช่น `[gateway]`, `[canvas]`, `[tailscale]`)
- **สีของระบบย่อย** (คงที่ตามระบบย่อย) พร้อมสีของระดับ
- **ใช้สีเมื่อเอาต์พุตเป็น TTY หรือสภาพแวดล้อมดูเหมือนเทอร์มินัลที่รองรับสี** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), และเคารพ `NO_COLOR`
- **คำนำหน้าระบบย่อยแบบย่อ**: ตัด `gateway/` + `channels/` นำหน้าออก และเก็บ 2 ส่วนท้ายไว้ (เช่น `whatsapp/outbound`)
- **sub-logger แยกตามระบบย่อย** (คำนำหน้าอัตโนมัติ + ฟิลด์แบบมีโครงสร้าง `{ subsystem }`)
- **`logRaw()`** สำหรับเอาต์พุต QR/UX (ไม่มีคำนำหน้า ไม่มีการจัดรูปแบบ)
- **รูปแบบคอนโซล** (เช่น `pretty | compact | json`)
- **ระดับ log ของคอนโซล** แยกจากระดับ log ของไฟล์ (ไฟล์ยังคงเก็บรายละเอียดเต็มเมื่อ `logging.level` ถูกตั้งเป็น `debug`/`trace`)
- **เนื้อหาข้อความของ WhatsApp** จะถูกบันทึกที่ระดับ `debug` (ใช้ `--verbose` เพื่อดู)

สิ่งนี้ช่วยให้ไฟล์ log ที่มีอยู่ยังคงเสถียร ขณะเดียวกันก็ทำให้เอาต์พุตแบบโต้ตอบสแกนได้ง่าย

## ที่เกี่ยวข้อง

- [ภาพรวม Logging](/th/logging)
- [การ export diagnostics](/th/gateway/diagnostics)
