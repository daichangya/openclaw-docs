---
read_when:
    - คุณต้องการเข้าถึงโมเดลที่โฮสต์โดย OpenCode
    - คุณต้องการเลือกระหว่างแค็ตตาล็อก Zen และ Go
summary: ใช้แค็ตตาล็อก OpenCode Zen และ Go กับ OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T09:29:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode เปิดให้ใช้แค็ตตาล็อกที่โฮสต์ไว้ 2 ชุดใน OpenClaw:

| แค็ตตาล็อก | Prefix            | Runtime provider |
| ---------- | ----------------- | ---------------- |
| **Zen**    | `opencode/...`    | `opencode`       |
| **Go**     | `opencode-go/...` | `opencode-go`    |

ทั้งสองแค็ตตาล็อกใช้ OpenCode API key เดียวกัน OpenClaw แยก runtime provider id
ออกจากกันเพื่อให้การกำหนดเส้นทางต่อโมเดลจาก upstream ยังคงถูกต้อง แต่ onboarding และเอกสารจะถือว่า
เป็นการตั้งค่า OpenCode เดียวกัน

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="แค็ตตาล็อก Zen">
    **เหมาะสำหรับ:** พร็อกซีหลายโมเดลแบบคัดสรรของ OpenCode (Claude, GPT, Gemini)

    <Steps>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        หรือส่ง key โดยตรง:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="ตั้งค่าโมเดล Zen เป็นค่าเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="แค็ตตาล็อก Go">
    **เหมาะสำหรับ:** ชุดโมเดล Kimi, GLM และ MiniMax ที่โฮสต์โดย OpenCode

    <Steps>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        หรือส่ง key โดยตรง:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="ตั้งค่าโมเดล Go เป็นค่าเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## ตัวอย่างคอนฟิก

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## แค็ตตาล็อกในตัว

### Zen

| Property         | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime provider | `opencode`                                                              |
| โมเดลตัวอย่าง    | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Property         | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime provider | `opencode-go`                                                            |
| โมเดลตัวอย่าง    | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ชื่อแทนของ API key">
    `OPENCODE_ZEN_API_KEY` รองรับด้วยเช่นกันในฐานะชื่อแทนของ `OPENCODE_API_KEY`
  </Accordion>

  <Accordion title="ข้อมูลรับรองที่ใช้ร่วมกัน">
    การกรอก OpenCode key เพียงตัวเดียวระหว่างการตั้งค่าจะเก็บข้อมูลรับรองไว้ให้ทั้งสอง runtime
    provider คุณไม่จำเป็นต้องทำ onboarding แยกสำหรับแต่ละแค็ตตาล็อก
  </Accordion>

  <Accordion title="การเรียกเก็บเงินและแดชบอร์ด">
    คุณต้องลงชื่อเข้าใช้ OpenCode, เพิ่มรายละเอียดการเรียกเก็บเงิน และคัดลอก API key ของคุณ การเรียกเก็บเงิน
    และความพร้อมใช้งานของแค็ตตาล็อกจะถูกจัดการจากแดชบอร์ด OpenCode
  </Accordion>

  <Accordion title="พฤติกรรมการ replay ของ Gemini">
    ref ของ OpenCode ที่ใช้ Gemini เป็น backend จะยังคงอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw จะยังคง
    ใช้การทำ thought-signature sanitation ของ Gemini ในจุดนั้น โดยไม่เปิดใช้ native Gemini
    replay validation หรือ bootstrap rewrite
  </Accordion>

  <Accordion title="พฤติกรรมการ replay ที่ไม่ใช่ Gemini">
    ref ของ OpenCode ที่ไม่ใช่ Gemini จะคงนโยบาย replay แบบ OpenAI-compatible ขั้นต่ำไว้
  </Accordion>
</AccordionGroup>

<Tip>
การกรอก OpenCode key เพียงตัวเดียวระหว่างการตั้งค่าจะเก็บข้อมูลรับรองไว้ให้ทั้ง Zen และ
Go runtime provider ดังนั้นคุณจึงต้องทำ onboarding เพียงครั้งเดียว
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงคอนฟิกแบบเต็มสำหรับ agents, models และ providers
  </Card>
</CardGroup>
