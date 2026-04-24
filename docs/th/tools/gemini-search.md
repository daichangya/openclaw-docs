---
read_when:
    - คุณต้องการใช้ Gemini สำหรับ web_search
    - คุณต้องการ `GEMINI_API_KEY`
    - คุณต้องการ Google Search grounding
summary: การค้นหาเว็บด้วย Gemini พร้อม Google Search grounding
title: การค้นหา Gemini
x-i18n:
    generated_at: "2026-04-24T09:37:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw รองรับโมเดล Gemini พร้อม
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding) ในตัว
ซึ่งส่งกลับคำตอบแบบสังเคราะห์โดย AI ที่อ้างอิงจากผลการค้นหา Google แบบสดพร้อม
citation

## รับ API key

<Steps>
  <Step title="สร้างคีย์">
    ไปที่ [Google AI Studio](https://aistudio.google.com/apikey) แล้วสร้าง
    API key
  </Step>
  <Step title="เก็บคีย์ไว้">
    ตั้งค่า `GEMINI_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## คอนฟิก

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**ทางเลือกผ่าน environment:** ตั้ง `GEMINI_API_KEY` ในสภาพแวดล้อมของ Gateway
สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## วิธีการทำงาน

ต่างจาก provider ค้นหาแบบดั้งเดิมที่ส่งกลับรายการลิงก์และ snippet,
Gemini ใช้ Google Search grounding เพื่อสร้างคำตอบแบบสังเคราะห์โดย AI พร้อม
citation แบบ inline ผลลัพธ์จะมีทั้งคำตอบที่สังเคราะห์แล้วและ URL ของแหล่งข้อมูล

- citation URL จาก Gemini grounding จะถูก resolve จาก URL redirect ของ Google
  ให้เป็น URL ปลายทางโดยอัตโนมัติ
- การ resolve redirect ใช้เส้นทาง SSRF guard (HEAD + การตรวจ redirect +
  การตรวจสอบ http/https) ก่อนจะคืน citation URL สุดท้าย
- การ resolve redirect ใช้ค่า SSRF แบบเข้มงวดเป็นค่าปริยาย ดังนั้น redirect ไปยัง
  เป้าหมายแบบ private/internal จะถูกบล็อก

## พารามิเตอร์ที่รองรับ

Gemini search รองรับ `query`

`count` ถูกรับไว้เพื่อความเข้ากันได้กับ `web_search` ที่ใช้ร่วมกัน แต่ Gemini grounding
ยังคงส่งกลับคำตอบแบบสังเคราะห์เพียงหนึ่งรายการพร้อม citation แทนรายการผลลัพธ์
จำนวน N รายการ

ไม่รองรับตัวกรองเฉพาะของ provider เช่น `country`, `language`, `freshness` และ
`domain_filter`

## การเลือกโมเดล

โมเดลค่าปริยายคือ `gemini-2.5-flash` (เร็วและคุ้มค่าใช้จ่าย) สามารถใช้โมเดล Gemini
ใดก็ได้ที่รองรับ grounding ผ่าน
`plugins.entries.google.config.webSearch.model`

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- provider ทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อม snippet
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้าง + การดึงเนื้อหา
