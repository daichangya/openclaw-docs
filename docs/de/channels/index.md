---
read_when:
    - Sie möchten einen Chat-Kanal für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte Messaging-Plattformen
summary: Messaging-Plattformen, mit denen sich OpenClaw verbinden kann
title: Chat-Kanäle
x-i18n:
    generated_at: "2026-04-05T12:35:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# Chat-Kanäle

OpenClaw kann mit Ihnen in jeder Chat-App sprechen, die Sie bereits verwenden. Jeder Kanal verbindet sich über das Gateway.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Kanal.

## Unterstützte Kanäle

- [BlueBubbles](/channels/bluebubbles) — **Empfohlen für iMessage**; verwendet die REST-API des BlueBubbles-macOS-Servers mit vollständiger Funktionsunterstützung (gebündeltes Plugin; bearbeiten, zurückziehen, Effekte, Reaktionen, Gruppenverwaltung — Bearbeiten ist derzeit unter macOS 26 Tahoe defekt).
- [Discord](/channels/discord) — Discord Bot API + Gateway; unterstützt Server, Kanäle und DMs.
- [Feishu](/channels/feishu) — Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/channels/googlechat) — Google Chat API-App über HTTP-Webhook.
- [iMessage (legacy)](/channels/imessage) — Legacy-macOS-Integration über imsg CLI (veraltet, für neue Setups BlueBubbles verwenden).
- [IRC](/channels/irc) — Klassische IRC-Server; Kanäle + DMs mit Pairing-/Allowlist-Steuerung.
- [LINE](/channels/line) — LINE Messaging API-Bot (gebündeltes Plugin).
- [Matrix](/channels/matrix) — Matrix-Protokoll (gebündeltes Plugin).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; Kanäle, Gruppen, DMs (gebündeltes Plugin).
- [Microsoft Teams](/channels/msteams) — Bot Framework; Enterprise-Unterstützung (gebündeltes Plugin).
- [Nextcloud Talk](/channels/nextcloud-talk) — Selbstgehosteter Chat über Nextcloud Talk (gebündeltes Plugin).
- [Nostr](/channels/nostr) — Dezentrale DMs über NIP-04 (gebündeltes Plugin).
- [QQ Bot](/channels/qqbot) — QQ Bot API; privater Chat, Gruppenchat und Rich Media (gebündeltes Plugin).
- [Signal](/channels/signal) — signal-cli; datenschutzorientiert.
- [Slack](/channels/slack) — Bolt SDK; Workspace-Apps.
- [Synology Chat](/channels/synology-chat) — Synology NAS Chat über ausgehende + eingehende Webhooks (gebündeltes Plugin).
- [Telegram](/channels/telegram) — Bot API über grammY; unterstützt Gruppen.
- [Tlon](/channels/tlon) — Urbit-basierter Messenger (gebündeltes Plugin).
- [Twitch](/channels/twitch) — Twitch-Chat über IRC-Verbindung (gebündeltes Plugin).
- [Voice Call](/plugins/voice-call) — Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/web/webchat) — Gateway-WebChat-Benutzeroberfläche über WebSocket.
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — Tencent iLink Bot-Plugin über QR-Login; nur private Chats.
- [WhatsApp](/channels/whatsapp) — Am weitesten verbreitet; verwendet Baileys und erfordert QR-Pairing.
- [Zalo](/channels/zalo) — Zalo Bot API; Vietnams beliebter Messenger (gebündeltes Plugin).
- [Zalo Personal](/channels/zalouser) — Persönliches Zalo-Konto über QR-Login (gebündeltes Plugin).

## Hinweise

- Kanäle können gleichzeitig ausgeführt werden; konfigurieren Sie mehrere, und OpenClaw routet pro Chat.
- Die schnellste Einrichtung ist in der Regel **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Pairing und
  speichert mehr Status auf dem Datenträger.
- Das Gruppenverhalten variiert je nach Kanal; siehe [Groups](/channels/groups).
- DM-Pairing und Allowlists werden aus Sicherheitsgründen erzwungen; siehe [Security](/gateway/security).
- Fehlerbehebung: [Channel troubleshooting](/channels/troubleshooting).
- Modell-Provider sind separat dokumentiert; siehe [Model Providers](/providers/models).
