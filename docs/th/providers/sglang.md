---
read_when:
    - คุณต้องการรัน OpenClaw กับเซิร์ฟเวอร์ SGLang ภายในเครื่อง
    - คุณต้องการ endpoint `/v1` ที่เข้ากันได้กับ OpenAI พร้อมโมเดลของคุณเอง
summary: รัน OpenClaw ร่วมกับ SGLang (เซิร์ฟเวอร์แบบ self-hosted ที่เข้ากันได้กับ OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T05:53:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang สามารถให้บริการโมเดลโอเพนซอร์สผ่าน HTTP API แบบ **เข้ากันได้กับ OpenAI**
OpenClaw สามารถเชื่อมต่อกับ SGLang โดยใช้ API แบบ `openai-completions`

OpenClaw ยังสามารถ **ค้นหาโมเดลที่มีอยู่โดยอัตโนมัติ** จาก SGLang ได้ เมื่อคุณเลือกใช้
ผ่าน `SGLANG_API_KEY` (ใส่ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับ auth) และคุณไม่ได้กำหนดรายการ `models.providers.sglang` แบบ explicit

OpenClaw ถือว่า `sglang` เป็นผู้ให้บริการแบบเข้ากันได้กับ OpenAI ในเครื่อง ซึ่งรองรับ
การนับการใช้งานจากสตรีม ดังนั้นจำนวนโทเคนในสถานะ/บริบทจึงอัปเดตได้จากการตอบกลับของ `stream_options.include_usage`

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม SGLang">
    เปิด SGLang ด้วยเซิร์ฟเวอร์แบบเข้ากันได้กับ OpenAI โดย base URL ของคุณควรเปิดเผย
    endpoint แบบ `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป SGLang
    มักรันบน:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="ตั้งค่า API key">
    ใส่ค่าใดก็ได้ หากเซิร์ฟเวอร์ของคุณไม่ได้ตั้งค่า auth:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="รัน onboarding หรือตั้งค่าโมเดลโดยตรง">
    ```bash
    openclaw onboard
    ```

    หรือตั้งค่าโมเดลด้วยตนเอง:

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

## การค้นพบโมเดล (ผู้ให้บริการแบบ implicit)

เมื่อมีการตั้ง `SGLANG_API_KEY` (หรือมี auth profile อยู่) และคุณ **ไม่ได้**
กำหนด `models.providers.sglang`, OpenClaw จะ query:

- `GET http://127.0.0.1:30000/v1/models`

แล้วแปลง ID ที่ส่งกลับมาเป็นรายการโมเดล

<Note>
หากคุณตั้ง `models.providers.sglang` แบบ explicit การค้นหาอัตโนมัติจะถูกข้าม และ
คุณต้องกำหนดโมเดลเองด้วยตนเอง
</Note>

## การตั้งค่าแบบ explicit (กำหนดโมเดลเอง)

ให้ใช้คอนฟิกแบบ explicit เมื่อ:

- SGLang รันอยู่บนโฮสต์/พอร์ตอื่น
- คุณต้องการปักค่า `contextWindow`/`maxTokens`
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

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมแบบ proxy">
    SGLang ถูกมองว่าเป็นแบ็กเอนด์ `/v1` แบบเข้ากันได้กับ OpenAI ในลักษณะ proxy ไม่ใช่
    endpoint OpenAI แบบ native

    | พฤติกรรม | SGLang |
    |----------|--------|
    | การจัดรูปคำขอแบบเฉพาะ OpenAI | ไม่ใช้ |
    | `service_tier`, Responses `store`, hint ของ prompt-cache | ไม่ถูกส่ง |
    | การจัดรูป payload เพื่อความเข้ากันได้ของ reasoning | ไม่ใช้ |
    | header attribution แบบซ่อน (`originator`, `version`, `User-Agent`) | ไม่ถูก inject บน base URL ของ SGLang แบบกำหนดเอง |

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    **เข้าถึงเซิร์ฟเวอร์ไม่ได้**

    ตรวจสอบว่าเซิร์ฟเวอร์กำลังรันและตอบกลับได้:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **ข้อผิดพลาดด้าน auth**

    หากคำขอล้มเหลวด้วยข้อผิดพลาดด้าน auth ให้ตั้ง `SGLANG_API_KEY` จริงที่ตรงกับ
    คอนฟิกของเซิร์ฟเวอร์ของคุณ หรือตั้งค่าผู้ให้บริการแบบ explicit ภายใต้
    `models.providers.sglang`

    <Tip>
    หากคุณรัน SGLang โดยไม่มีการยืนยันตัวตน เพียงใส่ค่าที่ไม่ว่างให้กับ
    `SGLANG_API_KEY` ก็เพียงพอสำหรับการเลือกใช้การค้นหาโมเดล
    </Tip>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model ref และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงคอนฟิก" href="/th/gateway/configuration-reference" icon="gear">
    schema คอนฟิกแบบเต็ม รวมถึงรายการผู้ให้บริการ
  </Card>
</CardGroup>
