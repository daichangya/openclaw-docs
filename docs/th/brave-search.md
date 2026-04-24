---
read_when:
    - คุณต้องการใช้ Brave Search สำหรับ `web_search`
    - คุณต้องมี `BRAVE_API_KEY` หรือรายละเอียดแผนใช้งาน
summary: การตั้งค่า Brave Search API สำหรับ `web_search`
title: Brave search (เส้นทางเดิม)
x-i18n:
    generated_at: "2026-04-24T08:57:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw รองรับ Brave Search API เป็นผู้ให้บริการ `web_search`

## รับคีย์ API

1. สร้างบัญชี Brave Search API ที่ [https://brave.com/search/api/](https://brave.com/search/api/)
2. ในแดชบอร์ด ให้เลือกแผน **Search** และสร้างคีย์ API
3. จัดเก็บคีย์ไว้ในการกำหนดค่า หรือตั้งค่า `BRAVE_API_KEY` ใน environment ของ Gateway

## ตัวอย่างการกำหนดค่า

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
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

การตั้งค่า Brave search ที่เฉพาะกับผู้ให้บริการตอนนี้อยู่ภายใต้ `plugins.entries.brave.config.webSearch.*`
`tools.web.search.apiKey` แบบเดิมยังคงโหลดผ่าน compatibility shim ได้ แต่ไม่ใช่เส้นทางการกำหนดค่าแบบ canonical อีกต่อไป

`webSearch.mode` ควบคุมการขนส่งของ Brave:

- `web` (ค่าเริ่มต้น): Brave web search แบบปกติพร้อมชื่อเรื่อง, URL และข้อความตัวอย่าง
- `llm-context`: Brave LLM Context API พร้อมชิ้นข้อความที่แยกไว้ล่วงหน้าและแหล่งที่มาสำหรับการอ้างอิงประกอบ

## พารามิเตอร์ของเครื่องมือ

| Parameter     | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `query`       | คำค้นหา (จำเป็น)                                                   |
| `count`       | จำนวนผลลัพธ์ที่จะส่งกลับ (1-10, ค่าเริ่มต้น: 5)                   |
| `country`     | รหัสประเทศ ISO 2 ตัวอักษร (เช่น `"US"`, `"DE"`)                   |
| `language`    | รหัสภาษา ISO 639-1 สำหรับผลการค้นหา (เช่น `"en"`, `"de"`, `"fr"`) |
| `search_lang` | รหัสภาษาการค้นหาของ Brave (เช่น `en`, `en-gb`, `zh-hans`)         |
| `ui_lang`     | รหัสภาษา ISO สำหรับองค์ประกอบ UI                                  |
| `freshness`   | ตัวกรองเวลา: `day` (24 ชม.), `week`, `month` หรือ `year`           |
| `date_after`  | เฉพาะผลลัพธ์ที่เผยแพร่หลังจากวันที่นี้ (YYYY-MM-DD)                |
| `date_before` | เฉพาะผลลัพธ์ที่เผยแพร่ก่อนวันที่นี้ (YYYY-MM-DD)                   |

**ตัวอย่าง:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## หมายเหตุ

- OpenClaw ใช้แผน Brave **Search** หากคุณมีการสมัครใช้งานแบบเดิมอยู่แล้ว (เช่น แผน Free รุ่นดั้งเดิมที่มี 2,000 คำขอต่อเดือน) ก็ยังคงใช้ได้ แต่จะไม่รวมความสามารถใหม่กว่า เช่น LLM Context หรืออัตราจำกัดที่สูงขึ้น
- แต่ละแผนของ Brave มี **เครดิตฟรี \$5/เดือน** (ต่ออายุอัตโนมัติ) แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตนี้จึงครอบคลุม 1,000 คำค้นหาต่อเดือน ตั้งค่าขีดจำกัดการใช้งานของคุณในแดชบอร์ด Brave เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด ดูแผนปัจจุบันได้ที่ [Brave API portal](https://brave.com/search/api/)
- แผน Search มีทั้งปลายทาง LLM Context และสิทธิ์การอนุมาน AI การจัดเก็บผลลัพธ์เพื่อนำไปฝึกหรือปรับแต่งโมเดลต้องใช้แผนที่มีสิทธิ์การจัดเก็บอย่างชัดเจน ดู Brave [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service)
- โหมด `llm-context` จะส่งกลับรายการแหล่งอ้างอิงที่มีการอ้างอิงประกอบ แทนรูปร่างข้อความตัวอย่างของการค้นหาเว็บแบบปกติ
- โหมด `llm-context` ไม่รองรับ `ui_lang`, `freshness`, `date_after` หรือ `date_before`
- `ui_lang` ต้องมีส่วนย่อย region เช่น `en-US`
- ผลลัพธ์จะถูกแคชไว้เป็นเวลา 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)

ดู [เครื่องมือเว็บ](/th/tools/web) สำหรับการกำหนดค่า `web_search` แบบเต็ม

## ที่เกี่ยวข้อง

- [Brave search](/th/tools/brave-search)
