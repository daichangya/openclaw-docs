---
read_when:
    - คุณต้องการแสดงรายการเซสชันที่จัดเก็บไว้และดูความเคลื่อนไหวล่าสุด
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw sessions` (แสดงรายการเซสชันที่จัดเก็บไว้และการใช้งาน)
title: เซสชัน
x-i18n:
    generated_at: "2026-04-24T09:04:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

แสดงรายการเซสชันบทสนทนาที่จัดเก็บไว้

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

การเลือกขอบเขต:

- ค่าเริ่มต้น: คลังเก็บของ agent เริ่มต้นที่กำหนดไว้
- `--verbose`: บันทึกแบบละเอียด
- `--agent <id>`: คลังเก็บของ agent ที่กำหนดไว้หนึ่งรายการ
- `--all-agents`: รวมทุกคลังเก็บของ agent ที่กำหนดไว้
- `--store <path>`: path ของคลังเก็บที่ระบุชัดเจน (ห้ามใช้ร่วมกับ `--agent` หรือ `--all-agents`)

`openclaw sessions --all-agents` จะอ่านคลังเก็บของ agent ที่กำหนดไว้ การค้นหาเซสชันของ Gateway และ ACP
ครอบคลุมกว้างกว่า: ยังรวมคลังเก็บที่พบบนดิสก์เท่านั้นภายใต้ราก `agents/` เริ่มต้น หรือราก `session.store` ที่เป็น template ด้วย
คลังเก็บที่ค้นพบเหล่านั้นต้อง resolve ไปยังไฟล์ `sessions.json` แบบไฟล์ปกติภายในรากของ agent; symlink และ paths ที่อยู่นอกรากจะถูกข้าม

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

## การดูแลทำความสะอาด

รันการดูแลรักษาทันที (แทนที่จะรอรอบการเขียนครั้งถัดไป):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` ใช้การตั้งค่า `session.maintenance` จาก config:

- หมายเหตุเรื่องขอบเขต: `openclaw sessions cleanup` ดูแลเฉพาะคลังเก็บเซสชัน/ทรานสคริปต์เท่านั้น ไม่ได้ลบ log การรัน Cron (`cron/runs/<jobId>.jsonl`) ซึ่งจัดการโดย `cron.runLog.maxBytes` และ `cron.runLog.keepLines` ใน [การกำหนดค่า Cron](/th/automation/cron-jobs#configuration) และอธิบายไว้ใน [การดูแล Cron](/th/automation/cron-jobs#maintenance)

- `--dry-run`: ดูตัวอย่างว่าจะมีรายการใดถูกลบ/จำกัดจำนวนเท่าใดโดยไม่เขียนจริง
  - ในโหมดข้อความ dry-run จะแสดงตารางการดำเนินการรายเซสชัน (`Action`, `Key`, `Age`, `Model`, `Flags`) เพื่อให้คุณเห็นว่าจะเก็บอะไรไว้และลบอะไร
- `--enforce`: บังคับใช้การดูแลรักษาแม้ `session.maintenance.mode` จะเป็น `warn`
- `--fix-missing`: ลบรายการที่ไฟล์ทรานสคริปต์หายไป แม้ว่าตามปกติรายการนั้นจะยังไม่เก่าหรือเกินจำนวนก็ตาม
- `--active-key <key>`: ปกป้อง active key ที่ระบุไม่ให้ถูกลบออกเพราะข้อจำกัดงบประมาณดิสก์
- `--agent <id>`: รัน cleanup สำหรับคลังเก็บของ agent ที่กำหนดไว้หนึ่งรายการ
- `--all-agents`: รัน cleanup สำหรับคลังเก็บของ agent ที่กำหนดไว้ทั้งหมด
- `--store <path>`: รันกับไฟล์ `sessions.json` ที่ระบุ
- `--json`: พิมพ์สรุปเป็น JSON เมื่อใช้ `--all-agents` ผลลัพธ์จะรวมสรุปรายคลังเก็บหนึ่งรายการต่อคลังเก็บ

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

- Config ของเซสชัน: [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#session)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การจัดการเซสชัน](/th/concepts/session)
