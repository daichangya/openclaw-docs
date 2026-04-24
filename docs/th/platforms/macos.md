---
read_when:
    - การพัฒนาฟีเจอร์ของแอป macOS
    - การเปลี่ยนวงจรชีวิตของ gateway หรือ node bridging บน macOS
summary: แอปคู่หู OpenClaw บน macOS (menu bar + gateway broker)
title: แอป macOS
x-i18n:
    generated_at: "2026-04-24T09:22:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

แอป macOS คือ **แอปคู่หูบน menu bar** สำหรับ OpenClaw มันเป็นเจ้าของ permissions,
จัดการ/เชื่อมต่อกับ Gateway ในเครื่อง (ผ่าน launchd หรือแบบ manual) และเปิดเผย
capabilities ของ macOS ให้เอเจนต์ในรูปแบบโหนด

## สิ่งที่แอปทำ

- แสดงการแจ้งเตือนและสถานะแบบเนทีฟบน menu bar
- เป็นเจ้าของ TCC prompts (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript)
- รันหรือเชื่อมต่อกับ Gateway (ในเครื่องหรือระยะไกล)
- เปิดเผย tools ที่มีเฉพาะบน macOS (Canvas, Camera, Screen Recording, `system.run`)
- เริ่มบริการ local node host ในโหมด **remote** (launchd) และหยุดมันในโหมด **local**
- สามารถโฮสต์ **PeekabooBridge** สำหรับ UI automation ได้
- ติดตั้ง CLI แบบ global (`openclaw`) ตามคำขอผ่าน npm, pnpm หรือ bun (แอปจะเลือก npm ก่อน จากนั้น pnpm แล้วจึง bun; Node ยังคงเป็น runtime ของ Gateway ที่แนะนำ)

## โหมด Local เทียบกับ Remote

- **Local** (ค่าเริ่มต้น): แอปจะเชื่อมต่อกับ Gateway ในเครื่องที่กำลังทำงานอยู่หากมี;
  มิฉะนั้นจะเปิดใช้บริการ launchd ผ่าน `openclaw gateway install`
- **Remote**: แอปเชื่อมต่อกับ Gateway ผ่าน SSH/Tailscale และจะไม่เริ่ม
  โปรเซสในเครื่อง
  แอปจะเริ่ม **node host service** ในเครื่องเพื่อให้ Gateway ระยะไกลเข้าถึง Mac เครื่องนี้ได้
  แอปจะไม่ spawn Gateway เป็น child process
  ตอนนี้การค้นหา Gateway จะให้ความสำคัญกับชื่อ Tailscale MagicDNS มากกว่า tailnet IP แบบดิบ
  ทำให้แอป Mac กู้คืนการเชื่อมต่อได้เชื่อถือได้มากขึ้นเมื่อ tailnet IP เปลี่ยน

## การควบคุม Launchd

แอปจะจัดการ LaunchAgent รายผู้ใช้ที่มีป้ายกำกับ `ai.openclaw.gateway`
(หรือ `ai.openclaw.<profile>` เมื่อใช้ `--profile`/`OPENCLAW_PROFILE`; รุ่นเก่า `com.openclaw.*` จะยังถูก unload)

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

ให้แทนป้ายกำกับเป็น `ai.openclaw.<profile>` เมื่อรัน profile ที่มีชื่อ

หากยังไม่ได้ติดตั้ง LaunchAgent ให้เปิดใช้งานจากแอปหรือรัน
`openclaw gateway install`

## ความสามารถของโหนด (mac)

แอป macOS นำเสนอตัวเองเป็นโหนด คำสั่งที่ใช้บ่อย:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

โหนดจะรายงาน `permissions` map เพื่อให้เอเจนต์ตัดสินใจได้ว่าอนุญาตอะไรบ้าง

บริการโหนด + app IPC:

- เมื่อ headless node host service ทำงานอยู่ (โหมด remote) มันจะเชื่อมต่อกับ Gateway WS เป็นโหนด
- `system.run` จะทำงานในแอป macOS (บริบท UI/TCC) ผ่าน local Unix socket; prompts + output จะอยู่ในแอป

