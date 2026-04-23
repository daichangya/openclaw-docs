---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูความเคลื่อนไหวล่าสุด
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้ + การใช้งาน)
title: sessions
x-i18n:
    generated_at: "2026-04-23T06:19:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

แสดงรายการเซสชันการสนทนาที่จัดเก็บไว้

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

การเลือกขอบเขต:

- ค่าเริ่มต้น: ที่เก็บของ agent เริ่มต้นที่ตั้งค่าไว้
- `--verbose`: บันทึกแบบละเอียด
- `--agent <id>`: ที่เก็บของ agent ที่ตั้งค่าไว้หนึ่งรายการ
- `--all-agents`: รวมทุกที่เก็บของ agent ที่ตั้งค่าไว้
- `--store <path>`: เส้นทางที่เก็บแบบระบุชัดเจน (ใช้ร่วมกับ `--agent` หรือ `--all-agents` ไม่ได้)

`openclaw sessions --all-agents` จะอ่านที่เก็บของ agent ที่ตั้งค่าไว้ การค้นหาเซสชันของ Gateway และ ACP
มีขอบเขตกว้างกว่า: รวมถึงที่เก็บที่พบบนดิสก์อย่างเดียวภายใต้ราก `agents/` เริ่มต้นหรือราก `session.store` แบบเทมเพลตด้วย
ที่เก็บที่ค้นพบเหล่านี้ต้อง resolve ไปยังไฟล์ `sessions.json` ปกติภายในรากของ agent;
symlinks และเส้นทางที่อยู่นอกรากจะถูกข้าม

ตัวอย่าง JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## การบำรุงรักษาการล้างข้อมูล

รันการบำรุงรักษาทันที (แทนที่จะรอรอบการเขียนครั้งถัดไป):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จาก config:

- หมายเหตุด้านขอบเขต: `openclaw sessions cleanup` จะบำรุงรักษาเฉพาะที่เก็บเซสชัน/ทรานสคริปต์เท่านั้น จะไม่ล้าง cron run logs (`cron/runs/<jobId>.jsonl`) ซึ่งถูกจัดการโดย `cron.runLog.maxBytes` และ `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายไว้ใน [การบำรุงรักษา Cron](/th/automation/cron-jobs#maintenance)

- `--dry-run`: แสดงตัวอย่างว่าจะมีการลบ/จำกัดจำนวนรายการเท่าใดโดยไม่เขียนจริง
  - ในโหมดข้อความ dry-run จะแสดงตารางการดำเนินการต่อเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) เพื่อให้คุณเห็นว่าจะเก็บหรือจะลบอะไรบ้าง
- `--enforce`: ใช้การบำรุงรักษาแม้ว่า `session.maintenance.mode` จะเป็น `warn`
- `--fix-missing`: ลบรายการที่ไม่มีไฟล์ transcript อยู่ แม้ว่าปกติแล้วรายการนั้นจะยังไม่ถึงเกณฑ์อายุ/จำนวนที่ต้องถูกลบก็ตาม
- `--active-key <key>`: ปกป้อง active key ที่ระบุจากการถูกนำออกเพราะข้อจำกัดงบประมาณดิสก์
- `--agent <id>`: รันการล้างข้อมูลสำหรับที่เก็บของ agent ที่ตั้งค่าไว้หนึ่งรายการ
- `--all-agents`: รันการล้างข้อมูลสำหรับทุกที่เก็บของ agent ที่ตั้งค่าไว้
- `--store <path>`: รันกับไฟล์ `sessions.json` ที่ระบุเฉพาะ
- `--json`: พิมพ์สรุปแบบ JSON เมื่อใช้กับ `--all-agents` เอาต์พุตจะมีหนึ่งสรุปต่อหนึ่งที่เก็บ

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

ที่เกี่ยวข้อง:

- การตั้งค่าเซสชัน: [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#session)
