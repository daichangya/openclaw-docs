---
read_when:
    - คุณต้องการใช้ Vercel AI Gateway กับ OpenClaw
    - คุณต้องการ env var ของ API key หรือตัวเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Vercel AI Gateway (การยืนยันตัวตน + การเลือกโมเดล)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-23T05:53:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) ให้ API แบบรวมศูนย์เพื่อ
เข้าถึงโมเดลหลายร้อยตัวผ่าน endpoint เดียว

| คุณสมบัติ       | ค่า                               |
| --------------- | --------------------------------- |
| ผู้ให้บริการ     | `vercel-ai-gateway`              |
| การยืนยันตัวตน | `AI_GATEWAY_API_KEY`             |
| API             | เข้ากันได้กับ Anthropic Messages |
| แค็ตตาล็อกโมเดล | ค้นพบอัตโนมัติผ่าน `/v1/models` |

<Tip>
OpenClaw จะค้นพบแค็ตตาล็อก `/v1/models` ของ Gateway โดยอัตโนมัติ ดังนั้น
`/models vercel-ai-gateway` จึงมี model ref ปัจจุบัน เช่น
`vercel-ai-gateway/openai/gpt-5.4` และ
`vercel-ai-gateway/moonshotai/kimi-k2.6`
</Tip>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    รัน onboarding แล้วเลือกตัวเลือก auth ของ AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    เพิ่มโมเดลลงในคอนฟิก OpenClaw ของคุณ:

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

สำหรับชุดติดตั้งแบบสคริปต์หรือ CI ให้ส่งค่าทั้งหมดผ่าน command line:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## รูปแบบย่อของ model ID

OpenClaw รองรับ model ref แบบย่อของ Vercel Claude และจะ normalize ตอน runtime:

| อินพุตแบบย่อ                        | model ref ที่ normalize แล้ว                    |
| ----------------------------------- | ---------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
คุณสามารถใช้ทั้งรูปแบบย่อหรือ model ref แบบระบุเต็มในคอนฟิกของคุณได้
OpenClaw จะ resolve ไปเป็นรูปแบบ canonical โดยอัตโนมัติ
</Tip>

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับโปรเซสแบบ daemon">
    หาก OpenClaw Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `AI_GATEWAY_API_KEY` พร้อมใช้งานกับโปรเซสนั้น

    <Warning>
    key ที่ตั้งไว้เฉพาะใน `~/.profile` จะไม่มองเห็นโดย daemon ของ launchd/systemd
    เว้นแต่ environment นั้นจะถูก import อย่างชัดเจน ให้ตั้งค่า key ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส Gateway
    สามารถอ่านได้
    </Warning>

  </Accordion>

  <Accordion title="การกำหนดเส้นทางผู้ให้บริการ">
    Vercel AI Gateway จะกำหนดเส้นทางคำขอไปยังผู้ให้บริการต้นทางตาม
    คำนำหน้าของ model ref ตัวอย่างเช่น `vercel-ai-gateway/anthropic/claude-opus-4.6` จะกำหนดเส้นทาง
    ผ่าน Anthropic ขณะที่ `vercel-ai-gateway/openai/gpt-5.4` จะกำหนดเส้นทางผ่าน
    OpenAI และ `vercel-ai-gateway/moonshotai/kimi-k2.6` จะกำหนดเส้นทางผ่าน
    MoonshotAI `AI_GATEWAY_API_KEY` เดียวของคุณจัดการการยืนยันตัวตนสำหรับ
    ผู้ให้บริการต้นทางทั้งหมด
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model ref และพฤติกรรม failover
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
