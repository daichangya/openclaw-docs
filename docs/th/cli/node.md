---
read_when:
    - การรันโฮสต์ Node แบบไม่มีส่วนติดต่อ
    - การจับคู่ Node ที่ไม่ใช่ macOS สำหรับ `system.run`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw node` (โฮสต์ Node แบบไม่มีส่วนติดต่อ)
title: Node
x-i18n:
    generated_at: "2026-04-23T06:18:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

รัน **โฮสต์ Node แบบไม่มีส่วนติดต่อ** ที่เชื่อมต่อกับ Gateway WebSocket และเปิดให้ใช้
`system.run` / `system.which` บนเครื่องนี้

## ทำไมต้องใช้โฮสต์ node?

ใช้โฮสต์ node เมื่อต้องการให้เอเจนต์ **รันคำสั่งบนเครื่องอื่น** ในเครือข่ายของคุณ
โดยไม่ต้องติดตั้งแอปคู่หู macOS แบบเต็มบนเครื่องนั้น

กรณีใช้งานทั่วไป:

- รันคำสั่งบนเครื่อง Linux/Windows ระยะไกล (เซิร์ฟเวอร์บิลด์ เครื่องในแล็บ NAS)
- คงการทำงานของ exec ให้ **sandboxed** บน gateway แต่ส่งต่องานที่อนุมัติแล้วไปยังโฮสต์อื่น
- จัดเตรียมเป้าหมายการรันแบบเบาและไม่มีส่วนติดต่อสำหรับงานอัตโนมัติหรือ Node ของ CI

การรันยังคงถูกควบคุมด้วย **การอนุมัติ exec** และ allowlists รายเอเจนต์บน
โฮสต์ node ดังนั้นคุณจึงสามารถจำกัดขอบเขตการเข้าถึงคำสั่งให้ชัดเจนได้

## Browser proxy (ไม่ต้องตั้งค่า)

โฮสต์ node จะประกาศ browser proxy โดยอัตโนมัติหาก `browser.enabled` ไม่ได้
ถูกปิดใช้งานบน node ซึ่งช่วยให้เอเจนต์ใช้ browser automation บน node นั้นได้
โดยไม่ต้องกำหนดค่าเพิ่มเติม

โดยค่าเริ่มต้น proxy จะเปิดให้ใช้พื้นผิวโปรไฟล์เบราว์เซอร์ปกติของ node หากคุณ
ตั้งค่า `nodeHost.browserProxy.allowProfiles` proxy จะกลายเป็นแบบจำกัด:
การระบุโปรไฟล์ที่ไม่อยู่ใน allowlist จะถูกปฏิเสธ และเส้นทางสร้าง/ลบ
persistent profile จะถูกบล็อกผ่าน proxy

ปิดใช้งานบน node ได้หากจำเป็น:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## รัน (เบื้องหน้า)

```bash
openclaw node run --host <gateway-host> --port 18789
```

ตัวเลือก:

- `--host <host>`: โฮสต์ Gateway WebSocket (ค่าเริ่มต้น: `127.0.0.1`)
- `--port <port>`: พอร์ต Gateway WebSocket (ค่าเริ่มต้น: `18789`)
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อ gateway
- `--tls-fingerprint <sha256>`: fingerprint ของใบรับรอง TLS ที่คาดหวัง (sha256)
- `--node-id <id>`: แทนที่ node id (ล้าง pairing token)
- `--display-name <name>`: แทนที่ชื่อแสดงผลของ node

## การยืนยันตัวตนกับ Gateway สำหรับโฮสต์ node

`openclaw node run` และ `openclaw node install` จะ resolve การยืนยันตัวตนของ gateway จาก config/env (ไม่มีแฟลก `--token`/`--password` บนคำสั่ง node):

- จะตรวจสอบ `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` ก่อน
- จากนั้นจึง fallback ไปยัง config ภายในเครื่อง: `gateway.auth.token` / `gateway.auth.password`
- ในโหมด local โฮสต์ node จะไม่สืบทอด `gateway.remote.token` / `gateway.remote.password` โดยตั้งใจ
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกตั้งค่าอย่างชัดเจนผ่าน SecretRef และยัง resolve ไม่ได้ การ resolve การยืนยันตัวตนของ node จะล้มเหลวแบบปิดไว้ก่อน (ไม่มี remote fallback มาปิดบัง)
- ใน `gateway.mode=remote` ฟิลด์ของ remote client (`gateway.remote.token` / `gateway.remote.password`) ก็มีสิทธิ์ถูกใช้ตามกฎลำดับความสำคัญของ remote
- การ resolve การยืนยันตัวตนของโฮสต์ node จะใช้เฉพาะตัวแปรแวดล้อม `OPENCLAW_GATEWAY_*` เท่านั้น

## บริการ (เบื้องหลัง)

ติดตั้งโฮสต์ node แบบไม่มีส่วนติดต่อเป็นบริการระดับผู้ใช้

```bash
openclaw node install --host <gateway-host> --port 18789
```

ตัวเลือก:

- `--host <host>`: โฮสต์ Gateway WebSocket (ค่าเริ่มต้น: `127.0.0.1`)
- `--port <port>`: พอร์ต Gateway WebSocket (ค่าเริ่มต้น: `18789`)
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อ gateway
- `--tls-fingerprint <sha256>`: fingerprint ของใบรับรอง TLS ที่คาดหวัง (sha256)
- `--node-id <id>`: แทนที่ node id (ล้าง pairing token)
- `--display-name <name>`: แทนที่ชื่อแสดงผลของ node
- `--runtime <runtime>`: runtime ของบริการ (`node` หรือ `bun`)
- `--force`: ติดตั้งใหม่/เขียนทับหากติดตั้งไว้แล้ว

จัดการบริการ:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

ใช้ `openclaw node run` สำหรับโฮสต์ node แบบเบื้องหน้า (ไม่มีบริการ)

คำสั่งบริการรองรับ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้

## การจับคู่

การเชื่อมต่อครั้งแรกจะสร้างคำขอจับคู่อุปกรณ์ที่รออนุมัติ (`role: node`) บน Gateway
อนุมัติได้ผ่าน:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หาก node ลองจับคู่อีกครั้งโดยมีรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รออยู่ก่อนหน้าจะถูกแทนที่ และจะมี `requestId` ใหม่ถูกสร้างขึ้น
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

โฮสต์ node จะจัดเก็บ node id, token, display name และข้อมูลการเชื่อมต่อ gateway ไว้ใน
`~/.openclaw/node.json`

## การอนุมัติ exec

`system.run` ถูกควบคุมด้วยการอนุมัติ exec ภายในเครื่อง:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/th/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (แก้ไขจาก Gateway)

สำหรับ async node exec ที่ได้รับอนุมัติ OpenClaw จะเตรียม `systemRunPlan`
แบบ canonical ก่อนแสดงพร้อมท์ การส่งต่อ `system.run` ที่ได้รับอนุมัติในภายหลังจะใช้
plan ที่จัดเก็บไว้นั้นซ้ำ ดังนั้นการแก้ไขฟิลด์ command/cwd/session หลังจากสร้าง
คำขออนุมัติแล้วจะถูกปฏิเสธ แทนที่จะเปลี่ยนสิ่งที่ node จะรัน
