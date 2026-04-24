---
read_when:
    - คุณต้องการใช้ MiniMax สำหรับ `web_search`
    - คุณต้องการคีย์ MiniMax Coding Plan
    - คุณต้องการคำแนะนำเกี่ยวกับโฮสต์ค้นหา MiniMax แบบ CN/global
summary: MiniMax Search ผ่าน Coding Plan search API
title: MiniMax search
x-i18n:
    generated_at: "2026-04-24T09:37:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw รองรับ MiniMax เป็น provider สำหรับ `web_search` ผ่าน MiniMax
Coding Plan search API โดยจะส่งกลับผลการค้นหาแบบมีโครงสร้าง พร้อมชื่อเรื่อง URLs,
snippets และคำค้นที่เกี่ยวข้อง

## รับคีย์ Coding Plan

<Steps>
  <Step title="สร้างคีย์">
    สร้างหรือคัดลอกคีย์ MiniMax Coding Plan จาก
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `MINIMAX_CODE_PLAN_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw ยังยอมรับ `MINIMAX_CODING_API_KEY` เป็น env alias ด้วย โดย `MINIMAX_API_KEY`
ยังคงถูกอ่านเป็น compatibility fallback เมื่อมันชี้ไปยังโทเค็น coding-plan อยู่แล้ว

## Config

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // ไม่บังคับหากตั้งค่า MINIMAX_CODE_PLAN_KEY ไว้แล้ว
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

**ทางเลือกผ่านสภาพแวดล้อม:** ตั้งค่า `MINIMAX_CODE_PLAN_KEY` ในสภาพแวดล้อมของ Gateway
สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## การเลือก region

MiniMax Search ใช้ endpoints เหล่านี้:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

หากไม่ได้ตั้งค่า `plugins.entries.minimax.config.webSearch.region` OpenClaw จะ resolve
region ตามลำดับนี้:

1. `tools.web.search.minimax.region` / `webSearch.region` ที่ plugin เป็นเจ้าของ
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

ซึ่งหมายความว่า onboarding แบบ CN หรือ `MINIMAX_API_HOST=https://api.minimaxi.com/...`
จะทำให้ MiniMax Search คงอยู่บนโฮสต์ CN โดยอัตโนมัติเช่นกัน

แม้ว่าคุณจะยืนยันตัวตนกับ MiniMax ผ่านเส้นทาง OAuth `minimax-portal`
web search ก็ยังคงลงทะเบียนเป็น provider id `minimax`; Base URL ของ OAuth provider
จะถูกใช้เพียงเป็นคำใบ้ region สำหรับการเลือกโฮสต์ CN/global เท่านั้น

## พารามิเตอร์ที่รองรับ

MiniMax Search รองรับ:

- `query`
- `count` (OpenClaw จะตัดรายการผลลัพธ์ที่ส่งกลับให้เหลือตามจำนวนที่ขอ)

ขณะนี้ยังไม่รองรับตัวกรองเฉพาะของ provider

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- providers ทั้งหมดและการตรวจจับอัตโนมัติ
- [MiniMax](/th/providers/minimax) -- การตั้งค่าโมเดล ภาพ เสียง และ auth
