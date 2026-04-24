---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Sandbox และข้อจำกัดของเครื่องมือแบบแยกตามเอเจนต์, ลำดับความสำคัญ และตัวอย่าง”
title: Sandbox และเครื่องมือแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:37:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# การกำหนดค่า Sandbox และเครื่องมือแบบหลายเอเจนต์

เอเจนต์แต่ละตัวในการตั้งค่าแบบหลายเอเจนต์สามารถ override นโยบาย sandbox และเครื่องมือระดับ global ได้ หน้านี้ครอบคลุมการกำหนดค่าแยกตามเอเจนต์ กฎลำดับความสำคัญ และตัวอย่าง

- **Sandbox backends และโหมด**: ดู [Sandboxing](/th/gateway/sandboxing)
- **การดีบักเครื่องมือที่ถูกบล็อก**: ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) และ `openclaw sandbox explain`
- **Elevated exec**: ดู [Elevated Mode](/th/tools/elevated)

Auth เป็นแบบแยกต่อเอเจนต์: แต่ละเอเจนต์จะอ่านจากที่เก็บ auth ของ `agentDir` ของตัวเองที่
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
ข้อมูลรับรองจะ **ไม่** ถูกใช้ร่วมกันระหว่างเอเจนต์ ห้ามใช้ `agentDir` ซ้ำข้ามเอเจนต์เด็ดขาด
หากคุณต้องการแชร์ข้อมูลรับรอง ให้คัดลอก `auth-profiles.json` ไปยัง `agentDir` ของเอเจนต์อีกตัว

---

## ตัวอย่างการกำหนดค่า

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

- เอเจนต์ `main`: รันบน host, เข้าถึงเครื่องมือได้เต็มรูปแบบ
- เอเจนต์ `family`: รันใน Docker (หนึ่งคอนเทนเนอร์ต่อเอเจนต์), ใช้ได้เฉพาะเครื่องมือ `read`

---

### ตัวอย่าง 2: เอเจนต์งานพร้อม Sandbox แบบแชร์ร่วมกัน

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

### ตัวอย่าง 2b: โปรไฟล์ coding ระดับ global + เอเจนต์เฉพาะการส่งข้อความ

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

- เอเจนต์เริ่มต้นจะได้เครื่องมือสำหรับ coding
- เอเจนต์ `support` เป็นแบบ messaging-only (+ เครื่องมือ Slack)

---

### ตัวอย่าง 3: โหมด Sandbox ต่างกันในแต่ละเอเจนต์

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Global default
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main ไม่ใช้ sandbox เลย
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public ใช้ sandbox เสมอ
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

## ลำดับความสำคัญของการกำหนดค่า

เมื่อมีทั้ง config ระดับ global (`agents.defaults.*`) และ config เฉพาะเอเจนต์ (`agents.list[].*`):

### Config ของ Sandbox

การตั้งค่าเฉพาะเอเจนต์จะ override การตั้งค่าระดับ global:

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

- `agents.list[].sandbox.{docker,browser,prune}.*` จะ override `agents.defaults.sandbox.{docker,browser,prune}.*` สำหรับเอเจนต์นั้น (จะถูกละเว้นเมื่อ sandbox scope ถูก resolve เป็น `"shared"`)

### ข้อจำกัดของเครื่องมือ

ลำดับการกรองคือ:

1. **โปรไฟล์เครื่องมือ** (`tools.profile` หรือ `agents.list[].tools.profile`)
2. **โปรไฟล์เครื่องมือของ provider** (`tools.byProvider[provider].profile` หรือ `agents.list[].tools.byProvider[provider].profile`)
3. **นโยบายเครื่องมือระดับ global** (`tools.allow` / `tools.deny`)
4. **นโยบายเครื่องมือของ provider** (`tools.byProvider[provider].allow/deny`)
5. **นโยบายเครื่องมือเฉพาะเอเจนต์** (`agents.list[].tools.allow/deny`)
6. **นโยบาย provider ของเอเจนต์** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **นโยบายเครื่องมือของ sandbox** (`tools.sandbox.tools` หรือ `agents.list[].tools.sandbox.tools`)
8. **นโยบายเครื่องมือของ subagent** (`tools.subagents.tools` หากเกี่ยวข้อง)

แต่ละระดับสามารถจำกัดเครื่องมือเพิ่มเติมได้ แต่ไม่สามารถคืนสิทธิ์ให้เครื่องมือที่ถูกปฏิเสธจากระดับก่อนหน้าได้
หากตั้งค่า `agents.list[].tools.sandbox.tools` ไว้ ค่านั้นจะมาแทน `tools.sandbox.tools` สำหรับเอเจนต์นั้น
หากตั้งค่า `agents.list[].tools.profile` ไว้ ค่านั้นจะ override `tools.profile` สำหรับเอเจนต์นั้น
คีย์เครื่องมือของ provider ยอมรับได้ทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

