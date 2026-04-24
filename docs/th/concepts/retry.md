---
read_when:
    - การอัปเดตพฤติกรรมหรือค่าเริ่มต้นของการลองใหม่สำหรับผู้ให้บริการ
    - การแก้ไขปัญหาข้อผิดพลาดการส่งของผู้ให้บริการหรือการจำกัดอัตรา
summary: นโยบายการลองใหม่สำหรับการเรียกผู้ให้บริการขาออก
title: นโยบายการลองใหม่
x-i18n:
    generated_at: "2026-04-24T09:07:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## เป้าหมาย

- ลองใหม่ต่อคำขอ HTTP แต่ละครั้ง ไม่ใช่ต่อโฟลว์หลายขั้นตอน
- รักษาลำดับโดยลองใหม่เฉพาะขั้นตอนปัจจุบัน
- หลีกเลี่ยงการทำซ้ำการดำเนินการที่ไม่เป็น idempotent

## ค่าเริ่มต้น

- จำนวนครั้ง: 3
- เพดานความหน่วงสูงสุด: 30000 ms
- Jitter: 0.1 (10 เปอร์เซ็นต์)
- ค่าเริ่มต้นตามผู้ให้บริการ:
  - ความหน่วงขั้นต่ำของ Telegram: 400 ms
  - ความหน่วงขั้นต่ำของ Discord: 500 ms

## พฤติกรรม

### ผู้ให้บริการโมเดล

- OpenClaw ปล่อยให้ SDK ของผู้ให้บริการจัดการการลองใหม่สั้น ๆ ตามปกติ
- สำหรับ SDK ที่อิง Stainless เช่น Anthropic และ OpenAI การตอบกลับที่ลองใหม่ได้
  (`408`, `409`, `429` และ `5xx`) อาจมี `retry-after-ms` หรือ
  `retry-after` เมื่อเวลารอนั้นนานกว่า 60 วินาที OpenClaw จะฉีด
  `x-should-retry: false` เพื่อให้ SDK แสดงข้อผิดพลาดทันที และ model
  failover สามารถหมุนไปใช้ auth profile อื่นหรือ fallback model ได้
- override เพดานนี้ด้วย `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`
  ตั้งเป็น `0`, `false`, `off`, `none` หรือ `disabled` เพื่อให้ SDK
  ทำตามการพัก `Retry-After` ที่ยาวภายในตัวเอง

### Discord

- ลองใหม่เฉพาะเมื่อเกิดข้อผิดพลาดจากการจำกัดอัตรา (HTTP 429)
- ใช้ `retry_after` ของ Discord เมื่อมี มิฉะนั้นจะใช้ exponential backoff

### Telegram

- ลองใหม่เมื่อเกิดข้อผิดพลาดชั่วคราว (429, timeout, connect/reset/closed, temporarily unavailable)
- ใช้ `retry_after` เมื่อมี มิฉะนั้นจะใช้ exponential backoff
- ข้อผิดพลาดการ parse Markdown จะไม่ถูกลองใหม่; แต่จะ fallback ไปใช้ข้อความล้วน

## การกำหนดค่า

ตั้งนโยบายการลองใหม่แยกตามผู้ให้บริการใน `~/.openclaw/openclaw.json`:

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

- การลองใหม่มีผลต่อคำขอแต่ละครั้ง (การส่งข้อความ, การอัปโหลดสื่อ, การรีแอ็กชัน, poll, sticker)
- โฟลว์แบบประกอบจะไม่ลองใหม่ในขั้นตอนที่เสร็จไปแล้ว

## ที่เกี่ยวข้อง

- [Model failover](/th/concepts/model-failover)
- [คิวคำสั่ง](/th/concepts/queue)
