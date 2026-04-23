---
read_when:
    - กำลังรันหรือดีบักโปรเซส Gateway
summary: คู่มือการปฏิบัติงานสำหรับบริการ Gateway วงจรชีวิต และการดำเนินงาน
title: คู่มือการปฏิบัติงาน Gateway
x-i18n:
    generated_at: "2026-04-23T05:33:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# คู่มือการปฏิบัติงาน Gateway

ใช้หน้านี้สำหรับการเริ่มต้นใช้งานในวันแรกและการปฏิบัติงานในวันถัดๆ ไปของบริการ Gateway

<CardGroup cols={2}>
  <Card title="การแก้ไขปัญหาเชิงลึก" icon="siren" href="/th/gateway/troubleshooting">
    การวินิจฉัยที่เริ่มจากอาการ พร้อมลำดับคำสั่งและลายเซ็นของ log แบบชัดเจน
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    คู่มือการตั้งค่าที่อิงตามงาน + เอกสารอ้างอิงการกำหนดค่าแบบเต็ม
  </Card>
  <Card title="การจัดการความลับ" icon="key-round" href="/th/gateway/secrets">
    สัญญา SecretRef, พฤติกรรม runtime snapshot และการดำเนินการ migrate/reload
  </Card>
  <Card title="สัญญาแผนความลับ" icon="shield-check" href="/th/gateway/secrets-plan-contract">
    กฎ `secrets apply` สำหรับ target/path แบบชัดเจน และพฤติกรรม auth-profile แบบอ้างอิงเท่านั้น
  </Card>
</CardGroup>

## การเริ่มต้นแบบ local ใน 5 นาที

<Steps>
  <Step title="เริ่ม Gateway">

```bash
openclaw gateway --port 18789
# debug/trace สะท้อนออกไปยัง stdio
openclaw gateway --port 18789 --verbose
# force-kill ตัวฟังบนพอร์ตที่เลือก แล้วเริ่มใหม่
openclaw gateway --force
```

  </Step>

  <Step title="ตรวจสอบสุขภาพของบริการ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

ค่าพื้นฐานที่ถือว่าปกติ: `Runtime: running`, `Connectivity probe: ok` และ `Capability: ...` ที่ตรงกับสิ่งที่คุณคาดไว้ ใช้ `openclaw gateway status --require-rpc` เมื่อคุณต้องการหลักฐาน RPC แบบ read-scope ไม่ใช่แค่การเข้าถึงได้เท่านั้น

  </Step>

  <Step title="ตรวจสอบความพร้อมของช่องทาง">

```bash
openclaw channels status --probe
```

เมื่อ Gateway เข้าถึงได้ คำสั่งนี้จะรัน live per-account channel probes และ audit แบบไม่บังคับ
หากเข้าถึง Gateway ไม่ได้ CLI จะ fallback ไปใช้สรุปช่องทางจากคอนฟิกอย่างเดียว
แทนเอาต์พุตของ live probe

  </Step>
</Steps>

<Note>
การ reload คอนฟิกของ Gateway จะเฝ้าดูพาธไฟล์คอนฟิกที่ใช้งานอยู่ (resolve จากค่าเริ่มต้นของ profile/state หรือ `OPENCLAW_CONFIG_PATH` เมื่อมีการตั้งค่าไว้)
โหมดเริ่มต้นคือ `gateway.reload.mode="hybrid"`
หลังจากโหลดสำเร็จครั้งแรก โปรเซสที่กำลังรันจะให้บริการจาก in-memory config snapshot ที่กำลังใช้งานอยู่; เมื่อ reload สำเร็จ snapshot นั้นจะถูกสลับแบบอะตอมิก
</Note>

## โมเดลรันไทม์

- โปรเซสเดียวที่ทำงานตลอดเวลา สำหรับการกำหนดเส้นทาง control plane และการเชื่อมต่อช่องทาง
- พอร์ตเดียวแบบ multiplexed สำหรับ:
  - WebSocket control/RPC
  - HTTP APIs ที่เข้ากันได้กับ OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI และ hooks
- โหมด bind เริ่มต้น: `loopback`
- ต้องมี auth โดยค่าเริ่มต้น การตั้งค่าแบบ shared-secret ใช้
  `gateway.auth.token` / `gateway.auth.password` (หรือ
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) และการตั้งค่า
  reverse-proxy แบบ non-loopback สามารถใช้ `gateway.auth.mode: "trusted-proxy"` ได้

## endpoints ที่เข้ากันได้กับ OpenAI

พื้นผิวความเข้ากันได้ที่มีแรงส่งมากที่สุดของ OpenClaw ตอนนี้คือ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

เหตุผลที่ชุดนี้สำคัญ:

- การเชื่อมต่อ Open WebUI, LobeChat และ LibreChat ส่วนใหญ่จะตรวจสอบ `/v1/models` ก่อน
- ไปป์ไลน์ RAG และ memory จำนวนมากคาดหวัง `/v1/embeddings`
- client แบบ agent-native มีแนวโน้มจะเลือกใช้ `/v1/responses` มากขึ้น

