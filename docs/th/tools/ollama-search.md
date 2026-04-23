---
read_when:
    - คุณต้องการใช้ Ollama สำหรับ `web_search`
    - คุณต้องการผู้ให้บริการ `web_search` แบบไม่ใช้คีย์
    - คุณต้องการคำแนะนำในการตั้งค่า Ollama Web Search
summary: Ollama Web Search ผ่านโฮสต์ Ollama ที่คุณกำหนดค่าไว้
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-23T06:02:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Ollama Web Search

OpenClaw รองรับ **Ollama Web Search** ในฐานะผู้ให้บริการ `web_search` แบบ bundled
มันใช้ experimental web-search API ของ Ollama และส่งคืนผลลัพธ์แบบมีโครงสร้าง
พร้อม titles, URLs และ snippets

ต่างจากผู้ให้บริการโมเดล Ollama การตั้งค่านี้โดยค่าเริ่มต้นไม่ต้องใช้ API key
แต่จำเป็นต้องมี:

- โฮสต์ Ollama ที่ OpenClaw เข้าถึงได้
- `ollama signin`

## การตั้งค่า

<Steps>
  <Step title="เริ่ม Ollama">
    ตรวจสอบให้แน่ใจว่าได้ติดตั้ง Ollama และกำลังทำงานอยู่
  </Step>
  <Step title="ลงชื่อเข้าใช้">
    รัน:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="เลือก Ollama Web Search">
    รัน:

    ```bash
    openclaw configure --section web
    ```

    จากนั้นเลือก **Ollama Web Search** เป็นผู้ให้บริการ

  </Step>
</Steps>

หากคุณใช้ Ollama สำหรับโมเดลอยู่แล้ว Ollama Web Search จะใช้โฮสต์
ที่กำหนดค่าไว้เดียวกันนั้นซ้ำ

## การกำหนดค่า

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

การ override โฮสต์ Ollama แบบเลือกได้:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

หากไม่ได้ตั้ง Ollama base URL แบบ explicit ไว้ OpenClaw จะใช้ `http://127.0.0.1:11434`

หากโฮสต์ Ollama ของคุณคาดหวัง bearer auth, OpenClaw จะใช้
`models.providers.ollama.apiKey` (หรือ provider auth แบบอิง env ที่ตรงกัน)
ซ้ำสำหรับคำขอ web-search ด้วย

## หมายเหตุ

- ผู้ให้บริการนี้ไม่ต้องใช้ฟิลด์ API key เฉพาะสำหรับ web-search
- หากโฮสต์ Ollama มีการป้องกันด้วย auth, OpenClaw จะใช้
  API key ของผู้ให้บริการ Ollama แบบปกติซ้ำเมื่อมี
- OpenClaw จะเตือนระหว่างการตั้งค่าหาก Ollama เข้าถึงไม่ได้หรือยังไม่ได้ลงชื่อเข้าใช้ แต่
  จะไม่บล็อกการเลือก
- Runtime auto-detect สามารถ fallback ไปยัง Ollama Web Search ได้เมื่อไม่มีผู้ให้บริการ
  ที่ใช้ข้อมูลรับรองและมีลำดับความสำคัญสูงกว่าถูกกำหนดค่าไว้
- ผู้ให้บริการนี้ใช้ endpoint `/api/experimental/web_search`
  แบบทดลองของ Ollama

## ที่เกี่ยวข้อง

- [Web Search overview](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Ollama](/th/providers/ollama) -- การตั้งค่าโมเดล Ollama และโหมด cloud/local
