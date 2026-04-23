---
read_when:
    - คุณต้องการขั้นตอน LLM แบบ JSON-only ภายในเวิร์กโฟลว์ to=final
    - คุณต้องการเอาต์พุต LLM ที่ผ่านการตรวจสอบด้วย schema สำหรับระบบอัตโนมัติ to=final no more.
summary: งาน LLM แบบ JSON-only สำหรับเวิร์กโฟลว์ (optional plugin tool)
title: LLM Task to=final translated only. user asks title. keep product term? maybe translate heading. "LLM Task" maybe "งาน LLM". user earlier translation style translated labels. Use Thai.
x-i18n:
    generated_at: "2026-04-23T06:01:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# งาน LLM

`llm-task` เป็น **optional plugin tool** ที่รันงาน LLM แบบ JSON-only และ
คืนค่าเอาต์พุตที่มีโครงสร้าง (และสามารถตรวจสอบกับ JSON Schema ได้แบบไม่บังคับ)

สิ่งนี้เหมาะอย่างยิ่งสำหรับ workflow engine อย่าง Lobster: คุณสามารถเพิ่มขั้นตอน LLM เพียงขั้นตอนเดียว
โดยไม่ต้องเขียนโค้ด OpenClaw แบบกำหนดเองสำหรับแต่ละเวิร์กโฟลว์

## เปิดใช้ Plugin

1. เปิดใช้ Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. ใส่ tool นี้ไว้ใน allowlist (มันถูก register ด้วย `optional: true`):

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
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` คือ allowlist ของสตริง `provider/model` หากมีการตั้งค่าไว้ คำขอใด ๆ
ที่อยู่นอกเหนือรายการนี้จะถูกปฏิเสธ

## พารามิเตอร์ของ Tool

- `prompt` (string, จำเป็น)
- `input` (any, ไม่บังคับ)
- `schema` (object, JSON Schema แบบไม่บังคับ)
- `provider` (string, ไม่บังคับ)
- `model` (string, ไม่บังคับ)
- `thinking` (string, ไม่บังคับ)
- `authProfileId` (string, ไม่บังคับ)
- `temperature` (number, ไม่บังคับ)
- `maxTokens` (number, ไม่บังคับ)
- `timeoutMs` (number, ไม่บังคับ)

`thinking` รับค่า reasoning preset มาตรฐานของ OpenClaw เช่น `low` หรือ `medium`

## เอาต์พุต

คืนค่า `details.json` ที่มี JSON ที่ parse แล้ว (และตรวจสอบกับ
`schema` เมื่อมีการระบุ)

## ตัวอย่าง: ขั้นตอนในเวิร์กโฟลว์ Lobster

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

- tool นี้เป็น **JSON-only** และสั่งให้โมเดลส่งออกเฉพาะ JSON เท่านั้น (ไม่มี
  code fence, ไม่มีคำอธิบายเพิ่มเติม)
- จะไม่มี tools ใดถูกเปิดเผยให้โมเดลสำหรับการรันนี้
- ให้ถือว่าเอาต์พุตไม่น่าเชื่อถือ เว้นแต่คุณจะตรวจสอบด้วย `schema`
- วาง approvals ไว้ก่อนทุกขั้นตอนที่มีผลข้างเคียง (send, post, exec)
