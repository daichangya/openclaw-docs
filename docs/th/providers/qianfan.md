---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการคำแนะนำในการตั้งค่า Baidu Qianfan
summary: ใช้ API แบบรวมศูนย์ของ Qianfan เพื่อเข้าถึงหลายโมเดลใน OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-23T05:52:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d0eeee9ec24b335c2fb8ac5e985a9edc35cfc5b2641c545cb295dd2de619f50
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan

Qianfan คือแพลตฟอร์ม MaaS ของ Baidu ที่ให้ **API แบบรวมศูนย์** ซึ่งกำหนดเส้นทางคำขอไปยังหลายโมเดลผ่าน
endpoint และ API key เดียว มันเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้โดยแค่สลับ base URL

| คุณสมบัติ | ค่า                               |
| --------- | --------------------------------- |
| Provider  | `qianfan`                         |
| Auth      | `QIANFAN_API_KEY`                 |
| API       | เข้ากันได้กับ OpenAI             |
| Base URL  | `https://qianfan.baidubce.com/v2` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างบัญชี Baidu Cloud">
    สมัครหรือเข้าสู่ระบบที่ [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) และตรวจสอบให้แน่ใจว่าคุณได้เปิดใช้การเข้าถึง Qianfan API แล้ว
  </Step>
  <Step title="สร้าง API key">
    สร้างแอปพลิเคชันใหม่หรือเลือกแอปที่มีอยู่ จากนั้นสร้าง API key โดยรูปแบบของคีย์คือ `bce-v3/ALTAK-...`
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## โมเดลที่พร้อมใช้งาน

| Model ref                            | อินพุต       | Context | เอาต์พุตสูงสุด | Reasoning | หมายเหตุ          |
| ------------------------------------ | ------------ | ------- | -------------- | --------- | ----------------- |
| `qianfan/deepseek-v3.2`              | ข้อความ      | 98,304  | 32,768         | ใช่       | โมเดลเริ่มต้น     |
| `qianfan/ernie-5.0-thinking-preview` | ข้อความ, ภาพ | 119,000 | 64,000         | ใช่       | หลายรูปแบบข้อมูล   |

<Tip>
model ref แบบ bundled เริ่มต้นคือ `qianfan/deepseek-v3.2` คุณต้องแทนที่ `models.providers.qianfan` เฉพาะเมื่อจำเป็นต้องใช้ base URL หรือ metadata ของโมเดลแบบกำหนดเอง
</Tip>

## ตัวอย่าง config

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport และความเข้ากันได้">
    Qianfan ทำงานผ่านเส้นทาง transport ที่เข้ากันได้กับ OpenAI ไม่ใช่การจัดรูปคำขอแบบ OpenAI เนทีฟ ซึ่งหมายความว่าฟีเจอร์มาตรฐานของ OpenAI SDK ใช้งานได้ แต่พารามิเตอร์เฉพาะของ provider อาจไม่ถูกส่งต่อไป
  </Accordion>

  <Accordion title="Catalog และการแทนที่">
    ปัจจุบัน bundled catalog มี `deepseek-v3.2` และ `ernie-5.0-thinking-preview` ให้เพิ่มหรือแทนที่ `models.providers.qianfan` เฉพาะเมื่อคุณต้องการ base URL หรือ metadata ของโมเดลแบบกำหนดเอง

    <Note>
    model ref ใช้ prefix `qianfan/` (เช่น `qianfan/deepseek-v3.2`)
    </Note>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - ตรวจสอบให้แน่ใจว่า API key ของคุณขึ้นต้นด้วย `bce-v3/ALTAK-` และได้เปิดใช้การเข้าถึง Qianfan API ในคอนโซลของ Baidu Cloud แล้ว
    - หากไม่มีรายชื่อโมเดล ให้ยืนยันว่าบัญชีของคุณได้เปิดใช้งานบริการ Qianfan แล้ว
    - base URL เริ่มต้นคือ `https://qianfan.baidubce.com/v2` ให้เปลี่ยนเฉพาะเมื่อคุณใช้ endpoint หรือ proxy แบบกำหนดเอง
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw แบบเต็ม
  </Card>
  <Card title="การตั้งค่าเอเจนต์" href="/th/concepts/agent" icon="robot">
    การกำหนดค่า default ของเอเจนต์และการกำหนดโมเดล
  </Card>
  <Card title="เอกสาร Qianfan API" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    เอกสาร Qianfan API อย่างเป็นทางการ
  </Card>
</CardGroup>
