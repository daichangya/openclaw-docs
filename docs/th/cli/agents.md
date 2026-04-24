---
read_when:
    - คุณต้องการเอเจนต์หลายตัวที่แยกออกจากกัน (workspaces + routing + auth)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: เอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:01:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

จัดการเอเจนต์ที่แยกออกจากกัน (workspace + auth + routing)

ที่เกี่ยวข้อง:

- การ route แบบหลายเอเจนต์: [Multi-Agent Routing](/th/concepts/multi-agent)
- workspace ของเอเจนต์: [Agent workspace](/th/concepts/agent-workspace)
- การกำหนดค่าการมองเห็น Skills: [Skills config](/th/tools/skills-config)

## ตัวอย่าง

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## การผูกการ route

ใช้การผูกการ route เพื่อปักหมุดทราฟฟิก channel ขาเข้าไปยังเอเจนต์ที่ระบุ

หากคุณต้องการให้แต่ละเอเจนต์มองเห็น Skills ต่างกันด้วย ให้กำหนดค่า
`agents.defaults.skills` และ `agents.list[].skills` ใน `openclaw.json` ดู
[Skills config](/th/tools/skills-config) และ
[Configuration Reference](/th/gateway/config-agents#agents-defaults-skills)

แสดงรายการ bindings:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

เพิ่ม bindings:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

หากคุณไม่ระบุ `accountId` (`--bind <channel>`) OpenClaw จะ resolve ค่านี้จากค่าเริ่มต้นของ channel และ hook สำหรับการตั้งค่า plugin เมื่อมีให้ใช้

หากคุณไม่ระบุ `--agent` สำหรับ `bind` หรือ `unbind` OpenClaw จะใช้เอเจนต์เริ่มต้นปัจจุบันเป็นเป้าหมาย

### พฤติกรรมของขอบเขต binding

- binding ที่ไม่มี `accountId` จะตรงกับบัญชีเริ่มต้นของ channel เท่านั้น
- `accountId: "*"` คือ fallback ระดับ channel (ทุกบัญชี) และมีความเฉพาะเจาะจงน้อยกว่า binding ที่ระบุบัญชีแบบชัดเจน
- หากเอเจนต์เดียวกันมี channel binding ที่ตรงกันอยู่แล้วโดยไม่มี `accountId` และภายหลังคุณ bind ด้วย `accountId` ที่ระบุหรือ resolve แล้ว OpenClaw จะอัปเกรด binding เดิมนั้นในตำแหน่งเดิมแทนการเพิ่มรายการซ้ำ

ตัวอย่าง:

```bash
# channel-only binding เริ่มต้น
openclaw agents bind --agent work --bind telegram

# อัปเกรดเป็น binding แบบมีขอบเขตตามบัญชีในภายหลัง
openclaw agents bind --agent work --bind telegram:ops
```

หลังจากอัปเกรดแล้ว การ route สำหรับ binding นั้นจะมีขอบเขตเป็น `telegram:ops` หากคุณต้องการการ route สำหรับบัญชีเริ่มต้นด้วย ให้เพิ่มแบบชัดเจน (เช่น `--bind telegram:default`)

ลบ bindings:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` รับได้อย่างใดอย่างหนึ่งระหว่าง `--all` หรือค่า `--bind` หนึ่งค่าขึ้นไป แต่ไม่รับทั้งสองแบบพร้อมกัน

## พื้นผิวคำสั่ง

### `agents`

การรัน `openclaw agents` โดยไม่มีคำสั่งย่อย เทียบเท่ากับ `openclaw agents list`

### `agents list`

ตัวเลือก:

- `--json`
- `--bindings`: รวมกฎการ route แบบเต็ม ไม่ใช่เฉพาะจำนวน/สรุปต่อเอเจนต์

### `agents add [name]`

ตัวเลือก:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ระบุซ้ำได้)
- `--non-interactive`
- `--json`

หมายเหตุ:

- การส่ง flag สำหรับ add แบบชัดเจนอย่างใดอย่างหนึ่งจะทำให้คำสั่งเข้าสู่เส้นทางแบบ non-interactive
- โหมด non-interactive ต้องมีทั้งชื่อเอเจนต์และ `--workspace`
- `main` เป็นชื่อสงวนและไม่สามารถใช้เป็น agent id ใหม่ได้

### `agents bindings`

ตัวเลือก:

- `--agent <id>`
- `--json`

### `agents bind`

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือเอเจนต์เริ่มต้นปัจจุบัน)
- `--bind <channel[:accountId]>` (ระบุซ้ำได้)
- `--json`

### `agents unbind`

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือเอเจนต์เริ่มต้นปัจจุบัน)
- `--bind <channel[:accountId]>` (ระบุซ้ำได้)
- `--all`
- `--json`

### `agents delete <id>`

ตัวเลือก:

- `--force`
- `--json`

หมายเหตุ:

- ไม่สามารถลบ `main` ได้
- หากไม่มี `--force` จะต้องยืนยันแบบโต้ตอบ
- ไดเรกทอรี workspace, สถานะของเอเจนต์ และ transcript ของเซสชัน จะถูกย้ายไปยังถังขยะ ไม่ได้ถูกลบถาวร

## ไฟล์ identity

workspace ของเอเจนต์แต่ละตัวสามารถมี `IDENTITY.md` ที่รากของ workspace:

- พาธตัวอย่าง: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` จะอ่านจากรากของ workspace (หรือ `--identity-file` ที่ระบุชัดเจน)

พาธ avatar จะอ้างอิงเทียบกับรากของ workspace

## ตั้งค่า identity

`set-identity` จะเขียนฟิลด์ลงใน `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (พาธที่อ้างอิงกับ workspace, URL แบบ http(s) หรือ data URI)

ตัวเลือก:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

หมายเหตุ:

- สามารถใช้ `--agent` หรือ `--workspace` เพื่อเลือกเอเจนต์เป้าหมายได้
- หากคุณใช้ `--workspace` และมีหลายเอเจนต์ใช้ workspace เดียวกัน คำสั่งจะล้มเหลวและขอให้คุณส่ง `--agent`
- เมื่อไม่ได้ระบุฟิลด์ identity แบบชัดเจน คำสั่งจะอ่านข้อมูล identity จาก `IDENTITY.md`

โหลดจาก `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

override ฟิลด์แบบชัดเจน:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

ตัวอย่าง config:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Multi-Agent Routing](/th/concepts/multi-agent)
- [Agent workspace](/th/concepts/agent-workspace)
