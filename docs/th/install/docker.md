---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของโฟลว์ Docker
summary: การตั้งค่าและ onboarding ของ OpenClaw แบบใช้ Docker ซึ่งเป็นทางเลือก დამატ
title: Docker
x-i18n:
    generated_at: "2026-04-23T05:39:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8d3e346ca60daa9908aef0846c9052321087af7dd2c919ce79de4d5925136a2
    source_path: install/docker.md
    workflow: 15
---

# Docker (ไม่บังคับ)

Docker เป็น **ตัวเลือกเสริม** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบโฟลว์ Docker

## Docker เหมาะกับฉันไหม?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway แบบแยกส่วนและทิ้งได้ หรืออยากรัน OpenClaw บนโฮสต์ที่ไม่ติดตั้งอะไรในเครื่อง
- **ไม่ใช่**: คุณกำลังรันบนเครื่องของตัวเองและแค่อยากได้ลูปพัฒนาที่เร็วที่สุด ให้ใช้โฟลว์ติดตั้งปกติแทน
- **หมายเหตุเรื่อง sandboxing**: แบ็กเอนด์ sandbox ค่าเริ่มต้นจะใช้ Docker เมื่อเปิด sandboxing แต่ sandboxing ปิดอยู่โดยค่าเริ่มต้น และ **ไม่จำเป็น** ต้องรัน Gateway ทั้งหมดใน Docker แบ็กเอนด์ sandbox แบบ SSH และ OpenShell ก็มีให้ใช้เช่นกัน ดู [Sandboxing](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการ build image (`pnpm install` อาจถูก kill ด้วย OOM บนโฮสต์ 1 GB พร้อม exit 137)
- มีพื้นที่ดิสก์เพียงพอสำหรับ image และ log
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การเสริมความแข็งแรงด้านความปลอดภัยสำหรับการเปิดออกสู่เครือข่าย](/th/gateway/security)
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="Build image">
    จากรากของรีโป ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะ build image ของ Gateway ในเครื่อง หากต้องการใช้ image ที่ build ไว้แล้วแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    image ที่ build ไว้ล่วงหน้าถูกเผยแพร่ไว้ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    แท็กที่พบบ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ทำ onboarding ให้เสร็จ">
    สคริปต์ตั้งค่าจะรัน onboarding ให้อัตโนมัติ โดยจะ:

    - ขอ API key ของผู้ให้บริการ
    - สร้าง gateway token และเขียนลง `.env`
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่มและการเขียนคอนฟิกจะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    มีคอนเทนเนอร์ Gateway อยู่แล้วเท่านั้น

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ของคุณ แล้ววาง
    shared secret ที่ตั้งค่าไว้ลงใน Settings สคริปต์ตั้งค่าจะเขียน token ลงใน `.env` โดย
    ค่าเริ่มต้น; หากคุณเปลี่ยนคอนฟิกคอนเทนเนอร์เป็น password auth ให้ใช้
    password นั้นแทน

    ต้องการ URL อีกครั้งใช่ไหม?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="ตั้งค่าช่องทาง (ไม่บังคับ)">
    ใช้คอนเทนเนอร์ CLI เพื่อเพิ่มช่องทางส่งข้อความ:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord)

  </Step>
</Steps>

### โฟลว์แบบทำเอง

หากคุณต้องการรันแต่ละขั้นตอนด้วยตนเองแทนการใช้สคริปต์ตั้งค่า:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
ให้รัน `docker compose` จากรากของรีโป หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นี้ด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ network namespace ร่วมกับ `openclaw-gateway` มันจึงเป็น
เครื่องมือหลังเริ่มระบบ ก่อน `docker compose up -d openclaw-gateway` ให้รัน onboarding
และการเขียนคอนฟิกช่วงตั้งค่าผ่าน `openclaw-gateway` โดยใช้
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารับตัวแปรสภาพแวดล้อมแบบไม่บังคับเหล่านี้:

