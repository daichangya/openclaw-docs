---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24/7 บน cloud VPS (ไม่ใช่แล็ปท็อปของคุณ)
    - คุณต้องการ Gateway ที่พร้อมใช้งานระดับ production และทำงานตลอดเวลาบน VPS ของคุณเอง
    - คุณต้องการควบคุม persistence, ไบนารี และพฤติกรรมการรีสตาร์ตได้เต็มรูปแบบ
    - คุณกำลังรัน OpenClaw ใน Docker บน Hetzner หรือผู้ให้บริการลักษณะเดียวกัน
summary: รัน OpenClaw Gateway ตลอด 24/7 บน VPS ราคาประหยัดของ Hetzner (Docker) พร้อมสถานะถาวรและไบนารีที่รวมมาในอิมเมจแล้ว
title: Hetzner
x-i18n:
    generated_at: "2026-04-23T05:39:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw บน Hetzner (Docker, คู่มือ VPS ระดับ Production)

## เป้าหมาย

รัน OpenClaw Gateway แบบคงอยู่ถาวรบน Hetzner VPS โดยใช้ Docker พร้อมสถานะถาวร, ไบนารีที่รวมมาในอิมเมจแล้ว และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

หากคุณต้องการ “OpenClaw 24/7 ในราคาประมาณ ~$5” นี่คือการตั้งค่าที่เรียบง่ายและเชื่อถือได้ที่สุด
ราคา Hetzner เปลี่ยนแปลงได้; ให้เลือก Debian/Ubuntu VPS ขนาดเล็กที่สุด แล้วค่อยขยายหากเจอ OOM

หมายเหตุด้านโมเดลความปลอดภัย:

- เอเจนต์ที่ใช้ร่วมกันในบริษัทใช้ได้เมื่อทุกคนอยู่ในขอบเขตความเชื่อถือเดียวกันและรันไทม์ใช้เพื่อธุรกิจเท่านั้น
- ควรแยกอย่างเข้มงวด: VPS/รันไทม์ เฉพาะ + บัญชีเฉพาะ; ไม่มีโปรไฟล์ Apple/Google/เบราว์เซอร์/password-manager ส่วนตัวบนโฮสต์นั้น
- หากผู้ใช้เป็นปฏิปักษ์ต่อกัน ให้แยกตาม gateway/host/ผู้ใช้ระบบปฏิบัติการ

ดู [Security](/th/gateway/security) และ [VPS hosting](/th/vps)

## เรากำลังทำอะไรอยู่ (แบบง่ายๆ)?

- เช่า Linux server ขนาดเล็ก (Hetzner VPS)
- ติดตั้ง Docker (รันไทม์แอปแบบแยก)
- เริ่ม OpenClaw Gateway ใน Docker
- เก็บ `~/.openclaw` + `~/.openclaw/workspace` แบบถาวรบนโฮสต์ (อยู่รอดผ่านการรีสตาร์ต/รีบิลด์)
- เข้าถึง Control UI จากแล็ปท็อปของคุณผ่าน SSH tunnel

สถานะ `~/.openclaw` ที่ถูก mount นั้นรวมถึง `openclaw.json`, ไฟล์
`agents/<agentId>/agent/auth-profiles.json` ต่อเอเจนต์ และ `.env`

สามารถเข้าถึง Gateway ได้ผ่าน:

- การส่งต่อพอร์ต SSH จากแล็ปท็อปของคุณ
- การเปิดเผยพอร์ตโดยตรง หากคุณจัดการ firewall และ tokens เอง

คู่มือนี้สมมติว่าคุณใช้ Ubuntu หรือ Debian บน Hetzner  
หากคุณใช้ Linux VPS อื่น ให้จับคู่แพ็กเกจตามนั้น
สำหรับโฟลว์ Docker แบบทั่วไป ดู [Docker](/th/install/docker)

---

## เส้นทางด่วน (สำหรับผู้ปฏิบัติการที่มีประสบการณ์)

1. จัดเตรียม Hetzner VPS
2. ติดตั้ง Docker
3. clone OpenClaw repository
4. สร้างไดเรกทอรีบนโฮสต์สำหรับ persistence
5. กำหนดค่า `.env` และ `docker-compose.yml`
6. รวมไบนารีที่จำเป็นไว้ในอิมเมจ
7. `docker compose up -d`
8. ตรวจสอบ persistence และการเข้าถึง Gateway

---

## สิ่งที่คุณต้องมี