หมายเหตุสำหรับการวางแผน:

- `/v1/models` เป็น agent-first: มันจะคืนค่า `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
- `openclaw/default` เป็น alias ที่เสถียร ซึ่งแมปไปยังเอเจนต์เริ่มต้นที่กำหนดค่าไว้เสมอ
- ใช้ `x-openclaw-model` เมื่อคุณต้องการแทนที่ backend provider/model; ไม่เช่นนั้นการตั้งค่าโมเดลและ embedding ปกติของเอเจนต์ที่เลือกจะยังคงเป็นผู้ควบคุม

ทั้งหมดนี้ทำงานบนพอร์ตหลักของ Gateway และใช้ขอบเขต auth ของ trusted operator แบบเดียวกับ HTTP API ส่วนอื่นของ Gateway

### ลำดับความสำคัญของพอร์ตและ bind

| การตั้งค่า      | ลำดับการ resolve                                              |
| ------------ | ------------------------------------------------------------- |
| พอร์ต Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| โหมด bind    | CLI/override → `gateway.bind` → `loopback`                    |

### โหมด Hot reload

| `gateway.reload.mode` | พฤติกรรม                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | ไม่ reload คอนฟิก                           |
| `hot`                 | ใช้เฉพาะการเปลี่ยนแปลงที่ hot-safe                |
| `restart`             | รีสตาร์ตเมื่อมีการเปลี่ยนแปลงที่ต้อง reload         |
| `hybrid` (ค่าเริ่มต้น)    | ใช้แบบ hot เมื่อปลอดภัย และรีสตาร์ตเมื่อจำเป็น |

## ชุดคำสั่งสำหรับ operator

```bash
openclaw gateway status
openclaw gateway status --deep   # เพิ่มการสแกนบริการระดับระบบ
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` ใช้สำหรับการค้นหาบริการเพิ่มเติม (LaunchDaemons/systemd system
units/schtasks) ไม่ใช่การตรวจสุขภาพ RPC ที่ลึกขึ้น

## หลาย Gateway (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรรัน Gateway หนึ่งตัวต่อหนึ่งเครื่อง Gateway ตัวเดียวสามารถโฮสต์ได้หลาย
เอเจนต์และหลายช่องทาง

คุณจำเป็นต้องมีหลาย Gateway ก็ต่อเมื่อคุณต้องการแยกขาดหรือมี rescue bot โดยตั้งใจเท่านั้น

การตรวจสอบที่มีประโยชน์:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

สิ่งที่ควรคาดหวัง:

- `gateway status --deep` อาจรายงาน `Other gateway-like services detected (best effort)`
  และแสดงคำแนะนำในการล้างเมื่อยังมีการติดตั้ง launchd/systemd/schtasks เก่าหลงเหลืออยู่
- `gateway probe` สามารถเตือนว่า `multiple reachable gateways` เมื่อมีมากกว่าหนึ่ง target
  ที่ตอบกลับ
- หากเป็นสิ่งที่ตั้งใจไว้ ให้แยกพอร์ต, config/state และ workspace roots ต่อ Gateway

รายละเอียดการตั้งค่า: [/gateway/multiple-gateways](/th/gateway/multiple-gateways)

## การเข้าถึงจากระยะไกล

วิธีที่แนะนำ: Tailscale/VPN
วิธีสำรอง: SSH tunnel

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

จากนั้นเชื่อมต่อ clients ในเครื่องไปที่ `ws://127.0.0.1:18789`

<Warning>
SSH tunnel ไม่ได้ข้าม auth ของ Gateway สำหรับ auth แบบ shared-secret client ยังคง
ต้องส่ง `token`/`password` แม้จะผ่าน tunnel ก็ตาม สำหรับโหมดที่มีการระบุตัวตน
คำขอก็ยังต้องผ่านเส้นทาง auth นั้นอยู่ดี
</Warning>

ดู: [Remote Gateway](/th/gateway/remote), [Authentication](/th/gateway/authentication), [Tailscale](/th/gateway/tailscale)

## การควบคุมดูแลและวงจรชีวิตของบริการ

ใช้การรันแบบมีตัวควบคุมดูแลสำหรับความเชื่อถือได้ในระดับ production

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

label ของ LaunchAgent คือ `ai.openclaw.gateway` (ค่าเริ่มต้น) หรือ `ai.openclaw.<profile>` (profile แบบมีชื่อ) `openclaw doctor` จะ audit และซ่อมการ drift ของคอนฟิกบริการ

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

หากต้องการให้คงอยู่หลัง logout ให้เปิด lingering:

```bash
sudo loginctl enable-linger <user>
```

ตัวอย่าง user-unit แบบ manual เมื่อคุณต้องการพาธติดตั้งแบบกำหนดเอง:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

