---
read_when:
    - คุณต้องการใช้โมเดล Z.AI / GLM ใน OpenClaw
    - คุณต้องการการตั้งค่า `ZAI_API_KEY` แบบง่าย simplicity to=functions.read commentary  ฝ่ายขายรายการjson  万亚娱乐平台主管{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}
summary: ใช้ Z.AI (โมเดล GLM) กับ OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-23T05:54:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 972b467dab141c8c5126ac776b7cb6b21815c27da511b3f34e12bd9e9ac953b7
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI เป็นแพลตฟอร์ม API สำหรับโมเดล **GLM** โดยให้บริการ REST APIs สำหรับ GLM และใช้ API keys
ในการยืนยันตัวตน สร้าง API key ของคุณในคอนโซล Z.AI OpenClaw ใช้ผู้ให้บริการ `zai`
ร่วมกับ Z.AI API key

- ผู้ให้บริการ: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="ตรวจจับ endpoint อัตโนมัติ">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ส่วนใหญ่ OpenClaw จะตรวจจับ Z.AI endpoint ที่ตรงกับคีย์และใช้ base URL ที่ถูกต้องโดยอัตโนมัติ

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="endpoint ตามภูมิภาคแบบ explicit">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ที่ต้องการบังคับใช้ Coding Plan หรือพื้นผิว API ทั่วไปแบบเฉพาะเจาะจง

    <Steps>
      <Step title="เลือก onboarding choice ที่ถูกต้อง">
        ```bash
        # Coding Plan Global (แนะนำสำหรับผู้ใช้ Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (ภูมิภาคจีน)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (ภูมิภาคจีน)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## แค็ตตาล็อก GLM ที่บันเดิลมา

ปัจจุบัน OpenClaw เติมผู้ให้บริการ `zai` ที่บันเดิลมาด้วยรายการต่อไปนี้:

| การอ้างอิงโมเดล            | หมายเหตุ         |
| -------------------- | ------------- |
| `zai/glm-5.1`        | โมเดลเริ่มต้น |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
โมเดล GLM ใช้งานได้ในรูปแบบ `zai/<model>` (ตัวอย่าง: `zai/glm-5`) model ref เริ่มต้นที่บันเดิลมาคือ `zai/glm-5.1`
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การ forward-resolve สำหรับโมเดล GLM-5 ที่ไม่รู้จัก">
    ids แบบ `glm-5*` ที่ไม่รู้จักจะยังคงถูก forward-resolve บนเส้นทางผู้ให้บริการที่บันเดิลมา โดย
    สังเคราะห์ metadata ที่ผู้ให้บริการเป็นเจ้าของจากเทมเพลต `glm-4.7` เมื่อ id
    ตรงกับรูปแบบปัจจุบันของตระกูล GLM-5
  </Accordion>

  <Accordion title="การสตรีม tool-call">
    `tool_stream` เปิดใช้งานอยู่โดยค่าเริ่มต้นสำหรับการสตรีม tool-call ของ Z.AI หากต้องการปิด:

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

  <Accordion title="การทำความเข้าใจภาพ">
    Plugin Z.AI ที่บันเดิลมาจะลงทะเบียนความสามารถด้านการทำความเข้าใจภาพ

    | คุณสมบัติ      | ค่า       |
    | ------------- | ----------- |
    | โมเดล         | `glm-4.6v`  |

    การทำความเข้าใจภาพจะถูก resolve อัตโนมัติจาก auth ของ Z.AI ที่กำหนดค่าไว้ — ไม่
    ต้องตั้งค่าเพิ่มเติม

  </Accordion>

  <Accordion title="รายละเอียดของ Auth">
    - Z.AI ใช้ Bearer auth ร่วมกับ API key ของคุณ
    - onboarding choice แบบ `zai-api-key` จะตรวจจับ Z.AI endpoint ที่ตรงกันจาก prefix ของคีย์โดยอัตโนมัติ
    - ใช้ตัวเลือกตามภูมิภาคแบบ explicit (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) เมื่อคุณต้องการบังคับใช้พื้นผิว API แบบเฉพาะเจาะจง
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ตระกูลโมเดล GLM" href="/th/providers/glm" icon="microchip">
    ภาพรวมตระกูลโมเดลของ GLM
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model refs และพฤติกรรม failover
  </Card>
</CardGroup>
