---
read_when:
    - คุณต้องการการตั้งค่า Moonshot K2 (Moonshot Open Platform) เทียบกับ Kimi Coding to=final
    - คุณต้องการเข้าใจ endpoint, คีย์ และ model ref ที่แยกจากกัน
    - คุณต้องการ config แบบคัดลอกไปใช้ได้ทันทีสำหรับผู้ให้บริการแต่ละราย
summary: กำหนดค่า Moonshot K2 เทียบกับ Kimi Coding (ผู้ให้บริการและคีย์แยกกัน)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T05:52:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a04b0c45d55dbf8d56a04a1811f0850b800842ea501b212d44b53ff0680b5a2
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot ให้บริการ Kimi API ผ่าน endpoint ที่เข้ากันได้กับ OpenAI กำหนดค่า
provider แล้วตั้งโมเดลเริ่มต้นเป็น `moonshot/kimi-k2.6` หรือใช้
Kimi Coding ด้วย `kimi/kimi-code`

<Warning>
Moonshot และ Kimi Coding เป็น **ผู้ให้บริการคนละตัวกัน** คีย์ใช้แทนกันไม่ได้ endpoint ต่างกัน และ model ref ก็ต่างกัน (`moonshot/...` เทียบกับ `kimi/...`)
</Warning>

## แค็ตตาล็อกโมเดลที่มาพร้อมกัน

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Name                   | Reasoning | Input       | Context | Max output |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | No        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Yes       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Yes       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

การประเมินค่าใช้จ่ายแบบ bundled สำหรับโมเดล K2 ที่โฮสต์บน Moonshot ในปัจจุบันใช้
อัตรา pay-as-you-go ที่ Moonshot เผยแพร่: Kimi K2.6 คือ $0.16/MTok สำหรับ cache hit,
$0.95/MTok สำหรับ input และ $4.00/MTok สำหรับ output; Kimi K2.5 คือ $0.10/MTok สำหรับ cache hit,
$0.60/MTok สำหรับ input และ $3.00/MTok สำหรับ output รายการแค็ตตาล็อกแบบ legacy อื่น ๆ
จะคง placeholder แบบ zero-cost ไว้ เว้นแต่คุณจะ override ใน config

## เริ่มต้นใช้งาน

เลือกผู้ให้บริการของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Moonshot API">
    **เหมาะที่สุดสำหรับ:** โมเดล Kimi K2 ผ่าน Moonshot Open Platform

    <Steps>
      <Step title="เลือก region ของ endpoint">
        | ตัวเลือก auth          | Endpoint                       | Region        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        หรือสำหรับ endpoint ของจีน:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="รัน live smoke test">
        ใช้ state dir แบบแยกเมื่อคุณต้องการตรวจสอบการเข้าถึงโมเดลและการติดตามค่าใช้จ่าย
        โดยไม่แตะต้องเซสชันปกติของคุณ:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        การตอบกลับแบบ JSON ควรรายงาน `provider: "moonshot"` และ
        `model: "kimi-k2.6"` รายการ transcript ของผู้ช่วยจะเก็บ
        normalized token usage พร้อมต้นทุนโดยประมาณไว้ใต้ `usage.cost` เมื่อ Moonshot ส่ง usage metadata กลับมา
      </Step>
    </Steps>

    ### ตัวอย่าง config

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **เหมาะที่สุดสำหรับ:** งานที่เน้นโค้ดผ่าน endpoint ของ Kimi Coding

    <Note>
    Kimi Coding ใช้ API key และ prefix ของ provider (`kimi/...`) คนละชุดกับ Moonshot (`moonshot/...`) model ref แบบ legacy `kimi/k2p5` ยังคงยอมรับได้ในฐานะ compatibility id
    </Note>

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### ตัวอย่าง config

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web search

OpenClaw ยังมาพร้อมกับ **Kimi** ในฐานะผู้ให้บริการ `web_search` ซึ่งรองรับโดย Moonshot web
search

<Steps>
  <Step title="รันการตั้งค่า web search แบบโต้ตอบ">
    ```bash
    openclaw configure --section web
    ```

    เลือก **Kimi** ในส่วน web-search เพื่อเก็บ
    `plugins.entries.moonshot.config.webSearch.*`

  </Step>
  <Step title="กำหนดค่า region และโมเดลของ web search">
    การตั้งค่าแบบโต้ตอบจะพรอมป์ถาม:

    | การตั้งค่า          | ตัวเลือก                                                              |
    | ------------------- | --------------------------------------------------------------------- |
    | API region          | `https://api.moonshot.ai/v1` (international) หรือ `https://api.moonshot.cn/v1` (China) |
    | โมเดล web search   | ค่าเริ่มต้นเป็น `kimi-k2.6`                                          |

  </Step>
