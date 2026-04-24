---
read_when:
    - คุณต้องการขั้นตอน LLM แบบ JSON-only ภายในเวิร์กโฟลว์
    - คุณต้องการเอาต์พุต LLM ที่ตรวจสอบกับ schema แล้วสำหรับระบบอัตโนมัติ
summary: งาน LLM แบบ JSON-only สำหรับเวิร์กโฟลว์ (เครื่องมือ Plugin เสริม)
title: งาน LLM
x-i18n:
    generated_at: "2026-04-24T09:37:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` เป็น **เครื่องมือ Plugin เสริม** ที่รันงาน LLM แบบ JSON-only และส่งคืนเอาต์พุตแบบมีโครงสร้าง (โดยเลือกตรวจสอบกับ JSON Schema ได้)

สิ่งนี้เหมาะอย่างยิ่งสำหรับเอนจินเวิร์กโฟลว์อย่าง Lobster: คุณสามารถเพิ่มขั้นตอน LLM เดียวได้
โดยไม่ต้องเขียนโค้ด OpenClaw แบบกำหนดเองสำหรับแต่ละเวิร์กโฟลว์

## เปิดใช้งาน Plugin

1. เปิดใช้งาน Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. เพิ่มเครื่องมือลงใน allowlist (เครื่องมือนี้ถูกลงทะเบียนด้วย `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Config (ไม่บังคับ)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` คือ allowlist ของสตริง `provider/model` หากตั้งค่าไว้ คำขอใดๆ
ที่อยู่นอกเหนือจากรายการนี้จะถูกปฏิเสธ

## พารามิเตอร์ของเครื่องมือ

- `prompt` (string, ต้องระบุ)
- `input` (any, ไม่บังคับ)
- `schema` (object, JSON Schema แบบไม่บังคับ)
- `provider` (string, ไม่บังคับ)
- `model` (string, ไม่บังคับ)
- `thinking` (string, ไม่บังคับ)
- `authProfileId` (string, ไม่บังคับ)
- `temperature` (number, ไม่บังคับ)
- `maxTokens` (number, ไม่บังคับ)
- `timeoutMs` (number, ไม่บังคับ)

`thinking` รองรับ preset การให้เหตุผลมาตรฐานของ OpenClaw เช่น `low` หรือ `medium`

## เอาต์พุต

ส่งคืน `details.json` ที่มี JSON ที่แยกวิเคราะห์แล้ว (และตรวจสอบกับ
`schema` เมื่อมีการระบุ)

## ตัวอย่าง: ขั้นตอนเวิร์กโฟลว์ Lobster

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## หมายเหตุด้านความปลอดภัย

- เครื่องมือนี้เป็นแบบ **JSON-only** และสั่งให้โมเดลส่งออกเป็น JSON เท่านั้น (ไม่มี
  code fence, ไม่มีคำอธิบายเพิ่มเติม)
- จะไม่มีการเปิดเผยเครื่องมือใดๆ ให้โมเดลสำหรับการรันนี้
- ให้ถือว่าเอาต์พุตยังไม่น่าเชื่อถือจนกว่าคุณจะตรวจสอบด้วย `schema`
- ใส่การอนุมัติก่อนขั้นตอนใดๆ ที่มีผลข้างเคียง (send, post, exec)

## ที่เกี่ยวข้อง

- [ระดับ Thinking](/th/tools/thinking)
- [Sub-agents](/th/tools/subagents)
- [คำสั่ง Slash](/th/tools/slash-commands)
