---
read_when:
    - การตั้งค่าครั้งแรกตั้งแต่ศูนย์
    - คุณต้องการเส้นทางที่เร็วที่สุดไปสู่แชตที่ใช้งานได้จริง
summary: ติดตั้ง OpenClaw และเริ่มแชตครั้งแรกของคุณได้ภายในไม่กี่นาที
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-04-23T05:57:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c43eee6f0d3f593e3cf0767bfacb3e0ae38f51a2615d594303786ae1d4a6d2c3
    source_path: start/getting-started.md
    workflow: 15
---

# เริ่มต้นใช้งาน

ติดตั้ง OpenClaw, รัน onboarding และเริ่มแชตกับ AI assistant ของคุณ — ทั้งหมดนี้ใช้เวลา
ประมาณ 5 นาที เมื่อจบแล้วคุณจะมี Gateway ที่กำลังทำงาน, auth ที่ตั้งค่าเรียบร้อย
และเซสชันแชตที่ใช้งานได้

## สิ่งที่คุณต้องมี

- **Node.js** — แนะนำ Node 24 (รองรับ Node 22.14+ เช่นกัน)
- **API key** จาก model provider (Anthropic, OpenAI, Google ฯลฯ) — ระบบ onboarding จะถามคุณ

<Tip>
ตรวจสอบเวอร์ชัน Node ของคุณด้วย `node --version`
**ผู้ใช้ Windows:** รองรับทั้ง Windows แบบ native และ WSL2 โดย WSL2 มีความเสถียรกว่า
และแนะนำสำหรับประสบการณ์ที่ครบถ้วน ดู [Windows](/th/platforms/windows)
ต้องการติดตั้ง Node หรือไม่? ดู [Node setup](/th/install/node)
</Tip>

## การตั้งค่าแบบรวดเร็ว

<Steps>
  <Step title="ติดตั้ง OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="กระบวนการติดตั้งด้วยสคริปต์"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    วิธีติดตั้งอื่นๆ (Docker, Nix, npm): [Install](/th/install)
    </Note>

  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    wizard จะพาคุณผ่านการเลือก model provider, ตั้งค่า API key
    และตั้งค่า Gateway ใช้เวลาประมาณ 2 นาที

    ดู [Onboarding (CLI)](/th/start/wizard) สำหรับเอกสารอ้างอิงแบบเต็ม

  </Step>
  <Step title="ตรวจสอบว่า Gateway กำลังทำงาน">
    ```bash
    openclaw gateway status
    ```

    คุณควรเห็นว่า Gateway กำลังฟังอยู่ที่พอร์ต 18789

  </Step>
  <Step title="เปิดแดชบอร์ด">
    ```bash
    openclaw dashboard
    ```

    คำสั่งนี้จะเปิด Control UI ในเบราว์เซอร์ของคุณ หากโหลดขึ้นมาได้ แสดงว่าทุกอย่างทำงานแล้ว

  </Step>
  <Step title="ส่งข้อความแรกของคุณ">
    พิมพ์ข้อความในแชตของ Control UI แล้วคุณควรได้รับคำตอบจาก AI

    อยากแชตจากโทรศัพท์แทนหรือไม่? ช่องทางที่ตั้งค่าได้เร็วที่สุดคือ
    [Telegram](/th/channels/telegram) (ใช้แค่ bot token) ดู [Channels](/th/channels)
    สำหรับตัวเลือกทั้งหมด

  </Step>
</Steps>

<Accordion title="ขั้นสูง: เมานต์ custom Control UI build">
  หากคุณดูแล dashboard build ที่แปลภาษาแล้วหรือปรับแต่งเอง ให้ชี้
  `gateway.controlUi.root` ไปยังไดเรกทอรีที่มี static assets ที่ build แล้ว
  และ `index.html`

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# คัดลอกไฟล์ static ที่ build แล้วของคุณเข้าไปในไดเรกทอรีนั้น
```

จากนั้นตั้งค่า:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

รีสตาร์ต gateway แล้วเปิด dashboard ใหม่:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## จะทำอะไรต่อดี

<Columns>
  <Card title="เชื่อมต่อช่องทาง" href="/th/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่นๆ
  </Card>
  <Card title="Pairing และความปลอดภัย" href="/th/channels/pairing" icon="shield">
    ควบคุมว่าใครสามารถส่งข้อความถึงเอเจนต์ของคุณได้
  </Card>
  <Card title="ตั้งค่า Gateway" href="/th/gateway/configuration" icon="settings">
    โมเดล เครื่องมือ sandbox และการตั้งค่าขั้นสูง
  </Card>
  <Card title="สำรวจเครื่องมือ" href="/th/tools" icon="wrench">
    Browser, exec, web search, Skills และ Plugins
  </Card>
</Columns>

<Accordion title="ขั้นสูง: ตัวแปรแวดล้อม">
  หากคุณรัน OpenClaw เป็น service account หรือต้องการใช้พาธแบบกำหนดเอง:

- `OPENCLAW_HOME` — โฮมไดเรกทอรีสำหรับการ resolve พาธภายใน
- `OPENCLAW_STATE_DIR` — override state directory
- `OPENCLAW_CONFIG_PATH` — override พาธของไฟล์ config

เอกสารอ้างอิงแบบเต็ม: [Environment variables](/th/help/environment)
</Accordion>
