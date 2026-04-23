---
read_when:
    - การรันหรือแก้ไขปัญหาการตั้งค่า Gateway ระยะไกล
summary: การเข้าถึงระยะไกลโดยใช้ SSH tunnel (Gateway WS) และ tailnet
title: การเข้าถึงระยะไกล
x-i18n:
    generated_at: "2026-04-23T05:35:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# การเข้าถึงระยะไกล (SSH, tunnel และ tailnet)

repo นี้รองรับ “remote over SSH” โดยให้มี Gateway ตัวเดียว (ตัวหลัก) รันอยู่บนโฮสต์เฉพาะ (เดสก์ท็อป/เซิร์ฟเวอร์) และให้ไคลเอนต์เชื่อมต่อเข้าหามัน

- สำหรับ **ผู้ปฏิบัติการ (คุณ / แอป macOS)**: การทำ SSH tunnel คือทาง fallback ที่ใช้ได้ทั่วไป
- สำหรับ **Node (iOS/Android และอุปกรณ์ในอนาคต)**: ให้เชื่อมต่อกับ **WebSocket** ของ Gateway (ผ่าน LAN/tailnet หรือ SSH tunnel ตามความจำเป็น)

## แนวคิดหลัก

- Gateway WebSocket จะ bind กับ **loopback** บนพอร์ตที่กำหนดค่าไว้ (ค่าเริ่มต้นคือ 18789)
- สำหรับการใช้งานระยะไกล คุณจะ forward พอร์ต loopback นั้นผ่าน SSH (หรือใช้ tailnet/VPN แล้วใช้ tunnel น้อยลง)

## การตั้งค่า VPN/tailnet ที่พบบ่อย (ตำแหน่งที่เอเจนต์อยู่)

ให้นึกถึง **โฮสต์ของ Gateway** ว่าเป็น “ที่ที่เอเจนต์อาศัยอยู่” มันเป็นเจ้าของเซสชัน, auth profile, แชนเนล และ state
แล็ปท็อป/เดสก์ท็อปของคุณ (รวมถึง Node) จะเชื่อมต่อเข้าหาโฮสต์นั้น

### 1) Gateway ที่เปิดตลอดเวลาอยู่ใน tailnet ของคุณ (VPS หรือโฮมเซิร์ฟเวอร์)

รัน Gateway บนโฮสต์ที่คงอยู่ตลอดและเข้าถึงมันผ่าน **Tailscale** หรือ SSH

- **ประสบการณ์ใช้งานที่ดีที่สุด:** คง `gateway.bind: "loopback"` ไว้ และใช้ **Tailscale Serve** สำหรับ Control UI
- **fallback:** คง loopback + SSH tunnel จากทุกเครื่องที่ต้องการเข้าถึง
- **ตัวอย่าง:** [exe.dev](/th/install/exe-dev) (VM แบบง่าย) หรือ [Hetzner](/th/install/hetzner) (production VPS)

เหมาะอย่างยิ่งเมื่อแล็ปท็อปของคุณหลับบ่อย แต่คุณต้องการให้เอเจนต์เปิดตลอดเวลา

### 2) เดสก์ท็อปที่บ้านรัน Gateway, แล็ปท็อปเป็นตัวควบคุมระยะไกล

แล็ปท็อป **ไม่ได้** รันเอเจนต์ มันเชื่อมต่อจากระยะไกล:

- ใช้โหมด **Remote over SSH** ของแอป macOS (Settings → General → “OpenClaw runs”)
- แอปจะเปิดและจัดการ tunnel ให้ ดังนั้น WebChat + health check จะ “ใช้งานได้ทันที”

คู่มือปฏิบัติการ: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

### 3) แล็ปท็อปรัน Gateway, เข้าถึงจากเครื่องอื่นจากระยะไกล

คง Gateway ไว้ในเครื่อง แต่เปิดให้เข้าถึงอย่างปลอดภัย:

- ทำ SSH tunnel เข้าหาแล็ปท็อปจากเครื่องอื่น หรือ
- ใช้ Tailscale Serve กับ Control UI และคง Gateway ให้เป็น loopback-only

คู่มือ: [Tailscale](/th/gateway/tailscale) และ [ภาพรวมเว็บ](/web)

## ลำดับคำสั่ง (อะไรทำงานที่ไหน)

บริการ gateway ตัวเดียวเป็นเจ้าของ state + แชนเนล ส่วน Node เป็นอุปกรณ์รอบข้าง

ตัวอย่างโฟลว์ (Telegram → node):

- ข้อความ Telegram มาถึงที่ **Gateway**
- Gateway รัน **เอเจนต์** และตัดสินใจว่าจะเรียก tool ของ node หรือไม่
- Gateway เรียก **node** ผ่าน Gateway WebSocket (`node.*` RPC)
- Node ส่งผลลัพธ์กลับมา; Gateway ตอบกลับออกไปยัง Telegram

