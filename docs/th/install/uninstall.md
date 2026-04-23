---
read_when:
    - 'คุณต้องการลบ OpenClaw ออกจากเครื่อง մըassistant to=functions.read კომენტary _日本毛片免费视频观看json ,最新高清无码专区_offset: 1, "limit": 200, "path": "docs/AGENTS.md"} code'
    - service ของ gateway ยังคงทำงานอยู่หลังการถอนการติดตั้ง
summary: ถอนการติดตั้ง OpenClaw ทั้งหมด (CLI, service, state, workspace)
title: ถอนการติดตั้ง
x-i18n:
    generated_at: "2026-04-23T05:42:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# ถอนการติดตั้ง

มีสองเส้นทาง:

- **เส้นทางง่าย** หากยังติดตั้ง `openclaw` อยู่
- **การลบ service ด้วยตนเอง** หากไม่มี CLI แล้ว แต่ service ยังทำงานอยู่

## เส้นทางง่าย (ยังติดตั้ง CLI อยู่)

แนะนำ: ใช้ตัวถอนการติดตั้งที่มากับระบบ:

```bash
openclaw uninstall
```

แบบไม่โต้ตอบ (automation / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

ขั้นตอนแบบแมนนวล (ได้ผลลัพธ์เหมือนกัน):

1. หยุด gateway service:

```bash
openclaw gateway stop
```

2. ถอนการติดตั้ง gateway service (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. ลบ state + config:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

หากคุณตั้ง `OPENCLAW_CONFIG_PATH` ให้ชี้ไปยังตำแหน่งแบบกำหนดเองที่อยู่นอก state dir ให้ลบไฟล์นั้นด้วย

4. ลบ workspace ของคุณ (ไม่บังคับ, จะลบไฟล์ของ agent):

```bash
rm -rf ~/.openclaw/workspace
```

5. ลบการติดตั้ง CLI (เลือกตามวิธีที่คุณใช้):

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

- หากคุณใช้โปรไฟล์ (`--profile` / `OPENCLAW_PROFILE`) ให้ทำขั้นตอนที่ 3 ซ้ำสำหรับแต่ละ state dir (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
- ในโหมดรีโมต state dir จะอยู่บน **โฮสต์ของ gateway** ดังนั้นให้ทำขั้นตอน 1-4 ที่นั่นด้วย

## การลบ service ด้วยตนเอง (ไม่ได้ติดตั้ง CLI)

ใช้วิธีนี้หาก gateway service ยังทำงานอยู่ แต่ไม่มี `openclaw`

### macOS (launchd)

label ค่าเริ่มต้นคือ `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>`; แบบเดิม `com.openclaw.*` อาจยังมีอยู่):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

หากคุณใช้โปรไฟล์ ให้แทนที่ label และชื่อ plist ด้วย `ai.openclaw.<profile>` ลบ plist แบบเดิม `com.openclaw.*` ที่มีอยู่ด้วย หากพบ

### Linux (systemd user unit)

ชื่อ unit ค่าเริ่มต้นคือ `openclaw-gateway.service` (หรือ `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

ชื่องานค่าเริ่มต้นคือ `OpenClaw Gateway` (หรือ `OpenClaw Gateway (<profile>)`)
สคริปต์ของ task อยู่ใต้ state dir ของคุณ

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

หากคุณใช้โปรไฟล์ ให้ลบชื่องานที่ตรงกันและ `~\.openclaw-<profile>\gateway.cmd`

## การติดตั้งปกติเทียบกับ source checkout

### การติดตั้งปกติ (install.sh / npm / pnpm / bun)

หากคุณใช้ `https://openclaw.ai/install.sh` หรือ `install.ps1`, CLI จะถูกติดตั้งด้วย `npm install -g openclaw@latest`
ให้ลบด้วย `npm rm -g openclaw` (หรือ `pnpm remove -g` / `bun remove -g` หากคุณติดตั้งด้วยวิธีนั้น)

### source checkout (`git clone`)

หากคุณรันจาก repo checkout (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. ถอนการติดตั้ง gateway service **ก่อน** ลบ repo (ใช้เส้นทางง่ายด้านบนหรือการลบ service ด้วยตนเอง)
2. ลบไดเรกทอรี repo
3. ลบ state + workspace ตามที่แสดงด้านบน
