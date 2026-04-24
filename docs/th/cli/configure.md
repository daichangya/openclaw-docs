---
read_when:
    - คุณต้องการปรับข้อมูลรับรอง อุปกรณ์ หรือค่าเริ่มต้นของเอเจนต์แบบโต้ตอบ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw configure` (พรอมป์การกำหนดค่าแบบโต้ตอบ)
title: กำหนดค่า
x-i18n:
    generated_at: "2026-04-24T09:02:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

พรอมป์แบบโต้ตอบสำหรับตั้งค่าข้อมูลรับรอง อุปกรณ์ และค่าเริ่มต้นของเอเจนต์

หมายเหตุ: ตอนนี้ส่วน **Model** มีการเลือกได้หลายรายการสำหรับ allowlist ของ
`agents.defaults.models` (สิ่งที่จะแสดงใน `/model` และตัวเลือกโมเดล)
ตัวเลือกการตั้งค่าแบบกำหนดขอบเขตตาม provider จะรวมโมเดลที่เลือกเข้าไปใน
allowlist ที่มีอยู่ แทนที่จะไปแทนที่ provider อื่นที่มีอยู่แล้วในคอนฟิกและไม่เกี่ยวข้อง

เมื่อเริ่ม configure จากตัวเลือกการยืนยันตัวตนของ provider ตัวเลือกโมเดลเริ่มต้นและ
allowlist จะให้ความสำคัญกับ provider นั้นโดยอัตโนมัติ สำหรับ provider ที่จับคู่กัน
เช่น Volcengine/BytePlus การตั้งค่าแบบเดียวกันนี้ยังจับคู่กับตัวแปร coding-plan
ของพวกมันด้วย (`volcengine-plan/*`, `byteplus-plan/*`) หากตัวกรอง preferred-provider
จะทำให้ได้รายการว่าง configure จะ fallback ไปใช้แค็ตตาล็อกที่ไม่กรอง
แทนการแสดงตัวเลือกที่ว่างเปล่า

เคล็ดลับ: `openclaw config` โดยไม่ระบุ subcommand จะเปิดวิซาร์ดเดียวกัน ใช้
`openclaw config get|set|unset` สำหรับการแก้ไขแบบไม่โต้ตอบ

สำหรับการค้นหาเว็บ `openclaw configure --section web` ให้คุณเลือก provider
และกำหนดค่าข้อมูลรับรองได้ บาง provider ยังแสดงพรอมป์ต่อเนื่องเฉพาะของ provider ด้วย:

- **Grok** อาจเสนอการตั้งค่า `x_search` แบบไม่บังคับโดยใช้ `XAI_API_KEY` เดียวกัน และ
  ให้คุณเลือกโมเดล `x_search`
- **Kimi** อาจถาม region ของ Moonshot API (`api.moonshot.ai` เทียบกับ
  `api.moonshot.cn`) และโมเดลค้นหาเว็บ Kimi ค่าปริยาย

ที่เกี่ยวข้อง:

- เอกสารอ้างอิงคอนฟิก Gateway: [Configuration](/th/gateway/configuration)
- CLI ของ config: [Config](/th/cli/config)

## ตัวเลือก

- `--section <section>`: ตัวกรอง section ที่ระบุซ้ำได้

section ที่ใช้ได้:

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

- การเลือกตำแหน่งที่ Gateway ทำงานจะอัปเดต `gateway.mode` เสมอ คุณสามารถเลือก "Continue" โดยไม่เลือก section อื่นได้ หากนั่นคือทั้งหมดที่คุณต้องการ
- บริการที่เน้นช่องทาง (Slack/Discord/Matrix/Microsoft Teams) จะมีพรอมป์สำหรับ allowlist ของ channel/room ระหว่างการตั้งค่า คุณสามารถป้อนชื่อหรือ ID ก็ได้ และวิซาร์ดจะ resolve ชื่อเป็น ID ให้เมื่อทำได้
- หากคุณรันขั้นตอนติดตั้ง daemon, การยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` ถูกจัดการแบบ SecretRef, configure จะตรวจสอบ SecretRef แต่จะไม่เก็บค่า token แบบ plaintext ที่ resolve แล้วลงในเมทาดาทาสภาพแวดล้อมของบริการ supervisor
- หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ configure จะบล็อกการติดตั้ง daemon พร้อมคำแนะนำการแก้ไขที่ทำได้จริง
- หากมีการกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ยังไม่ได้ตั้ง `gateway.auth.mode` configure จะบล็อกการติดตั้ง daemon จนกว่าจะมีการตั้งค่า mode อย่างชัดเจน

## ตัวอย่าง

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Configuration](/th/gateway/configuration)
