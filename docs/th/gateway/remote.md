---
read_when:
    - การรันหรือแก้ไขปัญหาการตั้งค่า gateway ระยะไกล
summary: การเข้าถึงระยะไกลโดยใช้ SSH tunnels (Gateway WS) และ tailnets
title: การเข้าถึงระยะไกล
x-i18n:
    generated_at: "2026-04-24T09:12:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# การเข้าถึงระยะไกล (SSH, tunnels และ tailnets)

repo นี้รองรับการใช้งาน “ระยะไกลผ่าน SSH” โดยให้มี Gateway เพียงตัวเดียว (ตัวหลัก) ทำงานอยู่บนโฮสต์เฉพาะ (เดสก์ท็อป/เซิร์ฟเวอร์) และให้ไคลเอนต์เชื่อมต่อเข้าหามัน

- สำหรับ **ผู้ปฏิบัติงาน (คุณ / แอป macOS)**: SSH tunneling คือทางเลือกสำรองที่ใช้ได้ทั่วไป
- สำหรับ **โหนด (iOS/Android และอุปกรณ์ในอนาคต)**: เชื่อมต่อกับ Gateway **WebSocket** (ผ่าน LAN/tailnet หรือ SSH tunnel ตามความจำเป็น)

## แนวคิดหลัก

- Gateway WebSocket จะ bind กับ **loopback** บนพอร์ตที่คุณกำหนด (ค่าเริ่มต้น 18789)
- สำหรับการใช้งานระยะไกล คุณจะ forward พอร์ต loopback นี้ผ่าน SSH (หรือใช้ tailnet/VPN แล้วใช้ tunnel น้อยลง)

## การตั้งค่า VPN/tailnet ทั่วไป (จุดที่เอเจนต์อยู่)

ให้คิดว่า **โฮสต์ Gateway** คือ “ที่ที่เอเจนต์อยู่” มันเป็นเจ้าของเซสชัน โปรไฟล์การยืนยันตัวตน ช่องทาง และสถานะทั้งหมด
แล็ปท็อป/เดสก์ท็อปของคุณ (รวมถึงโหนดต่าง ๆ) จะเชื่อมต่อเข้าหาโฮสต์นั้น

### 1) Gateway แบบเปิดตลอดใน tailnet ของคุณ (VPS หรือโฮมเซิร์ฟเวอร์)

รัน Gateway บนโฮสต์ถาวร แล้วเข้าถึงผ่าน **Tailscale** หรือ SSH

- **ประสบการณ์ที่ดีที่สุด:** คง `gateway.bind: "loopback"` ไว้ แล้วใช้ **Tailscale Serve** สำหรับ Control UI
- **ทางเลือกสำรอง:** คง loopback + SSH tunnel จากเครื่องใดก็ตามที่ต้องการเข้าถึง
- **ตัวอย่าง:** [exe.dev](/th/install/exe-dev) (VM แบบง่าย) หรือ [Hetzner](/th/install/hetzner) (VPS สำหรับงานจริง)

เหมาะอย่างยิ่งเมื่อแล็ปท็อปของคุณพักเครื่องบ่อย แต่คุณต้องการให้เอเจนต์เปิดอยู่ตลอดเวลา

### 2) เดสก์ท็อปที่บ้านรัน Gateway ส่วนแล็ปท็อปเป็นตัวควบคุมระยะไกล

แล็ปท็อปจะ **ไม่** รันเอเจนต์ แต่จะเชื่อมต่อจากระยะไกล:

- ใช้โหมด **Remote over SSH** ของแอป macOS (Settings → General → “OpenClaw runs”)
- แอปจะเปิดและจัดการ tunnel ให้เอง ดังนั้น WebChat + health checks จะ “ทำงานได้เลย”

คู่มือปฏิบัติ: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

### 3) แล็ปท็อปรัน Gateway แล้วเข้าถึงจากเครื่องอื่นแบบระยะไกล

คง Gateway ไว้ในเครื่อง แต่เปิดให้เข้าถึงอย่างปลอดภัย:

- ทำ SSH tunnel เข้าหาแล็ปท็อปจากเครื่องอื่น หรือ
- ใช้ Tailscale Serve กับ Control UI และคง Gateway ให้เป็น loopback-only

คู่มือ: [Tailscale](/th/gateway/tailscale) และ [ภาพรวม Web](/th/web)

## โฟลว์ของคำสั่ง (สิ่งใดรันที่ไหน)

บริการ gateway หนึ่งตัวเป็นเจ้าของ state + channels ส่วนโหนดเป็นอุปกรณ์ปลายทาง

ตัวอย่างโฟลว์ (Telegram → โหนด):

- ข้อความจาก Telegram มาถึงที่ **Gateway**
- Gateway รัน **เอเจนต์** และตัดสินใจว่าจะเรียก node tool หรือไม่
- Gateway เรียก **โหนด** ผ่าน Gateway WebSocket (`node.*` RPC)
- โหนดส่งผลลัพธ์กลับมา; Gateway ตอบกลับออกไปยัง Telegram

หมายเหตุ:

