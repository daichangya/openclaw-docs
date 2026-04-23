---
read_when:
    - คุณต้องการการค้นหาเว็บที่ขับเคลื่อนโดย Tavily
    - คุณต้องมี Tavily API key
    - คุณต้องการใช้ Tavily เป็น web_search provider
    - คุณต้องการดึงเนื้อหาจาก URLs
summary: เครื่องมือค้นหาและดึงข้อมูลของ Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-23T06:03:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

OpenClaw สามารถใช้ **Tavily** ได้ 2 แบบ:

- เป็น provider ของ `web_search`
- เป็นเครื่องมือ Plugin แบบระบุชัดเจน: `tavily_search` และ `tavily_extract`

Tavily เป็น Search API ที่ออกแบบมาสำหรับแอปพลิเคชัน AI โดยคืนผลลัพธ์แบบมีโครงสร้าง
ที่เหมาะกับการใช้งานโดย LLM รองรับการตั้งค่าระดับความลึกของการค้นหา การกรองตามหัวข้อ
ตัวกรองโดเมน สรุปคำตอบที่สร้างโดย AI และการดึงเนื้อหาจาก URLs
(รวมถึงหน้าที่เรนเดอร์ด้วย JavaScript)

## รับ API key

1. สร้างบัญชี Tavily ที่ [tavily.com](https://tavily.com/)
2. สร้าง API key ในแดชบอร์ด
3. เก็บไว้ใน config หรือตั้ง `TAVILY_API_KEY` ใน environment ของ gateway

## ตั้งค่าการค้นหา Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // ไม่บังคับ หากตั้ง TAVILY_API_KEY ไว้แล้ว
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

หมายเหตุ:

- การเลือก Tavily ใน onboarding หรือ `openclaw configure --section web` จะเปิดใช้งาน
  bundled Tavily Plugin ให้อัตโนมัติ
- ให้เก็บ config ของ Tavily ไว้ภายใต้ `plugins.entries.tavily.config.webSearch.*`
- `web_search` กับ Tavily รองรับ `query` และ `count` (สูงสุด 20 ผลลัพธ์)
- หากต้องการตัวควบคุมเฉพาะของ Tavily เช่น `search_depth`, `topic`, `include_answer`
  หรือ domain filters ให้ใช้ `tavily_search`

## เครื่องมือ Plugin ของ Tavily

### `tavily_search`

ใช้สิ่งนี้เมื่อคุณต้องการตัวควบคุมการค้นหาเฉพาะของ Tavily แทน
`web_search` แบบทั่วไป

| พารามิเตอร์        | คำอธิบาย                                                           |
| ------------------ | ------------------------------------------------------------------ |
| `query`            | สตริงคำค้นหา (ควรยาวไม่เกิน 400 ตัวอักษร)                        |
| `search_depth`     | `basic` (ค่าเริ่มต้น, สมดุล) หรือ `advanced` (เกี่ยวข้องสูงสุด แต่ช้ากว่า) |
| `topic`            | `general` (ค่าเริ่มต้น), `news` (อัปเดตแบบเรียลไทม์) หรือ `finance` |
| `max_results`      | จำนวนผลลัพธ์, 1-20 (ค่าเริ่มต้น: 5)                               |
| `include_answer`   | ใส่ answer summary ที่สร้างโดย AI ด้วยหรือไม่ (ค่าเริ่มต้น: false) |
| `time_range`       | กรองตามความใหม่: `day`, `week`, `month` หรือ `year`             |
| `include_domains`  | อาร์เรย์ของโดเมนที่ต้องการจำกัดผลลัพธ์ให้อยู่ภายใน                |
| `exclude_domains`  | อาร์เรย์ของโดเมนที่ต้องการตัดออกจากผลลัพธ์                        |

**ระดับความลึกของการค้นหา:**

| ระดับ      | ความเร็ว | ความเกี่ยวข้อง | เหมาะที่สุดสำหรับ                     |
| ---------- | -------- | -------------- | ------------------------------------- |
| `basic`    | เร็วกว่า | สูง             | คำค้นหาทั่วไป (ค่าเริ่มต้น)          |
| `advanced` | ช้ากว่า  | สูงที่สุด       | ความแม่นยำ ข้อเท็จจริงเฉพาะ งานวิจัย |

### `tavily_extract`

ใช้สิ่งนี้เพื่อดึงเนื้อหาที่สะอาดจาก URL หนึ่งรายการหรือหลายรายการ รองรับ
หน้าที่เรนเดอร์ด้วย JavaScript และรองรับการแบ่ง chunk ที่เน้น query สำหรับการดึงข้อมูลแบบเจาะจง

| พารามิเตอร์         | คำอธิบาย                                                 |
| ------------------- | -------------------------------------------------------- |
| `urls`              | อาร์เรย์ของ URLs ที่ต้องการดึงข้อมูล (1-20 ต่อคำขอ)       |
| `query`             | จัดอันดับ chunks ที่ดึงมาใหม่ตามความเกี่ยวข้องกับ query นี้ |
| `extract_depth`     | `basic` (ค่าเริ่มต้น, เร็ว) หรือ `advanced` (สำหรับหน้าที่พึ่ง JS มาก) |
| `chunks_per_source` | จำนวน chunks ต่อ URL, 1-5 (ต้องใช้ร่วมกับ `query`)       |
| `include_images`    | รวม image URLs ในผลลัพธ์ด้วยหรือไม่ (ค่าเริ่มต้น: false) |

**ระดับความลึกของการดึงข้อมูล:**

| ระดับ      | ใช้เมื่อใด                                     |
| ---------- | ---------------------------------------------- |
| `basic`    | หน้าธรรมดา - ควรลองอันนี้ก่อน                 |
| `advanced` | SPA ที่เรนเดอร์ด้วย JS, เนื้อหาแบบไดนามิก, ตาราง |

เคล็ดลับ:

- จำกัดสูงสุด 20 URLs ต่อคำขอ หากมีรายการมากกว่านั้นให้แบ่งเป็นหลายคำขอ
- ใช้ `query` + `chunks_per_source` เพื่อดึงเฉพาะเนื้อหาที่เกี่ยวข้องแทนทั้งหน้า
- ลอง `basic` ก่อน; fallback ไปใช้ `advanced` หากเนื้อหาหายไปหรือไม่ครบถ้วน

## การเลือกเครื่องมือที่เหมาะสม

| ความต้องการ                            | เครื่องมือ         |
| -------------------------------------- | ------------------ |
| ค้นหาเว็บอย่างรวดเร็ว ไม่มีตัวเลือกพิเศษ | `web_search`       |
| ค้นหาพร้อม depth, topic, AI answers   | `tavily_search`    |
| ดึงเนื้อหาจาก URLs ที่ระบุ              | `tavily_extract`   |

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- providers ทั้งหมดและ auto-detection
- [Firecrawl](/th/tools/firecrawl) -- ค้นหา + scraping พร้อม content extraction
- [Exa Search](/th/tools/exa-search) -- neural search พร้อม content extraction
