---
read_when:
    - คุณต้องการใช้โมเดล Xiaomi MiMo ใน OpenClaw
    - คุณต้องการการตั้งค่า `XIAOMI_API_KEY`
summary: ใช้โมเดล Xiaomi MiMo กับ OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-24T09:30:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae61547fa5864f0cd3e19465a8a7d6ff843f9534ab9c2dd39a86a3593cafaa8d
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo คือแพลตฟอร์ม API สำหรับโมเดล **MiMo** OpenClaw ใช้
endpoint แบบเข้ากันได้กับ OpenAI ของ Xiaomi พร้อมการยืนยันตัวตนด้วยคีย์ API

| คุณสมบัติ | ค่า                            |
| --------- | ------------------------------ |
| Provider  | `xiaomi`                       |
| Auth      | `XIAOMI_API_KEY`               |
| API       | เข้ากันได้กับ OpenAI           |
| Base URL  | `https://api.xiaomimimo.com/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ใน [คอนโซล Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys)
  </Step>
  <Step title="เรียกใช้ onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    หรือส่งคีย์โดยตรง:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## แค็ตตาล็อกที่มาพร้อมระบบ

| Model ref              | อินพุต      | Context   | เอาต์พุตสูงสุด | Reasoning | หมายเหตุ       |
| ---------------------- | ----------- | --------- | -------------- | --------- | -------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192          | ไม่        | โมเดลเริ่มต้น   |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000         | ใช่        | context ขนาดใหญ่ |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000         | ใช่        | หลายรูปแบบ      |

<Tip>
model ref เริ่มต้นคือ `xiaomi/mimo-v2-flash` provider จะถูก inject โดยอัตโนมัติเมื่อมีการตั้งค่า `XIAOMI_API_KEY` หรือมี auth profile อยู่แล้ว
</Tip>

## ตัวอย่าง config

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="พฤติกรรมการ inject อัตโนมัติ">
    provider `xiaomi` จะถูก inject โดยอัตโนมัติเมื่อมีการตั้งค่า `XIAOMI_API_KEY` ในสภาพแวดล้อมของคุณ หรือมี auth profile อยู่แล้ว คุณไม่จำเป็นต้องกำหนดค่า provider ด้วยตนเอง เว้นแต่ต้องการ override metadata ของโมเดลหรือ base URL
  </Accordion>

  <Accordion title="รายละเอียดของโมเดล">
    - **mimo-v2-flash** — น้ำหนักเบาและรวดเร็ว เหมาะสำหรับงานข้อความทั่วไป ไม่รองรับ reasoning
    - **mimo-v2-pro** — รองรับ reasoning พร้อม context window ขนาด 1M โทเค็นสำหรับงานเอกสารยาว
    - **mimo-v2-omni** — โมเดลหลายรูปแบบที่เปิดใช้ reasoning และรับได้ทั้งข้อความและภาพ

    <Note>
    ทุกโมเดลใช้คำนำหน้า `xiaomi/` (เช่น `xiaomi/mimo-v2-pro`)
    </Note>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากไม่พบโมเดล ให้ยืนยันว่าได้ตั้งค่า `XIAOMI_API_KEY` แล้วและคีย์นั้นใช้ได้
    - เมื่อ Gateway ทำงานเป็น daemon ให้ตรวจสอบว่าคีย์พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งค่าไว้เฉพาะใน shell แบบโต้ตอบของคุณจะมองไม่เห็นสำหรับโปรเซส gateway ที่ถูกจัดการโดย daemon ให้ใช้ `~/.openclaw/.env` หรือ config `env.shellEnv` เพื่อให้พร้อมใช้งานอย่างต่อเนื่อง
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการตั้งค่า OpenClaw แบบเต็ม
  </Card>
  <Card title="คอนโซล Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Xiaomi MiMo และการจัดการคีย์ API
  </Card>
</CardGroup>
