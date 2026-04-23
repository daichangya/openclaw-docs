---
read_when:
    - คุณต้องการเลือกช่องทางแชตสำหรับ OpenClaw
    - คุณต้องการภาพรวมอย่างรวดเร็วของแพลตฟอร์มการรับส่งข้อความที่รองรับ
summary: แพลตฟอร์มการรับส่งข้อความที่ OpenClaw สามารถเชื่อมต่อได้
title: ช่องทางแชต
x-i18n:
    generated_at: "2026-04-23T05:26:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# ช่องทางแชต

OpenClaw สามารถพูดคุยกับคุณผ่านแอปแชตใดก็ได้ที่คุณใช้อยู่แล้ว แต่ละช่องทางเชื่อมต่อผ่าน Gateway
รองรับข้อความในทุกช่องทาง ส่วนสื่อและ reactions จะแตกต่างกันไปตามแต่ละช่องทาง

## ช่องทางที่รองรับ

- [BlueBubbles](/th/channels/bluebubbles) — **แนะนำสำหรับ iMessage**; ใช้ BlueBubbles macOS server REST API พร้อมการรองรับฟีเจอร์เต็มรูปแบบ (bundled plugin; แก้ไข ยกเลิกส่ง เอฟเฟ็กต์ reactions การจัดการกลุ่ม — การแก้ไขใช้งานไม่ได้อยู่ในขณะนี้บน macOS 26 Tahoe)
- [Discord](/th/channels/discord) — Discord Bot API + Gateway; รองรับเซิร์ฟเวอร์ channels และ DM
- [Feishu](/th/channels/feishu) — บอท Feishu/Lark ผ่าน WebSocket (bundled plugin)
- [Google Chat](/th/channels/googlechat) — แอป Google Chat API ผ่าน HTTP webhook
- [iMessage (legacy)](/th/channels/imessage) — การเชื่อมต่อ macOS รุ่นเดิมผ่าน imsg CLI (เลิกใช้แล้ว สำหรับการตั้งค่าใหม่ให้ใช้ BlueBubbles)
- [IRC](/th/channels/irc) — เซิร์ฟเวอร์ IRC แบบดั้งเดิม; channels + DM พร้อมการควบคุม pairing/allowlist
- [LINE](/th/channels/line) — บอท LINE Messaging API (bundled plugin)
- [Matrix](/th/channels/matrix) — โปรโตคอล Matrix (bundled plugin)
- [Mattermost](/th/channels/mattermost) — Bot API + WebSocket; channels กลุ่ม DM (bundled plugin)
- [Microsoft Teams](/th/channels/msteams) — Bot Framework; รองรับการใช้งานระดับองค์กร (bundled plugin)
- [Nextcloud Talk](/th/channels/nextcloud-talk) — แชตแบบ self-hosted ผ่าน Nextcloud Talk (bundled plugin)
- [Nostr](/th/channels/nostr) — DM แบบกระจายศูนย์ผ่าน NIP-04 (bundled plugin)
- [QQ Bot](/th/channels/qqbot) — QQ Bot API; แชตส่วนตัว แชตกลุ่ม และสื่อสมบูรณ์แบบ (bundled plugin)
- [Signal](/th/channels/signal) — signal-cli; เน้นความเป็นส่วนตัว
- [Slack](/th/channels/slack) — Bolt SDK; แอป workspace
- [Synology Chat](/th/channels/synology-chat) — Synology NAS Chat ผ่าน outgoing+incoming webhooks (bundled plugin)
- [Telegram](/th/channels/telegram) — Bot API ผ่าน grammY; รองรับกลุ่ม
- [Tlon](/th/channels/tlon) — โปรแกรมส่งข้อความแบบอิง Urbit (bundled plugin)
- [Twitch](/th/channels/twitch) — แชต Twitch ผ่านการเชื่อมต่อ IRC (bundled plugin)
- [Voice Call](/th/plugins/voice-call) — โทรศัพท์ผ่าน Plivo หรือ Twilio (Plugin ติดตั้งแยกต่างหาก)
- [WebChat](/web/webchat) — UI ของ Gateway WebChat ผ่าน WebSocket
- [WeChat](/th/channels/wechat) — Plugin Tencent iLink Bot ผ่านการล็อกอินด้วย QR; รองรับเฉพาะแชตส่วนตัว (external plugin)
- [WhatsApp](/th/channels/whatsapp) — ได้รับความนิยมมากที่สุด; ใช้ Baileys และต้องจับคู่ด้วย QR
- [Zalo](/th/channels/zalo) — Zalo Bot API; แอปส่งข้อความยอดนิยมของเวียดนาม (bundled plugin)
- [Zalo Personal](/th/channels/zalouser) — บัญชี Zalo ส่วนตัวผ่านการล็อกอินด้วย QR (bundled plugin)

## หมายเหตุ

- ช่องทางสามารถทำงานพร้อมกันได้; กำหนดค่าหลายช่องทางได้ และ OpenClaw จะจัดเส้นทางตามแต่ละแชต
- การตั้งค่าที่เร็วที่สุดมักเป็น **Telegram** (ใช้ bot token แบบง่าย) WhatsApp ต้องจับคู่ด้วย QR และ
  จัดเก็บสถานะบนดิสก์มากกว่า
- พฤติกรรมของกลุ่มจะแตกต่างกันไปตามช่องทาง; ดู [Groups](/th/channels/groups)
- มีการบังคับใช้ DM pairing และ allowlist เพื่อความปลอดภัย; ดู [Security](/th/gateway/security)
- การแก้ปัญหา: [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- ผู้ให้บริการโมเดลมีเอกสารแยกต่างหาก; ดู [Model Providers](/th/providers/models)