| ตัวแปร                       | จุดประสงค์                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| `OPENCLAW_IMAGE`            | ใช้ image ระยะไกลแทนการ build ในเครื่อง                           |
| `OPENCLAW_DOCKER_APT_PACKAGES` | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง)     |
| `OPENCLAW_EXTENSIONS`       | ติดตั้ง dependency ของ extension ล่วงหน้าตอน build (ชื่อคั่นด้วยช่องว่าง) |
| `OPENCLAW_EXTRA_MOUNTS`     | bind mount ของโฮสต์เพิ่มเติม (คั่นด้วยจุลภาคในรูป `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`      | เก็บ `/home/node` ไว้ใน Docker volume แบบมีชื่อ                    |
| `OPENCLAW_SANDBOX`          | เลือกใช้ sandbox bootstrap (`1`, `true`, `yes`, `on`)            |
| `OPENCLAW_DOCKER_SOCKET`    | override พาธของ Docker socket                                     |

### การตรวจสอบสุขภาพระบบ

endpoint สำหรับ probe ของคอนเทนเนอร์ (ไม่ต้องยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image มี `HEALTHCHECK` ในตัวที่ ping ไปยัง `/healthz`
หากการตรวจสอบล้มเหลวบ่อย Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ตหรือแทนที่มันได้

สแนปชอตสุขภาพระบบเชิงลึกแบบยืนยันตัวตนแล้ว:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ใช้ค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` ดังนั้นการเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` จึงทำงานได้กับการ publish พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์บนโฮสต์และ CLI บนโฮสต์เข้าถึงพอร์ต Gateway ที่ publish ได้
- `loopback`: มีเพียงโปรเซสภายใน network namespace ของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  Gateway ได้โดยตรง

<Note>
ให้ใช้ค่า bind mode ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ host alias อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### การจัดเก็บและความคงทน

Docker Compose จะ bind-mount `OPENCLAW_CONFIG_DIR` ไปที่ `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปที่ `/home/node/.openclaw/workspace` ดังนั้นพาธเหล่านี้
จะยังอยู่แม้มีการแทนที่คอนเทนเนอร์

ไดเรกทอรีคอนฟิกที่ถูก mount นี้เป็นที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับคอนฟิกพฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับการยืนยันตัวตน OAuth/API-key ของผู้ให้บริการที่จัดเก็บไว้
- `.env` สำหรับ secret ของรันไทม์ที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

สำหรับรายละเอียดความคงทนทั้งหมดในชุดติดตั้งแบบ VM ดู
[Docker VM Runtime - อะไรคงอยู่ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์โตเร็ว:** ให้เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน, `cron/runs/*.jsonl`
และ rolling file log ภายใต้ `/tmp/openclaw/`

### ตัวช่วยเชลล์ (ไม่บังคับ)

เพื่อให้การจัดการ Docker ในชีวิตประจำวันง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จากพาธดิบแบบเก่า `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้ง เพื่อให้ไฟล์ตัวช่วยในเครื่องของคุณตามตำแหน่งใหม่

จากนั้นให้ใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` ฯลฯ รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดูคู่มือแบบเต็มได้ที่ [ClawDock](/th/install/clawdock)

<AccordionGroup>
  <Accordion title="เปิดใช้ agent sandbox สำหรับ Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    พาธ socket แบบกำหนดเอง (เช่น rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    สคริปต์จะ mount `docker.sock` ก็ต่อเมื่อผ่านข้อกำหนดเบื้องต้นของ sandbox แล้วเท่านั้น หาก
    การตั้งค่า sandbox ทำไม่สำเร็จ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    กลับเป็น `off`

  </Accordion>

  <Accordion title="Automation / CI (แบบไม่โต้ตอบ)">
    ปิดการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุด้านความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` ดังนั้นคำสั่ง CLI
    จึงเข้าถึง Gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความเชื่อถือร่วมกัน
    คอนฟิก compose จะตัด `NET_RAW`/`NET_ADMIN` ออก และเปิด
    `no-new-privileges` บน `openclaw-cli`
  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    image นี้รันในฐานะ `node` (uid 1000) หากคุณเห็นข้อผิดพลาดด้านสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mount ของโฮสต์เป็นของ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="การ build ใหม่ให้เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณเพื่อให้ชั้นของ dependency ถูกแคช วิธีนี้ช่วยหลีกเลี่ยงการรัน
    `pnpm install` ใหม่ เว้นแต่ lockfile จะเปลี่ยน:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="ตัวเลือกคอนเทนเนอร์สำหรับผู้ใช้ระดับสูง">
    image ค่าเริ่มต้นเน้นความปลอดภัยและรันเป็นผู้ใช้ `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์
    ที่มีความสามารถครบมากขึ้น:

    1. **เก็บ `/home/node` ให้คงอยู่**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง dependency ของระบบ**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ติดตั้งเบราว์เซอร์ของ Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **เก็บดาวน์โหลดของเบราว์เซอร์ให้คงอยู่**: ตั้งค่า
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` และใช้
       `OPENCLAW_HOME_VOLUME` หรือ `OPENCLAW_EXTRA_MOUNTS`

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ใน wizard มันจะเปิด URL บนเบราว์เซอร์ ใน
    ชุดติดตั้ง Docker หรือแบบ headless ให้คัดลอก redirect URL เต็มที่คุณไปถึงแล้ววาง
    กลับเข้าไปใน wizard เพื่อทำ auth ให้เสร็จ
  </Accordion>

  <Accordion title="เมทาดาทาของ base image">
    Docker image หลักใช้ `node:24-bookworm` และเผยแพร่ annotation ของ OCI base-image
    รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และอื่น ๆ ดู
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### รันบน VPS อยู่หรือไม่?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการติดตั้งบน VM แบบใช้ร่วมกัน
รวมถึงการฝังไบนารี ความคงทน และการอัปเดต

## Agent Sandbox

เมื่อเปิดใช้ `agents.defaults.sandbox` ด้วยแบ็กเอนด์ Docker, Gateway จะ
รันการใช้เครื่องมือของเอเจนต์ (shell, การอ่าน/เขียนไฟล์ ฯลฯ) ภายใน Docker
container ที่แยกจากกัน ขณะที่ Gateway เองยังคงอยู่บนโฮสต์ วิธีนี้ให้กำแพงแข็ง
ล้อมรอบเซสชันของเอเจนต์ที่ไม่น่าเชื่อถือหรือเป็นแบบหลายผู้เช่า โดยไม่ต้องทำให้ทั้ง
Gateway กลายเป็นคอนเทนเนอร์

ขอบเขตของ sandbox สามารถเป็นแยกตามเอเจนต์ (ค่าเริ่มต้น), แยกตามเซสชัน หรือใช้ร่วมกันก็ได้ แต่ละขอบเขต
จะมี workspace ของตัวเอง mount อยู่ที่ `/workspace` คุณยังสามารถกำหนด
นโยบายอนุญาต/ปฏิเสธเครื่องมือ การแยกเครือข่าย ขีดจำกัดทรัพยากร และคอนเทนเนอร์เบราว์เซอร์ได้

สำหรับคอนฟิกแบบเต็ม image หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox แบบครบถ้วน
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์ sandbox
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การ override แยกตามเอเจนต์

### เปิดใช้งานแบบรวดเร็ว

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Build image sandbox ค่าเริ่มต้น:

```bash
scripts/sandbox-setup.sh
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ image หรือคอนเทนเนอร์ sandbox ไม่เริ่มทำงาน">
    Build image sandbox ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็น image แบบกำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติแยกตามเซสชันเมื่อมีการใช้งาน
  </Accordion>

  <Accordion title="ข้อผิดพลาดด้านสิทธิ์ใน sandbox">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับความเป็นเจ้าของของ workspace ที่ mount ไว้
    หรือใช้ chown กับโฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบ custom tool ใน sandbox">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะโหลด
    `/etc/profile` และอาจรีเซ็ต PATH ให้ตั้ง `docker.env.PATH` เพื่อเติมพาธของเครื่องมือแบบกำหนดเองของคุณไว้ข้างหน้า หรือเพิ่มสคริปต์ภายใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก kill ด้วย OOM ระหว่าง build image (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ให้ใช้เครื่องที่มีขนาดใหญ่ขึ้นแล้วลองใหม่
  </Accordion>

  <Accordion title="Unauthorized หรือจำเป็นต้องจับคู่ใน Control UI">
    ดึงลิงก์แดชบอร์ดใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [Dashboard](/web/dashboard), [Devices](/cli/devices)

  </Accordion>

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือเกิดข้อผิดพลาด pairing จาก Docker CLI">
    รีเซ็ตโหมดและ bind ของ Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีติดตั้งทั้งหมด
- [Podman](/th/install/podman) — ทางเลือก Podman แทน Docker
- [ClawDock](/th/install/clawdock) — ชุดติดตั้งชุมชนด้วย Docker Compose
- [Updating](/th/install/updating) — การอัปเดต OpenClaw ให้ทันสมัย
- [Configuration](/th/gateway/configuration) — คอนฟิก Gateway หลังการติดตั้ง