นโยบายเครื่องมือรองรับ shorthand แบบ `group:*` ที่จะขยายเป็นหลายเครื่องมือ ดู [Tool groups](/th/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) สำหรับรายการทั้งหมด

การ override Elevated แบบแยกต่อเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัด elevated exec เพิ่มเติมสำหรับเอเจนต์เฉพาะได้ ดู [Elevated Mode](/th/tools/elevated) สำหรับรายละเอียด

---

## การย้ายจากเอเจนต์เดี่ยว

**ก่อนหน้า (เอเจนต์เดี่ยว):**

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

**หลังจากนั้น (หลายเอเจนต์พร้อมโปรไฟล์ต่างกัน):**

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

config แบบ legacy `agent.*` จะถูกย้ายโดย `openclaw doctor`; จากนี้ไปควรใช้ `agents.defaults` + `agents.list`

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

### เอเจนต์สำหรับการรันอย่างปลอดภัย (ไม่แก้ไขไฟล์)

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

`sessions_history` ในโปรไฟล์นี้ยังคงส่งคืนมุมมองการเรียกคืนแบบจำกัดและผ่านการทำความสะอาดแล้ว
แทนการ dump ทรานสคริปต์ดิบทั้งหมด การเรียกคืนฝั่ง assistant จะลบแท็ก thinking,
โครง `<relevant-memories>`, payload XML ของการเรียกใช้เครื่องมือในข้อความล้วน
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียกใช้เครื่องมือที่ถูกตัดทอน),
โครงสร้างการเรียกใช้เครื่องมือที่ถูกลดระดับ, โทเค็นควบคุมโมเดลแบบ ASCII/full-width ที่รั่วออกมา,
และ XML การเรียกใช้เครื่องมือ MiniMax ที่ผิดรูปแบบก่อนการปกปิด/ตัดทอน

---

## ข้อผิดพลาดที่พบบ่อย: `"non-main"`

`agents.defaults.sandbox.mode: "non-main"` อิงจาก `session.mainKey` (ค่าเริ่มต้น `"main"`)
ไม่ใช่ agent id เซสชันกลุ่ม/ช่องทางจะมีคีย์ของตัวเองเสมอ ดังนั้น
จึงถูกมองว่าไม่ใช่ main และจะถูก sandbox หากคุณต้องการให้เอเจนต์ไม่ใช้
sandbox เลย ให้ตั้ง `agents.list[].sandbox.mode: "off"`

---

## การทดสอบ

หลังจากกำหนดค่า sandbox และเครื่องมือแบบหลายเอเจนต์แล้ว:

1. **ตรวจสอบการ resolve เอเจนต์:**

   ```exec
   openclaw agents list --bindings
   ```

2. **ยืนยันคอนเทนเนอร์ Sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **ทดสอบข้อจำกัดของเครื่องมือ:**
   - ส่งข้อความที่ต้องใช้เครื่องมือที่ถูกจำกัด
   - ยืนยันว่าเอเจนต์ไม่สามารถใช้เครื่องมือที่ถูกปฏิเสธได้

4. **ติดตาม logs:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## การแก้ปัญหา

### เอเจนต์ไม่ถูก sandbox แม้ตั้ง `mode: "all"`

- ตรวจสอบว่ามี `agents.defaults.sandbox.mode` ระดับ global ที่ override อยู่หรือไม่
- config เฉพาะเอเจนต์มีลำดับความสำคัญสูงกว่า ดังนั้นให้ตั้ง `agents.list[].sandbox.mode: "all"`

### เครื่องมือยังใช้งานได้แม้อยู่ใน deny list

- ตรวจสอบลำดับการกรองเครื่องมือ: global → agent → sandbox → subagent
- แต่ละระดับทำได้เพียงจำกัดเพิ่ม ไม่สามารถคืนสิทธิ์ได้
- ตรวจสอบผ่าน logs: `[tools] filtering tools for agent:${agentId}`

### คอนเทนเนอร์ไม่ถูกแยกต่อเอเจนต์

- ตั้ง `scope: "agent"` ใน config sandbox เฉพาะเอเจนต์
- ค่าเริ่มต้นคือ `"session"` ซึ่งสร้างหนึ่งคอนเทนเนอร์ต่อเซสชัน

---

## ที่เกี่ยวข้อง

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง Sandbox แบบเต็ม (โหมด, scope, backend, image)
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- ดีบักว่า "ทำไมสิ่งนี้ถึงถูกบล็อก?"
- [Elevated Mode](/th/tools/elevated)
- [Multi-Agent Routing](/th/concepts/multi-agent)
- [Sandbox Configuration](/th/gateway/config-agents#agentsdefaultssandbox)
- [Session Management](/th/concepts/session)
