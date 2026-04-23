---
read_when:
    - คุณต้องการการเข้าถึงโมเดลที่โฮสต์โดย OpenCode
    - คุณต้องการเลือกระหว่างแค็ตตาล็อก Zen และ Go નિવेदन to=functions.read commentary  天天中彩票会json 的天天中彩票{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}
summary: ใช้แค็ตตาล็อก OpenCode Zen และ Go กับ OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-23T05:52:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a68444d8c403c3caba4a18ea47f078c7a4c163f874560e1fad0e818afb6e0e60
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode เปิดให้ใช้แค็ตตาล็อกแบบโฮสต์สองชุดใน OpenClaw:

| แค็ตตาล็อก | Prefix            | Runtime provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

ทั้งสองแค็ตตาล็อกใช้ OpenCode API key เดียวกัน OpenClaw แยก runtime provider ids
ออกจากกันเพื่อให้การกำหนดเส้นทางต่อโมเดลของต้นทางยังถูกต้อง แต่ onboarding และเอกสารจะมองว่าเป็น
การตั้งค่า OpenCode ชุดเดียว

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="แค็ตตาล็อก Zen">
    **เหมาะที่สุดสำหรับ:** OpenCode multi-model proxy แบบ curated (Claude, GPT, Gemini)

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="ตั้งโมเดล Zen เป็นค่าเริ่มต้น">
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
    **เหมาะที่สุดสำหรับ:** ชุดโมเดล Kimi, GLM และ MiniMax ที่โฮสต์โดย OpenCode

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="ตั้งโมเดล Go เป็นค่าเริ่มต้น">
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

## แค็ตตาล็อก

### Zen

| คุณสมบัติ         | ค่า                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime provider | `opencode`                                                              |
| ตัวอย่างโมเดล   | `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro` |

### Go

| คุณสมบัติ         | ค่า                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime provider | `opencode-go`                                                            |
| ตัวอย่างโมเดล   | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="aliases ของ API key">
    `OPENCODE_ZEN_API_KEY` ยังรองรับเป็น alias ของ `OPENCODE_API_KEY` ด้วย
  </Accordion>

  <Accordion title="credentials ที่ใช้ร่วมกัน">
    การกรอก OpenCode key หนึ่งตัวระหว่างการตั้งค่าจะจัดเก็บ credentials สำหรับ runtime
    providers ทั้งสองตัว คุณไม่จำเป็นต้องทำ onboarding แยกสำหรับแต่ละแค็ตตาล็อก
  </Accordion>

  <Accordion title="Billing และแดชบอร์ด">
    คุณจะลงชื่อเข้าใช้ OpenCode เพิ่มรายละเอียด billing และคัดลอก API key ของคุณ Billing
    และความพร้อมใช้งานของแค็ตตาล็อกถูกจัดการจากแดชบอร์ด OpenCode
  </Accordion>

  <Accordion title="พฤติกรรม replay ของ Gemini">
    refs ของ OpenCode ที่ขับเคลื่อนด้วย Gemini จะยังคงอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw จะยังคง
    ใช้การ sanitation ของ Gemini thought-signature ตรงนั้น โดยไม่เปิด native Gemini
    replay validation หรือ bootstrap rewrites
  </Accordion>

  <Accordion title="พฤติกรรม replay ที่ไม่ใช่ Gemini">
    refs ของ OpenCode ที่ไม่ใช่ Gemini จะคงนโยบาย replay แบบ OpenAI-compatible ขั้นต่ำไว้
  </Accordion>
</AccordionGroup>

<Tip>
การกรอก OpenCode key หนึ่งตัวระหว่างการตั้งค่าจะจัดเก็บ credentials สำหรับ runtime providers ทั้ง Zen และ
Go ดังนั้นคุณจึงต้องทำ onboarding เพียงครั้งเดียว
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model refs และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงคอนฟิกฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
