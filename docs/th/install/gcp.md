---
read_when:
    - คุณต้องการให้ OpenClaw รันตลอด 24/7 บน GCP
    - คุณต้องการ Gateway แบบ always-on ระดับ production บน VM ของคุณเอง
    - คุณต้องการการควบคุมเต็มรูปแบบเหนือการคงอยู่ ไบนารี และพฤติกรรมการรีสตาร์ต
summary: รัน OpenClaw Gateway ตลอด 24/7 บน GCP Compute Engine VM (Docker) พร้อมสถานะที่คงอยู่ถาวร
title: GCP
x-i18n:
    generated_at: "2026-04-24T09:17:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw บน GCP Compute Engine (Docker, คู่มือ Production VPS)

## เป้าหมาย

รัน OpenClaw Gateway แบบคงอยู่บน GCP Compute Engine VM โดยใช้ Docker พร้อมสถานะที่คงอยู่ถาวร ไบนารีที่ฝังมากับ image และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

หากคุณต้องการ “OpenClaw 24/7 ในราคาประมาณ ~$5-12/เดือน” นี่คือการตั้งค่าที่เชื่อถือได้บน Google Cloud
ราคาแตกต่างกันไปตาม machine type และ region; เลือก VM ที่เล็กที่สุดที่รองรับ workload ของคุณและขยายเพิ่มหากเจอ OOM

## เรากำลังทำอะไรอยู่ (แบบง่าย ๆ)?

- สร้างโปรเจกต์ GCP และเปิดใช้งาน billing
- สร้าง Compute Engine VM
- ติดตั้ง Docker (runtime ของแอปแบบแยก)
- เริ่ม OpenClaw Gateway ใน Docker
- คง `~/.openclaw` + `~/.openclaw/workspace` ไว้บนโฮสต์ (รอดจากการรีสตาร์ต/rebuild)
- เข้าถึง Control UI จากแล็ปท็อปของคุณผ่าน SSH tunnel

สถานะ `~/.openclaw` ที่ถูก mount นั้นรวม `openclaw.json`, ไฟล์ต่อเอเจนต์
`agents/<agentId>/agent/auth-profiles.json` และ `.env`

สามารถเข้าถึง Gateway ได้ผ่าน:

- SSH port forwarding จากแล็ปท็อปของคุณ
- การเปิดพอร์ตโดยตรง หากคุณจัดการ firewall และ token เอง

คู่มือนี้ใช้ Debian บน GCP Compute Engine
Ubuntu ก็ใช้ได้เช่นกัน; ให้แมปแพ็กเกจตามความเหมาะสม
สำหรับโฟลว์ Docker แบบทั่วไป ดู [Docker](/th/install/docker)

---

## เส้นทางด่วน (สำหรับผู้ปฏิบัติการที่มีประสบการณ์)

1. สร้างโปรเจกต์ GCP + เปิดใช้ Compute Engine API
2. สร้าง Compute Engine VM (e2-small, Debian 12, 20GB)
3. SSH เข้า VM
4. ติดตั้ง Docker
5. clone repository ของ OpenClaw
6. สร้างไดเรกทอรีโฮสต์แบบ persistent
7. กำหนดค่า `.env` และ `docker-compose.yml`
8. ฝังไบนารีที่จำเป็น, build และ launch

---

## สิ่งที่คุณต้องมี

