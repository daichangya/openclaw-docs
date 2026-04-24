---
read_when:
    - คุณต้องการแก้ไขการอนุมัติ exec จาก CLI
    - คุณต้องจัดการ allowlists บนโฮสต์ gateway หรือ Node
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw approvals` และ `openclaw exec-policy`
title: การอนุมัติ
x-i18n:
    generated_at: "2026-04-24T09:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

จัดการการอนุมัติ exec สำหรับ **โฮสต์โลคัล**, **โฮสต์ gateway** หรือ **โฮสต์ Node**
ตามค่าเริ่มต้น คำสั่งจะกำหนดเป้าหมายไปที่ไฟล์การอนุมัติแบบโลคัลบนดิสก์ ใช้ `--gateway` เพื่อกำหนดเป้าหมายไปที่ gateway หรือใช้ `--node` เพื่อกำหนดเป้าหมายไปที่ Node ที่ระบุ

Alias: `openclaw exec-approvals`

ที่เกี่ยวข้อง:

- การอนุมัติ exec: [การอนุมัติ exec](/th/tools/exec-approvals)
- Nodes: [Nodes](/th/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` คือคำสั่งอำนวยความสะดวกแบบโลคัลสำหรับทำให้ config `tools.exec.*` ที่ร้องขอและไฟล์การอนุมัติของโฮสต์โลคัลสอดคล้องกันในขั้นตอนเดียว

ใช้เมื่อคุณต้องการ:

- ตรวจสอบนโยบาย `tools.exec` แบบโลคัลที่ร้องขอ ไฟล์การอนุมัติของโฮสต์ และผลลัพธ์ที่มีผลจริงหลังการรวม
- ใช้ preset แบบโลคัล เช่น YOLO หรือ deny-all
- ซิงโครไนซ์ `tools.exec.*` แบบโลคัลและ `~/.openclaw/exec-approvals.json` แบบโลคัล

ตัวอย่าง:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

โหมดเอาต์พุต:

- ไม่มี `--json`: พิมพ์มุมมองตารางที่มนุษย์อ่านได้
- `--json`: พิมพ์เอาต์พุตแบบมีโครงสร้างที่เครื่องอ่านได้

ขอบเขตปัจจุบัน:

- `exec-policy` เป็นแบบ **local-only**
- คำสั่งนี้อัปเดตไฟล์ config แบบโลคัลและไฟล์การอนุมัติแบบโลคัลพร้อมกัน
- คำสั่งนี้ **ไม่** push policy ไปยังโฮสต์ gateway หรือโฮสต์ Node
- `--host node` จะถูกปฏิเสธในคำสั่งนี้ เพราะการอนุมัติ exec ของ Node จะถูกดึงจาก Node ระหว่างรันไทม์ และต้องจัดการผ่านคำสั่ง approvals ที่กำหนดเป้าหมายไปยัง Node แทน
- `openclaw exec-policy show` จะทำเครื่องหมายขอบเขต `host=node` ว่าถูกจัดการโดย Node ในรันไทม์ แทนการอนุมานนโยบายที่มีผลจริงจากไฟล์การอนุมัติแบบโลคัล

หากคุณต้องการแก้ไขการอนุมัติของโฮสต์ระยะไกลโดยตรง ให้ใช้ `openclaw approvals set --gateway`
หรือ `openclaw approvals set --node <id|name|ip>` ต่อไป

## คำสั่งที่ใช้บ่อย

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

ขณะนี้ `openclaw approvals get` จะแสดงนโยบาย exec ที่มีผลจริงสำหรับเป้าหมายแบบโลคัล, gateway และ Node:

- policy `tools.exec` ที่ร้องขอ
- policy ของไฟล์การอนุมัติของโฮสต์
- ผลลัพธ์ที่มีผลจริงหลังใช้กฎลำดับความสำคัญ

ลำดับความสำคัญนี้เป็นไปโดยตั้งใจ:

