---
read_when:
    - คุณต้องการปรับข้อมูลรับรอง อุปกรณ์ หรือค่าเริ่มต้นของเอเจนต์แบบโต้ตอบ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw configure` (พร้อมท์การกำหนดค่าแบบโต้ตอบ)
title: กำหนดค่า
x-i18n:
    generated_at: "2026-04-23T06:17:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

พร้อมท์แบบโต้ตอบสำหรับตั้งค่าข้อมูลรับรอง อุปกรณ์ และค่าเริ่มต้นของเอเจนต์

หมายเหตุ: ส่วน **Model** ตอนนี้มีการเลือกได้หลายรายการสำหรับ allowlist ของ
`agents.defaults.models` (สิ่งที่จะแสดงใน `/model` และตัวเลือกโมเดล)
ตัวเลือกการตั้งค่าระดับ provider จะรวมโมเดลที่เลือกเข้าไปใน
allowlist ที่มีอยู่แทนที่จะไปแทนที่ provider อื่นที่ไม่เกี่ยวข้องซึ่งมีอยู่แล้วใน config

เมื่อเริ่ม configure จากตัวเลือกการยืนยันตัวตนของ provider ตัวเลือกโมเดลเริ่มต้นและ
allowlist จะให้ความสำคัญกับ provider นั้นโดยอัตโนมัติ สำหรับ provider แบบจับคู่
เช่น Volcengine/BytePlus การให้ความสำคัญแบบเดียวกันนี้จะตรงกับ
รูปแบบ coding-plan ของพวกเขาด้วย (`volcengine-plan/*`, `byteplus-plan/*`) หากตัวกรอง
preferred-provider ทำให้รายการว่าง configure จะ fallback ไปใช้แค็ตตาล็อก
ที่ไม่กรองแทนที่จะแสดงตัวเลือกว่างเปล่า

เคล็ดลับ: `openclaw config` โดยไม่มีคำสั่งย่อยจะเปิดวิซาร์ดเดียวกัน ใช้
`openclaw config get|set|unset` สำหรับการแก้ไขแบบไม่โต้ตอบ

สำหรับการค้นหาบนเว็บ `openclaw configure --section web` ให้คุณเลือก provider
และกำหนดค่าข้อมูลรับรองของมันได้ บาง provider ยังแสดงพร้อมท์ติดตามผล
เฉพาะของ provider ด้วย:

- **Grok** สามารถเสนอการตั้งค่า `x_search` แบบเลือกได้โดยใช้ `XAI_API_KEY` เดียวกัน และ
  ให้คุณเลือกโมเดล `x_search`
- **Kimi** อาจถามหารีเจียน API ของ Moonshot (`api.moonshot.ai` เทียบกับ
  `api.moonshot.cn`) และโมเดลค้นหาเว็บ Kimi เริ่มต้น

ที่เกี่ยวข้อง:

- ข้อมูลอ้างอิงการกำหนดค่า Gateway: [Configuration](/th/gateway/configuration)
- Config CLI: [Config](/th/cli/config)

## ตัวเลือก

- `--section <section>`: ตัวกรอง section ที่ระบุซ้ำได้

sections ที่มีให้ใช้:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

หมายเหตุ:

- การเลือกว่าจะให้ Gateway รันที่ไหนจะอัปเดต `gateway.mode` เสมอ คุณสามารถเลือก "Continue" โดยไม่ต้องเลือกส่วนอื่นได้ หากคุณต้องการเพียงเท่านั้น
- บริการที่เน้นช่องทาง (Slack/Discord/Matrix/Microsoft Teams) จะมีพร้อมท์สำหรับ allowlist ของ channel/room ระหว่างการตั้งค่า คุณสามารถป้อนชื่อหรือ ID ได้; วิซาร์ดจะ resolve ชื่อเป็น ID เมื่อทำได้
- หากคุณรันขั้นตอนติดตั้ง daemon การยืนยันตัวตนด้วย token จำเป็นต้องมี token และเมื่อ `gateway.auth.token` ถูกจัดการด้วย SecretRef configure จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่า token plaintext ที่ resolve แล้วลงใน metadata environment ของบริการ supervisor
- หากการยืนยันตัวตนด้วย token ต้องใช้ token และ token SecretRef ที่ตั้งค่าไว้ยัง resolve ไม่ได้ configure จะบล็อกการติดตั้ง daemon พร้อมคำแนะนำการแก้ไขที่นำไปใช้ได้
- หากมีการตั้งค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และ `gateway.auth.mode` ยังไม่ได้ตั้งค่า configure จะบล็อกการติดตั้ง daemon จนกว่าจะตั้งค่าโหมดอย่างชัดเจน

## ตัวอย่าง

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
