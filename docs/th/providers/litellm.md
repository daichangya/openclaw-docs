---
read_when:
    - คุณต้องการกำหนดเส้นทาง OpenClaw ผ่านพร็อกซี LiteLLM
    - คุณต้องการการติดตามต้นทุน การบันทึก log หรือการกำหนดเส้นทางโมเดลผ่าน LiteLLM
summary: รัน OpenClaw ผ่าน LiteLLM Proxy เพื่อการเข้าถึงโมเดลแบบรวมศูนย์และการติดตามต้นทุน
title: LiteLLM
x-i18n:
    generated_at: "2026-04-24T09:28:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) คือ LLM gateway แบบโอเพนซอร์สที่ให้ API แบบรวมศูนย์กับผู้ให้บริการโมเดลมากกว่า 100 ราย กำหนดเส้นทาง OpenClaw ผ่าน LiteLLM เพื่อรับการติดตามต้นทุนแบบรวมศูนย์ การบันทึก log และความยืดหยุ่นในการสลับแบ็กเอนด์โดยไม่ต้องเปลี่ยน config ของ OpenClaw

<Tip>
**ทำไมจึงควรใช้ LiteLLM กับ OpenClaw?**

- **การติดตามต้นทุน** — ดูได้ชัดเจนว่า OpenClaw ใช้จ่ายเท่าไรในทุกโมเดล
- **การกำหนดเส้นทางโมเดล** — สลับระหว่าง Claude, GPT-4, Gemini, Bedrock ได้โดยไม่ต้องเปลี่ยน config
- **Virtual keys** — สร้างคีย์พร้อมขีดจำกัดการใช้จ่ายสำหรับ OpenClaw
- **การบันทึก log** — มี request/response logs แบบเต็มเพื่อการดีบัก
- **Fallbacks** — failover อัตโนมัติเมื่อผู้ให้บริการหลักของคุณล่ม

</Tip>

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="Onboarding (แนะนำ)">
    **เหมาะที่สุดสำหรับ:** เส้นทางที่เร็วที่สุดไปยังการตั้งค่า LiteLLM ที่ใช้งานได้

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="การตั้งค่าด้วยตนเอง">
    **เหมาะที่สุดสำหรับ:** การควบคุมการติดตั้งและ config อย่างเต็มรูปแบบ

    <Steps>
      <Step title="เริ่ม LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="ชี้ OpenClaw ไปยัง LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        เพียงเท่านี้ ตอนนี้ OpenClaw จะกำหนดเส้นทางผ่าน LiteLLM แล้ว
      </Step>
    </Steps>

  </Tab>
</Tabs>

## การกำหนดค่า

### ตัวแปรสภาพแวดล้อม

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### ไฟล์ config

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Virtual keys">
    สร้างคีย์เฉพาะสำหรับ OpenClaw พร้อมขีดจำกัดการใช้จ่าย:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    ใช้คีย์ที่สร้างขึ้นเป็น `LITELLM_API_KEY`

  </Accordion>

  <Accordion title="การกำหนดเส้นทางโมเดล">
    LiteLLM สามารถกำหนดเส้นทางคำขอของโมเดลไปยังแบ็กเอนด์ที่ต่างกันได้ กำหนดค่าใน `config.yaml` ของ LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw จะยังคงร้องขอ `claude-opus-4-6` เหมือนเดิม — LiteLLM จะจัดการการกำหนดเส้นทางเอง

  </Accordion>

  <Accordion title="การดูการใช้งาน">
    ตรวจสอบจาก dashboard หรือ API ของ LiteLLM:

    ```bash
    # ข้อมูลคีย์
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับพฤติกรรมของพร็อกซี">
    - LiteLLM ทำงานบน `http://localhost:4000` โดยค่าเริ่มต้น
    - OpenClaw เชื่อมต่อผ่านปลายทาง `/v1` แบบ OpenAI-compatible สไตล์ proxy ของ LiteLLM
    - การจัดรูป request แบบ native OpenAI-only จะไม่ถูกใช้ผ่าน LiteLLM:
      ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี prompt-cache hints และไม่มี
      OpenAI reasoning-compat payload shaping
    - hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`)
      จะไม่ถูก inject บน LiteLLM base URLs แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

<Note>
สำหรับการกำหนดค่าทั่วไปของ provider และพฤติกรรม failover โปรดดู [Model Providers](/th/concepts/model-providers)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เอกสาร LiteLLM" href="https://docs.litellm.ai" icon="book">
    เอกสารอย่างเป็นทางการของ LiteLLM และเอกสารอ้างอิง API
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของ providers ทั้งหมด, model refs และพฤติกรรม failover
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config ฉบับเต็ม
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
</CardGroup>
