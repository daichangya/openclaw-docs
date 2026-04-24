---
read_when:
    - การกำหนดค่ากลุ่มการกระจายข้อความ
    - การดีบักการตอบกลับจากหลายเอเจนต์ใน WhatsApp
status: experimental
summary: กระจายข้อความ WhatsApp ไปยังเอเจนต์หลายตัว
title: กลุ่มการกระจายข้อความ
x-i18n:
    generated_at: "2026-04-24T08:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**สถานะ:** รุ่นทดลอง  
**เวอร์ชัน:** เพิ่มใน 2026.1.9

## ภาพรวม

กลุ่มการกระจายข้อความช่วยให้เอเจนต์หลายตัวประมวลผลและตอบกลับข้อความเดียวกันพร้อมกันได้ ซึ่งช่วยให้คุณสร้างทีมเอเจนต์เฉพาะทางที่ทำงานร่วมกันในกลุ่ม WhatsApp หรือ DM เดียวกันได้ โดยทั้งหมดใช้หมายเลขโทรศัพท์เพียงหมายเลขเดียว

ขอบเขตปัจจุบัน: **WhatsApp เท่านั้น** (ช่องทางเว็บ)

กลุ่มการกระจายข้อความจะถูกประเมินหลังจากกฎ allowlist ของช่องทางและกฎการเปิดใช้งานกลุ่ม ในกลุ่ม WhatsApp จึงหมายความว่าการกระจายข้อความจะเกิดขึ้นเมื่อ OpenClaw ปกติจะตอบกลับอยู่แล้ว (เช่น เมื่อติด mention ทั้งนี้ขึ้นอยู่กับการตั้งค่ากลุ่มของคุณ)

## กรณีการใช้งาน

### 1. ทีมเอเจนต์เฉพาะทาง

ติดตั้งเอเจนต์หลายตัวที่มีหน้าที่เฉพาะเจาะจงและชัดเจน:

```text
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

เอเจนต์แต่ละตัวจะประมวลผลข้อความเดียวกันและให้มุมมองเฉพาะทางของตนเอง

### 2. การรองรับหลายภาษา

```text
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. เวิร์กโฟลว์การประกันคุณภาพ

```text
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. งานอัตโนมัติของงานต่าง ๆ

```text
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## การกำหนดค่า

### การตั้งค่าพื้นฐาน

เพิ่มส่วน `broadcast` ระดับบนสุด (ถัดจาก `bindings`) คีย์คือ peer id ของ WhatsApp:

