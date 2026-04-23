---
read_when:
    - คุณต้องการให้ OpenClaw ถูกแยกออกจากสภาพแวดล้อม macOS หลักของคุณ аиҳабы to=final
    - คุณต้องการการผสานรวม iMessage (BlueBubbles) ภายใน sandbox
    - คุณต้องการสภาพแวดล้อม macOS ที่รีเซ็ตได้และสามารถโคลนได้
    - คุณต้องการเปรียบเทียบตัวเลือก macOS VM แบบในเครื่องกับแบบโฮสต์
summary: รัน OpenClaw ใน macOS VM แบบ sandboxed (ในเครื่องหรือแบบโฮสต์) เมื่อคุณต้องการการแยกสภาพแวดล้อมหรือ iMessage
title: macOS VM
x-i18n:
    generated_at: "2026-04-23T05:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw บน macOS VM (Sandboxing)

## คำแนะนำเริ่มต้น (สำหรับผู้ใช้ส่วนใหญ่)

- **Linux VPS ขนาดเล็ก** สำหรับ Gateway ที่เปิดตลอดเวลาและมีต้นทุนต่ำ ดู [VPS hosting](/th/vps)
- **ฮาร์ดแวร์เฉพาะ** (Mac mini หรือกล่อง Linux) หากคุณต้องการควบคุมเต็มรูปแบบและ **residential IP** สำหรับ browser automation หลายเว็บไซต์บล็อก IP ของดาต้าเซ็นเตอร์ ดังนั้นการท่องเว็บจากเครื่องในบ้านมักทำงานได้ดีกว่า
- **Hybrid:** เก็บ Gateway ไว้บน VPS ราคาถูก และเชื่อมต่อ Mac ของคุณเป็น **node** เมื่อคุณต้องการ browser/UI automation ดู [Nodes](/th/nodes) และ [Gateway remote](/th/gateway/remote)

ใช้ macOS VM เมื่อคุณต้องการความสามารถที่มีเฉพาะบน macOS โดยเฉพาะ (iMessage/BlueBubbles) หรือต้องการการแยกสภาพแวดล้อมอย่างเข้มงวดออกจาก Mac ที่ใช้ประจำวันของคุณ

## ตัวเลือกของ macOS VM

### VM ในเครื่องบน Apple Silicon Mac ของคุณ (Lume)