การเริ่มต้นแบบมีตัวจัดการของ Windows native ใช้ Scheduled Task ชื่อ `OpenClaw Gateway`
(หรือ `OpenClaw Gateway (<profile>)` สำหรับ profile แบบมีชื่อ) หากการสร้าง Scheduled Task
ถูกปฏิเสธ OpenClaw จะ fallback ไปใช้ตัวเรียกใช้งานใน Startup folder แบบ per-user
ซึ่งชี้ไปยัง `gateway.cmd` ภายใน state directory

  </Tab>

  <Tab title="Linux (system service)">

ใช้ system unit สำหรับโฮสต์แบบหลายผู้ใช้/ทำงานตลอดเวลา

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ใช้เนื้อหาบริการเดียวกับ user unit แต่ติดตั้งไว้ภายใต้
`/etc/systemd/system/openclaw-gateway[-<profile>].service` และปรับ
`ExecStart=` หากไบนารี `openclaw` ของคุณอยู่คนละตำแหน่ง

  </Tab>
</Tabs>

## หลาย Gateway บนโฮสต์เดียว

การตั้งค่าส่วนใหญ่ควรรัน **Gateway เพียงหนึ่งตัว**
ใช้หลายตัวเฉพาะเมื่อต้องการการแยกขาด/ความซ้ำซ้อนอย่างเข้มงวด (เช่น rescue profile)

เช็กลิสต์ต่อหนึ่งอินสแตนซ์:

- `gateway.port` ต้องไม่ซ้ำกัน
- `OPENCLAW_CONFIG_PATH` ต้องไม่ซ้ำกัน
- `OPENCLAW_STATE_DIR` ต้องไม่ซ้ำกัน
- `agents.defaults.workspace` ต้องไม่ซ้ำกัน

ตัวอย่าง:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

ดู: [Multiple gateways](/th/gateway/multiple-gateways)

### เส้นทางด่วนสำหรับ dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

ค่าเริ่มต้นจะรวม state/config ที่แยกจากกัน และพอร์ต Gateway ฐาน `19001`

## ข้อมูลอ้างอิงโปรโตคอลแบบย่อ (มุมมอง operator)

- เฟรมแรกของ client ต้องเป็น `connect`
- Gateway จะคืน snapshot แบบ `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)
- `hello-ok.features.methods` / `events` เป็นรายการ discovery แบบ conservative ไม่ใช่
  dump ที่สร้างขึ้นของทุก helper route ที่เรียกได้
- Requests: `req(method, params)` → `res(ok/payload|error)`
- events ที่พบบ่อย ได้แก่ `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, events วงจรชีวิต pairing/approval และ `shutdown`

การรันเอเจนต์มีสองช่วง:

1. accepted ack ทันที (`status:"accepted"`)
2. การตอบกลับตอนเสร็จสิ้นขั้นสุดท้าย (`status:"ok"|"error"`) พร้อม `agent` events แบบสตรีมคั่นอยู่ระหว่างกลาง

ดูเอกสารโปรโตคอลเต็มได้ที่: [Gateway Protocol](/th/gateway/protocol)

## การตรวจสอบเชิงปฏิบัติการ

### Liveness

- เปิด WS และส่ง `connect`
- คาดว่าจะได้การตอบกลับ `hello-ok` พร้อม snapshot

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### การกู้คืนช่องว่าง

events จะไม่ถูก replay หากมี sequence gap ให้รีเฟรชสถานะ (`health`, `system-presence`) ก่อนดำเนินการต่อ

## ลายเซ็นความล้มเหลวที่พบบ่อย

| ลายเซ็น                                                      | ปัญหาที่เป็นไปได้                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | bind แบบ non-loopback โดยไม่มีเส้นทาง auth ของ Gateway ที่ถูกต้อง                             |
| `another gateway instance is already listening` / `EADDRINUSE` | พอร์ตชนกัน                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | คอนฟิกถูกตั้งเป็น remote mode หรือ local-mode stamp หายจากคอนฟิกที่เสียหาย |
| `unauthorized` during connect                                  | auth ของ client และ Gateway ไม่ตรงกัน                                        |

สำหรับลำดับการวินิจฉัยแบบเต็ม ให้ใช้ [Gateway Troubleshooting](/th/gateway/troubleshooting)

## การรับประกันด้านความปลอดภัย

- client ของโปรโตคอล Gateway จะล้มเหลวอย่างรวดเร็วเมื่อ Gateway ใช้งานไม่ได้ (ไม่มีการ fallback แบบ implicit ไปยัง direct-channel)
- เฟรมแรกที่ไม่ถูกต้อง/ไม่ใช่ connect จะถูกปฏิเสธและปิดการเชื่อมต่อ
- การปิดระบบอย่างนุ่มนวลจะส่ง event `shutdown` ก่อนปิด socket

---

ที่เกี่ยวข้อง:

- [Troubleshooting](/th/gateway/troubleshooting)
- [Background Process](/th/gateway/background-process)
- [Configuration](/th/gateway/configuration)
- [Health](/th/gateway/health)
- [Doctor](/th/gateway/doctor)
- [Authentication](/th/gateway/authentication)
