---
read_when:
    - คุณต้องการใช้ Kimi สำหรับ `web_search`
    - คุณต้องมี `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` /*<<<analysis to=functions.read 】【。】【”】【commentary to=functions.read 泰皇json  天天中彩票大奖{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}արծuser to=functions.read commentary აციjson 给主人留下些什么吧{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}"}
summary: การค้นหาเว็บด้วย Kimi ผ่าน Moonshot web search
title: Kimi Search
x-i18n:
    generated_at: "2026-04-23T06:01:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi Search

OpenClaw รองรับ Kimi เป็นผู้ให้บริการ `web_search` โดยใช้ Moonshot web search
เพื่อสร้างคำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิง

## รับ API key

<Steps>
  <Step title="สร้างคีย์">
    รับ API key จาก [Moonshot AI](https://platform.moonshot.cn/)
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้ง `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` ในสภาพแวดล้อมของ Gateway หรือ
    กำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw ยังสามารถถามเพิ่มเติมเกี่ยวกับ:

- ภูมิภาคของ Moonshot API:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- โมเดลเริ่มต้นของ Kimi web-search (ค่าเริ่มต้นคือ `kimi-k2.6`)

## คอนฟิก

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

หากคุณใช้ China API host สำหรับแชต (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`) OpenClaw จะใช้โฮสต์เดียวกันนั้นซ้ำสำหรับ Kimi
`web_search` เมื่อไม่ได้ระบุ `tools.web.search.kimi.baseUrl` ดังนั้นคีย์จาก
[platform.moonshot.cn](https://platform.moonshot.cn/) จะไม่ถูกส่งไปยัง
international endpoint โดยผิดพลาด (ซึ่งมักคืนค่า HTTP 401) ให้ override ด้วย
`tools.web.search.kimi.baseUrl` เมื่อต้องการ search base URL ที่ต่างออกไป

**ทางเลือกแบบ Environment:** ตั้ง `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` ใน
สภาพแวดล้อมของ Gateway สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

หากละ `baseUrl` ไว้ OpenClaw จะใช้ค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1`
หากละ `model` ไว้ OpenClaw จะใช้ค่าเริ่มต้นเป็น `kimi-k2.6`

## วิธีการทำงาน

Kimi ใช้ Moonshot web search เพื่อสังเคราะห์คำตอบพร้อมการอ้างอิงแบบ inline
คล้ายกับแนวทาง grounded response ของ Gemini และ Grok

## พารามิเตอร์ที่รองรับ

Kimi search รองรับ `query`

ยอมรับ `count` เพื่อความเข้ากันได้กับ `web_search` แบบใช้ร่วมกัน แต่ Kimi ยังคง
คืนคำตอบที่สังเคราะห์หนึ่งคำตอบพร้อมการอ้างอิง แทนที่จะเป็นรายการผลลัพธ์ N รายการ

ปัจจุบันยังไม่รองรับตัวกรองเฉพาะผู้ให้บริการ

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Moonshot AI](/th/providers/moonshot) -- เอกสารผู้ให้บริการโมเดล Moonshot + Kimi Coding
- [Gemini Search](/th/tools/gemini-search) -- คำตอบที่สังเคราะห์โดย AI ผ่าน Google grounding
- [Grok Search](/th/tools/grok-search) -- คำตอบที่สังเคราะห์โดย AI ผ่าน xAI grounding
