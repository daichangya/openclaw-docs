---
read_when:
    - คุณต้องการใช้ DeepSeek กับ OpenClaw
    - คุณต้องการตัวแปรสภาพแวดล้อมของ API key หรือทางเลือกการยืนยันตัวตนผ่าน CLI to=final
summary: การตั้งค่า DeepSeek (auth + การเลือกโมเดล)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-23T05:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad06880bd1ab89f72f9e31f4927e2c099dcf6b4e0ff2b3fcc91a24468fbc089d
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) ให้บริการโมเดล AI ที่ทรงพลังผ่าน API ที่เข้ากันได้กับ OpenAI

| Property | Value                      |
| -------- | -------------------------- |
| Provider | `deepseek`                 |
| Auth     | `DEEPSEEK_API_KEY`         |
| API      | เข้ากันได้กับ OpenAI      |
| Base URL | `https://api.deepseek.com` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ที่ [platform.deepseek.com](https://platform.deepseek.com/api_keys)
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    สิ่งนี้จะพรอมป์ขอ API key ของคุณ และตั้ง `deepseek/deepseek-chat` เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="การตั้งค่าแบบไม่โต้ตอบ">
    สำหรับการติดตั้งแบบสคริปต์หรือแบบ headless ให้ส่งแฟล็กทั้งหมดโดยตรง:

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
หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `DEEPSEEK_API_KEY`
พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`)
</Warning>

## แค็ตตาล็อกที่มาพร้อมกัน

| Model ref                    | Name              | Input | Context | Max output | Notes                                              |
| ---------------------------- | ----------------- | ----- | ------- | ---------- | -------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072 | 8,192      | โมเดลเริ่มต้น; พื้นผิวแบบ non-thinking ของ DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072 | 65,536     | พื้นผิว V3.2 ที่เปิดใช้ reasoning                  |

<Tip>
ปัจจุบันโมเดล bundled ทั้งสองตัวประกาศความเข้ากันได้กับ streaming usage ไว้ใน source
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
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model ref และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิง config แบบเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
