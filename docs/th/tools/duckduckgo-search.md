---
read_when:
    - คุณต้องการผู้ให้บริการ web search ที่ไม่ต้องใช้ API key
    - คุณต้องการใช้ DuckDuckGo สำหรับ `web_search`
    - คุณต้องการ search fallback แบบไม่ต้องกำหนดค่าเลย
summary: DuckDuckGo web search -- ผู้ให้บริการ fallback แบบไม่ใช้คีย์ (ทดลอง, อิง HTML)
title: การค้นหา DuckDuckGo
x-i18n:
    generated_at: "2026-04-23T06:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# การค้นหา DuckDuckGo

OpenClaw รองรับ DuckDuckGo เป็นผู้ให้บริการ `web_search` แบบ **ไม่ใช้คีย์** ไม่ต้องใช้ API
key หรือบัญชี

<Warning>
  DuckDuckGo เป็นการเชื่อมต่อแบบ **ทดลองและไม่เป็นทางการ** ที่ดึงผลลัพธ์
  จากหน้าค้นหาแบบ non-JavaScript ของ DuckDuckGo — ไม่ใช่ API อย่างเป็นทางการ ควรคาดหมาย
  ว่าจะมีการใช้งานเสียหายเป็นครั้งคราวจากหน้าท้าทายบอทหรือการเปลี่ยนแปลงของ HTML
</Warning>

## การตั้งค่า

ไม่ต้องใช้ API key — เพียงตั้ง DuckDuckGo เป็นผู้ให้บริการของคุณ:

<Steps>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    # เลือก "duckduckgo" เป็นผู้ให้บริการ
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

การตั้งค่าระดับ Plugin แบบเลือกได้สำหรับ region และ SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // รหัส region ของ DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" หรือ "off"
          },
        },
      },
    },
  },
}
```

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์  | คำอธิบาย                                                      |
| ------------ | ------------------------------------------------------------- |
| `query`      | คำค้นหา (จำเป็น)                                               |
| `count`      | จำนวนผลลัพธ์ที่จะส่งกลับ (1-10, ค่าเริ่มต้น: 5)               |
| `region`     | รหัส region ของ DuckDuckGo (เช่น `us-en`, `uk-en`, `de-de`)   |
| `safeSearch` | ระดับ SafeSearch: `strict`, `moderate` (ค่าเริ่มต้น) หรือ `off` |

สามารถตั้งค่า region และ SafeSearch ใน config ของ Plugin ได้เช่นกัน (ดูด้านบน) —
พารามิเตอร์ของเครื่องมือจะ override ค่าใน config เป็นรายคำค้น

## หมายเหตุ

- **ไม่ต้องใช้ API key** — ใช้งานได้ทันที ไม่ต้องกำหนดค่า
- **ทดลอง** — รวบรวมผลลัพธ์จากหน้าค้นหา HTML แบบ non-JavaScript ของ DuckDuckGo
  ไม่ใช่ API หรือ SDK อย่างเป็นทางการ
- **มีความเสี่ยงเรื่อง bot-challenge** — DuckDuckGo อาจแสดง CAPTCHA หรือบล็อกคำขอ
  เมื่อมีการใช้งานหนักหรือแบบอัตโนมัติ
- **การ parse HTML** — ผลลัพธ์ขึ้นอยู่กับโครงสร้างหน้า ซึ่งอาจเปลี่ยนได้โดย
  ไม่แจ้งล่วงหน้า
- **ลำดับการตรวจจับอัตโนมัติ** — DuckDuckGo เป็น key-free fallback ตัวแรก
  (ลำดับ 100) ในการตรวจจับอัตโนมัติ ผู้ให้บริการที่อิง API และมีคีย์กำหนดค่าไว้จะรัน
  ก่อน จากนั้นจึงเป็น Ollama Web Search (ลำดับ 110) แล้วค่อย SearXNG (ลำดับ 200)
- **SafeSearch มีค่าเริ่มต้นเป็น moderate** เมื่อไม่ได้กำหนดค่า

<Tip>
  สำหรับการใช้งานใน production ควรพิจารณา [Brave Search](/th/tools/brave-search) (มี free tier
  ให้ใช้) หรือผู้ให้บริการที่อิง API รายอื่น
</Tip>

## ที่เกี่ยวข้อง

- [Web Search overview](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อม free tier
- [Exa Search](/th/tools/exa-search) -- neural search พร้อม content extraction
