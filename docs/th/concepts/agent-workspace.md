---
read_when:
    - คุณต้องอธิบายเวิร์กสเปซของเอเจนต์หรือโครงสร้างไฟล์ของมัน
    - คุณต้องการสำรองข้อมูลหรือย้ายเวิร์กสเปซของเอเจนต์
summary: 'เวิร์กสเปซของเอเจนต์: ตำแหน่ง โครงสร้าง และกลยุทธ์การสำรองข้อมูล'
title: เวิร์กสเปซของเอเจนต์
x-i18n:
    generated_at: "2026-04-24T09:05:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6441991b5f9f71b13b2423d3c36b688a2d7d96386381e610a525aaccd55c9bf
    source_path: concepts/agent-workspace.md
    workflow: 15
---

เวิร์กสเปซคือบ้านของเอเจนต์ เป็นไดเรกทอรีทำงานเพียงแห่งเดียวที่ใช้สำหรับ
เครื่องมือไฟล์และสำหรับบริบทของเวิร์กสเปซ ให้เก็บเป็นส่วนตัวและปฏิบัติต่อมันเหมือนเป็นความทรงจำ

สิ่งนี้แยกจาก `~/.openclaw/` ซึ่งเก็บ config, ข้อมูลรับรอง และ
เซสชัน

**สำคัญ:** เวิร์กสเปซคือ **cwd เริ่มต้น** ไม่ใช่ sandbox แบบบังคับตายตัว เครื่องมือ
จะ resolve พาธแบบ relative เทียบกับเวิร์กสเปซ แต่พาธแบบ absolute ยังสามารถเข้าถึง
ตำแหน่งอื่นบนโฮสต์ได้ เว้นแต่จะเปิดใช้ sandboxing หากคุณต้องการการแยกส่วน ให้ใช้
[`agents.defaults.sandbox`](/th/gateway/sandboxing) (และ/หรือ config sandbox ต่อเอเจนต์)
เมื่อเปิดใช้ sandboxing และ `workspaceAccess` ไม่ใช่ `"rw"` เครื่องมือจะทำงาน
ภายใน sandbox workspace ใต้ `~/.openclaw/sandboxes` ไม่ใช่ host workspace ของคุณ

## ตำแหน่งเริ่มต้น

- ค่าเริ่มต้น: `~/.openclaw/workspace`
- หากตั้งค่า `OPENCLAW_PROFILE` และไม่ใช่ `"default"` ค่าเริ่มต้นจะกลายเป็น
  `~/.openclaw/workspace-<profile>`
- override ใน `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` หรือ `openclaw setup` จะสร้าง
เวิร์กสเปซและใส่ไฟล์ bootstrap ให้หากยังไม่มี
การคัดลอก seed ของ sandbox จะยอมรับเฉพาะไฟล์ปกติภายในเวิร์กสเปซเท่านั้น; symlink/hardlink
ที่ resolve ออกไปนอก source workspace จะถูกละเว้น

หากคุณจัดการไฟล์ในเวิร์กสเปซเองอยู่แล้ว คุณสามารถปิดการสร้าง
ไฟล์ bootstrap ได้:

```json5
{ agent: { skipBootstrap: true } }
```

## โฟลเดอร์เวิร์กสเปซเพิ่มเติม

การติดตั้งรุ่นเก่าอาจเคยสร้าง `~/openclaw` การมีหลายไดเรกทอรีเวิร์กสเปซ
อาจทำให้เกิด auth หรือ state drift ที่สับสน เพราะมีเพียงเวิร์กสเปซเดียวเท่านั้นที่ใช้งานอยู่ในแต่ละครั้ง

**คำแนะนำ:** ให้มีเวิร์กสเปซที่ใช้งานอยู่เพียงแห่งเดียว หากคุณไม่ได้ใช้
โฟลเดอร์เพิ่มเติมเหล่านั้นแล้ว ให้เก็บถาวรหรือนำไปไว้ในถังขยะ (เช่น `trash ~/openclaw`)
หากคุณตั้งใจเก็บหลายเวิร์กสเปซไว้ ตรวจสอบให้แน่ใจว่า
`agents.defaults.workspace` ชี้ไปยังเวิร์กสเปซที่ใช้งานอยู่

