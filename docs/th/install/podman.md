---
read_when:
    - คุณต้องการ Gateway แบบ containerized ด้วย Podman แทน Docker
summary: รัน OpenClaw ใน rootless Podman container
title: Podman
x-i18n:
    generated_at: "2026-04-24T09:18:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

รัน OpenClaw Gateway ใน rootless Podman container ที่จัดการโดยผู้ใช้ non-root ปัจจุบันของคุณ

โมเดลที่ตั้งใจไว้คือ:

- Podman เป็นผู้รัน gateway container
- `openclaw` CLI บนโฮสต์ของคุณเป็น control plane
- state แบบ persistent อยู่บนโฮสต์ภายใต้ `~/.openclaw` เป็นค่าเริ่มต้น
- การจัดการในแต่ละวันใช้ `openclaw --container <name> ...` แทน `sudo -u openclaw`, `podman exec` หรือ service user แยกต่างหาก

## ข้อกำหนดเบื้องต้น

- **Podman** ในโหมด rootless
- ติดตั้ง **OpenClaw CLI** บนโฮสต์แล้ว
- **ไม่บังคับ:** `systemd --user` หากคุณต้องการ auto-start แบบจัดการด้วย Quadlet
- **ไม่บังคับ:** `sudo` เฉพาะเมื่อคุณต้องการใช้ `loginctl enable-linger "$(whoami)"` เพื่อให้คงอยู่หลังบูตบนโฮสต์แบบ headless

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="การตั้งค่าครั้งเดียว">
    จากรากของ repo ให้รัน `./scripts/podman/setup.sh`
  </Step>

  <Step title="เริ่ม gateway container">
    เริ่ม container ด้วย `./scripts/run-openclaw-podman.sh launch`
  </Step>

  <Step title="รัน onboarding ภายใน container">
    รัน `./scripts/run-openclaw-podman.sh launch setup` แล้วเปิด `http://127.0.0.1:18789/`
  </Step>

  <Step title="จัดการ container ที่กำลังรันจาก host CLI">
    ตั้งค่า `OPENCLAW_CONTAINER=openclaw` แล้วใช้คำสั่ง `openclaw` ปกติจากโฮสต์
  </Step>
</Steps>

รายละเอียดการตั้งค่า:

- `./scripts/podman/setup.sh` จะ build `openclaw:local` ลงใน rootless Podman store ของคุณเป็นค่าเริ่มต้น หรือใช้ `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` หากคุณตั้งค่าไว้
- มันจะสร้าง `~/.openclaw/openclaw.json` พร้อม `gateway.mode: "local"` หากยังไม่มี
- มันจะสร้าง `~/.openclaw/.env` พร้อม `OPENCLAW_GATEWAY_TOKEN` หากยังไม่มี
- สำหรับการ launch แบบ manual ตัวช่วยจะอ่านเฉพาะ allowlist ขนาดเล็กของคีย์ที่เกี่ยวกับ Podman จาก `~/.openclaw/.env` และส่ง runtime env vars แบบชัดเจนเข้า container; มันจะไม่ส่ง env file ทั้งหมดให้ Podman

การตั้งค่าแบบ Quadlet-managed:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet ใช้ได้เฉพาะบน Linux เท่านั้น เพราะต้องพึ่ง systemd user services

คุณยังสามารถตั้งค่า `OPENCLAW_PODMAN_QUADLET=1` ได้ด้วย

env vars สำหรับ build/setup แบบไม่บังคับ:

- `OPENCLAW_IMAGE` หรือ `OPENCLAW_PODMAN_IMAGE` -- ใช้ image ที่มีอยู่/ดึงมาแล้ว แทนการ build `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- ติดตั้ง apt packages เพิ่มเติมระหว่าง build image
- `OPENCLAW_EXTENSIONS` -- ติดตั้ง dependencies ของ plugin ล่วงหน้าตอน build

การเริ่ม container:

```bash
./scripts/run-openclaw-podman.sh launch
```

สคริปต์จะเริ่ม container ด้วย uid/gid ปัจจุบันของคุณโดยใช้ `--userns=keep-id` และ bind-mount state ของ OpenClaw ของคุณเข้าไปใน container

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

จากนั้นเปิด `http://127.0.0.1:18789/` แล้วใช้ token จาก `~/.openclaw/.env`

