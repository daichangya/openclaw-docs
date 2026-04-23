---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์ด้วย Podman แทน Docker
summary: รัน OpenClaw ในคอนเทนเนอร์ Podman แบบ rootless
title: Podman
x-i18n:
    generated_at: "2026-04-23T05:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

รัน OpenClaw Gateway ในคอนเทนเนอร์ Podman แบบ rootless โดยให้ผู้ใช้ปัจจุบันที่ไม่ใช่ root เป็นผู้จัดการ

รูปแบบการใช้งานที่ตั้งใจไว้คือ:

- Podman เป็นผู้รันคอนเทนเนอร์ของ Gateway
- `openclaw` CLI บนโฮสต์ของคุณคือ control plane
- state แบบคงทนจะอยู่บนโฮสต์ภายใต้ `~/.openclaw` โดยค่าเริ่มต้น
- การจัดการประจำวันใช้ `openclaw --container <name> ...` แทน `sudo -u openclaw`, `podman exec` หรือผู้ใช้ service แยกต่างหาก

## ข้อกำหนดเบื้องต้น

- **Podman** ในโหมด rootless
- ติดตั้ง **OpenClaw CLI** บนโฮสต์แล้ว
- **ไม่บังคับ:** `systemd --user` หากคุณต้องการให้ Quadlet จัดการการเริ่มอัตโนมัติ
- **ไม่บังคับ:** `sudo` เฉพาะเมื่อคุณต้องการ `loginctl enable-linger "$(whoami)"` เพื่อให้คงอยู่หลังบูตบนโฮสต์แบบ headless

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ตั้งค่าครั้งเดียว">
    จากรากของรีโป ให้รัน `./scripts/podman/setup.sh`
  </Step>

  <Step title="เริ่มคอนเทนเนอร์ Gateway">
    เริ่มคอนเทนเนอร์ด้วย `./scripts/run-openclaw-podman.sh launch`
  </Step>

  <Step title="รัน onboarding ภายในคอนเทนเนอร์">
    รัน `./scripts/run-openclaw-podman.sh launch setup` จากนั้นเปิด `http://127.0.0.1:18789/`
  </Step>

  <Step title="จัดการคอนเทนเนอร์ที่กำลังรันจาก CLI บนโฮสต์">
    ตั้งค่า `OPENCLAW_CONTAINER=openclaw` จากนั้นใช้คำสั่ง `openclaw` ปกติจากโฮสต์
  </Step>
</Steps>

รายละเอียดของการตั้งค่า:

- `./scripts/podman/setup.sh` จะ build `openclaw:local` ใน rootless Podman store ของคุณโดยค่าเริ่มต้น หรือใช้ `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` หากคุณกำหนดไว้
- มันจะสร้าง `~/.openclaw/openclaw.json` พร้อม `gateway.mode: "local"` หากยังไม่มี
- มันจะสร้าง `~/.openclaw/.env` พร้อม `OPENCLAW_GATEWAY_TOKEN` หากยังไม่มี
- สำหรับการเปิดใช้งานแบบ manual ตัวช่วยนี้จะอ่านเพียง allowlist ขนาดเล็กของคีย์ที่เกี่ยวกับ Podman จาก `~/.openclaw/.env` และส่ง env var ของรันไทม์แบบ explicit เข้าไปยังคอนเทนเนอร์; มันจะไม่ส่งไฟล์ env ทั้งไฟล์ให้ Podman

การตั้งค่าแบบ Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet เป็นตัวเลือกเฉพาะ Linux เพราะต้องพึ่ง systemd user service

คุณยังสามารถตั้งค่า `OPENCLAW_PODMAN_QUADLET=1` ได้

ตัวแปรสภาพแวดล้อมสำหรับ build/setup แบบไม่บังคับ:

- `OPENCLAW_IMAGE` หรือ `OPENCLAW_PODMAN_IMAGE` -- ใช้ image ที่มีอยู่แล้ว/ดึงมาแล้ว แทนการ build `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่าง build image
- `OPENCLAW_EXTENSIONS` -- ติดตั้ง dependency ของ extension ล่วงหน้าตอน build

การเริ่มคอนเทนเนอร์:

```bash
./scripts/run-openclaw-podman.sh launch
```

สคริปต์จะเริ่มคอนเทนเนอร์ด้วย uid/gid ปัจจุบันของคุณโดยใช้ `--userns=keep-id` และ bind-mount state ของ OpenClaw ของคุณเข้าไปในคอนเทนเนอร์

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

จากนั้นเปิด `http://127.0.0.1:18789/` และใช้ token จาก `~/.openclaw/.env`