`openclaw doctor` จะเตือนเมื่อพบไดเรกทอรีเวิร์กสเปซเพิ่มเติม

## แผนผังไฟล์ของเวิร์กสเปซ (แต่ละไฟล์หมายถึงอะไร)

นี่คือไฟล์มาตรฐานที่ OpenClaw คาดว่าจะมีภายในเวิร์กสเปซ:

- `AGENTS.md`
  - คำสั่งการทำงานสำหรับเอเจนต์และวิธีที่มันควรใช้ความทรงจำ
  - โหลดเมื่อเริ่มทุกเซสชัน
  - เหมาะสำหรับกฎ ลำดับความสำคัญ และรายละเอียด “ควรประพฤติตัวอย่างไร”

- `SOUL.md`
  - บุคลิก น้ำเสียง และขอบเขต
  - โหลดทุกเซสชัน
  - คู่มือ: [คู่มือบุคลิก SOUL.md](/th/concepts/soul)

- `USER.md`
  - ผู้ใช้คือใครและควรเรียกเขาอย่างไร
  - โหลดทุกเซสชัน

- `IDENTITY.md`
  - ชื่อ บรรยากาศ และอีโมจิของเอเจนต์
  - ถูกสร้าง/อัปเดตระหว่างพิธี bootstrap

- `TOOLS.md`
  - บันทึกเกี่ยวกับเครื่องมือในเครื่องและแบบแผนของคุณ
  - ไม่ได้ควบคุมการพร้อมใช้งานของเครื่องมือ; เป็นเพียงคำแนะนำเท่านั้น

- `HEARTBEAT.md`
  - เช็กลิสต์ขนาดเล็กแบบไม่บังคับสำหรับการรัน Heartbeat
  - ควรสั้นเพื่อหลีกเลี่ยงการใช้โทเค็นสิ้นเปลือง

- `BOOT.md`
  - เช็กลิสต์เริ่มต้นระบบแบบไม่บังคับที่รันอัตโนมัติเมื่อ gateway รีสตาร์ท (เมื่อเปิดใช้ [internal hooks](/th/automation/hooks))
  - ควรสั้น; ใช้เครื่องมือ message สำหรับการส่งขาออก

- `BOOTSTRAP.md`
  - พิธีครั้งแรกแบบใช้ครั้งเดียว
  - จะถูกสร้างเฉพาะสำหรับเวิร์กสเปซใหม่เอี่ยม
  - ลบทิ้งหลังจากพิธีเสร็จสิ้น

- `memory/YYYY-MM-DD.md`
  - บันทึกความทรงจำรายวัน (หนึ่งไฟล์ต่อวัน)
  - แนะนำให้อ่านของวันนี้ + เมื่อวานเมื่อเริ่มเซสชัน

- `MEMORY.md` (ไม่บังคับ)
  - ความทรงจำระยะยาวที่คัดสรรแล้ว
  - โหลดเฉพาะในเซสชันหลักแบบส่วนตัว (ไม่ใช่บริบทร่วม/กลุ่ม)

ดู [Memory](/th/concepts/memory) สำหรับเวิร์กโฟลว์และการ flush หน่วยความจำอัตโนมัติ

- `skills/` (ไม่บังคับ)
  - Skills เฉพาะเวิร์กสเปซ
  - เป็นตำแหน่ง Skills ที่มีลำดับความสำคัญสูงสุดสำหรับเวิร์กสเปซนั้น
  - จะ override project agent skills, personal agent skills, managed skills, bundled skills และ `skills.load.extraDirs` เมื่อชื่อชนกัน

- `canvas/` (ไม่บังคับ)
  - ไฟล์ UI ของ canvas สำหรับการแสดงผลของ Node (เช่น `canvas/index.html`)

