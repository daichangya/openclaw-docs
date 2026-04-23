---
read_when:
    - คุณต้องการใช้ Perplexity Search สำหรับการค้นหาเว็บ
    - คุณต้องการตั้งค่า `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY`
summary: Perplexity Search API และความเข้ากันได้ของ Sonar/OpenRouter สำหรับ `web_search`
title: Perplexity Search (เส้นทางแบบเดิม)
x-i18n:
    generated_at: "2026-04-23T05:43:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba91e63e7412f3b6f889ee11f4a66563014932a1dc7be8593fe2262a4877b89b
    source_path: perplexity.md
    workflow: 15
---

# Perplexity Search API

OpenClaw รองรับ Perplexity Search API เป็นผู้ให้บริการ `web_search`
โดยจะส่งคืนผลลัพธ์แบบมีโครงสร้างที่มีฟิลด์ `title`, `url` และ `snippet`

เพื่อความเข้ากันได้ OpenClaw ยังรองรับการตั้งค่า Perplexity Sonar/OpenRouter แบบเดิมด้วย
หากคุณใช้ `OPENROUTER_API_KEY`, คีย์ `sk-or-...` ใน `plugins.entries.perplexity.config.webSearch.apiKey` หรือกำหนด `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, ผู้ให้บริการจะสลับไปใช้เส้นทาง chat-completions และส่งคืนคำตอบที่สังเคราะห์โดย AI พร้อม citation แทนผลลัพธ์แบบมีโครงสร้างของ Search API

## การขอรับ Perplexity API key

1. สร้างบัญชี Perplexity ที่ [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. สร้าง API key ในแดชบอร์ด
3. เก็บคีย์ไว้ใน config หรือตั้ง `PERPLEXITY_API_KEY` ใน environment ของ Gateway

## ความเข้ากันได้กับ OpenRouter

หากคุณใช้ OpenRouter สำหรับ Perplexity Sonar อยู่แล้ว ให้คง `provider: "perplexity"` ไว้ และตั้ง `OPENROUTER_API_KEY` ใน environment ของ Gateway หรือเก็บคีย์ `sk-or-...` ไว้ใน `plugins.entries.perplexity.config.webSearch.apiKey`

ตัวควบคุมความเข้ากันได้แบบไม่บังคับ:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## ตัวอย่าง config

### Perplexity Search API แบบเนทีฟ

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### ความเข้ากันได้กับ OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## ตำแหน่งที่จะตั้งค่าคีย์

**ผ่าน config:** รัน `openclaw configure --section web` ซึ่งจะเก็บคีย์ไว้ใน
`~/.openclaw/openclaw.json` ภายใต้ `plugins.entries.perplexity.config.webSearch.apiKey`
ฟิลด์นั้นยังรองรับออบเจ็กต์ SecretRef ด้วย

**ผ่าน environment:** ตั้ง `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY`
ใน environment ของโปรเซส Gateway สำหรับการติดตั้ง gateway ให้วางไว้ใน
`~/.openclaw/.env` (หรือ environment ของบริการของคุณ) ดู [ตัวแปร Env](/th/help/faq#env-vars-and-env-loading)

หากมีการกำหนด `provider: "perplexity"` และ SecretRef ของคีย์ Perplexity ไม่สามารถ resolve ได้โดยไม่มี env fallback การเริ่มต้น/รีโหลดจะล้มเหลวทันที

## พารามิเตอร์ของ tool

พารามิเตอร์เหล่านี้ใช้กับเส้นทาง Perplexity Search API แบบเนทีฟ

| พารามิเตอร์            | คำอธิบาย                                             |
| ---------------------- | ---------------------------------------------------- |
| `query`                | คำค้นหา (จำเป็น)                                     |
| `count`                | จำนวนผลลัพธ์ที่จะส่งคืน (1-10, ค่าเริ่มต้น: 5)       |
| `country`              | รหัสประเทศ ISO 2 ตัวอักษร (เช่น `"US"`, `"DE"`)     |
| `language`             | รหัสภาษา ISO 639-1 (เช่น `"en"`, `"de"`, `"fr"`)     |
| `freshness`            | ตัวกรองเวลา: `day` (24 ชม.), `week`, `month` หรือ `year` |
| `date_after`           | เฉพาะผลลัพธ์ที่เผยแพร่หลังวันที่นี้ (YYYY-MM-DD)     |
| `date_before`          | เฉพาะผลลัพธ์ที่เผยแพร่ก่อนวันที่นี้ (YYYY-MM-DD)     |
| `domain_filter`        | อาร์เรย์ allowlist/denylist ของโดเมน (สูงสุด 20)     |
| `max_tokens`           | งบประมาณเนื้อหารวม (ค่าเริ่มต้น: 25000, สูงสุด: 1000000) |
| `max_tokens_per_page`  | ขีดจำกัดโทเค็นต่อหน้า (ค่าเริ่มต้น: 2048)           |

สำหรับเส้นทางความเข้ากันได้แบบ Sonar/OpenRouter เดิม:

- รองรับ `query`, `count` และ `freshness`
- `count` มีไว้เพื่อความเข้ากันได้เท่านั้นในเส้นทางนั้น; การตอบกลับยังคงเป็นคำตอบสังเคราะห์หนึ่งรายการพร้อม citation ไม่ใช่รายการผลลัพธ์จำนวน N รายการ
- ตัวกรองที่ใช้ได้เฉพาะ Search API เช่น `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` และ `max_tokens_per_page`
  จะส่งคืนข้อผิดพลาดแบบ explicit

**ตัวอย่าง:**

```javascript
// การค้นหาเฉพาะประเทศและภาษา
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

// การกรองโดเมน (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// การกรองโดเมน (denylist - เติมคำนำหน้าเป็น -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// การดึงเนื้อหาเพิ่มขึ้น
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### กฎของ domain filter

- สูงสุด 20 โดเมนต่อหนึ่ง filter
- ห้ามผสม allowlist และ denylist ในคำขอเดียวกัน
- ใช้คำนำหน้า `-` สำหรับรายการ denylist (เช่น `["-reddit.com"]`)

## หมายเหตุ

- Perplexity Search API ส่งคืนผลลัพธ์การค้นหาเว็บแบบมีโครงสร้าง (`title`, `url`, `snippet`)
- OpenRouter หรือการกำหนด `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` อย่างชัดเจน จะสลับ Perplexity กลับไปใช้ Sonar chat completions เพื่อความเข้ากันได้
- ความเข้ากันได้กับ Sonar/OpenRouter จะส่งคืนคำตอบสังเคราะห์หนึ่งรายการพร้อม citation ไม่ใช่แถวผลลัพธ์แบบมีโครงสร้าง
- ผลลัพธ์ถูกแคชไว้ 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)

ดู [Web tools](/th/tools/web) สำหรับการกำหนดค่า `web_search` แบบเต็ม
ดู [เอกสาร Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) สำหรับรายละเอียดเพิ่มเติม