- ไฟล์การอนุมัติของโฮสต์คือแหล่งความจริงที่บังคับใช้ได้จริง
- policy `tools.exec` ที่ร้องขออาจทำให้เจตนาแคบลงหรือกว้างขึ้น แต่ผลลัพธ์ที่มีผลจริงยังคงได้มาจากกฎของโฮสต์
- `--node` จะรวมไฟล์การอนุมัติของโฮสต์ Node เข้ากับ policy `tools.exec` ของ gateway เพราะทั้งสองส่วนยังคงมีผลระหว่างรันไทม์
- หาก config ของ gateway ไม่พร้อมใช้งาน CLI จะย้อนกลับไปใช้ snapshot การอนุมัติของ Node และระบุว่าไม่สามารถคำนวณ policy สุดท้ายระหว่างรันไทม์ได้

## แทนที่การอนุมัติจากไฟล์

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` รองรับ JSON5 ไม่ใช่แค่ JSON แบบเข้มงวดเท่านั้น ใช้ `--file` หรือ `--stdin` อย่างใดอย่างหนึ่ง ไม่ใช่ทั้งสองอย่าง

## ตัวอย่าง "never prompt" / YOLO

สำหรับโฮสต์ที่ไม่ควรหยุดเพื่อขอการอนุมัติ exec เลย ให้ตั้งค่า defaults ของการอนุมัติของโฮสต์เป็น `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

ตัวแปรสำหรับ Node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

การทำเช่นนี้จะเปลี่ยนเฉพาะ **ไฟล์การอนุมัติของโฮสต์** เท่านั้น เพื่อให้ policy ของ OpenClaw ที่ร้องขอสอดคล้องกันด้วย ให้ตั้งค่า:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

เหตุผลที่ใช้ `tools.exec.host=gateway` ในตัวอย่างนี้:

- `host=auto` ยังคงหมายถึง "ใช้ sandbox เมื่อพร้อมใช้งาน มิฉะนั้นใช้ gateway"
- YOLO เป็นเรื่องของการอนุมัติ ไม่ใช่การกำหนดเส้นทาง
- หากคุณต้องการใช้ host exec แม้จะมีการกำหนดค่า sandbox ไว้ ให้ระบุตัวเลือกโฮสต์อย่างชัดเจนด้วย `gateway` หรือ `/exec host=gateway`

ซึ่งสอดคล้องกับลักษณะการทำงาน YOLO แบบค่าเริ่มต้นของโฮสต์ในปัจจุบัน หากต้องการการอนุมัติ ให้ทำให้เข้มงวดขึ้น

ทางลัดแบบโลคัล:

```bash
openclaw exec-policy preset yolo
```

ทางลัดแบบโลคัลนี้จะอัปเดตทั้ง config `tools.exec.*` แบบโลคัลที่ร้องขอและค่าเริ่มต้นของการอนุมัติแบบโลคัลพร้อมกัน
โดยมีเจตนาเทียบเท่ากับการตั้งค่าแบบสองขั้นตอนด้วยตนเองด้านบน แต่ใช้ได้เฉพาะกับเครื่องโลคัลเท่านั้น

## ตัวช่วย allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## ตัวเลือกที่ใช้บ่อย

`get`, `set` และ `allowlist add|remove` ต่างก็รองรับ:

- `--node <id|name|ip>`
- `--gateway`
- ตัวเลือก Node RPC ที่ใช้ร่วมกัน: `--url`, `--token`, `--timeout`, `--json`

หมายเหตุเกี่ยวกับการกำหนดเป้าหมาย:

- หากไม่มีแฟลกกำหนดเป้าหมาย หมายถึงไฟล์การอนุมัติแบบโลคัลบนดิสก์
- `--gateway` กำหนดเป้าหมายไปที่ไฟล์การอนุมัติของโฮสต์ gateway
- `--node` กำหนดเป้าหมายไปที่โฮสต์ Node หนึ่งตัวหลังจาก resolve id, name, IP หรือคำนำหน้า id

`allowlist add|remove` ยังรองรับ:

- `--agent <id>` (ค่าเริ่มต้นคือ `*`)

## หมายเหตุ

- `--node` ใช้ตัว resolve เดียวกับ `openclaw nodes` (id, name, ip หรือคำนำหน้า id)
- `--agent` มีค่าเริ่มต้นเป็น `"*"` ซึ่งใช้กับเอเจนต์ทั้งหมด
- โฮสต์ Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือโฮสต์ Node แบบ headless)
- ไฟล์การอนุมัติจะถูกเก็บแยกตามโฮสต์ที่ `~/.openclaw/exec-approvals.json`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การอนุมัติ exec](/th/tools/exec-approvals)
