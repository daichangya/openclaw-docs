---
read_when:
    - คุณต้องการใช้ Cloudflare AI Gateway กับ OpenClaw
    - คุณต้องการ account ID, gateway ID หรือตัวแปรสภาพแวดล้อมของคีย์ API
summary: การตั้งค่า Cloudflare AI Gateway (การยืนยันตัวตน + การเลือกโมเดล)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-24T09:27:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway อยู่หน้าชั้น API ของผู้ให้บริการ และช่วยให้คุณเพิ่มการวิเคราะห์ การแคช และการควบคุมต่าง ๆ ได้ สำหรับ Anthropic นั้น OpenClaw จะใช้ Anthropic Messages API ผ่าน endpoint ของ Gateway ของคุณ

| คุณสมบัติ      | ค่า                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------- |
| Provider       | `cloudflare-ai-gateway`                                                                  |
| Base URL       | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`              |
| โมเดลเริ่มต้น | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| คีย์ API       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (คีย์ API ของผู้ให้บริการของคุณสำหรับคำขอที่ผ่าน Gateway) |

<Note>
สำหรับโมเดล Anthropic ที่กำหนดเส้นทางผ่าน Cloudflare AI Gateway ให้ใช้ **คีย์ API ของ Anthropic** เป็นคีย์ของผู้ให้บริการ
</Note>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API ของผู้ให้บริการและรายละเอียดของ Gateway">
    เรียกใช้ onboarding แล้วเลือกตัวเลือก auth ของ Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    ระบบจะถามหา account ID, gateway ID และคีย์ API ของคุณ

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    เพิ่มโมเดลลงใน config ของ OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## ตัวอย่างแบบไม่โต้ตอบ

สำหรับการตั้งค่าแบบสคริปต์หรือ CI ให้ส่งค่าทั้งหมดผ่านบรรทัดคำสั่ง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Gateway ที่มีการยืนยันตัวตน">
    หากคุณเปิดใช้การยืนยันตัวตนของ Gateway ใน Cloudflare ให้เพิ่ม header `cf-aig-authorization` ซึ่งเป็นสิ่งที่ต้องมี **เพิ่มเติมจาก** คีย์ API ของผู้ให้บริการของคุณ

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    header `cf-aig-authorization` ใช้สำหรับยืนยันตัวตนกับ Cloudflare Gateway เอง ขณะที่คีย์ API ของผู้ให้บริการ (เช่น คีย์ Anthropic ของคุณ) ใช้สำหรับยืนยันตัวตนกับผู้ให้บริการต้นทาง
    </Tip>

  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า `CLOUDFLARE_AI_GATEWAY_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น

    <Warning>
    คีย์ที่อยู่เพียงใน `~/.profile` จะไม่ช่วย daemon ของ launchd/systemd เว้นแต่จะมีการนำสภาพแวดล้อมนั้นเข้าไปด้วยเช่นกัน ให้ตั้งค่าคีย์ไว้ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส gateway สามารถอ่านได้
    </Warning>

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
