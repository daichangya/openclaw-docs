---
read_when:
    - คุณต้องการใช้ Cloudflare AI Gateway กับ OpenClaw
    - คุณต้องการ account ID, gateway ID หรือ env var ของ API key
summary: การตั้งค่า Cloudflare AI Gateway (auth + การเลือกโมเดล)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-23T05:50:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12e9589fe74e6a6335370b9cf2361a464876a392a33f8317d7fd30c3f163b2e5
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway วางอยู่หน้าชั้นของ provider APIs และช่วยให้คุณเพิ่ม analytics, caching และ controls ได้ สำหรับ Anthropic นั้น OpenClaw จะใช้ Anthropic Messages API ผ่าน Gateway endpoint ของคุณ

| คุณสมบัติ      | ค่า                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                  |
| Base URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`              |
| โมเดลเริ่มต้น | `cloudflare-ai-gateway/claude-sonnet-4-5`                                                |
| API key       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (provider API key ของคุณสำหรับคำขอที่ผ่าน Gateway)       |

<Note>
สำหรับโมเดล Anthropic ที่กำหนดเส้นทางผ่าน Cloudflare AI Gateway ให้ใช้ **Anthropic API key** ของคุณเป็น provider key
</Note>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า provider API key และรายละเอียดของ Gateway">
    รัน onboarding และเลือกตัวเลือก auth ของ Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    ขั้นตอนนี้จะถาม account ID, gateway ID และ API key ของคุณ

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    เพิ่มโมเดลลงใน config ของ OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
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

สำหรับการตั้งค่าแบบสคริปต์หรือ CI ให้ส่งค่าทั้งหมดผ่าน command line:

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
  <Accordion title="Gateways ที่ยืนยันตัวตนแล้ว">
    หากคุณเปิดใช้การยืนยันตัวตนของ Gateway ใน Cloudflare ให้เพิ่ม header `cf-aig-authorization` สิ่งนี้เป็น **เพิ่มเติมจาก** provider API key ของคุณ

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
    header `cf-aig-authorization` ใช้ยืนยันตัวตนกับ Cloudflare Gateway เอง ส่วน provider API key (ตัวอย่างเช่น Anthropic key ของคุณ) ใช้ยืนยันตัวตนกับ upstream provider
    </Tip>

  </Accordion>

  <Accordion title="หมายเหตุเรื่อง Environment">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้แน่ใจว่า `CLOUDFLARE_AI_GATEWAY_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น

    <Warning>
    คีย์ที่อยู่เพียงใน `~/.profile` จะไม่ช่วยกับ launchd/systemd daemon เว้นแต่ environment นั้นจะถูกนำเข้าไปที่นั่นด้วย ตั้งค่าคีย์ไว้ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส gateway อ่านค่านี้ได้
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
