---
read_when:
    - การตั้งค่า OpenClaw บน Oracle Cloud
    - กำลังมองหา VPS ราคาประหยัดสำหรับ OpenClaw
    - ต้องการใช้ OpenClaw แบบ 24/7 บนเซิร์ฟเวอร์ขนาดเล็ก
summary: OpenClaw บน Oracle Cloud (Always Free ARM)
title: Oracle Cloud (Platform)
x-i18n:
    generated_at: "2026-04-23T05:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw บน Oracle Cloud (OCI)

## เป้าหมาย

รัน OpenClaw Gateway แบบคงอยู่ถาวรบนระดับ **Always Free** แบบ ARM ของ Oracle Cloud

ระดับฟรีของ Oracle อาจเหมาะมากกับ OpenClaw (โดยเฉพาะถ้าคุณมีบัญชี OCI อยู่แล้ว) แต่ก็มาพร้อมข้อแลกเปลี่ยน:

- สถาปัตยกรรม ARM (ส่วนใหญ่ใช้งานได้ แต่บางไบนารีอาจรองรับเฉพาะ x86)
- ความจุและการสมัครใช้งานอาจไม่เสถียรนัก

## เปรียบเทียบราคา (2026)

| Provider     | แผน               | สเปก                   | ราคา/เดือน | หมายเหตุ               |
| ------------ | ----------------- | ---------------------- | ---------- | ---------------------- |
| Oracle Cloud | Always Free ARM   | สูงสุด 4 OCPU, RAM 24GB | $0         | ARM, ความจุจำกัด       |
| Hetzner      | CX22              | 2 vCPU, RAM 4GB        | ~ $4       | ตัวเลือกเสียเงินที่ถูกที่สุด |
| DigitalOcean | Basic             | 1 vCPU, RAM 1GB        | $6         | UI ใช้ง่าย, เอกสารดี   |
| Vultr        | Cloud Compute     | 1 vCPU, RAM 1GB        | $6         | มีหลายพื้นที่ให้เลือก   |
| Linode       | Nanode            | 1 vCPU, RAM 1GB        | $5         | ตอนนี้เป็นส่วนหนึ่งของ Akamai |

---

## ข้อกำหนดเบื้องต้น

