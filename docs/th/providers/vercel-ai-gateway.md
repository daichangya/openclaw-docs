---
read_when:
    - คุณต้องการใช้ Vercel AI Gateway กับ OpenClaw
    - คุณต้องการตัวแปรสภาพแวดล้อมของคีย์ API หรือตัวเลือกการยืนยันตัวตนใน CLI
summary: การตั้งค่า Vercel AI Gateway (การยืนยันตัวตน + การเลือกโมเดล)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-24T09:30:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) ให้ API แบบรวมศูนย์สำหรับ
เข้าถึงโมเดลหลายร้อยรายการผ่าน endpoint เดียว

| คุณสมบัติ      | ค่า                               |
| -------------- | --------------------------------- |
| Provider       | `vercel-ai-gateway`               |
| Auth           | `AI_GATEWAY_API_KEY`              |
| API            | เข้ากันได้กับ Anthropic Messages  |
| แค็ตตาล็อกโมเดล | ค้นพบอัตโนมัติผ่าน `/v1/models`   |

<Tip>
OpenClaw จะค้นพบแค็ตตาล็อก `/v1/models` ของ Gateway โดยอัตโนมัติ ดังนั้น
`/models vercel-ai-gateway` จึงรวม model refs ปัจจุบัน เช่น
`vercel-ai-gateway/openai/gpt-5.5` และ
`vercel-ai-gateway/moonshotai/kimi-k2.6`
</Tip>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    เรียกใช้ onboarding แล้วเลือกตัวเลือก auth ของ AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    เพิ่มโมเดลลงใน config ของ OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## ตัวอย่างแบบไม่โต้ตอบ

สำหรับการตั้งค่าแบบสคริปต์หรือ CI ให้ส่งค่าทั้งหมดผ่านบรรทัดคำสั่ง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## รูปแบบย่อของ Model ID

OpenClaw รองรับ model refs แบบย่อของ Vercel Claude และจะทำให้เป็นรูปแบบมาตรฐานขณะรันไทม์:

| อินพุตแบบย่อ                        | model ref ที่ถูกทำให้เป็นมาตรฐาน                 |
| ----------------------------------- | ------------------------------------------------ |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6`    |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6`    |

<Tip>
คุณสามารถใช้ได้ทั้งรูปแบบย่อหรือ model ref แบบระบุเต็มใน config ของคุณ
OpenClaw จะ resolve ไปยังรูปแบบ canonical โดยอัตโนมัติ
</Tip>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับโปรเซสแบบ daemon">
    หาก OpenClaw Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า
    `AI_GATEWAY_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น

    <Warning>
    คีย์ที่ตั้งค่าไว้เฉพาะใน `~/.profile` จะไม่มองเห็นโดย daemon ของ launchd/systemd
    เว้นแต่จะมีการนำเข้าสภาพแวดล้อมนั้นอย่างชัดเจน ให้ตั้งค่าคีย์ไว้ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส gateway สามารถ
    อ่านได้
    </Warning>

  </Accordion>

  <Accordion title="การกำหนดเส้นทางของ provider">
    Vercel AI Gateway จะกำหนดเส้นทางคำขอไปยังผู้ให้บริการต้นทางตามคำนำหน้าของ model
    ref ตัวอย่างเช่น `vercel-ai-gateway/anthropic/claude-opus-4.6` จะกำหนดเส้นทาง
    ผ่าน Anthropic ขณะที่ `vercel-ai-gateway/openai/gpt-5.5` จะกำหนดเส้นทางผ่าน
    OpenAI และ `vercel-ai-gateway/moonshotai/kimi-k2.6` จะกำหนดเส้นทางผ่าน
    MoonshotAI โดย `AI_GATEWAY_API_KEY` เพียงค่าเดียวของคุณจะจัดการการยืนยันตัวตนสำหรับ
    ผู้ให้บริการต้นทางทั้งหมด
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
