---
read_when:
    - คุณต้องการวิธีติดตั้งที่นอกเหนือจาก quickstart ใน Getting Started
    - คุณต้องการ deploy ไปยังแพลตฟอร์มคลাউด์
    - คุณต้องการอัปเดต ย้ายระบบ หรือถอนการติดตั้ง
summary: ติดตั้ง OpenClaw — สคริปต์ตัวติดตั้ง, npm/pnpm/bun, จาก source, Docker และอื่นๆ
title: Install
x-i18n:
    generated_at: "2026-04-24T09:18:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48cb531ff09cd9ba076e5a995753c6acd5273f58d9d0f1e51010bf77a18bf85e
    source_path: install/index.md
    workflow: 15
---

## ข้อกำหนดของระบบ

- **Node 24** (แนะนำ) หรือ Node 22.14+ — สคริปต์ตัวติดตั้งจะจัดการเรื่องนี้ให้อัตโนมัติ
- **macOS, Linux หรือ Windows** — รองรับทั้ง Windows แบบ native และ WSL2; WSL2 มีเสถียรภาพมากกว่า ดู [Windows](/th/platforms/windows)
- ต้องใช้ `pnpm` เฉพาะเมื่อคุณ build จาก source

## แนะนำ: สคริปต์ตัวติดตั้ง

วิธีติดตั้งที่เร็วที่สุด มันจะตรวจจับ OS ของคุณ ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw และเปิด onboarding

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

สำหรับ flags ทั้งหมดและตัวเลือกสำหรับ CI/ระบบอัตโนมัติ ดู [Installer internals](/th/install/installer)

## วิธีติดตั้งทางเลือก

### ตัวติดตั้งแบบ local prefix (`install-cli.sh`)

ใช้วิธีนี้เมื่อคุณต้องการให้ OpenClaw และ Node อยู่ภายใต้ local prefix เช่น
`~/.openclaw` โดยไม่ต้องพึ่งการติดตั้ง Node ระดับระบบ:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

มันรองรับการติดตั้งผ่าน npm เป็นค่าเริ่มต้น รวมถึงการติดตั้งแบบ git-checkout ภายใต้
flow ของ prefix เดียวกันด้วย ข้อมูลอ้างอิงแบบเต็ม: [Installer internals](/th/install/installer#install-clish)

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
    pnpm ต้องมีการอนุมัติแบบชัดเจนสำหรับแพ็กเกจที่มี build scripts ให้รัน `pnpm approve-builds -g` หลังการติดตั้งครั้งแรก
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    รองรับ Bun สำหรับเส้นทางการติดตั้ง global CLI สำหรับ Gateway runtime ยังคงแนะนำให้ใช้ Node เป็น daemon runtime
    </Note>

  </Tab>
</Tabs>

<Accordion title="การแก้ปัญหา: sharp build errors (npm)">
  หาก `sharp` ล้มเหลวเนื่องจากมี libvips ติดตั้งแบบ global อยู่:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### จาก source

สำหรับผู้ร่วมพัฒนาหรือใครก็ตามที่ต้องการรันจาก local checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

หรือข้ามขั้นตอน link แล้วใช้ `pnpm openclaw ...` จากภายใน repo ก็ได้ ดู [Setup](/th/start/setup) สำหรับเวิร์กโฟลว์การพัฒนาแบบเต็ม

### ติดตั้งจาก GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Containers และ package managers

<CardGroup cols={2}>
  <Card title="Docker" href="/th/install/docker" icon="container">
    การ deploy แบบ containerized หรือ headless
  </Card>
  <Card title="Podman" href="/th/install/podman" icon="container">
    ทางเลือกแบบ rootless container แทน Docker
  </Card>
  <Card title="Nix" href="/th/install/nix" icon="snowflake">
    การติดตั้งแบบ declarative ผ่าน Nix flake
  </Card>
  <Card title="Ansible" href="/th/install/ansible" icon="server">
    การ provision fleet แบบอัตโนมัติ
  </Card>
  <Card title="Bun" href="/th/install/bun" icon="zap">
    การใช้งาน CLI อย่างเดียวผ่าน Bun runtime
  </Card>
</CardGroup>

## ตรวจสอบการติดตั้ง

```bash
openclaw --version      # ยืนยันว่า CLI ใช้งานได้
openclaw doctor         # ตรวจปัญหา config
openclaw gateway status # ยืนยันว่า Gateway กำลังทำงาน
```

หากคุณต้องการให้เริ่มทำงานแบบ managed หลังติดตั้ง:

- macOS: LaunchAgent ผ่าน `openclaw onboard --install-daemon` หรือ `openclaw gateway install`
- Linux/WSL2: systemd user service ผ่านคำสั่งเดียวกัน
- Windows แบบ native: ใช้ Scheduled Task ก่อน โดยมี fallback เป็นรายการ login item ใน Startup folder แบบต่อผู้ใช้ หากการสร้าง task ถูกปฏิเสธ

## การโฮสต์และการ deploy

deploy OpenClaw บน cloud server หรือ VPS:

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
    ทำให้ OpenClaw ทันสมัยอยู่เสมอ
  </Card>
  <Card title="Migrating" href="/th/install/migrating" icon="arrow-right">
    ย้ายไปยังเครื่องใหม่
  </Card>
  <Card title="Uninstall" href="/th/install/uninstall" icon="trash-2">
    ลบ OpenClaw ออกทั้งหมด
  </Card>
</CardGroup>

## การแก้ปัญหา: ไม่พบ `openclaw`

หากติดตั้งสำเร็จแล้วแต่ terminal ของคุณหา `openclaw` ไม่พบ:

```bash
node -v           # ติดตั้ง Node แล้วหรือยัง?
npm prefix -g     # global packages อยู่ที่ไหน?
echo "$PATH"      # global bin dir อยู่ใน PATH หรือไม่?
```

หาก `$(npm prefix -g)/bin` ไม่อยู่ใน `$PATH` ของคุณ ให้เพิ่มลงในไฟล์เริ่มต้นของ shell (`~/.zshrc` หรือ `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

จากนั้นเปิด terminal ใหม่ ดู [Node setup](/th/install/node) สำหรับรายละเอียดเพิ่มเติม
