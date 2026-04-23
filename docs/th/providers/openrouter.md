---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการรันโมเดลผ่าน OpenRouter ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ OpenRouter เพื่อเข้าถึงหลายโมเดลใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-23T05:52:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter ให้ **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังหลายโมเดลหลัง endpoint และ API key เดียว
มันเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้เพียงแค่สลับ base URL

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ที่ [openrouter.ai/keys](https://openrouter.ai/keys)
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(ไม่บังคับ) สลับไปใช้โมเดลเฉพาะ">
    Onboarding จะใช้ค่าเริ่มต้นเป็น `openrouter/auto` คุณสามารถเลือกโมเดลแบบชัดเจนภายหลังได้:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## ตัวอย่าง config

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Model reference

<Note>
model ref ใช้รูปแบบ `openrouter/<provider>/<model>` สำหรับรายการ
provider และโมเดลที่พร้อมใช้งานทั้งหมด ดู [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่มาพร้อมในชุด:

| Model ref                            | หมายเหตุ                        |
| ------------------------------------ | ------------------------------- |
| `openrouter/auto`                    | การกำหนดเส้นทางอัตโนมัติของ OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 ผ่าน MoonshotAI       |
| `openrouter/openrouter/healer-alpha` | เส้นทาง OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | เส้นทาง OpenRouter Hunter Alpha |

## การยืนยันตัวตนและ header

OpenRouter ใช้ Bearer token ร่วมกับ API key ของคุณอยู่เบื้องหลัง

สำหรับคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw จะเพิ่ม
app-attribution header ตามเอกสารของ OpenRouter ด้วย:

| Header                    | ค่า                   |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
หากคุณชี้ provider ของ OpenRouter ไปยังพร็อกซีหรือ base URL อื่น OpenClaw
จะ **ไม่** inject OpenRouter-specific header หรือ Anthropic cache marker เหล่านั้น
</Warning>

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="Anthropic cache marker">
    บนเส้นทาง OpenRouter ที่ผ่านการตรวจสอบแล้ว model ref ของ Anthropic จะคง
    marker `cache_control` แบบ Anthropic ที่เฉพาะกับ OpenRouter ซึ่ง OpenClaw ใช้เพื่อ
    การนำ prompt cache กลับมาใช้ซ้ำได้ดีขึ้นบนบล็อก system/developer prompt
  </Accordion>

  <Accordion title="การ inject Thinking / reasoning">
    บนเส้นทางที่รองรับและไม่ใช่ `auto`, OpenClaw จะแมประดับ thinking ที่เลือกไปยัง
    payload reasoning ของพร็อกซี OpenRouter คำใบ้ของโมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการ inject reasoning นี้
  </Accordion>

  <Accordion title="การจัดรูปแบบคำขอแบบ OpenAI-only">
    OpenRouter ยังคงวิ่งผ่านเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI ดังนั้น
    การจัดรูปแบบคำขอแบบ native OpenAI-only เช่น `serviceTier`, `store` ของ Responses,
    payload reasoning-compat ของ OpenAI และ prompt-cache hint จะไม่ถูกส่งต่อไป
  </Accordion>

  <Accordion title="เส้นทางที่แบ็กด้วย Gemini">
    ref ของ OpenRouter ที่แบ็กด้วย Gemini จะคงอยู่บนเส้นทาง proxy-Gemini: OpenClaw จะคง
    การทำ sanitation ของ Gemini thought-signature ไว้ตรงนั้น แต่จะไม่เปิดใช้ native Gemini
    replay validation หรือ bootstrap rewrite
  </Accordion>

  <Accordion title="metadata ของการกำหนดเส้นทาง provider">
    หากคุณส่งการกำหนดเส้นทาง provider ของ OpenRouter ผ่าน model params, OpenClaw จะส่งต่อ
    มันในฐานะ metadata ของการกำหนดเส้นทาง OpenRouter ก่อนที่ shared stream wrapper จะรัน
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงคอนฟิกแบบเต็มสำหรับ agents, models และ providers
  </Card>
</CardGroup>
