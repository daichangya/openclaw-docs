---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24/7 บน Cloud VPS (ไม่ใช่บนแล็ปท็อปของคุณ)
    - คุณต้องการ Gateway แบบ production-grade ที่ทำงานตลอดเวลาบน VPS ของคุณเอง
    - คุณต้องการควบคุมการเก็บข้อมูลแบบถาวร ไบนารี และพฤติกรรมการรีสตาร์ตได้อย่างเต็มที่
    - คุณกำลังรัน OpenClaw ใน Docker บน Hetzner หรือผู้ให้บริการลักษณะใกล้เคียงกัน
summary: รัน OpenClaw Gateway ตลอด 24/7 บน Hetzner VPS ราคาประหยัด (Docker) พร้อมสถานะแบบคงทนและไบนารีที่รวมมาในอิมเมจแล้ว
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T09:17:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw บน Hetzner (Docker, คู่มือ VPS สำหรับ Production)

## เป้าหมาย

รัน OpenClaw Gateway แบบคงอยู่ถาวรบน Hetzner VPS โดยใช้ Docker พร้อมสถานะที่คงทน ไบนารีที่ฝังมาในอิมเมจ และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

หากคุณต้องการ “OpenClaw 24/7 ในราคาประมาณ $5” นี่คือการตั้งค่าที่เชื่อถือได้และเรียบง่ายที่สุด
ราคา Hetzner เปลี่ยนแปลงได้; ให้เลือก VPS Debian/Ubuntu ที่เล็กที่สุดก่อน แล้วค่อยขยายหากเจอ OOM

หมายเหตุเกี่ยวกับโมเดลความปลอดภัย:

- เอเจนต์ที่ใช้ร่วมกันในบริษัทใช้งานได้เมื่อทุกคนอยู่ในขอบเขตความเชื่อถือเดียวกัน และรันไทม์นั้นใช้เพื่อธุรกิจเท่านั้น
- ควรรักษาการแยกอย่างเข้มงวด: VPS/รันไทม์เฉพาะ + บัญชีเฉพาะ; อย่าใช้โปรไฟล์ Apple/Google/เบราว์เซอร์/ตัวจัดการรหัสผ่านส่วนตัวบนโฮสต์นั้น
- หากผู้ใช้เป็นปฏิปักษ์ต่อกัน ให้แยกตาม gateway/host/OS user

ดู [Security](/th/gateway/security) และ [VPS hosting](/th/vps)

## เรากำลังทำอะไรอยู่ (แบบง่าย ๆ)?

- เช่า Linux server ขนาดเล็ก (Hetzner VPS)
- ติดตั้ง Docker (รันไทม์ของแอปแบบแยกส่วน)
- เริ่ม OpenClaw Gateway ใน Docker
- เก็บ `~/.openclaw` + `~/.openclaw/workspace` ไว้บนโฮสต์แบบถาวร (อยู่รอดหลังรีสตาร์ต/สร้างใหม่)
- เข้าถึง Control UI จากแล็ปท็อปของคุณผ่าน SSH tunnel

สถานะ `~/.openclaw` ที่ถูก mount นี้รวมถึง `openclaw.json`, ไฟล์
`agents/<agentId>/agent/auth-profiles.json` รายเอเจนต์ และ `.env`

สามารถเข้าถึง Gateway ได้ผ่าน:

- การ forward พอร์ตด้วย SSH จากแล็ปท็อปของคุณ
- การเปิดเผยพอร์ตโดยตรง หากคุณจัดการ firewall และ token ด้วยตัวเอง

คู่มือนี้สมมติว่าใช้ Ubuntu หรือ Debian บน Hetzner  
หากคุณใช้ Linux VPS ตัวอื่น ให้ปรับแพ็กเกจให้เหมาะสม
สำหรับ flow Docker ทั่วไป ดู [Docker](/th/install/docker)

---

## เส้นทางแบบเร็ว (สำหรับผู้ดูแลที่มีประสบการณ์)

1. Provision Hetzner VPS
2. ติดตั้ง Docker
3. clone OpenClaw repository
4. สร้างไดเรกทอรีโฮสต์สำหรับการเก็บข้อมูลถาวร
5. กำหนดค่า `.env` และ `docker-compose.yml`
6. ฝังไบนารีที่ต้องใช้ลงในอิมเมจ
7. `docker compose up -d`
8. ตรวจสอบการคงอยู่ของข้อมูลและการเข้าถึง Gateway

---

## สิ่งที่คุณต้องมี

