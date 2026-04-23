---
read_when:
    - คุณต้องการใช้ Groq กับ OpenClaw
    - คุณต้องการ env var ของ API key หรือตัวเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Groq (การยืนยันตัวตน + การเลือกโมเดล)
title: Groq
x-i18n:
    generated_at: "2026-04-23T05:51:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613289efc36fedd002e1ebf9366e0e7119ea1f9e14a1dae773b90ea57100baee
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) ให้บริการ inference ความเร็วสูงมากบนโมเดลโอเพนซอร์ส
(Llama, Gemma, Mistral และอื่น ๆ) โดยใช้ฮาร์ดแวร์ LPU แบบกำหนดเอง OpenClaw เชื่อมต่อ
กับ Groq ผ่าน API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า               |
| --------- | ----------------- |
| ผู้ให้บริการ | `groq`          |
| การยืนยันตัวตน | `GROQ_API_KEY` |
| API       | เข้ากันได้กับ OpenAI |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key">
    สร้าง API key ที่ [console.groq.com/keys](https://console.groq.com/keys)
  </Step>
  <Step title="ตั้งค่า API key">
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

### ตัวอย่างไฟล์คอนฟิก

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

## โมเดลที่มีให้ใช้

แค็ตตาล็อกโมเดลของ Groq เปลี่ยนแปลงบ่อย รัน `openclaw models list | grep groq`
เพื่อดูโมเดลที่มีอยู่ในปัจจุบัน หรือดูที่
[console.groq.com/docs/models](https://console.groq.com/docs/models)

| โมเดล                        | หมายเหตุ                          |
| --------------------------- | --------------------------------- |
| **Llama 3.3 70B Versatile** | ใช้งานทั่วไป, บริบทขนาดใหญ่       |
| **Llama 3.1 8B Instant**    | เร็ว, น้ำหนักเบา                  |
| **Gemma 2 9B**              | กะทัดรัด, มีประสิทธิภาพ          |
| **Mixtral 8x7B**            | สถาปัตยกรรม MoE, ให้เหตุผลได้ดี   |

<Tip>
ใช้ `openclaw models list --provider groq` เพื่อดูรายการโมเดลที่อัปเดตที่สุด
ซึ่งพร้อมใช้งานในบัญชีของคุณ
</Tip>

## การถอดเสียง

Groq ยังให้บริการถอดเสียงแบบ Whisper ที่รวดเร็วด้วย เมื่อถูกตั้งค่าเป็น
ผู้ให้บริการการทำความเข้าใจสื่อ OpenClaw จะใช้โมเดล `whisper-large-v3-turbo`
ของ Groq เพื่อถอดเสียงข้อความเสียงผ่านพื้นผิว `tools.media.audio`
ที่ใช้ร่วมกัน

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
  <Accordion title="รายละเอียดการถอดเสียง">
    | คุณสมบัติ | ค่า |
    |----------|-------|
    | พาธคอนฟิกร่วม | `tools.media.audio` |
    | Base URL เริ่มต้น | `https://api.groq.com/openai/v1` |
    | โมเดลเริ่มต้น | `whisper-large-v3-turbo` |
    | API endpoint | `/audio/transcriptions` แบบเข้ากันได้กับ OpenAI |
  </Accordion>

  <Accordion title="หมายเหตุด้าน environment">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `GROQ_API_KEY` ถูก
    เปิดให้โปรเซสนั้นเข้าถึงได้ (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)

    <Warning>
    key ที่ตั้งไว้เฉพาะใน interactive shell ของคุณจะไม่มองเห็นโดย
    โปรเซส Gateway ที่จัดการโดย daemon ให้ใช้ `~/.openclaw/.env` หรือคอนฟิก
    `env.shellEnv` เพื่อให้พร้อมใช้งานอย่างคงทน
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model ref และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงคอนฟิก" href="/th/gateway/configuration-reference" icon="gear">
    schema คอนฟิกแบบเต็ม รวมถึงการตั้งค่าผู้ให้บริการและเสียง
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    แดชบอร์ด เอกสาร API และราคา ของ Groq
  </Card>
  <Card title="รายการโมเดลของ Groq" href="https://console.groq.com/docs/models" icon="list">
    แค็ตตาล็อกโมเดลอย่างเป็นทางการของ Groq
  </Card>
</CardGroup>
