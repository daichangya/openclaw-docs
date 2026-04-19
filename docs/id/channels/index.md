---
read_when:
    - Anda ingin memilih saluran chat untuk OpenClaw
    - Anda memerlukan gambaran singkat tentang platform perpesanan yang didukung
summary: Platform perpesanan yang dapat dihubungkan oleh OpenClaw
title: Saluran Chat
x-i18n:
    generated_at: "2026-04-19T01:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# Saluran Chat

OpenClaw dapat berbicara dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap saluran terhubung melalui Gateway.
Teks didukung di semua tempat; media dan reaksi berbeda-beda tergantung salurannya.

## Saluran yang didukung

- [BlueBubbles](/id/channels/bluebubbles) — **Direkomendasikan untuk iMessage**; menggunakan REST API server BlueBubbles di macOS dengan dukungan fitur penuh (Plugin bawaan; edit, batal kirim, efek, reaksi, manajemen grup — edit saat ini rusak di macOS 26 Tahoe).
- [Discord](/id/channels/discord) — Discord Bot API + Gateway; mendukung server, saluran, dan DM.
- [Feishu](/id/channels/feishu) — bot Feishu/Lark melalui WebSocket (Plugin bawaan).
- [Google Chat](/id/channels/googlechat) — aplikasi Google Chat API melalui Webhook HTTP.
- [iMessage (legacy)](/id/channels/imessage) — integrasi macOS lama melalui CLI imsg (sudah usang, gunakan BlueBubbles untuk penyiapan baru).
- [IRC](/id/channels/irc) — server IRC klasik; saluran + DM dengan kontrol pairing/allowlist.
- [LINE](/id/channels/line) — bot LINE Messaging API (Plugin bawaan).
- [Matrix](/id/channels/matrix) — protokol Matrix (Plugin bawaan).
- [Mattermost](/id/channels/mattermost) — Bot API + WebSocket; saluran, grup, DM (Plugin bawaan).
- [Microsoft Teams](/id/channels/msteams) — Bot Framework; dukungan enterprise (Plugin bawaan).
- [Nextcloud Talk](/id/channels/nextcloud-talk) — chat yang di-host sendiri melalui Nextcloud Talk (Plugin bawaan).
- [Nostr](/id/channels/nostr) — DM terdesentralisasi melalui NIP-04 (Plugin bawaan).
- [QQ Bot](/id/channels/qqbot) — QQ Bot API; chat pribadi, chat grup, dan media kaya (Plugin bawaan).
- [Signal](/id/channels/signal) — signal-cli; berfokus pada privasi.
- [Slack](/id/channels/slack) — Bolt SDK; aplikasi workspace.
- [Synology Chat](/id/channels/synology-chat) — Synology NAS Chat melalui Webhook keluar+masuk (Plugin bawaan).
- [Telegram](/id/channels/telegram) — Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) — messenger berbasis Urbit (Plugin bawaan).
- [Twitch](/id/channels/twitch) — chat Twitch melalui koneksi IRC (Plugin bawaan).
- [Voice Call](/id/plugins/voice-call) — telepon melalui Plivo atau Twilio (plugin, dipasang terpisah).
- [WebChat](/web/webchat) — UI Gateway WebChat melalui WebSocket.
- [WeChat](/id/channels/wechat) — Plugin Tencent iLink Bot melalui login QR; hanya chat pribadi (plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) — Paling populer; menggunakan Baileys dan memerlukan pairing QR.
- [Zalo](/id/channels/zalo) — Zalo Bot API; messenger populer di Vietnam (Plugin bawaan).
- [Zalo Personal](/id/channels/zalouser) — akun pribadi Zalo melalui login QR (Plugin bawaan).

## Catatan

- Saluran dapat berjalan secara bersamaan; konfigurasikan beberapa saluran dan OpenClaw akan melakukan routing per chat.
- Penyiapan tercepat biasanya **Telegram** (token bot sederhana). WhatsApp memerlukan pairing QR dan
  menyimpan lebih banyak status di disk.
- Perilaku grup berbeda-beda tergantung saluran; lihat [Groups](/id/channels/groups).
- Pairing DM dan allowlist diterapkan untuk keamanan; lihat [Security](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah saluran](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Model Providers](/id/providers/models).
