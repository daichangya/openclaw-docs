---
read_when:
    - คุณต้องการใช้โมเดล GLM ใน OpenClaw
    - คุณต้องการรูปแบบการตั้งชื่อโมเดลและการตั้งค่า
summary: ภาพรวมของตระกูลโมเดล GLM + วิธีใช้งานใน OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-23T05:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b38f0896c900fae3cf3458ff99938d73fa46973a057d1dd373ae960cb7d2e9b5
    source_path: providers/glm.md
    workflow: 15
---

# โมเดล GLM

GLM เป็น **ตระกูลโมเดล** (ไม่ใช่บริษัท) ที่ใช้งานได้ผ่านแพลตฟอร์ม Z.AI ใน OpenClaw โมเดล
GLM จะเข้าถึงผ่าน provider `zai` และ model ID เช่น `zai/glm-5`

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เลือกเส้นทาง auth และรัน onboarding">
    เลือกตัวเลือก onboarding ที่ตรงกับแผนและ region ของ Z.AI ของคุณ:

    | ตัวเลือก auth | เหมาะที่สุดสำหรับ |
    | ------------- | ------------------ |
    | `zai-api-key` | การตั้งค่า API key ทั่วไปพร้อมการตรวจจับ endpoint อัตโนมัติ |
    | `zai-coding-global` | ผู้ใช้ Coding Plan (global) |
    | `zai-coding-cn` | ผู้ใช้ Coding Plan (China region) |
    | `zai-global` | General API (global) |
    | `zai-cn` | General API (China region) |

    ```bash
    # ตัวอย่าง: ตรวจจับอัตโนมัติแบบทั่วไป
    openclaw onboard --auth-choice zai-api-key

    # ตัวอย่าง: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="ตั้ง GLM เป็นโมเดลเริ่มต้น">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## ตัวอย่าง config

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` ให้ OpenClaw ตรวจจับ endpoint ของ Z.AI ที่ตรงกับคีย์ และ
ใช้ base URL ที่ถูกต้องให้อัตโนมัติ ใช้ตัวเลือก region แบบชัดเจนเมื่อ
คุณต้องการบังคับให้ใช้พื้นผิว Coding Plan หรือ General API ที่ระบุ
</Tip>

## โมเดล GLM ที่มากับระบบ

ปัจจุบัน OpenClaw เติม provider `zai` ที่มากับระบบด้วย ref ของ GLM ต่อไปนี้:

| โมเดล           | โมเดล            |
| ---------------- | ---------------- |
| `glm-5.1`        | `glm-4.7`        |
| `glm-5`          | `glm-4.7-flash`  |
| `glm-5-turbo`    | `glm-4.7-flashx` |
| `glm-5v-turbo`   | `glm-4.6`        |
| `glm-4.5`        | `glm-4.6v`       |
| `glm-4.5-air`    |                  |
| `glm-4.5-flash`  |                  |
| `glm-4.5v`       |                  |

<Note>
ref ของโมเดลที่มากับระบบโดยค่าเริ่มต้นคือ `zai/glm-5.1` เวอร์ชันและความพร้อมใช้งานของ GLM
อาจเปลี่ยนแปลงได้; โปรดดูเอกสารของ Z.AI สำหรับข้อมูลล่าสุด
</Note>

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="การตรวจจับ endpoint อัตโนมัติ">
    เมื่อคุณใช้ตัวเลือก auth แบบ `zai-api-key`, OpenClaw จะตรวจสอบรูปแบบของคีย์
    เพื่อกำหนด base URL ของ Z.AI ที่ถูกต้อง ตัวเลือก region แบบชัดเจน
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) จะ override
    การตรวจจับอัตโนมัติและ pin endpoint โดยตรง
  </Accordion>

  <Accordion title="รายละเอียดของ provider">
    โมเดล GLM ถูกให้บริการโดย runtime provider `zai` สำหรับการกำหนดค่า provider
    แบบเต็ม endpoint ตาม region และความสามารถเพิ่มเติม โปรดดู
    [เอกสาร provider ของ Z.AI](/th/providers/zai)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Z.AI provider" href="/th/providers/zai" icon="server">
    การกำหนดค่า Z.AI provider แบบเต็มและ endpoint ตาม region
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
</CardGroup>
