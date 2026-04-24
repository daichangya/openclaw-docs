---
read_when:
    - คุณต้องการรัน OpenClaw กับเซิร์ฟเวอร์ vLLM ในเครื่อง
    - คุณต้องการใช้ endpoint `/v1` ที่เข้ากันได้กับ OpenAI พร้อมโมเดลของคุณเอง
summary: รัน OpenClaw ด้วย vLLM (เซิร์ฟเวอร์ในเครื่องที่เข้ากันได้กับ OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-24T09:30:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM สามารถให้บริการโมเดลโอเพนซอร์ส (และโมเดลกำหนดเองบางประเภท) ผ่าน HTTP API แบบ **เข้ากันได้กับ OpenAI** OpenClaw เชื่อมต่อกับ vLLM โดยใช้ API `openai-completions`

OpenClaw ยังสามารถ **ค้นหาโมเดลที่พร้อมใช้งานโดยอัตโนมัติ** จาก vLLM ได้เมื่อคุณเลือกใช้ด้วย `VLLM_API_KEY` (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับ auth) และคุณไม่ได้กำหนดรายการ `models.providers.vllm` แบบชัดเจน

OpenClaw ถือว่า `vllm` เป็น provider แบบเข้ากันได้กับ OpenAI ในเครื่องที่รองรับ
การนับ usage แบบสตรีม ดังนั้นจำนวนโทเค็นของ status/context จึงสามารถอัปเดตได้จาก
การตอบกลับ `stream_options.include_usage`

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| Provider ID      | `vllm`                                   |
| API              | `openai-completions` (เข้ากันได้กับ OpenAI) |
| Auth             | ตัวแปร environment `VLLM_API_KEY`        |
| Base URL เริ่มต้น | `http://127.0.0.1:8000/v1`               |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม vLLM ด้วยเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI">
    base URL ของคุณควรเปิด endpoint แบบ `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป vLLM มักรันที่:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="ตั้งค่าตัวแปร environment ของ API key">
    ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับ auth:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="เลือกโมเดล">
    แทนที่ด้วย vLLM model ID ของคุณตัวใดตัวหนึ่ง:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## การค้นหาโมเดล (provider แบบ implicit)

เมื่อมีการตั้งค่า `VLLM_API_KEY` (หรือมี auth profile อยู่) และคุณ **ไม่ได้** กำหนด `models.providers.vllm` OpenClaw จะเรียก:

```
GET http://127.0.0.1:8000/v1/models
```

แล้วแปลง ID ที่ส่งคืนมาเป็นรายการโมเดล

<Note>
หากคุณตั้งค่า `models.providers.vllm` แบบชัดเจน การค้นหาอัตโนมัติจะถูกข้าม และคุณต้องกำหนดโมเดลด้วยตนเอง
</Note>

## การกำหนดค่าแบบชัดเจน (โมเดลแบบกำหนดเอง)

ใช้คอนฟิกแบบชัดเจนเมื่อ:

- vLLM รันอยู่บนโฮสต์หรือพอร์ตอื่น
- คุณต้องการตรึงค่า `contextWindow` หรือ `maxTokens`
- เซิร์ฟเวอร์ของคุณต้องใช้ API key จริง (หรือคุณต้องการควบคุม header)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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
    vLLM ถูกมองว่าเป็นแบ็กเอนด์ `/v1` แบบเข้ากันได้กับ OpenAI ในลักษณะ proxy ไม่ใช่
    endpoint OpenAI แบบเนทีฟ ซึ่งหมายความว่า:

    | Behavior | ใช้หรือไม่ |
    |----------|------------|
    | การจัดรูปคำขอแบบ Native OpenAI | ไม่ |
    | `service_tier` | ไม่ถูกส่ง |
    | `store` ในการตอบกลับ | ไม่ถูกส่ง |
    | คำใบ้สำหรับ prompt-cache | ไม่ถูกส่ง |
    | การจัดรูป payload เพื่อความเข้ากันได้กับ OpenAI reasoning | ไม่ถูกใช้ |
    | hidden attribution header ของ OpenClaw | ไม่ถูก inject บน base URL แบบกำหนดเอง |

  </Accordion>

  <Accordion title="base URL แบบกำหนดเอง">
    หากเซิร์ฟเวอร์ vLLM ของคุณรันบนโฮสต์หรือพอร์ตที่ไม่ใช่ค่าเริ่มต้น ให้ตั้ง `baseUrl` ในคอนฟิก provider แบบชัดเจน:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เข้าถึงเซิร์ฟเวอร์ไม่ได้">
    ตรวจสอบว่าเซิร์ฟเวอร์ vLLM กำลังทำงานและเข้าถึงได้:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    หากคุณเห็นข้อผิดพลาดการเชื่อมต่อ ให้ตรวจสอบโฮสต์ พอร์ต และยืนยันว่า vLLM เริ่มทำงานด้วยโหมดเซิร์ฟเวอร์แบบเข้ากันได้กับ OpenAI

  </Accordion>

  <Accordion title="ข้อผิดพลาด auth ในคำขอ">
    หากคำขอล้มเหลวด้วยข้อผิดพลาด auth ให้ตั้ง `VLLM_API_KEY` จริงที่ตรงกับคอนฟิกของเซิร์ฟเวอร์คุณ หรือกำหนดค่า provider แบบชัดเจนภายใต้ `models.providers.vllm`

    <Tip>
    หากเซิร์ฟเวอร์ vLLM ของคุณไม่ได้บังคับ auth ค่าใดก็ได้ที่ไม่ว่างสำหรับ `VLLM_API_KEY` ก็ใช้เป็นสัญญาณ opt-in สำหรับ OpenClaw ได้
    </Tip>

  </Accordion>

  <Accordion title="ไม่พบโมเดล">
    การค้นหาอัตโนมัติต้องการให้ตั้งค่า `VLLM_API_KEY` **และ** ต้องไม่มีรายการคอนฟิก `models.providers.vllm` แบบชัดเจน หากคุณกำหนด provider ด้วยตนเองไว้แล้ว OpenClaw จะข้ามการค้นหาและใช้เฉพาะโมเดลที่คุณประกาศไว้เท่านั้น
  </Accordion>
</AccordionGroup>

<Warning>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="OpenAI" href="/th/providers/openai" icon="bolt">
    provider OpenAI แบบเนทีฟและพฤติกรรมของเส้นทางที่เข้ากันได้กับ OpenAI
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้ไข
  </Card>
</CardGroup>
