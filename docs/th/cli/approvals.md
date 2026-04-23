---
read_when:
    - คุณต้องการแก้ไขการอนุมัติ exec จาก CLI
    - คุณต้องจัดการ allowlists บนโฮสต์ Gateway หรือ Node
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw approvals` และ `openclaw exec-policy`
title: การอนุมัติ
x-i18n:
    generated_at: "2026-04-23T06:17:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

จัดการการอนุมัติ exec สำหรับ **โฮสต์ local**, **โฮสต์ Gateway** หรือ **โฮสต์ Node**
โดยค่าเริ่มต้น คำสั่งจะกำหนดเป้าหมายไปที่ไฟล์การอนุมัติ local บนดิสก์ ใช้ `--gateway` เพื่อกำหนดเป้าหมายไปที่ gateway หรือใช้ `--node` เพื่อกำหนดเป้าหมายไปที่ node ที่ระบุ

ชื่อเรียกแทน: `openclaw exec-approvals`

ที่เกี่ยวข้อง:

- การอนุมัติ exec: [การอนุมัติ exec](/th/tools/exec-approvals)
- Nodes: [Nodes](/th/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` คือคำสั่งอำนวยความสะดวกแบบ local สำหรับทำให้การตั้งค่า `tools.exec.*` ที่ร้องขอและไฟล์การอนุมัติของโฮสต์ local สอดคล้องกันในขั้นตอนเดียว

ใช้คำสั่งนี้เมื่อคุณต้องการ:

- ตรวจสอบนโยบาย local ที่ร้องขอ ไฟล์การอนุมัติของโฮสต์ และผลลัพธ์ที่มีผลจริงหลังการรวม
- ใช้ preset แบบ local เช่น YOLO หรือ deny-all
- ซิงโครไนซ์ `tools.exec.*` แบบ local และ `~/.openclaw/exec-approvals.json` แบบ local

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

- `exec-policy` เป็น **local-only**
- คำสั่งนี้อัปเดตไฟล์ config local และไฟล์การอนุมัติ local พร้อมกัน
- คำสั่งนี้จะ **ไม่** push นโยบายไปยังโฮสต์ Gateway หรือโฮสต์ Node
- `--host node` จะถูกปฏิเสธในคำสั่งนี้ เพราะการอนุมัติ exec ของ node จะถูกดึงจาก node ระหว่างรันไทม์ และต้องจัดการผ่านคำสั่ง approvals ที่กำหนดเป้าหมายไปยัง node แทน
- `openclaw exec-policy show` จะทำเครื่องหมายขอบเขต `host=node` ว่าถูกจัดการโดย node ระหว่างรันไทม์ แทนการอนุมานนโยบายที่มีผลจริงจากไฟล์การอนุมัติ local

หากคุณต้องการแก้ไขการอนุมัติของโฮสต์ระยะไกลโดยตรง ให้ใช้ `openclaw approvals set --gateway`
หรือ `openclaw approvals set --node <id|name|ip>` ต่อไป

## คำสั่งทั่วไป

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

ขณะนี้ `openclaw approvals get` จะแสดงนโยบาย exec ที่มีผลจริงสำหรับเป้าหมาย local, gateway และ node:

- นโยบาย `tools.exec` ที่ร้องขอ
- นโยบายจากไฟล์การอนุมัติของโฮสต์
- ผลลัพธ์ที่มีผลจริงหลังใช้กฎลำดับความสำคัญ

ลำดับความสำคัญนี้ตั้งใจออกแบบไว้เช่นนั้น:

- ไฟล์การอนุมัติของโฮสต์คือแหล่งข้อมูลจริงที่ใช้บังคับ
- นโยบาย `tools.exec` ที่ร้องขอสามารถทำให้เจตนาแคบลงหรือกว้างขึ้นได้ แต่ผลลัพธ์ที่มีผลจริงยังคงได้มาจากกฎของโฮสต์
- `--node` จะรวมไฟล์การอนุมัติของโฮสต์ node เข้ากับนโยบาย `tools.exec` ของ gateway เพราะทั้งสองอย่างยังคงมีผลในระหว่างรันไทม์
- หาก config ของ gateway ไม่พร้อมใช้งาน CLI จะย้อนกลับไปใช้ snapshot การอนุมัติของ node และระบุว่าไม่สามารถคำนวณนโยบายสุดท้ายระหว่างรันไทม์ได้

