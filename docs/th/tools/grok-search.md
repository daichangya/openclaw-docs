---
read_when:
    - คุณต้องการใช้ Grok สำหรับ `web_search`
    - คุณต้องใช้ `XAI_API_KEY` สำหรับการค้นหาเว็บ
summary: การค้นหาเว็บของ Grok ผ่านการตอบกลับแบบอ้างอิงเว็บของ xAI
title: การค้นหา Grok
x-i18n:
    generated_at: "2026-04-24T09:36:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

OpenClaw รองรับ Grok เป็นผู้ให้บริการ `web_search` โดยใช้การตอบกลับแบบอ้างอิงเว็บของ xAI เพื่อสร้างคำตอบที่สังเคราะห์โดย AI ซึ่งอ้างอิงจากผลการค้นหาแบบสดพร้อม citation

`XAI_API_KEY` เดียวกันนี้ยังสามารถใช้กับเครื่องมือ `x_search` ที่มีมาให้ในตัวสำหรับการค้นหาโพสต์บน X (เดิมคือ Twitter) ได้อีกด้วย หากคุณจัดเก็บคีย์ไว้ใต้
`plugins.entries.xai.config.webSearch.apiKey` ตอนนี้ OpenClaw จะนำคีย์นั้นกลับมาใช้เป็น fallback สำหรับผู้ให้บริการโมเดล xAI ที่มาพร้อมกันด้วย

สำหรับเมตริกระดับโพสต์ของ X เช่น reposts, replies, bookmarks หรือ views ควรใช้
`x_search` พร้อม URL ของโพสต์หรือ status ID แบบตรงตัว แทนการใช้คำค้นหาแบบกว้าง

## Onboarding และ configure

หากคุณเลือก **Grok** ระหว่าง:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw สามารถแสดงขั้นตอนติดตามผลแยกต่างหากเพื่อเปิดใช้ `x_search` ด้วย `XAI_API_KEY` เดียวกัน ขั้นตอนติดตามผลนั้น:

- จะปรากฏเฉพาะหลังจากที่คุณเลือก Grok สำหรับ `web_search`
- ไม่ใช่ตัวเลือกผู้ให้บริการ web-search ระดับบนสุดแยกต่างหาก
- สามารถตั้งค่าโมเดล `x_search` เพิ่มเติมได้ในโฟลว์เดียวกัน

หากคุณข้ามไป คุณสามารถเปิดใช้หรือเปลี่ยน `x_search` ภายหลังได้ใน config

## รับคีย์ API

<Steps>
  <Step title="สร้างคีย์">
    รับคีย์ API จาก [xAI](https://console.x.ai/)
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `XAI_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Config

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

**ทางเลือกผ่านสภาพแวดล้อม:** ตั้งค่า `XAI_API_KEY` ในสภาพแวดล้อมของ Gateway
สำหรับการติดตั้ง Gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## วิธีการทำงาน

Grok ใช้การตอบกลับแบบอ้างอิงเว็บของ xAI เพื่อสังเคราะห์คำตอบพร้อม citation แบบแทรกในเนื้อหา
คล้ายกับแนวทาง grounding ด้วย Google Search ของ Gemini

## พารามิเตอร์ที่รองรับ

การค้นหา Grok รองรับ `query`

รองรับ `count` เพื่อความเข้ากันได้กับ `web_search` ที่ใช้ร่วมกัน แต่ Grok ยังคง
ส่งคืนคำตอบที่สังเคราะห์แล้วหนึ่งรายการพร้อม citations แทนรายการผลลัพธ์จำนวน N รายการ

ขณะนี้ยังไม่รองรับตัวกรองเฉพาะของผู้ให้บริการ

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [x_search ใน Web Search](/th/tools/web#x_search) -- การค้นหา X แบบ first-class ผ่าน xAI
- [Gemini Search](/th/tools/gemini-search) -- คำตอบที่สังเคราะห์โดย AI ผ่าน Google grounding
