---
read_when:
    - การตั้งค่า OpenClaw บน DigitalOcean
    - กำลังมองหาโฮสติ้ง VPS ราคาถูกสำหรับ OpenClaw
summary: OpenClaw บน DigitalOcean (ตัวเลือก VPS แบบเสียเงินที่เรียบง่าย)
title: DigitalOcean (แพลตฟอร์ม)
x-i18n:
    generated_at: "2026-04-23T05:43:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw บน DigitalOcean

## เป้าหมาย

รัน OpenClaw Gateway แบบถาวรบน DigitalOcean ด้วยราคา **$6/เดือน** (หรือ $4/เดือน หากใช้การจองล่วงหน้า)

หากคุณต้องการตัวเลือก $0/เดือนและไม่ติดเรื่อง ARM + การตั้งค่าเฉพาะของผู้ให้บริการ ให้ดู [คู่มือ Oracle Cloud](/th/install/oracle)

## เปรียบเทียบค่าใช้จ่าย (2026)

| ผู้ให้บริการ | แผน            | สเปก                  | ราคา/เดือน   | หมายเหตุ                                 |
| ------------ | -------------- | --------------------- | ------------ | ---------------------------------------- |
| Oracle Cloud | Always Free ARM | สูงสุด 4 OCPU, RAM 24GB | $0         | ARM, ความจุจำกัด / ขั้นตอนสมัครมีจุกจิก |
| Hetzner      | CX22           | 2 vCPU, RAM 4GB       | €3.79 (~$4) | ตัวเลือกแบบเสียเงินที่ถูกที่สุด          |
| DigitalOcean | Basic          | 1 vCPU, RAM 1GB       | $6          | UI ใช้ง่าย เอกสารดี                      |
| Vultr        | Cloud Compute  | 1 vCPU, RAM 1GB       | $6          | มีหลายตำแหน่ง                            |
| Linode       | Nanode         | 1 vCPU, RAM 1GB       | $5          | ตอนนี้เป็นส่วนหนึ่งของ Akamai          |

**การเลือกผู้ให้บริการ:**

- DigitalOcean: UX ง่ายที่สุด + การตั้งค่าคาดเดาได้ (คู่มือนี้)
- Hetzner: ราคาต่อประสิทธิภาพดี (ดู [คู่มือ Hetzner](/th/install/hetzner))
- Oracle Cloud: อาจเป็น $0/เดือน แต่จุกจิกกว่าและเป็น ARM เท่านั้น (ดู [คู่มือ Oracle](/th/install/oracle))

---

## ข้อกำหนดเบื้องต้น

