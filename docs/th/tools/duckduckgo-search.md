---
read_when:
    - คุณต้องการผู้ให้บริการค้นหาเว็บที่ไม่ต้องใช้คีย์ API
    - คุณต้องการใช้ DuckDuckGo สำหรับ `web_search`
    - คุณต้องการตัวสำรองการค้นหาแบบไม่ต้องตั้งค่าเลย
summary: การค้นหาเว็บด้วย DuckDuckGo -- ผู้ให้บริการสำรองที่ไม่ต้องใช้คีย์ (experimental, อิง HTML)
title: การค้นหาด้วย DuckDuckGo
x-i18n:
    generated_at: "2026-04-24T09:35:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw รองรับ DuckDuckGo เป็นผู้ให้บริการ `web_search` แบบ **ไม่ต้องใช้คีย์** ไม่ต้องมีคีย์ API หรือบัญชีผู้ใช้

<Warning>
  DuckDuckGo เป็นการเชื่อมต่อแบบ **experimental และไม่เป็นทางการ** ที่ดึงผลลัพธ์
  จากหน้าค้นหาแบบไม่ใช้ JavaScript ของ DuckDuckGo — ไม่ใช่ API อย่างเป็นทางการ โปรดคาดไว้ว่า
  อาจใช้งานไม่ได้เป็นครั้งคราวจากหน้าท้าทายบอตหรือการเปลี่ยนแปลง HTML
</Warning>

## การตั้งค่า

ไม่ต้องใช้คีย์ API — เพียงแค่ตั้งค่า DuckDuckGo เป็นผู้ให้บริการของคุณ:

<Steps>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## การกำหนดค่า

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

การตั้งค่าระดับ Plugin แบบทางเลือกสำหรับภูมิภาคและ SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number" default="5">
จำนวนผลลัพธ์ที่จะส่งกลับ (1–10)
</ParamField>

<ParamField path="region" type="string">
รหัสภูมิภาคของ DuckDuckGo (เช่น `us-en`, `uk-en`, `de-de`)
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
ระดับ SafeSearch
</ParamField>

ภูมิภาคและ SafeSearch สามารถตั้งค่าได้ใน config ของ Plugin เช่นกัน (ดูด้านบน) —
พารามิเตอร์ของเครื่องมือจะมีลำดับความสำคัญเหนือค่าคอนฟิกในแต่ละคำค้น

## หมายเหตุ

- **ไม่ต้องใช้คีย์ API** — ใช้งานได้ทันทีโดยไม่ต้องตั้งค่า
- **experimental** — รวบรวมผลลัพธ์จากหน้าค้นหา HTML แบบไม่ใช้ JavaScript
  ของ DuckDuckGo ไม่ใช่ API หรือ SDK อย่างเป็นทางการ
- **ความเสี่ยงจาก bot-challenge** — DuckDuckGo อาจแสดง CAPTCHA หรือบล็อกคำขอ
  เมื่อมีการใช้งานหนักหรือใช้งานแบบอัตโนมัติ
- **การแยกวิเคราะห์ HTML** — ผลลัพธ์ขึ้นอยู่กับโครงสร้างของหน้าเว็บ ซึ่งอาจเปลี่ยนแปลงได้โดย
  ไม่มีการแจ้งล่วงหน้า
- **ลำดับการตรวจจับอัตโนมัติ** — DuckDuckGo เป็นตัวสำรองแบบไม่ต้องใช้คีย์ตัวแรก
  (ลำดับ 100) ในการตรวจจับอัตโนมัติ ผู้ให้บริการที่ใช้ API และมีการตั้งค่าคีย์ไว้จะทำงาน
  ก่อน จากนั้นเป็น Ollama Web Search (ลำดับ 110) แล้วจึงเป็น SearXNG (ลำดับ 200)
- **SafeSearch มีค่าเริ่มต้นเป็น moderate** หากไม่ได้กำหนดค่าไว้

<Tip>
  สำหรับการใช้งานจริงใน production โปรดพิจารณา [Brave Search](/th/tools/brave-search) (มี
  free tier) หรือผู้ให้บริการที่รองรับ API รายอื่น
</Tip>

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อม free tier
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบ neural พร้อมการดึงเนื้อหา
