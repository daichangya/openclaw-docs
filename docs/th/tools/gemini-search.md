---
read_when:
    - คุณต้องการใช้ Gemini สำหรับ `web_search`
    - "คุณต้องมี `GEMINI_API_KEY`\tRTLUanalysis to=functions.read 】【。】【”】【commentary to=functions.read  体育彩票天天json  泰皇平台{\"path\":\"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md\",\"offset\":1,\"limit\":20}"
    - คุณต้องการ Google Search grounding
summary: การค้นหาเว็บด้วย Gemini พร้อม Google Search grounding
title: Gemini Search
x-i18n:
    generated_at: "2026-04-23T06:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Gemini Search

OpenClaw รองรับโมเดล Gemini พร้อม
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding) ในตัว
ซึ่งจะคืนคำตอบที่สังเคราะห์โดย AI และมีผลการค้นหาสดจาก Google เป็นหลักฐานประกอบพร้อมการอ้างอิง

## รับ API key

<Steps>
  <Step title="สร้างคีย์">
    ไปที่ [Google AI Studio](https://aistudio.google.com/apikey) แล้วสร้าง
    API key
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้ง `GEMINI_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

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

**ทางเลือกแบบ Environment:** ตั้ง `GEMINI_API_KEY` ในสภาพแวดล้อมของ Gateway
สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## วิธีการทำงาน

ต่างจากผู้ให้บริการค้นหาแบบดั้งเดิมที่คืนรายการลิงก์และข้อความสรุป
Gemini ใช้ Google Search grounding เพื่อสร้างคำตอบที่สังเคราะห์โดย AI พร้อม
การอ้างอิงแบบ inline ผลลัพธ์จะมีทั้งคำตอบที่สังเคราะห์แล้วและ source
URLs

- Citation URLs จาก Gemini grounding จะถูก resolve จาก Google
  redirect URLs ไปเป็น direct URLs โดยอัตโนมัติ
- การ resolve redirect ใช้เส้นทาง SSRF guard (HEAD + ตรวจสอบ redirects +
  validation ของ http/https) ก่อนคืน citation URL ปลายทาง
- การ resolve redirect ใช้ค่าเริ่มต้น SSRF แบบเข้มงวด ดังนั้น redirects ไปยัง
  targets แบบ private/internal จะถูกบล็อก

## พารามิเตอร์ที่รองรับ

Gemini search รองรับ `query`

ยอมรับ `count` เพื่อความเข้ากันได้กับ `web_search` แบบใช้ร่วมกัน แต่ Gemini grounding
ยังคงคืนคำตอบที่สังเคราะห์หนึ่งคำตอบพร้อมการอ้างอิง แทนที่จะเป็นรายการผลลัพธ์ N รายการ

ไม่รองรับตัวกรองแบบเฉพาะผู้ให้บริการ เช่น `country`, `language`, `freshness` และ
`domain_filter`

## การเลือกโมเดล

โมเดลเริ่มต้นคือ `gemini-2.5-flash` (เร็วและคุ้มค่า) สามารถใช้โมเดล Gemini ใดก็ได้
ที่รองรับ grounding ผ่าน
`plugins.entries.google.config.webSearch.model`

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมข้อความสรุป
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้าง + การดึงเนื้อหา