- **โหนดจะไม่รันบริการ gateway** ควรรัน gateway เพียงหนึ่งตัวต่อหนึ่งโฮสต์ เว้นแต่คุณตั้งใจรัน profiles ที่แยกออกจากกัน (ดู [หลาย gateway](/th/gateway/multiple-gateways))
- “node mode” ของแอป macOS เป็นเพียงไคลเอนต์โหนดผ่าน Gateway WebSocket

## SSH tunnel (CLI + tools)

สร้าง local tunnel ไปยัง Gateway WS ระยะไกล:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

เมื่อ tunnel เปิดอยู่:

- `openclaw health` และ `openclaw status --deep` จะเข้าถึง gateway ระยะไกลผ่าน `ws://127.0.0.1:18789`
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` และ `openclaw gateway call` ก็สามารถชี้ไปยัง URL ที่ forward ไว้ผ่าน `--url` ได้เช่นกันเมื่อจำเป็น

หมายเหตุ: ให้แทน `18789` ด้วย `gateway.port` ที่คุณกำหนด (หรือ `--port`/`OPENCLAW_GATEWAY_PORT`)
หมายเหตุ: เมื่อคุณส่ง `--url`, CLI จะไม่ย้อนกลับไปใช้ข้อมูลรับรองจาก config หรือ environment
ให้ระบุ `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองแบบชัดเจนจะถือเป็นข้อผิดพลาด

## ค่าเริ่มต้นระยะไกลของ CLI

คุณสามารถบันทึกเป้าหมายระยะไกลไว้เพื่อให้คำสั่ง CLI ใช้มันเป็นค่าเริ่มต้น:

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

เมื่อ gateway เป็น loopback-only ให้คง URL ไว้ที่ `ws://127.0.0.1:18789` และเปิด SSH tunnel ก่อน

## ลำดับความสำคัญของข้อมูลรับรอง

การ resolve ข้อมูลรับรองของ Gateway ใช้สัญญาเดียวกันร่วมกันในเส้นทาง call/probe/status และการมอนิเตอร์ Discord exec-approval ส่วน node-host ใช้สัญญาพื้นฐานเดียวกันนี้โดยมีข้อยกเว้นหนึ่งข้อในโหมด local (มันจะเพิกเฉยต่อ `gateway.remote.*` โดยตั้งใจ):

- ข้อมูลรับรองแบบชัดเจน (`--token`, `--password` หรือ tool `gatewayToken`) มีความสำคัญสูงสุดเสมอในเส้นทาง call ที่รองรับการยืนยันตัวตนแบบชัดเจน
- ความปลอดภัยของ URL override:
  - การ override URL ของ CLI (`--url`) จะไม่ใช้ข้อมูลรับรองโดยนัยจาก config/env
  - การ override URL ผ่าน env (`OPENCLAW_GATEWAY_URL`) สามารถใช้ข้อมูลรับรองจาก env เท่านั้น (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)
- ค่าเริ่มต้นในโหมด local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback ไป remote จะมีผลเฉพาะเมื่อไม่ได้ตั้งค่า local auth token input)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback ไป remote จะมีผลเฉพาะเมื่อไม่ได้ตั้งค่า local auth password input)
- ค่าเริ่มต้นในโหมด remote:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- ข้อยกเว้นของ node-host ในโหมด local: `gateway.remote.token` / `gateway.remote.password` จะถูกเพิกเฉย
- การตรวจสอบ token ของ remote probe/status เป็นแบบเข้มงวดโดยค่าเริ่มต้น: จะใช้ `gateway.remote.token` เท่านั้น (ไม่มี local token fallback) เมื่อกำหนดเป้าหมายไปยังโหมด remote
- การ override ผ่าน env ของ Gateway ใช้เฉพาะ `OPENCLAW_GATEWAY_*`

## Chat UI ผ่าน SSH

WebChat ไม่ได้ใช้พอร์ต HTTP แยกอีกต่อไป SwiftUI chat UI จะเชื่อมต่อโดยตรงกับ Gateway WebSocket

- forward พอร์ต `18789` ผ่าน SSH (ดูด้านบน) แล้วเชื่อมต่อไคลเอนต์ไปที่ `ws://127.0.0.1:18789`
- บน macOS ควรใช้โหมด “Remote over SSH” ของแอป ซึ่งจัดการ tunnel ให้อัตโนมัติ

## แอป macOS แบบ "Remote over SSH"

แอปเมนูบาร์บน macOS สามารถขับเคลื่อนการตั้งค่าเดียวกันนี้แบบครบวงจรได้ (การตรวจสอบสถานะระยะไกล, WebChat และการส่งต่อ Voice Wake)

คู่มือปฏิบัติ: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

## กฎด้านความปลอดภัย (remote/VPN)

สรุปสั้น ๆ: **ให้คง Gateway เป็น loopback-only** เว้นแต่คุณมั่นใจว่าจำเป็นต้อง bind ออกไป

