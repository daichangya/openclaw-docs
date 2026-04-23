---
read_when:
    - คุณต้องการรัน OpenClaw กับเซิร์ฟเวอร์ vLLM ในเครื่อง
    - คุณต้องการ endpoint `/v1` ที่เข้ากันได้กับ OpenAI พร้อมโมเดลของคุณเอง
summary: รัน OpenClaw กับ vLLM (เซิร์ฟเวอร์ในเครื่องที่เข้ากันได้กับ OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-23T05:53:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6c4ceeb59cc10079630e45263485747eadfc66a66267d27579f466d0c0a91a1
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM สามารถเสิร์ฟโมเดลโอเพนซอร์ส (และโมเดลแบบกำหนดเองบางตัว) ผ่าน HTTP API ที่ **เข้ากันได้กับ OpenAI** โดย OpenClaw เชื่อมต่อกับ vLLM ด้วย API แบบ `openai-completions`

OpenClaw ยังสามารถ **ค้นหาโมเดลที่พร้อมใช้งานโดยอัตโนมัติ** จาก vLLM ได้เมื่อคุณเลือกใช้ด้วย `VLLM_API_KEY` (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับ auth) และคุณไม่ได้กำหนด `models.providers.vllm` แบบ explicit

OpenClaw ปฏิบัติต่อ `vllm` เป็น local OpenAI-compatible provider ที่รองรับ
streamed usage accounting ดังนั้นจำนวนโทเค็นของ status/context จึงสามารถอัปเดตจากการตอบกลับของ `stream_options.include_usage` ได้

| คุณสมบัติ         | ค่า                                     |
| ---------------- | --------------------------------------- |
| Provider ID      | `vllm`                                  |
| API              | `openai-completions` (เข้ากันได้กับ OpenAI) |
| Auth             | ตัวแปร environment `VLLM_API_KEY`       |
| Default base URL | `http://127.0.0.1:8000/v1`              |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม vLLM พร้อมเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI">
    base URL ของคุณควรเปิดเผย endpoint แบบ `/v1` (เช่น `/v1/models`, `/v1/chat/completions`) โดยทั่วไป vLLM มักรันบน:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="ตั้งค่าตัวแปร environment สำหรับ API key">
    ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับ auth:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="เลือกโมเดล">
    แทนที่ด้วย vLLM model ID ของคุณ:

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

## การค้นพบโมเดล (provider แบบ implicit)

เมื่อมีการตั้ง `VLLM_API_KEY` (หรือมี auth profile อยู่) และคุณ **ไม่ได้** กำหนด `models.providers.vllm` OpenClaw จะ query:

```
GET http://127.0.0.1:8000/v1/models
```

และแปลง ID ที่ส่งกลับมาเป็น model entry

<Note>
หากคุณตั้ง `models.providers.vllm` แบบ explicit ระบบจะข้ามการค้นหาอัตโนมัติ และคุณต้องกำหนดโมเดลเอง
</Note>

## การกำหนดค่าแบบ explicit (โมเดลแบบ manual)

ใช้ explicit config เมื่อ:

- vLLM รันบนโฮสต์หรือพอร์ตอื่น
- คุณต้องการปักหมุดค่า `contextWindow` หรือ `maxTokens`
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

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมแบบพร็อกซี">
    vLLM ถูกปฏิบัติเป็นแบ็กเอนด์ `/v1` แบบ OpenAI-compatible สไตล์พร็อกซี ไม่ใช่
    endpoint OpenAI แบบเนทีฟ ซึ่งหมายความว่า:

    | พฤติกรรม | ถูกใช้หรือไม่ |
    |----------|---------------|
    | การจัดรูปคำขอแบบ OpenAI เนทีฟ | ไม่ |
    | `service_tier` | ไม่ถูกส่ง |
    | Responses `store` | ไม่ถูกส่ง |
    | Prompt-cache hint | ไม่ถูกส่ง |
    | การจัดรูป payload reasoning-compat ของ OpenAI | ไม่ถูกใช้ |
    | hidden OpenClaw attribution header | ไม่ถูกฉีดลงบน custom base URL |

  </Accordion>

  <Accordion title="Custom base URL">
    หากเซิร์ฟเวอร์ vLLM ของคุณรันบนโฮสต์หรือพอร์ตที่ไม่ใช่ค่าเริ่มต้น ให้ตั้ง `baseUrl` ใน explicit provider config:

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
  <Accordion title="ไม่สามารถเข้าถึงเซิร์ฟเวอร์">
    ตรวจสอบว่าเซิร์ฟเวอร์ vLLM กำลังทำงานและเข้าถึงได้:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    หากคุณเห็นข้อผิดพลาดการเชื่อมต่อ ให้ตรวจสอบ host, port และยืนยันว่า vLLM เริ่มทำงานด้วยโหมดเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI แล้ว

  </Accordion>

  <Accordion title="เกิดข้อผิดพลาดด้าน auth บนคำขอ">
    หากคำขอล้มเหลวด้วยข้อผิดพลาดด้าน auth ให้ตั้ง `VLLM_API_KEY` จริงที่ตรงกับการกำหนดค่าของเซิร์ฟเวอร์ หรือกำหนดค่า provider แบบ explicit ภายใต้ `models.providers.vllm`

    <Tip>
    หากเซิร์ฟเวอร์ vLLM ของคุณไม่ได้บังคับ auth ค่าที่ไม่ว่างใด ๆ สำหรับ `VLLM_API_KEY` ก็ใช้ได้ในฐานะสัญญาณ opt-in สำหรับ OpenClaw
    </Tip>

  </Accordion>

  <Accordion title="ไม่ค้นพบโมเดล">
    การค้นหาอัตโนมัติต้องมีการตั้ง `VLLM_API_KEY` **และ** ต้องไม่มี explicit config entry ของ `models.providers.vllm` หากคุณกำหนด provider ด้วยตนเองแล้ว OpenClaw จะข้ามการค้นหาและใช้เฉพาะโมเดลที่คุณประกาศไว้เท่านั้น
  </Accordion>
</AccordionGroup>

<Warning>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
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
    รายละเอียดด้าน auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาทั่วไปและวิธีแก้ไข
  </Card>
</CardGroup>