หมายเหตุ:

- **Node ไม่ได้รันบริการ gateway** ควรมี gateway เพียงตัวเดียวต่อโฮสต์ เว้นแต่คุณตั้งใจจะรันโปรไฟล์แบบแยกกัน (ดู [Multiple gateways](/th/gateway/multiple-gateways))
- “node mode” ของแอป macOS เป็นเพียงไคลเอนต์ node ผ่าน Gateway WebSocket

## SSH tunnel (CLI + tools)

สร้าง tunnel ในเครื่องไปยัง Gateway WS ระยะไกล:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

เมื่อ tunnel เปิดอยู่:

- `openclaw health` และ `openclaw status --deep` จะเข้าถึง gateway ระยะไกลผ่าน `ws://127.0.0.1:18789`
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` และ `openclaw gateway call` ก็สามารถชี้ไปยัง URL ที่ถูก forward ผ่าน `--url` ได้เมื่อจำเป็น

หมายเหตุ: แทนที่ `18789` ด้วย `gateway.port` ที่คุณตั้งค่าไว้ (หรือ `--port`/`OPENCLAW_GATEWAY_PORT`)
หมายเหตุ: เมื่อคุณส่ง `--url` CLI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment
ให้ระบุ `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองอย่างชัดเจนถือเป็นข้อผิดพลาด

## ค่าเริ่มต้นระยะไกลของ CLI

คุณสามารถคงค่าเป้าหมายระยะไกลไว้เพื่อให้คำสั่ง CLI ใช้มันเป็นค่าเริ่มต้น:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

เมื่อ gateway เป็น loopback-only ให้คง URL เป็น `ws://127.0.0.1:18789` แล้วเปิด SSH tunnel ก่อน

## ลำดับความสำคัญของข้อมูลรับรอง

การ resolve ข้อมูลรับรองของ Gateway ใช้สัญญาร่วมชุดเดียวกันในเส้นทาง call/probe/status และการตรวจสอบ exec-approval ของ Discord ส่วน node-host ใช้สัญญาพื้นฐานเดียวกันโดยมีข้อยกเว้นหนึ่งข้อใน local-mode (มันตั้งใจละเว้น `gateway.remote.*`):

- ข้อมูลรับรองแบบ explicit (`--token`, `--password` หรือ tool `gatewayToken`) มาก่อนเสมอบนเส้นทาง call ที่รับ auth แบบ explicit
- ความปลอดภัยของ URL override:
  - การ override URL ของ CLI (`--url`) จะไม่นำข้อมูลรับรองจาก config/env แบบ implicit มาใช้ซ้ำ
  - การ override URL ผ่าน env (`OPENCLAW_GATEWAY_URL`) อาจใช้ข้อมูลรับรองจาก env เท่านั้น (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)
- ค่าเริ่มต้นของ local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback แบบ remote ใช้ได้เฉพาะเมื่อไม่มีค่า token auth ฝั่ง local)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback แบบ remote ใช้ได้เฉพาะเมื่อไม่มีค่า password auth ฝั่ง local)
- ค่าเริ่มต้นของ remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- ข้อยกเว้น local-mode ของ node-host: `gateway.remote.token` / `gateway.remote.password` จะถูกละเว้น
- การตรวจสอบ token ของ probe/status แบบ remote เข้มงวดโดยค่าเริ่มต้น: จะใช้ `gateway.remote.token` เท่านั้น (ไม่มี fallback ไปใช้ local token) เมื่อกำหนดเป้าหมายเป็น remote mode
- การ override env ของ Gateway ใช้เฉพาะ `OPENCLAW_GATEWAY_*`

## Chat UI ผ่าน SSH

ตอนนี้ WebChat ไม่ได้ใช้พอร์ต HTTP แยกอีกต่อไป SwiftUI chat UI เชื่อมต่อโดยตรงกับ Gateway WebSocket

- forward `18789` ผ่าน SSH (ดูด้านบน) จากนั้นให้ไคลเอนต์เชื่อมต่อกับ `ws://127.0.0.1:18789`
- บน macOS ควรใช้โหมด “Remote over SSH” ของแอป ซึ่งจัดการ tunnel ให้อัตโนมัติ

## “Remote over SSH” ของแอป macOS

แอปแถบเมนู macOS สามารถขับเคลื่อนการตั้งค่าเดียวกันนี้ได้แบบ end-to-end (การตรวจสอบสถานะระยะไกล, WebChat และการ forward Voice Wake)

คู่มือปฏิบัติการ: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

## กฎความปลอดภัย (remote/VPN)

สรุปสั้น ๆ: **คง Gateway ให้เป็น loopback-only** เว้นแต่คุณแน่ใจว่าจำเป็นต้อง bind ออกภายนอก

