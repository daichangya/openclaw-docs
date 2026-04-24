---
read_when:
    - การตั้งค่า OpenClaw บน DigitalOcean
    - กำลังมองหา VPS ราคาประหยัดสำหรับ OpenClaw
summary: OpenClaw บน DigitalOcean (ตัวเลือก VPS แบบเสียเงินที่เรียบง่าย)
title: DigitalOcean (แพลตฟอร์ม)
x-i18n:
    generated_at: "2026-04-24T09:21:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw บน DigitalOcean

## เป้าหมาย

รัน OpenClaw Gateway แบบคงอยู่บน DigitalOcean ในราคา **$6/เดือน** (หรือ $4/เดือนหากใช้ reserved pricing)

หากคุณต้องการตัวเลือก $0/เดือนและไม่ติดเรื่อง ARM + การตั้งค่าเฉพาะผู้ให้บริการ ดู [คู่มือ Oracle Cloud](/th/install/oracle)

## เปรียบเทียบค่าใช้จ่าย (2026)

| ผู้ให้บริการ   | แผน               | สเปก                   | ราคา/เดือน   | หมายเหตุ                                  |
| -------------- | ----------------- | ---------------------- | ------------ | ----------------------------------------- |
| Oracle Cloud   | Always Free ARM   | สูงสุด 4 OCPU, RAM 24GB | $0           | ARM, ความจุจำกัด / สมัครค่อนข้างจุกจิก    |
| Hetzner        | CX22              | 2 vCPU, RAM 4GB        | €3.79 (~$4)  | ตัวเลือกแบบเสียเงินที่ถูกที่สุด            |
| DigitalOcean   | Basic             | 1 vCPU, RAM 1GB        | $6           | UI ใช้ง่าย เอกสารดี                       |
| Vultr          | Cloud Compute     | 1 vCPU, RAM 1GB        | $6           | มีหลาย location                           |
| Linode         | Nanode            | 1 vCPU, RAM 1GB        | $5           | ปัจจุบันเป็นส่วนหนึ่งของ Akamai          |

**การเลือกผู้ให้บริการ:**

- DigitalOcean: UX ง่ายที่สุด + การตั้งค่าคาดเดาได้ (คู่มือนี้)
- Hetzner: ราคาต่อประสิทธิภาพดี (ดู [คู่มือ Hetzner](/th/install/hetzner))
- Oracle Cloud: อาจเป็น $0/เดือน แต่จุกจิกกว่าและเป็น ARM-only (ดู [คู่มือ Oracle](/th/install/oracle))

---

## ข้อกำหนดเบื้องต้น