ค่าเริ่มต้นของ host CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

จากนั้นคำสั่งเช่นด้านล่างจะรันภายใน container นั้นโดยอัตโนมัติ:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # รวมการสแกน services เพิ่มเติม
openclaw doctor
openclaw channels login
```

บน macOS, Podman machine อาจทำให้เบราว์เซอร์ดูเหมือนไม่ได้อยู่ในเครื่องเดียวกันสำหรับ gateway
หาก Control UI รายงานข้อผิดพลาด device-auth หลัง launch ให้ใช้แนวทาง Tailscale ใน
[Podman + Tailscale](#podman--tailscale)

<a id="podman--tailscale"></a>

## Podman + Tailscale

สำหรับ HTTPS หรือการเข้าถึงเบราว์เซอร์แบบ remote ให้ทำตามเอกสาร Tailscale หลัก

หมายเหตุเฉพาะของ Podman:

- ให้คง host สำหรับ publish ของ Podman เป็น `127.0.0.1`
- ควรใช้ `tailscale serve` ที่จัดการโดยโฮสต์ แทน `openclaw gateway --tailscale serve`
- บน macOS หากบริบท device-auth ของเบราว์เซอร์ในเครื่องไม่น่าเชื่อถือ ให้ใช้การเข้าถึงผ่าน Tailscale แทนวิธีแก้ชั่วคราวแบบ local tunnel เฉพาะกิจ

ดู:

- [Tailscale](/th/gateway/tailscale)
- [Control UI](/th/web/control-ui)

## Systemd (Quadlet, ไม่บังคับ)

หากคุณรัน `./scripts/podman/setup.sh --quadlet`, setup จะติดตั้งไฟล์ Quadlet ไว้ที่:

```bash
~/.config/containers/systemd/openclaw.container
```

คำสั่งที่มีประโยชน์:

- **เริ่ม:** `systemctl --user start openclaw.service`
- **หยุด:** `systemctl --user stop openclaw.service`
- **สถานะ:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

หลังแก้ไขไฟล์ Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

สำหรับการคงอยู่หลังบูตบนโฮสต์ SSH/headless ให้เปิด lingering สำหรับผู้ใช้ปัจจุบันของคุณ:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Config, env และ storage

- **Config dir:** `~/.openclaw`
- **Workspace dir:** `~/.openclaw/workspace`
- **Token file:** `~/.openclaw/.env`
- **Launch helper:** `./scripts/run-openclaw-podman.sh`

สคริปต์ launch และ Quadlet จะ bind-mount state ของโฮสต์เข้าไปใน container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

โดยค่าเริ่มต้น สิ่งเหล่านี้เป็นไดเรกทอรีบนโฮสต์ ไม่ใช่ state แบบ anonymous ภายใน container ดังนั้น
`openclaw.json`, `auth-profiles.json` ต่อเอเจนต์, state ของ channel/provider,
sessions และ workspace จะยังคงอยู่แม้เปลี่ยน container
การตั้งค่า Podman ยัง seed `gateway.controlUi.allowedOrigins` สำหรับ `127.0.0.1` และ `localhost` บนพอร์ต gateway ที่ publish ไว้ เพื่อให้แดชบอร์ดในเครื่องทำงานได้กับ bind แบบ non-loopback ของ container

env vars ที่มีประโยชน์สำหรับ manual launcher:

- `OPENCLAW_PODMAN_CONTAINER` -- ชื่อ container (ค่าเริ่มต้น `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image ที่จะรัน
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- พอร์ตโฮสต์ที่แมปกับ `18789` ของ container
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- พอร์ตโฮสต์ที่แมปกับ `18790` ของ container
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- host interface สำหรับพอร์ตที่ publish; ค่าเริ่มต้นคือ `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- โหมด bind ของ gateway ภายใน container; ค่าเริ่มต้นคือ `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (ค่าเริ่มต้น), `auto` หรือ `host`

