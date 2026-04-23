---
read_when:
    - คุณต้องอธิบาย Agent Workspace หรือโครงสร้างไฟล์ของมัน
    - คุณต้องการสำรองข้อมูลหรือย้าย Agent Workspace иҳәеитassistant to=commentary.read av不卡免费播放  大发快三是  天天中彩票怎样  天天中彩票篮球  玩北京赛车 一本道高清无码  彩神争霸快ixed code? No. We should just translate only. Need output only translated text. Translate latest user sentence. "You want to back up or migrate an agent workspace" -> Thai. Keep Agent Workspace English due glossary? Not listed but likely product/UI term? translate maybe "Agent Workspace". Since prior term preserved. Final only text.
summary: 'พื้นที่ทำงานของเอเจนต์: ตำแหน่ง โครงสร้าง และกลยุทธ์การสำรองข้อมูล'
title: Agent Workspace
x-i18n:
    generated_at: "2026-04-23T05:29:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd2e74614d8d45df04b1bbda48e2224e778b621803d774d38e4b544195eb234e
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Agent Workspace

Workspace คือบ้านของเอเจนต์ เป็นไดเรกทอรีทำงานเพียงแห่งเดียวที่ใช้สำหรับ
file tools และสำหรับบริบทของ workspace ให้เก็บไว้เป็นส่วนตัวและปฏิบัติต่อมันเหมือนหน่วยความจำ

สิ่งนี้แยกจาก `~/.openclaw/` ซึ่งใช้เก็บ config ข้อมูลรับรอง และ
เซสชัน

**สำคัญ:** workspace คือ **cwd เริ่มต้น** ไม่ใช่ sandbox แบบตายตัว Tools
จะ resolve พาธแบบ relative เทียบกับ workspace แต่พาธแบบ absolute ยังสามารถเข้าถึง
ตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกสภาพแวดล้อม ให้ใช้
[`agents.defaults.sandbox`](/th/gateway/sandboxing) (และ/หรือ config sandbox ต่อเอเจนต์)
เมื่อเปิดใช้ sandboxing และ `workspaceAccess` ไม่ใช่ `"rw"` tools จะทำงาน
ภายใน sandbox workspace ใต้ `~/.openclaw/sandboxes` ไม่ใช่ host workspace ของคุณ

## ตำแหน่งเริ่มต้น

- ค่าเริ่มต้น: `~/.openclaw/workspace`
- หากมีการตั้งค่า `OPENCLAW_PROFILE` และไม่ใช่ `"default"` ค่าเริ่มต้นจะกลายเป็น
  `~/.openclaw/workspace-<profile>`.
- override ใน `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` หรือ `openclaw setup` จะสร้าง
workspace และวางไฟล์ bootstrap เริ่มต้นหากยังไม่มี
การคัดลอก seed ของ sandbox จะยอมรับเฉพาะไฟล์ปกติภายใน workspace เท่านั้น; alias แบบ symlink/hardlink
ที่ resolve ออกนอก source workspace จะถูกละเว้น

หากคุณจัดการไฟล์ใน workspace ด้วยตัวเองอยู่แล้ว คุณสามารถปิดการสร้างไฟล์
bootstrap ได้:

```json5
{ agent: { skipBootstrap: true } }
```

## โฟลเดอร์ workspace เพิ่มเติม

การติดตั้งรุ่นเก่าอาจเคยสร้าง `~/openclaw`
การมีหลายไดเรกทอรี workspace พร้อมกันอาจทำให้เกิด auth หรือสถานะที่คลาดเคลื่อนได้อย่างสับสน เพราะจะมีเพียง
workspace เดียวเท่านั้นที่ active ในแต่ละครั้ง

**คำแนะนำ:** ให้มี active workspace เพียงอันเดียว หากคุณไม่ได้ใช้
โฟลเดอร์เพิ่มเติมเหล่านั้นแล้ว ให้เก็บถาวรหรือย้ายไปถังขยะ (เช่น `trash ~/openclaw`)
หากคุณตั้งใจเก็บหลาย workspace ไว้ ให้แน่ใจว่า
`agents.defaults.workspace` ชี้ไปยังอันที่ active อยู่

`openclaw doctor` จะเตือนเมื่อพบไดเรกทอรี workspace เพิ่มเติม

## แผนผังไฟล์ของ workspace (แต่ละไฟล์หมายถึงอะไร)

