---
read_when:
    - การตั้งค่า OpenClaw บน DigitalOcean
    - กำลังมองหา VPS แบบเสียเงินที่เรียบง่ายสำหรับ OpenClaw
summary: โฮสต์ OpenClaw บน Droplet ของ DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-23T05:39:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b161db8ec643d8313938a2453ce6242fc1ee8ea1fd2069916276f1aadeb71f1
    source_path: install/digitalocean.md
    workflow: 15
---

# DigitalOcean

รัน OpenClaw Gateway แบบถาวรบน Droplet ของ DigitalOcean

## ข้อกำหนดเบื้องต้น

- บัญชี DigitalOcean ([สมัคร](https://cloud.digitalocean.com/registrations/new))
- คู่คีย์ SSH (หรือพร้อมจะใช้การยืนยันตัวตนด้วยรหัสผ่าน)
- เวลาประมาณ 20 นาที

## การตั้งค่า

<Steps>
  <Step title="สร้าง Droplet">
    <Warning>
    ใช้ base image ที่สะอาด (Ubuntu 24.04 LTS) หลีกเลี่ยง Marketplace 1-click image จากบุคคลที่สาม เว้นแต่คุณได้ตรวจสอบ startup script และค่าเริ่มต้นของไฟร์วอลล์แล้ว
    </Warning>

    1. ล็อกอินเข้า [DigitalOcean](https://cloud.digitalocean.com/)
    2. คลิก **Create > Droplets**
    3. เลือก:
       - **Region:** ใกล้คุณที่สุด
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH key (แนะนำ) หรือรหัสผ่าน
    4. คลิก **Create Droplet** และจด IP address ไว้

  </Step>

  <Step title="เชื่อมต่อและติดตั้ง">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # ติดตั้ง Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # ติดตั้ง OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดจะพาคุณผ่านการยืนยันตัวตนของโมเดล การตั้งค่าช่องทาง การสร้าง gateway token และการติดตั้ง daemon (systemd)

  </Step>

  <Step title="เพิ่ม swap (แนะนำสำหรับ Droplet 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="ตรวจสอบ gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="เข้าถึง Control UI">
    โดยค่าเริ่มต้น gateway จะ bind กับ loopback เลือกหนึ่งในตัวเลือกเหล่านี้

    **ตัวเลือก A: SSH tunnel (ง่ายที่สุด)**

    ```bash
    # จากเครื่อง local ของคุณ
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    จากนั้นเปิด `http://localhost:18789`

    **ตัวเลือก B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    จากนั้นเปิด `https://<magicdns>/` จากอุปกรณ์ใดก็ได้บน tailnet ของคุณ

    **ตัวเลือก C: Tailnet bind (ไม่ใช้ Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    จากนั้นเปิด `http://<tailscale-ip>:18789` (ต้องใช้ token)

  </Step>
</Steps>

## การแก้ไขปัญหา

**Gateway ไม่ยอมเริ่มทำงาน** -- รัน `openclaw doctor --non-interactive` และตรวจสอบล็อกด้วย `journalctl --user -u openclaw-gateway.service -n 50`

**พอร์ตถูกใช้งานอยู่แล้ว** -- รัน `lsof -i :18789` เพื่อค้นหาโปรเซส แล้วหยุดมัน

**หน่วยความจำไม่พอ** -- ตรวจสอบว่า swap ทำงานอยู่ด้วย `free -h` หากยังเจอ OOM ให้ใช้โมเดลที่อิง API (Claude, GPT) แทนโมเดล local หรืออัปเกรดเป็น Droplet 2 GB

## ขั้นตอนถัดไป

- [Channels](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่น ๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือก config ทั้งหมด
- [Updating](/th/install/updating) -- ทำให้ OpenClaw ทันสมัยอยู่เสมอ