manual launcher จะอ่าน `~/.openclaw/.env` ก่อนสรุปค่าเริ่มต้นของ container/image ดังนั้นคุณสามารถเก็บค่าพวกนี้ไว้ที่นั่นได้

หากคุณใช้ `OPENCLAW_CONFIG_DIR` หรือ `OPENCLAW_WORKSPACE_DIR` ที่ไม่ใช่ค่าเริ่มต้น ให้ตั้งตัวแปรเดียวกันนี้ทั้งสำหรับ `./scripts/podman/setup.sh` และคำสั่ง `./scripts/run-openclaw-podman.sh launch` ในภายหลัง launcher ภายใน repo จะไม่เก็บ custom path overrides ข้าม shell ให้เอง

หมายเหตุเกี่ยวกับ Quadlet:

- บริการ Quadlet ที่สร้างขึ้นจะตั้งใจคงรูปแบบค่าเริ่มต้นที่แข็งแรงและตายตัวไว้: พอร์ตที่ publish บน `127.0.0.1`, `--bind lan` ภายใน container และ user namespace แบบ `keep-id`
- มันตรึงค่า `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` และ `TimeoutStartSec=300`
- มัน publish ทั้ง `127.0.0.1:18789:18789` (gateway) และ `127.0.0.1:18790:18790` (bridge)
- มันอ่าน `~/.openclaw/.env` เป็น `EnvironmentFile` ระหว่าง runtime สำหรับค่าอย่าง `OPENCLAW_GATEWAY_TOKEN` แต่จะไม่ใช้ allowlist ของ overrides เฉพาะ Podman ของ manual launcher
- หากคุณต้องการ custom publish ports, publish host หรือ flags อื่นๆ สำหรับการรัน container ให้ใช้ manual launcher หรือแก้ `~/.config/containers/systemd/openclaw.container` โดยตรง จากนั้น reload และ restart service

## คำสั่งที่มีประโยชน์

- **Container logs:** `podman logs -f openclaw`
- **หยุด container:** `podman stop openclaw`
- **ลบ container:** `podman rm -f openclaw`
- **เปิด URL ของแดชบอร์ดจาก host CLI:** `openclaw dashboard --no-open`
- **Health/status ผ่าน host CLI:** `openclaw gateway status --deep` (RPC probe + extra
  service scan)

## การแก้ปัญหา

- **Permission denied (EACCES) บน config หรือ workspace:** ค่าเริ่มต้น container จะรันด้วย `--userns=keep-id` และ `--user <your uid>:<your gid>` ตรวจให้แน่ใจว่าพาธ config/workspace บนโฮสต์เป็นของผู้ใช้ปัจจุบันของคุณ
- **การเริ่ม Gateway ถูกบล็อก (ไม่มี `gateway.mode=local`):** ตรวจให้แน่ใจว่า `~/.openclaw/openclaw.json` มีอยู่และตั้งค่า `gateway.mode="local"` ไว้ `scripts/podman/setup.sh` จะสร้างสิ่งนี้ให้หากยังไม่มี
- **คำสั่ง CLI ที่ชี้ไปยัง container ไปโดนเป้าหมายผิด:** ใช้ `openclaw --container <name> ...` แบบชัดเจน หรือ export `OPENCLAW_CONTAINER=<name>` ใน shell ของคุณ
- **`openclaw update` ล้มเหลวเมื่อใช้ `--container`:** เป็นพฤติกรรมที่คาดไว้ ให้ rebuild/pull image แล้ว restart container หรือบริการ Quadlet
- **บริการ Quadlet ไม่เริ่มทำงาน:** รัน `systemctl --user daemon-reload` แล้วตามด้วย `systemctl --user start openclaw.service` บนระบบ headless คุณอาจต้องใช้ `sudo loginctl enable-linger "$(whoami)"` ด้วย
- **SELinux บล็อก bind mounts:** ปล่อยพฤติกรรม mount เริ่มต้นไว้ launcher จะเพิ่ม `:Z` อัตโนมัติบน Linux เมื่อ SELinux อยู่ในสถานะ enforcing หรือ permissive

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [Gateway background process](/th/gateway/background-process)
- [Gateway troubleshooting](/th/gateway/troubleshooting)
