---
read_when:
    - การรันหรือดีบักโปรเซส gateway
summary: คู่มือปฏิบัติการสำหรับบริการ Gateway, วงจรชีวิต และการดำเนินงาน
title: คู่มือปฏิบัติการ Gateway
x-i18n:
    generated_at: "2026-04-24T09:10:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

ใช้หน้านี้สำหรับการเริ่มต้นใช้งานในวันแรกและการปฏิบัติการในวันถัด ๆ ไปของบริการ Gateway

<CardGroup cols={2}>
  <Card title="การแก้ไขปัญหาเชิงลึก" icon="siren" href="/th/gateway/troubleshooting">
    การวินิจฉัยแบบเริ่มจากอาการ พร้อมลำดับคำสั่งและลายเซ็นของ log ที่ชัดเจน
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    คู่มือการตั้งค่าแบบอิงงาน + ข้อมูลอ้างอิงการกำหนดค่าแบบเต็ม
  </Card>
  <Card title="การจัดการ secrets" icon="key-round" href="/th/gateway/secrets">
    สัญญา SecretRef, ลักษณะการทำงานของ runtime snapshot และการดำเนินการ migrate/reload
  </Card>
  <Card title="สัญญาแผน secrets" icon="shield-check" href="/th/gateway/secrets-plan-contract">
    กฎเป้าหมาย/เส้นทางของ `secrets apply` และลักษณะการทำงานของ auth-profile แบบ ref-only ที่แน่นอน
  </Card>
</CardGroup>

## การเริ่มต้นแบบโลคัลใน 5 นาที

<Steps>
  <Step title="เริ่ม Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="ตรวจสอบสุขภาพของบริการ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

ค่าพื้นฐานที่ถือว่าปกติ: `Runtime: running`, `Connectivity probe: ok` และ `Capability: ...` ที่ตรงกับสิ่งที่คุณคาดหวัง ใช้ `openclaw gateway status --require-rpc` เมื่อคุณต้องการหลักฐาน RPC แบบ read-scope ไม่ใช่เพียงแค่การเข้าถึงได้

  </Step>

  <Step title="ตรวจสอบความพร้อมของช่องทาง">

```bash
openclaw channels status --probe
```

เมื่อ gateway เข้าถึงได้ คำสั่งนี้จะรันการตรวจสอบช่องทางแบบสดรายบัญชีและ audits แบบไม่บังคับ
หากเข้าถึง gateway ไม่ได้ CLI จะย้อนกลับไปใช้สรุปช่องทางจาก config อย่างเดียวแทน
เอาต์พุตจากการตรวจสอบแบบสด

  </Step>
</Steps>

<Note>
การ reload config ของ Gateway จะเฝ้าดูเส้นทางไฟล์ config ที่ใช้งานอยู่ (resolve มาจากค่าเริ่มต้นของ profile/state หรือจาก `OPENCLAW_CONFIG_PATH` หากมีการตั้งค่า)
โหมดเริ่มต้นคือ `gateway.reload.mode="hybrid"`
หลังจากโหลดสำเร็จครั้งแรก โปรเซสที่กำลังรันจะให้บริการ snapshot ของ config ในหน่วยความจำที่ใช้งานอยู่; เมื่อ reload สำเร็จ snapshot นั้นจะถูกสลับแบบอะตอมิก
</Note>

## โมเดลรันไทม์

- โปรเซสเดียวที่ทำงานตลอดเวลา สำหรับการกำหนดเส้นทาง, control plane และการเชื่อมต่อกับช่องทางต่าง ๆ
- พอร์ตแบบ multiplexed เดียวสำหรับ:
  - WebSocket control/RPC
  - HTTP APIs, รองรับแบบ OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI และ hooks
- โหมด bind เริ่มต้น: `loopback`
- ต้องใช้ auth ตามค่าเริ่มต้น การตั้งค่าแบบ shared-secret ใช้
  `gateway.auth.token` / `gateway.auth.password` (หรือ
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) และการตั้งค่าที่ใช้ reverse-proxy แบบ non-loopback
  สามารถใช้ `gateway.auth.mode: "trusted-proxy"` ได้

## ปลายทางที่รองรับ OpenAI-compatible

พื้นผิวความเข้ากันได้ที่มีประโยชน์สูงสุดของ OpenClaw ตอนนี้คือ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

เหตุผลที่ชุดนี้สำคัญ:

- การเชื่อมต่อส่วนใหญ่ของ Open WebUI, LobeChat และ LibreChat จะตรวจสอบ `/v1/models` ก่อน
- pipeline ของ RAG และ memory หลายตัวคาดหวัง `/v1/embeddings`
- ไคลเอนต์แบบ agent-native มีแนวโน้มจะเลือกใช้ `/v1/responses` มากขึ้น

