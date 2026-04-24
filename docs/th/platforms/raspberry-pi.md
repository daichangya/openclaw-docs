---
read_when:
    - การตั้งค่า OpenClaw บน Raspberry Pi
    - การรัน OpenClaw บนอุปกรณ์ ARM
    - การสร้าง AI ส่วนตัวที่ทำงานตลอดเวลาในงบประหยัด
summary: OpenClaw บน Raspberry Pi (การตั้งค่าแบบ self-hosted ราคาประหยัด)
title: Raspberry Pi (แพลตฟอร์ม)
x-i18n:
    generated_at: "2026-04-24T09:22:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw บน Raspberry Pi

## เป้าหมาย

รัน OpenClaw Gateway แบบคงอยู่และทำงานตลอดเวลาบน Raspberry Pi ด้วยต้นทุนครั้งเดียวประมาณ **$35-80** (ไม่มีค่ารายเดือน)

เหมาะสำหรับ:

- ผู้ช่วย AI ส่วนตัวแบบ 24/7
- ศูนย์กลางระบบอัตโนมัติในบ้าน
- บอต Telegram/WhatsApp ที่ใช้พลังงานต่ำและพร้อมใช้งานตลอดเวลา

## ความต้องการด้านฮาร์ดแวร์

| รุ่น Pi          | RAM     | ใช้งานได้? | หมายเหตุ                           |
| ---------------- | ------- | ---------- | ---------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ ดีที่สุด | เร็วที่สุด, แนะนำ                  |
| **Pi 4**         | 4GB     | ✅ ดี       | จุดคุ้มค่าสำหรับผู้ใช้ส่วนใหญ่      |
| **Pi 4**         | 2GB     | ✅ พอใช้    | ใช้งานได้, ควรเพิ่ม swap           |
| **Pi 4**         | 1GB     | ⚠️ คับแคบ  | เป็นไปได้เมื่อมี swap, คอนฟิกขั้นต่ำ |
| **Pi 3B+**       | 1GB     | ⚠️ ช้า      | ใช้งานได้แต่หน่วง                  |
| **Pi Zero 2 W**  | 512MB   | ❌         | ไม่แนะนำ                           |

**สเปกขั้นต่ำ:** RAM 1GB, 1 คอร์, ดิสก์ 500MB  
**แนะนำ:** RAM 2GB+, OS 64-bit, SD card 16GB+ (หรือ USB SSD)

## สิ่งที่คุณต้องมี

- Raspberry Pi 4 หรือ 5 (แนะนำ 2GB+)
- MicroSD card (16GB+) หรือ USB SSD (ประสิทธิภาพดีกว่า)
- Power supply (แนะนำ PSU ทางการของ Pi)
- การเชื่อมต่อเครือข่าย (Ethernet หรือ WiFi)
- เวลาประมาณ 30 นาที

## 1) แฟลช OS

ใช้ **Raspberry Pi OS Lite (64-bit)** — ไม่ต้องใช้เดสก์ท็อปสำหรับเซิร์ฟเวอร์แบบ headless

1. ดาวน์โหลด [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. เลือก OS: **Raspberry Pi OS Lite (64-bit)**
3. คลิกไอคอนเฟือง (⚙️) เพื่อกำหนดค่าล่วงหน้า:
   - ตั้ง hostname: `gateway-host`
   - เปิดใช้ SSH
   - ตั้งชื่อผู้ใช้/รหัสผ่าน
   - กำหนดค่า WiFi (หากไม่ได้ใช้ Ethernet)
4. แฟลชลง SD card / USB drive
5. ใส่การ์ด/ไดรฟ์แล้วบูต Pi

## 2) เชื่อมต่อผ่าน SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) ตั้งค่าระบบ

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) ติดตั้ง Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) เพิ่ม Swap (สำคัญสำหรับ 2GB หรือน้อยกว่า)

Swap ช่วยป้องกันการ crash จาก out-of-memory:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) ติดตั้ง OpenClaw

### ตัวเลือก A: การติดตั้งแบบมาตรฐาน (แนะนำ)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### ตัวเลือก B: การติดตั้งแบบแก้ไขได้ง่าย (สำหรับคนที่ชอบปรับแต่ง)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

การติดตั้งแบบแก้ไขได้ง่ายจะทำให้คุณเข้าถึง log และโค้ดได้โดยตรง — มีประโยชน์สำหรับการดีบักปัญหาเฉพาะ ARM

