---
read_when:
    - คุณต้องการทริกเกอร์หรือขับเคลื่อน TaskFlow จากระบบภายนอก
    - คุณกำลังกำหนดค่า Plugin webhooks ที่มาพร้อมกัน
summary: 'Plugin Webhooks: ingress ของ TaskFlow ที่ยืนยันตัวตนแล้วสำหรับระบบอัตโนมัติภายนอกที่เชื่อถือได้'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-04-24T09:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (Plugin)

Plugin Webhooks จะเพิ่ม route HTTP ที่ยืนยันตัวตนแล้ว ซึ่งผูกระบบอัตโนมัติภายนอกเข้ากับ TaskFlow ของ OpenClaw

ใช้เมื่อคุณต้องการให้ระบบที่เชื่อถือได้ เช่น Zapier, n8n, งาน CI หรือบริการภายใน สร้างและขับเคลื่อน TaskFlow ที่มีการจัดการ โดยไม่ต้องเขียน Plugin แบบกำหนดเองก่อน

## ตำแหน่งที่รัน

Plugin Webhooks จะรันอยู่ภายใน process ของ Gateway

หาก Gateway ของคุณรันอยู่บนอีกเครื่องหนึ่ง ให้ติดตั้งและกำหนดค่า Plugin บนโฮสต์ Gateway นั้น แล้วรีสตาร์ต Gateway

## กำหนดค่า route

ตั้งค่า config ใต้ `plugins.entries.webhooks.config`:

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
              description: "Zapier TaskFlow bridge",
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
- `sessionKey`: session ที่จำเป็นซึ่งเป็นเจ้าของ TaskFlow ที่ถูกผูกไว้
- `secret`: shared secret หรือ SecretRef ที่จำเป็น
- `controllerId`: ไม่บังคับ controller id สำหรับ managed flow ที่ถูกสร้าง
- `description`: ไม่บังคับ หมายเหตุสำหรับผู้ดูแลระบบ

อินพุต `secret` ที่รองรับ:

- สตริงธรรมดา
- SecretRef ที่มี `source: "env" | "file" | "exec"`

หาก route ที่อิง secret ไม่สามารถ resolve secret ได้ตอนเริ่มต้น Plugin จะข้าม route นั้นและบันทึกคำเตือนไว้ แทนที่จะเปิดเผย endpoint ที่ใช้งานไม่ได้

## โมเดลความปลอดภัย

แต่ละ route ได้รับความเชื่อถือให้ทำงานด้วยสิทธิ์ TaskFlow ของ `sessionKey` ที่กำหนดไว้

นั่นหมายความว่า route สามารถตรวจสอบและเปลี่ยนแปลง TaskFlow ที่เป็นของ session นั้นได้ ดังนั้นคุณควร:

- ใช้ secret ที่คาดเดายากและไม่ซ้ำกันสำหรับแต่ละ route
- ควรใช้ secret reference แทน secret แบบ plaintext ที่ใส่ตรง ๆ
- ผูก route กับ session ที่แคบที่สุดเท่าที่เหมาะกับเวิร์กโฟลว์
- เปิดเผยเฉพาะพาธ Webhook ที่คุณต้องการจริง ๆ

Plugin นี้ใช้:

- การยืนยันตัวตนด้วย shared secret
- ตัวป้องกันขนาด request body และ timeout
- การจำกัดอัตราแบบ fixed-window
- การจำกัดจำนวน request ที่กำลังประมวลผล
- การเข้าถึง TaskFlow ที่ผูกกับเจ้าของผ่าน `api.runtime.taskFlow.bindSession(...)`

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

## action ที่รองรับ

ปัจจุบัน Plugin รองรับค่า `action` ใน JSON ดังนี้:

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

สร้าง TaskFlow ที่มีการจัดการสำหรับ session ที่ route ผูกไว้

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

Plugin นี้จงใจล้างเมทาดาทาของ owner/session ออกจากการตอบกลับของ Webhook

## เอกสารที่เกี่ยวข้อง

- [Plugin runtime SDK](/th/plugins/sdk-runtime)
- [ภาพรวม hooks และ Webhook](/th/automation/hooks)
- [CLI webhooks](/th/cli/webhooks)
