---
read_when:
    - การรันโฮสต์ Node แบบไร้ส่วนติดต่อ
    - การจับคู่ Node ที่ไม่ใช่ macOS สำหรับ `system.run`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw node` (โฮสต์ Node แบบไร้ส่วนติดต่อ)
title: Node
x-i18n:
    generated_at: "2026-04-24T09:03:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

รัน **โฮสต์ Node แบบไร้ส่วนติดต่อ** ที่เชื่อมต่อกับ Gateway WebSocket และเปิดให้ใช้
`system.run` / `system.which` บนเครื่องนี้

## เหตุใดจึงควรใช้โฮสต์ Node?

ใช้โฮสต์ Node เมื่อคุณต้องการให้เอเจนต์ **รันคำสั่งบนเครื่องอื่น** ในเครือข่ายของคุณ
โดยไม่ต้องติดตั้งแอปคู่หู macOS แบบเต็มบนเครื่องนั้น

กรณีใช้งานทั่วไป:

- รันคำสั่งบนเครื่อง Linux/Windows ระยะไกล (เซิร์ฟเวอร์บิลด์, เครื่องในแล็บ, NAS)
- คงให้ exec **อยู่ใน sandbox** บน gateway แต่ส่งต่อการรันที่ได้รับอนุมัติไปยังโฮสต์อื่น
- จัดเตรียมเป้าหมายการรันแบบเบาและไร้ส่วนติดต่อสำหรับโหนด automation หรือ CI

การรันยังคงถูกควบคุมด้วย **การอนุมัติ exec** และ allowlists รายเอเจนต์บน
โฮสต์ Node ดังนั้นคุณจึงสามารถจำกัดขอบเขตการเข้าถึงคำสั่งได้อย่างชัดเจน

## พร็อกซีเบราว์เซอร์ (zero-config)

โฮสต์ Node จะประกาศ browser proxy โดยอัตโนมัติหาก `browser.enabled` ไม่ได้
ถูกปิดใช้งานบนโหนด วิธีนี้ทำให้เอเจนต์สามารถใช้ automation ของเบราว์เซอร์บนโหนดนั้นได้
โดยไม่ต้องตั้งค่าเพิ่มเติม

ตามค่าเริ่มต้น พร็อกซีจะเปิดเผยพื้นผิวโปรไฟล์เบราว์เซอร์ตามปกติของโหนด หากคุณ
ตั้งค่า `nodeHost.browserProxy.allowProfiles` พร็อกซีจะกลายเป็นแบบจำกัด:
การกำหนดเป้าหมายโปรไฟล์ที่ไม่อยู่ใน allowlist จะถูกปฏิเสธ และเส้นทาง
create/delete ของโปรไฟล์ถาวรจะถูกบล็อกผ่านพร็อกซี

หากจำเป็น ให้ปิดบนโหนดดังนี้:

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
- `--node-id <id>`: กำหนด node id เอง (ล้าง pairing token)
- `--display-name <name>`: กำหนดชื่อแสดงของโหนดเอง

## การยืนยันตัวตน Gateway สำหรับโฮสต์ Node

`openclaw node run` และ `openclaw node install` จะ resolve การยืนยันตัวตนของ gateway จาก config/env (ไม่มีแฟล็ก `--token`/`--password` บนคำสั่ง node):

- จะตรวจสอบ `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` ก่อน
- จากนั้นจึงย้อนกลับไปใช้ config ในเครื่อง: `gateway.auth.token` / `gateway.auth.password`
- ในโหมด local โฮสต์ Node จะไม่สืบทอด `gateway.remote.token` / `gateway.remote.password` โดยตั้งใจ
- หากมีการกำหนด `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef แต่ resolve ไม่ได้ การ resolve การยืนยันตัวตนของ node จะล้มเหลวแบบ fail closed (ไม่มีการย้อนกลับไปใช้ remote ที่ปกปิดปัญหา)
- ใน `gateway.mode=remote`, ฟิลด์ของ remote client (`gateway.remote.token` / `gateway.remote.password`) ก็สามารถถูกใช้ได้ตามกฎลำดับความสำคัญของ remote
- การ resolve การยืนยันตัวตนของโฮสต์ Node จะใช้เฉพาะตัวแปรสภาพแวดล้อม `OPENCLAW_GATEWAY_*`

