---
read_when:
    - คุณต้องการทริกเกอร์หรือขับเคลื่อน TaskFlow จากระบบภายนอก ag真人 to=functions.read commentary  银航json ￣奇米path":"docs/AGENTS.md","offset":1,"limit":200} code
    - คุณกำลังกำหนดค่า Plugin Webhook ที่มากับระบบ
summary: 'Plugin Webhook: ingress ของ TaskFlow ที่ยืนยันตัวตนแล้วสำหรับระบบอัตโนมัติภายนอกที่เชื่อถือได้'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-04-23T05:49:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5da12a887752ec6ee853cfdb912db0ae28512a0ffed06fe3828ef2eee15bc9d
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhook (Plugin)

Plugin Webhook เพิ่ม route HTTP ที่ยืนยันตัวตนแล้ว ซึ่ง bind ระบบอัตโนมัติภายนอกเข้ากับ TaskFlow ของ OpenClaw

ใช้เมื่อคุณต้องการให้ระบบที่เชื่อถือได้ เช่น Zapier, n8n, งาน CI หรือ
บริการภายใน สร้างและขับเคลื่อน TaskFlow ที่มีการจัดการโดยไม่ต้องเขียน
Plugin แบบกำหนดเองก่อน

## ทำงานที่ไหน

Plugin Webhook ทำงานภายในโปรเซส Gateway

หาก Gateway ของคุณรันอยู่บนอีกเครื่องหนึ่ง ให้ติดตั้งและกำหนดค่า Plugin บน
โฮสต์ Gateway นั้น แล้วรีสตาร์ต Gateway

## กำหนดค่า route

ตั้งค่า config ภายใต้ `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "สะพาน TaskFlow ของ Zapier",
            },
          },
        },
      },
    },
  },
}
```

ฟิลด์ของ route:

- `enabled`: ไม่บังคับ ค่าเริ่มต้นคือ `true`
- `path`: ไม่บังคับ ค่าเริ่มต้นคือ `/plugins/webhooks/<routeId>`
- `sessionKey`: เซสชันที่จำเป็นซึ่งเป็นเจ้าของ TaskFlow ที่ bind อยู่
- `secret`: shared secret หรือ SecretRef ที่จำเป็น
- `controllerId`: รหัส controller แบบไม่บังคับสำหรับ flow ที่มีการจัดการซึ่งถูกสร้างขึ้น
- `description`: หมายเหตุสำหรับผู้ปฏิบัติงานแบบไม่บังคับ

อินพุต `secret` ที่รองรับ:

- สตริงธรรมดา
- SecretRef ที่มี `source: "env" | "file" | "exec"`

หาก route ที่ใช้ secret ไม่สามารถ resolve secret ได้ตอนเริ่มต้น Plugin จะข้าม
route นั้นและบันทึกคำเตือนไว้ แทนที่จะเปิดเผย endpoint ที่เสีย

## โมเดลความปลอดภัย

แต่ละ route ได้รับความเชื่อถือให้ดำเนินการด้วยสิทธิ์ของ TaskFlow ตาม `sessionKey`
ที่กำหนดค่าไว้

นั่นหมายความว่า route สามารถตรวจสอบและแก้ไข TaskFlow ที่เป็นของเซสชันนั้นได้ ดังนั้น
คุณควร:

- ใช้ secret ที่แข็งแรงและไม่ซ้ำกันต่อ route
- ควรใช้ secret reference แทน secret plaintext แบบอินไลน์
- bind route กับเซสชันที่แคบที่สุดเท่าที่เหมาะกับเวิร์กโฟลว์
- เปิดเผยเฉพาะพาธ Webhook ที่คุณต้องการจริง ๆ

Plugin ใช้สิ่งต่อไปนี้:

- การยืนยันตัวตนด้วย shared secret
- ตัวป้องกันขนาด request body และ timeout
- rate limiting แบบ fixed-window
- การจำกัดจำนวนคำขอที่กำลังดำเนินการ
- การเข้าถึง TaskFlow แบบ owner-bound ผ่าน `api.runtime.taskFlow.bindSession(...)`

## รูปแบบคำขอ

ส่งคำขอ `POST` พร้อม:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` หรือ `x-openclaw-webhook-secret: <secret>`

ตัวอย่าง:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## การดำเนินการที่รองรับ

ปัจจุบัน Plugin ยอมรับค่า `action` แบบ JSON เหล่านี้:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

สร้าง TaskFlow ที่มีการจัดการสำหรับเซสชันที่ route bind ไว้

ตัวอย่าง:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

สร้างงานย่อยที่มีการจัดการภายใน TaskFlow ที่มีการจัดการอยู่แล้ว

runtime ที่อนุญาตคือ:

- `subagent`
- `acp`

ตัวอย่าง:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## รูปแบบการตอบกลับ

การตอบกลับที่สำเร็จจะคืนค่า:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

คำขอที่ถูกปฏิเสธจะคืนค่า:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin ตั้งใจล้าง metadata ของ owner/session ออกจากการตอบกลับของ Webhook

## เอกสารที่เกี่ยวข้อง

- [Plugin runtime SDK](/th/plugins/sdk-runtime)
- [ภาพรวมของ Hooks และ Webhook](/th/automation/hooks)
- [CLI webhooks](/cli/webhooks)
