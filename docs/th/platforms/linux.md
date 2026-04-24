---
read_when:
    - กำลังมองหาสถานะของแอปคู่หูสำหรับ Linux
    - การวางแผนความครอบคลุมของแพลตฟอร์มหรือการมีส่วนร่วม
    - การดีบัก Linux OOM kills หรือ exit 137 บน VPS หรือคอนเทนเนอร์
summary: การรองรับ Linux + สถานะของแอปคู่หู
title: แอป Linux
x-i18n:
    generated_at: "2026-04-24T09:21:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Gateway รองรับ Linux อย่างสมบูรณ์ **Node คือ runtime ที่แนะนำ**
ไม่แนะนำให้ใช้ Bun กับ Gateway (มีบั๊กกับ WhatsApp/Telegram)

แอปคู่หูแบบเนทีฟสำหรับ Linux มีแผนจะทำในอนาคต ยินดีรับการมีส่วนร่วม หากคุณต้องการช่วยสร้าง

## เส้นทางแบบเร็วสำหรับผู้เริ่มต้น (VPS)

1. ติดตั้ง Node 24 (แนะนำ; Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังใช้งานได้เพื่อความเข้ากันได้)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. จากแล็ปท็อปของคุณ: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. เปิด `http://127.0.0.1:18789/` แล้วทำการยืนยันตัวตนด้วย shared secret ที่กำหนดไว้ (ใช้ token โดยค่าเริ่มต้น; ใช้ password หากคุณตั้ง `gateway.auth.mode: "password"`)

คู่มือ Linux server ฉบับเต็ม: [Linux Server](/th/vps) ตัวอย่าง VPS แบบทีละขั้นตอน: [exe.dev](/th/install/exe-dev)

## การติดตั้ง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การติดตั้งและการอัปเดต](/th/install/updating)
- โฟลว์ทางเลือก: [Bun (experimental)](/th/install/bun), [Nix](/th/install/nix), [Docker](/th/install/docker)

## Gateway

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การกำหนดค่า](/th/gateway/configuration)

## การติดตั้งบริการ Gateway (CLI)

ใช้คำสั่งใดคำสั่งหนึ่งต่อไปนี้:

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

เลือก **Gateway service** เมื่อมีการถาม

การซ่อมแซม/ย้ายระบบ:

```
openclaw doctor
```

## การควบคุมระบบ (systemd user unit)

OpenClaw จะติดตั้งเป็นบริการ systemd แบบ **user** โดยค่าเริ่มต้น ให้ใช้บริการแบบ **system**
สำหรับเซิร์ฟเวอร์ที่ใช้ร่วมกันหรือเปิดใช้งานตลอดเวลา `openclaw gateway install` และ
`openclaw onboard --install-daemon` จะเรนเดอร์ unit แบบมาตรฐานปัจจุบัน
ให้คุณอยู่แล้ว ให้เขียนเองด้วยมือเฉพาะเมื่อคุณต้องการการตั้งค่าระบบ/service-manager แบบกำหนดเอง
คำแนะนำเต็มเกี่ยวกับบริการอยู่ใน [คู่มือปฏิบัติการ Gateway](/th/gateway)

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

## แรงกดดันด้านหน่วยความจำและ OOM kills

บน Linux เคอร์เนลจะเลือก OOM victim เมื่อโฮสต์ VM หรือ container cgroup
มีหน่วยความจำไม่พอ Gateway อาจเป็นเหยื่อที่ไม่เหมาะ เพราะมันเป็นเจ้าของ
เซสชันระยะยาวและการเชื่อมต่อช่องทาง OpenClaw จึงโน้มเอียงให้ child
processes แบบชั่วคราวถูก kill ก่อน Gateway เมื่อเป็นไปได้

สำหรับการ spawn child บน Linux ที่เข้าเกณฑ์ OpenClaw จะเริ่ม child ผ่าน
wrapper สั้น ๆ ของ `/bin/sh` ที่ยก `oom_score_adj` ของ child เองเป็น `1000` จากนั้น
จึง `exec` คำสั่งจริง การทำเช่นนี้เป็นการดำเนินการแบบไม่มีสิทธิพิเศษ เพราะ child
เพียงแค่เพิ่มโอกาสที่ตัวเองจะถูก kill จาก OOM

พื้นผิว child process ที่ครอบคลุมมีดังนี้:

- command children ที่จัดการโดย supervisor,
- PTY shell children,
- MCP stdio server children,
- browser/Chrome processes ที่ OpenClaw เป็นผู้เริ่ม

wrapper นี้ใช้เฉพาะบน Linux และจะถูกข้ามหากไม่มี `/bin/sh`
นอกจากนี้จะถูกข้ามหาก env ของ child ตั้ง `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` หรือ `off`

หากต้องการตรวจสอบ child process:

```bash
cat /proc/<child-pid>/oom_score_adj
```

ค่าที่คาดหวังสำหรับ child ที่อยู่ในขอบเขตนี้คือ `1000` ส่วนโปรเซส Gateway ควรคงค่าปกติของมันไว้ ซึ่งโดยทั่วไปคือ `0`

สิ่งนี้ไม่ได้แทนที่การปรับแต่งหน่วยความจำตามปกติ หาก VPS หรือ container
ยังคง kill children ซ้ำ ๆ ให้เพิ่ม memory limit ลด concurrency
หรือเพิ่ม resource controls ที่เข้มงวดขึ้น เช่น systemd `MemoryMax=` หรือ memory limits ระดับ container

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Linux server](/th/vps)
- [Raspberry Pi](/th/install/raspberry-pi)