</Steps>

config อยู่ใต้ `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // หรือใช้ KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## ขั้นสูง

<AccordionGroup>
  <Accordion title="โหมด thinking แบบเนทีฟ">
    Moonshot Kimi รองรับ native thinking แบบไบนารี:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    กำหนดค่าต่อโมเดลผ่าน `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw ยัง map ระดับ `/think` ในรันไทม์สำหรับ Moonshot ด้วย:

    | ระดับ `/think`      | พฤติกรรมของ Moonshot      |
    | ------------------- | -------------------------- |
    | `/think off`        | `thinking.type=disabled`   |
    | ระดับใดก็ตามที่ไม่ใช่ off | `thinking.type=enabled` |

    <Warning>
    เมื่อเปิดใช้ Moonshot thinking ค่า `tool_choice` ต้องเป็น `auto` หรือ `none` เท่านั้น OpenClaw จะ normalize ค่า `tool_choice` ที่ไม่เข้ากันให้เป็น `auto` เพื่อความเข้ากันได้
    </Warning>

    Kimi K2.6 ยังรับฟิลด์ `thinking.keep` แบบไม่บังคับ ซึ่งควบคุม
    การเก็บ `reasoning_content` ข้ามหลายเทิร์น ตั้งค่าเป็น `"all"` เพื่อเก็บ
    reasoning แบบเต็มข้ามเทิร์น; เว้นไว้ (หรือปล่อยเป็น `null`) เพื่อใช้กลยุทธ์ค่าเริ่มต้นของเซิร์ฟเวอร์ OpenClaw จะส่งต่อ `thinking.keep` เฉพาะสำหรับ
    `moonshot/kimi-k2.6` และจะลบมันออกจากโมเดลอื่น

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ความเข้ากันได้ของ streaming usage">
    endpoint แบบเนทีฟของ Moonshot (`https://api.moonshot.ai/v1` และ
    `https://api.moonshot.cn/v1`) ประกาศความเข้ากันได้ของ streaming usage บน
    transport แบบใช้ร่วมกัน `openai-completions` OpenClaw อ้างอิงสิ่งนั้นจากความสามารถของ endpoint ดังนั้น custom provider id ที่เข้ากันได้ซึ่งชี้ไปยังโฮสต์เนทีฟของ Moonshot เดียวกันจะสืบทอดพฤติกรรม streaming-usage เดียวกัน

    ด้วยราคาของ K2.6 แบบ bundled usage แบบสตรีมที่มีทั้ง input, output
    และ cache-read token จะถูกแปลงเป็นต้นทุน USD โดยประมาณในเครื่องสำหรับ `/status`, `/usage full`, `/usage cost` และการทำบัญชีเซสชันที่อิง transcript

  </Accordion>

  <Accordion title="เอกสารอ้างอิง endpoint และ model ref">
    | Provider   | คำนำหน้า Model ref | Endpoint                      | Auth env var        |
    | ---------- | ------------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`         | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`         | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`             | endpoint ของ Kimi Coding      | `KIMI_API_KEY`      |
    | Web search | N/A                 | เหมือนกับ Moonshot API region | `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` |

    - Kimi web search ใช้ `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` และมีค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1` พร้อมโมเดล `kimi-k2.6`
    - override ข้อมูลราคาและ metadata ของ context ได้ใน `models.providers` หากจำเป็น
    - หาก Moonshot เผยแพร่ขีดจำกัด context ที่แตกต่างกันสำหรับโมเดลใด ให้ปรับ `contextWindow` ให้สอดคล้อง

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model ref และพฤติกรรม failover
  </Card>
  <Card title="Web search" href="/tools/web-search" icon="magnifying-glass">
    การกำหนดค่าผู้ให้บริการ web search รวมถึง Kimi
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema ของ config แบบเต็มสำหรับผู้ให้บริการ โมเดล และ Plugins
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    การจัดการ Moonshot API key และเอกสารประกอบ
  </Card>
</CardGroup>