สำหรับโหนดที่เชื่อมต่อกับ Gateway แบบ `ws://` ที่ไม่ใช่ loopback บนเครือข่ายส่วนตัว
ที่เชื่อถือได้ ให้ตั้งค่า `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` หากไม่ตั้งค่า โหนดจะเริ่มต้นไม่สำเร็จแบบ fail closed และจะแนะนำให้คุณใช้ `wss://`, SSH tunnel หรือ Tailscale
นี่เป็นการเลือกเปิดผ่าน process environment ไม่ใช่ config key ใน `openclaw.json`
`openclaw node install` จะคงค่านี้ไว้ในบริการ node แบบ supervised เมื่อมีตัวแปรนี้
อยู่ใน environment ของคำสั่งติดตั้ง

## บริการ (เบื้องหลัง)

ติดตั้งโฮสต์ Node แบบไร้ส่วนติดต่อเป็นบริการผู้ใช้

```bash
openclaw node install --host <gateway-host> --port 18789
```

ตัวเลือก:

- `--host <host>`: โฮสต์ Gateway WebSocket (ค่าเริ่มต้น: `127.0.0.1`)
- `--port <port>`: พอร์ต Gateway WebSocket (ค่าเริ่มต้น: `18789`)
- `--tls`: ใช้ TLS สำหรับการเชื่อมต่อ gateway
- `--tls-fingerprint <sha256>`: fingerprint ของใบรับรอง TLS ที่คาดหวัง (sha256)
- `--node-id <id>`: กำหนด node id เอง (ล้าง pairing token)
- `--display-name <name>`: กำหนดชื่อแสดงของโหนดเอง
- `--runtime <runtime>`: runtime ของบริการ (`node` หรือ `bun`)
- `--force`: ติดตั้งใหม่/เขียนทับหากติดตั้งไว้แล้ว

จัดการบริการ:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

ใช้ `openclaw node run` สำหรับโฮสต์ Node แบบเบื้องหน้า (ไม่มีบริการ)

คำสั่งของบริการรองรับ `--json` สำหรับผลลัพธ์ที่เครื่องอ่านได้

## การจับคู่

การเชื่อมต่อครั้งแรกจะสร้างคำขอจับคู่อุปกรณ์ที่รอดำเนินการ (`role: node`) บน Gateway
อนุมัติได้ผ่าน:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

หากโหนดลองจับคู่อีกครั้งด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key)
คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมี `requestId` ใหม่ถูกสร้างขึ้น
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

โฮสต์ Node จะเก็บ node id, token, ชื่อแสดง และข้อมูลการเชื่อมต่อ gateway ไว้ใน
`~/.openclaw/node.json`

## การอนุมัติ exec

`system.run` ถูกควบคุมโดยการอนุมัติ exec ในเครื่อง:

- `~/.openclaw/exec-approvals.json`
- [การอนุมัติ exec](/th/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (แก้ไขจาก Gateway)

สำหรับการรัน exec แบบ async บนโหนดที่ได้รับอนุมัติ OpenClaw จะเตรียม `systemRunPlan`
แบบ canonical ก่อนแสดงคำขออนุมัติ การส่งต่อ `system.run` ที่ได้รับอนุมัติภายหลังจะใช้ plan
ที่จัดเก็บไว้นั้นซ้ำ ดังนั้นการแก้ไขฟิลด์ command/cwd/session หลังจากสร้างคำขออนุมัติแล้ว
จะถูกปฏิเสธ แทนที่จะเปลี่ยนสิ่งที่โหนดจะรันจริง

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Nodes](/th/nodes)
