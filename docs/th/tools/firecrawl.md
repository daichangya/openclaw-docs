---
read_when:
    - คุณต้องการการดึงข้อมูลเว็บที่รองรับโดย Firecrawl to=final dupe? fine.
    - คุณต้องการ Firecrawl API key to=final
    - คุณต้องการใช้ Firecrawl เป็นผู้ให้บริการ `web_search` to=final
    - คุณต้องการการดึงข้อมูลที่หลบหลีกการป้องกันบอตสำหรับ `web_fetch` to=final let's answer translated only.
summary: การค้นหา การขูดข้อมูล และ web_fetch fallback ของ Firecrawl
title: Firecrawl to=final
x-i18n:
    generated_at: "2026-04-23T06:00:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw สามารถใช้ **Firecrawl** ได้สามวิธี:

- เป็นผู้ให้บริการ `web_search`
- เป็น plugin tools แบบ explicit: `firecrawl_search` และ `firecrawl_scrape`
- เป็น fallback extractor สำหรับ `web_fetch`

มันเป็นบริการค้นหา/ดึงข้อมูลแบบโฮสต์ที่รองรับการหลบเลี่ยงการป้องกันบอตและการแคช
ซึ่งช่วยได้กับเว็บไซต์ที่ใช้ JS หนัก หรือหน้าที่บล็อกการดึงข้อมูลแบบ HTTP ธรรมดา

## รับ API key

1. สร้างบัญชี Firecrawl และสร้าง API key
2. เก็บไว้ใน config หรือตั้ง `FIRECRAWL_API_KEY` ใน environment ของ gateway

## กำหนดค่าการค้นหา Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

หมายเหตุ:

- การเลือก Firecrawl ระหว่าง onboarding หรือ `openclaw configure --section web` จะเปิดใช้ bundled Firecrawl plugin ให้อัตโนมัติ
- `web_search` กับ Firecrawl รองรับ `query` และ `count`
- สำหรับตัวควบคุมเฉพาะของ Firecrawl เช่น `sources`, `categories` หรือการ scrape ผลลัพธ์ ให้ใช้ `firecrawl_search`
- การ override `baseUrl` ต้องคงอยู่ที่ `https://api.firecrawl.dev` เท่านั้น
- `FIRECRAWL_BASE_URL` คือ env fallback แบบใช้ร่วมกันสำหรับ base URL ของ Firecrawl search และ scrape

## กำหนดค่า Firecrawl scrape + web_fetch fallback

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

หมายเหตุ:

- ความพยายาม fallback ของ Firecrawl จะทำงานเฉพาะเมื่อมี API key พร้อมใช้งาน (`plugins.entries.firecrawl.config.webFetch.apiKey` หรือ `FIRECRAWL_API_KEY`)
- `maxAgeMs` ควบคุมว่าใช้ผลลัพธ์ที่แคชไว้นานได้แค่ไหน (มิลลิวินาที) ค่าเริ่มต้นคือ 2 วัน
- config แบบเดิม `tools.web.fetch.firecrawl.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
- การ override scrape/base URL ของ Firecrawl ถูกจำกัดไว้ที่ `https://api.firecrawl.dev`

`firecrawl_scrape` ใช้การตั้งค่าและ env var ชุดเดียวกันจาก `plugins.entries.firecrawl.config.webFetch.*`

## Firecrawl plugin tools

### `firecrawl_search`

ใช้เมื่อคุณต้องการตัวควบคุมการค้นหาเฉพาะของ Firecrawl แทน `web_search` แบบทั่วไป

พารามิเตอร์หลัก:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

ใช้สำหรับหน้าที่ใช้ JS หนักหรือมีการป้องกันบอต ซึ่ง `web_fetch` แบบธรรมดาทำงานได้ไม่ดี

พารามิเตอร์หลัก:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / การหลบเลี่ยงการป้องกันบอต

Firecrawl เปิดเผยพารามิเตอร์ **proxy mode** สำหรับการหลบเลี่ยงการป้องกันบอต (`basic`, `stealth` หรือ `auto`)
OpenClaw ใช้ `proxy: "auto"` พร้อม `storeInCache: true` สำหรับคำขอ Firecrawl เสมอ
หากละเว้น proxy Firecrawl จะใช้ค่าเริ่มต้นเป็น `auto` `auto` จะลองใหม่ด้วย stealth proxy หากความพยายามแบบ basic ล้มเหลว ซึ่งอาจใช้เครดิตมากกว่า
การ scrape แบบ basic-only

## `web_fetch` ใช้ Firecrawl อย่างไร

ลำดับการดึงข้อมูลของ `web_fetch`:

1. Readability (ในเครื่อง)
2. Firecrawl (หากถูกเลือกหรือถูกตรวจจับอัตโนมัติว่าเป็น active web-fetch fallback)
3. การทำความสะอาด HTML พื้นฐาน (fallback สุดท้าย)

ตัวควบคุมการเลือกคือ `tools.web.fetch.provider` หากคุณละเว้นมัน OpenClaw
จะตรวจจับผู้ให้บริการ web-fetch ตัวแรกที่พร้อมใช้งานโดยอัตโนมัติจากข้อมูลรับรองที่มีอยู่
ปัจจุบันผู้ให้บริการแบบ bundled คือ Firecrawl

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Web Fetch](/th/tools/web-fetch) -- tool `web_fetch` พร้อม Firecrawl fallback
- [Tavily](/th/tools/tavily) -- tools สำหรับค้นหา + ดึงข้อมูล
