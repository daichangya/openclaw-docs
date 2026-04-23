---
read_when:
    - คุณกำลังเชื่อมต่อทรานสปอร์ต QA แบบสังเคราะห์เข้ากับการรันทดสอบแบบโลคัลหรือ CI
    - คุณต้องใช้พื้นผิวการกำหนดค่าของ qa-channel ที่มากับระบบ
    - คุณกำลังทำซ้ำกับระบบอัตโนมัติ QA แบบ end-to-end
summary: Plugin ช่องทางแบบ Slack สังเคราะห์สำหรับสถานการณ์ QA ของ OpenClaw ที่กำหนดผลลัพธ์ได้แน่นอน
title: ช่องทาง QA
x-i18n:
    generated_at: "2026-04-23T05:27:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65c2c908d3ec27c827087616c4ea278f10686810091058321ff26f68296a1782
    source_path: channels/qa-channel.md
    workflow: 15
---

# ช่องทาง QA

`qa-channel` คือทรานสปอร์ตข้อความแบบสังเคราะห์ที่มากับระบบสำหรับ QA อัตโนมัติของ OpenClaw

นี่ไม่ใช่ช่องทางสำหรับใช้งานจริง แต่มีไว้เพื่อทดสอบขอบเขต Plugin ของช่องทางเดียวกับที่ทรานสปอร์ตจริงใช้ โดยยังคงทำให้สถานะกำหนดผลลัพธ์ได้แน่นอนและตรวจสอบได้ทั้งหมด

## สิ่งที่ทำได้ในปัจจุบัน

- ไวยากรณ์เป้าหมายระดับ Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- บัสสังเคราะห์ที่ทำงานผ่าน HTTP สำหรับ:
  - การฉีดข้อความขาเข้า
  - การเก็บบันทึกทรานสคริปต์ขาออก
  - การสร้างเธรด
  - รีแอ็กชัน
  - การแก้ไข
  - การลบ
  - การค้นหาและการอ่าน
- ตัวรัน self-check ฝั่งโฮสต์ที่มากับระบบซึ่งเขียนรายงานเป็น Markdown

## การกำหนดค่า

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

คีย์บัญชีที่รองรับ:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## ตัวรัน

vertical slice ปัจจุบัน:

```bash
pnpm qa:e2e
```

ตอนนี้คำสั่งนี้กำหนดเส้นทางผ่านส่วนขยาย `qa-lab` ที่มากับระบบ โดยจะเริ่ม QA bus ภายใน repo
บูต runtime slice ของ `qa-channel` ที่มากับระบบ รัน self-check แบบกำหนดผลลัพธ์ได้แน่นอน
และเขียนรายงาน Markdown ไว้ใต้ `.artifacts/qa-e2e/`

UI ดีบักเกอร์แบบ private:

```bash
pnpm qa:lab:up
```

คำสั่งเดียวนี้จะ build ไซต์ QA เริ่มสแตก gateway + QA Lab ที่ทำงานผ่าน Docker
และพิมพ์ URL ของ QA Lab จากไซต์นั้น คุณสามารถเลือกสถานการณ์ เลือก lane ของโมเดล
เปิดรันแต่ละรายการ และดูผลลัพธ์แบบสดได้

ชุด QA แบบเต็มที่อิงตาม repo:

```bash
pnpm openclaw qa suite
```

คำสั่งนี้จะเปิดดีบักเกอร์ QA แบบ private ที่ URL ในเครื่อง แยกจาก
Control UI bundle ที่จัดส่งจริง

## ขอบเขต

ขอบเขตปัจจุบันตั้งใจให้แคบ:

- bus + transport ของ Plugin
- ไวยากรณ์การกำหนดเส้นทางแบบเธรด
- การดำเนินการข้อความที่เป็นของช่องทาง
- การรายงานแบบ Markdown
- ไซต์ QA ที่ทำงานผ่าน Docker พร้อมตัวควบคุมการรัน

งานต่อเนื่องจะเพิ่ม:

- การรันแบบ matrix ของ provider/โมเดล
- การค้นหาสถานการณ์ที่สมบูรณ์ยิ่งขึ้น
- การ orchestration แบบ native ของ OpenClaw ในภายหลัง
