---
read_when:
    - คุณต้องการใช้ Grok กับ `web_search`
    - คุณต้องใช้ `XAI_API_KEY` สำหรับการค้นหาเว็บ
summary: การค้นหาเว็บด้วย Grok ผ่าน xAI web-grounded responses
title: Grok Search
x-i18n:
    generated_at: "2026-04-23T06:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Grok Search

OpenClaw รองรับ Grok เป็นผู้ให้บริการ `web_search` โดยใช้ xAI web-grounded
responses เพื่อสร้างคำตอบแบบสังเคราะห์โดย AI ที่อ้างอิงจากผลการค้นหาแบบสด
พร้อม citation

`XAI_API_KEY` เดียวกันนี้ยังสามารถใช้กับ tool `x_search` ที่มีมาในตัวสำหรับการค้นหาโพสต์บน X
(เดิมคือ Twitter) ได้ด้วย หากคุณเก็บ key ไว้ใต้
`plugins.entries.xai.config.webSearch.apiKey` ตอนนี้ OpenClaw จะนำมันกลับมาใช้ซ้ำเป็น fallback สำหรับผู้ให้บริการโมเดล xAI แบบ bundled ด้วย

สำหรับ metric ระดับโพสต์บน X เช่น reposts, replies, bookmarks หรือ views ควรใช้
`x_search` พร้อม URL ของโพสต์หรือ status ID แบบตรงตัว แทนการใช้
คำค้นหาแบบกว้าง

## Onboarding และ configure

หากคุณเลือก **Grok** ระหว่าง:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw สามารถแสดงขั้นตอนติดตามผลแยกต่างหากเพื่อเปิดใช้ `x_search` ด้วย `XAI_API_KEY`
ตัวเดียวกันได้ ขั้นตอนติดตามผลนั้น:

- จะแสดงก็ต่อเมื่อคุณเลือก Grok สำหรับ `web_search`
- ไม่ใช่ตัวเลือกผู้ให้บริการ web-search ระดับบนสุดแยกต่างหาก
- สามารถตั้งค่าโมเดล `x_search` เพิ่มเติมได้ในโฟลว์เดียวกัน

หากคุณข้ามไป คุณสามารถเปิดใช้หรือเปลี่ยน `x_search` ภายหลังในคอนฟิกได้

## รับ API key

<Steps>
  <Step title="สร้าง key">
    รับ API key จาก [xAI](https://console.x.ai/)
  </Step>
  <Step title="จัดเก็บ key">
    ตั้งค่า `XAI_API_KEY` ใน environment ของ Gateway หรือกำหนดค่าผ่าน:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**ทางเลือกแบบ environment:** ตั้งค่า `XAI_API_KEY` ใน environment ของ Gateway
สำหรับการติดตั้ง Gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## วิธีการทำงาน

Grok ใช้ xAI web-grounded responses เพื่อสังเคราะห์คำตอบพร้อม
citation แบบ inline คล้ายกับแนวทางการ grounding ผ่าน Google Search ของ Gemini

## พารามิเตอร์ที่รองรับ

การค้นหาด้วย Grok รองรับ `query`

รองรับ `count` เพื่อความเข้ากันได้กับ `web_search` แบบใช้ร่วมกัน แต่ Grok ยังคง
ส่งคืนคำตอบแบบสังเคราะห์หนึ่งรายการพร้อม citation แทนรายการผลลัพธ์แบบ N รายการ

ในปัจจุบันยังไม่รองรับฟิลเตอร์เฉพาะของผู้ให้บริการ

## ที่เกี่ยวข้อง

- [ภาพรวมของ Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [x_search ใน Web Search](/th/tools/web#x_search) -- การค้นหา X แบบ first-class ผ่าน xAI
- [Gemini Search](/th/tools/gemini-search) -- คำตอบแบบสังเคราะห์โดย AI ผ่าน Google grounding
