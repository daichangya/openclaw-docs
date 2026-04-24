---
read_when:
    - Sie möchten einen Chat-Channel für OpenClaw auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte Messaging-Plattformen
summary: Messaging-Plattformen, mit denen OpenClaw sich verbinden kann
title: Chat-Channel
x-i18n:
    generated_at: "2026-04-24T06:27:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw kann mit Ihnen in jeder Chat-App kommunizieren, die Sie bereits verwenden. Jeder Channel wird über das Gateway verbunden.
Text wird überall unterstützt; Medien und Reaktionen variieren je nach Channel.

## Unterstützte Channel

- [BlueBubbles](/de/channels/bluebubbles) — **Empfohlen für iMessage**; verwendet die BlueBubbles-macOS-Server-REST-API mit vollständiger Funktionsunterstützung (gebündeltes Plugin; Bearbeiten, Zurückziehen, Effekte, Reaktionen, Gruppenverwaltung — Bearbeiten ist derzeit unter macOS 26 Tahoe defekt).
- [Discord](/de/channels/discord) — Discord Bot API + Gateway; unterstützt Server, Channel und DMs.
- [Feishu](/de/channels/feishu) — Feishu/Lark-Bot über WebSocket (gebündeltes Plugin).
- [Google Chat](/de/channels/googlechat) — Google Chat API-App über HTTP-Webhook.
- [iMessage (legacy)](/de/channels/imessage) — Legacy-macOS-Integration über imsg CLI (veraltet, für neue Setups BlueBubbles verwenden).
- [IRC](/de/channels/irc) — Klassische IRC-Server; Channel + DMs mit Pairing-/Allowlist-Kontrollen.
- [LINE](/de/channels/line) — LINE Messaging API-Bot (gebündeltes Plugin).
- [Matrix](/de/channels/matrix) — Matrix-Protokoll (gebündeltes Plugin).
- [Mattermost](/de/channels/mattermost) — Bot API + WebSocket; Channel, Gruppen, DMs (gebündeltes Plugin).
- [Microsoft Teams](/de/channels/msteams) — Bot Framework; Enterprise-Unterstützung (gebündeltes Plugin).
- [Nextcloud Talk](/de/channels/nextcloud-talk) — Selbstgehosteter Chat über Nextcloud Talk (gebündeltes Plugin).
- [Nostr](/de/channels/nostr) — Dezentrale DMs über NIP-04 (gebündeltes Plugin).
- [QQ Bot](/de/channels/qqbot) — QQ Bot API; privater Chat, Gruppenchat und Rich Media (gebündeltes Plugin).
- [Signal](/de/channels/signal) — signal-cli; datenschutzorientiert.
- [Slack](/de/channels/slack) — Bolt SDK; Workspace-Apps.
- [Synology Chat](/de/channels/synology-chat) — Synology NAS Chat über ausgehende + eingehende Webhooks (gebündeltes Plugin).
- [Telegram](/de/channels/telegram) — Bot API über grammY; unterstützt Gruppen.
- [Tlon](/de/channels/tlon) — Urbit-basierter Messenger (gebündeltes Plugin).
- [Twitch](/de/channels/twitch) — Twitch-Chat über IRC-Verbindung (gebündeltes Plugin).
- [Voice Call](/de/plugins/voice-call) — Telefonie über Plivo oder Twilio (Plugin, separat installiert).
- [WebChat](/de/web/webchat) — Gateway-WebChat-Benutzeroberfläche über WebSocket.
- [WeChat](/de/channels/wechat) — Tencent-iLink-Bot-Plugin über QR-Login; nur private Chats (externes Plugin).
- [WhatsApp](/de/channels/whatsapp) — Am weitesten verbreitet; verwendet Baileys und erfordert QR-Pairing.
- [Zalo](/de/channels/zalo) — Zalo Bot API; Vietnams beliebter Messenger (gebündeltes Plugin).
- [Zalo Personal](/de/channels/zalouser) — Persönliches Zalo-Konto über QR-Login (gebündeltes Plugin).

## Hinweise

- Channel können gleichzeitig ausgeführt werden; konfigurieren Sie mehrere, und OpenClaw routet pro Chat.
- Das schnellste Setup ist in der Regel **Telegram** (einfaches Bot-Token). WhatsApp erfordert QR-Pairing und
  speichert mehr Zustand auf der Festplatte.
- Das Gruppenverhalten variiert je nach Channel; siehe [Gruppen](/de/channels/groups).
- DM-Pairing und Allowlists werden aus Sicherheitsgründen erzwungen; siehe [Sicherheit](/de/gateway/security).
- Fehlerbehebung: [Fehlerbehebung für Channel](/de/channels/troubleshooting).
- Modellanbieter sind separat dokumentiert; siehe [Modellanbieter](/de/providers/models).
