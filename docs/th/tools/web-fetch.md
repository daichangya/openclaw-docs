---
read_when:
    - คุณต้องการดึง URL และสกัดเนื้อหาที่อ่านได้
    - คุณต้องการกำหนดค่า `web_fetch` หรือ Firecrawl fallback ของมัน
    - คุณต้องการทำความเข้าใจข้อจำกัดและการแคชของ `web_fetch`
sidebarTitle: Web Fetch
summary: เครื่องมือ `web_fetch` -- HTTP fetch พร้อมการสกัดเนื้อหาที่อ่านได้
title: Web fetch
x-i18n:
    generated_at: "2026-04-24T09:39:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

เครื่องมือ `web_fetch` ทำ HTTP GET แบบปกติและสกัดเนื้อหาที่อ่านได้
(HTML เป็น markdown หรือข้อความ) โดย **ไม่** รัน JavaScript

สำหรับเว็บไซต์ที่พึ่งพา JS มากหรือหน้าที่ป้องกันด้วยการล็อกอิน ให้ใช้
[Web Browser](/th/tools/browser) แทน

## เริ่มต้นอย่างรวดเร็ว

`web_fetch` **เปิดใช้งานโดยค่าเริ่มต้น** -- ไม่ต้องกำหนดค่าใดๆ เอเจนต์สามารถ
เรียกใช้ได้ทันที:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="url" type="string" required>
URL ที่จะดึง รองรับเฉพาะ `http(s)`
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
รูปแบบเอาต์พุตหลังการสกัดเนื้อหาหลัก
</ParamField>

<ParamField path="maxChars" type="number">
ตัดเอาต์พุตให้เหลือจำนวนอักขระเท่านี้
</ParamField>

## วิธีการทำงาน

<Steps>
  <Step title="ดึงข้อมูล">
    ส่ง HTTP GET พร้อม User-Agent แบบคล้าย Chrome และส่วนหัว `Accept-Language`
    บล็อก hostname แบบ private/internal และตรวจสอบ redirects ซ้ำอีกครั้ง
  </Step>
  <Step title="สกัด">
    รัน Readability (การสกัดเนื้อหาหลัก) กับ HTML response
  </Step>
  <Step title="Fallback (ไม่บังคับ)">
    หาก Readability ล้มเหลวและมีการกำหนดค่า Firecrawl ไว้ จะลองใหม่ผ่าน
    Firecrawl API พร้อมโหมดหลบเลี่ยงบอต
  </Step>
  <Step title="แคช">
    ผลลัพธ์จะถูกแคชไว้ 15 นาที (กำหนดค่าได้) เพื่อลดการดึง
    URL เดิมซ้ำ
  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // ค่าเริ่มต้น: true
        provider: "firecrawl", // ไม่บังคับ; ละไว้เพื่อให้ตรวจจับอัตโนมัติ
        maxChars: 50000, // จำนวนอักขระสูงสุดของเอาต์พุต
        maxCharsCap: 50000, // เพดานสูงสุดแบบบังคับสำหรับพารามิเตอร์ maxChars
        maxResponseBytes: 2000000, // ขนาดดาวน์โหลดสูงสุดก่อนถูกตัดทอน
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // ใช้การสกัดด้วย Readability
        userAgent: "Mozilla/5.0 ...", // override User-Agent
      },
    },
  },
}
```

## Firecrawl fallback

หากการสกัดด้วย Readability ล้มเหลว `web_fetch` สามารถ fallback ไปใช้
[Firecrawl](/th/tools/firecrawl) เพื่อหลบเลี่ยงบอตและสกัดข้อมูลได้ดีขึ้น:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // ไม่บังคับ; ละไว้เพื่อให้ตรวจจับอัตโนมัติจากข้อมูลรับรองที่มีอยู่
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // ไม่บังคับหากมีการตั้ง FIRECRAWL_API_KEY ไว้
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // ระยะเวลาแคช (1 วัน)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` รองรับอ็อบเจ็กต์ SecretRef
config แบบเดิม `tools.web.fetch.firecrawl.*` จะถูกย้ายให้อัตโนมัติโดย `openclaw doctor --fix`

<Note>
  หากเปิดใช้ Firecrawl และ SecretRef ของมันยัง resolve ไม่ได้โดยไม่มี
  env fallback ของ `FIRECRAWL_API_KEY` การเริ่มต้น gateway จะล้มเหลวทันที
</Note>

<Note>
  การ override `baseUrl` ของ Firecrawl ถูกจำกัดอย่างเข้มงวด: ต้องใช้ `https://` และ
  โฮสต์ Firecrawl อย่างเป็นทางการ (`api.firecrawl.dev`) เท่านั้น
</Note>

พฤติกรรมของ runtime ปัจจุบัน:

- `tools.web.fetch.provider` ใช้เลือกผู้ให้บริการ fallback ของการดึงอย่างชัดเจน
- หากละ `provider` ไว้ OpenClaw จะตรวจจับ web-fetch
  provider ตัวแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มีอยู่โดยอัตโนมัติ ปัจจุบันผู้ให้บริการแบบ bundled คือ Firecrawl
- หากปิดใช้ Readability `web_fetch` จะข้ามไปยัง
  provider fallback ที่เลือกไว้ทันที หากไม่มี provider พร้อมใช้งาน จะล้มเหลวแบบ fail closed

## ข้อจำกัดและความปลอดภัย

- `maxChars` จะถูกบีบให้อยู่ภายใต้ `tools.web.fetch.maxCharsCap`
- response body ถูกจำกัดด้วย `maxResponseBytes` ก่อนการ parse; response
  ที่ใหญ่เกินไปจะถูกตัดทอนพร้อมคำเตือน
- hostname แบบ private/internal จะถูกบล็อก
- redirects จะถูกตรวจสอบและจำกัดด้วย `maxRedirects`
- `web_fetch` เป็นแบบ best-effort -- บางเว็บไซต์ต้องใช้ [Web Browser](/th/tools/browser)

## โปรไฟล์เครื่องมือ

หากคุณใช้ tool profiles หรือ allowlists ให้เพิ่ม `web_fetch` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // หรือ: allow: ["group:web"]  (รวม web_fetch, web_search และ x_search)
  },
}
```

## ที่เกี่ยวข้อง

- [Web Search](/th/tools/web) -- ค้นหาเว็บด้วยผู้ให้บริการหลายราย
- [Web Browser](/th/tools/browser) -- ระบบอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับเว็บไซต์ที่พึ่งพา JS มาก
- [Firecrawl](/th/tools/firecrawl) -- เครื่องมือค้นหาและ scrape ของ Firecrawl
