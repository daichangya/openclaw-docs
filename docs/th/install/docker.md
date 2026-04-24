---
read_when:
    - คุณต้องการ gateway แบบคอนเทนเนอร์แทนการติดตั้งภายในเครื่อง
    - คุณกำลังตรวจสอบโฟลว์ Docker
summary: การตั้งค่าและ onboarding แบบใช้ Docker ตามตัวเลือกสำหรับ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-24T09:17:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker เป็น **ทางเลือก** ใช้ก็ต่อเมื่อคุณต้องการ gateway แบบคอนเทนเนอร์ หรือเพื่อตรวจสอบโฟลว์ Docker

## Docker เหมาะกับฉันหรือไม่

- **ใช่**: คุณต้องการสภาพแวดล้อม gateway แบบแยกอิสระ ใช้แล้วทิ้งได้ หรืออยากรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งในเครื่อง
- **ไม่ใช่**: คุณกำลังรันบนเครื่องของตัวเองและต้องการ dev loop ที่เร็วที่สุด ให้ใช้โฟลว์การติดตั้งปกติแทน
- **หมายเหตุเรื่อง sandboxing**: sandbox backend ค่าเริ่มต้นใช้ Docker เมื่อเปิดใช้ sandboxing แต่ sandboxing ปิดอยู่เป็นค่าเริ่มต้นและ **ไม่จำเป็น** ต้องรัน gateway ทั้งหมดใน Docker นอกจากนี้ยังมี sandbox backends แบบ SSH และ OpenShell ด้วย ดู [Sandboxing](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับ build image (`pnpm install` อาจถูก OOM-killed บนโฮสต์ 1 GB พร้อม exit 137)
- พื้นที่ดิสก์เพียงพอสำหรับ images และ logs
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [Security hardening for network exposure](/th/gateway/security)
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="Build image">
    จากรากของ repo ให้รันสคริปต์ setup:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะ build gateway image ภายในเครื่อง หากต้องการใช้ image ที่ build ไว้แล้วแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    pre-built images เผยแพร่อยู่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    tags ที่ใช้บ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ทำ onboarding ให้เสร็จ">
    สคริปต์ setup จะรัน onboarding ให้อัตโนมัติ โดยจะ:

    - ถาม provider API keys
    - สร้าง gateway token และเขียนลงใน `.env`
    - เริ่ม gateway ผ่าน Docker Compose

    ระหว่าง setup การทำ onboarding ก่อนเริ่มและการเขียน config จะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` มีไว้สำหรับคำสั่งที่คุณรันหลังจาก
    มี gateway container อยู่แล้ว

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ของคุณ แล้ววาง
    shared secret ที่กำหนดค่าไว้ลงใน Settings สคริปต์ setup จะเขียน token ลง `.env`
    เป็นค่าเริ่มต้น; หากคุณสลับ config ของคอนเทนเนอร์ให้ใช้ password auth ให้ใช้
    password นั้นแทน

    ต้องการ URL อีกครั้งหรือไม่

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="กำหนดค่าแชนแนล (ไม่บังคับ)">
    ใช้ CLI container เพื่อเพิ่มแชนแนลส่งข้อความ:

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

### โฟลว์แบบแมนนวล

หากคุณต้องการรันแต่ละขั้นตอนด้วยตัวเองแทนการใช้สคริปต์ setup:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
ให้รัน `docker compose` จากรากของ repo หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ setup จะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นี้ด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ network namespace ร่วมกับ `openclaw-gateway`
จึงเป็นเครื่องมือหลังเริ่มระบบ ก่อน `docker compose up -d openclaw-gateway` ให้รัน onboarding
และการเขียน config ตอน setup ผ่าน `openclaw-gateway` โดยใช้
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ setup รองรับตัวแปรสภาพแวดล้อมแบบไม่บังคับต่อไปนี้:

| ตัวแปร                         | วัตถุประสงค์                                                   |
| ------------------------------ | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | ใช้ remote image แทนการ build ภายในเครื่อง                    |
| `OPENCLAW_DOCKER_APT_PACKAGES` | ติดตั้ง apt packages เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง) |
| `OPENCLAW_EXTENSIONS`          | ติดตั้ง dependencies ของ Plugin ล่วงหน้าในเวลาสร้าง (ชื่อคั่นด้วยช่องว่าง) |
| `OPENCLAW_EXTRA_MOUNTS`        | bind mounts เพิ่มเติมจากโฮสต์ (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | คง `/home/node` ไว้ใน named Docker volume                     |
| `OPENCLAW_SANDBOX`             | opt in เพื่อ bootstrap sandbox (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`       | แทนที่พาธของ Docker socket                                     |

### การตรวจสุขภาพ

probe endpoints ของคอนเทนเนอร์ (ไม่ต้อง auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image มี `HEALTHCHECK` ในตัวที่ ping ไปยัง `/healthz`
หากการตรวจสอบล้มเหลวบ่อย Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ตหรือแทนที่คอนเทนเนอร์ได้

snapshot การตรวจสุขภาพแบบละเอียดที่ต้องยืนยันตัวตน:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ใช้ค่าเริ่มต้นเป็น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ใช้งานได้เมื่อ Docker publish พอร์ต

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์บนโฮสต์และ CLI บนโฮสต์เข้าถึงพอร์ต gateway ที่ publish ได้
- `loopback`: เฉพาะโปรเซสภายใน network namespace ของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  gateway โดยตรงได้

<Note>
ให้ใช้ค่า bind mode ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ aliases ของโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### การจัดเก็บและการคงอยู่

Docker Compose จะ bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` ดังนั้น paths เหล่านี้จะยังอยู่
หลังจากมีการแทนที่คอนเทนเนอร์

ไดเรกทอรี config ที่ถูก mount นี้คือที่ที่ OpenClaw ใช้เก็บ:

- `openclaw.json` สำหรับ behavior config
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ auth แบบ OAuth/API-key ของ provider ที่จัดเก็บไว้
- `.env` สำหรับ secrets ของ runtime ที่อิงกับ env เช่น `OPENCLAW_GATEWAY_TOKEN`

สำหรับรายละเอียดการคงอยู่ทั้งหมดบนการ deploy แบบ VM ดู
[Docker VM Runtime - What persists where](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์โตเร็ว:** จับตา `media/`, ไฟล์ session JSONL, `cron/runs/*.jsonl`
และ rolling file logs ภายใต้ `/tmp/openclaw/`

### ตัวช่วย shell (ไม่บังคับ)

เพื่อให้การจัดการ Docker ในชีวิตประจำวันง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จาก raw path เก่าที่ `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งข้างต้นอีกครั้ง เพื่อให้ไฟล์ helper ในเครื่องของคุณตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` เป็นต้น รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือ helper แบบเต็ม

<AccordionGroup>
  <Accordion title="เปิดใช้ agent sandbox สำหรับ Docker gateway">
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
    การตั้งค่า sandbox ไม่สามารถทำได้ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    กลับเป็น `off`

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    ปิดการจัดสรร Compose pseudo-TTY ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุด้านความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` ดังนั้นคำสั่ง CLI
    จึงเข้าถึง gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่คือ
    ขอบเขตความไว้วางใจที่ใช้ร่วมกัน config ของ compose จะตัด `NET_RAW`/`NET_ADMIN` ทิ้ง และเปิด
    `no-new-privileges` บน `openclaw-cli`
  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    image รันเป็นผู้ใช้ `node` (uid 1000) หากคุณเห็น permission errors บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า host bind mounts เป็นเจ้าของโดย uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="การ rebuild ที่เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณให้ dependency layers ถูกแคช วิธีนี้จะหลีกเลี่ยงการรัน
    `pnpm install` ซ้ำ เว้นแต่ lockfiles จะเปลี่ยน:

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

  <Accordion title="ตัวเลือกคอนเทนเนอร์สำหรับผู้ใช้ขั้นสูง">
    image ค่าเริ่มต้นเน้นความปลอดภัยเป็นหลักและรันเป็นผู้ใช้ `node` ที่ไม่ใช่ root หากต้องการ
    คอนเทนเนอร์ที่มีความสามารถเต็มกว่านี้:

    1. **คง `/home/node` ไว้**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง system deps ใน image**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ติดตั้ง Playwright browsers**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **คง browser downloads ไว้**: ตั้งค่า
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` และใช้
       `OPENCLAW_HOME_VOLUME` หรือ `OPENCLAW_EXTRA_MOUNTS`

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ในวิซาร์ด มันจะเปิด URL ในเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบ headless ให้คัดลอก redirect URL เต็มที่คุณไปถึงแล้ววาง
    กลับเข้าไปในวิซาร์ดเพื่อทำ auth ให้เสร็จ
  </Accordion>

  <Accordion title="metadata ของ base image">
    Docker image หลักใช้ `node:24-bookworm` และเผยแพร่ OCI base-image
    annotations รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และอื่น ๆ ดู
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### รันบน VPS อยู่หรือไม่

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการ deploy บน VM ที่ใช้ร่วมกัน
รวมถึงการ bake ไบนารี การคงอยู่ และการอัปเดต

## Agent Sandbox

เมื่อเปิดใช้ `agents.defaults.sandbox` ด้วย Docker backend, gateway
จะรันการเรียกใช้เครื่องมือของเอเจนต์ (shell, file read/write เป็นต้น) ภายใน Docker
containers แบบแยกอิสระ ขณะที่ตัว gateway เองยังคงอยู่บนโฮสต์ วิธีนี้สร้างกำแพงแข็ง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือเป็นแบบหลายผู้เช่า โดยไม่ต้องคอนเทนเนอร์ไรซ์
gateway ทั้งหมด

ขอบเขตของ sandbox สามารถเป็นแบบต่อเอเจนต์ (ค่าเริ่มต้น), ต่อเซสชัน หรือใช้ร่วมกัน แต่ละ scope
จะมี workspace ของตัวเองที่ mount ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบาย allow/deny ของเครื่องมือ การแยกเครือข่าย ขีดจำกัดทรัพยากร และ browser
containers ได้

สำหรับการกำหนดค่าแบบเต็ม images หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox แบบสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึงเชลล์แบบโต้ตอบไปยัง sandbox containers
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การแทนที่แยกตามเอเจนต์

### เปิดใช้งานอย่างรวดเร็ว

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

Build sandbox image ค่าเริ่มต้น:

```bash
scripts/sandbox-setup.sh
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มี image หรือ sandbox container ไม่เริ่มทำงาน">
    Build sandbox image ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็น image แบบกำหนดเองของคุณ
    containers จะถูกสร้างอัตโนมัติต่อเซสชันตามต้องการ
  </Accordion>

  <Accordion title="เกิด permission errors ใน sandbox">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับเจ้าของของ mounted workspace ของคุณ
    หรือเปลี่ยนเจ้าของโฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบ custom tools ใน sandbox">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะ source
    `/etc/profile` และอาจรีเซ็ต PATH ให้ตั้งค่า `docker.env.PATH` เพื่อเติม
    พาธของ custom tools ของคุณไว้ข้างหน้า หรือเพิ่มสคริปต์ไว้ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-killed ระหว่าง build image (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้ machine class ที่ใหญ่ขึ้นแล้วลองใหม่
  </Accordion>

  <Accordion title="Unauthorized หรือจำเป็นต้อง pairing ใน Control UI">
    ดึง dashboard link ใหม่และอนุมัติอุปกรณ์ของเบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [Dashboard](/th/web/dashboard), [Devices](/th/cli/devices)

  </Accordion>

  <Accordion title="เป้าหมาย gateway แสดง ws://172.x.x.x หรือเกิด pairing errors จาก Docker CLI">
    รีเซ็ต gateway mode และ bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Install Overview](/th/install) — วิธีการติดตั้งทั้งหมด
- [Podman](/th/install/podman) — ทางเลือก Podman แทน Docker
- [ClawDock](/th/install/clawdock) — การตั้งค่าชุมชนสำหรับ Docker Compose
- [Updating](/th/install/updating) — การอัปเดต OpenClaw ให้ทันสมัย
- [Configuration](/th/gateway/configuration) — การกำหนดค่า gateway หลังติดตั้ง
