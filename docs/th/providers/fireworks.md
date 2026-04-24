---
read_when:
    - คุณต้องการใช้ Fireworks กับ OpenClaw
    - คุณต้องมีตัวแปร env ของ Fireworks API key หรือรหัสโมเดลเริ่มต้น
summary: การตั้งค่า Fireworks (auth + การเลือกโมเดล)
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T09:27:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) เปิดให้ใช้งานโมเดลแบบ open-weight และ routed ผ่าน API ที่เข้ากันได้กับ OpenAI OpenClaw มี Fireworks provider plugin แบบ bundled มาให้

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions ที่เข้ากันได้กับ OpenAI              |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| โมเดลเริ่มต้น | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า auth ของ Fireworks ผ่าน onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    คำสั่งนี้จะเก็บ Fireworks key ของคุณไว้ในคอนฟิก OpenClaw และตั้งโมเดลเริ่มต้น Fire Pass starter เป็นค่าเริ่มต้น

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## ตัวอย่างแบบ non-interactive

สำหรับการตั้งค่าแบบสคริปต์หรือ CI ให้ส่งค่าทั้งหมดผ่าน command line:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## แค็ตตาล็อกในตัว

| Model ref                                              | Name                        | Input      | Context | Max output | Notes                                                                                                                                               |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144    | โมเดล Kimi ล่าสุดบน Fireworks การ thinking ถูกปิดสำหรับคำขอ Fireworks K2.6; ให้ส่งผ่าน Moonshot โดยตรงหากคุณต้องการเอาต์พุต thinking ของ Kimi |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | โมเดลเริ่มต้นแบบ bundled บน Fireworks                                                                                                             |

<Tip>
หาก Fireworks เผยแพร่โมเดลใหม่กว่า เช่น Qwen หรือ Gemma รุ่นใหม่ คุณสามารถสลับไปใช้ได้โดยตรงด้วย Fireworks model id ของโมเดลนั้น โดยไม่ต้องรอการอัปเดตแค็ตตาล็อกแบบ bundled
</Tip>

## Fireworks model id แบบกำหนดเอง

OpenClaw รองรับ Fireworks model id แบบไดนามิกด้วย ใช้ model id หรือ router id ตามที่ Fireworks แสดงไว้แบบตรงตัว และเติมคำนำหน้า `fireworks/`

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
    Fireworks model ref ทุกตัวใน OpenClaw จะขึ้นต้นด้วย `fireworks/` ตามด้วย id หรือพาธ router แบบตรงตัวจากแพลตฟอร์ม Fireworks ตัวอย่างเช่น:

    - Router model: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direct model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw จะตัดคำนำหน้า `fireworks/` ออกเมื่อสร้างคำขอ API และส่งพาธที่เหลือไปยัง endpoint ของ Fireworks

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับ environment">
    หาก Gateway ทำงานนอก interactive shell ของคุณ โปรดตรวจสอบให้แน่ใจว่า `FIREWORKS_API_KEY` พร้อมใช้งานสำหรับ process นั้นด้วย

    <Warning>
    key ที่อยู่เพียงใน `~/.profile` จะไม่ช่วยอะไรสำหรับ launchd/systemd daemon เว้นแต่ environment นั้นจะถูกนำเข้าไปที่นั่นด้วย ให้ตั้งค่า key ไว้ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่า process ของ gateway สามารถอ่านได้
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