หมายเหตุด้านการวางแผน:

- `/v1/models` เป็นแบบ agent-first: จะคืนค่า `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
- `openclaw/default` เป็น alias ที่คงที่ซึ่งแมปไปยังเอเจนต์เริ่มต้นที่กำหนดค่าไว้เสมอ
- ใช้ `x-openclaw-model` เมื่อคุณต้องการ override provider/model ด้าน backend; มิฉะนั้นโมเดลและการตั้งค่า embedding ปกติของเอเจนต์ที่เลือกจะยังคงเป็นตัวควบคุม

ทั้งหมดนี้ทำงานบนพอร์ตหลักของ Gateway และใช้ขอบเขต auth ของผู้ปฏิบัติงานที่เชื่อถือได้เดียวกันกับส่วน HTTP API อื่น ๆ ของ Gateway

### ลำดับความสำคัญของพอร์ตและ bind

| การตั้งค่า | ลำดับการ resolve |
| ------------ | ------------------------------------------------------------- |
| พอร์ต Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| โหมด bind | CLI/override → `gateway.bind` → `loopback` |

### โหมด Hot reload

| `gateway.reload.mode` | ลักษณะการทำงาน |
| --------------------- | ------------------------------------------ |
| `off` | ไม่มีการ reload config |
| `hot` | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยต่อ hot-apply |
| `restart` | รีสตาร์ตเมื่อมีการเปลี่ยนแปลงที่ต้องใช้ reload |
| `hybrid` (ค่าเริ่มต้น) | hot-apply เมื่อปลอดภัย, รีสตาร์ตเมื่อจำเป็น |

## ชุดคำสั่งสำหรับผู้ปฏิบัติงาน

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` มีไว้สำหรับการค้นหาบริการเพิ่มเติม (LaunchDaemons/systemd system
units/schtasks) ไม่ใช่การตรวจสอบสุขภาพ RPC ที่ลึกขึ้น

## หลาย gateways (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรรัน gateway เพียงหนึ่งตัวต่อเครื่อง Gateway หนึ่งตัวสามารถโฮสต์ได้หลาย
agents และหลายช่องทาง

คุณจำเป็นต้องมีหลาย gateways ก็ต่อเมื่อคุณต้องการการแยกอย่างตั้งใจหรือมี rescue bot

การตรวจสอบที่มีประโยชน์:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

สิ่งที่คาดว่าจะพบ:

- `gateway status --deep` อาจรายงาน `Other gateway-like services detected (best effort)`
  และพิมพ์คำแนะนำการ cleanup เมื่อยังมี launchd/systemd/schtasks installs เก่าค้างอยู่
- `gateway probe` อาจเตือนว่า `multiple reachable gateways` เมื่อมีเป้าหมายมากกว่าหนึ่งตัว
  ตอบกลับ
- หากนั่นเป็นสิ่งที่ตั้งใจ ให้แยกพอร์ต, config/state และรากของ workspace สำหรับแต่ละ gateway

เช็กลิสต์ต่ออินสแตนซ์:

- `gateway.port` ต้องไม่ซ้ำกัน
- `OPENCLAW_CONFIG_PATH` ต้องไม่ซ้ำกัน
- `OPENCLAW_STATE_DIR` ต้องไม่ซ้ำกัน
- `agents.defaults.workspace` ต้องไม่ซ้ำกัน

ตัวอย่าง:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

รายละเอียดการตั้งค่า: [/gateway/multiple-gateways](/th/gateway/multiple-gateways)

## การเข้าถึงระยะไกล

แนะนำ: Tailscale/VPN
Fallback: SSH tunnel

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

จากนั้นเชื่อมต่อไคลเอนต์แบบโลคัลไปที่ `ws://127.0.0.1:18789`

<Warning>
SSH tunnels ไม่ได้ข้าม auth ของ gateway สำหรับ auth แบบ shared-secret ไคลเอนต์
ยังคงต้องส่ง `token`/`password` แม้จะผ่าน tunnel ก็ตาม สำหรับโหมดที่มีตัวตนของคำขอ
คำขอนั้นยังต้องผ่านเส้นทาง auth นั้นอยู่ดี
</Warning>

ดู: [Remote Gateway](/th/gateway/remote), [Authentication](/th/gateway/authentication), [Tailscale](/th/gateway/tailscale)

## การกำกับดูแลและวงจรชีวิตของบริการ

ใช้การรันแบบมีตัวกำกับดูแลเพื่อความน่าเชื่อถือในลักษณะการใช้งานจริง

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

