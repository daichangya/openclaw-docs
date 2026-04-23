---
read_when:
    - คุณกำลัง deploy OpenClaw บน cloud VM ด้วย Docker
    - คุณต้องการขั้นตอนสำหรับการ bake ไบนารีแบบใช้ร่วมกัน การเก็บข้อมูลถาวร และการอัปเดต
summary: ขั้นตอน runtime ของ Docker VM แบบใช้ร่วมกันสำหรับโฮสต์ OpenClaw Gateway ที่ทำงานระยะยาว
title: Docker VM Runtime
x-i18n:
    generated_at: "2026-04-23T05:39:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Docker VM Runtime

ขั้นตอน runtime แบบใช้ร่วมกันสำหรับการติดตั้ง Docker บน VM เช่น GCP, Hetzner และผู้ให้บริการ VPS ลักษณะเดียวกัน

## Bake ไบนารีที่จำเป็นเข้าไปใน image

การติดตั้งไบนารีภายในคอนเทนเนอร์ที่กำลังรันอยู่เป็นกับดัก
ทุกอย่างที่ติดตั้งตอน runtime จะหายไปเมื่อรีสตาร์ต

ไบนารีภายนอกทั้งหมดที่ Skills ต้องใช้ ต้องถูกติดตั้งตั้งแต่ขั้นตอน build image

ตัวอย่างด้านล่างแสดงเพียงสามไบนารีที่พบบ่อย:

- `gog` สำหรับการเข้าถึง Gmail
- `goplaces` สำหรับ Google Places
- `wacli` สำหรับ WhatsApp

สิ่งเหล่านี้เป็นเพียงตัวอย่าง ไม่ใช่รายการที่ครบถ้วน
คุณสามารถติดตั้งไบนารีได้มากเท่าที่ต้องการโดยใช้รูปแบบเดียวกัน

หากภายหลังคุณเพิ่ม Skills ใหม่ที่ต้องพึ่งไบนารีเพิ่มเติม คุณต้อง:

1. อัปเดต Dockerfile
2. สร้าง image ใหม่
3. รีสตาร์ตคอนเทนเนอร์

**ตัวอย่าง Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

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
URL สำหรับดาวน์โหลดด้านบนเป็นของ x86_64 (amd64) สำหรับ VM ที่ใช้ ARM (เช่น Hetzner ARM, GCP Tau T2A) ให้เปลี่ยน URL สำหรับดาวน์โหลดเป็นรุ่น ARM64 ที่เหมาะสมจากหน้า release ของแต่ละเครื่องมือ
</Note>

## Build และเปิดใช้งาน

```bash
docker compose build
docker compose up -d openclaw-gateway
```

หากการ build ล้มเหลวด้วย `Killed` หรือ `exit code 137` ระหว่าง `pnpm install --frozen-lockfile` แปลว่า VM หน่วยความจำไม่พอ
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

## อะไรถูกเก็บถาวรไว้ที่ไหน

OpenClaw รันอยู่ใน Docker แต่ Docker ไม่ใช่แหล่งข้อมูลจริง
สถานะระยะยาวทั้งหมดต้องอยู่รอดผ่านการรีสตาร์ต การ build ใหม่ และการรีบูต

| คอมโพเนนต์           | ตำแหน่ง                          | กลไกการเก็บถาวร  | หมายเหตุ                                                         |
| ------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| คอนฟิก Gateway      | `/home/node/.openclaw/`           | Host volume mount      | รวม `openclaw.json`, `.env`                              |
| auth profiles ของโมเดล | `/home/node/.openclaw/agents/`    | Host volume mount      | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| คอนฟิก Skills       | `/home/node/.openclaw/skills/`    | Host volume mount      | สถานะระดับ Skill                                             |
| workspace ของเอเจนต์     | `/home/node/.openclaw/workspace/` | Host volume mount      | โค้ดและอาร์ติแฟกต์ของเอเจนต์                                      |
| เซสชัน WhatsApp    | `/home/node/.openclaw/`           | Host volume mount      | เก็บสถานะการล็อกอิน QR                                            |
| Gmail keyring       | `/home/node/.openclaw/`           | Host volume + password | ต้องใช้ `GOG_KEYRING_PASSWORD`                               |
| ไบนารีภายนอก   | `/usr/local/bin/`                 | Docker image           | ต้อง bake ตั้งแต่ขั้นตอน build                                   |
| Node runtime        | Container filesystem              | Docker image           | สร้างใหม่ทุกครั้งที่ build image                                     |
| แพ็กเกจของระบบ         | Container filesystem              | Docker image           | ห้ามติดตั้งตอน runtime                                     |
| Docker container    | ไม่ถาวร                         | รีสตาร์ตได้            | ลบทิ้งได้อย่างปลอดภัย                                               |

## การอัปเดต

หากต้องการอัปเดต OpenClaw บน VM:

```bash
git pull
docker compose build
docker compose up -d
```
