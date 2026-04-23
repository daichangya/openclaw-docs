---
read_when:
    - คุณต้องการวิธีติดตั้งที่นอกเหนือจากการเริ่มต้นแบบรวดเร็วใน Getting Started
    - คุณต้องการปรับใช้ไปยังแพลตฟอร์มคลาวด์
    - คุณต้องการอัปเดต ย้ายระบบ หรือถอนการติดตั้ง
summary: ติดตั้ง OpenClaw — สคริปต์ติดตั้ง, npm/pnpm/bun, จากซอร์ส, Docker และอื่นๆ
title: ติดตั้ง
x-i18n:
    generated_at: "2026-04-23T05:40:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# ติดตั้ง

## แนะนำ: สคริปต์ติดตั้ง

วิธีที่เร็วที่สุดในการติดตั้ง ระบบจะตรวจจับ OS ของคุณ ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw และเปิด onboarding

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

หากต้องการติดตั้งโดยไม่รัน onboarding:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

สำหรับแฟล็กทั้งหมดและตัวเลือกสำหรับ CI/ระบบอัตโนมัติ ดู [Installer internals](/th/install/installer)

## ข้อกำหนดของระบบ

- **Node 24** (แนะนำ) หรือ Node 22.14+ — สคริปต์ติดตั้งจะจัดการสิ่งนี้ให้อัตโนมัติ
- **macOS, Linux หรือ Windows** — รองรับทั้ง Windows แบบเนทีฟและ WSL2; WSL2 เสถียรกว่า ดู [Windows](/th/platforms/windows)
- ต้องใช้ `pnpm` เฉพาะเมื่อคุณ build จากซอร์ส

## วิธีติดตั้งทางเลือก

### ตัวติดตั้งแบบ local prefix (`install-cli.sh`)

ใช้วิธีนี้เมื่อคุณต้องการให้ OpenClaw และ Node อยู่ภายใต้ local prefix เช่น
`~/.openclaw` โดยไม่ต้องพึ่งพา Node ที่ติดตั้งแบบ system-wide:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

รองรับการติดตั้งด้วย npm ตามค่าเริ่มต้น รวมถึงการติดตั้งจาก git checkout ภายใต้
โฟลว์ prefix เดียวกัน เอกสารอ้างอิงฉบับเต็ม: [Installer internals](/th/install/installer#install-clish)

### npm, pnpm หรือ bun

หากคุณจัดการ Node เองอยู่แล้ว:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm ต้องการการอนุมัติอย่างชัดเจนสำหรับแพ็กเกจที่มี build scripts รัน `pnpm approve-builds -g` หลังการติดตั้งครั้งแรก
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    รองรับ Bun สำหรับเส้นทางการติดตั้ง CLI แบบ global สำหรับรันไทม์ของ Gateway ยังคงแนะนำให้ใช้ Node เป็น daemon runtime
    </Note>

  </Tab>
</Tabs>

<Accordion title="การแก้ปัญหา: ข้อผิดพลาดในการ build sharp (npm)">
  หาก `sharp` ล้มเหลวเพราะมี libvips ติดตั้งแบบ global:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### จากซอร์ส

สำหรับผู้มีส่วนร่วม หรือผู้ที่ต้องการรันจาก local checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

หรือข้ามการ link แล้วใช้ `pnpm openclaw ...` จากภายใน repo ก็ได้ ดู [Setup](/th/start/setup) สำหรับเวิร์กโฟลว์การพัฒนาแบบเต็ม

### ติดตั้งจาก GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Containers และ package managers

<CardGroup cols={2}>
  <Card title="Docker" href="/th/install/docker" icon="container">
    การปรับใช้แบบ containerized หรือแบบ headless
  </Card>
  <Card title="Podman" href="/th/install/podman" icon="container">
    ทางเลือกแบบ rootless container แทน Docker
  </Card>
  <Card title="Nix" href="/th/install/nix" icon="snowflake">
    การติดตั้งแบบ declarative ผ่าน Nix flake
  </Card>
  <Card title="Ansible" href="/th/install/ansible" icon="server">
    การจัดเตรียมฟลีตแบบอัตโนมัติ
  </Card>
  <Card title="Bun" href="/th/install/bun" icon="zap">
    การใช้งานแบบ CLI-only ผ่านรันไทม์ Bun
  </Card>
</CardGroup>

## ตรวจสอบการติดตั้ง

```bash
openclaw --version      # ยืนยันว่า CLI พร้อมใช้งาน
openclaw doctor         # ตรวจสอบปัญหาด้าน config
openclaw gateway status # ตรวจสอบว่า Gateway กำลังทำงานอยู่
```

หากคุณต้องการการเริ่มต้นแบบมีการจัดการหลังติดตั้ง:

- macOS: LaunchAgent ผ่าน `openclaw onboard --install-daemon` หรือ `openclaw gateway install`
- Linux/WSL2: systemd user service ผ่านคำสั่งเดียวกัน
- Windows แบบเนทีฟ: Scheduled Task ก่อน โดยมี fallback เป็นรายการล็อกอินใน Startup-folder แบบต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ

## การโฮสต์และการปรับใช้

ปรับใช้ OpenClaw บน cloud server หรือ VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/th/vps">Linux VPS ใดก็ได้</Card>
  <Card title="Docker VM" href="/th/install/docker-vm-runtime">ขั้นตอน Docker แบบใช้ร่วมกัน</Card>
  <Card title="Kubernetes" href="/th/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/th/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/th/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/th/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/th/install/azure">Azure</Card>
  <Card title="Railway" href="/th/install/railway">Railway</Card>
  <Card title="Render" href="/th/install/render">Render</Card>
  <Card title="Northflank" href="/th/install/northflank">Northflank</Card>
</CardGroup>

## อัปเดต ย้ายระบบ หรือถอนการติดตั้ง

<CardGroup cols={3}>
  <Card title="Updating" href="/th/install/updating" icon="refresh-cw">
    อัปเดต OpenClaw ให้ทันสมัย
  </Card>
  <Card title="Migrating" href="/th/install/migrating" icon="arrow-right">
    ย้ายไปยังเครื่องใหม่
  </Card>
  <Card title="Uninstall" href="/th/install/uninstall" icon="trash-2">
    ลบ OpenClaw ออกทั้งหมด
  </Card>
</CardGroup>

## การแก้ปัญหา: ไม่พบ `openclaw`

หากติดตั้งสำเร็จแต่ไม่พบ `openclaw` ใน terminal:

```bash
node -v           # ติดตั้ง Node แล้วหรือยัง?
npm prefix -g     # global packages อยู่ที่ไหน?
echo "$PATH"      # global bin dir อยู่ใน PATH หรือไม่?
```

หาก `$(npm prefix -g)/bin` ไม่ได้อยู่ใน `$PATH` ให้เพิ่มลงในไฟล์เริ่มต้น shell ของคุณ (`~/.zshrc` หรือ `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

จากนั้นเปิด terminal ใหม่ ดู [Node setup](/th/install/node) สำหรับรายละเอียดเพิ่มเติม
