---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24/7 บน GCP
    - คุณต้องการ Gateway ที่ทำงานตลอดเวลาในระดับพร้อมใช้งานจริงบน VM ของคุณเอง
    - คุณต้องการควบคุมการเก็บข้อมูลถาวร ไบนารี และพฤติกรรมการรีสตาร์ตได้อย่างเต็มที่
summary: รัน OpenClaw Gateway ตลอด 24/7 บน GCP Compute Engine VM (Docker) พร้อมสถานะที่คงทน
title: GCP
x-i18n:
    generated_at: "2026-04-23T05:39:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4cf7924cbcfae74f268c88caedb79ed87a6ad37f4910ad65d92a5d99fe49c1
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw บน GCP Compute Engine (Docker, คู่มือ VPS สำหรับ production)

## เป้าหมาย

รัน OpenClaw Gateway แบบคงอยู่บน GCP Compute Engine VM โดยใช้ Docker พร้อมสถานะที่คงทน ไบนารีที่ bake ไว้ใน image และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

หากคุณต้องการ “OpenClaw 24/7 ในราคาประมาณ ~$5-12/เดือน” นี่คือการตั้งค่าที่เชื่อถือได้บน Google Cloud
ราคาจะแตกต่างกันตามชนิดเครื่องและ region; เลือก VM ที่เล็กที่สุดที่รองรับงานของคุณ และขยายขนาดหากเจอ OOM

## เรากำลังทำอะไรอยู่ (แบบง่ายๆ)?

- สร้างโปรเจกต์ GCP และเปิดใช้ billing
- สร้าง Compute Engine VM
- ติดตั้ง Docker (runtime แบบแยกสำหรับแอป)
- เริ่ม OpenClaw Gateway ใน Docker
- ทำให้ `~/.openclaw` + `~/.openclaw/workspace` คงอยู่บนโฮสต์ (อยู่รอดผ่านการรีสตาร์ต/การ build ใหม่)
- เข้าถึง Control UI จากแล็ปท็อปของคุณผ่าน SSH tunnel

สถานะ `~/.openclaw` ที่ถูก mount นั้นรวมถึง `openclaw.json`, ไฟล์ต่อเอเจนต์
`agents/<agentId>/agent/auth-profiles.json` และ `.env`

สามารถเข้าถึง Gateway ได้ผ่าน:

- การส่งต่อพอร์ตผ่าน SSH จากแล็ปท็อปของคุณ
- การเปิดพอร์ตโดยตรง หากคุณจัดการ firewall และ tokens เอง

คู่มือนี้ใช้ Debian บน GCP Compute Engine
Ubuntu ก็ใช้ได้เช่นกัน; ให้แมปแพ็กเกจตามนั้น
สำหรับ flow แบบ Docker ทั่วไป ดู [Docker](/th/install/docker)

---

## เส้นทางด่วน (สำหรับ operator ที่มีประสบการณ์)

1. สร้างโปรเจกต์ GCP + เปิดใช้ Compute Engine API
2. สร้าง Compute Engine VM (e2-small, Debian 12, 20GB)
3. SSH เข้า VM
4. ติดตั้ง Docker
5. โคลน repository ของ OpenClaw
6. สร้างไดเรกทอรีถาวรบนโฮสต์
7. กำหนดค่า `.env` และ `docker-compose.yml`
8. Bake ไบนารีที่จำเป็น, build และเปิดใช้งาน

---

## สิ่งที่คุณต้องมี

- บัญชี GCP (free tier ใช้ได้กับ e2-micro)
- ติดตั้ง gcloud CLI แล้ว (หรือใช้ Cloud Console)
- สิทธิ์ SSH จากแล็ปท็อปของคุณ
- ความคุ้นเคยพื้นฐานกับ SSH + การคัดลอก/วาง
- เวลาประมาณ 20-30 นาที
- Docker และ Docker Compose
- ข้อมูลประจำตัวสำหรับ model auth
- ข้อมูลประจำตัวของผู้ให้บริการแบบไม่บังคับ
  - QR ของ WhatsApp
  - token ของ Telegram bot
  - Gmail OAuth