- **Loopback + SSH/Tailscale Serve** คือค่าเริ่มต้นที่ปลอดภัยที่สุด (ไม่มีการเปิดเผยสู่สาธารณะ)
- `ws://` แบบ plaintext เป็น loopback-only โดยค่าเริ่มต้น สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้
  ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` บนโปรเซสไคลเอนต์เพื่อใช้เป็นทางฉุกเฉิน
- **การ bind แบบไม่ใช่ loopback** (`lan`/`tailnet`/`custom` หรือ `auto` เมื่อ loopback ใช้ไม่ได้) ต้องใช้ Gateway auth: token, password หรือ identity-aware reverse proxy พร้อม `gateway.auth.mode: "trusted-proxy"` ที่กำหนดค่าอย่างถูกต้อง
- `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองฝั่งไคลเอนต์ พวกมัน **ไม่ได้** กำหนดค่า server auth ด้วยตัวเอง
- เส้นทาง call แบบ local สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อ `gateway.auth.*` ไม่ได้ถูกตั้งไว้
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดผ่าน SecretRef อย่างชัดเจนและไม่สามารถ resolve ได้ การ resolve จะล้มเหลวแบบ fail closed (ไม่มี remote fallback มาปิดบัง)
- `gateway.remote.tlsFingerprint` ใช้ pin ใบรับรอง TLS ระยะไกลเมื่อใช้ `wss://`
- **Tailscale Serve** สามารถยืนยันตัวตนทราฟฟิกของ Control UI/WebSocket ผ่าน header ระบุตัวตนได้
  เมื่อ `gateway.auth.allowTailscale: true`; แต่ endpoint HTTP API จะไม่ใช้
  header auth ของ Tailscale นี้ และจะใช้โหมด HTTP auth ปกติของ gateway แทน โฟลว์แบบไม่ใช้ token นี้ตั้งอยู่บนสมมติฐานว่าโฮสต์ของ gateway เชื่อถือได้ ตั้งค่าเป็น
  `false` หากคุณต้องการ shared-secret auth ทุกที่
- auth แบบ **trusted-proxy** มีไว้สำหรับการตั้งค่า identity-aware proxy ที่ไม่ใช่ loopback เท่านั้น
  reverse proxy แบบ loopback บนโฮสต์เดียวกันไม่เข้าเงื่อนไข `gateway.auth.mode: "trusted-proxy"`
- ให้ถือว่าการควบคุมผ่านเบราว์เซอร์มีระดับการเข้าถึงเทียบเท่าผู้ปฏิบัติการ: tailnet-only + การจับคู่ Node แบบตั้งใจ

ดูแบบเจาะลึก: [ความปลอดภัย](/th/gateway/security)

### macOS: SSH tunnel แบบคงอยู่ผ่าน LaunchAgent

สำหรับไคลเอนต์ macOS ที่เชื่อมต่อไปยัง gateway ระยะไกล การตั้งค่าแบบคงอยู่ที่ง่ายที่สุดคือใช้รายการ `LocalForward` ใน config ของ SSH ร่วมกับ LaunchAgent เพื่อให้ tunnel ทำงานต่อเนื่องข้ามการรีบูตและการล่ม

#### ขั้นตอนที่ 1: เพิ่ม SSH config

แก้ไข `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

แทนที่ `<REMOTE_IP>` และ `<REMOTE_USER>` ด้วยค่าของคุณ

#### ขั้นตอนที่ 2: คัดลอก SSH key (ทำครั้งเดียว)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ขั้นตอนที่ 3: กำหนดค่า token ของ gateway

เก็บ token ไว้ใน config เพื่อให้คงอยู่ข้ามการรีสตาร์ต:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ขั้นตอนที่ 4: สร้าง LaunchAgent

บันทึกไฟล์นี้เป็น `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

#### ขั้นตอนที่ 5: โหลด LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

tunnel จะเริ่มอัตโนมัติเมื่อเข้าสู่ระบบ รีสตาร์ตเมื่อเกิดการล่ม และคงพอร์ตที่ forward ไว้ให้พร้อมใช้งาน

หมายเหตุ: หากคุณมี LaunchAgent `com.openclaw.ssh-tunnel` ที่หลงเหลือจากการตั้งค่าเก่า ให้ unload และลบทิ้ง

#### การแก้ไขปัญหา

ตรวจสอบว่า tunnel กำลังทำงานอยู่หรือไม่:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

รีสตาร์ต tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

หยุด tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| รายการ config                        | สิ่งที่ทำ                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | forward พอร์ตในเครื่อง 18789 ไปยังพอร์ตระยะไกล 18789         |
| `ssh -N`                             | SSH โดยไม่รันคำสั่งระยะไกล (ทำเฉพาะ port-forwarding)        |
| `KeepAlive`                          | รีสตาร์ต tunnel อัตโนมัติหากเกิดการล่ม                      |
| `RunAtLoad`                          | เริ่ม tunnel เมื่อ LaunchAgent ถูกโหลดตอนล็อกอิน            |
