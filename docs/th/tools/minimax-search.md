---
read_when:
    - "คุณต้องการใช้ MiniMax สำหรับ `web_search` to=final \U0005FFFF"
    - คุณต้องการ MiniMax Coding Plan key to=final
    - คุณต้องการคำแนะนำเรื่องโฮสต์การค้นหา MiniMax แบบ CN/global to=final answer translated only.
summary: MiniMax Search ผ่าน Coding Plan search API of MiniMax
title: การค้นหา MiniMax to=final output only translated.
x-i18n:
    generated_at: "2026-04-23T06:02:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# การค้นหา MiniMax

OpenClaw รองรับ MiniMax ในฐานะผู้ให้บริการ `web_search` ผ่าน MiniMax
Coding Plan search API ซึ่งจะคืนผลลัพธ์การค้นหาแบบมีโครงสร้างพร้อมชื่อเรื่อง, URL,
snippet และคำค้นหาที่เกี่ยวข้อง

## รับ Coding Plan key

<Steps>
  <Step title="สร้างคีย์">
    สร้างหรือคัดลอก MiniMax Coding Plan key จาก
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `MINIMAX_CODE_PLAN_KEY` ใน environment ของ Gateway หรือกำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw ยังยอมรับ `MINIMAX_CODING_API_KEY` เป็น env alias ด้วย `MINIMAX_API_KEY`
ยังคงถูกอ่านเป็น compatibility fallback เมื่อมันชี้ไปยัง coding-plan token อยู่แล้ว

## Config

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // ไม่บังคับ หากมีการตั้ง MINIMAX_CODE_PLAN_KEY ไว้แล้ว
            region: "global", // หรือ "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**ทางเลือกแบบ environment:** ตั้งค่า `MINIMAX_CODE_PLAN_KEY` ใน environment ของ Gateway
สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## การเลือก region

MiniMax Search ใช้ endpoint เหล่านี้:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

หากไม่ได้ตั้งค่า `plugins.entries.minimax.config.webSearch.region` OpenClaw จะ resolve
region ตามลำดับดังนี้:

1. `tools.web.search.minimax.region` / `webSearch.region` ที่เป็นของ plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

นั่นหมายความว่า onboarding แบบ CN หรือ `MINIMAX_API_HOST=https://api.minimaxi.com/...`
จะทำให้ MiniMax Search อยู่บนโฮสต์ CN โดยอัตโนมัติเช่นกัน

แม้ว่าคุณจะยืนยันตัวตน MiniMax ผ่านเส้นทาง OAuth `minimax-portal`
web search ก็ยังลงทะเบียนเป็น provider id `minimax`; base URL ของ OAuth provider
จะถูกใช้เพียงเป็นคำใบ้เรื่อง region สำหรับการเลือกโฮสต์ CN/global เท่านั้น

## พารามิเตอร์ที่รองรับ

MiniMax Search รองรับ:

- `query`
- `count` (OpenClaw จะตัดรายการผลลัพธ์ที่คืนกลับให้เหลือเท่าจำนวนที่ร้องขอ)

ปัจจุบันยังไม่รองรับตัวกรองเฉพาะของ provider

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [MiniMax](/th/providers/minimax) -- การตั้งค่าโมเดล ภาพ เสียง และ auth
