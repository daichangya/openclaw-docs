---
read_when:
    - การตั้งค่า OpenClaw บน Oracle Cloud
    - กำลังมองหาโฮสติ้ง VPS ราคาประหยัดสำหรับ OpenClaw
    - ต้องการให้ OpenClaw ทำงานตลอด 24/7 บนเซิร์ฟเวอร์ขนาดเล็ก
summary: OpenClaw บน Oracle Cloud (Always Free ARM)
title: Oracle Cloud (แพลตฟอร์ม)
x-i18n:
    generated_at: "2026-04-24T09:22:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw บน Oracle Cloud (OCI)

## เป้าหมาย

รัน OpenClaw Gateway แบบถาวรบน ARM tier แบบ **Always Free** ของ Oracle Cloud

Free tier ของ Oracle อาจเหมาะกับ OpenClaw มาก (โดยเฉพาะถ้าคุณมีบัญชี OCI อยู่แล้ว) แต่ก็มาพร้อมกับข้อแลกเปลี่ยน:

- สถาปัตยกรรม ARM (ส่วนใหญ่ใช้งานได้ แต่บางไบนารีอาจรองรับเฉพาะ x86)
- ความพร้อมของทรัพยากรและการสมัครใช้งานอาจมีความจุกจิก

## การเปรียบเทียบค่าใช้จ่าย (2026)

| ผู้ให้บริการ | แผน            | สเปก                  | ราคา/เดือน | หมายเหตุ              |
| ------------- | -------------- | --------------------- | ---------- | --------------------- |
| Oracle Cloud  | Always Free ARM | สูงสุด 4 OCPU, RAM 24GB | $0         | ARM, ทรัพยากรจำกัด   |
| Hetzner       | CX22           | 2 vCPU, RAM 4GB       | ~ $4       | ตัวเลือกแบบเสียเงินที่ถูกที่สุด |
| DigitalOcean  | Basic          | 1 vCPU, RAM 1GB       | $6         | UI ใช้ง่าย, เอกสารดี |
| Vultr         | Cloud Compute  | 1 vCPU, RAM 1GB       | $6         | มีหลายโลเคชัน        |
| Linode        | Nanode         | 1 vCPU, RAM 1GB       | $5         | ปัจจุบันเป็นส่วนหนึ่งของ Akamai |

---

## ข้อกำหนดเบื้องต้น

