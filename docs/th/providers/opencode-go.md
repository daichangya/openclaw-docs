---
read_when:
    - คุณต้องการแค็ตตาล็อก OpenCode Go
    - คุณต้องการ model ref สำหรับ runtime ของโมเดลที่โฮสต์ด้วย Go
summary: ใช้แค็ตตาล็อก OpenCode Go ร่วมกับการตั้งค่า OpenCode แบบใช้ร่วมกัน
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-23T05:52:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go คือแค็ตตาล็อก Go ภายใน [OpenCode](/th/providers/opencode)
มันใช้ `OPENCODE_API_KEY` เดียวกับแค็ตตาล็อก Zen แต่คง runtime
provider id เป็น `opencode-go` เพื่อให้การกำหนดเส้นทางรายโมเดลฝั่งต้นทางยังคงถูกต้อง

| คุณสมบัติ        | ค่า                            |
| ---------------- | ------------------------------ |
| Runtime provider | `opencode-go`                  |
| Auth             | `OPENCODE_API_KEY`             |
| Parent setup     | [OpenCode](/th/providers/opencode) |

## โมเดลที่รองรับ

OpenClaw ดึงแค็ตตาล็อก Go มาจาก bundled pi model registry ให้รัน
`openclaw models list --provider opencode-go` เพื่อดูรายการโมเดลล่าสุด

ตามแค็ตตาล็อก pi ที่ bundled มา ผู้ให้บริการนี้มี:

| Model ref                  | ชื่อ                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (ขีดจำกัด 3x) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="โต้ตอบได้">
    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
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

  <Tab title="ไม่โต้ตอบ">
    <Steps>
      <Step title="ส่งคีย์โดยตรง">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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

## ตัวอย่าง config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมการกำหนดเส้นทาง">
    OpenClaw จัดการการกำหนดเส้นทางรายโมเดลให้อัตโนมัติเมื่อ model ref ใช้
    `opencode-go/...` โดยไม่ต้องมี provider config เพิ่มเติม
  </Accordion>

  <Accordion title="รูปแบบ runtime ref">
    runtime ref ยังคงชัดเจน: `opencode/...` สำหรับ Zen, `opencode-go/...` สำหรับ Go
    วิธีนี้ทำให้การกำหนดเส้นทางรายโมเดลฝั่งต้นทางยังถูกต้องข้ามทั้งสองแค็ตตาล็อก
  </Accordion>

  <Accordion title="ข้อมูลรับรองที่ใช้ร่วมกัน">
    ใช้ `OPENCODE_API_KEY` เดียวกันทั้งในแค็ตตาล็อก Zen และ Go เมื่อกรอก
    คีย์ระหว่างการตั้งค่า ระบบจะเก็บข้อมูลรับรองไว้ให้ทั้งสอง runtime provider
  </Accordion>
</AccordionGroup>

<Tip>
ดู [OpenCode](/th/providers/opencode) สำหรับภาพรวมการ onboarding แบบใช้ร่วมกัน และ
เอกสารอ้างอิงแค็ตตาล็อก Zen + Go แบบเต็ม
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenCode (หลัก)" href="/th/providers/opencode" icon="server">
    การ onboarding แบบใช้ร่วมกัน ภาพรวมแค็ตตาล็อก และหมายเหตุขั้นสูง
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
</CardGroup>
