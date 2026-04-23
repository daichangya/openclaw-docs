---
read_when:
    - คุณต้องการกำหนดเส้นทาง OpenClaw ผ่านพร็อกซี LiteLLM
    - คุณต้องการการติดตามค่าใช้จ่าย การบันทึกล็อก หรือการกำหนดเส้นทางโมเดลผ่าน LiteLLM
summary: รัน OpenClaw ผ่าน LiteLLM Proxy เพื่อการเข้าถึงโมเดลแบบรวมศูนย์และการติดตามค่าใช้จ่าย
title: LiteLLM
x-i18n:
    generated_at: "2026-04-23T05:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 766692eb83a1be83811d8e09a970697530ffdd4f3392247cfb2927fd590364a0
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) คือ LLM gateway แบบโอเพนซอร์สที่ให้ API แบบรวมศูนย์สำหรับ model provider มากกว่า 100 ราย กำหนดเส้นทาง OpenClaw ผ่าน LiteLLM เพื่อรับการติดตามค่าใช้จ่ายแบบรวมศูนย์ การบันทึกล็อก และความยืดหยุ่นในการสลับ backend โดยไม่ต้องเปลี่ยน config ของ OpenClaw

<Tip>
**ทำไมต้องใช้ LiteLLM กับ OpenClaw?**

- **การติดตามค่าใช้จ่าย** — ดูได้ชัดเจนว่า OpenClaw ใช้จ่ายไปเท่าไรข้ามทุกโมเดล
- **การกำหนดเส้นทางโมเดล** — สลับระหว่าง Claude, GPT-4, Gemini, Bedrock ได้โดยไม่ต้องเปลี่ยน config
- **Virtual key** — สร้างคีย์สำหรับ OpenClaw พร้อมขีดจำกัดการใช้จ่าย
- **การบันทึกล็อก** — ล็อกคำขอ/การตอบกลับแบบเต็มสำหรับการดีบัก
- **Fallback** — failover อัตโนมัติหาก provider หลักของคุณล่ม
  </Tip>

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="Onboarding (แนะนำ)">
    **เหมาะที่สุดสำหรับ:** เส้นทางที่เร็วที่สุดสู่การตั้งค่า LiteLLM ที่ใช้งานได้

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="การตั้งค่าด้วยตนเอง">
    **เหมาะที่สุดสำหรับ:** การควบคุมเต็มรูปแบบเหนือการติดตั้งและ config

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

        เพียงเท่านี้ OpenClaw จะกำหนดเส้นทางผ่าน LiteLLM แล้ว
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

## หัวข้อขั้นสูง

<AccordionGroup>
  <Accordion title="Virtual key">
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
    LiteLLM สามารถกำหนดเส้นทางคำขอของโมเดลไปยัง backend ต่าง ๆ ได้ กำหนดค่าใน `config.yaml` ของ LiteLLM:

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

    OpenClaw จะยังคงร้องขอ `claude-opus-4-6` — LiteLLM เป็นผู้จัดการการกำหนดเส้นทาง

  </Accordion>

  <Accordion title="การดูการใช้งาน">
    ตรวจสอบแดชบอร์ดหรือ API ของ LiteLLM:

    ```bash
    # ข้อมูลคีย์
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # ล็อกค่าใช้จ่าย
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับพฤติกรรมของ Proxy">
    - LiteLLM รันบน `http://localhost:4000` โดยค่าเริ่มต้น
    - OpenClaw เชื่อมต่อผ่าน endpoint `/v1`
      แบบ OpenAI-compatible สไตล์ proxy ของ LiteLLM
    - การจัดรูปคำขอแบบเฉพาะ OpenAI native จะไม่ถูกใช้ผ่าน LiteLLM:
      ไม่มี `service_tier`, ไม่มี `store` ของ Responses, ไม่มี prompt-cache hint, และไม่มี
      การจัดรูป payload สำหรับความเข้ากันได้ของ reasoning แบบ OpenAI
    - header ระบุที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`)
      จะไม่ถูกฉีดบน base URL ของ LiteLLM แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

<Note>
สำหรับการกำหนดค่า provider ทั่วไปและพฤติกรรม failover โปรดดู [Model Providers](/th/concepts/model-providers)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เอกสาร LiteLLM" href="https://docs.litellm.ai" icon="book">
    เอกสารทางการของ LiteLLM และเอกสารอ้างอิง API
  </Card>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของ provider ทั้งหมด, model ref และพฤติกรรม failover
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config แบบเต็ม
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
</CardGroup>
