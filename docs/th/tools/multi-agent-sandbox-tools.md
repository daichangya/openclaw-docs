---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Sandbox และข้อจำกัดของเครื่องมือแบบรายเอเจนต์, ลำดับความสำคัญ และตัวอย่าง”
title: Sandbox และเครื่องมือแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-04-23T06:02:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# การตั้งค่า Sandbox และเครื่องมือแบบหลายเอเจนต์

เอเจนต์แต่ละตัวในระบบหลายเอเจนต์สามารถ override นโยบาย sandbox และ
tool ระดับ global ได้ หน้านี้ครอบคลุมการตั้งค่าแบบรายเอเจนต์ กฎลำดับความสำคัญ และ
ตัวอย่าง

- **Sandbox backends และ modes**: ดู [Sandboxing](/th/gateway/sandboxing)
- **การดีบัก tools ที่ถูกบล็อก**: ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) และ `openclaw sandbox explain`
- **Elevated exec**: ดู [Elevated Mode](/th/tools/elevated)

Auth เป็นแบบรายเอเจนต์: แต่ละเอเจนต์จะอ่านจาก auth store ใน `agentDir` ของตัวเองที่
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
Credentials **จะไม่** ถูกแชร์ระหว่างเอเจนต์ ห้ามใช้ `agentDir` ซ้ำข้ามเอเจนต์โดยเด็ดขาด
หากคุณต้องการแชร์ creds ให้คัดลอก `auth-profiles.json` ไปยัง `agentDir` ของเอเจนต์อีกตัว

---

## ตัวอย่างการตั้งค่า

### ตัวอย่าง 1: เอเจนต์ส่วนตัว + เอเจนต์ครอบครัวแบบจำกัดสิทธิ์

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**ผลลัพธ์:**

- เอเจนต์ `main`: ทำงานบนโฮสต์ เข้าถึงเครื่องมือได้เต็มรูปแบบ
- เอเจนต์ `family`: ทำงานใน Docker (หนึ่งคอนเทนเนอร์ต่อเอเจนต์) ใช้ได้เฉพาะเครื่องมือ `read`

---

### ตัวอย่าง 2: เอเจนต์งานพร้อม Shared Sandbox

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### ตัวอย่าง 2b: โปรไฟล์ coding แบบ global + เอเจนต์แบบ messaging-only

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**ผลลัพธ์:**

- เอเจนต์ค่าเริ่มต้นจะได้เครื่องมือสาย coding
- เอเจนต์ `support` เป็นแบบ messaging-only (+ เครื่องมือ Slack)

---

### ตัวอย่าง 3: Sandbox Modes ต่างกันในแต่ละเอเจนต์

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // ค่าเริ่มต้นระดับ global
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main จะไม่ถูก sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public จะถูก sandbox เสมอ
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## ลำดับความสำคัญของการตั้งค่า

เมื่อมีทั้ง config ระดับ global (`agents.defaults.*`) และ config เฉพาะเอเจนต์ (`agents.list[].*`):

### Sandbox Config

ค่าที่กำหนดเฉพาะเอเจนต์จะ override ค่าระดับ global:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**หมายเหตุ:**

- `agents.list[].sandbox.{docker,browser,prune}.*` จะ override `agents.defaults.sandbox.{docker,browser,prune}.*` สำหรับเอเจนต์นั้น (จะถูกละเลยเมื่อ sandbox scope resolve เป็น `"shared"`)

### ข้อจำกัดของเครื่องมือ

ลำดับการกรองมีดังนี้:

1. **Tool profile** (`tools.profile` หรือ `agents.list[].tools.profile`)
2. **Provider tool profile** (`tools.byProvider[provider].profile` หรือ `agents.list[].tools.byProvider[provider].profile`)
3. **Global tool policy** (`tools.allow` / `tools.deny`)
4. **Provider tool policy** (`tools.byProvider[provider].allow/deny`)
5. **Agent-specific tool policy** (`agents.list[].tools.allow/deny`)
6. **Agent provider policy** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Sandbox tool policy** (`tools.sandbox.tools` หรือ `agents.list[].tools.sandbox.tools`)
8. **Subagent tool policy** (`tools.subagents.tools`, หากเกี่ยวข้อง)

แต่ละระดับสามารถจำกัดเครื่องมือเพิ่มเติมได้ แต่ไม่สามารถคืนสิทธิ์ให้เครื่องมือที่ถูกปฏิเสธจากระดับก่อนหน้าได้
หากตั้ง `agents.list[].tools.sandbox.tools` ไว้ มันจะใช้แทน `tools.sandbox.tools` สำหรับเอเจนต์นั้น
หากตั้ง `agents.list[].tools.profile` ไว้ มันจะ override `tools.profile` สำหรับเอเจนต์นั้น
คีย์ provider tool รองรับทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

