---
read_when:
    - คุณต้องการใช้ Kimi สำหรับ `web_search`
    - คุณต้องการ `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY`
summary: การค้นหาเว็บของ Kimi ผ่าน Moonshot web search
title: Kimi search
x-i18n:
    generated_at: "2026-04-24T09:37:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw รองรับ Kimi เป็น provider สำหรับ `web_search` โดยใช้ Moonshot web search
เพื่อสร้างคำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิงแหล่งที่มา

## รับคีย์ API

<Steps>
  <Step title="สร้างคีย์">
    รับคีย์ API จาก [Moonshot AI](https://platform.moonshot.cn/)
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` ในสภาพแวดล้อมของ Gateway หรือ
    กำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw ยังสามารถถามหา:

- region ของ Moonshot API:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- โมเดล Kimi web-search เริ่มต้น (ค่าเริ่มต้นคือ `kimi-k2.6`)

## Config

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // ไม่บังคับหากตั้งค่า KIMI_API_KEY หรือ MOONSHOT_API_KEY ไว้แล้ว
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

หากคุณใช้โฮสต์ China API สำหรับแชต (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`) OpenClaw จะใช้โฮสต์เดียวกันนั้นซ้ำสำหรับ
`web_search` ของ Kimi เมื่อไม่ได้ระบุ `tools.web.search.kimi.baseUrl` ดังนั้นคีย์จาก
[platform.moonshot.cn](https://platform.moonshot.cn/) จะไม่ไปชนกับ
endpoint ระหว่างประเทศโดยผิดพลาด (ซึ่งมักจะตอบกลับเป็น HTTP 401) ให้ override
ด้วย `tools.web.search.kimi.baseUrl` เมื่อต้องการ base URL สำหรับการค้นหาที่ต่างออกไป

**ทางเลือกผ่านสภาพแวดล้อม:** ตั้งค่า `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` ใน
สภาพแวดล้อมของ Gateway สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

หากละ `baseUrl` ไว้ OpenClaw จะใช้ค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1`
หากละ `model` ไว้ OpenClaw จะใช้ค่าเริ่มต้นเป็น `kimi-k2.6`

## วิธีการทำงาน

Kimi ใช้ Moonshot web search เพื่อสังเคราะห์คำตอบพร้อมการอ้างอิงในบรรทัด
คล้ายกับแนวทาง grounded response ของ Gemini และ Grok

## พารามิเตอร์ที่รองรับ

Kimi search รองรับ `query`

รองรับ `count` เพื่อความเข้ากันได้กับ `web_search` แบบใช้ร่วมกัน แต่ Kimi
ยังคงส่งกลับเป็นคำตอบแบบสังเคราะห์หนึ่งชุดพร้อมการอ้างอิง แทนที่จะเป็นรายการผลลัพธ์ N รายการ

ขณะนี้ยังไม่รองรับตัวกรองเฉพาะของ provider

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- providers ทั้งหมดและการตรวจจับอัตโนมัติ
- [Moonshot AI](/th/providers/moonshot) -- เอกสาร provider ของโมเดล Moonshot + Kimi Coding
- [Gemini Search](/th/tools/gemini-search) -- คำตอบที่สังเคราะห์โดย AI ผ่าน Google grounding
- [Grok Search](/th/tools/grok-search) -- คำตอบที่สังเคราะห์โดย AI ผ่าน xAI grounding
