---
read_when:
    - คุณต้องการใช้โมเดล Xiaomi MiMo ใน OpenClaw
    - คุณต้องการการตั้งค่า `XIAOMI_API_KEY`
summary: ใช้โมเดล Xiaomi MiMo กับ OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-23T05:54:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd5a526764c796da7e1fff61301bc2ec618e1cf3857894ba2ef4b6dd9c4dc339
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo คือแพลตฟอร์ม API สำหรับโมเดล **MiMo** OpenClaw ใช้ endpoint แบบ OpenAI-compatible ของ Xiaomi
พร้อมการยืนยันตัวตนด้วย API key

| คุณสมบัติ | ค่า                             |
| --------- | ------------------------------- |
| Provider  | `xiaomi`                        |
| Auth      | `XIAOMI_API_KEY`                |
| API       | OpenAI-compatible               |
| Base URL  | `https://api.xiaomimimo.com/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key">
    สร้าง API key ใน [คอนโซล Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys)
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    หรือส่ง key โดยตรง:

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

## โมเดลที่ใช้ได้

| Model ref              | อินพุต        | บริบท      | เอาต์พุตสูงสุด | Reasoning | หมายเหตุ       |
| ---------------------- | ------------ | ---------- | -------------- | --------- | -------------- |
| `xiaomi/mimo-v2-flash` | text         | 262,144    | 8,192          | ไม่รองรับ | โมเดลเริ่มต้น  |
| `xiaomi/mimo-v2-pro`   | text         | 1,048,576  | 32,000         | รองรับ    | บริบทยาวมาก    |
| `xiaomi/mimo-v2-omni`  | text, image  | 262,144    | 32,000         | รองรับ    | หลายรูปแบบ     |

<Tip>
model ref เริ่มต้นคือ `xiaomi/mimo-v2-flash` provider จะถูกฉีดให้อัตโนมัติเมื่อมีการตั้ง `XIAOMI_API_KEY` หรือมี auth profile อยู่
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
  <Accordion title="พฤติกรรมการฉีดอัตโนมัติ">
    provider `xiaomi` จะถูกฉีดให้อัตโนมัติเมื่อมีการตั้ง `XIAOMI_API_KEY` ในสภาพแวดล้อมของคุณ หรือมี auth profile อยู่ คุณไม่จำเป็นต้องกำหนดค่า provider เอง เว้นแต่คุณต้องการ override metadata ของโมเดลหรือ base URL
  </Accordion>

  <Accordion title="รายละเอียดของโมเดล">
    - **mimo-v2-flash** — เบาและเร็ว เหมาะสำหรับงานข้อความทั่วไป ไม่รองรับ reasoning
    - **mimo-v2-pro** — รองรับ reasoning พร้อม context window 1M token สำหรับงานเอกสารยาว
    - **mimo-v2-omni** — โมเดลหลายรูปแบบที่รองรับ reasoning และรับได้ทั้งอินพุตข้อความและภาพ

    <Note>
    ทุกโมเดลใช้ prefix `xiaomi/` (เช่น `xiaomi/mimo-v2-pro`)
    </Note>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากโมเดลไม่แสดง ให้ยืนยันว่าได้ตั้ง `XIAOMI_API_KEY` แล้วและเป็นค่าที่ถูกต้อง
    - เมื่อ Gateway รันเป็น daemon ให้ตรวจสอบว่า process นั้นเข้าถึง key ได้ (เช่นใน `~/.openclaw/.env` หรือผ่าน config `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะใน interactive shell ของคุณจะมองไม่เห็นสำหรับโปรเซส gateway ที่จัดการโดย daemon ให้ใช้ `~/.openclaw/.env` หรือ config `env.shellEnv` เพื่อให้ใช้งานได้อย่างต่อเนื่อง
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw แบบเต็ม
  </Card>
  <Card title="คอนโซล Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Xiaomi MiMo และการจัดการ API key
  </Card>
</CardGroup>
