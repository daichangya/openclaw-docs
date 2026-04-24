---
read_when:
    - คุณต้องการใช้ model GLM ใน OpenClaw
    - คุณต้องการรูปแบบการตั้งชื่อ model และการตั้งค่า
summary: ภาพรวมตระกูล model GLM + วิธีใช้งานใน OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-24T09:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# model GLM

GLM เป็น **ตระกูล model** (ไม่ใช่บริษัท) ที่ใช้งานได้ผ่านแพลตฟอร์ม Z.AI ใน OpenClaw จะเข้าถึง model GLM ผ่าน provider `zai` และ model ID เช่น `zai/glm-5`

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เลือกเส้นทางการยืนยันตัวตนและรัน onboarding">
    เลือกตัวเลือก onboarding ให้ตรงกับแผนและภูมิภาค Z.AI ของคุณ:

    | ตัวเลือก Auth | เหมาะสำหรับ |
    | ----------- | -------- |
    | `zai-api-key` | การตั้งค่าแบบ API key ทั่วไปพร้อมการตรวจจับ endpoint อัตโนมัติ |
    | `zai-coding-global` | ผู้ใช้ Coding Plan (global) |
    | `zai-coding-cn` | ผู้ใช้ Coding Plan (ภูมิภาคจีน) |
    | `zai-global` | API ทั่วไป (global) |
    | `zai-cn` | API ทั่วไป (ภูมิภาคจีน) |

    ```bash
    # ตัวอย่าง: ตรวจจับอัตโนมัติแบบทั่วไป
    openclaw onboard --auth-choice zai-api-key

    # ตัวอย่าง: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="ตั้ง GLM เป็น model เริ่มต้น">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="ตรวจสอบว่า model พร้อมใช้งาน">
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
`zai-api-key` ช่วยให้ OpenClaw ตรวจจับ endpoint ของ Z.AI ที่ตรงกับคีย์ และใช้ base URL ที่ถูกต้องโดยอัตโนมัติ ใช้ตัวเลือกภูมิภาคแบบ explicit เมื่อคุณต้องการบังคับให้ใช้พื้นผิวของ Coding Plan หรือ API ทั่วไปแบบเฉพาะเจาะจง
</Tip>

## แคตตาล็อกในตัว

ปัจจุบัน OpenClaw ตั้งค่าเริ่มต้นให้ provider `zai` ที่มาพร้อมกันด้วย ref ของ GLM เหล่านี้:

| Model           | Model            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
ref ของ model แบบ bundled เริ่มต้นคือ `zai/glm-5.1` เวอร์ชันและความพร้อมใช้งานของ GLM อาจเปลี่ยนแปลงได้; โปรดตรวจสอบเอกสารของ Z.AI สำหรับข้อมูลล่าสุด
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การตรวจจับ endpoint อัตโนมัติ">
    เมื่อคุณใช้ตัวเลือกการยืนยันตัวตน `zai-api-key` OpenClaw จะตรวจสอบรูปแบบของคีย์
    เพื่อกำหนด base URL ของ Z.AI ที่ถูกต้อง ตัวเลือกภูมิภาคแบบ explicit
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) จะ override
    การตรวจจับอัตโนมัติและตรึง endpoint โดยตรง
  </Accordion>

  <Accordion title="รายละเอียดของ provider">
    model GLM จะถูกให้บริการโดย runtime provider `zai` สำหรับการกำหนดค่า provider
    แบบเต็ม endpoint ตามภูมิภาค และความสามารถเพิ่มเติม โปรดดู
    [เอกสาร provider ของ Z.AI](/th/providers/zai)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="provider Z.AI" href="/th/providers/zai" icon="server">
    การกำหนดค่า provider ของ Z.AI แบบเต็มและ endpoint ตามภูมิภาค
  </Card>
  <Card title="การเลือก model" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, ref ของ model และพฤติกรรม failover
  </Card>
</CardGroup>