แผนภาพ (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## การอนุมัติ exec (`system.run`)

`system.run` ถูกควบคุมโดย **การอนุมัติ exec** ในแอป macOS (Settings → Exec approvals)
Security + ask + allowlist จะถูกเก็บไว้ในเครื่อง Mac ที่:

```
~/.openclaw/exec-approvals.json
```

ตัวอย่าง:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

หมายเหตุ:

- entries ของ `allowlist` เป็น glob patterns สำหรับ resolved binary paths
- ข้อความคำสั่ง shell ดิบที่มีไวยากรณ์ควบคุมหรือขยาย shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) จะถือว่าเป็น allowlist miss และต้องได้รับการอนุมัติอย่างชัดเจน (หรือเพิ่ม shell binary ลง allowlist)
- การเลือก “Always Allow” ใน prompt จะเพิ่มคำสั่งนั้นเข้า allowlist
- environment overrides ของ `system.run` จะถูกกรอง (ตัด `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) แล้วจึง merge กับ environment ของแอป
- สำหรับ shell wrappers (`bash|sh|zsh ... -c/-lc`), request-scoped environment overrides จะถูกลดเหลือ allowlist แบบชัดเจนขนาดเล็ก (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจ allow-always ในโหมด allowlist, known dispatch wrappers (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะคง inner executable paths แทน wrapper paths หากการคลาย wrapper ไม่ปลอดภัย จะไม่มีการบันทึก allowlist entry โดยอัตโนมัติ

## Deep links

แอปลงทะเบียน URL scheme `openclaw://` สำหรับ actions ในเครื่อง

### `openclaw://agent`

กระตุ้นคำขอ `agent` ของ Gateway
__OC_I18N_900004__
Query parameters:

- `message` (จำเป็น)
- `sessionKey` (ไม่บังคับ)
- `thinking` (ไม่บังคับ)
- `deliver` / `to` / `channel` (ไม่บังคับ)
- `timeoutSeconds` (ไม่บังคับ)
- `key` (ไม่บังคับ สำหรับโหมด unattended)

ความปลอดภัย:

- หากไม่มี `key`, แอปจะถามยืนยันก่อน
- หากไม่มี `key`, แอปจะบังคับใช้ขีดจำกัดข้อความสั้นสำหรับ prompt การยืนยัน และจะเพิกเฉยต่อ `deliver` / `to` / `channel`
- หากมี `key` ที่ถูกต้อง การรันจะเป็นแบบ unattended (ตั้งใจสำหรับ automation ส่วนบุคคล)

## โฟลว์ Onboarding (โดยทั่วไป)

1. ติดตั้งและเปิด **OpenClaw.app**
2. ทำรายการตรวจสอบ permissions (TCC prompts) ให้เสร็จ
3. ตรวจสอบว่าโหมด **Local** ทำงานอยู่และ Gateway กำลังทำงาน
4. ติดตั้ง CLI หากคุณต้องการเข้าถึงผ่านเทอร์มินัล

## ตำแหน่ง state dir (macOS)

หลีกเลี่ยงการวาง state dir ของ OpenClaw ไว้ใน iCloud หรือโฟลเดอร์ที่ซิงก์กับคลาวด์อื่น ๆ
paths ที่รองรับการซิงก์อาจเพิ่ม latency และบางครั้งทำให้เกิด file-lock/sync races สำหรับ
sessions และ credentials

ควรใช้ state path ในเครื่องที่ไม่ซิงก์ เช่น:
__OC_I18N_900005__
หาก `openclaw doctor` ตรวจพบ state อยู่ภายใต้:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

มันจะเตือนและแนะนำให้ย้ายกลับไปยัง local path

## เวิร์กโฟลว์ build และ dev (แบบเนทีฟ)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (หรือ Xcode)
- แพ็กเกจแอป: `scripts/package-mac-app.sh`

## ดีบักการเชื่อมต่อ gateway (macOS CLI)

ใช้ debug CLI เพื่อทดสอบ Gateway WebSocket handshake และตรรกะการค้นหา
แบบเดียวกับที่แอป macOS ใช้ โดยไม่ต้องเปิดแอป
__OC_I18N_900006__
ตัวเลือกของ connect:

- `--url <ws://host:port>`: กำหนดแทน config
- `--mode <local|remote>`: resolve จาก config (ค่าเริ่มต้น: จาก config หรือ local)
- `--probe`: บังคับทำ health probe ใหม่
- `--timeout <ms>`: request timeout (ค่าเริ่มต้น: `15000`)
- `--json`: ผลลัพธ์แบบมีโครงสร้างสำหรับการเปรียบเทียบ

ตัวเลือกของ discovery:

- `--include-local`: รวม gateways ที่ปกติจะถูกกรองว่าเป็น “local”
- `--timeout <ms>`: หน้าต่างเวลารวมของการค้นหา (ค่าเริ่มต้น: `2000`)
- `--json`: ผลลัพธ์แบบมีโครงสร้างสำหรับการเปรียบเทียบ

เคล็ดลับ: เปรียบเทียบกับ `openclaw gateway discover --json` เพื่อดูว่า
pipeline การค้นหาของแอป macOS (`local.` บวกกับ wide-area domain ที่กำหนดค่าไว้ พร้อม
wide-area และ Tailscale Serve fallbacks) แตกต่างจาก
การค้นหาแบบ `dns-sd` ของ Node CLI หรือไม่

## โครงสร้างการเชื่อมต่อระยะไกล (SSH tunnels)

เมื่อแอป macOS ทำงานในโหมด **Remote** มันจะเปิด SSH tunnel เพื่อให้ UI components ในเครื่อง
สามารถคุยกับ Gateway ระยะไกลได้เหมือนกับว่าอยู่บน localhost

### Control tunnel (พอร์ต Gateway WebSocket)

- **วัตถุประสงค์:** health checks, status, Web Chat, config และการเรียก control-plane อื่น ๆ
- **พอร์ตในเครื่อง:** พอร์ตของ Gateway (ค่าเริ่มต้น `18789`), คงที่เสมอ
- **พอร์ตระยะไกล:** พอร์ต Gateway เดียวกันบนโฮสต์ระยะไกล
- **พฤติกรรม:** ไม่มี local port แบบสุ่ม; แอปจะใช้ tunnel ที่มีสุขภาพดีอยู่แล้วซ้ำ
  หรือเริ่มใหม่หากจำเป็น
- **รูปแบบ SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` พร้อมตัวเลือก BatchMode +
  ExitOnForwardFailure + keepalive
- **การรายงาน IP:** SSH tunnel ใช้ loopback ดังนั้น gateway จะเห็น node
  IP เป็น `127.0.0.1` หากคุณต้องการให้แสดง IP ของไคลเอนต์จริง
  ให้ใช้การขนส่งแบบ **Direct (ws/wss)** (ดู [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote))

สำหรับขั้นตอนการตั้งค่า ดู [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote) สำหรับ
รายละเอียดของ protocol ดู [Gateway protocol](/th/gateway/protocol)

## เอกสารที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [Gateway (macOS)](/th/platforms/mac/bundled-gateway)
- [สิทธิ์บน macOS](/th/platforms/mac/permissions)
- [Canvas](/th/platforms/mac/canvas)
