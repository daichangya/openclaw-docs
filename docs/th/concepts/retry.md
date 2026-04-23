---
read_when:
    - กำลังอัปเดตพฤติกรรมหรือค่าเริ่มต้นของการลองใหม่สำหรับ provider
    - 'กำลังแก้ไขปัญหาข้อผิดพลาดการส่งของ provider หรือการจำกัดอัตราเปิดอภิปราย analysis to=functions.read ＿欧美json  大发快三大小单双_offset: 1, "limit": 200, "path": "AGENTS.md"} tool code  qq彩票ائج'
summary: นโยบายการลองใหม่สำหรับการเรียก provider ขาออก
title: นโยบายการลองใหม่
x-i18n:
    generated_at: "2026-04-23T05:31:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# นโยบายการลองใหม่

## เป้าหมาย

- ลองใหม่ต่อคำขอ HTTP แต่ละรายการ ไม่ใช่ต่อโฟลว์หลายขั้นตอนทั้งชุด
- รักษาลำดับด้วยการลองใหม่เฉพาะขั้นตอนปัจจุบัน
- หลีกเลี่ยงการทำซ้ำการดำเนินการที่ไม่เป็น idempotent

## ค่าเริ่มต้น

- จำนวนครั้งที่ลอง: 3
- เพดานดีเลย์สูงสุด: 30000 ms
- Jitter: 0.1 (10 เปอร์เซ็นต์)
- ค่าเริ่มต้นของ provider:
  - ดีเลย์ต่ำสุดของ Telegram: 400 ms
  - ดีเลย์ต่ำสุดของ Discord: 500 ms

## พฤติกรรม

### provider ของโมเดล

- OpenClaw ปล่อยให้ SDK ของ provider จัดการการลองใหม่ระยะสั้นตามปกติ
- สำหรับ SDK ที่อิง Stainless เช่น Anthropic และ OpenAI การตอบกลับที่ลองใหม่ได้
  (`408`, `409`, `429`, และ `5xx`) อาจมี `retry-after-ms` หรือ
  `retry-after` เมื่อเวลารอนั้นนานกว่า 60 วินาที OpenClaw จะฉีด
  `x-should-retry: false` เพื่อให้ SDK แสดงข้อผิดพลาดทันที และให้ model
  failover หมุนไปใช้ auth profile อื่นหรือโมเดล fallback
- แทนที่เพดานนี้ด้วย `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`
  ตั้งค่าเป็น `0`, `false`, `off`, `none`, หรือ `disabled` เพื่อให้ SDK
  เคารพการพักตาม `Retry-After` ที่ยาวภายในตัวเอง

### Discord

- ลองใหม่เฉพาะกับข้อผิดพลาดจากการจำกัดอัตรา (HTTP 429)
- ใช้ `retry_after` ของ Discord เมื่อมี มิฉะนั้นใช้ exponential backoff

### Telegram

- ลองใหม่เมื่อเกิดข้อผิดพลาดชั่วคราว (429, timeout, connect/reset/closed, unavailable ชั่วคราว)
- ใช้ `retry_after` เมื่อมี มิฉะนั้นใช้ exponential backoff
- ข้อผิดพลาดการ parse Markdown จะไม่ถูกลองใหม่; จะ fallback ไปเป็นข้อความธรรมดา

## การกำหนดค่า

ตั้งค่านโยบายการลองใหม่ราย provider ใน `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## หมายเหตุ

- การลองใหม่ใช้ต่อคำขอแต่ละรายการ (การส่งข้อความ การอัปโหลดสื่อ รีแอ็กชัน การ polling สติกเกอร์)
- โฟลว์แบบ composite จะไม่ลองใหม่ในขั้นตอนที่ทำเสร็จแล้ว
