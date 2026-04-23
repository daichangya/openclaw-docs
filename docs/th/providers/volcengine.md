---
read_when:
    - คุณต้องการใช้ Volcano Engine หรือโมเดล Doubao กับ OpenClaw to=final
    - คุณต้องการการตั้งค่า Volcengine API key to=final
summary: การตั้งค่า Volcano Engine (โมเดล Doubao, endpoint แบบทั่วไป + สำหรับโค้ด)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T05:53:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: a21f390da719f79c88c6d55a7d952d35c2ce5ff26d910c9f10020132cd7d2f4c
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Volcengine provider ให้เข้าถึงโมเดล Doubao และโมเดลของบุคคลที่สาม
ที่โฮสต์อยู่บน Volcano Engine โดยมี endpoint แยกกันสำหรับงานทั่วไปและ
งานด้านโค้ด

| รายละเอียด | Value                                               |
| ---------- | --------------------------------------------------- |
| Providers  | `volcengine` (ทั่วไป) + `volcengine-plan` (โค้ด)    |
| Auth       | `VOLCANO_ENGINE_API_KEY`                            |
| API        | เข้ากันได้กับ OpenAI                               |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    รัน onboarding แบบโต้ตอบ:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    สิ่งนี้จะ register ทั้ง provider แบบทั่วไป (`volcengine`) และแบบโค้ด (`volcengine-plan`) จาก API key เดียว

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
สำหรับการตั้งค่าแบบไม่โต้ตอบ (CI, สคริปต์) ให้ส่งคีย์โดยตรง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Providers และ endpoints

| Provider          | Endpoint                                  | กรณีใช้งาน     |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | โมเดลทั่วไป     |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | โมเดลสำหรับโค้ด |

<Note>
ทั้งสอง provider ถูกกำหนดค่าจาก API key เดียว การตั้งค่าจะ register ทั้งสองให้อัตโนมัติ
</Note>

## โมเดลที่พร้อมใช้งาน

<Tabs>
  <Tab title="ทั่วไป (volcengine)">
    | Model ref                                    | Name                            | Input       | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="สำหรับโค้ด (volcengine-plan)">
    | Model ref                                         | Name                     | Input | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |
  </Tab>
</Tabs>

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="โมเดลเริ่มต้นหลัง onboarding">
    ปัจจุบัน `openclaw onboard --auth-choice volcengine-api-key` จะตั้ง
    `volcengine-plan/ark-code-latest` เป็นโมเดลเริ่มต้น ขณะเดียวกันก็ register
    แค็ตตาล็อกทั่วไปของ `volcengine` ด้วย
  </Accordion>

  <Accordion title="พฤติกรรม fallback ของตัวเลือกโมเดล">
    ระหว่างการเลือกโมเดลใน onboarding/configure ตัวเลือก auth ของ Volcengine จะให้ความสำคัญกับ
    แถวของทั้ง `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้น
    ยังไม่ได้ถูกโหลด OpenClaw จะ fallback ไปยังแค็ตตาล็อกที่ไม่ถูกกรอง แทนที่จะแสดง
    ตัวเลือกแบบ scoped ตาม provider ที่ว่างเปล่า
  </Accordion>

  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับโปรเซส daemon">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `VOLCANO_ENGINE_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>
</AccordionGroup>

<Warning>
เมื่อรัน OpenClaw เป็นบริการเบื้องหลัง ตัวแปรสภาพแวดล้อมที่ตั้งไว้ใน
interactive shell ของคุณจะไม่ถูกสืบทอดโดยอัตโนมัติ ดูหมายเหตุเรื่อง daemon ด้านบน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model ref และพฤติกรรม failover
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config แบบเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
  <Card title="FAQ" href="/th/help/faq" icon="circle-question">
    คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า OpenClaw
  </Card>
</CardGroup>
