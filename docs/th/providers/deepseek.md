---
read_when:
    - คุณต้องการใช้ DeepSeek กับ OpenClaw
    - คุณต้องการตัวแปรสภาพแวดล้อมสำหรับ API key หรือตัวเลือกการยืนยันตัวตนใน CLI
summary: การตั้งค่า DeepSeek (การยืนยันตัวตน + การเลือก model)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T09:27:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) ให้บริการ AI model ประสิทธิภาพสูงผ่าน API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า                         |
| -------- | --------------------------- |
| Provider | `deepseek`                  |
| Auth     | `DEEPSEEK_API_KEY`          |
| API      | เข้ากันได้กับ OpenAI        |
| Base URL | `https://api.deepseek.com`  |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ได้ที่ [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="รันการ onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    ระบบจะขอ API key ของคุณ และตั้ง `deepseek/deepseek-chat` เป็น model เริ่มต้น

  </Step>
  <Step title="ตรวจสอบว่า model พร้อมใช้งาน">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="การตั้งค่าแบบ non-interactive">
    สำหรับการติดตั้งแบบสคริปต์หรือแบบไม่มีหน้าจอ ให้ส่งทุก flag โดยตรง:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
หาก Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบว่า process นั้น
สามารถเข้าถึง `DEEPSEEK_API_KEY` ได้ (เช่น ใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`)
</Warning>

## แคตตาล็อกในตัว

| Model ref                    | ชื่อ               | อินพุต | คอนเท็กซ์ | เอาต์พุตสูงสุด | หมายเหตุ                                            |
| ---------------------------- | ------------------ | ------ | --------- | -------------- | --------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat      | text   | 131,072   | 8,192          | model เริ่มต้น; พื้นผิว DeepSeek V3.2 แบบไม่ใช้การคิด |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner  | text   | 131,072   | 65,536         | พื้นผิว V3.2 ที่เปิดใช้ reasoning                    |

<Tip>
ปัจจุบันทั้งสอง model ที่มาพร้อมกันประกาศความเข้ากันได้กับ streaming usage ในซอร์ส
</Tip>

## ตัวอย่าง config

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือก model" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, ref ของ model และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิง config แบบเต็มสำหรับ agent, model และ provider
  </Card>
</CardGroup>
