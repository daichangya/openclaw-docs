---
read_when:
    - คุณต้องการใช้ Brave Search สำหรับ web_search
    - คุณต้องมี `BRAVE_API_KEY` หรือรายละเอียดแพ็กเกจ
summary: การตั้งค่า Brave Search API สำหรับ web_search
title: Brave Search (เส้นทางเดิม)
x-i18n:
    generated_at: "2026-04-23T05:24:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw รองรับ Brave Search API เป็นผู้ให้บริการ `web_search`

## รับ API key

1. สร้างบัญชี Brave Search API ที่ [https://brave.com/search/api/](https://brave.com/search/api/)
2. ในแดชบอร์ด ให้เลือกแพ็กเกจ **Search** และสร้าง API key
3. จัดเก็บคีย์ไว้ในการตั้งค่า หรือกำหนด `BRAVE_API_KEY` ในสภาพแวดล้อมของ Gateway

## ตัวอย่างการตั้งค่า

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

การตั้งค่าการค้นหา Brave ที่เฉพาะเจาะจงกับผู้ให้บริการตอนนี้อยู่ภายใต้ `plugins.entries.brave.config.webSearch.*`
`tools.web.search.apiKey` แบบเดิมยังคงโหลดได้ผ่าน compatibility shim แต่ไม่ใช่เส้นทางการตั้งค่ามาตรฐานอีกต่อไป

`webSearch.mode` ควบคุมการส่งข้อมูลของ Brave:

- `web` (ค่าเริ่มต้น): การค้นหาเว็บ Brave ปกติพร้อมชื่อเรื่อง URL และข้อความสรุป
- `llm-context`: Brave LLM Context API พร้อมกลุ่มข้อความที่แยกมาไว้ล่วงหน้าและแหล่งที่มาเพื่อใช้เป็นหลักอ้างอิง

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์ | คำอธิบาย |
| ------------- | ------------------------------------------------------------------- |
| `query`       | คำค้นหา (จำเป็น) |
| `count`       | จำนวนผลลัพธ์ที่จะส่งกลับ (1-10, ค่าเริ่มต้น: 5) |
| `country`     | รหัสประเทศ ISO 2 ตัวอักษร (เช่น "US", "DE") |
| `language`    | รหัสภาษา ISO 639-1 สำหรับผลการค้นหา (เช่น "en", "de", "fr") |
| `search_lang` | รหัสภาษาสำหรับการค้นหาของ Brave (เช่น `en`, `en-gb`, `zh-hans`) |
| `ui_lang`     | รหัสภาษา ISO สำหรับองค์ประกอบ UI |
| `freshness`   | ตัวกรองเวลา: `day` (24h), `week`, `month` หรือ `year` |
| `date_after`  | เฉพาะผลลัพธ์ที่เผยแพร่หลังวันที่นี้ (YYYY-MM-DD) |
| `date_before` | เฉพาะผลลัพธ์ที่เผยแพร่ก่อนวันที่นี้ (YYYY-MM-DD) |

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

- OpenClaw ใช้แพ็กเกจ Brave **Search** หากคุณมีการสมัครใช้งานแบบเดิมอยู่แล้ว (เช่น แพ็กเกจ Free แบบดั้งเดิมที่มี 2,000 คำขอต่อเดือน) ก็ยังใช้งานได้ แต่จะไม่รวมฟีเจอร์ใหม่กว่า เช่น LLM Context หรือขีดจำกัดอัตราที่สูงขึ้น
- แต่ละแพ็กเกจของ Brave มี**เครดิตฟรี \$5/เดือน** (ต่ออายุอัตโนมัติ) แพ็กเกจ Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตนี้จึงครอบคลุม 1,000 คำค้นหาต่อเดือน ตั้งค่าขีดจำกัดการใช้งานของคุณในแดชบอร์ด Brave เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด ดูแพ็กเกจปัจจุบันได้ที่ [Brave API portal](https://brave.com/search/api/)
- แพ็กเกจ Search มี endpoint ของ LLM Context และสิทธิ์สำหรับ AI inference การจัดเก็บผลลัพธ์เพื่อนำไปฝึกหรือปรับแต่งโมเดลต้องใช้แพ็กเกจที่มีสิทธิ์ในการจัดเก็บอย่างชัดเจน ดู [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service) ของ Brave
- โหมด `llm-context` จะส่งกลับรายการแหล่งข้อมูลอ้างอิงแทนรูปแบบข้อความสรุปของการค้นหาเว็บปกติ
- โหมด `llm-context` ไม่รองรับ `ui_lang`, `freshness`, `date_after` หรือ `date_before`
- `ui_lang` ต้องมีส่วนระบุภูมิภาค เช่น `en-US`
- ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาทีโดยค่าเริ่มต้น (ปรับแต่งได้ผ่าน `cacheTtlMinutes`)

ดู [เครื่องมือเว็บ](/th/tools/web) สำหรับการตั้งค่า `web_search` แบบเต็ม
