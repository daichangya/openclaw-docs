---
read_when:
    - กำลังดีบักตัวบ่งชี้สุขภาพของแอป macOS
summary: วิธีที่แอป macOS รายงานสถานะสุขภาพของ Gateway/Baileys
title: การตรวจสอบสุขภาพ (macOS)
x-i18n:
    generated_at: "2026-04-23T05:44:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# การตรวจสอบสุขภาพบน macOS

วิธีดูว่าช่องทางที่ลิงก์อยู่มีสุขภาพดีหรือไม่จากแอปในแถบเมนู

## แถบเมนู

- จุดสถานะตอนนี้สะท้อนสุขภาพของ Baileys:
  - สีเขียว: ลิงก์แล้ว + socket เปิดเมื่อไม่นานมานี้
  - สีส้ม: กำลังเชื่อมต่อ/ลองใหม่
  - สีแดง: ออกจากระบบแล้วหรือ probe ล้มเหลว
- บรรทัดรองจะแสดง "linked · auth 12m" หรือแสดงเหตุผลของความล้มเหลว
- รายการเมนู "Run Health Check" จะทริกเกอร์ probe แบบ on-demand

## การตั้งค่า

- แท็บ General มีการ์ด Health ที่แสดง: อายุของ linked auth, พาธ/จำนวนของ session-store, เวลา check ล่าสุด, last error/status code และปุ่ม Run Health Check / Reveal Logs
- ใช้ cached snapshot เพื่อให้ UI โหลดได้ทันทีและ fallback ได้อย่างนุ่มนวลเมื่อออฟไลน์
- **แท็บ Channels** แสดงสถานะช่องทาง + ตัวควบคุมสำหรับ WhatsApp/Telegram (login QR, logout, probe, last disconnect/error)

## วิธีการทำงานของ probe

- แอปรัน `openclaw health --json` ผ่าน `ShellExecutor` ทุกประมาณ 60 วินาที และเมื่อสั่งแบบ on-demand probe จะโหลด creds และรายงานสถานะโดยไม่ส่งข้อความ
- แคช last good snapshot และ last error แยกจากกันเพื่อหลีกเลี่ยงการกะพริบ; แสดง timestamp ของแต่ละรายการ

## เมื่อไม่แน่ใจ

- คุณยังสามารถใช้ flow แบบ CLI ใน [Gateway health](/th/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) และ tail `/tmp/openclaw/openclaw-*.log` เพื่อดู `web-heartbeat` / `web-reconnect` ได้