- บัญชี DigitalOcean ([สมัครพร้อมเครดิตฟรี $200](https://m.do.co/c/signup))
- คู่กุญแจ SSH (หรือยินดีใช้ password auth)
- เวลาประมาณ 20 นาที

## 1) สร้าง Droplet

<Warning>
ใช้ base image ที่สะอาด (Ubuntu 24.04 LTS) หลีกเลี่ยง Marketplace 1-click images จากบุคคลที่สาม เว้นแต่คุณได้ตรวจสอบ startup scripts และค่าเริ่มต้นของ firewall แล้ว
</Warning>

1. ล็อกอินไปที่ [DigitalOcean](https://cloud.digitalocean.com/)
2. คลิก **Create → Droplets**
3. เลือก:
   - **Region:** ใกล้คุณที่สุด (หรือใกล้ผู้ใช้ของคุณ)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo** (1 vCPU, RAM 1GB, SSD 25GB)
   - **Authentication:** SSH key (แนะนำ) หรือ password
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

wizard จะพาคุณผ่านขั้นตอนต่อไปนี้:

- model auth (API keys หรือ OAuth)
- การตั้งค่าช่องทาง (Telegram, WhatsApp, Discord ฯลฯ)
- Gateway token (สร้างให้อัตโนมัติ)
- การติดตั้ง daemon (systemd)

## 5) ตรวจสอบ Gateway

```bash
# ตรวจสอบสถานะ
openclaw status

# ตรวจสอบ service
systemctl --user status openclaw-gateway.service

# ดู logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) เข้าถึง Dashboard

gateway จะ bind กับ loopback เป็นค่าเริ่มต้น หากต้องการเข้าถึง Control UI:

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

- Serve จะคง Gateway ไว้แบบ loopback-only และยืนยันตัวตนทราฟฟิกของ Control UI/WebSocket ผ่าน Tailscale identity headers (tokenless auth ถือว่าโฮสต์ gateway เชื่อถือได้; HTTP APIs จะไม่ใช้ Tailscale headers เหล่านั้น และจะใช้โหมด HTTP auth ปกติของ gateway แทน)
- หากต้องการให้ใช้ shared-secret credentials แบบ explicit แทน ให้ตั้งค่า `gateway.auth.allowTailscale: false` และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

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

ดู [Channels](/th/channels) สำหรับผู้ให้บริการรายอื่น

---

## การปรับแต่งสำหรับ RAM 1GB

droplet ราคา $6 มี RAM เพียง 1GB เพื่อให้ทำงานได้ลื่นขึ้น:

### เพิ่ม swap (แนะนำ)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### ใช้โมเดลที่เบากว่า

หากคุณเจอ OOMs ให้พิจารณา:

- ใช้โมเดลแบบ API-based (Claude, GPT) แทนโมเดลในเครื่อง
- ตั้งค่า `agents.defaults.model.primary` เป็นโมเดลที่เล็กกว่า

### เฝ้าดูหน่วยความจำ

```bash
free -h
htop
```

---

## การคงอยู่ของข้อมูล

สถานะทั้งหมดอยู่ใน:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` รายเอเจนต์, สถานะของ channel/provider และข้อมูลเซสชัน
- `~/.openclaw/workspace/` — workspace (SOUL.md, memory ฯลฯ)

สิ่งเหล่านี้อยู่รอดข้ามการรีบูต สำรองข้อมูลเป็นระยะ:

```bash
openclaw backup create
```

---

## ทางเลือกฟรีบน Oracle Cloud

Oracle Cloud มีอินสแตนซ์ ARM แบบ **Always Free** ที่มีประสิทธิภาพสูงกว่าตัวเลือกแบบเสียเงินทั้งหมดที่นี่อย่างมาก — ในราคา $0/เดือน

| สิ่งที่คุณได้รับ | สเปก                    |
| ---------------- | ----------------------- |
| **4 OCPUs**      | ARM Ampere A1           |
| **RAM 24GB**     | มากเกินพอ               |
| **พื้นที่เก็บ 200GB** | Block volume        |
| **ฟรีตลอดไป**   | ไม่มีการเรียกเก็บบัตรเครดิต |

**ข้อควรระวัง:**

- การสมัครอาจจุกจิก (ลองใหม่หากล้มเหลว)
- สถาปัตยกรรม ARM — ส่วนใหญ่ใช้งานได้ แต่บาง binary ต้องใช้ ARM builds

สำหรับคู่มือการตั้งค่าแบบเต็ม ดู [Oracle Cloud](/th/install/oracle) สำหรับเคล็ดลับการสมัครและการแก้ปัญหาในกระบวนการสมัคร ดู [คู่มือจากชุมชน](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)

---

## การแก้ไขปัญหา

### Gateway ไม่ยอมเริ่ม

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

## ที่เกี่ยวข้อง

- [คู่มือ Hetzner](/th/install/hetzner) — ถูกกว่า แรงกว่า
- [ติดตั้งด้วย Docker](/th/install/docker) — การตั้งค่าแบบคอนเทนเนอร์
- [Tailscale](/th/gateway/tailscale) — การเข้าถึงระยะไกลอย่างปลอดภัย
- [Configuration](/th/gateway/configuration) — เอกสารอ้างอิงคอนฟิกแบบเต็ม
