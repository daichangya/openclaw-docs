---
read_when:
    - การเตรียมรายงานบั๊กหรือคำขอรับการสนับสนุน
    - การดีบัก Gateway ล่ม, รีสตาร์ต, หน่วยความจำตึงตัว หรือ payload ขนาดใหญ่เกินไป
    - การตรวจสอบว่าข้อมูลวินิจฉัยใดถูกบันทึกหรือถูกปกปิด მონაცემો
summary: สร้างชุดข้อมูลวินิจฉัย Gateway ที่แชร์ได้สำหรับรายงานบั๊ก
title: การส่งออกข้อมูลวินิจฉัย
x-i18n:
    generated_at: "2026-04-24T09:09:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw สามารถสร้างไฟล์ zip ข้อมูลวินิจฉัยแบบโลคัลที่ปลอดภัยพอสำหรับแนบไปกับรายงานบั๊กได้
โดยรวมสถานะ Gateway ที่ผ่านการทำให้ปลอดภัยแล้ว, health, logs, รูปทรงของ config และ
เหตุการณ์ด้านเสถียรภาพล่าสุดที่ไม่มี payload

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw gateway diagnostics export
```

คำสั่งนี้จะพิมพ์ path ของไฟล์ zip ที่เขียนออกมา หากต้องการเลือก path เอง:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

สำหรับงานอัตโนมัติ:

```bash
openclaw gateway diagnostics export --json
```

## สิ่งที่มีอยู่ในการส่งออก

ไฟล์ zip จะรวม:

- `summary.md`: ภาพรวมแบบที่มนุษย์อ่านได้สำหรับทีมสนับสนุน
- `diagnostics.json`: สรุปแบบที่เครื่องอ่านได้ของ config, logs, status, health
  และข้อมูลด้านเสถียรภาพ
- `manifest.json`: metadata ของการส่งออกและรายการไฟล์
- รูปทรง config ที่ผ่านการทำให้ปลอดภัยแล้วและรายละเอียด config ที่ไม่เป็นความลับ
- สรุป logs ที่ผ่านการทำให้ปลอดภัยแล้วและบรรทัด log ล่าสุดที่ถูกปกปิดข้อมูลแล้ว
- snapshots ของสถานะและ health ของ Gateway แบบ best-effort
- `stability/latest.json`: stability bundle ที่บันทึกล่าสุด เมื่อมี

การส่งออกนี้ยังมีประโยชน์แม้ Gateway จะไม่ปกติ หาก Gateway
ไม่สามารถตอบคำขอ status หรือ health ได้ ระบบก็ยังจะเก็บ logs, รูปทรง config
และ stability bundle ล่าสุดแบบโลคัลเมื่อมีอยู่

## โมเดลความเป็นส่วนตัว

ข้อมูลวินิจฉัยถูกออกแบบมาให้แชร์ได้ การส่งออกจะเก็บข้อมูลการปฏิบัติการ
ที่ช่วยในการดีบัก เช่น:

- ชื่อ subsystem, plugin ids, provider ids, channel ids และโหมดที่กำหนดค่าไว้
- status codes, durations, จำนวนไบต์, สถานะคิว และค่าการใช้หน่วยความจำ
- metadata ของ logs ที่ผ่านการทำให้ปลอดภัยแล้วและข้อความการปฏิบัติการที่ถูกปกปิดข้อมูล
- รูปทรง config และการตั้งค่าฟีเจอร์ที่ไม่เป็นความลับ

การส่งออกจะละเว้นหรือปกปิด:

- ข้อความแชต, prompts, instructions, เนื้อหา webhook และผลลัพธ์ของเครื่องมือ
- credentials, API keys, tokens, cookies และค่าลับต่าง ๆ
- request หรือ response bodies แบบดิบ
- account ids, message ids, raw session ids, hostnames และชื่อผู้ใช้ในเครื่อง

เมื่อข้อความ log ดูเหมือนเป็นข้อความผู้ใช้, แชต, prompt หรือข้อความ payload ของเครื่องมือ
การส่งออกจะเก็บไว้เพียงว่ามีข้อความหนึ่งรายการถูกละเว้นและจำนวนไบต์ของมัน

## Stability recorder

Gateway จะบันทึกสตรีมด้านเสถียรภาพแบบมีขอบเขตและไม่มี payload ตามค่าเริ่มต้นเมื่อ
เปิดใช้ข้อมูลวินิจฉัย ระบบนี้มีไว้สำหรับข้อเท็จจริงด้านการปฏิบัติการ ไม่ใช่เนื้อหา

ตรวจสอบตัวบันทึกที่กำลังทำงานอยู่:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

ตรวจสอบ stability bundle ที่ถูกบันทึกล่าสุดหลังการออกแบบ fatal, shutdown
timeout หรือการเริ่มต้นใหม่แล้วล้มเหลว:

```bash
openclaw gateway stability --bundle latest
```

สร้างไฟล์ zip ข้อมูลวินิจฉัยจาก bundle ที่ถูกบันทึกล่าสุด:

```bash
openclaw gateway stability --bundle latest --export
```

bundles ที่ถูกบันทึกจะอยู่ภายใต้ `~/.openclaw/logs/stability/` เมื่อมีเหตุการณ์อยู่

## ตัวเลือกที่มีประโยชน์

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: เขียนไปยัง path ของ zip ที่ระบุ
- `--log-lines <count>`: จำนวนบรรทัด log ที่ผ่านการทำให้ปลอดภัยสูงสุดที่จะรวมไว้
- `--log-bytes <bytes>`: จำนวนไบต์ของ log สูงสุดที่จะตรวจสอบ
- `--url <url>`: URL WebSocket ของ Gateway สำหรับ snapshots ของ status และ health
- `--token <token>`: token ของ Gateway สำหรับ snapshots ของ status และ health
- `--password <password>`: รหัสผ่านของ Gateway สำหรับ snapshots ของ status และ health
- `--timeout <ms>`: timeout ของ snapshots สำหรับ status และ health
- `--no-stability-bundle`: ข้ามการค้นหา stability bundle ที่ถูกบันทึกไว้
- `--json`: พิมพ์ metadata ของการส่งออกแบบที่เครื่องอ่านได้

## ปิดใช้งานข้อมูลวินิจฉัย

ข้อมูลวินิจฉัยเปิดใช้งานตามค่าเริ่มต้น หากต้องการปิด stability recorder และ
การเก็บเหตุการณ์ด้านการวินิจฉัย:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

การปิดข้อมูลวินิจฉัยจะลดรายละเอียดของรายงานบั๊ก แต่จะไม่กระทบกับ
การบันทึก log ปกติของ Gateway

## เอกสารที่เกี่ยวข้อง

- [Health Checks](/th/gateway/health)
- [Gateway CLI](/th/cli/gateway#gateway-diagnostics-export)
- [Gateway Protocol](/th/gateway/protocol#system-and-identity)
- [Logging](/th/logging)
