---
read_when:
    - คุณต้องการโฮสต์ Linux ที่เปิดตลอดเวลาและมีต้นทุนต่ำสำหรับ Gateway
    - คุณต้องการเข้าถึง Control UI จากระยะไกลโดยไม่ต้องรัน VPS ของตัวเอง
summary: รัน OpenClaw Gateway บน exe.dev (VM + HTTPS proxy) สำหรับการเข้าถึงจากระยะไกล
title: exe.dev
x-i18n:
    generated_at: "2026-04-23T05:39:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff95b6f35b95df35c1b0cae3215647eefe88d2b7f19923868385036cc0dbdbf1
    source_path: install/exe-dev.md
    workflow: 15
---

# exe.dev

เป้าหมาย: ให้ OpenClaw Gateway รันอยู่บน VM ของ exe.dev และเข้าถึงได้จากแล็ปท็อปของคุณผ่าน: `https://<vm-name>.exe.xyz`

หน้านี้สมมติว่าคุณใช้ image เริ่มต้น **exeuntu** ของ exe.dev หากคุณเลือก distro อื่น ให้จับคู่แพ็กเกจตามนั้น

## เส้นทางด่วนสำหรับผู้เริ่มต้น

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. กรอก auth key/token ของคุณตามต้องการ
3. คลิก "Agent" ถัดจาก VM ของคุณ แล้วรอให้ Shelley จัดเตรียมระบบเสร็จ
4. เปิด `https://<vm-name>.exe.xyz/` และยืนยันตัวตนด้วย shared secret ที่กำหนดไว้ (คู่มือนี้ใช้ token auth เป็นค่าเริ่มต้น แต่ password auth ก็ใช้ได้เช่นกันหากคุณสลับ `gateway.auth.mode`)
5. อนุมัติคำขอ device pairing ที่ค้างอยู่ด้วย `openclaw devices approve <requestId>`

## สิ่งที่คุณต้องมี

- บัญชี exe.dev
- การเข้าถึง `ssh exe.dev` ไปยัง virtual machines ของ [exe.dev](https://exe.dev) (ไม่บังคับ)

## การติดตั้งอัตโนมัติด้วย Shelley

Shelley ซึ่งเป็นเอเจนต์ของ [exe.dev](https://exe.dev) สามารถติดตั้ง OpenClaw ให้ได้ทันทีด้วย
พรอมป์ต์ของเรา พรอมป์ต์ที่ใช้มีดังนี้:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## การติดตั้งแบบกำหนดเอง

## 1) สร้าง VM

จากอุปกรณ์ของคุณ:

```bash
ssh exe.dev new
```

จากนั้นเชื่อมต่อ:

```bash
ssh <vm-name>.exe.xyz
```

เคล็ดลับ: ควรเก็บ VM นี้ให้เป็นแบบ **stateful** OpenClaw จะเก็บ `openclaw.json`, ไฟล์
`auth-profiles.json` ต่อเอเจนต์, sessions และสถานะของ channel/provider ไว้ภายใต้
`~/.openclaw/` รวมถึง workspace ไว้ใต้ `~/.openclaw/workspace/`

## 2) ติดตั้ง prerequisites (บน VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) ติดตั้ง OpenClaw

รันสคริปต์ติดตั้งของ OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) ตั้งค่า nginx ให้ proxy OpenClaw ไปยังพอร์ต 8000

แก้ไข `/etc/nginx/sites-enabled/default` ด้วย

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # รองรับ WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # การตั้งค่า timeout สำหรับการเชื่อมต่อแบบอายุยาว
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

ให้เขียนทับ forwarding headers แทนการเก็บ chain ที่ไคลเอนต์ส่งมา
OpenClaw จะเชื่อถือข้อมูล IP แบบ forwarded เฉพาะจาก proxy ที่กำหนดไว้อย่างชัดเจนเท่านั้น
และ chain ของ `X-Forwarded-For` แบบ append-style จะถูกมองว่าเป็นความเสี่ยงด้านการเสริมความปลอดภัย

## 5) เข้าถึง OpenClaw และมอบสิทธิ์

เข้าถึง `https://<vm-name>.exe.xyz/` (ดูเอาต์พุต Control UI จาก onboarding) หากระบบถามหา auth ให้ใส่
shared secret ที่กำหนดไว้จาก VM คู่มือนี้ใช้ token auth ดังนั้นให้ดึง `gateway.auth.token`
ด้วย `openclaw config get gateway.auth.token` (หรือสร้างด้วย `openclaw doctor --generate-gateway-token`)
หากคุณเปลี่ยน gateway ไปใช้ password auth ให้ใช้ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` แทน
อนุมัติอุปกรณ์ด้วย `openclaw devices list` และ `openclaw devices approve <requestId>` หากไม่แน่ใจ ให้ใช้ Shelley จากเบราว์เซอร์ของคุณได้เลย!

## การเข้าถึงจากระยะไกล

การเข้าถึงจากระยะไกลถูกจัดการโดยระบบยืนยันตัวตนของ [exe.dev](https://exe.dev)
ตามค่าเริ่มต้น ทราฟฟิก HTTP จากพอร์ต 8000 จะถูกส่งต่อไปยัง `https://<vm-name>.exe.xyz`
พร้อม email auth

## การอัปเดต

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

คู่มือ: [Updating](/th/install/updating)
