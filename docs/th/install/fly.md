---
read_when:
    - การปรับใช้ OpenClaw บน Fly.io
    - การตั้งค่า Fly volumes, secrets และ config สำหรับการรันครั้งแรก
summary: การปรับใช้ OpenClaw บน Fly.io แบบทีละขั้นตอน พร้อมพื้นที่จัดเก็บถาวรและ HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-23T05:39:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# การปรับใช้ Fly.io

**เป้าหมาย:** ให้ OpenClaw Gateway ทำงานบน machine ของ [Fly.io](https://fly.io) พร้อมพื้นที่จัดเก็บถาวร, HTTPS อัตโนมัติ และการเข้าถึง Discord/ช่องทางต่าง ๆ

## สิ่งที่คุณต้องมี

- ติดตั้ง [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) แล้ว
- บัญชี Fly.io (free tier ก็ใช้ได้)
- การยืนยันตัวตนของโมเดล: API key สำหรับผู้ให้บริการโมเดลที่คุณเลือก
- ข้อมูลรับรองของช่องทาง: Discord bot token, Telegram token ฯลฯ

## เส้นทางแบบรวดเร็วสำหรับผู้เริ่มต้น

1. clone repo → ปรับแต่ง `fly.toml`
2. สร้าง app + volume → ตั้งค่า secrets
3. ปรับใช้ด้วย `fly deploy`
4. SSH เข้าไปเพื่อสร้าง config หรือใช้ Control UI

<Steps>
  <Step title="สร้างแอป Fly">
    ```bash
    # โคลน repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # สร้าง Fly app ใหม่ (ตั้งชื่อของคุณเอง)
    fly apps create my-openclaw

    # สร้าง persistent volume (โดยทั่วไป 1GB ก็พอ)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **เคล็ดลับ:** เลือก region ที่ใกล้คุณ ตัวเลือกที่พบบ่อย: `lhr` (ลอนดอน), `iad` (เวอร์จิเนีย), `sjc` (ซานโฮเซ)

  </Step>

  <Step title="กำหนดค่า fly.toml">
    แก้ไข `fly.toml` ให้ตรงกับชื่อแอปและความต้องการของคุณ

    **หมายเหตุด้านความปลอดภัย:** config เริ่มต้นจะเปิดเผย URL สาธารณะ สำหรับการปรับใช้แบบเสริมความแข็งแรงที่ไม่มี public IP ดู [Private Deployment](#private-deployment-hardened) หรือใช้ `fly.private.toml`

    ```toml
    app = "my-openclaw"  # ชื่อแอปของคุณ
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

    **การตั้งค่าสำคัญ:**

    | การตั้งค่า                      | เหตุผล                                                                    |
    | ------------------------------ | ------------------------------------------------------------------------- |
    | `--bind lan`                   | bind กับ `0.0.0.0` เพื่อให้ proxy ของ Fly เข้าถึง gateway ได้             |
    | `--allow-unconfigured`         | เริ่มทำงานได้โดยไม่มีไฟล์ config (คุณจะสร้างทีหลัง)                       |
    | `internal_port = 3000`         | ต้องตรงกับ `--port 3000` (หรือ `OPENCLAW_GATEWAY_PORT`) สำหรับ health check ของ Fly |
    | `memory = "2048mb"`            | 512MB เล็กเกินไป; แนะนำ 2GB                                               |
    | `OPENCLAW_STATE_DIR = "/data"` | ทำให้สถานะคงอยู่บน volume                                                 |

  </Step>

  <Step title="ตั้งค่า secrets">
    ```bash
    # จำเป็น: Gateway token (สำหรับการ bind ที่ไม่ใช่ loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API keys ของผู้ให้บริการโมเดล
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # ไม่บังคับ: ผู้ให้บริการอื่น
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # token ของช่องทาง
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **หมายเหตุ:**

    - การ bind แบบไม่ใช่ loopback (`--bind lan`) ต้องมีเส้นทาง auth ของ gateway ที่ถูกต้อง ตัวอย่าง Fly.io นี้ใช้ `OPENCLAW_GATEWAY_TOKEN` แต่ `gateway.auth.password` หรือ deployment แบบ non-loopback `trusted-proxy` ที่กำหนดถูกต้องก็ใช้ได้เช่นกัน
    - ให้ถือว่า token เหล่านี้เป็นเหมือนรหัสผ่าน
    - **ควรใช้ env var แทนไฟล์ config** สำหรับ API key และ token ทั้งหมด วิธีนี้ช่วยเก็บความลับไว้นอก `openclaw.json` ซึ่งอาจถูกเปิดเผยหรือบันทึกลงล็อกโดยไม่ตั้งใจได้

  </Step>

  <Step title="ปรับใช้">
    ```bash
    fly deploy
    ```

    การปรับใช้ครั้งแรกจะ build Docker image (~2-3 นาที) การปรับใช้ครั้งต่อ ๆ ไปจะเร็วขึ้น

    หลังการปรับใช้ ให้ตรวจสอบ:

    ```bash
    fly status
    fly logs
    ```

    คุณควรเห็น:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="สร้างไฟล์ config">
    SSH เข้าเครื่องเพื่อสร้าง config ที่เหมาะสม:

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

    **หมายเหตุ:** เมื่อใช้ `OPENCLAW_STATE_DIR=/data` พาธของ config คือ `/data/openclaw.json`

    **หมายเหตุ:** Discord token สามารถมาจากอย่างใดอย่างหนึ่งต่อไปนี้:

    - ตัวแปรสภาพแวดล้อม: `DISCORD_BOT_TOKEN` (แนะนำสำหรับความลับ)
    - ไฟล์ config: `channels.discord.token`

    หากใช้ env var ก็ไม่จำเป็นต้องเพิ่ม token ลงใน config gateway จะอ่าน `DISCORD_BOT_TOKEN` โดยอัตโนมัติ

    รีสตาร์ตเพื่อนำไปใช้:

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

    ยืนยันตัวตนด้วย shared secret ที่กำหนดไว้ คู่มือนี้ใช้ gateway
    token จาก `OPENCLAW_GATEWAY_TOKEN`; หากคุณเปลี่ยนไปใช้ password auth ให้ใช้
    รหัสผ่านนั้นแทน

    ### ล็อก

    ```bash
    fly logs              # ล็อกแบบสด
    fly logs --no-tail    # ล็อกล่าสุด
    ```

    ### SSH Console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## การแก้ไขปัญหา

### "App is not listening on expected address"

gateway กำลัง bind กับ `127.0.0.1` แทนที่จะเป็น `0.0.0.0`

**วิธีแก้:** เพิ่ม `--bind lan` ในคำสั่ง process ของคุณใน `fly.toml`

### Health check ล้มเหลว / connection refused

Fly เข้าถึง gateway ที่พอร์ตที่กำหนดไม่ได้

**วิธีแก้:** ตรวจสอบให้แน่ใจว่า `internal_port` ตรงกับพอร์ตของ gateway (ตั้ง `--port 3000` หรือ `OPENCLAW_GATEWAY_PORT=3000`)

### OOM / ปัญหาหน่วยความจำ

container รีสตาร์ตตลอดหรือถูก kill สัญญาณที่พบ: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` หรือรีสตาร์ตเงียบ ๆ

**วิธีแก้:** เพิ่มหน่วยความจำใน `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

หรืออัปเดต machine ที่มีอยู่แล้ว:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**หมายเหตุ:** 512MB เล็กเกินไป 1GB อาจใช้ได้แต่สามารถ OOM ได้เมื่อมีโหลดหรือมีการบันทึกล็อกจำนวนมาก **แนะนำ 2GB**

### ปัญหา Gateway Lock

Gateway ปฏิเสธการเริ่มทำงานพร้อมข้อผิดพลาดว่า "already running"

เหตุการณ์นี้เกิดขึ้นเมื่อ container รีสตาร์ต แต่ไฟล์ PID lock ยังคงอยู่บน volume

**วิธีแก้:** ลบไฟล์ lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

ไฟล์ lock อยู่ที่ `/data/gateway.*.lock` (ไม่ใช่ในไดเรกทอรีย่อย)

### Config ไม่ถูกอ่าน

`--allow-unconfigured` เพียงแค่ข้าม startup guard เท่านั้น มันไม่ได้สร้างหรือซ่อม `/data/openclaw.json` ดังนั้นให้แน่ใจว่า config จริงของคุณมีอยู่และมี `gateway.mode="local"` เมื่อคุณต้องการให้ gateway แบบ local เริ่มทำงานตามปกติ

ตรวจสอบว่า config มีอยู่:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### การเขียน config ผ่าน SSH

คำสั่ง `fly ssh console -C` ไม่รองรับ shell redirection หากต้องการเขียนไฟล์ config:

```bash
# ใช้ echo + tee (pipe จาก local ไปยัง remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# หรือใช้ sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**หมายเหตุ:** `fly sftp` อาจล้มเหลวหากไฟล์มีอยู่แล้ว ให้ลบก่อน:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### สถานะไม่คงอยู่

หากคุณสูญเสีย auth profile, สถานะของช่องทาง/ผู้ให้บริการ หรือเซสชันหลังจากรีสตาร์ต
แปลว่า state dir กำลังเขียนลงระบบไฟล์ของ container

**วิธีแก้:** ตรวจสอบให้แน่ใจว่าได้ตั้ง `OPENCLAW_STATE_DIR=/data` ใน `fly.toml` แล้ว และปรับใช้ใหม่

## การอัปเดต

```bash
# ดึงการเปลี่ยนแปลงล่าสุด
git pull

# ปรับใช้ใหม่
fly deploy

# ตรวจสอบสุขภาพ
fly status
fly logs
```

### การอัปเดตคำสั่งของ Machine

หากคุณต้องการเปลี่ยนคำสั่งเริ่มต้นโดยไม่ต้องปรับใช้ใหม่ทั้งหมด:

```bash
# ดู machine ID
fly machines list

# อัปเดตคำสั่ง
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# หรือพร้อมเพิ่มหน่วยความจำ
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**หมายเหตุ:** หลัง `fly deploy` คำสั่งของ machine อาจถูกรีเซ็ตกลับไปเป็นค่าที่อยู่ใน `fly.toml` หากคุณเปลี่ยนแบบ manual ให้ใช้การเปลี่ยนแปลงนั้นซ้ำอีกครั้งหลังการปรับใช้

## การปรับใช้แบบส่วนตัว (เสริมความแข็งแรง)

โดยค่าเริ่มต้น Fly จะจัดสรร public IP ทำให้ gateway ของคุณเข้าถึงได้ที่ `https://your-app.fly.dev` แม้ว่าจะสะดวก แต่ก็หมายความว่าการปรับใช้ของคุณสามารถถูกค้นพบโดยตัวสแกนบนอินเทอร์เน็ตได้ (Shodan, Censys ฯลฯ)

สำหรับการปรับใช้แบบเสริมความแข็งแรงที่ **ไม่มีการเปิดเผยสู่สาธารณะ** ให้ใช้เทมเพลตแบบ private

### เมื่อใดควรใช้การปรับใช้แบบ private

- คุณทำเฉพาะการเรียก/ส่งข้อความ **ขาออก** (ไม่มี inbound Webhook)
- คุณใช้ **ngrok หรือ Tailscale** tunnel สำหรับ Webhook callback ใด ๆ
- คุณเข้าถึง gateway ผ่าน **SSH, proxy หรือ WireGuard** แทนเบราว์เซอร์
- คุณต้องการให้การปรับใช้ **ซ่อนจากตัวสแกนอินเทอร์เน็ต**

### การตั้งค่า

ใช้ `fly.private.toml` แทน config มาตรฐาน:

```bash
# ปรับใช้ด้วย config แบบ private
fly deploy -c fly.private.toml
```

หรือแปลงการปรับใช้ที่มีอยู่แล้ว:

```bash
# แสดง IP ปัจจุบัน
fly ips list -a my-openclaw

# ปล่อย public IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# สลับไปใช้ config แบบ private เพื่อไม่ให้การปรับใช้ครั้งถัดไปจัดสรร public IP ใหม่
# (ลบ [http_service] หรือปรับใช้ด้วยเทมเพลต private)
fly deploy -c fly.private.toml

# จัดสรร private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

หลังจากนั้น `fly ips list` ควรแสดงเฉพาะ IP ประเภท `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### การเข้าถึงการปรับใช้แบบ private

เนื่องจากไม่มี URL สาธารณะ ให้ใช้หนึ่งในวิธีต่อไปนี้:

**ตัวเลือก 1: proxy ในเครื่อง (ง่ายที่สุด)**

```bash
# ส่งต่อพอร์ตในเครื่อง 3000 ไปยังแอป
fly proxy 3000:3000 -a my-openclaw

# จากนั้นเปิด http://localhost:3000 ในเบราว์เซอร์
```

**ตัวเลือก 2: WireGuard VPN**

```bash
# สร้าง config ของ WireGuard (ครั้งเดียว)
fly wireguard create

# นำเข้าไปยังไคลเอนต์ WireGuard แล้วเข้าถึงผ่าน internal IPv6
# ตัวอย่าง: http://[fdaa:x:x:x:x::x]:3000
```

**ตัวเลือก 3: SSH เท่านั้น**

```bash
fly ssh console -a my-openclaw
```

### Webhook กับการปรับใช้แบบ private

หากคุณต้องการ Webhook callback (Twilio, Telnyx ฯลฯ) โดยไม่เปิดเผยสู่สาธารณะ:

1. **ngrok tunnel** - รัน ngrok ภายใน container หรือเป็น sidecar
2. **Tailscale Funnel** - เปิดเผยเฉพาะบางพาธผ่าน Tailscale
3. **ขาออกเท่านั้น** - ผู้ให้บริการบางราย (เช่น Twilio) ทำงานได้ดีสำหรับการโทรขาออกโดยไม่ต้องมี Webhook

ตัวอย่าง config สำหรับการโทรด้วยเสียงร่วมกับ ngrok:

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

ngrok tunnel จะรันอยู่ภายใน container และให้ URL ของ Webhook แบบสาธารณะโดยไม่ต้องเปิดเผยตัวแอป Fly เอง ตั้งค่า `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์ของ tunnel สาธารณะ เพื่อให้ระบบยอมรับ forwarded host headers

### ประโยชน์ด้านความปลอดภัย

| ด้าน                | แบบสาธารณะ   | แบบ private |
| ------------------- | ------------ | ----------- |
| ตัวสแกนอินเทอร์เน็ต | ค้นพบได้      | ซ่อนอยู่     |
| การโจมตีโดยตรง      | เป็นไปได้     | ถูกบล็อก     |
| การเข้าถึง Control UI | เบราว์เซอร์ | Proxy/VPN   |
| การส่ง Webhook      | โดยตรง        | ผ่าน tunnel |

## หมายเหตุ

- Fly.io ใช้ **สถาปัตยกรรม x86** (ไม่ใช่ ARM)
- Dockerfile เข้ากันได้กับทั้งสองสถาปัตยกรรม
- สำหรับ onboarding ของ WhatsApp/Telegram ให้ใช้ `fly ssh console`
- ข้อมูลถาวรจะอยู่บน volume ที่ `/data`
- Signal ต้องใช้ Java + signal-cli; ให้ใช้ image แบบกำหนดเองและคงหน่วยความจำไว้ที่ 2GB ขึ้นไป

## ค่าใช้จ่าย

ด้วย config ที่แนะนำ (`shared-cpu-2x`, RAM 2GB):

- ประมาณ ~$10-15/เดือน ขึ้นอยู่กับการใช้งาน
- free tier มีโควตาบางส่วนให้

ดูรายละเอียดได้ที่ [ราคา Fly.io](https://fly.io/docs/about/pricing/)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการส่งข้อความ: [Channels](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- ทำให้ OpenClaw ทันสมัยอยู่เสมอ: [Updating](/th/install/updating)