- แชตกลุ่ม: group JID (เช่น `120363403215116621@g.us`)
- DM: หมายเลขโทรศัพท์รูปแบบ E.164 (เช่น `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**ผลลัพธ์:** เมื่อ OpenClaw ควรตอบกลับในแชตนี้ ระบบจะรันเอเจนต์ทั้งสามตัว

### กลยุทธ์การประมวลผล

ควบคุมวิธีที่เอเจนต์ประมวลผลข้อความ:

#### แบบขนาน (ค่าเริ่มต้น)

เอเจนต์ทั้งหมดประมวลผลพร้อมกัน:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### แบบลำดับต่อเนื่อง

เอเจนต์ประมวลผลตามลำดับ (ตัวหนึ่งรอให้ตัวก่อนหน้าเสร็จก่อน):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### ตัวอย่างแบบสมบูรณ์

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## การทำงาน

### ลำดับการไหลของข้อความ

1. **ข้อความขาเข้า** มาถึงในกลุ่ม WhatsApp
2. **ตรวจสอบการกระจายข้อความ**: ระบบตรวจสอบว่า peer ID อยู่ใน `broadcast` หรือไม่
3. **ถ้าอยู่ในรายการ broadcast**:
   - เอเจนต์ทั้งหมดที่ระบุจะประมวลผลข้อความ
   - เอเจนต์แต่ละตัวมี session key ของตัวเองและ context ที่แยกจากกัน
   - เอเจนต์จะประมวลผลแบบขนาน (ค่าเริ่มต้น) หรือแบบลำดับต่อเนื่อง
4. **ถ้าไม่อยู่ในรายการ broadcast**:
   - ใช้การกำหนดเส้นทางปกติ (binding ตัวแรกที่ตรงเงื่อนไข)

หมายเหตุ: กลุ่มการกระจายข้อความจะไม่ข้ามกฎ allowlist ของช่องทางหรือกฎการเปิดใช้งานกลุ่ม (mentions/commands/ฯลฯ) โดยจะเปลี่ยนเพียง _เอเจนต์ใดถูกเรียกใช้งาน_ เมื่อข้อความนั้นมีสิทธิ์ได้รับการประมวลผล

### การแยก Session

เอเจนต์แต่ละตัวในกลุ่มการกระจายข้อความจะเก็บข้อมูลแยกจากกันอย่างสมบูรณ์ในส่วนต่อไปนี้:

- **Session keys** (`agent:alfred:whatsapp:group:120363...` เทียบกับ `agent:baerbel:whatsapp:group:120363...`)
- **ประวัติการสนทนา** (เอเจนต์จะไม่เห็นข้อความของเอเจนต์ตัวอื่น)
- **Workspace** (sandbox แยกกัน หากกำหนดไว้)
- **สิทธิ์การใช้เครื่องมือ** (allow/deny list ต่างกัน)
- **หน่วยความจำ/context** (`IDENTITY.md`, `SOUL.md` ฯลฯ แยกกัน)
- **บัฟเฟอร์ context ของกลุ่ม** (ข้อความล่าสุดในกลุ่มที่ใช้เป็น context) ใช้ร่วมกันต่อ peer ดังนั้นเอเจนต์ทุกตัวใน broadcast จะเห็น context เดียวกันเมื่อถูกเรียกใช้

สิ่งนี้ทำให้เอเจนต์แต่ละตัวสามารถมี:

- บุคลิกที่ต่างกัน
- สิทธิ์การใช้เครื่องมือที่ต่างกัน (เช่น อ่านอย่างเดียว เทียบกับ อ่าน-เขียน)
- โมเดลที่ต่างกัน (เช่น opus เทียบกับ sonnet)
- Skills ที่ติดตั้งต่างกัน

### ตัวอย่าง: Session ที่แยกจากกัน

ในกลุ่ม `120363403215116621@g.us` ที่มีเอเจนต์ `["alfred", "baerbel"]`:

**context ของ Alfred:**

```text
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**context ของ Bärbel:**

```text
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## แนวทางปฏิบัติที่แนะนำ

### 1. ให้เอเจนต์มีหน้าที่ชัดเจน

ออกแบบให้เอเจนต์แต่ละตัวมีหน้าที่เดียวที่ชัดเจน:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **ดี:** เอเจนต์แต่ละตัวมีหน้าที่เดียว  
❌ **ไม่ดี:** ใช้เอเจนต์ทั่วไปตัวเดียวชื่อ "dev-helper"

### 2. ใช้ชื่อที่สื่อความหมาย

ตั้งชื่อให้ชัดว่าเอเจนต์แต่ละตัวทำอะไร:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. กำหนดสิทธิ์การใช้เครื่องมือให้ต่างกัน

ให้เอเจนต์แต่ละตัวเข้าถึงเฉพาะเครื่องมือที่จำเป็น:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // อ่านอย่างเดียว
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // อ่าน-เขียน
    }
  }
}
```

### 4. ติดตามประสิทธิภาพ

เมื่อมีเอเจนต์จำนวนมาก ให้พิจารณา:

- ใช้ `"strategy": "parallel"` (ค่าเริ่มต้น) เพื่อความเร็ว
- จำกัดกลุ่มการกระจายข้อความไว้ที่ 5-10 เอเจนต์
- ใช้โมเดลที่เร็วกว่าสำหรับเอเจนต์ที่ทำงานง่ายกว่า

### 5. จัดการความล้มเหลวอย่างเหมาะสม

เอเจนต์ล้มเหลวได้อย่างอิสระ ความผิดพลาดของเอเจนต์หนึ่งจะไม่ขัดขวางตัวอื่น:

```text
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## ความเข้ากันได้

### ผู้ให้บริการ

ปัจจุบันกลุ่มการกระจายข้อความใช้งานได้กับ:

- ✅ WhatsApp (รองรับแล้ว)
- 🚧 Telegram (วางแผนไว้)
- 🚧 Discord (วางแผนไว้)
- 🚧 Slack (วางแผนไว้)

### การกำหนดเส้นทาง

กลุ่มการกระจายข้อความทำงานร่วมกับการกำหนดเส้นทางที่มีอยู่ได้:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: มีเพียง alfred ที่ตอบกลับ (การกำหนดเส้นทางปกติ)
- `GROUP_B`: agent1 และ agent2 ตอบกลับ (กระจายข้อความ)

**ลำดับความสำคัญ:** `broadcast` มีลำดับความสำคัญสูงกว่า `bindings`

## การแก้ไขปัญหา

### เอเจนต์ไม่ตอบกลับ

**ตรวจสอบ:**

1. ID ของเอเจนต์มีอยู่ใน `agents.list`
2. รูปแบบ Peer ID ถูกต้อง (เช่น `120363403215116621@g.us`)
3. เอเจนต์ไม่ได้อยู่ใน deny list

**ดีบัก:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### มีเพียงเอเจนต์ตัวเดียวที่ตอบกลับ

**สาเหตุ:** Peer ID อาจอยู่ใน `bindings` แต่ไม่อยู่ใน `broadcast`

**วิธีแก้:** เพิ่มลงในการกำหนดค่า broadcast หรือนำออกจาก bindings

### ปัญหาด้านประสิทธิภาพ

**หากช้าเมื่อมีเอเจนต์หลายตัว:**

- ลดจำนวนเอเจนต์ต่อกลุ่ม
- ใช้โมเดลที่เบากว่า (sonnet แทน opus)
- ตรวจสอบเวลาเริ่มต้นของ sandbox

## ตัวอย่าง

### ตัวอย่าง 1: ทีมตรวจสอบโค้ด

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**ผู้ใช้ส่ง:** โค้ดตัวอย่าง  
**การตอบกลับ:**

- code-formatter: "แก้ไขการเยื้องและเพิ่ม type hints แล้ว"
- security-scanner: "⚠️ พบช่องโหว่ SQL injection ที่บรรทัด 12"
- test-coverage: "Coverage อยู่ที่ 45% และยังขาดการทดสอบสำหรับกรณี error"
- docs-checker: "ไม่มี docstring สำหรับฟังก์ชัน `process_data`"

### ตัวอย่าง 2: การรองรับหลายภาษา

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## ข้อมูลอ้างอิง API

### สคีมาการกำหนดค่า

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### ฟิลด์

- `strategy` (ไม่บังคับ): วิธีประมวลผลเอเจนต์
  - `"parallel"` (ค่าเริ่มต้น): เอเจนต์ทั้งหมดประมวลผลพร้อมกัน
  - `"sequential"`: เอเจนต์ประมวลผลตามลำดับในอาร์เรย์
- `[peerId]`: WhatsApp group JID, หมายเลข E.164 หรือ peer ID อื่น
  - ค่า: อาร์เรย์ของ ID เอเจนต์ที่ควรประมวลผลข้อความ

## ข้อจำกัด

1. **จำนวนเอเจนต์สูงสุด:** ไม่มีข้อจำกัดตายตัว แต่หากเกิน 10 เอเจนต์อาจทำงานช้า
2. **context ที่ใช้ร่วมกัน:** เอเจนต์จะไม่เห็นการตอบกลับของกันและกัน (เป็นการออกแบบโดยตั้งใจ)
3. **ลำดับข้อความ:** การตอบกลับแบบขนานอาจมาถึงในลำดับใดก็ได้
4. **Rate limit:** เอเจนต์ทั้งหมดนับรวมใน rate limit ของ WhatsApp

## การปรับปรุงในอนาคต

ฟีเจอร์ที่วางแผนไว้:

- [ ] โหมด context ที่ใช้ร่วมกัน (เอเจนต์เห็นการตอบกลับของกันและกัน)
- [ ] การประสานงานระหว่างเอเจนต์ (เอเจนต์สามารถส่งสัญญาณหากันได้)
- [ ] การเลือกเอเจนต์แบบไดนามิก (เลือกเอเจนต์ตามเนื้อหาของข้อความ)
- [ ] ลำดับความสำคัญของเอเจนต์ (บางเอเจนต์ตอบก่อนเอเจนต์อื่น)

## ที่เกี่ยวข้อง

- [กลุ่ม](/th/channels/groups)
- [การกำหนดเส้นทางของช่องทาง](/th/channels/channel-routing)
- [การจับคู่](/th/channels/pairing)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [การจัดการ session](/th/concepts/session)