หากไฟล์ bootstrap ใดหายไป OpenClaw จะ inject ตัวทำเครื่องหมาย “missing file” เข้าไปใน
เซสชันและทำงานต่อ ไฟล์ bootstrap ขนาดใหญ่จะถูกตัดทอนเมื่อถูก inject;
ปรับข้อจำกัดได้ด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และ
`agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000)
`openclaw setup` สามารถสร้างค่าเริ่มต้นที่หายไปใหม่ได้โดยไม่เขียนทับ
ไฟล์ที่มีอยู่

## สิ่งที่ไม่ได้อยู่ในเวิร์กสเปซ

สิ่งเหล่านี้อยู่ภายใต้ `~/.openclaw/` และไม่ควร commit เข้า repo ของเวิร์กสเปซ:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (โปรไฟล์ auth ของโมเดล: OAuth + API keys)
- `~/.openclaw/credentials/` (state ของช่องทาง/ผู้ให้บริการ รวมถึงข้อมูลนำเข้า OAuth แบบเดิม)
- `~/.openclaw/agents/<agentId>/sessions/` (transcript ของเซสชัน + เมทาดาทา)
- `~/.openclaw/skills/` (managed skills)

หากคุณต้องย้ายเซสชันหรือ config ให้คัดลอกแยกต่างหาก และเก็บ
ออกจาก version control

## การสำรองข้อมูลด้วย Git (แนะนำ, แบบส่วนตัว)

ให้ปฏิบัติต่อเวิร์กสเปซเหมือนความทรงจำส่วนตัว นำมันใส่ไว้ใน repo git แบบ **private** เพื่อให้
สำรองข้อมูลและกู้คืนได้

ให้รันขั้นตอนเหล่านี้บนเครื่องที่ Gateway ทำงานอยู่ (นั่นคือที่ที่
เวิร์กสเปซอยู่)

### 1) เริ่มต้น repo

หากติดตั้ง git อยู่ เวิร์กสเปซใหม่เอี่ยมจะถูกเริ่มต้นอัตโนมัติ หาก
เวิร์กสเปซนี้ยังไม่เป็น repo ให้รัน:

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
4. เพิ่ม remote แล้ว push:

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
4. เพิ่ม remote แล้ว push:

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

แม้จะอยู่ใน repo แบบ private ก็หลีกเลี่ยงการเก็บความลับในเวิร์กสเปซ:

- API keys, OAuth tokens, รหัสผ่าน หรือข้อมูลรับรองส่วนตัว
- ทุกอย่างภายใต้ `~/.openclaw/`
- ดัมป์แชตดิบหรือไฟล์แนบที่ละเอียดอ่อน

หากจำเป็นต้องเก็บข้อมูลอ้างอิงที่ละเอียดอ่อน ให้ใช้ placeholder และเก็บ
secret จริงไว้ที่อื่น (ตัวจัดการรหัสผ่าน ตัวแปร environment หรือ `~/.openclaw/`)

ตัวอย่างเริ่มต้นของ `.gitignore` ที่แนะนำ:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## การย้ายเวิร์กสเปซไปยังเครื่องใหม่

1. clone repo ไปยังพาธที่ต้องการ (ค่าเริ่มต้น `~/.openclaw/workspace`)
2. ตั้งค่า `agents.defaults.workspace` ให้เป็นพาธนั้นใน `~/.openclaw/openclaw.json`
3. รัน `openclaw setup --workspace <path>` เพื่อใส่ไฟล์ที่ขาดหายไป
4. หากคุณต้องการเซสชัน ให้คัดลอก `~/.openclaw/agents/<agentId>/sessions/` จาก
   เครื่องเก่าแยกต่างหาก

## หมายเหตุขั้นสูง

- การกำหนดเส้นทางหลายเอเจนต์สามารถใช้เวิร์กสเปซต่างกันต่อเอเจนต์ได้ ดู
  [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) สำหรับการกำหนดค่าการกำหนดเส้นทาง
- หากเปิดใช้ `agents.defaults.sandbox` เซสชันที่ไม่ใช่เซสชันหลักสามารถใช้ sandbox
  workspace ต่อเซสชันใต้ `agents.defaults.sandbox.workspaceRoot`

## ที่เกี่ยวข้อง

- [Standing Orders](/th/automation/standing-orders) — คำสั่งถาวรในไฟล์เวิร์กสเปซ
- [Heartbeat](/th/gateway/heartbeat) — ไฟล์เวิร์กสเปซ HEARTBEAT.md
- [Session](/th/concepts/session) — พาธการจัดเก็บเซสชัน
- [Sandboxing](/th/gateway/sandboxing) — การเข้าถึงเวิร์กสเปซในสภาพแวดล้อมแบบ sandboxed
