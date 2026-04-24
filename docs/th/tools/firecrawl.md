---
read_when:
    - คุณต้องการการดึงข้อมูลเว็บที่ขับเคลื่อนด้วย Firecrawl
    - คุณต้องใช้คีย์ API ของ Firecrawl
    - คุณต้องการใช้ Firecrawl เป็นผู้ให้บริการ `web_search`
    - คุณต้องการการดึงข้อมูลแบบต้านการป้องกันบอตสำหรับ `web_fetch`
summary: การค้นหาและสแครปด้วย Firecrawl และการ fallback ไปใช้ `web_fetch`
title: Firecrawl
x-i18n:
    generated_at: "2026-04-24T09:36:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

OpenClaw สามารถใช้ **Firecrawl** ได้ 3 วิธี:

- เป็นผู้ให้บริการ `web_search`
- เป็นเครื่องมือ Plugin แบบระบุชัดเจน: `firecrawl_search` และ `firecrawl_scrape`
- เป็นตัวดึงข้อมูลสำรองสำหรับ `web_fetch`

นี่คือบริการค้นหา/ดึงข้อมูลแบบโฮสต์ที่รองรับการหลบเลี่ยงการป้องกันบอตและการแคช
ซึ่งช่วยกับเว็บไซต์ที่ใช้ JS หนักหรือหน้าที่บล็อกการ fetch แบบ HTTP ปกติ

## รับคีย์ API

1. สร้างบัญชี Firecrawl และสร้างคีย์ API
2. จัดเก็บไว้ใน config หรือตั้งค่า `FIRECRAWL_API_KEY` ในสภาพแวดล้อมของ Gateway

## กำหนดค่า Firecrawl search

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

- การเลือก Firecrawl ระหว่าง onboarding หรือ `openclaw configure --section web` จะเปิดใช้งาน Plugin Firecrawl ที่มาพร้อมกันโดยอัตโนมัติ
- `web_search` ที่ใช้ Firecrawl รองรับ `query` และ `count`
- หากต้องการตัวควบคุมเฉพาะของ Firecrawl เช่น `sources`, `categories` หรือการสแครปผลลัพธ์ ให้ใช้ `firecrawl_search`
- การ override `baseUrl` ต้องคงไว้ที่ `https://api.firecrawl.dev`
- `FIRECRAWL_BASE_URL` คือ env fallback ที่ใช้ร่วมกันสำหรับ base URL ของ Firecrawl search และ scrape

## กำหนดค่า Firecrawl scrape + การ fallback ของ `web_fetch`

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

- ความพยายาม fallback ของ Firecrawl จะทำงานเมื่อมีคีย์ API เท่านั้น (`plugins.entries.firecrawl.config.webFetch.apiKey` หรือ `FIRECRAWL_API_KEY`)
- `maxAgeMs` ควบคุมว่าอนุญาตให้ใช้ผลลัพธ์ที่แคชไว้นานแค่ไหน (มิลลิวินาที) ค่าเริ่มต้นคือ 2 วัน
- config แบบ legacy `tools.web.fetch.firecrawl.*` จะถูกย้ายให้อัตโนมัติโดย `openclaw doctor --fix`
- การ override scrape/base URL ของ Firecrawl ถูกจำกัดไว้ที่ `https://api.firecrawl.dev`

`firecrawl_scrape` ใช้การตั้งค่าและตัวแปรสภาพแวดล้อมเดียวกันจาก `plugins.entries.firecrawl.config.webFetch.*`

## เครื่องมือ Plugin ของ Firecrawl

### `firecrawl_search`

ใช้สิ่งนี้เมื่อคุณต้องการตัวควบคุมการค้นหาเฉพาะของ Firecrawl แทน `web_search` แบบทั่วไป

พารามิเตอร์หลัก:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

ใช้สิ่งนี้สำหรับหน้าที่ใช้ JS หนักหรือมีการป้องกันบอต ซึ่ง `web_fetch` แบบปกติทำได้ไม่ดี

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

Firecrawl เปิดให้ใช้พารามิเตอร์ **proxy mode** สำหรับการหลบเลี่ยงการป้องกันบอต (`basic`, `stealth` หรือ `auto`)
OpenClaw ใช้ `proxy: "auto"` ร่วมกับ `storeInCache: true` เสมอสำหรับคำขอ Firecrawl
หากไม่ระบุ proxy, Firecrawl จะใช้ค่าเริ่มต้นเป็น `auto` `auto` จะลองใหม่ด้วย stealth proxies หากความพยายามแบบ basic ล้มเหลว ซึ่งอาจใช้เครดิต
มากกว่าการสแครปแบบ basic อย่างเดียว

## วิธีที่ `web_fetch` ใช้ Firecrawl

ลำดับการดึงข้อมูลของ `web_fetch`:

1. Readability (ในเครื่อง)
2. Firecrawl (หากถูกเลือกหรือถูกตรวจจับอัตโนมัติว่าเป็น web-fetch fallback ที่ใช้งานอยู่)
3. การทำความสะอาด HTML พื้นฐาน (fallback สุดท้าย)

ตัวควบคุมการเลือกคือ `tools.web.fetch.provider` หากคุณไม่ระบุ OpenClaw
จะตรวจจับ web-fetch provider ตัวแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มีโดยอัตโนมัติ
ปัจจุบัน provider ที่มาพร้อมกันคือ Firecrawl

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Web Fetch](/th/tools/web-fetch) -- เครื่องมือ `web_fetch` พร้อม Firecrawl fallback
- [Tavily](/th/tools/tavily) -- เครื่องมือค้นหา + ดึงข้อมูล
