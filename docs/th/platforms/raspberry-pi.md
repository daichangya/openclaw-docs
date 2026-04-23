---
read_when:
    - การตั้งค่า OpenClaw บน Raspberry Pi
    - การรัน OpenClaw บนอุปกรณ์ ARM
    - การสร้าง AI ส่วนตัวแบบเปิดตลอดในราคาประหยัด
summary: OpenClaw บน Raspberry Pi (การตั้งค่าโฮสต์เองแบบประหยัด)
title: Raspberry Pi (แพลตฟอร์ม)
x-i18n:
    generated_at: "2026-04-23T05:45:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw บน Raspberry Pi

## เป้าหมาย

รัน OpenClaw Gateway แบบถาวรที่เปิดตลอดเวลาบน Raspberry Pi ด้วยต้นทุนครั้งเดียวประมาณ **~$35-80** (ไม่มีค่ารายเดือน)

เหมาะอย่างยิ่งสำหรับ:

- ผู้ช่วย AI ส่วนตัวแบบ 24/7
- ฮับสำหรับระบบอัตโนมัติในบ้าน
- บอต Telegram/WhatsApp แบบเปิดตลอดที่กินพลังงานต่ำ

## ข้อกำหนดด้านฮาร์ดแวร์

| รุ่น Pi          | RAM     | ใช้งานได้? | หมายเหตุ                           |
| ---------------- | ------- | ---------- | ---------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ ดีที่สุด | เร็วที่สุด แนะนำ                   |
| **Pi 4**         | 4GB     | ✅ ดี       | จุดสมดุลที่ดีสำหรับผู้ใช้ส่วนใหญ่  |
| **Pi 4**         | 2GB     | ✅ พอใช้    | ใช้งานได้ ควรเพิ่ม swap           |
| **Pi 4**         | 1GB     | ⚠️ คับแคบ   | เป็นไปได้ถ้าใช้ swap และ config ขั้นต่ำ |
| **Pi 3B+**       | 1GB     | ⚠️ ช้า      | ใช้งานได้แต่หน่วง                  |
| **Pi Zero 2 W**  | 512MB   | ❌          | ไม่แนะนำ                           |

**สเปกขั้นต่ำ:** RAM 1GB, 1 core, ดิสก์ 500MB  
**แนะนำ:** RAM 2GB+, OS 64-bit, การ์ด SD 16GB+ (หรือ USB SSD)

## สิ่งที่คุณต้องมี

- Raspberry Pi 4 หรือ 5 (แนะนำ 2GB+)
- การ์ด MicroSD (16GB+) หรือ USB SSD (ประสิทธิภาพดีกว่า)
- แหล่งจ่ายไฟ (แนะนำ PSU อย่างเป็นทางการของ Pi)
- การเชื่อมต่อเครือข่าย (Ethernet หรือ WiFi)
- เวลาประมาณ 30 นาที

## 1) แฟลชระบบปฏิบัติการ

ใช้ **Raspberry Pi OS Lite (64-bit)** — ไม่ต้องใช้เดสก์ท็อปสำหรับเซิร์ฟเวอร์แบบ headless