## 7) รัน Onboarding

```bash
openclaw onboard --install-daemon
```

ทำตามวิซาร์ด:

1. **Gateway mode:** Local
2. **Auth:** แนะนำ API key (OAuth อาจมีความจุกจิกบน Pi แบบ headless)
3. **Channels:** Telegram เริ่มต้นได้ง่ายที่สุด
4. **Daemon:** Yes (systemd)

## 8) ตรวจสอบการติดตั้ง

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) เข้าถึง OpenClaw Dashboard

แทนที่ `user@gateway-host` ด้วยชื่อผู้ใช้และ hostname หรือ IP ของ Pi ของคุณ

บนคอมพิวเตอร์ของคุณ ให้สั่งให้ Pi พิมพ์ dashboard URL ใหม่:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

คำสั่งนี้จะพิมพ์ `Dashboard URL:` ออกมา ขึ้นอยู่กับวิธีการกำหนดค่า `gateway.auth.token`
URL อาจเป็นลิงก์ `http://127.0.0.1:18789/` แบบธรรมดา หรือเป็นลิงก์ที่มี
`#token=...` รวมอยู่ด้วย

ในอีกเทอร์มินัลหนึ่งบนคอมพิวเตอร์ของคุณ ให้สร้าง SSH tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

จากนั้นเปิด Dashboard URL ที่พิมพ์ออกมาในเบราว์เซอร์บนเครื่องของคุณ

หาก UI ขอ shared-secret auth ให้วาง token หรือรหัสผ่านที่กำหนดค่าไว้
ลงใน Control UI settings สำหรับ token auth ให้ใช้ `gateway.auth.token` (หรือ
`OPENCLAW_GATEWAY_TOKEN`)

สำหรับการเข้าถึงระยะไกลแบบ always-on ดู [Tailscale](/th/gateway/tailscale)

---

## การปรับแต่งประสิทธิภาพ

### ใช้ USB SSD (ดีขึ้นมาก)

SD card ช้าและสึกหรอง่าย USB SSD ช่วยเพิ่มประสิทธิภาพอย่างมาก:

```bash
# Check if booting from USB
lsblk
```

ดู [คู่มือบูตจาก USB ของ Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) สำหรับการตั้งค่า

### เร่งความเร็วการเริ่มต้น CLI (module compile cache)

บนโฮสต์ Pi ที่พลังประมวลผลต่ำ ให้เปิดใช้ module compile cache ของ Node เพื่อให้การรัน CLI ซ้ำเร็วขึ้น:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

หมายเหตุ:

- `NODE_COMPILE_CACHE` ช่วยให้การรันครั้งถัดไปเร็วขึ้น (`status`, `health`, `--help`)
- `/var/tmp` คงอยู่หลังรีบูตได้ดีกว่า `/tmp`
- `OPENCLAW_NO_RESPAWN=1` ช่วยหลีกเลี่ยงต้นทุนการเริ่มต้นเพิ่มเติมจากการ self-respawn ของ CLI
- การรันครั้งแรกเป็นการอุ่น cache; การรันภายหลังจะได้ประโยชน์มากที่สุด

### ปรับแต่งการเริ่มต้นของ systemd (ไม่บังคับ)

หาก Pi เครื่องนี้ใช้รัน OpenClaw เป็นหลัก ให้เพิ่ม service drop-in เพื่อลด restart
jitter และทำให้ env ตอนเริ่มต้นคงที่:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

จากนั้นนำการเปลี่ยนแปลงมาใช้:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

หากเป็นไปได้ ให้เก็บสถานะ/แคชของ OpenClaw ไว้บนสตอเรจที่รองรับด้วย SSD เพื่อหลีกเลี่ยง
ปัญหา random-I/O คอขวดของ SD card ระหว่าง cold start

หากนี่คือ Pi แบบ headless ให้เปิด lingering หนึ่งครั้งเพื่อให้ user service อยู่ต่อหลัง logout:

```bash
sudo loginctl enable-linger "$(whoami)"
```

นโยบาย `Restart=` ช่วยเรื่องการกู้คืนอัตโนมัติของ service อย่างไร:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)

### ลดการใช้หน่วยความจำ

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### ตรวจสอบทรัพยากร

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## หมายเหตุเฉพาะ ARM