ค่าเริ่มต้นของ CLI บนโฮสต์:

```bash
export OPENCLAW_CONTAINER=openclaw
```

จากนั้นคำสั่งอย่างต่อไปนี้จะรันภายในคอนเทนเนอร์นั้นโดยอัตโนมัติ:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

บน macOS, Podman machine อาจทำให้เบราว์เซอร์ดูเหมือนไม่ใช่แบบ local ต่อ Gateway
หาก Control UI รายงานข้อผิดพลาดด้าน device-auth หลังเปิดใช้งาน ให้ใช้คำแนะนำ Tailscale ใน
[Podman + Tailscale](#podman--tailscale)

<a id="podman--tailscale"></a>

## Podman + Tailscale

สำหรับ HTTPS หรือการเข้าถึงเบราว์เซอร์ระยะไกล ให้ทำตามเอกสาร Tailscale หลัก

หมายเหตุเฉพาะของ Podman:

- คงค่า publish host ของ Podman ไว้ที่ `127.0.0.1`
- ควรใช้ `tailscale serve` ที่โฮสต์เป็นผู้จัดการ แทน `openclaw gateway --tailscale serve`
- บน macOS หากบริบท device-auth ของเบราว์เซอร์ในเครื่องไม่น่าเชื่อถือ ให้ใช้การเข้าถึงผ่าน Tailscale แทนวิธีแก้แบบ tunnel ภายในเครื่องเฉพาะกิจ

ดู:

- [Tailscale](/th/gateway/tailscale)
- [Control UI](/web/control-ui)

## Systemd (Quadlet, ไม่บังคับ)

หากคุณรัน `./scripts/podman/setup.sh --quadlet` การตั้งค่าจะติดตั้งไฟล์ Quadlet ไว้ที่:

```bash
~/.config/containers/systemd/openclaw.container
```

คำสั่งที่มีประโยชน์:

- **เริ่ม:** `systemctl --user start openclaw.service`
- **หยุด:** `systemctl --user stop openclaw.service`
- **สถานะ:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

หลังจากแก้ไขไฟล์ Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

สำหรับความคงทนหลังบูตบนโฮสต์แบบ SSH/headless ให้เปิด lingering สำหรับผู้ใช้ปัจจุบันของคุณ:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## คอนฟิก env และการจัดเก็บ

- **ไดเรกทอรีคอนฟิก:** `~/.openclaw`
- **ไดเรกทอรี workspace:** `~/.openclaw/workspace`
- **ไฟล์ token:** `~/.openclaw/.env`
- **ตัวช่วยเปิดใช้งาน:** `./scripts/run-openclaw-podman.sh`

สคริปต์เปิดใช้งานและ Quadlet จะ bind-mount state ของโฮสต์เข้าไปในคอนเทนเนอร์:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

โดยค่าเริ่มต้น พวกนี้เป็นไดเรกทอรีบนโฮสต์ ไม่ใช่ state แบบไม่ระบุชื่อภายในคอนเทนเนอร์ ดังนั้น
`openclaw.json`, `auth-profiles.json` แยกตามเอเจนต์, สถานะช่องทาง/ผู้ให้บริการ,
เซสชัน และ workspace จึงยังคงอยู่แม้มีการแทนที่คอนเทนเนอร์
การตั้งค่า Podman ยังเติมค่า `gateway.controlUi.allowedOrigins` สำหรับ `127.0.0.1` และ `localhost` บนพอร์ต Gateway ที่ publish ไว้ เพื่อให้แดชบอร์ดภายในเครื่องทำงานได้กับ bind แบบไม่ใช่ loopback ของคอนเทนเนอร์

env var ที่มีประโยชน์สำหรับตัวเปิดใช้งานแบบ manual:

- `OPENCLAW_PODMAN_CONTAINER` -- ชื่อคอนเทนเนอร์ (ค่าเริ่มต้นคือ `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image ที่จะรัน
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- พอร์ตโฮสต์ที่แมปไปยัง `18789` ในคอนเทนเนอร์
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- พอร์ตโฮสต์ที่แมปไปยัง `18790` ในคอนเทนเนอร์
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- อินเทอร์เฟซของโฮสต์สำหรับพอร์ตที่ publish; ค่าเริ่มต้นคือ `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- โหมด bind ของ Gateway ภายในคอนเทนเนอร์; ค่าเริ่มต้นคือ `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (ค่าเริ่มต้น), `auto` หรือ `host`

ตัวเปิดใช้งานแบบ manual จะอ่าน `~/.openclaw/.env` ก่อนสรุปค่าเริ่มต้นของคอนเทนเนอร์/image ดังนั้นคุณจึงสามารถเก็บค่าพวกนี้ไว้ที่นั่นได้

หากคุณใช้ `OPENCLAW_CONFIG_DIR` หรือ `OPENCLAW_WORKSPACE_DIR` ที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งตัวแปรเดียวกันทั้งกับ `./scripts/podman/setup.sh` และคำสั่ง `./scripts/run-openclaw-podman.sh launch` ภายหลัง ตัวเปิดใช้งานในรีโปจะไม่เก็บ override ของพาธแบบกำหนดเองข้ามเชลล์

หมายเหตุเรื่อง Quadlet:

- service Quadlet ที่สร้างขึ้นจะคงรูปแบบค่าเริ่มต้นที่แข็งแรงและกำหนดตายตัวไว้โดยตั้งใจ: พอร์ตที่ publish ไปยัง `127.0.0.1`, `--bind lan` ภายในคอนเทนเนอร์ และ user namespace แบบ `keep-id`
- มันจะปักค่า `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` และ `TimeoutStartSec=300`
- มันจะ publish ทั้ง `127.0.0.1:18789:18789` (gateway) และ `127.0.0.1:18790:18790` (bridge)
- มันอ่าน `~/.openclaw/.env` เป็น `EnvironmentFile` ของรันไทม์สำหรับค่าอย่าง `OPENCLAW_GATEWAY_TOKEN` แต่จะไม่ใช้ allowlist ของ override เฉพาะ Podman แบบตัวเปิดใช้งาน manual
- หากคุณต้องการพอร์ต publish แบบกำหนดเอง publish host หรือแฟล็กการรันคอนเทนเนอร์อื่น ๆ ให้ใช้ตัวเปิดใช้งาน manual หรือแก้ไข `~/.config/containers/systemd/openclaw.container` โดยตรง จากนั้น reload และ restart service

## คำสั่งที่มีประโยชน์

- **Logs ของคอนเทนเนอร์:** `podman logs -f openclaw`
- **หยุดคอนเทนเนอร์:** `podman stop openclaw`
- **ลบคอนเทนเนอร์:** `podman rm -f openclaw`
- **เปิด URL ของแดชบอร์ดจาก CLI บนโฮสต์:** `openclaw dashboard --no-open`
- **ตรวจสุขภาพ/สถานะผ่าน CLI บนโฮสต์:** `openclaw gateway status --deep` (RPC probe + การสแกน service เพิ่มเติม)

## การแก้ไขปัญหา

- **Permission denied (EACCES) บนคอนฟิกหรือ workspace:** คอนเทนเนอร์รันด้วย `--userns=keep-id` และ `--user <your uid>:<your gid>` โดยค่าเริ่มต้น ตรวจสอบให้แน่ใจว่าพาธคอนฟิก/workspace บนโฮสต์เป็นของผู้ใช้ปัจจุบันของคุณ
- **การเริ่ม Gateway ถูกบล็อก (ขาด `gateway.mode=local`):** ตรวจสอบให้แน่ใจว่ามี `~/.openclaw/openclaw.json` และตั้งค่า `gateway.mode="local"` ไว้ `scripts/podman/setup.sh` จะสร้างสิ่งนี้หากยังไม่มี
- **คำสั่ง CLI ของคอนเทนเนอร์ไปโดนเป้าหมายผิด:** ใช้ `openclaw --container <name> ...` แบบ explicit หรือ export `OPENCLAW_CONTAINER=<name>` ในเชลล์ของคุณ
- **`openclaw update` ล้มเหลวเมื่อใช้ `--container`:** เป็นพฤติกรรมที่คาดไว้ ให้ rebuild/pull image จากนั้น restart คอนเทนเนอร์หรือ Quadlet service
- **Quadlet service ไม่เริ่มทำงาน:** รัน `systemctl --user daemon-reload` จากนั้น `systemctl --user start openclaw.service` บนระบบแบบ headless คุณอาจต้องใช้ `sudo loginctl enable-linger "$(whoami)"` ด้วย
- **SELinux บล็อก bind mount:** ปล่อยให้พฤติกรรม mount ค่าเริ่มต้นทำงานต่อไป; ตัวเปิดใช้งานจะเติม `:Z` อัตโนมัติบน Linux เมื่อ SELinux อยู่ในโหมด enforcing หรือ permissive

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [โปรเซสเบื้องหลังของ Gateway](/th/gateway/background-process)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
