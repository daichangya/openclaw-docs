---
read_when:
    - คุณต้องการใช้ Perplexity Search สำหรับการค้นหาเว็บ
    - คุณต้องตั้งค่า `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY` ไว้
summary: API การค้นหา Perplexity และความเข้ากันได้ของ Sonar/OpenRouter สำหรับ `web_search`
title: การค้นหา Perplexity
x-i18n:
    generated_at: "2026-04-24T09:37:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# API การค้นหา Perplexity

OpenClaw รองรับ API การค้นหา Perplexity เป็น provider สำหรับ `web_search`
โดยจะส่งคืนผลลัพธ์แบบมีโครงสร้างพร้อมฟิลด์ `title`, `url` และ `snippet`

เพื่อความเข้ากันได้ OpenClaw ยังรองรับการตั้งค่า Perplexity Sonar/OpenRouter แบบเดิมด้วย
หากคุณใช้ `OPENROUTER_API_KEY`, คีย์ `sk-or-...` ใน `plugins.entries.perplexity.config.webSearch.apiKey` หรือกำหนด `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` provider จะสลับไปใช้เส้นทาง chat-completions และส่งคืนคำตอบที่สังเคราะห์โดย AI พร้อมการอ้างอิง แทนผลลัพธ์แบบมีโครงสร้างของ Search API

## การขอรับ Perplexity API key

1. สร้างบัญชี Perplexity ที่ [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. สร้าง API key ในแดชบอร์ด
3. เก็บคีย์ไว้ใน config หรือตั้งค่า `PERPLEXITY_API_KEY` ใน environment ของ Gateway

## ความเข้ากันได้กับ OpenRouter

หากคุณเคยใช้ OpenRouter สำหรับ Perplexity Sonar อยู่แล้ว ให้คง `provider: "perplexity"` ไว้และตั้งค่า `OPENROUTER_API_KEY` ใน environment ของ Gateway หรือเก็บคีย์ `sk-or-...` ไว้ใน `plugins.entries.perplexity.config.webSearch.apiKey`

ตัวควบคุมความเข้ากันได้แบบเลือกได้:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## ตัวอย่าง config

### Perplexity Search API แบบ native

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

## ตำแหน่งที่ตั้งค่าคีย์

**ผ่าน config:** รัน `openclaw configure --section web` โดยจะเก็บคีย์ไว้ใน
`~/.openclaw/openclaw.json` ภายใต้ `plugins.entries.perplexity.config.webSearch.apiKey`
ฟิลด์นี้ยังรองรับอ็อบเจ็กต์ SecretRef ด้วย

**ผ่าน environment:** ตั้งค่า `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY`
ใน environment ของโปรเซส Gateway สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน
`~/.openclaw/.env` (หรือ environment ของ service ของคุณ) ดู [Env vars](/th/help/faq#env-vars-and-env-loading)

หากตั้งค่า `provider: "perplexity"` ไว้ และ SecretRef ของคีย์ Perplexity ไม่สามารถ resolve ได้โดยไม่มี env fallback การเริ่มต้น/โหลดใหม่จะล้มเหลวทันที

## พารามิเตอร์ของเครื่องมือ

พารามิเตอร์เหล่านี้ใช้กับเส้นทาง API การค้นหา Perplexity แบบ native

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number" default="5">
จำนวนผลลัพธ์ที่จะส่งคืน (1–10)
</ParamField>

<ParamField path="country" type="string">
รหัสประเทศ ISO แบบ 2 ตัวอักษร (เช่น `US`, `DE`)
</ParamField>

<ParamField path="language" type="string">
รหัสภาษา ISO 639-1 (เช่น `en`, `de`, `fr`)
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

<ParamField path="domain_filter" type="string[]">
อาร์เรย์ allowlist/denylist ของโดเมน (สูงสุด 20)
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
งบประมาณเนื้อหารวม (สูงสุด 1000000)
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
ขีดจำกัดโทเค็นต่อหน้า
</ParamField>

สำหรับเส้นทางความเข้ากันได้แบบเดิมของ Sonar/OpenRouter:

- รองรับ `query`, `count` และ `freshness`
- `count` ใช้เพื่อความเข้ากันได้เท่านั้นในเส้นทางนั้น; การตอบกลับยังคงเป็นคำตอบที่สังเคราะห์ขึ้นหนึ่งรายการ
  พร้อมการอ้างอิง ไม่ใช่รายการผลลัพธ์ N รายการ
- ตัวกรองที่มีเฉพาะใน Search API เช่น `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` และ `max_tokens_per_page`
  จะส่งคืนข้อผิดพลาดแบบชัดเจน

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

// การกรองโดเมน (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// การกรองโดเมน (denylist - ใส่คำนำหน้าเป็น -)
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

- สูงสุด 20 โดเมนต่อหนึ่งตัวกรอง
- ไม่สามารถผสม allowlist และ denylist ในคำขอเดียวกันได้
- ใช้คำนำหน้า `-` สำหรับรายการ denylist (เช่น `["-reddit.com"]`)

## หมายเหตุ

- API การค้นหา Perplexity ส่งคืนผลลัพธ์การค้นหาเว็บแบบมีโครงสร้าง (`title`, `url`, `snippet`)
- OpenRouter หรือการกำหนด `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` อย่างชัดเจน จะสลับ Perplexity กลับไปใช้ Sonar chat completions เพื่อความเข้ากันได้
- ความเข้ากันได้แบบ Sonar/OpenRouter จะส่งคืนคำตอบที่สังเคราะห์ขึ้นหนึ่งรายการพร้อมการอ้างอิง ไม่ใช่แถวผลลัพธ์แบบมีโครงสร้าง
- ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)

## ที่เกี่ยวข้อง

- [Web Search overview](/th/tools/web) -- provider ทั้งหมดและการตรวจจับอัตโนมัติ
- [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) -- เอกสารอย่างเป็นทางการของ Perplexity
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมตัวกรองประเทศ/ภาษา
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบ neural พร้อมการดึงเนื้อหา