### ความเข้ากันได้ของไบนารี

ฟีเจอร์ส่วนใหญ่ของ OpenClaw ใช้งานได้บน ARM64 แต่ไบนารีภายนอกบางตัวอาจต้องใช้ build สำหรับ ARM:

| เครื่องมือ           | สถานะ ARM64 | หมายเหตุ                            |
| -------------------- | ----------- | ----------------------------------- |
| Node.js              | ✅          | ใช้งานได้ดีมาก                      |
| WhatsApp (Baileys)   | ✅          | เป็น JS ล้วน, ไม่มีปัญหา            |
| Telegram             | ✅          | เป็น JS ล้วน, ไม่มีปัญหา            |
| gog (Gmail CLI)      | ⚠️          | ตรวจสอบว่ามี ARM release หรือไม่     |
| Chromium (browser)   | ✅          | `sudo apt install chromium-browser` |

หาก skill ล้มเหลว ให้ตรวจสอบว่าไบนารีของมันมี build สำหรับ ARM หรือไม่ เครื่องมือ Go/Rust จำนวนมากมี; บางตัวไม่มี

### 32-bit vs 64-bit

**ควรใช้ OS แบบ 64-bit เสมอ** Node.js และเครื่องมือสมัยใหม่จำนวนมากต้องใช้ ตรวจสอบด้วย:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## การตั้งค่าโมเดลที่แนะนำ

เนื่องจาก Pi เป็นเพียง Gateway (โมเดลรันบนคลาวด์) ให้ใช้โมเดลแบบ API:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**อย่าพยายามรัน local LLM บน Pi** — แม้แต่โมเดลเล็กก็ยังช้าเกินไป ให้ Claude/GPT ทำงานหนักแทน

---

## เริ่มอัตโนมัติเมื่อบูต

Onboarding จะตั้งค่านี้ให้ แต่หากต้องการตรวจสอบ:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## การแก้ปัญหา

### Out of Memory (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### ประสิทธิภาพช้า

- ใช้ USB SSD แทน SD card
- ปิด service ที่ไม่ได้ใช้: `sudo systemctl disable cups bluetooth avahi-daemon`
- ตรวจสอบ CPU throttling: `vcgencmd get_throttled` (ควรคืนค่า `0x0`)

### Service เริ่มทำงานไม่ได้

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### ปัญหาไบนารีบน ARM

หาก skill ล้มเหลวพร้อมข้อความ "exec format error":

1. ตรวจสอบว่าไบนารีมี build สำหรับ ARM64 หรือไม่
2. ลอง build จากซอร์ส
3. หรือใช้ Docker container ที่รองรับ ARM

### WiFi หลุด

สำหรับ Pi แบบ headless ที่ใช้ WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## เปรียบเทียบค่าใช้จ่าย

| การตั้งค่า         | ค่าใช้จ่ายครั้งเดียว | ค่าใช้จ่ายรายเดือน | หมายเหตุ                    |
| ------------------ | ------------------- | ------------------ | --------------------------- |
| **Pi 4 (2GB)**     | ~$45                | $0                 | + ค่าไฟ (~$5/ปี)            |
| **Pi 4 (4GB)**     | ~$55                | $0                 | แนะนำ                       |
| **Pi 5 (4GB)**     | ~$60                | $0                 | ประสิทธิภาพดีที่สุด         |
| **Pi 5 (8GB)**     | ~$80                | $0                 | เกินความจำเป็นแต่รองรับอนาคต |
| DigitalOcean       | $0                  | $6/เดือน           | $72/ปี                      |
| Hetzner            | $0                  | €3.79/เดือน        | ~$50/ปี                     |

**จุดคุ้มทุน:** Pi จะคืนทุนในเวลาประมาณ 6-12 เดือนเมื่อเทียบกับ cloud VPS

---

## ที่เกี่ยวข้อง

- [คู่มือ Linux](/th/platforms/linux) — การตั้งค่า Linux ทั่วไป
- [คู่มือ DigitalOcean](/th/install/digitalocean) — ทางเลือกแบบคลาวด์
- [คู่มือ Hetzner](/th/install/hetzner) — การตั้งค่า Docker
- [Tailscale](/th/gateway/tailscale) — การเข้าถึงระยะไกล
- [Nodes](/th/nodes) — จับคู่แล็ปท็อป/โทรศัพท์ของคุณกับ Pi gateway
