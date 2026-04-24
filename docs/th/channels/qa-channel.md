---
read_when:
    - คุณกำลังเชื่อมต่อทรานสปอร์ต QA แบบสังเคราะห์เข้ากับการทดสอบแบบโลคัลหรือ CI
    - คุณต้องการพื้นผิวการกำหนดค่าของ qa-channel ที่มาพร้อมระบบ
    - คุณกำลังปรับปรุงงานอัตโนมัติ QA แบบ end-to-end
summary: Plugin ช่องทางคลาส Slack แบบสังเคราะห์สำหรับสถานการณ์ QA ของ OpenClaw ที่กำหนดผลลัพธ์ได้แน่นอน
title: ช่องทาง QA
x-i18n:
    generated_at: "2026-04-24T08:59:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` คือทรานสปอร์ตข้อความแบบสังเคราะห์ที่มาพร้อมระบบสำหรับ QA อัตโนมัติของ OpenClaw

นี่ไม่ใช่ช่องทางสำหรับใช้งานจริง แต่มีไว้เพื่อทดสอบขอบเขต Plugin ช่องทางเดียวกันกับที่ทรานสปอร์ตจริงใช้ ขณะเดียวกันก็ทำให้สถานะกำหนดผลลัพธ์ได้แน่นอนและตรวจสอบได้ทั้งหมด

## สิ่งที่ทำได้ในปัจจุบัน

- ไวยากรณ์เป้าหมายแบบคลาส Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- บัสสังเคราะห์ที่ทำงานผ่าน HTTP สำหรับ:
  - การฉีดข้อความขาเข้า
  - การจับ transcript ขาออก
  - การสร้างเธรด
  - reactions
  - การแก้ไข
  - การลบ
  - การค้นหาและการกระทำแบบอ่าน
- ตัวรัน self-check ฝั่งโฮสต์ที่มาพร้อมระบบ ซึ่งเขียนรายงานเป็น Markdown

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

ตอนนี้คำสั่งนี้กำหนดเส้นทางผ่านส่วนขยาย `qa-lab` ที่มาพร้อมระบบ โดยจะเริ่ม QA bus ภายในรีโป บูต runtime slice ของ `qa-channel` ที่มาพร้อมระบบ รัน self-check แบบกำหนดผลลัพธ์ได้แน่นอน และเขียนรายงาน Markdown ไว้ใต้ `.artifacts/qa-e2e/`

UI ดีบักแบบ private:

```bash
pnpm qa:lab:up
```

คำสั่งเดียวนี้จะ build ไซต์ QA เริ่มสแตก gateway + QA Lab ที่ใช้ Docker และพิมพ์ URL ของ QA Lab จากไซต์นั้นคุณสามารถเลือกสถานการณ์ เลือก model lane เปิดรันแต่ละรายการ และดูผลลัพธ์แบบสดได้

ชุด QA แบบเต็มที่อิงกับรีโป:

```bash
pnpm openclaw qa suite
```

คำสั่งนี้จะเปิดตัวดีบัก QA แบบ private ที่ URL ในเครื่อง ซึ่งแยกจากชุด Control UI ที่จัดส่งไปกับระบบ

## ขอบเขต

ขอบเขตปัจจุบันตั้งใจให้แคบ:

- bus + ทรานสปอร์ต Plugin
- ไวยากรณ์การกำหนดเส้นทางแบบเธรด
- การกระทำกับข้อความที่เป็นของช่องทาง
- การรายงานแบบ Markdown
- ไซต์ QA ที่ใช้ Docker พร้อมตัวควบคุมการรัน

งานต่อเนื่องที่จะเพิ่มเข้ามา:

- การรันแบบเมทริกซ์ provider/model
- การค้นหาสถานการณ์ที่สมบูรณ์ยิ่งขึ้น
- orchestration แบบ OpenClaw-native ในภายหลัง

## ที่เกี่ยวข้อง

- [การจับคู่](/th/channels/pairing)
- [กลุ่ม](/th/channels/groups)
- [ภาพรวมของช่องทาง](/th/channels)
