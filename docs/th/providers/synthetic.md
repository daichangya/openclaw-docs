---
read_when:
    - คุณต้องการใช้ Synthetic เป็น model provider
    - คุณต้องการ Synthetic API key หรือการตั้งค่า base URL
summary: ใช้ Anthropic-compatible API ของ Synthetic ใน OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-23T05:53:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c4d2c6635482e09acaf603a75c8a85f0782e42a4a68ef6166f423a48d184ffa
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

[Synthetic](https://synthetic.new) เปิดเผย endpoints แบบ Anthropic-compatible
โดย OpenClaw จะลงทะเบียนมันเป็น provider ชื่อ `synthetic` และใช้ Anthropic
Messages API

| คุณสมบัติ | ค่า                                   |
| -------- | ------------------------------------- |
| Provider | `synthetic`                           |
| Auth     | `SYNTHETIC_API_KEY`                   |
| API      | Anthropic Messages                    |
| Base URL | `https://api.synthetic.new/anthropic` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key">
    รับ `SYNTHETIC_API_KEY` จากบัญชี Synthetic ของคุณ หรือให้
    onboarding wizard ถามคุณก็ได้
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="ตรวจสอบโมเดลเริ่มต้น">
    หลัง onboarding โมเดลเริ่มต้นจะถูกตั้งเป็น:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
ไคลเอนต์ Anthropic ของ OpenClaw จะเติม `/v1` ต่อท้าย base URL โดยอัตโนมัติ ดังนั้นให้ใช้
`https://api.synthetic.new/anthropic` (ไม่ใช่ `/anthropic/v1`) หาก Synthetic
เปลี่ยน base URL ให้ override `models.providers.synthetic.baseUrl`
</Warning>

## ตัวอย่าง config

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## แค็ตตาล็อกโมเดล

โมเดลทั้งหมดของ Synthetic ใช้ค่า cost เป็น `0` (input/output/cache)

| Model ID                                               | Context window | Max tokens | Reasoning | Input        |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536     | no        | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192      | yes       | text         |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000    | no        | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192      | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192      | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192      | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192      | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192      | no        | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192      | no        | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192      | no        | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192      | no        | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192      | yes       | text + image |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192      | no        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192      | no        | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192      | no        | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192      | no        | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000    | no        | text         |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000    | no        | text         |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000    | yes       | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192      | no        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192      | yes       | text         |

<Tip>
model refs ใช้รูปแบบ `synthetic/<modelId>` ใช้
`openclaw models list --provider synthetic` เพื่อดูโมเดลทั้งหมดที่มีบนบัญชีของคุณ
</Tip>

<AccordionGroup>
  <Accordion title="Model allowlist">
    หากคุณเปิดใช้ model allowlist (`agents.defaults.models`) ให้เพิ่มทุก
    โมเดลของ Synthetic ที่คุณวางแผนจะใช้ โมเดลที่ไม่อยู่ใน allowlist จะถูกซ่อน
    จากเอเจนต์
  </Accordion>

  <Accordion title="Base URL override">
    หาก Synthetic เปลี่ยน API endpoint ให้ override base URL ใน config ของคุณ:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    โปรดจำไว้ว่า OpenClaw จะเติม `/v1` ให้อัตโนมัติ

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    กฎของ provider, model refs และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema ของ config แบบเต็ม รวมถึงการตั้งค่า provider
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    แดชบอร์ดและเอกสาร API ของ Synthetic
  </Card>
</CardGroup>