นโยบายเครื่องมือรองรับ shorthand แบบ `group:*` ที่จะขยายเป็นหลายเครื่องมือ ดู [Tool groups](/th/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) สำหรับรายการแบบเต็ม

การ override elevated แบบรายเอเจนต์ (`agents.list[].tools.elevated`) ยังสามารถจำกัด elevated exec เพิ่มเติมสำหรับเอเจนต์บางตัวได้ ดู [Elevated Mode](/th/tools/elevated) สำหรับรายละเอียด

---

## การย้ายมาจากเอเจนต์เดี่ยว

**ก่อน (เอเจนต์เดี่ยว):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**หลัง (หลายเอเจนต์พร้อมโปรไฟล์ต่างกัน):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

config แบบเดิม `agent.*` จะถูก migrate โดย `openclaw doctor`; จากนี้ไปควรใช้ `agents.defaults` + `agents.list`

---

## ตัวอย่างข้อจำกัดของเครื่องมือ

### เอเจนต์แบบอ่านอย่างเดียว

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### เอเจนต์สำหรับรันอย่างปลอดภัย (ไม่แก้ไขไฟล์)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### เอเจนต์สำหรับการสื่อสารเท่านั้น

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` ในโปรไฟล์นี้ยังคงคืนมุมมอง recall ที่ถูกจำกัดและ sanitize แล้ว
แทนการ dump transcript แบบดิบ การ recall ของ assistant จะลบ thinking tags,
โครงสร้าง `<relevant-memories>`, payload XML ของ tool-call แบบ plain-text
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน),
โครงสร้าง tool-call แบบ downgraded, model control
tokens แบบ ASCII/full-width ที่รั่วออกมา และ MiniMax tool-call XML ที่ผิดรูปแบบ ก่อนทำ redaction/truncation

---

## ข้อควรระวังที่พบบ่อย: `"non-main"`

`agents.defaults.sandbox.mode: "non-main"` อิงจาก `session.mainKey` (ค่าเริ่มต้น `"main"`)
ไม่ใช่ agent id เซสชันแบบกลุ่ม/ช่องทางจะมีคีย์ของตัวเองเสมอ ดังนั้น
จึงถูกมองว่าเป็น non-main และจะถูก sandbox หากคุณต้องการให้เอเจนต์ตัวใดไม่มี sandbox เลย ให้ตั้ง `agents.list[].sandbox.mode: "off"`

---

## การทดสอบ

หลังจากตั้งค่า sandbox และ tools แบบหลายเอเจนต์แล้ว:

1. **ตรวจสอบการ resolve เอเจนต์:**

   ```exec
   openclaw agents list --bindings
   ```

2. **ตรวจสอบ sandbox containers:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **ทดสอบข้อจำกัดของเครื่องมือ:**
   - ส่งข้อความที่ต้องใช้เครื่องมือที่ถูกจำกัด
   - ตรวจสอบว่าเอเจนต์ไม่สามารถใช้เครื่องมือที่ถูกปฏิเสธได้

4. **ติดตาม logs:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## การแก้ไขปัญหา

### เอเจนต์ไม่ถูก sandbox แม้ตั้ง `mode: "all"`

- ตรวจสอบว่ามี `agents.defaults.sandbox.mode` ระดับ global ที่ไป override หรือไม่
- config เฉพาะเอเจนต์มีลำดับความสำคัญสูงกว่า ดังนั้นให้ตั้ง `agents.list[].sandbox.mode: "all"`

### เครื่องมือยังคงใช้ได้แม้อยู่ใน deny list

- ตรวจสอบลำดับการกรองเครื่องมือ: global → agent → sandbox → subagent
- แต่ละระดับทำได้เพียงจำกัดเพิ่ม ไม่สามารถคืนสิทธิ์กลับมาได้
- ตรวจสอบผ่าน logs: `[tools] filtering tools for agent:${agentId}`

### คอนเทนเนอร์ไม่ถูกแยกต่อเอเจนต์

- ตั้ง `scope: "agent"` ใน sandbox config เฉพาะเอเจนต์
- ค่าเริ่มต้นคือ `"session"` ซึ่งจะสร้างหนึ่งคอนเทนเนอร์ต่อเซสชัน

---

## ดูเพิ่มเติม

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox แบบเต็ม (modes, scopes, backends, images)
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- ดีบักว่า "ทำไมสิ่งนี้ถึงถูกบล็อก?"
- [Elevated Mode](/th/tools/elevated)
- [Multi-Agent Routing](/th/concepts/multi-agent)
- [Sandbox Configuration](/th/gateway/configuration-reference#agentsdefaultssandbox)
- [Session Management](/th/concepts/session)