---

<Steps>
  <Step title="ติดตั้ง gcloud CLI (หรือใช้ Console)">
    **ตัวเลือก A: gcloud CLI** (แนะนำสำหรับงานอัตโนมัติ)

    ติดตั้งจาก [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    เริ่มต้นใช้งานและยืนยันตัวตน:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **ตัวเลือก B: Cloud Console**

    ทุกขั้นตอนทำได้ผ่านเว็บ UI ที่ [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="สร้างโปรเจกต์ GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    เปิดใช้ billing ที่ [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (จำเป็นสำหรับ Compute Engine)

    เปิดใช้ Compute Engine API:

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
    **ชนิดเครื่อง:**

    | ชนิด      | สเปก                    | ค่าใช้จ่าย               | หมายเหตุ                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, RAM 4GB          | ~$25/เดือน            | เชื่อถือได้มากที่สุดสำหรับ local Docker builds        |
    | e2-small  | 2 vCPU, RAM 2GB          | ~$12/เดือน            | ค่าต่ำสุดที่แนะนำสำหรับ Docker build         |
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
    6. Create

  </Step>

  <Step title="SSH เข้า VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    คลิกปุ่ม "SSH" ข้าง VM ของคุณในแดชบอร์ด Compute Engine

    หมายเหตุ: การกระจาย SSH key อาจใช้เวลา 1-2 นาทีหลังจากสร้าง VM หากเชื่อมต่อไม่ได้ ให้รอแล้วลองใหม่

  </Step>

  <Step title="ติดตั้ง Docker (บน VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    ออกจากระบบแล้วกลับเข้าใหม่เพื่อให้การเปลี่ยนแปลง group มีผล:

    ```bash
    exit
    ```

    จากนั้น SSH กลับเข้าไปอีกครั้ง:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    ตรวจสอบ:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="โคลน repository ของ OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    คู่มือนี้ถือว่าคุณจะ build image แบบกำหนดเองเพื่อรับประกันการคงอยู่ของไบนารี

  </Step>

  <Step title="สร้างไดเรกทอรีถาวรบนโฮสต์">
    Docker containers เป็นแบบไม่ถาวร
    สถานะระยะยาวทั้งหมดต้องอยู่บนโฮสต์

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="กำหนดค่าตัวแปรสภาพแวดล้อม">
    สร้าง `.env` ที่ root ของ repository

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

    ปล่อย `OPENCLAW_GATEWAY_TOKEN` ว่างไว้ เว้นแต่คุณต้องการ
    จัดการมันผ่าน `.env` โดย explicit; OpenClaw จะเขียน gateway token แบบสุ่มลงใน
    คอนฟิกเมื่อเริ่มครั้งแรก สร้าง keyring password แล้ววางลงใน
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **ห้าม commit ไฟล์นี้**

    ไฟล์ `.env` นี้ใช้สำหรับ env ของคอนเทนเนอร์/รันไทม์ เช่น `OPENCLAW_GATEWAY_TOKEN`
    auth แบบ OAuth/API-key ของผู้ให้บริการที่จัดเก็บไว้จะอยู่ใน
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
          # แนะนำ: ให้ Gateway เป็น loopback-only บน VM; เข้าถึงผ่าน SSH tunnel
          # หากต้องการเปิดออกสาธารณะ ให้ลบ prefix `127.0.0.1:` และตั้งค่า firewall ให้เหมาะสม
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

    `--allow-unconfigured` มีไว้เพื่อความสะดวกในการ bootstrap เท่านั้น ไม่ใช่สิ่งทดแทนการกำหนดค่า gateway ที่ถูกต้อง คุณยังคงต้องตั้ง auth (`gateway.auth.token` หรือ password) และใช้การตั้งค่า bind ที่ปลอดภัยสำหรับการ deploy ของคุณ

  </Step>

  <Step title="ขั้นตอน runtime ของ Docker VM แบบใช้ร่วมกัน">
    ใช้คู่มือ runtime แบบใช้ร่วมกันสำหรับ flow ทั่วไปของ Docker host:

    - [Bake ไบนารีที่จำเป็นเข้าไปใน image](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build และเปิดใช้งาน](/th/install/docker-vm-runtime#build-and-launch)
    - [อะไรถูกเก็บถาวรไว้ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="หมายเหตุการเปิดใช้งานเฉพาะ GCP">
    บน GCP หากการ build ล้มเหลวด้วย `Killed` หรือ `exit code 137` ระหว่าง `pnpm install --frozen-lockfile` แปลว่า VM หน่วยความจำไม่พอ ใช้ `e2-small` เป็นอย่างต่ำ หรือ `e2-medium` เพื่อให้การ build ครั้งแรกเชื่อถือได้มากขึ้น

    เมื่อ bind ไปยัง LAN (`OPENCLAW_GATEWAY_BIND=lan`) ให้กำหนด browser origin ที่เชื่อถือได้ก่อนทำขั้นตอนต่อไป:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    หากคุณเปลี่ยนพอร์ต gateway ให้แทน `18789` ด้วยพอร์ตที่คุณกำหนด

  </Step>

  <Step title="เข้าถึงจากแล็ปท็อปของคุณ">
    สร้าง SSH tunnel เพื่อส่งต่อพอร์ตของ Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    เปิดในเบราว์เซอร์ของคุณ:

    `http://127.0.0.1:18789/`

    พิมพ์ลิงก์ dashboard ที่สะอาดอีกครั้ง:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    หาก UI ขอ shared-secret auth ให้วาง token หรือ
    password ที่กำหนดไว้ลงใน Control UI settings flow แบบ Docker นี้จะเขียน token โดย
    ค่าเริ่มต้น; หากคุณสลับคอนฟิกของคอนเทนเนอร์ไปใช้ password auth ให้ใช้ password นั้นแทน

    หาก Control UI แสดง `unauthorized` หรือ `disconnected (1008): pairing required` ให้อนุมัติ browser device:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    ต้องการเอกสารอ้างอิงเรื่อง persistence และการอัปเดตแบบใช้ร่วมกันอีกครั้งหรือไม่?
    ดู [Docker VM Runtime](/th/install/docker-vm-runtime#what-persists-where) และ [การอัปเดต Docker VM Runtime](/th/install/docker-vm-runtime#updates)

  </Step>
</Steps>

---

## การแก้ไขปัญหา

**SSH connection refused**

การกระจาย SSH key อาจใช้เวลา 1-2 นาทีหลังจากสร้าง VM ให้รอแล้วลองใหม่

**ปัญหา OS Login**

ตรวจสอบโปรไฟล์ OS Login ของคุณ:

```bash
gcloud compute os-login describe-profile
```

ตรวจสอบให้แน่ใจว่าบัญชีของคุณมีสิทธิ์ IAM ที่จำเป็น (Compute OS Login หรือ Compute OS Admin Login)

**Out of memory (OOM)**

หาก Docker build ล้มเหลวด้วย `Killed` และ `exit code 137` แปลว่า VM ถูก OOM-kill ให้อัปเกรดเป็น e2-small (ขั้นต่ำ) หรือ e2-medium (แนะนำสำหรับ local builds ที่เชื่อถือได้):

```bash
# หยุด VM ก่อน
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# เปลี่ยนชนิดเครื่อง
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# เริ่ม VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service accounts (แนวทางความปลอดภัยที่ดี)

สำหรับการใช้งานส่วนตัว บัญชีผู้ใช้ปกติของคุณก็เพียงพอ

สำหรับระบบอัตโนมัติหรือ CI/CD pipelines ให้สร้าง service account โดยเฉพาะพร้อมสิทธิ์ขั้นต่ำ:

1. สร้าง service account:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. ให้ role Compute Instance Admin (หรือ custom role ที่แคบกว่านี้):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

หลีกเลี่ยงการใช้ Owner role สำหรับระบบอัตโนมัติ ใช้หลัก least privilege

ดู [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) สำหรับรายละเอียด IAM role

---

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางรับส่งข้อความ: [Channels](/th/channels)
- จับคู่อุปกรณ์ในเครื่องเป็น Node: [Nodes](/th/nodes)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