- Hetzner VPS พร้อมสิทธิ์ root
- การเข้าถึงผ่าน SSH จากแล็ปท็อปของคุณ
- ความคุ้นเคยพื้นฐานกับ SSH + การคัดลอก/วาง
- เวลาประมาณ 20 นาที
- Docker และ Docker Compose
- ข้อมูลรับรองสำหรับ model auth
- ข้อมูลรับรอง provider แบบไม่บังคับ
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="Provision VPS">
    สร้าง Ubuntu หรือ Debian VPS ใน Hetzner

    เชื่อมต่อในฐานะ root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    คู่มือนี้สมมติว่า VPS มีสถานะแบบคงอยู่
    อย่าถือว่ามันเป็น infrastructure แบบใช้แล้วทิ้ง

  </Step>

  <Step title="ติดตั้ง Docker (บน VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    ตรวจสอบ:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="clone OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    คู่มือนี้สมมติว่าคุณจะ build image แบบกำหนดเองเพื่อรับประกันการคงอยู่ของไบนารี

  </Step>

  <Step title="สร้างไดเรกทอรีโฮสต์สำหรับการเก็บข้อมูลถาวร">
    Docker container เป็นแบบ ephemeral
    สถานะที่มีอายุยาวทั้งหมดต้องอยู่บนโฮสต์

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="กำหนดค่าตัวแปรแวดล้อม">
    สร้าง `.env` ที่รากของ repository

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    ปล่อย `OPENCLAW_GATEWAY_TOKEN` ว่างไว้ เว้นแต่คุณต้องการ
    จัดการมันผ่าน `.env` อย่างชัดเจน; OpenClaw จะเขียน token ของ gateway แบบสุ่มลงใน
    คอนฟิกเมื่อเริ่มทำงานครั้งแรก สร้างรหัสผ่านสำหรับ keyring แล้ววางลงใน
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **อย่า commit ไฟล์นี้**

    ไฟล์ `.env` นี้ใช้สำหรับ env ของ container/runtime เช่น `OPENCLAW_GATEWAY_TOKEN`
    ส่วน auth แบบ OAuth/API-key ของ provider ที่จัดเก็บไว้จะอยู่ใน
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ที่ถูก mount มา

  </Step>

  <Step title="คอนฟิก Docker Compose">
    สร้างหรืออัปเดต `docker-compose.yml`

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` มีไว้เพื่อความสะดวกในการ bootstrap เท่านั้น ไม่ใช่สิ่งทดแทนการกำหนดค่า gateway ที่เหมาะสม คุณยังคงต้องตั้งค่า auth (`gateway.auth.token` หรือรหัสผ่าน) และใช้ bind setting ที่ปลอดภัยสำหรับ deployment ของคุณ

  </Step>

  <Step title="ขั้นตอนรันไทม์ Docker VM แบบใช้ร่วมกัน">
    ใช้คู่มือรันไทม์ที่ใช้ร่วมกันสำหรับ flow ทั่วไปของโฮสต์ Docker:

    - [ฝังไบนารีที่ต้องใช้ลงในอิมเมจ](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build และ launch](/th/install/docker-vm-runtime#build-and-launch)
    - [อะไรถูกเก็บไว้ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="การเข้าถึงเฉพาะสำหรับ Hetzner">
    หลังจากขั้นตอน build และ launch แบบใช้ร่วมกันแล้ว ให้ทำ tunnel จากแล็ปท็อปของคุณ:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    เปิด:

    `http://127.0.0.1:18789/`

    วาง shared secret ที่กำหนดค่าไว้ คู่มือนี้ใช้ gateway token เป็น
    ค่าปริยาย; หากคุณเปลี่ยนไปใช้ password auth ให้ใช้รหัสผ่านนั้นแทน

  </Step>
</Steps>

แผนผังการคงอยู่ของข้อมูลแบบใช้ร่วมกันอยู่ที่ [Docker VM Runtime](/th/install/docker-vm-runtime#what-persists-where)

## Infrastructure as Code (Terraform)

สำหรับทีมที่ต้องการเวิร์กโฟลว์ infrastructure-as-code การตั้งค่า Terraform ที่ดูแลโดยชุมชนมีสิ่งต่อไปนี้ให้:

- คอนฟิก Terraform แบบโมดูล พร้อม remote state management
- การ provision อัตโนมัติผ่าน cloud-init
- สคริปต์ deployment (bootstrap, deploy, backup/restore)
- การ harden ด้านความปลอดภัย (firewall, UFW, การเข้าถึงแบบ SSH-only)
- การกำหนดค่า SSH tunnel สำหรับการเข้าถึง gateway

**Repository:**

- Infrastructure: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker config: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

แนวทางนี้ช่วยเสริมการตั้งค่า Docker ด้านบนด้วย deployment ที่ทำซ้ำได้, infrastructure ที่ควบคุมเวอร์ชัน และ disaster recovery แบบอัตโนมัติ

> **หมายเหตุ:** ดูแลโดยชุมชน สำหรับปัญหาหรือการร่วมพัฒนา โปรดดูจากลิงก์ repository ด้านบน

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการส่งข้อความ: [Channels](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้ทันสมัยอยู่เสมอ: [Updating](/th/install/updating)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Fly.io](/th/install/fly)
- [Docker](/th/install/docker)
- [VPS hosting](/th/vps)