- บัญชี Oracle Cloud ([สมัครใช้งาน](https://www.oracle.com/cloud/free/)) — ดู [คู่มือสมัครใช้งานจากชุมชน](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) หากพบปัญหา
- บัญชี Tailscale (ใช้ฟรีที่ [tailscale.com](https://tailscale.com))
- เวลาประมาณ 30 นาที

## 1) สร้าง OCI Instance

1. เข้าสู่ระบบ [Oracle Cloud Console](https://cloud.oracle.com/)
2. ไปที่ **Compute → Instances → Create Instance**
3. กำหนดค่า:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (หรือสูงสุด 4)
   - **Memory:** 12 GB (หรือสูงสุด 24 GB)
   - **Boot volume:** 50 GB (ใช้ฟรีได้สูงสุด 200 GB)
   - **SSH key:** เพิ่ม public key ของคุณ
4. คลิก **Create**
5. จดบันทึก public IP address

**เคล็ดลับ:** หากการสร้าง instance ล้มเหลวพร้อมข้อความ "Out of capacity" ให้ลอง availability domain อื่น หรือลองใหม่ภายหลัง ทรัพยากรของ free tier มีจำกัด

## 2) เชื่อมต่อและอัปเดตระบบ

```bash
# เชื่อมต่อผ่าน public IP
ssh ubuntu@YOUR_PUBLIC_IP

# อัปเดตระบบ
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**หมายเหตุ:** ต้องใช้ `build-essential` สำหรับการคอมไพล์ dependency บางตัวบน ARM

## 3) กำหนดค่าผู้ใช้และ hostname

```bash
# ตั้งค่า hostname
sudo hostnamectl set-hostname openclaw

# ตั้งรหัสผ่านให้ผู้ใช้ ubuntu
sudo passwd ubuntu

# เปิดใช้ lingering (ให้ user service ทำงานต่อหลังออกจากระบบ)
sudo loginctl enable-linger ubuntu
```

## 4) ติดตั้ง Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

การตั้งค่านี้จะเปิดใช้ Tailscale SSH ทำให้คุณเชื่อมต่อผ่าน `ssh openclaw` ได้จากทุกอุปกรณ์ใน tailnet ของคุณ โดยไม่ต้องใช้ public IP

ตรวจสอบ:

```bash
tailscale status
```

**ตั้งแต่นี้ไป ให้เชื่อมต่อผ่าน Tailscale:** `ssh ubuntu@openclaw` (หรือใช้ Tailscale IP)

## 5) ติดตั้ง OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

เมื่อมีคำถาม "How do you want to hatch your bot?" ให้เลือก **"Do this later"**

> หมายเหตุ: หากพบปัญหา ARM-native build ให้เริ่มจากติดตั้ง system package ก่อน (เช่น `sudo apt install -y build-essential`) ก่อนค่อยพิจารณาใช้ Homebrew

## 6) กำหนดค่า Gateway (loopback + token auth) และเปิดใช้ Tailscale Serve

ใช้ token auth เป็นค่าเริ่มต้น เพราะคาดเดาพฤติกรรมได้ง่ายและไม่ต้องเปิดใช้ flag “insecure auth” ใน Control UI

```bash
# ให้ Gateway เป็นแบบ private ภายใน VM
openclaw config set gateway.bind loopback

# บังคับให้ Gateway + Control UI ต้องยืนยันตัวตน
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# เปิดเผยผ่าน Tailscale Serve (HTTPS + เข้าถึงได้จาก tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` ในที่นี้ใช้เฉพาะกับการจัดการ forwarded-IP/local-client ของ local Tailscale Serve proxy เท่านั้น **ไม่ใช่** `gateway.auth.mode: "trusted-proxy"` เส้นทางของ diff viewer ในการตั้งค่านี้ยังคงมีพฤติกรรม fail-closed: คำขอ viewer แบบ raw `127.0.0.1` ที่ไม่มี forwarded proxy headers อาจตอบกลับว่า `Diff not found` ใช้ `mode=file` / `mode=both` สำหรับไฟล์แนบ หรือเปิดใช้ remote viewers โดยตั้งใจและกำหนด `plugins.entries.diffs.config.viewerBaseUrl` (หรือส่ง proxy `baseUrl`) หากคุณต้องการลิงก์ viewer ที่แชร์ได้

## 7) ตรวจสอบการทำงาน

```bash
# ตรวจสอบเวอร์ชัน
openclaw --version

# ตรวจสอบสถานะ daemon
systemctl --user status openclaw-gateway.service

# ตรวจสอบ Tailscale Serve
tailscale serve status

# ทดสอบการตอบสนองในเครื่อง
curl http://localhost:18789
```

## 8) ล็อกดาวน์ความปลอดภัยของ VCN

เมื่อทุกอย่างทำงานได้แล้ว ให้ล็อกดาวน์ VCN เพื่อบล็อกทราฟฟิกทั้งหมด ยกเว้น Tailscale Virtual Cloud Network ของ OCI ทำหน้าที่เป็นไฟร์วอลล์ที่ขอบเครือข่าย — ทราฟฟิกจะถูกบล็อกก่อนถึง instance ของคุณ

1. ไปที่ **Networking → Virtual Cloud Networks** ใน OCI Console
2. คลิก VCN ของคุณ → **Security Lists** → Default Security List
3. **ลบ** ingress rule ทั้งหมด ยกเว้น:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. คง egress rule เริ่มต้นไว้ (อนุญาต outbound ทั้งหมด)

การตั้งค่านี้จะบล็อก SSH ที่พอร์ต 22, HTTP, HTTPS และทุกอย่างอื่นที่ขอบเครือข่าย ตั้งแต่นี้ไป คุณจะเชื่อมต่อได้ผ่าน Tailscale เท่านั้น

---

## เข้าถึง Control UI

จากอุปกรณ์ใดก็ได้ในเครือข่าย Tailscale ของคุณ:

```
https://openclaw.<tailnet-name>.ts.net/
```

แทนที่ `<tailnet-name>` ด้วยชื่อ tailnet ของคุณ (ดูได้จาก `tailscale status`)

ไม่ต้องใช้ SSH tunnel Tailscale มีให้ดังนี้:

- การเข้ารหัส HTTPS (certificate อัตโนมัติ)
- การยืนยันตัวตนผ่าน Tailscale identity
- การเข้าถึงจากทุกอุปกรณ์ใน tailnet ของคุณ (แล็ปท็อป โทรศัพท์ ฯลฯ)

---

## ความปลอดภัย: VCN + Tailscale (baseline ที่แนะนำ)

เมื่อ VCN ถูกล็อกดาวน์แล้ว (เปิดเฉพาะ UDP 41641) และ Gateway bind กับ loopback คุณจะได้ defense-in-depth ที่แข็งแรง: ทราฟฟิกสาธารณะถูกบล็อกที่ขอบเครือข่าย และการเข้าถึงระดับผู้ดูแลจะเกิดขึ้นผ่าน tailnet ของคุณ

การตั้งค่านี้มักทำให้ **ไม่จำเป็น** ต้องมี host-based firewall rule เพิ่มเติมเพียงเพื่อหยุดการ brute force SSH จากอินเทอร์เน็ตทั้งหมด — แต่คุณยังควรอัปเดต OS ให้ล่าสุด รัน `openclaw security audit` และตรวจสอบว่าคุณไม่ได้เผลอเปิดฟังบน public interface

### มีการป้องกันอยู่แล้ว

| ขั้นตอนแบบดั้งเดิม | จำเป็นหรือไม่? | เหตุผล                                                                       |
| ------------------ | --------------- | ---------------------------------------------------------------------------- |
| UFW firewall       | ไม่             | VCN บล็อกก่อนที่ทราฟฟิกจะถึง instance                                       |
| fail2ban           | ไม่             | ไม่มี brute force หากพอร์ต 22 ถูกบล็อกที่ VCN                              |
| sshd hardening     | ไม่             | Tailscale SSH ไม่ได้ใช้ sshd                                                |
| Disable root login | ไม่             | Tailscale ใช้ Tailscale identity ไม่ใช่ system user                         |
| SSH key-only auth  | ไม่             | Tailscale ยืนยันตัวตนผ่าน tailnet ของคุณ                                     |
| IPv6 hardening     | โดยทั่วไปไม่จำเป็น | ขึ้นอยู่กับการตั้งค่า VCN/subnet ของคุณ; ให้ตรวจสอบสิ่งที่ถูกกำหนด/เปิดเผยจริง |

### ยังแนะนำให้ทำ

- **สิทธิ์ของ credential:** `chmod 700 ~/.openclaw`
- **Security audit:** `openclaw security audit`
- **การอัปเดตระบบ:** รัน `sudo apt update && sudo apt upgrade` เป็นประจำ
- **ติดตาม Tailscale:** ตรวจสอบอุปกรณ์ใน [Tailscale admin console](https://login.tailscale.com/admin)

### ตรวจสอบสถานะความปลอดภัย

```bash
# ยืนยันว่าไม่มี public port ที่กำลังฟังอยู่
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# ยืนยันว่า Tailscale SSH ทำงานอยู่
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# ทางเลือก: ปิด sshd ทั้งหมด
sudo systemctl disable --now ssh
```

---

## ทางเลือกสำรอง: SSH Tunnel

หาก Tailscale Serve ใช้งานไม่ได้ ให้ใช้ SSH tunnel:

```bash
# จากเครื่อง local ของคุณ (ผ่าน Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

จากนั้นเปิด `http://localhost:18789`

---

## การแก้ไขปัญหา

### การสร้าง instance ล้มเหลว ("Out of capacity")

Free tier ARM instance เป็นที่นิยม ลองทำดังนี้:

- ใช้ availability domain อื่น
- ลองใหม่ในช่วงนอกเวลาใช้งานหนาแน่น (เช้ามืด)
- ใช้ตัวกรอง "Always Free" ตอนเลือก shape

### Tailscale เชื่อมต่อไม่ได้

```bash
# ตรวจสอบสถานะ
sudo tailscale status

# ยืนยันตัวตนใหม่
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway เริ่มทำงานไม่ได้

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### ไม่สามารถเข้าถึง Control UI ได้

```bash
# ตรวจสอบว่า Tailscale Serve กำลังทำงานอยู่
tailscale serve status

# ตรวจสอบว่า gateway กำลังฟังอยู่
curl http://localhost:18789

# รีสตาร์ตหากจำเป็น
systemctl --user restart openclaw-gateway.service
```

### ปัญหาไบนารี ARM

บางเครื่องมืออาจไม่มี build สำหรับ ARM ตรวจสอบดังนี้:

```bash
uname -m  # ควรแสดง aarch64
```

แพ็กเกจ npm ส่วนใหญ่ทำงานได้ดี สำหรับไบนารี ให้มองหารุ่น `linux-arm64` หรือ `aarch64`

---

## การคงอยู่ของข้อมูล

สถานะทั้งหมดจะอยู่ใน:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` ของแต่ละ agent, state ของ channel/provider และข้อมูล session
- `~/.openclaw/workspace/` — workspace (`SOUL.md`, memory, artifacts)

สำรองข้อมูลเป็นระยะ:

```bash
openclaw backup create
```

---

## ที่เกี่ยวข้อง

- [การเข้าถึง Gateway จากระยะไกล](/th/gateway/remote) — รูปแบบการเข้าถึงระยะไกลอื่น ๆ
- [การผสานรวม Tailscale](/th/gateway/tailscale) — เอกสาร Tailscale ฉบับเต็ม
- [การกำหนดค่า Gateway](/th/gateway/configuration) — ตัวเลือก config ทั้งหมด
- [คู่มือ DigitalOcean](/th/install/digitalocean) — หากคุณต้องการแบบเสียเงิน + สมัครง่ายกว่า
- [คู่มือ Hetzner](/th/install/hetzner) — ทางเลือกแบบ Docker
