---
read_when:
    - การตั้งค่า OpenClaw บน Hostinger
    - กำลังมองหา VPS แบบจัดการแล้วสำหรับ OpenClaw
    - การใช้ OpenClaw แบบ 1-Click ของ Hostinger
summary: โฮสต์ OpenClaw บน Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T05:40:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf173cdcf6344f8ee22e839a27f4e063a3a102186f9acc07c4a33d4794e2c034
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

รัน OpenClaw Gateway แบบถาวรบน [Hostinger](https://www.hostinger.com/openclaw) ผ่านการปรับใช้แบบ **1-Click** ที่มีการจัดการแล้ว หรือการติดตั้งแบบ **VPS**

## ข้อกำหนดเบื้องต้น

- บัญชี Hostinger ([สมัคร](https://www.hostinger.com/openclaw))
- เวลาประมาณ 5-10 นาที

## ตัวเลือก A: OpenClaw แบบ 1-Click

วิธีที่เร็วที่สุดในการเริ่มต้น Hostinger จะจัดการโครงสร้างพื้นฐาน Docker และการอัปเดตอัตโนมัติให้

<Steps>
  <Step title="ซื้อและเปิดใช้งาน">
    1. จาก [หน้า OpenClaw ของ Hostinger](https://www.hostinger.com/openclaw) ให้เลือกแผน Managed OpenClaw และชำระเงินให้เสร็จ

    <Note>
    ระหว่างการชำระเงิน คุณสามารถเลือกเครดิต **Ready-to-Use AI** ที่ซื้อล่วงหน้าและผสานรวมภายใน OpenClaw ได้ทันที -- ไม่ต้องมีบัญชีภายนอกหรือ API key จากผู้ให้บริการอื่น คุณสามารถเริ่มแชตได้ทันที หรือจะระบุคีย์ของคุณเองจาก Anthropic, OpenAI, Google Gemini หรือ xAI ระหว่างการตั้งค่าก็ได้
    </Note>

  </Step>

  <Step title="เลือกช่องทางการส่งข้อความ">
    เลือกหนึ่งช่องทางหรือมากกว่านั้นเพื่อเชื่อมต่อ:

    - **WhatsApp** -- สแกน QR code ที่แสดงในวิซาร์ดการตั้งค่า
    - **Telegram** -- วาง bot token จาก [BotFather](https://t.me/BotFather)

  </Step>

  <Step title="ติดตั้งให้เสร็จสมบูรณ์">
    คลิก **Finish** เพื่อปรับใช้ instance เมื่อพร้อมแล้ว ให้เข้าถึงแดชบอร์ด OpenClaw จาก **OpenClaw Overview** ใน hPanel
  </Step>

</Steps>

## ตัวเลือก B: OpenClaw บน VPS

ควบคุมเซิร์ฟเวอร์ของคุณได้มากขึ้น Hostinger จะปรับใช้ OpenClaw ผ่าน Docker บน VPS ของคุณ และคุณจัดการมันผ่าน **Docker Manager** ใน hPanel

<Steps>
  <Step title="ซื้อ VPS">
    1. จาก [หน้า OpenClaw ของ Hostinger](https://www.hostinger.com/openclaw) ให้เลือกแผน OpenClaw on VPS และชำระเงินให้เสร็จ

    <Note>
    คุณสามารถเลือกเครดิต **Ready-to-Use AI** ระหว่างการชำระเงินได้ -- เครดิตเหล่านี้ซื้อล่วงหน้าและผสานรวมภายใน OpenClaw ได้ทันที ทำให้คุณเริ่มแชตได้โดยไม่ต้องมีบัญชีภายนอกหรือ API key จากผู้ให้บริการอื่น
    </Note>

  </Step>

  <Step title="กำหนดค่า OpenClaw">
    เมื่อ VPS ถูก provision แล้ว ให้กรอกฟิลด์การกำหนดค่า:

    - **Gateway token** -- สร้างให้อัตโนมัติ; บันทึกไว้เพื่อใช้งานภายหลัง
    - **หมายเลข WhatsApp** -- หมายเลขของคุณพร้อมรหัสประเทศ (ไม่บังคับ)
    - **Telegram bot token** -- จาก [BotFather](https://t.me/BotFather) (ไม่บังคับ)
    - **API keys** -- จำเป็นเฉพาะเมื่อคุณไม่ได้เลือกเครดิต Ready-to-Use AI ระหว่างการชำระเงิน

  </Step>

  <Step title="เริ่ม OpenClaw">
    คลิก **Deploy** เมื่อระบบทำงานแล้ว ให้เปิดแดชบอร์ด OpenClaw จาก hPanel โดยคลิก **Open**
  </Step>

</Steps>

ล็อก การรีสตาร์ต และการอัปเดต จะถูกจัดการโดยตรงจากอินเทอร์เฟซ Docker Manager ใน hPanel หากต้องการอัปเดต ให้กด **Update** ใน Docker Manager แล้วระบบจะดึง image ล่าสุด

## ตรวจสอบการตั้งค่าของคุณ

ส่งข้อความ "Hi" ถึงผู้ช่วยของคุณบนช่องทางที่คุณเชื่อมต่อไว้ OpenClaw จะตอบกลับและพาคุณตั้งค่าความชอบเบื้องต้น

## การแก้ไขปัญหา

**แดชบอร์ดไม่โหลด** -- รอสักสองสามนาทีให้ container provision เสร็จ ตรวจสอบล็อก Docker Manager ใน hPanel

**Docker container รีสตาร์ตตลอด** -- เปิดล็อก Docker Manager และมองหาข้อผิดพลาดด้านการกำหนดค่า (token หาย, API key ไม่ถูกต้อง)

**Telegram bot ไม่ตอบสนอง** -- ส่งข้อความโค้ดการจับคู่ของคุณจาก Telegram โดยตรงเป็นข้อความภายในแชต OpenClaw ของคุณเพื่อให้การเชื่อมต่อเสร็จสมบูรณ์

## ขั้นตอนถัดไป

- [Channels](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่น ๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือก config ทั้งหมด