นี่คือไฟล์มาตรฐานที่ OpenClaw คาดว่าจะมีภายใน workspace:

- `AGENTS.md`
  - คำสั่งการทำงานสำหรับเอเจนต์และวิธีที่มันควรใช้หน่วยความจำ
  - โหลดเมื่อเริ่มทุกเซสชัน
  - เหมาะสำหรับใส่กฎ ลำดับความสำคัญ และรายละเอียด "ควรทำตัวอย่างไร"

- `SOUL.md`
  - บุคลิก น้ำเสียง และขอบเขต
  - โหลดทุกเซสชัน
  - คู่มือ: [คู่มือบุคลิก SOUL.md](/th/concepts/soul)

- `USER.md`
  - ผู้ใช้คือใคร และควรเรียกหรือสื่อสารกับผู้ใช้อย่างไร
  - โหลดทุกเซสชัน

- `IDENTITY.md`
  - ชื่อ บรรยากาศ และอีโมจิของเอเจนต์
  - ถูกสร้าง/อัปเดตระหว่างพิธี bootstrap

- `TOOLS.md`
  - บันทึกเกี่ยวกับ local tools และธรรมเนียมการใช้งานของคุณ
  - ไม่ได้ควบคุมความพร้อมใช้งานของ tool; เป็นเพียงคำแนะนำเท่านั้น

- `HEARTBEAT.md`
  - เช็กลิสต์ขนาดเล็กแบบไม่บังคับสำหรับการรัน Heartbeat
  - ควรสั้นเพื่อหลีกเลี่ยงการใช้ token เกินจำเป็น

- `BOOT.md`
  - เช็กลิสต์เริ่มต้นแบบไม่บังคับที่ทำงานเมื่อ gateway รีสตาร์ต หากเปิดใช้ internal hooks
  - ควรสั้น; ใช้ message tool สำหรับการส่งข้อความขาออก

- `BOOTSTRAP.md`
  - พิธีเริ่มต้นแบบครั้งเดียวเมื่อรันครั้งแรก
  - สร้างเฉพาะสำหรับ workspace ใหม่เอี่ยมเท่านั้น
  - ลบทิ้งหลังจากพิธีเสร็จสมบูรณ์

- `memory/YYYY-MM-DD.md`
  - บันทึกหน่วยความจำรายวัน (หนึ่งไฟล์ต่อวัน)
  - แนะนำให้อ่านของวันนี้ + เมื่อวานตอนเริ่มเซสชัน

- `MEMORY.md` (ไม่บังคับ)
  - หน่วยความจำระยะยาวที่ผ่านการคัดสรร
  - โหลดเฉพาะในเซสชันหลักแบบส่วนตัวเท่านั้น (ไม่ใช่บริบทร่วม/กลุ่ม)

ดู [Memory](/th/concepts/memory) สำหรับเวิร์กโฟลว์และการ flush หน่วยความจำอัตโนมัติ

- `skills/` (ไม่บังคับ)
  - Skills เฉพาะของ workspace
  - เป็นตำแหน่ง Skills ที่มีลำดับความสำคัญสูงสุดสำหรับ workspace นั้น
  - override skills ของเอเจนต์ระดับโปรเจกต์ skills ของเอเจนต์ส่วนตัว managed skills bundled skills และ `skills.load.extraDirs` เมื่อชื่อชนกัน

- `canvas/` (ไม่บังคับ)
  - ไฟล์ UI ของ canvas สำหรับการแสดงผล Node (เช่น `canvas/index.html`)

