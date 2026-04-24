---
read_when:
    - คุณต้องการใช้ Perplexity Search สำหรับการค้นหาเว็บ
    - คุณต้องตั้งค่า `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY`
summary: Perplexity Search API และความเข้ากันได้ของ Sonar/OpenRouter สำหรับ `web_search`
title: การค้นหา Perplexity (เส้นทางแบบ legacy)
x-i18n:
    generated_at: "2026-04-24T09:20:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# Perplexity Search API

OpenClaw รองรับ Perplexity Search API เป็น provider ของ `web_search`
มันส่งคืนผลลัพธ์แบบมีโครงสร้างพร้อมฟิลด์ `title`, `url` และ `snippet`

เพื่อความเข้ากันได้ OpenClaw ยังรองรับการตั้งค่า Perplexity Sonar/OpenRouter แบบ legacy ด้วย
หากคุณใช้ `OPENROUTER_API_KEY`, ใช้คีย์ `sk-or-...` ใน `plugins.entries.perplexity.config.webSearch.apiKey` หรือกำหนด `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, provider จะสลับไปใช้เส้นทาง chat-completions และส่งคืนคำตอบแบบสังเคราะห์โดย AI พร้อม citations แทนผลลัพธ์แบบมีโครงสร้างจาก Search API

## การขอ Perplexity API key

1. สร้างบัญชี Perplexity ที่ [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. สร้าง API key ในแดชบอร์ด
3. เก็บคีย์ไว้ใน config หรือตั้งค่า `PERPLEXITY_API_KEY` ใน environment ของ Gateway

## ความเข้ากันได้กับ OpenRouter

หากคุณใช้ OpenRouter สำหรับ Perplexity Sonar อยู่แล้ว ให้คง `provider: "perplexity"` ไว้และตั้งค่า `OPENROUTER_API_KEY` ใน environment ของ Gateway หรือเก็บคีย์ `sk-or-...` ไว้ใน `plugins.entries.perplexity.config.webSearch.apiKey`

ตัวควบคุมความเข้ากันได้แบบไม่บังคับ:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## ตัวอย่าง config

### Native Perplexity Search API

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

### OpenRouter / ความเข้ากันได้กับ Sonar

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

## จะตั้งค่าคีย์ไว้ที่ไหน

**ผ่าน config:** รัน `openclaw configure --section web` มันจะเก็บคีย์ไว้ใน
`~/.openclaw/openclaw.json` ภายใต้ `plugins.entries.perplexity.config.webSearch.apiKey`
ฟิลด์นี้ยังรองรับออบเจ็กต์ SecretRef ด้วย

**ผ่าน environment:** ตั้งค่า `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY`
ใน environment ของ process ของ Gateway สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน
`~/.openclaw/.env` (หรือ environment ของ service ของคุณ) ดู [Env vars](/th/help/faq#env-vars-and-env-loading)

หากมีการกำหนดค่า `provider: "perplexity"` ไว้ และ SecretRef ของคีย์ Perplexity resolve ไม่ได้โดยไม่มี env fallback การเริ่มต้นระบบ/การ reload จะล้มเหลวแบบ fail-fast

## พารามิเตอร์ของเครื่องมือ

พารามิเตอร์เหล่านี้ใช้กับเส้นทาง native Perplexity Search API

| พารามิเตอร์          | คำอธิบาย                                              |
| -------------------- | ----------------------------------------------------- |
| `query`              | คำค้นหา (จำเป็น)                                      |
| `count`              | จำนวนผลลัพธ์ที่จะส่งคืน (1-10, ค่าเริ่มต้น: 5)        |
| `country`            | รหัสประเทศ ISO 2 ตัวอักษร (เช่น `"US"`, `"DE"`)      |
| `language`           | รหัสภาษา ISO 639-1 (เช่น `"en"`, `"de"`, `"fr"`)      |
| `freshness`          | ตัวกรองเวลา: `day` (24h), `week`, `month` หรือ `year` |
| `date_after`         | เฉพาะผลลัพธ์ที่เผยแพร่หลังวันที่นี้ (YYYY-MM-DD)      |
| `date_before`        | เฉพาะผลลัพธ์ที่เผยแพร่ก่อนวันที่นี้ (YYYY-MM-DD)      |
| `domain_filter`      | อาร์เรย์ allowlist/denylist ของโดเมน (สูงสุด 20)      |
| `max_tokens`         | งบเนื้อหารวม (ค่าเริ่มต้น: 25000, สูงสุด: 1000000)   |
| `max_tokens_per_page`| ขีดจำกัด token ต่อหน้า (ค่าเริ่มต้น: 2048)           |

สำหรับเส้นทางความเข้ากันได้แบบ legacy Sonar/OpenRouter:

- รองรับ `query`, `count` และ `freshness`
- `count` มีไว้เพื่อความเข้ากันได้เท่านั้น; การตอบกลับยังคงเป็นคำตอบสังเคราะห์
  เดียวพร้อม citations ไม่ใช่รายการผลลัพธ์ N รายการ
- ตัวกรองที่มีเฉพาะใน Search API เช่น `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` และ `max_tokens_per_page`
  จะส่งคืนข้อผิดพลาดแบบชัดเจน

**ตัวอย่าง:**

```javascript
// การค้นหาแบบเจาะจงประเทศและภาษา
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

// การกรองโดเมน (denylist - เติม - ข้างหน้า)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// ดึงเนื้อหาเพิ่มขึ้น
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### กฎของ domain filter

- สูงสุด 20 โดเมนต่อ filter
- ไม่สามารถผสม allowlist และ denylist ในคำขอเดียวกันได้
- ใช้ prefix `-` สำหรับรายการ denylist (เช่น `["-reddit.com"]`)

## หมายเหตุ

- Perplexity Search API ส่งคืนผลลัพธ์การค้นหาเว็บแบบมีโครงสร้าง (`title`, `url`, `snippet`)
- OpenRouter หรือการกำหนด `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` แบบชัดเจน จะสลับ Perplexity กลับไปใช้ Sonar chat completions เพื่อความเข้ากันได้
- ความเข้ากันได้กับ Sonar/OpenRouter จะส่งคืนคำตอบสังเคราะห์หนึ่งรายการพร้อม citations ไม่ใช่แถวผลลัพธ์แบบมีโครงสร้าง
- ผลลัพธ์ถูกแคชไว้เป็นเวลา 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)

ดู [Web tools](/th/tools/web) สำหรับการกำหนดค่า `web_search` แบบเต็ม
ดู [เอกสาร Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) สำหรับรายละเอียดเพิ่มเติม

## ที่เกี่ยวข้อง

- [Perplexity search](/th/tools/perplexity-search)
- [Web search](/th/tools/web)
