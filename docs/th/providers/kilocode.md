---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัวებდნენ to=final
    - คุณต้องการรันโมเดลผ่าน Kilo Gateway ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ Kilo Gateway เพื่อเข้าถึงหลายโมเดลใน OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-23T05:51:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32946f2187f3933115341cbe81006718b10583abc4deea7440b5e56366025f4a
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway ให้บริการ **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังหลายโมเดลภายใต้
endpoint และ API key เดียว มันเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้โดยเปลี่ยน base URL

| Property | Value                              |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | เข้ากันได้กับ OpenAI              |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างบัญชี">
    ไปที่ [app.kilo.ai](https://app.kilo.ai) ลงชื่อเข้าใช้หรือสร้างบัญชี จากนั้นไปที่ API Keys และสร้างคีย์ใหม่
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    หรือตั้งค่าตัวแปรสภาพแวดล้อมโดยตรง:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## โมเดลเริ่มต้น

โมเดลเริ่มต้นคือ `kilocode/kilo/auto` ซึ่งเป็นโมเดล smart-routing ที่ผู้ให้บริการเป็นเจ้าของ
และจัดการโดย Kilo Gateway

<Note>
OpenClaw มอง `kilocode/kilo/auto` เป็น ref เริ่มต้นที่เสถียร แต่ไม่ได้
เผยแพร่การแมประหว่างงานกับโมเดลต้นทางที่มีแหล่งอ้างอิงจาก source สำหรับเส้นทางนั้น การกำหนดเส้นทางไปยังโมเดลต้นทางจริงที่อยู่เบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้ถูก hard-code ไว้ใน OpenClaw
</Note>

## โมเดลที่พร้อมใช้งาน

OpenClaw จะค้นหาโมเดลที่พร้อมใช้งานจาก Kilo Gateway แบบ dynamic ตอนเริ่มต้น ใช้
`/models kilocode` เพื่อดูรายการโมเดลทั้งหมดที่พร้อมใช้งานสำหรับบัญชีของคุณ

โมเดลใดก็ตามที่พร้อมใช้งานบน gateway สามารถใช้ได้ด้วยคำนำหน้า `kilocode/`:

| Model ref                              | Notes                         |
| -------------------------------------- | ----------------------------- |
| `kilocode/kilo/auto`                   | ค่าเริ่มต้น — smart routing  |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic ผ่าน Kilo          |
| `kilocode/openai/gpt-5.4`              | OpenAI ผ่าน Kilo             |
| `kilocode/google/gemini-3-pro-preview` | Google ผ่าน Kilo             |
| ...และอีกมากมาย                       | ใช้ `/models kilocode` เพื่อแสดงทั้งหมด |

<Tip>
ตอนเริ่มต้น OpenClaw จะ query `GET https://api.kilo.ai/api/gateway/models` และ merge
โมเดลที่ค้นพบได้ไว้ก่อน static fallback catalog bundled fallback ที่มาพร้อมกันจะ
รวม `kilocode/kilo/auto` (`Kilo Auto`) ไว้เสมอ พร้อม `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` และ `maxTokens: 128000`
</Tip>

## ตัวอย่าง config

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport และความเข้ากันได้">
    Kilo Gateway ถูกอธิบายไว้ใน source ว่าเข้ากันได้กับ OpenRouter จึงคงอยู่บน
    เส้นทางสไตล์ proxy ที่เข้ากันได้กับ OpenAI แทนการจัดรูปแบบคำขอแบบ native OpenAI

    - Kilo ref ที่ใช้ Gemini เป็นฐานยังคงอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw จึงยังคง
      sanitation ของ Gemini thought-signature ไว้ในเส้นทางนั้น โดยไม่เปิดใช้ native Gemini
      replay validation หรือ bootstrap rewrite
    - ภายใต้การทำงาน Kilo Gateway ใช้ Bearer token พร้อม API key ของคุณ

  </Accordion>

  <Accordion title="Stream wrapper และ reasoning">
    shared stream wrapper ของ Kilo จะเพิ่ม provider app header และ normalize
    proxy reasoning payload สำหรับ concrete model ref ที่รองรับ

    <Warning>
    `kilocode/kilo/auto` และ hint อื่นที่ไม่รองรับ proxy-reasoning จะข้ามการฉีด reasoning
    หากคุณต้องการรองรับ reasoning ให้ใช้ concrete model ref เช่น
    `kilocode/anthropic/claude-sonnet-4`
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากการค้นหาโมเดลล้มเหลวตอนเริ่มต้น OpenClaw จะ fallback ไปใช้ static catalog แบบ bundled ที่มี `kilocode/kilo/auto`
    - ยืนยันว่า API key ของคุณถูกต้อง และบัญชี Kilo ของคุณเปิดใช้โมเดลที่ต้องการแล้ว
    - เมื่อ Gateway รันเป็น daemon ให้แน่ใจว่า `KILOCODE_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model ref และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw แบบเต็ม
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Kilo Gateway, API keys และการจัดการบัญชี
  </Card>
</CardGroup>
