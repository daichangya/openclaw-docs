---
read_when:
    - Anda ingin memilih saluran chat untuk OpenClaw
    - Anda memerlukan ikhtisar singkat tentang platform pesan yang didukung
summary: Platform pesan yang dapat dihubungkan oleh OpenClaw
title: Saluran chat
x-i18n:
    generated_at: "2026-04-25T13:41:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw dapat berbicara dengan Anda di aplikasi chat apa pun yang sudah Anda gunakan. Setiap saluran terhubung melalui Gateway.
Teks didukung di semua tempat; media dan reaksi bervariasi menurut saluran.

## Catatan pengiriman

- Balasan Telegram yang berisi sintaks gambar markdown, seperti `![alt](url)`,
  akan dikonversi menjadi balasan media pada jalur keluar akhir jika memungkinkan.
- DM multi-orang Slack dirutekan sebagai chat grup, sehingga kebijakan grup, perilaku mention,
  dan aturan sesi grup berlaku untuk percakapan MPIM.
- Penyiapan WhatsApp bersifat install-on-demand: onboarding dapat menampilkan alur penyiapan sebelum
  dependensi runtime Baileys disiapkan, dan Gateway memuat runtime WhatsApp
  hanya saat saluran tersebut benar-benar aktif.

## Saluran yang didukung

- [BlueBubbles](/id/channels/bluebubbles) — **Direkomendasikan untuk iMessage**; menggunakan REST API server macOS BlueBubbles dengan dukungan fitur lengkap (plugin bawaan; edit, batal kirim, efek, reaksi, manajemen grup — edit saat ini rusak di macOS 26 Tahoe).
- [Discord](/id/channels/discord) — Discord Bot API + Gateway; mendukung server, saluran, dan DM.
- [Feishu](/id/channels/feishu) — bot Feishu/Lark melalui WebSocket (plugin bawaan).
- [Google Chat](/id/channels/googlechat) — aplikasi Google Chat API melalui Webhook HTTP.
- [iMessage (legacy)](/id/channels/imessage) — integrasi macOS lawas melalui imsg CLI (sudah usang, gunakan BlueBubbles untuk penyiapan baru).
- [IRC](/id/channels/irc) — server IRC klasik; saluran + DM dengan kontrol pairing/allowlist.
- [LINE](/id/channels/line) — bot LINE Messaging API (plugin bawaan).
- [Matrix](/id/channels/matrix) — protokol Matrix (plugin bawaan).
- [Mattermost](/id/channels/mattermost) — Bot API + WebSocket; saluran, grup, DM (plugin bawaan).
- [Microsoft Teams](/id/channels/msteams) — Bot Framework; dukungan enterprise (plugin bawaan).
- [Nextcloud Talk](/id/channels/nextcloud-talk) — chat self-hosted melalui Nextcloud Talk (plugin bawaan).
- [Nostr](/id/channels/nostr) — DM terdesentralisasi melalui NIP-04 (plugin bawaan).
- [QQ Bot](/id/channels/qqbot) — QQ Bot API; chat privat, chat grup, dan media kaya (plugin bawaan).
- [Signal](/id/channels/signal) — signal-cli; berfokus pada privasi.
- [Slack](/id/channels/slack) — Bolt SDK; aplikasi workspace.
- [Synology Chat](/id/channels/synology-chat) — Synology NAS Chat melalui Webhook keluar+masuk (plugin bawaan).
- [Telegram](/id/channels/telegram) — Bot API melalui grammY; mendukung grup.
- [Tlon](/id/channels/tlon) — messenger berbasis Urbit (plugin bawaan).
- [Twitch](/id/channels/twitch) — chat Twitch melalui koneksi IRC (plugin bawaan).
- [Voice Call](/id/plugins/voice-call) — teleponi melalui Plivo atau Twilio (plugin, dipasang terpisah).
- [WebChat](/id/web/webchat) — UI Gateway WebChat melalui WebSocket.
- [WeChat](/id/channels/wechat) — plugin Tencent iLink Bot melalui login QR; hanya chat privat (plugin eksternal).
- [WhatsApp](/id/channels/whatsapp) — Paling populer; menggunakan Baileys dan memerlukan pairing QR.
- [Zalo](/id/channels/zalo) — Zalo Bot API; messenger populer di Vietnam (plugin bawaan).
- [Zalo Personal](/id/channels/zalouser) — akun pribadi Zalo melalui login QR (plugin bawaan).

## Catatan

- Saluran dapat berjalan secara bersamaan; konfigurasikan beberapa saluran dan OpenClaw akan merutekan per chat.
- Penyiapan tercepat biasanya adalah **Telegram** (token bot sederhana). WhatsApp memerlukan pairing QR dan
  menyimpan lebih banyak status di disk.
- Perilaku grup bervariasi menurut saluran; lihat [Groups](/id/channels/groups).
- Pairing DM dan allowlist diberlakukan demi keamanan; lihat [Security](/id/gateway/security).
- Pemecahan masalah: [Pemecahan masalah saluran](/id/channels/troubleshooting).
- Penyedia model didokumentasikan secara terpisah; lihat [Model Providers](/id/providers/models).
