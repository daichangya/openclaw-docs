---
read_when:
    - คุณต้องการใช้ Fireworks กับ OpenClaw
    - คุณต้องการตัวแปรสภาพแวดล้อมของ Fireworks API key หรือ model id เริ่มต้น
summary: การตั้งค่า Fireworks (auth + การเลือกโมเดล)
title: Fireworks
x-i18n:
    generated_at: "2026-04-23T05:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) เปิดให้ใช้โมเดลแบบ open-weight และโมเดลแบบ routed ผ่าน API ที่เข้ากันได้กับ OpenAI OpenClaw มี Fireworks provider plugin แบบ bundled มาให้

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions ที่เข้ากันได้กับ OpenAI              |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| โมเดลเริ่มต้น | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า Fireworks auth ผ่าน onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    สิ่งนี้จะเก็บ Fireworks key ของคุณไว้ใน config ของ OpenClaw และตั้งโมเดลเริ่มต้น Fire Pass starter model เป็นค่าเริ่มต้น

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## ตัวอย่างแบบไม่โต้ตอบ

สำหรับการตั้งค่าแบบสคริปต์หรือ CI ให้ส่งค่าทั้งหมดผ่านบรรทัดคำสั่ง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## แค็ตตาล็อกที่มาพร้อมกัน

| Model ref                                              | Name                        | Input      | Context | Max output | Notes                                                                                                                                                  |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144    | โมเดล Kimi รุ่นล่าสุดบน Fireworks Thinking ถูกปิดสำหรับคำขอ K2.6 บน Fireworks; ให้กำหนดเส้นทางผ่าน Moonshot โดยตรง หากคุณต้องการเอาต์พุต Kimi แบบ thinking |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | โมเดลเริ่มต้นแบบ bundled starter model บน Fireworks                                                                                                   |

<Tip>
หาก Fireworks เผยแพร่โมเดลใหม่กว่า เช่น Qwen หรือ Gemma รุ่นใหม่ คุณสามารถสลับไปใช้มันได้โดยตรงด้วย Fireworks model id โดยไม่ต้องรอการอัปเดตแค็ตตาล็อกแบบ bundled
</Tip>

## Fireworks model id แบบกำหนดเอง

OpenClaw รองรับ Fireworks model id แบบ dynamic ด้วย ใช้ model หรือ router id ตามที่ Fireworks แสดงอย่างตรงตัว และเติมคำนำหน้า `fireworks/`

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การเติมคำนำหน้า model id ทำงานอย่างไร">
    Fireworks model ref ทุกตัวใน OpenClaw จะขึ้นต้นด้วย `fireworks/` ตามด้วย id หรือพาธของ router ตามที่แสดงบนแพลตฟอร์ม Fireworks ตัวอย่างเช่น:

    - โมเดล router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - โมเดลโดยตรง: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw จะตัดคำนำหน้า `fireworks/` ออกเมื่อสร้างคำขอ API และส่งพาธที่เหลือไปยัง Fireworks endpoint

  </Accordion>

  <Accordion title="หมายเหตุเรื่อง environment">
    หาก Gateway รันอยู่นอก interactive shell ของคุณ ให้ตรวจสอบว่า `FIREWORKS_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้นด้วย

    <Warning>
    คีย์ที่อยู่เพียงใน `~/.profile` จะไม่ช่วย launchd/systemd daemon เว้นแต่ environment นั้นจะถูกนำเข้าไปที่นั่นด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซสของ gateway สามารถอ่านได้
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model ref และพฤติกรรม failover
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