1. ดาวน์โหลด [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. เลือก OS: **Raspberry Pi OS Lite (64-bit)**
3. คลิกไอคอนเฟือง (⚙️) เพื่อกำหนดค่าล่วงหน้า:
   - ตั้ง hostname: `gateway-host`
   - เปิดใช้ SSH
   - ตั้งชื่อผู้ใช้/รหัสผ่าน
   - กำหนดค่า WiFi (หากไม่ได้ใช้ Ethernet)
4. แฟลชลงในการ์ด SD / ไดรฟ์ USB
5. ใส่และบูต Pi

## 2) เชื่อมต่อผ่าน SSH

```bash
ssh user@gateway-host
# หรือใช้ IP address
ssh user@192.168.x.x
```

## 3) การตั้งค่าระบบ

```bash
# อัปเดตระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้งแพ็กเกจสำคัญ
sudo apt install -y git curl build-essential

# ตั้งค่าเขตเวลา (สำคัญสำหรับ Cron/การเตือน)
sudo timedatectl set-timezone America/Chicago  # เปลี่ยนเป็นเขตเวลาของคุณ
```

## 4) ติดตั้ง Node.js 24 (ARM64)

```bash
# ติดตั้ง Node.js ผ่าน NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# ตรวจสอบ
node --version  # ควรแสดง v24.x.x
npm --version
```

## 5) เพิ่ม Swap (สำคัญสำหรับ 2GB หรือน้อยกว่า)

Swap ช่วยป้องกันการแครชจากหน่วยความจำไม่พอ:

```bash
# สร้างไฟล์ swap ขนาด 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# ทำให้ถาวร
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# ปรับให้เหมาะกับ RAM ต่ำ (ลด swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) ติดตั้ง OpenClaw

### ตัวเลือก A: การติดตั้งมาตรฐาน (แนะนำ)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### ตัวเลือก B: การติดตั้งแบบแก้ไขเล่นได้ (สำหรับการทดลอง)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

การติดตั้งแบบแก้ไขเล่นได้ทำให้คุณเข้าถึงล็อกและโค้ดได้โดยตรง — มีประโยชน์สำหรับการดีบักปัญหาเฉพาะ ARM

## 7) รัน Onboarding

```bash
openclaw onboard --install-daemon
```

ทำตามวิซาร์ด:

1. **Gateway mode:** Local
2. **Auth:** แนะนำ API keys (OAuth อาจจุกจิกบน Pi แบบ headless)
3. **Channels:** Telegram เริ่มต้นได้ง่ายที่สุด
4. **Daemon:** Yes (systemd)

## 8) ตรวจสอบการติดตั้ง

```bash
# ตรวจสอบสถานะ
openclaw status

# ตรวจสอบ service (การติดตั้งมาตรฐาน = systemd user unit)
systemctl --user status openclaw-gateway.service

# ดูล็อก
journalctl --user -u openclaw-gateway.service -f
```

## 9) เข้าถึงแดชบอร์ด OpenClaw

แทนที่ `user@gateway-host` ด้วยชื่อผู้ใช้ของ Pi และ hostname หรือ IP address ของคุณ

บนคอมพิวเตอร์ของคุณ ให้สั่ง Pi พิมพ์ URL ของแดชบอร์ดใหม่:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

คำสั่งนี้จะพิมพ์ `Dashboard URL:` ออกมา ขึ้นอยู่กับว่ากำหนดค่า `gateway.auth.token`
ไว้อย่างไร URL อาจเป็นลิงก์ `http://127.0.0.1:18789/` ธรรมดา หรือ
ลิงก์ที่มี `#token=...` รวมอยู่ด้วย

ในอีกเทอร์มินัลหนึ่งบนคอมพิวเตอร์ของคุณ ให้สร้าง SSH tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

จากนั้นเปิด Dashboard URL ที่พิมพ์ออกมาในเบราว์เซอร์บนเครื่องของคุณ

หาก UI ขอ shared-secret auth ให้วาง token หรือรหัสผ่านที่กำหนดไว้
ลงในการตั้งค่า Control UI สำหรับ token auth ให้ใช้ `gateway.auth.token` (หรือ
`OPENCLAW_GATEWAY_TOKEN`)

สำหรับการเข้าถึงระยะไกลแบบเปิดตลอด ดู [Tailscale](/th/gateway/tailscale)

---

## การปรับแต่งประสิทธิภาพ

### ใช้ USB SSD (ดีขึ้นมาก)

การ์ด SD ช้าและสึกหรอได้ง่าย USB SSD ช่วยเพิ่มประสิทธิภาพอย่างมาก:

```bash
# ตรวจสอบว่าบูตจาก USB หรือไม่
lsblk
```

ดู [คู่มือบูต Pi จาก USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) สำหรับการตั้งค่า

### เร่งการเริ่ม CLI (module compile cache)

บนโฮสต์ Pi ที่กำลังประมวลผลต่ำ ให้เปิดใช้ module compile cache ของ Node เพื่อให้การรัน CLI ซ้ำเร็วขึ้น:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

หมายเหตุ:

- `NODE_COMPILE_CACHE` ช่วยให้การรันครั้งถัดไป (`status`, `health`, `--help`) เร็วขึ้น
- `/var/tmp` อยู่ข้ามการรีบูตได้ดีกว่า `/tmp`
- `OPENCLAW_NO_RESPAWN=1` ช่วยหลีกเลี่ยงต้นทุนเริ่มต้นเพิ่มเติมจากการ self-respawn ของ CLI
- การรันครั้งแรกจะวอร์ม cache; การรันครั้งหลังจะได้ประโยชน์มากที่สุด

### การปรับแต่งการเริ่มต้นของ systemd (ไม่บังคับ)

หาก Pi เครื่องนี้ใช้รัน OpenClaw เป็นหลัก ให้เพิ่ม service drop-in เพื่อลดความแกว่งของการรีสตาร์ต
และทำให้สภาพแวดล้อมเริ่มต้นคงที่:

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

จากนั้นนำไปใช้:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

หากเป็นไปได้ ให้เก็บ state/cache ของ OpenClaw ไว้บนที่เก็บข้อมูลที่รองรับ SSD เพื่อหลีกเลี่ยง
คอขวดด้าน random-I/O ของการ์ด SD ระหว่าง cold start

หากนี่คือ Pi แบบ headless ให้เปิด lingering ครั้งหนึ่งเพื่อให้ user service อยู่รอด
หลัง logout:

```bash
sudo loginctl enable-linger "$(whoami)"
```

นโยบาย `Restart=` ช่วยการกู้คืนแบบอัตโนมัติอย่างไร:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)