ป้ายกำกับ LaunchAgent คือ `ai.openclaw.gateway` (ค่าเริ่มต้น) หรือ `ai.openclaw.<profile>` (named profile) `openclaw doctor` จะตรวจสอบและซ่อมแซมความคลาดเคลื่อนของ config บริการ

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

หากต้องการให้คงอยู่หลัง logout ให้เปิดใช้ lingering:

```bash
sudo loginctl enable-linger <user>
```

ตัวอย่าง user-unit แบบแมนนวลเมื่อคุณต้องการเส้นทางการติดตั้งแบบกำหนดเอง:

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

การเริ่มอัตโนมัติแบบจัดการโดยระบบของ Windows ใช้ Scheduled Task ชื่อ `OpenClaw Gateway`
(หรือ `OpenClaw Gateway (<profile>)` สำหรับ named profiles) หากถูกปฏิเสธการสร้าง Scheduled Task
OpenClaw จะย้อนกลับไปใช้ตัวเปิดจาก Startup folder ระดับผู้ใช้ ซึ่งชี้ไปที่ `gateway.cmd` ภายใน state directory

  </Tab>

  <Tab title="Linux (system service)">

ใช้ system unit สำหรับโฮสต์ที่เป็นหลายผู้ใช้/เปิดตลอดเวลา

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ใช้ service body เดียวกับ user unit แต่ติดตั้งไว้ใต้
`/etc/systemd/system/openclaw-gateway[-<profile>].service` และปรับ
`ExecStart=` หากไบนารี `openclaw` ของคุณอยู่คนละที่

  </Tab>
</Tabs>

## เส้นทางลัดสำหรับโปรไฟล์ Dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

ค่าเริ่มต้นประกอบด้วย state/config ที่แยกจากกันและพอร์ตฐานของ gateway เป็น `19001`

## ข้อมูลอ้างอิงโปรโตคอลแบบรวดเร็ว (มุมมองผู้ปฏิบัติงาน)

- เฟรมแรกของไคลเอนต์ต้องเป็น `connect`
- Gateway จะส่ง snapshot `hello-ok` กลับมา (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)
- `hello-ok.features.methods` / `events` เป็นรายการค้นหาแบบอนุรักษ์นิยม ไม่ใช่
  การดัมพ์ทุก helper route ที่เรียกใช้ได้โดยอัตโนมัติ
- Requests: `req(method, params)` → `res(ok/payload|error)`
- events ที่พบบ่อย ได้แก่ `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, วงจรชีวิต pairing/approval และ `shutdown`

การรันของเอเจนต์มีสองขั้น:

1. accepted ack ทันที (`status:"accepted"`)
2. การตอบกลับตอนเสร็จสมบูรณ์ (`status:"ok"|"error"`) โดยมี `agent` events แบบสตรีมอยู่ระหว่างนั้น

ดูเอกสารโปรโตคอลแบบเต็ม: [Gateway Protocol](/th/gateway/protocol)

## การตรวจสอบเชิงปฏิบัติการ

### Liveness

- เปิด WS และส่ง `connect`
- ควรได้รับ `hello-ok` กลับมาพร้อม snapshot

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap recovery

Events จะไม่ถูก replay เมื่อเกิด sequence gaps ให้รีเฟรชสถานะ (`health`, `system-presence`) ก่อนดำเนินการต่อ

## ลายเซ็นความล้มเหลวที่พบบ่อย

| ลายเซ็น | ปัญหาที่เป็นไปได้ |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth` | bind แบบ non-loopback โดยไม่มีเส้นทาง auth ของ gateway ที่ถูกต้อง |
| `another gateway instance is already listening` / `EADDRINUSE` | พอร์ตชนกัน |
| `Gateway start blocked: set gateway.mode=local` | config ถูกตั้งเป็นโหมด remote หรือ local-mode stamp หายไปจาก config ที่เสียหาย |
| `unauthorized` ระหว่าง connect | auth ของไคลเอนต์กับ gateway ไม่ตรงกัน |

สำหรับลำดับการวินิจฉัยแบบเต็ม ให้ใช้ [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)

## การรับประกันด้านความปลอดภัย

- ไคลเอนต์ของ Gateway protocol จะล้มเหลวทันทีเมื่อ Gateway ไม่พร้อมใช้งาน (ไม่มี fallback แบบ implicit ไปยัง direct-channel)
- เฟรมแรกที่ไม่ถูกต้อง/ไม่ใช่ connect จะถูกปฏิเสธและปิดการเชื่อมต่อ
- การปิดแบบ graceful จะส่ง event `shutdown` ก่อนปิด socket

---

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- [กระบวนการเบื้องหลัง](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Health](/th/gateway/health)
- [Doctor](/th/gateway/doctor)
- [Authentication](/th/gateway/authentication)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การจัดการ secrets](/th/gateway/secrets)
