---
read_when:
    - คุณต้องการลบ OpenClaw ออกจากเครื่องหนึ่งเครื่อง
    - บริการ gateway ยังคงทำงานอยู่หลังจากถอนการติดตั้งแล้ว
summary: ถอนการติดตั้ง OpenClaw ออกทั้งหมด (CLI, service, state, workspace)
title: ถอนการติดตั้ง
x-i18n:
    generated_at: "2026-04-24T09:19:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

มี 2 เส้นทาง:

- **เส้นทางง่าย** หากยังติดตั้ง `openclaw` อยู่
- **ลบบริการด้วยตนเอง** หาก CLI ถูกลบไปแล้ว แต่บริการยังคงทำงานอยู่

## เส้นทางง่าย (ยังติดตั้ง CLI อยู่)

แนะนำ: ใช้ตัวถอนการติดตั้งที่มีมาในตัว:

```bash
openclaw uninstall
```

แบบไม่โต้ตอบ (automation / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

ขั้นตอนแบบ manual (ได้ผลลัพธ์เหมือนกัน):

1. หยุดบริการ gateway:

```bash
openclaw gateway stop
```

2. ถอนการติดตั้งบริการ gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. ลบ state + config:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

หากคุณตั้ง `OPENCLAW_CONFIG_PATH` ไปยังตำแหน่งแบบกำหนดเองที่อยู่นอก state dir ให้ลบไฟล์นั้นด้วย

4. ลบ workspace ของคุณ (ไม่บังคับ, จะลบไฟล์ของเอเจนต์):

```bash
rm -rf ~/.openclaw/workspace
```

5. ลบการติดตั้ง CLI (เลือกตามที่คุณใช้):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. หากคุณติดตั้งแอป macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

หมายเหตุ:

- หากคุณใช้โปรไฟล์ (`--profile` / `OPENCLAW_PROFILE`) ให้ทำขั้นตอนที่ 3 ซ้ำสำหรับแต่ละ state dir (ค่าปริยายคือ `~/.openclaw-<profile>`)
- ในโหมด remote, state dir จะอยู่บน **โฮสต์ gateway** ดังนั้นให้ทำขั้นตอนที่ 1-4 บนเครื่องนั้นด้วย

## ลบบริการด้วยตนเอง (ไม่ได้ติดตั้ง CLI แล้ว)

ใช้วิธีนี้หากบริการ gateway ยังทำงานต่อ แต่ไม่มี `openclaw` แล้ว

### macOS (launchd)

label ค่าปริยายคือ `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>`; legacy `com.openclaw.*` อาจยังคงมีอยู่):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

หากคุณใช้โปรไฟล์ ให้แทนที่ label และชื่อ plist ด้วย `ai.openclaw.<profile>` ลบ plist แบบ legacy `com.openclaw.*` หากมีอยู่ด้วย

### Linux (systemd user unit)

ชื่อ unit ค่าปริยายคือ `openclaw-gateway.service` (หรือ `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

ชื่องานค่าปริยายคือ `OpenClaw Gateway` (หรือ `OpenClaw Gateway (<profile>)`)
สคริปต์ของงานจะอยู่ภายใต้ state dir ของคุณ

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

หากคุณใช้โปรไฟล์ ให้ลบชื่องานที่ตรงกันและ `~\.openclaw-<profile>\gateway.cmd`

## การติดตั้งปกติ vs source checkout

### การติดตั้งปกติ (`install.sh` / npm / pnpm / bun)

หากคุณใช้ `https://openclaw.ai/install.sh` หรือ `install.ps1`, CLI จะถูกติดตั้งด้วย `npm install -g openclaw@latest`
ให้ลบด้วย `npm rm -g openclaw` (หรือ `pnpm remove -g` / `bun remove -g` หากคุณติดตั้งด้วยวิธีนั้น)

### Source checkout (`git clone`)

หากคุณรันจาก repo checkout (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. ถอนการติดตั้งบริการ gateway **ก่อน** ลบ repo (ใช้เส้นทางง่ายด้านบนหรือการลบบริการด้วยตนเอง)
2. ลบไดเรกทอรี repo
3. ลบ state + workspace ตามที่แสดงด้านบน

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [คู่มือการย้ายระบบ](/th/install/migrating)