### ลดการใช้หน่วยความจำ

```bash
# ปิดการจัดสรรหน่วยความจำให้ GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# ปิด Bluetooth หากไม่ต้องใช้
sudo systemctl disable bluetooth
```

### ตรวจสอบทรัพยากร

```bash
# ตรวจสอบหน่วยความจำ
free -h

# ตรวจสอบอุณหภูมิ CPU
vcgencmd measure_temp

# ดูแบบสด
htop
```

---

## หมายเหตุเฉพาะ ARM

### ความเข้ากันได้ของไบนารี

ฟีเจอร์ส่วนใหญ่ของ OpenClaw ทำงานบน ARM64 ได้ แต่ไบนารีภายนอกบางตัวอาจต้องใช้บิลด์ ARM:

| Tool               | สถานะ ARM64 | หมายเหตุ                             |
| ------------------ | ----------- | ------------------------------------ |
| Node.js            | ✅          | ทำงานได้ดีมาก                        |
| WhatsApp (Baileys) | ✅          | เป็น JS ล้วน ไม่มีปัญหา              |
| Telegram           | ✅          | เป็น JS ล้วน ไม่มีปัญหา              |
| gog (Gmail CLI)    | ⚠️          | ตรวจสอบว่ามีรีลีส ARM หรือไม่        |
| Chromium (browser) | ✅          | `sudo apt install chromium-browser` |

หาก Skills ตัวใดล้มเหลว ให้ตรวจสอบว่าไบนารีนั้นมีบิลด์ ARM หรือไม่ เครื่องมือ Go/Rust หลายตัวมี; บางตัวไม่มี

### 32-bit เทียบกับ 64-bit

**ใช้ OS แบบ 64-bit เสมอ** Node.js และเครื่องมือสมัยใหม่จำนวนมากต้องการสิ่งนี้ ตรวจสอบด้วย:

```bash
uname -m
# ควรแสดง: aarch64 (64-bit) ไม่ใช่ armv7l (32-bit)
```

---

## การตั้งค่าโมเดลที่แนะนำ

เนื่องจาก Pi ทำหน้าที่เป็นเพียง Gateway (โมเดลทำงานบนคลาวด์) ให้ใช้โมเดลที่อิง API:

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

