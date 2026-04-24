---
read_when:
    - การตั้งค่าครั้งแรกจากศูนย์
    - คุณต้องการเส้นทางที่เร็วที่สุดไปสู่การแชตที่ใช้งานได้จริง
summary: ติดตั้ง OpenClaw และเริ่มแชตครั้งแรกของคุณได้ในไม่กี่นาที
title: เริ่มต้นใช้งาน
x-i18n:
    generated_at: "2026-04-24T09:33:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

ติดตั้ง OpenClaw รัน onboarding และแชตกับผู้ช่วย AI ของคุณ — ทั้งหมดนี้ใช้เวลา
ประมาณ 5 นาที เมื่อจบแล้วคุณจะมี Gateway ที่กำลังทำงาน การยืนยันตัวตนที่ตั้งค่าแล้ว
และเซสชันแชตที่ใช้งานได้จริง

## สิ่งที่คุณต้องมี

- **Node.js** — แนะนำ Node 24 (รองรับ Node 22.14+ เช่นกัน)
- **API key** จากผู้ให้บริการโมเดล (Anthropic, OpenAI, Google ฯลฯ) — onboarding จะถามคุณ

<Tip>
ตรวจสอบเวอร์ชัน Node ของคุณด้วย `node --version`
**ผู้ใช้ Windows:** รองรับทั้ง Windows แบบเนทีฟและ WSL2 โดย WSL2 มีความเสถียรมากกว่า
และแนะนำสำหรับประสบการณ์เต็มรูปแบบ ดู [Windows](/th/platforms/windows)
ต้องการติดตั้ง Node หรือไม่? ดู [Node setup](/th/install/node)
</Tip>

## การตั้งค่าอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
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
    วิธีติดตั้งอื่น ๆ (Docker, Nix, npm): [Install](/th/install)
    </Note>

  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดจะพาคุณเลือกผู้ให้บริการโมเดล ตั้งค่า API key
    และกำหนดค่า Gateway ซึ่งใช้เวลาประมาณ 2 นาที

    ดู [Onboarding (CLI)](/th/start/wizard) สำหรับข้อมูลอ้างอิงแบบเต็ม

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

    คำสั่งนี้จะเปิด Control UI ในเบราว์เซอร์ของคุณ หากโหลดขึ้นมาได้ แปลว่าทุกอย่างทำงานปกติ

  </Step>
  <Step title="ส่งข้อความแรกของคุณ">
    พิมพ์ข้อความในแชตของ Control UI แล้วคุณควรได้รับคำตอบจาก AI

    อยากแชตจากโทรศัพท์ของคุณแทนหรือไม่? channel ที่ตั้งค่าได้เร็วที่สุดคือ
    [Telegram](/th/channels/telegram) (ใช้เพียง bot token) ดู [Channels](/th/channels)
    สำหรับตัวเลือกทั้งหมด

  </Step>
</Steps>

<Accordion title="ขั้นสูง: เมานต์ build ของ Control UI แบบกำหนดเอง">
  หากคุณดูแล build ของแดชบอร์ดที่แปลภาษาไว้หรือปรับแต่งเอง ให้ชี้
  `gateway.controlUi.root` ไปยังไดเรกทอรีที่มี static asset
  และ `index.html` ที่ build แล้ว

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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

รีสตาร์ต Gateway แล้วเปิดแดชบอร์ดอีกครั้ง:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## สิ่งที่ควรทำต่อไป

<Columns>
  <Card title="Connect a channel" href="/th/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอีกมากมาย
  </Card>
  <Card title="Pairing and safety" href="/th/channels/pairing" icon="shield">
    ควบคุมว่าใครสามารถส่งข้อความถึงเอเจนต์ของคุณได้
  </Card>
  <Card title="Configure the Gateway" href="/th/gateway/configuration" icon="settings">
    โมเดล เครื่องมือ sandbox และการตั้งค่าขั้นสูง
  </Card>
  <Card title="Browse tools" href="/th/tools" icon="wrench">
    เบราว์เซอร์ exec การค้นหาเว็บ Skills และ Plugin
  </Card>
</Columns>

<Accordion title="ขั้นสูง: ตัวแปรสภาพแวดล้อม">
  หากคุณรัน OpenClaw เป็น service account หรือต้องการพาธแบบกำหนดเอง:

- `OPENCLAW_HOME` — ไดเรกทอรีหลักสำหรับการ resolve พาธภายใน
- `OPENCLAW_STATE_DIR` — override ไดเรกทอรี state
- `OPENCLAW_CONFIG_PATH` — override พาธไฟล์คอนฟิก

ข้อมูลอ้างอิงแบบเต็ม: [Environment variables](/th/help/environment)
</Accordion>

## ที่เกี่ยวข้อง

- [Install overview](/th/install)
- [Channels overview](/th/channels)
- [Setup](/th/start/setup)
