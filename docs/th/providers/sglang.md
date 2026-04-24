---
read_when:
    - คุณต้องการรัน OpenClaw กับเซิร์ฟเวอร์ SGLang ในเครื่อง
    - คุณต้องการ endpoint `/v1` ที่เข้ากันได้กับ OpenAI พร้อมโมเดลของคุณเอง
summary: รัน OpenClaw กับ SGLang (เซิร์ฟเวอร์ self-hosted ที่เข้ากันได้กับ OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-24T09:29:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang สามารถให้บริการโมเดลโอเพนซอร์สผ่าน HTTP API แบบ **เข้ากันได้กับ OpenAI**
OpenClaw สามารถเชื่อมต่อกับ SGLang โดยใช้ API `openai-completions`

OpenClaw ยังสามารถ **ค้นหาโมเดลที่ใช้งานได้โดยอัตโนมัติ** จาก SGLang เมื่อคุณ
เลือกใช้งานด้วย `SGLANG_API_KEY` (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับ auth)
และคุณไม่ได้กำหนดรายการ `models.providers.sglang` แบบ explicit ไว้

OpenClaw ถือว่า `sglang` เป็น provider แบบ local ที่เข้ากันได้กับ OpenAI และรองรับ
การนับ usage แบบสตรีม ดังนั้นจำนวนโทเค็นสำหรับ status/context จึงอัปเดตได้จาก
การตอบกลับ `stream_options.include_usage`

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม SGLang">
    เปิด SGLang พร้อมเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI โดย base URL ของคุณควรเปิดเผย
    endpoint แบบ `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป SGLang
    มักรันที่:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="ตั้งค่า API key">
    ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้ตั้งค่า auth:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="รัน onboarding หรือตั้งค่าโมเดลโดยตรง">
    ```bash
    openclaw onboard
    ```

    หรือกำหนดค่าโมเดลด้วยตนเอง:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## การค้นพบโมเดล (implicit provider)

เมื่อมีการตั้งค่า `SGLANG_API_KEY` (หรือมี auth profile อยู่) และคุณ **ไม่ได้**
กำหนด `models.providers.sglang`, OpenClaw จะ query:

- `GET http://127.0.0.1:30000/v1/models`

แล้วแปลง ID ที่ส่งกลับมาเป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.sglang` แบบ explicit การค้นหาอัตโนมัติจะถูกข้าม และ
คุณต้องกำหนดโมเดลด้วยตนเอง
</Note>

## การกำหนดค่าแบบ explicit (กำหนดโมเดลเอง)

ใช้คอนฟิกแบบ explicit เมื่อ:

- SGLang รันอยู่บนโฮสต์/พอร์ตอื่น
- คุณต้องการปักหมุดค่า `contextWindow`/`maxTokens`
- เซิร์ฟเวอร์ของคุณต้องใช้ API key จริง (หรือคุณต้องการควบคุม header)

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมแบบ proxy">
    SGLang ถูกมองเป็นแบ็กเอนด์ `/v1` แบบ proxy ที่เข้ากันได้กับ OpenAI ไม่ใช่
    endpoint OpenAI แบบเนทีฟ

    | พฤติกรรม | SGLang |
    |----------|--------|
    | การจัดรูปคำขอเฉพาะ OpenAI | ไม่ถูกนำมาใช้ |
    | `service_tier`, Responses `store`, prompt-cache hint | ไม่ถูกส่ง |
    | การจัดรูป payload สำหรับ reasoning-compat | ไม่ถูกนำมาใช้ |
    | header attribution ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) | จะไม่ถูก inject บน base URL ของ SGLang แบบกำหนดเอง |

  </Accordion>

  <Accordion title="การแก้ปัญหา">
    **เข้าถึงเซิร์ฟเวอร์ไม่ได้**

    ตรวจสอบว่าเซิร์ฟเวอร์กำลังทำงานและตอบสนองอยู่:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **ข้อผิดพลาดด้าน auth**

    หากคำขอล้มเหลวด้วยข้อผิดพลาดด้าน auth ให้ตั้งค่า `SGLANG_API_KEY` จริงที่ตรงกับ
    การกำหนดค่าของเซิร์ฟเวอร์ของคุณ หรือกำหนดค่า provider แบบ explicit ภายใต้
    `models.providers.sglang`

    <Tip>
    หากคุณรัน SGLang โดยไม่ใช้การยืนยันตัวตน ค่าใด ๆ ที่ไม่ว่างสำหรับ
    `SGLANG_API_KEY` ก็เพียงพอแล้วสำหรับการ opt in ใช้ model discovery
    </Tip>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema ของคอนฟิกแบบเต็ม รวมถึงรายการ provider
  </Card>
</CardGroup>
