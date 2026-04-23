---
read_when:
    - คุณต้องการใช้โมเดล Tencent Hy กับ OpenClaw
    - คุณต้องการการตั้งค่า TokenHub API key
summary: การตั้งค่า Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T05:53:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

provider Tencent Cloud ให้การเข้าถึงโมเดล Tencent Hy ผ่าน endpoint
ของ TokenHub (`tencent-tokenhub`)

provider นี้ใช้ API ที่เข้ากันได้กับ OpenAI

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## ตัวอย่างแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Providers และ endpoints

| Provider           | Endpoint                      | กรณีใช้งาน              |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy ผ่าน Tencent TokenHub |

## โมเดลที่พร้อมใช้งาน

### tencent-tokenhub

- **hy3-preview** — Hy3 รุ่นพรีวิว (context 256K, reasoning, ค่าเริ่มต้น)

## หมายเหตุ

- model ref ของ TokenHub ใช้รูปแบบ `tencent-tokenhub/<modelId>`
- แทนที่ข้อมูลด้านราคาและ metadata ของ context ใน `models.providers` ได้หากจำเป็น

## หมายเหตุเรื่อง environment

หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `TOKENHUB_API_KEY`
พร้อมใช้งานสำหรับโปรเซสนั้น (เช่นใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`)

## เอกสารที่เกี่ยวข้อง

- [OpenClaw Configuration](/th/gateway/configuration)
- [Model Providers](/th/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
