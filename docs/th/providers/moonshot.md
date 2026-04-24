---
read_when:
    - คุณต้องการตั้งค่า Moonshot K2 (Moonshot Open Platform) เทียบกับ Kimi Coding
    - คุณต้องการทำความเข้าใจปลายทาง คีย์ และ model ref ที่แยกจากกัน
    - คุณต้องการคอนฟิกแบบคัดลอก/วางได้สำหรับผู้ให้บริการแต่ละราย
summary: กำหนดค่า Moonshot K2 เทียบกับ Kimi Coding (ผู้ให้บริการและคีย์แยกกัน)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-24T09:28:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f9b833110aebc47f9f1f832ade48a2f13b269abd72a7ea2766ffb3af449feb9
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot ให้บริการ Kimi API พร้อมปลายทางที่เข้ากันได้กับ OpenAI ให้กำหนดค่า
ผู้ให้บริการและตั้งค่าโมเดลเริ่มต้นเป็น `moonshot/kimi-k2.6` หรือใช้
Kimi Coding ด้วย `kimi/kimi-code`

<Warning>
Moonshot และ Kimi Coding เป็น **ผู้ให้บริการแยกกัน** คีย์ใช้แทนกันไม่ได้ ปลายทางต่างกัน และ model ref ต่างกัน (`moonshot/...` เทียบกับ `kimi/...`)
</Warning>

## แค็ตตาล็อกโมเดลที่มีมาให้

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | ชื่อ                   | Reasoning | อินพุต      | Context | เอาต์พุตสูงสุด |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | -------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | ไม่ใช่    | text, image | 262,144 | 262,144        |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | ไม่ใช่    | text, image | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | ใช่       | text        | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | ใช่       | text        | 262,144 | 262,144        |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | ไม่ใช่    | text        | 256,000 | 16,384         |

