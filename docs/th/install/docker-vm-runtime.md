---
read_when:
    - คุณกำลังติดตั้ง OpenClaw บน cloud VM ด้วย Docker
    - คุณต้องการโฟลว์ร่วมสำหรับการฝังไบนารี การคงอยู่ และการอัปเดต
summary: ขั้นตอนของ Docker VM runtime แบบใช้ร่วมกันสำหรับโฮสต์ Gateway ของ OpenClaw ที่ทำงานระยะยาว
title: Docker VM runtime
x-i18n:
    generated_at: "2026-04-24T09:16:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54e99e6186a3c13783922e4d1e4a55e9872514be23fa77ca869562dcd436ad2b
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

ขั้นตอน runtime แบบใช้ร่วมกันสำหรับการติดตั้ง Docker บน VM เช่น GCP, Hetzner และผู้ให้บริการ VPS ที่คล้ายกัน

## ฝังไบนารีที่จำเป็นลงใน image

การติดตั้งไบนารีภายใน container ที่กำลังรันอยู่เป็นกับดัก
ทุกอย่างที่ติดตั้งตอน runtime จะหายไปเมื่อรีสตาร์ต

ไบนารีภายนอกทั้งหมดที่ Skills ต้องใช้ต้องถูกติดตั้งในขั้นตอน build image

ตัวอย่างด้านล่างแสดงเพียงไบนารีทั่วไปสามตัว:

- `gog` สำหรับการเข้าถึง Gmail
- `goplaces` สำหรับ Google Places
- `wacli` สำหรับ WhatsApp

สิ่งเหล่านี้เป็นเพียงตัวอย่าง ไม่ใช่รายการที่ครบถ้วน
คุณสามารถติดตั้งไบนารีได้มากเท่าที่ต้องการโดยใช้รูปแบบเดียวกัน

หากคุณเพิ่ม Skills ใหม่ภายหลังที่ต้องพึ่งไบนารีเพิ่มเติม คุณต้อง:

1. อัปเดต Dockerfile
2. rebuild image
3. รีสตาร์ต container

**ตัวอย่าง Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# ตัวอย่างไบนารี 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# ตัวอย่างไบนารี 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# ตัวอย่างไบนารี 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# เพิ่มไบนารีเพิ่มเติมด้านล่างโดยใช้รูปแบบเดียวกัน

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
URL ดาวน์โหลดด้านบนเป็นสำหรับ x86_64 (amd64) สำหรับ VM แบบ ARM (เช่น Hetzner ARM, GCP Tau T2A) ให้แทนที่ URL ดาวน์โหลดด้วยรุ่น ARM64 ที่เหมาะสมจากหน้าปล่อยของแต่ละเครื่องมือ
</Note>

## Build และเปิดใช้งาน

```bash
docker compose build
docker compose up -d openclaw-gateway
```

หาก build ล้มเหลวพร้อม `Killed` หรือ `exit code 137` ระหว่าง `pnpm install --frozen-lockfile` แปลว่า VM มีหน่วยความจำไม่พอ
ให้ใช้ machine class ที่ใหญ่ขึ้นก่อนแล้วค่อยลองใหม่

ตรวจสอบไบนารี:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

เอาต์พุตที่คาดหวัง:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

ตรวจสอบ Gateway:

```bash
docker compose logs -f openclaw-gateway
```

เอาต์พุตที่คาดหวัง:

```
[gateway] listening on ws://0.0.0.0:18789
```

## อะไรคงอยู่ที่ไหน

OpenClaw รันใน Docker แต่ Docker ไม่ใช่แหล่งความจริง
สถานะระยะยาวทั้งหมดต้องรอดผ่านการรีสตาร์ต, rebuild และการบูตใหม่

| องค์ประกอบ | ตำแหน่ง | กลไกการคงอยู่ | หมายเหตุ |
| ------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| config ของ Gateway | `/home/node/.openclaw/`           | การ mount โวลุ่มของโฮสต์ | รวม `openclaw.json`, `.env` |
| auth profile ของ model | `/home/node/.openclaw/agents/`    | การ mount โวลุ่มของโฮสต์ | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API key) |
| config ของ Skill | `/home/node/.openclaw/skills/`    | การ mount โวลุ่มของโฮสต์ | สถานะระดับ Skill |
| พื้นที่ทำงานของเอเจนต์ | `/home/node/.openclaw/workspace/` | การ mount โวลุ่มของโฮสต์ | โค้ดและ artifact ของเอเจนต์ |
| เซสชัน WhatsApp | `/home/node/.openclaw/`           | การ mount โวลุ่มของโฮสต์ | คง QR login ไว้ |
| keyring ของ Gmail | `/home/node/.openclaw/`           | โวลุ่มของโฮสต์ + รหัสผ่าน | ต้องใช้ `GOG_KEYRING_PASSWORD` |
| ไบนารีภายนอก | `/usr/local/bin/`                 | Docker image | ต้องฝังตั้งแต่ขั้นตอน build |
| runtime ของ Node | ระบบไฟล์ของ container              | Docker image | rebuild ทุกครั้งที่ build image |
| แพ็กเกจของ OS | ระบบไฟล์ของ container              | Docker image | อย่าติดตั้งตอน runtime |
| Docker container | ชั่วคราว                         | รีสตาร์ตได้            | ลบทิ้งได้อย่างปลอดภัย |

## การอัปเดต

หากต้องการอัปเดต OpenClaw บน VM:

```bash
git pull
docker compose build
docker compose up -d
```

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [Podman](/th/install/podman)
- [ClawDock](/th/install/clawdock)
