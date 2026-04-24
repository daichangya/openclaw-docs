---
read_when:
    - การ deploy OpenClaw บน Fly.io
    - การตั้งค่า Fly volumes, secrets และ config สำหรับการรันครั้งแรก
summary: การ deploy OpenClaw บน Fly.io แบบทีละขั้นตอน พร้อม persistent storage และ HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-24T09:17:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8913b6917c23de69865c57ec6a455f3e615bc65b09334edec0a3fe8ff69cf503
    source_path: install/fly.md
    workflow: 15
---

# การ deploy บน Fly.io

**เป้าหมาย:** ให้ OpenClaw Gateway ทำงานบนเครื่อง [Fly.io](https://fly.io) พร้อม persistent storage, HTTPS อัตโนมัติ และการเข้าถึง Discord/ช่องทางต่าง ๆ

## สิ่งที่คุณต้องมี

- ติดตั้ง [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) แล้ว
- บัญชี Fly.io (ใช้ free tier ได้)
- model auth: API key สำหรับผู้ให้บริการโมเดลที่คุณเลือก
- ข้อมูลรับรองของช่องทาง: Discord bot token, Telegram token เป็นต้น

## เส้นทางลัดสำหรับผู้เริ่มต้น

1. clone รีโป → ปรับแต่ง `fly.toml`
2. สร้าง app + volume → ตั้งค่า secrets
3. deploy ด้วย `fly deploy`
4. SSH เข้าไปเพื่อสร้าง config หรือใช้ Control UI

<Steps>
  <Step title="สร้าง Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **เคล็ดลับ:** เลือก region ที่ใกล้คุณ ตัวเลือกที่พบบ่อย: `lhr` (ลอนดอน), `iad` (เวอร์จิเนีย), `sjc` (ซานโฮเซ)

  </Step>

  <Step title="กำหนดค่า fly.toml">
    แก้ไข `fly.toml` ให้ตรงกับชื่อ app และความต้องการของคุณ

    **หมายเหตุด้านความปลอดภัย:** config เริ่มต้นจะเปิดเผย URL สาธารณะ หากต้องการ deployment แบบแข็งแรงที่ไม่มี public IP โปรดดู [Private Deployment](#private-deployment-hardened) หรือใช้ `fly.private.toml`

    ```toml
    app = "my-openclaw"  # ชื่อ app ของคุณ
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **การตั้งค่าหลัก:**

    | การตั้งค่า | เหตุผล |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan` | bind ไปที่ `0.0.0.0` เพื่อให้ proxy ของ Fly เข้าถึง gateway ได้ |
    | `--allow-unconfigured` | เริ่มได้โดยไม่มีไฟล์ config (คุณจะสร้างภายหลัง) |
    | `internal_port = 3000` | ต้องตรงกับ `--port 3000` (หรือ `OPENCLAW_GATEWAY_PORT`) สำหรับ health checks ของ Fly |
    | `memory = "2048mb"` | 512MB น้อยเกินไป; แนะนำ 2GB |
    | `OPENCLAW_STATE_DIR = "/data"` | ทำให้ state ถูกเก็บถาวรบน volume |

  </Step>

  <Step title="ตั้งค่า secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **หมายเหตุ:**

    - การ bind แบบ non-loopback (`--bind lan`) ต้องมีเส้นทาง auth ของ gateway ที่ถูกต้อง ตัวอย่าง Fly.io นี้ใช้ `OPENCLAW_GATEWAY_TOKEN` แต่ `gateway.auth.password` หรือ deployment แบบ non-loopback `trusted-proxy` ที่ตั้งค่าอย่างถูกต้องก็ใช้ได้เช่นกัน
    - ให้ถือว่า tokens เหล่านี้เป็นรหัสผ่าน
    - **ควรใช้ env vars แทน config file** สำหรับ API keys และ tokens ทั้งหมด วิธีนี้ช่วยกัน secrets ออกจาก `openclaw.json` ซึ่งอาจถูกเปิดเผยหรือถูกบันทึกใน log โดยไม่ตั้งใจ

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    การ deploy ครั้งแรกจะ build Docker image (~2-3 นาที) การ deploy ครั้งถัดไปจะเร็วกว่า

    หลัง deployment ให้ตรวจสอบ:

    ```bash
    fly status
    fly logs
    ```

    คุณควรเห็น:

    ```text
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="สร้างไฟล์ config">
    SSH เข้าไปในเครื่องเพื่อสร้าง config ที่ถูกต้อง:

    ```bash
    fly ssh console
    ```

    สร้างไดเรกทอรีและไฟล์ config:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **หมายเหตุ:** เมื่อใช้ `OPENCLAW_STATE_DIR=/data` เส้นทาง config จะเป็น `/data/openclaw.json`

    **หมายเหตุ:** Discord token สามารถมาจากอย่างใดอย่างหนึ่ง:

    - ตัวแปรสภาพแวดล้อม: `DISCORD_BOT_TOKEN` (แนะนำสำหรับ secrets)
    - Config file: `channels.discord.token`

    หากใช้ env var ก็ไม่จำเป็นต้องเพิ่ม token ลงใน config Gateway จะอ่าน `DISCORD_BOT_TOKEN` โดยอัตโนมัติ

    รีสตาร์ตเพื่อให้มีผล:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="เข้าถึง Gateway">
    ### Control UI

    เปิดในเบราว์เซอร์:

    ```bash
    fly open
    ```

    หรือไปที่ `https://my-openclaw.fly.dev/`

    ยืนยันตัวตนด้วย shared secret ที่กำหนดค่าไว้ คู่มือนี้ใช้ gateway
    token จาก `OPENCLAW_GATEWAY_TOKEN`; หากคุณเปลี่ยนไปใช้ password auth ให้ใช้
    รหัสผ่านนั้นแทน

    ### Logs

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH Console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## การแก้ไขปัญหา

### "App is not listening on expected address"

gateway กำลัง bind ไปที่ `127.0.0.1` แทน `0.0.0.0`

**วิธีแก้:** เพิ่ม `--bind lan` ในคำสั่ง process ของคุณใน `fly.toml`

### Health checks failing / connection refused

Fly เข้าถึง gateway ไม่ได้บนพอร์ตที่กำหนดค่าไว้

**วิธีแก้:** ตรวจสอบให้แน่ใจว่า `internal_port` ตรงกับพอร์ตของ gateway (ตั้ง `--port 3000` หรือ `OPENCLAW_GATEWAY_PORT=3000`)

### OOM / ปัญหาหน่วยความจำ

คอนเทนเนอร์รีสตาร์ตหรือถูก kill อยู่ตลอด สัญญาณได้แก่: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` หรือรีสตาร์ตแบบเงียบ ๆ

**วิธีแก้:** เพิ่มหน่วยความจำใน `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

หรืออัปเดตเครื่องที่มีอยู่แล้ว:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**หมายเหตุ:** 512MB น้อยเกินไป 1GB อาจพอใช้ได้ แต่มีโอกาส OOM เมื่อมีโหลดหรือเปิด verbose logging **แนะนำ 2GB**

### ปัญหา Gateway Lock

Gateway ปฏิเสธการเริ่มต้นด้วยข้อผิดพลาด "already running"

สิ่งนี้เกิดขึ้นเมื่อคอนเทนเนอร์รีสตาร์ต แต่ไฟล์ PID lock ยังค้างอยู่บน volume

**วิธีแก้:** ลบไฟล์ lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

ไฟล์ lock อยู่ที่ `/data/gateway.*.lock` (ไม่ใช่ในไดเรกทอรีย่อย)

### Config ไม่ถูกอ่าน

`--allow-unconfigured` แค่ข้ามตัวป้องกันตอนเริ่มต้นเท่านั้น มันไม่ได้สร้างหรือซ่อม `/data/openclaw.json` ดังนั้นให้แน่ใจว่า config จริงของคุณมีอยู่และมี `gateway.mode="local"` เมื่อคุณต้องการเริ่ม gateway แบบโลคัลตามปกติ

ตรวจสอบว่า config มีอยู่:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### การเขียน Config ผ่าน SSH

คำสั่ง `fly ssh console -C` ไม่รองรับ shell redirection หากต้องการเขียนไฟล์ config:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**หมายเหตุ:** `fly sftp` อาจล้มเหลวหากไฟล์มีอยู่แล้ว ให้ลบก่อน:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### State ไม่คงอยู่

หากคุณสูญเสีย auth profiles, state ของช่องทาง/ผู้ให้บริการ หรือ sessions หลังรีสตาร์ต
แปลว่า state dir กำลังเขียนลงระบบไฟล์ของคอนเทนเนอร์

**วิธีแก้:** ตรวจสอบให้แน่ใจว่าได้ตั้ง `OPENCLAW_STATE_DIR=/data` ใน `fly.toml` แล้วและ deploy ใหม่

## การอัปเดต

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### การอัปเดตคำสั่งของ Machine

หากคุณต้องการเปลี่ยนคำสั่งเริ่มต้นโดยไม่ deploy ใหม่ทั้งชุด:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**หมายเหตุ:** หลัง `fly deploy` คำสั่งของ machine อาจถูกรีเซ็ตกลับไปเป็นสิ่งที่อยู่ใน `fly.toml` หากคุณมีการเปลี่ยนแบบแมนนวล ให้ตั้งค่าใหม่อีกครั้งหลัง deploy

## Private Deployment (แบบแข็งแรง)

ตามค่าเริ่มต้น Fly จะจัดสรร public IPs ทำให้ gateway ของคุณเข้าถึงได้ที่ `https://your-app.fly.dev` สิ่งนี้สะดวก แต่ก็หมายความว่า deployment ของคุณถูกค้นพบได้โดย internet scanners (Shodan, Censys เป็นต้น)

หากต้องการ deployment แบบแข็งแรงที่ **ไม่เปิดเผยสู่สาธารณะเลย** ให้ใช้เทมเพลตแบบ private

### เมื่อใดควรใช้ private deployment

- คุณทำเฉพาะการเรียก/ส่งข้อความ **ขาออก**
- คุณใช้ **ngrok หรือ Tailscale** tunnels สำหรับ webhook callbacks
- คุณเข้าถึง gateway ผ่าน **SSH, proxy หรือ WireGuard** แทนเบราว์เซอร์
- คุณต้องการให้ deployment **ซ่อนจาก internet scanners**

### การตั้งค่า

ใช้ `fly.private.toml` แทน config มาตรฐาน:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

หรือแปลง deployment ที่มีอยู่:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

หลังจากนั้น `fly ips list` ควรแสดงเฉพาะ IP ประเภท `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### การเข้าถึง private deployment

เนื่องจากไม่มี public URL ให้ใช้วิธีใดวิธีหนึ่งต่อไปนี้:

**ตัวเลือก 1: Local proxy (ง่ายที่สุด)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**ตัวเลือก 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**ตัวเลือก 3: SSH เท่านั้น**

```bash
fly ssh console -a my-openclaw
```

### Webhooks กับ private deployment

หากคุณต้องการ webhook callbacks (Twilio, Telnyx เป็นต้น) โดยไม่เปิดเผยสู่สาธารณะ:

1. **ngrok tunnel** - รัน ngrok ภายในคอนเทนเนอร์หรือเป็น sidecar
2. **Tailscale Funnel** - เปิดเผยเฉพาะเส้นทางที่ต้องการผ่าน Tailscale
3. **Outbound-only** - ผู้ให้บริการบางราย (เช่น Twilio) ทำงานได้ดีกับการโทรขาออกโดยไม่ต้องใช้ webhooks

ตัวอย่าง config การโทรด้วยเสียงพร้อม ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

ngrok tunnel จะรันภายในคอนเทนเนอร์และให้ public webhook URL โดยไม่เปิดเผยตัว Fly app เอง ให้ตั้ง `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์ของ public tunnel เพื่อยอมรับ forwarded host headers

### ประโยชน์ด้านความปลอดภัย

| ด้าน | Public | Private |
| ----------------- | ------------ | ---------- |
| Internet scanners | ถูกค้นพบได้ | ซ่อนอยู่ |
| การโจมตีโดยตรง | เป็นไปได้ | ถูกบล็อก |
| การเข้าถึง Control UI | ผ่านเบราว์เซอร์ | ผ่าน Proxy/VPN |
| การส่ง webhook | โดยตรง | ผ่าน tunnel |

## หมายเหตุ

- Fly.io ใช้ **สถาปัตยกรรม x86** (ไม่ใช่ ARM)
- Dockerfile เข้ากันได้กับทั้งสองสถาปัตยกรรม
- สำหรับการเริ่มต้นใช้งาน WhatsApp/Telegram ให้ใช้ `fly ssh console`
- ข้อมูลแบบ persistent อยู่บน volume ที่ `/data`
- Signal ต้องใช้ Java + signal-cli; ให้ใช้ custom image และคงหน่วยความจำไว้ที่ 2GB ขึ้นไป

## ค่าใช้จ่าย

ด้วย config ที่แนะนำ (`shared-cpu-2x`, RAM 2GB):

- ประมาณ ~$10-15/เดือน ขึ้นอยู่กับการใช้งาน
- free tier มีสิทธิ์ใช้งานบางส่วนรวมอยู่แล้ว

ดูรายละเอียดที่ [Fly.io pricing](https://fly.io/docs/about/pricing/)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางส่งข้อความ: [Channels](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้ทันสมัยอยู่เสมอ: [การอัปเดต](/th/install/updating)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Hetzner](/th/install/hetzner)
- [Docker](/th/install/docker)
- [โฮสติ้งแบบ VPS](/th/vps)
