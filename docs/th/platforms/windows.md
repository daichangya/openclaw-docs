---
read_when:
    - การติดตั้ง OpenClaw บน Windows
    - การเลือกระหว่าง Windows แบบ native กับ WSL2
    - กำลังมองหาสถานะของแอปคู่หูบน Windows
summary: 'การรองรับ Windows: เส้นทางการติดตั้งแบบ native และ WSL2, daemon และข้อควรระวังปัจจุบัน'
title: Windows
x-i18n:
    generated_at: "2026-04-24T09:22:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw รองรับทั้ง **Windows แบบเนทีฟ** และ **WSL2** โดย WSL2 เป็นเส้นทางที่เสถียรกว่าและแนะนำสำหรับประสบการณ์แบบเต็มรูปแบบ — CLI, Gateway และเครื่องมือต่าง ๆ จะทำงานภายใน Linux พร้อมความเข้ากันได้เต็มรูปแบบ ส่วน Windows แบบเนทีฟใช้งานได้สำหรับการใช้ CLI และ Gateway พื้นฐาน โดยมีข้อควรทราบบางประการตามที่ระบุด้านล่าง

แอปคู่หูสำหรับ Windows แบบเนทีฟมีแผนจะเพิ่มในอนาคต

## WSL2 (แนะนำ)

- [เริ่มต้นใช้งาน](/th/start/getting-started) (ใช้งานภายใน WSL)
- [การติดตั้งและการอัปเดต](/th/install/updating)
- คู่มือ WSL2 อย่างเป็นทางการ (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## สถานะของ Windows แบบเนทีฟ

การทำงานของ CLI แบบเนทีฟบน Windows กำลังพัฒนาให้ดีขึ้น แต่ WSL2 ยังคงเป็นเส้นทางที่แนะนำ

สิ่งที่ใช้งานได้ดีบน Windows แบบเนทีฟในปัจจุบัน:

- ตัวติดตั้งผ่านเว็บไซต์ด้วย `install.ps1`
- การใช้งาน CLI ภายในเครื่อง เช่น `openclaw --version`, `openclaw doctor` และ `openclaw plugins list --json`
- การทดสอบ smoke ของ local-agent/provider แบบฝังตัว เช่น:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

ข้อควรทราบในปัจจุบัน:

- `openclaw onboard --non-interactive` ยังคงคาดหวังว่า local gateway จะต้องเข้าถึงได้ เว้นแต่คุณจะส่ง `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` และ `openclaw gateway install` จะพยายามใช้ Windows Scheduled Tasks ก่อน
- หากการสร้าง Scheduled Task ถูกปฏิเสธ OpenClaw จะย้อนกลับไปใช้รายการเริ่มต้นเมื่อเข้าสู่ระบบในโฟลเดอร์ Startup ของผู้ใช้แต่ละราย และเริ่ม gateway ทันที
- หาก `schtasks` เองค้างหรือหยุดตอบสนอง ตอนนี้ OpenClaw จะยกเลิกเส้นทางนั้นอย่างรวดเร็วและย้อนกลับแทนที่จะค้างตลอดไป
- ยังคงแนะนำให้ใช้ Scheduled Tasks เมื่อใช้งานได้ เนื่องจากให้สถานะ supervisor ที่ดีกว่า

หากคุณต้องการใช้เฉพาะ CLI แบบเนทีฟ โดยไม่ติดตั้งบริการ gateway ให้ใช้คำสั่งใดคำสั่งหนึ่งต่อไปนี้:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

หากคุณต้องการให้มีการเริ่มต้นแบบจัดการได้บน Windows แบบเนทีฟ:

```powershell
openclaw gateway install
openclaw gateway status --json
```

หากการสร้าง Scheduled Task ถูกบล็อก โหมดบริการแบบย้อนกลับจะยังคงเริ่มอัตโนมัติหลังจากเข้าสู่ระบบผ่านโฟลเดอร์ Startup ของผู้ใช้ปัจจุบัน

## Gateway

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การกำหนดค่า](/th/gateway/configuration)

## การติดตั้งบริการ Gateway (CLI)

ภายใน WSL2:

```
openclaw onboard --install-daemon
```

หรือ:

```
openclaw gateway install
```

หรือ:

```
openclaw configure
```

เลือก **บริการ Gateway** เมื่อมีข้อความถาม

ซ่อมแซม/ย้ายระบบ:

```
openclaw doctor
```

## การเริ่มอัตโนมัติของ Gateway ก่อนเข้าสู่ระบบ Windows

