---
read_when:
    - กำลังติดตั้ง OpenClaw บน Windows
    - กำลังเลือกว่าจะใช้ Windows แบบเนทีฟหรือ WSL2 аҳәanalysis to=functions.read 】【：】【“】【commentary to=functions.read  北京赛车微信json 代理娱乐{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}
    - กำลังมองหาสถานะของแอปคู่หูบน Windows
summary: 'การรองรับ Windows: เส้นทางการติดตั้งแบบเนทีฟและ WSL2, daemon และข้อจำกัดปัจจุบัน'
title: Windows
x-i18n:
    generated_at: "2026-04-23T05:45:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw รองรับทั้ง **Windows แบบเนทีฟ** และ **WSL2** โดย WSL2 เป็นเส้นทางที่
เสถียรกว่าและแนะนำสำหรับประสบการณ์แบบเต็ม — CLI, Gateway และ
tooling จะรันภายใน Linux พร้อมความเข้ากันได้แบบเต็ม Native Windows ใช้ได้สำหรับ
CLI และ Gateway หลัก โดยมีข้อจำกัดบางอย่างตามที่ระบุด้านล่าง

แอปคู่หูแบบเนทีฟบน Windows มีแผนจะทำในอนาคต

## WSL2 (แนะนำ)

- [เริ่มต้นใช้งาน](/th/start/getting-started) (ใช้งานภายใน WSL)
- [การติดตั้งและอัปเดต](/th/install/updating)
- คู่มือ WSL2 อย่างเป็นทางการ (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## สถานะของ Native Windows

flow ของ CLI แบบ Native Windows กำลังดีขึ้น แต่ WSL2 ยังคงเป็นเส้นทางที่แนะนำ

สิ่งที่ใช้งานได้ดีบน Native Windows ในตอนนี้:

- ตัวติดตั้งผ่านเว็บไซต์ด้วย `install.ps1`
- การใช้ CLI แบบ local เช่น `openclaw --version`, `openclaw doctor` และ `openclaw plugins list --json`
- embedded local-agent/provider smoke เช่น:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

ข้อจำกัดปัจจุบัน:

- `openclaw onboard --non-interactive` ยังคงคาดว่าจะเข้าถึง local gateway ได้ เว้นแต่คุณจะส่ง `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` และ `openclaw gateway install` จะลองใช้ Windows Scheduled Tasks ก่อน
- หากการสร้าง Scheduled Task ถูกปฏิเสธ OpenClaw จะ fallback ไปใช้ login item แบบ per-user ใน Startup folder และเริ่ม gateway ทันที
- หาก `schtasks` เองค้างหรือหยุดตอบสนอง OpenClaw ตอนนี้จะยกเลิกเส้นทางนั้นอย่างรวดเร็วและ fallback แทนที่จะค้างตลอดไป
- Scheduled Tasks ยังคงเป็นตัวเลือกที่ต้องการเมื่อใช้งานได้ เพราะให้สถานะ supervisor ที่ดีกว่า

หากคุณต้องการเฉพาะ native CLI โดยไม่ติดตั้ง gateway service ให้ใช้หนึ่งในคำสั่งเหล่านี้:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

หากคุณต้องการ managed startup บน Native Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

หากการสร้าง Scheduled Task ถูกบล็อก fallback service mode จะยังเริ่มอัตโนมัติหลัง login ผ่าน Startup folder ของผู้ใช้ปัจจุบัน

## Gateway

- [คู่มือการปฏิบัติงาน Gateway](/th/gateway)
- [การกำหนดค่า](/th/gateway/configuration)

## การติดตั้ง Gateway service (CLI)

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

เลือก **Gateway service** เมื่อระบบถาม

การซ่อมแซม/ย้าย:

```
openclaw doctor
```

## การเริ่ม Gateway อัตโนมัติก่อน login เข้า Windows

สำหรับการตั้งค่าแบบ headless ให้แน่ใจว่า chain การบูตทั้งหมดทำงาน แม้จะยังไม่มีใคร login เข้า
Windows

### 1) ทำให้ user services ทำงานได้โดยไม่ต้อง login

ภายใน WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) ติดตั้ง OpenClaw gateway user service

