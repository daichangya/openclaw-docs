---
read_when:
    - คุณต้องการใช้ Z.AI / model GLM ใน OpenClaw
    - คุณต้องการการตั้งค่า `ZAI_API_KEY` แบบง่าย ๆ
summary: ใช้ Z.AI (model GLM) กับ OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T09:30:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI เป็นแพลตฟอร์ม API สำหรับ model **GLM** โดยให้บริการ REST API สำหรับ GLM และใช้ API key
สำหรับการยืนยันตัวตน สร้าง API key ของคุณได้ในคอนโซลของ Z.AI OpenClaw ใช้ provider `zai`
ร่วมกับ API key ของ Z.AI

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="ตรวจจับ endpoint อัตโนมัติ">
    **เหมาะสำหรับ:** ผู้ใช้ส่วนใหญ่ OpenClaw จะตรวจจับ endpoint ของ Z.AI ที่ตรงกับคีย์ และใช้ base URL ที่ถูกต้องโดยอัตโนมัติ

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="ตั้ง model เริ่มต้น">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่า model พร้อมใช้งาน">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="ระบุ endpoint ตามภูมิภาคแบบ explicit">
    **เหมาะสำหรับ:** ผู้ใช้ที่ต้องการบังคับใช้พื้นผิวของ Coding Plan หรือ API ทั่วไปแบบเฉพาะเจาะจง

    <Steps>
      <Step title="เลือกตัวเลือก onboarding ที่ถูกต้อง">
        ```bash
        # Coding Plan Global (แนะนำสำหรับผู้ใช้ Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (ภูมิภาคจีน)
        openclaw onboard --auth-choice zai-coding-cn

        # API ทั่วไป
        openclaw onboard --auth-choice zai-global

        # General API CN (ภูมิภาคจีน)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="ตั้ง model เริ่มต้น">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่า model พร้อมใช้งาน">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## แคตตาล็อกในตัว

ปัจจุบัน OpenClaw ตั้งค่าเริ่มต้นให้ provider `zai` ที่มาพร้อมกันด้วย:

| Model ref            | หมายเหตุ       |
| -------------------- | -------------- |
| `zai/glm-5.1`        | model เริ่มต้น |
| `zai/glm-5`          |                |
| `zai/glm-5-turbo`    |                |
| `zai/glm-5v-turbo`   |                |
| `zai/glm-4.7`        |                |
| `zai/glm-4.7-flash`  |                |
| `zai/glm-4.7-flashx` |                |
| `zai/glm-4.6`        |                |
| `zai/glm-4.6v`       |                |
| `zai/glm-4.5`        |                |
| `zai/glm-4.5-air`    |                |
| `zai/glm-4.5-flash`  |                |
| `zai/glm-4.5v`       |                |

<Tip>
model GLM ใช้งานได้ในรูปแบบ `zai/<model>` (ตัวอย่าง: `zai/glm-5`) ref ของ model แบบ bundled เริ่มต้นคือ `zai/glm-5.1`
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การ forward-resolve สำหรับ model GLM-5 ที่ไม่รู้จัก">
    id แบบ `glm-5*` ที่ไม่รู้จักจะยังคง forward-resolve บนเส้นทาง provider ที่มาพร้อมกันโดย
    สังเคราะห์เมทาดาทาที่เป็นของ provider จากเทมเพลต `glm-4.7` เมื่อ id
    ตรงกับรูปแบบตระกูล GLM-5 ปัจจุบัน
  </Accordion>

  <Accordion title="Tool-call streaming">
    `tool_stream` ถูกเปิดใช้ตามค่าเริ่มต้นสำหรับการสตรีม tool-call ของ Z.AI หากต้องการปิดใช้งาน:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การทำความเข้าใจรูปภาพ">
    Plugin Z.AI ที่มาพร้อมกันลงทะเบียนการทำความเข้าใจรูปภาพไว้

    | คุณสมบัติ      | ค่า         |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    การทำความเข้าใจรูปภาพจะถูก resolve อัตโนมัติจากการยืนยันตัวตน Z.AI ที่กำหนดไว้ —
    ไม่ต้องมี config เพิ่มเติม

  </Accordion>

  <Accordion title="รายละเอียดการยืนยันตัวตน">
    - Z.AI ใช้ Bearer auth ร่วมกับ API key ของคุณ
    - ตัวเลือก onboarding แบบ `zai-api-key` จะตรวจจับ endpoint ของ Z.AI ที่ตรงกับ prefix ของคีย์โดยอัตโนมัติ
    - ใช้ตัวเลือกภูมิภาคแบบ explicit (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) เมื่อต้องการบังคับใช้พื้นผิว API แบบเฉพาะเจาะจง
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ตระกูล model GLM" href="/th/providers/glm" icon="microchip">
    ภาพรวมตระกูล model สำหรับ GLM
  </Card>
  <Card title="การเลือก model" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, ref ของ model และพฤติกรรม failover
  </Card>
</CardGroup>
