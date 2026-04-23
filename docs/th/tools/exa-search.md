---
read_when:
    - คุณต้องการใช้ Exa สำหรับ `web_search` to=final
    - คุณต้องการ `EXA_API_KEY` to=final
    - คุณต้องการการค้นหาแบบ neural หรือการดึงเนื้อหา
summary: Exa AI search -- การค้นหาแบบ neural และคีย์เวิร์ดพร้อมการดึงเนื้อหา
title: การค้นหา Exa to=final
x-i18n:
    generated_at: "2026-04-23T06:00:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# การค้นหา Exa

OpenClaw รองรับ [Exa AI](https://exa.ai/) ในฐานะผู้ให้บริการ `web_search` Exa
มีโหมดการค้นหาแบบ neural, คีย์เวิร์ด และ hybrid พร้อมการดึงเนื้อหาในตัว
(highlights, text, summaries)

## รับ API key

<Steps>
  <Step title="สร้างบัญชี">
    สมัครที่ [exa.ai](https://exa.ai/) และสร้าง API key จาก
    แดชบอร์ดของคุณ
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `EXA_API_KEY` ใน environment ของ Gateway หรือกำหนดค่าผ่าน:

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // ไม่บังคับ หากมีการตั้ง EXA_API_KEY ไว้แล้ว
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

**ทางเลือกแบบ environment:** ตั้งค่า `EXA_API_KEY` ใน environment ของ Gateway
สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## พารามิเตอร์ของ Tool

| พารามิเตอร์   | คำอธิบาย                                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| `query`       | คำค้นหา (จำเป็น)                                                             |
| `count`       | จำนวนผลลัพธ์ที่จะคืนกลับ (1-100)                                             |
| `type`        | โหมดการค้นหา: `auto`, `neural`, `fast`, `deep`, `deep-reasoning` หรือ `instant` |
| `freshness`   | ตัวกรองเวลา: `day`, `week`, `month` หรือ `year`                              |
| `date_after`  | ผลลัพธ์หลังจากวันที่นี้ (YYYY-MM-DD)                                         |
| `date_before` | ผลลัพธ์ก่อนวันที่นี้ (YYYY-MM-DD)                                            |
| `contents`    | ตัวเลือกการดึงเนื้อหา (ดูด้านล่าง)                                           |

### การดึงเนื้อหา

Exa สามารถคืนเนื้อหาที่ถูกดึงออกมาพร้อมกับผลลัพธ์การค้นหาได้ ส่งอ็อบเจ็กต์
`contents` เพื่อเปิดใช้:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // ข้อความเต็มของหน้า
    highlights: { numSentences: 3 }, // ประโยคสำคัญ
    summary: true, // สรุปโดย AI
  },
});
```

| ตัวเลือก contents | ชนิด                                                                 | คำอธิบาย             |
| ----------------- | -------------------------------------------------------------------- | -------------------- |
| `text`            | `boolean \| { maxCharacters }`                                       | ดึงข้อความเต็มของหน้า |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | ดึงประโยคสำคัญ       |
| `summary`         | `boolean \| { query }`                                               | สรุปที่สร้างโดย AI   |

### โหมดการค้นหา

| โหมด             | คำอธิบาย                           |
| ---------------- | ---------------------------------- |
| `auto`           | Exa เลือกโหมดที่ดีที่สุดให้ (ค่าเริ่มต้น) |
| `neural`         | การค้นหาเชิงความหมาย/ตามความหมาย      |
| `fast`           | การค้นหาด้วยคีย์เวิร์ดแบบรวดเร็ว       |
| `deep`           | การค้นหาเชิงลึกอย่างละเอียด             |
| `deep-reasoning` | การค้นหาเชิงลึกพร้อม reasoning        |
| `instant`        | ผลลัพธ์ที่เร็วที่สุด                    |

## หมายเหตุ

- หากไม่ได้ระบุตัวเลือก `contents` Exa จะใช้ค่าเริ่มต้นเป็น `{ highlights: true }`
  เพื่อให้ผลลัพธ์มีข้อความตัดตอนประโยคสำคัญ
- ผลลัพธ์จะคงฟิลด์ `highlightScores` และ `summary` จากการตอบกลับของ Exa API
  เมื่อมีให้ใช้
- คำอธิบายของผลลัพธ์จะถูก resolve จาก highlights ก่อน จากนั้น summary แล้วค่อย
  full text — ใช้อะไรก็ตามที่มีอยู่
- ไม่สามารถใช้ `freshness` ร่วมกับ `date_after`/`date_before` ได้ — ให้ใช้เพียง
  โหมดตัวกรองเวลาแบบใดแบบหนึ่ง
- สามารถคืนผลลัพธ์ได้สูงสุด 100 รายการต่อหนึ่ง query (ขึ้นอยู่กับข้อจำกัด
  ของประเภทการค้นหาใน Exa)
- ผลลัพธ์จะถูกแคชไว้ 15 นาทีเป็นค่าเริ่มต้น (ปรับได้ผ่าน
  `cacheTtlMinutes`)
- Exa เป็นการผสานรวม API อย่างเป็นทางการพร้อมการตอบกลับแบบ JSON ที่มีโครงสร้าง

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมตัวกรองประเทศ/ภาษา
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
