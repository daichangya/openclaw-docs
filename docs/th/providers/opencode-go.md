---
read_when:
    - คุณต้องการแคตตาล็อก OpenCode Go
    - คุณต้องการ ref ของ model ใน runtime สำหรับ model ที่โฮสต์โดย Go
summary: ใช้แคตตาล็อก OpenCode Go ร่วมกับการตั้งค่า OpenCode แบบใช้ร่วมกัน
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-24T09:28:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go คือแคตตาล็อก Go ภายใน [OpenCode](/th/providers/opencode)
โดยใช้ `OPENCODE_API_KEY` เดียวกับแคตตาล็อก Zen แต่คง runtime
provider id เป็น `opencode-go` เพื่อให้การกำหนดเส้นทางต่อ model ของต้นทางยังถูกต้อง

| คุณสมบัติ        | ค่า                            |
| ---------------- | ------------------------------ |
| Runtime provider | `opencode-go`                  |
| Auth             | `OPENCODE_API_KEY`             |
| Parent setup     | [OpenCode](/th/providers/opencode) |

## แคตตาล็อกในตัว

OpenClaw ดึงแคตตาล็อก Go จาก pi model registry ที่มาพร้อมกัน รัน
`openclaw models list --provider opencode-go` เพื่อดูรายการ model ปัจจุบัน

ณ แคตตาล็อก pi ที่มาพร้อมกัน provider นี้มี:

| Model ref                  | ชื่อ                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (ขีดจำกัด 3 เท่า) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="ตั้ง model Go เป็นค่าเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="ตรวจสอบว่า model พร้อมใช้งาน">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="ส่งคีย์โดยตรง">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่า model พร้อมใช้งาน">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## ตัวอย่าง config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมการกำหนดเส้นทาง">
    OpenClaw จัดการการกำหนดเส้นทางต่อ model โดยอัตโนมัติเมื่อ model ref ใช้
    `opencode-go/...` โดยไม่ต้องมี config ของ provider เพิ่มเติม
  </Accordion>

  <Accordion title="รูปแบบ runtime ref">
    runtime ref จะคงความชัดเจนไว้: `opencode/...` สำหรับ Zen, `opencode-go/...` สำหรับ Go
    ซึ่งช่วยให้การกำหนดเส้นทางต่อ model ของต้นทางถูกต้องในทั้งสองแคตตาล็อก
  </Accordion>

  <Accordion title="credential ที่ใช้ร่วมกัน">
    ทั้งแคตตาล็อก Zen และ Go ใช้ `OPENCODE_API_KEY` เดียวกัน เมื่อกรอก
    คีย์ระหว่างการตั้งค่า ระบบจะจัดเก็บ credential ให้ทั้ง runtime provider ทั้งสองตัว
  </Accordion>
</AccordionGroup>

<Tip>
ดู [OpenCode](/th/providers/opencode) สำหรับภาพรวมการ onboarding แบบใช้ร่วมกัน และข้อมูลอ้างอิงแคตตาล็อก Zen + Go แบบเต็ม
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenCode (แม่แบบ)" href="/th/providers/opencode" icon="server">
    การ onboarding แบบใช้ร่วมกัน ภาพรวมแคตตาล็อก และหมายเหตุขั้นสูง
  </Card>
  <Card title="การเลือก model" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, ref ของ model และพฤติกรรม failover
  </Card>
</CardGroup>