**อย่าพยายามรัน local LLM บน Pi** — แม้แต่โมเดลเล็กก็ยังช้าเกินไป ให้ Claude/GPT เป็นตัวทำงานหนักแทน

---

## เริ่มอัตโนมัติเมื่อบูต

Onboarding จะตั้งค่านี้ให้ แต่หากต้องการตรวจสอบ:

```bash
# ตรวจสอบว่า service ถูกเปิดใช้งานแล้ว
systemctl --user is-enabled openclaw-gateway.service

# เปิดใช้งานหากยังไม่เปิด
systemctl --user enable openclaw-gateway.service

# เริ่มทำงานเมื่อบูต
systemctl --user start openclaw-gateway.service
```

---

## การแก้ไขปัญหา

### หน่วยความจำไม่พอ (OOM)

```bash
# ตรวจสอบหน่วยความจำ
free -h

# เพิ่ม swap (ดูขั้นตอนที่ 5)
# หรือลดจำนวน service ที่รันบน Pi
```

### ประสิทธิภาพช้า

- ใช้ USB SSD แทนการ์ด SD
- ปิด service ที่ไม่ได้ใช้: `sudo systemctl disable cups bluetooth avahi-daemon`
- ตรวจสอบ CPU throttling: `vcgencmd get_throttled` (ควรคืนค่า `0x0`)

### Service ไม่ยอมเริ่มทำงาน

```bash
# ตรวจสอบล็อก
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# วิธีแก้ที่พบบ่อย: build ใหม่
cd ~/openclaw  # หากใช้การติดตั้งแบบแก้ไขเล่นได้
npm run build
systemctl --user restart openclaw-gateway.service
```

### ปัญหาไบนารี ARM

หาก Skills ตัวใดล้มเหลวพร้อมข้อความ "exec format error":

1. ตรวจสอบว่าไบนารีมีบิลด์ ARM64 หรือไม่
2. ลอง build จาก source
3. หรือใช้ Docker container ที่รองรับ ARM

### WiFi หลุด

สำหรับ Pi แบบ headless ที่ใช้ WiFi:

```bash
# ปิด WiFi power management
sudo iwconfig wlan0 power off

# ทำให้ถาวร
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## เปรียบเทียบค่าใช้จ่าย

| การตั้งค่า        | ค่าใช้จ่ายครั้งเดียว | ค่าใช้จ่ายรายเดือน | หมายเหตุ                     |
| ----------------- | -------------------- | ------------------ | ---------------------------- |
| **Pi 4 (2GB)**    | ~$45                 | $0                 | + ค่าไฟ (~$5/ปี)             |
| **Pi 4 (4GB)**    | ~$55                 | $0                 | แนะนำ                        |
| **Pi 5 (4GB)**    | ~$60                 | $0                 | ประสิทธิภาพดีที่สุด          |
| **Pi 5 (8GB)**    | ~$80                 | $0                 | เกินความจำเป็นแต่พร้อมสำหรับอนาคต |
| DigitalOcean      | $0                   | $6/เดือน           | $72/ปี                       |
| Hetzner           | $0                   | €3.79/เดือน        | ~$50/ปี                      |

**จุดคุ้มทุน:** Pi คืนทุนตัวเองได้ในประมาณ 6-12 เดือนเมื่อเทียบกับ cloud VPS

---

## ดูเพิ่มเติม

- [คู่มือ Linux](/th/platforms/linux) — การตั้งค่า Linux ทั่วไป
- [คู่มือ DigitalOcean](/th/install/digitalocean) — ทางเลือกบนคลาวด์
- [คู่มือ Hetzner](/th/install/hetzner) — การตั้งค่าด้วย Docker
- [Tailscale](/th/gateway/tailscale) — การเข้าถึงระยะไกล
- [Nodes](/th/nodes) — จับคู่แล็ปท็อป/โทรศัพท์ของคุณกับ Pi gateway
