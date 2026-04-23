---
read_when:
    - กำลังมองหาสถานะของแอปคู่หูสำหรับ Linux
    - กำลังวางแผนความครอบคลุมของแพลตฟอร์มหรือการมีส่วนร่วม
    - กำลังแก้ไขปัญหา Linux OOM kill หรือ exit 137 บน VPS หรือ container өмassistant to=functions.read commentary  微信的天天中彩票իոնjson  全民彩票_path":"docs/AGENTS.md","offset":1,"limit":200} code
summary: การรองรับ Linux + สถานะของแอปคู่หู
title: แอป Linux
x-i18n:
    generated_at: "2026-04-23T05:44:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# แอป Linux

Gateway รองรับบน Linux อย่างสมบูรณ์ **Node คือรันไทม์ที่แนะนำ**
ไม่แนะนำให้ใช้ Bun กับ Gateway (มีบั๊กกับ WhatsApp/Telegram)

มีแผนสำหรับแอปคู่หูแบบ native บน Linux ในอนาคต หากคุณต้องการช่วยพัฒนา ยินดีรับการมีส่วนร่วม

## เส้นทางแบบรวดเร็วสำหรับผู้เริ่มต้น (VPS)

1. ติดตั้ง Node 24 (แนะนำ; Node 22 LTS, ปัจจุบัน `22.14+`, ยังใช้ได้เพื่อความเข้ากันได้)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. จากแล็ปท็อปของคุณ: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. เปิด `http://127.0.0.1:18789/` และยืนยันตัวตนด้วย shared secret ที่กำหนดไว้ (ใช้ token โดยค่าเริ่มต้น; ใช้ password หากคุณตั้ง `gateway.auth.mode: "password"`)

คู่มือ Linux server ฉบับเต็ม: [Linux Server](/th/vps) ตัวอย่าง VPS แบบทีละขั้นตอน: [exe.dev](/th/install/exe-dev)

## การติดตั้ง

- [Getting Started](/th/start/getting-started)
- [Install & updates](/th/install/updating)
- โฟลว์แบบไม่บังคับ: [Bun (experimental)](/th/install/bun), [Nix](/th/install/nix), [Docker](/th/install/docker)

## Gateway

- [Gateway runbook](/th/gateway)
- [Configuration](/th/gateway/configuration)

## การติดตั้ง Gateway service (CLI)

ใช้วิธีใดวิธีหนึ่งต่อไปนี้:

```
openclaw onboard --install-daemon
```

หรือ:

```
openclaw gateway install
```

หรือ:

```
openclaw configure
```

เมื่อถูกถาม ให้เลือก **Gateway service**

การซ่อมแซม/ย้ายระบบ:

```
openclaw doctor
```

## การควบคุมระบบ (systemd user unit)

โดยค่าเริ่มต้น OpenClaw จะติดตั้ง service แบบ systemd **user** ใช้ service แบบ **system**
สำหรับเซิร์ฟเวอร์ที่ใช้ร่วมกันหรือเปิดตลอดเวลา `openclaw gateway install` และ
`openclaw onboard --install-daemon` จะเรนเดอร์ unit แบบ canonical ปัจจุบัน
ให้คุณอยู่แล้ว; ให้เขียนเองด้วยมือเฉพาะเมื่อคุณต้องการการตั้งค่า system/service-manager
แบบกำหนดเอง คำแนะนำเรื่อง service แบบเต็มอยู่ใน [Gateway runbook](/th/gateway)

การตั้งค่าขั้นต่ำ:

สร้าง `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
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

เปิดใช้งาน:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## แรงกดดันด้านหน่วยความจำและ OOM kill

บน Linux, kernel จะเลือกเหยื่อ OOM เมื่อโฮสต์ VM หรือ cgroup ของ container
หน่วยความจำหมด Gateway อาจเป็นเหยื่อที่ไม่เหมาะเพราะมันถือครองเซสชันระยะยาว
และการเชื่อมต่อช่องทางไว้ OpenClaw จึงปรับให้ child process ชั่วคราว
มีแนวโน้มถูก kill ก่อน Gateway เมื่อทำได้

สำหรับการ spawn child บน Linux ที่เข้าเกณฑ์ OpenClaw จะเริ่ม child ผ่าน
wrapper `/bin/sh` สั้น ๆ ที่เพิ่มค่า `oom_score_adj` ของ child เองเป็น `1000` แล้ว
จึง `exec` คำสั่งจริง นี่เป็นการดำเนินการแบบไม่ต้องมีสิทธิพิเศษ เพราะ child
เพียงเพิ่มโอกาสที่ตัวเองจะถูก OOM kill

พื้นผิวของ child process ที่ครอบคลุม ได้แก่:

- child ของคำสั่งที่จัดการโดย supervisor,
- child ของ PTY shell,
- child ของ MCP stdio server,
- process browser/Chrome ที่ OpenClaw เป็นผู้เปิด

wrapper นี้ใช้เฉพาะบน Linux และจะถูกข้ามเมื่อไม่มี `/bin/sh`
และจะถูกข้ามด้วย หาก env ของ child ตั้ง `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, หรือ `off`

วิธีตรวจสอบ child process:

```bash
cat /proc/<child-pid>/oom_score_adj
```

ค่าที่คาดหวังสำหรับ child ที่ครอบคลุมคือ `1000` ส่วนโปรเซส Gateway ควรคงคะแนน
ปกติไว้ ซึ่งมักเป็น `0`

สิ่งนี้ไม่ได้แทนที่การปรับแต่งหน่วยความจำตามปกติ หาก VPS หรือ container kill child ซ้ำ ๆ
ให้เพิ่มขีดจำกัดหน่วยความจำ ลด concurrency หรือเพิ่มการควบคุมทรัพยากรที่เข้มขึ้น เช่น systemd `MemoryMax=` หรือขีดจำกัดหน่วยความจำระดับ container