- บัญชี DigitalOcean ([สมัครพร้อมเครดิตฟรี $200](https://m.do.co/c/signup))
- คู่คีย์ SSH (หรือพร้อมจะใช้การยืนยันตัวตนด้วยรหัสผ่าน)
- เวลาประมาณ 20 นาที

## 1) สร้าง Droplet

<Warning>
ใช้ base image ที่สะอาด (Ubuntu 24.04 LTS) หลีกเลี่ยง Marketplace 1-click image จากบุคคลที่สาม เว้นแต่คุณได้ตรวจสอบ startup script และค่าเริ่มต้นของไฟร์วอลล์แล้ว
</Warning>

1. ล็อกอินเข้า [DigitalOcean](https://cloud.digitalocean.com/)
2. คลิก **Create → Droplets**
3. เลือก:
   - **Region:** ใกล้คุณ (หรือผู้ใช้ของคุณ) ที่สุด
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/เดือน** (1 vCPU, RAM 1GB, SSD 25GB)
   - **Authentication:** SSH key (แนะนำ) หรือรหัสผ่าน
4. คลิก **Create Droplet**
5. จด IP address ไว้

## 2) เชื่อมต่อผ่าน SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) ติดตั้ง OpenClaw

```bash
# อัปเดตระบบ
apt update && apt upgrade -y

# ติดตั้ง Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# ติดตั้ง OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# ตรวจสอบ
openclaw --version
```

## 4) รัน Onboarding

```bash
openclaw onboard --install-daemon
```

วิซาร์ดจะพาคุณผ่านขั้นตอน:

- การยืนยันตัวตนของโมเดล (API keys หรือ OAuth)
- การตั้งค่าช่องทาง (Telegram, WhatsApp, Discord ฯลฯ)
- Gateway token (สร้างให้อัตโนมัติ)
- การติดตั้ง daemon (systemd)

## 5) ตรวจสอบ Gateway

```bash
# ตรวจสอบสถานะ
openclaw status

# ตรวจสอบ service
systemctl --user status openclaw-gateway.service

# ดูล็อก
journalctl --user -u openclaw-gateway.service -f
```

## 6) เข้าถึงแดชบอร์ด

โดยค่าเริ่มต้น gateway จะ bind กับ loopback หากต้องการเข้าถึง Control UI:

**ตัวเลือก A: SSH Tunnel (แนะนำ)**

```bash
# จากเครื่อง local ของคุณ
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# จากนั้นเปิด: http://localhost:18789
```

**ตัวเลือก B: Tailscale Serve (HTTPS, loopback-only)**

```bash
# บน droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# กำหนดค่า Gateway ให้ใช้ Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

เปิด: `https://<magicdns>/`

หมายเหตุ:

- Serve จะทำให้ Gateway ยังคงเป็น loopback-only และยืนยันตัวตนทราฟฟิกของ Control UI/WebSocket ผ่าน Tailscale identity headers (auth แบบไม่ใช้ token นี้ตั้งอยู่บนสมมติฐานว่าโฮสต์ของ gateway เชื่อถือได้; HTTP API จะไม่ใช้ Tailscale headers เหล่านั้น แต่จะยึดตามโหมด HTTP auth ปกติของ gateway แทน)
- หากต้องการบังคับใช้ข้อมูลรับรอง shared-secret แบบชัดเจนแทน ให้ตั้ง `gateway.auth.allowTailscale: false` และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

**ตัวเลือก C: Tailnet bind (ไม่ใช้ Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

เปิด: `http://<tailscale-ip>:18789` (ต้องใช้ token)

## 7) เชื่อมต่อช่องทางของคุณ

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# สแกน QR code
```

ดู [Channels](/th/channels) สำหรับผู้ให้บริการอื่น

---

## การปรับแต่งสำหรับ RAM 1GB

droplet ราคา $6 มี RAM เพียง 1GB เพื่อให้ระบบทำงานลื่นไหล:

### เพิ่ม swap (แนะนำ)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### ใช้โมเดลที่เบากว่า

หากคุณเจอ OOM ให้พิจารณา:

- ใช้โมเดลที่อิง API (Claude, GPT) แทนโมเดล local
- ตั้งค่า `agents.defaults.model.primary` ไปยังโมเดลที่เล็กกว่า

### ตรวจสอบหน่วยความจำ

```bash
free -h
htop
```

---

## การเก็บสถานะถาวร

สถานะทั้งหมดอยู่ใน:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` ต่อเอเจนต์, สถานะของช่องทาง/ผู้ให้บริการ และข้อมูลเซสชัน
- `~/.openclaw/workspace/` — workspace (SOUL.md, หน่วยความจำ ฯลฯ)

สิ่งเหล่านี้จะคงอยู่หลังการรีบูต ควรสำรองเป็นระยะ:

```bash
openclaw backup create
```

---

## ทางเลือกฟรีจาก Oracle Cloud

Oracle Cloud มี instance ARM แบบ **Always Free** ที่ทรงพลังกว่าตัวเลือกแบบเสียเงินใด ๆ ที่กล่าวถึงที่นี่มาก — ในราคา $0/เดือน

| สิ่งที่คุณได้รับ   | สเปก                  |
| ------------------ | --------------------- |
| **4 OCPUs**        | ARM Ampere A1         |
| **RAM 24GB**       | มากเกินพอ             |
| **ที่เก็บข้อมูล 200GB** | Block volume     |
| **ฟรีตลอดไป**      | ไม่มีค่าใช้จ่ายจากบัตรเครดิต |

**ข้อควรระวัง:**

- การสมัครอาจจุกจิก (หากล้มเหลวให้ลองใหม่)
- เป็นสถาปัตยกรรม ARM — ส่วนใหญ่ใช้งานได้ แต่บางไบนารีต้องมีบิลด์ ARM

สำหรับคู่มือการตั้งค่าแบบเต็ม ดู [Oracle Cloud](/th/install/oracle) สำหรับเคล็ดลับการสมัครและการแก้ไขปัญหาระหว่างขั้นตอนสมัคร ดู [คู่มือจากชุมชน](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) นี้

---

## การแก้ไขปัญหา

### Gateway ไม่ยอมเริ่มทำงาน

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### พอร์ตถูกใช้งานอยู่แล้ว

```bash
lsof -i :18789
kill <PID>
```

### หน่วยความจำไม่พอ

```bash
# ตรวจสอบหน่วยความจำ
free -h

# เพิ่ม swap เพิ่มเติม
# หรืออัปเกรดเป็น droplet ราคา $12/เดือน (RAM 2GB)
```

---

## ดูเพิ่มเติม

- [คู่มือ Hetzner](/th/install/hetzner) — ถูกกว่า ทรงพลังกว่า
- [การติดตั้งด้วย Docker](/th/install/docker) — การตั้งค่าแบบ containerized
- [Tailscale](/th/gateway/tailscale) — การเข้าถึงระยะไกลอย่างปลอดภัย
- [การกำหนดค่า](/th/gateway/configuration) — เอกสารอ้างอิง config แบบเต็ม