หากไฟล์ bootstrap ใดหายไป OpenClaw จะฉีดตัวบ่งชี้ "missing file" เข้าไปใน
เซสชันและทำงานต่อ ไฟล์ bootstrap ขนาดใหญ่จะถูกตัดทอนเมื่อฉีดเข้าไป;
ปรับขีดจำกัดได้ด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และ
`agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000)
`openclaw setup` สามารถสร้างค่าเริ่มต้นที่หายไปขึ้นใหม่ได้โดยไม่เขียนทับ
ไฟล์ที่มีอยู่

## สิ่งที่ไม่ได้อยู่ใน workspace

สิ่งเหล่านี้อยู่ใต้ `~/.openclaw/` และ **ไม่ควร** commit เข้า repo ของ workspace:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (โปรไฟล์ auth ของโมเดล: OAuth + API keys)
- `~/.openclaw/credentials/` (สถานะของช่องทาง/ผู้ให้บริการ รวมถึงข้อมูลนำเข้า OAuth แบบเดิม)
- `~/.openclaw/agents/<agentId>/sessions/` (transcript ของเซสชัน + metadata)
- `~/.openclaw/skills/` (managed Skills)

หากคุณต้องย้ายเซสชันหรือ config ให้คัดลอกแยกต่างหาก และเก็บมัน
ไว้นอก version control

## การสำรองด้วย Git (แนะนำ, แบบส่วนตัว)

ให้ปฏิบัติต่อ workspace เหมือนเป็นหน่วยความจำส่วนตัว นำมันไปใส่ไว้ใน git repo แบบ **private**
เพื่อให้มีการสำรองและกู้คืนได้

ให้รันขั้นตอนเหล่านี้บนเครื่องที่ Gateway รันอยู่ (นั่นคือที่ที่
workspace อยู่)

### 1) เริ่มต้น repo

หากติดตั้ง git ไว้ workspace ใหม่เอี่ยมจะถูก initialize ให้อัตโนมัติ หาก
workspace นี้ยังไม่เป็น repo ให้รัน:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) เพิ่ม remote แบบ private (ตัวเลือกที่เหมาะกับผู้เริ่มต้น)

ตัวเลือก A: GitHub web UI

1. สร้าง repository ใหม่แบบ **private** บน GitHub
2. อย่า initialize ด้วย README (เพื่อหลีกเลี่ยง merge conflict)
3. คัดลอก HTTPS remote URL
4. เพิ่ม remote และ push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

ตัวเลือก B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

ตัวเลือก C: GitLab web UI

1. สร้าง repository ใหม่แบบ **private** บน GitLab
2. อย่า initialize ด้วย README (เพื่อหลีกเลี่ยง merge conflict)
3. คัดลอก HTTPS remote URL
4. เพิ่ม remote และ push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) การอัปเดตต่อเนื่อง

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## อย่า commit ความลับ

แม้จะเป็น repo ส่วนตัว ก็ควรหลีกเลี่ยงการเก็บความลับไว้ใน workspace:

- API keys, OAuth tokens, รหัสผ่าน หรือข้อมูลรับรองส่วนตัว
- ทุกอย่างใต้ `~/.openclaw/`
- ข้อมูลแชตดิบหรือไฟล์แนบที่มีความอ่อนไหว

หากจำเป็นต้องเก็บการอ้างอิงที่อ่อนไหว ให้ใช้ placeholder และเก็บความลับจริง
ไว้ที่อื่น (password manager, ตัวแปรสภาพแวดล้อม หรือ `~/.openclaw/`)

ตัวอย่างเริ่มต้นของ `.gitignore` ที่แนะนำ:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## การย้าย workspace ไปยังเครื่องใหม่

1. clone repo ไปยังพาธที่ต้องการ (ค่าเริ่มต้น `~/.openclaw/workspace`)
2. ตั้งค่า `agents.defaults.workspace` ให้เป็นพาธนั้นใน `~/.openclaw/openclaw.json`
3. รัน `openclaw setup --workspace <path>` เพื่อวางไฟล์ที่ขาดหาย
4. หากคุณต้องการเซสชัน ให้คัดลอก `~/.openclaw/agents/<agentId>/sessions/` จาก
   เครื่องเก่าแยกต่างหาก

## หมายเหตุขั้นสูง

- การกำหนดเส้นทางหลายเอเจนต์สามารถใช้ workspace ต่างกันต่อเอเจนต์ได้ ดู
  [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) สำหรับ config การกำหนดเส้นทาง
- หากเปิดใช้ `agents.defaults.sandbox` เซสชันที่ไม่ใช่ main สามารถใช้ sandbox
  workspace ต่อเซสชันภายใต้ `agents.defaults.sandbox.workspaceRoot`

## ที่เกี่ยวข้อง

- [คำสั่งถาวร](/th/automation/standing-orders) — คำสั่งแบบคงอยู่ในไฟล์ของ workspace
- [Heartbeat](/th/gateway/heartbeat) — ไฟล์ workspace `HEARTBEAT.md`
- [Session](/th/concepts/session) — พาธการจัดเก็บเซสชัน
- [Sandboxing](/th/gateway/sandboxing) — การเข้าถึง workspace ในสภาพแวดล้อมแบบ sandboxed
