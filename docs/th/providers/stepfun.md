---
read_when:
    - คุณต้องการโมเดล StepFun ใน OpenClaw to=final
    - คุณต้องการคำแนะนำในการตั้งค่า StepFun to=final
summary: ใช้โมเดล StepFun กับ OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-23T05:53:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a463bed0951d33802dcdb3a7784406272ee206b731e9864ea020323e67b4d159
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw มี StepFun provider plugin แบบ bundled พร้อม provider id สองตัว:

- `stepfun` สำหรับ endpoint มาตรฐาน
- `stepfun-plan` สำหรับ endpoint ของ Step Plan

<Warning>
Standard และ Step Plan เป็น **ผู้ให้บริการแยกกัน** โดยมี endpoint และคำนำหน้า model ref ต่างกัน (`stepfun/...` เทียบกับ `stepfun-plan/...`) ใช้คีย์ China กับ endpoint แบบ `.com` และใช้คีย์ global กับ endpoint แบบ `.ai`
</Warning>

## ภาพรวมของ region และ endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Auth env var: `STEPFUN_API_KEY`

## แค็ตตาล็อกที่มาพร้อมกัน

Standard (`stepfun`):

| Model ref                | Context | Max output | Notes                    |
| ------------------------ | ------- | ---------- | ------------------------ |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | โมเดลมาตรฐานเริ่มต้น     |

Step Plan (`stepfun-plan`):

| Model ref                          | Context | Max output | Notes                         |
| ---------------------------------- | ------- | ---------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | โมเดล Step Plan เริ่มต้น      |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | โมเดล Step Plan เพิ่มเติม      |

## เริ่มต้นใช้งาน

เลือกพื้นผิว provider ของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Standard">
    **เหมาะที่สุดสำหรับ:** การใช้งานทั่วไปผ่าน endpoint มาตรฐานของ StepFun

    <Steps>
      <Step title="เลือก region ของ endpoint">
        | ตัวเลือก auth                    | Endpoint                         | Region        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | International |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        หรือสำหรับ endpoint ของจีน:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="ทางเลือกแบบไม่โต้ตอบ">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Model refs

    - โมเดลเริ่มต้น: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **เหมาะที่สุดสำหรับ:** endpoint ด้าน reasoning ของ Step Plan

    <Steps>
      <Step title="เลือก region ของ endpoint">
        | ตัวเลือก auth                  | Endpoint                                | Region        |
        | ------------------------------ | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`    | `https://api.stepfun.ai/step_plan/v1`  | International |
        | `stepfun-plan-api-key-cn`      | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        หรือสำหรับ endpoint ของจีน:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="ทางเลือกแบบไม่โต้ตอบ">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Model refs

    - โมเดลเริ่มต้น: `stepfun-plan/step-3.5-flash`
    - โมเดลทางเลือก: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## ขั้นสูง

<AccordionGroup>
  <Accordion title="config แบบเต็ม: Standard provider">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="config แบบเต็ม: Step Plan provider">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="หมายเหตุ">
    - provider นี้มาพร้อมกับ OpenClaw ดังนั้นจึงไม่มีขั้นตอนติดตั้ง Plugin แยก
    - ปัจจุบัน `step-3.5-flash-2603` เปิดเผยเฉพาะบน `stepfun-plan`
    - flow auth เดียวจะเขียนโปรไฟล์ที่จับคู่กับ region ให้ทั้ง `stepfun` และ `stepfun-plan` ทำให้ค้นพบทั้งสองพื้นผิวได้พร้อมกัน
    - ใช้ `openclaw models list` และ `openclaw models set <provider/model>` เพื่อตรวจสอบหรือสลับโมเดล
  </Accordion>
</AccordionGroup>

<Note>
สำหรับภาพรวมที่กว้างกว่าของผู้ให้บริการ ดู [Model providers](/th/concepts/model-providers)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด, model ref และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema ของ config แบบเต็มสำหรับผู้ให้บริการ โมเดล และ Plugins
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    การจัดการ StepFun API key และเอกสารประกอบ
  </Card>
</CardGroup>
