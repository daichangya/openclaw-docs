---
read_when:
    - การตั้งค่า OpenClaw บน Raspberry Pi
    - การรัน OpenClaw บนอุปกรณ์ ARM
    - การสร้าง AI ส่วนตัวแบบเปิดตลอดเวลาด้วยต้นทุนต่ำ
summary: โฮสต์ OpenClaw บน Raspberry Pi สำหรับการโฮสต์เองแบบเปิดตลอดเวลา
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-24T09:19:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

รัน OpenClaw Gateway แบบ persistent และเปิดตลอดเวลาบน Raspberry Pi เนื่องจาก Pi ทำหน้าที่เป็นเพียง gateway (โมเดลรันบนคลาวด์ผ่าน API) แม้แต่ Pi สเปกไม่สูงมากก็รองรับภาระงานนี้ได้ดี

## ข้อกำหนดเบื้องต้น

- Raspberry Pi 4 หรือ 5 พร้อม RAM 2 GB ขึ้นไป (แนะนำ 4 GB)
- MicroSD card (16 GB ขึ้นไป) หรือ USB SSD (ให้ประสิทธิภาพดีกว่า)
- อะแดปเตอร์ไฟของ Pi แบบทางการ
- การเชื่อมต่อเครือข่าย (Ethernet หรือ WiFi)
- Raspberry Pi OS แบบ 64-bit (จำเป็น -- ห้ามใช้ 32-bit)
- เวลาประมาณ 30 นาที

## การตั้งค่า

<Steps>
  <Step title="แฟลชระบบปฏิบัติการ">
    ใช้ **Raspberry Pi OS Lite (64-bit)** -- ไม่ต้องมีเดสก์ท็อปสำหรับเซิร์ฟเวอร์แบบ headless

    1. ดาวน์โหลด [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
    2. เลือก OS: **Raspberry Pi OS Lite (64-bit)**
    3. ในกล่องการตั้งค่า ให้กำหนดค่าล่วงหน้า:
       - Hostname: `gateway-host`
       - เปิดใช้ SSH
       - ตั้งชื่อผู้ใช้และรหัสผ่าน
       - กำหนดค่า WiFi (หากไม่ได้ใช้ Ethernet)
    4. แฟลชลง SD card หรือ USB drive ของคุณ ใส่เข้าเครื่อง แล้วบูต Pi

  </Step>

  <Step title="เชื่อมต่อผ่าน SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="อัปเดตระบบ">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="ติดตั้ง Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="เพิ่ม swap (สำคัญสำหรับ 2 GB หรือน้อยกว่า)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="ติดตั้ง OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="รันการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --install-daemon
    ```

    ทำตามตัวช่วยแบบวิซาร์ด แนะนำให้ใช้ API keys แทน OAuth สำหรับอุปกรณ์แบบ headless Telegram เป็นช่องทางที่เริ่มต้นได้ง่ายที่สุด

  </Step>

  <Step title="ตรวจสอบ">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="เข้าถึง Control UI">
    บนคอมพิวเตอร์ของคุณ ให้รับ URL ของแดชบอร์ดจาก Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    จากนั้นสร้าง SSH tunnel ในอีกเทอร์มินัลหนึ่ง:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    เปิด URL ที่พิมพ์ออกมาในเบราว์เซอร์บนเครื่องของคุณ สำหรับการเข้าถึงระยะไกลแบบเปิดตลอดเวลา โปรดดู [การผสานรวม Tailscale](/th/gateway/tailscale)

  </Step>
</Steps>

## เคล็ดลับด้านประสิทธิภาพ

**ใช้ USB SSD** -- SD cards ช้าและสึกหรอง่าย USB SSD ช่วยเพิ่มประสิทธิภาพได้อย่างมาก ดู [คู่มือบูตผ่าน USB ของ Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)

**เปิดใช้ module compile cache** -- ช่วยให้การเรียกใช้ CLI ซ้ำ ๆ เร็วขึ้นบนโฮสต์ Pi ที่กำลังประมวลผลต่ำ:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**ลดการใช้หน่วยความจำ** -- สำหรับการตั้งค่าแบบ headless ให้คืนหน่วยความจำ GPU และปิดบริการที่ไม่ได้ใช้:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## การแก้ไขปัญหา

**หน่วยความจำไม่พอ** -- ตรวจสอบว่า swap ทำงานอยู่ด้วย `free -h` ปิดบริการที่ไม่ได้ใช้ (`sudo systemctl disable cups bluetooth avahi-daemon`) ใช้เฉพาะโมเดลที่อิง API เท่านั้น

**ประสิทธิภาพช้า** -- ใช้ USB SSD แทน SD card ตรวจสอบ CPU throttling ด้วย `vcgencmd get_throttled` (ควรคืนค่า `0x0`)

**บริการเริ่มไม่ขึ้น** -- ตรวจสอบ logs ด้วย `journalctl --user -u openclaw-gateway.service --no-pager -n 100` และรัน `openclaw doctor --non-interactive` หากนี่คือ Pi แบบ headless ให้ตรวจสอบด้วยว่าเปิดใช้ lingering แล้ว: `sudo loginctl enable-linger "$(whoami)"`

**ปัญหาไบนารี ARM** -- หาก Skill ล้มเหลวพร้อม "exec format error" ให้ตรวจสอบว่าไบนารีนั้นมี build สำหรับ ARM64 หรือไม่ ตรวจสอบสถาปัตยกรรมด้วย `uname -m` (ควรแสดง `aarch64`)

**WiFi หลุด** -- ปิด WiFi power management: `sudo iwconfig wlan0 power off`

## ขั้นตอนถัดไป

- [Channels](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่น ๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือก config ทั้งหมด
- [การอัปเดต](/th/install/updating) -- ดูแลให้ OpenClaw ทันสมัยอยู่เสมอ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Linux server](/th/vps)
- [Platforms](/th/platforms)
