---
read_when:
    - คุณต้องการเลือกช่องทางแชตสำหรับ OpenClaw
    - คุณต้องการภาพรวมอย่างรวดเร็วของแพลตฟอร์มการส่งข้อความที่รองรับ
summary: แพลตฟอร์มการส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชต
x-i18n:
    generated_at: "2026-04-24T08:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw สามารถคุยกับคุณผ่านแอปแชตใดก็ได้ที่คุณใช้อยู่แล้ว แต่ละช่องทางจะเชื่อมต่อผ่าน Gateway
รองรับข้อความตัวอักษรทุกช่องทาง; ส่วนสื่อและรีแอ็กชันจะแตกต่างกันไปตามแต่ละช่องทาง

## ช่องทางที่รองรับ

- [BlueBubbles](/th/channels/bluebubbles) — **แนะนำสำหรับ iMessage**; ใช้ REST API ของเซิร์ฟเวอร์ BlueBubbles บน macOS พร้อมการรองรับฟีเจอร์เต็มรูปแบบ (Plugin ที่มาพร้อมระบบ; แก้ไข, ยกเลิกส่ง, เอฟเฟกต์, รีแอ็กชัน, การจัดการกลุ่ม — ขณะนี้การแก้ไขใช้งานไม่ได้บน macOS 26 Tahoe)
- [Discord](/th/channels/discord) — Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์, ช่อง, และ DM
- [Feishu](/th/channels/feishu) — บอต Feishu/Lark ผ่าน WebSocket (Plugin ที่มาพร้อมระบบ)
- [Google Chat](/th/channels/googlechat) — แอป Google Chat API ผ่าน HTTP Webhook
- [iMessage (legacy)](/th/channels/imessage) — การเชื่อมต่อ macOS แบบเดิมผ่าน imsg CLI (เลิกใช้แล้ว, สำหรับการตั้งค่าใหม่ให้ใช้ BlueBubbles)
- [IRC](/th/channels/irc) — เซิร์ฟเวอร์ IRC แบบดั้งเดิม; ช่อง + DM พร้อมการควบคุมการจับคู่/allowlist
- [LINE](/th/channels/line) — บอต LINE Messaging API (Plugin ที่มาพร้อมระบบ)
- [Matrix](/th/channels/matrix) — โปรโตคอล Matrix (Plugin ที่มาพร้อมระบบ)
- [Mattermost](/th/channels/mattermost) — Bot API + WebSocket; ช่อง, กลุ่ม, DM (Plugin ที่มาพร้อมระบบ)
- [Microsoft Teams](/th/channels/msteams) — Bot Framework; รองรับการใช้งานระดับองค์กร (Plugin ที่มาพร้อมระบบ)
- [Nextcloud Talk](/th/channels/nextcloud-talk) — แชตแบบโฮสต์เองผ่าน Nextcloud Talk (Plugin ที่มาพร้อมระบบ)
- [Nostr](/th/channels/nostr) — DM แบบกระจายศูนย์ผ่าน NIP-04 (Plugin ที่มาพร้อมระบบ)
- [QQ Bot](/th/channels/qqbot) — QQ Bot API; แชตส่วนตัว, แชตกลุ่ม และสื่อสมบูรณ์แบบ (Plugin ที่มาพร้อมระบบ)
- [Signal](/th/channels/signal) — signal-cli; เน้นความเป็นส่วนตัว
- [Slack](/th/channels/slack) — Bolt SDK; แอปสำหรับเวิร์กสเปซ
- [Synology Chat](/th/channels/synology-chat) — Synology NAS Chat ผ่าน Webhook ขาออก+ขาเข้า (Plugin ที่มาพร้อมระบบ)
- [Telegram](/th/channels/telegram) — Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) — เมสเซนเจอร์บนพื้นฐาน Urbit (Plugin ที่มาพร้อมระบบ)
- [Twitch](/th/channels/twitch) — แชต Twitch ผ่านการเชื่อมต่อ IRC (Plugin ที่มาพร้อมระบบ)
- [Voice Call](/th/plugins/voice-call) — โทรศัพท์ผ่าน Plivo หรือ Twilio (Plugin, ติดตั้งแยกต่างหาก)
- [WebChat](/th/web/webchat) — UI ของ Gateway WebChat ผ่าน WebSocket
- [WeChat](/th/channels/wechat) — Plugin บอต Tencent iLink ผ่านการล็อกอินด้วย QR; รองรับเฉพาะแชตส่วนตัว (Plugin ภายนอก)
- [WhatsApp](/th/channels/whatsapp) — ได้รับความนิยมมากที่สุด; ใช้ Baileys และต้องจับคู่ด้วย QR
- [Zalo](/th/channels/zalo) — Zalo Bot API; เมสเซนเจอร์ยอดนิยมของเวียดนาม (Plugin ที่มาพร้อมระบบ)
- [Zalo Personal](/th/channels/zalouser) — บัญชี Zalo ส่วนตัวผ่านการล็อกอินด้วย QR (Plugin ที่มาพร้อมระบบ)

## หมายเหตุ

- ช่องทางสามารถทำงานพร้อมกันได้; กำหนดค่าหลายช่องทางได้ และ OpenClaw จะ route ตามแต่ละแชต
- การตั้งค่าที่เร็วที่สุดโดยทั่วไปคือ **Telegram** (ใช้เพียงโทเค็นบอตอย่างง่าย) WhatsApp ต้องจับคู่ด้วย QR และ
  จัดเก็บสถานะบนดิสก์มากกว่า
- พฤติกรรมของกลุ่มแตกต่างกันไปตามช่องทาง; ดู [Groups](/th/channels/groups)
- มีการบังคับใช้การจับคู่ DM และ allowlist เพื่อความปลอดภัย; ดู [Security](/th/gateway/security)
- การแก้ปัญหา: [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก; ดู [ผู้ให้บริการโมเดล](/th/providers/models)