- **Loopback + SSH/Tailscale Serve** คือค่าเริ่มต้นที่ปลอดภัยที่สุด (ไม่เปิดสู่สาธารณะ)
- `ws://` แบบ plaintext เป็น loopback-only โดยค่าเริ่มต้น สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้
  ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` บน process ของไคลเอนต์
  เพื่อเป็นทางหนีฉุกเฉิน ไม่มีค่าเทียบเท่าใน `openclaw.json`; ต้องตั้งเป็น
  process environment สำหรับไคลเอนต์ที่สร้างการเชื่อมต่อ WebSocket เท่านั้น
- **การ bind ที่ไม่ใช่ loopback** (`lan`/`tailnet`/`custom`, หรือ `auto` เมื่อ loopback ใช้งานไม่ได้) ต้องใช้ gateway auth: token, password หรือ reverse proxy แบบรับรู้ตัวตนที่มี `gateway.auth.mode: "trusted-proxy"` กำหนดไว้อย่างถูกต้อง
- `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองของไคลเอนต์ ไม่ได้ใช้กำหนด server auth ด้วยตัวเอง
- เส้นทาง local call สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้ง `gateway.auth.*`
- หากมีการกำหนด `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef แต่ resolve ไม่ได้ การ resolve จะล้มเหลวแบบ fail closed (ไม่มี remote fallback มาปกปิด)
- `gateway.remote.tlsFingerprint` ใช้ตรึงใบรับรอง TLS ระยะไกลเมื่อใช้ `wss://`
- **Tailscale Serve** สามารถยืนยันตัวตนทราฟฟิก Control UI/WebSocket ผ่าน identity
  headers ได้เมื่อ `gateway.auth.allowTailscale: true`; ส่วนปลายทาง HTTP API จะไม่ใช้การยืนยันตัวตนผ่าน Tailscale headers นี้ และจะทำตามโหมด HTTP auth ปกติของ gateway แทน โฟลว์แบบไม่ใช้ token นี้ถือว่าโฮสต์ gateway เป็นที่เชื่อถือได้ ตั้งค่าเป็น
  `false` หากคุณต้องการ shared-secret auth ทุกจุด
- การยืนยันตัวตนแบบ **trusted-proxy** ใช้สำหรับการตั้งค่า identity-aware proxy ที่ไม่ใช่ loopback เท่านั้น
  reverse proxy แบบ loopback บนโฮสต์เดียวกันไม่ถือว่าตรงตาม `gateway.auth.mode: "trusted-proxy"`
- ให้ถือว่าการควบคุมเบราว์เซอร์มีสิทธิ์เทียบเท่าผู้ปฏิบัติงาน: ใช้เฉพาะ tailnet + การจับคู่โหนดอย่างตั้งใจ

เจาะลึก: [ความปลอดภัย](/th/gateway/security)

### macOS: SSH tunnel แบบถาวรผ่าน LaunchAgent

สำหรับไคลเอนต์ macOS ที่เชื่อมต่อกับ gateway ระยะไกล การตั้งค่าแบบถาวรที่ง่ายที่สุดคือใช้รายการ `LocalForward` ใน config ของ SSH ร่วมกับ LaunchAgent เพื่อให้ tunnel ทำงานต่อเนื่องข้ามการรีบูตและการแครช

#### ขั้นตอนที่ 1: เพิ่ม SSH config

แก้ไข `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

แทน `<REMOTE_IP>` และ `<REMOTE_USER>` ด้วยค่าของคุณ

#### ขั้นตอนที่ 2: คัดลอก SSH key (ครั้งเดียว)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ขั้นตอนที่ 3: กำหนดค่า gateway token

จัดเก็บ token ไว้ใน config เพื่อให้คงอยู่ข้ามการรีสตาร์ต:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ขั้นตอนที่ 4: สร้าง LaunchAgent

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

#### ขั้นตอนที่ 5: โหลด LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

tunnel จะเริ่มโดยอัตโนมัติเมื่อ login, รีสตาร์ตเมื่อแครช และคงพอร์ตที่ forward ไว้ให้พร้อมใช้งาน

หมายเหตุ: หากคุณยังมี LaunchAgent ชื่อ `com.openclaw.ssh-tunnel` ที่เหลือจากการตั้งค่าเก่า ให้ unload และลบทิ้ง

#### การแก้ไขปัญหา

ตรวจสอบว่า tunnel กำลังทำงานหรือไม่:

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

| Config entry                         | สิ่งที่ทำ                                                     |
| ------------------------------------ | ------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | forward พอร์ตในเครื่อง 18789 ไปยังพอร์ตระยะไกล 18789         |
| `ssh -N`                             | SSH โดยไม่รันคำสั่งระยะไกล (ทำเฉพาะ port-forwarding)         |
| `KeepAlive`                          | รีสตาร์ต tunnel โดยอัตโนมัติหากแครช                          |
| `RunAtLoad`                          | เริ่ม tunnel เมื่อ LaunchAgent ถูกโหลดตอน login               |

## ที่เกี่ยวข้อง

- [Tailscale](/th/gateway/tailscale)
- [การยืนยันตัวตน](/th/gateway/authentication)
- [การตั้งค่า gateway ระยะไกล](/th/gateway/remote-gateway-readme)