สำหรับการตั้งค่าแบบ headless ตรวจสอบให้แน่ใจว่าลำดับการบูตทั้งหมดทำงานแม้ในกรณีที่ยังไม่มีใครเข้าสู่ระบบ Windows

### 1) ให้บริการของผู้ใช้ทำงานต่อได้โดยไม่ต้องเข้าสู่ระบบ

ภายใน WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) ติดตั้งบริการผู้ใช้ OpenClaw gateway

ภายใน WSL:

```bash
openclaw gateway install
```

### 3) เริ่ม WSL โดยอัตโนมัติเมื่อ Windows บูต

ใน PowerShell ด้วยสิทธิ์ Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

แทนที่ `Ubuntu` ด้วยชื่อดิสโทรของคุณจาก:

```powershell
wsl --list --verbose
```

### ตรวจสอบลำดับการเริ่มต้น

หลังจากรีบูตแล้ว (ก่อนลงชื่อเข้าใช้ Windows) ให้ตรวจสอบจาก WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## ขั้นสูง: เปิดเผยบริการ WSL ผ่าน LAN (portproxy)

WSL มีเครือข่ายเสมือนของตัวเอง หากเครื่องอื่นจำเป็นต้องเข้าถึงบริการที่ทำงานอยู่ **ภายใน WSL** (SSH, เซิร์ฟเวอร์ TTS ภายในเครื่อง หรือ Gateway) คุณต้องส่งต่อพอร์ตของ Windows ไปยัง IP ปัจจุบันของ WSL โดย IP ของ WSL จะเปลี่ยนหลังการรีสตาร์ต ดังนั้นคุณอาจต้องรีเฟรชกฎการส่งต่อ

ตัวอย่าง (PowerShell **ในฐานะ Administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

อนุญาตพอร์ตผ่าน Windows Firewall (ทำครั้งเดียว):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

รีเฟรช portproxy หลังจาก WSL รีสตาร์ต:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

หมายเหตุ:

- การเชื่อมต่อ SSH จากเครื่องอื่นจะต้องชี้ไปยัง **IP ของโฮสต์ Windows** (ตัวอย่าง: `ssh user@windows-host -p 2222`)
- Node ระยะไกลต้องชี้ไปที่ URL ของ Gateway ที่ **เข้าถึงได้จริง** (ไม่ใช่ `127.0.0.1`) ให้ใช้ `openclaw status --all` เพื่อยืนยัน
- ใช้ `listenaddress=0.0.0.0` สำหรับการเข้าถึงผ่าน LAN; ส่วน `127.0.0.1` จะจำกัดให้ใช้ได้เฉพาะภายในเครื่อง
- หากคุณต้องการให้เป็นอัตโนมัติ ให้ลงทะเบียน Scheduled Task เพื่อเรียกใช้ขั้นตอนรีเฟรชเมื่อเข้าสู่ระบบ

## การติดตั้ง WSL2 แบบทีละขั้นตอน

### 1) ติดตั้ง WSL2 + Ubuntu

เปิด PowerShell (Admin):

```powershell
wsl --install
# หรือเลือกดิสโทรแบบระบุชัดเจน:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

รีบูตหาก Windows แจ้งให้ทำ

### 2) เปิดใช้งาน systemd (จำเป็นสำหรับการติดตั้ง gateway)

ในเทอร์มินัล WSL ของคุณ:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

จากนั้นใน PowerShell:

```powershell
wsl --shutdown
```

เปิด Ubuntu อีกครั้ง แล้วตรวจสอบ:

```bash
systemctl --user status
```

### 3) ติดตั้ง OpenClaw (ภายใน WSL)

สำหรับการตั้งค่าครั้งแรกตามปกติภายใน WSL ให้ทำตามขั้นตอนเริ่มต้นใช้งานสำหรับ Linux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

หากคุณกำลังพัฒนาจากซอร์สแทนที่จะทำ onboarding ครั้งแรก ให้ใช้ลูปการพัฒนาจากซอร์สจาก [การตั้งค่า](/th/start/setup):

```bash
pnpm install
# รันครั้งแรกเท่านั้น (หรือหลังจากรีเซ็ต config/workspace ภายในเครื่องของ OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

คู่มือฉบับเต็ม: [เริ่มต้นใช้งาน](/th/start/getting-started)

## แอปคู่หูสำหรับ Windows

ขณะนี้เรายังไม่มีแอปคู่หูสำหรับ Windows หากคุณต้องการช่วยทำให้สิ่งนี้เกิดขึ้น เรายินดีรับการมีส่วนร่วม

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [แพลตฟอร์ม](/th/platforms)