ภายใน WSL:

```bash
openclaw gateway install
```

### 3) ทำให้ WSL เริ่มอัตโนมัติเมื่อ Windows บูต

ใน PowerShell แบบ Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

แทน `Ubuntu` ด้วยชื่อ distro ของคุณจาก:

```powershell
wsl --list --verbose
```

### ตรวจสอบ startup chain

หลังจากรีบูต (ก่อน sign-in เข้า Windows) ให้ตรวจสอบจาก WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## ขั้นสูง: เปิดเผยบริการใน WSL ผ่าน LAN (portproxy)

WSL มี virtual network ของตัวเอง หากเครื่องอื่นต้องการเข้าถึงบริการที่รัน **ภายใน WSL**
(SSH, local TTS server หรือ Gateway) คุณต้อง
forward พอร์ตของ Windows ไปยัง WSL IP ปัจจุบัน WSL IP จะเปลี่ยนหลังรีสตาร์ต
ดังนั้นคุณอาจต้องรีเฟรชกฎการ forwarding

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

อนุญาตพอร์ตผ่าน Windows Firewall (ครั้งเดียว):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

รีเฟรช portproxy หลัง WSL รีสตาร์ต:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

หมายเหตุ:

- SSH จากอีกเครื่องหนึ่งจะต้องชี้ไปที่ **Windows host IP** (เช่น `ssh user@windows-host -p 2222`)
- Remote nodes ต้องชี้ไปยัง Gateway URL ที่**เข้าถึงได้จริง** (ไม่ใช่ `127.0.0.1`); ใช้
  `openclaw status --all` เพื่อยืนยัน
- ใช้ `listenaddress=0.0.0.0` สำหรับการเข้าถึงผ่าน LAN; ใช้ `127.0.0.1` หากต้องการให้เข้าถึงได้เฉพาะในเครื่อง
- หากคุณต้องการให้เป็นอัตโนมัติ ให้ลงทะเบียน Scheduled Task เพื่อรัน
  ขั้นตอนรีเฟรชตอน login

## การติดตั้ง WSL2 แบบทีละขั้นตอน

### 1) ติดตั้ง WSL2 + Ubuntu

เปิด PowerShell (Admin):

```powershell
wsl --install
# หรือเลือก distro แบบ explicit:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

รีบูตหาก Windows ขอให้ทำ

### 2) เปิดใช้ systemd (จำเป็นสำหรับการติดตั้ง gateway)

ในเทอร์มินัล WSL ของคุณ:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

จากนั้นจาก PowerShell:

```powershell
wsl --shutdown
```

เปิด Ubuntu ใหม่ แล้วตรวจสอบ:

```bash
systemctl --user status
```

### 3) ติดตั้ง OpenClaw (ภายใน WSL)

สำหรับการตั้งค่าปกติครั้งแรกภายใน WSL ให้ทำตาม flow เริ่มต้นใช้งานของ Linux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

หากคุณกำลังพัฒนาจาก source แทนการทำ onboarding ครั้งแรก ให้ใช้
source dev loop จาก [Setup](/th/start/setup):

```bash
pnpm install
# รันครั้งแรกเท่านั้น (หรือหลังรีเซ็ตคอนฟิก/workspace ของ OpenClaw ในเครื่อง)
pnpm openclaw setup
pnpm gateway:watch
```

คู่มือฉบับเต็ม: [เริ่มต้นใช้งาน](/th/start/getting-started)

## แอปคู่หูบน Windows

เรายังไม่มีแอปคู่หูบน Windows ในตอนนี้ หากคุณต้องการช่วยให้เกิดขึ้น
เรายินดีรับ contributions
