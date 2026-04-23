---
read_when:
    - คุณต้องการดึง URL และสกัดเนื้อหาที่อ่านได้
    - คุณต้องตั้งค่า `web_fetch` หรือ fallback ของ Firecrawl สำหรับมัน
    - คุณต้องการทำความเข้าใจข้อจำกัดและการแคชของ `web_fetch`
sidebarTitle: Web Fetch
summary: เครื่องมือ `web_fetch` -- ดึงข้อมูล HTTP พร้อมการสกัดเนื้อหาให้อ่านได้
title: Web Fetch
x-i18n:
    generated_at: "2026-04-23T06:04:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Web Fetch

เครื่องมือ `web_fetch` จะทำ HTTP GET แบบธรรมดาและสกัดเนื้อหาที่อ่านได้
(จาก HTML เป็น markdown หรือ text) โดยมันจะ **ไม่** รัน JavaScript

สำหรับเว็บไซต์ที่พึ่งพา JS มากหรือหน้าที่ป้องกันด้วยการล็อกอิน ให้ใช้
[Web Browser](/th/tools/browser) แทน

## เริ่มต้นอย่างรวดเร็ว

`web_fetch` **เปิดใช้งานเป็นค่าเริ่มต้น** -- ไม่ต้องตั้งค่าเพิ่มเติม เอเจนต์สามารถ
เรียกใช้ได้ทันที:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์   | ชนิด      | คำอธิบาย                                      |
| ------------- | --------- | --------------------------------------------- |
| `url`         | `string`  | URL ที่ต้องการดึงข้อมูล (จำเป็น, รองรับเฉพาะ http/https) |
| `extractMode` | `string`  | `"markdown"` (ค่าเริ่มต้น) หรือ `"text"`     |
| `maxChars`    | `number`  | ตัดทอนเอาต์พุตให้เหลือตามจำนวนอักขระนี้       |

## วิธีการทำงาน

<Steps>
  <Step title="ดึงข้อมูล">
    ส่ง HTTP GET พร้อม User-Agent แบบคล้าย Chrome และส่วนหัว `Accept-Language`
    บล็อก hostnames แบบ private/internal และตรวจสอบ redirects ซ้ำ
  </Step>
  <Step title="สกัดเนื้อหา">
    รัน Readability (การสกัดเนื้อหาหลัก) บน HTML response
  </Step>
  <Step title="Fallback (ไม่บังคับ)">
    หาก Readability ล้มเหลวและมีการตั้งค่า Firecrawl อยู่ ระบบจะลองใหม่ผ่าน
    Firecrawl API ด้วยโหมดหลบเลี่ยงการบล็อกบอต
  </Step>
  <Step title="แคช">
    ผลลัพธ์จะถูกแคชไว้ 15 นาที (ตั้งค่าได้) เพื่อลดการดึงข้อมูลซ้ำ
    ของ URL เดิม
  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // ค่าเริ่มต้น: true
        provider: "firecrawl", // ไม่บังคับ; ละไว้เพื่อใช้ auto-detect
        maxChars: 50000, // จำนวนอักขระสูงสุดของเอาต์พุต
        maxCharsCap: 50000, // hard cap สำหรับพารามิเตอร์ maxChars
        maxResponseBytes: 2000000, // ขนาดดาวน์โหลดสูงสุดก่อนตัดทอน
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
[Firecrawl](/th/tools/firecrawl) เพื่อหลบเลี่ยงการบล็อกบอตและสกัดเนื้อหาได้ดีขึ้น:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // ไม่บังคับ; ละไว้เพื่อใช้ auto-detect จาก credentials ที่มี
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // ไม่บังคับ หากตั้ง FIRECRAWL_API_KEY ไว้แล้ว
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

`plugins.entries.firecrawl.config.webFetch.apiKey` รองรับวัตถุ SecretRef
config แบบเดิม `tools.web.fetch.firecrawl.*` จะถูก migrate อัตโนมัติโดย `openclaw doctor --fix`

<Note>
  หากเปิดใช้ Firecrawl และ SecretRef ของมันยัง resolve ไม่ได้โดยไม่มี
  env fallback `FIRECRAWL_API_KEY` การเริ่มต้น gateway จะล้มเหลวทันที
</Note>

<Note>
  การ override `baseUrl` ของ Firecrawl ถูกล็อกไว้เข้มงวด: ต้องใช้ `https://` และ
  host ทางการของ Firecrawl (`api.firecrawl.dev`) เท่านั้น
</Note>

พฤติกรรมของรันไทม์ในปัจจุบัน:

- `tools.web.fetch.provider` ใช้เลือก fetch fallback provider อย่างชัดเจน
- หากไม่ระบุ `provider` OpenClaw จะ auto-detect web-fetch
  provider ตัวแรกที่พร้อมใช้จาก credentials ที่มี ปัจจุบัน provider แบบ bundled คือ Firecrawl
- หากปิด Readability ไว้ `web_fetch` จะข้ามไปยัง
  provider fallback ที่เลือกไว้ทันที หากไม่มี provider พร้อมใช้ ระบบจะ fail closed

## ข้อจำกัดและความปลอดภัย

- `maxChars` จะถูก clamp ตาม `tools.web.fetch.maxCharsCap`
- response body จะถูกจำกัดที่ `maxResponseBytes` ก่อน parse; responses ที่ใหญ่เกิน
  จะถูกตัดทอนพร้อมคำเตือน
- hostnames แบบ private/internal จะถูกบล็อก
- redirects จะถูกตรวจสอบและจำกัดด้วย `maxRedirects`
- `web_fetch` เป็นแบบ best-effort -- บางเว็บไซต์จำเป็นต้องใช้ [Web Browser](/th/tools/browser)

## Tool profiles

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

- [Web Search](/th/tools/web) -- ค้นหาเว็บด้วย providers หลายตัว
- [Web Browser](/th/tools/browser) -- browser automation แบบเต็มสำหรับเว็บไซต์ที่พึ่งพา JS มาก
- [Firecrawl](/th/tools/firecrawl) -- เครื่องมือค้นหาและ scrape ของ Firecrawl
