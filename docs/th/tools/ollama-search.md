---
read_when:
    - คุณต้องการใช้ Ollama สำหรับ `web_search`
    - คุณต้องการผู้ให้บริการ `web_search` ที่ไม่ต้องใช้คีย์
    - คุณต้องการคำแนะนำในการตั้งค่า Ollama Web Search
summary: Ollama Web Search ผ่านโฮสต์ Ollama ที่คุณกำหนดค่าไว้
title: การค้นหาเว็บของ Ollama
x-i18n:
    generated_at: "2026-04-24T09:37:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw รองรับ **Ollama Web Search** เป็นผู้ให้บริการ `web_search` แบบ bundled
โดยใช้ API การค้นหาเว็บแบบทดลองของ Ollama และส่งคืนผลลัพธ์แบบมีโครงสร้าง
พร้อมชื่อเรื่อง URL และ snippet

ต่างจากผู้ให้บริการโมเดล Ollama การตั้งค่านี้ไม่จำเป็นต้องใช้ API key
ตามค่าเริ่มต้น แต่จำเป็นต้องมี:

- โฮสต์ Ollama ที่ OpenClaw เข้าถึงได้
- `ollama signin`

## การตั้งค่า

<Steps>
  <Step title="เริ่ม Ollama">
    ตรวจสอบให้แน่ใจว่าติดตั้งและรัน Ollama อยู่
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
ที่กำหนดค่าเดียวกันซ้ำ

## Config

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

override โฮสต์ Ollama แบบไม่บังคับ:

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

หากไม่ได้ตั้งค่า base URL ของ Ollama แบบ explicit ไว้ OpenClaw จะใช้ `http://127.0.0.1:11434`

หากโฮสต์ Ollama ของคุณต้องใช้ bearer auth OpenClaw จะใช้
`models.providers.ollama.apiKey` ซ้ำ (หรือการยืนยันตัวตนของผู้ให้บริการแบบผูกกับ env ที่ตรงกัน)
สำหรับคำขอ web-search ด้วย

## หมายเหตุ

- ผู้ให้บริการนี้ไม่ต้องใช้ฟิลด์ API key เฉพาะสำหรับ web-search
- หากโฮสต์ Ollama มีการป้องกันด้วย auth OpenClaw จะใช้ API key
  ของผู้ให้บริการ Ollama ปกติซ้ำเมื่อมีอยู่
- OpenClaw จะแจ้งเตือนระหว่างการตั้งค่าหากไม่สามารถเข้าถึง Ollama ได้หรือยังไม่ได้ลงชื่อเข้าใช้ แต่
  จะไม่บล็อกการเลือก
- การตรวจจับอัตโนมัติของรันไทม์สามารถ fallback ไปที่ Ollama Web Search ได้เมื่อไม่มีผู้ให้บริการ
  ที่มี credential และมีลำดับความสำคัญสูงกว่าถูกกำหนดค่าไว้
- ผู้ให้บริการนี้ใช้ endpoint `/api/experimental/web_search`
  แบบทดลองของ Ollama

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Ollama](/th/providers/ollama) -- การตั้งค่าโมเดล Ollama และโหมด cloud/local