รัน OpenClaw ใน macOS VM แบบ sandboxed บน Apple Silicon Mac ที่คุณมีอยู่แล้วด้วย [Lume](https://cua.ai/docs/lume)

สิ่งที่คุณจะได้รับ:

- สภาพแวดล้อม macOS แบบเต็มที่แยกออกจากกัน (โฮสต์ของคุณยังคงสะอาด)
- รองรับ iMessage ผ่าน BlueBubbles (ทำไม่ได้บน Linux/Windows)
- รีเซ็ตได้ทันทีด้วยการโคลน VM
- ไม่ต้องใช้ฮาร์ดแวร์เพิ่มหรือมีค่าใช้จ่ายบนคลาวด์

### ผู้ให้บริการ Mac แบบโฮสต์ (คลาวด์)

หากคุณต้องการ macOS บนคลาวด์ ผู้ให้บริการ Mac แบบโฮสต์ก็ใช้งานได้เช่นกัน:

- [MacStadium](https://www.macstadium.com/) (Mac แบบโฮสต์)
- ผู้ให้บริการ Mac แบบโฮสต์รายอื่นก็ใช้งานได้เช่นกัน; ให้ทำตามเอกสาร VM + SSH ของพวกเขา

เมื่อคุณมีสิทธิ์ SSH เข้าถึง macOS VM แล้ว ให้ไปต่อที่ขั้นตอน 6 ด้านล่าง

---

## เส้นทางแบบรวดเร็ว (Lume, สำหรับผู้ใช้ที่มีประสบการณ์)

1. ติดตั้ง Lume
2. `lume create openclaw --os macos --ipsw latest`
3. ทำ Setup Assistant ให้เสร็จ เปิดใช้ Remote Login (SSH)
4. `lume run openclaw --no-display`
5. SSH เข้าไป ติดตั้ง OpenClaw กำหนดค่าช่องทาง
6. เสร็จสิ้น

---

## สิ่งที่คุณต้องมี (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia หรือใหม่กว่าบนโฮสต์
- พื้นที่ดิสก์ว่างประมาณ 60 GB ต่อ VM
- เวลาประมาณ 20 นาที

---

## 1) ติดตั้ง Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

หาก `~/.local/bin` ไม่อยู่ใน PATH ของคุณ:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

ตรวจสอบ:

```bash
lume --version
```

เอกสาร: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) สร้าง macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

คำสั่งนี้จะดาวน์โหลด macOS และสร้าง VM หน้าต่าง VNC จะเปิดขึ้นโดยอัตโนมัติ

หมายเหตุ: การดาวน์โหลดอาจใช้เวลาสักพักขึ้นอยู่กับการเชื่อมต่อของคุณ

---

## 3) ทำ Setup Assistant ให้เสร็จ

ในหน้าต่าง VNC:

1. เลือกภาษาและภูมิภาค
2. ข้าม Apple ID (หรือลงชื่อเข้าใช้ หากคุณต้องการ iMessage ในภายหลัง)
3. สร้างบัญชีผู้ใช้ (จำชื่อผู้ใช้และรหัสผ่านไว้)
4. ข้ามฟีเจอร์เสริมทั้งหมด

หลังการตั้งค่าเสร็จสิ้น ให้เปิดใช้ SSH:

1. เปิด System Settings → General → Sharing
2. เปิดใช้ "Remote Login"

---

## 4) ดู IP address ของ VM

```bash
lume get openclaw
```

มองหา IP address (โดยทั่วไปคือ `192.168.64.x`)

---

## 5) SSH เข้า VM

```bash
ssh youruser@192.168.64.X
```

แทนที่ `youruser` ด้วยบัญชีที่คุณสร้าง และแทนที่ IP ด้วย IP ของ VM ของคุณ

---

## 6) ติดตั้ง OpenClaw

ภายใน VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

ทำตามพรอมป์ onboarding เพื่อตั้งค่าผู้ให้บริการโมเดลของคุณ (Anthropic, OpenAI ฯลฯ)

---

## 7) กำหนดค่าช่องทาง

แก้ไขไฟล์ config:

```bash
nano ~/.openclaw/openclaw.json
```

เพิ่มช่องทางของคุณ:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

จากนั้นล็อกอินเข้า WhatsApp (สแกน QR):

```bash
openclaw channels login
```

---

## 8) รัน VM แบบไม่มีจอ

หยุด VM และเริ่มใหม่โดยไม่แสดงผล:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM จะรันอยู่เบื้องหลัง daemon ของ OpenClaw จะทำให้ gateway ทำงานต่อไป

เพื่อตรวจสอบสถานะ:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## โบนัส: การผสานรวม iMessage

นี่คือฟีเจอร์เด่นของการรันบน macOS ใช้ [BlueBubbles](https://bluebubbles.app) เพื่อเพิ่ม iMessage เข้าใน OpenClaw

ภายใน VM:

1. ดาวน์โหลด BlueBubbles จาก bluebubbles.app
2. ลงชื่อเข้าใช้ด้วย Apple ID ของคุณ
3. เปิดใช้ Web API และตั้งรหัสผ่าน
4. ชี้ Webhook ของ BlueBubbles ไปยัง gateway ของคุณ (ตัวอย่าง: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

เพิ่มลงใน config ของ OpenClaw:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

รีสตาร์ต gateway ตอนนี้เอเจนต์ของคุณสามารถส่งและรับ iMessages ได้แล้ว

รายละเอียดการตั้งค่าแบบเต็ม: [ช่องทาง BlueBubbles](/th/channels/bluebubbles)

---

## บันทึก golden image

ก่อนจะปรับแต่งต่อ ให้ snapshot สถานะที่สะอาดของคุณไว้:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

รีเซ็ตได้ทุกเมื่อ:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## การรันตลอด 24/7

ทำให้ VM รันต่อเนื่องโดย:

- เสียบปลั๊ก Mac ไว้ตลอด
- ปิดการพักเครื่องใน System Settings → Energy Saver
- ใช้ `caffeinate` หากจำเป็น

หากต้องการให้เปิดตลอดจริง ๆ ให้พิจารณา Mac mini โดยเฉพาะหรือ VPS ขนาดเล็ก ดู [VPS hosting](/th/vps)

---

## การแก้ไขปัญหา

| ปัญหา                    | วิธีแก้ไข                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------- |
| SSH เข้า VM ไม่ได้       | ตรวจสอบว่าได้เปิด "Remote Login" ใน System Settings ของ VM แล้ว                     |
| ไม่เห็น IP ของ VM        | รอให้ VM บูตเสร็จสมบูรณ์ แล้วรัน `lume get openclaw` อีกครั้ง                       |
| ไม่พบคำสั่ง Lume         | เพิ่ม `~/.local/bin` เข้าใน PATH                                                    |
| สแกน QR ของ WhatsApp ไม่ได้ | ตรวจสอบให้แน่ใจว่าคุณล็อกอินอยู่ใน VM (ไม่ใช่โฮสต์) เมื่อรัน `openclaw channels login` |

---

## เอกสารที่เกี่ยวข้อง

- [VPS hosting](/th/vps)
- [Nodes](/th/nodes)
- [Gateway remote](/th/gateway/remote)
- [ช่องทาง BlueBubbles](/th/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ขั้นสูง)
- [Docker Sandboxing](/th/install/docker) (แนวทางการแยกสภาพแวดล้อมแบบทางเลือก)
