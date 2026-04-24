---
read_when:
    - คุณต้องการใช้ Brave Search สำหรับ `web_search`
    - คุณต้องการ `BRAVE_API_KEY` หรือรายละเอียดแผนใช้งาน
summary: การตั้งค่า Brave Search API สำหรับ `web_search`
title: การค้นหา Brave
x-i18n:
    generated_at: "2026-04-24T09:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw รองรับ Brave Search API เป็นผู้ให้บริการ `web_search`

## รับ API key

1. สร้างบัญชี Brave Search API ที่ [https://brave.com/search/api/](https://brave.com/search/api/)
2. ในแดชบอร์ด ให้เลือกแผน **Search** และสร้าง API key
3. จัดเก็บคีย์ไว้ใน config หรือตั้งค่า `BRAVE_API_KEY` ในสภาพแวดล้อมของ Gateway

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

ปัจจุบันการตั้งค่า Brave search แบบเฉพาะผู้ให้บริการจะอยู่ภายใต้ `plugins.entries.brave.config.webSearch.*`
ค่า `tools.web.search.apiKey` แบบเดิมยังคงโหลดได้ผ่าน compatibility shim แต่ไม่ใช่พาธ config หลักอีกต่อไป

`webSearch.mode` ควบคุมทรานสปอร์ตของ Brave:

- `web` (ค่าเริ่มต้น): Brave web search ปกติพร้อมชื่อเรื่อง, URL และ snippet
- `llm-context`: Brave LLM Context API พร้อม text chunks และแหล่งที่มาที่สกัดไว้ล่วงหน้าเพื่อใช้สำหรับ grounding

## พารามิเตอร์ของเครื่องมือ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number" default="5">
จำนวนผลลัพธ์ที่จะส่งกลับ (1–10)
</ParamField>

<ParamField path="country" type="string">
รหัสประเทศ ISO 2 ตัวอักษร (เช่น `US`, `DE`)
</ParamField>

<ParamField path="language" type="string">
รหัสภาษา ISO 639-1 สำหรับผลการค้นหา (เช่น `en`, `de`, `fr`)
</ParamField>

<ParamField path="search_lang" type="string">
รหัสภาษาการค้นหาของ Brave (เช่น `en`, `en-gb`, `zh-hans`)
</ParamField>

<ParamField path="ui_lang" type="string">
รหัสภาษา ISO สำหรับองค์ประกอบ UI
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
ตัวกรองเวลา — `day` คือ 24 ชั่วโมง
</ParamField>

<ParamField path="date_after" type="string">
เฉพาะผลลัพธ์ที่เผยแพร่หลังวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="date_before" type="string">
เฉพาะผลลัพธ์ที่เผยแพร่ก่อนวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

**ตัวอย่าง:**

```javascript
// การค้นหาแบบระบุประเทศและภาษา
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

// การค้นหาตามช่วงวันที่
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## หมายเหตุ

- OpenClaw ใช้แผน **Search** ของ Brave หากคุณมีการสมัครใช้งานแบบเดิม (เช่น Free plan ดั้งเดิมที่มี 2,000 คำขอต่อเดือน) ก็ยังใช้งานได้ แต่จะไม่รวมฟีเจอร์ใหม่กว่า เช่น LLM Context หรือขีดจำกัดอัตราที่สูงกว่า
- แต่ละแผนของ Brave มี **เครดิตฟรี \$5/เดือน** (ต่ออายุ) แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตนี้ครอบคลุม 1,000 คำขอต่อเดือน ตั้งค่าขีดจำกัดการใช้งานในแดชบอร์ด Brave เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด ดูแผนปัจจุบันได้ที่ [Brave API portal](https://brave.com/search/api/)
- แผน Search รวม endpoint ของ LLM Context และสิทธิ์การอนุมาน AI ไว้แล้ว การจัดเก็บผลลัพธ์เพื่อนำไปฝึกหรือปรับแต่งโมเดล ต้องใช้แผนที่มีสิทธิ์การจัดเก็บอย่างชัดเจน ดู [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service) ของ Brave
- โหมด `llm-context` จะคืนรายการแหล่งที่มาที่มี grounding แทนรูปแบบ snippet ของ web search ปกติ
- โหมด `llm-context` ไม่รองรับ `ui_lang`, `freshness`, `date_after` หรือ `date_before`
- `ui_lang` ต้องมี region subtag เช่น `en-US`
- ผลลัพธ์จะถูกแคชไว้ 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบ neural พร้อมการสกัดเนื้อหา