- Hetzner VPS พร้อมสิทธิ์ root
- การเข้าถึง SSH จากแล็ปท็อปของคุณ
- ความคุ้นเคยพื้นฐานกับ SSH + การคัดลอก/วาง
- เวลาประมาณ 20 นาที
- Docker และ Docker Compose
- ข้อมูลรับรอง auth ของโมเดล
- ข้อมูลรับรองของผู้ให้บริการเพิ่มเติม (ไม่บังคับ)
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="จัดเตรียม VPS">
    สร้าง Ubuntu หรือ Debian VPS ใน Hetzner

    เชื่อมต่อในฐานะ root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    คู่มือนี้สมมติว่า VPS เป็นแบบ stateful
    อย่าปฏิบัติต่อมันเหมือนโครงสร้างพื้นฐานแบบทิ้งได้

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

    คู่มือนี้สมมติว่าคุณจะ build อิมเมจแบบกำหนดเองเพื่อรับประกันว่าไบนารีจะคงอยู่ถาวร

  </Step>

  <Step title="สร้างไดเรกทอรีบนโฮสต์สำหรับ persistence">
    Docker containers เป็นแบบ ephemeral
    สถานะที่อยู่ยาวทั้งหมดต้องอยู่บนโฮสต์

    ```bash
    mkdir -p /root/.openclaw/workspace

    # ตั้ง ownership ให้เป็นผู้ใช้ใน container (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="กำหนดค่าตัวแปรสภาพแวดล้อม">
    สร้าง `.env` ในรากของ repository

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

    ปล่อย `OPENCLAW_GATEWAY_TOKEN` ว่างไว้ เว้นแต่คุณจะตั้งใจ
    จัดการมันผ่าน `.env` อย่างชัดเจน; OpenClaw จะเขียน gateway token แบบสุ่มลงใน
    config ตอนเริ่มครั้งแรก สร้างรหัสผ่าน keyring แล้ววางลงใน
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **อย่า commit ไฟล์นี้**

    ไฟล์ `.env` นี้มีไว้สำหรับ env ของ container/runtime เช่น `OPENCLAW_GATEWAY_TOKEN`
    ส่วน auth ที่เป็น OAuth/API-key ของผู้ให้บริการจะถูกเก็บใน
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ที่ถูก mount

  </Step>

  <Step title="การกำหนดค่า Docker Compose">
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
          # คำแนะนำ: ให้ Gateway เป็น loopback-only บน VPS; เข้าถึงผ่าน SSH tunnel
          # หากต้องการเปิดเผยสู่สาธารณะ ให้เอา prefix `127.0.0.1:` ออก และจัดการ firewall ตามนั้น
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

    `--allow-unconfigured` มีไว้เพื่อความสะดวกในช่วง bootstrap เท่านั้น ไม่ใช่ตัวแทนของการกำหนดค่า gateway ที่เหมาะสม คุณยังควรตั้งค่า auth (`gateway.auth.token` หรือ password) และใช้การตั้งค่า bind ที่ปลอดภัยสำหรับการปรับใช้ของคุณ

  </Step>

  <Step title="ขั้นตอนรันไทม์ Docker VM แบบใช้ร่วมกัน">
    ใช้คู่มือรันไทม์แบบใช้ร่วมกันสำหรับโฟลว์ Docker host ทั่วไป:

    - [รวมไบนารีที่จำเป็นไว้ในอิมเมจ](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build และเปิดใช้งาน](/th/install/docker-vm-runtime#build-and-launch)
    - [อะไรอยู่ถาวรที่ไหน](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="การเข้าถึงเฉพาะของ Hetzner">
    หลังจากขั้นตอน build และ launch แบบใช้ร่วมกันแล้ว ให้ทำ tunnel จากแล็ปท็อปของคุณ:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    เปิด:

    `http://127.0.0.1:18789/`

    วาง shared secret ที่กำหนดไว้ คู่มือนี้ใช้ gateway token เป็นค่าเริ่มต้น
    หากคุณสลับไปใช้ password auth ให้ใช้รหัสผ่านนั้นแทน

  </Step>
</Steps>

แผนผัง persistence แบบใช้ร่วมกันอยู่ที่ [Docker VM Runtime](/th/install/docker-vm-runtime#what-persists-where)

## Infrastructure as Code (Terraform)

สำหรับทีมที่ชอบเวิร์กโฟลว์ infrastructure-as-code มีชุด Terraform ที่ดูแลโดยชุมชนซึ่งให้:

- การกำหนดค่า Terraform แบบโมดูลพร้อมการจัดการ remote state
- การจัดเตรียมอัตโนมัติผ่าน cloud-init
- สคริปต์การปรับใช้ (bootstrap, deploy, backup/restore)
- การเสริมความปลอดภัย (firewall, UFW, การเข้าถึงผ่าน SSH เท่านั้น)
- การกำหนดค่า SSH tunnel สำหรับการเข้าถึง gateway

**Repositories:**

- Infrastructure: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker config: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

แนวทางนี้ช่วยเสริมการตั้งค่า Docker ด้านบนด้วยการปรับใช้ที่ทำซ้ำได้ โครงสร้างพื้นฐานที่ควบคุมเวอร์ชันได้ และการกู้คืนจากภัยพิบัติแบบอัตโนมัติ

> **หมายเหตุ:** ดูแลโดยชุมชน สำหรับปัญหาหรือการมีส่วนร่วม ดูที่ลิงก์ repository ด้านบน

## ขั้นตอนถัดไป

- ตั้งค่า messaging channels: [Channels](/th/channels)
- กำหนดค่า Gateway: [Gateway configuration](/th/gateway/configuration)
- อัปเดต OpenClaw ให้ทันสมัย: [Updating](/th/install/updating)
