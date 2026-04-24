---
read_when:
    - คุณต้องการใช้โมเดล Volcano Engine หรือ Doubao กับ OpenClaw
    - คุณต้องการการตั้งค่า API key ของ Volcengine
summary: การตั้งค่า Volcano Engine (โมเดล Doubao, endpoint ทั่วไป + สำหรับเขียนโค้ด)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-24T09:30:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

ผู้ให้บริการ Volcengine ให้การเข้าถึงโมเดล Doubao และโมเดลของบุคคลที่สามที่
โฮสต์บน Volcano Engine โดยมี endpoint แยกสำหรับงานทั่วไปและงานเขียนโค้ด

| รายละเอียด | ค่า |
| --------- | --------------------------------------------------- |
| ผู้ให้บริการ | `volcengine` (ทั่วไป) + `volcengine-plan` (เขียนโค้ด) |
| การยืนยันตัวตน | `VOLCANO_ENGINE_API_KEY` |
| API | เข้ากันได้กับ OpenAI |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    รัน onboarding แบบโต้ตอบ:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    การทำเช่นนี้จะลงทะเบียนทั้งผู้ให้บริการทั่วไป (`volcengine`) และผู้ให้บริการสำหรับเขียนโค้ด (`volcengine-plan`) จาก API key เดียว

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
สำหรับการตั้งค่าแบบไม่โต้ตอบ (CI, การเขียนสคริปต์) ให้ส่งคีย์โดยตรง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## ผู้ให้บริการและ endpoint

| ผู้ให้บริการ | Endpoint | กรณีใช้งาน |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine` | `ark.cn-beijing.volces.com/api/v3` | โมเดลทั่วไป |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | โมเดลสำหรับเขียนโค้ด |

<Note>
ผู้ให้บริการทั้งสองถูกกำหนดค่าจาก API key เดียว การตั้งค่าจะลงทะเบียนทั้งคู่ให้อัตโนมัติ
</Note>

## แค็ตตาล็อกในตัว

<Tabs>
  <Tab title="ทั่วไป (volcengine)">
    | Model ref | ชื่อ | อินพุต | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228` | Doubao Seed 1.8 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127` | Kimi K2.5 | text, image | 256,000 |
    | `volcengine/glm-4-7-251222` | GLM 4.7 | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201` | DeepSeek V3.2 | text, image | 128,000 |
  </Tab>
  <Tab title="สำหรับเขียนโค้ด (volcengine-plan)">
    | Model ref | ชื่อ | อินพุต | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest` | Ark Coding Plan | text | 256,000 |
    | `volcengine-plan/doubao-seed-code` | Doubao Seed Code | text | 256,000 |
    | `volcengine-plan/glm-4.7` | GLM 4.7 Coding | text | 200,000 |
    | `volcengine-plan/kimi-k2-thinking` | Kimi K2 Thinking | text | 256,000 |
    | `volcengine-plan/kimi-k2.5` | Kimi K2.5 Coding | text | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text | 256,000 |
  </Tab>
</Tabs>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โมเดลเริ่มต้นหลัง onboarding">
    ปัจจุบัน `openclaw onboard --auth-choice volcengine-api-key` จะตั้งค่า
    `volcengine-plan/ark-code-latest` เป็นโมเดลเริ่มต้น พร้อมกับลงทะเบียน
    แค็ตตาล็อก `volcengine` สำหรับงานทั่วไปด้วย
  </Accordion>

  <Accordion title="พฤติกรรม fallback ของตัวเลือกโมเดล">
    ระหว่างการเลือกโมเดลใน onboarding/configure ตัวเลือกการยืนยันตัวตนของ Volcengine จะให้ความสำคัญกับ
    แถว `volcengine/*` และ `volcengine-plan/*` ก่อน หากโมเดลเหล่านั้น
    ยังไม่ได้ถูกโหลด OpenClaw จะ fallback ไปใช้แค็ตตาล็อกที่ไม่ถูกกรองแทน
    การแสดงตัวเลือกแบบจำกัดผู้ให้บริการที่ว่างเปล่า
  </Accordion>

  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับโปรเซสเดมอน">
    หาก Gateway ทำงานเป็นเดมอน (launchd/systemd) ให้ตรวจสอบว่า
    `VOLCANO_ENGINE_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>
</AccordionGroup>

<Warning>
เมื่อรัน OpenClaw เป็นบริการเบื้องหลัง ตัวแปรสภาพแวดล้อมที่ตั้งไว้ใน
interactive shell ของคุณจะไม่ถูกสืบทอดโดยอัตโนมัติ ดูหมายเหตุเกี่ยวกับเดมอนด้านบน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config ฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
  <Card title="การแก้ปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
  <Card title="คำถามที่พบบ่อย" href="/th/help/faq" icon="circle-question">
    คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า OpenClaw
  </Card>
</CardGroup>
