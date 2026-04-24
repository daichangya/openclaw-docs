---
read_when:
    - คุณต้องการรัน Gateway บนเซิร์ฟเวอร์ Linux หรือ cloud VPS
    - คุณต้องการแผนที่สั้น ๆ ของคู่มือการโฮสต์
    - คุณต้องการแนวทางการปรับแต่งเซิร์ฟเวอร์ Linux ทั่วไปสำหรับ OpenClaw
sidebarTitle: Linux Server
summary: รัน OpenClaw บนเซิร์ฟเวอร์ Linux หรือ cloud VPS — ตัวเลือกผู้ให้บริการ, สถาปัตยกรรม และการปรับแต่ง
title: เซิร์ฟเวอร์ Linux
x-i18n:
    generated_at: "2026-04-24T09:39:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

รัน OpenClaw Gateway บนเซิร์ฟเวอร์ Linux หรือ cloud VPS ใดก็ได้ หน้านี้ช่วยคุณ
เลือกผู้ให้บริการ อธิบายวิธีทำงานของการปรับใช้บนคลาวด์ และครอบคลุมการปรับแต่ง Linux
ทั่วไปที่ใช้ได้ทุกที่

## เลือกผู้ให้บริการ

<CardGroup cols={2}>
  <Card title="Railway" href="/th/install/railway">ตั้งค่าแบบคลิกเดียวผ่านเบราว์เซอร์</Card>
  <Card title="Northflank" href="/th/install/northflank">ตั้งค่าแบบคลิกเดียวผ่านเบราว์เซอร์</Card>
  <Card title="DigitalOcean" href="/th/install/digitalocean">VPS แบบเสียเงินที่เรียบง่าย</Card>
  <Card title="Oracle Cloud" href="/th/install/oracle">ARM tier ฟรีตลอดไป</Card>
  <Card title="Fly.io" href="/th/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/th/install/hetzner">Docker บน Hetzner VPS</Card>
  <Card title="Hostinger" href="/th/install/hostinger">VPS พร้อมการตั้งค่าแบบคลิกเดียว</Card>
  <Card title="GCP" href="/th/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/th/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/th/install/exe-dev">VM พร้อม HTTPS proxy</Card>
  <Card title="Raspberry Pi" href="/th/install/raspberry-pi">ARM แบบ self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** ก็ใช้งานได้ดีเช่นกัน
มีวิดีโอแนะนำโดยชุมชนให้ดูได้ที่
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ทรัพยากรจากชุมชน -- อาจไม่พร้อมใช้งานในอนาคต)

## วิธีการทำงานของการตั้งค่าบนคลาวด์

- **Gateway ทำงานอยู่บน VPS** และเป็นเจ้าของ state + workspace
- คุณเชื่อมต่อจากแล็ปท็อปหรือโทรศัพท์ผ่าน **Control UI** หรือ **Tailscale/SSH**
- ให้ถือว่า VPS เป็นแหล่งข้อมูลจริง และทำ **การสำรองข้อมูล** ของ state + workspace เป็นประจำ
- ค่าเริ่มต้นที่ปลอดภัย: ให้ Gateway อยู่บน loopback และเข้าถึงผ่าน SSH tunnel หรือ Tailscale Serve
  หากคุณ bind ไปที่ `lan` หรือ `tailnet` ให้กำหนด `gateway.auth.token` หรือ `gateway.auth.password`

หน้าที่เกี่ยวข้อง: [การเข้าถึง Gateway จากระยะไกล](/th/gateway/remote), [ศูนย์รวมแพลตฟอร์ม](/th/platforms)

## เอเจนต์แบบใช้ร่วมกันในบริษัทบน VPS

การรันเอเจนต์ตัวเดียวสำหรับทั้งทีมเป็นการตั้งค่าที่ใช้ได้ เมื่อผู้ใช้ทุกคนอยู่ในขอบเขตความเชื่อถือเดียวกัน และเอเจนต์นั้นใช้เพื่อธุรกิจเท่านั้น

- ให้ใช้งานบน runtime เฉพาะ (VPS/VM/container + ผู้ใช้/บัญชี OS เฉพาะ)
- อย่าลงชื่อเข้าใช้ runtime นั้นด้วยบัญชี Apple/Google ส่วนตัว หรือโปรไฟล์เบราว์เซอร์/ตัวจัดการรหัสผ่านส่วนตัว
- หากผู้ใช้มีความเป็นปฏิปักษ์ต่อกัน ให้แยกตาม gateway/host/ผู้ใช้ OS

รายละเอียดของโมเดลความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## การใช้ nodes กับ VPS

คุณสามารถเก็บ Gateway ไว้บนคลาวด์และจับคู่ **nodes** บนอุปกรณ์ในเครื่องของคุณ
(Mac/iOS/Android/headless) ได้ Nodes จะให้ความสามารถด้านหน้าจอ/กล้อง/canvas ภายในเครื่องและ
`system.run` ขณะที่ Gateway ยังคงอยู่บนคลาวด์

เอกสาร: [Nodes](/th/nodes), [Nodes CLI](/th/cli/nodes)

## การปรับแต่งการเริ่มต้นสำหรับ VM ขนาดเล็กและโฮสต์ ARM

หากคำสั่ง CLI รู้สึกช้าบน VM ประสิทธิภาพต่ำ (หรือโฮสต์ ARM) ให้เปิดใช้ module compile cache ของ Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` ช่วยให้เวลาเริ่มต้นของคำสั่งที่รันซ้ำดีขึ้น
- `OPENCLAW_NO_RESPAWN=1` ช่วยหลีกเลี่ยงโอเวอร์เฮดเพิ่มเติมจากเส้นทาง self-respawn ตอนเริ่มต้น
- การรันคำสั่งครั้งแรกจะวอร์มแคช; ครั้งถัดไปจะเร็วขึ้น
- สำหรับรายละเอียดเฉพาะของ Raspberry Pi ดู [Raspberry Pi](/th/install/raspberry-pi)

### เช็กลิสต์การปรับแต่ง systemd (ทางเลือก)

สำหรับโฮสต์ VM ที่ใช้ `systemd` ให้พิจารณา:

- เพิ่ม service env เพื่อให้เส้นทางเริ่มต้นคงที่:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- กำหนดพฤติกรรมการรีสตาร์ตให้ชัดเจน:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- ควรใช้ดิสก์แบบ SSD สำหรับพาธ state/cache เพื่อลดค่าปรับจาก random I/O ระหว่าง cold start

สำหรับเส้นทางมาตรฐาน `openclaw onboard --install-daemon` ให้แก้ไข user unit:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

หากคุณจงใจติดตั้งเป็น system unit แทน ให้แก้ไข
`openclaw-gateway.service` ผ่าน `sudo systemctl edit openclaw-gateway.service`

นโยบาย `Restart=` ช่วยให้ระบบกู้คืนบริการอัตโนมัติได้อย่างไร:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)

สำหรับพฤติกรรม OOM บน Linux การเลือก child process เป็นเหยื่อ และการวินิจฉัย `exit 137`
ดู [แรงกดดันด้านหน่วยความจำและการฆ่า OOM บน Linux](/th/platforms/linux#memory-pressure-and-oom-kills)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [DigitalOcean](/th/install/digitalocean)
- [Fly.io](/th/install/fly)
- [Hetzner](/th/install/hetzner)
