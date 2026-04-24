---
read_when:
    - คุณต้องการผู้ให้บริการค้นหาเว็บแบบ self-hosted
    - คุณต้องการใช้ SearXNG สำหรับ `web_search`
    - คุณต้องการตัวเลือกการค้นหาที่เน้นความเป็นส่วนตัวหรือแบบ air-gapped
summary: SearXNG web search -- ผู้ให้บริการเมตาเสิร์ชแบบ self-hosted ที่ไม่ต้องใช้คีย์
title: การค้นหา SearXNG
x-i18n:
    generated_at: "2026-04-24T09:38:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw รองรับ [SearXNG](https://docs.searxng.org/) เป็นผู้ให้บริการ `web_search` แบบ **self-hosted และไม่ต้องใช้คีย์** SearXNG เป็นเมตาเสิร์ชเอนจินโอเพนซอร์สที่รวมผลลัพธ์จาก Google, Bing, DuckDuckGo และแหล่งอื่นๆ

ข้อดี:

- **ฟรีและไม่จำกัด** -- ไม่ต้องใช้คีย์ API หรือสมัครบริการค้นหาเชิงพาณิชย์
- **ความเป็นส่วนตัว / air-gap** -- คำค้นหาจะไม่ออกไปนอกเครือข่ายของคุณ
- **ใช้ได้ทุกที่** -- ไม่มีข้อจำกัดตามภูมิภาคแบบ API ค้นหาเชิงพาณิชย์

## การตั้งค่า

<Steps>
  <Step title="รันอินสแตนซ์ SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    หรือใช้งาน deployment ของ SearXNG ที่มีอยู่แล้วซึ่งคุณเข้าถึงได้ ดู
    [เอกสาร SearXNG](https://docs.searxng.org/) สำหรับการตั้งค่าในระดับ production

  </Step>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    # เลือก "searxng" เป็น provider
    ```

    หรือกำหนด env var แล้วปล่อยให้การตรวจจับอัตโนมัติหาให้:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

การตั้งค่าระดับ Plugin สำหรับอินสแตนซ์ SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

ฟิลด์ `baseUrl` ยังรองรับออบเจ็กต์ SecretRef ด้วย

กฎการขนส่งข้อมูล:

- `https://` ใช้ได้กับโฮสต์ SearXNG ทั้งแบบสาธารณะและแบบ private
- `http://` ยอมรับเฉพาะโฮสต์แบบ trusted private-network หรือ loopback
- โฮสต์ SearXNG แบบสาธารณะต้องใช้ `https://`

## ตัวแปรสภาพแวดล้อม

ตั้งค่า `SEARXNG_BASE_URL` เป็นทางเลือกแทน config:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

เมื่อมีการตั้งค่า `SEARXNG_BASE_URL` และไม่มีการกำหนด provider แบบชัดเจน การตรวจจับอัตโนมัติ
จะเลือก SearXNG ให้อัตโนมัติ (ที่ลำดับความสำคัญต่ำสุด -- ผู้ให้บริการที่ใช้ API พร้อมคีย์จะชนะก่อนเสมอ)

## เอกสารอ้างอิง config ของ Plugin

| ฟิลด์ | คำอธิบาย |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl` | URL ฐานของอินสแตนซ์ SearXNG ของคุณ (ต้องระบุ) |
| `categories` | หมวดหมู่คั่นด้วยจุลภาค เช่น `general`, `news` หรือ `science` |
| `language` | รหัสภาษาสำหรับผลลัพธ์ เช่น `en`, `de` หรือ `fr` |

## หมายเหตุ

- **JSON API** -- ใช้ endpoint `format=json` แบบเนทีฟของ SearXNG ไม่ใช่การสแครป HTML
- **ไม่ต้องใช้คีย์ API** -- ใช้งานได้กับอินสแตนซ์ SearXNG ใดก็ได้ทันที
- **การตรวจสอบ URL ฐาน** -- `baseUrl` ต้องเป็น URL `http://` หรือ `https://`
  ที่ถูกต้อง; โฮสต์สาธารณะต้องใช้ `https://`
- **ลำดับการตรวจจับอัตโนมัติ** -- SearXNG จะถูกตรวจสอบเป็นลำดับสุดท้าย (ลำดับ 200) ใน
  การตรวจจับอัตโนมัติ ผู้ให้บริการที่ใช้ API พร้อมคีย์ที่กำหนดไว้จะทำงานก่อน จากนั้นจึงเป็น
  DuckDuckGo (ลำดับ 100) แล้วจึง Ollama Web Search (ลำดับ 110)
- **self-hosted** -- คุณควบคุมอินสแตนซ์ คำค้นหา และเสิร์ชเอนจินต้นทางได้เอง
- **Categories** จะใช้ค่าเริ่มต้นเป็น `general` หากไม่ได้กำหนด

<Tip>
  เพื่อให้ SearXNG JSON API ใช้งานได้ โปรดตรวจสอบว่าอินสแตนซ์ SearXNG ของคุณเปิดใช้
  รูปแบบ `json` ใน `settings.yml` ภายใต้ `search.formats`
</Tip>

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [DuckDuckGo Search](/th/tools/duckduckgo-search) -- fallback แบบไม่ต้องใช้คีย์อีกตัวเลือกหนึ่ง
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อม free tier
