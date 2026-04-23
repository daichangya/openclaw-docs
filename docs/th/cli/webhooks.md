---
read_when:
    - คุณต้องการเชื่อมต่ออีเวนต์ Gmail Pub/Sub เข้ากับ OpenClaw
    - คุณต้องการคำสั่งตัวช่วย Webhook
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw webhooks` (ตัวช่วย Webhook + Gmail Pub/Sub)
title: webhooks
x-i18n:
    generated_at: "2026-04-23T06:20:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b22ce879c3a94557be57919b4d2b3e92ff4d41fbae7bc88d2ab07cd4bbeac83
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

ตัวช่วย Webhook และการผสานรวม (Gmail Pub/Sub, ตัวช่วย Webhook)

ที่เกี่ยวข้อง:

- Webhooks: [Webhooks](/th/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

กำหนดค่า Gmail watch, Pub/Sub และการส่งมอบ Webhook ของ OpenClaw

จำเป็น:

- `--account <email>`

ตัวเลือก:

- `--project <id>`
- `--topic <name>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`
- `--push-endpoint <url>`
- `--json`

ตัวอย่าง:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

รัน `gog watch serve` พร้อมลูปต่ออายุ watch อัตโนมัติ

ตัวเลือก:

- `--account <email>`
- `--topic <topic>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`

ตัวอย่าง:

```bash
openclaw webhooks gmail run --account you@example.com
```

ดู [เอกสาร Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration) สำหรับขั้นตอนการตั้งค่าแบบครบวงจรและรายละเอียดการปฏิบัติงาน
