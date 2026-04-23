---
read_when:
    - คุณต้องการ agents หลายชุดที่แยกจากกัน (เวิร์กสเปซ + การกำหนดเส้นทาง + การยืนยันตัวตน)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agents
x-i18n:
    generated_at: "2026-04-23T06:17:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

จัดการ agents ที่แยกจากกัน (เวิร์กสเปซ + การยืนยันตัวตน + การกำหนดเส้นทาง)

ที่เกี่ยวข้อง:

- การกำหนดเส้นทางแบบหลาย agent: [การกำหนดเส้นทางแบบหลาย Agent](/th/concepts/multi-agent)
- เวิร์กสเปซของ agent: [เวิร์กสเปซของ Agent](/th/concepts/agent-workspace)
- การตั้งค่าการมองเห็น Skills: [การตั้งค่า Skills](/th/tools/skills-config)

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

## การผูกการกำหนดเส้นทาง

ใช้การผูกการกำหนดเส้นทางเพื่อตรึงทราฟฟิกขาเข้าของช่องทางให้ไปยัง agent ที่ระบุ

หากคุณต้องการให้แต่ละ agent มองเห็น Skills ต่างกันด้วย ให้กำหนดค่า
`agents.defaults.skills` และ `agents.list[].skills` ใน `openclaw.json` ดู
[การตั้งค่า Skills](/th/tools/skills-config) และ
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#agents-defaults-skills)

แสดงรายการการผูก:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

เพิ่มการผูก:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

หากคุณละเว้น `accountId` (`--bind <channel>`), OpenClaw จะกำหนดค่าให้จากค่าเริ่มต้นของช่องทางและ hook การตั้งค่า plugin เมื่อมีให้ใช้งาน

หากคุณละเว้น `--agent` สำหรับ `bind` หรือ `unbind`, OpenClaw จะใช้ default agent ปัจจุบันเป็นเป้าหมาย

### พฤติกรรมขอบเขตการผูก

- การผูกที่ไม่มี `accountId` จะตรงกับบัญชีเริ่มต้นของช่องทางเท่านั้น
- `accountId: "*"` คือค่าตกสำรองระดับทั้งช่องทาง (ทุกบัญชี) และมีความเฉพาะเจาะจงน้อยกว่าการผูกกับบัญชีแบบชัดเจน
- หาก agent เดิมมีการผูกช่องทางที่ตรงกันอยู่แล้วโดยไม่มี `accountId` และภายหลังคุณผูกด้วย `accountId` แบบชัดเจนหรือที่ระบบกำหนดให้ OpenClaw จะอัปเกรดการผูกเดิมนั้นในตำแหน่งเดิมแทนการเพิ่มรายการซ้ำ

ตัวอย่าง:

```bash
# การผูกแบบเฉพาะช่องทางเริ่มต้น
openclaw agents bind --agent work --bind telegram

# ภายหลังอัปเกรดเป็นการผูกที่อยู่ในขอบเขตของบัญชี
openclaw agents bind --agent work --bind telegram:ops
```

หลังการอัปเกรด การกำหนดเส้นทางสำหรับการผูกนั้นจะอยู่ในขอบเขต `telegram:ops` หากคุณต้องการการกำหนดเส้นทางสำหรับบัญชีเริ่มต้นด้วย ให้เพิ่มอย่างชัดเจน (เช่น `--bind telegram:default`)

ลบการผูก:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` รับได้อย่างใดอย่างหนึ่งระหว่าง `--all` หรือค่า `--bind` ตั้งแต่หนึ่งค่าขึ้นไป แต่ไม่สามารถใช้ทั้งสองอย่างพร้อมกันได้

## พื้นผิวคำสั่ง

### `agents`

การรัน `openclaw agents` โดยไม่มีคำสั่งย่อย เทียบเท่ากับ `openclaw agents list`

### `agents list`

ตัวเลือก:

- `--json`
- `--bindings`: รวมกฎการกำหนดเส้นทางทั้งหมด ไม่ใช่เพียงจำนวน/สรุปต่อ agent

### `agents add [name]`

ตัวเลือก:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ระบุซ้ำได้)
- `--non-interactive`
- `--json`

หมายเหตุ:

- การส่งแฟล็ก add แบบชัดเจนใดๆ จะสลับคำสั่งไปใช้เส้นทางแบบไม่โต้ตอบ
- โหมดไม่โต้ตอบต้องมีทั้งชื่อ agent และ `--workspace`
- `main` เป็นคำสงวนและไม่สามารถใช้เป็น id ของ agent ใหม่ได้

### `agents bindings`

ตัวเลือก:

- `--agent <id>`
- `--json`

### `agents bind`

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือ default agent ปัจจุบัน)
- `--bind <channel[:accountId]>` (ระบุซ้ำได้)
- `--json`

### `agents unbind`

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือ default agent ปัจจุบัน)
- `--bind <channel[:accountId]>` (ระบุซ้ำได้)
- `--all`
- `--json`

### `agents delete <id>`

ตัวเลือก:

- `--force`
- `--json`

หมายเหตุ:

- ไม่สามารถลบ `main` ได้
- หากไม่มี `--force` จะต้องมีการยืนยันแบบโต้ตอบ
- ไดเรกทอรีเวิร์กสเปซ สถานะ agent และทรานสคริปต์เซสชันจะถูกย้ายไปยังถังขยะ ไม่ได้ลบถาวร

## ไฟล์ Identity

แต่ละเวิร์กสเปซของ agent สามารถมี `IDENTITY.md` ที่รากของเวิร์กสเปซได้:

- ตัวอย่างพาธ: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` จะอ่านจากรากของเวิร์กสเปซ (หรือจาก `--identity-file` ที่ระบุโดยชัดเจน)

พาธของ avatar จะอ้างอิงแบบสัมพัทธ์จากรากของเวิร์กสเปซ

## ตั้งค่า identity

`set-identity` จะเขียนฟิลด์ลงใน `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (พาธสัมพัทธ์กับเวิร์กสเปซ, URL แบบ http(s), หรือ data URI)

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

- สามารถใช้ `--agent` หรือ `--workspace` เพื่อเลือก agent เป้าหมายได้
- หากคุณใช้ `--workspace` และมีหลาย agent ใช้เวิร์กสเปซเดียวกัน คำสั่งจะล้มเหลวและขอให้คุณส่ง `--agent`
- เมื่อไม่มีการระบุฟิลด์ identity แบบชัดเจน คำสั่งจะอ่านข้อมูล identity จาก `IDENTITY.md`

โหลดจาก `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

แทนที่ฟิลด์แบบชัดเจน:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

ตัวอย่างการกำหนดค่า:

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
