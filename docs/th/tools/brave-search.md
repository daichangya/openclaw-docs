---
read_when:
    - คุณต้องการใช้ Brave Search สำหรับ `web_search`
    - คุณต้องการ `BRAVE_API_KEY` หรือรายละเอียดของแผน usage to=functions.read commentary 】【。】【”】【json 早点加盟_path":"docs/AGENTS.md","offset":1,"limit":200} code
summary: การตั้งค่า Brave Search API สำหรับ `web_search`
title: Brave Search
x-i18n:
    generated_at: "2026-04-23T05:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc026a69addf74375a0e407805b875ff527c77eb7298b2f5bb0e165197f77c0c
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw รองรับ Brave Search API เป็น provider ของ `web_search`

## รับ API key

1. สร้างบัญชี Brave Search API ที่ [https://brave.com/search/api/](https://brave.com/search/api/)
2. ในแดชบอร์ด ให้เลือกแผน **Search** และสร้าง API key
3. เก็บคีย์ไว้ใน config หรือตั้ง `BRAVE_API_KEY` ในสภาพแวดล้อมของ Gateway

## ตัวอย่าง config

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // หรือ "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

การตั้งค่าการค้นหาเฉพาะของ Brave ตอนนี้อยู่ภายใต้ `plugins.entries.brave.config.webSearch.*`
`tools.web.search.apiKey` แบบเดิมยังคงโหลดได้ผ่าน compatibility shim แต่ไม่ใช่พาธ config แบบ canonical อีกต่อไป

`webSearch.mode` ควบคุมทรานสปอร์ตของ Brave:

- `web` (ค่าเริ่มต้น): Brave web search ปกติ พร้อมชื่อเรื่อง URL และ snippet
- `llm-context`: Brave LLM Context API พร้อมชิ้นข้อความที่ถูกดึงออกมาไว้ล่วงหน้าและแหล่งอ้างอิงสำหรับการ grounding

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์   | คำอธิบาย                                                              |
| ------------- | ---------------------------------------------------------------------- |
| `query`       | คำค้นหา (จำเป็น)                                                       |
| `count`       | จำนวนผลลัพธ์ที่จะคืนกลับ (1-10, ค่าเริ่มต้น: 5)                       |
| `country`     | รหัสประเทศ ISO 2 ตัวอักษร (เช่น `"US"`, `"DE"`)                       |
| `language`    | รหัสภาษา ISO 639-1 สำหรับผลการค้นหา (เช่น `"en"`, `"de"`, `"fr"`)      |
| `search_lang` | รหัสภาษาสำหรับการค้นหาของ Brave (เช่น `en`, `en-gb`, `zh-hans`)        |
| `ui_lang`     | รหัสภาษา ISO สำหรับองค์ประกอบ UI                                      |
| `freshness`   | ตัวกรองเวลา: `day` (24 ชม.), `week`, `month` หรือ `year`               |
| `date_after`  | เฉพาะผลลัพธ์ที่เผยแพร่หลังวันที่นี้ (YYYY-MM-DD)                      |
| `date_before` | เฉพาะผลลัพธ์ที่เผยแพร่ก่อนวันที่นี้ (YYYY-MM-DD)                       |

**ตัวอย่าง:**

```javascript
// ค้นหาแบบเจาะจงประเทศและภาษา
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// ผลลัพธ์ล่าสุด (สัปดาห์ที่ผ่านมา)
await web_search({
  query: "AI news",
  freshness: "week",
});

// ค้นหาตามช่วงวันที่
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## หมายเหตุ

- OpenClaw ใช้แผน **Search** ของ Brave หากคุณมีการสมัครแบบเดิมอยู่แล้ว (เช่นแผน Free ดั้งเดิมที่มี 2,000 คำค้น/เดือน) ก็ยังใช้ได้ แต่จะไม่รวมความสามารถใหม่อย่าง LLM Context หรือ rate limit ที่สูงขึ้น
- แต่ละแผนของ Brave มี **เครดิตฟรี \$5/เดือน** (ต่ออายุ) แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตนี้ครอบคลุมได้ 1,000 คำค้น/เดือน ตั้งค่าขีดจำกัดการใช้งานในแดชบอร์ดของ Brave เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด ดู [Brave API portal](https://brave.com/search/api/) สำหรับแผนปัจจุบัน
- แผน Search รวม endpoint ของ LLM Context และสิทธิ์ในการใช้ AI inference การจัดเก็บผลลัพธ์เพื่อฝึกหรือปรับแต่งโมเดลต้องใช้แผนที่มีสิทธิ์เก็บข้อมูลอย่างชัดเจน ดู [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service) ของ Brave
- โหมด `llm-context` จะคืนรายการแหล่งอ้างอิงที่มีการ grounding แทนรูปแบบ snippet ของ web-search ปกติ
- โหมด `llm-context` ไม่รองรับ `ui_lang`, `freshness`, `date_after` หรือ `date_before`
- `ui_lang` ต้องมี region subtag เช่น `en-US`
- ผลลัพธ์จะถูกแคชไว้ 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)

## ที่เกี่ยวข้อง

- [ภาพรวมของ Web Search](/th/tools/web) -- provider ทั้งหมดและการตรวจจับอัตโนมัติ
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบ neural พร้อมการดึงเนื้อหา