[//]: # "moonshot-kimi-k2-ids:end"

ค่าประมาณต้นทุนแบบ bundled สำหรับโมเดล K2 ที่โฮสต์โดย Moonshot ในปัจจุบันใช้
อัตราแบบจ่ายตามการใช้งานที่ Moonshot เผยแพร่: Kimi K2.6 คือ $0.16/MTok สำหรับ cache hit,
$0.95/MTok สำหรับ input และ $4.00/MTok สำหรับ output; Kimi K2.5 คือ $0.10/MTok สำหรับ cache hit,
$0.60/MTok สำหรับ input และ $3.00/MTok สำหรับ output ส่วนรายการแค็ตตาล็อกเก่าอื่น ๆ
ยังคงใช้ค่า placeholder ต้นทุนเป็นศูนย์ เว้นแต่คุณจะ override ในคอนฟิก

## เริ่มต้นใช้งาน

เลือกผู้ให้บริการของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Moonshot API">
    **เหมาะที่สุดสำหรับ:** โมเดล Kimi K2 ผ่าน Moonshot Open Platform

    <Steps>
      <Step title="เลือกภูมิภาคของปลายทาง">
        | ตัวเลือก auth          | ปลายทาง                       | ภูมิภาค       |
        | ---------------------- | ----------------------------- | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`  | International |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`  | China         |
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        หรือสำหรับปลายทาง China:

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
      <Step title="รันการทดสอบ smoke แบบ live">
        ใช้ state dir แบบแยกเมื่อคุณต้องการตรวจสอบการเข้าถึงโมเดลและการติดตามต้นทุน
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
        `model: "kimi-k2.6"` รายการ transcript ของ assistant จะเก็บ
        การใช้งานโทเคนที่ทำให้เป็นมาตรฐานแล้วพร้อมทั้งต้นทุนโดยประมาณไว้ใต้ `usage.cost`
        เมื่อ Moonshot ส่ง metadata การใช้งานกลับมา
      </Step>
    </Steps>

    ### ตัวอย่างคอนฟิก

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
    **เหมาะที่สุดสำหรับ:** งานที่เน้นโค้ดผ่านปลายทาง Kimi Coding

    <Note>
    Kimi Coding ใช้ API key และ prefix ผู้ให้บริการ (`kimi/...`) ที่ต่างจาก Moonshot (`moonshot/...`) model ref แบบเก่า `kimi/k2p5` ยังคงรองรับเป็น id เพื่อความเข้ากันได้
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

    ### ตัวอย่างคอนฟิก

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

## การค้นหาเว็บของ Kimi

OpenClaw ยังมาพร้อม **Kimi** ในฐานะผู้ให้บริการ `web_search` ซึ่งทำงานบน
Moonshot web search

<Steps>
  <Step title="รันการตั้งค่า web search แบบโต้ตอบ">
    ```bash
    openclaw configure --section web
    ```

    เลือก **Kimi** ในส่วน web-search เพื่อจัดเก็บ
    `plugins.entries.moonshot.config.webSearch.*`

  </Step>
  <Step title="กำหนดค่าภูมิภาคและโมเดลของ web search">
    การตั้งค่าแบบโต้ตอบจะถามค่าเหล่านี้:

    | การตั้งค่า            | ตัวเลือก                                                              |
    | --------------------- | --------------------------------------------------------------------- |
    | ภูมิภาค API          | `https://api.moonshot.ai/v1` (international) หรือ `https://api.moonshot.cn/v1` (China) |
    | โมเดล web search     | ค่าเริ่มต้นคือ `kimi-k2.6`                                            |

  </Step>
</Steps>

คอนฟิกจะอยู่ใต้ `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
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

## การกำหนดค่าขั้นสูง

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

    OpenClaw ยังแมประดับ `/think` ของรันไทม์สำหรับ Moonshot ด้วย:

    | ระดับ `/think`       | พฤติกรรมของ Moonshot       |
    | -------------------- | --------------------------- |
    | `/think off`         | `thinking.type=disabled`    |
    | ระดับใดก็ได้ที่ไม่ใช่ off | `thinking.type=enabled`  |

    <Warning>
    เมื่อเปิดใช้ Moonshot thinking, `tool_choice` ต้องเป็น `auto` หรือ `none` OpenClaw จะ normalize ค่า `tool_choice` ที่ไม่เข้ากันให้เป็น `auto` เพื่อความเข้ากันได้
    </Warning>

    Kimi K2.6 ยังรองรับฟิลด์ `thinking.keep` แบบไม่บังคับ ซึ่งควบคุม
    การเก็บรักษา `reasoning_content` ข้ามหลายเทิร์น ตั้งค่าเป็น `"all"` เพื่อเก็บ
    reasoning แบบเต็มข้ามเทิร์น; ละไว้ (หรือปล่อยเป็น `null`) เพื่อใช้กลยุทธ์ค่าเริ่มต้น
    ของเซิร์ฟเวอร์ OpenClaw จะส่งต่อ `thinking.keep` เฉพาะสำหรับ
    `moonshot/kimi-k2.6` และจะลบออกจากโมเดลอื่น

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

  <Accordion title="การทำความสะอาด tool call id">
    Moonshot Kimi ให้บริการ tool_call id ในรูปแบบ `functions.<name>:<index>` OpenClaw จะเก็บไว้ตามเดิมโดยไม่เปลี่ยน เพื่อให้การเรียกใช้เครื่องมือข้ามหลายเทิร์นยังทำงานได้

    หากต้องการบังคับการทำความสะอาดแบบเข้มงวดบนผู้ให้บริการ OpenAI-compatible แบบกำหนดเอง ให้ตั้งค่า `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ความเข้ากันได้ของการใช้งานแบบสตรีม">
    ปลายทาง Moonshot แบบเนทีฟ (`https://api.moonshot.ai/v1` และ
    `https://api.moonshot.cn/v1`) ประกาศความเข้ากันได้ของการใช้งานแบบสตรีมบน
    transport `openai-completions` ที่ใช้ร่วมกัน OpenClaw จะอิงตาม
    ความสามารถของปลายทาง ดังนั้น id ผู้ให้บริการแบบกำหนดเองที่เข้ากันได้และชี้ไปยัง
    โฮสต์ Moonshot แบบเนทีฟเดียวกัน ก็จะสืบทอดพฤติกรรมการใช้งานแบบสตรีมเดียวกัน

    ด้วยราคา K2.6 แบบ bundled การใช้งานแบบสตรีมที่มี input, output
    และโทเคน cache-read จะถูกแปลงเป็นต้นทุน USD โดยประมาณในเครื่องด้วย สำหรับ
    `/status`, `/usage full`, `/usage cost` และการคำนวณเซสชันที่อิงกับ transcript

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงปลายทางและ model ref">
    | ผู้ให้บริการ | คำนำหน้า model ref | ปลายทาง                      | ตัวแปร env สำหรับ auth |
    | ------------- | ------------------- | ---------------------------- | ---------------------- |
    | Moonshot      | `moonshot/`         | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`     |
    | Moonshot CN   | `moonshot/`         | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`     |
    | Kimi Coding   | `kimi/`             | ปลายทาง Kimi Coding          | `KIMI_API_KEY`         |
    | Web search    | N/A                 | เหมือนกับภูมิภาค Moonshot API | `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` |

    - Kimi web search ใช้ `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` และค่าเริ่มต้นคือ `https://api.moonshot.ai/v1` พร้อมโมเดล `kimi-k2.6`
    - Override ข้อมูล metadata ของราคาและ context ได้ใน `models.providers` หากจำเป็น
    - หาก Moonshot เผยแพร่ขีดจำกัด context ของโมเดลแตกต่างออกไป ให้ปรับ `contextWindow` ให้เหมาะสม

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model ref และพฤติกรรม failover
  </Card>
  <Card title="Web search" href="/th/tools/web" icon="magnifying-glass">
    การกำหนดค่าผู้ให้บริการ web search รวมถึง Kimi
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาคอนฟิกแบบเต็มสำหรับผู้ให้บริการ โมเดล และ Plugin
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    การจัดการ API key และเอกสารของ Moonshot
  </Card>
</CardGroup>
