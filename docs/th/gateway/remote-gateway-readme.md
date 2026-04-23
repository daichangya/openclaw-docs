---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: การตั้งค่า SSH tunnel สำหรับให้ OpenClaw.app เชื่อมต่อกับ gateway ระยะไกล
title: การตั้งค่า Gateway ระยะไกล
x-i18n:
    generated_at: "2026-04-23T05:35:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55467956a3473fa36709715f017369471428f7566132f7feb47581caa98b4600
    source_path: gateway/remote-gateway-readme.md
    workflow: 15
---

> เนื้อหานี้ถูกรวมไว้ใน [การเข้าถึงระยะไกล](/th/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent) แล้ว ดูหน้านั้นสำหรับคู่มือปัจจุบัน

# การรัน OpenClaw.app กับ Gateway ระยะไกล

OpenClaw.app ใช้ SSH tunneling เพื่อเชื่อมต่อกับ gateway ระยะไกล คู่มือนี้จะแสดงวิธีตั้งค่า

## ภาพรวม

```mermaid
flowchart TB
    subgraph Client["Client Machine"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(local port)"]
        T["SSH Tunnel"]

        A --> B
        B --> T
    end
    subgraph Remote["Remote Machine"]
        direction TB
        C["Gateway WebSocket"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## การตั้งค่าอย่างรวดเร็ว

### ขั้นตอนที่ 1: เพิ่ม SSH Config

แก้ไข `~/.ssh/config` แล้วเพิ่ม:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # เช่น 172.27.187.184
    User <REMOTE_USER>            # เช่น jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

แทนที่ `<REMOTE_IP>` และ `<REMOTE_USER>` ด้วยค่าของคุณ

### ขั้นตอนที่ 2: คัดลอก SSH Key

คัดลอก public key ของคุณไปยังเครื่องระยะไกล (ใส่รหัสผ่านหนึ่งครั้ง):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### ขั้นตอนที่ 3: กำหนดค่า Auth ของ Gateway ระยะไกล

```bash
openclaw config set gateway.remote.token "<your-token>"
```

ใช้ `gateway.remote.password` แทน หาก gateway ระยะไกลของคุณใช้การยืนยันตัวตนแบบรหัสผ่าน
`OPENCLAW_GATEWAY_TOKEN` ยังใช้ได้เป็น shell-level override แต่การตั้งค่าไคลเอนต์ระยะไกลแบบถาวรคือ `gateway.remote.token` / `gateway.remote.password`

### ขั้นตอนที่ 4: เริ่ม SSH Tunnel

```bash
ssh -N remote-gateway &
```

### ขั้นตอนที่ 5: รีสตาร์ต OpenClaw.app

```bash
# ปิด OpenClaw.app (⌘Q) แล้วเปิดใหม่:
open /path/to/OpenClaw.app
```

ตอนนี้แอปจะเชื่อมต่อกับ gateway ระยะไกลผ่าน SSH tunnel

---

## เริ่ม Tunnel อัตโนมัติเมื่อเข้าสู่ระบบ

หากต้องการให้ SSH tunnel เริ่มอัตโนมัติเมื่อคุณเข้าสู่ระบบ ให้สร้าง Launch Agent

### สร้างไฟล์ PLIST

บันทึกสิ่งนี้เป็น `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### โหลด Launch Agent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

ตอนนี้ tunnel จะ:

- เริ่มอัตโนมัติเมื่อคุณเข้าสู่ระบบ
- เริ่มใหม่หากเกิด crash
- ทำงานต่อไปในเบื้องหลัง

หมายเหตุเกี่ยวกับระบบ legacy: หากมี LaunchAgent `com.openclaw.ssh-tunnel` เก่าค้างอยู่ ให้ลบออก

---

## การแก้ไขปัญหา

**ตรวจสอบว่า tunnel กำลังทำงานอยู่หรือไม่:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**รีสตาร์ต tunnel:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**หยุด tunnel:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## วิธีการทำงาน

| องค์ประกอบ                           | สิ่งที่ทำ                                                       |
| ------------------------------------ | --------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | ส่งต่อพอร์ตภายในเครื่อง 18789 ไปยังพอร์ตระยะไกล 18789          |
| `ssh -N`                             | SSH โดยไม่รันคำสั่งบนเครื่องระยะไกล (ทำแค่ port forwarding)    |
| `KeepAlive`                          | เริ่ม tunnel ใหม่อัตโนมัติหากเกิด crash                        |
| `RunAtLoad`                          | เริ่ม tunnel เมื่อ agent ถูกโหลด                               |

OpenClaw.app จะเชื่อมต่อกับ `ws://127.0.0.1:18789` บนเครื่องไคลเอนต์ของคุณ SSH tunnel จะส่งต่อการเชื่อมต่อนั้นไปยังพอร์ต 18789 บนเครื่องระยะไกลที่ Gateway กำลังทำงานอยู่
