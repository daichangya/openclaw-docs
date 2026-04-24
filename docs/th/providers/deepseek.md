---
read_when:
    - คุณต้องการใช้ DeepSeek กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมคีย์ API หรือตัวเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า DeepSeek (การยืนยันตัวตน + การเลือกโมเดล)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:22:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) มีโมเดล AI ประสิทธิภาพสูงพร้อม API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า                         |
| -------- | --------------------------- |
| ผู้ให้บริการ | `deepseek`                 |
| การยืนยันตัวตน | `DEEPSEEK_API_KEY`         |
| API      | เข้ากันได้กับ OpenAI        |
| URL พื้นฐาน | `https://api.deepseek.com` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    สร้างคีย์ API ที่ [platform.deepseek.com](https://platform.deepseek.com/api_keys)
  </Step>
  <Step title="เรียกใช้การเริ่มต้นตั้งค่า">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    คำสั่งนี้จะถามหาคีย์ API ของคุณและตั้งค่า `deepseek/deepseek-v4-flash` เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="การตั้งค่าแบบไม่โต้ตอบ">
    สำหรับการติดตั้งแบบสคริปต์หรือแบบไม่มีหน้าจอ ให้ส่งแฟล็กทั้งหมดโดยตรง:

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
หาก Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า `DEEPSEEK_API_KEY`
พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`)
</Warning>

## แค็ตตาล็อกในตัว

| การอ้างอิงโมเดล              | ชื่อ              | อินพุต | คอนเท็กซ์  | เอาต์พุตสูงสุด | หมายเหตุ                                   |
| ---------------------------- | ----------------- | ------ | ---------- | -------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text   | 1,000,000  | 384,000        | โมเดลเริ่มต้น; พื้นผิว V4 ที่รองรับการคิด |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text   | 1,000,000  | 384,000        | พื้นผิว V4 ที่รองรับการคิด                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text   | 131,072    | 8,192          | พื้นผิว V3.2 แบบไม่ใช้การคิดของ DeepSeek   |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text   | 131,072    | 65,536         | พื้นผิว V3.2 ที่เปิดใช้การให้เหตุผล        |

<Tip>
โมเดล V4 รองรับตัวควบคุม `thinking` ของ DeepSeek นอกจากนี้ OpenClaw ยังเล่นซ้ำ
`reasoning_content` ของ DeepSeek ในเทิร์นติดตามผล เพื่อให้เซสชันการคิดที่มีการเรียกใช้เครื่องมือ
ดำเนินต่อไปได้
</Tip>

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าแบบเต็มสำหรับ agents, โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
