---
read_when:
    - คุณต้องการผู้ให้บริการ web search แบบ self-hosted
    - คุณต้องการใช้ SearXNG สำหรับ `web_search`
    - คุณต้องการตัวเลือกการค้นหาที่เน้นความเป็นส่วนตัวหรือใช้ในสภาพแวดล้อม air-gapped
summary: SearXNG web search -- ผู้ให้บริการ meta-search แบบ self-hosted และไม่ใช้คีย์
title: การค้นหา SearXNG
x-i18n:
    generated_at: "2026-04-23T06:03:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# การค้นหา SearXNG

OpenClaw รองรับ [SearXNG](https://docs.searxng.org/) ในฐานะผู้ให้บริการ `web_search` แบบ **self-hosted
และไม่ใช้คีย์** SearXNG คือ meta-search engine แบบโอเพนซอร์ส
ที่รวบรวมผลลัพธ์จาก Google, Bing, DuckDuckGo และแหล่งอื่นๆ

ข้อดี:

- **ฟรีและไม่จำกัด** -- ไม่ต้องใช้ API key หรือสมัครใช้งานเชิงพาณิชย์
- **ความเป็นส่วนตัว / air-gap** -- คำค้นจะไม่ออกจากเครือข่ายของคุณ
- **ใช้งานได้ทุกที่** -- ไม่มีข้อจำกัดด้านภูมิภาคแบบ search API เชิงพาณิชย์

## การตั้งค่า

<Steps>
  <Step title="รันอินสแตนซ์ SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    หรือใช้งาน SearXNG deployment ที่คุณเข้าถึงได้อยู่แล้ว ดู
    [เอกสาร SearXNG](https://docs.searxng.org/) สำหรับการตั้งค่า production

  </Step>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    # เลือก "searxng" เป็นผู้ให้บริการ
    ```

    หรือกำหนด env var แล้วปล่อยให้ auto-detection หาให้:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## การกำหนดค่า

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
            categories: "general,news", // ไม่บังคับ
            language: "en", // ไม่บังคับ
          },
        },
      },
    },
  },
}
```

ฟิลด์ `baseUrl` รองรับอ็อบเจ็กต์ SecretRef ด้วย

กฎของ transport:

- `https://` ใช้ได้กับโฮสต์ SearXNG ทั้งแบบ public และ private
- `http://` จะยอมรับเฉพาะกับโฮสต์ trusted private-network หรือ loopback
- โฮสต์ SearXNG แบบ public ต้องใช้ `https://`

## ตัวแปรสภาพแวดล้อม

ตั้ง `SEARXNG_BASE_URL` เป็นทางเลือกแทน config:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

เมื่อมีการตั้ง `SEARXNG_BASE_URL` และยังไม่ได้กำหนดผู้ให้บริการแบบ explicit, auto-detection
จะเลือก SearXNG โดยอัตโนมัติ (ที่ลำดับความสำคัญต่ำสุด -- ผู้ให้บริการที่อิง API และมี
คีย์จะชนะก่อนเสมอ)

## เอกสารอ้างอิง config ของ Plugin

| ฟิลด์        | คำอธิบาย                                                        |
| ------------ | ---------------------------------------------------------------- |
| `baseUrl`    | Base URL ของอินสแตนซ์ SearXNG ของคุณ (จำเป็น)                    |
| `categories` | หมวดหมู่แบบคั่นด้วยจุลภาค เช่น `general`, `news` หรือ `science` |
| `language`   | รหัสภาษาสำหรับผลลัพธ์ เช่น `en`, `de` หรือ `fr`                  |

## หมายเหตุ

- **JSON API** -- ใช้ endpoint `format=json` แบบเนทีฟของ SearXNG ไม่ใช่การ scrape HTML
- **ไม่ต้องใช้ API key** -- ใช้งานได้ทันทีด้วยอินสแตนซ์ SearXNG ใดก็ได้
- **การตรวจสอบ Base URL** -- `baseUrl` ต้องเป็น URL `http://` หรือ `https://`
  ที่ถูกต้อง; โฮสต์แบบ public ต้องใช้ `https://`
- **ลำดับการตรวจจับอัตโนมัติ** -- SearXNG จะถูกตรวจเป็นลำดับสุดท้าย (ลำดับ 200) ใน
  auto-detection ผู้ให้บริการที่อิง API และมีคีย์กำหนดค่าไว้จะทำงานก่อน จากนั้น
  DuckDuckGo (ลำดับ 100) แล้วจึง Ollama Web Search (ลำดับ 110)
- **self-hosted** -- คุณควบคุมอินสแตนซ์ คำค้น และ upstream search engines ได้เอง
- **Categories** มีค่าเริ่มต้นเป็น `general` เมื่อไม่ได้กำหนดค่า

<Tip>
  เพื่อให้ SearXNG JSON API ทำงานได้ โปรดตรวจสอบว่าอินสแตนซ์ SearXNG ของคุณเปิดใช้รูปแบบ `json`
  ไว้ใน `settings.yml` ภายใต้ `search.formats`
</Tip>

## ที่เกี่ยวข้อง

- [Web Search overview](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [DuckDuckGo Search](/th/tools/duckduckgo-search) -- key-free fallback อีกตัวหนึ่ง
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อม free tier