- บัญชี GCP (ใช้ free tier กับ e2-micro ได้)
- ติดตั้ง gcloud CLI ไว้แล้ว (หรือใช้ Cloud Console)
- การเข้าถึงผ่าน SSH จากแล็ปท็อปของคุณ
- ความคุ้นเคยพื้นฐานกับ SSH + การคัดลอก/วาง
- เวลาประมาณ 20-30 นาที
- Docker และ Docker Compose
- ข้อมูลรับรอง auth ของ model
- ข้อมูลรับรองผู้ให้บริการเพิ่มเติม (ไม่บังคับ)
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="ติดตั้ง gcloud CLI (หรือใช้ Console)">
    **ตัวเลือก A: gcloud CLI** (แนะนำสำหรับ Automation)

    ติดตั้งจาก [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    เริ่มต้นและยืนยันตัวตน:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **ตัวเลือก B: Cloud Console**

    ทุกขั้นตอนสามารถทำผ่านเว็บ UI ได้ที่ [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="สร้างโปรเจกต์ GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    เปิดใช้งาน billing ที่ [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (จำเป็นสำหรับ Compute Engine)

    เปิดใช้งาน Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. ไปที่ IAM & Admin > Create Project
    2. ตั้งชื่อแล้วสร้าง
    3. เปิดใช้ billing สำหรับโปรเจกต์
    4. ไปที่ APIs & Services > Enable APIs > ค้นหา "Compute Engine API" > Enable

  </Step>

  <Step title="สร้าง VM">
    **Machine types:**

    | ประเภท | สเปก | ค่าใช้จ่าย | หมายเหตุ |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, RAM 4GB          | ~$25/เดือน            | เชื่อถือได้มากที่สุดสำหรับ local Docker build |
    | e2-small  | 2 vCPU, RAM 2GB          | ~$12/เดือน            | ขั้นต่ำที่แนะนำสำหรับ Docker build |
    | e2-micro  | 2 vCPU (shared), RAM 1GB | ใช้ free tier ได้ | มักล้มเหลวด้วย Docker build OOM (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. ไปที่ Compute Engine > VM instances > Create instance
    2. Name: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Machine type: `e2-small`
    5. Boot disk: Debian 12, 20GB
    6. สร้าง

  </Step>

  <Step title="SSH เข้า VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    คลิกปุ่ม "SSH" ถัดจาก VM ของคุณในแดชบอร์ด Compute Engine

    หมายเหตุ: การเผยแพร่ SSH key อาจใช้เวลา 1-2 นาทีหลังจากสร้าง VM หากเชื่อมต่อไม่ได้ ให้รอแล้วลองใหม่

  </Step>

  <Step title="ติดตั้ง Docker (บน VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    ออกจากระบบแล้วเข้าสู่ระบบใหม่เพื่อให้การเปลี่ยนแปลงของกลุ่มมีผล:

    ```bash
    exit
    ```

    จากนั้น SSH กลับเข้าไปใหม่:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    ตรวจสอบ:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="clone repository ของ OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    คู่มือนี้ถือว่าคุณจะ build image แบบกำหนดเองเพื่อรับประกันการคงอยู่ของไบนารี

  </Step>

  <Step title="สร้างไดเรกทอรีโฮสต์แบบ persistent">
    Docker container เป็นสิ่งชั่วคราว
    สถานะระยะยาวทั้งหมดต้องอยู่บนโฮสต์

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="กำหนดค่าตัวแปรสภาพแวดล้อม">
    สร้าง `.env` ที่รากของ repository

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    ปล่อย `OPENCLAW_GATEWAY_TOKEN` ว่างไว้ เว้นแต่คุณจะต้องการ
    จัดการมันผ่าน `.env` อย่างชัดเจน; OpenClaw จะเขียน gateway token แบบสุ่มลงใน
    config เมื่อเริ่มครั้งแรก สร้างรหัสผ่านสำหรับ keyring แล้ววางลงใน
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **อย่า commit ไฟล์นี้**

    ไฟล์ `.env` นี้มีไว้สำหรับ env ของ container/runtime เช่น `OPENCLAW_GATEWAY_TOKEN`
    auth ของผู้ให้บริการแบบ OAuth/API-key ที่จัดเก็บไว้จะอยู่ใน
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

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
          # แนะนำ: ให้ Gateway เป็น loopback-only บน VM; เข้าถึงผ่าน SSH tunnel
          # หากต้องการเปิดสู่สาธารณะ ให้เอา prefix `127.0.0.1:` ออกและกำหนด firewall ให้เหมาะสม
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

    `--allow-unconfigured` มีไว้เพื่อความสะดวกในการ bootstrap เท่านั้น มันไม่ใช่ตัวแทนของการกำหนดค่า gateway ที่ถูกต้อง คุณยังคงต้องตั้งค่า auth (`gateway.auth.token` หรือรหัสผ่าน) และใช้การตั้งค่า bind ที่ปลอดภัยสำหรับการติดตั้งของคุณ

  </Step>

  <Step title="ขั้นตอน shared Docker VM runtime">
    ใช้คู่มือ runtime แบบใช้ร่วมกันสำหรับโฟลว์ Docker host ทั่วไป:

    - [ฝังไบนารีที่จำเป็นลงใน image](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build และเปิดใช้งาน](/th/install/docker-vm-runtime#build-and-launch)
    - [อะไรคงอยู่ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="หมายเหตุการ launch เฉพาะของ GCP">
    บน GCP หาก build ล้มเหลวด้วย `Killed` หรือ `exit code 137` ระหว่าง `pnpm install --frozen-lockfile` แปลว่า VM มีหน่วยความจำไม่พอ ให้ใช้ `e2-small` เป็นอย่างน้อย หรือ `e2-medium` เพื่อให้การ build ครั้งแรกเชื่อถือได้มากขึ้น

    เมื่อ bind เป็น LAN (`OPENCLAW_GATEWAY_BIND=lan`) ให้กำหนด trusted browser origin ก่อนทำต่อ:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    หากคุณเปลี่ยนพอร์ต gateway ให้แทน `18789` ด้วยพอร์ตที่คุณกำหนดไว้

  </Step>

  <Step title="เข้าถึงจากแล็ปท็อปของคุณ">
    สร้าง SSH tunnel เพื่อ forward พอร์ตของ Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    เปิดในเบราว์เซอร์ของคุณ:

    `http://127.0.0.1:18789/`

    พิมพ์ลิงก์แดชบอร์ดที่สะอาดอีกครั้ง:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    หาก UI ขอ shared-secret auth ให้ใส่ token หรือ
    รหัสผ่านที่กำหนดค่าไว้ลงใน Control UI settings โฟลว์ Docker นี้จะเขียน token โดย
    ค่าเริ่มต้น; หากคุณสลับ config ของ container ไปใช้ password auth ให้ใช้รหัสผ่านนั้นแทน

    หาก Control UI แสดง `unauthorized` หรือ `disconnected (1008): pairing required` ให้อนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    ต้องการเอกสารอ้างอิงเรื่อง persistence และ update แบบใช้ร่วมกันอีกครั้งหรือไม่?
    ดู [Docker VM Runtime](/th/install/docker-vm-runtime#what-persists-where) และ [Docker VM Runtime updates](/th/install/docker-vm-runtime#updates)

  </Step>
</Steps>

---

## การแก้ไขปัญหา

**SSH connection refused**

การเผยแพร่ SSH key อาจใช้เวลา 1-2 นาทีหลังจากสร้าง VM ให้รอแล้วลองใหม่

**ปัญหา OS Login**

ตรวจสอบโปรไฟล์ OS Login ของคุณ:

```bash
gcloud compute os-login describe-profile
```

ตรวจสอบให้แน่ใจว่าบัญชีของคุณมีสิทธิ์ IAM ที่จำเป็น (Compute OS Login หรือ Compute OS Admin Login)

**หน่วยความจำไม่พอ (OOM)**

หาก Docker build ล้มเหลวด้วย `Killed` และ `exit code 137` แปลว่า VM ถูก OOM-killed อัปเกรดเป็น e2-small (ขั้นต่ำ) หรือ e2-medium (แนะนำสำหรับ local build ที่เชื่อถือได้):

```bash
# หยุด VM ก่อน
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# เปลี่ยน machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# เริ่ม VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service account (แนวปฏิบัติด้านความปลอดภัยที่ดี)

สำหรับการใช้งานส่วนตัว บัญชีผู้ใช้ปกติของคุณก็เพียงพอ

สำหรับ Automation หรือ CI/CD pipeline ให้สร้าง service account เฉพาะพร้อมสิทธิ์ขั้นต่ำ:

1. สร้าง service account:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. มอบ role Compute Instance Admin (หรือ custom role ที่แคบกว่า):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

หลีกเลี่ยงการใช้ Owner role สำหรับ Automation ใช้หลักสิทธิ์น้อยที่สุดเท่าที่จำเป็น

ดู [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) สำหรับรายละเอียดของ IAM role

---

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางรับส่งข้อความ: [Channels](/th/channels)
- จับคู่อุปกรณ์ในเครื่องเป็น Nodes: [Nodes](/th/nodes)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Azure](/th/install/azure)
- [การโฮสต์ VPS](/th/vps)
