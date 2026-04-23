---
read_when:
    - คุณต้องการใช้ Arcee AI กับ OpenClaw
    - คุณต้องการ env var ของ API key หรือตัวเลือก auth ใน CLI
summary: การตั้งค่า Arcee AI (auth + การเลือกโมเดล)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-23T05:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68c5fddbe272c69611257ceff319c4de7ad21134aaf64582d60720a6f3b853cc
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai) ให้การเข้าถึงโมเดลตระกูล Trinity แบบ mixture-of-experts ผ่าน OpenAI-compatible API โดยโมเดล Trinity ทั้งหมดใช้สัญญาอนุญาต Apache 2.0

โมเดลของ Arcee AI สามารถเข้าถึงได้โดยตรงผ่านแพลตฟอร์ม Arcee หรือผ่าน [OpenRouter](/th/providers/openrouter)

| คุณสมบัติ | ค่า                                                                                  |
| -------- | ------------------------------------------------------------------------------------ |
| Provider | `arcee`                                                                              |
| Auth     | `ARCEEAI_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter)              |
| API      | OpenAI-compatible                                                                    |
| Base URL | `https://api.arcee.ai/api/v1` (โดยตรง) หรือ `https://openrouter.ai/api/v1` (OpenRouter) |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="โดยตรง (แพลตฟอร์ม Arcee)">
    <Steps>
      <Step title="รับ API key">
        สร้าง API key ที่ [Arcee AI](https://chat.arcee.ai/)
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="ผ่าน OpenRouter">
    <Steps>
      <Step title="รับ API key">
        สร้าง API key ที่ [OpenRouter](https://openrouter.ai/keys)
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        model refs เดียวกันใช้ได้ทั้งสำหรับการตั้งค่าแบบโดยตรงและแบบ OpenRouter (ตัวอย่างเช่น `arcee/trinity-large-thinking`)
      </Step>
    </Steps>

  </Tab>
</Tabs>

## การตั้งค่าแบบไม่โต้ตอบ

<Tabs>
  <Tab title="โดยตรง (แพลตฟอร์ม Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="ผ่าน OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## แค็ตตาล็อกที่มีมาในตัว

ขณะนี้ OpenClaw มาพร้อมแค็ตตาล็อก Arcee แบบ bundled ดังนี้:

| Model ref                      | ชื่อ                   | อินพุต | บริบท | ค่าใช้จ่าย (in/out ต่อ 1M) | หมายเหตุ                                   |
| ------------------------------ | ---------------------- | ------ | ------ | --------------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text   | 256K   | $0.25 / $0.90               | โมเดลเริ่มต้น; เปิดใช้ reasoning          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text   | 128K   | $0.25 / $1.00               | ใช้งานทั่วไป; 400B params, 13B active     |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text   | 128K   | $0.045 / $0.15              | เร็วและคุ้มค่า; function calling          |

<Tip>
preset ของ onboarding จะตั้ง `arcee/trinity-large-thinking` เป็นโมเดลเริ่มต้น
</Tip>

## ฟีเจอร์ที่รองรับ

| ฟีเจอร์                                      | รองรับ                        |
| -------------------------------------------- | ----------------------------- |
| การสตรีม                                     | ใช่                           |
| การใช้เครื่องมือ / function calling         | ใช่                           |
| Structured output (JSON mode และ JSON schema) | ใช่                           |
| Extended thinking                            | ใช่ (Trinity Large Thinking)  |

<AccordionGroup>
  <Accordion title="หมายเหตุเรื่อง Environment">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้แน่ใจว่า `ARCEEAI_API_KEY`
    (หรือ `OPENROUTER_API_KEY`) พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>

  <Accordion title="การกำหนดเส้นทางของ OpenRouter">
    เมื่อใช้โมเดล Arcee ผ่าน OpenRouter ก็ยังใช้ model refs แบบ `arcee/*` เดิมได้
    OpenClaw จะจัดการการกำหนดเส้นทางอย่างโปร่งใสตาม auth choice ของคุณ ดู
    [เอกสาร provider ของ OpenRouter](/th/providers/openrouter) สำหรับ
    รายละเอียดการตั้งค่าเฉพาะของ OpenRouter
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/th/providers/openrouter" icon="shuffle">
    เข้าถึงโมเดล Arcee และอีกมากมายผ่าน API key เดียว
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
</CardGroup>
