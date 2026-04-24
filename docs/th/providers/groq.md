---
read_when:
    - คุณต้องการใช้ Groq กับ OpenClaw
    - คุณต้องการตัวแปรสภาพแวดล้อมของคีย์ API หรือตัวเลือกการยืนยันตัวตนใน CLI
summary: การตั้งค่า Groq (การยืนยันตัวตน + การเลือกโมเดล)
title: Groq
x-i18n:
    generated_at: "2026-04-24T09:28:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) ให้บริการการอนุมานที่รวดเร็วมากบนโมเดลโอเพนซอร์ส
(Llama, Gemma, Mistral และอื่น ๆ) โดยใช้ฮาร์ดแวร์ LPU แบบกำหนดเอง OpenClaw เชื่อมต่อ
กับ Groq ผ่าน API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า                |
| --------- | ------------------ |
| Provider  | `groq`             |
| Auth      | `GROQ_API_KEY`     |
| API       | เข้ากันได้กับ OpenAI |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ที่ [console.groq.com/keys](https://console.groq.com/keys)
  </Step>
  <Step title="ตั้งค่าคีย์ API">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### ตัวอย่างไฟล์ config

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## แค็ตตาล็อกที่มาพร้อมระบบ

แค็ตตาล็อกโมเดลของ Groq เปลี่ยนแปลงบ่อย ให้รัน `openclaw models list | grep groq`
เพื่อดูโมเดลที่พร้อมใช้งานในขณะนี้ หรือดูได้ที่
[console.groq.com/docs/models](https://console.groq.com/docs/models)

| โมเดล                       | หมายเหตุ                            |
| --------------------------- | ----------------------------------- |
| **Llama 3.3 70B Versatile** | ใช้งานทั่วไป, context ขนาดใหญ่      |
| **Llama 3.1 8B Instant**    | รวดเร็ว, น้ำหนักเบา                 |
| **Gemma 2 9B**              | กะทัดรัด, มีประสิทธิภาพ            |
| **Mixtral 8x7B**            | สถาปัตยกรรม MoE, ให้เหตุผลได้ดี     |

<Tip>
ใช้ `openclaw models list --provider groq` เพื่อดูรายการโมเดลที่อัปเดตที่สุด
ที่มีให้ใช้ในบัญชีของคุณ
</Tip>

## การถอดเสียงจากเสียง

Groq ยังให้บริการถอดเสียงจากเสียงด้วย Whisper ที่รวดเร็วอีกด้วย เมื่อกำหนดค่าให้เป็น
provider สำหรับ media-understanding OpenClaw จะใช้โมเดล `whisper-large-v3-turbo`
ของ Groq เพื่อถอดเสียงข้อความเสียงผ่านพื้นผิว `tools.media.audio`
แบบใช้ร่วมกัน

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="รายละเอียดการถอดเสียงจากเสียง">
    | คุณสมบัติ | ค่า |
    |----------|-------|
    | เส้นทาง config ที่ใช้ร่วมกัน | `tools.media.audio` |
    | Base URL เริ่มต้น            | `https://api.groq.com/openai/v1` |
    | โมเดลเริ่มต้น                | `whisper-large-v3-turbo` |
    | API endpoint                | `/audio/transcriptions` แบบเข้ากันได้กับ OpenAI |
  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า `GROQ_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งค่าไว้เฉพาะใน shell แบบโต้ตอบของคุณจะมองไม่เห็นสำหรับโปรเซส gateway
    ที่ถูกจัดการโดย daemon ให้ใช้ `~/.openclaw/.env` หรือ config `env.shellEnv`
    เพื่อให้พร้อมใช้งานอย่างต่อเนื่อง
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema ของ config แบบเต็ม รวมถึงการตั้งค่า provider และเสียง
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Groq, เอกสาร API และราคา
  </Card>
  <Card title="รายการโมเดลของ Groq" href="https://console.groq.com/docs/models" icon="list">
    แค็ตตาล็อกโมเดลอย่างเป็นทางการของ Groq
  </Card>
</CardGroup>
