---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการรันโมเดลผ่าน OpenRouter ใน OpenClaw
    - คุณต้องการใช้ OpenRouter สำหรับการสร้างภาพ
summary: ใช้ API แบบรวมของ OpenRouter เพื่อเข้าถึงหลายโมเดลใน OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T09:29:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter ให้บริการ **API แบบรวมศูนย์** ที่ route คำขอไปยังหลายโมเดลผ่าน
endpoint และ API key เดียว มันเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้โดยเปลี่ยนเพียง base URL

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
  <Step title="(ไม่บังคับ) เปลี่ยนไปใช้โมเดลเฉพาะ">
    ค่าเริ่มต้นของ onboarding คือ `openrouter/auto` คุณสามารถเลือกโมเดลแบบเจาะจงในภายหลังได้:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## ตัวอย่างคอนฟิก

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
Model ref ใช้รูปแบบ `openrouter/<provider>/<model>` สำหรับรายชื่อ provider และโมเดลที่
ใช้ได้ทั้งหมด โปรดดู [/concepts/model-providers](/th/concepts/model-providers)
</Note>

ตัวอย่าง fallback ที่มาพร้อมระบบ:

| Model ref                            | หมายเหตุ                         |
| ------------------------------------ | -------------------------------- |
| `openrouter/auto`                    | การ route อัตโนมัติของ OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 ผ่าน MoonshotAI        |
| `openrouter/openrouter/healer-alpha` | เส้นทาง OpenRouter Healer Alpha  |
| `openrouter/openrouter/hunter-alpha` | เส้นทาง OpenRouter Hunter Alpha  |

## การสร้างภาพ

OpenRouter ยังสามารถรองรับเครื่องมือ `image_generate` ได้ด้วย ใช้โมเดลภาพของ OpenRouter ภายใต้ `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw จะส่งคำขอสร้างภาพไปยัง chat completions image API ของ OpenRouter พร้อม `modalities: ["image", "text"]` โมเดลภาพของ Gemini จะได้รับ hint ของ `aspectRatio` และ `resolution` ที่รองรับผ่าน `image_config` ของ OpenRouter

## การยืนยันตัวตนและ header

OpenRouter ใช้ Bearer token พร้อม API key ของคุณอยู่เบื้องหลัง

บนคำขอ OpenRouter จริง (`https://openrouter.ai/api/v1`) OpenClaw จะเพิ่ม
header สำหรับ app-attribution ตามที่ OpenRouter ระบุไว้ด้วย:

| Header                    | ค่า                   |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
หากคุณเปลี่ยน OpenRouter provider ให้ชี้ไปยัง proxy หรือ base URL อื่น OpenClaw
จะ **ไม่** inject header เฉพาะของ OpenRouter หรือ Anthropic cache marker เหล่านั้น
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Anthropic cache marker">
    บนเส้นทาง OpenRouter ที่ตรวจสอบแล้ว Anthropic model ref จะยังคงใช้
    `cache_control` marker แบบเฉพาะของ OpenRouter ที่ OpenClaw ใช้เพื่อ
    ให้เกิดการใช้ prompt-cache ซ้ำได้ดีขึ้นบนบล็อก system/developer prompt
  </Accordion>

  <Accordion title="การ inject Thinking / reasoning">
    บนเส้นทางที่รองรับและไม่ใช่ `auto`, OpenClaw จะแมประดับการคิดที่เลือกไปยัง
    reasoning payload ของ proxy OpenRouter hint ของโมเดลที่ไม่รองรับและ
    `openrouter/auto` จะข้ามการ inject reasoning นี้
  </Accordion>

  <Accordion title="การจัดรูปคำขอเฉพาะของ OpenAI">
    OpenRouter ยังคงทำงานผ่านเส้นทางแบบ proxy ที่เข้ากันได้กับ OpenAI ดังนั้น
    การจัดรูปคำขอแบบเนทีฟเฉพาะ OpenAI เช่น `serviceTier`, Responses `store`,
    payload สำหรับ reasoning-compat ของ OpenAI และ hint ของ prompt-cache จะไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="เส้นทางที่รองรับด้วย Gemini">
    OpenRouter ref ที่รองรับด้วย Gemini จะยังคงอยู่บนเส้นทาง proxy-Gemini: OpenClaw จะคง
    การ sanitize thought-signature ของ Gemini ไว้ตรงนั้น แต่จะไม่เปิดใช้ native Gemini
    replay validation หรือ bootstrap rewrite
  </Accordion>

  <Accordion title="metadata สำหรับการ route ของ provider">
    หากคุณส่ง metadata สำหรับการ route ของ provider ของ OpenRouter ผ่าน model params OpenClaw จะส่งต่อมัน
    ในฐานะ routing metadata ของ OpenRouter ก่อนที่ wrapper ของ stream ที่ใช้ร่วมกันจะทำงาน
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงคอนฟิกแบบเต็มสำหรับเอเจนต์ โมเดล และ provider
  </Card>
</CardGroup>