- บัญชี Oracle Cloud ([สมัคร](https://www.oracle.com/cloud/free/)) — ดู [คู่มือสมัครจากชุมชน](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) หากคุณพบปัญหา
- บัญชี Tailscale (ฟรีที่ [tailscale.com](https://tailscale.com))
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
   - **Boot volume:** 50 GB (ฟรีสูงสุด 200 GB)
   - **SSH key:** เพิ่ม public key ของคุณ
4. คลิก **Create**
5. จดบันทึก public IP address

**เคล็ดลับ:** หากการสร้าง instance ล้มเหลวพร้อมข้อความ "Out of capacity" ให้ลอง availability domain อื่น หรือลองใหม่ภายหลัง ความจุของ free tier มีจำกัด

## 2) เชื่อมต่อและอัปเดต

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
# ตั้ง hostname
sudo hostnamectl set-hostname openclaw

# ตั้งรหัสผ่านสำหรับผู้ใช้ ubuntu
sudo passwd ubuntu

# เปิดใช้ lingering (ทำให้ user service ทำงานต่อหลัง logout)
sudo loginctl enable-linger ubuntu
```

## 4) ติดตั้ง Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

สิ่งนี้จะเปิดใช้ Tailscale SSH ดังนั้นคุณจึงเชื่อมต่อผ่าน `ssh openclaw` จากอุปกรณ์ใดก็ได้ใน tailnet ของคุณ — ไม่ต้องใช้ public IP

ตรวจสอบ:

```bash
tailscale status
```

**จากนี้ไป ให้เชื่อมต่อผ่าน Tailscale:** `ssh ubuntu@openclaw` (หรือใช้ Tailscale IP)

## 5) ติดตั้ง OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

เมื่อมีพรอมป์ถาม "How do you want to hatch your bot?", ให้เลือก **"Do this later"**

> หมายเหตุ: หากคุณพบปัญหา build แบบ native บน ARM ให้เริ่มจากแพ็กเกจของระบบก่อน (เช่น `sudo apt install -y build-essential`) ก่อนจะไปใช้ Homebrew

## 6) กำหนดค่า Gateway (loopback + token auth) และเปิดใช้ Tailscale Serve

ใช้ token auth เป็นค่าเริ่มต้น มันคาดเดาได้ง่ายและหลีกเลี่ยงการต้องใช้แฟล็ก Control UI แบบ “insecure auth”

```bash
# ทำให้ Gateway เป็นส่วนตัวบน VM
openclaw config set gateway.bind loopback

# บังคับใช้ auth สำหรับ Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# เปิดเผยผ่าน Tailscale Serve (HTTPS + การเข้าถึงผ่าน tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` ในที่นี้มีไว้เฉพาะสำหรับการจัดการ forwarded-IP/local-client ของ local Tailscale Serve proxy เท่านั้น มัน **ไม่ใช่** `gateway.auth.mode: "trusted-proxy"` เส้นทางของ diff viewer ยังคงมีพฤติกรรม fail-closed ในการตั้งค่านี้: คำขอ viewer แบบ raw `127.0.0.1` ที่ไม่มี forwarded proxy header อาจคืน `Diff not found` ใช้ `mode=file` / `mode=both` สำหรับไฟล์แนบ หรือเปิดใช้ remote viewer โดยตั้งใจแล้วตั้ง `plugins.entries.diffs.config.viewerBaseUrl` (หรือส่ง `baseUrl` ของ proxy) หากคุณต้องการลิงก์ viewer ที่แชร์ได้

## 7) ตรวจสอบ

```bash
# ตรวจสอบเวอร์ชัน
openclaw --version

# ตรวจสอบสถานะ daemon
systemctl --user status openclaw-gateway.service

# ตรวจสอบ Tailscale Serve
tailscale serve status

# ทดสอบการตอบกลับในเครื่อง
curl http://localhost:18789
```

## 8) ล็อก VCN Security ให้แน่น

เมื่อทุกอย่างทำงานแล้ว ให้ล็อก VCN เพื่อบล็อกทราฟฟิกทั้งหมด ยกเว้น Tailscale VCN (Virtual Cloud Network) ของ OCI ทำหน้าที่เหมือนไฟร์วอลล์ที่ขอบเครือข่าย — ทราฟฟิกจะถูกบล็อกก่อนถึง instance ของคุณ

1. ไปที่ **Networking → Virtual Cloud Networks** ใน OCI Console
2. คลิก VCN ของคุณ → **Security Lists** → Default Security List
3. **ลบ** กฎ ingress ทั้งหมด ยกเว้น:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. คงกฎ egress เริ่มต้นไว้ (อนุญาต outbound ทั้งหมด)

สิ่งนี้จะบล็อก SSH บนพอร์ต 22, HTTP, HTTPS และทุกอย่างอื่นที่ขอบเครือข่าย จากนี้ไป คุณจะเชื่อมต่อได้ผ่าน Tailscale เท่านั้น

---

## เข้าถึง Control UI

จากอุปกรณ์ใดก็ได้ในเครือข่าย Tailscale ของคุณ:

```
https://openclaw.<tailnet-name>.ts.net/
```

แทนที่ `<tailnet-name>` ด้วยชื่อ tailnet ของคุณ (ดูได้จาก `tailscale status`)

ไม่ต้องใช้ SSH tunnel Tailscale ให้สิ่งต่อไปนี้:

- การเข้ารหัส HTTPS (cert อัตโนมัติ)
- การยืนยันตัวตนผ่านตัวตนของ Tailscale
- การเข้าถึงจากอุปกรณ์ใดก็ได้ใน tailnet ของคุณ (แล็ปท็อป โทรศัพท์ ฯลฯ)

---

## ความปลอดภัย: VCN + Tailscale (baseline ที่แนะนำ)

เมื่อ VCN ถูกล็อกแล้ว (เปิดเฉพาะ UDP 41641) และ Gateway bind อยู่ที่ loopback คุณจะได้ defense-in-depth ที่แข็งแรง: ทราฟฟิกสาธารณะถูกบล็อกที่ขอบเครือข่าย และการเข้าถึงระดับผู้ดูแลจะเกิดขึ้นผ่าน tailnet ของคุณ

การตั้งค่านี้มักทำให้ _ไม่จำเป็น_ ต้องมีกฎ firewall บนโฮสต์เพิ่มเติมเพื่อหยุด SSH brute force จากอินเทอร์เน็ตทั้งโลก — แต่คุณก็ควรอัปเดต OS, รัน `openclaw security audit`, และตรวจสอบว่าคุณไม่ได้เผลอเปิดรับฟังบน public interface อยู่

### มีการป้องกันอยู่แล้ว

| ขั้นตอนแบบดั้งเดิม  | จำเป็นหรือไม่ | เหตุผล                                                                       |
| ------------------- | ------------- | ---------------------------------------------------------------------------- |
| UFW firewall        | ไม่          | VCN บล็อกก่อนทราฟฟิกจะถึง instance                                           |
| fail2ban            | ไม่          | ไม่มี brute force หากพอร์ต 22 ถูกบล็อกที่ VCN                                |
| sshd hardening      | ไม่          | Tailscale SSH ไม่ใช้ sshd                                                     |
| ปิด root login      | ไม่          | Tailscale ใช้ตัวตนของ Tailscale ไม่ใช่ผู้ใช้ของระบบ                          |
| SSH key-only auth   | ไม่          | Tailscale ยืนยันตัวตนผ่าน tailnet ของคุณ                                      |
| IPv6 hardening      | โดยทั่วไปไม่ | ขึ้นอยู่กับการตั้งค่า VCN/subnet ของคุณ; ตรวจสอบว่ามีการกำหนด/เปิดเผยอะไรจริงบ้าง |

### ยังคงแนะนำ

- **สิทธิ์ของข้อมูลรับรอง:** `chmod 700 ~/.openclaw`
- **Security audit:** `openclaw security audit`
- **อัปเดตระบบ:** `sudo apt update && sudo apt upgrade` เป็นประจำ
- **ตรวจสอบ Tailscale:** ทบทวนอุปกรณ์ใน [Tailscale admin console](https://login.tailscale.com/admin)

### ตรวจสอบ Security Posture

```bash
# ยืนยันว่าไม่มีพอร์ตสาธารณะที่กำลังรับฟังอยู่
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# ตรวจสอบว่า Tailscale SSH ทำงานอยู่
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# ไม่บังคับ: ปิด sshd ทั้งหมด
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

ARM instance ของ free tier เป็นที่นิยม ลองวิธีต่อไปนี้:

- ใช้ availability domain อื่น
- ลองใหม่ในช่วงเวลาที่มีการใช้งานน้อย (เช้าตรู่)
- ใช้ตัวกรอง "Always Free" ตอนเลือก shape

### Tailscale เชื่อมต่อไม่ได้

```bash
# ตรวจสอบสถานะ
sudo tailscale status

# ยืนยันตัวตนใหม่
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway ไม่เริ่มทำงาน

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### เข้าถึง Control UI ไม่ได้

```bash
# ตรวจสอบว่า Tailscale Serve กำลังทำงานอยู่
tailscale serve status

# ตรวจสอบว่า gateway กำลังรับฟังอยู่
curl http://localhost:18789

# รีสตาร์ตหากจำเป็น
systemctl --user restart openclaw-gateway.service
```

### ปัญหาไบนารีบน ARM

เครื่องมือบางตัวอาจไม่มีบิลด์สำหรับ ARM ตรวจสอบ:

```bash
uname -m  # ควรแสดง aarch64
```

แพ็กเกจ npm ส่วนใหญ่ใช้งานได้ดี สำหรับไบนารี ให้มองหา release แบบ `linux-arm64` หรือ `aarch64`

---

## การคงอยู่ของข้อมูล

state ทั้งหมดอยู่ใน:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` ต่อเอเจนต์, state ของช่องทาง/provider, และข้อมูลเซสชัน
- `~/.openclaw/workspace/` — workspace (SOUL.md, memory, artifacts)

สำรองข้อมูลเป็นระยะ:

```bash
openclaw backup create
```

---

## ดูเพิ่มเติม

- [Gateway remote access](/th/gateway/remote) — รูปแบบการเข้าถึงจากระยะไกลอื่น ๆ
- [Tailscale integration](/th/gateway/tailscale) — เอกสาร Tailscale แบบเต็ม
- [Gateway configuration](/th/gateway/configuration) — ตัวเลือก config ทั้งหมด
- [DigitalOcean guide](/th/install/digitalocean) — หากคุณต้องการแบบเสียเงิน + สมัครง่ายกว่า
- [Hetzner guide](/th/install/hetzner) — ทางเลือกแบบใช้ Docker
