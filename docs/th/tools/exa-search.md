---
read_when:
    - คุณต้องการใช้ Exa สำหรับ web_search
    - คุณต้องการ `EXA_API_KEY`
    - คุณต้องการการค้นหาแบบ neural หรือการดึงเนื้อหา
summary: การค้นหา Exa AI -- การค้นหาแบบ neural และคีย์เวิร์ดพร้อมการดึงเนื้อหา
title: การค้นหา Exa
x-i18n:
    generated_at: "2026-04-24T09:36:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw รองรับ [Exa AI](https://exa.ai/) เป็น provider สำหรับ `web_search` โดย Exa
มีโหมดการค้นหาแบบ neural, keyword และ hybrid พร้อมการดึงเนื้อหาในตัว
(highlights, text, summaries)

## รับ API key

<Steps>
  <Step title="สร้างบัญชี">
    สมัครที่ [exa.ai](https://exa.ai/) แล้วสร้าง API key จาก
    dashboard ของคุณ
  </Step>
  <Step title="เก็บคีย์ไว้">
    ตั้งค่า `EXA_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**ทางเลือกผ่าน environment:** ตั้ง `EXA_API_KEY` ในสภาพแวดล้อมของ Gateway
สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## พารามิเตอร์ของเครื่องมือ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number">
จำนวนผลลัพธ์ที่จะส่งกลับ (1–100)
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
โหมดการค้นหา
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
ตัวกรองเวลา
</ParamField>

<ParamField path="date_after" type="string">
ผลลัพธ์หลังจากวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="date_before" type="string">
ผลลัพธ์ก่อนวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="contents" type="object">
ตัวเลือกสำหรับการดึงเนื้อหา (ดูด้านล่าง)
</ParamField>

### การดึงเนื้อหา

Exa สามารถส่งเนื้อหาที่ดึงออกมาคืนกลับมาพร้อมกับผลลัพธ์การค้นหาได้ ส่งออบเจ็กต์ `contents`
เพื่อเปิดใช้งาน:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| ตัวเลือกของ contents | ประเภท                                                               | คำอธิบาย               |
| -------------------- | -------------------------------------------------------------------- | ---------------------- |
| `text`               | `boolean \| { maxCharacters }`                                       | ดึงข้อความเต็มของหน้า   |
| `highlights`         | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }`| ดึงประโยคสำคัญ          |
| `summary`            | `boolean \| { query }`                                               | สรุปที่สร้างโดย AI      |

### โหมดการค้นหา

| โหมด              | คำอธิบาย                          |
| ----------------- | --------------------------------- |
| `auto`            | Exa เลือกโหมดที่ดีที่สุด (ค่าปริยาย) |
| `neural`          | การค้นหาตาม semantic/ความหมาย     |
| `fast`            | การค้นหาด้วยคีย์เวิร์ดแบบรวดเร็ว   |
| `deep`            | การค้นหาเชิงลึกอย่างละเอียด         |
| `deep-reasoning`  | การค้นหาเชิงลึกพร้อม reasoning     |
| `instant`         | ผลลัพธ์ที่เร็วที่สุด                |

## หมายเหตุ

- หากไม่ได้ระบุตัวเลือก `contents`, Exa จะใช้ค่าปริยายเป็น `{ highlights: true }`
  ดังนั้นผลลัพธ์จะมีข้อความคัดย่อจากประโยคสำคัญ
- ผลลัพธ์จะคงฟิลด์ `highlightScores` และ `summary` จากการตอบกลับของ Exa API
  ไว้เมื่อมี
- คำอธิบายของผลลัพธ์จะถูก resolve จาก highlights ก่อน ตามด้วย summary แล้วจึง
  full text — โดยใช้ตัวที่มีอยู่
- `freshness` และ `date_after`/`date_before` ใช้ร่วมกันไม่ได้ — ให้เลือกใช้
  โหมดตัวกรองเวลาเพียงแบบเดียว
- สามารถส่งกลับผลลัพธ์ได้สูงสุด 100 รายการต่อคำค้นหนึ่งครั้ง (ขึ้นอยู่กับข้อจำกัด
  ของชนิดการค้นหาของ Exa)
- ผลลัพธ์จะถูกแคชไว้ 15 นาทีเป็นค่าปริยาย (กำหนดค่าได้ผ่าน
  `cacheTtlMinutes`)
- Exa เป็นการเชื่อมต่อ API อย่างเป็นทางการพร้อมการตอบกลับ JSON แบบมีโครงสร้าง

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- provider ทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมตัวกรองประเทศ/ภาษา
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