## แทนที่การอนุมัติจากไฟล์

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` รองรับ JSON5 ไม่ใช่เฉพาะ JSON แบบ strict เท่านั้น ใช้ `--file` หรือ `--stdin` อย่างใดอย่างหนึ่ง ห้ามใช้ทั้งสองพร้อมกัน

## ตัวอย่าง "Never prompt" / YOLO

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

ตัวแปรสำหรับ node:

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

การดำเนินการนี้จะเปลี่ยนเฉพาะ **ไฟล์การอนุมัติของโฮสต์** เท่านั้น เพื่อให้สอดคล้องกับนโยบาย OpenClaw ที่ร้องขอ ให้ตั้งค่าดังนี้ด้วย:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

เหตุผลที่ใช้ `tools.exec.host=gateway` ในตัวอย่างนี้:

- `host=auto` ยังคงหมายถึง "ใช้ sandbox หากมี มิฉะนั้นใช้ gateway"
- YOLO เกี่ยวข้องกับการอนุมัติ ไม่ใช่การกำหนดเส้นทาง
- หากคุณต้องการให้ใช้ host exec แม้มีการตั้งค่า sandbox ไว้ ให้ระบุการเลือกโฮสต์อย่างชัดเจนด้วย `gateway` หรือ `/exec host=gateway`

สิ่งนี้สอดคล้องกับพฤติกรรม YOLO แบบค่าเริ่มต้นของโฮสต์ในปัจจุบัน หากคุณต้องการให้เข้มงวดขึ้น ให้ปรับการอนุมัติให้รัดกุมขึ้น

ทางลัดแบบ local:

```bash
openclaw exec-policy preset yolo
```

ทางลัดแบบ local นี้จะอัปเดตทั้ง config `tools.exec.*` local ที่ร้องขอและ
defaults ของการอนุมัติ local พร้อมกัน โดยมีเจตนาเทียบเท่ากับการตั้งค่าด้วยตนเองสองขั้นตอนข้างต้น แต่ใช้ได้เฉพาะกับเครื่อง local เท่านั้น

## ตัวช่วย allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## ตัวเลือกทั่วไป

`get`, `set` และ `allowlist add|remove` ทั้งหมดรองรับ:

- `--node <id|name|ip>`
- `--gateway`
- ตัวเลือก node RPC ที่ใช้ร่วมกัน: `--url`, `--token`, `--timeout`, `--json`

หมายเหตุเกี่ยวกับการกำหนดเป้าหมาย:

- หากไม่มี target flags จะหมายถึงไฟล์การอนุมัติ local บนดิสก์
- `--gateway` กำหนดเป้าหมายไปที่ไฟล์การอนุมัติของโฮสต์ Gateway
- `--node` กำหนดเป้าหมายไปที่โฮสต์ node หนึ่งตัว หลังจาก resolve id, name, IP หรือคำนำหน้า id แล้ว

`allowlist add|remove` ยังรองรับ:

- `--agent <id>` (ค่าเริ่มต้นคือ `*`)

## หมายเหตุ

- `--node` ใช้ตัว resolve เดียวกับ `openclaw nodes` (id, name, ip หรือคำนำหน้า id)
- `--agent` มีค่าเริ่มต้นเป็น `"*"` ซึ่งใช้กับ agents ทั้งหมด
- โฮสต์ node ต้องประกาศรองรับ `system.execApprovals.get/set` (แอป macOS หรือโฮสต์ node แบบ headless)
- ไฟล์การอนุมัติจะถูกจัดเก็บแยกตามโฮสต์ที่ `~/.openclaw/exec-approvals.json`
